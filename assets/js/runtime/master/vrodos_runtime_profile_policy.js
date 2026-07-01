/**
 * Pure runtime profile policy decisions shared by compiled-scene components.
 */
window.VRODOSMaster = window.VRODOSMaster || {};

(function () {
    const Master = window.VRODOSMaster;
    const RUNTIME_PROFILES = ['desktop', 'headset', 'pc-rendered-vr'];
    const LEGACY_HEADSET_PROFILES = ['baseline', 'safe', 'takram-lights', 'takram-sky', 'hdr-reflections', 'balanced', 'max'];

    function truthy(value) {
        return value === true || value === 'true' || value === '1' || value === 1;
    }

    function normalizeRuntimeProfile(profile) {
        const normalized = String(profile || '').toLowerCase();
        if (LEGACY_HEADSET_PROFILES.indexOf(normalized) !== -1) {
            return 'headset';
        }
        return RUNTIME_PROFILES.indexOf(normalized) !== -1 ? normalized : 'desktop';
    }

    function allowsCapability(profile, capability, authored) {
        const normalized = normalizeRuntimeProfile(profile);
        if (capability === 'nativeAntialias') {
            return normalized !== 'desktop';
        }
        if (normalized === 'desktop') {
            return Boolean(authored);
        }
        if (normalized === 'pc-rendered-vr') {
            return capability !== 'sceneOwned' && Boolean(authored);
        }
        if (capability === 'sceneOwned') {
            return false;
        }

        switch (capability) {
            case 'takramAtmosphere':
            case 'takramLights':
            case 'takramVisibleSky':
            case 'reflections':
            case 'hdrEnvMap':
                return Boolean(authored);
            case 'postProcessing':
            case 'pmndrsComposer':
            case 'sceneProbe':
            case 'takramSkyEnvironment':
            case 'clouds':
                return false;
            default:
                return false;
        }
    }

    function runtimeAllows(options) {
        const opts = options || {};
        const capability = opts.capability || '';
        if (
            (capability === 'postProcessing' || capability === 'pmndrsComposer') &&
            (opts.headsetPmndrsStereoComposerForced || opts.headsetPmndrsStereoComposerAuthored)
        ) {
            return Boolean(opts.authored);
        }

        return allowsCapability(opts.profile, capability, opts.authored);
    }

    function hdrFallbackPreset(profile) {
        const normalized = normalizeRuntimeProfile(profile);
        if (normalized === 'headset' || normalized === 'pc-rendered-vr') {
            return 'studio';
        }
        return 'none';
    }

    function usesNativeAntialias(profile) {
        return allowsCapability(profile, 'nativeAntialias', true);
    }

    function isHeadsetStereoPmndrsComposerAuthored(profile, data) {
        const normalized = normalizeRuntimeProfile(profile);
        const settings = data || {};
        return normalized === 'headset' &&
            settings.postFXEngine === 'pmndrs' &&
            settings.postFXEnabled !== '0' &&
            truthy(settings.vrHeadsetStereoPostFxEnabled);
    }

    function canUsePmndrsComposerOnHeadset(options) {
        const opts = options || {};
        return !opts.headsetBrowser ||
            Boolean(opts.headsetPmndrsComposerForced) ||
            Boolean(opts.headsetPmndrsStereoComposerForced) ||
            Boolean(opts.headsetPmndrsStereoComposerAuthored);
    }

    function renderProfileDefaults(profile) {
        switch (normalizeRuntimeProfile(profile)) {
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

    function runtimeFeaturePolicy(options) {
        const opts = options || {};
        const profile = normalizeRuntimeProfile(opts.profile);
        const authored = opts.authored || {};
        const profileActive = Boolean(opts.profileActive);
        const active = Boolean(opts.active);
        const postFXEngine = opts.postFXEngine || 'legacy';
        const headsetPmndrsStereoComposerAuthored = Boolean(opts.headsetPmndrsStereoComposerAuthored);
        const headsetPmndrsStereoComposerForced = Boolean(opts.headsetPmndrsStereoComposerForced);
        const headsetPmndrsComposerForced = Boolean(opts.headsetPmndrsComposerForced);
        const headsetBrowser = Boolean(opts.headsetBrowser);
        const pmndrsComposerAllowedOnHeadset = canUsePmndrsComposerOnHeadset({
            headsetBrowser,
            headsetPmndrsComposerForced,
            headsetPmndrsStereoComposerForced,
            headsetPmndrsStereoComposerAuthored
        });
        const allows = (capability, authoredValue) => runtimeAllows({
            profile,
            capability,
            authored: authoredValue,
            headsetPmndrsStereoComposerForced,
            headsetPmndrsStereoComposerAuthored
        });

        const takramVisibleSky = profileActive && allows('takramVisibleSky', authored.takramAtmosphere);
        const hdrReflections = profileActive && allows('hdrEnvMap', authored.hdrReflections);
        const pmndrsComposer = active &&
            profileActive &&
            postFXEngine === 'pmndrs' &&
            pmndrsComposerAllowedOnHeadset &&
            allows('pmndrsComposer', authored.pmndrsComposer);
        const sceneProbe = active &&
            profileActive &&
            allows('sceneProbe', authored.sceneProbe);
        const takramSkyEnvironment = active &&
            profileActive &&
            allows('takramSkyEnvironment', authored.takramSkyEnvironment);
        const clouds = active &&
            profileActive &&
            postFXEngine === 'pmndrs' &&
            allows('clouds', authored.clouds);

        return {
            profile,
            active,
            profileActive,
            headset: profile === 'headset',
            pcRenderedVr: profile === 'pc-rendered-vr',
            takramLightsOnly: false,
            takramVisibleSky,
            hdrReflections,
            sceneOwnedProfile: false,
            headsetBrowser,
            headsetPmndrsComposerForced,
            headsetPmndrsStereoComposerForced,
            headsetPmndrsStereoComposerAuthored,
            pmndrsComposer,
            sceneProbe,
            takramSkyEnvironment,
            clouds,
            renderBudget: opts.renderBudget || renderProfileDefaults(profile)
        };
    }

    Master.RuntimeProfilePolicy = {
        normalizeRuntimeProfile,
        allowsCapability,
        runtimeAllows,
        hdrFallbackPreset,
        usesNativeAntialias,
        isHeadsetStereoPmndrsComposerAuthored,
        canUsePmndrsComposerOnHeadset,
        renderProfileDefaults,
        runtimeFeaturePolicy
    };
}());
