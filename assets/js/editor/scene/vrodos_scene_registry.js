'use strict';

window.VRODOS = window.VRODOS || { editor: {}, ui: {}, utils: {}, api: {}, data: {} };
VRODOS.editor = VRODOS.editor || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.editorScene = VRODOS.editorScene || {};

(function initVrodosSceneRegistry() {
    function getScene() {
        return VRODOS.editor.envir ? VRODOS.editor.envir.scene : null;
    }

    function getEnvir() {
        return VRODOS.editor.envir || null;
    }

    function requestRender(reason) {
        if (typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender(reason || 'scene-registry');
        }
    }

    function isTopLevelSceneObject(object, scene) {
        return Boolean(object) && Boolean(scene) && object.parent === scene;
    }

    function shouldRegisterSelectable(object, options) {
        if (!object) return false;
        if (options && options.selectable === false) return false;
        return Boolean((options && options.selectable) || object.isSelectableMesh);
    }

    function resolveObject(objectOrId) {
        if (!objectOrId) return null;
        if (typeof objectOrId === 'object') return objectOrId.realObject || objectOrId;

        const registry = VRODOS.editor.sceneRegistry;
        if (registry) {
            return registry.getByUuid(objectOrId) || registry.getByName(objectOrId);
        }

        const scene = getScene();
        if (!scene) return null;
        return scene.getObjectByProperty('uuid', objectOrId) || scene.getObjectByName(objectOrId);
    }

    const sceneRegistry = VRODOS.editor.sceneRegistry || {
        byUuid: new Map(),
        byName: new Map(),
        selectableRoots: new Set(),
        boundsCache: new WeakMap(),
        dirtyReason: null,

        clear() {
            this.byUuid.clear();
            this.byName.clear();
            this.selectableRoots.clear();
            this.boundsCache = new WeakMap();
            this.markDirty('registry-cleared');
        },

        add(object, metadata) {
            const options = metadata || {};
            const scene = getScene();
            if (!object) return null;

            if (options.addToScene !== false && scene && !object.parent) {
                scene.add(object);
            }

            if (object.uuid) {
                this.byUuid.set(object.uuid, object);
            }
            if (object.name) {
                this.byName.set(object.name, object);
            }

            if (shouldRegisterSelectable(object, options)) {
                this.selectableRoots.add(object);
                const envir = getEnvir();
                if (envir && envir.selectableMeshes) {
                    envir.selectableMeshes.add(object);
                    envir.selectableMeshesDirty = true;
                }
            }

            this.invalidateBounds(object);
            this.markDirty(options.reason || 'object-added');
            return object;
        },

        remove(objectOrId, options) {
            const object = resolveObject(objectOrId);
            const removeOptions = options || {};
            if (!object) return null;

            if (object.uuid) {
                this.byUuid.delete(object.uuid);
            }
            if (object.name) {
                this.byName.delete(object.name);
            }
            this.selectableRoots.delete(object);

            const envir = getEnvir();
            if (envir && envir.selectableMeshes) {
                envir.selectableMeshes.delete(object);
                envir.selectableMeshesDirty = true;
            }

            this.invalidateBounds(object);
            if (removeOptions.removeFromScene !== false && object.parent) {
                object.parent.remove(object);
            }
            this.markDirty(removeOptions.reason || 'object-removed');
            return object;
        },

        rebuild(sceneArg) {
            const scene = sceneArg || getScene();
            this.byUuid.clear();
            this.byName.clear();
            this.selectableRoots.clear();

            const envir = getEnvir();
            if (envir && envir.selectableMeshes) {
                envir.selectableMeshes.clear();
            }

            if (scene && typeof scene.traverse === 'function') {
                scene.traverse((object) => {
                    if (!object || object.name === 'vrodosGizmoProxy') return;
                    if (object.vrodos_internal_helper === true && object.name !== 'Camera3Dmodel') return;
                    const isDirectorVisual = object.name === 'Camera3Dmodel' || (object.parent && object.parent.name === 'avatarCamera' && object.isSelectableMesh);
                    if (object.name !== 'avatarCamera' && !isDirectorVisual && !isTopLevelSceneObject(object, scene)) return;
                    if (!object.isSelectableMesh && object.name !== 'avatarCamera') return;
                    this.add(object, { addToScene: false, selectable: true, reason: 'registry-rebuild' });
                });
            }

            if (envir && envir.selectableMeshes) {
                envir.selectableMeshesArray = Array.from(envir.selectableMeshes);
                envir.selectableMeshesDirty = false;
            }

            this.markDirty('registry-rebuilt');
            return this;
        },

        getByUuid(uuid) {
            if (!uuid) return null;
            if (this.byUuid.has(uuid)) return this.byUuid.get(uuid);
            const scene = getScene();
            const object = scene ? scene.getObjectByProperty('uuid', uuid) : null;
            if (object) this.add(object, { addToScene: false, selectable: Boolean(object.isSelectableMesh), reason: 'uuid-cache-fill' });
            return object;
        },

        getByName(name) {
            if (!name) return null;
            if (this.byName.has(name)) return this.byName.get(name);
            const scene = getScene();
            const object = scene ? scene.getObjectByName(name) : null;
            if (object) this.add(object, { addToScene: false, selectable: Boolean(object.isSelectableMesh), reason: 'name-cache-fill' });
            return object;
        },

        get(objectOrId) {
            return resolveObject(objectOrId);
        },

        getSelectableRoots() {
            const envir = getEnvir();
            if (this.selectableRoots.size > 0) {
                const roots = Array.from(this.selectableRoots);
                return typeof VRODOS.utils.dedupeEditorSceneRoots === 'function'
                    ? VRODOS.utils.dedupeEditorSceneRoots(roots, { reason: 'registry-selectable-roots', log: false })
                    : roots;
            }

            if (envir && envir.selectableMeshes && envir.selectableMeshes.size > 0) {
                const roots = typeof VRODOS.utils.dedupeEditorSceneRoots === 'function'
                    ? VRODOS.utils.dedupeEditorSceneRoots(Array.from(envir.selectableMeshes), { reason: 'environment-selectable-roots', log: false })
                    : Array.from(envir.selectableMeshes);
                this.selectableRoots = new Set(roots);
                return roots;
            }

            this.rebuild();
            const roots = Array.from(this.selectableRoots);
            return typeof VRODOS.utils.dedupeEditorSceneRoots === 'function'
                ? VRODOS.utils.dedupeEditorSceneRoots(roots, { reason: 'rebuilt-selectable-roots', log: false })
                : roots;
        },

        markDirty(reason) {
            this.dirtyReason = reason || 'dirty';
            const envir = getEnvir();
            if (envir) {
                envir.selectableMeshesDirty = true;
            }
        },

        invalidateBounds(object) {
            if (object && this.boundsCache) {
                this.boundsCache.delete(object);
            }
        },

        getBounds(object) {
            const target = resolveObject(object);
            if (!target) return null;
            if (this.boundsCache.has(target)) return this.boundsCache.get(target);
            if (typeof THREE === 'undefined') return null;

            target.updateWorldMatrix(true, true);
            const bounds = new THREE.Box3().setFromObject(target);
            this.boundsCache.set(target, bounds);
            return bounds;
        }
    };

    Object.assign(VRODOS.editorScene, {
        getScene,
        getEnvir,
        requestRender,
        isTopLevelSceneObject,
        shouldRegisterSelectable,
        resolveObject
    });

    VRODOS.editor.sceneRegistry = sceneRegistry;
})();
