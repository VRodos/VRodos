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

    const CEL_OUTLINE_TAG = '__cel_outline__';
    const CEL_OUTLINE_MATERIAL = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
    });

    function getCelOutlineStore(object, options) {
        if (!object) return null;

        const opts = options || {};
        if (!object._vrodosCelOutlineMeshes && opts.create !== false) {
            Object.defineProperty(object, '_vrodosCelOutlineMeshes', {
                value: new Set(),
                configurable: true
            });
        }

        return object._vrodosCelOutlineMeshes || null;
    }

    function getCelOutlineSourceStore(object) {
        if (!object) return null;

        if (!object._vrodosCelOutlineSourceMeshes) {
            Object.defineProperty(object, '_vrodosCelOutlineSourceMeshes', {
                value: new Set(),
                configurable: true
            });
        }

        return object._vrodosCelOutlineSourceMeshes;
    }

    function isCelOutlineSourceMesh(mesh) {
        return Boolean(mesh && mesh.isMesh && mesh.name !== CEL_OUTLINE_TAG && mesh.parent);
    }

    function getCelOutlineSourceMeshes(object) {
        if (!object || typeof object.traverse !== 'function') return [];

        const sourceStore = getCelOutlineSourceStore(object);
        const cachedSources = Array.from(sourceStore).filter(isCelOutlineSourceMesh);

        if (cachedSources.length > 0) {
            if (cachedSources.length !== sourceStore.size) {
                sourceStore.clear();
                cachedSources.forEach((mesh) => sourceStore.add(mesh));
            }
            return cachedSources;
        }

        object.traverse((child) => {
            if (isCelOutlineSourceMesh(child)) {
                sourceStore.add(child);
            }
        });

        return Array.from(sourceStore);
    }

    function getCelOutlineTracker() {
        const envir = getEnvir();
        return envir ? envir.celOutlineMeshes : null;
    }

    function removeCelOutlineMesh(mesh, owner) {
        if (!mesh) return;

        const outlineTracker = getCelOutlineTracker();
        if (outlineTracker) {
            outlineTracker.delete(mesh);
        }

        const outlineOwner = owner || mesh.vrodosCelOutlineOwner || null;
        const ownerStore = getCelOutlineStore(outlineOwner, { create: false });
        if (ownerStore) {
            ownerStore.delete(mesh);
        }

        if (mesh.parent) {
            mesh.parent.remove(mesh);
        }
        mesh.vrodosCelOutlineOwner = null;
    }

    VRODOS.ui.addCelOutline = function(object) {
        if (!object || typeof object.traverse !== 'function') return;

        VRODOS.ui.removeCelOutline(object);

        const ownerStore = getCelOutlineStore(object);
        const outlineTracker = getCelOutlineTracker();
        const sourceMeshes = getCelOutlineSourceMeshes(object);

        sourceMeshes.forEach((child) => {
            const outline = new THREE.Mesh(child.geometry, CEL_OUTLINE_MATERIAL);
            outline.name = CEL_OUTLINE_TAG;
            outline.scale.setScalar(1.04);
            outline.raycast = () => undefined;
            outline.frustumCulled = false;
            outline.vrodosCelOutlineOwner = object;
            child.add(outline);
            ownerStore.add(outline);
            if (outlineTracker) {
                outlineTracker.add(outline);
            }
        });
    };

    VRODOS.ui.removeCelOutline = function(object) {
        if (!object) return;

        const ownerStore = getCelOutlineStore(object, { create: false });
        const outlines = ownerStore ? Array.from(ownerStore) : [];

        if (outlines.length === 0 && typeof object.traverse === 'function') {
            object.traverse((child) => {
                if (child.name === CEL_OUTLINE_TAG) {
                    outlines.push(child);
                }
            });
        }

        outlines.forEach((mesh) => removeCelOutlineMesh(mesh, object));
    };

    VRODOS.ui.removeAllCelOutlines = function() {
        const outlineTracker = getCelOutlineTracker();
        if (!outlineTracker) return;

        Array.from(outlineTracker).forEach((mesh) => {
            removeCelOutlineMesh(mesh);
        });
        outlineTracker.clear();
    };

    function getObjectTitle(object) {
        const rawTitle = object ? (object.asset_name || object.name || 'Object Controls') : 'Object Controls';
        return VRODOS.utils.displayText(rawTitle);
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

    function setObjectControlsActionsVisible(isVisible) {
        if (typeof VRODOS.ui.setObjectControlsActionsVisible === 'function') {
            VRODOS.ui.setObjectControlsActionsVisible(isVisible);
            return;
        }

        const displayValue = isVisible ? '' : 'none';
        const objManipToggle = document.getElementById('object-manipulation-toggle');
        const axisManipBtns = document.getElementById('axis-manipulation-buttons');
        if (objManipToggle) objManipToggle.style.display = displayValue;
        if (axisManipBtns) axisManipBtns.style.display = displayValue;
    }

    const selection = VRODOS.editor.selection || {
        selected: null,
        lightDirectionalLightSpotMover: null,
        lightSpotLightMover: null,
        lightPointerHandlerDocument: null,

        get() {
            return transforms.getRealObject() || this.selected || null;
        },

        getTransformControlsDocument() {
            const controls = VRODOS.editor.transform_controls;
            return controls && controls.domElement ? controls.domElement.ownerDocument : null;
        },

        unbindLightPointerHandlers() {
            const doc = this.lightPointerHandlerDocument || this.getTransformControlsDocument();
            if (doc && this.lightDirectionalLightSpotMover) {
                doc.removeEventListener('pointermove', this.lightDirectionalLightSpotMover);
            }
            if (doc && this.lightSpotLightMover) {
                doc.removeEventListener('pointermove', this.lightSpotLightMover);
            }

            this.lightDirectionalLightSpotMover = null;
            this.lightSpotLightMover = null;
            this.lightPointerHandlerDocument = null;
        },

        bindLightPointerHandlers(object) {
            this.unbindLightPointerHandlers();

            const doc = this.getTransformControlsDocument();
            if (!doc) return;

            this.lightDirectionalLightSpotMover = () => {
                if (!transforms.isDragging()) return;
                const attached = transforms.getAttachedObject();
                if (!attached || !attached.parentLight) return;
                attached.parentLight.target.position.setFromMatrixPosition(attached.matrix);
                attached.parentLight.target.updateMatrixWorld(true);
                if (typeof VRODOS.utils.syncEditorLightArtifacts === 'function') {
                    VRODOS.utils.syncEditorLightArtifacts(attached.parentLight.target, getScene());
                }
            };

            this.lightSpotLightMover = () => {
                if (!transforms.isDragging()) return;
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
            this.lightPointerHandlerDocument = doc;
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
                setObjectControlsActionsVisible(true);
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
            this.unbindLightPointerHandlers();
            transforms.detach();

            if (typeof VRODOS.ui.removeAllCelOutlines === 'function') {
                VRODOS.ui.removeAllCelOutlines();
            }
            if (opts.hidePanel !== false && typeof VRODOS.ui.hideObjectControlsPanel === 'function') {
                VRODOS.ui.hideObjectControlsPanel();
            }

            setObjectControlsActionsVisible(false);
            render.request(`selection-cleared-${opts.source || 'unknown'}`);
        }
    };

    VRODOS.editor.render = render;
    VRODOS.editor.selection = selection;
})();
