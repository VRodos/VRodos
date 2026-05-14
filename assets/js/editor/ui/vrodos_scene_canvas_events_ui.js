'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.api = VRODOS.api || {};

(function initVrodosSceneCanvasEventsUi() {
    const canvasEventsUi = VRODOS.ui.sceneCanvasEvents || {
        isBound: false,

        bind() {
            if (this.isBound) {
                return true;
            }

            const mainDiv = document.getElementById('vr_editor_main_div');
            const canvas3D = mainDiv ? mainDiv.querySelector('canvas') : null;

            if (!mainDiv || !canvas3D) {
                console.warn('VRodos: scene canvas event binding skipped because canvas DOM is missing.');
                return false;
            }

            bindEditorDropTargets(mainDiv);
            bindCanvasPointerEvents(canvas3D);
            bindCanvasAutosaveEvents(canvas3D);
            bindPropertyPanelContextMenus();
            bindLightPawnDragStart();

            this.isBound = true;
            return true;
        }
    };

    function bindEditorDropTargets(mainDiv) {
        if (typeof VRODOS.ui.onDrop === 'function') {
            mainDiv.ondrop = VRODOS.ui.onDrop;
        }

        if (typeof VRODOS.ui.onDragOver === 'function') {
            mainDiv.ondragover = VRODOS.ui.onDragOver;
        }
    }

    function bindCanvasPointerEvents(canvas3D) {
        canvas3D.addEventListener('mousemove', () => {
            if (typeof VRODOS.editor.updatePositionsAndControls === 'function') {
                VRODOS.editor.updatePositionsAndControls();
            }
        });

        if (typeof VRODOS.ui.onMouseDown === 'function') {
            canvas3D.addEventListener('mousedown', VRODOS.ui.onMouseDown, false);
        }

        if (typeof VRODOS.ui.onMouseUp === 'function') {
            canvas3D.addEventListener('mouseup', VRODOS.ui.onMouseUp, false);
        }

        if (typeof VRODOS.ui.onMouseDoubleClickFocus === 'function') {
            canvas3D.addEventListener('dblclick', VRODOS.ui.onMouseDoubleClickFocus, false);
        }

        if (typeof VRODOS.ui.contextMenuClick === 'function') {
            canvas3D.addEventListener('contextmenu', VRODOS.ui.contextMenuClick, false);
        }
    }

    function bindCanvasAutosaveEvents(canvas3D) {
        if (typeof VRODOS.api.saveSceneEventHandler === 'function') {
            canvas3D.addEventListener('keypress', VRODOS.api.saveSceneEventHandler, false);
        }

        const scene = VRODOS.editor.envir ? VRODOS.editor.envir.scene : null;
        if (scene && typeof scene.addEventListener === 'function' && typeof VRODOS.api.saveSceneEventHandler === 'function') {
            scene.addEventListener('modificationPendingSave', VRODOS.api.saveSceneEventHandler);
        }
    }

    function bindPropertyPanelContextMenus() {
        [
            'popUpArtifactPropertiesDiv',
            'popUpDoorPropertiesDiv',
            'popUpPoiImageTextPropertiesDiv',
            'popUpSunPropertiesDiv',
            'popUpLampPropertiesDiv',
            'popUpSpotPropertiesDiv',
            'popUpAmbientPropertiesDiv',
            'popUpPoiChatPropertiesDiv'
        ].forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                });
            }
        });
    }

    function bindLightPawnDragStart() {
        if (typeof VRODOS.ui.handleLightPawnDragStart !== 'function') {
            return;
        }

        const lightPawnButtons = document.querySelectorAll('.environmentBar .lightpawnbutton');

        lightPawnButtons.forEach((button) => {
            button.addEventListener('dragstart', VRODOS.ui.handleLightPawnDragStart, false);
        });
    }

    VRODOS.ui.sceneCanvasEvents = canvasEventsUi;
    VRODOS.ui.bindSceneCanvasEventControls = function() {
        return canvasEventsUi.bind();
    };
})();
