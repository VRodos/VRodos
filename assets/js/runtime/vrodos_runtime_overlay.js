(function () {
    "use strict";

    const RAYCAST_TARGET_CLASS = "vrodos-overlay-hit-target";
    const OVERLAY_RENDER_BASE = 100000;
    const OVERLAY_LAYER_BACKGROUND = 10;
    const OVERLAY_LAYER_SURFACE = 20;
    const OVERLAY_LAYER_CONTROL = 40;
    const OVERLAY_LAYER_TEXT = 80;
    const OVERLAY_FLAG_RETRY_FRAMES = 8;
    const RAYCASTER_SELECTORS = [
        "#cursor",
        "#oculusRight",
        "#oculusLeft",
        "[laser-controls][raycaster]",
        "[meta-touch-controls][raycaster]",
        "[oculus-touch-controls][raycaster]",
        "[raycaster]"
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

    function normalizeOverlayPosition(position, root) {
        const normalized = normalizePosition(position);
        if (!root || !root.getAttribute || root.getAttribute("data-vrodos-overlay-static-anchor") !== "true") {
            return normalized;
        }

        const parts = String(normalized).trim().split(/\s+/);
        if (parts.length < 3) {
            return normalized;
        }

        const z = Number(parts[2]);
        if (!Number.isFinite(z) || z === 0) {
            return normalized;
        }

        parts[2] = formatTransformNumber(-Math.abs(z));
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
        interactionLocked: false,
        targetClass: RAYCAST_TARGET_CLASS,
        getPresentationMode,

        normalizeVrControllers: normalizeVrControllerEntities,

        shouldUseVrPanel: function () {
            return getPresentationMode() === "immersive-xr";
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

        refreshRaycasters: refreshRaycasterObjects,

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
                width: panelOptions.width || 2.4,
                height: panelOptions.height || 1.55,
                close: panelOptions.close,

                clear: function () {
                    while (root.firstChild) {
                        root.removeChild(root.firstChild);
                    }
                },

                refreshTargets: function () {
                    refreshOverlayTargets(root);
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
                    const background = disabled
                        ? (options.disabledColor || "#cbd5e1")
                        : (options.color || "#5cc887");
                    const opacity = disabled ? "0.65" : "1";
                    const transparent = disabled ? "true" : "false";
                    const button = this.addPlane(parent, {
                        id: options.id,
                        position: options.position || "0 0 0",
                        width: options.width || 0.48,
                        height: options.height || 0.18,
                        target: !disabled,
                        layer: options.layer || OVERLAY_LAYER_CONTROL,
                        material: "shader: flat; color: " + background + "; side: double; transparent: " + transparent + "; opacity: " + opacity + "; depthTest: false; depthWrite: false",
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
                    this.clear();
                    this.addPlane(root, {
                        position: "0 0 0",
                        width: panelWidth,
                        height: panelHeight,
                        layer: OVERLAY_LAYER_BACKGROUND,
                        material: "shader: flat; color: " + (options.background || "#f8fafc") + "; side: double; transparent: false; opacity: 1; depthTest: false; depthWrite: false"
                    });
                    this.addPlane(root, {
                        position: "0 " + ((panelHeight / 2) - 0.18) + " 0.006",
                        width: panelWidth,
                        height: 0.36,
                        layer: OVERLAY_LAYER_SURFACE,
                        material: "shader: flat; color: " + (options.headerColor || "#0f172a") + "; side: double; transparent: false; opacity: 1; depthTest: false; depthWrite: false"
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
            panelApi.refreshTargets = panelApi.refreshTargets.bind(panelApi);

            panelApi.markTarget = overlayApi.markOverlayTarget.bind(overlayApi);
            return panelApi;
        }
    };

    window.VRODOSRuntimeOverlay = api;

    let controllerNormalizationAttempts = 0;
    function normalizeVrControllersWhenReady() {
        normalizeVrControllerEntities();
        controllerNormalizationAttempts += 1;
        if (controllerNormalizationAttempts < 24) {
            window.setTimeout(normalizeVrControllersWhenReady, 250);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", normalizeVrControllersWhenReady, { once: true });
    } else {
        normalizeVrControllersWhenReady();
    }
    window.addEventListener("load", normalizeVrControllersWhenReady, { once: true });
})();
