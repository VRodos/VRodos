// Swap a Lucide icon inside a container element
function swapLucideIcon(container, iconName) {
    if (!container) return;
    let icon = container.querySelector('[data-lucide], svg');
    if (icon) {
        let newIcon = document.createElement('i');
        newIcon.setAttribute('data-lucide', iconName);
        // Preserve original sizing classes (tw-w-*, tw-h-*, etc.)
        let origClasses = (icon.getAttribute('class') || '').replace(/lucide[^\s]*/g, '').trim();
        if (origClasses) newIcon.setAttribute('class', origClasses);
        icon.replaceWith(newIcon);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Local and Global scope functions
let new_screenshot_data = null;

function focusWithoutScroll(element) {
    if (!element || typeof element.focus !== 'function') return;

    try {
        element.focus({ preventScroll: true });
    } catch (error) {
        element.focus();
    }
}

function copyTextareaText(textarea) {
    if (!textarea) {
        return Promise.reject(new Error('No textarea available for clipboard copy.'));
    }

    let text = textarea.value || '';

    if (window.isSecureContext && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(text).catch(function () {
            return fallbackCopyTextareaText(textarea);
        });
    }

    return fallbackCopyTextareaText(textarea);
}

function fallbackCopyTextareaText(textarea) {
    return new Promise(function (resolve, reject) {
        let activeElement = document.activeElement;
        let originalSelectionStart = textarea.selectionStart;
        let originalSelectionEnd = textarea.selectionEnd;

        try {
            focusWithoutScroll(textarea);
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);

            let copied = document.execCommand('copy');
            textarea.setSelectionRange(originalSelectionStart || 0, originalSelectionEnd || 0);

            if (activeElement && typeof activeElement.focus === 'function' && activeElement !== textarea) {
                focusWithoutScroll(activeElement);
            }

            if (copied) {
                resolve();
            } else {
                reject(new Error('Clipboard copy command was rejected.'));
            }
        } catch (error) {
            textarea.select();
            reject(error);
        }
    });
}

function showTemporaryButtonSuccess(buttonId, message) {
    let btn = document.getElementById(buttonId);
    if (!btn) return;

    let orig = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="check" class="tw-w-3.5 tw-h-3.5"></i> ' + message;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(function () {
        btn.innerHTML = orig;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 1500);
}

function showTemporaryButtonWarning(buttonId, message) {
    let btn = document.getElementById(buttonId);
    if (!btn) return;

    let orig = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="triangle-alert" class="tw-w-3.5 tw-h-3.5"></i> ' + message;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(function () {
        btn.innerHTML = orig;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 2500);
}

function refreshSceneJsonTextarea() {
    let textarea = document.getElementById('vrodos_scene_json_input');
    if (!textarea || typeof VrodosSceneExporter === 'undefined' || !envir || !envir.scene) return;

    let exporter = new VrodosSceneExporter();
    let exportedJson = exporter.parse(envir.scene);

    try {
        textarea.value = JSON.stringify(JSON.parse(exportedJson), null, 2);
    } catch (error) {
        textarea.value = exportedJson;
    }
}

function waitForLatestSceneSave() {
    if (typeof vrodos_whenSceneSaveSettles === 'function') {
        return vrodos_whenSceneSaveSettles();
    }

    return Promise.resolve();
}

function setSceneScreenshotPreview(src) {
    let sceneShot = document.getElementById('vrodos_scene_sshot');
    let placeholder = document.getElementById('vrodos_scene_sshot_placeholder');

    if (!sceneShot) {
        return;
    }

    if (src) {
        sceneShot.src = src;
        sceneShot.classList.remove('tw-hidden');
        if (placeholder) {
            placeholder.classList.add('tw-hidden');
        }
    } else {
        sceneShot.removeAttribute('src');
        sceneShot.classList.add('tw-hidden');
        if (placeholder) {
            placeholder.classList.remove('tw-hidden');
        }
    }
}

// Local
function loadButtonActions() {
    function resetCompileDialogStatusState() {
        let statusRow = document.getElementById("compileStatusRow");
        let constantUpdateUser = document.getElementById("constantUpdateUser");
        let appResultDiv = document.getElementById("appResultDiv");
        let topResultLink = document.getElementById("compileTopResultLink");
        let resultMeta = document.getElementById("compileResultMeta");

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
    document.getElementById("compileGameBtn").addEventListener("click", function () {
        if (typeof syncCompileDialogFromSceneSettings === 'function') {
            syncCompileDialogFromSceneSettings();
        }
        resetCompileDialogStatusState();
        let dlg = document.getElementById('compile-dialog');
        if (dlg) { dlg.showModal(); if (typeof lucide !== 'undefined') lucide.createIcons(); }

        // Pause Rendering
        isPaused = true;
        swapLucideIcon(document.getElementById("pauseRendering"), "play");
    });


    // Cogwheel options button
    document.getElementById("optionsPopupBtn").addEventListener("click", function () {
        let dlg = document.getElementById('options-dialog');
        if (dlg) { dlg.showModal(); if (typeof lucide !== 'undefined') lucide.createIcons(); }
    });

    // Compile Proceed
    document.getElementById("compileProceedBtn").addEventListener("click", function () {
        resetCompileDialogStatusState();
        document.getElementById("compileProgressSlider").style.display = '';
        document.getElementById("compileProgressTitle").style.display = '';

        let zipLink = document.getElementById("vrodos-ziplink");
        let webLink = document.getElementById("vrodos-weblink");
        if (zipLink) zipLink.style.display = 'none';
        if (webLink) webLink.style.display = 'none';

        let progText = document.getElementById("compilationProgressText");
        let memValue = document.getElementById("unityTaskMemValue");
        if (progText) progText.innerHTML = "";
        if (memValue) memValue.innerHTML = "0";

        let constantUpdateUser = document.getElementById("constantUpdateUser");
        if (typeof vrodosApplyCompileDialogSettingsToScene === 'function') {
            vrodosApplyCompileDialogSettingsToScene();
        }

        if (constantUpdateUser) {
            constantUpdateUser.innerHTML =
                '<i data-lucide="save" class="tw-w-4 tw-h-4 tw-inline-block tw-align-text-bottom tw-mr-1"></i> ' +
                'Saving build settings and latest scene changes before build...';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        waitForLatestSceneSave()
            .then(function () {
                return (typeof saveChanges === 'function') ? saveChanges() : Promise.resolve();
            })
            .then(function () {
                vrodos_compileAjax(showPawnPositions);
            })
            .catch(function (error) {
                hideCompileProgressSlider();
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
    document.getElementById("compileCancelBtn").addEventListener("click", function (e) {

        //Start Rendering
        isPaused = false;
        swapLucideIcon(document.getElementById("pauseRendering"), "pause");
        animate();

        // Get Pid of compile process
        let pid = document.getElementById("compileCancelBtn").getAttribute("data-unity-pid");

        if (pid) {
            vrodos_killtask_compile(pid);
        }

        // Close native dialog
        let dlg = document.getElementById('compile-dialog');
        if (dlg && dlg.open) dlg.close();
    });

    // Resume rendering when compile dialog is closed (by any means: cancel, backdrop, escape)
    let compileDlg = document.getElementById('compile-dialog');
    if (compileDlg) {
        compileDlg.addEventListener('close', function () {
            if (isPaused) {
                isPaused = false;
                swapLucideIcon(document.getElementById("pauseRendering"), "pause");
                animate();
            }
            // Kill any running compile process
            let pid = document.getElementById("compileCancelBtn").getAttribute("data-unity-pid");
            if (pid) vrodos_killtask_compile(pid);
        });
    }

    // Hierarchy Toolbar close button (Event delegation for maximum robustness)
    document.addEventListener('click', function (e) {
        let btn = e.target.closest('#bt_close_hierarchy_toolbar');
        if (!btn) return;
        e.preventDefault();
        let panel = document.getElementById("right-elements-panel");
        let compass = document.getElementById("scene-editor-compass");

        if (btn.classList.contains("HierarchyToggleOn")) {
            btn.classList.add("HierarchyToggleOff");
            btn.classList.remove("HierarchyToggleOn");
            btn.dataset.toggle = 'off';
            swapLucideIcon(btn, 'chevron-left');
            panel.classList.add("closed");
            if (compass) compass.classList.add("panel-closed");
        } else {
            btn.classList.add("HierarchyToggleOn");
            btn.classList.remove("HierarchyToggleOff");
            btn.dataset.toggle = 'on';
            swapLucideIcon(btn, 'chevron-right');
            panel.classList.remove("closed");
            if (compass) compass.classList.remove("panel-closed");
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    // File Browser Toolbar close button (Event delegation for maximum robustness)
    document.addEventListener('click', function (e) {
        let btn = e.target.closest('#bt_close_file_toolbar');
        if (!btn) return;
        e.preventDefault();
        let toolbar = document.getElementById("assetBrowserToolbar");

        if (btn.classList.contains("AssetsToggleOn")) {
            btn.classList.add("AssetsToggleOff");
            btn.classList.remove("AssetsToggleOn");
            btn.dataset.toggle = 'off';
            swapLucideIcon(btn, 'chevron-right');
            toolbar.classList.add("closed");
        } else {
            btn.classList.add("AssetsToggleOn");
            btn.classList.remove("AssetsToggleOff");
            btn.dataset.toggle = 'on';
            swapLucideIcon(btn, 'chevron-left');
            toolbar.classList.remove("closed");
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    // Scenes List Toolbar close button
    document.getElementById("scenesList-toggle-btn").addEventListener("click", function () {
        let wrapper = document.getElementById("scenesDrawerWrapper");
        let btn = document.getElementById("scenesList-toggle-btn");

        if (btn.classList.contains("scenesListToggleOn")) {
            btn.classList.add("scenesListToggleOff");
            btn.classList.remove("scenesListToggleOn");
            swapLucideIcon(this, 'chevron-up');
            wrapper.classList.add("closed-drawer");
        } else {
            btn.classList.add("scenesListToggleOn");
            btn.classList.remove("scenesListToggleOff");
            swapLucideIcon(this, 'chevron-down');
            wrapper.classList.remove("closed-drawer");
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    // ── Scene Reorder Drag-and-Drop ──
    (function() {
        let container = document.getElementById('scenesInsideVREditor');
        if (!container) return;
        let dragItem = null;

        container.addEventListener('dragstart', function(e) {
            let card = e.target.closest('.SceneCardContainer[draggable]');
            if (!card) return;
            dragItem = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/vrodos-scene-reorder', 'true');
        });

        container.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            let card = e.target.closest('.SceneCardContainer[draggable]');
            if (!card || card === dragItem) return;
            let rect = card.getBoundingClientRect();
            let midX = rect.left + rect.width / 2;
            if (e.clientX < midX) {
                container.insertBefore(dragItem, card);
            } else {
                container.insertBefore(dragItem, card.nextSibling);
            }
        });

        container.addEventListener('dragend', function() {
            if (dragItem) dragItem.classList.remove('dragging');
            dragItem = null;
            // Update number badges
            container.querySelectorAll('.SceneCardContainer[draggable] .scene-order-badge').forEach(function(badge, i) {
                badge.textContent = i + 1;
            });
            // Save new order via AJAX
            let formData = new FormData();
            formData.append('action', 'vrodos_reorder_scenes_action');
            let nonceField = document.querySelector('[name="post_nonce_field"]');
            if (nonceField) formData.append('nonce', nonceField.value);
            container.querySelectorAll('.SceneCardContainer[draggable]').forEach(function(card) {
                formData.append('scene_ids[]', card.dataset.sceneId);
            });
            fetch(my_ajax_object_deletescene.ajax_url, { method: 'POST', body: formData });
        });
    })();

    // Take SCREENSHOT OF SCENE
    document.getElementById("takeScreenshotBtn").addEventListener("click", function () {
        takeScreenshot();
        is_scene_icon_manually_selected = false;
    });

    // Select image as Scene icon
    document.getElementById("vrodos_scene_sshot_manual_select").addEventListener("change", function () {
        readLocalImageAsSceneIcon(this);
    });

    function readLocalImageAsSceneIcon(input) {

        if (input.files && input.files[0]) {
            let reader = new FileReader();

            reader.onload = function (e) {
                setSceneScreenshotPreview(e.target.result);
                is_scene_icon_manually_selected = true;
            };

            reader.readAsDataURL(input.files[0]);
        }
    }


    // DELETE SCENE DIALOGUE
    document.getElementById("deleteSceneDialogDeleteBtn").addEventListener("click", function (e) {
        document.getElementById('delete-scene-dialog-progress-bar').style.display = '';
        document.getElementById("deleteSceneDialogDeleteBtn").classList.add("LinkDisabled");
        document.getElementById("deleteSceneDialogCancelBtn").classList.add("LinkDisabled");
        let dlg = document.getElementById('delete-dialog');
        vrodos_deleteSceneAjax(dlg.dataset.sceneId, url_scene_redirect);
    });

    document.getElementById("deleteSceneDialogCancelBtn").addEventListener("click", function (e) {
        document.getElementById('delete-scene-dialog-progress-bar').style.display = 'none';
        let dlg = document.getElementById('delete-dialog');
        if (dlg && dlg.open) dlg.close();
    });


    // Scene card delete icons (delegated)
    document.querySelectorAll(".cardDeleteIcon").forEach(function (el) {
        el.addEventListener("click", function () {
            deleteScene(this);
        });
    });

    // Delete scene
    function deleteScene(btn) {

        let scene_id = btn.dataset.sceneid;
        let dialogTitle = document.getElementById("delete-dialog-title");
        let dialogDescription = document.getElementById("delete-dialog-description");
        let sceneTitle = document.getElementById(scene_id + "-title").textContent.trim();

        dialogTitle.textContent = "Delete " + sceneTitle + "?";
        dialogDescription.innerHTML = "Are you sure you want to delete your scene '" + sceneTitle + "'? There is no Undo functionality once you delete it.";
        let dlg = document.getElementById('delete-dialog');
        dlg.dataset.sceneId = scene_id;
        dlg.showModal();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Toggle JSON viewer dialog
    document.getElementById('toggleViewSceneContentBtn').addEventListener('click', function () {
        let dialog = document.getElementById('sceneJsonContent');
        if (dialog.open) {
            dialog.close();
        } else {
            // Refresh textarea with the exact exported scene payload
            refreshSceneJsonTextarea();
            dialog.showModal();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });

    // Close JSON dialog via close button
    document.getElementById('closeJsonBtn').addEventListener('click', function () {
        document.getElementById('sceneJsonContent').close();
    });

    // Copy JSON to clipboard
    document.getElementById('copyJsonBtn').addEventListener('click', function () {
        let textarea = document.getElementById('vrodos_scene_json_input');
        copyTextareaText(textarea)
            .then(function () {
                showTemporaryButtonSuccess('copyJsonBtn', 'Copied!');
            })
            .catch(function (error) {
                textarea.select();
                textarea.setSelectionRange(0, textarea.value.length);
                showTemporaryButtonWarning('copyJsonBtn', 'Press Ctrl+C');
                console.warn('VRodos: failed to copy scene JSON to clipboard.', error);
            });
    });

    // Drag elements inside VR Editor
    document.getElementById('vr_editor_main_div').ondrop =
        function (ev) {

            // Ignore scene reorder drags
            if (ev.dataTransfer.types.indexOf('application/vrodos-scene-reorder') !== -1) return;

            let dataDrag = JSON.parse(ev.dataTransfer.getData("text"));

            let categoryName = dataDrag['category_name'];
            let nameModel = dataDrag.title;

            let path = '';

            // SUN or LAMP or Spot or Ambient
            if (dataDrag['category_name'] === "lightSun" ||
                dataDrag['category_name'] === "lightLamp" ||
                dataDrag['category_name'] === "lightSpot" ||
                dataDrag['category_name'] === "lightAmbient" ||
                dataDrag['category_name'] === "Pawn") {


            }
            else {
                path = dataDrag.path.substring(0, dataDrag.path.lastIndexOf("/") + 1);
            }

            let translation = dragDropVerticalRayCasting(ev);


            // Suppress the click-selection that would fire from the drop's mouseup
            _suppressNextSelection = true;

            // Asset add to canvas
            addAssetToCanvas(nameModel, path, categoryName, dataDrag, translation, pluginPath);

            showObjectPropertiesPanel(transform_controls.getMode());

            if (envir.is2d) {
                transform_controls.setMode("translate");
                document.getElementById("translatePanelGui").style.display = '';
            }

            ev.preventDefault();
        };


    // VR Editor Drag Over
    document.getElementById('vr_editor_main_div').ondragover =
        function (ev) {
            ev.preventDefault();
        };


    let pauseBtn = document.getElementById("pauseRendering");
    if (pauseBtn) {
        pauseBtn.addEventListener('mousedown', function (event) {
            pauseClickFun();
        }, false);
    }


    // Convert scene to json and put the json in the wordpress field vrodos_scene_json_input
    document.getElementById('save-scene-button').addEventListener('click', function () {

        if (envir && envir.isSceneLoading) {
            let loadingNotice = document.getElementById("result_download");
            if (loadingNotice) {
                loadingNotice.innerHTML = "Please wait until scene loading finishes before saving.";
            }
            return;
        }

        let save_scene_btn = document.getElementById("save-scene-button");
        if (save_scene_btn.classList.contains("LinkDisabled")){
            return;
        }

        save_scene_btn.innerHTML = "Saving...";
        save_scene_btn.classList.add("LinkDisabled");
        document.getElementById("compileGameBtn").disabled = true;

        // Export using the new VrodosSceneExporter
        let exporter = new VrodosSceneExporter();
        document.getElementById('vrodos_scene_json_input').value = exporter.parse(envir.scene);

        vrodos_saveSceneAjax();
    });


    // UNDO button
    document.getElementById('undo-scene-button').addEventListener('click', function () {

        post_revision_no += 1;

        document.getElementById('redo-scene-button').style.visibility = 'visible';

        this.innerHTML = "...";
        this.classList.add("LinkDisabled");

        vrodos_undoSceneAjax(uploadDir, post_revision_no);
    });

    // REDO button
    document.getElementById('redo-scene-button').addEventListener('click', function () {

        if (post_revision_no >= 1) {
            post_revision_no -= 1;

            this.innerHTML = "...";
            this.classList.add("LinkDisabled");
            vrodos_redoSceneAjax(uploadDir, post_revision_no);

            if (post_revision_no < 1) {
                document.getElementById('redo-scene-button').style.visibility = 'hidden';
            }
        }
    });


    // Autorotate in 3D
    document.getElementById('toggle-tour-around-btn').addEventListener('click', function () {

        let btn = this;

        if (envir.is2d)
            document.getElementById("dim-change-btn").click();

        if (btn.dataset.toggle === 'off') {

            envir.orbitControls.autoRotate = true;
            envir.orbitControls.autoRotateSpeed = 0.6;
            btn.dataset.toggle = 'on';

        } else {

            envir.orbitControls.autoRotate = false;
            btn.dataset.toggle = 'off';
        }

        btn.classList.toggle('toggle-active');
    });

    if (firstPersonBlockerBtn) {
        firstPersonBlockerBtn.addEventListener('click', function (event) {

            firstPersonViewWithoutLock();
            document.getElementById("firstPersonBlockerBtn").classList.toggle('toggle-active');

        }, false);
    }


    // 3D Widgets change mode (Translation-Rotation-Scale)
    document.getElementById("object-manipulation-toggle").addEventListener("click", function () {

        let checked = document.querySelector("input[name='object-manipulation-switch']:checked");
        let mode = checked ? checked.value : 'translate';

        // Sun and Target spot can not change control manipulation mode
        if (transform_controls.object) {
            if (transform_controls.object['category_name'].includes("lightTargetSpot") ||
                transform_controls.object['category_name'].includes("lightSun") ||
                transform_controls.object['category_name'].includes("lightLamp") ||
                transform_controls.object['category_name'].includes("lightSpot")) {

                if (mode === 'rotate')
                    return;
            }
            transform_controls.setMode(mode);
            showObjectPropertiesPanel(mode);
        }
    });

// Event listener to disable orbit controls while dragging
transform_controls.addEventListener('dragging-changed', function (event) {
    envir.orbitControls.enabled = !event.value;
});

    // Axis Increase size btn
    document.getElementById("axis-size-increase-btn").addEventListener("click", function () {
        transform_controls.setSize(transform_controls.size * 1.1);
    });

    // Axis Decrease size btn
    document.getElementById("axis-size-decrease-btn").addEventListener("click", function () {
        transform_controls.setSize(Math.max(transform_controls.size * 0.9, 0.1));
    });

    // Toggle 2D vs 3D button
    document.getElementById("dim-change-btn").addEventListener("click", function () {

        document.getElementById("translate-switch").click();

        if (envir.is2d) {
            //3d
            envir.orbitControls.enableRotate = true;
            envir.gridHelper.visible = true;
            envir.axesHelper.visible = true;

            document.getElementById("object-manipulation-toggle").style.display = "";
            let dimBtn3d = document.getElementById("dim-change-btn");
            dimBtn3d.textContent = "3D";
            dimBtn3d.title = "3D mode";

            envir.is2d = false;
            transform_controls.setMode("translate");

        } else {

            envir.orbitControls.reset();

            envir.orbitControls.enableRotate = false;
            envir.gridHelper.visible = false;
            envir.axesHelper.visible = false;

            document.getElementById("object-manipulation-toggle").style.display = "none";
            let dimBtn2d = document.getElementById("dim-change-btn");
            dimBtn2d.textContent = "2D";
            dimBtn2d.title = "2D mode";

            envir.is2d = true;
            transform_controls.setMode("translate");

            if (envir.getDirectorVisualObject()) envir.getDirectorVisualObject().visible = true;
        }

        findSceneDimensions();
        envir.updateCameraGivenSceneLimits();

        envir.orbitControls.object.updateProjectionMatrix();
        document.getElementById("dim-change-btn").classList.toggle('toggle-active');
    });


    // Main canvas handlers

    let canvas3D = document.querySelector("#vr_editor_main_div canvas");

    // Update DAT GUI only when mouse pointer is active.
    canvas3D.addEventListener("mousemove", (event) => {
        updatePositionsAndControls();
    });

    // Left click — track mousedown position, select on mouseup (so dragging doesn't trigger selection)
    canvas3D.addEventListener('mousedown', _onCanvasMouseDown, false);
    canvas3D.addEventListener('mouseup', _onCanvasMouseUp, false);

    // Left double click
    canvas3D.addEventListener('dblclick', onMouseDoubleClickFocus, false);

    // Right Click
    canvas3D.addEventListener('contextmenu', contextMenuClick, false);

    // Auto-Saving
    // Detect enter button press for saving scene
    canvas3D.addEventListener('keypress', saveScene, false);

    // Auto save listener
    envir.scene.addEventListener("modificationPendingSave", saveScene);

    // Prevent showing the context menu on property panels
    ['popUpArtifactPropertiesDiv', 'popUpDoorPropertiesDiv', 'popUpPoiImageTextPropertiesDiv',
     'popUpPoiVideoPropertiesDiv', 'popUpSunPropertiesDiv', 'popUpLampPropertiesDiv',
     'popUpSpotPropertiesDiv', 'popUpAmbientPropertiesDiv'].forEach(function (id) {
        let el = document.getElementById(id);
        if (el) el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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
                swapLucideIcon(btn, 'eye-off');
                btn.dataset.toggle = 'off';

                uiElementsToToggle.forEach(el => el.style.setProperty('display', 'none', 'important'));

                transform_controls.visible = false;
                if (envir.getDirectorRig()) envir.getDirectorRig().visible = false;
                if (envir.gridHelper) envir.gridHelper.visible = false;
                if (envir.axesHelper) envir.axesHelper.visible = false;
                removeAllCelOutlines();
                setVisiblityLightHelpingElements(false);

            } else {
                // --- SHOW UI ---
                btn.classList.remove('tw-opacity-40');
                swapLucideIcon(btn, 'eye');
                btn.dataset.toggle = 'on';

                uiElementsToToggle.forEach(el => {
                    // Restore the original display style
                    el.style.removeProperty('display');
                });

                transform_controls.visible = true;
                if (envir.gridHelper) envir.gridHelper.visible = true;
                if (envir.axesHelper) envir.axesHelper.visible = true;
                if (transform_controls.object) addCelOutline(transform_controls.object);
                setVisiblityLightHelpingElements(true);

                if (envir.thirdPersonView || avatarControlsEnabled) {
                    if (envir.getDirectorRig()) envir.getDirectorRig().visible = false;
                } else {
                    if (envir.getDirectorRig()) envir.getDirectorRig().visible = true;
                }
            }
            if (envir.turboResize) envir.turboResize();
        });
    }


    // Drag light or Pawn: Add event listeners
    let allUpperToolbarButtons = document.querySelectorAll('.environmentBar .lightpawnbutton');

    [].forEach.call(allUpperToolbarButtons, function (col) {
        col.addEventListener('dragstart', handleLightPawnDragStart, false);
    });


    // Handler for dragging lights or Pawn
    function handleLightPawnDragStart(e) {

        let dragData;
        if (e.target.dataset.lightpawn === "Sun" ||
            e.target.dataset.lightpawn === "Spot" ||
            e.target.dataset.lightpawn === "Lamp" ||
            e.target.dataset.lightpawn === "Ambient"
        ) {
            dragData = {
                "category_name": "light" + e.target.dataset.lightpawn,
                "title": "mylight" + e.target.dataset.lightpawn + "_" + Math.floor(Date.now() / 1000)
            };

        }
        else if (e.target.dataset.lightpawn === "Pawn") {
            dragData = {
                "category_name": "Pawn",
                "title": "aPawn" + "_" + Math.floor(Date.now() / 1000)
            };
        }

        e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        return false;
    }
}


// ==================== Global scope functions ================

function setVisiblityLightHelpingElements(statusVisibility) {

    for (let i = 0; i < envir.scene.children.length; i++) {
        let curr_obj = envir.scene.children[i];

        if (curr_obj['category_name'] === 'lightHelper' || curr_obj['category_name'] === 'lightTargetSpot')
            curr_obj.visible = statusVisibility;

        if (curr_obj['category_name'] === 'lightSun')
            curr_obj.children[0].visible = statusVisibility;

        if (curr_obj['category_name'] === 'lightLamp')
            curr_obj.children[0].visible = statusVisibility;

        if (curr_obj['category_name'] === 'lightSpot')
            curr_obj.children[0].visible = statusVisibility;

        if (curr_obj.type === 'CameraHelper') // This is the shadow camera of sun
            curr_obj.visible = statusVisibility;
    }
}


function pauseClickFun() {
    isPaused = !isPaused;
    swapLucideIcon(document.getElementById("pauseRendering"), isPaused ? "pause" : "play");

    if (!isPaused) {
        animate();
        document.getElementById('pauseRendering').style.background = '';
    } else {
        document.getElementById('pauseRendering').style.background = 'red';
    }

    envir.scene.traverse(function (node) {
        if (node instanceof THREE.PositionalAudio) {
            if (isPaused)
                node.pause();
            else
                node.play();
        }
    });
}



// Hide right click panel for object properties
function hideObjectPropertiesPanels() {
    let el;
    el = document.getElementById("translatePanelGui"); if (el) el.style.display = 'none';
    el = document.getElementById("rotatePanelGui");    if (el) el.style.display = 'none';
    el = document.getElementById("scalePanelGui");     if (el) el.style.display = 'none';
}

function showObjectPropertiesPanel(type) {
    hideObjectPropertiesPanels();
    let el = document.getElementById(type + "PanelGui");
    if (el) el.style.display = '';
}

// Take screenshot of scene
function takeScreenshot() {

    //envir.cameraAvatarHelper.visible = false;
    if (envir.scene.getObjectByName("myTransformControls")) {
        envir.scene.getObjectByName("myTransformControls").visible = false;
    }

    // Render to an offscreen canvas to capture the screenshot reliably
    let camera = avatarControlsEnabled ? envir.cameraAvatar : envir.cameraOrbit;
    let w = envir.renderer.domElement.width;
    let h = envir.renderer.domElement.height;

    let offscreenRenderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true });
    offscreenRenderer.setSize(w, h);
    offscreenRenderer.render(envir.scene, camera);

    new_screenshot_data = offscreenRenderer.domElement.toDataURL("image/jpeg");
    setSceneScreenshotPreview(new_screenshot_data);

    // Also update the current scene's drawer thumbnail
    let drawerThumb = document.querySelector('.current-scene-thumb');
    if (drawerThumb) {
        drawerThumb.src = new_screenshot_data;
    } else {
        // If placeholder (no previous screenshot), replace it with an img
        let placeholder = document.querySelector('.current-scene-thumb-placeholder');
        if (placeholder) {
            let img = document.createElement('img');
            img.src = new_screenshot_data;
            img.className = 'tw-w-full tw-h-full tw-object-cover current-scene-thumb';
            placeholder.replaceWith(img);
        }
    }

    offscreenRenderer.dispose();

    if (envir.scene.getObjectByName("myTransformControls"))
        envir.scene.getObjectByName("myTransformControls").visible = true;

    // Auto-save the scene so the screenshot is persisted immediately
    document.getElementById('save-scene-button').click();
}




// Save scene
function saveScene(e) {
    if (!e || !e.type) {
        return;
    }

    if (envir && envir.isSceneLoading) {
        return;
    }

    // A change has been made and mouseup then save
    if (e.type == 'modificationPendingSave')
        mapActions[e.type] = true;

    if (e.type == 'mouseup') {
        mapActions[e.type] = true;

        if (mapActions['mouseup'] && mapActions['modificationPendingSave']) {
            document.getElementById('save-scene-button').click();
            mapActions = {};
            return;
        }
    }
}

function commitPendingSceneSave() {
    if (envir && envir.isSceneLoading) {
        return;
    }
    mapActions['modificationPendingSave'] = true;
    document.getElementById('save-scene-button').click();
    mapActions = {};
}

// trigger autosave for the automatic cases (insert, delete asset from scene)
function triggerAutoSave() {
    if (!envir || !envir.scene) {
        return;
    }

    if (envir.isSceneLoading) {
        return;
    }

    // For non-canvas actions like lil-gui finish-change, insert/delete, and property edits,
    // save directly instead of synthesizing a mouseup event. Synthetic mouseup bubbled back
    // into lil-gui's own onMouseUp handler and caused recursive autosave loops.
    envir.scene.dispatchEvent({ type: "modificationPendingSave" });
    commitPendingSceneSave();
}
