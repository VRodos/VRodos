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
        if (value === 'soft' || value === 'balanced' || value === 'punchy') {
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

    function normalizeSceneProbeUpdateMode(value) {
        return value === 'slow-dynamic' ? 'slow-dynamic' : 'static';
    }

    function normalizeSceneProbeResolution(value) {
        const normalized = String(value);
        if (normalized === '64' || normalized === '128' || normalized === '256') {
            return normalized;
        }
        return '128';
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

    function normalizePmndrsLutLook(value) {
        if (value === 'neutral' || value === 'warm-film' || value === 'cool-clarity' || value === 'cinematic-contrast' || value === 'soft-fade') {
            return value;
        }
        return 'neutral';
    }

    function normalizePmndrsToneMappingMode(value) {
        if (value === 'agx' || value === 'reinhard' || value === 'cineon' || value === 'aces-filmic' || value === 'linear') {
            return value;
        }
        return 'agx';
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
        const pmndrsTweakEnabled = postFxEnabled && isPmndrs;
        
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
        if (controls.pmndrsToneMapping) {
            controls.pmndrsToneMapping.disabled = !pmndrsTweakEnabled;
        }
        if (controls.pmndrsLensFlare) {
            controls.pmndrsLensFlare.disabled = !pmndrsTweakEnabled;
        }

        const isPmndrsLutEnabled = controls.pmndrsLut && controls.pmndrsLut.checked;
        if (controls.pmndrsLutWrapper) {
            controls.pmndrsLutWrapper.style.display = isPmndrsLutEnabled ? '' : 'none';
        }
        if (controls.pmndrsLut) {
            controls.pmndrsLut.disabled = !pmndrsTweakEnabled;
        }
        if (controls.pmndrsLutLook) {
            controls.pmndrsLutLook.disabled = !pmndrsTweakEnabled || !isPmndrsLutEnabled;
        }
        if (controls.pmndrsLutStrength) {
            controls.pmndrsLutStrength.disabled = !pmndrsTweakEnabled || !isPmndrsLutEnabled;
        }

        const isPmndrsVignetteEnabled = controls.pmndrsVignette && controls.pmndrsVignette.checked;
        if (controls.pmndrsVignetteWrapper) {
            controls.pmndrsVignetteWrapper.style.display = isPmndrsVignetteEnabled ? '' : 'none';
        }
        if (controls.pmndrsVignette) {
            controls.pmndrsVignette.disabled = !pmndrsTweakEnabled;
        }
        if (controls.pmndrsVignetteDarkness) {
            controls.pmndrsVignetteDarkness.disabled = !pmndrsTweakEnabled || !isPmndrsVignetteEnabled;
        }

        const isPmndrsNoiseEnabled = controls.pmndrsNoise && controls.pmndrsNoise.checked;
        if (controls.pmndrsNoiseWrapper) {
            controls.pmndrsNoiseWrapper.style.display = isPmndrsNoiseEnabled ? '' : 'none';
        }
        if (controls.pmndrsNoise) {
            controls.pmndrsNoise.disabled = !pmndrsTweakEnabled;
        }
        if (controls.pmndrsNoiseOpacity) {
            controls.pmndrsNoiseOpacity.disabled = !pmndrsTweakEnabled || !isPmndrsNoiseEnabled;
        }

        const isPmndrsChromaticAberrationEnabled = controls.pmndrsChromaticAberration && controls.pmndrsChromaticAberration.checked;
        if (controls.pmndrsChromaticAberrationWrapper) {
            controls.pmndrsChromaticAberrationWrapper.style.display = isPmndrsChromaticAberrationEnabled ? '' : 'none';
        }
        if (controls.pmndrsChromaticAberration) {
            controls.pmndrsChromaticAberration.disabled = !pmndrsTweakEnabled;
        }
        if (controls.pmndrsChromaticAberrationOffset) {
            controls.pmndrsChromaticAberrationOffset.disabled = !pmndrsTweakEnabled || !isPmndrsChromaticAberrationEnabled;
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
        if (controls.pmndrsLutStrength && controls.pmndrsLutStrengthValue) {
            controls.pmndrsLutStrengthValue.textContent = Shared.formatNumber(parseFloat(controls.pmndrsLutStrength.value));
        }
        if (controls.pmndrsVignetteDarkness && controls.pmndrsVignetteDarknessValue) {
            controls.pmndrsVignetteDarknessValue.textContent = Shared.formatNumber(parseFloat(controls.pmndrsVignetteDarkness.value));
        }
        if (controls.pmndrsNoiseOpacity && controls.pmndrsNoiseOpacityValue) {
            controls.pmndrsNoiseOpacityValue.textContent = Shared.formatNumber(parseFloat(controls.pmndrsNoiseOpacity.value));
        }
        if (controls.pmndrsChromaticAberrationOffset && controls.pmndrsChromaticAberrationOffsetValue) {
            controls.pmndrsChromaticAberrationOffsetValue.textContent = Shared.formatRadius(parseFloat(controls.pmndrsChromaticAberrationOffset.value));
        }
    }

    function syncToScene(controls) {
        if (!VRODOS.editor.envir || !VRODOS.editor.envir.scene) return;

        const d = Shared.PMNDRS_TWEAK_DEFAULTS;

        const postFxEnabled = controls.postFx.checked === true;

        VRODOS.editor.envir.scene.aframePostFXEnabled = postFxEnabled;
        VRODOS.editor.envir.scene.aframePostFXColorEnabled = controls.postFxColor.checked === true;
        
        VRODOS.editor.envir.scene.aframeBloomStrength = normalizeBloomStrength(controls.bloomStrength.value);
        VRODOS.editor.envir.scene.aframePostFXBloomEnabled = VRODOS.editor.envir.scene.aframeBloomStrength !== 'off';
        
        VRODOS.editor.envir.scene.aframeExposurePreset = normalizeExposurePreset(controls.exposurePreset.value);
        VRODOS.editor.envir.scene.aframeContrastPreset = normalizeContrastPreset(controls.contrastPreset.value);
        if (controls.reflectionsEnabled) {
            VRODOS.editor.envir.scene.aframeReflectionsEnabled = controls.reflectionsEnabled.checked === true;
        }
        VRODOS.editor.envir.scene.aframeReflectionProfile = normalizeReflectionProfile(controls.reflectionProfile.value);
        VRODOS.editor.envir.scene.aframeReflectionSource = normalizeReflectionSource(controls.reflectionSource.value);
        if (controls.sceneProbeUpdateMode) {
            VRODOS.editor.envir.scene.aframeSceneProbeUpdateMode = normalizeSceneProbeUpdateMode(controls.sceneProbeUpdateMode.value);
        }
        if (controls.sceneProbeResolution) {
            VRODOS.editor.envir.scene.aframeSceneProbeResolution = normalizeSceneProbeResolution(controls.sceneProbeResolution.value);
        }
        VRODOS.editor.envir.scene.aframeEnvMapPreset = normalizeEnvMapPreset(controls.envMapPreset.value);
        
        VRODOS.editor.envir.scene.aframePostFXSSRStrength = normalizeSSRStrength(controls.ssrStrength.value);
        VRODOS.editor.envir.scene.aframePostFXSSREnabled = VRODOS.editor.envir.scene.aframePostFXSSRStrength !== 'off';
        
        VRODOS.editor.envir.scene.aframePostFXTAAEnabled = controls.taaEnabled.checked === true;
        VRODOS.editor.envir.scene.aframePostFXEngine = postFxEnabled ? normalizeEngine(controls.postFxEngine.value) : 'legacy';

        // Pmndrs específicos
        if (controls.pmndrsBloomIntensity) {
            VRODOS.editor.envir.scene.aframePmndrsBloomIntensity = Shared.clampNumber(controls.pmndrsBloomIntensity.value, 0, 3, d.bloomIntensity);
        }
        if (controls.pmndrsBloomThreshold) {
            VRODOS.editor.envir.scene.aframePmndrsBloomThreshold = Shared.clampNumber(controls.pmndrsBloomThreshold.value, 0, 1, d.bloomThreshold);
        }
        if (controls.pmndrsExposure) {
            VRODOS.editor.envir.scene.aframePmndrsToneMappingExposure = Shared.clampNumber(controls.pmndrsExposure.value, 0.1, 5, d.toneMappingExposure, 0.1);
        }
        if (controls.pmndrsToneMapping) {
            VRODOS.editor.envir.scene.aframePmndrsToneMappingMode = normalizePmndrsToneMappingMode(controls.pmndrsToneMapping.value);
        }
        if (controls.pmndrsLensFlare) {
            VRODOS.editor.envir.scene.aframePmndrsLensFlareEnabled = controls.pmndrsLensFlare.checked === true;
        }
        if (controls.pmndrsLut) {
            VRODOS.editor.envir.scene.aframePmndrsLutEnabled = controls.pmndrsLut.checked === true;
        }
        if (controls.pmndrsLutLook) {
            VRODOS.editor.envir.scene.aframePmndrsLutLook = normalizePmndrsLutLook(controls.pmndrsLutLook.value);
        }
        if (controls.pmndrsLutStrength) {
            VRODOS.editor.envir.scene.aframePmndrsLutStrength = Shared.clampNumber(controls.pmndrsLutStrength.value, 0, 1, d.lutStrength);
        }
        if (controls.pmndrsVignette) {
            VRODOS.editor.envir.scene.aframePmndrsVignetteEnabled = controls.pmndrsVignette.checked === true;
        }
        if (controls.pmndrsVignetteDarkness) {
            VRODOS.editor.envir.scene.aframePmndrsVignetteDarkness = Shared.clampNumber(controls.pmndrsVignetteDarkness.value, 0, 1, d.vignetteDarkness);
        }
        if (controls.pmndrsNoise) {
            VRODOS.editor.envir.scene.aframePmndrsNoiseEnabled = controls.pmndrsNoise.checked === true;
        }
        if (controls.pmndrsNoiseOpacity) {
            VRODOS.editor.envir.scene.aframePmndrsNoiseOpacity = Shared.clampNumber(controls.pmndrsNoiseOpacity.value, 0, 0.2, d.noiseOpacity);
        }
        if (controls.pmndrsChromaticAberration) {
            VRODOS.editor.envir.scene.aframePmndrsChromaticAberrationEnabled = controls.pmndrsChromaticAberration.checked === true;
        }
        if (controls.pmndrsChromaticAberrationOffset) {
            VRODOS.editor.envir.scene.aframePmndrsChromaticAberrationOffset = Shared.clampNumber(controls.pmndrsChromaticAberrationOffset.value, 0, 0.006, d.chromaticAberrationOffset);
        }
    }

    return {
        normalizeEngine,
        normalizeBloomStrength,
        normalizeExposurePreset,
        normalizeContrastPreset,
        normalizeReflectionProfile,
        normalizeReflectionSource,
        normalizeSceneProbeUpdateMode,
        normalizeSceneProbeResolution,
        normalizeEnvMapPreset,
        normalizeSSRStrength,
        normalizePmndrsAAMode,
        normalizePmndrsAAPreset,
        normalizePmndrsLutLook,
        normalizePmndrsToneMappingMode,
        updateUI,
        updateValueLabels,
        syncToScene
    };

})();

