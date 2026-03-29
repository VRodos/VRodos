document.addEventListener('DOMContentLoaded', function() {
    function getCompileDialogElements() {
        return {
            renderQuality: document.getElementById('compileRenderQualitySelect'),
            shadowQuality: document.getElementById('compileShadowQualitySelect'),
            aaQuality: document.getElementById('compileAAQualitySelect'),
            postFx: document.getElementById('compilePostFxToggle'),
            postFxGroup: document.getElementById('compilePostFxGroup'),
            postFxColor: document.getElementById('compilePostFxColorToggle'),
            edgeAAStrength: document.getElementById('compileEdgeAAStrengthSlider'),
            edgeAAStrengthValue: document.getElementById('compileEdgeAAStrengthValue'),
            bloomStrength: document.getElementById('compileBloomStrengthSelect'),
            exposurePreset: document.getElementById('compileExposurePresetSelect'),
            contrastPreset: document.getElementById('compileContrastPresetSelect'),
            reflectionProfile: document.getElementById('compileReflectionProfileSelect')
        };
    }

    function normalizeAAQuality(value) {
        if (value === 'off' || value === 'high' || value === 'ultra' || value === 'balanced') {
            return value;
        }

        return 'balanced';
    }

    function normalizeEdgeAAStrengthLevel(value) {
        var numeric = parseInt(value, 10);
        if (isNaN(numeric)) {
            return 3;
        }

        if (numeric > 5) {
            if (numeric <= 20) return 1;
            if (numeric <= 40) return 2;
            if (numeric <= 65) return 3;
            if (numeric <= 85) return 4;
            return 5;
        }

        return Math.max(0, Math.min(5, numeric));
    }

    function getEdgeAAStrengthLabel(level) {
        switch (normalizeEdgeAAStrengthLevel(level)) {
            case 0:
                return 'Off';
            case 1:
                return 'Crisp';
            case 2:
                return 'Light';
            case 4:
                return 'Strong';
            case 5:
                return 'Max';
            default:
                return 'Balanced';
        }
    }

    function normalizeBloomStrength(value) {
        if (value === 'soft' || value === 'medium' || value === 'off') {
            return value;
        }

        return 'off';
    }

    function normalizeExposurePreset(value) {
        if (value === 'bright' || value === 'cinematic' || value === 'neutral') {
            return value;
        }

        return 'neutral';
    }

    function normalizeContrastPreset(value) {
        if (value === 'soft' || value === 'punchy' || value === 'balanced') {
            return value;
        }

        return 'balanced';
    }

    function normalizeReflectionProfile(value) {
        if (value === 'soft' || value === 'enhanced' || value === 'balanced') {
            return value;
        }

        return 'balanced';
    }

    function isBloomStrengthEnabled(value) {
        return normalizeBloomStrength(value) !== 'off';
    }

    function updateEdgeAAStrengthLabel() {
        var controls = getCompileDialogElements();
        if (!controls.edgeAAStrength || !controls.edgeAAStrengthValue) {
            return;
        }

        controls.edgeAAStrengthValue.textContent = getEdgeAAStrengthLabel(controls.edgeAAStrength.value);
    }

    function ensureCompileSceneSettingsDefaults() {
        if (typeof envir === 'undefined' || !envir.scene) {
            return;
        }

        if (!envir.scene.aframeRenderQuality) {
            envir.scene.aframeRenderQuality = 'standard';
        }
        if (!envir.scene.aframeShadowQuality) {
            envir.scene.aframeShadowQuality = 'medium';
        }
        if (!envir.scene.aframeAAQuality) {
            envir.scene.aframeAAQuality = 'balanced';
        }
        if (typeof envir.scene.aframePostFXEnabled === 'undefined') {
            envir.scene.aframePostFXEnabled = false;
        }
        if (!envir.scene.aframeBloomStrength) {
            envir.scene.aframeBloomStrength = 'off';
        }
        if (!envir.scene.aframeReflectionProfile) {
            envir.scene.aframeReflectionProfile = 'balanced';
        }
        if (!envir.scene.aframeExposurePreset) {
            envir.scene.aframeExposurePreset = 'neutral';
        }
        if (!envir.scene.aframeContrastPreset) {
            envir.scene.aframeContrastPreset = 'balanced';
        }
        if (typeof envir.scene.aframePostFXBloomEnabled === 'undefined') {
            envir.scene.aframePostFXBloomEnabled = false;
        }
        if (typeof envir.scene.aframePostFXColorEnabled === 'undefined') {
            envir.scene.aframePostFXColorEnabled = true;
        }
        if (typeof envir.scene.aframePostFXVignetteEnabled === 'undefined') {
            envir.scene.aframePostFXVignetteEnabled = false;
        }
        if (typeof envir.scene.aframePostFXEdgeAAEnabled === 'undefined') {
            envir.scene.aframePostFXEdgeAAEnabled = true;
        }
        if (typeof envir.scene.aframePostFXEdgeAAStrength === 'undefined') {
            envir.scene.aframePostFXEdgeAAStrength = 3;
        }

        envir.scene.aframeAAQuality = normalizeAAQuality(envir.scene.aframeAAQuality);
        envir.scene.aframeBloomStrength = normalizeBloomStrength(envir.scene.aframeBloomStrength);
        envir.scene.aframeExposurePreset = normalizeExposurePreset(envir.scene.aframeExposurePreset);
        envir.scene.aframeContrastPreset = normalizeContrastPreset(envir.scene.aframeContrastPreset);
        envir.scene.aframeReflectionProfile = normalizeReflectionProfile(envir.scene.aframeReflectionProfile);
        if (envir.scene.aframePostFXBloomEnabled === false) {
            envir.scene.aframeBloomStrength = 'off';
        }
        envir.scene.aframePostFXBloomEnabled = isBloomStrengthEnabled(envir.scene.aframeBloomStrength);
        envir.scene.aframePostFXVignetteEnabled = false;
    }

    function syncCompilePostFxState() {
        var controls = getCompileDialogElements();
        if (!controls.postFx || !controls.bloomStrength || !controls.postFxColor || !controls.edgeAAStrength || !controls.exposurePreset || !controls.contrastPreset) {
            return;
        }

        var postFxEnabled = controls.postFx.checked;
        var colorGradingEnabled = postFxEnabled && controls.postFxColor.checked;

        if (controls.postFxGroup) {
            if (postFxEnabled) {
                controls.postFxGroup.classList.remove('tw-opacity-50', 'tw-pointer-events-none');
            } else {
                controls.postFxGroup.classList.add('tw-opacity-50', 'tw-pointer-events-none');
            }
        }

        controls.postFxColor.disabled = !postFxEnabled;
        controls.bloomStrength.disabled = !postFxEnabled;
        controls.exposurePreset.disabled = !colorGradingEnabled;
        controls.contrastPreset.disabled = !colorGradingEnabled;
        controls.edgeAAStrength.disabled = !postFxEnabled;
        updateEdgeAAStrengthLabel();
    }

    function applyCompileDialogSettingsToScene() {
        if (typeof envir === 'undefined' || !envir.scene) {
            return;
        }

        var controls = getCompileDialogElements();
        if (!controls.renderQuality || !controls.shadowQuality || !controls.aaQuality || !controls.postFx || !controls.postFxColor || !controls.edgeAAStrength || !controls.bloomStrength || !controls.exposurePreset || !controls.contrastPreset || !controls.reflectionProfile) {
            return;
        }

        ensureCompileSceneSettingsDefaults();

        envir.scene.aframeRenderQuality = controls.renderQuality.value || 'standard';
        envir.scene.aframeShadowQuality = controls.shadowQuality.value || 'medium';
        envir.scene.aframeAAQuality = normalizeAAQuality(controls.aaQuality.value);
        envir.scene.aframePostFXEnabled = controls.postFx.checked === true;
        envir.scene.aframeBloomStrength = normalizeBloomStrength(controls.bloomStrength.value);
        envir.scene.aframePostFXBloomEnabled = isBloomStrengthEnabled(envir.scene.aframeBloomStrength);
        envir.scene.aframePostFXColorEnabled = controls.postFxColor.checked === true;
        envir.scene.aframePostFXVignetteEnabled = false;
        envir.scene.aframeExposurePreset = normalizeExposurePreset(controls.exposurePreset.value);
        envir.scene.aframeContrastPreset = normalizeContrastPreset(controls.contrastPreset.value);

        var edgeAAValue = normalizeEdgeAAStrengthLevel(controls.edgeAAStrength.value);
        envir.scene.aframePostFXEdgeAAEnabled = edgeAAValue > 0;
        envir.scene.aframePostFXEdgeAAStrength = edgeAAValue > 0 ? edgeAAValue : (envir.scene.aframePostFXEdgeAAStrength || 3);

        envir.scene.aframeReflectionProfile = normalizeReflectionProfile(controls.reflectionProfile.value);
    }

    window.vrodosApplyCompileDialogSettingsToScene = applyCompileDialogSettingsToScene;

    window.syncCompileDialogFromSceneSettings = function() {
        var controls = getCompileDialogElements();
        if (!controls.renderQuality || !controls.shadowQuality || !controls.aaQuality || !controls.postFx || !controls.postFxColor || !controls.edgeAAStrength || !controls.bloomStrength || !controls.exposurePreset || !controls.contrastPreset || !controls.reflectionProfile) {
            return;
        }

        ensureCompileSceneSettingsDefaults();

        controls.renderQuality.value = envir && envir.scene && envir.scene.aframeRenderQuality
            ? envir.scene.aframeRenderQuality
            : 'standard';
        controls.shadowQuality.value = envir && envir.scene && envir.scene.aframeShadowQuality
            ? envir.scene.aframeShadowQuality
            : 'medium';
        controls.aaQuality.value = envir && envir.scene && envir.scene.aframeAAQuality
            ? normalizeAAQuality(envir.scene.aframeAAQuality)
            : 'balanced';
        controls.postFx.checked = !!(envir && envir.scene && envir.scene.aframePostFXEnabled);
        controls.postFxColor.checked = !(envir && envir.scene) || envir.scene.aframePostFXColorEnabled !== false;

        var edgeAAEnabled = !(envir && envir.scene) || envir.scene.aframePostFXEdgeAAEnabled !== false;
        var edgeAAStrength = envir && envir.scene ? envir.scene.aframePostFXEdgeAAStrength : 3;
        controls.edgeAAStrength.value = edgeAAEnabled ? normalizeEdgeAAStrengthLevel(edgeAAStrength) : 0;

        controls.bloomStrength.value = envir && envir.scene
            ? normalizeBloomStrength(envir.scene.aframeBloomStrength)
            : 'off';
        controls.exposurePreset.value = envir && envir.scene
            ? normalizeExposurePreset(envir.scene.aframeExposurePreset)
            : 'neutral';
        controls.contrastPreset.value = envir && envir.scene
            ? normalizeContrastPreset(envir.scene.aframeContrastPreset)
            : 'balanced';
        controls.reflectionProfile.value = envir && envir.scene && envir.scene.aframeReflectionProfile
            ? normalizeReflectionProfile(envir.scene.aframeReflectionProfile)
            : 'balanced';

        syncCompilePostFxState();
    };

    var controls = getCompileDialogElements();
    if (controls.renderQuality) {
        controls.renderQuality.addEventListener('change', function() {
            syncCompilePostFxState();
        });
    }
    if (controls.shadowQuality) {
        controls.shadowQuality.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.aaQuality) {
        controls.aaQuality.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.postFx) {
        controls.postFx.addEventListener('change', function() {
            syncCompilePostFxState();
        });
    }
    if (controls.postFxColor) {
        controls.postFxColor.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.edgeAAStrength) {
        controls.edgeAAStrength.addEventListener('input', function() {
            updateEdgeAAStrengthLabel();
        });
        controls.edgeAAStrength.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.bloomStrength) {
        controls.bloomStrength.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.exposurePreset) {
        controls.exposurePreset.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.contrastPreset) {
        controls.contrastPreset.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.reflectionProfile) {
        controls.reflectionProfile.addEventListener('change', syncCompilePostFxState);
    }

    if (typeof window.syncCompileDialogFromSceneSettings === 'function') {
        window.syncCompileDialogFromSceneSettings();
    }

    function copyURLToClipboard() {
        let linkElement = document.getElementById("openWebLinkhref");
        if(linkElement && linkElement.href) {
            navigator.clipboard.writeText(linkElement.href)
                .then(() => {
                    alert("Copied url: " + linkElement.href);
                })
                .catch(err => {
                    console.error('Failed to copy URL: ', err);
                });
        }
    }

    var copyButton = document.getElementById("buttonCopyWebLink");
    if(copyButton) {
        copyButton.addEventListener("click", copyURLToClipboard);
    }
});
