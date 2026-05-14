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

    // Hierarchy Toolbar close button (Event delegation for maximum robustness)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#bt_close_hierarchy_toolbar');
        if (!btn) return;
        e.preventDefault();
        const panel = document.getElementById("right-elements-panel");
        const compass = document.getElementById("scene-editor-compass");

        if (btn.classList.contains("HierarchyToggleOn")) {
            btn.classList.add("HierarchyToggleOff");
            btn.classList.remove("HierarchyToggleOn");
            btn.dataset.toggle = 'off';
            VRODOS.ui.swapLucideIcon(btn, 'chevron-left');
            panel.classList.add("closed");
            if (compass) compass.classList.add("panel-closed");
        } else {
            btn.classList.add("HierarchyToggleOn");
            btn.classList.remove("HierarchyToggleOff");
            btn.dataset.toggle = 'on';
            VRODOS.ui.swapLucideIcon(btn, 'chevron-right');
            panel.classList.remove("closed");
            if (compass) compass.classList.remove("panel-closed");
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    // File Browser Toolbar close button (Event delegation for maximum robustness)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#bt_close_file_toolbar');
        if (!btn) return;
        e.preventDefault();
        const toolbar = document.getElementById("assetBrowserToolbar");

        if (btn.classList.contains("AssetsToggleOn")) {
            btn.classList.add("AssetsToggleOff");
            btn.classList.remove("AssetsToggleOn");
            btn.dataset.toggle = 'off';
            VRODOS.ui.swapLucideIcon(btn, 'chevron-right');
            toolbar.classList.add("closed");
        } else {
            btn.classList.add("AssetsToggleOn");
            btn.classList.remove("AssetsToggleOff");
            btn.dataset.toggle = 'on';
            VRODOS.ui.swapLucideIcon(btn, 'chevron-left');
            toolbar.classList.remove("closed");
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    // Scenes List Toolbar close button
    document.getElementById("scenesList-toggle-btn").addEventListener("click", function () {
        const wrapper = document.getElementById("scenesDrawerWrapper");
        const btn = document.getElementById("scenesList-toggle-btn");

        if (btn.classList.contains("scenesListToggleOn")) {
            btn.classList.add("scenesListToggleOff");
            btn.classList.remove("scenesListToggleOn");
            VRODOS.ui.swapLucideIcon(this, 'chevron-up');
            wrapper.classList.add("closed-drawer");
        } else {
            btn.classList.add("scenesListToggleOn");
            btn.classList.remove("scenesListToggleOff");
            VRODOS.ui.swapLucideIcon(this, 'chevron-down');
            wrapper.classList.remove("closed-drawer");
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    // ── Scene Reorder Drag-and-Drop ──
    (function() {
        const container = document.getElementById('scenesInsideVREditor');
        if (!container) return;
        let dragItem = null;

        container.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.SceneCardContainer[draggable]');
            if (!card) return;
            dragItem = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/vrodos-scene-reorder', 'true');
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const card = e.target.closest('.SceneCardContainer[draggable]');
            if (!card || card === dragItem) return;
            const rect = card.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            if (e.clientX < midX) {
                container.insertBefore(dragItem, card);
            } else {
                container.insertBefore(dragItem, card.nextSibling);
            }
        });

        container.addEventListener('dragend', () => {
            if (dragItem) dragItem.classList.remove('dragging');
            dragItem = null;
            // Update number badges
            container.querySelectorAll('.SceneCardContainer[draggable] .scene-order-badge').forEach((badge, i) => {
                badge.textContent = i + 1;
            });
            // Save new order via AJAX
            const formData = new FormData();
            formData.append('action', 'vrodos_reorder_scenes_action');
            const nonceField = document.querySelector('[name="post_nonce_field"]');
            if (nonceField) formData.append('nonce', nonceField.value);
            container.querySelectorAll('.SceneCardContainer[draggable]').forEach((card) => {
                formData.append('scene_ids[]', card.dataset.sceneId);
            });
            fetch(VRODOS.utils.getAjaxUrl(), { method: 'POST', body: formData });
        });
    })();

    // Take SCREENSHOT OF SCENE
    document.getElementById("takeScreenshotBtn").addEventListener("click", () => {
        VRODOS.api.takeScreenshot();
        VRODOS.api.isSceneIconManuallySelected = false;
    });

    // Select image as Scene icon
    document.getElementById("vrodos_scene_sshot_manual_select").addEventListener("change", function () {
        readLocalImageAsSceneIcon(this);
    });

    function readLocalImageAsSceneIcon(input) {

        if (input.files && input.files[0]) {
            const reader = new FileReader();

            reader.onload = function (e) {
                VRODOS.api.newScreenshotData = e.target.result;
                VRODOS.ui.setSceneScreenshotPreview(VRODOS.api.newScreenshotData);
                VRODOS.api.isSceneIconManuallySelected = true;
                VRODOS.api.persistSceneScreenshot();
            };

            reader.readAsDataURL(input.files[0]);
        }
    }


    // DELETE SCENE DIALOGUE
    document.getElementById("deleteSceneDialogDeleteBtn").addEventListener("click", (e) => {
        document.getElementById('delete-scene-dialog-progress-bar').style.display = '';
        document.getElementById("deleteSceneDialogDeleteBtn").classList.add("LinkDisabled");
        document.getElementById("deleteSceneDialogCancelBtn").classList.add("LinkDisabled");
        const dlg = document.getElementById('delete-dialog');
        VRODOS.api.deleteScene(dlg.dataset.sceneId, window.url_scene_redirect);
    });

    document.getElementById("deleteSceneDialogCancelBtn").addEventListener("click", (e) => {
        document.getElementById('delete-scene-dialog-progress-bar').style.display = 'none';
        const dlg = document.getElementById('delete-dialog');
        if (dlg && dlg.open) dlg.close();
    });


    // Scene card delete icons (delegated)
    document.querySelectorAll(".cardDeleteIcon").forEach((el) => {
        el.addEventListener("click", function () {
            deleteScene(this);
        });
    });

    // Delete scene
    function deleteScene(btn) {
        const sceneId = btn.dataset.sceneid;
        const dialogTitle = document.getElementById("delete-dialog-title");
        const dialogDescription = document.getElementById("delete-dialog-description");
        const sceneTitle = document.getElementById(`${sceneId}-title`).textContent.trim();

        dialogTitle.textContent = `Delete ${sceneTitle}?`;
        dialogDescription.innerHTML = `Are you sure you want to delete your scene '${sceneTitle}'? There is no Undo functionality once you delete it.`;
        const dlg = document.getElementById('delete-dialog');
        dlg.dataset.sceneId = sceneId;
        dlg.showModal();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Toggle JSON viewer dialog
    document.getElementById('toggleViewSceneContentBtn').addEventListener('click', () => {
        const dialog = document.getElementById('sceneJsonContent');
        if (dialog.open) {
            dialog.close();
        } else {
            // Refresh textarea with the exact exported scene payload
            VRODOS.ui.refreshSceneJsonTextarea();
            dialog.showModal();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });

    // Close JSON dialog via close button
    document.getElementById('closeJsonBtn').addEventListener('click', () => {
        document.getElementById('sceneJsonContent').close();
    });

    // Copy JSON to clipboard
    document.getElementById('copyJsonBtn').addEventListener('click', () => {
        const textarea = document.getElementById('vrodos_scene_json_input');
        VRODOS.utils.copyTextareaText(textarea)
            .then(() => {
                VRODOS.ui.showTemporaryButtonSuccess('copyJsonBtn', 'Copied!');
            })
            .catch((error) => {
                textarea.select();
                textarea.setSelectionRange(0, textarea.value.length);
                VRODOS.ui.showTemporaryButtonWarning('copyJsonBtn', 'Press Ctrl+C');
                console.warn('VRodos: failed to copy scene JSON to clipboard.', error);
            });
    });

    const immerseSceneInfoBtn = document.getElementById('toggleImmerseSceneInfoBtn');
    const immerseSceneInfoDialog = document.getElementById('immerseSceneInfoDialog');
    if (immerseSceneInfoBtn && immerseSceneInfoDialog) {
        immerseSceneInfoBtn.addEventListener('click', () => {
            if (immerseSceneInfoDialog.classList.contains('tw-hidden')) {
                VRODOS.ui.showFloatingPanel(immerseSceneInfoDialog);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                VRODOS.ui.hideFloatingPanel(immerseSceneInfoDialog);
            }
        });
    }

    VRODOS.ui.initializeFloatingPanel('immerseSceneInfoDialog', 'immerseSceneInfoHeader', 'closeImmerseSceneInfoBtn');

    const copyImmerseSceneInfoBtn = document.getElementById('copyImmerseSceneInfoBtn');
    if (copyImmerseSceneInfoBtn) {
        copyImmerseSceneInfoBtn.addEventListener('click', () => {
            const sourceNode = document.getElementById('immerse_scene_info_source');
            let sourceText = '';

            if (sourceNode) {
                try {
                    sourceText = JSON.parse(sourceNode.textContent || '""');
                } catch (error) {
                    sourceText = sourceNode.textContent || '';
                }
            }

            VRODOS.utils.copyPlainText(sourceText)
                .then(() => {
                    VRODOS.ui.showTemporaryButtonSuccess('copyImmerseSceneInfoBtn', 'Copied!');
                })
                .catch((error) => {
                    VRODOS.ui.showTemporaryButtonWarning('copyImmerseSceneInfoBtn', 'Press Ctrl+C');
                    console.warn('VRodos: failed to copy imported scene information to clipboard.', error);
                });
        });
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


    // Toggle UIs to clear out vision
    const toggleUIBtn = document.getElementById('toggleUIBtn');
    if (toggleUIBtn) {

        const uiElementsToToggle = [
            // upper toolbar kept visible (toggle button lives there)
            document.getElementById('right-elements-panel'),
            document.getElementById('scene-editor-compass'),
            document.getElementById('object-controls-panel'),
            document.querySelector('.environmentBar'),
            document.getElementById('scenesInsideVREditor'),
            document.getElementById('assetBrowserToolbar'),
            document.getElementById('bt_close_file_toolbar'),
            document.querySelector('.HierarchyToggleStyle'),
            document.getElementById('scenesList-toggle-btn')
        ].filter(Boolean); // Filter out nulls if an element doesn't exist

        const elementDisplayStates = new Map();

        // Store the initial, computed display state of each element.
        uiElementsToToggle.forEach(el => {
            elementDisplayStates.set(el, window.getComputedStyle(el).display);
        });

        toggleUIBtn.addEventListener('click', function () {
            const btn = this;
            const icon = btn.querySelector('i');
            const isHiding = btn.dataset.toggle === 'on';

            if (isHiding) {
                // --- HIDE UI ---
                btn.classList.add('tw-opacity-40');
                VRODOS.ui.swapLucideIcon(btn, 'eye-off');
                btn.dataset.toggle = 'off';

                uiElementsToToggle.forEach(el => el.style.setProperty('display', 'none', 'important'));

                VRODOS.editor.transforms.setVisible(false);
                if (VRODOS.editor.envir.getDirectorRig()) VRODOS.editor.envir.getDirectorRig().visible = false;
                if (VRODOS.editor.envir.gridHelper) VRODOS.editor.envir.gridHelper.visible = false;
                if (VRODOS.editor.envir.axesHelper) VRODOS.editor.envir.axesHelper.visible = false;
                VRODOS.ui.removeAllCelOutlines();
                VRODOS.ui.setVisiblityLightHelpingElements(false);

            } else {
                // --- SHOW UI ---
                btn.classList.remove('tw-opacity-40');
                VRODOS.ui.swapLucideIcon(btn, 'eye');
                btn.dataset.toggle = 'on';

                uiElementsToToggle.forEach(el => {
                    // Restore the original display style
                    el.style.removeProperty('display');
                });

                VRODOS.editor.transforms.setVisible(true);
                if (VRODOS.editor.envir.gridHelper) VRODOS.editor.envir.gridHelper.visible = true;
                if (VRODOS.editor.envir.axesHelper) VRODOS.editor.envir.axesHelper.visible = true;
                const selectedObject = VRODOS.editor.transforms.getRealObject();
                if (selectedObject) VRODOS.ui.addCelOutline(selectedObject);
                VRODOS.ui.setVisiblityLightHelpingElements(true);

                if (VRODOS.editor.envir.thirdPersonView || VRODOS.editor.avatarControlsEnabled) {
                    if (VRODOS.editor.envir.getDirectorRig()) VRODOS.editor.envir.getDirectorRig().visible = false;
                } else {
                    if (VRODOS.editor.envir.getDirectorRig()) VRODOS.editor.envir.getDirectorRig().visible = true;
                }
            }
            if (VRODOS.editor.envir.turboResize) VRODOS.editor.envir.turboResize();
        });
    }


    // Drag light or Pawn: Add event listeners
    const allUpperToolbarButtons = document.querySelectorAll('.environmentBar .lightpawnbutton');

    [].forEach.call(allUpperToolbarButtons, (col) => {
        col.addEventListener('dragstart', VRODOS.ui.handleLightPawnDragStart, false);
    });
};


// ==================== Global scope functions ================

VRODOS.ui.setVisiblityLightHelpingElements = function(statusVisibility) {

    VRODOS.editor.envir.scene.traverse((curr_obj) => {
        if (!curr_obj) return;

        if (curr_obj.category_name === 'lightHelper' || curr_obj.category_name === 'lightTargetSpot')
            {curr_obj.visible = statusVisibility;}

        if ((curr_obj.category_name === 'lightSun' || curr_obj.category_name === 'lightLamp' || curr_obj.category_name === 'lightSpot') && curr_obj.children[0])
            {curr_obj.children[0].visible = statusVisibility;}

        if (curr_obj.type === 'CameraHelper') // This is the shadow camera of sun
            {curr_obj.visible = statusVisibility;}
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
