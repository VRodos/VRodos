document.addEventListener('DOMContentLoaded', function() {
    function getCompileDialogElements() {
        return {
            renderQuality: document.getElementById('compileRenderQualitySelect'),
            shadowQuality: document.getElementById('compileShadowQualitySelect'),
            aaQualityWrapper: document.getElementById('compileAAQualityWrapper'),
            aaQuality: document.getElementById('compileAAQualitySelect'),
            ambientOcclusionPreset: document.getElementById('compileAmbientOcclusionPresetSelect'),
            contactShadowPreset: document.getElementById('compileContactShadowPresetSelect'),
            fpsMeter: document.getElementById('compileFPSMeterToggle'),
            legacyHorizonStageSizeRow: document.getElementById('compileLegacyHorizonStageSizeRow'),
            legacyHorizonStageSize: document.getElementById('compileLegacyHorizonStageSizeSlider'),
            legacyHorizonStageSizeValue: document.getElementById('compileLegacyHorizonStageSizeValue'),
            postFx: document.getElementById('compilePostFxToggle'),
            universalPostFxGroup: document.getElementById('compileUniversalPostFxGroup'),
            colorGradingWrapper: document.getElementById('compileColorGradingWrapper'),
            envMapPresetWrapper: document.getElementById('compileEnvMapPresetWrapper'),
            edgeAAWrapper: document.getElementById('compileEdgeAAWrapper'),
            engineControlsColumn: document.getElementById('compileEngineControlsColumn'),
            legacyPane: document.getElementById('compileLegacyPane'),
            pmndrsPane: document.getElementById('compilePmndrsPane'),
            postFxEngineHintBadge: document.getElementById('compilePostFxEngineHintBadge'),
            pmndrsAAWrapper: document.getElementById('compilePmndrsAAWrapper'),
            pmndrsAAMode: document.getElementById('compilePmndrsAAModeSelect'),
            pmndrsAAPresetWrapper: document.getElementById('compilePmndrsAAPresetWrapper'),
            pmndrsAAPreset: document.getElementById('compilePmndrsAAPresetSelect'),
            pmndrsBloomWrapper: document.getElementById('compilePmndrsBloomWrapper'),
            pmndrsVignetteWrapper: document.getElementById('compilePmndrsVignetteWrapper'),
            pmndrsAtmosphereWrapper: document.getElementById('compilePmndrsAtmosphereWrapper'),
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
            pmndrsBloomIntensity: document.getElementById('compilePmndrsBloomIntensitySlider'),
            pmndrsBloomIntensityValue: document.getElementById('compilePmndrsBloomIntensityValue'),
            pmndrsBloomThreshold: document.getElementById('compilePmndrsBloomThresholdSlider'),
            pmndrsBloomThresholdValue: document.getElementById('compilePmndrsBloomThresholdValue'),
            pmndrsExposure: document.getElementById('compilePmndrsExposureSlider'),
            pmndrsExposureValue: document.getElementById('compilePmndrsExposureValue'),
            pmndrsVignette: document.getElementById('compilePmndrsVignetteToggle'),
            pmndrsVignetteDarkness: document.getElementById('compilePmndrsVignetteDarknessSlider'),
            pmndrsVignetteDarknessValue: document.getElementById('compilePmndrsVignetteDarknessValue'),
            pmndrsAtmosphere: document.getElementById('compilePmndrsAtmosphereToggle'),
            pmndrsAtmosphereQuality: document.getElementById('compilePmndrsAtmosphereQualitySelect'),
            pmndrsAtmosphereAdvanced: document.getElementById('compilePmndrsAtmosphereAdvanced'),
            pmndrsSunElevation: document.getElementById('compilePmndrsSunElevationSlider'),
            pmndrsSunElevationValue: document.getElementById('compilePmndrsSunElevationValue'),
            pmndrsSunAzimuth: document.getElementById('compilePmndrsSunAzimuthSlider'),
            pmndrsSunAzimuthValue: document.getElementById('compilePmndrsSunAzimuthValue'),
            pmndrsSunAngularRadius: document.getElementById('compilePmndrsSunAngularRadiusSlider'),
            pmndrsSunAngularRadiusValue: document.getElementById('compilePmndrsSunAngularRadiusValue'),
            pmndrsSunDistance: document.getElementById('compilePmndrsSunDistanceSlider'),
            pmndrsSunDistanceValue: document.getElementById('compilePmndrsSunDistanceValue'),
            pmndrsAerialStrength: document.getElementById('compilePmndrsAerialStrengthSlider'),
            pmndrsAerialStrengthValue: document.getElementById('compilePmndrsAerialStrengthValue'),
            pmndrsAlbedoScale: document.getElementById('compilePmndrsAlbedoScaleSlider'),
            pmndrsAlbedoScaleValue: document.getElementById('compilePmndrsAlbedoScaleValue'),
            pmndrsTransmittance: document.getElementById('compilePmndrsTransmittanceToggle'),
            pmndrsInscatter: document.getElementById('compilePmndrsInscatterToggle'),
            pmndrsGround: document.getElementById('compilePmndrsGroundToggle'),
            pmndrsGroundAlbedo: document.getElementById('compilePmndrsGroundAlbedoInput'),
            pmndrsRayleighScale: document.getElementById('compilePmndrsRayleighScaleSlider'),
            pmndrsRayleighScaleValue: document.getElementById('compilePmndrsRayleighScaleValue'),
            pmndrsMieScatteringScale: document.getElementById('compilePmndrsMieScatteringScaleSlider'),
            pmndrsMieScatteringScaleValue: document.getElementById('compilePmndrsMieScatteringScaleValue'),
            pmndrsMieExtinctionScale: document.getElementById('compilePmndrsMieExtinctionScaleSlider'),
            pmndrsMieExtinctionScaleValue: document.getElementById('compilePmndrsMieExtinctionScaleValue'),
            pmndrsMiePhaseG: document.getElementById('compilePmndrsMiePhaseGSlider'),
            pmndrsMiePhaseGValue: document.getElementById('compilePmndrsMiePhaseGValue'),
            pmndrsAbsorptionScale: document.getElementById('compilePmndrsAbsorptionScaleSlider'),
            pmndrsAbsorptionScaleValue: document.getElementById('compilePmndrsAbsorptionScaleValue'),
            pmndrsMoon: document.getElementById('compilePmndrsMoonToggle'),
            pmndrsResetBtn: document.getElementById('compilePmndrsResetBtn')
        };
    }

    // Single source of truth for the pmndrs-tweak default values. Used by both
    // the Reset button and the loader/normalizer to keep behaviour consistent.
    var PMNDRS_TWEAK_DEFAULTS = {
        aaMode: 'none',
        aaPreset: 'medium',
        bloomIntensity: 1.0,
        bloomThreshold: 0.62,
        toneMappingExposure: 1.0,
        vignetteEnabled: false,
        vignetteDarkness: 0.5,
        atmosphereEnabled: true,
        atmosphereQuality: 'balanced',
        sunElevationDeg: 10,
        sunAzimuthDeg: 38,
        sunDistance: 5200,
        sunAngularRadius: 0.0047,
        aerialStrength: 0.85,
        albedoScale: 0.96,
        transmittanceEnabled: true,
        inscatterEnabled: true,
        groundEnabled: true,
        groundAlbedo: '#f0e6d6',
        rayleighScale: 1.0,
        mieScatteringScale: 0.9,
        mieExtinctionScale: 1.0,
        miePhaseG: 0.8,
        absorptionScale: 1.0,
        moonEnabled: false
    };

    var PMNDRS_ATMOSPHERE_PRESETS = {
        performance: {
            sunElevationDeg: 8,
            sunAzimuthDeg: 34,
            sunDistance: 4800,
            sunAngularRadius: 0.0047,
            aerialStrength: 0.6,
            albedoScale: 0.92,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#e8ddc9',
            rayleighScale: 0.82,
            mieScatteringScale: 0.62,
            mieExtinctionScale: 0.74,
            miePhaseG: 0.72,
            absorptionScale: 0.82,
            moonEnabled: false
        },
        balanced: {
            sunElevationDeg: 10,
            sunAzimuthDeg: 38,
            sunDistance: 5200,
            sunAngularRadius: 0.0047,
            aerialStrength: 0.85,
            albedoScale: 0.96,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f0e6d6',
            rayleighScale: 1.0,
            mieScatteringScale: 0.9,
            mieExtinctionScale: 1.0,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        },
        quality: {
            sunElevationDeg: 12,
            sunAzimuthDeg: 40,
            sunDistance: 5600,
            sunAngularRadius: 0.0047,
            aerialStrength: 1.0,
            albedoScale: 1.0,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f6ead7',
            rayleighScale: 1.12,
            mieScatteringScale: 1.02,
            mieExtinctionScale: 1.05,
            miePhaseG: 0.82,
            absorptionScale: 1.02,
            moonEnabled: false
        },
        cinematic: {
            sunElevationDeg: 7,
            sunAzimuthDeg: 28,
            sunDistance: 6200,
            sunAngularRadius: 0.0047,
            aerialStrength: 1.15,
            albedoScale: 1.05,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f8ead2',
            rayleighScale: 1.2,
            mieScatteringScale: 1.16,
            mieExtinctionScale: 1.18,
            miePhaseG: 0.84,
            absorptionScale: 0.96,
            moonEnabled: false
        }
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

    function formatPmndrsRadius(value) {
        var n = parseFloat(value);
        if (isNaN(n)) {
            n = 0;
        }
        return n.toFixed(4);
    }

    function formatPmndrsDegrees(value) {
        return String(Math.round(parseFloat(value) || 0)) + '\u00b0';
    }

    function normalizePmndrsAtmosphereQuality(value) {
        if (value === 'performance' || value === 'quality' || value === 'cinematic' || value === 'custom') {
            return value;
        }
        return 'balanced';
    }

    function normalizePmndrsAAMode(value) {
        if (value === 'none' || value === 'smaa' || value === 'msaa') {
            return value;
        }
        return 'inherit';
    }

    function normalizePmndrsAAPreset(value) {
        if (value === 'low' || value === 'medium' || value === 'high' || value === 'ultra') {
            return value;
        }
        return 'inherit';
    }

    function derivePmndrsAAModeFromAAQuality(value) {
        return normalizeAAQuality(value) === 'off' ? 'none' : 'msaa';
    }

    function derivePmndrsAAPresetFromAAQuality(value) {
        switch (normalizeAAQuality(value)) {
            case 'high':
                return 'high';
            case 'ultra':
                return 'ultra';
            case 'off':
            case 'balanced':
            default:
                return 'medium';
        }
    }

    function normalizeColorHex(value, fallback) {
        var raw = (typeof value === 'string') ? value.trim() : '';
        if (!/^#?[0-9a-fA-F]{6}$/.test(raw)) {
            return fallback;
        }
        return raw.charAt(0) === '#' ? raw.toLowerCase() : ('#' + raw.toLowerCase());
    }

    function applyPmndrsAtmospherePreset(controls, quality) {
        var presetKey = normalizePmndrsAtmosphereQuality(quality);
        if (presetKey === 'custom') {
            return;
        }

        var preset = PMNDRS_ATMOSPHERE_PRESETS[presetKey] || PMNDRS_ATMOSPHERE_PRESETS.balanced;
        if (controls.pmndrsAtmosphereQuality) controls.pmndrsAtmosphereQuality.value = presetKey;
        if (controls.pmndrsSunElevation) controls.pmndrsSunElevation.value = preset.sunElevationDeg;
        if (controls.pmndrsSunAzimuth) controls.pmndrsSunAzimuth.value = preset.sunAzimuthDeg;
        if (controls.pmndrsSunDistance) controls.pmndrsSunDistance.value = preset.sunDistance;
        if (controls.pmndrsSunAngularRadius) controls.pmndrsSunAngularRadius.value = preset.sunAngularRadius;
        if (controls.pmndrsAerialStrength) controls.pmndrsAerialStrength.value = preset.aerialStrength;
        if (controls.pmndrsAlbedoScale) controls.pmndrsAlbedoScale.value = preset.albedoScale;
        if (controls.pmndrsTransmittance) controls.pmndrsTransmittance.checked = preset.transmittanceEnabled === true;
        if (controls.pmndrsInscatter) controls.pmndrsInscatter.checked = preset.inscatterEnabled === true;
        if (controls.pmndrsGround) controls.pmndrsGround.checked = preset.groundEnabled === true;
        if (controls.pmndrsGroundAlbedo) controls.pmndrsGroundAlbedo.value = normalizeColorHex(preset.groundAlbedo, PMNDRS_TWEAK_DEFAULTS.groundAlbedo);
        if (controls.pmndrsRayleighScale) controls.pmndrsRayleighScale.value = preset.rayleighScale;
        if (controls.pmndrsMieScatteringScale) controls.pmndrsMieScatteringScale.value = preset.mieScatteringScale;
        if (controls.pmndrsMieExtinctionScale) controls.pmndrsMieExtinctionScale.value = preset.mieExtinctionScale;
        if (controls.pmndrsMiePhaseG) controls.pmndrsMiePhaseG.value = preset.miePhaseG;
        if (controls.pmndrsAbsorptionScale) controls.pmndrsAbsorptionScale.value = preset.absorptionScale;
        if (controls.pmndrsMoon) controls.pmndrsMoon.checked = preset.moonEnabled === true;
    }

    function markPmndrsAtmosphereCustom(controls) {
        if (controls.pmndrsAtmosphereQuality) {
            controls.pmndrsAtmosphereQuality.value = 'custom';
        }
    }

    function setPmndrsAtmosphereAdvancedState(controls, enabled) {
        var isEnabled = enabled === true;
        if (controls.pmndrsAtmosphereAdvanced) {
            controls.pmndrsAtmosphereAdvanced.classList.toggle('tw-opacity-50', !isEnabled);
            controls.pmndrsAtmosphereAdvanced.classList.toggle('tw-pointer-events-none', !isEnabled);
        }

        [
            controls.pmndrsAtmosphereQuality,
            controls.pmndrsSunElevation,
            controls.pmndrsSunAzimuth,
            controls.pmndrsSunAngularRadius,
            controls.pmndrsSunDistance,
            controls.pmndrsAerialStrength,
            controls.pmndrsAlbedoScale,
            controls.pmndrsTransmittance,
            controls.pmndrsInscatter,
            controls.pmndrsGround,
            controls.pmndrsGroundAlbedo,
            controls.pmndrsRayleighScale,
            controls.pmndrsMieScatteringScale,
            controls.pmndrsMieExtinctionScale,
            controls.pmndrsMiePhaseG,
            controls.pmndrsAbsorptionScale,
            controls.pmndrsMoon
        ].forEach(function (el) {
            if (el) {
                el.disabled = !isEnabled;
            }
        });
    }

    function clampLegacyHorizonStageSize(value) {
        return Math.round(clampNumber(value, 500, 8000, 5000) / 100) * 100;
    }

    function isLegacyHorizonStageApplicable() {
        if (typeof envir === 'undefined' || !envir.scene) {
            return false;
        }

        return parseInt(envir.scene.backgroundStyleOption, 10) === 0;
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
        if (typeof envir === 'undefined' || !envir || !envir.scene) {
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
        if (typeof envir.scene.aframeLegacyHorizonStageSize !== 'number') {
            envir.scene.aframeLegacyHorizonStageSize = clampLegacyHorizonStageSize(envir.scene.aframeLegacyHorizonStageSize);
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
        if (!envir.scene.aframePmndrsAAMode) {
            envir.scene.aframePmndrsAAMode = 'inherit';
        }
        if (!envir.scene.aframePmndrsAAPreset) {
            envir.scene.aframePmndrsAAPreset = 'inherit';
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
        if (typeof envir.scene.aframePmndrsAtmosphereEnabled === 'undefined') {
            envir.scene.aframePmndrsAtmosphereEnabled = PMNDRS_TWEAK_DEFAULTS.atmosphereEnabled;
        }
        if (!envir.scene.aframePmndrsAtmosphereQuality) {
            envir.scene.aframePmndrsAtmosphereQuality = PMNDRS_TWEAK_DEFAULTS.atmosphereQuality;
        }
        if (typeof envir.scene.aframePmndrsSunElevationDeg !== 'number') {
            envir.scene.aframePmndrsSunElevationDeg = clampNumber(envir.scene.aframePmndrsSunElevationDeg, -15, 75, PMNDRS_TWEAK_DEFAULTS.sunElevationDeg);
        }
        if (typeof envir.scene.aframePmndrsSunAzimuthDeg !== 'number') {
            envir.scene.aframePmndrsSunAzimuthDeg = clampNumber(envir.scene.aframePmndrsSunAzimuthDeg, -180, 180, PMNDRS_TWEAK_DEFAULTS.sunAzimuthDeg);
        }
        if (typeof envir.scene.aframePmndrsSunDistance !== 'number') {
            envir.scene.aframePmndrsSunDistance = clampNumber(envir.scene.aframePmndrsSunDistance, 1500, 12000, PMNDRS_TWEAK_DEFAULTS.sunDistance);
        }
        if (typeof envir.scene.aframePmndrsSunAngularRadius !== 'number') {
            envir.scene.aframePmndrsSunAngularRadius = clampNumber(envir.scene.aframePmndrsSunAngularRadius, 0.001, 0.03, PMNDRS_TWEAK_DEFAULTS.sunAngularRadius);
        }
        if (typeof envir.scene.aframePmndrsAerialStrength !== 'number') {
            envir.scene.aframePmndrsAerialStrength = clampNumber(envir.scene.aframePmndrsAerialStrength, 0, 2, PMNDRS_TWEAK_DEFAULTS.aerialStrength);
        }
        if (typeof envir.scene.aframePmndrsAlbedoScale !== 'number') {
            envir.scene.aframePmndrsAlbedoScale = clampNumber(envir.scene.aframePmndrsAlbedoScale, 0, 2, PMNDRS_TWEAK_DEFAULTS.albedoScale);
        }
        if (typeof envir.scene.aframePmndrsTransmittanceEnabled === 'undefined') {
            envir.scene.aframePmndrsTransmittanceEnabled = PMNDRS_TWEAK_DEFAULTS.transmittanceEnabled;
        }
        if (typeof envir.scene.aframePmndrsInscatterEnabled === 'undefined') {
            envir.scene.aframePmndrsInscatterEnabled = PMNDRS_TWEAK_DEFAULTS.inscatterEnabled;
        }
        if (typeof envir.scene.aframePmndrsGroundEnabled === 'undefined') {
            envir.scene.aframePmndrsGroundEnabled = PMNDRS_TWEAK_DEFAULTS.groundEnabled;
        }
        envir.scene.aframePmndrsGroundAlbedo = normalizeColorHex(envir.scene.aframePmndrsGroundAlbedo, PMNDRS_TWEAK_DEFAULTS.groundAlbedo);
        if (typeof envir.scene.aframePmndrsRayleighScale !== 'number') {
            envir.scene.aframePmndrsRayleighScale = clampNumber(envir.scene.aframePmndrsRayleighScale, 0.1, 3, PMNDRS_TWEAK_DEFAULTS.rayleighScale);
        }
        if (typeof envir.scene.aframePmndrsMieScatteringScale !== 'number') {
            envir.scene.aframePmndrsMieScatteringScale = clampNumber(envir.scene.aframePmndrsMieScatteringScale, 0.1, 3, PMNDRS_TWEAK_DEFAULTS.mieScatteringScale);
        }
        if (typeof envir.scene.aframePmndrsMieExtinctionScale !== 'number') {
            envir.scene.aframePmndrsMieExtinctionScale = clampNumber(envir.scene.aframePmndrsMieExtinctionScale, 0.1, 3, PMNDRS_TWEAK_DEFAULTS.mieExtinctionScale);
        }
        if (typeof envir.scene.aframePmndrsMiePhaseG !== 'number') {
            envir.scene.aframePmndrsMiePhaseG = clampNumber(envir.scene.aframePmndrsMiePhaseG, 0, 0.99, PMNDRS_TWEAK_DEFAULTS.miePhaseG);
        }
        if (typeof envir.scene.aframePmndrsAbsorptionScale !== 'number') {
            envir.scene.aframePmndrsAbsorptionScale = clampNumber(envir.scene.aframePmndrsAbsorptionScale, 0.1, 3, PMNDRS_TWEAK_DEFAULTS.absorptionScale);
        }
        if (typeof envir.scene.aframePmndrsMoonEnabled === 'undefined') {
            envir.scene.aframePmndrsMoonEnabled = PMNDRS_TWEAK_DEFAULTS.moonEnabled;
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
        envir.scene.aframePmndrsAAMode = normalizePmndrsAAMode(envir.scene.aframePmndrsAAMode);
        envir.scene.aframePmndrsAAPreset = normalizePmndrsAAPreset(envir.scene.aframePmndrsAAPreset);
        envir.scene.aframePmndrsAtmosphereQuality = normalizePmndrsAtmosphereQuality(envir.scene.aframePmndrsAtmosphereQuality);
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
        var bloomEnabled = postFxEnabled && isBloomStrengthEnabled(controls.bloomStrength.value);
        var engine = controls.postFxEngine ? normalizePostFxEngine(controls.postFxEngine.value) : 'legacy';
        var isPmndrs = engine === 'pmndrs';
        var edgeAAAvailable = postFxEnabled && !isPmndrs;
        var legacyHorizonStageEnabled = !isPmndrs && isLegacyHorizonStageApplicable();

        if (controls.universalPostFxGroup) {
            controls.universalPostFxGroup.style.display = postFxEnabled ? '' : 'none';
        }

        if (controls.postFxEngineHintBadge) {
            controls.postFxEngineHintBadge.style.display = postFxEnabled ? 'none' : '';
        }

        if (controls.postFxEngine) {
            controls.postFxEngine.disabled = !postFxEnabled;
        }

        if (controls.postFxEngineTabLegacy && controls.postFxEngineTabPmndrs) {
            controls.postFxEngineTabLegacy.classList.toggle('tw-tab-active', !isPmndrs);
            controls.postFxEngineTabPmndrs.classList.toggle('tw-tab-active', isPmndrs);
            [controls.postFxEngineTabLegacy, controls.postFxEngineTabPmndrs].forEach(function (tab) {
                tab.disabled = !postFxEnabled;
                tab.classList.toggle('tw-opacity-50', !postFxEnabled);
                tab.style.cursor = postFxEnabled ? 'pointer' : 'not-allowed';
            });
        }

        if (controls.legacyPane) {
            controls.legacyPane.style.display = (postFxEnabled && !isPmndrs) ? '' : 'none';
        }
        if (controls.pmndrsPane) {
            controls.pmndrsPane.style.display = (postFxEnabled && isPmndrs) ? '' : 'none';
        }

        if (controls.postFxEngineHint) {
            controls.postFxEngineHint.textContent = isPmndrs
                ? 'Modern fused EffectPass. Choose PMNDRS anti-aliasing below with exclusive None, SMAA, or MSAA modes. SSR and Temporal AA are not available in this engine.'
                : 'Hand-rolled custom pipeline. Supports SSR and Temporal AA, no volumetric clouds.';
        }

        if (controls.aaQualityWrapper) {
            controls.aaQualityWrapper.style.display = isPmndrs ? 'none' : '';
        }
        if (controls.aaQuality) {
            controls.aaQuality.disabled = isPmndrs;
            controls.aaQuality.title = 'Controls the renderer anti-aliasing quality tier.';
        }

        if (controls.legacyHorizonStageSizeRow) {
            controls.legacyHorizonStageSizeRow.style.display = legacyHorizonStageEnabled ? '' : 'none';
            controls.legacyHorizonStageSizeRow.title = legacyHorizonStageEnabled
                ? 'Controls the environment dome size for Legacy + HORIZON scenes'
                : (isPmndrs
                    ? 'Legacy Horizon Size applies only when the Legacy engine is selected'
                    : 'Legacy Horizon Size applies only when the HORIZON background is selected');
        }
        if (controls.legacyHorizonStageSize) {
            controls.legacyHorizonStageSize.disabled = !legacyHorizonStageEnabled;
            controls.legacyHorizonStageSize.title = legacyHorizonStageEnabled
                ? 'Larger values push the edge of the legacy HORIZON dome farther away'
                : (isPmndrs
                    ? 'Legacy Horizon Size applies only when the Legacy engine is selected'
                    : 'Legacy Horizon Size applies only when the HORIZON background is selected');
        }

        controls.postFxColor.disabled = !postFxEnabled;
        controls.bloomStrength.disabled = !postFxEnabled;
        controls.reflectionProfile.disabled = !postFxEnabled;
        controls.reflectionSource.disabled = !postFxEnabled;
        
        if (controls.envMapPresetWrapper) {
            controls.envMapPresetWrapper.style.display = envLightingEnabled ? '' : 'none';
        }
        if (controls.envMapPreset) {
            controls.envMapPreset.disabled = !envLightingEnabled;
            controls.envMapPreset.title = envLightingEnabled
                ? 'HDR environment map for PBR reflections and lighting'
                : 'Env Lighting is used only when Reflection Source is HDR';
        }
        
        if (controls.colorGradingWrapper) {
            controls.colorGradingWrapper.style.display = colorGradingEnabled ? '' : 'none';
        }
        if (controls.edgeAAWrapper) {
            controls.edgeAAWrapper.style.display = edgeAAAvailable ? '' : 'none';
        }
        controls.exposurePreset.disabled = !colorGradingEnabled;
        controls.contrastPreset.disabled = !colorGradingEnabled;
        controls.edgeAAStrength.disabled = !edgeAAAvailable;
        controls.edgeAAStrength.title = isPmndrs
            ? 'FXAA is disabled in the Pmndrs pipeline. Switch to Legacy to use Edge Smoothing.'
            : 'Edge smoothing for the Legacy post-processing pipeline.';

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

        var pmndrsTweakEnabled = postFxEnabled && isPmndrs;
        var pmndrsAAMode = controls.pmndrsAAMode ? normalizePmndrsAAMode(controls.pmndrsAAMode.value) : PMNDRS_TWEAK_DEFAULTS.aaMode;
        var pmndrsAAPresetVisible = pmndrsTweakEnabled && pmndrsAAMode !== 'none';

        if (controls.pmndrsAAWrapper) {
            controls.pmndrsAAWrapper.style.display = pmndrsTweakEnabled ? '' : 'none';
        }
        if (controls.pmndrsAAMode) {
            controls.pmndrsAAMode.disabled = !pmndrsTweakEnabled;
        }
        if (controls.pmndrsAAPresetWrapper) {
            controls.pmndrsAAPresetWrapper.style.display = pmndrsAAPresetVisible ? '' : 'none';
        }
        if (controls.pmndrsAAPreset) {
            controls.pmndrsAAPreset.disabled = !pmndrsAAPresetVisible;
            controls.pmndrsAAPreset.title = pmndrsAAMode === 'none'
                ? 'Choose SMAA or MSAA to enable a PMNDRS AA preset.'
                : 'Quality preset for the selected PMNDRS anti-aliasing method.';
        }
        
        if (controls.pmndrsBloomWrapper) {
            controls.pmndrsBloomWrapper.style.display = bloomEnabled ? '' : 'none';
        }
        if (controls.pmndrsBloomIntensity) {
            controls.pmndrsBloomIntensity.disabled = !pmndrsTweakEnabled || !bloomEnabled;
            controls.pmndrsBloomIntensity.classList.toggle('tw-opacity-60', !bloomEnabled);
            controls.pmndrsBloomIntensity.title = bloomEnabled
                ? 'Multiplier applied to the shared Bloom preset when Pmndrs is active'
                : 'Enable the shared Bloom preset below to use the Pmndrs bloom multiplier';
        }
        if (controls.pmndrsBloomThreshold) {
            controls.pmndrsBloomThreshold.disabled = !pmndrsTweakEnabled || !bloomEnabled;
            controls.pmndrsBloomThreshold.classList.toggle('tw-opacity-60', !bloomEnabled);
            controls.pmndrsBloomThreshold.title = bloomEnabled
                ? 'Luminance threshold for the Pmndrs bloom pass'
                : 'Enable the shared Bloom preset below to adjust the Pmndrs bloom threshold';
        }
        
        if (controls.pmndrsExposure) controls.pmndrsExposure.disabled = !pmndrsTweakEnabled;
        
        var isPmndrsVignetteEnabled = controls.pmndrsVignette && controls.pmndrsVignette.checked;
        if (controls.pmndrsVignetteWrapper) {
            controls.pmndrsVignetteWrapper.style.display = isPmndrsVignetteEnabled ? '' : 'none';
        }
        if (controls.pmndrsVignette) controls.pmndrsVignette.disabled = !pmndrsTweakEnabled;
        if (controls.pmndrsVignetteDarkness) {
            controls.pmndrsVignetteDarkness.disabled = !pmndrsTweakEnabled || !isPmndrsVignetteEnabled;
        }

        if (controls.pmndrsAtmosphere) {
            controls.pmndrsAtmosphere.disabled = !pmndrsTweakEnabled;
        }
        
        var pmndrsAtmoChecked = pmndrsTweakEnabled && controls.pmndrsAtmosphere && controls.pmndrsAtmosphere.checked === true;
        if (controls.pmndrsAtmosphereWrapper) {
            controls.pmndrsAtmosphereWrapper.style.display = pmndrsAtmoChecked ? '' : 'none';
        }

        setPmndrsAtmosphereAdvancedState(controls, pmndrsAtmoChecked);

        updateEdgeAAStrengthLabel();
    }

    function updatePmndrsValueLabels() {
        var c = getCompileDialogElements();
        if (c.legacyHorizonStageSize && c.legacyHorizonStageSizeValue) {
            c.legacyHorizonStageSizeValue.textContent = String(clampLegacyHorizonStageSize(c.legacyHorizonStageSize.value));
        }
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
        if (c.pmndrsSunElevation && c.pmndrsSunElevationValue) {
            c.pmndrsSunElevationValue.textContent = formatPmndrsDegrees(c.pmndrsSunElevation.value);
        }
        if (c.pmndrsSunAzimuth && c.pmndrsSunAzimuthValue) {
            c.pmndrsSunAzimuthValue.textContent = formatPmndrsDegrees(c.pmndrsSunAzimuth.value);
        }
        if (c.pmndrsSunAngularRadius && c.pmndrsSunAngularRadiusValue) {
            c.pmndrsSunAngularRadiusValue.textContent = formatPmndrsRadius(c.pmndrsSunAngularRadius.value);
        }
        if (c.pmndrsSunDistance && c.pmndrsSunDistanceValue) {
            c.pmndrsSunDistanceValue.textContent = String(Math.round(parseFloat(c.pmndrsSunDistance.value) || 0));
        }
        if (c.pmndrsAerialStrength && c.pmndrsAerialStrengthValue) {
            c.pmndrsAerialStrengthValue.textContent = formatPmndrsNumber(parseFloat(c.pmndrsAerialStrength.value));
        }
        if (c.pmndrsAlbedoScale && c.pmndrsAlbedoScaleValue) {
            c.pmndrsAlbedoScaleValue.textContent = formatPmndrsNumber(parseFloat(c.pmndrsAlbedoScale.value));
        }
        if (c.pmndrsRayleighScale && c.pmndrsRayleighScaleValue) {
            c.pmndrsRayleighScaleValue.textContent = formatPmndrsNumber(parseFloat(c.pmndrsRayleighScale.value));
        }
        if (c.pmndrsMieScatteringScale && c.pmndrsMieScatteringScaleValue) {
            c.pmndrsMieScatteringScaleValue.textContent = formatPmndrsNumber(parseFloat(c.pmndrsMieScatteringScale.value));
        }
        if (c.pmndrsMieExtinctionScale && c.pmndrsMieExtinctionScaleValue) {
            c.pmndrsMieExtinctionScaleValue.textContent = formatPmndrsNumber(parseFloat(c.pmndrsMieExtinctionScale.value));
        }
        if (c.pmndrsMiePhaseG && c.pmndrsMiePhaseGValue) {
            c.pmndrsMiePhaseGValue.textContent = formatPmndrsNumber(parseFloat(c.pmndrsMiePhaseG.value));
        }
        if (c.pmndrsAbsorptionScale && c.pmndrsAbsorptionScaleValue) {
            c.pmndrsAbsorptionScaleValue.textContent = formatPmndrsNumber(parseFloat(c.pmndrsAbsorptionScale.value));
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
        if (controls.legacyHorizonStageSize) {
            envir.scene.aframeLegacyHorizonStageSize = clampLegacyHorizonStageSize(controls.legacyHorizonStageSize.value);
        }
        envir.scene.aframePostFXEnabled = controls.postFx.checked === true;
        envir.scene.aframeBloomStrength = normalizeBloomStrength(controls.bloomStrength.value);
        envir.scene.aframePostFXBloomEnabled = isBloomStrengthEnabled(envir.scene.aframeBloomStrength);
        envir.scene.aframePostFXColorEnabled = controls.postFxColor.checked === true;
        envir.scene.aframePostFXVignetteEnabled = false;
        envir.scene.aframeExposurePreset = normalizeExposurePreset(controls.exposurePreset.value);
        envir.scene.aframeContrastPreset = normalizeContrastPreset(controls.contrastPreset.value);

        var selectedPostFxEngine = controls.postFxEngine ? normalizePostFxEngine(controls.postFxEngine.value) : 'legacy';
        var edgeAAValue = normalizeEdgeAAStrengthLevel(controls.edgeAAStrength.value);
        envir.scene.aframePostFXEdgeAAEnabled = selectedPostFxEngine !== 'pmndrs' && edgeAAValue > 0;
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
        envir.scene.aframePostFXEngine = selectedPostFxEngine;
        if (controls.pmndrsAAMode) {
            envir.scene.aframePmndrsAAMode = normalizePmndrsAAMode(controls.pmndrsAAMode.value);
        }
        if (controls.pmndrsAAPreset) {
            envir.scene.aframePmndrsAAPreset = normalizePmndrsAAPreset(controls.pmndrsAAPreset.value);
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
        if (controls.pmndrsAtmosphere) {
            envir.scene.aframePmndrsAtmosphereEnabled = controls.pmndrsAtmosphere.checked === true;
        }
        if (controls.pmndrsAtmosphereQuality) {
            envir.scene.aframePmndrsAtmosphereQuality = normalizePmndrsAtmosphereQuality(controls.pmndrsAtmosphereQuality.value);
        }
        if (controls.pmndrsSunElevation) {
            envir.scene.aframePmndrsSunElevationDeg = clampNumber(controls.pmndrsSunElevation.value, -15, 75, PMNDRS_TWEAK_DEFAULTS.sunElevationDeg);
        }
        if (controls.pmndrsSunAzimuth) {
            envir.scene.aframePmndrsSunAzimuthDeg = clampNumber(controls.pmndrsSunAzimuth.value, -180, 180, PMNDRS_TWEAK_DEFAULTS.sunAzimuthDeg);
        }
        if (controls.pmndrsSunDistance) {
            envir.scene.aframePmndrsSunDistance = clampNumber(controls.pmndrsSunDistance.value, 1500, 12000, PMNDRS_TWEAK_DEFAULTS.sunDistance);
        }
        if (controls.pmndrsSunAngularRadius) {
            envir.scene.aframePmndrsSunAngularRadius = clampNumber(controls.pmndrsSunAngularRadius.value, 0.001, 0.03, PMNDRS_TWEAK_DEFAULTS.sunAngularRadius);
        }
        if (controls.pmndrsAerialStrength) {
            envir.scene.aframePmndrsAerialStrength = clampNumber(controls.pmndrsAerialStrength.value, 0, 2, PMNDRS_TWEAK_DEFAULTS.aerialStrength);
        }
        if (controls.pmndrsAlbedoScale) {
            envir.scene.aframePmndrsAlbedoScale = clampNumber(controls.pmndrsAlbedoScale.value, 0, 2, PMNDRS_TWEAK_DEFAULTS.albedoScale);
        }
        if (controls.pmndrsTransmittance) {
            envir.scene.aframePmndrsTransmittanceEnabled = controls.pmndrsTransmittance.checked === true;
        }
        if (controls.pmndrsInscatter) {
            envir.scene.aframePmndrsInscatterEnabled = controls.pmndrsInscatter.checked === true;
        }
        if (controls.pmndrsGround) {
            envir.scene.aframePmndrsGroundEnabled = controls.pmndrsGround.checked === true;
        }
        if (controls.pmndrsGroundAlbedo) {
            envir.scene.aframePmndrsGroundAlbedo = normalizeColorHex(controls.pmndrsGroundAlbedo.value, PMNDRS_TWEAK_DEFAULTS.groundAlbedo);
        }
        if (controls.pmndrsRayleighScale) {
            envir.scene.aframePmndrsRayleighScale = clampNumber(controls.pmndrsRayleighScale.value, 0.1, 3, PMNDRS_TWEAK_DEFAULTS.rayleighScale);
        }
        if (controls.pmndrsMieScatteringScale) {
            envir.scene.aframePmndrsMieScatteringScale = clampNumber(controls.pmndrsMieScatteringScale.value, 0.1, 3, PMNDRS_TWEAK_DEFAULTS.mieScatteringScale);
        }
        if (controls.pmndrsMieExtinctionScale) {
            envir.scene.aframePmndrsMieExtinctionScale = clampNumber(controls.pmndrsMieExtinctionScale.value, 0.1, 3, PMNDRS_TWEAK_DEFAULTS.mieExtinctionScale);
        }
        if (controls.pmndrsMiePhaseG) {
            envir.scene.aframePmndrsMiePhaseG = clampNumber(controls.pmndrsMiePhaseG.value, 0, 0.99, PMNDRS_TWEAK_DEFAULTS.miePhaseG);
        }
        if (controls.pmndrsAbsorptionScale) {
            envir.scene.aframePmndrsAbsorptionScale = clampNumber(controls.pmndrsAbsorptionScale.value, 0.1, 3, PMNDRS_TWEAK_DEFAULTS.absorptionScale);
        }
        if (controls.pmndrsMoon) {
            envir.scene.aframePmndrsMoonEnabled = controls.pmndrsMoon.checked === true;
        }
    }

    window.vrodosApplyCompileDialogSettingsToScene = applyCompileDialogSettingsToScene;

    window.syncCompileDialogFromSceneSettings = function() {
        var controls = getCompileDialogElements();

        if (!controls.renderQuality || !controls.shadowQuality || !controls.aaQuality || !controls.ambientOcclusionPreset || !controls.contactShadowPreset || !controls.fpsMeter || !controls.postFx || !controls.postFxColor || !controls.edgeAAStrength || !controls.bloomStrength || !controls.exposurePreset || !controls.contrastPreset || !controls.reflectionProfile || !controls.reflectionSource) {
            return;
        }

        ensureCompileSceneSettingsDefaults();

        controls.renderQuality.value = envir.scene.aframeRenderQuality || 'standard';
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
        if (controls.legacyHorizonStageSize) {
            controls.legacyHorizonStageSize.value = clampLegacyHorizonStageSize(envir && envir.scene ? envir.scene.aframeLegacyHorizonStageSize : 5000);
        }
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
        if (controls.pmndrsAAMode) {
            var pmndrsAAModeValue = envir && envir.scene
                ? normalizePmndrsAAMode(envir.scene.aframePmndrsAAMode)
                : 'inherit';
            if (pmndrsAAModeValue === 'inherit') {
                pmndrsAAModeValue = envir && envir.scene && normalizePostFxEngine(envir.scene.aframePostFXEngine) === 'pmndrs'
                    ? derivePmndrsAAModeFromAAQuality(controls.aaQuality.value)
                    : PMNDRS_TWEAK_DEFAULTS.aaMode;
            }
            controls.pmndrsAAMode.value = pmndrsAAModeValue;
        }
        if (controls.pmndrsAAPreset) {
            var pmndrsAAPresetValue = envir && envir.scene
                ? normalizePmndrsAAPreset(envir.scene.aframePmndrsAAPreset)
                : 'inherit';
            if (pmndrsAAPresetValue === 'inherit') {
                pmndrsAAPresetValue = envir && envir.scene && normalizePostFxEngine(envir.scene.aframePostFXEngine) === 'pmndrs'
                    ? derivePmndrsAAPresetFromAAQuality(controls.aaQuality.value)
                    : PMNDRS_TWEAK_DEFAULTS.aaPreset;
            }
            controls.pmndrsAAPreset.value = pmndrsAAPresetValue;
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
        if (controls.pmndrsAtmosphere) {
            controls.pmndrsAtmosphere.checked = !(envir && envir.scene) || envir.scene.aframePmndrsAtmosphereEnabled !== false;
        }
        if (controls.pmndrsAtmosphereQuality) {
            controls.pmndrsAtmosphereQuality.value = envir && envir.scene && envir.scene.aframePmndrsAtmosphereQuality
                ? normalizePmndrsAtmosphereQuality(envir.scene.aframePmndrsAtmosphereQuality)
                : PMNDRS_TWEAK_DEFAULTS.atmosphereQuality;
        }
        if (controls.pmndrsSunElevation) {
            controls.pmndrsSunElevation.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsSunElevationDeg : PMNDRS_TWEAK_DEFAULTS.sunElevationDeg, -15, 75, PMNDRS_TWEAK_DEFAULTS.sunElevationDeg);
        }
        if (controls.pmndrsSunAzimuth) {
            controls.pmndrsSunAzimuth.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsSunAzimuthDeg : PMNDRS_TWEAK_DEFAULTS.sunAzimuthDeg, -180, 180, PMNDRS_TWEAK_DEFAULTS.sunAzimuthDeg);
        }
        if (controls.pmndrsSunDistance) {
            controls.pmndrsSunDistance.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsSunDistance : PMNDRS_TWEAK_DEFAULTS.sunDistance, 1500, 12000, PMNDRS_TWEAK_DEFAULTS.sunDistance);
        }
        if (controls.pmndrsSunAngularRadius) {
            controls.pmndrsSunAngularRadius.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsSunAngularRadius : PMNDRS_TWEAK_DEFAULTS.sunAngularRadius, 0.001, 0.03, PMNDRS_TWEAK_DEFAULTS.sunAngularRadius);
        }
        if (controls.pmndrsAerialStrength) {
            controls.pmndrsAerialStrength.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsAerialStrength : PMNDRS_TWEAK_DEFAULTS.aerialStrength, 0, 2, PMNDRS_TWEAK_DEFAULTS.aerialStrength);
        }
        if (controls.pmndrsAlbedoScale) {
            controls.pmndrsAlbedoScale.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsAlbedoScale : PMNDRS_TWEAK_DEFAULTS.albedoScale, 0, 2, PMNDRS_TWEAK_DEFAULTS.albedoScale);
        }
        if (controls.pmndrsTransmittance) {
            controls.pmndrsTransmittance.checked = !(envir && envir.scene) || envir.scene.aframePmndrsTransmittanceEnabled !== false;
        }
        if (controls.pmndrsInscatter) {
            controls.pmndrsInscatter.checked = !(envir && envir.scene) || envir.scene.aframePmndrsInscatterEnabled !== false;
        }
        if (controls.pmndrsGround) {
            controls.pmndrsGround.checked = !(envir && envir.scene) || envir.scene.aframePmndrsGroundEnabled !== false;
        }
        if (controls.pmndrsGroundAlbedo) {
            controls.pmndrsGroundAlbedo.value = normalizeColorHex(
                envir && envir.scene ? envir.scene.aframePmndrsGroundAlbedo : PMNDRS_TWEAK_DEFAULTS.groundAlbedo,
                PMNDRS_TWEAK_DEFAULTS.groundAlbedo
            );
        }
        if (controls.pmndrsRayleighScale) {
            controls.pmndrsRayleighScale.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsRayleighScale : PMNDRS_TWEAK_DEFAULTS.rayleighScale, 0.1, 3, PMNDRS_TWEAK_DEFAULTS.rayleighScale);
        }
        if (controls.pmndrsMieScatteringScale) {
            controls.pmndrsMieScatteringScale.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsMieScatteringScale : PMNDRS_TWEAK_DEFAULTS.mieScatteringScale, 0.1, 3, PMNDRS_TWEAK_DEFAULTS.mieScatteringScale);
        }
        if (controls.pmndrsMieExtinctionScale) {
            controls.pmndrsMieExtinctionScale.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsMieExtinctionScale : PMNDRS_TWEAK_DEFAULTS.mieExtinctionScale, 0.1, 3, PMNDRS_TWEAK_DEFAULTS.mieExtinctionScale);
        }
        if (controls.pmndrsMiePhaseG) {
            controls.pmndrsMiePhaseG.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsMiePhaseG : PMNDRS_TWEAK_DEFAULTS.miePhaseG, 0, 0.99, PMNDRS_TWEAK_DEFAULTS.miePhaseG);
        }
        if (controls.pmndrsAbsorptionScale) {
            controls.pmndrsAbsorptionScale.value = clampNumber(envir && envir.scene ? envir.scene.aframePmndrsAbsorptionScale : PMNDRS_TWEAK_DEFAULTS.absorptionScale, 0.1, 3, PMNDRS_TWEAK_DEFAULTS.absorptionScale);
        }
        if (controls.pmndrsMoon) {
            controls.pmndrsMoon.checked = !!(envir && envir.scene && envir.scene.aframePmndrsMoonEnabled);
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
    if (controls.legacyHorizonStageSize) {
        controls.legacyHorizonStageSize.addEventListener('input', updatePmndrsValueLabels);
        controls.legacyHorizonStageSize.addEventListener('change', syncCompilePostFxState);
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
    if (controls.pmndrsAAMode) {
        controls.pmndrsAAMode.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsAAPreset) {
        controls.pmndrsAAPreset.addEventListener('change', syncCompilePostFxState);
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
    [
        controls.pmndrsSunElevation,
        controls.pmndrsSunAzimuth,
        controls.pmndrsSunAngularRadius,
        controls.pmndrsSunDistance,
        controls.pmndrsAerialStrength,
        controls.pmndrsAlbedoScale,
        controls.pmndrsRayleighScale,
        controls.pmndrsMieScatteringScale,
        controls.pmndrsMieExtinctionScale,
        controls.pmndrsMiePhaseG,
        controls.pmndrsAbsorptionScale
    ].forEach(function (el) {
        if (el) {
            el.addEventListener('input', function () {
                updatePmndrsValueLabels();
                markPmndrsAtmosphereCustom(controls);
            });
        }
    });
    [
        controls.pmndrsTransmittance,
        controls.pmndrsInscatter,
        controls.pmndrsGround,
        controls.pmndrsGroundAlbedo,
        controls.pmndrsMoon
    ].forEach(function (el) {
        if (el) {
            el.addEventListener('change', function () {
                markPmndrsAtmosphereCustom(controls);
                updatePmndrsValueLabels();
                syncCompilePostFxState();
            });
        }
    });
    if (controls.pmndrsVignette) {
        controls.pmndrsVignette.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsAtmosphere) {
        controls.pmndrsAtmosphere.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsAtmosphereQuality) {
        controls.pmndrsAtmosphereQuality.addEventListener('change', function () {
            var quality = normalizePmndrsAtmosphereQuality(controls.pmndrsAtmosphereQuality.value);
            if (quality !== 'custom') {
                applyPmndrsAtmospherePreset(controls, quality);
                updatePmndrsValueLabels();
            }
            syncCompilePostFxState();
        });
    }
    if (controls.pmndrsResetBtn) {
        controls.pmndrsResetBtn.addEventListener('click', function (e) {
            e.preventDefault();
            var c = getCompileDialogElements();
            if (c.pmndrsAAMode) c.pmndrsAAMode.value = PMNDRS_TWEAK_DEFAULTS.aaMode;
            if (c.pmndrsAAPreset) c.pmndrsAAPreset.value = PMNDRS_TWEAK_DEFAULTS.aaPreset;
            if (c.pmndrsBloomIntensity) c.pmndrsBloomIntensity.value = PMNDRS_TWEAK_DEFAULTS.bloomIntensity;
            if (c.pmndrsBloomThreshold) c.pmndrsBloomThreshold.value = PMNDRS_TWEAK_DEFAULTS.bloomThreshold;
            if (c.pmndrsExposure) c.pmndrsExposure.value = PMNDRS_TWEAK_DEFAULTS.toneMappingExposure;
            if (c.pmndrsVignette) c.pmndrsVignette.checked = PMNDRS_TWEAK_DEFAULTS.vignetteEnabled;
            if (c.pmndrsVignetteDarkness) c.pmndrsVignetteDarkness.value = PMNDRS_TWEAK_DEFAULTS.vignetteDarkness;
            if (c.pmndrsAtmosphere) c.pmndrsAtmosphere.checked = PMNDRS_TWEAK_DEFAULTS.atmosphereEnabled;
            applyPmndrsAtmospherePreset(c, PMNDRS_TWEAK_DEFAULTS.atmosphereQuality);
            updatePmndrsValueLabels();
            syncCompilePostFxState();
        });
    }

    // Initial synchronization moved to vrodos_EditorInitializer.js to ensure environment is ready

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
