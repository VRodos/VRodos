/**
 * VRodos Compile Dialogue - Atmosphere Module
 * Part of Phase 4 Refactoring: UI Componentization
 */

window.VRodosCompileUI = window.VRodosCompileUI || {};

VRodosCompileUI.Atmosphere = (function () {
    const Shared = VRodosCompileUI.Shared;
    const contract = window.VRODOS_RUNTIME_SETTINGS_CONTRACT || {};
    const contractLookDefaults = contract.atmosphereLookDefaults || null;
    const MIDDAY = (contractLookDefaults && contractLookDefaults.midday) || {
        sunElevationDeg: 62,
        sunAzimuthDeg: 20,
        sunDistance: 5200,
        sunAngularRadius: 0.004675,
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
    };
    const LOOK_PRESETS = contractLookDefaults || {
        night: {
            sunElevationDeg: -18,
            sunAzimuthDeg: 25,
            sunDistance: 5200,
            sunAngularRadius: 0.004675,
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
            sunAngularRadius: 0.004675,
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
            sunAngularRadius: 0.004675,
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
            sunAngularRadius: 0.004675,
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
        midday: MIDDAY,
        'golden-hour': {
            sunElevationDeg: 5,
            sunAzimuthDeg: 32,
            sunDistance: 5200,
            sunAngularRadius: 0.004675,
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
            sunAngularRadius: 0.004675,
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
    const SKY_TIME_PRESETS = ['night', 'dawn', 'sunrise', 'early-morning', 'midday', 'golden-hour', 'sunset'];

    function normalizeQuality(value) {
        if (['performance', 'balanced', 'quality', 'cinematic'].indexOf(value) !== -1) {
            return value;
        }
        return 'balanced';
    }

    function normalizePreset(value) {
        if (SKY_TIME_PRESETS.concat(['custom']).indexOf(value) !== -1) {
            return value;
        }
        return Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset;
    }

    function normalizeCelestialMode(value) {
        if (value === 'preset-time' || value === 'datetime') {
            return value;
        }
        return 'manual';
    }

    function normalizeCelestialTimePreset(value) {
        if (SKY_TIME_PRESETS.indexOf(value) !== -1) {
            return value;
        }
        return Shared.PMNDRS_TWEAK_DEFAULTS.celestialTimePreset;
    }

    function normalizeDate(value, fallback) {
        const candidate = typeof value === 'string' ? value.trim() : '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
            return candidate;
        }
        return fallback || Shared.PMNDRS_TWEAK_DEFAULTS.celestialDate;
    }

    function normalizeUtcTime(value, fallback) {
        const candidate = typeof value === 'string' ? value.trim() : '';
        if (/^\d{2}:\d{2}$/.test(candidate)) {
            const parts = candidate.split(':');
            const hour = parseInt(parts[0], 10);
            const minute = parseInt(parts[1], 10);
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                return candidate;
            }
        }
        return fallback || Shared.PMNDRS_TWEAK_DEFAULTS.celestialUtcTime;
    }

    function lerpNumber(a, b, t) {
        return a + ((b - a) * t);
    }

    function hexToRgb(hex) {
        const normalized = Shared.normalizeColorHex(hex, '#000000');
        return {
            r: parseInt(normalized.slice(1, 3), 16),
            g: parseInt(normalized.slice(3, 5), 16),
            b: parseInt(normalized.slice(5, 7), 16)
        };
    }

    function rgbToHex(rgb) {
        function toHex(value) {
            const clamped = Math.max(0, Math.min(255, Math.round(value)));
            return clamped.toString(16).padStart(2, '0');
        }
        return `#${  toHex(rgb.r)  }${toHex(rgb.g)  }${toHex(rgb.b)}`;
    }

    function lerpColor(fromHex, toHex, t) {
        const from = hexToRgb(fromHex);
        const to = hexToRgb(toHex);
        return rgbToHex({
            r: lerpNumber(from.r, to.r, t),
            g: lerpNumber(from.g, to.g, t),
            b: lerpNumber(from.b, to.b, t)
        });
    }

    function getPresetIntensity(controls) {
        return Shared.clampNumber(
            controls && controls.pmndrsAtmospherePresetIntensity ? controls.pmndrsAtmospherePresetIntensity.value : Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePresetIntensity,
            0,
            1,
            Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePresetIntensity
        );
    }

    function getLookValues(presetKey, intensity) {
        let resolvedPreset = normalizePreset(presetKey);
        let blend = Math.max(0, Math.min(1, intensity));
        if (resolvedPreset === 'custom') {
            resolvedPreset = Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset;
        }

        const target = LOOK_PRESETS[resolvedPreset] || MIDDAY;
        if (resolvedPreset === 'midday') {
            blend = 1;
        }

        return {
            sunElevationDeg: lerpNumber(MIDDAY.sunElevationDeg, target.sunElevationDeg, blend),
            sunAzimuthDeg: lerpNumber(MIDDAY.sunAzimuthDeg, target.sunAzimuthDeg, blend),
            sunDistance: lerpNumber(MIDDAY.sunDistance, target.sunDistance, blend),
            sunAngularRadius: lerpNumber(MIDDAY.sunAngularRadius, target.sunAngularRadius, blend),
            aerialStrength: lerpNumber(MIDDAY.aerialStrength, target.aerialStrength, blend),
            albedoScale: lerpNumber(MIDDAY.albedoScale, target.albedoScale, blend),
            transmittanceEnabled: blend < 0.5 ? MIDDAY.transmittanceEnabled : target.transmittanceEnabled,
            inscatterEnabled: blend < 0.5 ? MIDDAY.inscatterEnabled : target.inscatterEnabled,
            groundEnabled: blend < 0.5 ? MIDDAY.groundEnabled : target.groundEnabled,
            groundAlbedo: lerpColor(MIDDAY.groundAlbedo, target.groundAlbedo, blend),
            rayleighScale: lerpNumber(MIDDAY.rayleighScale, target.rayleighScale, blend),
            mieScatteringScale: lerpNumber(MIDDAY.mieScatteringScale, target.mieScatteringScale, blend),
            mieExtinctionScale: lerpNumber(MIDDAY.mieExtinctionScale, target.mieExtinctionScale, blend),
            miePhaseG: lerpNumber(MIDDAY.miePhaseG, target.miePhaseG, blend),
            absorptionScale: lerpNumber(MIDDAY.absorptionScale, target.absorptionScale, blend),
            moonEnabled: blend >= 0.5 && target.moonEnabled === true
        };
    }

    function applyLookPreset(controls, presetKey) {
        const normalized = normalizePreset(presetKey);
        if (normalized === 'custom') {
            return;
        }

        const preset = getLookValues(normalized, getPresetIntensity(controls));
        const d = Shared.PMNDRS_TWEAK_DEFAULTS;

        if (controls.pmndrsAtmospherePreset) controls.pmndrsAtmospherePreset.value = normalized;
        if (controls.pmndrsCelestialTimePreset) controls.pmndrsCelestialTimePreset.value = normalizeCelestialTimePreset(normalized);
        if (controls.pmndrsCelestialMode) controls.pmndrsCelestialMode.value = 'preset-time';
        if (controls.pmndrsSunElevation) controls.pmndrsSunElevation.value = preset.sunElevationDeg;
        if (controls.pmndrsSunAzimuth) controls.pmndrsSunAzimuth.value = preset.sunAzimuthDeg;
        if (controls.pmndrsSunDistance) controls.pmndrsSunDistance.value = preset.sunDistance;
        if (controls.pmndrsSunAngularRadius) controls.pmndrsSunAngularRadius.value = preset.sunAngularRadius;
        if (controls.pmndrsAerialStrength) controls.pmndrsAerialStrength.value = preset.aerialStrength;
        if (controls.pmndrsAlbedoScale) controls.pmndrsAlbedoScale.value = preset.albedoScale;
        if (controls.pmndrsTransmittance) controls.pmndrsTransmittance.checked = preset.transmittanceEnabled === true;
        if (controls.pmndrsInscatter) controls.pmndrsInscatter.checked = preset.inscatterEnabled === true;
        if (controls.pmndrsGround) controls.pmndrsGround.checked = preset.groundEnabled === true;
        if (controls.pmndrsGroundAlbedo) controls.pmndrsGroundAlbedo.value = Shared.normalizeColorHex(preset.groundAlbedo, d.groundAlbedo);
        if (controls.pmndrsRayleighScale) controls.pmndrsRayleighScale.value = preset.rayleighScale;
        if (controls.pmndrsMieScatteringScale) controls.pmndrsMieScatteringScale.value = preset.mieScatteringScale;
        if (controls.pmndrsMieExtinctionScale) controls.pmndrsMieExtinctionScale.value = preset.mieExtinctionScale;
        if (controls.pmndrsMiePhaseG) controls.pmndrsMiePhaseG.value = preset.miePhaseG;
        if (controls.pmndrsAbsorptionScale) controls.pmndrsAbsorptionScale.value = preset.absorptionScale;
        if (controls.pmndrsMoon) controls.pmndrsMoon.checked = preset.moonEnabled === true;
    }

    function applyCelestialTimePreset(controls, presetKey) {
        const normalized = normalizeCelestialTimePreset(presetKey);
        if (controls.pmndrsCelestialTimePreset) controls.pmndrsCelestialTimePreset.value = normalized;
        applyLookPreset(controls, normalized);
    }

    function markCustom(controls) {
        if (controls.pmndrsAtmospherePreset) {
            controls.pmndrsAtmospherePreset.value = 'custom';
        }
        if (controls.pmndrsCelestialMode) {
            controls.pmndrsCelestialMode.value = 'manual';
        }
    }

    function applyHorizonLightingPreset(controls, presetKey) {
        const fallbackPreset = VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene.aframeHorizonSkyPreset : Shared.PMNDRS_TWEAK_DEFAULTS.horizonLightingPreset;
        const normalized = Shared.normalizePmndrsHorizonLightingPreset(presetKey, fallbackPreset);
        if (normalized === 'custom') {
            return;
        }

        const preset = Shared.getPmndrsHorizonHelperDefaults(normalized);
        if (controls.pmndrsHorizonLightingPreset) controls.pmndrsHorizonLightingPreset.value = normalized;
        if (controls.pmndrsHorizonKeyLightIntensity) controls.pmndrsHorizonKeyLightIntensity.value = preset.keyLightIntensity;
        if (controls.pmndrsHorizonFillLightIntensity) controls.pmndrsHorizonFillLightIntensity.value = preset.fillLightIntensity;
    }

    function markHorizonLightingCustom(controls) {
        if (controls.pmndrsHorizonLightingPreset) {
            controls.pmndrsHorizonLightingPreset.value = 'custom';
        }
    }

    function isLocalPmndrsHorizonSelected(controls) {
        const scene = VRODOS.editor && VRODOS.editor.envir ? VRODOS.editor.envir.scene : null;
        const postFxEngine = controls && controls.postFxEngine ? controls.postFxEngine.value : '';
        return Boolean(scene && parseInt(scene.backgroundStyleOption, 10) === 0 && postFxEngine === 'pmndrs');
    }

    function syncLocalHorizonGroundControls(controls, isEnabled) {
        const localHorizon = isEnabled && isLocalPmndrsHorizonSelected(controls);
        const title = localHorizon
            ? 'Local Horizon uses authored VRodos geometry for ground and bounce; Takram atmosphere ground stays off.'
            : '';

        if (controls.pmndrsGround) {
            controls.pmndrsGround.disabled = localHorizon || controls.pmndrsGround.disabled;
            controls.pmndrsGround.checked = localHorizon ? false : controls.pmndrsGround.checked;
            controls.pmndrsGround.title = title;
        }
        if (controls.pmndrsGroundAlbedo) {
            controls.pmndrsGroundAlbedo.disabled = localHorizon || controls.pmndrsGroundAlbedo.disabled;
            controls.pmndrsGroundAlbedo.title = title;
        }
    }

    function setAdvancedState(controls, enabled) {
        const isEnabled = enabled === true;
        if (controls.pmndrsAtmosphereAdvanced) {
            controls.pmndrsAtmosphereAdvanced.classList.toggle('tw-opacity-50', !isEnabled);
            controls.pmndrsAtmosphereAdvanced.classList.toggle('tw-pointer-events-none', !isEnabled);
        }

        [
            controls.pmndrsCelestialMode,
            controls.pmndrsCelestialTimePreset,
            controls.pmndrsAtmospherePreset,
            controls.pmndrsAtmospherePresetIntensity,
            controls.pmndrsAtmosphereQuality,
            controls.pmndrsDayNightCycle,
            controls.pmndrsAerialPerspective,
            controls.pmndrsCorrectAltitude,
            controls.pmndrsGeospatial,
            controls.pmndrsGeospatialLatitude,
            controls.pmndrsGeospatialLongitude,
            controls.pmndrsGeospatialAltitude,
            controls.pmndrsSunElevation,
            controls.pmndrsSunAzimuth,
            controls.pmndrsSunAngularRadius,
            controls.pmndrsSunDistance,
            controls.pmndrsAerialStrength,
            controls.pmndrsAlbedoScale,
            controls.pmndrsTransmittance,
            controls.pmndrsInscatter,
            controls.pmndrsGround,
            controls.pmndrsGroundAlbedo,
            controls.pmndrsRayleighScale,
            controls.pmndrsMieScatteringScale,
            controls.pmndrsMieExtinctionScale,
            controls.pmndrsMiePhaseG,
            controls.pmndrsAbsorptionScale,
            controls.pmndrsMoon,
            controls.pmndrsHorizonLightingPreset,
            controls.pmndrsHorizonKeyLightIntensity,
            controls.pmndrsHorizonFillLightIntensity
        ].forEach((el) => {
            if (el) {
                el.disabled = !isEnabled;
            }
        });

        const celestialMode = normalizeCelestialMode(controls.pmndrsCelestialMode ? controls.pmndrsCelestialMode.value : Shared.PMNDRS_TWEAK_DEFAULTS.celestialMode);
        const dayNightCycleEnabled = isEnabled && controls.pmndrsDayNightCycle && controls.pmndrsDayNightCycle.checked === true;
        if (controls.pmndrsAtmospherePreset) {
            controls.pmndrsAtmospherePreset.disabled = !isEnabled || dayNightCycleEnabled;
        }
        if (controls.pmndrsCelestialMode) {
            controls.pmndrsCelestialMode.disabled = !isEnabled || dayNightCycleEnabled;
        }
        if (controls.pmndrsCelestialTimePresetWrapper) {
            controls.pmndrsCelestialTimePresetWrapper.style.display = 'none';
        }
        if (controls.pmndrsCelestialTimePreset) {
            controls.pmndrsCelestialTimePreset.disabled = true;
        }

        const dateTimeEnabled = isEnabled && (celestialMode === 'datetime' || dayNightCycleEnabled);
        if (controls.pmndrsCelestialDateTimeWrapper) {
            controls.pmndrsCelestialDateTimeWrapper.style.display = dateTimeEnabled ? '' : 'none';
        }
        if (controls.pmndrsCelestialDate) {
            controls.pmndrsCelestialDate.disabled = !dateTimeEnabled;
        }
        if (controls.pmndrsCelestialUtcTime) {
            controls.pmndrsCelestialUtcTime.disabled = !dateTimeEnabled;
        }
        if (controls.pmndrsDayNightCycleDuration) {
            controls.pmndrsDayNightCycleDuration.disabled = !dayNightCycleEnabled;
        }
        syncLocalHorizonGroundControls(controls, isEnabled);

        const geospatialEnabled = isEnabled && controls.pmndrsGeospatial && controls.pmndrsGeospatial.checked === true;
        [
            controls.pmndrsGeospatialLatitude,
            controls.pmndrsGeospatialLongitude,
            controls.pmndrsGeospatialAltitude
        ].forEach((el) => {
            if (el) {
                el.disabled = !geospatialEnabled;
            }
        });
    }

    function syncToScene(controls) {
        if (!VRODOS.editor.envir || !VRODOS.editor.envir.scene || !controls.pmndrsAtmosphere) {
            return;
        }

        const d = Shared.PMNDRS_TWEAK_DEFAULTS;

        const pmndrsEngineSelected = controls.postFxEngine && controls.postFxEngine.value === 'pmndrs';
        const pmndrsRuntimeEnabled = controls.postFx && controls.postFx.checked === true && pmndrsEngineSelected;

        VRODOS.editor.envir.scene.aframePmndrsAtmosphereEnabled = pmndrsRuntimeEnabled && controls.pmndrsAtmosphere.checked === true;
        const atmospherePreset = normalizePreset(controls.pmndrsAtmospherePreset ? controls.pmndrsAtmospherePreset.value : d.atmospherePreset);
        const dayNightCycleEnabled = pmndrsRuntimeEnabled && controls.pmndrsDayNightCycle ? controls.pmndrsDayNightCycle.checked === true : d.dayNightCycleEnabled;
        const celestialMode = normalizeCelestialMode(controls.pmndrsCelestialMode ? controls.pmndrsCelestialMode.value : d.celestialMode);
        const effectiveCelestialMode = dayNightCycleEnabled ? 'datetime' : celestialMode;
        const usesSkyTimePreset = !dayNightCycleEnabled &&
            (effectiveCelestialMode === 'preset-time' || (effectiveCelestialMode !== 'datetime' && atmospherePreset !== 'custom'));

        VRODOS.editor.envir.scene.aframePmndrsAtmospherePreset = atmospherePreset;
        VRODOS.editor.envir.scene.aframePmndrsAtmospherePresetIntensity = Shared.clampNumber(
            controls.pmndrsAtmospherePresetIntensity ? controls.pmndrsAtmospherePresetIntensity.value : d.atmospherePresetIntensity,
            0,
            1,
            d.atmospherePresetIntensity
        );
        VRODOS.editor.envir.scene.aframePmndrsAtmosphereQuality = normalizeQuality(controls.pmndrsAtmosphereQuality ? controls.pmndrsAtmosphereQuality.value : d.atmosphereQuality);
        VRODOS.editor.envir.scene.aframePmndrsCelestialMode = dayNightCycleEnabled ? 'datetime' : (usesSkyTimePreset ? 'preset-time' : effectiveCelestialMode);
        VRODOS.editor.envir.scene.aframePmndrsCelestialTimePreset = usesSkyTimePreset
            ? normalizeCelestialTimePreset(atmospherePreset)
            : normalizeCelestialTimePreset(controls.pmndrsCelestialTimePreset ? controls.pmndrsCelestialTimePreset.value : d.celestialTimePreset);
        VRODOS.editor.envir.scene.aframePmndrsCelestialDate = normalizeDate(controls.pmndrsCelestialDate ? controls.pmndrsCelestialDate.value : d.celestialDate, d.celestialDate);
        VRODOS.editor.envir.scene.aframePmndrsCelestialUtcTime = normalizeUtcTime(controls.pmndrsCelestialUtcTime ? controls.pmndrsCelestialUtcTime.value : d.celestialUtcTime, d.celestialUtcTime);
        VRODOS.editor.envir.scene.aframePmndrsDayNightCycleEnabled = dayNightCycleEnabled;
        VRODOS.editor.envir.scene.aframePmndrsDayNightCycleDurationMinutes = Shared.clampNumber(
            controls.pmndrsDayNightCycleDuration ? controls.pmndrsDayNightCycleDuration.value : d.dayNightCycleDurationMinutes,
            0.25,
            1440,
            d.dayNightCycleDurationMinutes
        );
        VRODOS.editor.envir.scene.aframePmndrsAerialPerspectiveEnabled = (pmndrsRuntimeEnabled && controls.pmndrsAerialPerspective) ? controls.pmndrsAerialPerspective.checked === true : false;
        VRODOS.editor.envir.scene.aframePmndrsCorrectAltitudeEnabled = controls.pmndrsCorrectAltitude ? controls.pmndrsCorrectAltitude.checked === true : d.correctAltitudeEnabled;
        VRODOS.editor.envir.scene.aframePmndrsGeospatialEnabled = (pmndrsRuntimeEnabled && controls.pmndrsGeospatial) ? controls.pmndrsGeospatial.checked === true : false;
        VRODOS.editor.envir.scene.aframePmndrsGeospatialLatitudeDeg = Shared.clampNumber(controls.pmndrsGeospatialLatitude ? controls.pmndrsGeospatialLatitude.value : d.geospatialLatitudeDeg, -90, 90, d.geospatialLatitudeDeg);
        VRODOS.editor.envir.scene.aframePmndrsGeospatialLongitudeDeg = Shared.clampNumber(controls.pmndrsGeospatialLongitude ? controls.pmndrsGeospatialLongitude.value : d.geospatialLongitudeDeg, -180, 180, d.geospatialLongitudeDeg);
        VRODOS.editor.envir.scene.aframePmndrsGeospatialAltitudeMeters = Shared.clampNumber(controls.pmndrsGeospatialAltitude ? controls.pmndrsGeospatialAltitude.value : d.geospatialAltitudeMeters, -500, 20000, d.geospatialAltitudeMeters);

        VRODOS.editor.envir.scene.aframePmndrsSunElevationDeg = Shared.clampNumber(controls.pmndrsSunElevation ? controls.pmndrsSunElevation.value : d.sunElevationDeg, -18, 85, d.sunElevationDeg);
        VRODOS.editor.envir.scene.aframePmndrsSunAzimuthDeg = Shared.clampNumber(controls.pmndrsSunAzimuth ? controls.pmndrsSunAzimuth.value : d.sunAzimuthDeg, -180, 180, d.sunAzimuthDeg);
        VRODOS.editor.envir.scene.aframePmndrsSunDistance = Shared.clampNumber(controls.pmndrsSunDistance ? controls.pmndrsSunDistance.value : d.sunDistance, 1500, 20000, d.sunDistance);
        VRODOS.editor.envir.scene.aframePmndrsSunAngularRadius = Shared.clampNumber(controls.pmndrsSunAngularRadius ? controls.pmndrsSunAngularRadius.value : d.sunAngularRadius, 0.002, 0.03, d.sunAngularRadius);

        VRODOS.editor.envir.scene.aframePmndrsAerialStrength = Shared.clampNumber(controls.pmndrsAerialStrength ? controls.pmndrsAerialStrength.value : d.aerialStrength, 0, 2, d.aerialStrength);
        VRODOS.editor.envir.scene.aframePmndrsAlbedoScale = Shared.clampNumber(controls.pmndrsAlbedoScale ? controls.pmndrsAlbedoScale.value : d.albedoScale, 0, 2, d.albedoScale);

        VRODOS.editor.envir.scene.aframePmndrsTransmittanceEnabled = controls.pmndrsTransmittance ? controls.pmndrsTransmittance.checked === true : true;
        VRODOS.editor.envir.scene.aframePmndrsInscatterEnabled = controls.pmndrsInscatter ? controls.pmndrsInscatter.checked === true : true;
        VRODOS.editor.envir.scene.aframePmndrsGroundEnabled = isLocalPmndrsHorizonSelected(controls)
            ? false
            : (controls.pmndrsGround ? controls.pmndrsGround.checked === true : true);
        VRODOS.editor.envir.scene.aframePmndrsGroundAlbedo = Shared.normalizeColorHex(controls.pmndrsGroundAlbedo ? controls.pmndrsGroundAlbedo.value : d.groundAlbedo, d.groundAlbedo);

        VRODOS.editor.envir.scene.aframePmndrsRayleighScale = Shared.clampNumber(controls.pmndrsRayleighScale ? controls.pmndrsRayleighScale.value : d.rayleighScale, 0.1, 3, d.rayleighScale);
        VRODOS.editor.envir.scene.aframePmndrsMieScatteringScale = Shared.clampNumber(controls.pmndrsMieScatteringScale ? controls.pmndrsMieScatteringScale.value : d.mieScatteringScale, 0.1, 3, d.mieScatteringScale);
        VRODOS.editor.envir.scene.aframePmndrsMieExtinctionScale = Shared.clampNumber(controls.pmndrsMieExtinctionScale ? controls.pmndrsMieExtinctionScale.value : d.mieExtinctionScale, 0.1, 3, d.mieExtinctionScale);
        VRODOS.editor.envir.scene.aframePmndrsMiePhaseG = Shared.clampNumber(controls.pmndrsMiePhaseG ? controls.pmndrsMiePhaseG.value : d.miePhaseG, 0, 0.99, d.miePhaseG);
        VRODOS.editor.envir.scene.aframePmndrsAbsorptionScale = Shared.clampNumber(controls.pmndrsAbsorptionScale ? controls.pmndrsAbsorptionScale.value : d.absorptionScale, 0.1, 3, d.absorptionScale);
        VRODOS.editor.envir.scene.aframePmndrsMoonEnabled = controls.pmndrsMoon ? controls.pmndrsMoon.checked === true : false;
        const lightingPresetFallback = VRODOS.editor.envir.scene.aframeHorizonSkyPreset || d.horizonLightingPreset;
        VRODOS.editor.envir.scene.aframePmndrsHorizonLightingPreset = Shared.normalizePmndrsHorizonLightingPreset(
            controls.pmndrsHorizonLightingPreset ? controls.pmndrsHorizonLightingPreset.value : lightingPresetFallback,
            lightingPresetFallback
        );
        const helperDefaults = Shared.getPmndrsHorizonHelperDefaults(
            VRODOS.editor.envir.scene.aframePmndrsHorizonLightingPreset === 'custom'
                ? lightingPresetFallback
                : VRODOS.editor.envir.scene.aframePmndrsHorizonLightingPreset
        );
        VRODOS.editor.envir.scene.aframePmndrsHorizonKeyLightIntensity = Shared.clampNumber(
            controls.pmndrsHorizonKeyLightIntensity ? controls.pmndrsHorizonKeyLightIntensity.value : helperDefaults.keyLightIntensity,
            0,
            3,
            helperDefaults.keyLightIntensity
        );
        VRODOS.editor.envir.scene.aframePmndrsHorizonFillLightIntensity = Shared.clampNumber(
            controls.pmndrsHorizonFillLightIntensity ? controls.pmndrsHorizonFillLightIntensity.value : helperDefaults.fillLightIntensity,
            0,
            3,
            helperDefaults.fillLightIntensity
        );

        if (typeof VRODOS.editor.envir.updateAtmosphere === 'function') {
            VRODOS.editor.envir.updateAtmosphere();
        }
    }

    return {
        applyLookPreset,
        applyCelestialTimePreset,
        applyHorizonLightingPreset,
        markCustom,
        markHorizonLightingCustom,
        setAdvancedState,
        syncToScene,
        normalizeQuality,
        normalizePreset,
        normalizeCelestialMode,
        normalizeCelestialTimePreset,
        normalizeDate,
        normalizeUtcTime
    };
})();
