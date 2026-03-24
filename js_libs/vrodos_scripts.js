'use strict';

function setTransformControlsSize(){
    if (!transform_controls.object) return;
    let dims = findDimensions(transform_controls.object);
    let sizeT = 0.25 * Math.log((Math.max(...dims) + 1) + 1);
    // Use isFinite to catch NaN and Infinity
    if (!Number.isFinite(sizeT) || sizeT <= 0) sizeT = 0.5;
    transform_controls.setSize(sizeT);
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

    let savBtn = document.getElementById('save-scene-button');
    savBtn.innerHTML = "Saving...";
    savBtn.classList.add("LinkDisabled");
    document.getElementById("compileGameBtn").disabled = true;

    // Export using the new VrodosSceneExporter
    let exporter = new VrodosSceneExporter();
    document.getElementById('vrodos_scene_json_input').value = exporter.parse(envir.scene);

    vrodos_saveSceneAjax();
}

function bcgRadioSelect(option){
    let color_sel = document.getElementById('jscolorpick');
    let custom_img_sel = document.getElementById('img_upload_bcg');
    let preset_sel = document.getElementById('presetsBcg');
    let img_thumb = document.getElementById('uploadImgThumb');

    // Sub-option rows
    let colorRow = document.getElementById('bcgColorRow');
    let presetsRow = document.getElementById('bcgPresetsRow');
    let imageRow = document.getElementById('bcgImageRow');

    // Hide all rows first
    if (colorRow) colorRow.style.display = 'none';
    if (presetsRow) presetsRow.style.display = 'none';
    if (imageRow) imageRow.style.display = 'none';
    if (color_sel) color_sel.disabled = true;
    if (preset_sel) preset_sel.disabled = true;
    if (custom_img_sel) custom_img_sel.disabled = true;

    var val = parseInt(option.value);
    if (isNaN(val)) val = 0;

    // Show the appropriate sub-option row
    if (val === 1 && colorRow) { color_sel.disabled = false; colorRow.style.display = 'flex'; }
    if (val === 2 && presetsRow) { preset_sel.disabled = false; presetsRow.style.display = 'flex'; }
    if (val === 3 && imageRow) { custom_img_sel.disabled = false; imageRow.style.display = 'flex'; }

    // Apply scene changes
    if (envir && envir.scene) {
        switch (val) {
        case 0:
            var hex = rgbToHex(255, 255, 255);
            envir.scene.background = new THREE.Color(hex);
            break;
        case 1:
            var colorVal = color_sel ? color_sel.value : '';
            if (colorVal) envir.scene.background = new THREE.Color("#" + colorVal);
            break;
        case 2:
            envir.scene.preset_selection = preset_sel.value;
            envir.scene.backgroundPresetOption = preset_sel.value;
            break;
        case 3:
            if (envir.scene.img_bcg_path && envir.scene.img_bcg_path != 0) {
                img_thumb.src = envir.scene.img_bcg_path;
                img_thumb.hidden = false;
            }
            break;
        }
        envir.scene.bcg_selection = val;
        envir.scene.backgroundStyleOption = val;
    }
    saveChanges();
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}

function updateFogColorPicker(picker){

    document.getElementById('FogColor').value = picker.toRGBString();
  
    updateFog("editing");
}

function loadFogType() {

    if (document.getElementById('RadioNoFog').checked) {
        envir.scene.fogCategory = 0;
        document.getElementById('FogType').value = "none";
    } else if (document.getElementById('RadioLinearFog').checked) {
        envir.scene.fogCategory = 1;
        document.getElementById('FogType').value = "linear";
    } else if (document.getElementById('RadioExponentialFog').checked) {
        envir.scene.fogCategory = 2;
        document.getElementById('FogType').value = "exponential";
    }

    updateFog("editing");
}
function updateFog(whencalled){

    envir.scene.fogcolor = 0;
    envir.scene.fognear = 0;
    envir.scene.fogfar = 0;
    envir.scene.fogdensity = 0;

    let picker = document.getElementById('jscolorpickFog').jscolor;


    let fogType = document.getElementById('FogType').value;
    let fogNear = document.getElementById('FogNear').value
    let fogFar = document.getElementById('FogFar').value;
    let fogDensity = document.getElementById('FogDensity').value;

    var linear_elems = document.getElementsByClassName('linearElement');
    var expo_elems = document.getElementsByClassName('exponentialElement');
    var color_elems = document.getElementsByClassName('colorElement');

    let colorHex = picker.rgb.map(function(x){             //For each array element
        x = parseInt(x).toString(16);      //Convert to a base16 string
        return (x.length==1) ? "0"+x : x;  //Add zero if we get only one character
    });

    colorHex = colorHex.join("");
    
    envir.scene.fogcolor = colorHex;
    envir.scene.fognear = fogNear;
    envir.scene.fogfar = fogFar;
    envir.scene.fogdensity = fogDensity;
    
    let hex = rgbToHex(picker.rgb[0], picker.rgb[1], picker.rgb[2]);

    if(fogType === 'linear') {
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

    } else if(fogType === 'exponential') {
        document.getElementById("FogValues").style.display="flex";

        for (var i = 0; i < linear_elems.length; ++i) {
            linear_elems[i].style.display="none";
        }
        for (var i = 0; i < expo_elems.length; ++i) {
            expo_elems[i].style.display="flex";
        }
        for (var i = 0; i < color_elems.length; ++i) {
            color_elems[i].style.display="flex";
        }

    } else if(fogType === 'none') {
        if (envir.scene.fog){
            envir.scene.fog = null;
        }

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

    }
    if(whencalled != "undo"){
        saveChanges();
    }
        
        // saveChanges();
}