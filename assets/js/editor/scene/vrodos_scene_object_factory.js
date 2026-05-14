'use strict';

window.VRODOS = window.VRODOS || { editor: {}, ui: {}, utils: {}, api: {}, data: {} };
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.editorScene = VRODOS.editorScene || {};

(function initVrodosSceneObjectFactory() {
    const sceneTools = VRODOS.editorScene || {};
    const sceneRegistry = VRODOS.editor.sceneRegistry;
    const selection = VRODOS.editor.selection;

    function getEnvir() {
        return typeof sceneTools.getEnvir === 'function'
            ? sceneTools.getEnvir()
            : (VRODOS.editor.envir || null);
    }

    function requestRender(reason) {
        if (typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender(reason || 'scene-object-factory');
        }
    }

    const render = VRODOS.editor.render || {
        request(reason) {
            requestRender(reason || 'render-service');
        },

        markDirty(reason) {
            this.request(reason || 'render-dirty');
        }
    };

    const objectFactory = VRODOS.editor.objectFactory || {
        addSceneObject(object, options) {
            const opts = Object.assign({
                addToScene: true,
                selectable: Boolean(object && object.isSelectableMesh),
                updateHierarchy: false,
                select: false,
                frame: false,
                autosave: false,
                requestRender: true,
                renderReason: 'object-added'
            }, options || {});

            if (!object) return null;
            if (typeof VRODOS.utils.isEditorInternalObject === 'function' && VRODOS.utils.isEditorInternalObject(object)) {
                return object;
            }

            const existingByUuid = object.uuid ? sceneRegistry.get(object.uuid) : null;
            const existingByName = object.name ? sceneRegistry.get(object.name) : null;
            const existingObject = existingByUuid || existingByName;

            if (existingObject && existingObject !== object) {
                if (object.name && VRODOS.editor.pendingSceneObjectAdds instanceof Map) {
                    VRODOS.editor.pendingSceneObjectAdds.delete(object.name);
                }
                console.warn('VRodos: skipped duplicate scene object registration', object.name || object.uuid);
                return existingObject;
            }

            sceneRegistry.add(object, opts);
            if (object.name && VRODOS.editor.pendingSceneObjectAdds instanceof Map) {
                VRODOS.editor.pendingSceneObjectAdds.delete(object.name);
            }

            const envir = getEnvir();
            if (envir) {
                envir.loadedObjectsCount = Number(envir.loadedObjectsCount || 0) + (opts.incrementLoaded === false ? 0 : 1);
            }

            if (opts.updateHierarchy && typeof VRODOS.ui.addInHierarchyViewer === 'function') {
                VRODOS.ui.addInHierarchyViewer(object);
            }
            if (opts.frame && typeof VRODOS.ui.frameNewSceneObject === 'function') {
                VRODOS.ui.frameNewSceneObject(object);
            }
            if (opts.select) {
                selection.select(object, {
                    source: opts.source || 'object-factory',
                    openPanel: opts.openPanel !== false,
                    showProperties: opts.showProperties !== false,
                    focusHierarchy: opts.focusHierarchy !== false
                });
            }
            if (opts.autosave && typeof VRODOS.api.triggerAutoSave === 'function') {
                VRODOS.api.triggerAutoSave();
            }
            if (opts.requestRender) {
                render.request(opts.renderReason);
            }

            return object;
        },

        removeSceneObject(objectOrId, options) {
            const object = sceneRegistry.remove(objectOrId, options);
            if (object && options && options.removeHierarchy !== false && typeof VRODOS.ui.removeHierarchyEntriesForObject === 'function') {
                VRODOS.ui.removeHierarchyEntriesForObject(object.uuid, object.name);
            }
            render.request((options && options.renderReason) || 'object-removed');
            return object;
        }
    };

    VRODOS.editor.render = render;
    VRODOS.editor.objectFactory = objectFactory;
})();
