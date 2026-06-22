import {
    Container,
    Image,
    Text,
    reversePainterSortStable,
    setPreferredColorScheme
} from "@pmndrs/uikit";
import {
    Button as HorizonButton,
    ButtonLabel,
    Panel as HorizonPanel,
    ProgressBar as HorizonProgressBar,
    theme as HorizonTheme
} from "@pmndrs/uikit-horizon";
import { inter as InterFontFamily } from "@pmndrs/msdfonts/inter";
import { Check, ChevronLeft, ChevronRight, X } from "@pmndrs/uikit-lucide";
import { createRayPointer, forwardHtmlEvents } from "@pmndrs/pointer-events";
import { MSDF } from "@zappar/msdf-generator";

(function () {
    "use strict";

    const DIAGNOSTIC_LIMIT = 160;
    const DEFAULT_WIDTH = 2.6;
    const DEFAULT_HEIGHT = 1.7;
    const DEFAULT_DISTANCE = 1.95;
    const DEFAULT_VERTICAL_OFFSET = -0.08;
    const DEFAULT_XR_PANEL_SCALE = 1;
    const DEFAULT_INLINE_PANEL_SCALE = 1;
    const PANEL_ADAPTIVE_SCALE_DISTANCE = 1.75;
    const PANEL_ADAPTIVE_SCALE_MAX = 1.8;
    const DEFAULT_PANEL_DESIGN_WIDTH_PX = 1040;
    const MIN_PANEL_DESIGN_WIDTH_PX = 760;
    const MAX_PANEL_DESIGN_WIDTH_PX = 1440;
    const DEFAULT_XR_ANCHOR_REFRESH_FRAMES = 10;
    const DEFAULT_INLINE_ANCHOR_REFRESH_FRAMES = 24;
    const PANEL_RENDER_ORDER = 100000;
    const RAY_HIT_DOT_RENDER_ORDER = PANEL_RENDER_ORDER + 80;
    const RAY_HIT_DOT_RADIUS = 0.022;
    const RAY_HIT_DOT_ACTION_RADIUS = 0.04;
    const RAY_HIT_DOT_COLOR = 0x55c7ff;
    const RAY_HIT_DOT_ACTION_COLOR = 0xffc857;
    const SCENE_RAYCAST_SUPPRESSION_REFRESH_FRAMES = 15;
    const CONTROLLER_POINTER_ATTACH_RETRY_FRAMES = 1800;
    const CONTROLLER_POINTER_ATTACH_RETRY_LOG_INTERVAL = 120;
    const CONTROLLER_POSE_EPSILON = 0.000001;
    const CONTROLLER_RAY_DEFAULT_EPSILON = 0.00001;
    const SPATIAL_UI_FONT_FAMILY = "vrodos-noto-sans";
    const SPATIAL_UI_IMMEDIATE_FONT_FAMILY = "vrodos-inter-immediate";
    const SPATIAL_UI_FONT_CHARSET_SEED = " \tABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?.,;:'\"()-[]{}@#$%&*+=/\\<>_–—«»“”‘’…≤≥°%€ΆΈΉΊΌΎΏΪΫΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩάέήίόύώϊϋΐΰαβγδεζηθικλμνξοπρστυφχψως";
    const SPATIAL_UI_FONT_TEXTURE_SIZE = [1024, 1024];
    const SPATIAL_UI_FONT_SIZE = 48;
    const SPATIAL_UI_ASSET_ROOT = "assets/vendor/";
    const CONTROLLER_POINTER_SELECTOR = "#oculusRight, #oculusLeft, [laser-controls]";
    const CONTROLLER_COMPONENT_NAMES = ["tracked-controls", "meta-touch-controls", "oculus-touch-controls", "laser-controls"];
    const SCENE_CONTROL_SELECTORS = [
        "[vrodos-3d-play-icon]",
        "[id^='video-playhint_']"
    ];

    let activePanel = null;
    let hostComponentRegistered = false;
    let hostComponentScene = null;
    let hostComponentAttachAttempts = 0;
    let spatialFontGenerationPromise = null;
    let spatialMsdfWasmDataUrlPromise = null;
    let spatialFontWarmupStarted = false;
    let spatialFontWarmupPromise = null;
    const spatialFontInfoPromises = new Map();

    const vendor = Object.freeze({
        uikit: {
            Container,
            Image,
            Text,
            reversePainterSortStable,
            setPreferredColorScheme
        },
        horizon: {
            Panel: HorizonPanel,
            Button: HorizonButton,
            ButtonLabel,
            ProgressBar: HorizonProgressBar,
            theme: HorizonTheme
        },
        lucide: {
            Check,
            ChevronLeft,
            ChevronRight,
            X
        },
        pointerEvents: {
            createRayPointer,
            forwardHtmlEvents
        }
    });

    function diagnosticsStore() {
        window.__vrodosSpatialUIDiagnostics = window.__vrodosSpatialUIDiagnostics || [];
        return window.__vrodosSpatialUIDiagnostics;
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
        while (store.length > DIAGNOSTIC_LIMIT) {
            store.shift();
        }

        if (window.VRODOS_SPATIAL_UI_DEBUG || level === "warn" || level === "error") {
            const logger = console[level] || console.log;
            if (typeof logger === "function") {
                logger.call(console, "[VRodos spatial-ui]", entry.message, entry.details);
            }
        }

        const overlayApi = window.VRODOSRuntimeOverlay || null;
        if (overlayApi && typeof overlayApi.recordDiagnostic === "function") {
            overlayApi.recordDiagnostic(level || "info", "spatial-ui: " + (message || ""), details || {});
        }

        return entry;
    }

    function getThreeRuntime() {
        return window.THREE || (window.AFRAME && window.AFRAME.THREE) || null;
    }

    function normalizeBaseUrl(value) {
        if (typeof value !== "string" || !value || value.indexOf("PLACEHOLDER") !== -1) {
            return "";
        }
        return value.endsWith("/") ? value : value + "/";
    }

    function getPluginBaseUrl() {
        const data = window.vrodos_data || {};
        const paths = data.paths || {};
        const candidates = [
            window.VRODOS_PLUGIN_URL,
            data.pluginUrl,
            data.plugin_url,
            data.pluginPath,
            paths.pluginBaseUrl
        ];
        for (let i = 0; i < candidates.length; i += 1) {
            const base = normalizeBaseUrl(candidates[i]);
            if (base) {
                return base;
            }
        }

        const scriptSrc = document.currentScript && document.currentScript.src || "";
        const markerIndex = scriptSrc.indexOf("/assets/");
        if (markerIndex > -1) {
            return scriptSrc.slice(0, markerIndex + 1);
        }
        return "";
    }

    function pluginAssetUrl(relativePath) {
        const base = getPluginBaseUrl();
        if (!base) {
            return relativePath;
        }
        try {
            return new URL(relativePath.replace(/^\/+/, ""), base).href;
        } catch (_error) {
            return base + relativePath.replace(/^\/+/, "");
        }
    }

    function spatialFontCharset() {
        return Array.from(new Set(SPATIAL_UI_FONT_CHARSET_SEED.split(""))).join("");
    }

    function normalizeSpatialText(value) {
        if (value === null || value === undefined) {
            return "";
        }
        return String(value)
            .replace(/\u00a0/g, " ")
            .replace(/[\u200b-\u200f\u202a-\u202e\u2060]/g, "");
    }

    function firstFontInfo(fontFamily, preferredWeight) {
        if (!fontFamily || typeof fontFamily !== "object") {
            return null;
        }
        const targetWeight = Number(preferredWeight) || 400;
        let best = null;
        let bestDistance = Infinity;
        Object.keys(fontFamily).forEach((familyName) => {
            const weights = fontFamily[familyName] || {};
            Object.keys(weights).forEach((weightKey) => {
                const weightNumber = Number(weightKey);
                const distance = Number.isFinite(weightNumber)
                    ? Math.abs(weightNumber - targetWeight)
                    : bestDistance;
                if (weights[weightKey] && distance < bestDistance) {
                    best = weights[weightKey];
                    bestDistance = distance;
                }
            });
        });
        return best;
    }

    async function fetchFontBytes(relativePath) {
        const url = pluginAssetUrl(relativePath);
        const response = await fetch(url, { credentials: "same-origin" });
        if (!response.ok) {
            throw new Error("Could not load spatial UI font asset: " + response.status + " " + url);
        }
        return new Uint8Array(await response.arrayBuffer());
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ""));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async function spatialMsdfWasmUrl() {
        if (spatialMsdfWasmDataUrlPromise) {
            return spatialMsdfWasmDataUrlPromise;
        }

        const fallbackUrl = pluginAssetUrl(SPATIAL_UI_ASSET_ROOT + "zappar-msdf-generator/msdfgen_wasm.wasm");
        spatialMsdfWasmDataUrlPromise = (async () => {
            const response = await fetch(fallbackUrl, { credentials: "same-origin" });
            if (!response.ok) {
                throw new Error("Could not load spatial UI MSDF WASM asset: " + response.status + " " + fallbackUrl);
            }
            const dataUrl = await blobToDataUrl(new Blob([await response.arrayBuffer()], {
                type: "application/wasm"
            }));
            return dataUrl || fallbackUrl;
        })().catch((error) => {
            recordDiagnostic("warn", "Spatial UI MSDF WASM data-url preparation failed; falling back to direct WASM URL.", {
                error: error && error.message || String(error)
            });
            return fallbackUrl;
        });

        return spatialMsdfWasmDataUrlPromise;
    }

    async function generateSpatialFontFamily() {
        if (spatialFontGenerationPromise) {
            return spatialFontGenerationPromise;
        }

        spatialFontGenerationPromise = (async () => {
            const generator = new MSDF({
                workerUrl: pluginAssetUrl(SPATIAL_UI_ASSET_ROOT + "zappar-msdf-generator/worker.js"),
                wasmUrl: await spatialMsdfWasmUrl()
            });
            try {
                await generator.initialize();
                const charset = spatialFontCharset();
                const regularFont = await fetchFontBytes(SPATIAL_UI_ASSET_ROOT + "fonts/noto-sans/NotoSans-Regular.ttf");
                const boldFont = await fetchFontBytes(SPATIAL_UI_ASSET_ROOT + "fonts/noto-sans/NotoSans-Bold.ttf");
                const generated = await generator.generate({
                    fonts: [
                        {
                            font: regularFont,
                            charset,
                            fontSize: SPATIAL_UI_FONT_SIZE,
                            textureSize: SPATIAL_UI_FONT_TEXTURE_SIZE,
                            fieldRange: 4,
                            padding: 4,
                            fixOverlaps: true
                        },
                        {
                            font: boldFont,
                            charset,
                            fontSize: SPATIAL_UI_FONT_SIZE,
                            textureSize: SPATIAL_UI_FONT_TEXTURE_SIZE,
                            fieldRange: 4,
                            padding: 4,
                            fixOverlaps: true
                        }
                    ],
                    charset,
                    fontSize: SPATIAL_UI_FONT_SIZE,
                    textureSize: SPATIAL_UI_FONT_TEXTURE_SIZE
                });
                recordDiagnostic("debug", "Generated Greek-capable spatial UI font atlas.", {
                    families: Object.keys(generated || {}),
                    charsetLength: charset.length
                });
                return generated;
            } finally {
                if (generator && typeof generator.dispose === "function") {
                    await generator.dispose();
                }
            }
        })().catch((error) => {
            spatialFontGenerationPromise = null;
            recordDiagnostic("warn", "Spatial UI font atlas generation failed; falling back to PMNDRS Inter.", {
                error: error && error.message || String(error)
            });
            return null;
        });

        return spatialFontGenerationPromise;
    }

    async function spatialFontInfo(weight) {
        const weightKey = weight === "bold" ? "bold" : "normal";
        if (spatialFontInfoPromises.has(weightKey)) {
            return spatialFontInfoPromises.get(weightKey);
        }
        const promise = (async () => {
            const generated = await generateSpatialFontFamily();
            const preferredWeight = weightKey === "bold" ? 700 : 400;
            const generatedInfo = firstFontInfo(generated, preferredWeight);
            if (generatedInfo) {
                return generatedInfo;
            }
            return weightKey === "bold"
                ? InterFontFamily.bold
                : InterFontFamily.medium || InterFontFamily.light || InterFontFamily.bold;
        })();
        spatialFontInfoPromises.set(weightKey, promise);
        return promise;
    }

    function spatialFontFamilies() {
        return {
            [SPATIAL_UI_FONT_FAMILY]: {
                normal: () => spatialFontInfo("normal"),
                medium: () => spatialFontInfo("normal"),
                "500": () => spatialFontInfo("normal"),
                "semi-bold": () => spatialFontInfo("bold"),
                "600": () => spatialFontInfo("bold"),
                bold: () => spatialFontInfo("bold"),
                "700": () => spatialFontInfo("bold")
            }
        };
    }

    function immediateSpatialFontInfo(weight) {
        if (weight === "bold") {
            return InterFontFamily.bold || InterFontFamily.medium || InterFontFamily.light;
        }
        return InterFontFamily.medium || InterFontFamily.light || InterFontFamily.bold;
    }

    function immediateSpatialFontFamilies() {
        return {
            [SPATIAL_UI_IMMEDIATE_FONT_FAMILY]: {
                normal: () => immediateSpatialFontInfo("normal"),
                medium: () => immediateSpatialFontInfo("normal"),
                "500": () => immediateSpatialFontInfo("normal"),
                "semi-bold": () => immediateSpatialFontInfo("bold"),
                "600": () => immediateSpatialFontInfo("bold"),
                bold: () => immediateSpatialFontInfo("bold"),
                "700": () => immediateSpatialFontInfo("bold")
            }
        };
    }

    function fontProps(options) {
        const opts = options || {};
        if (opts.useImmediateFont === true) {
            return {
                fontFamily: opts.fontFamily || SPATIAL_UI_IMMEDIATE_FONT_FAMILY,
                fontFamilies: opts.fontFamilies || immediateSpatialFontFamilies()
            };
        }
        return {
            fontFamily: opts.fontFamily || SPATIAL_UI_FONT_FAMILY,
            fontFamilies: opts.fontFamilies || spatialFontFamilies()
        };
    }

    function spatialFontsReady() {
        if (!spatialFontWarmupPromise) {
            spatialFontWarmupPromise = Promise.all([
                spatialFontInfo("normal"),
                spatialFontInfo("bold")
            ]).then(() => true).catch((error) => {
                recordDiagnostic("warn", "Spatial UI font prewarm failed.", {
                    error: error && error.message || String(error)
                });
                return false;
            });
        }
        return spatialFontWarmupPromise;
    }

    function warmSpatialFonts(immediate) {
        if (spatialFontWarmupStarted && spatialFontWarmupPromise) {
            return spatialFontWarmupPromise;
        }
        spatialFontWarmupStarted = true;
        const start = () => {
            spatialFontWarmupPromise = spatialFontsReady();
            return spatialFontWarmupPromise;
        };
        if (immediate) {
            return start();
        }
        if (typeof window.requestIdleCallback === "function") {
            window.requestIdleCallback(start, { timeout: 8000 });
        } else {
            window.setTimeout(start, 1200);
        }
        return spatialFontWarmupPromise || Promise.resolve(false);
    }

    function getScene() {
        const byId = document.getElementById("aframe-scene-container");
        if (byId && byId.tagName && String(byId.tagName).toLowerCase() === "a-scene") {
            return byId;
        }
        return (byId && byId.querySelector && byId.querySelector("a-scene")) || document.querySelector("a-scene");
    }

    function getCameraEl(scene) {
        return document.getElementById("cameraA") ||
            (scene && scene.camera && scene.camera.el) ||
            document.querySelector("[camera]") ||
            document.querySelector("a-camera");
    }

    function getPresentationMode() {
        const scene = getScene();
        const xr = scene && scene.renderer && scene.renderer.xr;
        if ((xr && xr.isPresenting) || (xr && typeof xr.getSession === "function" && xr.getSession())) {
            return "immersive-xr";
        }
        if (document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement ||
                (scene && scene.is && scene.is("vr-mode"))) {
            if (scene && scene.is && scene.is("vr-mode")) {
                return "immersive-xr";
            }
            return "desktop-fullscreen";
        }
        return "inline";
    }

    function getXrCameraObject(scene) {
        const xr = scene && scene.renderer && scene.renderer.xr;
        if (!xr || typeof xr.getCamera !== "function" || !scene.camera) {
            return null;
        }
        const hasSession = (xr && xr.isPresenting) ||
            (typeof xr.getSession === "function" && xr.getSession());
        if (!hasSession) {
            return null;
        }
        try {
            const xrCamera = xr.getCamera(scene.camera);
            if (xrCamera && xrCamera.matrixWorld) {
                return {
                    object: xrCamera,
                    source: "webxr-camera"
                };
            }
            if (xrCamera && Array.isArray(xrCamera.cameras) && xrCamera.cameras[0]) {
                return {
                    object: xrCamera.cameras[0],
                    source: "webxr-eye-camera"
                };
            }
        } catch (error) {
            recordDiagnostic("debug", "Could not read Three WebXR camera pose for spatial UI anchor.", {
                error: error && error.message || String(error)
            });
        }
        return null;
    }

    function getAnchorCameraObject(scene) {
        const xrCamera = getXrCameraObject(scene);
        if (xrCamera) {
            return xrCamera;
        }
        if (scene && scene.camera && scene.camera.matrixWorld) {
            return {
                object: scene.camera,
                source: "scene-camera"
            };
        }
        const cameraEl = getCameraEl(scene);
        if (cameraEl && cameraEl.object3D) {
            return {
                object: cameraEl.object3D,
                source: "camera-entity"
            };
        }
        return null;
    }

    function getPointerCamera(scene) {
        const xrCamera = getXrCameraObject(scene);
        return xrCamera && xrCamera.object || scene && scene.camera || null;
    }

    function isAvailable() {
        const scene = getScene();
        return Boolean(window.AFRAME &&
            getThreeRuntime() &&
            scene &&
            scene.object3D &&
            scene.renderer &&
            (scene.camera || getCameraEl(scene)));
    }

    function numberOrDefault(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function px(value, fallback) {
        return Math.round(numberOrDefault(value, fallback || 0));
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function clampTextToApproximateLines(value, maxLines, charsPerLine) {
        const text = normalizeSpatialText(value || "").replace(/\s+/g, " ").trim();
        const lineCount = Math.max(1, Math.floor(Number(maxLines) || 1));
        const lineChars = Math.max(12, Math.floor(Number(charsPerLine) || 48));
        const maxLength = lineCount * lineChars;
        if (!text || text.length <= maxLength) {
            return text;
        }
        return text
            .slice(0, Math.max(0, maxLength - 3))
            .trim()
            .replace(/[\s,.;:!?-]+$/, "") + "...";
    }

    function resolvePanelMetrics(config, width, height) {
        const configuredWidth = Number(config && (
            config.designWidthPx !== undefined ? config.designWidthPx :
                (config.pixelWidth !== undefined ? config.pixelWidth : config.designWidth)
        ));
        const designWidthPx = clamp(
            Math.round(Number.isFinite(configuredWidth) && configuredWidth > 0 ? configuredWidth : DEFAULT_PANEL_DESIGN_WIDTH_PX),
            MIN_PANEL_DESIGN_WIDTH_PX,
            MAX_PANEL_DESIGN_WIDTH_PX
        );
        const pixelSize = Math.max(0.0005, numberOrDefault(width, DEFAULT_WIDTH) / designWidthPx);
        return {
            designWidthPx,
            designHeightPx: Math.max(1, Math.round(numberOrDefault(height, DEFAULT_HEIGHT) / pixelSize)),
            pixelSize
        };
    }

    function disposeComponentTree(component) {
        if (!component) {
            return;
        }
        if (Array.isArray(component.children)) {
            component.children.slice().forEach((child) => {
                if (child && child.properties && typeof child.dispose === "function") {
                    disposeComponentTree(child);
                }
            });
        }
        if (typeof component.dispose === "function") {
            component.dispose();
        } else if (component.parent && typeof component.parent.remove === "function") {
            component.parent.remove(component);
        }
    }

    function disposeObject3D(object) {
        if (!object) {
            return;
        }
        if (object.parent && typeof object.parent.remove === "function") {
            object.parent.remove(object);
        }
        const resources = window.VRODOSMaster && window.VRODOSMaster.RuntimeResources;
        if (resources && typeof resources.dispose === "function") {
            resources.dispose(object);
        }
    }

    function createNativePointerEvent(type, sourceEvent) {
        const eventButton = sourceEvent && Number.isFinite(Number(sourceEvent.button))
            ? Number(sourceEvent.button)
            : 0;
        return {
            type: type || "pointermove",
            button: eventButton,
            buttons: type === "pointerdown" ? 1 : 0,
            timeStamp: typeof performance !== "undefined" && typeof performance.now === "function"
                ? performance.now()
                : Date.now(),
            preventDefault: function () {},
            stopPropagation: function () {}
        };
    }

    function stopNativeEvent(event) {
        if (!event) {
            return;
        }
        if (typeof event.preventDefault === "function") {
            event.preventDefault();
        }
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        } else if (typeof event.stopPropagation === "function") {
            event.stopPropagation();
        }
    }

    function updateControllerPointerSpace(bridge) {
        const THREE = getThreeRuntime();
        if (!THREE || !bridge || !bridge.raySpace || !bridge.el) {
            return false;
        }

        const raycasterComponent = bridge.el.components && bridge.el.components.raycaster;
        const ray = raycasterComponent &&
            raycasterComponent.raycaster &&
            raycasterComponent.raycaster.ray;
        const rayReady = ray && ray.origin && ray.direction && ray.direction.lengthSq &&
            ray.direction.lengthSq() > CONTROLLER_POSE_EPSILON;
        const rayLooksDefaultLocal = rayReady && isDefaultLocalControllerRay(ray);
        const trackingStatus = resolveAFrameControllerTrackingStatus(bridge.el);
        bridge.lastControllerTrackingStatus = trackingStatus;
        const canKeepStableRayThroughReadinessDrop = Boolean(
            bridge.stableAFrameRaySeen === true &&
            rayReady &&
            !rayLooksDefaultLocal
        );
        if (trackingStatus.isControllerElement && !trackingStatus.ready &&
            !canKeepStableRayThroughReadinessDrop) {
            markControllerPointerPoseWaiting(bridge, trackingStatus.reason || "controller-not-present");
            return false;
        }

        const objectPose = resolveControllerObjectPose(bridge.el);

        if (!rayReady && (!objectPose || objectPose.localPoseIdentity)) {
            markControllerPointerPoseWaiting(bridge, "missing-ray-and-pose");
            return false;
        }

        if (rayLooksDefaultLocal && (!objectPose || objectPose.localPoseIdentity)) {
            markControllerPointerPoseWaiting(bridge, "default-startup-ray");
            return false;
        }

        if (rayReady && !rayLooksDefaultLocal) {
            const direction = ray.direction.clone().normalize();
            bridge.raySpace.position.copy(ray.origin);
            bridge.raySpace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
            bridge.raySpace.scale.set(1, 1, 1);
            bridge.raySpace.updateMatrix();
            bridge.raySpace.updateMatrixWorld(true);
            bridge.controllerPoseReady = true;
            bridge.lastControllerPoseReason = "aframe-raycaster-ray";
            bridge.usesControllerVisualRay = false;
            bridge.usesAFrameRaycasterRay = true;
            bridge.usesControllerObjectPose = false;
            bridge.stableAFrameRaySeen = true;
            bridge.controllerRayReadinessBypassed = canKeepStableRayThroughReadinessDrop;
            return true;
        }

        if (objectPose) {
            bridge.raySpace.position.copy(objectPose.worldPosition);
            bridge.raySpace.quaternion.copy(objectPose.worldQuaternion);
            bridge.raySpace.scale.set(1, 1, 1);
            bridge.raySpace.updateMatrix();
            bridge.raySpace.updateMatrixWorld(true);
            bridge.controllerPoseReady = true;
            bridge.lastControllerPoseReason = rayLooksDefaultLocal
                ? "controller-object-pose-after-default-ray"
                : "controller-object-pose";
            bridge.usesControllerVisualRay = false;
            bridge.usesAFrameRaycasterRay = false;
            bridge.usesControllerObjectPose = true;
            bridge.controllerRayReadinessBypassed = false;
            return true;
        }

        markControllerPointerPoseWaiting(bridge, "unresolved-controller-pose");
        return false;
    }

    function resolveAFrameControllerTrackingStatus(el) {
        const id = el && el.id || "";
        const hasControllerAttribute = Boolean(el && el.hasAttribute &&
            CONTROLLER_COMPONENT_NAMES.some((componentName) => el.hasAttribute(componentName)));
        const isControllerElement = /^(oculusLeft|oculusRight)$/i.test(id) || hasControllerAttribute;
        if (!isControllerElement) {
            return { isControllerElement: false, ready: true, reason: "not-controller" };
        }

        const hand = resolveControllerHand(el);
        const rayReadiness = resolveSharedControllerRayReadiness(el);
        if (rayReadiness) {
            return {
                isControllerElement: true,
                ready: rayReadiness.ready === true,
                reason: rayReadiness.ready === true ? "controller-ray-readiness" : (rayReadiness.reason || "controller-ray-not-ready"),
                hand: rayReadiness.hand || hand,
                rayReadiness
            };
        }

        return {
            isControllerElement: true,
            ready: false,
            reason: "missing-controller-ray-readiness-helper",
            hand
        };
    }

    function resolveControllerHand(el) {
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
        for (let i = 0; i < CONTROLLER_COMPONENT_NAMES.length; i += 1) {
            const component = el.components && el.components[CONTROLLER_COMPONENT_NAMES[i]];
            const hand = component && component.data && component.data.hand;
            if (hand === "left" || hand === "right") {
                return hand;
            }
        }
        for (let i = 0; i < CONTROLLER_COMPONENT_NAMES.length; i += 1) {
            const value = el.getAttribute && el.getAttribute(CONTROLLER_COMPONENT_NAMES[i]);
            const hand = value && typeof value === "object" ? value.hand : "";
            if (hand === "left" || hand === "right") {
                return hand;
            }
        }
        return "";
    }

    function resolveSharedControllerRayReadiness(el) {
        const api = window.VRODOSControllerRayReadiness;
        if (!api || typeof api.resolve !== "function") {
            return {
                ready: false,
                candidateReady: false,
                phase: "waiting",
                reason: "missing-controller-ray-readiness-helper",
                hand: resolveControllerHand(el),
                stableFrames: 0,
                requiredStableFrames: 3
            };
        }
        try {
            return api.resolve(el, {
                requiredStableFrames: 3,
                source: "spatial-ui"
            });
        } catch (error) {
            const reason = error && error.message || String(error);
            recordDiagnostic("warn", "Shared controller ray readiness check failed.", {
                controller: el && el.id || "",
                error: reason
            });
            return {
                ready: false,
                candidateReady: false,
                phase: "waiting",
                reason: "controller-ray-readiness-error",
                error: reason,
                hand: resolveControllerHand(el),
                stableFrames: 0,
                requiredStableFrames: 3
            };
        }
    }

    function markControllerPointerPoseWaiting(bridge, reason) {
        if (!bridge) {
            return;
        }
        bridge.controllerPoseReady = false;
        bridge.lastControllerPoseReason = reason || "";
        bridge.controllerPoseWaitCount = (bridge.controllerPoseWaitCount || 0) + 1;
        bridge.usesAFrameRaycasterRay = false;
        bridge.usesControllerObjectPose = false;
        bridge.controllerRayReadinessBypassed = false;
    }

    function isDefaultLocalControllerRay(ray) {
        if (!ray || !ray.origin || !ray.direction) {
            return false;
        }
        const originLengthSq = vectorLengthSq(ray.origin);
        const direction = ray.direction;
        const dx = Number(direction.x) || 0;
        const dy = Number(direction.y) || 0;
        const dz = (Number(direction.z) || 0) + 1;
        return originLengthSq < CONTROLLER_POSE_EPSILON &&
            (dx * dx + dy * dy + dz * dz) < CONTROLLER_RAY_DEFAULT_EPSILON;
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

    function quaternionIsIdentity(quaternion) {
        if (!quaternion) {
            return true;
        }
        const x = Number(quaternion.x) || 0;
        const y = Number(quaternion.y) || 0;
        const z = Number(quaternion.z) || 0;
        const w = Number.isFinite(Number(quaternion.w)) ? Number(quaternion.w) : 1;
        return (x * x + y * y + z * z) < CONTROLLER_POSE_EPSILON &&
            Math.abs(w - 1) < CONTROLLER_RAY_DEFAULT_EPSILON;
    }

    function resolveControllerObjectPose(el) {
        const THREE = getThreeRuntime();
        if (!THREE || !el || !el.object3D || !el.object3D.matrixWorld) {
            return null;
        }
        const object = el.object3D;
        object.updateMatrixWorld(true);
        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        const worldScale = new THREE.Vector3();
        object.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
        return {
            worldPosition,
            worldQuaternion,
            worldScale,
            localPoseIdentity: vectorLengthSq(object.position) < CONTROLLER_POSE_EPSILON &&
                quaternionIsIdentity(object.quaternion),
            worldPoseIdentity: worldPosition.lengthSq() < CONTROLLER_POSE_EPSILON &&
                quaternionIsIdentity(worldQuaternion)
        };
    }

    function createPointerEventAndMove(bridge, target, type, sourceEvent) {
        const nativeEvent = createNativePointerEvent(type, sourceEvent);
        const pointerSpaceReady = updateControllerPointerSpace(bridge);
        if (bridge && bridge.raySpace && !pointerSpaceReady) {
            resetBridgeIntersectionDiagnostics(bridge);
            return nativeEvent;
        }
        if (bridge && bridge.pointer && typeof bridge.pointer.move === "function") {
            bridge.pointer.move(target, nativeEvent);
            updateBridgeIntersectionDiagnostics(bridge);
            if (activePanel && activePanel.rayTrimEnabled) {
                updateControllerRayVisualTrim(bridge, true);
            }
        }
        return nativeEvent;
    }

    function resetBridgeIntersectionDiagnostics(bridge) {
        if (!bridge) {
            return;
        }
        bridge.lastIntersectionName = "";
        bridge.lastIntersectionDistance = null;
        bridge.lastIntersectionDistanceRaw = null;
        bridge.lastIntersectionPoint = null;
        bridge.lastIntersectionIsVoid = false;
    }

    function pointerIntersectionObject(bridge) {
        if (!bridge || !bridge.pointer || typeof bridge.pointer.getIntersection !== "function") {
            return null;
        }
        try {
            const intersection = bridge.pointer.getIntersection();
            return intersection && intersection.object || null;
        } catch (_error) {
            return null;
        }
    }

    function isActionablePointerObject(object) {
        let current = object || null;
        while (current) {
            if (current.userData && current.userData.vrodosSpatialActionable === true) {
                return true;
            }
            current = current.parent || null;
        }
        return false;
    }

    function pointerHasConcreteTarget(bridge) {
        const object = pointerIntersectionObject(bridge);
        return Boolean(object && object.isVoidObject !== true);
    }

    function isStalePointerIntersectionError(error) {
        const message = String(error && error.message || error || "");
        return message.indexOf("this.intersection") !== -1 && message.indexOf("object") !== -1;
    }

    function safePointerDown(bridge, nativeEvent) {
        if (!bridge || !bridge.pointer || typeof bridge.pointer.down !== "function" || !pointerHasConcreteTarget(bridge)) {
            if (bridge) {
                bridge.isDown = false;
            }
            return false;
        }
        try {
            bridge.pointer.down(nativeEvent);
            bridge.isDown = true;
            return true;
        } catch (error) {
            bridge.isDown = false;
            recordDiagnostic("warn", "Spatial UI pointer down failed.", {
                source: bridge.source || "",
                error: error && error.message || String(error)
            });
            return false;
        }
    }

    function safePointerUp(bridge, nativeEvent) {
        if (!bridge || !bridge.pointer || typeof bridge.pointer.up !== "function" || !bridge.isDown || !pointerHasConcreteTarget(bridge)) {
            if (bridge) {
                bridge.isDown = false;
            }
            return false;
        }
        try {
            bridge.pointer.up(nativeEvent);
            return true;
        } catch (error) {
            if (isStalePointerIntersectionError(error)) {
                bridge.stalePointerUpCount = (bridge.stalePointerUpCount || 0) + 1;
                return false;
            }
            recordDiagnostic("warn", "Spatial UI pointer up failed.", {
                source: bridge.source || "",
                error: error && error.message || String(error)
            });
            return false;
        } finally {
            bridge.isDown = false;
        }
    }

    function collectControllerPointerElements() {
        const seen = new Set();
        const result = [];
        document.querySelectorAll(CONTROLLER_POINTER_SELECTOR).forEach((el) => {
            if (seen.has(el) || !el.object3D) {
                return;
            }
            seen.add(el);
            result.push(el);
        });
        return result;
    }

    function firstPendingControllerRayReadiness() {
        const elements = collectControllerPointerElements();
        for (let i = 0; i < elements.length; i += 1) {
            const status = resolveSharedControllerRayReadiness(elements[i]);
            if (status && status.ready !== true) {
                return status;
            }
        }
        return null;
    }

    function attachNativeWebXRControllerPointers(panelState, target) {
        const scene = panelState && panelState.scene;
        const xr = scene && scene.renderer && scene.renderer.xr;
        if (!scene || !scene.camera || !xr || typeof xr.getController !== "function" || typeof createRayPointer !== "function") {
            return 0;
        }

        const pendingReadiness = firstPendingControllerRayReadiness();
        if (pendingReadiness) {
            panelState.controllerPointerPoseWaits = (panelState.controllerPointerPoseWaits || 0) + 1;
            if (!panelState.nativePointerReadinessLogged ||
                panelState.controllerPointerPoseWaits % CONTROLLER_POINTER_ATTACH_RETRY_LOG_INTERVAL === 0) {
                panelState.nativePointerReadinessLogged = true;
                recordDiagnostic("debug", "Waiting for stable controller ray before attaching native WebXR spatial pointer.", {
                    reason: pendingReadiness.reason || "",
                    hand: pendingReadiness.hand || "",
                    stableFrames: pendingReadiness.stableFrames || 0,
                    requiredStableFrames: pendingReadiness.requiredStableFrames || 0
                });
            }
            return 0;
        }

        let attached = 0;
        for (let index = 0; index < 2; index += 1) {
            const controller = xr.getController(index);
            if (!controller) {
                continue;
            }
            try {
                const source = `native-webxr-controller-${index}`;
                const pointer = createRayPointer(
                    () => getPointerCamera(scene),
                    { current: controller },
                    { source },
                    { minDistance: 0 },
                    "ray"
                );
                const bridge = {
                    el: controller,
                    pointer,
                    listeners: [],
                    source,
                    isDown: false,
                    lastUpAt: 0,
                    lastIntersectionName: "",
                    lastIntersectionDistance: null,
                    lastIntersectionDistanceRaw: null,
                    lastIntersectionPoint: null,
                    lastIntersectionIsVoid: false,
                    lastRayHitSource: "",
                    rayHitActionable: false,
                    showRayHitDot: panelState.showRayHitDot !== false,
                    rayVisualPromoted: false
                };
                promoteControllerRayVisual(bridge);
                const down = (event) => {
                    const nativeEvent = createPointerEventAndMove(bridge, target, "pointerdown", event);
                    safePointerDown(bridge, nativeEvent);
                    stopNativeEvent(event);
                };
                const up = (event) => {
                    const nativeEvent = createPointerEventAndMove(bridge, target, "pointerup", event);
                    safePointerUp(bridge, nativeEvent);
                    bridge.lastUpAt = performance.now();
                    stopNativeEvent(event);
                };
                const select = (event) => {
                    if (performance.now() - (bridge.lastUpAt || 0) < 250) {
                        stopNativeEvent(event);
                        return;
                    }
                    const nativeDownEvent = createPointerEventAndMove(bridge, target, "pointerdown", event);
                    safePointerDown(bridge, nativeDownEvent);
                    const nativeUpEvent = createPointerEventAndMove(bridge, target, "pointerup", event);
                    safePointerUp(bridge, nativeUpEvent);
                    bridge.lastUpAt = performance.now();
                    stopNativeEvent(event);
                };
                [
                    { type: "selectstart", handler: down },
                    { type: "squeezestart", handler: down },
                    { type: "selectend", handler: up },
                    { type: "squeezeend", handler: up },
                    { type: "select", handler: select },
                    { type: "squeeze", handler: select }
                ].forEach((listener) => {
                    controller.addEventListener(listener.type, listener.handler);
                    bridge.listeners.push(Object.assign({ capture: false }, listener));
                });
                panelState.controllerPointerBridges.push(bridge);
                attached += 1;
            } catch (error) {
                recordDiagnostic("warn", "Could not attach native WebXR pmndrs controller pointer.", {
                    controllerIndex: index,
                    error: error && error.message || String(error)
                });
            }
        }

        return attached;
    }

    function attachAFrameControllerPointers(panelState, target) {
        const scene = panelState && panelState.scene;
        if (!scene || !scene.camera || typeof createRayPointer !== "function") {
            return 0;
        }

        let attached = 0;
        collectControllerPointerElements().forEach((el, index) => {
            if (panelState.controllerPointerBridges.some((bridge) => bridge && bridge.el === el)) {
                return;
            }
            try {
                const THREE = getThreeRuntime();
                const source = el.id || "controller-" + index;
                const raySpace = THREE ? new THREE.Object3D() : null;
                if (raySpace) {
                    raySpace.name = "VRODOSSpatialUIPointerRay_" + source;
                    const pointerReady = updateControllerPointerSpace({ el, raySpace });
                    if (!pointerReady) {
                        panelState.controllerPointerPoseWaits = (panelState.controllerPointerPoseWaits || 0) + 1;
                        return;
                    }
                }
                const pointer = createRayPointer(
                    () => getPointerCamera(scene),
                    { current: raySpace || el.object3D },
                    { source },
                    { minDistance: 0 },
                    "ray"
                );
                const bridge = {
                    el,
                    pointer,
                    raySpace,
                    listeners: [],
                    source,
                    isDown: false,
                    lastUpAt: 0,
                    lastIntersectionName: "",
                    lastIntersectionDistance: null,
                    lastIntersectionDistanceRaw: null,
                    lastIntersectionPoint: null,
                    lastIntersectionIsVoid: false,
                    controllerPoseReady: true,
                    controllerPoseWaitCount: 0,
                    lastControllerPoseReason: "",
                    lastRayHitSource: "",
                    rayHitActionable: false,
                    showRayHitDot: panelState.showRayHitDot !== false,
                    rayVisualPromoted: false
                };
                promoteControllerRayVisual(bridge);
                const down = (event) => {
                    const nativeEvent = createPointerEventAndMove(bridge, target, "pointerdown", event);
                    safePointerDown(bridge, nativeEvent);
                    stopNativeEvent(event);
                };
                const up = (event) => {
                    const nativeEvent = createPointerEventAndMove(bridge, target, "pointerup", event);
                    safePointerUp(bridge, nativeEvent);
                    bridge.lastUpAt = performance.now();
                    stopNativeEvent(event);
                };
                const select = (event) => {
                    if (performance.now() - (bridge.lastUpAt || 0) < 250) {
                        stopNativeEvent(event);
                        return;
                    }
                    const nativeDownEvent = createPointerEventAndMove(bridge, target, "pointerdown", event);
                    safePointerDown(bridge, nativeDownEvent);
                    const nativeUpEvent = createPointerEventAndMove(bridge, target, "pointerup", event);
                    safePointerUp(bridge, nativeUpEvent);
                    bridge.lastUpAt = performance.now();
                    stopNativeEvent(event);
                };
                const clickShield = stopNativeEvent;
                [
                    { type: "triggerdown", handler: down },
                    { type: "gripdown", handler: down },
                    { type: "mousedown", handler: down },
                    { type: "selectstart", handler: down },
                    { type: "squeezestart", handler: down },
                    { type: "triggerup", handler: up },
                    { type: "gripup", handler: up },
                    { type: "mouseup", handler: up },
                    { type: "selectend", handler: up },
                    { type: "squeezeend", handler: up },
                    { type: "select", handler: select },
                    { type: "squeeze", handler: select },
                    { type: "click", handler: clickShield }
                ].forEach((listener) => {
                    el.addEventListener(listener.type, listener.handler, true);
                    bridge.listeners.push(Object.assign({ capture: true }, listener));
                });
                panelState.controllerPointerBridges.push(bridge);
                attached += 1;
            } catch (error) {
                recordDiagnostic("warn", "Could not attach pmndrs controller ray pointer.", {
                    controller: el.id || "",
                    error: error && error.message || String(error)
                });
            }
        });

        return attached;
    }

    function detachControllerPointerBridge(bridge) {
        if (!bridge) {
            return;
        }
        restoreControllerRayVisual(bridge);
        restoreControllerRaycasterFar(bridge);
        disposeRayHitMarker(bridge);
        if (!bridge.el || !Array.isArray(bridge.listeners)) {
            return;
        }
        if (bridge.pointer && typeof bridge.pointer.exit === "function") {
            try {
                bridge.pointer.exit(createNativePointerEvent("pointercancel"));
            } catch (_error) {
                // Ignore pointer teardown failures; listeners still need to be removed.
            }
        }
        bridge.listeners.forEach((listener) => {
            bridge.el.removeEventListener(listener.type, listener.handler, listener.capture);
        });
    }

    function detachControllerPointerBridges(panelState, predicate) {
        if (!panelState || !Array.isArray(panelState.controllerPointerBridges)) {
            return 0;
        }
        const remaining = [];
        let removed = 0;
        panelState.controllerPointerBridges.forEach((bridge) => {
            if (predicate && predicate(bridge)) {
                detachControllerPointerBridge(bridge);
                removed += 1;
                return;
            }
            remaining.push(bridge);
        });
        panelState.controllerPointerBridges = remaining;
        return removed;
    }

    function updateBridgeIntersectionDiagnostics(bridge) {
        if (!bridge || !bridge.pointer || typeof bridge.pointer.getIntersection !== "function") {
            return;
        }
        let intersection = null;
        try {
            intersection = bridge.pointer.getIntersection();
        } catch (_error) {
            resetBridgeIntersectionDiagnostics(bridge);
            return;
        }
        if (!intersection || !intersection.object) {
            resetBridgeIntersectionDiagnostics(bridge);
            return;
        }
        const object = intersection.object;
        bridge.lastIntersectionName = object.name || object.constructor && object.constructor.name || "";
        bridge.lastIntersectionDistanceRaw = Number.isFinite(intersection.distance)
            ? intersection.distance
            : null;
        bridge.lastIntersectionPoint = resolveIntersectionPoint(bridge, intersection);
        bridge.lastIntersectionDistance = Number.isFinite(intersection.distance)
            ? Math.round(intersection.distance * 1000) / 1000
            : null;
        bridge.lastIntersectionIsVoid = object.isVoidObject === true;
    }

    function resolveIntersectionPoint(bridge, intersection) {
        const THREE = getThreeRuntime();
        if (!THREE || !intersection) {
            return null;
        }
        if (intersection.point && typeof intersection.point.clone === "function") {
            return intersection.point.clone();
        }
        const distance = Number(intersection.distance);
        if (!Number.isFinite(distance) || distance <= 0 || !bridge || !bridge.raySpace) {
            return null;
        }
        const origin = new THREE.Vector3();
        const direction = new THREE.Vector3(0, 0, -1);
        const rotation = new THREE.Matrix4();
        bridge.raySpace.updateMatrixWorld(true);
        origin.setFromMatrixPosition(bridge.raySpace.matrixWorld);
        rotation.extractRotation(bridge.raySpace.matrixWorld);
        direction.applyMatrix4(rotation).normalize();
        return origin.addScaledVector(direction, distance);
    }

    function resolveBridgeRay(bridge) {
        const THREE = getThreeRuntime();
        if (!THREE || !bridge) {
            return null;
        }
        const object = bridge.raySpace ||
            bridge.el && (bridge.el.object3D || (bridge.el.isObject3D || typeof bridge.el.updateMatrixWorld === "function" ? bridge.el : null));
        if (!object) {
            return null;
        }
        if (bridge.raySpace && bridge.controllerPoseReady === false) {
            return null;
        }
        if (typeof object.updateMatrixWorld === "function") {
            object.updateMatrixWorld(true);
        }
        const origin = new THREE.Vector3();
        const direction = new THREE.Vector3(0, 0, -1);
        const rotation = new THREE.Matrix4();
        origin.setFromMatrixPosition(object.matrixWorld);
        rotation.extractRotation(object.matrixWorld);
        direction.applyMatrix4(rotation).normalize();
        return { origin, direction };
    }

    function resolvePanelSurfaceHit(bridge, panelState) {
        const THREE = getThreeRuntime();
        const group = panelState && panelState.group;
        if (!THREE || !group) {
            return null;
        }
        const ray = resolveBridgeRay(bridge);
        if (!ray) {
            return null;
        }
        if (typeof group.updateMatrixWorld === "function") {
            group.updateMatrixWorld(true);
        }
        const inverse = new THREE.Matrix4().copy(group.matrixWorld).invert();
        const localOrigin = ray.origin.clone().applyMatrix4(inverse);
        const localDirection = ray.direction.clone().transformDirection(inverse);
        if (Math.abs(localDirection.z) < 0.000001) {
            return null;
        }
        const localT = -localOrigin.z / localDirection.z;
        if (!Number.isFinite(localT) || localT <= 0) {
            return null;
        }
        const localPoint = localOrigin.clone().addScaledVector(localDirection, localT);
        const width = Math.max(0.1, Number(panelState.width) || DEFAULT_WIDTH);
        const height = Math.max(0.1, Number(panelState.height) || DEFAULT_HEIGHT);
        const tolerance = 0.035;
        if (Math.abs(localPoint.x) > (width * 0.5) + tolerance ||
            Math.abs(localPoint.y) > (height * 0.5) + tolerance) {
            return null;
        }
        const point = localPoint.clone().applyMatrix4(group.matrixWorld);
        const distance = ray.origin.distanceTo(point);
        if (!Number.isFinite(distance) || distance <= 0) {
            return null;
        }
        return {
            point,
            distance,
            source: "panel-surface",
            actionable: false
        };
    }

    function resolveDialogRayHit(bridge, panelState) {
        const object = pointerIntersectionObject(bridge);
        const pmndrsDistance = bridge && Number(bridge.lastIntersectionDistanceRaw);
        if (object && object.isVoidObject !== true &&
            Number.isFinite(pmndrsDistance) && pmndrsDistance > 0 && bridge.lastIntersectionPoint) {
            return {
                point: bridge.lastIntersectionPoint,
                distance: pmndrsDistance,
                source: "pmndrs",
                actionable: isActionablePointerObject(object)
            };
        }
        return resolvePanelSurfaceHit(bridge, panelState);
    }

    function getLinePositionAttribute(object) {
        const geometry = object && object.geometry;
        if (!geometry) {
            return null;
        }
        if (typeof geometry.getAttribute === "function") {
            return geometry.getAttribute("position");
        }
        return geometry.attributes && geometry.attributes.position || null;
    }

    function captureLinePositions(object) {
        const attribute = getLinePositionAttribute(object);
        if (!attribute || !attribute.array || attribute.itemSize < 3 || attribute.count < 2) {
            return null;
        }
        return Array.prototype.slice.call(attribute.array, 0);
    }

    function restoreLinePositions(object, positions) {
        const attribute = getLinePositionAttribute(object);
        if (!attribute || !attribute.array || !positions || attribute.array.length < positions.length) {
            return false;
        }
        for (let index = 0; index < positions.length; index += 1) {
            attribute.array[index] = positions[index];
        }
        attribute.needsUpdate = true;
        if (object.geometry && typeof object.geometry.computeBoundingSphere === "function") {
            object.geometry.computeBoundingSphere();
        }
        return true;
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

    function findRayVisualState(bridge, object) {
        if (!bridge || !Array.isArray(bridge.rayVisualStates)) {
            return null;
        }
        for (let index = 0; index < bridge.rayVisualStates.length; index += 1) {
            if (bridge.rayVisualStates[index].object === object) {
                return bridge.rayVisualStates[index];
            }
        }
        return null;
    }

    function captureRayVisualState(bridge, object) {
        if (!bridge || !object) {
            return null;
        }
        bridge.rayVisualStates = bridge.rayVisualStates || [];
        let state = findRayVisualState(bridge, object);
        if (state) {
            return state;
        }
        const materialStates = [];
        forEachMaterial(object.material, (material) => {
            materialStates.push({
                material,
                depthTest: material.depthTest,
                depthWrite: material.depthWrite,
                transparent: material.transparent
            });
        });
        state = {
            object,
            renderOrder: object.renderOrder,
            frustumCulled: object.frustumCulled,
            positions: captureLinePositions(object),
            materialStates
        };
        bridge.rayVisualStates.push(state);
        return state;
    }

    function promoteControllerRayVisual(bridge) {
        const root = bridge && bridge.el && (bridge.el.object3D || (typeof bridge.el.traverse === "function" ? bridge.el : null));
        if (!root || typeof root.traverse !== "function") {
            return false;
        }
        let promoted = false;
        root.traverse((object) => {
            if (!object || !(object.isLine || object.type === "Line" || object.type === "LineSegments")) {
                return;
            }
            captureRayVisualState(bridge, object);
            object.renderOrder = PANEL_RENDER_ORDER + 100;
            object.frustumCulled = false;
            if (object.material) {
                forEachMaterial(object.material, (material) => {
                    material.depthTest = false;
                    material.depthWrite = false;
                    material.transparent = true;
                    material.needsUpdate = true;
                });
            }
            promoted = true;
        });
        if (promoted) {
            bridge.rayVisualPromoted = true;
        }
        return promoted;
    }

    function restoreControllerRayVisual(bridge) {
        if (!bridge || !Array.isArray(bridge.rayVisualStates)) {
            return false;
        }
        let restored = false;
        bridge.rayVisualStates.forEach((state) => {
            const object = state && state.object;
            if (!object) {
                return;
            }
            object.renderOrder = state.renderOrder;
            object.frustumCulled = state.frustumCulled;
            if (Array.isArray(state.materialStates)) {
                state.materialStates.forEach((materialState) => {
                    const material = materialState && materialState.material;
                    if (!material) {
                        return;
                    }
                    material.depthTest = materialState.depthTest;
                    material.depthWrite = materialState.depthWrite;
                    material.transparent = materialState.transparent;
                    material.needsUpdate = true;
                });
            }
            restored = restoreLinePositions(object, state.positions) || restored;
        });
        bridge.rayVisualStates = [];
        bridge.rayVisualTrimmed = false;
        bridge.lastRayTrimDistance = null;
        bridge.lastRayHitSource = "";
        bridge.rayHitActionable = false;
        return restored;
    }

    function captureControllerRaycasterState(bridge) {
        if (!bridge || bridge.raycasterStateCaptured || !bridge.el || !bridge.el.components) {
            return null;
        }
        const component = bridge.el.components.raycaster;
        if (!component) {
            return null;
        }
        bridge.raycasterStateCaptured = true;
        bridge.raycasterState = {
            dataFar: component.data && component.data.far,
            raycasterFar: component.raycaster && component.raycaster.far
        };
        return bridge.raycasterState;
    }

    function setControllerRaycasterFar(bridge, distance) {
        if (!bridge || !bridge.el || !bridge.el.components) {
            return false;
        }
        const component = bridge.el.components.raycaster;
        if (!component || !component.raycaster) {
            return false;
        }
        captureControllerRaycasterState(bridge);
        const far = Math.max(0.02, Number(distance) || 0.02);
        component.raycaster.far = far;
        if (component.data) {
            component.data.far = far;
        }
        bridge.raycasterFarTrimmed = true;
        return true;
    }

    function restoreControllerRaycasterFar(bridge) {
        if (!bridge || !bridge.raycasterStateCaptured || !bridge.el || !bridge.el.components) {
            return false;
        }
        const component = bridge.el.components.raycaster;
        if (!component) {
            bridge.raycasterFarTrimmed = false;
            return false;
        }
        const state = bridge.raycasterState || {};
        if (component.raycaster && typeof state.raycasterFar === "number" && !Number.isNaN(state.raycasterFar)) {
            component.raycaster.far = state.raycasterFar;
        }
        if (component.data && typeof state.dataFar === "number" && !Number.isNaN(state.dataFar)) {
            component.data.far = state.dataFar;
        }
        bridge.raycasterFarTrimmed = false;
        return true;
    }

    function ensureRayHitMarker(bridge) {
        const THREE = getThreeRuntime();
        const scene = getScene();
        if (!THREE || !scene || !scene.object3D || !bridge) {
            return null;
        }
        if (bridge.rayHitMarker) {
            return bridge.rayHitMarker;
        }
        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(RAY_HIT_DOT_RADIUS, 18, 12),
            new THREE.MeshBasicMaterial({
                color: RAY_HIT_DOT_COLOR,
                transparent: true,
                opacity: 0.95,
                depthTest: false,
                depthWrite: false
            })
        );
        marker.name = "VRODOSSpatialUIRayHitDot";
        marker.renderOrder = RAY_HIT_DOT_RENDER_ORDER;
        marker.frustumCulled = false;
        marker.visible = false;
        scene.object3D.add(marker);
        bridge.rayHitMarker = marker;
        return marker;
    }

    function updateRayHitMarker(bridge, hit) {
        const visible = Boolean(hit && hit.point);
        const marker = visible ? ensureRayHitMarker(bridge) : bridge && bridge.rayHitMarker;
        if (!marker) {
            return false;
        }
        if (!visible) {
            marker.visible = false;
            return false;
        }
        marker.position.copy(hit.point);
        const actionable = hit.actionable === true;
        const radius = actionable ? RAY_HIT_DOT_ACTION_RADIUS : RAY_HIT_DOT_RADIUS;
        marker.scale.setScalar(radius / RAY_HIT_DOT_RADIUS);
        forEachMaterial(marker.material, (material) => {
            if (material && material.color && typeof material.color.setHex === "function") {
                material.color.setHex(actionable ? RAY_HIT_DOT_ACTION_COLOR : RAY_HIT_DOT_COLOR);
            }
            if (material) {
                material.opacity = actionable ? 1 : 0.9;
                material.needsUpdate = true;
            }
        });
        marker.visible = true;
        return true;
    }

    function disposeRayHitMarker(bridge) {
        const marker = bridge && bridge.rayHitMarker;
        if (!marker) {
            return;
        }
        if (marker.parent) {
            marker.parent.remove(marker);
        }
        if (marker.geometry && typeof marker.geometry.dispose === "function") {
            marker.geometry.dispose();
        }
        forEachMaterial(marker.material, (material) => {
            if (material && typeof material.dispose === "function") {
                material.dispose();
            }
        });
        bridge.rayHitMarker = null;
    }

    function setLineVisualLength(state, distance) {
        const THREE = getThreeRuntime();
        const object = state && state.object;
        const positions = state && state.positions;
        const attribute = getLinePositionAttribute(object);
        if (!THREE || !object || !positions || !attribute || !attribute.array || attribute.itemSize < 3 || attribute.count < 2) {
            return false;
        }

        const lastIndex = (attribute.count - 1) * attribute.itemSize;
        const start = new THREE.Vector3(positions[0], positions[1], positions[2]);
        const end = new THREE.Vector3(positions[lastIndex], positions[lastIndex + 1], positions[lastIndex + 2]);
        const localDelta = end.clone().sub(start);
        const localLength = localDelta.length();
        if (!Number.isFinite(localLength) || localLength <= 0.000001) {
            return false;
        }

        const startWorld = start.clone();
        const endWorld = end.clone();
        object.localToWorld(startWorld);
        object.localToWorld(endWorld);
        const worldLength = startWorld.distanceTo(endWorld);
        if (!Number.isFinite(worldLength) || worldLength <= 0.000001) {
            return false;
        }

        const trimWorldLength = Math.max(0.02, Math.min(Number(distance) || 0, worldLength));
        const trimLocalLength = localLength * (trimWorldLength / worldLength);
        const trimmedEnd = start.clone().add(localDelta.normalize().multiplyScalar(trimLocalLength));

        attribute.array[0] = start.x;
        attribute.array[1] = start.y;
        attribute.array[2] = start.z;
        attribute.array[lastIndex] = trimmedEnd.x;
        attribute.array[lastIndex + 1] = trimmedEnd.y;
        attribute.array[lastIndex + 2] = trimmedEnd.z;
        attribute.needsUpdate = true;
        if (object.geometry && typeof object.geometry.computeBoundingSphere === "function") {
            object.geometry.computeBoundingSphere();
        }
        return true;
    }

    function updateControllerRayVisualTrim(bridge, enabled) {
        if (!bridge) {
            return false;
        }
        if (bridge.raySpace && bridge.controllerPoseReady === false) {
            let restored = false;
            const states = Array.isArray(bridge.rayVisualStates) ? bridge.rayVisualStates : [];
            states.forEach((state) => {
                restored = restoreLinePositions(state.object, state.positions) || restored;
            });
            restored = restoreControllerRaycasterFar(bridge) || restored;
            updateRayHitMarker(bridge, null);
            bridge.rayVisualTrimmed = false;
            bridge.lastRayTrimDistance = null;
            bridge.lastRayHitSource = "";
            bridge.rayHitActionable = false;
            return restored;
        }
        const hit = resolveDialogRayHit(bridge, activePanel);
        const hitDistance = hit && Number(hit.distance);
        const shouldTrim = Boolean(enabled && hit && Number.isFinite(hitDistance) && hitDistance > 0);
        let changed = false;

        const states = Array.isArray(bridge.rayVisualStates) ? bridge.rayVisualStates : [];
        states.forEach((state) => {
            if (shouldTrim) {
                changed = setLineVisualLength(state, hitDistance) || changed;
            } else {
                changed = restoreLinePositions(state.object, state.positions) || changed;
            }
        });
        if (shouldTrim) {
            changed = setControllerRaycasterFar(bridge, hitDistance) || changed;
        } else {
            changed = restoreControllerRaycasterFar(bridge) || changed;
        }
        updateRayHitMarker(bridge, shouldTrim && bridge.showRayHitDot !== false ? hit : null);

        bridge.rayVisualTrimmed = shouldTrim;
        bridge.lastRayTrimDistance = shouldTrim
            ? Math.round(hitDistance * 1000) / 1000
            : null;
        bridge.lastRayHitSource = shouldTrim ? hit.source || "" : "";
        bridge.rayHitActionable = shouldTrim && hit.actionable === true;
        if (shouldTrim) {
            bridge.rayVisualTrimCount = (bridge.rayVisualTrimCount || 0) + 1;
        }
        return changed;
    }

    function attachInput(panelState) {
        const scene = panelState.scene;
        const target = panelState.root;
        if (!scene || !target) {
            return;
        }

        if (scene.renderer && typeof scene.renderer.setTransparentSort === "function") {
            scene.renderer.setTransparentSort(reversePainterSortStable);
        }
        if (scene.renderer) {
            scene.renderer.localClippingEnabled = true;
        }

        if (scene.canvas && scene.camera && typeof forwardHtmlEvents === "function") {
            try {
                panelState.htmlEventForwarder = forwardHtmlEvents(scene.canvas, () => scene.camera, target, {
                    batchEvents: false,
                    intersectEveryFrame: true,
                    forwardPointerCapture: false
                });
            } catch (error) {
                recordDiagnostic("warn", "Could not attach pmndrs HTML pointer forwarding.", {
                    error: error && error.message || String(error)
                });
            }
        }

        if (scene.canvas) {
            ["click", "dblclick", "contextmenu"].forEach((type) => {
                const handler = stopNativeEvent;
                scene.canvas.addEventListener(type, handler, true);
                panelState.nativeListeners.push({ el: scene.canvas, type, handler, capture: true });
            });
        }

        if (!scene.camera || typeof createRayPointer !== "function") {
            return;
        }

        const aframePointerCount = attachAFrameControllerPointers(panelState, target);
        if (aframePointerCount > 0) {
            panelState.hasAFrameControllerPointers = true;
            recordDiagnostic("debug", "Attached A-Frame pmndrs controller pointers.", {
                count: aframePointerCount,
                attempts: panelState.controllerPointerAttachAttempts || 0,
                poseWaits: panelState.controllerPointerPoseWaits || 0
            });
            return;
        }

        const nativePointerCount = attachNativeWebXRControllerPointers(panelState, target);
        if (nativePointerCount > 0) {
            recordDiagnostic("debug", "Attached native WebXR pmndrs controller pointers.", {
                count: nativePointerCount
            });
        }
    }

    function detachInput(panelState) {
        if (!panelState) {
            return;
        }
        if (panelState.htmlEventForwarder && typeof panelState.htmlEventForwarder.destroy === "function") {
            panelState.htmlEventForwarder.destroy();
        }
        panelState.htmlEventForwarder = null;

        panelState.nativeListeners.forEach((listener) => {
            if (listener && listener.el) {
                listener.el.removeEventListener(listener.type, listener.handler, listener.capture);
            }
        });
        panelState.nativeListeners = [];

        panelState.controllerPointerBridges.forEach((bridge) => {
            detachControllerPointerBridge(bridge);
        });
        panelState.controllerPointerBridges = [];
    }

    function refreshAFrameRaycasters() {
        document.querySelectorAll("[raycaster]").forEach((el) => {
            const component = el && el.components && el.components.raycaster;
            if (component && typeof component.refreshObjects === "function") {
                component.refreshObjects();
            }
        });
    }

    function isControllerPointerElement(el) {
        if (!el || !el.matches) {
            return false;
        }
        return el.id === "oculusRight" ||
            el.id === "oculusLeft" ||
            Boolean(el.hasAttribute && el.hasAttribute("laser-controls"));
    }

    function suppressSceneRaycastTargets(panelState, active) {
        if (!panelState) {
            return 0;
        }
        if (active) {
            panelState.suppressedSceneRaycastTargets = panelState.suppressedSceneRaycastTargets || new Map();
            let changed = 0;
            document.querySelectorAll(".raycastable").forEach((el) => {
                if (!el || !el.classList || isControllerPointerElement(el)) {
                    return;
                }
                if (!panelState.suppressedSceneRaycastTargets.has(el)) {
                    panelState.suppressedSceneRaycastTargets.set(el, {
                        raycastable: el.classList.contains("raycastable")
                    });
                }
                if (el.classList.contains("raycastable")) {
                    el.classList.remove("raycastable");
                    changed += 1;
                }
            });
            if (changed > 0) {
                refreshAFrameRaycasters();
                recordDiagnostic("debug", "Suppressed scene raycast targets behind spatial UI panel.", {
                    changed,
                    total: panelState.suppressedSceneRaycastTargets.size
                });
            }
            return changed;
        }

        const suppressed = panelState.suppressedSceneRaycastTargets;
        if (!suppressed) {
            return 0;
        }
        let restored = 0;
        suppressed.forEach((state, el) => {
            if (!el || !el.isConnected || !el.classList) {
                return;
            }
            el.classList.toggle("raycastable", Boolean(state.raycastable));
            restored += 1;
        });
        panelState.suppressedSceneRaycastTargets = null;
        if (restored > 0) {
            refreshAFrameRaycasters();
            recordDiagnostic("debug", "Restored scene raycast targets after spatial UI panel close.", {
                restored
            });
        }
        return restored;
    }

    function suppressSceneControls(panelState, active) {
        if (!panelState) {
            return;
        }
        if (active) {
            const selector = SCENE_CONTROL_SELECTORS.join(",");
            document.querySelectorAll(selector).forEach((el) => {
                if (!el || !el.setAttribute || panelState.suppressedControls.has(el)) {
                    return;
                }
                panelState.suppressedControls.set(el, {
                    visible: el.getAttribute("visible"),
                    raycastable: el.classList && el.classList.contains("raycastable")
                });
                el.setAttribute("visible", "false");
                if (el.classList) {
                    el.classList.remove("raycastable");
                }
            });
            return;
        }
        panelState.suppressedControls.forEach((state, el) => {
            if (!el || !el.isConnected || !el.setAttribute) {
                return;
            }
            if (state.visible === null || state.visible === undefined) {
                el.removeAttribute("visible");
            } else {
                el.setAttribute("visible", state.visible);
            }
            if (el.classList) {
                el.classList.toggle("raycastable", Boolean(state.raycastable));
            }
        });
        panelState.suppressedControls.clear();
    }

    function setSceneInteractionLocked(isLocked) {
        const overlayApi = window.VRODOSRuntimeOverlay || null;
        if (overlayApi && typeof overlayApi.lockSceneInteraction === "function") {
            overlayApi.lockSceneInteraction(Boolean(isLocked), { preserveLookInVr: true });
        }
    }

    function panelScaleForOptions(options) {
        const configured = Number(options && (options.panelScale !== undefined ? options.panelScale : options.spatialScale));
        if (Number.isFinite(configured) && configured > 0) {
            return configured;
        }
        return getPresentationMode() === "immersive-xr"
            ? DEFAULT_XR_PANEL_SCALE
            : DEFAULT_INLINE_PANEL_SCALE;
    }

    function adaptivePanelScale(baseScale, cameraPosition, worldPosition) {
        const configured = Number(baseScale);
        const scale = Number.isFinite(configured) && configured > 0 ? configured : 1;
        if (!cameraPosition || !worldPosition || typeof cameraPosition.distanceTo !== "function") {
            return scale;
        }
        const distance = cameraPosition.distanceTo(worldPosition);
        if (!Number.isFinite(distance) || distance <= PANEL_ADAPTIVE_SCALE_DISTANCE) {
            return scale;
        }
        const growth = 1 + ((distance - PANEL_ADAPTIVE_SCALE_DISTANCE) * 0.5 / PANEL_ADAPTIVE_SCALE_DISTANCE);
        return scale * Math.min(PANEL_ADAPTIVE_SCALE_MAX, growth);
    }

    function resolveAnchorObject(options) {
        if (!options) {
            return null;
        }
        if (options.anchorObject3D) {
            return options.anchorObject3D;
        }
        if (options.anchorElement && options.anchorElement.object3D) {
            return options.anchorElement.object3D;
        }
        if (options.anchorElementId && typeof document !== "undefined") {
            const el = document.getElementById(String(options.anchorElementId));
            return el && el.object3D || null;
        }
        return null;
    }

    function orientGroupTowardCamera(group, worldPosition, cameraPosition, poseSource, scale) {
        const THREE = getThreeRuntime();
        if (!THREE || !group || !worldPosition || !cameraPosition) {
            return false;
        }
        const zAxis = cameraPosition.clone().sub(worldPosition);
        zAxis.y = 0;
        if (zAxis.lengthSq() < 0.000001) {
            zAxis.set(0, 0, 1);
        } else {
            zAxis.normalize();
        }
        const up = new THREE.Vector3(0, 1, 0);
        let xAxis = up.clone().cross(zAxis);
        if (xAxis.lengthSq() < 0.000001) {
            xAxis = new THREE.Vector3(1, 0, 0);
        } else {
            xAxis.normalize();
        }
        const yAxis = zAxis.clone().cross(xAxis).normalize();
        const matrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);

        group.position.copy(worldPosition);
        group.quaternion.setFromRotationMatrix(matrix);
        group.scale.setScalar(Math.max(0.1, numberOrDefault(scale, 1)));
        group.userData = group.userData || {};
        group.userData.vrodosAnchorPoseSource = poseSource || "unknown";
        group.userData.vrodosSpatialPanelScale = Math.max(0.1, numberOrDefault(scale, 1));
        group.updateMatrixWorld(true);
        return true;
    }

    function anchorGroupNearObject(group, options) {
        const THREE = getThreeRuntime();
        const scene = getScene();
        const cameraPose = getAnchorCameraObject(scene);
        const cameraObject = cameraPose && cameraPose.object;
        const anchorObject = resolveAnchorObject(options);
        if (!THREE || !scene || !group || !cameraObject || !anchorObject) {
            return false;
        }

        if (scene.object3D && typeof scene.object3D.updateMatrixWorld === "function") {
            scene.object3D.updateMatrixWorld(true);
        }
        if (typeof cameraObject.updateMatrixWorld === "function") {
            cameraObject.updateMatrixWorld(true);
        }
        if (typeof anchorObject.updateMatrixWorld === "function") {
            anchorObject.updateMatrixWorld(true);
        }

        const cameraPosition = new THREE.Vector3();
        const anchorPosition = new THREE.Vector3();
        cameraObject.getWorldPosition(cameraPosition);
        anchorObject.getWorldPosition(anchorPosition);

        const towardCamera = cameraPosition.clone().sub(anchorPosition);
        towardCamera.y = 0;
        if (towardCamera.lengthSq() < 0.000001) {
            towardCamera.set(0, 0, 1);
        } else {
            towardCamera.normalize();
        }

        let right = new THREE.Vector3(0, 1, 0).cross(towardCamera);
        if (right.lengthSq() < 0.000001) {
            right.set(1, 0, 0);
        } else {
            right.normalize();
        }

        const baseScale = panelScaleForOptions(options);
        const width = Math.max(0.1, numberOrDefault(options && options.width, DEFAULT_WIDTH)) * baseScale;
        const height = Math.max(0.1, numberOrDefault(options && options.height, DEFAULT_HEIGHT)) * baseScale;
        const side = options && options.anchorSide === "left" ? -1 : 1;
        const horizontalOffset = numberOrDefault(options && options.anchorHorizontalOffset, (width * 0.5) + 0.45);
        const verticalOffset = numberOrDefault(options && options.verticalOffset, 0);
        const worldPosition = anchorPosition.clone().addScaledVector(right, horizontalOffset * side);
        const finalScale = adaptivePanelScale(baseScale, cameraPosition, worldPosition);
        const finalHeight = Math.max(0.1, numberOrDefault(options && options.height, DEFAULT_HEIGHT)) * finalScale;

        if (options && options.centerAtEyeLevel === true) {
            worldPosition.y = cameraPosition.y + verticalOffset;
        } else if (options && options.topAtEyeLevel === true) {
            worldPosition.y = cameraPosition.y - (finalHeight * 0.5) + verticalOffset;
        } else {
            worldPosition.y += numberOrDefault(options && options.anchorVerticalOffset, 0.25);
        }

        return orientGroupTowardCamera(group, worldPosition, cameraPosition, "object-anchor", finalScale);
    }

    function anchorGroupInFrontOfCamera(group, options) {
        const THREE = getThreeRuntime();
        const scene = getScene();
        const cameraPose = getAnchorCameraObject(scene);
        const cameraObject = cameraPose && cameraPose.object;
        if (!THREE || !scene || !group || !cameraObject) {
            return false;
        }

        if (scene.object3D && typeof scene.object3D.updateMatrixWorld === "function") {
            scene.object3D.updateMatrixWorld(true);
        }
        if (typeof cameraObject.updateMatrixWorld === "function") {
            cameraObject.updateMatrixWorld(true);
        }

        const distance = Math.max(0.25, numberOrDefault(options && options.distance, DEFAULT_DISTANCE));
        const verticalOffset = numberOrDefault(options && options.verticalOffset, DEFAULT_VERTICAL_OFFSET);
        const horizontalOffset = numberOrDefault(options && options.horizontalOffset, 0);
        const panelScale = panelScaleForOptions(options);
        const height = Math.max(0.1, numberOrDefault(options && options.height, DEFAULT_HEIGHT)) * panelScale;
        const cameraPosition = new THREE.Vector3();
        const cameraQuaternion = new THREE.Quaternion();
        const forward = new THREE.Vector3(0, 0, -1);

        cameraObject.getWorldPosition(cameraPosition);
        cameraObject.getWorldQuaternion(cameraQuaternion);
        forward.applyQuaternion(cameraQuaternion);
        if (!(options && options.useCameraPitch === true)) {
            forward.y = 0;
        }
        if (forward.lengthSq() < 0.000001) {
            forward.set(0, 0, -1);
        } else {
            forward.normalize();
        }

        const worldPosition = cameraPosition.clone().addScaledVector(forward, distance);
        if (horizontalOffset !== 0) {
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraQuaternion);
            right.y = 0;
            if (right.lengthSq() > 0.000001) {
                worldPosition.addScaledVector(right.normalize(), horizontalOffset);
            }
        }
        if (options && options.centerAtEyeLevel === true) {
            worldPosition.y = cameraPosition.y + verticalOffset;
        } else if (options && options.topAtEyeLevel === true) {
            worldPosition.y = cameraPosition.y - (height * 0.5) + verticalOffset;
        } else {
            worldPosition.y += verticalOffset;
        }

        return orientGroupTowardCamera(group, worldPosition, cameraPosition, cameraPose.source || "unknown", panelScale);
    }

    function initialAnchorRefreshFrames(config) {
        const configured = Number(config && config.anchorRefreshFrames);
        if (Number.isFinite(configured)) {
            return Math.max(0, Math.round(configured));
        }
        return getPresentationMode() === "immersive-xr"
            ? DEFAULT_XR_ANCHOR_REFRESH_FRAMES
            : DEFAULT_INLINE_ANCHOR_REFRESH_FRAMES;
    }

    function refreshPanelAnchor(panelState) {
        if (!panelState || !panelState.group) {
            return false;
        }
        const options = panelState.anchorOptions || panelState.config || {};
        const anchored = anchorGroupNearObject(panelState.group, options) ||
            anchorGroupInFrontOfCamera(panelState.group, options);
        if (anchored) {
            panelState.anchorPoseSource = panelState.group &&
                panelState.group.userData &&
                panelState.group.userData.vrodosAnchorPoseSource || "";
        }
        return anchored;
    }

    function append(parent, child) {
        if (!parent || !child || typeof parent.add !== "function") {
            return child;
        }
        parent.add(child);
        return child;
    }

    function baseContainerProps(options) {
        const props = Object.assign({
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "flex-start",
            gap: 0,
            pointerEvents: "none",
            depthTest: false,
            depthWrite: false,
            renderOrder: PANEL_RENDER_ORDER
        }, options || {});
        if (props.gap !== undefined) {
            props.gapRow = props.gapRow !== undefined ? props.gapRow : props.gap;
            props.gapColumn = props.gapColumn !== undefined ? props.gapColumn : props.gap;
            delete props.gap;
        }
        if (props.padding !== undefined) {
            props.paddingTop = props.paddingTop !== undefined ? props.paddingTop : props.padding;
            props.paddingRight = props.paddingRight !== undefined ? props.paddingRight : props.padding;
            props.paddingBottom = props.paddingBottom !== undefined ? props.paddingBottom : props.padding;
            props.paddingLeft = props.paddingLeft !== undefined ? props.paddingLeft : props.padding;
            delete props.padding;
        }
        if (props.paddingX !== undefined) {
            props.paddingLeft = props.paddingLeft !== undefined ? props.paddingLeft : props.paddingX;
            props.paddingRight = props.paddingRight !== undefined ? props.paddingRight : props.paddingX;
            delete props.paddingX;
        }
        if (props.paddingY !== undefined) {
            props.paddingTop = props.paddingTop !== undefined ? props.paddingTop : props.paddingY;
            props.paddingBottom = props.paddingBottom !== undefined ? props.paddingBottom : props.paddingY;
            delete props.paddingY;
        }
        return props;
    }

    function createPanelApi(panelState) {
        function withPanelFontDefaults(options) {
            const opts = options || {};
            const config = panelState && panelState.config || {};
            if (opts.useImmediateFont !== undefined || opts.fontFamily || opts.fontFamilies) {
                return opts;
            }
            if (config.useImmediateFont !== true && !config.fontFamily && !config.fontFamilies) {
                return opts;
            }
            return Object.assign({
                useImmediateFont: config.useImmediateFont === true,
                fontFamily: config.fontFamily,
                fontFamilies: config.fontFamilies
            }, opts);
        }

        function resolveButtonProps(options) {
            const opts = options || {};
            const disabled = Boolean(opts.disabled);
            return baseContainerProps({
                variant: opts.variant || (opts.negative ? "negative" : "primary"),
                size: opts.size || "lg",
                disabled,
                width: opts.width,
                height: opts.height,
                minWidth: opts.minWidth,
                minHeight: opts.minHeight,
                flexGrow: opts.flexGrow,
                flexShrink: opts.flexShrink !== undefined ? opts.flexShrink : 0,
                pointerEvents: disabled ? "none" : "auto",
                zIndex: opts.zIndex || 30,
                onClick: disabled ? undefined : opts.onClick
            });
        }

        function resolveButtonTextProps(options) {
            const opts = withPanelFontDefaults(options);
            const disabled = Boolean(opts.disabled);
            return baseContainerProps(Object.assign({
                text: normalizeSpatialText(opts.label || ""),
                color: opts.textColor || (disabled ? "rgba(39,39,39,0.35)" : undefined),
                fontSize: px(opts.fontSize, opts.textSize || 30),
                lineHeight: opts.lineHeight || opts.textLineHeight || "118%",
                fontWeight: opts.fontWeight || 500,
                textAlign: "center",
                verticalAlign: "center",
                width: "100%",
                wordBreak: opts.wordBreak || "break-word",
                whiteSpace: "normal",
                pointerEvents: "none"
            }, fontProps(opts)));
        }

        const api = {
            __spatialUi: true,
            root: panelState.root,
            group: panelState.group,
            scene: panelState.scene,
            width: panelState.width,
            height: panelState.height,
            content: null,
            footer: null,
            renderCount: 0,
            _children: [],

            close: function (reason) {
                closePanel(reason || "close");
            },

            clear: function () {
                this._children.forEach((child) => disposeComponentTree(child));
                this._children = [];
                this.content = null;
                this.footer = null;
            },

            appendRoot: function (child) {
                append(this.root, child);
                this._children.push(child);
                return child;
            },

            container: function (parent, options) {
                return append(parent || this.content || this.root, new Container(baseContainerProps(options)));
            },

            row: function (parent, options) {
                return this.container(parent, Object.assign({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gapColumn: 24
                }, options || {}));
            },

            column: function (parent, options) {
                return this.container(parent, Object.assign({
                    flexDirection: "column",
                    alignItems: "stretch",
                    justifyContent: "flex-start",
                    gapRow: 24
                }, options || {}));
            },

            scroll: function (parent, options) {
                return this.container(parent, Object.assign({
                    flexDirection: "column",
                    alignItems: "stretch",
                    justifyContent: "flex-start",
                    flexGrow: 1,
                    width: "100%",
                    overflow: "scroll",
                    scrollbarWidth: 12,
                    scrollbarColor: "rgba(39,39,39,0.38)",
                    scrollbarBorderRadius: 999,
                    gapRow: 24,
                    pointerEvents: "listener",
                    zIndex: 8
                }, options || {}));
            },

            text: function (parent, options) {
                const opts = withPanelFontDefaults(options);
                const text = new Text(baseContainerProps(Object.assign({
                    text: normalizeSpatialText(opts.text !== undefined ? opts.text : (opts.value || "")),
                    color: opts.color || "#272727",
                    fontSize: px(opts.fontSize, opts.size || 34),
                    lineHeight: opts.lineHeight || "120%",
                    fontWeight: opts.fontWeight || "normal",
                    textAlign: opts.align || opts.textAlign || "left",
                    verticalAlign: opts.verticalAlign || "center",
                    width: opts.width,
                    height: opts.height,
                    minHeight: opts.minHeight,
                    maxWidth: opts.maxWidth,
                    flexGrow: opts.flexGrow,
                    flexShrink: opts.flexShrink !== undefined ? opts.flexShrink : 1,
                    wordBreak: opts.wordBreak || "break-word",
                    whiteSpace: opts.whiteSpace || "normal",
                    pointerEvents: "none",
                    zIndex: opts.zIndex || 20
                }, fontProps(opts))));
                return append(parent || this.content || this.root, text);
            },

            updateText: function (text, options) {
                if (!text || typeof text.setProperties !== "function") {
                    return text || null;
                }
                const opts = withPanelFontDefaults(options);
                text.setProperties(baseContainerProps(Object.assign({
                    text: normalizeSpatialText(opts.text !== undefined ? opts.text : (opts.value || "")),
                    color: opts.color || "#272727",
                    fontSize: px(opts.fontSize, opts.size || 34),
                    lineHeight: opts.lineHeight || "120%",
                    fontWeight: opts.fontWeight || "normal",
                    textAlign: opts.align || opts.textAlign || "left",
                    verticalAlign: opts.verticalAlign || "center",
                    width: opts.width,
                    height: opts.height,
                    minHeight: opts.minHeight,
                    maxWidth: opts.maxWidth,
                    flexGrow: opts.flexGrow,
                    flexShrink: opts.flexShrink !== undefined ? opts.flexShrink : 1,
                    wordBreak: opts.wordBreak || "break-word",
                    whiteSpace: opts.whiteSpace || "normal",
                    pointerEvents: "none",
                    zIndex: opts.zIndex || 20
                }, fontProps(opts))));
                return text;
            },

            button: function (parent, options) {
                const opts = options || {};
                const disabled = Boolean(opts.disabled);
                const button = new HorizonButton(resolveButtonProps(opts));
                button.name = "VRODOSSpatialUIActionButton";
                button.userData = button.userData || {};
                button.userData.vrodosSpatialActionable = !disabled && typeof opts.onClick === "function";
                button.userData.vrodosSpatialButtonOptions = Object.assign({}, opts);
                const label = new ButtonLabel(baseContainerProps({
                    justifyContent: "center",
                    alignItems: "center",
                    flexGrow: 1,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none"
                }));
                const labelText = new Text(resolveButtonTextProps(opts));
                label.add(labelText);
                button.add(label);
                button.userData.vrodosSpatialButtonLabel = labelText;
                return append(parent || this.content || this.root, button);
            },

            updateButton: function (button, options) {
                if (!button) {
                    return null;
                }
                button.userData = button.userData || {};
                const opts = Object.assign({}, button.userData.vrodosSpatialButtonOptions || {}, options || {});
                const disabled = Boolean(opts.disabled);
                button.userData.vrodosSpatialButtonOptions = Object.assign({}, opts);
                button.userData.vrodosSpatialActionable = !disabled && typeof opts.onClick === "function";
                if (typeof button.setProperties === "function") {
                    button.setProperties(resolveButtonProps(opts));
                }
                const labelText = button.userData.vrodosSpatialButtonLabel;
                if (labelText && typeof labelText.setProperties === "function") {
                    labelText.setProperties(resolveButtonTextProps(opts));
                }
                return button;
            },

            image: function (parent, options) {
                const opts = options || {};
                const image = new Image(baseContainerProps({
                    src: opts.src || "",
                    objectFit: opts.objectFit || "cover",
                    width: opts.width,
                    height: opts.height,
                    maxWidth: opts.maxWidth,
                    maxHeight: opts.maxHeight,
                    minHeight: opts.minHeight,
                    keepAspectRatio: opts.keepAspectRatio !== false,
                    borderRadius: opts.borderRadius || 16,
                    pointerEvents: "none",
                    zIndex: opts.zIndex || 15
                }));
                return append(parent || this.content || this.root, image);
            },

            grid: function (parent, items, options) {
                const opts = options || {};
                const columns = Math.max(1, Number(opts.columns) || 2);
                const grid = this.column(parent, {
                    gapRow: opts.gapY !== undefined ? opts.gapY : 20,
                    width: opts.width || "100%"
                });
                for (let index = 0; index < items.length; index += columns) {
                    const row = this.row(grid, {
                        gapColumn: opts.gapX !== undefined ? opts.gapX : 20,
                        alignItems: "stretch",
                        justifyContent: "center",
                        width: "100%"
                    });
                    items.slice(index, index + columns).forEach((item) => {
                        this.button(row, Object.assign({
                            flexGrow: 1,
                            minHeight: opts.itemHeight || opts.height || 72,
                            height: opts.itemHeight || opts.height
                        }, item));
                    });
                }
                return grid;
            },

            frame: function (options) {
                const opts = withPanelFontDefaults(options);
                this.renderCount += 1;
                panelState.renderCount = this.renderCount;
                this.clear();
                const rawTitle = opts.title || "";
                const titleValue = opts.titleMaxLines
                    ? clampTextToApproximateLines(rawTitle, opts.titleMaxLines, opts.titleMaxCharsPerLine)
                    : (opts.titleMaxLength && String(rawTitle).length > opts.titleMaxLength
                        ? String(rawTitle).slice(0, Math.max(0, opts.titleMaxLength - 3)).trimEnd() + "..."
                        : rawTitle);

                const header = new Container(baseContainerProps({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: opts.headerColor || "#272727",
                    paddingX: opts.headerPaddingX !== undefined ? opts.headerPaddingX : 72,
                    height: opts.headerHeight || 168,
                    gapColumn: opts.headerGapColumn !== undefined ? opts.headerGapColumn : 32,
                    pointerEvents: "none",
                    zIndex: 10
                }));
                const titleColumn = new Container(baseContainerProps({
                    flexDirection: "column",
                    justifyContent: "center",
                    flexGrow: 1,
                    flexShrink: 1,
                    flexBasis: 0,
                    minWidth: 0,
                    pointerEvents: "none"
                }));
                titleColumn.add(new Text(baseContainerProps(Object.assign({
                    text: normalizeSpatialText(titleValue),
                    color: "#ffffff",
                    fontSize: opts.titleSize || 46,
                    lineHeight: opts.titleLineHeight || "112%",
                    fontWeight: 600,
                    textAlign: "left",
                    verticalAlign: "center",
                    width: "100%",
                    height: opts.titleHeight,
                    wordBreak: opts.titleWordBreak || "keep-all",
                    whiteSpace: opts.titleWhiteSpace || "normal",
                    pointerEvents: "none"
                }, fontProps(opts)))));
                header.add(titleColumn);
                if (opts.showClose !== false) {
                    this.button(header, {
                        label: "X",
                        variant: "negative",
                        width: opts.closeButtonWidth || 74,
                        height: opts.closeButtonHeight || 58,
                        minWidth: opts.closeButtonMinWidth || 58,
                        textSize: opts.closeButtonTextSize || 24,
                        fontWeight: opts.closeButtonFontWeight || 500,
                        flexShrink: 0,
                        onClick: opts.onClose || this.close.bind(this)
                    });
                }

                const content = new Container(baseContainerProps({
                    flexDirection: "column",
                    alignItems: "stretch",
                    justifyContent: "flex-start",
                    flexGrow: 1,
                    paddingX: opts.paddingX !== undefined ? opts.paddingX : 88,
                    paddingY: opts.paddingY !== undefined ? opts.paddingY : 70,
                    paddingTop: opts.paddingTop,
                    paddingBottom: opts.paddingBottom,
                    gapRow: opts.gapY !== undefined ? opts.gapY : 34,
                    pointerEvents: "none",
                    zIndex: 5
                }));
                const contentHost = opts.scrollContent === true
                    ? new Container(baseContainerProps({
                        flexDirection: "column",
                        alignItems: "stretch",
                        justifyContent: "flex-start",
                        flexGrow: 1,
                        width: "100%",
                        overflow: "scroll",
                        scrollbarWidth: opts.scrollbarWidth || 12,
                        scrollbarColor: opts.scrollbarColor || "rgba(39,39,39,0.38)",
                        scrollbarBorderRadius: opts.scrollbarBorderRadius || 999,
                        gapRow: opts.scrollGapY !== undefined ? opts.scrollGapY : (opts.gapY !== undefined ? opts.gapY : 34),
                        pointerEvents: "listener",
                        zIndex: 8
                    }))
                    : content;
                if (contentHost !== content) {
                    content.add(contentHost);
                }
                const footer = new Container(baseContainerProps({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingX: opts.paddingX !== undefined ? opts.paddingX : 88,
                    paddingBottom: opts.footerPaddingBottom !== undefined ? opts.footerPaddingBottom : 58,
                    gapColumn: 28,
                    height: opts.footerHeight || 120,
                    pointerEvents: "none",
                    zIndex: 5
                }));

                this.appendRoot(header);
                this.appendRoot(content);
                this.appendRoot(footer);
                this.content = contentHost;
                this.footer = footer;

                if (opts.status) {
                    const statusText = this.text(footer, {
                        text: opts.status,
                        color: "#5a5a5a",
                        fontSize: opts.statusFontSize || 28,
                        lineHeight: opts.statusLineHeight || "112%",
                        flexGrow: 1,
                        flexShrink: 1,
                        wordBreak: opts.statusWordBreak || "keep-all",
                        whiteSpace: opts.statusWhiteSpace || "normal"
                    });
                    footer.userData = footer.userData || {};
                    footer.userData.vrodosSpatialStatusText = statusText;
                } else {
                    footer.add(new Container(baseContainerProps({ flexGrow: 1 })));
                }
                let primaryButton = null;
                if (opts.primary && opts.primary.visible !== false) {
                    primaryButton = this.button(footer, {
                        label: opts.primary.label || "Finish",
                        variant: opts.primary.variant || "positive",
                        disabled: Boolean(opts.primary.disabled),
                        width: opts.primary.width || 220,
                        height: opts.primary.height || 62,
                        textSize: opts.primary.textSize || 26,
                        onClick: opts.primary.onClick
                    });
                }

                recordDiagnostic("debug", "Rendered pmndrs Horizon frame.", {
                    id: panelState.id || "",
                    renderCount: this.renderCount,
                    title: opts.title || ""
                });

                return {
                    root: this.root,
                    header,
                    content: contentHost,
                    contentOuter: content,
                    footer,
                    statusText: footer.userData && footer.userData.vrodosSpatialStatusText || null,
                    primaryButton
                };
            },

            refreshTargets: function () {
                // PMNDRS pointer events compute intersections directly; no A-Frame raycaster refresh.
            },

            getDiagnostics: function () {
                return {
                    id: panelState.id || "",
                    renderCount: panelState.renderCount || 0,
                    controllerPointers: panelState.controllerPointerBridges.length,
                    controllerPointerAttachAttempts: panelState.controllerPointerAttachAttempts || 0,
                    controllerPointerPoseWaits: panelState.controllerPointerPoseWaits || 0,
                    controllerPointerSources: panelState.controllerPointerBridges.map((bridge) => ({
                        source: bridge.source || "",
                        lastIntersectionName: bridge.lastIntersectionName || "",
                        lastIntersectionDistance: bridge.lastIntersectionDistance,
                        lastIntersectionIsVoid: bridge.lastIntersectionIsVoid === true,
                        controllerPoseReady: bridge.controllerPoseReady !== false,
                        controllerPoseWaitCount: bridge.controllerPoseWaitCount || 0,
                        lastControllerPoseReason: bridge.lastControllerPoseReason || "",
                        lastControllerTrackingStatus: bridge.lastControllerTrackingStatus || null,
                        usesAFrameRaycasterRay: bridge.usesAFrameRaycasterRay === true,
                        usesControllerObjectPose: bridge.usesControllerObjectPose === true,
                        stableAFrameRaySeen: bridge.stableAFrameRaySeen === true,
                        controllerRayReadinessBypassed: bridge.controllerRayReadinessBypassed === true,
                        rayVisualPromoted: bridge.rayVisualPromoted === true,
                        rayVisualTrimmed: bridge.rayVisualTrimmed === true,
                        lastRayTrimDistance: bridge.lastRayTrimDistance,
                        rayVisualTrimCount: bridge.rayVisualTrimCount || 0,
                        raycasterFarTrimmed: bridge.raycasterFarTrimmed === true,
                        rayHitDotVisible: Boolean(bridge.rayHitMarker && bridge.rayHitMarker.visible),
                        rayHitActionable: bridge.rayHitActionable === true,
                        lastRayHitSource: bridge.lastRayHitSource || "",
                        usesControllerVisualRay: bridge.usesControllerVisualRay === true
                    })),
                    presentationMode: getPresentationMode(),
                    anchorPoseSource: panelState.anchorPoseSource || "",
                    centerAtEyeLevel: panelState.anchorOptions && panelState.anchorOptions.centerAtEyeLevel === true,
                    sceneRaycastTargetsSuppressed: panelState.suppressedSceneRaycastTargets
                        ? panelState.suppressedSceneRaycastTargets.size
                        : 0
                };
            }
        };
        return api;
    }

    function createPanelState(config) {
        const THREE = getThreeRuntime();
        const scene = getScene();
        const width = numberOrDefault(config && config.width, DEFAULT_WIDTH);
        const height = numberOrDefault(config && config.height, DEFAULT_HEIGHT);
        const panelScale = panelScaleForOptions(config || {});
        const metrics = resolvePanelMetrics(config || {}, width, height);
        const group = new THREE.Group();
        const root = new HorizonPanel(Object.assign({
            width: metrics.designWidthPx,
            height: metrics.designHeightPx,
            sizeX: width,
            sizeY: height,
            pixelSize: metrics.pixelSize,
            anchorX: "center",
            anchorY: "center",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "flex-start",
            overflow: "hidden",
            borderRadius: 24,
            borderWidth: 1,
            backgroundColor: config.background || "#f2f2f2",
            borderColor: config.borderColor || "#d9d9d9",
            color: "#272727",
            pointerEvents: "listener",
            depthTest: false,
            depthWrite: false,
            renderOrder: PANEL_RENDER_ORDER,
            zIndex: 0
        }, fontProps(config || {})));

        group.name = "VRODOSSpatialUIPanelGroup";
        root.name = "VRODOSSpatialUIHorizonPanel";
        root.frustumCulled = false;
        group.add(root);
        scene.object3D.add(group);

        const panelState = {
            id: config.id || "",
            scene,
            group,
            root,
            width,
            height,
            metrics,
            config,
            anchorOptions: Object.assign({ panelScale }, config || {}),
            anchorRefreshFrames: initialAnchorRefreshFrames(config || {}),
            anchorPoseSource: "",
            api: null,
            renderCount: 0,
            htmlEventForwarder: null,
            controllerPointerBridges: [],
            controllerPointerAttachAttempts: 0,
            controllerPointerPoseWaits: 0,
            rayVisualPromoteFrames: 90,
            rayTrimEnabled: config.trimControllerRays !== false,
            showRayHitDot: config.showRayHitDot !== false,
            blockSceneRaycasts: config.blockSceneRaycasts !== false,
            sceneRaycastSuppressionRefreshCountdown: 0,
            suppressedSceneRaycastTargets: null,
            hasAFrameControllerPointers: false,
            nativeListeners: [],
            suppressedControls: new Map(),
            cleanup: config.cleanup || null,
            onClose: config.onClose || null,
            locked: config.lockInteraction !== false
        };
        refreshPanelAnchor(panelState);
        return panelState;
    }

    function ensureAFrameHostComponent() {
        if (!window.AFRAME || !window.AFRAME.registerComponent) {
            return;
        }
        if (!hostComponentRegistered) {
            if (window.AFRAME.components && window.AFRAME.components["vrodos-spatial-ui-host"]) {
                hostComponentRegistered = true;
            } else {
                window.AFRAME.registerComponent("vrodos-spatial-ui-host", {
                    tick: function (time, delta) {
                        if (window.VRODOSSpatialUI && typeof window.VRODOSSpatialUI.__tick === "function") {
                            window.VRODOSSpatialUI.__tick(delta || 0);
                        }
                    }
                });
                hostComponentRegistered = true;
            }
        }

        const scene = getScene();
        if (scene && scene.setAttribute && !scene.hasAttribute("vrodos-spatial-ui-host")) {
            scene.setAttribute("vrodos-spatial-ui-host", "");
            hostComponentScene = scene;
            hostComponentAttachAttempts = 0;
            recordDiagnostic("debug", "Attached spatial UI host component to scene.", {
                sceneId: scene.id || ""
            });
        } else if (scene && scene.hasAttribute && scene.hasAttribute("vrodos-spatial-ui-host")) {
            hostComponentScene = scene;
            hostComponentAttachAttempts = 0;
        } else if (!scene && hostComponentAttachAttempts < 80) {
            hostComponentAttachAttempts += 1;
            window.setTimeout(ensureAFrameHostComponent, 100);
        }
    }

    function openPanel(config) {
        if (!isAvailable()) {
            recordDiagnostic("warn", "Spatial UI unavailable; no A-Frame fallback will be opened.", {
                hasAFrame: Boolean(window.AFRAME),
                hasThree: Boolean(getThreeRuntime()),
                hasScene: Boolean(getScene())
            });
            return null;
        }

        ensureAFrameHostComponent();
        warmSpatialFonts(true);
        closePanel("replace");

        let panelState = null;
        try {
            panelState = createPanelState(Object.assign({}, config || {}));
            const api = createPanelApi(panelState);
            panelState.api = api;
            activePanel = panelState;

            attachInput(panelState);
            if (panelState.blockSceneRaycasts) {
                suppressSceneRaycastTargets(panelState, true);
            }
            suppressSceneControls(panelState, true);
            if (panelState.locked) {
                setSceneInteractionLocked(true);
            }

            window.addEventListener("pagehide", dispose, { once: true });
            const scene = panelState.scene;
            if (scene && scene.addEventListener) {
                const exitVr = () => closePanel("exit-vr");
                scene.addEventListener("exit-vr", exitVr, { once: true });
                panelState.nativeListeners.push({ el: scene, type: "exit-vr", handler: exitVr, capture: false });
            }

            if (typeof panelState.config.render === "function") {
                panelState.config.render(api);
            }

            recordDiagnostic("debug", "Opened pmndrs Horizon spatial UI panel.", {
                id: panelState.id,
                width: panelState.width,
                height: panelState.height,
                designWidthPx: panelState.metrics && panelState.metrics.designWidthPx,
                designHeightPx: panelState.metrics && panelState.metrics.designHeightPx,
                pixelSize: panelState.metrics && panelState.metrics.pixelSize,
                controllers: panelState.controllerPointerBridges.length,
                anchorPoseSource: panelState.anchorPoseSource,
                anchorRefreshFrames: panelState.anchorRefreshFrames,
                centerAtEyeLevel: panelState.anchorOptions && panelState.anchorOptions.centerAtEyeLevel === true,
                trimControllerRays: panelState.rayTrimEnabled,
                showRayHitDot: panelState.showRayHitDot,
                blockSceneRaycasts: panelState.blockSceneRaycasts,
                sceneRaycastTargetsSuppressed: panelState.suppressedSceneRaycastTargets
                    ? panelState.suppressedSceneRaycastTargets.size
                    : 0
            });

            return api;
        } catch (error) {
            recordDiagnostic("error", "Failed to open pmndrs Horizon spatial UI panel.", {
                id: config && config.id || "",
                error: error && error.message || String(error),
                stack: error && error.stack || ""
            });
            if (panelState) {
                if (activePanel === panelState) {
                    closePanel("open-error");
                } else {
                    disposeComponentTree(panelState.root);
                    disposeObject3D(panelState.group);
                }
            }
            return null;
        }
    }

    function closePanel(reason) {
        const panelState = activePanel;
        if (!panelState) {
            return;
        }
        activePanel = null;
        detachInput(panelState);
        suppressSceneRaycastTargets(panelState, false);
        suppressSceneControls(panelState, false);
        if (panelState.locked) {
            setSceneInteractionLocked(false);
        }
        if (typeof panelState.cleanup === "function") {
            panelState.cleanup(reason || "close");
        }
        if (typeof panelState.onClose === "function" && reason !== "replace") {
            panelState.onClose(reason || "close", panelState.api);
        }
        if (panelState.api && typeof panelState.api.clear === "function") {
            panelState.api.clear();
        }
        disposeComponentTree(panelState.root);
        disposeObject3D(panelState.group);
        recordDiagnostic("debug", "Closed pmndrs Horizon spatial UI panel.", {
            id: panelState.id || "",
            reason: reason || "close",
            renderCount: panelState.renderCount || 0
        });
    }

    function refreshInteractionTargets() {
        // PMNDRS pointer events are refreshed every frame; retained for callers.
    }

    function dispose() {
        closePanel("spatial-ui-dispose");
    }

    const api = {
        vendor,
        isAvailable,
        openPanel,
        closePanel,
        refreshInteractionTargets,
        dispose,
        prewarm: function () {
            warmSpatialFonts(true);
            return spatialFontsReady();
        },
        getActivePanel: function () {
            return activePanel;
        },
        getDiagnostics: function () {
            return diagnosticsStore().slice();
        },
        recordDiagnostic,
        __tick: function (deltaMs) {
            if (!activePanel || !activePanel.root) {
                return;
            }
            if (activePanel.anchorRefreshFrames > 0) {
                refreshPanelAnchor(activePanel);
                activePanel.anchorRefreshFrames -= 1;
            }
            if (typeof activePanel.root.update === "function") {
                activePanel.root.update(Math.max(0, Number(deltaMs) || 0));
            }
            if (activePanel.htmlEventForwarder && typeof activePanel.htmlEventForwarder.update === "function") {
                activePanel.htmlEventForwarder.update();
            }
            if (activePanel.blockSceneRaycasts) {
                activePanel.sceneRaycastSuppressionRefreshCountdown -= 1;
                if (activePanel.sceneRaycastSuppressionRefreshCountdown <= 0) {
                    suppressSceneRaycastTargets(activePanel, true);
                    activePanel.sceneRaycastSuppressionRefreshCountdown = SCENE_RAYCAST_SUPPRESSION_REFRESH_FRAMES;
                }
            }
            if (!activePanel.hasAFrameControllerPointers &&
                activePanel.controllerPointerAttachAttempts < CONTROLLER_POINTER_ATTACH_RETRY_FRAMES) {
                activePanel.controllerPointerAttachAttempts += 1;
                const attached = attachAFrameControllerPointers(activePanel, activePanel.root);
                if (attached > 0) {
                    activePanel.hasAFrameControllerPointers = true;
                    const removedNative = detachControllerPointerBridges(activePanel, (bridge) => {
                        return bridge && typeof bridge.source === "string" && bridge.source.indexOf("native-webxr-controller-") === 0;
                    });
                    recordDiagnostic("debug", "Switched spatial UI controller pointers to A-Frame controller entities.", {
                        attached,
                        removedNative,
                        attempts: activePanel.controllerPointerAttachAttempts || 0,
                        poseWaits: activePanel.controllerPointerPoseWaits || 0
                    });
                } else if (activePanel.controllerPointerAttachAttempts % CONTROLLER_POINTER_ATTACH_RETRY_LOG_INTERVAL === 0 &&
                    activePanel.controllerPointerPoseWaits > 0) {
                    recordDiagnostic("debug", "Waiting for stable A-Frame controller pose before attaching spatial UI pointer bridge.", {
                        attempts: activePanel.controllerPointerAttachAttempts,
                        poseWaits: activePanel.controllerPointerPoseWaits
                    });
                }
            }
            activePanel.controllerPointerBridges.forEach((bridge) => {
                if (activePanel.rayVisualPromoteFrames > 0) {
                    promoteControllerRayVisual(bridge);
                }
                if (bridge && bridge.pointer && typeof bridge.pointer.move === "function") {
                    createPointerEventAndMove(bridge, activePanel.root, "pointermove");
                }
                updateControllerRayVisualTrim(bridge, activePanel.rayTrimEnabled);
            });
            if (activePanel.rayVisualPromoteFrames > 0) {
                activePanel.rayVisualPromoteFrames -= 1;
            }
        }
    };

    try {
        if (typeof setPreferredColorScheme === "function") {
            setPreferredColorScheme("light");
        }
    } catch (error) {
        recordDiagnostic("debug", "Could not force pmndrs/uikit light color scheme for VR panels.", {
            error: error && error.message || String(error)
        });
    }

    ensureAFrameHostComponent();
    warmSpatialFonts(false);
    window.VRODOSSpatialUI = api;
    recordDiagnostic("debug", "Spatial UI runtime initialized.", {
        uikit: Boolean(Container),
        horizon: Boolean(HorizonButton),
        pointerEvents: Boolean(forwardHtmlEvents),
        fontFamily: SPATIAL_UI_FONT_FAMILY
    });
}());
