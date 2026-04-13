/**
 * VRodos pmndrs Post-Processing Pipeline (clean-room sibling to vrodos_postprocessing.js)
 *
 * Uses pmndrs/postprocessing 6.39 (window.POSTPROCESSING, bundled by
 * scripts/build-three-vendor.mjs) to drive an EffectComposer that fuses every
 * supported effect into a single EffectPass for the lowest possible per-frame
 * cost. This module is selected per-scene via the postFXEngine scene-settings
 * field. See POSTPROCESSING_MIGRATION_PLAN.md §11 for the architectural decision.
 *
 * Effects merged into one EffectPass when their flags are set:
 *   - SSAOEffect           (ambientOcclusionPreset !== 'off')
 *   - BloomEffect          (bloomStrength > 0)
 *   - BrightnessContrast   (postFXColorEnabled)
 *   - HueSaturation        (postFXColorEnabled)
 *   - VignetteEffect       (postFXVignetteEnabled)
 *   - ToneMappingEffect    (always, ACES Filmic)
 *   - SMAAEffect           (pmndrsAAMode === 'smaa')
 *
 * Multisample AA is applied at the composer level when
 * pmndrsAAMode === 'msaa' and WebGL2 multisampling is available.
 *
 * NOT supported in this engine — scenes that need these stay on postFXEngine='legacy':
 *   - SSR  (no actively-maintained pmndrs-compatible SSR effect in this VRodos pipeline)
 *   - TRAA (pmndrs/postprocessing 6.x removed TAA from core)
 *
 * Hard rule: this file must never import, call, or share render targets with
 * vrodos_postprocessing.js. Mutually exclusive engines, zero blending.
 */
(function () {
    if (typeof VRODOSMaster === 'undefined') {
        return;
    }
    var H = VRODOSMaster.PmndrsHelpers = VRODOSMaster.PmndrsHelpers || {};

    /**
     * Convert the legacy ambientOcclusionPreset string to pmndrs SSAOEffect options.
     */
    function ssaoOptionsForPreset(preset) {
        switch (preset) {
            case 'soft':
                return { samples: 9, rings: 4, distanceThreshold: 0.6, distanceFalloff: 0.1, rangeThreshold: 0.0015, rangeFalloff: 0.01, luminanceInfluence: 0.7, radius: 18.25, intensity: 1.0, bias: 0.025 };
            case 'strong':
                return { samples: 21, rings: 7, distanceThreshold: 0.95, distanceFalloff: 0.03, rangeThreshold: 0.001, rangeFalloff: 0.012, luminanceInfluence: 0.7, radius: 28.0, intensity: 2.4, bias: 0.04 };
            case 'balanced':
            default:
                return { samples: 14, rings: 5, distanceThreshold: 0.85, distanceFalloff: 0.05, rangeThreshold: 0.0012, rangeFalloff: 0.012, luminanceInfluence: 0.7, radius: 22.0, intensity: 1.6, bias: 0.035 };
        }
    }

    /**
     * Map the legacy bloomStrength preset to a numeric intensity for pmndrs BloomEffect,
     * then multiply by the per-scene Pmndrs bloom intensity tweak. Threshold is also
     * taken from the per-scene tweak. Both knobs come from the compile dialog and are
     * persisted via scene-settings (pmndrsBloomIntensity / pmndrsBloomThreshold).
     */
    function isHorizonBackground(self) {
        return !!(self && self.data && self.data.selChoice === '0');
    }

    function bloomOptionsForLegacyValue(self, legacyValue, intensityMultiplier, threshold) {
        // legacy values are roughly 0..2; pmndrs intensity is roughly 0..3
        var mult = (typeof intensityMultiplier === 'number' && !isNaN(intensityMultiplier)) ? intensityMultiplier : 1.0;
        var thr = (typeof threshold === 'number' && !isNaN(threshold)) ? threshold : 0.62;
        var options = {
            intensity: Math.max(0, legacyValue) * 1.4 * mult,
            luminanceThreshold: thr,
            luminanceSmoothing: 0.18,
            mipmapBlur: true
        };

        // HORIZON skies have a small authored sun disk against a flat gradient background.
        // pmndrs mipmap bloom spreads that high-luminance spot into a massive gray cap in
        // the upper hemisphere, so clamp bloom harder for selChoice === "0" while still
        // allowing authored scene objects to pick up a subtle glow.
        return options;
    }

    /**
     * Read a pmndrs-tweak number from the component's `data` (A-Frame schema).
     * Schema fields are typed as 'string' (see vrodos_scene_settings.component.js)
     * so we always parseFloat. Returns `fallback` on parse failure or out-of-range.
     */
    function readPmndrsNumber(self, key, min, max, fallback) {
        var raw = (self && self.data && self.data[key] !== undefined) ? self.data[key] : fallback;
        var n = parseFloat(raw);
        if (isNaN(n)) return fallback;
        if (n < min) return min;
        if (n > max) return max;
        return n;
    }

    function readPmndrsBool(self, key) {
        if (!self || !self.data) return false;
        var v = self.data[key];
        return v === true || v === 'true' || v === '1' || v === 1;
    }

    function hasPmndrsDebugFlag(debugKey, queryKey) {
        if (window.VRODOS_DEBUG && window.VRODOS_DEBUG[debugKey] === true) {
            return true;
        }

        if (typeof window.location === 'undefined' || !window.location.search) {
            return false;
        }

        try {
            var params = new URLSearchParams(window.location.search);
            return params.get(queryKey) === '1';
        } catch (err) {
            return false;
        }
    }

    function getPmndrsAAMode(self) {
        if (!self || typeof self.getPmndrsAAMode !== 'function') {
            return 'none';
        }
        return self.getPmndrsAAMode();
    }

    function getPmndrsAAPreset(self) {
        if (!self || typeof self.getPmndrsAAPreset !== 'function') {
            return 'medium';
        }
        return self.getPmndrsAAPreset();
    }

    function isPmndrsAAEnabled(self) {
        return !!(self && self.data && self.data.postFXEngine === 'pmndrs' && getPmndrsAAMode(self) !== 'none');
    }

    function getPmndrsRequestedMultisampling(self, renderer) {
        var requestedSamples = 0;
        var maxSamples = 0;

        if (!isPmndrsAAEnabled(self) || getPmndrsAAMode(self) !== 'msaa' || hasPmndrsDebugFlag('disablePmndrsMsaa', 'vrodos_debug_disable_pmndrs_msaa')) {
            return 0;
        }
        if (!renderer || !renderer.capabilities || renderer.capabilities.isWebGL2 !== true) {
            return 0;
        }

        switch (getPmndrsAAPreset(self)) {
            case 'low':
                requestedSamples = 2;
                break;
            case 'high':
                requestedSamples = 8;
                break;
            case 'ultra':
                requestedSamples = 16;
                break;
            case 'medium':
            default:
                requestedSamples = 4;
                break;
        }

        maxSamples = parseInt(renderer.capabilities.maxSamples, 10);
        if (!isNaN(maxSamples) && maxSamples > 0) {
            requestedSamples = Math.min(requestedSamples, maxSamples);
        }

        return Math.max(0, Math.floor(requestedSamples));
    }

    function getPmndrsSmaaPreset(self, PP) {
        if (!isPmndrsAAEnabled(self) || getPmndrsAAMode(self) !== 'smaa' || hasPmndrsDebugFlag('disablePmndrsSmaa', 'vrodos_debug_disable_pmndrs_smaa') || !PP || !PP.SMAAPreset) {
            return null;
        }

        switch (getPmndrsAAPreset(self)) {
            case 'low':
                return PP.SMAAPreset.LOW;
            case 'medium':
                return PP.SMAAPreset.MEDIUM;
            case 'high':
                return PP.SMAAPreset.HIGH;
            case 'ultra':
                return PP.SMAAPreset.ULTRA;
            default:
                return PP.SMAAPreset.MEDIUM;
        }
    }

    function getPmndrsComposerSignature(self, renderer, atmosphereConfig, PP) {
        var smaaPreset = getPmndrsSmaaPreset(self, PP);
        return getPmndrsAtmosphereModeSignature(self, atmosphereConfig) +
            '|aaMode:' + getPmndrsAAMode(self) +
            '|aaPreset:' + getPmndrsAAPreset(self) +
            '|msaa:' + getPmndrsRequestedMultisampling(self, renderer) +
            '|smaa:' + (smaaPreset === null ? 'off' : smaaPreset);
    }

    function isPmndrsAADebugOverlayEnabled() {
        return hasPmndrsDebugFlag('pmndrsAADebugOverlay', 'vrodos_debug_pmndrs_aa');
    }

    function ensurePmndrsAADebugOverlay(self) {
        if (!self || !isPmndrsAADebugOverlayEnabled() || typeof document === 'undefined' || !document.body) {
            return null;
        }

        if (!self._pmndrsAADebugOverlay) {
            var overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.left = '12px';
            overlay.style.bottom = '12px';
            overlay.style.zIndex = '99999';
            overlay.style.padding = '8px 10px';
            overlay.style.borderRadius = '8px';
            overlay.style.background = 'rgba(5, 15, 30, 0.88)';
            overlay.style.color = '#7ef9ff';
            overlay.style.font = '12px/1.35 Consolas, Monaco, monospace';
            overlay.style.whiteSpace = 'pre';
            overlay.style.pointerEvents = 'none';
            overlay.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.28)';
            overlay.textContent = 'PMNDRS AA DEBUG\nwaiting for composer...';
            document.body.appendChild(overlay);
            self._pmndrsAADebugOverlay = overlay;
        }

        return self._pmndrsAADebugOverlay;
    }

    function updatePmndrsAADebugOverlay(self) {
        var overlay = ensurePmndrsAADebugOverlay(self);
        var renderer;
        var requestedMsaa;
        var appliedMsaa;
        var maxSamples;
        var lines;

        if (!overlay) {
            return;
        }

        renderer = self && self.el ? self.el.renderer : null;
        requestedMsaa = (self && typeof self._pmndrsRequestedMultisampling === 'number') ? self._pmndrsRequestedMultisampling : getPmndrsRequestedMultisampling(self, renderer);
        appliedMsaa = (self && typeof self._pmndrsAppliedMultisampling === 'number') ? self._pmndrsAppliedMultisampling : 0;
        maxSamples = (renderer && renderer.capabilities && !isNaN(parseInt(renderer.capabilities.maxSamples, 10))) ? parseInt(renderer.capabilities.maxSamples, 10) : 0;

        lines = [
            'PMNDRS AA DEBUG',
            'mode: ' + getPmndrsAAMode(self),
            'preset: ' + getPmndrsAAPreset(self),
            'requested msaa: ' + requestedMsaa,
            'applied msaa: ' + appliedMsaa,
            'webgl2/maxSamples: ' + ((renderer && renderer.capabilities && renderer.capabilities.isWebGL2 === true) ? 'yes' : 'no') + '/' + maxSamples,
            'smaa effect: ' + (self && self.pmndrsSmaaEffect ? 'yes' : 'no'),
            'smaa preset: ' + ((self && self._pmndrsAppliedSmaaPreset !== null && self._pmndrsAppliedSmaaPreset !== undefined) ? self._pmndrsAppliedSmaaPreset : 'off'),
            'composer: ' + (self && self.pmndrsComposer ? 'yes' : 'no'),
            'effect pass: ' + (self && self.pmndrsEffectPass ? 'yes' : 'no'),
            'bloom: ' + (self && self.pmndrsBloomEffect ? 'yes' : 'no'),
            'atmosphere: ' + (self && self.pmndrsAerialPerspectiveEffect ? 'effect' : ((self && typeof self.isPmndrsAtmosphereEnabled === 'function' && self.isPmndrsAtmosphereEnabled()) ? 'takram-only' : 'off')),
            'msaa fallback: ' + ((self && self._pmndrsMsaaFallbackReason) ? self._pmndrsMsaaFallbackReason : 'none')
        ];

        overlay.textContent = lines.join('\n');
    }

    function getPmndrsAtmosphereModeSignature(self, atmosphereConfig) {
        if (!(atmosphereConfig && atmosphereConfig.enabled)) {
            return 'atmosphere:off';
        }

        return isHorizonBackground(self) ? 'atmosphere:horizon' : 'atmosphere:world';
    }

    function disposePmndrsComposerResources(self) {
        if (!self) {
            return;
        }

        if (self.pmndrsComposer) {
            try {
                self.pmndrsComposer.dispose();
            } catch (err) {
                console.warn('[VRodos] pmndrs composer.dispose failed:', err);
            }
        }

        self.pmndrsComposer = null;
        self.pmndrsRenderPass = null;
        self.pmndrsEffectPass = null;
        self.pmndrsSsaoEffect = null;
        self.pmndrsBloomEffect = null;
        self.pmndrsSmaaEffect = null;
        self.pmndrsAerialPerspectiveEffect = null;
        self._pmndrsAtmosphereSignature = null;
        self._pmndrsComposerSignature = null;
        self._pmndrsRequestedMultisampling = 0;
        self._pmndrsAppliedMultisampling = 0;
        self._pmndrsAppliedSmaaPreset = null;
        self._pmndrsMsaaFallbackReason = '';
        self._pmndrsLastW = 0;
        self._pmndrsLastH = 0;
        updatePmndrsAADebugOverlay(self);
    }

    function syncPmndrsAerialPerspectiveEffect(self, camera, atmosphereConfig) {
        if (!self || !self.pmndrsAerialPerspectiveEffect || !(atmosphereConfig && atmosphereConfig.enabled)) {
            return;
        }

        var atmosphereState = (typeof self.ensurePmndrsAtmosphereResources === 'function') ? self.ensurePmndrsAtmosphereResources() : null;
        if (atmosphereState && !atmosphereState.failed && atmosphereState.textures) {
            self.pmndrsAerialPerspectiveEffect.irradianceTexture = atmosphereState.textures.irradianceTexture || null;
            self.pmndrsAerialPerspectiveEffect.scatteringTexture = atmosphereState.textures.scatteringTexture || null;
            self.pmndrsAerialPerspectiveEffect.transmittanceTexture = atmosphereState.textures.transmittanceTexture || null;
            self.pmndrsAerialPerspectiveEffect.singleMieScatteringTexture = atmosphereState.textures.singleMieScatteringTexture || null;
            self.pmndrsAerialPerspectiveEffect.higherOrderScatteringTexture = atmosphereState.textures.higherOrderScatteringTexture || null;
        }

        if (camera && typeof self.pmndrsAerialPerspectiveEffect.mainCamera !== 'undefined') {
            self.pmndrsAerialPerspectiveEffect.mainCamera = camera;
        }

        if (typeof self.applyPmndrsAtmosphereConfigToTarget === 'function') {
            self.applyPmndrsAtmosphereConfigToTarget(self.pmndrsAerialPerspectiveEffect, atmosphereConfig);
        }
    }

    /**
     * Lazily build the EffectComposer on the first intercepted render call.
     * Deferring construction until the first real frame guarantees that
     *   - the active scene camera exists,
     *   - the renderer canvas has non-zero dimensions (Phase 0 zero-canvas race fix),
     *   - any A-Frame deferred init has settled.
     */
    H._buildPmndrsComposer = function (scene, camera) {
        var renderer = this.el.renderer;
        var PP = window.POSTPROCESSING;
        var THREE = window.THREE;
        var atmosphereConfig = (typeof this.getPmndrsAtmosphereConfig === 'function') ? this.getPmndrsAtmosphereConfig() : null;
        if (!renderer || !PP || !THREE || !camera) {
            return false;
        }

        var composer;
        var requestedMultisampling = getPmndrsRequestedMultisampling(this, renderer);
        var requestedMultisamplingInitial = requestedMultisampling;
        var composerOptions = {
            frameBufferType: THREE.HalfFloatType
        };
        if (requestedMultisampling > 0) {
            composerOptions.multisampling = requestedMultisampling;
        }
        try {
            composer = new PP.EffectComposer(renderer, composerOptions);
        } catch (err) {
            if (requestedMultisampling > 0) {
                console.warn('[VRodos] pmndrs EffectComposer multisampling init failed, retrying without MSAA:', err);
                requestedMultisampling = 0;
                this._pmndrsMsaaFallbackReason = 'composer-init-failed';
                try {
                    composer = new PP.EffectComposer(renderer, {
                        frameBufferType: THREE.HalfFloatType
                    });
                } catch (retryErr) {
                    console.error('[VRodos] pmndrs EffectComposer construction failed:', retryErr);
                    return false;
                }
            } else {
                console.error('[VRodos] pmndrs EffectComposer construction failed:', err);
                return false;
            }
        }

        // Defensive setSize — guard against the A-Frame zero-canvas race observed in Phase 0.
        var w = (renderer.domElement && (renderer.domElement.clientWidth || renderer.domElement.width)) || window.innerWidth || 1;
        var h = (renderer.domElement && (renderer.domElement.clientHeight || renderer.domElement.height)) || window.innerHeight || 1;
        composer.setSize(Math.max(1, w), Math.max(1, h));

        var renderPass = new PP.RenderPass(scene, camera);
        composer.addPass(renderPass);

        var effects = [];
        this._pmndrsAtmosphereSignature = getPmndrsAtmosphereModeSignature(this, atmosphereConfig);
        this._pmndrsComposerSignature = getPmndrsComposerSignature(this, renderer, atmosphereConfig, PP);
        this._pmndrsRequestedMultisampling = requestedMultisamplingInitial;
        this._pmndrsAppliedMultisampling = requestedMultisampling;
        this._pmndrsAppliedSmaaPreset = null;
        if (!this._pmndrsMsaaFallbackReason) {
            this._pmndrsMsaaFallbackReason = '';
        }

        if (atmosphereConfig && atmosphereConfig.enabled && !isHorizonBackground(this)) {
            var VTA = window.VRODOS_TAKRAM_ATMOSPHERE;
            var atmosphereState = (typeof this.ensurePmndrsAtmosphereResources === 'function') ? this.ensurePmndrsAtmosphereResources() : null;

            if (VTA && atmosphereState && !atmosphereState.failed && atmosphereState.textures) {
                try {
                    this.pmndrsAerialPerspectiveEffect = new VTA.AerialPerspectiveEffect(camera, {
                        irradianceTexture: atmosphereState.textures.irradianceTexture || null,
                        scatteringTexture: atmosphereState.textures.scatteringTexture || null,
                        transmittanceTexture: atmosphereState.textures.transmittanceTexture || null,
                        singleMieScatteringTexture: atmosphereState.textures.singleMieScatteringTexture || null,
                        higherOrderScatteringTexture: atmosphereState.textures.higherOrderScatteringTexture || null,
                        transmittance: atmosphereConfig.transmittanceEnabled,
                        inscatter: atmosphereConfig.inscatterEnabled,
                        albedoScale: atmosphereConfig.albedoScale,
                        sky: false,
                        sun: atmosphereConfig.takramSunEnabled !== false,
                        moon: atmosphereConfig.moonEnabled,
                        ground: atmosphereConfig.groundEnabled
                    });
                    if (typeof this.applyPmndrsAtmosphereConfigToTarget === 'function') {
                        this.applyPmndrsAtmosphereConfigToTarget(this.pmndrsAerialPerspectiveEffect, atmosphereConfig);
                    }
                    effects.push(this.pmndrsAerialPerspectiveEffect);
                } catch (err) {
                    console.warn('[VRodos] pmndrs Takram AerialPerspectiveEffect construction failed, skipping:', err);
                    this.pmndrsAerialPerspectiveEffect = null;
                }
            } else if (!this._pmndrsAtmosphereWarned) {
                console.info('[VRodos] PMNDRS atmosphere requested but Takram atmosphere resources are not ready - using fallback horizon visuals.');
                this._pmndrsAtmosphereWarned = true;
            }
        } else if (atmosphereConfig && atmosphereConfig.enabled && isHorizonBackground(this)) {
            // Horizon keeps using Takram SkyMaterial directly. The post-process
            // AerialPerspectiveEffect triggers repeated depth blit errors on the
            // current pinned A-Frame runtime, which also manifests visually as an
            // opaque white ground cap over the horizon.
            this.pmndrsAerialPerspectiveEffect = null;
        }

        // SSAO — temporarily disabled in the pmndrs pipeline (Phase 3).
        //
        // pmndrs SSAOEffect with normalBuffer=null shares the composer's depth
        // attachment, which causes
        //   GL_INVALID_OPERATION: glBlitFramebuffer: Read and write depth stencil
        //   attachments cannot be the same image
        // when combined with HalfFloatType frame buffers. Wiring up
        // DepthDownsamplingPass + a separate normal buffer is the proper fix
        // (Phase 3 follow-up). For now we no-op so the rest of the pipeline
        // can render. Scenes that require SSAO should compile against the
        // legacy engine.
        var aoPreset = (typeof this.getAmbientOcclusionPreset === 'function') ? this.getAmbientOcclusionPreset() : 'off';
        if (aoPreset && aoPreset !== 'off' && !this._pmndrsSsaoSkipWarned) {
            console.info('[VRodos] pmndrs pipeline: SSAO preset "' + aoPreset + '" requested but SSAOEffect is disabled in this Phase 3 build (depth-attachment blit conflict). Switch postFXEngine to "legacy" if SSAO is required.');
            this._pmndrsSsaoSkipWarned = true;
        }
        this.pmndrsSsaoEffect = null;

        // Bloom (intensity & threshold come from per-scene Pmndrs tweaks)
        var bloomVal = (typeof this.getBloomStrengthValue === 'function') ? this.getBloomStrengthValue() : 0;
        var pmndrsBloomMult = readPmndrsNumber(this, 'pmndrsBloomIntensity', 0, 3, 1.0);
        var pmndrsBloomThr  = readPmndrsNumber(this, 'pmndrsBloomThreshold', 0, 1, 0.62);
        if (isHorizonBackground(this) && bloomVal > 0 && !this._pmndrsHorizonBloomSkipWarned) {
            console.info('[VRodos] pmndrs bloom disabled for HORIZON background to avoid sky haloing. Switch to "legacy" if bloom on the HORIZON sky is required.');
            this._pmndrsHorizonBloomSkipWarned = true;
        }
        if (!isHorizonBackground(this) && bloomVal > 0 && pmndrsBloomMult > 0) {
            try {
                this.pmndrsBloomEffect = new PP.BloomEffect(bloomOptionsForLegacyValue(this, bloomVal, pmndrsBloomMult, pmndrsBloomThr));
                effects.push(this.pmndrsBloomEffect);
            } catch (err) {
                console.warn('[VRodos] pmndrs BloomEffect construction failed, skipping:', err);
                this.pmndrsBloomEffect = null;
            }
        }

        // ACES Filmic tone mapping — applied before color grading so that
        // grading (brightness/contrast, hue/saturation, vignette) operates
        // on perceptually uniform (LDR) colours, preventing washed-out results.
        // Per-scene exposure multiplier is applied via the renderer's toneMappingExposure.
        try {
            effects.push(new PP.ToneMappingEffect({ mode: PP.ToneMappingMode.ACES_FILMIC }));
            var pmndrsExposure = readPmndrsNumber(this, 'pmndrsToneMappingExposure', 0.3, 2.5, 1.0);
            if (renderer && typeof renderer.toneMappingExposure !== 'undefined') {
                this._pmndrsPrevToneMappingExposure = renderer.toneMappingExposure;
                renderer.toneMappingExposure = pmndrsExposure;
            }
            if (renderer && typeof renderer.toneMapping !== 'undefined' && typeof THREE.NoToneMapping !== 'undefined') {
                this._pmndrsPrevToneMapping = renderer.toneMapping;
                renderer.toneMapping = THREE.NoToneMapping;
            }
        } catch (err) {
            console.warn('[VRodos] pmndrs ToneMappingEffect failed, skipping:', err);
        }

        // Color grading — Brightness/Contrast + Hue/Saturation
        if (this.isPostFXOptionEnabled && this.isPostFXOptionEnabled('postFXColorEnabled')) {
            try {
                var contrastVal = (typeof this.getContrastValue === 'function') ? this.getContrastValue() : 1.0;
                var saturationVal = (typeof this.getSaturationValue === 'function') ? this.getSaturationValue() : 1.0;
                effects.push(new PP.BrightnessContrastEffect({ contrast: contrastVal - 1.0, brightness: 0.0 }));
                effects.push(new PP.HueSaturationEffect({ saturation: saturationVal - 1.0, hue: 0.0 }));
            } catch (err) {
                console.warn('[VRodos] pmndrs color grading effects failed, skipping:', err);
            }
        }

        // Vignette — pmndrs engine has its own per-scene flag (legacy postFXVignetteEnabled
        // is hard-coded false, so we honour pmndrsVignetteEnabled instead)
        var pmndrsVignetteOn = readPmndrsBool(this, 'pmndrsVignetteEnabled');
        if (pmndrsVignetteOn) {
            try {
                var vDarkness = readPmndrsNumber(this, 'pmndrsVignetteDarkness', 0, 1, 0.5);
                effects.push(new PP.VignetteEffect({ offset: 0.35, darkness: vDarkness }));
            } catch (err) {
                console.warn('[VRodos] pmndrs VignetteEffect failed, skipping:', err);
            }
        }

        // PMNDRS anti-aliasing — exclusive mode selection:
        //   - none: no PMNDRS AA
        //   - smaa: SMAAEffect only
        //   - msaa: composer multisampling only
        // FXAA stays disabled due the Horizon sun halo artifact it introduced on
        // the pinned r181 stack.
        var smaaPreset = getPmndrsSmaaPreset(this, PP);
        if (smaaPreset !== null) {
            try {
                this.pmndrsSmaaEffect = new PP.SMAAEffect({ preset: smaaPreset });
                effects.push(this.pmndrsSmaaEffect);
                this._pmndrsAppliedSmaaPreset = smaaPreset;
            } catch (err) {
                console.warn('[VRodos] pmndrs SMAAEffect construction failed, continuing without SMAA:', err);
                this.pmndrsSmaaEffect = null;
                this._pmndrsAppliedSmaaPreset = null;
            }
        } else {
            this.pmndrsSmaaEffect = null;
            this._pmndrsAppliedSmaaPreset = null;
        }

        // SSR / TRAA are not supported in this engine — log once per scene load.
        var wantsSSR = this.isPostFXOptionEnabled && this.isPostFXOptionEnabled('postFXSSREnabled');
        var wantsTAA = this.isPostFXOptionEnabled && this.isPostFXOptionEnabled('postFXTAAEnabled');
        if ((wantsSSR || wantsTAA) && !this._pmndrsSsrTraaWarned) {
            console.info('[VRodos] SSR/TRAA requested but not available in pmndrs pipeline — switch postFXEngine to "legacy" if those effects are required.');
            this._pmndrsSsrTraaWarned = true;
        }

        if (effects.length === 0) {
            // Nothing to merge — just feed the scene through with no post-FX.
            // Composer is still useful because it handles the final blit, but we
            // skip the EffectPass entirely to avoid an empty fragment shader.
            this.pmndrsEffectPass = null;
        } else {
            try {
                // EffectPass takes (camera, ...effects). Use spread (es2019 target).
                this.pmndrsEffectPass = new PP.EffectPass(camera, ...effects);
                composer.addPass(this.pmndrsEffectPass);
            } catch (err) {
                console.error('[VRodos] pmndrs EffectPass construction failed:', err);
                try { composer.dispose(); } catch (e) { /* swallow */ }
                return false;
            }
        }

        this.pmndrsComposer = composer;
        this.pmndrsRenderPass = renderPass;
        this._pmndrsLastW = 0;
        this._pmndrsLastH = 0;

        // Adaptive AO half-rate state — mirrors legacy file lines 282-315.
        // When 30-frame rolling avg FPS drops below 30, SSAO blends out on
        // alternate frames (effective half-rate) until FPS recovers above 45.
        // 3-second cooldown between state changes prevents oscillation.
        this._pmndrsAdaptive = {
            halfRate: false,
            frameCounter: 0,
            fpsHistory: new Float32Array(30),
            fpsHistoryIdx: 0,
            fpsHistoryFilled: false,
            lastStateChange: (typeof performance !== 'undefined' ? performance.now() : Date.now()),
            lastFrameTime: (typeof performance !== 'undefined' ? performance.now() : Date.now())
        };

        updatePmndrsAADebugOverlay(this);

        return true;
    };

    H.enablePmndrsPostProcessing = function () {
        var renderer = this.el.renderer;
        if (!renderer || this.pmndrsActive) {
            return;
        }
        if (!window.POSTPROCESSING) {
            console.error('[VRodos] pmndrs engine selected but window.POSTPROCESSING is not loaded — post-FX disabled');
            return;
        }
        if (typeof THREE === 'undefined' && typeof window.THREE === 'undefined') {
            console.error('[VRodos] pmndrs engine selected but window.THREE is not loaded — post-FX disabled');
            return;
        }

        this.postProcessingSize = this.postProcessingSize || new (window.THREE.Vector2)();
        this.pmndrsOriginalRender = renderer.render.bind(renderer);
        this.pmndrsActive = true;
        this.pmndrsRendering = false;
        this._pmndrsSsrTraaWarned = false;
        this._pmndrsAtmosphereWarned = false;
        ensurePmndrsAADebugOverlay(this);
        updatePmndrsAADebugOverlay(this);

        var self = this;
        renderer.render = function (scene, camera) {
            var shouldIntercept = self.pmndrsActive &&
                self.shouldUsePostProcessing() &&
                !self.pmndrsRendering &&
                !self.sceneProbeCapturing &&
                scene === self.el.object3D &&
                camera;

            if (!shouldIntercept) {
                return self.pmndrsOriginalRender(scene, camera);
            }

            // Lazy composer build on first valid frame — guarantees camera and canvas
            // are ready (Phase 0 zero-canvas race fix).
            var atmosphereConfig = (typeof self.getPmndrsAtmosphereConfig === 'function') ? self.getPmndrsAtmosphereConfig() : null;
            var composerSignature = getPmndrsComposerSignature(self, self.el && self.el.renderer, atmosphereConfig, window.POSTPROCESSING);
            if (self.pmndrsComposer && self._pmndrsComposerSignature !== composerSignature) {
                disposePmndrsComposerResources(self);
            }
            if (!self.pmndrsComposer) {
                var built = self._buildPmndrsComposer(scene, camera);
                if (!built || !self.pmndrsComposer) {
                    return self.pmndrsOriginalRender(scene, camera);
                }
            }

            // Camera may change between frames (e.g. cinematic switches) — keep RenderPass in sync.
            if (self.pmndrsRenderPass && self.pmndrsRenderPass.mainCamera !== camera) {
                self.pmndrsRenderPass.mainCamera = camera;
                if (self.pmndrsEffectPass && typeof self.pmndrsEffectPass.mainCamera !== 'undefined') {
                    self.pmndrsEffectPass.mainCamera = camera;
                }
                if (self.pmndrsAerialPerspectiveEffect && typeof self.pmndrsAerialPerspectiveEffect.mainCamera !== 'undefined') {
                    self.pmndrsAerialPerspectiveEffect.mainCamera = camera;
                }
            }

            syncPmndrsAerialPerspectiveEffect(self, camera, atmosphereConfig);
            self.updatePmndrsPostProcessingSize();
            self._updatePmndrsAdaptiveAO();

            self.pmndrsRendering = true;
            try {
                self.pmndrsComposer.render();
            } catch (err) {
                console.error('[VRodos] pmndrs composer.render failed:', err);
                // Fall back to direct render so the scene keeps drawing
                self.pmndrsOriginalRender(scene, camera);
            } finally {
                self.pmndrsRendering = false;
                updatePmndrsAADebugOverlay(self);
            }
        };
    };

    H.updatePmndrsPostProcessingSize = function () {
        if (!this.pmndrsComposer || !this.el.renderer) {
            return;
        }
        var renderer = this.el.renderer;
        var size = this.postProcessingSize;
        renderer.getSize(size);
        // pmndrs/postprocessing's EffectComposer.setSize expects CSS pixels (NOT
        // device pixels) — it re-applies the renderer pixel ratio internally.
        // The legacy file pre-multiplies because its custom composer is built
        // around physical pixel buffers. Multiplying here causes max-texture-size
        // overflow on HiDPI screens and the framebuffer comes back with zero-size
        // attachments (black screen).
        var w = Math.max(1, Math.floor(size.x));
        var h = Math.max(1, Math.floor(size.y));
        if (this._pmndrsLastW !== w || this._pmndrsLastH !== h) {
            this.pmndrsComposer.setSize(w, h);
            this._pmndrsLastW = w;
            this._pmndrsLastH = h;
        }
    };

    /**
     * Adaptive SSAO half-rate. Departs from the legacy SAO ping-pong behaviour:
     * because the SSAOEffect is merged inside the fused EffectPass we cannot
     * cheaply skip its render call, so instead we modulate its blendMode opacity
     * between 1 and 0 on alternate frames when half-rate is engaged. The visual
     * delta is small because SSAO is already low-frequency. Same FPS state machine
     * as the legacy file (30-frame rolling avg, 30/45 hysteresis, 3 s cooldown).
     */
    H._updatePmndrsAdaptiveAO = function () {
        if (!this.pmndrsSsaoEffect || !this._pmndrsAdaptive) {
            return;
        }
        var a = this._pmndrsAdaptive;
        var nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        var frameDt = nowMs - a.lastFrameTime;
        a.lastFrameTime = nowMs;
        if (frameDt > 0 && frameDt < 1000) {
            a.fpsHistory[a.fpsHistoryIdx] = 1000 / frameDt;
            a.fpsHistoryIdx = (a.fpsHistoryIdx + 1) % 30;
            if (a.fpsHistoryIdx === 0) {
                a.fpsHistoryFilled = true;
            }
        }
        if (a.fpsHistoryFilled) {
            var sum = 0;
            for (var i = 0; i < 30; i++) {
                sum += a.fpsHistory[i];
            }
            var avgFps = sum / 30;
            var sinceChange = nowMs - a.lastStateChange;
            if (sinceChange > 3000) {
                if (!a.halfRate && avgFps < 30) {
                    a.halfRate = true;
                    a.lastStateChange = nowMs;
                } else if (a.halfRate && avgFps > 45) {
                    a.halfRate = false;
                    a.lastStateChange = nowMs;
                }
            }
        }
        if (this.pmndrsSsaoEffect.blendMode && this.pmndrsSsaoEffect.blendMode.opacity) {
            if (a.halfRate) {
                var skip = (a.frameCounter & 1) === 1;
                a.frameCounter++;
                this.pmndrsSsaoEffect.blendMode.opacity.value = skip ? 0 : 1;
            } else {
                this.pmndrsSsaoEffect.blendMode.opacity.value = 1;
            }
        }
    };

    H.disablePmndrsPostProcessing = function () {
        if (!this.pmndrsActive || !this.el.renderer) {
            return;
        }
        if (this.pmndrsOriginalRender) {
            this.el.renderer.render = this.pmndrsOriginalRender;
        }
        if (typeof this._pmndrsPrevToneMappingExposure === 'number' && this.el.renderer) {
            this.el.renderer.toneMappingExposure = this._pmndrsPrevToneMappingExposure;
            this._pmndrsPrevToneMappingExposure = undefined;
        }
        if (typeof this._pmndrsPrevToneMapping !== 'undefined' && this.el.renderer) {
            this.el.renderer.toneMapping = this._pmndrsPrevToneMapping;
            this._pmndrsPrevToneMapping = undefined;
        }
        disposePmndrsComposerResources(this);
        this.pmndrsOriginalRender = null;
        this.pmndrsActive = false;
        this.pmndrsRendering = false;
        this._pmndrsAdaptive = null;
        this._pmndrsSsrTraaWarned = false;
        this._pmndrsAtmosphereWarned = false;
        updatePmndrsAADebugOverlay(this);
    };

    /**
     * Engine-aware sync. Replaces the legacy syncPostProcessingState when
     * postFXEngine === 'pmndrs'. The component-side dispatcher (Phase 2c) decides
     * which sync method to call based on the scene-settings field.
     */
    H.syncPmndrsPostProcessingState = function () {
        if (this.shouldUsePostProcessing()) {
            this.enablePmndrsPostProcessing();
            this.updatePmndrsPostProcessingSize();
            return;
        }
        this.disablePmndrsPostProcessing();
    };
})();
