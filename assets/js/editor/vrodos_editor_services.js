'use strict';

window.VRODOS = window.VRODOS || { editor: {}, ui: {}, utils: {}, api: {}, data: {} };
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};

(function initVrodosEditorServices() {
    const sceneTools = VRODOS.editorScene || {};

    function getScene() {
        return typeof sceneTools.getScene === 'function'
            ? sceneTools.getScene()
            : (VRODOS.editor.envir ? VRODOS.editor.envir.scene : null);
    }

    function getEnvir() {
        return typeof sceneTools.getEnvir === 'function'
            ? sceneTools.getEnvir()
            : (VRODOS.editor.envir || null);
    }

    function requestRender(reason) {
        if (typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender(reason || 'editor-service');
        }
    }

    function resolveObject(objectOrId) {
        if (typeof sceneTools.resolveObject === 'function') {
            return sceneTools.resolveObject(objectOrId);
        }
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

    const sceneRegistry = VRODOS.editor.sceneRegistry;

    const render = VRODOS.editor.render || {
        request(reason) {
            requestRender(reason || 'render-service');
        },

        markDirty(reason) {
            this.request(reason || 'render-dirty');
        }
    };

    function ensureProxy() {
        if (typeof THREE === 'undefined') return null;
        if (!window.vrodosGizmoProxy) {
            window.vrodosGizmoProxy = new THREE.Object3D();
            window.vrodosGizmoProxy.name = 'vrodosGizmoProxy';
        }
        window.vrodosGizmoProxy.vrodos_internal_helper = true;
        window.vrodosGizmoProxy.isSelectableMesh = false;
        return window.vrodosGizmoProxy;
    }

    function forceControlsVisible() {
        const controls = VRODOS.editor.transform_controls;
        if (!controls) return;

        const helper = VRODOS.editor.transform_controls_helper || controls._root || null;
        controls.enabled = true;

        if (helper) {
            helper.visible = Boolean(controls.object);
            helper.frustumCulled = false;
            helper.renderOrder = Math.max(helper.renderOrder || 0, 10000);
            if (typeof helper.traverse === 'function') {
                helper.traverse((child) => {
                    child.frustumCulled = false;
                    child.renderOrder = Math.max(child.renderOrder || 0, 10000);
                });
            }
            helper.updateMatrixWorld(true);
        }
    }

    const transforms = VRODOS.editor.transforms || {};
    transforms.ensureVisible = forceControlsVisible;
    const dragState = transforms.dragState || {
        oldTRS: null,
        scaleStart: null,
        qProxyStart: new THREE.Quaternion(),
        pProxyStart: new THREE.Vector3(),
        qRealStart: new THREE.Quaternion(),
        pRealStart: new THREE.Vector3()
    };
    transforms.dragState = dragState;

    function cloneTRS(object) {
        return {
            pos: object.position.clone(),
            rot: object.rotation.clone(),
            scale: object.scale.clone()
        };
    }

    function hasTRSChanged(object, oldTRS) {
        if (!object || !oldTRS) return false;

        return object.position.distanceToSquared(oldTRS.pos) > 0.000001 ||
            object.scale.distanceToSquared(oldTRS.scale) > 0.000001 ||
            Math.abs(object.rotation.x - oldTRS.rot.x) > 0.0001 ||
            Math.abs(object.rotation.y - oldTRS.rot.y) > 0.0001 ||
            Math.abs(object.rotation.z - oldTRS.rot.z) > 0.0001;
    }

    transforms.getAttachedObject = function() {
        const controls = VRODOS.editor.transform_controls;
        return controls ? controls.object : null;
    };

    transforms.bindControls = function() {
        const controls = VRODOS.editor.transform_controls;
        if (!controls || controls._vrodosServiceEventsBound) return false;

        controls.addEventListener('change', () => {
            render.request('transform-change');
        });
        controls.addEventListener('dragging-changed', (event) => {
            transforms.handleDraggingChanged(event);
        });
        controls._vrodosServiceEventsBound = true;
        return true;
    };

    transforms.isDragging = function() {
        const controls = VRODOS.editor.transform_controls;
        return Boolean(controls && controls.dragging);
    };

    transforms.setCamera = function(camera) {
        const controls = VRODOS.editor.transform_controls;
        if (!controls || !camera) return false;

        controls.camera = camera;
        return true;
    };

    transforms.getRealObject = function(object) {
        if (object) {
            if (object.name === 'vrodosGizmoProxy' && object.realObject) {
                return object.realObject;
            }
            return object.realObject || object;
        }
        if (VRODOS.editor.currentSelectedRealObject) {
            return VRODOS.editor.currentSelectedRealObject;
        }

        const attached = transforms.getAttachedObject();
        if (attached && attached.name === 'vrodosGizmoProxy' && attached.realObject) {
            return attached.realObject;
        }

        return attached || null;
    };

    transforms.syncProxyToObject = function(object) {
        const target = transforms.getRealObject(object);
        const proxy = ensureProxy();
        if (!target || !proxy || proxy.realObject !== target) return;

        proxy.position.copy(target.position);
        proxy.quaternion.copy(target.quaternion);
        proxy.scale.copy(target.scale);
        proxy.updateMatrix();
        proxy.updateMatrixWorld(true);
        sceneRegistry.invalidateBounds(target);
    };

    transforms.attach = function(object) {
        const controls = VRODOS.editor.transform_controls;
        const scene = getScene();
        let target = transforms.getRealObject(object) || object;
        if (!target || !controls || !scene) return null;
        if (target.name === 'vrodosGizmoProxy' && target.realObject) {
            target = target.realObject;
        }
        if (!target || target.name === 'vrodosGizmoProxy') return null;

        VRODOS.editor.currentSelectedRealObject = target;

        const proxy = ensureProxy();
        if (proxy) {
            if (proxy.parent !== scene) {
                if (proxy.parent) proxy.parent.remove(proxy);
                scene.add(proxy);
            }

            proxy.name = 'vrodosGizmoProxy';
            proxy.realObject = target;
            proxy.vrodos_internal_helper = true;
            proxy.isSelectableMesh = false;
            proxy.category_name = target.category_name;
            proxy.category_slug = target.category_slug;
            proxy.asset_name = target.asset_name;
            proxy.isLight = target.isLight;
            proxy.parentLight = target.parentLight;
            proxy.locked = target.locked;
            proxy.position.copy(target.position);
            proxy.quaternion.copy(target.quaternion);
            proxy.scale.copy(target.scale);
            proxy.updateMatrix();
            proxy.updateMatrixWorld(true);
            controls.attach(proxy);
        } else {
            controls.attach(target);
        }

        forceControlsVisible();
        render.request('gizmo-attached');
        return target;
    };

    transforms.detach = function() {
        VRODOS.editor.currentSelectedRealObject = null;
        const proxy = ensureProxy();
        if (proxy) {
            proxy.realObject = null;
        }
        if (VRODOS.editor.transform_controls) {
            VRODOS.editor.transform_controls.detach();
        }
        forceControlsVisible();
        render.request('gizmo-cleared');
    };

    transforms.syncGui = transforms.syncGui || function(object) {
        if (typeof VRODOS.ui.syncTransformGuiFromObject === 'function') {
            VRODOS.ui.syncTransformGuiFromObject(object || transforms.getRealObject());
        }
    };

    transforms.applyGuiChange = transforms.applyGuiChange || function(opCode, value, options) {
        const target = transforms.getRealObject();
        if (!target) return;

        const parsed = Number(value);
        const safeValue = Number.isFinite(parsed) ? parsed : 0;
        const commit = !options || options.commit !== false;

        switch (opCode) {
            case 'Tx': target.position.x = safeValue; break;
            case 'Ty': target.position.y = safeValue; break;
            case 'Tz': target.position.z = safeValue; break;
            case 'Rx': target.rotation.x = safeValue / 180 * Math.PI; break;
            case 'Ry': target.rotation.y = safeValue / 180 * Math.PI; break;
            case 'Rz': target.rotation.z = safeValue / 180 * Math.PI; break;
            case 'Sx': target.scale.x = safeValue; break;
            case 'Sy': target.scale.y = safeValue; break;
            case 'Sz': target.scale.z = safeValue; break;
            default: return;
        }

        target.updateMatrix();
        target.updateMatrixWorld(true);
        sceneRegistry.invalidateBounds(target);
        transforms.syncProxyToObject(target);
        if (commit && typeof VRODOS.api.triggerAutoSave === 'function') {
            VRODOS.api.triggerAutoSave();
        }
        render.request('transform-gui-change');
    };

    transforms.getMode = function() {
        const controls = VRODOS.editor.transform_controls;
        return controls && typeof controls.getMode === 'function' ? controls.getMode() : 'translate';
    };

    transforms.getAxis = function() {
        const controls = VRODOS.editor.transform_controls;
        return controls ? controls.axis : null;
    };

    transforms.canUseMode = function(mode, object) {
        const target = transforms.getRealObject(object);
        if (!target) return false;

        const category = target.category_name || '';
        if (mode === 'rotate' && (
            category.includes('lightTargetSpot') ||
            category.includes('lightSun') ||
            category.includes('lightLamp') ||
            category.includes('lightSpot')
        )) {
            return false;
        }

        return true;
    };

    transforms.setMode = function(mode, options) {
        const opts = options || {};
        const controls = VRODOS.editor.transform_controls;
        if (!controls || !transforms.canUseMode(mode, opts.object)) return false;

        controls.setMode(mode);
        if (opts.showProperties && typeof VRODOS.ui.showObjectPropertiesPanel === 'function') {
            VRODOS.ui.showObjectPropertiesPanel(mode);
        }
        render.request(`transform-mode-${mode}`);
        return true;
    };

    transforms.setSize = function(size) {
        const controls = VRODOS.editor.transform_controls;
        if (!controls || typeof controls.setSize !== 'function') return false;

        controls.setSize(Math.max(Number(size) || 1, 0.1));
        render.request('transform-size');
        return true;
    };

    transforms.scaleSize = function(multiplier) {
        const controls = VRODOS.editor.transform_controls;
        if (!controls) return false;
        return transforms.setSize((controls.size || 1) * multiplier);
    };

    transforms.setVisible = function(visible) {
        const controls = VRODOS.editor.transform_controls;
        if (!controls) return false;

        const nextVisible = Boolean(visible);
        const helper = VRODOS.editor.transform_controls_helper || controls._root || null;
        controls.visible = nextVisible;
        if (helper) {
            helper.visible = nextVisible && Boolean(controls.object);
            helper.updateMatrixWorld(true);
        }
        render.request(nextVisible ? 'transform-visible' : 'transform-hidden');
        return true;
    };

    transforms.captureDragStart = function() {
        const controls = VRODOS.editor.transform_controls;
        const attachedObject = transforms.getAttachedObject();
        const target = transforms.getRealObject();
        if (!controls || !attachedObject || !target) return null;

        dragState.oldTRS = cloneTRS(target);
        dragState.scaleStart = target.scale.clone();

        if (attachedObject !== target) {
            dragState.qProxyStart.copy(attachedObject.quaternion);
            dragState.pProxyStart.copy(attachedObject.position);
            dragState.qRealStart.copy(target.quaternion);
            dragState.pRealStart.copy(target.position);
        }

        return target;
    };

    transforms.commitDragEnd = function() {
        const controls = VRODOS.editor.transform_controls;
        const target = transforms.getRealObject();
        const oldTRS = dragState.oldTRS;
        if (!controls || !target || !oldTRS) return null;

        const newTRS = cloneTRS(target);
        if (hasTRSChanged(target, oldTRS) &&
            typeof VRODOS.editor.undoManager !== 'undefined' &&
            !VRODOS.editor.undoManager.isExecuting) {
            VRODOS.editor.undoManager.add(new VRODOS.editor.TransformCommand(target, oldTRS, newTRS));
        }

        dragState.oldTRS = null;
        dragState.scaleStart = null;
        sceneRegistry.invalidateBounds(target);
        transforms.syncProxyToObject(target);
        render.request('transform-drag-ended');
        return target;
    };

    transforms.handleDraggingChanged = function(event) {
        const envir = getEnvir();
        if (envir && envir.orbitControls) {
            envir.orbitControls.enabled = !event.value;
        }

        if (event.value) {
            transforms.captureDragStart();
            render.request('transform-drag-started');
        } else {
            transforms.commitDragEnd();
        }
    };

    function getObjectTitle(object) {
        const rawTitle = object ? (object.asset_name || object.name || 'Object Controls') : 'Object Controls';
        return typeof VRODOS.utils.decodeDisplayText === 'function'
            ? VRODOS.utils.decodeDisplayText(rawTitle)
            : rawTitle;
    }

    function configureTransformToolbar(object) {
        const translateSwitch = document.getElementById('translate-switch');
        const rotateSwitch = document.getElementById('rotate-switch');
        const rotateLabel = document.getElementById('rotate-switch-label');
        const scaleSwitch = document.getElementById('scale-switch');
        const scaleLabel = document.getElementById('scale-switch-label');

        if (translateSwitch) translateSwitch.checked = true;
        if (rotateSwitch) rotateSwitch.disabled = false;
        if (rotateLabel) rotateLabel.style = 'inherit';
        if (scaleSwitch) scaleSwitch.disabled = false;
        if (scaleLabel) scaleLabel.style = 'inherit';

        if (object && object.name === 'avatarCamera') {
            if (rotateSwitch) rotateSwitch.disabled = true;
            if (rotateLabel) rotateLabel.style.color = 'grey';
            if (scaleSwitch) scaleSwitch.disabled = true;
            if (scaleLabel) scaleLabel.style.color = 'grey';
        }
    }

    const selection = VRODOS.editor.selection || {
        selected: null,
        lightDirectionalLightSpotMover: null,
        lightSpotLightMover: null,

        get() {
            return transforms.getRealObject() || this.selected || null;
        },

        bindLightPointerHandlers(object) {
            const controls = VRODOS.editor.transform_controls;
            if (!controls || !controls.domElement || !controls.domElement.ownerDocument) return;

            const doc = controls.domElement.ownerDocument;
            if (this.lightDirectionalLightSpotMover) {
                doc.removeEventListener('pointermove', this.lightDirectionalLightSpotMover);
            }
            if (this.lightSpotLightMover) {
                doc.removeEventListener('pointermove', this.lightSpotLightMover);
            }

            this.lightDirectionalLightSpotMover = () => {
                const attached = transforms.getAttachedObject();
                if (!attached || !attached.parentLight) return;
                attached.parentLight.target.position.setFromMatrixPosition(attached.matrix);
                attached.parentLight.target.updateMatrixWorld();
            };

            this.lightSpotLightMover = () => {
                const realObject = transforms.getRealObject();
                if (!realObject || !realObject.parentLight) return;
                VRODOS.utils.updateEditorLightHelper(realObject, getScene());
            };

            const category = object ? object.category_name : '';
            if (category === 'lightTargetSpot') {
                doc.addEventListener('pointermove', this.lightDirectionalLightSpotMover);
            }
            if (category === 'lightSpot') {
                doc.addEventListener('pointermove', this.lightSpotLightMover);
            }
        },

        select(object, options) {
            const opts = Object.assign({
                source: 'unknown',
                openPanel: true,
                showProperties: true,
                focusHierarchy: true,
                outline: true,
                syncGui: true,
                setMode: true
            }, options || {});

            const target = resolveObject(object);
            if (!target || target.locked) return null;

            this.selected = target;
            VRODOS.editor.selected_object_name = target.name;
            sceneRegistry.add(target, { addToScene: false, selectable: true, reason: `selection-${opts.source}` });

            if (opts.openPanel && typeof VRODOS.ui.showObjectControlsPanel === 'function') {
                VRODOS.ui.showObjectControlsPanel(getObjectTitle(target));
                const objManipToggle = document.getElementById('object-manipulation-toggle');
                const axisManipBtns = document.getElementById('axis-manipulation-buttons');
                if (objManipToggle) objManipToggle.style.display = '';
                if (axisManipBtns) axisManipBtns.style.display = '';
            }

            configureTransformToolbar(target);

            if (opts.focusHierarchy && typeof VRODOS.ui.setBackgroundColorHierarchyViewer === 'function') {
                VRODOS.ui.setBackgroundColorHierarchyViewer(target.uuid);
            }

            transforms.attach(target);

            if (target.name !== 'avatarCamera' && VRODOS.ui.transform && typeof VRODOS.ui.transform.setSize === 'function') {
                VRODOS.ui.transform.setSize();
            }

            if (opts.setMode) {
                transforms.setMode('translate');
                if (!getEnvir() || !getEnvir().is2d) {
                    const modeSwitch = document.getElementById(`${transforms.getMode()}-switch`);
                    if (modeSwitch) modeSwitch.click();
                }
            }

            this.bindLightPointerHandlers(target);

            if (opts.outline && typeof VRODOS.ui.removeAllCelOutlines === 'function') {
                VRODOS.ui.removeAllCelOutlines();
            }
            if (opts.outline && typeof VRODOS.ui.addCelOutline === 'function') {
                VRODOS.ui.addCelOutline(target);
            }

            if (opts.syncGui) {
                transforms.syncGui(target);
            }

            if (opts.showProperties && typeof VRODOS.ui.showPropertiesInPanel === 'function') {
                VRODOS.ui.showPropertiesInPanel(target);
            }

            render.request(`selection-${opts.source}`);
            return target;
        },

        clear(options) {
            const opts = options || {};
            this.selected = null;
            VRODOS.editor.selected_object_name = null;
            transforms.detach();

            if (typeof VRODOS.ui.removeAllCelOutlines === 'function') {
                VRODOS.ui.removeAllCelOutlines();
            }
            if (opts.hidePanel !== false && typeof VRODOS.ui.hideObjectControlsPanel === 'function') {
                VRODOS.ui.hideObjectControlsPanel();
            }

            const objManipToggle = document.getElementById('object-manipulation-toggle');
            const axisManipBtns = document.getElementById('axis-manipulation-buttons');
            if (objManipToggle) objManipToggle.style.display = 'none';
            if (axisManipBtns) axisManipBtns.style.display = 'none';
            render.request(`selection-cleared-${opts.source || 'unknown'}`);
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

    VRODOS.editor.sceneRegistry = sceneRegistry;
    VRODOS.editor.render = render;
    VRODOS.editor.transforms = transforms;
    VRODOS.editor.selection = selection;
    VRODOS.editor.objectFactory = objectFactory;
})();
