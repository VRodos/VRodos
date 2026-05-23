'use strict';

window.VRODOS = window.VRODOS || { editor: {}, ui: {}, utils: {}, api: {}, data: {} };
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.editorScene = VRODOS.editorScene || {};

(function initVrodosSceneTransforms() {
    const sceneTools = VRODOS.editorScene || {};
    const sceneRegistry = VRODOS.editor.sceneRegistry;

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
            VRODOS.editor.requestRender(reason || 'scene-transforms');
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

    function invalidateBounds(object) {
        if (sceneRegistry && typeof sceneRegistry.invalidateBounds === 'function') {
            sceneRegistry.invalidateBounds(object);
        }
    }

    function syncLightArtifacts(object) {
        if (typeof VRODOS.utils.syncEditorLightArtifacts === 'function') {
            VRODOS.utils.syncEditorLightArtifacts(object, getScene());
        }
    }

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

    function getTransformHelper(controls) {
        return VRODOS.editor.transform_controls_helper || (controls ? controls._root : null) || null;
    }

    function prepareHelperNode(node) {
        if (!node) return;

        node.frustumCulled = false;
        node.renderOrder = Math.max(node.renderOrder || 0, 10000);
    }

    const transforms = VRODOS.editor.transforms || {};

    transforms.prepareHelper = function(helper) {
        if (!helper) return null;

        const helperNodes = [];
        prepareHelperNode(helper);
        helper.vrodos_internal_helper = true;

        if (typeof helper.traverse === 'function') {
            helper.traverse((child) => {
                if (child === helper) {
                    return;
                }
                prepareHelperNode(child);
                helperNodes.push(child);
            });
        }

        helper._vrodosTransformHelperNodes = helperNodes;
        helper._vrodosTransformHelperPrepared = true;
        return helper;
    };

    function forceControlsVisible() {
        const controls = VRODOS.editor.transform_controls;
        if (!controls) return;

        const helper = getTransformHelper(controls);
        if (controls.object && transforms.isLockedObject(controls.object)) {
            transforms.detach();
            return;
        }

        controls.enabled = true;

        if (helper) {
            if (!helper._vrodosTransformHelperPrepared) {
                transforms.prepareHelper(helper);
            }
            helper.visible = Boolean(controls.object);
            helper.updateMatrixWorld(true);
        }
    }

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

    transforms.isLockedObject = function(object) {
        const target = transforms.getRealObject(object);
        return typeof VRODOS.utils.isEditorObjectLocked === 'function'
            ? VRODOS.utils.isEditorObjectLocked(target)
            : Boolean(target && target.locked);
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
        invalidateBounds(target);
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
        if (transforms.isLockedObject(target)) {
            transforms.detach();
            return null;
        }

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
            proxy.locked = transforms.isLockedObject(target);
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
        if (transforms.isLockedObject(target)) return;

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
        invalidateBounds(target);
        syncLightArtifacts(target);
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
        if (transforms.isLockedObject(target)) return false;

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

        const nextSize = Math.max(Number(size) || 1, 0.1);
        if (Math.abs(Number(controls.size || 1) - nextSize) < 0.0001) {
            return true;
        }

        controls.setSize(nextSize);
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
        if (transforms.isLockedObject(target)) {
            transforms.detach();
            return null;
        }

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
        if (transforms.isLockedObject(target)) {
            dragState.oldTRS = null;
            dragState.scaleStart = null;
            transforms.syncProxyToObject(target);
            render.request('locked-transform-drag-ended');
            return target;
        }

        const newTRS = cloneTRS(target);
        if (hasTRSChanged(target, oldTRS) &&
            typeof VRODOS.editor.undoManager !== 'undefined' &&
            !VRODOS.editor.undoManager.isExecuting) {
            VRODOS.editor.undoManager.add(new VRODOS.editor.TransformCommand(target, oldTRS, newTRS));
        }

        dragState.oldTRS = null;
        dragState.scaleStart = null;
        invalidateBounds(target);
        syncLightArtifacts(target);
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
            if (transforms.isLockedObject()) {
                if (envir && envir.orbitControls) {
                    envir.orbitControls.enabled = true;
                }
                transforms.detach();
                render.request('locked-transform-blocked');
                return;
            }
            transforms.captureDragStart();
            render.request('transform-drag-started');
        } else {
            transforms.commitDragEnd();
        }
    };

    VRODOS.editor.render = render;
    VRODOS.editor.transforms = transforms;
})();
