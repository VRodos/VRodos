/**
 * VRodos Scene Settings Schema
 * This file acts as the single source of truth for all scene metadata keys.
 * It is used by the Exporter, Importer, and Loader to process settings uniformly.
 */

const VRODOSSceneSettingsContract = window.VRODOS_RUNTIME_SETTINGS_CONTRACT || { sceneSettings: {} };

function vrodosEditorSceneSettingDefault(sceneSettingKey, fallback, defaultKey) {
    const setting = VRODOSSceneSettingsContract.sceneSettings && VRODOSSceneSettingsContract.sceneSettings[sceneSettingKey];
    const keyName = defaultKey || 'default';
    if (!setting) return fallback;
    if (setting[keyName] !== undefined) return setting[keyName];
    if (setting.default !== undefined) return setting.default;
    return fallback;
}

VRODOS.config.SCENE_SETTINGS_SCHEMA = {
    // General Environment
    'ClearColor': { type: 'color', default: '#000000', envirKey: 'background' },
    'backgroundStyleOption': { type: 'number', default: 0, envirKey: 'backgroundStyleOption' },
    'backgroundImagePath': { type: 'string', default: '0', envirKey: 'img_bcg_path' },
    'backgroundPresetOption': { type: 'string', default: 'None', envirKey: 'backgroundPresetOption' },
    'backgroundPresetGroundEnabled': { type: 'boolean', default: true, envirKey: 'backgroundPresetGroundEnabled' },

    // Fog
    'fogCategory': { type: 'number', default: 0, envirKey: 'fogCategory' },
    'fogtype': { type: 'string', default: 'none', envirKey: 'fogtype' },
    'fogcolor': { type: 'color', default: '#FFFFFF', envirKey: 'fogcolor' },
    'fogfar': { type: 'number', default: 1000, envirKey: 'fogfar' },
    'fognear': { type: 'number', default: 0, envirKey: 'fognear' },
    'fogdensity': { type: 'number', default: 0.00000001, envirKey: 'fogdensity' },

    // Simulation & Physics
    'disableMovement': { type: 'boolean', default: false, envirKey: 'disableMovement' },
    'enableAvatar': { type: 'boolean', default: false, envirKey: 'enableAvatar' },
    'enableGeneralChat': { type: 'boolean', default: false, envirKey: 'enableGeneralChat' },
    'aframeCollisionMode': { type: 'string', default: 'auto', envirKey: 'aframeCollisionMode' },
    'aframeFPSMeterEnabled': { type: 'boolean', default: false, envirKey: 'aframeFPSMeterEnabled' },
    'aframeHoveringInteractables': { type: 'boolean', default: true, envirKey: 'aframeHoveringInteractables' },
    'aframeLegacyHorizonStageSize': { type: 'number', default: 5000, envirKey: 'aframeLegacyHorizonStageSize' },

    // Rendering Quality
    'aframeRenderQuality': { type: 'string', default: 'standard', envirKey: 'aframeRenderQuality' },
    'aframeShadowQuality': { type: 'string', default: 'medium', envirKey: 'aframeShadowQuality' },
    'aframeAAQuality': { type: 'string', default: 'balanced', envirKey: 'aframeAAQuality' },
    'aframeAmbientOcclusionPreset': { type: 'string', default: 'balanced', envirKey: 'aframeAmbientOcclusionPreset' },
    'aframeContactShadowPreset': { type: 'string', default: 'soft', envirKey: 'aframeContactShadowPreset' },
    'aframeReflectionsEnabled': { type: 'boolean', default: true, envirKey: 'aframeReflectionsEnabled' },
    'aframeReflectionProfile': { type: 'string', default: 'balanced', envirKey: 'aframeReflectionProfile' },
    'aframeReflectionSource': { type: 'string', default: 'hdr', envirKey: 'aframeReflectionSource' },
    'aframeReflectionOcclusionMode': { type: 'string', default: 'auto', envirKey: 'aframeReflectionOcclusionMode' },
    'aframeEnvMapPreset': { type: 'string', default: 'none', envirKey: 'aframeEnvMapPreset' },
    'aframeHorizonSkyPreset': { type: 'string', default: 'natural', envirKey: 'aframeHorizonSkyPreset' },

    // Post-Processing
    'aframePostFXEnabled': { type: 'boolean', default: false, envirKey: 'aframePostFXEnabled' },
    'aframePostFXEngine': { type: 'string', default: 'legacy', envirKey: 'aframePostFXEngine' },
    'aframePostFXColorEnabled': { type: 'boolean', default: true, envirKey: 'aframePostFXColorEnabled' },
    'aframePostFXBloomEnabled': { type: 'boolean', default: false, envirKey: 'aframePostFXBloomEnabled' },
    'aframePostFXVignetteEnabled': { type: 'boolean', default: false, envirKey: 'aframePostFXVignetteEnabled' },
    'aframePostFXEdgeAAEnabled': { type: 'boolean', default: true, envirKey: 'aframePostFXEdgeAAEnabled' },
    'aframePostFXEdgeAAStrength': { type: 'number', default: 3, envirKey: 'aframePostFXEdgeAAStrength' },
    'aframePostFXTAAEnabled': { type: 'boolean', default: false, envirKey: 'aframePostFXTAAEnabled' },
    'aframePostFXSSREnabled': { type: 'boolean', default: false, envirKey: 'aframePostFXSSREnabled' },
    'aframePostFXSSRStrength': { type: 'string', default: 'off', envirKey: 'aframePostFXSSRStrength' },
    'aframeBloomStrength': { type: 'string', default: 'off', envirKey: 'aframeBloomStrength' },
    'aframeExposurePreset': { type: 'string', default: 'neutral', envirKey: 'aframeExposurePreset' },
    'aframeContrastPreset': { type: 'string', default: 'balanced', envirKey: 'aframeContrastPreset' },

    // PMNDRS-specific
    'aframePmndrsAAMode': { type: 'string', default: vrodosEditorSceneSettingDefault('pmndrsAAMode', 'inherit'), envirKey: 'aframePmndrsAAMode' },
    'aframePmndrsAAPreset': { type: 'string', default: vrodosEditorSceneSettingDefault('pmndrsAAPreset', 'low'), envirKey: 'aframePmndrsAAPreset' },
    'aframePmndrsBloomIntensity': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsBloomIntensity', 1.0), envirKey: 'aframePmndrsBloomIntensity' },
    'aframePmndrsBloomThreshold': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsBloomThreshold', 0.62), envirKey: 'aframePmndrsBloomThreshold' },
    'aframePmndrsVignetteEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsVignetteEnabled', false), envirKey: 'aframePmndrsVignetteEnabled' },
    'aframePmndrsVignetteDarkness': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsVignetteDarkness', 0.5), envirKey: 'aframePmndrsVignetteDarkness' },
    'aframePmndrsToneMappingExposure': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsToneMappingExposure', 1.0), envirKey: 'aframePmndrsToneMappingExposure' },
    'aframePmndrsToneMappingMode': { type: 'string', default: vrodosEditorSceneSettingDefault('pmndrsToneMappingMode', 'agx'), envirKey: 'aframePmndrsToneMappingMode' },
    'aframePmndrsLensFlareEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsLensFlareEnabled', false), envirKey: 'aframePmndrsLensFlareEnabled' },
    'aframePmndrsLutEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsLutEnabled', false), envirKey: 'aframePmndrsLutEnabled' },
    'aframePmndrsLutLook': { type: 'string', default: vrodosEditorSceneSettingDefault('pmndrsLutLook', 'neutral'), envirKey: 'aframePmndrsLutLook' },
    'aframePmndrsLutStrength': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsLutStrength', 1.0), envirKey: 'aframePmndrsLutStrength' },
    'aframePmndrsNoiseEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsNoiseEnabled', false), envirKey: 'aframePmndrsNoiseEnabled' },
    'aframePmndrsNoiseOpacity': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsNoiseOpacity', 0.04), envirKey: 'aframePmndrsNoiseOpacity' },
    'aframePmndrsChromaticAberrationEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsChromaticAberrationEnabled', false), envirKey: 'aframePmndrsChromaticAberrationEnabled' },
    'aframePmndrsChromaticAberrationOffset': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsChromaticAberrationOffset', 0.0015), envirKey: 'aframePmndrsChromaticAberrationOffset' },

    // Takram Atmosphere (PMNDRS)
    'aframePmndrsAtmosphereEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsAtmosphereEnabled', true), envirKey: 'aframePmndrsAtmosphereEnabled' },
    'aframePmndrsAtmospherePreset': { type: 'string', default: vrodosEditorSceneSettingDefault('pmndrsAtmospherePreset', 'midday'), envirKey: 'aframePmndrsAtmospherePreset' },
    'aframePmndrsAtmospherePresetIntensity': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsAtmospherePresetIntensity', 1.0), envirKey: 'aframePmndrsAtmospherePresetIntensity' },
    'aframePmndrsAtmosphereQuality': { type: 'string', default: vrodosEditorSceneSettingDefault('pmndrsAtmosphereQuality', 'balanced'), envirKey: 'aframePmndrsAtmosphereQuality' },
    'aframePmndrsAerialPerspectiveEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsAerialPerspectiveEnabled', false), envirKey: 'aframePmndrsAerialPerspectiveEnabled' },
    'aframePmndrsCorrectAltitudeEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsCorrectAltitudeEnabled', true), envirKey: 'aframePmndrsCorrectAltitudeEnabled' },
    'aframePmndrsGeospatialEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsGeospatialEnabled', false), envirKey: 'aframePmndrsGeospatialEnabled' },
    'aframePmndrsGeospatialLatitudeDeg': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsGeospatialLatitudeDeg', 0), envirKey: 'aframePmndrsGeospatialLatitudeDeg' },
    'aframePmndrsGeospatialLongitudeDeg': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsGeospatialLongitudeDeg', 0), envirKey: 'aframePmndrsGeospatialLongitudeDeg' },
    'aframePmndrsGeospatialAltitudeMeters': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsGeospatialAltitudeMeters', 0), envirKey: 'aframePmndrsGeospatialAltitudeMeters' },
    'aframePmndrsCelestialMode': { type: 'string', default: vrodosEditorSceneSettingDefault('pmndrsCelestialMode', 'manual'), envirKey: 'aframePmndrsCelestialMode' },
    'aframePmndrsCelestialTimePreset': { type: 'string', default: vrodosEditorSceneSettingDefault('pmndrsCelestialTimePreset', 'midday'), envirKey: 'aframePmndrsCelestialTimePreset' },
    'aframePmndrsCelestialDate': { type: 'string', default: vrodosEditorSceneSettingDefault('pmndrsCelestialDate', '2026-06-21'), envirKey: 'aframePmndrsCelestialDate' },
    'aframePmndrsCelestialUtcTime': { type: 'string', default: vrodosEditorSceneSettingDefault('pmndrsCelestialUtcTime', '12:00'), envirKey: 'aframePmndrsCelestialUtcTime' },
    'aframePmndrsSunElevationDeg': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsSunElevationDeg', 62), envirKey: 'aframePmndrsSunElevationDeg' },
    'aframePmndrsSunAzimuthDeg': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsSunAzimuthDeg', 20), envirKey: 'aframePmndrsSunAzimuthDeg' },
    'aframePmndrsSunDistance': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsSunDistance', 5200), envirKey: 'aframePmndrsSunDistance' },
    'aframePmndrsSunAngularRadius': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsSunAngularRadius', 0.0047), envirKey: 'aframePmndrsSunAngularRadius' },
    'aframePmndrsAerialStrength': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsAerialStrength', 0.55), envirKey: 'aframePmndrsAerialStrength' },
    'aframePmndrsAlbedoScale': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsAlbedoScale', 1.0), envirKey: 'aframePmndrsAlbedoScale' },
    'aframePmndrsTransmittanceEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsTransmittanceEnabled', true), envirKey: 'aframePmndrsTransmittanceEnabled' },
    'aframePmndrsInscatterEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsInscatterEnabled', true), envirKey: 'aframePmndrsInscatterEnabled' },
    'aframePmndrsGroundEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsGroundEnabled', true), envirKey: 'aframePmndrsGroundEnabled' },
    'aframePmndrsGroundAlbedo': { type: 'color', default: vrodosEditorSceneSettingDefault('pmndrsGroundAlbedo', '#d8d8d0'), envirKey: 'aframePmndrsGroundAlbedo' },
    'aframePmndrsRayleighScale': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsRayleighScale', 1.18), envirKey: 'aframePmndrsRayleighScale' },
    'aframePmndrsMieScatteringScale': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsMieScatteringScale', 0.42), envirKey: 'aframePmndrsMieScatteringScale' },
    'aframePmndrsMieExtinctionScale': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsMieExtinctionScale', 0.56), envirKey: 'aframePmndrsMieExtinctionScale' },
    'aframePmndrsMiePhaseG': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsMiePhaseG', 0.74), envirKey: 'aframePmndrsMiePhaseG' },
    'aframePmndrsAbsorptionScale': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsAbsorptionScale', 0.94), envirKey: 'aframePmndrsAbsorptionScale' },
    'aframePmndrsMoonEnabled': { type: 'boolean', default: vrodosEditorSceneSettingDefault('pmndrsMoonEnabled', false), envirKey: 'aframePmndrsMoonEnabled' },
    'aframePmndrsHorizonLightingPreset': { type: 'string', default: vrodosEditorSceneSettingDefault('pmndrsHorizonLightingPreset', 'natural'), envirKey: 'aframePmndrsHorizonLightingPreset' },
    'aframePmndrsHorizonKeyLightIntensity': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsHorizonKeyLightIntensity', 1.15), envirKey: 'aframePmndrsHorizonKeyLightIntensity' },
    'aframePmndrsHorizonFillLightIntensity': { type: 'number', default: vrodosEditorSceneSettingDefault('pmndrsHorizonFillLightIntensity', 0.45), envirKey: 'aframePmndrsHorizonFillLightIntensity' },
};
VRODOS.sceneSettings = VRODOS.sceneSettings || {};
VRODOS.sceneSettings.schema = VRODOS.config.SCENE_SETTINGS_SCHEMA;

