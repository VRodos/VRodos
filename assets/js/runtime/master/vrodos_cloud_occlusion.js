/** Cloud attenuation of sun/moon lighting, shadows, reflections, and star washout.
 * Diagnostics and smoothing state remain on the existing scene component.
 */
(function () {
    VRODOSMaster.CloudOcclusion = Object.freeze({ create });

    function create({
        clamp01,
        smoothstepNumber,
        lerpNumber,
        hasPmndrsDebugFlag,
        logPmndrsCloudSunOcclusionDiagnostic,
        getPmndrsSunDirectLightVisibility,
        getPmndrsMoonDirectLightVisibility
    }) {
        const smoothPmndrsRuntimeLightValue = VRODOSMaster.LightSmoothing.value;
        const PMNDRS_CLOUD_SUN_OCCLUSION_COVERAGE_START = 0.22;
        const PMNDRS_CLOUD_SUN_OCCLUSION_COVERAGE_FULL = 0.82;
        const PMNDRS_CLOUD_SUN_DISK_OCCLUSION_START = 0.18;
        const PMNDRS_CLOUD_SUN_DISK_OCCLUSION_FULL = 0.78;
        const PMNDRS_CLOUD_SKY_SUN_DISK_VISIBILITY_MIN = 0.025;
        const PMNDRS_CLOUD_SUN_OCCLUSION_DIRECT_MIN = 0.18;
        const PMNDRS_CLOUD_SUN_OCCLUSION_SKY_MIN = 0.56;
        const PMNDRS_CLOUD_SUN_OCCLUSION_FILL_MIN = 0.66;
        const PMNDRS_CLOUD_SUN_OCCLUSION_AMBIENT_MIN = 0.78;
        const PMNDRS_CLOUD_SUN_OCCLUSION_REFLECTION_MIN = 0.68;
        const PMNDRS_CLOUD_SUN_SHADOW_INTENSITY_MIN = 0.7;
        const PMNDRS_CLOUD_SUN_SHADOW_RADIUS_BOOST = 0.85;
        const PMNDRS_CLOUD_SUN_OCCLUSION_STATIC_SMOOTH_MS = 900;
        const PMNDRS_CLOUD_SUN_OCCLUSION_DAY_NIGHT_MIN_SMOOTH_MS = 1800;
        const PMNDRS_CLOUD_MOON_OCCLUSION_COVERAGE_START = 0.22;
        const PMNDRS_CLOUD_MOON_OCCLUSION_COVERAGE_FULL = 0.86;
        const PMNDRS_CLOUD_MOON_DISK_OCCLUSION_START = 0.14;
        const PMNDRS_CLOUD_MOON_DISK_OCCLUSION_FULL = 0.82;
        const PMNDRS_CLOUD_MOON_DIRECT_MIN = 0.12;
        const PMNDRS_CLOUD_MOON_INDIRECT_MIN = 0.58;
        const PMNDRS_CLOUD_MOON_REFLECTION_MIN = 0.62;
        const PMNDRS_CLOUD_MOON_SHADOW_INTENSITY_MIN = 0.58;
        const PMNDRS_CLOUD_MOON_SHADOW_RADIUS_BOOST = 1.1;
        const PMNDRS_CLOUD_MOON_DISC_VISIBILITY_MIN = 0.035;

        function roundPmndrsCloudSunOcclusionDiagnostic(value) {
            return Number.isFinite(value) ? Number(value.toFixed(4)) : null;
        }

        function computePmndrsCloudSunOcclusionFactors(options) {
            const opts = options || {};
            const authoredCoverage = Number.isFinite(opts.authoredCoverage) ? opts.authoredCoverage : 0;
            const diskOcclusion = Number.isFinite(opts.diskOcclusion) ? opts.diskOcclusion : 0;
            const sunElevationFactor = Number.isFinite(opts.sunElevationFactor) ? clamp01(opts.sunElevationFactor) : 0;
            const coverageStrength = smoothstepNumber(
                PMNDRS_CLOUD_SUN_OCCLUSION_COVERAGE_START,
                PMNDRS_CLOUD_SUN_OCCLUSION_COVERAGE_FULL,
                authoredCoverage
            );
            const diskStrength = smoothstepNumber(
                PMNDRS_CLOUD_SUN_DISK_OCCLUSION_START,
                PMNDRS_CLOUD_SUN_DISK_OCCLUSION_FULL,
                diskOcclusion
            );
            const targetStrength = clamp01(Math.max(coverageStrength, diskStrength) * sunElevationFactor);
            const skySunDiskVisibility = sunElevationFactor > 0.001
                ? Math.max(
                    PMNDRS_CLOUD_SKY_SUN_DISK_VISIBILITY_MIN,
                    1 - ((1 - PMNDRS_CLOUD_SKY_SUN_DISK_VISIBILITY_MIN) * diskStrength)
                )
                : 1;

            return {
                coverageStrength,
                diskStrength,
                targetStrength,
                directFactor: 1 - ((1 - PMNDRS_CLOUD_SUN_OCCLUSION_DIRECT_MIN) * targetStrength),
                skyFactor: 1 - ((1 - PMNDRS_CLOUD_SUN_OCCLUSION_SKY_MIN) * targetStrength),
                fillFactor: 1 - ((1 - PMNDRS_CLOUD_SUN_OCCLUSION_FILL_MIN) * targetStrength),
                ambientFactor: 1 - ((1 - PMNDRS_CLOUD_SUN_OCCLUSION_AMBIENT_MIN) * targetStrength),
                reflectionFactor: 1 - ((1 - PMNDRS_CLOUD_SUN_OCCLUSION_REFLECTION_MIN) * targetStrength),
                shadowIntensityFactor: 1 - ((1 - PMNDRS_CLOUD_SUN_SHADOW_INTENSITY_MIN) * targetStrength),
                shadowRadiusScale: 1 + (targetStrength * PMNDRS_CLOUD_SUN_SHADOW_RADIUS_BOOST),
                skySunDiskVisibility
            };
        }

        function publishPmndrsCloudSunOcclusionDiagnostics(self, state) {
            if (!self || !state) {
                return state || null;
            }

            const diagnostics = self._pmndrsCloudsDiagnostics || {};
            Object.assign(diagnostics, {
                cloudSunOcclusionEnabled: Boolean(state.enabled),
                cloudSunOcclusionStrength: roundPmndrsCloudSunOcclusionDiagnostic(state.strength),
                cloudSunDirectFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.directFactor),
                cloudSkyFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.skyFactor),
                cloudFillFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.fillFactor),
                cloudAmbientFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.ambientFactor),
                cloudReflectionFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.reflectionFactor),
                cloudSunShadowIntensityFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.shadowIntensityFactor),
                cloudSunShadowRadiusScale: roundPmndrsCloudSunOcclusionDiagnostic(state.shadowRadiusScale),
                cloudSkySunDiskVisibility: roundPmndrsCloudSunOcclusionDiagnostic(state.skySunDiskVisibility),
                cloudSunElevationFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.sunElevationFactor),
                cloudSunOcclusionReason: state.reason || '',
                cloudSunCoverageStrength: roundPmndrsCloudSunOcclusionDiagnostic(state.coverageStrength),
                cloudSunDiskStrength: roundPmndrsCloudSunOcclusionDiagnostic(state.diskStrength),
                cloudSunOcclusionTargetStrength: roundPmndrsCloudSunOcclusionDiagnostic(state.targetStrength)
            });
            self._pmndrsCloudsDiagnostics = diagnostics;
            self.pmndrsCloudsDiagnostics = diagnostics;
            self._pmndrsCloudSunOcclusionState = diagnostics;
            logPmndrsCloudSunOcclusionDiagnostic(self, diagnostics);
            return diagnostics;
        }

        function getPmndrsCloudSunShadowRadiusScale(cloudSunOcclusion) {
            const strength = cloudSunOcclusion && typeof cloudSunOcclusion.cloudSunOcclusionStrength === 'number'
                ? clamp01(cloudSunOcclusion.cloudSunOcclusionStrength)
                : 0;
            return 1 + (strength * PMNDRS_CLOUD_SUN_SHADOW_RADIUS_BOOST);
        }

        function getPmndrsCloudSunShadowIntensityFactor(cloudSunOcclusion) {
            if (cloudSunOcclusion && typeof cloudSunOcclusion.cloudSunShadowIntensityFactor === 'number') {
                return clamp01(cloudSunOcclusion.cloudSunShadowIntensityFactor);
            }
            const strength = cloudSunOcclusion && typeof cloudSunOcclusion.cloudSunOcclusionStrength === 'number'
                ? clamp01(cloudSunOcclusion.cloudSunOcclusionStrength)
                : 0;
            return 1 - ((1 - PMNDRS_CLOUD_SUN_SHADOW_INTENSITY_MIN) * strength);
        }

        function getPmndrsCloudSunOcclusionSmoothingMs(config, directSmoothingMs, indirectSmoothingMs) {
            if (!(config && config.dayNightCycleEnabled)) {
                return PMNDRS_CLOUD_SUN_OCCLUSION_STATIC_SMOOTH_MS;
            }

            return Math.max(
                PMNDRS_CLOUD_SUN_OCCLUSION_DAY_NIGHT_MIN_SMOOTH_MS,
                directSmoothingMs || 0,
                indirectSmoothingMs || 0
            );
        }

        function getPmndrsCloudSunOcclusionState(self, config, directSmoothingMs, indirectSmoothingMs) {
            const diagnostics = self && self._pmndrsCloudsDiagnostics ? self._pmndrsCloudsDiagnostics : null;
            const effectiveCoverage = diagnostics && typeof diagnostics.effectiveCoverage === 'number'
                ? diagnostics.effectiveCoverage
                : null;
            const authoredCoverage = diagnostics && typeof diagnostics.authoredCoverage === 'number'
                ? diagnostics.authoredCoverage
                : effectiveCoverage;
            const diskOcclusion = diagnostics && typeof diagnostics.cloudSunDiskOcclusion === 'number'
                ? diagnostics.cloudSunDiskOcclusion
                : 0;
            const cloudsActive = Boolean(diagnostics && diagnostics.cloudsActive === true);
            const sunElevationFactor = getPmndrsSunDirectLightVisibility(config);
            const defaultState = {
                enabled: false,
                strength: 0,
                directFactor: 1,
                skyFactor: 1,
                fillFactor: 1,
                ambientFactor: 1,
                reflectionFactor: 1,
                shadowIntensityFactor: 1,
                shadowRadiusScale: 1,
                skySunDiskVisibility: 1,
                sunElevationFactor,
                reason: 'not-evaluated',
                coverageStrength: 0,
                diskStrength: 0,
                targetStrength: 0
            };

            if (!self || !cloudsActive || !Number.isFinite(authoredCoverage) || sunElevationFactor <= 0.001) {
                if (self && self._pmndrsRuntimeLightSmoothValues) {
                    self._pmndrsRuntimeLightSmoothValues.takramCloudSunOcclusionStrength = 0;
                }
                if (!self) {
                    defaultState.reason = 'no-runtime';
                } else if (!cloudsActive) {
                    defaultState.reason = 'clouds-inactive';
                } else if (!Number.isFinite(authoredCoverage)) {
                    defaultState.reason = 'invalid-coverage';
                } else if (sunElevationFactor <= 0.001) {
                    defaultState.reason = 'sun-below-horizon';
                }
                return publishPmndrsCloudSunOcclusionDiagnostics(self, defaultState);
            }

            const factors = computePmndrsCloudSunOcclusionFactors({
                authoredCoverage,
                diskOcclusion,
                sunElevationFactor
            });
            const smoothingMs = getPmndrsCloudSunOcclusionSmoothingMs(config, directSmoothingMs, indirectSmoothingMs);
            const currentStrength = self._pmndrsCloudSunOcclusionState &&
                typeof self._pmndrsCloudSunOcclusionState.cloudSunOcclusionStrength === 'number'
                ? self._pmndrsCloudSunOcclusionState.cloudSunOcclusionStrength
                : factors.targetStrength;
            const strength = smoothPmndrsRuntimeLightValue(
                self,
                'takramCloudSunOcclusionStrength',
                factors.targetStrength,
                smoothingMs,
                currentStrength
            );
            const state = {
                enabled: strength > 0.0001,
                strength,
                directFactor: 1 - ((1 - PMNDRS_CLOUD_SUN_OCCLUSION_DIRECT_MIN) * strength),
                skyFactor: 1 - ((1 - PMNDRS_CLOUD_SUN_OCCLUSION_SKY_MIN) * strength),
                fillFactor: 1 - ((1 - PMNDRS_CLOUD_SUN_OCCLUSION_FILL_MIN) * strength),
                ambientFactor: 1 - ((1 - PMNDRS_CLOUD_SUN_OCCLUSION_AMBIENT_MIN) * strength),
                reflectionFactor: 1 - ((1 - PMNDRS_CLOUD_SUN_OCCLUSION_REFLECTION_MIN) * strength),
                shadowIntensityFactor: 1 - ((1 - PMNDRS_CLOUD_SUN_SHADOW_INTENSITY_MIN) * strength),
                shadowRadiusScale: 1 + (strength * PMNDRS_CLOUD_SUN_SHADOW_RADIUS_BOOST),
                skySunDiskVisibility: factors.skySunDiskVisibility,
                sunElevationFactor,
                reason: factors.diskStrength > factors.coverageStrength ? 'active-sun-disk' : 'active-coverage',
                coverageStrength: factors.coverageStrength,
                diskStrength: factors.diskStrength,
                targetStrength: factors.targetStrength
            };

            return publishPmndrsCloudSunOcclusionDiagnostics(self, state);
        }

        function computePmndrsCloudMoonOcclusionFactors(options) {
            const opts = options || {};
            const authoredCoverage = clamp01(Number(opts.authoredCoverage) || 0);
            const diskOcclusion = clamp01(Number(opts.diskOcclusion) || 0);
            const moonVisibility = clamp01(Number(opts.moonVisibility) || 0);
            const moonIllumination = clamp01(Number(opts.moonIllumination) || 0);
            const nightFactor = clamp01(Number(opts.nightFactor) || 0);
            const coverageStrength = smoothstepNumber(
                PMNDRS_CLOUD_MOON_OCCLUSION_COVERAGE_START,
                PMNDRS_CLOUD_MOON_OCCLUSION_COVERAGE_FULL,
                authoredCoverage
            );
            const diskStrength = smoothstepNumber(
                PMNDRS_CLOUD_MOON_DISK_OCCLUSION_START,
                PMNDRS_CLOUD_MOON_DISK_OCCLUSION_FULL,
                diskOcclusion
            );
            const sourceFactor = moonVisibility * moonIllumination * nightFactor;
            const targetStrength = clamp01(Math.max(coverageStrength, diskStrength) * sourceFactor);
            const discStrength = clamp01(Math.max(diskStrength, coverageStrength * 0.32) * sourceFactor);

            return {
                coverageStrength,
                diskStrength,
                targetStrength,
                directFactor: 1 - ((1 - PMNDRS_CLOUD_MOON_DIRECT_MIN) * targetStrength),
                indirectFactor: 1 - ((1 - PMNDRS_CLOUD_MOON_INDIRECT_MIN) * targetStrength),
                reflectionFactor: 1 - ((1 - PMNDRS_CLOUD_MOON_REFLECTION_MIN) * targetStrength),
                shadowIntensityFactor: 1 - ((1 - PMNDRS_CLOUD_MOON_SHADOW_INTENSITY_MIN) * targetStrength),
                shadowRadiusScale: 1 + (targetStrength * PMNDRS_CLOUD_MOON_SHADOW_RADIUS_BOOST),
                discVisibility: Math.max(
                    PMNDRS_CLOUD_MOON_DISC_VISIBILITY_MIN,
                    1 - ((1 - PMNDRS_CLOUD_MOON_DISC_VISIBILITY_MIN) * discStrength)
                ),
                sourceFactor
            };
        }

        function publishPmndrsCloudMoonOcclusionDiagnostics(self, state) {
            if (!self || !state) {
                return state || null;
            }
            const diagnostics = self._pmndrsCloudsDiagnostics || {};
            Object.assign(diagnostics, {
                cloudMoonOcclusionEnabled: Boolean(state.enabled),
                cloudMoonOcclusionStrength: roundPmndrsCloudSunOcclusionDiagnostic(state.strength),
                cloudMoonDirectFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.directFactor),
                cloudMoonIndirectFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.indirectFactor),
                cloudMoonReflectionFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.reflectionFactor),
                cloudMoonShadowIntensityFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.shadowIntensityFactor),
                cloudMoonShadowRadiusScale: roundPmndrsCloudSunOcclusionDiagnostic(state.shadowRadiusScale),
                cloudMoonDiscVisibility: roundPmndrsCloudSunOcclusionDiagnostic(state.discVisibility),
                cloudMoonVisibilityFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.moonVisibility),
                cloudMoonIlluminationFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.moonIllumination),
                cloudMoonNightFactor: roundPmndrsCloudSunOcclusionDiagnostic(state.nightFactor),
                cloudMoonCoverageStrength: roundPmndrsCloudSunOcclusionDiagnostic(state.coverageStrength),
                cloudMoonDiskStrength: roundPmndrsCloudSunOcclusionDiagnostic(state.diskStrength),
                cloudMoonOcclusionTargetStrength: roundPmndrsCloudSunOcclusionDiagnostic(state.targetStrength),
                cloudMoonOcclusionReason: state.reason || ''
            });
            self._pmndrsCloudsDiagnostics = diagnostics;
            self.pmndrsCloudsDiagnostics = diagnostics;
            self._pmndrsCloudMoonOcclusionState = diagnostics;
            return diagnostics;
        }

        function getPmndrsCloudMoonOcclusionState(self, config, smoothingMs) {
            const diagnostics = self && self._pmndrsCloudsDiagnostics ? self._pmndrsCloudsDiagnostics : null;
            const authoredCoverage = diagnostics && typeof diagnostics.authoredCoverage === 'number'
                ? diagnostics.authoredCoverage
                : (diagnostics && typeof diagnostics.effectiveCoverage === 'number' ? diagnostics.effectiveCoverage : null);
            const diskOcclusion = diagnostics && typeof diagnostics.cloudMoonDiskOcclusion === 'number'
                ? diagnostics.cloudMoonDiskOcclusion
                : 0;
            const moonVisibility = getPmndrsMoonDirectLightVisibility(config);
            const moonIllumination = config && typeof config.moonIllumination === 'number'
                ? clamp01(config.moonIllumination)
                : 1;
            const sunElevation = config && typeof config.sunElevationDeg === 'number' ? config.sunElevationDeg : 62;
            const nightFactor = 1 - smoothstepNumber(-8, -3, sunElevation);
            const defaultState = {
                enabled: false,
                strength: 0,
                directFactor: 1,
                indirectFactor: 1,
                reflectionFactor: 1,
                shadowIntensityFactor: 1,
                shadowRadiusScale: 1,
                discVisibility: 1,
                moonVisibility,
                moonIllumination,
                nightFactor,
                reason: 'not-evaluated',
                coverageStrength: 0,
                diskStrength: 0,
                targetStrength: 0
            };

            if (!self || !config || hasPmndrsDebugFlag('disablePmndrsCloudMoonInteraction', 'vrodos_debug_disable_pmndrs_cloud_moon_interaction') ||
                !(diagnostics && diagnostics.cloudsActive === true) || config.moonEnabled === false ||
                !Number.isFinite(authoredCoverage) || moonVisibility <= 0.001 || moonIllumination <= 0.001 || nightFactor <= 0.001) {
                if (self && self._pmndrsRuntimeLightSmoothValues) {
                    self._pmndrsRuntimeLightSmoothValues.takramCloudMoonOcclusionStrength = 0;
                }
                if (!self) {
                    defaultState.reason = 'no-runtime';
                } else if (!config) {
                    defaultState.reason = 'no-config';
                } else if (hasPmndrsDebugFlag('disablePmndrsCloudMoonInteraction', 'vrodos_debug_disable_pmndrs_cloud_moon_interaction')) {
                    defaultState.reason = 'debug-disabled';
                } else if (!(diagnostics && diagnostics.cloudsActive === true)) {
                    defaultState.reason = 'clouds-inactive';
                } else if (config.moonEnabled === false) {
                    defaultState.reason = 'moon-disabled';
                } else if (!Number.isFinite(authoredCoverage)) {
                    defaultState.reason = 'invalid-coverage';
                } else if (moonVisibility <= 0.001) {
                    defaultState.reason = 'moon-below-horizon';
                } else if (moonIllumination <= 0.001) {
                    defaultState.reason = 'moon-unilluminated';
                } else {
                    defaultState.reason = 'not-night';
                }
                return publishPmndrsCloudMoonOcclusionDiagnostics(self, defaultState);
            }

            const factors = computePmndrsCloudMoonOcclusionFactors({
                authoredCoverage,
                diskOcclusion,
                moonVisibility,
                moonIllumination,
                nightFactor
            });
            const currentStrength = self._pmndrsCloudMoonOcclusionState &&
                typeof self._pmndrsCloudMoonOcclusionState.cloudMoonOcclusionStrength === 'number'
                ? self._pmndrsCloudMoonOcclusionState.cloudMoonOcclusionStrength
                : factors.targetStrength;
            const strength = smoothPmndrsRuntimeLightValue(
                self,
                'takramCloudMoonOcclusionStrength',
                factors.targetStrength,
                Math.max(420, smoothingMs || 0),
                currentStrength
            );
            const state = {
                enabled: strength > 0.0001,
                strength,
                directFactor: 1 - ((1 - PMNDRS_CLOUD_MOON_DIRECT_MIN) * strength),
                indirectFactor: 1 - ((1 - PMNDRS_CLOUD_MOON_INDIRECT_MIN) * strength),
                reflectionFactor: 1 - ((1 - PMNDRS_CLOUD_MOON_REFLECTION_MIN) * strength),
                shadowIntensityFactor: 1 - ((1 - PMNDRS_CLOUD_MOON_SHADOW_INTENSITY_MIN) * strength),
                shadowRadiusScale: 1 + (strength * PMNDRS_CLOUD_MOON_SHADOW_RADIUS_BOOST),
                discVisibility: factors.discVisibility,
                moonVisibility,
                moonIllumination,
                nightFactor,
                reason: factors.diskStrength > factors.coverageStrength ? 'active-moon-disk' : 'active-coverage',
                coverageStrength: factors.coverageStrength,
                diskStrength: factors.diskStrength,
                targetStrength: factors.targetStrength
            };
            return publishPmndrsCloudMoonOcclusionDiagnostics(self, state);
        }

        function getPmndrsCloudMoonStarRecovery(self, config, starsIntensity) {
            const state = self && self._pmndrsCloudMoonOcclusionState ? self._pmndrsCloudMoonOcclusionState : null;
            const strength = state && typeof state.cloudMoonOcclusionStrength === 'number'
                ? clamp01(state.cloudMoonOcclusionStrength)
                : 0;
            if (strength <= 0.001 || starsIntensity <= 0) {
                if (self && self._pmndrsCloudsDiagnostics) {
                    self._pmndrsCloudsDiagnostics.cloudMoonStarRecoveryFactor = 0;
                    self._pmndrsCloudsDiagnostics.cloudMoonRecoveredStarsIntensity =
                        roundPmndrsCloudSunOcclusionDiagnostic(starsIntensity);
                }
                return starsIntensity;
            }
            const moonY = config && config.localMoonDirection && typeof config.localMoonDirection.y === 'number'
                ? config.localMoonDirection.y
                : -1;
            const moonVisibility = config && config.moonEnabled !== false ? smoothstepNumber(-0.04, 0.38, moonY) : 0;
            const moonIllumination = config && typeof config.moonIllumination === 'number' ? clamp01(config.moonIllumination) : 1;
            const washout = clamp01(moonVisibility * moonIllumination * 0.35);
            const unwashedIntensity = starsIntensity / Math.max(0.65, 1 - washout);
            const recovery = strength * 0.8;
            const recoveredIntensity = lerpNumber(starsIntensity, unwashedIntensity, recovery);
            if (self._pmndrsCloudsDiagnostics) {
                self._pmndrsCloudsDiagnostics.cloudMoonStarRecoveryFactor = roundPmndrsCloudSunOcclusionDiagnostic(recovery);
                self._pmndrsCloudsDiagnostics.cloudMoonRecoveredStarsIntensity = roundPmndrsCloudSunOcclusionDiagnostic(recoveredIntensity);
            }
            return recoveredIntensity;
        }

        return {
            roundPmndrsCloudSunOcclusionDiagnostic,
            computePmndrsCloudSunOcclusionFactors,
            getPmndrsCloudSunShadowRadiusScale,
            getPmndrsCloudSunShadowIntensityFactor,
            getPmndrsCloudSunOcclusionState,
            getPmndrsCloudMoonOcclusionState,
            getPmndrsCloudMoonStarRecovery,
            PMNDRS_CLOUD_SUN_OCCLUSION_STATIC_SMOOTH_MS
        };
    }
})();
