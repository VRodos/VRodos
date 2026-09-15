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
        init: function () {
            this.settings = null;
            this.fpsStats = null;
            this.fpsStatsRoot = null;
            this.fpsStatsPending = false;
            this.fpsStatsEpoch = 0;
            this.shadowFlushHandle = null;
            this.shadowFlushUsesAnimationFrame = false;
            this.navigationShadowSettleTimer = null;
            this.navigationShadowSettleEpoch = 0;
            this.queuedQualityRefreshId = null;
            this.pendingQualityRefreshWaitForSettle = false;
            this.removed = false;
        },
        bindSettings: function (settings) {
            if (this.settings === settings || this.removed) return;
            this.settings = settings;
            settings.renderProfileRuntime = this;
            ['fpsStats', 'fpsStatsRoot', 'fpsStatsPending'].forEach((field) => {
                Object.defineProperty(settings, field, {
                    configurable: true,
                    get: function () { return this.renderProfileRuntime ? this.renderProfileRuntime[field] : null; }
                });
            });
        },
        remove: function () {
            if (this.removed) return;
            this.removed = true;
            if (this.shadowFlushHandle !== null) {
                if (this.shadowFlushUsesAnimationFrame) cancelAnimationFrame(this.shadowFlushHandle);
                else clearTimeout(this.shadowFlushHandle);
            }
            this.shadowFlushHandle = null;
            if (this.queuedQualityRefreshId !== null) window.clearTimeout(this.queuedQualityRefreshId);
            this.queuedQualityRefreshId = null;
            this.pendingQualityRefreshWaitForSettle = false;
            this.clearNavigationShadowRefreshSettleTimer();
            this.disableFPSMeter();
            if (this.settings && this.settings.renderProfileRuntime === this) this.settings.renderProfileRuntime = null;
            this.settings = null;
        },
        queueShadowFlush: function () {
            if (this.removed || this.shadowFlushHandle !== null) return;
            const flush = () => {
                if (this.removed) return;
                this.shadowFlushHandle = null;
                this.settings.flushShadowUpdate();
            };
            this.shadowFlushUsesAnimationFrame = typeof requestAnimationFrame === 'function';
            this.shadowFlushHandle = this.shadowFlushUsesAnimationFrame
                ? requestAnimationFrame(flush)
                : setTimeout(flush, 16);
        },
        clearNavigationShadowRefreshSettleTimer: function () {
            this.navigationShadowSettleEpoch++;
            if (this.navigationShadowSettleTimer !== null) window.clearTimeout(this.navigationShadowSettleTimer);
            this.navigationShadowSettleTimer = null;
        },
        scheduleNavigationShadowRefreshSettle: function (callback, settleMs) {
            if (this.removed) return;
            this.clearNavigationShadowRefreshSettleTimer();
            const epoch = this.navigationShadowSettleEpoch;
            this.navigationShadowSettleTimer = window.setTimeout(() => {
                if (this.removed || epoch !== this.navigationShadowSettleEpoch) return;
                this.navigationShadowSettleTimer = null;
                callback();
            }, settleMs);
        },
        queueQualityRefresh: function (waitForModelSettle) {
            if (this.removed) return;
            this.pendingQualityRefreshWaitForSettle = this.pendingQualityRefreshWaitForSettle || waitForModelSettle !== false;
            if (this.queuedQualityRefreshId !== null) return;

            this.queuedQualityRefreshId = window.setTimeout(() => {
                if (this.removed) return;
                const shouldWaitForModelSettle = this.pendingQualityRefreshWaitForSettle;
                this.queuedQualityRefreshId = null;
                this.pendingQualityRefreshWaitForSettle = false;
                this.settings.applyQualityProfiles();
                if (!this.removed) this.settings.requestSceneProbeRefresh(shouldWaitForModelSettle);
            }, 50);
        },
        queueFPSMeterEnable: function () {
            if (this.removed || this.fpsStatsPending || !this.settings.isFPSMeterRequested()) {
                return;
            }

            const statsReady = window.VRODOS_STATS_READY;
            if (!statsReady || typeof statsReady.then !== 'function') {
                return;
            }

            this.fpsStatsPending = true;
            const epoch = this.fpsStatsEpoch;
            statsReady.then(() => {
                if (this.removed || epoch !== this.fpsStatsEpoch) return;
                this.fpsStatsPending = false;
                if (this.settings.isFPSMeterRequested()) {
                    this.enableFPSMeter();
                }
            }, () => {
                if (!this.removed && epoch === this.fpsStatsEpoch) this.fpsStatsPending = false;
            });
        },
        enableFPSMeter: function () {
            if (this.removed || this.fpsStats) {
                return;
            }

            if (!this.settings.shouldShowFPSMeter()) {
                this.queueFPSMeterEnable();
                return;
            }

            try {
                // Modern stats-gl initialization (minimal: true enables panel cycling on click)
                this.fpsStats = new Stats({ minimal: true });

                // Initialize with renderer for GPU tracking if available
                if (typeof this.fpsStats.init === 'function' && this.el.renderer) {
                    const renderer = this.el.renderer;
                    const originalRender = renderer.render;
                    const meter = this.fpsStats;
                    let initialized;
                    try { initialized = meter.init(renderer); }
                    finally {
                        // stats-gl wraps render but does not unpatch it on dispose. A retained
                        // composer reference must become a pass-through when the meter closes.
                        let statsRender = renderer.render;
                        const render = function () {
                            return (statsRender || originalRender).apply(this, arguments);
                        };
                        renderer.render = render;
                        this.releaseStatsRender = () => {
                            statsRender = null;
                            if (renderer.render === render) renderer.render = originalRender;
                        };
                    }
                    if (initialized && typeof initialized.catch === 'function') {
                        initialized.catch((error) => {
                            if (this.fpsStats !== meter) return;
                            console.warn('VRodos Error: stats-gl failed to initialize. Scene will continue.', error);
                            this.disableFPSMeter();
                        });
                    }
                }

                // stats-gl panels (0: FPS, 1: MS, 2: MB)
                if (typeof this.fpsStats.showPanel === 'function') {
                    this.fpsStats.showPanel(0);
                }

                this.fpsStatsRoot = this.fpsStats.dom || this.fpsStats.domElement || null;
                if (!this.fpsStatsRoot) {
                    this.disableFPSMeter();
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
                this.disableFPSMeter();
            }
        },
        disableFPSMeter: function () {
            this.fpsStatsEpoch++;
            this.fpsStatsPending = false;
            const meter = this.fpsStats;
            this.fpsStats = null;
            if (this.releaseStatsRender) this.releaseStatsRender();
            this.releaseStatsRender = null;
            if (this.fpsStatsRoot && this.fpsStatsRoot.parentNode) {
                this.fpsStatsRoot.parentNode.removeChild(this.fpsStatsRoot);
            }
            this.fpsStatsRoot = null;
            try { window.VRODOSMaster.RuntimeResources.dispose(meter); }
            catch (error) { console.warn('VRodos Error: stats-gl cleanup failed.', error); }
        },
        syncFPSMeterState: function () {
            if (this.removed) return;
            if (this.settings.shouldShowFPSMeter()) {
                this.enableFPSMeter();
                return;
            }

            if (this.settings.isFPSMeterRequested()) {
                this.queueFPSMeterEnable();
                return;
            }

            this.disableFPSMeter();
        },
        tick: function (time, timeDelta) {
            const settings = sceneSettings(this.el);
            if (this.removed || !settings) {
                return;
            }

            if (typeof settings.updateHardwarePerformanceDiagnostics === 'function') {
                settings.updateHardwarePerformanceDiagnostics(time, timeDelta);
            }

            if (typeof settings.publishRuntimeFeatureState === 'function') {
                settings.publishRuntimeFeatureState('render-profile-tick', { time, throttleMs: 1500 });
            }

            if (this.fpsStats && typeof this.fpsStats.update === 'function') {
                this.fpsStats.update();
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
            this.legacySkyCleanupDirty = true;
            this.handleLegacySkyObjectSet = this.invalidateLegacySkyCleanup.bind(this);
            this.handleLegacySkySettingsChange = (event) => {
                if (event.target === this.el &&
                    (event.detail.name === 'environment' || event.detail.name === 'scene-settings')) {
                    this.invalidateLegacySkyCleanup();
                }
            };
            // A-Frame object replacement events need capture for nested entities.
            this.el.addEventListener('object3dset', this.handleLegacySkyObjectSet, true);
            this.el.addEventListener('componentchanged', this.handleLegacySkySettingsChange, true);
            this.el.addEventListener('componentinitialized', this.handleLegacySkySettingsChange, true);
        },
        bindSettings: function (settings, removeVisuals, disposeAuxiliaryVisuals) {
            if (this.settings === settings) return;
            this.settings = settings;
            this.invalidateLegacySkyCleanup();
            this.removeVisuals = removeVisuals;
            this.disposeAuxiliaryVisuals = disposeAuxiliaryVisuals;
            settings.atmosphereRuntime = this;
            Object.defineProperty(settings, '_pmndrsAtmosphereState', {
                configurable: true,
                get: function () { return this.atmosphereRuntime.state; }
            });
        },
        invalidateLegacySkyCleanup: function () {
            if (!this.removed) this.legacySkyCleanupDirty = true;
        },
        cleanupLegacySky: function (cleanup) {
            if (this.removed || !this.legacySkyCleanupDirty) return;
            this.legacySkyCleanupDirty = false;
            try {
                cleanup(this.settings);
            } catch (err) {
                this.legacySkyCleanupDirty = true;
                throw err;
            }
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
            this.legacySkyCleanupDirty = false;
            this.el.removeEventListener('object3dset', this.handleLegacySkyObjectSet, true);
            this.el.removeEventListener('componentchanged', this.handleLegacySkySettingsChange, true);
            this.el.removeEventListener('componentinitialized', this.handleLegacySkySettingsChange, true);
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
        init: function () {
            VRODOSMaster.Reflections.initialize(this);
        },
        smoothEnvironmentIntensity: function (target, smoothingMs, source) {
            this._pmndrsTickTimeMs = this.settings._pmndrsTickTimeMs;
            const value = VRODOSMaster.LightSmoothing.value(this,
                `reflectionEnvironmentIntensity:${source}`, target, smoothingMs,
                this._vrodosReflectionEnvironmentIntensityScale);
            this._vrodosReflectionEnvironmentIntensityScale = value;
            return value;
        },
        recordIntensityUpdate: function (time) {
            this._vrodosReflectionEnvironmentLastUpdateMs = typeof time === 'number' ? time : null;
        },
        remove: function () {
            if (this.removed) return;
            this.removed = true;
            const environment = this.el.object3D && this.el.object3D.environment;
            const ownsEnvironment = [this._envMapRenderTarget, this._sceneProbePmremTarget, this._takramSkyPmremTarget]
                .some(target => target && target.texture === environment);
            if (ownsEnvironment) this.el.object3D.environment = null;
            try {
                this.clearHdrEnvironmentMap(false);
            } finally {
                try { this.disposeSceneProbe(false); }
                finally {
                    if (this.settings && this.settings.reflectionRuntime === this) this.settings.reflectionRuntime = null;
                    this.settings = null;
                    this._pmndrsRuntimeLightSmoothTimes = {};
                    this._pmndrsRuntimeLightSmoothValues = {};
                }
            }
        },
        tick: function (time) {
            const settings = sceneSettings(this.el);
            if (!settings || this.removed) {
                return;
            }

            VRODOSMaster.Reflections.bind(this, settings);
            const effectiveReflectionSource = settings.getEffectiveReflectionSource();
            if (typeof settings.updateReflectionEnvironmentIntensity === 'function') {
                settings.updateReflectionEnvironmentIntensity(time, effectiveReflectionSource);
            }
            if (effectiveReflectionSource === 'takram-sky') {
                if (typeof settings.updateTakramSkyEnvironment === 'function') {
                    this.updateTakramSkyEnvironment(time);
                }
                return;
            }

            if (effectiveReflectionSource !== 'scene-probe') {
                return;
            }

            const sceneProbeUpdateMode = settings.getSceneProbeUpdateMode();
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
}());
