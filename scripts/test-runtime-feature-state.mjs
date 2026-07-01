import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    copy(source) {
        this.x = source.x;
        this.y = source.y;
        this.z = source.z;
        return this;
    }
}

class EntityStub {
    constructor(id) {
        this.id = id || "";
        this.attributes = {};
        this.components = {};
        this.children = [];
        this.object3D = {
            position: new Vector3(),
            getWorldPosition: (target) => target.copy(this.object3D.position)
        };
    }

    getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(this.attributes, name)
            ? this.attributes[name]
            : null;
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }

    hasAttribute(name) {
        return Object.prototype.hasOwnProperty.call(this.attributes, name);
    }

    querySelector(selector) {
        if (selector === "[custom-movement]") {
            return this.children.find((child) => child.hasAttribute && child.hasAttribute("custom-movement")) || null;
        }
        if (selector.startsWith("#")) {
            return this.children.find((child) => child.id === selector.slice(1)) || null;
        }
        return null;
    }
}

function createDocumentStub() {
    const elements = new Map();
    return {
        fullscreenElement: null,
        webkitFullscreenElement: null,
        mozFullScreenElement: null,
        msFullscreenElement: null,
        registerElement(el) {
            if (el && el.id) {
                elements.set(el.id, el);
            }
            return el;
        },
        getElementById(id) {
            return elements.get(id) || null;
        },
        querySelector(selector) {
            if (selector === "a-scene") {
                return elements.get("aframe-scene-container") || null;
            }
            if (selector === "[custom-movement]") {
                return Array.from(elements.values()).find((el) => el.hasAttribute && el.hasAttribute("custom-movement")) || null;
            }
            if (selector.startsWith("#")) {
                return elements.get(selector.slice(1)) || null;
            }
            return null;
        }
    };
}

function createVmContext(userAgent) {
    const documentStub = createDocumentStub();
    const windowStub = {
        document: documentStub,
        navigator: { userAgent },
        location: { search: "" },
        VRODOS_DEBUG: {},
        VRODOS_RUNTIME_SETTINGS_CONTRACT: { sceneSettings: {} },
        VRODOSMaster: {
            SceneSettingsHelpers: {},
            RuntimeSettings: {}
        },
        __vrodosSpatialUIDiagnostics: []
    };
    windowStub.window = windowStub;

    const components = {};
    const context = {
        console,
        Date,
        performance: { now: () => 1000 },
        window: windowStub,
        document: documentStub,
        navigator: windowStub.navigator,
        URLSearchParams,
        THREE: {
            Vector3,
            WebGLCubeRenderTarget: function WebGLCubeRenderTarget() {},
            CubeCamera: function CubeCamera() {},
            PMREMGenerator: function PMREMGenerator() {}
        },
        AFRAME: {
            components,
            registerComponent(name, definition) {
                components[name] = definition;
            },
            utils: {
                device: {
                    isMobile: () => false
                }
            }
        }
    };
    windowStub.THREE = context.THREE;
    windowStub.AFRAME = context.AFRAME;
    context.globalThis = context;

    vm.createContext(context);
    [
        "assets/js/runtime/master/vrodos_runtime_profile_policy.js",
        "assets/js/runtime/master/components/vrodos_scene_settings.component.js"
    ].forEach((relativePath) => {
        vm.runInContext(readFileSync(resolve(root, relativePath), "utf8"), context, { filename: relativePath });
    });

    return context;
}

function createRenderer(immersive) {
    const session = immersive ? {} : null;
    return {
        capabilities: { isWebGL2: true },
        xr: {
            isPresenting: Boolean(immersive),
            getSession: () => session,
            setFramebufferScaleFactor(value) {
                this.framebufferScaleFactor = value;
            },
            setFoveation(value) {
                this.foveation = value;
            },
            getFoveation() {
                return typeof this.foveation === "number" ? this.foveation : 0;
            }
        },
        getPixelRatio() {
            return 1;
        }
    };
}

function baseData(overrides = {}) {
    return Object.assign({
        pr_type: "vrexpo_games",
        cam_position: "0 1.6 0",
        renderQuality: "high",
        shadowQuality: "high",
        shadowUpdateMode: "static",
        aaQuality: "balanced",
        vrRuntimeProfile: "desktop",
        vrFramebufferScale: "0",
        vrFoveationStrength: "-1",
        vrHeadsetStereoPostFxEnabled: "0",
        postFXEnabled: "0",
        postFXEngine: "legacy",
        postFXBloomEnabled: "0",
        postFXColorEnabled: "0",
        postFXEdgeAAEnabled: "0",
        postFXTAAEnabled: "0",
        postFXSSREnabled: "0",
        bloomStrength: "off",
        ambientOcclusionPreset: "off",
        reflectionsEnabled: "1",
        reflectionSource: "hdr",
        envMapPreset: "none",
        navigationMode: "walkable",
        collisionMode: "auto",
        pmndrsAAMode: "none",
        pmndrsAtmosphereEnabled: "0",
        pmndrsAerialPerspectiveEnabled: "0",
        pmndrsCloudsEnabled: "0",
        pmndrsLensFlareEnabled: "0",
        pmndrsLutEnabled: "0",
        pmndrsVignetteEnabled: "0",
        pmndrsNoiseEnabled: "0",
        pmndrsChromaticAberrationEnabled: "0"
    }, overrides);
}

function createFeatureStateFixture(options) {
    const context = createVmContext(options.userAgent || "Mozilla/5.0 Chrome");
    const sceneDef = context.AFRAME.components["scene-settings"];
    const scene = new EntityStub("aframe-scene-container");
    const player = new EntityStub("player");
    const camera = new EntityStub("cameraA");
    const right = new EntityStub("oculusRight");
    const left = new EntityStub("oculusLeft");
    const movementEl = new EntityStub("movement");

    scene.renderer = createRenderer(Boolean(options.immersive));
    scene.camera = { el: camera };
    scene.is = (state) => state === "vr-mode" && Boolean(options.aframeVrMode);
    movementEl.setAttribute("custom-movement", "");
    movementEl.components["custom-movement"] = {
        navMeshCollisionTargets: options.navMeshTargets || [],
        blockerCollisionTargets: options.blockerTargets || [],
        navMeshRoots: [],
        colliderRoots: [],
        leftThumbInput: { x: 0, y: 0 },
        leftThumbRawInput: { x: 0, y: 0 },
        rightThumbInput: { x: 0, y: 0 },
        rightThumbRawInput: { x: 0, y: 0 },
        getNavigationMode: (data) => data.navigationMode || "walkable",
        isImmersiveXrPresenting: () => Boolean(options.immersive),
        getImmersiveWorldRootDiagnostics: () => ({
            count: 1,
            samples: ["vrodos-authored-world"],
            videoDisplayRootCount: 0,
            assessmentRootCount: 0,
            assessmentWrapperRootCount: 0,
            cefrRootCount: 0,
            includesVideoDisplays: false,
            includesAssessmentWrappers: false,
            collisionRootsCovered: true,
            missingCollisionRootCount: 0,
            missingCollisionRootSamples: []
        })
    };
    scene.children.push(movementEl);

    [scene, player, camera, right, left, movementEl].forEach((el) => context.document.registerElement(el));

    const component = Object.create(sceneDef);
    Object.assign(component, {
        el: scene,
        data: baseData(options.data),
        postProcessingActive: Boolean(options.legacyActive),
        pmndrsActive: Boolean(options.pmndrsActive),
        pmndrsComposer: options.pmndrsActive ? {} : null,
        pmndrsEffectPass: options.pmndrsActive ? {} : null,
        _vrodosVrRenderBudget: null,
        _currentReflectionSource: "none",
        _envMapRenderTarget: null,
        _hdrEnvMapLoading: false,
        _hdrEnvMapFailed: false,
        _sceneProbePmremTarget: null,
        _sceneProbeNeedsUpdate: false,
        _takramSkyPmremTarget: null,
        _pmndrsCloudsDiagnostics: options.cloudDiagnostics || {},
        _pmndrsAtmosphereState: options.atmosphereState || null,
        _pmndrsSunSpriteActive: false,
        _pmndrsVrLensFlareSuppressed: false
    });
    scene.components["scene-settings"] = component;

    context.window.POSTPROCESSING = options.postprocessingBundle ? {} : null;
    context.window.VRODOS_TAKRAM_ATMOSPHERE = options.takramBundle ? {} : null;
    context.window.VRODOS_TAKRAM_CLOUDS = options.cloudsBundle ? {} : null;
    context.window.VRODOS_COLLISION_BVH = options.bvhBundle ? {} : null;
    context.window.VRODOSSpatialUI = options.spatialUi
        ? {
            getActivePanel: () => null
        }
        : null;

    return component.getRuntimeFeatureState();
}

function assertPath(actual, expected, label) {
    assert(actual === expected, `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const desktopPmndrs = createFeatureStateFixture({
    pmndrsActive: true,
    postprocessingBundle: true,
    data: {
        postFXEnabled: "1",
        postFXEngine: "pmndrs",
        postFXBloomEnabled: "1",
        bloomStrength: "medium"
    }
});
const policy = createVmContext("Mozilla/5.0 Chrome").window.VRODOSMaster.RuntimeProfilePolicy;
assertPath(policy.normalizeRuntimeProfile("balanced"), "headset", "legacy headset profile normalization");
assertPath(policy.normalizeRuntimeProfile("pc-rendered-vr"), "pc-rendered-vr", "PC-rendered VR profile normalization");
assertPath(policy.hdrFallbackPreset("headset"), "studio", "headset HDR fallback preset");
assertPath(policy.renderProfileDefaults("pc-rendered-vr").foveation, 0, "PC-rendered VR foveation default");
assertPath(desktopPmndrs.presentation.mode, "inline", "desktop presentation mode");
assertPath(desktopPmndrs.vrProfile.profile, "desktop", "desktop profile");
assertPath(desktopPmndrs.postProcessing.requested, true, "desktop PMNDRS request");
assertPath(desktopPmndrs.postProcessing.allowed, true, "desktop PMNDRS allowed");
assertPath(desktopPmndrs.postProcessing.owner, "pmndrs", "desktop PMNDRS owner");

const headsetNoPostFx = createFeatureStateFixture({
    immersive: true,
    userAgent: "OculusBrowser Quest",
    data: {
        vrRuntimeProfile: "headset",
        postFXEnabled: "0",
        postFXEngine: "pmndrs",
        vrHeadsetStereoPostFxEnabled: "0",
        pmndrsAtmosphereEnabled: "0"
    }
});
assertPath(headsetNoPostFx.presentation.mode, "immersive-xr", "headset presentation mode");
assertPath(headsetNoPostFx.vrProfile.profile, "headset", "headset profile");
assertPath(headsetNoPostFx.vrProfile.headset, true, "headset flag");
assertPath(headsetNoPostFx.postProcessing.requested, false, "headset no-postFX request");
assertPath(headsetNoPostFx.postProcessing.allowed, false, "headset no-postFX allowed");
assertPath(headsetNoPostFx.postProcessing.owner, "direct", "headset no-postFX owner");
assertPath(headsetNoPostFx.vrProfile.pmndrsComposer, false, "headset no-postFX composer policy");
assertPath(headsetNoPostFx.vrProfile.headsetPmndrsStereoComposerAuthored, false, "headset no-postFX stereo policy");
assertPath(headsetNoPostFx.shadows.effectiveQuality, "medium", "headset shadow cap");

const headsetStereoPmndrs = createFeatureStateFixture({
    immersive: true,
    userAgent: "OculusBrowser Quest",
    pmndrsActive: true,
    postprocessingBundle: true,
    data: {
        vrRuntimeProfile: "headset",
        postFXEnabled: "1",
        postFXEngine: "pmndrs",
        vrHeadsetStereoPostFxEnabled: "1",
        pmndrsAtmosphereEnabled: "0"
    }
});
assertPath(headsetStereoPmndrs.postProcessing.requested, true, "headset stereo PMNDRS request");
assertPath(headsetStereoPmndrs.postProcessing.allowed, true, "headset stereo PMNDRS allowed");
assertPath(headsetStereoPmndrs.postProcessing.owner, "pmndrs", "headset stereo PMNDRS owner");
assertPath(headsetStereoPmndrs.vrProfile.pmndrsComposer, true, "headset stereo composer policy");
assertPath(headsetStereoPmndrs.vrProfile.headsetPmndrsStereoComposerAuthored, true, "headset stereo opt-in policy");

const headsetTakramNoComposer = createFeatureStateFixture({
    immersive: true,
    userAgent: "OculusBrowser Quest",
    postprocessingBundle: true,
    takramBundle: true,
    atmosphereState: {
        ready: true,
        failed: false,
        profileSignature: "fixture",
        precision: "mediump"
    },
    data: {
        vrRuntimeProfile: "headset",
        postFXEnabled: "1",
        postFXEngine: "pmndrs",
        vrHeadsetStereoPostFxEnabled: "0",
        pmndrsAtmosphereEnabled: "1"
    }
});
assertPath(headsetTakramNoComposer.postProcessing.requested, false, "headset Takram no composer request");
assertPath(headsetTakramNoComposer.postProcessing.allowed, false, "headset Takram no composer allowed");
assertPath(headsetTakramNoComposer.vrProfile.takramVisibleSky, true, "headset Takram visible sky policy");
assertPath(headsetTakramNoComposer.vrProfile.pmndrsComposer, false, "headset Takram composer policy");
assertPath(headsetTakramNoComposer.takram.atmosphereRequested, true, "headset Takram atmosphere request");
assertPath(headsetTakramNoComposer.takram.atmosphereBundleLoaded, true, "headset Takram bundle loaded");

const spatialUi = createFeatureStateFixture({
    spatialUi: true,
    data: {
        postFXEnabled: "0"
    }
});
assertPath(spatialUi.spatialUi.bundleLoaded, true, "spatial UI bundle diagnostic");
assertPath(spatialUi.spatialUi.activePanel, false, "spatial UI panel diagnostic");

console.log("Runtime feature-state smoke tests passed.");
