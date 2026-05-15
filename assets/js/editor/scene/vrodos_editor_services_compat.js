'use strict';

window.VRODOS = window.VRODOS || { editor: {}, ui: {}, utils: {}, api: {}, data: {} };
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};

(function initVrodosEditorServicesCompatibility() {
    function requestRender(reason) {
        if (typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender(reason || 'editor-service');
        }
    }

    VRODOS.editor.render = VRODOS.editor.render || {
        request(reason) {
            requestRender(reason || 'render-service');
        },

        markDirty(reason) {
            this.request(reason || 'render-dirty');
        }
    };

    VRODOS.editor.sceneRegistry = VRODOS.editor.sceneRegistry || null;
    VRODOS.editor.transforms = VRODOS.editor.transforms || {};
    VRODOS.editor.selection = VRODOS.editor.selection || null;
    VRODOS.editor.objectFactory = VRODOS.editor.objectFactory || null;
})();
