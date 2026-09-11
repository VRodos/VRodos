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

    clone() {
        return new MockVector(this.x, this.y, this.z);
    }
}

class MockBox3 {
    constructor() {
        this.makeEmpty();
    }

    makeEmpty() {
        this.min = new MockVector(Infinity, Infinity, Infinity);
        this.max = new MockVector(-Infinity, -Infinity, -Infinity);
        return this;
    }

    setFromObject(object) {
        this.makeEmpty();
        object.traverse((node) => {
            if (!node.geometry) return;
            const center = new MockVector();
            let current = node;
            while (current) {
                center.x += current.position.x;
                center.y += current.position.y;
                center.z += current.position.z;
                current = current.parent;
            }
            const halfSize = node.geometry.halfSize || [0.5, 0.5, 0.5];
            this.min.x = Math.min(this.min.x, center.x - halfSize[0]);
            this.min.y = Math.min(this.min.y, center.y - halfSize[1]);
            this.min.z = Math.min(this.min.z, center.z - halfSize[2]);
            this.max.x = Math.max(this.max.x, center.x + halfSize[0]);
            this.max.y = Math.max(this.max.y, center.y + halfSize[1]);
            this.max.z = Math.max(this.max.z, center.z + halfSize[2]);
        });
        return this;
    }

    isEmpty() {
        return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
    }

    getCenter(target) {
        return target.set(
            (this.min.x + this.max.x) / 2,
            (this.min.y + this.max.y) / 2,
            (this.min.z + this.max.z) / 2
        );
    }
}

let mockUuid = 0;

class MockObject3D {
    constructor() {
        this.uuid = `mock-${++mockUuid}`;
        this.children = [];
        this.position = new MockVector();
        this.rotation = new MockVector();
        this.scale = new MockVector(1, 1, 1);
        this.userData = {};
    }

    add(child) {
        this.children.push(child);
        child.parent = this;
    }

    remove(child) {
        this.children = this.children.filter((candidate) => candidate !== child);
        child.parent = null;
    }

    traverse(visitor) {
        visitor(this);
        this.children.forEach((child) => child.traverse(visitor));
    }

    updateMatrixWorld() {}

    clone(recursive = true) {
        const clone = this.isMesh
            ? new MockMesh(this.geometry, this.material)
            : new this.constructor();
        clone.name = this.name;
        clone.isSkinnedMesh = this.isSkinnedMesh;
        clone.userData = { ...this.userData };
        clone.position.set(this.position.x, this.position.y, this.position.z);
        clone.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
        clone.scale.set(this.scale.x, this.scale.y, this.scale.z);
        if (recursive) {
            this.children.forEach((child) => clone.add(child.clone(true)));
        }
        return clone;
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
        this.disposeCount = 0;
    }

    dispose() {
        this.disposeCount++;
    }
}

class MockMaterial {
    constructor(options = {}) {
        Object.assign(this, options);
        this.disposeCount = 0;
    }

    clone() {
        const clone = new MockMaterial({ ...this });
        clone.disposeCount = 0;
        return clone;
    }

    dispose() {
        this.disposeCount++;
    }
}

class MockTexture {
    constructor() {
        this.isTexture = true;
        this.disposeCount = 0;
        this.repeat = new MockVector(1, 1);
    }

    dispose() {
        this.disposeCount++;
    }
}

class MockAnimationMixer {
    constructor(root) {
        this._root = root;
        this.stopCount = 0;
        this.uncacheCount = 0;
    }

    clipAction() {
        return { play() {} };
    }

    stopAllAction() {
        this.stopCount++;
    }

    uncacheRoot() {
        this.uncacheCount++;
    }
}

class MockTextureLoader {
    setCrossOrigin() {
        return this;
    }

    load(_url, onLoad) {
        const texture = new MockTexture();
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
const scheduledTimers = [];
let skeletonCloneCalls = 0;
const context = {
    URLSearchParams,
    alert() {},
	addEventListener() {},
	clearTimeout(timer) {
		if (timer) timer.cancelled = true;
	},
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
	setTimeout(callback) {
		const timer = { callback, cancelled: false };
		scheduledTimers.push(timer);
		return timer;
	},
    THREE: {
        AnimationMixer: MockAnimationMixer,
        Box3: MockBox3,
        BoxGeometry: MockGeometry,
        DoubleSide: 2,
        FrontSide: 0,
        GLTFLoader: MockGltfLoader,
        Group: MockGroup,
        Mesh: MockMesh,
        MeshBasicMaterial: MockMaterial,
        MeshStandardMaterial: MockMaterial,
        PlaneGeometry: MockGeometry,
        SkeletonUtils: {
            clone(source) {
                skeletonCloneCalls++;
                return source.clone(true);
            }
        },
        TextureLoader: MockTextureLoader,
        RepeatWrapping: 1000,
        SRGBColorSpace: "srgb",
        NoColorSpace: "",
        Vector2: MockVector,
        Vector3: MockVector
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
                },
                recordParsedGlbCache(result) {
                    this.parsedCacheResults = this.parsedCacheResults || [];
                    this.parsedCacheResults.push(result);
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
    "assets/js/runtime/master/vrodos_surface_material.js",
    "assets/js/editor/core/vrodos_editor_core_utils.js",
    "assets/js/editor/loaders/vrodos_loader_object_factories.js",
    "assets/js/editor/loaders/vrodos_loader_generated_assets.js",
    "assets/js/editor/loaders/vrodos_loader_resource_metadata.js",
    "assets/js/editor/loaders/vrodos_loader_glb_asset_cache.js",
    "assets/js/editor/scene/vrodos_scene_disposal.js",
    "assets/js/runtime/master/vrodos_model_origin.js",
    "assets/js/editor/loaders/vrodos_loader_glb_assets.js",
    "assets/js/editor/loaders/vrodos_loader_multi.js",
    "assets/js/editor/loaders/vrodos_loader_scene_lifecycle.js"
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

const planeAddedStart = context.VRODOS.editor.objectFactory.added.length;
const defaultPlaneObject = context.VRODOS.loader.createPrimitivePlaneObject("default-ground", {});
assert(defaultPlaneObject.planeWidth === 100 && defaultPlaneObject.planeDepth === 100, "new procedural planes must default to 100 by 100 metres");
const planeLoadResult = await new context.VRODOS.loader.LoaderMulti().load(null, {
    ground: {
        category_slug: "primitive-plane",
        planeWidth: 30,
        planeDepth: 12,
        surfaceTileSizeMeters: 3,
        surfaceAlbedoUrl: "/ground-albedo.jpg",
        surfaceNormalUrl: "/ground-normal.jpg",
        surfaceRoughnessUrl: "/ground-roughness.jpg",
        surfaceAoUrl: "/ground-ao.jpg",
        surfaceMetalnessUrl: "/ground-metalness.jpg",
        surfaceNormalYSign: -1,
        surfaceAntiTilingEnabled: true,
        surfaceAntiTilingPatchTiles: 1.25,
        surfaceAntiTilingBlendSharpness: 4,
        position: [2, 0, 3],
        rotation: [-Math.PI / 2, 0, 0],
        scale: [1, 1, 1],
        trs: { translation: [2, 0, 3], rotation: [-Math.PI / 2, 0, 0], scale: [1, 1, 1] }
    }
}, "/plugin");
assert(planeLoadResult.every((result) => result.status === "fulfilled"), "procedural planes must settle successfully");
assert(gltfLoaderCreations === 0, "procedural planes must not create a GLTF loader");
const planeObject = context.VRODOS.editor.objectFactory.added.slice(planeAddedStart).at(-1).object;
assert(planeObject.category_slug === "primitive-plane" && planeObject.isMesh === true, "procedural planes must load as selectable meshes");
assert(planeObject.geometry.args[0] === 30 && planeObject.geometry.args[1] === 12, "procedural plane geometry must use authored metre dimensions");
assert(planeObject.material.map.repeat.x === 10 && planeObject.material.map.repeat.y === 4, "albedo repeat must derive from dimensions divided by metres per tile");
for (const map of [planeObject.material.map, planeObject.material.normalMap, planeObject.material.roughnessMap, planeObject.material.aoMap, planeObject.material.metalnessMap]) {
    assert(map.repeat.x === 10 && map.repeat.y === 4, "every PBR map must share the same physical tile repeat");
}
assert(planeObject.material.normalScale.y === -1, "DirectX normal packages must invert the runtime normal Y scale without rewriting the image");
assert(planeObject.material.__vrodosStochasticTilingState?.patchTiles === 1.25, "plane materials must receive stochastic patch settings");
assert(planeObject.material.customProgramCacheKey().includes("vrodos-stochastic-pbr-tiling-v2"), "stochastic tiling must provide a stable shader cache key");
const surfaceShader = {
    uniforms: {},
    vertexShader: "#include <common>\n#include <begin_vertex>",
    fragmentShader: "#include <common>\nvoid main() {\n#include <map_fragment>\n#include <roughnessmap_fragment>\n#include <metalnessmap_fragment>\n#include <normal_fragment_maps>\n#include <aomap_fragment>\n}"
};
planeObject.material.onBeforeCompile(surfaceShader, {});
assert(surfaceShader.fragmentShader.includes("vrodosBuildStochasticUv(vMapUv,"), "stochastic tiling must derive one shared sample pattern from the albedo UVs");
assert(surfaceShader.fragmentShader.includes("vrodosStochasticAlbedo(map"), "stochastic tiling must replace repeated albedo sampling");
assert(surfaceShader.fragmentShader.includes("vrodosStochasticTexture(roughnessMap"), "stochastic tiling must keep roughness sampling aligned");
assert(surfaceShader.fragmentShader.includes("vrodosStochasticTexture(normalMap"), "stochastic tiling must keep normal sampling aligned");
assert(surfaceShader.fragmentShader.includes("vrodosStochasticTexture(aoMap"), "stochastic tiling must keep AO sampling aligned");
assert(surfaceShader.fragmentShader.includes("vrodosStochasticTexture(metalnessMap"), "stochastic tiling must keep metalness sampling aligned");
assert(!surfaceShader.fragmentShader.includes("#include <normal_fragment_maps>"), "the stock repeated normal-map sample must be replaced");
assert(!surfaceShader.fragmentShader.includes("#include <aomap_fragment>"), "the stock repeated AO-map sample must be replaced");
planeObject.planeWidth = 60;
context.VRODOS.loader.refreshPrimitivePlaneGeometry(planeObject);
context.VRODOS.loader.refreshPrimitivePlaneMaterial(planeObject);
assert(planeObject.material.map.repeat.x === 20 && planeObject.material.map.repeat.y === 4, "resizing a plane must retile rather than stretch its textures");

let metadataRequests = 0;
context.fetch = async () => {
    metadataRequests++;
    return {
        text: async () => JSON.stringify({
            category_slug: "decoration",
			glbURL: "/dynamic.glb",
			editorLoad: { status: "ready", loadUrl: "/dynamic.glb", loadVariant: "source", canonicalUrl: "/dynamic.glb" }
        })
    };
};

const hydratedResource = {
    asset_id: 20,
    category_slug: "decoration",
    editorMetadataHydrated: true,
    glb_id: 200,
    glb_path: "/hydrated.glb",
	path: "/hydrated.glb",
	editorLoad: { status: "ready", loadUrl: "/hydrated.glb", loadVariant: "source", canonicalUrl: "/hydrated.glb" }
};
const hydratedObject = await context.VRODOS.loader.loadGlbAsset(null, new MockGltfLoader(), "hydrated", hydratedResource, {
    hydrated: hydratedResource
});
assert(metadataRequests === 0, "server-hydrated scene GLBs must not refetch metadata");
assert(hydratedObject.compiledCollisionEnabled === true, "loaded decorations without a saved collision choice must default to collidable");

const previewLoader = new MockGltfLoader();
const previewResource = {
    asset_id: 22,
    category_slug: "decoration",
    editorMetadataHydrated: true,
    glb_id: 202,
    glb_path: "/source.glb",
    path: "/source.glb",
	editorLoad: {
		status: "ready",
		loadUrl: "/preview.glb",
		loadVariant: "editor-preview",
		canonicalUrl: "/source.glb",
		loadBytes: 1024
	},
    compiledCollisionEnabled: false
};
const previewObject = await context.VRODOS.loader.loadGlbAsset(null, previewLoader, "preview", previewResource, {
    preview: previewResource
});
assert(previewLoader.loadedUrl === "/preview.glb", "ready editor previews must replace qualifying source requests");
assert(previewObject.editor_loaded_glb_path === "/preview.glb", "loaded editor objects must record the preview URL");
assert(previewObject.glb_path === "/source.glb", "preview loading must preserve the canonical source URL for persistence and compilation");
assert(previewObject.compiledCollisionEnabled === false, "loaded decorations must preserve an explicitly disabled collision choice");

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

const removedPendingResource = {
	asset_id: 24,
	category_slug: "decoration",
	editorMetadataHydrated: true,
	glb_id: 204,
	glb_path: "/large-source.glb",
	path: "/large-source.glb",
	editorLoad: {
		status: "pending",
		loadUrl: "",
		loadVariant: "none",
		canonicalUrl: "/large-source.glb",
		sourceBytes: 300 * 1024 * 1024
	}
};
const removedPendingResources = { removedPending: removedPendingResource };
let pendingMetadataRequests = 0;
context.fetch = async () => {
	pendingMetadataRequests++;
	return { text: async () => "{}" };
};
const removedPendingResult = await context.VRODOS.loader.loadGlbAsset(
	null,
	new MockGltfLoader(),
	"removedPending",
	removedPendingResource,
	removedPendingResources
);
assert(removedPendingResult === null, "a qualifying pending preview must not fall back to its source GLB");
assert(scheduledTimers.length === 1, "a pending preview must schedule one status poll");
delete removedPendingResources.removedPending;
await scheduledTimers.shift().callback();
assert(pendingMetadataRequests === 0, "deleting a pending placement must cancel its late metadata refresh");
assert(context.VRODOS.loader.pendingEditorGlbLoads.size === 0, "deleted pending placements must be removed from the retry registry");

const coalescedPendingResources = {
	coalescedA: {
		asset_id: 26,
		category_slug: "decoration",
		editorMetadataHydrated: true,
		glb_path: "/coalesced-source.glb",
		editorLoad: { status: "pending", loadUrl: "", loadVariant: "none", canonicalUrl: "/coalesced-source.glb" }
	},
	coalescedB: {
		asset_id: 26,
		category_slug: "decoration",
		editorMetadataHydrated: true,
		glb_path: "/coalesced-source.glb",
		editorLoad: { status: "pending", loadUrl: "", loadVariant: "none", canonicalUrl: "/coalesced-source.glb" }
	}
};
await context.VRODOS.loader.loadGlbAsset(null, new MockGltfLoader(), "coalescedA", coalescedPendingResources.coalescedA, coalescedPendingResources);
await context.VRODOS.loader.loadGlbAsset(null, new MockGltfLoader(), "coalescedB", coalescedPendingResources.coalescedB, coalescedPendingResources);
assert(scheduledTimers.length === 1, "separate pending placements of one asset must share one status poll");
delete coalescedPendingResources.coalescedA;
delete coalescedPendingResources.coalescedB;
await scheduledTimers.shift().callback();
assert(context.VRODOS.loader.pendingEditorGlbLoads.size === 0, "the shared pending poll must stop after all matching placements are removed");

const readyPendingResource = {
	asset_id: 25,
	category_slug: "decoration",
	editorMetadataHydrated: true,
	glb_id: 205,
	glb_path: "/second-large-source.glb",
	path: "/second-large-source.glb",
	editorLoad: {
		status: "pending",
		loadUrl: "",
		loadVariant: "none",
		canonicalUrl: "/second-large-source.glb",
		sourceBytes: 200 * 1024 * 1024
	}
};
const readyPendingResources = { readyPending: readyPendingResource };
context.fetch = async () => ({
	text: async () => JSON.stringify({
		glbURL: "/second-large-source.glb",
		editorLoad: {
			status: "ready",
			loadUrl: "/second-preview.glb",
			loadVariant: "editor-preview",
			canonicalUrl: "/second-large-source.glb",
			loadBytes: 5 * 1024 * 1024
		}
	})
});
const pendingAddedStart = context.VRODOS.editor.objectFactory.added.length;
await context.VRODOS.loader.loadGlbAsset(
	null,
	new MockGltfLoader(),
	"readyPending",
	readyPendingResource,
	readyPendingResources
);
assert(scheduledTimers.length === 1, "each pending asset family must use one coalesced status poll");
await scheduledTimers.shift().callback();
assert(context.VRODOS.editor.objectFactory.added.length === pendingAddedStart + 1, "a preview that becomes ready must be inserted without reopening the editor");
assert(context.VRODOS.editor.objectFactory.added.at(-1).object.editor_loaded_glb_path === "/second-preview.glb", "the completed pending job must load its optimized preview URL");
assert(context.VRODOS.loader.pendingEditorGlbLoads.size === 0, "ready pending previews must leave no retry timer behind");

class ControlledGltfLoader {
    constructor() {
        this.calls = [];
        this.pending = new Map();
    }

    load(url, onLoad, _onProgress, onError) {
        this.calls.push(url);
        this.pending.set(url, { onLoad, onError });
    }

    resolve(url, gltf) {
        const request = this.pending.get(url);
        assert(Boolean(request), `expected a pending GLB request for ${url}`);
        this.pending.delete(url);
        request.onLoad(gltf);
    }

    reject(url, error) {
        const request = this.pending.get(url);
        assert(Boolean(request), `expected a pending GLB request for ${url}`);
        this.pending.delete(url);
        request.onError(error);
    }
}

function createGlbTemplate(label, options = {}) {
    const texture = new MockTexture();
    const geometry = new MockGeometry(label);
    const material = new MockMaterial({ map: texture });
    const scene = new MockGroup();
    const mesh = new MockMesh(geometry, material);
    mesh.name = `${label}-mesh`;
    mesh.isSkinnedMesh = options.skinned === true;
    if (Array.isArray(options.offset)) {
        mesh.position.set(...options.offset);
    }
    scene.add(mesh);
    return {
        gltf: {
            scene,
            animations: options.animations || []
        },
        geometry,
        material,
        texture
    };
}

async function flushTasks() {
    await Promise.resolve();
    await new Promise((resolvePromise) => setImmediate(resolvePromise));
}

const centeredLoader = new ControlledGltfLoader();
const centeredResource = {
    asset_id: 23,
    category_slug: "decoration",
    editorMetadataHydrated: true,
    glb_id: 203,
    glb_path: "/centered.glb",
    path: "/centered.glb",
	editorLoad: { status: "ready", loadUrl: "/centered.glb", loadVariant: "source", canonicalUrl: "/centered.glb" },
    vrodosAssetOriginMode: "bounds-center",
    trs: { translation: [3, 4, 5] }
};
const centeredLoad = context.VRODOS.loader.loadGlbAsset(
    null,
    centeredLoader,
    "centered",
    centeredResource,
    { centered: centeredResource }
);
await flushTasks();
const centeredTemplate = createGlbTemplate("centered", {
    offset: [10, 2, -4],
    animations: [{ name: "centered-idle" }]
});
centeredLoader.resolve("/centered.glb", centeredTemplate.gltf);
const centeredObject = await centeredLoad;
assert(centeredObject.position.x === 3 && centeredObject.position.y === 4 && centeredObject.position.z === 5, "centered roots must retain authored placement transforms");
assert(centeredObject.vrodosAssetOriginMode === "bounds-center", "centered roots must retain origin metadata for persistence");
assert(centeredObject.isSelectableMesh === true, "centered pivot roots must remain selectable");
assert(centeredObject.children[0].name === "vrodosModelOriginOffset", "marked GLBs must place content under an origin offset");
assert(centeredObject.children[0].position.x === -10 && centeredObject.children[0].position.y === -2 && centeredObject.children[0].position.z === 4, "the origin offset must negate the model bounds center");
assert(centeredTemplate.gltf.scene.children[0].position.x === 10, "centering must not rewrite imported node transforms");
assert(context.VRODOS.loader.glbAssetCache.isInstance(centeredObject), "centered pivot roots must preserve cache instance identity");
assert(context.VRODOS.editor.envir.animationMixers.some((mixer) => mixer._root === centeredObject), "centered animations must be rooted at the authored pivot");

context.VRODOS.editor.renderLoop.loaderConcurrency = 3;
const duplicateLoader = new ControlledGltfLoader();
context.VRODOS.loader.createGltfLoader = () => duplicateLoader;
const duplicateAddedStart = context.VRODOS.editor.objectFactory.added.length;
const duplicateLoad = new context.VRODOS.loader.LoaderMulti().load(null, {
    treeOne: {
        asset_id: 30,
        category_slug: "decoration",
        editorMetadataHydrated: true,
        glb_id: 8521,
        glb_path: "/tree.glb",
		editorLoad: { status: "ready", loadUrl: "/tree.glb", loadVariant: "source", canonicalUrl: "/tree.glb" },
        trs: { translation: [1, 0, 0] }
    },
    treeTwo: {
        asset_id: 30,
        category_slug: "decoration",
        editorMetadataHydrated: true,
        glb_id: 8521,
        glb_path: "/tree.glb",
		editorLoad: { status: "ready", loadUrl: "/tree.glb", loadVariant: "source", canonicalUrl: "/tree.glb" },
        trs: { translation: [2, 0, 0] }
    },
    treeThree: {
        asset_id: 30,
        category_slug: "decoration",
        editorMetadataHydrated: true,
        glb_id: 8521,
        glb_path: "/tree.glb",
		editorLoad: { status: "ready", loadUrl: "/tree.glb", loadVariant: "source", canonicalUrl: "/tree.glb" },
        trs: { translation: [3, 0, 0] }
    },
    building: {
        asset_id: 31,
        category_slug: "decoration",
        editorMetadataHydrated: true,
        glb_id: 8522,
        glb_path: "/building.glb",
		editorLoad: { status: "ready", loadUrl: "/building.glb", loadVariant: "source", canonicalUrl: "/building.glb" },
        trs: { translation: [4, 0, 0] }
    }
}, "/plugin");
let duplicateLoadSettled = false;
duplicateLoad.then(() => {
    duplicateLoadSettled = true;
});
await flushTasks();
assert(duplicateLoadSettled === false, "scene completion must wait for unresolved unique GLBs");
assert(duplicateLoader.calls.length === 2, "duplicate placements must issue one GLTFLoader request per unique URL");
assert(duplicateLoader.calls.includes("/tree.glb"), "the repeated tree GLB must start loading");
assert(duplicateLoader.calls.includes("/building.glb"), "an unrelated unique GLB must not wait behind repeated placements");

const treeTemplate = createGlbTemplate("tree");
const buildingTemplate = createGlbTemplate("building");
duplicateLoader.resolve("/building.glb", buildingTemplate.gltf);
duplicateLoader.resolve("/tree.glb", treeTemplate.gltf);
await duplicateLoad;
assert(duplicateLoadSettled === true, "scene completion must resolve after every unique GLB settles");
assert(context.VRODOS.editor.diagnostics.lastUpdate.glbPlacementCount === 4, "diagnostics must count every GLB placement");
assert(context.VRODOS.editor.diagnostics.lastUpdate.uniqueGlbCount === 2, "diagnostics must count unique GLB URLs");
assert(context.VRODOS.editor.diagnostics.lastUpdate.reusedGlbPlacementCount === 2, "diagnostics must count reused placements");

const duplicateObjects = context.VRODOS.editor.objectFactory.added
    .slice(duplicateAddedStart)
    .map(({ object }) => object);
const loadedTreeOne = duplicateObjects.find((object) => object.name === "treeOne");
const loadedTreeTwo = duplicateObjects.find((object) => object.name === "treeTwo");
const loadedTreeThree = duplicateObjects.find((object) => object.name === "treeThree");
assert(Boolean(loadedTreeOne && loadedTreeTwo && loadedTreeThree), "every repeated placement must create a scene root");
assert(loadedTreeOne.uuid !== loadedTreeTwo.uuid, "reused placements must retain unique root UUIDs");
assert(loadedTreeOne.children[0].uuid !== loadedTreeTwo.children[0].uuid, "reused placements must retain unique child UUIDs");
assert(loadedTreeOne.position.x === 1 && loadedTreeTwo.position.x === 2 && loadedTreeThree.position.x === 3, "reused placements must retain independent transforms");
assert(loadedTreeOne.children[0].geometry === loadedTreeTwo.children[0].geometry, "reused placements must share geometry");
assert(loadedTreeOne.children[0].material !== loadedTreeTwo.children[0].material, "reused placements must clone materials");
assert(loadedTreeOne.children[0].material.map === loadedTreeTwo.children[0].material.map, "reused placements must share textures");
assert(context.VRODOS.loader.glbAssetCache.isInstance(loadedTreeOne), "reused roots must be marked as cache instances");

const metadataBeforeCacheHit = metadataRequests;
let cacheHitLoaderCalls = 0;
context.fetch = async () => {
    metadataRequests++;
    return {
        text: async () => JSON.stringify({
            category_slug: "decoration",
			glbURL: "/tree.glb",
			editorLoad: { status: "ready", loadUrl: "/tree.glb", loadVariant: "source", canonicalUrl: "/tree.glb" }
        })
    };
};
const dynamicCachedResource = {
    asset_id: 30,
    category_slug: "decoration",
    glb_id: 8521,
    glb_path: "/stale-tree.glb",
    trs: { translation: [5, 0, 0] }
};
const dynamicCachedObject = await context.VRODOS.loader.loadGlbAsset({
    itemStart() {},
    itemEnd() {},
    itemError() {}
}, {
    load() {
        cacheHitLoaderCalls++;
    }
}, "treeDynamic", dynamicCachedResource, { treeDynamic: dynamicCachedResource });
assert(metadataRequests === metadataBeforeCacheHit + 1, "dynamic cache hits must still refresh asset metadata");
assert(cacheHitLoaderCalls === 0, "a dynamically added placement must reuse an already parsed GLB");

const animatedLoader = new ControlledGltfLoader();
const animationClip = { name: "idle" };
const animatedResourceOne = {
    asset_id: 40,
    category_slug: "decoration",
    editorMetadataHydrated: true,
    glb_id: 9001,
    glb_path: "/character.glb",
	editorLoad: { status: "ready", loadUrl: "/character.glb", loadVariant: "source", canonicalUrl: "/character.glb" },
    trs: {}
};
const animatedResourceTwo = {
    ...animatedResourceOne,
    trs: { translation: [2, 0, 0] }
};
const animatedLoadOne = context.VRODOS.loader.loadGlbAsset(
    null,
    animatedLoader,
    "characterOne",
    animatedResourceOne,
    { characterOne: animatedResourceOne }
);
const animatedLoadTwo = context.VRODOS.loader.loadGlbAsset(
    null,
    animatedLoader,
    "characterTwo",
    animatedResourceTwo,
    { characterTwo: animatedResourceTwo }
);
await flushTasks();
assert(animatedLoader.calls.length === 1, "concurrent requests for one GLB must share the pending cache promise");
const characterTemplate = createGlbTemplate("character", {
    skinned: true,
    animations: [animationClip]
});
animatedLoader.resolve("/character.glb", characterTemplate.gltf);
const [characterOne, characterTwo] = await Promise.all([animatedLoadOne, animatedLoadTwo]);
assert(skeletonCloneCalls >= 2, "skinned GLBs must use SkeletonUtils for every placement");
assert(characterOne.children[0].geometry === characterTwo.children[0].geometry, "skinned placements must share geometry");
assert(characterOne.children[0].material !== characterTwo.children[0].material, "skinned placements must retain independent materials");
const characterMixers = context.VRODOS.editor.envir.animationMixers.filter((mixer) => (
    mixer._root === characterOne || mixer._root === characterTwo
));
assert(characterMixers.length === 2, "animated placements must receive independent animation mixers");

const retryLoader = new ControlledGltfLoader();
const retryResource = {
    asset_id: 50,
    category_slug: "decoration",
    editorMetadataHydrated: true,
    glb_id: 9100,
    glb_path: "/retry.glb",
	editorLoad: { status: "ready", loadUrl: "/retry.glb", loadVariant: "source", canonicalUrl: "/retry.glb" },
    trs: {}
};
const failedAttempt = context.VRODOS.loader.loadGlbAsset(
    null,
    retryLoader,
    "retryFailed",
    retryResource,
    { retryFailed: retryResource }
);
await flushTasks();
retryLoader.reject("/retry.glb", new Error("expected cache retry failure"));
assert(await failedAttempt === null, "a failed GLB request must settle its placement");
const successfulRetry = context.VRODOS.loader.loadGlbAsset(
    null,
    retryLoader,
    "retrySuccessful",
    retryResource,
    { retrySuccessful: retryResource }
);
await flushTasks();
assert(retryLoader.calls.length === 2, "failed parsed cache entries must be removed so a later request retries");
retryLoader.resolve("/retry.glb", createGlbTemplate("retry").gltf);
assert(Boolean(await successfulRetry), "a retried GLB request must be able to succeed");

context.VRODOS.editor.renderLoop.loaderConcurrency = 1;
const serialLoader = new ControlledGltfLoader();
context.VRODOS.loader.createGltfLoader = () => serialLoader;
const serialLoad = new context.VRODOS.loader.LoaderMulti().load(null, {
    slow: { category_slug: "decoration", editorMetadataHydrated: true, glb_id: 9201, glb_path: "/slow.glb" },
    failed: { category_slug: "decoration", editorMetadataHydrated: true, glb_id: 9202, glb_path: "/failed.glb" },
    afterFailure: { category_slug: "decoration", editorMetadataHydrated: true, glb_id: 9203, glb_path: "/after-failure.glb" }
}, "/plugin");
let serialLoadSettled = false;
serialLoad.then(() => {
    serialLoadSettled = true;
});
await flushTasks();
assert(serialLoadSettled === false, "the scene must remain gated while a unique GLB is unresolved");
assert(serialLoader.calls.join(",") === "/slow.glb", "the configured unique-GLB worker limit must remain enforced");
serialLoader.resolve("/slow.glb", createGlbTemplate("slow").gltf);
await flushTasks();
assert(serialLoader.calls.join(",") === "/slow.glb,/failed.glb", "the next unique GLB must start after the worker is released");
serialLoader.reject("/failed.glb", new Error("expected queued failure"));
await flushTasks();
assert(serialLoader.calls.join(",") === "/slow.glb,/failed.glb,/after-failure.glb", "a failed GLB must not prevent later unique assets from loading");
serialLoader.resolve("/after-failure.glb", createGlbTemplate("after-failure").gltf);
await serialLoad;
assert(serialLoadSettled === true, "scene completion must wait until successful and failed GLBs all settle");

const sizeOrderedLoader = new ControlledGltfLoader();
context.VRODOS.loader.createGltfLoader = () => sizeOrderedLoader;
const sizeOrderedLoad = new context.VRODOS.loader.LoaderMulti().load(null, {
	small: { category_slug: "decoration", editorMetadataHydrated: true, glb_id: 9301, glb_path: "/small.glb", editorLoad: { status: "ready", loadUrl: "/small.glb", loadVariant: "source", canonicalUrl: "/small.glb", sourceBytes: 10 } },
	largest: { category_slug: "decoration", editorMetadataHydrated: true, glb_id: 9302, glb_path: "/largest.glb", editorLoad: { status: "ready", loadUrl: "/largest.glb", loadVariant: "source", canonicalUrl: "/largest.glb", sourceBytes: 80 } },
	medium: { category_slug: "decoration", editorMetadataHydrated: true, glb_id: 9303, glb_path: "/medium.glb", editorLoad: { status: "ready", loadUrl: "/medium.glb", loadVariant: "source", canonicalUrl: "/medium.glb", sourceBytes: 40 } }
}, "/plugin");
await flushTasks();
assert(sizeOrderedLoader.calls.join(",") === "/largest.glb", "the largest unique GLB must start first");
sizeOrderedLoader.resolve("/largest.glb", createGlbTemplate("largest").gltf);
await flushTasks();
assert(sizeOrderedLoader.calls.join(",") === "/largest.glb,/medium.glb", "the next-largest GLB must start when the worker is released");
sizeOrderedLoader.resolve("/medium.glb", createGlbTemplate("medium").gltf);
await flushTasks();
sizeOrderedLoader.resolve("/small.glb", createGlbTemplate("small").gltf);
await sizeOrderedLoad;
assert(sizeOrderedLoader.calls.join(",") === "/largest.glb,/medium.glb,/small.glb", "unique GLBs must retain largest-first scheduling through completion");

const sharedTreeGeometry = loadedTreeOne.children[0].geometry;
const sharedTreeTexture = loadedTreeOne.children[0].material.map;
const reloadInstanceMaterial = dynamicCachedObject.children[0].material;
const reloadScene = new MockGroup();
reloadScene.add(dynamicCachedObject);
context.VRODOS.editor.envir.scene = reloadScene;
context.VRODOS.editor.envir.animationMixers = characterMixers.slice();
context.VRODOS.editor.envir.selectableMeshes = new Set([dynamicCachedObject]);
context.VRODOS.editor.selection = { clear() {} };
context.VRODOS.editor.sceneRegistry = { clear() {} };
const cacheEntriesBeforeReload = context.VRODOS.loader.glbAssetCache.snapshot().entries;
context.VRODOS.api.clearSceneForReload();
assert(reloadScene.children.length === 0, "scene reload must remove cached placement roots");
assert(reloadInstanceMaterial.disposeCount === 1, "scene reload must dispose cached placement materials");
assert(sharedTreeGeometry.disposeCount === 0 && sharedTreeTexture.disposeCount === 0, "scene reload must retain parsed shared resources");
assert(context.VRODOS.loader.glbAssetCache.snapshot().entries === cacheEntriesBeforeReload, "scene reload must preserve the session GLB cache");
assert(context.VRODOS.editor.envir.animationMixers.length === 0, "scene reload must remove stale animation mixers");
assert(characterMixers.every((mixer) => mixer.stopCount === 1 && mixer.uncacheCount === 1), "scene reload must stop and uncache animated placements");

const firstTreeMaterial = loadedTreeOne.children[0].material;
const secondTreeMaterial = loadedTreeTwo.children[0].material;
context.VRODOS.utils.disposeObject(loadedTreeOne);
assert(firstTreeMaterial.disposeCount === 1, "deleting a cached placement must dispose its cloned material");
assert(secondTreeMaterial.disposeCount === 0, "deleting one placement must not dispose another placement's material");
assert(sharedTreeGeometry.disposeCount === 0, "deleting one placement must retain shared geometry");
assert(sharedTreeTexture.disposeCount === 0, "deleting one placement must retain shared textures");
const centeredInstanceMesh = centeredObject.children[0].children[0].children[0];
context.VRODOS.utils.disposeObject(centeredObject);
assert(centeredInstanceMesh.material.disposeCount === 1, "deleting a centered placement must dispose its cloned material");
assert(centeredTemplate.geometry.disposeCount === 0 && centeredTemplate.texture.disposeCount === 0, "deleting a centered placement must retain shared cached resources");
assert(context.VRODOS.editor.diagnostics.parsedCacheResults.includes("hit"), "parsed-cache diagnostics must record completed cache hits");
assert(context.VRODOS.editor.diagnostics.parsedCacheResults.includes("miss"), "parsed-cache diagnostics must record cache misses");
assert(context.VRODOS.editor.diagnostics.parsedCacheResults.includes("coalesced"), "parsed-cache diagnostics must record pending-request coalescing");
context.VRODOS.loader.glbAssetCache.clear();
assert(sharedTreeGeometry.disposeCount === 1, "clearing the session cache must dispose shared geometry once");
assert(sharedTreeTexture.disposeCount === 1, "clearing the session cache must dispose shared textures once");
assert(context.VRODOS.loader.glbAssetCache.snapshot().entries === 0, "clearing the session cache must remove every parsed entry");

const sceneManagerSource = readFileSync(resolve(root, "includes/class-vrodos-scene-cpt-manager.php"), "utf8");
const scenePersistenceSource = readFileSync(resolve(root, "assets/js/editor/scene/vrodos_scene_persistence.js"), "utf8");
const assetManagerSource = readFileSync(resolve(root, "includes/class-vrodos-asset-manager.php"), "utf8");
const threeVendorSource = readFileSync(resolve(root, "scripts/build/entries/three-vendor.mjs"), "utf8");
const editorEnvironmentSource = readFileSync(resolve(root, "assets/js/editor/render/vrodos_editor_scene_environment.js"), "utf8");
const assetBrowserSource = readFileSync(resolve(root, "assets/js/editor/ui/vrodos_asset_browser_toolbar.js"), "utf8");
const editorInitializerSource = readFileSync(resolve(root, "assets/js/editor/core/vrodos_editor_initializer.js"), "utf8");
const editorNamespaceSource = readFileSync(resolve(root, "assets/js/editor/vrodos_namespace.js"), "utf8");
const sceneLifecycleSource = readFileSync(resolve(root, "assets/js/editor/loaders/vrodos_loader_scene_lifecycle.js"), "utf8");
const glbLoaderSource = readFileSync(resolve(root, "assets/js/editor/loaders/vrodos_loader_glb_assets.js"), "utf8");
assert(sceneManagerSource.includes("'editorMetadataHydrated' => true"), "PHP scene bootstrap data must mark hydrated asset metadata");
assert(scenePersistenceSource.includes("'editorMetadataHydrated'"), "the hydration marker must be excluded from persisted scene JSON");
assert(assetManagerSource.includes("vrodos_loader_glb_asset_cache"), "the editor must register and load the parsed GLB cache");
assert(!assetManagerSource.includes("wp_enqueue_media("), "the scene editor must not enqueue the unused WordPress media graph");
assert(assetManagerSource.includes("'in_footer' => true") && assetManagerSource.includes("'strategy'  => 'defer'"), "VRodos scripts must load deferred in the footer");
assert(editorEnvironmentSource.includes(".load('spot1Lux.hdr'"), "the editor must use the lightweight HDR environment");
assert(!editorEnvironmentSource.includes("Stonewall_Ref.hdr"), "the heavyweight editor HDR must stay off the authoring path");
assert(assetBrowserSource.includes('loading="lazy" decoding="async"'), "asset thumbnails must decode asynchronously and load lazily");
assert(editorInitializerSource.indexOf("vrodosScheduleAvailableAssetsFetch();") < editorInitializerSource.indexOf("VRODOS.api.loadEditorSceneResources(initialSceneData"), "the asset browser must begin fetching before the scene GLBs settle");
assert(editorNamespaceSource.includes("window.performance.mark('vrodos-editor-script-start')"), "the first editor dependency must mark script execution start");
assert(editorInitializerSource.includes("window.performance.mark('vrodos-editor-shell-ready')"), "editor shell readiness must be marked");
assert(sceneLifecycleSource.includes("window.performance.mark('vrodos-editor-scene-load-start')") && sceneLifecycleSource.includes("window.performance.mark('vrodos-editor-scene-ready')"), "scene loading must expose start and ready marks");
assert(glbLoaderSource.includes("Retry Preview") && glbLoaderSource.includes("Load Full Source Quality"), "failed scene-editor previews must expose retry and explicit source actions");
assert(glbLoaderSource.includes("managedAsset ? '' : canonicalUrl"), "managed assets must never bypass the shared resolver and silently load their source URL");
assert(sceneLifecycleSource.includes("hasPreviewActions"), "scene finalization must not hide actionable preview failures");
assert(threeVendorSource.includes("SkeletonUtils"), "the Three.js vendor bundle must export SkeletonUtils for skinned clones");

console.log("Editor scene loader tests passed.");
