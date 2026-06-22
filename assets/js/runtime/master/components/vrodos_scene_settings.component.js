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

function vrodosRuntimeProfileOverrideValue() {
    const debugConfig = window.VRODOS_DEBUG || {};
    const override = (typeof debugConfig.vrRuntimeProfile === 'string' && debugConfig.vrRuntimeProfile) ||
        (typeof debugConfig.vrProfile === 'string' && debugConfig.vrProfile) ||
        vrodosRuntimeQueryValue('vrodos_vr_profile');

    return override ? String(override).toLowerCase() : '';
}

const VRODOS_VR_RUNTIME_PROFILES = ['desktop', 'headset', 'baseline', 'safe', 'takram-lights', 'takram-sky', 'hdr-reflections', 'balanced', 'max'];
const VRODOS_VR_HDR_PROFILES = ['headset', 'hdr-reflections', 'balanced', 'max'];

function vrodosNormalizeRuntimeProfile(profile) {
    const normalized = String(profile || '').toLowerCase();
    return VRODOS_VR_RUNTIME_PROFILES.indexOf(normalized) !== -1 ? normalized : 'desktop';
}

function vrodosRuntimeProfileAllows(profile, capability, authored) {
    const normalized = vrodosNormalizeRuntimeProfile(profile);
    const strictSceneOwned = normalized === 'baseline' || normalized === 'safe';
    if (capability === 'nativeAntialias') {
        return normalized !== 'desktop';
    }
    if (normalized === 'desktop') {
        return Boolean(authored);
    }
    if (capability === 'sceneOwned') {
        return strictSceneOwned;
    }
    if (strictSceneOwned) {
        return false;
    }

    switch (capability) {
        case 'takramAtmosphere':
        case 'takramLights':
            return Boolean(authored);
        case 'takramVisibleSky':
            return normalized !== 'takram-lights' && Boolean(authored);
        case 'reflections':
        case 'hdrEnvMap':
            return VRODOS_VR_HDR_PROFILES.indexOf(normalized) !== -1 && Boolean(authored);
        case 'postProcessing':
            return normalized === 'max' && Boolean(authored);
        default:
            return false;
    }
}

function vrodosRuntimeProfileHdrFallbackPreset(profile) {
    return VRODOS_VR_HDR_PROFILES.indexOf(vrodosNormalizeRuntimeProfile(profile)) !== -1 ? 'studio' : 'none';
}

function vrodosParseComponentAttribute(attribute) {
    const values = {};
    String(attribute || '').split(';').forEach((entry) => {
        const trimmed = entry.trim();
        if (!trimmed) {
            return;
        }

        const separator = trimmed.indexOf(':');
        if (separator === -1) {
            values[trimmed] = 'true';
            return;
        }

        const key = trimmed.slice(0, separator).trim();
        if (key) {
            values[key] = trimmed.slice(separator + 1).trim();
        }
    });
    return values;
}

function vrodosSerializeComponentAttribute(values) {
    return Object.keys(values || {}).map((key) => `${key}: ${values[key]}`).join('; ');
}

function vrodosRuntimeProfileUsesNativeAntialias(profile) {
    return vrodosRuntimeProfileAllows(profile, 'nativeAntialias', true);
}

function vrodosPatchVrNativeRendererAntialias(sceneEl) {
    const profile = vrodosRuntimeProfileOverrideValue();
    if (!sceneEl || !vrodosRuntimeProfileUsesNativeAntialias(profile)) {
        return false;
    }

    const renderer = vrodosParseComponentAttribute(sceneEl.getAttribute('renderer') || '');
    if (renderer.antialias === 'true') {
        return true;
    }

    renderer.antialias = 'true';
    sceneEl.setAttribute('renderer', vrodosSerializeComponentAttribute(renderer));
    sceneEl.setAttribute('data-vrodos-vr-native-antialias-forced', profile);
    return true;
}

function vrodosInstallVrNativeRendererPreinitPatch() {
    if (typeof document === 'undefined' || !vrodosRuntimeProfileUsesNativeAntialias(vrodosRuntimeProfileOverrideValue())) {
        return;
    }

    const patchExistingScene = () => {
        const sceneEl = document.querySelector && document.querySelector('a-scene');
        return vrodosPatchVrNativeRendererAntialias(sceneEl);
    };

    if (patchExistingScene()) {
        return;
    }

    if (typeof MutationObserver === 'function' && document.documentElement) {
        const observer = new MutationObserver(() => {
            if (patchExistingScene()) {
                observer.disconnect();
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', patchExistingScene, { once: true });
    }
}

vrodosInstallVrNativeRendererPreinitPatch();

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

function vrodosRuntimeCloneSerializable(value) {
    if (value === null || value === undefined || typeof value !== 'object') {
        return value;
    }

    try {
        return JSON.parse(JSON.stringify(value));
    } catch (err) {
        if (Array.isArray(value)) {
            return value.slice();
        }
        return Object.assign({}, value);
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
        vrRuntimeProfile: { type: "string", default: vrodosSceneSettingDefault("vrRuntimeProfile", "desktop") },
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
        return map[this.getEffectiveEnvMapPreset()] || null;
    },
    getEffectiveEnvMapPreset: function () {
        const authoredPreset = this.data.envMapPreset || 'none';
        if (authoredPreset !== 'none') {
            return authoredPreset;
        }

        const fallbackPreset = vrodosRuntimeProfileHdrFallbackPreset(this.getVrRuntimeProfile());
        const authoredHdrReflections = this.areReflectionsEnabled() && this.getReflectionSource() === 'hdr';
        if (fallbackPreset && fallbackPreset !== 'none' && this.vrRuntimeAllows('hdrEnvMap', authoredHdrReflections)) {
            return fallbackPreset;
        }

        return authoredPreset;
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
        const authored = this.data.postFXEngine === 'pmndrs' && this.data.pmndrsAtmosphereEnabled !== '0';
        return this.vrRuntimeAllows('takramAtmosphere', authored);
    },
    isPmndrsAerialPerspectiveEffectEnabled: function () {
        return this.data.postFXEngine === 'pmndrs' &&
            (vrodosRuntimeTruthy(this.data.pmndrsAerialPerspectiveEnabled) ||
                vrodosRuntimeDebugFlag('enablePmndrsHorizonAerial', 'vrodos_debug_enable_pmndrs_horizon_aerial'));
    },
    isPmndrsCloudsEnabled: function () {
        const authored = this.getRenderQualityLevel() === 'high' &&
            this.data.postFXEngine === 'pmndrs' &&
            this.data.postFXEnabled !== '0' &&
            this.isPmndrsAtmosphereEnabled() &&
            vrodosRuntimeTruthy(this.data.pmndrsCloudsEnabled);

        return this.vrRuntimeAllows('clouds', authored) ||
            this.isVrCapabilityExperimentEnabled();
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
        const override = vrodosRuntimeProfileOverrideValue();
        const rawProfile = String(override || this.data.vrRuntimeProfile || 'desktop').toLowerCase();

        return vrodosNormalizeRuntimeProfile(rawProfile);
    },
    vrRuntimeAllows: function (capability, authored) {
        return vrodosRuntimeProfileAllows(this.getVrRuntimeProfile(), capability, authored);
    },
    isVrRuntimePolicyActive: function () {
        return this.getVrRuntimeProfile() !== 'desktop';
    },
    isVrRuntimeHeadsetProfile: function () {
        return this.getVrRuntimeProfile() === 'headset';
    },
    isVrRuntimeBaselineProfile: function () {
        return this.getVrRuntimeProfile() === 'baseline';
    },
    isVrRuntimeSafeProfile: function () {
        return this.getVrRuntimeProfile() === 'safe';
    },
    isVrRuntimeTakramLightsProfile: function () {
        return this.getVrRuntimeProfile() === 'takram-lights';
    },
    isVrRuntimeSceneOwnedProfile: function () {
        return this.vrRuntimeAllows('sceneOwned', true);
    },
    isVrBaselineRuntimeActive: function () {
        return this.isVrRuntimeBaselineProfile() && this.isVrRuntimePolicyActive();
    },
    isVrSceneOwnedRuntimeActive: function () {
        return this.isVrRuntimeSceneOwnedProfile() && this.isVrRuntimePolicyActive();
    },
    isVrRuntimeMaxProfile: function () {
        return this.getVrRuntimeProfile() === 'max';
    },
    isVrCapabilityExperimentEnabled: function () {
        return this.isVrRuntimeMaxProfile();
    },
    getVrRenderProfileDefaults: function (profile) {
        return {
            framebufferScale: profile === 'balanced' ? 0.9 : 1.0,
            foveation: profile === 'balanced' ? 0.75 : 0.5
        };
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
        const sceneOwnedProfile = this.isVrRuntimeSceneOwnedProfile();
        const takramLightsOnly = this.isVrRuntimeTakramLightsProfile();
        const authoredTakramAtmosphere = this.data.postFXEngine === 'pmndrs' && this.isPmndrsAtmosphereEnabled();
        const authoredReflections = this.areReflectionsEnabled();
        const authoredHdrReflections = authoredReflections &&
            (this.getReflectionSource() === 'hdr' || (this.data.envMapPreset || 'none') !== 'none');
        const authoredPmndrsComposer = this.data.postFXEngine === 'pmndrs' && this.hasPmndrsComposerEffectRequest();
        const authoredSceneProbe = authoredReflections && this.getReflectionSource() === 'scene-probe';
        const authoredTakramSkyEnvironment = authoredReflections && authoredTakramAtmosphere;
        const takramVisibleSky = profileActive && this.vrRuntimeAllows('takramVisibleSky', authoredTakramAtmosphere);
        const hdrReflections = profileActive && this.vrRuntimeAllows('hdrEnvMap', authoredHdrReflections);
        const pmndrsComposer = active &&
            profileActive &&
            this.data.postFXEngine === 'pmndrs' &&
            this.canUsePmndrsComposerOnHeadset() &&
            (
                this.vrRuntimeAllows('pmndrsComposer', authoredPmndrsComposer) ||
                this.isVrCapabilityExperimentEnabled()
            );
        const sceneProbe = active &&
            profileActive &&
            (
                this.vrRuntimeAllows('sceneProbe', authoredSceneProbe) ||
                this.isVrCapabilityExperimentEnabled()
            );
        const takramSkyEnvironment = active &&
            profileActive &&
            (
                this.vrRuntimeAllows('takramSkyEnvironment', authoredTakramSkyEnvironment) ||
                this.isVrCapabilityExperimentEnabled()
            );
        const clouds = active &&
            profileActive &&
            this.data.postFXEngine === 'pmndrs' &&
            (
                this.vrRuntimeAllows('clouds', this.isPmndrsCloudsEnabled()) ||
                this.isVrCapabilityExperimentEnabled()
            );

        return {
            profile,
            active,
            profileActive,
            headset: this.isVrRuntimeHeadsetProfile(),
            baseline: this.isVrRuntimeBaselineProfile(),
            safe: this.isVrRuntimeSafeProfile(),
            takramLightsOnly,
            takramVisibleSky,
            hdrReflections,
            sceneOwnedProfile,
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
        const authoredPostProcessing = this.hasPostProcessingPipelineRequest();
        if (this.isVrRuntimePolicyActive() && !this.vrRuntimeAllows('postProcessing', authoredPostProcessing)) {
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
        if (this.isVrRuntimePolicyActive() && !this.canUseVrSceneProbe()) {
            return false;
        }

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
        if (this.isVrRuntimePolicyActive() && !this.canUseVrTakramSkyEnvironment()) {
            return false;
        }

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
        if (!this.vrRuntimeAllows('reflections', this.areReflectionsEnabled())) {
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

        const authoredEnvMapPreset = (this.data.envMapPreset || 'none') !== 'none';
        const authoredHdrEnvMap = this.getReflectionSource() === 'hdr' || authoredEnvMapPreset;
        if (authoredHdrEnvMap && this.getEffectiveEnvMapPreset() !== 'none' && this.vrRuntimeAllows('hdrEnvMap', authoredHdrEnvMap)) {
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
        const immersiveXrPresenting = movement && typeof movement.isImmersiveXrPresenting === 'function'
            ? movement.isImmersiveXrPresenting()
            : false;
        const immersiveWorldRoots = movement && typeof movement.getImmersiveWorldRootDiagnostics === 'function'
            ? movement.getImmersiveWorldRootDiagnostics()
            : null;

        return {
            componentPresent: Boolean(movement),
            authoredNavigationMode: this.data.navigationMode || '',
            navigationMode,
            collisionMode: this.data.collisionMode || 'auto',
            collisionConfigured,
            collisionActive: Boolean(collisionConfigured && navMeshTargets > 0),
            immersiveCollisionActive: Boolean(immersiveXrPresenting && collisionConfigured && navMeshTargets > 0),
            immersivePseudoGravityActive: Boolean(immersiveXrPresenting && collisionConfigured && navMeshTargets > 0 && movement && movement.heightOffset !== null),
            immersiveHeightOffset: movement && typeof movement.heightOffset === 'number'
                ? Number(movement.heightOffset.toFixed(3))
                : null,
            immersiveRawHeightOffset: movement && typeof movement.immersiveRawHeightOffset === 'number'
                ? Number(movement.immersiveRawHeightOffset.toFixed(3))
                : null,
            immersiveHeightCalibrationApplied: Boolean(movement && movement.immersiveHeightCalibrationApplied),
            immersiveHeightSource: movement && movement.immersiveHeightSource ? movement.immersiveHeightSource : 'none',
            desktopVisionHeightOffset: movement && typeof movement.desktopVisionHeightOffset === 'number'
                ? Number(movement.desktopVisionHeightOffset.toFixed(3))
                : null,
            desktopVisionGroundY: movement && typeof movement.desktopVisionGroundY === 'number'
                ? Number(movement.desktopVisionGroundY.toFixed(3))
                : null,
            desktopVisionNavigationY: movement && typeof movement.desktopVisionNavigationY === 'number'
                ? Number(movement.desktopVisionNavigationY.toFixed(3))
                : null,
            desktopVisionHeightSource: movement && movement.desktopVisionHeightSource ? movement.desktopVisionHeightSource : 'none',
            immersiveLastGroundY: movement && movement.hasLastGroundHit && movement.lastGroundHit && movement.lastGroundHit.point
                ? Number(movement.lastGroundHit.point.y.toFixed(3))
                : null,
            bvhBundleLoaded: Boolean(window.VRODOS_COLLISION_BVH),
            bvhInstalled: Boolean(movement && movement.bvhInstalled),
            navMeshRoots: movement && movement.navMeshRoots ? movement.navMeshRoots.length : 0,
            navMeshTargets,
            colliderRoots: movement && movement.colliderRoots ? movement.colliderRoots.length : 0,
            blockerTargets: movement && movement.blockerCollisionTargets ? movement.blockerCollisionTargets.length : 0,
            navMeshDirty: Boolean(movement && movement.navMeshDirty),
            collisionWorldDirty: Boolean(movement && movement.collisionWorldDirty),
            immersiveWorldRootCount: immersiveWorldRoots && typeof immersiveWorldRoots.count === 'number'
                ? immersiveWorldRoots.count
                : 0,
            immersiveWorldRootSamples: immersiveWorldRoots && Array.isArray(immersiveWorldRoots.samples)
                ? immersiveWorldRoots.samples
                : [],
            immersiveWorldVideoDisplayRootCount: immersiveWorldRoots && typeof immersiveWorldRoots.videoDisplayRootCount === 'number'
                ? immersiveWorldRoots.videoDisplayRootCount
                : 0,
            immersiveWorldAssessmentRootCount: immersiveWorldRoots && typeof immersiveWorldRoots.assessmentRootCount === 'number'
                ? immersiveWorldRoots.assessmentRootCount
                : 0,
            immersiveWorldAssessmentWrapperRootCount: immersiveWorldRoots && typeof immersiveWorldRoots.assessmentWrapperRootCount === 'number'
                ? immersiveWorldRoots.assessmentWrapperRootCount
                : 0,
            immersiveWorldCefrRootCount: immersiveWorldRoots && typeof immersiveWorldRoots.cefrRootCount === 'number'
                ? immersiveWorldRoots.cefrRootCount
                : 0,
            immersiveWorldIncludesVideoDisplays: Boolean(immersiveWorldRoots && immersiveWorldRoots.includesVideoDisplays),
            immersiveWorldIncludesAssessmentWrappers: Boolean(immersiveWorldRoots && immersiveWorldRoots.includesAssessmentWrappers),
            immersiveCollisionRootsCovered: Boolean(!immersiveWorldRoots || immersiveWorldRoots.collisionRootsCovered),
            immersiveMissingCollisionRootCount: immersiveWorldRoots && typeof immersiveWorldRoots.missingCollisionRootCount === 'number'
                ? immersiveWorldRoots.missingCollisionRootCount
                : 0,
            immersiveMissingCollisionRootSamples: immersiveWorldRoots && Array.isArray(immersiveWorldRoots.missingCollisionRootSamples)
                ? immersiveWorldRoots.missingCollisionRootSamples
                : [],
            immersiveAuthoredNavPosition: movement && movement.immersiveVirtualNavPosition
                ? {
                    x: Number(movement.immersiveVirtualNavPosition.x.toFixed(3)),
                    y: Number(movement.immersiveVirtualNavPosition.y.toFixed(3)),
                    z: Number(movement.immersiveVirtualNavPosition.z.toFixed(3))
                }
                : null,
            immersivePhysicalAnchorPosition: movement && movement.immersivePhysicalAnchorPosition
                ? {
                    x: Number(movement.immersivePhysicalAnchorPosition.x.toFixed(3)),
                    y: Number(movement.immersivePhysicalAnchorPosition.y.toFixed(3)),
                    z: Number(movement.immersivePhysicalAnchorPosition.z.toFixed(3))
                }
                : null,
            immersiveRenderOffset: movement && movement.immersiveRenderOffset
                ? {
                    x: Number(movement.immersiveRenderOffset.x.toFixed(3)),
                    y: Number(movement.immersiveRenderOffset.y.toFixed(3)),
                    z: Number(movement.immersiveRenderOffset.z.toFixed(3))
                }
                : null,
            immersiveRenderYawDeg: movement && typeof movement.immersiveRenderYaw === 'number'
                ? Number((movement.immersiveRenderYaw * 180 / Math.PI).toFixed(2))
                : 0,
            immersiveLastStepDeltaY: movement && typeof movement.immersiveLastStepDeltaY === 'number'
                ? Number(movement.immersiveLastStepDeltaY.toFixed(3))
                : 0,
            immersivePresentationTransformActive: Boolean(immersiveXrPresenting && movement && movement.immersiveWorldBaseTransforms && movement.immersiveWorldBaseTransforms.size > 0),
            lastNonImmersiveHeightOffset: movement && typeof movement.lastNonImmersiveHeightOffset === 'number'
                ? Number(movement.lastNonImmersiveHeightOffset.toFixed(3))
                : null,
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
    readWorldPositionForDiagnostics: function (el) {
        if (!el || !el.object3D || typeof THREE === 'undefined') {
            return null;
        }

        const position = new THREE.Vector3();
        el.object3D.getWorldPosition(position);
        return {
            x: Number(position.x.toFixed(3)),
            y: Number(position.y.toFixed(3)),
            z: Number(position.z.toFixed(3))
        };
    },
    getCameraRigFeatureDiagnostics: function () {
        const sceneEl = this.el;
        const playerRig = document.getElementById("player");
        const cameraEl = document.getElementById("cameraA");
        const rightController = document.getElementById("oculusRight");
        const leftController = document.getElementById("oculusLeft");
        const activeCameraEl = sceneEl && sceneEl.camera && sceneEl.camera.el ? sceneEl.camera.el : null;

        return {
            projectType: this.data.pr_type || '',
            activeCameraId: activeCameraEl && activeCameraEl.id ? activeCameraEl.id : '',
            expectedCameraId: cameraEl && cameraEl.id ? cameraEl.id : '',
            activeCameraMatchesExpected: Boolean(activeCameraEl && cameraEl && activeCameraEl === cameraEl),
            authoredCameraPosition: this.data.cam_position || '',
            playerPosition: playerRig ? playerRig.getAttribute("position") : null,
            cameraLocalPosition: cameraEl ? cameraEl.getAttribute("position") : null,
            playerWorldPosition: this.readWorldPositionForDiagnostics(playerRig),
            cameraWorldPosition: this.readWorldPositionForDiagnostics(cameraEl),
            rightControllerWorldPosition: this.readWorldPositionForDiagnostics(rightController),
            leftControllerWorldPosition: this.readWorldPositionForDiagnostics(leftController)
        };
    },
    getActivePostProcessingOwner: function (postProcessingRequested, postProcessingAllowed) {
        if (postProcessingAllowed) {
            if (this.data.postFXEngine === 'pmndrs') {
                return this.pmndrsActive ? 'pmndrs' : 'pmndrs-pending';
            }
            return this.postProcessingActive ? 'legacy' : 'legacy-pending';
        }

        if (postProcessingRequested && this.isVrRuntimePolicyActive()) {
            return `vr-${this.getVrRuntimeProfile()}-disabled`;
        }

        if (postProcessingRequested && this.isDirectVrPresentationActive()) {
            return 'direct-xr-fallback';
        }

        if (postProcessingRequested) {
            return 'disabled';
        }

        return 'direct';
    },
    getRuntimeRevealReadinessState: function (options) {
        const opts = options || {};
        const startLoads = opts.startLoads !== false;
        const pending = [];
        const state = {
            ready: true,
            pending,
            message: 'Finalizing scene...',
            takramSkyReady: true,
            takramSkyRequested: false,
            takramSkyFailed: false,
            takramSkyWarmed: true,
            takramSkyWarmupMs: 0,
            takramSkyWarmupRemainingMs: 0,
            hdrReady: true,
            hdrRequested: false,
            hdrLoading: false,
            hdrFailed: false,
            hdrError: ''
        };
        const addPending = function (key, message) {
            if (pending.indexOf(key) === -1) {
                pending.push(key);
            }
            state.ready = false;
            state.message = message || state.message;
        };

        const featurePolicy = this.getVrRuntimeFeaturePolicy();
        const wantsTakramSky = featurePolicy.takramVisibleSky &&
            this.data.postFXEngine === 'pmndrs' &&
            typeof this.isPmndrsAtmosphereEnabled === 'function' &&
            this.isPmndrsAtmosphereEnabled() &&
            Boolean(window.VRODOS_TAKRAM_ATMOSPHERE);

        if (wantsTakramSky) {
            state.takramSkyRequested = true;
            let takramReady = true;
            let takramFailed = false;
            if (startLoads && typeof this.prepareVrTakramVisibleSkyForReveal === 'function') {
                takramReady = this.prepareVrTakramVisibleSkyForReveal();
            } else {
                const atmosphereState = this._pmndrsAtmosphereState || null;
                const material = atmosphereState && atmosphereState.skyMaterial ? atmosphereState.skyMaterial : null;
                const userData = material && material.userData ? material.userData : {};
                const shaderPatched = Boolean(
                    (atmosphereState && atmosphereState.vrTakramSkyDirectShaderPatched) ||
                    userData.vrodosVrTakramSkyDirectShaderPatched
                );
                const shaderPatchFailed = Boolean(
                    (atmosphereState && atmosphereState.vrTakramSkyDirectPatchFailed) ||
                    userData.vrodosVrTakramSkyDirectPatchFailed
                );
                const skyWarmed = Boolean(
                    (atmosphereState && atmosphereState.vrTakramSkyDirectWarmed) ||
                    userData.vrodosVrTakramSkyDirectWarmed
                );
                takramReady = Boolean(shaderPatched && !shaderPatchFailed && skyWarmed);
                takramFailed = shaderPatchFailed;
            }

            const atmosphereState = this._pmndrsAtmosphereState || null;
            const material = atmosphereState && atmosphereState.skyMaterial ? atmosphereState.skyMaterial : null;
            const userData = material && material.userData ? material.userData : {};
            takramFailed = takramFailed || Boolean(
                (atmosphereState && atmosphereState.vrTakramSkyDirectPatchFailed) ||
                userData.vrodosVrTakramSkyDirectPatchFailed
            );
            state.takramSkyReady = Boolean(takramReady);
            state.takramSkyFailed = takramFailed;
            state.takramSkyWarmed = Boolean(
                (atmosphereState && atmosphereState.vrTakramSkyDirectWarmed) ||
                userData.vrodosVrTakramSkyDirectWarmed
            );
            state.takramSkyWarmupMs = atmosphereState && typeof atmosphereState.vrTakramSkyDirectWarmupMs === 'number'
                ? atmosphereState.vrTakramSkyDirectWarmupMs
                : (typeof userData.vrodosVrTakramSkyDirectWarmupMs === 'number' ? userData.vrodosVrTakramSkyDirectWarmupMs : 0);
            state.takramSkyWarmupRemainingMs = atmosphereState && typeof atmosphereState.vrTakramSkyDirectWarmupRemainingMs === 'number'
                ? atmosphereState.vrTakramSkyDirectWarmupRemainingMs
                : (typeof userData.vrodosVrTakramSkyDirectWarmupRemainingMs === 'number' ? userData.vrodosVrTakramSkyDirectWarmupRemainingMs : 0);
            if (!state.takramSkyReady && !state.takramSkyFailed) {
                addPending('takram-sky', 'Preparing sky...');
            }
        }

        const wantsHdrReflections = Boolean(featurePolicy.hdrReflections) &&
            typeof this.getEffectiveReflectionSource === 'function' &&
            this.getEffectiveReflectionSource() === 'hdr';

        if (wantsHdrReflections) {
            state.hdrRequested = true;
            let hdrReady = Boolean(this._currentReflectionSource === 'hdr' && this._envMapRenderTarget);
            if (!hdrReady && !this._hdrEnvMapLoading && !this._hdrEnvMapFailed &&
                startLoads && typeof this.applyEnvMapProfile === 'function') {
                this.applyEnvMapProfile();
                hdrReady = Boolean(this._currentReflectionSource === 'hdr' && this._envMapRenderTarget);
            }

            state.hdrLoading = Boolean(this._hdrEnvMapLoading);
            state.hdrFailed = Boolean(this._hdrEnvMapFailed);
            state.hdrError = this._hdrEnvMapError || '';
            state.hdrReady = Boolean(hdrReady);
            if (!state.hdrReady && !state.hdrFailed) {
                addPending('hdr-env-map', 'Preparing HDR reflections...');
            }
        }

        if (pending.length > 1) {
            state.message = 'Preparing scene rendering...';
        } else if (!pending.length) {
            state.message = 'Finalizing scene...';
        }

        return state;
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
        const takramLightsOnlyState = typeof this.getVrTakramLightsOnlyState === 'function'
            ? this.getVrTakramLightsOnlyState()
            : null;
        const cameraRigDiagnostics = this.getCameraRigFeatureDiagnostics();
        const vrFeaturePolicy = this.getVrRuntimeFeaturePolicy();
        const vrSceneOwnedActive = this.isVrSceneOwnedRuntimeActive();
        const vrTakramLightsOnlyActive = Boolean(vrFeaturePolicy.takramLightsOnly);
        const vrHdrReflectionsActive = Boolean(vrFeaturePolicy.hdrReflections);
        const vrTakramVisibleSkyActive = Boolean(vrFeaturePolicy.takramVisibleSky);
        const pmndrsAtmosphereSkyVisible = typeof this.isPmndrsAtmosphereSkyVisible === 'function' &&
            this.isPmndrsAtmosphereSkyVisible();
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
            cameraRig: cameraRigDiagnostics,
            renderer: {
                renderQuality: this.getRenderQualityLevel(),
                aaQuality: this.getAAQualityLevel(),
                pixelRatio,
                webgl2: Boolean(renderer && renderer.capabilities && renderer.capabilities.isWebGL2 === true),
                vrRenderBudget: this._vrodosVrRenderBudget || this.getVrRenderBudgetPolicy()
            },
            reveal: this.getRuntimeRevealReadinessState({ startLoads: false }),
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
                atmosphereRequested: Boolean(!vrSceneOwnedActive && !vrTakramLightsOnlyActive && this.data.postFXEngine === 'pmndrs' && this.isPmndrsAtmosphereEnabled()),
                atmosphereBundleLoaded: Boolean(window.VRODOS_TAKRAM_ATMOSPHERE),
                atmosphereReady: Boolean(!vrSceneOwnedActive && atmosphereState && atmosphereState.ready && !atmosphereState.failed),
                atmosphereProfile: atmosphereState && atmosphereState.profileSignature ? atmosphereState.profileSignature : '',
                atmospherePrecision: atmosphereState && atmosphereState.precision ? atmosphereState.precision : '',
                atmosphereHigherOrderScattering: Boolean(atmosphereState && atmosphereState.higherOrderScattering),
                dayNightCycleActive: Boolean(!vrSceneOwnedActive && this.isPmndrsDayNightCycleActive()),
                horizonOwner: vrTakramVisibleSkyActive && pmndrsAtmosphereSkyVisible
                    ? 'takram-sky'
                    : ((vrSceneOwnedActive || vrTakramLightsOnlyActive) ? 'aframe-environment' : (horizonState && horizonState.owner ? horizonState.owner : '')),
                lightOwner: takramLightsOnlyState && takramLightsOnlyState.active ? takramLightsOnlyState.owner : (horizonState && horizonState.owner ? horizonState.owner : ''),
                takramSunEnabled: Boolean(!vrSceneOwnedActive && horizonState && horizonState.takramSunEnabled),
                visibleSkyRequested: Boolean(vrTakramVisibleSkyActive),
                visibleSkyActive: Boolean(vrTakramVisibleSkyActive && pmndrsAtmosphereSkyVisible),
                visibleSkyDirectCalibrated: Boolean(vrTakramVisibleSkyActive && atmosphereState && atmosphereState.vrTakramSkyDirectCalibrated),
                visibleSkyDirectExposure: atmosphereState && typeof atmosphereState.vrTakramSkyDirectExposure === 'number'
                    ? atmosphereState.vrTakramSkyDirectExposure
                    : null,
                visibleSkyDirectShaderPatched: Boolean(vrTakramVisibleSkyActive && atmosphereState && atmosphereState.vrTakramSkyDirectShaderPatched),
                visibleSkyDirectPatchFailed: Boolean(vrTakramVisibleSkyActive && atmosphereState && atmosphereState.vrTakramSkyDirectPatchFailed),
                visibleSkyDirectCompileError: vrTakramVisibleSkyActive && atmosphereState && atmosphereState.vrTakramSkyDirectCompileError
                    ? atmosphereState.vrTakramSkyDirectCompileError
                    : '',
                visibleSkyDirectWarmed: Boolean(vrTakramVisibleSkyActive && atmosphereState && atmosphereState.vrTakramSkyDirectWarmed),
                visibleSkyDirectWarmupMs: vrTakramVisibleSkyActive && atmosphereState && typeof atmosphereState.vrTakramSkyDirectWarmupMs === 'number'
                    ? atmosphereState.vrTakramSkyDirectWarmupMs
                    : null,
                visibleSkyDirectWarmupRemainingMs: vrTakramVisibleSkyActive && atmosphereState && typeof atmosphereState.vrTakramSkyDirectWarmupRemainingMs === 'number'
                    ? atmosphereState.vrTakramSkyDirectWarmupRemainingMs
                    : null,
                lightsOnlyRequested: Boolean(takramLightsOnlyState && takramLightsOnlyState.requested),
                lightsOnlyEligible: Boolean(takramLightsOnlyState && takramLightsOnlyState.eligible),
                lightsOnlyActive: Boolean(takramLightsOnlyState && takramLightsOnlyState.active),
                lightsOnlyUnavailableReason: takramLightsOnlyState && takramLightsOnlyState.unavailableReason ? takramLightsOnlyState.unavailableReason : '',
                lightsOnlySourceCount: takramLightsOnlyState && typeof takramLightsOnlyState.sourceCount === 'number' ? takramLightsOnlyState.sourceCount : 0,
                cloudsRequested: Boolean(vrFeaturePolicy.clouds && this.isPmndrsCloudsEnabled()),
                cloudsBundleLoaded: Boolean(window.VRODOS_TAKRAM_CLOUDS),
                cloudsActive: Boolean(vrFeaturePolicy.clouds && cloudDiagnostics.cloudsActive),
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
                hdrLoading: Boolean(this._hdrEnvMapLoading),
                hdrFailed: Boolean(this._hdrEnvMapFailed),
                hdrError: this._hdrEnvMapError || '',
                sceneProbeCapable: this.canUseSceneProbe(),
                sceneProbeTargetReady: Boolean(this._sceneProbePmremTarget),
                sceneProbeNeedsUpdate: Boolean(this._sceneProbeNeedsUpdate),
                takramSkyEnvironmentCapable: this.canUseTakramSkyEnvironment(),
                takramSkyTargetReady: Boolean(this._takramSkyPmremTarget),
                hdrReflectionsProfile: Boolean(vrHdrReflectionsActive),
                hdrEnvMapOnly: Boolean(vrHdrReflectionsActive && effectiveReflectionSource === 'hdr'),
                effectiveEnvMapPreset: typeof this.getEffectiveEnvMapPreset === 'function'
                    ? this.getEffectiveEnvMapPreset()
                    : (this.data.envMapPreset || 'none')
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
    normalizeXrExitEnabledValue: function (value, fallback) {
        if (value === undefined || value === null || value === '') {
            return Boolean(fallback);
        }

        return !(value === false || value === 'false' || value === '0' || value === 0);
    },
    getXrSession: function () {
        const renderer = this.el && this.el.renderer ? this.el.renderer : null;
        const xr = renderer && renderer.xr ? renderer.xr : null;

        if (!xr || typeof xr.getSession !== 'function') {
            return null;
        }

        try {
            return xr.getSession();
        } catch (err) {
            return null;
        }
    },
    getXrExitRestoreFlags: function () {
        const renderer = this.el && this.el.renderer ? this.el.renderer : null;
        const xr = renderer && renderer.xr ? renderer.xr : null;
        let xrSession = null;

        if (xr && typeof xr.getSession === 'function') {
            try {
                xrSession = xr.getSession();
            } catch (err) {
                xrSession = null;
            }
        }

        return {
            xrPresenting: Boolean(xr && xr.isPresenting),
            xrSession: Boolean(xrSession),
            aframeVrMode: Boolean(this.el && this.el.is && this.el.is('vr-mode')),
            aframeArMode: Boolean(this.el && this.el.is && this.el.is('ar-mode')),
            documentHidden: Boolean(typeof document !== 'undefined' && document.visibilityState === 'hidden')
        };
    },
    isXrExitRestoreReady: function (flags) {
        const currentFlags = flags || this.getXrExitRestoreFlags();
        return !currentFlags.xrPresenting &&
            !currentFlags.xrSession &&
            !currentFlags.aframeVrMode &&
            !currentFlags.aframeArMode &&
            !currentFlags.documentHidden;
    },
    getXrExitCameraElement: function () {
        if (typeof document === 'undefined') {
            return null;
        }

        return document.getElementById("cameraA") ||
            (this.el && this.el.camera && this.el.camera.el ? this.el.camera.el : null) ||
            (document.querySelector ? document.querySelector('[camera]') : null);
    },
    getXrExitCameraObject: function (cameraEl) {
        const targetEl = cameraEl || this.getXrExitCameraElement();
        if (targetEl && targetEl.components && targetEl.components.camera && targetEl.components.camera.camera) {
            return targetEl.components.camera.camera;
        }
        if (this.el && this.el.camera) {
            return this.el.camera;
        }
        return null;
    },
    getXrExitInlineCanvasSize: function () {
        const renderer = this.el && this.el.renderer ? this.el.renderer : null;
        const canvas = renderer && renderer.domElement
            ? renderer.domElement
            : (this.el && this.el.canvas ? this.el.canvas : null);
        let width = 0;
        let height = 0;

        if (renderer && typeof renderer.getSize === 'function') {
            try {
                const sizeTarget = (typeof THREE !== 'undefined' && THREE.Vector2)
                    ? new THREE.Vector2()
                    : { x: 0, y: 0, width: 0, height: 0 };
                renderer.getSize(sizeTarget);
                width = Number(sizeTarget.x || sizeTarget.width || 0);
                height = Number(sizeTarget.y || sizeTarget.height || 0);
            } catch (err) {
                width = 0;
                height = 0;
            }
        }

        const parent = canvas && canvas.parentElement ? canvas.parentElement : null;
        const cssWidth = Number(canvas && canvas.clientWidth ? canvas.clientWidth : 0) ||
            Number(parent && parent.clientWidth ? parent.clientWidth : 0) ||
            Number(typeof window !== 'undefined' ? window.innerWidth : 0) ||
            width ||
            1;
        const cssHeight = Number(canvas && canvas.clientHeight ? canvas.clientHeight : 0) ||
            Number(parent && parent.clientHeight ? parent.clientHeight : 0) ||
            Number(typeof window !== 'undefined' ? window.innerHeight : 0) ||
            height ||
            1;

        return {
            width: Math.max(1, Math.round(cssWidth)),
            height: Math.max(1, Math.round(cssHeight)),
            rendererWidth: Math.max(0, Math.round(width)),
            rendererHeight: Math.max(0, Math.round(height))
        };
    },
    captureXrExitCameraSnapshot: function (reason) {
        const cameraEl = this.getXrExitCameraElement();
        const camera = this.getXrExitCameraObject(cameraEl);
        const rawAttribute = cameraEl && cameraEl.getAttribute ? cameraEl.getAttribute('camera') : null;
        const attribute = typeof rawAttribute === 'string'
            ? vrodosParseComponentAttribute(rawAttribute)
            : vrodosRuntimeCloneSerializable(rawAttribute || {});
        const inlineSize = this.getXrExitInlineCanvasSize();
        const aspectFallback = inlineSize.width / inlineSize.height;

        return {
            reason: reason || '',
            capturedAt: Date.now(),
            cameraElId: cameraEl && cameraEl.id ? cameraEl.id : '',
            attribute,
            fov: vrodosRuntimeNumber(
                camera && Number.isFinite(camera.fov) ? camera.fov : attribute.fov,
                60,
                1,
                179
            ),
            near: vrodosRuntimeNumber(
                camera && Number.isFinite(camera.near) ? camera.near : attribute.near,
                0.1,
                0.001,
                100000
            ),
            far: vrodosRuntimeNumber(
                camera && Number.isFinite(camera.far) ? camera.far : attribute.far,
                7000,
                1,
                1000000
            ),
            zoom: vrodosRuntimeNumber(
                camera && Number.isFinite(camera.zoom) ? camera.zoom : attribute.zoom,
                1,
                0.01,
                100
            ),
            aspect: vrodosRuntimeNumber(
                camera && Number.isFinite(camera.aspect) ? camera.aspect : aspectFallback,
                aspectFallback,
                0.01,
                100
            )
        };
    },
    captureXrExitControlSnapshot: function () {
        const controls = [];
        const selectors = ['#player', '#cameraA'];
        const componentNames = ['custom-movement', 'look-controls', 'wasd-controls', 'movement-controls'];
        const seen = [];

        selectors.forEach((selector) => {
            const el = typeof document !== 'undefined' && document.querySelector
                ? document.querySelector(selector)
                : null;

            if (!el || seen.indexOf(el) !== -1) {
                return;
            }
            seen.push(el);

            componentNames.forEach((componentName) => {
                const component = el.components && el.components[componentName] ? el.components[componentName] : null;
                const rawAttribute = el.getAttribute ? el.getAttribute(componentName) : null;
                if (!component && (rawAttribute === null || rawAttribute === undefined)) {
                    return;
                }

                const attribute = typeof rawAttribute === 'string'
                    ? vrodosParseComponentAttribute(rawAttribute)
                    : vrodosRuntimeCloneSerializable(rawAttribute || {});
                const hasAttributeEnabled = Boolean(attribute && Object.prototype.hasOwnProperty.call(attribute, 'enabled'));
                const hasDataEnabled = Boolean(component && component.data && Object.prototype.hasOwnProperty.call(component.data, 'enabled'));
                const fallback = component && Object.prototype.hasOwnProperty.call(component, 'isPlaying')
                    ? component.isPlaying !== false
                    : true;
                const enabled = hasAttributeEnabled
                    ? this.normalizeXrExitEnabledValue(attribute.enabled, fallback)
                    : (hasDataEnabled ? this.normalizeXrExitEnabledValue(component.data.enabled, fallback) : fallback);

                controls.push({
                    el,
                    id: el.id || '',
                    component: componentName,
                    enabled,
                    hadAttribute: rawAttribute !== null && rawAttribute !== undefined,
                    hadEnabledProperty: hasAttributeEnabled || hasDataEnabled,
                    attribute
                });
            });
        });

        return controls;
    },
    captureXrExitRaycasterSnapshot: function () {
        const raycasters = [];
        const raycasterEls = typeof document !== 'undefined' && document.querySelectorAll
            ? document.querySelectorAll('[raycaster]')
            : [];

        Array.prototype.forEach.call(raycasterEls, (el) => {
            const rawAttribute = el && el.getAttribute ? el.getAttribute('raycaster') : null;
            if (rawAttribute === null || rawAttribute === undefined) {
                return;
            }

            const attribute = typeof rawAttribute === 'string'
                ? vrodosParseComponentAttribute(rawAttribute)
                : vrodosRuntimeCloneSerializable(rawAttribute || {});

            raycasters.push({
                el,
                id: el.id || '',
                attribute,
                objects: attribute && attribute.objects !== undefined ? attribute.objects : '',
                far: attribute && attribute.far !== undefined ? attribute.far : '',
                enabled: attribute && attribute.enabled !== undefined
                    ? this.normalizeXrExitEnabledValue(attribute.enabled, true)
                    : true
            });
        });

        return raycasters;
    },
    isXrControllerRaycasterElement: function (el) {
        if (!el) {
            return false;
        }
        const id = el.id || '';
        if (/^(oculusLeft|oculusRight)$/i.test(id)) {
            return true;
        }
        return Boolean(el.hasAttribute && el.hasAttribute('laser-controls'));
    },
    captureXrExitRestoreBaseline: function (reason) {
        if (this.isVrPresentationActive()) {
            return this._xrExitRestoreBaseline || null;
        }

        this._xrExitRestoreBaseline = {
            reason: reason || '',
            capturedAt: Date.now(),
            camera: this.captureXrExitCameraSnapshot(reason),
            controls: this.captureXrExitControlSnapshot(),
            raycasters: this.captureXrExitRaycasterSnapshot()
        };

        return this._xrExitRestoreBaseline;
    },
    clearXrExitRestoreTimers: function () {
        if (this._xrExitRestoreTimers && this._xrExitRestoreTimers.length) {
            this._xrExitRestoreTimers.forEach((timerId) => clearTimeout(timerId));
        }
        this._xrExitRestoreTimers = [];
    },
    clearXrExitSessionAttachTimers: function () {
        if (this._xrExitSessionAttachTimers && this._xrExitSessionAttachTimers.length) {
            this._xrExitSessionAttachTimers.forEach((timerId) => clearTimeout(timerId));
        }
        this._xrExitSessionAttachTimers = [];
    },
    detachXrExitSessionEndListener: function () {
        if (this._xrExitObservedSession && this.handleXrSessionEnd &&
            typeof this._xrExitObservedSession.removeEventListener === 'function') {
            try {
                this._xrExitObservedSession.removeEventListener('end', this.handleXrSessionEnd);
            } catch (err) {
                // Session cleanup is best-effort; the restore coordinator remains idempotent.
            }
        }
        this._xrExitObservedSession = null;
    },
    attachXrExitSessionEndListener: function (reason) {
        const session = this.getXrSession();
        if (!session || typeof session.addEventListener !== 'function') {
            return false;
        }
        if (this._xrExitObservedSession === session) {
            return true;
        }

        this.detachXrExitSessionEndListener();
        try {
            session.addEventListener('end', this.handleXrSessionEnd);
            this._xrExitObservedSession = session;
            this._xrExitObservedSessionReason = reason || '';
            return true;
        } catch (err) {
            this._xrExitObservedSession = null;
            return false;
        }
    },
    scheduleXrExitSessionObservation: function (reason) {
        this.clearXrExitSessionAttachTimers();
        this.attachXrExitSessionEndListener(reason);

        [40, 160, 420].forEach((delay) => {
            this._xrExitSessionAttachTimers.push(setTimeout(() => {
                this.attachXrExitSessionEndListener(reason);
            }, delay));
        });
    },
    shouldScheduleXrExitRestoreFromResume: function () {
        if (!this._xrExitRestoreHasSeenVr && !this._xrExitRestoreActive) {
            return false;
        }
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            return false;
        }
        if (this._xrExitRestoreCompletedGeneration === this._xrExitRestoreGeneration) {
            return false;
        }
        return true;
    },
    handleXrEnter: function () {
        if (!this._xrExitRestoreBaseline) {
            this.captureXrExitRestoreBaseline('enter-vr-baseline');
        }
        this._xrExitRestoreGeneration += 1;
        this._xrExitRestoreCompletedGeneration = -1;
        this._xrExitRestoreHasSeenVr = true;
        this._xrExitRestoreActive = false;
        this._xrExitRestoreTriggers = [];
        this.clearXrExitRestoreTimers();
        this.scheduleXrExitSessionObservation('enter-vr');
        this.applyVrRenderBudgetPolicy('enter-vr');
        this.syncPresentationVisualState(true);
        if (typeof window.gtag === 'function') window.gtag('event', 'vr_enabled');
    },
    handleXrExit: function () {
        this.applyVrRenderBudgetPolicy('exit-vr');
        this.syncPresentationVisualState(true);
        this.scheduleXrExitRestore('aframe-exit-vr');
        if (typeof window.gtag === 'function') window.gtag('event', 'vr_disabled');
    },
    handleXrSessionEnd: function () {
        this.scheduleXrExitRestore('webxr-session-end');
    },
    handleXrExitResumeSignal: function (event) {
        if (!this.shouldScheduleXrExitRestoreFromResume()) {
            return;
        }

        const type = event && event.type ? event.type : 'resume';
        this.scheduleXrExitRestore(`window-${type}`);
    },
    scheduleXrExitRestore: function (trigger) {
        this._xrExitRestoreGeneration = this._xrExitRestoreGeneration || 0;
        this._xrExitRestoreCompletedGeneration = typeof this._xrExitRestoreCompletedGeneration === 'number'
            ? this._xrExitRestoreCompletedGeneration
            : -1;
        this._xrExitRestoreTriggers = Array.isArray(this._xrExitRestoreTriggers)
            ? this._xrExitRestoreTriggers
            : [];
        if (this._xrExitRestoreCompletedGeneration === this._xrExitRestoreGeneration) {
            return this._xrExitRestoreDiagnostics || window.__vrodosLastXrExitRestoreDiagnostics || null;
        }

        const normalizedTrigger = trigger || 'unknown';
        if (this._xrExitRestoreTriggers.indexOf(normalizedTrigger) === -1) {
            this._xrExitRestoreTriggers.push(normalizedTrigger);
        }

        this._xrExitRestoreActive = true;
        this.clearXrExitRestoreTimers();

        const delays = [0, 50, 140, 320, 650, 1000];
        delays.forEach((delay, attemptIndex) => {
            const timerId = setTimeout(() => {
                this.runXrExitRestoreAttempt(normalizedTrigger, attemptIndex, delays.length);
            }, delay);
            this._xrExitRestoreTimers.push(timerId);
        });

        return true;
    },
    runXrExitRestoreAttempt: function (trigger, attemptIndex, attemptCount) {
        if (this._xrExitRestoreCompletedGeneration === this._xrExitRestoreGeneration) {
            return this._xrExitRestoreDiagnostics || null;
        }

        const flags = this.getXrExitRestoreFlags();
        const ready = this.isXrExitRestoreReady(flags);
        const isFinalAttempt = attemptIndex >= (attemptCount - 1);

        if (!ready) {
            const diagnostics = {
                status: isFinalAttempt ? 'pending-xr-active' : 'waiting-for-inline',
                trigger,
                triggers: this._xrExitRestoreTriggers.slice(),
                generation: this._xrExitRestoreGeneration,
                attempt: attemptIndex,
                flags,
                timestamp: Date.now()
            };
            this._xrExitRestoreDiagnostics = diagnostics;
            window.__vrodosLastXrExitRestoreDiagnostics = diagnostics;
            return diagnostics;
        }

        this.clearXrExitRestoreTimers();
        return this.restoreXrExitInlineState(trigger, attemptIndex, flags);
    },
    closeXrExitPanels: function (reason) {
        const result = {
            spatialPanelClosed: false,
            errors: []
        };
        const spatial = window.VRODOSSpatialUI || null;

        if (spatial && typeof spatial.getActivePanel === 'function' && spatial.getActivePanel() &&
            typeof spatial.closePanel === 'function') {
            try {
                spatial.closePanel(reason);
                result.spatialPanelClosed = true;
            } catch (err) {
                result.errors.push(`spatial:${err && err.message ? err.message : err}`);
            }
        }

        return result;
    },
    restoreXrExitInteractionState: function (reason) {
        const overlay = window.VRODOSRuntimeOverlay || null;
        const spatial = window.VRODOSSpatialUI || null;
        const result = {
            interactionUnlocked: false,
            sceneControlsRestored: false,
            overlayRaycastersRefreshed: false,
            spatialTargetsRefreshed: false,
            errors: []
        };

        if (overlay && typeof overlay.lockSceneInteraction === 'function') {
            try {
                overlay.lockSceneInteraction(false, { reason });
                result.interactionUnlocked = true;
            } catch (err) {
                result.errors.push(`lock:${err && err.message ? err.message : err}`);
            }
        }
        if (overlay && typeof overlay.setSceneControlsSuppressed === 'function') {
            try {
                overlay.setSceneControlsSuppressed(false, null);
                result.sceneControlsRestored = true;
            } catch (err) {
                result.errors.push(`controls:${err && err.message ? err.message : err}`);
            }
        }
        if (overlay && typeof overlay.refreshRaycasters === 'function') {
            try {
                overlay.refreshRaycasters();
                result.overlayRaycastersRefreshed = true;
            } catch (err) {
                result.errors.push(`overlay-raycasters:${err && err.message ? err.message : err}`);
            }
        }
        if (spatial && typeof spatial.refreshInteractionTargets === 'function') {
            try {
                spatial.refreshInteractionTargets();
                result.spatialTargetsRefreshed = true;
            } catch (err) {
                result.errors.push(`spatial-targets:${err && err.message ? err.message : err}`);
            }
        }

        return result;
    },
    restoreXrExitControls: function (baseline) {
        const result = {
            restored: 0,
            entries: [],
            errors: []
        };
        const controls = baseline && Array.isArray(baseline.controls) ? baseline.controls : [];

        controls.forEach((entry) => {
            if (!entry || !entry.el || !entry.component) {
                return;
            }

            const el = entry.el;
            const component = el.components && el.components[entry.component] ? el.components[entry.component] : null;
            try {
                if (entry.hadEnabledProperty && el.setAttribute) {
                    el.setAttribute(entry.component, 'enabled', Boolean(entry.enabled));
                }
                if (component && component.data && entry.hadEnabledProperty) {
                    component.data.enabled = Boolean(entry.enabled);
                }
                if (component && !entry.hadEnabledProperty) {
                    if (entry.enabled && component.isPlaying === false && typeof component.play === 'function') {
                        component.play();
                    } else if (!entry.enabled && component.isPlaying !== false && typeof component.pause === 'function') {
                        component.pause();
                    }
                }
                result.restored += 1;
                result.entries.push({
                    id: entry.id,
                    component: entry.component,
                    enabled: Boolean(entry.enabled)
                });
            } catch (err) {
                result.errors.push(`${entry.id || entry.component}:${err && err.message ? err.message : err}`);
            }
        });

        return result;
    },
    restoreXrExitControllerRaycaster: function (entry) {
        return {
            mode: 'controller-skipped-exit',
            restored: false,
            id: entry && entry.id ? entry.id : '',
            reason: 'controller raycasters are owned by live XR controller components and are rebuilt on immersive entry'
        };
    },
    restoreXrExitRaycasters: function (baseline) {
        const result = {
            restored: 0,
            refreshed: 0,
            controllerSelectiveRestored: 0,
            controllerSkipped: 0,
            entries: [],
            errors: []
        };
        const raycasters = baseline && Array.isArray(baseline.raycasters) ? baseline.raycasters : [];

        raycasters.forEach((entry) => {
            if (!entry || !entry.el || !entry.el.setAttribute) {
                return;
            }
            try {
                if (this.isXrControllerRaycasterElement(entry.el)) {
                    const controllerResult = this.restoreXrExitControllerRaycaster(entry);
                    result.controllerSelectiveRestored += controllerResult.restored ? 1 : 0;
                    result.controllerSkipped += controllerResult.restored ? 0 : 1;
                    result.entries.push(controllerResult);
                    return;
                }

                entry.el.setAttribute('raycaster', vrodosRuntimeCloneSerializable(entry.attribute || {}));
                result.restored += 1;
                result.entries.push({
                    mode: 'full',
                    id: entry.id,
                    objects: entry.objects,
                    far: entry.far,
                    enabled: entry.enabled
                });
            } catch (err) {
                result.errors.push(`${entry.id || 'raycaster'}:${err && err.message ? err.message : err}`);
            }
        });

        const raycasterEls = typeof document !== 'undefined' && document.querySelectorAll
            ? document.querySelectorAll('[raycaster]')
            : [];
        Array.prototype.forEach.call(raycasterEls, (el) => {
            const component = el && el.components ? el.components.raycaster : null;
            if (component && typeof component.refreshObjects === 'function') {
                try {
                    component.refreshObjects();
                    result.refreshed += 1;
                } catch (err) {
                    result.errors.push(`${el.id || 'raycaster-refresh'}:${err && err.message ? err.message : err}`);
                }
            }
        });

        return result;
    },
    forceXrExitRendererResize: function () {
        const renderer = this.el && this.el.renderer ? this.el.renderer : null;
        const size = this.getXrExitInlineCanvasSize();

        if (this.el && typeof this.el.resize === 'function') {
            try {
                this.el.resize();
            } catch (err) {
                // A-Frame resize is advisory here; the renderer setSize below is the hard reset.
            }
        }

        if (renderer && typeof renderer.setSize === 'function') {
            try {
                renderer.setSize(size.width, size.height, false);
            } catch (err) {
                // Diagnostics below still report the requested inline size.
            }
        }

        const updatedSize = this.getXrExitInlineCanvasSize();
        return {
            width: updatedSize.width,
            height: updatedSize.height,
            rendererWidth: updatedSize.rendererWidth,
            rendererHeight: updatedSize.rendererHeight
        };
    },
    restoreXrExitCameraState: function (baseline) {
        const cameraEl = this.getXrExitCameraElement();
        const camera = this.getXrExitCameraObject(cameraEl);
        const cameraBaseline = baseline && baseline.camera ? baseline.camera : this.captureXrExitCameraSnapshot('restore-fallback');
        const size = this.forceXrExitRendererResize();
        const aspect = size.width / size.height;
        const fov = 60;
        const near = vrodosRuntimeNumber(cameraBaseline.near, 0.1, 0.001, 100000);
        const far = vrodosRuntimeNumber(cameraBaseline.far, 7000, 1, 1000000);
        const zoom = vrodosRuntimeNumber(cameraBaseline.zoom, 1, 0.01, 100);
        const cameraAttribute = Object.assign({}, cameraBaseline.attribute || {}, {
            active: true,
            fov,
            near,
            far,
            zoom
        });

        if (cameraEl && cameraEl.setAttribute) {
            try {
                cameraEl.setAttribute('camera', cameraAttribute);
            } catch (err) {
                cameraEl.setAttribute('camera', `active: true; fov: ${fov}; near: ${near}; far: ${far}; zoom: ${zoom}`);
            }
        }

        if (camera) {
            camera.fov = fov;
            camera.near = near;
            camera.far = far;
            camera.zoom = zoom;
            camera.aspect = aspect;
            camera.el = cameraEl || camera.el || null;
            if (typeof camera.updateProjectionMatrix === 'function') {
                camera.updateProjectionMatrix();
            }
            if (typeof camera.updateMatrixWorld === 'function') {
                camera.updateMatrixWorld(true);
            }
        }

        if (this.el) {
            if (camera) {
                this.el.camera = camera;
            }
            if (this.el.object3D && typeof this.el.object3D.updateMatrixWorld === 'function') {
                this.el.object3D.updateMatrixWorld(true);
            }
        }
        if (cameraEl && cameraEl.object3D && typeof cameraEl.object3D.updateMatrixWorld === 'function') {
            cameraEl.object3D.updateMatrixWorld(true);
        }

        return {
            cameraElId: cameraEl && cameraEl.id ? cameraEl.id : '',
            activeCameraRestored: Boolean(this.el && camera && this.el.camera === camera),
            fov,
            near,
            far,
            zoom,
            aspect: Number(aspect.toFixed(6)),
            rendererSize: size
        };
    },
    finalizeXrExitNavigationHandoff: function (reason) {
        const player = typeof document !== 'undefined' && document.getElementById
            ? document.getElementById("player")
            : null;
        const movement = player && player.components ? player.components['custom-movement'] : null;

        if (movement && typeof movement.finalizeImmersiveExitNavigationHandoff === 'function') {
            return movement.finalizeImmersiveExitNavigationHandoff(reason);
        }

        return {
            status: movement ? 'missing-finalizer' : 'missing-custom-movement',
            applied: false
        };
    },
    restoreXrExitInlineState: function (trigger, attemptIndex, flags) {
        const reason = `xr-exit-restore:${trigger || 'unknown'}`;
        const baseline = this._xrExitRestoreBaseline || this.captureXrExitRestoreBaseline('restore-inline');
        const panels = this.closeXrExitPanels(reason);
        const interaction = this.restoreXrExitInteractionState(reason);
        const navigation = this.finalizeXrExitNavigationHandoff(reason);
        const camera = this.restoreXrExitCameraState(baseline);
        const controls = this.restoreXrExitControls(baseline);
        const raycasters = this.restoreXrExitRaycasters(baseline);

        this.applyVrRenderBudgetPolicy('xr-exit-restore');
        this.syncPresentationVisualState(true);
        if (typeof this.updatePostProcessingSize === 'function') {
            this.updatePostProcessingSize();
        }
        if (typeof this.updatePmndrsPostProcessingSize === 'function') {
            this.updatePmndrsPostProcessingSize();
        }

        const afterFlags = this.getXrExitRestoreFlags();
        const diagnostics = {
            status: 'restored',
            trigger,
            triggers: this._xrExitRestoreTriggers.slice(),
            generation: this._xrExitRestoreGeneration,
            attempt: attemptIndex,
            timestamp: Date.now(),
            beforeFlags: flags || this.getXrExitRestoreFlags(),
            afterFlags,
            presentationMode: this.getPresentationMode(),
            camera,
            panels,
            interaction,
            controls,
            raycasters,
            navigation,
            baselineReason: baseline && baseline.reason ? baseline.reason : ''
        };

        this._xrExitRestoreCompletedGeneration = this._xrExitRestoreGeneration;
        this._xrExitRestoreActive = false;
        this._xrExitRestoreDiagnostics = diagnostics;
        window.__vrodosLastXrExitRestoreDiagnostics = diagnostics;
        this.publishRuntimeFeatureState('xr-exit-restore');
        return diagnostics;
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
    getVrTakramLightsOnlyState: VRODOSSceneSettingsMaster.SceneSettingsHelpers.getVrTakramLightsOnlyState || function () { return null; },
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
    isPmndrsAtmosphereSkyVisible: VRODOSSceneSettingsMaster.SceneSettingsHelpers.isPmndrsAtmosphereSkyVisible || function () { return false; },
    prepareVrTakramVisibleSkyForReveal: VRODOSSceneSettingsMaster.SceneSettingsHelpers.prepareVrTakramVisibleSkyForReveal || function () { return true; },
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
            if (!this.isVrPresentationActive()) {
                this.captureXrExitRestoreBaseline('presentation-mode-change');
            }
            this.syncPresentationVisualState(true);
        }.bind(this);
        this.handleXrEnter = this.handleXrEnter.bind(this);
        this.handleXrExit = this.handleXrExit.bind(this);
        this.handleXrSessionEnd = this.handleXrSessionEnd.bind(this);
        this.handleXrExitResumeSignal = this.handleXrExitResumeSignal.bind(this);
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
        this._pendingHdrEnvMapPreset = null;
        this._pendingHdrEnvMapUrl = '';
        this._hdrEnvMapLoadId = 0;
        this._hdrEnvMapLoading = false;
        this._hdrEnvMapFailed = false;
        this._hdrEnvMapError = '';
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
        this._xrExitRestoreBaseline = null;
        this._xrExitRestoreTimers = [];
        this._xrExitSessionAttachTimers = [];
        this._xrExitObservedSession = null;
        this._xrExitObservedSessionReason = '';
        this._xrExitRestoreGeneration = 0;
        this._xrExitRestoreCompletedGeneration = -1;
        this._xrExitRestoreHasSeenVr = false;
        this._xrExitRestoreActive = false;
        this._xrExitRestoreTriggers = [];
        this._xrExitRestoreDiagnostics = null;
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('focus', this.handleXrExitResumeSignal);
        window.addEventListener('pageshow', this.handleXrExitResumeSignal);
        document.addEventListener('visibilitychange', this.handleXrExitResumeSignal);
        document.addEventListener('fullscreenchange', this.handlePresentationModeChange);
        document.addEventListener('webkitfullscreenchange', this.handlePresentationModeChange);
        document.addEventListener('mozfullscreenchange', this.handlePresentationModeChange);
        document.addEventListener('MSFullscreenChange', this.handlePresentationModeChange);
        this.el.addEventListener('child-attached', this.handleSceneMutation);
        this.el.addEventListener('child-detached', this.handleSceneMutation);
        // Event - When scene is loaded
        this.el.addEventListener("loaded", () => {
            this.markSceneCollectionsDirty();

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
                publicChatBtn.addEventListener("click", () => {
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

        this.el.addEventListener("enter-vr", this.handleXrEnter);
        this.el.addEventListener("exit-vr", this.handleXrExit);

        const cam = document.querySelector("#cameraA");
        if (cam) {
            if (this.data.pr_type !== "vrexpo_games") {
                cam.setAttribute("camera", "fov: 60");
            } else {
                cam.setAttribute("camera", "active: true; near: 0.1; far: 7000; fov: 60");
                const my_face = cam.querySelector('.face');
                if (my_face) my_face.setAttribute("visible", "false");
            }
        }
        this.captureXrExitRestoreBaseline('init');

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
        this.el.removeEventListener("enter-vr", this.handleXrEnter);
        this.el.removeEventListener("exit-vr", this.handleXrExit);
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('focus', this.handleXrExitResumeSignal);
        window.removeEventListener('pageshow', this.handleXrExitResumeSignal);
        document.removeEventListener('visibilitychange', this.handleXrExitResumeSignal);
        document.removeEventListener('fullscreenchange', this.handlePresentationModeChange);
        document.removeEventListener('webkitfullscreenchange', this.handlePresentationModeChange);
        document.removeEventListener('mozfullscreenchange', this.handlePresentationModeChange);
        document.removeEventListener('MSFullscreenChange', this.handlePresentationModeChange);
        this.clearXrExitRestoreTimers();
        this.clearXrExitSessionAttachTimers();
        this.detachXrExitSessionEndListener();
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
