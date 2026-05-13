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

    // All 3D meshes that can be clicked
    const activeMeshes = VRODOS.ui.getActiveMeshes();

    return raycasterPick.intersectObjects(activeMeshes, true);
}

VRODOS.ui.findIntersected = function(event) {

    return VRODOS.utils.normalizeIntersectedObjects(VRODOS.ui.findIntersectedRaw(event));
}

// Reusable raycaster and mouse vector (avoid allocations per event)
var _reusableRaycaster = new THREE.Raycaster();
var _reusableMouse = new THREE.Vector2();

// raycasting for picking objects
VRODOS.ui.raycasterSetter = function(event) {

    // calculate mouse position in normalized device coordinates
    const mainDiv = document.getElementById('vr_editor_main_div');
    const rect = mainDiv.getBoundingClientRect();
    _reusableMouse.x = ((event.clientX - rect.left) / mainDiv.clientWidth) * 2 - 1;
    _reusableMouse.y = - ((event.clientY - rect.top) / mainDiv.clientHeight) * 2 + 1;

    // Main Raycast object
    _reusableRaycaster.setFromCamera(_reusableMouse, VRODOS.editor.avatarControlsEnabled ? VRODOS.editor.envir.cameraAvatar : VRODOS.editor.envir.cameraOrbit);

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
        const obj = VRODOS.editor.envir.scene.getObjectByProperty('uuid', id);
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
var _mouseDownPos = { x: 0, y: 0 };
var _mouseDownTime = 0;
var _CLICK_THRESHOLD = 5; // pixels
VRODOS.editor.suppressNextSelection = false; // Set by drop handler to prevent selection on drop

VRODOS.ui.onMouseDown = function(event) {
    _mouseDownPos.x = event.clientX;
    _mouseDownPos.y = event.clientY;
    _mouseDownTime = performance.now();
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
VRODOS.ui.addCelOutline = function(object) {
    if (!object || !object.traverse) return;

    // Cel-shaded outline technique
    object.traverse((node) => {
        if (node.isMesh && !node.vrodos_internal_helper) {
            const outlineMaterial = new THREE.MeshBasicMaterial({
                color: 0x3b82f6, // tw-blue-500
                side: THREE.BackSide,
                transparent: true,
                opacity: 0.8
            });

            const outlineMesh = new THREE.Mesh(node.geometry, outlineMaterial);
            outlineMesh.name = "vrodos_cel_outline";
            outlineMesh.scale.multiplyScalar(1.05);
            outlineMesh.vrodos_internal_helper = true;
            node.add(outlineMesh);
        }
    });
};

VRODOS.ui.removeAllCelOutlines = function() {
    if (!VRODOS.editor.envir || !VRODOS.editor.envir.scene) return;

    VRODOS.editor.envir.scene.traverse((node) => {
        if (node.name === "vrodos_cel_outline") {
            if (node.parent) {
                node.parent.remove(node);
            }
        }
    });
};

VRODOS.ui.setSelectionIndicator = function(object) {
    if (!object) return;
    VRODOS.ui.removeAllCelOutlines();
    VRODOS.ui.addCelOutline(object);
};

VRODOS.ui.setDatGuiInitialVales = function(object) {
    if (!object) return;
    // Implementation for syncing dat.gui or other property editors
    if (typeof VRODOS.ui.showPropertiesInPanel === 'function') {
        VRODOS.ui.showPropertiesInPanel(object);
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
    if (VRODOS.editor.transform_controls.dragging)
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
            if (VRODOS.editor.selection && typeof VRODOS.editor.selection.clear === 'function') {
                VRODOS.editor.selection.clear({ source: 'empty-canvas' });
            } else if (typeof VRODOS.ui.clearTransformSelection === 'function') {
                VRODOS.ui.clearTransformSelection();
                VRODOS.ui.removeAllCelOutlines();
                VRODOS.ui.hideObjectControlsPanel();
            }
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
    const selectedTransformObject = typeof VRODOS.ui.getSelectedTransformObject === 'function'
        ? VRODOS.ui.getSelectedTransformObject()
        : VRODOS.editor.transform_controls.object;
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

    if (VRODOS.editor.selection && typeof VRODOS.editor.selection.select === 'function') {
        VRODOS.editor.selection.select(objectSel, {
            source: 'hierarchy-preview',
            openPanel: false,
            showProperties: false,
            focusHierarchy: true,
            outline: true,
            syncGui: true
        });
    }
}

VRODOS.ui.selectorMajor = function(event, objectSel, whocalls) {
    if (!event || event.button !== 0 || !objectSel) return;

    if (VRODOS.editor.selection && typeof VRODOS.editor.selection.select === 'function') {
        VRODOS.editor.selection.select(objectSel, {
            source: whocalls || 'selector-major',
            openPanel: true,
            showProperties: true,
            focusHierarchy: true,
            outline: true,
            syncGui: true,
            setMode: true
        });
        return;
    }

    if (typeof VRODOS.ui.attachGizmo === 'function') {
        VRODOS.ui.attachGizmo(objectSel);
    }
    if (typeof VRODOS.ui.setDatGuiInitialVales === 'function') {
        VRODOS.ui.setDatGuiInitialVales(objectSel);
    }
    if (typeof VRODOS.ui.showPropertiesInPanel === 'function') {
        VRODOS.ui.showPropertiesInPanel(objectSel);
    }
}

// Right Click: Show properties
VRODOS.ui.contextMenuClick = function(event) {
    event.preventDefault();
    const intersected = VRODOS.ui.findIntersected(event);

    if (intersected.length === 0)
        {return;}

       
    // Check if right-clicked is the one selected already with left-click
    const selectedTransformObject = VRODOS.editor.transforms && typeof VRODOS.editor.transforms.getRealObject === 'function'
        ? VRODOS.editor.transforms.getRealObject()
        : (typeof VRODOS.ui.getSelectedTransformObject === 'function' ? VRODOS.ui.getSelectedTransformObject() : null);
    if (selectedTransformObject && intersected[0].name === selectedTransformObject.name) {
        showProperties(event, intersected[0]);
    }


}

// Right click raycast operations
function showProperties(event, object) {

    //var objectParent  = inters.object.parent;
    const name = object.name;
    switch (object.category_slug) {
        case 'decoration':
            // Don't display a popup in decoration. You can only change name and glb file from asset editor!
            break;
        case 'poi-imagetext':
            VRODOS.ui.displayPoiImageTextProperties(event, name);
            break;
        case 'door':
            VRODOS.ui.displayDoorProperties(event, name);
            break;
        case 'poi-link':
            VRODOS.ui.displayLinkProperties(event, name);
            break;
        case 'chat':
        case 'poi-chat':
            VRODOS.ui.displayPoiChatProperties(event, name);
            break;
        // case 'lightSun':
        //     VRODOS.ui.displaySunProperties(event, name);
        //     break;
        // case 'lightLamp':
        //     VRODOS.ui.displayLampProperties(event, name);
        //     break;
        // case 'lightSpot':
        //     VRODOS.ui.displaySpotProperties(event, name);
        //     break;
        // case 'lightAmbient':
        //     VRODOS.ui.displayAmbientProperties(event, name);
        //     break;
    }
    switch (object.category_name) {
        case 'lightSun':
            VRODOS.ui.displaySunProperties(event, name);
            break;
        case 'lightLamp':
            VRODOS.ui.displayLampProperties(event, name);
            break;
        // case 'lightSpot':
        //     VRODOS.ui.displaySpotProperties(event, name);
        //     break;
        // case 'lightAmbient':
        //     VRODOS.ui.displayAmbientProperties(event, name);
        //     break;
    }
}
function sanitizeInputValue(value) {
    const re = new RegExp('^$|^-?(\\d+)?(\\.?\\d*)?$');
    return value.match(re) === null ? 0 : Number(value);
  }

/**
 * Sun properties
 *
 * @param event
 * @param name
 */
VRODOS.ui.displaySunProperties = function(event, name) {
    const ppPropertiesDiv = document.getElementById("popUpSunPropertiesDiv");
    if (!ppPropertiesDiv) return;

    const sceneObj = VRODOS.editor.envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    const chbox = document.getElementById('castShadow');
    const chboxsunSky = document.getElementById('sunSky');
    const textCameraBottom = document.getElementById('sunShadowCameraBottom');
    const textCameraTop = document.getElementById('sunShadowCameraTop');
    const textCameraLeft = document.getElementById('sunShadowCameraLeft');
    const textCameraRight = document.getElementById('sunShadowCameraRight');
    const textMapHeight = document.getElementById('sunshadowMapHeight');
    const textMapWidth = document.getElementById('sunshadowMapWidth');
    const textBias = document.getElementById('sunshadowBias');
    const sunColor = document.getElementById('sunColor');
    const sunIntensity = document.getElementById('sunIntensity');

    if (chbox) chbox.checked = Boolean(sceneObj.castingShadow);
    if (chboxsunSky) chboxsunSky.checked = Boolean(sceneObj.sunSky);

    if (textCameraBottom) textCameraBottom.value = sceneObj.shadowCameraBottom;
    if (textCameraTop) textCameraTop.value = sceneObj.shadowCameraTop;
    if (textCameraLeft) textCameraLeft.value = sceneObj.shadowCameraLeft;
    if (textCameraRight) textCameraRight.value = sceneObj.shadowCameraRight;
    if (textMapHeight) textMapHeight.value = sceneObj.shadowMapHeight;
    if (textMapWidth) textMapWidth.value = sceneObj.shadowMapWidth;
    if (textBias) textBias.value = sceneObj.shadowBias;

    if (sunColor && sceneObj.children && sceneObj.children[0] && sceneObj.children[0].material) {
        sunColor.value = `#${  sceneObj.children[0].material.color.getHexString()}`;
    }

    if (sunIntensity) sunIntensity.value = sceneObj.lightintensity || 1;

    ppPropertiesDiv.style.display = '';
}

// LAMP PROPERTIES DIV show
VRODOS.ui.displayLampProperties = function(event, name) {
    const ppPropertiesDiv = document.getElementById("popUpLampPropertiesDiv");
    if (!ppPropertiesDiv) return;

    const sceneObj = VRODOS.editor.envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    const chbox = document.getElementById('lampcastShadow');
    const textCameraBottom = document.getElementById('lampShadowCameraBottom');
    const textCameraTop = document.getElementById('lampShadowCameraTop');
    const textCameraLeft = document.getElementById('lampShadowCameraLeft');
    const textCameraRight = document.getElementById('lampShadowCameraRight');
    const textMapHeight = document.getElementById('lampshadowMapHeight');
    const textMapWidth = document.getElementById('lampshadowMapWidth');
    const textBias = document.getElementById('lampshadowBias');
    const lampColor = document.getElementById('lampColor');
    const lampPower = document.getElementById('lampPower');
    const lampDecay = document.getElementById('lampDecay');
    const lampDistance = document.getElementById('lampDistance');

    if (chbox) chbox.checked = Boolean(sceneObj.lampcastingShadow);

    if (textCameraBottom) textCameraBottom.value = sceneObj.lampshadowCameraBottom;
    if (textCameraTop) textCameraTop.value = sceneObj.lampshadowCameraTop;
    if (textCameraLeft) textCameraLeft.value = sceneObj.lampshadowCameraLeft;
    if (textCameraRight) textCameraRight.value = sceneObj.lampshadowCameraRight;
    if (textMapHeight) textMapHeight.value = sceneObj.lampshadowMapHeight;
    if (textMapWidth) textMapWidth.value = sceneObj.lampshadowMapWidth;
    if (textBias) textBias.value = sceneObj.lampshadowBias;

    if (lampColor && sceneObj.children && sceneObj.children[0] && sceneObj.children[0].material) {
        lampColor.value = `#${  sceneObj.children[0].material.color.getHexString()}`;
    }

    if (lampPower) lampPower.value = sceneObj.power;
    if (lampDecay) lampDecay.value = sceneObj.decay;
    if (lampDistance) lampDistance.value = sceneObj.distance;

    ppPropertiesDiv.style.display = '';
}


// SPOT PROPERTIES DIV show
VRODOS.ui.displaySpotProperties = function(event, name) {

    const ppPropertiesDiv = document.getElementById("popUpSpotPropertiesDiv");

    const spotTargetObject = document.getElementById("spotTargetObject");
    spotTargetObject.innerText = '';

    const hierViewer = document.getElementById('hierarchy-viewer');
    for (let i = 0; i < hierViewer.childNodes.length; i++) {
        const id_Hierarchy = hierViewer.childNodes[i].id;
        if (!id_Hierarchy) continue;
        const scene_object = VRODOS.editor.envir.scene.getObjectByName(id_Hierarchy);
        if (!scene_object) continue;
        spotTargetObject.appendChild(new Option(scene_object.name));
    }

    const spotColor = document.getElementById("spotColor");
    const sceneObj = VRODOS.editor.envir.scene.getObjectByName(name) || VRODOS.editor.transform_controls.object;

    if (spotColor && sceneObj && sceneObj.children && sceneObj.children[0] && sceneObj.children[0].material) {
        spotColor.value = `#${  sceneObj.children[0].material.color.getHexString()}`;
    }

    if (sceneObj) {
        if (document.getElementById("spotPower")) document.getElementById("spotPower").value = sceneObj.power || 1;
        if (document.getElementById("spotDecay")) document.getElementById("spotDecay").value = sceneObj.decay || 2;
        if (document.getElementById("spotDistance")) document.getElementById("spotDistance").value = sceneObj.distance || 0;
        if (document.getElementById("spotAngle")) document.getElementById("spotAngle").value = sceneObj.angle || Math.PI / 3;
        if (document.getElementById("spotPenumbra")) document.getElementById("spotPenumbra").value = sceneObj.penumbra || 0;
        if (document.getElementById("spotTargetObject") && sceneObj.target) {
            document.getElementById("spotTargetObject").value = sceneObj.target.name;
        }
    }

    // Show Selection (inside floating panel)
    if (ppPropertiesDiv) ppPropertiesDiv.style.display = '';
}



// AMBIENT PROPERTIES DIV show
VRODOS.ui.displayAmbientProperties = function(event, name) {

    const ppPropertiesDiv = document.getElementById("popUpAmbientPropertiesDiv");

    const hierViewer = document.getElementById('hierarchy-viewer');
    for (let i = 0; i < hierViewer.childNodes.length; i++) {
        const id_Hierarchy = hierViewer.childNodes[i].id;
        const scene_object = VRODOS.editor.envir.scene.getObjectByName(id_Hierarchy);
    }

    const ambientColor = document.getElementById("ambientColor");
    const sceneObj = VRODOS.editor.envir.scene.getObjectByName(name) || VRODOS.editor.transform_controls.object;

    if (ambientColor && sceneObj && sceneObj.color) {
        ambientColor.value = `#${  sceneObj.color.getHexString()}`;
    }

    if (sceneObj && document.getElementById("ambientIntensity")) {
        document.getElementById("ambientIntensity").value = sceneObj.intensity || 1;
    }

    // Show Selection (inside floating panel)
    if (ppPropertiesDiv) ppPropertiesDiv.style.display = '';
}




/**
 * Selecting a DoorTarget for the DoorSource
 *
 * @param event
 * @param name
 */
VRODOS.ui.displayDoorProperties = function(event, name) {
    const popUpDoorPropertiesDiv = document.getElementById("popUpDoorPropertiesDiv");
    const popupDoorSelect = document.getElementById("popupDoorSelect");
    if (!popupDoorSelect || !popUpDoorPropertiesDiv) return;

    const sceneObj = VRODOS.editor.envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    if (sceneObj.sceneID_target) {
        popupDoorSelect.value = sceneObj.sceneID_target;
    } else if (sceneObj.doorName_target) {
        popupDoorSelect.value = `${sceneObj.doorName_target  } at ${  sceneObj.sceneName_target}`;
    } else {
        popupDoorSelect.value = "Default";
    }

    popUpDoorPropertiesDiv.style.display = '';
}

VRODOS.ui.displayLinkProperties = function(event, name) {
    const popUpLinkPropertiesDiv = document.getElementById("popUpLinkPropertiesDiv");
    const popupLinkSelect = document.getElementById("poi_link_text");
    if (!popupLinkSelect || !popUpLinkPropertiesDiv) return;

    const sceneObj = VRODOS.editor.envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    if (sceneObj.poi_link_url) {
        popupLinkSelect.value = sceneObj.poi_link_url;
    } else {
        popupLinkSelect.value = "";
    }

    popUpLinkPropertiesDiv.style.display = '';
}

VRODOS.ui.displayPoiChatProperties = function(event, name) {
    const ppPropertiesDiv = document.getElementById("popUpPoiChatPropertiesDiv");
    if (!ppPropertiesDiv) return;

    const sceneObj = VRODOS.editor.envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    const setTitle = document.getElementById('poi_chat_title');
    const setParticipants = document.getElementById('poi_chat_participants');
    const setIndicators = document.getElementById('poi_chat_indicators');

    if (setTitle) setTitle.value = sceneObj.poi_chat_title || 'Help Chat';
    if (setParticipants) setParticipants.value = sceneObj.poi_chat_participants || 2;
    if (setIndicators) setIndicators.checked = Boolean(sceneObj.poi_chat_indicators);

    ppPropertiesDiv.style.display = '';
}

/**
 * Initializes persistent event listeners for light and properties panels
 * so that we don't need to bind/unbind them on every click.
 */
function initPersistentPropertyListeners() {

    const getSelectedPropertyTarget = () => {
        if (typeof VRODOS.editor.currentSelectedRealObject !== 'undefined' && VRODOS.editor.currentSelectedRealObject) {
            return VRODOS.editor.currentSelectedRealObject;
        }

        if (!VRODOS.editor.transform_controls || !VRODOS.editor.transform_controls.object) {
            return null;
        }

        if (VRODOS.editor.transform_controls.object.name === "vrodosGizmoProxy" && VRODOS.editor.transform_controls.object.realObject) {
            return VRODOS.editor.transform_controls.object.realObject;
        }

        return VRODOS.editor.transform_controls.object;
    };
    
    const setProp = (prop, isCheckbox, sanitize = false) => function () {
            const obj = getSelectedPropertyTarget();
            if (!obj) {
                return;
            }

            const oldValue = obj[prop];
            let val = isCheckbox ? (this.checked ? 1 : 0) : this.value;
            if (sanitize) val = sanitizeInputValue(val);
            
            if (oldValue !== val) {
                obj[prop] = val;
                if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                    VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, prop, oldValue, val));
                }
                VRODOS.api.saveChanges();
            }
        };

    // --- Sun Properties ---
    const sunColor = document.getElementById('sunColor');
    if (sunColor) {
        sunColor.addEventListener('focus', function() { this._oldVal = this.value; });
        sunColor.addEventListener('change', function () {
            const obj = getSelectedPropertyTarget();
            if (obj && obj.children && obj.children[0] && obj.children[0].material && obj.children[0].material.color) {
                const oldVal = this._oldVal || `#${  obj.children[0].material.color.getHexString()}`;
                const newVal = this.value;
                
                if (oldVal !== newVal) {
                    if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                        VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'color', oldVal, newVal));
                    }
                    VRODOS.api.saveChanges();
                }
            }
        });
    }

    const sunIntensity = document.getElementById('sunIntensity');
    if (sunIntensity) sunIntensity.addEventListener('change', setProp('intensity', false, true));

    ['Bottom', 'Top', 'Left', 'Right'].forEach(side => {
        const el = document.getElementById(`sunShadowCamera${  side}`);
        if (el) el.addEventListener('change', setProp(`shadowCamera${  side}`, false, true));
    });

    ['Height', 'Width'].forEach(dim => {
        const el = document.getElementById(`sunshadowMap${  dim}`);
        if (el) el.addEventListener('change', setProp(`shadowMap${  dim}`, false, true));
    });

    const elSunBias = document.getElementById('sunshadowBias');
    if (elSunBias) elSunBias.addEventListener('change', setProp('shadowBias', false, true));

    const elCast = document.getElementById('castShadow');
    if (elCast) elCast.addEventListener('change', setProp('castingShadow', true));

    const elSky = document.getElementById('sunSky');
    if (elSky) elSky.addEventListener('change', setProp('sunSky', true));

    // --- Lamp Properties ---
    const lampColor = document.getElementById('lampColor');
    if (lampColor) {
        lampColor.addEventListener('focus', function() { this._oldVal = this.value; });
        lampColor.addEventListener('change', function () {
            const obj = getSelectedPropertyTarget();
            if (obj && obj.children && obj.children[0] && obj.children[0].material && obj.children[0].material.color) {
                const oldVal = this._oldVal || `#${  obj.children[0].material.color.getHexString()}`;
                const newVal = this.value;

                if (oldVal !== newVal) {
                    if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                        VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'color', oldVal, newVal));
                    }
                    VRODOS.api.saveChanges();
                }
            }
        });
    }

    ['Power', 'Decay', 'Distance'].forEach(prop => {
        const el = document.getElementById(`lamp${  prop}`);
        if (el) el.addEventListener('change', setProp(prop.toLowerCase(), false, true));
    });

    ['Bottom', 'Top', 'Left', 'Right'].forEach(side => {
        const el = document.getElementById(`lampShadowCamera${  side}`);
        if (el) el.addEventListener('change', setProp(`lampshadowCamera${  side}`, false, true));
    });

    ['Height', 'Width'].forEach(dim => {
        const el = document.getElementById(`lampshadowMap${  dim}`);
        if (el) el.addEventListener('change', setProp(`lampshadowMap${  dim}`, false, true));
    });

    // --- Chat Properties ---
    const chatTitle = document.getElementById('poi_chat_title');
    if (chatTitle) chatTitle.addEventListener('change', setProp('poi_chat_title', false));

    const chatParticipants = document.getElementById('poi_chat_participants');
    if (chatParticipants) chatParticipants.addEventListener('change', setProp('poi_chat_participants', false, true));

    const chatIndicators = document.getElementById('poi_chat_indicators');
    if (chatIndicators) chatIndicators.addEventListener('change', setProp('poi_chat_indicators', true));

    const elLampBias = document.getElementById('lampshadowBias');
    if (elLampBias) elLampBias.addEventListener('change', setProp('lampshadowBias', false, true));

    const elLampCast = document.getElementById('lampcastShadow');
    if (elLampCast) elLampCast.addEventListener('change', setProp('lampcastingShadow', true));

    // --- Ambient Properties ---
    const ambientColor = document.getElementById('ambientColor');
    if (ambientColor) {
        ambientColor.addEventListener('focus', function() { this._oldVal = this.value; });
        ambientColor.addEventListener('change', function () {
            const obj = getSelectedPropertyTarget();
            if (obj && obj.color) {
                const oldVal = this._oldVal || `#${  obj.color.getHexString()}`;
                const newVal = this.value;

                if (oldVal !== newVal) {
                    if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                        VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'color', oldVal, newVal));
                    }
                    VRODOS.api.saveChanges();
                }
            }
        });
    }

    const ambientIntensity = document.getElementById('ambientIntensity');
    if (ambientIntensity) ambientIntensity.addEventListener('change', setProp('intensity', false, true));

    // --- Door & Link Properties ---
    const popupDoorSelect = document.getElementById("popupDoorSelect");
    if (popupDoorSelect) {
        popupDoorSelect.addEventListener("focus", function() { this._oldVal = this.value; });
        popupDoorSelect.addEventListener("change", function () {
            if (VRODOS.editor.transform_controls && VRODOS.editor.transform_controls.object && this.value !== "Default" && this.value) {
                const obj = VRODOS.editor.transform_controls.object;
                const oldVal = this._oldVal || obj.sceneID_target;
                const newVal = this.value;

                if (oldVal !== newVal) {
                    obj.sceneID_target = newVal;
                    if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                        VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'sceneID_target', oldVal, newVal));
                    }
                    VRODOS.api.saveChanges();
                }
            }
        });
    }

    const popupLinkSelect = document.getElementById("poi_link_text");
    if (popupLinkSelect) {
        popupLinkSelect.addEventListener("focus", function() { this._oldVal = this.value; });
        popupLinkSelect.addEventListener("change", function () {
            if (VRODOS.editor.transform_controls && VRODOS.editor.transform_controls.object && this.value) {
                const obj = VRODOS.editor.transform_controls.object;
                const oldVal = this._oldVal || obj.poi_link_url;
                const newVal = this.value;

                if (oldVal !== newVal) {
                    obj.poi_link_url = newVal;
                    if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                        VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'poi_link_url', oldVal, newVal));
                    }
                    VRODOS.api.saveChanges();
                }
            }
        });
    }

    // --- POI Image Text Properties ---
    const chboxImg = document.getElementById("poi_image_desc_checkbox");
    const setTitle = document.getElementById('poi_image_title_text');
    const setDesc = document.getElementById('poi_image_desc_text');

    if (chboxImg) {
        chboxImg.addEventListener("change", function () {
            if (VRODOS.editor.transform_controls && VRODOS.editor.transform_controls.object) {
                const obj = VRODOS.editor.transform_controls.object;
                const oldContent = obj.poi_img_content;
                const oldTitle = obj.poi_img_title;
                const newContent = this.checked ? (setDesc && setDesc.value ? setDesc.value : '') : null;
                const newTitle = setTitle ? setTitle.value : obj.poi_img_title;

                if (oldContent !== newContent) {
                    obj.poi_img_content = newContent;
                    obj.poi_img_title = newTitle;
                    
                    if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                        // For complex multi-prop changes, we could use a custom command, but VRODOS.editor.PropertyCommand is enough for the main content
                        VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'poi_img_content', oldContent, newContent));
                    }

                    if (setDesc) setDesc.style.display = this.checked ? "block" : "none";
                    VRODOS.api.saveChanges();
                }
            }
        });
    }

    if (setTitle) {
        setTitle.addEventListener("change", setProp('poi_img_title', false));
    }

    if (setDesc) {
        setDesc.addEventListener("change", setProp('poi_img_content', false));
    }

    // --- POI Chat Properties ---
    const setChatTitle = document.getElementById('poi_chat_title');
    const setChatParticipants = document.getElementById('poi_chat_participants');
    const setChatIndicators = document.getElementById('poi_chat_indicators');

    if (setChatTitle) setChatTitle.addEventListener("change", setProp('poi_chat_title', false));
    if (setChatParticipants) setChatParticipants.addEventListener("change", setProp('poi_chat_participants', false, true));
    if (setChatIndicators) setChatIndicators.addEventListener("change", setProp('poi_chat_indicators', true));
}

// Call once when script loads
initPersistentPropertyListeners();

/**
 * Get active meshes for raycast picking method
 *
 * @returns {Array}
 */
VRODOS.ui.getActiveMeshes = function() {
    if (VRODOS.editor.sceneRegistry && typeof VRODOS.editor.sceneRegistry.getSelectableRoots === 'function') {
        const registryMeshes = VRODOS.editor.sceneRegistry.getSelectableRoots();
        if (registryMeshes.length > 0) {
            return registryMeshes;
        }
    }

    // Fast path: use the pre-built cache maintained by add/remove operations
    if (VRODOS.editor.envir.selectableMeshes && VRODOS.editor.envir.selectableMeshes.size > 0) {
        if (VRODOS.editor.envir.selectableMeshesDirty ||
            !Array.isArray(VRODOS.editor.envir.selectableMeshesArray) ||
            VRODOS.editor.envir.selectableMeshesArray.length !== VRODOS.editor.envir.selectableMeshes.size) {
            VRODOS.editor.envir.selectableMeshesArray = Array.from(VRODOS.editor.envir.selectableMeshes);
            VRODOS.editor.envir.selectableMeshesDirty = false;
        }

        return VRODOS.editor.envir.selectableMeshesArray;
    }
    // Fallback: cache not yet populated (scene still loading)
    const fallback = [];
    VRODOS.editor.envir.scene.traverse(c => { if (c.isSelectableMesh) fallback.push(c); });
    return fallback;
}


function raylineVisualize(raycasterPick) {

    const c = 10000;
    const geolinecast = new THREE.BufferGeometry().setFromPoints([
        raycasterPick.ray.origin.clone(),
        new THREE.Vector3(
            raycasterPick.ray.origin.x - c * raycasterPick.ray.direction.x,
            raycasterPick.ray.origin.y - c * raycasterPick.ray.direction.y,
            raycasterPick.ray.origin.z - c * raycasterPick.ray.direction.z
        )
    ]);

    const myBulletLine = new THREE.Line(geolinecast, new THREE.LineBasicMaterial({ color: 0x0000ff }));
    myBulletLine.name = 'rayLine';

    VRODOS.editor.envir.scene.add(myBulletLine);


    // This will force scene to update and show the line
    VRODOS.editor.envir.scene.getObjectByName('orbitCamera').position.x += 0.1;

    setTimeout(() => {
        VRODOS.editor.envir.scene.getObjectByName('orbitCamera').position.x -= 0.1;
    }, 1500);

    // Remove the line
    setTimeout(() => {
        VRODOS.editor.envir.scene.remove(VRODOS.editor.envir.scene.getObjectByName('rayLine'));
    }, 1500);


}


// Create options for a select
function createOption(container, txt, val, sel, dis, backgr) {
    const option = document.createElement("option");
    option.text = txt;
    option.value = val;
    option.selected = sel;
    option.disabled = dis;
    option.style.background = backgr;
    //option.style.fontSize = "9pt";
    container.add(option);
}


function showWholePopupDiv(popUpDiv, event) {

    const el = (popUpDiv instanceof HTMLElement) ? popUpDiv : popUpDiv[0];
    el.style.display = '';

    const rect = document.getElementById('vr_editor_main_div').getBoundingClientRect();
    el.style.left = `${1 + event.clientX - rect.left  }px`;

    if (el.id === 'popUpMarkerPropertiesDiv') {
        el.style.top = '0';
        el.style.left = '0';
        el.style.bottom = 'auto';
    } else {
        el.style.top = `${event.clientY - rect.top  }px`;
    }

    event.preventDefault();
}

/**
 * Poi image text properties
 *
 * @param event
 * @param name
 */
VRODOS.ui.displayPoiImageTextProperties = function(event, name) {
    const ppPropertiesDiv = document.getElementById("popUpPoiImageTextPropertiesDiv");
    if (!ppPropertiesDiv) return;

    const sceneObj = VRODOS.editor.envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    const chboxImg = document.getElementById("poi_image_desc_checkbox");
    const setTitle = document.getElementById('poi_image_title_text');
    const setDesc = document.getElementById('poi_image_desc_text');

    if (chboxImg) chboxImg.checked = sceneObj.poi_img_content != null;
    if (setDesc) {
        setDesc.style.display = sceneObj.poi_img_content != null ? "block" : "none";
        setDesc.value = sceneObj.poi_img_content;
    }
    if (setTitle) setTitle.value = sceneObj.poi_img_title;

    ppPropertiesDiv.style.display = '';
}

VRODOS.api.saveChanges = function(options) {
    const saveOptions = options || {};

    if (VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading) {
        return Promise.resolve();
    }

    const save_scene_btn = document.getElementById("save-scene-button");
    if (save_scene_btn.classList.contains("LinkDisabled") && !saveOptions.force) {
        return (typeof VRODOS.api.whenSceneSaveSettles === 'function') ? VRODOS.api.whenSceneSaveSettles() : Promise.resolve();
    }

    save_scene_btn.innerHTML = "Saving...";
    save_scene_btn.classList.add("LinkDisabled");
    document.getElementById("compileGameBtn").disabled = true;

    // Export using the new VRODOS.exporter.SceneExporter
    const exporter = new VRODOS.exporter.SceneExporter();
    document.getElementById('vrodos_scene_json_input').value = exporter.parse(VRODOS.editor.envir.scene);

    return VRODOS.api.saveScene();
}
