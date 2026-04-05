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
    getReflectionSource: function () {
        return this.data.reflectionSource === 'scene-probe' ? 'scene-probe' : 'hdr';
    },
    isVrPresentationActive: function () {
        var inVrMode = this.el.is && this.el.is('vr-mode');
        return !!(inVrMode || (this.el.renderer && this.el.renderer.xr && this.el.renderer.xr.isPresenting));
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
    clearHdrEnvironmentMap: function (clearSceneEnvironment) {
        if (this._envMapRenderTarget) {
            this._envMapRenderTarget.dispose();
            this._envMapRenderTarget = null;
        }

        this._currentEnvMapPreset = null;

        if (clearSceneEnvironment && this.el && this.el.object3D) {
            this.el.object3D.environment = null;
        }
    },
    disposeSceneProbe: function (clearSceneEnvironment) {
        if (this._sceneProbePmremTarget) {
            this._sceneProbePmremTarget.dispose();
            this._sceneProbePmremTarget = null;
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
        this.sceneProbeCapturing = false;

        if (clearSceneEnvironment && this.el && this.el.object3D) {
            this.el.object3D.environment = null;
        }
    },
    ensureSceneProbeResources: function () {
        var renderer = this.el.renderer;
        var sceneObj = this.el.object3D;
        if (!renderer || !sceneObj) {
            return false;
        }

        if (!this._sceneProbeCubeRenderTarget) {
            this._sceneProbeCubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
                generateMipmaps: true,
                minFilter: THREE.LinearMipmapLinearFilter
            });
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
    },
    requestSceneProbeRefresh: function (waitForModelSettle) {
        if (this.getReflectionSource() !== 'scene-probe') {
            return;
        }

        this._sceneProbeNeedsUpdate = true;
        if (waitForModelSettle !== false) {
            this._sceneProbeLastModelEventMs = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now();
        }
    },
    markSceneCollectionsDirty: function () {
        this.sceneCollectionsDirty = true;
    },
    getCachedSceneQuery: function (key, selector) {
        if (!this.sceneQueryCache || this.sceneCollectionsDirty || !this.sceneQueryCache[key]) {
            this.sceneQueryCache = this.sceneQueryCache || {};
            this.sceneQueryCache[key] = this.el.querySelectorAll(selector);
        }

        return this.sceneQueryCache[key];
    },
    queueQualityRefresh: function (waitForModelSettle) {
        this.pendingQualityRefreshWaitForSettle = this.pendingQualityRefreshWaitForSettle || waitForModelSettle !== false;
        if (this.queuedQualityRefreshId) {
            return;
        }

        this.queuedQualityRefreshId = window.setTimeout(function () {
            var shouldWaitForModelSettle = this.pendingQualityRefreshWaitForSettle;
            this.queuedQualityRefreshId = null;
            this.pendingQualityRefreshWaitForSettle = false;
            this.applyQualityProfiles();
            this.requestSceneProbeRefresh(shouldWaitForModelSettle);
        }.bind(this), 50);
    },
    getSceneProbeAnchorObject: function () {
        var cameraRig = document.getElementById('cameraA');
        if (cameraRig && cameraRig.object3D) {
            return cameraRig.object3D;
        }

        if (this.el.camera && this.el.camera.el && this.el.camera.el.object3D) {
            return this.el.camera.el.object3D;
        }

        return this.el.camera || null;
    },
    getSceneProbeAnchorYaw: function (anchorObject) {
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
    },
    getSceneProbeYawDeltaDegrees: function (a, b) {
        if (a === null || b === null) {
            return 180;
        }

        var delta = Math.atan2(Math.sin(a - b), Math.cos(a - b));
        return Math.abs(delta * 180 / Math.PI);
    },
    hideSceneProbeObject: function (object3D, hiddenObjects, hiddenLookup) {
        if (!object3D || !object3D.uuid || hiddenLookup[object3D.uuid]) {
            return;
        }

        hiddenLookup[object3D.uuid] = true;
        hiddenObjects.push({ object: object3D, visible: object3D.visible });
        object3D.visible = false;
    },
    collectSceneProbeExcludedObjects: function () {
        var self = this;
        var hiddenObjects = [];
        var hiddenLookup = {};

        Array.prototype.forEach.call(this.getCachedSceneQuery('photorealLights', '[data-vrodos-photoreal-light="true"]'), function (entityEl) {
            if (entityEl && entityEl.object3D) {
                self.hideSceneProbeObject(entityEl.object3D, hiddenObjects, hiddenLookup);
            }
        });

        Array.prototype.forEach.call(this.getCachedSceneQuery('navMeshes', '.vrodos-navmesh'), function (entityEl) {
            if (entityEl && entityEl.object3D) {
                self.hideSceneProbeObject(entityEl.object3D, hiddenObjects, hiddenLookup);
            }
        });

        var cameraRig = document.getElementById('cameraA');
        if (cameraRig && cameraRig.object3D) {
            this.hideSceneProbeObject(cameraRig.object3D, hiddenObjects, hiddenLookup);
        }

        return hiddenObjects;
    },
    restoreSceneProbeExcludedObjects: function (hiddenObjects) {
        if (!hiddenObjects || !hiddenObjects.length) {
            return;
        }

        hiddenObjects.forEach(function (entry) {
            if (entry && entry.object) {
                entry.object.visible = entry.visible;
            }
        });
    },
    captureSceneProbe: function (now) {
        var renderer = this.el.renderer;
        var sceneObj = this.el.object3D;
        var anchorObject = this.getSceneProbeAnchorObject();

        if (!renderer || !sceneObj || !anchorObject || !this.ensureSceneProbeResources()) {
            return false;
        }

        anchorObject.updateMatrixWorld(true);
        anchorObject.getWorldPosition(this._sceneProbeCurrentPosition);

        this._sceneProbeCubeCamera.position.copy(this._sceneProbeCurrentPosition);
        this._sceneProbeCubeCamera.updateMatrixWorld(true);

        var previousEnvironment = sceneObj.environment;
        var hiddenObjects = this.collectSceneProbeExcludedObjects();

        sceneObj.environment = null;
        this.sceneProbeCapturing = true;

        try {
            this._sceneProbeCubeCamera.update(renderer, sceneObj);
        } catch (error) {
            console.warn('[VRodos] Scene reflection probe capture failed.', error);
            sceneObj.environment = previousEnvironment;
            this.restoreSceneProbeExcludedObjects(hiddenObjects);
            this.sceneProbeCapturing = false;
            return false;
        }

        this.restoreSceneProbeExcludedObjects(hiddenObjects);
        this.sceneProbeCapturing = false;
        sceneObj.environment = previousEnvironment;

        var probeTarget = this._sceneProbePmremGenerator.fromCubemap(this._sceneProbeCubeRenderTarget.texture);
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
        return true;
    },
    applyEnvMapProfile: function () {
        var preset = this.data.envMapPreset || 'none';
        var sceneObj = this.el.object3D;
        var effectiveSource = this.getEffectiveReflectionSource();

        if (effectiveSource === 'scene-probe') {
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

        // Guard: RGBELoader must be available
        if (typeof THREE.RGBELoader === 'undefined') {
            console.warn('[VRodos] RGBELoader not available; HDR env map skipped.');
            return;
        }

        var hdrFile = this.getEnvMapPath();
        if (!hdrFile) { return; }

        var baseUrl = window.VRODOS_PLUGIN_URL || '';
        var hdrUrl = baseUrl + 'images/hdr/' + hdrFile;
        var renderer = this.el.renderer;
        var self = this;

        var loader = new THREE.RGBELoader();
        loader.load(hdrUrl, function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;

            var pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            var envMapRenderTarget = pmremGenerator.fromEquirectangular(texture);
            var envMap = envMapRenderTarget.texture;

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
        }, undefined, function (err) {
            console.warn('[VRodos] Failed to load HDR env map:', hdrUrl, err);
        });
    },
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

        this.fpsStats = new Stats();
        this.fpsStats.showPanel(0);
        this.fpsStatsRoot = this.fpsStats.dom || this.fpsStats.domElement || null;
        if (!this.fpsStatsRoot) {
            this.fpsStats = null;
            return;
        }

        this.fpsStatsRoot.style.position = 'fixed';
        this.fpsStatsRoot.style.top = '12px';
        this.fpsStatsRoot.style.right = '12px';
        this.fpsStatsRoot.style.left = 'auto';
        this.fpsStatsRoot.style.zIndex = '9999';
        this.fpsStatsRoot.style.opacity = '0.92';
        document.body.appendChild(this.fpsStatsRoot);
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
    isPostFXOptionEnabled: function (key) {
        return this.data[key] !== '0';
    },
    hasEnabledPostFXOptions: function () {
        return this.hasBloomEffectEnabled() ||
            this.isPostFXOptionEnabled('postFXColorEnabled') ||
            this.isPostFXOptionEnabled('postFXEdgeAAEnabled');
    },
    hasCinematicShaderOptions: function () {
        return this.hasBloomEffectEnabled() ||
            this.isPostFXOptionEnabled('postFXColorEnabled') ||
            this.isPostFXOptionEnabled('postFXEdgeAAEnabled') ||
            this.isPostFXOptionEnabled('postFXTAAEnabled') ||
            this.isPostFXOptionEnabled('postFXSSREnabled') ||
            this.getAmbientOcclusionPreset() !== 'off';
    },
    shouldUseEdgeAAOversample: function () {
        return this.data.renderQuality === 'high' &&
            this.data.postFXEnabled !== '0' &&
            this.isPostFXOptionEnabled('postFXEdgeAAEnabled');
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
        var inVrMode = this.el.is && this.el.is('vr-mode');
        return this.data.renderQuality === 'high' &&
            this.data.postFXEnabled !== '0' &&
            this.hasCinematicShaderOptions() &&
            !inVrMode &&
            !(this.el.renderer && this.el.renderer.xr && this.el.renderer.xr.isPresenting);
    },
    updatePostProcessingSize: function () {
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
    },
    enablePostProcessing: function () {
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
        // Force Three.js r173 to apply ACESFilmic tone mapping + sRGB encoding when rendering
        // to this target. Normally Three.js skips both for WebGLRenderTarget (only does them
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
        this.postProcessingMaterial = VRODOSMaster.createPhotorealPostMaterial();
        this.postProcessingScene = new THREE.Scene();
        this.postProcessingCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.postProcessingQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postProcessingMaterial);
        this.postProcessingScene.add(this.postProcessingQuad);

        // Multi-pass bloom targets (half resolution)
        var halfW = Math.max(1, Math.floor(width / 2));
        var halfH = Math.max(1, Math.floor(height / 2));
        this.bloomTargetA = new THREE.WebGLRenderTarget(halfW, halfH, { depthBuffer: false });
        this.bloomTargetB = new THREE.WebGLRenderTarget(halfW, halfH, { depthBuffer: false });
        this.bloomBrightPassMaterial = VRODOSMaster.createBrightPassMaterial();
        this.bloomBlurMaterial = VRODOSMaster.createGaussianBlurMaterial();
        this.bloomBlurMaterial.uniforms.resolution.value.set(halfW, halfH);
        this.bloomQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bloomBrightPassMaterial);
        this.bloomScene = new THREE.Scene();
        this.bloomScene.add(this.bloomQuad);

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
        }

        // FXAA pass (full resolution, after composite)
        this.fxaaTarget = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
        this.fxaaMaterial = VRODOSMaster.createFXAAMaterial();
        this.fxaaMaterial.uniforms.resolution.value.set(1.0 / width, 1.0 / height);
        this.fxaaQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.fxaaMaterial);
        this.fxaaScene = new THREE.Scene();
        this.fxaaScene.add(this.fxaaQuad);

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

                // TAA jitter: apply sub-pixel offset to camera projection
                var useTAA = this.isPostFXOptionEnabled('postFXTAAEnabled') && this.taaMaterial && this.taaCurrentTarget;
                if (useTAA) {
                    // Apply Halton jitter to projection matrix
                    this._taaSavedProjectionMatrix = this._taaSavedProjectionMatrix || new THREE.Matrix4();
                    this._taaSavedProjectionMatrix.copy(camera.projectionMatrix);
                    var jitter = this._taaJitterSequence[this._taaFrameIndex % 16];
                    var size = renderer.getSize(this.postProcessingSize);
                    camera.projectionMatrix.elements[8] += (jitter.x * 2.0) / size.x;
                    camera.projectionMatrix.elements[9] += (jitter.y * 2.0) / size.y;
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

                // SAO passes (only if SAO is active and resources exist)
                if (this.saoMaterial && this.saoTargetA && this.saoTargetB && this.postProcessingTarget.depthTexture) {
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
                } else {
                    // No SAO â€” feed 1x1 white texture (ao=1.0 means no darkening)
                    if (!this._whiteSAOTexture) {
                        var whiteData = new Uint8Array([255, 255, 255, 255]);
                        this._whiteSAOTexture = new THREE.DataTexture(whiteData, 1, 1, THREE.RGBAFormat);
                        this._whiteSAOTexture.needsUpdate = true;
                    }
                    this.postProcessingMaterial.uniforms.tSAO.value = this._whiteSAOTexture;
                }

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
                } else {
                    // No SSR — feed 1x1 transparent black texture
                    if (!this._blackSSRTexture) {
                        var ssrData = new Uint8Array([0, 0, 0, 0]);
                        this._blackSSRTexture = new THREE.DataTexture(ssrData, 1, 1, THREE.RGBAFormat);
                        this._blackSSRTexture.needsUpdate = true;
                    }
                    this.postProcessingMaterial.uniforms.tSSR.value = this._blackSSRTexture;
                    this.postProcessingMaterial.uniforms.ssrStrength.value = 0.0;
                }

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
                } else {
                    // No bloom â€” feed 1x1 black texture (null would cause GPU errors)
                    if (!this._blackBloomTexture) {
                        var blackData = new Uint8Array([0, 0, 0, 255]);
                        this._blackBloomTexture = new THREE.DataTexture(blackData, 1, 1, THREE.RGBAFormat);
                        this._blackBloomTexture.needsUpdate = true;
                    }
                    this.postProcessingMaterial.uniforms.tBloom.value = this._blackBloomTexture;
                }

                renderer.setRenderTarget(previousTarget);

                // Pass 5: Final composite
                this.postProcessingMaterial.uniforms.tDiffuse.value = this.postProcessingTarget.texture;
                this.postProcessingMaterial.uniforms.bloomStrength.value = bloomValue;
                this.postProcessingMaterial.uniforms.vignetteStrength.value = this.isPostFXOptionEnabled('postFXVignetteEnabled') ? 0.16 : 0.0;
                this.postProcessingMaterial.uniforms.saturation.value = this.isPostFXOptionEnabled('postFXColorEnabled')
                    ? this.getSaturationValue()
                    : 1.0;
                this.postProcessingMaterial.uniforms.contrast.value = this.isPostFXOptionEnabled('postFXColorEnabled')
                    ? this.getContrastValue()
                    : 1.0;
                this.postProcessingMaterial.uniforms.exposure.value = this.isPostFXOptionEnabled('postFXColorEnabled')
                    ? this.getExposureValue()
                    : 1.0;
                // Mirror renderer.toneMappingExposure so ACES in composite matches direct-render path
                this.postProcessingMaterial.uniforms.outputExposure.value = (renderer && renderer.toneMappingExposure) ? renderer.toneMappingExposure : 1.0;

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

                    // Display TAA result → screen (via FXAA blit for final output)
                    this.fxaaMaterial.uniforms.tDiffuse.value = this.taaCurrentTarget.texture;
                    this.fxaaQuad.material = this.fxaaMaterial;
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
    },
    disablePostProcessing: function () {
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
    },
    syncPostProcessingState: function () {
        if (this.shouldUsePostProcessing()) {
            this.enablePostProcessing();
            this.updatePostProcessingSize();
            return;
        }

        this.disablePostProcessing();
    },
    applyRenderQualityProfile: function () {
        var renderer = this.el.renderer;
        if (!renderer) {
            return;
        }

        var isHighQuality = this.data.renderQuality === 'high';
        var targetPixelRatio = isHighQuality ? Math.min(window.devicePixelRatio || 1, 2) : Math.min(window.devicePixelRatio || 1, 1.25);
        if (isHighQuality) {
            targetPixelRatio = Math.max(targetPixelRatio, this.getAAQualityPixelRatioTarget());
        }
        if (this.shouldUseEdgeAAOversample()) {
            targetPixelRatio = Math.max(targetPixelRatio, 1.15 + (this.getEdgeAAStrengthFactor() * 0.7));
        }
        targetPixelRatio = Math.min(targetPixelRatio, isHighQuality ? 1.5 : 1.25);
        renderer.setPixelRatio(targetPixelRatio);
        renderer.sortObjects = true;

        if (typeof renderer.toneMappingExposure !== 'undefined') {
            renderer.toneMappingExposure = isHighQuality ? 1.06 : 1.0;
        }

        // physicallyCorrectLights removed in Three.js r150â†’r165; always on in r173 (A-Frame 1.7.1)
        // outputColorSpace & toneMapping are already set by A-Frame's renderer system
        // (colorManagement: true â†’ SRGBColorSpace; renderer="toneMapping: ACESFilmic" in HTML)
        // These defensive guards ensure correctness if A-Frame defaults ever change.
        if (typeof renderer.outputColorSpace !== 'undefined' && typeof THREE.SRGBColorSpace !== 'undefined') {
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        }

        if (typeof renderer.toneMapping !== 'undefined' && typeof THREE.ACESFilmicToneMapping !== 'undefined') {
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
        }
    },
    applyShadowQualityProfile: function () {
        var renderer = this.el.renderer;
        var shadowQuality = this.data.shadowQuality || 'medium';
        var shadowsEnabled = shadowQuality !== 'off';
        var contactShadowSettings = this.getContactShadowSettings();

        if (renderer && renderer.shadowMap) {
            renderer.shadowMap.enabled = shadowsEnabled;
            renderer.shadowMap.type = shadowQuality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
            renderer.shadowMap.needsUpdate = true;
        }

        if (this.el.hasAttribute('environment')) {
            this.el.setAttribute('environment', 'shadow', shadowsEnabled ? 'true' : 'false');
        }

        this.el.object3D.traverse(function (node) {
            if (node.isMesh) {
                var isNavmeshMesh = !!(node.el && node.el.classList && node.el.classList.contains('vrodos-navmesh'));
                if (isNavmeshMesh) {
                    node.castShadow = false;
                    node.receiveShadow = false;
                    return;
                }

                var nodeMaterial = Array.isArray(node.material) ? node.material[0] : node.material;
                var isTransparentMesh = !!(nodeMaterial && (nodeMaterial.transparent || nodeMaterial.opacity < 0.98));

                node.castShadow = shadowsEnabled && !isTransparentMesh;
                node.receiveShadow = shadowsEnabled;
            }

            if (node.isDirectionalLight || node.isSpotLight || node.isPointLight) {
                node.castShadow = shadowsEnabled;

                if (!node.shadow) {
                    return;
                }

                if (shadowsEnabled) {
                    var targetMapSize = shadowQuality === 'high'
                        ? (node.isDirectionalLight ? 2048 : 1024)
                        : (node.isDirectionalLight ? 1024 : 512);

                    if (node.shadow.mapSize) {
                        node.shadow.mapSize.x = Math.max(node.shadow.mapSize.x || 0, targetMapSize);
                        node.shadow.mapSize.y = Math.max(node.shadow.mapSize.y || 0, targetMapSize);
                    }

                    if (typeof node.userData.vrodosBaseShadowBias === 'undefined') {
                        node.userData.vrodosBaseShadowBias = (typeof node.shadow.bias === 'number') ? node.shadow.bias : 0;
                    }

                    if (typeof node.userData.vrodosBaseShadowNormalBias === 'undefined') {
                        node.userData.vrodosBaseShadowNormalBias = (typeof node.shadow.normalBias === 'number') ? node.shadow.normalBias : 0;
                    }

                    if (typeof node.shadow.bias !== 'undefined') {
                        node.shadow.bias = node.userData.vrodosBaseShadowBias !== 0
                            ? node.userData.vrodosBaseShadowBias
                            : contactShadowSettings.bias;
                    }

                    if (typeof node.shadow.normalBias !== 'undefined') {
                        node.shadow.normalBias = node.userData.vrodosBaseShadowNormalBias !== 0
                            ? node.userData.vrodosBaseShadowNormalBias
                            : contactShadowSettings.normalBias;
                    }
                }

                node.shadow.needsUpdate = true;
            }
        });
    },
    applyMaterialProfiles: function () {
        var renderer = this.el.renderer;
        var sceneObj = this.el.object3D;
        var maxAnisotropy = renderer && typeof renderer.capabilities !== 'undefined' && typeof renderer.capabilities.getMaxAnisotropy === 'function'
            ? renderer.capabilities.getMaxAnisotropy()
            : 0;
        var options = {
            renderQuality: this.data.renderQuality || 'standard',
            maxAnisotropy: maxAnisotropy,
            reflectionProfile: this.data.reflectionProfile || 'balanced',
            ambientOcclusionPreset: this.getAmbientOcclusionPreset(),
            environmentMap: sceneObj ? (sceneObj.environment || null) : null
        };

        Array.prototype.forEach.call(this.getCachedSceneQuery('overrideMaterials', '.override-materials'), function (entityEl) {
            if (!entityEl || (entityEl.classList && entityEl.classList.contains('vrodos-navmesh'))) {
                return;
            }

            var meshRoot = entityEl.getObject3D('mesh');
            if (!meshRoot) {
                return;
            }

            var overrides = vrodosGetExplicitMaterialOverrides(entityEl);
            meshRoot.traverse(function (node) {
                if (!node.isMesh || !node.material) {
                    return;
                }

                if (Array.isArray(node.material)) {
                    node.material.forEach(function (material) {
                        vrodosEnhanceMeshMaterial(material, overrides, options);
                    });
                } else {
                    vrodosEnhanceMeshMaterial(node.material, overrides, options);
                }
            });
        });
    },
    ensurePhotorealHelperLight: function (id, attributes, position) {
        var lightEl = document.getElementById(id);
        if (!lightEl) {
            lightEl = document.createElement('a-entity');
            lightEl.setAttribute('id', id);
            this.el.appendChild(lightEl);
            this.markSceneCollectionsDirty();
        }

        lightEl.setAttribute('light', attributes);
        lightEl.setAttribute('position', position);
        lightEl.setAttribute('data-vrodos-photoreal-light', 'true');
        lightEl.setAttribute('visible', 'true');
        return lightEl;
    },
    removePhotorealHelperLights: function () {
        Array.prototype.forEach.call(this.getCachedSceneQuery('photorealLights', '[data-vrodos-photoreal-light="true"]'), function (lightEl) {
            if (lightEl.parentNode) {
                lightEl.parentNode.removeChild(lightEl);
            }
        });
        this.markSceneCollectionsDirty();
    },
    applyHorizonSkyPreset: function () {
        if (!this.el.hasAttribute('environment') || this.data.selChoice !== "0") {
            return;
        }

        var preset = this.getHorizonSkyPreset();
        var shadowEnabled = this.data.shadowQuality !== 'off';
        var environmentConfig = {
            preset: 'default',
            ground: 'none',
            fog: (this.data.fogCategory === "2") ? (parseFloat(this.data.fogdensity) * 1.5) : 0,
            playArea: 1,
            shadow: shadowEnabled
        };

        if (preset === 'clear') {
            environmentConfig.skyType = 'atmosphere';
            environmentConfig.skyColor = '#b8ddff';
            environmentConfig.horizonColor = '#edf8ff';
            environmentConfig.lighting = 'distant';
            environmentConfig.lightPosition = '0.03 0.98 -0.08';
        } else if (preset === 'crisp') {
            environmentConfig.skyType = 'atmosphere';
            environmentConfig.skyColor = '#9fd1ff';
            environmentConfig.horizonColor = '#f7fbff';
            environmentConfig.lighting = 'distant';
            environmentConfig.lightPosition = '0.05 1 -0.1';
        } else {
            environmentConfig.skyType = 'atmosphere';
            environmentConfig.skyColor = '#b2d8ff';
            environmentConfig.horizonColor = '#e9f6ff';
            environmentConfig.lighting = 'distant';
            environmentConfig.lightPosition = '0 1 0';
        }

        this.el.setAttribute('environment', environmentConfig);
    },
    applyBackgroundQualityProfile: function () {
        var isHighQuality = this.data.renderQuality === 'high';
        var shadowEnabled = this.data.shadowQuality !== 'off';
        var hasEnvironmentBackground = (this.data.selChoice === "0") || (this.data.selChoice === "2" && this.data.presChoice !== "ocean");
        var reflectionProfile = this.data.reflectionProfile || 'balanced';
        var enhancedReflections = reflectionProfile === 'enhanced';
        var softReflections = reflectionProfile === 'soft';
        var contactShadowSettings = this.getContactShadowSettings();

        if (hasEnvironmentBackground && this.el.hasAttribute('environment')) {
            this.el.setAttribute('environment', 'shadow', shadowEnabled ? 'true' : 'false');
            if (this.data.selChoice === "0") {
                this.applyHorizonSkyPreset();
            } else {
                this.el.setAttribute('environment', 'lighting', 'distant');
                this.el.setAttribute('environment', 'lightPosition', isHighQuality ? (enhancedReflections ? '0.12 1 -0.08' : (softReflections ? '0.05 1 -0.02' : '0.08 1 -0.04')) : '0 1 0');
            }
            this.removePhotorealHelperLights();
            return;
        }

        var hasAuthorLights = Array.prototype.some.call(this.getCachedSceneQuery('lightEntities', '[light]'), function (lightEl) {
            return !lightEl.hasAttribute('data-vrodos-photoreal-light');
        });

        if (!isHighQuality || hasAuthorLights) {
            this.removePhotorealHelperLights();
            return;
        }

        var keyShadowMap = this.data.shadowQuality === 'high' ? 2048 : 1024;
        var castShadow = shadowEnabled ? 'true' : 'false';

        this.ensurePhotorealHelperLight(
            'vrodos-photoreal-key-light',
            'type: directional; color: #fff2d8; intensity: ' + (enhancedReflections ? Math.max(contactShadowSettings.helperKeyIntensity, 1.0).toFixed(2) : (softReflections ? Math.max(contactShadowSettings.helperKeyIntensity - 0.08, 0.72).toFixed(2) : contactShadowSettings.helperKeyIntensity.toFixed(2))) + '; castShadow: ' + castShadow + '; shadowMapWidth: ' + keyShadowMap + '; shadowMapHeight: ' + keyShadowMap + '; shadowCameraTop: 16; shadowCameraRight: 16; shadowCameraLeft: -16; shadowCameraBottom: -16; shadowBias: ' + contactShadowSettings.bias + '; shadowNormalBias: ' + contactShadowSettings.normalBias + ';',
            contactShadowSettings.helperPosition
        );

        this.ensurePhotorealHelperLight(
            'vrodos-photoreal-fill-light',
            'type: ambient; color: #d8e4ff; intensity: ' + (enhancedReflections ? Math.max(contactShadowSettings.helperFillIntensity, 0.4).toFixed(2) : (softReflections ? Math.max(contactShadowSettings.helperFillIntensity - 0.05, 0.22).toFixed(2) : contactShadowSettings.helperFillIntensity.toFixed(2))) + ';',
            '0 4 0'
        );
    },
    applyPostFXProfile: function () {
        var renderer = this.el.renderer;
        var canvas = this.el.canvas || (renderer ? renderer.domElement : null);
        var postFxEnabled = this.shouldUsePostProcessing();

        if (!canvas) {
            return;
        }

        canvas.style.filter = '';

        if (renderer && typeof renderer.toneMappingExposure !== 'undefined') {
            if (this.data.renderQuality === 'high') {
                renderer.toneMappingExposure = 1.06;
            } else {
                renderer.toneMappingExposure = 1.0;
            }
        }

        this.syncPostProcessingState();
    },
    applyQualityProfiles: function () {
        this.applyRenderQualityProfile();
        this.applyShadowQualityProfile();
        this.applyBackgroundQualityProfile();
        this.applyEnvMapProfile();
        this.applyMaterialProfiles();
        this.applyPostFXProfile();
        this.syncFPSMeterState();
        this.sceneCollectionsDirty = false;
    },
    init: function () {
        this.handleQualityModelLoad = function () {
            this.markSceneCollectionsDirty();
            this.queueQualityRefresh(true);
        }.bind(this);
        this.handleSceneMutation = function () {
            this.markSceneCollectionsDirty();
        }.bind(this);
        this.handleResize = this.updatePostProcessingSize.bind(this);
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
                    if (typeof gtag !== 'undefined') gtag('event', 'chat_private_tab_selected');
                });
            }

            const publicChatBtn = document.getElementById("public-chat-button");
            if (publicChatBtn) {
                publicChatBtn.addEventListener("click", (evt) => {
                    let event = new CustomEvent('chat-selected', { "detail": "public" });
                    document.dispatchEvent(event);
                    if (typeof gtag !== 'undefined') gtag('event', 'chat_public_tab_selected');
                });
            }

            const sceneContainer = document.getElementById("aframe-scene-container");
            if (sceneContainer) {
                const settings = sceneContainer.getAttribute("scene-settings");
                if (settings.public_chat == "0") {
                    if (privateChatBtn) privateChatBtn.disabled = true;
                } else {
                    if (publicChatBtn) {
                        publicChatBtn.style.visibility = 'visible';
                        publicChatBtn.classList.add('mdc-tab--active');
                        publicChatBtn.disabled = true;
                    }
                }
            }

            // Avatar Selector
            let avatarDialog = document.querySelector('#avatar-selection-dialog');
            if (avatarDialog) {
                let avatar_dialog_element = new mdc.dialog.MDCDialog(avatarDialog);
                let closeAvatarDialogListener = function (event) {
                    avatar_dialog_element.unlisten("MDCDialog:cancel", closeAvatarDialogListener);
                    if (typeof selectAvatarType !== 'undefined') selectAvatarType('no-avatar');
                };

                const settings = sceneContainer.getAttribute("scene-settings");
                if (settings && settings.avatar_enabled == 1) {
                    avatar_dialog_element.show();
                    avatar_dialog_element.listen("MDCDialog:cancel", closeAvatarDialogListener);
                } else {
                    if (typeof selectAvatarType !== 'undefined') selectAvatarType('no-avatar');
                }
            }

            this.queueQualityRefresh(true);
        });
        this.el.addEventListener('model-loaded', this.handleQualityModelLoad);

        this.el.addEventListener("enter-vr", () => {
            VRODOSMaster.setBrowsingModeVR(true);
            this.applyEnvMapProfile();
            this.syncPostProcessingState();
            if (typeof gtag !== 'undefined') gtag('event', 'vr_enabled');
        });
        this.el.addEventListener("exit-vr", () => {
            VRODOSMaster.setBrowsingModeVR(false);
            this.applyEnvMapProfile();
            this.syncPostProcessingState();
            if (typeof gtag !== 'undefined') gtag('event', 'vr_disabled');
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
            let oldSun = document.querySelector('a-sun-sky');
            if (oldSun) oldSun.parentNode.removeChild(oldSun);
            let manSky = document.getElementById('default-sky');
            if (manSky) manSky.parentNode.removeChild(manSky);
            let manSun = document.getElementById('default-sun');
            if (manSun) manSun.parentNode.removeChild(manSun);
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
                backgroundEl.setAttribute("environment", {
                    preset: 'default',
                    ground: 'none',
                    fog: (this.data.fogCategory === "2") ? (parseFloat(this.data.fogdensity) * 1.5) : 0,
                    playArea: 1,
                    shadow: true
                });
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
        if (this.queuedQualityRefreshId) {
            clearTimeout(this.queuedQualityRefreshId);
            this.queuedQualityRefreshId = null;
        }
        this.disablePostProcessing();
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
    },
    tick: function (time) {
        if (this.fpsStats && typeof this.fpsStats.update === 'function') {
            this.fpsStats.update();
        }

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

