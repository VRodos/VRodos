'use strict';

window.VRODOS = window.VRODOS || { ui: { transform: {} }, utils: {}, api: {} };

VRODOS.ui.transform.setSize = function() {
    if (typeof transform_controls === 'undefined' || !transform_controls || !transform_controls.object || !envir) return;

    // Use a fixed size for the transform controls, regardless of the object dimensions or zoom level.
    // Three.js natively keeps the gizmo size consistent relative to the screen.
    transform_controls.setSize(1.2);
};
window.setTransformControlsSize = VRODOS.ui.transform.setSize;

VRODOS.ui.fillinWidgetAssetTRS = function(selectedObject) {
    if (selectedObject) {
        const asset_id = selectedObject.value;
        VRODOS.api.fetchAssetAndSetWidget(asset_id, selectedObject);
    }
};
window.vrodos_fillin_widget_assettrs = VRODOS.ui.fillinWidgetAssetTRS;

VRODOS.utils.unixTimestampToTime = function(tStr) {
    const unix_timestamp = parseInt(tStr);
    const date = new Date(unix_timestamp * 1000);
    const hours = date.getHours();
    const minutes = `0${  date.getMinutes()}`;
    const seconds = `0${  date.getSeconds()}`;
    const formattedTime = `${hours  }:${  minutes.substr(-2)  }:${  seconds.substr(-2)}`;
    return `${date.getDate()  }/${  date.getMonth()  }/${  date.getFullYear()  } ${  formattedTime}`;
};
window.unixTimestamp_to_time = VRODOS.utils.unixTimestampToTime;

VRODOS.utils.rgbToHex = function(red, green, blue) {
    const rgb = (red << 16) | (green << 8) | (blue << 0);
    return `#${  (0x1000000 + rgb).toString(16).slice(1)}`;
};
window.rgbToHex = VRODOS.utils.rgbToHex;

VRODOS.ui.updateClearColorPicker = function(input) {
    const hex = input.value;
    document.getElementById('sceneClearColor').value = hex;
    if (VRODOS.editor.envir && VRODOS.editor.envir.scene) {
        VRODOS.editor.envir.scene.background = new THREE.Color(hex);
    }
    VRODOS.api.saveChanges();
};
window.updateClearColorPicker = VRODOS.ui.updateClearColorPicker;

VRODOS.api.saveChanges = function(options) {
    const saveOptions = options || {};

    if (VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading) {
        return Promise.resolve();
    }

    const save_scene_btn = document.getElementById("save-scene-button");
    if (save_scene_btn.classList.contains("LinkDisabled") && !saveOptions.force) {
        return (typeof VRODOS.api.whenSceneSaveSettles === 'function') ? VRODOS.api.whenSceneSaveSettles() : Promise.resolve();
    }

    const savBtn = document.getElementById('save-scene-button');
    savBtn.innerHTML = "Saving...";
    savBtn.classList.add("LinkDisabled");
    document.getElementById("compileGameBtn").disabled = true;

    // Export using the new SceneExporter
    const exporter = new VRODOS.exporter.SceneExporter();
    document.getElementById('vrodos_scene_json_input').value = exporter.parse(VRODOS.editor.envir.scene);

    return VRODOS.api.saveScene();
};
window.saveChanges = VRODOS.api.saveChanges;

VRODOS.ui.setBackgroundPresetSelection = function(presetValue) {
    if (!envir || !envir.scene) return;

    envir.scene.preset_selection = presetValue;
    envir.scene.backgroundPresetOption = presetValue;
    envir.scene.bcg_selection = 2;
    envir.scene.backgroundStyleOption = 2;
};
window.setBackgroundPresetSelection = VRODOS.ui.setBackgroundPresetSelection;

VRODOS.ui.setBackgroundPresetGroundEnabled = function(isEnabled) {
    if (!envir || !envir.scene) return;

    envir.scene.backgroundPresetGroundEnabled = Boolean(isEnabled);
};
window.setBackgroundPresetGroundEnabled = VRODOS.ui.setBackgroundPresetGroundEnabled;

VRODOS.ui.setHorizonSkyPresetSelection = function(presetValue) {
    if (!envir || !envir.scene) return;

    envir.scene.aframeHorizonSkyPreset = (presetValue === 'clear' || presetValue === 'crisp') ? presetValue : 'natural';
};
window.setHorizonSkyPresetSelection = VRODOS.ui.setHorizonSkyPresetSelection;

VRODOS.ui.handleBackgroundPresetChange = function(selectElement) {
    if (!selectElement) return;

    VRODOS.ui.setBackgroundPresetSelection(selectElement.value);

    const sceneSkyRadio = document.getElementById('sceneSky');
    if (sceneSkyRadio) sceneSkyRadio.checked = true;

    VRODOS.api.saveChanges();
};
window.handleBackgroundPresetChange = VRODOS.ui.handleBackgroundPresetChange;

VRODOS.ui.handleBackgroundPresetGroundToggle = function(checkboxElement) {
    if (!checkboxElement) return;

    VRODOS.ui.setBackgroundPresetGroundEnabled(checkboxElement.checked);
    VRODOS.api.saveChanges();
};
window.handleBackgroundPresetGroundToggle = VRODOS.ui.handleBackgroundPresetGroundToggle;

VRODOS.ui.handleHorizonSkyPresetChange = function(selectElement) {
    if (!selectElement) return;

    VRODOS.ui.setHorizonSkyPresetSelection(selectElement.value);

    const sceneHorizonRadio = document.getElementById('sceneHorizon');
    if (sceneHorizonRadio) sceneHorizonRadio.checked = true;

    VRODOS.api.saveChanges();
};
window.handleHorizonSkyPresetChange = VRODOS.ui.handleHorizonSkyPresetChange;

VRODOS.ui.toggleAframeCollisionMode = function(isEnabled) {
    if (!envir || !envir.scene) return;

    envir.scene.aframeCollisionMode = isEnabled ? 'auto' : 'off';
    VRODOS.api.saveChanges();
};
window.toggleAframeCollisionMode = VRODOS.ui.toggleAframeCollisionMode;

VRODOS.ui.syncBackgroundStyleDescription = function(selectedValue) {
    const horizonDescription = document.getElementById('sceneHorizonDescription');
    if (!horizonDescription) return;

    let val = selectedValue;
    if (val === undefined || val === null || val === '') {
        const radioMap = { 'sceneNoBackground': 4, 'sceneHorizon': 0, 'sceneColorRadio': 1, 'sceneSky': 2, 'sceneCustomImage': 3 };
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
};
window.syncBackgroundStyleDescription = VRODOS.ui.syncBackgroundStyleDescription;

VRODOS.ui.bcgRadioSelect = function(option) {
    const els = {
        color: document.getElementById('jscolorpick'),
        image: document.getElementById('img_upload_bcg'),
        presets: document.getElementById('presetsBcg'),
        presetToggle: document.getElementById('presetGroundToggle'),
        thumb: document.getElementById('uploadImgThumb'),
        // Rows
        horizonSkyRow: document.getElementById('bcgHorizonSkyRow'),
        horizonSkyPreset: document.getElementById('horizonSkyPreset'),
        colorRow: document.getElementById('bcgColorRow'),
        presetsRow: document.getElementById('bcgPresetsRow'),
        presetGroundRow: document.getElementById('bcgPresetGroundRow'),
        imageRow: document.getElementById('bcgImageRow'),
        horizonDesc: document.getElementById('sceneHorizonDescription')
    };

    // 1. Reset all state
    [els.horizonSkyRow, els.colorRow, els.presetsRow, els.presetGroundRow, els.imageRow, els.horizonDesc].forEach(el => {
        if (el) el.style.display = 'none';
    });
    if (els.horizonDesc) els.horizonDesc.classList.add('tw-hidden');
    [els.color, els.presets, els.presetToggle, els.image, els.horizonSkyPreset].forEach(el => {
        if (el) el.disabled = true;
    });

    const val = parseInt(option.value, 10) || 0;
    VRODOS.ui.syncBackgroundStyleDescription(val);

    if (els.thumb && val !== 3) {
        els.thumb.hidden = true;
    }

    // 2. Show/Enable based on selection
    const uiHandlers = {
        4: () => {},
        0: () => {
            if (els.horizonSkyPreset) els.horizonSkyPreset.disabled = false;
            if (els.horizonSkyRow) els.horizonSkyRow.style.display = 'flex';
        },
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
            4: () => {
                envir.scene.background = null;
            },
            0: () => {
                envir.scene.background = new THREE.Color(VRODOS.utils.rgbToHex(255, 255, 255));
                VRODOS.ui.setHorizonSkyPresetSelection(els.horizonSkyPreset ? els.horizonSkyPreset.value : 'natural');
            },
            1: () => {
                if (els.color?.value) envir.scene.background = new THREE.Color(els.color.value);
            },
            2: () => {
                VRODOS.ui.setBackgroundPresetSelection(els.presets.value);
                VRODOS.ui.setBackgroundPresetGroundEnabled(els.presetToggle ? els.presetToggle.checked : true);
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
    VRODOS.api.saveChanges();
};
window.bcgRadioSelect = VRODOS.ui.bcgRadioSelect;

VRODOS.utils.hexToRgb = function(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};
window.hexToRgb = VRODOS.utils.hexToRgb;

VRODOS.ui.updateFogColorPicker = function(input) {
    document.getElementById('FogColor').value = input.value;
    VRODOS.ui.updateFog("editing");
};
window.updateFogColorPicker = VRODOS.ui.updateFogColorPicker;

VRODOS.ui.loadFogType = function() {
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

    // Initialize or Sync Fog Slider
    if (envir.scene.fogCategory === 2) {
        const density = envir.scene.fogdensity || 0.01;
        const slider = document.getElementById('FogDensitySlider');
        const hiddenInput = document.getElementById('FogDensity');
        if (slider && hiddenInput) {
            const index = VRODOS.utils.mapDensityToSlider(density);
            slider.value = index;
            hiddenInput.value = density;
            VRODOS.ui.updateFogDensityLabel(index);
        }
    }

    VRODOS.ui.updateFog("editing");
};
window.loadFogType = VRODOS.ui.loadFogType;

VRODOS.ui.handleFogDensitySlider = function(index) {
    const density = VRODOS.utils.mapSliderToDensity(index);
    document.getElementById('FogDensity').value = density;
    VRODOS.ui.updateFogDensityLabel(index);
    VRODOS.ui.updateFog("editing");
};
window.handleFogDensitySlider = VRODOS.ui.handleFogDensitySlider;

VRODOS.ui.updateFogDensityLabel = function(index) {
    const labels = ["OFF", "FAR", "MID", "NEAR"];
    const labelEl = document.getElementById("FogDensityLabel");
    if (labelEl) labelEl.innerText = labels[index] || "OFF";
};
window.updateFogDensityLabel = VRODOS.ui.updateFogDensityLabel;

VRODOS.utils.mapSliderToDensity = function(index) {
    const mapping = [0.0, 0.001, 0.005, 0.01];
    return mapping[index] ?? 0.001;
};
window.mapSliderToDensity = VRODOS.utils.mapSliderToDensity;

VRODOS.utils.mapDensityToSlider = function(density) {
    const mapping = [0.0, 0.001, 0.005, 0.01];
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < mapping.length; i++) {
        const diff = Math.abs(mapping[i] - density);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
    }
    return closestIndex;
};
window.mapDensityToSlider = VRODOS.utils.mapDensityToSlider;

VRODOS.ui.updateFog = function(whencalled) {
    if (!envir?.scene) return;

    const colorInput = document.getElementById('jscolorpickFog');
    if (!colorInput) return;

    const fogType = document.getElementById('FogType').value;
    const fogNear = parseFloat(document.getElementById('FogNear').value || 0);
    const fogFar = parseFloat(document.getElementById('FogFar').value || 1000);
    const fogDensity = parseFloat(document.getElementById('FogDensity').value || 0.00000001);

    const standardizedColor = colorInput.value;

    // 1. Update metadata for persistence
    envir.scene.fogcolor = standardizedColor;
    envir.scene.fognear = fogNear;
    envir.scene.fogfar = fogFar;
    envir.scene.fogdensity = fogDensity;

    const linearElems = document.getElementsByClassName('linearElement');
    const expoElems = document.getElementsByClassName('exponentialElement');
    const colorElems = document.getElementsByClassName('colorElement');
    const fogValues = document.getElementById("FogValues");

    const setVisibility = (linear, expo, color, main) => {
        if (fogValues) fogValues.style.display = main;
        for (const el of linearElems) el.style.display = linear;
        for (const el of expoElems) el.style.display = expo;
        for (const el of colorElems) el.style.display = color;
    };

    if (fogType === 'linear') {
        envir.scene.fog = null; // show fog only in compiled stages
        setVisibility('flex', 'none', 'flex', 'flex');
        envir.scene.fogCategory = 1;
    } else if (fogType === 'exponential') {
        envir.scene.fog = null; // show fog only in compiled stages
        setVisibility('none', 'flex', 'flex', 'flex');
        envir.scene.fogCategory = 2;
    } else if (fogType === 'none') {
        envir.scene.fog = null;
        setVisibility('none', 'none', 'none', 'none');
        envir.scene.fogCategory = 0;
    }

    if (whencalled !== "undo" && whencalled !== "loading") {
        VRODOS.api.saveChanges();
    }
};
window.updateFog = VRODOS.ui.updateFog;
