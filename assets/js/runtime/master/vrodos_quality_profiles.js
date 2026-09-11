/**
 * VRodos Quality Profile Helpers
 * Extracted from vrodos_scene_settings.component.js
 */
/* global VRODOSMaster */
(function () {
    const H = VRODOSMaster.SceneSettingsHelpers = VRODOSMaster.SceneSettingsHelpers || {};
    const TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS = 0.004675;

    const PMNDRS_STARS_POINT_SIZE = 1.8;
    const PMNDRS_STARS_FALLBACK_POINT_SIZE = 1.65;
    const PMNDRS_STARS_FALLBACK_RADIUS = 6000;
    const PMNDRS_TAKRAM_STARS_RELATIVE_PATH = 'assets/vendor/takram-atmosphere/stars.bin';
    const PMNDRS_TAKRAM_MOON_COLOR_RELATIVE_PATH = 'assets/vendor/nasa-moon/lroc_color_poles_1k.jpg';
    const PMNDRS_TAKRAM_NATIVE_MOON_ANGULAR_RADIUS = 0.0045;
    const PMNDRS_MOON_ANGULAR_RADIUS = 0.015708;
    const PMNDRS_MOON_ANGULAR_DIAMETER_DEG = 1.8;
    const PMNDRS_MOON_VISIBILITY_BOOST = 8.0;
    const PMNDRS_MOON_HALO_RADIUS_SCALE = 5.5;
    const PMNDRS_MOON_HALO_STRENGTH = 0.012;
    const PMNDRS_MOON_STAR_OCCLUSION_FEATHER_RAD = 0.002094;
    const PMNDRS_MOON_RADIANCE_SCALE = Math.pow(
        PMNDRS_MOON_ANGULAR_RADIUS / PMNDRS_TAKRAM_NATIVE_MOON_ANGULAR_RADIUS,
        2
    ) * PMNDRS_MOON_VISIBILITY_BOOST;

    const VR_TAKRAM_SKY_DIRECT_EXPOSURE = 24;
    const VR_TAKRAM_SKY_REVEAL_WARMUP_MS = 10000;
    const PMNDRS_DAY_NIGHT_CYCLE_DEFAULT_MINUTES = 1;
    const PMNDRS_DAY_NIGHT_CYCLE_MIN_MINUTES = VRODOSMaster.CelestialClock.minDurationMinutes;
    const PMNDRS_DAY_NIGHT_CYCLE_MAX_MINUTES = 1440;

    const PMNDRS_CLOUD_SUN_DISK_SPRITE_ACTIVATE_VISIBILITY = 0.985;
    const PMNDRS_CLOUD_SUN_DISK_SPRITE_RELEASE_VISIBILITY = 0.997;
    const PMNDRS_CLOUD_SUN_DISK_SPRITE_OPACITY_MIN = 0.56;
    const PMNDRS_CLOUD_SUN_DISK_SPRITE_OPACITY_CURVE = 0.45;
    const PMNDRS_CLOUD_SUN_DISK_SPRITE_INTENSITY_SCALE = 1.05;
    const PMNDRS_CLOUD_PHASE_NATIVE_SUN_HIDE_VISIBILITY = 0.14;
    const PMNDRS_CLOUD_PHASE_NATIVE_SUN_RELEASE_VISIBILITY = 0.24;
    const runtimeSettingsContract = window.VRODOS_RUNTIME_SETTINGS_CONTRACT || {};
    const smoothPmndrsRuntimeLightValue = VRODOSMaster.LightSmoothing.value;

    const shadowRuntime = VRODOSMaster.ShadowRuntime.create({
        readPmndrsDebugNumber,
        hasPmndrsDebugFlag,
        isPmndrsDayNightCycleEnabled,
        getRuntimeNowMs,
        getImmersiveNavigationForPresentedTransforms
    });
    const {
        getPmndrsDayNightShadowRadius,
        objectEntityChainHas,
        isShadowEligibleMaterial,
        isWorldLightingParticipantMesh,
        getTerrainSafeContactShadowSettings,
        isPmndrsTakramHorizonRequested,
        vectorToRoundedArray,
        getShadowDiagnosticState
    } = shadowRuntime;
    const RuntimeSettings = VRODOSMaster.RuntimeSettings || {};
    const buildPmndrsLocalSunDirection = VRODOSMaster.CelestialCoordinates.localSunDirection;
    const getPmndrsResolvedGeospatialFrame = VRODOSMaster.CelestialCoordinates.resolveFrame;
    const ecefDirectionToPmndrsLocal = VRODOSMaster.CelestialCoordinates.toLocal;
    const applyLocalDirectionAngles = VRODOSMaster.CelestialCoordinates.applyLocalAngles;
    const buildPmndrsEcefSunDirection = VRODOSMaster.CelestialCoordinates.sunDirectionToEcef;
    const ensurePmndrsWorldToEcefMatrix = VRODOSMaster.CelestialCoordinates.applyWorldMatrix;
    if (!runtimeSettingsContract.horizonHelperLightPresets || !runtimeSettingsContract.atmosphereLookDefaults) {
        throw new Error("VRodos runtime settings contract is missing required atmosphere presets.");
    }

    const PMNDRS_ATMOSPHERE_LOOK_DEFAULTS = runtimeSettingsContract.atmosphereLookDefaults;
    const clampPmndrsNumber = RuntimeSettings.clampNumber;

    const {
        roundPmndrsCloudSunOcclusionDiagnostic,
        computePmndrsCloudSunOcclusionFactors,
        getPmndrsCloudSunShadowRadiusScale,
        getPmndrsCloudSunShadowIntensityFactor,
        getPmndrsCloudSunOcclusionState,
        getPmndrsCloudMoonOcclusionState,
        getPmndrsCloudMoonStarRecovery,
        PMNDRS_CLOUD_SUN_OCCLUSION_STATIC_SMOOTH_MS
    } = VRODOSMaster.CloudOcclusion.create({
        clamp01,
        smoothstepNumber,
        lerpNumber,
        hasPmndrsDebugFlag,
        logPmndrsCloudSunOcclusionDiagnostic,
        // Lighting is assembled below; resolve its visibility functions when called.
        getPmndrsSunDirectLightVisibility: config => getPmndrsSunDirectLightVisibility(config),
        getPmndrsMoonDirectLightVisibility: config => getPmndrsMoonDirectLightVisibility(config)
    });

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

    function getPmndrsTakramMoonColorUrl() {
        const runtime = window.vrodos_render_runtime || {};
        const configuredUrl = window.vrodos_takram_moon_color_url ||
            runtime.takram_moon_color_url ||
            runtime.takramMoonColorUrl;
        if (typeof configuredUrl === 'string' && configuredUrl.trim()) {
            return configuredUrl.trim();
        }

        const configuredPath = runtime.takram_moon_color_path || runtime.takramMoonColorPath || PMNDRS_TAKRAM_MOON_COLOR_RELATIVE_PATH;
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

    function getPmndrsAtmosphereResourceProfile(self, renderer) {
        const quality = normalizePmndrsAtmosphereQuality(self && typeof self.getPmndrsAtmosphereQuality === 'function'
            ? self.getPmndrsAtmosphereQuality()
            : (self && self.data ? self.data.pmndrsAtmosphereQuality : 'balanced'));
        if (shouldUseVrTakramDirectSkyCalibration(self)) {
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
        return window.VRODOSMaster.RuntimeSettings.debugFlag(debugKey, queryKey);
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

    function getPmndrsDateObject(dateText, utcTimeText) {
        const date = normalizePmndrsDate(dateText);
        const time = normalizePmndrsUtcTime(utcTimeText);
        const parsed = new Date(`${date  }T${  time  }:00Z`);
        if (isNaN(parsed.getTime())) {
            return new Date('2026-06-21T12:00:00Z');
        }
        return parsed;
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

    function resolvePmndrsCloudShadowLengthForSky(self, explicitShadowLength) {
        if (explicitShadowLength !== undefined) {
            return explicitShadowLength || null;
        }

        if (!shouldRoutePmndrsCloudShadowLengthToSkyMaterial(self)) {
            return null;
        }

        const diagnostics = self && self._pmndrsCloudsDiagnostics ? self._pmndrsCloudsDiagnostics : null;
        if (!diagnostics || diagnostics.cloudsActive !== true) {
            return null;
        }

        const atmosphereConfig = self && typeof self.getPmndrsAtmosphereConfig === 'function'
            ? self.getPmndrsAtmosphereConfig()
            : null;
        if (getPmndrsSunDirectLightVisibility(atmosphereConfig) <= 0.001) {
            return null;
        }

        const effect = self && self.pmndrsCloudsEffect ? self.pmndrsCloudsEffect : null;
        return effect && effect.atmosphereShadowLength ? effect.atmosphereShadowLength : null;
    }

    function shouldRoutePmndrsCloudShadowLengthToSkyMaterial(self) {
        if (hasPmndrsDebugFlag('enablePmndrsCloudSkyShadowLength', 'vrodos_debug_enable_pmndrs_cloud_sky_shadow_length')) {
            return true;
        }
        return !shouldUsePmndrsTakramHorizonPath(self);
    }

    function syncPmndrsCloudShadowLengthToSkyMaterial(self, explicitShadowLength, reason) {
        const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
        const material = state && state.skyMaterial ? state.skyMaterial : null;
        const routeDisabledReason = explicitShadowLength === undefined && !shouldRoutePmndrsCloudShadowLengthToSkyMaterial(self)
            ? 'horizon-sky-shadowlength-disabled'
            : '';
        const shadowLength = resolvePmndrsCloudShadowLengthForSky(self, explicitShadowLength);
        let routed = false;

        if (material && Object.prototype.hasOwnProperty.call(material, 'shadowLength')) {
            if (material.shadowLength !== shadowLength) {
                material.shadowLength = shadowLength;
                material.needsUpdate = true;
                if (typeof material.setChanged === 'function') {
                    material.setChanged();
                }
            }
            routed = Boolean(shadowLength);
        }

        if (state) {
            state.cloudSkyShadowLengthRouted = routed;
            state.cloudSkyShadowLengthReason = routed ? (reason || '') : (routeDisabledReason || 'sun-below-horizon-or-unavailable');
        }
        if (self) {
            self._pmndrsCloudSkyShadowLengthRouted = routed;
            if (self._pmndrsCloudsDiagnostics) {
                self._pmndrsCloudsDiagnostics.skyShadowLengthRouted = routed;
                self._pmndrsCloudsDiagnostics.skyShadowLengthReason = routed ? (reason || '') : (routeDisabledReason || 'sun-below-horizon-or-unavailable');
            }
        }
        return routed;
    }

    function removePmndrsAtmosphereSky(self) {
        if (!self || !self._pmndrsAtmosphereState) {
            return;
        }
        const state = self._pmndrsAtmosphereState;
        syncPmndrsCloudShadowLengthToSkyMaterial(self, null, 'sky-remove');
        if (state.starsFallbackMesh && state.starsFallbackMesh.parent) {
            state.starsFallbackMesh.parent.remove(state.starsFallbackMesh);
        }
        state.moonTextureLoadToken = (state.moonTextureLoadToken || 0) + 1;
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
        state.moonTexture = null;
        state.moonTextureLoading = false;
        state.moonTextureFailed = false;
        state.moonDiagnostics = null;
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

    function formatPmndrsNumberForLog(value, digits, fallback) {
        return typeof value === 'number' && isFinite(value)
            ? value.toFixed(typeof digits === 'number' ? digits : 2)
            : (fallback || 'n/a');
    }

    function formatPmndrsCloudLightingForLog(self) {
        const diagnostics = self && self._pmndrsCloudsDiagnostics ? self._pmndrsCloudsDiagnostics : null;
        if (!diagnostics) {
            return {
                clouds: 'none',
                cloudSun: 'none',
                cloudMoon: 'none'
            };
        }

        const authoredCoverage = typeof diagnostics.authoredCoverage === 'number'
            ? diagnostics.authoredCoverage
            : (typeof diagnostics.coverage === 'number' ? diagnostics.coverage : null);
        const effectiveCoverage = typeof diagnostics.effectiveCoverage === 'number'
            ? diagnostics.effectiveCoverage
            : null;
        const cloudsState = [
            diagnostics.cloudsActive ? 'on' : 'off',
            formatPmndrsNumberForLog(authoredCoverage, 2),
            formatPmndrsNumberForLog(effectiveCoverage, 2),
            diagnostics.layerProfile ? `layers-${diagnostics.layerProfile}` : '',
            diagnostics.haze ? 'haze-on' : 'haze-off',
            diagnostics.hazeDisabledReason ? `haze-skip-${diagnostics.hazeDisabledReason}` : '',
            diagnostics.directCompositeEnabled ? 'direct-composite-on' : 'direct-composite-off',
            diagnostics.aerialOverlayRouted ? 'aerial-overlay-on' : 'aerial-overlay-off',
            diagnostics.temporalUpscale ? 'temporal-on' : 'temporal-off',
            diagnostics.temporalUpscaleSkippedReason ? `temporal-skip-${diagnostics.temporalUpscaleSkippedReason}` : '',
            diagnostics.lightShafts ? 'shafts-on' : 'shafts-off',
            diagnostics.lightShaftsSkippedReason ? `shafts-skip-${diagnostics.lightShaftsSkippedReason}` : '',
            diagnostics.aerialShadowRouted ? 'aerial-shadow-on' : 'aerial-shadow-off',
            diagnostics.aerialShadowReason ? `aerial-shadow-${diagnostics.aerialShadowReason}` : '',
            diagnostics.skyShadowLengthRouted ? 'sky-shadow-on' : 'sky-shadow-off',
            diagnostics.skyShadowLengthReason ? `sky-shadow-${diagnostics.skyShadowLengthReason}` : '',
            diagnostics.cloudsSkippedReason ? `skip-${diagnostics.cloudsSkippedReason}` : ''
        ].filter(Boolean).join(':');
        const reason = diagnostics.cloudSunOcclusionReason || (diagnostics.cloudSunOcclusionEnabled ? 'active' : 'none');
        const cloudSunState = [
            diagnostics.cloudSunOcclusionEnabled ? 'on' : 'off',
            reason,
            `s${formatPmndrsNumberForLog(diagnostics.cloudSunOcclusionStrength, 2)}`,
            `target${formatPmndrsNumberForLog(diagnostics.cloudSunOcclusionTargetStrength, 2)}`,
            `coverage${formatPmndrsNumberForLog(diagnostics.cloudSunCoverageStrength, 2)}`,
            `disk${formatPmndrsNumberForLog(diagnostics.cloudSunDiskStrength, 2)}`,
            `elev${formatPmndrsNumberForLog(diagnostics.cloudSunElevationFactor, 2)}`,
            `direct${formatPmndrsNumberForLog(diagnostics.cloudSunDirectFactor, 2)}`,
            `sky${formatPmndrsNumberForLog(diagnostics.cloudSkyFactor, 2)}`,
            `fill${formatPmndrsNumberForLog(diagnostics.cloudFillFactor, 2)}`,
            `ambient${formatPmndrsNumberForLog(diagnostics.cloudAmbientFactor, 2)}`,
            `reflection${formatPmndrsNumberForLog(diagnostics.cloudReflectionFactor, 2)}`,
            `shadowIntensity${formatPmndrsNumberForLog(diagnostics.cloudSunShadowIntensityFactor, 2)}`,
            `shadowRadius${formatPmndrsNumberForLog(diagnostics.cloudSunShadowRadiusScale, 2)}`,
            `skySun${formatPmndrsNumberForLog(diagnostics.cloudSkySunDiskVisibility, 2)}`
        ].join(':');
        const moonReason = diagnostics.cloudMoonOcclusionReason || (diagnostics.cloudMoonOcclusionEnabled ? 'active' : 'none');
        const cloudMoonState = [
            diagnostics.cloudMoonOcclusionEnabled ? 'on' : 'off',
            moonReason,
            `s${formatPmndrsNumberForLog(diagnostics.cloudMoonOcclusionStrength, 2)}`,
            `disk${formatPmndrsNumberForLog(diagnostics.cloudMoonDiskStrength, 2)}`,
            `sample-${diagnostics.cloudMoonDiskSampleReason || 'none'}`,
            `direct${formatPmndrsNumberForLog(diagnostics.cloudMoonDirectFactor, 2)}`,
            `indirect${formatPmndrsNumberForLog(diagnostics.cloudMoonIndirectFactor, 2)}`,
            `reflection${formatPmndrsNumberForLog(diagnostics.cloudMoonReflectionFactor, 2)}`,
            `disc${formatPmndrsNumberForLog(diagnostics.cloudMoonDiscVisibility, 2)}`,
            `stars${formatPmndrsNumberForLog(diagnostics.cloudMoonStarRecoveryFactor, 2)}`,
            `shadow-${diagnostics.cloudCelestialShadowOwner || 'none'}`,
            diagnostics.cloudMoonShaftsActive
                ? `shafts${formatPmndrsNumberForLog(diagnostics.cloudMoonShaftsStrength, 3)}`
                : `shafts-skip-${diagnostics.cloudMoonShaftsSkippedReason || 'inactive'}`
        ].join(':');

        return {
            clouds: cloudsState,
            cloudSun: cloudSunState,
            cloudMoon: cloudMoonState
        };
    }

    function logPmndrsCloudSunOcclusionDiagnostic(self, diagnostics) {
        if (!self || !diagnostics || diagnostics.cloudsActive !== true) {
            return;
        }

        const diagnosticsEnabled = hasPmndrsDebugFlag('pmndrsHorizonDiagnostics', 'vrodos_debug_pmndrs_horizon') ||
            hasPmndrsDebugFlag('pmndrsHorizonDiagnosticsVerbose', 'vrodos_debug_pmndrs_horizon_verbose');
        const startupStateLogEnabled = !diagnosticsEnabled && !self._pmndrsCloudSunOcclusionStartupLogged;
        if (!diagnosticsEnabled && !startupStateLogEnabled) {
            return;
        }

        const cloudLightingLog = formatPmndrsCloudLightingForLog(self);
        const signature = [
            cloudLightingLog.clouds,
            cloudLightingLog.cloudSun,
            cloudLightingLog.cloudMoon
        ].join('|');
        if (diagnosticsEnabled) {
            self._pmndrsCloudSunOcclusionDiagSignature = self._pmndrsCloudSunOcclusionDiagSignature || '';
            if (self._pmndrsCloudSunOcclusionDiagSignature === signature) {
                return;
            }
            self._pmndrsCloudSunOcclusionDiagSignature = signature;
        } else {
            self._pmndrsCloudSunOcclusionStartupLogged = true;
        }

        const logMethod = diagnosticsEnabled ? 'debug' : 'info';
        const log = console[logMethod] || console.info || console.log || function () { return undefined; };
        log.call(console, `[VRodos] PMNDRS cloud lighting: clouds=${  cloudLightingLog.clouds
            }, cloudSun=${  cloudLightingLog.cloudSun
            }, cloudMoon=${  cloudLightingLog.cloudMoon}`);
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
        const starsIntensity = atmosphereConfig ? getPmndrsStarsIntensity(atmosphereConfig, self) : 0;
        const cloudLightingLog = formatPmndrsCloudLightingForLog(self);
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
            shadowState.fitted,
            cloudLightingLog.clouds,
            cloudLightingLog.cloudSun,
            cloudLightingLog.cloudMoon
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
                }, stars=${  starsIntensity.toFixed(2)
                }, clouds=${  cloudLightingLog.clouds
                }, cloudSun=${  cloudLightingLog.cloudSun
                }, cloudMoon=${  cloudLightingLog.cloudMoon}`);
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
            }, shadowFit=${  shadowState.fitted
            }, clouds=${  cloudLightingLog.clouds
            }, cloudSun=${  cloudLightingLog.cloudSun
            }, cloudMoon=${  cloudLightingLog.cloudMoon}`);
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

    function getVrTakramVisibleSkyLowerHazeColors(preset) {
        if (preset === 'clear') {
            return {
                lower: '#79858e',
                horizon: '#a9bece'
            };
        }
        if (preset === 'crisp') {
            return {
                lower: '#737f89',
                horizon: '#a8bfd2'
            };
        }

        return {
            lower: '#78828b',
            horizon: '#a7bac9'
        };
    }

    function setVectorFromDisplayHexColor(vector, color, fallback) {
        if (!vector || typeof vector.set !== 'function') {
            return vector;
        }
        const normalized = normalizePmndrsColor(color, fallback || '#000000');
        vector.set(
            parseInt(normalized.slice(1, 3), 16) / 255,
            parseInt(normalized.slice(3, 5), 16) / 255,
            parseInt(normalized.slice(5, 7), 16) / 255
        );
        return vector;
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

        if (!shouldUseVrTakramDirectSkyCalibration(self)) {
            material.userData.vrodosVrTakramSkyDirectShaderPatched = false;
            material.userData.vrodosVrTakramSkyDirectPatchFailed = false;
            material.userData.vrodosVrTakramSkyDirectWarmed = true;
            material.userData.vrodosVrTakramSkyDirectWarmupMs = 0;
            material.userData.vrodosVrTakramSkyDirectWarmupRemainingMs = 0;
            state.vrTakramSkyDirectCalibrated = false;
            state.vrTakramSkyDirectExposure = null;
            state.vrTakramSkyDirectCalibrationMode = 'native-takram-stereo-pmndrs';
            state.vrTakramSkyDirectShaderPatched = false;
            state.vrTakramSkyDirectPatchFailed = false;
            state.vrTakramSkyDirectWarmed = true;
            state.vrTakramSkyDirectWarmupMs = 0;
            state.vrTakramSkyDirectWarmupRemainingMs = 0;
            return Boolean(state.ready && !state.failed && state.textures);
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

    function isHeadsetStereoPmndrsTakramParityPath(self) {
        return Boolean(self &&
            self.data &&
            self.data.postFXEngine === 'pmndrs' &&
            (
                (typeof self.canUseVrHeadsetStereoPmndrsComposer === 'function' && self.canUseVrHeadsetStereoPmndrsComposer()) ||
                (typeof self.isHeadsetPmndrsStereoComposerForceEnabled === 'function' && self.isHeadsetPmndrsStereoComposerForceEnabled())
            ));
    }

    function shouldUseVrTakramDirectSkyCalibration(self) {
        return Boolean(shouldUseVrTakramVisibleSky(self) && !isHeadsetStereoPmndrsTakramParityPath(self));
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

        // Local Horizon scenes have authored terrain/ground. Takram's sky
        // material ground is a flat lower-hemisphere contribution, which reads
        // as a clamp in headset direct-stereo visible-sky mode.
        config.groundEnabled = false;
        config.groundAlbedo = '#000000';
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
            moonPhase: VRODOSMaster.MoonPhase.normalize(this.data.pmndrsMoonPhase),
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
        config.localMoonDirection = VRODOSMaster.MoonPhase.directionFromSun(config.localSunDirection);
        config.sunDirection = buildPmndrsEcefSunDirection(config.localSunDirection, config);
        config.moonDirection = VRODOSMaster.MoonPhase.directionFromSun(config.sunDirection);

        if (celestialMode === 'datetime' && window.VRODOS_TAKRAM_ATMOSPHERE) {
            const frame = getPmndrsResolvedGeospatialFrame(config);
            const observerECEF = frame.position;
            const date = dayNightCycleEnabled
                ? VRODOSMaster.CelestialClock.effectiveDate(this, getPmndrsDateObject(celestialDate, celestialUtcTime), dayNightCycleDurationMinutes)
                : getPmndrsDateObject(celestialDate, celestialUtcTime);
            const moonDate = dayNightCycleEnabled && this._pmndrsDayNightCycleState && this._pmndrsDayNightCycleState.moonEffectiveDate
                ? this._pmndrsDayNightCycleState.moonEffectiveDate
                : date;
            const vta = window.VRODOS_TAKRAM_ATMOSPHERE;
            config.effectiveDate = date;
            config.moonEffectiveDate = moonDate;

            if (typeof vta.getSunDirectionECEF === 'function') {
                config.sunDirection = vta.getSunDirectionECEF(date, new THREE.Vector3(), observerECEF).normalize();
                config.localSunDirection = ecefDirectionToPmndrsLocal(config.sunDirection, frame);
                applyLocalDirectionAngles(config);
            }
            if (typeof vta.getMoonDirectionECEF === 'function') {
                config.moonDirection = vta.getMoonDirectionECEF(moonDate, new THREE.Vector3(), observerECEF).normalize();
                config.localMoonDirection = ecefDirectionToPmndrsLocal(config.moonDirection, frame);
                config.astronomicalMoonPosition = true;
            } else {
                config.moonDirection = VRODOSMaster.MoonPhase.directionFromSun(config.sunDirection);
                config.localMoonDirection = VRODOSMaster.MoonPhase.directionFromSun(config.localSunDirection);
                config.astronomicalMoonPosition = false;
            }
            if (typeof vta.getECIToECEFRotationMatrix === 'function') {
                config.inertialToECEFMatrix = vta.getECIToECEFRotationMatrix(date, new THREE.Matrix4());
                config.moonInertialToECEFMatrix = vta.getECIToECEFRotationMatrix(moonDate, new THREE.Matrix4());
            }
        }
        VRODOSMaster.MoonPhase.applyConfig(config, window.VRODOS_TAKRAM_ATMOSPHERE || null);
        syncPmndrsTakramHorizonState(this, config);
        return config;
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

    function getPmndrsMoonStarOcclusionCosine(config) {
        if (!config || config.moonEnabled === false) {
            return 1;
        }
        return Math.cos(PMNDRS_MOON_ANGULAR_RADIUS + PMNDRS_MOON_STAR_OCCLUSION_FEATHER_RAD);
    }

    function syncPmndrsTakramStarMoonOcclusion(material, config, state) {
        const uniforms = material && material.uniforms ? material.uniforms : null;
        const patchApplied = Boolean(uniforms &&
            uniforms.vrodosMoonOcclusionDirection &&
            uniforms.vrodosMoonOcclusionCosine);
        if (state) {
            state.starMoonOcclusionShaderApplied = patchApplied;
        }
        if (!patchApplied) {
            return false;
        }
        if (config.moonDirection && uniforms.vrodosMoonOcclusionDirection.value &&
            typeof uniforms.vrodosMoonOcclusionDirection.value.copy === 'function') {
            uniforms.vrodosMoonOcclusionDirection.value.copy(config.moonDirection);
        }
        uniforms.vrodosMoonOcclusionCosine.value = getPmndrsMoonStarOcclusionCosine(config);
        return true;
    }

    function installPmndrsFallbackStarMoonOcclusion(material) {
        if (!material || !THREE.Vector3 || (material.userData && material.userData.vrodosMoonOcclusionInstalled)) {
            return false;
        }
        material.userData = material.userData || {};
        const directionUniform = { value: new THREE.Vector3(0, 0, 1) };
        const cosineUniform = { value: 1 };
        const originalOnBeforeCompile = typeof material.onBeforeCompile === 'function'
            ? material.onBeforeCompile.bind(material)
            : null;
        const originalProgramKey = typeof material.customProgramCacheKey === 'function'
            ? material.customProgramCacheKey.bind(material)
            : null;

        material.onBeforeCompile = function (shader, renderer) {
            if (originalOnBeforeCompile) {
                originalOnBeforeCompile(shader, renderer);
            }
            shader.uniforms.vrodosMoonOcclusionDirection = directionUniform;
            shader.uniforms.vrodosMoonOcclusionCosine = cosineUniform;
            shader.vertexShader = `varying vec3 vVrodosStarWorldDirection;\n${  shader.vertexShader}`;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                '#include <begin_vertex>\n vVrodosStarWorldDirection = normalize((modelMatrix * vec4(transformed, 0.0)).xyz);'
            );
            shader.fragmentShader = [
                'uniform vec3 vrodosMoonOcclusionDirection;',
                'uniform float vrodosMoonOcclusionCosine;',
                'varying vec3 vVrodosStarWorldDirection;',
                shader.fragmentShader
            ].join('\n');
            shader.fragmentShader = shader.fragmentShader.replace(
                'void main() {',
                [
                    'void main() {',
                    '  // VRODOS_FALLBACK_MOON_STAR_OCCLUSION_SHADER_PATCH',
                    '  if (vrodosMoonOcclusionCosine < 1.0 &&',
                    '      dot(normalize(vVrodosStarWorldDirection), normalize(vrodosMoonOcclusionDirection)) > vrodosMoonOcclusionCosine) {',
                    '    discard;',
                    '  }'
                ].join('\n')
            );
        };
        material.customProgramCacheKey = function () {
            return `${originalProgramKey ? originalProgramKey() : ''  }|vrodos-moon-star-occlusion-v1`;
        };
        material.userData.vrodosMoonOcclusionInstalled = true;
        material.userData.vrodosMoonOcclusionDirection = directionUniform;
        material.userData.vrodosMoonOcclusionCosine = cosineUniform;
        material.needsUpdate = true;
        return true;
    }

    function syncPmndrsFallbackStarMoonOcclusion(material, config, state) {
        const userData = material && material.userData ? material.userData : null;
        const directionUniform = userData ? userData.vrodosMoonOcclusionDirection : null;
        const cosineUniform = userData ? userData.vrodosMoonOcclusionCosine : null;
        const patchApplied = Boolean(directionUniform && cosineUniform);
        if (state) {
            state.starMoonOcclusionFallbackApplied = patchApplied;
        }
        if (!patchApplied) {
            return false;
        }
        if (config.localMoonDirection && directionUniform.value && typeof directionUniform.value.copy === 'function') {
            directionUniform.value.copy(config.localMoonDirection);
        }
        cosineUniform.value = getPmndrsMoonStarOcclusionCosine(config);
        return true;
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
            installPmndrsFallbackStarMoonOcclusion(state.starsFallbackMaterial);
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
            syncPmndrsFallbackStarMoonOcclusion(state.starsFallbackMaterial, config, state);
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

        const intensity = getPmndrsStarsIntensity(config, self);
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
            syncPmndrsTakramStarMoonOcclusion(state.starsMaterial, config, state);
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

        const fallbackVisible = state.starsMesh
            ? false
            : ensurePmndrsAtmosphereStarsFallback(self, config, state, intensity);
        if (state.starsFallbackMesh && state.starsMesh) {
            state.starsFallbackMesh.visible = false;
        }
        return Boolean(state.starsMesh || fallbackVisible);
    }

    function setPmndrsTexturedMoonDefine(material, enabled) {
        if (!material || !material.defines) {
            return false;
        }
        const active = material.defines.VRODOS_TEXTURED_MOON != null;
        if (enabled === active) {
            return false;
        }
        if (enabled) {
            material.defines.VRODOS_TEXTURED_MOON = '1';
        } else {
            delete material.defines.VRODOS_TEXTURED_MOON;
        }
        material.needsUpdate = true;
        return true;
    }

    function setPmndrsCinematicMoonHaloDefine(material, enabled) {
        if (!material || !material.defines) {
            return false;
        }
        const active = material.defines.VRODOS_CINEMATIC_MOON_HALO != null;
        if (enabled === active) {
            return false;
        }
        if (enabled) {
            material.defines.VRODOS_CINEMATIC_MOON_HALO = '1';
        } else {
            delete material.defines.VRODOS_CINEMATIC_MOON_HALO;
        }
        material.needsUpdate = true;
        return true;
    }

    function setPmndrsProjectedMoonDiscDefine(material, enabled) {
        if (!material || !material.defines) {
            return false;
        }
        const active = material.defines.VRODOS_PROJECTED_MOON_DISC != null;
        if (enabled === active) {
            return false;
        }
        if (enabled) {
            material.defines.VRODOS_PROJECTED_MOON_DISC = '1';
        } else {
            delete material.defines.VRODOS_PROJECTED_MOON_DISC;
        }
        material.needsUpdate = true;
        return true;
    }

    function updatePmndrsMoonDiagnostics(self, state, config, fallbackState) {
        const material = state && state.skyMaterial ? state.skyMaterial : null;
        const defines = material && material.defines ? material.defines : null;
        const moonDefineEnabled = Boolean(defines && (
            (typeof defines.has === 'function' && defines.has('MOON')) ||
            (typeof defines.has !== 'function' && defines.MOON != null)
        ));
        const cloudMoonState = self && self._pmndrsCloudMoonOcclusionState ? self._pmndrsCloudMoonOcclusionState : null;
        const diagnostics = {
            enabled: Boolean(config && config.moonEnabled),
            authoredPhase: config ? config.moonPhase : 'auto',
            effectivePhase: config ? config.effectiveMoonPhase : 'full',
            phaseAngleDeg: config && typeof config.moonPhaseAngleDeg === 'number' ? config.moonPhaseAngleDeg : 0,
            illumination: config && typeof config.moonIllumination === 'number' ? config.moonIllumination : 1,
            angularDiameterDeg: PMNDRS_MOON_ANGULAR_DIAMETER_DEG,
            angularRadiusInvariant: true,
            projectedDiscEnabled: Boolean(defines && defines.VRODOS_PROJECTED_MOON_DISC != null),
            radianceScale: PMNDRS_MOON_RADIANCE_SCALE,
            visibilityBoost: PMNDRS_MOON_VISIBILITY_BOOST,
            orientationMode: config ? config.moonOrientationMode : 'stable-north-up',
            positionMode: config ? config.moonPositionMode : 'author-controlled-night',
            siderealDriftEnabled: Boolean(config && config.astronomicalMoonPosition),
            localDirection: config && config.localMoonDirection ? vectorToRoundedArray(config.localMoonDirection) : null,
            ecefDirection: config && config.moonDirection ? vectorToRoundedArray(config.moonDirection) : null,
            materialMoonEnabled: Boolean(material && material.moon),
            materialMoonDefineEnabled: moonDefineEnabled,
            assetUrl: state && state.moonTextureUrl ? state.moonTextureUrl : getPmndrsTakramMoonColorUrl(),
            shaderPatchApplied: Boolean(state && state.moonShaderPatchApplied),
            textureReady: Boolean(state && state.moonTexture),
            textureLoading: Boolean(state && state.moonTextureLoading),
            textureFailed: Boolean(state && state.moonTextureFailed),
            debugDisabled: hasPmndrsDebugFlag('disableTexturedMoon', 'vrodos_debug_disable_textured_moon'),
            haloEnabled: Boolean(defines && defines.VRODOS_CINEMATIC_MOON_HALO != null),
            haloRadiusScale: PMNDRS_MOON_HALO_RADIUS_SCALE,
            haloStrength: PMNDRS_MOON_HALO_STRENGTH,
            cloudVisibility: cloudMoonState && typeof cloudMoonState.cloudMoonDiscVisibility === 'number'
                ? cloudMoonState.cloudMoonDiscVisibility
                : 1,
            cloudOcclusionStrength: cloudMoonState && typeof cloudMoonState.cloudMoonOcclusionStrength === 'number'
                ? cloudMoonState.cloudMoonOcclusionStrength
                : 0,
            starOcclusionRadiusDeg: PMNDRS_MOON_ANGULAR_DIAMETER_DEG * 0.5 +
                THREE.MathUtils.radToDeg(PMNDRS_MOON_STAR_OCCLUSION_FEATHER_RAD),
            starOcclusionShaderApplied: Boolean(state && state.starMoonOcclusionShaderApplied),
            starOcclusionFallbackApplied: Boolean(state && state.starMoonOcclusionFallbackApplied),
            fallbackState: fallbackState || 'native-smooth'
        };
        if (state) {
            state.moonDiagnostics = diagnostics;
        }
        if (self) {
            self._pmndrsMoonDiagnostics = diagnostics;
            if (hasPmndrsDebugFlag('runtimeFeatures', 'vrodos_debug_runtime_features')) {
                const signature = JSON.stringify(diagnostics);
                if (signature !== self._pmndrsMoonDiagnosticsLogSignature) {
                    self._pmndrsMoonDiagnosticsLogSignature = signature;
                    console.info(`[VRodos] Moon state: ${signature}`);
                }
            }
        }
        return diagnostics;
    }

    function applyPmndrsMoonShaderState(self, config, state, material) {
        const uniforms = material && material.uniforms ? material.uniforms : null;
        const patchApplied = Boolean(uniforms &&
            uniforms.vrodosMoonLightDirection &&
            uniforms.vrodosMoonFixedToECEFMatrix &&
            uniforms.vrodosMoonColorTexture &&
            uniforms.vrodosMoonIllumination &&
            uniforms.vrodosMoonHaloRadiusScale &&
            uniforms.vrodosMoonHaloStrength &&
            uniforms.vrodosMoonCloudVisibility);
        const cloudMoonState = self && self._pmndrsCloudMoonOcclusionState
            ? self._pmndrsCloudMoonOcclusionState
            : getPmndrsCloudMoonOcclusionState(self, config, getPmndrsRuntimeLightingSmoothingMs(config));
        const cloudVisibility = cloudMoonState && typeof cloudMoonState.cloudMoonDiscVisibility === 'number'
            ? cloudMoonState.cloudMoonDiscVisibility
            : 1;
        state.moonShaderPatchApplied = patchApplied;
        material.moonAngularRadius = PMNDRS_MOON_ANGULAR_RADIUS;
        material.lunarRadianceScale = PMNDRS_MOON_RADIANCE_SCALE * cloudVisibility;

        if (patchApplied) {
            uniforms.vrodosMoonLightDirection.value.copy(config.moonLightDirection);
            uniforms.vrodosMoonFixedToECEFMatrix.value.copy(config.moonFixedToECEFMatrix);
            uniforms.vrodosMoonIllumination.value = config.moonEnabled ? config.moonIllumination : 0;
            uniforms.vrodosMoonHaloRadiusScale.value = PMNDRS_MOON_HALO_RADIUS_SCALE;
            uniforms.vrodosMoonHaloStrength.value = PMNDRS_MOON_HALO_STRENGTH;
            uniforms.vrodosMoonCloudVisibility.value = cloudVisibility;
        }
        const debugDisabled = hasPmndrsDebugFlag('disableTexturedMoon', 'vrodos_debug_disable_textured_moon');
        const cinematicMoonEnabled = Boolean(config.moonEnabled && patchApplied && !debugDisabled);
        setPmndrsCinematicMoonHaloDefine(material, cinematicMoonEnabled);
        setPmndrsProjectedMoonDiscDefine(material, cinematicMoonEnabled);

        const textured = Boolean(config.moonEnabled && patchApplied && state.moonTexture && !debugDisabled);
        if (patchApplied) {
            uniforms.vrodosMoonColorTexture.value = textured ? state.moonTexture : null;
        }
        setPmndrsTexturedMoonDefine(material, textured);
        updatePmndrsMoonDiagnostics(
            self,
            state,
            config,
            textured ? 'textured' : (debugDisabled ? 'native-debug-disabled' : (state.moonTextureFailed ? 'native-load-failed' : 'native-smooth'))
        );
        return textured;
    }

    function ensurePmndrsAtmosphereMoon(self, config, state, material) {
        if (!self || !state || !config || !material) {
            return false;
        }

        if (!config.moonEnabled || hasPmndrsDebugFlag('disableTexturedMoon', 'vrodos_debug_disable_textured_moon')) {
            return applyPmndrsMoonShaderState(self, config, state, material);
        }

        if (state.moonTexture || state.moonTextureLoading || state.moonTextureFailed) {
            return applyPmndrsMoonShaderState(self, config, state, material);
        }

        state.moonTextureLoading = true;
        state.moonTextureUrl = getPmndrsTakramMoonColorUrl();
        const loadToken = (state.moonTextureLoadToken || 0) + 1;
        state.moonTextureLoadToken = loadToken;
        updatePmndrsMoonDiagnostics(self, state, config, 'native-loading');

        new THREE.TextureLoader().load(
            state.moonTextureUrl,
            (texture) => {
                if (!self._pmndrsAtmosphereState || self._pmndrsAtmosphereState !== state || state.moonTextureLoadToken !== loadToken) {
                    texture.dispose();
                    return;
                }
                texture.name = 'vrodosNasaMoonColor1K';
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.generateMipmaps = true;
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.needsUpdate = true;
                state.moonTexture = texture;
                state.moonTextureLoading = false;
                state.moonTextureFailed = false;
                applyPmndrsMoonShaderState(self, config, state, material);
                self._takramSkyEnvironmentNeedsUpdate = true;
                if (typeof self.publishRuntimeFeatureState === 'function') {
                    self.publishRuntimeFeatureState('moon-texture-ready');
                }
            },
            undefined,
            (error) => {
                if (state.moonTextureLoadToken !== loadToken) {
                    return;
                }
                state.moonTextureLoading = false;
                state.moonTextureFailed = true;
                applyPmndrsMoonShaderState(self, config, state, material);
                if (!state.moonTextureWarningLogged) {
                    state.moonTextureWarningLogged = true;
                    console.warn('[VRodos] NASA moon texture failed to load; Takram native phase moon remains active.', error);
                }
                if (typeof self.publishRuntimeFeatureState === 'function') {
                    self.publishRuntimeFeatureState('moon-texture-failed');
                }
            }
        );

        return applyPmndrsMoonShaderState(self, config, state, material);
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
        if (!shouldUseVrTakramDirectSkyCalibration(self) || !material) {
            const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
            if (state && shouldUseVrTakramVisibleSky(self)) {
                state.vrTakramSkyDirectCalibrated = false;
                state.vrTakramSkyDirectExposure = null;
                state.vrTakramSkyDirectCalibrationMode = 'native-takram-stereo-pmndrs';
            }
            return false;
        }

        const exposure = getVrTakramSkyDirectExposure();
        const preset = self && typeof self.getHorizonSkyPreset === 'function' ? self.getHorizonSkyPreset() : 'natural';
        const lowerHazeColors = getVrTakramVisibleSkyLowerHazeColors(preset);
        const uniforms = material.uniforms || (material.uniforms = {});
        const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
        if (!uniforms.vrodosSkyExposure) {
            uniforms.vrodosSkyExposure = typeof THREE.Uniform === 'function'
                ? new THREE.Uniform(exposure)
                : { value: exposure };
        } else {
            uniforms.vrodosSkyExposure.value = exposure;
        }
        if (!uniforms.vrodosVrSkyLowerHazeColor) {
            const lowerVector = new THREE.Vector3();
            uniforms.vrodosVrSkyLowerHazeColor = typeof THREE.Uniform === 'function'
                ? new THREE.Uniform(lowerVector)
                : { value: lowerVector };
        }
        if (!uniforms.vrodosVrSkyHorizonHazeColor) {
            const horizonVector = new THREE.Vector3();
            uniforms.vrodosVrSkyHorizonHazeColor = typeof THREE.Uniform === 'function'
                ? new THREE.Uniform(horizonVector)
                : { value: horizonVector };
        }
        setVectorFromDisplayHexColor(uniforms.vrodosVrSkyLowerHazeColor.value, lowerHazeColors.lower, '#78828b');
        setVectorFromDisplayHexColor(uniforms.vrodosVrSkyHorizonHazeColor.value, lowerHazeColors.horizon, '#a7bac9');

        material.userData = material.userData || {};
        material.userData.vrodosVrTakramSkyDirectExposure = exposure;
        material.userData.vrodosVrTakramSkyLowerHazeColor = lowerHazeColors.lower;
        material.userData.vrodosVrTakramSkyHorizonHazeColor = lowerHazeColors.horizon;

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
                shader.uniforms.vrodosVrSkyLowerHazeColor = uniforms.vrodosVrSkyLowerHazeColor;
                shader.uniforms.vrodosVrSkyHorizonHazeColor = uniforms.vrodosVrSkyHorizonHazeColor;
                if (shader.fragmentShader.indexOf('uniform float vrodosSkyExposure;') === -1) {
                    const calibrationUniforms = [
                        'uniform float vrodosSkyExposure;',
                        'uniform vec3 vrodosVrSkyLowerHazeColor;',
                        'uniform vec3 vrodosVrSkyHorizonHazeColor;'
                    ].join('\n');
                    const withUniform = shader.fragmentShader.replace(
                        'uniform vec3 groundAlbedo;',
                        `uniform vec3 groundAlbedo;\n${  calibrationUniforms}`
                    );
                    shader.fragmentShader = withUniform === shader.fragmentShader
                        ? `${calibrationUniforms}\n${  shader.fragmentShader}`
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
                            '  float vrodosLocalElevation = dot(normalize(cameraPosition), rayDirection);',
                            '  float vrodosLowerHazeMix = 1.0 - smoothstep(-0.02, 0.14, vrodosLocalElevation);',
                            '  float vrodosLowerHazeGradient = smoothstep(-0.38, 0.10, vrodosLocalElevation);',
                            '  vec3 vrodosLowerHazeColor = mix(vrodosVrSkyLowerHazeColor, vrodosVrSkyHorizonHazeColor, vrodosLowerHazeGradient);',
                            '  outputColor.rgb = mix(outputColor.rgb, vrodosLowerHazeColor, vrodosLowerHazeMix);',
                            '  outputColor.a = 1.0;'
                        ].join('\n')
                    );
                    const shaderPatched = patched !== shader.fragmentShader &&
                        patched.indexOf('uniform float vrodosSkyExposure;') !== -1 &&
                        patched.indexOf('uniform vec3 vrodosVrSkyLowerHazeColor;') !== -1 &&
                        patched.indexOf('uniform vec3 vrodosVrSkyHorizonHazeColor;') !== -1;
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
                return `${baseKey}|vrodos-vr-takram-sky-direct:${  exposure.toFixed(3)  }:lower-haze-v1`;
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
            state.vrTakramSkyDirectCalibrationMode = 'legacy-headset-direct-sky';
            state.vrTakramSkyDirectShaderPatched = Boolean(material.userData.vrodosVrTakramSkyDirectShaderPatched);
            state.vrTakramSkyDirectPatchFailed = Boolean(material.userData.vrodosVrTakramSkyDirectPatchFailed);
            state.vrTakramSkyDirectReadySinceMs = material.userData.vrodosVrTakramSkyDirectReadySinceMs || 0;
            state.vrTakramSkyDirectWarmupMs = material.userData.vrodosVrTakramSkyDirectWarmupMs || getVrTakramSkyRevealWarmupMs();
            state.vrTakramSkyDirectWarmed = Boolean(material.userData.vrodosVrTakramSkyDirectWarmed);
            state.vrTakramSkyDirectWarmupRemainingMs = material.userData.vrodosVrTakramSkyDirectWarmupRemainingMs || state.vrTakramSkyDirectWarmupMs;
        }

        return true;
    }

    function setPmndrsMaterialDefine(defines, key, value) {
        if (!defines) {
            return false;
        }
        if (typeof defines.set === 'function') {
            if (defines.get(key) !== value) {
                defines.set(key, value);
                return true;
            }
            return false;
        }
        if (defines[key] !== value) {
            defines[key] = value;
            return true;
        }
        return false;
    }

    function removePmndrsMaterialDefine(defines, key) {
        if (!defines) {
            return false;
        }
        if (typeof defines.delete === 'function') {
            if (defines.has(key)) {
                defines.delete(key);
                return true;
            }
            return false;
        }
        if (Object.prototype.hasOwnProperty.call(defines, key)) {
            delete defines[key];
            return true;
        }
        return false;
    }

    function setPmndrsSkyMaterialNativeSun(self, enabled) {
        const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
        const material = state && state.skyMaterial ? state.skyMaterial : null;
        if (!material || typeof material.sun === 'undefined') {
            return false;
        }

        const nextEnabled = Boolean(enabled);
        let changed = false;
        if (material.sun !== nextEnabled) {
            material.sun = nextEnabled;
            changed = true;
        }
        if (nextEnabled) {
            material.defines = material.defines || {};
            changed = setPmndrsMaterialDefine(material.defines, "SUN", "1") || changed;
            changed = setPmndrsMaterialDefine(material.defines, "PERSPECTIVE_CAMERA", "1") || changed;
        } else if (material.defines) {
            changed = removePmndrsMaterialDefine(material.defines, "SUN") || changed;
        }
        if (changed) {
            material.needsUpdate = true;
            if (typeof material.setChanged === 'function') {
                material.setChanged();
            }
        }
        return true;
    }

    function isPmndrsCloudSunDiskSpriteDisabled() {
        if (window.VRODOS_DEBUG && window.VRODOS_DEBUG.disablePmndrsCloudSunDiskSprite === true) {
            return true;
        }
        if (typeof window.location === 'undefined' || !window.location.search) {
            return false;
        }
        try {
            const params = new URLSearchParams(window.location.search);
            return params.get('vrodos_debug_disable_pmndrs_cloud_sun_sprite') === '1';
        } catch (err) {
            return false;
        }
    }

    function isPmndrsDesktopPresentation(self) {
        if (!self || !self.el) {
            return false;
        }
        if (typeof self.isDirectVrPresentationActive === 'function' && self.isDirectVrPresentationActive()) {
            return false;
        }
        if (typeof self.isImmersiveXrActive === 'function' && self.isImmersiveXrActive()) {
            return false;
        }
        const renderer = self.el.renderer;
        return !(renderer && renderer.xr && renderer.xr.isPresenting);
    }

    function shouldUsePmndrsTakramCloudPhaseSunDisk(self, config, cloudSunOcclusion) {
        if (!self || !config || config.enabled === false || config.takramSunEnabled === false) {
            return false;
        }
        if (!shouldUsePmndrsTakramHorizonPath(self) || !isPmndrsDesktopPresentation(self)) {
            return false;
        }
        const diagnostics = self._pmndrsCloudsDiagnostics || null;
        if (!(diagnostics && diagnostics.cloudsActive === true && diagnostics.accuratePhaseFunction === true)) {
            return false;
        }
        const targetVisibility = getPmndrsCloudSkySunDiskTargetVisibility(cloudSunOcclusion);
        const visibilityThreshold = self._pmndrsCloudSunDiskTakramPhaseActive === true
            ? PMNDRS_CLOUD_SUN_DISK_SPRITE_RELEASE_VISIBILITY
            : PMNDRS_CLOUD_SUN_DISK_SPRITE_ACTIVATE_VISIBILITY;
        return targetVisibility < visibilityThreshold;
    }

    function shouldUsePmndrsCloudSunDiskSprite(self, config, cloudSunOcclusion) {
        if (!self || !config || config.enabled === false || config.takramSunEnabled === false) {
            return false;
        }
        if (isPmndrsCloudSunDiskSpriteDisabled() || shouldDisablePmndrsVisibleSunDebug()) {
            return false;
        }
        if (shouldUsePmndrsTakramCloudPhaseSunDisk(self, config, cloudSunOcclusion)) {
            return false;
        }
        if (!shouldUsePmndrsTakramHorizonPath(self) || !isPmndrsDesktopPresentation(self)) {
            return false;
        }
        const diagnostics = self._pmndrsCloudsDiagnostics || null;
        const cloudsActive = Boolean((diagnostics && diagnostics.cloudsActive === true) || self.pmndrsCloudsEffect);
        if (!cloudsActive) {
            return false;
        }
        const sunElevationFactor = cloudSunOcclusion && typeof cloudSunOcclusion.cloudSunElevationFactor === 'number'
            ? cloudSunOcclusion.cloudSunElevationFactor
            : (cloudSunOcclusion && typeof cloudSunOcclusion.sunElevationFactor === 'number'
                ? cloudSunOcclusion.sunElevationFactor
                : getPmndrsSunDirectLightVisibility(config));
        if (sunElevationFactor <= 0.001) {
            return false;
        }
        const targetVisibility = getPmndrsCloudSkySunDiskTargetVisibility(cloudSunOcclusion);
        const visibilityThreshold = self._pmndrsCloudSunDiskSpriteActive === true
            ? PMNDRS_CLOUD_SUN_DISK_SPRITE_RELEASE_VISIBILITY
            : PMNDRS_CLOUD_SUN_DISK_SPRITE_ACTIVATE_VISIBILITY;
        return targetVisibility < visibilityThreshold;
    }

    function getPmndrsCloudSkySunDiskTargetVisibility(cloudSunOcclusion) {
        if (cloudSunOcclusion && typeof cloudSunOcclusion.cloudSkySunDiskVisibility === 'number') {
            return clamp01(cloudSunOcclusion.cloudSkySunDiskVisibility);
        }
        if (cloudSunOcclusion && typeof cloudSunOcclusion.skySunDiskVisibility === 'number') {
            return clamp01(cloudSunOcclusion.skySunDiskVisibility);
        }
        return 1;
    }

    function shouldHidePmndrsTakramPhaseNativeSunDisk(self, targetVisibility) {
        const visibility = Number.isFinite(targetVisibility) ? clamp01(targetVisibility) : 1;
        const threshold = self && self._pmndrsCloudSunDiskTakramPhaseNativeHidden === true
            ? PMNDRS_CLOUD_PHASE_NATIVE_SUN_RELEASE_VISIBILITY
            : PMNDRS_CLOUD_PHASE_NATIVE_SUN_HIDE_VISIBILITY;
        return visibility <= threshold;
    }

    function getPmndrsCloudSunDiskSpriteOpacity(visibility) {
        const value = Number.isFinite(visibility) ? clamp01(visibility) : 1;
        if (value >= 0.999) {
            return 1;
        }
        const curved = Math.pow(value, PMNDRS_CLOUD_SUN_DISK_SPRITE_OPACITY_CURVE);
        return Math.max(PMNDRS_CLOUD_SUN_DISK_SPRITE_OPACITY_MIN, curved);
    }

    function applyPmndrsSunSpriteCloudVisibility(self, visibility, opacity) {
        if (typeof document === 'undefined') {
            return;
        }
        const spriteOpacity = Number.isFinite(opacity)
            ? clamp01(opacity)
            : getPmndrsCloudSunDiskSpriteOpacity(visibility);
        const sunEl = document.getElementById('vrodos-pmndrs-sun');
        const sprite = sunEl && typeof sunEl.getObject3D === 'function'
            ? sunEl.getObject3D('mesh')
            : null;
        if (sprite && sprite.material) {
            sprite.material.opacity = spriteOpacity;
            sprite.material.transparent = true;
            sprite.material.needsUpdate = true;
        }

        const hazeEl = document.getElementById('vrodos-pmndrs-sun-haze');
        const hazeSprite = hazeEl && typeof hazeEl.getObject3D === 'function'
            ? hazeEl.getObject3D('mesh')
            : null;
        if (hazeSprite && hazeSprite.material) {
            hazeSprite.visible = false;
            hazeSprite.material.opacity = 0;
            hazeSprite.material.needsUpdate = true;
        }
    }

    function getPmndrsCloudSunDiskScreenOverlayOpacity(visibility) {
        const value = Number.isFinite(visibility) ? clamp01(visibility) : 1;
        if (value >= PMNDRS_CLOUD_SUN_DISK_SPRITE_ACTIVATE_VISIBILITY) {
            return 0;
        }
        return Math.max(0.08, Math.min(0.26, 0.055 + ((1 - value) * 0.19)));
    }

    function clearPmndrsCloudSunDiskScreenOverlay(self) {
        if (typeof document !== 'undefined') {
            const overlay = document.getElementById('vrodos-pmndrs-cloud-sun-disk-overlay');
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }
        if (self) {
            self._pmndrsCloudSunDiskScreenOverlayOpacity = 0;
        }
    }

    function syncPmndrsCloudSunDiskScreenOverlay(self, lightPosition, visibility) {
        if (!self || !self.el || typeof document === 'undefined') {
            return 0;
        }
        const renderer = self.el.renderer;
        const camera = self.el.camera;
        const canvas = renderer && renderer.domElement ? renderer.domElement : null;
        if (!canvas || !camera || typeof camera.getWorldPosition !== 'function' || typeof canvas.getBoundingClientRect !== 'function') {
            clearPmndrsCloudSunDiskScreenOverlay(self);
            return 0;
        }
        const sceneOcclusion = typeof self._pmndrsSunOcclusionFactor === 'number'
            ? self._pmndrsSunOcclusionFactor
            : 1;
        const overlayOpacity = getPmndrsCloudSunDiskScreenOverlayOpacity(visibility) * clamp01(sceneOcclusion);
        if (overlayOpacity <= 0.001 || !lightPosition) {
            clearPmndrsCloudSunDiskScreenOverlay(self);
            return 0;
        }

        if (!self._pmndrsCloudSunDiskWorldPosition) {
            self._pmndrsCloudSunDiskWorldPosition = new THREE.Vector3();
            self._pmndrsCloudSunDiskScreenPosition = new THREE.Vector3();
            self._pmndrsCloudSunDiskCameraPosition = new THREE.Vector3();
        }

        const sunDirection = getImmersivePresentedSunDirection(self, parseLightPositionVector(lightPosition));
        camera.getWorldPosition(self._pmndrsCloudSunDiskCameraPosition);
        self._pmndrsCloudSunDiskWorldPosition.copy(self._pmndrsCloudSunDiskCameraPosition).addScaledVector(
            sunDirection,
            self._pmndrsSunDistance || 5200
        );
        self._pmndrsCloudSunDiskScreenPosition.copy(self._pmndrsCloudSunDiskWorldPosition).project(camera);
        const projected = self._pmndrsCloudSunDiskScreenPosition;
        if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y) || !Number.isFinite(projected.z) ||
            projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > 1.15 || Math.abs(projected.y) > 1.15) {
            clearPmndrsCloudSunDiskScreenOverlay(self);
            return 0;
        }

        let overlay = document.getElementById('vrodos-pmndrs-cloud-sun-disk-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'vrodos-pmndrs-cloud-sun-disk-overlay';
            overlay.setAttribute('data-vrodos-pmndrs-sun', 'true');
            overlay.style.position = 'fixed';
            overlay.style.pointerEvents = 'none';
            overlay.style.borderRadius = '999px';
            overlay.style.background = 'radial-gradient(circle, rgba(255,244,214,0.46) 0%, rgba(255,230,184,0.26) 34%, rgba(255,210,150,0.10) 66%, rgba(255,210,150,0) 100%)';
            overlay.style.mixBlendMode = 'screen';
            overlay.style.transform = 'translate(-50%, -50%)';
            overlay.style.zIndex = '2';
            document.body.appendChild(overlay);
        }

        const rect = canvas.getBoundingClientRect();
        const size = Math.max(30, Math.min(76, Math.round(rect.height * 0.05)));
        overlay.style.width = `${size}px`;
        overlay.style.height = `${size}px`;
        overlay.style.left = `${rect.left + ((projected.x * 0.5 + 0.5) * rect.width)}px`;
        overlay.style.top = `${rect.top + ((-projected.y * 0.5 + 0.5) * rect.height)}px`;
        overlay.style.opacity = String(overlayOpacity);
        overlay.style.display = 'block';
        self._pmndrsCloudSunDiskScreenOverlayOpacity = overlayOpacity;
        return overlayOpacity;
    }

    function syncPmndrsSkySunDiskCloudAttenuation(self, config, cloudSunOcclusion, smoothingMs) {
        const diagnostics = self._pmndrsCloudsDiagnostics || {};
        const targetVisibility = getPmndrsCloudSkySunDiskTargetVisibility(cloudSunOcclusion);
        const takramPhaseOwnsSunDisk = shouldUsePmndrsTakramCloudPhaseSunDisk(self, config, cloudSunOcclusion);
        const shouldUseSprite = !takramPhaseOwnsSunDisk && shouldUsePmndrsCloudSunDiskSprite(self, config, cloudSunOcclusion);
        let visibility = (shouldUseSprite || takramPhaseOwnsSunDisk)
            ? smoothPmndrsRuntimeLightValue(
                self,
                'takramSkySunDiskSpriteVisibility',
                targetVisibility,
                smoothingMs || PMNDRS_CLOUD_SUN_OCCLUSION_STATIC_SMOOTH_MS,
                typeof diagnostics.cloudSkySunDiskVisibility === 'number'
                    ? diagnostics.cloudSkySunDiskVisibility
                    : targetVisibility
            )
            : 1;

        if (takramPhaseOwnsSunDisk) {
            const hideNativeSunDisk = shouldHidePmndrsTakramPhaseNativeSunDisk(self, targetVisibility);
            const hasLegacySunSprite = self._pmndrsCloudSunDiskSpriteActive === true ||
                self._pmndrsSunSpriteActive === true ||
                (typeof document !== 'undefined' && (
                    document.getElementById('vrodos-pmndrs-sun') ||
                    document.getElementById('vrodos-pmndrs-sun-haze') ||
                    document.getElementById('vrodos-takram-visible-sun')
                ));
            if (hasLegacySunSprite) {
                clearPmndrsHorizonSun(self);
            }
            clearPmndrsCloudSunDiskScreenOverlay(self);
            self._pmndrsCloudSunDiskTakramPhaseActive = true;
            self._pmndrsCloudSunDiskTakramPhaseNativeHidden = hideNativeSunDisk;
            self._pmndrsCloudSunDiskSpriteActive = false;
            self._pmndrsCloudSunDiskSpriteVisibility = visibility;
            self._pmndrsCloudSunDiskSpriteOpacity = 0;
            const sceneOcclusion = typeof self._pmndrsSunOcclusionFactor === 'number'
                ? self._pmndrsSunOcclusionFactor
                : 1;
            setPmndrsSkyMaterialNativeSun(self, !hideNativeSunDisk && config && config.takramSunEnabled !== false && sceneOcclusion > 0.01);
        } else if (shouldUseSprite) {
            self._pmndrsCloudSunDiskTakramPhaseActive = false;
            self._pmndrsCloudSunDiskTakramPhaseNativeHidden = false;
            const horizonPreset = typeof self.getHorizonSkyPreset === 'function' ? self.getHorizonSkyPreset() : 'natural';
            const spriteOpacity = getPmndrsCloudSunDiskSpriteOpacity(visibility);
            self._pmndrsCloudSunDiskSpriteActive = true;
            self._pmndrsCloudSunDiskSpriteVisibility = visibility;
            self._pmndrsCloudSunDiskSpriteOpacity = spriteOpacity;
            setPmndrsSkyMaterialNativeSun(self, false);
            ensurePmndrsHorizonSun(self, config.localSunDirection || config.sunDirection, horizonPreset, {
                atmosphere: true,
                forceAtmosphereSprite: true,
                cloudSunDiskSprite: true,
                sunOpacity: spriteOpacity,
                sunIntensityScale: PMNDRS_CLOUD_SUN_DISK_SPRITE_INTENSITY_SCALE
            });
            applyPmndrsSunSpriteCloudVisibility(self, visibility, spriteOpacity);
            syncPmndrsCloudSunDiskScreenOverlay(self, config.localSunDirection || config.sunDirection, visibility);
        } else {
            visibility = 1;
            self._pmndrsCloudSunDiskTakramPhaseActive = false;
            const wasTakramPhaseNativeHidden = self._pmndrsCloudSunDiskTakramPhaseNativeHidden === true;
            self._pmndrsCloudSunDiskTakramPhaseNativeHidden = false;
            if (self._pmndrsCloudSunDiskSpriteActive) {
                self._pmndrsCloudSunDiskSpriteActive = false;
                self._pmndrsCloudSunDiskSpriteVisibility = 1;
                self._pmndrsCloudSunDiskSpriteOpacity = 1;
                clearPmndrsHorizonSun(self);
                clearPmndrsCloudSunDiskScreenOverlay(self);
                const sceneOcclusion = typeof self._pmndrsSunOcclusionFactor === 'number'
                    ? self._pmndrsSunOcclusionFactor
                    : 1;
                setPmndrsSkyMaterialNativeSun(self, config && config.takramSunEnabled !== false && sceneOcclusion > 0.01);
            } else if (wasTakramPhaseNativeHidden) {
                const sceneOcclusion = typeof self._pmndrsSunOcclusionFactor === 'number'
                    ? self._pmndrsSunOcclusionFactor
                    : 1;
                setPmndrsSkyMaterialNativeSun(self, config && config.takramSunEnabled !== false && sceneOcclusion > 0.01);
            }
        }

        diagnostics.cloudSkySunDiskVisibility = roundPmndrsCloudSunOcclusionDiagnostic(visibility);
        diagnostics.cloudSkySunDiskTargetVisibility = roundPmndrsCloudSunOcclusionDiagnostic(targetVisibility);
        diagnostics.cloudSkySunDiskSpriteOpacity = roundPmndrsCloudSunOcclusionDiagnostic(shouldUseSprite ? self._pmndrsCloudSunDiskSpriteOpacity : 0);
        diagnostics.cloudSkySunDiskScreenOpacity = roundPmndrsCloudSunOcclusionDiagnostic(shouldUseSprite ? self._pmndrsCloudSunDiskScreenOverlayOpacity : 0);
        diagnostics.cloudSkySunDiskNativeHidden = Boolean(takramPhaseOwnsSunDisk && self._pmndrsCloudSunDiskTakramPhaseNativeHidden === true);
        diagnostics.cloudSkySunDiskMode = takramPhaseOwnsSunDisk
            ? (diagnostics.cloudSkySunDiskNativeHidden ? 'takram-phase-muted' : 'takram-phase')
            : (shouldUseSprite ? 'sprite' : 'native');
        self._pmndrsCloudsDiagnostics = diagnostics;
        self.pmndrsCloudsDiagnostics = diagnostics;

        const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
        if (state) {
            state.skySunDiskCloudVisibility = visibility;
            state.skySunDiskCloudTargetVisibility = (shouldUseSprite || takramPhaseOwnsSunDisk) ? targetVisibility : 1;
            state.skySunDiskCloudShaderPatched = false;
            state.skySunDiskCloudPatchFailed = false;
            state.skySunDiskNativeHidden = diagnostics.cloudSkySunDiskNativeHidden;
            state.skySunDiskCloudMode = diagnostics.cloudSkySunDiskMode;
        }

        return visibility;
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
            const skyCloudState = getPmndrsCloudSunOcclusionState(
                self,
                config,
                getPmndrsRuntimeLightingSmoothingMs(config),
                getPmndrsRuntimeIndirectLightingSmoothingMs(config)
            );
            const skyMaterialConfig = shouldUsePmndrsCloudSunDiskSprite(self, config, skyCloudState)
                ? Object.assign({}, config, { takramSunEnabled: false })
                : config;
            self.applyPmndrsAtmosphereConfigToTarget(state.skyMaterial, skyMaterialConfig);
            syncPmndrsSkySunDiskCloudAttenuation(self, config, skyCloudState, getPmndrsRuntimeLightingSmoothingMs(config));
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
            syncPmndrsCloudShadowLengthToSkyMaterial(self, undefined, 'sky-ready');
        }

        if (state.skyMesh) {
            state.skyMesh.visible = true;
        }
        ensurePmndrsAtmosphereStars(self, config, state, vta);
        ensurePmndrsAtmosphereMoon(self, config, state, state.skyMaterial);

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
            : VRODOSMaster.MoonPhase.directionFromSun(presented.localSunDirection);
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
            const cloudSpriteOwnsSunDisk = Boolean(self && self._pmndrsCloudSunDiskSpriteActive === true);
            const cloudPhaseHidesNativeSunDisk = Boolean(self && self._pmndrsCloudSunDiskTakramPhaseNativeHidden === true);
            const shouldShowSkySun = !cloudSpriteOwnsSunDisk && !cloudPhaseHidesNativeSunDisk && factor > 0.01;
            setPmndrsSkyMaterialNativeSun(self, shouldShowSkySun);
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
            const baseIntensity = typeof self.pmndrsLensFlareEffect._vrodosBaseIntensity === 'number'
                ? self.pmndrsLensFlareEffect._vrodosBaseIntensity
                : (typeof self._pmndrsLensFlareBaseIntensity === 'number' && self._pmndrsLensFlareBaseIntensity > 0
                    ? self._pmndrsLensFlareBaseIntensity
                    : (self.pmndrsLensFlareEffect.intensity || 0.005));
            self.pmndrsLensFlareEffect._vrodosBaseIntensity = baseIntensity;
            self._pmndrsLensFlareBaseIntensity = baseIntensity;
            self._pmndrsLensFlareSceneOcclusionFactor = factor;
            const cloudFactor = typeof self._pmndrsLensFlareCloudFactor === 'number'
                ? self._pmndrsLensFlareCloudFactor
                : 1;
            self.pmndrsLensFlareEffect.intensity = baseIntensity * factor * cloudFactor;
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
        clearPmndrsCloudSunDiskScreenOverlay(self);
        self._pmndrsSunDirection = null;
        self._pmndrsSunDistance = null;
        self._pmndrsSunSpriteActive = false;
        self._pmndrsCloudSunDiskTakramPhaseActive = false;
        self._pmndrsCloudSunDiskTakramPhaseNativeHidden = false;
        self._pmndrsCloudSunDiskSpriteActive = false;
        self._pmndrsCloudSunDiskSpriteVisibility = 1;
        self._pmndrsCloudSunDiskSpriteOpacity = 1;
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
        const sunIntensityScale = Number.isFinite(opts.sunIntensityScale) ? Math.max(0.1, Math.min(3, opts.sunIntensityScale)) : 1;
        sprite.material.color.set(cfg.color).multiplyScalar((cfg.intensity || (opts.atmosphere ? 5.5 : 4.0)) * sunIntensityScale);
        sprite.material.opacity = Number.isFinite(opts.sunOpacity) ? clamp01(opts.sunOpacity) : 1;
        sprite.material.transparent = true;
        if (hazeSprite && hazeSprite.material) {
            if (opts.atmosphere && !opts.cloudSunDiskSprite && cfg.hazeScale > 0 && cfg.hazeIntensity > 0) {
                hazeSprite.visible = true;
                hazeSprite.scale.set(cfg.hazeScale, cfg.hazeScale, 1);
                hazeSprite.material.color.set('#ffd6a4').multiplyScalar(cfg.hazeIntensity);
                hazeSprite.material.opacity = 1;
            } else {
                hazeSprite.visible = false;
                hazeSprite.material.opacity = 0;
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
                if (!this._pmndrsCloudSunDiskSpriteActive) {
                    clearPmndrsHorizonSun(this);
                    this._pmndrsSunSpriteActive = false;
                }
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
        const castShadow = 'false';

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
    H.computePmndrsCloudSunOcclusionFactors = computePmndrsCloudSunOcclusionFactors;
    H.syncPmndrsSkySunDiskCloudAttenuation = function (config) {
        const atmosphereConfig = config || (typeof this.getPmndrsAtmosphereConfig === 'function'
            ? this.getPmndrsAtmosphereConfig()
            : null);
        const smoothingMs = getPmndrsRuntimeLightingSmoothingMs(atmosphereConfig);
        const indirectSmoothingMs = getPmndrsRuntimeIndirectLightingSmoothingMs(atmosphereConfig);
        const cloudSunOcclusion = getPmndrsCloudSunOcclusionState(this, atmosphereConfig, smoothingMs, indirectSmoothingMs);
        return syncPmndrsSkySunDiskCloudAttenuation(this, atmosphereConfig, cloudSunOcclusion, smoothingMs);
    };
    H.syncPmndrsCloudShadowLengthToSkyMaterial = function (shadowLength, reason) {
        return syncPmndrsCloudShadowLengthToSkyMaterial(this, shadowLength, reason);
    };
    H.usesVrTakramDirectSkyCalibration = function () {
        return shouldUseVrTakramDirectSkyCalibration(this);
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
    Object.assign(H, shadowRuntime.helpers);
    const celestialLighting = VRODOSMaster.CelestialLighting.create({
        shadow: shadowRuntime,
        host: {
            lerpNumber,
            lerpPmndrsColor,
            smoothstepNumber,
            normalizePmndrsStarsEnabled,
            getPmndrsCloudMoonStarRecovery,
            readPmndrsAtmosphereNumber,
            PMNDRS_DAY_NIGHT_CYCLE_DEFAULT_MINUTES,
            PMNDRS_DAY_NIGHT_CYCLE_MIN_MINUTES,
            shouldUsePmndrsTakramHorizonPath,
            shouldUseVrTakramLightsOnly,
            scheduleVrTakramLightsOnlyHorizonVisualSync,
            logPmndrsHorizonDiagnostic,
            ensurePmndrsAtmosphereSky,
            shouldUseVrTakramVisibleSky,
            isVrTakramVisibleSkyReadyForHandoff,
            completeVrTakramVisibleSkyHandoff,
            setPmndrsAtmosphereSkyVisibility,
            getPresentedPmndrsAtmosphereConfig,
            getPmndrsCloudSunOcclusionState,
            getPmndrsCloudMoonOcclusionState,
            syncPmndrsSkySunDiskCloudAttenuation,
            getPmndrsCloudSunShadowRadiusScale,
            getPmndrsCloudSunShadowIntensityFactor,
            readPmndrsAtmosphereBool
        }
    });
    const {
        PMNDRS_STARS_NIGHT_INTENSITY,
        getPmndrsHorizonHelperLightDefaults,
        getResolvedPmndrsSkyTimePreset,
        getPmndrsSunDirectLightVisibility,
        getPmndrsMoonDirectLightVisibility,
        getPmndrsStarsIntensity,
        getPmndrsNightReflectionIntensityScale,
        getPmndrsHorizonHelperLightConfig,
        getPmndrsTakramPbrFillIntensity,
        getPmndrsRuntimeLightingSmoothingMs,
        getPmndrsRuntimeIndirectLightingSmoothingMs,
        areAFrameDefaultLightsEnabled,
        setAFrameDefaultLightsEnabled,
        ensurePmndrsFallbackHorizonLights,
        syncPresentedTakramLightDirections,
        ensurePmndrsTakramHorizonLights,
        getPmndrsTakramLightSourceCount,
        getPmndrsExposureValue
    } = celestialLighting;
    Object.assign(H, celestialLighting.helpers);
    Object.assign(H, VRODOSMaster.RenderQuality.create({
        shadow: shadowRuntime,
        lighting: celestialLighting,
        host: {
            getThreeToneMappingForPmndrsMode,
            normalizeReflectionOcclusionMode,
            getPmndrsCloudSunOcclusionState,
            getPmndrsCloudMoonOcclusionState
        }
    }));
})();
