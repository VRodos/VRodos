/**
 * VRodos Quality Profile Helpers
 * Extracted from vrodos_scene_settings.component.js
 */
(function () {
    var H = VRODOSMaster.SceneSettingsHelpers = VRODOSMaster.SceneSettingsHelpers || {};
    var PMNDRS_ATMOSPHERE_QUALITY_DEFAULTS = {
        performance: {
            sunElevationDeg: 8,
            sunAzimuthDeg: 34,
            sunDistance: 4800,
            sunAngularRadius: 0.0056,
            aerialStrength: 0.6,
            albedoScale: 0.92,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#e8ddc9',
            rayleighScale: 0.82,
            mieScatteringScale: 0.62,
            mieExtinctionScale: 0.74,
            miePhaseG: 0.72,
            absorptionScale: 0.82,
            moonEnabled: false
        },
        balanced: {
            sunElevationDeg: 10,
            sunAzimuthDeg: 38,
            sunDistance: 5200,
            sunAngularRadius: 0.0068,
            aerialStrength: 0.85,
            albedoScale: 0.96,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f0e6d6',
            rayleighScale: 1.0,
            mieScatteringScale: 0.9,
            mieExtinctionScale: 1.0,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        },
        quality: {
            sunElevationDeg: 12,
            sunAzimuthDeg: 40,
            sunDistance: 5600,
            sunAngularRadius: 0.0082,
            aerialStrength: 1.0,
            albedoScale: 1.0,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f6ead7',
            rayleighScale: 1.12,
            mieScatteringScale: 1.02,
            mieExtinctionScale: 1.05,
            miePhaseG: 0.82,
            absorptionScale: 1.02,
            moonEnabled: false
        },
        cinematic: {
            sunElevationDeg: 7,
            sunAzimuthDeg: 28,
            sunDistance: 6200,
            sunAngularRadius: 0.0105,
            aerialStrength: 1.15,
            albedoScale: 1.05,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f8ead2',
            rayleighScale: 1.2,
            mieScatteringScale: 1.16,
            mieExtinctionScale: 1.18,
            miePhaseG: 0.84,
            absorptionScale: 0.96,
            moonEnabled: false
        }
    };
    var PMNDRS_ATMOSPHERE_HORIZON_OVERRIDES = {
        natural: {
            sunElevationDeg: 10,
            sunAzimuthDeg: 38,
            sunAngularRadius: 0.0068,
            aerialStrength: 0.85
        },
        clear: {
            sunElevationDeg: 14,
            sunAzimuthDeg: 34,
            sunAngularRadius: 0.0059,
            rayleighScale: 0.88,
            mieScatteringScale: 0.72,
            mieExtinctionScale: 0.86,
            absorptionScale: 0.9
        },
        crisp: {
            sunElevationDeg: 17,
            sunAzimuthDeg: 42,
            sunAngularRadius: 0.0052,
            rayleighScale: 1.12,
            mieScatteringScale: 0.64,
            mieExtinctionScale: 0.8,
            absorptionScale: 1.08
        }
    };

    function clampPmndrsNumber(value, min, max, fallback) {
        var n = parseFloat(value);
        if (isNaN(n)) {
            return fallback;
        }
        if (n < min) {
            return min;
        }
        if (n > max) {
            return max;
        }
        return n;
    }

    function normalizePmndrsAtmosphereQuality(value) {
        switch (value) {
            case 'performance':
            case 'quality':
            case 'cinematic':
            case 'custom':
                return value;
            default:
                return 'balanced';
        }
    }

    function readPmndrsAtmosphereNumber(self, key, min, max, fallback) {
        if (!self || !self.data) {
            return fallback;
        }
        return clampPmndrsNumber(self.data[key], min, max, fallback);
    }

    function readPmndrsAtmosphereBool(self, key, fallback) {
        if (!self || !self.data || self.data[key] === undefined) {
            return !!fallback;
        }
        var value = self.data[key];
        return value === true || value === 'true' || value === '1' || value === 1;
    }

    function normalizePmndrsColor(value, fallback) {
        var raw = (typeof value === 'string') ? value.trim() : '';
        if (!/^#?[0-9a-fA-F]{6}$/.test(raw)) {
            return fallback;
        }
        return raw.charAt(0) === '#' ? raw : ('#' + raw);
    }

    function buildPmndrsSunDirection(elevationDeg, azimuthDeg) {
        var elevation = THREE.MathUtils.degToRad(elevationDeg);
        var azimuth = THREE.MathUtils.degToRad(azimuthDeg);
        var cosElevation = Math.cos(elevation);
        return new THREE.Vector3(
            Math.sin(azimuth) * cosElevation,
            Math.sin(elevation),
            -Math.cos(azimuth) * cosElevation
        ).normalize();
    }

    function buildPmndrsMoonDirection(sunDirection) {
        return sunDirection.clone().multiplyScalar(-1).normalize();
    }

    function ensurePmndrsWorldToEcefMatrix(target) {
        if (!target) {
            return null;
        }

        var matrix = target.worldToECEFMatrix;
        if (!matrix || typeof matrix.makeTranslation !== 'function') {
            return null;
        }

        var bottomRadius = null;
        if (target.atmosphere && typeof target.atmosphere.bottomRadius === 'number') {
            bottomRadius = target.atmosphere.bottomRadius;
        } else if (target.uniforms && target.uniforms.ATMOSPHERE && target.uniforms.ATMOSPHERE.value && typeof target.uniforms.ATMOSPHERE.value.bottom_radius === 'number') {
            bottomRadius = target.uniforms.ATMOSPHERE.value.bottom_radius;
        }

        if (!bottomRadius || !isFinite(bottomRadius)) {
            bottomRadius = 6360000;
        }

        // Takram expects scene coordinates in an Earth-centered frame. Our scenes
        // are authored in a local Y-up space near the origin, so we pin that local
        // origin onto an arbitrary point on the ellipsoid surface with the same
        // axis orientation. This gives the shaders a sane altitude and tangent
        // frame without forcing the rest of VRodos to become geospatial.
        matrix.makeTranslation(0, bottomRadius, 0);
        return matrix;
    }

    function copyPmndrsAtmosphereParameters(target, params) {
        if (!target || !params) {
            return;
        }

        if (target.atmosphere) {
            target.atmosphere.sunAngularRadius = params.sunAngularRadius;
            target.atmosphere.rayleighScattering.copy(params.rayleighScattering);
            target.atmosphere.mieScattering.copy(params.mieScattering);
            target.atmosphere.mieExtinction.copy(params.mieExtinction);
            target.atmosphere.miePhaseFunctionG = params.miePhaseFunctionG;
            target.atmosphere.absorptionExtinction.copy(params.absorptionExtinction);
            target.atmosphere.groundAlbedo.copy(params.groundAlbedo);
        }

        if (target.uniforms && target.uniforms.ATMOSPHERE && target.uniforms.ATMOSPHERE.value) {
            var uniforms = target.uniforms.ATMOSPHERE.value;
            if (uniforms.sun_angular_radius !== undefined) {
                uniforms.sun_angular_radius = params.sunAngularRadius;
            }
            if (uniforms.rayleigh_scattering && typeof uniforms.rayleigh_scattering.copy === 'function') {
                uniforms.rayleigh_scattering.copy(params.rayleighScattering);
            }
            if (uniforms.mie_scattering && typeof uniforms.mie_scattering.copy === 'function') {
                uniforms.mie_scattering.copy(params.mieScattering);
            }
            if (uniforms.mie_extinction && typeof uniforms.mie_extinction.copy === 'function') {
                uniforms.mie_extinction.copy(params.mieExtinction);
            }
            if (uniforms.mie_phase_function_g !== undefined) {
                uniforms.mie_phase_function_g = params.miePhaseFunctionG;
            }
            if (uniforms.absorption_extinction && typeof uniforms.absorption_extinction.copy === 'function') {
                uniforms.absorption_extinction.copy(params.absorptionExtinction);
            }
            if (uniforms.ground_albedo && typeof uniforms.ground_albedo.copy === 'function') {
                uniforms.ground_albedo.copy(params.groundAlbedo);
            }
        }

        if (typeof target.sunAngularRadius === 'number' || typeof target.sunAngularRadius === 'undefined') {
            try {
                target.sunAngularRadius = params.sunAngularRadius;
            } catch (err) {
                /* ignore unsupported setter */
            }
        }
    }

    function createPmndrsAtmosphereParameters(vta, config) {
        var params = new vta.AtmosphereParameters();
        params.sunAngularRadius = config.sunAngularRadius;
        params.rayleighScattering.multiplyScalar(config.rayleighScale);
        params.mieScattering.multiplyScalar(config.mieScatteringScale);
        params.mieExtinction.multiplyScalar(config.mieExtinctionScale);
        params.miePhaseFunctionG = config.miePhaseG;
        params.absorptionExtinction.multiplyScalar(config.absorptionScale);
        params.groundAlbedo.set(config.groundAlbedo);
        return params;
    }

    function removePmndrsAtmosphereSky(self) {
        if (!self || !self._pmndrsAtmosphereState) {
            return;
        }
        var state = self._pmndrsAtmosphereState;
        if (state.skyMesh && state.skyMesh.parent) {
            state.skyMesh.parent.remove(state.skyMesh);
        }
        if (state.skyMaterial && typeof state.skyMaterial.dispose === 'function') {
            state.skyMaterial.dispose();
        }
        if (state.skyGeometry && typeof state.skyGeometry.dispose === 'function') {
            state.skyGeometry.dispose();
        }
        state.skyMesh = null;
        state.skyMaterial = null;
        state.skyGeometry = null;
    }

    function hidePmndrsHorizonEnvironmentVisuals(self) {
        if (!self || !self.el || !self.el.object3D) {
            return;
        }
        self.el.object3D.traverse(function (node) {
            if (!node || !node.isMesh || (node.userData && node.userData.vrodosPmndrsAtmosphereSky)) {
                return;
            }
            var nodeName = (typeof node.name === 'string') ? node.name.toLowerCase() : '';
            var materialName = (node.material && typeof node.material.name === 'string') ? node.material.name.toLowerCase() : '';
            var shouldHide = nodeName.indexOf('environment') > -1 ||
                nodeName.indexOf('sun') > -1 ||
                nodeName.indexOf('sky') > -1 ||
                nodeName.indexOf('atmosphere') > -1 ||
                materialName.indexOf('environment') > -1 ||
                materialName.indexOf('sun') > -1 ||
                materialName.indexOf('sky') > -1 ||
                nodeName === 'sunsphere';

            if (shouldHide) {
                node.visible = false;
            }
        });

        Array.prototype.forEach.call(document.querySelectorAll('.environmentSun, .environment-sun, .environmentSky, .environment-sky, [class*="environmentSun"], [class*="environmentSky"]'), function (node) {
            node.setAttribute('visible', 'false');
        });
    }

    function shouldUsePmndrsTakramHorizonPath(self) {
        return !!(
            self &&
            self.data &&
            self.data.selChoice === "0" &&
            self.data.postFXEngine === 'pmndrs' &&
            self.data.pmndrsAtmosphereEnabled !== '0' &&
            window.VRODOS_TAKRAM_ATMOSPHERE
        );
    }

    function formatVectorPosition(vector, distance, minY) {
        var y = vector.y * distance;
        if (typeof minY === 'number') {
            y = Math.max(minY, y);
        }
        return [
            (vector.x * distance).toFixed(2),
            y.toFixed(2),
            (vector.z * distance).toFixed(2)
        ].join(' ');
    }

    function ensurePmndrsTakramHorizonLights(self, config, preset) {
        if (!self || !config) {
            return;
        }

        var shadowEnabled = self.data.shadowQuality !== 'off';
        var shadowMap = self.data.shadowQuality === 'high' ? 2048 : 1024;
        var castShadow = shadowEnabled ? 'true' : 'false';
        var keyColor = '#fff0cf';
        var fillColor = '#cfe3ff';
        var keyIntensity = 0.96;
        var fillIntensity = 0.32;

        if (preset === 'clear') {
            keyColor = '#fff4d8';
            fillColor = '#d7e8ff';
            keyIntensity = 1.05;
            fillIntensity = 0.42;
        } else if (preset === 'crisp') {
            keyColor = '#fff2d2';
            fillColor = '#d4e4ff';
            keyIntensity = 1.0;
            fillIntensity = 0.36;
        }

        self.ensurePhotorealHelperLight(
            'vrodos-pmndrs-horizon-key-light',
            'type: directional; color: ' + keyColor + '; intensity: ' + keyIntensity.toFixed(2) + '; castShadow: ' + castShadow + '; shadowMapWidth: ' + shadowMap + '; shadowMapHeight: ' + shadowMap + '; shadowCameraTop: 28; shadowCameraRight: 28; shadowCameraLeft: -28; shadowCameraBottom: -28; shadowBias: -0.00012; shadowNormalBias: 0.02;',
            formatVectorPosition(config.sunDirection, 28, 8)
        );

        self.ensurePhotorealHelperLight(
            'vrodos-pmndrs-horizon-fill-light',
            'type: ambient; color: ' + fillColor + '; intensity: ' + fillIntensity.toFixed(2) + ';',
            '0 6 0'
        );
    }

    H.getPmndrsAtmosphereConfig = function () {
        if (!this || !this.data) {
            return null;
        }

        var quality = normalizePmndrsAtmosphereQuality(this.data.pmndrsAtmosphereQuality);
        var presetDefaults = PMNDRS_ATMOSPHERE_QUALITY_DEFAULTS[quality] || PMNDRS_ATMOSPHERE_QUALITY_DEFAULTS.balanced;
        var config = {
            enabled: this.data.postFXEngine === 'pmndrs' && this.data.pmndrsAtmosphereEnabled !== '0',
            quality: quality,
            sunElevationDeg: readPmndrsAtmosphereNumber(this, 'pmndrsSunElevationDeg', -5, 45, presetDefaults.sunElevationDeg),
            sunAzimuthDeg: readPmndrsAtmosphereNumber(this, 'pmndrsSunAzimuthDeg', -180, 180, presetDefaults.sunAzimuthDeg),
            sunDistance: readPmndrsAtmosphereNumber(this, 'pmndrsSunDistance', 1500, 20000, presetDefaults.sunDistance),
            sunAngularRadius: readPmndrsAtmosphereNumber(this, 'pmndrsSunAngularRadius', 0.002, 0.03, presetDefaults.sunAngularRadius),
            aerialStrength: readPmndrsAtmosphereNumber(this, 'pmndrsAerialStrength', 0, 1.5, presetDefaults.aerialStrength),
            albedoScale: readPmndrsAtmosphereNumber(this, 'pmndrsAlbedoScale', 0.5, 1.5, presetDefaults.albedoScale),
            transmittanceEnabled: readPmndrsAtmosphereBool(this, 'pmndrsTransmittanceEnabled', presetDefaults.transmittanceEnabled),
            inscatterEnabled: readPmndrsAtmosphereBool(this, 'pmndrsInscatterEnabled', presetDefaults.inscatterEnabled),
            groundEnabled: readPmndrsAtmosphereBool(this, 'pmndrsGroundEnabled', presetDefaults.groundEnabled),
            groundAlbedo: normalizePmndrsColor(this.data.pmndrsGroundAlbedo, presetDefaults.groundAlbedo),
            rayleighScale: readPmndrsAtmosphereNumber(this, 'pmndrsRayleighScale', 0.2, 2.5, presetDefaults.rayleighScale),
            mieScatteringScale: readPmndrsAtmosphereNumber(this, 'pmndrsMieScatteringScale', 0.1, 2.5, presetDefaults.mieScatteringScale),
            mieExtinctionScale: readPmndrsAtmosphereNumber(this, 'pmndrsMieExtinctionScale', 0.1, 2.5, presetDefaults.mieExtinctionScale),
            miePhaseG: readPmndrsAtmosphereNumber(this, 'pmndrsMiePhaseG', 0, 0.95, presetDefaults.miePhaseG),
            absorptionScale: readPmndrsAtmosphereNumber(this, 'pmndrsAbsorptionScale', 0, 2.5, presetDefaults.absorptionScale),
            moonEnabled: readPmndrsAtmosphereBool(this, 'pmndrsMoonEnabled', presetDefaults.moonEnabled)
        };

        if (this.data.selChoice === "0" && quality !== 'custom') {
            var horizonPreset = this.getHorizonSkyPreset ? this.getHorizonSkyPreset() : 'natural';
            var overrides = PMNDRS_ATMOSPHERE_HORIZON_OVERRIDES[horizonPreset] || PMNDRS_ATMOSPHERE_HORIZON_OVERRIDES.natural;
            Object.keys(overrides).forEach(function (key) {
                config[key] = overrides[key];
            });
        }

        config.sunDirection = buildPmndrsSunDirection(config.sunElevationDeg, config.sunAzimuthDeg);
        config.moonDirection = buildPmndrsMoonDirection(config.sunDirection);
        return config;
    };

    H.applyPmndrsAtmosphereConfigToTarget = function (target, config) {
        var vta = window.VRODOS_TAKRAM_ATMOSPHERE;
        if (!target || !config || !vta) {
            return;
        }

        var params = createPmndrsAtmosphereParameters(vta, config);
        copyPmndrsAtmosphereParameters(target, params);

        if (target.sunDirection && typeof target.sunDirection.copy === 'function') {
            target.sunDirection.copy(config.sunDirection);
        }
        if (target.moonDirection && typeof target.moonDirection.copy === 'function') {
            target.moonDirection.copy(config.moonDirection);
        }
        if (typeof target.ground !== 'undefined') {
            target.ground = config.groundEnabled;
        }
        if (typeof target.sun !== 'undefined') {
            target.sun = true;
        }
        if (typeof target.moon !== 'undefined') {
            target.moon = config.moonEnabled;
        }
        if (typeof target.transmittance !== 'undefined') {
            target.transmittance = config.transmittanceEnabled;
        }
        if (typeof target.inscatter !== 'undefined') {
            target.inscatter = config.inscatterEnabled;
        }
        if (typeof target.albedoScale !== 'undefined') {
            target.albedoScale = config.albedoScale;
        }
        if (target.blendMode && target.blendMode.opacity) {
            target.blendMode.opacity.value = config.aerialStrength;
        }
        ensurePmndrsWorldToEcefMatrix(target);
    };

    H.ensurePmndrsAtmosphereResources = function () {
        var renderer = this && this.el ? this.el.renderer : null;
        var scene = this && this.el ? this.el.object3D : null;
        var vta = window.VRODOS_TAKRAM_ATMOSPHERE;
        if (!renderer || !scene || !vta) {
            return null;
        }

        if (this._pmndrsAtmosphereState) {
            return this._pmndrsAtmosphereState;
        }

        var state = {
            generator: null,
            textures: null,
            promise: null,
            skyMesh: null,
            skyMaterial: null,
            skyGeometry: null,
            failed: false
        };

        try {
            state.generator = new vta.PrecomputedTexturesGenerator(renderer);
            state.textures = state.generator.textures;
            state.promise = state.generator.update().catch(function (err) {
                state.failed = true;
                console.warn('[VRodos] Takram atmosphere precompute failed, falling back to PMNDRS gradient horizon:', err);
            });
        } catch (err) {
            state.failed = true;
            console.warn('[VRodos] Takram atmosphere init failed, falling back to PMNDRS gradient horizon:', err);
        }

        this._pmndrsAtmosphereState = state;
        return state;
    };

    H.disposePmndrsAtmosphere = function () {
        if (!this || !this._pmndrsAtmosphereState) {
            return;
        }

        var state = this._pmndrsAtmosphereState;
        removePmndrsAtmosphereSky(this);

        if (state.generator && typeof state.generator.dispose === 'function') {
            try {
                state.generator.dispose();
            } catch (err) {
                console.warn('[VRodos] Takram atmosphere dispose failed:', err);
            }
        }

        this._pmndrsAtmosphereState = null;
    };

    function ensurePmndrsAtmosphereSky(self, config) {
        var state = self.ensurePmndrsAtmosphereResources ? self.ensurePmndrsAtmosphereResources() : null;
        var vta = window.VRODOS_TAKRAM_ATMOSPHERE;
        if (!state || !vta || state.failed || !state.textures || !self || !self.el || !self.el.object3D) {
            return false;
        }

        if (!state.skyMesh) {
            state.skyGeometry = new THREE.PlaneGeometry(2, 2);
            state.skyMaterial = new vta.SkyMaterial({
                irradianceTexture: state.textures.irradianceTexture || null,
                scatteringTexture: state.textures.scatteringTexture || null,
                transmittanceTexture: state.textures.transmittanceTexture || null,
                singleMieScatteringTexture: state.textures.singleMieScatteringTexture || null,
                higherOrderScatteringTexture: state.textures.higherOrderScatteringTexture || null,
                ground: config.groundEnabled,
                moon: config.moonEnabled
            });
            state.skyMesh = new THREE.Mesh(state.skyGeometry, state.skyMaterial);
            state.skyMesh.frustumCulled = false;
            state.skyMesh.renderOrder = -1000;
            state.skyMesh.userData.vrodosPmndrsAtmosphereSky = true;
            state.skyMesh.name = 'vrodosPmndrsAtmosphereSky';
            self.el.object3D.add(state.skyMesh);
        }

        if (state.skyMaterial) {
            self.applyPmndrsAtmosphereConfigToTarget(state.skyMaterial, config);
            state.skyMaterial.irradianceTexture = state.textures.irradianceTexture || null;
            state.skyMaterial.scatteringTexture = state.textures.scatteringTexture || null;
            state.skyMaterial.transmittanceTexture = state.textures.transmittanceTexture || null;
            state.skyMaterial.singleMieScatteringTexture = state.textures.singleMieScatteringTexture || null;
            state.skyMaterial.higherOrderScatteringTexture = state.textures.higherOrderScatteringTexture || null;
            state.skyMaterial.needsUpdate = true;
        }

        if (state.skyMesh) {
            state.skyMesh.visible = true;
        }

        return true;
    }

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
                depthTest: false,
                fog: false
            });
            material.toneMapped = false;
            sprite = new THREE.Sprite(material);
            sprite.frustumCulled = false;
            sprite.renderOrder = 9998;
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
            removePmndrsAtmosphereSky(this);
            clearPmndrsHorizonSun(this);
            return;
        }

        var atmosphereConfig = this.getPmndrsAtmosphereConfig ? this.getPmndrsAtmosphereConfig() : null;
        if (atmosphereConfig && atmosphereConfig.enabled && window.VRODOS_TAKRAM_ATMOSPHERE) {
            clearPmndrsHorizonSun(this);
            ensurePmndrsAtmosphereSky(this, atmosphereConfig);
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

        // physicallyCorrectLights was removed in Three.js r150-r165 and is always on in r173 (A-Frame 1.7.1).
        // outputColorSpace & toneMapping are already set by A-Frame's renderer system.
        // (colorManagement: true -> SRGBColorSpace; renderer="toneMapping: ACESFilmic" in HTML)
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
        if (this.data.selChoice !== "0") {
            return;
        }

        var preset = this.getHorizonSkyPreset();
        var isPmndrs = this.data.postFXEngine === 'pmndrs';
        var usesTakramHorizon = shouldUsePmndrsTakramHorizonPath(this);
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

        if (!usesTakramHorizon) {
            this.el.setAttribute('environment', environmentConfig);
        } else if (this.el.hasAttribute('environment')) {
            this.el.removeAttribute('environment');
        }

        if (!isPmndrs) {
            this.removePhotorealHelperLights();
            removePmndrsAtmosphereSky(this);
            clearPmndrsHorizonSun(this);
            return;
        }

        var atmosphereConfig = this.getPmndrsAtmosphereConfig ? this.getPmndrsAtmosphereConfig() : null;
        if (usesTakramHorizon && atmosphereConfig && atmosphereConfig.enabled) {
            ensurePmndrsTakramHorizonLights(this, atmosphereConfig, preset);
            clearPmndrsHorizonSun(this);
            ensurePmndrsAtmosphereSky(this, atmosphereConfig);
            return;
        }

        this.removePhotorealHelperLights();

        if (atmosphereConfig && atmosphereConfig.enabled && window.VRODOS_TAKRAM_ATMOSPHERE) {
            var self = this;
            var hideEnvVisuals = function () {
                hidePmndrsHorizonEnvironmentVisuals(self);
            };
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(hideEnvVisuals);
            }
            setTimeout(hideEnvVisuals, 50);
            setTimeout(hideEnvVisuals, 200);

            clearPmndrsHorizonSun(this);
            if (ensurePmndrsAtmosphereSky(this, atmosphereConfig)) {
                return;
            }
        }

        removePmndrsAtmosphereSky(this);
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

        if (shouldUsePmndrsTakramHorizonPath(this)) {
            this.applyHorizonSkyPreset();
            return;
        }

        if (hasEnvironmentBackground && this.el.hasAttribute('environment')) {
            this.el.setAttribute('environment', 'shadow', shadowEnabled ? 'true' : 'false');
            if (this.data.selChoice === "0") {
                this.applyHorizonSkyPreset();
            } else {
                removePmndrsAtmosphereSky(this);
                clearPmndrsHorizonSun(this);
                this.el.setAttribute('environment', 'lighting', 'distant');
                this.el.setAttribute('environment', 'lightPosition', isHighQuality ? (enhancedReflections ? '0.12 1 -0.08' : (softReflections ? '0.05 1 -0.02' : '0.08 1 -0.04')) : '0 1 0');
            }
            this.removePhotorealHelperLights();
            return;
        }

        removePmndrsAtmosphereSky(this);
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
