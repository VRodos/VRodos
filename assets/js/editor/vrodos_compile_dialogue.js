window.addEventListener('DOMContentLoaded', () => {
    const Shared = VRodosCompileUI.Shared;


    /**
     * Bridge functions for Pmndrs AA derivation
     */
    function derivePmndrsAAModeFromAAQuality(value) {
        return VRodosCompileUI.General.normalizeAAQuality(value) === 'off' ? 'none' : 'msaa';
    }

    function derivePmndrsAAPresetFromAAQuality(value) {
        switch (VRodosCompileUI.General.normalizeAAQuality(value)) {
            case 'high': return 'high';
            case 'ultra': return 'ultra';
            case 'off':
            case 'balanced':
            default: return 'medium';
        }
    }

    function getCompileDialogElements() {
        return {
            renderQuality: document.getElementById('compileRenderQualitySelect'),
            shadowQuality: document.getElementById('compileShadowQualitySelect'),
            aaQuality: document.getElementById('compileAAQualitySelect'),
            aaQualityWrapper: document.getElementById('compileAAQualityWrapper'),
            ambientOcclusionPreset: document.getElementById('compileAmbientOcclusionPresetSelect'),
            contactShadowPreset: document.getElementById('compileContactShadowPresetSelect'),
            fpsMeter: document.getElementById('compileFPSMeterToggle'),
            hoveringInteractables: document.getElementById('compileHoveringInteractablesToggle'),
            postFx: document.getElementById('compilePostFxToggle'),
            postFxColor: document.getElementById('compilePostFxColorToggle'),
            edgeAAStrength: document.getElementById('compileEdgeAAStrengthSlider'),
            edgeAAStrengthValue: document.getElementById('compileEdgeAAStrengthValue'),
            edgeAAWrapper: document.getElementById('compileEdgeAAWrapper'),
            bloomStrength: document.getElementById('compileBloomStrengthSelect'),
            exposurePreset: document.getElementById('compileExposurePresetSelect'),
            contrastPreset: document.getElementById('compileContrastPresetSelect'),
            colorGradingWrapper: document.getElementById('compileColorGradingWrapper'),
            reflectionProfile: document.getElementById('compileReflectionProfileSelect'),
            reflectionSource: document.getElementById('compileReflectionSourceSelect'),
            envMapPreset: document.getElementById('compileEnvMapPresetSelect'),
            envMapPresetWrapper: document.getElementById('compileEnvMapPresetWrapper'),
            ssrStrength: document.getElementById('compileSSRStrengthSelect'),
            taaEnabled: document.getElementById('compilePostFxTAAToggle'),
            postFxEngine: document.getElementById('compilePostFxEngineSelect'),
            postFxEngineTabLegacy: document.getElementById('compilePostFxEngineTabLegacy'),
            postFxEngineTabPmndrs: document.getElementById('compilePostFxEngineTabPmndrs'),
            postFxEngineHint: document.getElementById('compilePostFxEngineHint'),
            postFxEngineHintBadge: document.getElementById('compilePostFxEngineHintBadge'),
            legacyHorizonStageSize: document.getElementById('compileLegacyHorizonStageSizeSlider'),
            legacyHorizonStageSizeValue: document.getElementById('compileLegacyHorizonStageSizeValue'),
            legacyHorizonStageSizeRow: document.getElementById('compileLegacyHorizonStageSizeRow'),
            pmndrsAAWrapper: document.getElementById('compilePmndrsAAWrapper'),
            pmndrsAAMode: document.getElementById('compilePmndrsAAModeSelect'),
            pmndrsAAPresetWrapper: document.getElementById('compilePmndrsAAPresetWrapper'),
            pmndrsAAPreset: document.getElementById('compilePmndrsAAPresetSelect'),
            pmndrsBloomWrapper: document.getElementById('compilePmndrsBloomWrapper'),
            pmndrsBloomIntensity: document.getElementById('compilePmndrsBloomIntensitySlider'),
            pmndrsBloomIntensityValue: document.getElementById('compilePmndrsBloomIntensityValue'),
            pmndrsBloomThreshold: document.getElementById('compilePmndrsBloomThresholdSlider'),
            pmndrsBloomThresholdValue: document.getElementById('compilePmndrsBloomThresholdValue'),
            pmndrsExposure: document.getElementById('compilePmndrsExposureSlider'),
            pmndrsExposureValue: document.getElementById('compilePmndrsExposureValue'),
            pmndrsVignette: document.getElementById('compilePmndrsVignetteToggle'),
            pmndrsVignetteWrapper: document.getElementById('compilePmndrsVignetteWrapper'),
            pmndrsVignetteDarkness: document.getElementById('compilePmndrsVignetteDarknessSlider'),
            pmndrsVignetteDarknessValue: document.getElementById('compilePmndrsVignetteDarknessValue'),
            pmndrsAtmosphere: document.getElementById('compilePmndrsAtmosphereToggle'),
            pmndrsAtmosphereWrapper: document.getElementById('compilePmndrsAtmosphereWrapper'),
            pmndrsAtmospherePreset: document.getElementById('compilePmndrsAtmospherePresetSelect'),
            pmndrsAtmospherePresetIntensity: document.getElementById('compilePmndrsAtmospherePresetIntensitySlider'),
            pmndrsAtmospherePresetIntensityValue: document.getElementById('compilePmndrsAtmospherePresetIntensityValue'),
            pmndrsAtmosphereQuality: document.getElementById('compilePmndrsAtmosphereQualitySelect'),
            pmndrsAtmosphereAdvanced: document.getElementById('compilePmndrsAtmosphereAdvanced'),
            pmndrsSunElevation: document.getElementById('compilePmndrsSunElevationSlider'),
            pmndrsSunElevationValue: document.getElementById('compilePmndrsSunElevationValue'),
            pmndrsSunAzimuth: document.getElementById('compilePmndrsSunAzimuthSlider'),
            pmndrsSunAzimuthValue: document.getElementById('compilePmndrsSunAzimuthValue'),
            pmndrsSunDistance: document.getElementById('compilePmndrsSunDistanceSlider'),
            pmndrsSunDistanceValue: document.getElementById('compilePmndrsSunDistanceValue'),
            pmndrsSunAngularRadius: document.getElementById('compilePmndrsSunAngularRadiusSlider'),
            pmndrsSunAngularRadiusValue: document.getElementById('compilePmndrsSunAngularRadiusValue'),
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
            pmndrsHorizonLightingPreset: document.getElementById('compilePmndrsHorizonLightingPresetSelect'),
            pmndrsHorizonKeyLightIntensity: document.getElementById('compilePmndrsHorizonKeyLightIntensitySlider'),
            pmndrsHorizonKeyLightIntensityValue: document.getElementById('compilePmndrsHorizonKeyLightIntensityValue'),
            pmndrsHorizonFillLightIntensity: document.getElementById('compilePmndrsHorizonFillLightIntensitySlider'),
            pmndrsHorizonFillLightIntensityValue: document.getElementById('compilePmndrsHorizonFillLightIntensityValue'),
            pmndrsResetBtn: document.getElementById('compilePmndrsResetBtn'),
            universalPostFxGroup: document.getElementById('compileUniversalPostFxGroup'),
            engineControlsColumn: document.getElementById('compileEngineControlsColumn'),
            legacyPane: document.getElementById('compileLegacyPane'),
            pmndrsPane: document.getElementById('compilePmndrsPane'),
        };
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
        if (typeof envir.scene.aframeHoveringInteractables === 'undefined') {
            envir.scene.aframeHoveringInteractables = true;
        }
        if (typeof envir.scene.aframeLegacyHorizonStageSize !== 'number') {
            envir.scene.aframeLegacyHorizonStageSize = VRodosCompileUI.General.clampLegacyHorizonStageSize(envir.scene.aframeLegacyHorizonStageSize);
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
            envir.scene.aframePmndrsBloomIntensity = Shared.clampNumber(envir.scene.aframePmndrsBloomIntensity, 0, 3, 1.0);
        }
        if (typeof envir.scene.aframePmndrsBloomThreshold !== 'number') {
            envir.scene.aframePmndrsBloomThreshold = Shared.clampNumber(envir.scene.aframePmndrsBloomThreshold, 0, 1, 0.62);
        }
        if (typeof envir.scene.aframePmndrsVignetteEnabled === 'undefined') {
            envir.scene.aframePmndrsVignetteEnabled = false;
        }
        if (typeof envir.scene.aframePmndrsVignetteDarkness !== 'number') {
            envir.scene.aframePmndrsVignetteDarkness = Shared.clampNumber(envir.scene.aframePmndrsVignetteDarkness, 0, 1, 0.5);
        }
        if (typeof envir.scene.aframePmndrsToneMappingExposure !== 'number') {
            envir.scene.aframePmndrsToneMappingExposure = Shared.clampNumber(envir.scene.aframePmndrsToneMappingExposure, 0.3, 2.5, 1.0);
        }
        if (typeof envir.scene.aframePmndrsAtmosphereEnabled === 'undefined') {
            envir.scene.aframePmndrsAtmosphereEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.atmosphereEnabled;
        }
        if (!envir.scene.aframePmndrsAtmospherePreset) {
            envir.scene.aframePmndrsAtmospherePreset = Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset;
        }
        if (typeof envir.scene.aframePmndrsAtmospherePresetIntensity !== 'number') {
            envir.scene.aframePmndrsAtmospherePresetIntensity = Shared.clampNumber(envir.scene.aframePmndrsAtmospherePresetIntensity, 0, 1, Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePresetIntensity);
        }
        if (!envir.scene.aframePmndrsAtmosphereQuality) {
            envir.scene.aframePmndrsAtmosphereQuality = Shared.PMNDRS_TWEAK_DEFAULTS.atmosphereQuality;
        }
        if (typeof envir.scene.aframePmndrsSunElevationDeg !== 'number') {
            envir.scene.aframePmndrsSunElevationDeg = Shared.clampNumber(envir.scene.aframePmndrsSunElevationDeg, -10, 85, Shared.PMNDRS_TWEAK_DEFAULTS.sunElevationDeg);
        }
        if (typeof envir.scene.aframePmndrsSunAzimuthDeg !== 'number') {
            envir.scene.aframePmndrsSunAzimuthDeg = Shared.clampNumber(envir.scene.aframePmndrsSunAzimuthDeg, -180, 180, Shared.PMNDRS_TWEAK_DEFAULTS.sunAzimuthDeg);
        }
        if (typeof envir.scene.aframePmndrsSunDistance !== 'number') {
            envir.scene.aframePmndrsSunDistance = Shared.clampNumber(envir.scene.aframePmndrsSunDistance, 1500, 20000, Shared.PMNDRS_TWEAK_DEFAULTS.sunDistance);
        }
        if (typeof envir.scene.aframePmndrsSunAngularRadius !== 'number') {
            envir.scene.aframePmndrsSunAngularRadius = Shared.clampNumber(envir.scene.aframePmndrsSunAngularRadius, 0.002, 0.03, Shared.PMNDRS_TWEAK_DEFAULTS.sunAngularRadius);
        }
        if (typeof envir.scene.aframePmndrsAerialStrength !== 'number') {
            envir.scene.aframePmndrsAerialStrength = Shared.clampNumber(envir.scene.aframePmndrsAerialStrength, 0, 2, Shared.PMNDRS_TWEAK_DEFAULTS.aerialStrength);
        }
        if (typeof envir.scene.aframePmndrsAlbedoScale !== 'number') {
            envir.scene.aframePmndrsAlbedoScale = Shared.clampNumber(envir.scene.aframePmndrsAlbedoScale, 0, 2, Shared.PMNDRS_TWEAK_DEFAULTS.albedoScale);
        }
        if (typeof envir.scene.aframePmndrsTransmittanceEnabled === 'undefined') {
            envir.scene.aframePmndrsTransmittanceEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.transmittanceEnabled;
        }
        if (typeof envir.scene.aframePmndrsInscatterEnabled === 'undefined') {
            envir.scene.aframePmndrsInscatterEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.inscatterEnabled;
        }
        if (typeof envir.scene.aframePmndrsGroundEnabled === 'undefined') {
            envir.scene.aframePmndrsGroundEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.groundEnabled;
        }
        envir.scene.aframePmndrsGroundAlbedo = Shared.normalizeColorHex(envir.scene.aframePmndrsGroundAlbedo, Shared.PMNDRS_TWEAK_DEFAULTS.groundAlbedo);
        if (typeof envir.scene.aframePmndrsRayleighScale !== 'number') {
            envir.scene.aframePmndrsRayleighScale = Shared.clampNumber(envir.scene.aframePmndrsRayleighScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.rayleighScale);
        }
        if (typeof envir.scene.aframePmndrsMieScatteringScale !== 'number') {
            envir.scene.aframePmndrsMieScatteringScale = Shared.clampNumber(envir.scene.aframePmndrsMieScatteringScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.mieScatteringScale);
        }
        if (typeof envir.scene.aframePmndrsMieExtinctionScale !== 'number') {
            envir.scene.aframePmndrsMieExtinctionScale = Shared.clampNumber(envir.scene.aframePmndrsMieExtinctionScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.mieExtinctionScale);
        }
        if (typeof envir.scene.aframePmndrsMiePhaseG !== 'number') {
            envir.scene.aframePmndrsMiePhaseG = Shared.clampNumber(envir.scene.aframePmndrsMiePhaseG, 0, 0.99, Shared.PMNDRS_TWEAK_DEFAULTS.miePhaseG);
        }
        if (typeof envir.scene.aframePmndrsAbsorptionScale !== 'number') {
            envir.scene.aframePmndrsAbsorptionScale = Shared.clampNumber(envir.scene.aframePmndrsAbsorptionScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.absorptionScale);
        }
        if (typeof envir.scene.aframePmndrsMoonEnabled === 'undefined') {
            envir.scene.aframePmndrsMoonEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.moonEnabled;
        }
        var lightingPresetFallback = Shared.normalizePmndrsHorizonLightingPreset(
            envir.scene.aframeHorizonSkyPreset,
            Shared.PMNDRS_TWEAK_DEFAULTS.horizonLightingPreset
        );
        if (!envir.scene.aframePmndrsHorizonLightingPreset) {
            envir.scene.aframePmndrsHorizonLightingPreset = lightingPresetFallback;
        } else {
            envir.scene.aframePmndrsHorizonLightingPreset = Shared.normalizePmndrsHorizonLightingPreset(
                envir.scene.aframePmndrsHorizonLightingPreset,
                lightingPresetFallback
            );
        }
        var helperDefaults = Shared.getPmndrsHorizonHelperDefaults(
            envir.scene.aframePmndrsHorizonLightingPreset === 'custom'
                ? lightingPresetFallback
                : envir.scene.aframePmndrsHorizonLightingPreset
        );
        if (typeof envir.scene.aframePmndrsHorizonKeyLightIntensity !== 'number') {
            envir.scene.aframePmndrsHorizonKeyLightIntensity = Shared.clampNumber(envir.scene.aframePmndrsHorizonKeyLightIntensity, 0, 3, helperDefaults.keyLightIntensity);
        }
        if (typeof envir.scene.aframePmndrsHorizonFillLightIntensity !== 'number') {
            envir.scene.aframePmndrsHorizonFillLightIntensity = Shared.clampNumber(envir.scene.aframePmndrsHorizonFillLightIntensity, 0, 3, helperDefaults.fillLightIntensity);
        }

        envir.scene.aframeAAQuality = VRodosCompileUI.General.normalizeAAQuality(envir.scene.aframeAAQuality);
        envir.scene.aframeAmbientOcclusionPreset = VRodosCompileUI.General.normalizeAmbientOcclusionPreset(envir.scene.aframeAmbientOcclusionPreset);
        envir.scene.aframeContactShadowPreset = VRodosCompileUI.General.normalizeContactShadowPreset(envir.scene.aframeContactShadowPreset);
        
        envir.scene.aframeBloomStrength = VRodosCompileUI.PostFX.normalizeBloomStrength(envir.scene.aframeBloomStrength);
        envir.scene.aframeExposurePreset = VRodosCompileUI.PostFX.normalizeExposurePreset(envir.scene.aframeExposurePreset);
        envir.scene.aframeContrastPreset = VRodosCompileUI.PostFX.normalizeContrastPreset(envir.scene.aframeContrastPreset);
        envir.scene.aframeReflectionProfile = VRodosCompileUI.PostFX.normalizeReflectionProfile(envir.scene.aframeReflectionProfile);
        envir.scene.aframeReflectionSource = VRodosCompileUI.PostFX.normalizeReflectionSource(envir.scene.aframeReflectionSource);
        envir.scene.aframeEnvMapPreset = VRodosCompileUI.PostFX.normalizeEnvMapPreset(envir.scene.aframeEnvMapPreset);
        envir.scene.aframePostFXSSRStrength = VRodosCompileUI.PostFX.normalizeSSRStrength(envir.scene.aframePostFXSSRStrength);
        envir.scene.aframePostFXSSREnabled = envir.scene.aframePostFXSSRStrength !== 'off';
        envir.scene.aframePostFXEngine = VRodosCompileUI.PostFX.normalizeEngine(envir.scene.aframePostFXEngine);
        envir.scene.aframePmndrsAAMode = VRodosCompileUI.PostFX.normalizePmndrsAAMode(envir.scene.aframePmndrsAAMode);
        envir.scene.aframePmndrsAAPreset = VRodosCompileUI.PostFX.normalizePmndrsAAPreset(envir.scene.aframePmndrsAAPreset);
        envir.scene.aframePmndrsAtmospherePreset = VRodosCompileUI.Atmosphere.normalizePreset(envir.scene.aframePmndrsAtmospherePreset);
        envir.scene.aframePmndrsAtmosphereQuality = VRodosCompileUI.Atmosphere.normalizeQuality(envir.scene.aframePmndrsAtmosphereQuality);
        
        if (envir.scene.aframePostFXBloomEnabled === false) {
            envir.scene.aframeBloomStrength = 'off';
        }
        envir.scene.aframePostFXBloomEnabled = envir.scene.aframeBloomStrength !== 'off';
        envir.scene.aframePostFXVignetteEnabled = false;
    }

    function syncCompilePostFxState() {
        var controls = getCompileDialogElements();
        if (!controls.postFx || !controls.bloomStrength || !controls.postFxColor || !controls.edgeAAStrength || !controls.exposurePreset || !controls.contrastPreset || !controls.reflectionProfile || !controls.reflectionSource) {
            return;
        }

        var postFxEnabled = controls.postFx.checked;
        var colorGradingEnabled = postFxEnabled && controls.postFxColor.checked;
        var envLightingEnabled = postFxEnabled && VRodosCompileUI.PostFX.normalizeReflectionSource(controls.reflectionSource.value) === 'hdr';
        var bloomEnabled = postFxEnabled && VRodosCompileUI.PostFX.normalizeBloomStrength(controls.bloomStrength.value) !== 'off';
        var engine = controls.postFxEngine ? VRodosCompileUI.PostFX.normalizeEngine(controls.postFxEngine.value) : 'legacy';
        var isPmndrs = engine === 'pmndrs';
        VRodosCompileUI.General.updateUI(controls, isPmndrs);

        var edgeAAAvailable = postFxEnabled && !isPmndrs;
        
        VRodosCompileUI.PostFX.updateUI(controls, postFxEnabled, isPmndrs, bloomEnabled);

        controls.postFxColor.disabled = !postFxEnabled;
        controls.bloomStrength.disabled = !postFxEnabled;
        controls.reflectionProfile.disabled = !postFxEnabled;
        controls.reflectionSource.disabled = !postFxEnabled;
        
        if (controls.envMapPresetWrapper) {
            controls.envMapPresetWrapper.style.display = envLightingEnabled ? '' : 'none';
        }
        if (controls.envMapPreset) {
            controls.envMapPreset.disabled = !envLightingEnabled;
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

        if (controls.ssrStrength) {
            controls.ssrStrength.disabled = !postFxEnabled || isPmndrs;
            controls.ssrStrength.classList.toggle('tw-opacity-60', isPmndrs);
        }
        if (controls.taaEnabled) {
            controls.taaEnabled.disabled = !postFxEnabled || isPmndrs;
            controls.taaEnabled.parentElement && controls.taaEnabled.parentElement.classList.toggle('tw-opacity-60', isPmndrs);
        }

        var pmndrsTweakEnabled = postFxEnabled && isPmndrs;
        var pmndrsAAMode = controls.pmndrsAAMode ? VRodosCompileUI.PostFX.normalizePmndrsAAMode(controls.pmndrsAAMode.value) : Shared.PMNDRS_TWEAK_DEFAULTS.aaMode;
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
        }
        
        if (controls.pmndrsBloomWrapper) {
            controls.pmndrsBloomWrapper.style.display = bloomEnabled ? '' : 'none';
        }
        
        var pmndrsAtmoChecked = pmndrsTweakEnabled && controls.pmndrsAtmosphere && controls.pmndrsAtmosphere.checked === true;
        if (controls.pmndrsAtmosphereWrapper) {
            controls.pmndrsAtmosphereWrapper.style.display = pmndrsAtmoChecked ? '' : 'none';
        }

        VRodosCompileUI.Atmosphere.setAdvancedState(controls, pmndrsAtmoChecked);
        VRodosCompileUI.General.updateValueLabels(controls);
    }

    function updatePmndrsValueLabels() {
        var c = getCompileDialogElements();
        VRodosCompileUI.General.updateValueLabels(c);
        VRodosCompileUI.PostFX.updateValueLabels(c);
        if (c.pmndrsSunElevation && c.pmndrsSunElevationValue) {
            c.pmndrsSunElevationValue.textContent = Shared.formatDegrees(c.pmndrsSunElevation.value);
        }
        if (c.pmndrsSunAzimuth && c.pmndrsSunAzimuthValue) {
            c.pmndrsSunAzimuthValue.textContent = Shared.formatDegrees(c.pmndrsSunAzimuth.value);
        }
        if (c.pmndrsSunAngularRadius && c.pmndrsSunAngularRadiusValue) {
            c.pmndrsSunAngularRadiusValue.textContent = Shared.formatRadius(c.pmndrsSunAngularRadius.value);
        }
        if (c.pmndrsSunDistance && c.pmndrsSunDistanceValue) {
            c.pmndrsSunDistanceValue.textContent = String(Math.round(parseFloat(c.pmndrsSunDistance.value) || 0));
        }
        if (c.pmndrsAtmospherePresetIntensity && c.pmndrsAtmospherePresetIntensityValue) {
            c.pmndrsAtmospherePresetIntensityValue.textContent = Shared.formatNumber(parseFloat(c.pmndrsAtmospherePresetIntensity.value));
        }
        if (c.pmndrsAerialStrength && c.pmndrsAerialStrengthValue) {
            c.pmndrsAerialStrengthValue.textContent = Shared.formatNumber(parseFloat(c.pmndrsAerialStrength.value));
        }
        if (c.pmndrsAlbedoScale && c.pmndrsAlbedoScaleValue) {
            c.pmndrsAlbedoScaleValue.textContent = Shared.formatNumber(parseFloat(c.pmndrsAlbedoScale.value));
        }
        if (c.pmndrsRayleighScale && c.pmndrsRayleighScaleValue) {
            c.pmndrsRayleighScaleValue.textContent = Shared.formatNumber(parseFloat(c.pmndrsRayleighScale.value));
        }
        if (c.pmndrsMieScatteringScale && c.pmndrsMieScatteringScaleValue) {
            c.pmndrsMieScatteringScaleValue.textContent = Shared.formatNumber(parseFloat(c.pmndrsMieScatteringScale.value));
        }
        if (c.pmndrsMieExtinctionScale && c.pmndrsMieExtinctionScaleValue) {
            c.pmndrsMieExtinctionScaleValue.textContent = Shared.formatNumber(parseFloat(c.pmndrsMieExtinctionScale.value));
        }
        if (c.pmndrsMiePhaseG && c.pmndrsMiePhaseGValue) {
            c.pmndrsMiePhaseGValue.textContent = Shared.formatNumber(parseFloat(c.pmndrsMiePhaseG.value));
        }
        if (c.pmndrsAbsorptionScale && c.pmndrsAbsorptionScaleValue) {
            c.pmndrsAbsorptionScaleValue.textContent = Shared.formatNumber(parseFloat(c.pmndrsAbsorptionScale.value));
        }
        if (c.pmndrsHorizonKeyLightIntensity && c.pmndrsHorizonKeyLightIntensityValue) {
            c.pmndrsHorizonKeyLightIntensityValue.textContent = Shared.formatNumber(parseFloat(c.pmndrsHorizonKeyLightIntensity.value));
        }
        if (c.pmndrsHorizonFillLightIntensity && c.pmndrsHorizonFillLightIntensityValue) {
            c.pmndrsHorizonFillLightIntensityValue.textContent = Shared.formatNumber(parseFloat(c.pmndrsHorizonFillLightIntensity.value));
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

        VRodosCompileUI.General.syncToScene(controls);
        if (controls.hoveringInteractables) {
            envir.scene.aframeHoveringInteractables = !!controls.hoveringInteractables.checked;
        }
        VRodosCompileUI.PostFX.syncToScene(controls);
        
        var selectedPostFxEngine = VRodosCompileUI.PostFX.normalizeEngine(controls.postFxEngine.value);
        var edgeAAValue = VRodosCompileUI.General.normalizeEdgeAAStrengthLevel(controls.edgeAAStrength.value);
        envir.scene.aframePostFXEdgeAAEnabled = selectedPostFxEngine !== 'pmndrs' && edgeAAValue > 0;
        envir.scene.aframePostFXEdgeAAStrength = edgeAAValue > 0 ? edgeAAValue : (envir.scene.aframePostFXEdgeAAStrength || 3);

        if (controls.pmndrsAAMode) {
            envir.scene.aframePmndrsAAMode = VRodosCompileUI.PostFX.normalizePmndrsAAMode(controls.pmndrsAAMode.value);
        }
        if (controls.pmndrsAAPreset) {
            envir.scene.aframePmndrsAAPreset = VRodosCompileUI.PostFX.normalizePmndrsAAPreset(controls.pmndrsAAPreset.value);
        }

        // Delegate Atmosphere synchronization to module
        VRodosCompileUI.Atmosphere.syncToScene(controls);
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
            ? VRodosCompileUI.General.normalizeAAQuality(envir.scene.aframeAAQuality)
            : 'balanced';
        controls.ambientOcclusionPreset.value = envir && envir.scene
            ? VRodosCompileUI.General.normalizeAmbientOcclusionPreset(envir.scene.aframeAmbientOcclusionPreset)
            : 'balanced';
        controls.contactShadowPreset.value = envir && envir.scene
            ? VRodosCompileUI.General.normalizeContactShadowPreset(envir.scene.aframeContactShadowPreset)
            : 'soft';
        controls.fpsMeter.checked = !!(envir && envir.scene && envir.scene.aframeFPSMeterEnabled);
        if (controls.hoveringInteractables) {
            controls.hoveringInteractables.checked = !(envir && envir.scene) || envir.scene.aframeHoveringInteractables !== false;
        }
        controls.postFx.checked = !!(envir && envir.scene && envir.scene.aframePostFXEnabled);
        if (controls.legacyHorizonStageSize) {
            controls.legacyHorizonStageSize.value = VRodosCompileUI.General.clampLegacyHorizonStageSize(envir && envir.scene ? envir.scene.aframeLegacyHorizonStageSize : 5000);
        }
        controls.postFxColor.checked = !(envir && envir.scene) || envir.scene.aframePostFXColorEnabled !== false;

        var edgeAAEnabled = !(envir && envir.scene) || envir.scene.aframePostFXEdgeAAEnabled !== false;
        var edgeAAStrength = envir && envir.scene ? envir.scene.aframePostFXEdgeAAStrength : 3;
        controls.edgeAAStrength.value = edgeAAEnabled ? VRodosCompileUI.General.normalizeEdgeAAStrengthLevel(edgeAAStrength) : 0;

        controls.bloomStrength.value = envir && envir.scene
            ? VRodosCompileUI.PostFX.normalizeBloomStrength(envir.scene.aframeBloomStrength)
            : 'off';
        controls.exposurePreset.value = envir && envir.scene
            ? VRodosCompileUI.PostFX.normalizeExposurePreset(envir.scene.aframeExposurePreset)
            : 'neutral';
        controls.contrastPreset.value = envir && envir.scene
            ? VRodosCompileUI.PostFX.normalizeContrastPreset(envir.scene.aframeContrastPreset)
            : 'balanced';
        controls.reflectionProfile.value = envir && envir.scene && envir.scene.aframeReflectionProfile
            ? VRodosCompileUI.PostFX.normalizeReflectionProfile(envir.scene.aframeReflectionProfile)
            : 'balanced';
        controls.reflectionSource.value = envir && envir.scene && envir.scene.aframeReflectionSource
            ? VRodosCompileUI.PostFX.normalizeReflectionSource(envir.scene.aframeReflectionSource)
            : 'hdr';
        if (controls.envMapPreset) {
            controls.envMapPreset.value = envir && envir.scene && envir.scene.aframeEnvMapPreset
                ? VRodosCompileUI.PostFX.normalizeEnvMapPreset(envir.scene.aframeEnvMapPreset)
                : 'none';
        }
        if (controls.ssrStrength) {
            controls.ssrStrength.value = envir && envir.scene && envir.scene.aframePostFXSSRStrength
                ? VRodosCompileUI.PostFX.normalizeSSRStrength(envir.scene.aframePostFXSSRStrength)
                : 'off';
        }
        if (controls.taaEnabled) {
            controls.taaEnabled.checked = !!(envir && envir.scene && envir.scene.aframePostFXTAAEnabled);
        }
        if (controls.postFxEngine) {
            controls.postFxEngine.value = envir && envir.scene && envir.scene.aframePostFXEngine
                ? VRodosCompileUI.PostFX.normalizeEngine(envir.scene.aframePostFXEngine)
                : 'legacy';
        }
        if (controls.pmndrsAAMode) {
            var pmndrsAAModeValue = envir && envir.scene
                ? VRodosCompileUI.PostFX.normalizePmndrsAAMode(envir.scene.aframePmndrsAAMode)
                : 'inherit';
            if (pmndrsAAModeValue === 'inherit') {
                pmndrsAAModeValue = envir && envir.scene && VRodosCompileUI.PostFX.normalizeEngine(envir.scene.aframePostFXEngine) === 'pmndrs'
                    ? derivePmndrsAAModeFromAAQuality(controls.aaQuality.value)
                    : Shared.PMNDRS_TWEAK_DEFAULTS.aaMode;
            }
            controls.pmndrsAAMode.value = pmndrsAAModeValue;
        }
        if (controls.pmndrsAAPreset) {
            var pmndrsAAPresetValue = envir && envir.scene
                ? VRodosCompileUI.PostFX.normalizePmndrsAAPreset(envir.scene.aframePmndrsAAPreset)
                : 'inherit';
            if (pmndrsAAPresetValue === 'inherit') {
                pmndrsAAPresetValue = envir && envir.scene && VRodosCompileUI.PostFX.normalizeEngine(envir.scene.aframePostFXEngine) === 'pmndrs'
                    ? derivePmndrsAAPresetFromAAQuality(controls.aaQuality.value)
                    : Shared.PMNDRS_TWEAK_DEFAULTS.aaPreset;
            }
            controls.pmndrsAAPreset.value = pmndrsAAPresetValue;
        }

        if (controls.pmndrsBloomIntensity) {
            controls.pmndrsBloomIntensity.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsBloomIntensity : 1.0, 0, 3, 1.0);
        }
        if (controls.pmndrsBloomThreshold) {
            controls.pmndrsBloomThreshold.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsBloomThreshold : 0.62, 0, 1, 0.62);
        }
        if (controls.pmndrsExposure) {
            controls.pmndrsExposure.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsToneMappingExposure : 1.0, 0.3, 2.5, 1.0);
        }
        if (controls.pmndrsVignetteDarkness) {
            controls.pmndrsVignetteDarkness.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsVignetteDarkness : 0.5, 0, 1, 0.5);
        }
        if (controls.pmndrsAtmosphere) {
            controls.pmndrsAtmosphere.checked = !(envir && envir.scene) || envir.scene.aframePmndrsAtmosphereEnabled !== false;
        }
        if (controls.pmndrsAtmospherePreset) {
            controls.pmndrsAtmospherePreset.value = envir && envir.scene && envir.scene.aframePmndrsAtmospherePreset
                ? VRodosCompileUI.Atmosphere.normalizePreset(envir.scene.aframePmndrsAtmospherePreset)
                : Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset;
        }
        if (controls.pmndrsAtmospherePresetIntensity) {
            controls.pmndrsAtmospherePresetIntensity.value = Shared.clampNumber(
                envir && envir.scene ? envir.scene.aframePmndrsAtmospherePresetIntensity : Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePresetIntensity,
                0,
                1,
                Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePresetIntensity
            );
        }
        if (controls.pmndrsAtmosphereQuality) {
            controls.pmndrsAtmosphereQuality.value = envir && envir.scene && envir.scene.aframePmndrsAtmosphereQuality
                ? VRodosCompileUI.Atmosphere.normalizeQuality(envir.scene.aframePmndrsAtmosphereQuality)
                : Shared.PMNDRS_TWEAK_DEFAULTS.atmosphereQuality;
        }
        var lightingPresetFallback = Shared.normalizePmndrsHorizonLightingPreset(
            envir && envir.scene ? envir.scene.aframeHorizonSkyPreset : 'natural',
            Shared.PMNDRS_TWEAK_DEFAULTS.horizonLightingPreset
        );
        var resolvedHorizonLightingPreset = Shared.normalizePmndrsHorizonLightingPreset(
            envir && envir.scene ? envir.scene.aframePmndrsHorizonLightingPreset : lightingPresetFallback,
            lightingPresetFallback
        );
        var helperDefaults = Shared.getPmndrsHorizonHelperDefaults(
            resolvedHorizonLightingPreset === 'custom' ? lightingPresetFallback : resolvedHorizonLightingPreset
        );
        if (controls.pmndrsHorizonLightingPreset) {
            controls.pmndrsHorizonLightingPreset.value = resolvedHorizonLightingPreset;
        }
        var resolvedAtmospherePreset = VRodosCompileUI.Atmosphere.normalizePreset(
            controls.pmndrsAtmospherePreset ? controls.pmndrsAtmospherePreset.value : Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset
        );
        if (resolvedAtmospherePreset !== 'custom') {
            VRodosCompileUI.Atmosphere.applyLookPreset(controls, resolvedAtmospherePreset);
        } else {
            if (controls.pmndrsSunElevation) {
                controls.pmndrsSunElevation.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsSunElevationDeg : Shared.PMNDRS_TWEAK_DEFAULTS.sunElevationDeg, -10, 85, Shared.PMNDRS_TWEAK_DEFAULTS.sunElevationDeg);
            }
            if (controls.pmndrsSunAzimuth) {
                controls.pmndrsSunAzimuth.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsSunAzimuthDeg : Shared.PMNDRS_TWEAK_DEFAULTS.sunAzimuthDeg, -180, 180, Shared.PMNDRS_TWEAK_DEFAULTS.sunAzimuthDeg);
            }
            if (controls.pmndrsSunDistance) {
                controls.pmndrsSunDistance.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsSunDistance : Shared.PMNDRS_TWEAK_DEFAULTS.sunDistance, 1500, 20000, Shared.PMNDRS_TWEAK_DEFAULTS.sunDistance);
            }
            if (controls.pmndrsSunAngularRadius) {
                controls.pmndrsSunAngularRadius.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsSunAngularRadius : Shared.PMNDRS_TWEAK_DEFAULTS.sunAngularRadius, 0.002, 0.03, Shared.PMNDRS_TWEAK_DEFAULTS.sunAngularRadius);
            }
            if (controls.pmndrsAerialStrength) {
                controls.pmndrsAerialStrength.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsAerialStrength : Shared.PMNDRS_TWEAK_DEFAULTS.aerialStrength, 0, 2, Shared.PMNDRS_TWEAK_DEFAULTS.aerialStrength);
            }
            if (controls.pmndrsAlbedoScale) {
                controls.pmndrsAlbedoScale.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsAlbedoScale : Shared.PMNDRS_TWEAK_DEFAULTS.albedoScale, 0, 2, Shared.PMNDRS_TWEAK_DEFAULTS.albedoScale);
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
                controls.pmndrsGroundAlbedo.value = Shared.normalizeColorHex(
                    envir && envir.scene ? envir.scene.aframePmndrsGroundAlbedo : Shared.PMNDRS_TWEAK_DEFAULTS.groundAlbedo,
                    Shared.PMNDRS_TWEAK_DEFAULTS.groundAlbedo
                );
            }
            if (controls.pmndrsRayleighScale) {
                controls.pmndrsRayleighScale.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsRayleighScale : Shared.PMNDRS_TWEAK_DEFAULTS.rayleighScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.rayleighScale);
            }
            if (controls.pmndrsMieScatteringScale) {
                controls.pmndrsMieScatteringScale.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsMieScatteringScale : Shared.PMNDRS_TWEAK_DEFAULTS.mieScatteringScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.mieScatteringScale);
            }
            if (controls.pmndrsMieExtinctionScale) {
                controls.pmndrsMieExtinctionScale.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsMieExtinctionScale : Shared.PMNDRS_TWEAK_DEFAULTS.mieExtinctionScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.mieExtinctionScale);
            }
            if (controls.pmndrsMiePhaseG) {
                controls.pmndrsMiePhaseG.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsMiePhaseG : Shared.PMNDRS_TWEAK_DEFAULTS.miePhaseG, 0, 0.99, Shared.PMNDRS_TWEAK_DEFAULTS.miePhaseG);
            }
            if (controls.pmndrsAbsorptionScale) {
                controls.pmndrsAbsorptionScale.value = Shared.clampNumber(envir && envir.scene ? envir.scene.aframePmndrsAbsorptionScale : Shared.PMNDRS_TWEAK_DEFAULTS.absorptionScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.absorptionScale);
            }
            if (controls.pmndrsMoon) {
                controls.pmndrsMoon.checked = !!(envir && envir.scene && envir.scene.aframePmndrsMoonEnabled);
            }
        }
        if (controls.pmndrsHorizonKeyLightIntensity) {
            controls.pmndrsHorizonKeyLightIntensity.value = Shared.clampNumber(
                envir && envir.scene ? envir.scene.aframePmndrsHorizonKeyLightIntensity : helperDefaults.keyLightIntensity,
                0,
                3,
                helperDefaults.keyLightIntensity
            );
        }
        if (controls.pmndrsHorizonFillLightIntensity) {
            controls.pmndrsHorizonFillLightIntensity.value = Shared.clampNumber(
                envir && envir.scene ? envir.scene.aframePmndrsHorizonFillLightIntensity : helperDefaults.fillLightIntensity,
                0,
                3,
                helperDefaults.fillLightIntensity
            );
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
    if (controls.hoveringInteractables) {
        controls.hoveringInteractables.addEventListener('change', syncCompilePostFxState);
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
            VRodosCompileUI.General.updateValueLabels(controls);
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
    [controls.pmndrsBloomIntensity, controls.pmndrsBloomThreshold, controls.pmndrsExposure, controls.pmndrsVignetteDarkness, controls.pmndrsAtmospherePresetIntensity].forEach(function (el) {
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
                VRodosCompileUI.Atmosphere.markCustom(controls);
            });
        }
    });
    [
        controls.pmndrsHorizonKeyLightIntensity,
        controls.pmndrsHorizonFillLightIntensity
    ].forEach(function (el) {
        if (el) {
            el.addEventListener('input', function () {
                updatePmndrsValueLabels();
                VRodosCompileUI.Atmosphere.markHorizonLightingCustom(controls);
            });
            el.addEventListener('change', syncCompilePostFxState);
        }
    });
    if (controls.pmndrsHorizonLightingPreset) {
        controls.pmndrsHorizonLightingPreset.addEventListener('change', function () {
            var fallbackPreset = Shared.normalizePmndrsHorizonLightingPreset(
                envir && envir.scene ? envir.scene.aframeHorizonSkyPreset : 'natural',
                Shared.PMNDRS_TWEAK_DEFAULTS.horizonLightingPreset
            );
            var preset = Shared.normalizePmndrsHorizonLightingPreset(controls.pmndrsHorizonLightingPreset.value, fallbackPreset);
            if (preset !== 'custom') {
                VRodosCompileUI.Atmosphere.applyHorizonLightingPreset(controls, preset);
            }
            updatePmndrsValueLabels();
            syncCompilePostFxState();
            VRodosCompileUI.Atmosphere.syncToScene(controls);
        });
    }
    [
        controls.pmndrsTransmittance,
        controls.pmndrsInscatter,
        controls.pmndrsGround,
        controls.pmndrsGroundAlbedo,
        controls.pmndrsMoon
    ].forEach(function (el) {
        if (el) {
            el.addEventListener('change', function () {
                VRodosCompileUI.Atmosphere.markCustom(controls);
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
    if (controls.pmndrsAtmospherePreset) {
        controls.pmndrsAtmospherePreset.addEventListener('change', function () {
            var preset = VRodosCompileUI.Atmosphere.normalizePreset(controls.pmndrsAtmospherePreset.value);
            if (preset !== 'custom') {
                VRodosCompileUI.Atmosphere.applyLookPreset(controls, preset);
            }
            updatePmndrsValueLabels();
            syncCompilePostFxState();
            VRodosCompileUI.Atmosphere.syncToScene(controls);
        });
    }
    if (controls.pmndrsAtmospherePresetIntensity) {
        controls.pmndrsAtmospherePresetIntensity.addEventListener('input', function () {
            var preset = VRodosCompileUI.Atmosphere.normalizePreset(controls.pmndrsAtmospherePreset ? controls.pmndrsAtmospherePreset.value : Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset);
            if (preset !== 'custom') {
                VRodosCompileUI.Atmosphere.applyLookPreset(controls, preset);
            }
            updatePmndrsValueLabels();
            VRodosCompileUI.Atmosphere.syncToScene(controls);
        });
        controls.pmndrsAtmospherePresetIntensity.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsAtmosphereQuality) {
        controls.pmndrsAtmosphereQuality.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsResetBtn) {
        controls.pmndrsResetBtn.addEventListener('click', function (e) {
            e.preventDefault();
            var c = getCompileDialogElements();
            if (c.pmndrsAAMode) c.pmndrsAAMode.value = Shared.PMNDRS_TWEAK_DEFAULTS.aaMode;
            if (c.pmndrsAAPreset) c.pmndrsAAPreset.value = Shared.PMNDRS_TWEAK_DEFAULTS.aaPreset;
            if (c.pmndrsBloomIntensity) c.pmndrsBloomIntensity.value = Shared.PMNDRS_TWEAK_DEFAULTS.bloomIntensity;
            if (c.pmndrsBloomThreshold) c.pmndrsBloomThreshold.value = Shared.PMNDRS_TWEAK_DEFAULTS.bloomThreshold;
            if (c.pmndrsExposure) c.pmndrsExposure.value = Shared.PMNDRS_TWEAK_DEFAULTS.toneMappingExposure;
            if (c.pmndrsVignette) c.pmndrsVignette.checked = Shared.PMNDRS_TWEAK_DEFAULTS.vignetteEnabled;
            if (c.pmndrsVignetteDarkness) c.pmndrsVignetteDarkness.value = Shared.PMNDRS_TWEAK_DEFAULTS.vignetteDarkness;
            if (c.pmndrsAtmosphere) c.pmndrsAtmosphere.checked = Shared.PMNDRS_TWEAK_DEFAULTS.atmosphereEnabled;
            if (c.pmndrsAtmospherePreset) c.pmndrsAtmospherePreset.value = Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset;
            if (c.pmndrsAtmospherePresetIntensity) c.pmndrsAtmospherePresetIntensity.value = Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePresetIntensity;
            if (c.pmndrsAtmosphereQuality) c.pmndrsAtmosphereQuality.value = Shared.PMNDRS_TWEAK_DEFAULTS.atmosphereQuality;
            var lightingPresetFallback = Shared.normalizePmndrsHorizonLightingPreset(
                envir && envir.scene ? envir.scene.aframeHorizonSkyPreset : 'natural',
                Shared.PMNDRS_TWEAK_DEFAULTS.horizonLightingPreset
            );
            if (c.pmndrsHorizonLightingPreset) c.pmndrsHorizonLightingPreset.value = lightingPresetFallback;
            var helperDefaults = Shared.getPmndrsHorizonHelperDefaults(lightingPresetFallback);
            if (c.pmndrsHorizonKeyLightIntensity) c.pmndrsHorizonKeyLightIntensity.value = helperDefaults.keyLightIntensity;
            if (c.pmndrsHorizonFillLightIntensity) c.pmndrsHorizonFillLightIntensity.value = helperDefaults.fillLightIntensity;
            VRodosCompileUI.Atmosphere.applyLookPreset(c, Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset);
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
