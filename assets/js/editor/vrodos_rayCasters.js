function normalizeIntersectedObjects(intersectedObjects) {

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

function findIntersectedRaw(event) {

    const raycasterPick = raycasterSetter(event);

    // All 3D meshes that can be clicked
    const activeMeshes = getActiveMeshes();

    return raycasterPick.intersectObjects(activeMeshes, true);
}

function findIntersected(event) {

    return normalizeIntersectedObjects(findIntersectedRaw(event));
}

// Reusable raycaster and mouse vector (avoid allocations per event)
var _reusableRaycaster = new THREE.Raycaster();
var _reusableMouse = new THREE.Vector2();

// raycasting for picking objects
function raycasterSetter(event) {

    // calculate mouse position in normalized device coordinates
    const mainDiv = document.getElementById('vr_editor_main_div');
    const rect = mainDiv.getBoundingClientRect();
    _reusableMouse.x = ((event.clientX - rect.left) / mainDiv.clientWidth) * 2 - 1;
    _reusableMouse.y = - ((event.clientY - rect.top) / mainDiv.clientHeight) * 2 + 1;

    // Main Raycast object
    _reusableRaycaster.setFromCamera(_reusableMouse, avatarControlsEnabled ? envir.cameraAvatar : envir.cameraOrbit);

    return _reusableRaycaster;
}


// This raycasting is used for drag n droping objects into the scene in 2D mode in order to
// find the correct y (height) to place the object
function dragDropVerticalRayCasting(event) {
    const intersects = findIntersectedRaw(event);
    return intersects.length === 0 ? [0, 0, 0] : [intersects[0].point.x, intersects[0].point.y, intersects[0].point.z];
}


// On Double click center screen and focus to that object
function onMouseDoubleClickFocus(event, id) {

    if (typeof id == 'undefined') {
        id = envir.scene.getObjectById(selected_object_name);
    }

    if (arguments.length === 2) {
        const obj = envir.scene.getObjectByProperty('uuid', id);
        if (obj && !obj.locked) {
            selectorMajor(event, obj, "1");
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
var _suppressNextSelection = false; // Set by drop handler to prevent selection on drop

function _onCanvasMouseDown(event) {
    _mouseDownPos.x = event.clientX;
    _mouseDownPos.y = event.clientY;
    _mouseDownTime = performance.now();
    // Store for panel positioning (vrodos_auxControlers.js)
    _lastClickX = event.clientX;
    _lastClickY = event.clientY;
}

function _onCanvasMouseUp(event) {
    const dx = event.clientX - _mouseDownPos.x;
    const dy = event.clientY - _mouseDownPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Always trigger auto-save on mouseup (was previously bound to 'mouseup')
    saveScene(event);

    // Suppress selection after a drop event
    if (_suppressNextSelection) {
        _suppressNextSelection = false;
        return;
    }

    // Only trigger selection if it was a click, not a drag
    if (dist > _CLICK_THRESHOLD) return;

    onLeftMouseClick(event);
}

/**
 * Detect mouse click (fires on mouseup if pointer didn't move)
 *
 * @param event
 */
function onLeftMouseClick(event) {
    // If doing affine transformations with transform controls, then ignore select
    if (transform_controls.dragging)
        {return;}

    // Middle click return
    if (event.button === 1)
        {return;}

    event.preventDefault();
    event.stopPropagation();

    const intersects = findIntersected(event);

    if (intersects.length === 0) {
        // Clicked empty canvas - deselect current object
        if (event.button === 0) {
            transform_controls.detach();
            removeAllCelOutlines();
            hideObjectControlsPanel();
            const objManipToggle = document.getElementById('object-manipulation-toggle');
            const axisManipBtns = document.getElementById('axis-manipulation-buttons');
            if (objManipToggle) objManipToggle.style.display = 'none';
            if (axisManipBtns) axisManipBtns.style.display = 'none';
        }
        return;
    }

    // If only one object is intersected
    if (intersects.length === 1) {

        if (!intersects[0].locked)
            {selectorMajor(event, intersects[0], "2");}
        return;
    }

    // More than one objects intersected
    const prevSelected = typeof transform_controls.object != 'undefined' ? transform_controls.object.name : null;
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
        {selectorMajor(event, intersects[i + 1], "3");}

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
function selectObjectPreview(objectSel) {
    if (!objectSel) return;

    setBackgroundColorHierarchyViewer(objectSel.uuid);
    if (typeof vrodosAttachGizmo === 'function') {
        vrodosAttachGizmo(objectSel);
    } else {
        transform_controls.attach(objectSel);
    }

    if (objectSel.name !== "avatarCamera") {
        setTransformControlsSize();
    }

    transform_controls.setMode("translate");

    removeAllCelOutlines();
    addCelOutline(objectSel);
}

function selectorMajor(event, objectSel, whocalls) {

    if (event.button === 0) {

        const objectTitle = typeof vrodosDecodeDisplayText === 'function'
            ? vrodosDecodeDisplayText(objectSel.asset_name || objectSel.name || 'Object Controls')
            : (objectSel.asset_name || objectSel.name || 'Object Controls');

        showObjectControlsPanel(objectTitle);

        document.getElementById('translate-switch').checked = true;
        document.getElementById('rotate-switch').disabled = false;
        document.getElementById('rotate-switch-label').style = "inherit";

        document.getElementById('scale-switch').disabled = false;
        document.getElementById('scale-switch-label').style = "inherit";
      
        // set the selected color of the hierarchy viewer
        setBackgroundColorHierarchyViewer(objectSel.uuid);

        if (typeof vrodosAttachGizmo === 'function') {
            vrodosAttachGizmo(objectSel);
        } else {
            transform_controls.attach(objectSel);
        }

        // Move light direction
        const lightDirectionalLightSpotMover = () => {

            if (!transform_controls.object)
                {return;}

            if (!transform_controls.object.parentLight)
                {return;}

            transform_controls.object.parentLight.target.position.setFromMatrixPosition(transform_controls.object.matrix);
            transform_controls.object.parentLight.target.updateMatrixWorld();
        };

        const lightSpotLightMover = () => {

            if (!transform_controls.object)
                {return;}

            if (!transform_controls.object.parentLight)
                {return;}

            // Name-based lookup instead of full scene traverse — helper naming convention: 'lightHelper_' + lightName
            const helperName = `lightHelper_${  transform_controls.object.name}`;
            const helper = envir.scene.getObjectByName(helperName);
            if (helper && typeof helper.update === 'function') helper.update();
        };


        if (objectSel.category_name === "lightSun" ||
            objectSel.category_name === "lightTargetSpot" ||
            objectSel.category_name === "lightSpot" ||
            objectSel.category_name === "lightLamp") {

            // Add event listener for lightSpotHelper


            if (objectSel.category_name === "lightTargetSpot") {
                transform_controls.domElement.ownerDocument.addEventListener("pointermove", lightDirectionalLightSpotMover);
            }


            if (objectSel.category_name === "lightSpot") {
                transform_controls.domElement.ownerDocument.addEventListener("pointermove", lightSpotLightMover);
            }

            //transform_controls.children[3].children[0].children[1].visible = false; // 2D ROTATE GIZMO
        } else {

            // Remove event listener when lightSpotHelper is not clicked
            transform_controls.domElement.ownerDocument.removeEventListener("pointermove", lightDirectionalLightSpotMover);
            transform_controls.domElement.ownerDocument.removeEventListener("pointermove", lightSpotLightMover);
        }

        if (objectSel.name === "avatarCamera") {
            document.getElementById('rotate-switch').disabled = true;
            document.getElementById('rotate-switch-label').style.color = "grey";

            document.getElementById('scale-switch').disabled = true;
            document.getElementById('scale-switch-label').style.color = "grey";

            // case of selecting by hierarchy viewer

            // transform_controls.size = 1;
            // transform_controls.visible = false;

            // Can not be deleted
            //transform_controls.children[3].handleGizmos.XZY[0][0].visible = false;


        } else {
            // find dimensions of object in order to resize transform controls
            setTransformControlsSize();
        }


        transform_controls.setMode("translate");


        if (!envir.is2d) {
            const modeSwitch = document.getElementById(`${transform_controls.getMode()  }-switch`);
            if (modeSwitch) modeSwitch.click();
        }

        // highlight — cel-shaded outline
        removeAllCelOutlines();
        addCelOutline(objectSel);

        setDatGuiInitialVales(objectSel);

        // Auto-show object-specific properties in the floating panel
        showPropertiesInPanel(objectSel);
    }
}


// Right Click: Show properties
function contextMenuClick(event) {
    event.preventDefault();
    const intersected = findIntersected(event);

    if (intersected.length === 0)
        {return;}

       
    // Check if right-clicked is the one selected already with left-click
    if (transform_controls.object && intersected[0].name === transform_controls.object.name) {
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
            displayPoiImageTextProperties(event, name);
            break;
        case 'video':
            displayPoiVideoProperties(event, name);
            break;
        case 'door':
            displayDoorProperties(event, name);
            break;
        case 'poi-link':
            displayLinkProperties(event, name);
            break;
        case 'chat':
        case 'poi-chat':
            displayPoiChatProperties(event, name);
            break;
        // case 'lightSun':
        //     displaySunProperties(event, name);
        //     break;
        // case 'lightLamp':
        //     displayLampProperties(event, name);
        //     break;
        // case 'lightSpot':
        //     displaySpotProperties(event, name);
        //     break;
        // case 'lightAmbient':
        //     displayAmbientProperties(event, name);
        //     break;
    }
    switch (object.category_name) {
        case 'lightSun':
            displaySunProperties(event, name);
            break;
        case 'lightLamp':
            displayLampProperties(event, name);
            break;
        // case 'lightSpot':
        //     displaySpotProperties(event, name);
        //     break;
        // case 'lightAmbient':
        //     displayAmbientProperties(event, name);
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
function displaySunProperties(event, name) {
    const ppPropertiesDiv = document.getElementById("popUpSunPropertiesDiv");
    if (!ppPropertiesDiv) return;

    const sceneObj = envir.scene.getObjectByName(name);
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
function displayLampProperties(event, name) {
    const ppPropertiesDiv = document.getElementById("popUpLampPropertiesDiv");
    if (!ppPropertiesDiv) return;

    const sceneObj = envir.scene.getObjectByName(name);
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
function displaySpotProperties(event, name) {

    const ppPropertiesDiv = document.getElementById("popUpSpotPropertiesDiv");

    const spotTargetObject = document.getElementById("spotTargetObject");
    spotTargetObject.innerText = '';

    const hierViewer = document.getElementById('hierarchy-viewer');
    for (let i = 0; i < hierViewer.childNodes.length; i++) {
        const id_Hierarchy = hierViewer.childNodes[i].id;
        if (!id_Hierarchy) continue;
        const scene_object = envir.scene.getObjectByName(id_Hierarchy);
        if (!scene_object) continue;
        spotTargetObject.appendChild(new Option(scene_object.name));
    }

    const spotColor = document.getElementById("spotColor");
    const sceneObj = envir.scene.getObjectByName(name) || transform_controls.object;

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
function displayAmbientProperties(event, name) {

    const ppPropertiesDiv = document.getElementById("popUpAmbientPropertiesDiv");

    const hierViewer = document.getElementById('hierarchy-viewer');
    for (let i = 0; i < hierViewer.childNodes.length; i++) {
        const id_Hierarchy = hierViewer.childNodes[i].id;
        const scene_object = envir.scene.getObjectByName(id_Hierarchy);
    }

    const ambientColor = document.getElementById("ambientColor");
    const sceneObj = envir.scene.getObjectByName(name) || transform_controls.object;

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
function displayDoorProperties(event, name) {
    const popUpDoorPropertiesDiv = document.getElementById("popUpDoorPropertiesDiv");
    const popupDoorSelect = document.getElementById("popupDoorSelect");
    if (!popupDoorSelect || !popUpDoorPropertiesDiv) return;

    const sceneObj = envir.scene.getObjectByName(name);
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

function displayLinkProperties(event, name) {
    const popUpLinkPropertiesDiv = document.getElementById("popUpLinkPropertiesDiv");
    const popupLinkSelect = document.getElementById("poi_link_text");
    if (!popupLinkSelect || !popUpLinkPropertiesDiv) return;

    const sceneObj = envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    if (sceneObj.poi_link_url) {
        popupLinkSelect.value = sceneObj.poi_link_url;
    } else {
        popupLinkSelect.value = "";
    }

    popUpLinkPropertiesDiv.style.display = '';
}

function displayPoiChatProperties(event, name) {
    const ppPropertiesDiv = document.getElementById("popUpPoiChatPropertiesDiv");
    if (!ppPropertiesDiv) return;

    const sceneObj = envir.scene.getObjectByName(name);
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
        if (typeof _currentSelectedRealObject !== 'undefined' && _currentSelectedRealObject) {
            return _currentSelectedRealObject;
        }

        if (!transform_controls || !transform_controls.object) {
            return null;
        }

        if (transform_controls.object.name === "vrodosGizmoProxy" && transform_controls.object.realObject) {
            return transform_controls.object.realObject;
        }

        return transform_controls.object;
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
                if (typeof vrodosUndoManager !== 'undefined' && !vrodosUndoManager.isExecuting) {
                    vrodosUndoManager.add(new PropertyCommand(obj, prop, oldValue, val));
                }
                saveChanges();
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
                    if (typeof vrodosUndoManager !== 'undefined' && !vrodosUndoManager.isExecuting) {
                        vrodosUndoManager.add(new PropertyCommand(obj, 'color', oldVal, newVal));
                    }
                    saveChanges();
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
                    if (typeof vrodosUndoManager !== 'undefined' && !vrodosUndoManager.isExecuting) {
                        vrodosUndoManager.add(new PropertyCommand(obj, 'color', oldVal, newVal));
                    }
                    saveChanges();
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
                    if (typeof vrodosUndoManager !== 'undefined' && !vrodosUndoManager.isExecuting) {
                        vrodosUndoManager.add(new PropertyCommand(obj, 'color', oldVal, newVal));
                    }
                    saveChanges();
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
            if (transform_controls && transform_controls.object && this.value !== "Default" && this.value) {
                const obj = transform_controls.object;
                const oldVal = this._oldVal || obj.sceneID_target;
                const newVal = this.value;

                if (oldVal !== newVal) {
                    obj.sceneID_target = newVal;
                    if (typeof vrodosUndoManager !== 'undefined' && !vrodosUndoManager.isExecuting) {
                        vrodosUndoManager.add(new PropertyCommand(obj, 'sceneID_target', oldVal, newVal));
                    }
                    saveChanges();
                }
            }
        });
    }

    const popupLinkSelect = document.getElementById("poi_link_text");
    if (popupLinkSelect) {
        popupLinkSelect.addEventListener("focus", function() { this._oldVal = this.value; });
        popupLinkSelect.addEventListener("change", function () {
            if (transform_controls && transform_controls.object && this.value) {
                const obj = transform_controls.object;
                const oldVal = this._oldVal || obj.poi_link_url;
                const newVal = this.value;

                if (oldVal !== newVal) {
                    obj.poi_link_url = newVal;
                    if (typeof vrodosUndoManager !== 'undefined' && !vrodosUndoManager.isExecuting) {
                        vrodosUndoManager.add(new PropertyCommand(obj, 'poi_link_url', oldVal, newVal));
                    }
                    saveChanges();
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
            if (transform_controls && transform_controls.object) {
                const obj = transform_controls.object;
                const oldContent = obj.poi_img_content;
                const oldTitle = obj.poi_img_title;
                const newContent = this.checked ? (setDesc && setDesc.value ? setDesc.value : '') : null;
                const newTitle = setTitle ? setTitle.value : obj.poi_img_title;

                if (oldContent !== newContent) {
                    obj.poi_img_content = newContent;
                    obj.poi_img_title = newTitle;
                    
                    if (typeof vrodosUndoManager !== 'undefined' && !vrodosUndoManager.isExecuting) {
                        // For complex multi-prop changes, we could use a custom command, but PropertyCommand is enough for the main content
                        vrodosUndoManager.add(new PropertyCommand(obj, 'poi_img_content', oldContent, newContent));
                    }

                    if (setDesc) setDesc.style.display = this.checked ? "block" : "none";
                    saveChanges();
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

    // --- POI Video Properties ---
    const chboxVid = document.getElementById("poi_video_reward_checkbox");
    const setFocusX = document.getElementById('focus_X');
    const setFocusZ = document.getElementById('focus_Z');

    if (chboxVid) {
        chboxVid.addEventListener("change", function () {
            if (transform_controls && transform_controls.object) {
                const obj = transform_controls.object;
                const oldVal = obj.follow_camera;
                const newVal = this.checked ? 1 : 0;

                if (oldVal !== newVal) {
                    obj.follow_camera = newVal;
                    if (this.checked) {
                        if (setFocusX) obj.follow_camera_x = setFocusX.value;
                        if (setFocusZ) obj.follow_camera_z = setFocusZ.value;
                    }
                    
                    if (typeof vrodosUndoManager !== 'undefined' && !vrodosUndoManager.isExecuting) {
                        vrodosUndoManager.add(new PropertyCommand(obj, 'follow_camera', oldVal, newVal));
                    }

                    if (setFocusX) setFocusX.disabled = !this.checked;
                    if (setFocusZ) setFocusZ.disabled = !this.checked;
                    
                    saveChanges();
                }
            }
        });
    }

    if (setFocusX) setFocusX.addEventListener("change", setProp('follow_camera_x', false));
    if (setFocusZ) setFocusZ.addEventListener("change", setProp('follow_camera_z', false));

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
function getActiveMeshes() {
    // Fast path: use the pre-built cache maintained by add/remove operations
    if (envir.selectableMeshes && envir.selectableMeshes.size > 0) {
        return Array.from(envir.selectableMeshes);
    }
    // Fallback: cache not yet populated (scene still loading)
    const fallback = [];
    envir.scene.traverse(c => { if (c.isSelectableMesh) fallback.push(c); });
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

    envir.scene.add(myBulletLine);


    // This will force scene to update and show the line
    envir.scene.getObjectByName('orbitCamera').position.x += 0.1;

    setTimeout(() => {
        envir.scene.getObjectByName('orbitCamera').position.x -= 0.1;
    }, 1500);

    // Remove the line
    setTimeout(() => {
        envir.scene.remove(envir.scene.getObjectByName('rayLine'));
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
function displayPoiImageTextProperties(event, name) {
    const ppPropertiesDiv = document.getElementById("popUpPoiImageTextPropertiesDiv");
    if (!ppPropertiesDiv) return;

    const sceneObj = envir.scene.getObjectByName(name);
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

function saveChanges(options) {
    const saveOptions = options || {};

    if (envir && envir.isSceneLoading) {
        return Promise.resolve();
    }

    const save_scene_btn = document.getElementById("save-scene-button");
    if (save_scene_btn.classList.contains("LinkDisabled") && !saveOptions.force) {
        return (typeof vrodos_whenSceneSaveSettles === 'function') ? vrodos_whenSceneSaveSettles() : Promise.resolve();
    }

    save_scene_btn.innerHTML = "Saving...";
    save_scene_btn.classList.add("LinkDisabled");
    document.getElementById("compileGameBtn").disabled = true;

    // Export using the new VrodosSceneExporter
    const exporter = new VrodosSceneExporter();
    document.getElementById('vrodos_scene_json_input').value = exporter.parse(envir.scene);

    return vrodos_saveSceneAjax();
}

/**
 * Poi video properties
 *
 * @param event
 * @param name
 */
function displayPoiVideoProperties(event, name) {
    const ppPropertiesDiv = document.getElementById("popUpPoiVideoPropertiesDiv");
    if (!ppPropertiesDiv) return;

    const sceneObj = envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    const chbox = document.getElementById("poi_video_reward_checkbox");
    const setFocusX = document.getElementById('focus_X');
    const setFocusZ = document.getElementById('focus_Z');

    if (chbox) chbox.checked = sceneObj.follow_camera == 1;

    if (setFocusX) {
        setFocusX.value = sceneObj.follow_camera_x;
        setFocusX.disabled = sceneObj.follow_camera == 0;
    }
    if (setFocusZ) {
        setFocusZ.value = sceneObj.follow_camera_z;
        setFocusZ.disabled = sceneObj.follow_camera == 0;
    }

    ppPropertiesDiv.style.display = '';
}
