/**
 * Created by DIMITRIOS on 7/3/2016.
 */

"use strict";

class VRodos_LoaderMulti {

    constructor(who) { };

    load(manager, resources3D, pluginPath) {

        const loader = new THREE.GLTFLoader(manager);
        

        for (let n in resources3D) {

            (function (name) {
                
                if (name === 'enableGeneralChat'){
                    document.getElementById("enableGeneralChatCheckbox").checked = resources3D[name];
                    envir.scene.enableGeneralChat = resources3D[name];
                }

                
                if (name === 'enableAvatar'){
                    document.getElementById("enableAvatarCheckbox").checked = resources3D[name];
                    envir.scene.enableAvatar = resources3D[name];
                }

                if (name === 'disableMovement'){
                    document.getElementById("moveDisableCheckbox").checked = resources3D[name];
                    envir.scene.disableMovement = resources3D[name];
                }

                if (name === 'aframeCollisionMode') {
                    envir.scene.aframeCollisionMode = resources3D[name] || 'auto';
                    let collisionToggle = document.getElementById('aframeCollisionModeCheckbox');
                    if (collisionToggle) {
                        collisionToggle.checked = envir.scene.aframeCollisionMode !== 'off';
                    }
                }

                if (name === 'aframeRenderQuality') {
                    envir.scene.aframeRenderQuality = resources3D[name] || 'standard';
                }

                if (name === 'aframeShadowQuality') {
                    envir.scene.aframeShadowQuality = resources3D[name] || 'medium';
                }

                if (name === 'aframePostFXEnabled') {
                    envir.scene.aframePostFXEnabled = resources3D[name] === true || resources3D[name] === 'true';
                }

                if (name === 'backgroundStyleOption'){
                    envir.scene.backgroundStyleOption = parseInt(resources3D[name]) || 0;
                    envir.scene.bcg_selection = envir.scene.backgroundStyleOption;

                    let color_sel = document.getElementById('jscolorpick');
                    let custom_img_sel = document.getElementById('img_upload_bcg');
                    let preset_sel = document.getElementById('presetsBcg');
                    let preset_ground_toggle = document.getElementById('presetGroundToggle');

                    let img_thumb = document.getElementById('uploadImgThumb');

                    var colorRow = document.getElementById('bcgColorRow');
                    var presetsRow = document.getElementById('bcgPresetsRow');
                    var presetGroundRow = document.getElementById('bcgPresetGroundRow');
                    var imageRow = document.getElementById('bcgImageRow');
                    var horizonDescription = document.getElementById('sceneHorizonDescription');
                    var presetGroundEnabled = resources3D["backgroundPresetGroundEnabled"] !== false;

                    // Hide all rows first
                    colorRow.style.display = 'none';
                    presetsRow.style.display = 'none';
                    if (presetGroundRow) presetGroundRow.style.display = 'none';
                    imageRow.style.display = 'none';
                    if (horizonDescription) {
                        horizonDescription.style.display = 'none';
                        horizonDescription.classList.add('tw-hidden');
                    }
                    color_sel.disabled = true;
                    preset_sel.disabled = true;
                    if (preset_ground_toggle) {
                        preset_ground_toggle.disabled = true;
                        preset_ground_toggle.checked = presetGroundEnabled;
                    }
                    custom_img_sel.disabled = true;
                    if (typeof setBackgroundPresetGroundEnabled === 'function') {
                        setBackgroundPresetGroundEnabled(presetGroundEnabled);
                    }

                    switch (envir.scene.bcg_selection){
                        case 0:
                            document.getElementById("sceneNone").checked = true;
                            if (horizonDescription) {
                                horizonDescription.style.display = 'block';
                                horizonDescription.classList.remove('tw-hidden');
                            }
                            break;
                        case 1:
                            document.getElementById("sceneColorRadio").checked = true;
                            color_sel.disabled = false;
                            colorRow.style.display = 'flex';
                            break;
                        case 2:
                            document.getElementById("sceneSky").checked = true;
                            preset_sel.disabled = false;
                            presetsRow.style.display = 'flex';
                            if (preset_ground_toggle) preset_ground_toggle.disabled = false;
                            if (presetGroundRow) presetGroundRow.style.display = 'flex';
                            envir.scene.backgroundPresetOption = resources3D["backgroundPresetOption"];
                            for(let index = 0; index < preset_sel.options.length;index++){
                                if(preset_sel.options[index].value == resources3D["backgroundPresetOption"] ){
                                    preset_sel.options[index].selected = true;
                                }
                            }
                            break;
                        case 3:
                            document.getElementById("sceneCustomImage").checked = true;
                            custom_img_sel.disabled = false;
                            imageRow.style.display = 'flex';
                            if (resources3D["backgroundImagePath"]  && resources3D["backgroundImagePath"] !=0 ){
                                img_thumb.src = resources3D["backgroundImagePath"];
                                img_thumb.hidden = false;
                            }
                            break;
                    }
                    envir.scene.img_bcg_path = resources3D["backgroundImagePath"];
                    envir.scene.backgroundStyleOption = resources3D["backgroundStyleOption"];
                }
                   
                if (name === 'ClearColor' | name === 'enableEnvironmentTexture')
                    return;

                // Fog is not parsed here but in LightsPawn_Loader
                if (name === 'fogCategory') {
                    if (resources3D[name]){
                        //document.getElementById('FogType').value = resources3D[name].fogtype;
                        var linear_elems = document.getElementsByClassName('linearElement');
                        var expo_elems = document.getElementsByClassName('exponentialElement');
                        var color_elems = document.getElementsByClassName('colorElement');

                        if (resources3D[name] === "0") {
                            document.getElementById('RadioNoFog').checked = true;
                            for (var i = 0; i < linear_elems.length; ++i) {
                                linear_elems[i].style.display="none";
                            }
                            for (var i = 0; i < expo_elems.length; ++i) {
                                expo_elems[i].style.display="none";
                            }
                            for (var i = 0; i < color_elems.length; ++i) {
                                color_elems[i].style.display="none";
                            }
                            document.getElementById("FogValues").style.display="none";
                            document.getElementById('FogType').value = "none";
                        } else if ( resources3D[name] === "1") {
                            document.getElementById('RadioLinearFog').checked = true;
                            document.getElementById("FogValues").style.display="flex";
                            for (var i = 0; i < linear_elems.length; ++i) {
                                linear_elems[i].style.display="flex";
                            }
                            for (var i = 0; i < expo_elems.length; ++i) {
                                expo_elems[i].style.display="none";
                            }
                            for (var i = 0; i < color_elems.length; ++i) {
                                color_elems[i].style.display="flex";
                            }
                            document.getElementById('FogType').value = "linear";
                        } else if ( resources3D[name] === "2") {
                            document.getElementById('FogType').value = "exponential";
                            for (var i = 0; i < linear_elems.length; ++i) {
                                linear_elems[i].style.display="none";
                            }
                            for (var i = 0; i < expo_elems.length; ++i) {
                                expo_elems[i].style.display="flex";
                            }
                            for (var i = 0; i < color_elems.length; ++i) {
                                color_elems[i].style.display="flex";
                            }
                            document.getElementById("FogValues").style.display="flex";
                            document.getElementById('RadioExponentialFog').checked =true;
                        }
                    }
                    else{
                        document.getElementById('RadioNoFog').checked = true;
                    }
                    // if (resources3D["fogcolor"]){
                    //     document.getElementById('jscolorpickFog').jscolor.fromString("#" + resources3D["fogcolor"]);
                    // }
                    // if (resources3D["fogfar"]){
                    //     document.getElementById('FogFar').value = JSON.parse(resources3D["fogfar"]);
                    // }
                    // if (resources3D["fognear"]){
                    //     document.getElementById('FogNear').value = JSON.parse(resources3D["fognear"]);
                    // }
                    // if (resources3D["fogdensity"]){
                    //     document.getElementById('FogDensity').value = JSON.parse(resources3D["fogdensity"]);
                    // }
                    //updateFog("undo");
                }

                // Lights are in a different loop
                if (resources3D[name]['category_name']) {
                    if (resources3D[name]['category_name'].startsWith("light") || resources3D[name]['category_name'].startsWith("pawn"))
                        return;
                }
                // Load Camera object
                if (name == 'avatarCamera') {

                    loader.load(pluginPath + "/assets/Steve/camera.glb",
                       
                        // called when the resource is loaded
                        function (objectMain) {    
                            let object = objectMain.scene.children[0];
                            object.name = "Camera3Dmodel";
                            object.children[0].name = "Camera3DmodelMesh";

                            // Make a shield around Steve
                            let geometry = new THREE.BoxGeometry(4.2, 4.2, 4.2);
                            geometry.name = "SteveShieldGeometry";
                            let material = new THREE.MeshBasicMaterial({
                                color: 0xaaaaaa,
                                transparent: true,
                                opacity: 0.2,
                                visible: false
                            });

                            let steveShieldMesh = new THREE.Mesh(geometry, material);
                            steveShieldMesh.name = 'SteveShieldMesh';
                            //--------------------------

                            object.add(steveShieldMesh);
                            object.renderOrder = 1;
                      
                            envir.scene.add(object);
        
                            //TODO: to delete after veryfying the redundancy 
                            envir.scene.getObjectByName("avatarCamera").position.set(
                                resources3D[name].position[0],
                                resources3D[name].position[1],
                                resources3D[name].position[2]);
                       
                            envir.scene.getObjectByName("avatarCamera").position.set(
                                resources3D[name]['trs']['translation'][0],
                                resources3D[name]['trs']['translation'][1],
                                resources3D[name]['trs']['translation'][2]);

                            envir.scene.getObjectByName("avatarCamera").rotation.set(
                                resources3D[name]['trs']['rotation'][0],
                                resources3D[name]['trs']['rotation'][1],
                                resources3D[name]['trs']['rotation'][2]);
                            // else{
                            //     envir.scene.getObjectByName("avatarCamera").position.set(0,0.2,0);
                            //     envir.scene.getObjectByName("avatarCamera").rotatiob.set(0,0,0);

                            // }
                            
                            // console.log(resources3D[name].position);


                        
                            
    
                            envir.setCamMeshToAvatarControls();

                            //object = setObjectProperties(object.scene, name, resources3D);
                            //object.isSelectableMesh = true;
                            //envir.scene.add(object);
                            //document.getElementById("progressWrapper").style.visibility = "hidden";
                        },
                        // called while loading is progressing
                        function (xhr) {


                        },
                        // called when loading has errors
                        function (error) {
                            console.log('Can not load camera GLB, loading error happened. Error 1595', error);
                        }
                    );

                } else if (resources3D[name]['category_slug'] === 'image') { // Flat image plane

                    const imageUrl = resources3D[name]['image_path'];
                    if (!imageUrl) {
                        envir.loadedObjectsCount++;
                    } else {
                        // Support both scene-load format (pos/rot/scale flat arrays)
                        // and drag-and-drop format (trs.translation/rotation/scale)
                        const trs = resources3D[name].trs;
                        const pos = resources3D[name].position || (trs && trs.translation) || [0, 0, 0];
                        const rot = resources3D[name].rotation || (trs && trs.rotation)    || [0, 0, 0];
                        const scl = resources3D[name].scale    || (trs && trs.scale)       || [1, 1, 1];

                        const geometry = new THREE.PlaneGeometry(2, 2);
                        const texture  = new THREE.TextureLoader().load(imageUrl);
                        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
                        let object     = new THREE.Mesh(geometry, material);
                        object = setObjectProperties(object, name, resources3D);
                        object.isSelectableMesh = true;
                        object.position.set(pos[0], pos[1], pos[2]);
                        object.rotation.set(rot[0], rot[1], rot[2]);
                        object.scale.set(scl[0], scl[1], scl[2]);
                        envir.scene.add(object);
                        envir.loadedObjectsCount++;

                        // When dragged onto canvas (manager.onLoad won't fire — no GLTF items),
                        // manually attach controls, update hierarchy, and save.
                        if (trs) {
                            transform_controls.attach(object);
                            removeAllCelOutlines();
                            addCelOutline(object);
                            selected_object_name = name;
                            setTransformControlsSize();
                            if (typeof addInHierarchyViewer === 'function') addInHierarchyViewer(object);
                            if (typeof triggerAutoSave === 'function') triggerAutoSave();
                            if (typeof setDatGuiInitialVales === 'function') setDatGuiInitialVales(object);
                            document.getElementById("progressWrapper").style.visibility = "hidden";
                        }
                    }

                } else { // GLB 3D models

                    if ((resources3D[name]['glb_id'] !== "" && resources3D[name]['glb_id'] !== undefined) || resources3D[name]['category_slug'] == "video") {

                        fetch( my_ajax_object_fetchasset.ajax_url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                'action': 'vrodos_fetch_glb_asset_action',
                                'asset_id': resources3D[name]['asset_id']
                            })
                        })
                        .then( function (response) { return response.text(); })
                        .then( function (res) {

                                let resourcesGLB = JSON.parse(res);
                                let glbURL = resourcesGLB['glbURL'];
                                if (resources3D[name]['category_slug'] == "video")
                                    glbURL = pluginPath + '/assets/objects/tv_flat_scaled_rotated.glb';

                                if (!glbURL) {
                                    console.warn("Asset '" + name + "' has no GLB path and will be skipped.");
                                    return;
                                }

                                // Instantiate a loader
                                document.getElementById("progressWrapper").style.visibility = "visible";
                                document.getElementById("result_download").innerHTML = "Loading ...";                               

                                loader.load(glbURL,

                                    // called when the resource is loaded
                                    function (object) {

                                        if (object.animations.length > 0) {
                                            // Animation set
                                            object.mixer = new THREE.AnimationMixer(object.scene);
                                            envir.animationMixers.push(object.mixer);
                                            let action = object.mixer.clipAction(object.animations[0]);
                                            action.play();
                                        }

                                        object = setObjectProperties(object.scene, name, resources3D);

                                        object.isSelectableMesh = true;

                                        // TODO TEMP - HOTFIX THAT SEEMS TO WORK AROUND FIXING RANDOMLY DISAPPEARING 3D OBJECTS FROM EDITOR!
                                        if (object.children ==='') {
                                            object.children = [];
                                        }

                                        envir.scene.add(object);
                                        object.glb_path = glbURL;
                                    },
                                    // called while loading is progressing
                                    function (xhr) {

                                        document.getElementById("result_download").innerHTML = "'" +
                                            resources3D[name]['asset_name'] + "' downloaded " +
                                            Math.floor(xhr.loaded / 104857.6) / 10 + ' Mb';
                                    },
                                    // called when loading has errors
                                    function (error) {
                                        console.log('A GLB loading error happened. Error 1590', error);
                                    }
                                );
                        })
                        .catch( function (err) {
                                alert("Could not fetch GLB asset. Probably deleted ? " + name);
                                console.log("Ajax Fetch Asset: ERROR: 189 " + err);
                        });

                    } 
                    else if (name =="SceneSettings") {

                      
                       if (resources3D[name].enableGeneralChat) {
                            document.getElementById("enableGeneralChatCheckbox").checked = resources3D[name].enableGeneralChat;
                            envir.scene.enableGeneralChat = resources3D[name].enableGeneralChat;
                        }

                        if (resources3D[name].enableAvatar) {
                            document.getElementById("enableAvatarCheckbox").checked = resources3D[name].enableAvatar;
                            envir.scene.enableAvatar = resources3D[name].enableAvatar;
                        }

                        if (resources3D[name].disableMovement){
                            document.getElementById("moveDisableCheckbox").checked = resources3D[name].disableMovement;
                            envir.scene.disableMovement = resources3D[name].disableMovement;
                        }

                        envir.scene.aframeCollisionMode = resources3D[name].aframeCollisionMode || 'auto';
                        let collisionToggle = document.getElementById('aframeCollisionModeCheckbox');
                        if (collisionToggle) {
                            collisionToggle.checked = envir.scene.aframeCollisionMode !== 'off';
                        }

                        envir.scene.aframeRenderQuality = resources3D[name].aframeRenderQuality || 'standard';
                        envir.scene.aframeShadowQuality = resources3D[name].aframeShadowQuality || 'medium';
                        envir.scene.aframePostFXEnabled = resources3D[name].aframePostFXEnabled === true || resources3D[name].aframePostFXEnabled === 'true';

                        if (typeof syncCompileDialogFromSceneSettings === 'function') {
                            syncCompileDialogFromSceneSettings();
                        }
                       

                        if (resources3D[name].fogCategory){
                            //document.getElementById('FogType').value = resources3D[name].fogtype;

                            var linear_elems = document.getElementsByClassName('linearElement');
                            var expo_elems = document.getElementsByClassName('exponentialElement');
                            var color_elems = document.getElementsByClassName('colorElement');
                            
                            

                            if (resources3D[name].fogCategory === "0") {
                                document.getElementById('RadioNoFog').checked = true;
                                document.getElementById('FogType').value = "none";
                                for (var i = 0; i < linear_elems.length; ++i) {
                                    linear_elems[i].style.display="none";
                                }
                                for (var i = 0; i < expo_elems.length; ++i) {
                                    expo_elems[i].style.display="none";
                                }
                                for (var i = 0; i < color_elems.length; ++i) {
                                    color_elems[i].style.display="none";
                                }
                                document.getElementById("FogValues").style.display="none";
                            } else if ( resources3D[name].fogCategory === "1") {
                                document.getElementById('RadioLinearFog').checked = true;
                                document.getElementById('FogType').value = "linear";
                                document.getElementById('jscolorpickFog').jscolor.fromString("#" + resources3D[name].fogcolor);
                                document.getElementById('FogNear').value = JSON.parse(resources3D[name].fognear);
                                document.getElementById('FogFar').value = JSON.parse(resources3D[name].fogfar);
                                for (var i = 0; i < linear_elems.length; ++i) {
                                    linear_elems[i].style.display="flex";
                                }
                                for (var i = 0; i < expo_elems.length; ++i) {
                                    expo_elems[i].style.display="none";
                                }
                                for (var i = 0; i < color_elems.length; ++i) {
                                    color_elems[i].style.display="flex";
                                }
                                document.getElementById("FogValues").style.display="flex";
                            } else if ( resources3D[name].fogCategory === "2") {
                                document.getElementById('FogType').value = "exponential";
                                document.getElementById('RadioExponentialFog').checked =true;
                                document.getElementById('FogDensity').value = JSON.parse(resources3D[name].fogdensity);
                                document.getElementById('jscolorpickFog').jscolor.fromString("#" + resources3D[name].fogcolor);
                                for (var i = 0; i < linear_elems.length; ++i) {
                                    linear_elems[i].style.display="none";
                                }
                                for (var i = 0; i < expo_elems.length; ++i) {
                                    expo_elems[i].style.display="flex";
                                }
                                for (var i = 0; i < color_elems.length; ++i) {
                                    color_elems[i].style.display="flex";
                                }
                                document.getElementById("FogValues").style.display="flex";
                            }
                        }
                        else{
                            document.getElementById('RadioNoFog').checked = true;
                        }
                        if (resources3D[name].fogcolor){
                            document.getElementById('jscolorpickFog').jscolor.fromString("#" + resources3D[name].fogcolor);
                        }
                        if (resources3D[name].fogfar){
                            document.getElementById('FogFar').value = resources3D[name].fogfar;
                        }
                        if (resources3D[name].fognear){
                            document.getElementById('FogNear').value = resources3D[name].fognear;
                        }
                        if (resources3D[name].fogdensity){
                            document.getElementById('FogDensity').value = resources3D[name].fogdensity;
                        }

                        //updateFog("undo");

                        {
                            envir.scene.backgroundStyleOption = (resources3D[name].backgroundStyleOption !== undefined) ? parseInt(resources3D[name].backgroundStyleOption) || 0 : 0;
                         
                              
                            let color_sel = document.getElementById('jscolorpick');
                            let custom_img_sel = document.getElementById('img_upload_bcg');
                            let preset_sel = document.getElementById('presetsBcg');
                            let preset_ground_toggle = document.getElementById('presetGroundToggle');
        
                            let img_thumb = document.getElementById('uploadImgThumb');
        
                        
                            var colorRow = document.getElementById('bcgColorRow');
                            var presetsRow = document.getElementById('bcgPresetsRow');
                            var presetGroundRow = document.getElementById('bcgPresetGroundRow');
                            var imageRow = document.getElementById('bcgImageRow');
                            var horizonDescription = document.getElementById('sceneHorizonDescription');
                            var presetGroundEnabled = resources3D[name].backgroundPresetGroundEnabled !== false;

                            // Hide all rows first
                            colorRow.style.display = 'none';
                            presetsRow.style.display = 'none';
                            if (presetGroundRow) presetGroundRow.style.display = 'none';
                            imageRow.style.display = 'none';
                            if (horizonDescription) {
                                horizonDescription.style.display = 'none';
                                horizonDescription.classList.add('tw-hidden');
                            }
                            color_sel.disabled = true;
                            preset_sel.disabled = true;
                            if (preset_ground_toggle) {
                                preset_ground_toggle.disabled = true;
                                preset_ground_toggle.checked = presetGroundEnabled;
                            }
                            custom_img_sel.disabled = true;
                            if (typeof setBackgroundPresetGroundEnabled === 'function') {
                                setBackgroundPresetGroundEnabled(presetGroundEnabled);
                            }

                            switch (envir.scene.backgroundStyleOption){
                                case 0:
                                    document.getElementById("sceneNone").checked = true;
                                    if (horizonDescription) {
                                        horizonDescription.style.display = 'block';
                                        horizonDescription.classList.remove('tw-hidden');
                                    }
                                    var hex = rgbToHex(255, 255, 255);
                                    envir.scene.background = new THREE.Color(hex);
                                    break;
                                case 1:
                                    document.getElementById("sceneColorRadio").checked = true;
                                    color_sel.disabled = false;
                                    colorRow.style.display = 'flex';
                                    break;
                                case 2:
                                    document.getElementById("sceneSky").checked = true;
                                    preset_sel.disabled = false;
                                    presetsRow.style.display = 'flex';
                                    if (preset_ground_toggle) preset_ground_toggle.disabled = false;
                                    if (presetGroundRow) presetGroundRow.style.display = 'flex';
                                    envir.scene.backgroundPresetOption = resources3D[name].backgroundPresetOption;
                                    envir.scene.preset_selection = resources3D[name].backgroundPresetOption;
                                    for(let index = 0; index < preset_sel.options.length;index++){
                                        if(preset_sel.options[index].value == resources3D[name].backgroundPresetOption){
                                            preset_sel.options[index].selected = true;
                                        }
                                    }
                                    break;
                                case 3:
                                    document.getElementById("sceneCustomImage").checked = true;
                                    custom_img_sel.disabled = false;
                                    imageRow.style.display = 'flex';
                                    if (resources3D[name].backgroundImagePath  && resources3D[name].backgroundImagePath !=0 ){
                                        img_thumb.src = resources3D[name].backgroundImagePath;
                                        img_thumb.hidden = false;
                                    }
                                    break;
                            }
                            envir.scene.img_bcg_path = resources3D[name].backgroundImagePath;
                            envir.scene.bcg_selection = parseInt(resources3D[name].backgroundStyleOption) || 0;
                            envir.scene.backgroundStyleOption = envir.scene.bcg_selection;
                        }
                    }
                    else if (name == 'cameraCoords'){
                        // if (resources3D["SceneSettings"].enableGeneralChat) {
                        //     document.getElementById("enableGeneralChatCheckbox").checked = JSON.parse(resources3D[SceneSettings].enableGeneralChat);
                        //     envir.scene.enableGeneralChat = JSON.parse(resources3D[Settings].enableGeneralChat);
                        // // }
                        // console.log("Unsupported 3D model format. Error 118.");
                        envir.scene.getObjectByName("avatarCamera").position.set(
                            resources3D[name].position[0],
                            resources3D[name].position[1],
                            resources3D[name].position[2]);

                        envir.scene.getObjectByName("avatarCamera").rotation.set(
                            resources3D[name].rotation[0],
                            resources3D[name].rotation[1],
                            resources3D[name].rotation[2]);
                        // console.log("glbID", resources3D[name]['glbID']);
                        // console.log("Unsupported 3D model format: ERROR: 118");
                    }
                }
            })(n);
        }
    }
}

// Set loaded Object or Scene (for GLBs) properties
function setObjectProperties(object, name, resources3D) {

    // Automatically load values that are available
    for (let entry in Object.keys(resources3D[name])) {
        if (!['id', 'translation', 'position', 'rotation', 'scale', 'quaternion', 'children', 'trs'].includes(Object.keys(resources3D[name])[entry])) {
            object[[Object.keys(resources3D[name])[entry]]] = Object.values(resources3D[name])[entry];
        }
    }

    object.isSelectableMesh = true;
    object.isLight = resources3D[name]['isLight'];
    object.fnPath = resources3D[name]['path'];

    // avoid revealing the full path. Use the relative in the saving format.
    object.fnPath = object.fnPath.substring(object.fnPath.indexOf('uploads/') + 7);
    object['glb_id'] = resources3D[name]['glb_id'];

    // Not needed anymore, we dont override textures anymore
    /*if (resources3D[name]['overrideMaterial'] === "true") {
        if (object.children[0].isMesh) {
            object.children[0].material.color.setHex("0x" + resources3D[name]['color']);
            object.children[0].material.emissive.setHex("0x" + resources3D[name]['emissive']);
            object.children[0].material.roughness = parseFloat(resources3D[name]['roughness']);
            object.children[0].material.metalness = parseFloat(resources3D[name]['metalness']);
            object.children[0].material.emissiveIntensity = parseFloat(resources3D[name]['emissiveIntensity']);
            object.children[0].receiveShadow = true;
            object.children[0].castShadow = true;
        }
    }*/
    //============== Video texture ==========


    object.position.set(
        resources3D[name]['trs']['translation'][0],
        resources3D[name]['trs']['translation'][1],
        resources3D[name]['trs']['translation'][2]);

    object.rotation.set(
        resources3D[name]['trs']['rotation'][0],
        resources3D[name]['trs']['rotation'][1],
        resources3D[name]['trs']['rotation'][2]);

    object.scale.set(
        resources3D[name]['trs']['scale'][0],
        resources3D[name]['trs']['scale'][1],
        resources3D[name]['trs']['scale'][2]);


    return object;
}
