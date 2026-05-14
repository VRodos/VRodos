'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.ui = VRODOS.ui || {};

(function initVrodosSceneCanvasDropUi() {
    const lightPawnCategories = new Set([
        'lightSun',
        'lightLamp',
        'lightSpot',
        'lightAmbient',
        'Pawn'
    ]);

    function readDropPayload(ev) {
        if (!ev.dataTransfer || typeof ev.dataTransfer.getData !== 'function') {
            return null;
        }

        const rawPayload = ev.dataTransfer.getData('text') || ev.dataTransfer.getData('text/plain');
        if (!rawPayload) {
            return null;
        }

        try {
            return JSON.parse(rawPayload);
        } catch (error) {
            console.warn('VRodos: ignored invalid scene canvas drop payload.', error);
            return null;
        }
    }

    function shouldIgnoreSceneReorderDrop(ev) {
        const types = ev.dataTransfer && ev.dataTransfer.types;
        return types && typeof types.indexOf === 'function' && types.indexOf('application/vrodos-scene-reorder') !== -1;
    }

    function resolveAssetBasePath(dataDrag) {
        if (!dataDrag || lightPawnCategories.has(dataDrag.category_name) || !dataDrag.path) {
            return '';
        }

        return dataDrag.path.substring(0, dataDrag.path.lastIndexOf('/') + 1);
    }

    VRODOS.ui.onDrop = function(ev) {
        if (ev.vrodosSceneDropHandled) {
            ev.preventDefault();
            return;
        }
        ev.vrodosSceneDropHandled = true;

        if (shouldIgnoreSceneReorderDrop(ev)) {
            return;
        }

        const dataDrag = readDropPayload(ev);
        if (!dataDrag) {
            ev.preventDefault();
            return;
        }

        const categoryName = dataDrag.category_name;
        const nameModel = dataDrag.title;
        const path = resolveAssetBasePath(dataDrag);
        const translation = VRODOS.api.dragDropVerticalRayCasting(ev);

        VRODOS.editor.suppressNextSelection = true;

        VRODOS.editor.selection.clear({ source: 'canvas-drop', hidePanel: false });
        if (typeof VRODOS.ui.removeAllCelOutlines === 'function') {
            VRODOS.ui.removeAllCelOutlines();
        }
        VRODOS.editor.selected_object_name = null;

        if (typeof VRODOS.api.addAssetToCanvas === 'function') {
            VRODOS.api.addAssetToCanvas(nameModel, path, categoryName, dataDrag, translation, VRODOS.data.pluginPath);
        }

        if (typeof VRODOS.ui.showObjectPropertiesPanel === 'function') {
            VRODOS.ui.showObjectPropertiesPanel(VRODOS.editor.transforms.getMode());
        }

        if (VRODOS.editor.envir.is2d) {
            VRODOS.editor.transforms.setMode('translate');
            document.getElementById('translatePanelGui').style.display = '';
        }

        ev.preventDefault();
    };

    VRODOS.ui.onDragOver = function(ev) {
        ev.preventDefault();
    };

    VRODOS.ui.createLightPawnDragData = function(lightPawnType) {
        if (
            lightPawnType === 'Sun' ||
            lightPawnType === 'Spot' ||
            lightPawnType === 'Lamp' ||
            lightPawnType === 'Ambient'
        ) {
            return {
                category_name: `light${lightPawnType}`,
                title: `mylight${lightPawnType}_${Date.now()}`
            };
        }

        if (lightPawnType === 'Pawn') {
            return {
                category_name: 'Pawn',
                title: `aPawn_${Date.now()}`
            };
        }

        return null;
    };

    VRODOS.ui.handleLightPawnDragStart = function(e) {
        const lightPawnType = e.target && e.target.dataset ? e.target.dataset.lightpawn : '';
        const dragData = VRODOS.ui.createLightPawnDragData(lightPawnType);

        if (!dragData || !e.dataTransfer) {
            return false;
        }

        e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        return false;
    };
})();
