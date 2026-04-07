document.addEventListener('DOMContentLoaded', function() {
    function getCompileDialogElements() {
        return {
            renderQuality: document.getElementById('compileRenderQualitySelect'),
            shadowQuality: document.getElementById('compileShadowQualitySelect'),
            aaQuality: document.getElementById('compileAAQualitySelect'),
            ambientOcclusionPreset: document.getElementById('compileAmbientOcclusionPresetSelect'),
            contactShadowPreset: document.getElementById('compileContactShadowPresetSelect'),
            fpsMeter: document.getElementById('compileFPSMeterToggle'),
            postFx: document.getElementById('compilePostFxToggle'),
            postFxGroup: document.getElementById('compilePostFxGroup'),
            postFxColor: document.getElementById('compilePostFxColorToggle'),
            edgeAAStrength: document.getElementById('compileEdgeAAStrengthSlider'),
            edgeAAStrengthValue: document.getElementById('compileEdgeAAStrengthValue'),
            bloomStrength: document.getElementById('compileBloomStrengthSelect'),
            exposurePreset: document.getElementById('compileExposurePresetSelect'),
            contrastPreset: document.getElementById('compileContrastPresetSelect'),
            reflectionProfile: document.getElementById('compileReflectionProfileSelect'),
            reflectionSource: document.getElementById('compileReflectionSourceSelect'),
            envMapPreset: document.getElementById('compileEnvMapPresetSelect'),
            ssrStrength: document.getElementById('compileSSRStrengthSelect'),
            taaEnabled: document.getElementById('compilePostFxTAAToggle'),
            postFxEngine: document.getElementById('compilePostFxEngineSelect'),
            postFxEngineHint: document.getElementById('compilePostFxEngineHint'),
            postFxEngineTabLegacy: document.getElementById('compilePostFxEngineTabLegacy'),
            postFxEngineTabPmndrs: document.getElementById('compilePostFxEngineTabPmndrs'),
            pmndrsTweaksGroup: document.getElementById('compilePmndrsTweaks'),
            pmndrsBloomIntensity: document.getElementById('compilePmndrsBloomIntensitySlider'),
            pmndrsBloomIntensityValue: document.getElementById('compilePmndrsBloomIntensityValue'),
            pmndrsBloomThreshold: document.getElementById('compilePmndrsBloomThresholdSlider'),
            pmndrsBloomThresholdValue: document.getElementById('compilePmndrsBloomThresholdValue'),
            pmndrsExposure: document.getElementById('compilePmndrsExposureSlider'),
            pmndrsExposureValue: document.getElementById('compilePmndrsExposureValue'),
            pmndrsVignette: document.getElementById('compilePmndrsVignetteToggle'),
            pmndrsVignetteDarkness: document.getElementById('compilePmndrsVignetteDarknessSlider'),
            pmndrsVignetteDarknessValue: document.getElementById('compilePmndrsVignetteDarknessValue'),
            pmndrsResetBtn: document.getElementById('compilePmndrsResetBtn')
        };
    }

    // Single source of truth for the pmndrs-tweak default values. Used by both
    // the Reset button and the loader/normalizer to keep behaviour consistent.
    var PMNDRS_TWEAK_DEFAULTS = {
        bloomIntensity: 1.0,
        bloomThreshold: 0.62,
        toneMappingExposure: 1.0,
        vignetteEnabled: false,
        vignetteDarkness: 0.5
    };

    function clampNumber(value, min, max, fallback) {
        var n = parseFloat(value);
        if (isNaN(n)) return fallback;
        if (n < min) return min;
        if (n > max) return max;
        return n;
    }

    function formatPmndrsNumber(value) {
        return (Math.round(value * 100) / 100).toFixed(2);
    }

    function normalizePostFxEngine(value) {
        if (value === 'pmndrs') {
            return 'pmndrs';
        }
        return 'legacy';
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

    function normalizeReflectionSource(value) {
        if (value === 'scene-probe') {
            return value;
        }

        return 'hdr';
    }

    function normalizeSSRStrength(value) {
        if (value === 'subtle' || value === 'balanced' || value === 'strong') {
            return value;
        }

        return 'off';
    }

    function normalizeEnvMapPreset(value) {
        if (value === 'studio' || value === 'quarry' || value === 'venice') {
            return value;
        }

        return 'none';
    }

    function normalizeAmbientOcclusionPreset(value) {
        if (value === 'off' || value === 'soft' || value === 'strong' || value === 'balanced') {
            return value;
        }

        return 'balanced';
    }

    function normalizeContactShadowPreset(value) {
        if (value === 'off' || value === 'strong' || value === 'soft') {
            return value;
        }

        return 'soft';
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
        if (typeof envir.scene.aframeFPSMeterEnabled === 'undefined') {
            envir.scene.aframeFPSMeterEnabled = false;
        }
        if (!envir.scene.aframeAmbientOcclusionPreset) {
            envir.scene.aframeAmbientOcclusionPreset = 'balanced';
        }
        if (!envir.scene.aframeContactShadowPreset) {
            envir.scene.aframeContactShadowPreset = 'soft';
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
        if (!envir.scene.aframeReflectionSource) {
            envir.scene.aframeReflectionSource = 'hdr';
        }
        if (!envir.scene.aframeEnvMapPreset) {
            envir.scene.aframeEnvMapPreset = 'none';
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
        if (typeof envir.scene.aframePostFXTAAEnabled === 'undefined') {
            envir.scene.aframePostFXTAAEnabled = false;
        }
        if (!envir.scene.aframePostFXSSRStrength) {
            envir.scene.aframePostFXSSRStrength = 'off';
        }
        if (typeof envir.scene.aframePostFXSSREnabled === 'undefined') {
            envir.scene.aframePostFXSSREnabled = false;
        }
        if (!envir.scene.aframePostFXEngine) {
            envir.scene.aframePostFXEngine = 'legacy';
        }
        if (typeof envir.scene.aframePmndrsBloomIntensity !== 'number') {
            envir.scene.aframePmndrsBloomIntensity = clampNumber(envir.scene.aframePmndrsBloomIntensity, 0, 3, 1.0);
        }
        if (typeof envir.scene.aframePmndrsBloomThreshold !== 'number') {
            envir.scene.aframePmndrsBloomThreshold = clampNumber(envir.scene.aframePmndrsBloomThreshold, 0, 1, 0.62);
        }
        if (typeof envir.scene.aframePmndrsVignetteEnabled === 'undefined') {
            envir.scene.aframePmndrsVignetteEnabled = false;
        }
        if (typeof envir.scene.aframePmndrsVignetteDarkness !== 'number') {
            envir.scene.aframePmndrsVignetteDarkness = clampNumber(envir.scene.aframePmndrsVignetteDarkness, 0, 1, 0.5);
        }
        if (typeof envir.scene.aframePmndrsToneMappingExposure !== 'number') {
            envir.scene.aframePmndrsToneMappingExposure = clampNumber(envir.scene.aframePmndrsToneMappingExposure, 0.3, 2.5, 1.0);
        }

        envir.scene.aframeAAQuality = normalizeAAQuality(envir.scene.aframeAAQuality);
        envir.scene.aframeAmbientOcclusionPreset = normalizeAmbientOcclusionPreset(envir.scene.aframeAmbientOcclusionPreset);
        envir.scene.aframeContactShadowPreset = normalizeContactShadowPreset(envir.scene.aframeContactShadowPreset);
        envir.scene.aframeBloomStrength = normalizeBloomStrength(envir.scene.aframeBloomStrength);
        envir.scene.aframeExposurePreset = normalizeExposurePreset(envir.scene.aframeExposurePreset);
        envir.scene.aframeContrastPreset = normalizeContrastPreset(envir.scene.aframeContrastPreset);
        envir.scene.aframeReflectionProfile = normalizeReflectionProfile(envir.scene.aframeReflectionProfile);
        envir.scene.aframeReflectionSource = normalizeReflectionSource(envir.scene.aframeReflectionSource);
        envir.scene.aframeEnvMapPreset = normalizeEnvMapPreset(envir.scene.aframeEnvMapPreset);
        envir.scene.aframePostFXSSRStrength = normalizeSSRStrength(envir.scene.aframePostFXSSRStrength);
        envir.scene.aframePostFXSSREnabled = envir.scene.aframePostFXSSRStrength !== 'off';
        envir.scene.aframePostFXEngine = normalizePostFxEngine(envir.scene.aframePostFXEngine);
        if (envir.scene.aframePostFXBloomEnabled === false) {
            envir.scene.aframeBloomStrength = 'off';
        }
        envir.scene.aframePostFXBloomEnabled = isBloomStrengthEnabled(envir.scene.aframeBloomStrength);
        envir.scene.aframePostFXVignetteEnabled = false;
    }

    function syncCompilePostFxState() {
        var controls = getCompileDialogElements();
        if (!controls.postFx || !controls.bloomStrength || !controls.postFxColor || !controls.edgeAAStrength || !controls.exposurePreset || !controls.contrastPreset || !controls.reflectionProfile || !controls.reflectionSource) {
            return;
        }

        var postFxEnabled = controls.postFx.checked;
        var colorGradingEnabled = postFxEnabled && controls.postFxColor.checked;
        var envLightingEnabled = postFxEnabled && normalizeReflectionSource(controls.reflectionSource.value) === 'hdr';
        var engine = controls.postFxEngine ? normalizePostFxEngine(controls.postFxEngine.value) : 'legacy';
        var isPmndrs = engine === 'pmndrs';

        if (controls.postFxGroup) {
            if (postFxEnabled) {
                controls.postFxGroup.classList.remove('tw-opacity-50', 'tw-pointer-events-none');
            } else {
                controls.postFxGroup.classList.add('tw-opacity-50', 'tw-pointer-events-none');
            }
        }

        if (controls.postFxEngine) {
            controls.postFxEngine.disabled = !postFxEnabled;
        }
        // Visually reflect the active engine on the tab strip and gate the tabs by postFx
        if (controls.postFxEngineTabLegacy && controls.postFxEngineTabPmndrs) {
            controls.postFxEngineTabLegacy.classList.toggle('tw-tab-active', !isPmndrs);
            controls.postFxEngineTabPmndrs.classList.toggle('tw-tab-active', isPmndrs);
            [controls.postFxEngineTabLegacy, controls.postFxEngineTabPmndrs].forEach(function (tab) {
                tab.disabled = !postFxEnabled;
                tab.classList.toggle('tw-opacity-50', !postFxEnabled);
                tab.style.cursor = postFxEnabled ? 'pointer' : 'not-allowed';
            });
        }
        if (controls.postFxEngineHint) {
            controls.postFxEngineHint.textContent = isPmndrs
                ? 'Modern fused EffectPass. SSR and Temporal AA are not available in this engine.'
                : 'Hand-rolled custom pipeline. Supports SSR and Temporal AA, no volumetric clouds.';
        }

        controls.postFxColor.disabled = !postFxEnabled;
        controls.bloomStrength.disabled = !postFxEnabled;
        controls.reflectionProfile.disabled = !postFxEnabled;
        controls.reflectionSource.disabled = !postFxEnabled;
        if (controls.envMapPreset) {
            controls.envMapPreset.disabled = !envLightingEnabled;
            controls.envMapPreset.classList.toggle('tw-opacity-60', !envLightingEnabled);
            controls.envMapPreset.title = envLightingEnabled
                ? 'HDR environment map for PBR reflections and lighting'
                : 'Env Lighting is used only when Reflection Source is HDR';
        }
        controls.exposurePreset.disabled = !colorGradingEnabled;
        controls.contrastPreset.disabled = !colorGradingEnabled;
        controls.edgeAAStrength.disabled = !postFxEnabled;

        // SSR and TAA are unavailable when the pmndrs engine is selected — see
        // POSTPROCESSING_MIGRATION_PLAN.md §11. Force them disabled and apply a
        // tooltip explaining why so the user understands the trade-off.
        if (controls.ssrStrength) {
            controls.ssrStrength.disabled = !postFxEnabled || isPmndrs;
            controls.ssrStrength.classList.toggle('tw-opacity-60', isPmndrs);
            controls.ssrStrength.title = isPmndrs
                ? 'Screen-space reflections are not available in the Pmndrs engine. Switch to Legacy to use SSR.'
                : 'Screen-space reflections for floors, glass, and polished surfaces';
        }
        if (controls.taaEnabled) {
            controls.taaEnabled.disabled = !postFxEnabled || isPmndrs;
            controls.taaEnabled.parentElement && controls.taaEnabled.parentElement.classList.toggle('tw-opacity-60', isPmndrs);
            controls.taaEnabled.title = isPmndrs
                ? 'Temporal AA is not available in the Pmndrs engine. Switch to Legacy to use TAA.'
                : 'Temporal anti-aliasing for smoother edges and reduced specular shimmer. Supplements FXAA.';
        }
        // Pmndrs tweakables: only show & enable when engine === 'pmndrs' AND postFx is on
        if (controls.pmndrsTweaksGroup) {
            controls.pmndrsTweaksGroup.style.display = (postFxEnabled && isPmndrs) ? '' : 'none';
        }
        var pmndrsTweakEnabled = postFxEnabled && isPmndrs;
        if (controls.pmndrsBloomIntensity) controls.pmndrsBloomIntensity.disabled = !pmndrsTweakEnabled;
        if (controls.pmndrsBloomThreshold) controls.pmndrsBloomThreshold.disabled = !pmndrsTweakEnabled;
        if (controls.pmndrsExposure) controls.pmndrsExposure.disabled = !pmndrsTweakEnabled;
        if (controls.pmndrsVignette) controls.pmndrsVignette.disabled = !pmndrsTweakEnabled;
        if (controls.pmndrsVignetteDarkness) {
            controls.pmndrsVignetteDarkness.disabled = !pmndrsTweakEnabled || !(controls.pmndrsVignette && controls.pmndrsVignette.checked);
        }

        updateEdgeAAStrengthLabel();
    }

    function updatePmndrsValueLabels() {
        var c = getCompileDialogElements();
        if (c.pmndrsBloomIntensity && c.pmndrsBloomIntensityValue) {
            c.pmndrsBloomIntensityValue.textContent = formatPmndrsNumber(parseFloat(c.pmndrsBloomIntensity.value));
        }
        if (c.pmndrsBloomThreshold && c.pmndrsBloomThresholdValue) {
            c.pmndrsBloomThresholdValue.textContent = formatPmndrsNumber(parseFloat(c.pmndrsBloomThreshold.value));
        }
        if (c.pmndrsExposure && c.pmndrsExposureValue) {
            c.pmndrsExposureValue.textContent = formatPmndrsNumber(parseFloat(c.pmndrsExposure.value));
        }
        if (c.pmndrsVignetteDarkness && c.pmndrsVignetteDarknessValue) {
            c.pmndrsVignetteDarknessValue.textContent = formatPmndrsNumber(parseFloat(c.pmndrsVignetteDarkness.value));
        }
    }

    function applyCompileDialogSettingsToScene() {
        if (typeof envir === 'undefined' || !envir.scene) {
            return;
        }

        var controls = getCompileDialogElements();
        if (!controls.renderQuality || !controls.shadowQuality || !controls.aaQuality || !controls.ambientOcclusionPreset || !controls.contactShadowPreset || !controls.fpsMeter || !controls.postFx || !controls.postFxColor || !controls.edgeAAStrength || !controls.bloomStrength || !controls.exposurePreset || !controls.contrastPreset || !controls.reflectionProfile || !controls.reflectionSource) {
            return;
        }

        ensureCompileSceneSettingsDefaults();

        envir.scene.aframeRenderQuality = controls.renderQuality.value || 'standard';
        envir.scene.aframeShadowQuality = controls.shadowQuality.value || 'medium';
        envir.scene.aframeAAQuality = normalizeAAQuality(controls.aaQuality.value);
        envir.scene.aframeAmbientOcclusionPreset = normalizeAmbientOcclusionPreset(controls.ambientOcclusionPreset.value);
        envir.scene.aframeContactShadowPreset = normalizeContactShadowPreset(controls.contactShadowPreset.value);
        envir.scene.aframeFPSMeterEnabled = controls.fpsMeter.checked === true;
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
        envir.scene.aframeReflectionSource = normalizeReflectionSource(controls.reflectionSource.value);
        envir.scene.aframeEnvMapPreset = controls.envMapPreset ? normalizeEnvMapPreset(controls.envMapPreset.value) : 'none';

        if (controls.ssrStrength) {
            envir.scene.aframePostFXSSRStrength = normalizeSSRStrength(controls.ssrStrength.value);
            envir.scene.aframePostFXSSREnabled = envir.scene.aframePostFXSSRStrength !== 'off';
        }
        if (controls.taaEnabled) {
            envir.scene.aframePostFXTAAEnabled = controls.taaEnabled.checked === true;
        }
        if (controls.postFxEngine) {
            envir.scene.aframePostFXEngine = normalizePostFxEngine(controls.postFxEngine.value);
        }
        if (controls.pmndrsBloomIntensity) {
            envir.scene.aframePmndrsBloomIntensity = clampNumber(controls.pmndrsBloomIntensity.value, 0, 3, 1.0);
        }
        if (controls.pmndrsBloomThreshold) {
            envir.scene.aframePmndrsBloomThreshold = clampNumber(controls.pmndrsBloomThreshold.value, 0, 1, 0.62);
        }
        if (controls.pmndrsExposure) {
            envir.scene.aframePmndrsToneMappingExposure = clampNumber(controls.pmndrsExposure.value, 0.3, 2.5, 1.0);
        }
        if (controls.pmndrsVignette) {
            envir.scene.aframePmndrsVignetteEnabled = controls.pmndrsVignette.checked === true;
        }
        if (controls.pmndrsVignetteDarkness) {
            envir.scene.aframePmndrsVignetteDarkness = clampNumber(controls.pmndrsVignetteDarkness.value, 0, 1, 0.5);
        }
    }

    window.vrodosApplyCompileDialogSettingsToScene = applyCompileDialogSettingsToScene;

    window.syncCompileDialogFromSceneSettings = function() {
        var controls = getCompileDialogElements();
        if (!controls.renderQuality || !controls.shadowQuality || !controls.aaQuality || !controls.ambientOcclusionPreset || !controls.contactShadowPreset || !controls.fpsMeter || !controls.postFx || !controls.postFxColor || !controls.edgeAAStrength || !controls.bloomStrength || !controls.exposurePreset || !controls.contrastPreset || !controls.reflectionProfile || !controls.reflectionSource) {
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
        controls.ambientOcclusionPreset.value = envir && envir.scene
            ? normalizeAmbientOcclusionPreset(envir.scene.aframeAmbientOcclusionPreset)
            : 'balanced';
        controls.contactShadowPreset.value = envir && envir.scene
            ? normalizeContactShadowPreset(envir.scene.aframeContactShadowPreset)
            : 'soft';
        controls.fpsMeter.checked = !!(envir && envir.scene && envir.scene.aframeFPSMeterEnabled);
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
        controls.reflectionSource.value = envir && envir.scene && envir.scene.aframeReflectionSource
            ? normalizeReflectionSource(envir.scene.aframeReflectionSource)
            : 'hdr';
        if (controls.envMapPreset) {
            controls.envMapPreset.value = envir && envir.scene && envir.scene.aframeEnvMapPreset
                ? normalizeEnvMapPreset(envir.scene.aframeEnvMapPreset)
                : 'none';
        }
        if (controls.ssrStrength) {
            controls.ssrStrength.value = envir && envir.scene && envir.scene.aframePostFXSSRStrength
                ? normalizeSSRStrength(envir.scene.aframePostFXSSRStrength)
                : 'off';
        }
        if (controls.taaEnabled) {
            controls.taaEnabled.checked = !!(envir && envir.scene && envir.scene.aframePostFXTAAEnabled);
        }
        if (controls.postFxEngine) {
            controls.postFxEngine.value = envir && envir.scene && envir.scene.aframePostFXEngine
                ? normalizePostFxEngine(envir.scene.aframePostFXEngine)
                : 'legacy';
        }

        if (controls.pmndrsBloomIntensity) {
            controls.pmndrsBloomIntensity.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsBloomIntensity : 1.0, 0, 3, 1.0);
        }
        if (controls.pmndrsBloomThreshold) {
            controls.pmndrsBloomThreshold.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsBloomThreshold : 0.62, 0, 1, 0.62);
        }
        if (controls.pmndrsExposure) {
            controls.pmndrsExposure.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsToneMappingExposure : 1.0, 0.3, 2.5, 1.0);
        }
        if (controls.pmndrsVignette) {
            controls.pmndrsVignette.checked = !!(envir && envir.scene && envir.scene.aframePmndrsVignetteEnabled);
        }
        if (controls.pmndrsVignetteDarkness) {
            controls.pmndrsVignetteDarkness.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsVignetteDarkness : 0.5, 0, 1, 0.5);
        }
        updatePmndrsValueLabels();

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
    if (controls.ambientOcclusionPreset) {
        controls.ambientOcclusionPreset.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.contactShadowPreset) {
        controls.contactShadowPreset.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.fpsMeter) {
        controls.fpsMeter.addEventListener('change', syncCompilePostFxState);
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
    if (controls.reflectionSource) {
        controls.reflectionSource.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.envMapPreset) {
        controls.envMapPreset.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.ssrStrength) {
        controls.ssrStrength.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.taaEnabled) {
        controls.taaEnabled.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.postFxEngine) {
        controls.postFxEngine.addEventListener('change', syncCompilePostFxState);
    }
    // Tab strip — clicking a tab writes the engine value into the hidden input
    // and re-runs the show/hide gating. Disabled tabs (when postFx is off) are no-ops.
    function bindEngineTab(tabEl) {
        if (!tabEl) return;
        tabEl.addEventListener('click', function (e) {
            e.preventDefault();
            if (tabEl.disabled) return;
            var engine = tabEl.getAttribute('data-engine') === 'pmndrs' ? 'pmndrs' : 'legacy';
            if (controls.postFxEngine) {
                controls.postFxEngine.value = engine;
            }
            syncCompilePostFxState();
        });
    }
    bindEngineTab(controls.postFxEngineTabLegacy);
    bindEngineTab(controls.postFxEngineTabPmndrs);
    [controls.pmndrsBloomIntensity, controls.pmndrsBloomThreshold, controls.pmndrsExposure, controls.pmndrsVignetteDarkness].forEach(function (el) {
        if (el) {
            el.addEventListener('input', updatePmndrsValueLabels);
        }
    });
    if (controls.pmndrsVignette) {
        controls.pmndrsVignette.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsResetBtn) {
        controls.pmndrsResetBtn.addEventListener('click', function (e) {
            e.preventDefault();
            var c = getCompileDialogElements();
            if (c.pmndrsBloomIntensity) c.pmndrsBloomIntensity.value = PMNDRS_TWEAK_DEFAULTS.bloomIntensity;
            if (c.pmndrsBloomThreshold) c.pmndrsBloomThreshold.value = PMNDRS_TWEAK_DEFAULTS.bloomThreshold;
            if (c.pmndrsExposure) c.pmndrsExposure.value = PMNDRS_TWEAK_DEFAULTS.toneMappingExposure;
            if (c.pmndrsVignette) c.pmndrsVignette.checked = PMNDRS_TWEAK_DEFAULTS.vignetteEnabled;
            if (c.pmndrsVignetteDarkness) c.pmndrsVignetteDarkness.value = PMNDRS_TWEAK_DEFAULTS.vignetteDarkness;
            updatePmndrsValueLabels();
            syncCompilePostFxState();
        });
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
