/**
 * VRodos Quality Profile Helpers
 * Extracted from vrodos_scene_settings.component.js
 */
(function () {
    var H = VRODOSMaster.SceneSettingsHelpers = VRODOSMaster.SceneSettingsHelpers || {};

    function getPmndrsExposureValue(self) {
        if (!self || !self.data) {
            return 1.0;
        }

        var raw = parseFloat(self.data.pmndrsToneMappingExposure);
        if (isNaN(raw)) {
            raw = 1.0;
        }

        return Math.max(0.3, Math.min(2.5, raw));
    }

    function getLegacyHorizonStageSizeValue(self) {
        if (!self || !self.data) {
            return 5000;
        }

        var raw = parseFloat(self.data.legacyHorizonStageSize);
        if (isNaN(raw)) {
            raw = 5000;
        }

        return Math.max(500, Math.min(8000, Math.round(raw)));
    }

    function syncLegacyHorizonCameraFar(self) {
        if (!self || !self.el) {
            return;
        }

        var defaultFar = 7000;
        var targetFar = defaultFar;

        if (self.data && self.data.selChoice === "0") {
            targetFar = Math.max(defaultFar, Math.min(24000, getLegacyHorizonStageSizeValue(self) + 1000));
        }

        if (self.el.camera && typeof self.el.camera.far === 'number' && Math.abs(self.el.camera.far - targetFar) > 0.5) {
            self.el.camera.far = targetFar;
            if (typeof self.el.camera.updateProjectionMatrix === 'function') {
                self.el.camera.updateProjectionMatrix();
            }
        }

        Array.prototype.forEach.call(self.el.querySelectorAll('[camera]'), function (cameraEl) {
            if (!cameraEl || !cameraEl.components || !cameraEl.components.camera) {
                return;
            }

            cameraEl.setAttribute('camera', 'far', String(targetFar));

            var threeCamera = cameraEl.components.camera.camera;
            if (threeCamera && typeof threeCamera.far === 'number' && Math.abs(threeCamera.far - targetFar) > 0.5) {
                threeCamera.far = targetFar;
                if (typeof threeCamera.updateProjectionMatrix === 'function') {
                    threeCamera.updateProjectionMatrix();
                }
            }
        });
    }

    function parseLightPositionVector(lightPosition) {
        var raw = (lightPosition || '0.08 0.99 -0.1').split(/\s+/);
        var x = parseFloat(raw[0]);
        var y = parseFloat(raw[1]);
        var z = parseFloat(raw[2]);
        var dir = new THREE.Vector3(
            isNaN(x) ? 0.08 : x,
            isNaN(y) ? 0.99 : y,
            isNaN(z) ? -0.1 : z
        );

        if (dir.lengthSq() < 0.0001) {
            dir.set(0.08, 0.99, -0.1);
        }

        return dir.normalize();
    }

    function createPmndrsSunTexture(self) {
        if (!self || self._pmndrsSunTexture || typeof document === 'undefined') {
            return self ? self._pmndrsSunTexture : null;
        }

        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;

        var ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        var gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        // Create a tight, sharp sun core with rapid absolute falloff to 0. 
        // Any residual alpha will blow up under HDR multiplication.
        gradient.addColorStop(0.0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.05, 'rgba(255,252,240,0.8)'); // Very small glow (radius ~ 6px)
        gradient.addColorStop(0.1, 'rgba(255,245,214,0)'); // Sharp transparent drop-off
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)'); // Remaining 90% of the quad is absolutely invisible

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        self._pmndrsSunTexture = new THREE.CanvasTexture(canvas);
        self._pmndrsSunTexture.needsUpdate = true;
        return self._pmndrsSunTexture;
    }

    function getPmndrsHorizonSunConfig(preset) {
        switch (preset) {
            case 'clear':
                return {
                    scale: 95,
                    color: '#fff3c7',
                    distance: 5400
                };
            case 'crisp':
                return {
                    scale: 108,
                    color: '#fff0bc',
                    distance: 5300
                };
            default:
                return {
                    scale: 120,
                    color: '#ffedb2',
                    distance: 5200
                };
        }
    }

    function clearPmndrsHorizonSun(self) {
        if (!self) {
            return;
        }

        var oldSun = document.getElementById('default-sun');
        if (oldSun && oldSun.parentNode) {
            oldSun.parentNode.removeChild(oldSun);
        }
        self._pmndrsSunDirection = null;
        self._pmndrsSunDistance = null;
    }

    function ensurePmndrsHorizonSun(self, lightPosition, preset) {
        if (!self || !self.el || typeof document === 'undefined') {
            return;
        }

        var sunEl = document.getElementById('default-sun');
        if (!sunEl) {
            sunEl = document.createElement('a-entity');
            sunEl.setAttribute('id', 'default-sun');
            sunEl.setAttribute('data-vrodos-pmndrs-sun', 'true');
            self.el.appendChild(sunEl);
        }

        var texture = createPmndrsSunTexture(self);
        if (!texture) {
            return;
        }

        var sprite = sunEl.getObject3D('mesh');
        if (!sprite) {
            var material = new THREE.SpriteMaterial({
                map: texture,
                color: '#ffedb2',
                transparent: true,
                alphaTest: 0.05,
                depthWrite: false,
                depthTest: true,
                fog: false
            });
            material.toneMapped = false;
            sprite = new THREE.Sprite(material);
            sprite.frustumCulled = false;
            sunEl.setObject3D('mesh', sprite);
        }

        var cfg = getPmndrsHorizonSunConfig(preset);
        sprite.scale.set(cfg.scale, cfg.scale, 1);
        
        // pmndrs applies ACES Filmic over the entire HDR framebuffer, which
        // compresses LDR colors (<= 1.0) into dull grey. We must multiply the 
        // sun's authored color so it sits in the HDR range and survives tone 
        // mapping as a bright glowing light source.
        sprite.material.color.set(cfg.color).multiplyScalar(4.0);

        self._pmndrsSunDirection = parseLightPositionVector(lightPosition);
        self._pmndrsSunDistance = cfg.distance;
        H.updatePmndrsHorizonSun.call(self);
    }

    H.updatePmndrsHorizonSun = function () {
        if (!this || !this.el || this.data.selChoice !== "0" || this.data.postFXEngine !== 'pmndrs') {
            clearPmndrsHorizonSun(this);
            return;
        }

        var sunEl = document.getElementById('default-sun');
        if (!sunEl || !sunEl.object3D || !this._pmndrsSunDirection) {
            return;
        }

        var camera = this.el.camera;
        if (!camera || typeof camera.getWorldPosition !== 'function') {
            return;
        }

        if (!this._pmndrsSunCameraPosition) {
            this._pmndrsSunCameraPosition = new THREE.Vector3();
        }

        sunEl.object3D.visible = true;
        camera.getWorldPosition(this._pmndrsSunCameraPosition);
        sunEl.object3D.position.copy(this._pmndrsSunCameraPosition).addScaledVector(this._pmndrsSunDirection, this._pmndrsSunDistance || 5200);
    };

    H.applyRenderQualityProfile = function () {
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
            renderer.toneMappingExposure = this.data.postFXEngine === 'pmndrs'
                ? getPmndrsExposureValue(this)
                : (isHighQuality ? 1.06 : 1.0);
        }

        // physicallyCorrectLights removed in Three.js r150â†’r165; always on in r173 (A-Frame 1.7.1)
        // outputColorSpace & toneMapping are already set by A-Frame's renderer system
        // (colorManagement: true â†’ SRGBColorSpace; renderer="toneMapping: ACESFilmic" in HTML)
        // These defensive guards ensure correctness if A-Frame defaults ever change.
        if (typeof renderer.outputColorSpace !== 'undefined' && typeof THREE.SRGBColorSpace !== 'undefined') {
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        }

        if (typeof renderer.toneMapping !== 'undefined') {
            if (this.data.postFXEngine === 'pmndrs' && typeof THREE.NoToneMapping !== 'undefined') {
                renderer.toneMapping = THREE.NoToneMapping;
            } else if (typeof THREE.ACESFilmicToneMapping !== 'undefined') {
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
            }
        }
    };
    H.applyShadowQualityProfile = function () {
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
    };
    H.applyMaterialProfiles = function () {
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
    };
    H.ensurePhotorealHelperLight = function (id, attributes, position) {
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
    };
    H.removePhotorealHelperLights = function () {
        Array.prototype.forEach.call(this.getCachedSceneQuery('photorealLights', '[data-vrodos-photoreal-light="true"]'), function (lightEl) {
            if (lightEl.parentNode) {
                lightEl.parentNode.removeChild(lightEl);
            }
        });
        this.markSceneCollectionsDirty();
    };
    H.applyHorizonSkyPreset = function () {
        if (!this.el.hasAttribute('environment') || this.data.selChoice !== "0") {
            return;
        }

        var preset = this.getHorizonSkyPreset();
        var isPmndrs = this.data.postFXEngine === 'pmndrs';
        var shadowEnabled = this.data.shadowQuality !== 'off';
        var environmentConfig = {
            preset: 'default',
            ground: 'none',
            fog: (this.data.fogCategory === "2") ? (parseFloat(this.data.fogdensity) * 1.5) : 0,
            playArea: 1,
            shadow: shadowEnabled,
            stageSize: getLegacyHorizonStageSizeValue(this)
        };

        // skyType 'gradient' draws a smooth horizonColor → skyColor blend with no
        // procedural sun disk. We previously used 'atmosphere', but its built-in
        // sun shader renders a pale disk + halo at lightPosition that looks alien
        // through HDR tone-mapping. The scene's directional light is a separate
        // THREE.DirectionalLight controlled by lightPosition, so removing the sky
        // sun disk has no effect on actual illumination or shadows.
        if (preset === 'clear') {
            environmentConfig.skyType = isPmndrs ? 'gradient' : 'atmosphere';
            environmentConfig.skyColor = isPmndrs ? '#82c7fb' : '#bfe0ff';
            environmentConfig.horizonColor = isPmndrs ? '#fff0d3' : '#fff8ee';
            environmentConfig.lighting = 'distant';
            environmentConfig.lightPosition = '0.08 0.98 -0.12';
        } else if (preset === 'crisp') {
            environmentConfig.skyType = isPmndrs ? 'gradient' : 'atmosphere';
            environmentConfig.skyColor = isPmndrs ? '#8fc8f6' : '#abd7ff';
            environmentConfig.horizonColor = isPmndrs ? '#fff1d8' : '#fffaf2';
            environmentConfig.lighting = 'distant';
            environmentConfig.lightPosition = '0.1 0.99 -0.12';
        } else {
            environmentConfig.skyType = isPmndrs ? 'gradient' : 'atmosphere';
            environmentConfig.skyColor = isPmndrs ? '#94c9f5' : '#b8dcff';
            environmentConfig.horizonColor = isPmndrs ? '#ffefd8' : '#fff7ec';
            environmentConfig.lighting = 'distant';
            environmentConfig.lightPosition = '0.08 0.99 -0.1';
        }

        this.el.setAttribute('environment', environmentConfig);

        if (!isPmndrs) {
            clearPmndrsHorizonSun(this);
            return;
        }

        // aframe-environment-component creates a visible "sun" sphere mesh as a
        // child of the sky whenever lighting === 'distant', regardless of skyType.
        // With skyType 'atmosphere' the procedural shader masks the sphere, but
        // with 'gradient' the bare mesh shows up as a giant pale disc that ACES
        // Filmic tone-mapping turns into a "burnt disc" artifact. We can't move
        // it independently of the directional light (they share lightPosition).
        // Solution: hide the sun mesh aggressively across the DOM and Scenegraph.
        var envEl = this.el;
        var hideEnvSunMesh = function () {
            if (!envEl) return;
            
            // 1. Hide via A-Frame object map
            if (typeof envEl.getObject3D === 'function') {
                var sunObj = envEl.getObject3D('sun');
                if (sunObj) sunObj.visible = false;
            }
            
            // 2. Hide via DOM
            var domSuns = document.querySelectorAll('.environmentSun, .environment-sun, [class*="environmentSun"]');
            for (var i = 0; i < domSuns.length; i++) {
                domSuns[i].setAttribute('visible', 'false');
            }
            
            // 3. Hide via Scenegraph Traversal (Catch-all)
            if (envEl.object3D) {
                envEl.object3D.traverse(function (node) {
                    if (node && node.isMesh) {
                        var nName = (typeof node.name === 'string') ? node.name.toLowerCase() : '';
                        var mName = (node.material && typeof node.material.name === 'string') ? node.material.name.toLowerCase() : '';
                        if (nName.indexOf('sun') > -1 || mName.indexOf('sun') > -1 || nName === 'sunsphere') {
                            node.visible = false;
                        }
                    }
                });
            }
        };
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(hideEnvSunMesh);
        }
        setTimeout(hideEnvSunMesh, 50);
        setTimeout(hideEnvSunMesh, 200);

        ensurePmndrsHorizonSun(this, environmentConfig.lightPosition, preset);
    };
    H.applyBackgroundQualityProfile = function () {
        var isHighQuality = this.data.renderQuality === 'high';
        var shadowEnabled = this.data.shadowQuality !== 'off';
        var hasEnvironmentBackground = (this.data.selChoice === "0") || (this.data.selChoice === "2" && this.data.presChoice !== "ocean");
        var reflectionProfile = this.data.reflectionProfile || 'balanced';
        var enhancedReflections = reflectionProfile === 'enhanced';
        var softReflections = reflectionProfile === 'soft';
        var contactShadowSettings = this.getContactShadowSettings();
        var hasAuthorLights = Array.prototype.some.call(this.getCachedSceneQuery('lightEntities', '[light]'), function (lightEl) {
            return !lightEl.hasAttribute('data-vrodos-photoreal-light');
        });

        syncLegacyHorizonCameraFar(this);

        if (hasEnvironmentBackground && this.el.hasAttribute('environment')) {
            this.el.setAttribute('environment', 'shadow', shadowEnabled ? 'true' : 'false');
            if (this.data.selChoice === "0") {
                this.applyHorizonSkyPreset();
            } else {
                clearPmndrsHorizonSun(this);
                this.el.setAttribute('environment', 'lighting', 'distant');
                this.el.setAttribute('environment', 'lightPosition', isHighQuality ? (enhancedReflections ? '0.12 1 -0.08' : (softReflections ? '0.05 1 -0.02' : '0.08 1 -0.04')) : '0 1 0');
            }
            this.removePhotorealHelperLights();
            return;
        }

        clearPmndrsHorizonSun(this);

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
    };
    H.applyPostFXProfile = function () {
        var renderer = this.el.renderer;
        var canvas = this.el.canvas || (renderer ? renderer.domElement : null);
        var postFxEnabled = this.shouldUsePostProcessing();

        if (!canvas) {
            return;
        }

        canvas.style.filter = '';

        if (renderer && typeof renderer.toneMappingExposure !== 'undefined') {
            if (this.data.postFXEngine === 'pmndrs') {
                renderer.toneMappingExposure = getPmndrsExposureValue(this);
            } else if (this.data.renderQuality === 'high') {
                renderer.toneMappingExposure = 1.06;
            } else {
                renderer.toneMappingExposure = 1.0;
            }
        }

        this.syncPostProcessingState();
    };
    H.applyQualityProfiles = function () {
        this.applyRenderQualityProfile();
        this.applyShadowQualityProfile();
        this.applyBackgroundQualityProfile();
        this.applyEnvMapProfile();
        this.applyMaterialProfiles();
        this.applyPostFXProfile();
        this.syncFPSMeterState();
        this.sceneCollectionsDirty = false;
    };
})();
