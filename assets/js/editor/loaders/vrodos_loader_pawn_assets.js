"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.editor = VRODOS.editor || {};

VRODOS.loader.createEditorPawnLabel = function(indexPawn) {
    const labelDiv = document.createElement('div');
    labelDiv.textContent = `Actor ${indexPawn}`;
    labelDiv.style.marginTop = '-1em';
    labelDiv.style.fontSize = '26px';
    labelDiv.style.color = "yellow";

    const label = new THREE.CSS2DObject(labelDiv);
    label.position.set(0, 1.5, 0);
    return label;
};

VRODOS.loader.prepareEditorPawnObject = function(pawn, name, options) {
    if (!pawn) {
        return null;
    }

    const opts = options || {};
    const scene = opts.scene || (VRODOS.editor.envir ? VRODOS.editor.envir.scene : null);
    const indexPawn = Number.isFinite(Number(opts.indexPawn))
        ? Number(opts.indexPawn)
        : VRODOS.utils.getNextPawnIndex(scene);

    pawn.name = name;
    pawn.asset_name = "myActor";
    pawn.category_name = "pawn";
    pawn.isSelectableMesh = true;
    pawn.isLight = false;
    if (typeof opts.addedAt !== 'undefined') {
        pawn.addedAt = opts.addedAt;
    }
    if (typeof opts.materialOpacity !== 'undefined' && pawn.material) {
        pawn.material.transparent = true;
        pawn.material.opacity = opts.materialOpacity;
    }

    pawn.add(VRODOS.loader.createEditorPawnLabel(indexPawn));
    return pawn;
};

VRODOS.loader.loadEditorPawnModel = function(modelBaseUrl, onLoad, onError) {
    const loader = new THREE.GLTFLoader();
    loader.load(
        `${modelBaseUrl}editor/pawn.glb`,
        onLoad,
        null,
        onError
    );
};

VRODOS.loader.loadPawnAsset = function(name, resource, finalPath, manager) {
    return new Promise((resolve) => {
        if (manager) manager.itemStart(name);
        const modelBaseUrl = VRODOS.loader.resolveEditorModelBaseUrl(finalPath);

        VRODOS.loader.loadEditorPawnModel(
            modelBaseUrl,
            (gltf) => {
                const pawn = VRODOS.loader.prepareEditorPawnObject(gltf.scene.children[0], name, {
                    materialOpacity: 0.6,
                    scene: VRODOS.editor.envir ? VRODOS.editor.envir.scene : null
                });
                VRODOS.loader.applyTRSToSceneObject(pawn, resource.trs);

                VRODOS.loader.registerLoadedEditorObject(pawn, {
                    renderReason: 'pawn-loaded',
                    updateHierarchy: !(VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading)
                });
                if (manager) manager.itemEnd(name);
                resolve();
            },
            (error) => {
                console.log('Error loading Pawn during scene boot:', error);
                if (manager) {
                    manager.itemError(name);
                    manager.itemEnd(name);
                }
                resolve();
            }
        );
    });
};
