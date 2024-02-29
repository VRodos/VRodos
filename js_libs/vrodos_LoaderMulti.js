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
                    document.getElementById("enableGeneralChatCheckbox").checked = JSON.parse(resources3D[name]);
                    envir.scene.enableGeneralChat = JSON.parse(resources3D[name]);
                }

                
                if (name === 'enableAvatar'){
                    document.getElementById("enableAvatarCheckbox").checked = JSON.parse(resources3D[name]);
                    envir.scene.enableAvatar = JSON.parse(resources3D[name]);
                }

                if (name === 'disableMovement'){
                    document.getElementById("moveDisableCheckbox").checked = JSON.parse(resources3D[name]);
                    envir.scene.disableMovement = JSON.parse(resources3D[name]);
                }

                if (name === 'backgroundStyleOption'){
                    envir.scene.bcg_selection = JSON.parse(resources3D[name]);

                    let color_sel = document.getElementById('jscolorpick');
                    let custom_img_sel = document.getElementById('img_upload_bcg');
                    let preset_sel = document.getElementById('presetsBcg');

                    let img_thumb = document.getElementById('uploadImgThumb');

                
                    switch (envir.scene.bcg_selection){
                        case 0:
                            document.getElementById("sceneNone").checked = true;
                            custom_img_sel.disabled = true;
                            preset_sel.disabled = true;
                            color_sel.disabled = true;
    
                            color_sel.hidden = true;
                            preset_sel.hidden = true;
                            custom_img_sel.hidden = true;
                            img_thumb.hidden = true;
                            break;
                        case 1:
                            document.getElementById("sceneColorRadio").checked = true;
                            color_sel.disabled = false;
                            preset_sel.disabled = true;
                            custom_img_sel.disabled = true;
    
                            color_sel.hidden = false;
                            preset_sel.hidden = true;
                            custom_img_sel.hidden = true;
                            img_thumb.hidden = true;
                            break;
                        case 2:
                            document.getElementById("sceneSky").checked = true;
                            custom_img_sel.disabled = true;
                            preset_sel.disabled = false;
                            color_sel.disabled = true;
    
                            color_sel.hidden = true;
                            preset_sel.hidden = false;
                            custom_img_sel.hidden = true;
                            img_thumb.hidden = true;
                            envir.scene.backgroundPresetOption = resources3D["backgroundPresetOption"];
                            envir.scene.preset_selection = resources3D["backgroundPresetOption"];
                         
                            for(let index = 0; index < preset_sel.options.length;index++){
                                if(preset_sel.options[index].value == resources3D["backgroundPresetOption"] ){
                                    preset_sel.options[index].selected = true;
                                }
                            }
                            break;
                        case 3:
                            document.getElementById("sceneCustomImage").checked = true;
                            custom_img_sel.disabled = false;
                            preset_sel.disabled = true;
                            color_sel.disabled = true;
    
                            color_sel.hidden = true;
                            preset_sel.hidden = true;
                            custom_img_sel.hidden = false;
    
                            if (resources3D["backgroundImagePath"]  && resources3D["backgroundImagePath"] !=0 ){
                                img_thumb.src = resources3D["backgroundImagePath"];
                                img_thumb.hidden = false;
                            }
                            break;
                    }
                    envir.scene.img_bcg_path = resources3D["backgroundImagePath"];
                    envir.scene.bcg_selection = JSON.parse(resources3D["backgroundStyleOption"]);
                }
                   
                if (name === 'ClearColor' || name === 'toneMappingExposure' | name === 'enableEnvironmentTexture')
                    return;

                // Fog is not parsed here but in LightsPawn_Loader
                if (name === 'fogtype' || name === 'fogcolor' || name === 'fognear' || name === 'fogfar' || name === 'fogdensity') {
                    return;
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
                            //jQuery("#progressWrapper").get(0).style.visibility= "hidden";
                        },
                        // called while loading is progressing
                        function (xhr) {


                        },
                        // called when loading has errors
                        function (error) {
                            console.log('Can not load camera GLB, loading error happened. Error 1595', error);
                        }
                    );

                } else { // GLB 3D models

                    if ((resources3D[name]['glb_id'] !== "" && resources3D[name]['glb_id'] !== undefined) || resources3D[name]['category_slug'] == "video") {

                        jQuery.ajax({
                            url: my_ajax_object_fetchasset.ajax_url,
                            type: 'POST',
                            data: {
                                'action': 'vrodos_fetch_glb_asset_action',
                                'asset_id': resources3D[name]['asset_id']
                            },
                            success: function (res) {

                                let resourcesGLB = JSON.parse(res);
                                let glbURL = resourcesGLB['glbURL'];
                                if (resources3D[name]['category_slug'] == "video")
                                    glbURL = pluginPath + '/assets/objects/tv_flat_scaled_rotated.glb';


                                // Instantiate a loader
                                jQuery("#progressWrapper").get(0).style.visibility = "visible";
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
                            },
                            // Ajax error
                            error: function (xhr, ajaxOptions, thrownError) {

                                alert("Could not fetch GLB asset. Probably deleted ? " + name);

                                console.log("Ajax Fetch Asset: ERROR: 189" + thrownError);
                            }
                        });

                    } 
                    else if (name =="SceneSettings") {

                      
                       if (resources3D[name].enableGeneralChat) {
                            document.getElementById("enableGeneralChatCheckbox").checked = JSON.parse(resources3D[name].enableGeneralChat);
                            envir.scene.enableGeneralChat = JSON.parse(resources3D[name].enableGeneralChat);
                        }

                        if (resources3D[name].enableAvatar) {
                            document.getElementById("enableAvatarCheckbox").checked = JSON.parse(resources3D[name].enableAvatar);
                            envir.scene.enableAvatar = JSON.parse(resources3D[name].enableAvatar);
                        }

                        if (resources3D[name].disableMovement){
                            document.getElementById("moveDisableCheckbox").checked = JSON.parse(resources3D[name].disableMovement);
                            envir.scene.disableMovement = JSON.parse(resources3D[name].disableMovement);      
                        }

                        if (resources3D[name].fogtype){
                            document.getElementById('FogType').value = resources3D[name].fogtype;

                            if (resources3D[name].fogtype == "none") {
                                document.getElementById('RadioNoFog').checked = true;
                            } else if ( resources3D[name].fogtype == "linear") {
                                document.getElementById('RadioLinearFog').checked = true;
                            } else if ( resources3D[name].fogtype == "exponential") {
                                document.getElementById('RadioExponentialFog').checked =true;
                            }
                        }
                        else{
                            document.getElementById('RadioNoFog').checked = true;
                        }
                        if (resources3D[name].fogcolor){
                            document.getElementById('jscolorpickFog').jscolor.fromString(resources3D[name].fogcolor);
                        }
                        if (resources3D[name].fogfar){
                            document.getElementById('FogFar').value = JSON.parse(resources3D[name].fogfar);
                        }
                        if (resources3D[name].fognear){
                            document.getElementById('FogNear').value = JSON.parse(resources3D[name].fognear);
                        }
                        if (resources3D[name].fogdensity){
                            document.getElementById('FogDensity').value = JSON.parse(resources3D[name].fogdensity);
                        }

                        //updateFog("undo");

                        if (resources3D[name].backgroundStyleOption){
                            envir.scene.bcg_selection = JSON.parse(resources3D[name].backgroundStyleOption);
                            envir.scene.backgroundStyleOption = JSON.parse(resources3D[name].backgroundStyleOption);
                         
                              
                            let color_sel = document.getElementById('jscolorpick');
                            let custom_img_sel = document.getElementById('img_upload_bcg');
                            let preset_sel = document.getElementById('presetsBcg');
        
                            let img_thumb = document.getElementById('uploadImgThumb');
        
                        
                            switch (envir.scene.bcg_selection){
                                case 0:
                                    document.getElementById("sceneNone").checked = true;
                                    custom_img_sel.disabled = true;
                                    preset_sel.disabled = true;
                                    color_sel.disabled = true;
            
                                    var hex = rgbToHex(255, 255, 255);
                                    //envir.renderer.setClearColor(hex);
                                    envir.scene.background = new THREE.Color(hex);
                                    color_sel.hidden = true;
                                    preset_sel.hidden = true;
                                    custom_img_sel.hidden = true;
                                    img_thumb.hidden = true;
                                    break;
                                case 1:
                                    document.getElementById("sceneColorRadio").checked = true;
                                    color_sel.disabled = false;
                                    preset_sel.disabled = true;
                                    custom_img_sel.disabled = true;
            
                                    color_sel.hidden = false;
                                    preset_sel.hidden = true;
                                    custom_img_sel.hidden = true;
                                    img_thumb.hidden = true;
                                    break;
                                case 2:
                                    document.getElementById("sceneSky").checked = true;
                                    custom_img_sel.disabled = true;
                                    preset_sel.disabled = false;
                                    color_sel.disabled = true;
            
                                    color_sel.hidden = true;
                                    preset_sel.hidden = false;
                                    custom_img_sel.hidden = true;
                                    img_thumb.hidden = true;
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
                                    preset_sel.disabled = true;
                                    color_sel.disabled = true;
            
                                    color_sel.hidden = true;
                                    preset_sel.hidden = true;
                                    custom_img_sel.hidden = false;
            
                                    if (resources3D[name].backgroundImagePath  && resources3D[name].backgroundImagePath !=0 ){
                                        img_thumb.src = resources3D[name].backgroundImagePath;
                                        img_thumb.hidden = false;
                                    }
                                    break;
                            }
                            envir.scene.img_bcg_path = resources3D[name].backgroundImagePath;
                            envir.scene.bcg_selection = JSON.parse(resources3D[name].backgroundStyleOption);
                            envir.scene.backgroundStyleOption = JSON.parse(resources3D[name].backgroundStyleOption);
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