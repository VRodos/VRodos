/**
 * Pure render-quality, shadow, AA, and VR budget decisions shared by runtime components.
 */
window.VRODOSMaster = window.VRODOSMaster || {};

(function () {
    const Master = window.VRODOSMaster;

    const CONTACT_SHADOW_SETTINGS = {
        off: {
            high: { bias: -0.00008, normalBias: 0.03, helperKeyIntensity: 0.88, helperFillIntensity: 0.38, helperPosition: '7 11 5' },
            medium: { bias: -0.00005, normalBias: 0.02, helperKeyIntensity: 0.84, helperFillIntensity: 0.34, helperPosition: '7 10 5' }
        },
        strong: {
            high: { bias: -0.00022, normalBias: 0.012, helperKeyIntensity: 1.02, helperFillIntensity: 0.28, helperPosition: '5.2 8.8 3.2' },
            medium: { bias: -0.00016, normalBias: 0.01, helperKeyIntensity: 0.96, helperFillIntensity: 0.3, helperPosition: '5.6 9.2 3.6' }
        },
        soft: {
            high: { bias: -0.00016, normalBias: 0.018, helperKeyIntensity: 0.94, helperFillIntensity: 0.34, helperPosition: '6 10 4' },
            medium: { bias: -0.0001, normalBias: 0.012, helperKeyIntensity: 0.9, helperFillIntensity: 0.32, helperPosition: '6.2 10 4.2' }
        }
    };

    function normalizeRenderQuality(renderQuality) {
        switch (renderQuality) {
            case 'high':
            case 'performance':
                return renderQuality;
            default:
                return 'standard';
        }
    }

    function effectiveShadowQuality(options) {
        const opts = options || {};
        if (opts.shadowsDisabled) {
            return 'off';
        }

        if (normalizeRenderQuality(opts.renderQuality) === 'performance') {
            return 'off';
        }

        switch (opts.shadowQuality) {
            case 'off':
                return 'off';
            case 'high':
                return opts.headsetProfile ? 'medium' : 'high';
            default:
                return 'medium';
        }
    }

    function normalizeAAQuality(aaQuality) {
        switch (aaQuality) {
            case 'off':
            case 'high':
            case 'ultra':
                return aaQuality;
            default:
                return 'balanced';
        }
    }

    function aaPixelRatioTarget(options) {
        const opts = options || {};
        if (normalizeRenderQuality(opts.renderQuality) !== 'high') {
            return 0;
        }

        switch (normalizeAAQuality(opts.aaQuality)) {
            case 'off':
                return 0;
            case 'high':
                return 1.35;
            case 'ultra':
                return 1.5;
            default:
                return 1.25;
        }
    }

    function aaSampleCount(aaQuality) {
        switch (normalizeAAQuality(aaQuality)) {
            case 'off':
                return 0;
            case 'high':
                return 4;
            case 'ultra':
                return 8;
            default:
                return 2;
        }
    }

    function normalizeContactShadowPreset(contactShadowPreset) {
        switch (contactShadowPreset) {
            case 'off':
            case 'strong':
                return contactShadowPreset;
            default:
                return 'soft';
        }
    }

    function contactShadowSettings(options) {
        const opts = options || {};
        const preset = normalizeContactShadowPreset(opts.preset);
        const quality = opts.shadowQuality === 'high' ? 'high' : 'medium';
        return Object.assign({}, CONTACT_SHADOW_SETTINGS[preset][quality]);
    }

    function clampNumber(value, fallback, min, max) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return fallback;
        }

        let number = parsed;
        if (Number.isFinite(min)) {
            number = Math.max(min, number);
        }
        if (Number.isFinite(max)) {
            number = Math.min(max, number);
        }
        return number;
    }

    function selectRenderBudgetOverride(candidates, options) {
        const opts = options || {};
        const list = Array.isArray(candidates) ? candidates : [];

        for (let i = 0; i < list.length; i += 1) {
            const candidate = list[i] || {};
            const rawNumber = Number(candidate.value);
            if (!Number.isFinite(rawNumber)) {
                continue;
            }
            if (typeof opts.autoBelowOrEqual === 'number' && rawNumber <= opts.autoBelowOrEqual) {
                continue;
            }
            if (typeof opts.autoBelow === 'number' && rawNumber < opts.autoBelow) {
                continue;
            }

            return {
                value: clampNumber(rawNumber, opts.fallback, opts.min, opts.max),
                source: candidate.source || 'unknown'
            };
        }

        return null;
    }

    function fallbackRenderProfileDefaults(profile) {
        switch (profile) {
            case 'headset':
                return {
                    framebufferScale: 1.0,
                    foveation: 0.5
                };
            case 'pc-rendered-vr':
                return {
                    framebufferScale: 1.0,
                    foveation: 0
                };
            default:
                return {
                    framebufferScale: 1.0,
                    foveation: 0.5
                };
        }
    }

    function renderProfileDefaults(profile) {
        if (Master.RuntimeProfilePolicy && typeof Master.RuntimeProfilePolicy.renderProfileDefaults === 'function') {
            return Master.RuntimeProfilePolicy.renderProfileDefaults(profile);
        }
        return fallbackRenderProfileDefaults(profile);
    }

    function renderBudgetPolicy(options) {
        const opts = options || {};
        const profile = opts.profile || 'desktop';
        const defaults = opts.defaults || renderProfileDefaults(profile);
        const framebufferScaleOverride = opts.framebufferScaleOverride || null;
        const foveationOverride = opts.foveationOverride || null;

        return {
            profile,
            framebufferScale: framebufferScaleOverride ? framebufferScaleOverride.value : defaults.framebufferScale,
            framebufferScaleSource: framebufferScaleOverride ? framebufferScaleOverride.source : 'profile',
            foveation: foveationOverride ? foveationOverride.value : defaults.foveation,
            foveationSource: foveationOverride ? foveationOverride.source : 'profile'
        };
    }

    Master.RuntimeRenderPolicy = {
        normalizeRenderQuality,
        effectiveShadowQuality,
        normalizeAAQuality,
        aaPixelRatioTarget,
        aaSampleCount,
        normalizeContactShadowPreset,
        contactShadowSettings,
        selectRenderBudgetOverride,
        renderBudgetPolicy
    };
}());
