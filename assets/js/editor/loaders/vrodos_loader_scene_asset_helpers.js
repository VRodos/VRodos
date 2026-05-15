"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.editor = VRODOS.editor || {};

VRODOS.loader.applyTRSToSceneObject = function(object, trs) {
    VRODOS.utils.applyTRSToObject(object, trs);
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
    if (typeof VRODOS.utils.resolveBaseUrl === 'function') {
        return VRODOS.utils.resolveBaseUrl(finalPath, 'modelBaseUrl', 'assets/models/');
    }

    if (VRODOS.data && VRODOS.data.paths && VRODOS.data.paths.modelBaseUrl) {
        return VRODOS.data.paths.modelBaseUrl;
    }

    return `${finalPath}/assets/models/`;
};
