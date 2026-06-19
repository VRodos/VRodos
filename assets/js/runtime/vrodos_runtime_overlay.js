(function () {
    "use strict";

    function installWebXRLayerCompatibilityShim() {
        if (window.VRODOS_ENABLE_POLYFILLED_WEBXR_LAYERS === true || window.__VRODOS_WEBXR_LAYER_SHIM_ACTIVE) {
            return;
        }

        const allowNativeLayers = window.VRODOS_ENABLE_NATIVE_WEBXR_LAYERS === true ||
            window.VRODOS_ENABLE_WEBXR_LAYERS === true;

        function isNativeBinding(binding) {
            if (typeof binding === "undefined" || binding === null) {
                return false;
            }
            try {
                return Function.prototype.toString.call(binding).indexOf("[native code]") !== -1;
            } catch (_error) {
                return false;
            }
        }

        function bindingSource(binding) {
            try {
                return Function.prototype.toString.call(binding).slice(0, 140);
            } catch (_error) {
                return "";
            }
        }

        let storedBinding = window.XRWebGLBinding;
        function shouldExposeBinding(binding) {
            return allowNativeLayers && isNativeBinding(binding);
        }

        if (shouldExposeBinding(storedBinding)) {
            return;
        }

        window.__VRODOS_WEBXR_LAYER_SHIM_ACTIVE = true;
        window.__VRODOS_WEBXR_LAYERS_DISABLED = {
            reason: "runtime-webxr-layers-disabled-by-default",
            source: bindingSource(storedBinding)
        };

        try {
            Object.defineProperty(window, "XRWebGLBinding", {
                configurable: false,
                get: function () {
                    return shouldExposeBinding(storedBinding) ? storedBinding : undefined;
                },
                set: function (nextBinding) {
                    storedBinding = nextBinding;
                    if (!shouldExposeBinding(nextBinding)) {
                        window.__VRODOS_WEBXR_LAYERS_DISABLED = {
                            reason: "runtime-blocked-xrwebglbinding-assignment",
                            source: bindingSource(nextBinding)
                        };
                    }
                }
            });
        } catch (_error) {
            try {
                window.XRWebGLBinding = undefined;
            } catch (_innerError) {}
        }
    }

    installWebXRLayerCompatibilityShim();

    const RAYCAST_TARGET_CLASS = "vrodos-overlay-hit-target";
    const OVERLAY_RENDER_BASE = 100000;
    const OVERLAY_LAYER_BACKGROUND = 10;
    const OVERLAY_LAYER_SURFACE = 20;
    const OVERLAY_LAYER_CONTROL = 40;
    const OVERLAY_LAYER_TEXT = 80;
    const OVERLAY_FLAG_RETRY_FRAMES = 16;
    const OVERLAY_DIAGNOSTIC_LIMIT = 160;
    const SPATIAL_UI_BUNDLE_FILE = "vrodos-runtime-spatial-ui.bundle.js";
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
        "[id^='video-playhint_']",
        "[id^='vid-panel_']",
        "[id^='ent_fs_']",
        "[id^='ent_pl_']",
        "[id^='ent_ex_']",
        "[id^='exit_vid_panel_']",
        "[id^='ent_tit_']"
    ];
    let spatialUiRuntimePromise = null;

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

    function serializeRaycasterAttribute(el) {
        if (!el || !el.getAttribute) {
            return null;
        }

        const attr = el.getAttribute("raycaster");
        if (attr === null || attr === undefined || attr === false) {
            return null;
        }

        if (typeof attr === "string") {
            return attr;
        }

        if (typeof attr === "object") {
            return Object.keys(attr)
                .map((key) => key + ": " + attr[key])
                .join("; ");
        }

        return String(attr);
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

    function serializeComponentAttribute(value) {
        return Object.keys(value || {})
            .map((key) => key + ": " + value[key])
            .join("; ");
    }

    function setRaycasterObjects(el, selector) {
        const attr = parseComponentAttribute(el.getAttribute("raycaster"));
        attr.objects = selector;
        el.setAttribute("raycaster", serializeComponentAttribute(attr));
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
                spatialUi.prewarm();
                recordDiagnostic("debug", "Prewarmed spatial UI runtime.", {
                    hasSpatialUi: true
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
            raycasters: getRaycasterDiagnostics(),
            activePanel: api.activePanel ? {
                id: api.activePanel.root && api.activePanel.root.id || "",
                locked: Boolean(api.activePanel.locked),
                retargetRaycasters: Boolean(api.activePanel.retargetRaycasters),
                renderCount: api.activePanel.api && api.activePanel.api.renderCount || 0,
                targets: api.activePanel.root ? api.activePanel.root.querySelectorAll("." + RAYCAST_TARGET_CLASS).length : 0
            } : null
        };
    }

    function normalizeVrControllerEntities() {
        const realControllers = [
            document.querySelector("#oculusLeft"),
            document.querySelector("#oculusRight")
        ].filter(Boolean);
        const legacyControllers = [
            document.querySelector("#leftHand"),
            document.querySelector("#rightHand")
        ].filter(Boolean);

        realControllers.forEach((el) => {
            if (el.hasAttribute && el.hasAttribute("blink-controls")) {
                el.removeAttribute("blink-controls");
            }
            if (el.hasAttribute && el.hasAttribute("visible")) {
                el.removeAttribute("visible");
            }
        });

        if (!realControllers.length) {
            return;
        }

        legacyControllers.forEach((el) => {
            if (el.hasAttribute && el.hasAttribute("blink-controls")) {
                el.removeAttribute("blink-controls");
            }
            if (el.hasAttribute && el.hasAttribute("raycaster")) {
                el.removeAttribute("raycaster");
            }
            el.setAttribute("visible", "false");
            el.setAttribute("data-vrodos-legacy-controller", "true");
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

    function createEntity(tagName, attributes) {
        const el = document.createElement(tagName || "a-entity");
        Object.keys(attributes || {}).forEach((key) => {
            if (key === "class") {
                el.setAttribute("class", attributes[key]);
                return;
            }
            el.setAttribute(key, attributes[key]);
        });
        return el;
    }

    function getOverlayRenderOrder(el) {
        const layer = el && el.getAttribute ? Number(el.getAttribute("data-vrodos-overlay-layer")) : 0;
        return OVERLAY_RENDER_BASE + (Number.isFinite(layer) ? layer : 0);
    }

    function isOverlayTextEntity(el) {
        return Boolean(el && el.tagName && String(el.tagName).toLowerCase() === "a-text");
    }

    function forEachMaterial(material, callback) {
        if (!material) {
            return;
        }
        if (Array.isArray(material)) {
            material.forEach((entry) => {
                if (entry) {
                    callback(entry);
                }
            });
            return;
        }
        callback(material);
    }

    function applyOverlayMaterialFlags(material, isText) {
        const THREE = getThreeRuntime();
        forEachMaterial(material, (entry) => {
            entry.depthTest = false;
            entry.depthWrite = false;
            if (THREE && typeof THREE.DoubleSide !== "undefined") {
                entry.side = THREE.DoubleSide;
            }
            if (isText) {
                entry.transparent = true;
                if (typeof entry.alphaTest === "number") {
                    entry.alphaTest = Math.max(entry.alphaTest || 0, 0.001);
                }
            } else if (typeof entry.opacity === "number" && entry.opacity < 1) {
                entry.transparent = true;
            } else if (!entry.map && !entry.alphaMap) {
                entry.transparent = false;
            }
            entry.needsUpdate = true;
        });
    }

    function setOverlayObjectFlags(el) {
        if (!el || !el.object3D) {
            return;
        }

        const renderOrder = getOverlayRenderOrder(el);
        const isText = isOverlayTextEntity(el);
        el.object3D.renderOrder = renderOrder;
        el.object3D.frustumCulled = false;
        if (typeof el.object3D.traverse === "function") {
            el.object3D.traverse((node) => {
                node.renderOrder = renderOrder;
                node.frustumCulled = false;
                if (node.material) {
                    applyOverlayMaterialFlags(node.material, isText);
                }
            });
        }
    }

    function bindOverlayFlagRefresh(el) {
        if (!el || el.__vrodosOverlayFlagRefreshBound) {
            return;
        }
        el.__vrodosOverlayFlagRefreshBound = true;
        const refresh = function () {
            queueOverlayObjectFlags(el);
        };
        el.addEventListener("loaded", refresh);
        el.addEventListener("object3dset", refresh);
        el.addEventListener("componentchanged", function (event) {
            const name = event && event.detail && event.detail.name;
            if (!name || name === "text" || name === "material" || name === "geometry") {
                refresh();
            }
        });
    }

    function queueOverlayObjectFlags(el, frames) {
        if (!el) {
            return;
        }
        bindOverlayFlagRefresh(el);
        let remaining = Number.isFinite(Number(frames)) ? Number(frames) : OVERLAY_FLAG_RETRY_FRAMES;
        const apply = function () {
            setOverlayObjectFlags(el);
            remaining -= 1;
            if (remaining > 0) {
                requestAnimationFrame(apply);
            }
        };
        requestAnimationFrame(apply);
    }

    function refreshOverlayTargets(root) {
        if (!root) {
            refreshRaycasterObjects();
            return;
        }
        root.querySelectorAll("[data-vrodos-overlay-ui]").forEach((el) => queueOverlayObjectFlags(el));
        queueRaycasterRefresh();
    }

    function getThreeRuntime() {
        return window.THREE || (window.AFRAME && window.AFRAME.THREE) || null;
    }

    function numberOrDefault(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function formatTransformNumber(value) {
        const safeValue = Math.abs(value) < 0.000001 ? 0 : value;
        return String(Number(safeValue.toFixed(5)));
    }

    function formatVectorAttribute(vector) {
        return [
            formatTransformNumber(vector.x),
            formatTransformNumber(vector.y),
            formatTransformNumber(vector.z)
        ].join(" ");
    }

    function formatRotationAttribute(rotation, THREE) {
        const radToDeg = THREE && THREE.MathUtils && typeof THREE.MathUtils.radToDeg === "function"
            ? THREE.MathUtils.radToDeg
            : function (value) { return value * 180 / Math.PI; };
        return [
            formatTransformNumber(radToDeg(rotation.x)),
            formatTransformNumber(radToDeg(rotation.y)),
            formatTransformNumber(radToDeg(rotation.z))
        ].join(" ");
    }

    function getWorldOverlayPose(options) {
        const THREE = getThreeRuntime();
        const scene = queryScene();
        const camera = queryCamera();
        if (!THREE || !scene || !camera || !camera.object3D) {
            return null;
        }

        if (scene.object3D && typeof scene.object3D.updateMatrixWorld === "function") {
            scene.object3D.updateMatrixWorld(true);
        }
        if (typeof camera.object3D.updateMatrixWorld === "function") {
            camera.object3D.updateMatrixWorld(true);
        }

        const distance = Math.max(0.25, numberOrDefault(options && options.distance, 2.35));
        const verticalOffset = numberOrDefault(options && options.verticalOffset, 0);
        const cameraPosition = new THREE.Vector3();
        const cameraQuaternion = new THREE.Quaternion();
        const forward = new THREE.Vector3(0, 0, -1);

        camera.object3D.getWorldPosition(cameraPosition);
        camera.object3D.getWorldQuaternion(cameraQuaternion);
        forward.applyQuaternion(cameraQuaternion);

        if (!(options && options.useCameraPitch === true)) {
            forward.y = 0;
            if (forward.lengthSq() < 0.000001) {
                const euler = new THREE.Euler().setFromQuaternion(cameraQuaternion, "YXZ");
                forward.set(-Math.sin(euler.y), 0, -Math.cos(euler.y));
            }
        }

        if (forward.lengthSq() < 0.000001) {
            forward.set(0, 0, -1);
        } else {
            forward.normalize();
        }

        const position = cameraPosition.clone().addScaledVector(forward, distance);
        const horizontalOffset = numberOrDefault(options && options.horizontalOffset, 0);
        if (horizontalOffset !== 0) {
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraQuaternion);
            right.y = 0;
            if (right.lengthSq() < 0.000001) {
                right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
            } else {
                right.normalize();
            }
            position.addScaledVector(right, horizontalOffset);
        }
        position.y += verticalOffset;

        return {
            scene,
            camera,
            position,
            faceTarget: cameraPosition.clone(),
            THREE
        };
    }

    function normalizePosition(position) {
        if (typeof position === "string") {
            return position;
        }
        if (Array.isArray(position)) {
            return position.join(" ");
        }
        return "0 0 0";
    }

    function normalizeOverlayPosition(position) {
        return normalizePosition(position);
    }

    function offsetOverlayPositionZ(position, offset) {
        const normalized = normalizeOverlayPosition(position);
        const parts = String(normalized).trim().split(/\s+/);
        if (parts.length < 3) {
            return normalized;
        }

        const z = Number(parts[2]);
        if (!Number.isFinite(z)) {
            return normalized;
        }

        parts[2] = formatTransformNumber(z + offset);
        return parts.join(" ");
    }

    function truncateText(value, maxLength) {
        const text = String(value || "");
        const max = Number(maxLength) || 0;
        if (!max || text.length <= max) {
            return text;
        }
        return text.slice(0, Math.max(0, max - 3)) + "...";
    }

    const api = {
        activePanel: null,
        raycasterRestore: null,
        suppressedSceneControls: null,
        interactionLocked: false,
        targetClass: RAYCAST_TARGET_CLASS,
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

        anchorElementInFrontOfCamera: function (el, options) {
            const pose = getWorldOverlayPose(options || {});
            if (!el || !pose || !pose.scene || !el.object3D) {
                return false;
            }

            if (el.parentNode !== pose.scene) {
                pose.scene.appendChild(el);
            }

            el.object3D.position.copy(pose.position);
            if (pose.THREE && pose.THREE.Vector3 && pose.THREE.Matrix4 && pose.THREE.Quaternion) {
                const zAxis = pose.faceTarget.clone().sub(pose.position);
                if (zAxis.lengthSq() < 0.000001) {
                    zAxis.set(0, 0, 1);
                } else {
                    zAxis.normalize();
                }
                const up = new pose.THREE.Vector3(0, 1, 0);
                let xAxis = up.clone().cross(zAxis);
                if (xAxis.lengthSq() < 0.000001) {
                    xAxis = new pose.THREE.Vector3(1, 0, 0);
                } else {
                    xAxis.normalize();
                }
                const yAxis = zAxis.clone().cross(xAxis).normalize();
                const matrix = new pose.THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
                el.object3D.quaternion.setFromRotationMatrix(matrix);
            } else {
                el.object3D.up.set(0, 1, 0);
                if (typeof el.object3D.lookAt === "function") {
                    el.object3D.lookAt(pose.faceTarget);
                    el.object3D.rotateY(Math.PI);
                }
            }
            if (typeof el.object3D.updateMatrixWorld === "function") {
                el.object3D.updateMatrixWorld(true);
            } else {
                el.object3D.matrixWorldNeedsUpdate = true;
            }

            el.setAttribute("position", formatVectorAttribute(el.object3D.position));
            el.setAttribute("rotation", formatRotationAttribute(el.object3D.rotation, pose.THREE));
            el.setAttribute("data-vrodos-overlay-static-anchor", "true");
            return true;
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

        setOverlayRaycastMode: function (active) {
            normalizeVrControllerEntities();
            const raycasters = collectRaycasters();

            if (active) {
                if (!this.raycasterRestore) {
                    this.raycasterRestore = new Map();
                }

                raycasters.forEach((el) => {
                    if (!this.raycasterRestore.has(el)) {
                        this.raycasterRestore.set(el, serializeRaycasterAttribute(el));
                    }
                    setRaycasterObjects(el, "." + RAYCAST_TARGET_CLASS);
                    if (el.components && el.components.raycaster && typeof el.components.raycaster.refreshObjects === "function") {
                        el.components.raycaster.refreshObjects();
                    }
                });
                return;
            }

            if (!this.raycasterRestore) {
                return;
            }

            this.raycasterRestore.forEach((value, el) => {
                if (!el || !el.isConnected) {
                    return;
                }
                if (value === null) {
                    el.removeAttribute("raycaster");
                } else {
                    el.setAttribute("raycaster", value);
                }
                if (el.components && el.components.raycaster && typeof el.components.raycaster.refreshObjects === "function") {
                    el.components.raycaster.refreshObjects();
                }
            });
            this.raycasterRestore = null;
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
            const activeRoot = this.activePanel && this.activePanel.root;
            refreshOverlayTargets(activeRoot || null);
        },

        markOverlayTarget: function (el, enabled) {
            if (!el || !el.classList) {
                return;
            }
            el.classList.toggle(RAYCAST_TARGET_CLASS, enabled !== false);
        },

        closeActivePanel: function (reason) {
            const active = this.activePanel;
            if (!active) {
                this.setSceneControlsSuppressed(false);
                this.setOverlayRaycastMode(false);
                this.lockSceneInteraction(false);
                recordDiagnostic("debug", "closeActivePanel called with no active panel.", {
                    reason: reason || "close"
                });
                return;
            }

            this.activePanel = null;
            recordDiagnostic("debug", "Closing VR overlay panel.", {
                reason: reason || "close",
                id: active.root && active.root.id || "",
                renderCount: active.api && active.api.renderCount || 0
            });
            this.setSceneControlsSuppressed(false);
            if (typeof active.cleanup === "function") {
                active.cleanup(reason || "close");
            }
            if (active.root && active.root.parentNode) {
                active.root.parentNode.removeChild(active.root);
            }
            if (active.retargetRaycasters) {
                this.setOverlayRaycastMode(false);
            } else {
                refreshRaycasterObjects();
            }
            this.lockSceneInteraction(false);
        },

        openVrPanel: function (config) {
            const options = config || {};
            const camera = queryCamera();
            if (!camera) {
                recordDiagnostic("warn", "Cannot open VR overlay panel because no A-Frame camera was found.", getSceneDiagnostics());
                return null;
            }

            this.closeActivePanel("replace");

            const width = Number(options.width) || 2.4;
            const height = Number(options.height) || 1.55;
            const distance = Number(options.distance) || 2.35;
            const root = createEntity("a-entity", {
                id: options.id || "vrodos-runtime-vr-overlay-root",
                position: options.position || "0 0 0",
                "data-vrodos-overlay-ui": "true"
            });
            root.classList.add("vrodos-runtime-vr-overlay");

            const panelApi = this.createPanelApi(root, {
                width,
                height,
                close: () => this.closeActivePanel("close")
            });

            if (options.position) {
                const scene = queryScene();
                if (scene) {
                    scene.appendChild(root);
                } else {
                    camera.appendChild(root);
                }
            } else if (!this.anchorElementInFrontOfCamera(root, {
                distance,
                verticalOffset: options.verticalOffset,
                useCameraPitch: options.useCameraPitch
            })) {
                camera.appendChild(root);
            }

            this.activePanel = {
                root,
                cleanup: options.cleanup || null,
                api: panelApi,
                locked: options.lockInteraction !== false,
                retargetRaycasters: options.retargetRaycasters !== false
            };
            if (this.activePanel.locked) {
                this.lockSceneInteraction(true, { preserveLookInVr: true });
            }
            if (this.activePanel.retargetRaycasters) {
                this.setOverlayRaycastMode(true);
            } else {
                normalizeVrControllerEntities();
            }
            this.setSceneControlsSuppressed(true, root);

            recordDiagnostic("debug", "Opened VR overlay panel.", {
                id: root.id || "",
                width,
                height,
                distance,
                locked: this.activePanel.locked,
                retargetRaycasters: this.activePanel.retargetRaycasters,
                diagnostics: getSceneDiagnostics()
            });

            if (typeof options.render === "function") {
                options.render(panelApi);
            }

            requestAnimationFrame(() => {
                refreshOverlayTargets(root);
            });

            return panelApi;
        },

        createPanelApi: function (root, options) {
            const overlayApi = this;
            const panelOptions = options || {};
            const panelApi = {
                root,
                scene: queryScene(),
                camera: queryCamera(),
                width: panelOptions.width || 2.4,
                height: panelOptions.height || 1.55,
                close: panelOptions.close,
                renderCount: 0,
                lastRenderDiagnostics: null,

                clear: function () {
                    while (root.firstChild) {
                        root.removeChild(root.firstChild);
                    }
                },

                refreshTargets: function () {
                    refreshOverlayTargets(root);
                },

                getDiagnostics: function () {
                    return getSceneDiagnostics();
                },

                addPlane: function (parent, attrs) {
                    const options = attrs || {};
                    const plane = createEntity("a-plane", {
                        position: normalizeOverlayPosition(options.position, root),
                        width: options.width || "1",
                        height: options.height || "1",
                        material: options.material || "shader: flat; color: #ffffff; side: double; transparent: false; opacity: 1; depthTest: false; depthWrite: false",
                        "data-vrodos-overlay-ui": "true",
                        "data-vrodos-overlay-layer": String(options.layer || OVERLAY_LAYER_SURFACE)
                    });
                    if (options.id) {
                        plane.id = options.id;
                    }
                    if (options.className) {
                        plane.setAttribute("class", options.className);
                    }
                    if (options.target) {
                        plane.classList.add(RAYCAST_TARGET_CLASS, "raycastable");
                    }
                    if (typeof options.onClick === "function") {
                        plane.addEventListener("click", options.onClick);
                    }
                    (parent || root).appendChild(plane);
                    queueOverlayObjectFlags(plane);
                    return plane;
                },

                addText: function (parent, attrs) {
                    const options = attrs || {};
                    const text = createEntity("a-text", {
                        position: normalizeOverlayPosition(options.position, root),
                        value: truncateText(options.value || "", options.maxLength || 0),
                        color: options.color || "#0f172a",
                        align: options.align || "left",
                        anchor: options.anchor || "center",
                        baseline: options.baseline || "center",
                        width: options.width || "2",
                        "wrap-count": options.wrapCount || "32",
                        side: "double",
                        transparent: "true",
                        opacity: "1",
                        "alpha-test": "0.001",
                        "data-vrodos-overlay-ui": "true",
                        "data-vrodos-overlay-layer": String(options.layer || OVERLAY_LAYER_TEXT)
                    });
                    if (options.scale) {
                        text.setAttribute("scale", options.scale);
                    }
                    (parent || root).appendChild(text);
                    queueOverlayObjectFlags(text);
                    return text;
                },

                addButton: function (parent, attrs) {
                    const options = attrs || {};
                    const disabled = Boolean(options.disabled);
                    const buttonWidth = numberOrDefault(options.width, 0.48);
                    const buttonHeight = numberOrDefault(options.height, 0.18);
                    const buttonLayer = numberOrDefault(options.layer, OVERLAY_LAYER_CONTROL);
                    const buttonPosition = options.position || "0 0 0";
                    const background = disabled
                        ? (options.disabledColor || "#d9d9d9")
                        : (options.color || "#272727");
                    const borderColor = disabled
                        ? (options.disabledBorderColor || "#b3b3b3")
                        : (options.borderColor || "#cfcfcf");
                    const textColor = options.textColor || (disabled ? "#747474" : "#ffffff");
                    this.addPlane(parent, {
                        position: offsetOverlayPositionZ(buttonPosition, -0.004),
                        width: buttonWidth + 0.014,
                        height: buttonHeight + 0.014,
                        layer: buttonLayer - 1,
                        material: "shader: flat; color: " + borderColor + "; side: double; transparent: false; opacity: 1; depthTest: false; depthWrite: false"
                    }).setAttribute("data-vrodos-overlay-button-border", "true");
                    const button = this.addPlane(parent, {
                        id: options.id,
                        position: buttonPosition,
                        width: buttonWidth,
                        height: buttonHeight,
                        target: !disabled,
                        layer: buttonLayer,
                        material: "shader: flat; color: " + background + "; side: double; transparent: false; opacity: 1; depthTest: false; depthWrite: false",
                        onClick: disabled ? null : options.onClick
                    });
                    button.setAttribute("data-vrodos-overlay-button", "true");
                    this.addText(button, {
                        position: "0 0 0.012",
                        value: options.label || "",
                        color: textColor,
                        align: "center",
                        anchor: "center",
                        baseline: "center",
                        width: Math.max(0.8, Number(options.width || 0.48) * 4),
                        wrapCount: options.wrapCount || "18",
                        maxLength: options.maxLength || 70,
                        scale: options.textScale || "0.45 0.45 0.45",
                        layer: (options.textLayer || OVERLAY_LAYER_TEXT)
                    });
                    return button;
                },

                addImage: function (parent, attrs) {
                    const options = attrs || {};
                    return this.addPlane(parent, {
                        position: options.position || "0 0 0",
                        width: options.width || 1,
                        height: options.height || 0.6,
                        layer: options.layer || OVERLAY_LAYER_SURFACE,
                        material: "shader: flat; src: url(" + String(options.src || "").replace(/\)/g, "%29") + "); side: double; transparent: true; opacity: 1; depthTest: false; depthWrite: false"
                    });
                },

                drawFrame: function (attrs) {
                    const options = attrs || {};
                    const panelWidth = options.width || this.width;
                    const panelHeight = options.height || this.height;
                    this.renderCount += 1;
                    this.lastRenderDiagnostics = {
                        id: root.id || "",
                        renderCount: this.renderCount,
                        title: options.title || "",
                        width: panelWidth,
                        height: panelHeight
                    };
                    recordDiagnostic("debug", "Rendering VR overlay panel frame.", this.lastRenderDiagnostics);
                    this.clear();
                    this.addPlane(root, {
                        position: "0 0 0",
                        width: panelWidth,
                        height: panelHeight,
                        layer: OVERLAY_LAYER_BACKGROUND,
                        material: "shader: flat; color: " + (options.background || "#f2f2f2") + "; side: double; transparent: false; opacity: 1; depthTest: false; depthWrite: false"
                    });
                    this.addPlane(root, {
                        position: "0 " + ((panelHeight / 2) - 0.18) + " 0.006",
                        width: panelWidth,
                        height: 0.36,
                        layer: OVERLAY_LAYER_SURFACE,
                        material: "shader: flat; color: " + (options.headerColor || "#272727") + "; side: double; transparent: false; opacity: 1; depthTest: false; depthWrite: false"
                    });
                    this.addText(root, {
                        position: (-panelWidth / 2 + 0.16) + " " + ((panelHeight / 2) - 0.18) + " 0.02",
                        value: options.title || "",
                        color: "#ffffff",
                        align: "left",
                        anchor: "left",
                        width: panelWidth - 0.64,
                        wrapCount: "34",
                        maxLength: 96,
                        scale: "0.58 0.58 0.58"
                    });
                    if (options.showClose !== false) {
                        this.addButton(root, {
                            position: (panelWidth / 2 - 0.17) + " " + ((panelHeight / 2) - 0.18) + " 0.025",
                            width: 0.18,
                            height: 0.18,
                            label: "X",
                            color: options.closeColor || "#747474",
                            onClick: options.onClose || this.close,
                            textScale: "0.52 0.52 0.52",
                            wrapCount: "4"
                        });
                    }
                    return {
                        top: panelHeight / 2 - 0.42,
                        bottom: -panelHeight / 2 + 0.12,
                        left: -panelWidth / 2 + 0.14,
                        right: panelWidth / 2 - 0.14,
                        width: panelWidth - 0.28,
                        height: panelHeight - 0.54
                    };
                }
            };

            panelApi.addPlane = panelApi.addPlane.bind(panelApi);
            panelApi.addText = panelApi.addText.bind(panelApi);
            panelApi.addButton = panelApi.addButton.bind(panelApi);
            panelApi.addImage = panelApi.addImage.bind(panelApi);
            panelApi.drawFrame = panelApi.drawFrame.bind(panelApi);
            panelApi.clear = panelApi.clear.bind(panelApi);
            panelApi.refreshTargets = panelApi.refreshTargets.bind(panelApi);

            panelApi.markTarget = overlayApi.markOverlayTarget.bind(overlayApi);
            return panelApi;
        }
    };

    window.VRODOSRuntimeOverlay = api;

    let controllerNormalizationAttempts = 0;
    function normalizeVrControllersWhenReady() {
        normalizeVrControllerEntities();
        installControllerClickBridge();
        installNativeWebXRClickBridge();
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
