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
        return (typeof vrodos_whenSceneSaveSettles === 'function') ? vrodos_whenSceneSaveSettles() : Promise.resolve();
    }

    let savBtn = document.getElementById('save-scene-button');
    savBtn.innerHTML = "Saving...";
    savBtn.classList.add("LinkDisabled");
    document.getElementById("compileGameBtn").disabled = true;

    // Export using the new VrodosSceneExporter
    let exporter = new VrodosSceneExporter();
    document.getElementById('vrodos_scene_json_input').value = exporter.parse(envir.scene);

    return vrodos_saveSceneAjax();
}

function setBackgroundPresetSelection(presetValue) {
    if (!envir || !envir.scene) return;

    envir.scene.preset_selection = presetValue;
    envir.scene.backgroundPresetOption = presetValue;
    envir.scene.bcg_selection = 2;
    envir.scene.backgroundStyleOption = 2;
}

function setBackgroundPresetGroundEnabled(isEnabled) {
    if (!envir || !envir.scene) return;

    envir.scene.backgroundPresetGroundEnabled = !!isEnabled;
}

function handleBackgroundPresetChange(selectElement) {
    if (!selectElement) return;

    setBackgroundPresetSelection(selectElement.value);

    let sceneSkyRadio = document.getElementById('sceneSky');
    if (sceneSkyRadio) sceneSkyRadio.checked = true;

    saveChanges();
}

function handleBackgroundPresetGroundToggle(checkboxElement) {
    if (!checkboxElement) return;

    setBackgroundPresetGroundEnabled(checkboxElement.checked);
    saveChanges();
}

function toggleAframeCollisionMode(isEnabled) {
    if (!envir || !envir.scene) return;

    envir.scene.aframeCollisionMode = isEnabled ? 'auto' : 'off';
    saveChanges();
}

function syncBackgroundStyleDescription(selectedValue) {
    const horizonDescription = document.getElementById('sceneHorizonDescription');
    if (!horizonDescription) return;

    let val = selectedValue;
    if (val === undefined || val === null || val === '') {
        const radioMap = { 'sceneNone': 0, 'sceneColorRadio': 1, 'sceneSky': 2, 'sceneCustomImage': 3 };
        for (const [id, value] of Object.entries(radioMap)) {
            if (document.getElementById(id)?.checked) {
                val = value;
                break;
            }
        }
    }

    val = parseInt(val, 10) || 0;
    const isVisible = val === 0;
    
    horizonDescription.style.display = isVisible ? 'block' : 'none';
    horizonDescription.classList.toggle('tw-hidden', !isVisible);
}

function bcgRadioSelect(option) {
    const els = {
        color: document.getElementById('jscolorpick'),
        image: document.getElementById('img_upload_bcg'),
        presets: document.getElementById('presetsBcg'),
        presetToggle: document.getElementById('presetGroundToggle'),
        thumb: document.getElementById('uploadImgThumb'),
        // Rows
        colorRow: document.getElementById('bcgColorRow'),
        presetsRow: document.getElementById('bcgPresetsRow'),
        presetGroundRow: document.getElementById('bcgPresetGroundRow'),
        imageRow: document.getElementById('bcgImageRow'),
        horizonDesc: document.getElementById('sceneHorizonDescription')
    };

    // 1. Reset all state
    [els.colorRow, els.presetsRow, els.presetGroundRow, els.imageRow, els.horizonDesc].forEach(el => {
        if (el) el.style.display = 'none';
    });
    if (els.horizonDesc) els.horizonDesc.classList.add('tw-hidden');
    [els.color, els.presets, els.presetToggle, els.image].forEach(el => {
        if (el) el.disabled = true;
    });

    const val = parseInt(option.value, 10) || 0;
    syncBackgroundStyleDescription(val);

    // 2. Show/Enable based on selection
    const uiHandlers = {
        1: () => {
            if (els.color) els.color.disabled = false;
            if (els.colorRow) els.colorRow.style.display = 'flex';
        },
        2: () => {
            if (els.presets) els.presets.disabled = false;
            if (els.presetsRow) els.presetsRow.style.display = 'flex';
            if (els.presetToggle) els.presetToggle.disabled = false;
            if (els.presetGroundRow) els.presetGroundRow.style.display = 'flex';
        },
        3: () => {
            if (els.image) els.image.disabled = false;
            if (els.imageRow) els.imageRow.style.display = 'flex';
        }
    };
    if (uiHandlers[val]) uiHandlers[val]();

    // 3. Update Scene
    if (envir?.scene) {
        const sceneHandlers = {
            0: () => {
                envir.scene.background = new THREE.Color(rgbToHex(255, 255, 255));
            },
            1: () => {
                if (els.color?.value) envir.scene.background = new THREE.Color("#" + els.color.value);
            },
            2: () => {
                setBackgroundPresetSelection(els.presets.value);
                setBackgroundPresetGroundEnabled(els.presetToggle ? els.presetToggle.checked : true);
            },
            3: () => {
                if (envir.scene.img_bcg_path && envir.scene.img_bcg_path !== '0') {
                    if (els.thumb) {
                        els.thumb.src = envir.scene.img_bcg_path;
                        els.thumb.hidden = false;
                    }
                }
            }
        };
        if (sceneHandlers[val]) sceneHandlers[val]();
        
        envir.scene.bcg_selection = val;
        envir.scene.backgroundStyleOption = val;
    }
    saveChanges();
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function updateFogColorPicker(picker) {
    document.getElementById('FogColor').value = picker.toRGBString();
    updateFog("editing");
}

function loadFogType() {
    const fogMap = {
        'RadioNoFog': { cat: 0, val: 'none' },
        'RadioLinearFog': { cat: 1, val: 'linear' },
        'RadioExponentialFog': { cat: 2, val: 'exponential' }
    };

    for (const [id, data] of Object.entries(fogMap)) {
        if (document.getElementById(id)?.checked) {
            envir.scene.fogCategory = data.cat;
            document.getElementById('FogType').value = data.val;
            break;
        }
    }
    updateFog("editing");
}

function updateFog(whencalled) {
    if (!envir?.scene) return;

    // Reset properties
    envir.scene.fogcolor = 0;
    envir.scene.fognear = 0;
    envir.scene.fogfar = 0;
    envir.scene.fogdensity = 0;

    const picker = document.getElementById('jscolorpickFog')?.jscolor;
    if (!picker) return;

    const fogType = document.getElementById('FogType').value;
    const fogNear = document.getElementById('FogNear').value;
    const fogFar = document.getElementById('FogFar').value;
    const fogDensity = document.getElementById('FogDensity').value;

    const colorHex = picker.rgb.map(x => {
        const s = parseInt(x).toString(16);
        return s.length === 1 ? "0" + s : s;
    }).join("");

    envir.scene.fogcolor = colorHex;
    envir.scene.fognear = fogNear;
    envir.scene.fogfar = fogFar;
    envir.scene.fogdensity = fogDensity;

    const linearElems = document.getElementsByClassName('linearElement');
    const expoElems = document.getElementsByClassName('exponentialElement');
    const colorElems = document.getElementsByClassName('colorElement');
    const fogValues = document.getElementById("FogValues");

    const setVisibility = (linear, expo, color, main) => {
        if (fogValues) fogValues.style.display = main;
        for (let el of linearElems) el.style.display = linear;
        for (let el of expoElems) el.style.display = expo;
        for (let el of colorElems) el.style.display = color;
    };

    if (fogType === 'linear') {
        setVisibility('flex', 'none', 'flex', 'flex');
    } else if (fogType === 'exponential') {
        setVisibility('none', 'flex', 'flex', 'flex');
    } else if (fogType === 'none') {
        envir.scene.fog = null;
        setVisibility('none', 'none', 'none', 'none');
    }

    if (whencalled !== "undo") {
        saveChanges();
    }
}
