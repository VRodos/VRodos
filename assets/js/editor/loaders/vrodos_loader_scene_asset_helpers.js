"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.editor = VRODOS.editor || {};

VRODOS.loader.applyTRSToSceneObject = function(object, trs) {
    if (!object || !trs) return;

    const translation = Array.isArray(trs.translation) ? trs.translation : [0, 0, 0];
    const rotation = Array.isArray(trs.rotation) ? trs.rotation : [0, 0, 0];
    const scale = Array.isArray(trs.scale) ? trs.scale : [1, 1, 1];

    object.position.set(translation[0], translation[1], translation[2]);
    object.rotation.set(rotation[0], rotation[1], rotation[2]);
    object.scale.set(scale[0], scale[1], scale[2]);
};

VRODOS.loader.registerLoadedEditorObject = function(object, options) {
    if (!object || !VRODOS.editor.objectFactory) return object;

    const opts = Object.assign({
        selectable: true,
        updateHierarchy: (VRODOS.loader && typeof VRODOS.loader.shouldBuildHierarchyDuringLoad === 'function')
            ? VRODOS.loader.shouldBuildHierarchyDuringLoad()
            : false,
        incrementLoaded: false,
        renderReason: 'scene-asset-loaded'
    }, options || {});

    VRODOS.editor.objectFactory.addSceneObject(object, opts);
    return object;
};

VRODOS.loader.resolveEditorModelBaseUrl = function(finalPath) {
    if (VRODOS.data && VRODOS.data.paths && VRODOS.data.paths.modelBaseUrl) {
        return VRODOS.data.paths.modelBaseUrl;
    }

    return `${finalPath}/assets/models/`;
};
