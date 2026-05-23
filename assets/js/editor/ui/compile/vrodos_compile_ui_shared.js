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
        toneMappingMode: contractDefault('pmndrsToneMappingMode', 'agx'),
        lensFlareEnabled: contractDefault('pmndrsLensFlareEnabled', false),
        lutEnabled: contractDefault('pmndrsLutEnabled', false),
        lutLook: contractDefault('pmndrsLutLook', 'neutral'),
        lutStrength: contractDefault('pmndrsLutStrength', 1.0),
        vignetteEnabled: contractDefault('pmndrsVignetteEnabled', false),
        vignetteDarkness: contractDefault('pmndrsVignetteDarkness', 0.5),
        noiseEnabled: contractDefault('pmndrsNoiseEnabled', false),
        noiseOpacity: contractDefault('pmndrsNoiseOpacity', 0.04),
        chromaticAberrationEnabled: contractDefault('pmndrsChromaticAberrationEnabled', false),
        chromaticAberrationOffset: contractDefault('pmndrsChromaticAberrationOffset', 0.0015),
        lowLightAutoExposureEnabled: contractDefault('pmndrsLowLightAutoExposureEnabled', true),
        atmosphereEnabled: contractDefault('pmndrsAtmosphereEnabled', true),
        atmospherePreset: contractDefault('pmndrsAtmospherePreset', 'midday'),
        atmospherePresetIntensity: contractDefault('pmndrsAtmospherePresetIntensity', 1.0),
        atmosphereQuality: contractDefault('pmndrsAtmosphereQuality', 'balanced'),
        aerialPerspectiveEnabled: contractDefault('pmndrsAerialPerspectiveEnabled', false),
        correctAltitudeEnabled: contractDefault('pmndrsCorrectAltitudeEnabled', true),
        geospatialEnabled: contractDefault('pmndrsGeospatialEnabled', false),
        geospatialLatitudeDeg: contractDefault('pmndrsGeospatialLatitudeDeg', 0),
        geospatialLongitudeDeg: contractDefault('pmndrsGeospatialLongitudeDeg', 0),
        geospatialAltitudeMeters: contractDefault('pmndrsGeospatialAltitudeMeters', 0),
        celestialMode: contractDefault('pmndrsCelestialMode', 'manual'),
        celestialTimePreset: contractDefault('pmndrsCelestialTimePreset', 'midday'),
        celestialDate: contractDefault('pmndrsCelestialDate', '2026-06-21'),
        celestialUtcTime: contractDefault('pmndrsCelestialUtcTime', '12:00'),
        dayNightCycleEnabled: contractDefault('pmndrsDayNightCycleEnabled', false),
        dayNightCycleDurationMinutes: contractDefault('pmndrsDayNightCycleDurationMinutes', 1.0),
        sunElevationDeg: contractDefault('pmndrsSunElevationDeg', 62),
        sunAzimuthDeg: contractDefault('pmndrsSunAzimuthDeg', 20),
        sunDistance: contractDefault('pmndrsSunDistance', 5200),
        sunAngularRadius: contractDefault('pmndrsSunAngularRadius', 0.004675),
        aerialStrength: contractDefault('pmndrsAerialStrength', 0.55),
        albedoScale: contractDefault('pmndrsAlbedoScale', 1.0),
        transmittanceEnabled: contractDefault('pmndrsTransmittanceEnabled', true),
        inscatterEnabled: contractDefault('pmndrsInscatterEnabled', true),
        groundEnabled: contractDefault('pmndrsGroundEnabled', true),
        groundAlbedo: contractDefault('pmndrsGroundAlbedo', '#1a1a1a'),
        rayleighScale: contractDefault('pmndrsRayleighScale', 1.0),
        mieScatteringScale: contractDefault('pmndrsMieScatteringScale', 1.0),
        mieExtinctionScale: contractDefault('pmndrsMieExtinctionScale', 1.0),
        miePhaseG: contractDefault('pmndrsMiePhaseG', 0.8),
        absorptionScale: contractDefault('pmndrsAbsorptionScale', 1.0),
        moonEnabled: contractDefault('pmndrsMoonEnabled', false),
        starsEnabled: contractDefault('pmndrsStarsEnabled', 'auto'),
        horizonLightingPreset: contractDefault('pmndrsHorizonLightingPreset', 'natural'),
        horizonKeyLightIntensity: contractDefault('pmndrsHorizonKeyLightIntensity', 1.15),
        horizonFillLightIntensity: contractDefault('pmndrsHorizonFillLightIntensity', 0.45)
    };

    const SCENE_PROBE_DEFAULTS = {
        updateMode: contractDefault('sceneProbeUpdateMode', 'static'),
        resolution: String(contractDefault('sceneProbeResolution', '128'))
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

    function normalizePmndrsStarsEnabled(value, fallback) {
        switch (value) {
            case 'auto':
            case 'off':
            case 'on':
                return value;
            default:
                return fallback || PMNDRS_TWEAK_DEFAULTS.starsEnabled;
        }
    }

    function clampNumber(value, min, max, fallback, step) {
        let number;
        if (window.VRODOS && VRODOS.utils && typeof VRODOS.utils.clampNumber === 'function') {
            number = VRODOS.utils.clampNumber(value, min, max, fallback);
        } else {
            number = parseFloat(value);
            if (isNaN(number)) return fallback;
            if (number < min) number = min;
            if (number > max) number = max;
        }

        const increment = parseFloat(step);
        if (!isNaN(increment) && increment > 0) {
            const base = typeof min === 'number' ? min : 0;
            number = base + Math.round((number - base) / increment) * increment;
            number = Number(number.toFixed(6));
            if (number < min) number = min;
            if (number > max) number = max;
        }

        return number;
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
        SCENE_PROBE_DEFAULTS,
        getPmndrsHorizonHelperDefaults,
        normalizePmndrsHorizonLightingPreset,
        normalizePmndrsStarsEnabled,
        clampNumber,
        normalizeColorHex,
        formatNumber,
        formatRadius,
        formatDegrees
    };

})();
