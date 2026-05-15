"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.editor = VRODOS.editor || {};

VRODOS.loader.loadPawnAsset = function(name, resource, finalPath, manager) {
    return new Promise((resolve) => {
        if (manager) manager.itemStart(name);
        const loader = new THREE.GLTFLoader();
        const modelBaseUrl = VRODOS.loader.resolveEditorModelBaseUrl(finalPath);

        loader.load(
            `${modelBaseUrl}editor/pawn.glb`,
            (gltf) => {
                const pawn = gltf.scene.children[0];
                VRODOS.loader.applyTRSToSceneObject(pawn, resource.trs);

                pawn.name = name;
                pawn.asset_name = "myActor";
                pawn.category_name = "pawn";
                pawn.isSelectableMesh = true;
                pawn.isLight = false;
                if (pawn.material) {
                    pawn.material.transparent = true;
                    pawn.material.opacity = 0.6;
                }

                const indexPawn = VRODOS.utils.getNextPawnIndex(VRODOS.editor.envir.scene);

                const labelDiv = document.createElement('div');
                labelDiv.textContent = `Actor ${indexPawn}`;
                labelDiv.style.marginTop = '-1em';
                labelDiv.style.fontSize = '26px';
                labelDiv.style.color = "yellow";

                const label = new THREE.CSS2DObject(labelDiv);
                label.position.set(0, 1.5, 0);
                pawn.add(label);

                VRODOS.loader.registerLoadedEditorObject(pawn, {
                    renderReason: 'pawn-loaded',
                    updateHierarchy: !(VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading)
                });
                if (manager) manager.itemEnd(name);
                resolve();
            },
            null,
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
