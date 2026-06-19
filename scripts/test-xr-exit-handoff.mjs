import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function wait(ms) {
    return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    copy(source) {
        this.x = source.x;
        this.y = source.y;
        this.z = source.z;
        return this;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    add(source) {
        this.x += source.x;
        this.y += source.y;
        this.z += source.z;
        return this;
    }

    sub(source) {
        this.x -= source.x;
        this.y -= source.y;
        this.z -= source.z;
        return this;
    }

    lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
}

class EventTargetStub {
    constructor() {
        this.listeners = new Map();
    }

    addEventListener(type, listener) {
        const listeners = this.listeners.get(type) || [];
        listeners.push(listener);
        this.listeners.set(type, listeners);
    }

    removeEventListener(type, listener) {
        const listeners = this.listeners.get(type) || [];
        this.listeners.set(type, listeners.filter((entry) => entry !== listener));
    }

    dispatchEvent(event) {
        const type = typeof event === "string" ? event : event.type;
        const listeners = this.listeners.get(type) || [];
        listeners.slice().forEach((listener) => listener.call(this, typeof event === "string" ? { type } : event));
    }
}

class EntityStub extends EventTargetStub {
    constructor(id) {
        super();
        this.id = id || "";
        this.attributes = {};
        this.components = {};
        this.children = [];
        this.object3D = {
            position: new Vector3(),
            updateMatrixWorldCalled: 0,
            updateMatrixWorld() {
                this.updateMatrixWorldCalled += 1;
            },
            getWorldPosition: (target) => target.copy(this.object3D.position)
        };
    }

    getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(this.attributes, name)
            ? this.attributes[name]
            : null;
    }

    setAttribute(name, valueOrProperty, maybeValue) {
        if (arguments.length === 3) {
            const current = this.attributes[name] && typeof this.attributes[name] === "object"
                ? this.attributes[name]
                : {};
            current[valueOrProperty] = maybeValue;
            this.attributes[name] = current;
            if (this.components[name] && this.components[name].data) {
                this.components[name].data[valueOrProperty] = maybeValue;
            }
            return;
        }

        if (typeof valueOrProperty === "string" && valueOrProperty.includes(":")) {
            const parsed = {};
            valueOrProperty.split(";").forEach((entry) => {
                const [rawKey, ...rawValue] = entry.split(":");
                const key = rawKey.trim();
                if (key) {
                    parsed[key] = rawValue.join(":").trim();
                }
            });
            this.attributes[name] = parsed;
            return;
        }

        this.attributes[name] = valueOrProperty;
    }

    hasAttribute(name) {
        return Object.prototype.hasOwnProperty.call(this.attributes, name);
    }
}

function createDocumentStub() {
    const elements = new Map();
    const documentStub = new EventTargetStub();
    documentStub.visibilityState = "visible";
    documentStub.readyState = "complete";
    documentStub.documentElement = null;
    documentStub.fullscreenElement = null;
    documentStub.webkitFullscreenElement = null;
    documentStub.mozFullScreenElement = null;
    documentStub.msFullscreenElement = null;
    documentStub.body = new EntityStub("body");
    documentStub.registerElement = (el) => {
        if (el && el.id) {
            elements.set(el.id, el);
        }
        return el;
    };
    documentStub.getElementById = (id) => elements.get(id) || null;
    documentStub.querySelector = (selector) => {
        if (selector.startsWith("#")) {
            return elements.get(selector.slice(1)) || null;
        }
        if (selector === "[camera]") {
            return elements.get("cameraA") || null;
        }
        if (selector === "[raycaster]") {
            return Array.from(elements.values()).find((el) => el.hasAttribute && el.hasAttribute("raycaster")) || null;
        }
        return null;
    };
    documentStub.querySelectorAll = (selector) => {
        if (selector === "[raycaster]") {
            return Array.from(elements.values()).filter((el) => el.hasAttribute && el.hasAttribute("raycaster"));
        }
        return [];
    };
    documentStub.createElement = (tagName) => new EntityStub(tagName);
    return documentStub;
}

function createVmContext() {
    const documentStub = createDocumentStub();
    const windowStub = new EventTargetStub();
    windowStub.window = windowStub;
    windowStub.document = documentStub;
    windowStub.navigator = { userAgent: "OculusBrowser Quest" };
    windowStub.location = { search: "" };
    windowStub.innerWidth = 1200;
    windowStub.innerHeight = 600;
    windowStub.setTimeout = setTimeout;
    windowStub.clearTimeout = clearTimeout;
    windowStub.performance = { now: () => Date.now() };
    windowStub.VRODOS_RUNTIME_SETTINGS_CONTRACT = { sceneSettings: {} };
    windowStub.VRODOSMaster = {
        SceneSettingsHelpers: {},
        RuntimeSettings: {}
    };

    const components = {};
    const context = {
        console,
        setTimeout,
        clearTimeout,
        Date,
        performance: windowStub.performance,
        window: windowStub,
        document: documentStub,
        navigator: windowStub.navigator,
        URLSearchParams,
        THREE: {
            Vector2,
            Vector3,
            Quaternion: class Quaternion {},
            MathUtils: { degToRad: (degrees) => degrees * Math.PI / 180 }
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
    context.globalThis = context;
    vm.createContext(context);

    [
        "assets/js/runtime/master/components/vrodos_scene_settings.component.js",
        "assets/js/runtime/master/components/vrodos_navigation.component.js"
    ].forEach((relativePath) => {
        vm.runInContext(readFileSync(resolve(root, relativePath), "utf8"), context, { filename: relativePath });
    });

    return context;
}

function createRendererState() {
    const canvas = {
        clientWidth: 1200,
        clientHeight: 600,
        parentElement: { clientWidth: 1200, clientHeight: 600 }
    };
    const state = {
        size: { width: 1200, height: 600 },
        xrPresenting: false,
        session: null,
        resizeCalls: 0
    };
    const renderer = {
        domElement: canvas,
        xr: {
            get isPresenting() {
                return state.xrPresenting;
            },
            set isPresenting(value) {
                state.xrPresenting = value;
            },
            getSession() {
                return state.session;
            }
        },
        getSize(target) {
            target.x = state.size.width;
            target.y = state.size.height;
            target.width = state.size.width;
            target.height = state.size.height;
            return target;
        },
        setSize(width, height) {
            state.size.width = width;
            state.size.height = height;
            state.resizeCalls += 1;
        },
        getPixelRatio() {
            return 1;
        }
    };

    return { renderer, state, canvas };
}

function createFixture(context) {
    const sceneDef = context.AFRAME.components["scene-settings"];
    const navDef = context.AFRAME.components["custom-movement"];
    const documentStub = context.document;
    const { renderer, state } = createRendererState();
    const scene = new EntityStub("aframe-scene-container");
    const player = new EntityStub("player");
    const cameraEl = new EntityStub("cameraA");
    const cursor = new EntityStub("cursor");
    const right = new EntityStub("oculusRight");
    const camera = {
        fov: 60,
        near: 0.1,
        far: 7000,
        zoom: 1,
        aspect: 2,
        updateProjectionCalls: 0,
        matrixWorldUpdates: 0,
        updateProjectionMatrix() {
            this.updateProjectionCalls += 1;
        },
        updateMatrixWorld() {
            this.matrixWorldUpdates += 1;
        }
    };

    scene.renderer = renderer;
    scene.camera = camera;
    scene.canvas = renderer.domElement;
    scene.states = new Set();
    scene.is = (stateName) => scene.states.has(stateName);
    scene.resizeCalls = 0;
    scene.resize = () => {
        scene.resizeCalls += 1;
    };

    cameraEl.components.camera = { camera };
    cameraEl.attributes.camera = { active: true, fov: 60, near: 0.1, far: 7000, zoom: 1 };
    cameraEl.components["look-controls"] = { data: { enabled: true }, isPlaying: true };
    cameraEl.attributes["look-controls"] = { enabled: true };
    player.components["wasd-controls"] = { data: { enabled: false }, isPlaying: false };
    player.attributes["wasd-controls"] = { enabled: false };
    player.components["custom-movement"] = {
        finalizeCalls: 0,
        finalizeImmersiveExitNavigationHandoff(reason) {
            this.finalizeCalls += 1;
            return { status: "applied", applied: true, reason };
        }
    };
    cursor.components.raycaster = { refreshes: 0, refreshObjects() { this.refreshes += 1; } };
    cursor.attributes.raycaster = { objects: ".raycastable", far: 100, enabled: true };
    right.components.raycaster = { refreshes: 0, refreshObjects() { this.refreshes += 1; } };
    right.attributes.raycaster = { objects: ".raycastable", far: 100, enabled: true };

    [scene, player, cameraEl, cursor, right].forEach((el) => documentStub.registerElement(el));

    let spatialPanel = { id: "panel" };
    context.window.VRODOSSpatialUI = {
        closed: 0,
        refreshed: 0,
        getActivePanel: () => spatialPanel,
        closePanel() {
            spatialPanel = null;
            this.closed += 1;
        },
        refreshInteractionTargets() {
            this.refreshed += 1;
        }
    };
    context.window.VRODOSRuntimeOverlay = {
        locked: true,
        suppressed: true,
        overlayMode: true,
        refreshed: 0,
        lockSceneInteraction(value) {
            this.locked = value;
        },
        setSceneControlsSuppressed(value) {
            this.suppressed = value;
        },
        setOverlayRaycastMode(value) {
            this.overlayMode = value;
        },
        refreshRaycasters() {
            this.refreshed += 1;
        }
    };

    const component = Object.create(sceneDef);
    Object.assign(component, {
        el: scene,
        data: { pr_type: "vrexpo_games" },
        _xrExitRestoreTimers: [],
        _xrExitSessionAttachTimers: [],
        _xrExitRestoreTriggers: [],
        _xrExitRestoreGeneration: 1,
        _xrExitRestoreCompletedGeneration: -1,
        _xrExitRestoreHasSeenVr: true,
        _xrExitRestoreActive: false,
        applyVrRenderBudgetPolicy() {},
        syncPresentationVisualState() {},
        updatePostProcessingSize() {},
        updatePmndrsPostProcessingSize() {},
        publishRuntimeFeatureState(reason) {
            this.lastPublishReason = reason;
        }
    });
    component.handleXrSessionEnd = sceneDef.handleXrSessionEnd.bind(component);

    const baseline = component.captureXrExitRestoreBaseline("test-baseline");

    return {
        component,
        scene,
        player,
        cameraEl,
        cursor,
        camera,
        right,
        rendererState: state,
        navDef,
        baseline
    };
}

function damageInlineState(fixture) {
    fixture.camera.fov = 115;
    fixture.camera.aspect = 0.35;
    fixture.camera.zoom = 3;
    fixture.cameraEl.attributes.camera = { active: false, fov: 115, near: 0.5, far: 100, zoom: 3 };
    fixture.cameraEl.attributes["look-controls"] = { enabled: false };
    fixture.cameraEl.components["look-controls"].data.enabled = false;
    fixture.player.attributes["wasd-controls"] = { enabled: true };
    fixture.player.components["wasd-controls"].data.enabled = true;
    fixture.cursor.attributes.raycaster = { objects: ".vrodos-overlay-hit-target", far: 0.75, enabled: true };
    fixture.right.attributes.raycaster = { objects: ".vrodos-overlay-hit-target", far: 0.75, enabled: true };
}

function assertRestored(fixture, diagnostics) {
    assert(diagnostics.status === "restored", "restore should complete");
    assert(fixture.camera.fov === 60, "camera fov should reset to 60");
    assert(fixture.camera.aspect === 2, "camera aspect should match inline canvas");
    assert(fixture.rendererState.size.width === 1200, "renderer width should be reset to canvas width");
    assert(fixture.rendererState.size.height === 600, "renderer height should be reset to canvas height");
    assert(fixture.cameraEl.attributes.camera.active === true, "cameraA should be active");
    assert(fixture.cameraEl.components["look-controls"].data.enabled === true, "look-controls should restore to baseline");
    assert(fixture.player.components["wasd-controls"].data.enabled === false, "wasd-controls should restore to baseline");
    assert(fixture.cursor.attributes.raycaster.objects === ".raycastable", "desktop cursor raycaster objects should restore");
    assert(fixture.cursor.attributes.raycaster.far === 100, "desktop cursor raycaster far should restore");
    assert(fixture.cursor.components.raycaster.refreshes === 1, "desktop cursor raycaster should refresh");
    assert(fixture.right.attributes.raycaster.objects === ".vrodos-overlay-hit-target", "controller raycaster should not be mutated on exit");
    assert(diagnostics.raycasters.controllerSkipped === 1, "controller raycaster should be skipped on exit restore");
    assert(fixture.player.components["custom-movement"].finalizeCalls === 1, "navigation handoff should finalize once");
}

async function testAFrameExitRestore(context) {
    const fixture = createFixture(context);
    damageInlineState(fixture);
    const diagnostics = fixture.component.runXrExitRestoreAttempt("aframe-exit-vr", 0, 1);
    assertRestored(fixture, diagnostics);
    assert(context.window.VRODOSRuntimeOverlay.locked === false, "overlay interaction should unlock");
    assert(context.window.VRODOSRuntimeOverlay.suppressed === false, "suppressed scene controls should restore");
    assert(context.window.VRODOSRuntimeOverlay.overlayMode === false, "overlay raycast mode should clear");
    assert(context.window.VRODOSSpatialUI.closed === 1, "spatial panel should close");
}

async function testWebXrSessionEndRestore(context) {
    const fixture = createFixture(context);
    const session = new EventTargetStub();
    fixture.rendererState.session = session;
    fixture.rendererState.xrPresenting = true;
    fixture.component.handleXrSessionEnd = fixture.component.handleXrSessionEnd.bind(fixture.component);
    assert(fixture.component.attachXrExitSessionEndListener("test-session"), "session listener should attach");
    damageInlineState(fixture);
    fixture.rendererState.session = null;
    fixture.rendererState.xrPresenting = false;
    session.dispatchEvent({ type: "end" });
    await wait(20);
    assertRestored(fixture, context.window.__vrodosLastXrExitRestoreDiagnostics);
}

async function testQuestResumeRestore(context) {
    const fixture = createFixture(context);
    damageInlineState(fixture);
    fixture.scene.states.delete("vr-mode");
    fixture.rendererState.session = null;
    fixture.rendererState.xrPresenting = false;
    fixture.component.handleXrExitResumeSignal({ type: "focus" });
    await wait(20);
    assertRestored(fixture, context.window.__vrodosLastXrExitRestoreDiagnostics);
}

async function testRepeatedSignalsAreIdempotent(context) {
    const fixture = createFixture(context);
    damageInlineState(fixture);
    const first = fixture.component.runXrExitRestoreAttempt("aframe-exit-vr", 0, 1);
    const projectionCalls = fixture.camera.updateProjectionCalls;
    const resizeCalls = fixture.rendererState.resizeCalls;
    const second = fixture.component.scheduleXrExitRestore("window-focus");
    await wait(20);
    assert(first === second, "completed generation should return the existing diagnostics");
    assert(fixture.camera.updateProjectionCalls === projectionCalls, "repeated signal should not update projection again");
    assert(fixture.rendererState.resizeCalls === resizeCalls, "repeated signal should not resize again");
}

function createNavigationInstance(navDef, immersiveActive) {
    const scene = new EntityStub("scene");
    scene.renderer = { xr: { isPresenting: immersiveActive } };
    scene.is = (stateName) => immersiveActive && stateName === "vr-mode";
    const cameraRig = new EntityStub("player");
    const anchor = {
        getWorldPosition(target) {
            return target.copy(cameraRig.object3D.position);
        }
    };
    const nav = Object.create(navDef);
    Object.assign(nav, {
        sceneEl: scene,
        cameraRig,
        currentWorldPosition: new Vector3(),
        movementOffset: new Vector3(),
        lastResolvedPosition: new Vector3(),
        lastNonImmersiveNavigationPosition: new Vector3(),
        pendingImmersiveExitNavigationPosition: new Vector3(4, 1.6, -2),
        pendingImmersiveExitNavigationReason: "test",
        pendingImmersiveExitNavigationCapturedAt: 123,
        immersiveExitHandoffTimers: [],
        getNavigationAnchorObject: () => anchor,
        getRuntimeNow: () => 456
    });
    return { nav, cameraRig, scene };
}

async function testNavigationFinalizerDefersUntilInline(context) {
    const navDef = context.AFRAME.components["custom-movement"];
    const active = createNavigationInstance(navDef, true);
    const deferred = active.nav.finalizeImmersiveExitNavigationHandoff("active");
    assert(deferred.status === "deferred-xr-active", "navigation handoff should defer while XR is active");
    assert(active.cameraRig.object3D.position.x === 0, "rig should not move while XR is active");

    const inline = createNavigationInstance(navDef, false);
    const applied = inline.nav.finalizeImmersiveExitNavigationHandoff("inline");
    assert(applied.status === "applied", "navigation handoff should apply when inline");
    assert(inline.cameraRig.object3D.position.x === 4, "rig x should move to final VR nav position");
    assert(inline.cameraRig.object3D.position.y === 1.6, "rig y should move to final VR nav position");
    assert(inline.cameraRig.object3D.position.z === -2, "rig z should move to final VR nav position");
    assert(inline.nav.pendingImmersiveExitNavigationPosition === null, "pending handoff should clear after apply");
}

async function main() {
    await testAFrameExitRestore(createVmContext());
    await testWebXrSessionEndRestore(createVmContext());
    await testQuestResumeRestore(createVmContext());
    await testRepeatedSignalsAreIdempotent(createVmContext());
    await testNavigationFinalizerDefersUntilInline(createVmContext());
    console.log("XR exit handoff harness passed");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
