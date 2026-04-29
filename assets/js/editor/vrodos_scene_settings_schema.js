/**
 * VRodos Scene Settings Schema
 * This file acts as the single source of truth for all scene metadata keys.
 * It is used by the Exporter, Importer, and Loader to process settings uniformly.
 */

const VRODOS_SCENE_SETTINGS_SCHEMA = {
    // General Environment
    'ClearColor': { type: 'color', default: '#000000', envirKey: 'background' }, // envirKey background is handled specially in exporter
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
    'aframeReflectionProfile': { type: 'string', default: 'balanced', envirKey: 'aframeReflectionProfile' },
    'aframeReflectionSource': { type: 'string', default: 'hdr', envirKey: 'aframeReflectionSource' },
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
    'aframePmndrsAAMode': { type: 'string', default: 'inherit', envirKey: 'aframePmndrsAAMode' },
    'aframePmndrsAAPreset': { type: 'string', default: 'low', envirKey: 'aframePmndrsAAPreset' },
    'aframePmndrsBloomIntensity': { type: 'number', default: 1.0, envirKey: 'aframePmndrsBloomIntensity' },
    'aframePmndrsBloomThreshold': { type: 'number', default: 0.62, envirKey: 'aframePmndrsBloomThreshold' },
    'aframePmndrsVignetteEnabled': { type: 'boolean', default: false, envirKey: 'aframePmndrsVignetteEnabled' },
    'aframePmndrsVignetteDarkness': { type: 'number', default: 0.5, envirKey: 'aframePmndrsVignetteDarkness' },
    'aframePmndrsToneMappingExposure': { type: 'number', default: 1.0, envirKey: 'aframePmndrsToneMappingExposure' },

    // Takram Atmosphere (PMNDRS)
    'aframePmndrsAtmosphereEnabled': { type: 'boolean', default: true, envirKey: 'aframePmndrsAtmosphereEnabled' },
    'aframePmndrsAtmospherePreset': { type: 'string', default: 'midday', envirKey: 'aframePmndrsAtmospherePreset' },
    'aframePmndrsAtmospherePresetIntensity': { type: 'number', default: 1.0, envirKey: 'aframePmndrsAtmospherePresetIntensity' },
    'aframePmndrsAtmosphereQuality': { type: 'string', default: 'balanced', envirKey: 'aframePmndrsAtmosphereQuality' },
    'aframePmndrsSunElevationDeg': { type: 'number', default: 62, envirKey: 'aframePmndrsSunElevationDeg' },
    'aframePmndrsSunAzimuthDeg': { type: 'number', default: 20, envirKey: 'aframePmndrsSunAzimuthDeg' },
    'aframePmndrsSunDistance': { type: 'number', default: 5200, envirKey: 'aframePmndrsSunDistance' },
    'aframePmndrsSunAngularRadius': { type: 'number', default: 0.0047, envirKey: 'aframePmndrsSunAngularRadius' },
    'aframePmndrsAerialStrength': { type: 'number', default: 0.55, envirKey: 'aframePmndrsAerialStrength' },
    'aframePmndrsAlbedoScale': { type: 'number', default: 1.0, envirKey: 'aframePmndrsAlbedoScale' },
    'aframePmndrsTransmittanceEnabled': { type: 'boolean', default: true, envirKey: 'aframePmndrsTransmittanceEnabled' },
    'aframePmndrsInscatterEnabled': { type: 'boolean', default: true, envirKey: 'aframePmndrsInscatterEnabled' },
    'aframePmndrsGroundEnabled': { type: 'boolean', default: true, envirKey: 'aframePmndrsGroundEnabled' },
    'aframePmndrsGroundAlbedo': { type: 'color', default: '#d8d8d0', envirKey: 'aframePmndrsGroundAlbedo' },
    'aframePmndrsRayleighScale': { type: 'number', default: 1.18, envirKey: 'aframePmndrsRayleighScale' },
    'aframePmndrsMieScatteringScale': { type: 'number', default: 0.42, envirKey: 'aframePmndrsMieScatteringScale' },
    'aframePmndrsMieExtinctionScale': { type: 'number', default: 0.56, envirKey: 'aframePmndrsMieExtinctionScale' },
    'aframePmndrsMiePhaseG': { type: 'number', default: 0.74, envirKey: 'aframePmndrsMiePhaseG' },
    'aframePmndrsAbsorptionScale': { type: 'number', default: 0.94, envirKey: 'aframePmndrsAbsorptionScale' },
    'aframePmndrsMoonEnabled': { type: 'boolean', default: false, envirKey: 'aframePmndrsMoonEnabled' },
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VRODOS_SCENE_SETTINGS_SCHEMA;
}
