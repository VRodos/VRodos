(function () {
    "use strict";

    const RAYCAST_TARGET_CLASS = "vrodos-overlay-hit-target";
    const OVERLAY_RENDER_BASE = 100000;
    const OVERLAY_FLAG_RETRY_FRAMES = 16;
    const OVERLAY_DIAGNOSTIC_LIMIT = 160;
    const SPATIAL_UI_BUNDLE_FILE = "vrodos-runtime-spatial-ui.bundle.js";
    const SCENE_RAY_HIT_DOT_RENDER_ORDER = OVERLAY_RENDER_BASE - 20;
    const SCENE_RAY_HIT_DOT_RADIUS = 0.035;
    const SCENE_RAY_HIT_DOT_COLOR = 0xffc857;
    const CONTROLLER_RAY_READY_STABLE_FRAMES = 3;
    const CONTROLLER_RAY_EPSILON = 0.000001;
    const RAYCASTER_SELECTORS = [
        "#cursor",
        "#oculusRight",
        "#oculusLeft",
        "[laser-controls][raycaster]",
        "[meta-touch-controls][raycaster]",
        "[oculus-touch-controls][raycaster]",
        "[raycaster]"
    ];
    const SCENE_CONTROL_SUPPRESSION_SELECTORS = [
        "[vrodos-3d-play-icon]",
        "[id^='video-playhint_']"
    ];
    let spatialUiRuntimePromise = null;
    let sceneRayFeedbackComponentRegistered = false;
    const sceneRayFeedbackOwners = new Set();

    function diagnosticsStore() {
        window.__vrodosRuntimeOverlayDiagnostics = window.__vrodosRuntimeOverlayDiagnostics || [];
        return window.__vrodosRuntimeOverlayDiagnostics;
    }

    function isDiagnosticLoggingEnabled() {
        return Boolean(window.VRODOS_RUNTIME_OVERLAY_DEBUG || window.VRODOS_SPATIAL_UI_DEBUG);
    }

    function recordDiagnostic(level, message, details) {
        const entry = {
            time: Date.now(),
            level: level || "info",
            message: message || "",
            details: details || {}
        };
        const store = diagnosticsStore();
        store.push(entry);
        while (store.length > OVERLAY_DIAGNOSTIC_LIMIT) {
            store.shift();
        }

        if (!isDiagnosticLoggingEnabled() && entry.level !== "warn" && entry.level !== "error") {
            return entry;
        }

        const logger = console[entry.level] || console.log;
        if (typeof logger === "function") {
            logger.call(console, "[VRodos overlay]", entry.message, entry.details);
        }
        return entry;
    }

    function describeElement(el) {
        if (!el) {
            return null;
        }

        return {
            tagName: el.tagName ? String(el.tagName).toLowerCase() : "",
            id: el.id || "",
            className: el.className && typeof el.className === "string" ? el.className : "",
            connected: Boolean(el.isConnected),
            hasObject3D: Boolean(el.object3D)
        };
    }

    function queryScene() {
        const byId = document.getElementById("aframe-scene-container");
        if (byId && byId.tagName && String(byId.tagName).toLowerCase() === "a-scene") {
            return byId;
        }
        return (byId && byId.querySelector && byId.querySelector("a-scene")) || document.querySelector("a-scene");
    }

    function queryCamera() {
        const scene = queryScene();
        return document.getElementById("cameraA") ||
            (scene && scene.camera && scene.camera.el) ||
            document.querySelector("[camera]") ||
            document.querySelector("a-camera");
    }

    function createControllerRayReadinessApi() {
        const states = new Map();
        const controllerListenerElements = new WeakSet();
        let sceneListenersAttachedTo = null;
        let sessionListenersAttachedTo = null;

        function stateForHand(hand) {
            const key = hand || "unknown";
            if (!states.has(key)) {
                states.set(key, {
                    stableFrames: 0,
                    lastReadyCandidate: false,
                    lastStableFrameAt: 0,
                    lastDirtyReason: "init",
                    lastDirtyAt: Date.now()
                });
            }
            return states.get(key);
        }

        function markDirty(reason, hand) {
            const resetState = (state) => {
                state.stableFrames = 0;
                state.lastReadyCandidate = false;
                state.lastStableFrameAt = 0;
                state.lastDirtyReason = reason || "dirty";
                state.lastDirtyAt = Date.now();
            };

            if (hand) {
                resetState(stateForHand(hand));
                return;
            }

            ["left", "right", "unknown"].forEach((key) => resetState(stateForHand(key)));
        }

        function resolveHand(el) {
            if (!el) {
                return "";
            }
            const id = el.id || "";
            if (/right/i.test(id)) {
                return "right";
            }
            if (/left/i.test(id)) {
                return "left";
            }
            const componentNames = ["tracked-controls", "meta-touch-controls", "oculus-touch-controls", "laser-controls"];
            for (let i = 0; i < componentNames.length; i += 1) {
                const component = el.components && el.components[componentNames[i]];
                const hand = component && component.data && component.data.hand;
                if (hand === "left" || hand === "right") {
                    return hand;
                }
            }
            const attrs = ["tracked-controls", "meta-touch-controls", "oculus-touch-controls", "laser-controls"];
            for (let i = 0; i < attrs.length; i += 1) {
                const value = el.getAttribute && el.getAttribute(attrs[i]);
                const hand = value && typeof value === "object" ? value.hand : "";
                if (hand === "left" || hand === "right") {
                    return hand;
                }
            }
            return "";
        }

        function currentInputSources(scene) {
            const xr = scene && scene.renderer && scene.renderer.xr;
            const session = xr && typeof xr.getSession === "function" ? xr.getSession() : null;
            return session && session.inputSources ? Array.from(session.inputSources) : [];
        }

        function resolvePhysicalInputSource(scene, hand) {
            const inputSources = currentInputSources(scene);
            for (let i = 0; i < inputSources.length; i += 1) {
                const source = inputSources[i];
                if (!source || (hand && source.handedness && source.handedness !== hand)) {
                    continue;
                }
                if (source.targetRayMode === "tracked-pointer" && (source.gamepad || source.gripSpace)) {
                    return { source, inputSources };
                }
            }
            return { source: null, inputSources };
        }

        function componentSummary(component) {
            if (!component) {
                return {
                    present: false,
                    controllerPresent: false,
                    controllerConnected: false,
                    hasController: false,
                    hasPose: false,
                    modelReady: false,
                    dataController: null
                };
            }

            const dataController = component.data && Number(component.data.controller);
            return {
                present: true,
                controllerPresent: component.controllerPresent === true,
                controllerConnected: component.controllerConnected === true,
                hasController: Boolean(component.controller),
                hasPose: Boolean(component.pose),
                modelReady: component.modelReady === true || Boolean(component.controllerObject3D),
                dataController: Number.isFinite(dataController) ? dataController : null
            };
        }

        function countLineObjects(el) {
            let count = 0;
            if (!el || !el.object3D || typeof el.object3D.traverse !== "function") {
                return count;
            }
            el.object3D.traverse((object) => {
                if (object && (object.isLine || object.isLineSegments || object.type === "Line" || object.type === "LineSegments")) {
                    count += 1;
                }
            });
            return count;
        }

        function vectorLengthSq(vector) {
            if (!vector) {
                return 0;
            }
            if (typeof vector.lengthSq === "function") {
                return vector.lengthSq();
            }
            const x = Number(vector.x) || 0;
            const y = Number(vector.y) || 0;
            const z = Number(vector.z) || 0;
            return x * x + y * y + z * z;
        }

        function describeVector(vector) {
            if (!vector) {
                return null;
            }
            const round = (value) => Math.round((Number(value) || 0) * 10000) / 10000;
            return {
                x: round(vector.x),
                y: round(vector.y),
                z: round(vector.z)
            };
        }

        function resolveRayInfo(el) {
            const raycasterComponent = el && el.components && el.components.raycaster;
            const raycaster = raycasterComponent && raycasterComponent.raycaster;
            const ray = raycaster && raycaster.ray;
            const data = raycasterComponent && raycasterComponent.data;
            const rayDirectionValid = Boolean(ray && ray.direction && vectorLengthSq(ray.direction) > CONTROLLER_RAY_EPSILON);
            const dataDirectionValid = Boolean(data && data.direction && vectorLengthSq(data.direction) > CONTROLLER_RAY_EPSILON);
            return {
                hasComponent: Boolean(raycasterComponent),
                hasRaycaster: Boolean(raycaster),
                rayDirectionValid,
                dataDirectionValid,
                showLine: Boolean(data && data.showLine),
                far: raycaster && Number.isFinite(Number(raycaster.far)) ? Number(raycaster.far) : null,
                rayOrigin: ray ? describeVector(ray.origin) : null,
                rayDirection: ray ? describeVector(ray.direction) : null,
                dataOrigin: data ? describeVector(data.origin) : null,
                dataDirection: data ? describeVector(data.direction) : null
            };
        }

        function resolveComponentInfo(el) {
            const components = el && el.components || {};
            return {
                tracked: componentSummary(components["tracked-controls"]),
                meta: componentSummary(components["meta-touch-controls"]),
                oculus: componentSummary(components["oculus-touch-controls"]),
                laser: componentSummary(components["laser-controls"]),
                generic: componentSummary(components["generic-tracked-controller-controls"])
            };
        }

        function componentStackReady(info) {
            const trackedPoseReady = info.tracked.present && info.tracked.hasController && info.tracked.hasPose;
            const controllerPresent = info.meta.controllerPresent ||
                info.oculus.controllerPresent ||
                info.generic.controllerPresent ||
                info.tracked.controllerPresent ||
                (Number.isFinite(info.tracked.dataController) && info.tracked.dataController >= 0);
            const modelReady = !info.laser.present ||
                info.laser.modelReady ||
                info.meta.modelReady ||
                info.oculus.modelReady ||
                info.generic.modelReady;
            return {
                ready: Boolean(trackedPoseReady && controllerPresent && modelReady),
                trackedPoseReady,
                controllerPresent,
                modelReady
            };
        }

        function controllerReason(inputSource, rayInfo, stack) {
            if (!inputSource) {
                return "waiting-webxr-input-source";
            }
            if (!stack.trackedPoseReady) {
                return "waiting-tracked-controls-pose";
            }
            if (!stack.controllerPresent) {
                return "waiting-aframe-controller-present";
            }
            if (!stack.modelReady) {
                return "waiting-controller-model-ready";
            }
            if (!rayInfo.hasComponent || !rayInfo.hasRaycaster || !rayInfo.rayDirectionValid || !rayInfo.dataDirectionValid) {
                return "waiting-raycaster-ray";
            }
            return "warming-controller-ray";
        }

        function ensureSceneListeners(scene) {
            if (!scene || sceneListenersAttachedTo === scene) {
                return;
            }
            if (sceneListenersAttachedTo && sceneListenersAttachedTo.removeEventListener) {
                ["enter-vr", "exit-vr", "controllersupdated"].forEach((eventName) => {
                    sceneListenersAttachedTo.removeEventListener(eventName, markAllDirtyFromEvent);
                });
            }
            sceneListenersAttachedTo = scene;
            ["enter-vr", "exit-vr", "controllersupdated"].forEach((eventName) => {
                scene.addEventListener(eventName, markAllDirtyFromEvent);
            });
        }

        function markAllDirtyFromEvent(event) {
            markDirty(event && event.type || "scene-event");
        }

        function ensureSessionListener(scene) {
            const xr = scene && scene.renderer && scene.renderer.xr;
            const session = xr && typeof xr.getSession === "function" ? xr.getSession() : null;
            if (!session || sessionListenersAttachedTo === session) {
                return;
            }
            if (sessionListenersAttachedTo && sessionListenersAttachedTo.removeEventListener) {
                sessionListenersAttachedTo.removeEventListener("inputsourceschange", markAllDirtyFromEvent);
            }
            sessionListenersAttachedTo = session;
            session.addEventListener("inputsourceschange", markAllDirtyFromEvent);
        }

        function ensureControllerListeners(el) {
            if (!el || controllerListenerElements.has(el) || !el.addEventListener) {
                return;
            }
            controllerListenerElements.add(el);
            ["controllerconnected", "controllerdisconnected", "controllermodelready"].forEach((eventName) => {
                el.addEventListener(eventName, (event) => {
                    const detailName = event && event.detail && event.detail.name || "";
                    markDirty(`${eventName}${detailName ? `:${detailName}` : ""}`, resolveHand(el));
                });
            });
        }

        function resolve(controllerEl, options) {
            const scene = controllerEl && controllerEl.sceneEl || queryScene();
            ensureSceneListeners(scene);
            ensureSessionListener(scene);
            ensureControllerListeners(controllerEl);

            const hand = resolveHand(controllerEl);
            const state = stateForHand(hand);
            const stableFrameTarget = Math.max(1, Number(options && options.requiredStableFrames) || CONTROLLER_RAY_READY_STABLE_FRAMES);
            const input = resolvePhysicalInputSource(scene, hand);
            const rayInfo = resolveRayInfo(controllerEl);
            const components = resolveComponentInfo(controllerEl);
            const stack = componentStackReady(components);
            const lineCount = countLineObjects(controllerEl);
            const candidateReady = Boolean(input.source &&
                stack.ready &&
                rayInfo.hasComponent &&
                rayInfo.hasRaycaster &&
                rayInfo.rayDirectionValid &&
                rayInfo.dataDirectionValid);

            const now = Date.now();
            if (candidateReady) {
                if (!state.lastReadyCandidate || now - state.lastStableFrameAt > 8) {
                    state.stableFrames += 1;
                    state.lastStableFrameAt = now;
                }
            } else {
                state.stableFrames = 0;
                state.lastStableFrameAt = 0;
            }
            state.lastReadyCandidate = candidateReady;

            const ready = candidateReady && state.stableFrames >= stableFrameTarget;
            const status = {
                ready,
                candidateReady,
                phase: ready ? "ready" : "waiting",
                reason: ready ? "stable-controller-ray" : controllerReason(input.source, rayInfo, stack),
                hand,
                stableFrames: state.stableFrames,
                requiredStableFrames: stableFrameTarget,
                inputSourceCount: input.inputSources.length,
                inputSource: input.source ? {
                    handedness: input.source.handedness || "",
                    targetRayMode: input.source.targetRayMode || "",
                    hasGamepad: Boolean(input.source.gamepad),
                    hasGripSpace: Boolean(input.source.gripSpace),
                    hasTargetRaySpace: Boolean(input.source.targetRaySpace),
                    profiles: Array.from(input.source.profiles || [])
                } : null,
                ray: rayInfo,
                components,
                stack,
                lineCount,
                objectVisible: Boolean(controllerEl && controllerEl.object3D && controllerEl.object3D.visible),
                lastDirtyReason: state.lastDirtyReason,
                lastDirtyAt: state.lastDirtyAt,
                timestamp: now
            };

            window.__vrodosLastControllerRayReadiness = window.__vrodosLastControllerRayReadiness || {};
            window.__vrodosLastControllerRayReadiness[hand || "unknown"] = status;
            return status;
        }

        function reset() {
            states.clear();
            markDirty("reset");
        }

        return {
            markDirty,
            resolve,
            reset
        };
    }

    window.VRODOSControllerRayReadiness = window.VRODOSControllerRayReadiness || createControllerRayReadinessApi();

    function isImmersiveVrActive() {
        const scene = queryScene();
        const xr = scene && scene.renderer && scene.renderer.xr;
        if (xr && xr.isPresenting) {
            return true;
        }
        if (xr && typeof xr.getSession === "function" && xr.getSession()) {
            return true;
        }
        return Boolean(scene && scene.is && scene.is("vr-mode") && !isDocumentFullscreenActive());
    }

    function isDocumentFullscreenActive() {
        return Boolean(document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement);
    }

    function getPresentationMode() {
        if (isImmersiveVrActive()) {
            return "immersive-xr";
        }

        const scene = queryScene();
        if (isDocumentFullscreenActive() || (scene && scene.is && scene.is("vr-mode"))) {
            return "desktop-fullscreen";
        }

        return "inline";
    }

    function setAttributeEnabled(el, attrName, enabled) {
        if (!el) {
            return;
        }

        const hasComponent = Boolean(el.components && el.components[attrName]);
        const hasAttribute = el.hasAttribute && el.hasAttribute(attrName);
        if (!hasComponent && !hasAttribute) {
            return;
        }

        if (hasComponent) {
            if (enabled && typeof el.components[attrName].play === "function") {
                el.components[attrName].play();
            } else if (!enabled && typeof el.components[attrName].pause === "function") {
                el.components[attrName].pause();
            }
        }

        if (attrName === "custom-movement") {
            return;
        }

        el.setAttribute(attrName, "enabled: " + (enabled ? "true" : "false"));
    }

    function parseComponentAttribute(value) {
        const parsed = {};
        if (!value) {
            return parsed;
        }

        if (typeof value === "object") {
            Object.keys(value).forEach((key) => {
                parsed[key] = value[key];
            });
            return parsed;
        }

        String(value).split(";").forEach((part) => {
            const index = part.indexOf(":");
            if (index === -1) {
                return;
            }
            const key = part.slice(0, index).trim();
            const attrValue = part.slice(index + 1).trim();
            if (key) {
                parsed[key] = attrValue;
            }
        });
        return parsed;
    }

    function refreshRaycasterObjects() {
        collectRaycasters().forEach((el) => {
            if (el.components && el.components.raycaster && typeof el.components.raycaster.refreshObjects === "function") {
                el.components.raycaster.refreshObjects();
            }
        });
    }

    function queueRaycasterRefresh(frames) {
        let remaining = Number.isFinite(Number(frames)) ? Number(frames) : OVERLAY_FLAG_RETRY_FRAMES;
        const refresh = function () {
            refreshRaycasterObjects();
            remaining -= 1;
            if (remaining > 0) {
                requestAnimationFrame(refresh);
            }
        };
        requestAnimationFrame(refresh);
    }

    function collectRaycasters() {
        const seen = new Set();
        const result = [];
        RAYCASTER_SELECTORS.forEach((selector) => {
            document.querySelectorAll(selector).forEach((el) => {
                if (seen.has(el)) {
                    return;
                }
                seen.add(el);
                result.push(el);
            });
        });

        return result;
    }

    function getRaycasterDiagnostics() {
        return collectRaycasters().map((el) => {
            const attr = parseComponentAttribute(el.getAttribute("raycaster"));
            return Object.assign(describeElement(el) || {}, {
                selector: attr.objects || "",
                enabled: String(attr.enabled || "true") !== "false",
                hasComponent: Boolean(el.components && el.components.raycaster)
            });
        });
    }

    function getThreeRuntime() {
        return window.THREE || (window.AFRAME && window.AFRAME.THREE) || null;
    }

    function getSpatialUiApi() {
        const spatialUi = window.VRODOSSpatialUI || null;
        return spatialUi &&
            typeof spatialUi.isAvailable === "function" &&
            spatialUi.isAvailable()
            ? spatialUi
            : null;
    }

    function spatialUiBundleScriptUrl() {
        const existing = Array.from(document.scripts || []).find((script) => {
            const src = script && script.getAttribute && (script.getAttribute("src") || "");
            return src.indexOf(SPATIAL_UI_BUNDLE_FILE) !== -1;
        });
        if (existing && existing.src) {
            return existing.src;
        }

        const runtimeScript = Array.from(document.scripts || []).find((script) => {
            const src = script && script.src || "";
            return src.indexOf("/js/master/lib/") !== -1 ||
                src.indexOf("/assets/js/runtime/master/lib/") !== -1 ||
                src.indexOf("vrodos-runtime-scene-components.bundle.js") !== -1 ||
                src.indexOf("vrodos-runtime-core.bundle.js") !== -1;
        });
        if (runtimeScript && runtimeScript.src) {
            try {
                return new URL(SPATIAL_UI_BUNDLE_FILE, runtimeScript.src).toString();
            } catch (_error) {}
        }

        if (window.VRODOS_PLUGIN_URL) {
            try {
                return new URL("assets/js/runtime/master/lib/" + SPATIAL_UI_BUNDLE_FILE, window.VRODOS_PLUGIN_URL).toString();
            } catch (_error) {}
        }

        try {
            return new URL("js/master/lib/" + SPATIAL_UI_BUNDLE_FILE, window.location.href).toString();
        } catch (_error) {
            return "js/master/lib/" + SPATIAL_UI_BUNDLE_FILE;
        }
    }

    function waitForSpatialUiRuntime(timeoutMs) {
        const started = performance.now();
        const timeout = Number(timeoutMs) || 6000;
        return new Promise((resolve) => {
            const check = () => {
                if (getSpatialUiApi()) {
                    resolve(true);
                    return;
                }
                if (performance.now() - started >= timeout) {
                    resolve(false);
                    return;
                }
                window.setTimeout(check, 80);
            };
            check();
        });
    }

    function ensureSpatialUiRuntime(options) {
        if (getSpatialUiApi()) {
            return Promise.resolve(true);
        }

        if (spatialUiRuntimePromise) {
            return spatialUiRuntimePromise;
        }

        const url = spatialUiBundleScriptUrl();
        spatialUiRuntimePromise = new Promise((resolve) => {
            const existing = Array.from(document.scripts || []).find((script) => {
                const src = script && script.getAttribute && (script.getAttribute("src") || "");
                return src.indexOf(SPATIAL_UI_BUNDLE_FILE) !== -1;
            });
            const finish = () => {
                waitForSpatialUiRuntime(options && options.timeoutMs || 6000).then((available) => {
                    recordDiagnostic(available ? "debug" : "warn", "Spatial UI runtime availability after load attempt.", {
                        available,
                        hasGlobal: Boolean(window.VRODOSSpatialUI),
                        url
                    });
                    if (!available) {
                        spatialUiRuntimePromise = null;
                    }
                    resolve(available);
                });
            };

            if (existing) {
                recordDiagnostic("debug", "Waiting for existing spatial UI runtime script.", {
                    url: existing.src || url
                });
                finish();
                return;
            }

            const script = document.createElement("script");
            script.src = url;
            script.async = false;
            script.defer = false;
            script.setAttribute("data-vrodos-spatial-ui-runtime", "true");
            script.onload = finish;
            script.onerror = function () {
                recordDiagnostic("error", "Failed to load spatial UI runtime bundle.", { url });
                spatialUiRuntimePromise = null;
                resolve(false);
            };
            recordDiagnostic("debug", "Injecting spatial UI runtime bundle.", { url });
            (document.head || document.documentElement || document.body).appendChild(script);
        });

        return spatialUiRuntimePromise;
    }

    function prewarmSpatialUiRuntime(options) {
        return ensureSpatialUiRuntime(options || {}).then((available) => {
            const spatialUi = getSpatialUiApi();
            if (available && spatialUi && typeof spatialUi.prewarm === "function") {
                return Promise.resolve(spatialUi.prewarm()).then((fontsReady) => {
                    recordDiagnostic(fontsReady === false ? "warn" : "debug", "Prewarmed spatial UI runtime.", {
                        hasSpatialUi: true,
                        fontsReady: fontsReady !== false
                    });
                    return true;
                }).catch((error) => {
                    recordDiagnostic("warn", "Spatial UI runtime prewarm failed; continuing with runtime fallback.", {
                        hasSpatialUi: true,
                        error: error && error.message || String(error)
                    });
                    return true;
                });
            }
            return available;
        });
    }

    function shouldPreloadSpatialUiRuntime() {
        if (window.VRODOS_DISABLE_SPATIAL_UI_PRELOAD === true) {
            return false;
        }
        return Boolean(document.querySelector([
            "[immerse-assessment-launcher]",
            "[data-assessment-content]",
            "[info-panel]",
            "[id^='button_poi_']",
            "[immerse-cefr-asset]",
            "[data-immerse-cefr-levels]"
        ].join(",")));
    }

    function maybePreloadSpatialUiRuntime() {
        if (!shouldPreloadSpatialUiRuntime()) {
            return;
        }
        prewarmSpatialUiRuntime({ timeoutMs: 8000 }).then((available) => {
            recordDiagnostic(available ? "debug" : "warn", "Spatial UI preload completed.", {
                available
            });
        });
    }

    function getSceneDiagnostics() {
        const scene = queryScene();
        const camera = queryCamera();
        return {
            presentationMode: getPresentationMode(),
            scene: describeElement(scene),
            sceneLoaded: Boolean(scene && scene.hasLoaded),
            renderer: Boolean(scene && scene.renderer),
            xrPresenting: isImmersiveVrActive(),
            vrModeFlag: Boolean(scene && scene.is && scene.is("vr-mode")),
            camera: describeElement(camera),
            raycasters: getRaycasterDiagnostics()
        };
    }

    function normalizeVrControllerEntities() {
        const realControllers = [
            document.querySelector("#oculusLeft"),
            document.querySelector("#oculusRight")
        ].filter(Boolean);

        realControllers.forEach((el) => {
            if (el.hasAttribute && el.hasAttribute("blink-controls")) {
                el.removeAttribute("blink-controls");
            }
            if (el.hasAttribute && el.hasAttribute("visible")) {
                el.removeAttribute("visible");
            }
        });
    }

    function controllerClickBridgeTargets() {
        const selectors = [
            "#oculusRight",
            "#oculusLeft",
            "[laser-controls][raycaster]",
            "[meta-touch-controls][raycaster]",
            "[oculus-touch-controls][raycaster]"
        ];
        const seen = new Set();
        const targets = [];
        selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((el) => {
                if (!el || seen.has(el)) {
                    return;
                }
                seen.add(el);
                targets.push(el);
            });
        });
        return targets;
    }

    function isControllerClickTarget(el) {
        return Boolean(el &&
            el.isConnected &&
            el.classList &&
            el.classList.contains("raycastable"));
    }

    function targetFromIntersection(intersection) {
        let object = intersection && intersection.object;
        while (object) {
            const el = object.el || null;
            if (isControllerClickTarget(el)) {
                return el;
            }
            if (el && typeof el.closest === "function") {
                const closest = el.closest(".raycastable");
                if (isControllerClickTarget(closest)) {
                    return closest;
                }
            }
            object = object.parent;
        }
        return null;
    }

    function isElementVisibleForControllerClick(el) {
        if (!isControllerClickTarget(el)) {
            return false;
        }
        if (el.getAttribute && el.getAttribute("visible") === "false") {
            return false;
        }
        let object = el.object3D || null;
        while (object) {
            if (object.visible === false) {
                return false;
            }
            object = object.parent;
        }
        return true;
    }

    function collectControllerClickRoots() {
        const seen = new Set();
        const roots = [];
        document.querySelectorAll(".raycastable").forEach((el) => {
            if (!isElementVisibleForControllerClick(el) || !el.object3D || seen.has(el.object3D)) {
                return;
            }
            seen.add(el.object3D);
            roots.push(el.object3D);
        });
        return roots;
    }

    function currentNativeControllerIntersection(controllerObject) {
        const THREE = getThreeRuntime();
        const scene = queryScene();
        if (!THREE || !scene || !scene.object3D || !controllerObject) {
            return null;
        }

        const roots = collectControllerClickRoots();
        if (!roots.length) {
            return null;
        }

        scene.object3D.updateMatrixWorld(true);
        controllerObject.updateMatrixWorld(true);

        const raycaster = new THREE.Raycaster();
        const origin = new THREE.Vector3();
        const direction = new THREE.Vector3(0, 0, -1);
        const rotation = new THREE.Matrix4();
        origin.setFromMatrixPosition(controllerObject.matrixWorld);
        rotation.extractRotation(controllerObject.matrixWorld);
        direction.applyMatrix4(rotation).normalize();
        raycaster.set(origin, direction);
        raycaster.far = 1000;

        const intersections = raycaster.intersectObjects(roots, true);
        for (let index = 0; index < intersections.length; index += 1) {
            const target = targetFromIntersection(intersections[index]);
            if (target) {
                return {
                    target,
                    intersection: intersections[index],
                    intersections
                };
            }
        }
        return null;
    }

    function currentControllerIntersection(controllerEl) {
        const raycaster = controllerEl &&
            controllerEl.components &&
            controllerEl.components.raycaster;
        if (!raycaster) {
            return null;
        }

        const intersections = Array.isArray(raycaster.intersections) ? raycaster.intersections : [];
        for (let index = 0; index < intersections.length; index += 1) {
            const target = targetFromIntersection(intersections[index]);
            if (target) {
                return {
                    target,
                    intersection: intersections[index],
                    intersections
                };
            }
        }

        const intersectedEls = Array.isArray(raycaster.intersectedEls) ? raycaster.intersectedEls : [];
        for (let index = 0; index < intersectedEls.length; index += 1) {
            if (isControllerClickTarget(intersectedEls[index])) {
                return {
                    target: intersectedEls[index],
                    intersection: null,
                    intersections
                };
            }
        }

        return null;
    }

    function sceneRayFeedbackAllowed() {
        const overlayApi = window.VRODOSRuntimeOverlay || null;
        return window.VRODOS_DISABLE_SCENE_RAY_HIT_DOTS !== true &&
            getPresentationMode() === "immersive-xr" &&
            !hasSpatialModalOpen();
    }

    function sceneRayHitPoint(hit) {
        const point = hit &&
            hit.intersection &&
            hit.intersection.point;
        return point && typeof point.clone === "function"
            ? point.clone()
            : null;
    }

    function ensureSceneRayHitMarker(owner) {
        const THREE = getThreeRuntime();
        const scene = queryScene();
        if (!THREE || !scene || !scene.object3D || !owner) {
            return null;
        }
        if (owner.__vrodosSceneRayHitMarker) {
            return owner.__vrodosSceneRayHitMarker;
        }

        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(SCENE_RAY_HIT_DOT_RADIUS, 18, 12),
            new THREE.MeshBasicMaterial({
                color: SCENE_RAY_HIT_DOT_COLOR,
                transparent: true,
                opacity: 0.95,
                depthTest: false,
                depthWrite: false
            })
        );
        marker.name = "VRODOSSceneRayHitDot";
        marker.renderOrder = SCENE_RAY_HIT_DOT_RENDER_ORDER;
        marker.frustumCulled = false;
        marker.visible = false;
        scene.object3D.add(marker);
        owner.__vrodosSceneRayHitMarker = marker;
        sceneRayFeedbackOwners.add(owner);
        return marker;
    }

    function hideSceneRayHitMarker(owner) {
        const marker = owner && owner.__vrodosSceneRayHitMarker;
        if (marker) {
            marker.visible = false;
        }
    }

    function updateSceneRayHitMarker(owner, hit) {
        if (!owner || !hit || !hit.target || !isControllerClickTarget(hit.target)) {
            hideSceneRayHitMarker(owner);
            return false;
        }
        const point = sceneRayHitPoint(hit);
        if (!point) {
            hideSceneRayHitMarker(owner);
            return false;
        }
        const marker = ensureSceneRayHitMarker(owner);
        if (!marker) {
            return false;
        }
        marker.position.copy(point);
        marker.visible = true;
        return true;
    }

    function hideInactiveSceneRayHitMarkers(activeOwners) {
        sceneRayFeedbackOwners.forEach((owner) => {
            if (!activeOwners || !activeOwners.has(owner)) {
                hideSceneRayHitMarker(owner);
            }
        });
    }

    function updateSceneRayFeedback() {
        const activeOwners = new Set();
        const allowed = sceneRayFeedbackAllowed();

        let aframeRaycasterCount = 0;
        controllerClickBridgeTargets().forEach((controllerEl) => {
            const raycaster = controllerEl &&
                controllerEl.components &&
                controllerEl.components.raycaster;
            if (!raycaster) {
                return;
            }
            aframeRaycasterCount += 1;
            activeOwners.add(controllerEl);
            updateSceneRayHitMarker(controllerEl, allowed ? currentControllerIntersection(controllerEl) : null);
        });

        if (aframeRaycasterCount === 0) {
            const scene = queryScene();
            const xr = scene && scene.renderer && scene.renderer.xr;
            if (xr && typeof xr.getController === "function") {
                for (let index = 0; index < 2; index += 1) {
                    const controllerObject = xr.getController(index);
                    if (!controllerObject) {
                        continue;
                    }
                    activeOwners.add(controllerObject);
                    updateSceneRayHitMarker(
                        controllerObject,
                        allowed ? currentNativeControllerIntersection(controllerObject) : null
                    );
                }
            }
        }

        hideInactiveSceneRayHitMarkers(activeOwners);
    }

    function ensureSceneRayFeedbackComponent() {
        if (!window.AFRAME || !window.AFRAME.registerComponent) {
            return false;
        }
        if (!sceneRayFeedbackComponentRegistered) {
            if (window.AFRAME.components && window.AFRAME.components["vrodos-scene-ray-feedback"]) {
                sceneRayFeedbackComponentRegistered = true;
            } else {
                window.AFRAME.registerComponent("vrodos-scene-ray-feedback", {
                    tick: function () {
                        updateSceneRayFeedback();
                    },
                    remove: function () {
                        hideInactiveSceneRayHitMarkers(new Set());
                    }
                });
                sceneRayFeedbackComponentRegistered = true;
            }
        }

        const scene = queryScene();
        if (scene && scene.setAttribute && !scene.hasAttribute("vrodos-scene-ray-feedback")) {
            scene.setAttribute("vrodos-scene-ray-feedback", "");
            recordDiagnostic("debug", "Attached scene ray feedback component.", {
                sceneId: scene.id || ""
            });
        }
        return Boolean(scene);
    }

    function hasSpatialModalOpen() {
        const spatialUi = window.VRODOSSpatialUI || null;
        return Boolean(spatialUi &&
            typeof spatialUi.getActivePanel === "function" &&
            spatialUi.getActivePanel());
    }

    function emitControllerClick(controllerEl, target, sourceEvent, intersectionInfo) {
        if (!target || !target.isConnected || hasSpatialModalOpen()) {
            return;
        }

        const detail = {
            cursorEl: controllerEl,
            controllerEl,
            source: "vrodos-controller-click-bridge",
            originalEvent: sourceEvent || null,
            intersection: intersectionInfo && intersectionInfo.intersection || null,
            intersections: intersectionInfo && intersectionInfo.intersections || []
        };

        recordDiagnostic("debug", "Controller click bridge emitted click.", {
            controller: describeElement(controllerEl),
            target: describeElement(target)
        });

        if (typeof target.emit === "function") {
            target.emit("click", detail, false);
            return;
        }
        target.dispatchEvent(new CustomEvent("click", {
            bubbles: true,
            cancelable: true,
            detail
        }));
    }

    function installControllerClickBridge() {
        controllerClickBridgeTargets().forEach((controllerEl) => {
            if (!controllerEl || controllerEl.__vrodosControllerClickBridge) {
                return;
            }
            controllerEl.__vrodosControllerClickBridge = {
                downTarget: null,
                downAt: 0,
                lastClickTarget: null,
                lastClickAt: 0
            };

            const recentlyEmittedClick = (target) => {
                const bridge = controllerEl.__vrodosControllerClickBridge || {};
                return Boolean(target &&
                    bridge.lastClickTarget === target &&
                    performance.now() - (bridge.lastClickAt || 0) < 250);
            };

            const rememberEmittedClick = (target) => {
                const bridge = controllerEl.__vrodosControllerClickBridge || {};
                bridge.lastClickTarget = target || null;
                bridge.lastClickAt = performance.now();
            };

            const handleDown = (event) => {
                const hit = currentControllerIntersection(controllerEl);
                controllerEl.__vrodosControllerClickBridge.downTarget = hit && hit.target || null;
                controllerEl.__vrodosControllerClickBridge.downAt = performance.now();
            };

            const handleUp = (event) => {
                const bridge = controllerEl.__vrodosControllerClickBridge;
                const hit = currentControllerIntersection(controllerEl);
                const downTarget = bridge && bridge.downTarget || null;
                bridge.downTarget = null;
                if (!hit || !hit.target || !downTarget || hit.target !== downTarget) {
                    return;
                }
                if (performance.now() - (bridge.downAt || 0) > 1200) {
                    return;
                }
                if (recentlyEmittedClick(hit.target)) {
                    return;
                }
                emitControllerClick(controllerEl, hit.target, event, hit);
                rememberEmittedClick(hit.target);
            };

            const handleSelect = (event) => {
                const hit = currentControllerIntersection(controllerEl);
                if (!hit || !hit.target || recentlyEmittedClick(hit.target)) {
                    return;
                }
                emitControllerClick(controllerEl, hit.target, event, hit);
                rememberEmittedClick(hit.target);
            };

            ["triggerdown", "mousedown", "selectstart", "squeezestart"].forEach((type) => controllerEl.addEventListener(type, handleDown));
            ["triggerup", "mouseup", "selectend", "squeezeend"].forEach((type) => controllerEl.addEventListener(type, handleUp));
            ["select", "squeeze"].forEach((type) => controllerEl.addEventListener(type, handleSelect));
            recordDiagnostic("debug", "Installed controller click bridge.", {
                controller: describeElement(controllerEl)
            });
        });
    }

    function installNativeWebXRClickBridge() {
        const scene = queryScene();
        const xr = scene && scene.renderer && scene.renderer.xr;
        if (!xr || typeof xr.getController !== "function") {
            return;
        }

        for (let index = 0; index < 2; index += 1) {
            const controllerObject = xr.getController(index);
            if (!controllerObject || controllerObject.__vrodosNativeClickBridge) {
                continue;
            }

            const bridge = {
                downTarget: null,
                downAt: 0,
                lastClickTarget: null,
                lastClickAt: 0
            };
            controllerObject.__vrodosNativeClickBridge = bridge;

            const recentlyEmittedClick = (target) => {
                return Boolean(target &&
                    bridge.lastClickTarget === target &&
                    performance.now() - (bridge.lastClickAt || 0) < 250);
            };

            const rememberEmittedClick = (target) => {
                bridge.lastClickTarget = target || null;
                bridge.lastClickAt = performance.now();
            };

            const handleDown = (event) => {
                if (hasSpatialModalOpen()) {
                    bridge.downTarget = null;
                    return;
                }
                const hit = currentNativeControllerIntersection(controllerObject);
                bridge.downTarget = hit && hit.target || null;
                bridge.downAt = performance.now();
            };

            const handleUp = (event) => {
                if (hasSpatialModalOpen()) {
                    bridge.downTarget = null;
                    return;
                }
                const hit = currentNativeControllerIntersection(controllerObject);
                const downTarget = bridge.downTarget || null;
                bridge.downTarget = null;
                if (!hit || !hit.target || !downTarget || hit.target !== downTarget) {
                    return;
                }
                if (performance.now() - (bridge.downAt || 0) > 1200) {
                    return;
                }
                if (recentlyEmittedClick(hit.target)) {
                    return;
                }
                emitControllerClick(null, hit.target, event, hit);
                rememberEmittedClick(hit.target);
            };

            const handleSelect = (event) => {
                if (hasSpatialModalOpen()) {
                    bridge.downTarget = null;
                    return;
                }
                const hit = currentNativeControllerIntersection(controllerObject);
                if (!hit || !hit.target || recentlyEmittedClick(hit.target)) {
                    return;
                }
                emitControllerClick(null, hit.target, event, hit);
                rememberEmittedClick(hit.target);
            };

            controllerObject.addEventListener("selectstart", handleDown);
            controllerObject.addEventListener("selectend", handleUp);
            controllerObject.addEventListener("select", handleSelect);
            controllerObject.addEventListener("squeezestart", handleDown);
            controllerObject.addEventListener("squeezeend", handleUp);
            controllerObject.addEventListener("squeeze", handleSelect);
            recordDiagnostic("debug", "Installed native WebXR controller click bridge.", {
                controllerIndex: index
            });
        }
    }

    function refreshOverlayTargets() {
        queueRaycasterRefresh();
    }

    const api = {
        suppressedSceneControls: null,
        interactionLocked: false,
        getPresentationMode,
        getDiagnostics: function () {
            return diagnosticsStore().slice();
        },

        getSceneDiagnostics,

        recordDiagnostic,

        normalizeVrControllers: normalizeVrControllerEntities,

        ensureSpatialUiRuntime,
        prewarmSpatialUiRuntime,

        shouldUseVrPanel: function () {
            const mode = getPresentationMode();
            const shouldUse = mode === "immersive-xr";
            if (!shouldUse && isDiagnosticLoggingEnabled()) {
                recordDiagnostic("debug", "VR panel skipped because presentation is not immersive XR.", getSceneDiagnostics());
            }
            return shouldUse;
        },

        lockSceneInteraction: function (isLocked, options) {
            const locked = Boolean(isLocked);
            const preserveLook = Boolean(options && options.preserveLookInVr && isImmersiveVrActive());
            const player = document.getElementById("player");
            const camera = queryCamera();

            if (locked === this.interactionLocked) {
                return;
            }

            this.interactionLocked = locked;
            [player, camera].forEach((el) => {
                setAttributeEnabled(el, "custom-movement", !locked);
                setAttributeEnabled(el, "wasd-controls", !locked);
                setAttributeEnabled(el, "movement-controls", !locked);
                if (!preserveLook) {
                    setAttributeEnabled(el, "look-controls", !locked);
                }
            });

            if (!locked) {
                document.body.style.cursor = "";
                document.documentElement.style.cursor = "";
                document.body.classList.remove("a-grab-cursor", "a-grabbing");
                document.documentElement.classList.remove("a-grab-cursor", "a-grabbing");
                const scene = queryScene();
                if (scene && scene.canvas) {
                    scene.canvas.style.cursor = "";
                    scene.canvas.classList.remove("a-grab-cursor", "a-grabbing");
                }
            }
        },

        setSceneControlsSuppressed: function (active, activeRoot) {
            if (active) {
                if (!this.suppressedSceneControls) {
                    this.suppressedSceneControls = new Map();
                }

                const selector = SCENE_CONTROL_SUPPRESSION_SELECTORS.join(",");
                document.querySelectorAll(selector).forEach((el) => {
                    if (!el || !el.setAttribute || (activeRoot && (el === activeRoot || activeRoot.contains(el)))) {
                        return;
                    }
                    if (!this.suppressedSceneControls.has(el)) {
                        this.suppressedSceneControls.set(el, {
                            visible: el.getAttribute ? el.getAttribute("visible") : null,
                            raycastTarget: el.classList && el.classList.contains(RAYCAST_TARGET_CLASS),
                            raycastable: el.classList && el.classList.contains("raycastable")
                        });
                    }
                    el.setAttribute("visible", "false");
                    if (el.classList) {
                        el.classList.remove(RAYCAST_TARGET_CLASS, "raycastable");
                    }
                });
                queueRaycasterRefresh();
                return;
            }

            if (!this.suppressedSceneControls) {
                return;
            }

            this.suppressedSceneControls.forEach((state, el) => {
                if (!el || !el.isConnected || !el.setAttribute) {
                    return;
                }
                if (state.visible === null || state.visible === undefined) {
                    el.removeAttribute("visible");
                } else {
                    el.setAttribute("visible", state.visible);
                }
                if (el.classList) {
                    el.classList.toggle(RAYCAST_TARGET_CLASS, Boolean(state.raycastTarget));
                    el.classList.toggle("raycastable", Boolean(state.raycastable));
                }
            });
            this.suppressedSceneControls = null;
            queueRaycasterRefresh();
        },

        refreshRaycasters: refreshRaycasterObjects,

        refreshInteractionTargets: function () {
            refreshOverlayTargets();
        }
    };

    window.VRODOSRuntimeOverlay = api;

    let controllerNormalizationAttempts = 0;
    function normalizeVrControllersWhenReady() {
        normalizeVrControllerEntities();
        installControllerClickBridge();
        installNativeWebXRClickBridge();
        ensureSceneRayFeedbackComponent();
        controllerNormalizationAttempts += 1;
        if (controllerNormalizationAttempts < 24) {
            window.setTimeout(normalizeVrControllersWhenReady, 250);
        }
    }

    function bindControllerBridgeLifecycle() {
        const scene = queryScene();
        if (!scene || scene.__vrodosControllerBridgeLifecycleBound) {
            return Boolean(scene);
        }
        scene.__vrodosControllerBridgeLifecycleBound = true;
        scene.addEventListener("enter-vr", normalizeVrControllersWhenReady);
        scene.addEventListener("loaded", normalizeVrControllersWhenReady);
        return true;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            bindControllerBridgeLifecycle();
            normalizeVrControllersWhenReady();
            window.setTimeout(maybePreloadSpatialUiRuntime, 250);
        }, { once: true });
    } else {
        bindControllerBridgeLifecycle();
        normalizeVrControllersWhenReady();
        window.setTimeout(maybePreloadSpatialUiRuntime, 250);
    }
    window.addEventListener("load", normalizeVrControllersWhenReady, { once: true });
    window.addEventListener("load", () => window.setTimeout(maybePreloadSpatialUiRuntime, 250), { once: true });
    window.setTimeout(bindControllerBridgeLifecycle, 500);
})();
