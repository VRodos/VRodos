/**
 * Vrodos Undo Engine
 * Implements a Command Pattern for internal scene editor undo/redo.
 */

class VrodosUndoManager {
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
}

/**
 * Command for Object Transformations (Position, Rotation, Scale)
 */
class TransformCommand {
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

        // Try find by UUID first
        let obj = envir.scene.getObjectByProperty('uuid', this.objectUuid);
        
        // Fallback to find by Name (Asset names are unique in VRodos)
        if (!obj || obj.name === "vrodosGizmoProxy") {
            obj = envir.scene.getObjectByName(this.objectName);
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
        obj.visible = true;
        obj.traverse((node) => {
            node.visible = true;
            if (node.isMesh) node.frustumCulled = false;
        });

        if (obj.category_name && obj.category_name.includes("light")) {
            const helper = envir.scene.getObjectByName(`lightHelper_${  obj.name}`);
            if (helper && typeof helper.update === 'function') helper.update();
        }

        // Update UI
        if (typeof setDatGuiInitialVales === 'function') {
            setDatGuiInitialVales(obj);
        }
        
        if (typeof animate === 'function') animate();
        if (typeof triggerAutoSave === 'function') triggerAutoSave();
    }
}

/**
 * Command for Adding an Object
 */
class AddObjectCommand {
    constructor(nameModel, objectData) {
        this.nameModel = nameModel;
        this.objectData = JSON.parse(JSON.stringify(objectData));
    }

    execute() {
        // Redo functionality
        if (typeof addAssetToCanvas === 'function') {
            const data = this.objectData;
            addAssetToCanvas(this.nameModel, data.path, data.category_name, data, data.trs.translation, pluginPath);
        }
    }

    undo() {
        if (typeof deleteAssetFromScene === 'function') {
            const obj = envir.scene.getObjectByName(this.nameModel);
            if (obj) {
                // We call deleteAssetFromScene but we need to tell it NOT to push to undo again
                vrodosUndoManager.isExecuting = true;
                deleteAssetFromScene(obj.uuid);
                vrodosUndoManager.isExecuting = false;
            }
        }
    }
}

/**
 * Command for Deleting an Object
 */
class DeleteObjectCommand {
    constructor(nameModel, objectData, object3D) {
        this.nameModel = nameModel;
        this.objectData = JSON.parse(JSON.stringify(objectData));
        this.object3D = object3D; // Keep reference to 3D object for instant restoration
    }

    execute() {
        if (typeof deleteAssetFromScene === 'function') {
            vrodosUndoManager.isExecuting = true;
            // Redo a delete: we can allow disposal since it's going into the redo stack (or out)
            deleteAssetFromScene(this.object3D.uuid, false);
            vrodosUndoManager.isExecuting = false;
        }
    }

    dispose() {
        // Ultimate disposal when command is purged from stack
        if (this.object3D && typeof vrodosDisposeObject === 'function') {
            vrodosDisposeObject(this.object3D);
        }
    }

    undo() {
        // Restore 3D object to scene
        this.object3D.visible = true;
        this.object3D.traverse((node) => {
            node.visible = true;
            if (node.isMesh) node.frustumCulled = false;
        });

        envir.scene.add(this.object3D);
        if (envir.selectableMeshes) envir.selectableMeshes.add(this.object3D);
        
        this.object3D.updateMatrix();
        this.object3D.updateMatrixWorld(true);
        vrodos_scene_data.objects[this.nameModel] = this.objectData;
        
        // Specialized restoration for lights
        if (this.object3D.isLight) {
            this.restoreLightAssociates();
        }
        
        // Restore to hierarchy viewer
        if (typeof addInHierarchyViewer === 'function') {
            addInHierarchyViewer(this.object3D);
        }
        
        if (typeof animate === 'function') animate();
        if (typeof triggerAutoSave === 'function') triggerAutoSave();
    }

    restoreLightAssociates() {
        const light = this.object3D;
        const name = light.name;
        
        // Re-create Helper if it's missing (it was disposed)
        let helper = envir.scene.getObjectByName(`lightHelper_${  name}`);
        if (!helper) {
            if (light.type === 'PointLight') helper = new THREE.PointLightHelper(light, 1);
            else if (light.type === 'SpotLight') helper = new THREE.SpotLightHelper(light);
            else if (light.type === 'DirectionalLight') helper = new THREE.DirectionalLightHelper(light, 1);
            
            if (helper) {
                helper.name = `lightHelper_${  name}`;
                envir.scene.add(helper);
            }
        }

        // Re-create Target Spot for Sun/Spot if needed
        if (light.category_name === 'lightSun' || light.category_name === 'lightSpot') {
            const targetSpot = envir.scene.getObjectByName(`lightTargetSpot_${  name}`);
            if (!targetSpot) {
                // We'd ideally need the original target position here. 
                // For now, let's assume it was at (0,0,0) or rely on the Light's internal target
                if (typeof vrodos_createLightTargetSpot === 'function') {
                    // This is complex because we need the specific logic from addRemoveOne
                }
            }
        }
    }

    redo() {
        this.execute();
    }
}

/**
 * Command for Property Changes (Color, Intensity, etc.)
 */
class PropertyCommand {
    constructor(object, property, oldValue, newValue) {
        const target = object.realObject || object;
        this.objectUuid = target.uuid;
        this.property = property;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    apply(val) {
        const obj = envir.scene.getObjectByProperty('uuid', this.objectUuid);
        if (!obj) return;
        
        obj[this.property] = val;
        
        // Handle special properties like color which might live in children[0]
        if (this.property === 'color' && obj.children && obj.children[0] && obj.children[0].material) {
            obj.children[0].material.color.set(val);
        }

        // Sync light helpers
        if (obj.category_name && obj.category_name.includes("light")) {
            const helper = envir.scene.getObjectByName(`lightHelper_${  obj.name}`);
            if (helper && typeof helper.update === 'function') helper.update();
        }

        // Update UI panels
        if (typeof setDatGuiInitialVales === 'function') {
            setDatGuiInitialVales(obj);
        }
        
        if (typeof showPropertiesInPanel === 'function') {
            showPropertiesInPanel(obj);
        }

        animate();
        triggerAutoSave();
    }

    undo() {
        this.apply(this.oldValue);
    }

    redo() {
        this.apply(this.newValue);
    }
}

// Global instance
const vrodosUndoManager = new VrodosUndoManager(50);

// Set initial UI state when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => vrodosUndoManager.updateButtons());
} else {
    vrodosUndoManager.updateButtons();
}
