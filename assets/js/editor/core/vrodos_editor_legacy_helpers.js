'use strict';

VRODOS.ui.transform.setSize = function() {
    if (!VRODOS.editor.transforms || !VRODOS.editor.transforms.getRealObject()) return;

    // Use a fixed size for the transform controls, regardless of the object dimensions or zoom level.
    // Three.js natively keeps the gizmo size consistent relative to the screen.
    VRODOS.editor.transforms.setSize(1.2);
};

VRODOS.ui.fillinWidgetAssetTRS = function(selectedObject) {
    if (selectedObject) {
        const asset_id = selectedObject.value;
        VRODOS.api.fetchAssetAndSetWidget(asset_id, selectedObject);
    }
};

VRODOS.utils.unixTimestampToTime = function(tStr) {
    const unix_timestamp = parseInt(tStr, 10);
    const date = new Date(unix_timestamp * 1000);
    const hours = date.getHours();
    const minutes = `0${  date.getMinutes()}`;
    const seconds = `0${  date.getSeconds()}`;
    const formattedTime = `${hours  }:${  minutes.substr(-2)  }:${  seconds.substr(-2)}`;
    return `${date.getDate()  }/${  date.getMonth()  }/${  date.getFullYear()  } ${  formattedTime}`;
};

VRODOS.utils.rgbToHex = function(red, green, blue) {
    const rgb = (red << 16) | (green << 8) | (blue << 0);
    return `#${  (0x1000000 + rgb).toString(16).slice(1)}`;
};

VRODOS.ui.updateClearColorPicker = function(input) {
    const hex = input.value;
    document.getElementById('sceneClearColor').value = hex;
    if (VRODOS.editor.envir && VRODOS.editor.envir.scene) {
        VRODOS.editor.envir.scene.background = new THREE.Color(hex);
    }
    VRODOS.api.saveChanges();
};

VRODOS.ui.setBackgroundPresetSelection = function(presetValue) {
    if (!VRODOS.editor.envir || !VRODOS.editor.envir.scene) return;

    VRODOS.editor.envir.scene.preset_selection = presetValue;
    VRODOS.editor.envir.scene.backgroundPresetOption = presetValue;
    VRODOS.editor.envir.scene.bcg_selection = 2;
    VRODOS.editor.envir.scene.backgroundStyleOption = 2;
};

VRODOS.ui.setBackgroundPresetGroundEnabled = function(isEnabled) {
    if (!VRODOS.editor.envir || !VRODOS.editor.envir.scene) return;

    VRODOS.editor.envir.scene.backgroundPresetGroundEnabled = Boolean(isEnabled);
};

VRODOS.ui.setHorizonSkyPresetSelection = function(presetValue) {
    if (!VRODOS.editor.envir || !VRODOS.editor.envir.scene) return;

    VRODOS.editor.envir.scene.aframeHorizonSkyPreset = (presetValue === 'clear' || presetValue === 'crisp') ? presetValue : 'natural';
};

VRODOS.ui.handleBackgroundPresetChange = function(selectElement) {
    if (!selectElement) return;

    VRODOS.ui.setBackgroundPresetSelection(selectElement.value);

    const sceneSkyRadio = document.getElementById('sceneSky');
    if (sceneSkyRadio) sceneSkyRadio.checked = true;

    VRODOS.api.saveChanges();
};

VRODOS.ui.handleBackgroundPresetGroundToggle = function(checkboxElement) {
    if (!checkboxElement) return;

    VRODOS.ui.setBackgroundPresetGroundEnabled(checkboxElement.checked);
    VRODOS.api.saveChanges();
};

VRODOS.ui.handleHorizonSkyPresetChange = function(selectElement) {
    if (!selectElement) return;

    VRODOS.ui.setHorizonSkyPresetSelection(selectElement.value);

    const sceneHorizonRadio = document.getElementById('sceneHorizon');
    if (sceneHorizonRadio) sceneHorizonRadio.checked = true;

    VRODOS.api.saveChanges();
};

VRODOS.ui.normalizeAframeNavigationMode = function(mode, fallback) {
    if (['walk', 'walkable', 'fly'].includes(mode)) {
        return mode;
    }

    return fallback || 'walkable';
};

VRODOS.ui.setAframeNavigationMode = function(mode) {
    if (!VRODOS.editor.envir || !VRODOS.editor.envir.scene) return;

    const normalizedMode = VRODOS.ui.normalizeAframeNavigationMode(mode);
    VRODOS.editor.envir.scene.aframeNavigationMode = normalizedMode;
    VRODOS.editor.envir.scene.aframeCollisionMode = normalizedMode === 'walkable' ? 'auto' : 'off';

    const navigationModeSelect = document.getElementById('aframeNavigationModeSelect');
    if (navigationModeSelect) {
        navigationModeSelect.value = normalizedMode;
    }

    VRODOS.api.saveChanges();
};

VRODOS.ui.toggleAframeCollisionMode = function(isEnabled) {
    VRODOS.ui.setAframeNavigationMode(isEnabled ? 'walkable' : 'walk');
};

function getEditorSceneSettingsScene() {
    return VRODOS.editor && VRODOS.editor.envir ? VRODOS.editor.envir.scene : null;
}

function normalizeEditorSceneBoolean(value) {
    return value === true || value === 1 || value === '1' || value === 'true';
}

function setEditorSceneBooleanSetting(settingKey, value, options) {
    const scene = getEditorSceneSettingsScene();
    if (!scene) return;

    scene[settingKey] = normalizeEditorSceneBoolean(value);
    if (!options || options.save !== false) {
        VRODOS.api.saveChanges();
    }
}

VRODOS.ui.setKeepScaleAspectRatio = function(value) {
    setEditorSceneBooleanSetting('keepScaleAspectRatio', value, { save: false });
};

VRODOS.ui.toggleBroadcastChat = function(value) {
    setEditorSceneBooleanSetting('enableGeneralChat', value);
};

VRODOS.ui.toggleEnableAvatar = function(value) {
    setEditorSceneBooleanSetting('enableAvatar', value);
};

VRODOS.ui.toggleDisableMovement = function(value) {
    setEditorSceneBooleanSetting('disableMovement', value);
};

window.setAframeNavigationMode = function(mode) {
    VRODOS.ui.setAframeNavigationMode(mode);
};

window.toggleAframeCollisionMode = function(isEnabled) {
    VRODOS.ui.toggleAframeCollisionMode(isEnabled);
};

window.keepScaleAspectRatio = VRODOS.ui.setKeepScaleAspectRatio;
window.toggleBroadcastChat = VRODOS.ui.toggleBroadcastChat;
window.toggleEnableAvatar = VRODOS.ui.toggleEnableAvatar;
window.toggleDisableMovement = VRODOS.ui.toggleDisableMovement;

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
    if (VRODOS.editor.envir?.scene) {
        const sceneHandlers = {
            4: () => {
                VRODOS.editor.envir.scene.background = null;
            },
            0: () => {
                VRODOS.editor.envir.scene.background = new THREE.Color(VRODOS.utils.rgbToHex(255, 255, 255));
                VRODOS.ui.setHorizonSkyPresetSelection(els.horizonSkyPreset ? els.horizonSkyPreset.value : 'natural');
            },
            1: () => {
                if (els.color?.value) VRODOS.editor.envir.scene.background = new THREE.Color(els.color.value);
            },
            2: () => {
                VRODOS.ui.setBackgroundPresetSelection(els.presets.value);
                VRODOS.ui.setBackgroundPresetGroundEnabled(els.presetToggle ? els.presetToggle.checked : true);
            },
            3: () => {
                if (VRODOS.editor.envir.scene.img_bcg_path && VRODOS.editor.envir.scene.img_bcg_path !== '0') {
                    if (els.thumb) {
                        els.thumb.src = VRODOS.editor.envir.scene.img_bcg_path;
                        els.thumb.hidden = false;
                    }
                }
            }
        };
        if (sceneHandlers[val]) sceneHandlers[val]();

        VRODOS.editor.envir.scene.bcg_selection = val;
        VRODOS.editor.envir.scene.backgroundStyleOption = val;
    }
    VRODOS.api.saveChanges();
};

window.bcgRadioSelect = VRODOS.ui.bcgRadioSelect;
window.updateClearColorPicker = VRODOS.ui.updateClearColorPicker;
window.handleBackgroundPresetChange = VRODOS.ui.handleBackgroundPresetChange;
window.handleBackgroundPresetGroundToggle = VRODOS.ui.handleBackgroundPresetGroundToggle;
window.handleHorizonSkyPresetChange = VRODOS.ui.handleHorizonSkyPresetChange;

VRODOS.utils.hexToRgb = function(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

VRODOS.ui.updateFogColorPicker = function(input) {
    document.getElementById('FogColor').value = input.value;
    VRODOS.ui.updateFog("editing");
};

VRODOS.ui.loadFogType = function() {
    const fogMap = {
        'RadioNoFog': { cat: 0, val: 'none' },
        'RadioLinearFog': { cat: 1, val: 'linear' },
        'RadioExponentialFog': { cat: 2, val: 'exponential' }
    };

    for (const [id, data] of Object.entries(fogMap)) {
        if (document.getElementById(id)?.checked) {
            VRODOS.editor.envir.scene.fogCategory = data.cat;
            document.getElementById('FogType').value = data.val;
            break;
        }
    }

    // Initialize or Sync Fog Slider
    if (VRODOS.editor.envir.scene.fogCategory === 2) {
        const density = VRODOS.editor.envir.scene.fogdensity || 0.01;
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

VRODOS.ui.handleFogDensitySlider = function(index) {
    const density = VRODOS.utils.mapSliderToDensity(index);
    document.getElementById('FogDensity').value = density;
    VRODOS.ui.updateFogDensityLabel(index);
    VRODOS.ui.updateFog("editing");
};

VRODOS.ui.updateFogDensityLabel = function(index) {
    const labels = ["OFF", "FAR", "MID", "NEAR"];
    const labelEl = document.getElementById("FogDensityLabel");
    if (labelEl) labelEl.innerText = labels[index] || "OFF";
};

VRODOS.utils.mapSliderToDensity = function(index) {
    const mapping = [0.0, 0.001, 0.005, 0.01];
    return mapping[index] ?? 0.001;
};

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

VRODOS.ui.updateFog = function(whencalled) {
    if (!VRODOS.editor.envir?.scene) return;

    const colorInput = document.getElementById('jscolorpickFog');
    if (!colorInput) return;

    const fogType = document.getElementById('FogType').value;
    const fogNear = parseFloat(document.getElementById('FogNear').value || 0);
    const fogFar = parseFloat(document.getElementById('FogFar').value || 1000);
    const fogDensity = parseFloat(document.getElementById('FogDensity').value || 0.00000001);

    const standardizedColor = colorInput.value;

    // 1. Update metadata for persistence
    VRODOS.editor.envir.scene.fogcolor = standardizedColor;
    VRODOS.editor.envir.scene.fognear = fogNear;
    VRODOS.editor.envir.scene.fogfar = fogFar;
    VRODOS.editor.envir.scene.fogdensity = fogDensity;

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
        VRODOS.editor.envir.scene.fog = null; // show fog only in compiled stages
        setVisibility('flex', 'none', 'flex', 'flex');
        VRODOS.editor.envir.scene.fogCategory = 1;
    } else if (fogType === 'exponential') {
        VRODOS.editor.envir.scene.fog = null; // show fog only in compiled stages
        setVisibility('none', 'flex', 'flex', 'flex');
        VRODOS.editor.envir.scene.fogCategory = 2;
    } else if (fogType === 'none') {
        VRODOS.editor.envir.scene.fog = null;
        setVisibility('none', 'none', 'none', 'none');
        VRODOS.editor.envir.scene.fogCategory = 0;
    }

    if (whencalled !== "undo" && whencalled !== "loading") {
        VRODOS.api.saveChanges();
    }
};

window.updateFogColorPicker = VRODOS.ui.updateFogColorPicker;
window.loadFogType = VRODOS.ui.loadFogType;
window.handleFogDensitySlider = VRODOS.ui.handleFogDensitySlider;
window.updateFog = VRODOS.ui.updateFog;
