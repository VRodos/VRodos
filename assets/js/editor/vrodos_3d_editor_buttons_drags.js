// Local
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

    // Drag elements inside VR Editor
    document.getElementById('vr_editor_main_div').ondrop = VRODOS.ui.onDrop;


    // VR Editor Drag Over
    document.getElementById('vr_editor_main_div').ondragover = VRODOS.ui.onDragOver;


    // Main canvas handlers

    const canvas3D = document.querySelector("#vr_editor_main_div canvas");

    // Update DAT GUI only when mouse pointer is active.
    canvas3D.addEventListener("mousemove", () => {
        VRODOS.editor.updatePositionsAndControls();
    });

    // Left click — track mousedown position, select on mouseup (so dragging doesn't trigger selection)
    canvas3D.addEventListener('mousedown', VRODOS.ui.onMouseDown, false);
    canvas3D.addEventListener('mouseup', VRODOS.ui.onMouseUp, false);

    // Left double click
    canvas3D.addEventListener('dblclick', VRODOS.ui.onMouseDoubleClickFocus, false);

    // Right Click
    canvas3D.addEventListener('contextmenu', VRODOS.ui.contextMenuClick, false);

    // Auto-Saving
    // Detect enter button press for saving scene
    canvas3D.addEventListener('keypress', VRODOS.api.saveSceneEventHandler, false);

    // Auto save listener
    VRODOS.editor.envir.scene.addEventListener("modificationPendingSave", VRODOS.api.saveSceneEventHandler);

    // Prevent showing the context menu on property panels
    ['popUpArtifactPropertiesDiv', 'popUpDoorPropertiesDiv', 'popUpPoiImageTextPropertiesDiv',
     'popUpSunPropertiesDiv', 'popUpLampPropertiesDiv',
     'popUpSpotPropertiesDiv', 'popUpAmbientPropertiesDiv', 'popUpPoiChatPropertiesDiv'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('contextmenu', (e) => { e.preventDefault(); });
    });


    // Drag light or Pawn: Add event listeners
    const allUpperToolbarButtons = document.querySelectorAll('.environmentBar .lightpawnbutton');

    [].forEach.call(allUpperToolbarButtons, (col) => {
        col.addEventListener('dragstart', VRODOS.ui.handleLightPawnDragStart, false);
    });
};
