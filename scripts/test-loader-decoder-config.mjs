import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

class MockDracoLoader {
    setDecoderPath(path) {
        this.decoderPath = path;
        return this;
    }
}

class MockKtx2Loader {
    setTranscoderPath(path) {
        this.transcoderPath = path;
        return this;
    }

    detectSupport(renderer) {
        this.detectedRenderer = renderer;
        return this;
    }
}

class MockGltfLoader {
    constructor(manager) {
        this.manager = manager;
    }

    setDRACOLoader(loader) {
        this.dracoLoader = loader;
        return this;
    }

    setKTX2Loader(loader) {
        this.ktx2Loader = loader;
        return this;
    }

    setMeshoptDecoder(decoder) {
        this.meshoptDecoder = decoder;
        return this;
    }
}

const manager = { name: "manager" };
const renderer = { name: "renderer" };
const meshoptDecoder = { name: "meshopt" };
const context = {
    console,
    VRODOS: {},
    THREE: {
        DefaultLoadingManager: { name: "default-manager" },
        DRACOLoader: MockDracoLoader,
        KTX2Loader: MockKtx2Loader,
        GLTFLoader: MockGltfLoader,
        MeshoptDecoder: meshoptDecoder
    },
    vrodos_three_draco_decoder_path: "/assets/vendor/three-r185/draco/gltf/",
    vrodos_three_decoder_path: "/assets/vendor/three-r185/draco/",
    vrodos_three_basis_transcoder_path: "/assets/vendor/three-r185/basis/"
};
context.window = context;

const source = readFileSync(resolve(root, "assets/js/editor/loaders/vrodos_loader_decoder_config.js"), "utf8");
vm.runInNewContext(source, context, { filename: "vrodos_loader_decoder_config.js" });

const loader = context.VRODOS.loader.createGltfLoader(manager, { renderer });
assert(loader instanceof MockGltfLoader, "createGltfLoader must create the configured GLTF loader");
assert(loader.manager === manager, "createGltfLoader must preserve the supplied loading manager");
assert(loader.dracoLoader?.decoderPath === context.vrodos_three_draco_decoder_path, "Draco must prefer the canonical glTF decoder path");
assert(loader.ktx2Loader?.transcoderPath === context.vrodos_three_basis_transcoder_path, "KTX2 must use the canonical Basis transcoder path");
assert(loader.ktx2Loader?.detectedRenderer === renderer, "KTX2 must detect support against the active renderer");
assert(loader.meshoptDecoder === meshoptDecoder, "Meshopt must use the bundled decoder object");

console.log("GLTF decoder configuration tests passed.");
