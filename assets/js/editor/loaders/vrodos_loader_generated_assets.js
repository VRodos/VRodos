"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.utils = VRODOS.utils || {};

function vrodosLoaderShouldSelectImmediate(resource) {
    return Boolean(resource && resource.trs && !(VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading));
}

function vrodosLoaderHideProgressWrapper() {
    const progressWrapper = document.getElementById("progressWrapper");
    if (progressWrapper) {
        progressWrapper.style.visibility = "hidden";
    }
}

function vrodosLoaderAddGeneratedSceneObject(object, resource, options) {
    const opts = Object.assign({
        source: 'generated-loaded',
        renderReason: 'generated-loaded',
        immediateSelect: vrodosLoaderShouldSelectImmediate(resource)
    }, options || {});

    VRODOS.editor.objectFactory.addSceneObject(object, {
        selectable: true,
        updateHierarchy: VRODOS.loader.shouldBuildHierarchyDuringLoad() || opts.immediateSelect,
        select: opts.immediateSelect,
        frame: opts.immediateSelect,
        autosave: opts.immediateSelect,
        openPanel: false,
        showProperties: false,
        source: opts.source,
        renderReason: opts.renderReason
    });

    if (opts.immediateSelect) {
        vrodosLoaderHideProgressWrapper();
    }

    return object;
}

VRODOS.loader.loadAssessmentAsset = function(name, resource, resources3D) {
    return new Promise((resolve) => {
        const object = VRODOS.loader.createAssessmentObject(name, resource);
        VRODOS.loader.setObjectProperties(object, name, resources3D);
        VRODOS.editor.objectFactory.addSceneObject(object, {
            selectable: true,
            updateHierarchy: VRODOS.loader.shouldBuildHierarchyDuringLoad(),
            renderReason: 'assessment-loaded'
        });
        resolve(object);
    });
};

VRODOS.loader.loadTextAsset = function(name, resource, resources3D) {
    return new Promise((resolve) => {
        const object = VRODOS.loader.createTextPanelObject(name, resource);
        VRODOS.loader.setObjectProperties(object, name, resources3D);
        resolve(vrodosLoaderAddGeneratedSceneObject(object, resource, {
            source: 'text-loaded',
            renderReason: 'text-loaded'
        }));
    });
};

VRODOS.loader.loadImageAsset = function(manager, name, resource, resources3D) {
    return new Promise((resolve) => {
        const imageUrl = resource.image_path;
        if (!imageUrl) {
            VRODOS.editor.envir.loadedObjectsCount++;
            resolve(null);
            return;
        }

        const trs = resource.trs;
        const pos = VRODOS.utils.loaderSafeVector((trs && trs.translation) || resource.position || resource.translation, [0, 0, 0]);
        const rot = VRODOS.utils.loaderSafeVector((trs && trs.rotation) || resource.rotation, [0, 0, 0]);
        const scl = VRODOS.utils.loaderSafeScale((trs && trs.scale) || resource.scale);
        const geometry = new THREE.PlaneGeometry(2, 2);
        let object = null;

        if (manager) manager.itemStart(name);
        const texture = new THREE.TextureLoader(manager).load(
            imageUrl,
            () => {
                if (manager) manager.itemEnd(name);
                resolve(object);
            },
            undefined,
            () => {
                if (manager) {
                    manager.itemError(name);
                    manager.itemEnd(name);
                }
                resolve(object);
            }
        );
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
        object = new THREE.Mesh(geometry, material);
        object = VRODOS.loader.setObjectProperties(object, name, resources3D);
        object.isSelectableMesh = true;
        object.position.set(pos[0], pos[1], pos[2]);
        object.rotation.set(rot[0], rot[1], rot[2]);
        object.scale.set(scl[0], scl[1], scl[2]);

        vrodosLoaderAddGeneratedSceneObject(object, resource, {
            source: 'image-loaded',
            renderReason: 'image-loaded'
        });
    });
};
