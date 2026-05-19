/**
 * VRodos Scene Probe & Environment Map Helpers
 * Extracted from vrodos_scene_settings.component.js
 */

(function () {
    VRODOSMaster.SceneSettingsHelpers = VRODOSMaster.SceneSettingsHelpers || {};
    const H = VRODOSMaster.SceneSettingsHelpers;
    H.clearHdrEnvironmentMap = function (clearSceneEnvironment) {
        if (this._envMapRenderTarget) {
            this._envMapRenderTarget.dispose();
            this._envMapRenderTarget = null;
        }

        this._currentEnvMapPreset = null;

        if (clearSceneEnvironment && this.el && this.el.object3D) {
            this.el.object3D.environment = null;
        }
    };
    H.disposeSceneProbe = function (clearSceneEnvironment) {
        if (this._sceneProbePmremTarget) {
            this._sceneProbePmremTarget.dispose();
            this._sceneProbePmremTarget = null;
        }

        if (this._takramSkyPmremTarget) {
            this._takramSkyPmremTarget.dispose();
            this._takramSkyPmremTarget = null;
        }

        if (this._sceneProbePmremGenerator) {
            this._sceneProbePmremGenerator.dispose();
            this._sceneProbePmremGenerator = null;
        }

        if (this._sceneProbeCubeCamera && this._sceneProbeCubeCamera.parent) {
            this._sceneProbeCubeCamera.parent.remove(this._sceneProbeCubeCamera);
        }
        this._sceneProbeCubeCamera = null;

        if (this._sceneProbeCubeRenderTarget) {
            this._sceneProbeCubeRenderTarget.dispose();
            this._sceneProbeCubeRenderTarget = null;
        }

        this._sceneProbeNeedsUpdate = false;
        this._sceneProbeLastCaptureMs = 0;
        this._sceneProbeLastModelEventMs = 0;
        this._sceneProbeLastYaw = null;
        this._sceneProbeResolution = null;
        this.sceneProbeCapturing = false;

        if (clearSceneEnvironment && this.el && this.el.object3D) {
            this.el.object3D.environment = null;
        }
    };
    H.ensureSceneProbeResources = function () {
        const renderer = this.el.renderer;
        const sceneObj = this.el.object3D;
        if (!renderer || !sceneObj) {
            return false;
        }

        const resolution = typeof this.getSceneProbeResolution === 'function'
            ? this.getSceneProbeResolution()
            : 128;

        if (this._sceneProbeCubeRenderTarget && this._sceneProbeResolution !== resolution) {
            this._sceneProbeCubeRenderTarget.dispose();
            this._sceneProbeCubeRenderTarget = null;
            if (this._sceneProbeCubeCamera && this._sceneProbeCubeCamera.parent) {
                this._sceneProbeCubeCamera.parent.remove(this._sceneProbeCubeCamera);
            }
            this._sceneProbeCubeCamera = null;
            if (this._sceneProbePmremTarget) {
                this._sceneProbePmremTarget.dispose();
                this._sceneProbePmremTarget = null;
            }
            if (this._takramSkyPmremTarget) {
                this._takramSkyPmremTarget.dispose();
                this._takramSkyPmremTarget = null;
            }
            this._takramSkyEnvironmentNeedsUpdate = true;
        }

        if (!this._sceneProbeCubeRenderTarget) {
            this._sceneProbeCubeRenderTarget = new THREE.WebGLCubeRenderTarget(resolution, {
                generateMipmaps: true,
                minFilter: THREE.LinearMipmapLinearFilter
            });
            this._sceneProbeResolution = resolution;
        }

        if (!this._sceneProbeCubeCamera) {
            this._sceneProbeCubeCamera = new THREE.CubeCamera(0.1, 1000, this._sceneProbeCubeRenderTarget);
            sceneObj.add(this._sceneProbeCubeCamera);
        } else if (this._sceneProbeCubeCamera.parent !== sceneObj) {
            sceneObj.add(this._sceneProbeCubeCamera);
        }

        if (!this._sceneProbePmremGenerator) {
            this._sceneProbePmremGenerator = new THREE.PMREMGenerator(renderer);
            if (typeof this._sceneProbePmremGenerator.compileCubemapShader === 'function') {
                this._sceneProbePmremGenerator.compileCubemapShader();
            }
        }

        return true;
    };
    H.requestSceneProbeRefresh = function (waitForModelSettle) {
        const effectiveSource = typeof this.getEffectiveReflectionSource === 'function'
            ? this.getEffectiveReflectionSource()
            : (this.getReflectionSource ? this.getReflectionSource() : 'none');
        if (effectiveSource !== 'scene-probe') {
            return;
        }

        this._sceneProbeNeedsUpdate = true;
        if (waitForModelSettle !== false) {
            this._sceneProbeLastModelEventMs = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now();
        }
    };
    H.markSceneCollectionsDirty = function () {
        this.sceneCollectionsDirty = true;
    };
    H.getCachedSceneQuery = function (key, selector) {
        if (!this.sceneQueryCache || this.sceneCollectionsDirty || !this.sceneQueryCache[key]) {
            this.sceneQueryCache = this.sceneQueryCache || {};
            this.sceneQueryCache[key] = this.el.querySelectorAll(selector);
        }

        return this.sceneQueryCache[key];
    };
    H.queueQualityRefresh = function (waitForModelSettle) {
        this.pendingQualityRefreshWaitForSettle = this.pendingQualityRefreshWaitForSettle || waitForModelSettle !== false;
        if (this.queuedQualityRefreshId) {
            return;
        }

        this.queuedQualityRefreshId = window.setTimeout(() => {
            const shouldWaitForModelSettle = this.pendingQualityRefreshWaitForSettle;
            this.queuedQualityRefreshId = null;
            this.pendingQualityRefreshWaitForSettle = false;
            this.applyQualityProfiles();
            this.requestSceneProbeRefresh(shouldWaitForModelSettle);
        }, 50);
    };
    H.getSceneProbeAnchorObject = function () {
        const cameraRig = document.getElementById('cameraA');
        if (cameraRig && cameraRig.object3D) {
            return cameraRig.object3D;
        }

        if (this.el.camera && this.el.camera.el && this.el.camera.el.object3D) {
            return this.el.camera.el.object3D;
        }

        return this.el.camera || null;
    };
    H.getSceneProbeAnchorYaw = function (anchorObject) {
        if (!anchorObject) {
            return 0;
        }

        anchorObject.updateMatrixWorld(true);
        anchorObject.getWorldDirection(this._sceneProbeTempDirection);
        this._sceneProbeTempDirection.y = 0;

        if (this._sceneProbeTempDirection.lengthSq() < 0.000001) {
            return 0;
        }

        this._sceneProbeTempDirection.normalize();
        return Math.atan2(this._sceneProbeTempDirection.x, this._sceneProbeTempDirection.z);
    };
    H.getSceneProbeYawDeltaDegrees = function (a, b) {
        if (a === null || b === null) {
            return 180;
        }

        const delta = Math.atan2(Math.sin(a - b), Math.cos(a - b));
        return Math.abs(delta * 180 / Math.PI);
    };
    H.hideSceneProbeObject = function (object3D, hiddenObjects, hiddenLookup) {
        if (!object3D || !object3D.uuid || hiddenLookup[object3D.uuid]) {
            return;
        }

        hiddenLookup[object3D.uuid] = true;
        hiddenObjects.push({ object: object3D, visible: object3D.visible });
        object3D.visible = false;
    };
    H.collectSceneProbeExcludedObjects = function () {
        const self = this;
        const hiddenObjects = [];
        const hiddenLookup = {};

        const shouldHideRenderNode = function (node) {
            if (!node || !node.visible) {
                return false;
            }
            if (node.userData && node.userData.vrodosPmndrsAtmosphereSky) {
                return false;
            }
            if (node.userData && node.userData.vrodosPmndrsAtmosphereStars) {
                return true;
            }
            return false;
        };

        Array.prototype.forEach.call(this.getCachedSceneQuery('photorealLights', '[data-vrodos-photoreal-light="true"]'), (entityEl) => {
            if (entityEl && entityEl.object3D) {
                self.hideSceneProbeObject(entityEl.object3D, hiddenObjects, hiddenLookup);
            }
        });

        Array.prototype.forEach.call(this.getCachedSceneQuery('navMeshes', '.vrodos-navmesh'), (entityEl) => {
            if (entityEl && entityEl.object3D) {
                self.hideSceneProbeObject(entityEl.object3D, hiddenObjects, hiddenLookup);
            }
        });

        const cameraRig = document.getElementById('cameraA');
        if (cameraRig && cameraRig.object3D) {
            this.hideSceneProbeObject(cameraRig.object3D, hiddenObjects, hiddenLookup);
        }

        if (this.el && this.el.object3D && typeof this.el.object3D.traverse === 'function') {
            this.el.object3D.traverse((node) => {
                if (shouldHideRenderNode(node)) {
                    self.hideSceneProbeObject(node, hiddenObjects, hiddenLookup);
                }
            });
        }

        return hiddenObjects;
    };
    H.collectTakramSkyEnvironmentExcludedObjects = function () {
        const hiddenObjects = [];
        const hiddenLookup = {};
        const sceneObj = this.el && this.el.object3D ? this.el.object3D : null;
        if (!sceneObj || typeof sceneObj.traverse !== 'function') {
            return hiddenObjects;
        }

        sceneObj.traverse((node) => {
            if (!node || node === sceneObj || !node.visible) {
                return;
            }
            if (node.userData && node.userData.vrodosPmndrsAtmosphereSky) {
                return;
            }
            this.hideSceneProbeObject(node, hiddenObjects, hiddenLookup);
        });

        return hiddenObjects;
    };
    H.restoreSceneProbeExcludedObjects = function (hiddenObjects) {
        if (!hiddenObjects || !hiddenObjects.length) {
            return;
        }

        hiddenObjects.forEach((entry) => {
            if (entry && entry.object) {
                entry.object.visible = entry.visible;
            }
        });
    };
    H.captureSceneProbe = function (now) {
        const renderer = this.el.renderer;
        const sceneObj = this.el.object3D;
        const anchorObject = this.getSceneProbeAnchorObject();
        const atmosphereConfig = this.getPmndrsAtmosphereConfig ? this.getPmndrsAtmosphereConfig() : null;
        let showedTakramProbeSky = false;
        const shouldSyncTakramHorizon = Boolean(this &&
            this.data &&
            this.data.selChoice === "0" &&
            this.data.postFXEngine === 'pmndrs' &&
            atmosphereConfig &&
            atmosphereConfig.enabled &&
            window.VRODOS_TAKRAM_ATMOSPHERE);

        if (!renderer || !sceneObj || !anchorObject || !this.ensureSceneProbeResources()) {
            return false;
        }

        if (shouldSyncTakramHorizon) {
            if (typeof this.applyHorizonSkyPreset === 'function') {
                this.applyHorizonSkyPreset();
            }
            if (typeof this.hidePmndrsHorizonEnvironmentVisuals === 'function') {
                this.hidePmndrsHorizonEnvironmentVisuals();
            }
            if (typeof this.updatePmndrsHorizonSun === 'function') {
                this.updatePmndrsHorizonSun();
            }
            if (typeof this.showPmndrsAtmosphereSkyForSceneProbe === 'function') {
                showedTakramProbeSky = Boolean(this.showPmndrsAtmosphereSkyForSceneProbe(atmosphereConfig));
            }
            if (typeof this.logPmndrsHorizonDiagnostic === 'function') {
                this.logPmndrsHorizonDiagnostic('scene-probe-capture', atmosphereConfig);
            }
        }

        anchorObject.updateMatrixWorld(true);
        anchorObject.getWorldPosition(this._sceneProbeCurrentPosition);

        this._sceneProbeCubeCamera.position.copy(this._sceneProbeCurrentPosition);
        this._sceneProbeCubeCamera.updateMatrixWorld(true);

        const previousEnvironment = sceneObj.environment;
        const hiddenObjects = this.collectSceneProbeExcludedObjects();

        sceneObj.environment = null;
        this.sceneProbeCapturing = true;

        try {
            this._sceneProbeCubeCamera.update(renderer, sceneObj);
        } catch (error) {
            console.warn('[VRodos] Scene reflection probe capture failed.', error);
            sceneObj.environment = previousEnvironment;
            this.restoreSceneProbeExcludedObjects(hiddenObjects);
            if (showedTakramProbeSky && typeof this.hidePmndrsAtmosphereSky === 'function') {
                this.hidePmndrsAtmosphereSky();
            }
            this.sceneProbeCapturing = false;
            return false;
        }

        this.restoreSceneProbeExcludedObjects(hiddenObjects);
        this.sceneProbeCapturing = false;
        sceneObj.environment = previousEnvironment;
        if (showedTakramProbeSky && typeof this.hidePmndrsAtmosphereSky === 'function') {
            this.hidePmndrsAtmosphereSky();
        }

        const probeTarget = this._sceneProbePmremGenerator.fromCubemap(this._sceneProbeCubeRenderTarget.texture);
        if (!probeTarget || !probeTarget.texture) {
            return false;
        }

        if (this._sceneProbePmremTarget) {
            this._sceneProbePmremTarget.dispose();
        }

        this._sceneProbePmremTarget = probeTarget;
        sceneObj.environment = probeTarget.texture;
        this._sceneProbeLastCaptureMs = now;
        this._sceneProbeLastYaw = this.getSceneProbeAnchorYaw(anchorObject);
        this._sceneProbeLastPosition.copy(this._sceneProbeCurrentPosition);
        this._sceneProbeNeedsUpdate = false;
        this._currentReflectionSource = 'scene-probe';
        this.applyMaterialProfiles();
        if (shouldSyncTakramHorizon) {
            console.info('[VRodos] Scene reflection probe captured from synced PMNDRS Horizon Takram sky.');
        }
        return true;
    };
    H.getTakramSkyEnvironmentSignature = function (atmosphereConfig) {
        if (!atmosphereConfig) {
            return '';
        }

        const sunElevation = typeof atmosphereConfig.sunElevationDeg === 'number'
            ? atmosphereConfig.sunElevationDeg
            : 0;
        const sunAzimuth = typeof atmosphereConfig.sunAzimuthDeg === 'number'
            ? atmosphereConfig.sunAzimuthDeg
            : 0;
        const moonDirection = atmosphereConfig.localMoonDirection || null;
        const moonY = moonDirection && typeof moonDirection.y === 'number' ? moonDirection.y : -1;
        const starsIntensity = typeof this.getPmndrsStarsIntensity === 'function'
            ? this.getPmndrsStarsIntensity(atmosphereConfig)
            : 0;

        return [
            Math.round(sunElevation * 2) / 2,
            Math.round(sunAzimuth * 0.25) / 0.25,
            Math.round(moonY * 20) / 20,
            Math.round(starsIntensity * 10) / 10
        ].join('|');
    };
    H.applyTakramSkyEnvironmentIntensity = function (atmosphereConfig, now) {
        const sceneObj = this.el && this.el.object3D ? this.el.object3D : null;
        if (!sceneObj || !sceneObj.environment) {
            return;
        }

        const targetScale = typeof this.getPmndrsReflectionIntensityScale === 'function'
            ? this.getPmndrsReflectionIntensityScale(atmosphereConfig, 'takram-sky')
            : 1;
        const timeMs = typeof now === 'number'
            ? now
            : (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());
        const previousTimeMs = typeof this._takramSkyEnvironmentLastSmoothMs === 'number'
            ? this._takramSkyEnvironmentLastSmoothMs
            : timeMs;
        const deltaMs = Math.max(0, Math.min(250, timeMs - previousTimeMs));
        const previousScale = typeof this._takramSkyEnvironmentSmoothedScale === 'number'
            ? this._takramSkyEnvironmentSmoothedScale
            : targetScale;
        const smoothingMs = atmosphereConfig && atmosphereConfig.dayNightCycleEnabled ? 420 : 900;
        const alpha = deltaMs > 0 ? 1 - Math.exp(-deltaMs / smoothingMs) : 1;
        const reflectionScale = previousScale + ((targetScale - previousScale) * alpha);

        this._takramSkyEnvironmentLastSmoothMs = timeMs;
        this._takramSkyEnvironmentSmoothedScale = reflectionScale;
        this._takramSkyEnvironmentLastProfileScale = targetScale;

        if (typeof sceneObj.environmentIntensity !== 'undefined') {
            sceneObj.environmentIntensity = reflectionScale;
        }
    };
    H.requestTakramSkyEnvironmentRefresh = function () {
        this._takramSkyEnvironmentNeedsUpdate = true;
    };
    function getTakramSkyEnvironmentTimeMs(now) {
        return typeof now === 'number'
            ? now
            : (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());
    }
    function scheduleTakramSkyEnvironmentRetry(self, now) {
        self._takramSkyEnvironmentNeedsUpdate = true;
        self._takramSkyEnvironmentNextRetryMs = getTakramSkyEnvironmentTimeMs(now) + 500;
    }
    function isTakramSkyEnvironmentReady(self) {
        const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
        if (!state || state.failed || !state.ready || !state.skyMesh || !state.skyMaterial) {
            return false;
        }

        return Boolean(state.textures &&
            state.textures.irradianceTexture &&
            state.textures.scatteringTexture &&
            state.textures.transmittanceTexture);
    }
    H.captureTakramSkyEnvironment = function (now, atmosphereConfig) {
        const renderer = this.el.renderer;
        const sceneObj = this.el.object3D;
        const anchorObject = this.getSceneProbeAnchorObject();
        if (!renderer || !sceneObj || !anchorObject || !this.ensureSceneProbeResources()) {
            return false;
        }
        if (!atmosphereConfig || !atmosphereConfig.enabled || !window.VRODOS_TAKRAM_ATMOSPHERE) {
            return false;
        }
        if (typeof this.showPmndrsAtmosphereSkyForSceneProbe !== 'function') {
            return false;
        }
        const showedTakramSky = Boolean(this.showPmndrsAtmosphereSkyForSceneProbe(atmosphereConfig));
        if (!isTakramSkyEnvironmentReady(this)) {
            if (showedTakramSky && typeof this.hidePmndrsAtmosphereSky === 'function') {
                this.hidePmndrsAtmosphereSky();
            }
            scheduleTakramSkyEnvironmentRetry(this, now);
            return false;
        }

        anchorObject.updateMatrixWorld(true);
        anchorObject.getWorldPosition(this._sceneProbeCurrentPosition);
        this._sceneProbeCubeCamera.position.copy(this._sceneProbeCurrentPosition);
        this._sceneProbeCubeCamera.updateMatrixWorld(true);

        const previousEnvironment = sceneObj.environment;
        const hiddenObjects = this.collectTakramSkyEnvironmentExcludedObjects();
        sceneObj.environment = null;
        this.sceneProbeCapturing = true;

        try {
            this._sceneProbeCubeCamera.update(renderer, sceneObj);
        } catch (error) {
            console.warn('[VRodos] Takram sky environment capture failed.', error);
            sceneObj.environment = previousEnvironment;
            this.restoreSceneProbeExcludedObjects(hiddenObjects);
            if (showedTakramSky && typeof this.hidePmndrsAtmosphereSky === 'function') {
                this.hidePmndrsAtmosphereSky();
            }
            this.sceneProbeCapturing = false;
            return false;
        }

        this.restoreSceneProbeExcludedObjects(hiddenObjects);
        this.sceneProbeCapturing = false;
        sceneObj.environment = previousEnvironment;
        if (showedTakramSky && typeof this.hidePmndrsAtmosphereSky === 'function') {
            this.hidePmndrsAtmosphereSky();
        }

        const probeTarget = this._sceneProbePmremGenerator.fromCubemap(this._sceneProbeCubeRenderTarget.texture);
        if (!probeTarget || !probeTarget.texture) {
            return false;
        }

        if (this._takramSkyPmremTarget) {
            this._takramSkyPmremTarget.dispose();
        }

        this._takramSkyPmremTarget = probeTarget;
        sceneObj.environment = probeTarget.texture;
        this._sceneProbeLastCaptureMs = now;
        this._takramSkyEnvironmentLastCaptureMs = now;
        this._takramSkyEnvironmentNeedsUpdate = false;
        this._takramSkyEnvironmentNextRetryMs = 0;
        this._takramSkyEnvironmentSignature = this.getTakramSkyEnvironmentSignature(atmosphereConfig);
        this._currentReflectionSource = 'takram-sky';
        this.applyMaterialProfiles();
        this.applyTakramSkyEnvironmentIntensity(atmosphereConfig, now);
        return true;
    };
    H.updateTakramSkyEnvironment = function (now) {
        const atmosphereConfig = typeof this.getPmndrsAtmosphereConfig === 'function'
            ? this.getPmndrsAtmosphereConfig()
            : null;
        if (!atmosphereConfig || !atmosphereConfig.enabled) {
            return;
        }

        const sceneObj = this.el && this.el.object3D ? this.el.object3D : null;
        const skyTarget = this._takramSkyPmremTarget;
        const hasSkyTarget = Boolean(skyTarget && skyTarget.texture);
        if (sceneObj && hasSkyTarget && sceneObj.environment !== skyTarget.texture) {
            sceneObj.environment = skyTarget.texture;
            this._currentReflectionSource = 'takram-sky';
            this.applyMaterialProfiles();
        }

        const needsCapture = this._takramSkyEnvironmentNeedsUpdate || !hasSkyTarget;
        const timeMs = getTakramSkyEnvironmentTimeMs(now);

        this.applyTakramSkyEnvironmentIntensity(atmosphereConfig, now);
        if (needsCapture) {
            if (this._takramSkyEnvironmentNextRetryMs && timeMs < this._takramSkyEnvironmentNextRetryMs) {
                return;
            }
            this.captureTakramSkyEnvironment(now, atmosphereConfig);
        }
    };
    H.applyEnvMapProfile = function () {
        const preset = this.data.envMapPreset || 'none';
        const sceneObj = this.el.object3D;
        const effectiveSource = this.getEffectiveReflectionSource();

        if (effectiveSource === 'takram-sky') {
            if (!this.ensureSceneProbeResources()) {
                sceneObj.environment = null;
                this._currentReflectionSource = 'none';
                this.applyMaterialProfiles();
                return;
            }

            if (this._takramSkyPmremTarget && this._takramSkyPmremTarget.texture) {
                this.clearHdrEnvironmentMap(this._currentReflectionSource !== 'takram-sky');
                sceneObj.environment = this._takramSkyPmremTarget.texture;
                this._currentReflectionSource = 'takram-sky';
                this.applyMaterialProfiles();
            }
            this.requestTakramSkyEnvironmentRefresh();
            return;
        }

        if (effectiveSource === 'scene-probe') {
            if (this._takramSkyPmremTarget) {
                this._takramSkyPmremTarget.dispose();
                this._takramSkyPmremTarget = null;
            }
            this.clearHdrEnvironmentMap(this._currentReflectionSource !== 'scene-probe');
            if (!this.ensureSceneProbeResources()) {
                sceneObj.environment = null;
                this._currentReflectionSource = 'none';
                this.applyMaterialProfiles();
                return;
            }

            sceneObj.environment = this._sceneProbePmremTarget ? this._sceneProbePmremTarget.texture : null;
            this._currentReflectionSource = 'scene-probe';
            this.requestSceneProbeRefresh(true);
            return;
        }

        this.disposeSceneProbe(true);

        if (effectiveSource === 'none' || preset === 'none') {
            this.clearHdrEnvironmentMap(true);
            sceneObj.environment = null;
            this._currentReflectionSource = 'none';
            this._currentEnvMapPreset = 'none';
            this.applyMaterialProfiles();
            return;
        }

        if (this._currentReflectionSource === 'hdr' && this._currentEnvMapPreset === preset && this._envMapRenderTarget) {
            if (sceneObj.environment !== this._envMapRenderTarget.texture) {
                sceneObj.environment = this._envMapRenderTarget.texture;
                this.applyMaterialProfiles();
            }
            return;
        }

        this.clearHdrEnvironmentMap(false);

        const HDRLoaderClass = THREE.HDRLoader || THREE.RGBELoader;
        if (typeof HDRLoaderClass === 'undefined') {
            console.warn('[VRodos] HDRLoader not available; HDR env map skipped.');
            return;
        }

        const hdrFile = this.getEnvMapPath();
        if (!hdrFile) { return; }

        const baseUrl = window.VRODOS_ASSET_IMAGE_URL || '../../assets/images/';
        const hdrUrl = `${baseUrl  }hdr/${  hdrFile}`;
        const renderer = this.el.renderer;
        const self = this;

        const loader = new HDRLoaderClass();
        loader.load(hdrUrl, (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;

            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            const envMapRenderTarget = pmremGenerator.fromEquirectangular(texture);
            const envMap = envMapRenderTarget.texture;

            sceneObj.environment = envMap;
            if (self._envMapRenderTarget) {
                self._envMapRenderTarget.dispose();
            }
            self._envMapRenderTarget = envMapRenderTarget;
            texture.dispose();
            pmremGenerator.dispose();

            self._currentReflectionSource = 'hdr';
            self._currentEnvMapPreset = preset;
            // Re-apply material profiles so envMapIntensity takes effect with the new env map
            self.applyMaterialProfiles();

            console.log('[VRodos] HDR environment map loaded:', hdrFile);
        }, undefined, (err) => {
            console.warn('[VRodos] Failed to load HDR env map:', hdrUrl, err);
        });
    };
})();
