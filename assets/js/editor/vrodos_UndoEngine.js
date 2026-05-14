'use strict';

/**
 * Vrodos Undo Engine
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
            command.redo ? command.redo() : command.execute();
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
            // r181: Euler.set(x,y,z,order) is standard. JSON strings are parsed to plain objects.
            obj.rotation.set(state.rot.x, state.rot.y, state.rot.z, state.rot.order || 'XYZ');
        }
        if (state.scale && isFinite(state.scale.x) && state.scale.x !== 0) {
            obj.scale.set(state.scale.x, state.scale.y, state.scale.z);
        }

        // r181 stability: Force deep matrix and visibility update
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

        // Update UI
        if (typeof VRODOS.ui.setDatGuiInitialVales === 'function') {
            VRODOS.ui.setDatGuiInitialVales(obj);
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
                // We call VRODOS.api.deleteAssetFromScene but we need to tell it NOT to push to undo again
                VRODOS.editor.undoManager.isExecuting = true;
                VRODOS.api.deleteAssetFromScene(obj.uuid);
                VRODOS.editor.undoManager.isExecuting = false;
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
            VRODOS.editor.undoManager.isExecuting = true;
            // Redo a delete: we can allow disposal since it's going into the redo stack (or out)
            VRODOS.api.deleteAssetFromScene(this.object3D.uuid, false);
            VRODOS.editor.undoManager.isExecuting = false;
        }
    }

    dispose() {
        // Ultimate disposal when command is purged from stack
        if (this.object3D && typeof VRODOS.utils.disposeObject === 'function') {
            VRODOS.utils.disposeObject(this.object3D);
        }
    }

    undo() {
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
        VRODOS.data.scene.objects = VRODOS.data.scene.objects || {};
        VRODOS.data.scene.objects[this.nameModel] = this.objectData;
        
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
        
        obj[this.property] = val;
        
        // Handle special properties like color which might live in children[0]
        if (this.property === 'color' && obj.children && obj.children[0] && obj.children[0].material) {
            obj.children[0].material.color.set(val);
        }

        // Sync light helpers
        if (obj.category_name && obj.category_name.includes("light")) {
            VRODOS.utils.updateEditorLightHelper(obj, VRODOS.editor.envir.scene);
        }

        // Update UI panels
        if (typeof VRODOS.ui.setDatGuiInitialVales === 'function') {
            VRODOS.ui.setDatGuiInitialVales(obj);
        }
        
        if (typeof VRODOS.ui.showPropertiesInPanel === 'function') {
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
// Global instance
VRODOS.editor.undoManager = new VRODOS.editor.UndoManager(50);
// Set initial UI state when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VRODOS.editor.undoManager.updateButtons());
} else {
    VRODOS.editor.undoManager.updateButtons();
}
