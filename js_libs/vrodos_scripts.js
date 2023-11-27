'use strict';

function setTransformControlsSize(){

    let dims = findDimensions(transform_controls.object);
    let sizeT = 0.25 * Math.log((Math.max(...dims) + 1)  + 1) ;
    transform_controls.setSize(sizeT );
}

function vrodos_fillin_widget_assettrs( selectedObject ) {
    if (selectedObject) {
        let asset_id = selectedObject.value;
        vrodos_fetch_Assettrs_and_setWidget(asset_id, selectedObject);
    }
}

function unixTimestamp_to_time(tStr) {
    let unix_timestamp = parseInt(tStr);
    let date = new Date(unix_timestamp * 1000);
    let hours = date.getHours();
    let minutes = "0" + date.getMinutes();
    let seconds = "0" + date.getSeconds();
    let formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    return date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear() + ' ' + formattedTime;
}

function rgbToHex(red, green, blue) {
    const rgb = (red << 16) | (green << 8) | (blue << 0);
    return '#' + (0x1000000 + rgb).toString(16).slice(1);
}


function updateClearColorPicker(picker){
    document.getElementById('sceneClearColor').value = picker.toRGBString();
    let hex = rgbToHex(picker.rgb[0], picker.rgb[1], picker.rgb[2]);
    //envir.renderer.setClearColor(hex);
    envir.scene.background = new THREE.Color(hex);
    saveChanges();
}

function saveChanges() {

    let save_scene_btn = document.getElementById("save-scene-button");
    if (save_scene_btn.classList.contains("LinkDisabled")){
        return;
    }

    jQuery('#save-scene-button').html("Saving...").addClass("LinkDisabled");

    // Export using a custom variant of the old deprecated class SceneExporter
    let exporter = new THREE.SceneExporter();
    document.getElementById('vrodos_scene_json_input').value = exporter.parse(envir.scene);

    vrodos_saveSceneAjax();
}

function bcgRadioSelect(option){
    let color_sel = document.getElementById('jscolorpick');
    let custom_img_sel = document.getElementById('img_upload_bcg');
    let preset_sel = document.getElementById('presetsBcg');
    let img_thumb = document.getElementById('uploadImgThumb');


    switch (option.value) {
    case 0:
        custom_img_sel.disabled = true;
        preset_sel.disabled = true;
        color_sel.disabled = true;
        color_sel.hidden = true;
        preset_sel.hidden = true;
        custom_img_sel.hidden = true;
        img_thumb.hidden = true;
        var hex = rgbToHex(255, 255, 255);
        //envir.renderer.setClearColor(hex);
        envir.scene.background = new THREE.Color(hex);
        //document.getElementById('assetback3dcolor').value = "ffffff"
        break;
    case 1: 
        color_sel.disabled = false;
        preset_sel.disabled = true;
        custom_img_sel.disabled = true;
        envir.scene.background = new THREE.Color("#"+document.getElementById('jscolorpick').value);
        color_sel.hidden = false;
        preset_sel.hidden = true;
        custom_img_sel.hidden = true;
        img_thumb.hidden = true;
        break;
    case 2 : 
        custom_img_sel.disabled = true;
        preset_sel.disabled = false;
        color_sel.disabled = true;
        envir.scene.preset_selection = preset_sel.value;
        envir.scene.backgroundPresetOption = preset_sel.value;
        color_sel.hidden = true;
        preset_sel.hidden = false;
        custom_img_sel.hidden = true;
        img_thumb.hidden = true;
        break;
    case 3 : 
        custom_img_sel.disabled = false;
        preset_sel.disabled = true;
        color_sel.disabled = true;
        color_sel.hidden = true;
        preset_sel.hidden = true;
        custom_img_sel.hidden = false;
        img_thumb.hidden = false;

        if (envir.scene.img_bcg_path && envir.scene.img_bcg_path !=0)
        {
           
            //const loader = new THREE.TextureLoader();
            //envir.scene.background = loader.load( envir.scene.img_bcg_path  );
            document.getElementById('uploadImgThumb').src = envir.scene.img_bcg_path;
            document.getElementById('uploadImgThumb').hidden = false;
        }
        break;
        
    }
    envir.scene.bcg_selection = option.value;
    envir.scene.backgroundStyleOption = option.value;
    saveChanges();
}

function updateFogColorPicker(picker){

    document.getElementById('FogColor').value = picker.toRGBString();

    updateFog();
}

function loadFogType() {

    if (document.getElementById('RadioNoFog').checked) {
        document.getElementById('FogType').value = "none";
    } else if (document.getElementById('RadioLinearFog').checked) {
        document.getElementById('FogType').value = "linear";
    } else if (document.getElementById('RadioExponentialFog').checked) {
        document.getElementById('FogType').value = "exponential";
    }

    updateFog();
}

function updateFog(){

    let picker = document.getElementById('jscolorpickFog').jscolor;

    let fogType = document.getElementById('FogType').value;
    let fogNear = document.getElementById('FogNear').value
    let fogFar = document.getElementById('FogFar').value;
    let fogDensity = document.getElementById('FogDensity').value;

    let hex = rgbToHex(picker.rgb[0], picker.rgb[1], picker.rgb[2]);

    if(fogType === 'linear') {
        envir.scene.fog = new THREE.Fog(hex, fogNear, fogFar);
    } else if(fogType === 'exponential') {
        envir.scene.fog = new THREE.FogExp2(hex, fogDensity);
    } else if(fogType === 'none') {
        if (envir.scene.fog){
            envir.scene.fog = null;
            console.log("fog exists");
        } else {
            console.log("fog does not exists");
        }

    }
    triggerAutoSave();
}