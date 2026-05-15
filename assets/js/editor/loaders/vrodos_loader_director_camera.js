"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.editor = VRODOS.editor || {};

function vrodosLoaderInstallDirectorCameraObject(object) {
    const envir = VRODOS.editor.envir;
    if (!envir || !object) {
        return false;
    }

    if (typeof envir.installDirectorHelpers === 'function') {
        envir.installDirectorHelpers(object, null);
        return true;
    }

    const director = typeof envir.getDirectorObject === 'function'
        ? envir.getDirectorObject()
        : null;
    if (director) {
        director.add(object);
        return true;
    }

    return false;
}

VRODOS.loader.loadDirectorCameraAsset = function(manager, gltfLoader, name, resource, options) {
    const opts = options || {};
    const modelBaseUrl = opts.modelBaseUrl || '';

    return new Promise((resolve) => {
        if (manager) manager.itemStart(name);

        gltfLoader.load(
            `${modelBaseUrl}director/camera.glb`,
            (objectMain) => {
                const object = VRODOS.loader.prepareDirectorCameraObject(objectMain.scene.children[0]);
                if (!object) {
                    if (manager) {
                        manager.itemError(name);
                        manager.itemEnd(name);
                    }
                    resolve(null);
                    return;
                }

                const translation = resource?.trs?.translation ?? resource?.position ?? [0, 0.2, 0];
                const rotation = resource?.trs?.rotation ?? resource?.rotation ?? [0, 0, 0];
                vrodosLoaderInstallDirectorCameraObject(object);
                VRODOS.editor.envir.applyDirectorTransform(translation, rotation);
                VRODOS.editor.sceneRegistry.add(object, {
                    addToScene: false,
                    selectable: true,
                    reason: 'director-camera-loaded'
                });
                if (manager) manager.itemEnd(name);
                resolve(object);
            },
            undefined,
            (error) => {
                console.error('Cannot load camera GLB, loading error happened. Error 1595', error);
                if (manager) {
                    manager.itemError(name);
                    manager.itemEnd(name);
                }
                resolve(null);
            }
        );
    });
};
