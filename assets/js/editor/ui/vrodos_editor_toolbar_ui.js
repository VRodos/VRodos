'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.api = VRODOS.api || {};

(function initVrodosEditorToolbarUi() {
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

    function requestRender(reason) {
        if (typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender(reason || 'editor-toolbar');
        }
    }

    function bindPauseControl() {
        const pauseBtn = document.getElementById('pauseRendering');
        if (!pauseBtn) return;

        pauseBtn.addEventListener('mousedown', () => {
            VRODOS.ui.pauseClickFun();
        }, false);
    }

    function bindSceneSaveControl() {
        const saveButton = document.getElementById('save-scene-button');
        if (!saveButton) return;

        saveButton.addEventListener('click', () => {
            const envir = getEnvir();
            if (envir && envir.isSceneLoading) {
                const loadingNotice = document.getElementById('result_download');
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
        const undoButton = document.getElementById('undo-scene-button');
        if (undoButton) {
            undoButton.addEventListener('click', () => {
                if (typeof VRODOS.editor.undoManager !== 'undefined') {
                    VRODOS.editor.undoManager.undo();
                }
            });
        }

        const redoButton = document.getElementById('redo-scene-button');
        if (redoButton) {
            redoButton.addEventListener('click', () => {
                if (typeof VRODOS.editor.undoManager !== 'undefined') {
                    VRODOS.editor.undoManager.redo();
                }
            });
        }
    }

    function bindOrbitAutoRotateControl() {
        const toggleButton = document.getElementById('toggle-tour-around-btn');
        if (!toggleButton) return;

        toggleButton.addEventListener('click', function() {
            const envir = getEnvir();
            if (!envir || !envir.orbitControls) return;

            const dimButton = document.getElementById('dim-change-btn');
            if (envir.is2d && dimButton) {
                dimButton.click();
            }

            if (this.dataset.toggle === 'off') {
                envir.orbitControls.autoRotate = true;
                envir.orbitControls.autoRotateSpeed = 1.2;
                this.dataset.toggle = 'on';
            } else {
                envir.orbitControls.autoRotate = false;
                this.dataset.toggle = 'off';
            }

            this.classList.toggle('toggle-active');
            requestRender('orbit-auto-rotate-toggle');
        });
    }

    function bindFirstPersonControl() {
        const blockerButton = VRODOS.editor.firstPersonBlockerBtn || document.getElementById('firstPersonBlockerBtn');
        if (!blockerButton) return;

        blockerButton.addEventListener('click', () => {
            if (typeof VRODOS.api.firstPersonViewWithoutLock === 'function') {
                VRODOS.api.firstPersonViewWithoutLock();
                blockerButton.classList.toggle('toggle-active');
            }
        }, false);
    }

    function bindTransformModeControls() {
        const objectManipulationToggle = document.getElementById('object-manipulation-toggle');
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

        const axisIncreaseButton = document.getElementById('axis-size-increase-btn');
        if (axisIncreaseButton) {
            axisIncreaseButton.addEventListener('click', () => {
                const transforms = getTransforms();
                if (transforms && typeof transforms.scaleSize === 'function') {
                    transforms.scaleSize(1.1);
                }
            });
        }

        const axisDecreaseButton = document.getElementById('axis-size-decrease-btn');
        if (axisDecreaseButton) {
            axisDecreaseButton.addEventListener('click', () => {
                const transforms = getTransforms();
                if (transforms && typeof transforms.scaleSize === 'function') {
                    transforms.scaleSize(0.9);
                }
            });
        }
    }

    function bindDimensionToggle() {
        const dimensionButton = document.getElementById('dim-change-btn');
        if (!dimensionButton) return;

        dimensionButton.addEventListener('click', () => {
            const envir = getEnvir();
            const transforms = getTransforms();
            const translateSwitch = document.getElementById('translate-switch');
            const objectManipulationToggle = document.getElementById('object-manipulation-toggle');

            if (!envir || !envir.orbitControls || !transforms || typeof transforms.setMode !== 'function') return;
            if (translateSwitch) translateSwitch.click();

            if (envir.is2d) {
                envir.orbitControls.enableRotate = true;
                if (envir.gridHelper) envir.gridHelper.visible = true;
                if (envir.axesHelper) envir.axesHelper.visible = true;

                if (objectManipulationToggle) objectManipulationToggle.style.display = '';
                dimensionButton.textContent = '3D';
                dimensionButton.title = '3D mode';

                envir.is2d = false;
                transforms.setMode('translate');
            } else {
                if (typeof envir.orbitControls.reset === 'function') {
                    envir.orbitControls.reset();
                }
                envir.orbitControls.enableRotate = false;
                if (envir.gridHelper) envir.gridHelper.visible = false;
                if (envir.axesHelper) envir.axesHelper.visible = false;

                if (objectManipulationToggle) objectManipulationToggle.style.display = 'none';
                dimensionButton.textContent = '2D';
                dimensionButton.title = '2D mode';

                envir.is2d = true;
                transforms.setMode('translate');

                if (typeof envir.getDirectorVisualObject === 'function' && envir.getDirectorVisualObject()) {
                    envir.getDirectorVisualObject().visible = true;
                }
            }

            if (typeof VRODOS.utils.findSceneDimensions === 'function') {
                VRODOS.utils.findSceneDimensions();
            }
            if (typeof envir.fitCameraToSceneLimits === 'function') {
                envir.fitCameraToSceneLimits();
            }
            if (envir.orbitControls.object && typeof envir.orbitControls.object.updateProjectionMatrix === 'function') {
                envir.orbitControls.object.updateProjectionMatrix();
            }

            dimensionButton.classList.toggle('toggle-active');
        });
    }

    VRODOS.ui.pauseClickFun = function() {
        VRODOS.editor.isPaused = !VRODOS.editor.isPaused;

        const pauseButton = document.getElementById('pauseRendering');
        VRODOS.ui.swapLucideIcon(pauseButton, VRODOS.editor.isPaused ? 'pause' : 'play');

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
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    };

    VRODOS.ui.showObjectPropertiesPanel = function(type) {
        VRODOS.ui.hideObjectPropertiesPanels();

        const element = document.getElementById(`${type}PanelGui`);
        if (element) element.style.display = '';
    };

    VRODOS.ui.editorToolbar = toolbarUi;
    VRODOS.ui.bindEditorToolbarControls = function() {
        return toolbarUi.bind();
    };
})();
