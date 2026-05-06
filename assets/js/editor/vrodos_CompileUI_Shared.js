/**
 * VRodos Compile Dialogue - Shared Utilities & Constants
 * Part of Phase 4 Refactoring: UI Componentization
 */

window.VRodosCompileUI = window.VRodosCompileUI || {};

VRodosCompileUI.Shared = (function () {
    const contract = window.VRODOS_RUNTIME_SETTINGS_CONTRACT || { sceneSettings: {}, horizonHelperLightPresets: {} };

    function contractDefault(key, fallback, defaultKey) {
        const setting = contract.sceneSettings && contract.sceneSettings[key];
        const keyName = defaultKey || 'editorDefault';
        if (!setting) return fallback;
        if (setting[keyName] !== undefined) return setting[keyName];
        if (setting.default !== undefined) return setting.default;
        return fallback;
    }

    const PMNDRS_TWEAK_DEFAULTS = {
        aaMode: contractDefault('pmndrsAAMode', 'none'),
        aaPreset: contractDefault('pmndrsAAPreset', 'medium'),
        bloomIntensity: contractDefault('pmndrsBloomIntensity', 1.0),
        bloomThreshold: contractDefault('pmndrsBloomThreshold', 0.62),
        toneMappingExposure: contractDefault('pmndrsToneMappingExposure', 1.0),
        lutEnabled: contractDefault('pmndrsLutEnabled', false),
        lutLook: contractDefault('pmndrsLutLook', 'neutral'),
        lutStrength: contractDefault('pmndrsLutStrength', 1.0),
        vignetteEnabled: contractDefault('pmndrsVignetteEnabled', false),
        vignetteDarkness: contractDefault('pmndrsVignetteDarkness', 0.5),
        noiseEnabled: contractDefault('pmndrsNoiseEnabled', false),
        noiseOpacity: contractDefault('pmndrsNoiseOpacity', 0.04),
        chromaticAberrationEnabled: contractDefault('pmndrsChromaticAberrationEnabled', false),
        chromaticAberrationOffset: contractDefault('pmndrsChromaticAberrationOffset', 0.0015),
        atmosphereEnabled: contractDefault('pmndrsAtmosphereEnabled', true),
        atmospherePreset: contractDefault('pmndrsAtmospherePreset', 'midday'),
        atmospherePresetIntensity: contractDefault('pmndrsAtmospherePresetIntensity', 1.0),
        atmosphereQuality: contractDefault('pmndrsAtmosphereQuality', 'balanced'),
        celestialMode: contractDefault('pmndrsCelestialMode', 'manual'),
        celestialTimePreset: contractDefault('pmndrsCelestialTimePreset', 'midday'),
        sunElevationDeg: contractDefault('pmndrsSunElevationDeg', 62),
        sunAzimuthDeg: contractDefault('pmndrsSunAzimuthDeg', 20),
        sunDistance: contractDefault('pmndrsSunDistance', 5200),
        sunAngularRadius: contractDefault('pmndrsSunAngularRadius', 0.0047),
        aerialStrength: contractDefault('pmndrsAerialStrength', 0.55),
        albedoScale: contractDefault('pmndrsAlbedoScale', 1.0),
        transmittanceEnabled: contractDefault('pmndrsTransmittanceEnabled', true),
        inscatterEnabled: contractDefault('pmndrsInscatterEnabled', true),
        groundEnabled: contractDefault('pmndrsGroundEnabled', true),
        groundAlbedo: contractDefault('pmndrsGroundAlbedo', '#d8d8d0'),
        rayleighScale: contractDefault('pmndrsRayleighScale', 1.18),
        mieScatteringScale: contractDefault('pmndrsMieScatteringScale', 0.42),
        mieExtinctionScale: contractDefault('pmndrsMieExtinctionScale', 0.56),
        miePhaseG: contractDefault('pmndrsMiePhaseG', 0.74),
        absorptionScale: contractDefault('pmndrsAbsorptionScale', 0.94),
        moonEnabled: contractDefault('pmndrsMoonEnabled', false),
        horizonLightingPreset: contractDefault('pmndrsHorizonLightingPreset', 'natural'),
        horizonKeyLightIntensity: contractDefault('pmndrsHorizonKeyLightIntensity', 1.15),
        horizonFillLightIntensity: contractDefault('pmndrsHorizonFillLightIntensity', 0.45)
    };

    function getPmndrsHorizonHelperDefaults(preset) {
        const normalized = ['clear', 'crisp'].indexOf(preset) !== -1 ? preset : 'natural';
        const defaults = contract.horizonHelperLightPresets && contract.horizonHelperLightPresets[normalized];
        return {
            keyLightIntensity: defaults && defaults.keyLightIntensity !== undefined ? defaults.keyLightIntensity : PMNDRS_TWEAK_DEFAULTS.horizonKeyLightIntensity,
            fillLightIntensity: defaults && defaults.fillLightIntensity !== undefined ? defaults.fillLightIntensity : PMNDRS_TWEAK_DEFAULTS.horizonFillLightIntensity
        };
    }

    function normalizePmndrsHorizonLightingPreset(value, fallback) {
        switch (value) {
            case 'natural':
            case 'clear':
            case 'crisp':
            case 'custom':
                return value;
            default:
                return fallback || PMNDRS_TWEAK_DEFAULTS.horizonLightingPreset;
        }
    }

    function clampNumber(value, min, max, fallback) {
        const n = parseFloat(value);
        if (isNaN(n)) return fallback;
        if (n < min) return min;
        if (n > max) return max;
        return n;
    }

    function normalizeColorHex(value, fallback) {
        const raw = (typeof value === 'string') ? value.trim() : '';
        if (!/^#?[0-9a-fA-F]{6}$/.test(raw)) {
            return fallback;
        }
        return raw.charAt(0) === '#' ? raw.toLowerCase() : (`#${  raw.toLowerCase()}`);
    }

    function formatNumber(value) {
        return (Math.round(value * 100) / 100).toFixed(2);
    }

    function formatRadius(value) {
        let n = parseFloat(value);
        if (isNaN(n)) n = 0;
        return n.toFixed(4);
    }

    function formatDegrees(value) {
        return `${String(Math.round(parseFloat(value) || 0))  }\u00b0`;
    }

    return {
        PMNDRS_TWEAK_DEFAULTS,
        getPmndrsHorizonHelperDefaults,
        normalizePmndrsHorizonLightingPreset,
        clampNumber,
        normalizeColorHex,
        formatNumber,
        formatRadius,
        formatDegrees
    };

})();

