'use strict';

/**
 * VRodos Undo Engine
 * Implements a Command Pattern for internal scene editor undo/redo.
 */

function vrodosUndoGetObjectByUuid(uuid) {
    if (!uuid) return null;
    return VRODOS.editor.sceneRegistry ? VRODOS.editor.sceneRegistry.get(uuid) : null;
}

function vrodosUndoGetObjectByName(name) {
    if (!name) return null;
    return VRODOS.editor.sceneRegistry ? VRODOS.editor.sceneRegistry.get(name) : null;
}

function vrodosUndoRunWithoutCapture(callback) {
    if (typeof callback !== 'function') return;

    const wasExecuting = VRODOS.editor.undoManager.isExecuting;
    VRODOS.editor.undoManager.isExecuting = true;
    try {
        callback();
    } finally {
        VRODOS.editor.undoManager.isExecuting = wasExecuting;
    }
}

function vrodosUndoIsLocked(objectOrValue) {
    return typeof VRODOS.utils.isEditorObjectLocked === 'function'
        ? VRODOS.utils.isEditorObjectLocked(objectOrValue)
        : Boolean(objectOrValue && objectOrValue.locked);
}

function vrodosUndoFindObjectRecord(object) {
    return object && typeof VRODOS.utils.sceneFindObjectRecord === 'function'
        ? VRODOS.utils.sceneFindObjectRecord(object.uuid, object)
        : null;
}

function vrodosUndoSetLocked(object, locked) {
    if (!object) {
        return false;
    }

    const nextLocked = typeof VRODOS.utils.setEditorObjectLocked === 'function'
        ? VRODOS.utils.setEditorObjectLocked(object, locked)
        : Boolean(object.locked = Boolean(locked));
    const record = vrodosUndoFindObjectRecord(object);
    if (record && record.value && typeof record.value === 'object') {
        record.value.locked = nextLocked;
    }
    return nextLocked;
}

function vrodosUndoReconcileLockState(object) {
    if (!object) {
        return false;
    }

    const isLocked = vrodosUndoSetLocked(object, vrodosUndoIsLocked(object));

    if (typeof VRODOS.ui.updateHierarchyLockIcon === 'function') {
        VRODOS.ui.updateHierarchyLockIcon(object);
    }

    if (!isLocked) {
        return false;
    }

    const transforms = VRODOS.editor.transforms;
    const selectedObject = VRODOS.editor.selection && typeof VRODOS.editor.selection.get === 'function'
        ? VRODOS.editor.selection.get()
        : null;
    const transformObject = transforms && typeof transforms.getRealObject === 'function'
        ? transforms.getRealObject()
        : null;

    if ((selectedObject === object || transformObject === object) &&
        VRODOS.editor.selection && typeof VRODOS.editor.selection.clear === 'function') {
        VRODOS.editor.selection.clear({ source: 'undo-lock-reconcile' });
    } else if (transformObject === object && transforms && typeof transforms.detach === 'function') {
        transforms.detach();
    }

    if (typeof VRODOS.ui.removeCelOutline === 'function') {
        VRODOS.ui.removeCelOutline(object);
    }
    if (typeof VRODOS.ui.hideObjectControlsPanel === 'function') {
        VRODOS.ui.hideObjectControlsPanel();
    }

    return true;
}

function vrodosUndoApplyRecordLockState(object, objectData) {
    if (!objectData || typeof objectData !== 'object' ||
        !Object.prototype.hasOwnProperty.call(objectData, 'locked')) {
        return;
    }

    vrodosUndoSetLocked(object, objectData.locked);
}

VRODOS.editor.UndoManager = class {
    constructor(maxSize = 50) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = maxSize;
        this.isExecuting = false;
    }

    add(command) {
        if (this.isExecuting) return;
        
        this.undoStack.push(command);
        this.redoStack = []; // Clear redo on new action
        
        if (this.undoStack.length > this.maxSize) {
            const discarded = this.undoStack.shift();
            if ( discarded && typeof discarded.dispose === 'function') {
                discarded.dispose();
            }
        }
        
        this.updateButtons();
    }

    undo() {
        if (this.undoStack.length === 0 || this.isExecuting) return;
        
        const command = this.undoStack.pop();
        this.isExecuting = true;
        
        try {
            command.undo();
            this.redoStack.push(command);
        } catch (e) {
            console.error("Undo failed:", e);
        } finally {
            this.isExecuting = false;
        }
        
        this.updateButtons();
    }

    redo() {
        if (this.redoStack.length === 0 || this.isExecuting) return;
        
        const command = this.redoStack.pop();
        this.isExecuting = true;
        
        try {
            if (typeof command.redo === 'function') {
                command.redo();
            } else {
                command.execute();
            }
            this.undoStack.push(command);
        } catch (e) {
            console.error("Redo failed:", e);
        } finally {
            this.isExecuting = false;
        }
        
        this.updateButtons();
    }

    updateButtons() {
        const undoBtn = document.getElementById('undo-scene-button');
        const redoBtn = document.getElementById('redo-scene-button');
        
        if (undoBtn) {
            const isUndoDisabled = this.undoStack.length === 0;
            undoBtn.classList.toggle('LinkDisabled', isUndoDisabled);
            undoBtn.style.opacity = isUndoDisabled ? '0.3' : '1';
            undoBtn.style.pointerEvents = isUndoDisabled ? 'none' : 'auto';
            undoBtn.style.visibility = 'visible'; // Always visible as per user's last request
        }
        if (redoBtn) {
            const isRedoDisabled = this.redoStack.length === 0;
            redoBtn.classList.toggle('LinkDisabled', isRedoDisabled);
            redoBtn.style.opacity = isRedoDisabled ? '0.3' : '1';
            redoBtn.style.pointerEvents = isRedoDisabled ? 'none' : 'auto';
            redoBtn.style.visibility = 'visible'; // Always visible as per user's last request
        }
    }
};
/**
 * Command for Object Transformations (Position, Rotation, Scale)
 */
VRODOS.editor.TransformCommand = class {
    constructor(object, oldTRS, newTRS) {
        // If the object is a proxy, store the real object's UUID and Name
        let target = object;
        if (target.name === "vrodosGizmoProxy" && target.realObject) {
            target = target.realObject;
        } else if (target.realObject) {
             target = target.realObject;
        }

        this.objectUuid = target.uuid;
        this.objectName = target.name;
        this.oldTRS = JSON.parse(JSON.stringify(oldTRS)); // {pos, rot, scale}
        this.newTRS = JSON.parse(JSON.stringify(newTRS));
    }

    execute() {
        this.applyState(this.newTRS);
    }

    undo() {
        this.applyState(this.oldTRS);
    }

    redo() {
        this.applyState(this.newTRS);
    }

    applyState(state) {
        if (!state || !state.pos || !state.rot || !state.scale) return;

        let obj = vrodosUndoGetObjectByUuid(this.objectUuid);
        
        // Fallback to find by Name (Asset names are unique in VRodos)
        if (!obj || obj.name === "vrodosGizmoProxy") {
            obj = vrodosUndoGetObjectByName(this.objectName);
        }

        if (!obj || obj.name === "vrodosGizmoProxy") {
            console.warn("VrodosUndo: Target object not found or resolved to proxy!", this.objectName);
            return;
        }

        // Safety: Prevent moving to NaN or infinite positions which causes vanishing
        if (!state.pos || !isFinite(state.pos.x) || !isFinite(state.pos.y) || !isFinite(state.pos.z)) {
            console.error("VrodosUndo: Target position is invalid. Aborting undo/redo.", state.pos);
            return;
        }

        // Apply TRS with NaN / Finite safety
        if (state.pos && isFinite(state.pos.x)) obj.position.set(state.pos.x, state.pos.y, state.pos.z);
        if (state.rot && isFinite(state.rot.x)) {
            // Euler.set(x,y,z,order) is standard. JSON strings are parsed to plain objects.
            obj.rotation.set(state.rot.x, state.rot.y, state.rot.z, state.rot.order || 'XYZ');
        }
        if (state.scale && isFinite(state.scale.x) && state.scale.x !== 0) {
            obj.scale.set(state.scale.x, state.scale.y, state.scale.z);
        }

        // Force deep matrix and visibility update after restoring serialized state.
        obj.updateMatrix();
        obj.updateMatrixWorld(true);
        if (typeof VRODOS.utils.setObjectTreeVisible === 'function') {
            VRODOS.utils.setObjectTreeVisible(obj, true);
        } else {
            obj.visible = true;
        }
        VRODOS.editor.sceneRegistry.invalidateBounds(obj);
        VRODOS.editor.transforms.syncProxyToObject(obj);

        if (obj.category_name && obj.category_name.includes("light")) {
            VRODOS.utils.updateEditorLightHelper(obj, VRODOS.editor.envir.scene);
        }

        const isLocked = vrodosUndoReconcileLockState(obj);

        // Restore one selection owner for the gizmo, hierarchy and property panel.
        if (!isLocked) {
            VRODOS.editor.selection.select(obj, { source: 'transform-undo-redo', setMode: false });
        }
        
        if (typeof VRODOS.editor.animate === 'function') VRODOS.editor.animate();
        if (typeof VRODOS.api.triggerAutoSave === 'function') VRODOS.api.triggerAutoSave();
    }
};
/**
 * Command for Adding an Object
 */
VRODOS.editor.AddObjectCommand = class {
    constructor(nameModel, objectData) {
        this.nameModel = nameModel;
        this.objectData = JSON.parse(JSON.stringify(objectData));
    }

    execute() {
        // Redo functionality
        if (typeof VRODOS.api.addAssetToCanvas === 'function') {
            const data = this.objectData;
            VRODOS.api.addAssetToCanvas(this.nameModel, data.path, data.category_name, data, data.trs.translation, VRODOS.data.pluginPath);
        }
    }

    undo() {
        if (typeof VRODOS.api.deleteAssetFromScene === 'function') {
            const obj = vrodosUndoGetObjectByName(this.nameModel);
            if (obj) {
                vrodosUndoRunWithoutCapture(() => {
                    VRODOS.api.deleteAssetFromScene(obj.uuid);
                });
            }
        }
    }
};
/**
 * Command for Deleting an Object
 */
VRODOS.editor.DeleteObjectCommand = class {
    constructor(nameModel, objectData, object3D) {
        this.nameModel = nameModel;
        this.objectData = JSON.parse(JSON.stringify(objectData));
        this.object3D = object3D; // Keep reference to 3D object for instant restoration
    }

    execute() {
        if (typeof VRODOS.api.deleteAssetFromScene === 'function') {
            vrodosUndoRunWithoutCapture(() => {
                // Redo a delete: we can allow disposal since it's going into the redo stack (or out)
                VRODOS.api.deleteAssetFromScene(this.object3D.uuid, false);
            });
        }
    }

    dispose() {
        // Ultimate disposal when command is purged from stack
        if (this.object3D && typeof VRODOS.utils.disposeObject === 'function') {
            VRODOS.utils.disposeObject(this.object3D);
        }
    }

    undo() {
        vrodosUndoApplyRecordLockState(this.object3D, this.objectData);

        // Restore 3D object to scene
        if (typeof VRODOS.utils.setObjectTreeVisible === 'function') {
            VRODOS.utils.setObjectTreeVisible(this.object3D, true);
        } else {
            this.object3D.visible = true;
        }

        VRODOS.editor.objectFactory.addSceneObject(this.object3D, {
            selectable: true,
            updateHierarchy: false,
            incrementLoaded: false,
            renderReason: 'undo-restore-object'
        });
        
        this.object3D.updateMatrix();
        this.object3D.updateMatrixWorld(true);
        VRODOS.utils.sceneSetObjectRecord(this.nameModel, this.objectData);
        
        let restoredLightAssociates = null;
        // Specialized restoration for lights
        if (this.object3D.isLight) {
            restoredLightAssociates = this.restoreLightAssociates();
        }
        
        // Restore to hierarchy viewer
        if (typeof VRODOS.ui.finalizeSceneObjectAdd === 'function') {
            VRODOS.ui.finalizeSceneObjectAdd(this.object3D, {
                alreadyRegistered: true,
                updateHierarchy: true,
                select: false
            });
        } else if (typeof VRODOS.ui.addInHierarchyViewer === 'function') {
            VRODOS.ui.addInHierarchyViewer(this.object3D);
        }

        if (restoredLightAssociates && restoredLightAssociates.createdTarget && typeof VRODOS.ui.setHierarchyViewer === 'function') {
            VRODOS.ui.setHierarchyViewer();
        }

        vrodosUndoReconcileLockState(this.object3D);
        
        if (typeof VRODOS.editor.animate === 'function') VRODOS.editor.animate();
        if (typeof VRODOS.api.triggerAutoSave === 'function') VRODOS.api.triggerAutoSave();
    }

    restoreLightAssociates() {
        const light = this.object3D;
        const name = light.name;
        const scene = VRODOS.editor.envir.scene;
        const objectData = this.objectData || {};
        const lightColor = light.color || 0xffffff;
        const result = {
            createdTarget: false,
            createdHelper: false,
            createdShadowHelper: false
        };
        
        // Re-create Helper if it's missing (it was disposed)
        let helper = VRODOS.utils.getEditorLightObject('helper', name, scene);
        if (!helper) {
            helper = VRODOS.utils.createEditorLightHelper(light, { size: 1 });
            if (helper) {
                scene.add(helper);
                result.createdHelper = true;
            }
        } else {
            VRODOS.utils.configureEditorLightHelper(helper, light);
        }

        let target = VRODOS.utils.getEditorLightObject('target', name, scene);
        if (!target && ['DirectionalLight', 'SpotLight'].includes(light.type)) {
            target = VRODOS.utils.createEditorLightTarget(light, {
                addedAt: light.addedAt || objectData.addedAt,
                color: lightColor,
                helper,
                position: objectData.targetposition
            });
            if (target) {
                VRODOS.editor.objectFactory.addSceneObject(target, {
                    selectable: true,
                    updateHierarchy: false,
                    incrementLoaded: false,
                    renderReason: 'undo-restore-light-target'
                });
                result.createdTarget = true;
            }
        }

        if (target && ['DirectionalLight', 'SpotLight'].includes(light.type)) {
            VRODOS.utils.linkEditorLightTarget(light, target);
            if (helper) target.parentLightHelper = helper;
        }

        let shadowHelper = VRODOS.utils.getEditorLightObject('shadow', name, scene);
        if (!shadowHelper && light.type === 'DirectionalLight') {
            shadowHelper = VRODOS.utils.createEditorLightShadowHelper(light);
            if (shadowHelper) {
                scene.add(shadowHelper);
                result.createdShadowHelper = true;
            }
        } else if (shadowHelper) {
            VRODOS.utils.configureEditorLightShadowHelper(shadowHelper, light);
        }

        if (typeof VRODOS.utils.syncEditorLightArtifacts === 'function') {
            VRODOS.utils.syncEditorLightArtifacts(target || light, scene);
        } else if (helper && typeof helper.update === 'function') {
            helper.update();
        }

        return result;
    }

    redo() {
        this.execute();
    }
};

/**
 * Command for locking and unlocking scene objects.
 */
VRODOS.editor.LockCommand = class {
    constructor(object, oldValue, newValue) {
        const target = object && (object.realObject || object);
        this.objectUuid = target ? target.uuid : null;
        this.objectName = target ? target.name : null;
        this.oldValue = vrodosUndoIsLocked(oldValue);
        this.newValue = vrodosUndoIsLocked(newValue);
    }

    apply(value) {
        let obj = vrodosUndoGetObjectByUuid(this.objectUuid);
        if (!obj) {
            obj = vrodosUndoGetObjectByName(this.objectName);
        }
        if (!obj) return;

        vrodosUndoSetLocked(obj, value);
        vrodosUndoReconcileLockState(obj);

        if (!vrodosUndoIsLocked(obj) &&
            VRODOS.editor.selection &&
            typeof VRODOS.editor.selection.select === 'function') {
            VRODOS.editor.selection.select(obj, { source: 'lock-undo-redo' });
        }

        if (typeof VRODOS.editor.animate === 'function') VRODOS.editor.animate();
        if (typeof VRODOS.api.triggerAutoSave === 'function') VRODOS.api.triggerAutoSave();
    }

    undo() {
        this.apply(this.oldValue);
    }

    redo() {
        this.apply(this.newValue);
    }
};

/**
 * Command for Property Changes (Color, Intensity, etc.)
 */
VRODOS.editor.PropertyCommand = class {
    constructor(object, property, oldValue, newValue) {
        const target = object.realObject || object;
        this.objectUuid = target.uuid;
        this.property = property;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    apply(val) {
        const obj = vrodosUndoGetObjectByUuid(this.objectUuid);
        if (!obj) return;

        const scene = VRODOS.editor && VRODOS.editor.envir ? VRODOS.editor.envir.scene : null;
        const isLightObject = Boolean(obj.category_name && obj.category_name.includes("light"));

        if (this.property === 'locked') {
            vrodosUndoSetLocked(obj, val);
        } else if (this.property === 'sceneAssetRole') {
            const sceneRole = typeof VRODOS.utils.sceneAssetRoleOverrideFor === 'function'
                ? VRODOS.utils.sceneAssetRoleOverrideFor(obj, val)
                : val;
            obj.userData = obj.userData || {};
            if (sceneRole) {
                obj.sceneAssetRole = sceneRole;
                obj.userData.sceneAssetRole = sceneRole;
            } else {
                delete obj.sceneAssetRole;
                delete obj.userData.sceneAssetRole;
            }
        } else if (this.property === 'color') {
            if (isLightObject && VRODOS.utils && typeof VRODOS.utils.applyEditorLightColor === 'function') {
                VRODOS.utils.applyEditorLightColor(obj, val, scene);
            } else if (obj.color && typeof obj.color.set === 'function' && VRODOS.utils && typeof VRODOS.utils.applyEditorObjectVisualColor === 'function') {
                VRODOS.utils.applyEditorObjectVisualColor(obj, val);
            } else if (obj.color && typeof obj.color.set === 'function') {
                obj.color.set(val);
            } else {
                obj[this.property] = val;
            }
        } else {
            obj[this.property] = val;
        }

        VRODOS.loader.refreshPrimitivePlaneProperty(obj, this.property);

        if (this.property === 'walkableBehavior') {
            obj.userData = obj.userData || {};
            obj.userData.walkableBehavior = val;
        }

        const isLocked = vrodosUndoReconcileLockState(obj);

        // Sync light helpers
        if (isLightObject && VRODOS.utils) {
            if (typeof VRODOS.utils.syncEditorLightArtifacts === 'function') {
                VRODOS.utils.syncEditorLightArtifacts(obj, scene);
            } else if (typeof VRODOS.utils.updateEditorLightHelper === 'function') {
                VRODOS.utils.updateEditorLightHelper(obj, scene);
            }
        }

        // Update UI panels
        if (!isLocked && typeof VRODOS.ui.setDatGuiInitialVales === 'function') {
            VRODOS.ui.setDatGuiInitialVales(obj);
        }
        
        if (!isLocked && this.property === 'sceneAssetRole' && typeof VRODOS.ui.refreshSceneAssetRolePresentation === 'function') {
            VRODOS.ui.refreshSceneAssetRolePresentation(obj);
        } else if (!isLocked && typeof VRODOS.ui.showPropertiesInPanel === 'function') {
            VRODOS.ui.showPropertiesInPanel(obj);
        }

        VRODOS.editor.animate();
        VRODOS.api.triggerAutoSave();
    }

    undo() {
        this.apply(this.oldValue);
    }

    redo() {
        this.apply(this.newValue);
    }
};

VRODOS.editor.PlaneTextureCommand = class {
    constructor(object, slot, oldState, newState) {
        this.objectUuid = object.uuid;
        this.objectName = object.name;
        this.slot = slot;
        this.oldState = JSON.parse(JSON.stringify(oldState || {}));
        this.newState = JSON.parse(JSON.stringify(newState || {}));
    }

    apply(state) {
        const object = vrodosUndoGetObjectByUuid(this.objectUuid) || vrodosUndoGetObjectByName(this.objectName);
        if (!object) return;

        const slotName = this.slot.charAt(0).toUpperCase() + this.slot.slice(1);
        const attachmentProperty = `surface${slotName}AttachmentId`;
        const urlProperty = `surface${slotName}Url`;
        const attachmentId = Number(state.attachmentId) || 0;
        const url = String(state.url || '');
        object[attachmentProperty] = attachmentId;
        object[urlProperty] = url;
        object.userData = object.userData || {};
        object.userData[attachmentProperty] = attachmentId;
        if (url) object.userData[urlProperty] = url;
        else delete object.userData[urlProperty];
        if (this.slot === 'normal' && Object.prototype.hasOwnProperty.call(state, 'normalYSign')) {
            object.surfaceNormalYSign = Number(state.normalYSign) < 0 ? -1 : 1;
            object.userData.surfaceNormalYSign = object.surfaceNormalYSign;
        }

        if (VRODOS.loader && typeof VRODOS.loader.setPrimitivePlaneTexture === 'function') {
            VRODOS.loader.setPrimitivePlaneTexture(object, this.slot, url);
        }
        if (VRODOS.loader && typeof VRODOS.loader.refreshPrimitivePlaneMaterial === 'function') {
            VRODOS.loader.refreshPrimitivePlaneMaterial(object);
        }
        if (typeof VRODOS.ui.showPropertiesInPanel === 'function') {
            VRODOS.ui.showPropertiesInPanel(object);
        }
        if (typeof VRODOS.api.triggerAutoSave === 'function') {
            VRODOS.api.triggerAutoSave();
        }
    }

    execute() {
        this.apply(this.newState);
    }

    undo() {
        this.apply(this.oldState);
    }

    redo() {
        this.apply(this.newState);
    }
};

const VRODOS_PLANE_SURFACE_STATE_SLOTS = Object.freeze({
    albedo: ['surfaceAlbedoAttachmentId', 'surfaceAlbedoUrl'],
    normal: ['surfaceNormalAttachmentId', 'surfaceNormalUrl'],
    roughness: ['surfaceRoughnessAttachmentId', 'surfaceRoughnessUrl'],
    ao: ['surfaceAoAttachmentId', 'surfaceAoUrl'],
    metalness: ['surfaceMetalnessAttachmentId', 'surfaceMetalnessUrl'],
    displacement: ['surfaceDisplacementAttachmentId', 'surfaceDisplacementUrl']
});

VRODOS.editor.applyPlaneSurfaceMaterialState = function(object, state, options) {
    if (!object || !state) return;
    const settings = Object.assign({ updateUi: true, autosave: true }, options || {});
    object.userData = object.userData || {};
    Object.entries(VRODOS_PLANE_SURFACE_STATE_SLOTS).forEach(([slot, [attachmentProperty, urlProperty]]) => {
        const slotState = state.slots && state.slots[slot] ? state.slots[slot] : { attachmentId: 0, url: '' };
        object[attachmentProperty] = Number(slotState.attachmentId) || 0;
        object[urlProperty] = String(slotState.url || '');
        object.userData[attachmentProperty] = object[attachmentProperty];
        if (object[urlProperty]) object.userData[urlProperty] = object[urlProperty];
        else delete object.userData[urlProperty];
        if (slot !== 'displacement' && VRODOS.loader && typeof VRODOS.loader.setPrimitivePlaneTexture === 'function') {
            VRODOS.loader.setPrimitivePlaneTexture(object, slot, object[urlProperty]);
        }
    });
    Object.entries(state.properties || {}).forEach(([property, value]) => {
        object[property] = value;
        object.userData[property] = value;
    });
    if (VRODOS.loader && typeof VRODOS.loader.refreshPrimitivePlaneMaterial === 'function') {
        VRODOS.loader.refreshPrimitivePlaneMaterial(object);
    }
    if (settings.updateUi && typeof VRODOS.ui.showPropertiesInPanel === 'function') {
        VRODOS.ui.showPropertiesInPanel(object);
    }
    if (settings.autosave && typeof VRODOS.api.triggerAutoSave === 'function') {
        VRODOS.api.triggerAutoSave();
    }
};

VRODOS.editor.PlaneSurfaceMaterialCommand = class {
    constructor(object, oldState, newState) {
        this.objectUuid = object.uuid;
        this.objectName = object.name;
        this.oldState = JSON.parse(JSON.stringify(oldState || {}));
        this.newState = JSON.parse(JSON.stringify(newState || {}));
    }

    apply(state) {
        const object = vrodosUndoGetObjectByUuid(this.objectUuid) || vrodosUndoGetObjectByName(this.objectName);
        if (object) VRODOS.editor.applyPlaneSurfaceMaterialState(object, state);
    }

    execute() {
        this.apply(this.newState);
    }

    undo() {
        this.apply(this.oldState);
    }

    redo() {
        this.apply(this.newState);
    }
};
// Global instance
VRODOS.editor.undoManager = new VRODOS.editor.UndoManager(50);
// Set initial UI state when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VRODOS.editor.undoManager.updateButtons());
} else {
    VRODOS.editor.undoManager.updateButtons();
}
