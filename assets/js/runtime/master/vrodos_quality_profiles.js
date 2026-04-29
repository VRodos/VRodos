/**
 * VRodos Quality Profile Helpers
 * Extracted from vrodos_scene_settings.component.js
 */
(function () {
    var H = VRODOSMaster.SceneSettingsHelpers = VRODOSMaster.SceneSettingsHelpers || {};
    var TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS = 0.0047;
    var PMNDRS_ATMOSPHERE_LOOK_DEFAULTS = {
        sunrise: {
            sunElevationDeg: 6,
            sunAzimuthDeg: -55,
            sunDistance: 5200,
            sunAngularRadius: 0.0049,
            aerialStrength: 0.88,
            albedoScale: 0.96,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f0d8b8',
            rayleighScale: 1.0,
            mieScatteringScale: 0.88,
            mieExtinctionScale: 0.98,
            miePhaseG: 0.78,
            absorptionScale: 0.88,
            moonEnabled: false
        },
        midday: {
            sunElevationDeg: 62,
            sunAzimuthDeg: 20,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.55,
            albedoScale: 1.0,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#d8d8d0',
            rayleighScale: 1.18,
            mieScatteringScale: 0.42,
            mieExtinctionScale: 0.56,
            miePhaseG: 0.74,
            absorptionScale: 0.94,
            moonEnabled: false
        },
        sunset: {
            sunElevationDeg: 8,
            sunAzimuthDeg: 38,
            sunDistance: 5600,
            sunAngularRadius: 0.0049,
            aerialStrength: 1.02,
            albedoScale: 0.96,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#f2cda8',
            rayleighScale: 0.96,
            mieScatteringScale: 1.08,
            mieExtinctionScale: 1.18,
            miePhaseG: 0.82,
            absorptionScale: 0.86,
            moonEnabled: false
        },
        night: {
            sunElevationDeg: -8,
            sunAzimuthDeg: 25,
            sunDistance: 5200,
            sunAngularRadius: 0.0044,
            aerialStrength: 0.28,
            albedoScale: 0.82,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#4e5870',
            rayleighScale: 0.66,
            mieScatteringScale: 0.32,
            mieExtinctionScale: 0.46,
            miePhaseG: 0.7,
            absorptionScale: 1.14,
            moonEnabled: true
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
            case 'balanced':
            case 'quality':
            case 'cinematic':
                return value;
            default:
                return 'balanced';
        }
    }

    function normalizePmndrsAtmospherePreset(value) {
        switch (value) {
            case 'sunrise':
            case 'sunset':
            case 'night':
            case 'custom':
                return value;
            default:
                return 'midday';
        }
    }

    function lerpNumber(a, b, t) {
        return a + ((b - a) * t);
    }

    function lerpPmndrsColor(fromHex, toHex, t) {
        function hexToRgb(hex) {
            var normalized = normalizePmndrsColor(hex, '#000000');
            return {
                r: parseInt(normalized.slice(1, 3), 16),
                g: parseInt(normalized.slice(3, 5), 16),
                b: parseInt(normalized.slice(5, 7), 16)
            };
        }
        function toHex(value) {
            var clamped = Math.max(0, Math.min(255, Math.round(value)));
            return clamped.toString(16).padStart(2, '0');
        }
        var from = hexToRgb(fromHex);
        var to = hexToRgb(toHex);
        return '#' +
            toHex(lerpNumber(from.r, to.r, t)) +
            toHex(lerpNumber(from.g, to.g, t)) +
            toHex(lerpNumber(from.b, to.b, t));
    }

    function getPmndrsAtmosphereLookDefaults(preset, intensity) {
        var midday = PMNDRS_ATMOSPHERE_LOOK_DEFAULTS.midday;
        var resolvedPreset = normalizePmndrsAtmospherePreset(preset);
        var target = PMNDRS_ATMOSPHERE_LOOK_DEFAULTS[resolvedPreset] || midday;
        var blend = clampPmndrsNumber(intensity, 0, 1, 1);

        if (resolvedPreset === 'midday' || resolvedPreset === 'custom') {
            blend = 1;
            target = midday;
        }

        return {
            sunElevationDeg: lerpNumber(midday.sunElevationDeg, target.sunElevationDeg, blend),
            sunAzimuthDeg: lerpNumber(midday.sunAzimuthDeg, target.sunAzimuthDeg, blend),
            sunDistance: lerpNumber(midday.sunDistance, target.sunDistance, blend),
            sunAngularRadius: lerpNumber(midday.sunAngularRadius, target.sunAngularRadius, blend),
            aerialStrength: lerpNumber(midday.aerialStrength, target.aerialStrength, blend),
            albedoScale: lerpNumber(midday.albedoScale, target.albedoScale, blend),
            transmittanceEnabled: blend < 0.5 ? midday.transmittanceEnabled : target.transmittanceEnabled,
            inscatterEnabled: blend < 0.5 ? midday.inscatterEnabled : target.inscatterEnabled,
            groundEnabled: blend < 0.5 ? midday.groundEnabled : target.groundEnabled,
            groundAlbedo: lerpPmndrsColor(midday.groundAlbedo, target.groundAlbedo, blend),
            rayleighScale: lerpNumber(midday.rayleighScale, target.rayleighScale, blend),
            mieScatteringScale: lerpNumber(midday.mieScatteringScale, target.mieScatteringScale, blend),
            mieExtinctionScale: lerpNumber(midday.mieExtinctionScale, target.mieExtinctionScale, blend),
            miePhaseG: lerpNumber(midday.miePhaseG, target.miePhaseG, blend),
            absorptionScale: lerpNumber(midday.absorptionScale, target.absorptionScale, blend),
            moonEnabled: blend >= 0.5 && target.moonEnabled === true
        };
    }

    function getPmndrsAtmosphereResourceProfile(self, renderer) {
        var quality = normalizePmndrsAtmosphereQuality(self && self.data ? self.data.pmndrsAtmosphereQuality : 'balanced');
        var supportsFloatLinear = !!(renderer && renderer.extensions && renderer.extensions.get('OES_texture_float_linear'));
        var canUseFloat = !!(
            renderer &&
            renderer.capabilities &&
            renderer.capabilities.isWebGL2 &&
            typeof THREE.FloatType !== 'undefined' &&
            supportsFloatLinear
        );
        var wantsHighPrecision = quality === 'quality' || quality === 'cinematic' || quality === 'custom' || quality === 'balanced';
        var type = wantsHighPrecision ? THREE.FloatType : THREE.HalfFloatType;
        var higherOrderScattering = quality !== 'performance';
        // Stay aligned with Takram's default precompute path and only scale the
        // precision/performance envelope around it.
        var combinedScattering = true;

        return {
            quality: quality,
            type: type,
            useFloat: type === THREE.FloatType,
            higherOrderScattering: higherOrderScattering,
            combinedScattering: combinedScattering,
            signature: [
                quality,
                type === THREE.FloatType ? 'float' : 'half',
                higherOrderScattering ? 'higher' : 'basic',
                combinedScattering ? 'combined' : 'split'
            ].join(':')
        };
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

    function buildPmndrsLocalSunDirection(elevationDeg, azimuthDeg) {
        var elevation = THREE.MathUtils.degToRad(elevationDeg);
        var azimuth = THREE.MathUtils.degToRad(azimuthDeg);
        var cosElevation = Math.cos(elevation);
        return new THREE.Vector3(
            Math.sin(azimuth) * cosElevation,
            Math.sin(elevation),
            -Math.cos(azimuth) * cosElevation
        ).normalize();
    }

    function buildPmndrsEcefSunDirection(localSunDirection) {
        if (!localSunDirection) {
            return new THREE.Vector3(0, 1, 0);
        }

        // VRodos authored worlds use X=east, Y=up, Z=south so that -Z is the
        // natural forward/north-ish direction. Takram expects sunDirection in
        // ECEF space, so we mirror X/Z into the ECEF frame anchored below.
        return new THREE.Vector3(
            -localSunDirection.x,
            localSunDirection.y,
            -localSunDirection.z
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

        var equatorialRadius = null;
        if (target.ellipsoid && target.ellipsoid.radii) {
            equatorialRadius = Math.max(
                target.ellipsoid.radii.x || 0,
                target.ellipsoid.radii.y || 0
            );
        }

        if (!equatorialRadius && window.VRODOS_TAKRAM_ATMOSPHERE && window.VRODOS_TAKRAM_ATMOSPHERE.Ellipsoid && window.VRODOS_TAKRAM_ATMOSPHERE.Ellipsoid.WGS84) {
            equatorialRadius = Math.max(
                window.VRODOS_TAKRAM_ATMOSPHERE.Ellipsoid.WGS84.radii.x || 0,
                window.VRODOS_TAKRAM_ATMOSPHERE.Ellipsoid.WGS84.radii.y || 0
            );
        }

        if (!equatorialRadius || !isFinite(equatorialRadius)) {
            equatorialRadius = 6378137;
        }

        // Takram expects an orthogonal world -> ECEF transform. VRodos authored
        // scenes use X=east, Y=up, Z=south (so -Z behaves like "forward"), so
        // we anchor the local origin onto an actual WGS84 surface point near the
        // equator and provide the matching rotation instead of translation alone.
        // Using atmosphere.bottomRadius here is wrong because Takram's altitude
        // correction then pushes the camera below the ground sphere, which shows
        // up as a giant fake horizon dome.
        matrix.makeBasis(
            new THREE.Vector3(-1, 0, 0), // local +X (east) -> ECEF west at +Y anchor
            new THREE.Vector3(0, 1, 0),  // local +Y (up)   -> ECEF up
            new THREE.Vector3(0, 0, -1)  // local +Z (south)-> ECEF south
        ).setPosition(0, equatorialRadius, 0);
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

        if (target.groundAlbedo && typeof target.groundAlbedo.copy === 'function') {
            target.groundAlbedo.copy(params.groundAlbedo);
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

        if (target.uniforms && target.uniforms.groundAlbedo && target.uniforms.groundAlbedo.value && typeof target.uniforms.groundAlbedo.value.copy === 'function') {
            target.uniforms.groundAlbedo.value.copy(params.groundAlbedo);
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

    function setPmndrsAtmosphereSkyVisibility(self, visible) {
        if (!self || !self._pmndrsAtmosphereState || !self._pmndrsAtmosphereState.skyMesh) {
            return false;
        }

        self._pmndrsAtmosphereState.skyMesh.visible = !!visible;
        return true;
    }

    function isPmndrsAtmosphereSkyVisible(self) {
        return !!(self &&
            self._pmndrsAtmosphereState &&
            self._pmndrsAtmosphereState.skyMesh &&
            self._pmndrsAtmosphereState.skyMesh.visible);
    }

    function hasPmndrsLegacyEnvironmentToken(value) {
        if (typeof value !== 'string' || !value) {
            return false;
        }

        var normalized = value.toLowerCase();
        return normalized.indexOf('environment') > -1 ||
            normalized.indexOf('atmosphere') > -1 ||
            normalized === 'sky' ||
            normalized === 'sun' ||
            normalized === 'sunsphere' ||
            normalized === 'skybox' ||
            normalized === 'skydome';
    }

    function getPmndrsLegacyEnvironmentClassName(el) {
        if (!el) {
            return '';
        }

        if (typeof el.className === 'string') {
            return el.className.toLowerCase();
        }

        if (el.getAttribute) {
            return String(el.getAttribute('class') || '').toLowerCase();
        }

        return '';
    }

    function isPmndrsLegacyEnvironmentElement(el) {
        if (!el) {
            return false;
        }

        var id = (typeof el.id === 'string' ? el.id : '').toLowerCase();
        var tagName = (typeof el.tagName === 'string' ? el.tagName : '').toLowerCase();
        var className = getPmndrsLegacyEnvironmentClassName(el);

        if (tagName === 'a-sun-sky' || tagName === 'a-sky') {
            return true;
        }

        if (id === 'default-sky' ||
            id === 'default-sun' ||
            id === 'vrodos-pmndrs-sun' ||
            id === 'vrodos-pmndrs-sun-haze') {
            return true;
        }

        if (el.hasAttribute &&
            (el.hasAttribute('data-vrodos-preset-sky') ||
             el.hasAttribute('data-vrodos-pmndrs-sun'))) {
            return true;
        }

        return className.indexOf('environmentsun') > -1 ||
            className.indexOf('environment-sun') > -1 ||
            className.indexOf('environmentsky') > -1 ||
            className.indexOf('environment-sky') > -1;
    }

    function isPmndrsLegacyEnvironmentVisualNode(node) {
        if (!node || (node.userData && node.userData.vrodosPmndrsAtmosphereSky)) {
            return false;
        }

        if (isPmndrsLegacyEnvironmentElement(node.el)) {
            return true;
        }

        var material = Array.isArray(node.material) ? node.material[0] : node.material;
        var uniforms = material && material.uniforms ? material.uniforms : null;
        if (uniforms && (uniforms.sunPosition || uniforms.sunposition || uniforms.sun_direction)) {
            return true;
        }

        var nodeName = (typeof node.name === 'string') ? node.name : '';
        var materialName = (material && typeof material.name === 'string') ? material.name : '';
        return hasPmndrsLegacyEnvironmentToken(nodeName) || hasPmndrsLegacyEnvironmentToken(materialName);
    }

    function schedulePmndrsHorizonEnvironmentCleanup(self) {
        if (!self) {
            return;
        }

        var hideEnvVisuals = function () {
            hidePmndrsHorizonEnvironmentVisuals(self);
        };

        hideEnvVisuals();
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(hideEnvVisuals);
        }
        setTimeout(hideEnvVisuals, 50);
        setTimeout(hideEnvVisuals, 200);
    }

    function formatPmndrsSunDirectionForLog(direction) {
        if (!direction) {
            return 'n/a';
        }

        return [
            direction.x.toFixed(3),
            direction.y.toFixed(3),
            direction.z.toFixed(3)
        ].join(',');
    }

    function logPmndrsHorizonDiagnostic(self, context, atmosphereConfig) {
        if (!self || !self.data || !context) {
            return;
        }

        var reflectionSource = (typeof self.getEffectiveReflectionSource === 'function')
            ? self.getEffectiveReflectionSource()
            : (self.data.reflectionSource || 'hdr');
        var owner = atmosphereConfig && atmosphereConfig.enabled && shouldUsePmndrsHorizonAerialPerspectivePath(self)
            ? 'takram-aerial-effect'
            : (atmosphereConfig && atmosphereConfig.enabled && shouldUsePmndrsTakramHorizonPath(self)
                ? 'takram-sky'
                : (atmosphereConfig && atmosphereConfig.enabled ? 'takram-fallback' : 'legacy-fallback'));
        var signature = [
            context,
            owner,
            reflectionSource,
            atmosphereConfig && atmosphereConfig.groundEnabled ? 'ground-on' : 'ground-off',
            atmosphereConfig && atmosphereConfig.takramSunEnabled === false ? 'sun-off' : 'sun-on',
            formatPmndrsSunDirectionForLog(atmosphereConfig && atmosphereConfig.sunDirection ? atmosphereConfig.sunDirection : null)
        ].join('|');

        self._pmndrsHorizonDiagSignatures = self._pmndrsHorizonDiagSignatures || {};
        if (self._pmndrsHorizonDiagSignatures[context] === signature) {
            return;
        }

        self._pmndrsHorizonDiagSignatures[context] = signature;
        console.info('[VRodos] PMNDRS horizon diagnostic (' + context + '): owner=' + owner +
            ', reflection=' + reflectionSource +
            ', ground=' + (atmosphereConfig && atmosphereConfig.groundEnabled ? 'on' : 'off') +
            ', sun=' + (atmosphereConfig && atmosphereConfig.takramSunEnabled === false ? 'off' : 'on') +
            ', sunDir=' + formatPmndrsSunDirectionForLog(atmosphereConfig && atmosphereConfig.sunDirection ? atmosphereConfig.sunDirection : null));
    }

    function hidePmndrsHorizonEnvironmentVisuals(self) {
        if (!self || !self.el || !self.el.object3D) {
            return;
        }
        self.el.object3D.traverse(function (node) {
            if (!node || (node.userData && node.userData.vrodosPmndrsAtmosphereSky)) {
                return;
            }

            if (isPmndrsLegacyEnvironmentVisualNode(node)) {
                node.visible = false;
                node.userData = node.userData || {};
                node.userData.vrodosPmndrsLegacySuppressed = true;
            }
        });

        Array.prototype.forEach.call(document.querySelectorAll('#default-sky, #default-sun, #vrodos-pmndrs-sun, #vrodos-pmndrs-sun-haze, a-sun-sky, a-sky[data-vrodos-preset-sky=\"true\"], .environmentSun, .environment-sun, .environmentSky, .environment-sky, [class*=\"environmentSun\"], [class*=\"environmentSky\"]'), function (node) {
            if (node && typeof node.setAttribute === 'function') {
                node.setAttribute('visible', 'false');
            }
        });
    }

    function removeLegacySunSkyEntitiesForPmndrs(self) {
        if (!self || !self.el) {
            return;
        }

        Array.prototype.forEach.call(self.el.querySelectorAll('a-sun-sky, a-sky[data-vrodos-preset-sky="true"], #default-sky, #default-sun, #vrodos-pmndrs-sun, #vrodos-pmndrs-sun-haze, [material*="sunPosition"], [material*="sunposition"]'), function (sunSkyEl) {
            if (sunSkyEl && typeof sunSkyEl.removeObject3D === 'function') {
                try {
                    sunSkyEl.removeObject3D('mesh');
                } catch (err) {
                    // Ignore cleanup failures; we still remove the DOM node below.
                }
            }

            if (sunSkyEl && sunSkyEl.parentNode) {
                sunSkyEl.parentNode.removeChild(sunSkyEl);
            }
        });

        if (self.el.object3D) {
            self.el.object3D.traverse(function (node) {
                if (!node) {
                    return;
                }

                if (isPmndrsLegacyEnvironmentVisualNode(node)) {
                    node.visible = false;
                    node.userData = node.userData || {};
                    node.userData.vrodosPmndrsLegacySuppressed = true;
                }
            });
        }
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

    function shouldUsePmndrsHorizonAerialPerspectivePath(self) {
        return shouldUsePmndrsTakramHorizonPath(self) &&
            hasPmndrsDebugFlag('enablePmndrsHorizonAerial', 'vrodos_debug_enable_pmndrs_horizon_aerial');
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
            'type: directional; color: ' + keyColor + '; intensity: ' + keyIntensity.toFixed(2) + '; castShadow: ' + castShadow + '; shadowMapWidth: ' + shadowMap + '; shadowMapHeight: ' + shadowMap + '; shadowCameraTop: 28; shadowCameraRight: 28; shadowCameraLeft: -28; shadowCameraBottom: -28; shadowBias: -0.00012;',
            formatVectorPosition(config.localSunDirection || config.sunDirection, 28, 8)
        );

        self.ensurePhotorealHelperLight(
            'vrodos-pmndrs-horizon-fill-light',
            'type: ambient; color: ' + fillColor + '; intensity: ' + fillIntensity.toFixed(2) + ';',
            '0 6 0'
        );
    }

    function isPmndrsTakramLocalHorizonMode(self) {
        return !!(self && self.data && self.data.selChoice === "0");
    }

    function applyPmndrsTakramLocalHorizonConstraints(self, config) {
        if (!config) {
            return config;
        }

        var experimentalHorizonAerial = shouldUsePmndrsHorizonAerialPerspectivePath(self);

        // Current local-world constraints. Later phases will replace the helper
        // lights and visible-sun workaround with Takram's own light-source path,
        // but this keeps the behavior centralized so the migration is contained.
        config.groundEnabled = false;
        config.takramSunEnabled = experimentalHorizonAerial;
        config.sunAngularRadius = TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS;
        return config;
    }

    function resetPmndrsTakramHorizonState(state) {
        if (!state) {
            return state;
        }

        state.mode = 'inactive';
        state.owner = 'none';
        state.usesTakramGround = false;
        state.usesTakramSunDisk = false;
        state.usesTakramLightSources = false;
        state.groundEnabled = false;
        state.takramSunEnabled = false;
        state.localSunDirection.set(0, 0, 0);
        state.sunDirectionECEF.set(0, 0, 0);
        state.moonDirectionECEF.set(0, 0, 0);
        state.anchorPositionECEF.set(0, 0, 0);
        state.worldToECEFMatrix.identity();
        return state;
    }

    function ensurePmndrsTakramHorizonState(self) {
        if (!self) {
            return null;
        }

        if (!self._pmndrsTakramHorizonState) {
            self._pmndrsTakramHorizonState = {
                mode: 'inactive',
                owner: 'none',
                anchorPositionECEF: new THREE.Vector3(),
                worldToECEFMatrix: new THREE.Matrix4(),
                localSunDirection: new THREE.Vector3(),
                sunDirectionECEF: new THREE.Vector3(),
                moonDirectionECEF: new THREE.Vector3(),
                usesTakramGround: false,
                usesTakramSunDisk: false,
                usesTakramLightSources: false,
                groundEnabled: false,
                takramSunEnabled: false
            };
        }

        return self._pmndrsTakramHorizonState;
    }

    function syncPmndrsTakramHorizonState(self, config) {
        var state = ensurePmndrsTakramHorizonState(self);
        if (!state) {
            return null;
        }

        if (!(config && config.enabled && isPmndrsTakramLocalHorizonMode(self))) {
            return resetPmndrsTakramHorizonState(state);
        }

        // This phase intentionally keeps the current Horizon path in a prep
        // state: Takram owns the atmosphere config and frame data, while the
        // full Takram light-source swap lands in a later phase.
        state.mode = 'local-light-source-prep';
        state.owner = 'takram-config-prep';
        state.groundEnabled = !!config.groundEnabled;
        state.takramSunEnabled = config.takramSunEnabled !== false;
        state.usesTakramGround = !!config.groundEnabled;
        state.usesTakramSunDisk = config.takramSunEnabled !== false;
        state.usesTakramLightSources = false;

        if (config.localSunDirection) {
            state.localSunDirection.copy(config.localSunDirection);
        }
        if (config.sunDirection) {
            state.sunDirectionECEF.copy(config.sunDirection);
        }
        if (config.moonDirection) {
            state.moonDirectionECEF.copy(config.moonDirection);
        }

        ensurePmndrsWorldToEcefMatrix(state);
        state.anchorPositionECEF.setFromMatrixPosition(state.worldToECEFMatrix);
        return state;
    }

    H.getPmndrsTakramHorizonState = function () {
        return ensurePmndrsTakramHorizonState(this);
    };

    H.getPmndrsAtmosphereConfig = function () {
        if (!this || !this.data) {
            return null;
        }

        var quality = normalizePmndrsAtmosphereQuality(this.data.pmndrsAtmosphereQuality);
        var preset = normalizePmndrsAtmospherePreset(this.data.pmndrsAtmospherePreset);
        var presetIntensity = readPmndrsAtmosphereNumber(this, 'pmndrsAtmospherePresetIntensity', 0, 1, 1);
        var presetDefaults = getPmndrsAtmosphereLookDefaults(preset, presetIntensity);
        var usesCustomValues = preset === 'custom';
        var config = {
            enabled: this.data.postFXEngine === 'pmndrs' && this.data.pmndrsAtmosphereEnabled !== '0',
            preset: preset,
            presetIntensity: presetIntensity,
            quality: quality,
            sunElevationDeg: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsSunElevationDeg', -10, 85, presetDefaults.sunElevationDeg) : presetDefaults.sunElevationDeg,
            sunAzimuthDeg: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsSunAzimuthDeg', -180, 180, presetDefaults.sunAzimuthDeg) : presetDefaults.sunAzimuthDeg,
            sunDistance: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsSunDistance', 1500, 20000, presetDefaults.sunDistance) : presetDefaults.sunDistance,
            sunAngularRadius: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsSunAngularRadius', 0.002, 0.03, presetDefaults.sunAngularRadius) : presetDefaults.sunAngularRadius,
            aerialStrength: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsAerialStrength', 0, 2, presetDefaults.aerialStrength) : presetDefaults.aerialStrength,
            albedoScale: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsAlbedoScale', 0, 2, presetDefaults.albedoScale) : presetDefaults.albedoScale,
            transmittanceEnabled: usesCustomValues ? readPmndrsAtmosphereBool(this, 'pmndrsTransmittanceEnabled', presetDefaults.transmittanceEnabled) : presetDefaults.transmittanceEnabled,
            inscatterEnabled: usesCustomValues ? readPmndrsAtmosphereBool(this, 'pmndrsInscatterEnabled', presetDefaults.inscatterEnabled) : presetDefaults.inscatterEnabled,
            groundEnabled: usesCustomValues ? readPmndrsAtmosphereBool(this, 'pmndrsGroundEnabled', presetDefaults.groundEnabled) : presetDefaults.groundEnabled,
            groundAlbedo: usesCustomValues ? normalizePmndrsColor(this.data.pmndrsGroundAlbedo, presetDefaults.groundAlbedo) : presetDefaults.groundAlbedo,
            rayleighScale: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsRayleighScale', 0.1, 3, presetDefaults.rayleighScale) : presetDefaults.rayleighScale,
            mieScatteringScale: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsMieScatteringScale', 0.1, 3, presetDefaults.mieScatteringScale) : presetDefaults.mieScatteringScale,
            mieExtinctionScale: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsMieExtinctionScale', 0.1, 3, presetDefaults.mieExtinctionScale) : presetDefaults.mieExtinctionScale,
            miePhaseG: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsMiePhaseG', 0, 0.99, presetDefaults.miePhaseG) : presetDefaults.miePhaseG,
            absorptionScale: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsAbsorptionScale', 0.1, 3, presetDefaults.absorptionScale) : presetDefaults.absorptionScale,
            moonEnabled: usesCustomValues ? readPmndrsAtmosphereBool(this, 'pmndrsMoonEnabled', presetDefaults.moonEnabled) : presetDefaults.moonEnabled,
            takramSunEnabled: true
        };

        if (isPmndrsTakramLocalHorizonMode(this)) {
            applyPmndrsTakramLocalHorizonConstraints(this, config);
        }

        config.localSunDirection = buildPmndrsLocalSunDirection(config.sunElevationDeg, config.sunAzimuthDeg);
        config.sunDirection = buildPmndrsEcefSunDirection(config.localSunDirection);
        config.moonDirection = buildPmndrsMoonDirection(config.sunDirection);
        syncPmndrsTakramHorizonState(this, config);
        return config;
    };

    H.applyPmndrsAtmosphereConfigToTarget = function (target, config) {
        var vta = window.VRODOS_TAKRAM_ATMOSPHERE;
        if (!target || !config || !vta) {
            return;
        }

        var params = createPmndrsAtmosphereParameters(vta, config);
        copyPmndrsAtmosphereParameters(target, params);

        if (typeof config.sunAngularRadius !== 'undefined') {
            if (target.atmosphere) target.atmosphere.sunAngularRadius = config.sunAngularRadius;
            if (typeof target.sunAngularRadius !== 'undefined') target.sunAngularRadius = config.sunAngularRadius;
            if (target.uniforms) {
                var atmpsVal = null;
                if (typeof target.uniforms.has === 'function' && target.uniforms.has('ATMOSPHERE')) {
                    atmpsVal = target.uniforms.get('ATMOSPHERE').value;
                } else if (target.uniforms.ATMOSPHERE) {
                    atmpsVal = target.uniforms.ATMOSPHERE.value;
                }
                
                if (atmpsVal && typeof atmpsVal.sun_angular_radius !== 'undefined') {
                    atmpsVal.sun_angular_radius = config.sunAngularRadius;
                }
            }
        }

        if (target.sunDirection && typeof target.sunDirection.copy === 'function') {
            target.sunDirection.copy(config.sunDirection);
        }
        if (target.moonDirection && typeof target.moonDirection.copy === 'function') {
            target.moonDirection.copy(config.moonDirection);
        }
        if (typeof target.ground !== 'undefined') {
            target.ground = config.groundEnabled;
        }

        var setDefine = function (defs, key, val) {
            if (defs && typeof defs.set === 'function') {
                if (defs.get(key) !== val) { defs.set(key, val); return true; }
            } else if (defs) {
                if (defs[key] !== val) { defs[key] = val; return true; }
            }
            return false;
        };
        var removeDefine = function (defs, key) {
            if (defs && typeof defs.delete === 'function') {
                if (defs.has(key)) { defs.delete(key); return true; }
            } else if (defs) {
                if (defs[key]) { delete defs[key]; return true; }
            }
            return false;
        };

        target.sun = config.takramSunEnabled !== false;
        if (target.sun) {
            target.defines = target.defines || {};
            var needsRecompile = false;
            if (setDefine(target.defines, "SUN", "1")) needsRecompile = true;
            if (setDefine(target.defines, "PERSPECTIVE_CAMERA", "1")) needsRecompile = true;
            if (needsRecompile) {
                target.needsUpdate = true;
                if (typeof target.setChanged === 'function') target.setChanged();
            }
        } else if (!target.sun && target.defines) {
            if (removeDefine(target.defines, "SUN")) {
                target.needsUpdate = true;
                if (typeof target.setChanged === 'function') target.setChanged();
            }
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

        var profile = getPmndrsAtmosphereResourceProfile(this, renderer);

        if (this._pmndrsAtmosphereState && this._pmndrsAtmosphereState.profileSignature === profile.signature) {
            return this._pmndrsAtmosphereState;
        }

        if (this._pmndrsAtmosphereState) {
            this.disposePmndrsAtmosphere();
        }

        var state = {
            generator: null,
            textures: null,
            promise: null,
            skyMesh: null,
            skyMaterial: null,
            skyGeometry: null,
            failed: false,
            profileSignature: profile.signature,
            precision: profile.useFloat ? 'float' : 'half'
        };

        try {
            state.generator = new vta.PrecomputedTexturesGenerator(renderer, {
                type: profile.type,
                combinedScattering: profile.combinedScattering,
                higherOrderScattering: profile.higherOrderScattering
            });
            state.textures = state.generator.textures;
            state.promise = state.generator.update().catch(function (err) {
                state.failed = true;
                console.warn('[VRodos] Takram atmosphere precompute failed, falling back to PMNDRS gradient horizon:', err);
            });
        } catch (err) {
            if (profile.useFloat && typeof THREE.HalfFloatType !== 'undefined') {
                try {
                    state.generator = new vta.PrecomputedTexturesGenerator(renderer, {
                        type: THREE.HalfFloatType,
                        combinedScattering: profile.combinedScattering,
                        higherOrderScattering: profile.higherOrderScattering
                    });
                    state.textures = state.generator.textures;
                    state.precision = 'half-fallback';
                    state.profileSignature = profile.quality + ':half:' + (profile.higherOrderScattering ? 'higher' : 'basic') + ':' + (profile.combinedScattering ? 'combined' : 'split');
                    state.promise = state.generator.update().catch(function (fallbackErr) {
                        state.failed = true;
                        console.warn('[VRodos] Takram atmosphere precompute failed, falling back to PMNDRS gradient horizon:', fallbackErr);
                    });
                } catch (fallbackErr) {
                    state.failed = true;
                    console.warn('[VRodos] Takram atmosphere init failed, falling back to PMNDRS gradient horizon:', fallbackErr);
                }
            } else {
                state.failed = true;
                console.warn('[VRodos] Takram atmosphere init failed, falling back to PMNDRS gradient horizon:', err);
            }
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
                groundAlbedo: new THREE.Color(config.groundAlbedo),
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
            state.skyMaterial.dithering = true;
            state.skyMaterial.needsUpdate = true;
        }

        if (state.skyMesh) {
            state.skyMesh.visible = true;
        }

        return true;
    }

    function showPmndrsAtmosphereSkyForSceneProbe(self, config) {
        var wasVisible = isPmndrsAtmosphereSkyVisible(self);
        if (!ensurePmndrsAtmosphereSky(self, config)) {
            return false;
        }

        setPmndrsAtmosphereSkyVisibility(self, true);
        return !wasVisible;
    }

    function hidePmndrsAtmosphereSky(self) {
        setPmndrsAtmosphereSkyVisibility(self, false);
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
        if (lightPosition && typeof lightPosition === 'object') {
            if (lightPosition.isVector3 && typeof lightPosition.clone === 'function') {
                return lightPosition.clone().normalize();
            }
            if (typeof lightPosition.x === 'number' && typeof lightPosition.y === 'number' && typeof lightPosition.z === 'number') {
                return new THREE.Vector3(lightPosition.x, lightPosition.y, lightPosition.z).normalize();
            }
        }

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
        gradient.addColorStop(0.0, 'rgba(255,253,246,1)');
        gradient.addColorStop(0.46, 'rgba(255,245,226,0.98)');
        gradient.addColorStop(0.74, 'rgba(255,232,192,0.84)');
        gradient.addColorStop(0.9, 'rgba(255,214,168,0.16)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        self._pmndrsSunTexture = new THREE.CanvasTexture(canvas);
        self._pmndrsSunTexture.generateMipmaps = false;
        self._pmndrsSunTexture.minFilter = THREE.LinearFilter;
        self._pmndrsSunTexture.magFilter = THREE.LinearFilter;
        self._pmndrsSunTexture.needsUpdate = true;
        return self._pmndrsSunTexture;
    }

    function createPmndrsSunHazeTexture(self) {
        if (!self || self._pmndrsSunHazeTexture || typeof document === 'undefined') {
            return self ? self._pmndrsSunHazeTexture : null;
        }

        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;

        var ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        var gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0.0, 'rgba(255,220,170,0.42)');
        gradient.addColorStop(0.24, 'rgba(255,206,156,0.3)');
        gradient.addColorStop(0.48, 'rgba(255,188,136,0.16)');
        gradient.addColorStop(0.72, 'rgba(255,170,122,0.06)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Tiny alpha dithering in the baked haze texture avoids visible rings
        // after tone mapping at dusk while preserving a smooth glow.
        var image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = image.data;
        for (var i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
                var jitter = ((Math.random() * 2) - 1) * 10;
                var a = data[i + 3] + jitter;
                data[i + 3] = a < 0 ? 0 : (a > 255 ? 255 : a);
            }
        }
        ctx.putImageData(image, 0, 0);

        self._pmndrsSunHazeTexture = new THREE.CanvasTexture(canvas);
        self._pmndrsSunHazeTexture.generateMipmaps = false;
        self._pmndrsSunHazeTexture.minFilter = THREE.LinearFilter;
        self._pmndrsSunHazeTexture.magFilter = THREE.LinearFilter;
        self._pmndrsSunHazeTexture.needsUpdate = true;
        return self._pmndrsSunHazeTexture;
    }

    function getPmndrsHorizonSunConfig(preset, mode) {
        var atmosphereMode = mode === 'atmosphere';
        switch (preset) {
            case 'clear':
                return {
                    scale: atmosphereMode ? 42 : 95,
                    color: atmosphereMode ? '#fff6d8' : '#fff3c7',
                    distance: 5400,
                    intensity: atmosphereMode ? 4.6 : 4.0,
                    hazeScale: atmosphereMode ? 190 : 0,
                    hazeIntensity: atmosphereMode ? 1.3 : 0
                };
            case 'crisp':
                return {
                    scale: atmosphereMode ? 46 : 108,
                    color: atmosphereMode ? '#fff2cc' : '#fff0bc',
                    distance: 5300,
                    intensity: atmosphereMode ? 4.9 : 4.0,
                    hazeScale: atmosphereMode ? 210 : 0,
                    hazeIntensity: atmosphereMode ? 1.45 : 0
                };
            default:
                return {
                    scale: atmosphereMode ? 50 : 120,
                    color: atmosphereMode ? '#ffefc9' : '#ffedb2',
                    distance: 5200,
                    intensity: atmosphereMode ? 5.2 : 4.0,
                    hazeScale: atmosphereMode ? 230 : 0,
                    hazeIntensity: atmosphereMode ? 1.6 : 0
                };
        }
    }

    function clearPmndrsHorizonSun(self) {
        if (!self) {
            return;
        }

        var oldSun = document.getElementById('vrodos-pmndrs-sun');
        if (oldSun && oldSun.parentNode) {
            oldSun.parentNode.removeChild(oldSun);
        }
        var oldSunHaze = document.getElementById('vrodos-pmndrs-sun-haze');
        if (oldSunHaze && oldSunHaze.parentNode) {
            oldSunHaze.parentNode.removeChild(oldSunHaze);
        }
        var visibleTakramSun = document.getElementById('vrodos-takram-visible-sun');
        if (visibleTakramSun && visibleTakramSun.parentNode) {
            visibleTakramSun.parentNode.removeChild(visibleTakramSun);
        }
        self._pmndrsSunDirection = null;
        self._pmndrsSunDistance = null;
    }

    function shouldDisablePmndrsVisibleSunDebug() {
        if (window.VRODOS_DEBUG && window.VRODOS_DEBUG.disablePmndrsSunSprite === true) {
            return true;
        }

        if (typeof window.location === 'undefined' || !window.location.search) {
            return false;
        }

        try {
            var params = new URLSearchParams(window.location.search);
            return params.get('vrodos_debug_disable_pmndrs_sun') === '1';
        } catch (err) {
            return false;
        }
    }

    function ensurePmndrsTakramVisibleSun(self, config, preset) {
        if (!self || !self.el || !config || typeof document === 'undefined') {
            return;
        }

        if (shouldDisablePmndrsVisibleSunDebug()) {
            clearPmndrsHorizonSun(self);
            return;
        }

        var sunEl = document.getElementById('vrodos-takram-visible-sun');
        if (!sunEl) {
            sunEl = document.createElement('a-entity');
            sunEl.setAttribute('id', 'vrodos-takram-visible-sun');
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
                alphaTest: 0.001,
                blending: THREE.NormalBlending,
                depthWrite: false,
                depthTest: true,
                fog: false
            });
            material.toneMapped = false;
            material.name = 'vrodosTakramDiscMaterial';
            sprite = new THREE.Sprite(material);
            sprite.frustumCulled = false;
            sprite.renderOrder = 10;
            sprite.name = 'vrodosTakramDiscSprite';
            sunEl.setObject3D('mesh', sprite);
        }

        var cfg = getPmndrsHorizonSunConfig(preset, 'fallback');
        var takramSunScale = Math.max(18, Math.min(52, 30 * (config.sunAngularRadius / TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS)));
        sprite.scale.set(takramSunScale, takramSunScale, 1);
        sprite.material.color.set(cfg.color).multiplyScalar(Math.max(cfg.intensity || 4.0, 4.8));

        self._pmndrsSunDirection = (config.localSunDirection || config.sunDirection || new THREE.Vector3(0, 1, 0)).clone().normalize();
        self._pmndrsSunDistance = config.sunDistance || cfg.distance || 5200;

        if (!self._pmndrsSunCameraPosition) {
            self._pmndrsSunCameraPosition = new THREE.Vector3();
        }

        var camera = self.el.camera;
        if (!camera || typeof camera.getWorldPosition !== 'function') {
            return;
        }

        sunEl.object3D.visible = true;
        camera.getWorldPosition(self._pmndrsSunCameraPosition);
        sunEl.object3D.position.copy(self._pmndrsSunCameraPosition).addScaledVector(self._pmndrsSunDirection, self._pmndrsSunDistance);
    }

    function ensurePmndrsHorizonSun(self, lightPosition, preset, options) {
        if (!self || !self.el || typeof document === 'undefined') {
            return;
        }
        var opts = options || {};
        if (shouldDisablePmndrsVisibleSunDebug()) {
            clearPmndrsHorizonSun(self);
            return;
        }
        if (opts.atmosphere) {
            clearPmndrsHorizonSun(self);
            return;
        }

        var sunEl = document.getElementById('vrodos-pmndrs-sun');
        if (!sunEl) {
            sunEl = document.createElement('a-entity');
            sunEl.setAttribute('id', 'vrodos-pmndrs-sun');
            sunEl.setAttribute('data-vrodos-pmndrs-sun', 'true');
            self.el.appendChild(sunEl);
        }

        var texture = createPmndrsSunTexture(self);
        if (!texture) {
            return;
        }
        var hazeTexture = createPmndrsSunHazeTexture(self);

        var sprite = sunEl.getObject3D('mesh');
        if (!sprite) {
            var material = new THREE.SpriteMaterial({
                map: texture,
                color: '#ffedb2',
                transparent: true,
                alphaTest: 0.001,
                blending: THREE.NormalBlending,
                depthWrite: false,
                depthTest: true,
                fog: false
            });
            material.toneMapped = false;
            sprite = new THREE.Sprite(material);
            sprite.frustumCulled = false;
            sprite.renderOrder = 10;
            sunEl.setObject3D('mesh', sprite);
        }

        var hazeEl = document.getElementById('vrodos-pmndrs-sun-haze');
        if (!hazeEl) {
            hazeEl = document.createElement('a-entity');
            hazeEl.setAttribute('id', 'vrodos-pmndrs-sun-haze');
            hazeEl.setAttribute('data-vrodos-pmndrs-sun', 'true');
            self.el.appendChild(hazeEl);
        }

        var hazeSprite = hazeEl.getObject3D('mesh');
        if (!hazeSprite && hazeTexture) {
            var hazeMaterial = new THREE.SpriteMaterial({
                map: hazeTexture,
                color: '#ffd6a4',
                transparent: true,
                alphaTest: 0.0,
                blending: THREE.NormalBlending,
                depthWrite: false,
                depthTest: true,
                fog: false
            });
            hazeMaterial.toneMapped = false;
            hazeSprite = new THREE.Sprite(hazeMaterial);
            hazeSprite.frustumCulled = false;
            hazeSprite.renderOrder = 9;
            hazeEl.setObject3D('mesh', hazeSprite);
        }

        var cfg = getPmndrsHorizonSunConfig(preset, opts.atmosphere ? 'atmosphere' : 'fallback');
        sprite.scale.set(cfg.scale, cfg.scale, 1);
        
        // pmndrs applies ACES Filmic over the entire HDR framebuffer, which
        // compresses LDR colors (<= 1.0) into dull grey. We must multiply the 
        // sun's authored color so it sits in the HDR range and survives tone 
        // mapping as a bright glowing light source.
        sprite.material.color.set(cfg.color).multiplyScalar(cfg.intensity || (opts.atmosphere ? 5.5 : 4.0));
        if (hazeSprite && hazeSprite.material) {
            if (opts.atmosphere && cfg.hazeScale > 0 && cfg.hazeIntensity > 0) {
                hazeSprite.visible = true;
                hazeSprite.scale.set(cfg.hazeScale, cfg.hazeScale, 1);
                hazeSprite.material.color.set('#ffd6a4').multiplyScalar(cfg.hazeIntensity);
            } else {
                hazeSprite.visible = false;
            }
        }

        self._pmndrsSunDirection = parseLightPositionVector(lightPosition);
        self._pmndrsSunDistance = cfg.distance;

        var camera = self.el.camera;
        if (!camera || typeof camera.getWorldPosition !== 'function') {
            return;
        }

        if (!self._pmndrsSunCameraPosition) {
            self._pmndrsSunCameraPosition = new THREE.Vector3();
        }

        sunEl.object3D.visible = true;
        camera.getWorldPosition(self._pmndrsSunCameraPosition);
        sunEl.object3D.position.copy(self._pmndrsSunCameraPosition).addScaledVector(self._pmndrsSunDirection, self._pmndrsSunDistance || 5200);
        if (hazeEl && hazeEl.object3D) {
            hazeEl.object3D.position.copy(sunEl.object3D.position);
        }
    }

    H.updatePmndrsHorizonSun = function () {
        if (!this || !this.el || this.data.selChoice !== "0" || this.data.postFXEngine !== 'pmndrs') {
            removePmndrsAtmosphereSky(this);
            clearPmndrsHorizonSun(this);
            return;
        }

        removeLegacySunSkyEntitiesForPmndrs(this);

        var atmosphereConfig = this.getPmndrsAtmosphereConfig ? this.getPmndrsAtmosphereConfig() : null;
        if (atmosphereConfig && atmosphereConfig.enabled && window.VRODOS_TAKRAM_ATMOSPHERE) {
            if (shouldUsePmndrsHorizonAerialPerspectivePath(this)) {
                removePmndrsAtmosphereSky(this);
                ensurePmndrsTakramVisibleSun(this, atmosphereConfig, this.getHorizonSkyPreset ? this.getHorizonSkyPreset() : 'natural');
                return;
            }

            ensurePmndrsAtmosphereSky(this, atmosphereConfig);
            ensurePmndrsTakramVisibleSun(this, atmosphereConfig, this.getHorizonSkyPreset ? this.getHorizonSkyPreset() : 'natural');
            return;
        }

        var sunEl = document.getElementById('vrodos-pmndrs-sun');
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

        // physicallyCorrectLights was removed in Three.js r150-r165 and is always on in modern A-Frame/Three runtimes.
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
        var usesHorizonAerial = shouldUsePmndrsHorizonAerialPerspectivePath(this);
        var shadowEnabled = this.data.shadowQuality !== 'off';

        if (isPmndrs) {
            removeLegacySunSkyEntitiesForPmndrs(this);
        }

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
            removeLegacySunSkyEntitiesForPmndrs(this);
            schedulePmndrsHorizonEnvironmentCleanup(this);
            ensurePmndrsTakramHorizonLights(this, atmosphereConfig, preset);
            if (usesHorizonAerial) {
                removePmndrsAtmosphereSky(this);
                ensurePmndrsTakramVisibleSun(this, atmosphereConfig, preset);
            } else {
                ensurePmndrsAtmosphereSky(this, atmosphereConfig);
                ensurePmndrsTakramVisibleSun(this, atmosphereConfig, preset);
            }
            logPmndrsHorizonDiagnostic(this, 'apply-horizon', atmosphereConfig);
            return;
        }

        this.removePhotorealHelperLights();

        if (atmosphereConfig && atmosphereConfig.enabled && window.VRODOS_TAKRAM_ATMOSPHERE) {
            schedulePmndrsHorizonEnvironmentCleanup(this);

            clearPmndrsHorizonSun(this);
            if (ensurePmndrsAtmosphereSky(this, atmosphereConfig)) {
                logPmndrsHorizonDiagnostic(this, 'apply-horizon', atmosphereConfig);
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
            'type: directional; color: #fff2d8; intensity: ' + (enhancedReflections ? Math.max(contactShadowSettings.helperKeyIntensity, 1.0).toFixed(2) : (softReflections ? Math.max(contactShadowSettings.helperKeyIntensity - 0.08, 0.72).toFixed(2) : contactShadowSettings.helperKeyIntensity.toFixed(2))) + '; castShadow: ' + castShadow + '; shadowMapWidth: ' + keyShadowMap + '; shadowMapHeight: ' + keyShadowMap + '; shadowCameraTop: 16; shadowCameraRight: 16; shadowCameraLeft: -16; shadowCameraBottom: -16; shadowBias: ' + contactShadowSettings.bias + ';',
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
    H.hidePmndrsHorizonEnvironmentVisuals = function () {
        hidePmndrsHorizonEnvironmentVisuals(this);
    };
    H.showPmndrsAtmosphereSkyForSceneProbe = function (config) {
        return showPmndrsAtmosphereSkyForSceneProbe(this, config);
    };
    H.hidePmndrsAtmosphereSky = function () {
        hidePmndrsAtmosphereSky(this);
    };
    H.logPmndrsHorizonDiagnostic = function (context, atmosphereConfig) {
        logPmndrsHorizonDiagnostic(this, context, atmosphereConfig);
    };
})();
