VRODOS.utils.getSceneObjectAddedAt = function(dataDrag) {
    const existingValue = dataDrag && dataDrag.addedAt ? Number(dataDrag.addedAt) : 0;
    return Number.isFinite(existingValue) && existingValue > 0
        ? Math.floor(existingValue)
        : Math.floor(Date.now() / 1000);
}

function getSceneObjectByUuid(uuid) {
    if (!uuid || !VRODOS.editor.sceneRegistry) return null;
    return VRODOS.editor.sceneRegistry.get(uuid);
}

function getSceneObjectByName(name) {
    if (!name || !VRODOS.editor.sceneRegistry) return null;
    return VRODOS.editor.sceneRegistry.get(name);
}

function getPendingSceneObjectAdds() {
    VRODOS.editor.pendingSceneObjectAdds = VRODOS.editor.pendingSceneObjectAdds || new Map();
    return VRODOS.editor.pendingSceneObjectAdds;
}

function prunePendingSceneObjectAdds() {
    const pendingAdds = getPendingSceneObjectAdds();
    const now = Date.now();
    pendingAdds.forEach((startedAt, objectName) => {
        if (now - startedAt > 30000) {
            pendingAdds.delete(objectName);
        }
    });
}

function markSceneObjectAddPending(nameModel) {
    if (!nameModel) {
        return;
    }

    const pendingAdds = getPendingSceneObjectAdds();
    pendingAdds.set(nameModel, Date.now());
    window.setTimeout(() => {
        const startedAt = pendingAdds.get(nameModel);
        if (startedAt && Date.now() - startedAt > 14000) {
            pendingAdds.delete(nameModel);
        }
    }, 15000);
}

function isSceneObjectAddPending(nameModel) {
    if (!nameModel) {
        return false;
    }

    prunePendingSceneObjectAdds();
    return getPendingSceneObjectAdds().has(nameModel);
}

function clearSceneObjectAddPending(nameModel) {
    if (!nameModel || !VRODOS.editor.pendingSceneObjectAdds) {
        return;
    }

    VRODOS.editor.pendingSceneObjectAdds.delete(nameModel);
}

function getSceneObjectRecord(nameModel) {
    return typeof VRODOS.utils.sceneGetObjectRecord === 'function'
        ? VRODOS.utils.sceneGetObjectRecord(nameModel, { create: false })
        : null;
}

function applyAddedObjectTRS(object, nameModel, options) {
    const opts = options || {};
    const record = getSceneObjectRecord(nameModel);
    if (!record) {
        return object;
    }

    record.trs = record.trs || {};
    if (opts.yOffset) {
        record.trs.translation = VRODOS.utils.safeVector(record.trs.translation, [0, 0, 0]);
        record.trs.translation[1] += opts.yOffset;
    }

    return VRODOS.utils.applyTRSToObject(object, record.trs);
}

function addedObjectRegisterOptions(renderReason) {
    return { selectable: true, incrementLoaded: false, renderReason };
}

function getSceneObjectRecordByUuid(uuid, object) {
    return typeof VRODOS.utils.sceneFindObjectRecord === 'function'
        ? VRODOS.utils.sceneFindObjectRecord(uuid, object)
        : null;
}

function deleteSceneObjectRecord(record) {
    return typeof VRODOS.utils.sceneDeleteObjectRecord === 'function'
        ? VRODOS.utils.sceneDeleteObjectRecord(record)
        : false;
}

function captureDeleteUndoCommand(object, record) {
    if (
        !object ||
        !record ||
        typeof VRODOS.editor.undoManager === 'undefined' ||
        VRODOS.editor.undoManager.isExecuting
    ) {
        return false;
    }

    const target = object.realObject || object;
    VRODOS.editor.undoManager.add(new VRODOS.editor.DeleteObjectCommand(target.name, record.value, target));
    return true;
}

function removeObjectAnimationMixers(object) {
    const envir = VRODOS.editor.envir || {};
    if (!Array.isArray(envir.animationMixers) || !object) {
        return;
    }

    VRODOS.editor.isPaused = true;
    envir.animationMixers = envir.animationMixers.filter((mixer) => (
        !mixer || !mixer._root || mixer._root.name !== object.name
    ));
    VRODOS.editor.isPaused = false;
}

function removeObjectEditorArtifacts(object) {
    if (!object || !object.isLight || typeof VRODOS.utils.removeEditorLightArtifacts !== 'function') {
        return;
    }

    VRODOS.utils.removeEditorLightArtifacts(object, VRODOS.editor.envir ? VRODOS.editor.envir.scene : null, {
        dispose: true,
        removeHierarchy: true
    });
}

function clearDeletedObjectSelection() {
    VRODOS.editor.selection.clear({ source: 'object-deleted' });
    document.dispatchEvent(new CustomEvent("mouseup", { "detail": "Example of an event" }));
}

function removeSceneObjectFromEditor(object, uuid) {
    if (VRODOS.editor.objectFactory && typeof VRODOS.editor.objectFactory.removeSceneObject === 'function') {
        return VRODOS.editor.objectFactory.removeSceneObject(object, {
            reason: 'object-deleted',
            renderReason: 'object-deleted',
            removeHierarchy: true
        });
    }

    VRODOS.editor.sceneRegistry.remove(object, { reason: 'object-deleted' });
    VRODOS.ui.removeHierarchyEntriesForObject(uuid, object.name);
    if (VRODOS.editor.render && typeof VRODOS.editor.render.request === 'function') {
        VRODOS.editor.render.request('object-deleted');
    }
    return object;
}

function setDeleteDialogText(name) {
    const titleEl = document.getElementById("confirm-asset-deletion-title");
    const descriptionEl = document.getElementById("confirm-asset-deletion-description");
    if (!name || !titleEl || !descriptionEl) {
        return;
    }

    titleEl.textContent = `Delete ${name}?`;
    descriptionEl.innerHTML = `Do you really want to delete the asset named <b>${VRODOS.utils.escapeHTML(name)}</b>?`;
}

function getSelectedTransformObject() {
    return VRODOS.editor.transforms && typeof VRODOS.editor.transforms.getRealObject === 'function'
        ? VRODOS.editor.transforms.getRealObject()
        : null;
}

function restoreSelectionAfterDelete(deletedUuid, selectedUuid) {
    if (!selectedUuid || selectedUuid === "unassigned" || deletedUuid === selectedUuid) {
        VRODOS.ui.hideObjectControlsPanel();
        return;
    }

    const objectToReselect = getSceneObjectByUuid(selectedUuid);
    if (objectToReselect) {
        VRODOS.editor.selection.select(objectToReselect, { source: 'delete-reselect' });
    } else {
        VRODOS.ui.hideObjectControlsPanel();
    }
}

VRODOS.ui.frameNewSceneObject = function(object3D) {
    if (!object3D || !VRODOS.editor.envir || !VRODOS.editor.envir.cameraOrbit || !VRODOS.editor.envir.orbitControls) {
        return;
    }

    object3D.updateWorldMatrix(true, true);

    const bounds = new THREE.Box3().setFromObject(object3D);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();

    if (bounds.isEmpty()) {
        object3D.getWorldPosition(center);
        size.set(1, 1, 1);
    } else {
        bounds.getCenter(center);
        bounds.getSize(size);
    }

    const focusDimension = Math.max(size.x, size.y, size.z, 1);
    const paddedSurface = Math.max(focusDimension * 2.4, 6);
    const currentOffset = new THREE.Vector3().subVectors(VRODOS.editor.envir.cameraOrbit.position, VRODOS.editor.envir.orbitControls.target);

    if (currentOffset.lengthSq() < 0.000001) {
        currentOffset.set(VRODOS.editor.envir.FRUSTUM_SIZE, VRODOS.editor.envir.FRUSTUM_SIZE, VRODOS.editor.envir.FRUSTUM_SIZE);
    }

    VRODOS.editor.envir.orbitControls.target.copy(center);

    if (VRODOS.editor.envir.is2d) {
        VRODOS.editor.envir.cameraOrbit.position.set(center.x, VRODOS.editor.envir.FRUSTUM_SIZE, center.z);
    } else {
        VRODOS.editor.envir.cameraOrbit.position.copy(center).add(currentOffset);
    }

    if (typeof VRODOS.utils.orthoFitZoom === 'function') {
        VRODOS.editor.envir.cameraOrbit.zoom = VRODOS.utils.orthoFitZoom(VRODOS.editor.envir.FRUSTUM_SIZE, VRODOS.editor.envir.ASPECT, paddedSurface);
    }

    if (typeof VRODOS.utils.clampNumber === 'function') {
        VRODOS.editor.envir.cameraOrbit.zoom = VRODOS.utils.clampNumber(VRODOS.editor.envir.cameraOrbit.zoom, 10, 5000, 600);
    }

    VRODOS.editor.envir.cameraOrbit.updateProjectionMatrix();
    VRODOS.editor.envir.orbitControls.update();
}

VRODOS.ui.registerSceneObject = function(object, options) {
    const opts = Object.assign({
        selectable: true,
        updateHierarchy: true,
        select: false,
        frame: false,
        autosave: false,
        renderReason: 'object-added'
    }, options || {});

    return VRODOS.editor.objectFactory.addSceneObject(object, opts);
}

VRODOS.ui.selectNewSceneObject = function(object, options) {
    const opts = Object.assign({
        source: 'add-object',
        openPanel: false,
        showProperties: false,
        frame: true,
        autosave: true
    }, options || {});

    VRODOS.editor.selection.select(object, {
        source: opts.source,
        openPanel: opts.openPanel,
        showProperties: opts.showProperties,
        focusHierarchy: true,
        outline: true,
        syncGui: true,
        setMode: true
    });

    if (opts.frame && typeof VRODOS.ui.frameNewSceneObject === 'function') {
        VRODOS.ui.frameNewSceneObject(object);
    }
    if (object) {
        VRODOS.editor.selected_object_name = object.name;
    }
    if (VRODOS.ui.transform && typeof VRODOS.ui.transform.setSize === 'function') {
        VRODOS.ui.transform.setSize();
    }
    if (opts.autosave && typeof VRODOS.api.triggerAutoSave === 'function') {
        VRODOS.api.triggerAutoSave();
    }
    return object;
}

VRODOS.ui.finalizeSceneObjectAdd = function(object, options) {
    const opts = Object.assign({
        alreadyRegistered: false,
        registerOptions: {},
        updateHierarchy: true,
        select: true,
        selectOptions: {}
    }, options || {});

    const registeredObject = opts.alreadyRegistered
        ? object
        : VRODOS.ui.registerSceneObject(object, Object.assign({}, opts.registerOptions || {}, {
            updateHierarchy: false,
            select: false,
            frame: false,
            autosave: false
        }));

    if (!registeredObject || registeredObject !== object) {
        return registeredObject;
    }

    if (opts.updateHierarchy && typeof VRODOS.ui.addInHierarchyViewer === 'function') {
        VRODOS.ui.addInHierarchyViewer(registeredObject);
    }

    if (opts.select) {
        VRODOS.ui.selectNewSceneObject(registeredObject, opts.selectOptions || {});
    }

    return registeredObject;
}

/**
 * Create a Sun light in the scene.
 */
VRODOS.api.createLightSun = function(nameModel, addedAt) {
    const lightObjects = VRODOS.loader.createEditorSunLightObjects(nameModel, {
        addedAt
    }, {
        addDefaults: true,
        color: 0xffffff,
        helperColor: 0xffffff,
        targetColor: 0xffffff,
        visualColor: 0xffffff
    });
    const lightSun = lightObjects.light;

    applyAddedObjectTRS(lightSun, nameModel, { yOffset: 3 });

    const registeredLightSun = VRODOS.ui.finalizeSceneObjectAdd(lightSun, {
        registerOptions: addedObjectRegisterOptions('light-sun-added'),
        select: false
    });
    if (registeredLightSun !== lightSun) {
        return registeredLightSun;
    }

    VRODOS.editor.envir.scene.add(lightObjects.helper);
    const registeredLightTarget = VRODOS.ui.finalizeSceneObjectAdd(lightObjects.target, {
        registerOptions: addedObjectRegisterOptions('light-target-added'),
        select: false
    });
    if (registeredLightTarget && registeredLightTarget !== lightObjects.target) {
        VRODOS.utils.linkDirectionalLightTarget(lightSun, registeredLightTarget);
    }
    if (lightObjects.shadowHelper) {
        VRODOS.editor.envir.scene.add(lightObjects.shadowHelper);
    }

    VRODOS.utils.syncEditorLightArtifacts(lightSun, VRODOS.editor.envir.scene);
    VRODOS.ui.selectNewSceneObject(lightSun, { source: 'light-sun-added' });
    return lightSun;
}

/**
 * Create a Lamp light in the scene.
 */
VRODOS.api.createLightLamp = function(nameModel, addedAt) {
    const lightObjects = VRODOS.loader.createEditorLampLightObjects(nameModel, {
        addedAt,
        lightintensity: 1,
        lightdistance: 100,
        lightdecay: 2
    }, {
        addDefaults: true,
        color: 0xffff00,
        visualColor: 0xffff00,
        helperColor: 0x555500,
        power: 10
    });
    const lightLamp = lightObjects.light;

    applyAddedObjectTRS(lightLamp, nameModel, { yOffset: 3 });

    const registeredLightLamp = VRODOS.ui.finalizeSceneObjectAdd(lightLamp, {
        registerOptions: addedObjectRegisterOptions('light-lamp-added'),
        select: false
    });
    if (registeredLightLamp !== lightLamp) {
        return registeredLightLamp;
    }

    VRODOS.editor.envir.scene.add(lightObjects.helper);
    lightObjects.helper.update();
    VRODOS.ui.selectNewSceneObject(lightLamp, { source: 'light-lamp-added' });
    return lightLamp;
}

/**
 * Create a Spot light in the scene.
 */
VRODOS.api.createLightSpot = function(nameModel, addedAt) {
    const lightObjects = VRODOS.loader.createEditorSpotLightObjects(nameModel, {
        addedAt,
        lightintensity: 1,
        lightdistance: 5,
        lightangle: 0.39,
        lightpenumbra: 0,
        lightdecay: 2
    }, {
        addDefaults: true,
        color: 0xffffff,
        visualColor: 0xffff00,
        helperColor: 0xffaa00,
        targetColor: 0xffaa00,
        visualRotation: [Math.PI / 2, 0, 0]
    });
    const lightSpot = lightObjects.light;

    applyAddedObjectTRS(lightSpot, nameModel, { yOffset: 3 });

    const registeredLightSpot = VRODOS.ui.finalizeSceneObjectAdd(lightSpot, {
        registerOptions: addedObjectRegisterOptions('light-spot-added'),
        select: false
    });
    if (registeredLightSpot !== lightSpot) {
        return registeredLightSpot;
    }

    const registeredLightTarget = VRODOS.ui.finalizeSceneObjectAdd(lightObjects.target, {
        registerOptions: addedObjectRegisterOptions('light-target-added'),
        select: false
    });
    if (registeredLightTarget && registeredLightTarget !== lightObjects.target) {
        VRODOS.utils.linkEditorLightTarget(lightSpot, registeredLightTarget);
        registeredLightTarget.parentLightHelper = lightObjects.helper;
    }
    VRODOS.editor.envir.scene.add(lightObjects.helper);
    VRODOS.utils.syncEditorLightArtifacts(lightSpot, VRODOS.editor.envir.scene);
    VRODOS.ui.selectNewSceneObject(lightSpot, { source: 'light-spot-added' });
    return lightSpot;
}

/**
 * Create an Ambient light in the scene.
 */
VRODOS.api.createLightAmbient = function(nameModel, addedAt) {
    const lightObjects = VRODOS.loader.createEditorAmbientLightObjects(nameModel, {
        addedAt,
        lightintensity: 1
    }, {
        addDefaults: true,
        color: 0xffffff,
        visualColor: 0xffff00,
        visualRotation: [Math.PI / 2, 0, 0]
    });
    const lightAmbient = lightObjects.light;

    applyAddedObjectTRS(lightAmbient, nameModel, { yOffset: 3 });

    return VRODOS.ui.finalizeSceneObjectAdd(lightAmbient, {
        registerOptions: addedObjectRegisterOptions('light-ambient-added'),
        selectOptions: { source: 'light-ambient-added' }
    });
}

/**
 * Handle Pawn actor creation.
 */
VRODOS.api.createPawn = function(nameModel, addedAt, _pluginPath) {
    const modelBaseUrl = VRODOS.loader.resolveEditorModelBaseUrl(VRODOS.data.pluginPath);

    VRODOS.loader.loadEditorPawnModel(
        modelBaseUrl,
        (gltf) => {
            const Pawn = VRODOS.loader.prepareEditorPawnObject(gltf.scene.children[0], nameModel, {
                addedAt,
                scene: VRODOS.editor.envir ? VRODOS.editor.envir.scene : null
            });

            applyAddedObjectTRS(Pawn, nameModel, { yOffset: 3 });

            VRODOS.ui.finalizeSceneObjectAdd(Pawn, {
                registerOptions: addedObjectRegisterOptions('pawn-added'),
                selectOptions: { source: 'pawn-added' }
            });
        },
        (error) => console.log('Error loading Pawn GLB:', error)
    );
}

/**
 * Handle regular GLB asset loading.
 */
VRODOS.api.createGlbAsset = function(nameModel, _addedAt, _pluginPath) {
    VRODOS.api.showSceneLoadingProgress("Loading", { immediate: true });
    const sceneRecord = getSceneObjectRecord(nameModel);

    const manager = new THREE.LoadingManager();
    VRODOS.api.configureSceneLoadingManager(manager, {
        onProgress: (_item, loaded, total) => {
            const currentRecord = getSceneObjectRecord(nameModel) || sceneRecord || {};
            const assetName = VRODOS.utils.displayText(currentRecord.asset_name || nameModel);
            VRODOS.api.setSceneLoadingProgressText(`${assetName} loading part ${loaded} / ${total}`, { immediate: true });
        },
        onLoad: () => {
            const insertedObject = getSceneObjectByName(nameModel);
            if (!insertedObject) {
                VRODOS.api.hideSceneLoadingProgress();
                return;
            }
            applyAddedObjectTRS(insertedObject, nameModel);

            VRODOS.loader.prepareLoadedGlbRootMaterial(insertedObject);

            VRODOS.ui.finalizeSceneObjectAdd(insertedObject, {
                alreadyRegistered: true,
                selectOptions: { source: 'glb-added' }
            });
            if (typeof VRODOS.editor.requestRender === 'function') {
                VRODOS.editor.requestRender('asset-added');
            }
            VRODOS.api.hideSceneLoadingProgress();
        }
    });

    const loaderMulti = new VRODOS.loader.LoaderMulti();
    loaderMulti.load(manager, { [nameModel]: sceneRecord }, VRODOS.data.pluginPath);
}

VRODOS.api.createAssessmentAsset = function(nameModel, addedAt) {
    const resource = getSceneObjectRecord(nameModel) || {};
    if (typeof VRODOS.utils.hasCompleteAssessmentMetadata === 'function' && !VRODOS.utils.hasCompleteAssessmentMetadata(resource)) {
        console.warn('VRodos: skipped incomplete assessment scene object', {
            name: nameModel,
            asset_id: resource.asset_id || '',
            assessment_source_id: resource.assessment_source_id || ''
        });
        return null;
    }

    const assessmentObject = VRODOS.loader.createAssessmentObject(nameModel, {
        ...resource,
        addedAt
    });

    VRODOS.utils.applyTRSToObject(assessmentObject, resource.trs);

    VRODOS.ui.finalizeSceneObjectAdd(assessmentObject, {
        registerOptions: addedObjectRegisterOptions('assessment-added'),
        selectOptions: { source: 'assessment-added' }
    });

    return assessmentObject;
}

VRODOS.api.createTextAsset = function(nameModel, addedAt) {
    const resource = getSceneObjectRecord(nameModel) || {};
    const textObject = VRODOS.loader.createTextPanelObject(nameModel, {
        ...resource,
        addedAt
    });

    VRODOS.loader.setObjectProperties(textObject, nameModel, VRODOS.utils.getSceneDataObjectMap({ create: false }) || {});
    textObject.addedAt = addedAt;

    VRODOS.ui.finalizeSceneObjectAdd(textObject, {
        registerOptions: addedObjectRegisterOptions('text-added'),
        selectOptions: { source: 'text-added' }
    });
}

/**
 * Main function to add objects to the canvas.
 */
VRODOS.api.addAssetToCanvas = function(nameModel, path, categoryName, dataDrag, translation, _pluginPath) {
    if (!nameModel) {
        return null;
    }

    dataDrag = VRODOS.utils.normalizeDisplayTextFields(Object.assign({}, dataDrag || {}));
    const pendingResource = Object.assign({
        category_name: categoryName,
        category_slug: dataDrag.category_slug || categoryName
    }, dataDrag);
    if (
        typeof VRODOS.utils.isAssessmentResource === 'function' &&
        VRODOS.utils.isAssessmentResource(pendingResource) &&
        typeof VRODOS.utils.hasCompleteAssessmentMetadata === 'function' &&
        !VRODOS.utils.hasCompleteAssessmentMetadata(pendingResource)
    ) {
        console.warn('VRodos: assessment asset is missing required metadata and was not added to the scene', {
            name: nameModel,
            asset_id: pendingResource.asset_id || '',
            assessment_source_id: pendingResource.assessment_source_id || ''
        });
        const progressEl = document.getElementById("result_download");
        if (progressEl) {
            progressEl.innerHTML = "Assessment metadata is incomplete. Refresh assets and try again.";
        }
        return null;
    }

    const existingObject = getSceneObjectByName(nameModel);
    if (existingObject || isSceneObjectAddPending(nameModel)) {
        console.warn("VRodos: skipped duplicate scene object add", nameModel);
        return existingObject || null;
    }

    markSceneObjectAddPending(nameModel);
    translation = Array.isArray(translation) ? translation : [0, 0, 0];
    const addedAt = VRODOS.utils.getSceneObjectAddedAt(dataDrag);

    const sceneRecord = VRODOS.utils.sceneSetObjectRecord(
        nameModel,
        VRODOS.utils.sceneCreateObjectRecord(nameModel, path, categoryName, dataDrag, translation, addedAt)
    );

    const categoryHandlers = {
        'lightSun': () => VRODOS.api.createLightSun(nameModel, addedAt),
        'lightLamp': () => VRODOS.api.createLightLamp(nameModel, addedAt),
        'lightSpot': () => VRODOS.api.createLightSpot(nameModel, addedAt),
        'lightAmbient': () => VRODOS.api.createLightAmbient(nameModel, addedAt),
        'pawn': () => VRODOS.api.createPawn(nameModel, addedAt, VRODOS.data.pluginPath),
        '3d-text': () => VRODOS.api.createTextAsset(nameModel, addedAt),
        'assessment': () => VRODOS.api.createAssessmentAsset(nameModel, addedAt)
    };
    const addCategory = VRODOS.utils.normalizeSceneAssetCategory(categoryName);

    // Execute the specific handler or fallback to generic GLB asset loader
    try {
        if (categoryHandlers[addCategory]) {
            categoryHandlers[addCategory]();
        } else {
            VRODOS.api.createGlbAsset(nameModel, addedAt, VRODOS.data.pluginPath);
        }
    } catch (error) {
        clearSceneObjectAddPending(nameModel);
        VRODOS.utils.sceneDeleteObjectRecord(nameModel);
        throw error;
    }

    // [NEW] Capture for Undo Manager
    if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
        VRODOS.editor.undoManager.add(new VRODOS.editor.AddObjectCommand(nameModel, sceneRecord));
    }

    return getSceneObjectByName(nameModel);
}


VRODOS.ui.deleteFomScene = function(uuid, name) {
    setDeleteDialogText(name);

    const selectedObject = getSelectedTransformObject();
    VRODOS.editor.selection.clear({ source: 'delete-dialog-open', hidePanel: false });

    const delete_dialog_element = document.getElementById('confirm-deletion-dialog');
    const delete_btn_element = document.getElementById("delete-asset-btn-confirmation");
    if (!delete_dialog_element || !delete_btn_element) {
        VRODOS.api.deleteAssetFromScene(uuid, true);
        return;
    }

    delete_dialog_element.showModal();

    const delUuid = uuid;
    const selUuid = selectedObject ? selectedObject.uuid : "unassigned";
    delete_btn_element.addEventListener('click', () => {
        delete_dialog_element.close();
        VRODOS.editor.selection.clear({ source: 'delete-confirmed', hidePanel: false });
        VRODOS.api.deleteAssetFromScene(uuid, true);
        restoreSelectionAfterDelete(delUuid, selUuid);
    }, { once: true });
}

VRODOS.ui.lockOnScene = function(uuid, _name) {

    const selectedObject = getSceneObjectByUuid(uuid);
    if (!selectedObject) return;

    selectedObject.locked = !selectedObject.locked;
    if (!selectedObject.locked) {
        VRODOS.editor.selection.select(selectedObject, { source: 'lock-toggle' });
        VRODOS.ui.showObjectControlsPanel();
    } else {
        VRODOS.editor.selection.clear({ source: 'lock-toggle' });
        VRODOS.ui.hideObjectControlsPanel();
    }

    if (typeof VRODOS.ui.updateHierarchyLockIcon === 'function') {
        VRODOS.ui.updateHierarchyLockIcon(selectedObject);
    }

    VRODOS.ui.setBackgroundColorHierarchyViewer(uuid);

    VRODOS.api.saveChanges();

}

/**
 *
 * Delete from scene
 *
 * @param uuid
 * @param preventDispose
 */
VRODOS.api.deleteAssetFromScene = function(uuid, preventDispose = false) {
    const objectSelected = getSceneObjectByUuid(uuid);
    const sceneRecord = getSceneObjectRecordByUuid(uuid, objectSelected);

    if (!objectSelected) {
        deleteSceneObjectRecord(sceneRecord);
        return;
    }

    captureDeleteUndoCommand(objectSelected, sceneRecord);
    deleteSceneObjectRecord(sceneRecord);

    removeObjectAnimationMixers(objectSelected);
    removeObjectEditorArtifacts(objectSelected);
    if (typeof VRODOS.ui.removeCelOutline === 'function') VRODOS.ui.removeCelOutline(objectSelected);

    clearDeletedObjectSelection();

    if (!preventDispose) {
        VRODOS.utils.disposeObject(objectSelected);
    }

    removeSceneObjectFromEditor(objectSelected, uuid);
    VRODOS.api.triggerAutoSave();
}
