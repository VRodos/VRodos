/**
 * VRodos Compile Dialogue - General Rendering Module
 * Part of Phase 4 Refactoring: UI Componentization
 */

window.VRodosCompileUI = window.VRodosCompileUI || {};

VRodosCompileUI.General = (function () {

    const Shared = VRodosCompileUI.Shared;

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

    // --- UI Logic ---

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
        normalizeEdgeAAStrengthLevel,
        getEdgeAAStrengthLabel,
        clampLegacyHorizonStageSize,
        updateUI,
        syncToScene,
        updateValueLabels
    };

})();

