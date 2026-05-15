"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.utils = VRODOS.utils || {};

function vrodosLoaderShouldSelectImmediate(resource) {
    return Boolean(resource && resource.trs && !(VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading));
}

function vrodosLoaderHideProgressWrapper() {
    if (VRODOS.api && typeof VRODOS.api.hideSceneLoadingProgress === 'function') {
        VRODOS.api.hideSceneLoadingProgress({ clearTimers: false });
        return;
    }

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
        const material = VRODOS.loader.createDoubleSidedTextureMaterial(texture);
        object = new THREE.Mesh(geometry, material);
        object = VRODOS.loader.setObjectProperties(object, name, resources3D);
        object.isSelectableMesh = true;

        vrodosLoaderAddGeneratedSceneObject(object, resource, {
            source: 'image-loaded',
            renderReason: 'image-loaded'
        });
    });
};
