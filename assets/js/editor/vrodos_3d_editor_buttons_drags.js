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
    document.getElementById("compileCancelBtn").addEventListener("click", (e) => {

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

    // Drag elements inside VR Editor
    document.getElementById('vr_editor_main_div').ondrop = VRODOS.ui.onDrop;


    // VR Editor Drag Over
    document.getElementById('vr_editor_main_div').ondragover = VRODOS.ui.onDragOver;


    const pauseBtn = document.getElementById("pauseRendering");
    if (pauseBtn) {
        pauseBtn.addEventListener('mousedown', (event) => {
            VRODOS.ui.pauseClickFun();
        }, false);
    }


    // Convert scene to json and put the json in the wordpress field vrodos_scene_json_input
    document.getElementById('save-scene-button').addEventListener('click', () => {

        if (VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading) {
            const loadingNotice = document.getElementById("result_download");
            if (loadingNotice) {
                loadingNotice.innerHTML = "Please wait until scene loading finishes before saving.";
            }
            return;
        }

        const save_scene_btn = document.getElementById("save-scene-button");
        if (save_scene_btn.classList.contains("LinkDisabled")){
            return;
        }

        VRODOS.api.saveChanges({ force: true });
    });


    // UNDO button
    document.getElementById('undo-scene-button').addEventListener('click', () => {
        if (typeof VRODOS.editor.undoManager !== 'undefined') {
            VRODOS.editor.undoManager.undo();
        }
    });

    // REDO button
    document.getElementById('redo-scene-button').addEventListener('click', () => {
        if (typeof VRODOS.editor.undoManager !== 'undefined') {
            VRODOS.editor.undoManager.redo();
        }
    });


    // Autorotate in 3D
    document.getElementById('toggle-tour-around-btn').addEventListener('click', function () {

        const btn = this;

        if (VRODOS.editor.envir.is2d)
            {document.getElementById("dim-change-btn").click();}

        if (btn.dataset.toggle === 'off') {

            VRODOS.editor.envir.orbitControls.autoRotate = true;
            VRODOS.editor.envir.orbitControls.autoRotateSpeed = 1.2;
            btn.dataset.toggle = 'on';

        } else {

            VRODOS.editor.envir.orbitControls.autoRotate = false;
            btn.dataset.toggle = 'off';
        }

        btn.classList.toggle('toggle-active');
        if (typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender('orbit-auto-rotate-toggle');
        }
    });

    if (VRODOS.editor.firstPersonBlockerBtn) {
        VRODOS.editor.firstPersonBlockerBtn.addEventListener('click', (event) => {

            VRODOS.api.firstPersonViewWithoutLock();
            VRODOS.editor.firstPersonBlockerBtn.classList.toggle('toggle-active');

        }, false);
    }


    // 3D Widgets change mode (Translation-Rotation-Scale)
    const objectManipulationToggle = document.getElementById("object-manipulation-toggle");
    if (objectManipulationToggle) {
    objectManipulationToggle.addEventListener("click", () => {

        const checked = document.querySelector("input[name='object-manipulation-switch']:checked");
        const mode = checked ? checked.value : 'translate';

        VRODOS.editor.transforms.setMode(mode, { showProperties: true });
    });
    }

    // Axis Increase size btn
    document.getElementById("axis-size-increase-btn").addEventListener("click", () => {
        VRODOS.editor.transforms.scaleSize(1.1);
    });

    // Axis Decrease size btn
    document.getElementById("axis-size-decrease-btn").addEventListener("click", () => {
        VRODOS.editor.transforms.scaleSize(0.9);
    });

    // Toggle 2D vs 3D button
    document.getElementById("dim-change-btn").addEventListener("click", () => {

        document.getElementById("translate-switch").click();

        if (VRODOS.editor.envir.is2d) {
            //3d
            VRODOS.editor.envir.orbitControls.enableRotate = true;
            VRODOS.editor.envir.gridHelper.visible = true;
            VRODOS.editor.envir.axesHelper.visible = true;

            document.getElementById("object-manipulation-toggle").style.display = "";
            const dimBtn3d = document.getElementById("dim-change-btn");
            dimBtn3d.textContent = "3D";
            dimBtn3d.title = "3D mode";

            VRODOS.editor.envir.is2d = false;
            VRODOS.editor.transforms.setMode("translate");

        } else {

            VRODOS.editor.envir.orbitControls.reset();

            VRODOS.editor.envir.orbitControls.enableRotate = false;
            VRODOS.editor.envir.gridHelper.visible = false;
            VRODOS.editor.envir.axesHelper.visible = false;

            document.getElementById("object-manipulation-toggle").style.display = "none";
            const dimBtn2d = document.getElementById("dim-change-btn");
            dimBtn2d.textContent = "2D";
            dimBtn2d.title = "2D mode";

            VRODOS.editor.envir.is2d = true;
            VRODOS.editor.transforms.setMode("translate");

            if (VRODOS.editor.envir.getDirectorVisualObject()) VRODOS.editor.envir.getDirectorVisualObject().visible = true;
        }

        VRODOS.utils.findSceneDimensions();
        VRODOS.editor.envir.fitCameraToSceneLimits();

        VRODOS.editor.envir.orbitControls.object.updateProjectionMatrix();
        document.getElementById("dim-change-btn").classList.toggle('toggle-active');
    });


    // Main canvas handlers

    const canvas3D = document.querySelector("#vr_editor_main_div canvas");

    // Update DAT GUI only when mouse pointer is active.
    canvas3D.addEventListener("mousemove", (event) => {
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


VRODOS.ui.pauseClickFun = function() {
    VRODOS.editor.isPaused = !VRODOS.editor.isPaused;
    VRODOS.ui.swapLucideIcon(document.getElementById("pauseRendering"), VRODOS.editor.isPaused ? "pause" : "play");

    if (!VRODOS.editor.isPaused) {
        VRODOS.editor.animate();
        document.getElementById('pauseRendering').style.background = '';
    } else {
        if (typeof VRODOS.editor.stopRenderLoop === 'function') {
            VRODOS.editor.stopRenderLoop();
        }
        document.getElementById('pauseRendering').style.background = 'red';
    }

    for (const node of (VRODOS.editor.envir.positionalAudioNodes || [])) {
        if (VRODOS.editor.isPaused) node.pause();
        else node.play();
    }
};



// Hide right click panel for object properties
VRODOS.ui.hideObjectPropertiesPanels = function() {
    let el;
    el = document.getElementById("translatePanelGui"); if (el) el.style.display = 'none';
    el = document.getElementById("rotatePanelGui");    if (el) el.style.display = 'none';
    el = document.getElementById("scalePanelGui");     if (el) el.style.display = 'none';
};

VRODOS.ui.showObjectPropertiesPanel = function(type) {
    VRODOS.ui.hideObjectPropertiesPanels();
    const el = document.getElementById(`${type  }PanelGui`);
    if (el) el.style.display = '';
};
