// Local
VRODOS.ui.bindLegacyEditorButtonActions = function() {
    function resetCompileDialogStatusState() {
        const statusRow = document.getElementById("compileStatusRow");
        const constantUpdateUser = document.getElementById("constantUpdateUser");
        const appResultDiv = document.getElementById("appResultDiv");
        const topResultLink = document.getElementById("compileTopResultLink");
        const resultMeta = document.getElementById("compileResultMeta");

        if (statusRow) statusRow.style.display = 'flex';
        if (appResultDiv) appResultDiv.style.display = 'none';
        if (topResultLink) {
            topResultLink.classList.add("tw-hidden");
            topResultLink.setAttribute("href", "#");
        }
        if (resultMeta) {
            resultMeta.textContent = 'The experience is ready to be shared';
        }
        if (constantUpdateUser) {
            constantUpdateUser.innerHTML =
                '<i data-lucide="info" class="tw-w-4 tw-h-4 tw-inline-block tw-align-text-bottom tw-mr-1"></i> ' +
                'Configure your scene quality settings and click "Build" to construct the virtual world.';
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Compile Project button
    document.getElementById("compileGameBtn").addEventListener("click", () => {
        if (typeof VRODOS.ui.syncCompileDialogFromSceneSettings === 'function') {
            VRODOS.ui.syncCompileDialogFromSceneSettings();
        }
        resetCompileDialogStatusState();
        const dlg = document.getElementById('compile-dialog');
        if (dlg) { dlg.showModal(); if (typeof lucide !== 'undefined') lucide.createIcons(); }

        // Pause Rendering
        VRODOS.editor.isPaused = true;
        VRODOS.ui.swapLucideIcon(document.getElementById("pauseRendering"), "play");
    });


    // Cogwheel options button
    document.getElementById("optionsPopupBtn").addEventListener("click", () => {
        const dlg = document.getElementById('options-dialog');
        if (dlg) { dlg.showModal(); if (typeof lucide !== 'undefined') lucide.createIcons(); }
    });

    // Compile Proceed
    document.getElementById("compileProceedBtn").addEventListener("click", () => {
        resetCompileDialogStatusState();
        document.getElementById("compileProgressSlider").style.display = '';
        document.getElementById("compileProgressTitle").style.display = '';

        const zipLink = document.getElementById("vrodos-ziplink");
        const webLink = document.getElementById("vrodos-weblink");
        if (zipLink) zipLink.style.display = 'none';
        if (webLink) webLink.style.display = 'none';

        const progText = document.getElementById("compilationProgressText");
        const memValue = document.getElementById("unityTaskMemValue");
        if (progText) progText.innerHTML = "";
        if (memValue) memValue.innerHTML = "0";

        const constantUpdateUser = document.getElementById("constantUpdateUser");
        if (typeof VRODOS.ui.applyCompileDialogSettingsToScene === 'function') {
            VRODOS.ui.applyCompileDialogSettingsToScene();
        }

        if (constantUpdateUser) {
            constantUpdateUser.innerHTML =
                '<i data-lucide="save" class="tw-w-4 tw-h-4 tw-inline-block tw-align-text-bottom tw-mr-1"></i> ' +
                'Saving build settings and latest scene changes before build...';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        VRODOS.api.waitForLatestSceneSave()
            .then(() => (typeof VRODOS.api.saveChanges === 'function') ? VRODOS.api.saveChanges({force: true}) : Promise.resolve())
            .then(() => {
                VRODOS.api.compileScene(VRODOS.editor.showPawnPositions, { skipSave: true });
            })
            .catch((error) => {
                VRODOS.api.hideCompileProgressSlider();
                if (constantUpdateUser) {
                    constantUpdateUser.innerHTML =
                        '<i data-lucide="triangle-alert" class="tw-w-4 tw-h-4 tw-inline-block tw-align-text-bottom tw-mr-1"></i> ' +
                        'Could not save the latest scene changes. Please try again.';
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
                console.warn('VRodos: compile blocked because scene save failed.', error);
            });
    });

    // Compile Cancel
    document.getElementById("compileCancelBtn").addEventListener("click", () => {

        //Start Rendering
        VRODOS.editor.isPaused = false;
        VRODOS.ui.swapLucideIcon(document.getElementById("pauseRendering"), "pause");
        VRODOS.editor.animate();

        // Get Pid of compile process
        const pid = document.getElementById("compileCancelBtn").getAttribute("data-unity-pid");

        if (pid) {
            VRODOS.api.killCompileTask(pid);
        }

        // Close native dialog
        const dlg = document.getElementById('compile-dialog');
        if (dlg && dlg.open) dlg.close();
    });

    // Resume rendering when compile dialog is closed (by any means: cancel, backdrop, escape)
    const compileDlg = document.getElementById('compile-dialog');
    if (compileDlg) {
        compileDlg.addEventListener('close', () => {
            if (VRODOS.editor.isPaused) {
                VRODOS.editor.isPaused = false;
                VRODOS.ui.swapLucideIcon(document.getElementById("pauseRendering"), "pause");
                VRODOS.editor.animate();
            }
            // Kill any running compile process
            const pid = document.getElementById("compileCancelBtn").getAttribute("data-unity-pid");
            if (pid) VRODOS.api.killCompileTask(pid);
        });
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
