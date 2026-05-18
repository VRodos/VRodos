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

    function normalizeRuntimeMode(value) {
        return value === 'networked' ? 'networked' : 'single-player';
    }

    function getCompileDialogElements() {
        return {
            runtimeMode: document.getElementById('compileRuntimeModeSelect'),
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
            reflectionsEnabled: document.getElementById('compileReflectionsEnabledToggle'),
            reflectionControlsWrapper: document.getElementById('compileReflectionControlsWrapper'),
            reflectionProfile: document.getElementById('compileReflectionProfileSelect'),
            reflectionSource: document.getElementById('compileReflectionSourceSelect'),
            sceneProbeControlsWrapper: document.getElementById('compileSceneProbeControlsWrapper'),
            sceneProbeUpdateMode: document.getElementById('compileSceneProbeUpdateModeSelect'),
            sceneProbeResolution: document.getElementById('compileSceneProbeResolutionSelect'),
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
            pmndrsToneMapping: document.getElementById('compilePmndrsToneMappingSelect'),
            pmndrsExposure: document.getElementById('compilePmndrsExposureSlider'),
            pmndrsExposureValue: document.getElementById('compilePmndrsExposureValue'),
            pmndrsLensFlare: document.getElementById('compilePmndrsLensFlareToggle'),
            pmndrsLut: document.getElementById('compilePmndrsLutToggle'),
            pmndrsLutWrapper: document.getElementById('compilePmndrsLutWrapper'),
            pmndrsLutLook: document.getElementById('compilePmndrsLutLookSelect'),
            pmndrsLutStrength: document.getElementById('compilePmndrsLutStrengthSlider'),
            pmndrsLutStrengthValue: document.getElementById('compilePmndrsLutStrengthValue'),
            pmndrsVignette: document.getElementById('compilePmndrsVignetteToggle'),
            pmndrsVignetteWrapper: document.getElementById('compilePmndrsVignetteWrapper'),
            pmndrsVignetteDarkness: document.getElementById('compilePmndrsVignetteDarknessSlider'),
            pmndrsVignetteDarknessValue: document.getElementById('compilePmndrsVignetteDarknessValue'),
            pmndrsNoise: document.getElementById('compilePmndrsNoiseToggle'),
            pmndrsNoiseWrapper: document.getElementById('compilePmndrsNoiseWrapper'),
            pmndrsNoiseOpacity: document.getElementById('compilePmndrsNoiseOpacitySlider'),
            pmndrsNoiseOpacityValue: document.getElementById('compilePmndrsNoiseOpacityValue'),
            pmndrsChromaticAberration: document.getElementById('compilePmndrsChromaticAberrationToggle'),
            pmndrsChromaticAberrationWrapper: document.getElementById('compilePmndrsChromaticAberrationWrapper'),
            pmndrsChromaticAberrationOffset: document.getElementById('compilePmndrsChromaticAberrationOffsetSlider'),
            pmndrsChromaticAberrationOffsetValue: document.getElementById('compilePmndrsChromaticAberrationOffsetValue'),
            pmndrsAtmosphere: document.getElementById('compilePmndrsAtmosphereToggle'),
            pmndrsAtmosphereWrapper: document.getElementById('compilePmndrsAtmosphereWrapper'),
            pmndrsAtmospherePreset: document.getElementById('compilePmndrsAtmospherePresetSelect'),
            pmndrsAtmospherePresetIntensity: document.getElementById('compilePmndrsAtmospherePresetIntensitySlider'),
            pmndrsAtmospherePresetIntensityValue: document.getElementById('compilePmndrsAtmospherePresetIntensityValue'),
            pmndrsAtmosphereQuality: document.getElementById('compilePmndrsAtmosphereQualitySelect'),
            pmndrsCelestialMode: document.getElementById('compilePmndrsCelestialModeSelect'),
            pmndrsCelestialTimePresetWrapper: document.getElementById('compilePmndrsCelestialTimePresetWrapper'),
            pmndrsCelestialTimePreset: document.getElementById('compilePmndrsCelestialTimePresetSelect'),
            pmndrsCelestialDateTimeWrapper: document.getElementById('compilePmndrsCelestialDateTimeWrapper'),
            pmndrsCelestialDate: document.getElementById('compilePmndrsCelestialDateInput'),
            pmndrsCelestialUtcTime: document.getElementById('compilePmndrsCelestialUtcTimeInput'),
            pmndrsGeospatial: document.getElementById('compilePmndrsGeospatialToggle'),
            pmndrsGeospatialLatitude: document.getElementById('compilePmndrsGeospatialLatitudeInput'),
            pmndrsGeospatialLongitude: document.getElementById('compilePmndrsGeospatialLongitudeInput'),
            pmndrsGeospatialAltitude: document.getElementById('compilePmndrsGeospatialAltitudeInput'),
            pmndrsAerialPerspective: document.getElementById('compilePmndrsAerialPerspectiveToggle'),
            pmndrsCorrectAltitude: document.getElementById('compilePmndrsCorrectAltitudeToggle'),
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
        if (typeof VRODOS.editor.envir === 'undefined' || !VRODOS.editor.envir || !VRODOS.editor.envir.scene) {
            return;
        }

        if (!VRODOS.editor.envir.scene.aframeRenderQuality) {
            VRODOS.editor.envir.scene.aframeRenderQuality = 'standard';
        }
        if (!VRODOS.editor.envir.scene.aframeShadowQuality) {
            VRODOS.editor.envir.scene.aframeShadowQuality = 'medium';
        }
        if (!VRODOS.editor.envir.scene.aframeAAQuality) {
            VRODOS.editor.envir.scene.aframeAAQuality = 'balanced';
        }
        if (typeof VRODOS.editor.envir.scene.aframeFPSMeterEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframeFPSMeterEnabled = false;
        }
        if (typeof VRODOS.editor.envir.scene.aframeHoveringInteractables === 'undefined') {
            VRODOS.editor.envir.scene.aframeHoveringInteractables = true;
        }
        VRODOS.editor.envir.scene.aframeRuntimeMode = normalizeRuntimeMode(VRODOS.editor.envir.scene.aframeRuntimeMode);
        if (typeof VRODOS.editor.envir.scene.aframeLegacyHorizonStageSize !== 'number') {
            VRODOS.editor.envir.scene.aframeLegacyHorizonStageSize = VRodosCompileUI.General.clampLegacyHorizonStageSize(VRODOS.editor.envir.scene.aframeLegacyHorizonStageSize);
        }
        if (!VRODOS.editor.envir.scene.aframeAmbientOcclusionPreset) {
            VRODOS.editor.envir.scene.aframeAmbientOcclusionPreset = 'balanced';
        }
        if (!VRODOS.editor.envir.scene.aframeContactShadowPreset) {
            VRODOS.editor.envir.scene.aframeContactShadowPreset = 'soft';
        }
        if (typeof VRODOS.editor.envir.scene.aframePostFXEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePostFXEnabled = false;
        }
        if (!VRODOS.editor.envir.scene.aframeBloomStrength) {
            VRODOS.editor.envir.scene.aframeBloomStrength = 'off';
        }
        if (!VRODOS.editor.envir.scene.aframeReflectionProfile) {
            VRODOS.editor.envir.scene.aframeReflectionProfile = 'balanced';
        }
        if (!VRODOS.editor.envir.scene.aframeReflectionSource) {
            VRODOS.editor.envir.scene.aframeReflectionSource = 'hdr';
        }
        if (!VRODOS.editor.envir.scene.aframeSceneProbeUpdateMode) {
            VRODOS.editor.envir.scene.aframeSceneProbeUpdateMode = Shared.SCENE_PROBE_DEFAULTS.updateMode;
        }
        if (!VRODOS.editor.envir.scene.aframeSceneProbeResolution) {
            VRODOS.editor.envir.scene.aframeSceneProbeResolution = Shared.SCENE_PROBE_DEFAULTS.resolution;
        }
        if (!VRODOS.editor.envir.scene.aframeEnvMapPreset) {
            VRODOS.editor.envir.scene.aframeEnvMapPreset = 'none';
        }
        if (!VRODOS.editor.envir.scene.aframeExposurePreset) {
            VRODOS.editor.envir.scene.aframeExposurePreset = 'neutral';
        }
        if (!VRODOS.editor.envir.scene.aframeContrastPreset) {
            VRODOS.editor.envir.scene.aframeContrastPreset = 'balanced';
        }
        if (typeof VRODOS.editor.envir.scene.aframeReflectionsEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframeReflectionsEnabled = true;
        }
        if (typeof VRODOS.editor.envir.scene.aframePostFXBloomEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePostFXBloomEnabled = false;
        }
        if (typeof VRODOS.editor.envir.scene.aframePostFXColorEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePostFXColorEnabled = false;
        }
        if (typeof VRODOS.editor.envir.scene.aframePostFXVignetteEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePostFXVignetteEnabled = false;
        }
        if (typeof VRODOS.editor.envir.scene.aframePostFXEdgeAAEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePostFXEdgeAAEnabled = true;
        }
        if (typeof VRODOS.editor.envir.scene.aframePostFXEdgeAAStrength === 'undefined') {
            VRODOS.editor.envir.scene.aframePostFXEdgeAAStrength = 3;
        }
        if (typeof VRODOS.editor.envir.scene.aframePostFXTAAEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePostFXTAAEnabled = false;
        }
        if (!VRODOS.editor.envir.scene.aframePostFXSSRStrength) {
            VRODOS.editor.envir.scene.aframePostFXSSRStrength = 'off';
        }
        if (typeof VRODOS.editor.envir.scene.aframePostFXSSREnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePostFXSSREnabled = false;
        }
        if (!VRODOS.editor.envir.scene.aframePostFXEngine) {
            VRODOS.editor.envir.scene.aframePostFXEngine = 'legacy';
        }
        if (!VRODOS.editor.envir.scene.aframePmndrsAAMode) {
            VRODOS.editor.envir.scene.aframePmndrsAAMode = 'inherit';
        }
        if (!VRODOS.editor.envir.scene.aframePmndrsAAPreset) {
            VRODOS.editor.envir.scene.aframePmndrsAAPreset = 'inherit';
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsBloomIntensity !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsBloomIntensity = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsBloomIntensity, 0, 3, 1.0);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsBloomThreshold !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsBloomThreshold = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsBloomThreshold, 0, 1, 0.62);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsVignetteEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsVignetteEnabled = false;
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsVignetteDarkness !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsVignetteDarkness = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsVignetteDarkness, 0, 1, 0.5);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsToneMappingExposure !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsToneMappingExposure = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsToneMappingExposure, 1, 20, 1.0);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsLowLightAutoExposureEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsLowLightAutoExposureEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.lowLightAutoExposureEnabled;
        }
        VRODOS.editor.envir.scene.aframePmndrsToneMappingMode = VRodosCompileUI.PostFX.normalizePmndrsToneMappingMode(VRODOS.editor.envir.scene.aframePmndrsToneMappingMode);
        if (typeof VRODOS.editor.envir.scene.aframePmndrsLensFlareEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsLensFlareEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.lensFlareEnabled;
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsLutEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsLutEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.lutEnabled;
        }
        VRODOS.editor.envir.scene.aframePmndrsLutLook = VRodosCompileUI.PostFX.normalizePmndrsLutLook(VRODOS.editor.envir.scene.aframePmndrsLutLook);
        if (typeof VRODOS.editor.envir.scene.aframePmndrsLutStrength !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsLutStrength = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsLutStrength, 0, 1, Shared.PMNDRS_TWEAK_DEFAULTS.lutStrength);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsNoiseEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsNoiseEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.noiseEnabled;
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsNoiseOpacity !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsNoiseOpacity = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsNoiseOpacity, 0, 0.2, Shared.PMNDRS_TWEAK_DEFAULTS.noiseOpacity);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsChromaticAberrationEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsChromaticAberrationEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.chromaticAberrationEnabled;
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsChromaticAberrationOffset !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsChromaticAberrationOffset = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsChromaticAberrationOffset, 0, 0.006, Shared.PMNDRS_TWEAK_DEFAULTS.chromaticAberrationOffset);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsAtmosphereEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsAtmosphereEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.atmosphereEnabled;
        }
        if (!VRODOS.editor.envir.scene.aframePmndrsAtmospherePreset) {
            VRODOS.editor.envir.scene.aframePmndrsAtmospherePreset = Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset;
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsAtmospherePresetIntensity !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsAtmospherePresetIntensity = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsAtmospherePresetIntensity, 0, 1, Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePresetIntensity);
        }
        if (!VRODOS.editor.envir.scene.aframePmndrsAtmosphereQuality) {
            VRODOS.editor.envir.scene.aframePmndrsAtmosphereQuality = Shared.PMNDRS_TWEAK_DEFAULTS.atmosphereQuality;
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsAerialPerspectiveEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsAerialPerspectiveEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.aerialPerspectiveEnabled;
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsCorrectAltitudeEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsCorrectAltitudeEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.correctAltitudeEnabled;
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsGeospatialEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsGeospatialEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.geospatialEnabled;
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsGeospatialLatitudeDeg !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsGeospatialLatitudeDeg = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsGeospatialLatitudeDeg, -90, 90, Shared.PMNDRS_TWEAK_DEFAULTS.geospatialLatitudeDeg);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsGeospatialLongitudeDeg !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsGeospatialLongitudeDeg = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsGeospatialLongitudeDeg, -180, 180, Shared.PMNDRS_TWEAK_DEFAULTS.geospatialLongitudeDeg);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsGeospatialAltitudeMeters !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsGeospatialAltitudeMeters = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsGeospatialAltitudeMeters, -500, 20000, Shared.PMNDRS_TWEAK_DEFAULTS.geospatialAltitudeMeters);
        }
        VRODOS.editor.envir.scene.aframePmndrsCelestialDate = VRodosCompileUI.Atmosphere.normalizeDate(VRODOS.editor.envir.scene.aframePmndrsCelestialDate, Shared.PMNDRS_TWEAK_DEFAULTS.celestialDate);
        VRODOS.editor.envir.scene.aframePmndrsCelestialUtcTime = VRodosCompileUI.Atmosphere.normalizeUtcTime(VRODOS.editor.envir.scene.aframePmndrsCelestialUtcTime, Shared.PMNDRS_TWEAK_DEFAULTS.celestialUtcTime);
        if (typeof VRODOS.editor.envir.scene.aframePmndrsSunElevationDeg !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsSunElevationDeg = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsSunElevationDeg, -18, 85, Shared.PMNDRS_TWEAK_DEFAULTS.sunElevationDeg);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsSunAzimuthDeg !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsSunAzimuthDeg = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsSunAzimuthDeg, -180, 180, Shared.PMNDRS_TWEAK_DEFAULTS.sunAzimuthDeg);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsSunDistance !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsSunDistance = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsSunDistance, 1500, 20000, Shared.PMNDRS_TWEAK_DEFAULTS.sunDistance);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsSunAngularRadius !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsSunAngularRadius = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsSunAngularRadius, 0.002, 0.03, Shared.PMNDRS_TWEAK_DEFAULTS.sunAngularRadius);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsAerialStrength !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsAerialStrength = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsAerialStrength, 0, 2, Shared.PMNDRS_TWEAK_DEFAULTS.aerialStrength);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsAlbedoScale !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsAlbedoScale = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsAlbedoScale, 0, 2, Shared.PMNDRS_TWEAK_DEFAULTS.albedoScale);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsTransmittanceEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsTransmittanceEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.transmittanceEnabled;
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsInscatterEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsInscatterEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.inscatterEnabled;
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsGroundEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsGroundEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.groundEnabled;
        }
        VRODOS.editor.envir.scene.aframePmndrsGroundAlbedo = Shared.normalizeColorHex(VRODOS.editor.envir.scene.aframePmndrsGroundAlbedo, Shared.PMNDRS_TWEAK_DEFAULTS.groundAlbedo);
        if (typeof VRODOS.editor.envir.scene.aframePmndrsRayleighScale !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsRayleighScale = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsRayleighScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.rayleighScale);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsMieScatteringScale !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsMieScatteringScale = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsMieScatteringScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.mieScatteringScale);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsMieExtinctionScale !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsMieExtinctionScale = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsMieExtinctionScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.mieExtinctionScale);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsMiePhaseG !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsMiePhaseG = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsMiePhaseG, 0, 0.99, Shared.PMNDRS_TWEAK_DEFAULTS.miePhaseG);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsAbsorptionScale !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsAbsorptionScale = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsAbsorptionScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.absorptionScale);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsMoonEnabled === 'undefined') {
            VRODOS.editor.envir.scene.aframePmndrsMoonEnabled = Shared.PMNDRS_TWEAK_DEFAULTS.moonEnabled;
        }
        VRODOS.editor.envir.scene.aframePmndrsStarsEnabled = Shared.normalizePmndrsStarsEnabled(
            VRODOS.editor.envir.scene.aframePmndrsStarsEnabled,
            Shared.PMNDRS_TWEAK_DEFAULTS.starsEnabled
        );
        const lightingPresetFallback = Shared.normalizePmndrsHorizonLightingPreset(
            VRODOS.editor.envir.scene.aframeHorizonSkyPreset,
            Shared.PMNDRS_TWEAK_DEFAULTS.horizonLightingPreset
        );
        if (!VRODOS.editor.envir.scene.aframePmndrsHorizonLightingPreset) {
            VRODOS.editor.envir.scene.aframePmndrsHorizonLightingPreset = lightingPresetFallback;
        } else {
            VRODOS.editor.envir.scene.aframePmndrsHorizonLightingPreset = Shared.normalizePmndrsHorizonLightingPreset(
                VRODOS.editor.envir.scene.aframePmndrsHorizonLightingPreset,
                lightingPresetFallback
            );
        }
        const helperDefaults = Shared.getPmndrsHorizonHelperDefaults(
            VRODOS.editor.envir.scene.aframePmndrsHorizonLightingPreset === 'custom'
                ? lightingPresetFallback
                : VRODOS.editor.envir.scene.aframePmndrsHorizonLightingPreset
        );
        if (typeof VRODOS.editor.envir.scene.aframePmndrsHorizonKeyLightIntensity !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsHorizonKeyLightIntensity = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsHorizonKeyLightIntensity, 0, 3, helperDefaults.keyLightIntensity);
        }
        if (typeof VRODOS.editor.envir.scene.aframePmndrsHorizonFillLightIntensity !== 'number') {
            VRODOS.editor.envir.scene.aframePmndrsHorizonFillLightIntensity = Shared.clampNumber(VRODOS.editor.envir.scene.aframePmndrsHorizonFillLightIntensity, 0, 3, helperDefaults.fillLightIntensity);
        }

        VRODOS.editor.envir.scene.aframeAAQuality = VRodosCompileUI.General.normalizeAAQuality(VRODOS.editor.envir.scene.aframeAAQuality);
        VRODOS.editor.envir.scene.aframeAmbientOcclusionPreset = VRodosCompileUI.General.normalizeAmbientOcclusionPreset(VRODOS.editor.envir.scene.aframeAmbientOcclusionPreset);
        VRODOS.editor.envir.scene.aframeContactShadowPreset = VRodosCompileUI.General.normalizeContactShadowPreset(VRODOS.editor.envir.scene.aframeContactShadowPreset);
        
        VRODOS.editor.envir.scene.aframeBloomStrength = VRodosCompileUI.PostFX.normalizeBloomStrength(VRODOS.editor.envir.scene.aframeBloomStrength);
        VRODOS.editor.envir.scene.aframeExposurePreset = VRodosCompileUI.PostFX.normalizeExposurePreset(VRODOS.editor.envir.scene.aframeExposurePreset);
        VRODOS.editor.envir.scene.aframeContrastPreset = VRodosCompileUI.PostFX.normalizeContrastPreset(VRODOS.editor.envir.scene.aframeContrastPreset);
        VRODOS.editor.envir.scene.aframeReflectionProfile = VRodosCompileUI.PostFX.normalizeReflectionProfile(VRODOS.editor.envir.scene.aframeReflectionProfile);
        VRODOS.editor.envir.scene.aframeReflectionSource = VRodosCompileUI.PostFX.normalizeReflectionSource(VRODOS.editor.envir.scene.aframeReflectionSource);
        VRODOS.editor.envir.scene.aframeSceneProbeUpdateMode = VRodosCompileUI.PostFX.normalizeSceneProbeUpdateMode(VRODOS.editor.envir.scene.aframeSceneProbeUpdateMode);
        VRODOS.editor.envir.scene.aframeSceneProbeResolution = VRodosCompileUI.PostFX.normalizeSceneProbeResolution(VRODOS.editor.envir.scene.aframeSceneProbeResolution);
        VRODOS.editor.envir.scene.aframeEnvMapPreset = VRodosCompileUI.PostFX.normalizeEnvMapPreset(VRODOS.editor.envir.scene.aframeEnvMapPreset);
        VRODOS.editor.envir.scene.aframePostFXSSRStrength = VRodosCompileUI.PostFX.normalizeSSRStrength(VRODOS.editor.envir.scene.aframePostFXSSRStrength);
        VRODOS.editor.envir.scene.aframePostFXSSREnabled = VRODOS.editor.envir.scene.aframePostFXSSRStrength !== 'off';
        VRODOS.editor.envir.scene.aframePostFXEngine = VRodosCompileUI.PostFX.normalizeEngine(VRODOS.editor.envir.scene.aframePostFXEngine);
        VRODOS.editor.envir.scene.aframePmndrsAAMode = VRodosCompileUI.PostFX.normalizePmndrsAAMode(VRODOS.editor.envir.scene.aframePmndrsAAMode);
        VRODOS.editor.envir.scene.aframePmndrsAAPreset = VRodosCompileUI.PostFX.normalizePmndrsAAPreset(VRODOS.editor.envir.scene.aframePmndrsAAPreset);
        VRODOS.editor.envir.scene.aframePmndrsAtmospherePreset = VRodosCompileUI.Atmosphere.normalizePreset(VRODOS.editor.envir.scene.aframePmndrsAtmospherePreset);
        VRODOS.editor.envir.scene.aframePmndrsAtmosphereQuality = VRodosCompileUI.Atmosphere.normalizeQuality(VRODOS.editor.envir.scene.aframePmndrsAtmosphereQuality);
        VRODOS.editor.envir.scene.aframePmndrsCelestialMode = VRodosCompileUI.Atmosphere.normalizeCelestialMode(VRODOS.editor.envir.scene.aframePmndrsCelestialMode);
        VRODOS.editor.envir.scene.aframePmndrsCelestialTimePreset = VRodosCompileUI.Atmosphere.normalizeCelestialTimePreset(VRODOS.editor.envir.scene.aframePmndrsCelestialTimePreset);
        
        if (VRODOS.editor.envir.scene.aframePostFXBloomEnabled === false) {
            VRODOS.editor.envir.scene.aframeBloomStrength = 'off';
        }
        VRODOS.editor.envir.scene.aframePostFXBloomEnabled = VRODOS.editor.envir.scene.aframeBloomStrength !== 'off';
        VRODOS.editor.envir.scene.aframePostFXVignetteEnabled = false;
    }

    function syncCompilePostFxState() {
        const controls = getCompileDialogElements();
        if (!controls.postFx || !controls.bloomStrength || !controls.postFxColor || !controls.edgeAAStrength || !controls.exposurePreset || !controls.contrastPreset || !controls.reflectionProfile || !controls.reflectionSource) {
            return;
        }

        const postFxEnabled = controls.postFx.checked;
        const colorGradingEnabled = postFxEnabled && controls.postFxColor.checked;
        const reflectionsEnabled = !controls.reflectionsEnabled || controls.reflectionsEnabled.checked === true;
        const reflectionControlsVisible = reflectionsEnabled;
        const reflectionControlsEnabled = postFxEnabled && reflectionsEnabled;
        const reflectionSource = VRodosCompileUI.PostFX.normalizeReflectionSource(controls.reflectionSource.value);
        const envLightingEnabled = reflectionControlsEnabled && reflectionSource === 'hdr';
        const sceneProbeControlsVisible = reflectionControlsVisible && reflectionSource === 'scene-probe';
        const bloomEnabled = postFxEnabled && VRodosCompileUI.PostFX.normalizeBloomStrength(controls.bloomStrength.value) !== 'off';
        const engine = controls.postFxEngine ? VRodosCompileUI.PostFX.normalizeEngine(controls.postFxEngine.value) : 'legacy';
        const isPmndrs = engine === 'pmndrs';
        VRodosCompileUI.General.updateUI(controls, isPmndrs);

        const edgeAAAvailable = postFxEnabled && !isPmndrs;
        
        VRodosCompileUI.PostFX.updateUI(controls, postFxEnabled, isPmndrs, bloomEnabled);

        controls.postFxColor.disabled = !postFxEnabled;
        controls.bloomStrength.disabled = !postFxEnabled;
        controls.reflectionProfile.disabled = !reflectionControlsEnabled;
        controls.reflectionSource.disabled = !reflectionControlsEnabled;

        if (controls.reflectionControlsWrapper) {
            controls.reflectionControlsWrapper.style.display = reflectionControlsVisible ? '' : 'none';
        }
        if (controls.sceneProbeControlsWrapper) {
            controls.sceneProbeControlsWrapper.style.display = sceneProbeControlsVisible ? '' : 'none';
        }
        if (controls.sceneProbeUpdateMode) {
            controls.sceneProbeUpdateMode.disabled = !reflectionControlsEnabled || reflectionSource !== 'scene-probe';
        }
        if (controls.sceneProbeResolution) {
            controls.sceneProbeResolution.disabled = !reflectionControlsEnabled || reflectionSource !== 'scene-probe';
        }
        
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
            if (controls.taaEnabled.parentElement) {
                controls.taaEnabled.parentElement.classList.toggle('tw-opacity-60', isPmndrs);
            }
        }

        const pmndrsTweakEnabled = postFxEnabled && isPmndrs;
        const pmndrsAAMode = controls.pmndrsAAMode ? VRodosCompileUI.PostFX.normalizePmndrsAAMode(controls.pmndrsAAMode.value) : Shared.PMNDRS_TWEAK_DEFAULTS.aaMode;
        const pmndrsAAPresetVisible = pmndrsTweakEnabled && pmndrsAAMode !== 'none';

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
        
        const pmndrsAtmoChecked = pmndrsTweakEnabled && controls.pmndrsAtmosphere && controls.pmndrsAtmosphere.checked === true;
        if (controls.pmndrsAtmosphereWrapper) {
            controls.pmndrsAtmosphereWrapper.style.display = pmndrsAtmoChecked ? '' : 'none';
        }

        VRodosCompileUI.Atmosphere.setAdvancedState(controls, pmndrsAtmoChecked);
        VRodosCompileUI.General.updateValueLabels(controls);
    }

    function updatePmndrsValueLabels() {
        const c = getCompileDialogElements();
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
        if (typeof VRODOS.editor.envir === 'undefined' || !VRODOS.editor.envir.scene) {
            return;
        }

        const controls = getCompileDialogElements();
        if (!controls.renderQuality || !controls.shadowQuality || !controls.aaQuality || !controls.ambientOcclusionPreset || !controls.contactShadowPreset || !controls.fpsMeter || !controls.postFx || !controls.postFxColor || !controls.edgeAAStrength || !controls.bloomStrength || !controls.exposurePreset || !controls.contrastPreset || !controls.reflectionProfile || !controls.reflectionSource) {
            return;
        }

        ensureCompileSceneSettingsDefaults();

        VRodosCompileUI.General.syncToScene(controls);
        if (controls.runtimeMode) {
            VRODOS.editor.envir.scene.aframeRuntimeMode = normalizeRuntimeMode(controls.runtimeMode.value);
        }
        if (controls.hoveringInteractables) {
            VRODOS.editor.envir.scene.aframeHoveringInteractables = Boolean(controls.hoveringInteractables.checked);
        }
        VRodosCompileUI.PostFX.syncToScene(controls);
        
        const selectedPostFxEngine = controls.postFx.checked === true
            ? VRodosCompileUI.PostFX.normalizeEngine(controls.postFxEngine.value)
            : 'legacy';
        VRODOS.editor.envir.scene.aframePostFXEngine = selectedPostFxEngine;
        const edgeAAValue = VRodosCompileUI.General.normalizeEdgeAAStrengthLevel(controls.edgeAAStrength.value);
        VRODOS.editor.envir.scene.aframePostFXEdgeAAEnabled = selectedPostFxEngine !== 'pmndrs' && edgeAAValue > 0;
        VRODOS.editor.envir.scene.aframePostFXEdgeAAStrength = edgeAAValue > 0 ? edgeAAValue : (VRODOS.editor.envir.scene.aframePostFXEdgeAAStrength || 3);

        if (controls.pmndrsAAMode) {
            VRODOS.editor.envir.scene.aframePmndrsAAMode = VRodosCompileUI.PostFX.normalizePmndrsAAMode(controls.pmndrsAAMode.value);
        }
        if (controls.pmndrsAAPreset) {
            VRODOS.editor.envir.scene.aframePmndrsAAPreset = VRodosCompileUI.PostFX.normalizePmndrsAAPreset(controls.pmndrsAAPreset.value);
        }

        // Delegate Atmosphere synchronization to module
        VRodosCompileUI.Atmosphere.syncToScene(controls);
    }

    window.vrodosApplyCompileDialogSettingsToScene = applyCompileDialogSettingsToScene;
    VRODOS.ui.applyCompileDialogSettingsToScene = applyCompileDialogSettingsToScene;
    VRODOS.ui.ensureCompileSceneSettingsDefaults = ensureCompileSceneSettingsDefaults;

    function syncCompileDialogFromSceneSettings() {
        const controls = getCompileDialogElements();

        if (!controls.renderQuality || !controls.shadowQuality || !controls.aaQuality || !controls.ambientOcclusionPreset || !controls.contactShadowPreset || !controls.fpsMeter || !controls.postFx || !controls.postFxColor || !controls.edgeAAStrength || !controls.bloomStrength || !controls.exposurePreset || !controls.contrastPreset || !controls.reflectionProfile || !controls.reflectionSource) {
            return;
        }

        ensureCompileSceneSettingsDefaults();

        controls.renderQuality.value = VRODOS.editor.envir.scene.aframeRenderQuality || 'standard';
        controls.shadowQuality.value = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframeShadowQuality
            ? VRODOS.editor.envir.scene.aframeShadowQuality
            : 'medium';
        controls.aaQuality.value = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframeAAQuality
            ? VRodosCompileUI.General.normalizeAAQuality(VRODOS.editor.envir.scene.aframeAAQuality)
            : 'balanced';
        controls.ambientOcclusionPreset.value = VRODOS.editor.envir && VRODOS.editor.envir.scene
            ? VRodosCompileUI.General.normalizeAmbientOcclusionPreset(VRODOS.editor.envir.scene.aframeAmbientOcclusionPreset)
            : 'balanced';
        controls.contactShadowPreset.value = VRODOS.editor.envir && VRODOS.editor.envir.scene
            ? VRodosCompileUI.General.normalizeContactShadowPreset(VRODOS.editor.envir.scene.aframeContactShadowPreset)
            : 'soft';
        controls.fpsMeter.checked = Boolean(VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframeFPSMeterEnabled);
        if (controls.runtimeMode) {
            controls.runtimeMode.value = normalizeRuntimeMode(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframeRuntimeMode : 'single-player');
        }
        if (controls.hoveringInteractables) {
            controls.hoveringInteractables.checked = !(VRODOS.editor.envir && VRODOS.editor.envir.scene) || VRODOS.editor.envir.scene.aframeHoveringInteractables !== false;
        }
        controls.postFx.checked = Boolean(VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePostFXEnabled);
        if (controls.legacyHorizonStageSize) {
            controls.legacyHorizonStageSize.value = VRodosCompileUI.General.clampLegacyHorizonStageSize(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframeLegacyHorizonStageSize : 5000);
        }
        controls.postFxColor.checked = Boolean(VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePostFXColorEnabled);

        const edgeAAEnabled = !(VRODOS.editor.envir && VRODOS.editor.envir.scene) || VRODOS.editor.envir.scene.aframePostFXEdgeAAEnabled !== false;
        const edgeAAStrength = VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePostFXEdgeAAStrength : 3;
        controls.edgeAAStrength.value = edgeAAEnabled ? VRodosCompileUI.General.normalizeEdgeAAStrengthLevel(edgeAAStrength) : 0;

        controls.bloomStrength.value = VRODOS.editor.envir && VRODOS.editor.envir.scene
            ? VRodosCompileUI.PostFX.normalizeBloomStrength(VRODOS.editor.envir.scene.aframeBloomStrength)
            : 'off';
        controls.exposurePreset.value = VRODOS.editor.envir && VRODOS.editor.envir.scene
            ? VRodosCompileUI.PostFX.normalizeExposurePreset(VRODOS.editor.envir.scene.aframeExposurePreset)
            : 'neutral';
        controls.contrastPreset.value = VRODOS.editor.envir && VRODOS.editor.envir.scene
            ? VRodosCompileUI.PostFX.normalizeContrastPreset(VRODOS.editor.envir.scene.aframeContrastPreset)
            : 'balanced';
        if (controls.reflectionsEnabled) {
            controls.reflectionsEnabled.checked = !(VRODOS.editor.envir && VRODOS.editor.envir.scene) ||
                VRODOS.editor.envir.scene.aframeReflectionsEnabled !== false;
        }
        controls.reflectionProfile.value = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframeReflectionProfile
            ? VRodosCompileUI.PostFX.normalizeReflectionProfile(VRODOS.editor.envir.scene.aframeReflectionProfile)
            : 'balanced';
        controls.reflectionSource.value = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframeReflectionSource
            ? VRodosCompileUI.PostFX.normalizeReflectionSource(VRODOS.editor.envir.scene.aframeReflectionSource)
            : 'hdr';
        if (controls.sceneProbeUpdateMode) {
            controls.sceneProbeUpdateMode.value = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframeSceneProbeUpdateMode
                ? VRodosCompileUI.PostFX.normalizeSceneProbeUpdateMode(VRODOS.editor.envir.scene.aframeSceneProbeUpdateMode)
                : Shared.SCENE_PROBE_DEFAULTS.updateMode;
        }
        if (controls.sceneProbeResolution) {
            controls.sceneProbeResolution.value = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframeSceneProbeResolution
                ? VRodosCompileUI.PostFX.normalizeSceneProbeResolution(VRODOS.editor.envir.scene.aframeSceneProbeResolution)
                : Shared.SCENE_PROBE_DEFAULTS.resolution;
        }
        if (controls.envMapPreset) {
            controls.envMapPreset.value = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframeEnvMapPreset
                ? VRodosCompileUI.PostFX.normalizeEnvMapPreset(VRODOS.editor.envir.scene.aframeEnvMapPreset)
                : 'none';
        }
        if (controls.ssrStrength) {
            controls.ssrStrength.value = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePostFXSSRStrength
                ? VRodosCompileUI.PostFX.normalizeSSRStrength(VRODOS.editor.envir.scene.aframePostFXSSRStrength)
                : 'off';
        }
        if (controls.taaEnabled) {
            controls.taaEnabled.checked = Boolean(VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePostFXTAAEnabled);
        }
        if (controls.postFxEngine) {
            controls.postFxEngine.value = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePostFXEngine
                ? VRodosCompileUI.PostFX.normalizeEngine(VRODOS.editor.envir.scene.aframePostFXEngine)
                : 'legacy';
        }
        if (controls.pmndrsAAMode) {
            let pmndrsAAModeValue = VRODOS.editor.envir && VRODOS.editor.envir.scene
                ? VRodosCompileUI.PostFX.normalizePmndrsAAMode(VRODOS.editor.envir.scene.aframePmndrsAAMode)
                : 'inherit';
            if (pmndrsAAModeValue === 'inherit') {
                pmndrsAAModeValue = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRodosCompileUI.PostFX.normalizeEngine(VRODOS.editor.envir.scene.aframePostFXEngine) === 'pmndrs'
                    ? derivePmndrsAAModeFromAAQuality(controls.aaQuality.value)
                    : Shared.PMNDRS_TWEAK_DEFAULTS.aaMode;
            }
            controls.pmndrsAAMode.value = pmndrsAAModeValue;
        }
        if (controls.pmndrsAAPreset) {
            let pmndrsAAPresetValue = VRODOS.editor.envir && VRODOS.editor.envir.scene
                ? VRodosCompileUI.PostFX.normalizePmndrsAAPreset(VRODOS.editor.envir.scene.aframePmndrsAAPreset)
                : 'inherit';
            if (pmndrsAAPresetValue === 'inherit') {
                pmndrsAAPresetValue = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRodosCompileUI.PostFX.normalizeEngine(VRODOS.editor.envir.scene.aframePostFXEngine) === 'pmndrs'
                    ? derivePmndrsAAPresetFromAAQuality(controls.aaQuality.value)
                    : Shared.PMNDRS_TWEAK_DEFAULTS.aaPreset;
            }
            controls.pmndrsAAPreset.value = pmndrsAAPresetValue;
        }

        if (controls.pmndrsBloomIntensity) {
            controls.pmndrsBloomIntensity.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsBloomIntensity : 1.0, 0, 3, 1.0);
        }
        if (controls.pmndrsBloomThreshold) {
            controls.pmndrsBloomThreshold.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsBloomThreshold : 0.62, 0, 1, 0.62);
        }
        if (controls.pmndrsExposure) {
            controls.pmndrsExposure.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsToneMappingExposure : 1.0, 1, 20, 1.0);
        }
        if (controls.pmndrsToneMapping) {
            controls.pmndrsToneMapping.value = VRODOS.editor.envir && VRODOS.editor.envir.scene
                ? VRodosCompileUI.PostFX.normalizePmndrsToneMappingMode(VRODOS.editor.envir.scene.aframePmndrsToneMappingMode)
                : Shared.PMNDRS_TWEAK_DEFAULTS.toneMappingMode;
        }
        if (controls.pmndrsLensFlare) {
            controls.pmndrsLensFlare.checked = Boolean(VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePmndrsLensFlareEnabled);
        }
        if (controls.pmndrsLut) {
            controls.pmndrsLut.checked = Boolean(VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePmndrsLutEnabled);
        }
        if (controls.pmndrsLutLook) {
            controls.pmndrsLutLook.value = VRODOS.editor.envir && VRODOS.editor.envir.scene
                ? VRodosCompileUI.PostFX.normalizePmndrsLutLook(VRODOS.editor.envir.scene.aframePmndrsLutLook)
                : Shared.PMNDRS_TWEAK_DEFAULTS.lutLook;
        }
        if (controls.pmndrsLutStrength) {
            controls.pmndrsLutStrength.value = Shared.clampNumber(
                VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsLutStrength : Shared.PMNDRS_TWEAK_DEFAULTS.lutStrength,
                0,
                1,
                Shared.PMNDRS_TWEAK_DEFAULTS.lutStrength
            );
        }
        if (controls.pmndrsVignetteDarkness) {
            controls.pmndrsVignetteDarkness.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsVignetteDarkness : 0.5, 0, 1, 0.5);
        }
        if (controls.pmndrsNoise) {
            controls.pmndrsNoise.checked = Boolean(VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePmndrsNoiseEnabled);
        }
        if (controls.pmndrsNoiseOpacity) {
            controls.pmndrsNoiseOpacity.value = Shared.clampNumber(
                VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsNoiseOpacity : Shared.PMNDRS_TWEAK_DEFAULTS.noiseOpacity,
                0,
                0.2,
                Shared.PMNDRS_TWEAK_DEFAULTS.noiseOpacity
            );
        }
        if (controls.pmndrsChromaticAberration) {
            controls.pmndrsChromaticAberration.checked = Boolean(VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePmndrsChromaticAberrationEnabled);
        }
        if (controls.pmndrsChromaticAberrationOffset) {
            controls.pmndrsChromaticAberrationOffset.value = Shared.clampNumber(
                VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsChromaticAberrationOffset : Shared.PMNDRS_TWEAK_DEFAULTS.chromaticAberrationOffset,
                0,
                0.006,
                Shared.PMNDRS_TWEAK_DEFAULTS.chromaticAberrationOffset
            );
        }
        if (controls.pmndrsAtmosphere) {
            controls.pmndrsAtmosphere.checked = !(VRODOS.editor.envir && VRODOS.editor.envir.scene) || VRODOS.editor.envir.scene.aframePmndrsAtmosphereEnabled !== false;
        }
        if (controls.pmndrsAtmospherePreset) {
            controls.pmndrsAtmospherePreset.value = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePmndrsAtmospherePreset
                ? VRodosCompileUI.Atmosphere.normalizePreset(VRODOS.editor.envir.scene.aframePmndrsAtmospherePreset)
                : Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset;
        }
        if (controls.pmndrsAtmospherePresetIntensity) {
            controls.pmndrsAtmospherePresetIntensity.value = Shared.clampNumber(
                VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsAtmospherePresetIntensity : Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePresetIntensity,
                0,
                1,
                Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePresetIntensity
            );
        }
        if (controls.pmndrsAtmosphereQuality) {
            controls.pmndrsAtmosphereQuality.value = VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePmndrsAtmosphereQuality
                ? VRodosCompileUI.Atmosphere.normalizeQuality(VRODOS.editor.envir.scene.aframePmndrsAtmosphereQuality)
                : Shared.PMNDRS_TWEAK_DEFAULTS.atmosphereQuality;
        }
        if (controls.pmndrsCelestialMode) {
            controls.pmndrsCelestialMode.value = VRODOS.editor.envir && VRODOS.editor.envir.scene
                ? VRodosCompileUI.Atmosphere.normalizeCelestialMode(VRODOS.editor.envir.scene.aframePmndrsCelestialMode)
                : Shared.PMNDRS_TWEAK_DEFAULTS.celestialMode;
        }
        if (controls.pmndrsCelestialTimePreset) {
            controls.pmndrsCelestialTimePreset.value = VRODOS.editor.envir && VRODOS.editor.envir.scene
                ? VRodosCompileUI.Atmosphere.normalizeCelestialTimePreset(VRODOS.editor.envir.scene.aframePmndrsCelestialTimePreset)
                : Shared.PMNDRS_TWEAK_DEFAULTS.celestialTimePreset;
        }
        if (controls.pmndrsCelestialDate) {
            controls.pmndrsCelestialDate.value = VRODOS.editor.envir && VRODOS.editor.envir.scene
                ? VRodosCompileUI.Atmosphere.normalizeDate(VRODOS.editor.envir.scene.aframePmndrsCelestialDate, Shared.PMNDRS_TWEAK_DEFAULTS.celestialDate)
                : Shared.PMNDRS_TWEAK_DEFAULTS.celestialDate;
        }
        if (controls.pmndrsCelestialUtcTime) {
            controls.pmndrsCelestialUtcTime.value = VRODOS.editor.envir && VRODOS.editor.envir.scene
                ? VRodosCompileUI.Atmosphere.normalizeUtcTime(VRODOS.editor.envir.scene.aframePmndrsCelestialUtcTime, Shared.PMNDRS_TWEAK_DEFAULTS.celestialUtcTime)
                : Shared.PMNDRS_TWEAK_DEFAULTS.celestialUtcTime;
        }
        if (controls.pmndrsGeospatial) {
            controls.pmndrsGeospatial.checked = Boolean(VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePmndrsGeospatialEnabled);
        }
        if (controls.pmndrsAerialPerspective) {
            controls.pmndrsAerialPerspective.checked = Boolean(VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePmndrsAerialPerspectiveEnabled);
        }
        if (controls.pmndrsCorrectAltitude) {
            controls.pmndrsCorrectAltitude.checked = !(VRODOS.editor.envir && VRODOS.editor.envir.scene) || VRODOS.editor.envir.scene.aframePmndrsCorrectAltitudeEnabled !== false;
        }
        if (controls.pmndrsGeospatialLatitude) {
            controls.pmndrsGeospatialLatitude.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsGeospatialLatitudeDeg : Shared.PMNDRS_TWEAK_DEFAULTS.geospatialLatitudeDeg, -90, 90, Shared.PMNDRS_TWEAK_DEFAULTS.geospatialLatitudeDeg);
        }
        if (controls.pmndrsGeospatialLongitude) {
            controls.pmndrsGeospatialLongitude.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsGeospatialLongitudeDeg : Shared.PMNDRS_TWEAK_DEFAULTS.geospatialLongitudeDeg, -180, 180, Shared.PMNDRS_TWEAK_DEFAULTS.geospatialLongitudeDeg);
        }
        if (controls.pmndrsGeospatialAltitude) {
            controls.pmndrsGeospatialAltitude.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsGeospatialAltitudeMeters : Shared.PMNDRS_TWEAK_DEFAULTS.geospatialAltitudeMeters, -500, 20000, Shared.PMNDRS_TWEAK_DEFAULTS.geospatialAltitudeMeters);
        }
        const lightingPresetFallback = Shared.normalizePmndrsHorizonLightingPreset(
            VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframeHorizonSkyPreset : 'natural',
            Shared.PMNDRS_TWEAK_DEFAULTS.horizonLightingPreset
        );
        const resolvedHorizonLightingPreset = Shared.normalizePmndrsHorizonLightingPreset(
            VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsHorizonLightingPreset : lightingPresetFallback,
            lightingPresetFallback
        );
        const helperDefaults = Shared.getPmndrsHorizonHelperDefaults(
            resolvedHorizonLightingPreset === 'custom' ? lightingPresetFallback : resolvedHorizonLightingPreset
        );
        if (controls.pmndrsHorizonLightingPreset) {
            controls.pmndrsHorizonLightingPreset.value = resolvedHorizonLightingPreset;
        }
        const resolvedAtmospherePreset = VRodosCompileUI.Atmosphere.normalizePreset(
            controls.pmndrsAtmospherePreset ? controls.pmndrsAtmospherePreset.value : Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset
        );
        const resolvedCelestialMode = VRodosCompileUI.Atmosphere.normalizeCelestialMode(
            controls.pmndrsCelestialMode ? controls.pmndrsCelestialMode.value : Shared.PMNDRS_TWEAK_DEFAULTS.celestialMode
        );
        if (resolvedCelestialMode === 'preset-time') {
            VRodosCompileUI.Atmosphere.applyCelestialTimePreset(
                controls,
                controls.pmndrsCelestialTimePreset ? controls.pmndrsCelestialTimePreset.value : Shared.PMNDRS_TWEAK_DEFAULTS.celestialTimePreset
            );
        } else if (resolvedCelestialMode !== 'datetime' && resolvedAtmospherePreset !== 'custom') {
            VRodosCompileUI.Atmosphere.applyLookPreset(controls, resolvedAtmospherePreset);
        } else {
            if (controls.pmndrsSunElevation) {
                controls.pmndrsSunElevation.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsSunElevationDeg : Shared.PMNDRS_TWEAK_DEFAULTS.sunElevationDeg, -18, 85, Shared.PMNDRS_TWEAK_DEFAULTS.sunElevationDeg);
            }
            if (controls.pmndrsSunAzimuth) {
                controls.pmndrsSunAzimuth.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsSunAzimuthDeg : Shared.PMNDRS_TWEAK_DEFAULTS.sunAzimuthDeg, -180, 180, Shared.PMNDRS_TWEAK_DEFAULTS.sunAzimuthDeg);
            }
            if (controls.pmndrsSunDistance) {
                controls.pmndrsSunDistance.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsSunDistance : Shared.PMNDRS_TWEAK_DEFAULTS.sunDistance, 1500, 20000, Shared.PMNDRS_TWEAK_DEFAULTS.sunDistance);
            }
            if (controls.pmndrsSunAngularRadius) {
                controls.pmndrsSunAngularRadius.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsSunAngularRadius : Shared.PMNDRS_TWEAK_DEFAULTS.sunAngularRadius, 0.002, 0.03, Shared.PMNDRS_TWEAK_DEFAULTS.sunAngularRadius);
            }
            if (controls.pmndrsAerialStrength) {
                controls.pmndrsAerialStrength.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsAerialStrength : Shared.PMNDRS_TWEAK_DEFAULTS.aerialStrength, 0, 2, Shared.PMNDRS_TWEAK_DEFAULTS.aerialStrength);
            }
            if (controls.pmndrsAlbedoScale) {
                controls.pmndrsAlbedoScale.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsAlbedoScale : Shared.PMNDRS_TWEAK_DEFAULTS.albedoScale, 0, 2, Shared.PMNDRS_TWEAK_DEFAULTS.albedoScale);
            }
            if (controls.pmndrsTransmittance) {
                controls.pmndrsTransmittance.checked = !(VRODOS.editor.envir && VRODOS.editor.envir.scene) || VRODOS.editor.envir.scene.aframePmndrsTransmittanceEnabled !== false;
            }
            if (controls.pmndrsInscatter) {
                controls.pmndrsInscatter.checked = !(VRODOS.editor.envir && VRODOS.editor.envir.scene) || VRODOS.editor.envir.scene.aframePmndrsInscatterEnabled !== false;
            }
            if (controls.pmndrsGround) {
                controls.pmndrsGround.checked = !(VRODOS.editor.envir && VRODOS.editor.envir.scene) || VRODOS.editor.envir.scene.aframePmndrsGroundEnabled !== false;
            }
            if (controls.pmndrsGroundAlbedo) {
                controls.pmndrsGroundAlbedo.value = Shared.normalizeColorHex(
                    VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsGroundAlbedo : Shared.PMNDRS_TWEAK_DEFAULTS.groundAlbedo,
                    Shared.PMNDRS_TWEAK_DEFAULTS.groundAlbedo
                );
            }
            if (controls.pmndrsRayleighScale) {
                controls.pmndrsRayleighScale.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsRayleighScale : Shared.PMNDRS_TWEAK_DEFAULTS.rayleighScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.rayleighScale);
            }
            if (controls.pmndrsMieScatteringScale) {
                controls.pmndrsMieScatteringScale.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsMieScatteringScale : Shared.PMNDRS_TWEAK_DEFAULTS.mieScatteringScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.mieScatteringScale);
            }
            if (controls.pmndrsMieExtinctionScale) {
                controls.pmndrsMieExtinctionScale.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsMieExtinctionScale : Shared.PMNDRS_TWEAK_DEFAULTS.mieExtinctionScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.mieExtinctionScale);
            }
            if (controls.pmndrsMiePhaseG) {
                controls.pmndrsMiePhaseG.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsMiePhaseG : Shared.PMNDRS_TWEAK_DEFAULTS.miePhaseG, 0, 0.99, Shared.PMNDRS_TWEAK_DEFAULTS.miePhaseG);
            }
            if (controls.pmndrsAbsorptionScale) {
                controls.pmndrsAbsorptionScale.value = Shared.clampNumber(VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsAbsorptionScale : Shared.PMNDRS_TWEAK_DEFAULTS.absorptionScale, 0.1, 3, Shared.PMNDRS_TWEAK_DEFAULTS.absorptionScale);
            }
            if (controls.pmndrsMoon) {
                controls.pmndrsMoon.checked = Boolean(VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePmndrsMoonEnabled);
            }
        }
        if (resolvedCelestialMode === 'datetime' && controls.pmndrsMoon) {
            controls.pmndrsMoon.checked = Boolean(VRODOS.editor.envir && VRODOS.editor.envir.scene && VRODOS.editor.envir.scene.aframePmndrsMoonEnabled);
        }
        if (controls.pmndrsHorizonKeyLightIntensity) {
            controls.pmndrsHorizonKeyLightIntensity.value = Shared.clampNumber(
                VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsHorizonKeyLightIntensity : helperDefaults.keyLightIntensity,
                0,
                3,
                helperDefaults.keyLightIntensity
            );
        }
        if (controls.pmndrsHorizonFillLightIntensity) {
            controls.pmndrsHorizonFillLightIntensity.value = Shared.clampNumber(
                VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframePmndrsHorizonFillLightIntensity : helperDefaults.fillLightIntensity,
                0,
                3,
                helperDefaults.fillLightIntensity
            );
        }
        updatePmndrsValueLabels();

        syncCompilePostFxState();
    }

    window.syncCompileDialogFromSceneSettings = syncCompileDialogFromSceneSettings;
    VRODOS.ui.syncCompileDialogFromSceneSettings = syncCompileDialogFromSceneSettings;

    const controls = getCompileDialogElements();
    if (controls.renderQuality) {
        controls.renderQuality.addEventListener('change', () => {
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
    if (controls.runtimeMode) {
        controls.runtimeMode.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.hoveringInteractables) {
        controls.hoveringInteractables.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.legacyHorizonStageSize) {
        controls.legacyHorizonStageSize.addEventListener('input', updatePmndrsValueLabels);
        controls.legacyHorizonStageSize.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.postFx) {
        controls.postFx.addEventListener('change', () => {
            syncCompilePostFxState();
        });
    }
    if (controls.postFxColor) {
        controls.postFxColor.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.edgeAAStrength) {
        controls.edgeAAStrength.addEventListener('input', () => {
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
    if (controls.reflectionsEnabled) {
        controls.reflectionsEnabled.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.reflectionSource) {
        controls.reflectionSource.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.sceneProbeUpdateMode) {
        controls.sceneProbeUpdateMode.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.sceneProbeResolution) {
        controls.sceneProbeResolution.addEventListener('change', syncCompilePostFxState);
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
    if (controls.pmndrsToneMapping) {
        controls.pmndrsToneMapping.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsLensFlare) {
        controls.pmndrsLensFlare.addEventListener('change', syncCompilePostFxState);
    }
    // Tab strip — clicking a tab writes the engine value into the hidden input
    // and re-runs the show/hide gating. Disabled tabs (when postFx is off) are no-ops.
    function bindEngineTab(tabEl) {
        if (!tabEl) return;
        tabEl.addEventListener('click', (e) => {
            e.preventDefault();
            if (tabEl.disabled) return;
            const engine = tabEl.getAttribute('data-engine') === 'pmndrs' ? 'pmndrs' : 'legacy';
            if (controls.postFxEngine) {
                controls.postFxEngine.value = engine;
            }
            syncCompilePostFxState();
        });
    }
    bindEngineTab(controls.postFxEngineTabLegacy);
    bindEngineTab(controls.postFxEngineTabPmndrs);
    [controls.pmndrsBloomIntensity, controls.pmndrsBloomThreshold, controls.pmndrsExposure, controls.pmndrsLutStrength, controls.pmndrsVignetteDarkness, controls.pmndrsNoiseOpacity, controls.pmndrsChromaticAberrationOffset, controls.pmndrsAtmospherePresetIntensity].forEach((el) => {
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
    ].forEach((el) => {
        if (el) {
            el.addEventListener('input', () => {
                updatePmndrsValueLabels();
                VRodosCompileUI.Atmosphere.markCustom(controls);
            });
        }
    });
    [
        controls.pmndrsHorizonKeyLightIntensity,
        controls.pmndrsHorizonFillLightIntensity
    ].forEach((el) => {
        if (el) {
            el.addEventListener('input', () => {
                updatePmndrsValueLabels();
                VRodosCompileUI.Atmosphere.markHorizonLightingCustom(controls);
            });
            el.addEventListener('change', syncCompilePostFxState);
        }
    });
    if (controls.pmndrsHorizonLightingPreset) {
        controls.pmndrsHorizonLightingPreset.addEventListener('change', () => {
            const fallbackPreset = Shared.normalizePmndrsHorizonLightingPreset(
                VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframeHorizonSkyPreset : 'natural',
                Shared.PMNDRS_TWEAK_DEFAULTS.horizonLightingPreset
            );
            const preset = Shared.normalizePmndrsHorizonLightingPreset(controls.pmndrsHorizonLightingPreset.value, fallbackPreset);
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
    ].forEach((el) => {
        if (el) {
            el.addEventListener('change', () => {
                const presetTimeMoonOverride = el === controls.pmndrsMoon &&
                    ['preset-time', 'datetime'].indexOf(VRodosCompileUI.Atmosphere.normalizeCelestialMode(controls.pmndrsCelestialMode ? controls.pmndrsCelestialMode.value : Shared.PMNDRS_TWEAK_DEFAULTS.celestialMode)) !== -1;
                if (!presetTimeMoonOverride) {
                    VRodosCompileUI.Atmosphere.markCustom(controls);
                }
                updatePmndrsValueLabels();
                syncCompilePostFxState();
            });
        }
    });
    if (controls.pmndrsVignette) {
        controls.pmndrsVignette.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsLut) {
        controls.pmndrsLut.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsLutLook) {
        controls.pmndrsLutLook.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsNoise) {
        controls.pmndrsNoise.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsChromaticAberration) {
        controls.pmndrsChromaticAberration.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsAtmosphere) {
        controls.pmndrsAtmosphere.addEventListener('change', syncCompilePostFxState);
    }
    if (controls.pmndrsCelestialMode) {
        controls.pmndrsCelestialMode.addEventListener('change', () => {
            const mode = VRodosCompileUI.Atmosphere.normalizeCelestialMode(controls.pmndrsCelestialMode.value);
            controls.pmndrsCelestialMode.value = mode;
            if (mode === 'preset-time') {
                const skyTimePreset = VRodosCompileUI.Atmosphere.normalizePreset(controls.pmndrsAtmospherePreset ? controls.pmndrsAtmospherePreset.value : Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset);
                if (skyTimePreset !== 'custom') {
                    VRodosCompileUI.Atmosphere.applyLookPreset(controls, skyTimePreset);
                } else {
                    VRodosCompileUI.Atmosphere.applyCelestialTimePreset(
                        controls,
                        controls.pmndrsCelestialTimePreset ? controls.pmndrsCelestialTimePreset.value : Shared.PMNDRS_TWEAK_DEFAULTS.celestialTimePreset
                    );
                }
            } else if (mode === 'manual') {
                VRodosCompileUI.Atmosphere.markCustom(controls);
            }
            updatePmndrsValueLabels();
            syncCompilePostFxState();
            VRodosCompileUI.Atmosphere.syncToScene(controls);
        });
    }
    if (controls.pmndrsCelestialTimePreset) {
        controls.pmndrsCelestialTimePreset.addEventListener('change', () => {
            if (controls.pmndrsCelestialMode) {
                controls.pmndrsCelestialMode.value = 'preset-time';
            }
            VRodosCompileUI.Atmosphere.applyCelestialTimePreset(controls, controls.pmndrsCelestialTimePreset.value);
            updatePmndrsValueLabels();
            syncCompilePostFxState();
            VRodosCompileUI.Atmosphere.syncToScene(controls);
        });
    }
    [controls.pmndrsCelestialDate, controls.pmndrsCelestialUtcTime].forEach((el) => {
        if (el) {
            el.addEventListener('change', () => {
                if (controls.pmndrsCelestialMode) {
                    controls.pmndrsCelestialMode.value = 'datetime';
                }
                syncCompilePostFxState();
                VRodosCompileUI.Atmosphere.syncToScene(controls);
            });
        }
    });
    [
        controls.pmndrsGeospatial,
        controls.pmndrsCorrectAltitude,
        controls.pmndrsAerialPerspective,
        controls.pmndrsGeospatialLatitude,
        controls.pmndrsGeospatialLongitude,
        controls.pmndrsGeospatialAltitude
    ].forEach((el) => {
        if (el) {
            el.addEventListener('change', () => {
                syncCompilePostFxState();
                VRodosCompileUI.Atmosphere.syncToScene(controls);
            });
        }
    });
    if (controls.pmndrsAtmospherePreset) {
        controls.pmndrsAtmospherePreset.addEventListener('change', () => {
            const preset = VRodosCompileUI.Atmosphere.normalizePreset(controls.pmndrsAtmospherePreset.value);
            if (preset !== 'custom') {
                VRodosCompileUI.Atmosphere.applyLookPreset(controls, preset);
            } else if (controls.pmndrsCelestialMode) {
                controls.pmndrsCelestialMode.value = 'manual';
            }
            updatePmndrsValueLabels();
            syncCompilePostFxState();
            VRodosCompileUI.Atmosphere.syncToScene(controls);
        });
    }
    if (controls.pmndrsAtmospherePresetIntensity) {
        controls.pmndrsAtmospherePresetIntensity.addEventListener('input', () => {
            const celestialMode = VRodosCompileUI.Atmosphere.normalizeCelestialMode(controls.pmndrsCelestialMode ? controls.pmndrsCelestialMode.value : Shared.PMNDRS_TWEAK_DEFAULTS.celestialMode);
            const preset = celestialMode === 'preset-time'
                ? VRodosCompileUI.Atmosphere.normalizeCelestialTimePreset(controls.pmndrsCelestialTimePreset ? controls.pmndrsCelestialTimePreset.value : Shared.PMNDRS_TWEAK_DEFAULTS.celestialTimePreset)
                : VRodosCompileUI.Atmosphere.normalizePreset(controls.pmndrsAtmospherePreset ? controls.pmndrsAtmospherePreset.value : Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset);
            if (celestialMode === 'preset-time') {
                VRodosCompileUI.Atmosphere.applyCelestialTimePreset(controls, preset);
            } else if (celestialMode !== 'datetime' && preset !== 'custom') {
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
        controls.pmndrsResetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const c = getCompileDialogElements();
            if (c.pmndrsAAMode) c.pmndrsAAMode.value = Shared.PMNDRS_TWEAK_DEFAULTS.aaMode;
            if (c.pmndrsAAPreset) c.pmndrsAAPreset.value = Shared.PMNDRS_TWEAK_DEFAULTS.aaPreset;
            if (c.pmndrsBloomIntensity) c.pmndrsBloomIntensity.value = Shared.PMNDRS_TWEAK_DEFAULTS.bloomIntensity;
            if (c.pmndrsBloomThreshold) c.pmndrsBloomThreshold.value = Shared.PMNDRS_TWEAK_DEFAULTS.bloomThreshold;
            if (c.pmndrsExposure) c.pmndrsExposure.value = Shared.PMNDRS_TWEAK_DEFAULTS.toneMappingExposure;
            if (c.pmndrsToneMapping) c.pmndrsToneMapping.value = Shared.PMNDRS_TWEAK_DEFAULTS.toneMappingMode;
            if (c.pmndrsLensFlare) c.pmndrsLensFlare.checked = Shared.PMNDRS_TWEAK_DEFAULTS.lensFlareEnabled;
            if (c.pmndrsLut) c.pmndrsLut.checked = Shared.PMNDRS_TWEAK_DEFAULTS.lutEnabled;
            if (c.pmndrsLutLook) c.pmndrsLutLook.value = Shared.PMNDRS_TWEAK_DEFAULTS.lutLook;
            if (c.pmndrsLutStrength) c.pmndrsLutStrength.value = Shared.PMNDRS_TWEAK_DEFAULTS.lutStrength;
            if (c.pmndrsVignette) c.pmndrsVignette.checked = Shared.PMNDRS_TWEAK_DEFAULTS.vignetteEnabled;
            if (c.pmndrsVignetteDarkness) c.pmndrsVignetteDarkness.value = Shared.PMNDRS_TWEAK_DEFAULTS.vignetteDarkness;
            if (c.pmndrsNoise) c.pmndrsNoise.checked = Shared.PMNDRS_TWEAK_DEFAULTS.noiseEnabled;
            if (c.pmndrsNoiseOpacity) c.pmndrsNoiseOpacity.value = Shared.PMNDRS_TWEAK_DEFAULTS.noiseOpacity;
            if (c.pmndrsChromaticAberration) c.pmndrsChromaticAberration.checked = Shared.PMNDRS_TWEAK_DEFAULTS.chromaticAberrationEnabled;
            if (c.pmndrsChromaticAberrationOffset) c.pmndrsChromaticAberrationOffset.value = Shared.PMNDRS_TWEAK_DEFAULTS.chromaticAberrationOffset;
            if (c.pmndrsAtmosphere) c.pmndrsAtmosphere.checked = Shared.PMNDRS_TWEAK_DEFAULTS.atmosphereEnabled;
            if (c.pmndrsAtmospherePreset) c.pmndrsAtmospherePreset.value = Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset;
            if (c.pmndrsAtmospherePresetIntensity) c.pmndrsAtmospherePresetIntensity.value = Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePresetIntensity;
            if (c.pmndrsAtmosphereQuality) c.pmndrsAtmosphereQuality.value = Shared.PMNDRS_TWEAK_DEFAULTS.atmosphereQuality;
            if (c.pmndrsCelestialMode) c.pmndrsCelestialMode.value = Shared.PMNDRS_TWEAK_DEFAULTS.celestialMode;
            if (c.pmndrsCelestialTimePreset) c.pmndrsCelestialTimePreset.value = Shared.PMNDRS_TWEAK_DEFAULTS.celestialTimePreset;
            if (c.pmndrsCelestialDate) c.pmndrsCelestialDate.value = Shared.PMNDRS_TWEAK_DEFAULTS.celestialDate;
            if (c.pmndrsCelestialUtcTime) c.pmndrsCelestialUtcTime.value = Shared.PMNDRS_TWEAK_DEFAULTS.celestialUtcTime;
            if (c.pmndrsGeospatial) c.pmndrsGeospatial.checked = Shared.PMNDRS_TWEAK_DEFAULTS.geospatialEnabled;
            if (c.pmndrsAerialPerspective) c.pmndrsAerialPerspective.checked = Shared.PMNDRS_TWEAK_DEFAULTS.aerialPerspectiveEnabled;
            if (c.pmndrsCorrectAltitude) c.pmndrsCorrectAltitude.checked = Shared.PMNDRS_TWEAK_DEFAULTS.correctAltitudeEnabled;
            if (c.pmndrsGeospatialLatitude) c.pmndrsGeospatialLatitude.value = Shared.PMNDRS_TWEAK_DEFAULTS.geospatialLatitudeDeg;
            if (c.pmndrsGeospatialLongitude) c.pmndrsGeospatialLongitude.value = Shared.PMNDRS_TWEAK_DEFAULTS.geospatialLongitudeDeg;
            if (c.pmndrsGeospatialAltitude) c.pmndrsGeospatialAltitude.value = Shared.PMNDRS_TWEAK_DEFAULTS.geospatialAltitudeMeters;
            const lightingPresetFallback = Shared.normalizePmndrsHorizonLightingPreset(
                VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframeHorizonSkyPreset : 'natural',
                Shared.PMNDRS_TWEAK_DEFAULTS.horizonLightingPreset
            );
            if (c.pmndrsHorizonLightingPreset) c.pmndrsHorizonLightingPreset.value = lightingPresetFallback;
            const helperDefaults = Shared.getPmndrsHorizonHelperDefaults(lightingPresetFallback);
            if (c.pmndrsHorizonKeyLightIntensity) c.pmndrsHorizonKeyLightIntensity.value = helperDefaults.keyLightIntensity;
            if (c.pmndrsHorizonFillLightIntensity) c.pmndrsHorizonFillLightIntensity.value = helperDefaults.fillLightIntensity;
            VRodosCompileUI.Atmosphere.applyLookPreset(c, Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset);
            updatePmndrsValueLabels();
            syncCompilePostFxState();
        });
    }

    // Initial synchronization moved to vrodos_editor_initializer.js to ensure environment is ready

});
