/**
 * VRodos Compile Dialogue - Post-FX Module
 * Part of Phase 4 Refactoring: UI Componentization
 */

window.VRodosCompileUI = window.VRodosCompileUI || {};

VRodosCompileUI.PostFX = (function () {

    const Shared = VRodosCompileUI.Shared;

    // --- Normalization Helpers ---

    function normalizeEngine(value) {
        return value === 'pmndrs' ? 'pmndrs' : 'legacy';
    }

    function normalizeBloomStrength(value) {
        if (value === 'soft' || value === 'medium' || value === 'off') {
            return value;
        }
        return 'off';
    }

    function normalizeExposurePreset(value) {
        if (value === 'bright' || value === 'cinematic' || value === 'neutral') {
            return value;
        }
        return 'neutral';
    }

    function normalizeContrastPreset(value) {
        if (value === 'balanced' || value === 'high' || value === 'low') {
            return value;
        }
        return 'balanced';
    }

    function normalizeReflectionProfile(value) {
        if (value === 'soft' || value === 'balanced' || value === 'enhanced') {
            return value;
        }
        return 'balanced';
    }

    function normalizeReflectionSource(value) {
        if (value === 'hdr' || value === 'scene-probe') {
            return value;
        }
        return 'hdr';
    }

    function normalizeEnvMapPreset(value) {
        if (value === 'studio' || value === 'quarry' || value === 'venice') {
            return value;
        }
        return 'none';
    }

    function normalizeSSRStrength(value) {
        if (value === 'off' || value === 'subtle' || value === 'balanced' || value === 'strong') {
            return value;
        }
        return 'off';
    }

    function normalizePmndrsAAMode(value) {
        if (value === 'none' || value === 'smaa' || value === 'msaa') {
            return value;
        }
        return 'inherit';
    }

    function normalizePmndrsAAPreset(value) {
        if (value === 'low' || value === 'medium' || value === 'high' || value === 'ultra') {
            return value;
        }
        return 'inherit';
    }

    // --- UI State Management ---

    function updateUI(controls, postFxEnabled, isPmndrs, isBloomEnabled) {
        if (controls.universalPostFxGroup) {
            controls.universalPostFxGroup.style.display = postFxEnabled ? '' : 'none';
        }

        if (controls.engineControlsColumn) {
            controls.engineControlsColumn.style.display = postFxEnabled ? '' : 'none';
        }

        if (controls.legacyPane) {
            controls.legacyPane.style.display = (postFxEnabled && !isPmndrs) ? '' : 'none';
        }

        if (controls.pmndrsPane) {
            controls.pmndrsPane.style.display = (postFxEnabled && isPmndrs) ? '' : 'none';
        }

        // Engine Tabs Styling
        if (controls.postFxEngineTabLegacy) {
            controls.postFxEngineTabLegacy.classList.toggle('tw-tab-active', !isPmndrs);
        }
        if (controls.postFxEngineTabPmndrs) {
            controls.postFxEngineTabPmndrs.classList.toggle('tw-tab-active', isPmndrs);
        }

        // Badge and Hint update
        if (controls.postFxEngineHintBadge) {
            controls.postFxEngineHintBadge.textContent = isPmndrs ? 'Pmndrs Engine Active' : 'Legacy Engine Active';
            controls.postFxEngineHintBadge.className = isPmndrs 
                ? 'tw-badge tw-badge-primary tw-badge-sm tw-mb-2' 
                : 'tw-badge tw-badge-secondary tw-badge-sm tw-mb-2';
        }

        if (controls.postFxEngineHint) {
            controls.postFxEngineHint.textContent = isPmndrs
                ? 'Modern fused EffectPass. Choose PMNDRS anti-aliasing below with exclusive None, SMAA, or MSAA modes. SSR and Temporal AA are not available in this engine.'
                : 'Hand-rolled custom pipeline. Supports SSR and Temporal AA, no volumetric clouds.';
        }

        // Pmndrs specific toggles
        var pmndrsTweakEnabled = postFxEnabled && isPmndrs;
        
        if (controls.pmndrsBloomIntensity) {
            controls.pmndrsBloomIntensity.disabled = !pmndrsTweakEnabled || !isBloomEnabled;
            controls.pmndrsBloomIntensity.classList.toggle('tw-opacity-60', !isBloomEnabled);
        }

        if (controls.pmndrsBloomThreshold) {
            controls.pmndrsBloomThreshold.disabled = !pmndrsTweakEnabled || !isBloomEnabled;
            controls.pmndrsBloomThreshold.classList.toggle('tw-opacity-60', !isBloomEnabled);
        }

        if (controls.pmndrsExposure) {
            controls.pmndrsExposure.disabled = !pmndrsTweakEnabled;
        }

        var isPmndrsVignetteEnabled = controls.pmndrsVignette && controls.pmndrsVignette.checked;
        if (controls.pmndrsVignetteWrapper) {
            controls.pmndrsVignetteWrapper.style.display = isPmndrsVignetteEnabled ? '' : 'none';
        }
        if (controls.pmndrsVignette) {
            controls.pmndrsVignette.disabled = !pmndrsTweakEnabled;
        }
        if (controls.pmndrsVignetteDarkness) {
            controls.pmndrsVignetteDarkness.disabled = !pmndrsTweakEnabled || !isPmndrsVignetteEnabled;
        }
    }

    function updateValueLabels(controls) {
        if (controls.pmndrsBloomIntensity && controls.pmndrsBloomIntensityValue) {
            controls.pmndrsBloomIntensityValue.textContent = Shared.formatNumber(parseFloat(controls.pmndrsBloomIntensity.value));
        }
        if (controls.pmndrsBloomThreshold && controls.pmndrsBloomThresholdValue) {
            controls.pmndrsBloomThresholdValue.textContent = Shared.formatNumber(parseFloat(controls.pmndrsBloomThreshold.value));
        }
        if (controls.pmndrsExposure && controls.pmndrsExposureValue) {
            controls.pmndrsExposureValue.textContent = Shared.formatNumber(parseFloat(controls.pmndrsExposure.value));
        }
        if (controls.pmndrsVignetteDarkness && controls.pmndrsVignetteDarknessValue) {
            controls.pmndrsVignetteDarknessValue.textContent = Shared.formatNumber(parseFloat(controls.pmndrsVignetteDarkness.value));
        }
    }

    function syncToScene(controls) {
        if (!envir || !envir.scene) return;

        const d = Shared.PMNDRS_TWEAK_DEFAULTS;

        envir.scene.aframePostFXEnabled = controls.postFx.checked === true;
        envir.scene.aframePostFXColorEnabled = controls.postFxColor.checked === true;
        
        envir.scene.aframeBloomStrength = normalizeBloomStrength(controls.bloomStrength.value);
        envir.scene.aframePostFXBloomEnabled = envir.scene.aframeBloomStrength !== 'off';
        
        envir.scene.aframeExposurePreset = normalizeExposurePreset(controls.exposurePreset.value);
        envir.scene.aframeContrastPreset = normalizeContrastPreset(controls.contrastPreset.value);
        envir.scene.aframeReflectionProfile = normalizeReflectionProfile(controls.reflectionProfile.value);
        envir.scene.aframeReflectionSource = normalizeReflectionSource(controls.reflectionSource.value);
        envir.scene.aframeEnvMapPreset = normalizeEnvMapPreset(controls.envMapPreset.value);
        
        envir.scene.aframePostFXSSRStrength = normalizeSSRStrength(controls.ssrStrength.value);
        envir.scene.aframePostFXSSREnabled = envir.scene.aframePostFXSSRStrength !== 'off';
        
        envir.scene.aframePostFXTAAEnabled = controls.taaEnabled.checked === true;
        envir.scene.aframePostFXEngine = normalizeEngine(controls.postFxEngine.value);

        // Pmndrs específicos
        if (controls.pmndrsBloomIntensity) {
            envir.scene.aframePmndrsBloomIntensity = Shared.clampNumber(controls.pmndrsBloomIntensity.value, 0, 3, d.bloomIntensity);
        }
        if (controls.pmndrsBloomThreshold) {
            envir.scene.aframePmndrsBloomThreshold = Shared.clampNumber(controls.pmndrsBloomThreshold.value, 0, 1, d.bloomThreshold);
        }
        if (controls.pmndrsExposure) {
            envir.scene.aframePmndrsToneMappingExposure = Shared.clampNumber(controls.pmndrsExposure.value, 0.3, 2.5, d.toneMappingExposure);
        }
        if (controls.pmndrsVignette) {
            envir.scene.aframePmndrsVignetteEnabled = controls.pmndrsVignette.checked === true;
        }
        if (controls.pmndrsVignetteDarkness) {
            envir.scene.aframePmndrsVignetteDarkness = Shared.clampNumber(controls.pmndrsVignetteDarkness.value, 0, 1, d.vignetteDarkness);
        }
    }

    return {
        normalizeEngine: normalizeEngine,
        normalizeBloomStrength: normalizeBloomStrength,
        normalizeExposurePreset: normalizeExposurePreset,
        normalizeContrastPreset: normalizeContrastPreset,
        normalizeReflectionProfile: normalizeReflectionProfile,
        normalizeReflectionSource: normalizeReflectionSource,
        normalizeEnvMapPreset: normalizeEnvMapPreset,
        normalizeSSRStrength: normalizeSSRStrength,
        normalizePmndrsAAMode: normalizePmndrsAAMode,
        normalizePmndrsAAPreset: normalizePmndrsAAPreset,
        updateUI: updateUI,
        updateValueLabels: updateValueLabels,
        syncToScene: syncToScene
    };

})();
