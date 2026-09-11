/** Celestial lighting profiles, exposure, helper lights, and Takram light synchronization.
 * Existing component state and resource lifecycle remain on the host.
 */
(function () {
    VRODOSMaster.CelestialLighting = Object.freeze({ create });

    function create({ shadow, host }) {
        const H = {};
        const RuntimeSettings = VRODOSMaster.RuntimeSettings;
        const smoothPmndrsRuntimeLightValue = VRODOSMaster.LightSmoothing.value;
        const smoothPmndrsRuntimeLightColor = VRODOSMaster.LightSmoothing.color;
        const ensurePmndrsWorldToEcefMatrix = VRODOSMaster.CelestialCoordinates.applyWorldMatrix;
        const getThreeShadowMapTypeName = VRODOSMaster.ShadowMaps.typeName;
        const runtimeSettingsContract = window.VRODOS_RUNTIME_SETTINGS_CONTRACT;
        const {
            getDirectionalShadowDistanceForScene,
            getPmndrsDayNightShadowRadius,
            schedulePmndrsAtmosphereShadowFit,
            vectorToSignature,
            arePmndrsDayNightCycleDynamicShadowsEnabled,
            getAdaptiveShadowCenter,
            syncPresentedShadowLightTransforms,
            getTerrainSafeContactShadowSettings,
            sanitizePhotorealHelperLightAttributes
        } = shadow;
        const {
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
        } = host;

        const PMNDRS_NIGHT_REFLECTION_INTENSITY_SCALE = 0.36;

        const PMNDRS_NIGHT_MOON_LIGHT_INTENSITY = 0.08;

        const PMNDRS_NIGHT_MOON_LIGHT_COLOR = '#b9c6df';

        const PMNDRS_NIGHT_AUTO_EXPOSURE = 3.4;

        const PMNDRS_DAWN_AUTO_EXPOSURE = 2.2;

        const PMNDRS_STARS_NIGHT_INTENSITY = 6.0;

        const PMNDRS_STARS_DAWN_INTENSITY = 0.35;

        const PMNDRS_SUN_DIRECT_LIGHT_START_Y = 0.0;

        const PMNDRS_SUN_DIRECT_LIGHT_FULL_Y = 0.08;

        const PMNDRS_MOON_DIRECT_LIGHT_START_Y = 0.02;

        const PMNDRS_MOON_DIRECT_LIGHT_FULL_Y = 0.16;

        const PMNDRS_HORIZON_HELPER_LIGHT_DEFAULTS = runtimeSettingsContract.horizonHelperLightPresets;

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
                keyColor: PMNDRS_NIGHT_MOON_LIGHT_COLOR,
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
            const moonIllumination = typeof config.moonIllumination === 'number' ? config.moonIllumination : 1;
            const illuminatedMoonVisibility = moonVisibility * moonIllumination;
            const nightAmount = 1 - smoothstepNumber(-14, -4, sunElevation);
            const moonWeight = nightAmount * illuminatedMoonVisibility;
            const moonKeyBlend = smoothstepNumber(0.35, 0.62, moonWeight) *
                (1 - smoothstepNumber(-4, -2, sunElevation));
            const useMoonDirection = moonKeyBlend > 0.5;

            profile.moonLightIntensity = PMNDRS_NIGHT_MOON_LIGHT_INTENSITY * moonWeight;
            profile.useMoonDirection = useMoonDirection;
            profile.keyColor = lerpPmndrsColor(profile.keyColor, PMNDRS_NIGHT_MOON_LIGHT_COLOR, moonKeyBlend);
            profile.keyIntensity = lerpNumber(
                profile.keyIntensity,
                Math.max(profile.keyIntensity * (0.35 + moonWeight * 0.45), profile.moonLightIntensity),
                moonKeyBlend
            );

            const noMoonDeepNightAmount = (1 - smoothstepNumber(-12, -8, sunElevation)) *
                (1 - smoothstepNumber(0.12, 0.28, illuminatedMoonVisibility));
            profile.keyIntensity *= lerpNumber(1, 0.45, noMoonDeepNightAmount);
            profile.skyLightIntensity *= lerpNumber(1, 0.72, noMoonDeepNightAmount);
            profile.pbrFillIntensity *= lerpNumber(1, 0.70, noMoonDeepNightAmount);
            profile.ambientBounceIntensity *= lerpNumber(1, 0.75, noMoonDeepNightAmount);
            profile.reflectionIntensityScale *= lerpNumber(1, 0.78, noMoonDeepNightAmount);
            profile.starsIntensity *= (1 - illuminatedMoonVisibility * 0.35);
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
            const illumination = typeof config.moonIllumination === 'number' ? config.moonIllumination : 1;
            return isPmndrsPresetTimeNight(config) ? PMNDRS_NIGHT_MOON_LIGHT_INTENSITY * directVisibility * illumination : 0;
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

        function getPmndrsStarsIntensity(config, self) {
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
                    return getPmndrsCloudMoonStarRecovery(
                        self,
                        config,
                        Math.max(calibratedProfile.starsIntensity, config.sunElevationDeg < 0 ? PMNDRS_STARS_DAWN_INTENSITY : 0)
                    );
                }
                return getPmndrsCloudMoonStarRecovery(self, config, calibratedProfile.starsIntensity);
            }
            if (isPmndrsPresetTimeNight(config)) {
                return getPmndrsCloudMoonStarRecovery(self, config, PMNDRS_STARS_NIGHT_INTENSITY);
            }
            if (isPmndrsLowLightDawn(config)) {
                return mode === 'on'
                    ? getPmndrsCloudMoonStarRecovery(self, config, PMNDRS_STARS_DAWN_INTENSITY)
                    : 0;
            }
            const sunElevation = typeof config.sunElevationDeg === 'number' ? config.sunElevationDeg : null;
            if (mode === 'on' && sunElevation !== null && sunElevation < 0) {
                return getPmndrsCloudMoonStarRecovery(self, config, PMNDRS_STARS_DAWN_INTENSITY);
            }
            return 0;
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
                const moonIllumination = moonEnabled && typeof atmosphereConfig.moonIllumination === 'number'
                    ? atmosphereConfig.moonIllumination
                    : (moonEnabled ? 1 : 0);
                keyColor = moonEnabled ? PMNDRS_NIGHT_MOON_LIGHT_COLOR : '#39425c';
                fillColor = moonEnabled ? '#3f4f78' : '#111827';
                keyIntensity = Math.min(keyIntensity, moonEnabled ? PMNDRS_NIGHT_MOON_LIGHT_INTENSITY * moonIllumination : 0.03);
                fillIntensity = Math.min(fillIntensity, moonEnabled ? 0.08 : 0.015);
                useMoonDirection = moonEnabled && moonIllumination > 0.01;
                directionOwner = useMoonDirection ? 'moon' : 'none';
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
            const shadowMap = effectiveShadowQuality === 'high' ? 2048 : 1024;
            const helperConfig = getPmndrsHorizonHelperLightConfig(self, preset, config);
            const directVisibility = getPmndrsDirectLightVisibility(config, helperConfig.useMoonDirection);
            const keyIntensity = helperConfig.keyIntensity * directVisibility;
            const castShadow = 'false';
            const fallbackFillIntensity = getPmndrsFallbackAmbientFillIntensity(helperConfig, config);
            const keyDirection = helperConfig.useMoonDirection
                ? (config.localMoonDirection || config.moonDirection || config.localSunDirection || config.sunDirection)
                : (config.localSunDirection || config.sunDirection);
            const shadowDistance = getDirectionalShadowDistanceForScene(self, 28);

            self.ensurePhotorealHelperLight(
                'vrodos-pmndrs-horizon-key-light',
                `type: directional; color: ${  helperConfig.keyColor  }; intensity: ${  keyIntensity.toFixed(2)  }; castShadow: ${  castShadow  }; shadowMapWidth: ${  shadowMap  }; shadowMapHeight: ${  shadowMap  }; shadowCameraTop: 28; shadowCameraRight: 28; shadowCameraLeft: -28; shadowCameraBottom: -28; shadowBias: -0.00012; shadowRadius: ${  getPmndrsDayNightShadowRadius(self).toFixed(2)  };`,
                formatVectorPosition(keyDirection, shadowDistance, helperConfig.useMoonDirection ? 0 : 8)
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
            const moonLight = state && state.moonLight ? state.moonLight : null;
            const shadowLight = moonLight && moonLight.castShadow ? moonLight : sunLight;
            const shadow = shadowLight && shadowLight.shadow ? shadowLight.shadow : null;
            const mapSize = shadow && shadow.mapSize
                ? `${shadow.mapSize.x || 0}x${shadow.mapSize.y || 0}`
                : '0x0';
            const direction = shadowLight && shadowLight.sunDirection
                ? shadowLight.sunDirection
                : (shadowLight && shadowLight.position ? shadowLight.position : null);

            if (!shadowLight) {
                return `takram:none|${shadowType}`;
            }

            return [
                `takram:${shadowLight.name || 'celestial'}`,
                shadowLight === moonLight ? 'owner:moon' : 'owner:sun',
                shadowLight.visible ? 'visible' : 'hidden',
                shadowLight.castShadow ? 'cast' : 'no-cast',
                typeof shadowLight.intensity === 'number' ? shadowLight.intensity.toFixed(2) : 'n/a',
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
            const moonLight = state.moonLight || null;
            const shadowLight = moonLight && moonLight.castShadow ? moonLight : sunLight;
            if (shadowLight && shadowLight.castShadow && typeof self.markShadowDirty === 'function') {
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
            const adaptiveShadowCenter = arePmndrsDayNightCycleDynamicShadowsEnabled(self, presentedConfig)
                ? getAdaptiveShadowCenter(self)
                : null;
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
                    if (adaptiveShadowCenter) {
                        moonTarget.position.copy(adaptiveShadowCenter);
                    } else {
                        moonTarget.position.set(0, 0, 0);
                    }
                    moonTarget.updateMatrixWorld(true);
                }
                if (moonDirection && moonLight.position && typeof moonLight.position.copy === 'function') {
                    moonLight.position.copy(moonDirection).normalize().multiplyScalar(28);
                    if (adaptiveShadowCenter) {
                        moonLight.position.add(adaptiveShadowCenter);
                    }
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
                    ? new THREE.DirectionalLight(PMNDRS_NIGHT_MOON_LIGHT_COLOR, PMNDRS_NIGHT_MOON_LIGHT_INTENSITY)
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
                    state.moonLight = new THREE.DirectionalLight(PMNDRS_NIGHT_MOON_LIGHT_COLOR, PMNDRS_NIGHT_MOON_LIGHT_INTENSITY);
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
            const cloudSunOcclusion = getPmndrsCloudSunOcclusionState(self, config, lightingSmoothingMs, indirectLightingSmoothingMs);
            const cloudMoonOcclusion = getPmndrsCloudMoonOcclusionState(self, config, lightingSmoothingMs);
            const cloudIndirectFactor = helperConfig.useMoonDirection
                ? cloudMoonOcclusion.cloudMoonIndirectFactor
                : cloudSunOcclusion.cloudSkyFactor;
            syncPmndrsSkySunDiskCloudAttenuation(self, config, cloudSunOcclusion, lightingSmoothingMs);
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
                if (adaptiveShadowCenter) {
                    moonTarget.position.copy(adaptiveShadowCenter);
                } else {
                    moonTarget.position.set(0, 0, 0);
                }
                moonTarget.updateMatrixWorld(true);
            }
            if (sunLight) {
                const useSunKey = !helperConfig.useMoonDirection;
                const sunDirectVisibility = getPmndrsSunDirectLightVisibility(config);
                const targetSunVisible = useSunKey && helperConfig.keyIntensity > 0 && sunDirectVisibility > 0.001;
                const targetSunIntensity = targetSunVisible
                    ? (hasTakramSunRadiance ? 1 : helperConfig.keyIntensity) * sunDirectVisibility * cloudSunOcclusion.cloudSunDirectFactor
                    : 0;
                const sunIntensity = smoothPmndrsRuntimeLightValue(
                    self,
                    'takramSunIntensity',
                    targetSunIntensity,
                    lightingSmoothingMs,
                    sunLight.intensity
                );
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
                sunLight.castShadow = shadowEnabled && useSunKey && sunLight.visible && (!config.dayNightCycleEnabled || dynamicCycleShadows);
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
                    sunLight.shadow.radius = getPmndrsDayNightShadowRadius(self) *
                        getPmndrsCloudSunShadowRadiusScale(cloudSunOcclusion);
                    if (typeof sunLight.shadow.normalBias !== 'undefined') {
                        sunLight.shadow.normalBias = contactShadowSettings.normalBias;
                    }
                    if (typeof sunLight.shadow.intensity !== 'undefined') {
                        sunLight.shadow.intensity = getPmndrsCloudSunShadowIntensityFactor(cloudSunOcclusion);
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
                const targetMoonIntensity = moonLightEnabled && Boolean(moonDirection)
                    ? moonIntensity * cloudMoonOcclusion.cloudMoonDirectFactor
                    : 0;
                const smoothedMoonIntensity = smoothPmndrsRuntimeLightValue(
                    self,
                    'takramMoonIntensity',
                    targetMoonIntensity,
                    lightingSmoothingMs,
                    moonLight.intensity
                );
                moonLight.visible = smoothedMoonIntensity > 0.001 || targetMoonIntensity > 0.001;
                moonLight.intensity = smoothedMoonIntensity;
                const moonOwnsShadow = helperConfig.useMoonDirection && moonLightEnabled && targetMoonIntensity > 0.001;
                moonLight.castShadow = shadowEnabled && moonOwnsShadow && moonLight.visible &&
                    (!config.dayNightCycleEnabled || dynamicCycleShadows);
                if (moonLight.color && typeof moonLight.color.copy === 'function') {
                    moonLight.color.copy(smoothPmndrsRuntimeLightColor(
                        self,
                        'takramMoonColor',
                        PMNDRS_NIGHT_MOON_LIGHT_COLOR,
                        lightingSmoothingMs,
                        moonLight.color
                    ));
                } else if (moonLight.color && typeof moonLight.color.set === 'function') {
                    moonLight.color.set(PMNDRS_NIGHT_MOON_LIGHT_COLOR);
                }
                if (moonTarget) {
                    moonLight.target = moonTarget;
                }
                if (moonDirection && moonLight.position && typeof moonLight.position.copy === 'function') {
                    moonLight.position.copy(moonDirection).normalize().multiplyScalar(28);
                    if (adaptiveShadowCenter) {
                        moonLight.position.add(adaptiveShadowCenter);
                    }
                    moonLight.updateMatrixWorld(true);
                }
                if (moonLight.shadow) {
                    moonLight.shadow.mapSize.set(shadowMap, shadowMap);
                    moonLight.shadow.bias = contactShadowSettings.bias;
                    moonLight.shadow.radius = getPmndrsDayNightShadowRadius(self) *
                        (typeof cloudMoonOcclusion.cloudMoonShadowRadiusScale === 'number'
                            ? cloudMoonOcclusion.cloudMoonShadowRadiusScale
                            : 1);
                    if (typeof moonLight.shadow.normalBias !== 'undefined') {
                        moonLight.shadow.normalBias = contactShadowSettings.normalBias;
                    }
                    if (typeof moonLight.shadow.intensity !== 'undefined') {
                        moonLight.shadow.intensity = typeof cloudMoonOcclusion.cloudMoonShadowIntensityFactor === 'number'
                            ? cloudMoonOcclusion.cloudMoonShadowIntensityFactor
                            : 1;
                    }
                    const adaptiveShadowFitted = moonLight.userData && moonLight.userData.vrodosAdaptiveShadowFitted;
                    if (moonLight.shadow.camera && !adaptiveShadowFitted) {
                        const shadowExtent = getDirectionalShadowDistanceForScene(self, 28);
                        moonLight.shadow.camera.top = shadowExtent;
                        moonLight.shadow.camera.right = shadowExtent;
                        moonLight.shadow.camera.left = -shadowExtent;
                        moonLight.shadow.camera.bottom = -shadowExtent;
                        moonLight.shadow.camera.updateProjectionMatrix();
                    }
                    if (!dynamicCycleShadows) {
                        moonLight.shadow.needsUpdate = true;
                    }
                }
                if (self._pmndrsCloudsDiagnostics) {
                    self._pmndrsCloudsDiagnostics.cloudCelestialShadowOwner = moonLight.castShadow
                        ? 'moon'
                        : (sunLight && sunLight.castShadow ? 'sun' : 'none');
                }
            }

            if (skyLight) {
                const targetSkyIntensity = helperConfig.fillIntensity > 0 && hasTakramSkyIrradiance
                    ? getPmndrsTakramSkyLightIntensity(helperConfig, config) * cloudIndirectFactor
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
                    ? getPmndrsTakramPbrFillIntensity(helperConfig, config) * cloudIndirectFactor
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
                const cloudAmbientFactor = helperConfig.useMoonDirection
                    ? cloudMoonOcclusion.cloudMoonIndirectFactor
                    : (typeof cloudSunOcclusion.cloudAmbientFactor === 'number' ? cloudSunOcclusion.cloudAmbientFactor : 1);
                const ambientBounceIntensity = getPmndrsTakramAmbientBounceIntensity(config) * cloudAmbientFactor;
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

        H.getPmndrsToneMappingExposure = function () {
            return getPmndrsExposureValue(this);
        };

        H.getPmndrsReflectionIntensityScale = function (atmosphereConfig, reflectionSource) {
            return getPmndrsNightReflectionIntensityScale(this, atmosphereConfig, reflectionSource);
        };

        H.getPmndrsStarsIntensity = function (atmosphereConfig) {
            return getPmndrsStarsIntensity(atmosphereConfig, this);
        };

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

        H.ensurePhotorealHelperLight = function (id, attributes, position) {
            const safeAttributes = sanitizePhotorealHelperLightAttributes(attributes);
            let lightEl = document.getElementById(id);
            let changed = false;
            if (!lightEl) {
                lightEl = document.createElement('a-entity');
                lightEl.setAttribute('id', id);
                this.el.appendChild(lightEl);
                this.markSceneCollectionsDirty();
                changed = true;
            }

            const signature = `${safeAttributes}|${position}`;
            if (lightEl.getAttribute('data-vrodos-photoreal-light-signature') !== signature) {
                lightEl.setAttribute('light', safeAttributes);
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

        return {
            helpers: H,
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
        };
    }
})();
