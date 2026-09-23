"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.editor = VRODOS.editor || {};

VRODOS.loader.createDirectorMarker = function(resource) {
    const object = VRODOS.loader.createDirectorPersonObject();
    const translation = resource?.trs?.translation ?? resource?.position ?? [0, 1.6, 0];
    const rotation = resource?.trs?.rotation ?? resource?.rotation ?? [0, 0, 0];
    const envir = VRODOS.editor.envir;

    envir.installDirectorHelpers(object, null);
    envir.applyDirectorTransform(translation, rotation);
    VRODOS.editor.sceneRegistry.add(object, {
        addToScene: false,
        selectable: true,
        reason: 'director-person-created'
    });

    return object;
};
