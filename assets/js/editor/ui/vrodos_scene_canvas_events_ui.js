'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.api = VRODOS.api || {};

(function initVrodosSceneCanvasEventsUi() {
    const CANVAS_EVENTS_IDS = {
        editorMain: 'vr_editor_main_div'
    };
    const PROPERTY_PANEL_IDS = [
        'popUpArtifactPropertiesDiv',
        'popUpDoorPropertiesDiv',
        'popUpPoiImageTextPropertiesDiv',
        'popUpSunPropertiesDiv',
        'popUpLampPropertiesDiv',
        'popUpSpotPropertiesDiv',
        'popUpAmbientPropertiesDiv',
        'popUpPoiChatPropertiesDiv'
    ];
    const LIGHT_PAWN_BUTTON_SELECTOR = '.environmentBar .lightpawnbutton';

    const canvasEventsUi = VRODOS.ui.sceneCanvasEvents || {
        isBound: false,

        bind() {
            if (this.isBound) {
                return true;
            }

            const elements = getCanvasElements();

            if (!elements.mainDiv || !elements.canvas) {
                console.warn('VRodos: scene canvas event binding skipped because canvas DOM is missing.');
                return false;
            }

            bindEditorDropTargets(elements.mainDiv);
            bindCanvasPointerEvents(elements.canvas);
            bindCanvasAutosaveEvents(elements.canvas);
            bindPropertyPanelContextMenus();
            bindLightPawnDragStart();

            this.isBound = true;
            return true;
        }
    };

    function getElement(id) {
        return document.getElementById(id);
    }

    function queryElements(selector) {
        return Array.from(document.querySelectorAll(selector));
    }

    function isFunction(value) {
        return typeof value === 'function';
    }

    function getCanvasElements() {
        const mainDiv = getElement(CANVAS_EVENTS_IDS.editorMain);
        return {
            mainDiv,
            canvas: mainDiv ? mainDiv.querySelector('canvas') : null
        };
    }

    function bindEventIfAvailable(element, eventName, handler, options) {
        if (element && isFunction(handler)) {
            element.addEventListener(eventName, handler, options);
        }
    }

    function bindEditorDropTargets(mainDiv) {
        if (isFunction(VRODOS.ui.onDrop)) {
            mainDiv.ondrop = VRODOS.ui.onDrop;
        }

        if (isFunction(VRODOS.ui.onDragOver)) {
            mainDiv.ondragover = VRODOS.ui.onDragOver;
        }
    }

    function bindCanvasPointerEvents(canvas3D) {
        canvas3D.addEventListener('mousemove', () => {
            if (isFunction(VRODOS.editor.updatePositionsAndControls)) {
                VRODOS.editor.updatePositionsAndControls();
            }
        });

        bindEventIfAvailable(canvas3D, 'mousedown', VRODOS.ui.onMouseDown, false);
        bindEventIfAvailable(canvas3D, 'mouseup', VRODOS.ui.onMouseUp, false);
        bindEventIfAvailable(canvas3D, 'dblclick', VRODOS.ui.onMouseDoubleClickFocus, false);
        bindEventIfAvailable(canvas3D, 'contextmenu', VRODOS.ui.contextMenuClick, false);
    }

    function bindCanvasAutosaveEvents(canvas3D) {
        if (isFunction(VRODOS.api.saveSceneEventHandler)) {
            canvas3D.addEventListener('keypress', VRODOS.api.saveSceneEventHandler, false);
        }

        const scene = VRODOS.editor.envir ? VRODOS.editor.envir.scene : null;
        if (scene && isFunction(scene.addEventListener) && isFunction(VRODOS.api.saveSceneEventHandler)) {
            scene.addEventListener('modificationPendingSave', VRODOS.api.saveSceneEventHandler);
        }
    }

    function bindPropertyPanelContextMenus() {
        PROPERTY_PANEL_IDS.forEach((id) => {
            const element = getElement(id);
            bindEventIfAvailable(element, 'contextmenu', (event) => {
                event.preventDefault();
            });
        });
    }

    function bindLightPawnDragStart() {
        if (!isFunction(VRODOS.ui.handleLightPawnDragStart)) {
            return;
        }

        queryElements(LIGHT_PAWN_BUTTON_SELECTOR).forEach((button) => {
            button.addEventListener('dragstart', VRODOS.ui.handleLightPawnDragStart, false);
        });
    }

    VRODOS.ui.sceneCanvasEvents = canvasEventsUi;
    VRODOS.ui.bindSceneCanvasEventControls = function() {
        return canvasEventsUi.bind();
    };
})();
