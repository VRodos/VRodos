/**
 * VRodos Compile Dialogue - Atmosphere Module
 * Part of Phase 4 Refactoring: UI Componentization
 */

window.VRodosCompileUI = window.VRodosCompileUI || {};

VRodosCompileUI.Atmosphere = (function () {
    
    // Alias common items for brevity
    const Shared = VRodosCompileUI.Shared;
    const PRESETS = {
        performance: {
            sunElevationDeg: 8,
            sunAzimuthDeg: 34,
            sunDistance: 4800,
            sunAngularRadius: 0.0047,
            aerialStrength: 0.6,
            albedoScale: 0.92,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#e8ddc9',
            rayleighScale: 0.82,
            mieScatteringScale: 0.62,
            mieExtinctionScale: 0.74,
            miePhaseG: 0.72,
            absorptionScale: 0.82,
            moonEnabled: false
        },
        balanced: {
            sunElevationDeg: 10,
            sunAzimuthDeg: 38,
            sunDistance: 5200,
            sunAngularRadius: 0.0047,
            aerialStrength: 0.85,
            albedoScale: 0.96,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f0e6d6',
            rayleighScale: 1.0,
            mieScatteringScale: 0.9,
            mieExtinctionScale: 1.0,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        },
        quality: {
            sunElevationDeg: 12,
            sunAzimuthDeg: 40,
            sunDistance: 5600,
            sunAngularRadius: 0.0047,
            aerialStrength: 1.0,
            albedoScale: 1.0,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f6ead7',
            rayleighScale: 1.12,
            mieScatteringScale: 1.02,
            mieExtinctionScale: 1.05,
            miePhaseG: 0.82,
            absorptionScale: 1.02,
            moonEnabled: false
        },
        cinematic: {
            sunElevationDeg: 7,
            sunAzimuthDeg: 28,
            sunDistance: 6200,
            sunAngularRadius: 0.0047,
            aerialStrength: 1.15,
            albedoScale: 1.05,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f8ead2',
            rayleighScale: 1.2,
            mieScatteringScale: 1.16,
            mieExtinctionScale: 1.18,
            miePhaseG: 0.84,
            absorptionScale: 0.96,
            moonEnabled: false
        }
    };

    /**
     * Helper to normalize quality string
     */
    function normalizeQuality(value) {
        if (['performance', 'balanced', 'quality', 'cinematic', 'custom'].indexOf(value) !== -1) {
            return value;
        }
        return 'balanced';
    }

    /**
     * Applies a preset to the UI controls
     */
    function applyPreset(controls, quality) {
        const presetKey = normalizeQuality(quality);
        if (presetKey === 'custom') return;

        const preset = PRESETS[presetKey] || PRESETS.balanced;
        const d = Shared.PMNDRS_TWEAK_DEFAULTS;
        
        if (controls.pmndrsAtmosphereQuality) controls.pmndrsAtmosphereQuality.value = presetKey;
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

    /**
     * Marks the UI as using custom settings
     */
    function markCustom(controls) {
        if (controls.pmndrsAtmosphereQuality) {
            controls.pmndrsAtmosphereQuality.value = 'custom';
        }
    }

    /**
     * Controls the advanced panel visibility/interactability
     */
    function setAdvancedState(controls, enabled) {
        var isEnabled = enabled === true;
        if (controls.pmndrsAtmosphereAdvanced) {
            controls.pmndrsAtmosphereAdvanced.classList.toggle('tw-opacity-50', !isEnabled);
            controls.pmndrsAtmosphereAdvanced.classList.toggle('tw-pointer-events-none', !isEnabled);
        }

        const elements = [
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
            controls.pmndrsMoon
        ];

        elements.forEach(function (el) {
            if (el) el.disabled = !isEnabled;
        });
    }

    /**
     * Updates the 3D scene from the UI controls using standardized schema keys
     */
    function syncToScene(controls) {
        if (!envir || !envir.scene || !controls.pmndrsAtmosphere) return;

        const d = Shared.PMNDRS_TWEAK_DEFAULTS;

        envir.scene.aframePmndrsAtmosphereEnabled = controls.pmndrsAtmosphere.checked === true;
        envir.scene.aframePmndrsAtmosphereQuality = normalizeQuality(controls.pmndrsAtmosphereQuality ? controls.pmndrsAtmosphereQuality.value : 'balanced');
        
        envir.scene.aframePmndrsSunElevationDeg = Shared.clampNumber(controls.pmndrsSunElevation ? controls.pmndrsSunElevation.value : d.sunElevationDeg, -15, 75, d.sunElevationDeg);
        envir.scene.aframePmndrsSunAzimuthDeg = Shared.clampNumber(controls.pmndrsSunAzimuth ? controls.pmndrsSunAzimuth.value : d.sunAzimuthDeg, -180, 180, d.sunAzimuthDeg);
        envir.scene.aframePmndrsSunDistance = Shared.clampNumber(controls.pmndrsSunDistance ? controls.pmndrsSunDistance.value : d.sunDistance, 1500, 12000, d.sunDistance);
        envir.scene.aframePmndrsSunAngularRadius = Shared.clampNumber(controls.pmndrsSunAngularRadius ? controls.pmndrsSunAngularRadius.value : d.sunAngularRadius, 0.001, 0.03, d.sunAngularRadius);
        
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

        // Trigger real-time atmosphere update if the component exists in the 3D editor
        if (typeof envir.updateAtmosphere === 'function') {
            envir.updateAtmosphere();
        }
    }

    return {
        applyPreset: applyPreset,
        markCustom: markCustom,
        setAdvancedState: setAdvancedState,
        syncToScene: syncToScene,
        normalizeQuality: normalizeQuality
    };

})();
