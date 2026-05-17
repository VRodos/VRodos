'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.api = VRODOS.api || {};
VRODOS.data = VRODOS.data || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};

(function initVrodosSceneCanvasDropUi() {
    const SCENE_REORDER_MIME = 'application/vrodos-scene-reorder';
    const TRANSLATE_PANEL_GUI_ID = 'translatePanelGui';
    const LIGHT_PAWN_SELECTOR = '.lightpawnbutton';

    function getElement(id) {
        return document.getElementById(id);
    }

    function isFunction(value) {
        return typeof value === 'function';
    }

    function shouldIgnoreSceneReorderDrop(ev) {
        const types = ev.dataTransfer && ev.dataTransfer.types;
        return types && typeof types.indexOf === 'function' && types.indexOf(SCENE_REORDER_MIME) !== -1;
    }

    function resolveAssetBasePath(dataDrag) {
        if (!dataDrag || VRODOS.utils.isSceneLightOrPawnCategory(dataDrag.category_name) || !dataDrag.path) {
            return '';
        }

        return VRODOS.utils.assetBasePathFromPath(dataDrag.path);
    }

    function markDropHandled(ev) {
        if (ev.vrodosSceneDropHandled) {
            ev.preventDefault();
            return false;
        }

        ev.vrodosSceneDropHandled = true;
        return true;
    }

    function readSceneDropData(ev) {
        return isFunction(VRODOS.utils.readJsonDataTransfer)
            ? VRODOS.utils.readJsonDataTransfer(ev)
            : null;
    }

    function clearDropSelection() {
        VRODOS.editor.suppressNextSelection = true;

        if (VRODOS.editor.selection && isFunction(VRODOS.editor.selection.clear)) {
            VRODOS.editor.selection.clear({ source: 'canvas-drop', hidePanel: false });
        }
        if (isFunction(VRODOS.ui.removeAllCelOutlines)) {
            VRODOS.ui.removeAllCelOutlines();
        }
        VRODOS.editor.selected_object_name = null;
    }

    function addDroppedAssetToCanvas(dataDrag, translation) {
        if (!isFunction(VRODOS.api.addAssetToCanvas)) {
            return;
        }

        const categoryName = dataDrag.category_name;
        const nameModel = dataDrag.title;
        const path = resolveAssetBasePath(dataDrag);
        VRODOS.api.addAssetToCanvas(nameModel, path, categoryName, dataDrag, translation, VRODOS.data.pluginPath);
    }

    function showDroppedObjectPanel() {
        if (!isFunction(VRODOS.ui.showObjectPropertiesPanel)) {
            return;
        }

        const mode = VRODOS.editor.transforms && isFunction(VRODOS.editor.transforms.getMode)
            ? VRODOS.editor.transforms.getMode()
            : undefined;
        VRODOS.ui.showObjectPropertiesPanel(mode);
    }

    function set2dDropTranslateMode() {
        const envir = VRODOS.editor.envir || null;
        const transforms = VRODOS.editor.transforms || null;
        if (!envir || !envir.is2d || !transforms || !isFunction(transforms.setMode)) {
            return;
        }

        transforms.setMode('translate');
        const translatePanel = getElement(TRANSLATE_PANEL_GUI_ID);
        if (translatePanel) {
            translatePanel.style.display = '';
        }
    }

    function getDropTranslation(ev) {
        return isFunction(VRODOS.api.dragDropVerticalRayCasting)
            ? VRODOS.api.dragDropVerticalRayCasting(ev)
            : [0, 0, 0];
    }

    function getLightPawnType(event) {
        const source = event.currentTarget || event.target;
        const button = source && isFunction(source.closest) ? source.closest(LIGHT_PAWN_SELECTOR) : source;
        return button && button.dataset ? button.dataset.lightpawn || '' : '';
    }

    VRODOS.ui.onDrop = function(ev) {
        if (!markDropHandled(ev)) {
            return;
        }

        if (shouldIgnoreSceneReorderDrop(ev)) {
            return;
        }

        const dataDrag = readSceneDropData(ev);
        if (!dataDrag) {
            ev.preventDefault();
            return;
        }

        const translation = getDropTranslation(ev);
        clearDropSelection();
        addDroppedAssetToCanvas(dataDrag, translation);
        showDroppedObjectPanel();
        set2dDropTranslateMode();

        ev.preventDefault();
    };

    VRODOS.ui.onDragOver = function(ev) {
        ev.preventDefault();
    };

    VRODOS.ui.createLightPawnDragData = function(lightPawnType) {
        return isFunction(VRODOS.utils.createLightPawnDragPayload)
            ? VRODOS.utils.createLightPawnDragPayload(lightPawnType)
            : null;
    };

    VRODOS.ui.handleLightPawnDragStart = function(e) {
        const lightPawnType = getLightPawnType(e);
        const dragData = VRODOS.ui.createLightPawnDragData(lightPawnType);

        if (!dragData || !e.dataTransfer) {
            return false;
        }

        if (isFunction(VRODOS.utils.writeJsonDataTransfer)) {
            VRODOS.utils.writeJsonDataTransfer(e, dragData);
        }
        return false;
    };
})();
