/**
 * VRodos Compile Dialogue - General Rendering Module
 * Part of Phase 4 Refactoring: UI Componentization
 */

window.VRodosCompileUI = window.VRodosCompileUI || {};

VRodosCompileUI.General = (function () {

    const Shared = VRodosCompileUI.Shared;

    // --- Normalization Helpers ---

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
        var numeric = parseInt(value, 10);
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
        if (typeof envir === 'undefined' || !envir.scene) return false;
        return parseInt(envir.scene.backgroundStyleOption, 10) === 0;
    }

    // --- UI Logic ---

    function updateEdgeAAStrengthLabel(controls) {
        if (!controls.edgeAAStrength || !controls.edgeAAStrengthValue) return;
        controls.edgeAAStrengthValue.textContent = getEdgeAAStrengthLabel(controls.edgeAAStrength.value);
    }

    function updateUI(controls, isPmndrs) {
        var legacyHorizonStageEnabled = !isPmndrs && isLegacyHorizonStageApplicable();

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
        if (!envir || !envir.scene) return;

        envir.scene.aframeRenderQuality = controls.renderQuality.value || 'standard';
        envir.scene.aframeShadowQuality = controls.shadowQuality.value || 'medium';
        envir.scene.aframeAAQuality = normalizeAAQuality(controls.aaQuality.value);
        envir.scene.aframeFPSMeterEnabled = controls.fpsMeter.checked === true;
        
        envir.scene.aframeAmbientOcclusionPreset = normalizeAmbientOcclusionPreset(controls.ambientOcclusionPreset.value);
        envir.scene.aframeContactShadowPreset = normalizeContactShadowPreset(controls.contactShadowPreset.value);
        
        if (controls.legacyHorizonStageSize) {
            envir.scene.aframeLegacyHorizonStageSize = clampLegacyHorizonStageSize(controls.legacyHorizonStageSize.value);
        }
    }

    function updateValueLabels(controls) {
        if (controls.legacyHorizonStageSize && controls.legacyHorizonStageSizeValue) {
            controls.legacyHorizonStageSizeValue.textContent = String(clampLegacyHorizonStageSize(controls.legacyHorizonStageSize.value));
        }
        updateEdgeAAStrengthLabel(controls);
    }

    return {
        normalizeAAQuality: normalizeAAQuality,
        normalizeAmbientOcclusionPreset: normalizeAmbientOcclusionPreset,
        normalizeContactShadowPreset: normalizeContactShadowPreset,
        normalizeEdgeAAStrengthLevel: normalizeEdgeAAStrengthLevel,
        getEdgeAAStrengthLabel: getEdgeAAStrengthLabel,
        clampLegacyHorizonStageSize: clampLegacyHorizonStageSize,
        updateUI: updateUI,
        syncToScene: syncToScene,
        updateValueLabels: updateValueLabels
    };

})();
