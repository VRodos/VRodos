/**
 * VRodos Quality Profile Helpers
 * Extracted from vrodos_scene_settings.component.js
 */
/* global VRODOSMaster, vrodosEnhanceMeshMaterial, vrodosGetExplicitMaterialOverrides */
(function () {
    const H = VRODOSMaster.SceneSettingsHelpers = VRODOSMaster.SceneSettingsHelpers || {};
    const TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS = 0.004675;
    const PMNDRS_NIGHT_REFLECTION_INTENSITY_SCALE = 0.18;
    const WGS84_EQUATORIAL_RADIUS = 6378137;
    const WGS84_POLAR_RADIUS = 6356752.3142451793;
    const runtimeSettingsContract = window.VRODOS_RUNTIME_SETTINGS_CONTRACT || {};
    const PMNDRS_HORIZON_HELPER_LIGHT_DEFAULTS = runtimeSettingsContract.horizonHelperLightPresets || {
        natural: {
            keyIntensity: 1.15,
            fillIntensity: 0.45
        },
        clear: {
            keyIntensity: 1.24,
            fillIntensity: 0.55
        },
        crisp: {
            keyIntensity: 1.19,
            fillIntensity: 0.49
        }
    };
    const PMNDRS_ATMOSPHERE_LOOK_DEFAULTS = runtimeSettingsContract.atmosphereLookDefaults || {
        night: {
            sunElevationDeg: -18,
            sunAzimuthDeg: 25,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.16,
            albedoScale: 0.85,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 0.9,
            mieScatteringScale: 0.45,
            mieExtinctionScale: 0.55,
            miePhaseG: 0.8,
            absorptionScale: 1.05,
            moonEnabled: true
        },
        dawn: {
            sunElevationDeg: -5,
            sunAzimuthDeg: -65,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.45,
            albedoScale: 0.9,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 1.0,
            mieScatteringScale: 0.75,
            mieExtinctionScale: 0.85,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        },
        sunrise: {
            sunElevationDeg: 2,
            sunAzimuthDeg: -55,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.65,
            albedoScale: 0.96,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 1.0,
            mieScatteringScale: 0.9,
            mieExtinctionScale: 0.95,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        },
        'early-morning': {
            sunElevationDeg: 22,
            sunAzimuthDeg: -28,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.5,
            albedoScale: 1.0,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 1.0,
            mieScatteringScale: 0.95,
            mieExtinctionScale: 0.98,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
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
            groundAlbedo: '#1a1a1a',
            rayleighScale: 1.0,
            mieScatteringScale: 1.0,
            mieExtinctionScale: 1.0,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        },
        'golden-hour': {
            sunElevationDeg: 5,
            sunAzimuthDeg: 32,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.65,
            albedoScale: 0.98,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 1.0,
            mieScatteringScale: 0.9,
            mieExtinctionScale: 0.95,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        },
        sunset: {
            sunElevationDeg: 1,
            sunAzimuthDeg: 38,
            sunDistance: 5200,
            sunAngularRadius: TAKRAM_DEFAULT_SUN_ANGULAR_RADIUS,
            aerialStrength: 0.75,
            albedoScale: 0.96,
            transmittanceEnabled: true,
            inscatterEnabled: true,
            groundEnabled: true,
            groundAlbedo: '#1a1a1a',
            rayleighScale: 1.0,
            mieScatteringScale: 0.95,
            mieExtinctionScale: 1.05,
            miePhaseG: 0.8,
            absorptionScale: 1.0,
            moonEnabled: false
        }
    };
    function clampPmndrsNumber(value, min, max, fallback) {
        const n = parseFloat(value);
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

    function normalizePmndrsToneMappingMode(value) {
        switch (value) {
            case 'agx':
            case 'reinhard':
            case 'cineon':
            case 'aces-filmic':
            case 'linear':
                return value;
            default:
                return 'agx';
        }
    }

    function getThreeToneMappingForPmndrsMode(mode) {
        const normalized = normalizePmndrsToneMappingMode(mode);
        switch (normalized) {
            case 'reinhard':
                return typeof THREE.ReinhardToneMapping !== 'undefined' ? THREE.ReinhardToneMapping : null;
            case 'cineon':
                return typeof THREE.CineonToneMapping !== 'undefined' ? THREE.CineonToneMapping : null;
            case 'aces-filmic':
                return typeof THREE.ACESFilmicToneMapping !== 'undefined' ? THREE.ACESFilmicToneMapping : null;
            case 'linear':
                return typeof THREE.LinearToneMapping !== 'undefined' ? THREE.LinearToneMapping : null;
            case 'agx':
            default:
                return typeof THREE.AgXToneMapping !== 'undefined'
                    ? THREE.AgXToneMapping
                    : (typeof THREE.ACESFilmicToneMapping !== 'undefined' ? THREE.ACESFilmicToneMapping : null);
        }
    }

    function normalizeReflectionOcclusionMode(value) {
        switch (value) {
            case 'off':
            case 'strong':
                return value;
            default:
                return 'auto';
        }
    }

    function normalizePmndrsAtmospherePreset(value) {
        switch (value) {
            case 'night':
            case 'dawn':
            case 'sunrise':
            case 'early-morning':
            case 'golden-hour':
            case 'sunset':
            case 'custom':
                return value;
            default:
                return 'midday';
        }
    }

    function normalizePmndrsCelestialMode(value) {
        if (value === 'preset-time' || value === 'datetime') {
            return value;
        }
        return 'manual';
    }

    function normalizePmndrsCelestialTimePreset(value) {
        switch (value) {
            case 'night':
            case 'dawn':
            case 'sunrise':
            case 'early-morning':
            case 'midday':
            case 'golden-hour':
            case 'sunset':
                return value;
            default:
                return 'midday';
        }
    }

    function normalizePmndrsDate(value, fallback) {
        const candidate = typeof value === 'string' ? value.trim() : '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
            return candidate;
        }
        return fallback || '2026-06-21';
    }

    function normalizePmndrsUtcTime(value, fallback) {
        const candidate = typeof value === 'string' ? value.trim() : '';
        if (/^\d{2}:\d{2}$/.test(candidate)) {
            const parts = candidate.split(':');
            const hour = parseInt(parts[0], 10);
            const minute = parseInt(parts[1], 10);
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                return candidate;
            }
        }
        return fallback || '12:00';
    }

    function lerpNumber(a, b, t) {
        return a + ((b - a) * t);
    }

    function lerpPmndrsColor(fromHex, toHex, t) {
        function hexToRgb(hex) {
            const normalized = normalizePmndrsColor(hex, '#000000');
            return {
                r: parseInt(normalized.slice(1, 3), 16),
                g: parseInt(normalized.slice(3, 5), 16),
                b: parseInt(normalized.slice(5, 7), 16)
            };
        }
        function toHex(value) {
            const clamped = Math.max(0, Math.min(255, Math.round(value)));
            return clamped.toString(16).padStart(2, '0');
        }
        const from = hexToRgb(fromHex);
        const to = hexToRgb(toHex);
        return `#${ 
            toHex(lerpNumber(from.r, to.r, t)) 
            }${toHex(lerpNumber(from.g, to.g, t)) 
            }${toHex(lerpNumber(from.b, to.b, t))}`;
    }

    function getPmndrsAtmosphereLookDefaults(preset, intensity) {
        const midday = PMNDRS_ATMOSPHERE_LOOK_DEFAULTS.midday;
        const resolvedPreset = normalizePmndrsAtmospherePreset(preset);
        let target = PMNDRS_ATMOSPHERE_LOOK_DEFAULTS[resolvedPreset] || midday;
        let blend = clampPmndrsNumber(intensity, 0, 1, 1);

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

    function getPmndrsHorizonHelperLightDefaults(preset) {
        function normalizeDefaults(defaults) {
            return {
                keyIntensity: defaults.keyIntensity !== undefined ? defaults.keyIntensity : defaults.keyLightIntensity,
                fillIntensity: defaults.fillIntensity !== undefined ? defaults.fillIntensity : defaults.fillLightIntensity
            };
        }

        switch (preset) {
            case 'clear':
                return normalizeDefaults(PMNDRS_HORIZON_HELPER_LIGHT_DEFAULTS.clear);
            case 'crisp':
                return normalizeDefaults(PMNDRS_HORIZON_HELPER_LIGHT_DEFAULTS.crisp);
            default:
                return normalizeDefaults(PMNDRS_HORIZON_HELPER_LIGHT_DEFAULTS.natural);
        }
    }

    function getResolvedPmndrsSkyTimePreset(config) {
        if (!config) {
            return 'midday';
        }
        if (config.resolvedLookPreset && config.resolvedLookPreset !== 'custom') {
            return config.resolvedLookPreset;
        }
        return config.celestialTimePreset || 'midday';
    }

    function isPmndrsPresetTimeNight(config) {
        return Boolean(config &&
            (getResolvedPmndrsSkyTimePreset(config) === 'night' ||
                (config.celestialMode === 'datetime' && typeof config.sunElevationDeg === 'number' && config.sunElevationDeg <= -12)));
    }

    function getPmndrsNightReflectionIntensityScale(self, config, reflectionSource) {
        const source = reflectionSource || (self && typeof self.getEffectiveReflectionSource === 'function'
            ? self.getEffectiveReflectionSource()
            : 'none');
        if (source !== 'hdr' && source !== 'scene-probe') {
            return 0;
        }
        return isPmndrsPresetTimeNight(config) && (source === 'hdr' || source === 'scene-probe')
            ? PMNDRS_NIGHT_REFLECTION_INTENSITY_SCALE
            : 1;
    }

    function getPmndrsHorizonHelperLightConfig(self, preset, atmosphereConfig) {
        const defaults = getPmndrsHorizonHelperLightDefaults(preset);
        let keyColor = '#fff0cf';
        let fillColor = '#cfe3ff';
        let keyIntensity = readPmndrsAtmosphereNumber(self, 'pmndrsHorizonKeyLightIntensity', 0, 3, defaults.keyIntensity);
        let fillIntensity = readPmndrsAtmosphereNumber(self, 'pmndrsHorizonFillLightIntensity', 0, 3, defaults.fillIntensity);
        let useMoonDirection = false;
        let directionOwner = 'sun';
        const sunElevation = atmosphereConfig && typeof atmosphereConfig.sunElevationDeg === 'number'
            ? atmosphereConfig.sunElevationDeg
            : null;
        const skyTimePreset = getResolvedPmndrsSkyTimePreset(atmosphereConfig);

        if (preset === 'clear') {
            keyColor = '#fff4d8';
            fillColor = '#d7e8ff';
        } else if (preset === 'crisp') {
            keyColor = '#fff2d2';
            fillColor = '#d4e4ff';
        }

        if (isPmndrsPresetTimeNight(atmosphereConfig)) {
            const moonEnabled = atmosphereConfig.moonEnabled !== false;
            keyColor = moonEnabled ? '#b8c8ff' : '#39425c';
            fillColor = moonEnabled ? '#3f4f78' : '#111827';
            keyIntensity = Math.min(keyIntensity, moonEnabled ? 0.16 : 0.03);
            fillIntensity = Math.min(fillIntensity, moonEnabled ? 0.035 : 0.015);
            useMoonDirection = moonEnabled;
            directionOwner = moonEnabled ? 'moon' : 'none';
        } else if (atmosphereConfig && (skyTimePreset === 'dawn' || (sunElevation !== null && sunElevation < 0))) {
            keyColor = '#9fb7ff';
            fillColor = '#223354';
            keyIntensity = Math.min(keyIntensity, 0.22);
            fillIntensity = Math.min(fillIntensity, 0.12);
        } else if (atmosphereConfig &&
            (skyTimePreset === 'sunrise' ||
                skyTimePreset === 'golden-hour' ||
                skyTimePreset === 'sunset' ||
                (sunElevation !== null && sunElevation < 18))) {
            keyColor = skyTimePreset === 'sunset' ? '#ff9f64' : (skyTimePreset === 'sunrise' ? '#ffd1a3' : '#ffba7a');
            fillColor = '#5f78ab';
            keyIntensity = Math.max(keyIntensity, skyTimePreset === 'sunset' ? 1.05 : 1.1);
            fillIntensity = Math.min(fillIntensity, 0.12);
        } else if (atmosphereConfig && (skyTimePreset === 'early-morning' || (sunElevation !== null && sunElevation >= 18 && sunElevation < 35))) {
            keyColor = '#fff0cf';
            fillColor = '#c9dcff';
            keyIntensity = Math.max(keyIntensity, 1.55);
            fillIntensity = Math.max(fillIntensity, 0.65);
        } else if (atmosphereConfig &&
            (skyTimePreset === 'midday' ||
                (sunElevation !== null && sunElevation >= 35))) {
            keyColor = preset === 'clear' ? '#fff6e4' : '#fff2d4';
            fillColor = '#d7e8ff';
            keyIntensity = Math.max(keyIntensity, preset === 'clear' ? 2.4 : 2.1);
            fillIntensity = Math.max(fillIntensity, preset === 'clear' ? 1.15 : 0.95);
        } else if (sunElevation !== null && sunElevation >= 18) {
            keyIntensity = Math.max(keyIntensity, 1.7);
            fillIntensity = Math.max(fillIntensity, 0.7);
        }

        return {
            keyColor,
            fillColor,
            keyIntensity,
            fillIntensity,
            useMoonDirection,
            directionOwner
        };
    }

    function getPmndrsAtmosphereResourceProfile(self, renderer) {
        const quality = normalizePmndrsAtmosphereQuality(self && self.data ? self.data.pmndrsAtmosphereQuality : 'balanced');
        const supportsFloatLinear = Boolean(renderer && renderer.extensions && renderer.extensions.get('OES_texture_float_linear'));
        const canUseFloat = Boolean(renderer &&
            renderer.capabilities &&
            renderer.capabilities.isWebGL2 &&
            typeof THREE.FloatType !== 'undefined' &&
            supportsFloatLinear);
        const wantsHighPrecision = quality === 'quality' || quality === 'cinematic' || quality === 'custom' || quality === 'balanced';
        const type = wantsHighPrecision ? THREE.FloatType : THREE.HalfFloatType;
        const higherOrderScattering = quality !== 'performance';
        // Stay aligned with Takram's default precompute path and only scale the
        // precision/performance envelope around it.
        const combinedScattering = true;

        return {
            quality,
            type,
            useFloat: type === THREE.FloatType,
            higherOrderScattering,
            combinedScattering,
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
            return Boolean(fallback);
        }
        const value = self.data[key];
        return value === true || value === 'true' || value === '1' || value === 1;
    }

    function normalizePmndrsColor(value, fallback) {
        const raw = (typeof value === 'string') ? value.trim() : '';
        if (!/^#?[0-9a-fA-F]{6}$/.test(raw)) {
            return fallback;
        }
        return raw.charAt(0) === '#' ? raw : (`#${  raw}`);
    }

    function hasPmndrsDebugFlag(debugKey, queryKey) {
        if (window.VRODOS_DEBUG && window.VRODOS_DEBUG[debugKey] === true) {
            return true;
        }

        if (typeof window.location === 'undefined' || !window.location.search) {
            return false;
        }

        try {
            const params = new URLSearchParams(window.location.search);
            return params.get(queryKey) === '1';
        } catch (err) {
            return false;
        }
    }

    function objectEntityChainHas(object, predicate) {
        let current = object;
        while (current) {
            if (current.el && predicate(current.el)) {
                return true;
            }
            current = current.parent || null;
        }
        return false;
    }

    function entityHasClass(entityEl, className) {
        return Boolean(entityEl && entityEl.classList && entityEl.classList.contains(className));
    }

    function isLightingExcludedEntity(entityEl) {
        if (!entityEl) {
            return false;
        }

        const id = entityEl.id || '';
        const tagName = entityEl.tagName ? entityEl.tagName.toUpperCase() : '';

        return tagName === 'A-SKY' ||
            tagName === 'A-SUN-SKY' ||
            id === 'cameraA' ||
            id === 'default-sky' ||
            id === 'default-sun' ||
            id.indexOf('vid-panel_') === 0 ||
            entityHasClass(entityEl, 'avatar') ||
            entityHasClass(entityEl, 'non-vr') ||
            entityEl.hasAttribute('data-vrodos-overlay-ui') ||
            entityEl.hasAttribute('data-vrodos-photoreal-light');
    }

    function isDecorativeLightingEntity(entityEl) {
        if (!entityEl) {
            return false;
        }

        const id = entityEl.id || '';
        return entityEl.hasAttribute('data-vrodos-world-lighting') ||
            id.indexOf('video-display_') === 0 ||
            id.indexOf('image-display_') === 0 ||
            id.indexOf('button_poi_') === 0 ||
            entityEl.hasAttribute('link-listener') ||
            entityEl.hasAttribute('data-vrodos-video-src') ||
            entityHasClass(entityEl, 'menu-button');
    }

    function getMaterialList(material) {
        if (!material) {
            return [];
        }
        return Array.isArray(material) ? material : [material];
    }

    function isShadowEligibleMaterial(material) {
        const materials = getMaterialList(material);
        if (!materials.length) {
            return true;
        }

        return materials.some((entry) => {
            if (!entry) {
                return false;
            }
            const opacity = typeof entry.opacity === 'number' ? entry.opacity : 1;
            const alphaTest = typeof entry.alphaTest === 'number' ? entry.alphaTest : 0;
            if (entry.visible === false) {
                return false;
            }
            return !entry.transparent || opacity >= 0.98 || alphaTest >= 0.1;
        });
    }

    function isHiddenNavmeshMaterial(material) {
        const materials = getMaterialList(material);
        if (!materials.length) {
            return false;
        }

        return materials.every((entry) => Boolean(entry &&
            entry.userData &&
            entry.userData.vrodosHiddenNavmeshMaterial === true));
    }

    function isWorldLightingParticipantMesh(node) {
        if (!node || !node.isMesh) {
            return false;
        }

        if (isHiddenNavmeshMaterial(node.material)) {
            return false;
        }

        if (objectEntityChainHas(node, isLightingExcludedEntity)) {
            return false;
        }

        return objectEntityChainHas(node, isDecorativeLightingEntity) || isShadowEligibleMaterial(node.material);
    }

    function isReceiverOnlyLightingMesh(node) {
        if (!node || !node.isMesh) {
            return false;
        }

        return objectEntityChainHas(node, (entityEl) => (
            entityHasClass(entityEl, 'vrodos-navmesh') || entityEl.hasAttribute('data-vrodos-navmesh')
        ));
    }

    function collectAdaptiveShadowBounds(self) {
        const sceneObj = self && self.el ? self.el.object3D : null;
        if (!sceneObj) {
            return null;
        }

        const camera = self.el.camera || null;
        const cameraPosition = new THREE.Vector3();
        const canUseCamera = Boolean(camera && typeof camera.getWorldPosition === 'function');
        const maxFitDistance = self.data && self.data.shadowQuality === 'high' ? 180 : 120;
        const maxFitDistanceSq = maxFitDistance * maxFitDistance;
        const focusedBounds = new THREE.Box3();
        const fallbackBounds = new THREE.Box3();
        const nodeBounds = new THREE.Box3();
        const nodeCenter = new THREE.Vector3();
        let hasFocusedBounds = false;
        let hasFallbackBounds = false;

        if (canUseCamera) {
            camera.getWorldPosition(cameraPosition);
        }

        sceneObj.updateMatrixWorld(true);
        sceneObj.traverse((node) => {
            if (!isWorldLightingParticipantMesh(node) || !node.geometry) {
                return;
            }

            nodeBounds.setFromObject(node);
            if (nodeBounds.isEmpty()) {
                return;
            }

            fallbackBounds.union(nodeBounds);
            hasFallbackBounds = true;

            if (!canUseCamera) {
                focusedBounds.union(nodeBounds);
                hasFocusedBounds = true;
                return;
            }

            nodeBounds.getCenter(nodeCenter);
            if (nodeBounds.containsPoint(cameraPosition) || nodeCenter.distanceToSquared(cameraPosition) <= maxFitDistanceSq) {
                focusedBounds.union(nodeBounds);
                hasFocusedBounds = true;
            }
        });

        if (hasFocusedBounds) {
            return focusedBounds;
        }

        return hasFallbackBounds ? fallbackBounds : null;
    }

    function collectDirectionalShadowLights(self) {
        const lights = [];
        const sceneObj = self && self.el ? self.el.object3D : null;
        if (!sceneObj) {
            return lights;
        }

        sceneObj.traverse((node) => {
            if (node && node.isDirectionalLight && node.shadow) {
                lights.push(node);
            }
        });

        return lights;
    }

    function fitDirectionalShadowCameraToBounds(light, bounds, shadowQuality) {
        if (!light || !light.shadow || !light.shadow.camera || !bounds || bounds.isEmpty()) {
            return;
        }

        const shadowCamera = light.shadow.camera;
        const boundsCenter = new THREE.Vector3();
        const corners = [
            new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z),
            new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.max.z),
            new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.min.z),
            new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.max.z),
            new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.min.z),
            new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.max.z),
            new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.min.z),
            new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z)
        ];
        const boxSize = new THREE.Vector3();
        const lightSpacePoint = new THREE.Vector3();
        const lightOffset = new THREE.Vector3();
        const targetPosition = new THREE.Vector3();
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        bounds.getSize(boxSize);
        const boundsRadius = Math.max(boxSize.x, boxSize.y, boxSize.z) * 0.5;
        const margin = Math.max(shadowQuality === 'high' ? 4 : 6, boundsRadius * 0.08);
        const minExtent = shadowQuality === 'high' ? 18 : 24;

        light.updateMatrixWorld(true);
        bounds.getCenter(boundsCenter);
        if (light.target) {
            light.target.updateMatrixWorld(true);
            targetPosition.setFromMatrixPosition(light.target.matrixWorld);
            lightOffset.setFromMatrixPosition(light.matrixWorld).sub(targetPosition);
            if (lightOffset.lengthSq() > 0.0001) {
                lightOffset.normalize().multiplyScalar(Math.max(boundsRadius * 2.5, 64));
                light.position.copy(boundsCenter).add(lightOffset);
                light.target.position.copy(boundsCenter);
                light.target.updateMatrixWorld(true);
                light.updateMatrixWorld(true);
            }
        }
        if (light.shadow && typeof light.shadow.updateMatrices === 'function') {
            light.shadow.updateMatrices(light);
        }
        shadowCamera.updateMatrixWorld(true);

        corners.forEach((corner) => {
            lightSpacePoint.copy(corner).applyMatrix4(shadowCamera.matrixWorldInverse);
            minX = Math.min(minX, lightSpacePoint.x);
            maxX = Math.max(maxX, lightSpacePoint.x);
            minY = Math.min(minY, lightSpacePoint.y);
            maxY = Math.max(maxY, lightSpacePoint.y);
            minZ = Math.min(minZ, lightSpacePoint.z);
            maxZ = Math.max(maxZ, lightSpacePoint.z);
        });

        if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY) || !isFinite(minZ) || !isFinite(maxZ)) {
            return;
        }

        if ((maxX - minX) < minExtent) {
            const pad = (minExtent - (maxX - minX)) * 0.5;
            minX -= pad;
            maxX += pad;
        }
        if ((maxY - minY) < minExtent) {
            const pad = (minExtent - (maxY - minY)) * 0.5;
            minY -= pad;
            maxY += pad;
        }

        shadowCamera.left = minX - margin;
        shadowCamera.right = maxX + margin;
        shadowCamera.bottom = minY - margin;
        shadowCamera.top = maxY + margin;
        shadowCamera.near = Math.max(0.1, -maxZ - margin);
        shadowCamera.far = Math.max(shadowCamera.near + 1, -minZ + margin);

        if (typeof shadowCamera.updateProjectionMatrix === 'function') {
            shadowCamera.updateProjectionMatrix();
        }
        if (light.shadow && typeof light.shadow.updateMatrices === 'function') {
            light.shadow.updateMatrices(light);
        }

        light.userData = light.userData || {};
        light.userData.vrodosAdaptiveShadowFitted = true;
        light.shadow.needsUpdate = true;
    }

    function applyAdaptiveShadowFit(self) {
        const shadowQuality = self && self.data ? (self.data.shadowQuality || 'medium') : 'medium';
        if (shadowQuality === 'off') {
            return;
        }

        const bounds = collectAdaptiveShadowBounds(self);
        if (!bounds) {
            return;
        }

        collectDirectionalShadowLights(self).forEach((light) => {
            fitDirectionalShadowCameraToBounds(light, bounds, shadowQuality);
        });
        self._vrodosShadowFitLastMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    function scheduleAdaptiveShadowFit(self) {
        if (!self || !self.el || self.data.shadowQuality === 'off') {
            return;
        }

        applyAdaptiveShadowFit(self);

        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
                applyAdaptiveShadowFit(self);
            });
        }

        setTimeout(() => {
            applyAdaptiveShadowFit(self);
        }, 80);
    }

    function getShadowDiagnosticState(self) {
        const sceneObj = self && self.el ? self.el.object3D : null;
        const state = {
            casters: 0,
            receivers: 0,
            receiverOnly: 0,
            dirLights: 0,
            dirShadowLights: 0,
            fittedDirLights: 0,
            fitted: 'pending'
        };

        if (!sceneObj) {
            return state;
        }

        sceneObj.traverse((node) => {
            if (node && node.isMesh) {
                if (node.castShadow) {
                    state.casters += 1;
                }
                if (node.receiveShadow) {
                    state.receivers += 1;
                }
                if (node.receiveShadow && !node.castShadow) {
                    state.receiverOnly += 1;
                }
            } else if (node && node.isDirectionalLight) {
                state.dirLights += 1;
                if (node.castShadow && node.shadow) {
                    state.dirShadowLights += 1;
                }
                if (node.userData && node.userData.vrodosAdaptiveShadowFitted) {
                    state.fittedDirLights += 1;
                }
            }
        });

        state.fitted = self && self._vrodosShadowFitLastMs ? 'yes' : 'pending';
        return state;
    }

    function buildPmndrsLocalSunDirection(elevationDeg, azimuthDeg) {
        const elevation = THREE.MathUtils.degToRad(elevationDeg);
        const azimuth = THREE.MathUtils.degToRad(azimuthDeg);
        const cosElevation = Math.cos(elevation);
        return new THREE.Vector3(
            Math.sin(azimuth) * cosElevation,
            Math.sin(elevation),
            -Math.cos(azimuth) * cosElevation
        ).normalize();
    }

    function getPmndrsDateObject(dateText, utcTimeText) {
        const date = normalizePmndrsDate(dateText);
        const time = normalizePmndrsUtcTime(utcTimeText);
        const parsed = new Date(`${date  }T${  time  }:00Z`);
        if (isNaN(parsed.getTime())) {
            return new Date('2026-06-21T12:00:00Z');
        }
        return parsed;
    }

    function buildPmndrsGeospatialFrame(latitudeDeg, longitudeDeg, altitudeMeters) {
        const lat = THREE.MathUtils.degToRad(clampPmndrsNumber(latitudeDeg, -90, 90, 0));
        const lon = THREE.MathUtils.degToRad(clampPmndrsNumber(longitudeDeg, -180, 180, 0));
        const height = clampPmndrsNumber(altitudeMeters, -500, 20000, 0);
        const sinLat = Math.sin(lat);
        const cosLat = Math.cos(lat);
        const sinLon = Math.sin(lon);
        const cosLon = Math.cos(lon);
        const a = WGS84_EQUATORIAL_RADIUS;
        const b = WGS84_POLAR_RADIUS;
        const e2 = 1 - ((b * b) / (a * a));
        const n = a / Math.sqrt(1 - (e2 * sinLat * sinLat));
        const position = new THREE.Vector3(
            (n + height) * cosLat * cosLon,
            (n + height) * cosLat * sinLon,
            ((n * (1 - e2)) + height) * sinLat
        );
        const up = new THREE.Vector3(cosLat * cosLon, cosLat * sinLon, sinLat).normalize();
        const east = new THREE.Vector3(-sinLon, cosLon, 0);
        if (east.lengthSq() < 0.000001) {
            east.set(0, 1, 0);
        }
        east.normalize();
        const north = new THREE.Vector3().crossVectors(up, east).normalize();
        const south = north.clone().multiplyScalar(-1);
        const matrix = new THREE.Matrix4().makeBasis(east, up, south).setPosition(position);

        return {
            latitudeDeg: THREE.MathUtils.radToDeg(lat),
            longitudeDeg: THREE.MathUtils.radToDeg(lon),
            altitudeMeters: height,
            position,
            east,
            up,
            north,
            south,
            matrix
        };
    }

    function getPmndrsGeospatialFrame(config) {
        if (!config || !config.geospatialEnabled) {
            return null;
        }
        if (!config._geospatialFrame) {
            config._geospatialFrame = buildPmndrsGeospatialFrame(
                config.geospatialLatitudeDeg,
                config.geospatialLongitudeDeg,
                config.geospatialAltitudeMeters
            );
        }
        return config._geospatialFrame;
    }

    function ecefDirectionToPmndrsLocal(direction, frame) {
        if (!direction || !frame) {
            return direction ? direction.clone().normalize() : new THREE.Vector3(0, 1, 0);
        }
        return new THREE.Vector3(
            direction.dot(frame.east),
            direction.dot(frame.up),
            direction.dot(frame.south)
        ).normalize();
    }

    function localDirectionToPmndrsEcef(localDirection, frame) {
        if (!localDirection || !frame) {
            return new THREE.Vector3(0, 1, 0);
        }
        return new THREE.Vector3()
            .addScaledVector(frame.east, localDirection.x)
            .addScaledVector(frame.up, localDirection.y)
            .addScaledVector(frame.south, localDirection.z)
            .normalize();
    }

    function applyLocalDirectionAngles(config) {
        const local = config && config.localSunDirection ? config.localSunDirection : null;
        if (!local) {
            return;
        }
        config.sunElevationDeg = THREE.MathUtils.radToDeg(Math.asin(Math.max(-1, Math.min(1, local.y))));
        config.sunAzimuthDeg = THREE.MathUtils.radToDeg(Math.atan2(local.x, -local.z));
    }

    function buildPmndrsEcefSunDirection(localSunDirection, config) {
        if (!localSunDirection) {
            return new THREE.Vector3(0, 1, 0);
        }

        const frame = getPmndrsGeospatialFrame(config);
        if (frame) {
            return localDirectionToPmndrsEcef(localSunDirection, frame);
        }

        // VRodos authored worlds use X=east, Y=up, Z=south so that -Z is the
        // natural forward/north-ish direction. Takram expects sunDirection in
        // ECEF space, so we mirror X/Z into the default fixed frame anchored below.
        return new THREE.Vector3(
            -localSunDirection.x,
            localSunDirection.y,
            -localSunDirection.z
        ).normalize();
    }

    function buildPmndrsMoonDirection(sunDirection) {
        return sunDirection.clone().multiplyScalar(-1).normalize();
    }

    function ensurePmndrsWorldToEcefMatrix(target, config) {
        if (!target) {
            return null;
        }

        const matrix = target.worldToECEFMatrix;
        if (!matrix || typeof matrix.makeTranslation !== 'function') {
            return null;
        }

        const frame = getPmndrsGeospatialFrame(config);
        if (frame) {
            matrix.copy(frame.matrix);
            return matrix;
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
        ).setPosition(0, WGS84_EQUATORIAL_RADIUS, 0);
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
            const uniforms = target.uniforms.ATMOSPHERE.value;
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

    function getPmndrsEffectiveGroundAlbedo(config) {
        return config && config.groundEnabled ? config.groundAlbedo : '#000000';
    }

    function createPmndrsAtmosphereParameters(vta, config) {
        const params = new vta.AtmosphereParameters();
        params.sunAngularRadius = config.sunAngularRadius;
        params.rayleighScattering.multiplyScalar(config.rayleighScale);
        params.mieScattering.multiplyScalar(config.mieScatteringScale);
        params.mieExtinction.multiplyScalar(config.mieExtinctionScale);
        params.miePhaseFunctionG = config.miePhaseG;
        params.absorptionExtinction.multiplyScalar(config.absorptionScale);
        params.groundAlbedo.set(getPmndrsEffectiveGroundAlbedo(config));
        return params;
    }

    function removePmndrsAtmosphereSky(self) {
        if (!self || !self._pmndrsAtmosphereState) {
            return;
        }
        const state = self._pmndrsAtmosphereState;
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

        self._pmndrsAtmosphereState.skyMesh.visible = Boolean(visible);
        return true;
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

        const diagnosticsEnabled = hasPmndrsDebugFlag('pmndrsHorizonDiagnostics', 'vrodos_debug_pmndrs_horizon') ||
            hasPmndrsDebugFlag('pmndrsHorizonDiagnosticsVerbose', 'vrodos_debug_pmndrs_horizon_verbose');
        const verboseDiagnosticsEnabled = hasPmndrsDebugFlag('pmndrsHorizonDiagnosticsVerbose', 'vrodos_debug_pmndrs_horizon_verbose');
        const startupStateLogEnabled = !diagnosticsEnabled && !self._pmndrsHorizonStartupStateLogged;
        if (!diagnosticsEnabled && !startupStateLogEnabled) {
            return;
        }

        const horizonPreset = typeof self.getHorizonSkyPreset === 'function' ? self.getHorizonSkyPreset() : 'natural';
        const helperConfig = shouldUsePmndrsTakramHorizonPath(self)
            ? getPmndrsHorizonHelperLightConfig(self, horizonPreset, atmosphereConfig)
            : null;
        const takramLightSources = self._pmndrsTakramLightSources || null;
        const keyIntensity = takramLightSources && takramLightSources.sunLight
            ? takramLightSources.sunLight.intensity
            : (helperConfig ? helperConfig.keyIntensity : null);
        const fillIntensity = takramLightSources && takramLightSources.skyLight
            ? takramLightSources.skyLight.intensity
            : (helperConfig ? helperConfig.fillIntensity : null);
        const takramSunAngularRadius = atmosphereConfig && atmosphereConfig.enabled && atmosphereConfig.takramSunEnabled !== false && shouldUsePmndrsTakramHorizonPath(self) && typeof atmosphereConfig.sunAngularRadius === 'number'
            ? atmosphereConfig.sunAngularRadius
            : null;
        const reflectionSource = (typeof self.getEffectiveReflectionSource === 'function')
            ? self.getEffectiveReflectionSource()
            : (self.data.reflectionSource || 'hdr');
        const reflectionScale = getPmndrsNightReflectionIntensityScale(self, atmosphereConfig, reflectionSource);
        const aframeDefaultLights = areAFrameDefaultLightsEnabled(self) ? 'on' : 'off';
        const atmosphereState = self._pmndrsAtmosphereState || null;
        const takramLutState = atmosphereState && atmosphereState.ready
            ? 'ready'
            : (atmosphereState && atmosphereState.failed ? 'failed' : 'pending');
        const pmndrsExposure = getPmndrsExposureValue(self);
        const toneMappingMode = normalizePmndrsToneMappingMode(self.data.pmndrsToneMappingMode);
        const lensFlareRequested = self.data.pmndrsLensFlareEnabled === true || self.data.pmndrsLensFlareEnabled === 'true' || self.data.pmndrsLensFlareEnabled === '1';
        const lensFlare = lensFlareRequested
            ? (atmosphereConfig && atmosphereConfig.enabled && atmosphereConfig.takramSunEnabled !== false && shouldUsePmndrsTakramHorizonPath(self) ? 'on' : 'sun-off')
            : 'off';
        const correctAltitude = atmosphereConfig && atmosphereConfig.correctAltitudeEnabled !== false ? 'on' : 'off';
        const lightSourceMode = atmosphereConfig && atmosphereConfig.useTakramLightSources === true ? 'takram' : 'helper';
        const reflectionOcclusionMode = normalizeReflectionOcclusionMode(self.data.reflectionOcclusionMode);
        const shadowState = getShadowDiagnosticState(self);
        const resolvedSkyTimePreset = getResolvedPmndrsSkyTimePreset(atmosphereConfig);
        const owner = atmosphereConfig && atmosphereConfig.enabled && shouldUsePmndrsHorizonAerialPerspectivePath(self)
            ? 'takram-sky+aerial'
            : (atmosphereConfig && atmosphereConfig.enabled && shouldUsePmndrsTakramHorizonPath(self)
                ? 'takram-sky'
                : (atmosphereConfig && atmosphereConfig.enabled ? 'takram-fallback' : 'legacy-fallback'));
        const signature = [
            context,
            owner,
            reflectionSource,
            atmosphereConfig && atmosphereConfig.celestialMode ? atmosphereConfig.celestialMode : 'manual',
            resolvedSkyTimePreset,
            atmosphereConfig && atmosphereConfig.groundEnabled ? 'ground-on' : 'ground-off',
            atmosphereConfig && atmosphereConfig.takramSunEnabled === false ? 'sun-off' : 'sun-on',
            formatPmndrsSunDirectionForLog(atmosphereConfig && atmosphereConfig.sunDirection ? atmosphereConfig.sunDirection : null),
            keyIntensity !== null ? keyIntensity.toFixed(2) : 'n/a',
            fillIntensity !== null ? fillIntensity.toFixed(2) : 'n/a',
            helperConfig ? helperConfig.directionOwner : 'n/a',
            reflectionScale.toFixed(2),
            takramSunAngularRadius !== null ? takramSunAngularRadius.toFixed(4) : 'n/a',
            aframeDefaultLights,
            takramLutState,
            pmndrsExposure.toFixed(2),
            toneMappingMode,
            lensFlare,
            correctAltitude,
            lightSourceMode,
            reflectionOcclusionMode,
            self.data.shadowQuality || 'medium',
            shadowState.casters,
            shadowState.receivers,
            shadowState.receiverOnly,
            shadowState.dirShadowLights,
            shadowState.fittedDirLights,
            shadowState.fitted
        ].join('|');

        if (startupStateLogEnabled) {
            self._pmndrsHorizonStartupStateLogged = true;
            const log = console.info || console.log || function () {};
            log.call(console, `[VRodos] Compiled scene state: engine=pmndrs, owner=${  owner
                }, reflection=${  reflectionSource
                }, reflectionOcclusion=${  reflectionOcclusionMode
                }, shadowQuality=${  self.data.shadowQuality || 'medium'
                }, celestial=${  atmosphereConfig && atmosphereConfig.celestialMode ? atmosphereConfig.celestialMode : 'manual'
                }/${  resolvedSkyTimePreset
                }, sunDir=${  formatPmndrsSunDirectionForLog(atmosphereConfig && atmosphereConfig.sunDirection ? atmosphereConfig.sunDirection : null)
                }, exposure=${  pmndrsExposure.toFixed(2)
                }, toneMapping=${  toneMappingMode
                }, lensFlare=${  lensFlare
                }, lightSource=${  lightSourceMode}`);
            return;
        }

        self._pmndrsHorizonDiagSignatures = self._pmndrsHorizonDiagSignatures || {};
        if (self._pmndrsHorizonDiagSignatures[context] === signature) {
            return;
        }

        self._pmndrsHorizonDiagSignatures[context] = signature;
        const logMethod = verboseDiagnosticsEnabled ? 'info' : 'debug';
        const log = console[logMethod] || console.info || function () {};
        log.call(console, `[VRodos] PMNDRS horizon diagnostic (${  context  }): owner=${  owner
            }, reflection=${  reflectionSource 
            }, celestial=${  atmosphereConfig && atmosphereConfig.celestialMode ? atmosphereConfig.celestialMode : 'manual'
            }/${  resolvedSkyTimePreset
            }, ground=${  atmosphereConfig && atmosphereConfig.groundEnabled ? 'on' : 'off' 
            }, sun=${  atmosphereConfig && atmosphereConfig.takramSunEnabled === false ? 'off' : 'on' 
            }, sunDir=${  formatPmndrsSunDirectionForLog(atmosphereConfig && atmosphereConfig.sunDirection ? atmosphereConfig.sunDirection : null) 
            }, helperKey=${  keyIntensity !== null ? keyIntensity.toFixed(2) : 'n/a'
            }, helperFill=${  fillIntensity !== null ? fillIntensity.toFixed(2) : 'n/a'
            }, helperDir=${  helperConfig ? helperConfig.directionOwner : 'n/a'
            }, reflectionScale=${  reflectionScale.toFixed(2)
            }, sunRadius=${  takramSunAngularRadius !== null ? takramSunAngularRadius.toFixed(4) : 'n/a'
            }, aframeDefaultLights=${  aframeDefaultLights
            }, takramLut=${  takramLutState
            }, exposure=${  pmndrsExposure.toFixed(2)
            }, toneMapping=${  toneMappingMode
            }, lensFlare=${  lensFlare
            }, correctAltitude=${  correctAltitude
            }, lightSource=${  lightSourceMode
            }, reflectionOcclusion=${  reflectionOcclusionMode
            }, shadowQuality=${  self.data.shadowQuality || 'medium'
            }, shadowCasters=${  shadowState.casters
            }, shadowReceivers=${  shadowState.receivers
            }, shadowReceiverOnly=${  shadowState.receiverOnly
            }, dirShadowLights=${  shadowState.dirShadowLights
            }, fittedDirLights=${  shadowState.fittedDirLights
            }, shadowFit=${  shadowState.fitted}`);
    }

    function hidePmndrsHorizonEnvironmentVisuals(self) {
        if (!self || !self.el || !self.el.object3D) {
            return;
        }
        self.el.object3D.traverse((node) => {
            if (!node || (node.userData && node.userData.vrodosPmndrsAtmosphereSky)) {
                return;
            }

            if (isPmndrsLegacyEnvironmentVisualNode(node)) {
                node.visible = false;
                node.userData = node.userData || {};
                node.userData.vrodosPmndrsLegacySuppressed = true;
            }
        });

        Array.prototype.forEach.call(document.querySelectorAll('#default-sky, #default-sun, #vrodos-pmndrs-sun, #vrodos-pmndrs-sun-haze, a-sun-sky, a-sky[data-vrodos-preset-sky=\"true\"], .environmentSun, .environment-sun, .environmentSky, .environment-sky, [class*=\"environmentSun\"], [class*=\"environmentSky\"]'), (node) => {
            if (node && typeof node.setAttribute === 'function') {
                node.setAttribute('visible', 'false');
            }
        });
    }

    function removeLegacySunSkyEntitiesForPmndrs(self) {
        if (!self || !self.el) {
            return;
        }

        Array.prototype.forEach.call(self.el.querySelectorAll('a-sun-sky, a-sky[data-vrodos-preset-sky="true"], #default-sky, #default-sun, #vrodos-pmndrs-sun, #vrodos-pmndrs-sun-haze, [material*="sunPosition"], [material*="sunposition"]'), (sunSkyEl) => {
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

                if (isPmndrsLegacyEnvironmentVisualNode(node)) {
                    node.visible = false;
                    node.userData = node.userData || {};
                    node.userData.vrodosPmndrsLegacySuppressed = true;
                }
            });
        }
    }

    function shouldUsePmndrsTakramHorizonPath(self) {
        return Boolean(self &&
            self.data &&
            self.data.selChoice === "0" &&
            self.data.postFXEngine === 'pmndrs' &&
            self.data.pmndrsAtmosphereEnabled !== '0' &&
            window.VRODOS_TAKRAM_ATMOSPHERE);
    }

    function shouldUsePmndrsHorizonAerialPerspectivePath(self) {
        return shouldUsePmndrsTakramHorizonPath(self) &&
            (readPmndrsAtmosphereBool(self, 'pmndrsAerialPerspectiveEnabled', false) ||
                hasPmndrsDebugFlag('enablePmndrsHorizonAerial', 'vrodos_debug_enable_pmndrs_horizon_aerial'));
    }

    function shouldUsePmndrsTakramPhysicalHorizonLights() {
        return hasPmndrsDebugFlag('useTakramPhysicalHorizonLights', 'vrodos_debug_takram_physical_lights');
    }

    function formatVectorPosition(vector, distance, minY) {
        let y = vector.y * distance;
        if (typeof minY === 'number') {
            y = Math.max(minY, y);
        }
        return [
            (vector.x * distance).toFixed(2),
            y.toFixed(2),
            (vector.z * distance).toFixed(2)
        ].join(' ');
    }

    function areAFrameDefaultLightsEnabled(self) {
        const sceneEl = self && self.el;
        const defaultLightEls = sceneEl && typeof sceneEl.querySelectorAll === 'function'
            ? Array.prototype.slice.call(sceneEl.querySelectorAll('[data-aframe-default-light]'))
            : [];

        if (sceneEl && sceneEl._vrodosAFrameDefaultLightsEnabled === false) {
            return defaultLightEls.length > 0;
        }

        const lightData = sceneEl && typeof sceneEl.getAttribute === 'function'
            ? sceneEl.getAttribute('light')
            : null;

        if (lightData && typeof lightData === 'object' && typeof lightData.defaultLightsEnabled !== 'undefined') {
            return lightData.defaultLightsEnabled !== false;
        }

        if (sceneEl &&
            sceneEl.systems &&
            sceneEl.systems.light &&
            sceneEl.systems.light.data &&
            typeof sceneEl.systems.light.data.defaultLightsEnabled !== 'undefined') {
            return sceneEl.systems.light.data.defaultLightsEnabled !== false;
        }

        return true;
    }

    function setAFrameDefaultLightsEnabled(self, enabled) {
        const sceneEl = self && self.el;
        if (!sceneEl || typeof sceneEl.setAttribute !== 'function') {
            return;
        }

        const desired = Boolean(enabled);
        if (sceneEl._vrodosAFrameDefaultLightsEnabled === desired && areAFrameDefaultLightsEnabled(self) === desired) {
            return;
        }

        sceneEl._vrodosAFrameDefaultLightsEnabled = desired;
        sceneEl.setAttribute('light', `defaultLightsEnabled: ${  desired ? 'true' : 'false'}`);

        if (!desired && typeof sceneEl.querySelectorAll === 'function') {
            Array.prototype.forEach.call(sceneEl.querySelectorAll('[data-aframe-default-light]'), (lightEl) => {
                if (lightEl && typeof lightEl.removeObject3D === 'function') {
                    try {
                        lightEl.removeObject3D('light');
                    } catch (err) {
                        /* ignore A-Frame cleanup races */
                    }
                }
                if (lightEl && lightEl.parentNode) {
                    lightEl.parentNode.removeChild(lightEl);
                }
            });
        }
    }

    function removePhotorealHelperLightElements(self) {
        if (!self || typeof self.getCachedSceneQuery !== 'function') {
            return;
        }

        let removed = false;
        Array.prototype.forEach.call(self.getCachedSceneQuery('photorealLights', '[data-vrodos-photoreal-light="true"]'), (lightEl) => {
            if (lightEl.parentNode) {
                lightEl.parentNode.removeChild(lightEl);
                removed = true;
            }
        });
        if (removed) {
            self.markSceneCollectionsDirty();
        }
    }

    function removePmndrsTakramLightSources(self) {
        const state = self && self._pmndrsTakramLightSources;
        if (!state) {
            return;
        }

        ['sunLight', 'skyLight', 'target'].forEach((key) => {
            const object = state[key];
            if (object && object.parent) {
                object.parent.remove(object);
            }
        });

        self._pmndrsTakramLightSources = null;
    }

    function ensurePmndrsFallbackHorizonLights(self, config, preset) {
        const shadowEnabled = self.data.shadowQuality !== 'off';
        const shadowMap = self.data.shadowQuality === 'high' ? 2048 : 1024;
        const castShadow = shadowEnabled ? 'true' : 'false';
        const helperConfig = getPmndrsHorizonHelperLightConfig(self, preset, config);
        const keyDirection = helperConfig.useMoonDirection
            ? (config.localMoonDirection || config.moonDirection || config.localSunDirection || config.sunDirection)
            : (config.localSunDirection || config.sunDirection);

        self.ensurePhotorealHelperLight(
            'vrodos-pmndrs-horizon-key-light',
            `type: directional; color: ${  helperConfig.keyColor  }; intensity: ${  helperConfig.keyIntensity.toFixed(2)  }; castShadow: ${  castShadow  }; shadowMapWidth: ${  shadowMap  }; shadowMapHeight: ${  shadowMap  }; shadowCameraTop: 28; shadowCameraRight: 28; shadowCameraLeft: -28; shadowCameraBottom: -28; shadowBias: -0.00012;`,
            formatVectorPosition(keyDirection, 28, helperConfig.useMoonDirection ? 4 : 8)
        );

        self.ensurePhotorealHelperLight(
            'vrodos-pmndrs-horizon-fill-light',
            `type: ambient; color: ${  helperConfig.fillColor  }; intensity: ${  helperConfig.fillIntensity.toFixed(2)  };`,
            '0 6 0'
        );

        scheduleAdaptiveShadowFit(self);
    }

    function schedulePmndrsTakramLightSourceRefresh(self, atmosphereState, config, preset) {
        if (!self || !atmosphereState || !atmosphereState.promise) {
            return;
        }

        if (self._pmndrsTakramLightSourcesPendingPromise === atmosphereState.promise) {
            return;
        }

        self._pmndrsTakramLightSourcesPendingPromise = atmosphereState.promise;
        atmosphereState.promise.then(() => {
            if (!self || self._pmndrsAtmosphereState !== atmosphereState || atmosphereState.failed) {
                return;
            }

            const latestConfig = self.getPmndrsAtmosphereConfig ? self.getPmndrsAtmosphereConfig() : config;
            if (!latestConfig || latestConfig.enabled === false || !shouldUsePmndrsTakramHorizonPath(self)) {
                return;
            }

            const latestPreset = self.getHorizonSkyPreset ? self.getHorizonSkyPreset() : preset;
            ensurePmndrsTakramHorizonLights(self, latestConfig, latestPreset);
            ensurePmndrsAtmosphereSky(self, latestConfig);
            logPmndrsHorizonDiagnostic(self, 'apply-horizon', latestConfig);
        }).catch((err) => {
            self._pmndrsTakramLightSourcesPendingError = err;
        });
    }

    function ensurePmndrsTakramHorizonLights(self, config, preset) {
        if (!self || !config) {
            return;
        }

        const vta = window.VRODOS_TAKRAM_ATMOSPHERE;
        const scene = self.el && self.el.object3D;
        const helperConfig = getPmndrsHorizonHelperLightConfig(self, preset, config);

        setAFrameDefaultLightsEnabled(self, false);

        if (!vta || !scene || !vta.SunDirectionalLight || !vta.SkyLightProbe) {
            removePmndrsTakramLightSources(self);
            ensurePmndrsFallbackHorizonLights(self, config, preset);
            return;
        }

        if (config.useTakramLightSources !== true) {
            removePmndrsTakramLightSources(self);
            ensurePmndrsFallbackHorizonLights(self, config, preset);
            return;
        }

        const atmosphereState = self.ensurePmndrsAtmosphereResources ? self.ensurePmndrsAtmosphereResources() : null;
        const textures = atmosphereState && !atmosphereState.failed && atmosphereState.ready ? atmosphereState.textures : null;
        const hasTakramSunRadiance = Boolean(textures && textures.transmittanceTexture);
        const hasTakramSkyIrradiance = Boolean(textures && textures.irradianceTexture);

        if (!hasTakramSunRadiance || !hasTakramSkyIrradiance) {
            removePmndrsTakramLightSources(self);
            ensurePmndrsFallbackHorizonLights(self, config, preset);
            if (atmosphereState && !atmosphereState.failed) {
                schedulePmndrsTakramLightSourceRefresh(self, atmosphereState, config, preset);
            }
            return;
        }

        removePhotorealHelperLightElements(self);

        let state = self._pmndrsTakramLightSources;
        if (!state) {
            const sunLight = new vta.SunDirectionalLight({
                distance: 28,
                correctAltitude: config.correctAltitudeEnabled !== false
            });
            sunLight.name = 'vrodosPmndrsTakramSunLight';
            sunLight.userData.vrodosPmndrsTakramLightSource = true;

            const skyLight = new vta.SkyLightProbe({
                correctAltitude: config.correctAltitudeEnabled !== false
            });
            skyLight.name = 'vrodosPmndrsTakramSkyLight';
            skyLight.userData.vrodosPmndrsTakramLightSource = true;

            const target = sunLight.target;
            target.name = 'vrodosPmndrsTakramSunTarget';
            target.userData.vrodosPmndrsTakramLightSource = true;

            scene.add(sunLight);
            scene.add(target);
            scene.add(skyLight);
            state = { sunLight, skyLight, target };
            self._pmndrsTakramLightSources = state;
        } else {
            if (state.sunLight && state.sunLight.parent !== scene) {
                scene.add(state.sunLight);
            }
            if (state.target && state.target.parent !== scene) {
                scene.add(state.target);
            }
            if (state.skyLight && state.skyLight.parent !== scene) {
                scene.add(state.skyLight);
            }
        }

        const shadowEnabled = self.data.shadowQuality !== 'off';
        const shadowMap = self.data.shadowQuality === 'high' ? 2048 : 1024;
        const sunLight = state.sunLight;
        const skyLight = state.skyLight;

        if (state.target) {
            state.target.position.set(0, 0, 0);
            state.target.updateMatrixWorld(true);
        }

        if (sunLight) {
            sunLight.visible = helperConfig.keyIntensity > 0;
            sunLight.intensity = hasTakramSunRadiance ? 1 : helperConfig.keyIntensity;
            sunLight.color.set(helperConfig.keyColor);
            sunLight.distance = 28;
            if (typeof sunLight.correctAltitude !== 'undefined') {
                sunLight.correctAltitude = config.correctAltitudeEnabled !== false;
            }
            sunLight.castShadow = shadowEnabled;
            sunLight.transmittanceTexture = textures ? (textures.transmittanceTexture || null) : null;
            if (config.sunDirection && sunLight.sunDirection) {
                sunLight.sunDirection.copy(config.sunDirection);
            }
            ensurePmndrsWorldToEcefMatrix(sunLight, config);
            if (sunLight.shadow) {
                sunLight.shadow.mapSize.set(shadowMap, shadowMap);
                sunLight.shadow.bias = -0.00012;
                if (sunLight.shadow.camera) {
                    sunLight.shadow.camera.top = 28;
                    sunLight.shadow.camera.right = 28;
                    sunLight.shadow.camera.left = -28;
                    sunLight.shadow.camera.bottom = -28;
                    if (typeof sunLight.shadow.camera.updateProjectionMatrix === 'function') {
                        sunLight.shadow.camera.updateProjectionMatrix();
                    }
                }
                sunLight.shadow.needsUpdate = true;
            }
            if (typeof sunLight.update === 'function') {
                sunLight.update();
            }
            scheduleAdaptiveShadowFit(self);
        }

        if (skyLight) {
            skyLight.visible = helperConfig.fillIntensity > 0 && hasTakramSkyIrradiance;
            skyLight.intensity = hasTakramSkyIrradiance ? 1 : helperConfig.fillIntensity;
            if (typeof skyLight.correctAltitude !== 'undefined') {
                skyLight.correctAltitude = config.correctAltitudeEnabled !== false;
            }
            skyLight.irradianceTexture = textures ? (textures.irradianceTexture || null) : null;
            if (config.sunDirection && skyLight.sunDirection) {
                skyLight.sunDirection.copy(config.sunDirection);
            }
            ensurePmndrsWorldToEcefMatrix(skyLight, config);
            if (typeof skyLight.update === 'function') {
                skyLight.update();
            }
        }
    }

    function isPmndrsTakramLocalHorizonMode(self) {
        return Boolean(self && self.data && self.data.selChoice === "0");
    }

    function applyPmndrsTakramLocalHorizonConstraints(self, config) {
        if (!config) {
            return config;
        }

        // Local Horizon scenes keep Takram's own sky sun enabled and use the
        // stable VRodos helper-light path for A-Frame PBR/material-authored
        // content. Takram's physical light sources remain available behind a
        // debug flag; the Basic Storybook post-process look uses MeshBasic
        // materials and is not a drop-in match for shipped GLBs.
        config.groundEnabled = false;
        config.takramSunEnabled = true;
        config.useTakramLightSources = shouldUsePmndrsTakramPhysicalHorizonLights();
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
        const state = ensurePmndrsTakramHorizonState(self);
        if (!state) {
            return null;
        }

        if (!(config && config.enabled && isPmndrsTakramLocalHorizonMode(self))) {
            return resetPmndrsTakramHorizonState(state);
        }

        state.mode = 'local-light-source';
        state.owner = 'takram-light-source';
        state.groundEnabled = Boolean(config.groundEnabled);
        state.takramSunEnabled = config.takramSunEnabled !== false;
        state.usesTakramGround = Boolean(config.groundEnabled);
        state.usesTakramSunDisk = config.takramSunEnabled !== false;
        state.usesTakramLightSources = config.useTakramLightSources === true;

        if (config.localSunDirection) {
            state.localSunDirection.copy(config.localSunDirection);
        }
        if (config.sunDirection) {
            state.sunDirectionECEF.copy(config.sunDirection);
        }
        if (config.moonDirection) {
            state.moonDirectionECEF.copy(config.moonDirection);
        }

        ensurePmndrsWorldToEcefMatrix(state, config);
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

        const quality = normalizePmndrsAtmosphereQuality(this.data.pmndrsAtmosphereQuality);
        const preset = normalizePmndrsAtmospherePreset(this.data.pmndrsAtmospherePreset);
        const celestialMode = normalizePmndrsCelestialMode(this.data.pmndrsCelestialMode);
        const celestialTimePreset = normalizePmndrsCelestialTimePreset(this.data.pmndrsCelestialTimePreset);
        const celestialDate = normalizePmndrsDate(this.data.pmndrsCelestialDate);
        const celestialUtcTime = normalizePmndrsUtcTime(this.data.pmndrsCelestialUtcTime);
        const presetIntensity = readPmndrsAtmosphereNumber(this, 'pmndrsAtmospherePresetIntensity', 0, 1, 1);
        const resolvedLookPreset = celestialMode === 'preset-time' ? celestialTimePreset : preset;
        const presetDefaults = getPmndrsAtmosphereLookDefaults(resolvedLookPreset, presetIntensity);
        const usesCustomValues = celestialMode !== 'preset-time' && preset === 'custom';
        const effectiveCelestialTimePreset = resolvedLookPreset === 'custom' ? celestialTimePreset : resolvedLookPreset;
        const manualMoonEnabled = readPmndrsAtmosphereBool(this, 'pmndrsMoonEnabled', presetDefaults.moonEnabled);
        const geospatialEnabled = readPmndrsAtmosphereBool(this, 'pmndrsGeospatialEnabled', false);
        const config = {
            enabled: this.data.postFXEngine === 'pmndrs' && this.data.pmndrsAtmosphereEnabled !== '0',
            preset,
            celestialMode,
            celestialTimePreset: effectiveCelestialTimePreset,
            authoredCelestialTimePreset: celestialTimePreset,
            celestialDate,
            celestialUtcTime,
            resolvedLookPreset,
            presetIntensity,
            quality,
            geospatialEnabled,
            geospatialLatitudeDeg: readPmndrsAtmosphereNumber(this, 'pmndrsGeospatialLatitudeDeg', -90, 90, 0),
            geospatialLongitudeDeg: readPmndrsAtmosphereNumber(this, 'pmndrsGeospatialLongitudeDeg', -180, 180, 0),
            geospatialAltitudeMeters: readPmndrsAtmosphereNumber(this, 'pmndrsGeospatialAltitudeMeters', -500, 20000, 0),
            aerialPerspectiveEnabled: readPmndrsAtmosphereBool(this, 'pmndrsAerialPerspectiveEnabled', false),
            correctAltitudeEnabled: readPmndrsAtmosphereBool(this, 'pmndrsCorrectAltitudeEnabled', true),
            sunElevationDeg: usesCustomValues ? readPmndrsAtmosphereNumber(this, 'pmndrsSunElevationDeg', -18, 85, presetDefaults.sunElevationDeg) : presetDefaults.sunElevationDeg,
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
            moonEnabled: (celestialMode === 'preset-time' || celestialMode === 'datetime') ? manualMoonEnabled : (usesCustomValues ? manualMoonEnabled : presetDefaults.moonEnabled),
            horizonKeyLightIntensity: readPmndrsAtmosphereNumber(
                this,
                'pmndrsHorizonKeyLightIntensity',
                0,
                3,
                getPmndrsHorizonHelperLightDefaults(typeof this.getHorizonSkyPreset === 'function' ? this.getHorizonSkyPreset() : 'natural').keyIntensity
            ),
            horizonFillLightIntensity: readPmndrsAtmosphereNumber(
                this,
                'pmndrsHorizonFillLightIntensity',
                0,
                3,
                getPmndrsHorizonHelperLightDefaults(typeof this.getHorizonSkyPreset === 'function' ? this.getHorizonSkyPreset() : 'natural').fillIntensity
            ),
            takramSunEnabled: true
        };

        if (isPmndrsTakramLocalHorizonMode(this)) {
            applyPmndrsTakramLocalHorizonConstraints(this, config);
        }

        config.localSunDirection = buildPmndrsLocalSunDirection(config.sunElevationDeg, config.sunAzimuthDeg);
        config.localMoonDirection = buildPmndrsMoonDirection(config.localSunDirection);
        config.sunDirection = buildPmndrsEcefSunDirection(config.localSunDirection, config);
        config.moonDirection = buildPmndrsMoonDirection(config.sunDirection);

        if (celestialMode === 'datetime' && window.VRODOS_TAKRAM_ATMOSPHERE) {
            const frame = getPmndrsGeospatialFrame(config) || buildPmndrsGeospatialFrame(0, 90, 0);
            const observerECEF = frame.position;
            const date = getPmndrsDateObject(celestialDate, celestialUtcTime);
            const vta = window.VRODOS_TAKRAM_ATMOSPHERE;

            if (typeof vta.getSunDirectionECEF === 'function') {
                config.sunDirection = vta.getSunDirectionECEF(date, new THREE.Vector3(), observerECEF).normalize();
                config.localSunDirection = frame ? ecefDirectionToPmndrsLocal(config.sunDirection, frame) : buildPmndrsLocalSunDirection(config.sunElevationDeg, config.sunAzimuthDeg);
                applyLocalDirectionAngles(config);
            }
            if (typeof vta.getMoonDirectionECEF === 'function') {
                config.moonDirection = vta.getMoonDirectionECEF(date, new THREE.Vector3(), observerECEF).normalize();
                config.localMoonDirection = frame ? ecefDirectionToPmndrsLocal(config.moonDirection, frame) : buildPmndrsMoonDirection(config.localSunDirection);
            } else {
                config.moonDirection = buildPmndrsMoonDirection(config.sunDirection);
                config.localMoonDirection = buildPmndrsMoonDirection(config.localSunDirection);
            }
            if (typeof vta.getECIToECEFRotationMatrix === 'function') {
                config.inertialToECEFMatrix = vta.getECIToECEFRotationMatrix(date, new THREE.Matrix4());
            }
        }
        syncPmndrsTakramHorizonState(this, config);
        return config;
    };

    H.getPmndrsToneMappingExposure = function () {
        return getPmndrsExposureValue(this);
    };

    H.getPmndrsToneMappingMode = function () {
        return normalizePmndrsToneMappingMode(this && this.data ? this.data.pmndrsToneMappingMode : 'agx');
    };

    H.applyPmndrsAtmosphereConfigToTarget = function (target, config) {
        const vta = window.VRODOS_TAKRAM_ATMOSPHERE;
        if (!target || !config || !vta) {
            return;
        }

        const params = createPmndrsAtmosphereParameters(vta, config);
        copyPmndrsAtmosphereParameters(target, params);

        if (typeof config.sunAngularRadius !== 'undefined') {
            if (target.atmosphere) target.atmosphere.sunAngularRadius = config.sunAngularRadius;
            if (typeof target.sunAngularRadius !== 'undefined') target.sunAngularRadius = config.sunAngularRadius;
            if (target.uniforms) {
                let atmpsVal = null;
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
        if (typeof target.correctAltitude !== 'undefined') {
            target.correctAltitude = config.correctAltitudeEnabled !== false;
        }

        const setDefine = function (defs, key, val) {
            if (defs && typeof defs.set === 'function') {
                if (defs.get(key) !== val) { defs.set(key, val); return true; }
            } else if (defs) {
                if (defs[key] !== val) { defs[key] = val; return true; }
            }
            return false;
        };
        const removeDefine = function (defs, key) {
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
            let needsRecompile = false;
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
        ensurePmndrsWorldToEcefMatrix(target, config);
    };

    H.ensurePmndrsAtmosphereResources = function () {
        const renderer = this && this.el ? this.el.renderer : null;
        const scene = this && this.el ? this.el.object3D : null;
        const vta = window.VRODOS_TAKRAM_ATMOSPHERE;
        if (!renderer || !scene || !vta) {
            return null;
        }

        const profile = getPmndrsAtmosphereResourceProfile(this, renderer);

        if (this._pmndrsAtmosphereState && this._pmndrsAtmosphereState.profileSignature === profile.signature) {
            return this._pmndrsAtmosphereState;
        }

        if (this._pmndrsAtmosphereState) {
            this.disposePmndrsAtmosphere();
        }

        const state = {
            generator: null,
            textures: null,
            promise: null,
            skyMesh: null,
            skyMaterial: null,
            skyGeometry: null,
            ready: false,
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
            state.promise = state.generator.update().then(() => {
                state.ready = true;
                return state.textures;
            }).catch((err) => {
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
                    state.profileSignature = `${profile.quality  }:half:${  profile.higherOrderScattering ? 'higher' : 'basic'  }:${  profile.combinedScattering ? 'combined' : 'split'}`;
                    state.promise = state.generator.update().then(() => {
                        state.ready = true;
                        return state.textures;
                    }).catch((fallbackErr) => {
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

        const state = this._pmndrsAtmosphereState;
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

    function getPmndrsExposureValue(self) {
        if (!self || !self.data) {
            return 1.0;
        }

        let raw = parseFloat(self.data.pmndrsToneMappingExposure);
        if (isNaN(raw)) {
            raw = 1.0;
        }

        return Math.max(1, Math.min(20, raw));
    }

    function getLegacyHorizonStageSizeValue(self) {
        if (!self || !self.data) {
            return 5000;
        }

        let raw = parseFloat(self.data.legacyHorizonStageSize);
        if (isNaN(raw)) {
            raw = 5000;
        }

        return Math.max(500, Math.min(8000, Math.round(raw)));
    }

    function syncLegacyHorizonCameraFar(self) {
        if (!self || !self.el) {
            return;
        }

        const defaultFar = 7000;
        let targetFar = defaultFar;

        if (self.data && self.data.selChoice === "0") {
            targetFar = Math.max(defaultFar, Math.min(24000, getLegacyHorizonStageSizeValue(self) + 1000));
        }

        if (self.el.camera && typeof self.el.camera.far === 'number' && Math.abs(self.el.camera.far - targetFar) > 0.5) {
            self.el.camera.far = targetFar;
            if (typeof self.el.camera.updateProjectionMatrix === 'function') {
                self.el.camera.updateProjectionMatrix();
            }
        }

        Array.prototype.forEach.call(self.el.querySelectorAll('[camera]'), (cameraEl) => {
            if (!cameraEl || !cameraEl.components || !cameraEl.components.camera) {
                return;
            }

            cameraEl.setAttribute('camera', 'far', String(targetFar));

            const threeCamera = cameraEl.components.camera.camera;
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

        const raw = (lightPosition || '0.08 0.99 -0.1').split(/\s+/);
        const x = parseFloat(raw[0]);
        const y = parseFloat(raw[1]);
        const z = parseFloat(raw[2]);
        const dir = new THREE.Vector3(
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

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
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

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
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
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = image.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
                const jitter = ((Math.random() * 2) - 1) * 10;
                const a = data[i + 3] + jitter;
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
        const atmosphereMode = mode === 'atmosphere';
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

        const oldSun = document.getElementById('vrodos-pmndrs-sun');
        if (oldSun && oldSun.parentNode) {
            oldSun.parentNode.removeChild(oldSun);
        }
        const oldSunHaze = document.getElementById('vrodos-pmndrs-sun-haze');
        if (oldSunHaze && oldSunHaze.parentNode) {
            oldSunHaze.parentNode.removeChild(oldSunHaze);
        }
        const visibleTakramSun = document.getElementById('vrodos-takram-visible-sun');
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
            const params = new URLSearchParams(window.location.search);
            return params.get('vrodos_debug_disable_pmndrs_sun') === '1';
        } catch (err) {
            return false;
        }
    }

    function ensurePmndrsHorizonSun(self, lightPosition, preset, options) {
        if (!self || !self.el || typeof document === 'undefined') {
            return;
        }
        const opts = options || {};
        if (shouldDisablePmndrsVisibleSunDebug()) {
            clearPmndrsHorizonSun(self);
            return;
        }
        if (opts.atmosphere) {
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

        const camera = self.el.camera;
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

        const atmosphereConfig = this.getPmndrsAtmosphereConfig ? this.getPmndrsAtmosphereConfig() : null;
        if (atmosphereConfig && atmosphereConfig.enabled && window.VRODOS_TAKRAM_ATMOSPHERE) {
            clearPmndrsHorizonSun(this);
            ensurePmndrsAtmosphereSky(this, atmosphereConfig);
            return;
        }

        const sunEl = document.getElementById('vrodos-pmndrs-sun');
        if (!sunEl || !sunEl.object3D || !this._pmndrsSunDirection) {
            return;
        }

        const camera = this.el.camera;
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
        const renderer = this.el.renderer;
        if (!renderer) {
            return;
        }

        const isHighQuality = this.data.renderQuality === 'high';
        let targetPixelRatio = isHighQuality ? Math.min(window.devicePixelRatio || 1, 2) : Math.min(window.devicePixelRatio || 1, 1.25);
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
            const isPmndrsDirectXr = this.data.postFXEngine === 'pmndrs' &&
                typeof this.isVrPresentationActive === 'function' &&
                this.isVrPresentationActive();
            if (this.data.postFXEngine === 'pmndrs' && !isPmndrsDirectXr && typeof THREE.NoToneMapping !== 'undefined') {
                renderer.toneMapping = THREE.NoToneMapping;
            } else if (this.data.postFXEngine === 'pmndrs') {
                const pmndrsDirectToneMapping = getThreeToneMappingForPmndrsMode(this.data.pmndrsToneMappingMode);
                if (pmndrsDirectToneMapping !== null) {
                    renderer.toneMapping = pmndrsDirectToneMapping;
                }
            } else if (typeof THREE.ACESFilmicToneMapping !== 'undefined') {
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
            }
        }
    };
    H.applyShadowQualityProfile = function () {
        const renderer = this.el.renderer;
        const shadowQuality = this.data.shadowQuality || 'medium';
        const shadowsEnabled = shadowQuality !== 'off';
        const contactShadowSettings = this.getContactShadowSettings();

        if (renderer && renderer.shadowMap) {
            renderer.shadowMap.enabled = shadowsEnabled;
            renderer.shadowMap.type = typeof THREE.PCFSoftShadowMap !== 'undefined' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
            renderer.shadowMap.needsUpdate = true;
        }

        if (this.el.hasAttribute('environment')) {
            this.el.setAttribute('environment', 'shadow', shadowsEnabled ? 'true' : 'false');
        }

        this.el.object3D.traverse((node) => {
            if (node.isMesh) {
                const isLightingParticipant = isWorldLightingParticipantMesh(node);
                if (!isLightingParticipant) {
                    node.castShadow = false;
                    node.receiveShadow = false;
                    return;
                }

                node.castShadow = shadowsEnabled && !isReceiverOnlyLightingMesh(node);
                node.receiveShadow = shadowsEnabled;
            }

            if (node.isDirectionalLight || node.isSpotLight || node.isPointLight) {
                node.castShadow = shadowsEnabled;

                if (!node.shadow) {
                    return;
                }

                if (shadowsEnabled) {
                    const targetMapSize = shadowQuality === 'high'
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

                    const isVrodosManagedLight = Boolean((node.userData && node.userData.vrodosPmndrsTakramLightSource) ||
                        (node.el && typeof node.el.hasAttribute === 'function' && node.el.hasAttribute('data-vrodos-photoreal-light')));
                    const managedShadowBias = shadowQuality === 'high' ? 0.00004 : 0.00008;
                    const managedNormalBias = shadowQuality === 'high' ? 0.045 : 0.065;

                    if (typeof node.shadow.bias !== 'undefined') {
                        node.shadow.bias = isVrodosManagedLight
                            ? managedShadowBias
                            : (node.userData.vrodosBaseShadowBias !== 0 ? node.userData.vrodosBaseShadowBias : contactShadowSettings.bias);
                    }

                    if (typeof node.shadow.normalBias !== 'undefined') {
                        node.shadow.normalBias = isVrodosManagedLight
                            ? managedNormalBias
                            : (node.userData.vrodosBaseShadowNormalBias !== 0 ? node.userData.vrodosBaseShadowNormalBias : contactShadowSettings.normalBias);
                    }
                }

                node.shadow.needsUpdate = true;
            }
        });

        if (shadowsEnabled) {
            applyAdaptiveShadowFit(this);
        }
    };
    H.applyMaterialProfiles = function () {
        const renderer = this.el.renderer;
        const sceneObj = this.el.object3D;
        const maxAnisotropy = renderer && typeof renderer.capabilities !== 'undefined' && typeof renderer.capabilities.getMaxAnisotropy === 'function'
            ? renderer.capabilities.getMaxAnisotropy()
            : 0;
        const atmosphereConfig = this.getPmndrsAtmosphereConfig ? this.getPmndrsAtmosphereConfig() : null;
        const reflectionSource = typeof this.getEffectiveReflectionSource === 'function' ? this.getEffectiveReflectionSource() : 'none';
        const reflectionsEnabled = typeof this.areReflectionsEnabled === 'function' ? this.areReflectionsEnabled() : true;
        const reflectionOcclusionMode = normalizeReflectionOcclusionMode(this.data.reflectionOcclusionMode);
        const shadowAwareReflections = reflectionsEnabled &&
            reflectionOcclusionMode !== 'off' &&
            this.data.shadowQuality !== 'off' &&
            !(typeof this.isVrPresentationActive === 'function' && this.isVrPresentationActive());
        const options = {
            renderQuality: this.data.renderQuality || 'standard',
            maxAnisotropy,
            reflectionsEnabled,
            reflectionProfile: this.data.reflectionProfile || 'balanced',
            reflectionSource,
            reflectionOcclusionMode,
            shadowAwareReflections,
            reflectionIntensityScale: getPmndrsNightReflectionIntensityScale(this, atmosphereConfig, reflectionSource),
            ambientOcclusionPreset: this.getAmbientOcclusionPreset(),
            environmentMap: sceneObj ? (sceneObj.environment || null) : null
        };
        const enhancedMaterials = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
        const enhanceMaterialOnce = function (material, overrides) {
            if (!material || isHiddenNavmeshMaterial(material)) {
                return;
            }
            if (enhancedMaterials && enhancedMaterials.has(material)) {
                return;
            }
            vrodosEnhanceMeshMaterial(material, overrides || {}, options);
            if (enhancedMaterials) {
                enhancedMaterials.add(material);
            }
        };

        Array.prototype.forEach.call(this.getCachedSceneQuery('overrideMaterials', '.override-materials'), (entityEl) => {
            if (!entityEl) {
                return;
            }

            const meshRoot = entityEl.getObject3D('mesh');
            if (!meshRoot) {
                return;
            }

            const overrides = vrodosGetExplicitMaterialOverrides(entityEl);
            meshRoot.traverse((node) => {
                if (!node.isMesh || !node.material || isHiddenNavmeshMaterial(node.material)) {
                    return;
                }

                if (Array.isArray(node.material)) {
                    node.material.forEach((material) => {
                        enhanceMaterialOnce(material, overrides);
                    });
                } else {
                    enhanceMaterialOnce(node.material, overrides);
                }
            });
        });

        if (sceneObj) {
            sceneObj.traverse((node) => {
                if (!node.isMesh || !node.material || isHiddenNavmeshMaterial(node.material)) {
                    return;
                }

                if (Array.isArray(node.material)) {
                    node.material.forEach((material) => {
                        enhanceMaterialOnce(material, {});
                    });
                } else {
                    enhanceMaterialOnce(node.material, {});
                }
            });
        }
    };
    H.ensurePhotorealHelperLight = function (id, attributes, position) {
        let lightEl = document.getElementById(id);
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
        removePhotorealHelperLightElements(this);
        removePmndrsTakramLightSources(this);
    };
    H.applyHorizonSkyPreset = function () {
        if (this.data.selChoice !== "0") {
            return;
        }

        const preset = this.getHorizonSkyPreset();
        const isPmndrs = this.data.postFXEngine === 'pmndrs';
        const usesTakramHorizon = shouldUsePmndrsTakramHorizonPath(this);
        const shadowEnabled = this.data.shadowQuality !== 'off';

        if (!usesTakramHorizon) {
            setAFrameDefaultLightsEnabled(this, true);
        }

        if (isPmndrs) {
            removeLegacySunSkyEntitiesForPmndrs(this);
        }

        const environmentConfig = {
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
            setAFrameDefaultLightsEnabled(this, true);
            this.removePhotorealHelperLights();
            removePmndrsAtmosphereSky(this);
            clearPmndrsHorizonSun(this);
            return;
        }

        const atmosphereConfig = this.getPmndrsAtmosphereConfig ? this.getPmndrsAtmosphereConfig() : null;
        if (usesTakramHorizon && atmosphereConfig && atmosphereConfig.enabled) {
            removeLegacySunSkyEntitiesForPmndrs(this);
            schedulePmndrsHorizonEnvironmentCleanup(this);
            ensurePmndrsTakramHorizonLights(this, atmosphereConfig, preset);
            clearPmndrsHorizonSun(this);
            ensurePmndrsAtmosphereSky(this, atmosphereConfig);
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

        setAFrameDefaultLightsEnabled(this, true);
        removePmndrsAtmosphereSky(this);
        ensurePmndrsHorizonSun(this, environmentConfig.lightPosition, preset);
    };
    H.applyBackgroundQualityProfile = function () {
        const isHighQuality = this.data.renderQuality === 'high';
        const shadowEnabled = this.data.shadowQuality !== 'off';
        const hasEnvironmentBackground = (this.data.selChoice === "0") || (this.data.selChoice === "2" && this.data.presChoice !== "ocean");
        const reflectionProfile = this.data.reflectionProfile || 'balanced';
        const enhancedReflections = reflectionProfile === 'enhanced';
        const softReflections = reflectionProfile === 'soft';
        const contactShadowSettings = this.getContactShadowSettings();
        const hasAuthorLights = Array.prototype.some.call(this.getCachedSceneQuery('lightEntities', '[light]'), (lightEl) => !lightEl.hasAttribute('data-vrodos-photoreal-light'));

        syncLegacyHorizonCameraFar(this);

        if (shouldUsePmndrsTakramHorizonPath(this)) {
            this.applyHorizonSkyPreset();
            return;
        }

        setAFrameDefaultLightsEnabled(this, true);

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

        const keyShadowMap = this.data.shadowQuality === 'high' ? 2048 : 1024;
        const castShadow = shadowEnabled ? 'true' : 'false';

        this.ensurePhotorealHelperLight(
            'vrodos-photoreal-key-light',
            `type: directional; color: #fff2d8; intensity: ${  enhancedReflections ? Math.max(contactShadowSettings.helperKeyIntensity, 1.0).toFixed(2) : (softReflections ? Math.max(contactShadowSettings.helperKeyIntensity - 0.08, 0.72).toFixed(2) : contactShadowSettings.helperKeyIntensity.toFixed(2))  }; castShadow: ${  castShadow  }; shadowMapWidth: ${  keyShadowMap  }; shadowMapHeight: ${  keyShadowMap  }; shadowCameraTop: 16; shadowCameraRight: 16; shadowCameraLeft: -16; shadowCameraBottom: -16; shadowBias: ${  contactShadowSettings.bias  };`,
            contactShadowSettings.helperPosition
        );

        this.ensurePhotorealHelperLight(
            'vrodos-photoreal-fill-light',
            `type: ambient; color: #d8e4ff; intensity: ${  enhancedReflections ? Math.max(contactShadowSettings.helperFillIntensity, 0.4).toFixed(2) : (softReflections ? Math.max(contactShadowSettings.helperFillIntensity - 0.05, 0.22).toFixed(2) : contactShadowSettings.helperFillIntensity.toFixed(2))  };`,
            '0 4 0'
        );
    };
    H.applyPostFXProfile = function () {
        const renderer = this.el.renderer;
        const canvas = this.el.canvas || (renderer ? renderer.domElement : null);
        const postFxEnabled = this.shouldUsePostProcessing();

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
        this.applyBackgroundQualityProfile();
        this.applyShadowQualityProfile();
        this.applyEnvMapProfile();
        this.applyMaterialProfiles();
        this.applyPostFXProfile();
        this.syncFPSMeterState();
        this.sceneCollectionsDirty = false;
    };
    H.updateAdaptiveShadowFit = function (force) {
        if (!this || !this.el || !this.el.camera || this.data.shadowQuality === 'off') {
            return;
        }

        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (!force && this._vrodosShadowFitLastMs && (now - this._vrodosShadowFitLastMs) < 300) {
            return;
        }

        if (!this._vrodosShadowFitCameraPosition) {
            this._vrodosShadowFitCameraPosition = new THREE.Vector3();
            this._vrodosShadowFitCurrentCameraPosition = new THREE.Vector3();
            force = true;
        }

        this.el.camera.getWorldPosition(this._vrodosShadowFitCurrentCameraPosition);
        if (!force && this._vrodosShadowFitCurrentCameraPosition.distanceToSquared(this._vrodosShadowFitCameraPosition) < 9) {
            return;
        }

        this._vrodosShadowFitCameraPosition.copy(this._vrodosShadowFitCurrentCameraPosition);
        this._vrodosShadowFitLastMs = now;
        applyAdaptiveShadowFit(this);
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
