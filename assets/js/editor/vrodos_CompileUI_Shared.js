/**
 * VRodos Compile Dialogue - Shared Utilities & Constants
 * Part of Phase 4 Refactoring: UI Componentization
 */

window.VRodosCompileUI = window.VRodosCompileUI || {};

VRodosCompileUI.Shared = (function () {

    const PMNDRS_TWEAK_DEFAULTS = {
        aaMode: 'none',
        aaPreset: 'medium',
        bloomIntensity: 1.0,
        bloomThreshold: 0.62,
        toneMappingExposure: 1.0,
        vignetteEnabled: false,
        vignetteDarkness: 0.5,
        atmosphereEnabled: true,
        atmospherePreset: 'midday',
        atmospherePresetIntensity: 1.0,
        atmosphereQuality: 'balanced',
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

    function clampNumber(value, min, max, fallback) {
        var n = parseFloat(value);
        if (isNaN(n)) return fallback;
        if (n < min) return min;
        if (n > max) return max;
        return n;
    }

    function normalizeColorHex(value, fallback) {
        var raw = (typeof value === 'string') ? value.trim() : '';
        if (!/^#?[0-9a-fA-F]{6}$/.test(raw)) {
            return fallback;
        }
        return raw.charAt(0) === '#' ? raw.toLowerCase() : ('#' + raw.toLowerCase());
    }

    function formatNumber(value) {
        return (Math.round(value * 100) / 100).toFixed(2);
    }

    function formatRadius(value) {
        var n = parseFloat(value);
        if (isNaN(n)) n = 0;
        return n.toFixed(4);
    }

    function formatDegrees(value) {
        return String(Math.round(parseFloat(value) || 0)) + '\u00b0';
    }

    return {
        PMNDRS_TWEAK_DEFAULTS: PMNDRS_TWEAK_DEFAULTS,
        clampNumber: clampNumber,
        normalizeColorHex: normalizeColorHex,
        formatNumber: formatNumber,
        formatRadius: formatRadius,
        formatDegrees: formatDegrees
    };

})();
