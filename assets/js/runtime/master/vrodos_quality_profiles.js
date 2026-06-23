/**
 * VRodos Quality Profile Helpers
 * Extracted from vrodos_scene_settings.component.js
 */
/* global VRODOSMaster, vrodosEnhanceMeshMaterial, vrodosGetExplicitMaterialOverrides */
(function () {
    const H = VRODOSMaster.SceneSettingsHelpers = VRODOSMaster.SceneSettingsHelpers || {};
    const TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS = 0.004675;
    const PMNDRS_NIGHT_REFLECTION_INTENSITY_SCALE = 0.36;
    const PMNDRS_NIGHT_MOON_LIGHT_INTENSITY = 0.28;
    const PMNDRS_NIGHT_AUTO_EXPOSURE = 3.4;
    const PMNDRS_DAWN_AUTO_EXPOSURE = 2.2;
    const PMNDRS_STARS_NIGHT_INTENSITY = 6.0;
    const PMNDRS_STARS_DAWN_INTENSITY = 0.35;
    const PMNDRS_STARS_POINT_SIZE = 1.8;
    const PMNDRS_STARS_FALLBACK_POINT_SIZE = 1.65;
    const PMNDRS_STARS_FALLBACK_RADIUS = 6000;
    const PMNDRS_TAKRAM_STARS_RELATIVE_PATH = 'assets/vendor/takram-atmosphere/stars.bin';
    const VR_TAKRAM_SKY_DIRECT_EXPOSURE = 24;
    const VR_TAKRAM_SKY_REVEAL_WARMUP_MS = 10000;
    const PMNDRS_DAY_NIGHT_CYCLE_DEFAULT_MINUTES = 1;
    const PMNDRS_DAY_NIGHT_CYCLE_MIN_MINUTES = 0.25;
    const PMNDRS_DAY_NIGHT_CYCLE_MAX_MINUTES = 1440;
    const PMNDRS_DAY_NIGHT_CYCLE_DAY_MS = 86400000;
    const PERFORMANCE_DESKTOP_RENDER_PIXEL_BUDGET = 1650000;
    const DPR_PIXEL_BUDGET_QUERY_PARAM = 'vrodos_dpr_pixel_budget';
    const TERRAIN_SHADOW_DEPTH_OFFSET_FACTOR = 4;
    const TERRAIN_SHADOW_DEPTH_OFFSET_UNITS = 8;
    const PMNDRS_SUN_DIRECT_LIGHT_START_Y = 0.0;
    const PMNDRS_SUN_DIRECT_LIGHT_FULL_Y = 0.08;
    const PMNDRS_MOON_DIRECT_LIGHT_START_Y = 0.02;
    const PMNDRS_MOON_DIRECT_LIGHT_FULL_Y = 0.16;
    const PMNDRS_DAY_NIGHT_SHADOW_RADIUS_HIGH = 2.4;
    const PMNDRS_DAY_NIGHT_SHADOW_RADIUS_MEDIUM = 1.8;
    const WGS84_EQUATORIAL_RADIUS = 6378137;
    const WGS84_POLAR_RADIUS = 6356752.3142451793;
    const runtimeSettingsContract = window.VRODOS_RUNTIME_SETTINGS_CONTRACT || {};
    const RuntimeSettings = VRODOSMaster.RuntimeSettings || {};
    const PMNDRS_HORIZON_HELPER_LIGHT_DEFAULTS = runtimeSettingsContract.horizonHelperLightPresets || {
        natural: {
            keyIntensity: 1.15,
            fillIntensity: 0.45
        },
        clear: {
            keyIntensity: 1.24,
            fillIntensity: 0.55
        },
        crisp: {
            keyIntensity: 1.19,
            fillIntensity: 0.49
        }
    };

    function readDprPixelBudgetOverride() {
        try {
            const params = new URLSearchParams(window.location.search || '');
            const value = params.get(DPR_PIXEL_BUDGET_QUERY_PARAM);
            if (value === null || value === '') {
                return null;
            }
            const parsed = Number(value);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        } catch (error) {
            return null;
        }
    }

    function getRendererCssSize(renderer) {
        const canvas = renderer && renderer.domElement ? renderer.domElement : null;
        const pixelRatio = renderer && typeof renderer.getPixelRatio === 'function'
            ? renderer.getPixelRatio()
            : (window.devicePixelRatio || 1);
        let width = canvas && canvas.clientWidth ? canvas.clientWidth : 0;
        let height = canvas && canvas.clientHeight ? canvas.clientHeight : 0;

        if ((!width || !height) && renderer && typeof renderer.getSize === 'function') {
            const target = {
                width: 0,
                height: 0,
                set(w, h) {
                    this.width = w;
                    this.height = h;
                    return this;
                },
                divideScalar(scalar) {
                    this.width /= scalar;
                    this.height /= scalar;
                    return this;
                }
            };
            renderer.getSize(target);
            width = width || target.width;
            height = height || target.height;
        }

        if ((!width || !height) && canvas && pixelRatio > 0) {
            width = width || (canvas.width / pixelRatio);
            height = height || (canvas.height / pixelRatio);
        }

        return {
            width: Math.max(1, Math.round(width || window.innerWidth || 1)),
            height: Math.max(1, Math.round(height || window.innerHeight || 1))
        };
    }

    function applyDesktopRenderPixelBudget(component, renderer, targetPixelRatio, options) {
        const cssSize = getRendererCssSize(renderer);
        const overrideBudget = readDprPixelBudgetOverride();
        const isImmersiveXr = Boolean(
            component &&
            typeof component.isVrPresentationActive === 'function' &&
            component.isVrPresentationActive()
        );
        const shouldApplyBudget = !isImmersiveXr && (options.isPerformanceQuality || overrideBudget !== null);
        const pixelBudget = overrideBudget !== null ? overrideBudget : PERFORMANCE_DESKTOP_RENDER_PIXEL_BUDGET;
        const originalPixelRatio = targetPixelRatio;
        let budgetPixelRatio = null;

        if (shouldApplyBudget) {
            const cssPixels = cssSize.width * cssSize.height;
            budgetPixelRatio = cssPixels > 0 ? Math.sqrt(pixelBudget / cssPixels) : null;
            if (Number.isFinite(budgetPixelRatio) && budgetPixelRatio > 0) {
                targetPixelRatio = Math.min(targetPixelRatio, budgetPixelRatio);
            }
        }

        targetPixelRatio = Math.max(options.minPixelRatio, Math.min(targetPixelRatio, options.maxPixelRatio));

        if (component) {
            component._vrodosRenderPixelBudget = {
                renderQuality: options.renderQuality,
                devicePixelRatio: window.devicePixelRatio || 1,
                cssWidth: cssSize.width,
                cssHeight: cssSize.height,
                pixelBudget: shouldApplyBudget ? pixelBudget : null,
                budgetPixelRatio,
                originalPixelRatio,
                pixelRatio: targetPixelRatio,
                estimatedRenderPixels: Math.round(cssSize.width * cssSize.height * targetPixelRatio * targetPixelRatio),
                applied: Boolean(shouldApplyBudget && targetPixelRatio < originalPixelRatio - 0.0001),
                source: shouldApplyBudget ? (overrideBudget !== null ? 'query' : 'performance-profile') : 'none',
                immersiveXr: isImmersiveXr
            };
        }

        return targetPixelRatio;
    }
    const PMNDRS_ATMOSPHERE_LOOK_DEFAULTS = runtimeSettingsContract.atmosphereLookDefaults || {
        night: {
            sunElevationDeg: -18,
            sunAzimuthDeg: 25,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.16,
            albedoScale: 0.85,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 0.9,
            mieScatteringScale: 0.45,
            mieExtinctionScale: 0.55,
            miePhaseG: 0.8,
            absorptionScale: 1.05,
            moonEnabled: true
        },
        dawn: {
            sunElevationDeg: -5,
            sunAzimuthDeg: -65,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.45,
            albedoScale: 0.9,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 1.0,
            mieScatteringScale: 0.75,
            mieExtinctionScale: 0.85,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        },
        sunrise: {
            sunElevationDeg: 2,
            sunAzimuthDeg: -55,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.65,
            albedoScale: 0.96,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 1.0,
            mieScatteringScale: 0.9,
            mieExtinctionScale: 0.95,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        },
        'early-morning': {
            sunElevationDeg: 22,
            sunAzimuthDeg: -28,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.5,
            albedoScale: 1.0,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 1.0,
            mieScatteringScale: 0.95,
            mieExtinctionScale: 0.98,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        },
        midday: {
            sunElevationDeg: 62,
            sunAzimuthDeg: 20,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.55,
            albedoScale: 1.0,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 1.0,
            mieScatteringScale: 1.0,
            mieExtinctionScale: 1.0,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        },
        'golden-hour': {
            sunElevationDeg: 5,
            sunAzimuthDeg: 32,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.65,
            albedoScale: 0.98,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 1.0,
            mieScatteringScale: 0.9,
            mieExtinctionScale: 0.95,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        },
        sunset: {
            sunElevationDeg: 1,
            sunAzimuthDeg: 38,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.75,
            albedoScale: 0.96,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 1.0,
            mieScatteringScale: 0.95,
            mieExtinctionScale: 1.05,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        }
    };
    function clampPmndrsNumber(value, min, max, fallback) {
        const n = parseFloat(value);
        if (isNaN(n)) {
            return fallback;
        }
        if (n < min) {
            return min;
        }
        if (n > max) {
            return max;
        }
        return n;
    }

    function normalizePmndrsAtmosphereQuality(value) {
        if (RuntimeSettings.normalizeEnum) {
            return RuntimeSettings.normalizeEnum('pmndrsAtmosphereQuality', value, 'balanced');
        }

        switch (value) {
            case 'performance':
            case 'balanced':
            case 'quality':
            case 'cinematic':
                return value;
            default:
                return 'balanced';
        }
    }

    function normalizePmndrsToneMappingMode(value) {
        if (RuntimeSettings.normalizeEnum) {
            return RuntimeSettings.normalizeEnum('pmndrsToneMappingMode', value, 'agx');
        }

        switch (value) {
            case 'agx':
            case 'reinhard':
            case 'cineon':
            case 'aces-filmic':
            case 'linear':
                return value;
            default:
                return 'agx';
        }
    }

    function getThreeToneMappingForPmndrsMode(mode) {
        const normalized = normalizePmndrsToneMappingMode(mode);
        switch (normalized) {
            case 'reinhard':
                return typeof THREE.ReinhardToneMapping !== 'undefined' ? THREE.ReinhardToneMapping : null;
            case 'cineon':
                return typeof THREE.CineonToneMapping !== 'undefined' ? THREE.CineonToneMapping : null;
            case 'aces-filmic':
                return typeof THREE.ACESFilmicToneMapping !== 'undefined' ? THREE.ACESFilmicToneMapping : null;
            case 'linear':
                return typeof THREE.LinearToneMapping !== 'undefined' ? THREE.LinearToneMapping : null;
            case 'agx':
            default:
                return typeof THREE.AgXToneMapping !== 'undefined'
                    ? THREE.AgXToneMapping
                    : (typeof THREE.ACESFilmicToneMapping !== 'undefined' ? THREE.ACESFilmicToneMapping : null);
        }
    }

    function normalizeAFrameShadowMapType(value, fallback) {
        switch (String(value || '').toLowerCase()) {
            case 'basic':
            case 'pcf':
                return String(value).toLowerCase();
            default:
                return fallback || 'pcf';
        }
    }

    function getThreeShadowMapType(type) {
        switch (normalizeAFrameShadowMapType(type, 'pcf')) {
            case 'basic':
                return typeof THREE.BasicShadowMap !== 'undefined' ? THREE.BasicShadowMap : THREE.PCFShadowMap;
            case 'pcf':
            default:
                return THREE.PCFShadowMap;
        }
    }

    function getThreeShadowMapTypeName(type) {
        if (typeof THREE !== 'undefined') {
            if (typeof THREE.BasicShadowMap !== 'undefined' && type === THREE.BasicShadowMap) {
                return 'BasicShadowMap';
            }
            if (type === THREE.PCFShadowMap) {
                return 'PCFShadowMap';
            }
        }

        return typeof type === 'number' ? `ShadowMap(${type})` : String(type || 'unknown');
    }

    function getAFrameShadowComponentType(type) {
        const normalized = normalizeAFrameShadowMapType(type, 'pcf');
        return normalized === 'basic' ? 'basic' : 'pcf';
    }

    function normalizeReflectionOcclusionMode(value) {
        switch (value) {
            case 'off':
            case 'strong':
                return value;
            default:
                return 'auto';
        }
    }

    function normalizePmndrsAtmospherePreset(value) {
        if (RuntimeSettings.normalizeEnum) {
            return RuntimeSettings.normalizeEnum('pmndrsAtmospherePreset', value, 'midday');
        }

        switch (value) {
            case 'night':
            case 'dawn':
            case 'sunrise':
            case 'early-morning':
            case 'golden-hour':
            case 'sunset':
            case 'custom':
                return value;
            default:
                return 'midday';
        }
    }

    function normalizePmndrsCelestialMode(value) {
        if (RuntimeSettings.normalizeEnum) {
            return RuntimeSettings.normalizeEnum('pmndrsCelestialMode', value, 'manual');
        }

        if (value === 'preset-time' || value === 'datetime') {
            return value;
        }
        return 'manual';
    }

    function normalizePmndrsCelestialTimePreset(value) {
        if (RuntimeSettings.normalizeEnum) {
            return RuntimeSettings.normalizeEnum('pmndrsCelestialTimePreset', value, 'midday');
        }

        switch (value) {
            case 'night':
            case 'dawn':
            case 'sunrise':
            case 'early-morning':
            case 'midday':
            case 'golden-hour':
            case 'sunset':
                return value;
            default:
                return 'midday';
        }
    }

    function normalizePmndrsStarsEnabled(value) {
        if (RuntimeSettings.normalizeEnum) {
            return RuntimeSettings.normalizeEnum('pmndrsStarsEnabled', value, 'auto');
        }

        switch (value) {
            case 'on':
            case 'off':
            case 'auto':
                return value;
            default:
                return 'auto';
        }
    }

    function normalizePmndrsDate(value, fallback) {
        if (RuntimeSettings.normalizeDate) {
            return RuntimeSettings.normalizeDate('pmndrsCelestialDate', value, fallback || '2026-06-21');
        }

        const candidate = typeof value === 'string' ? value.trim() : '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
            return candidate;
        }
        return fallback || '2026-06-21';
    }

    function normalizePmndrsUtcTime(value, fallback) {
        if (RuntimeSettings.normalizeUtcTime) {
            return RuntimeSettings.normalizeUtcTime('pmndrsCelestialUtcTime', value, fallback || '12:00');
        }

        const candidate = typeof value === 'string' ? value.trim() : '';
        if (/^\d{2}:\d{2}$/.test(candidate)) {
            const parts = candidate.split(':');
            const hour = parseInt(parts[0], 10);
            const minute = parseInt(parts[1], 10);
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                return candidate;
            }
        }
        return fallback || '12:00';
    }

    function lerpNumber(a, b, t) {
        return a + ((b - a) * t);
    }

    function clamp01(value) {
        return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
    }

    function smoothstepNumber(edge0, edge1, value) {
        if (edge0 === edge1) {
            return value >= edge1 ? 1 : 0;
        }
        const t = clamp01((value - edge0) / (edge1 - edge0));
        return t * t * (3 - (2 * t));
    }

    function lerpPmndrsColor(fromHex, toHex, t) {
        function hexToRgb(hex) {
            const normalized = normalizePmndrsColor(hex, '#000000');
            return {
                r: parseInt(normalized.slice(1, 3), 16),
                g: parseInt(normalized.slice(3, 5), 16),
                b: parseInt(normalized.slice(5, 7), 16)
            };
        }
        function toHex(value) {
            const clamped = Math.max(0, Math.min(255, Math.round(value)));
            return clamped.toString(16).padStart(2, '0');
        }
        const from = hexToRgb(fromHex);
        const to = hexToRgb(toHex);
        return `#${ 
            toHex(lerpNumber(from.r, to.r, t)) 
            }${toHex(lerpNumber(from.g, to.g, t)) 
            }${toHex(lerpNumber(from.b, to.b, t))}`;
    }

    function getPmndrsAtmosphereLookDefaults(preset, intensity) {
        const midday = PMNDRS_ATMOSPHERE_LOOK_DEFAULTS.midday;
        const resolvedPreset = normalizePmndrsAtmospherePreset(preset);
        let target = PMNDRS_ATMOSPHERE_LOOK_DEFAULTS[resolvedPreset] || midday;
        let blend = clampPmndrsNumber(intensity, 0, 1, 1);

        if (resolvedPreset === 'midday' || resolvedPreset === 'custom') {
            blend = 1;
            target = midday;
        }

        return {
            sunElevationDeg: lerpNumber(midday.sunElevationDeg, target.sunElevationDeg, blend),
            sunAzimuthDeg: lerpNumber(midday.sunAzimuthDeg, target.sunAzimuthDeg, blend),
            sunDistance: lerpNumber(midday.sunDistance, target.sunDistance, blend),
            sunAngularRadius: lerpNumber(midday.sunAngularRadius, target.sunAngularRadius, blend),
            aerialStrength: lerpNumber(midday.aerialStrength, target.aerialStrength, blend),
            albedoScale: lerpNumber(midday.albedoScale, target.albedoScale, blend),
            transmittanceEnabled: blend < 0.5 ? midday.transmittanceEnabled : target.transmittanceEnabled,
            inscatterEnabled: blend < 0.5 ? midday.inscatterEnabled : target.inscatterEnabled,
            groundEnabled: blend < 0.5 ? midday.groundEnabled : target.groundEnabled,
            groundAlbedo: lerpPmndrsColor(midday.groundAlbedo, target.groundAlbedo, blend),
            rayleighScale: lerpNumber(midday.rayleighScale, target.rayleighScale, blend),
            mieScatteringScale: lerpNumber(midday.mieScatteringScale, target.mieScatteringScale, blend),
            mieExtinctionScale: lerpNumber(midday.mieExtinctionScale, target.mieExtinctionScale, blend),
            miePhaseG: lerpNumber(midday.miePhaseG, target.miePhaseG, blend),
            absorptionScale: lerpNumber(midday.absorptionScale, target.absorptionScale, blend),
            moonEnabled: blend >= 0.5 && target.moonEnabled === true
        };
    }

    function getPmndrsHorizonHelperLightDefaults(preset) {
        function normalizeDefaults(defaults) {
            return {
                keyIntensity: defaults.keyIntensity !== undefined ? defaults.keyIntensity : defaults.keyLightIntensity,
                fillIntensity: defaults.fillIntensity !== undefined ? defaults.fillIntensity : defaults.fillLightIntensity
            };
        }

        switch (preset) {
            case 'clear':
                return normalizeDefaults(PMNDRS_HORIZON_HELPER_LIGHT_DEFAULTS.clear);
            case 'crisp':
                return normalizeDefaults(PMNDRS_HORIZON_HELPER_LIGHT_DEFAULTS.crisp);
            default:
                return normalizeDefaults(PMNDRS_HORIZON_HELPER_LIGHT_DEFAULTS.natural);
        }
    }

    function getResolvedPmndrsSkyTimePreset(config) {
        if (!config) {
            return 'midday';
        }
        if ((config.dayNightCycleEnabled || config.celestialMode === 'datetime') && typeof config.sunElevationDeg === 'number') {
            return classifyPmndrsSkyTimeFromConfig(config);
        }
        if (config.resolvedLookPreset && config.resolvedLookPreset !== 'custom') {
            return config.resolvedLookPreset;
        }
        return config.celestialTimePreset || 'midday';
    }

    function classifyPmndrsSkyTimeFromElevation(sunElevationDeg) {
        if (sunElevationDeg <= -12) {
            return 'night';
        }
        if (sunElevationDeg < 0) {
            return 'dawn';
        }
        if (sunElevationDeg < 4) {
            return 'sunrise';
        }
        if (sunElevationDeg < 18) {
            return 'golden-hour';
        }
        if (sunElevationDeg < 35) {
            return 'early-morning';
        }
        return 'midday';
    }

    function classifyPmndrsSkyTimeFromConfig(config) {
        const sunElevationDeg = config && typeof config.sunElevationDeg === 'number' ? config.sunElevationDeg : 62;
        const base = classifyPmndrsSkyTimeFromElevation(sunElevationDeg);
        if (base !== 'sunrise' && base !== 'golden-hour') {
            return base;
        }

        const localSunDirection = config.localSunDirection || null;
        if (localSunDirection && typeof localSunDirection.x === 'number' && localSunDirection.x < -0.05) {
            return 'sunset';
        }
        return base;
    }

    function isPmndrsPresetTimeNight(config) {
        return Boolean(config &&
            (getResolvedPmndrsSkyTimePreset(config) === 'night' ||
                (config.celestialMode === 'datetime' && typeof config.sunElevationDeg === 'number' && config.sunElevationDeg <= -12)));
    }

    function isPmndrsDynamicCelestialConfig(config) {
        return Boolean(config &&
            (config.dayNightCycleEnabled || config.celestialMode === 'datetime') &&
            typeof config.sunElevationDeg === 'number');
    }

    const PMNDRS_CALIBRATED_LIGHTING_ANCHORS = {
        night: {
            elevation: -18,
            keyColor: '#b8c8ff',
            fillColor: '#2f3b62',
            groundFillColor: '#070a10',
            keyIntensity: 0.22,
            fillIntensity: 0.10,
            skyLightIntensity: 0.38,
            pbrFillIntensity: 0.24,
            ambientBounceIntensity: 0.04,
            exposure: 3.15,
            reflectionIntensityScale: 0.42,
            starsIntensity: PMNDRS_STARS_NIGHT_INTENSITY,
            useMoonDirection: true
        },
        dawn: {
            elevation: -5,
            keyColor: '#9fb7ff',
            fillColor: '#34476c',
            groundFillColor: '#242d3e',
            keyIntensity: 0.38,
            fillIntensity: 0.42,
            skyLightIntensity: 1.20,
            pbrFillIntensity: 0.88,
            ambientBounceIntensity: 0.28,
            exposure: 2.35,
            reflectionIntensityScale: 0.78,
            starsIntensity: PMNDRS_STARS_DAWN_INTENSITY,
            useMoonDirection: false
        },
        sunrise: {
            elevation: 2,
            keyColor: '#ffd1a3',
            fillColor: '#506b98',
            groundFillColor: '#4f5262',
            keyIntensity: 0.88,
            fillIntensity: 0.62,
            skyLightIntensity: 1.36,
            pbrFillIntensity: 0.98,
            ambientBounceIntensity: 0.24,
            exposure: 2.05,
            reflectionIntensityScale: 0.98,
            starsIntensity: 0,
            useMoonDirection: false
        },
        'golden-hour': {
            elevation: 6,
            keyColor: '#ffba7a',
            fillColor: '#5f78ab',
            groundFillColor: '#684a36',
            keyIntensity: 1.12,
            fillIntensity: 0.70,
            skyLightIntensity: 1.45,
            pbrFillIntensity: 1.02,
            ambientBounceIntensity: 0.30,
            exposure: 1.75,
            reflectionIntensityScale: 1.04,
            starsIntensity: 0,
            useMoonDirection: false
        },
        sunset: {
            elevation: 3,
            keyColor: '#ff9f64',
            fillColor: '#5b6f9b',
            groundFillColor: '#684a36',
            keyIntensity: 1.05,
            fillIntensity: 0.70,
            skyLightIntensity: 1.45,
            pbrFillIntensity: 1.02,
            ambientBounceIntensity: 0.30,
            exposure: 1.82,
            reflectionIntensityScale: 1.04,
            starsIntensity: 0,
            useMoonDirection: false
        },
        'early-morning': {
            elevation: 22,
            keyColor: '#fff0cf',
            fillColor: '#b9d0f2',
            groundFillColor: '#56605a',
            keyIntensity: 1.60,
            fillIntensity: 0.56,
            skyLightIntensity: 1.48,
            pbrFillIntensity: 0.92,
            ambientBounceIntensity: 0.16,
            exposure: 1.35,
            reflectionIntensityScale: 1.05,
            starsIntensity: 0,
            useMoonDirection: false
        },
        midday: {
            elevation: 62,
            keyColor: '#fff2d4',
            fillColor: '#d7e8ff',
            groundFillColor: '#68675d',
            keyIntensity: 2.12,
            fillIntensity: 0.48,
            skyLightIntensity: 1.55,
            pbrFillIntensity: 0.95,
            ambientBounceIntensity: 0.10,
            exposure: 1.25,
            reflectionIntensityScale: 1.08,
            starsIntensity: 0,
            useMoonDirection: false
        }
    };

    const PMNDRS_CALIBRATED_LIGHTING_NUMERIC_KEYS = [
        'elevation',
        'keyIntensity',
        'fillIntensity',
        'skyLightIntensity',
        'pbrFillIntensity',
        'ambientBounceIntensity',
        'exposure',
        'reflectionIntensityScale',
        'starsIntensity'
    ];

    function clonePmndrsLightingAnchor(anchor) {
        const result = {};
        Object.keys(anchor || {}).forEach((key) => {
            result[key] = anchor[key];
        });
        return result;
    }

    function mixPmndrsLightingAnchors(a, b, t) {
        const mix = Math.max(0, Math.min(1, t));
        const result = {};

        PMNDRS_CALIBRATED_LIGHTING_NUMERIC_KEYS.forEach((key) => {
            result[key] = lerpNumber(a[key], b[key], mix);
        });

        result.keyColor = lerpPmndrsColor(a.keyColor, b.keyColor, mix);
        result.fillColor = lerpPmndrsColor(a.fillColor, b.fillColor, mix);
        result.groundFillColor = lerpPmndrsColor(a.groundFillColor, b.groundFillColor, mix);
        result.useMoonDirection = mix < 0.5 ? a.useMoonDirection : b.useMoonDirection;
        return result;
    }

    function samplePmndrsLightingAnchorSequence(sequence, sunElevation) {
        if (!sequence || !sequence.length) {
            return clonePmndrsLightingAnchor(PMNDRS_CALIBRATED_LIGHTING_ANCHORS.midday);
        }
        if (sunElevation <= sequence[0].elevation) {
            return clonePmndrsLightingAnchor(sequence[0]);
        }

        for (let i = 1; i < sequence.length; i += 1) {
            const previous = sequence[i - 1];
            const next = sequence[i];
            if (sunElevation <= next.elevation) {
                return mixPmndrsLightingAnchors(
                    previous,
                    next,
                    smoothstepNumber(previous.elevation, next.elevation, sunElevation)
                );
            }
        }

        return clonePmndrsLightingAnchor(sequence[sequence.length - 1]);
    }

    function getPmndrsSettingSunBlend(config, sunElevation) {
        const localSunDirection = config && config.localSunDirection ? config.localSunDirection : null;
        const azimuthBlend = localSunDirection && typeof localSunDirection.x === 'number'
            ? 1 - smoothstepNumber(-0.18, 0.05, localSunDirection.x)
            : 0;
        const lowSunBlend = 1 - smoothstepNumber(18, 32, sunElevation);
        return Math.max(0, Math.min(1, azimuthBlend * lowSunBlend));
    }

    function getPmndrsStaticLightingAnchorKey(config) {
        const preset = getResolvedPmndrsSkyTimePreset(config);
        return PMNDRS_CALIBRATED_LIGHTING_ANCHORS[preset] ? preset : null;
    }

    function shouldUsePmndrsDynamicIndirectProfile(config, skyTimePreset, sunElevation) {
        if (!config || typeof sunElevation !== 'number') {
            return false;
        }
        if (isPmndrsDynamicCelestialConfig(config)) {
            return true;
        }
        if (config.celestialMode !== 'preset-time') {
            return false;
        }
        return Boolean(PMNDRS_CALIBRATED_LIGHTING_ANCHORS[skyTimePreset]);
    }

    function getPmndrsCalibratedCelestialLightingProfile(config) {
        if (!config || typeof config.sunElevationDeg !== 'number') {
            return null;
        }

        if (config._calibratedCelestialLightingProfile) {
            return config._calibratedCelestialLightingProfile;
        }

        const sunElevation = config.sunElevationDeg;
        const isDynamic = isPmndrsDynamicCelestialConfig(config);
        const staticAnchorKey = !isDynamic && config.celestialMode === 'preset-time'
            ? getPmndrsStaticLightingAnchorKey(config)
            : null;
        const morningSequence = [
            PMNDRS_CALIBRATED_LIGHTING_ANCHORS.night,
            PMNDRS_CALIBRATED_LIGHTING_ANCHORS.dawn,
            PMNDRS_CALIBRATED_LIGHTING_ANCHORS.sunrise,
            PMNDRS_CALIBRATED_LIGHTING_ANCHORS['golden-hour'],
            PMNDRS_CALIBRATED_LIGHTING_ANCHORS['early-morning'],
            PMNDRS_CALIBRATED_LIGHTING_ANCHORS.midday
        ];
        const settingSequence = [
            PMNDRS_CALIBRATED_LIGHTING_ANCHORS.night,
            PMNDRS_CALIBRATED_LIGHTING_ANCHORS.dawn,
            PMNDRS_CALIBRATED_LIGHTING_ANCHORS.sunset,
            PMNDRS_CALIBRATED_LIGHTING_ANCHORS['early-morning'],
            PMNDRS_CALIBRATED_LIGHTING_ANCHORS.midday
        ];
        const profile = staticAnchorKey
            ? clonePmndrsLightingAnchor(PMNDRS_CALIBRATED_LIGHTING_ANCHORS[staticAnchorKey])
            : mixPmndrsLightingAnchors(
                samplePmndrsLightingAnchorSequence(morningSequence, sunElevation),
                samplePmndrsLightingAnchorSequence(settingSequence, sunElevation),
                getPmndrsSettingSunBlend(config, sunElevation)
            );
        const moonY = config.localMoonDirection && typeof config.localMoonDirection.y === 'number'
            ? config.localMoonDirection.y
            : -1;
        const moonVisibility = config.moonEnabled === false ? 0 : smoothstepNumber(-0.04, 0.38, moonY);
        const nightAmount = 1 - smoothstepNumber(-14, -4, sunElevation);
        const moonWeight = nightAmount * moonVisibility;
        const moonKeyBlend = smoothstepNumber(0.35, 0.62, moonWeight) *
            (1 - smoothstepNumber(-4, -2, sunElevation));
        const useMoonDirection = moonKeyBlend > 0.5;

        profile.moonLightIntensity = PMNDRS_NIGHT_MOON_LIGHT_INTENSITY * moonWeight;
        profile.useMoonDirection = useMoonDirection;
        profile.keyColor = lerpPmndrsColor(profile.keyColor, '#b8c8ff', moonKeyBlend);
        profile.keyIntensity = lerpNumber(
            profile.keyIntensity,
            Math.max(profile.keyIntensity * (0.35 + moonWeight * 0.45), profile.moonLightIntensity),
            moonKeyBlend
        );

        const noMoonDeepNightAmount = (1 - smoothstepNumber(-12, -8, sunElevation)) *
            (1 - smoothstepNumber(0.12, 0.28, moonVisibility));
        profile.keyIntensity *= lerpNumber(1, 0.45, noMoonDeepNightAmount);
        profile.skyLightIntensity *= lerpNumber(1, 0.72, noMoonDeepNightAmount);
        profile.pbrFillIntensity *= lerpNumber(1, 0.70, noMoonDeepNightAmount);
        profile.ambientBounceIntensity *= lerpNumber(1, 0.75, noMoonDeepNightAmount);
        profile.reflectionIntensityScale *= lerpNumber(1, 0.78, noMoonDeepNightAmount);
        profile.starsIntensity *= (1 - moonVisibility * 0.35);
        profile.skyLightIntensity = Math.max(0, Math.min(4.0, profile.skyLightIntensity));
        profile.pbrFillIntensity = Math.max(0, Math.min(3.0, profile.pbrFillIntensity));
        profile.ambientBounceIntensity = Math.max(0, Math.min(0.95, profile.ambientBounceIntensity));
        profile.fillIntensity = Math.max(0, Math.min(2.1, profile.fillIntensity));
        profile.keyIntensity = Math.max(0, Math.min(3, profile.keyIntensity));
        profile.exposure = Math.max(1, Math.min(PMNDRS_NIGHT_AUTO_EXPOSURE, profile.exposure));
        profile.reflectionIntensityScale = Math.max(0, Math.min(1.85, profile.reflectionIntensityScale));

        config._calibratedCelestialLightingProfile = profile;
        return profile;
    }

    function isPmndrsLowLightDawn(config) {
        if (!config) {
            return false;
        }
        const sunElevation = typeof config.sunElevationDeg === 'number' ? config.sunElevationDeg : null;
        return getResolvedPmndrsSkyTimePreset(config) === 'dawn' ||
            (config.celestialMode === 'datetime' && sunElevation !== null && sunElevation > -12 && sunElevation < 0);
    }

    function shouldUsePmndrsMoonSceneLight(config) {
        return getPmndrsMoonSceneLightIntensity(config) > 0.01;
    }

    function getPmndrsMoonSceneLightIntensity(config) {
        if (!config || config.moonEnabled === false) {
            return 0;
        }
        const directVisibility = getPmndrsMoonDirectLightVisibility(config);
        if (directVisibility <= 0) {
            return 0;
        }
        const calibratedProfile = getPmndrsCalibratedCelestialLightingProfile(config);
        if (calibratedProfile) {
            return calibratedProfile.moonLightIntensity * directVisibility;
        }
        return isPmndrsPresetTimeNight(config) ? PMNDRS_NIGHT_MOON_LIGHT_INTENSITY * directVisibility : 0;
    }

    function getPmndrsMoonSceneLightDirection(config) {
        if (!config) {
            return null;
        }
        return config.localMoonDirection || config.moonDirection || config.localSunDirection || config.sunDirection || null;
    }

    function getPmndrsLocalDirectionY(direction) {
        return direction && typeof direction.y === 'number' && isFinite(direction.y) ? direction.y : -1;
    }

    function getPmndrsSunDirectLightVisibility(config) {
        return smoothstepNumber(
            PMNDRS_SUN_DIRECT_LIGHT_START_Y,
            PMNDRS_SUN_DIRECT_LIGHT_FULL_Y,
            getPmndrsLocalDirectionY(config && (config.localSunDirection || config.sunDirection))
        );
    }

    function getPmndrsMoonDirectLightVisibility(config) {
        if (!config || config.moonEnabled === false) {
            return 0;
        }

        return smoothstepNumber(
            PMNDRS_MOON_DIRECT_LIGHT_START_Y,
            PMNDRS_MOON_DIRECT_LIGHT_FULL_Y,
            getPmndrsLocalDirectionY(config.localMoonDirection || config.moonDirection)
        );
    }

    function getPmndrsDirectLightVisibility(config, useMoonDirection) {
        return useMoonDirection
            ? getPmndrsMoonDirectLightVisibility(config)
            : getPmndrsSunDirectLightVisibility(config);
    }

    function getPmndrsStarsIntensity(config) {
        if (!config || config.enabled === false) {
            return 0;
        }
        const mode = normalizePmndrsStarsEnabled(config.starsEnabled);
        if (mode === 'off') {
            return 0;
        }
        const calibratedProfile = getPmndrsCalibratedCelestialLightingProfile(config);
        if (calibratedProfile) {
            if (mode === 'on') {
                return Math.max(calibratedProfile.starsIntensity, config.sunElevationDeg < 0 ? PMNDRS_STARS_DAWN_INTENSITY : 0);
            }
            return calibratedProfile.starsIntensity;
        }
        if (isPmndrsPresetTimeNight(config)) {
            return PMNDRS_STARS_NIGHT_INTENSITY;
        }
        if (isPmndrsLowLightDawn(config)) {
            return mode === 'on' ? PMNDRS_STARS_DAWN_INTENSITY : 0;
        }
        const sunElevation = typeof config.sunElevationDeg === 'number' ? config.sunElevationDeg : null;
        if (mode === 'on' && sunElevation !== null && sunElevation < 0) {
            return PMNDRS_STARS_DAWN_INTENSITY;
        }
        return 0;
    }

    function joinPmndrsRuntimeUrl(base, relativePath) {
        const rel = String(relativePath || '').replace(/^\/+/, '');
        if (!base) {
            return rel;
        }
        return `${String(base).replace(/\/+$/, '')  }/${  rel}`;
    }

    function getPmndrsTakramStarsDataUrl() {
        const runtime = window.vrodos_render_runtime || {};
        const configuredUrl = window.vrodos_takram_stars_data_url ||
            runtime.takram_stars_data_url ||
            runtime.takramStarsDataUrl;
        if (typeof configuredUrl === 'string' && configuredUrl.trim()) {
            return configuredUrl.trim();
        }

        const configuredPath = runtime.takram_stars_data_path || runtime.takramStarsDataPath || PMNDRS_TAKRAM_STARS_RELATIVE_PATH;
        const pluginBase = window.VRODOS_PLUGIN_URL ||
            (window.vrodos_data && (window.vrodos_data.pluginUrl || window.vrodos_data.plugin_url || window.vrodos_data.pluginPath)) ||
            '';
        return joinPmndrsRuntimeUrl(pluginBase, configuredPath);
    }

    function getPmndrsDayNightCycleDurationMinutes(self) {
        return clampPmndrsNumber(
            self && self.data ? self.data.pmndrsDayNightCycleDurationMinutes : PMNDRS_DAY_NIGHT_CYCLE_DEFAULT_MINUTES,
            PMNDRS_DAY_NIGHT_CYCLE_MIN_MINUTES,
            PMNDRS_DAY_NIGHT_CYCLE_MAX_MINUTES,
            PMNDRS_DAY_NIGHT_CYCLE_DEFAULT_MINUTES
        );
    }

    function isPmndrsDayNightCycleEnabled(self) {
        return Boolean(self &&
            self.data &&
            self.data.postFXEngine === 'pmndrs' &&
            self.data.pmndrsAtmosphereEnabled !== '0' &&
            readPmndrsAtmosphereBool(self, 'pmndrsDayNightCycleEnabled', false));
    }

    function getPmndrsDayNightCycleRuntimeClock(self) {
        const tickTime = self && typeof self._pmndrsTickTimeMs === 'number' && isFinite(self._pmndrsTickTimeMs)
            ? self._pmndrsTickTimeMs
            : null;
        if (tickTime !== null) {
            return {
                source: 'tick',
                timeMs: tickTime
            };
        }

        return {
            source: 'perf',
            timeMs: typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now()
        };
    }

    function getPmndrsDayNightCycleEffectiveDate(self, celestialDate, celestialUtcTime, durationMinutes) {
        const baseDate = getPmndrsDateObject(celestialDate, celestialUtcTime);
        const baseDateMs = baseDate.getTime();
        const baseDayStartMs = Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate());
        const baseTimeOfDayMs = ((baseDateMs - baseDayStartMs) % PMNDRS_DAY_NIGHT_CYCLE_DAY_MS + PMNDRS_DAY_NIGHT_CYCLE_DAY_MS) % PMNDRS_DAY_NIGHT_CYCLE_DAY_MS;
        const durationMs = Math.max(
            PMNDRS_DAY_NIGHT_CYCLE_MIN_MINUTES * 60000,
            durationMinutes * 60000
        );
        const clock = getPmndrsDayNightCycleRuntimeClock(self);

        let state = self._pmndrsDayNightCycleState;
        if (!state ||
            state.baseDateMs !== baseDateMs ||
            state.baseDayStartMs !== baseDayStartMs ||
            state.durationMinutes !== durationMinutes ||
            state.clockSource !== clock.source) {
            state = {
                baseDateMs,
                baseDayStartMs,
                baseTimeOfDayMs,
                durationMinutes,
                clockSource: clock.source,
                startRuntimeMs: clock.timeMs,
                effectiveDate: new Date(baseDateMs)
            };
            self._pmndrsDayNightCycleState = state;
            return state.effectiveDate;
        }

        const elapsedRuntimeMs = Math.max(0, clock.timeMs - state.startRuntimeMs);
        const simulatedElapsedMs = (elapsedRuntimeMs / durationMs) * PMNDRS_DAY_NIGHT_CYCLE_DAY_MS;
        const wrappedTimeOfDayMs = ((state.baseTimeOfDayMs + simulatedElapsedMs) % PMNDRS_DAY_NIGHT_CYCLE_DAY_MS + PMNDRS_DAY_NIGHT_CYCLE_DAY_MS) % PMNDRS_DAY_NIGHT_CYCLE_DAY_MS;
        state.effectiveDate = new Date(state.baseDayStartMs + wrappedTimeOfDayMs);
        return state.effectiveDate;
    }

    function getPmndrsNightReflectionIntensityScale(self, config, reflectionSource) {
        const source = reflectionSource || (self && typeof self.getEffectiveReflectionSource === 'function'
            ? self.getEffectiveReflectionSource()
            : 'none');
        if (source !== 'hdr' && source !== 'scene-probe' && source !== 'takram-sky') {
            return 0;
        }
        const calibratedProfile = getPmndrsCalibratedCelestialLightingProfile(config);
        if (calibratedProfile) {
            return calibratedProfile.reflectionIntensityScale;
        }
        return isPmndrsPresetTimeNight(config) && (source === 'hdr' || source === 'scene-probe' || source === 'takram-sky')
            ? PMNDRS_NIGHT_REFLECTION_INTENSITY_SCALE
            : 1;
    }

    function getPmndrsHorizonHelperLightConfig(self, preset, atmosphereConfig) {
        const defaults = getPmndrsHorizonHelperLightDefaults(preset);
        let keyColor = '#fff0cf';
        let fillColor = '#cfe3ff';
        const authoredKeyIntensity = readPmndrsAtmosphereNumber(self, 'pmndrsHorizonKeyLightIntensity', 0, 3, defaults.keyIntensity);
        const authoredFillIntensity = readPmndrsAtmosphereNumber(self, 'pmndrsHorizonFillLightIntensity', 0, 3, defaults.fillIntensity);
        let keyIntensity = authoredKeyIntensity;
        let fillIntensity = authoredFillIntensity;
        let useMoonDirection = false;
        let directionOwner = 'sun';
        const sunElevation = atmosphereConfig && typeof atmosphereConfig.sunElevationDeg === 'number'
            ? atmosphereConfig.sunElevationDeg
            : null;
        const skyTimePreset = getResolvedPmndrsSkyTimePreset(atmosphereConfig);

        if (preset === 'clear') {
            keyColor = '#fff4d8';
            fillColor = '#d7e8ff';
        } else if (preset === 'crisp') {
            keyColor = '#fff2d2';
            fillColor = '#d4e4ff';
        }

        const calibratedProfile = getPmndrsCalibratedCelestialLightingProfile(atmosphereConfig);
        if (calibratedProfile) {
            return {
                keyColor: calibratedProfile.keyColor,
                fillColor: calibratedProfile.fillColor,
                keyIntensity: calibratedProfile.keyIntensity,
                fillIntensity: calibratedProfile.fillIntensity,
                authoredKeyIntensity,
                authoredFillIntensity,
                useMoonDirection: calibratedProfile.useMoonDirection,
                directionOwner: calibratedProfile.useMoonDirection ? 'moon' : 'sun'
            };
        }

        if (isPmndrsPresetTimeNight(atmosphereConfig)) {
            const moonEnabled = atmosphereConfig.moonEnabled !== false;
            keyColor = moonEnabled ? '#b8c8ff' : '#39425c';
            fillColor = moonEnabled ? '#3f4f78' : '#111827';
            keyIntensity = Math.min(keyIntensity, moonEnabled ? PMNDRS_NIGHT_MOON_LIGHT_INTENSITY : 0.03);
            fillIntensity = Math.min(fillIntensity, moonEnabled ? 0.08 : 0.015);
            useMoonDirection = moonEnabled;
            directionOwner = moonEnabled ? 'moon' : 'none';
        } else if (atmosphereConfig && (skyTimePreset === 'dawn' || (sunElevation !== null && sunElevation < 0))) {
            keyColor = '#9fb7ff';
            fillColor = '#223354';
            keyIntensity = Math.min(keyIntensity, 0.45);
            fillIntensity = Math.min(fillIntensity, 0.30);
        } else if (atmosphereConfig &&
            (skyTimePreset === 'sunrise' ||
                skyTimePreset === 'golden-hour' ||
                skyTimePreset === 'sunset' ||
                (sunElevation !== null && sunElevation < 18))) {
            keyColor = skyTimePreset === 'sunset' ? '#ff9f64' : (skyTimePreset === 'sunrise' ? '#ffd1a3' : '#ffba7a');
            fillColor = '#5f78ab';
            keyIntensity = Math.max(keyIntensity, skyTimePreset === 'sunset' ? 1.05 : 1.1);
            fillIntensity = Math.min(fillIntensity, 0.12);
        } else if (atmosphereConfig && (skyTimePreset === 'early-morning' || (sunElevation !== null && sunElevation >= 18 && sunElevation < 35))) {
            keyColor = '#fff0cf';
            fillColor = '#c9dcff';
            keyIntensity = Math.max(keyIntensity, 1.55);
            fillIntensity = Math.max(fillIntensity, 0.65);
        } else if (atmosphereConfig &&
            (skyTimePreset === 'midday' ||
                (sunElevation !== null && sunElevation >= 35))) {
            keyColor = preset === 'clear' ? '#fff6e4' : '#fff2d4';
            fillColor = '#d7e8ff';
            keyIntensity = Math.max(keyIntensity, preset === 'clear' ? 2.4 : 2.1);
            fillIntensity = Math.max(fillIntensity, preset === 'clear' ? 1.15 : 0.95);
        } else if (sunElevation !== null && sunElevation >= 18) {
            keyIntensity = Math.max(keyIntensity, 1.7);
            fillIntensity = Math.max(fillIntensity, 0.7);
        }

        return {
            keyColor,
            fillColor,
            keyIntensity,
            fillIntensity,
            authoredKeyIntensity,
            authoredFillIntensity,
            useMoonDirection,
            directionOwner
        };
    }

    function getPmndrsTakramIndirectProfile(atmosphereConfig) {
        const skyTimePreset = getResolvedPmndrsSkyTimePreset(atmosphereConfig);
        const sunElevation = atmosphereConfig && typeof atmosphereConfig.sunElevationDeg === 'number'
            ? atmosphereConfig.sunElevationDeg
            : null;

        if (shouldUsePmndrsDynamicIndirectProfile(atmosphereConfig, skyTimePreset, sunElevation)) {
            return getPmndrsDynamicIndirectLightingProfile(atmosphereConfig, sunElevation);
        }

        const calibratedProfile = getPmndrsCalibratedCelestialLightingProfile(atmosphereConfig);
        if (calibratedProfile) {
            return {
                skyLightIntensity: calibratedProfile.skyLightIntensity,
                pbrFillIntensity: calibratedProfile.pbrFillIntensity,
                ambientBounceIntensity: calibratedProfile.ambientBounceIntensity,
                groundFillColor: calibratedProfile.groundFillColor
            };
        }

        if (isPmndrsPresetTimeNight(atmosphereConfig)) {
            return {
                skyLightIntensity: 0.28,
                pbrFillIntensity: 0.16,
                ambientBounceIntensity: 0.02,
                groundFillColor: '#0a0d14'
            };
        }
        if (skyTimePreset === 'dawn' || (sunElevation !== null && sunElevation < 0)) {
            return {
                skyLightIntensity: 0.85,
                pbrFillIntensity: 0.55,
                ambientBounceIntensity: 0.14,
                groundFillColor: '#303848'
            };
        }
        if (
            skyTimePreset === 'sunrise' ||
            skyTimePreset === 'golden-hour' ||
            skyTimePreset === 'sunset' ||
            (sunElevation !== null && sunElevation < 18)
        ) {
            return {
                skyLightIntensity: 1.45,
                pbrFillIntensity: 1.02,
                ambientBounceIntensity: 0.34,
                groundFillColor: '#684a36'
            };
        }
        if (skyTimePreset === 'early-morning' || (sunElevation !== null && sunElevation < 35)) {
            return {
                skyLightIntensity: 1.58,
                pbrFillIntensity: 1.14,
                ambientBounceIntensity: 0.46,
                groundFillColor: '#56605a'
            };
        }
        return {
            skyLightIntensity: 1.7,
            pbrFillIntensity: 1.24,
            ambientBounceIntensity: 0.54,
            groundFillColor: '#68675d'
        };
    }

    function getPmndrsDynamicIndirectLightingProfile(atmosphereConfig, sunElevation) {
        const profile = samplePmndrsIndirectLightingSequence([
            {
                elevation: -18,
                skyLightIntensity: 0.50,
                pbrFillIntensity: 0.38,
                ambientBounceIntensity: 0.08,
                groundFillColor: '#111722'
            },
            {
                elevation: -12,
                skyLightIntensity: 0.58,
                pbrFillIntensity: 0.46,
                ambientBounceIntensity: 0.12,
                groundFillColor: '#1b2434'
            },
            {
                elevation: -6,
                skyLightIntensity: 0.82,
                pbrFillIntensity: 0.64,
                ambientBounceIntensity: 0.18,
                groundFillColor: '#283347'
            },
            {
                elevation: 0,
                skyLightIntensity: 1.18,
                pbrFillIntensity: 0.88,
                ambientBounceIntensity: 0.26,
                groundFillColor: '#4d5160'
            },
            {
                elevation: 6,
                skyLightIntensity: 1.45,
                pbrFillIntensity: 1.02,
                ambientBounceIntensity: 0.34,
                groundFillColor: '#684a36'
            },
            {
                elevation: 22,
                skyLightIntensity: 1.56,
                pbrFillIntensity: 1.12,
                ambientBounceIntensity: 0.42,
                groundFillColor: '#56605a'
            },
            {
                elevation: 62,
                skyLightIntensity: 1.68,
                pbrFillIntensity: 1.18,
                ambientBounceIntensity: 0.46,
                groundFillColor: '#68675d'
            }
        ], sunElevation);
        const horizonWarmth = smoothstepNumber(-4, 6, sunElevation) * (1 - smoothstepNumber(12, 28, sunElevation));
        const settingBlend = getPmndrsSettingSunBlend(atmosphereConfig, sunElevation);

        profile.groundFillColor = lerpPmndrsColor(
            profile.groundFillColor,
            lerpPmndrsColor('#4f5262', '#684a36', settingBlend),
            horizonWarmth * 0.6
        );

        return profile;
    }

    function samplePmndrsIndirectLightingSequence(sequence, sunElevation) {
        if (!sequence || !sequence.length) {
            return {
                skyLightIntensity: 1.2,
                pbrFillIntensity: 0.95,
                ambientBounceIntensity: 0.32,
                groundFillColor: '#56605a'
            };
        }
        if (sunElevation <= sequence[0].elevation) {
            return clonePmndrsLightingAnchor(sequence[0]);
        }

        for (let i = 1; i < sequence.length; i += 1) {
            const previous = sequence[i - 1];
            const next = sequence[i];
            if (sunElevation <= next.elevation) {
                const mix = smoothstepNumber(previous.elevation, next.elevation, sunElevation);
                return {
                    skyLightIntensity: lerpNumber(previous.skyLightIntensity, next.skyLightIntensity, mix),
                    pbrFillIntensity: lerpNumber(previous.pbrFillIntensity, next.pbrFillIntensity, mix),
                    ambientBounceIntensity: lerpNumber(previous.ambientBounceIntensity, next.ambientBounceIntensity, mix),
                    groundFillColor: lerpPmndrsColor(previous.groundFillColor, next.groundFillColor, mix)
                };
            }
        }

        return clonePmndrsLightingAnchor(sequence[sequence.length - 1]);
    }

    function getPmndrsTakramSkyLightIntensity(helperConfig, atmosphereConfig) {
        const authoredFill = helperConfig && typeof helperConfig.authoredFillIntensity === 'number'
            ? helperConfig.authoredFillIntensity
            : (helperConfig && typeof helperConfig.fillIntensity === 'number' ? helperConfig.fillIntensity : null);
        const fallbackFill = authoredFill !== null
            ? authoredFill
            : 0.45;
        const profile = getPmndrsTakramIndirectProfile(atmosphereConfig);

        if (isPmndrsDynamicCelestialConfig(atmosphereConfig)) {
            return Math.min(4.0, Math.max(0, profile.skyLightIntensity));
        }

        if (isPmndrsPresetTimeNight(atmosphereConfig)) {
            return profile.skyLightIntensity;
        }

        return Math.min(4.0, Math.max(fallbackFill, profile.skyLightIntensity));
    }

    function getPmndrsTakramPbrFillIntensity(helperConfig, atmosphereConfig) {
        const authoredFill = helperConfig && typeof helperConfig.authoredFillIntensity === 'number'
            ? helperConfig.authoredFillIntensity
            : null;
        const profile = getPmndrsTakramIndirectProfile(atmosphereConfig);

        if (isPmndrsDynamicCelestialConfig(atmosphereConfig)) {
            return Math.min(3.0, Math.max(0, profile.pbrFillIntensity));
        }

        if (isPmndrsPresetTimeNight(atmosphereConfig)) {
            return profile.pbrFillIntensity;
        }

        return Math.min(3.0, Math.max(authoredFill !== null ? authoredFill : 0, profile.pbrFillIntensity));
    }

    function getPmndrsTakramAmbientBounceIntensity(atmosphereConfig) {
        const profile = getPmndrsTakramIndirectProfile(atmosphereConfig);
        return Math.max(0, Math.min(0.95, profile.ambientBounceIntensity || 0));
    }

    function getPmndrsFallbackAmbientFillIntensity(helperConfig, atmosphereConfig) {
        const profile = getPmndrsTakramIndirectProfile(atmosphereConfig);
        const authoredFill = helperConfig && typeof helperConfig.authoredFillIntensity === 'number'
            ? helperConfig.authoredFillIntensity
            : null;
        const helperFill = helperConfig && typeof helperConfig.fillIntensity === 'number'
            ? helperConfig.fillIntensity
            : 0;

        if (isPmndrsPresetTimeNight(atmosphereConfig)) {
            return Math.min(0.18, Math.max(helperFill, profile.pbrFillIntensity));
        }

        // This fallback is a temporary bridge while Takram precomputes its
        // irradiance textures. Use less than the final hemisphere/probe fill
        // because AmbientLight has no directionality and can flatten shadows.
        const authoredBridge = authoredFill !== null ? authoredFill * 0.8 : 0;
        const profileBridge = profile.pbrFillIntensity * 0.65;
        return Math.min(0.85, Math.max(helperFill, authoredBridge, profileBridge));
    }

    function getPmndrsTakramGroundFillColor(atmosphereConfig) {
        return getPmndrsTakramIndirectProfile(atmosphereConfig).groundFillColor;
    }

    function getPmndrsRuntimeLightTimeMs(self) {
        return self && typeof self._pmndrsTickTimeMs === 'number' && isFinite(self._pmndrsTickTimeMs)
            ? self._pmndrsTickTimeMs
            : (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());
    }

    function getPmndrsRuntimeLightingSmoothingMs(config) {
        return config && config.dayNightCycleEnabled ? 1200 : 0;
    }

    function getPmndrsRuntimeIndirectLightingSmoothingMs(config) {
        if (!(config && config.dayNightCycleEnabled)) {
            return 0;
        }

        const durationMinutes = typeof config.dayNightCycleDurationMinutes === 'number' && isFinite(config.dayNightCycleDurationMinutes)
            ? config.dayNightCycleDurationMinutes
            : PMNDRS_DAY_NIGHT_CYCLE_DEFAULT_MINUTES;
        const cycleMs = Math.max(PMNDRS_DAY_NIGHT_CYCLE_MIN_MINUTES * 60000, durationMinutes * 60000);
        return Math.max(2800, Math.min(9000, cycleMs * 0.08));
    }

    function getPmndrsRuntimeLightSmoothingAlpha(self, key, smoothingMs) {
        const now = getPmndrsRuntimeLightTimeMs(self);
        self._pmndrsRuntimeLightSmoothTimes = self._pmndrsRuntimeLightSmoothTimes || {};
        const previous = self._pmndrsRuntimeLightSmoothTimes[key];
        self._pmndrsRuntimeLightSmoothTimes[key] = now;
        if (!smoothingMs || smoothingMs <= 0) {
            return 1;
        }
        if (typeof previous !== 'number') {
            return 0;
        }

        const deltaMs = Math.max(0, Math.min(250, now - previous));
        return deltaMs > 0 ? 1 - Math.exp(-deltaMs / smoothingMs) : 0;
    }

    function smoothPmndrsRuntimeLightValue(self, key, target, smoothingMs, currentValue) {
        if (!isFinite(target)) {
            return 0;
        }

        self._pmndrsRuntimeLightSmoothValues = self._pmndrsRuntimeLightSmoothValues || {};
        const alpha = getPmndrsRuntimeLightSmoothingAlpha(self, key, smoothingMs);
        if (typeof self._pmndrsRuntimeLightSmoothValues[key] !== 'number') {
            self._pmndrsRuntimeLightSmoothValues[key] = typeof currentValue === 'number' && isFinite(currentValue)
                ? currentValue
                : target;
        }
        if (alpha >= 1) {
            self._pmndrsRuntimeLightSmoothValues[key] = target;
            return target;
        }

        const previous = self._pmndrsRuntimeLightSmoothValues[key];
        const value = previous + ((target - previous) * alpha);
        self._pmndrsRuntimeLightSmoothValues[key] = value;
        return value;
    }

    function smoothPmndrsRuntimeLightColor(self, key, targetColor, smoothingMs, currentColor) {
        self._pmndrsRuntimeLightSmoothColors = self._pmndrsRuntimeLightSmoothColors || {};
        const alpha = getPmndrsRuntimeLightSmoothingAlpha(self, `${key}:color`, smoothingMs);
        const color = new THREE.Color(targetColor || '#ffffff');

        if (!self._pmndrsRuntimeLightSmoothColors[key]) {
            self._pmndrsRuntimeLightSmoothColors[key] = currentColor && currentColor.isColor
                ? currentColor.clone()
                : color.clone();
        }

        if (alpha >= 1) {
            self._pmndrsRuntimeLightSmoothColors[key] = color;
            return color;
        }

        self._pmndrsRuntimeLightSmoothColors[key].lerp(color, alpha);
        return self._pmndrsRuntimeLightSmoothColors[key];
    }

    function getPmndrsAtmosphereResourceProfile(self, renderer) {
        const quality = normalizePmndrsAtmosphereQuality(self && typeof self.getPmndrsAtmosphereQuality === 'function'
            ? self.getPmndrsAtmosphereQuality()
            : (self && self.data ? self.data.pmndrsAtmosphereQuality : 'balanced'));
        if (shouldUseVrTakramVisibleSky(self)) {
            const type = typeof THREE.HalfFloatType !== 'undefined' ? THREE.HalfFloatType : THREE.FloatType;
            return {
                quality: 'vr-takram-sky',
                type,
                useFloat: type === THREE.FloatType,
                higherOrderScattering: false,
                combinedScattering: true,
                signature: [
                    'vr-takram-sky',
                    type === THREE.FloatType ? 'float' : 'half',
                    'basic',
                    'combined'
                ].join(':')
            };
        }
        const supportsFloatLinear = Boolean(renderer && renderer.extensions && renderer.extensions.get('OES_texture_float_linear'));
        const canUseFloat = Boolean(renderer &&
            renderer.capabilities &&
            renderer.capabilities.isWebGL2 &&
            typeof THREE.FloatType !== 'undefined' &&
            supportsFloatLinear);
        const wantsHighPrecision = quality === 'quality' || quality === 'cinematic' || quality === 'custom' || quality === 'balanced';
        const type = wantsHighPrecision ? THREE.FloatType : THREE.HalfFloatType;
        const higherOrderScattering = quality !== 'performance' || shouldUsePmndrsTakramHorizonPath(self);
        // Stay aligned with Takram's default precompute path and only scale the
        // precision/performance envelope around it.
        const combinedScattering = true;

        return {
            quality,
            type,
            useFloat: type === THREE.FloatType,
            higherOrderScattering,
            combinedScattering,
            signature: [
                quality,
                type === THREE.FloatType ? 'float' : 'half',
                higherOrderScattering ? 'higher' : 'basic',
                combinedScattering ? 'combined' : 'split'
            ].join(':')
        };
    }

    function readPmndrsAtmosphereNumber(self, key, min, max, fallback) {
        if (RuntimeSettings.readNumber) {
            return RuntimeSettings.readNumber(self && self.data, key, fallback, min, max);
        }

        if (!self || !self.data) {
            return fallback;
        }
        return clampPmndrsNumber(self.data[key], min, max, fallback);
    }

    function readPmndrsAtmosphereBool(self, key, fallback) {
        if (RuntimeSettings.readBool) {
            return RuntimeSettings.readBool(self && self.data, key, fallback);
        }

        if (!self || !self.data || self.data[key] === undefined) {
            return Boolean(fallback);
        }
        const value = self.data[key];
        return value === true || value === 'true' || value === '1' || value === 1;
    }

    function normalizePmndrsColor(value, fallback) {
        const raw = (typeof value === 'string') ? value.trim() : '';
        if (!/^#?[0-9a-fA-F]{6}$/.test(raw)) {
            return fallback;
        }
        return raw.charAt(0) === '#' ? raw : (`#${  raw}`);
    }

    function hasPmndrsDebugFlag(debugKey, queryKey) {
        if (window.VRODOS_DEBUG && window.VRODOS_DEBUG[debugKey] === true) {
            return true;
        }

        if (typeof window.location === 'undefined' || !window.location.search) {
            return false;
        }

        try {
            const params = new URLSearchParams(window.location.search);
            return params.get(queryKey) === '1';
        } catch (err) {
            return false;
        }
    }

    function readPmndrsDebugNumber(debugKey, queryKey, fallback, minValue, maxValue) {
        let value = null;
        if (window.VRODOS_DEBUG && typeof window.VRODOS_DEBUG[debugKey] === 'number') {
            value = window.VRODOS_DEBUG[debugKey];
        } else if (typeof window.location !== 'undefined' && window.location.search) {
            try {
                const params = new URLSearchParams(window.location.search);
                if (params.has(queryKey)) {
                    value = Number(params.get(queryKey));
                }
            } catch (err) {
                value = null;
            }
        }

        if (!Number.isFinite(value)) {
            return fallback;
        }

        return Math.max(minValue, Math.min(maxValue, value));
    }

    function getVrTakramSkyDirectExposure() {
        return readPmndrsDebugNumber(
            'vrTakramSkyDirectExposure',
            'vrodos_vr_takram_sky_exposure',
            VR_TAKRAM_SKY_DIRECT_EXPOSURE,
            1,
            160
        );
    }

    function getRuntimeNowMs() {
        return typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
    }

    function getVrTakramSkyRevealWarmupMs() {
        return readPmndrsDebugNumber(
            'vrTakramSkyRevealWarmupMs',
            'vrodos_vr_takram_sky_reveal_delay_ms',
            VR_TAKRAM_SKY_REVEAL_WARMUP_MS,
            0,
            15000
        );
    }

    function getTerrainShadowDepthOffset() {
        return {
            factor: readPmndrsDebugNumber(
                'terrainShadowDepthOffsetFactor',
                'vrodos_debug_terrain_shadow_depth_offset_factor',
                TERRAIN_SHADOW_DEPTH_OFFSET_FACTOR,
                0,
                8
            ),
            units: readPmndrsDebugNumber(
                'terrainShadowDepthOffsetUnits',
                'vrodos_debug_terrain_shadow_depth_offset_units',
                TERRAIN_SHADOW_DEPTH_OFFSET_UNITS,
                0,
                16
            )
        };
    }

    function getPmndrsDayNightShadowRadius(self) {
        const shadowQuality = self && self.data && self.data.shadowQuality === 'high' ? 'high' : 'medium';
        const fallback = shadowQuality === 'high'
            ? PMNDRS_DAY_NIGHT_SHADOW_RADIUS_HIGH
            : PMNDRS_DAY_NIGHT_SHADOW_RADIUS_MEDIUM;
        return readPmndrsDebugNumber(
            'dayNightShadowRadius',
            'vrodos_debug_day_night_shadow_radius',
            fallback,
            0,
            6
        );
    }

    function objectEntityChainHas(object, predicate) {
        let current = object;
        while (current) {
            if (current.el && predicate(current.el)) {
                return true;
            }
            current = current.parent || null;
        }
        return false;
    }

    function entityHasClass(entityEl, className) {
        return Boolean(entityEl && entityEl.classList && entityEl.classList.contains(className));
    }

    function isLightingExcludedEntity(entityEl) {
        if (!entityEl) {
            return false;
        }

        const id = entityEl.id || '';
        const tagName = entityEl.tagName ? entityEl.tagName.toUpperCase() : '';

        return tagName === 'A-SKY' ||
            tagName === 'A-SUN-SKY' ||
            id === 'cameraA' ||
            id === 'default-sky' ||
            id === 'default-sun' ||
            entityHasClass(entityEl, 'avatar') ||
            entityHasClass(entityEl, 'non-vr') ||
            entityEl.hasAttribute('data-vrodos-overlay-ui') ||
            entityEl.hasAttribute('data-vrodos-photoreal-light');
    }

    function isDecorativeLightingEntity(entityEl) {
        if (!entityEl) {
            return false;
        }

        const id = entityEl.id || '';
        return entityEl.hasAttribute('data-vrodos-world-lighting') ||
            id.indexOf('video-display_') === 0 ||
            id.indexOf('image-display_') === 0 ||
            id.indexOf('button_poi_') === 0 ||
            entityEl.hasAttribute('link-listener') ||
            entityEl.hasAttribute('data-vrodos-video-src') ||
            entityHasClass(entityEl, 'menu-button');
    }

    function isFlatMediaShadowEntity(entityEl) {
        if (!entityEl) {
            return false;
        }

        const id = entityEl.id || '';
        return id.indexOf('video-display_') === 0 ||
            id.indexOf('image-display_') === 0 ||
            entityEl.hasAttribute('data-vrodos-video-src');
    }

    function isFlatMediaShadowCastingEnabled() {
        if (hasPmndrsDebugFlag('castFlatMediaShadows', 'vrodos_debug_cast_flat_media_shadows')) {
            return true;
        }

        const sceneEl = typeof document !== 'undefined' ? document.querySelector('a-scene') : null;
        const sceneSettings = sceneEl && sceneEl.components ? sceneEl.components['scene-settings'] : null;
        const value = sceneSettings && sceneSettings.data ? sceneSettings.data.flatMediaShadowCasting : '1';
        return value === true || value === 'true' || value === '1' || value === 1 ||
            typeof value === 'undefined' || value === null || value === '';
    }

    function normalizeShadowRole(value) {
        const role = String(value || '').trim().toLowerCase();
        if (role === 'caster-receiver' || role === 'receiver' || role === 'none') {
            return role;
        }
        return null;
    }

    function isNavmeshShadowEntity(entityEl) {
        return Boolean(entityEl && (entityHasClass(entityEl, 'vrodos-navmesh') || entityEl.hasAttribute('data-vrodos-navmesh')));
    }

    function isTerrainShadowEntity(entityEl) {
        return Boolean(entityEl && (
            isNavmeshShadowEntity(entityEl) ||
            entityEl.getAttribute('data-vrodos-collision-category') === 'walkable-surface' ||
            entityEl.getAttribute('data-vrodos-material-role') === 'terrain-matte'
        ));
    }

    function getEntityShadowRole(entityEl) {
        if (!entityEl) {
            return null;
        }

        if (entityEl.hasAttribute('data-vrodos-collision-hidden') ||
            entityEl.hasAttribute('vrodos-collider-helper') ||
            entityEl.hasAttribute('data-vrodos-overlay-ui')) {
            return 'none';
        }

        if (isNavmeshShadowEntity(entityEl) && entityEl.getAttribute('data-vrodos-shadow-role-authored') !== 'true') {
            return 'receiver';
        }

        const authoredRole = normalizeShadowRole(entityEl.getAttribute('data-vrodos-shadow-role'));
        if (authoredRole) {
            if (isFlatMediaShadowEntity(entityEl) && !isFlatMediaShadowCastingEnabled()) {
                return 'receiver';
            }
            return authoredRole;
        }

        if (isNavmeshShadowEntity(entityEl)) {
            return 'receiver';
        }

        return null;
    }

    function getObjectShadowRole(object) {
        let current = object;
        let resolvedRole = null;
        let hasFlatMedia = false;

        while (current) {
            if (current.el) {
                if (isFlatMediaShadowEntity(current.el)) {
                    hasFlatMedia = true;
                }
                const role = getEntityShadowRole(current.el);
                if (role === 'none') {
                    return 'none';
                }
                if (role && !resolvedRole) {
                    resolvedRole = role;
                }
            }
            current = current.parent || null;
        }

        if (hasFlatMedia) {
            return isFlatMediaShadowCastingEnabled() ? 'caster-receiver' : 'receiver';
        }

        return resolvedRole;
    }

    function isVrodosManagedShadowLight(node) {
        return Boolean(
            node &&
            (
                (node.userData && node.userData.vrodosPmndrsTakramLightSource) ||
                objectEntityChainHas(node, (entityEl) => (
                    entityEl.hasAttribute('data-vrodos-photoreal-light')
                ))
            )
        );
    }

    function getMaterialList(material) {
        if (!material) {
            return [];
        }
        return Array.isArray(material) ? material : [material];
    }

    function isShadowEligibleMaterial(material) {
        const materials = getMaterialList(material);
        if (!materials.length) {
            return true;
        }

        return materials.some((entry) => {
            if (!entry) {
                return false;
            }
            const opacity = typeof entry.opacity === 'number' ? entry.opacity : 1;
            const alphaTest = typeof entry.alphaTest === 'number' ? entry.alphaTest : 0;
            if (entry.visible === false) {
                return false;
            }
            return !entry.transparent || opacity >= 0.98 || alphaTest >= 0.1;
        });
    }

    function isHiddenNavmeshMaterial(material) {
        const materials = getMaterialList(material);
        if (!materials.length) {
            return false;
        }

        return materials.every((entry) => Boolean(entry &&
            entry.userData &&
            entry.userData.vrodosHiddenNavmeshMaterial === true));
    }

    function isWorldLightingParticipantMesh(node) {
        if (!node || !node.isMesh) {
            return false;
        }

        if (isHiddenNavmeshMaterial(node.material)) {
            return false;
        }

        if (objectEntityChainHas(node, isLightingExcludedEntity)) {
            return false;
        }

        const shadowRole = getObjectShadowRole(node);
        if (shadowRole === 'none') {
            return false;
        }

        if (shadowRole === 'receiver' || shadowRole === 'caster-receiver') {
            return true;
        }

        return objectEntityChainHas(node, isDecorativeLightingEntity) || isShadowEligibleMaterial(node.material);
    }

    function isTerrainSelfShadowCasterMesh(node) {
        return Boolean(
            node &&
            node.isMesh &&
            objectEntityChainHas(node, isTerrainShadowEntity) &&
            getObjectShadowRole(node) === 'caster-receiver'
        );
    }

    function syncTerrainShadowDepthMaterial(self, node, enabled) {
        if (!node || !node.isMesh) {
            return;
        }

        node.userData = node.userData || {};
        const existingDepthMaterial = node.userData.vrodosTerrainShadowDepthMaterial || null;
        const disabled = hasPmndrsDebugFlag(
            'disableTerrainShadowDepthOffset',
            'vrodos_debug_disable_terrain_shadow_depth_offset'
        );

        if (!enabled || disabled || typeof THREE.MeshDepthMaterial !== 'function') {
            if (existingDepthMaterial && node.customDepthMaterial === existingDepthMaterial) {
                node.customDepthMaterial = node.userData.vrodosTerrainShadowPreviousCustomDepthMaterial || undefined;
            }
            return;
        }

        let depthMaterial = existingDepthMaterial;
        if (!depthMaterial) {
            depthMaterial = new THREE.MeshDepthMaterial({
                depthPacking: typeof THREE.RGBADepthPacking !== 'undefined' ? THREE.RGBADepthPacking : undefined
            });
            depthMaterial.name = 'vrodosTerrainShadowDepthMaterial';
            depthMaterial.userData = depthMaterial.userData || {};
            depthMaterial.userData.vrodosTerrainShadowDepthMaterial = true;
            node.userData.vrodosTerrainShadowPreviousCustomDepthMaterial = node.customDepthMaterial || null;
            node.userData.vrodosTerrainShadowDepthMaterial = depthMaterial;
            if (self && self.runtimeResources && typeof self.runtimeResources.track === 'function') {
                self.runtimeResources.track(depthMaterial);
            }
        }

        const offset = getTerrainShadowDepthOffset();
        if (typeof THREE.RGBADepthPacking !== 'undefined') {
            depthMaterial.depthPacking = THREE.RGBADepthPacking;
        }
        depthMaterial.polygonOffset = true;
        depthMaterial.polygonOffsetFactor = offset.factor;
        depthMaterial.polygonOffsetUnits = offset.units;
        depthMaterial.needsUpdate = true;
        node.customDepthMaterial = depthMaterial;
    }

    function hasSelfShadowingTerrain(self) {
        if (!self || !self.el || typeof self.el.querySelectorAll !== 'function') {
            return false;
        }

        const terrainEls = self.el.querySelectorAll('[data-vrodos-navmesh], [data-vrodos-collision-category="walkable-surface"], [data-vrodos-material-role="terrain-matte"]');
        for (let i = 0; i < terrainEls.length; i++) {
            if (isTerrainShadowEntity(terrainEls[i]) && getEntityShadowRole(terrainEls[i]) === 'caster-receiver') {
                return true;
            }
        }

        return false;
    }

    function getTerrainSafeContactShadowSettings(self, settings) {
        if (!settings || !hasSelfShadowingTerrain(self)) {
            return settings;
        }

        const preset = typeof self.getContactShadowPreset === 'function'
            ? self.getContactShadowPreset()
            : (self.data && self.data.contactShadowPreset);
        if (preset !== 'strong') {
            return settings;
        }

        const shadowQuality = self.data && self.data.shadowQuality === 'high' ? 'high' : 'medium';
        const safeSettings = Object.assign({}, settings);
        const biasFloor = shadowQuality === 'high' ? -0.00012 : -0.00009;
        const normalBiasFloor = shadowQuality === 'high' ? 0.032 : 0.024;

        if (typeof safeSettings.bias === 'number') {
            safeSettings.bias = Math.min(-0.00001, Math.max(safeSettings.bias, biasFloor));
        }
        if (typeof safeSettings.normalBias === 'number') {
            safeSettings.normalBias = Math.max(safeSettings.normalBias, normalBiasFloor);
        }

        return safeSettings;
    }

    function collectAdaptiveShadowBounds(self) {
        const sceneObj = self && self.el ? self.el.object3D : null;
        if (!sceneObj) {
            return null;
        }

        const camera = self.el.camera || null;
        const cameraPosition = new THREE.Vector3();
        const canUseCamera = Boolean(camera && typeof camera.getWorldPosition === 'function');
        const maxFitDistance = self.data && self.data.shadowQuality === 'high' ? 180 : 120;
        const maxFitDistanceSq = maxFitDistance * maxFitDistance;
        const focusedBounds = new THREE.Box3();
        const fallbackBounds = new THREE.Box3();
        const cameraLocalBounds = new THREE.Box3();
        const nodeBounds = new THREE.Box3();
        const nodeCenter = new THREE.Vector3();
        const clippedNodeBounds = new THREE.Box3();
        let hasFocusedBounds = false;
        let hasFallbackBounds = false;

        if (canUseCamera) {
            camera.getWorldPosition(cameraPosition);
            cameraLocalBounds.set(
                new THREE.Vector3(
                    cameraPosition.x - maxFitDistance,
                    cameraPosition.y - maxFitDistance,
                    cameraPosition.z - maxFitDistance
                ),
                new THREE.Vector3(
                    cameraPosition.x + maxFitDistance,
                    cameraPosition.y + maxFitDistance,
                    cameraPosition.z + maxFitDistance
                )
            );
        }

        sceneObj.updateMatrixWorld(true);
        sceneObj.traverse((node) => {
            if (!isWorldLightingParticipantMesh(node) || !node.geometry) {
                return;
            }

            nodeBounds.setFromObject(node);
            if (nodeBounds.isEmpty()) {
                return;
            }

            fallbackBounds.union(nodeBounds);
            hasFallbackBounds = true;

            if (!canUseCamera) {
                focusedBounds.union(nodeBounds);
                hasFocusedBounds = true;
                return;
            }

            nodeBounds.getCenter(nodeCenter);
            if (nodeBounds.containsPoint(cameraPosition)) {
                clippedNodeBounds.copy(nodeBounds).intersect(cameraLocalBounds);
                if (!clippedNodeBounds.isEmpty()) {
                    focusedBounds.union(clippedNodeBounds);
                    hasFocusedBounds = true;
                }
                return;
            }

            if (nodeCenter.distanceToSquared(cameraPosition) <= maxFitDistanceSq) {
                focusedBounds.union(nodeBounds);
                hasFocusedBounds = true;
            }
        });

        if (hasFocusedBounds) {
            return focusedBounds;
        }

        return hasFallbackBounds ? fallbackBounds : null;
    }

    function collectDirectionalShadowLights(self) {
        const lights = [];
        const sceneObj = self && self.el ? self.el.object3D : null;
        if (!sceneObj) {
            return lights;
        }

        sceneObj.traverse((node) => {
            if (node && node.isDirectionalLight && node.shadow) {
                lights.push(node);
            }
        });

        return lights;
    }

    function getBoundsRadius(bounds) {
        if (!bounds || bounds.isEmpty()) {
            return 0;
        }

        const size = new THREE.Vector3();
        bounds.getSize(size);
        return Math.max(size.x, size.y, size.z) * 0.5;
    }

    function getDirectionalShadowDistanceForScene(self, fallback) {
        const bounds = collectAdaptiveShadowBounds(self);
        const radius = getBoundsRadius(bounds);
        const base = Number.isFinite(Number(fallback)) ? Number(fallback) : 28;
        if (radius <= 0) {
            return base;
        }

        return Math.max(base, Math.min(20000, radius * 2.8));
    }

    function fitDirectionalShadowCameraToBounds(light, bounds, shadowQuality, options) {
        if (!light || !light.shadow || !light.shadow.camera || !bounds || bounds.isEmpty()) {
            return;
        }

        const opts = options || {};
        const owner = opts.self || null;
        const stableFrustum = opts.stableFrustum === true;
        const shadowCamera = light.shadow.camera;
        const boundsCenter = new THREE.Vector3();
        const corners = [
            new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z),
            new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.max.z),
            new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.min.z),
            new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.max.z),
            new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.min.z),
            new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.max.z),
            new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.min.z),
            new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z)
        ];
        const boxSize = new THREE.Vector3();
        const lightSpacePoint = new THREE.Vector3();
        const lightOffset = new THREE.Vector3();
        const targetPosition = new THREE.Vector3();
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        bounds.getSize(boxSize);
        const boundsRadius = Math.max(boxSize.x, boxSize.y, boxSize.z) * 0.5;
        const boundsSphereRadius = Math.max(boundsRadius, boxSize.length() * 0.5);
        const margin = Math.max(shadowQuality === 'high' ? 4 : 6, boundsRadius * 0.08);
        const minExtent = shadowQuality === 'high' ? 18 : 24;

        light.updateMatrixWorld(true);
        bounds.getCenter(boundsCenter);
        if (light.target) {
            light.target.updateMatrixWorld(true);
            targetPosition.setFromMatrixPosition(light.target.matrixWorld);
            lightOffset.setFromMatrixPosition(light.matrixWorld).sub(targetPosition);
            if (lightOffset.lengthSq() > 0.0001) {
                const fitDistance = stableFrustum
                    ? Math.max(boundsSphereRadius * 2.5, 64)
                    : Math.max(boundsRadius * 2.5, 64);
                lightOffset.normalize().multiplyScalar(fitDistance);
                light.position.copy(boundsCenter).add(lightOffset);
                light.target.position.copy(boundsCenter);
                light.target.updateMatrixWorld(true);
                light.updateMatrixWorld(true);
            }
        }
        capturePresentedShadowLightBase(owner, light);
        if (light.shadow && typeof light.shadow.updateMatrices === 'function') {
            light.shadow.updateMatrices(light);
        }
        shadowCamera.updateMatrixWorld(true);

        corners.forEach((corner) => {
            lightSpacePoint.copy(corner).applyMatrix4(shadowCamera.matrixWorldInverse);
            minX = Math.min(minX, lightSpacePoint.x);
            maxX = Math.max(maxX, lightSpacePoint.x);
            minY = Math.min(minY, lightSpacePoint.y);
            maxY = Math.max(maxY, lightSpacePoint.y);
            minZ = Math.min(minZ, lightSpacePoint.z);
            maxZ = Math.max(maxZ, lightSpacePoint.z);
        });

        if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY) || !isFinite(minZ) || !isFinite(maxZ)) {
            return;
        }

        if (stableFrustum) {
            const stableMargin = Math.max(shadowQuality === 'high' ? 4 : 6, boundsSphereRadius * 0.08);
            const stableExtent = Math.max(minExtent, boundsSphereRadius + stableMargin);
            const lightDistance = Math.max(lightOffset.length(), boundsSphereRadius * 2.5, 64);
            shadowCamera.left = -stableExtent;
            shadowCamera.right = stableExtent;
            shadowCamera.bottom = -stableExtent;
            shadowCamera.top = stableExtent;
            shadowCamera.near = Math.max(0.1, lightDistance - boundsSphereRadius - stableMargin);
            shadowCamera.far = Math.max(shadowCamera.near + 1, lightDistance + boundsSphereRadius + stableMargin);
        } else {
            if ((maxX - minX) < minExtent) {
                const pad = (minExtent - (maxX - minX)) * 0.5;
                minX -= pad;
                maxX += pad;
            }
            if ((maxY - minY) < minExtent) {
                const pad = (minExtent - (maxY - minY)) * 0.5;
                minY -= pad;
                maxY += pad;
            }

            shadowCamera.left = minX - margin;
            shadowCamera.right = maxX + margin;
            shadowCamera.bottom = minY - margin;
            shadowCamera.top = maxY + margin;
            shadowCamera.near = Math.max(0.1, -maxZ - margin);
            shadowCamera.far = Math.max(shadowCamera.near + 1, -minZ + margin);
        }

        if (typeof shadowCamera.updateProjectionMatrix === 'function') {
            shadowCamera.updateProjectionMatrix();
        }
        if (light.shadow && typeof light.shadow.updateMatrices === 'function') {
            light.shadow.updateMatrices(light);
        }

        light.userData = light.userData || {};
        light.userData.vrodosAdaptiveShadowFitted = true;
        light.userData.vrodosAdaptiveShadowStableFrustum = stableFrustum;
        light.shadow.needsUpdate = true;
    }

    function applyAdaptiveShadowFit(self, options) {
        const shadowQuality = self && self.data ? (self.data.shadowQuality || 'medium') : 'medium';
        if (shadowQuality === 'off') {
            return;
        }

        const bounds = collectAdaptiveShadowBounds(self);
        if (!bounds) {
            return;
        }

        self._vrodosAdaptiveShadowCenter = self._vrodosAdaptiveShadowCenter || new THREE.Vector3();
        bounds.getCenter(self._vrodosAdaptiveShadowCenter);

        const fitOptions = Object.assign({}, options || {}, { self });
        collectDirectionalShadowLights(self).forEach((light) => {
            fitDirectionalShadowCameraToBounds(light, bounds, shadowQuality, fitOptions);
        });
        self._vrodosShadowFitLastMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    function getAdaptiveShadowCenter(self) {
        return self && self._vrodosAdaptiveShadowCenter && typeof self._vrodosAdaptiveShadowCenter.copy === 'function'
            ? self._vrodosAdaptiveShadowCenter
            : null;
    }

    function scheduleAdaptiveShadowFit(self) {
        if (!self || !self.el || self.data.shadowQuality === 'off') {
            return;
        }

        applyAdaptiveShadowFit(self);
        if (typeof self.markShadowDirty === 'function') {
            self.markShadowDirty('adaptive-shadow-fit');
        }

        if (typeof self.isVrRuntimeHeadsetProfile === 'function' && self.isVrRuntimeHeadsetProfile()) {
            return;
        }

        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
                applyAdaptiveShadowFit(self);
                if (typeof self.markShadowDirty === 'function') {
                    self.markShadowDirty('adaptive-shadow-fit-frame');
                }
            });
        }

        setTimeout(() => {
            applyAdaptiveShadowFit(self);
            if (typeof self.markShadowDirty === 'function') {
                self.markShadowDirty('adaptive-shadow-fit-settle');
            }
        }, 80);
    }

    function schedulePmndrsAtmosphereShadowFit(self, config) {
        if (!isPmndrsDayNightCycleEnabled(self)) {
            scheduleAdaptiveShadowFit(self);
            return;
        }

        if (hasPmndrsDebugFlag('disablePmndrsDayNightCycleDynamicShadows', 'vrodos_debug_disable_day_night_dynamic_shadows')) {
            return;
        }

        if (!self._vrodosShadowFitLastMs) {
            self._pmndrsDayNightCycleShadowLastMs = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
            applyAdaptiveShadowFit(self, { stableFrustum: true });
        }
        if (config && config.localSunDirection) {
            self._pmndrsDayNightCycleLastShadowSunDirection = self._pmndrsDayNightCycleLastShadowSunDirection || new THREE.Vector3();
            self._pmndrsDayNightCycleLastShadowSunDirection.copy(config.localSunDirection);
        }
    }

    function arePmndrsDayNightCycleDynamicShadowsEnabled(self, config) {
        return Boolean(
            config &&
            config.dayNightCycleEnabled &&
            self &&
            self.data &&
            self.data.shadowQuality !== 'off' &&
            !hasPmndrsDebugFlag('disablePmndrsDayNightCycleDynamicShadows', 'vrodos_debug_disable_day_night_dynamic_shadows')
        );
    }

    function shouldUseDayNightPcfShadowMap(self) {
        return Boolean(
            self &&
            self.data &&
            isPmndrsDayNightCycleEnabled(self) &&
            self.data.shadowQuality !== 'off' &&
            !hasPmndrsDebugFlag('disablePmndrsDayNightCycleDynamicShadows', 'vrodos_debug_disable_day_night_dynamic_shadows')
        );
    }

    function isPmndrsTakramHorizonRequested(self) {
        return Boolean(self &&
            self.data &&
            self.data.selChoice === "0" &&
            self.data.postFXEngine === 'pmndrs' &&
            self.data.pmndrsAtmosphereEnabled !== '0');
    }

    function vectorToRoundedArray(vector) {
        if (!vector || typeof vector.x !== 'number' || typeof vector.y !== 'number' || typeof vector.z !== 'number') {
            return null;
        }

        return [
            Number(vector.x.toFixed(4)),
            Number(vector.y.toFixed(4)),
            Number(vector.z.toFixed(4))
        ];
    }

    function vectorToSignature(vector) {
        const rounded = vectorToRoundedArray(vector);
        return rounded ? rounded.join(',') : 'n/a';
    }

    function getShadowLightDiagnostic(node) {
        const shadow = node && node.shadow ? node.shadow : null;
        const mapSize = shadow && shadow.mapSize
            ? `${shadow.mapSize.x || 0}x${shadow.mapSize.y || 0}`
            : '';
        const direction = node && node.sunDirection
            ? node.sunDirection
            : (node && node.position ? node.position : null);

        return {
            name: node && node.name ? node.name : '',
            visible: Boolean(node && node.visible),
            castShadow: Boolean(node && node.castShadow),
            intensity: node && typeof node.intensity === 'number' ? Number(node.intensity.toFixed(3)) : null,
            mapSize,
            mapAllocated: Boolean(shadow && shadow.map),
            needsUpdate: Boolean(shadow && shadow.needsUpdate),
            direction: vectorToRoundedArray(direction)
        };
    }

    function getShadowDiagnosticState(self) {
        const sceneObj = self && self.el ? self.el.object3D : null;
        const state = {
            casters: 0,
            receivers: 0,
            receiverOnly: 0,
            dirLights: 0,
            dirShadowLights: 0,
            fittedDirLights: 0,
            fitted: 'pending',
            mode: self ? getShadowUpdateMode(self) : 'static',
            autoUpdate: null,
            needsUpdate: null,
            type: null,
            typeName: null,
            updateCount: self && self._vrodosShadowUpdateCount ? self._vrodosShadowUpdateCount : 0,
            dirtyRequests: self && self._vrodosShadowDirtyRequests ? self._vrodosShadowDirtyRequests : 0,
            lastDirtyReason: self && self._vrodosShadowDirtyReason ? self._vrodosShadowDirtyReason : null,
            lastUpdateReason: self && self._vrodosShadowLastUpdateReason ? self._vrodosShadowLastUpdateReason : null,
            takramSignature: self && self._pmndrsTakramLightShadowSignature ? self._pmndrsTakramLightShadowSignature : '',
            takramSignatureReason: self && self._pmndrsTakramLightShadowSignatureReason ? self._pmndrsTakramLightShadowSignatureReason : '',
            presentedShadowTransforms: self && self._vrodosPresentedShadowTransformCount ? self._vrodosPresentedShadowTransformCount : 0,
            presentedShadowBaseCaptures: self && self._vrodosPresentedShadowBaseCaptureCount ? self._vrodosPresentedShadowBaseCaptureCount : 0,
            presentedShadowLastNavigationTransformCount: self && typeof self._vrodosPresentedShadowLastNavigationTransformCount === 'number'
                ? self._vrodosPresentedShadowLastNavigationTransformCount
                : null,
            shadowLights: []
        };

        if (!sceneObj) {
            return state;
        }

        const renderer = self && self.el ? self.el.renderer : null;
        if (renderer && renderer.shadowMap) {
            state.autoUpdate = renderer.shadowMap.autoUpdate;
            state.needsUpdate = renderer.shadowMap.needsUpdate;
            state.type = renderer.shadowMap.type;
            state.typeName = getThreeShadowMapTypeName(renderer.shadowMap.type);
        }

        sceneObj.traverse((node) => {
            if (node && node.isMesh) {
                if (node.castShadow) {
                    state.casters += 1;
                }
                if (node.receiveShadow) {
                    state.receivers += 1;
                }
                if (node.receiveShadow && !node.castShadow) {
                    state.receiverOnly += 1;
                }
            } else if (node && node.isDirectionalLight) {
                state.dirLights += 1;
                if (node.castShadow && node.shadow) {
                    state.dirShadowLights += 1;
                }
                if (node.userData && node.userData.vrodosAdaptiveShadowFitted) {
                    state.fittedDirLights += 1;
                }
                state.shadowLights.push(getShadowLightDiagnostic(node));
            }
        });

        state.fitted = self && self._vrodosShadowFitLastMs ? 'yes' : 'pending';
        return state;
    }

    function getShadowUpdateMode(self) {
        if (hasPmndrsDebugFlag('dynamicShadows', 'vrodos_debug_dynamic_shadows')) {
            return 'dynamic';
        }

        const value = self && self.data ? String(self.data.shadowUpdateMode || 'static').toLowerCase() : 'static';
        return value === 'dynamic' ? 'dynamic' : 'static';
    }

    function isStaticShadowMode(self) {
        if (!self || !self.el) {
            return false;
        }

        const shadowQuality = typeof self.getEffectiveShadowQuality === 'function'
            ? self.getEffectiveShadowQuality()
            : (self.data && self.data.shadowQuality ? self.data.shadowQuality : 'medium');

        if (shadowQuality === 'off') {
            return false;
        }

        if (isPmndrsDayNightCycleEnabled(self) &&
            !hasPmndrsDebugFlag('disablePmndrsDayNightCycleDynamicShadows', 'vrodos_debug_disable_day_night_dynamic_shadows')) {
            return false;
        }

        return getShadowUpdateMode(self) === 'static';
    }

    function markAllShadowLightsDirty(self) {
        const sceneObj = self && self.el ? self.el.object3D : null;
        if (!sceneObj) {
            return;
        }

        sceneObj.traverse((node) => {
            if ((node.isDirectionalLight || node.isSpotLight || node.isPointLight) && node.shadow) {
                node.shadow.needsUpdate = true;
            }
        });
    }

    function markShadowProgramMaterialsDirty(self) {
        const sceneObj = self && self.el ? self.el.object3D : null;
        if (!sceneObj) {
            return;
        }

        sceneObj.traverse((node) => {
            if (!node || !node.material) {
                return;
            }

            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach((material) => {
                if (material) {
                    material.needsUpdate = true;
                }
            });
        });
    }

    function disposeLightShadowMap(shadow) {
        if (!shadow || !shadow.map) {
            return false;
        }

        if (shadow.map.depthTexture && typeof shadow.map.depthTexture.dispose === 'function') {
            shadow.map.depthTexture.dispose();
        }
        if (typeof shadow.map.dispose === 'function') {
            shadow.map.dispose();
        }
        shadow.map = null;

        if (shadow.mapPass) {
            if (shadow.mapPass.depthTexture && typeof shadow.mapPass.depthTexture.dispose === 'function') {
                shadow.mapPass.depthTexture.dispose();
            }
            if (typeof shadow.mapPass.dispose === 'function') {
                shadow.mapPass.dispose();
            }
            shadow.mapPass = null;
        }

        shadow.needsUpdate = true;
        return true;
    }

    function isLightShadowMapCompatibleWithType(shadow, shadowMapType) {
        if (!shadow || !shadow.map || typeof THREE === 'undefined') {
            return true;
        }

        const depthTexture = shadow.map.depthTexture || null;
        if (shadowMapType === THREE.PCFShadowMap) {
            return Boolean(depthTexture && depthTexture.compareFunction);
        }
        if (typeof THREE.BasicShadowMap !== 'undefined' && shadowMapType === THREE.BasicShadowMap) {
            return Boolean(!depthTexture || !depthTexture.compareFunction);
        }

        return true;
    }

    function refreshShadowMapResourcesForType(self, shadowMapType, force) {
        const sceneObj = self && self.el ? self.el.object3D : null;
        if (!sceneObj) {
            return false;
        }

        let refreshed = false;
        sceneObj.traverse((node) => {
            if (!node || !(node.isDirectionalLight || node.isSpotLight || node.isPointLight) || !node.shadow) {
                return;
            }
            if (force || !isLightShadowMapCompatibleWithType(node.shadow, shadowMapType)) {
                refreshed = disposeLightShadowMap(node.shadow) || refreshed;
            }
            node.shadow.needsUpdate = true;
        });

        if (refreshed || force) {
            markShadowProgramMaterialsDirty(self);
        }

        return refreshed;
    }

    function shadowPerfDebugEnabled() {
        return hasPmndrsDebugFlag('shadowPerf', 'vrodos_debug_shadow_perf');
    }

    function ensureShadowPerfDebugOverlay(self) {
        if (!shadowPerfDebugEnabled() || typeof document === 'undefined') {
            return null;
        }

        if (self._vrodosShadowPerfOverlay && self._vrodosShadowPerfOverlay.parentNode) {
            return self._vrodosShadowPerfOverlay;
        }

        const overlay = document.createElement('pre');
        overlay.id = 'vrodos-shadow-perf-debug';
        overlay.style.position = 'fixed';
        overlay.style.right = '16px';
        overlay.style.bottom = '16px';
        overlay.style.zIndex = '9999';
        overlay.style.margin = '0';
        overlay.style.padding = '10px 12px';
        overlay.style.maxWidth = '360px';
        overlay.style.maxHeight = '40vh';
        overlay.style.overflow = 'auto';
        overlay.style.background = 'rgba(15, 23, 42, 0.86)';
        overlay.style.color = '#e2e8f0';
        overlay.style.font = '12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
        overlay.style.border = '1px solid rgba(148, 163, 184, 0.35)';
        overlay.style.borderRadius = '8px';
        overlay.style.pointerEvents = 'none';

        document.body.appendChild(overlay);
        self._vrodosShadowPerfOverlay = overlay;
        return overlay;
    }

    function updateShadowPerfDebugOverlay(self) {
        const overlay = ensureShadowPerfDebugOverlay(self);
        if (!overlay) {
            return;
        }

        const state = getShadowDiagnosticState(self);
        overlay.textContent = [
            'VRodos shadow perf',
            `mode: ${state.mode}`,
            `type: ${state.typeName || state.type}`,
            `autoUpdate: ${state.autoUpdate}`,
            `needsUpdate: ${state.needsUpdate}`,
            `updates: ${state.updateCount}`,
            `dirty requests: ${state.dirtyRequests}`,
            `last reason: ${state.lastDirtyReason || 'none'}`,
            `last update: ${state.lastUpdateReason || 'none'}`,
            `takram signature: ${state.takramSignature || 'none'}`,
            `presented shadow transforms: ${state.presentedShadowTransforms}`,
            `presented shadow nav transform: ${state.presentedShadowLastNavigationTransformCount === null ? 'none' : state.presentedShadowLastNavigationTransformCount}`,
            `casters: ${state.casters}`,
            `receivers: ${state.receivers}`,
            `receiver-only: ${state.receiverOnly}`,
            `dir shadow lights: ${state.dirShadowLights}/${state.dirLights}`,
            `fit: ${state.fittedDirLights} ${state.fitted}`
        ].join('\n');
    }

    function buildPmndrsLocalSunDirection(elevationDeg, azimuthDeg) {
        const elevation = THREE.MathUtils.degToRad(elevationDeg);
        const azimuth = THREE.MathUtils.degToRad(azimuthDeg);
        const cosElevation = Math.cos(elevation);
        return new THREE.Vector3(
            Math.sin(azimuth) * cosElevation,
            Math.sin(elevation),
            -Math.cos(azimuth) * cosElevation
        ).normalize();
    }

    function getPmndrsDateObject(dateText, utcTimeText) {
        const date = normalizePmndrsDate(dateText);
        const time = normalizePmndrsUtcTime(utcTimeText);
        const parsed = new Date(`${date  }T${  time  }:00Z`);
        if (isNaN(parsed.getTime())) {
            return new Date('2026-06-21T12:00:00Z');
        }
        return parsed;
    }

    function buildPmndrsGeospatialFrame(latitudeDeg, longitudeDeg, altitudeMeters) {
        const lat = THREE.MathUtils.degToRad(clampPmndrsNumber(latitudeDeg, -90, 90, 0));
        const lon = THREE.MathUtils.degToRad(clampPmndrsNumber(longitudeDeg, -180, 180, 0));
        const height = clampPmndrsNumber(altitudeMeters, -500, 20000, 0);
        const sinLat = Math.sin(lat);
        const cosLat = Math.cos(lat);
        const sinLon = Math.sin(lon);
        const cosLon = Math.cos(lon);
        const a = WGS84_EQUATORIAL_RADIUS;
        const b = WGS84_POLAR_RADIUS;
        const e2 = 1 - ((b * b) / (a * a));
        const n = a / Math.sqrt(1 - (e2 * sinLat * sinLat));
        const position = new THREE.Vector3(
            (n + height) * cosLat * cosLon,
            (n + height) * cosLat * sinLon,
            ((n * (1 - e2)) + height) * sinLat
        );
        const up = new THREE.Vector3(cosLat * cosLon, cosLat * sinLon, sinLat).normalize();
        const east = new THREE.Vector3(-sinLon, cosLon, 0);
        if (east.lengthSq() < 0.000001) {
            east.set(0, 1, 0);
        }
        east.normalize();
        const north = new THREE.Vector3().crossVectors(up, east).normalize();
        const south = north.clone().multiplyScalar(-1);
        const matrix = new THREE.Matrix4().makeBasis(east, up, south).setPosition(position);

        return {
            latitudeDeg: THREE.MathUtils.radToDeg(lat),
            longitudeDeg: THREE.MathUtils.radToDeg(lon),
            altitudeMeters: height,
            position,
            east,
            up,
            north,
            south,
            matrix
        };
    }

    function getPmndrsGeospatialFrame(config) {
        if (!config || !config.geospatialEnabled) {
            return null;
        }
        if (!config._geospatialFrame) {
            config._geospatialFrame = buildPmndrsGeospatialFrame(
                config.geospatialLatitudeDeg,
                config.geospatialLongitudeDeg,
                config.geospatialAltitudeMeters
            );
        }
        return config._geospatialFrame;
    }

    function getPmndrsResolvedGeospatialFrame(config) {
        if (!config) {
            return null;
        }
        if (config._resolvedGeospatialFrame) {
            return config._resolvedGeospatialFrame;
        }

        config._resolvedGeospatialFrame = getPmndrsGeospatialFrame(config) || buildPmndrsGeospatialFrame(0, 90, 0);
        return config._resolvedGeospatialFrame;
    }

    function ecefDirectionToPmndrsLocal(direction, frame) {
        if (!direction || !frame) {
            return direction ? direction.clone().normalize() : new THREE.Vector3(0, 1, 0);
        }
        return new THREE.Vector3(
            direction.dot(frame.east),
            direction.dot(frame.up),
            direction.dot(frame.south)
        ).normalize();
    }

    function localDirectionToPmndrsEcef(localDirection, frame) {
        if (!localDirection || !frame) {
            return new THREE.Vector3(0, 1, 0);
        }
        return new THREE.Vector3()
            .addScaledVector(frame.east, localDirection.x)
            .addScaledVector(frame.up, localDirection.y)
            .addScaledVector(frame.south, localDirection.z)
            .normalize();
    }

    function applyLocalDirectionAngles(config) {
        const local = config && config.localSunDirection ? config.localSunDirection : null;
        if (!local) {
            return;
        }
        config.sunElevationDeg = THREE.MathUtils.radToDeg(Math.asin(Math.max(-1, Math.min(1, local.y))));
        config.sunAzimuthDeg = THREE.MathUtils.radToDeg(Math.atan2(local.x, -local.z));
    }

    function buildPmndrsEcefSunDirection(localSunDirection, config) {
        if (!localSunDirection) {
            return new THREE.Vector3(0, 1, 0);
        }

        const frame = getPmndrsGeospatialFrame(config);
        if (frame) {
            return localDirectionToPmndrsEcef(localSunDirection, frame);
        }

        // VRodos authored worlds use X=east, Y=up, Z=south so that -Z is the
        // natural forward/north-ish direction. Takram expects sunDirection in
        // ECEF space, so we mirror X/Z into the default fixed frame anchored below.
        return new THREE.Vector3(
            -localSunDirection.x,
            localSunDirection.y,
            -localSunDirection.z
        ).normalize();
    }

    function buildPmndrsMoonDirection(sunDirection) {
        return sunDirection.clone().multiplyScalar(-1).normalize();
    }

    function ensurePmndrsWorldToEcefMatrix(target, config) {
        if (!target) {
            return null;
        }

        const matrix = target.worldToECEFMatrix;
        if (!matrix || typeof matrix.makeTranslation !== 'function') {
            return null;
        }

        const frame = getPmndrsResolvedGeospatialFrame(config);
        if (frame) {
            matrix.copy(frame.matrix);
            return matrix;
        }

        // Takram expects an orthogonal world -> ECEF transform. VRodos authored
        // scenes use X=east, Y=up, Z=south (so -Z behaves like "forward"), so
        // we anchor the local origin onto an actual WGS84 surface point near the
        // equator and provide the matching rotation instead of translation alone.
        // Using atmosphere.bottomRadius here is wrong because Takram's altitude
        // correction then pushes the camera below the ground sphere, which shows
        // up as a giant fake horizon dome.
        matrix.makeBasis(
            new THREE.Vector3(-1, 0, 0), // local +X (east) -> ECEF west at +Y anchor
            new THREE.Vector3(0, 1, 0),  // local +Y (up)   -> ECEF up
            new THREE.Vector3(0, 0, -1)  // local +Z (south)-> ECEF south
        ).setPosition(0, WGS84_EQUATORIAL_RADIUS, 0);
        return matrix;
    }

    function copyPmndrsAtmosphereParameters(target, params) {
        if (!target || !params) {
            return;
        }

        if (target.atmosphere) {
            target.atmosphere.sunAngularRadius = params.sunAngularRadius;
            target.atmosphere.rayleighScattering.copy(params.rayleighScattering);
            target.atmosphere.mieScattering.copy(params.mieScattering);
            target.atmosphere.mieExtinction.copy(params.mieExtinction);
            target.atmosphere.miePhaseFunctionG = params.miePhaseFunctionG;
            target.atmosphere.absorptionExtinction.copy(params.absorptionExtinction);
            target.atmosphere.groundAlbedo.copy(params.groundAlbedo);
        }

        if (target.groundAlbedo && typeof target.groundAlbedo.copy === 'function') {
            target.groundAlbedo.copy(params.groundAlbedo);
        }

        if (target.uniforms && target.uniforms.ATMOSPHERE && target.uniforms.ATMOSPHERE.value) {
            const uniforms = target.uniforms.ATMOSPHERE.value;
            if (uniforms.sun_angular_radius !== undefined) {
                uniforms.sun_angular_radius = params.sunAngularRadius;
            }
            if (uniforms.rayleigh_scattering && typeof uniforms.rayleigh_scattering.copy === 'function') {
                uniforms.rayleigh_scattering.copy(params.rayleighScattering);
            }
            if (uniforms.mie_scattering && typeof uniforms.mie_scattering.copy === 'function') {
                uniforms.mie_scattering.copy(params.mieScattering);
            }
            if (uniforms.mie_extinction && typeof uniforms.mie_extinction.copy === 'function') {
                uniforms.mie_extinction.copy(params.mieExtinction);
            }
            if (uniforms.mie_phase_function_g !== undefined) {
                uniforms.mie_phase_function_g = params.miePhaseFunctionG;
            }
            if (uniforms.absorption_extinction && typeof uniforms.absorption_extinction.copy === 'function') {
                uniforms.absorption_extinction.copy(params.absorptionExtinction);
            }
            if (uniforms.ground_albedo && typeof uniforms.ground_albedo.copy === 'function') {
                uniforms.ground_albedo.copy(params.groundAlbedo);
            }
        }

        if (target.uniforms && target.uniforms.groundAlbedo && target.uniforms.groundAlbedo.value && typeof target.uniforms.groundAlbedo.value.copy === 'function') {
            target.uniforms.groundAlbedo.value.copy(params.groundAlbedo);
        }

        if (typeof target.sunAngularRadius === 'number' || typeof target.sunAngularRadius === 'undefined') {
            try {
                target.sunAngularRadius = params.sunAngularRadius;
            } catch (err) {
                /* ignore unsupported setter */
            }
        }
    }

    function getPmndrsEffectiveGroundAlbedo(config) {
        return config && config.groundEnabled ? config.groundAlbedo : '#000000';
    }

    function createPmndrsAtmosphereParameters(vta, config) {
        const params = new vta.AtmosphereParameters();
        params.sunAngularRadius = config.sunAngularRadius;
        params.rayleighScattering.multiplyScalar(config.rayleighScale);
        params.mieScattering.multiplyScalar(config.mieScatteringScale);
        params.mieExtinction.multiplyScalar(config.mieExtinctionScale);
        params.miePhaseFunctionG = config.miePhaseG;
        params.absorptionExtinction.multiplyScalar(config.absorptionScale);
        params.groundAlbedo.set(getPmndrsEffectiveGroundAlbedo(config));
        return params;
    }

    function removePmndrsAtmosphereSky(self) {
        if (!self || !self._pmndrsAtmosphereState) {
            return;
        }
        const state = self._pmndrsAtmosphereState;
        if (state.starsFallbackMesh && state.starsFallbackMesh.parent) {
            state.starsFallbackMesh.parent.remove(state.starsFallbackMesh);
        }
        if (state.moonMesh && state.moonMesh.parent) {
            state.moonMesh.parent.remove(state.moonMesh);
        }
        if (state.moonMaterial && typeof state.moonMaterial.dispose === 'function') {
            state.moonMaterial.dispose();
        }
        if (state.moonTexture && typeof state.moonTexture.dispose === 'function') {
            state.moonTexture.dispose();
        }
        if (state.starsFallbackMaterial && typeof state.starsFallbackMaterial.dispose === 'function') {
            state.starsFallbackMaterial.dispose();
        }
        if (state.starsFallbackGeometry && typeof state.starsFallbackGeometry.dispose === 'function') {
            state.starsFallbackGeometry.dispose();
        }
        if (state.starsMesh && state.starsMesh.parent) {
            state.starsMesh.parent.remove(state.starsMesh);
        }
        if (state.starsMaterial && typeof state.starsMaterial.dispose === 'function') {
            state.starsMaterial.dispose();
        }
        if (state.starsGeometry && typeof state.starsGeometry.dispose === 'function') {
            state.starsGeometry.dispose();
        }
        if (state.skyMesh && state.skyMesh.parent) {
            state.skyMesh.parent.remove(state.skyMesh);
        }
        if (state.skyMaterial && typeof state.skyMaterial.dispose === 'function') {
            state.skyMaterial.dispose();
        }
        if (state.skyGeometry && typeof state.skyGeometry.dispose === 'function') {
            state.skyGeometry.dispose();
        }
        state.skyMesh = null;
        state.skyMaterial = null;
        state.skyGeometry = null;
        state.skyMaterialSignature = '';
        state.starsMesh = null;
        state.starsMaterial = null;
        state.starsGeometry = null;
        state.starsFallbackMesh = null;
        state.starsFallbackMaterial = null;
        state.starsFallbackGeometry = null;
        state.moonMesh = null;
        state.moonMaterial = null;
        state.moonTexture = null;
        state.moonVisible = false;
        state.starsIntensity = 0;
    }

    function setPmndrsAtmosphereSkyVisibility(self, visible) {
        if (!self || !self._pmndrsAtmosphereState) {
            return false;
        }

        const state = self._pmndrsAtmosphereState;
        let changed = false;
        if (state.skyMesh) {
            state.skyMesh.visible = Boolean(visible);
            changed = true;
        }
        if (state.starsMesh) {
            state.starsMesh.visible = Boolean(visible) && state.starsIntensity > 0;
            changed = true;
        }
        if (state.starsFallbackMesh) {
            state.starsFallbackMesh.visible = Boolean(visible) && state.starsIntensity > 0;
            changed = true;
        }
        if (state.moonMesh) {
            state.moonMesh.visible = Boolean(visible) && state.moonVisible === true;
            changed = true;
        }
        return changed;
    }

    function isPmndrsAtmosphereSkyVisible(self) {
        return Boolean(self &&
            self._pmndrsAtmosphereState &&
            self._pmndrsAtmosphereState.skyMesh &&
            self._pmndrsAtmosphereState.skyMesh.visible);
    }

    function hasPmndrsLegacyEnvironmentToken(value) {
        if (typeof value !== 'string' || !value) {
            return false;
        }

        const normalized = value.toLowerCase();
        return normalized.indexOf('environment') > -1 ||
            normalized.indexOf('atmosphere') > -1 ||
            normalized === 'sky' ||
            normalized === 'sun' ||
            normalized === 'sunsphere' ||
            normalized === 'skybox' ||
            normalized === 'skydome';
    }

    function getPmndrsLegacyEnvironmentClassName(el) {
        if (!el) {
            return '';
        }

        if (typeof el.className === 'string') {
            return el.className.toLowerCase();
        }

        if (el.getAttribute) {
            return String(el.getAttribute('class') || '').toLowerCase();
        }

        return '';
    }

    function isPmndrsLegacyEnvironmentElement(el) {
        if (!el) {
            return false;
        }

        const id = (typeof el.id === 'string' ? el.id : '').toLowerCase();
        const tagName = (typeof el.tagName === 'string' ? el.tagName : '').toLowerCase();
        const className = getPmndrsLegacyEnvironmentClassName(el);

        if (tagName === 'a-sun-sky' || tagName === 'a-sky') {
            return true;
        }

        if (id === 'default-sky' ||
            id === 'default-sun' ||
            id === 'vrodos-pmndrs-sun' ||
            id === 'vrodos-pmndrs-sun-haze') {
            return true;
        }

        if (el.hasAttribute &&
            (el.hasAttribute('data-vrodos-preset-sky') ||
             el.hasAttribute('data-vrodos-pmndrs-sun'))) {
            return true;
        }

        return className.indexOf('environmentsun') > -1 ||
            className.indexOf('environment-sun') > -1 ||
            className.indexOf('environmentsky') > -1 ||
            className.indexOf('environment-sky') > -1;
    }

    function isPmndrsLegacyEnvironmentVisualNode(node) {
        if (!node || (node.userData && node.userData.vrodosPmndrsAtmosphereSky)) {
            return false;
        }

        if (isPmndrsLegacyEnvironmentElement(node.el)) {
            return true;
        }

        const material = Array.isArray(node.material) ? node.material[0] : node.material;
        const uniforms = material && material.uniforms ? material.uniforms : null;
        if (uniforms && (uniforms.sunPosition || uniforms.sunposition || uniforms.sun_direction)) {
            return true;
        }

        const nodeName = (typeof node.name === 'string') ? node.name : '';
        const materialName = (material && typeof material.name === 'string') ? material.name : '';
        return hasPmndrsLegacyEnvironmentToken(nodeName) || hasPmndrsLegacyEnvironmentToken(materialName);
    }

    function schedulePmndrsHorizonEnvironmentCleanup(self) {
        if (!self) {
            return;
        }

        const hideEnvVisuals = function () {
            hidePmndrsHorizonEnvironmentVisuals(self);
        };

        hideEnvVisuals();
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(hideEnvVisuals);
        }
        setTimeout(hideEnvVisuals, 50);
        setTimeout(hideEnvVisuals, 200);
    }

    function formatPmndrsSunDirectionForLog(direction) {
        if (!direction) {
            return 'n/a';
        }

        return [
            direction.x.toFixed(3),
            direction.y.toFixed(3),
            direction.z.toFixed(3)
        ].join(',');
    }

    function logPmndrsHorizonDiagnostic(self, context, atmosphereConfig) {
        if (!self || !self.data || !context) {
            return;
        }

        const diagnosticsEnabled = hasPmndrsDebugFlag('pmndrsHorizonDiagnostics', 'vrodos_debug_pmndrs_horizon') ||
            hasPmndrsDebugFlag('pmndrsHorizonDiagnosticsVerbose', 'vrodos_debug_pmndrs_horizon_verbose');
        const verboseDiagnosticsEnabled = hasPmndrsDebugFlag('pmndrsHorizonDiagnosticsVerbose', 'vrodos_debug_pmndrs_horizon_verbose');
        const startupStateLogEnabled = !diagnosticsEnabled && !self._pmndrsHorizonStartupStateLogged;
        if (!diagnosticsEnabled && !startupStateLogEnabled) {
            return;
        }

        const horizonPreset = typeof self.getHorizonSkyPreset === 'function' ? self.getHorizonSkyPreset() : 'natural';
        const helperConfig = shouldUsePmndrsTakramHorizonPath(self)
            ? getPmndrsHorizonHelperLightConfig(self, horizonPreset, atmosphereConfig)
            : null;
        const takramLightSources = self._pmndrsTakramLightSources || null;
        const keyIntensity = takramLightSources && takramLightSources.sunLight
            ? takramLightSources.sunLight.intensity
            : (helperConfig ? helperConfig.keyIntensity : null);
        const fillIntensity = takramLightSources && takramLightSources.skyLight
            ? takramLightSources.skyLight.intensity
            : (helperConfig ? helperConfig.fillIntensity : null);
        const pbrFillIntensity = takramLightSources && takramLightSources.fillLight
            ? takramLightSources.fillLight.intensity
            : (helperConfig ? getPmndrsTakramPbrFillIntensity(helperConfig, atmosphereConfig) : null);
        const takramSunAngularRadius = atmosphereConfig && atmosphereConfig.enabled && atmosphereConfig.takramSunEnabled !== false && shouldUsePmndrsTakramHorizonPath(self) && typeof atmosphereConfig.sunAngularRadius === 'number'
            ? atmosphereConfig.sunAngularRadius
            : null;
        const reflectionSource = (typeof self.getEffectiveReflectionSource === 'function')
            ? self.getEffectiveReflectionSource()
            : (self.data.reflectionSource || 'hdr');
        const reflectionScale = getPmndrsNightReflectionIntensityScale(self, atmosphereConfig, reflectionSource);
        const aframeDefaultLights = areAFrameDefaultLightsEnabled(self) ? 'on' : 'off';
        const atmosphereState = self._pmndrsAtmosphereState || null;
        const takramLutState = atmosphereState && atmosphereState.ready
            ? 'ready'
            : (atmosphereState && atmosphereState.failed ? 'failed' : 'pending');
        const pmndrsExposure = getPmndrsExposureValue(self);
        const toneMappingMode = normalizePmndrsToneMappingMode(self.data.pmndrsToneMappingMode);
        const lensFlareRequested = self.data.pmndrsLensFlareEnabled === true || self.data.pmndrsLensFlareEnabled === 'true' || self.data.pmndrsLensFlareEnabled === '1';
        const lensFlareEffective = typeof self.isPmndrsLensFlareEnabled === 'function'
            ? self.isPmndrsLensFlareEnabled()
            : lensFlareRequested;
        const lensFlare = lensFlareEffective
            ? (atmosphereConfig && atmosphereConfig.enabled && atmosphereConfig.takramSunEnabled !== false && shouldUsePmndrsTakramHorizonPath(self) ? 'on' : 'sun-off')
            : 'off';
        const correctAltitude = atmosphereConfig && atmosphereConfig.correctAltitudeEnabled !== false ? 'on' : 'off';
        const lightSourceMode = atmosphereConfig && atmosphereConfig.useTakramLightSources === true ? 'takram' : 'helper';
        const reflectionOcclusionMode = normalizeReflectionOcclusionMode(self.data.reflectionOcclusionMode);
        const shadowState = getShadowDiagnosticState(self);
        const resolvedSkyTimePreset = getResolvedPmndrsSkyTimePreset(atmosphereConfig);
        const starsIntensity = atmosphereConfig ? getPmndrsStarsIntensity(atmosphereConfig) : 0;
        const owner = atmosphereConfig && atmosphereConfig.enabled && shouldUseVrTakramLightsOnly(self)
            ? 'takram-lights-only'
            : (atmosphereConfig && atmosphereConfig.enabled && shouldUsePmndrsHorizonAerialPerspectivePath(self)
                ? 'takram-sky+aerial'
                : (atmosphereConfig && atmosphereConfig.enabled && shouldUsePmndrsTakramHorizonPath(self)
                    ? 'takram-sky'
                    : (atmosphereConfig && atmosphereConfig.enabled ? 'takram-fallback' : 'legacy-fallback')));
        const signature = [
            context,
            owner,
            reflectionSource,
            atmosphereConfig && atmosphereConfig.celestialMode ? atmosphereConfig.celestialMode : 'manual',
            resolvedSkyTimePreset,
            atmosphereConfig && atmosphereConfig.groundEnabled ? 'ground-on' : 'ground-off',
            atmosphereConfig && atmosphereConfig.takramSunEnabled === false ? 'sun-off' : 'sun-on',
            formatPmndrsSunDirectionForLog(atmosphereConfig && atmosphereConfig.sunDirection ? atmosphereConfig.sunDirection : null),
            keyIntensity !== null ? keyIntensity.toFixed(2) : 'n/a',
            fillIntensity !== null ? fillIntensity.toFixed(2) : 'n/a',
            pbrFillIntensity !== null ? pbrFillIntensity.toFixed(2) : 'n/a',
            helperConfig ? helperConfig.directionOwner : 'n/a',
            reflectionScale.toFixed(2),
            takramSunAngularRadius !== null ? takramSunAngularRadius.toFixed(4) : 'n/a',
            aframeDefaultLights,
            takramLutState,
            pmndrsExposure.toFixed(2),
            toneMappingMode,
            lensFlare,
            correctAltitude,
            lightSourceMode,
            starsIntensity.toFixed(2),
            reflectionOcclusionMode,
            self.data.shadowQuality || 'medium',
            shadowState.casters,
            shadowState.receivers,
            shadowState.receiverOnly,
            shadowState.dirShadowLights,
            shadowState.fittedDirLights,
            shadowState.fitted
        ].join('|');

        if (startupStateLogEnabled) {
            self._pmndrsHorizonStartupStateLogged = true;
            const log = console.info || console.log || function () {};
            log.call(console, `[VRodos] Compiled scene state: engine=pmndrs, owner=${  owner
                }, reflection=${  reflectionSource
                }, reflectionOcclusion=${  reflectionOcclusionMode
                }, shadowQuality=${  self.data.shadowQuality || 'medium'
                }, celestial=${  atmosphereConfig && atmosphereConfig.celestialMode ? atmosphereConfig.celestialMode : 'manual'
                }/${  resolvedSkyTimePreset
                }, sunDir=${  formatPmndrsSunDirectionForLog(atmosphereConfig && atmosphereConfig.sunDirection ? atmosphereConfig.sunDirection : null)
                }, exposure=${  pmndrsExposure.toFixed(2)
                }, toneMapping=${  toneMappingMode
                }, lensFlare=${  lensFlare
                }, lightSource=${  lightSourceMode
                }, skyLight=${  fillIntensity !== null ? fillIntensity.toFixed(2) : 'n/a'
                }, pbrFill=${  pbrFillIntensity !== null ? pbrFillIntensity.toFixed(2) : 'n/a'
                }, reflectionScale=${  reflectionScale.toFixed(2)
                }, stars=${  starsIntensity.toFixed(2)}`);
            return;
        }

        self._pmndrsHorizonDiagSignatures = self._pmndrsHorizonDiagSignatures || {};
        if (self._pmndrsHorizonDiagSignatures[context] === signature) {
            return;
        }

        self._pmndrsHorizonDiagSignatures[context] = signature;
        const logMethod = verboseDiagnosticsEnabled ? 'info' : 'debug';
        const log = console[logMethod] || console.info || function () {};
        log.call(console, `[VRodos] PMNDRS horizon diagnostic (${  context  }): owner=${  owner
            }, reflection=${  reflectionSource 
            }, celestial=${  atmosphereConfig && atmosphereConfig.celestialMode ? atmosphereConfig.celestialMode : 'manual'
            }/${  resolvedSkyTimePreset
            }, ground=${  atmosphereConfig && atmosphereConfig.groundEnabled ? 'on' : 'off' 
            }, sun=${  atmosphereConfig && atmosphereConfig.takramSunEnabled === false ? 'off' : 'on' 
            }, sunDir=${  formatPmndrsSunDirectionForLog(atmosphereConfig && atmosphereConfig.sunDirection ? atmosphereConfig.sunDirection : null) 
            }, helperKey=${  keyIntensity !== null ? keyIntensity.toFixed(2) : 'n/a'
            }, helperFill=${  fillIntensity !== null ? fillIntensity.toFixed(2) : 'n/a'
            }, pbrFill=${  pbrFillIntensity !== null ? pbrFillIntensity.toFixed(2) : 'n/a'
            }, helperDir=${  helperConfig ? helperConfig.directionOwner : 'n/a'
            }, reflectionScale=${  reflectionScale.toFixed(2)
            }, sunRadius=${  takramSunAngularRadius !== null ? takramSunAngularRadius.toFixed(4) : 'n/a'
            }, aframeDefaultLights=${  aframeDefaultLights
            }, takramLut=${  takramLutState
            }, exposure=${  pmndrsExposure.toFixed(2)
            }, toneMapping=${  toneMappingMode
            }, lensFlare=${  lensFlare
            }, correctAltitude=${  correctAltitude
            }, lightSource=${  lightSourceMode
            }, stars=${  starsIntensity.toFixed(2)
            }, reflectionOcclusion=${  reflectionOcclusionMode
            }, shadowQuality=${  self.data.shadowQuality || 'medium'
            }, shadowCasters=${  shadowState.casters
            }, shadowReceivers=${  shadowState.receivers
            }, shadowReceiverOnly=${  shadowState.receiverOnly
            }, dirShadowLights=${  shadowState.dirShadowLights
            }, fittedDirLights=${  shadowState.fittedDirLights
            }, shadowFit=${  shadowState.fitted}`);
    }

    function hidePmndrsHorizonEnvironmentVisuals(self) {
        if (!self || !self.el || !self.el.object3D) {
            return;
        }
        self.el.object3D.traverse((node) => {
            if (!node || (node.userData && (node.userData.vrodosPmndrsAtmosphereSky || node.userData.vrodosPmndrsAtmosphereStars))) {
                return;
            }

            if (isPmndrsLegacyEnvironmentVisualNode(node)) {
                node.visible = false;
                node.userData = node.userData || {};
                node.userData.vrodosPmndrsLegacySuppressed = true;
            }
        });

        Array.prototype.forEach.call(document.querySelectorAll('#default-sky, #default-sun, #vrodos-pmndrs-sun, #vrodos-pmndrs-sun-haze, a-sun-sky, a-sky[data-vrodos-preset-sky="true"], .environmentSun, .environment-sun, .environmentSky, .environment-sky, [class*="environmentSun"], [class*="environmentSky"]'), (node) => {
            if (node && typeof node.setAttribute === 'function') {
                node.setAttribute('visible', 'false');
            }
        });
    }

    function isPmndrsAtmosphereVisualNode(node) {
        return Boolean(node &&
            node.userData &&
            (node.userData.vrodosPmndrsAtmosphereSky ||
                node.userData.vrodosPmndrsAtmosphereStars ||
                node.userData.vrodosPmndrsAtmosphereMoon));
    }

    function disposePmndrsAtmosphereVisualNode(node) {
        if (!node) {
            return;
        }

        if (node.parent) {
            node.parent.remove(node);
        }

        const disposeRuntimeResource = VRODOSMaster &&
            VRODOSMaster.RuntimeResources &&
            typeof VRODOSMaster.RuntimeResources.dispose === 'function'
            ? VRODOSMaster.RuntimeResources.dispose
            : null;

        if (disposeRuntimeResource) {
            disposeRuntimeResource(node);
            return;
        }

        if (node.geometry && typeof node.geometry.dispose === 'function') {
            node.geometry.dispose();
        }
        if (Array.isArray(node.material)) {
            node.material.forEach((material) => {
                if (material && typeof material.dispose === 'function') {
                    material.dispose();
                }
            });
        } else if (node.material && typeof node.material.dispose === 'function') {
            node.material.dispose();
        }
    }

    function removePmndrsAtmosphereVisualObjects(self) {
        if (!self || !self.el || !self.el.object3D) {
            return;
        }

        const visualNodes = [];
        self.el.object3D.traverse((node) => {
            if (isPmndrsAtmosphereVisualNode(node)) {
                visualNodes.push(node);
            }
        });

        visualNodes.forEach(disposePmndrsAtmosphereVisualNode);
    }

    function getVrTakramLightsOnlySkyColors(preset) {
        if (preset === 'clear') {
            return {
                top: '#82c7fb',
                horizon: '#fff0d3',
                bottom: '#f8fbff'
            };
        }
        if (preset === 'crisp') {
            return {
                top: '#8fc8f6',
                horizon: '#fff1d8',
                bottom: '#f8fbff'
            };
        }

        return {
            top: '#94c9f5',
            horizon: '#ffefd8',
            bottom: '#f8fbff'
        };
    }

    function removeVrTakramLightsOnlyGradientSky(self) {
        const sky = self && self._vrTakramLightsOnlyGradientSky;
        if (!sky) {
            return;
        }

        if (sky.parent) {
            sky.parent.remove(sky);
        }
        if (sky.geometry && typeof sky.geometry.dispose === 'function') {
            sky.geometry.dispose();
        }
        if (sky.material && typeof sky.material.dispose === 'function') {
            sky.material.dispose();
        }
        self._vrTakramLightsOnlyGradientSky = null;
    }

    function ensureVrTakramLightsOnlyGradientSky(self, preset) {
        if (!self || !self.el || !self.el.object3D || typeof THREE === 'undefined') {
            return null;
        }

        let sky = self._vrTakramLightsOnlyGradientSky || null;
        if (!sky) {
            const geometry = new THREE.SphereGeometry(4000, 32, 16);
            const material = new THREE.ShaderMaterial({
                side: THREE.BackSide,
                depthWrite: false,
                depthTest: false,
                fog: false,
                uniforms: {
                    topColor: { value: new THREE.Color('#94c9f5') },
                    horizonColor: { value: new THREE.Color('#ffefd8') },
                    bottomColor: { value: new THREE.Color('#f8fbff') }
                },
                vertexShader: [
                    'varying vec3 vSkyDirection;',
                    'void main() {',
                    '  vSkyDirection = normalize(position);',
                    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                    '}'
                ].join('\n'),
                fragmentShader: [
                    'uniform vec3 topColor;',
                    'uniform vec3 horizonColor;',
                    'uniform vec3 bottomColor;',
                    'varying vec3 vSkyDirection;',
                    'void main() {',
                    '  float h = clamp(vSkyDirection.y * 0.5 + 0.5, 0.0, 1.0);',
                    '  vec3 lower = mix(bottomColor, horizonColor, smoothstep(0.0, 0.48, h));',
                    '  vec3 upper = mix(horizonColor, topColor, smoothstep(0.48, 1.0, h));',
                    '  vec3 color = mix(lower, upper, smoothstep(0.42, 0.66, h));',
                    '  gl_FragColor = vec4(color, 1.0);',
                    '}'
                ].join('\n')
            });
            material.toneMapped = false;

            sky = new THREE.Mesh(geometry, material);
            sky.name = 'vrodosVrTakramLightsOnlyGradientSky';
            sky.frustumCulled = false;
            sky.renderOrder = -1000;
            sky.userData.vrodosVrTakramLightsOnlySky = true;
            sky.castShadow = false;
            sky.receiveShadow = false;
            sky.raycast = function () {};
            self.el.object3D.add(sky);
            self._vrTakramLightsOnlyGradientSky = sky;
        } else if (sky.parent !== self.el.object3D) {
            self.el.object3D.add(sky);
        }

        const colors = getVrTakramLightsOnlySkyColors(preset);
        if (sky.material && sky.material.uniforms) {
            sky.material.uniforms.topColor.value.set(colors.top);
            sky.material.uniforms.horizonColor.value.set(colors.horizon);
            sky.material.uniforms.bottomColor.value.set(colors.bottom);
        }
        sky.visible = true;
        return sky;
    }

    function isPmndrsGeneratedSunElement(el) {
        if (!el) {
            return false;
        }

        const id = (typeof el.id === 'string' ? el.id : '').toLowerCase();
        return id === 'vrodos-pmndrs-sun' ||
            id === 'vrodos-pmndrs-sun-haze' ||
            (el.hasAttribute && el.hasAttribute('data-vrodos-pmndrs-sun'));
    }

    function restorePmndrsHorizonEnvironmentVisuals(self) {
        if (!self || !self.el || !self.el.object3D) {
            return;
        }

        const restoredElements = [];
        self.el.object3D.traverse((node) => {
            if (!node || !node.userData || !node.userData.vrodosPmndrsLegacySuppressed) {
                return;
            }
            if (isPmndrsGeneratedSunElement(node.el)) {
                delete node.userData.vrodosPmndrsLegacySuppressed;
                return;
            }

            node.visible = true;
            delete node.userData.vrodosPmndrsLegacySuppressed;
            if (node.el && restoredElements.indexOf(node.el) === -1) {
                restoredElements.push(node.el);
            }
        });

        restoredElements.forEach((el) => {
            if (el && typeof el.setAttribute === 'function') {
                el.setAttribute('visible', 'true');
            }
        });

        Array.prototype.forEach.call(self.el.querySelectorAll('#default-sky, #default-sun, a-sun-sky, a-sky[data-vrodos-preset-sky="true"], .environmentSun, .environment-sun, .environmentSky, .environment-sky, [class*="environmentSun"], [class*="environmentSky"]'), (el) => {
            if (el && !isPmndrsGeneratedSunElement(el) && typeof el.setAttribute === 'function') {
                el.setAttribute('visible', 'true');
            }
        });
    }

    function primeVrTakramSkyDirectShader(self) {
        const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
        const material = state && state.skyMaterial ? state.skyMaterial : null;
        const skyMesh = state && state.skyMesh ? state.skyMesh : null;
        const renderer = self && self.el ? self.el.renderer : null;
        const camera = self && self.el ? self.el.camera : null;
        if (!state || !material || !skyMesh || !renderer || !camera || typeof renderer.compile !== 'function') {
            return Boolean(material && material.userData && material.userData.vrodosVrTakramSkyDirectShaderPatched);
        }
        if (material.userData && material.userData.vrodosVrTakramSkyDirectShaderPatched) {
            return true;
        }

        const wasVisible = skyMesh.visible;
        skyMesh.visible = true;
        try {
            renderer.compile(skyMesh, camera);
        } catch (err) {
            state.vrTakramSkyDirectCompileError = err && err.message ? err.message : String(err);
        }
        skyMesh.visible = wasVisible;
        return Boolean(material.userData && material.userData.vrodosVrTakramSkyDirectShaderPatched);
    }

    function isVrTakramVisibleSkyReadyForHandoff(self) {
        if (!shouldUseVrTakramVisibleSky(self)) {
            return true;
        }

        const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
        const material = state && state.skyMaterial ? state.skyMaterial : null;
        if (!state || !state.skyMesh || !material || !material.userData) {
            return false;
        }

        if (!material.userData.vrodosVrTakramSkyDirectShaderPatched) {
            primeVrTakramSkyDirectShader(self);
        }

        const shaderPatched = Boolean(material.userData.vrodosVrTakramSkyDirectShaderPatched);
        const patchFailed = Boolean(material.userData.vrodosVrTakramSkyDirectPatchFailed);
        const warmupMs = getVrTakramSkyRevealWarmupMs();
        let warmed = false;
        let remainingMs = warmupMs;

        if (shaderPatched && !patchFailed) {
            const now = getRuntimeNowMs();
            if (!Number.isFinite(material.userData.vrodosVrTakramSkyDirectReadySinceMs) ||
                material.userData.vrodosVrTakramSkyDirectReadySinceMs <= 0) {
                material.userData.vrodosVrTakramSkyDirectReadySinceMs = now;
            }
            const elapsedMs = Math.max(0, now - material.userData.vrodosVrTakramSkyDirectReadySinceMs);
            warmed = warmupMs <= 0 || elapsedMs >= warmupMs;
            remainingMs = Math.max(0, warmupMs - elapsedMs);
        } else {
            material.userData.vrodosVrTakramSkyDirectReadySinceMs = 0;
        }

        material.userData.vrodosVrTakramSkyDirectWarmupMs = warmupMs;
        material.userData.vrodosVrTakramSkyDirectWarmed = warmed;
        material.userData.vrodosVrTakramSkyDirectWarmupRemainingMs = remainingMs;
        state.vrTakramSkyDirectShaderPatched = shaderPatched;
        state.vrTakramSkyDirectPatchFailed = patchFailed;
        state.vrTakramSkyDirectReadySinceMs = material.userData.vrodosVrTakramSkyDirectReadySinceMs || 0;
        state.vrTakramSkyDirectWarmupMs = warmupMs;
        state.vrTakramSkyDirectWarmed = warmed;
        state.vrTakramSkyDirectWarmupRemainingMs = remainingMs;

        return Boolean(shaderPatched && !patchFailed && warmed);
    }

    function completeVrTakramVisibleSkyHandoff(self) {
        if (!self || !self.el) {
            return;
        }

        setPmndrsAtmosphereSkyVisibility(self, true);
        removeVrTakramLightsOnlyGradientSky(self);
        removeLegacySunSkyEntitiesForPmndrs(self);
        schedulePmndrsHorizonEnvironmentCleanup(self);
        if (self.el.hasAttribute('environment')) {
            self.el.removeAttribute('environment');
        }
    }

    function syncVrTakramLightsOnlyHorizonVisuals(self, force) {
        if (!self) {
            return;
        }
        if (!force && self._vrTakramLightsOnlyHorizonVisualsSynced) {
            return;
        }

        removePmndrsAtmosphereSky(self);
        removePmndrsAtmosphereVisualObjects(self);
        removeLegacySunSkyEntitiesForPmndrs(self);
        if (self.el && typeof self.el.hasAttribute === 'function' && self.el.hasAttribute('environment')) {
            self.el.removeAttribute('environment');
        }
        ensureVrTakramLightsOnlyGradientSky(
            self,
            typeof self.getHorizonSkyPreset === 'function' ? self.getHorizonSkyPreset() : 'natural'
        );
        self._vrTakramLightsOnlyHorizonVisualsSynced = true;
    }

    function scheduleVrTakramLightsOnlyHorizonVisualSync(self) {
        if (!self) {
            return;
        }

        const sync = function () {
            syncVrTakramLightsOnlyHorizonVisuals(self, true);
        };

        self._vrTakramLightsOnlyHorizonVisualsSynced = false;
        sync();
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(sync);
        }
        setTimeout(sync, 50);
        setTimeout(sync, 200);
    }

    function removeLegacySunSkyEntitiesForPmndrs(self) {
        if (!self || !self.el) {
            return;
        }

        Array.prototype.forEach.call(self.el.querySelectorAll('a-sun-sky, a-sky[data-vrodos-preset-sky="true"], #default-sky, #default-sun, [material*="sunPosition"], [material*="sunposition"]'), (sunSkyEl) => {
            if (sunSkyEl && typeof sunSkyEl.removeObject3D === 'function') {
                try {
                    sunSkyEl.removeObject3D('mesh');
                } catch (err) {
                    // Ignore cleanup failures; we still remove the DOM node below.
                }
            }

            if (sunSkyEl && sunSkyEl.parentNode) {
                sunSkyEl.parentNode.removeChild(sunSkyEl);
            }
        });

        if (self.el.object3D) {
            self.el.object3D.traverse((node) => {
                if (!node) {
                    return;
                }

                if (node.userData && (node.userData.vrodosPmndrsAtmosphereSky || node.userData.vrodosPmndrsAtmosphereStars)) {
                    return;
                }

                if (isPmndrsLegacyEnvironmentVisualNode(node)) {
                    node.visible = false;
                    node.userData = node.userData || {};
                    node.userData.vrodosPmndrsLegacySuppressed = true;
                }
            });
        }
    }

    function shouldUseVrBaselineHorizon(self) {
        return Boolean(self &&
            (
                (typeof self.isVrSceneOwnedRuntimeActive === 'function' && self.isVrSceneOwnedRuntimeActive()) ||
                (typeof self.isVrBaselineRuntimeActive === 'function' && self.isVrBaselineRuntimeActive())
            ) &&
            self.data &&
            self.data.selChoice === "0");
    }

    function isVrTakramLightsOnlyProfile(self) {
        return Boolean(self &&
            typeof self.isVrRuntimePolicyActive === 'function' &&
            self.isVrRuntimePolicyActive() &&
            typeof self.isVrRuntimeTakramLightsProfile === 'function' &&
            self.isVrRuntimeTakramLightsProfile() &&
            self.data &&
            self.data.selChoice === "0");
    }

    function shouldUseVrTakramLightsOnly(self) {
        return Boolean(isVrTakramLightsOnlyProfile(self) && isPmndrsTakramHorizonRequested(self));
    }

    function isVrTakramSkyProfile(self) {
        return Boolean(self &&
            typeof self.isVrRuntimePolicyActive === 'function' &&
            self.isVrRuntimePolicyActive() &&
            typeof self.vrRuntimeAllows === 'function' &&
            self.vrRuntimeAllows('takramVisibleSky', isPmndrsTakramHorizonRequested(self)) &&
            self.data &&
            self.data.selChoice === "0");
    }

    function shouldUseVrTakramVisibleSky(self) {
        return Boolean(isVrTakramSkyProfile(self) && isPmndrsTakramHorizonRequested(self));
    }

    function shouldUsePmndrsTakramHorizonPath(self) {
        return Boolean(isPmndrsTakramHorizonRequested(self) &&
            window.VRODOS_TAKRAM_ATMOSPHERE &&
            !shouldUseVrBaselineHorizon(self) &&
            !isVrTakramLightsOnlyProfile(self));
    }

    function shouldUsePmndrsHorizonAerialPerspectivePath(self) {
        return shouldUsePmndrsTakramHorizonPath(self) &&
            !shouldUseVrTakramVisibleSky(self) &&
            (readPmndrsAtmosphereBool(self, 'pmndrsAerialPerspectiveEnabled', false) ||
                hasPmndrsDebugFlag('enablePmndrsHorizonAerial', 'vrodos_debug_enable_pmndrs_horizon_aerial'));
    }

    function shouldUsePmndrsTakramPhysicalHorizonLights() {
        return true;
    }

    function formatVectorPosition(vector, distance, minY) {
        let y = vector.y * distance;
        if (typeof minY === 'number') {
            y = Math.max(minY, y);
        }
        return [
            (vector.x * distance).toFixed(2),
            y.toFixed(2),
            (vector.z * distance).toFixed(2)
        ].join(' ');
    }

    function areAFrameDefaultLightsEnabled(self) {
        const sceneEl = self && self.el;
        const defaultLightEls = sceneEl && typeof sceneEl.querySelectorAll === 'function'
            ? Array.prototype.slice.call(sceneEl.querySelectorAll('[data-aframe-default-light]'))
            : [];

        if (sceneEl && sceneEl._vrodosAFrameDefaultLightsEnabled === false) {
            return defaultLightEls.length > 0;
        }

        const lightData = sceneEl && typeof sceneEl.getAttribute === 'function'
            ? sceneEl.getAttribute('light')
            : null;

        if (lightData && typeof lightData === 'object' && typeof lightData.defaultLightsEnabled !== 'undefined') {
            return lightData.defaultLightsEnabled !== false;
        }

        if (sceneEl &&
            sceneEl.systems &&
            sceneEl.systems.light &&
            sceneEl.systems.light.data &&
            typeof sceneEl.systems.light.data.defaultLightsEnabled !== 'undefined') {
            return sceneEl.systems.light.data.defaultLightsEnabled !== false;
        }

        return true;
    }

    function setAFrameDefaultLightsEnabled(self, enabled) {
        const sceneEl = self && self.el;
        if (!sceneEl || typeof sceneEl.setAttribute !== 'function') {
            return;
        }

        const desired = Boolean(enabled);
        if (sceneEl._vrodosAFrameDefaultLightsEnabled === desired && areAFrameDefaultLightsEnabled(self) === desired) {
            return;
        }

        sceneEl._vrodosAFrameDefaultLightsEnabled = desired;
        sceneEl.setAttribute('light', `defaultLightsEnabled: ${  desired ? 'true' : 'false'}`);

        if (!desired && typeof sceneEl.querySelectorAll === 'function') {
            Array.prototype.forEach.call(sceneEl.querySelectorAll('[data-aframe-default-light]'), (lightEl) => {
                if (lightEl && typeof lightEl.removeObject3D === 'function') {
                    try {
                        lightEl.removeObject3D('light');
                    } catch (err) {
                        /* ignore A-Frame cleanup races */
                    }
                }
                if (lightEl && lightEl.parentNode) {
                    lightEl.parentNode.removeChild(lightEl);
                }
            });
        }
    }

    function removePhotorealHelperLightElements(self) {
        if (!self || !self.el || typeof self.el.querySelectorAll !== 'function') {
            return;
        }

        let removed = false;
        Array.prototype.forEach.call(self.el.querySelectorAll('[data-vrodos-photoreal-light="true"]'), (lightEl) => {
            if (lightEl.parentNode) {
                lightEl.parentNode.removeChild(lightEl);
                removed = true;
            }
        });
        if (removed) {
            self.markSceneCollectionsDirty();
            if (typeof self.markShadowDirty === 'function') {
                self.markShadowDirty('remove-photoreal-light');
            }
        }
    }

    function removePmndrsTakramLightSources(self) {
        const state = self && self._pmndrsTakramLightSources;
        if (!state) {
            return;
        }

        ['sunLight', 'skyLight', 'fillLight', 'ambientLight', 'target', 'moonLight', 'moonTarget'].forEach((key) => {
            const object = state[key];
            if (object && object.parent) {
                object.parent.remove(object);
            }
        });

        self._pmndrsTakramLightSources = null;
    }

    function ensurePmndrsFallbackHorizonLights(self, config, preset) {
        const effectiveShadowQuality = typeof self.getEffectiveShadowQuality === 'function'
            ? self.getEffectiveShadowQuality()
            : self.data.shadowQuality;
        const shadowEnabled = effectiveShadowQuality !== 'off';
        const shadowMap = effectiveShadowQuality === 'high' ? 2048 : 1024;
        const helperConfig = getPmndrsHorizonHelperLightConfig(self, preset, config);
        const directVisibility = getPmndrsDirectLightVisibility(config, helperConfig.useMoonDirection);
        const keyIntensity = helperConfig.keyIntensity * directVisibility;
        const castShadow = shadowEnabled && !helperConfig.useMoonDirection && directVisibility > 0.001 ? 'true' : 'false';
        const fallbackFillIntensity = getPmndrsFallbackAmbientFillIntensity(helperConfig, config);
        const keyDirection = helperConfig.useMoonDirection
            ? (config.localMoonDirection || config.moonDirection || config.localSunDirection || config.sunDirection)
            : (config.localSunDirection || config.sunDirection);
        const shadowDistance = getDirectionalShadowDistanceForScene(self, 28);

        self.ensurePhotorealHelperLight(
            'vrodos-pmndrs-horizon-key-light',
            `type: directional; color: ${  helperConfig.keyColor  }; intensity: ${  keyIntensity.toFixed(2)  }; castShadow: ${  castShadow  }; shadowMapWidth: ${  shadowMap  }; shadowMapHeight: ${  shadowMap  }; shadowCameraTop: 28; shadowCameraRight: 28; shadowCameraLeft: -28; shadowCameraBottom: -28; shadowBias: -0.00012; shadowRadius: ${  getPmndrsDayNightShadowRadius(self).toFixed(2)  };`,
            formatVectorPosition(keyDirection, shadowDistance, helperConfig.useMoonDirection ? 4 : 8)
        );

        self.ensurePhotorealHelperLight(
            'vrodos-pmndrs-horizon-fill-light',
            `type: ambient; color: ${  helperConfig.fillColor  }; intensity: ${  fallbackFillIntensity.toFixed(2)  };`,
            '0 6 0'
        );

        schedulePmndrsAtmosphereShadowFit(self, config);
    }

    function schedulePmndrsTakramLightSourceRefresh(self, atmosphereState, config, preset, options) {
        if (!self || !atmosphereState || !atmosphereState.promise) {
            return;
        }

        if (self._pmndrsTakramLightSourcesPendingPromise === atmosphereState.promise) {
            return;
        }

        const opts = options || {};
        self._pmndrsTakramLightSourcesPendingPromise = atmosphereState.promise;
        atmosphereState.promise.then(() => {
            if (!self || self._pmndrsAtmosphereState !== atmosphereState || atmosphereState.failed) {
                return;
            }

            const latestConfig = self.getPmndrsAtmosphereConfig ? self.getPmndrsAtmosphereConfig() : config;
            if (!latestConfig || latestConfig.enabled === false || !(shouldUsePmndrsTakramHorizonPath(self) || shouldUseVrTakramLightsOnly(self))) {
                return;
            }

            const latestPreset = self.getHorizonSkyPreset ? self.getHorizonSkyPreset() : preset;
            if (shouldUseVrTakramLightsOnly(self)) {
                const lightsReady = ensurePmndrsTakramHorizonLights(self, latestConfig, latestPreset, {
                    fallback: false,
                    ensureSky: false
                });
                if (!lightsReady) {
                    setAFrameDefaultLightsEnabled(self, false);
                    ensurePmndrsFallbackHorizonLights(self, latestConfig, latestPreset);
                }
                scheduleVrTakramLightsOnlyHorizonVisualSync(self);
                logPmndrsHorizonDiagnostic(self, 'apply-horizon-lights-only', latestConfig);
                return;
            }

            const lightsReady = ensurePmndrsTakramHorizonLights(self, latestConfig, latestPreset, opts);
            if (lightsReady && opts.ensureSky !== false) {
                const skyReady = ensurePmndrsAtmosphereSky(self, latestConfig);
                if (skyReady && shouldUseVrTakramVisibleSky(self)) {
                    if (isVrTakramVisibleSkyReadyForHandoff(self)) {
                        completeVrTakramVisibleSkyHandoff(self);
                    } else {
                        setPmndrsAtmosphereSkyVisibility(self, false);
                    }
                }
            }
            logPmndrsHorizonDiagnostic(self, 'apply-horizon', latestConfig);
        }).catch((err) => {
            self._pmndrsTakramLightSourcesPendingError = err;
        });
    }

    function getTakramShadowLightSignature(self, state) {
        const renderer = self && self.el ? self.el.renderer : null;
        const shadowType = renderer && renderer.shadowMap ? getThreeShadowMapTypeName(renderer.shadowMap.type) : 'none';
        const sunLight = state && state.sunLight ? state.sunLight : null;
        const shadow = sunLight && sunLight.shadow ? sunLight.shadow : null;
        const mapSize = shadow && shadow.mapSize
            ? `${shadow.mapSize.x || 0}x${shadow.mapSize.y || 0}`
            : '0x0';
        const direction = sunLight && sunLight.sunDirection
            ? sunLight.sunDirection
            : (sunLight && sunLight.position ? sunLight.position : null);

        if (!sunLight) {
            return `takram:none|${shadowType}`;
        }

        return [
            `takram:${sunLight.name || 'sun'}`,
            sunLight.visible ? 'visible' : 'hidden',
            sunLight.castShadow ? 'cast' : 'no-cast',
            typeof sunLight.intensity === 'number' ? sunLight.intensity.toFixed(2) : 'n/a',
            mapSize,
            shadow && shadow.map ? 'map' : 'no-map',
            vectorToSignature(direction),
            shadowType
        ].join('|');
    }

    function syncTakramShadowLightSignature(self, state, reason) {
        if (!self || !state) {
            return;
        }

        const signature = getTakramShadowLightSignature(self, state);
        if (signature === self._pmndrsTakramLightShadowSignature) {
            return;
        }

        const previousSignature = self._pmndrsTakramLightShadowSignature || '';
        self._pmndrsTakramLightShadowSignature = signature;
        self._pmndrsTakramLightShadowSignatureReason = reason || 'takram-light';
        self._pmndrsTakramLightShadowPreviousSignature = previousSignature;

        const sunLight = state.sunLight || null;
        if (sunLight && sunLight.castShadow && typeof self.markShadowDirty === 'function') {
            self.markShadowDirty(reason || 'takram-light-ready');
        }
    }

    function syncPresentedTakramLightDirections(self, config) {
        const state = self && self._pmndrsTakramLightSources ? self._pmndrsTakramLightSources : null;
        if (!state || !config) {
            return false;
        }

        const presentedConfig = getPresentedPmndrsAtmosphereConfig(self, config);
        const sunLight = state.sunLight || null;
        const skyLight = state.skyLight || null;
        const moonLight = state.moonLight || null;
        const moonTarget = state.moonTarget || null;
        const directionSignature = [
            vectorToSignature(presentedConfig.localSunDirection || presentedConfig.sunDirection),
            vectorToSignature(presentedConfig.localMoonDirection || presentedConfig.moonDirection)
        ].join('|');

        if (self._pmndrsPresentedTakramLightDirectionSignature === directionSignature) {
            syncPresentedShadowLightTransforms(self);
            return false;
        }
        self._pmndrsPresentedTakramLightDirectionSignature = directionSignature;

        if (sunLight && presentedConfig.sunDirection && sunLight.sunDirection) {
            sunLight.sunDirection.copy(presentedConfig.sunDirection);
            ensurePmndrsWorldToEcefMatrix(sunLight, presentedConfig);
            if (typeof sunLight.update === 'function') {
                sunLight.update();
            }
        }

        if (skyLight && presentedConfig.sunDirection && skyLight.sunDirection) {
            skyLight.sunDirection.copy(presentedConfig.sunDirection);
            ensurePmndrsWorldToEcefMatrix(skyLight, presentedConfig);
            if (typeof skyLight.update === 'function') {
                skyLight.update();
            }
        }

        if (moonLight) {
            const moonDirection = getPmndrsMoonSceneLightDirection(presentedConfig);
            if (moonTarget) {
                moonLight.target = moonTarget;
            }
            if (moonDirection && moonLight.position && typeof moonLight.position.copy === 'function') {
                moonLight.position.copy(moonDirection).normalize().multiplyScalar(28);
                moonLight.position.y += 4;
                moonLight.updateMatrixWorld(true);
            }
        }

        self._pmndrsTakramLightShadowSignature = getTakramShadowLightSignature(self, state);
        self._pmndrsTakramLightShadowSignatureReason = 'takram-light-direction';
        syncPresentedShadowLightTransforms(self);
        return true;
    }

    function ensurePmndrsTakramHorizonLights(self, config, preset, options) {
        if (!self || !config) {
            return false;
        }

        config = getPresentedPmndrsAtmosphereConfig(self, config);
        const opts = options || {};
        const fallbackAllowed = opts.fallback !== false;
        const vta = window.VRODOS_TAKRAM_ATMOSPHERE;
        const scene = self.el && self.el.object3D;
        const helperConfig = getPmndrsHorizonHelperLightConfig(self, preset, config);

        if (!vta || !scene || !vta.SunDirectionalLight || !vta.SkyLightProbe) {
            removePmndrsTakramLightSources(self);
            if (fallbackAllowed) {
                setAFrameDefaultLightsEnabled(self, false);
                ensurePmndrsFallbackHorizonLights(self, config, preset);
            }
            return false;
        }

        if (config.useTakramLightSources !== true) {
            removePmndrsTakramLightSources(self);
            if (fallbackAllowed) {
                setAFrameDefaultLightsEnabled(self, false);
                ensurePmndrsFallbackHorizonLights(self, config, preset);
            }
            return false;
        }

        const atmosphereState = self.ensurePmndrsAtmosphereResources ? self.ensurePmndrsAtmosphereResources() : null;
        const textures = atmosphereState && !atmosphereState.failed && atmosphereState.ready ? atmosphereState.textures : null;
        const hasTakramSunRadiance = Boolean(textures && textures.transmittanceTexture);
        const hasTakramSkyIrradiance = Boolean(textures && textures.irradianceTexture);

        if (!hasTakramSunRadiance || !hasTakramSkyIrradiance) {
            removePmndrsTakramLightSources(self);
            if (fallbackAllowed) {
                setAFrameDefaultLightsEnabled(self, false);
                ensurePmndrsFallbackHorizonLights(self, config, preset);
            }
            if (atmosphereState && !atmosphereState.failed) {
                schedulePmndrsTakramLightSourceRefresh(self, atmosphereState, config, preset, opts);
            }
            return false;
        }

        setAFrameDefaultLightsEnabled(self, false);
        removePhotorealHelperLightElements(self);

        let state = self._pmndrsTakramLightSources;
        if (!state) {
            const sunLight = new vta.SunDirectionalLight({
                distance: getDirectionalShadowDistanceForScene(self, 28),
                correctAltitude: config.correctAltitudeEnabled !== false
            });
            sunLight.name = 'vrodosPmndrsTakramSunLight';
            sunLight.userData.vrodosPmndrsTakramLightSource = true;

            const skyLight = new vta.SkyLightProbe({
                correctAltitude: config.correctAltitudeEnabled !== false
            });
            skyLight.name = 'vrodosPmndrsTakramSkyLight';
            skyLight.userData.vrodosPmndrsTakramLightSource = true;

            const fillLight = typeof THREE.HemisphereLight === 'function'
                ? new THREE.HemisphereLight('#cfe3ff', '#2c2a25', 0.3)
                : null;
            if (fillLight) {
                fillLight.name = 'vrodosPmndrsTakramPbrFillLight';
                fillLight.userData.vrodosPmndrsTakramLightSource = true;
            }

            const ambientLight = typeof THREE.AmbientLight === 'function'
                ? new THREE.AmbientLight('#dcecff', 0)
                : null;
            if (ambientLight) {
                ambientLight.name = 'vrodosPmndrsTakramDaylightBounceLight';
                ambientLight.userData.vrodosPmndrsTakramLightSource = true;
            }

            const moonLight = typeof THREE.DirectionalLight === 'function'
                ? new THREE.DirectionalLight('#b8c8ff', PMNDRS_NIGHT_MOON_LIGHT_INTENSITY)
                : null;
            const moonTarget = moonLight ? moonLight.target : null;
            if (moonLight) {
                moonLight.name = 'vrodosPmndrsTakramMoonLight';
                moonLight.userData.vrodosPmndrsTakramLightSource = true;
                moonLight.castShadow = false;
            }
            if (moonTarget) {
                moonTarget.name = 'vrodosPmndrsTakramMoonTarget';
                moonTarget.userData.vrodosPmndrsTakramLightSource = true;
            }

            const target = sunLight.target;
            target.name = 'vrodosPmndrsTakramSunTarget';
            target.userData.vrodosPmndrsTakramLightSource = true;

            scene.add(sunLight);
            scene.add(target);
            scene.add(skyLight);
            if (fillLight) {
                scene.add(fillLight);
            }
            if (ambientLight) {
                scene.add(ambientLight);
            }
            if (moonLight) {
                scene.add(moonLight);
            }
            if (moonTarget) {
                scene.add(moonTarget);
            }
            state = { sunLight, skyLight, fillLight, ambientLight, moonLight, target, moonTarget };
            self._pmndrsTakramLightSources = state;
        } else {
            if (state.sunLight && state.sunLight.parent !== scene) {
                scene.add(state.sunLight);
            }
            if (state.target && state.target.parent !== scene) {
                scene.add(state.target);
            }
            if (state.skyLight && state.skyLight.parent !== scene) {
                scene.add(state.skyLight);
            }
            if (!state.fillLight && typeof THREE.HemisphereLight === 'function') {
                state.fillLight = new THREE.HemisphereLight('#cfe3ff', '#2c2a25', 0.3);
                state.fillLight.name = 'vrodosPmndrsTakramPbrFillLight';
                state.fillLight.userData.vrodosPmndrsTakramLightSource = true;
            }
            if (state.fillLight && state.fillLight.parent !== scene) {
                scene.add(state.fillLight);
            }
            if (!state.ambientLight && typeof THREE.AmbientLight === 'function') {
                state.ambientLight = new THREE.AmbientLight('#dcecff', 0);
                state.ambientLight.name = 'vrodosPmndrsTakramDaylightBounceLight';
                state.ambientLight.userData.vrodosPmndrsTakramLightSource = true;
            }
            if (state.ambientLight && state.ambientLight.parent !== scene) {
                scene.add(state.ambientLight);
            }
            if (!state.moonLight && typeof THREE.DirectionalLight === 'function') {
                state.moonLight = new THREE.DirectionalLight('#b8c8ff', PMNDRS_NIGHT_MOON_LIGHT_INTENSITY);
                state.moonLight.name = 'vrodosPmndrsTakramMoonLight';
                state.moonLight.userData.vrodosPmndrsTakramLightSource = true;
                state.moonLight.castShadow = false;
                state.moonTarget = state.moonLight.target;
                if (state.moonTarget) {
                    state.moonTarget.name = 'vrodosPmndrsTakramMoonTarget';
                    state.moonTarget.userData.vrodosPmndrsTakramLightSource = true;
                }
            }
            if (state.moonLight && state.moonLight.parent !== scene) {
                scene.add(state.moonLight);
            }
            if (state.moonTarget && state.moonTarget.parent !== scene) {
                scene.add(state.moonTarget);
            }
        }

        const effectiveShadowQuality = typeof self.getEffectiveShadowQuality === 'function'
            ? self.getEffectiveShadowQuality()
            : self.data.shadowQuality;
        const shadowEnabled = effectiveShadowQuality !== 'off';
        const shadowMap = effectiveShadowQuality === 'high' ? 2048 : 1024;
        const contactShadowSettings = getTerrainSafeContactShadowSettings(self, typeof self.getContactShadowSettings === 'function'
            ? self.getContactShadowSettings()
            : (self.data.shadowQuality === 'high'
                ? { bias: -0.00016, normalBias: 0.018 }
                : { bias: -0.0001, normalBias: 0.012 }));
        const sunLight = state.sunLight;
        const skyLight = state.skyLight;
        const fillLight = state.fillLight;
        const ambientLight = state.ambientLight;
        const moonLight = state.moonLight;
        const moonTarget = state.moonTarget;
        const lightingSmoothingMs = getPmndrsRuntimeLightingSmoothingMs(config);
        const indirectLightingSmoothingMs = getPmndrsRuntimeIndirectLightingSmoothingMs(config);
        const dynamicCycleShadows = arePmndrsDayNightCycleDynamicShadowsEnabled(self, config);
        const adaptiveShadowCenter = dynamicCycleShadows ? getAdaptiveShadowCenter(self) : null;

        if (state.target) {
            if (adaptiveShadowCenter) {
                state.target.position.copy(adaptiveShadowCenter);
            } else {
                state.target.position.set(0, 0, 0);
            }
            state.target.updateMatrixWorld(true);
        }
        if (moonTarget) {
            moonTarget.position.set(0, 0, 0);
            moonTarget.updateMatrixWorld(true);
        }
        if (sunLight) {
            const useSunKey = !helperConfig.useMoonDirection;
            const sunDirectVisibility = getPmndrsSunDirectLightVisibility(config);
            const targetSunVisible = useSunKey && helperConfig.keyIntensity > 0 && sunDirectVisibility > 0.001;
            const targetSunIntensity = targetSunVisible
                ? (hasTakramSunRadiance ? 1 : helperConfig.keyIntensity) * sunDirectVisibility
                : 0;
            const sunIntensity = targetSunVisible
                ? smoothPmndrsRuntimeLightValue(
                    self,
                    'takramSunIntensity',
                    targetSunIntensity,
                    lightingSmoothingMs,
                    sunLight.intensity
                )
                : 0;
            sunLight.visible = sunIntensity > 0.001 || targetSunVisible;
            sunLight.intensity = sunIntensity;
            if (sunLight.color && typeof sunLight.color.copy === 'function') {
                sunLight.color.copy(smoothPmndrsRuntimeLightColor(
                    self,
                    'takramSunColor',
                    helperConfig.keyColor,
                    lightingSmoothingMs,
                    sunLight.color
                ));
            } else if (sunLight.color && typeof sunLight.color.set === 'function') {
                sunLight.color.set(helperConfig.keyColor);
            }
            sunLight.distance = getDirectionalShadowDistanceForScene(self, 28);
            if (typeof sunLight.correctAltitude !== 'undefined') {
                sunLight.correctAltitude = config.correctAltitudeEnabled !== false;
            }
            sunLight.castShadow = shadowEnabled && sunLight.visible && (!config.dayNightCycleEnabled || dynamicCycleShadows);
            sunLight.transmittanceTexture = textures ? (textures.transmittanceTexture || null) : null;
            if (config.sunDirection && sunLight.sunDirection) {
                sunLight.sunDirection.copy(config.sunDirection);
            }
            ensurePmndrsWorldToEcefMatrix(sunLight, config);
            if (sunLight.shadow) {
                const headsetShadowCap = typeof self.isVrRuntimeHeadsetProfile === 'function' && self.isVrRuntimeHeadsetProfile();
                const needsShadowMapShrink = sunLight.shadow.mapSize &&
                    ((sunLight.shadow.mapSize.x || 0) > shadowMap || (sunLight.shadow.mapSize.y || 0) > shadowMap);
                sunLight.shadow.mapSize.set(shadowMap, shadowMap);
                if (headsetShadowCap && needsShadowMapShrink && sunLight.shadow.map && typeof sunLight.shadow.map.dispose === 'function') {
                    sunLight.shadow.map.dispose();
                    sunLight.shadow.map = null;
                }
                sunLight.shadow.bias = contactShadowSettings.bias;
                sunLight.shadow.radius = getPmndrsDayNightShadowRadius(self);
                if (typeof sunLight.shadow.normalBias !== 'undefined') {
                    sunLight.shadow.normalBias = contactShadowSettings.normalBias;
                }
                const adaptiveShadowFitted = sunLight.userData && sunLight.userData.vrodosAdaptiveShadowFitted;
                if (sunLight.shadow.camera && !adaptiveShadowFitted) {
                    const shadowExtent = getDirectionalShadowDistanceForScene(self, 28);
                    sunLight.shadow.camera.top = shadowExtent;
                    sunLight.shadow.camera.right = shadowExtent;
                    sunLight.shadow.camera.left = -shadowExtent;
                    sunLight.shadow.camera.bottom = -shadowExtent;
                    if (typeof sunLight.shadow.camera.updateProjectionMatrix === 'function') {
                        sunLight.shadow.camera.updateProjectionMatrix();
                    }
                }
                if (!dynamicCycleShadows) {
                    sunLight.shadow.needsUpdate = true;
                }
            }
            if (typeof sunLight.update === 'function') {
                sunLight.update();
            }
            schedulePmndrsAtmosphereShadowFit(self, config);
        }

        if (moonLight) {
            const moonLightEnabled = shouldUsePmndrsMoonSceneLight(config);
            const moonDirection = getPmndrsMoonSceneLightDirection(config);
            const moonIntensity = getPmndrsMoonSceneLightIntensity(config);
            const targetMoonIntensity = moonLightEnabled && Boolean(moonDirection) ? moonIntensity : 0;
            const smoothedMoonIntensity = targetMoonIntensity > 0
                ? smoothPmndrsRuntimeLightValue(
                    self,
                    'takramMoonIntensity',
                    targetMoonIntensity,
                    lightingSmoothingMs,
                    moonLight.intensity
                )
                : 0;
            moonLight.visible = smoothedMoonIntensity > 0.001 || targetMoonIntensity > 0.001;
            moonLight.intensity = smoothedMoonIntensity;
            moonLight.castShadow = false;
            if (moonLight.color && typeof moonLight.color.copy === 'function') {
                moonLight.color.copy(smoothPmndrsRuntimeLightColor(
                    self,
                    'takramMoonColor',
                    '#b8c8ff',
                    lightingSmoothingMs,
                    moonLight.color
                ));
            } else if (moonLight.color && typeof moonLight.color.set === 'function') {
                moonLight.color.set('#b8c8ff');
            }
            if (moonTarget) {
                moonLight.target = moonTarget;
            }
            if (moonDirection && moonLight.position && typeof moonLight.position.copy === 'function') {
                moonLight.position.copy(moonDirection).normalize().multiplyScalar(28);
                moonLight.position.y += 4;
                moonLight.updateMatrixWorld(true);
            }
        }

        if (skyLight) {
            const targetSkyIntensity = helperConfig.fillIntensity > 0 && hasTakramSkyIrradiance
                ? getPmndrsTakramSkyLightIntensity(helperConfig, config)
                : 0;
            const skyIntensity = smoothPmndrsRuntimeLightValue(
                self,
                'takramSkyIntensity',
                targetSkyIntensity,
                indirectLightingSmoothingMs,
                skyLight.intensity
            );
            skyLight.visible = skyIntensity > 0.001 || targetSkyIntensity > 0.001;
            skyLight.intensity = skyIntensity;
            if (typeof skyLight.correctAltitude !== 'undefined') {
                skyLight.correctAltitude = config.correctAltitudeEnabled !== false;
            }
            skyLight.irradianceTexture = textures ? (textures.irradianceTexture || null) : null;
            if (config.sunDirection && skyLight.sunDirection) {
                skyLight.sunDirection.copy(config.sunDirection);
            }
            ensurePmndrsWorldToEcefMatrix(skyLight, config);
            if (typeof skyLight.update === 'function') {
                skyLight.update();
            }
        }

        if (fillLight) {
            const targetFillIntensity = helperConfig.fillIntensity > 0
                ? getPmndrsTakramPbrFillIntensity(helperConfig, config)
                : 0;
            const fillIntensity = smoothPmndrsRuntimeLightValue(
                self,
                'takramFillIntensity',
                targetFillIntensity,
                indirectLightingSmoothingMs,
                fillLight.intensity
            );
            fillLight.visible = fillIntensity > 0.001 || targetFillIntensity > 0.001;
            fillLight.intensity = fillIntensity;
            if (fillLight.color && typeof fillLight.color.copy === 'function') {
                fillLight.color.copy(smoothPmndrsRuntimeLightColor(
                    self,
                    'takramFillColor',
                    helperConfig.fillColor || '#cfe3ff',
                    indirectLightingSmoothingMs,
                    fillLight.color
                ));
            } else if (fillLight.color && typeof fillLight.color.set === 'function') {
                fillLight.color.set(helperConfig.fillColor || '#cfe3ff');
            }
            if (fillLight.groundColor && typeof fillLight.groundColor.copy === 'function') {
                fillLight.groundColor.copy(smoothPmndrsRuntimeLightColor(
                    self,
                    'takramFillGroundColor',
                    getPmndrsTakramGroundFillColor(config),
                    indirectLightingSmoothingMs,
                    fillLight.groundColor
                ));
            } else if (fillLight.groundColor && typeof fillLight.groundColor.set === 'function') {
                fillLight.groundColor.set(getPmndrsTakramGroundFillColor(config));
            }
        }

        if (ambientLight) {
            const ambientBounceIntensity = getPmndrsTakramAmbientBounceIntensity(config);
            const smoothedAmbientIntensity = smoothPmndrsRuntimeLightValue(
                self,
                'takramAmbientIntensity',
                ambientBounceIntensity,
                indirectLightingSmoothingMs,
                ambientLight.intensity
            );
            ambientLight.visible = smoothedAmbientIntensity > 0.001 || ambientBounceIntensity > 0.001;
            ambientLight.intensity = smoothedAmbientIntensity;
            if (ambientLight.color && typeof ambientLight.color.copy === 'function') {
                ambientLight.color.copy(smoothPmndrsRuntimeLightColor(
                    self,
                    'takramAmbientColor',
                    helperConfig.fillColor || '#dcecff',
                    indirectLightingSmoothingMs,
                    ambientLight.color
                ));
            } else if (ambientLight.color && typeof ambientLight.color.set === 'function') {
                ambientLight.color.set(helperConfig.fillColor || '#dcecff');
            }
        }

        syncTakramShadowLightSignature(self, state, 'takram-light-ready');
        return true;
    }

    function getPmndrsTakramLightSourceCount(self) {
        const state = self && self._pmndrsTakramLightSources;
        if (!state) {
            return 0;
        }

        return ['sunLight', 'skyLight', 'fillLight', 'ambientLight', 'moonLight'].reduce((count, key) => {
            const object = state[key];
            return count + (object && object.parent ? 1 : 0);
        }, 0);
    }

    function getVrTakramLightsOnlyUnavailableReason(self, atmosphereState) {
        if (!isVrTakramLightsOnlyProfile(self)) {
            return '';
        }

        if (!self.data || self.data.selChoice !== "0") {
            return 'not-horizon-scene';
        }

        if (self.data.postFXEngine !== 'pmndrs') {
            return 'pmndrs-atmosphere-not-compiled';
        }

        if (self.data.pmndrsAtmosphereEnabled === '0') {
            return 'pmndrs-atmosphere-disabled';
        }

        const vta = window.VRODOS_TAKRAM_ATMOSPHERE;
        if (!vta) {
            return 'takram-bundle-missing';
        }

        if (!vta.SunDirectionalLight || !vta.SkyLightProbe) {
            return 'takram-light-classes-missing';
        }

        if (atmosphereState && atmosphereState.failed) {
            return 'takram-resources-failed';
        }

        if (!atmosphereState || !atmosphereState.ready) {
            return 'takram-resources-pending';
        }

        const textures = atmosphereState.textures || null;
        if (!(textures && textures.transmittanceTexture && textures.irradianceTexture)) {
            return 'takram-luts-pending';
        }

        return '';
    }

    function isPmndrsTakramLocalHorizonMode(self) {
        return Boolean(self && self.data && self.data.selChoice === "0");
    }

    function applyPmndrsTakramLocalHorizonConstraints(self, config) {
        if (!config) {
            return config;
        }

        // Local Horizon scenes keep Takram's own sky sun enabled and use
        // Takram light sources when their LUTs are ready. The stable VRodos
        // helper-light path remains an internal fallback for missing Takram
        // resources, not an author-facing render mode.
        if (shouldUseVrTakramVisibleSky(self)) {
            const groundAlbedo = normalizePmndrsColor(config.groundAlbedo, '#1a1a1a');
            config.groundEnabled = true;
            config.groundAlbedo = groundAlbedo.toLowerCase() === '#000000' ? '#1a1a1a' : groundAlbedo;
        } else {
            config.groundEnabled = false;
        }
        config.takramSunEnabled = true;
        config.useTakramLightSources = shouldUsePmndrsTakramPhysicalHorizonLights();
        config.sunAngularRadius = TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS;
        return config;
    }

    function resetPmndrsTakramHorizonState(state) {
        if (!state) {
            return state;
        }

        state.mode = 'inactive';
        state.owner = 'none';
        state.usesTakramGround = false;
        state.usesTakramSunDisk = false;
        state.usesTakramLightSources = false;
        state.groundEnabled = false;
        state.takramSunEnabled = false;
        state.localSunDirection.set(0, 0, 0);
        state.sunDirectionECEF.set(0, 0, 0);
        state.moonDirectionECEF.set(0, 0, 0);
        state.anchorPositionECEF.set(0, 0, 0);
        state.worldToECEFMatrix.identity();
        return state;
    }

    function ensurePmndrsTakramHorizonState(self) {
        if (!self) {
            return null;
        }

        if (!self._pmndrsTakramHorizonState) {
            self._pmndrsTakramHorizonState = {
                mode: 'inactive',
                owner: 'none',
                anchorPositionECEF: new THREE.Vector3(),
                worldToECEFMatrix: new THREE.Matrix4(),
                localSunDirection: new THREE.Vector3(),
                sunDirectionECEF: new THREE.Vector3(),
                moonDirectionECEF: new THREE.Vector3(),
                usesTakramGround: false,
                usesTakramSunDisk: false,
                usesTakramLightSources: false,
                groundEnabled: false,
                takramSunEnabled: false
            };
        }

        return self._pmndrsTakramHorizonState;
    }

    function syncPmndrsTakramHorizonState(self, config) {
        const state = ensurePmndrsTakramHorizonState(self);
        if (!state) {
            return null;
        }

        if (!(config && config.enabled && isPmndrsTakramLocalHorizonMode(self))) {
            return resetPmndrsTakramHorizonState(state);
        }

        state.mode = 'local-light-source';
        state.owner = 'takram-light-source';
        state.groundEnabled = Boolean(config.groundEnabled);
        state.takramSunEnabled = config.takramSunEnabled !== false;
        state.usesTakramGround = Boolean(config.groundEnabled);
        state.usesTakramSunDisk = config.takramSunEnabled !== false;
        state.usesTakramLightSources = config.useTakramLightSources === true;

        if (config.localSunDirection) {
            state.localSunDirection.copy(config.localSunDirection);
        }
        if (config.sunDirection) {
            state.sunDirectionECEF.copy(config.sunDirection);
        }
        if (config.moonDirection) {
            state.moonDirectionECEF.copy(config.moonDirection);
        }

        ensurePmndrsWorldToEcefMatrix(state, config);
        state.anchorPositionECEF.setFromMatrixPosition(state.worldToECEFMatrix);
        return state;
    }

    H.getPmndrsTakramHorizonState = function () {
        return ensurePmndrsTakramHorizonState(this);
    };

    H.getVrTakramLightsOnlyState = function () {
        const requested = isVrTakramLightsOnlyProfile(this);
        const eligible = shouldUseVrTakramLightsOnly(this);
        const atmosphereState = this._pmndrsAtmosphereState || null;
        const sourceCount = getPmndrsTakramLightSourceCount(this);
        const unavailableReason = getVrTakramLightsOnlyUnavailableReason(this, atmosphereState);
        const active = Boolean(requested && eligible && sourceCount > 0 && unavailableReason === '');

        return {
            requested,
            eligible,
            active,
            owner: active ? 'takram-light-source' : 'vrodos-managed-light',
            skyOwner: 'vrodos-gradient-sky',
            sourceCount,
            unavailableReason: active ? '' : unavailableReason,
            aFrameHorizon: false
        };
    };

    H.getPmndrsAtmosphereConfig = function () {
        if (!this || !this.data) {
            return null;
        }

        const quality = normalizePmndrsAtmosphereQuality(typeof this.getPmndrsAtmosphereQuality === 'function'
            ? this.getPmndrsAtmosphereQuality()
            : this.data.pmndrsAtmosphereQuality);
        const preset = normalizePmndrsAtmospherePreset(this.data.pmndrsAtmospherePreset);
        const authoredCelestialMode = normalizePmndrsCelestialMode(this.data.pmndrsCelestialMode);
        const celestialTimePreset = normalizePmndrsCelestialTimePreset(this.data.pmndrsCelestialTimePreset);
        const celestialDate = normalizePmndrsDate(this.data.pmndrsCelestialDate);
        const celestialUtcTime = normalizePmndrsUtcTime(this.data.pmndrsCelestialUtcTime);
        const dayNightCycleEnabled = isPmndrsDayNightCycleEnabled(this);
        const dayNightCycleDurationMinutes = getPmndrsDayNightCycleDurationMinutes(this);
        const celestialMode = dayNightCycleEnabled ? 'datetime' : authoredCelestialMode;
        const presetIntensity = readPmndrsAtmosphereNumber(this, 'pmndrsAtmospherePresetIntensity', 0, 1, 1);
        const resolvedLookPreset = celestialMode === 'preset-time' ? celestialTimePreset : preset;
        const presetDefaults = getPmndrsAtmosphereLookDefaults(dayNightCycleEnabled ? 'midday' : resolvedLookPreset, presetIntensity);
        const usesCustomValues = !dayNightCycleEnabled && celestialMode !== 'preset-time' && preset === 'custom';
        const effectiveCelestialTimePreset = resolvedLookPreset === 'custom' ? celestialTimePreset : resolvedLookPreset;
        const manualMoonEnabled = readPmndrsAtmosphereBool(this, 'pmndrsMoonEnabled', presetDefaults.moonEnabled);
        const geospatialEnabled = readPmndrsAtmosphereBool(this, 'pmndrsGeospatialEnabled', false);
        const config = {
            enabled: this.data.postFXEngine === 'pmndrs' && this.data.pmndrsAtmosphereEnabled !== '0',
            preset,
            celestialMode,
            authoredCelestialMode,
            celestialTimePreset: effectiveCelestialTimePreset,
            authoredCelestialTimePreset: celestialTimePreset,
            celestialDate,
            celestialUtcTime,
            dayNightCycleEnabled,
            dayNightCycleDurationMinutes,
            resolvedLookPreset,
            presetIntensity,
            quality,
            lowLightAutoExposureEnabled: readPmndrsAtmosphereBool(this, 'pmndrsLowLightAutoExposureEnabled', true),
            toneMappingExposureAuthored: readPmndrsAtmosphereBool(this, 'pmndrsToneMappingExposureAuthored', false),
            starsEnabled: normalizePmndrsStarsEnabled(this.data.pmndrsStarsEnabled),
            geospatialEnabled,
            geospatialLatitudeDeg: readPmndrsAtmosphereNumber(this, 'pmndrsGeospatialLatitudeDeg', -90, 90, 0),
            geospatialLongitudeDeg: readPmndrsAtmosphereNumber(this, 'pmndrsGeospatialLongitudeDeg', -180, 180, 0),
            geospatialAltitudeMeters: readPmndrsAtmosphereNumber(this, 'pmndrsGeospatialAltitudeMeters', -500, 20000, 0),
            aerialPerspectiveEnabled: readPmndrsAtmosphereBool(this, 'pmndrsAerialPerspectiveEnabled', false),
            correctAltitudeEnabled: readPmndrsAtmosphereBool(this, 'pmndrsCorrectAltitudeEnabled', true),
            sunElevationDeg: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsSunElevationDeg', -18, 85, presetDefaults.sunElevationDeg) : presetDefaults.sunElevationDeg,
            sunAzimuthDeg: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsSunAzimuthDeg', -180, 180, presetDefaults.sunAzimuthDeg) : presetDefaults.sunAzimuthDeg,
            sunDistance: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsSunDistance', 1500, 20000, presetDefaults.sunDistance) : presetDefaults.sunDistance,
            sunAngularRadius: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsSunAngularRadius', 0.002, 0.03, presetDefaults.sunAngularRadius) : presetDefaults.sunAngularRadius,
            aerialStrength: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsAerialStrength', 0, 2, presetDefaults.aerialStrength) : presetDefaults.aerialStrength,
            albedoScale: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsAlbedoScale', 0, 2, presetDefaults.albedoScale) : presetDefaults.albedoScale,
            transmittanceEnabled: usesCustomValues ? readPmndrsAtmosphereBool(this, 'pmndrsTransmittanceEnabled', presetDefaults.transmittanceEnabled) : presetDefaults.transmittanceEnabled,
            inscatterEnabled: usesCustomValues ? readPmndrsAtmosphereBool(this, 'pmndrsInscatterEnabled', presetDefaults.inscatterEnabled) : presetDefaults.inscatterEnabled,
            groundEnabled: usesCustomValues ? readPmndrsAtmosphereBool(this, 'pmndrsGroundEnabled', presetDefaults.groundEnabled) : presetDefaults.groundEnabled,
            groundAlbedo: usesCustomValues ? normalizePmndrsColor(this.data.pmndrsGroundAlbedo, presetDefaults.groundAlbedo) : presetDefaults.groundAlbedo,
            rayleighScale: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsRayleighScale', 0.1, 3, presetDefaults.rayleighScale) : presetDefaults.rayleighScale,
            mieScatteringScale: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsMieScatteringScale', 0.1, 3, presetDefaults.mieScatteringScale) : presetDefaults.mieScatteringScale,
            mieExtinctionScale: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsMieExtinctionScale', 0.1, 3, presetDefaults.mieExtinctionScale) : presetDefaults.mieExtinctionScale,
            miePhaseG: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsMiePhaseG', 0, 0.99, presetDefaults.miePhaseG) : presetDefaults.miePhaseG,
            absorptionScale: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsAbsorptionScale', 0.1, 3, presetDefaults.absorptionScale) : presetDefaults.absorptionScale,
            moonEnabled: dayNightCycleEnabled ? true : ((celestialMode === 'preset-time' || celestialMode === 'datetime') ? manualMoonEnabled : (usesCustomValues ? manualMoonEnabled : presetDefaults.moonEnabled)),
            horizonKeyLightIntensity: readPmndrsAtmosphereNumber(
                this,
                'pmndrsHorizonKeyLightIntensity',
                0,
                3,
                getPmndrsHorizonHelperLightDefaults(typeof this.getHorizonSkyPreset === 'function' ? this.getHorizonSkyPreset() : 'natural').keyIntensity
            ),
            horizonFillLightIntensity: readPmndrsAtmosphereNumber(
                this,
                'pmndrsHorizonFillLightIntensity',
                0,
                3,
                getPmndrsHorizonHelperLightDefaults(typeof this.getHorizonSkyPreset === 'function' ? this.getHorizonSkyPreset() : 'natural').fillIntensity
            ),
            takramSunEnabled: true
        };

        if (isPmndrsTakramLocalHorizonMode(this)) {
            applyPmndrsTakramLocalHorizonConstraints(this, config);
        }

        config.localSunDirection = buildPmndrsLocalSunDirection(config.sunElevationDeg, config.sunAzimuthDeg);
        config.localMoonDirection = buildPmndrsMoonDirection(config.localSunDirection);
        config.sunDirection = buildPmndrsEcefSunDirection(config.localSunDirection, config);
        config.moonDirection = buildPmndrsMoonDirection(config.sunDirection);

        if (celestialMode === 'datetime' && window.VRODOS_TAKRAM_ATMOSPHERE) {
            const frame = getPmndrsResolvedGeospatialFrame(config);
            const observerECEF = frame.position;
            const date = dayNightCycleEnabled
                ? getPmndrsDayNightCycleEffectiveDate(this, celestialDate, celestialUtcTime, dayNightCycleDurationMinutes)
                : getPmndrsDateObject(celestialDate, celestialUtcTime);
            const vta = window.VRODOS_TAKRAM_ATMOSPHERE;
            config.effectiveDate = date;

            if (typeof vta.getSunDirectionECEF === 'function') {
                config.sunDirection = vta.getSunDirectionECEF(date, new THREE.Vector3(), observerECEF).normalize();
                config.localSunDirection = ecefDirectionToPmndrsLocal(config.sunDirection, frame);
                applyLocalDirectionAngles(config);
            }
            if (typeof vta.getMoonDirectionECEF === 'function') {
                config.moonDirection = vta.getMoonDirectionECEF(date, new THREE.Vector3(), observerECEF).normalize();
                config.localMoonDirection = ecefDirectionToPmndrsLocal(config.moonDirection, frame);
            } else {
                config.moonDirection = buildPmndrsMoonDirection(config.sunDirection);
                config.localMoonDirection = buildPmndrsMoonDirection(config.localSunDirection);
            }
            if (typeof vta.getECIToECEFRotationMatrix === 'function') {
                config.inertialToECEFMatrix = vta.getECIToECEFRotationMatrix(date, new THREE.Matrix4());
            }
        }
        syncPmndrsTakramHorizonState(this, config);
        return config;
    };

    H.getPmndrsToneMappingExposure = function () {
        return getPmndrsExposureValue(this);
    };

    H.isPmndrsDayNightCycleActive = function () {
        return isPmndrsDayNightCycleEnabled(this);
    };

    H.updatePmndrsDayNightCycleFrame = function (time) {
        if (typeof time === 'number') {
            this._pmndrsTickTimeMs = time;
        }
        if (!isPmndrsDayNightCycleEnabled(this)) {
            return;
        }

        const atmosphereConfig = typeof this.getPmndrsAtmosphereConfig === 'function' ? this.getPmndrsAtmosphereConfig() : null;
        const renderer = this.el && this.el.renderer ? this.el.renderer : null;
        if (renderer && typeof renderer.toneMappingExposure !== 'undefined') {
            renderer.toneMappingExposure = smoothPmndrsRuntimeLightValue(
                this,
                'takramToneMappingExposure',
                getPmndrsExposureValue(this),
                getPmndrsRuntimeLightingSmoothingMs(atmosphereConfig),
                renderer.toneMappingExposure
            );
        }

        if (typeof this.syncPmndrsAerialPerspectiveEffect === 'function') {
            this.syncPmndrsAerialPerspectiveEffect(this.el ? this.el.camera : null, atmosphereConfig);
        }
        if (atmosphereConfig && atmosphereConfig.enabled && shouldUsePmndrsTakramHorizonPath(this)) {
            const preset = typeof this.getHorizonSkyPreset === 'function' ? this.getHorizonSkyPreset() : 'natural';
            ensurePmndrsTakramHorizonLights(this, atmosphereConfig, preset);
            ensurePmndrsAtmosphereSky(this, atmosphereConfig);
        } else if (atmosphereConfig && atmosphereConfig.enabled && shouldUseVrTakramLightsOnly(this)) {
            const preset = typeof this.getHorizonSkyPreset === 'function' ? this.getHorizonSkyPreset() : 'natural';
            const lightsReady = ensurePmndrsTakramHorizonLights(this, atmosphereConfig, preset, {
                fallback: false,
                ensureSky: false
            });
            if (!lightsReady) {
                setAFrameDefaultLightsEnabled(this, false);
                ensurePmndrsFallbackHorizonLights(this, atmosphereConfig, preset);
            }
            syncVrTakramLightsOnlyHorizonVisuals(this, false);
        }
    };

    H.getPmndrsToneMappingMode = function () {
        return normalizePmndrsToneMappingMode(this && this.data ? this.data.pmndrsToneMappingMode : 'agx');
    };

    H.getPmndrsReflectionIntensityScale = function (atmosphereConfig, reflectionSource) {
        return getPmndrsNightReflectionIntensityScale(this, atmosphereConfig, reflectionSource);
    };

    H.getPmndrsStarsIntensity = function (atmosphereConfig) {
        return getPmndrsStarsIntensity(atmosphereConfig);
    };

    H.applyPmndrsAtmosphereConfigToTarget = function (target, config) {
        const vta = window.VRODOS_TAKRAM_ATMOSPHERE;
        if (!target || !config || !vta) {
            return;
        }

        const params = createPmndrsAtmosphereParameters(vta, config);
        copyPmndrsAtmosphereParameters(target, params);

        if (typeof config.sunAngularRadius !== 'undefined') {
            if (target.atmosphere) target.atmosphere.sunAngularRadius = config.sunAngularRadius;
            if (typeof target.sunAngularRadius !== 'undefined') target.sunAngularRadius = config.sunAngularRadius;
            if (target.uniforms) {
                let atmpsVal = null;
                if (typeof target.uniforms.has === 'function' && target.uniforms.has('ATMOSPHERE')) {
                    atmpsVal = target.uniforms.get('ATMOSPHERE').value;
                } else if (target.uniforms.ATMOSPHERE) {
                    atmpsVal = target.uniforms.ATMOSPHERE.value;
                }
                
                if (atmpsVal && typeof atmpsVal.sun_angular_radius !== 'undefined') {
                    atmpsVal.sun_angular_radius = config.sunAngularRadius;
                }
            }
        }

        if (target.sunDirection && typeof target.sunDirection.copy === 'function') {
            target.sunDirection.copy(config.sunDirection);
        }
        if (target.moonDirection && typeof target.moonDirection.copy === 'function') {
            target.moonDirection.copy(config.moonDirection);
        }
        if (typeof target.ground !== 'undefined') {
            target.ground = config.groundEnabled;
        }
        if (typeof target.correctAltitude !== 'undefined') {
            target.correctAltitude = config.correctAltitudeEnabled !== false;
        }

        const setDefine = function (defs, key, val) {
            if (defs && typeof defs.set === 'function') {
                if (defs.get(key) !== val) { defs.set(key, val); return true; }
            } else if (defs) {
                if (defs[key] !== val) { defs[key] = val; return true; }
            }
            return false;
        };
        const removeDefine = function (defs, key) {
            if (defs && typeof defs.delete === 'function') {
                if (defs.has(key)) { defs.delete(key); return true; }
            } else if (defs) {
                if (defs[key]) { delete defs[key]; return true; }
            }
            return false;
        };

        target.sun = config.takramSunEnabled !== false;
        if (target.sun) {
            target.defines = target.defines || {};
            let needsRecompile = false;
            if (setDefine(target.defines, "SUN", "1")) needsRecompile = true;
            if (setDefine(target.defines, "PERSPECTIVE_CAMERA", "1")) needsRecompile = true;
            if (needsRecompile) {
                target.needsUpdate = true;
                if (typeof target.setChanged === 'function') target.setChanged();
            }
        } else if (!target.sun && target.defines) {
            if (removeDefine(target.defines, "SUN")) {
                target.needsUpdate = true;
                if (typeof target.setChanged === 'function') target.setChanged();
            }
        }
        if (typeof target.moon !== 'undefined') {
            target.moon = config.moonEnabled;
        }
        if (typeof target.transmittance !== 'undefined') {
            target.transmittance = config.transmittanceEnabled;
        }
        if (typeof target.inscatter !== 'undefined') {
            target.inscatter = config.inscatterEnabled;
        }
        if (typeof target.albedoScale !== 'undefined') {
            target.albedoScale = config.albedoScale;
        }
        if (target.blendMode && target.blendMode.opacity) {
            target.blendMode.opacity.value = config.aerialStrength;
        }
        ensurePmndrsWorldToEcefMatrix(target, config);
    };

    H.ensurePmndrsAtmosphereResources = function () {
        const renderer = this && this.el ? this.el.renderer : null;
        const scene = this && this.el ? this.el.object3D : null;
        const vta = window.VRODOS_TAKRAM_ATMOSPHERE;
        if (!renderer || !scene || !vta) {
            return null;
        }

        const profile = getPmndrsAtmosphereResourceProfile(this, renderer);

        if (this._pmndrsAtmosphereState && this._pmndrsAtmosphereState.profileSignature === profile.signature) {
            return this._pmndrsAtmosphereState;
        }

        if (this._pmndrsAtmosphereState) {
            this.disposePmndrsAtmosphere();
        }

        const state = {
            generator: null,
            textures: null,
            promise: null,
            skyMesh: null,
            skyMaterial: null,
            skyGeometry: null,
            starsMesh: null,
            starsMaterial: null,
            starsGeometry: null,
            starsFallbackMesh: null,
            starsFallbackMaterial: null,
            starsFallbackGeometry: null,
            starsData: null,
            starsDataUrl: '',
            starsDataPromise: null,
            starsFailed: false,
            starsIntensity: 0,
            ready: false,
            failed: false,
            profileSignature: profile.signature,
            precision: profile.useFloat ? 'float' : 'half',
            higherOrderScattering: profile.higherOrderScattering,
            combinedScattering: profile.combinedScattering,
            vrTakramSkyDirectCalibrated: false,
            vrTakramSkyDirectExposure: null
        };

        try {
            state.generator = new vta.PrecomputedTexturesGenerator(renderer, {
                type: profile.type,
                combinedScattering: profile.combinedScattering,
                higherOrderScattering: profile.higherOrderScattering
            });
            state.textures = state.generator.textures;
            state.promise = state.generator.update().then(() => {
                state.ready = true;
                return state.textures;
            }).catch((err) => {
                state.failed = true;
                console.warn('[VRodos] Takram atmosphere precompute failed, falling back to PMNDRS gradient horizon:', err);
            });
        } catch (err) {
            if (profile.useFloat && typeof THREE.HalfFloatType !== 'undefined') {
                try {
                    state.generator = new vta.PrecomputedTexturesGenerator(renderer, {
                        type: THREE.HalfFloatType,
                        combinedScattering: profile.combinedScattering,
                        higherOrderScattering: profile.higherOrderScattering
                    });
                    state.textures = state.generator.textures;
                    state.precision = 'half-fallback';
                    state.profileSignature = `${profile.quality  }:half:${  profile.higherOrderScattering ? 'higher' : 'basic'  }:${  profile.combinedScattering ? 'combined' : 'split'}`;
                    state.promise = state.generator.update().then(() => {
                        state.ready = true;
                        return state.textures;
                    }).catch((fallbackErr) => {
                        state.failed = true;
                        console.warn('[VRodos] Takram atmosphere precompute failed, falling back to PMNDRS gradient horizon:', fallbackErr);
                    });
                } catch (fallbackErr) {
                    state.failed = true;
                    console.warn('[VRodos] Takram atmosphere init failed, falling back to PMNDRS gradient horizon:', fallbackErr);
                }
            } else {
                state.failed = true;
                console.warn('[VRodos] Takram atmosphere init failed, falling back to PMNDRS gradient horizon:', err);
            }
        }

        this._pmndrsAtmosphereState = state;
        return state;
    };

    H.disposePmndrsAtmosphere = function () {
        if (!this || !this._pmndrsAtmosphereState) {
            return;
        }

        const state = this._pmndrsAtmosphereState;
        removePmndrsAtmosphereSky(this);

        if (state.generator && typeof state.generator.dispose === 'function') {
            try {
                state.generator.dispose();
            } catch (err) {
                console.warn('[VRodos] Takram atmosphere dispose failed:', err);
            }
        }

        this._pmndrsAtmosphereState = null;
    };

    function loadPmndrsTakramStarsData(self, state) {
        if (!state || state.starsData || state.starsDataPromise || state.starsFailed) {
            return state ? state.starsDataPromise : null;
        }
        if (!THREE.FileLoader || typeof THREE.FileLoader !== 'function') {
            state.starsFailed = true;
            return null;
        }

        const url = getPmndrsTakramStarsDataUrl();
        state.starsDataUrl = url;
        const loader = new THREE.FileLoader();
        loader.setResponseType('arraybuffer');
        state.starsDataPromise = new Promise((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
        }).then((data) => {
            state.starsData = data;
            return data;
        }).catch((err) => {
            state.starsFailed = true;
            console.warn('[VRodos] Takram stars data failed to load:', err);
            return null;
        });
        state.starsDataPromise.then(() => {
            if (self && self._pmndrsAtmosphereState === state && state.starsData && state.starsIntensity > 0) {
                const latestConfig = self.getPmndrsAtmosphereConfig ? self.getPmndrsAtmosphereConfig() : null;
                ensurePmndrsAtmosphereStars(self, latestConfig, state, window.VRODOS_TAKRAM_ATMOSPHERE);
            }
        });
        return state.starsDataPromise;
    }

    function createPmndrsStarsFallbackGeometry(data) {
        if (!data || !THREE.BufferGeometry || !THREE.BufferAttribute) {
            return null;
        }

        const int16Array = new Int16Array(data);
        const uint8Array = new Uint8Array(data);
        const count = Math.floor(int16Array.length / 5);
        if (count <= 0) {
            return null;
        }

        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const dimMagnitude = Math.pow(10, -8 / 2.5);
        const brightMagnitude = Math.pow(10, 2 / 2.5);

        for (let i = 0; i < count; i += 1) {
            const int16Offset = i * 5;
            let x = int16Array[int16Offset] / 32767;
            let y = int16Array[int16Offset + 1] / 32767;
            let z = int16Array[int16Offset + 2] / 32767;
            const length = Math.sqrt(x * x + y * y + z * z) || 1;
            x /= length;
            y /= length;
            z /= length;

            const positionOffset = i * 3;
            positions[positionOffset] = x;
            positions[positionOffset + 1] = y;
            positions[positionOffset + 2] = z;

            const uint8Offset = i * 10;
            const magnitudeNormalized = uint8Array[uint8Offset + 6] / 255;
            const magnitude = -2 + magnitudeNormalized * 10;
            const magnitudeRadiance = Math.pow(10, -magnitude / 2.5);
            const magnitudeWeight = Math.max(0, Math.min(1, (magnitudeRadiance - dimMagnitude) / (brightMagnitude - dimMagnitude)));
            const visibilityWeight = Math.max(0.08, Math.pow(magnitudeWeight, 0.45));
            colors[positionOffset] = Math.min(1, (uint8Array[uint8Offset + 7] / 255) * visibilityWeight * 1.8);
            colors[positionOffset + 1] = Math.min(1, (uint8Array[uint8Offset + 8] / 255) * visibilityWeight * 1.8);
            colors[positionOffset + 2] = Math.min(1, (uint8Array[uint8Offset + 9] / 255) * visibilityWeight * 1.8);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        if (typeof geometry.computeBoundingSphere === 'function') {
            geometry.computeBoundingSphere();
        }
        return geometry;
    }

    function getPmndrsStarsLocalRotationMatrix(config) {
        if (!config || !config.inertialToECEFMatrix || !THREE.Matrix4) {
            return null;
        }
        if (config._starsLocalRotationMatrix) {
            return config._starsLocalRotationMatrix;
        }

        const frame = getPmndrsResolvedGeospatialFrame(config);
        const eciToEcef = config.inertialToECEFMatrix.clone();
        if (typeof eciToEcef.setPosition === 'function') {
            eciToEcef.setPosition(0, 0, 0);
        }
        if (!frame || !frame.matrix || typeof frame.matrix.clone !== 'function') {
            config._starsLocalRotationMatrix = eciToEcef;
            return config._starsLocalRotationMatrix;
        }

        const ecefToWorld = frame.matrix.clone();
        if (typeof ecefToWorld.invert === 'function') {
            ecefToWorld.invert();
        } else if (typeof ecefToWorld.getInverse === 'function') {
            ecefToWorld.getInverse(frame.matrix);
        } else {
            config._starsLocalRotationMatrix = eciToEcef;
            return config._starsLocalRotationMatrix;
        }
        if (typeof ecefToWorld.setPosition === 'function') {
            ecefToWorld.setPosition(0, 0, 0);
        }

        config._starsLocalRotationMatrix = new THREE.Matrix4().multiplyMatrices(ecefToWorld, eciToEcef);
        return config._starsLocalRotationMatrix;
    }

    function ensurePmndrsAtmosphereStarsFallback(self, config, state, intensity) {
        if (!self || !state || !state.starsData || intensity <= 0 || !self.el || !self.el.object3D || !THREE.Points || !THREE.PointsMaterial) {
            return false;
        }

        if (!state.starsFallbackMesh) {
            state.starsFallbackGeometry = createPmndrsStarsFallbackGeometry(state.starsData);
            if (!state.starsFallbackGeometry) {
                return false;
            }
            state.starsFallbackMaterial = new THREE.PointsMaterial({
                size: PMNDRS_STARS_FALLBACK_POINT_SIZE,
                sizeAttenuation: false,
                vertexColors: true,
                transparent: true,
                opacity: 0.9,
                depthWrite: false,
                depthTest: true,
                fog: false,
                blending: THREE.AdditiveBlending || THREE.NormalBlending
            });
            state.starsFallbackMaterial.toneMapped = false;
            state.starsFallbackMesh = new THREE.Points(state.starsFallbackGeometry, state.starsFallbackMaterial);
            state.starsFallbackMesh.frustumCulled = false;
            state.starsFallbackMesh.renderOrder = -998;
            state.starsFallbackMesh.userData.vrodosPmndrsAtmosphereStars = true;
            state.starsFallbackMesh.name = 'vrodosPmndrsAtmosphereStarsFallback';
            state.starsFallbackMesh.onBeforeRender = function (_renderer, _scene, camera) {
                const cameraFar = camera && typeof camera.far === 'number' ? camera.far : PMNDRS_STARS_FALLBACK_RADIUS;
                const radius = Math.max(1000, Math.min(PMNDRS_STARS_FALLBACK_RADIUS, cameraFar * 0.72));
                this.scale.setScalar(radius);
                if (camera && camera.position && this.position && typeof this.position.copy === 'function') {
                    this.position.copy(camera.position);
                }
            };
            self.el.object3D.add(state.starsFallbackMesh);
        } else if (state.starsFallbackMesh.parent !== self.el.object3D) {
            self.el.object3D.add(state.starsFallbackMesh);
        }

        if (state.starsFallbackMaterial) {
            const normalizedIntensity = Math.max(0, Math.min(1, intensity / PMNDRS_STARS_NIGHT_INTENSITY));
            state.starsFallbackMaterial.opacity = Math.max(0.18, Math.min(0.92, 0.18 + normalizedIntensity * 0.74));
            state.starsFallbackMaterial.size = PMNDRS_STARS_FALLBACK_POINT_SIZE;
            state.starsFallbackMaterial.needsUpdate = true;
        }

        if (state.starsFallbackMesh) {
            state.starsFallbackMesh.visible = true;
            const starsRotationMatrix = getPmndrsStarsLocalRotationMatrix(config);
            if (starsRotationMatrix && typeof state.starsFallbackMesh.setRotationFromMatrix === 'function') {
                state.starsFallbackMesh.setRotationFromMatrix(starsRotationMatrix);
            } else if (state.starsFallbackMesh.rotation && typeof state.starsFallbackMesh.rotation.set === 'function') {
                state.starsFallbackMesh.rotation.set(0, 0, 0);
            }
        }

        return true;
    }

    function ensurePmndrsAtmosphereStars(self, config, state, vta) {
        if (!self || !state || !config || state.failed || state.starsFailed || !self.el || !self.el.object3D) {
            return false;
        }

        const intensity = getPmndrsStarsIntensity(config);
        state.starsIntensity = intensity;
        if (intensity <= 0) {
            if (state.starsMesh) {
                state.starsMesh.visible = false;
            }
            if (state.starsMaterial) {
                state.starsMaterial.intensity = 0;
            }
            if (state.starsFallbackMesh) {
                state.starsFallbackMesh.visible = false;
            }
            return false;
        }

        if (!state.starsData) {
            loadPmndrsTakramStarsData(self, state);
            return false;
        }

        if (vta && vta.StarsGeometry && vta.StarsMaterial && THREE.Points && !state.starsMesh) {
            state.starsGeometry = new vta.StarsGeometry(state.starsData);
            state.starsMaterial = new vta.StarsMaterial({
                irradianceTexture: state.textures.irradianceTexture || null,
                scatteringTexture: state.textures.scatteringTexture || null,
                transmittanceTexture: state.textures.transmittanceTexture || null,
                singleMieScatteringTexture: state.textures.singleMieScatteringTexture || null,
                higherOrderScatteringTexture: state.textures.higherOrderScatteringTexture || null,
                pointSize: PMNDRS_STARS_POINT_SIZE,
                intensity,
                background: true,
                ground: config.groundEnabled
            });
            state.starsMesh = new THREE.Points(state.starsGeometry, state.starsMaterial);
            state.starsMesh.frustumCulled = false;
            state.starsMesh.renderOrder = -999;
            state.starsMesh.userData.vrodosPmndrsAtmosphereStars = true;
            state.starsMesh.name = 'vrodosPmndrsAtmosphereStars';
            self.el.object3D.add(state.starsMesh);
        } else if (state.starsMesh && state.starsMesh.parent !== self.el.object3D) {
            self.el.object3D.add(state.starsMesh);
        }

        if (state.starsMaterial) {
            self.applyPmndrsAtmosphereConfigToTarget(state.starsMaterial, config);
            state.starsMaterial.irradianceTexture = state.textures.irradianceTexture || null;
            state.starsMaterial.scatteringTexture = state.textures.scatteringTexture || null;
            state.starsMaterial.transmittanceTexture = state.textures.transmittanceTexture || null;
            state.starsMaterial.singleMieScatteringTexture = state.textures.singleMieScatteringTexture || null;
            state.starsMaterial.higherOrderScatteringTexture = state.textures.higherOrderScatteringTexture || null;
            state.starsMaterial.intensity = intensity;
            state.starsMaterial.pointSize = PMNDRS_STARS_POINT_SIZE;
            state.starsMaterial.background = true;
            state.starsMaterial.ground = config.groundEnabled;
            state.starsMaterial.depthWrite = false;
            state.starsMaterial.depthTest = true;
            state.starsMaterial.needsUpdate = true;
        }

        if (state.starsMesh) {
            state.starsMesh.visible = true;
            const starsRotationMatrix = getPmndrsStarsLocalRotationMatrix(config);
            if (starsRotationMatrix && typeof state.starsMesh.setRotationFromMatrix === 'function') {
                state.starsMesh.setRotationFromMatrix(starsRotationMatrix);
            } else if (state.starsMesh.rotation && typeof state.starsMesh.rotation.set === 'function') {
                state.starsMesh.rotation.set(0, 0, 0);
            }
        }

        const fallbackVisible = ensurePmndrsAtmosphereStarsFallback(self, config, state, intensity);
        return Boolean(state.starsMesh || fallbackVisible);
    }

    function createPmndrsMoonTexture(state) {
        if (!state || state.moonTexture || typeof document === 'undefined') {
            return state ? state.moonTexture : null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        const gradient = ctx.createRadialGradient(104, 88, 12, 128, 128, 118);
        gradient.addColorStop(0.0, 'rgba(255,255,246,1)');
        gradient.addColorStop(0.58, 'rgba(232,238,245,0.96)');
        gradient.addColorStop(0.86, 'rgba(188,200,218,0.82)');
        gradient.addColorStop(1.0, 'rgba(120,135,160,0)');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(128, 128, 112, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(120,130,150,0.22)';
        [
            [92, 102, 13],
            [150, 86, 8],
            [168, 144, 18],
            [112, 168, 10],
            [132, 124, 7]
        ].forEach((crater) => {
            ctx.beginPath();
            ctx.arc(crater[0], crater[1], crater[2], 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';

        state.moonTexture = new THREE.CanvasTexture(canvas);
        state.moonTexture.generateMipmaps = false;
        state.moonTexture.minFilter = THREE.LinearFilter;
        state.moonTexture.magFilter = THREE.LinearFilter;
        state.moonTexture.needsUpdate = true;
        return state.moonTexture;
    }

    function ensurePmndrsAtmosphereMoon(self, config, state) {
        if (!self || !state || !config || !self.el || !self.el.object3D || config.moonEnabled === false || typeof THREE.Sprite !== 'function') {
            if (state) {
                state.moonVisible = false;
                if (state.moonMesh) {
                    state.moonMesh.visible = false;
                }
            }
            return false;
        }

        const moonDirection = config.localMoonDirection || config.moonDirection;
        const moonElevation = moonDirection && typeof moonDirection.y === 'number' ? moonDirection.y : -1;
        const nightAmount = 1 - smoothstepNumber(-7, 1, typeof config.sunElevationDeg === 'number' ? config.sunElevationDeg : 10);
        const visibility = smoothstepNumber(-0.03, 0.16, moonElevation) * nightAmount;

        state.moonVisible = visibility > 0.02;
        if (!state.moonVisible) {
            if (state.moonMesh) {
                state.moonMesh.visible = false;
            }
            return false;
        }

        const texture = createPmndrsMoonTexture(state);
        if (!texture) {
            return false;
        }

        if (!state.moonMesh) {
            state.moonMaterial = new THREE.SpriteMaterial({
                map: texture,
                color: '#eaf1ff',
                transparent: true,
                alphaTest: 0.001,
                blending: THREE.NormalBlending,
                depthWrite: false,
                depthTest: true,
                fog: false
            });
            state.moonMaterial.toneMapped = false;
            state.moonMesh = new THREE.Sprite(state.moonMaterial);
            state.moonMesh.name = 'vrodosPmndrsAtmosphereMoon';
            state.moonMesh.frustumCulled = false;
            state.moonMesh.renderOrder = -997;
            state.moonMesh.userData.vrodosPmndrsAtmosphereMoon = true;
            self.el.object3D.add(state.moonMesh);
        } else if (state.moonMesh.parent !== self.el.object3D) {
            self.el.object3D.add(state.moonMesh);
        }

        if (!state.moonCameraPosition) {
            state.moonCameraPosition = new THREE.Vector3();
            state.moonDirection = new THREE.Vector3();
        }

        const camera = self.el.camera;
        if (camera && typeof camera.getWorldPosition === 'function') {
            camera.getWorldPosition(state.moonCameraPosition);
            state.moonDirection.copy(moonDirection).normalize();
            state.moonMesh.position.copy(state.moonCameraPosition).addScaledVector(state.moonDirection, 5100);
        }

        const scale = 92;
        state.moonMesh.scale.set(scale, scale, 1);
        state.moonMesh.visible = true;
        if (state.moonMaterial) {
            state.moonMaterial.opacity = Math.max(0.18, Math.min(0.96, visibility));
            state.moonMaterial.color.set('#eaf1ff').multiplyScalar(1.3 + visibility * 1.2);
            state.moonMaterial.needsUpdate = true;
        }

        return true;
    }

    function getTextureIdentity(texture) {
        if (!texture) {
            return 'none';
        }

        return texture.uuid || texture.id || 'texture';
    }

    function getPmndrsAtmosphereSkyMaterialSignature(config, state) {
        const textures = state && state.textures ? state.textures : {};
        return [
            config && config.takramSunEnabled !== false ? 'sun' : 'no-sun',
            config && config.correctAltitudeEnabled !== false ? 'altitude' : 'flat-altitude',
            config && config.groundEnabled ? 'ground' : 'no-ground',
            config ? getPmndrsEffectiveGroundAlbedo(config) : '#000000',
            config && config.moonEnabled ? 'moon' : 'no-moon',
            getTextureIdentity(textures.irradianceTexture),
            getTextureIdentity(textures.scatteringTexture),
            getTextureIdentity(textures.transmittanceTexture),
            getTextureIdentity(textures.singleMieScatteringTexture),
            getTextureIdentity(textures.higherOrderScatteringTexture)
        ].join('|');
    }

    function applyVrTakramSkyDirectCalibration(self, material) {
        if (!shouldUseVrTakramVisibleSky(self) || !material) {
            return false;
        }

        const exposure = getVrTakramSkyDirectExposure();
        const uniforms = material.uniforms || (material.uniforms = {});
        const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
        if (!uniforms.vrodosSkyExposure) {
            uniforms.vrodosSkyExposure = typeof THREE.Uniform === 'function'
                ? new THREE.Uniform(exposure)
                : { value: exposure };
        } else {
            uniforms.vrodosSkyExposure.value = exposure;
        }

        material.userData = material.userData || {};
        material.userData.vrodosVrTakramSkyDirectExposure = exposure;

        if (!material.userData.vrodosVrTakramSkyDirectHookInstalled) {
            const originalOnBeforeCompile = typeof material.onBeforeCompile === 'function'
                ? material.onBeforeCompile.bind(material)
                : null;
            const originalCustomProgramCacheKey = typeof material.customProgramCacheKey === 'function'
                ? material.customProgramCacheKey.bind(material)
                : null;
            material.onBeforeCompile = function (shader, renderer) {
                if (originalOnBeforeCompile) {
                    originalOnBeforeCompile(shader, renderer);
                }
                shader.uniforms = shader.uniforms || {};
                shader.uniforms.vrodosSkyExposure = uniforms.vrodosSkyExposure;
                if (shader.fragmentShader.indexOf('uniform float vrodosSkyExposure;') === -1) {
                    const withUniform = shader.fragmentShader.replace(
                        'uniform vec3 groundAlbedo;',
                        'uniform vec3 groundAlbedo;\nuniform float vrodosSkyExposure;'
                    );
                    shader.fragmentShader = withUniform === shader.fragmentShader
                        ? `uniform float vrodosSkyExposure;\n${  shader.fragmentShader}`
                        : withUniform;
                }
                if (shader.fragmentShader.indexOf('vrodos-direct-sky-calibration') === -1) {
                    const patched = shader.fragmentShader.replace(
                        '  outputColor.a = 1.0;',
                        [
                            '  // vrodos-direct-sky-calibration',
                            '  outputColor.rgb = max(outputColor.rgb * vrodosSkyExposure, vec3(0.0));',
                            '  outputColor.rgb = outputColor.rgb / (outputColor.rgb + vec3(1.0));',
                            '  outputColor.rgb = pow(outputColor.rgb, vec3(0.4545454545));',
                            '  outputColor.a = 1.0;'
                        ].join('\n')
                    );
                    const shaderPatched = patched !== shader.fragmentShader &&
                        patched.indexOf('uniform float vrodosSkyExposure;') !== -1;
                    shader.fragmentShader = patched;
                    material.userData.vrodosVrTakramSkyDirectShaderPatched = shaderPatched;
                    material.userData.vrodosVrTakramSkyDirectPatchFailed = !shaderPatched;
                    if (!shaderPatched) {
                        material.userData.vrodosVrTakramSkyDirectReadySinceMs = 0;
                        material.userData.vrodosVrTakramSkyDirectWarmed = false;
                    }
                    if (state) {
                        state.vrTakramSkyDirectShaderPatched = shaderPatched;
                        state.vrTakramSkyDirectPatchFailed = !shaderPatched;
                        if (!shaderPatched) {
                            state.vrTakramSkyDirectReadySinceMs = 0;
                            state.vrTakramSkyDirectWarmed = false;
                        }
                    }
                }
            };
            material.customProgramCacheKey = function () {
                const baseKey = originalCustomProgramCacheKey ? originalCustomProgramCacheKey() : '';
                return `${baseKey}|vrodos-vr-takram-sky-direct:${  exposure.toFixed(3)}`;
            };
            material.userData.vrodosVrTakramSkyDirectHookInstalled = true;
            material.userData.vrodosVrTakramSkyDirectShaderPatched = false;
            material.userData.vrodosVrTakramSkyDirectPatchFailed = false;
            material.userData.vrodosVrTakramSkyDirectReadySinceMs = 0;
            material.userData.vrodosVrTakramSkyDirectWarmupMs = getVrTakramSkyRevealWarmupMs();
            material.userData.vrodosVrTakramSkyDirectWarmed = false;
            material.userData.vrodosVrTakramSkyDirectWarmupRemainingMs = material.userData.vrodosVrTakramSkyDirectWarmupMs;
        }

        if (!material.userData.vrodosVrTakramSkyDirectShaderPatched || material.userData.vrodosVrTakramSkyDirectPatchFailed) {
            material.needsUpdate = true;
        }

        if (state) {
            state.vrTakramSkyDirectCalibrated = true;
            state.vrTakramSkyDirectExposure = exposure;
            state.vrTakramSkyDirectShaderPatched = Boolean(material.userData.vrodosVrTakramSkyDirectShaderPatched);
            state.vrTakramSkyDirectPatchFailed = Boolean(material.userData.vrodosVrTakramSkyDirectPatchFailed);
            state.vrTakramSkyDirectReadySinceMs = material.userData.vrodosVrTakramSkyDirectReadySinceMs || 0;
            state.vrTakramSkyDirectWarmupMs = material.userData.vrodosVrTakramSkyDirectWarmupMs || getVrTakramSkyRevealWarmupMs();
            state.vrTakramSkyDirectWarmed = Boolean(material.userData.vrodosVrTakramSkyDirectWarmed);
            state.vrTakramSkyDirectWarmupRemainingMs = material.userData.vrodosVrTakramSkyDirectWarmupRemainingMs || state.vrTakramSkyDirectWarmupMs;
        }

        return true;
    }

    function ensurePmndrsAtmosphereSky(self, config) {
        config = getPresentedPmndrsAtmosphereConfig(self, config);
        const state = self.ensurePmndrsAtmosphereResources ? self.ensurePmndrsAtmosphereResources() : null;
        const vta = window.VRODOS_TAKRAM_ATMOSPHERE;
        if (!state || !vta || state.failed || !state.textures || !self || !self.el || !self.el.object3D) {
            return false;
        }

        if (!state.skyMesh) {
            state.skyGeometry = new THREE.PlaneGeometry(2, 2);
            state.skyMaterial = new vta.SkyMaterial({
                irradianceTexture: state.textures.irradianceTexture || null,
                scatteringTexture: state.textures.scatteringTexture || null,
                transmittanceTexture: state.textures.transmittanceTexture || null,
                singleMieScatteringTexture: state.textures.singleMieScatteringTexture || null,
                higherOrderScatteringTexture: state.textures.higherOrderScatteringTexture || null,
                sun: config.takramSunEnabled !== false,
                correctAltitude: config.correctAltitudeEnabled !== false,
                ground: config.groundEnabled,
                groundAlbedo: new THREE.Color(getPmndrsEffectiveGroundAlbedo(config)),
                moon: config.moonEnabled
            });
            state.skyMesh = new THREE.Mesh(state.skyGeometry, state.skyMaterial);
            state.skyMesh.frustumCulled = false;
            state.skyMesh.renderOrder = -1000;
            state.skyMesh.userData.vrodosPmndrsAtmosphereSky = true;
            state.skyMesh.name = 'vrodosPmndrsAtmosphereSky';
            self.el.object3D.add(state.skyMesh);
        }

        if (state.skyMaterial) {
            const materialSignature = getPmndrsAtmosphereSkyMaterialSignature(config, state);
            const materialSignatureChanged = state.skyMaterialSignature !== materialSignature;
            applyVrTakramSkyDirectCalibration(self, state.skyMaterial);
            self.applyPmndrsAtmosphereConfigToTarget(state.skyMaterial, config);
            if (materialSignatureChanged) {
                state.skyMaterial.irradianceTexture = state.textures.irradianceTexture || null;
                state.skyMaterial.scatteringTexture = state.textures.scatteringTexture || null;
                state.skyMaterial.transmittanceTexture = state.textures.transmittanceTexture || null;
                state.skyMaterial.singleMieScatteringTexture = state.textures.singleMieScatteringTexture || null;
                state.skyMaterial.higherOrderScatteringTexture = state.textures.higherOrderScatteringTexture || null;
                state.skyMaterial.needsUpdate = true;
                state.skyMaterialSignature = materialSignature;
            }
            state.skyMaterial.dithering = true;
        }

        if (state.skyMesh) {
            state.skyMesh.visible = true;
        }
        ensurePmndrsAtmosphereStars(self, config, state, vta);
        ensurePmndrsAtmosphereMoon(self, config, state);

        return true;
    }

    function showPmndrsAtmosphereSkyForSceneProbe(self, config) {
        const wasVisible = isPmndrsAtmosphereSkyVisible(self);
        if (!ensurePmndrsAtmosphereSky(self, config)) {
            return false;
        }

        setPmndrsAtmosphereSkyVisibility(self, true);
        return !wasVisible;
    }

    function hidePmndrsAtmosphereSky(self) {
        setPmndrsAtmosphereSkyVisibility(self, false);
    }

    function getPmndrsExposureValue(self) {
        if (!self || !self.data) {
            return 1.0;
        }

        let raw = RuntimeSettings.readNumber
            ? RuntimeSettings.readNumber(self.data, 'pmndrsToneMappingExposure', 1.0, 0.1, 5)
            : parseFloat(self.data.pmndrsToneMappingExposure);
        if (isNaN(raw)) {
            raw = 1.0;
        }

        const autoExposureEnabled = readPmndrsAtmosphereBool(self, 'pmndrsLowLightAutoExposureEnabled', true);
        const exposureAuthored = readPmndrsAtmosphereBool(self, 'pmndrsToneMappingExposureAuthored', false);
        if (autoExposureEnabled && typeof self.getPmndrsAtmosphereConfig === 'function') {
            const config = self.getPmndrsAtmosphereConfig();
            const shouldApplyAutoExposure = config && config.enabled !== false && (!exposureAuthored || config.dayNightCycleEnabled);
            if (shouldApplyAutoExposure) {
                const calibratedProfile = getPmndrsCalibratedCelestialLightingProfile(config);
                if (calibratedProfile) {
                    raw = Math.max(raw, calibratedProfile.exposure);
                } else if (isPmndrsPresetTimeNight(config)) {
                    raw = Math.max(raw, PMNDRS_NIGHT_AUTO_EXPOSURE);
                } else if (isPmndrsLowLightDawn(config)) {
                    raw = Math.max(raw, PMNDRS_DAWN_AUTO_EXPOSURE);
                }
            }
        }

        return Math.max(0.1, Math.min(5, raw));
    }

    function getLegacyHorizonStageSizeValue(self) {
        if (!self || !self.data) {
            return 5000;
        }

        let raw = parseFloat(self.data.legacyHorizonStageSize);
        if (isNaN(raw)) {
            raw = 5000;
        }

        return Math.max(500, Math.min(8000, Math.round(raw)));
    }

    function syncLegacyHorizonCameraFar(self) {
        if (!self || !self.el) {
            return;
        }

        const defaultFar = 7000;
        let targetFar = defaultFar;

        if (self.data && self.data.selChoice === "0") {
            targetFar = Math.max(defaultFar, Math.min(24000, getLegacyHorizonStageSizeValue(self) + 1000));
        }

        if (self.el.camera && typeof self.el.camera.far === 'number' && Math.abs(self.el.camera.far - targetFar) > 0.5) {
            self.el.camera.far = targetFar;
            if (typeof self.el.camera.updateProjectionMatrix === 'function') {
                self.el.camera.updateProjectionMatrix();
            }
        }

        Array.prototype.forEach.call(self.el.querySelectorAll('[camera]'), (cameraEl) => {
            if (!cameraEl || !cameraEl.components || !cameraEl.components.camera) {
                return;
            }

            cameraEl.setAttribute('camera', 'far', String(targetFar));

            const threeCamera = cameraEl.components.camera.camera;
            if (threeCamera && typeof threeCamera.far === 'number' && Math.abs(threeCamera.far - targetFar) > 0.5) {
                threeCamera.far = targetFar;
                if (typeof threeCamera.updateProjectionMatrix === 'function') {
                    threeCamera.updateProjectionMatrix();
                }
            }
        });
    }

    function parseLightPositionVector(lightPosition) {
        if (lightPosition && typeof lightPosition === 'object') {
            if (lightPosition.isVector3 && typeof lightPosition.clone === 'function') {
                return lightPosition.clone().normalize();
            }
            if (typeof lightPosition.x === 'number' && typeof lightPosition.y === 'number' && typeof lightPosition.z === 'number') {
                return new THREE.Vector3(lightPosition.x, lightPosition.y, lightPosition.z).normalize();
            }
        }

        const raw = (lightPosition || '0.08 0.99 -0.1').split(/\s+/);
        const x = parseFloat(raw[0]);
        const y = parseFloat(raw[1]);
        const z = parseFloat(raw[2]);
        const dir = new THREE.Vector3(
            isNaN(x) ? 0.08 : x,
            isNaN(y) ? 0.99 : y,
            isNaN(z) ? -0.1 : z
        );

        if (dir.lengthSq() < 0.0001) {
            dir.set(0.08, 0.99, -0.1);
        }

        return dir.normalize();
    }

    function getImmersiveNavigationComponent() {
        if (typeof document === 'undefined') {
            return null;
        }

        const playerEl = document.getElementById('player');
        return playerEl && playerEl.components ? playerEl.components['custom-movement'] || null : null;
    }

    function getImmersivePresentedSunDirection(self, sourceDirection) {
        if (!sourceDirection || !self) {
            return sourceDirection;
        }

        if (!self._pmndrsPresentedSunDirection) {
            self._pmndrsPresentedSunDirection = new THREE.Vector3();
        }

        const navigation = getImmersiveNavigationComponent();
        if (
            navigation &&
            typeof navigation.isImmersiveXrPresenting === 'function' &&
            navigation.isImmersiveXrPresenting() &&
            typeof navigation.authoredToRenderedDirection === 'function'
        ) {
            return navigation.authoredToRenderedDirection(sourceDirection, self._pmndrsPresentedSunDirection);
        }

        return self._pmndrsPresentedSunDirection.copy(sourceDirection).normalize();
    }

    function getImmersiveNavigationForPresentedTransforms() {
        const navigation = getImmersiveNavigationComponent();
        if (
            navigation &&
            typeof navigation.isImmersiveXrPresenting === 'function' &&
            navigation.isImmersiveXrPresenting() &&
            typeof navigation.authoredToRenderedPosition === 'function' &&
            typeof navigation.renderedToAuthoredPosition === 'function'
        ) {
            return navigation;
        }

        return null;
    }

    function capturePresentedShadowLightBase(self, light, options) {
        if (!light || !light.position || !light.target || !light.target.position) {
            return false;
        }

        const opts = options || {};
        const navigation = getImmersiveNavigationForPresentedTransforms();
        light.userData = light.userData || {};
        light.userData.vrodosPresentedShadowBasePosition = light.userData.vrodosPresentedShadowBasePosition || new THREE.Vector3();
        light.userData.vrodosPresentedShadowBaseTarget = light.userData.vrodosPresentedShadowBaseTarget || new THREE.Vector3();

        if (navigation && opts.assumeAuthored !== true) {
            navigation.renderedToAuthoredPosition(light.position, light.userData.vrodosPresentedShadowBasePosition);
            navigation.renderedToAuthoredPosition(light.target.position, light.userData.vrodosPresentedShadowBaseTarget);
        } else {
            light.userData.vrodosPresentedShadowBasePosition.copy(light.position);
            light.userData.vrodosPresentedShadowBaseTarget.copy(light.target.position);
        }

        light.userData.vrodosPresentedShadowBaseCaptured = true;
        if (self) {
            self._vrodosPresentedShadowBaseCaptureCount = (self._vrodosPresentedShadowBaseCaptureCount || 0) + 1;
        }
        return true;
    }

    function syncPresentedShadowLightTransforms(self) {
        const navigation = getImmersiveNavigationForPresentedTransforms();
        if (!self || !navigation) {
            return false;
        }

        const transformCount = typeof navigation.immersiveRootTransformCount === 'number'
            ? navigation.immersiveRootTransformCount
            : 0;
        let changed = false;
        collectDirectionalShadowLights(self).forEach((light) => {
            if (!light || !light.target || !light.userData) {
                return;
            }

            if (
                navigation.immersiveNavigationStrategy === 'authored-world-container' &&
                typeof navigation.isObjectInsideImmersiveAuthoredWorld === 'function' &&
                navigation.isObjectInsideImmersiveAuthoredWorld(light)
            ) {
                return;
            }

            if (!light.userData.vrodosPresentedShadowBaseCaptured) {
                capturePresentedShadowLightBase(self, light, { assumeAuthored: true });
            }

            const basePosition = light.userData.vrodosPresentedShadowBasePosition;
            const baseTarget = light.userData.vrodosPresentedShadowBaseTarget;
            if (!basePosition || !baseTarget) {
                return;
            }

            if (light.userData.vrodosPresentedShadowLastTransformCount === transformCount) {
                return;
            }

            navigation.authoredToRenderedPosition(basePosition, light.position);
            navigation.authoredToRenderedPosition(baseTarget, light.target.position);
            light.target.updateMatrixWorld(true);
            light.updateMatrixWorld(true);
            if (light.shadow && typeof light.shadow.updateMatrices === 'function') {
                light.shadow.updateMatrices(light);
            }
            light.userData.vrodosPresentedShadowLastTransformCount = transformCount;
            changed = true;
        });

        if (changed) {
            self._vrodosPresentedShadowTransformCount = (self._vrodosPresentedShadowTransformCount || 0) + 1;
            self._vrodosPresentedShadowLastNavigationTransformCount = transformCount;
        }
        return changed;
    }

    function getImmersiveRenderYawDeg() {
        const navigation = getImmersiveNavigationComponent();
        if (!navigation || typeof navigation.immersiveRenderYaw !== 'number') {
            return null;
        }

        return Number(THREE.MathUtils.radToDeg(navigation.immersiveRenderYaw).toFixed(2));
    }

    function copyPresentedAtmosphereDirectionDiagnostics(self, authoredSunDirection, presentedSunDirection) {
        if (!self) {
            return;
        }

        self._pmndrsAuthoredSunDirectionDiagnostic = vectorToRoundedArray(authoredSunDirection);
        self._pmndrsPresentedSunDirectionDiagnostic = vectorToRoundedArray(presentedSunDirection);
        self._pmndrsImmersiveRenderYawDeg = getImmersiveRenderYawDeg();
    }

    function getPresentedPmndrsAtmosphereConfig(self, config) {
        if (!self || !config) {
            return config;
        }

        const authoredSunDirection = config.localSunDirection || config.sunDirection || null;
        const navigation = getImmersiveNavigationComponent();
        const immersive = navigation &&
            typeof navigation.isImmersiveXrPresenting === 'function' &&
            navigation.isImmersiveXrPresenting() &&
            typeof navigation.authoredToRenderedDirection === 'function';

        if (!immersive || !authoredSunDirection) {
            copyPresentedAtmosphereDirectionDiagnostics(self, authoredSunDirection, authoredSunDirection);
            return config;
        }

        const presented = Object.assign({}, config);
        presented.localSunDirection = navigation.authoredToRenderedDirection(
            config.localSunDirection || config.sunDirection,
            new THREE.Vector3()
        ).clone();
        presented.localMoonDirection = config.localMoonDirection || config.moonDirection
            ? navigation.authoredToRenderedDirection(
                config.localMoonDirection || config.moonDirection,
                new THREE.Vector3()
            ).clone()
            : buildPmndrsMoonDirection(presented.localSunDirection);
        presented.sunDirection = buildPmndrsEcefSunDirection(presented.localSunDirection, presented);
        presented.moonDirection = buildPmndrsEcefSunDirection(presented.localMoonDirection, presented);
        applyLocalDirectionAngles(presented);

        copyPresentedAtmosphereDirectionDiagnostics(self, authoredSunDirection, presented.localSunDirection);
        return presented;
    }

    function isPmndrsSunOccluderMesh(node) {
        if (!node || !node.isMesh || !node.visible) {
            return false;
        }
        let current = node.parent;
        while (current) {
            if (current.visible === false) {
                return false;
            }
            current = current.parent || null;
        }
        if (node.userData && (node.userData.vrodosPmndrsAtmosphereSky || node.userData.vrodosPmndrsTakramLightSource)) {
            return false;
        }
        if (objectEntityChainHas(node, (entityEl) => (
            entityEl.hasAttribute('data-vrodos-pmndrs-sun') ||
            entityEl.hasAttribute('data-vrodos-overlay-ui') ||
            entityEl.hasAttribute('data-vrodos-collision-hidden') ||
            entityEl.hasAttribute('vrodos-collider-helper')
        ))) {
            return false;
        }
        if (!isWorldLightingParticipantMesh(node)) {
            return false;
        }
        return isShadowEligibleMaterial(node.material);
    }

    function getPmndrsSunOccluderTriangleCount(node) {
        const geometry = node && node.geometry ? node.geometry : null;
        if (!geometry) {
            return 0;
        }

        if (geometry.index && typeof geometry.index.count === 'number') {
            return Math.floor(geometry.index.count / 3);
        }

        const position = geometry.attributes ? geometry.attributes.position : null;
        return position && typeof position.count === 'number' ? Math.floor(position.count / 3) : 0;
    }

    function refreshPmndrsSunOccluderCache(self) {
        if (!self || !self.el || !self.el.object3D) {
            return [];
        }

        const now = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
        if (Array.isArray(self._pmndrsSunOcclusionTargets) && self._pmndrsSunOcclusionTargetsLastMs && (now - self._pmndrsSunOcclusionTargetsLastMs) < 2500) {
            return self._pmndrsSunOcclusionTargets;
        }

        const targets = [];
        self.el.object3D.traverse((node) => {
            if (!isPmndrsSunOccluderMesh(node) || !node.geometry) {
                return;
            }

            if (!node.geometry.boundingBox && typeof node.geometry.computeBoundingBox === 'function') {
                node.geometry.computeBoundingBox();
            }

            if (!node.geometry.boundingBox) {
                return;
            }

            const triangleCount = getPmndrsSunOccluderTriangleCount(node);
            targets.push({
                node,
                triangleCount,
                precise: triangleCount <= 60000 || Boolean(node.geometry.boundsTree)
            });
        });

        self._pmndrsSunOcclusionTargets = targets;
        self._pmndrsSunOcclusionTargetsLastMs = now;
        return targets;
    }

    function computePmndrsSunOcclusionFactor(self, sunDirection, maxDistance) {
        if (!self || !self.el || !self.el.object3D || !self.el.camera || !sunDirection || sunDirection.lengthSq() < 0.0001 || typeof THREE.Raycaster !== 'function') {
            return 1;
        }

        const now = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
        if (self._pmndrsSunOcclusionLastMs && (now - self._pmndrsSunOcclusionLastMs) < 300 && typeof self._pmndrsSunOcclusionFactor === 'number') {
            return self._pmndrsSunOcclusionFactor;
        }

        if (!self._pmndrsSunOcclusionRaycaster) {
            self._pmndrsSunOcclusionRaycaster = new THREE.Raycaster();
            self._pmndrsSunOcclusionOrigin = new THREE.Vector3();
            self._pmndrsSunOcclusionDirection = new THREE.Vector3();
            self._pmndrsSunOcclusionWorldBox = new THREE.Box3();
            self._pmndrsSunOcclusionHits = [];
        }

        const origin = self._pmndrsSunOcclusionOrigin;
        const direction = self._pmndrsSunOcclusionDirection.copy(sunDirection).normalize();
        self.el.camera.getWorldPosition(origin);
        origin.addScaledVector(direction, 0.5);

        const far = Math.max(10, Math.min(Number.isFinite(Number(maxDistance)) ? Number(maxDistance) : 5200, 20000));
        const raycaster = self._pmndrsSunOcclusionRaycaster;
        raycaster.set(origin, direction);
        raycaster.near = 0.1;
        raycaster.far = far;
        raycaster.firstHitOnly = true;

        const targets = refreshPmndrsSunOccluderCache(self);
        let factor = 1;
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const node = target.node;
            if (!node || !node.geometry || !node.geometry.boundingBox) {
                continue;
            }

            self._pmndrsSunOcclusionWorldBox.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld);
            if (!raycaster.ray.intersectsBox(self._pmndrsSunOcclusionWorldBox)) {
                continue;
            }

            if (!target.precise) {
                continue;
            }

            self._pmndrsSunOcclusionHits.length = 0;
            raycaster.intersectObject(node, false, self._pmndrsSunOcclusionHits);
            if (self._pmndrsSunOcclusionHits.some((hit) => hit && hit.distance > 0.1 && hit.distance < far * 0.985)) {
                factor = 0;
                break;
            }
        }

        self._pmndrsSunOcclusionFactor = factor;
        self._pmndrsSunOcclusionLastMs = now;
        return factor;
    }

    function applyPmndrsSunOcclusion(self, sunDirection, maxDistance) {
        const factor = computePmndrsSunOcclusionFactor(self, sunDirection, maxDistance);
        const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
        if (state && state.skyMaterial && typeof state.skyMaterial.sun !== 'undefined') {
            const shouldShowSkySun = factor > 0.01;
            if (state.skyMaterial.sun !== shouldShowSkySun) {
                state.skyMaterial.sun = shouldShowSkySun;
                state.skyMaterial.needsUpdate = true;
                if (typeof state.skyMaterial.setChanged === 'function') {
                    state.skyMaterial.setChanged();
                }
            }
        }

        const sunEl = typeof document !== 'undefined' ? document.getElementById('vrodos-pmndrs-sun') : null;
        if (sunEl && sunEl.object3D) {
            sunEl.object3D.visible = factor > 0.01;
        }
        const hazeEl = typeof document !== 'undefined' ? document.getElementById('vrodos-pmndrs-sun-haze') : null;
        if (hazeEl && hazeEl.object3D) {
            hazeEl.object3D.visible = factor > 0.01;
        }

        if (self && self.pmndrsLensFlareEffect && typeof self.pmndrsLensFlareEffect.intensity === 'number') {
            if (typeof self._pmndrsLensFlareBaseIntensity !== 'number' || self._pmndrsLensFlareBaseIntensity <= 0) {
                self._pmndrsLensFlareBaseIntensity = self.pmndrsLensFlareEffect.intensity || 0.005;
            }
            self.pmndrsLensFlareEffect.intensity = self._pmndrsLensFlareBaseIntensity * factor;
        }

        return factor;
    }

    function createPmndrsSunTexture(self) {
        if (!self || self._pmndrsSunTexture || typeof document === 'undefined') {
            return self ? self._pmndrsSunTexture : null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0.0, 'rgba(255,253,246,1)');
        gradient.addColorStop(0.46, 'rgba(255,245,226,0.98)');
        gradient.addColorStop(0.74, 'rgba(255,232,192,0.84)');
        gradient.addColorStop(0.9, 'rgba(255,214,168,0.16)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        self._pmndrsSunTexture = new THREE.CanvasTexture(canvas);
        self._pmndrsSunTexture.generateMipmaps = false;
        self._pmndrsSunTexture.minFilter = THREE.LinearFilter;
        self._pmndrsSunTexture.magFilter = THREE.LinearFilter;
        self._pmndrsSunTexture.needsUpdate = true;
        return self._pmndrsSunTexture;
    }

    function createPmndrsSunHazeTexture(self) {
        if (!self || self._pmndrsSunHazeTexture || typeof document === 'undefined') {
            return self ? self._pmndrsSunHazeTexture : null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0.0, 'rgba(255,220,170,0.42)');
        gradient.addColorStop(0.24, 'rgba(255,206,156,0.3)');
        gradient.addColorStop(0.48, 'rgba(255,188,136,0.16)');
        gradient.addColorStop(0.72, 'rgba(255,170,122,0.06)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Tiny alpha dithering in the baked haze texture avoids visible rings
        // after tone mapping at dusk while preserving a smooth glow.
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = image.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
                const jitter = ((Math.random() * 2) - 1) * 10;
                const a = data[i + 3] + jitter;
                data[i + 3] = a < 0 ? 0 : (a > 255 ? 255 : a);
            }
        }
        ctx.putImageData(image, 0, 0);

        self._pmndrsSunHazeTexture = new THREE.CanvasTexture(canvas);
        self._pmndrsSunHazeTexture.generateMipmaps = false;
        self._pmndrsSunHazeTexture.minFilter = THREE.LinearFilter;
        self._pmndrsSunHazeTexture.magFilter = THREE.LinearFilter;
        self._pmndrsSunHazeTexture.needsUpdate = true;
        return self._pmndrsSunHazeTexture;
    }

    function getPmndrsHorizonSunConfig(preset, mode) {
        const atmosphereMode = mode === 'atmosphere';
        switch (preset) {
            case 'clear':
                return {
                    scale: atmosphereMode ? 42 : 95,
                    color: atmosphereMode ? '#fff6d8' : '#fff3c7',
                    distance: 5400,
                    intensity: atmosphereMode ? 4.6 : 4.0,
                    hazeScale: atmosphereMode ? 190 : 0,
                    hazeIntensity: atmosphereMode ? 1.3 : 0
                };
            case 'crisp':
                return {
                    scale: atmosphereMode ? 46 : 108,
                    color: atmosphereMode ? '#fff2cc' : '#fff0bc',
                    distance: 5300,
                    intensity: atmosphereMode ? 4.9 : 4.0,
                    hazeScale: atmosphereMode ? 210 : 0,
                    hazeIntensity: atmosphereMode ? 1.45 : 0
                };
            default:
                return {
                    scale: atmosphereMode ? 50 : 120,
                    color: atmosphereMode ? '#ffefc9' : '#ffedb2',
                    distance: 5200,
                    intensity: atmosphereMode ? 5.2 : 4.0,
                    hazeScale: atmosphereMode ? 230 : 0,
                    hazeIntensity: atmosphereMode ? 1.6 : 0
                };
        }
    }

    function clearPmndrsHorizonSun(self) {
        if (!self) {
            return;
        }

        const oldSun = document.getElementById('vrodos-pmndrs-sun');
        if (oldSun && oldSun.parentNode) {
            oldSun.parentNode.removeChild(oldSun);
        }
        const oldSunHaze = document.getElementById('vrodos-pmndrs-sun-haze');
        if (oldSunHaze && oldSunHaze.parentNode) {
            oldSunHaze.parentNode.removeChild(oldSunHaze);
        }
        const visibleTakramSun = document.getElementById('vrodos-takram-visible-sun');
        if (visibleTakramSun && visibleTakramSun.parentNode) {
            visibleTakramSun.parentNode.removeChild(visibleTakramSun);
        }
        self._pmndrsSunDirection = null;
        self._pmndrsSunDistance = null;
        self._pmndrsSunSpriteActive = false;
    }

    function shouldDisablePmndrsVisibleSunDebug() {
        if (window.VRODOS_DEBUG && window.VRODOS_DEBUG.disablePmndrsSunSprite === true) {
            return true;
        }

        if (typeof window.location === 'undefined' || !window.location.search) {
            return false;
        }

        try {
            const params = new URLSearchParams(window.location.search);
            return params.get('vrodos_debug_disable_pmndrs_sun') === '1';
        } catch (err) {
            return false;
        }
    }

    function shouldUsePmndrsXrAtmosphereSunFallback(self) {
        if (!self || !self.data || self.data.selChoice !== "0" || self.data.postFXEngine !== 'pmndrs') {
            return false;
        }
        const lensFlareEnabled = typeof self.isPmndrsLensFlareEnabled === 'function'
            ? self.isPmndrsLensFlareEnabled()
            : readPmndrsAtmosphereBool(self, 'pmndrsLensFlareEnabled', false);
        self._pmndrsVrLensFlareSuppressed = typeof self.isVrLensFlareSuppressed === 'function'
            ? self.isVrLensFlareSuppressed()
            : false;
        if (!lensFlareEnabled) {
            return false;
        }
        if (typeof self.isDirectVrPresentationActive === 'function') {
            return self.isDirectVrPresentationActive();
        }
        if (typeof self.isImmersiveXrActive === 'function') {
            return self.isImmersiveXrActive();
        }
        const renderer = self.el && self.el.renderer;
        return Boolean(renderer && renderer.xr && renderer.xr.isPresenting);
    }

    function ensurePmndrsHorizonSun(self, lightPosition, preset, options) {
        if (!self || !self.el || typeof document === 'undefined') {
            return;
        }
        const opts = options || {};
        if (shouldDisablePmndrsVisibleSunDebug()) {
            clearPmndrsHorizonSun(self);
            return;
        }
        if (opts.atmosphere && opts.forceAtmosphereSprite !== true) {
            clearPmndrsHorizonSun(self);
            return;
        }

        let sunEl = document.getElementById('vrodos-pmndrs-sun');
        if (!sunEl) {
            sunEl = document.createElement('a-entity');
            sunEl.setAttribute('id', 'vrodos-pmndrs-sun');
            sunEl.setAttribute('data-vrodos-pmndrs-sun', 'true');
            self.el.appendChild(sunEl);
        }

        const texture = createPmndrsSunTexture(self);
        if (!texture) {
            return;
        }
        const hazeTexture = createPmndrsSunHazeTexture(self);

        let sprite = sunEl.getObject3D('mesh');
        if (!sprite) {
            const material = new THREE.SpriteMaterial({
                map: texture,
                color: '#ffedb2',
                transparent: true,
                alphaTest: 0.001,
                blending: THREE.NormalBlending,
                depthWrite: false,
                depthTest: true,
                fog: false
            });
            material.toneMapped = false;
            sprite = new THREE.Sprite(material);
            sprite.frustumCulled = false;
            sprite.renderOrder = 10;
            sunEl.setObject3D('mesh', sprite);
        }

        let hazeEl = document.getElementById('vrodos-pmndrs-sun-haze');
        if (!hazeEl) {
            hazeEl = document.createElement('a-entity');
            hazeEl.setAttribute('id', 'vrodos-pmndrs-sun-haze');
            hazeEl.setAttribute('data-vrodos-pmndrs-sun', 'true');
            self.el.appendChild(hazeEl);
        }

        let hazeSprite = hazeEl.getObject3D('mesh');
        if (!hazeSprite && hazeTexture) {
            const hazeMaterial = new THREE.SpriteMaterial({
                map: hazeTexture,
                color: '#ffd6a4',
                transparent: true,
                alphaTest: 0.0,
                blending: THREE.NormalBlending,
                depthWrite: false,
                depthTest: true,
                fog: false
            });
            hazeMaterial.toneMapped = false;
            hazeSprite = new THREE.Sprite(hazeMaterial);
            hazeSprite.frustumCulled = false;
            hazeSprite.renderOrder = 9;
            hazeEl.setObject3D('mesh', hazeSprite);
        }

        const cfg = getPmndrsHorizonSunConfig(preset, opts.atmosphere ? 'atmosphere' : 'fallback');
        sprite.scale.set(cfg.scale, cfg.scale, 1);
        
        // pmndrs applies ACES Filmic over the entire HDR framebuffer, which
        // compresses LDR colors (<= 1.0) into dull grey. We must multiply the 
        // sun's authored color so it sits in the HDR range and survives tone 
        // mapping as a bright glowing light source.
        sprite.material.color.set(cfg.color).multiplyScalar(cfg.intensity || (opts.atmosphere ? 5.5 : 4.0));
        if (hazeSprite && hazeSprite.material) {
            if (opts.atmosphere && cfg.hazeScale > 0 && cfg.hazeIntensity > 0) {
                hazeSprite.visible = true;
                hazeSprite.scale.set(cfg.hazeScale, cfg.hazeScale, 1);
                hazeSprite.material.color.set('#ffd6a4').multiplyScalar(cfg.hazeIntensity);
            } else {
                hazeSprite.visible = false;
            }
        }

        self._pmndrsSunDirection = parseLightPositionVector(lightPosition);
        self._pmndrsSunDistance = cfg.distance;

        const camera = self.el.camera;
        if (!camera || typeof camera.getWorldPosition !== 'function') {
            return;
        }

        if (!self._pmndrsSunCameraPosition) {
            self._pmndrsSunCameraPosition = new THREE.Vector3();
        }

        sunEl.object3D.visible = true;
        camera.getWorldPosition(self._pmndrsSunCameraPosition);
        const presentedSunDirection = getImmersivePresentedSunDirection(self, self._pmndrsSunDirection);
        sunEl.object3D.position.copy(self._pmndrsSunCameraPosition).addScaledVector(presentedSunDirection, self._pmndrsSunDistance || 5200);
        if (hazeEl && hazeEl.object3D) {
            hazeEl.object3D.position.copy(sunEl.object3D.position);
        }
        self._pmndrsSunSpriteActive = Boolean(sunEl.object3D.visible);
        applyPmndrsSunOcclusion(self, presentedSunDirection, self._pmndrsSunDistance || 5200);
    }

    H.updatePmndrsHorizonSun = function () {
        if (!this || !this.el || this.data.selChoice !== "0" || this.data.postFXEngine !== 'pmndrs' || shouldUseVrBaselineHorizon(this) || shouldUseVrTakramLightsOnly(this)) {
            removePmndrsAtmosphereSky(this);
            if (shouldUseVrTakramLightsOnly(this)) {
                syncVrTakramLightsOnlyHorizonVisuals(this, false);
            }
            clearPmndrsHorizonSun(this);
            return;
        }

        removeLegacySunSkyEntitiesForPmndrs(this);

        const atmosphereConfig = this.getPmndrsAtmosphereConfig ? this.getPmndrsAtmosphereConfig() : null;
        if (atmosphereConfig && atmosphereConfig.enabled && window.VRODOS_TAKRAM_ATMOSPHERE) {
            const presentedAtmosphereConfig = getPresentedPmndrsAtmosphereConfig(this, atmosphereConfig);
            if (shouldUsePmndrsXrAtmosphereSunFallback(this)) {
                const horizonPreset = typeof this.getHorizonSkyPreset === 'function' ? this.getHorizonSkyPreset() : 'natural';
                ensurePmndrsHorizonSun(this, atmosphereConfig.localSunDirection || atmosphereConfig.sunDirection, horizonPreset, {
                    atmosphere: true,
                    forceAtmosphereSprite: true
                });
            } else {
                clearPmndrsHorizonSun(this);
                this._pmndrsSunSpriteActive = false;
            }
            ensurePmndrsAtmosphereSky(this, atmosphereConfig);
            syncPresentedTakramLightDirections(this, atmosphereConfig);
            applyPmndrsSunOcclusion(
                this,
                presentedAtmosphereConfig.localSunDirection || presentedAtmosphereConfig.sunDirection,
                presentedAtmosphereConfig.sunDistance || 5200
            );
            return;
        }

        const sunEl = document.getElementById('vrodos-pmndrs-sun');
        if (!sunEl || !sunEl.object3D || !this._pmndrsSunDirection) {
            return;
        }

        const camera = this.el.camera;
        if (!camera || typeof camera.getWorldPosition !== 'function') {
            return;
        }

        if (!this._pmndrsSunCameraPosition) {
            this._pmndrsSunCameraPosition = new THREE.Vector3();
        }

        sunEl.object3D.visible = true;
        this._pmndrsSunSpriteActive = true;
        camera.getWorldPosition(this._pmndrsSunCameraPosition);
        const presentedSunDirection = getImmersivePresentedSunDirection(this, this._pmndrsSunDirection);
        sunEl.object3D.position.copy(this._pmndrsSunCameraPosition).addScaledVector(presentedSunDirection, this._pmndrsSunDistance || 5200);
        applyPmndrsSunOcclusion(this, presentedSunDirection, this._pmndrsSunDistance || 5200);
    };

    H.applyRenderQualityProfile = function () {
        const renderer = this.el.renderer;
        if (!renderer) {
            return;
        }

        if (typeof this.applyVrRenderBudgetPolicy === 'function') {
            this.applyVrRenderBudgetPolicy('quality-profile');
        }

        const renderQuality = typeof this.getRenderQualityLevel === 'function' ? this.getRenderQualityLevel() : (this.data.renderQuality === 'high' ? 'high' : 'standard');
        const isHighQuality = renderQuality === 'high';
        const isPerformanceQuality = renderQuality === 'performance';
        let targetPixelRatio = Math.min(window.devicePixelRatio || 1, isHighQuality ? 2 : (isPerformanceQuality ? 0.9 : 1));
        if (isHighQuality) {
            targetPixelRatio = Math.max(targetPixelRatio, this.getAAQualityPixelRatioTarget());
        }
        if (this.shouldUseEdgeAAOversample()) {
            targetPixelRatio = Math.max(targetPixelRatio, 1.15 + (this.getEdgeAAStrengthFactor() * 0.7));
        }
        targetPixelRatio = applyDesktopRenderPixelBudget(this, renderer, targetPixelRatio, {
            renderQuality,
            isPerformanceQuality,
            minPixelRatio: isPerformanceQuality ? 0.75 : 1,
            maxPixelRatio: isHighQuality ? 1.5 : (isPerformanceQuality ? 0.9 : 1)
        });
        const isXrPresenting = typeof this.isImmersiveXrActive === 'function'
            ? this.isImmersiveXrActive()
            : Boolean(renderer.xr && renderer.xr.isPresenting);
        if (!isXrPresenting) {
            renderer.setPixelRatio(targetPixelRatio);
        }
        if (typeof renderer.sortObjects !== 'undefined') {
            const rendererSettings = this.el.getAttribute('renderer') || {};
            renderer.sortObjects = rendererSettings.sortTransparentObjects === true ||
                rendererSettings.sortTransparentObjects === 'true';
        }

        if (typeof renderer.toneMappingExposure !== 'undefined') {
            if (this.data.postFXEngine === 'pmndrs') {
                const atmosphereConfig = typeof this.getPmndrsAtmosphereConfig === 'function'
                    ? this.getPmndrsAtmosphereConfig()
                    : null;
                renderer.toneMappingExposure = smoothPmndrsRuntimeLightValue(
                    this,
                    'takramToneMappingExposure',
                    getPmndrsExposureValue(this),
                    getPmndrsRuntimeLightingSmoothingMs(atmosphereConfig),
                    renderer.toneMappingExposure
                );
            } else {
                renderer.toneMappingExposure = isHighQuality ? 1.06 : 1.0;
            }
        }

        // physicallyCorrectLights was removed in Three.js r150-r165 and is always on in modern A-Frame/Three runtimes.
        // The compiler initializes color/tone mapping on <a-scene>; these guards keep runtime profile changes aligned.
        if (typeof renderer.outputColorSpace !== 'undefined' && typeof THREE.SRGBColorSpace !== 'undefined') {
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        }

        if (typeof renderer.toneMapping !== 'undefined') {
            const isPmndrsComposerActive = this.data.postFXEngine === 'pmndrs' &&
                typeof this.shouldUsePostProcessing === 'function' &&
                this.shouldUsePostProcessing();
            if (isPmndrsComposerActive && typeof THREE.NoToneMapping !== 'undefined') {
                renderer.toneMapping = THREE.NoToneMapping;
            } else if (this.data.postFXEngine === 'pmndrs') {
                const pmndrsDirectToneMapping = getThreeToneMappingForPmndrsMode(this.data.pmndrsToneMappingMode);
                if (pmndrsDirectToneMapping !== null) {
                    renderer.toneMapping = pmndrsDirectToneMapping;
                }
            } else if (typeof THREE.ACESFilmicToneMapping !== 'undefined') {
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
            }
        }
    };
    H.getShadowUpdateMode = function () {
        return getShadowUpdateMode(this);
    };
    H.isStaticShadowMode = function () {
        return isStaticShadowMode(this);
    };
    H.getShadowDiagnosticState = function () {
        return getShadowDiagnosticState(this);
    };
    H.syncPresentedShadowLightTransforms = function () {
        return syncPresentedShadowLightTransforms(this);
    };
    H.markShadowDirty = function (reason) {
        if (!this || !this.el) {
            return;
        }

        const shadowQuality = typeof this.getEffectiveShadowQuality === 'function'
            ? this.getEffectiveShadowQuality()
            : (this.data && this.data.shadowQuality ? this.data.shadowQuality : 'medium');
        if (shadowQuality === 'off') {
            return;
        }

        const dirtyReason = reason || 'manual';
        this._vrodosShadowDirty = true;
        this._vrodosShadowDirtyReason = dirtyReason;
        this._vrodosShadowDirtyRequests = (this._vrodosShadowDirtyRequests || 0) + 1;
        if (this.el && typeof this.el.setAttribute === 'function') {
            this.el.setAttribute('data-vrodos-shadow-dirty-source', dirtyReason);
        }

        if (this._vrodosShadowFlushHandle) {
            updateShadowPerfDebugOverlay(this);
            return;
        }

        const flush = () => {
            this._vrodosShadowFlushHandle = null;
            if (typeof this.flushShadowUpdate === 'function') {
                this.flushShadowUpdate();
            }
        };

        this._vrodosShadowFlushHandle = typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame(flush)
            : setTimeout(flush, 16);
        updateShadowPerfDebugOverlay(this);
    };
    H.flushShadowUpdate = function () {
        if (!this || !this.el) {
            return;
        }

        const renderer = this.el.renderer;
        const shadowQuality = typeof this.getEffectiveShadowQuality === 'function'
            ? this.getEffectiveShadowQuality()
            : (this.data && this.data.shadowQuality ? this.data.shadowQuality : 'medium');
        if (!renderer || !renderer.shadowMap || shadowQuality === 'off') {
            return;
        }

        const staticMode = isStaticShadowMode(this);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.autoUpdate = !staticMode;
        renderer.shadowMap.needsUpdate = true;
        markAllShadowLightsDirty(this);

        this._vrodosShadowDirty = false;
        this._vrodosShadowUpdateCount = (this._vrodosShadowUpdateCount || 0) + 1;
        this._vrodosShadowLastUpdateReason = this._vrodosShadowDirtyReason || 'manual';
        this._vrodosShadowLastUpdateMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
        updateShadowPerfDebugOverlay(this);
    };
    H.syncStaticShadowMode = function (reason) {
        if (!this || !this.el || !this.el.renderer || !this.el.renderer.shadowMap) {
            return;
        }

        const shadowQuality = typeof this.getEffectiveShadowQuality === 'function'
            ? this.getEffectiveShadowQuality()
            : (this.data && this.data.shadowQuality ? this.data.shadowQuality : 'medium');
        const shadowsEnabled = shadowQuality !== 'off';
        const staticMode = shadowsEnabled && isStaticShadowMode(this);

        this.el.renderer.shadowMap.autoUpdate = shadowsEnabled && !staticMode;
        if (shadowsEnabled && staticMode) {
            this.markShadowDirty(reason || 'static-shadow-sync');
        }
        updateShadowPerfDebugOverlay(this);
    };
    H.applyShadowQualityProfile = function () {
        const renderer = this.el.renderer;
        const shadowQuality = typeof this.getEffectiveShadowQuality === 'function'
            ? this.getEffectiveShadowQuality()
            : (this.data.shadowQuality || 'medium');
        const shadowsEnabled = shadowQuality !== 'off';
        const contactShadowSettings = getTerrainSafeContactShadowSettings(this, this.getContactShadowSettings());
        const profileShadowType = 'pcf';
        const shadowTypeAttr = shadowsEnabled
            ? (shouldUseDayNightPcfShadowMap(this)
                ? 'pcf'
                : normalizeAFrameShadowMapType(this.data.rootShadowType, profileShadowType))
            : 'pcf';
        const runtimeShadowTypeAttr = shadowTypeAttr;
        const aframeShadowTypeAttr = getAFrameShadowComponentType(runtimeShadowTypeAttr);
        const shadowMapType = getThreeShadowMapType(runtimeShadowTypeAttr);
        const staticShadowMode = shadowsEnabled && isStaticShadowMode(this);
        const previousShadowMapType = renderer && renderer.shadowMap ? renderer.shadowMap.type : null;
        const shadowMapTypeChanged = previousShadowMapType !== null && previousShadowMapType !== shadowMapType;

        if (this.el && typeof this.el.setAttribute === 'function') {
            const currentShadow = this.el.getAttribute('shadow') || {};
            const currentEnabled = currentShadow.enabled === true || currentShadow.enabled === 'true';
            const currentType = typeof currentShadow.type === 'string' ? currentShadow.type.toLowerCase() : '';
            const currentAutoUpdate = currentShadow.autoUpdate === true || currentShadow.autoUpdate === 'true';
            const targetAutoUpdate = shadowsEnabled && !staticShadowMode;
            if (currentEnabled !== shadowsEnabled || currentType !== aframeShadowTypeAttr || currentAutoUpdate !== targetAutoUpdate) {
                this.el.setAttribute('shadow', `enabled: ${shadowsEnabled ? 'true' : 'false'}; type: ${aframeShadowTypeAttr}; autoUpdate: ${targetAutoUpdate ? 'true' : 'false'}`);
            }
        }

        if (renderer && renderer.shadowMap) {
            renderer.shadowMap.enabled = shadowsEnabled;
            renderer.shadowMap.type = shadowMapType;
            renderer.shadowMap.autoUpdate = shadowsEnabled && !staticShadowMode;
            renderer.shadowMap.needsUpdate = true;
        }

        if (this.el.hasAttribute('environment')) {
            this.el.setAttribute('environment', 'shadow', shadowsEnabled ? 'true' : 'false');
        }

        this.el.object3D.traverse((node) => {
            if (node.isMesh) {
                const isLightingParticipant = isWorldLightingParticipantMesh(node);
                if (!isLightingParticipant) {
                    node.castShadow = false;
                    node.receiveShadow = false;
                    syncTerrainShadowDepthMaterial(this, node, false);
                    return;
                }

                const shadowRole = getObjectShadowRole(node);
                node.castShadow = shadowsEnabled && shadowRole !== 'receiver' && shadowRole !== 'none';
                node.receiveShadow = shadowsEnabled && shadowRole !== 'none';
                syncTerrainShadowDepthMaterial(this, node, node.castShadow && isTerrainSelfShadowCasterMesh(node));
            }

            if (node.isDirectionalLight || node.isSpotLight || node.isPointLight) {
                node.userData = node.userData || {};
                const isVrodosManagedLight = isVrodosManagedShadowLight(node);
                if (typeof node.userData.vrodosAuthoredCastShadow === 'undefined') {
                    node.userData.vrodosAuthoredCastShadow = node.castShadow === true;
                }
                node.castShadow = shadowsEnabled && (isVrodosManagedLight || node.userData.vrodosAuthoredCastShadow === true);

                if (!node.shadow) {
                    return;
                }

                if (node.castShadow) {
                    const targetMapSize = shadowQuality === 'high'
                        ? (node.isDirectionalLight ? 2048 : 1024)
                        : (node.isDirectionalLight ? 1024 : 512);

                    if (node.shadow.mapSize) {
                        const headsetShadowCap = typeof this.isVrRuntimeHeadsetProfile === 'function' && this.isVrRuntimeHeadsetProfile();
                        if (headsetShadowCap) {
                            const needsShrink = (node.shadow.mapSize.x || 0) > targetMapSize || (node.shadow.mapSize.y || 0) > targetMapSize;
                            node.shadow.mapSize.x = targetMapSize;
                            node.shadow.mapSize.y = targetMapSize;
                            if (needsShrink && node.shadow.map && typeof node.shadow.map.dispose === 'function') {
                                node.shadow.map.dispose();
                                node.shadow.map = null;
                            }
                        } else {
                            node.shadow.mapSize.x = Math.max(node.shadow.mapSize.x || 0, targetMapSize);
                            node.shadow.mapSize.y = Math.max(node.shadow.mapSize.y || 0, targetMapSize);
                        }
                    }

                    if (typeof node.userData.vrodosBaseShadowBias === 'undefined') {
                        node.userData.vrodosBaseShadowBias = (typeof node.shadow.bias === 'number') ? node.shadow.bias : 0;
                    }

                    if (typeof node.userData.vrodosBaseShadowNormalBias === 'undefined') {
                        node.userData.vrodosBaseShadowNormalBias = (typeof node.shadow.normalBias === 'number') ? node.shadow.normalBias : 0;
                    }

                    const managedShadowBias = shadowQuality === 'high' ? 0.00004 : 0.00008;
                    const managedNormalBias = shadowQuality === 'high' ? 0.045 : 0.065;
                    const managedContactShadowBias = typeof contactShadowSettings.bias === 'number' ? contactShadowSettings.bias : managedShadowBias;
                    const managedContactShadowNormalBias = typeof contactShadowSettings.normalBias === 'number' ? contactShadowSettings.normalBias : managedNormalBias;

                    if (typeof node.shadow.bias !== 'undefined') {
                        node.shadow.bias = isVrodosManagedLight
                            ? managedContactShadowBias
                            : (node.userData.vrodosBaseShadowBias !== 0 ? node.userData.vrodosBaseShadowBias : contactShadowSettings.bias);
                    }

                    if (typeof node.shadow.normalBias !== 'undefined') {
                        node.shadow.normalBias = isVrodosManagedLight
                            ? managedContactShadowNormalBias
                            : (node.userData.vrodosBaseShadowNormalBias !== 0 ? node.userData.vrodosBaseShadowNormalBias : contactShadowSettings.normalBias);
                    }

                    if (isVrodosManagedLight && node.isDirectionalLight && typeof node.shadow.radius !== 'undefined') {
                        node.shadow.radius = getPmndrsDayNightShadowRadius(this);
                    }
                }

                node.shadow.needsUpdate = node.castShadow;
            }
        });

        if (shadowsEnabled) {
            if (refreshShadowMapResourcesForType(this, shadowMapType, shadowMapTypeChanged) && renderer && renderer.shadowMap) {
                renderer.shadowMap.needsUpdate = true;
            }
            applyAdaptiveShadowFit(this);
            if (typeof this.syncStaticShadowMode === 'function') {
                this.syncStaticShadowMode('shadow-profile');
            }
        } else if (renderer && renderer.shadowMap) {
            renderer.shadowMap.autoUpdate = false;
        }
        updateShadowPerfDebugOverlay(this);
    };
    H.applyMaterialProfiles = function () {
        const renderer = this.el.renderer;
        const sceneObj = this.el.object3D;
        const maxAnisotropy = renderer && typeof renderer.capabilities !== 'undefined' && typeof renderer.capabilities.getMaxAnisotropy === 'function'
            ? renderer.capabilities.getMaxAnisotropy()
            : 0;
        const atmosphereConfig = this.getPmndrsAtmosphereConfig ? this.getPmndrsAtmosphereConfig() : null;
        const reflectionSource = typeof this.getEffectiveReflectionSource === 'function' ? this.getEffectiveReflectionSource() : 'none';
        const reflectionsEnabled = typeof this.areReflectionsEnabled === 'function' ? this.areReflectionsEnabled() : true;
        const reflectionOcclusionMode = normalizeReflectionOcclusionMode(this.data.reflectionOcclusionMode);
        const shadowAwareReflections = reflectionsEnabled &&
            reflectionOcclusionMode !== 'off' &&
            (typeof this.getEffectiveShadowQuality === 'function' ? this.getEffectiveShadowQuality() : this.data.shadowQuality) !== 'off' &&
            !(typeof this.isVrPresentationActive === 'function' && this.isVrPresentationActive());
        const reflectionTargetScale = getPmndrsNightReflectionIntensityScale(this, atmosphereConfig, reflectionSource);
        const reflectionSmoothingMs = getPmndrsRuntimeLightingSmoothingMs(atmosphereConfig);
        const reflectionIntensityScale = reflectionSmoothingMs > 0 && typeof this._vrodosReflectionEnvironmentIntensityScale === 'number'
            ? this._vrodosReflectionEnvironmentIntensityScale
            : reflectionTargetScale;
        const options = {
            renderQuality: this.data.renderQuality || 'standard',
            maxAnisotropy,
            reflectionsEnabled,
            reflectionProfile: this.data.reflectionProfile || 'balanced',
            reflectionSource,
            reflectionOcclusionMode,
            shadowAwareReflections,
            reflectionIntensityScale,
            ambientOcclusionPreset: this.getAmbientOcclusionPreset(),
            environmentMap: sceneObj ? (sceneObj.environment || null) : null
        };
        const enhancedMaterials = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
        const reflectionIntensityMaterials = [];
        const reflectionIntensityMaterialSet = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
        const trackReflectionIntensityMaterial = function (material) {
            if (!material || typeof material.envMapIntensity === 'undefined') {
                return;
            }
            if (reflectionIntensityMaterialSet) {
                if (reflectionIntensityMaterialSet.has(material)) {
                    return;
                }
                reflectionIntensityMaterialSet.add(material);
            }
            reflectionIntensityMaterials.push(material);
        };
        const enhanceMaterialOnce = function (material, overrides) {
            if (!material || isHiddenNavmeshMaterial(material)) {
                return;
            }
            if (enhancedMaterials && enhancedMaterials.has(material)) {
                return;
            }
            vrodosEnhanceMeshMaterial(material, overrides || {}, options);
            trackReflectionIntensityMaterial(material);
            if (enhancedMaterials) {
                enhancedMaterials.add(material);
            }
        };

        Array.prototype.forEach.call(this.getCachedSceneQuery('overrideMaterials', '.override-materials'), (entityEl) => {
            if (!entityEl) {
                return;
            }

            const meshRoot = entityEl.getObject3D('mesh');
            if (!meshRoot) {
                return;
            }

            const overrides = vrodosGetExplicitMaterialOverrides(entityEl);
            if (getEntityShadowRole(entityEl) !== 'none') {
                overrides.vrodosShadowReceiver = true;
            }
            if (isFlatMediaShadowEntity(entityEl)) {
                overrides.vrodosReadableMedia = true;
            }
            meshRoot.traverse((node) => {
                if (!node.isMesh || !node.material || isHiddenNavmeshMaterial(node.material)) {
                    return;
                }

                if (Array.isArray(node.material)) {
                    node.material.forEach((material) => {
                        enhanceMaterialOnce(material, overrides);
                    });
                } else {
                    enhanceMaterialOnce(node.material, overrides);
                }
            });
        });

        if (sceneObj) {
            sceneObj.traverse((node) => {
                if (!node.isMesh || !node.material || isHiddenNavmeshMaterial(node.material)) {
                    return;
                }

                const nodeShadowRole = getObjectShadowRole(node);
                const nodeOverrides = {};
                if (nodeShadowRole !== 'none' && isWorldLightingParticipantMesh(node)) {
                    nodeOverrides.vrodosShadowReceiver = true;
                }
                if (objectEntityChainHas(node, isFlatMediaShadowEntity)) {
                    nodeOverrides.vrodosReadableMedia = true;
                }

                if (Array.isArray(node.material)) {
                    node.material.forEach((material) => {
                        enhanceMaterialOnce(material, nodeOverrides);
                    });
                } else {
                    enhanceMaterialOnce(node.material, nodeOverrides);
                }
            });
        }

        this._vrodosReflectionIntensityMaterials = reflectionIntensityMaterials;
        if (typeof this.markShadowDirty === 'function') {
            this.markShadowDirty('material-profile');
        }
    };
    H.updateReflectionEnvironmentIntensity = function (time, reflectionSource) {
        const sceneObj = this.el && this.el.object3D ? this.el.object3D : null;
        const source = reflectionSource || (typeof this.getEffectiveReflectionSource === 'function'
            ? this.getEffectiveReflectionSource()
            : 'none');
        if (!sceneObj || !sceneObj.environment || (source !== 'hdr' && source !== 'scene-probe' && source !== 'takram-sky')) {
            return;
        }

        const atmosphereConfig = this.getPmndrsAtmosphereConfig ? this.getPmndrsAtmosphereConfig() : null;
        const targetScale = getPmndrsNightReflectionIntensityScale(this, atmosphereConfig, source);
        const smoothingMs = getPmndrsRuntimeLightingSmoothingMs(atmosphereConfig);
        const smoothedScale = smoothPmndrsRuntimeLightValue(
            this,
            `reflectionEnvironmentIntensity:${source}`,
            targetScale,
            smoothingMs,
            this._vrodosReflectionEnvironmentIntensityScale
        );
        this._vrodosReflectionEnvironmentIntensityScale = smoothedScale;

        if (typeof sceneObj.environmentIntensity !== 'undefined') {
            sceneObj.environmentIntensity = smoothedScale;
        }

        const materials = this._vrodosReflectionIntensityMaterials || [];
        const getTargetEnvMapIntensity = typeof window !== 'undefined' && typeof window.vrodosGetTargetEnvMapIntensity === 'function'
            ? window.vrodosGetTargetEnvMapIntensity
            : null;
        if (!materials.length || !getTargetEnvMapIntensity) {
            return;
        }

        const reflectionsEnabled = typeof this.areReflectionsEnabled === 'function' ? this.areReflectionsEnabled() : true;
        const options = {
            renderQuality: this.data.renderQuality || 'standard',
            reflectionsEnabled,
            reflectionProfile: this.data.reflectionProfile || 'balanced',
            reflectionSource: source,
            reflectionIntensityScale: smoothedScale,
            environmentMap: sceneObj.environment
        };

        materials.forEach((material) => {
            if (!material || typeof material.envMapIntensity === 'undefined') {
                return;
            }
            material.envMapIntensity = getTargetEnvMapIntensity(material, options);
        });

        this._vrodosReflectionEnvironmentLastUpdateMs = typeof time === 'number' ? time : null;
    };
    H.ensurePhotorealHelperLight = function (id, attributes, position) {
        let lightEl = document.getElementById(id);
        let changed = false;
        if (!lightEl) {
            lightEl = document.createElement('a-entity');
            lightEl.setAttribute('id', id);
            this.el.appendChild(lightEl);
            this.markSceneCollectionsDirty();
            changed = true;
        }

        const signature = `${attributes}|${position}`;
        if (lightEl.getAttribute('data-vrodos-photoreal-light-signature') !== signature) {
            lightEl.setAttribute('light', attributes);
            lightEl.setAttribute('position', position);
            lightEl.setAttribute('data-vrodos-photoreal-light-signature', signature);
            changed = true;
        }
        if (lightEl.getAttribute('data-vrodos-photoreal-light') !== 'true') {
            lightEl.setAttribute('data-vrodos-photoreal-light', 'true');
            changed = true;
        }
        if (lightEl.getAttribute('data-vrodos-celestial-light') !== 'true') {
            lightEl.setAttribute('data-vrodos-celestial-light', 'true');
            changed = true;
        }
        if (lightEl.getAttribute('visible') !== 'true') {
            lightEl.setAttribute('visible', 'true');
            changed = true;
        }
        if (changed && typeof this.markShadowDirty === 'function') {
            this.markShadowDirty('photoreal-light');
        }
        return lightEl;
    };
    H.removePhotorealHelperLights = function () {
        removePhotorealHelperLightElements(this);
        removePmndrsTakramLightSources(this);
    };
    H.applyHorizonSkyPreset = function () {
        if (this.data.selChoice !== "0") {
            return;
        }

        const preset = this.getHorizonSkyPreset();
        const useVrBaselineHorizon = shouldUseVrBaselineHorizon(this);
        const useVrTakramLightsOnly = shouldUseVrTakramLightsOnly(this);
        const useVrTakramVisibleSky = shouldUseVrTakramVisibleSky(this);
        const isPmndrs = this.data.postFXEngine === 'pmndrs' && !useVrBaselineHorizon;
        const usePmndrsEnvironmentVisuals = isPmndrs && !useVrTakramLightsOnly;
        const useGradientEnvironmentSky = usePmndrsEnvironmentVisuals;
        const usesTakramHorizon = shouldUsePmndrsTakramHorizonPath(this);
        const shadowEnabled = (typeof this.getEffectiveShadowQuality === 'function' ? this.getEffectiveShadowQuality() : this.data.shadowQuality) !== 'off';

        if (!usesTakramHorizon && !useVrTakramLightsOnly) {
            setAFrameDefaultLightsEnabled(this, true);
        }

        if (usePmndrsEnvironmentVisuals && !useVrTakramVisibleSky) {
            removeLegacySunSkyEntitiesForPmndrs(this);
        }

        const environmentConfig = {
            active: true,
            preset: 'default',
            ground: 'none',
            fog: (this.data.fogCategory === "2") ? (parseFloat(this.data.fogdensity) * 1.5) : 0,
            playArea: 1,
            shadow: shadowEnabled,
            stageSize: getLegacyHorizonStageSizeValue(this)
        };

        // skyType 'gradient' draws a smooth horizonColor to skyColor blend with no
        // procedural sun disk. Headset lights-only does not use this component at all;
        // it gets a lightweight VRodos sky mesh so A-Frame environment does not own
        // any sky, lighting, or shadow work.
        if (preset === 'clear') {
            environmentConfig.skyType = useGradientEnvironmentSky ? 'gradient' : 'atmosphere';
            environmentConfig.skyColor = useGradientEnvironmentSky ? '#82c7fb' : '#bfe0ff';
            environmentConfig.horizonColor = useGradientEnvironmentSky ? '#fff0d3' : '#fff8ee';
            environmentConfig.lighting = 'distant';
            environmentConfig.lightPosition = '0.08 0.98 -0.12';
        } else if (preset === 'crisp') {
            environmentConfig.skyType = useGradientEnvironmentSky ? 'gradient' : 'atmosphere';
            environmentConfig.skyColor = useGradientEnvironmentSky ? '#8fc8f6' : '#abd7ff';
            environmentConfig.horizonColor = useGradientEnvironmentSky ? '#fff1d8' : '#fffaf2';
            environmentConfig.lighting = 'distant';
            environmentConfig.lightPosition = '0.1 0.99 -0.12';
        } else {
            environmentConfig.skyType = useGradientEnvironmentSky ? 'gradient' : 'atmosphere';
            environmentConfig.skyColor = useGradientEnvironmentSky ? '#94c9f5' : '#b8dcff';
            environmentConfig.horizonColor = useGradientEnvironmentSky ? '#ffefd8' : '#fff7ec';
            environmentConfig.lighting = 'distant';
            environmentConfig.lightPosition = '0.08 0.99 -0.1';
        }

        if (useVrTakramLightsOnly) {
            if (this.el.hasAttribute('environment')) {
                this.el.removeAttribute('environment');
            }
            ensureVrTakramLightsOnlyGradientSky(this, preset);
        } else if (!usesTakramHorizon) {
            removeVrTakramLightsOnlyGradientSky(this);
            this.el.setAttribute('environment', environmentConfig);
        } else if (this.el.hasAttribute('environment')) {
            removeVrTakramLightsOnlyGradientSky(this);
            this.el.removeAttribute('environment');
        }

        if (!isPmndrs) {
            removeVrTakramLightsOnlyGradientSky(this);
            setAFrameDefaultLightsEnabled(this, true);
            this.removePhotorealHelperLights();
            removePmndrsAtmosphereSky(this);
            clearPmndrsHorizonSun(this);
            return;
        }

        const atmosphereConfig = this.getPmndrsAtmosphereConfig ? this.getPmndrsAtmosphereConfig() : null;
        if (useVrTakramLightsOnly) {
            clearPmndrsHorizonSun(this);
            const lightsReady = atmosphereConfig && atmosphereConfig.enabled
                ? ensurePmndrsTakramHorizonLights(this, atmosphereConfig, preset, {
                    fallback: false,
                    ensureSky: false
                })
                : false;
            if (!lightsReady) {
                if (atmosphereConfig && atmosphereConfig.enabled) {
                    setAFrameDefaultLightsEnabled(this, false);
                    ensurePmndrsFallbackHorizonLights(this, atmosphereConfig, preset);
                } else {
                    setAFrameDefaultLightsEnabled(this, true);
                }
            }
            scheduleVrTakramLightsOnlyHorizonVisualSync(this);
            logPmndrsHorizonDiagnostic(this, 'apply-horizon-lights-only', atmosphereConfig);
            return;
        }

        if (usesTakramHorizon && atmosphereConfig && atmosphereConfig.enabled) {
            ensurePmndrsTakramHorizonLights(this, atmosphereConfig, preset);
            clearPmndrsHorizonSun(this);
            const skyReady = ensurePmndrsAtmosphereSky(this, atmosphereConfig);
            if (useVrTakramVisibleSky && (!skyReady || !isVrTakramVisibleSkyReadyForHandoff(this))) {
                setPmndrsAtmosphereSkyVisibility(this, false);
            } else {
                completeVrTakramVisibleSkyHandoff(this);
            }
            logPmndrsHorizonDiagnostic(this, 'apply-horizon', atmosphereConfig);
            return;
        }

        this.removePhotorealHelperLights();
        removeVrTakramLightsOnlyGradientSky(this);

        if (atmosphereConfig && atmosphereConfig.enabled && window.VRODOS_TAKRAM_ATMOSPHERE) {
            schedulePmndrsHorizonEnvironmentCleanup(this);

            clearPmndrsHorizonSun(this);
            if (ensurePmndrsAtmosphereSky(this, atmosphereConfig)) {
                logPmndrsHorizonDiagnostic(this, 'apply-horizon', atmosphereConfig);
                return;
            }
        }

        setAFrameDefaultLightsEnabled(this, true);
        removePmndrsAtmosphereSky(this);
        ensurePmndrsHorizonSun(this, environmentConfig.lightPosition, preset);
    };
    H.applyBackgroundQualityProfile = function () {
        const renderQuality = typeof this.getRenderQualityLevel === 'function' ? this.getRenderQualityLevel() : (this.data.renderQuality === 'high' ? 'high' : 'standard');
        const effectiveShadowQuality = typeof this.getEffectiveShadowQuality === 'function' ? this.getEffectiveShadowQuality() : this.data.shadowQuality;
        const isHighQuality = renderQuality === 'high';
        const shadowEnabled = effectiveShadowQuality !== 'off';
        const hasEnvironmentBackground = (this.data.selChoice === "0") || (this.data.selChoice === "2" && this.data.presChoice !== "ocean");
        const reflectionProfile = this.data.reflectionProfile || 'balanced';
        const enhancedReflections = reflectionProfile === 'enhanced';
        const softReflections = reflectionProfile === 'soft';
        const contactShadowSettings = getTerrainSafeContactShadowSettings(this, this.getContactShadowSettings());
        const hasAuthorLights = Array.prototype.some.call(this.getCachedSceneQuery('lightEntities', '[light]'), (lightEl) => !lightEl.hasAttribute('data-vrodos-photoreal-light'));

        syncLegacyHorizonCameraFar(this);

        if (shouldUsePmndrsTakramHorizonPath(this) || shouldUseVrBaselineHorizon(this) || isVrTakramLightsOnlyProfile(this)) {
            this.applyHorizonSkyPreset();
            return;
        }

        setAFrameDefaultLightsEnabled(this, true);

        if (hasEnvironmentBackground && this.el.hasAttribute('environment')) {
            this.el.setAttribute('environment', 'shadow', shadowEnabled ? 'true' : 'false');
            if (this.data.selChoice === "0") {
                this.applyHorizonSkyPreset();
            } else {
                removePmndrsAtmosphereSky(this);
                clearPmndrsHorizonSun(this);
                this.el.setAttribute('environment', 'lighting', 'distant');
                this.el.setAttribute('environment', 'lightPosition', isHighQuality ? (enhancedReflections ? '0.12 1 -0.08' : (softReflections ? '0.05 1 -0.02' : '0.08 1 -0.04')) : '0 1 0');
            }
            this.removePhotorealHelperLights();
            return;
        }

        removePmndrsAtmosphereSky(this);
        clearPmndrsHorizonSun(this);

        if (!isHighQuality || hasAuthorLights) {
            this.removePhotorealHelperLights();
            return;
        }

        const keyShadowMap = effectiveShadowQuality === 'high' ? 2048 : 1024;
        const castShadow = shadowEnabled ? 'true' : 'false';

        this.ensurePhotorealHelperLight(
            'vrodos-photoreal-key-light',
            `type: directional; color: #fff2d8; intensity: ${  enhancedReflections ? Math.max(contactShadowSettings.helperKeyIntensity, 1.0).toFixed(2) : (softReflections ? Math.max(contactShadowSettings.helperKeyIntensity - 0.08, 0.72).toFixed(2) : contactShadowSettings.helperKeyIntensity.toFixed(2))  }; castShadow: ${  castShadow  }; shadowMapWidth: ${  keyShadowMap  }; shadowMapHeight: ${  keyShadowMap  }; shadowCameraTop: 16; shadowCameraRight: 16; shadowCameraLeft: -16; shadowCameraBottom: -16; shadowBias: ${  contactShadowSettings.bias  }; shadowRadius: ${  getPmndrsDayNightShadowRadius(this).toFixed(2)  };`,
            contactShadowSettings.helperPosition
        );

        this.ensurePhotorealHelperLight(
            'vrodos-photoreal-fill-light',
            `type: ambient; color: #d8e4ff; intensity: ${  enhancedReflections ? Math.max(contactShadowSettings.helperFillIntensity, 0.4).toFixed(2) : (softReflections ? Math.max(contactShadowSettings.helperFillIntensity - 0.05, 0.22).toFixed(2) : contactShadowSettings.helperFillIntensity.toFixed(2))  };`,
            '0 4 0'
        );
    };
    H.applyPostFXProfile = function () {
        const renderer = this.el.renderer;
        const canvas = this.el.canvas || (renderer ? renderer.domElement : null);
        const postFxEnabled = this.shouldUsePostProcessing();

        if (!canvas) {
            return;
        }

        canvas.style.filter = '';

        if (renderer && typeof renderer.toneMappingExposure !== 'undefined') {
            if (this.data.postFXEngine === 'pmndrs') {
                const atmosphereConfig = typeof this.getPmndrsAtmosphereConfig === 'function'
                    ? this.getPmndrsAtmosphereConfig()
                    : null;
                renderer.toneMappingExposure = smoothPmndrsRuntimeLightValue(
                    this,
                    'takramToneMappingExposure',
                    getPmndrsExposureValue(this),
                    getPmndrsRuntimeLightingSmoothingMs(atmosphereConfig),
                    renderer.toneMappingExposure
                );
            } else if (this.data.renderQuality === 'high') {
                renderer.toneMappingExposure = 1.06;
            } else {
                renderer.toneMappingExposure = 1.0;
            }
        }

        this.syncPostProcessingState();
    };
    H.applyQualityProfiles = function () {
        this.applyRenderQualityProfile();
        this.applyBackgroundQualityProfile();
        this.applyShadowQualityProfile();
        this.applyEnvMapProfile();
        this.applyMaterialProfiles();
        this.applyPostFXProfile();
        this.syncFPSMeterState();
        this.sceneCollectionsDirty = false;
    };
    H.updateAdaptiveShadowFit = function (force) {
        if (!this ||
            !this.el ||
            !this.el.camera ||
            (typeof this.getEffectiveShadowQuality === 'function' ? this.getEffectiveShadowQuality() : this.data.shadowQuality) === 'off') {
            return;
        }

        if (!force && isStaticShadowMode(this)) {
            return;
        }

        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (!force && this._vrodosShadowFitLastMs && (now - this._vrodosShadowFitLastMs) < 300) {
            return;
        }

        if (!this._vrodosShadowFitCameraPosition) {
            this._vrodosShadowFitCameraPosition = new THREE.Vector3();
            this._vrodosShadowFitCurrentCameraPosition = new THREE.Vector3();
            force = true;
        }

        this.el.camera.getWorldPosition(this._vrodosShadowFitCurrentCameraPosition);
        if (!force && this._vrodosShadowFitCurrentCameraPosition.distanceToSquared(this._vrodosShadowFitCameraPosition) < 9) {
            return;
        }

        this._vrodosShadowFitCameraPosition.copy(this._vrodosShadowFitCurrentCameraPosition);
        this._vrodosShadowFitLastMs = now;
        applyAdaptiveShadowFit(this);
        if (typeof this.markShadowDirty === 'function') {
            this.markShadowDirty(force ? 'adaptive-shadow-force' : 'adaptive-shadow-camera');
        }
    };
    H.hidePmndrsHorizonEnvironmentVisuals = function () {
        hidePmndrsHorizonEnvironmentVisuals(this);
    };
    H.showPmndrsAtmosphereSkyForSceneProbe = function (config) {
        return showPmndrsAtmosphereSkyForSceneProbe(this, config);
    };
    H.hidePmndrsAtmosphereSky = function () {
        hidePmndrsAtmosphereSky(this);
    };
    H.isPmndrsAtmosphereSkyVisible = function () {
        return isPmndrsAtmosphereSkyVisible(this);
    };
    H.prepareVrTakramVisibleSkyForReveal = function () {
        if (!shouldUseVrTakramVisibleSky(this)) {
            return true;
        }

        const config = typeof this.getPmndrsAtmosphereConfig === 'function'
            ? this.getPmndrsAtmosphereConfig()
            : null;
        if (!config || config.enabled === false) {
            return true;
        }

        const skyReady = ensurePmndrsAtmosphereSky(this, config);
        const readyForReveal = skyReady && isVrTakramVisibleSkyReadyForHandoff(this);
        setPmndrsAtmosphereSkyVisibility(this, readyForReveal);
        if (readyForReveal) {
            completeVrTakramVisibleSkyHandoff(this);
        }
        return readyForReveal;
    };
    H.logPmndrsHorizonDiagnostic = function (context, atmosphereConfig) {
        logPmndrsHorizonDiagnostic(this, context, atmosphereConfig);
    };
})();
