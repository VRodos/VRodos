'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.api = VRODOS.api || {};

(function initVrodosEditorToolbarUi() {
    const TOOLBAR_IDS = {
        pause: 'pauseRendering',
        save: 'save-scene-button',
        undo: 'undo-scene-button',
        redo: 'redo-scene-button',
        orbitAutoRotate: 'toggle-tour-around-btn',
        dimension: 'dim-change-btn',
        firstPerson: 'firstPersonBlockerBtn',
        objectManipulation: 'object-manipulation-toggle',
        axisIncrease: 'axis-size-increase-btn',
        axisDecrease: 'axis-size-decrease-btn',
        translateSwitch: 'translate-switch',
        scaleLock: 'scaleLockCheckbox',
        loadingNotice: 'result_download'
    };

    const toolbarUi = VRODOS.ui.editorToolbar || {
        isBound: false,

        bind() {
            if (this.isBound) {
                return true;
            }

            bindPauseControl();
            bindSceneSaveControl();
            bindUndoRedoControls();
            bindOrbitAutoRotateControl();
            bindFirstPersonControl();
            bindTransformModeControls();
            bindScaleLockControl();
            bindDimensionToggle();

            this.isBound = true;
            return true;
        }
    };

    function getEnvir() {
        return VRODOS.editor.envir || null;
    }

    function getTransforms() {
        return VRODOS.editor.transforms || null;
    }

    function getElement(id) {
        return document.getElementById(id);
    }

    function setButtonActive(button, isActive) {
        if (!button) return;
        button.classList.toggle('toggle-active', Boolean(isActive));
    }

    function setToggleDataset(button, isActive) {
        if (!button) return;
        button.dataset.toggle = isActive ? 'on' : 'off';
    }

    function setToggleButtonState(button, isActive) {
        setToggleDataset(button, isActive);
        setButtonActive(button, isActive);
    }

    function requestRender(reason) {
        if (typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender(reason || 'editor-toolbar');
        }
    }

    function bindPauseControl() {
        const pauseBtn = getElement(TOOLBAR_IDS.pause);
        if (!pauseBtn) return;

        pauseBtn.addEventListener('mousedown', () => {
            VRODOS.ui.pauseClickFun();
        }, false);
    }

    function bindSceneSaveControl() {
        const saveButton = getElement(TOOLBAR_IDS.save);
        if (!saveButton) return;

        saveButton.addEventListener('click', () => {
            const envir = getEnvir();
            if (envir && envir.isSceneLoading) {
                const loadingNotice = getElement(TOOLBAR_IDS.loadingNotice);
                if (loadingNotice) {
                    loadingNotice.innerHTML = 'Please wait until scene loading finishes before saving.';
                }
                return;
            }

            if (saveButton.classList.contains('LinkDisabled')) {
                return;
            }

            if (typeof VRODOS.api.saveChanges === 'function') {
                VRODOS.api.saveChanges({ force: true });
            }
        });
    }

    function bindUndoRedoControls() {
        const undoButton = getElement(TOOLBAR_IDS.undo);
        if (undoButton) {
            undoButton.addEventListener('click', () => {
                if (typeof VRODOS.editor.undoManager !== 'undefined') {
                    VRODOS.editor.undoManager.undo();
                }
            });
        }

        const redoButton = getElement(TOOLBAR_IDS.redo);
        if (redoButton) {
            redoButton.addEventListener('click', () => {
                if (typeof VRODOS.editor.undoManager !== 'undefined') {
                    VRODOS.editor.undoManager.redo();
                }
            });
        }
    }

    function bindOrbitAutoRotateControl() {
        const toggleButton = getElement(TOOLBAR_IDS.orbitAutoRotate);
        if (!toggleButton) return;

        toggleButton.addEventListener('click', () => {
            const envir = getEnvir();
            if (!envir || !envir.orbitControls) return;

            const dimButton = getElement(TOOLBAR_IDS.dimension);
            if (envir.is2d && dimButton) {
                dimButton.click();
            }

            const shouldAutoRotate = toggleButton.dataset.toggle !== 'on';
            envir.orbitControls.autoRotate = shouldAutoRotate;
            if (shouldAutoRotate) {
                envir.orbitControls.autoRotateSpeed = 1.2;
            }

            setToggleButtonState(toggleButton, shouldAutoRotate);
            requestRender('orbit-auto-rotate-toggle');
        });
    }

    function bindFirstPersonControl() {
        const blockerButton = VRODOS.editor.firstPersonBlockerBtn || getElement(TOOLBAR_IDS.firstPerson);
        if (!blockerButton) return;

        blockerButton.addEventListener('click', () => {
            if (typeof VRODOS.api.firstPersonViewWithoutLock === 'function') {
                VRODOS.api.firstPersonViewWithoutLock();
                setButtonActive(blockerButton, VRODOS.editor.avatarControlsEnabled);
            }
        }, false);
    }

    function bindTransformModeControls() {
        const objectManipulationToggle = getElement(TOOLBAR_IDS.objectManipulation);
        if (objectManipulationToggle) {
            objectManipulationToggle.addEventListener('click', () => {
                const checked = document.querySelector("input[name='object-manipulation-switch']:checked");
                const mode = checked ? checked.value : 'translate';
                const transforms = getTransforms();

                if (transforms && typeof transforms.setMode === 'function') {
                    transforms.setMode(mode, { showProperties: true });
                }
            });
        }

        const axisIncreaseButton = getElement(TOOLBAR_IDS.axisIncrease);
        if (axisIncreaseButton) {
            axisIncreaseButton.addEventListener('click', () => {
                const transforms = getTransforms();
                if (transforms && typeof transforms.scaleSize === 'function') {
                    transforms.scaleSize(1.1);
                }
            });
        }

        const axisDecreaseButton = getElement(TOOLBAR_IDS.axisDecrease);
        if (axisDecreaseButton) {
            axisDecreaseButton.addEventListener('click', () => {
                const transforms = getTransforms();
                if (transforms && typeof transforms.scaleSize === 'function') {
                    transforms.scaleSize(0.9);
                }
            });
        }
    }

    function bindScaleLockControl() {
        const scaleLockCheckbox = getElement(TOOLBAR_IDS.scaleLock);
        if (!scaleLockCheckbox) return;

        scaleLockCheckbox.addEventListener('change', () => {
            if (typeof VRODOS.ui.setKeepScaleAspectRatio === 'function') {
                VRODOS.ui.setKeepScaleAspectRatio(scaleLockCheckbox.checked);
                return;
            }

            const envir = getEnvir();
            if (envir && envir.scene) {
                envir.scene.keepScaleAspectRatio = scaleLockCheckbox.checked;
            }
        });
    }

    function setDimensionButtonState(dimensionButton, envir) {
        if (!dimensionButton || !envir) return;

        const is3dMode = !envir.is2d;
        dimensionButton.textContent = is3dMode ? '3D' : '2D';
        dimensionButton.title = is3dMode ? '3D mode' : '2D mode';
        setButtonActive(dimensionButton, is3dMode);
    }

    function setObjectManipulationVisible(isVisible) {
        const objectManipulationToggle = getElement(TOOLBAR_IDS.objectManipulation);
        if (objectManipulationToggle) {
            objectManipulationToggle.style.display = isVisible ? '' : 'none';
        }
    }

    function resetOrbitFor2d(envir) {
        if (envir.orbitControls && typeof envir.orbitControls.reset === 'function') {
            envir.orbitControls.reset();
        }
    }

    function fitCameraAfterDimensionChange(envir) {
        if (typeof VRODOS.utils.findSceneDimensions === 'function') {
            VRODOS.utils.findSceneDimensions();
        }
        if (typeof envir.fitCameraToSceneLimits === 'function') {
            envir.fitCameraToSceneLimits();
        }
        if (envir.orbitControls.object && typeof envir.orbitControls.object.updateProjectionMatrix === 'function') {
            envir.orbitControls.object.updateProjectionMatrix();
        }
    }

    function enter3dMode(envir, transforms) {
        envir.orbitControls.enableRotate = true;
        if (envir.gridHelper) envir.gridHelper.visible = true;
        if (envir.axesHelper) envir.axesHelper.visible = true;

        setObjectManipulationVisible(true);
        envir.is2d = false;
        transforms.setMode('translate');
    }

    function enter2dMode(envir, transforms) {
        resetOrbitFor2d(envir);
        envir.orbitControls.enableRotate = false;
        if (envir.gridHelper) envir.gridHelper.visible = false;
        if (envir.axesHelper) envir.axesHelper.visible = false;

        setObjectManipulationVisible(false);
        envir.is2d = true;
        transforms.setMode('translate');

        if (typeof envir.getDirectorVisualObject === 'function' && envir.getDirectorVisualObject()) {
            envir.getDirectorVisualObject().visible = true;
        }
    }

    function bindDimensionToggle() {
        const dimensionButton = getElement(TOOLBAR_IDS.dimension);
        if (!dimensionButton) return;

        dimensionButton.addEventListener('click', () => {
            const envir = getEnvir();
            const transforms = getTransforms();
            const translateSwitch = getElement(TOOLBAR_IDS.translateSwitch);

            if (!envir || !envir.orbitControls || !transforms || typeof transforms.setMode !== 'function') return;
            if (translateSwitch) translateSwitch.click();

            if (envir.is2d) {
                enter3dMode(envir, transforms);
            } else {
                enter2dMode(envir, transforms);
            }

            setDimensionButtonState(dimensionButton, envir);
            fitCameraAfterDimensionChange(envir);
            requestRender('dimension-toggle');
        });
    }

    VRODOS.ui.pauseClickFun = function() {
        VRODOS.editor.isPaused = !VRODOS.editor.isPaused;

        const pauseButton = getElement(TOOLBAR_IDS.pause);
        if (typeof VRODOS.ui.swapLucideIcon === 'function') {
            VRODOS.ui.swapLucideIcon(pauseButton, VRODOS.editor.isPaused ? 'pause' : 'play');
        }

        if (!VRODOS.editor.isPaused) {
            if (typeof VRODOS.editor.animate === 'function') {
                VRODOS.editor.animate();
            }
            if (pauseButton) pauseButton.style.background = '';
        } else {
            if (typeof VRODOS.editor.stopRenderLoop === 'function') {
                VRODOS.editor.stopRenderLoop();
            }
            if (pauseButton) pauseButton.style.background = 'red';
        }

        const envir = getEnvir();
        for (const node of ((envir && envir.positionalAudioNodes) || [])) {
            if (VRODOS.editor.isPaused && typeof node.pause === 'function') node.pause();
            else if (!VRODOS.editor.isPaused && typeof node.play === 'function') node.play();
        }
    };

    VRODOS.ui.hideObjectPropertiesPanels = function() {
        const panelIds = [
            'translatePanelGui',
            'rotatePanelGui',
            'scalePanelGui'
        ];

        panelIds.forEach((id) => {
            const element = getElement(id);
            if (element) element.style.display = 'none';
        });
    };

    VRODOS.ui.showObjectPropertiesPanel = function(type) {
        VRODOS.ui.hideObjectPropertiesPanels();

        const element = getElement(`${type}PanelGui`);
        if (element) element.style.display = '';
    };

    VRODOS.ui.editorToolbar = toolbarUi;
    VRODOS.ui.bindEditorToolbarControls = function() {
        return toolbarUi.bind();
    };
})();
