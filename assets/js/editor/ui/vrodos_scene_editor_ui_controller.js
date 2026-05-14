'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.ui = VRODOS.ui || {};

(function initVrodosSceneEditorUiController() {
    const controller = VRODOS.ui.sceneEditorController || {
        isBound: false,
        requiredElementIds: [
            'vr_editor_main_div',
            'save-scene-button',
            'undo-scene-button',
            'redo-scene-button',
            'compileGameBtn'
        ],

        canBind() {
            return this.requiredElementIds.every((id) => Boolean(document.getElementById(id)));
        },

        bind() {
            if (this.isBound) {
                return true;
            }

            if (!this.canBind()) {
                console.warn('VRodos: scene editor UI binding skipped because required DOM nodes are missing.');
                return false;
            }

            if (typeof VRODOS.ui.bindLegacyEditorButtonActions !== 'function') {
                console.warn('VRodos: legacy scene editor UI binder is not available.');
                return false;
            }

            VRODOS.ui.bindLegacyEditorButtonActions();
            this.isBound = true;
            return true;
        }
    };

    VRODOS.ui.sceneEditorController = controller;

    VRODOS.ui.loadButtonActions = function() {
        return controller.bind();
    };
})();

