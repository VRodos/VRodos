/**
 * Focused runtime pipeline components that delegate through the scene-settings
 * compatibility contract.
 */
(function () {
    function sceneSettings(el) {
        return el && el.components ? el.components['scene-settings'] : null;
    }

    AFRAME.registerSystem('vrodos-runtime-pipeline', {
        getSceneSettings: function (el) {
            return sceneSettings(el || this.sceneEl);
        }
    });

    AFRAME.registerComponent('vrodos-render-profile', {
        tick: function (time, timeDelta) {
            const settings = sceneSettings(this.el);
            if (!settings) {
                return;
            }

            if (typeof settings.updateHardwarePerformanceDiagnostics === 'function') {
                settings.updateHardwarePerformanceDiagnostics(time, timeDelta);
            }

            if (typeof settings.publishRuntimeFeatureState === 'function') {
                settings.publishRuntimeFeatureState('render-profile-tick', { time, throttleMs: 1500 });
            }

            if (settings.fpsStats && typeof settings.fpsStats.update === 'function') {
                settings.fpsStats.update();
            }

            settings.updateAdaptiveShadowFit(false);
        }
    });

    AFRAME.registerComponent('vrodos-postfx-router', {
        sync: function () {
            const settings = sceneSettings(this.el);
            if (!settings) {
                return;
            }

            settings.warnImmersiveXrPostProcessingFallback();

            if (settings.data.postFXEngine === 'pmndrs') {
                if (settings.postProcessingActive) {
                    settings.disablePostProcessing();
                }
                if (settings.shouldUsePostProcessing()) {
                    settings.enablePmndrsPostProcessing();
                    settings.updatePmndrsPostProcessingSize();
                } else {
                    settings.disablePmndrsPostProcessing();
                }
                if (typeof settings.publishRuntimeFeatureState === 'function') {
                    settings.publishRuntimeFeatureState('postfx-router');
                }
                return;
            }

            if (settings.pmndrsActive) {
                settings.disablePmndrsPostProcessing();
            }
            if (settings.shouldUsePostProcessing()) {
                settings.enablePostProcessing();
                settings.updatePostProcessingSize();
            } else {
                settings.disablePostProcessing();
            }
            if (typeof settings.publishRuntimeFeatureState === 'function') {
                settings.publishRuntimeFeatureState('postfx-router');
            }
        }
    });

    AFRAME.registerComponent('vrodos-atmosphere', {
        init: function () {
            this.state = null;
            this.settings = null;
            this.visualRefreshes = new Set();
            this.visualRefreshEpoch = 0;
            this.removed = false;
        },
        bindSettings: function (settings, removeVisuals, disposeAuxiliaryVisuals) {
            if (this.settings === settings) return;
            this.settings = settings;
            this.removeVisuals = removeVisuals;
            this.disposeAuxiliaryVisuals = disposeAuxiliaryVisuals;
            settings.atmosphereRuntime = this;
            Object.defineProperty(settings, '_pmndrsAtmosphereState', {
                configurable: true,
                get: function () { return this.atmosphereRuntime.state; }
            });
        },
        cancelVisualRefreshes: function () {
            this.visualRefreshEpoch++;
            this.visualRefreshes.forEach(({ kind, handle }) => {
                if (kind === 'frame') cancelAnimationFrame(handle);
                else clearTimeout(handle);
            });
            this.visualRefreshes.clear();
        },
        scheduleVisualRefresh: function (callback) {
            if (this.removed) return;
            callback();
            if (this.removed) return;
            const epoch = this.visualRefreshEpoch;
            const schedule = (kind, delay) => {
                const pending = { kind, handle: null };
                const run = () => {
                    this.visualRefreshes.delete(pending);
                    if (!this.removed && this.visualRefreshEpoch === epoch) callback();
                };
                pending.handle = kind === 'frame' ? requestAnimationFrame(run) : setTimeout(run, delay);
                this.visualRefreshes.add(pending);
            };
            if (typeof requestAnimationFrame === 'function') schedule('frame');
            schedule('timeout', 50);
            schedule('timeout', 200);
        },
        ensureResources: function (profile) {
            if (this.removed) return null;
            const settings = this.settings;
            const renderer = settings && settings.el ? settings.el.renderer : null;
            const vta = window.VRODOS_TAKRAM_ATMOSPHERE;
            if (!renderer || !settings.el.object3D || !vta) return null;
            if (this.state && this.state.profileSignature === profile.signature) return this.state;
            this.disposeResources();
            const state = {
                generator: null,
                textures: null,
                promise: null,
                skyMesh: null,
                skyMaterial: null,
                skyGeometry: null,
                starsMesh: null,
                starsMaterial: null,
                starsGeometry: null,
                starsFallbackMesh: null,
                starsFallbackMaterial: null,
                starsFallbackGeometry: null,
                starsData: null,
                starsDataUrl: '',
                starsDataPromise: null,
                starsFailed: false,
                starsIntensity: 0,
                ready: false,
                failed: false,
                profileSignature: profile.signature,
                precision: profile.useFloat ? 'float' : 'half',
                higherOrderScattering: profile.higherOrderScattering,
                combinedScattering: profile.combinedScattering,
                vrTakramSkyDirectCalibrated: false,
                vrTakramSkyDirectExposure: null
            };
            this.state = state;
            const generate = (type) => {
                state.generator = new vta.PrecomputedTexturesGenerator(renderer, {
                    type,
                    combinedScattering: profile.combinedScattering,
                    higherOrderScattering: profile.higherOrderScattering
                });
                state.textures = state.generator.textures;
                state.promise = state.generator.update().then(() => {
                    if (this.state !== state || this.removed) return null;
                    state.ready = true;
                    return state.textures;
                }).catch((err) => {
                    if (this.state !== state || this.removed) return;
                    state.failed = true;
                    console.warn('[VRodos] Takram atmosphere precompute failed, falling back to PMNDRS gradient horizon:', err);
                });
            };
            try {
                generate(profile.type);
            } catch (err) {
                this.disposeGenerator(state);
                if (profile.useFloat && typeof THREE.HalfFloatType !== 'undefined') {
                    try {
                        generate(THREE.HalfFloatType);
                        state.precision = 'half-fallback';
                        state.profileSignature = `${profile.quality}:half:${profile.higherOrderScattering ? 'higher' : 'basic'}:${profile.combinedScattering ? 'combined' : 'split'}`;
                    } catch (fallbackErr) {
                        this.disposeGenerator(state);
                        state.failed = true;
                        console.warn('[VRodos] Takram atmosphere init failed, falling back to PMNDRS gradient horizon:', fallbackErr);
                    }
                } else {
                    state.failed = true;
                    console.warn('[VRodos] Takram atmosphere init failed, falling back to PMNDRS gradient horizon:', err);
                }
            }
            return state;
        },
        disposeGenerator: function (state) {
            const generator = state.generator;
            state.generator = null;
            if (generator && typeof generator.dispose === 'function') {
                try { generator.dispose(); }
                catch (err) { console.warn('[VRodos] Takram atmosphere dispose failed:', err); }
            }
        },
        disposeResources: function () {
            this.cancelVisualRefreshes();
            const state = this.state;
            if (!state) return;
            try { this.removeVisuals(this.settings); }
            finally {
                this.state = null;
                this.disposeGenerator(state);
            }
        },
        remove: function () {
            this.removed = true;
            try {
                this.disposeResources();
            } finally {
                try {
                    if (this.settings) this.disposeAuxiliaryVisuals(this.settings);
                } finally {
                    this.settings = null;
                    this.removeVisuals = null;
                    this.disposeAuxiliaryVisuals = null;
                }
            }
        },

        tick: function (time) {
            const settings = sceneSettings(this.el);
            if (!settings) {
                return;
            }

            settings._pmndrsTickTimeMs = typeof time === 'number' ? time : null;
            settings.updatePmndrsHorizonSun();
            if (typeof settings.updatePmndrsDayNightCycleFrame === 'function') {
                settings.updatePmndrsDayNightCycleFrame(time);
            }
        }
    });

    AFRAME.registerComponent('vrodos-reflections', {
        tick: function (time) {
            const settings = sceneSettings(this.el);
            if (!settings) {
                return;
            }

            const effectiveReflectionSource = settings.getEffectiveReflectionSource();
            if (typeof settings.updateReflectionEnvironmentIntensity === 'function') {
                settings.updateReflectionEnvironmentIntensity(time, effectiveReflectionSource);
            }
            if (effectiveReflectionSource === 'takram-sky') {
                if (typeof settings.updateTakramSkyEnvironment === 'function') {
                    settings.updateTakramSkyEnvironment(time);
                }
                return;
            }

            if (effectiveReflectionSource !== 'scene-probe') {
                return;
            }

            const sceneProbeUpdateMode = settings.getSceneProbeUpdateMode();
            if (sceneProbeUpdateMode === 'static' && !settings._sceneProbeNeedsUpdate && settings._sceneProbeLastYaw !== null) {
                return;
            }

            if (sceneProbeUpdateMode === 'slow-dynamic' && !settings._sceneProbeNeedsUpdate && settings._sceneProbeLastYaw !== null) {
                const anchorObject = settings.getSceneProbeAnchorObject();
                if (anchorObject) {
                    anchorObject.updateMatrixWorld(true);
                    anchorObject.getWorldPosition(settings._sceneProbeCurrentPosition);
                    if (settings._sceneProbeCurrentPosition.distanceToSquared(settings._sceneProbeLastPosition) > (6 * 6) ||
                        settings.getSceneProbeYawDeltaDegrees(settings.getSceneProbeAnchorYaw(anchorObject), settings._sceneProbeLastYaw) > 45) {
                        settings._sceneProbeNeedsUpdate = true;
                    }
                }
            }

            if (!settings._sceneProbeNeedsUpdate) {
                return;
            }

            const captureCooldownMs = sceneProbeUpdateMode === 'slow-dynamic' ? 5000 : 500;
            if ((time - settings._sceneProbeLastCaptureMs) < captureCooldownMs) {
                return;
            }

            const modelSettleMs = sceneProbeUpdateMode === 'slow-dynamic' ? 750 : 350;
            if (settings._sceneProbeLastModelEventMs && (time - settings._sceneProbeLastModelEventMs) < modelSettleMs) {
                return;
            }

            settings.captureSceneProbe(time);
        }
    });
}());
