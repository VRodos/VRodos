/** Atmosphere visuals: sky, stars, Moon, cloud sun disk, and legacy sky handoff.
 * Scene-owned state and lifecycle call sites remain on the existing component.
 */
(function () {
    VRODOSMaster.AtmosphereVisuals = Object.freeze({ create });

    function create({ lighting, cloud, shadow, host }) {
        const {
            PMNDRS_STARS_NIGHT_INTENSITY,
            getPmndrsSunDirectLightVisibility,
            getPmndrsStarsIntensity,
            getPmndrsRuntimeLightingSmoothingMs,
            getPmndrsRuntimeIndirectLightingSmoothingMs
        } = lighting;
        const {
            roundPmndrsCloudSunOcclusionDiagnostic,
            getPmndrsCloudSunOcclusionState,
            getPmndrsCloudMoonOcclusionState,
            PMNDRS_CLOUD_SUN_OCCLUSION_STATIC_SMOOTH_MS
        } = cloud;
        const {
            vectorToRoundedArray,
            applyPmndrsSunOcclusion
        } = shadow;
        const {
            bindAtmosphereVisualOwner,
            scheduleAtmosphereVisualRefresh,
            createPmndrsSunTexture,
            createPmndrsSunHazeTexture,
            getPmndrsHorizonSunConfig,
            ensureVrTakramLightsOnlyGradientSky,
            removeVrTakramLightsOnlyGradientSky,
            smoothPmndrsRuntimeLightValue,
            getPmndrsResolvedGeospatialFrame,
            clamp01,
            readPmndrsAtmosphereBool,
            normalizePmndrsColor,
            hasPmndrsDebugFlag,
            readPmndrsDebugNumber,
            getRuntimeNowMs,
            getPmndrsEffectiveGroundAlbedo,
            shouldUseVrTakramVisibleSky,
            shouldUseVrTakramDirectSkyCalibration,
            shouldUsePmndrsTakramHorizonPath,
            parseLightPositionVector,
            getImmersivePresentedSunDirection,
            getPresentedPmndrsAtmosphereConfig
        } = host;

        const PMNDRS_STARS_POINT_SIZE = 1.8;

        const PMNDRS_STARS_FALLBACK_POINT_SIZE = 1.65;

        const PMNDRS_STARS_FALLBACK_RADIUS = 6000;

        const PMNDRS_TAKRAM_STARS_RELATIVE_PATH = 'assets/vendor/takram-atmosphere/stars.bin';

        const PMNDRS_TAKRAM_MOON_COLOR_RELATIVE_PATH = 'assets/vendor/nasa-moon/lroc_color_poles_1k.jpg';

        const PMNDRS_TAKRAM_NATIVE_MOON_ANGULAR_RADIUS = 0.0045;

        const PMNDRS_MOON_ANGULAR_RADIUS = 0.015708;

        const PMNDRS_MOON_ANGULAR_DIAMETER_DEG = 1.8;

        const PMNDRS_MOON_VISIBILITY_BOOST = 8.0;

        const PMNDRS_MOON_HALO_RADIUS_SCALE = 5.5;

        const PMNDRS_MOON_HALO_STRENGTH = 0.012;

        const PMNDRS_MOON_STAR_OCCLUSION_FEATHER_RAD = 0.002094;

        const PMNDRS_MOON_RADIANCE_SCALE = Math.pow(
            PMNDRS_MOON_ANGULAR_RADIUS / PMNDRS_TAKRAM_NATIVE_MOON_ANGULAR_RADIUS,
            2
        ) * PMNDRS_MOON_VISIBILITY_BOOST;

        const VR_TAKRAM_SKY_DIRECT_EXPOSURE = 24;

        const VR_TAKRAM_SKY_REVEAL_WARMUP_MS = 10000;

        const PMNDRS_CLOUD_SUN_DISK_SPRITE_ACTIVATE_VISIBILITY = 0.985;

        const PMNDRS_CLOUD_SUN_DISK_SPRITE_RELEASE_VISIBILITY = 0.997;

        const PMNDRS_CLOUD_SUN_DISK_SPRITE_OPACITY_MIN = 0.56;

        const PMNDRS_CLOUD_SUN_DISK_SPRITE_OPACITY_CURVE = 0.45;

        const PMNDRS_CLOUD_SUN_DISK_SPRITE_INTENSITY_SCALE = 1.05;

        const PMNDRS_CLOUD_PHASE_NATIVE_SUN_HIDE_VISIBILITY = 0.14;

        const PMNDRS_CLOUD_PHASE_NATIVE_SUN_RELEASE_VISIBILITY = 0.24;

        function joinPmndrsRuntimeUrl(base, relativePath) {
            const rel = String(relativePath || '').replace(/^\/+/, '');
            if (!base) {
                return rel;
            }
            return `${String(base).replace(/\/+$/, '')  }/${  rel}`;
        }

        function getPmndrsTakramStarsDataUrl() {
            const runtime = window.vrodos_render_runtime || {};
            const configuredUrl = window.vrodos_takram_stars_data_url ||
                runtime.takram_stars_data_url ||
                runtime.takramStarsDataUrl;
            if (typeof configuredUrl === 'string' && configuredUrl.trim()) {
                return configuredUrl.trim();
            }

            const configuredPath = runtime.takram_stars_data_path || runtime.takramStarsDataPath || PMNDRS_TAKRAM_STARS_RELATIVE_PATH;
            const pluginBase = window.VRODOS_PLUGIN_URL ||
                (window.vrodos_data && (window.vrodos_data.pluginUrl || window.vrodos_data.plugin_url || window.vrodos_data.pluginPath)) ||
                '';
            return joinPmndrsRuntimeUrl(pluginBase, configuredPath);
        }

        function getPmndrsTakramMoonColorUrl() {
            const runtime = window.vrodos_render_runtime || {};
            const configuredUrl = window.vrodos_takram_moon_color_url ||
                runtime.takram_moon_color_url ||
                runtime.takramMoonColorUrl;
            if (typeof configuredUrl === 'string' && configuredUrl.trim()) {
                return configuredUrl.trim();
            }

            const configuredPath = runtime.takram_moon_color_path || runtime.takramMoonColorPath || PMNDRS_TAKRAM_MOON_COLOR_RELATIVE_PATH;
            const pluginBase = window.VRODOS_PLUGIN_URL ||
                (window.vrodos_data && (window.vrodos_data.pluginUrl || window.vrodos_data.plugin_url || window.vrodos_data.pluginPath)) ||
                '';
            return joinPmndrsRuntimeUrl(pluginBase, configuredPath);
        }

        function getVrTakramSkyDirectExposure() {
            return readPmndrsDebugNumber(
                'vrTakramSkyDirectExposure',
                'vrodos_vr_takram_sky_exposure',
                VR_TAKRAM_SKY_DIRECT_EXPOSURE,
                1,
                160
            );
        }

        function getVrTakramSkyRevealWarmupMs() {
            return readPmndrsDebugNumber(
                'vrTakramSkyRevealWarmupMs',
                'vrodos_vr_takram_sky_reveal_delay_ms',
                VR_TAKRAM_SKY_REVEAL_WARMUP_MS,
                0,
                15000
            );
        }

        function resolvePmndrsCloudShadowLengthForSky(self, explicitShadowLength) {
            if (explicitShadowLength !== undefined) {
                return explicitShadowLength || null;
            }

            if (!shouldRoutePmndrsCloudShadowLengthToSkyMaterial(self)) {
                return null;
            }

            const diagnostics = self && self._pmndrsCloudsDiagnostics ? self._pmndrsCloudsDiagnostics : null;
            if (!diagnostics || diagnostics.cloudsActive !== true) {
                return null;
            }

            const atmosphereConfig = self && typeof self.getPmndrsAtmosphereConfig === 'function'
                ? self.getPmndrsAtmosphereConfig()
                : null;
            if (getPmndrsSunDirectLightVisibility(atmosphereConfig) <= 0.001) {
                return null;
            }

            const effect = self && self.pmndrsCloudsEffect ? self.pmndrsCloudsEffect : null;
            return effect && effect.atmosphereShadowLength ? effect.atmosphereShadowLength : null;
        }

        function shouldRoutePmndrsCloudShadowLengthToSkyMaterial(self) {
            if (hasPmndrsDebugFlag('enablePmndrsCloudSkyShadowLength', 'vrodos_debug_enable_pmndrs_cloud_sky_shadow_length')) {
                return true;
            }
            return !shouldUsePmndrsTakramHorizonPath(self);
        }

        function syncPmndrsCloudShadowLengthToSkyMaterial(self, explicitShadowLength, reason) {
            const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
            const material = state && state.skyMaterial ? state.skyMaterial : null;
            const routeDisabledReason = explicitShadowLength === undefined && !shouldRoutePmndrsCloudShadowLengthToSkyMaterial(self)
                ? 'horizon-sky-shadowlength-disabled'
                : '';
            const shadowLength = resolvePmndrsCloudShadowLengthForSky(self, explicitShadowLength);
            let routed = false;

            if (material && Object.prototype.hasOwnProperty.call(material, 'shadowLength')) {
                if (material.shadowLength !== shadowLength) {
                    material.shadowLength = shadowLength;
                    material.needsUpdate = true;
                    if (typeof material.setChanged === 'function') {
                        material.setChanged();
                    }
                }
                routed = Boolean(shadowLength);
            }

            if (state) {
                state.cloudSkyShadowLengthRouted = routed;
                state.cloudSkyShadowLengthReason = routed ? (reason || '') : (routeDisabledReason || 'sun-below-horizon-or-unavailable');
            }
            if (self) {
                self._pmndrsCloudSkyShadowLengthRouted = routed;
                if (self._pmndrsCloudsDiagnostics) {
                    self._pmndrsCloudsDiagnostics.skyShadowLengthRouted = routed;
                    self._pmndrsCloudsDiagnostics.skyShadowLengthReason = routed ? (reason || '') : (routeDisabledReason || 'sun-below-horizon-or-unavailable');
                }
            }
            return routed;
        }

        function removePmndrsAtmosphereSky(self) {
            if (!self || !self._pmndrsAtmosphereState) {
                return;
            }
            const state = self._pmndrsAtmosphereState;
            syncPmndrsCloudShadowLengthToSkyMaterial(self, null, 'sky-remove');
            if (state.starsFallbackMesh && state.starsFallbackMesh.parent) {
                state.starsFallbackMesh.parent.remove(state.starsFallbackMesh);
            }
            state.moonTextureLoadToken = (state.moonTextureLoadToken || 0) + 1;
            if (state.moonTexture && typeof state.moonTexture.dispose === 'function') {
                state.moonTexture.dispose();
            }
            if (state.starsFallbackMaterial && typeof state.starsFallbackMaterial.dispose === 'function') {
                state.starsFallbackMaterial.dispose();
            }
            if (state.starsFallbackGeometry && typeof state.starsFallbackGeometry.dispose === 'function') {
                state.starsFallbackGeometry.dispose();
            }
            if (state.starsMesh && state.starsMesh.parent) {
                state.starsMesh.parent.remove(state.starsMesh);
            }
            if (state.starsMaterial && typeof state.starsMaterial.dispose === 'function') {
                state.starsMaterial.dispose();
            }
            if (state.starsGeometry && typeof state.starsGeometry.dispose === 'function') {
                state.starsGeometry.dispose();
            }
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
            state.skyMaterialSignature = '';
            state.starsMesh = null;
            state.starsMaterial = null;
            state.starsGeometry = null;
            state.starsFallbackMesh = null;
            state.starsFallbackMaterial = null;
            state.starsFallbackGeometry = null;
            state.moonTexture = null;
            state.moonTextureLoading = false;
            state.moonTextureFailed = false;
            state.moonDiagnostics = null;
            state.starsIntensity = 0;
        }

        function setPmndrsAtmosphereSkyVisibility(self, visible) {
            if (!self || !self._pmndrsAtmosphereState) {
                return false;
            }

            const state = self._pmndrsAtmosphereState;
            let changed = false;
            if (state.skyMesh) {
                state.skyMesh.visible = Boolean(visible);
                changed = true;
            }
            if (state.starsMesh) {
                state.starsMesh.visible = Boolean(visible) && state.starsIntensity > 0;
                changed = true;
            }
            if (state.starsFallbackMesh) {
                state.starsFallbackMesh.visible = Boolean(visible) && state.starsIntensity > 0;
                changed = true;
            }
            return changed;
        }

        function isPmndrsAtmosphereSkyVisible(self) {
            return Boolean(self &&
                self._pmndrsAtmosphereState &&
                self._pmndrsAtmosphereState.skyMesh &&
                self._pmndrsAtmosphereState.skyMesh.visible);
        }

        function hasPmndrsLegacyEnvironmentToken(value) {
            if (typeof value !== 'string' || !value) {
                return false;
            }

            const normalized = value.toLowerCase();
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

            const id = (typeof el.id === 'string' ? el.id : '').toLowerCase();
            const tagName = (typeof el.tagName === 'string' ? el.tagName : '').toLowerCase();
            const className = getPmndrsLegacyEnvironmentClassName(el);

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

            const material = Array.isArray(node.material) ? node.material[0] : node.material;
            const uniforms = material && material.uniforms ? material.uniforms : null;
            if (uniforms && (uniforms.sunPosition || uniforms.sunposition || uniforms.sun_direction)) {
                return true;
            }

            const nodeName = (typeof node.name === 'string') ? node.name : '';
            const materialName = (material && typeof material.name === 'string') ? material.name : '';
            return hasPmndrsLegacyEnvironmentToken(nodeName) || hasPmndrsLegacyEnvironmentToken(materialName);
        }

        function schedulePmndrsHorizonEnvironmentCleanup(self) {
            if (!self) {
                return;
            }

            const hideEnvVisuals = function () {
                hidePmndrsHorizonEnvironmentVisuals(self);
            };

            scheduleAtmosphereVisualRefresh(self, hideEnvVisuals);
        }

        function hidePmndrsHorizonEnvironmentVisuals(self) {
            if (!self || !self.el || !self.el.object3D) {
                return;
            }
            self.el.object3D.traverse((node) => {
                if (!node || (node.userData && (node.userData.vrodosPmndrsAtmosphereSky || node.userData.vrodosPmndrsAtmosphereStars))) {
                    return;
                }

                if (isPmndrsLegacyEnvironmentVisualNode(node)) {
                    node.visible = false;
                    node.userData = node.userData || {};
                    node.userData.vrodosPmndrsLegacySuppressed = true;
                }
            });

            Array.prototype.forEach.call(document.querySelectorAll('#default-sky, #default-sun, #vrodos-pmndrs-sun, #vrodos-pmndrs-sun-haze, a-sun-sky, a-sky[data-vrodos-preset-sky="true"], .environmentSun, .environment-sun, .environmentSky, .environment-sky, [class*="environmentSun"], [class*="environmentSky"]'), (node) => {
                if (node && typeof node.setAttribute === 'function') {
                    node.setAttribute('visible', 'false');
                }
            });
        }

        function isPmndrsAtmosphereVisualNode(node) {
            return Boolean(node &&
                node.userData &&
                (node.userData.vrodosPmndrsAtmosphereSky ||
                    node.userData.vrodosPmndrsAtmosphereStars ||
                    node.userData.vrodosPmndrsAtmosphereMoon));
        }

        function disposePmndrsAtmosphereVisualNode(node) {
            if (!node) {
                return;
            }

            if (node.parent) {
                node.parent.remove(node);
            }

            const disposeRuntimeResource = VRODOSMaster &&
                VRODOSMaster.RuntimeResources &&
                typeof VRODOSMaster.RuntimeResources.dispose === 'function'
                ? VRODOSMaster.RuntimeResources.dispose
                : null;

            if (disposeRuntimeResource) {
                disposeRuntimeResource(node);
                return;
            }

            if (node.geometry && typeof node.geometry.dispose === 'function') {
                node.geometry.dispose();
            }
            if (Array.isArray(node.material)) {
                node.material.forEach((material) => {
                    if (material && typeof material.dispose === 'function') {
                        material.dispose();
                    }
                });
            } else if (node.material && typeof node.material.dispose === 'function') {
                node.material.dispose();
            }
        }

        function removePmndrsAtmosphereVisualObjects(self) {
            if (!self || !self.el || !self.el.object3D) {
                return;
            }

            const visualNodes = [];
            self.el.object3D.traverse((node) => {
                if (isPmndrsAtmosphereVisualNode(node)) {
                    visualNodes.push(node);
                }
            });

            visualNodes.forEach(disposePmndrsAtmosphereVisualNode);
        }

        function getVrTakramVisibleSkyLowerHazeColors(preset) {
            if (preset === 'clear') {
                return {
                    lower: '#79858e',
                    horizon: '#a9bece'
                };
            }
            if (preset === 'crisp') {
                return {
                    lower: '#737f89',
                    horizon: '#a8bfd2'
                };
            }

            return {
                lower: '#78828b',
                horizon: '#a7bac9'
            };
        }

        function setVectorFromDisplayHexColor(vector, color, fallback) {
            if (!vector || typeof vector.set !== 'function') {
                return vector;
            }
            const normalized = normalizePmndrsColor(color, fallback || '#000000');
            vector.set(
                parseInt(normalized.slice(1, 3), 16) / 255,
                parseInt(normalized.slice(3, 5), 16) / 255,
                parseInt(normalized.slice(5, 7), 16) / 255
            );
            return vector;
        }

        function isPmndrsGeneratedSunElement(el) {
            if (!el) {
                return false;
            }

            const id = (typeof el.id === 'string' ? el.id : '').toLowerCase();
            return id === 'vrodos-pmndrs-sun' ||
                id === 'vrodos-pmndrs-sun-haze' ||
                (el.hasAttribute && el.hasAttribute('data-vrodos-pmndrs-sun'));
        }

        function restorePmndrsHorizonEnvironmentVisuals(self) {
            if (!self || !self.el || !self.el.object3D) {
                return;
            }

            const restoredElements = [];
            self.el.object3D.traverse((node) => {
                if (!node || !node.userData || !node.userData.vrodosPmndrsLegacySuppressed) {
                    return;
                }
                if (isPmndrsGeneratedSunElement(node.el)) {
                    delete node.userData.vrodosPmndrsLegacySuppressed;
                    return;
                }

                node.visible = true;
                delete node.userData.vrodosPmndrsLegacySuppressed;
                if (node.el && restoredElements.indexOf(node.el) === -1) {
                    restoredElements.push(node.el);
                }
            });

            restoredElements.forEach((el) => {
                if (el && typeof el.setAttribute === 'function') {
                    el.setAttribute('visible', 'true');
                }
            });

            Array.prototype.forEach.call(self.el.querySelectorAll('#default-sky, #default-sun, a-sun-sky, a-sky[data-vrodos-preset-sky="true"], .environmentSun, .environment-sun, .environmentSky, .environment-sky, [class*="environmentSun"], [class*="environmentSky"]'), (el) => {
                if (el && !isPmndrsGeneratedSunElement(el) && typeof el.setAttribute === 'function') {
                    el.setAttribute('visible', 'true');
                }
            });
        }

        function primeVrTakramSkyDirectShader(self) {
            const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
            const material = state && state.skyMaterial ? state.skyMaterial : null;
            const skyMesh = state && state.skyMesh ? state.skyMesh : null;
            const renderer = self && self.el ? self.el.renderer : null;
            const camera = self && self.el ? self.el.camera : null;
            if (!state || !material || !skyMesh || !renderer || !camera || typeof renderer.compile !== 'function') {
                return Boolean(material && material.userData && material.userData.vrodosVrTakramSkyDirectShaderPatched);
            }
            if (material.userData && material.userData.vrodosVrTakramSkyDirectShaderPatched) {
                return true;
            }

            const wasVisible = skyMesh.visible;
            skyMesh.visible = true;
            try {
                renderer.compile(skyMesh, camera);
            } catch (err) {
                state.vrTakramSkyDirectCompileError = err && err.message ? err.message : String(err);
            }
            skyMesh.visible = wasVisible;
            return Boolean(material.userData && material.userData.vrodosVrTakramSkyDirectShaderPatched);
        }

        function isVrTakramVisibleSkyReadyForHandoff(self) {
            if (!shouldUseVrTakramVisibleSky(self)) {
                return true;
            }

            const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
            const material = state && state.skyMaterial ? state.skyMaterial : null;
            if (!state || !state.skyMesh || !material || !material.userData) {
                return false;
            }

            if (!shouldUseVrTakramDirectSkyCalibration(self)) {
                material.userData.vrodosVrTakramSkyDirectShaderPatched = false;
                material.userData.vrodosVrTakramSkyDirectPatchFailed = false;
                material.userData.vrodosVrTakramSkyDirectWarmed = true;
                material.userData.vrodosVrTakramSkyDirectWarmupMs = 0;
                material.userData.vrodosVrTakramSkyDirectWarmupRemainingMs = 0;
                state.vrTakramSkyDirectCalibrated = false;
                state.vrTakramSkyDirectExposure = null;
                state.vrTakramSkyDirectCalibrationMode = 'native-takram-stereo-pmndrs';
                state.vrTakramSkyDirectShaderPatched = false;
                state.vrTakramSkyDirectPatchFailed = false;
                state.vrTakramSkyDirectWarmed = true;
                state.vrTakramSkyDirectWarmupMs = 0;
                state.vrTakramSkyDirectWarmupRemainingMs = 0;
                return Boolean(state.ready && !state.failed && state.textures);
            }

            if (!material.userData.vrodosVrTakramSkyDirectShaderPatched) {
                primeVrTakramSkyDirectShader(self);
            }

            const shaderPatched = Boolean(material.userData.vrodosVrTakramSkyDirectShaderPatched);
            const patchFailed = Boolean(material.userData.vrodosVrTakramSkyDirectPatchFailed);
            const warmupMs = getVrTakramSkyRevealWarmupMs();
            let warmed = false;
            let remainingMs = warmupMs;

            if (shaderPatched && !patchFailed) {
                const now = getRuntimeNowMs();
                if (!Number.isFinite(material.userData.vrodosVrTakramSkyDirectReadySinceMs) ||
                    material.userData.vrodosVrTakramSkyDirectReadySinceMs <= 0) {
                    material.userData.vrodosVrTakramSkyDirectReadySinceMs = now;
                }
                const elapsedMs = Math.max(0, now - material.userData.vrodosVrTakramSkyDirectReadySinceMs);
                warmed = warmupMs <= 0 || elapsedMs >= warmupMs;
                remainingMs = Math.max(0, warmupMs - elapsedMs);
            } else {
                material.userData.vrodosVrTakramSkyDirectReadySinceMs = 0;
            }

            material.userData.vrodosVrTakramSkyDirectWarmupMs = warmupMs;
            material.userData.vrodosVrTakramSkyDirectWarmed = warmed;
            material.userData.vrodosVrTakramSkyDirectWarmupRemainingMs = remainingMs;
            state.vrTakramSkyDirectShaderPatched = shaderPatched;
            state.vrTakramSkyDirectPatchFailed = patchFailed;
            state.vrTakramSkyDirectReadySinceMs = material.userData.vrodosVrTakramSkyDirectReadySinceMs || 0;
            state.vrTakramSkyDirectWarmupMs = warmupMs;
            state.vrTakramSkyDirectWarmed = warmed;
            state.vrTakramSkyDirectWarmupRemainingMs = remainingMs;

            return Boolean(shaderPatched && !patchFailed && warmed);
        }

        function completeVrTakramVisibleSkyHandoff(self) {
            if (!self || !self.el) {
                return;
            }

            setPmndrsAtmosphereSkyVisibility(self, true);
            removeVrTakramLightsOnlyGradientSky(self);
            removeLegacySunSkyEntitiesForPmndrs(self);
            schedulePmndrsHorizonEnvironmentCleanup(self);
            if (self.el.hasAttribute('environment')) {
                self.el.removeAttribute('environment');
            }
        }

        function syncVrTakramLightsOnlyHorizonVisuals(self, force) {
            if (!self) {
                return;
            }
            if (!force && self._vrTakramLightsOnlyHorizonVisualsSynced) {
                return;
            }

            removePmndrsAtmosphereSky(self);
            removePmndrsAtmosphereVisualObjects(self);
            removeLegacySunSkyEntitiesForPmndrs(self);
            if (self.el && typeof self.el.hasAttribute === 'function' && self.el.hasAttribute('environment')) {
                self.el.removeAttribute('environment');
            }
            ensureVrTakramLightsOnlyGradientSky(
                self,
                typeof self.getHorizonSkyPreset === 'function' ? self.getHorizonSkyPreset() : 'natural'
            );
            self._vrTakramLightsOnlyHorizonVisualsSynced = true;
        }

        function scheduleVrTakramLightsOnlyHorizonVisualSync(self) {
            if (!self) {
                return;
            }

            const sync = function () {
                syncVrTakramLightsOnlyHorizonVisuals(self, true);
            };

            self._vrTakramLightsOnlyHorizonVisualsSynced = false;
            scheduleAtmosphereVisualRefresh(self, sync);
        }

        function removeLegacySunSkyEntitiesForPmndrs(self) {
            if (!self || !self.el) {
                return;
            }

            Array.prototype.forEach.call(self.el.querySelectorAll('a-sun-sky, a-sky[data-vrodos-preset-sky="true"], #default-sky, #default-sun, [material*="sunPosition"], [material*="sunposition"]'), (sunSkyEl) => {
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
                self.el.object3D.traverse((node) => {
                    if (!node) {
                        return;
                    }

                    if (node.userData && (node.userData.vrodosPmndrsAtmosphereSky || node.userData.vrodosPmndrsAtmosphereStars)) {
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

        function loadPmndrsTakramStarsData(self, state) {
            if (!state || state.starsData || state.starsDataPromise || state.starsFailed) {
                return state ? state.starsDataPromise : null;
            }
            if (!THREE.FileLoader || typeof THREE.FileLoader !== 'function') {
                state.starsFailed = true;
                return null;
            }

            const url = getPmndrsTakramStarsDataUrl();
            state.starsDataUrl = url;
            const loader = new THREE.FileLoader();
            loader.setResponseType('arraybuffer');
            state.starsDataPromise = new Promise((resolve, reject) => {
                loader.load(url, resolve, undefined, reject);
            }).then((data) => {
                state.starsData = data;
                return data;
            }).catch((err) => {
                state.starsFailed = true;
                console.warn('[VRodos] Takram stars data failed to load:', err);
                return null;
            });
            state.starsDataPromise.then(() => {
                if (self && self._pmndrsAtmosphereState === state && state.starsData && state.starsIntensity > 0) {
                    const latestConfig = self.getPmndrsAtmosphereConfig ? self.getPmndrsAtmosphereConfig() : null;
                    ensurePmndrsAtmosphereStars(self, latestConfig, state, window.VRODOS_TAKRAM_ATMOSPHERE);
                }
            });
            return state.starsDataPromise;
        }

        function createPmndrsStarsFallbackGeometry(data) {
            if (!data || !THREE.BufferGeometry || !THREE.BufferAttribute) {
                return null;
            }

            const int16Array = new Int16Array(data);
            const uint8Array = new Uint8Array(data);
            const count = Math.floor(int16Array.length / 5);
            if (count <= 0) {
                return null;
            }

            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const dimMagnitude = Math.pow(10, -8 / 2.5);
            const brightMagnitude = Math.pow(10, 2 / 2.5);

            for (let i = 0; i < count; i += 1) {
                const int16Offset = i * 5;
                let x = int16Array[int16Offset] / 32767;
                let y = int16Array[int16Offset + 1] / 32767;
                let z = int16Array[int16Offset + 2] / 32767;
                const length = Math.sqrt(x * x + y * y + z * z) || 1;
                x /= length;
                y /= length;
                z /= length;

                const positionOffset = i * 3;
                positions[positionOffset] = x;
                positions[positionOffset + 1] = y;
                positions[positionOffset + 2] = z;

                const uint8Offset = i * 10;
                const magnitudeNormalized = uint8Array[uint8Offset + 6] / 255;
                const magnitude = -2 + magnitudeNormalized * 10;
                const magnitudeRadiance = Math.pow(10, -magnitude / 2.5);
                const magnitudeWeight = Math.max(0, Math.min(1, (magnitudeRadiance - dimMagnitude) / (brightMagnitude - dimMagnitude)));
                const visibilityWeight = Math.max(0.08, Math.pow(magnitudeWeight, 0.45));
                colors[positionOffset] = Math.min(1, (uint8Array[uint8Offset + 7] / 255) * visibilityWeight * 1.8);
                colors[positionOffset + 1] = Math.min(1, (uint8Array[uint8Offset + 8] / 255) * visibilityWeight * 1.8);
                colors[positionOffset + 2] = Math.min(1, (uint8Array[uint8Offset + 9] / 255) * visibilityWeight * 1.8);
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            if (typeof geometry.computeBoundingSphere === 'function') {
                geometry.computeBoundingSphere();
            }
            return geometry;
        }

        function getPmndrsStarsLocalRotationMatrix(config) {
            if (!config || !config.inertialToECEFMatrix || !THREE.Matrix4) {
                return null;
            }
            if (config._starsLocalRotationMatrix) {
                return config._starsLocalRotationMatrix;
            }

            const frame = getPmndrsResolvedGeospatialFrame(config);
            const eciToEcef = config.inertialToECEFMatrix.clone();
            if (typeof eciToEcef.setPosition === 'function') {
                eciToEcef.setPosition(0, 0, 0);
            }
            if (!frame || !frame.matrix || typeof frame.matrix.clone !== 'function') {
                config._starsLocalRotationMatrix = eciToEcef;
                return config._starsLocalRotationMatrix;
            }

            const ecefToWorld = frame.matrix.clone();
            if (typeof ecefToWorld.invert === 'function') {
                ecefToWorld.invert();
            } else if (typeof ecefToWorld.getInverse === 'function') {
                ecefToWorld.getInverse(frame.matrix);
            } else {
                config._starsLocalRotationMatrix = eciToEcef;
                return config._starsLocalRotationMatrix;
            }
            if (typeof ecefToWorld.setPosition === 'function') {
                ecefToWorld.setPosition(0, 0, 0);
            }

            config._starsLocalRotationMatrix = new THREE.Matrix4().multiplyMatrices(ecefToWorld, eciToEcef);
            return config._starsLocalRotationMatrix;
        }

        function getPmndrsMoonStarOcclusionCosine(config) {
            if (!config || config.moonEnabled === false) {
                return 1;
            }
            return Math.cos(PMNDRS_MOON_ANGULAR_RADIUS + PMNDRS_MOON_STAR_OCCLUSION_FEATHER_RAD);
        }

        function syncPmndrsTakramStarMoonOcclusion(material, config, state) {
            const uniforms = material && material.uniforms ? material.uniforms : null;
            const patchApplied = Boolean(uniforms &&
                uniforms.vrodosMoonOcclusionDirection &&
                uniforms.vrodosMoonOcclusionCosine);
            if (state) {
                state.starMoonOcclusionShaderApplied = patchApplied;
            }
            if (!patchApplied) {
                return false;
            }
            if (config.moonDirection && uniforms.vrodosMoonOcclusionDirection.value &&
                typeof uniforms.vrodosMoonOcclusionDirection.value.copy === 'function') {
                uniforms.vrodosMoonOcclusionDirection.value.copy(config.moonDirection);
            }
            uniforms.vrodosMoonOcclusionCosine.value = getPmndrsMoonStarOcclusionCosine(config);
            return true;
        }

        function installPmndrsFallbackStarMoonOcclusion(material) {
            if (!material || !THREE.Vector3 || (material.userData && material.userData.vrodosMoonOcclusionInstalled)) {
                return false;
            }
            material.userData = material.userData || {};
            const directionUniform = { value: new THREE.Vector3(0, 0, 1) };
            const cosineUniform = { value: 1 };
            const originalOnBeforeCompile = typeof material.onBeforeCompile === 'function'
                ? material.onBeforeCompile.bind(material)
                : null;
            const originalProgramKey = typeof material.customProgramCacheKey === 'function'
                ? material.customProgramCacheKey.bind(material)
                : null;

            material.onBeforeCompile = function (shader, renderer) {
                if (originalOnBeforeCompile) {
                    originalOnBeforeCompile(shader, renderer);
                }
                shader.uniforms.vrodosMoonOcclusionDirection = directionUniform;
                shader.uniforms.vrodosMoonOcclusionCosine = cosineUniform;
                shader.vertexShader = `varying vec3 vVrodosStarWorldDirection;\n${  shader.vertexShader}`;
                shader.vertexShader = shader.vertexShader.replace(
                    '#include <begin_vertex>',
                    '#include <begin_vertex>\n vVrodosStarWorldDirection = normalize((modelMatrix * vec4(transformed, 0.0)).xyz);'
                );
                shader.fragmentShader = [
                    'uniform vec3 vrodosMoonOcclusionDirection;',
                    'uniform float vrodosMoonOcclusionCosine;',
                    'varying vec3 vVrodosStarWorldDirection;',
                    shader.fragmentShader
                ].join('\n');
                shader.fragmentShader = shader.fragmentShader.replace(
                    'void main() {',
                    [
                        'void main() {',
                        '  // VRODOS_FALLBACK_MOON_STAR_OCCLUSION_SHADER_PATCH',
                        '  if (vrodosMoonOcclusionCosine < 1.0 &&',
                        '      dot(normalize(vVrodosStarWorldDirection), normalize(vrodosMoonOcclusionDirection)) > vrodosMoonOcclusionCosine) {',
                        '    discard;',
                        '  }'
                    ].join('\n')
                );
            };
            material.customProgramCacheKey = function () {
                return `${originalProgramKey ? originalProgramKey() : ''  }|vrodos-moon-star-occlusion-v1`;
            };
            material.userData.vrodosMoonOcclusionInstalled = true;
            material.userData.vrodosMoonOcclusionDirection = directionUniform;
            material.userData.vrodosMoonOcclusionCosine = cosineUniform;
            material.needsUpdate = true;
            return true;
        }

        function syncPmndrsFallbackStarMoonOcclusion(material, config, state) {
            const userData = material && material.userData ? material.userData : null;
            const directionUniform = userData ? userData.vrodosMoonOcclusionDirection : null;
            const cosineUniform = userData ? userData.vrodosMoonOcclusionCosine : null;
            const patchApplied = Boolean(directionUniform && cosineUniform);
            if (state) {
                state.starMoonOcclusionFallbackApplied = patchApplied;
            }
            if (!patchApplied) {
                return false;
            }
            if (config.localMoonDirection && directionUniform.value && typeof directionUniform.value.copy === 'function') {
                directionUniform.value.copy(config.localMoonDirection);
            }
            cosineUniform.value = getPmndrsMoonStarOcclusionCosine(config);
            return true;
        }

        function ensurePmndrsAtmosphereStarsFallback(self, config, state, intensity) {
            if (!self || !state || !state.starsData || intensity <= 0 || !self.el || !self.el.object3D || !THREE.Points || !THREE.PointsMaterial) {
                return false;
            }

            if (!state.starsFallbackMesh) {
                state.starsFallbackGeometry = createPmndrsStarsFallbackGeometry(state.starsData);
                if (!state.starsFallbackGeometry) {
                    return false;
                }
                state.starsFallbackMaterial = new THREE.PointsMaterial({
                    size: PMNDRS_STARS_FALLBACK_POINT_SIZE,
                    sizeAttenuation: false,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.9,
                    depthWrite: false,
                    depthTest: true,
                    fog: false,
                    blending: THREE.AdditiveBlending || THREE.NormalBlending
                });
                state.starsFallbackMaterial.toneMapped = false;
                installPmndrsFallbackStarMoonOcclusion(state.starsFallbackMaterial);
                state.starsFallbackMesh = new THREE.Points(state.starsFallbackGeometry, state.starsFallbackMaterial);
                state.starsFallbackMesh.frustumCulled = false;
                state.starsFallbackMesh.renderOrder = -998;
                state.starsFallbackMesh.userData.vrodosPmndrsAtmosphereStars = true;
                state.starsFallbackMesh.name = 'vrodosPmndrsAtmosphereStarsFallback';
                state.starsFallbackMesh.onBeforeRender = function (_renderer, _scene, camera) {
                    const cameraFar = camera && typeof camera.far === 'number' ? camera.far : PMNDRS_STARS_FALLBACK_RADIUS;
                    const radius = Math.max(1000, Math.min(PMNDRS_STARS_FALLBACK_RADIUS, cameraFar * 0.72));
                    this.scale.setScalar(radius);
                    if (camera && camera.position && this.position && typeof this.position.copy === 'function') {
                        this.position.copy(camera.position);
                    }
                };
                self.el.object3D.add(state.starsFallbackMesh);
            } else if (state.starsFallbackMesh.parent !== self.el.object3D) {
                self.el.object3D.add(state.starsFallbackMesh);
            }

            if (state.starsFallbackMaterial) {
                syncPmndrsFallbackStarMoonOcclusion(state.starsFallbackMaterial, config, state);
                const normalizedIntensity = Math.max(0, Math.min(1, intensity / PMNDRS_STARS_NIGHT_INTENSITY));
                state.starsFallbackMaterial.opacity = Math.max(0.18, Math.min(0.92, 0.18 + normalizedIntensity * 0.74));
                state.starsFallbackMaterial.size = PMNDRS_STARS_FALLBACK_POINT_SIZE;
                state.starsFallbackMaterial.needsUpdate = true;
            }

            if (state.starsFallbackMesh) {
                state.starsFallbackMesh.visible = true;
                const starsRotationMatrix = getPmndrsStarsLocalRotationMatrix(config);
                if (starsRotationMatrix && typeof state.starsFallbackMesh.setRotationFromMatrix === 'function') {
                    state.starsFallbackMesh.setRotationFromMatrix(starsRotationMatrix);
                } else if (state.starsFallbackMesh.rotation && typeof state.starsFallbackMesh.rotation.set === 'function') {
                    state.starsFallbackMesh.rotation.set(0, 0, 0);
                }
            }

            return true;
        }

        function ensurePmndrsAtmosphereStars(self, config, state, vta) {
            if (!self || !state || !config || state.failed || state.starsFailed || !self.el || !self.el.object3D) {
                return false;
            }

            const intensity = getPmndrsStarsIntensity(config, self);
            state.starsIntensity = intensity;
            if (intensity <= 0) {
                if (state.starsMesh) {
                    state.starsMesh.visible = false;
                }
                if (state.starsMaterial) {
                    state.starsMaterial.intensity = 0;
                }
                if (state.starsFallbackMesh) {
                    state.starsFallbackMesh.visible = false;
                }
                return false;
            }

            if (!state.starsData) {
                loadPmndrsTakramStarsData(self, state);
                return false;
            }

            if (vta && vta.StarsGeometry && vta.StarsMaterial && THREE.Points && !state.starsMesh) {
                state.starsGeometry = new vta.StarsGeometry(state.starsData);
                state.starsMaterial = new vta.StarsMaterial({
                    irradianceTexture: state.textures.irradianceTexture || null,
                    scatteringTexture: state.textures.scatteringTexture || null,
                    transmittanceTexture: state.textures.transmittanceTexture || null,
                    singleMieScatteringTexture: state.textures.singleMieScatteringTexture || null,
                    higherOrderScatteringTexture: state.textures.higherOrderScatteringTexture || null,
                    pointSize: PMNDRS_STARS_POINT_SIZE,
                    intensity,
                    background: true,
                    ground: config.groundEnabled
                });
                state.starsMesh = new THREE.Points(state.starsGeometry, state.starsMaterial);
                state.starsMesh.frustumCulled = false;
                state.starsMesh.renderOrder = -999;
                state.starsMesh.userData.vrodosPmndrsAtmosphereStars = true;
                state.starsMesh.name = 'vrodosPmndrsAtmosphereStars';
                self.el.object3D.add(state.starsMesh);
            } else if (state.starsMesh && state.starsMesh.parent !== self.el.object3D) {
                self.el.object3D.add(state.starsMesh);
            }

            if (state.starsMaterial) {
                self.applyPmndrsAtmosphereConfigToTarget(state.starsMaterial, config);
                syncPmndrsTakramStarMoonOcclusion(state.starsMaterial, config, state);
                state.starsMaterial.irradianceTexture = state.textures.irradianceTexture || null;
                state.starsMaterial.scatteringTexture = state.textures.scatteringTexture || null;
                state.starsMaterial.transmittanceTexture = state.textures.transmittanceTexture || null;
                state.starsMaterial.singleMieScatteringTexture = state.textures.singleMieScatteringTexture || null;
                state.starsMaterial.higherOrderScatteringTexture = state.textures.higherOrderScatteringTexture || null;
                state.starsMaterial.intensity = intensity;
                state.starsMaterial.pointSize = PMNDRS_STARS_POINT_SIZE;
                state.starsMaterial.background = true;
                state.starsMaterial.ground = config.groundEnabled;
                state.starsMaterial.depthWrite = false;
                state.starsMaterial.depthTest = true;
                state.starsMaterial.needsUpdate = true;
            }

            if (state.starsMesh) {
                state.starsMesh.visible = true;
                const starsRotationMatrix = getPmndrsStarsLocalRotationMatrix(config);
                if (starsRotationMatrix && typeof state.starsMesh.setRotationFromMatrix === 'function') {
                    state.starsMesh.setRotationFromMatrix(starsRotationMatrix);
                } else if (state.starsMesh.rotation && typeof state.starsMesh.rotation.set === 'function') {
                    state.starsMesh.rotation.set(0, 0, 0);
                }
            }

            const fallbackVisible = state.starsMesh
                ? false
                : ensurePmndrsAtmosphereStarsFallback(self, config, state, intensity);
            if (state.starsFallbackMesh && state.starsMesh) {
                state.starsFallbackMesh.visible = false;
            }
            return Boolean(state.starsMesh || fallbackVisible);
        }

        function setPmndrsTexturedMoonDefine(material, enabled) {
            if (!material || !material.defines) {
                return false;
            }
            const active = material.defines.VRODOS_TEXTURED_MOON != null;
            if (enabled === active) {
                return false;
            }
            if (enabled) {
                material.defines.VRODOS_TEXTURED_MOON = '1';
            } else {
                delete material.defines.VRODOS_TEXTURED_MOON;
            }
            material.needsUpdate = true;
            return true;
        }

        function setPmndrsCinematicMoonHaloDefine(material, enabled) {
            if (!material || !material.defines) {
                return false;
            }
            const active = material.defines.VRODOS_CINEMATIC_MOON_HALO != null;
            if (enabled === active) {
                return false;
            }
            if (enabled) {
                material.defines.VRODOS_CINEMATIC_MOON_HALO = '1';
            } else {
                delete material.defines.VRODOS_CINEMATIC_MOON_HALO;
            }
            material.needsUpdate = true;
            return true;
        }

        function setPmndrsProjectedMoonDiscDefine(material, enabled) {
            if (!material || !material.defines) {
                return false;
            }
            const active = material.defines.VRODOS_PROJECTED_MOON_DISC != null;
            if (enabled === active) {
                return false;
            }
            if (enabled) {
                material.defines.VRODOS_PROJECTED_MOON_DISC = '1';
            } else {
                delete material.defines.VRODOS_PROJECTED_MOON_DISC;
            }
            material.needsUpdate = true;
            return true;
        }

        function updatePmndrsMoonDiagnostics(self, state, config, fallbackState) {
            const material = state && state.skyMaterial ? state.skyMaterial : null;
            const defines = material && material.defines ? material.defines : null;
            const moonDefineEnabled = Boolean(defines && (
                (typeof defines.has === 'function' && defines.has('MOON')) ||
                (typeof defines.has !== 'function' && defines.MOON != null)
            ));
            const cloudMoonState = self && self._pmndrsCloudMoonOcclusionState ? self._pmndrsCloudMoonOcclusionState : null;
            const diagnostics = {
                enabled: Boolean(config && config.moonEnabled),
                authoredPhase: config ? config.moonPhase : 'auto',
                effectivePhase: config ? config.effectiveMoonPhase : 'full',
                phaseAngleDeg: config && typeof config.moonPhaseAngleDeg === 'number' ? config.moonPhaseAngleDeg : 0,
                illumination: config && typeof config.moonIllumination === 'number' ? config.moonIllumination : 1,
                angularDiameterDeg: PMNDRS_MOON_ANGULAR_DIAMETER_DEG,
                angularRadiusInvariant: true,
                projectedDiscEnabled: Boolean(defines && defines.VRODOS_PROJECTED_MOON_DISC != null),
                radianceScale: PMNDRS_MOON_RADIANCE_SCALE,
                visibilityBoost: PMNDRS_MOON_VISIBILITY_BOOST,
                orientationMode: config ? config.moonOrientationMode : 'stable-north-up',
                positionMode: config ? config.moonPositionMode : 'author-controlled-night',
                siderealDriftEnabled: Boolean(config && config.astronomicalMoonPosition),
                localDirection: config && config.localMoonDirection ? vectorToRoundedArray(config.localMoonDirection) : null,
                ecefDirection: config && config.moonDirection ? vectorToRoundedArray(config.moonDirection) : null,
                materialMoonEnabled: Boolean(material && material.moon),
                materialMoonDefineEnabled: moonDefineEnabled,
                assetUrl: state && state.moonTextureUrl ? state.moonTextureUrl : getPmndrsTakramMoonColorUrl(),
                shaderPatchApplied: Boolean(state && state.moonShaderPatchApplied),
                textureReady: Boolean(state && state.moonTexture),
                textureLoading: Boolean(state && state.moonTextureLoading),
                textureFailed: Boolean(state && state.moonTextureFailed),
                debugDisabled: hasPmndrsDebugFlag('disableTexturedMoon', 'vrodos_debug_disable_textured_moon'),
                haloEnabled: Boolean(defines && defines.VRODOS_CINEMATIC_MOON_HALO != null),
                haloRadiusScale: PMNDRS_MOON_HALO_RADIUS_SCALE,
                haloStrength: PMNDRS_MOON_HALO_STRENGTH,
                cloudVisibility: cloudMoonState && typeof cloudMoonState.cloudMoonDiscVisibility === 'number'
                    ? cloudMoonState.cloudMoonDiscVisibility
                    : 1,
                cloudOcclusionStrength: cloudMoonState && typeof cloudMoonState.cloudMoonOcclusionStrength === 'number'
                    ? cloudMoonState.cloudMoonOcclusionStrength
                    : 0,
                starOcclusionRadiusDeg: PMNDRS_MOON_ANGULAR_DIAMETER_DEG * 0.5 +
                    THREE.MathUtils.radToDeg(PMNDRS_MOON_STAR_OCCLUSION_FEATHER_RAD),
                starOcclusionShaderApplied: Boolean(state && state.starMoonOcclusionShaderApplied),
                starOcclusionFallbackApplied: Boolean(state && state.starMoonOcclusionFallbackApplied),
                fallbackState: fallbackState || 'native-smooth'
            };
            if (state) {
                state.moonDiagnostics = diagnostics;
            }
            if (self) {
                self._pmndrsMoonDiagnostics = diagnostics;
                if (hasPmndrsDebugFlag('runtimeFeatures', 'vrodos_debug_runtime_features')) {
                    const signature = JSON.stringify(diagnostics);
                    if (signature !== self._pmndrsMoonDiagnosticsLogSignature) {
                        self._pmndrsMoonDiagnosticsLogSignature = signature;
                        console.info(`[VRodos] Moon state: ${signature}`);
                    }
                }
            }
            return diagnostics;
        }

        function applyPmndrsMoonShaderState(self, config, state, material) {
            const uniforms = material && material.uniforms ? material.uniforms : null;
            const patchApplied = Boolean(uniforms &&
                uniforms.vrodosMoonLightDirection &&
                uniforms.vrodosMoonFixedToECEFMatrix &&
                uniforms.vrodosMoonColorTexture &&
                uniforms.vrodosMoonIllumination &&
                uniforms.vrodosMoonHaloRadiusScale &&
                uniforms.vrodosMoonHaloStrength &&
                uniforms.vrodosMoonCloudVisibility);
            const cloudMoonState = self && self._pmndrsCloudMoonOcclusionState
                ? self._pmndrsCloudMoonOcclusionState
                : getPmndrsCloudMoonOcclusionState(self, config, getPmndrsRuntimeLightingSmoothingMs(config));
            const cloudVisibility = cloudMoonState && typeof cloudMoonState.cloudMoonDiscVisibility === 'number'
                ? cloudMoonState.cloudMoonDiscVisibility
                : 1;
            state.moonShaderPatchApplied = patchApplied;
            material.moonAngularRadius = PMNDRS_MOON_ANGULAR_RADIUS;
            material.lunarRadianceScale = PMNDRS_MOON_RADIANCE_SCALE * cloudVisibility;

            if (patchApplied) {
                uniforms.vrodosMoonLightDirection.value.copy(config.moonLightDirection);
                uniforms.vrodosMoonFixedToECEFMatrix.value.copy(config.moonFixedToECEFMatrix);
                uniforms.vrodosMoonIllumination.value = config.moonEnabled ? config.moonIllumination : 0;
                uniforms.vrodosMoonHaloRadiusScale.value = PMNDRS_MOON_HALO_RADIUS_SCALE;
                uniforms.vrodosMoonHaloStrength.value = PMNDRS_MOON_HALO_STRENGTH;
                uniforms.vrodosMoonCloudVisibility.value = cloudVisibility;
            }
            const debugDisabled = hasPmndrsDebugFlag('disableTexturedMoon', 'vrodos_debug_disable_textured_moon');
            const cinematicMoonEnabled = Boolean(config.moonEnabled && patchApplied && !debugDisabled);
            setPmndrsCinematicMoonHaloDefine(material, cinematicMoonEnabled);
            setPmndrsProjectedMoonDiscDefine(material, cinematicMoonEnabled);

            const textured = Boolean(config.moonEnabled && patchApplied && state.moonTexture && !debugDisabled);
            if (patchApplied) {
                uniforms.vrodosMoonColorTexture.value = textured ? state.moonTexture : null;
            }
            setPmndrsTexturedMoonDefine(material, textured);
            updatePmndrsMoonDiagnostics(
                self,
                state,
                config,
                textured ? 'textured' : (debugDisabled ? 'native-debug-disabled' : (state.moonTextureFailed ? 'native-load-failed' : 'native-smooth'))
            );
            return textured;
        }

        function ensurePmndrsAtmosphereMoon(self, config, state, material) {
            if (!self || !state || !config || !material) {
                return false;
            }

            if (!config.moonEnabled || hasPmndrsDebugFlag('disableTexturedMoon', 'vrodos_debug_disable_textured_moon')) {
                return applyPmndrsMoonShaderState(self, config, state, material);
            }

            if (state.moonTexture || state.moonTextureLoading || state.moonTextureFailed) {
                return applyPmndrsMoonShaderState(self, config, state, material);
            }

            state.moonTextureLoading = true;
            state.moonTextureUrl = getPmndrsTakramMoonColorUrl();
            const loadToken = (state.moonTextureLoadToken || 0) + 1;
            state.moonTextureLoadToken = loadToken;
            updatePmndrsMoonDiagnostics(self, state, config, 'native-loading');

            new THREE.TextureLoader().load(
                state.moonTextureUrl,
                (texture) => {
                    if (!self._pmndrsAtmosphereState || self._pmndrsAtmosphereState !== state || state.moonTextureLoadToken !== loadToken) {
                        texture.dispose();
                        return;
                    }
                    texture.name = 'vrodosNasaMoonColor1K';
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.generateMipmaps = true;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.needsUpdate = true;
                    state.moonTexture = texture;
                    state.moonTextureLoading = false;
                    state.moonTextureFailed = false;
                    applyPmndrsMoonShaderState(self, config, state, material);
                    self._takramSkyEnvironmentNeedsUpdate = true;
                    if (typeof self.publishRuntimeFeatureState === 'function') {
                        self.publishRuntimeFeatureState('moon-texture-ready');
                    }
                },
                undefined,
                (error) => {
                    if (state.moonTextureLoadToken !== loadToken) {
                        return;
                    }
                    state.moonTextureLoading = false;
                    state.moonTextureFailed = true;
                    applyPmndrsMoonShaderState(self, config, state, material);
                    if (!state.moonTextureWarningLogged) {
                        state.moonTextureWarningLogged = true;
                        console.warn('[VRodos] NASA moon texture failed to load; Takram native phase moon remains active.', error);
                    }
                    if (typeof self.publishRuntimeFeatureState === 'function') {
                        self.publishRuntimeFeatureState('moon-texture-failed');
                    }
                }
            );

            return applyPmndrsMoonShaderState(self, config, state, material);
        }

        function getTextureIdentity(texture) {
            if (!texture) {
                return 'none';
            }

            return texture.uuid || texture.id || 'texture';
        }

        function getPmndrsAtmosphereSkyMaterialSignature(config, state) {
            const textures = state && state.textures ? state.textures : {};
            return [
                config && config.takramSunEnabled !== false ? 'sun' : 'no-sun',
                config && config.correctAltitudeEnabled !== false ? 'altitude' : 'flat-altitude',
                config && config.groundEnabled ? 'ground' : 'no-ground',
                config ? getPmndrsEffectiveGroundAlbedo(config) : '#000000',
                config && config.moonEnabled ? 'moon' : 'no-moon',
                getTextureIdentity(textures.irradianceTexture),
                getTextureIdentity(textures.scatteringTexture),
                getTextureIdentity(textures.transmittanceTexture),
                getTextureIdentity(textures.singleMieScatteringTexture),
                getTextureIdentity(textures.higherOrderScatteringTexture)
            ].join('|');
        }

        function applyVrTakramSkyDirectCalibration(self, material) {
            if (!shouldUseVrTakramDirectSkyCalibration(self) || !material) {
                const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
                if (state && shouldUseVrTakramVisibleSky(self)) {
                    state.vrTakramSkyDirectCalibrated = false;
                    state.vrTakramSkyDirectExposure = null;
                    state.vrTakramSkyDirectCalibrationMode = 'native-takram-stereo-pmndrs';
                }
                return false;
            }

            const exposure = getVrTakramSkyDirectExposure();
            const preset = self && typeof self.getHorizonSkyPreset === 'function' ? self.getHorizonSkyPreset() : 'natural';
            const lowerHazeColors = getVrTakramVisibleSkyLowerHazeColors(preset);
            const uniforms = material.uniforms || (material.uniforms = {});
            const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
            if (!uniforms.vrodosSkyExposure) {
                uniforms.vrodosSkyExposure = typeof THREE.Uniform === 'function'
                    ? new THREE.Uniform(exposure)
                    : { value: exposure };
            } else {
                uniforms.vrodosSkyExposure.value = exposure;
            }
            if (!uniforms.vrodosVrSkyLowerHazeColor) {
                const lowerVector = new THREE.Vector3();
                uniforms.vrodosVrSkyLowerHazeColor = typeof THREE.Uniform === 'function'
                    ? new THREE.Uniform(lowerVector)
                    : { value: lowerVector };
            }
            if (!uniforms.vrodosVrSkyHorizonHazeColor) {
                const horizonVector = new THREE.Vector3();
                uniforms.vrodosVrSkyHorizonHazeColor = typeof THREE.Uniform === 'function'
                    ? new THREE.Uniform(horizonVector)
                    : { value: horizonVector };
            }
            setVectorFromDisplayHexColor(uniforms.vrodosVrSkyLowerHazeColor.value, lowerHazeColors.lower, '#78828b');
            setVectorFromDisplayHexColor(uniforms.vrodosVrSkyHorizonHazeColor.value, lowerHazeColors.horizon, '#a7bac9');

            material.userData = material.userData || {};
            material.userData.vrodosVrTakramSkyDirectExposure = exposure;
            material.userData.vrodosVrTakramSkyLowerHazeColor = lowerHazeColors.lower;
            material.userData.vrodosVrTakramSkyHorizonHazeColor = lowerHazeColors.horizon;

            if (!material.userData.vrodosVrTakramSkyDirectHookInstalled) {
                const originalOnBeforeCompile = typeof material.onBeforeCompile === 'function'
                    ? material.onBeforeCompile.bind(material)
                    : null;
                const originalCustomProgramCacheKey = typeof material.customProgramCacheKey === 'function'
                    ? material.customProgramCacheKey.bind(material)
                    : null;
                material.onBeforeCompile = function (shader, renderer) {
                    if (originalOnBeforeCompile) {
                        originalOnBeforeCompile(shader, renderer);
                    }
                    shader.uniforms = shader.uniforms || {};
                    shader.uniforms.vrodosSkyExposure = uniforms.vrodosSkyExposure;
                    shader.uniforms.vrodosVrSkyLowerHazeColor = uniforms.vrodosVrSkyLowerHazeColor;
                    shader.uniforms.vrodosVrSkyHorizonHazeColor = uniforms.vrodosVrSkyHorizonHazeColor;
                    if (shader.fragmentShader.indexOf('uniform float vrodosSkyExposure;') === -1) {
                        const calibrationUniforms = [
                            'uniform float vrodosSkyExposure;',
                            'uniform vec3 vrodosVrSkyLowerHazeColor;',
                            'uniform vec3 vrodosVrSkyHorizonHazeColor;'
                        ].join('\n');
                        const withUniform = shader.fragmentShader.replace(
                            'uniform vec3 groundAlbedo;',
                            `uniform vec3 groundAlbedo;\n${  calibrationUniforms}`
                        );
                        shader.fragmentShader = withUniform === shader.fragmentShader
                            ? `${calibrationUniforms}\n${  shader.fragmentShader}`
                            : withUniform;
                    }
                    if (shader.fragmentShader.indexOf('vrodos-direct-sky-calibration') === -1) {
                        const patched = shader.fragmentShader.replace(
                            '  outputColor.a = 1.0;',
                            [
                                '  // vrodos-direct-sky-calibration',
                                '  outputColor.rgb = max(outputColor.rgb * vrodosSkyExposure, vec3(0.0));',
                                '  outputColor.rgb = outputColor.rgb / (outputColor.rgb + vec3(1.0));',
                                '  outputColor.rgb = pow(outputColor.rgb, vec3(0.4545454545));',
                                '  float vrodosLocalElevation = dot(normalize(cameraPosition), rayDirection);',
                                '  float vrodosLowerHazeMix = 1.0 - smoothstep(-0.02, 0.14, vrodosLocalElevation);',
                                '  float vrodosLowerHazeGradient = smoothstep(-0.38, 0.10, vrodosLocalElevation);',
                                '  vec3 vrodosLowerHazeColor = mix(vrodosVrSkyLowerHazeColor, vrodosVrSkyHorizonHazeColor, vrodosLowerHazeGradient);',
                                '  outputColor.rgb = mix(outputColor.rgb, vrodosLowerHazeColor, vrodosLowerHazeMix);',
                                '  outputColor.a = 1.0;'
                            ].join('\n')
                        );
                        const shaderPatched = patched !== shader.fragmentShader &&
                            patched.indexOf('uniform float vrodosSkyExposure;') !== -1 &&
                            patched.indexOf('uniform vec3 vrodosVrSkyLowerHazeColor;') !== -1 &&
                            patched.indexOf('uniform vec3 vrodosVrSkyHorizonHazeColor;') !== -1;
                        shader.fragmentShader = patched;
                        material.userData.vrodosVrTakramSkyDirectShaderPatched = shaderPatched;
                        material.userData.vrodosVrTakramSkyDirectPatchFailed = !shaderPatched;
                        if (!shaderPatched) {
                            material.userData.vrodosVrTakramSkyDirectReadySinceMs = 0;
                            material.userData.vrodosVrTakramSkyDirectWarmed = false;
                        }
                        if (state) {
                            state.vrTakramSkyDirectShaderPatched = shaderPatched;
                            state.vrTakramSkyDirectPatchFailed = !shaderPatched;
                            if (!shaderPatched) {
                                state.vrTakramSkyDirectReadySinceMs = 0;
                                state.vrTakramSkyDirectWarmed = false;
                            }
                        }
                    }
                };
                material.customProgramCacheKey = function () {
                    const baseKey = originalCustomProgramCacheKey ? originalCustomProgramCacheKey() : '';
                    return `${baseKey}|vrodos-vr-takram-sky-direct:${  exposure.toFixed(3)  }:lower-haze-v1`;
                };
                material.userData.vrodosVrTakramSkyDirectHookInstalled = true;
                material.userData.vrodosVrTakramSkyDirectShaderPatched = false;
                material.userData.vrodosVrTakramSkyDirectPatchFailed = false;
                material.userData.vrodosVrTakramSkyDirectReadySinceMs = 0;
                material.userData.vrodosVrTakramSkyDirectWarmupMs = getVrTakramSkyRevealWarmupMs();
                material.userData.vrodosVrTakramSkyDirectWarmed = false;
                material.userData.vrodosVrTakramSkyDirectWarmupRemainingMs = material.userData.vrodosVrTakramSkyDirectWarmupMs;
            }

            if (!material.userData.vrodosVrTakramSkyDirectShaderPatched || material.userData.vrodosVrTakramSkyDirectPatchFailed) {
                material.needsUpdate = true;
            }

            if (state) {
                state.vrTakramSkyDirectCalibrated = true;
                state.vrTakramSkyDirectExposure = exposure;
                state.vrTakramSkyDirectCalibrationMode = 'legacy-headset-direct-sky';
                state.vrTakramSkyDirectShaderPatched = Boolean(material.userData.vrodosVrTakramSkyDirectShaderPatched);
                state.vrTakramSkyDirectPatchFailed = Boolean(material.userData.vrodosVrTakramSkyDirectPatchFailed);
                state.vrTakramSkyDirectReadySinceMs = material.userData.vrodosVrTakramSkyDirectReadySinceMs || 0;
                state.vrTakramSkyDirectWarmupMs = material.userData.vrodosVrTakramSkyDirectWarmupMs || getVrTakramSkyRevealWarmupMs();
                state.vrTakramSkyDirectWarmed = Boolean(material.userData.vrodosVrTakramSkyDirectWarmed);
                state.vrTakramSkyDirectWarmupRemainingMs = material.userData.vrodosVrTakramSkyDirectWarmupRemainingMs || state.vrTakramSkyDirectWarmupMs;
            }

            return true;
        }

        function setPmndrsMaterialDefine(defines, key, value) {
            if (!defines) {
                return false;
            }
            if (typeof defines.set === 'function') {
                if (defines.get(key) !== value) {
                    defines.set(key, value);
                    return true;
                }
                return false;
            }
            if (defines[key] !== value) {
                defines[key] = value;
                return true;
            }
            return false;
        }

        function removePmndrsMaterialDefine(defines, key) {
            if (!defines) {
                return false;
            }
            if (typeof defines.delete === 'function') {
                if (defines.has(key)) {
                    defines.delete(key);
                    return true;
                }
                return false;
            }
            if (Object.prototype.hasOwnProperty.call(defines, key)) {
                delete defines[key];
                return true;
            }
            return false;
        }

        function setPmndrsSkyMaterialNativeSun(self, enabled) {
            const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
            const material = state && state.skyMaterial ? state.skyMaterial : null;
            if (!material || typeof material.sun === 'undefined') {
                return false;
            }

            const nextEnabled = Boolean(enabled);
            let changed = false;
            if (material.sun !== nextEnabled) {
                material.sun = nextEnabled;
                changed = true;
            }
            if (nextEnabled) {
                material.defines = material.defines || {};
                changed = setPmndrsMaterialDefine(material.defines, "SUN", "1") || changed;
                changed = setPmndrsMaterialDefine(material.defines, "PERSPECTIVE_CAMERA", "1") || changed;
            } else if (material.defines) {
                changed = removePmndrsMaterialDefine(material.defines, "SUN") || changed;
            }
            if (changed) {
                material.needsUpdate = true;
                if (typeof material.setChanged === 'function') {
                    material.setChanged();
                }
            }
            return true;
        }

        function isPmndrsCloudSunDiskSpriteDisabled() {
            if (window.VRODOS_DEBUG && window.VRODOS_DEBUG.disablePmndrsCloudSunDiskSprite === true) {
                return true;
            }
            if (typeof window.location === 'undefined' || !window.location.search) {
                return false;
            }
            try {
                const params = new URLSearchParams(window.location.search);
                return params.get('vrodos_debug_disable_pmndrs_cloud_sun_sprite') === '1';
            } catch (err) {
                return false;
            }
        }

        function isPmndrsDesktopPresentation(self) {
            if (!self || !self.el) {
                return false;
            }
            if (typeof self.isDirectVrPresentationActive === 'function' && self.isDirectVrPresentationActive()) {
                return false;
            }
            if (typeof self.isImmersiveXrActive === 'function' && self.isImmersiveXrActive()) {
                return false;
            }
            const renderer = self.el.renderer;
            return !(renderer && renderer.xr && renderer.xr.isPresenting);
        }

        function shouldUsePmndrsTakramCloudPhaseSunDisk(self, config, cloudSunOcclusion) {
            if (!self || !config || config.enabled === false || config.takramSunEnabled === false) {
                return false;
            }
            if (!shouldUsePmndrsTakramHorizonPath(self) || !isPmndrsDesktopPresentation(self)) {
                return false;
            }
            const diagnostics = self._pmndrsCloudsDiagnostics || null;
            if (!(diagnostics && diagnostics.cloudsActive === true && diagnostics.accuratePhaseFunction === true)) {
                return false;
            }
            const targetVisibility = getPmndrsCloudSkySunDiskTargetVisibility(cloudSunOcclusion);
            const visibilityThreshold = self._pmndrsCloudSunDiskTakramPhaseActive === true
                ? PMNDRS_CLOUD_SUN_DISK_SPRITE_RELEASE_VISIBILITY
                : PMNDRS_CLOUD_SUN_DISK_SPRITE_ACTIVATE_VISIBILITY;
            return targetVisibility < visibilityThreshold;
        }

        function shouldUsePmndrsCloudSunDiskSprite(self, config, cloudSunOcclusion) {
            if (!self || !config || config.enabled === false || config.takramSunEnabled === false) {
                return false;
            }
            if (isPmndrsCloudSunDiskSpriteDisabled() || shouldDisablePmndrsVisibleSunDebug()) {
                return false;
            }
            if (shouldUsePmndrsTakramCloudPhaseSunDisk(self, config, cloudSunOcclusion)) {
                return false;
            }
            if (!shouldUsePmndrsTakramHorizonPath(self) || !isPmndrsDesktopPresentation(self)) {
                return false;
            }
            const diagnostics = self._pmndrsCloudsDiagnostics || null;
            const cloudsActive = Boolean((diagnostics && diagnostics.cloudsActive === true) || self.pmndrsCloudsEffect);
            if (!cloudsActive) {
                return false;
            }
            const sunElevationFactor = cloudSunOcclusion && typeof cloudSunOcclusion.cloudSunElevationFactor === 'number'
                ? cloudSunOcclusion.cloudSunElevationFactor
                : (cloudSunOcclusion && typeof cloudSunOcclusion.sunElevationFactor === 'number'
                    ? cloudSunOcclusion.sunElevationFactor
                    : getPmndrsSunDirectLightVisibility(config));
            if (sunElevationFactor <= 0.001) {
                return false;
            }
            const targetVisibility = getPmndrsCloudSkySunDiskTargetVisibility(cloudSunOcclusion);
            const visibilityThreshold = self._pmndrsCloudSunDiskSpriteActive === true
                ? PMNDRS_CLOUD_SUN_DISK_SPRITE_RELEASE_VISIBILITY
                : PMNDRS_CLOUD_SUN_DISK_SPRITE_ACTIVATE_VISIBILITY;
            return targetVisibility < visibilityThreshold;
        }

        function getPmndrsCloudSkySunDiskTargetVisibility(cloudSunOcclusion) {
            if (cloudSunOcclusion && typeof cloudSunOcclusion.cloudSkySunDiskVisibility === 'number') {
                return clamp01(cloudSunOcclusion.cloudSkySunDiskVisibility);
            }
            if (cloudSunOcclusion && typeof cloudSunOcclusion.skySunDiskVisibility === 'number') {
                return clamp01(cloudSunOcclusion.skySunDiskVisibility);
            }
            return 1;
        }

        function shouldHidePmndrsTakramPhaseNativeSunDisk(self, targetVisibility) {
            const visibility = Number.isFinite(targetVisibility) ? clamp01(targetVisibility) : 1;
            const threshold = self && self._pmndrsCloudSunDiskTakramPhaseNativeHidden === true
                ? PMNDRS_CLOUD_PHASE_NATIVE_SUN_RELEASE_VISIBILITY
                : PMNDRS_CLOUD_PHASE_NATIVE_SUN_HIDE_VISIBILITY;
            return visibility <= threshold;
        }

        function getPmndrsCloudSunDiskSpriteOpacity(visibility) {
            const value = Number.isFinite(visibility) ? clamp01(visibility) : 1;
            if (value >= 0.999) {
                return 1;
            }
            const curved = Math.pow(value, PMNDRS_CLOUD_SUN_DISK_SPRITE_OPACITY_CURVE);
            return Math.max(PMNDRS_CLOUD_SUN_DISK_SPRITE_OPACITY_MIN, curved);
        }

        function applyPmndrsSunSpriteCloudVisibility(self, visibility, opacity) {
            if (typeof document === 'undefined') {
                return;
            }
            const spriteOpacity = Number.isFinite(opacity)
                ? clamp01(opacity)
                : getPmndrsCloudSunDiskSpriteOpacity(visibility);
            const sunEl = document.getElementById('vrodos-pmndrs-sun');
            const sprite = sunEl && typeof sunEl.getObject3D === 'function'
                ? sunEl.getObject3D('mesh')
                : null;
            if (sprite && sprite.material) {
                sprite.material.opacity = spriteOpacity;
                sprite.material.transparent = true;
                sprite.material.needsUpdate = true;
            }

            const hazeEl = document.getElementById('vrodos-pmndrs-sun-haze');
            const hazeSprite = hazeEl && typeof hazeEl.getObject3D === 'function'
                ? hazeEl.getObject3D('mesh')
                : null;
            if (hazeSprite && hazeSprite.material) {
                hazeSprite.visible = false;
                hazeSprite.material.opacity = 0;
                hazeSprite.material.needsUpdate = true;
            }
        }

        function getPmndrsCloudSunDiskScreenOverlayOpacity(visibility) {
            const value = Number.isFinite(visibility) ? clamp01(visibility) : 1;
            if (value >= PMNDRS_CLOUD_SUN_DISK_SPRITE_ACTIVATE_VISIBILITY) {
                return 0;
            }
            return Math.max(0.08, Math.min(0.26, 0.055 + ((1 - value) * 0.19)));
        }

        function clearPmndrsCloudSunDiskScreenOverlay(self) {
            if (typeof document !== 'undefined') {
                const overlay = document.getElementById('vrodos-pmndrs-cloud-sun-disk-overlay');
                if (overlay && overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }
            if (self) {
                self._pmndrsCloudSunDiskScreenOverlayOpacity = 0;
            }
        }

        function syncPmndrsCloudSunDiskScreenOverlay(self, lightPosition, visibility) {
            if (!self || !self.el || typeof document === 'undefined') {
                return 0;
            }
            const renderer = self.el.renderer;
            const camera = self.el.camera;
            const canvas = renderer && renderer.domElement ? renderer.domElement : null;
            if (!canvas || !camera || typeof camera.getWorldPosition !== 'function' || typeof canvas.getBoundingClientRect !== 'function') {
                clearPmndrsCloudSunDiskScreenOverlay(self);
                return 0;
            }
            const sceneOcclusion = typeof self._pmndrsSunOcclusionFactor === 'number'
                ? self._pmndrsSunOcclusionFactor
                : 1;
            const overlayOpacity = getPmndrsCloudSunDiskScreenOverlayOpacity(visibility) * clamp01(sceneOcclusion);
            if (overlayOpacity <= 0.001 || !lightPosition) {
                clearPmndrsCloudSunDiskScreenOverlay(self);
                return 0;
            }

            if (!self._pmndrsCloudSunDiskWorldPosition) {
                self._pmndrsCloudSunDiskWorldPosition = new THREE.Vector3();
                self._pmndrsCloudSunDiskScreenPosition = new THREE.Vector3();
                self._pmndrsCloudSunDiskCameraPosition = new THREE.Vector3();
            }

            const sunDirection = getImmersivePresentedSunDirection(self, parseLightPositionVector(lightPosition));
            camera.getWorldPosition(self._pmndrsCloudSunDiskCameraPosition);
            self._pmndrsCloudSunDiskWorldPosition.copy(self._pmndrsCloudSunDiskCameraPosition).addScaledVector(
                sunDirection,
                self._pmndrsSunDistance || 5200
            );
            self._pmndrsCloudSunDiskScreenPosition.copy(self._pmndrsCloudSunDiskWorldPosition).project(camera);
            const projected = self._pmndrsCloudSunDiskScreenPosition;
            if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y) || !Number.isFinite(projected.z) ||
                projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > 1.15 || Math.abs(projected.y) > 1.15) {
                clearPmndrsCloudSunDiskScreenOverlay(self);
                return 0;
            }

            let overlay = document.getElementById('vrodos-pmndrs-cloud-sun-disk-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'vrodos-pmndrs-cloud-sun-disk-overlay';
                overlay.setAttribute('data-vrodos-pmndrs-sun', 'true');
                overlay.style.position = 'fixed';
                overlay.style.pointerEvents = 'none';
                overlay.style.borderRadius = '999px';
                overlay.style.background = 'radial-gradient(circle, rgba(255,244,214,0.46) 0%, rgba(255,230,184,0.26) 34%, rgba(255,210,150,0.10) 66%, rgba(255,210,150,0) 100%)';
                overlay.style.mixBlendMode = 'screen';
                overlay.style.transform = 'translate(-50%, -50%)';
                overlay.style.zIndex = '2';
                document.body.appendChild(overlay);
            }

            const rect = canvas.getBoundingClientRect();
            const size = Math.max(30, Math.min(76, Math.round(rect.height * 0.05)));
            overlay.style.width = `${size}px`;
            overlay.style.height = `${size}px`;
            overlay.style.left = `${rect.left + ((projected.x * 0.5 + 0.5) * rect.width)}px`;
            overlay.style.top = `${rect.top + ((-projected.y * 0.5 + 0.5) * rect.height)}px`;
            overlay.style.opacity = String(overlayOpacity);
            overlay.style.display = 'block';
            self._pmndrsCloudSunDiskScreenOverlayOpacity = overlayOpacity;
            return overlayOpacity;
        }

        function syncPmndrsSkySunDiskCloudAttenuation(self, config, cloudSunOcclusion, smoothingMs) {
            const diagnostics = self._pmndrsCloudsDiagnostics || {};
            const targetVisibility = getPmndrsCloudSkySunDiskTargetVisibility(cloudSunOcclusion);
            const takramPhaseOwnsSunDisk = shouldUsePmndrsTakramCloudPhaseSunDisk(self, config, cloudSunOcclusion);
            const shouldUseSprite = !takramPhaseOwnsSunDisk && shouldUsePmndrsCloudSunDiskSprite(self, config, cloudSunOcclusion);
            let visibility = (shouldUseSprite || takramPhaseOwnsSunDisk)
                ? smoothPmndrsRuntimeLightValue(
                    self,
                    'takramSkySunDiskSpriteVisibility',
                    targetVisibility,
                    smoothingMs || PMNDRS_CLOUD_SUN_OCCLUSION_STATIC_SMOOTH_MS,
                    typeof diagnostics.cloudSkySunDiskVisibility === 'number'
                        ? diagnostics.cloudSkySunDiskVisibility
                        : targetVisibility
                )
                : 1;

            if (takramPhaseOwnsSunDisk) {
                const hideNativeSunDisk = shouldHidePmndrsTakramPhaseNativeSunDisk(self, targetVisibility);
                const hasLegacySunSprite = self._pmndrsCloudSunDiskSpriteActive === true ||
                    self._pmndrsSunSpriteActive === true ||
                    (typeof document !== 'undefined' && (
                        document.getElementById('vrodos-pmndrs-sun') ||
                        document.getElementById('vrodos-pmndrs-sun-haze') ||
                        document.getElementById('vrodos-takram-visible-sun')
                    ));
                if (hasLegacySunSprite) {
                    clearPmndrsHorizonSun(self);
                }
                clearPmndrsCloudSunDiskScreenOverlay(self);
                self._pmndrsCloudSunDiskTakramPhaseActive = true;
                self._pmndrsCloudSunDiskTakramPhaseNativeHidden = hideNativeSunDisk;
                self._pmndrsCloudSunDiskSpriteActive = false;
                self._pmndrsCloudSunDiskSpriteVisibility = visibility;
                self._pmndrsCloudSunDiskSpriteOpacity = 0;
                const sceneOcclusion = typeof self._pmndrsSunOcclusionFactor === 'number'
                    ? self._pmndrsSunOcclusionFactor
                    : 1;
                setPmndrsSkyMaterialNativeSun(self, !hideNativeSunDisk && config && config.takramSunEnabled !== false && sceneOcclusion > 0.01);
            } else if (shouldUseSprite) {
                self._pmndrsCloudSunDiskTakramPhaseActive = false;
                self._pmndrsCloudSunDiskTakramPhaseNativeHidden = false;
                const horizonPreset = typeof self.getHorizonSkyPreset === 'function' ? self.getHorizonSkyPreset() : 'natural';
                const spriteOpacity = getPmndrsCloudSunDiskSpriteOpacity(visibility);
                self._pmndrsCloudSunDiskSpriteActive = true;
                self._pmndrsCloudSunDiskSpriteVisibility = visibility;
                self._pmndrsCloudSunDiskSpriteOpacity = spriteOpacity;
                setPmndrsSkyMaterialNativeSun(self, false);
                ensurePmndrsHorizonSun(self, config.localSunDirection || config.sunDirection, horizonPreset, {
                    atmosphere: true,
                    forceAtmosphereSprite: true,
                    cloudSunDiskSprite: true,
                    sunOpacity: spriteOpacity,
                    sunIntensityScale: PMNDRS_CLOUD_SUN_DISK_SPRITE_INTENSITY_SCALE
                });
                applyPmndrsSunSpriteCloudVisibility(self, visibility, spriteOpacity);
                syncPmndrsCloudSunDiskScreenOverlay(self, config.localSunDirection || config.sunDirection, visibility);
            } else {
                visibility = 1;
                self._pmndrsCloudSunDiskTakramPhaseActive = false;
                const wasTakramPhaseNativeHidden = self._pmndrsCloudSunDiskTakramPhaseNativeHidden === true;
                self._pmndrsCloudSunDiskTakramPhaseNativeHidden = false;
                if (self._pmndrsCloudSunDiskSpriteActive) {
                    self._pmndrsCloudSunDiskSpriteActive = false;
                    self._pmndrsCloudSunDiskSpriteVisibility = 1;
                    self._pmndrsCloudSunDiskSpriteOpacity = 1;
                    clearPmndrsHorizonSun(self);
                    clearPmndrsCloudSunDiskScreenOverlay(self);
                    const sceneOcclusion = typeof self._pmndrsSunOcclusionFactor === 'number'
                        ? self._pmndrsSunOcclusionFactor
                        : 1;
                    setPmndrsSkyMaterialNativeSun(self, config && config.takramSunEnabled !== false && sceneOcclusion > 0.01);
                } else if (wasTakramPhaseNativeHidden) {
                    const sceneOcclusion = typeof self._pmndrsSunOcclusionFactor === 'number'
                        ? self._pmndrsSunOcclusionFactor
                        : 1;
                    setPmndrsSkyMaterialNativeSun(self, config && config.takramSunEnabled !== false && sceneOcclusion > 0.01);
                }
            }

            diagnostics.cloudSkySunDiskVisibility = roundPmndrsCloudSunOcclusionDiagnostic(visibility);
            diagnostics.cloudSkySunDiskTargetVisibility = roundPmndrsCloudSunOcclusionDiagnostic(targetVisibility);
            diagnostics.cloudSkySunDiskSpriteOpacity = roundPmndrsCloudSunOcclusionDiagnostic(shouldUseSprite ? self._pmndrsCloudSunDiskSpriteOpacity : 0);
            diagnostics.cloudSkySunDiskScreenOpacity = roundPmndrsCloudSunOcclusionDiagnostic(shouldUseSprite ? self._pmndrsCloudSunDiskScreenOverlayOpacity : 0);
            diagnostics.cloudSkySunDiskNativeHidden = Boolean(takramPhaseOwnsSunDisk && self._pmndrsCloudSunDiskTakramPhaseNativeHidden === true);
            diagnostics.cloudSkySunDiskMode = takramPhaseOwnsSunDisk
                ? (diagnostics.cloudSkySunDiskNativeHidden ? 'takram-phase-muted' : 'takram-phase')
                : (shouldUseSprite ? 'sprite' : 'native');
            self._pmndrsCloudsDiagnostics = diagnostics;
            self.pmndrsCloudsDiagnostics = diagnostics;

            const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
            if (state) {
                state.skySunDiskCloudVisibility = visibility;
                state.skySunDiskCloudTargetVisibility = (shouldUseSprite || takramPhaseOwnsSunDisk) ? targetVisibility : 1;
                state.skySunDiskCloudShaderPatched = false;
                state.skySunDiskCloudPatchFailed = false;
                state.skySunDiskNativeHidden = diagnostics.cloudSkySunDiskNativeHidden;
                state.skySunDiskCloudMode = diagnostics.cloudSkySunDiskMode;
            }

            return visibility;
        }

        function ensurePmndrsAtmosphereSky(self, config) {
            config = getPresentedPmndrsAtmosphereConfig(self, config);
            const state = self.ensurePmndrsAtmosphereResources ? self.ensurePmndrsAtmosphereResources() : null;
            const vta = window.VRODOS_TAKRAM_ATMOSPHERE;
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
                    sun: config.takramSunEnabled !== false,
                    correctAltitude: config.correctAltitudeEnabled !== false,
                    ground: config.groundEnabled,
                    groundAlbedo: new THREE.Color(getPmndrsEffectiveGroundAlbedo(config)),
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
                const materialSignature = getPmndrsAtmosphereSkyMaterialSignature(config, state);
                const materialSignatureChanged = state.skyMaterialSignature !== materialSignature;
                applyVrTakramSkyDirectCalibration(self, state.skyMaterial);
                const skyCloudState = getPmndrsCloudSunOcclusionState(
                    self,
                    config,
                    getPmndrsRuntimeLightingSmoothingMs(config),
                    getPmndrsRuntimeIndirectLightingSmoothingMs(config)
                );
                const skyMaterialConfig = shouldUsePmndrsCloudSunDiskSprite(self, config, skyCloudState)
                    ? Object.assign({}, config, { takramSunEnabled: false })
                    : config;
                self.applyPmndrsAtmosphereConfigToTarget(state.skyMaterial, skyMaterialConfig);
                syncPmndrsSkySunDiskCloudAttenuation(self, config, skyCloudState, getPmndrsRuntimeLightingSmoothingMs(config));
                if (materialSignatureChanged) {
                    state.skyMaterial.irradianceTexture = state.textures.irradianceTexture || null;
                    state.skyMaterial.scatteringTexture = state.textures.scatteringTexture || null;
                    state.skyMaterial.transmittanceTexture = state.textures.transmittanceTexture || null;
                    state.skyMaterial.singleMieScatteringTexture = state.textures.singleMieScatteringTexture || null;
                    state.skyMaterial.higherOrderScatteringTexture = state.textures.higherOrderScatteringTexture || null;
                    state.skyMaterial.needsUpdate = true;
                    state.skyMaterialSignature = materialSignature;
                }
                state.skyMaterial.dithering = true;
                syncPmndrsCloudShadowLengthToSkyMaterial(self, undefined, 'sky-ready');
            }

            if (state.skyMesh) {
                state.skyMesh.visible = true;
            }
            ensurePmndrsAtmosphereStars(self, config, state, vta);
            ensurePmndrsAtmosphereMoon(self, config, state, state.skyMaterial);

            return true;
        }

        function showPmndrsAtmosphereSkyForSceneProbe(self, config) {
            const wasVisible = isPmndrsAtmosphereSkyVisible(self);
            if (!ensurePmndrsAtmosphereSky(self, config)) {
                return false;
            }

            setPmndrsAtmosphereSkyVisibility(self, true);
            return !wasVisible;
        }

        function hidePmndrsAtmosphereSky(self) {
            setPmndrsAtmosphereSkyVisibility(self, false);
        }

        function clearPmndrsHorizonSun(self) {
            if (!self) {
                return;
            }

            for (const id of ['vrodos-pmndrs-sun', 'vrodos-pmndrs-sun-haze', 'vrodos-takram-visible-sun']) {
                const element = document.getElementById(id);
                if (!element) continue;
                const sprite = element.getObject3D('mesh');
                if (sprite) {
                    element.removeObject3D('mesh');
                    // THREE.Sprite geometry is shared globally; only its material is ours.
                    VRODOSMaster.RuntimeResources.dispose(sprite.material);
                }
                if (element.parentNode) element.parentNode.removeChild(element);
            }
            clearPmndrsCloudSunDiskScreenOverlay(self);
            self._pmndrsSunDirection = null;
            self._pmndrsSunDistance = null;
            self._pmndrsSunSpriteActive = false;
            self._pmndrsCloudSunDiskTakramPhaseActive = false;
            self._pmndrsCloudSunDiskTakramPhaseNativeHidden = false;
            self._pmndrsCloudSunDiskSpriteActive = false;
            self._pmndrsCloudSunDiskSpriteVisibility = 1;
            self._pmndrsCloudSunDiskSpriteOpacity = 1;
        }

        function disposePmndrsAtmosphereAuxiliaryVisuals(self) {
            if (!self) return;
            clearPmndrsHorizonSun(self);
            const overlay = document.getElementById('vrodos-pmndrs-cloud-sun-disk-overlay');
            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            removeVrTakramLightsOnlyGradientSky(self);
            VRODOSMaster.RuntimeResources.dispose([self._pmndrsSunTexture, self._pmndrsSunHazeTexture]);
            self._pmndrsSunTexture = null;
            self._pmndrsSunHazeTexture = null;
        }

        function shouldDisablePmndrsVisibleSunDebug() {
            if (window.VRODOS_DEBUG && window.VRODOS_DEBUG.disablePmndrsSunSprite === true) {
                return true;
            }

            if (typeof window.location === 'undefined' || !window.location.search) {
                return false;
            }

            try {
                const params = new URLSearchParams(window.location.search);
                return params.get('vrodos_debug_disable_pmndrs_sun') === '1';
            } catch (err) {
                return false;
            }
        }

        function shouldUsePmndrsXrAtmosphereSunFallback(self) {
            if (!self || !self.data || self.data.selChoice !== "0" || self.data.postFXEngine !== 'pmndrs') {
                return false;
            }
            const lensFlareEnabled = typeof self.isPmndrsLensFlareEnabled === 'function'
                ? self.isPmndrsLensFlareEnabled()
                : readPmndrsAtmosphereBool(self, 'pmndrsLensFlareEnabled', false);
            self._pmndrsVrLensFlareSuppressed = typeof self.isVrLensFlareSuppressed === 'function'
                ? self.isVrLensFlareSuppressed()
                : false;
            if (!lensFlareEnabled) {
                return false;
            }
            if (typeof self.isDirectVrPresentationActive === 'function') {
                return self.isDirectVrPresentationActive();
            }
            if (typeof self.isImmersiveXrActive === 'function') {
                return self.isImmersiveXrActive();
            }
            const renderer = self.el && self.el.renderer;
            return Boolean(renderer && renderer.xr && renderer.xr.isPresenting);
        }

        function ensurePmndrsHorizonSun(self, lightPosition, preset, options) {
            if (!self || !self.el || typeof document === 'undefined') {
                return;
            }
            bindAtmosphereVisualOwner(self);
            const opts = options || {};
            if (shouldDisablePmndrsVisibleSunDebug()) {
                clearPmndrsHorizonSun(self);
                return;
            }
            if (opts.atmosphere && opts.forceAtmosphereSprite !== true) {
                clearPmndrsHorizonSun(self);
                return;
            }

            let sunEl = document.getElementById('vrodos-pmndrs-sun');
            if (!sunEl) {
                sunEl = document.createElement('a-entity');
                sunEl.setAttribute('id', 'vrodos-pmndrs-sun');
                sunEl.setAttribute('data-vrodos-pmndrs-sun', 'true');
                self.el.appendChild(sunEl);
            }

            const texture = createPmndrsSunTexture(self);
            if (!texture) {
                return;
            }
            const hazeTexture = createPmndrsSunHazeTexture(self);

            let sprite = sunEl.getObject3D('mesh');
            if (!sprite) {
                const material = new THREE.SpriteMaterial({
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

            let hazeEl = document.getElementById('vrodos-pmndrs-sun-haze');
            if (!hazeEl) {
                hazeEl = document.createElement('a-entity');
                hazeEl.setAttribute('id', 'vrodos-pmndrs-sun-haze');
                hazeEl.setAttribute('data-vrodos-pmndrs-sun', 'true');
                self.el.appendChild(hazeEl);
            }

            let hazeSprite = hazeEl.getObject3D('mesh');
            if (!hazeSprite && hazeTexture) {
                const hazeMaterial = new THREE.SpriteMaterial({
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

            const cfg = getPmndrsHorizonSunConfig(preset, opts.atmosphere ? 'atmosphere' : 'fallback');
            sprite.scale.set(cfg.scale, cfg.scale, 1);

            // pmndrs applies ACES Filmic over the entire HDR framebuffer, which
            // compresses LDR colors (<= 1.0) into dull grey. We must multiply the
            // sun's authored color so it sits in the HDR range and survives tone
            // mapping as a bright glowing light source.
            const sunIntensityScale = Number.isFinite(opts.sunIntensityScale) ? Math.max(0.1, Math.min(3, opts.sunIntensityScale)) : 1;
            sprite.material.color.set(cfg.color).multiplyScalar((cfg.intensity || (opts.atmosphere ? 5.5 : 4.0)) * sunIntensityScale);
            sprite.material.opacity = Number.isFinite(opts.sunOpacity) ? clamp01(opts.sunOpacity) : 1;
            sprite.material.transparent = true;
            if (hazeSprite && hazeSprite.material) {
                if (opts.atmosphere && !opts.cloudSunDiskSprite && cfg.hazeScale > 0 && cfg.hazeIntensity > 0) {
                    hazeSprite.visible = true;
                    hazeSprite.scale.set(cfg.hazeScale, cfg.hazeScale, 1);
                    hazeSprite.material.color.set('#ffd6a4').multiplyScalar(cfg.hazeIntensity);
                    hazeSprite.material.opacity = 1;
                } else {
                    hazeSprite.visible = false;
                    hazeSprite.material.opacity = 0;
                }
            }

            self._pmndrsSunDirection = parseLightPositionVector(lightPosition);
            self._pmndrsSunDistance = cfg.distance;

            const camera = self.el.camera;
            if (!camera || typeof camera.getWorldPosition !== 'function') {
                return;
            }

            if (!self._pmndrsSunCameraPosition) {
                self._pmndrsSunCameraPosition = new THREE.Vector3();
            }

            sunEl.object3D.visible = true;
            camera.getWorldPosition(self._pmndrsSunCameraPosition);
            const presentedSunDirection = getImmersivePresentedSunDirection(self, self._pmndrsSunDirection);
            sunEl.object3D.position.copy(self._pmndrsSunCameraPosition).addScaledVector(presentedSunDirection, self._pmndrsSunDistance || 5200);
            if (hazeEl && hazeEl.object3D) {
                hazeEl.object3D.position.copy(sunEl.object3D.position);
            }
            self._pmndrsSunSpriteActive = Boolean(sunEl.object3D.visible);
            applyPmndrsSunOcclusion(self, presentedSunDirection, self._pmndrsSunDistance || 5200);
        }

        return {
            syncPmndrsCloudShadowLengthToSkyMaterial,
            removePmndrsAtmosphereSky,
            setPmndrsAtmosphereSkyVisibility,
            isPmndrsAtmosphereSkyVisible,
            schedulePmndrsHorizonEnvironmentCleanup,
            hidePmndrsHorizonEnvironmentVisuals,
            isVrTakramVisibleSkyReadyForHandoff,
            completeVrTakramVisibleSkyHandoff,
            syncVrTakramLightsOnlyHorizonVisuals,
            scheduleVrTakramLightsOnlyHorizonVisualSync,
            removeLegacySunSkyEntitiesForPmndrs,
            setPmndrsSkyMaterialNativeSun,
            syncPmndrsSkySunDiskCloudAttenuation,
            ensurePmndrsAtmosphereSky,
            showPmndrsAtmosphereSkyForSceneProbe,
            hidePmndrsAtmosphereSky,
            clearPmndrsHorizonSun,
            disposePmndrsAtmosphereAuxiliaryVisuals,
            shouldUsePmndrsXrAtmosphereSunFallback,
            ensurePmndrsHorizonSun
        };
    }
})();
