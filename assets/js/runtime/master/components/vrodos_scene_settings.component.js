/**
 * VRodos Master Scene Settings Component
 */

window.VRODOSMaster = window.VRODOSMaster || {};
const VRODOSSceneSettingsMaster = window.VRODOSMaster;
const VRODOSRuntimeSettingsContract = window.VRODOS_RUNTIME_SETTINGS_CONTRACT || { sceneSettings: {} };
const VRODOSRuntimeSettings = VRODOSSceneSettingsMaster.RuntimeSettings || {};

function vrodosSceneSettingDefault(key, fallback) {
    if (VRODOSRuntimeSettings.defaultString) {
        return VRODOSRuntimeSettings.defaultString(key, fallback);
    }

    const setting = VRODOSRuntimeSettingsContract.sceneSettings && VRODOSRuntimeSettingsContract.sceneSettings[key];
    if (!setting || setting.default === undefined) {
        return fallback;
    }
    if (typeof setting.default === 'boolean') {
        return setting.default ? '1' : '0';
    }
    return String(setting.default);
}

function vrodosRuntimeDebugFlag(debugKey, queryKey) {
    if (window.VRODOS_DEBUG && window.VRODOS_DEBUG[debugKey] === true) {
        return true;
    }

    if (typeof window.location === 'undefined' || !window.location.search) {
        return false;
    }

    try {
        const params = new URLSearchParams(window.location.search);
        return params.get(queryKey) === '1';
    } catch (err) {
        return false;
    }
}

function vrodosRuntimeQueryValue(queryKey) {
    if (typeof window.location === 'undefined' || !window.location.search) {
        return null;
    }

    try {
        const params = new URLSearchParams(window.location.search);
        return params.get(queryKey);
    } catch (err) {
        return null;
    }
}

function vrodosRuntimeNowMs() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function')
        ? performance.now()
        : Date.now();
}

function vrodosRuntimeFeatureStateSignature(state) {
    try {
        return JSON.stringify(state || {});
    } catch (err) {
        return '';
    }
}

function vrodosRuntimeTruthy(value) {
    if (VRODOSRuntimeSettings.bool) {
        return VRODOSRuntimeSettings.bool(value, false);
    }

    return value === true || value === 'true' || value === '1' || value === 1;
}

function vrodosRuntimeNumber(value, fallback, min, max) {
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

function vrodosRuntimeNoop() {
    return undefined;
}

function vrodosRuntimeFalse() {
    return false;
}

function vrodosDisposeRuntimeResource(resource) {
    if (VRODOSSceneSettingsMaster.RuntimeResources && VRODOSSceneSettingsMaster.RuntimeResources.dispose) {
        VRODOSSceneSettingsMaster.RuntimeResources.dispose(resource);
        return;
    }
    if (resource && typeof resource.dispose === 'function') {
        resource.dispose();
    }
}

function vrodosRuntimeSettingsDefaultsForPrefix(prefix) {
    const defaults = {};
    const generatedDefaults = window.VRODOS_RUNTIME_SETTINGS_SCHEMA_DEFAULTS || {};
    const contractSettings = VRODOSRuntimeSettingsContract.sceneSettings || {};

    Object.keys(contractSettings).forEach((key) => {
        if (key.indexOf(prefix) !== 0) {
            return;
        }
        defaults[key] = Object.prototype.hasOwnProperty.call(generatedDefaults, key)
            ? generatedDefaults[key]
            : vrodosSceneSettingDefault(key, '');
    });

    return defaults;
}

const VRODOS_PMNDRS_SCHEMA_DEFAULTS = vrodosRuntimeSettingsDefaultsForPrefix('pmndrs');

function vrodosRuntimeStringSchema(defaults) {
    if (VRODOSRuntimeSettings.schemaStringMap) {
        return VRODOSRuntimeSettings.schemaStringMap(defaults);
    }

    const schema = {};
    Object.keys(defaults || {}).forEach((key) => {
        schema[key] = { type: "string", default: vrodosSceneSettingDefault(key, defaults[key]) };
    });
    return schema;
}

AFRAME.registerComponent('scene-settings', {
    schema: Object.assign({
        color: { type: "string", default: "#ffffff" },
        pr_type: { type: "string", default: "default" },
        img_link: { type: "string", default: "no_link" },
        selChoice: { type: "string", default: "0" },
        presChoice: { type: "string", default: "default" },
        presetGroundEnabled: { type: "string", default: "1" },
        movement_disabled: { type: "string", default: "0" },
        runtimeMode: { type: "string", default: "networked" },
        collisionMode: { type: "string", default: "auto" },
        navigationMode: { type: "string", default: vrodosSceneSettingDefault("navigationMode", "walkable") },
        renderQuality: { type: "string", default: "standard" },
        shadowQuality: { type: "string", default: "medium" },
        shadowUpdateMode: { type: "string", default: vrodosSceneSettingDefault("shadowUpdateMode", "static") },
        flatMediaShadowCasting: { type: "string", default: vrodosSceneSettingDefault("flatMediaShadowCasting", "1") },
        rootShadowType: { type: "string", default: "pcf" },
        aaQuality: { type: "string", default: "balanced" },
        fpsMeterEnabled: { type: "string", default: "0" },
        vrRuntimeProfile: { type: "string", default: vrodosSceneSettingDefault("vrRuntimeProfile", "baseline") },
        vrFramebufferScale: { type: "string", default: vrodosSceneSettingDefault("vrFramebufferScale", "0") },
        vrFoveationStrength: { type: "string", default: vrodosSceneSettingDefault("vrFoveationStrength", "-1") },
        vrPmndrsComposerEnabled: { type: "string", default: vrodosSceneSettingDefault("vrPmndrsComposerEnabled", "0") },
        vrSceneProbeEnabled: { type: "string", default: vrodosSceneSettingDefault("vrSceneProbeEnabled", "0") },
        vrTakramSkyEnvironmentEnabled: { type: "string", default: vrodosSceneSettingDefault("vrTakramSkyEnvironmentEnabled", "0") },
        vrCloudsEnabled: { type: "string", default: vrodosSceneSettingDefault("vrCloudsEnabled", "0") },
        legacyHorizonStageSize: { type: "string", default: "5000" },
        ambientOcclusionPreset: { type: "string", default: "balanced" },
        contactShadowPreset: { type: "string", default: "soft" },
        postFXEnabled: { type: "string", default: "0" },
        postFXBloomEnabled: { type: "string", default: "0" },
        postFXColorEnabled: { type: "string", default: "1" },
        postFXVignetteEnabled: { type: "string", default: "0" },
        postFXEdgeAAEnabled: { type: "string", default: "1" },
        postFXEdgeAAStrength: { type: "string", default: "3" },
        bloomStrength: { type: "string", default: "off" },
        exposurePreset: { type: "string", default: "neutral" },
        contrastPreset: { type: "string", default: "balanced" },
        reflectionsEnabled: { type: "string", default: vrodosSceneSettingDefault("reflectionsEnabled", "1") },
        reflectionProfile: { type: "string", default: "balanced" },
        reflectionSource: { type: "string", default: "hdr" },
        sceneProbeUpdateMode: { type: "string", default: vrodosSceneSettingDefault("sceneProbeUpdateMode", "static") },
        sceneProbeResolution: { type: "string", default: vrodosSceneSettingDefault("sceneProbeResolution", "128") },
        reflectionOcclusionMode: { type: "string", default: vrodosSceneSettingDefault("reflectionOcclusionMode", "auto") },
        horizonSkyPreset: { type: "string", default: "natural" },
        envMapPreset: { type: "string", default: "none" },
        cam_position: { type: "string", default: "0 1.6 0" },
        cam_rotation_y: { type: "string", default: "0" },
        avatar_enabled: { type: "string", default: "0" },
        public_chat: { type: "string", default: "0" },
        fogCategory: { type: "string", default: "0" },
        fogcolor: { type: "string", default: "#ffffff" },
        fogfar: { type: "string", default: "1000" },
        fognear: { type: "string", default: "0" },
        fogdensity: { type: "string", default: "0.00000001" },
        postFXTAAEnabled: { type: "string", default: "0" },
        postFXSSREnabled: { type: "string", default: "0" },
        postFXSSRStrength: { type: "string", default: "balanced" },
        // Post-processing engine selector — 'legacy' = vrodos_postprocessing.js (custom
        // SAO/SSR/TAA composite), 'pmndrs' = vrodos_postprocessing_pmndrs.js (pmndrs
        // EffectComposer with fused EffectPass; supports clouds in Phase 5 but no
        // SSR/TRAA). Default 'legacy' for v1 — flips to 'pmndrs' once Phase 3 confirms
        // visual parity. See POSTPROCESSING_MIGRATION_PLAN.md §11.
        postFXEngine: { type: "string", default: "legacy" }
    }, vrodosRuntimeStringSchema(VRODOS_PMNDRS_SCHEMA_DEFAULTS)),
    getSSRStrengthValue: function () {
        switch (this.data.postFXSSRStrength) {
            case 'subtle': return 0.3;
            case 'balanced': return 0.6;
            case 'strong': return 0.9;
            default: return 0.0;
        }
    },
    getBloomStrengthValue: function () {
        switch (this.data.bloomStrength) {
            case 'medium':
                return 0.35;
            case 'soft':
                return 0.15;
            default:
                return 0.0;
        }
    },
    getRenderQualityLevel: function () {
        switch (this.data.renderQuality) {
            case 'high':
            case 'performance':
                return this.data.renderQuality;
            default:
                return 'standard';
        }
    },
    getEffectiveShadowQuality: function () {
        if (vrodosRuntimeDebugFlag('disableShadows', 'vrodos_debug_disable_shadows')) {
            return 'off';
        }

        if (this.getRenderQualityLevel() === 'performance') {
            return 'off';
        }

        switch (this.data.shadowQuality) {
            case 'off':
            case 'high':
                return this.data.shadowQuality;
            default:
                return 'medium';
        }
    },
    getAAQualityLevel: function () {
        switch (this.data.aaQuality) {
            case 'off':
            case 'high':
            case 'ultra':
                return this.data.aaQuality;
            default:
                return 'balanced';
        }
    },
    getAAQualityPixelRatioTarget: function () {
        if (this.getRenderQualityLevel() !== 'high') {
            return 0;
        }

        switch (this.getAAQualityLevel()) {
            case 'off':
                return 0;
            case 'high':
                return 1.35;
            case 'ultra':
                return 1.5;
            default:
                return 1.25;
        }
    },
    getAAQualitySampleCount: function () {
        switch (this.getAAQualityLevel()) {
            case 'off':
                return 0;
            case 'high':
                return 4;
            case 'ultra':
                return 8;
            default:
                return 2;
        }
    },
    getAmbientOcclusionPreset: function () {
        if (this.data.postFXEngine === 'pmndrs' && vrodosRuntimeDebugFlag('disablePmndrsAo', 'vrodos_debug_disable_pmndrs_ao')) {
            return 'off';
        }

        switch (this.data.ambientOcclusionPreset) {
            case 'off':
            case 'soft':
            case 'strong':
                return this.data.ambientOcclusionPreset;
            default:
                return 'balanced';
        }
    },
    // Halton low-discrepancy sequence for TAA jitter
    _halton: function (index, base) {
        let result = 0;
        let f = 1.0 / base;
        let i = index;
        while (i > 0) {
            result += f * (i % base);
            i = Math.floor(i / base);
            f /= base;
        }
        return result;
    },
    getSAOParams: function () {
        const preset = this.getAmbientOcclusionPreset();
        switch (preset) {
            case 'soft':
                return { numSamples: 8, numRings: 3, intensity: 0.25, kernelRadius: 10, bias: 0.02, depthCutoff: 0.005, maxDistance: 60 };
            case 'balanced':
                return { numSamples: 16, numRings: 4, intensity: 0.35, kernelRadius: 14, bias: 0.01, depthCutoff: 0.005, maxDistance: 80 };
            case 'strong':
                return { numSamples: 24, numRings: 5, intensity: 0.5, kernelRadius: 18, bias: 0.005, depthCutoff: 0.005, maxDistance: 120 };
            default:
                return null;
        }
    },
    getContactShadowPreset: function () {
        switch (this.data.contactShadowPreset) {
            case 'off':
            case 'strong':
                return this.data.contactShadowPreset;
            default:
                return 'soft';
        }
    },
    getHorizonSkyPreset: function () {
        switch (this.data.horizonSkyPreset) {
            case 'clear':
            case 'crisp':
                return this.data.horizonSkyPreset;
            default:
                return 'natural';
        }
    },
    getEnvMapPath: function () {
        const map = {
            studio: 'spot1Lux.hdr',
            quarry: 'quarry_01_1k.hdr',
            venice: 'venice_sunset_1k.hdr'
        };
        return map[this.data.envMapPreset] || null;
    },
    getPmndrsAtmosphereQuality: function () {
        if (this.getRenderQualityLevel() === 'performance') {
            return 'performance';
        }

        const authoredQuality = this.data.pmndrsAtmosphereQuality;
        if (this.getRenderQualityLevel() === 'standard' && (authoredQuality === 'quality' || authoredQuality === 'cinematic')) {
            return 'balanced';
        }

        switch (authoredQuality) {
            case 'performance':
            case 'balanced':
            case 'quality':
            case 'cinematic':
                return authoredQuality;
            default:
                return 'balanced';
        }
    },
    getPmndrsAAMode: function () {
        if (this.getRenderQualityLevel() === 'performance') {
            return 'none';
        }

        if (vrodosRuntimeDebugFlag('disablePmndrsAa', 'vrodos_debug_disable_pmndrs_aa')) {
            return 'none';
        }

        let mode = this.getAAQualityLevel() === 'off' ? 'none' : 'msaa';
        switch (this.data.pmndrsAAMode) {
            case 'none':
            case 'smaa':
            case 'msaa':
                mode = this.data.pmndrsAAMode;
                break;
            default:
                break;
        }

        if (mode === 'smaa' && vrodosRuntimeDebugFlag('disablePmndrsSmaa', 'vrodos_debug_disable_pmndrs_smaa')) {
            return 'none';
        }
        if (mode === 'msaa' && vrodosRuntimeDebugFlag('disablePmndrsMsaa', 'vrodos_debug_disable_pmndrs_msaa')) {
            return 'none';
        }

        return mode;
    },
    getPmndrsAAPreset: function () {
        if (this.getRenderQualityLevel() === 'performance') {
            return 'low';
        }

        switch (this.data.pmndrsAAPreset) {
            case 'low':
            case 'medium':
            case 'high':
            case 'ultra':
                return this.data.pmndrsAAPreset;
            default:
                switch (this.getAAQualityLevel()) {
                    case 'high':
                        return 'high';
                    case 'ultra':
                        return 'ultra';
                    case 'off':
                    case 'balanced':
                    default:
                        return 'medium';
                }
        }
    },
    isPmndrsLutEnabled: function () {
        return this.getRenderQualityLevel() === 'high' &&
            this.data.postFXEngine === 'pmndrs' &&
            vrodosRuntimeTruthy(this.data.pmndrsLutEnabled);
    },
    isPmndrsLensFlareEnabled: function () {
        if (vrodosRuntimeDebugFlag('disablePmndrsLensFlare', 'vrodos_debug_disable_pmndrs_lens_flare')) {
            return false;
        }

        return this.getRenderQualityLevel() === 'high' &&
            this.data.postFXEngine === 'pmndrs' &&
            vrodosRuntimeTruthy(this.data.pmndrsLensFlareEnabled);
    },
    isPmndrsAtmosphereEnabled: function () {
        return this.data.postFXEngine === 'pmndrs' && this.data.pmndrsAtmosphereEnabled !== '0';
    },
    isPmndrsAerialPerspectiveEffectEnabled: function () {
        return this.data.postFXEngine === 'pmndrs' &&
            (vrodosRuntimeTruthy(this.data.pmndrsAerialPerspectiveEnabled) ||
                vrodosRuntimeDebugFlag('enablePmndrsHorizonAerial', 'vrodos_debug_enable_pmndrs_horizon_aerial'));
    },
    isPmndrsCloudsEnabled: function () {
        return this.getRenderQualityLevel() === 'high' &&
            this.data.postFXEngine === 'pmndrs' &&
            this.data.postFXEnabled !== '0' &&
            this.isPmndrsAtmosphereEnabled() &&
            vrodosRuntimeTruthy(this.data.pmndrsCloudsEnabled);
    },
    getReflectionSource: function () {
        return this.data.reflectionSource === 'scene-probe' ? 'scene-probe' : 'hdr';
    },
    getSceneProbeUpdateMode: function () {
        return this.data.sceneProbeUpdateMode === 'slow-dynamic' ? 'slow-dynamic' : 'static';
    },
    getSceneProbeResolution: function () {
        switch (String(this.data.sceneProbeResolution || '128')) {
            case '64':
                return 64;
            case '256':
                return 256;
            default:
                return 128;
        }
    },
    areReflectionsEnabled: function () {
        return !(this.data.reflectionsEnabled === false ||
            this.data.reflectionsEnabled === 'false' ||
            this.data.reflectionsEnabled === '0' ||
            this.data.reflectionsEnabled === 0);
    },
    isImmersiveXrActive: function () {
        return Boolean(this.el.renderer && this.el.renderer.xr && this.el.renderer.xr.isPresenting);
    },
    isAFrameVrModeActive: function () {
        return Boolean(this.el.is && this.el.is('vr-mode'));
    },
    isDirectVrPresentationActive: function () {
        return this.isImmersiveXrActive();
    },
    isDocumentFullscreenActive: function () {
        return Boolean(document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement);
    },
    getPresentationMode: function () {
        if (this.isImmersiveXrActive()) {
            return 'immersive-xr';
        }

        if (this.isAFrameVrModeActive() || this.isDocumentFullscreenActive()) {
            return 'desktop-fullscreen';
        }

        return 'inline';
    },
    isVrPresentationActive: function () {
        return this.isImmersiveXrActive() || this.isAFrameVrModeActive();
    },
    isMobileDevice: function () {
        return Boolean(AFRAME.utils &&
            AFRAME.utils.device &&
            typeof AFRAME.utils.device.isMobile === 'function' &&
            AFRAME.utils.device.isMobile());
    },
    isHeadsetBrowserDevice: function () {
        if (typeof navigator === 'undefined' || !navigator.userAgent) {
            return false;
        }

        return /OculusBrowser|Quest\s*\d*|Meta Quest|VR Safari/i.test(navigator.userAgent);
    },
    isHeadsetPmndrsComposerForceEnabled: function () {
        return vrodosRuntimeDebugFlag('forceHeadsetPmndrsComposer', 'vrodos_force_headset_pmndrs_composer') ||
            vrodosRuntimeDebugFlag('forceXrPmndrsComposer', 'vrodos_force_xr_pmndrs_composer');
    },
    canUsePmndrsComposerOnHeadset: function () {
        return !this.isHeadsetBrowserDevice() || this.isHeadsetPmndrsComposerForceEnabled();
    },
    getVrRuntimeProfile: function () {
        const debugConfig = window.VRODOS_DEBUG || {};
        const override = (typeof debugConfig.vrRuntimeProfile === 'string' && debugConfig.vrRuntimeProfile) ||
            (typeof debugConfig.vrProfile === 'string' && debugConfig.vrProfile) ||
            vrodosRuntimeQueryValue('vrodos_vr_profile');
        const rawProfile = String(override || this.data.vrRuntimeProfile || 'baseline').toLowerCase();

        switch (rawProfile) {
            case 'desktop':
            case 'baseline':
            case 'safe':
            case 'balanced':
            case 'max':
                return rawProfile;
            default:
                return 'baseline';
        }
    },
    isVrRuntimePolicyActive: function () {
        if (this.getVrRuntimeProfile() === 'desktop') {
            return false;
        }

        return this.isVrPresentationActive() || this.isHeadsetBrowserDevice();
    },
    isVrRuntimeBaselineProfile: function () {
        return this.getVrRuntimeProfile() === 'baseline';
    },
    isVrBaselineRuntimeActive: function () {
        return this.isVrRuntimeBaselineProfile() && this.isVrRuntimePolicyActive();
    },
    isVrRuntimeMaxProfile: function () {
        return this.getVrRuntimeProfile() === 'max';
    },
    isVrFeatureExperimentEnabled: function (dataKey, debugKey, queryKey) {
        if (this.getVrRuntimeProfile() === 'desktop') {
            return false;
        }

        if (this.isVrRuntimeBaselineProfile()) {
            return false;
        }

        return this.isVrRuntimeMaxProfile() ||
            vrodosRuntimeTruthy(this.data[dataKey]) ||
            vrodosRuntimeDebugFlag(debugKey, queryKey);
    },
    getVrRenderProfileDefaults: function (profile) {
        switch (profile) {
            case 'desktop':
            case 'max':
                return {
                    framebufferScale: 1.0,
                    foveation: 0.5
                };
            case 'balanced':
                return {
                    framebufferScale: 0.9,
                    foveation: 0.75
                };
            case 'safe':
            case 'baseline':
            default:
                return {
                    framebufferScale: 1.0,
                    foveation: 0.5
                };
        }
    },
    readVrRenderBudgetOverride: function (dataKey, debugKey, queryKey, options) {
        const opts = options || {};
        const debugConfig = window.VRODOS_DEBUG || {};
        const candidates = [];

        if (Object.prototype.hasOwnProperty.call(debugConfig, debugKey)) {
            candidates.push({ source: 'debug', value: debugConfig[debugKey] });
        }

        const queryValue = vrodosRuntimeQueryValue(queryKey);
        if (queryValue !== null && queryValue !== '') {
            candidates.push({ source: 'query', value: queryValue });
        }

        if (this.data && Object.prototype.hasOwnProperty.call(this.data, dataKey)) {
            candidates.push({ source: 'scene', value: this.data[dataKey] });
        }

        for (let i = 0; i < candidates.length; i += 1) {
            const candidate = candidates[i];
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
                value: vrodosRuntimeNumber(rawNumber, opts.fallback, opts.min, opts.max),
                source: candidate.source
            };
        }

        return null;
    },
    getVrRenderBudgetPolicy: function () {
        const profile = this.getVrRuntimeProfile();
        const defaults = this.getVrRenderProfileDefaults(profile);
        const framebufferScaleOverride = this.readVrRenderBudgetOverride(
            'vrFramebufferScale',
            'vrFramebufferScale',
            'vrodos_vr_framebuffer_scale',
            { min: 0.5, max: 1.5, fallback: defaults.framebufferScale, autoBelowOrEqual: 0 }
        );
        const foveationOverride = this.readVrRenderBudgetOverride(
            'vrFoveationStrength',
            'vrFoveationStrength',
            'vrodos_vr_foveation',
            { min: 0, max: 1, fallback: defaults.foveation, autoBelow: 0 }
        );

        return {
            profile,
            framebufferScale: framebufferScaleOverride ? framebufferScaleOverride.value : defaults.framebufferScale,
            framebufferScaleSource: framebufferScaleOverride ? framebufferScaleOverride.source : 'profile',
            foveation: foveationOverride ? foveationOverride.value : defaults.foveation,
            foveationSource: foveationOverride ? foveationOverride.source : 'profile'
        };
    },
    applyVrRenderBudgetPolicy: function (reason) {
        const renderer = this.el && this.el.renderer ? this.el.renderer : null;
        const xr = renderer && renderer.xr ? renderer.xr : null;
        const policy = this.getVrRenderBudgetPolicy();
        const state = Object.assign({
            reason: reason || 'manual',
            policyActive: policy.profile !== 'desktop',
            supportsFramebufferScale: false,
            supportsFoveation: false,
            framebufferScaleApplied: false,
            framebufferScaleBlocked: false,
            foveationApplied: false,
            currentFoveation: null
        }, policy);

        if (!xr) {
            this._vrodosVrRenderBudget = state;
            return state;
        }

        if (policy.profile === 'desktop') {
            this._vrodosVrRenderBudget = state;
            return state;
        }

        const activeSession = Boolean((typeof xr.getSession === 'function' && xr.getSession()) || xr.isPresenting);
        state.activeSession = activeSession;

        if (typeof xr.setFramebufferScaleFactor === 'function') {
            state.supportsFramebufferScale = true;
            if (!activeSession) {
                try {
                    xr.setFramebufferScaleFactor(policy.framebufferScale);
                    state.framebufferScaleApplied = true;
                } catch (err) {
                    state.framebufferScaleError = err && err.message ? err.message : String(err);
                }
            } else {
                state.framebufferScaleBlocked = true;
            }
        }

        if (typeof xr.setFoveation === 'function') {
            state.supportsFoveation = true;
            try {
                xr.setFoveation(policy.foveation);
                state.foveationApplied = true;
            } catch (err) {
                state.foveationError = err && err.message ? err.message : String(err);
            }
        }

        if (typeof xr.getFoveation === 'function') {
            try {
                const currentFoveation = xr.getFoveation();
                state.currentFoveation = typeof currentFoveation === 'number' ? currentFoveation : null;
            } catch (err) {
                state.currentFoveation = null;
            }
        }

        this._vrodosVrRenderBudget = state;
        return state;
    },
    getVrRuntimeFeaturePolicy: function () {
        const active = this.isDirectVrPresentationActive();
        const profileActive = this.isVrRuntimePolicyActive();
        const profile = this.getVrRuntimeProfile();
        const pmndrsComposer = active &&
            this.data.postFXEngine === 'pmndrs' &&
            !this.isVrRuntimeBaselineProfile() &&
            this.canUsePmndrsComposerOnHeadset() &&
            this.isVrFeatureExperimentEnabled('vrPmndrsComposerEnabled', 'enableXrPmndrsComposer', 'vrodos_enable_xr_pmndrs_composer');
        const sceneProbe = active &&
            !this.isVrRuntimeBaselineProfile() &&
            this.isVrFeatureExperimentEnabled('vrSceneProbeEnabled', 'enableXrSceneProbe', 'vrodos_enable_xr_scene_probe');
        const takramSkyEnvironment = active &&
            !this.isVrRuntimeBaselineProfile() &&
            this.isVrFeatureExperimentEnabled('vrTakramSkyEnvironmentEnabled', 'enableXrTakramSkyEnvironment', 'vrodos_enable_xr_takram_sky_environment');
        const clouds = active &&
            this.data.postFXEngine === 'pmndrs' &&
            !this.isVrRuntimeBaselineProfile() &&
            this.isVrFeatureExperimentEnabled('vrCloudsEnabled', 'enableXrClouds', 'vrodos_enable_xr_clouds');

        return {
            profile,
            active,
            profileActive,
            baseline: this.isVrRuntimeBaselineProfile(),
            headsetBrowser: this.isHeadsetBrowserDevice(),
            headsetPmndrsComposerForced: this.isHeadsetPmndrsComposerForceEnabled(),
            pmndrsComposer,
            sceneProbe,
            takramSkyEnvironment,
            clouds,
            renderBudget: this._vrodosVrRenderBudget || this.getVrRenderBudgetPolicy()
        };
    },
    canUseVrPmndrsComposer: function () {
        return this.getVrRuntimeFeaturePolicy().pmndrsComposer;
    },
    canUseVrSceneProbe: function () {
        return this.getVrRuntimeFeaturePolicy().sceneProbe;
    },
    canUseVrTakramSkyEnvironment: function () {
        return this.getVrRuntimeFeaturePolicy().takramSkyEnvironment;
    },
    canUseVrClouds: function () {
        const policy = this.getVrRuntimeFeaturePolicy();
        return policy.clouds && policy.pmndrsComposer;
    },
    canUsePostProcessingForPresentation: function () {
        if (this.isVrBaselineRuntimeActive()) {
            return false;
        }

        if (this.data.postFXEngine === 'pmndrs' && !this.canUsePmndrsComposerOnHeadset()) {
            return false;
        }

        if (!this.isDirectVrPresentationActive()) {
            return true;
        }

        return this.canUseVrPmndrsComposer();
    },
    canUseSceneProbe: function () {
        const presentationEligible = (!this.isVrPresentationActive() && !this.isMobileDevice()) ||
            this.canUseVrSceneProbe();

        return this.getReflectionSource() === 'scene-probe' &&
            this.data.renderQuality === 'high' &&
            presentationEligible &&
            Boolean(this.el.renderer) &&
            typeof THREE.WebGLCubeRenderTarget !== 'undefined' &&
            typeof THREE.CubeCamera !== 'undefined' &&
            typeof THREE.PMREMGenerator !== 'undefined';
    },
    canUseTakramSkyEnvironment: function () {
        const presentationEligible = (!this.isVrPresentationActive() && !this.isMobileDevice()) ||
            this.canUseVrTakramSkyEnvironment();
        const takramSkyEnvironmentRequested = vrodosRuntimeDebugFlag('enableTakramSkyEnvironment', 'vrodos_debug_takram_sky_environment') ||
            this.canUseVrTakramSkyEnvironment();

        return takramSkyEnvironmentRequested &&
            this.data.renderQuality === 'high' &&
            this.data.postFXEngine === 'pmndrs' &&
            typeof this.isPmndrsAtmosphereEnabled === 'function' &&
            this.isPmndrsAtmosphereEnabled() &&
            typeof this.isPmndrsDayNightCycleActive === 'function' &&
            this.isPmndrsDayNightCycleActive() &&
            presentationEligible &&
            Boolean(this.el.renderer) &&
            typeof THREE.WebGLCubeRenderTarget !== 'undefined' &&
            typeof THREE.CubeCamera !== 'undefined' &&
            typeof THREE.PMREMGenerator !== 'undefined';
    },
    getEffectiveReflectionSource: function () {
        if (this.isVrBaselineRuntimeActive()) {
            return 'none';
        }

        if (!this.areReflectionsEnabled()) {
            return 'none';
        }

        if (this.canUseSceneProbe()) {
            return 'scene-probe';
        }

        if (this.canUseTakramSkyEnvironment()) {
            return 'takram-sky';
        }

        if ((this.data.envMapPreset || 'none') !== 'none') {
            return 'hdr';
        }

        return 'none';
    },
    // --- Scene probe & environment map methods (extracted to vrodos_scene_probe.js) ---
    clearHdrEnvironmentMap: VRODOSSceneSettingsMaster.SceneSettingsHelpers.clearHdrEnvironmentMap,
    disposeSceneProbe: VRODOSSceneSettingsMaster.SceneSettingsHelpers.disposeSceneProbe,
    ensureSceneProbeResources: VRODOSSceneSettingsMaster.SceneSettingsHelpers.ensureSceneProbeResources,
    requestSceneProbeRefresh: VRODOSSceneSettingsMaster.SceneSettingsHelpers.requestSceneProbeRefresh,
    markSceneCollectionsDirty: VRODOSSceneSettingsMaster.SceneSettingsHelpers.markSceneCollectionsDirty,
    getCachedSceneQuery: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getCachedSceneQuery,
    queueQualityRefresh: VRODOSSceneSettingsMaster.SceneSettingsHelpers.queueQualityRefresh,
    getSceneProbeAnchorObject: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getSceneProbeAnchorObject,
    getSceneProbeAnchorYaw: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getSceneProbeAnchorYaw,
    getSceneProbeYawDeltaDegrees: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getSceneProbeYawDeltaDegrees,
    hideSceneProbeObject: VRODOSSceneSettingsMaster.SceneSettingsHelpers.hideSceneProbeObject,
    collectSceneProbeExcludedObjects: VRODOSSceneSettingsMaster.SceneSettingsHelpers.collectSceneProbeExcludedObjects,
    collectTakramSkyEnvironmentExcludedObjects: VRODOSSceneSettingsMaster.SceneSettingsHelpers.collectTakramSkyEnvironmentExcludedObjects,
    restoreSceneProbeExcludedObjects: VRODOSSceneSettingsMaster.SceneSettingsHelpers.restoreSceneProbeExcludedObjects,
    getTakramSkyEnvironmentSignature: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getTakramSkyEnvironmentSignature,
    applyTakramSkyEnvironmentIntensity: VRODOSSceneSettingsMaster.SceneSettingsHelpers.applyTakramSkyEnvironmentIntensity,
    requestTakramSkyEnvironmentRefresh: VRODOSSceneSettingsMaster.SceneSettingsHelpers.requestTakramSkyEnvironmentRefresh,
    captureTakramSkyEnvironment: VRODOSSceneSettingsMaster.SceneSettingsHelpers.captureTakramSkyEnvironment,
    updateTakramSkyEnvironment: VRODOSSceneSettingsMaster.SceneSettingsHelpers.updateTakramSkyEnvironment,
    captureSceneProbe: VRODOSSceneSettingsMaster.SceneSettingsHelpers.captureSceneProbe,
    applyEnvMapProfile: VRODOSSceneSettingsMaster.SceneSettingsHelpers.applyEnvMapProfile,
    getContactShadowSettings: function () {
        const shadowQuality = this.data.shadowQuality || 'medium';
        const preset = this.getContactShadowPreset();

        if (preset === 'off') {
            return shadowQuality === 'high'
                ? { bias: -0.00008, normalBias: 0.03, helperKeyIntensity: 0.88, helperFillIntensity: 0.38, helperPosition: '7 11 5' }
                : { bias: -0.00005, normalBias: 0.02, helperKeyIntensity: 0.84, helperFillIntensity: 0.34, helperPosition: '7 10 5' };
        }

        if (preset === 'strong') {
            return shadowQuality === 'high'
                ? { bias: -0.00022, normalBias: 0.012, helperKeyIntensity: 1.02, helperFillIntensity: 0.28, helperPosition: '5.2 8.8 3.2' }
                : { bias: -0.00016, normalBias: 0.01, helperKeyIntensity: 0.96, helperFillIntensity: 0.3, helperPosition: '5.6 9.2 3.6' };
        }

        return shadowQuality === 'high'
            ? { bias: -0.00016, normalBias: 0.018, helperKeyIntensity: 0.94, helperFillIntensity: 0.34, helperPosition: '6 10 4' }
            : { bias: -0.0001, normalBias: 0.012, helperKeyIntensity: 0.9, helperFillIntensity: 0.32, helperPosition: '6.2 10 4.2' };
    },
    isFPSMeterRequested: function () {
        if (vrodosRuntimeDebugFlag('disableFpsMeter', 'vrodos_debug_disable_fps_meter')) {
            return false;
        }

        return this.data.fpsMeterEnabled !== '0';
    },
    shouldShowFPSMeter: function () {
        return this.isFPSMeterRequested() && typeof Stats !== 'undefined';
    },
    queueFPSMeterEnable: function () {
        if (this.fpsStatsPending || !this.isFPSMeterRequested()) {
            return;
        }

        const statsReady = window.VRODOS_STATS_READY;
        if (!statsReady || typeof statsReady.then !== 'function') {
            return;
        }

        this.fpsStatsPending = true;
        statsReady.then(() => {
            this.fpsStatsPending = false;
            if (this.isFPSMeterRequested()) {
                this.enableFPSMeter();
            }
        });
    },
    enableFPSMeter: function () {
        if (this.fpsStats) {
            return;
        }

        if (!this.shouldShowFPSMeter()) {
            this.queueFPSMeterEnable();
            return;
        }

        try {
            // Modern stats-gl initialization (minimal: true enables panel cycling on click)
            this.fpsStats = new Stats({ minimal: true });

            // Initialize with renderer for GPU tracking if available
            if (typeof this.fpsStats.init === 'function' && this.el.renderer) {
                this.fpsStats.init(this.el.renderer);
            }

            // stats-gl panels (0: FPS, 1: MS, 2: MB)
            if (typeof this.fpsStats.showPanel === 'function') {
                this.fpsStats.showPanel(0);
            }

            this.fpsStatsRoot = this.fpsStats.dom || this.fpsStats.domElement || null;
            if (!this.fpsStatsRoot) {
                this.fpsStats = null;
                return;
            }

            this.fpsStatsRoot.id = 'vrodos-stats-meter';
            this.fpsStatsRoot.style.position = 'fixed';
            this.fpsStatsRoot.style.top = '16px';
            this.fpsStatsRoot.style.left = '16px';
            this.fpsStatsRoot.style.right = 'auto';
            this.fpsStatsRoot.style.zIndex = '9999';
            this.fpsStatsRoot.style.opacity = '0.92';
            document.body.appendChild(this.fpsStatsRoot);
        } catch (e) {
            console.warn("VRodos Error: Stats.js/stats-gl failed to initialize. Scene will continue.", e);
            this.fpsStats = null;
        }
    },
    disableFPSMeter: function () {
        if (!this.fpsStats) {
            return;
        }

        if (this.fpsStatsRoot && this.fpsStatsRoot.parentNode) {
            this.fpsStatsRoot.parentNode.removeChild(this.fpsStatsRoot);
        }

        this.fpsStats = null;
        this.fpsStatsRoot = null;
        this.fpsStatsPending = false;
    },
    syncFPSMeterState: function () {
        if (this.shouldShowFPSMeter()) {
            this.enableFPSMeter();
            return;
        }

        if (this.isFPSMeterRequested()) {
            this.queueFPSMeterEnable();
            return;
        }

        this.disableFPSMeter();
    },
    getExposureValue: function () {
        switch (this.data.exposurePreset) {
            case 'bright':
                return 1.015;
            case 'cinematic':
                return 1.03;
            default:
                return 1.0;
        }
    },
    getContrastValue: function () {
        switch (this.data.contrastPreset) {
            case 'soft':
                return 0.992;
            case 'punchy':
                return 1.018;
            default:
                return 1.0;
        }
    },
    getSaturationValue: function () {
        switch (this.data.contrastPreset) {
            case 'soft':
                return 0.998;
            case 'punchy':
                return 1.006;
            default:
                return 1.0;
        }
    },
    hasBloomEffectEnabled: function () {
        return this.getBloomStrengthValue() > 0;
    },
    isPmndrsAAEnabled: function () {
        return this.data.postFXEngine === 'pmndrs' && this.getPmndrsAAMode() !== 'none';
    },
    isPostFXOptionEnabled: function (key) {
        return this.data[key] !== '0';
    },
    hasPostFXColorGradingEffectEnabled: function () {
        if (!this.isPostFXOptionEnabled('postFXColorEnabled')) {
            return false;
        }

        return Math.abs(this.getContrastValue() - 1.0) > 0.0001 ||
            Math.abs(this.getSaturationValue() - 1.0) > 0.0001;
    },
    isLegacyEdgeAAEnabled: function () {
        return this.data.postFXEngine !== 'pmndrs' && this.isPostFXOptionEnabled('postFXEdgeAAEnabled');
    },
    hasEnabledPostFXOptions: function () {
        return this.hasBloomEffectEnabled() ||
            this.hasPostFXColorGradingEffectEnabled() ||
            this.isLegacyEdgeAAEnabled() ||
            this.isPmndrsAAEnabled() ||
            this.isPmndrsLutEnabled() ||
            this.isPmndrsLensFlareEnabled() ||
            (this.data.postFXEngine === 'pmndrs' && vrodosRuntimeTruthy(this.data.pmndrsVignetteEnabled)) ||
            (this.data.postFXEngine === 'pmndrs' && vrodosRuntimeTruthy(this.data.pmndrsNoiseEnabled)) ||
            (this.data.postFXEngine === 'pmndrs' && vrodosRuntimeTruthy(this.data.pmndrsChromaticAberrationEnabled)) ||
            this.isPmndrsAerialPerspectiveEffectEnabled() ||
            this.isPmndrsCloudsEnabled();
    },
    hasCinematicShaderOptions: function () {
        return this.hasBloomEffectEnabled() ||
            this.hasPostFXColorGradingEffectEnabled() ||
            this.isLegacyEdgeAAEnabled() ||
            this.isPmndrsAAEnabled() ||
            this.isPmndrsLutEnabled() ||
            this.isPmndrsLensFlareEnabled() ||
            (this.data.postFXEngine === 'pmndrs' && vrodosRuntimeTruthy(this.data.pmndrsVignetteEnabled)) ||
            (this.data.postFXEngine === 'pmndrs' && vrodosRuntimeTruthy(this.data.pmndrsNoiseEnabled)) ||
            (this.data.postFXEngine === 'pmndrs' && vrodosRuntimeTruthy(this.data.pmndrsChromaticAberrationEnabled)) ||
            this.isPostFXOptionEnabled('postFXTAAEnabled') ||
            this.isPostFXOptionEnabled('postFXSSREnabled') ||
            this.getAmbientOcclusionPreset() !== 'off' ||
            this.isPmndrsAerialPerspectiveEffectEnabled() ||
            this.isPmndrsCloudsEnabled();
    },
    hasPmndrsComposerEffectRequest: function () {
        return this.data.postFXEngine === 'pmndrs' &&
            this.data.postFXEnabled !== '0' &&
            this.getRenderQualityLevel() === 'high' &&
            (
                this.hasBloomEffectEnabled() ||
                this.hasPostFXColorGradingEffectEnabled() ||
                this.isPmndrsAAEnabled() ||
                this.isPmndrsLutEnabled() ||
                this.isPmndrsLensFlareEnabled() ||
                vrodosRuntimeTruthy(this.data.pmndrsVignetteEnabled) ||
                vrodosRuntimeTruthy(this.data.pmndrsNoiseEnabled) ||
                vrodosRuntimeTruthy(this.data.pmndrsChromaticAberrationEnabled) ||
                this.getAmbientOcclusionPreset() !== 'off' ||
                this.isPmndrsAerialPerspectiveEffectEnabled() ||
                this.isPmndrsCloudsEnabled()
            );
    },
    hasPostProcessingPipelineRequest: function () {
        if (this.data.postFXEngine === 'pmndrs') {
            return this.hasPmndrsComposerEffectRequest();
        }

        return this.getRenderQualityLevel() === 'high' &&
            this.data.postFXEnabled !== '0' &&
            this.hasCinematicShaderOptions();
    },
    warnImmersiveXrPostProcessingFallback: function () {
        if (!this.isDirectVrPresentationActive()) {
            this._immersiveXrPostFXFallbackWarned = false;
            return;
        }

        if (!this.hasPostProcessingPipelineRequest() || this.canUsePostProcessingForPresentation() || this._immersiveXrPostFXFallbackWarned) {
            return;
        }

        this._immersiveXrPostFXFallbackWarned = true;
        console.warn('[VRodos] Immersive XR is using the direct stereo renderer fallback for screen-space post-FX. Scene-owned horizon, atmosphere, lights, fog, exposure, and materials remain active; unsupported composer passes are skipped for XR compatibility.');
    },
    shouldUseEdgeAAOversample: function () {
        return this.data.renderQuality === 'high' &&
            this.data.postFXEnabled !== '0' &&
            this.isLegacyEdgeAAEnabled();
    },
    getEdgeAAStrengthFactor: function () {
        let parsed = parseInt(this.data.postFXEdgeAAStrength, 10);
        if (isNaN(parsed)) {
            parsed = 3;
        }

        if (parsed > 5) {
            if (parsed <= 20) {
                parsed = 1;
            } else if (parsed <= 40) {
                parsed = 2;
            } else if (parsed <= 65) {
                parsed = 3;
            } else if (parsed <= 85) {
                parsed = 4;
            } else {
                parsed = 5;
            }
        }

        parsed = Math.max(1, Math.min(5, parsed));

        switch (parsed) {
            case 1:
                return 0.2;
            case 2:
                return 0.4;
            case 4:
                return 0.8;
            case 5:
                return 1.0;
            default:
                return 0.6;
        }
    },
    shouldUsePostProcessing: function () {
        if (this.data.postFXEngine === 'pmndrs' && vrodosRuntimeDebugFlag('disablePmndrsComposer', 'vrodos_debug_disable_pmndrs_composer')) {
            return false;
        }

        return this.hasPostProcessingPipelineRequest() && this.canUsePostProcessingForPresentation();
    },
    ensureRuntimePipelineComponents: function () {
        [
            'vrodos-render-profile',
            'vrodos-postfx-router',
            'vrodos-atmosphere',
            'vrodos-reflections'
        ].forEach((componentName) => {
            if (!this.el.hasAttribute(componentName)) {
                this.el.setAttribute(componentName, '');
            }
        });
    },
    getCustomMovementComponent: function () {
        const sceneEl = this.el;
        const movementEl = (sceneEl && sceneEl.querySelector && sceneEl.querySelector('[custom-movement]')) ||
            document.querySelector('[custom-movement]');
        return movementEl && movementEl.components ? movementEl.components['custom-movement'] : null;
    },
    getNavigationFeatureDiagnostics: function () {
        const movement = this.getCustomMovementComponent();
        const navigationMode = movement && typeof movement.getNavigationMode === 'function'
            ? movement.getNavigationMode(this.data)
            : (this.data.navigationMode || 'walkable');
        const collisionConfigured = this.data.collisionMode !== 'off' && navigationMode === 'walkable';
        const navMeshTargets = movement && movement.navMeshCollisionTargets ? movement.navMeshCollisionTargets.length : 0;

        return {
            componentPresent: Boolean(movement),
            authoredNavigationMode: this.data.navigationMode || '',
            navigationMode,
            collisionMode: this.data.collisionMode || 'auto',
            collisionConfigured,
            collisionActive: Boolean(collisionConfigured && navMeshTargets > 0),
            bvhBundleLoaded: Boolean(window.VRODOS_COLLISION_BVH),
            bvhInstalled: Boolean(movement && movement.bvhInstalled),
            navMeshRoots: movement && movement.navMeshRoots ? movement.navMeshRoots.length : 0,
            navMeshTargets,
            colliderRoots: movement && movement.colliderRoots ? movement.colliderRoots.length : 0,
            blockerTargets: movement && movement.blockerCollisionTargets ? movement.blockerCollisionTargets.length : 0,
            navMeshDirty: Boolean(movement && movement.navMeshDirty),
            collisionWorldDirty: Boolean(movement && movement.collisionWorldDirty),
            lastAutoRecoveryStatus: movement && movement.lastAutoRecoveryStatus ? movement.lastAutoRecoveryStatus : 'none'
        };
    },
    getSpatialUiFeatureDiagnostics: function () {
        const api = window.VRODOSSpatialUI || null;
        const activePanel = api && typeof api.getActivePanel === 'function'
            ? api.getActivePanel()
            : null;
        let panelDiagnostics = null;

        if (activePanel && activePanel.api && typeof activePanel.api.getDiagnostics === 'function') {
            try {
                panelDiagnostics = activePanel.api.getDiagnostics();
            } catch (err) {
                panelDiagnostics = { error: err && err.message ? err.message : String(err) };
            }
        }

        return {
            bundleLoaded: Boolean(api),
            activePanel: Boolean(activePanel),
            panelId: activePanel && activePanel.id ? activePanel.id : '',
            controllerPointers: panelDiagnostics && typeof panelDiagnostics.controllerPointers === 'number'
                ? panelDiagnostics.controllerPointers
                : 0,
            controllerPointerSources: panelDiagnostics && Array.isArray(panelDiagnostics.controllerPointerSources)
                ? panelDiagnostics.controllerPointerSources.map((entry) => entry && entry.source ? entry.source : '')
                : [],
            diagnosticsCount: window.__vrodosSpatialUIDiagnostics && window.__vrodosSpatialUIDiagnostics.length
                ? window.__vrodosSpatialUIDiagnostics.length
                : 0
        };
    },
    getActivePostProcessingOwner: function (postProcessingRequested, postProcessingAllowed) {
        if (postProcessingAllowed) {
            if (this.data.postFXEngine === 'pmndrs') {
                return this.pmndrsActive ? 'pmndrs' : 'pmndrs-pending';
            }
            return this.postProcessingActive ? 'legacy' : 'legacy-pending';
        }

        if (postProcessingRequested && this.isVrBaselineRuntimeActive()) {
            return 'vr-baseline-disabled';
        }

        if (postProcessingRequested && this.isDirectVrPresentationActive()) {
            return 'direct-xr-fallback';
        }

        if (postProcessingRequested) {
            return 'disabled';
        }

        return 'direct';
    },
    getRuntimeFeatureState: function () {
        const renderer = this.el && this.el.renderer ? this.el.renderer : null;
        const xr = renderer && renderer.xr ? renderer.xr : null;
        const postProcessingRequested = this.hasPostProcessingPipelineRequest();
        const postProcessingAllowed = this.shouldUsePostProcessing();
        const effectiveReflectionSource = this.getEffectiveReflectionSource();
        const cloudDiagnostics = this._pmndrsCloudsDiagnostics || {};
        const atmosphereState = this._pmndrsAtmosphereState || null;
        const shadowDiagnostics = typeof this.getShadowDiagnosticState === 'function'
            ? this.getShadowDiagnosticState()
            : null;
        const horizonState = typeof this.getPmndrsTakramHorizonState === 'function'
            ? this.getPmndrsTakramHorizonState()
            : null;
        const vrFeaturePolicy = this.getVrRuntimeFeaturePolicy();
        const vrBaselineActive = this.isVrBaselineRuntimeActive();
        let pixelRatio = null;

        if (renderer && typeof renderer.getPixelRatio === 'function') {
            try {
                pixelRatio = renderer.getPixelRatio();
            } catch (err) {
                pixelRatio = null;
            }
        }

        return {
            presentation: {
                mode: this.getPresentationMode(),
                immersiveXr: this.isImmersiveXrActive(),
                aframeVrMode: this.isAFrameVrModeActive(),
                vrPresentation: this.isVrPresentationActive(),
                mobile: this.isMobileDevice(),
                headsetBrowser: this.isHeadsetBrowserDevice(),
                xrSession: Boolean(xr && typeof xr.getSession === 'function' && xr.getSession())
            },
            renderer: {
                renderQuality: this.getRenderQualityLevel(),
                aaQuality: this.getAAQualityLevel(),
                pixelRatio,
                webgl2: Boolean(renderer && renderer.capabilities && renderer.capabilities.isWebGL2 === true),
                vrRenderBudget: this._vrodosVrRenderBudget || this.getVrRenderBudgetPolicy()
            },
            vrProfile: vrFeaturePolicy,
            postProcessing: {
                engine: this.data.postFXEngine || 'legacy',
                requested: postProcessingRequested,
                allowed: postProcessingAllowed,
                owner: this.getActivePostProcessingOwner(postProcessingRequested, postProcessingAllowed),
                legacyActive: Boolean(this.postProcessingActive),
                pmndrsActive: Boolean(this.pmndrsActive),
                pmndrsBundleLoaded: Boolean(window.POSTPROCESSING),
                pmndrsComposerBuilt: Boolean(this.pmndrsComposer),
                pmndrsEffectPass: Boolean(this.pmndrsEffectPass),
                immersiveXrFallback: Boolean(postProcessingRequested && this.isDirectVrPresentationActive() && !this.canUsePostProcessingForPresentation())
            },
            takram: {
                atmosphereRequested: Boolean(!vrBaselineActive && this.data.postFXEngine === 'pmndrs' && this.isPmndrsAtmosphereEnabled()),
                atmosphereBundleLoaded: Boolean(window.VRODOS_TAKRAM_ATMOSPHERE),
                atmosphereReady: Boolean(!vrBaselineActive && atmosphereState && atmosphereState.ready && !atmosphereState.failed),
                dayNightCycleActive: Boolean(!vrBaselineActive && this.isPmndrsDayNightCycleActive()),
                horizonOwner: vrBaselineActive ? 'aframe-environment' : (horizonState && horizonState.owner ? horizonState.owner : ''),
                takramSunEnabled: Boolean(!vrBaselineActive && horizonState && horizonState.takramSunEnabled),
                cloudsRequested: Boolean(!vrBaselineActive && this.isPmndrsCloudsEnabled()),
                cloudsBundleLoaded: Boolean(window.VRODOS_TAKRAM_CLOUDS),
                cloudsActive: Boolean(!vrBaselineActive && cloudDiagnostics.cloudsActive),
                cloudsSkippedReason: cloudDiagnostics.cloudsSkippedReason || '',
                cloudsXrSkipped: Boolean(cloudDiagnostics.xrSkipped)
            },
            reflections: {
                enabled: this.areReflectionsEnabled(),
                authoredSource: this.getReflectionSource(),
                effectiveSource: effectiveReflectionSource,
                envMapPreset: this.data.envMapPreset || 'none',
                currentSource: this._currentReflectionSource || 'none',
                hdrReady: Boolean(this._envMapRenderTarget),
                sceneProbeCapable: this.canUseSceneProbe(),
                sceneProbeTargetReady: Boolean(this._sceneProbePmremTarget),
                sceneProbeNeedsUpdate: Boolean(this._sceneProbeNeedsUpdate),
                takramSkyEnvironmentCapable: this.canUseTakramSkyEnvironment(),
                takramSkyTargetReady: Boolean(this._takramSkyPmremTarget)
            },
            shadows: {
                authoredQuality: this.data.shadowQuality || 'medium',
                effectiveQuality: this.getEffectiveShadowQuality(),
                updateMode: this.getShadowUpdateMode(),
                staticMode: Boolean(this.isStaticShadowMode()),
                diagnostics: shadowDiagnostics
            },
            navigation: this.getNavigationFeatureDiagnostics(),
            spatialUi: this.getSpatialUiFeatureDiagnostics()
        };
    },
    publishRuntimeFeatureState: function (reason, options) {
        const opts = options || {};
        const now = typeof opts.time === 'number' && isFinite(opts.time) ? opts.time : vrodosRuntimeNowMs();
        const throttleMs = typeof opts.throttleMs === 'number' ? opts.throttleMs : 0;

        if (throttleMs > 0 && this._runtimeFeatureStateLastPublishMs &&
            (now - this._runtimeFeatureStateLastPublishMs) < throttleMs) {
            return this._runtimeFeatureState || window.VRODOS_RUNTIME_FEATURE_STATE || null;
        }

        const state = this.getRuntimeFeatureState();
        const signature = vrodosRuntimeFeatureStateSignature(state);
        state.reason = reason || 'update';
        state.updatedAtMs = Math.round(now);

        this._runtimeFeatureState = state;
        this._runtimeFeatureStateLastPublishMs = now;
        window.VRODOS_RUNTIME_FEATURE_STATE = state;
        window.__vrodosRuntimeFeatureState = state;
        VRODOSSceneSettingsMaster.runtimeFeatureState = state;
        VRODOSSceneSettingsMaster.getRuntimeFeatureState = function () {
            const scene = document.querySelector('a-scene');
            const component = scene && scene.components ? scene.components['scene-settings'] : null;
            return component && typeof component.getRuntimeFeatureState === 'function'
                ? component.getRuntimeFeatureState()
                : (window.VRODOS_RUNTIME_FEATURE_STATE || null);
        };

        if (this.isRuntimeFeatureDiagnosticsLogEnabled() && signature && signature !== this._runtimeFeatureStateLogSignature) {
            this._runtimeFeatureStateLogSignature = signature;
            console.info('[VRodos] Runtime feature state:', state);
        }

        if (!this.isRuntimeFeatureDiagnosticsLogEnabled()) {
            this._runtimeFeatureStateLogSignature = signature;
        }

        return state;
    },
    isRuntimeFeatureDiagnosticsLogEnabled: function () {
        return vrodosRuntimeDebugFlag('runtimeFeatures', 'vrodos_debug_runtime_features');
    },
    // --- Post-processing methods: LEGACY engine (extracted to vrodos_postprocessing.js) ---
    updatePostProcessingSize: VRODOSSceneSettingsMaster.SceneSettingsHelpers.updatePostProcessingSize || vrodosRuntimeNoop,
    enablePostProcessing: VRODOSSceneSettingsMaster.SceneSettingsHelpers.enablePostProcessing || vrodosRuntimeNoop,
    disablePostProcessing: VRODOSSceneSettingsMaster.SceneSettingsHelpers.disablePostProcessing || vrodosRuntimeNoop,
    // --- Post-processing methods: PMNDRS engine (extracted to vrodos_postprocessing_pmndrs.js) ---
    // The compiler only includes the selected engine chunk. Missing helper bags here mean
    // the other engine was intentionally omitted from this freshly compiled scene.
    enablePmndrsPostProcessing: (VRODOSSceneSettingsMaster.PmndrsHelpers && VRODOSSceneSettingsMaster.PmndrsHelpers.enablePmndrsPostProcessing) || vrodosRuntimeNoop,
    disablePmndrsPostProcessing: (VRODOSSceneSettingsMaster.PmndrsHelpers && VRODOSSceneSettingsMaster.PmndrsHelpers.disablePmndrsPostProcessing) || vrodosRuntimeNoop,
    updatePmndrsPostProcessingSize: (VRODOSSceneSettingsMaster.PmndrsHelpers && VRODOSSceneSettingsMaster.PmndrsHelpers.updatePmndrsPostProcessingSize) || vrodosRuntimeNoop,
    _buildPmndrsComposer: (VRODOSSceneSettingsMaster.PmndrsHelpers && VRODOSSceneSettingsMaster.PmndrsHelpers._buildPmndrsComposer) || vrodosRuntimeFalse,
    // --- Engine dispatcher: routes to legacy or pmndrs path based on data.postFXEngine ---
    // Engines are mutually exclusive: switching
    // from one to the other (e.g. via a future runtime toggle) tears the previous engine
    // down before bringing the new one up. Defensive disable of the OTHER engine on every
    // call protects against drift if data.postFXEngine ever changes mid-session.
    syncPostProcessingState: function () {
        const router = this.el.components && this.el.components['vrodos-postfx-router'];
        if (router && typeof router.sync === 'function') {
            router.sync();
            return;
        }

        this.warnImmersiveXrPostProcessingFallback();

        if (this.data.postFXEngine === 'pmndrs') {
            if (this.postProcessingActive) {
                this.disablePostProcessing();
            }
            if (this.shouldUsePostProcessing()) {
                this.enablePmndrsPostProcessing();
                this.updatePmndrsPostProcessingSize();
            } else {
                this.disablePmndrsPostProcessing();
            }
        } else {
            if (this.pmndrsActive) {
                this.disablePmndrsPostProcessing();
            }
            if (this.shouldUsePostProcessing()) {
                this.enablePostProcessing();
                this.updatePostProcessingSize();
            } else {
                this.disablePostProcessing();
            }
        }
    },
    syncPresentationVisualState: function (waitForSettle) {
        const self = this;

        this.markSceneCollectionsDirty();
        this.applyRenderQualityProfile();
        this.applyBackgroundQualityProfile();
        this.applyEnvMapProfile();
        this.applyPostFXProfile();
        this.updatePmndrsHorizonSun();
        this.publishRuntimeFeatureState('presentation-sync');

        if (!waitForSettle) {
            return;
        }

        const resync = function () {
            self.markSceneCollectionsDirty();
            self.applyRenderQualityProfile();
            self.applyBackgroundQualityProfile();
            self.applyEnvMapProfile();
            self.applyPostFXProfile();
            self.updatePostProcessingSize();
            self.updatePmndrsPostProcessingSize();
            self.updatePmndrsHorizonSun();
            self.publishRuntimeFeatureState('presentation-resync');
        };

        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(resync);
        }
        setTimeout(resync, 80);
        setTimeout(resync, 240);
    },
    // --- Quality profile methods (extracted to vrodos_quality_profiles.js) ---
    applyRenderQualityProfile: VRODOSSceneSettingsMaster.SceneSettingsHelpers.applyRenderQualityProfile,
    applyShadowQualityProfile: VRODOSSceneSettingsMaster.SceneSettingsHelpers.applyShadowQualityProfile,
    getShadowUpdateMode: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getShadowUpdateMode || function () { return this.data.shadowUpdateMode || 'static'; },
    isStaticShadowMode: VRODOSSceneSettingsMaster.SceneSettingsHelpers.isStaticShadowMode || vrodosRuntimeFalse,
    markShadowDirty: VRODOSSceneSettingsMaster.SceneSettingsHelpers.markShadowDirty || vrodosRuntimeNoop,
    flushShadowUpdate: VRODOSSceneSettingsMaster.SceneSettingsHelpers.flushShadowUpdate || vrodosRuntimeNoop,
    syncStaticShadowMode: VRODOSSceneSettingsMaster.SceneSettingsHelpers.syncStaticShadowMode || vrodosRuntimeNoop,
    getShadowDiagnosticState: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getShadowDiagnosticState || function () { return null; },
    applyMaterialProfiles: VRODOSSceneSettingsMaster.SceneSettingsHelpers.applyMaterialProfiles,
    ensurePhotorealHelperLight: VRODOSSceneSettingsMaster.SceneSettingsHelpers.ensurePhotorealHelperLight,
    removePhotorealHelperLights: VRODOSSceneSettingsMaster.SceneSettingsHelpers.removePhotorealHelperLights,
    updateAdaptiveShadowFit: VRODOSSceneSettingsMaster.SceneSettingsHelpers.updateAdaptiveShadowFit || vrodosRuntimeNoop,
    applyHorizonSkyPreset: VRODOSSceneSettingsMaster.SceneSettingsHelpers.applyHorizonSkyPreset,
    ensurePmndrsAtmosphereResources: VRODOSSceneSettingsMaster.SceneSettingsHelpers.ensurePmndrsAtmosphereResources || function () { return null; },
    disposePmndrsAtmosphere: VRODOSSceneSettingsMaster.SceneSettingsHelpers.disposePmndrsAtmosphere || function () {},
    getPmndrsAtmosphereConfig: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getPmndrsAtmosphereConfig || function () { return null; },
    getPmndrsTakramHorizonState: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getPmndrsTakramHorizonState || function () { return null; },
    getPmndrsToneMappingExposure: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getPmndrsToneMappingExposure || function () { return 1.0; },
    getPmndrsToneMappingMode: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getPmndrsToneMappingMode || function () { return 'agx'; },
    getPmndrsReflectionIntensityScale: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getPmndrsReflectionIntensityScale || function () { return 1; },
    updateReflectionEnvironmentIntensity: VRODOSSceneSettingsMaster.SceneSettingsHelpers.updateReflectionEnvironmentIntensity || vrodosRuntimeNoop,
    applyPmndrsAtmosphereConfigToTarget: VRODOSSceneSettingsMaster.SceneSettingsHelpers.applyPmndrsAtmosphereConfigToTarget || function () {},
    updatePmndrsHorizonSun: VRODOSSceneSettingsMaster.SceneSettingsHelpers.updatePmndrsHorizonSun || function () {},
    syncPmndrsAerialPerspectiveEffect: VRODOSSceneSettingsMaster.SceneSettingsHelpers.syncPmndrsAerialPerspectiveEffect || function () {},
    isPmndrsDayNightCycleActive: VRODOSSceneSettingsMaster.SceneSettingsHelpers.isPmndrsDayNightCycleActive || vrodosRuntimeFalse,
    updatePmndrsDayNightCycleFrame: VRODOSSceneSettingsMaster.SceneSettingsHelpers.updatePmndrsDayNightCycleFrame || vrodosRuntimeNoop,
    hidePmndrsHorizonEnvironmentVisuals: VRODOSSceneSettingsMaster.SceneSettingsHelpers.hidePmndrsHorizonEnvironmentVisuals || function () {},
    showPmndrsAtmosphereSkyForSceneProbe: VRODOSSceneSettingsMaster.SceneSettingsHelpers.showPmndrsAtmosphereSkyForSceneProbe || function () { return false; },
    hidePmndrsAtmosphereSky: VRODOSSceneSettingsMaster.SceneSettingsHelpers.hidePmndrsAtmosphereSky || function () {},
    logPmndrsHorizonDiagnostic: VRODOSSceneSettingsMaster.SceneSettingsHelpers.logPmndrsHorizonDiagnostic || function () {},
    applyBackgroundQualityProfile: VRODOSSceneSettingsMaster.SceneSettingsHelpers.applyBackgroundQualityProfile,
    applyPostFXProfile: VRODOSSceneSettingsMaster.SceneSettingsHelpers.applyPostFXProfile,
    applyQualityProfiles: VRODOSSceneSettingsMaster.SceneSettingsHelpers.applyQualityProfiles,
    init: function () {
        this.ensureRuntimePipelineComponents();
        this.runtimeResources = VRODOSSceneSettingsMaster.RuntimeResources && VRODOSSceneSettingsMaster.RuntimeResources.createRegistry
            ? VRODOSSceneSettingsMaster.RuntimeResources.createRegistry()
            : null;
        this.handleQualityModelLoad = function () {
            this.markSceneCollectionsDirty();
            this.markShadowDirty('model-loaded');
            this.queueQualityRefresh(true);
        }.bind(this);
        this.handleSceneMutation = function () {
            this.markSceneCollectionsDirty();
            this.markShadowDirty('scene-mutation');
        }.bind(this);
        this.handleResize = function () {
            this.updatePostProcessingSize();
            this.updatePmndrsPostProcessingSize();
            this.updatePmndrsHorizonSun();
            this.markShadowDirty('resize');
        }.bind(this);
        this.handlePresentationModeChange = function () {
            this.syncPresentationVisualState(true);
        }.bind(this);
        this.postProcessingSize = new THREE.Vector2();
        this.sceneQueryCache = {};
        this.sceneCollectionsDirty = true;
        this.queuedQualityRefreshId = null;
        this.pendingQualityRefreshWaitForSettle = false;
        this.postProcessingTarget = null;
        this.postProcessingMaterial = null;
        this.postProcessingScene = null;
        this.postProcessingCamera = null;
        this.postProcessingQuad = null;
        this.postProcessingOriginalRender = null;
        this.postProcessingActive = false;
        this.postProcessingRendering = false;
        this.fpsStats = null;
        this.fpsStatsRoot = null;
        this._currentReflectionSource = null;
        this._currentEnvMapPreset = null;
        this._envMapRenderTarget = null;
        this._sceneProbeCubeRenderTarget = null;
        this._sceneProbeCubeCamera = null;
        this._sceneProbePmremGenerator = null;
        this._sceneProbePmremTarget = null;
        this._sceneProbeResolution = null;
        this._sceneProbeNeedsUpdate = false;
        this._sceneProbeLastCaptureMs = 0;
        this._sceneProbeLastModelEventMs = 0;
        this._sceneProbeLastYaw = null;
        this._sceneProbeLastPosition = new THREE.Vector3();
        this._sceneProbeCurrentPosition = new THREE.Vector3();
        this._sceneProbeTempDirection = new THREE.Vector3();
        this.sceneProbeCapturing = false;
        this.bloomTargetA = null;
        this.bloomTargetB = null;
        this.bloomBrightPassMaterial = null;
        this.bloomBlurMaterial = null;
        this.bloomQuad = null;
        this.bloomScene = null;
        this.fxaaTarget = null;
        this.fxaaMaterial = null;
        this.fxaaQuad = null;
        this.fxaaScene = null;
        this.saoTargetA = null;
        this.saoTargetB = null;
        this.saoMaterial = null;
        this.saoBlurMaterial = null;
        this.saoQuad = null;
        this.saoScene = null;
        this.taaTargetA = null;
        this.taaTargetB = null;
        this.taaCurrentTarget = null;
        this.taaHistoryTarget = null;
        this.taaMaterial = null;
        this.taaQuad = null;
        this.taaScene = null;
        this._taaFrameIndex = 0;
        this._taaJitterSequence = null;
        this.ssrTargetA = null;
        this.ssrMaterial = null;
        this.ssrQuad = null;
        this.ssrScene = null;
        this._blackBloomTexture = null;
        this._whiteSAOTexture = null;
        this._blackSSRTexture = null;
        this._vrodosShadowDirty = false;
        this._vrodosShadowDirtyReason = null;
        this._vrodosShadowDirtyRequests = 0;
        this._vrodosShadowUpdateCount = 0;
        this._vrodosShadowFlushHandle = null;
        this._vrodosShadowLastUpdateMs = 0;
        this._pmndrsTickTimeMs = null;
        this._pmndrsDayNightCycleState = null;
        this._pmndrsDayNightCycleShadowLastMs = 0;
        this._pmndrsRuntimeLightSmoothValues = {};
        this._pmndrsRuntimeLightSmoothColors = {};
        this._pmndrsRuntimeLightSmoothTimes = {};
        this._vrodosReflectionIntensityMaterials = [];
        this._takramSkyPmremTarget = null;
        this._takramSkyEnvironmentNeedsUpdate = false;
        this._takramSkyEnvironmentLastCaptureMs = 0;
        this._takramSkyEnvironmentNextRetryMs = 0;
        this._takramSkyEnvironmentLastMaterialScale = 0;
        this._takramSkyEnvironmentLastSmoothMs = 0;
        this._takramSkyEnvironmentSmoothedScale = null;
        this._takramSkyEnvironmentLastProfileScale = 1;
        this._takramSkyEnvironmentSignature = '';
        this._runtimeFeatureState = null;
        this._runtimeFeatureStateLastPublishMs = 0;
        this._runtimeFeatureStateLogSignature = '';
        this._vrodosVrRenderBudget = null;
        window.addEventListener('resize', this.handleResize);
        document.addEventListener('fullscreenchange', this.handlePresentationModeChange);
        document.addEventListener('webkitfullscreenchange', this.handlePresentationModeChange);
        document.addEventListener('mozfullscreenchange', this.handlePresentationModeChange);
        document.addEventListener('MSFullscreenChange', this.handlePresentationModeChange);
        this.el.addEventListener('child-attached', this.handleSceneMutation);
        this.el.addEventListener('child-detached', this.handleSceneMutation);
        // Event - When scene is loaded
        this.el.addEventListener("loaded", () => {
            this.markSceneCollectionsDirty();
            if (this.data.pr_type === "vrexpo_games") {
                document.getElementById("cameraA").setAttribute("position", this.data.cam_position);
            }

            const privateChatBtn = document.getElementById("private-chat-button");
            if (privateChatBtn) {
                privateChatBtn.addEventListener("click", () => {
                    const event = new CustomEvent('chat-selected', { "detail": "private" });
                    document.dispatchEvent(event);
                    if (typeof window.gtag === 'function') window.gtag('event', 'chat_private_tab_selected');
                });
            }

            const publicChatBtn = document.getElementById("public-chat-button");
            if (publicChatBtn) {
                publicChatBtn.addEventListener("click", (evt) => {
                    const event = new CustomEvent('chat-selected', { "detail": "public" });
                    document.dispatchEvent(event);
                    if (typeof window.gtag === 'function') window.gtag('event', 'chat_public_tab_selected');
                });
            }

            const sceneContainer = document.getElementById("aframe-scene-container");
            if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.applyChatTabs === 'function') {
                window.VRODOSMasterUI.applyChatTabs(vrodosRuntimeTruthy(this.data.public_chat) ? 'public' : 'private');
            } else if (sceneContainer) {
                const settings = sceneContainer ? sceneContainer.getAttribute("scene-settings") : null;
                if (publicChatBtn) {
                    const hasPublicChat = Boolean(settings && vrodosRuntimeTruthy(settings.public_chat));
                    publicChatBtn.style.visibility = hasPublicChat ? 'visible' : 'hidden';
                    publicChatBtn.disabled = !hasPublicChat;
                }
                if (privateChatBtn) {
                    const hasPrivateChat = Boolean(document.querySelector('[chat-poi]'));
                    privateChatBtn.style.visibility = hasPrivateChat ? 'visible' : 'hidden';
                    privateChatBtn.disabled = !hasPrivateChat;
                }
            }

            // Avatar Selector
            const avatarDialog = document.querySelector('#avatar-selection-dialog');
            if (avatarDialog) {
                const closeAvatarDialogListener = function () {
                    avatarDialog.removeEventListener('close', closeAvatarDialogListener);
                    if (avatarDialog.returnValue !== 'accept' && typeof window.selectAvatarType === 'function') {
                        window.selectAvatarType('no-avatar');
                    }
                };

                const settings = sceneContainer.getAttribute("scene-settings");
                if (settings && vrodosRuntimeTruthy(settings.avatar_enabled)) {
                    avatarDialog.addEventListener('close', closeAvatarDialogListener);
                    if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.showDialog === 'function') {
                        window.VRODOSMasterUI.showDialog(avatarDialog);
                    } else if (typeof avatarDialog.showModal === 'function') {
                        avatarDialog.showModal();
                    }
                } else {
                    if (typeof window.selectAvatarType === 'function') window.selectAvatarType('no-avatar');
                }
            }

            this.queueQualityRefresh(true);
            this.markShadowDirty('scene-loaded');
            this.applyVrRenderBudgetPolicy('scene-loaded');
        });
        this.el.addEventListener('model-loaded', this.handleQualityModelLoad);

        this.el.addEventListener("enter-vr", () => {
            VRODOSSceneSettingsMaster.setBrowsingModeVR(true);
            this.applyVrRenderBudgetPolicy('enter-vr');
            this.syncPresentationVisualState(true);
            if (typeof window.gtag === 'function') window.gtag('event', 'vr_enabled');
        });
        this.el.addEventListener("exit-vr", () => {
            VRODOSSceneSettingsMaster.setBrowsingModeVR(false);
            this.applyVrRenderBudgetPolicy('exit-vr');
            this.syncPresentationVisualState(true);
            if (typeof window.gtag === 'function') window.gtag('event', 'vr_disabled');
        });

        const cam = document.querySelector("#cameraA");
        if (cam) {
            if (this.data.pr_type !== "vrexpo_games") {
                cam.setAttribute("camera", "fov: 60");
            } else {
                cam.setAttribute("fov", "60");
                cam.setAttribute("camera", "fov: 60");
                const my_face = cam.querySelector('.face');
                if (my_face) my_face.setAttribute("visible", "false");
            }
        }

        const backgroundEl = this.el;
        const presetGroundEnabled = this.data.presetGroundEnabled !== "0";
        if (!this.data.selChoice) this.data.selChoice = "0";

        const clearGeneratedBackground = function () {
            backgroundEl.removeAttribute("background");
            backgroundEl.removeAttribute("environment");
            Array.prototype.forEach.call(backgroundEl.querySelectorAll('a-sun-sky'), (oldSun) => {
                if (oldSun && oldSun.parentNode) oldSun.parentNode.removeChild(oldSun);
            });
            const manSky = document.getElementById('default-sky');
            if (manSky) manSky.parentNode.removeChild(manSky);
            const manSun = document.getElementById('default-sun');
            if (manSun) manSun.parentNode.removeChild(manSun);
            const pmndrsSun = document.getElementById('vrodos-pmndrs-sun');
            if (pmndrsSun) pmndrsSun.parentNode.removeChild(pmndrsSun);
            const pmndrsSunHaze = document.getElementById('vrodos-pmndrs-sun-haze');
            if (pmndrsSunHaze) pmndrsSunHaze.parentNode.removeChild(pmndrsSunHaze);
            const oldOceanPlane = backgroundEl.querySelector('.ocean_asset');
            if (oldOceanPlane) oldOceanPlane.parentNode.removeChild(oldOceanPlane);
            const oldPresetSky = backgroundEl.querySelector('a-sky[data-vrodos-preset-sky="true"]');
            if (oldPresetSky) oldPresetSky.parentNode.removeChild(oldPresetSky);
            const customSky = backgroundEl.querySelector('#sky');
            if (customSky) customSky.parentNode.removeChild(customSky);
        };

        switch (this.data.selChoice) {
            case "4":
                clearGeneratedBackground();
                break;
            case "0":
                clearGeneratedBackground();
                if (!(this.data.postFXEngine === 'pmndrs' && this.isPmndrsAtmosphereEnabled() && window.VRODOS_TAKRAM_ATMOSPHERE)) {
                    backgroundEl.setAttribute("environment", {
                        preset: 'default',
                        ground: 'none',
                        fog: (this.data.fogCategory === "2") ? (parseFloat(this.data.fogdensity) * 1.5) : 0,
                        playArea: 1,
                        shadow: true
                    });
                }
                this.applyHorizonSkyPreset();
                break;
            case "1":
                clearGeneratedBackground();
                backgroundEl.setAttribute("background", "color", this.data.color);
                break;
            case "2":
                clearGeneratedBackground();

                if (this.data.presChoice == "ocean") {
                    const sky = document.createElement('a-sky');
                    sky.setAttribute("color", "#a4bede");
                    sky.setAttribute("data-vrodos-preset-sky", "true");
                    backgroundEl.appendChild(sky);
                    if (presetGroundEnabled) {
                        const plane = document.createElement('a-plane');
                        plane.setAttribute("color", "#ffffff");
                        plane.setAttribute("position", "0 4.5 0");
                        plane.setAttribute("height", "11");
                        plane.setAttribute("width", "11");
                        plane.setAttribute("rotation", "90 90 0");
                        plane.setAttribute("material", "opacity:0.4");
                        plane.setAttribute("scale", "15 15 15");
                        plane.setAttribute("class", "ocean_asset");
                        backgroundEl.appendChild(plane);
                    }
                } else {
                    backgroundEl.setAttribute("environment", "preset", this.data.presChoice);
                    backgroundEl.setAttribute("environment", "ground", presetGroundEnabled ? "flat" : "none");
                    backgroundEl.setAttribute("environment", "fog", (this.data.fogCategory === "2") ? (parseFloat(this.data.fogdensity) * 1.5) : "0");
                    backgroundEl.setAttribute("environment", "playArea", "1.4");
                    backgroundEl.setAttribute("environment", "shadow", "true");
                }
                break;
            case "3":
                clearGeneratedBackground();
                const customImgAsset = document.querySelector('#custom_sky');
                if (customImgAsset && customImgAsset.getAttribute("src")) {
                    const skyElem = document.createElement('a-sky');
                    skyElem.setAttribute("id", "sky");
                    skyElem.setAttribute("src", "#custom_sky");
                    backgroundEl.appendChild(skyElem);
                } else {
                    backgroundEl.setAttribute("background", "color", "#ffffff");
                }
                break;
        }

        this.queueQualityRefresh(true);
        this.applyVrRenderBudgetPolicy('init');
        this.publishRuntimeFeatureState('init');
    },
    remove: function () {
        this.el.removeEventListener('model-loaded', this.handleQualityModelLoad);
        this.el.removeEventListener('child-attached', this.handleSceneMutation);
        this.el.removeEventListener('child-detached', this.handleSceneMutation);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('fullscreenchange', this.handlePresentationModeChange);
        document.removeEventListener('webkitfullscreenchange', this.handlePresentationModeChange);
        document.removeEventListener('mozfullscreenchange', this.handlePresentationModeChange);
        document.removeEventListener('MSFullscreenChange', this.handlePresentationModeChange);
        if (this.queuedQualityRefreshId) {
            clearTimeout(this.queuedQualityRefreshId);
            this.queuedQualityRefreshId = null;
        }
        if (this._vrodosShadowFlushHandle) {
            if (typeof cancelAnimationFrame === 'function') {
                cancelAnimationFrame(this._vrodosShadowFlushHandle);
            }
            clearTimeout(this._vrodosShadowFlushHandle);
            this._vrodosShadowFlushHandle = null;
        }
        if (this._vrodosShadowPerfOverlay && this._vrodosShadowPerfOverlay.parentNode) {
            this._vrodosShadowPerfOverlay.parentNode.removeChild(this._vrodosShadowPerfOverlay);
            this._vrodosShadowPerfOverlay = null;
        }
        this.disablePostProcessing();
        this.disablePmndrsPostProcessing();
        this.disposePmndrsAtmosphere();
        vrodosDisposeRuntimeResource(this._envMapRenderTarget);
        this._envMapRenderTarget = null;
        this.disposeSceneProbe(false);
        if (this.el && this.el.object3D) {
            this.el.object3D.environment = null;
        }
        this.disableFPSMeter();
        this.removePhotorealHelperLights();
        const manualSun = document.getElementById('default-sun');
        if (manualSun && manualSun.parentNode) {
            manualSun.parentNode.removeChild(manualSun);
        }
        const pmndrsSun = document.getElementById('vrodos-pmndrs-sun');
        if (pmndrsSun && pmndrsSun.parentNode) {
            pmndrsSun.parentNode.removeChild(pmndrsSun);
        }
        const pmndrsSunHaze = document.getElementById('vrodos-pmndrs-sun-haze');
        if (pmndrsSunHaze && pmndrsSunHaze.parentNode) {
            pmndrsSunHaze.parentNode.removeChild(pmndrsSunHaze);
        }
        if (this.runtimeResources) {
            this.runtimeResources.disposeAll();
            this.runtimeResources = null;
        }
    },
    tick: function (time) {
        const hasFocusedPipeline = this.el.components &&
            this.el.components['vrodos-render-profile'] &&
            this.el.components['vrodos-atmosphere'] &&
            this.el.components['vrodos-reflections'];

        if (hasFocusedPipeline) {
            return;
        }

        this.publishRuntimeFeatureState('scene-settings-tick', { time, throttleMs: 1500 });

        if (this.fpsStats && typeof this.fpsStats.update === 'function') {
            this.fpsStats.update();
        }

        this._pmndrsTickTimeMs = typeof time === 'number' ? time : null;
        this.updatePmndrsHorizonSun();
        if (typeof this.updatePmndrsDayNightCycleFrame === 'function') {
            this.updatePmndrsDayNightCycleFrame(time);
        }
        this.updateAdaptiveShadowFit(false);

        const effectiveReflectionSource = this.getEffectiveReflectionSource();
        if (typeof this.updateReflectionEnvironmentIntensity === 'function') {
            this.updateReflectionEnvironmentIntensity(time, effectiveReflectionSource);
        }
        if (effectiveReflectionSource === 'takram-sky') {
            if (typeof this.updateTakramSkyEnvironment === 'function') {
                this.updateTakramSkyEnvironment(time);
            }
            return;
        }

        if (effectiveReflectionSource !== 'scene-probe') {
            return;
        }

        const sceneProbeUpdateMode = this.getSceneProbeUpdateMode();
        if (sceneProbeUpdateMode === 'static' && !this._sceneProbeNeedsUpdate && this._sceneProbeLastYaw !== null) {
            return;
        }

        if (sceneProbeUpdateMode === 'slow-dynamic' && !this._sceneProbeNeedsUpdate && this._sceneProbeLastYaw !== null) {
            const anchorObject = this.getSceneProbeAnchorObject();
            if (anchorObject) {
                anchorObject.updateMatrixWorld(true);
                anchorObject.getWorldPosition(this._sceneProbeCurrentPosition);
                if (this._sceneProbeCurrentPosition.distanceToSquared(this._sceneProbeLastPosition) > (6 * 6) ||
                    this.getSceneProbeYawDeltaDegrees(this.getSceneProbeAnchorYaw(anchorObject), this._sceneProbeLastYaw) > 45) {
                    this._sceneProbeNeedsUpdate = true;
                }
            }
        }

        if (!this._sceneProbeNeedsUpdate) {
            return;
        }

        const captureCooldownMs = sceneProbeUpdateMode === 'slow-dynamic' ? 5000 : 500;
        if ((time - this._sceneProbeLastCaptureMs) < captureCooldownMs) {
            return;
        }

        const modelSettleMs = sceneProbeUpdateMode === 'slow-dynamic' ? 750 : 350;
        if (this._sceneProbeLastModelEventMs && (time - this._sceneProbeLastModelEventMs) < modelSettleMs) {
            return;
        }

        this.captureSceneProbe(time);
    }
});
