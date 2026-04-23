/**
 * VRodos Post-Processing Helpers
 * Extracted from vrodos_scene_settings.component.js
 * Functions are assigned as methods on the scene-settings component via VRODOSMaster.SceneSettingsHelpers
 */
(function () {
    var H = VRODOSMaster.SceneSettingsHelpers = VRODOSMaster.SceneSettingsHelpers || {};
    H.updatePostProcessingSize = function () {
        if (!this.postProcessingTarget || !this.el.renderer) {
            return;
        }

        var size = this.postProcessingSize;
        this.el.renderer.getSize(size);
        var pixelRatio = typeof this.el.renderer.getPixelRatio === 'function' ? this.el.renderer.getPixelRatio() : 1;
        var width = Math.max(1, Math.floor(size.x * pixelRatio));
        var height = Math.max(1, Math.floor(size.y * pixelRatio));

        if (this.postProcessingTarget.width !== width || this.postProcessingTarget.height !== height) {
            this.postProcessingTarget.setSize(width, height);
        }

        // Resize FXAA target
        if (this.fxaaTarget && (this.fxaaTarget.width !== width || this.fxaaTarget.height !== height)) {
            this.fxaaTarget.setSize(width, height);
        }
        if (this.fxaaMaterial && this.fxaaMaterial.uniforms && this.fxaaMaterial.uniforms.resolution) {
            this.fxaaMaterial.uniforms.resolution.value.set(1.0 / width, 1.0 / height);
        }

        // Resize bloom targets at half resolution
        var halfW = Math.max(1, Math.floor(width / 2));
        var halfH = Math.max(1, Math.floor(height / 2));
        if (this.bloomTargetA && (this.bloomTargetA.width !== halfW || this.bloomTargetA.height !== halfH)) {
            this.bloomTargetA.setSize(halfW, halfH);
        }
        if (this.bloomTargetB && (this.bloomTargetB.width !== halfW || this.bloomTargetB.height !== halfH)) {
            this.bloomTargetB.setSize(halfW, halfH);
        }
        if (this.bloomBlurMaterial && this.bloomBlurMaterial.uniforms && this.bloomBlurMaterial.uniforms.resolution) {
            this.bloomBlurMaterial.uniforms.resolution.value.set(halfW, halfH);
        }

        // Resize SAO targets at half resolution
        if (this.saoTargetA && (this.saoTargetA.width !== halfW || this.saoTargetA.height !== halfH)) {
            this.saoTargetA.setSize(halfW, halfH);
        }
        if (this.saoTargetB && (this.saoTargetB.width !== halfW || this.saoTargetB.height !== halfH)) {
            this.saoTargetB.setSize(halfW, halfH);
        }
        if (this.saoMaterial && this.saoMaterial.uniforms && this.saoMaterial.uniforms.size) {
            this.saoMaterial.uniforms.size.value.set(halfW, halfH);
        }
        if (this.saoBlurMaterial && this.saoBlurMaterial.uniforms && this.saoBlurMaterial.uniforms.size) {
            this.saoBlurMaterial.uniforms.size.value.set(halfW, halfH);
        }

        // Resize TAA targets at full resolution
        if (this.taaTargetA && (this.taaTargetA.width !== width || this.taaTargetA.height !== height)) {
            this.taaTargetA.setSize(width, height);
        }
        if (this.taaTargetB && (this.taaTargetB.width !== width || this.taaTargetB.height !== height)) {
            this.taaTargetB.setSize(width, height);
        }
        if (this.taaMaterial && this.taaMaterial.uniforms && this.taaMaterial.uniforms.resolution) {
            this.taaMaterial.uniforms.resolution.value.set(width, height);
        }

        // Resize SSR target at half resolution
        if (this.ssrTargetA && (this.ssrTargetA.width !== halfW || this.ssrTargetA.height !== halfH)) {
            this.ssrTargetA.setSize(halfW, halfH);
        }
        if (this.ssrMaterial && this.ssrMaterial.uniforms && this.ssrMaterial.uniforms.resolution) {
            this.ssrMaterial.uniforms.resolution.value.set(halfW, halfH);
        }
    };
    H.enablePostProcessing = function () {
        var renderer = this.el.renderer;
        if (!renderer || this.postProcessingActive) {
            return;
        }

        var width = 1;
        var height = 1;
        if (typeof renderer.getSize === 'function') {
            renderer.getSize(this.postProcessingSize);
            var pixelRatio = typeof renderer.getPixelRatio === 'function' ? renderer.getPixelRatio() : 1;
            width = Math.max(1, Math.floor(this.postProcessingSize.x * pixelRatio));
            height = Math.max(1, Math.floor(this.postProcessingSize.y * pixelRatio));
        }

        // Create main render target — attach DepthTexture when SAO, TAA, or SSR is active (disables MSAA)
        var saoParams = this.getSAOParams();
        var taaEnabled = this.isPostFXOptionEnabled('postFXTAAEnabled');
        var ssrEnabled = this.isPostFXOptionEnabled('postFXSSREnabled');
        var needsDepthTexture = saoParams || taaEnabled || ssrEnabled;
        var targetOptions = { depthBuffer: true };
        if (needsDepthTexture) {
            var depthTexture = new THREE.DepthTexture(width, height);
            depthTexture.type = THREE.UnsignedIntType;
            targetOptions.depthTexture = depthTexture;
        }
        this.postProcessingTarget = new THREE.WebGLRenderTarget(width, height, targetOptions);
        // Force the current Three runtime to apply ACESFilmic tone mapping + sRGB encoding when
        // rendering to this target. Normally Three skips both for WebGLRenderTarget (only does
        // for null/screen target). Setting isXRRenderTarget=true + colorSpace=SRGBColorSpace
        // makes it follow the XR path which applies both — matching the direct-to-screen output.
        // The composite shader then needs NO linearToSRGB since the RT is already fully encoded.
        this.postProcessingTarget.isXRRenderTarget = true;
        this.postProcessingTarget.texture.colorSpace = THREE.SRGBColorSpace;
        // MSAA only when DepthTexture is off (DepthTexture + MSAA conflict in WebGL2)
        if (!needsDepthTexture && typeof this.postProcessingTarget.samples !== 'undefined') {
            var maxSamples = (renderer.capabilities && renderer.capabilities.maxSamples) ? renderer.capabilities.maxSamples : 4;
            this.postProcessingTarget.samples = Math.min(maxSamples, this.getAAQualitySampleCount());
        }
        // Compile the composite shader with ONLY the features enabled for this
        // session — disabled effects contribute zero texture fetches and zero
        // ALU. Post-FX settings are static per session so compile-time
        // specialization is safe and optimal.
        var compositeFeatures = {
            sao: !!saoParams,
            ssr: ssrEnabled,
            bloom: this.getBloomStrengthValue() > 0,
            colorGrading: this.isPostFXOptionEnabled('postFXColorEnabled'),
            vignette: this.isPostFXOptionEnabled('postFXVignetteEnabled')
        };
        this._compositeFeatures = compositeFeatures;
        this.postProcessingMaterial = VRODOSMaster.createPhotorealPostMaterial(compositeFeatures);
        this.postProcessingScene = new THREE.Scene();
        this.postProcessingCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.postProcessingQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postProcessingMaterial);
        this.postProcessingScene.add(this.postProcessingQuad);

        // Half-res dimensions (reused by bloom, SAO, SSR)
        var halfW = Math.max(1, Math.floor(width / 2));
        var halfH = Math.max(1, Math.floor(height / 2));

        // Multi-pass bloom targets (half resolution) — lazy: only when strength > 0
        var bloomEnabled = this.getBloomStrengthValue() > 0;
        if (bloomEnabled) {
            this.bloomTargetA = new THREE.WebGLRenderTarget(halfW, halfH, { depthBuffer: false });
            this.bloomTargetB = new THREE.WebGLRenderTarget(halfW, halfH, { depthBuffer: false });
            this.bloomBrightPassMaterial = VRODOSMaster.createBrightPassMaterial();
            this.bloomBlurMaterial = VRODOSMaster.createGaussianBlurMaterial();
            this.bloomBlurMaterial.uniforms.resolution.value.set(halfW, halfH);
            this.bloomQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bloomBrightPassMaterial);
            this.bloomScene = new THREE.Scene();
            this.bloomScene.add(this.bloomQuad);
        }

        // SAO pass (half resolution, depth-only ambient occlusion)
        if (saoParams) {
            this.saoTargetA = new THREE.WebGLRenderTarget(halfW, halfH, { depthBuffer: false });
            this.saoTargetB = new THREE.WebGLRenderTarget(halfW, halfH, { depthBuffer: false });
            this.saoMaterial = VRODOSMaster.createSAOMaterial();
            this.saoMaterial.defines.NUM_SAMPLES = saoParams.numSamples;
            this.saoMaterial.defines.NUM_RINGS = saoParams.numRings;
            this.saoMaterial.needsUpdate = true;
            this.saoMaterial.uniforms.intensity.value = saoParams.intensity;
            this.saoMaterial.uniforms.kernelRadius.value = saoParams.kernelRadius;
            this.saoMaterial.uniforms.bias.value = saoParams.bias;
            this.saoMaterial.uniforms.maxDistance.value = saoParams.maxDistance;
            this.saoMaterial.uniforms.size.value.set(halfW, halfH);
            this.saoBlurMaterial = VRODOSMaster.createSAOBlurMaterial();
            this.saoBlurMaterial.uniforms.size.value.set(halfW, halfH);
            this.saoBlurMaterial.uniforms.depthCutoff.value = saoParams.depthCutoff;
            this.saoQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.saoMaterial);
            this.saoScene = new THREE.Scene();
            this.saoScene.add(this.saoQuad);

            // Adaptive SAO state — FPS-based half-rate temporal subsampling.
            // When rolling avg FPS drops below 30, SAO is computed every 2nd
            // frame instead of every frame; the composite shader still samples
            // saoTargetA which holds the previous frame's result. SAO is
            // low-frequency so the visual delta is nearly invisible, but it
            // cuts SAO GPU cost in half during heavy scenes.
            this._adaptiveSAOHalfRate = false;
            this._adaptiveSAOFrameCounter = 0;
            this._adaptiveFPSHistory = new Float32Array(30);
            this._adaptiveFPSHistoryIdx = 0;
            this._adaptiveFPSHistoryFilled = false;
            this._adaptiveLastStateChange = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            this._adaptiveLastFrameTime = this._adaptiveLastStateChange;
        }

        // FXAA pass (full resolution, after composite) — lazy.
        // fxaaTarget doubles as the temp composite buffer when TAA is on, and
        // fxaaScene/fxaaQuad are reused for the final TAA→screen blit, so they
        // are allocated whenever EITHER FXAA or TAA is enabled.
        // fxaaMaterial itself is only needed when FXAA is actually the final pass
        // (skipped when TAA is on — FXAA would blur TAA's texture detail).
        var fxaaEnabled = this.isPostFXOptionEnabled('postFXEdgeAAEnabled');
        if (fxaaEnabled || taaEnabled) {
            this.fxaaTarget = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
            this.fxaaQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
            this.fxaaScene = new THREE.Scene();
            this.fxaaScene.add(this.fxaaQuad);
        }
        if (fxaaEnabled && !taaEnabled) {
            this.fxaaMaterial = VRODOSMaster.createFXAAMaterial();
            this.fxaaMaterial.uniforms.resolution.value.set(1.0 / width, 1.0 / height);
            this.fxaaQuad.material = this.fxaaMaterial;
        }

        // TAA pass (full resolution, temporal accumulation with ping-pong)
        if (taaEnabled) {
            this.taaTargetA = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
            this.taaTargetB = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
            this.taaCurrentTarget = this.taaTargetA;
            this.taaHistoryTarget = this.taaTargetB;
            this.taaMaterial = VRODOSMaster.createTAAMaterial();
            this.taaMaterial.uniforms.resolution.value.set(width, height);
            this.taaQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.taaMaterial);
            this.taaScene = new THREE.Scene();
            this.taaScene.add(this.taaQuad);
            this._taaFrameIndex = 0;
            // Pre-compute Halton(2,3) jitter sequence (16 samples)
            this._taaJitterSequence = [];
            for (var ji = 0; ji < 16; ji++) {
                this._taaJitterSequence.push({
                    x: this._halton(ji + 1, 2) - 0.5,
                    y: this._halton(ji + 1, 3) - 0.5
                });
            }

            // Simple blit material — used to copy the TAA output to screen
            // WITHOUT running FXAA on top of it (FXAA blurs texture detail and
            // compounds TAA's temporal softening).
            this.taaBlitMaterial = new THREE.ShaderMaterial({
                uniforms: { tDiffuse: { value: null } },
                vertexShader: [
                    'varying vec2 vUv;',
                    'void main() {',
                    '  vUv = uv;',
                    '  gl_Position = vec4(position.xy, 0.0, 1.0);',
                    '}'
                ].join('\n'),
                fragmentShader: [
                    'uniform sampler2D tDiffuse;',
                    'varying vec2 vUv;',
                    'void main() {',
                    '  gl_FragColor = texture2D(tDiffuse, vUv);',
                    '}'
                ].join('\n'),
                depthWrite: false,
                depthTest: false
            });
            this.taaBlitMaterial.toneMapped = false;
        }

        // SSR pass (half resolution, screen-space ray marching)
        if (ssrEnabled) {
            this.ssrTargetA = new THREE.WebGLRenderTarget(halfW, halfH, { depthBuffer: false });
            this.ssrMaterial = VRODOSMaster.createSSRMaterial();
            this.ssrMaterial.uniforms.resolution.value.set(halfW, halfH);
            this.ssrQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.ssrMaterial);
            this.ssrScene = new THREE.Scene();
            this.ssrScene.add(this.ssrQuad);
        }

        this.postProcessingOriginalRender = renderer.render.bind(renderer);
        this.postProcessingActive = true;

        renderer.render = function (scene, camera) {
            var shouldIntercept = this.postProcessingActive &&
                this.shouldUsePostProcessing() &&
                !this.postProcessingRendering &&
                !this.sceneProbeCapturing &&
                scene === this.el.object3D &&
                camera;

            if (!shouldIntercept) {
                return this.postProcessingOriginalRender(scene, camera);
            }

            this.updatePostProcessingSize();
            this.postProcessingRendering = true;

            try {
                var previousTarget = renderer.getRenderTarget();

                // --- Adaptive SAO quality: update FPS history and state machine ---
                // Only active when SAO resources exist. Temporal subsampling cuts
                // SAO cost in half when the 30-frame rolling avg FPS drops below 30.
                if (this.saoMaterial && this._adaptiveFPSHistory) {
                    var nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
                    var frameDt = nowMs - this._adaptiveLastFrameTime;
                    this._adaptiveLastFrameTime = nowMs;
                    // Ignore tab-pause / first-frame outliers
                    if (frameDt > 0 && frameDt < 1000) {
                        this._adaptiveFPSHistory[this._adaptiveFPSHistoryIdx] = 1000 / frameDt;
                        this._adaptiveFPSHistoryIdx = (this._adaptiveFPSHistoryIdx + 1) % 30;
                        if (this._adaptiveFPSHistoryIdx === 0) {
                            this._adaptiveFPSHistoryFilled = true;
                        }
                    }
                    if (this._adaptiveFPSHistoryFilled) {
                        var fpsSum = 0;
                        for (var ai = 0; ai < 30; ai++) {
                            fpsSum += this._adaptiveFPSHistory[ai];
                        }
                        var avgFps = fpsSum / 30;
                        var sinceChange = nowMs - this._adaptiveLastStateChange;
                        // 3-second cooldown between state changes to prevent oscillation
                        if (sinceChange > 3000) {
                            if (!this._adaptiveSAOHalfRate && avgFps < 30) {
                                this._adaptiveSAOHalfRate = true;
                                this._adaptiveLastStateChange = nowMs;
                            } else if (this._adaptiveSAOHalfRate && avgFps > 45) {
                                this._adaptiveSAOHalfRate = false;
                                this._adaptiveLastStateChange = nowMs;
                            }
                        }
                    }
                }

                // TAA jitter: apply sub-pixel offset to camera projection
                var useTAA = this.isPostFXOptionEnabled('postFXTAAEnabled') && this.taaMaterial && this.taaCurrentTarget;
                if (useTAA) {
                    // Apply Halton jitter to projection matrix
                    this._taaSavedProjectionMatrix = this._taaSavedProjectionMatrix || new THREE.Matrix4();
                    this._taaSavedProjectionMatrix.copy(camera.projectionMatrix);
                    var jitter = this._taaJitterSequence[this._taaFrameIndex % 16];
                    var size = renderer.getSize(this.postProcessingSize);
                    // Jitter magnitude ±0.375 px (reduced from ±0.5) — less sub-pixel
                    // drift per frame means less accumulated softening in the history buffer.
                    camera.projectionMatrix.elements[8] += (jitter.x * 1.5) / size.x;
                    camera.projectionMatrix.elements[9] += (jitter.y * 1.5) / size.y;
                    this._taaFrameIndex++;
                }

                // Pass 1: Render scene to main target
                renderer.setRenderTarget(this.postProcessingTarget);
                renderer.clear(true, true, true);
                this.postProcessingOriginalRender(scene, camera);

                // Restore un-jittered projection after scene render
                if (useTAA) {
                    camera.projectionMatrix.copy(this._taaSavedProjectionMatrix);
                }

                // SAO passes (only if SAO is active and resources exist).
                // Adaptive: in half-rate mode, compute only on even frames and
                // reuse the previous frame's saoTargetA on odd frames. The
                // composite shader still samples saoTargetA which holds the
                // last computed result — SAO is low-frequency so this is
                // nearly imperceptible but halves SAO GPU cost.
                var skipSAOThisFrame = false;
                if (this.saoMaterial && this._adaptiveSAOHalfRate) {
                    skipSAOThisFrame = (this._adaptiveSAOFrameCounter & 1) === 1;
                    this._adaptiveSAOFrameCounter++;
                }
                if (!skipSAOThisFrame && this.saoMaterial && this.saoTargetA && this.saoTargetB && this.postProcessingTarget.depthTexture) {
                    // Update camera uniforms for SAO
                    this.saoMaterial.uniforms.cameraNear.value = camera.near;
                    this.saoMaterial.uniforms.cameraFar.value = camera.far;

                    // Pass 2: SAO computation â†’ saoTargetA (half-res)
                    this.saoQuad.material = this.saoMaterial;
                    this.saoMaterial.uniforms.tDepth.value = this.postProcessingTarget.depthTexture;
                    renderer.setRenderTarget(this.saoTargetA);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.saoScene, this.postProcessingCamera);

                    // Update blur camera uniforms
                    this.saoBlurMaterial.uniforms.cameraNear.value = camera.near;
                    this.saoBlurMaterial.uniforms.cameraFar.value = camera.far;
                    this.saoBlurMaterial.uniforms.tDepth.value = this.postProcessingTarget.depthTexture;

                    // Pass 3: SAO blur H â†’ saoTargetB
                    this.saoQuad.material = this.saoBlurMaterial;
                    this.saoBlurMaterial.uniforms.tDiffuse.value = this.saoTargetA.texture;
                    this.saoBlurMaterial.uniforms.direction.value.set(1.0, 0.0);
                    renderer.setRenderTarget(this.saoTargetB);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.saoScene, this.postProcessingCamera);

                    // Pass 4: SAO blur V â†’ saoTargetA (ping-pong)
                    this.saoBlurMaterial.uniforms.tDiffuse.value = this.saoTargetB.texture;
                    this.saoBlurMaterial.uniforms.direction.value.set(0.0, 1.0);
                    renderer.setRenderTarget(this.saoTargetA);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.saoScene, this.postProcessingCamera);

                    // Feed blurred SAO to composite shader
                    this.postProcessingMaterial.uniforms.tSAO.value = this.saoTargetA.texture;
                }
                // No SAO fallback needed — composite shader is compiled without
                // the SAO sampling path when VRODOS_USE_SAO is undefined.

                // SSR pass (half resolution, after SAO, before bloom)
                var useSSR = this.isPostFXOptionEnabled('postFXSSREnabled') && this.ssrMaterial && this.ssrTargetA && this.postProcessingTarget.depthTexture;
                if (useSSR) {
                    this.ssrMaterial.uniforms.tDiffuse.value = this.postProcessingTarget.texture;
                    this.ssrMaterial.uniforms.tDepth.value = this.postProcessingTarget.depthTexture;
                    this.ssrMaterial.uniforms.cameraNear.value = camera.near;
                    this.ssrMaterial.uniforms.cameraFar.value = camera.far;
                    this.ssrMaterial.uniforms.projectionMatrix.value.copy(camera.projectionMatrix);
                    this.ssrMaterial.uniforms.inverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);
                    // Add temporal jitter to SSR to reduce banding (TAA will accumulate)
                    this.ssrMaterial.uniforms.jitter.value = useTAA ? (this._taaFrameIndex % 16) / 16.0 : 0.0;

                    this.ssrQuad.material = this.ssrMaterial;
                    renderer.setRenderTarget(this.ssrTargetA);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.ssrScene, this.postProcessingCamera);

                    this.postProcessingMaterial.uniforms.tSSR.value = this.ssrTargetA.texture;
                    this.postProcessingMaterial.uniforms.ssrStrength.value = this.getSSRStrengthValue();
                }
                // No SSR fallback needed — composite shader is compiled without
                // the SSR sampling path when VRODOS_USE_SSR is undefined.

                // Multi-pass bloom (only if bloom is enabled)
                var bloomValue = this.getBloomStrengthValue();
                if (bloomValue > 0 && this.bloomTargetA && this.bloomTargetB) {
                    // Bloom pass A: Bright-pass extraction â†’ bloomTargetA (half-res)
                    this.bloomQuad.material = this.bloomBrightPassMaterial;
                    this.bloomBrightPassMaterial.uniforms.tDiffuse.value = this.postProcessingTarget.texture;
                    renderer.setRenderTarget(this.bloomTargetA);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.bloomScene, this.postProcessingCamera);

                    // Bloom pass B: Horizontal Gaussian blur â†’ bloomTargetB
                    this.bloomQuad.material = this.bloomBlurMaterial;
                    this.bloomBlurMaterial.uniforms.tDiffuse.value = this.bloomTargetA.texture;
                    this.bloomBlurMaterial.uniforms.direction.value.set(1.0, 0.0);
                    renderer.setRenderTarget(this.bloomTargetB);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.bloomScene, this.postProcessingCamera);

                    // Bloom pass C: Vertical Gaussian blur â†’ bloomTargetA (ping-pong)
                    this.bloomBlurMaterial.uniforms.tDiffuse.value = this.bloomTargetB.texture;
                    this.bloomBlurMaterial.uniforms.direction.value.set(0.0, 1.0);
                    renderer.setRenderTarget(this.bloomTargetA);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.bloomScene, this.postProcessingCamera);

                    // Feed blurred bloom to composite shader
                    this.postProcessingMaterial.uniforms.tBloom.value = this.bloomTargetA.texture;
                }
                // No bloom fallback needed — composite shader is compiled without
                // the bloom sampling path when VRODOS_USE_BLOOM is undefined.

                renderer.setRenderTarget(previousTarget);

                // Pass 5: Final composite — only touch uniforms that exist on
                // the specialized material (features compile out disabled paths).
                var compUniforms = this.postProcessingMaterial.uniforms;
                var compFeatures = this._compositeFeatures;
                compUniforms.tDiffuse.value = this.postProcessingTarget.texture;
                if (compFeatures.bloom) {
                    compUniforms.bloomStrength.value = bloomValue;
                }
                if (compFeatures.vignette) {
                    compUniforms.vignetteStrength.value = 0.16;
                }
                if (compFeatures.colorGrading) {
                    compUniforms.saturation.value = this.getSaturationValue();
                    compUniforms.contrast.value = this.getContrastValue();
                    compUniforms.exposure.value = this.getExposureValue();
                } else {
                    compUniforms.exposure.value = 1.0;
                }

                var useFXAA = this.isPostFXOptionEnabled('postFXEdgeAAEnabled') && this.fxaaTarget && this.fxaaMaterial;

                // Determine where composite outputs to (depends on TAA and FXAA)
                if (useTAA) {
                    // Composite → fxaaTarget (used as temp composite buffer)
                    renderer.setRenderTarget(this.fxaaTarget);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.postProcessingScene, this.postProcessingCamera);

                    // TAA resolve: blend composite + clipped history → taaCurrentTarget
                    this.taaMaterial.uniforms.tCurrent.value = this.fxaaTarget.texture;
                    this.taaMaterial.uniforms.tHistory.value = this.taaHistoryTarget.texture;

                    this.taaQuad.material = this.taaMaterial;
                    renderer.setRenderTarget(this.taaCurrentTarget);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.taaScene, this.postProcessingCamera);

                    // Display TAA result → screen via a straight passthrough blit.
                    // We intentionally do NOT run FXAA here — FXAA's edge detector
                    // treats fine texture micro-contrast as aliasing and blurs it,
                    // which compounds TAA's own temporal softening into visible
                    // "JPG-like" detail loss. TAA already provides anti-aliasing.
                    this.taaBlitMaterial.uniforms.tDiffuse.value = this.taaCurrentTarget.texture;
                    this.fxaaQuad.material = this.taaBlitMaterial;
                    renderer.setRenderTarget(null);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.fxaaScene, this.postProcessingCamera);

                    // Swap ping-pong: taaCurrentTarget becomes next frame’s history
                    var tmpTarget = this.taaCurrentTarget;
                    this.taaCurrentTarget = this.taaHistoryTarget;
                    this.taaHistoryTarget = tmpTarget;
                } else if (useFXAA) {
                    // Composite → fxaaTarget → FXAA → screen
                    renderer.setRenderTarget(this.fxaaTarget);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.postProcessingScene, this.postProcessingCamera);

                    this.fxaaMaterial.uniforms.tDiffuse.value = this.fxaaTarget.texture;
                    this.fxaaQuad.material = this.fxaaMaterial;
                    renderer.setRenderTarget(null);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.fxaaScene, this.postProcessingCamera);
                } else {
                    // Composite → screen (no TAA, no FXAA)
                    renderer.setRenderTarget(null);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.postProcessingScene, this.postProcessingCamera);
                }
            } finally {
                this.postProcessingRendering = false;
            }
        }.bind(this);
    };
    H.disablePostProcessing = function () {
        if (!this.postProcessingActive || !this.el.renderer) {
            return;
        }

        if (this.postProcessingOriginalRender) {
            this.el.renderer.render = this.postProcessingOriginalRender;
        }

        if (this.postProcessingQuad) {
            if (this.postProcessingQuad.geometry) {
                this.postProcessingQuad.geometry.dispose();
            }
            if (this.postProcessingQuad.material) {
                this.postProcessingQuad.material.dispose();
            }
        }

        if (this.postProcessingTarget) {
            this.postProcessingTarget.dispose();
        }

        // Dispose bloom resources
        if (this.bloomTargetA) { this.bloomTargetA.dispose(); }
        if (this.bloomTargetB) { this.bloomTargetB.dispose(); }
        if (this.bloomBrightPassMaterial) { this.bloomBrightPassMaterial.dispose(); }
        if (this.bloomBlurMaterial) { this.bloomBlurMaterial.dispose(); }
        if (this.bloomQuad) {
            if (this.bloomQuad.geometry) { this.bloomQuad.geometry.dispose(); }
        }

        // Dispose FXAA resources
        if (this.fxaaTarget) { this.fxaaTarget.dispose(); }
        if (this.fxaaMaterial) { this.fxaaMaterial.dispose(); }
        if (this.fxaaQuad) {
            if (this.fxaaQuad.geometry) { this.fxaaQuad.geometry.dispose(); }
        }

        // Dispose SAO resources
        if (this.saoTargetA) { this.saoTargetA.dispose(); }
        if (this.saoTargetB) { this.saoTargetB.dispose(); }
        if (this.saoMaterial) { this.saoMaterial.dispose(); }
        if (this.saoBlurMaterial) { this.saoBlurMaterial.dispose(); }
        if (this.saoQuad) {
            if (this.saoQuad.geometry) { this.saoQuad.geometry.dispose(); }
        }

        // Dispose TAA resources
        if (this.taaTargetA) { this.taaTargetA.dispose(); }
        if (this.taaTargetB) { this.taaTargetB.dispose(); }
        if (this.taaMaterial) { this.taaMaterial.dispose(); }
        if (this.taaBlitMaterial) { this.taaBlitMaterial.dispose(); }
        if (this.taaQuad) {
            if (this.taaQuad.geometry) { this.taaQuad.geometry.dispose(); }
        }

        // Dispose SSR resources
        if (this.ssrTargetA) { this.ssrTargetA.dispose(); }
        if (this.ssrMaterial) { this.ssrMaterial.dispose(); }
        if (this.ssrQuad) {
            if (this.ssrQuad.geometry) { this.ssrQuad.geometry.dispose(); }
        }

        this.postProcessingTarget = null;
        this.postProcessingMaterial = null;
        this.postProcessingScene = null;
        this.postProcessingCamera = null;
        this.postProcessingQuad = null;
        this.postProcessingOriginalRender = null;
        this.postProcessingActive = false;
        this.postProcessingRendering = false;
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
        this.taaBlitMaterial = null;
        this.taaQuad = null;
        this.taaScene = null;
        this._taaFrameIndex = 0;
        this._taaJitterSequence = null;
        this.ssrTargetA = null;
        this.ssrMaterial = null;
        this.ssrQuad = null;
        this.ssrScene = null;
        if (this._blackSSRTexture) { this._blackSSRTexture.dispose(); }
        this._blackSSRTexture = null;
        if (this._blackBloomTexture) { this._blackBloomTexture.dispose(); }
        this._blackBloomTexture = null;
        if (this._whiteSAOTexture) { this._whiteSAOTexture.dispose(); }
        this._whiteSAOTexture = null;
    };
    H.syncPostProcessingState = function () {
        if (this.shouldUsePostProcessing()) {
            this.enablePostProcessing();
            this.updatePostProcessingSize();
            return;
        }

        this.disablePostProcessing();
    };
})();
