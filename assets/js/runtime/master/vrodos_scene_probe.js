/**
 * VRodos Scene Probe & Environment Map Helpers
 * Extracted from vrodos_scene_settings.component.js
 */

(function () {
    VRODOSMaster.SceneSettingsHelpers = VRODOSMaster.SceneSettingsHelpers || {};
    const H = VRODOSMaster.SceneSettingsHelpers;
    const R = {};
    const disposeRuntimeResource = VRODOSMaster.RuntimeResources && VRODOSMaster.RuntimeResources.dispose
        ? VRODOSMaster.RuntimeResources.dispose
        : function (resource) {
            if (resource && typeof resource.dispose === 'function') {
                resource.dispose();
            }
        };
    const SCENE_SELECTION_SETTLE_MS = 120;
    R.clearHdrEnvironmentMap = function (clearSceneEnvironment) {
        disposeRuntimeResource(this._envMapRenderTarget);
        this._envMapRenderTarget = null;

        this._currentEnvMapPreset = null;
        this._pendingHdrEnvMapPreset = null;
        this._pendingHdrEnvMapUrl = '';
        this._hdrEnvMapLoadId = (this._hdrEnvMapLoadId || 0) + 1;
        this._hdrEnvMapLoading = false;
        this._hdrEnvMapFailed = false;
        this._hdrEnvMapError = '';

        if (clearSceneEnvironment && this.el && this.el.object3D) {
            this.el.object3D.environment = null;
        }
    };
    R.disposeSceneProbe = function (clearSceneEnvironment) {
        disposeRuntimeResource(this._sceneProbePmremTarget);
        this._sceneProbePmremTarget = null;

        disposeRuntimeResource(this._takramSkyPmremTarget);
        this._takramSkyPmremTarget = null;

        disposeRuntimeResource(this._sceneProbePmremGenerator);
        this._sceneProbePmremGenerator = null;

        if (this._sceneProbeCubeCamera && this._sceneProbeCubeCamera.parent) {
            this._sceneProbeCubeCamera.parent.remove(this._sceneProbeCubeCamera);
        }
        this._sceneProbeCubeCamera = null;

        disposeRuntimeResource(this._sceneProbeCubeRenderTarget);
        this._sceneProbeCubeRenderTarget = null;

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
    R.ensureSceneProbeResources = function () {
        const renderer = this.el.renderer;
        const sceneObj = this.el.object3D;
        if (!renderer || !sceneObj) {
            return false;
        }

        const resolution = typeof this.settings.getSceneProbeResolution === 'function'
            ? this.settings.getSceneProbeResolution()
            : 128;

        if (this._sceneProbeCubeRenderTarget && this._sceneProbeResolution !== resolution) {
            disposeRuntimeResource(this._sceneProbeCubeRenderTarget);
            this._sceneProbeCubeRenderTarget = null;
            if (this._sceneProbeCubeCamera && this._sceneProbeCubeCamera.parent) {
                this._sceneProbeCubeCamera.parent.remove(this._sceneProbeCubeCamera);
            }
            this._sceneProbeCubeCamera = null;
            disposeRuntimeResource(this._sceneProbePmremTarget);
            this._sceneProbePmremTarget = null;
            disposeRuntimeResource(this._takramSkyPmremTarget);
            this._takramSkyPmremTarget = null;
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
    R.requestSceneProbeRefresh = function (waitForModelSettle) {
        const effectiveSource = typeof this.settings.getEffectiveReflectionSource === 'function'
            ? this.settings.getEffectiveReflectionSource()
            : (this.settings.getReflectionSource ? this.settings.getReflectionSource() : 'none');
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
        this.sceneQueryCache = {};
        this._pmndrsSceneSelectionsDirty = true;
        this._pmndrsSceneSelectionRefreshAfterMs = (
            (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now()
        ) + SCENE_SELECTION_SETTLE_MS;
    };
    H.getCachedSceneQuery = function (key, selector) {
        if (!this.sceneQueryCache || !this.sceneQueryCache[key]) {
            this.sceneQueryCache = this.sceneQueryCache || {};
            this.sceneQueryCache[key] = this.el.querySelectorAll(selector);
        }

        return this.sceneQueryCache[key];
    };
    R.getSceneProbeAnchorObject = function () {
        const cameraRig = document.getElementById('cameraA');
        if (cameraRig && cameraRig.object3D) {
            return cameraRig.object3D;
        }

        if (this.el.camera && this.el.camera.el && this.el.camera.el.object3D) {
            return this.el.camera.el.object3D;
        }

        return this.el.camera || null;
    };
    R.getSceneProbeAnchorYaw = function (anchorObject) {
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
    R.getSceneProbeYawDeltaDegrees = function (a, b) {
        if (a === null || b === null) {
            return 180;
        }

        const delta = Math.atan2(Math.sin(a - b), Math.cos(a - b));
        return Math.abs(delta * 180 / Math.PI);
    };
    R.hideSceneProbeObject = function (object3D, hiddenObjects, hiddenLookup) {
        if (!object3D || !object3D.uuid || hiddenLookup[object3D.uuid]) {
            return;
        }

        hiddenLookup[object3D.uuid] = true;
        hiddenObjects.push({ object: object3D, visible: object3D.visible });
        object3D.visible = false;
    };
    R.collectSceneProbeExcludedObjects = function () {
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

        Array.prototype.forEach.call(this.settings.getCachedSceneQuery('photorealLights', '[data-vrodos-photoreal-light="true"]'), (entityEl) => {
            if (entityEl && entityEl.object3D) {
                self.hideSceneProbeObject(entityEl.object3D, hiddenObjects, hiddenLookup);
            }
        });

        Array.prototype.forEach.call(this.settings.getCachedSceneQuery('navMeshes', '.vrodos-navmesh'), (entityEl) => {
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
    R.collectTakramSkyEnvironmentExcludedObjects = function () {
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
    R.restoreSceneProbeExcludedObjects = function (hiddenObjects) {
        if (!hiddenObjects || !hiddenObjects.length) {
            return;
        }

        hiddenObjects.forEach((entry) => {
            if (entry && entry.object) {
                entry.object.visible = entry.visible;
            }
        });
    };
    R.captureSceneProbe = function (now) {
        const renderer = this.el.renderer;
        const sceneObj = this.el.object3D;
        const anchorObject = this.getSceneProbeAnchorObject();
        const atmosphereConfig = this.settings.getPmndrsAtmosphereConfig ? this.settings.getPmndrsAtmosphereConfig() : null;
        let showedTakramProbeSky = false;
        const shouldSyncTakramHorizon = Boolean(this &&
            this.settings.data &&
            this.settings.data.selChoice === "0" &&
            this.settings.data.postFXEngine === 'pmndrs' &&
            atmosphereConfig &&
            atmosphereConfig.enabled &&
            window.VRODOS_TAKRAM_ATMOSPHERE);

        if (!renderer || !sceneObj || !anchorObject || !this.ensureSceneProbeResources()) {
            return false;
        }

        if (shouldSyncTakramHorizon) {
            if (typeof this.settings.applyHorizonSkyPreset === 'function') {
                this.settings.applyHorizonSkyPreset();
            }
            if (typeof this.settings.hidePmndrsHorizonEnvironmentVisuals === 'function') {
                this.settings.hidePmndrsHorizonEnvironmentVisuals();
            }
            if (typeof this.settings.updatePmndrsHorizonSun === 'function') {
                this.settings.updatePmndrsHorizonSun();
            }
            if (typeof this.settings.showPmndrsAtmosphereSkyForSceneProbe === 'function') {
                showedTakramProbeSky = Boolean(this.settings.showPmndrsAtmosphereSkyForSceneProbe(atmosphereConfig));
            }
            if (typeof this.settings.logPmndrsHorizonDiagnostic === 'function') {
                this.settings.logPmndrsHorizonDiagnostic('scene-probe-capture', atmosphereConfig);
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
            if (showedTakramProbeSky && typeof this.settings.hidePmndrsAtmosphereSky === 'function') {
                this.settings.hidePmndrsAtmosphereSky();
            }
            this.sceneProbeCapturing = false;
            return false;
        }

        this.restoreSceneProbeExcludedObjects(hiddenObjects);
        this.sceneProbeCapturing = false;
        sceneObj.environment = previousEnvironment;
        if (showedTakramProbeSky && typeof this.settings.hidePmndrsAtmosphereSky === 'function') {
            this.settings.hidePmndrsAtmosphereSky();
        }

        const probeTarget = this._sceneProbePmremGenerator.fromCubemap(this._sceneProbeCubeRenderTarget.texture);
        if (!probeTarget || !probeTarget.texture) {
            return false;
        }

        disposeRuntimeResource(this._sceneProbePmremTarget);

        this._sceneProbePmremTarget = probeTarget;
        sceneObj.environment = probeTarget.texture;
        this._sceneProbeLastCaptureMs = now;
        this._sceneProbeLastYaw = this.getSceneProbeAnchorYaw(anchorObject);
        this._sceneProbeLastPosition.copy(this._sceneProbeCurrentPosition);
        this._sceneProbeNeedsUpdate = false;
        this._currentReflectionSource = 'scene-probe';
        this.settings.applyMaterialProfiles();
        if (shouldSyncTakramHorizon) {
            console.info('[VRodos] Scene reflection probe captured from synced PMNDRS Horizon Takram sky.');
        }
        return true;
    };
    R.getTakramSkyEnvironmentSignature = function (atmosphereConfig) {
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
        const moonIllumination = typeof atmosphereConfig.moonIllumination === 'number'
            ? atmosphereConfig.moonIllumination
            : 1;
        const starsIntensity = typeof this.settings.getPmndrsStarsIntensity === 'function'
            ? this.settings.getPmndrsStarsIntensity(atmosphereConfig)
            : 0;

        return [
            Math.round(sunElevation * 2) / 2,
            Math.round(sunAzimuth * 0.25) / 0.25,
            Math.round(moonY * 20) / 20,
            Math.round(moonIllumination * 20) / 20,
            Math.round(starsIntensity * 10) / 10
        ].join('|');
    };
    R.applyTakramSkyEnvironmentIntensity = function (atmosphereConfig, now) {
        const sceneObj = this.el && this.el.object3D ? this.el.object3D : null;
        if (!sceneObj || !sceneObj.environment) {
            return;
        }

        const targetScale = typeof this.settings.getPmndrsReflectionIntensityScale === 'function'
            ? this.settings.getPmndrsReflectionIntensityScale(atmosphereConfig, 'takram-sky')
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
    R.requestTakramSkyEnvironmentRefresh = function () {
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
        const state = self && self.settings._pmndrsAtmosphereState ? self.settings._pmndrsAtmosphereState : null;
        if (!state || state.failed || !state.ready || !state.skyMesh || !state.skyMaterial) {
            return false;
        }

        return Boolean(state.textures &&
            state.textures.irradianceTexture &&
            state.textures.scatteringTexture &&
            state.textures.transmittanceTexture);
    }
    R.captureTakramSkyEnvironment = function (now, atmosphereConfig) {
        const renderer = this.el.renderer;
        const sceneObj = this.el.object3D;
        const anchorObject = this.getSceneProbeAnchorObject();
        if (!renderer || !sceneObj || !anchorObject || !this.ensureSceneProbeResources()) {
            return false;
        }
        if (!atmosphereConfig || !atmosphereConfig.enabled || !window.VRODOS_TAKRAM_ATMOSPHERE) {
            return false;
        }
        if (typeof this.settings.showPmndrsAtmosphereSkyForSceneProbe !== 'function') {
            return false;
        }
        const showedTakramSky = Boolean(this.settings.showPmndrsAtmosphereSkyForSceneProbe(atmosphereConfig));
        if (!isTakramSkyEnvironmentReady(this)) {
            if (showedTakramSky && typeof this.settings.hidePmndrsAtmosphereSky === 'function') {
                this.settings.hidePmndrsAtmosphereSky();
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
            if (showedTakramSky && typeof this.settings.hidePmndrsAtmosphereSky === 'function') {
                this.settings.hidePmndrsAtmosphereSky();
            }
            this.sceneProbeCapturing = false;
            return false;
        }

        this.restoreSceneProbeExcludedObjects(hiddenObjects);
        this.sceneProbeCapturing = false;
        sceneObj.environment = previousEnvironment;
        if (showedTakramSky && typeof this.settings.hidePmndrsAtmosphereSky === 'function') {
            this.settings.hidePmndrsAtmosphereSky();
        }

        const probeTarget = this._sceneProbePmremGenerator.fromCubemap(this._sceneProbeCubeRenderTarget.texture);
        if (!probeTarget || !probeTarget.texture) {
            return false;
        }

        disposeRuntimeResource(this._takramSkyPmremTarget);

        this._takramSkyPmremTarget = probeTarget;
        sceneObj.environment = probeTarget.texture;
        this._sceneProbeLastCaptureMs = now;
        this._takramSkyEnvironmentLastCaptureMs = now;
        this._takramSkyEnvironmentNeedsUpdate = false;
        this._takramSkyEnvironmentNextRetryMs = 0;
        this._takramSkyEnvironmentSignature = this.getTakramSkyEnvironmentSignature(atmosphereConfig);
        this._currentReflectionSource = 'takram-sky';
        this.settings.applyMaterialProfiles();
        this.applyTakramSkyEnvironmentIntensity(atmosphereConfig, now);
        if (!this._takramSkyEnvironmentCaptureLogged) {
            this._takramSkyEnvironmentCaptureLogged = true;
            console.info('[VRodos] Takram sky environment captured once into the global PMREM for PBR materials.');
        }
        return true;
    };
    R.updateTakramSkyEnvironment = function (now) {
        const atmosphereConfig = typeof this.settings.getPmndrsAtmosphereConfig === 'function'
            ? this.settings.getPmndrsAtmosphereConfig()
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
            this.settings.applyMaterialProfiles();
        }

        const timeMs = getTakramSkyEnvironmentTimeMs(now);
        const needsCapture = !hasSkyTarget;

        this.applyTakramSkyEnvironmentIntensity(atmosphereConfig, now);
        if (needsCapture) {
            if (this._takramSkyEnvironmentNextRetryMs && timeMs < this._takramSkyEnvironmentNextRetryMs) {
                return;
            }
            this.captureTakramSkyEnvironment(now, atmosphereConfig);
        }
    };
    R.applyEnvMapProfile = function () {
        const preset = typeof this.settings.getEffectiveEnvMapPreset === 'function'
            ? this.settings.getEffectiveEnvMapPreset()
            : (this.settings.data.envMapPreset || 'none');
        const sceneObj = this.el.object3D;
        const effectiveSource = this.settings.getEffectiveReflectionSource();

        if (effectiveSource === 'takram-sky') {
            if (!this.ensureSceneProbeResources()) {
                sceneObj.environment = null;
                this._currentReflectionSource = 'none';
                this.settings.applyMaterialProfiles();
                return;
            }

            if (this._takramSkyPmremTarget && this._takramSkyPmremTarget.texture) {
                this.clearHdrEnvironmentMap(this._currentReflectionSource !== 'takram-sky');
                sceneObj.environment = this._takramSkyPmremTarget.texture;
                this._currentReflectionSource = 'takram-sky';
                this.settings.applyMaterialProfiles();
            }
            this.requestTakramSkyEnvironmentRefresh();
            return;
        }

        if (effectiveSource === 'scene-probe') {
            disposeRuntimeResource(this._takramSkyPmremTarget);
            this._takramSkyPmremTarget = null;
            this.clearHdrEnvironmentMap(this._currentReflectionSource !== 'scene-probe');
            if (!this.ensureSceneProbeResources()) {
                sceneObj.environment = null;
                this._currentReflectionSource = 'none';
                this.settings.applyMaterialProfiles();
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
            this.settings.applyMaterialProfiles();
            return;
        }

        if (this._currentReflectionSource === 'hdr' && this._currentEnvMapPreset === preset && this._envMapRenderTarget) {
            if (sceneObj.environment !== this._envMapRenderTarget.texture) {
                sceneObj.environment = this._envMapRenderTarget.texture;
                this.settings.applyMaterialProfiles();
            }
            return;
        }

        if (this._hdrEnvMapLoading && this._pendingHdrEnvMapPreset === preset) {
            return;
        }

        this.clearHdrEnvironmentMap(false);

        const HDRLoaderClass = THREE.HDRLoader || THREE.RGBELoader;
        if (typeof HDRLoaderClass === 'undefined') {
            this._hdrEnvMapFailed = true;
            this._hdrEnvMapError = 'HDRLoader not available';
            console.warn('[VRodos] HDRLoader not available; HDR env map skipped.');
            return;
        }

        const hdrFile = this.settings.getEnvMapPath();
        if (!hdrFile) {
            this._hdrEnvMapFailed = true;
            this._hdrEnvMapError = `No HDR file configured for preset "${preset}"`;
            return;
        }

        const baseUrl = window.VRODOS_ASSET_IMAGE_URL || '../../assets/images/';
        const hdrUrl = `${baseUrl  }hdr/${  hdrFile}`;
        const renderer = this.el.renderer;
        const self = this;

        this._hdrEnvMapLoading = true;
        this._hdrEnvMapFailed = false;
        this._hdrEnvMapError = '';
        this._pendingHdrEnvMapPreset = preset;
        this._pendingHdrEnvMapUrl = hdrUrl;
        const hdrLoadId = (this._hdrEnvMapLoadId || 0) + 1;
        this._hdrEnvMapLoadId = hdrLoadId;
        const loader = new HDRLoaderClass();
        loader.load(hdrUrl, (texture) => {
            if (self.removed || !self.settings || self.settings.reflectionRuntime !== self ||
                self._hdrEnvMapLoadId !== hdrLoadId ||
                self._pendingHdrEnvMapPreset !== preset ||
                self._pendingHdrEnvMapUrl !== hdrUrl) {
                disposeRuntimeResource(texture);
                return;
            }
            self._hdrEnvMapLoading = false;
            self._pendingHdrEnvMapPreset = null;
            self._pendingHdrEnvMapUrl = '';
            texture.mapping = THREE.EquirectangularReflectionMapping;

            let pmremGenerator;
            let envMapRenderTarget;
            try {
                pmremGenerator = new THREE.PMREMGenerator(renderer);
                pmremGenerator.compileEquirectangularShader();
                envMapRenderTarget = pmremGenerator.fromEquirectangular(texture);
                if (!envMapRenderTarget || !envMapRenderTarget.texture) {
                    throw new Error('HDR PMREM conversion returned no texture');
                }
            } catch (error) {
                disposeRuntimeResource(envMapRenderTarget);
                self._hdrEnvMapFailed = true;
                self._hdrEnvMapError = error.message || String(error);
                console.warn('[VRodos] HDR environment conversion failed:', hdrUrl, error);
                return;
            } finally {
                disposeRuntimeResource(texture);
                disposeRuntimeResource(pmremGenerator);
            }

            sceneObj.environment = envMapRenderTarget.texture;
            disposeRuntimeResource(self._envMapRenderTarget);
            self._envMapRenderTarget = envMapRenderTarget;

            self._currentReflectionSource = 'hdr';
            self._currentEnvMapPreset = preset;
            // Re-apply material profiles so envMapIntensity takes effect with the new env map
            self.settings.applyMaterialProfiles();

            console.log('[VRodos] HDR environment map loaded:', hdrFile);
        }, undefined, (err) => {
            if (self.removed || !self.settings || self.settings.reflectionRuntime !== self ||
                self._hdrEnvMapLoadId !== hdrLoadId ||
                self._pendingHdrEnvMapPreset !== preset ||
                self._pendingHdrEnvMapUrl !== hdrUrl) {
                return;
            }
            self._hdrEnvMapLoading = false;
            self._pendingHdrEnvMapPreset = null;
            self._pendingHdrEnvMapUrl = '';
            self._hdrEnvMapFailed = true;
            self._hdrEnvMapError = err && err.message ? err.message : String(err || 'unknown HDR load error');
            console.warn('[VRodos] Failed to load HDR env map:', hdrUrl, err);
        });
    };
    // The component owns mutable reflection state; settings only exposes reader views.
    function initialize(owner) {
        Object.assign(owner, R);
        owner.settings = null;
        owner.removed = false;
        owner._pmndrsRuntimeLightSmoothTimes = {};
        owner._pmndrsRuntimeLightSmoothValues = {};
        owner._currentEnvMapPreset = null;
        owner._currentReflectionSource = null;
        owner._envMapRenderTarget = null;
        owner._hdrEnvMapError = '';
        owner._hdrEnvMapFailed = false;
        owner._hdrEnvMapLoadId = 0;
        owner._hdrEnvMapLoading = false;
        owner._pendingHdrEnvMapPreset = null;
        owner._pendingHdrEnvMapUrl = '';
        owner._sceneProbeCubeCamera = null;
        owner._sceneProbeCubeRenderTarget = null;
        owner._sceneProbeCurrentPosition = new THREE.Vector3();
        owner._sceneProbeLastCaptureMs = 0;
        owner._sceneProbeLastModelEventMs = 0;
        owner._sceneProbeLastPosition = new THREE.Vector3();
        owner._sceneProbeLastYaw = null;
        owner._sceneProbeNeedsUpdate = false;
        owner._sceneProbePmremGenerator = null;
        owner._sceneProbePmremTarget = null;
        owner._sceneProbeResolution = null;
        owner._sceneProbeTempDirection = new THREE.Vector3();
        owner._takramSkyEnvironmentCaptureLogged = undefined;
        owner._takramSkyEnvironmentLastCaptureMs = 0;
        owner._takramSkyEnvironmentLastProfileScale = 1;
        owner._takramSkyEnvironmentLastSmoothMs = 0;
        owner._takramSkyEnvironmentNeedsUpdate = false;
        owner._takramSkyEnvironmentNextRetryMs = 0;
        owner._takramSkyEnvironmentSignature = '';
        owner._takramSkyEnvironmentSmoothedScale = null;
        owner._takramSkyPmremTarget = null;
        owner.sceneProbeCapturing = false;
        owner._vrodosReflectionEnvironmentIntensityScale = undefined;
        owner._vrodosReflectionEnvironmentLastUpdateMs = undefined;
    }
    const stateKeys = [
        '_currentEnvMapPreset',
        '_currentReflectionSource',
        '_envMapRenderTarget',
        '_hdrEnvMapError',
        '_hdrEnvMapFailed',
        '_hdrEnvMapLoadId',
        '_hdrEnvMapLoading',
        '_pendingHdrEnvMapPreset',
        '_pendingHdrEnvMapUrl',
        '_sceneProbeCubeCamera',
        '_sceneProbeCubeRenderTarget',
        '_sceneProbeCurrentPosition',
        '_sceneProbeLastCaptureMs',
        '_sceneProbeLastModelEventMs',
        '_sceneProbeLastPosition',
        '_sceneProbeLastYaw',
        '_sceneProbeNeedsUpdate',
        '_sceneProbePmremGenerator',
        '_sceneProbePmremTarget',
        '_sceneProbeResolution',
        '_sceneProbeTempDirection',
        '_takramSkyEnvironmentCaptureLogged',
        '_takramSkyEnvironmentLastCaptureMs',
        '_takramSkyEnvironmentLastProfileScale',
        '_takramSkyEnvironmentLastSmoothMs',
        '_takramSkyEnvironmentNeedsUpdate',
        '_takramSkyEnvironmentNextRetryMs',
        '_takramSkyEnvironmentSignature',
        '_takramSkyEnvironmentSmoothedScale',
        '_takramSkyPmremTarget',
        'sceneProbeCapturing',
        '_vrodosReflectionEnvironmentIntensityScale',
        '_vrodosReflectionEnvironmentLastUpdateMs',
    ];
    function bind(owner, settings) {
        if (owner.removed || owner.settings === settings) return;
        owner.settings = settings;
        settings.reflectionRuntime = owner;
        stateKeys.forEach(key => Object.defineProperty(settings, key, {
            configurable: true,
            get: function () { return this.reflectionRuntime ? this.reflectionRuntime[key] : undefined; }
        }));
    }
    function getOwner(settings) {
        const owner = settings.el && settings.el.components && settings.el.components['vrodos-reflections'];
        if (!owner || owner.removed) return null;
        bind(owner, settings);
        return owner;
    }
    Object.keys(R).forEach(name => {
        H[name] = function (...args) {
            const owner = getOwner(this);
            return owner ? owner[name](...args) : false;
        };
    });
    VRODOSMaster.Reflections = Object.freeze({ initialize, bind, getOwner });
})();
