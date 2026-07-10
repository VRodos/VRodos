"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};

(function initVrodosLoaderDecoderConfig() {
    function resolveDracoPath() {
        return window.vrodos_three_draco_decoder_path ||
            window.vrodos_three_decoder_path || '';
    }

    function resolveBasisPath() {
        return window.vrodos_three_basis_transcoder_path || '';
    }

    function configureDraco(loader) {
        if (!THREE.DRACOLoader || typeof loader.setDRACOLoader !== 'function') {
            return;
        }

        const decoderPath = resolveDracoPath();
        if (!decoderPath) {
            return;
        }

        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath(decoderPath);
        loader.setDRACOLoader(dracoLoader);
    }

    function configureKtx2(loader, renderer) {
        if (!THREE.KTX2Loader || typeof loader.setKTX2Loader !== 'function') {
            return;
        }

        const transcoderPath = resolveBasisPath();
        if (!transcoderPath) {
            return;
        }

        const ktx2Loader = new THREE.KTX2Loader();
        ktx2Loader.setTranscoderPath(transcoderPath);
        if (renderer && typeof ktx2Loader.detectSupport === 'function') {
            ktx2Loader.detectSupport(renderer);
        }
        loader.setKTX2Loader(ktx2Loader);
    }

    function configureMeshopt(loader) {
        if (!THREE.MeshoptDecoder || typeof loader.setMeshoptDecoder !== 'function') {
            return;
        }

        loader.setMeshoptDecoder(THREE.MeshoptDecoder);
    }

    VRODOS.loader.configureGltfLoader = function(loader, options) {
        if (!loader) {
            return loader;
        }

        const opts = options || {};
        configureDraco(loader);
        configureKtx2(loader, opts.renderer || null);
        configureMeshopt(loader);
        return loader;
    };

    VRODOS.loader.createGltfLoader = function(manager, options) {
        const loadingManager = manager || (THREE.DefaultLoadingManager || undefined);
        return VRODOS.loader.configureGltfLoader(new THREE.GLTFLoader(loadingManager), options);
    };
})();
