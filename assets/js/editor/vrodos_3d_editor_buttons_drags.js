// Compatibility shim for the staged scene editor UI refactor.
VRODOS.ui.bindLegacyEditorButtonActions = function() {
    if (typeof VRODOS.ui.bindCompileDialogControls === 'function') {
        VRODOS.ui.bindCompileDialogControls();
    }

    if (typeof VRODOS.ui.bindEditorShellControls === 'function') {
        VRODOS.ui.bindEditorShellControls();
    }

    if (typeof VRODOS.ui.bindSceneListControls === 'function') {
        VRODOS.ui.bindSceneListControls();
    }

    if (typeof VRODOS.ui.bindSceneSnapshotControls === 'function') {
        VRODOS.ui.bindSceneSnapshotControls();
    }

    if (typeof VRODOS.ui.bindImmerseSceneInfoControls === 'function') {
        VRODOS.ui.bindImmerseSceneInfoControls();
    }

    if (typeof VRODOS.ui.bindEditorToolbarControls === 'function') {
        VRODOS.ui.bindEditorToolbarControls();
    }

    if (typeof VRODOS.ui.bindSceneCanvasEventControls === 'function') {
        VRODOS.ui.bindSceneCanvasEventControls();
    }
};
