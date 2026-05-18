'use strict';

VRODOS.utils.normalizeIntersectedObjects = function(intersectedObjects) {

    const res = [];

    for (let i = 0; i < intersectedObjects.length; i++) {

        let examineObject = intersectedObjects[i].object;
        if (!examineObject) {
            continue;
        }

        while (examineObject && examineObject.parent && examineObject.parent.name !== "vrodosScene") {
            examineObject = examineObject.parent;
        }

        if (!examineObject) {
            continue;
        }

        res.push(examineObject);
    }

    // remove duplicates
    return Array.from(new Set(res));
}

VRODOS.ui.findIntersectedRaw = function(event) {

    const raycasterPick = VRODOS.ui.raycasterSetter(event);
    if (!raycasterPick) {
        return [];
    }

    // All 3D meshes that can be clicked
    const activeMeshes = VRODOS.ui.getActiveMeshes();

    return raycasterPick.intersectObjects(activeMeshes, true);
}

VRODOS.ui.findIntersected = function(event) {

    return VRODOS.utils.normalizeIntersectedObjects(VRODOS.ui.findIntersectedRaw(event));
}

// Reusable raycaster and mouse vector (avoid allocations per event)
const _reusableRaycaster = new THREE.Raycaster();
const _reusableMouse = new THREE.Vector2();

function getRaycastViewport() {
    const mainDiv = document.getElementById('vr_editor_main_div');
    if (!mainDiv || typeof mainDiv.getBoundingClientRect !== 'function') {
        return null;
    }

    const rect = mainDiv.getBoundingClientRect();
    const width = rect.width || mainDiv.clientWidth || 1;
    const height = rect.height || mainDiv.clientHeight || 1;

    return {
        left: rect.left,
        top: rect.top,
        width: Math.max(width, 1),
        height: Math.max(height, 1)
    };
}

function getRaycastCamera() {
    const envir = VRODOS.editor.envir || null;
    if (!envir) {
        return null;
    }

    return VRODOS.editor.avatarControlsEnabled ? envir.cameraAvatar : envir.cameraOrbit;
}

// raycasting for picking objects
VRODOS.ui.raycasterSetter = function(event) {

    // calculate mouse position in normalized device coordinates
    const viewport = getRaycastViewport();
    const camera = getRaycastCamera();
    if (!viewport || !camera) {
        return null;
    }

    _reusableMouse.x = ((event.clientX - viewport.left) / viewport.width) * 2 - 1;
    _reusableMouse.y = - ((event.clientY - viewport.top) / viewport.height) * 2 + 1;

    // Main Raycast object
    _reusableRaycaster.setFromCamera(_reusableMouse, camera);

    return _reusableRaycaster;
}


// This raycasting is used for drag n droping objects into the scene in 2D mode in order to
// find the correct y (height) to place the object
VRODOS.api.dragDropVerticalRayCasting = function(event) {
    const intersects = VRODOS.ui.findIntersectedRaw(event);
    return intersects.length === 0 ? [0, 0, 0] : [intersects[0].point.x, intersects[0].point.y, intersects[0].point.z];
}


// On Double click center screen and focus to that object
VRODOS.ui.onMouseDoubleClickFocus = function(event, id) {

    if (typeof id == 'undefined') {
        id = VRODOS.editor.envir.scene.getObjectById(VRODOS.editor.selected_object_name);
    }

    if (arguments.length === 2) {
        const obj = VRODOS.ui.getEditorSceneObjectByUuid(id);
        if (obj && !obj.locked) {
            VRODOS.ui.selectorMajor(event, obj, "1");
        }
    }

    // Don't move the camera — just select the object.
    // Camera navigation is done manually by the user via orbit controls.
}


// ─── Click vs drag detection ───────────────────────────────
// We record the mousedown position and only trigger selection on mouseup
// if the mouse hasn't moved more than a few pixels (i.e. it was a click).
const _mouseDownPos = { x: 0, y: 0 };
const _CLICK_THRESHOLD = 5; // pixels
VRODOS.editor.suppressNextSelection = false; // Set by drop handler to prevent selection on drop

VRODOS.ui.onMouseDown = function(event) {
    _mouseDownPos.x = event.clientX;
    _mouseDownPos.y = event.clientY;
    // Store for panel positioning
    VRODOS.editor._lastClickX = event.clientX;
    VRODOS.editor._lastClickY = event.clientY;
};
VRODOS.ui.onMouseUp = function(event) {
    const dx = event.clientX - _mouseDownPos.x;
    const dy = event.clientY - _mouseDownPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Always trigger auto-save on mouseup
    if (typeof VRODOS.api.saveSceneEventHandler === 'function') {
        VRODOS.api.saveSceneEventHandler(event);
    }

    // Suppress selection after a drop event
    if (VRODOS.editor.suppressNextSelection) {
        VRODOS.editor.suppressNextSelection = false;
        return;
    }

    // Only trigger selection if it was a click, not a drag
    if (dist > _CLICK_THRESHOLD) return;

    VRODOS.ui.onLeftMouseClick(event);
};
VRODOS.ui.setSelectionIndicator = function(object) {
    if (!object) return;
    if (typeof VRODOS.ui.removeAllCelOutlines === 'function') {
        VRODOS.ui.removeAllCelOutlines();
    }
    if (typeof VRODOS.ui.addCelOutline === 'function') {
        VRODOS.ui.addCelOutline(object);
    }
};

VRODOS.utils.findParentSceneObject = function(object) {
    if (!object) return null;
    let curr = object;
    while (curr && curr.parent && curr.parent.name !== "vrodosScene") {
        curr = curr.parent;
    }
    return curr;
};
/**
 * Detect mouse click (fires on mouseup if pointer didn't move)
 *
 * @param event
 */
VRODOS.ui.onLeftMouseClick = function(event) {
    // If doing affine transformations with transform controls, then ignore select
    if (VRODOS.editor.transforms.isDragging())
        {return;}

    // Middle click return
    if (event.button === 1)
        {return;}

    event.preventDefault();
    event.stopPropagation();

    const intersects = VRODOS.ui.findIntersected(event);

    if (intersects.length === 0) {
        // Clicked empty canvas - deselect current object
        if (event.button === 0) {
            VRODOS.editor.selection.clear({ source: 'empty-canvas' });
        }
        return;
    }

    // If only one object is intersected
    if (intersects.length === 1) {

        if (!intersects[0].locked)
            {VRODOS.ui.selectorMajor(event, intersects[0], "2");}
        return;
    }

    // More than one objects intersected
    const selectedTransformObject = VRODOS.ui.getSelectedPropertyTarget();
    const prevSelected = selectedTransformObject ? selectedTransformObject.name : null;
    let selectNext = false;
    let i = 0;

    for (i = 0; i < intersects.length; i++) {
        selectNext = prevSelected === intersects[i].name;
        if (selectNext)
            {break;}
    }

    if (!selectNext || i === intersects.length - 1)
        {i = -1;}

    if (!intersects[0].locked)
        {VRODOS.ui.selectorMajor(event, intersects[i + 1], "3");}

}// onMouseDown


/**
 * Select an object
 *
 * @param event
 * @param inters
 */
/**
 * Lightweight selection: attach gizmo + outline, highlight in hierarchy.
 * No floating panel or properties shown. Used by hierarchy hover.
 */
VRODOS.ui.selectObjectPreview = function(objectSel) {
    if (!objectSel) return;

    VRODOS.editor.selection.select(objectSel, {
        source: 'hierarchy-preview',
        openPanel: false,
        showProperties: false,
        focusHierarchy: true,
        outline: true,
        syncGui: true
    });
}

VRODOS.ui.selectorMajor = function(event, objectSel, whocalls) {
    if (!event || event.button !== 0 || !objectSel) return;

    VRODOS.editor.selection.select(objectSel, {
        source: whocalls || 'selector-major',
        openPanel: true,
        showProperties: true,
        focusHierarchy: true,
        outline: true,
        syncGui: true,
        setMode: true
    });
}

/**
 * Get active meshes for raycast picking method
 *
 * @returns {Array}
 */
VRODOS.ui.getActiveMeshes = function() {
    const registry = VRODOS.editor.sceneRegistry;
    const envir = VRODOS.editor.envir;
    const registryMeshes = registry && typeof registry.getSelectableRoots === 'function'
        ? registry.getSelectableRoots({ rebuildIfEmpty: false })
        : [];
    if (registryMeshes.length > 0) {
        return registryMeshes;
    }

    // Fast path: use the pre-built cache maintained by add/remove operations
    if (envir && envir.selectableMeshes && envir.selectableMeshes.size > 0) {
        if (envir.selectableMeshesDirty ||
            !Array.isArray(envir.selectableMeshesArray) ||
            envir.selectableMeshesArray.length !== envir.selectableMeshes.size) {
            envir.selectableMeshesArray = typeof VRODOS.utils.dedupeEditorSceneRoots === 'function'
                ? VRODOS.utils.dedupeEditorSceneRoots(Array.from(envir.selectableMeshes), { reason: 'raycast-selectable-cache', log: false })
                : Array.from(envir.selectableMeshes);
            envir.selectableMeshesDirty = false;
        }

        return envir.selectableMeshesArray;
    }

    return [];
}
