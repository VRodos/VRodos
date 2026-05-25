(function () {
    "use strict";

    const RAYCAST_TARGET_CLASS = "vrodos-overlay-hit-target";
    const RAYCASTER_SELECTORS = [
        "#cursor",
        "#rightHand",
        "#leftHand",
        "#oculusRight",
        "#oculusLeft",
        "[laser-controls]"
    ];
    const VR_EXIT_BUTTON_LABEL = "B / Y";
    const VR_EXIT_EVENTS = ["bbuttondown", "ybuttondown"];
    const VR_EXIT_CONTROLLER_SELECTORS = [
        "#rightHand",
        "#leftHand",
        "#oculusRight",
        "#oculusLeft",
        "[oculus-touch-controls]"
    ];
    const VR_ENTRY_UI_SELECTORS = [
        ".a-enter-vr",
        ".a-enter-vr-button",
        "[data-aframe-enter-vr]"
    ];

    function queryScene() {
        return document.getElementById("aframe-scene-container") || document.querySelector("a-scene");
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
        return Boolean(scene &&
            scene.renderer &&
            scene.renderer.xr &&
            scene.renderer.xr.isPresenting);
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

    function handlePromiseRejection(result, label) {
        if (result && typeof result.catch === "function") {
            result.catch((error) => {
                console.warn("[VRodos] " + label + " was ignored by the browser.", error);
            });
        }
    }

    function requestDocumentFullscreen() {
        const scene = queryScene();
        const target = scene || document.documentElement;

        if (isDocumentFullscreenActive()) {
            return true;
        }

        if (target && target.requestFullscreen) {
            handlePromiseRejection(target.requestFullscreen(), "Fullscreen request");
            return true;
        }
        if (target && target.webkitRequestFullscreen) {
            handlePromiseRejection(target.webkitRequestFullscreen(), "Fullscreen request");
            return true;
        }
        if (target && target.mozRequestFullScreen) {
            handlePromiseRejection(target.mozRequestFullScreen(), "Fullscreen request");
            return true;
        }
        if (target && target.msRequestFullscreen) {
            handlePromiseRejection(target.msRequestFullscreen(), "Fullscreen request");
            return true;
        }

        return false;
    }

    function collectVrEntryUi() {
        const seen = new Set();
        const result = [];
        VR_ENTRY_UI_SELECTORS.forEach((selector) => {
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

    function setElementsVisible(elements, visible) {
        elements.forEach((el) => {
            if (!el || !el.style) {
                return;
            }
            el.style.display = visible ? "" : "none";
            el.style.visibility = visible ? "" : "hidden";
            el.setAttribute("aria-hidden", visible ? "false" : "true");
        });
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

    function collectVrExitControllers() {
        const seen = new Set();
        const result = [];
        VR_EXIT_CONTROLLER_SELECTORS.forEach((selector) => {
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

    function setOverlayObjectFlags(el) {
        if (!el || !el.object3D) {
            return;
        }

        el.object3D.renderOrder = 999999;
        el.object3D.frustumCulled = false;
        if (typeof el.object3D.traverse === "function") {
            el.object3D.traverse((node) => {
                node.renderOrder = 999999;
                node.frustumCulled = false;
                if (node.material) {
                    node.material.depthTest = false;
                    node.material.depthWrite = false;
                    node.material.transparent = true;
                    node.material.needsUpdate = true;
                }
            });
        }
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
        position.y += verticalOffset;

        return {
            scene,
            camera,
            position,
            faceTarget: position.clone().add(forward),
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
        interactionLocked: false,
        targetClass: RAYCAST_TARGET_CLASS,
        exitShortcutInstalled: false,
        exitShortcutScene: null,
        exitShortcutEls: null,
        exitHintRoot: null,
        fullscreenFallbackButton: null,
        vrSupported: null,
        vrAvailabilityInstalled: false,
        vrAvailabilityScene: null,
        vrEntryUi: null,
        onFullscreenFallbackClick: null,
        onFullscreenChange: null,
        onVrExitButtonDown: null,
        onVrEnter: null,
        onVrExit: null,
        onVrControlsChanged: null,

        getPresentationMode,

        shouldUseVrPanel: function () {
            return getPresentationMode() === "immersive-xr";
        },

        installVrAvailabilityUi: function () {
            const scene = queryScene();
            if (!scene) {
                return false;
            }

            this.vrEntryUi = collectVrEntryUi();
            if (!this.onFullscreenFallbackClick) {
                this.onFullscreenFallbackClick = (event) => {
                    if (event && typeof event.preventDefault === "function") {
                        event.preventDefault();
                    }
                    requestDocumentFullscreen();
                    this.updateVrEntryUi();
                };
            }
            if (!this.onFullscreenChange) {
                this.onFullscreenChange = () => this.updateVrEntryUi();
            }

            if (!this.vrAvailabilityInstalled || this.vrAvailabilityScene !== scene) {
                if (this.vrAvailabilityScene) {
                    this.vrAvailabilityScene.removeEventListener("enter-vr", this.onFullscreenChange);
                    this.vrAvailabilityScene.removeEventListener("exit-vr", this.onFullscreenChange);
                }
                scene.addEventListener("enter-vr", this.onFullscreenChange);
                scene.addEventListener("exit-vr", this.onFullscreenChange);
                document.addEventListener("fullscreenchange", this.onFullscreenChange);
                document.addEventListener("webkitfullscreenchange", this.onFullscreenChange);
                document.addEventListener("mozfullscreenchange", this.onFullscreenChange);
                document.addEventListener("MSFullscreenChange", this.onFullscreenChange);
                this.vrAvailabilityScene = scene;
                this.vrAvailabilityInstalled = true;
            }

            setElementsVisible(this.vrEntryUi, false);
            this.ensureFullscreenFallbackButton();
            this.detectImmersiveVrSupport().then((supported) => {
                this.vrSupported = supported;
                this.updateVrEntryUi();
            });

            return true;
        },

        detectImmersiveVrSupport: function () {
            if (!navigator.xr || typeof navigator.xr.isSessionSupported !== "function") {
                return Promise.resolve(false);
            }

            return navigator.xr.isSessionSupported("immersive-vr")
                .then(Boolean)
                .catch(() => false);
        },

        ensureFullscreenFallbackButton: function () {
            if (this.fullscreenFallbackButton && this.fullscreenFallbackButton.isConnected) {
                return this.fullscreenFallbackButton;
            }

            const button = document.createElement("button");
            button.id = "vrodos-runtime-fullscreen-button";
            button.type = "button";
            button.textContent = "Enter Fullscreen";
            button.setAttribute("aria-label", "Enter fullscreen");
            button.style.position = "fixed";
            button.style.right = "16px";
            button.style.bottom = "16px";
            button.style.zIndex = "10000000";
            button.style.border = "0";
            button.style.borderRadius = "12px";
            button.style.padding = "10px 14px";
            button.style.background = "#16a34a";
            button.style.color = "#ffffff";
            button.style.font = "600 14px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
            button.style.boxShadow = "0 12px 30px rgba(22, 163, 74, 0.32)";
            button.style.cursor = "pointer";
            button.style.display = "none";
            button.addEventListener("click", this.onFullscreenFallbackClick);
            document.body.appendChild(button);
            this.fullscreenFallbackButton = button;
            return button;
        },

        updateVrEntryUi: function () {
            const vrSupported = this.vrSupported === true;
            this.vrEntryUi = collectVrEntryUi();
            setElementsVisible(this.vrEntryUi, vrSupported);

            const fallback = this.ensureFullscreenFallbackButton();
            if (fallback) {
                const showFallback = !vrSupported && !isDocumentFullscreenActive();
                fallback.style.display = showFallback ? "inline-flex" : "none";
            }
        },

        installVrExitShortcut: function () {
            const scene = queryScene();
            if (!scene) {
                return false;
            }

            if (!this.exitShortcutEls) {
                this.exitShortcutEls = new Set();
            }

            if (!this.onVrExitButtonDown) {
                this.onVrExitButtonDown = (event) => {
                    const activeScene = queryScene();
                    if (!isImmersiveVrActive() && !(activeScene && activeScene.is && activeScene.is("vr-mode"))) {
                        return;
                    }
                    if (event && typeof event.preventDefault === "function") {
                        event.preventDefault();
                    }
                    if (event && typeof event.stopPropagation === "function") {
                        event.stopPropagation();
                    }
                    this.requestExitVr();
                };
            }

            if (!this.onVrEnter) {
                this.onVrEnter = () => {
                    requestAnimationFrame(() => {
                        this.refreshVrExitControllerBindings();
                        this.setVrExitHintVisible(true);
                    });
                };
            }

            if (!this.onVrExit) {
                this.onVrExit = () => {
                    this.setVrExitHintVisible(false);
                };
            }

            if (!this.onVrControlsChanged) {
                this.onVrControlsChanged = () => {
                    this.refreshVrExitControllerBindings();
                };
            }

            if (!this.exitShortcutInstalled || this.exitShortcutScene !== scene) {
                if (this.exitShortcutScene) {
                    this.exitShortcutScene.removeEventListener("enter-vr", this.onVrEnter);
                    this.exitShortcutScene.removeEventListener("exit-vr", this.onVrExit);
                    this.exitShortcutScene.removeEventListener("child-attached", this.onVrControlsChanged);
                }
                scene.addEventListener("enter-vr", this.onVrEnter);
                scene.addEventListener("exit-vr", this.onVrExit);
                scene.addEventListener("child-attached", this.onVrControlsChanged);
                this.exitShortcutScene = scene;
                this.exitShortcutInstalled = true;
            }

            this.refreshVrExitControllerBindings();
            this.setVrExitHintVisible(isImmersiveVrActive());
            return true;
        },

        refreshVrExitControllerBindings: function () {
            if (!this.onVrExitButtonDown) {
                return;
            }

            if (!this.exitShortcutEls) {
                this.exitShortcutEls = new Set();
            }

            collectVrExitControllers().forEach((el) => {
                if (!el || this.exitShortcutEls.has(el)) {
                    return;
                }
                VR_EXIT_EVENTS.forEach((eventName) => {
                    el.addEventListener(eventName, this.onVrExitButtonDown);
                });
                this.exitShortcutEls.add(el);
            });
        },

        ensureVrExitHint: function () {
            const camera = queryCamera();
            if (!camera) {
                return null;
            }

            if (this.exitHintRoot && this.exitHintRoot.isConnected) {
                if (this.exitHintRoot.parentNode !== camera) {
                    camera.appendChild(this.exitHintRoot);
                }
                return this.exitHintRoot;
            }

            const root = createEntity("a-entity", {
                id: "vrodos-vr-exit-hint",
                position: "0.62 -0.42 -1.15",
                "data-vrodos-overlay-ui": "true",
                visible: "false"
            });
            const background = createEntity("a-plane", {
                position: "0 0 0",
                width: "0.62",
                height: "0.09",
                material: "shader: flat; color: #020617; transparent: true; opacity: 0.42; depthTest: false; depthWrite: false",
                "data-vrodos-overlay-ui": "true"
            });
            const label = createEntity("a-text", {
                position: "0.27 -0.003 0.012",
                value: VR_EXIT_BUTTON_LABEL + " to exit",
                color: "#ffffff",
                align: "right",
                anchor: "right",
                baseline: "center",
                width: "1.25",
                "wrap-count": "18",
                scale: "0.2 0.2 0.2",
                "data-vrodos-overlay-ui": "true",
                material: "depthTest: false; depthWrite: false"
            });

            root.appendChild(background);
            root.appendChild(label);
            camera.appendChild(root);
            this.exitHintRoot = root;

            requestAnimationFrame(() => {
                setOverlayObjectFlags(root);
                setOverlayObjectFlags(background);
                setOverlayObjectFlags(label);
            });

            return root;
        },

        setVrExitHintVisible: function (visible) {
            if (!visible) {
                if (this.exitHintRoot) {
                    this.exitHintRoot.setAttribute("visible", "false");
                }
                return;
            }

            const root = this.ensureVrExitHint();
            if (root) {
                root.setAttribute("visible", "true");
            }
        },

        requestExitVr: function () {
            const scene = queryScene();
            this.closeActivePanel("vr-exit");
            this.setVrExitHintVisible(false);

            if (scene && typeof scene.exitVR === "function") {
                scene.exitVR();
                return true;
            }

            const session = scene &&
                scene.renderer &&
                scene.renderer.xr &&
                typeof scene.renderer.xr.getSession === "function"
                ? scene.renderer.xr.getSession()
                : null;
            if (session && typeof session.end === "function") {
                session.end();
                return true;
            }

            return false;
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
            el.object3D.up.set(0, 1, 0);
            if (typeof el.object3D.lookAt === "function") {
                el.object3D.lookAt(pose.faceTarget);
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
            const raycasters = collectRaycasters();

            if (active) {
                if (!this.raycasterRestore) {
                    this.raycasterRestore = new Map();
                }

                raycasters.forEach((el) => {
                    if (!this.raycasterRestore.has(el)) {
                        this.raycasterRestore.set(el, serializeRaycasterAttribute(el));
                    }
                    el.setAttribute("raycaster", "objects: ." + RAYCAST_TARGET_CLASS);
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

        markOverlayTarget: function (el, enabled) {
            if (!el || !el.classList) {
                return;
            }
            el.classList.toggle(RAYCAST_TARGET_CLASS, enabled !== false);
        },

        closeActivePanel: function (reason) {
            const active = this.activePanel;
            if (!active) {
                this.setOverlayRaycastMode(false);
                this.lockSceneInteraction(false);
                return;
            }

            this.activePanel = null;
            if (typeof active.cleanup === "function") {
                active.cleanup(reason || "close");
            }
            if (active.root && active.root.parentNode) {
                active.root.parentNode.removeChild(active.root);
            }
            this.setOverlayRaycastMode(false);
            this.lockSceneInteraction(false);
        },

        openVrPanel: function (config) {
            const options = config || {};
            const camera = queryCamera();
            if (!camera) {
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
                api: panelApi
            };
            this.lockSceneInteraction(true, { preserveLookInVr: true });
            this.setOverlayRaycastMode(true);

            if (typeof options.render === "function") {
                options.render(panelApi);
            }

            requestAnimationFrame(() => {
                root.querySelectorAll("[data-vrodos-overlay-ui]").forEach(setOverlayObjectFlags);
                setOverlayObjectFlags(root);
            });

            return panelApi;
        },

        createPanelApi: function (root, options) {
            const overlayApi = this;
            const panelOptions = options || {};
            const panelApi = {
                root,
                width: panelOptions.width || 2.4,
                height: panelOptions.height || 1.55,
                close: panelOptions.close,

                clear: function () {
                    while (root.firstChild) {
                        root.removeChild(root.firstChild);
                    }
                },

                addPlane: function (parent, attrs) {
                    const options = attrs || {};
                    const plane = createEntity("a-plane", {
                        position: normalizePosition(options.position),
                        width: options.width || "1",
                        height: options.height || "1",
                        material: options.material || "shader: flat; color: #ffffff; transparent: true; opacity: 1; depthTest: false; depthWrite: false",
                        "data-vrodos-overlay-ui": "true"
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
                    requestAnimationFrame(() => setOverlayObjectFlags(plane));
                    return plane;
                },

                addText: function (parent, attrs) {
                    const options = attrs || {};
                    const text = createEntity("a-text", {
                        position: normalizePosition(options.position),
                        value: truncateText(options.value || "", options.maxLength || 0),
                        color: options.color || "#0f172a",
                        align: options.align || "left",
                        anchor: options.anchor || "center",
                        baseline: options.baseline || "center",
                        width: options.width || "2",
                        "wrap-count": options.wrapCount || "32",
                        "data-vrodos-overlay-ui": "true",
                        material: "depthTest: false; depthWrite: false"
                    });
                    if (options.scale) {
                        text.setAttribute("scale", options.scale);
                    }
                    (parent || root).appendChild(text);
                    requestAnimationFrame(() => setOverlayObjectFlags(text));
                    return text;
                },

                addButton: function (parent, attrs) {
                    const options = attrs || {};
                    const disabled = Boolean(options.disabled);
                    const background = disabled
                        ? (options.disabledColor || "#cbd5e1")
                        : (options.color || "#5cc887");
                    const button = this.addPlane(parent, {
                        id: options.id,
                        position: options.position || "0 0 0",
                        width: options.width || 0.48,
                        height: options.height || 0.18,
                        target: !disabled,
                        material: "shader: flat; color: " + background + "; transparent: true; opacity: " + (disabled ? "0.55" : "1") + "; depthTest: false; depthWrite: false",
                        onClick: disabled ? null : options.onClick
                    });
                    button.setAttribute("data-vrodos-overlay-button", "true");
                    this.addText(button, {
                        position: "0 0 0.012",
                        value: options.label || "",
                        color: options.textColor || "#ffffff",
                        align: "center",
                        anchor: "center",
                        baseline: "center",
                        width: Math.max(0.8, Number(options.width || 0.48) * 4),
                        wrapCount: options.wrapCount || "18",
                        maxLength: options.maxLength || 70,
                        scale: options.textScale || "0.45 0.45 0.45"
                    });
                    return button;
                },

                addImage: function (parent, attrs) {
                    const options = attrs || {};
                    return this.addPlane(parent, {
                        position: options.position || "0 0 0",
                        width: options.width || 1,
                        height: options.height || 0.6,
                        material: "shader: flat; src: url(" + String(options.src || "").replace(/\)/g, "%29") + "); transparent: true; opacity: 1; depthTest: false; depthWrite: false"
                    });
                },

                drawFrame: function (attrs) {
                    const options = attrs || {};
                    const panelWidth = options.width || this.width;
                    const panelHeight = options.height || this.height;
                    this.clear();
                    this.addPlane(root, {
                        position: "0 0 0",
                        width: panelWidth,
                        height: panelHeight,
                        material: "shader: flat; color: " + (options.background || "#f8fafc") + "; transparent: true; opacity: 0.97; depthTest: false; depthWrite: false"
                    });
                    this.addPlane(root, {
                        position: "0 " + ((panelHeight / 2) - 0.18) + " 0.006",
                        width: panelWidth,
                        height: 0.36,
                        material: "shader: flat; color: " + (options.headerColor || "#0f172a") + "; transparent: true; opacity: 0.96; depthTest: false; depthWrite: false"
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
                    this.addButton(root, {
                        position: (panelWidth / 2 - 0.17) + " " + ((panelHeight / 2) - 0.18) + " 0.025",
                        width: 0.18,
                        height: 0.18,
                        label: "X",
                        color: options.closeColor || "#ef4444",
                        onClick: options.onClose || this.close,
                        textScale: "0.52 0.52 0.52",
                        wrapCount: "4"
                    });
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

            panelApi.markTarget = overlayApi.markOverlayTarget.bind(overlayApi);
            return panelApi;
        }
    };

    window.VRODOSRuntimeOverlay = api;

    let exitShortcutInstallAttempts = 0;
    let vrAvailabilityInstallAttempts = 0;
    function installVrExitShortcutWhenReady() {
        if (api.installVrExitShortcut()) {
            return;
        }
        exitShortcutInstallAttempts += 1;
        if (exitShortcutInstallAttempts < 24) {
            window.setTimeout(installVrExitShortcutWhenReady, 250);
        }
    }

    function installVrAvailabilityUiWhenReady() {
        api.installVrAvailabilityUi();
        vrAvailabilityInstallAttempts += 1;
        if (vrAvailabilityInstallAttempts < 32) {
            window.setTimeout(installVrAvailabilityUiWhenReady, 250);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", installVrExitShortcutWhenReady, { once: true });
        document.addEventListener("DOMContentLoaded", installVrAvailabilityUiWhenReady, { once: true });
    } else {
        installVrExitShortcutWhenReady();
        installVrAvailabilityUiWhenReady();
    }
    window.addEventListener("load", installVrExitShortcutWhenReady, { once: true });
    window.addEventListener("load", installVrAvailabilityUiWhenReady, { once: true });
})();
