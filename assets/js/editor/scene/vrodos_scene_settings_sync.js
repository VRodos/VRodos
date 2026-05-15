"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.api = VRODOS.api || {};
VRODOS.config = VRODOS.config || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};

function vrodosSceneSettingsSetDisplay(elements, displayValue) {
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.display = displayValue;
    }
}

function vrodosSceneSettingsSetChecked(id, checked) {
    const element = document.getElementById(id);
    if (element) {
        element.checked = checked;
    }
    return element;
}

function vrodosSceneSettingsSetValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) {
        element.value = value;
    }
    return element;
}

function vrodosSceneSettingsNormalizeHexColor(value, fallback) {
    const colorValue = value || fallback || '#000000';
    return String(colorValue).startsWith('#') ? String(colorValue) : `#${colorValue}`;
}

function vrodosSceneSettingsSyncClearColor(colorValue) {
    const normalizedColor = vrodosSceneSettingsNormalizeHexColor(colorValue, '#000000');
    const scene = VRODOS.editor && VRODOS.editor.envir ? VRODOS.editor.envir.scene : null;

    vrodosSceneSettingsSetValue('sceneClearColor', normalizedColor);
    vrodosSceneSettingsSetValue('jscolorpick', normalizedColor);

    if (scene && window.THREE) {
        scene.background = new THREE.Color(normalizedColor);
    }
}

function vrodosSceneSettingsSyncBackground(parsedValue, resources3D) {
    const scene = VRODOS.editor.envir.scene;
    scene.bcg_selection = scene.backgroundStyleOption;

    const colorSelect = document.getElementById('jscolorpick');
    const customImageSelect = document.getElementById('img_upload_bcg');
    const presetSelect = document.getElementById('presetsBcg');
    const presetGroundToggle = document.getElementById('presetGroundToggle');
    const imageThumb = document.getElementById('uploadImgThumb');
    const horizonSkyPreset = document.getElementById('horizonSkyPreset');
    const horizonSkyRow = document.getElementById('bcgHorizonSkyRow');
    const colorRow = document.getElementById('bcgColorRow');
    const presetsRow = document.getElementById('bcgPresetsRow');
    const presetGroundRow = document.getElementById('bcgPresetGroundRow');
    const imageRow = document.getElementById('bcgImageRow');
    const horizonDescription = document.getElementById('sceneHorizonDescription');
    const sceneSettings = resources3D ? resources3D.SceneSettings : null;
    const presetGroundEnabled = Boolean(resources3D && resources3D.backgroundPresetGroundEnabled !== false);

    if (horizonSkyRow) horizonSkyRow.style.display = 'none';
    if (colorRow) colorRow.style.display = 'none';
    if (presetsRow) presetsRow.style.display = 'none';
    if (presetGroundRow) presetGroundRow.style.display = 'none';
    if (imageRow) imageRow.style.display = 'none';
    if (horizonDescription) {
        horizonDescription.style.display = 'none';
        horizonDescription.classList.add('tw-hidden');
    }
    if (colorSelect) colorSelect.disabled = true;
    if (presetSelect) presetSelect.disabled = true;
    if (presetGroundToggle) {
        presetGroundToggle.disabled = true;
        presetGroundToggle.checked = presetGroundEnabled;
    }
    if (horizonSkyPreset) {
        horizonSkyPreset.disabled = true;
        horizonSkyPreset.value = (resources3D && resources3D.aframeHorizonSkyPreset) || 'natural';
    }
    if (customImageSelect) customImageSelect.disabled = true;
    if (typeof VRODOS.ui.setBackgroundPresetGroundEnabled === 'function') {
        VRODOS.ui.setBackgroundPresetGroundEnabled(presetGroundEnabled);
    }

    switch (scene.bcg_selection) {
        case 4:
            scene.background = null;
            vrodosSceneSettingsSetChecked('sceneNoBackground', true);
            break;
        case 0:
            vrodosSceneSettingsSetChecked('sceneHorizon', true);
            if (horizonDescription) {
                horizonDescription.style.display = 'block';
                horizonDescription.classList.remove('tw-hidden');
            }
            if (horizonSkyPreset) horizonSkyPreset.disabled = false;
            if (horizonSkyRow) horizonSkyRow.style.display = 'flex';
            break;
        case 1:
            vrodosSceneSettingsSetChecked('sceneColorRadio', true);
            if (colorSelect) colorSelect.disabled = false;
            if (colorRow) colorRow.style.display = 'flex';
            break;
        case 2:
            vrodosSceneSettingsSetChecked('sceneSky', true);
            if (presetSelect) {
                presetSelect.disabled = false;
                const optionValue = resources3D ? (resources3D.backgroundPresetOption || (sceneSettings ? sceneSettings.backgroundPresetOption : null)) : null;
                for (let i = 0; i < presetSelect.options.length; i++) {
                    if (presetSelect.options[i].value === String(optionValue)) {
                        presetSelect.options[i].selected = true;
                    }
                }
            }
            if (presetsRow) presetsRow.style.display = 'flex';
            if (presetGroundToggle) presetGroundToggle.disabled = false;
            if (presetGroundRow) presetGroundRow.style.display = 'flex';
            break;
        case 3:
            vrodosSceneSettingsSetChecked('sceneCustomImage', true);
            if (customImageSelect) customImageSelect.disabled = false;
            if (imageRow) imageRow.style.display = 'flex';
            {
                const path = resources3D ? (resources3D.backgroundImagePath || (sceneSettings ? sceneSettings.backgroundImagePath : null)) : null;
                if (path && String(path) !== '0' && imageThumb) {
                    imageThumb.src = path;
                    imageThumb.hidden = false;
                }
            }
            break;
        default:
            break;
    }

    scene.img_bcg_path = resources3D
        ? (resources3D.backgroundImagePath || (sceneSettings ? sceneSettings.backgroundImagePath : null))
        : scene.img_bcg_path;
    scene.backgroundStyleOption = parsedValue;
}

function vrodosSceneSettingsSyncFog(parsedValue) {
    const linearElements = document.getElementsByClassName('linearElement');
    const exponentialElements = document.getElementsByClassName('exponentialElement');
    const colorElements = document.getElementsByClassName('colorElement');
    const fogValueElement = document.getElementById("FogValues");
    const fogTypeElement = document.getElementById('FogType');

    if (parsedValue === 0) {
        vrodosSceneSettingsSetChecked('RadioNoFog', true);
        vrodosSceneSettingsSetDisplay(linearElements, "none");
        vrodosSceneSettingsSetDisplay(exponentialElements, "none");
        vrodosSceneSettingsSetDisplay(colorElements, "none");
        if (fogValueElement) fogValueElement.style.display = "none";
        if (fogTypeElement) fogTypeElement.value = "none";
    } else if (parsedValue === 1) {
        vrodosSceneSettingsSetChecked('RadioLinearFog', true);
        if (fogValueElement) fogValueElement.style.display = "flex";
        vrodosSceneSettingsSetDisplay(linearElements, "flex");
        vrodosSceneSettingsSetDisplay(exponentialElements, "none");
        vrodosSceneSettingsSetDisplay(colorElements, "flex");
        if (fogTypeElement) fogTypeElement.value = "linear";
    } else if (parsedValue === 2) {
        if (fogTypeElement) fogTypeElement.value = "exponential";
        vrodosSceneSettingsSetDisplay(linearElements, "none");
        vrodosSceneSettingsSetDisplay(exponentialElements, "flex");
        vrodosSceneSettingsSetDisplay(colorElements, "flex");
        if (fogValueElement) fogValueElement.style.display = "flex";
        vrodosSceneSettingsSetChecked('RadioExponentialFog', true);
    }
}

function vrodosSceneSettingsSyncFogField(key, parsedValue) {
    if (key === 'fogtype') {
        vrodosSceneSettingsSetValue('FogType', parsedValue);
    } else if (key === 'fogcolor') {
        const normalizedColor = vrodosSceneSettingsNormalizeHexColor(parsedValue, '#ffffff');
        vrodosSceneSettingsSetValue('jscolorpickFog', normalizedColor);
        vrodosSceneSettingsSetValue('FogColor', normalizedColor);
    } else if (key === 'fognear') {
        vrodosSceneSettingsSetValue('FogNear', parsedValue);
    } else if (key === 'fogfar') {
        vrodosSceneSettingsSetValue('FogFar', parsedValue);
    } else if (key === 'fogdensity') {
        vrodosSceneSettingsSetValue('FogDensity', parsedValue);
        if (VRODOS.utils && typeof VRODOS.utils.mapDensityToSlider === 'function') {
            const sliderIndex = VRODOS.utils.mapDensityToSlider(parsedValue);
            vrodosSceneSettingsSetValue('FogDensitySlider', sliderIndex);
            if (VRODOS.ui && typeof VRODOS.ui.updateFogDensityLabel === 'function') {
                VRODOS.ui.updateFogDensityLabel(sliderIndex);
            }
        }
    }
}

function vrodosSceneSettingsApplyFogPreview(key) {
    if (!key || !key.startsWith('fog')) return;
    if (VRODOS.ui && typeof VRODOS.ui.updateFog === 'function') {
        VRODOS.ui.updateFog("loading");
    }
}

VRODOS.api.syncSceneSetting = function(key, value, resources3D) {
    if (!VRODOS.config.SCENE_SETTINGS_SCHEMA[key]) return;

    const config = VRODOS.config.SCENE_SETTINGS_SCHEMA[key];
    const envirKey = config.envirKey;

    let parsedValue = value;
    if (config.type === 'boolean') {
        parsedValue = (value === true || value === 'true');
        if (value === false || value === 'false') parsedValue = false;
    } else if (config.type === 'number') {
        parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) parsedValue = config.default;
    } else if (config.type === 'color') {
        parsedValue = value || config.default;
    }

    if (key === 'aframeNavigationMode') {
        parsedValue = ['walk', 'walkable', 'fly'].includes(parsedValue)
            ? parsedValue
            : (VRODOS.editor.envir.scene.aframeCollisionMode === 'off' ? 'walk' : 'walkable');
    }

    VRODOS.editor.envir.scene[envirKey] = parsedValue;
    if (key === 'aframeNavigationMode') {
        VRODOS.editor.envir.scene.aframeCollisionMode = parsedValue === 'walkable' ? 'auto' : 'off';
    } else if (key === 'aframeCollisionMode' && ['walk', 'walkable', 'fly'].includes(VRODOS.editor.envir.scene.aframeNavigationMode)) {
        VRODOS.editor.envir.scene.aframeCollisionMode = VRODOS.editor.envir.scene.aframeNavigationMode === 'walkable' ? 'auto' : 'off';
    }

    const checkboxMap = {
        enableGeneralChat: 'enableGeneralChatCheckbox',
        enableAvatar: 'enableAvatarCheckbox',
        disableMovement: 'moveDisableCheckbox'
    };

    if (checkboxMap[key]) {
        const element = document.getElementById(checkboxMap[key]);
        if (element) {
            element.checked = parsedValue;
        }
    }

    const selectMap = {
        aframeNavigationMode: 'aframeNavigationModeSelect'
    };

    if (selectMap[key]) {
        const element = document.getElementById(selectMap[key]);
        if (element) {
            element.value = parsedValue;
        }
    }

    if (key === 'ClearColor') {
        vrodosSceneSettingsSyncClearColor(parsedValue);
    }

    if (key === 'backgroundStyleOption') {
        vrodosSceneSettingsSyncBackground(parsedValue, resources3D);
    }

    if (key === 'fogCategory') {
        vrodosSceneSettingsSyncFog(parsedValue);
    }

    vrodosSceneSettingsSyncFogField(key, parsedValue);
    vrodosSceneSettingsApplyFogPreview(key);
};
