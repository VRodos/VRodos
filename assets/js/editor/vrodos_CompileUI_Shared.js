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
        atmosphereQuality: 'balanced',
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
