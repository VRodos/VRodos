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
        tick: function (time) {
            const settings = sceneSettings(this.el);
            if (!settings) {
                return;
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
