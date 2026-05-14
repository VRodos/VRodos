'use strict';

window.VRODOS = window.VRODOS || { editor: {}, ui: {}, utils: {}, api: {}, data: {} };
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.editorScene = VRODOS.editorScene || {};

(function initVrodosSceneSelection() {
    const sceneTools = VRODOS.editorScene || {};
    const sceneRegistry = VRODOS.editor.sceneRegistry;
    const transforms = VRODOS.editor.transforms;

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
            VRODOS.editor.requestRender(reason || 'scene-selection');
        }
    }

    function resolveObject(objectOrId) {
        if (typeof sceneTools.resolveObject === 'function') {
            return sceneTools.resolveObject(objectOrId);
        }
        if (!objectOrId) return null;
        if (typeof objectOrId === 'object') return objectOrId.realObject || objectOrId;

        if (sceneRegistry) {
            return sceneRegistry.getByUuid(objectOrId) || sceneRegistry.getByName(objectOrId);
        }

        const scene = getScene();
        if (!scene) return null;
        return scene.getObjectByProperty('uuid', objectOrId) || scene.getObjectByName(objectOrId);
    }

    const render = VRODOS.editor.render || {
        request(reason) {
            requestRender(reason || 'render-service');
        },

        markDirty(reason) {
            this.request(reason || 'render-dirty');
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

    VRODOS.editor.render = render;
    VRODOS.editor.selection = selection;
})();
