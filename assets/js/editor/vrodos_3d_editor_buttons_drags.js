// Compatibility shim for the staged scene editor UI refactor.
VRODOS.ui.bindLegacyEditorButtonActions = function() {
    if (VRODOS.ui.sceneEditorController && typeof VRODOS.ui.sceneEditorController.bind === 'function') {
        return VRODOS.ui.sceneEditorController.bind();
    }

    if (typeof VRODOS.ui.bindSceneEditorSubsystems === 'function') {
        return VRODOS.ui.bindSceneEditorSubsystems();
    }

    console.warn('VRodos: scene editor UI controller is not available.');
    return false;
};
