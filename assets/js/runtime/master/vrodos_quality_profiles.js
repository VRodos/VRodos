/**
 * VRodos Quality Profile Helpers
 * Extracted from vrodos_scene_settings.component.js
 */
/* global VRODOSMaster */
(function () {
    const H = VRODOSMaster.SceneSettingsHelpers = VRODOSMaster.SceneSettingsHelpers || {};
    const { createPmndrsSunTexture, createPmndrsSunHazeTexture, getPmndrsHorizonSunConfig } = VRODOSMaster.SunSprite;
    const { ensureVrTakramLightsOnlyGradientSky, removeVrTakramLightsOnlyGradientSky } = VRODOSMaster.GradientSky;
    const TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS = 0.004675;

    const PMNDRS_DAY_NIGHT_CYCLE_DEFAULT_MINUTES = 1;
    const PMNDRS_DAY_NIGHT_CYCLE_MIN_MINUTES = VRODOSMaster.CelestialClock.minDurationMinutes;
    const PMNDRS_DAY_NIGHT_CYCLE_MAX_MINUTES = 1440;

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
        getTerrainSafeContactShadowSettings,
        isPmndrsTakramHorizonRequested,
        vectorToRoundedArray,
        getShadowDiagnosticState
    } = shadowRuntime;
    const applyPmndrsSunOcclusion = VRODOSMaster.SunOcclusion.create({
        shadow: shadowRuntime,
        setPmndrsSkyMaterialNativeSun: (...args) => setPmndrsSkyMaterialNativeSun(...args)
    }).apply;
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

    function getRuntimeNowMs() {
        return typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
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

    function getAtmosphereRuntime(self) {
        const owner = self && self.el && self.el.components ? self.el.components['vrodos-atmosphere'] : null;
        if (!owner || owner.removed) return null;
        owner.bindSettings(self, removePmndrsAtmosphereSky);
        return owner;
    }

    function scheduleAtmosphereVisualRefresh(self, callback) {
        const owner = getAtmosphereRuntime(self);
        if (owner) owner.scheduleVisualRefresh(callback);
        else callback();
    }

    H.ensurePmndrsAtmosphereResources = function () {
        const owner = getAtmosphereRuntime(this);
        return owner ? owner.ensureResources(getPmndrsAtmosphereResourceProfile(this, this.el.renderer)) : null;
    };

    H.disposePmndrsAtmosphere = function () {
        if (this.atmosphereRuntime) this.atmosphereRuntime.disposeResources();
    };

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
            scheduleVrTakramLightsOnlyHorizonVisualSync: (...args) => scheduleVrTakramLightsOnlyHorizonVisualSync(...args),
            logPmndrsHorizonDiagnostic,
            ensurePmndrsAtmosphereSky: (...args) => ensurePmndrsAtmosphereSky(...args),
            shouldUseVrTakramVisibleSky,
            isVrTakramVisibleSkyReadyForHandoff: (...args) => isVrTakramVisibleSkyReadyForHandoff(...args),
            completeVrTakramVisibleSkyHandoff: (...args) => completeVrTakramVisibleSkyHandoff(...args),
            setPmndrsAtmosphereSkyVisibility: (...args) => setPmndrsAtmosphereSkyVisibility(...args),
            getPresentedPmndrsAtmosphereConfig,
            getPmndrsCloudSunOcclusionState,
            getPmndrsCloudMoonOcclusionState,
            syncPmndrsSkySunDiskCloudAttenuation: (...args) => syncPmndrsSkySunDiskCloudAttenuation(...args),
            getPmndrsCloudSunShadowRadiusScale,
            getPmndrsCloudSunShadowIntensityFactor,
            readPmndrsAtmosphereBool
        }
    });
    const {
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

    // Visual callbacks above resolve lazily; all subsystem interfaces are ready here.
    const {
        syncPmndrsCloudShadowLengthToSkyMaterial,
        removePmndrsAtmosphereSky,
        setPmndrsAtmosphereSkyVisibility,
        isPmndrsAtmosphereSkyVisible,
        schedulePmndrsHorizonEnvironmentCleanup,
        hidePmndrsHorizonEnvironmentVisuals,
        isVrTakramVisibleSkyReadyForHandoff,
        completeVrTakramVisibleSkyHandoff,
        syncVrTakramLightsOnlyHorizonVisuals,
        scheduleVrTakramLightsOnlyHorizonVisualSync,
        removeLegacySunSkyEntitiesForPmndrs,
        setPmndrsSkyMaterialNativeSun,
        syncPmndrsSkySunDiskCloudAttenuation,
        ensurePmndrsAtmosphereSky,
        showPmndrsAtmosphereSkyForSceneProbe,
        hidePmndrsAtmosphereSky,
        clearPmndrsHorizonSun,
        shouldUsePmndrsXrAtmosphereSunFallback,
        ensurePmndrsHorizonSun
    } = VRODOSMaster.AtmosphereVisuals.create({
        lighting: celestialLighting,
        cloud: {
            roundPmndrsCloudSunOcclusionDiagnostic,
            getPmndrsCloudSunOcclusionState,
            getPmndrsCloudMoonOcclusionState,
            PMNDRS_CLOUD_SUN_OCCLUSION_STATIC_SMOOTH_MS
        },
        shadow: {
            vectorToRoundedArray,
            applyPmndrsSunOcclusion
        },
        host: {
            scheduleAtmosphereVisualRefresh,
            createPmndrsSunTexture,
            createPmndrsSunHazeTexture,
            getPmndrsHorizonSunConfig,
            ensureVrTakramLightsOnlyGradientSky,
            removeVrTakramLightsOnlyGradientSky,
            smoothPmndrsRuntimeLightValue,
            getPmndrsResolvedGeospatialFrame,
            clamp01,
            readPmndrsAtmosphereBool,
            normalizePmndrsColor,
            hasPmndrsDebugFlag,
            readPmndrsDebugNumber,
            getRuntimeNowMs,
            getPmndrsEffectiveGroundAlbedo,
            shouldUseVrTakramVisibleSky,
            shouldUseVrTakramDirectSkyCalibration,
            shouldUsePmndrsTakramHorizonPath,
            parseLightPositionVector,
            getImmersivePresentedSunDirection,
            getPresentedPmndrsAtmosphereConfig
        }
    });
})();
