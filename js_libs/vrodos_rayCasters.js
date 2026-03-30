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


// Reusable raycaster and mouse vector (avoid allocations per event)
var _reusableRaycaster = new THREE.Raycaster();
var _reusableMouse = new THREE.Vector2();

// raycasting for picking objects
function raycasterSetter(event) {

    // calculate mouse position in normalized device coordinates
    var mainDiv = document.getElementById('vr_editor_main_div');
    var rect = mainDiv.getBoundingClientRect();
    _reusableMouse.x = ((event.clientX - rect.left) / mainDiv.clientWidth) * 2 - 1;
    _reusableMouse.y = - ((event.clientY - rect.top) / mainDiv.clientHeight) * 2 + 1;

    // Main Raycast object
    _reusableRaycaster.setFromCamera(_reusableMouse, avatarControlsEnabled ? envir.cameraAvatar : envir.cameraOrbit);

    return _reusableRaycaster;
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
 * Sun properties
 *
 * @param event
 * @param name
 */
function displaySunProperties(event, name) {
    let ppPropertiesDiv = document.getElementById("popUpSunPropertiesDiv");
    if (!ppPropertiesDiv) return;

    let sceneObj = envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    let chbox = document.getElementById('castShadow');
    let chboxsunSky = document.getElementById('sunSky');
    let textCameraBottom = document.getElementById('sunShadowCameraBottom');
    let textCameraTop = document.getElementById('sunShadowCameraTop');
    let textCameraLeft = document.getElementById('sunShadowCameraLeft');
    let textCameraRight = document.getElementById('sunShadowCameraRight');
    let textMapHeight = document.getElementById('sunshadowMapHeight');
    let textMapWidth = document.getElementById('sunshadowMapWidth');
    let textBias = document.getElementById('sunshadowBias');
    let sunColor = document.getElementById('sunColor');
    let sunIntensity = document.getElementById('sunIntensity');

    if (chbox) chbox.checked = !!sceneObj.castingShadow;
    if (chboxsunSky) chboxsunSky.checked = !!sceneObj.sunSky;

    if (textCameraBottom) textCameraBottom.value = sceneObj.shadowCameraBottom;
    if (textCameraTop) textCameraTop.value = sceneObj.shadowCameraTop;
    if (textCameraLeft) textCameraLeft.value = sceneObj.shadowCameraLeft;
    if (textCameraRight) textCameraRight.value = sceneObj.shadowCameraRight;
    if (textMapHeight) textMapHeight.value = sceneObj.shadowMapHeight;
    if (textMapWidth) textMapWidth.value = sceneObj.shadowMapWidth;
    if (textBias) textBias.value = sceneObj.shadowBias;

    if (sunColor && sceneObj.children && sceneObj.children[0] && sceneObj.children[0].material) {
        sunColor.value = sceneObj.children[0].material.color.getHexString();
        sunColor.style.background = "#" + sunColor.value;
    }

    if (sunIntensity) sunIntensity.value = sceneObj.lightintensity || 1;

    ppPropertiesDiv.style.display = '';
}

// LAMP PROPERTIES DIV show
function displayLampProperties(event, name) {
    let ppPropertiesDiv = document.getElementById("popUpLampPropertiesDiv");
    if (!ppPropertiesDiv) return;

    let sceneObj = envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    let chbox = document.getElementById('lampcastShadow');
    let textCameraBottom = document.getElementById('lampShadowCameraBottom');
    let textCameraTop = document.getElementById('lampShadowCameraTop');
    let textCameraLeft = document.getElementById('lampShadowCameraLeft');
    let textCameraRight = document.getElementById('lampShadowCameraRight');
    let textMapHeight = document.getElementById('lampshadowMapHeight');
    let textMapWidth = document.getElementById('lampshadowMapWidth');
    let textBias = document.getElementById('lampshadowBias');
    let lampColor = document.getElementById('lampColor');
    let lampPower = document.getElementById('lampPower');
    let lampDecay = document.getElementById('lampDecay');
    let lampDistance = document.getElementById('lampDistance');

    if (chbox) chbox.checked = !!sceneObj.lampcastingShadow;

    if (textCameraBottom) textCameraBottom.value = sceneObj.lampshadowCameraBottom;
    if (textCameraTop) textCameraTop.value = sceneObj.lampshadowCameraTop;
    if (textCameraLeft) textCameraLeft.value = sceneObj.lampshadowCameraLeft;
    if (textCameraRight) textCameraRight.value = sceneObj.lampshadowCameraRight;
    if (textMapHeight) textMapHeight.value = sceneObj.lampshadowMapHeight;
    if (textMapWidth) textMapWidth.value = sceneObj.lampshadowMapWidth;
    if (textBias) textBias.value = sceneObj.lampshadowBias;

    if (lampColor && sceneObj.children && sceneObj.children[0] && sceneObj.children[0].material) {
        lampColor.value = sceneObj.children[0].material.color.getHexString();
        lampColor.style.background = "#" + lampColor.value;
    }

    if (lampPower) lampPower.value = sceneObj.power;
    if (lampDecay) lampDecay.value = sceneObj.decay;
    if (lampDistance) lampDistance.value = sceneObj.distance;

    ppPropertiesDiv.style.display = '';
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
    let popUpDoorPropertiesDiv = document.getElementById("popUpDoorPropertiesDiv");
    let popupDoorSelect = document.getElementById("popupDoorSelect");
    if (!popupDoorSelect || !popUpDoorPropertiesDiv) return;

    let sceneObj = envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    if (sceneObj.sceneID_target) {
        popupDoorSelect.value = sceneObj.sceneID_target;
    } else if (sceneObj.doorName_target) {
        popupDoorSelect.value = sceneObj.doorName_target + " at " + sceneObj.sceneName_target;
    } else {
        popupDoorSelect.value = "Default";
    }

    popUpDoorPropertiesDiv.style.display = '';
}

function displayLinkProperties(event, name) {
    let popUpLinkPropertiesDiv = document.getElementById("popUpLinkPropertiesDiv");
    let popupLinkSelect = document.getElementById("poi_link_text");
    if (!popupLinkSelect || !popUpLinkPropertiesDiv) return;

    let sceneObj = envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    if (sceneObj.poi_link_url) {
        popupLinkSelect.value = sceneObj.poi_link_url;
    } else {
        popupLinkSelect.value = "";
    }

    popUpLinkPropertiesDiv.style.display = '';
}

/**
 * Initializes persistent event listeners for light and properties panels
 * so that we don't need to bind/unbind them on every click.
 */
function initPersistentPropertyListeners() {
    
    const setProp = (prop, isCheckbox, sanitize = false) => {
        return function () {
            if (transform_controls && transform_controls.object) {
                let val = isCheckbox ? (this.checked ? 1 : 0) : this.value;
                if (sanitize) val = sanitizeInputValue(val);
                transform_controls.object[prop] = val;
                saveChanges();
            }
        };
    };

    // --- Sun Properties ---
    const sunColor = document.getElementById('sunColor');
    if (sunColor) {
        sunColor.addEventListener('change', function () {
            if (transform_controls && transform_controls.object && transform_controls.object.children[0]) {
                sunColor.value = transform_controls.object.children[0].material.color.getHexString();
                sunColor.style.background = "#" + sunColor.value;
                saveChanges();
            }
        });
    }

    const sunIntensity = document.getElementById('sunIntensity');
    if (sunIntensity) sunIntensity.addEventListener('change', setProp('lightintensity', false, true));

    ['Bottom', 'Top', 'Left', 'Right'].forEach(side => {
        let el = document.getElementById('sunShadowCamera' + side);
        if (el) el.addEventListener('change', setProp('shadowCamera' + side, false, true));
    });

    ['Height', 'Width'].forEach(dim => {
        let el = document.getElementById('sunshadowMap' + dim);
        if (el) el.addEventListener('change', setProp('shadowMap' + dim, false, true));
    });

    let elSunBias = document.getElementById('sunshadowBias');
    if (elSunBias) elSunBias.addEventListener('change', setProp('shadowBias', false, true));

    let elCast = document.getElementById('castShadow');
    if (elCast) elCast.addEventListener('change', setProp('castingShadow', true));

    let elSky = document.getElementById('sunSky');
    if (elSky) elSky.addEventListener('change', setProp('sunSky', true));

    // --- Lamp Properties ---
    const lampColor = document.getElementById('lampColor');
    if (lampColor) {
        lampColor.addEventListener('change', function () {
            if (transform_controls && transform_controls.object && transform_controls.object.children[0]) {
                lampColor.value = transform_controls.object.children[0].material.color.getHexString();
                lampColor.style.background = "#" + lampColor.value;
                saveChanges();
            }
        });
    }

    ['Power', 'Decay', 'Distance'].forEach(prop => {
        let el = document.getElementById('lamp' + prop);
        if (el) el.addEventListener('change', setProp(prop.toLowerCase(), false, true));
    });

    ['Bottom', 'Top', 'Left', 'Right'].forEach(side => {
        let el = document.getElementById('lampShadowCamera' + side);
        if (el) el.addEventListener('change', setProp('lampshadowCamera' + side, false, true));
    });

    ['Height', 'Width'].forEach(dim => {
        let el = document.getElementById('lampshadowMap' + dim);
        if (el) el.addEventListener('change', setProp('lampshadowMap' + dim, false, true));
    });

    let elLampBias = document.getElementById('lampshadowBias');
    if (elLampBias) elLampBias.addEventListener('change', setProp('lampshadowBias', false, true));

    let elLampCast = document.getElementById('lampcastShadow');
    if (elLampCast) elLampCast.addEventListener('change', setProp('lampcastingShadow', true));

    // --- Door & Link Properties ---
    const popupDoorSelect = document.getElementById("popupDoorSelect");
    if (popupDoorSelect) {
        popupDoorSelect.addEventListener("change", function () {
            if (transform_controls && transform_controls.object && this.value !== "Default" && this.value) {
                transform_controls.object.sceneID_target = this.value;
                saveChanges();
            }
        });
    }

    const popupLinkSelect = document.getElementById("poi_link_text");
    if (popupLinkSelect) {
        popupLinkSelect.addEventListener("change", function () {
            if (transform_controls && transform_controls.object && this.value) {
                transform_controls.object.poi_link_url = this.value;
                saveChanges();
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
                if (this.checked) {
                    transform_controls.object.poi_img_content = setDesc && setDesc.value ? setDesc.value : '';
                    if (setDesc) setDesc.style.display = "block";
                } else {
                    if (setDesc) setDesc.style.display = "none";
                    transform_controls.object.poi_img_content = null;
                }
                if (setTitle) transform_controls.object.poi_img_title = setTitle.value;
                saveChanges();
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
                transform_controls.object.follow_camera = this.checked ? 1 : 0;
                
                if (this.checked) {
                    if (setFocusX) transform_controls.object.follow_camera_x = setFocusX.value;
                    if (setFocusZ) transform_controls.object.follow_camera_z = setFocusZ.value;
                }
                
                if (setFocusX) setFocusX.disabled = !this.checked;
                if (setFocusZ) setFocusZ.disabled = !this.checked;
                
                saveChanges();
            }
        });
    }

    if (setFocusX) setFocusX.addEventListener("change", setProp('follow_camera_x', false));
    if (setFocusZ) setFocusZ.addEventListener("change", setProp('follow_camera_z', false));
}

// Call once when script loads
initPersistentPropertyListeners();

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
 * Poi image text properties
 *
 * @param event
 * @param name
 */
function displayPoiImageTextProperties(event, name) {
    let ppPropertiesDiv = document.getElementById("popUpPoiImageTextPropertiesDiv");
    if (!ppPropertiesDiv) return;

    let sceneObj = envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    let chboxImg = document.getElementById("poi_image_desc_checkbox");
    let setTitle = document.getElementById('poi_image_title_text');
    let setDesc = document.getElementById('poi_image_desc_text');

    if (chboxImg) chboxImg.checked = sceneObj.poi_img_content != null;
    if (setDesc) {
        setDesc.style.display = sceneObj.poi_img_content != null ? "block" : "none";
        setDesc.value = sceneObj.poi_img_content;
    }
    if (setTitle) setTitle.value = sceneObj.poi_img_title;

    ppPropertiesDiv.style.display = '';
}

function saveChanges() {
    if (envir && envir.isSceneLoading) {
        return Promise.resolve();
    }

    let save_scene_btn = document.getElementById("save-scene-button");
    if (save_scene_btn.classList.contains("LinkDisabled")){
        return (typeof vrodos_whenSceneSaveSettles === 'function') ? vrodos_whenSceneSaveSettles() : Promise.resolve();
    }

    save_scene_btn.innerHTML = "Saving...";
    save_scene_btn.classList.add("LinkDisabled");
    document.getElementById("compileGameBtn").disabled = true;

    // Export using the new VrodosSceneExporter
    let exporter = new VrodosSceneExporter();
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
    let ppPropertiesDiv = document.getElementById("popUpPoiVideoPropertiesDiv");
    if (!ppPropertiesDiv) return;

    let sceneObj = envir.scene.getObjectByName(name);
    if (!sceneObj) return;

    let chbox = document.getElementById("poi_video_reward_checkbox");
    let setFocusX = document.getElementById('focus_X');
    let setFocusZ = document.getElementById('focus_Z');

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
