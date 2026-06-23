import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import * as THREE from "three";

const root = resolve(import.meta.dirname, "..");
const registeredComponents = {};

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertNear(actual, expected, message, epsilon = 1e-6) {
    assert(Math.abs(actual - expected) <= epsilon, `${message}: expected ${expected}, got ${actual}`);
}

const sandbox = {
    THREE,
    console,
    window: {
        VRODOSMaster: {
            NAVMESH_DEFAULTS: {
                maxStepHeight: 0.6,
                maxDropHeight: 1,
                maxSlope: 45
            },
            clamp(value, min, max) {
                return Math.min(max, Math.max(min, value));
            }
        },
        VRODOS_NAVMESH_DEFAULTS: null
    },
    document: {},
    performance: {
        now() {
            return 0;
        }
    },
    AFRAME: {
        registerComponent(name, definition) {
            registeredComponents[name] = definition;
        }
    }
};

sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.window.performance = sandbox.performance;

vm.createContext(sandbox);
vm.runInContext(
    readFileSync(resolve(root, "assets/js/runtime/master/components/vrodos_navigation.component.js"), "utf8"),
    sandbox,
    { filename: "vrodos_navigation.component.js" }
);

const movementDefinition = registeredComponents["custom-movement"];
assert(movementDefinition, "custom-movement component was not registered");

function createMovementHarness(options = {}) {
    const nav = Object.create(movementDefinition);
    const forward = options.forward || new THREE.Vector3(0, 0, -1);

    nav.forwardVector = new THREE.Vector3();
    nav.rightVector = new THREE.Vector3();
    nav.upVector = new THREE.Vector3(0, 1, 0);
    nav.immersiveRenderedDirection = new THREE.Vector3();
    nav.immersiveAuthoredDirection = new THREE.Vector3();
    nav.immersiveRenderYaw = options.renderYaw || 0;
    nav.immersiveMovementBasisSource = "none";
    nav.leftThumbInput = { x: 0, y: 0 };
    nav.rightThumbInput = { x: 0, y: 0 };
    nav.leftThumbRawInput = { x: 0, y: 0 };
    nav.rightThumbRawInput = { x: 0, y: 0 };
    nav.thumbR = { id: "oculusRight" };
    nav.thumbL = { id: "oculusLeft" };
    nav.isImmersiveXrPresenting = () => true;
    nav.getImmersivePhysicalForwardDirection = (target) => target.copy(forward).normalize();
    return nav;
}

{
    const nav = createMovementHarness();
    nav.handleThumbstickMove({
        currentTarget: nav.thumbL,
        detail: { x: 0, y: -1 }
    });
    assertNear(nav.leftThumbRawInput.y, -1, "left stick raw Y should preserve A-Frame forward/up sign");
    assertNear(nav.leftThumbInput.y, -1, "left stick normalized Y should preserve A-Frame forward/up sign");

    const movement = nav.getMovementDeltaFromInput(nav.leftThumbInput.x, nav.leftThumbInput.y, 1);
    assertNear(movement.x, 0, "raw Y -1 should not strafe");
    assertNear(movement.z, -1, "raw Y -1 should move forward in authored coordinates");
}

{
    const nav = createMovementHarness();
    nav.handleThumbstickMove({
        currentTarget: nav.thumbL,
        detail: { x: 0, y: 1 }
    });

    const movement = nav.getMovementDeltaFromInput(nav.leftThumbInput.x, nav.leftThumbInput.y, 1);
    assertNear(movement.x, 0, "raw Y 1 should not strafe");
    assertNear(movement.z, 1, "raw Y 1 should move backward in authored coordinates");
}

{
    const nav = createMovementHarness();
    nav.handleThumbstickMove({
        currentTarget: nav.thumbL,
        detail: { x: 1, y: 0 }
    });

    const movement = nav.getMovementDeltaFromInput(nav.leftThumbInput.x, nav.leftThumbInput.y, 1);
    assertNear(movement.x, 1, "raw X 1 should strafe right in authored coordinates");
    assertNear(movement.z, 0, "raw X 1 should not move forward/backward");
}

{
    const nav = createMovementHarness({ renderYaw: Math.PI / 2 });
    const movement = nav.getMovementDeltaFromInput(0, -1, 1);
    const length = Math.sqrt((movement.x * movement.x) + (movement.z * movement.z));

    assertNear(length, 1, "yawed immersive movement should preserve movement length");
    assertNear(movement.x, 1, "yawed rendered forward should map back into authored +X");
    assertNear(movement.z, 0, "yawed rendered forward should have no authored Z component");
}

console.log("navigation math tests passed");
