function normalizeIntersectedObjects(intersectedObjects) {

    let res = [];

    for (let i = 0; i < intersectedObjects.length; i++) {

        let examineObject = intersectedObjects[i].object;
        if (examineObject.parent) {
            while (examineObject.parent.name !== "vrodosScene") {
                examineObject = examineObject.parent;
            }
            res.push(examineObject);
        }
    }

    // remove duplicates
    return Array.from(new Set(res));
}

function findIntersectedRaw(event) {

    let raycasterPick = raycasterSetter(event);

    // All 3D meshes that can be clicked
    let activeMeshes = getActiveMeshes();

    return raycasterPick.intersectObjects(activeMeshes);
}

function findIntersected(event) {

    return normalizeIntersectedObjects(findIntersectedRaw(event));
}


// raycasting for picking objects
function raycasterSetter(event) {

    /* Keep mouse clicks */
    let mouse = new THREE.Vector2();

    // calculate mouse position in normalized device coordinates
    var mainDiv = document.getElementById('vr_editor_main_div');
    var rect = mainDiv.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / mainDiv.clientWidth) * 2 - 1;
    mouse.y = - ((event.clientY - rect.top) / mainDiv.clientHeight) * 2 + 1;

    // Main Raycast object
    let raycasterPick = new THREE.Raycaster();
    raycasterPick.setFromCamera(mouse, avatarControlsEnabled ? envir.cameraAvatar : envir.cameraOrbit);

    // Show the myBulletLine (raycast)
    // raylineVisualize(raycasterPick);

    return raycasterPick;
}


// This raycasting is used for drag n droping objects into the scene in 2D mode in order to
// find the correct y (height) to place the object
function dragDropVerticalRayCasting(event) {
    let intersects = findIntersectedRaw(event);
    return intersects.length === 0 ? [0, 0, 0] : [intersects[0].point.x, intersects[0].point.y, intersects[0].point.z];
}


// On Double click center screen and focus to that object
function onMouseDoubleClickFocus(event, id) {

    if (typeof id == 'undefined') {
        id = envir.scene.getObjectById(selected_object_name);
    }

    if (arguments.length === 2) {
        var obj = envir.scene.getObjectByProperty('uuid', id);
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
    var dx = event.clientX - _mouseDownPos.x;
    var dy = event.clientY - _mouseDownPos.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

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
        return;

    // Middle click return
    if (event.button === 1)
        return;

    event.preventDefault();
    event.stopPropagation();

    let intersects = findIntersected(event);

    if (intersects.length === 0) {
        // Clicked empty canvas — deselect current object
        if (event.button === 0) {
            transform_controls.detach();
            removeAllCelOutlines();
            hideObjectControlsPanel();
            var objManipToggle = document.getElementById('object-manipulation-toggle');
            var axisManipBtns = document.getElementById('axis-manipulation-buttons');
            if (objManipToggle) objManipToggle.style.display = 'none';
            if (axisManipBtns) axisManipBtns.style.display = 'none';
        }
        return;
    }

    if (intersects.length > 0) {

        // If Steve is selected
        if ((intersects[0].name === 'Steve' || intersects[0].name === 'SteveShieldMesh'
            || intersects[0].name === 'SteveMesh') && event.button === 0) {

            setBackgroundColorHierarchyViewer("avatarCamera");

            // highlight — cel outline on avatar
            removeAllCelOutlines();
            addCelOutline(envir.scene.getObjectByName("avatarCamera"));

            transform_controls.attach(envir.scene.getObjectByName("avatarCamera"));

            //envir.renderer.setClearColor( 0xeeeeee, 1);

            // Steve can not be deleted
            transform_controls.size = 0.3;
            //transform_controls.children[3].handleGizmos.XZY[0][0].visible = false;
            return;
        }
    }


    // If only one object is intersected
    if (intersects.length === 1) {

        if(!intersects[0].locked)
            selectorMajor(event, intersects[0], "2");
        return;
    }

    // More than one objects intersected

    var prevSelected = typeof transform_controls.object != 'undefined' ? transform_controls.object.name : null;
    var selectNext = false;


    var i = 0;

    for (i = 0; i < intersects.length; i++) {
        selectNext = prevSelected === intersects[i].name;
        if (selectNext)
            break;
    }

    if (!selectNext || i === intersects.length - 1)
        i = -1;



    if(!intersects[0].locked)
        selectorMajor(event, intersects[i + 1], "3");


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
    transform_controls.attach(objectSel);

    if (objectSel.name !== "avatarCamera") {
        setTransformControlsSize();
    }

    transform_controls.setMode("translate");

    removeAllCelOutlines();
    addCelOutline(objectSel);
}

function selectorMajor(event, objectSel, whocalls) {

    if (event.button === 0) {

        showObjectControlsPanel(objectSel.asset_name || objectSel.name || 'Object Controls');

        document.getElementById('translate-switch').checked = true;
        document.getElementById('rotate-switch').disabled = false;
        document.getElementById('rotate-switch-label').style = "inherit";

        document.getElementById('scale-switch').disabled = false;
        document.getElementById('scale-switch-label').style = "inherit";
      
        // set the selected color of the hierarchy viewer
        setBackgroundColorHierarchyViewer(objectSel.uuid);

        transform_controls.attach(objectSel);

        // Move light direction
        let lightDirectionalLightSpotMover = () => {

            if (!transform_controls.object)
                return;

            if (!transform_controls.object.parentLight)
                return;

            transform_controls.object.parentLight.target.position.setFromMatrixPosition(transform_controls.object.matrix);
            transform_controls.object.parentLight.target.updateMatrixWorld();
        };

        let lightSpotLightMover = () => {

            if (!transform_controls.object)
                return;

            if (!transform_controls.object.parentLight)
                return;

            // transform_controls.object.parentLight.target.position.setFromMatrixPosition(transform_controls.object.matrix);
            // transform_controls.object.parentLight.target.updateMatrixWorld();
            envir.scene.traverse(function (child) {
                if (child.light != undefined)
                    if (child.light.name === transform_controls.object.name)
                        child.update();
            }
            );
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
            var modeSwitch = document.getElementById(transform_controls.getMode() + "-switch");
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
    let intersected = findIntersected(event);

    if (intersected.length === 0)
        return;

       
    // Check if right-clicked is the one selected already with left-click
    if (transform_controls.object && intersected[0].name === transform_controls.object.name) {
        showProperties(event, intersected[0]);
    }


}

// Right click raycast operations
function showProperties(event, object) {

    if (object.name === "Camera3Dmodel") {
        alert("Do not right click the camera or its front part");
        return;
    }

    //var objectParent  = inters.object.parent;
    var name = object.name;
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
    var re = new RegExp('^$|^-?(\\d+)?(\\.?\\d*)?$');
    return value.match(re) === null ? 0 : Number(value);
  }

/**
 * Poi video properties
 *
 * @param event
 * @param name
 */
function displaySunProperties(event, name) {

    var ppPropertiesDiv = document.getElementById("popUpSunPropertiesDiv");

    clearAndUnbind(null, null, "sunShadowCameraBottom");
    clearAndUnbind(null, null, "sunShadowCameraTop");
    clearAndUnbind(null, null, "sunShadowCameraLeft");
    clearAndUnbind(null, null, "sunShadowCameraRight");
    clearAndUnbind(null, null, "sunshadowMapHeight");
    clearAndUnbind(null, null, "sunshadowMapWidth");
    clearAndUnbind(null, null, "sunshadowBias");
    clearAndUnbind(null, null, "castShadow");
    clearAndUnbind(null, null, "sunSky");

    // Re-get elements after clearAndUnbind (clone+replace creates new DOM nodes)
    var chbox = document.getElementById('castShadow');
    var chboxsunSky = document.getElementById('sunSky');
    var textCameraBottom = document.getElementById('sunShadowCameraBottom');
    var textCameraTop = document.getElementById('sunShadowCameraTop');
    var textCameraLeft = document.getElementById('sunShadowCameraLeft');
    var textCameraRight = document.getElementById('sunShadowCameraRight');
    var textMapHeight = document.getElementById('sunshadowMapHeight');
    var textMapWidth = document.getElementById('sunshadowMapWidth');
    var textBias = document.getElementById('sunshadowBias');
    var sunColor = document.getElementById('sunColor');
    var sunIntensity = document.getElementById('sunIntensity');

    var sceneObj = envir.scene.getObjectByName(name);
    chbox.checked = !!sceneObj.castingShadow;
    chboxsunSky.checked = !!sceneObj.sunSky;

    textCameraBottom.value = sceneObj.shadowCameraBottom;
    textCameraTop.value = sceneObj.shadowCameraTop;
    textCameraLeft.value = sceneObj.shadowCameraLeft;
    textCameraRight.value = sceneObj.shadowCameraRight;
    textMapHeight.value = sceneObj.shadowMapHeight;
    textMapWidth.value = sceneObj.shadowMapWidth;
    textBias.value = sceneObj.shadowBias;
    chbox.value = sceneObj.castingShadow;
    chboxsunSky.value = sceneObj.sunSky;

    // Show Selection (inside floating panel or at mouse position)
    if (ppPropertiesDiv) ppPropertiesDiv.style.display = '';

    sunColor.addEventListener("change", function (e) {
        sunColor.value = transform_controls.object.children[0].material.color.getHexString();
        sunColor.style.background = "#" + sunColor.value;
        saveChanges();
    });
    sunIntensity.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).lightintensity = sanitizeInputValue(this.value);
        saveChanges();
    });

    textCameraBottom.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).shadowCameraBottom = sanitizeInputValue(this.value);
        saveChanges();
    });
    textCameraTop.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).shadowCameraTop = sanitizeInputValue(this.value);
        saveChanges();
    });
    textCameraLeft.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).shadowCameraLeft = sanitizeInputValue(this.value);
        saveChanges();
    });
    textCameraRight.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).shadowCameraRight = sanitizeInputValue(this.value);
        saveChanges();
    });
    textMapHeight.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).shadowMapHeight = sanitizeInputValue(this.value);
        saveChanges();
    });
    textMapWidth.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).shadowMapWidth = sanitizeInputValue(this.value);
        saveChanges();
    });
    textBias.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).shadowBias = sanitizeInputValue(this.value);
        saveChanges();
    });
    chbox.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).castingShadow = this.checked ? 1 : 0;
        saveChanges();
    });
    chboxsunSky.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).sunSky = this.checked ? 1 : 0;
        saveChanges();
    });
}

// LAMP PROPERTIES DIV show
function displayLampProperties(event, name) {

    var ppPropertiesDiv = document.getElementById("popUpLampPropertiesDiv");

    clearAndUnbind(null, null, "lampShadowCameraBottom");
    clearAndUnbind(null, null, "lampShadowCameraTop");
    clearAndUnbind(null, null, "lampShadowCameraLeft");
    clearAndUnbind(null, null, "lampShadowCameraRight");
    clearAndUnbind(null, null, "lampshadowMapHeight");
    clearAndUnbind(null, null, "lampshadowMapWidth");
    clearAndUnbind(null, null, "lampshadowBias");
    clearAndUnbind(null, null, "lampcastShadow");

    // Re-get elements after clearAndUnbind (clone+replace creates new DOM nodes)
    var chbox = document.getElementById('lampcastShadow');
    var textCameraBottom = document.getElementById('lampShadowCameraBottom');
    var textCameraTop = document.getElementById('lampShadowCameraTop');
    var textCameraLeft = document.getElementById('lampShadowCameraLeft');
    var textCameraRight = document.getElementById('lampShadowCameraRight');
    var textMapHeight = document.getElementById('lampshadowMapHeight');
    var textMapWidth = document.getElementById('lampshadowMapWidth');
    var textBias = document.getElementById('lampshadowBias');
    var lampColor = document.getElementById('lampColor');
    var lampPower = document.getElementById('lampPower');
    var lampDecay = document.getElementById('lampDecay');
    var lampDistance = document.getElementById('lampDistance');

    var sceneObj = envir.scene.getObjectByName(name);
    textCameraBottom.value = sceneObj.lampshadowCameraBottom;
    textCameraTop.value = sceneObj.lampshadowCameraTop;
    textCameraLeft.value = sceneObj.lampshadowCameraLeft;
    textCameraRight.value = sceneObj.lampshadowCameraRight;
    textMapHeight.value = sceneObj.lampshadowMapHeight;
    textMapWidth.value = sceneObj.lampshadowMapWidth;
    textBias.value = sceneObj.lampshadowBias;
    chbox.value = sceneObj.lampcastingShadow;

    textCameraBottom.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).lampshadowCameraBottom = sanitizeInputValue(this.value);
        saveChanges();
    });
    textCameraTop.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).lampshadowCameraTop = sanitizeInputValue(this.value);
        saveChanges();
    });
    textCameraLeft.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).lampshadowCameraLeft = sanitizeInputValue(this.value);
        saveChanges();
    });
    textCameraRight.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).lampshadowCameraRight = sanitizeInputValue(this.value);
        saveChanges();
    });
    textMapHeight.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).lampshadowMapHeight = sanitizeInputValue(this.value);
        saveChanges();
    });
    textMapWidth.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).lampshadowMapWidth = sanitizeInputValue(this.value);
        saveChanges();
    });
    textBias.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).lampshadowBias = sanitizeInputValue(this.value);
        saveChanges();
    });
    chbox.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).lampcastingShadow = this.checked ? 1 : 0;
        saveChanges();
    });

    lampColor.value = transform_controls.object.children[0].material.color.getHexString();
    lampPower.value = transform_controls.object.power;
    lampDecay.value = transform_controls.object.decay;
    lampDistance.value = transform_controls.object.distance;

    lampColor.addEventListener("change", function (e) {
        lampColor.value = transform_controls.object.children[0].material.color.getHexString();
        lampColor.style.background = "#" + lampColor.value;
        saveChanges();
    });

    // Show Selection (inside floating panel)
    if (ppPropertiesDiv) ppPropertiesDiv.style.display = '';
}


// SPOT PROPERTIES DIV show
function displaySpotProperties(event, name) {

    var ppPropertiesDiv = document.getElementById("popUpSpotPropertiesDiv");

    var spotTargetObject = document.getElementById("spotTargetObject");
    spotTargetObject.innerText = '';

    var hierViewer = document.getElementById('hierarchy-viewer');
    for (var i = 0; i < hierViewer.childNodes.length; i++) {
        var id_Hierarchy = hierViewer.childNodes[i].id;
        if (!id_Hierarchy) continue;
        var scene_object = envir.scene.getObjectByName(id_Hierarchy);
        if (!scene_object) continue;
        spotTargetObject.appendChild(new Option(scene_object.name));
    }

    var spotColor = document.getElementById("spotColor");
    spotColor.value = transform_controls.object.children[0].material.color.getHexString();
    document.getElementById("spotPower").value = transform_controls.object.power;
    document.getElementById("spotDecay").value = transform_controls.object.decay;
    document.getElementById("spotDistance").value = transform_controls.object.distance;
    document.getElementById("spotAngle").value = transform_controls.object.angle;
    document.getElementById("spotPenumbra").value = transform_controls.object.penumbra;
    document.getElementById("spotTargetObject").value = transform_controls.object.target.name;

    spotColor.style.background = "#" + spotColor.value;

    // Show Selection (inside floating panel)
    if (ppPropertiesDiv) ppPropertiesDiv.style.display = '';
}



// AMBIENT PROPERTIES DIV show
function displayAmbientProperties(event, name) {

    var ppPropertiesDiv = document.getElementById("popUpAmbientPropertiesDiv");

    var hierViewer = document.getElementById('hierarchy-viewer');
    for (var i = 0; i < hierViewer.childNodes.length; i++) {
        var id_Hierarchy = hierViewer.childNodes[i].id;
        var scene_object = envir.scene.getObjectByName(id_Hierarchy);
    }

    var ambientColor = document.getElementById("ambientColor");
    ambientColor.value = transform_controls.object.children[0].material.color.getHexString();
    document.getElementById("ambientIntensity").value = transform_controls.object.intensity;

    ambientColor.style.background = "#" + ambientColor.value;

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

    var popUpDoorPropertiesDiv = document.getElementById("popUpDoorPropertiesDiv");
    var popupDoorSelect = document.getElementById("popupDoorSelect");
    var updName = name;

    // Save the previous door values (trigger change before unbinding)
    popupDoorSelect.dispatchEvent(new Event('change'));

    clearAndUnbind(null, null, "popupDoorSelect");

    var sceneObj = envir.scene.getObjectByName(updName);
    if (sceneObj.sceneID_target)
        popupDoorSelect.value = sceneObj.sceneID_target;
    else
        popupDoorSelect.value = "Default";

    if (envir.scene.getObjectByName(name).doorName_target)
        popupDoorSelect.value = envir.scene.getObjectByName(name).doorName_target + " at " +
            envir.scene.getObjectByName(name).sceneName_target;

    // Show Selection (inside floating panel)
    if (popUpDoorPropertiesDiv) popUpDoorPropertiesDiv.style.display = '';

    popupDoorSelect.addEventListener("change", function (e) {
        if (this.value != "Default" && this.value)
            envir.scene.getObjectByName(updName).sceneID_target = this.value;
        saveChanges();
    });

}




function displayLinkProperties(event, name) {

    var popUpLinkPropertiesDiv = document.getElementById("popUpLinkPropertiesDiv");
    var popupLinkSelect = document.getElementById("poi_link_text");

    clearAndUnbind(null, null, "poi_link_text");
    if (envir.scene.getObjectByName(name).poi_link_url)
        popupLinkSelect.value = envir.scene.getObjectByName(name).poi_link_url;

    // Show Selection (inside floating panel)
    if (popUpLinkPropertiesDiv) popUpLinkPropertiesDiv.style.display = '';

    popupLinkSelect.addEventListener("change", function (e) {
        if (this.value)
            envir.scene.getObjectByName(name).poi_link_url = this.value;
        saveChanges();
    });

}


// ----------------- Aux ----------------------------------------------------------
// /**
//  * Clear Door properties
//  */
// function clearAndUnbindDoorProperties() {
//     // Clear past options
//
//     // door target
//     var popupDoorSelect = document.getElementById("popupDoorSelect");
//     for (var i = popupDoorSelect.options.length; i-->0;)
//         popupDoorSelect.options[i] = null;
//
//     // door source title & remove listeners
//     jQuery("#doorid").val( null ).unbind('change');
//
//     jQuery("#popupDoorSelect").unbind('change');
// }



/**
 * A general mechanism to clear popup and unbind any handlers
 */
function clearAndUnbind(selectName = null, idstr = null, chkboxname = null) {

    // Clone+replace to remove all event listeners from an element
    function _unbindElement(id) {
        var el = document.getElementById(id);
        if (el) {
            var clone = el.cloneNode(true);
            el.parentNode.replaceChild(clone, el);
        }
    }

    // Clear the select DOM
    if (selectName) {
        var selectDOM = document.getElementById(selectName);
        if (selectDOM) {
            for (var i = selectDOM.options.length; i-- > 0;)
                selectDOM.options[i] = null;
        }
        _unbindElement(selectName);
    }

    // Id (if any) unbind onchange listener
    if (idstr) {
        var idEl = document.getElementById(idstr);
        if (idEl) idEl.value = '';
        _unbindElement(idstr);
    }

    // Checkbox clear and unbind (if any)
    if (chkboxname) {
        var chbox = document.getElementById(chkboxname);
        if (chbox) chbox.checked = false;
        _unbindElement(chkboxname);
    }

}




/**
 * Get active meshes for raycast picking method
 *
 * @returns {Array}
 */
function getActiveMeshes() {

    let activeMeshes = [];

    // ToDo: Is it possible to avoid traversing scene object in each drag event?
    envir.scene.traverse(function (child) {
        if (child.hasOwnProperty('isSelectableMesh')) {
            activeMeshes.push(child);
        }
    });

    return activeMeshes;
}


function raylineVisualize(raycasterPick) {

    let geolinecast = new THREE.Geometry();

    let c = 10000;
    geolinecast.vertices.push(raycasterPick.ray.origin,
        new THREE.Vector3((raycasterPick.ray.origin.x - c * raycasterPick.ray.direction.x),
            (raycasterPick.ray.origin.y - c * raycasterPick.ray.direction.y),
            (raycasterPick.ray.origin.z - c * raycasterPick.ray.direction.z))
    );

    let myBulletLine = new THREE.Line(geolinecast, new THREE.LineBasicMaterial({ color: 0x0000ff }));
    myBulletLine.name = 'rayLine';

    envir.scene.add(myBulletLine);


    // This will force scene to update and show the line
    envir.scene.getObjectByName('orbitCamera').position.x += 0.1;

    setTimeout(function () {
        envir.scene.getObjectByName('orbitCamera').position.x -= 0.1;
    }, 1500);

    // Remove the line
    setTimeout(function () {
        envir.scene.remove(envir.scene.getObjectByName('rayLine'));
    }, 1500);


}


// Create options for a select
function createOption(container, txt, val, sel, dis, backgr) {
    var option = document.createElement("option");
    option.text = txt;
    option.value = val;
    option.selected = sel;
    option.disabled = dis;
    option.style.background = backgr;
    //option.style.fontSize = "9pt";
    container.add(option);
}


function showWholePopupDiv(popUpDiv, event) {

    var el = (popUpDiv instanceof HTMLElement) ? popUpDiv : popUpDiv[0];
    el.style.display = '';

    var rect = document.getElementById('vr_editor_main_div').getBoundingClientRect();
    el.style.left = (1 + event.clientX - rect.left) + 'px';

    if (el.id === 'popUpMarkerPropertiesDiv') {
        el.style.top = '0';
        el.style.left = '0';
        el.style.bottom = 'auto';
    } else {
        el.style.top = (event.clientY - rect.top) + 'px';
    }

    event.preventDefault();
}

/**
 //  * Poi image text properties
 //  *
 //  * @param event
 //  * @param name
 //  */
function displayPoiImageTextProperties(event, name) {

    var ppPropertiesDiv = document.getElementById("popUpPoiImageTextPropertiesDiv");
    var chboxImg = document.getElementById("poi_image_desc_checkbox");
    var setTitle = document.getElementById('poi_image_title_text');
    var setDesc = document.getElementById('poi_image_desc_text');

    clearAndUnbind(null, null, "poi_image_desc_checkbox");
    clearAndUnbind(null, null, "poi_image_title_text");
    clearAndUnbind(null, null, "poi_image_desc_text");

    // Re-get elements after clearAndUnbind (clone+replace creates new DOM nodes)
    chboxImg = document.getElementById("poi_image_desc_checkbox");
    setTitle = document.getElementById('poi_image_title_text');
    setDesc = document.getElementById('poi_image_desc_text');

    var sceneObj = envir.scene.getObjectByName(name);
    chboxImg.checked = sceneObj.poi_img_content != null;
    setDesc.style.display = sceneObj.poi_img_content != null ? "block" : "none";

    setDesc.value = sceneObj.poi_img_content;
    setTitle.value = sceneObj.poi_img_title;

    // Show Selection (inside floating panel)
    if (ppPropertiesDiv) ppPropertiesDiv.style.display = '';

    chboxImg.addEventListener("change", function (e) {
        if (this.checked) {
            if (envir.scene.getObjectByName(name).poi_img_content != null) {
                envir.scene.getObjectByName(name).poi_img_content = setDesc.value;
            } else {
                envir.scene.getObjectByName(name).poi_img_content = '';
            }
            setDesc.style.display = "block";
        } else {
            setDesc.style.display = "none";
            envir.scene.getObjectByName(name).poi_img_content = null;
        }
        envir.scene.getObjectByName(name).poi_img_title = setTitle.value;
        saveChanges();
    });

    setTitle.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).poi_img_title = this.value;
        saveChanges();
    });

    setDesc.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).poi_img_content = this.value;
        saveChanges();
    });
}
//
// /**
//  * Poi video properties
//  *
//  * @param event
//  * @param name
//  */

function saveChanges() {

    let save_scene_btn = document.getElementById("save-scene-button");
    if (save_scene_btn.classList.contains("LinkDisabled")){
        return;
    }

    save_scene_btn.innerHTML = "Saving...";
    save_scene_btn.classList.add("LinkDisabled");
    document.getElementById("compileGameBtn").disabled = true;

    // Export using the new VrodosSceneExporter
    let exporter = new VrodosSceneExporter();
    document.getElementById('vrodos_scene_json_input').value = exporter.parse(envir.scene);

    //let test = document.getElementById('vrodos_scene_json_input').value;

    //var json = JSON.stringify(test);

    //console.log(test);

    vrodos_saveSceneAjax();
    //.forEach(element => console.log(element));
}
function displayPoiVideoProperties(event, name) {

    var ppPropertiesDiv = document.getElementById("popUpPoiVideoPropertiesDiv");

    clearAndUnbind(null, null, "poi_video_reward_checkbox");
    clearAndUnbind(null, null, "poi_video_focus_dropdown");
    clearAndUnbind(null, null, "focus_X");
    clearAndUnbind(null, null, "focus_Z");

    // Re-get elements after clearAndUnbind (clone+replace creates new DOM nodes)
    var chbox = document.getElementById("poi_video_reward_checkbox");
    var setFocusX = document.getElementById('focus_X');
    var setFocusZ = document.getElementById('focus_Z');

    var sceneObj = envir.scene.getObjectByName(name);
    chbox.checked = sceneObj.follow_camera == 1;

    setFocusX.value = sceneObj.follow_camera_x;
    setFocusZ.value = sceneObj.follow_camera_z;

    setFocusX.disabled = sceneObj.follow_camera == 0;
    setFocusZ.disabled = sceneObj.follow_camera == 0;

    // Show Selection (inside floating panel)
    if (ppPropertiesDiv) ppPropertiesDiv.style.display = '';

    chbox.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).follow_camera = this.checked ? 1 : 0;

        if (this.checked) {
            envir.scene.getObjectByName(name).follow_camera_x = setFocusX.value;
            envir.scene.getObjectByName(name).follow_camera_z = setFocusZ.value;
        }

        setFocusX.disabled = !this.checked;
        setFocusZ.disabled = !this.checked;

        saveChanges();
    });

    setFocusX.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).follow_camera_x = this.value;
        saveChanges();
    });

    setFocusZ.addEventListener("change", function (e) {
        envir.scene.getObjectByName(name).follow_camera_z = this.value;
        saveChanges();
    });
}
