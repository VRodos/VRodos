import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function createQualityProfileContext() {
    const windowStub = {
        location: { search: "" },
        VRODOS_RUNTIME_SETTINGS_CONTRACT: {},
        VRODOS_DEBUG: {},
        devicePixelRatio: 1
    };
    const master = {
        SceneSettingsHelpers: {},
        RuntimeSettings: {}
    };
    windowStub.VRODOSMaster = master;

    const context = {
        console,
        window: windowStub,
        VRODOSMaster: master,
        URLSearchParams,
        document: {
            body: {
                appendChild() {}
            },
            createElement() {
                return {
                    style: {},
                    setAttribute() {},
                    appendChild() {}
                };
            }
        },
        THREE: {
            BasicShadowMap: 0,
            PCFShadowMap: 1,
            MathUtils: {
                degToRad(value) {
                    return value * Math.PI / 180;
                }
            },
            Vector3: class Vector3 {
                constructor(x = 0, y = 0, z = 0) {
                    this.x = x;
                    this.y = y;
                    this.z = z;
                }

                normalize() {
                    return this;
                }

                multiplyScalar(value) {
                    this.x *= value;
                    this.y *= value;
                    this.z *= value;
                    return this;
                }

                crossVectors() {
                    return this;
                }

                lengthSq() {
                    return 1;
                }

                set(x, y, z) {
                    this.x = x;
                    this.y = y;
                    this.z = z;
                    return this;
                }
            },
            Box3: class Box3 {
                set() {
                    return this;
                }

                setFromObject() {
                    return this;
                }

                isEmpty() {
                    return true;
                }

                union() {
                    return this;
                }
            }
        }
    };
    windowStub.THREE = context.THREE;
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(
        readFileSync(resolve(root, "assets/js/runtime/master/vrodos_quality_profiles.js"), "utf8"),
        context,
        { filename: "assets/js/runtime/master/vrodos_quality_profiles.js" }
    );
    return context;
}

function createFixture({ compatible }) {
    let disposed = 0;
    const material = { needsUpdate: false };
    const shadowMap = {
        depthTexture: compatible
            ? {
                compareFunction: 1,
                dispose() {}
            }
            : null,
        dispose() {
            disposed += 1;
        }
    };
    const light = {
        isDirectionalLight: true,
        castShadow: true,
        shadow: {
            map: shadowMap,
            mapPass: null,
            needsUpdate: false
        }
    };
    const mesh = {
        isMesh: true,
        material
    };
    const scene = {
        traverse(callback) {
            [light, mesh].forEach(callback);
        }
    };
    const component = {
        data: {
            shadowQuality: "high",
            shadowUpdateMode: "static",
            postFXEngine: "legacy",
            pmndrsAtmosphereEnabled: "0"
        },
        el: {
            renderer: {
                shadowMap: {
                    enabled: false,
                    autoUpdate: true,
                    needsUpdate: false,
                    type: 1
                }
            },
            object3D: scene
        },
        getEffectiveShadowQuality() {
            return "high";
        }
    };

    return { component, light, material, disposed: () => disposed };
}

function createShadowRoleComponent() {
    const material = { needsUpdate: false };
    const entityEl = {
        id: "fixture-shadow-entity",
        tagName: "A-ENTITY",
        classList: {
            contains() {
                return false;
            }
        },
        hasAttribute() {
            return false;
        },
        getAttribute(name) {
            if (name === "data-vrodos-asset-id") {
                return "1744";
            }
            if (name === "data-vrodos-shadow-role") {
                return "caster-receiver";
            }
            return "";
        }
    };
    const mesh = {
        isMesh: true,
        material,
        userData: {},
        el: entityEl,
        castShadow: false,
        receiveShadow: false
    };
    const light = {
        isDirectionalLight: true,
        castShadow: false,
        name: "vrodosPmndrsTakramSunLight",
        userData: { vrodosPmndrsTakramLightSource: true },
        shadow: {
            map: null,
            needsUpdate: false,
            mapSize: { x: 512, y: 512 },
            bias: 0,
            normalBias: 0,
            radius: 0
        }
    };
    const helperLight = {
        isDirectionalLight: true,
        castShadow: true,
        name: "vrodos-pmndrs-horizon-key-light",
        userData: {},
        el: {
            hasAttribute(name) {
                return name === "data-vrodos-photoreal-light";
            }
        },
        shadow: {
            map: null,
            needsUpdate: false,
            mapSize: { x: 512, y: 512 },
            bias: 0,
            normalBias: 0,
            radius: 0
        }
    };
    const authoredLight = {
        isDirectionalLight: true,
        castShadow: true,
        name: "authoredDirectionalLight",
        userData: {},
        el: {
            hasAttribute() {
                return false;
            }
        },
        shadow: {
            map: null,
            needsUpdate: false,
            mapSize: { x: 512, y: 512 },
            bias: 0,
            normalBias: 0,
            radius: 0
        }
    };
    const scene = {
        updateMatrixWorld() {},
        traverse(callback) {
            callback(mesh);
            callback(light);
            callback(helperLight);
            callback(authoredLight);
        }
    };
    return {
        authoredLight,
        helperLight,
        light,
        mesh,
        component: {
            data: {
                shadowQuality: "high",
                shadowUpdateMode: "static",
                rootShadowType: "pcf",
                postFXEngine: "legacy",
                selChoice: "1",
                pmndrsAtmosphereEnabled: "0",
                pmndrsDayNightCycleEnabled: false,
                contactShadowPreset: "soft"
            },
            el: {
                renderer: {
                    shadowMap: {
                        enabled: false,
                        autoUpdate: true,
                        needsUpdate: false,
                        type: 1
                    }
                },
                object3D: scene,
                getAttribute(name) {
                    if (name === "shadow") {
                        return { enabled: true, type: "pcf", autoUpdate: false };
                    }
                    return null;
                },
                setAttribute() {},
                hasAttribute() {
                    return false;
                },
                querySelectorAll() {
                    return [];
                }
            },
            getEffectiveShadowQuality() {
                return "high";
            },
            getContactShadowSettings() {
                return { bias: 0, normalBias: 0 };
            },
            syncStaticShadowMode() {}
        }
    };
}

const context = createQualityProfileContext();
const helpers = context.VRODOSMaster.SceneSettingsHelpers;

const incompatible = createFixture({ compatible: false });
helpers.flushShadowUpdate.call(incompatible.component);
assert(incompatible.disposed() === 1, "incompatible PCF shadow map should be disposed");
assert(incompatible.light.shadow.map === null, "disposed incompatible shadow map should be cleared");
assert(incompatible.light.shadow.needsUpdate === true, "shadow light should be marked dirty");
assert(incompatible.material.needsUpdate === true, "materials should be marked dirty after shadow compatibility refresh");
assert(incompatible.component._vrodosShadowCompatibilityRefreshes === 1, "compatibility refresh should be counted");
assert(incompatible.component._vrodosShadowLastCompatibilityRefreshReason === "shadow-flush", "compatibility refresh reason should be recorded");
assert(incompatible.component._vrodosShadowProgramRefreshes === 1, "shadow program refresh should be counted");
assert(incompatible.component._vrodosShadowLastProgramRefreshType === "PCFShadowMap", "shadow program refresh type should be recorded");
assert(incompatible.component.el.renderer.shadowMap.needsUpdate === true, "renderer shadow map should request update");

const compatible = createFixture({ compatible: true });
helpers.flushShadowUpdate.call(compatible.component);
assert(compatible.disposed() === 0, "compatible PCF shadow map should not be disposed");
assert(compatible.light.shadow.map !== null, "compatible shadow map should be retained");
assert(!compatible.component._vrodosShadowCompatibilityRefreshes, "compatible shadow map should not count refreshes");
assert(compatible.material.needsUpdate === true, "compatible shadow map should still refresh material programs once");
assert(compatible.component._vrodosShadowProgramRefreshes === 1, "compatible shadow map should count one program refresh");

compatible.material.needsUpdate = false;
helpers.flushShadowUpdate.call(compatible.component);
assert(compatible.component._vrodosShadowProgramRefreshes === 1, "same shadow map type should not repeatedly refresh programs");
assert(compatible.material.needsUpdate === false, "same shadow map type should not repeatedly dirty materials");

const defaultRole = createShadowRoleComponent();
helpers.applyShadowQualityProfile.call(defaultRole.component);
assert(defaultRole.mesh.castShadow === true, "caster-receiver meshes should cast shadows by default");
assert(defaultRole.mesh.receiveShadow === true, "caster-receiver meshes should receive shadows by default");
assert(defaultRole.light.castShadow === true, "managed shadow lights should cast shadows by default");
assert(defaultRole.helperLight.castShadow === false, "photoreal helper lights should not cast shadows by default");
assert(defaultRole.authoredLight.castShadow === true, "authored shadow lights should cast shadows by default");

console.log("Shadow map compatibility tests passed.");
