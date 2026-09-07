import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Editor scene loader test failed: ${message}`);
    }
}

class MockVector {
    constructor(x = 0, y = 0, z = 0) {
        this.set(x, y, z);
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
}

class MockObject3D {
    constructor() {
        this.children = [];
        this.position = new MockVector();
        this.rotation = new MockVector();
        this.scale = new MockVector(1, 1, 1);
    }

    add(child) {
        this.children.push(child);
        child.parent = this;
    }

    traverse(visitor) {
        visitor(this);
        this.children.forEach((child) => child.traverse(visitor));
    }
}

class MockGroup extends MockObject3D {}

class MockMesh extends MockObject3D {
    constructor(geometry, material) {
        super();
        this.geometry = geometry;
        this.material = material;
        this.isMesh = true;
    }
}

class MockGeometry {
    constructor(...args) {
        this.args = args;
    }
}

class MockMaterial {
    constructor(options = {}) {
        Object.assign(this, options);
    }
}

class MockTextureLoader {
    setCrossOrigin() {
        return this;
    }

    load(_url, onLoad) {
        const texture = {};
        if (onLoad) onLoad(texture);
        return texture;
    }
}

class MockGltfLoader {
    load(url, onLoad) {
        this.loadedUrl = url;
        onLoad({ scene: new MockGroup(), animations: [] });
    }
}

const expectedErrors = [];
const context = {
    URLSearchParams,
    alert() {},
    console: {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: (...args) => expectedErrors.push(args)
    },
    document: {
        getElementById() {
            return null;
        }
    },
    performance,
    THREE: {
        BoxGeometry: MockGeometry,
        DoubleSide: 2,
        FrontSide: 0,
        GLTFLoader: MockGltfLoader,
        Group: MockGroup,
        Mesh: MockMesh,
        MeshBasicMaterial: MockMaterial,
        MeshStandardMaterial: MockMaterial,
        PlaneGeometry: MockGeometry,
        TextureLoader: MockTextureLoader
    },
    VRODOS: {
        api: {},
        config: { SCENE_SETTINGS_SCHEMA: {} },
        data: { pluginPath: "/plugin" },
        editor: {
            diagnostics: {
                updateCurrentLoad(details) {
                    this.lastUpdate = details;
                },
                recordGlbMetadataCache(result) {
                    this.cacheResults = this.cacheResults || [];
                    this.cacheResults.push(result);
                }
            },
            envir: {
                animationMixers: [],
                isSceneLoading: true,
                loadedObjectsCount: 0,
                renderer: {}
            },
            objectFactory: {
                added: [],
                addSceneObject(object, options) {
                    this.added.push({ object, options });
                    return object;
                }
            },
            renderLoop: { loaderConcurrency: 3 }
        },
        loader: {},
        ui: {},
        utils: {}
    },
    vrodos_data: { scene_mutation_nonce: "nonce" }
};
context.window = context;

for (const relativePath of [
    "assets/js/editor/loaders/vrodos_loader_object_factories.js",
    "assets/js/editor/loaders/vrodos_loader_generated_assets.js",
    "assets/js/editor/loaders/vrodos_loader_resource_metadata.js",
    "assets/js/editor/loaders/vrodos_loader_glb_assets.js",
    "assets/js/editor/loaders/vrodos_loader_multi.js"
]) {
    const source = readFileSync(resolve(root, relativePath), "utf8");
    vm.runInNewContext(source, context, { filename: relativePath });
}

Object.assign(context.VRODOS.utils, {
    applyTRSToObject(object, trs = {}) {
        const translation = trs.translation || [0, 0, 0];
        const rotation = trs.rotation || [0, 0, 0];
        const scale = trs.scale || [1, 1, 1];
        object.position.set(...translation);
        object.rotation.set(...rotation);
        object.scale.set(...scale);
    },
    getAjaxUrl: () => "/wp-admin/admin-ajax.php",
    isDisplayTextField: () => false,
    isSceneAssessmentCategory: (category) => category === "assessment",
    isSceneImageCategory: (category) => category === "image",
    isSceneLightOrPawnCategory: () => false,
    isSceneTextCategory: (category) => category === "3d-text",
    loaderDisplayText: (value) => String(value || ""),
    loaderResolveBaseUrl: () => "/plugin/assets/models/",
    loaderSafeObjectName: (name) => name,
    normalizeRelativeUploadPath: (value) => value,
    normalizeSceneAssetCategory: (value) => String(value || "").toLowerCase()
});
context.VRODOS.loader.applyTextureAnisotropy = () => {};
context.VRODOS.loader.getEditorTextureAnisotropy = () => 1;

let gltfLoaderCreations = 0;
context.VRODOS.loader.createGltfLoader = () => {
    gltfLoaderCreations++;
    return new MockGltfLoader();
};

const videoResources = {
    videoOne: { asset_id: 10, category_slug: "video", glb_id: 0, screenshot_path: "/video-thumb.jpg", trs: {} },
    videoTwo: { asset_id: 11, category_slug: "video", glb_id: 0, trs: {} }
};
const videoLoadResult = await new context.VRODOS.loader.LoaderMulti().load(null, videoResources, "/plugin");
assert(videoLoadResult.every((result) => result.status === "fulfilled"), "generated videos must settle successfully");
assert(gltfLoaderCreations === 0, "video-only scenes must not create a GLTF loader");
assert(context.VRODOS.editor.diagnostics.lastUpdate.glbCount === 0, "videos must consume zero GLB queue slots");
assert(context.VRODOS.editor.diagnostics.lastUpdate.generatedVideoCount === 2, "video diagnostics must report generated placeholders");
assert(context.VRODOS.editor.objectFactory.added.length === 2, "each video must register one selectable scene object");
for (const { object, options } of context.VRODOS.editor.objectFactory.added) {
    let screen = null;
    object.traverse((node) => {
        if (String(node.name || "").includes("screen")) screen = node;
    });
    assert(object.category_slug === "video", "generated video roots must retain the video category");
    assert(options.selectable === true, "generated video roots must be selectable");
    assert(screen?.isMesh === true, "generated video roots must contain a screen mesh");
    assert(screen.geometry.args[0] === 3.887 && screen.geometry.args[1] === 2.98, "generated video screens must preserve the authored footprint");
}
const thumbnailScreen = context.VRODOS.editor.objectFactory.added[0].object.children.find((child) => child.name.includes("screen"));
assert(Boolean(thumbnailScreen.material.map), "the existing video thumbnail texture path must target the generated screen mesh");

let metadataRequests = 0;
context.fetch = async () => {
    metadataRequests++;
    return {
        text: async () => JSON.stringify({
            category_slug: "decoration",
            glbURL: "/dynamic.glb"
        })
    };
};

const hydratedResource = {
    asset_id: 20,
    category_slug: "decoration",
    editorMetadataHydrated: true,
    glb_id: 200,
    glb_path: "/hydrated.glb",
    path: "/hydrated.glb"
};
await context.VRODOS.loader.loadGlbAsset(null, new MockGltfLoader(), "hydrated", hydratedResource, {
    hydrated: hydratedResource
});
assert(metadataRequests === 0, "server-hydrated scene GLBs must not refetch metadata");

const dynamicResource = {
    asset_id: 21,
    category_slug: "decoration",
    glb_id: 201,
    glb_path: "/stale.glb",
    path: "/stale.glb"
};
await context.VRODOS.loader.loadGlbAsset(null, new MockGltfLoader(), "dynamic", dynamicResource, {
    dynamic: dynamicResource
});
assert(metadataRequests === 1, "dynamically added GLBs must refresh metadata");

const originalLoadGlbAsset = context.VRODOS.loader.loadGlbAsset;
const startedAssets = [];
let releaseSlowAsset;
context.VRODOS.editor.renderLoop.loaderConcurrency = 1;
context.VRODOS.loader.loadGlbAsset = (_manager, _loader, name) => {
    startedAssets.push(name);
    if (name === "slow") {
        return new Promise((resolvePromise) => {
            releaseSlowAsset = resolvePromise;
        });
    }
    if (name === "failed") {
        return Promise.reject(new Error("expected test failure"));
    }
    return Promise.resolve(null);
};

const queuedLoad = new context.VRODOS.loader.LoaderMulti().load(null, {
    slow: { category_slug: "decoration", glb_id: 301 },
    failed: { category_slug: "decoration", glb_id: 302 },
    afterFailure: { category_slug: "decoration", glb_id: 303 }
}, "/plugin");
let queueSettled = false;
queuedLoad.then(() => {
    queueSettled = true;
});
await new Promise((resolvePromise) => setImmediate(resolvePromise));
assert(queueSettled === false, "scene completion must wait for unresolved GLB tasks");
assert(startedAssets.join(",") === "slow", "the configured worker limit must remain enforced");

releaseSlowAsset(null);
await queuedLoad;
assert(queueSettled === true, "scene completion must resolve after every GLB task settles");
assert(startedAssets.join(",") === "slow,failed,afterFailure", "a failed GLB task must not prevent later queued assets from loading");
assert(expectedErrors.length === 1, "unexpected GLB task rejection must be diagnosed once");
context.VRODOS.loader.loadGlbAsset = originalLoadGlbAsset;

const sceneManagerSource = readFileSync(resolve(root, "includes/class-vrodos-scene-cpt-manager.php"), "utf8");
const scenePersistenceSource = readFileSync(resolve(root, "assets/js/editor/scene/vrodos_scene_persistence.js"), "utf8");
assert(sceneManagerSource.includes("'editorMetadataHydrated' => true"), "PHP scene bootstrap data must mark hydrated asset metadata");
assert(scenePersistenceSource.includes("'editorMetadataHydrated'"), "the hydration marker must be excluded from persisted scene JSON");

console.log("Editor scene loader tests passed.");
