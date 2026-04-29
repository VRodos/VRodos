/**
 * VRodos Master Scene Settings Component
 */

var VRODOSMaster = window.VRODOSMaster || (window.VRODOSMaster = {});

AFRAME.registerComponent('scene-settings', {
    schema: {
        color: { type: "string", default: "#ffffff" },
        pr_type: { type: "string", default: "default" },
        img_link: { type: "string", default: "no_link" },
        selChoice: { type: "string", default: "0" },
        presChoice: { type: "string", default: "default" },
        presetGroundEnabled: { type: "string", default: "1" },
        movement_disabled: { type: "string", default: "0" },
        collisionMode: { type: "string", default: "auto" },
        renderQuality: { type: "string", default: "standard" },
        shadowQuality: { type: "string", default: "medium" },
        aaQuality: { type: "string", default: "balanced" },
        fpsMeterEnabled: { type: "string", default: "0" },
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
        reflectionProfile: { type: "string", default: "balanced" },
        reflectionSource: { type: "string", default: "hdr" },
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
        postFXEngine: { type: "string", default: "legacy" },
        // Pmndrs-only tweakable knobs. Numbers serialized as strings since
        // A-Frame string-typed schema is what the rest of this component uses.
        pmndrsAAMode: { type: "string", default: "inherit" },
        pmndrsAAPreset: { type: "string", default: "inherit" },
        pmndrsBloomIntensity: { type: "string", default: "1.0" },
        pmndrsBloomThreshold: { type: "string", default: "0.62" },
        pmndrsVignetteEnabled: { type: "string", default: "0" },
        pmndrsVignetteDarkness: { type: "string", default: "0.5" },
        pmndrsToneMappingExposure: { type: "string", default: "1.0" },
        pmndrsAtmosphereEnabled: { type: "string", default: "1" },
        pmndrsAtmospherePreset: { type: "string", default: "midday" },
        pmndrsAtmospherePresetIntensity: { type: "string", default: "1.0" },
        pmndrsAtmosphereQuality: { type: "string", default: "balanced" },
        pmndrsSunElevationDeg: { type: "string", default: "62" },
        pmndrsSunAzimuthDeg: { type: "string", default: "20" },
        pmndrsSunDistance: { type: "string", default: "5200" },
        pmndrsSunAngularRadius: { type: "string", default: "0.0047" },
        pmndrsAerialStrength: { type: "string", default: "0.55" },
        pmndrsAlbedoScale: { type: "string", default: "1.0" },
        pmndrsTransmittanceEnabled: { type: "string", default: "1" },
        pmndrsInscatterEnabled: { type: "string", default: "1" },
        pmndrsGroundEnabled: { type: "string", default: "1" },
        pmndrsGroundAlbedo: { type: "string", default: "#d8d8d0" },
        pmndrsRayleighScale: { type: "string", default: "1.18" },
        pmndrsMieScatteringScale: { type: "string", default: "0.42" },
        pmndrsMieExtinctionScale: { type: "string", default: "0.56" },
        pmndrsMiePhaseG: { type: "string", default: "0.74" },
        pmndrsAbsorptionScale: { type: "string", default: "0.94" },
        pmndrsMoonEnabled: { type: "string", default: "0" },
        pmndrsHorizonKeyLightIntensity: { type: "string", default: "1.15" },
        pmndrsHorizonFillLightIntensity: { type: "string", default: "0.45" },
    },
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
        if (this.data.renderQuality !== 'high') {
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
        var result = 0;
        var f = 1.0 / base;
        var i = index;
        while (i > 0) {
            result += f * (i % base);
            i = Math.floor(i / base);
            f /= base;
        }
        return result;
    },
    getSAOParams: function () {
        var preset = this.getAmbientOcclusionPreset();
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
        var map = {
            studio: 'spot1Lux.hdr',
            quarry: 'quarry_01_1k.hdr',
            venice: 'venice_sunset_1k.hdr'
        };
        return map[this.data.envMapPreset] || null;
    },
    getPmndrsAtmosphereQuality: function () {
        switch (this.data.pmndrsAtmosphereQuality) {
            case 'performance':
            case 'balanced':
            case 'quality':
            case 'cinematic':
                return this.data.pmndrsAtmosphereQuality;
            default:
                return 'balanced';
        }
    },
    getPmndrsAAMode: function () {
        switch (this.data.pmndrsAAMode) {
            case 'none':
            case 'smaa':
            case 'msaa':
                return this.data.pmndrsAAMode;
            default:
                return this.getAAQualityLevel() === 'off' ? 'none' : 'msaa';
        }
    },
    getPmndrsAAPreset: function () {
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
    isPmndrsAtmosphereEnabled: function () {
        return this.data.postFXEngine === 'pmndrs' && this.data.pmndrsAtmosphereEnabled !== '0';
    },
    getReflectionSource: function () {
        return this.data.reflectionSource === 'scene-probe' ? 'scene-probe' : 'hdr';
    },
    isImmersiveXrActive: function () {
        return !!(this.el.renderer && this.el.renderer.xr && this.el.renderer.xr.isPresenting);
    },
    isAFrameVrModeActive: function () {
        return !!(this.el.is && this.el.is('vr-mode'));
    },
    isDocumentFullscreenActive: function () {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
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
        return this.isImmersiveXrActive();
    },
    isMobileDevice: function () {
        return !!(AFRAME.utils &&
            AFRAME.utils.device &&
            typeof AFRAME.utils.device.isMobile === 'function' &&
            AFRAME.utils.device.isMobile());
    },
    canUseSceneProbe: function () {
        return this.getReflectionSource() === 'scene-probe' &&
            this.data.renderQuality === 'high' &&
            !this.isVrPresentationActive() &&
            !this.isMobileDevice() &&
            !!this.el.renderer &&
            typeof THREE.WebGLCubeRenderTarget !== 'undefined' &&
            typeof THREE.CubeCamera !== 'undefined' &&
            typeof THREE.PMREMGenerator !== 'undefined';
    },
    getEffectiveReflectionSource: function () {
        if (this.canUseSceneProbe()) {
            return 'scene-probe';
        }

        if ((this.data.envMapPreset || 'none') !== 'none') {
            return 'hdr';
        }

        return 'none';
    },
    // --- Scene probe & environment map methods (extracted to vrodos_scene_probe.js) ---
    clearHdrEnvironmentMap: VRODOSMaster.SceneSettingsHelpers.clearHdrEnvironmentMap,
    disposeSceneProbe: VRODOSMaster.SceneSettingsHelpers.disposeSceneProbe,
    ensureSceneProbeResources: VRODOSMaster.SceneSettingsHelpers.ensureSceneProbeResources,
    requestSceneProbeRefresh: VRODOSMaster.SceneSettingsHelpers.requestSceneProbeRefresh,
    markSceneCollectionsDirty: VRODOSMaster.SceneSettingsHelpers.markSceneCollectionsDirty,
    getCachedSceneQuery: VRODOSMaster.SceneSettingsHelpers.getCachedSceneQuery,
    queueQualityRefresh: VRODOSMaster.SceneSettingsHelpers.queueQualityRefresh,
    getSceneProbeAnchorObject: VRODOSMaster.SceneSettingsHelpers.getSceneProbeAnchorObject,
    getSceneProbeAnchorYaw: VRODOSMaster.SceneSettingsHelpers.getSceneProbeAnchorYaw,
    getSceneProbeYawDeltaDegrees: VRODOSMaster.SceneSettingsHelpers.getSceneProbeYawDeltaDegrees,
    hideSceneProbeObject: VRODOSMaster.SceneSettingsHelpers.hideSceneProbeObject,
    collectSceneProbeExcludedObjects: VRODOSMaster.SceneSettingsHelpers.collectSceneProbeExcludedObjects,
    restoreSceneProbeExcludedObjects: VRODOSMaster.SceneSettingsHelpers.restoreSceneProbeExcludedObjects,
    captureSceneProbe: VRODOSMaster.SceneSettingsHelpers.captureSceneProbe,
    applyEnvMapProfile: VRODOSMaster.SceneSettingsHelpers.applyEnvMapProfile,
    getContactShadowSettings: function () {
        var shadowQuality = this.data.shadowQuality || 'medium';
        var preset = this.getContactShadowPreset();

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
    shouldShowFPSMeter: function () {
        return this.data.fpsMeterEnabled !== '0' && typeof Stats !== 'undefined';
    },
    enableFPSMeter: function () {
        if (this.fpsStats || !this.shouldShowFPSMeter()) {
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
    },
    syncFPSMeterState: function () {
        if (this.shouldShowFPSMeter()) {
            this.enableFPSMeter();
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
    isLegacyEdgeAAEnabled: function () {
        return this.data.postFXEngine !== 'pmndrs' && this.isPostFXOptionEnabled('postFXEdgeAAEnabled');
    },
    hasEnabledPostFXOptions: function () {
        return this.hasBloomEffectEnabled() ||
            this.isPostFXOptionEnabled('postFXColorEnabled') ||
            this.isLegacyEdgeAAEnabled() ||
            this.isPmndrsAAEnabled() ||
            this.isPmndrsAtmosphereEnabled();
    },
    hasCinematicShaderOptions: function () {
        return this.hasBloomEffectEnabled() ||
            this.isPostFXOptionEnabled('postFXColorEnabled') ||
            this.isLegacyEdgeAAEnabled() ||
            this.isPmndrsAAEnabled() ||
            this.isPostFXOptionEnabled('postFXTAAEnabled') ||
            this.isPostFXOptionEnabled('postFXSSREnabled') ||
            this.getAmbientOcclusionPreset() !== 'off' ||
            this.isPmndrsAtmosphereEnabled();
    },
    hasPostProcessingPipelineRequest: function () {
        return this.data.renderQuality === 'high' &&
            this.data.postFXEnabled !== '0' &&
            this.hasCinematicShaderOptions();
    },
    warnImmersiveXrPostProcessingFallback: function () {
        if (!this.isImmersiveXrActive()) {
            this._immersiveXrPostFXFallbackWarned = false;
            return;
        }

        if (!this.hasPostProcessingPipelineRequest() || this._immersiveXrPostFXFallbackWarned) {
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
        var parsed = parseInt(this.data.postFXEdgeAAStrength, 10);
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
        return this.hasPostProcessingPipelineRequest() && !this.isImmersiveXrActive();
    },
    // --- Post-processing methods — LEGACY engine (extracted to vrodos_postprocessing.js) ---
    updatePostProcessingSize: VRODOSMaster.SceneSettingsHelpers.updatePostProcessingSize,
    enablePostProcessing: VRODOSMaster.SceneSettingsHelpers.enablePostProcessing,
    disablePostProcessing: VRODOSMaster.SceneSettingsHelpers.disablePostProcessing,
    _syncLegacyPostProcessingState: VRODOSMaster.SceneSettingsHelpers.syncPostProcessingState,
    // --- Post-processing methods — PMNDRS engine (extracted to vrodos_postprocessing_pmndrs.js) ---
    // The PmndrsHelpers bag is created by vrodos_postprocessing_pmndrs.js. If that file
    // failed to load for any reason, the no-op fallbacks below ensure the component still
    // initialises and the scene degrades gracefully to a non-post-FX render.
    enablePmndrsPostProcessing: (VRODOSMaster.PmndrsHelpers && VRODOSMaster.PmndrsHelpers.enablePmndrsPostProcessing) || function () {},
    disablePmndrsPostProcessing: (VRODOSMaster.PmndrsHelpers && VRODOSMaster.PmndrsHelpers.disablePmndrsPostProcessing) || function () {},
    updatePmndrsPostProcessingSize: (VRODOSMaster.PmndrsHelpers && VRODOSMaster.PmndrsHelpers.updatePmndrsPostProcessingSize) || function () {},
    _buildPmndrsComposer: (VRODOSMaster.PmndrsHelpers && VRODOSMaster.PmndrsHelpers._buildPmndrsComposer) || function () { return false; },
    _updatePmndrsAdaptiveAO: (VRODOSMaster.PmndrsHelpers && VRODOSMaster.PmndrsHelpers._updatePmndrsAdaptiveAO) || function () {},
    // --- Engine dispatcher: routes to legacy or pmndrs path based on data.postFXEngine ---
    // See POSTPROCESSING_MIGRATION_PLAN.md §11. Engines are mutually exclusive: switching
    // from one to the other (e.g. via a future runtime toggle) tears the previous engine
    // down before bringing the new one up. Defensive disable of the OTHER engine on every
    // call protects against drift if data.postFXEngine ever changes mid-session.
    syncPostProcessingState: function () {
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
        var self = this;

        this.markSceneCollectionsDirty();
        this.applyRenderQualityProfile();
        this.applyBackgroundQualityProfile();
        this.applyEnvMapProfile();
        this.applyPostFXProfile();
        this.updatePmndrsHorizonSun();

        if (!waitForSettle) {
            return;
        }

        var resync = function () {
            self.markSceneCollectionsDirty();
            self.applyRenderQualityProfile();
            self.applyBackgroundQualityProfile();
            self.applyEnvMapProfile();
            self.applyPostFXProfile();
            self.updatePostProcessingSize();
            self.updatePmndrsPostProcessingSize();
            self.updatePmndrsHorizonSun();
        };

        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(resync);
        }
        setTimeout(resync, 80);
        setTimeout(resync, 240);
    },
    // --- Quality profile methods (extracted to vrodos_quality_profiles.js) ---
    applyRenderQualityProfile: VRODOSMaster.SceneSettingsHelpers.applyRenderQualityProfile,
    applyShadowQualityProfile: VRODOSMaster.SceneSettingsHelpers.applyShadowQualityProfile,
    applyMaterialProfiles: VRODOSMaster.SceneSettingsHelpers.applyMaterialProfiles,
    ensurePhotorealHelperLight: VRODOSMaster.SceneSettingsHelpers.ensurePhotorealHelperLight,
    removePhotorealHelperLights: VRODOSMaster.SceneSettingsHelpers.removePhotorealHelperLights,
    applyHorizonSkyPreset: VRODOSMaster.SceneSettingsHelpers.applyHorizonSkyPreset,
    ensurePmndrsAtmosphereResources: VRODOSMaster.SceneSettingsHelpers.ensurePmndrsAtmosphereResources || function () { return null; },
    disposePmndrsAtmosphere: VRODOSMaster.SceneSettingsHelpers.disposePmndrsAtmosphere || function () {},
    getPmndrsAtmosphereConfig: VRODOSMaster.SceneSettingsHelpers.getPmndrsAtmosphereConfig || function () { return null; },
    applyPmndrsAtmosphereConfigToTarget: VRODOSMaster.SceneSettingsHelpers.applyPmndrsAtmosphereConfigToTarget || function () {},
    updatePmndrsHorizonSun: VRODOSMaster.SceneSettingsHelpers.updatePmndrsHorizonSun || function () {},
    hidePmndrsHorizonEnvironmentVisuals: VRODOSMaster.SceneSettingsHelpers.hidePmndrsHorizonEnvironmentVisuals || function () {},
    showPmndrsAtmosphereSkyForSceneProbe: VRODOSMaster.SceneSettingsHelpers.showPmndrsAtmosphereSkyForSceneProbe || function () { return false; },
    hidePmndrsAtmosphereSky: VRODOSMaster.SceneSettingsHelpers.hidePmndrsAtmosphereSky || function () {},
    logPmndrsHorizonDiagnostic: VRODOSMaster.SceneSettingsHelpers.logPmndrsHorizonDiagnostic || function () {},
    applyBackgroundQualityProfile: VRODOSMaster.SceneSettingsHelpers.applyBackgroundQualityProfile,
    applyPostFXProfile: VRODOSMaster.SceneSettingsHelpers.applyPostFXProfile,
    applyQualityProfiles: VRODOSMaster.SceneSettingsHelpers.applyQualityProfiles,
    init: function () {
        this.handleQualityModelLoad = function () {
            this.markSceneCollectionsDirty();
            this.queueQualityRefresh(true);
        }.bind(this);
        this.handleSceneMutation = function () {
            this.markSceneCollectionsDirty();
        }.bind(this);
        this.handleResize = function () {
            this.updatePostProcessingSize();
            this.updatePmndrsPostProcessingSize();
            this.updatePmndrsHorizonSun();
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
                    let event = new CustomEvent('chat-selected', { "detail": "private" });
                    document.dispatchEvent(event);
                    if (typeof window.gtag === 'function') window.gtag('event', 'chat_private_tab_selected');
                });
            }

            const publicChatBtn = document.getElementById("public-chat-button");
            if (publicChatBtn) {
                publicChatBtn.addEventListener("click", (evt) => {
                    let event = new CustomEvent('chat-selected', { "detail": "public" });
                    document.dispatchEvent(event);
                    if (typeof window.gtag === 'function') window.gtag('event', 'chat_public_tab_selected');
                });
            }

            const sceneContainer = document.getElementById("aframe-scene-container");
            if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.applyChatTabs === 'function') {
                window.VRODOSMasterUI.applyChatTabs(this.data.public_chat === "1" ? 'public' : 'private');
            } else if (sceneContainer) {
                const settings = sceneContainer.getAttribute("scene-settings");
                if (publicChatBtn) {
                    publicChatBtn.style.visibility = settings && settings.public_chat == "1" ? 'visible' : 'hidden';
                    publicChatBtn.disabled = settings && settings.public_chat != "1";
                }
                if (privateChatBtn) {
                    const hasPrivateChat = !!document.querySelector('[chat-poi]');
                    privateChatBtn.style.visibility = hasPrivateChat ? 'visible' : 'hidden';
                    privateChatBtn.disabled = !hasPrivateChat;
                }
            }

            // Avatar Selector
            let avatarDialog = document.querySelector('#avatar-selection-dialog');
            if (avatarDialog) {
                let closeAvatarDialogListener = function () {
                    avatarDialog.removeEventListener('close', closeAvatarDialogListener);
                    if (avatarDialog.returnValue !== 'accept' && typeof selectAvatarType !== 'undefined') {
                        selectAvatarType('no-avatar');
                    }
                };

                const settings = sceneContainer.getAttribute("scene-settings");
                if (settings && settings.avatar_enabled == 1) {
                    avatarDialog.addEventListener('close', closeAvatarDialogListener);
                    if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.showDialog === 'function') {
                        window.VRODOSMasterUI.showDialog(avatarDialog);
                    } else if (typeof avatarDialog.showModal === 'function') {
                        avatarDialog.showModal();
                    }
                } else {
                    if (typeof selectAvatarType !== 'undefined') selectAvatarType('no-avatar');
                }
            }

            this.queueQualityRefresh(true);
        });
        this.el.addEventListener('model-loaded', this.handleQualityModelLoad);

        this.el.addEventListener("enter-vr", () => {
            VRODOSMaster.setBrowsingModeVR(true);
            this.syncPresentationVisualState(true);
            if (typeof window.gtag === 'function') window.gtag('event', 'vr_enabled');
        });
        this.el.addEventListener("exit-vr", () => {
            VRODOSMaster.setBrowsingModeVR(false);
            this.syncPresentationVisualState(true);
            if (typeof window.gtag === 'function') window.gtag('event', 'vr_disabled');
        });

        let cam = document.querySelector("#cameraA");
        if (cam) {
            if (this.data.pr_type !== "vrexpo_games") {
                cam.setAttribute("camera", "fov: 60");
            } else {
                cam.setAttribute("fov", "60");
                cam.setAttribute("camera", "fov: 60");
                let my_face = cam.querySelector('.face');
                if (my_face) my_face.setAttribute("visible", "false");
            }
        }

        let backgroundEl = this.el;
        const presetGroundEnabled = this.data.presetGroundEnabled !== "0";
        if (!this.data.selChoice) this.data.selChoice = "0";

        let clearGeneratedBackground = function () {
            backgroundEl.removeAttribute("background");
            backgroundEl.removeAttribute("environment");
            Array.prototype.forEach.call(backgroundEl.querySelectorAll('a-sun-sky'), function (oldSun) {
                if (oldSun && oldSun.parentNode) oldSun.parentNode.removeChild(oldSun);
            });
            let manSky = document.getElementById('default-sky');
            if (manSky) manSky.parentNode.removeChild(manSky);
            let manSun = document.getElementById('default-sun');
            if (manSun) manSun.parentNode.removeChild(manSun);
            let pmndrsSun = document.getElementById('vrodos-pmndrs-sun');
            if (pmndrsSun) pmndrsSun.parentNode.removeChild(pmndrsSun);
            let pmndrsSunHaze = document.getElementById('vrodos-pmndrs-sun-haze');
            if (pmndrsSunHaze) pmndrsSunHaze.parentNode.removeChild(pmndrsSunHaze);
            let oldOceanPlane = backgroundEl.querySelector('.ocean_asset');
            if (oldOceanPlane) oldOceanPlane.parentNode.removeChild(oldOceanPlane);
            let oldPresetSky = backgroundEl.querySelector('a-sky[data-vrodos-preset-sky="true"]');
            if (oldPresetSky) oldPresetSky.parentNode.removeChild(oldPresetSky);
            let customSky = backgroundEl.querySelector('#sky');
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
                    let sky = document.createElement('a-sky');
                    sky.setAttribute("color", "#a4bede");
                    sky.setAttribute("data-vrodos-preset-sky", "true");
                    backgroundEl.appendChild(sky);
                    if (presetGroundEnabled) {
                        let plane = document.createElement('a-plane');
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
                let customImgAsset = document.querySelector('#custom_sky');
                if (customImgAsset && customImgAsset.getAttribute("src")) {
                    let skyElem = document.createElement('a-sky');
                    skyElem.setAttribute("id", "sky");
                    skyElem.setAttribute("src", "#custom_sky");
                    backgroundEl.appendChild(skyElem);
                } else {
                    backgroundEl.setAttribute("background", "color", "#ffffff");
                }
                break;
        }

        this.queueQualityRefresh(true);
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
        this.disablePostProcessing();
        this.disablePmndrsPostProcessing();
        this.disposePmndrsAtmosphere();
        if (this._envMapRenderTarget) {
            this._envMapRenderTarget.dispose();
            this._envMapRenderTarget = null;
        }
        this.disposeSceneProbe(false);
        if (this.el && this.el.object3D) {
            this.el.object3D.environment = null;
        }
        this.disableFPSMeter();
        this.removePhotorealHelperLights();
        let manualSun = document.getElementById('default-sun');
        if (manualSun && manualSun.parentNode) {
            manualSun.parentNode.removeChild(manualSun);
        }
        let pmndrsSun = document.getElementById('vrodos-pmndrs-sun');
        if (pmndrsSun && pmndrsSun.parentNode) {
            pmndrsSun.parentNode.removeChild(pmndrsSun);
        }
        let pmndrsSunHaze = document.getElementById('vrodos-pmndrs-sun-haze');
        if (pmndrsSunHaze && pmndrsSunHaze.parentNode) {
            pmndrsSunHaze.parentNode.removeChild(pmndrsSunHaze);
        }
    },
    tick: function (time) {
        if (this.fpsStats && typeof this.fpsStats.update === 'function') {
            this.fpsStats.update();
        }

        this.updatePmndrsHorizonSun();

        if (this.getEffectiveReflectionSource() !== 'scene-probe') {
            return;
        }

        if (!this._sceneProbeNeedsUpdate && this._sceneProbeLastYaw !== null) {
            var anchorObject = this.getSceneProbeAnchorObject();
            if (anchorObject) {
                anchorObject.updateMatrixWorld(true);
                anchorObject.getWorldPosition(this._sceneProbeCurrentPosition);
                if (this._sceneProbeCurrentPosition.distanceToSquared(this._sceneProbeLastPosition) > (0.75 * 0.75) ||
                    this.getSceneProbeYawDeltaDegrees(this.getSceneProbeAnchorYaw(anchorObject), this._sceneProbeLastYaw) > 12) {
                    this._sceneProbeNeedsUpdate = true;
                }
            }
        }

        if (!this._sceneProbeNeedsUpdate) {
            return;
        }

        if ((time - this._sceneProbeLastCaptureMs) < 250) {
            return;
        }

        if (this._sceneProbeLastModelEventMs && (time - this._sceneProbeLastModelEventMs) < 350) {
            return;
        }

        this.captureSceneProbe(time);
    }
});
