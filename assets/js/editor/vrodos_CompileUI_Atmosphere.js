/**
 * VRodos Compile Dialogue - Atmosphere Module
 * Part of Phase 4 Refactoring: UI Componentization
 */

window.VRodosCompileUI = window.VRodosCompileUI || {};

VRodosCompileUI.Atmosphere = (function () {
    const Shared = VRodosCompileUI.Shared;
    const MIDDAY = {
        sunElevationDeg: 62,
        sunAzimuthDeg: 20,
        sunDistance: 5200,
        sunAngularRadius: 0.0047,
        aerialStrength: 0.55,
        albedoScale: 1.0,
        transmittanceEnabled: true,
        inscatterEnabled: true,
        groundEnabled: true,
        groundAlbedo: '#d8d8d0',
        rayleighScale: 1.18,
        mieScatteringScale: 0.42,
        mieExtinctionScale: 0.56,
        miePhaseG: 0.74,
        absorptionScale: 0.94,
        moonEnabled: false
    };
    const LOOK_PRESETS = {
        sunrise: {
            sunElevationDeg: 6,
            sunAzimuthDeg: -55,
            sunDistance: 5200,
            sunAngularRadius: 0.0049,
            aerialStrength: 0.88,
            albedoScale: 0.96,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f0d8b8',
            rayleighScale: 1.0,
            mieScatteringScale: 0.88,
            mieExtinctionScale: 0.98,
            miePhaseG: 0.78,
            absorptionScale: 0.88,
            moonEnabled: false
        },
        midday: MIDDAY,
        sunset: {
            sunElevationDeg: 8,
            sunAzimuthDeg: 38,
            sunDistance: 5600,
            sunAngularRadius: 0.0049,
            aerialStrength: 1.02,
            albedoScale: 0.96,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f2cda8',
            rayleighScale: 0.96,
            mieScatteringScale: 1.08,
            mieExtinctionScale: 1.18,
            miePhaseG: 0.82,
            absorptionScale: 0.86,
            moonEnabled: false
        },
        night: {
            sunElevationDeg: -8,
            sunAzimuthDeg: 25,
            sunDistance: 5200,
            sunAngularRadius: 0.0044,
            aerialStrength: 0.28,
            albedoScale: 0.82,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#4e5870',
            rayleighScale: 0.66,
            mieScatteringScale: 0.32,
            mieExtinctionScale: 0.46,
            miePhaseG: 0.7,
            absorptionScale: 1.14,
            moonEnabled: true
        }
    };

    function normalizeQuality(value) {
        if (['performance', 'balanced', 'quality', 'cinematic'].indexOf(value) !== -1) {
            return value;
        }
        return 'balanced';
    }

    function normalizePreset(value) {
        if (['sunrise', 'midday', 'sunset', 'night', 'custom'].indexOf(value) !== -1) {
            return value;
        }
        return Shared.PMNDRS_TWEAK_DEFAULTS.atmospherePreset;
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

    function markCustom(controls) {
        if (controls.pmndrsAtmospherePreset) {
            controls.pmndrsAtmospherePreset.value = 'custom';
        }
    }

    function applyHorizonLightingPreset(controls, presetKey) {
        const fallbackPreset = envir && envir.scene ? envir.scene.aframeHorizonSkyPreset : Shared.PMNDRS_TWEAK_DEFAULTS.horizonLightingPreset;
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

    function setAdvancedState(controls, enabled) {
        const isEnabled = enabled === true;
        if (controls.pmndrsAtmosphereAdvanced) {
            controls.pmndrsAtmosphereAdvanced.classList.toggle('tw-opacity-50', !isEnabled);
            controls.pmndrsAtmosphereAdvanced.classList.toggle('tw-pointer-events-none', !isEnabled);
        }

        [
            controls.pmndrsAtmospherePreset,
            controls.pmndrsAtmospherePresetIntensity,
            controls.pmndrsAtmosphereQuality,
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
    }

    function syncToScene(controls) {
        if (!envir || !envir.scene || !controls.pmndrsAtmosphere) {
            return;
        }

        const d = Shared.PMNDRS_TWEAK_DEFAULTS;

        envir.scene.aframePmndrsAtmosphereEnabled = controls.pmndrsAtmosphere.checked === true;
        envir.scene.aframePmndrsAtmospherePreset = normalizePreset(controls.pmndrsAtmospherePreset ? controls.pmndrsAtmospherePreset.value : d.atmospherePreset);
        envir.scene.aframePmndrsAtmospherePresetIntensity = Shared.clampNumber(
            controls.pmndrsAtmospherePresetIntensity ? controls.pmndrsAtmospherePresetIntensity.value : d.atmospherePresetIntensity,
            0,
            1,
            d.atmospherePresetIntensity
        );
        envir.scene.aframePmndrsAtmosphereQuality = normalizeQuality(controls.pmndrsAtmosphereQuality ? controls.pmndrsAtmosphereQuality.value : d.atmosphereQuality);

        envir.scene.aframePmndrsSunElevationDeg = Shared.clampNumber(controls.pmndrsSunElevation ? controls.pmndrsSunElevation.value : d.sunElevationDeg, -10, 85, d.sunElevationDeg);
        envir.scene.aframePmndrsSunAzimuthDeg = Shared.clampNumber(controls.pmndrsSunAzimuth ? controls.pmndrsSunAzimuth.value : d.sunAzimuthDeg, -180, 180, d.sunAzimuthDeg);
        envir.scene.aframePmndrsSunDistance = Shared.clampNumber(controls.pmndrsSunDistance ? controls.pmndrsSunDistance.value : d.sunDistance, 1500, 20000, d.sunDistance);
        envir.scene.aframePmndrsSunAngularRadius = Shared.clampNumber(controls.pmndrsSunAngularRadius ? controls.pmndrsSunAngularRadius.value : d.sunAngularRadius, 0.002, 0.03, d.sunAngularRadius);

        envir.scene.aframePmndrsAerialStrength = Shared.clampNumber(controls.pmndrsAerialStrength ? controls.pmndrsAerialStrength.value : d.aerialStrength, 0, 2, d.aerialStrength);
        envir.scene.aframePmndrsAlbedoScale = Shared.clampNumber(controls.pmndrsAlbedoScale ? controls.pmndrsAlbedoScale.value : d.albedoScale, 0, 2, d.albedoScale);

        envir.scene.aframePmndrsTransmittanceEnabled = controls.pmndrsTransmittance ? controls.pmndrsTransmittance.checked === true : true;
        envir.scene.aframePmndrsInscatterEnabled = controls.pmndrsInscatter ? controls.pmndrsInscatter.checked === true : true;
        envir.scene.aframePmndrsGroundEnabled = controls.pmndrsGround ? controls.pmndrsGround.checked === true : true;
        envir.scene.aframePmndrsGroundAlbedo = Shared.normalizeColorHex(controls.pmndrsGroundAlbedo ? controls.pmndrsGroundAlbedo.value : d.groundAlbedo, d.groundAlbedo);

        envir.scene.aframePmndrsRayleighScale = Shared.clampNumber(controls.pmndrsRayleighScale ? controls.pmndrsRayleighScale.value : d.rayleighScale, 0.1, 3, d.rayleighScale);
        envir.scene.aframePmndrsMieScatteringScale = Shared.clampNumber(controls.pmndrsMieScatteringScale ? controls.pmndrsMieScatteringScale.value : d.mieScatteringScale, 0.1, 3, d.mieScatteringScale);
        envir.scene.aframePmndrsMieExtinctionScale = Shared.clampNumber(controls.pmndrsMieExtinctionScale ? controls.pmndrsMieExtinctionScale.value : d.mieExtinctionScale, 0.1, 3, d.mieExtinctionScale);
        envir.scene.aframePmndrsMiePhaseG = Shared.clampNumber(controls.pmndrsMiePhaseG ? controls.pmndrsMiePhaseG.value : d.miePhaseG, 0, 0.99, d.miePhaseG);
        envir.scene.aframePmndrsAbsorptionScale = Shared.clampNumber(controls.pmndrsAbsorptionScale ? controls.pmndrsAbsorptionScale.value : d.absorptionScale, 0.1, 3, d.absorptionScale);
        envir.scene.aframePmndrsMoonEnabled = controls.pmndrsMoon ? controls.pmndrsMoon.checked === true : false;
        const lightingPresetFallback = envir.scene.aframeHorizonSkyPreset || d.horizonLightingPreset;
        envir.scene.aframePmndrsHorizonLightingPreset = Shared.normalizePmndrsHorizonLightingPreset(
            controls.pmndrsHorizonLightingPreset ? controls.pmndrsHorizonLightingPreset.value : lightingPresetFallback,
            lightingPresetFallback
        );
        const helperDefaults = Shared.getPmndrsHorizonHelperDefaults(
            envir.scene.aframePmndrsHorizonLightingPreset === 'custom'
                ? lightingPresetFallback
                : envir.scene.aframePmndrsHorizonLightingPreset
        );
        envir.scene.aframePmndrsHorizonKeyLightIntensity = Shared.clampNumber(
            controls.pmndrsHorizonKeyLightIntensity ? controls.pmndrsHorizonKeyLightIntensity.value : helperDefaults.keyLightIntensity,
            0,
            3,
            helperDefaults.keyLightIntensity
        );
        envir.scene.aframePmndrsHorizonFillLightIntensity = Shared.clampNumber(
            controls.pmndrsHorizonFillLightIntensity ? controls.pmndrsHorizonFillLightIntensity.value : helperDefaults.fillLightIntensity,
            0,
            3,
            helperDefaults.fillLightIntensity
        );

        if (typeof envir.updateAtmosphere === 'function') {
            envir.updateAtmosphere();
        }
    }

    return {
        applyLookPreset,
        applyHorizonLightingPreset,
        markCustom,
        markHorizonLightingCustom,
        setAdvancedState,
        syncToScene,
        normalizeQuality,
        normalizePreset
    };
})();
