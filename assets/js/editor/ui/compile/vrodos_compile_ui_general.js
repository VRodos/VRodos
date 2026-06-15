/**
 * VRodos Compile Dialogue - General Rendering Module
 * Part of Phase 4 Refactoring: UI Componentization
 */

window.VRodosCompileUI = window.VRodosCompileUI || {};

VRodosCompileUI.General = (function () {

    const Shared = VRodosCompileUI.Shared;
    const RUNTIME_TARGET_OVERRIDDEN_CONTROLS = [
        'ambientOcclusionPreset',
        'reflectionsEnabled',
        'reflectionProfile',
        'reflectionSource',
        'sceneProbeUpdateMode',
        'sceneProbeResolution',
        'envMapPreset',
        'postFx',
        'postFxColor',
        'edgeAAStrength',
        'bloomStrength',
        'exposurePreset',
        'contrastPreset',
        'aaQuality',
        'ssrStrength',
        'taaEnabled',
        'postFxEngineTabLegacy',
        'postFxEngineTabPmndrs',
        'pmndrsAAMode',
        'pmndrsAAPreset',
        'pmndrsBloomIntensity',
        'pmndrsBloomThreshold',
        'pmndrsToneMapping',
        'pmndrsExposure',
        'pmndrsLensFlare',
        'pmndrsLut',
        'pmndrsLutLook',
        'pmndrsLutStrength',
        'pmndrsVignette',
        'pmndrsVignetteDarkness',
        'pmndrsNoise',
        'pmndrsNoiseOpacity',
        'pmndrsChromaticAberration',
        'pmndrsChromaticAberrationOffset',
        'pmndrsAtmosphere',
        'pmndrsAtmospherePreset',
        'pmndrsAtmospherePresetIntensity',
        'pmndrsAtmosphereQuality',
        'pmndrsCelestialMode',
        'pmndrsCelestialTimePreset',
        'pmndrsCelestialDate',
        'pmndrsCelestialUtcTime',
        'pmndrsDayNightCycle',
        'pmndrsDayNightCycleDuration',
        'pmndrsGeospatial',
        'pmndrsGeospatialLatitude',
        'pmndrsGeospatialLongitude',
        'pmndrsGeospatialAltitude',
        'pmndrsAerialPerspective',
        'pmndrsClouds',
        'pmndrsCloudsQuality',
        'pmndrsCloudsCoverage',
        'pmndrsCorrectAltitude',
        'pmndrsSunElevation',
        'pmndrsSunAzimuth',
        'pmndrsSunDistance',
        'pmndrsSunAngularRadius',
        'pmndrsAerialStrength',
        'pmndrsAlbedoScale',
        'pmndrsTransmittance',
        'pmndrsInscatter',
        'pmndrsGround',
        'pmndrsGroundAlbedo',
        'pmndrsRayleighScale',
        'pmndrsMieScatteringScale',
        'pmndrsMieExtinctionScale',
        'pmndrsMiePhaseG',
        'pmndrsAbsorptionScale',
        'pmndrsMoon',
        'pmndrsHorizonLightingPreset',
        'pmndrsHorizonKeyLightIntensity',
        'pmndrsHorizonFillLightIntensity',
        'pmndrsResetBtn'
    ];
    const RUNTIME_TARGET_MUTED_CONTAINERS = [
        'reflectionControlsWrapper',
        'sceneProbeControlsWrapper',
        'envMapPresetWrapper',
        'universalPostFxGroup',
        'engineControlsColumn',
        'legacyPane',
        'pmndrsPane',
        'aaQualityWrapper',
        'edgeAAWrapper',
        'colorGradingWrapper',
        'pmndrsAAWrapper',
        'pmndrsAAPresetWrapper',
        'pmndrsBloomWrapper',
        'pmndrsAtmosphereWrapper',
        'pmndrsCloudsWrapper',
        'pmndrsAtmosphereAdvanced'
    ];

    // --- Normalization Helpers ---

    function normalizeRenderQuality(value) {
        if (value === 'performance' || value === 'standard' || value === 'high') {
            return value;
        }
        return 'standard';
    }

    function normalizeAAQuality(value) {
        if (value === 'off' || value === 'high' || value === 'ultra' || value === 'balanced') {
            return value;
        }
        return 'balanced';
    }

    function normalizeAmbientOcclusionPreset(value) {
        if (value === 'off' || value === 'soft' || value === 'strong' || value === 'balanced') {
            return value;
        }
        return 'balanced';
    }

    function normalizeContactShadowPreset(value) {
        if (value === 'off' || value === 'strong' || value === 'soft') {
            return value;
        }
        return 'soft';
    }

    function normalizeRuntimeTarget(value) {
        return value === 'vr-headset' ? 'vr-headset' : 'desktop';
    }

    function normalizeVrRuntimeProfile(value) {
        if (value === 'desktop' || value === 'baseline' || value === 'safe' || value === 'balanced' || value === 'max') {
            return value;
        }
        return 'baseline';
    }

    function runtimeTargetFromVrRuntimeProfile(value) {
        return normalizeVrRuntimeProfile(value) === 'desktop' ? 'desktop' : 'vr-headset';
    }

    function runtimeTargetToVrRuntimeProfile(value) {
        return normalizeRuntimeTarget(value) === 'vr-headset' ? 'baseline' : 'desktop';
    }

    function normalizeEdgeAAStrengthLevel(value) {
        const numeric = parseInt(value, 10);
        if (isNaN(numeric)) return 3;

        if (numeric > 5) {
            if (numeric <= 20) return 1;
            if (numeric <= 40) return 2;
            if (numeric <= 65) return 3;
            if (numeric <= 85) return 4;
            return 5;
        }
        return Math.max(0, Math.min(5, numeric));
    }

    function getEdgeAAStrengthLabel(level) {
        switch (normalizeEdgeAAStrengthLevel(level)) {
            case 0: return 'Off';
            case 1: return 'Crisp';
            case 2: return 'Light';
            case 4: return 'Strong';
            case 5: return 'Max';
            default: return 'Balanced';
        }
    }

    function clampLegacyHorizonStageSize(value) {
        return Math.round(Shared.clampNumber(value, 500, 8000, 5000) / 100) * 100;
    }

    function isLegacyHorizonStageApplicable() {
        if (typeof VRODOS.editor.envir === 'undefined' || !VRODOS.editor.envir.scene) return false;
        return parseInt(VRODOS.editor.envir.scene.backgroundStyleOption, 10) === 0;
    }

    function isVrHeadsetTarget(controls) {
        return Boolean(controls && controls.runtimeTarget && normalizeRuntimeTarget(controls.runtimeTarget.value) === 'vr-headset');
    }

    // --- UI Logic ---

    function setRuntimeTargetDisabled(control, disabled) {
        if (!control) return;

        if (disabled) {
            control.dataset.vrodosRuntimeTargetDisabled = '1';
            control.disabled = true;
            control.setAttribute('aria-disabled', 'true');
            return;
        }

        if (control.dataset && control.dataset.vrodosRuntimeTargetDisabled === '1') {
            delete control.dataset.vrodosRuntimeTargetDisabled;
            control.disabled = false;
            control.setAttribute('aria-disabled', 'false');
        }
    }

    function setContainerMuted(container, muted) {
        if (!container || !container.classList) return;

        container.classList.toggle('tw-opacity-60', muted);
    }

    function clearRuntimeTargetUI(controls) {
        RUNTIME_TARGET_OVERRIDDEN_CONTROLS.forEach((key) => setRuntimeTargetDisabled(controls[key], false));
        RUNTIME_TARGET_MUTED_CONTAINERS.forEach((key) => setContainerMuted(controls[key], false));
    }

    function applyRuntimeTargetUI(controls) {
        const headsetTarget = isVrHeadsetTarget(controls);

        if (!headsetTarget) {
            clearRuntimeTargetUI(controls);
        } else {
            RUNTIME_TARGET_OVERRIDDEN_CONTROLS.forEach((key) => setRuntimeTargetDisabled(controls[key], true));
            RUNTIME_TARGET_MUTED_CONTAINERS.forEach((key) => setContainerMuted(controls[key], true));
        }

        if (controls.vrHeadsetPolicyPanel) {
            controls.vrHeadsetPolicyPanel.style.display = headsetTarget ? '' : 'none';
        }

        if (controls.runtimeTargetHint) {
            controls.runtimeTargetHint.textContent = headsetTarget
                ? 'Applies the headset-safe runtime policy while preserving the authored desktop settings.'
                : 'Uses the authored desktop rendering pipeline without headset-specific overrides.';
        }
    }

    function updateEdgeAAStrengthLabel(controls) {
        if (!controls.edgeAAStrength || !controls.edgeAAStrengthValue) return;
        controls.edgeAAStrengthValue.textContent = getEdgeAAStrengthLabel(controls.edgeAAStrength.value);
    }

    function updateUI(controls, isPmndrs) {
        const legacyHorizonStageEnabled = !isPmndrs && isLegacyHorizonStageApplicable();

        if (controls.legacyHorizonStageSizeRow) {
            controls.legacyHorizonStageSizeRow.style.display = legacyHorizonStageEnabled ? '' : 'none';
        }
        if (controls.legacyHorizonStageSize) {
            controls.legacyHorizonStageSize.disabled = !legacyHorizonStageEnabled;
        }

        if (controls.aaQualityWrapper) {
            controls.aaQualityWrapper.style.display = isPmndrs ? 'none' : '';
        }
        if (controls.aaQuality) {
            controls.aaQuality.disabled = isPmndrs;
        }
    }

    function syncToScene(controls) {
        if (!VRODOS.editor.envir || !VRODOS.editor.envir.scene) return;

        VRODOS.editor.envir.scene.aframeVrRuntimeProfile = runtimeTargetToVrRuntimeProfile(controls.runtimeTarget ? controls.runtimeTarget.value : 'vr-headset');
        VRODOS.editor.envir.scene.aframeVrPmndrsComposerEnabled = false;
        VRODOS.editor.envir.scene.aframeVrSceneProbeEnabled = false;
        VRODOS.editor.envir.scene.aframeVrTakramSkyEnvironmentEnabled = false;
        VRODOS.editor.envir.scene.aframeVrCloudsEnabled = false;

        VRODOS.editor.envir.scene.aframeRenderQuality = normalizeRenderQuality(controls.renderQuality.value);
        VRODOS.editor.envir.scene.aframeShadowQuality = controls.shadowQuality.value || 'medium';
        VRODOS.editor.envir.scene.aframeAAQuality = normalizeAAQuality(controls.aaQuality.value);
        VRODOS.editor.envir.scene.aframeFPSMeterEnabled = controls.fpsMeter.checked === true;
        
        VRODOS.editor.envir.scene.aframeAmbientOcclusionPreset = normalizeAmbientOcclusionPreset(controls.ambientOcclusionPreset.value);
        VRODOS.editor.envir.scene.aframeContactShadowPreset = normalizeContactShadowPreset(controls.contactShadowPreset.value);
        
        if (controls.legacyHorizonStageSize) {
            VRODOS.editor.envir.scene.aframeLegacyHorizonStageSize = clampLegacyHorizonStageSize(controls.legacyHorizonStageSize.value);
        }
    }

    function updateValueLabels(controls) {
        if (controls.legacyHorizonStageSize && controls.legacyHorizonStageSizeValue) {
            controls.legacyHorizonStageSizeValue.textContent = String(clampLegacyHorizonStageSize(controls.legacyHorizonStageSize.value));
        }
        updateEdgeAAStrengthLabel(controls);
    }

    return {
        normalizeRenderQuality,
        normalizeAAQuality,
        normalizeAmbientOcclusionPreset,
        normalizeContactShadowPreset,
        normalizeRuntimeTarget,
        normalizeVrRuntimeProfile,
        runtimeTargetFromVrRuntimeProfile,
        runtimeTargetToVrRuntimeProfile,
        normalizeEdgeAAStrengthLevel,
        getEdgeAAStrengthLabel,
        clampLegacyHorizonStageSize,
        isVrHeadsetTarget,
        clearRuntimeTargetUI,
        applyRuntimeTargetUI,
        updateUI,
        syncToScene,
        updateValueLabels
    };

})();
