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
    let canvasOffset = jQuery('#vr_editor_main_div').offset();
    let w = jQuery(window);
    mouse.x = ((event.clientX - canvasOffset.left + w.scrollLeft()) / envir.vr_editor_main_div.clientWidth) * 2 - 1;
    mouse.y = - ((event.clientY - canvasOffset.top + w.scrollTop()) / envir.vr_editor_main_div.clientHeight) * 2 + 1;

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
function onMouseDoubleClickFocus(event, objectName) {

    if (typeof objectName == 'undefined') {
        objectName = envir.scene.getObjectByName(selected_object_name);
    }

    if (arguments.length === 2) {
        if (envir.scene.getObjectByName(objectName))
            selectorMajor(event, envir.scene.getObjectByName(objectName), "1");
    }

    // This makes the camera (in 3D mode) to go on top of the selected item
    if (!envir.is2d) {
        envir.orbitControls.target.x = transform_controls.object.position.x;
        envir.orbitControls.target.y = transform_controls.object.position.y;
        envir.orbitControls.target.z = transform_controls.object.position.z;
    }



    envir.orbitControls.object.updateProjectionMatrix();
}


/**
 * Detect mouse events
 *
 * @param event
 */
function onLeftMouseDown(event) {

    // console.log("onLeftMouseDown");
    // console.log("transform_controls.dragging", transform_controls.dragging);

    // If doing affine transformations with transform controls, then ignore select
    if (transform_controls.dragging)
        return;


    // Middle click return
    if (event.button === 1)
        return;

    event.preventDefault();
    event.stopPropagation();

    let intersects = findIntersected(event);

    if (intersects.length === 0)
        return;

    if (intersects.length > 0) {

        // If Steve is selected
        if ((intersects[0].name === 'Steve' || intersects[0].name === 'SteveShieldMesh'
            || intersects[0].name === 'SteveMesh') && event.button === 0) {

            setBackgroundColorHierarchyViewer("avatarCamera");

            // highlight
            envir.outlinePass.selectedObjects = intersects[0];

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


        //let selObj = false ? intersects[0].object : ;

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



    selectorMajor(event, intersects[i + 1], "3");


}// onMouseDown


/**
 * Select an object
 *
 * @param event
 * @param inters
 */
function selectorMajor(event, objectSel, whocalls) {

    if (event.button === 0) {

        // set the selected color of the hierarchy viewer
        setBackgroundColorHierarchyViewer(objectSel.name);

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


        if (objectSel.categoryName === "lightSun" ||
            objectSel.categoryName === "lightTargetSpot" ||
            objectSel.categoryName === "lightSpot" ||
            objectSel.categoryName === "lightLamp") {

            // Add event listener for lightSpotHelper


            if (objectSel.categoryName === "lightTargetSpot") {
                transform_controls.domElement.ownerDocument.addEventListener("pointermove", lightDirectionalLightSpotMover);
            }


            if (objectSel.categoryName === "lightSpot") {
                transform_controls.domElement.ownerDocument.addEventListener("pointermove", lightSpotLightMover);
            }

            //transform_controls.children[3].children[0].children[1].visible = false; // 2D ROTATE GIZMO
        } else {

            // Remove event listener when lightSpotHelper is not clicked
            transform_controls.domElement.ownerDocument.removeEventListener("pointermove", lightDirectionalLightSpotMover);
            transform_controls.domElement.ownerDocument.removeEventListener("pointermove", lightSpotLightMover);
        }

        if (objectSel.name === "avatarCamera") {

            // case of selecting by hierarchy viewer

            transform_controls.size = 1;
            transform_controls.visible = false;

            // Can not be deleted
            //transform_controls.children[3].handleGizmos.XZY[0][0].visible = false;


        } else {
            // find dimensions of object in order to resize transform controls
            setTransformControlsSize();
        }


        transform_controls.setMode("translate");


        if (!envir.is2d) {
            jQuery("#" + transform_controls.getMode() + "-switch").click();
        }

        // highlight
        envir.outlinePass.selectedObjects = [objectSel];

        setDatGuiInitialVales(objectSel);
    }
}


// Right Click: Show properties
function contextMenuClick(event) {
    event.preventDefault();
    let intersected = findIntersected(event);

    if (intersected.length === 0)
        return;

    // Check if right-clicked is the one selected already with left-click
    if (intersected[0].name === transform_controls.object.name) {
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
    //console.log(name);

    switch (object.categoryName) {
        case 'Artifact':
            displayArtifactProperties(event, name);
            break;
        case 'Points of Interest (Image-Text)':
            displayPoiImageTextProperties(event, name);
            break;
        case 'Points of Interest (Video)':
            displayPoiVideoProperties(event, name);
            break;
        case 'Door':
            displayDoorProperties(event, name);
            break;
        case 'Marker':
            displayMarkerProperties(event, name);
            break;
        case 'Gate':
            displayGateProperties(event, name);
            break;
        case 'Box':
            displayBoxProperties(event, name);
            break;
        case 'lightSun':
            displaySunProperties(event, name);
            break;
        case 'lightLamp':
            displayLampProperties(event, name);
            break;
        case 'lightSpot':
            displaySpotProperties(event, name);
            break;
        case 'lightAmbient':
            displayAmbientProperties(event, name);
            break;
    }
}

/**
 *  Box label set
 */
function displayBoxProperties(event, nameBoxSource) {

    // Save the previous Box values (in case of  direct mouse click on another Box)
    jQuery("#chemistryGateComponent").trigger("change");

    clearAndUnbind("chemistryGateComponent");

    var ppDiv = document.getElementById("chemistryGatePopupDiv");
    var ppSelect = document.getElementById("chemistryGateComponent");

    // Show Selection
    jQuery("#chemistryGatePopupDiv").show();

    ppDiv.style.left = event.clientX - jQuery('#vr_editor_main_div').offset().left + jQuery(window).scrollLeft() + 'px';
    ppDiv.style.top = event.clientY - jQuery('#vr_editor_main_div').offset().top + jQuery(window).scrollTop() + 'px';

    // Add options
    var option;

    // Prompt "Select"
    option = document.createElement("option");
    option.text = "Select a functional group";
    option.value = "Select a functional group";
    option.selected = true;
    option.disabled = true;
    ppSelect.add(option);

    // Add available Functional Groups from database
    var availFunctionalGroups = ['Various', 'Alcohol', 'Ketone'];


    // Add options for each intersected object
    for (var fgroup of availFunctionalGroups) {
        option = document.createElement("option");
        option.text = fgroup;
        option.value = fgroup;
        option.style.background = "#fff";
        ppSelect.add(option);
    }

    // - Prompt "Cancel" -
    option = document.createElement("option");
    option.text = "Cancel";
    option.value = "Cancel";
    option.style.background = "#b7afaa";
    ppSelect.add(option);
    // -------------------

    // On popup change
    jQuery("#chemistryGateComponent").change(function (e) {

        // Get the value
        var valfgroup = jQuery("#chemistryGateComponent").val();

        if (!valfgroup)
            return;

        if (valfgroup && valfgroup != "Cancel" && valfgroup != "Select") {
            envir.scene.getObjectByName(nameBoxSource).chemical_functional_group = valfgroup.trim();
        }

        jQuery("#chemistryGatePopupDiv").hide();

        clearAndUnbind("chemistryGateComponent");
    });
}

/**
 *  Gate
 *
 * @param event
 * @param nameGateSource
 */
function displayGateProperties(event, nameGateSource) {

    // Save the previous MicroscopeTextbook values (in case of  direct mouse click on another microscope or textbook)
    jQuery("#chemistrySceneSelectComponent").trigger("change");

    clearAndUnbind("chemistrySceneSelectComponent");

    var ppDiv = document.getElementById("chemistrySceneSelectPopupDiv");
    var ppSelect = document.getElementById("chemistrySceneSelectComponent");

    // Show the whole popup div
    showWholePopupDiv(jQuery("#chemistrySceneSelectPopupDiv"), event);


    // Add options
    var option;

    // Prompt "Select"
    option = document.createElement("option");
    option.text = "Select a scene";
    option.value = "Select a scene";
    option.selected = true;
    option.disabled = true;
    ppSelect.add(option);


    //scenesTargetChemistry
    // Add options for each intersected object
    for (var sceneNameAndID of scenesTargetChemistry) {
        option = document.createElement("option");
        option.text = sceneNameAndID.examName;
        option.value = sceneNameAndID.examID;
        option.style.background = "#fff";
        ppSelect.add(option);
    }

    // - Prompt "Cancel" -
    option = document.createElement("option");
    option.text = "Cancel";
    option.value = "Cancel";
    option.style.background = "#b7afaa";
    ppSelect.add(option);
    // -------------------

    // Set from saved value
    if (envir.scene.getObjectByName(nameGateSource).sceneID_target) {

        jQuery("#chemistrySceneSelectComponent").val(
            envir.scene.getObjectByName(nameGateSource).sceneID_target
        );
    }

    //mdc.textfield.MDCTextfield.attachTo(document.getElementById('doorInputTextfield'));

    // On popup change
    jQuery("#chemistrySceneSelectComponent").change(function (e) {

        // Get the value
        var valTargetScene = jQuery("#chemistrySceneSelectComponent").find('option:selected').val();
        var nameTargetScene = jQuery("#chemistrySceneSelectComponent").find('option:selected').text();

        if (!valTargetScene)
            return;

        if (nameTargetScene && nameTargetScene != "Cancel" && nameTargetScene != "Select") {
            envir.scene.getObjectByName(nameGateSource).sceneName_target = nameTargetScene;
            envir.scene.getObjectByName(nameGateSource).sceneID_target = valTargetScene;
        }
        jQuery("#chemistrySceneSelectPopupDiv").hide();

        clearAndUnbind("chemistrySceneSelectComponent");
        //clearAndUnbindMicroscopeTextbookProperties();
    });

}

/**
 *  Artifact properties
 *
 * @param event
 * @param name
 */
function displayArtifactProperties(event, name) {

    // The whole popup div
    var ppPropertiesDiv = jQuery("#popUpArtifactPropertiesDiv");

    // The checkbox only
    var chboxReward = jQuery("#artifact_reward_checkbox");

    var chboxOverrideMaterial = jQuery("#artifact_override_material_checkbox");

    // Save the previous artifact properties values (in case of  direct mouse click on another item)
    chboxReward.trigger("change");

    chboxOverrideMaterial.trigger("change");

    clearAndUnbind(null, null, "artifact_reward_checkbox");

    clearAndUnbind(null, null, "artifact_override_material_checkbox");

    chboxReward.prop('checked', envir.scene.getObjectByName(name).isreward === 1);
    chboxOverrideMaterial.prop('checked', envir.scene.getObjectByName(name).overrideMaterial === "true");

    // Show Selection
    ppPropertiesDiv.show(function () { initPopsVals(); });
    ppPropertiesDiv[0].style.left = event.clientX - jQuery('#vr_editor_main_div').offset().left + jQuery(window).scrollLeft() + 'px';
    ppPropertiesDiv[0].style.top = event.clientY - jQuery('#vr_editor_main_div').offset().top + jQuery(window).scrollTop() + 'px';


}

/**
 * Poi video properties
 *
 * @param event
 * @param name
 */
function displaySunProperties(event, name) {

    // The whole popup div
    var ppPropertiesDiv = jQuery("#popUpSunPropertiesDiv");

    //jQuery("#sunColor")
    jQuery("#sunColor")[0].value = transform_controls.object.children[0].material.color.getHexString();
    jQuery("#sunIntensity")[0].value = transform_controls.object.intensity;

    document.getElementById("sunColor").value = transform_controls.object.children[0].material.color.getHexString();
    jQuery("#sunColor")[0].style.background = "#" + jQuery("#sunColor")[0].value;

    // Show Selection
    ppPropertiesDiv.show();
    ppPropertiesDiv[0].style.left = event.clientX - jQuery('#vr_editor_main_div').offset().left + jQuery(window).scrollLeft() + 'px';
    ppPropertiesDiv[0].style.top = event.clientY - jQuery('#vr_editor_main_div').offset().top + jQuery(window).scrollTop() + 'px';
}

// LAMP PROPERTIES DIV show
function displayLampProperties(event, name) {

    // The whole popup div
    var ppPropertiesDiv = jQuery("#popUpLampPropertiesDiv");

    //jQuery("#sunColor")
    jQuery("#lampColor")[0].value = transform_controls.object.children[0].material.color.getHexString();
    jQuery("#lampPower")[0].value = transform_controls.object.power;
    jQuery("#lampDecay")[0].value = transform_controls.object.decay;
    jQuery("#lampDistance")[0].value = transform_controls.object.distance;

    document.getElementById("lampColor").value = transform_controls.object.children[0].material.color.getHexString();
    jQuery("#lampColor")[0].style.background = "#" + jQuery("#lampColor")[0].value;

    // Show Selection
    ppPropertiesDiv.show();
    ppPropertiesDiv[0].style.left = event.clientX - jQuery('#vr_editor_main_div').offset().left + jQuery(window).scrollLeft() + 'px';
    ppPropertiesDiv[0].style.top = event.clientY - jQuery('#vr_editor_main_div').offset().top + jQuery(window).scrollTop() + 'px';
}


// LAMP PROPERTIES DIV show
function displaySpotProperties(event, name) {

    // The whole popup div
    var ppPropertiesDiv = jQuery("#popUpSpotPropertiesDiv");

    var spotTargetObject = document.getElementById("spotTargetObject");
    spotTargetObject.innerText = null;

    for (var i = 0; i < jQuery('#hierarchy-viewer')[0].childNodes.length; i++) {
        //if (envir.scene.getChildByName(jQuery('#hierarchy-viewer')[0].childNodes[2].id).categoryName ){
        var id_Hierarchy = jQuery('#hierarchy-viewer')[0].childNodes[i].id;
        var scene_object = envir.scene.getObjectByName(id_Hierarchy);
        spotTargetObject.appendChild(new Option(scene_object.name));
        //}
    }


    jQuery("#spotColor")[0].value = transform_controls.object.children[0].material.color.getHexString();
    jQuery("#spotPower")[0].value = transform_controls.object.power;
    jQuery("#spotDecay")[0].value = transform_controls.object.decay;
    jQuery("#spotDistance")[0].value = transform_controls.object.distance;
    jQuery("#spotAngle")[0].value = transform_controls.object.angle;
    jQuery("#spotPenumbra")[0].value = transform_controls.object.penumbra;
    jQuery("#spotTargetObject")[0].value = transform_controls.object.target.name;

    document.getElementById("spotColor").value = transform_controls.object.children[0].material.color.getHexString();
    jQuery("#spotColor")[0].style.background = "#" + jQuery("#spotColor")[0].value;

    // Show Selection
    ppPropertiesDiv.show();
    ppPropertiesDiv[0].style.left = event.clientX - jQuery('#vr_editor_main_div').offset().left + jQuery(window).scrollLeft() + 'px';
    ppPropertiesDiv[0].style.top = event.clientY - jQuery('#vr_editor_main_div').offset().top + jQuery(window).scrollTop() + 'px';
}



// LAMP PROPERTIES DIV show
function displayAmbientProperties(event, name) {

    // The whole popup div
    var ppPropertiesDiv = jQuery("#popUpAmbientPropertiesDiv");

    for (var i = 0; i < jQuery('#hierarchy-viewer')[0].childNodes.length; i++) {
        //if (envir.scene.getChildByName(jQuery('#hierarchy-viewer')[0].childNodes[2].id).categoryName ){
        var id_Hierarchy = jQuery('#hierarchy-viewer')[0].childNodes[i].id;
        var scene_object = envir.scene.getObjectByName(id_Hierarchy);
        //spotTargetObject.appendChild(new Option(scene_object.name));
        //}
    }


    jQuery("#ambientColor")[0].value = transform_controls.object.children[0].material.color.getHexString();
    jQuery("#ambientIntensity")[0].value = transform_controls.object.intensity;

    document.getElementById("ambientColor").value = transform_controls.object.children[0].material.color.getHexString();
    jQuery("#ambientColor")[0].style.background = "#" + jQuery("#ambientColor")[0].value;

    // Show Selection
    ppPropertiesDiv.show();
    ppPropertiesDiv[0].style.left = event.clientX - jQuery('#vr_editor_main_div').offset().left + jQuery(window).scrollLeft() + 'px';
    ppPropertiesDiv[0].style.top = event.clientY - jQuery('#vr_editor_main_div').offset().top + jQuery(window).scrollTop() + 'px';
}




/**
 * Selecting a DoorTarget for the DoorSource
 *
 * @param event
 * @param name
 */
function displayDoorProperties(event, name) {

    var popUpDoorPropertiesDiv = jQuery("#popUpDoorPropertiesDiv");
    //var doorid = jQuery("#doorid");
    var popupDoorSelect = jQuery("#popupDoorSelect");
    jQuery("#popupDoorSelect").unbind('change');
    //var chbox = jQuery("#door_reward_checkbox");
    var updName = name;

    // Save the previous door values (in case of  direct mouse click on another door)
    //doorid.trigger("change");
    popupDoorSelect.trigger("change");

    if (envir.scene.getObjectByName(updName).sceneID_target)
        popupDoorSelect.val(envir.scene.getObjectByName(updName).sceneID_target);
    else
        popupDoorSelect.val("Default");

    //chbox.trigger("change");
    //clearAndUnbind("popupDoorSelect");

    //clearAndUnbind(null, null, "door_reward_checkbox");


    //chbox.prop('checked', envir.scene.getObjectByName(name).isreward == 1);
    // Add change listener
    //chbox.change(function (e) { envir.scene.getObjectByName(name).isreward = this.checked ? 1 : 0; });




    // Add doors from other scenes
    //var doorsFromOtherScenes = [];

    //for (var l=0; l < doorsAll.length; l++)
    //    if (envir.scene.getObjectByName(name).doorName_source !== doorsAll[l].door)
    //        doorsFromOtherScenes.push ( doorsAll[l].door + " at " + doorsAll[l].scene + " (" + doorsAll[l].sceneSlug + ")" );

    // Add options
    //crOption(popupDoorSelect[0]);
    //createOption(popupDoorSelect[0], "Select a door2", "Select a door2", false, false, "#fff");
    //createOption(popupDoorSelect[0], "Select a door2", "Select a door2", false, false, "#fff");
    //for (var doorName of doorsFromOtherScenes )
    //    createOption(popupDoorSelect[0], doorName, doorName, false, false, "#fff");


    // Set doorid from existing values
    //if (envir.scene.getObjectByName(name).doorName_source)
    //    doorid.val(envir.scene.getObjectByName(name).doorName_source);


    if (envir.scene.getObjectByName(name).doorName_target)
        popupDoorSelect.val(envir.scene.getObjectByName(name).doorName_target + " at " +
            envir.scene.getObjectByName(name).sceneName_target);


    // Show Selection
    popUpDoorPropertiesDiv.show();
    popUpDoorPropertiesDiv[0].style.left = event.clientX - jQuery('#vr_editor_main_div').offset().left + jQuery(window).scrollLeft() + 'px';
    popUpDoorPropertiesDiv[0].style.top = event.clientY - jQuery('#vr_editor_main_div').offset().top + jQuery(window).scrollTop() + 'px';

    //window.mdc.textfield.MDCTextfield.attachTo(document.getElementById('doorInputTextfield'));

    //doorid.change(function (e) {
    //    var nameDoorSource_simple = jQuery("#doorid").val();

    // name is the scene object generated automatically e.g.    "mydoora_1231214515"
    // doorName_source is more simplified given by the user  e.g.  "doorToCave"
    //console.log(name);
    //});

    // On popup change


    popupDoorSelect.change(function (e) {
        //var valDoorScene = popupDoorSelect.val();
        //console.log(envir.scene.getObjectByName(name).sceneID_target);
        //console.log(this.value);
        //envir.scene.getObjectByName('scenesInsideVREditor').children;
        //tempFunc.call(this, updName);

        //if (!valDoorScene)
        //    return;

        //if (valDoorScene && valDoorScene != "Select a door") {

        //    var nameDoor_Target = valDoorScene.split(" at ")[0];
        //    var sceneName_Target = valDoorScene.split(" at ")[1];
        if (this.value != "Default" && this.value)
            envir.scene.getObjectByName(updName).sceneID_target = this.value;
        //envir.scene.getObjectByName(name).sceneName_target = this.value;

        saveChanges();
        //
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

    // Clear the select DOM
    if (selectName) {

        var selectDOM = document.getElementById(selectName);
        for (var i = selectDOM.options.length; i-- > 0;)
            selectDOM.options[i] = null;

        // unbind onchange listener
        jQuery("#" + selectName).unbind('change');
    }

    // Id (if any) unbind onchange listener
    if (idstr)
        jQuery("#" + idstr).val(null).unbind('change');

    // Checbox clear and unbind (if any)
    if (chkboxname) {
        var chbox = jQuery("#" + chkboxname);
        chbox.prop('checked', false);
        chbox.unbind('change');     // Remove listeners
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

    popUpDiv.show();
    popUpDiv[0].style.left = 1 + event.clientX - jQuery('#vr_editor_main_div').offset().left + jQuery(window).scrollLeft() + 'px';

    if (popUpDiv.selector === '#popUpMarkerPropertiesDiv') {
        popUpDiv[0].style.top = 0;
        popUpDiv[0].style.left = 0;
        popUpDiv[0].style.bottom = 'auto';
    } else {
        popUpDiv[0].style.top = event.clientY - jQuery('#vr_editor_main_div').offset().top + jQuery(window).scrollTop() + 'px';
    }

    event.preventDefault();
}

/**
 //  * Poi image text properties
 //  *
 //  * @param event
 //  * @param name
 //  */
// function displayPoiImageTextProperties(event, name){
//
//     // The whole popup div
//     var ppPropertiesDiv = jQuery("#popUpPoiImageTextPropertiesDiv");
//
//     // The checkbox only
//     var chbox = jQuery("#poi_image_text_reward_checkbox");
//
//     // Save the previous artifact properties values (in case of  direct mouse click on another item)
//     chbox.trigger("change");
//
//     clearAndUnbind(null, null, "poi_image_text_reward_checkbox");
//
//     chbox.prop('checked', envir.scene.getObjectByName(name).isreward == 1);
//
//     // Show Selection
//     ppPropertiesDiv.show();
//     ppPropertiesDiv[0].style.left = event.clientX - jQuery('#vr_editor_main_div').offset().left + jQuery(window).scrollLeft() + 'px';
//     ppPropertiesDiv[0].style.top  = event.clientY - jQuery('#vr_editor_main_div').offset().top + jQuery(window).scrollTop() + 'px';
//
//     // Add change listener
//     chbox.change(function(e) { envir.scene.getObjectByName(name).isreward = this.checked ? 1 : 0; });
// }
//
// /**
//  * Poi video properties
//  *
//  * @param event
//  * @param name
//  */

function saveChanges() {
    jQuery('#save-scene-button').html("Saving...").addClass("LinkDisabled");

    // Export using a custom variant of the old deprecated class SceneExporter
    let exporter = new THREE.SceneExporter();

    document.getElementById('vrodos_scene_json_input').value = exporter.parse(envir.scene);

    //console.log(document.getElementById('vrodos_scene_json_input').value);

    vrodos_saveSceneAjax();
    //.forEach(element => console.log(element));
}
function displayPoiVideoProperties(event, name) {


    // The whole popup div
    var ppPropertiesDiv = jQuery("#popUpPoiVideoPropertiesDiv");

    // The checkbox only
    var chbox = jQuery("#poi_video_reward_checkbox");
    //var popupFocusSelect = jQuery("#poi_video_focus_dropdown");

    var setFocusX = document.getElementById('focus_X');
    var setFocusZ = document.getElementById('focus_Z');


    var sliderFocusX = jQuery("#focus_X");
    var sliderFocusZ = jQuery("#focus_Z");
    // Save the previous artifact properties values (in case of  direct mouse click on another item)
    //chbox.trigger("change");
    //popupFocusSelect.trigger("change");

    //sliderFocusX.trigger("change");
    //sliderFocusZ.trigger("change");
    //sliderFocusX.slider('value', -50);


    clearAndUnbind(null, null, "poi_video_reward_checkbox");

    clearAndUnbind(null, null, "poi_video_focus_dropdown");

    clearAndUnbind(null, null, "focus_X");

    clearAndUnbind(null, null, "focus_Z");

    chbox.prop('checked', envir.scene.getObjectByName(name).isreward == 1);

    setFocusX.value = envir.scene.getObjectByName(name).hv_penalty;
    setFocusZ.value = envir.scene.getObjectByName(name).natural_penalty;


    //console.log(setFocusX.value);



    sliderFocusX.prop('disabled', envir.scene.getObjectByName(name).isreward == 0);
    sliderFocusZ.prop('disabled', envir.scene.getObjectByName(name).isreward == 0);

    // Show Selection
    ppPropertiesDiv.show();
    ppPropertiesDiv[0].style.left = event.clientX - jQuery('#vr_editor_main_div').offset().left + jQuery(window).scrollLeft() + 'px';
    ppPropertiesDiv[0].style.top = event.clientY - jQuery('#vr_editor_main_div').offset().top + jQuery(window).scrollTop() + 'px';



    // Add change listener
    chbox.change(function (e) {


        envir.scene.getObjectByName(name).isreward = this.checked ? 1 : 0;

        if (this.checked) {
            envir.scene.getObjectByName(name).hv_penalty = setFocusX.value;
            envir.scene.getObjectByName(name).natural_penalty = setFocusZ.value;
            //console.log(envir.scene.getObjectByName(name).hv_penalty);
        }

        sliderFocusX.prop("disabled", (!this.checked));
        sliderFocusZ.prop("disabled", (!this.checked));
        var sceneJson = document.getElementById("vrodos_scene_json_input").value;

        saveChanges();



    });
    //sliderFocusRight.prop("disabled", true);
    //sliderFocusUp.prop("disabled", true);



    sliderFocusX.change(function (e) {
        //var valDoorScene = popupDoorSelect.val();
        //console.log(envir.scene.getObjectByName(name).sceneID_target);
        envir.scene.getObjectByName(name).hv_penalty = this.value;
        //console.log(this.value);
        saveChanges();

    });

    sliderFocusZ.change(function (e) {
        //var valDoorScene = popupDoorSelect.val();
        //console.log(envir.scene.getObjectByName(name).sceneID_target);
        envir.scene.getObjectByName(name).natural_penalty = this.value;
        //console.log(this.value);
        saveChanges();

    });

    /*
    popupFocusSelect.change(function (e) {
        //var valDoorScene = popupDoorSelect.val();
        //console.log(envir.scene.getObjectByName(name).sceneID_target);
        console.log(this.value);
        envir.scene.getObjectByName(name).isreward = this.value;
        //envir.scene.getObjectByName('scenesInsideVREditor').children;
        //tempFunc.call(this, updName);

        //if (!valDoorScene)
        //    return;

        //if (valDoorScene && valDoorScene != "Select a door") {

        //    var nameDoor_Target = valDoorScene.split(" at ")[0];
        //    var sceneName_Target = valDoorScene.split(" at ")[1];
        //if (this.value != "Default" && this.value)
        //    envir.scene.getObjectByName(updName).sceneID_target = this.value;
        //envir.scene.getObjectByName(name).sceneName_target = this.value;

        //
    });
    */
}
