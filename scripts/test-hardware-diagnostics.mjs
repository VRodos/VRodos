import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertEqual(actual, expected, label) {
    assert(actual === expected, `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function createEventTarget() {
    const listeners = new Map();
    return {
        listeners,
        addEventListener(type, handler) {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(handler);
        },
        removeEventListener(type, handler) {
            listeners.set(type, (listeners.get(type) || []).filter((candidate) => candidate !== handler));
        },
        dispatch(type) {
            (listeners.get(type) || []).slice().forEach((handler) => handler({ type }));
        }
    };
}

function createHarness() {
    const storage = new Map();
    const documentStub = {
        visibilityState: "visible",
        body: null
    };
    const windowStub = {
        document: documentStub,
        navigator: { platform: "Win32", userAgent: "Mozilla/5.0 Windows Chrome" },
        location: { search: "" },
        devicePixelRatio: 1.5,
        VRODOS_DEBUG: {},
        VRODOSMaster: { SceneSettingsHelpers: {} },
        sessionStorage: {
            getItem(key) {
                return storage.has(key) ? storage.get(key) : null;
            },
            setItem(key, value) {
                storage.set(key, String(value));
            }
        }
    };
    windowStub.window = windowStub;
    const context = {
        console,
        window: windowStub,
        document: documentStub,
        navigator: windowStub.navigator,
        URLSearchParams
    };
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(
        readFileSync(resolve(root, "assets/js/runtime/master/vrodos_hardware_diagnostics.js"), "utf8"),
        context,
        { filename: "vrodos_hardware_diagnostics.js" }
    );
    return { context, window: windowStub, document: documentStub, storage };
}

function createWebGlContext(options = {}) {
    const constants = {
        VENDOR: 1,
        RENDERER: 2,
        VERSION: 3,
        SHADING_LANGUAGE_VERSION: 4,
        MAX_TEXTURE_SIZE: 5,
        MAX_CUBE_MAP_TEXTURE_SIZE: 6,
        MAX_RENDERBUFFER_SIZE: 7,
        MAX_SAMPLES: 8,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 9
    };
    const extension = options.debug === false ? null : {
        UNMASKED_VENDOR_WEBGL: 101,
        UNMASKED_RENDERER_WEBGL: 102
    };
    const values = new Map([
        [constants.VENDOR, options.maskedVendor || "Google Inc. (Google)"],
        [constants.RENDERER, options.maskedRenderer || "ANGLE"],
        [constants.VERSION, "WebGL 2.0"],
        [constants.SHADING_LANGUAGE_VERSION, "WebGL GLSL ES 3.00"],
        [constants.MAX_TEXTURE_SIZE, 16384],
        [constants.MAX_CUBE_MAP_TEXTURE_SIZE, 16384],
        [constants.MAX_RENDERBUFFER_SIZE, 16384],
        [constants.MAX_SAMPLES, 8],
        [constants.MAX_COMBINED_TEXTURE_IMAGE_UNITS, 32]
    ]);
    if (extension) {
        values.set(extension.UNMASKED_VENDOR_WEBGL, options.vendor || "NVIDIA Corporation");
        values.set(extension.UNMASKED_RENDERER_WEBGL, options.renderer || "NVIDIA GeForce RTX 3050 Ti Laptop GPU");
    }

    return Object.assign({}, constants, {
        drawingBufferWidth: 1920,
        drawingBufferHeight: 1080,
        getParameter(parameter) {
            return values.get(parameter) ?? null;
        },
        getExtension(name) {
            return name === "WEBGL_debug_renderer_info" ? extension : null;
        },
        getContextAttributes() {
            return { alpha: true, antialias: true, powerPreference: "high-performance" };
        }
    });
}

function createRenderer(context, canvas) {
    return {
        capabilities: { isWebGL2: true },
        domElement: Object.assign(canvas || createEventTarget(), {
            clientWidth: 1280,
            clientHeight: 720,
            getBoundingClientRect: () => ({ width: 1280, height: 720 })
        }),
        getContext: () => context
    };
}

const harness = createHarness();
const Hardware = harness.window.VRODOSMaster.HardwareDiagnostics;

const classificationCases = [
    ["NVIDIA Corporation", "ANGLE (NVIDIA GeForce RTX 4090)", "Win32", "discrete-likely", "high"],
    ["Intel", "Intel(R) UHD Graphics 630", "Win32", "integrated-likely", "medium"],
    ["Intel", "Intel(R) Iris(R) Xe Graphics", "Win32", "integrated-likely", "medium"],
    ["Intel", "Intel Arc A770", "Win32", "unknown", "low"],
    ["AMD", "AMD Radeon(TM) Graphics", "Win32", "unknown", "low"],
    ["Apple Inc.", "Apple M3 Pro", "MacIntel", "unified", "high"],
    ["Google Inc.", "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))", "Win32", "software", "high"],
    ["Mesa", "llvmpipe (LLVM 18.1.0)", "Linux", "software", "high"]
];
classificationCases.forEach(([vendor, renderer, platform, adapterClass, confidence]) => {
    const result = Hardware.classifyAdapter({ vendor, renderer, platform });
    assertEqual(result.adapterClass, adapterClass, `${renderer} classification`);
    assertEqual(result.confidence, confidence, `${renderer} confidence`);
});

const nvidiaState = Hardware.readRendererState(createRenderer(createWebGlContext()));
assertEqual(nvidiaState.adapterClass, "discrete-likely", "unmasked NVIDIA adapter");
assertEqual(nvidiaState.informationSource, "webgl-debug-renderer-info", "unmasked information source");
assertEqual(nvidiaState.contextPowerPreference, "high-performance", "returned context power preference");
assertEqual(nvidiaState.drawingBuffer.width, 1920, "drawing-buffer width");
assertEqual(nvidiaState.limits.maxSamples, 8, "maximum samples");

const maskedState = Hardware.readRendererState(createRenderer(createWebGlContext({
    debug: false,
    maskedVendor: "Intel Inc.",
    maskedRenderer: "Intel(R) UHD Graphics"
})));
assertEqual(maskedState.informationSource, "masked", "masked-only information source");
assertEqual(maskedState.adapterClass, "integrated-likely", "masked-only adapter classification");

const unavailableState = Hardware.readRendererState(null);
assertEqual(unavailableState.api, "unavailable", "missing-context API fallback");
assertEqual(unavailableState.adapterClass, "unknown", "missing-context adapter fallback");
assertEqual(unavailableState.canForceAdapter, false, "adapter forcing contract");

const lowSamples = Array.from({ length: 240 }, () => 1000 / 30);
const lowPerformance = Hardware.summarizePerformance(lowSamples, 8000);
assertEqual(lowPerformance.status, "complete", "low-FPS sample status");
assertEqual(lowPerformance.averageFps, 30, "low-FPS average");
assertEqual(lowPerformance.sustainedLowFps, true, "low-FPS sustained pressure");

const goodSamples = Array.from({ length: 480 }, () => 1000 / 60);
const goodPerformance = Hardware.summarizePerformance(goodSamples, 8000);
assertEqual(goodPerformance.averageFps, 60, "healthy-FPS average");
assertEqual(goodPerformance.sustainedLowFps, false, "healthy-FPS pressure flag");

const insufficientPerformance = Hardware.summarizePerformance(Array.from({ length: 100 }, () => 80), 8000);
assertEqual(insufficientPerformance.status, "insufficient-samples", "insufficient sample status");
assertEqual(insufficientPerformance.sustainedLowFps, false, "insufficient sample warning suppression");

assertEqual(Hardware.canSample({ desktop: true, immersive: false, loaderReady: true, visible: true }), true, "eligible desktop sampling");
assertEqual(Hardware.canSample({ desktop: true, immersive: false, loaderReady: false, visible: true }), false, "loading exclusion");
assertEqual(Hardware.canSample({ desktop: true, immersive: false, loaderReady: true, visible: false }), false, "hidden-tab exclusion");
assertEqual(Hardware.canSample({ desktop: true, immersive: true, loaderReady: true, visible: true }), false, "immersive XR exclusion");
assertEqual(Hardware.shouldReuseAdvisory({
    banner: { parentNode: {} },
    bannerReason: "integrated-low-fps"
}, "integrated-low-fps"), true, "open advisory is reused for the same reason");
assertEqual(Hardware.shouldReuseAdvisory({
    banner: { parentNode: {} },
    bannerReason: "integrated-low-fps"
}, "software-rendering"), false, "advisory rebuilds when reason changes");

const integratedGpu = Object.assign(Hardware.createGpuState(), { adapterClass: "integrated-likely" });
const unknownGpu = Object.assign(Hardware.createGpuState(), { adapterClass: "unknown" });
const discreteGpu = Object.assign(Hardware.createGpuState(), { adapterClass: "discrete-likely" });
const softwareGpu = Object.assign(Hardware.createGpuState(), { adapterClass: "software", softwareRendering: true });
assertEqual(Hardware.resolveAdvisoryReason(integratedGpu, lowPerformance, false), "integrated-low-fps", "integrated warning");
assertEqual(Hardware.resolveAdvisoryReason(unknownGpu, lowPerformance, false), "unknown-low-fps", "uncertain warning");
assertEqual(Hardware.resolveAdvisoryReason(discreteGpu, lowPerformance, false), "", "discrete warning suppression");
assertEqual(Hardware.resolveAdvisoryReason(softwareGpu, goodPerformance, false), "software-rendering", "software immediate warning");
assertEqual(Hardware.resolveAdvisoryReason(discreteGpu, goodPerformance, true), "debug-forced", "debug-forced warning");

harness.window.location.search = "?vrodos_debug_gpu=1";
assertEqual(Hardware.isDebugEnabled(), true, "query debug flag");
harness.window.location.search = "";
harness.window.VRODOS_DEBUG.gpu = true;
assertEqual(Hardware.isDebugEnabled(), true, "global debug flag");
harness.window.VRODOS_DEBUG.gpu = false;
Hardware.storeSessionDismissal();
assertEqual(Hardware.readSessionDismissal(), true, "session dismissal");

const canvas = createEventTarget();
let activeContext = createWebGlContext({ vendor: "Intel", renderer: "Intel(R) UHD Graphics 630" });
const renderer = createRenderer(activeContext, canvas);
renderer.getContext = () => activeContext;
const scene = Object.assign(createEventTarget(), {
    renderer,
    canvas: renderer.domElement,
    components: { "vrodos-scene-loader": { isReady: true } }
});
const registry = {
    listen(target, type, handler) {
        target.addEventListener(type, handler);
    }
};
const component = {
    el: scene,
    runtimeResources: registry,
    getVrRuntimeProfile: () => "desktop",
    isVrPresentationActive: () => false,
    publishRuntimeFeatureState: () => {}
};
const Helpers = harness.window.VRODOSMaster.SceneSettingsHelpers;
Helpers.initializeHardwareDiagnostics.call(component);
assertEqual(component._vrodosHardwareDiagnostics.gpu.adapterClass, "integrated-likely", "initial restored-context fixture");
activeContext = createWebGlContext({ vendor: "NVIDIA Corporation", renderer: "NVIDIA GeForce RTX 4090" });
renderer.domElement.dispatch("webglcontextrestored");
assertEqual(component._vrodosHardwareDiagnostics.gpu.adapterClass, "discrete-likely", "context-restored adapter refresh");
assertEqual(component._vrodosHardwareDiagnostics.performance.status, "settling", "context-restored sampling reset");

const profilerSource = readFileSync(resolve(root, "scripts/profile-master-client.mjs"), "utf8");
assert(profilerSource.includes("GPU sample:"), "profiler must print GPU performance evidence");
assert(profilerSource.includes("hardwareDiagnostics.gpu"), "profiler must persist GPU evidence");
assert(profilerSource.includes("gpuAdvisory"), "profiler must persist GPU advisory presence");
assert(!profilerSource.includes("vrodos_debug_enable_fps_meter"), "GPU profiler evidence must not require the FPS meter");

console.log("Hardware diagnostics tests passed.");
