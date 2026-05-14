'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.ui = VRODOS.ui || {};

(function initVrodosSceneEditorUiController() {
    const subsystemBinders = [
        'bindCompileDialogControls',
        'bindEditorShellControls',
        'bindSceneListControls',
        'bindSceneSnapshotControls',
        'bindImmerseSceneInfoControls',
        'bindEditorToolbarControls',
        'bindSceneCanvasEventControls'
    ];

    function bindSceneEditorSubsystems() {
        let didBindAll = true;

        subsystemBinders.forEach((binderName) => {
            if (typeof VRODOS.ui[binderName] !== 'function') {
                console.warn(`VRodos: scene editor UI binder ${binderName} is not available.`);
                didBindAll = false;
                return;
            }

            if (VRODOS.ui[binderName]() === false) {
                didBindAll = false;
            }
        });

        return didBindAll;
    }

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

            bindSceneEditorSubsystems();
            this.isBound = true;
            return true;
        }
    };

    VRODOS.ui.sceneEditorController = controller;
    VRODOS.ui.bindSceneEditorSubsystems = bindSceneEditorSubsystems;

    VRODOS.ui.loadButtonActions = function() {
        return controller.bind();
    };
})();
