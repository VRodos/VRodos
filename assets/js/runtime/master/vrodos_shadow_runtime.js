/** Shadow roles, terrain stabilization, fitting, refresh scheduling, and diagnostics.
 * Scene component state and lifecycle remain owned by the existing host.
 */
(function () {
    VRODOSMaster.ShadowRuntime = Object.freeze({ create });

    function create({
        readPmndrsDebugNumber,
        hasPmndrsDebugFlag,
        isPmndrsDayNightCycleEnabled,
        getRuntimeNowMs,
        getImmersiveNavigationForPresentedTransforms
    }) {
        const H = {};
        const TERRAIN_SHADOW_DEPTH_OFFSET_FACTOR = 4;
        const TERRAIN_SHADOW_DEPTH_OFFSET_UNITS = 8;
        const PMNDRS_DAY_NIGHT_SHADOW_RADIUS_HIGH = 2.4;
        const PMNDRS_DAY_NIGHT_SHADOW_RADIUS_MEDIUM = 1.8;
        const normalizeAFrameShadowMapType = VRODOSMaster.ShadowMaps.normalizeType;
        const getThreeShadowMapType = VRODOSMaster.ShadowMaps.threeType;
        const getThreeShadowMapTypeName = VRODOSMaster.ShadowMaps.typeName;
        const getAFrameShadowComponentType = VRODOSMaster.ShadowMaps.componentType;
        const disposeLightShadowMap = VRODOSMaster.ShadowMaps.dispose;
        const isLightShadowMapCompatibleWithType = VRODOSMaster.ShadowMaps.isCompatible;

        function getTerrainShadowDepthOffset() {
            return {
                factor: readPmndrsDebugNumber(
                    'terrainShadowDepthOffsetFactor',
                    'vrodos_debug_terrain_shadow_depth_offset_factor',
                    TERRAIN_SHADOW_DEPTH_OFFSET_FACTOR,
                    0,
                    8
                ),
                units: readPmndrsDebugNumber(
                    'terrainShadowDepthOffsetUnits',
                    'vrodos_debug_terrain_shadow_depth_offset_units',
                    TERRAIN_SHADOW_DEPTH_OFFSET_UNITS,
                    0,
                    16
                )
            };
        }

        function getPmndrsDayNightShadowRadius(self) {
            const shadowQuality = self && self.data && self.data.shadowQuality === 'high' ? 'high' : 'medium';
            const fallback = shadowQuality === 'high'
                ? PMNDRS_DAY_NIGHT_SHADOW_RADIUS_HIGH
                : PMNDRS_DAY_NIGHT_SHADOW_RADIUS_MEDIUM;
            return readPmndrsDebugNumber(
                'dayNightShadowRadius',
                'vrodos_debug_day_night_shadow_radius',
                fallback,
                0,
                6
            );
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

        function isFlatMediaShadowEntity(entityEl) {
            if (!entityEl) {
                return false;
            }

            const id = entityEl.id || '';
            return id.indexOf('video-display_') === 0 ||
                id.indexOf('image-display_') === 0 ||
                entityEl.hasAttribute('data-vrodos-video-src');
        }

        function isFlatMediaShadowCastingEnabled() {
            if (hasPmndrsDebugFlag('castFlatMediaShadows', 'vrodos_debug_cast_flat_media_shadows')) {
                return true;
            }

            const sceneEl = typeof document !== 'undefined' ? document.querySelector('a-scene') : null;
            const sceneSettings = sceneEl && sceneEl.components ? sceneEl.components['scene-settings'] : null;
            const value = sceneSettings && sceneSettings.data ? sceneSettings.data.flatMediaShadowCasting : '1';
            return value === true || value === 'true' || value === '1' || value === 1 ||
                typeof value === 'undefined' || value === null || value === '';
        }

        function normalizeShadowRole(value) {
            const role = String(value || '').trim().toLowerCase();
            if (role === 'caster-receiver' || role === 'receiver' || role === 'none') {
                return role;
            }
            return null;
        }

        function isNavmeshShadowEntity(entityEl) {
            return Boolean(entityEl && (entityHasClass(entityEl, 'vrodos-navmesh') || entityEl.hasAttribute('data-vrodos-navmesh')));
        }

        function isTerrainShadowEntity(entityEl) {
            return Boolean(entityEl && (
                isNavmeshShadowEntity(entityEl) ||
                entityEl.getAttribute('data-vrodos-collision-category') === 'walkable-surface' ||
                entityEl.getAttribute('data-vrodos-material-role') === 'terrain-matte'
            ));
        }

        function getEntityShadowRole(entityEl) {
            if (!entityEl) {
                return null;
            }

            if (entityEl.hasAttribute('data-vrodos-collision-hidden') ||
                entityEl.hasAttribute('vrodos-collider-helper') ||
                entityEl.hasAttribute('data-vrodos-overlay-ui')) {
                return 'none';
            }

            if (isNavmeshShadowEntity(entityEl) && entityEl.getAttribute('data-vrodos-shadow-role-authored') !== 'true') {
                return 'receiver';
            }

            const authoredRole = normalizeShadowRole(entityEl.getAttribute('data-vrodos-shadow-role'));
            if (authoredRole) {
                if (isFlatMediaShadowEntity(entityEl) && !isFlatMediaShadowCastingEnabled()) {
                    return 'receiver';
                }
                return authoredRole;
            }

            if (isNavmeshShadowEntity(entityEl)) {
                return 'receiver';
            }

            return null;
        }

        function getObjectShadowRole(object) {
            let current = object;
            let resolvedRole = null;
            let hasFlatMedia = false;

            while (current) {
                if (current.el) {
                    if (isFlatMediaShadowEntity(current.el)) {
                        hasFlatMedia = true;
                    }
                    const role = getEntityShadowRole(current.el);
                    if (role === 'none') {
                        return 'none';
                    }
                    if (role && !resolvedRole) {
                        resolvedRole = role;
                    }
                }
                current = current.parent || null;
            }

            if (hasFlatMedia) {
                return isFlatMediaShadowCastingEnabled() ? 'caster-receiver' : 'receiver';
            }

            return resolvedRole;
        }

        function isVrodosManagedShadowLight(node) {
            return Boolean(
                node &&
                (
                    (node.userData && node.userData.vrodosPmndrsTakramLightSource) ||
                    objectEntityChainHas(node, (entityEl) => (
                        entityEl.hasAttribute('data-vrodos-photoreal-light')
                    ))
                )
            );
        }

        function isVrodosPhotorealHelperLight(node) {
            return Boolean(node && objectEntityChainHas(node, (entityEl) => (
                entityEl.hasAttribute('data-vrodos-photoreal-light')
            )));
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

            const shadowRole = getObjectShadowRole(node);
            if (shadowRole === 'none') {
                return false;
            }

            if (shadowRole === 'receiver' || shadowRole === 'caster-receiver') {
                return true;
            }

            return objectEntityChainHas(node, isDecorativeLightingEntity) || isShadowEligibleMaterial(node.material);
        }

        function isTerrainSelfShadowCasterMesh(node) {
            return Boolean(
                node &&
                node.isMesh &&
                objectEntityChainHas(node, isTerrainShadowEntity) &&
                getObjectShadowRole(node) === 'caster-receiver'
            );
        }

        function syncTerrainShadowDepthMaterial(self, node, enabled) {
            if (!node || !node.isMesh) {
                return;
            }

            node.userData = node.userData || {};
            const existingDepthMaterial = node.userData.vrodosTerrainShadowDepthMaterial || null;
            const disabled = hasPmndrsDebugFlag(
                'disableTerrainShadowDepthOffset',
                'vrodos_debug_disable_terrain_shadow_depth_offset'
            );

            if (!enabled || disabled || typeof THREE.MeshDepthMaterial !== 'function') {
                if (existingDepthMaterial && node.customDepthMaterial === existingDepthMaterial) {
                    node.customDepthMaterial = node.userData.vrodosTerrainShadowPreviousCustomDepthMaterial || undefined;
                }
                return;
            }

            let depthMaterial = existingDepthMaterial;
            if (!depthMaterial) {
                depthMaterial = new THREE.MeshDepthMaterial({
                    depthPacking: typeof THREE.RGBADepthPacking !== 'undefined' ? THREE.RGBADepthPacking : undefined
                });
                depthMaterial.name = 'vrodosTerrainShadowDepthMaterial';
                depthMaterial.userData = depthMaterial.userData || {};
                depthMaterial.userData.vrodosTerrainShadowDepthMaterial = true;
                node.userData.vrodosTerrainShadowPreviousCustomDepthMaterial = node.customDepthMaterial || null;
                node.userData.vrodosTerrainShadowDepthMaterial = depthMaterial;
                if (self && self.runtimeResources && typeof self.runtimeResources.track === 'function') {
                    self.runtimeResources.track(depthMaterial);
                }
            }

            const offset = getTerrainShadowDepthOffset();
            if (typeof THREE.RGBADepthPacking !== 'undefined') {
                depthMaterial.depthPacking = THREE.RGBADepthPacking;
            }
            depthMaterial.polygonOffset = true;
            depthMaterial.polygonOffsetFactor = offset.factor;
            depthMaterial.polygonOffsetUnits = offset.units;
            depthMaterial.needsUpdate = true;
            node.customDepthMaterial = depthMaterial;
        }

        function hasSelfShadowingTerrain(self) {
            if (!self || !self.el || typeof self.el.querySelectorAll !== 'function') {
                return false;
            }

            const terrainEls = self.el.querySelectorAll('[data-vrodos-navmesh], [data-vrodos-collision-category="walkable-surface"], [data-vrodos-material-role="terrain-matte"]');
            for (let i = 0; i < terrainEls.length; i++) {
                if (isTerrainShadowEntity(terrainEls[i]) && getEntityShadowRole(terrainEls[i]) === 'caster-receiver') {
                    return true;
                }
            }

            return false;
        }

        function getTerrainSafeContactShadowSettings(self, settings) {
            if (!settings || !hasSelfShadowingTerrain(self)) {
                return settings;
            }

            const preset = typeof self.getContactShadowPreset === 'function'
                ? self.getContactShadowPreset()
                : (self.data && self.data.contactShadowPreset);
            if (preset !== 'strong') {
                return settings;
            }

            const shadowQuality = self.data && self.data.shadowQuality === 'high' ? 'high' : 'medium';
            const safeSettings = Object.assign({}, settings);
            const biasFloor = shadowQuality === 'high' ? -0.00012 : -0.00009;
            const normalBiasFloor = shadowQuality === 'high' ? 0.032 : 0.024;

            if (typeof safeSettings.bias === 'number') {
                safeSettings.bias = Math.min(-0.00001, Math.max(safeSettings.bias, biasFloor));
            }
            if (typeof safeSettings.normalBias === 'number') {
                safeSettings.normalBias = Math.max(safeSettings.normalBias, normalBiasFloor);
            }

            return safeSettings;
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
            const cameraLocalBounds = new THREE.Box3();
            const nodeBounds = new THREE.Box3();
            const nodeCenter = new THREE.Vector3();
            const clippedNodeBounds = new THREE.Box3();
            let hasFocusedBounds = false;
            let hasFallbackBounds = false;

            if (canUseCamera) {
                camera.getWorldPosition(cameraPosition);
                cameraLocalBounds.set(
                    new THREE.Vector3(
                        cameraPosition.x - maxFitDistance,
                        cameraPosition.y - maxFitDistance,
                        cameraPosition.z - maxFitDistance
                    ),
                    new THREE.Vector3(
                        cameraPosition.x + maxFitDistance,
                        cameraPosition.y + maxFitDistance,
                        cameraPosition.z + maxFitDistance
                    )
                );
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
                if (nodeBounds.containsPoint(cameraPosition)) {
                    clippedNodeBounds.copy(nodeBounds).intersect(cameraLocalBounds);
                    if (!clippedNodeBounds.isEmpty()) {
                        focusedBounds.union(clippedNodeBounds);
                        hasFocusedBounds = true;
                    }
                    return;
                }

                if (nodeCenter.distanceToSquared(cameraPosition) <= maxFitDistanceSq) {
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

        function getBoundsRadius(bounds) {
            if (!bounds || bounds.isEmpty()) {
                return 0;
            }

            const size = new THREE.Vector3();
            bounds.getSize(size);
            return Math.max(size.x, size.y, size.z) * 0.5;
        }

        function getDirectionalShadowDistanceForScene(self, fallback) {
            const bounds = collectAdaptiveShadowBounds(self);
            const radius = getBoundsRadius(bounds);
            const base = Number.isFinite(Number(fallback)) ? Number(fallback) : 28;
            if (radius <= 0) {
                return base;
            }

            return Math.max(base, Math.min(20000, radius * 2.8));
        }

        function fitDirectionalShadowCameraToBounds(light, bounds, shadowQuality, options) {
            if (!light || !light.shadow || !light.shadow.camera || !bounds || bounds.isEmpty()) {
                return;
            }

            const opts = options || {};
            const owner = opts.self || null;
            const stableFrustum = opts.stableFrustum === true;
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
            const boundsSphereRadius = Math.max(boundsRadius, boxSize.length() * 0.5);
            const margin = Math.max(shadowQuality === 'high' ? 4 : 6, boundsRadius * 0.08);
            const minExtent = shadowQuality === 'high' ? 18 : 24;

            light.updateMatrixWorld(true);
            bounds.getCenter(boundsCenter);
            if (light.target) {
                light.target.updateMatrixWorld(true);
                targetPosition.setFromMatrixPosition(light.target.matrixWorld);
                lightOffset.setFromMatrixPosition(light.matrixWorld).sub(targetPosition);
                if (lightOffset.lengthSq() > 0.0001) {
                    const fitDistance = stableFrustum
                        ? Math.max(boundsSphereRadius * 2.5, 64)
                        : Math.max(boundsRadius * 2.5, 64);
                    lightOffset.normalize().multiplyScalar(fitDistance);
                    light.position.copy(boundsCenter).add(lightOffset);
                    light.target.position.copy(boundsCenter);
                    light.target.updateMatrixWorld(true);
                    light.updateMatrixWorld(true);
                }
            }
            capturePresentedShadowLightBase(owner, light);
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

            if (stableFrustum) {
                const stableMargin = Math.max(shadowQuality === 'high' ? 4 : 6, boundsSphereRadius * 0.08);
                const stableExtent = Math.max(minExtent, boundsSphereRadius + stableMargin);
                const lightDistance = Math.max(lightOffset.length(), boundsSphereRadius * 2.5, 64);
                shadowCamera.left = -stableExtent;
                shadowCamera.right = stableExtent;
                shadowCamera.bottom = -stableExtent;
                shadowCamera.top = stableExtent;
                shadowCamera.near = Math.max(0.1, lightDistance - boundsSphereRadius - stableMargin);
                shadowCamera.far = Math.max(shadowCamera.near + 1, lightDistance + boundsSphereRadius + stableMargin);
            } else {
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
            }

            if (typeof shadowCamera.updateProjectionMatrix === 'function') {
                shadowCamera.updateProjectionMatrix();
            }
            if (light.shadow && typeof light.shadow.updateMatrices === 'function') {
                light.shadow.updateMatrices(light);
            }

            light.userData = light.userData || {};
            light.userData.vrodosAdaptiveShadowFitted = true;
            light.userData.vrodosAdaptiveShadowStableFrustum = stableFrustum;
            light.shadow.needsUpdate = true;
        }

        function applyAdaptiveShadowFit(self, options) {
            const shadowQuality = self && self.data ? (self.data.shadowQuality || 'medium') : 'medium';
            if (shadowQuality === 'off') {
                return;
            }

            const bounds = collectAdaptiveShadowBounds(self);
            if (!bounds) {
                return;
            }

            self._vrodosAdaptiveShadowCenter = self._vrodosAdaptiveShadowCenter || new THREE.Vector3();
            bounds.getCenter(self._vrodosAdaptiveShadowCenter);

            const fitOptions = Object.assign({}, options || {}, { self });
            collectDirectionalShadowLights(self).forEach((light) => {
                fitDirectionalShadowCameraToBounds(light, bounds, shadowQuality, fitOptions);
            });
            self._vrodosShadowFitLastMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
        }

        function getAdaptiveShadowCenter(self) {
            return self && self._vrodosAdaptiveShadowCenter && typeof self._vrodosAdaptiveShadowCenter.copy === 'function'
                ? self._vrodosAdaptiveShadowCenter
                : null;
        }

        function scheduleAdaptiveShadowFit(self) {
            if (!self || !self.el || self.data.shadowQuality === 'off') {
                return;
            }

            applyAdaptiveShadowFit(self);
            if (typeof self.markShadowDirty === 'function') {
                self.markShadowDirty('adaptive-shadow-fit');
            }

            if (typeof self.isVrRuntimeHeadsetProfile === 'function' && self.isVrRuntimeHeadsetProfile()) {
                return;
            }

            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(() => {
                    applyAdaptiveShadowFit(self);
                    if (typeof self.markShadowDirty === 'function') {
                        self.markShadowDirty('adaptive-shadow-fit-frame');
                    }
                });
            }

            setTimeout(() => {
                applyAdaptiveShadowFit(self);
                if (typeof self.markShadowDirty === 'function') {
                    self.markShadowDirty('adaptive-shadow-fit-settle');
                }
            }, 80);
        }

        function schedulePmndrsAtmosphereShadowFit(self, config) {
            if (!isPmndrsDayNightCycleEnabled(self)) {
                scheduleAdaptiveShadowFit(self);
                return;
            }

            if (hasPmndrsDebugFlag('disablePmndrsDayNightCycleDynamicShadows', 'vrodos_debug_disable_day_night_dynamic_shadows')) {
                return;
            }

            if (!self._vrodosShadowFitLastMs) {
                self._pmndrsDayNightCycleShadowLastMs = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
                applyAdaptiveShadowFit(self, { stableFrustum: true });
            }
            if (config && config.localSunDirection) {
                self._pmndrsDayNightCycleLastShadowSunDirection = self._pmndrsDayNightCycleLastShadowSunDirection || new THREE.Vector3();
                self._pmndrsDayNightCycleLastShadowSunDirection.copy(config.localSunDirection);
            }
        }

        function arePmndrsDayNightCycleDynamicShadowsEnabled(self, config) {
            return Boolean(
                config &&
                config.dayNightCycleEnabled &&
                self &&
                self.data &&
                self.data.shadowQuality !== 'off' &&
                !hasPmndrsDebugFlag('disablePmndrsDayNightCycleDynamicShadows', 'vrodos_debug_disable_day_night_dynamic_shadows')
            );
        }

        function shouldUseDayNightPcfShadowMap(self) {
            return Boolean(
                self &&
                self.data &&
                isPmndrsDayNightCycleEnabled(self) &&
                self.data.shadowQuality !== 'off' &&
                !hasPmndrsDebugFlag('disablePmndrsDayNightCycleDynamicShadows', 'vrodos_debug_disable_day_night_dynamic_shadows')
            );
        }

        function sanitizePhotorealHelperLightAttributes(attributes) {
            return String(attributes || '').replace(/castShadow\s*:\s*true/gi, 'castShadow: false');
        }

        function isPmndrsTakramHorizonRequested(self) {
            return Boolean(self &&
                self.data &&
                self.data.selChoice === "0" &&
                self.data.postFXEngine === 'pmndrs' &&
                self.data.pmndrsAtmosphereEnabled !== '0');
        }

        function vectorToRoundedArray(vector) {
            if (!vector || typeof vector.x !== 'number' || typeof vector.y !== 'number' || typeof vector.z !== 'number') {
                return null;
            }

            return [
                Number(vector.x.toFixed(4)),
                Number(vector.y.toFixed(4)),
                Number(vector.z.toFixed(4))
            ];
        }

        function vectorToSignature(vector) {
            const rounded = vectorToRoundedArray(vector);
            return rounded ? rounded.join(',') : 'n/a';
        }

        function getShadowLightDiagnostic(node) {
            const shadow = node && node.shadow ? node.shadow : null;
            const map = shadow && shadow.map ? shadow.map : null;
            const mapTexture = map && map.texture ? map.texture : null;
            const depthTexture = map && map.depthTexture ? map.depthTexture : null;
            const mapSize = shadow && shadow.mapSize
                ? `${shadow.mapSize.x || 0}x${shadow.mapSize.y || 0}`
                : '';
            const direction = node && node.sunDirection
                ? node.sunDirection
                : (node && node.position ? node.position : null);

            return {
                name: node && node.name ? node.name : '',
                visible: Boolean(node && node.visible),
                castShadow: Boolean(node && node.castShadow),
                intensity: node && typeof node.intensity === 'number' ? Number(node.intensity.toFixed(3)) : null,
                mapSize,
                mapAllocated: Boolean(map),
                mapTextureFormat: mapTexture && typeof mapTexture.format !== 'undefined' ? mapTexture.format : null,
                mapTextureType: mapTexture && typeof mapTexture.type !== 'undefined' ? mapTexture.type : null,
                depthTextureAllocated: Boolean(depthTexture),
                depthTextureFormat: depthTexture && typeof depthTexture.format !== 'undefined' ? depthTexture.format : null,
                depthTextureType: depthTexture && typeof depthTexture.type !== 'undefined' ? depthTexture.type : null,
                depthTextureCompareFunction: depthTexture && typeof depthTexture.compareFunction !== 'undefined' ? depthTexture.compareFunction : null,
                depthTextureIsDepthTexture: Boolean(depthTexture && depthTexture.isDepthTexture),
                needsUpdate: Boolean(shadow && shadow.needsUpdate),
                direction: vectorToRoundedArray(direction)
            };
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
                fitted: 'pending',
                mode: self ? getShadowUpdateMode(self) : 'static',
                autoUpdate: null,
                needsUpdate: null,
                type: null,
                typeName: null,
                typeReason: self && self._vrodosShadowMapTypeReason ? self._vrodosShadowMapTypeReason : null,
                updateCount: self && self._vrodosShadowUpdateCount ? self._vrodosShadowUpdateCount : 0,
                dirtyRequests: self && self._vrodosShadowDirtyRequests ? self._vrodosShadowDirtyRequests : 0,
                lastDirtyReason: self && self._vrodosShadowDirtyReason ? self._vrodosShadowDirtyReason : null,
                lastUpdateReason: self && self._vrodosShadowLastUpdateReason ? self._vrodosShadowLastUpdateReason : null,
                compatibilityRefreshes: self && self._vrodosShadowCompatibilityRefreshes ? self._vrodosShadowCompatibilityRefreshes : 0,
                lastCompatibilityRefreshReason: self && self._vrodosShadowLastCompatibilityRefreshReason ? self._vrodosShadowLastCompatibilityRefreshReason : null,
                lastCompatibilityRefreshType: self && self._vrodosShadowLastCompatibilityRefreshType ? self._vrodosShadowLastCompatibilityRefreshType : null,
                programRefreshes: self && self._vrodosShadowProgramRefreshes ? self._vrodosShadowProgramRefreshes : 0,
                lastProgramRefreshReason: self && self._vrodosShadowLastProgramRefreshReason ? self._vrodosShadowLastProgramRefreshReason : null,
                lastProgramRefreshType: self && self._vrodosShadowLastProgramRefreshType ? self._vrodosShadowLastProgramRefreshType : null,
                navigationRefreshRequests: self && self._vrodosNavigationShadowRefreshRequests ? self._vrodosNavigationShadowRefreshRequests : 0,
                navigationRefreshApplied: self && self._vrodosNavigationShadowRefreshApplied ? self._vrodosNavigationShadowRefreshApplied : 0,
                navigationRefreshLastReason: self && self._vrodosNavigationShadowRefreshLastReason ? self._vrodosNavigationShadowRefreshLastReason : null,
                navigationRefreshLastSkippedReason: self && self._vrodosNavigationShadowRefreshLastSkippedReason ? self._vrodosNavigationShadowRefreshLastSkippedReason : null,
                navigationRefreshLastPresentationMode: self && self._vrodosNavigationShadowRefreshLastPresentationMode ? self._vrodosNavigationShadowRefreshLastPresentationMode : null,
                navigationRefreshLastDistance: self && typeof self._vrodosNavigationShadowRefreshLastDistance === 'number'
                    ? Number(self._vrodosNavigationShadowRefreshLastDistance.toFixed(3))
                    : null,
                takramSignature: self && self._pmndrsTakramLightShadowSignature ? self._pmndrsTakramLightShadowSignature : '',
                takramSignatureReason: self && self._pmndrsTakramLightShadowSignatureReason ? self._pmndrsTakramLightShadowSignatureReason : '',
                presentedShadowTransforms: self && self._vrodosPresentedShadowTransformCount ? self._vrodosPresentedShadowTransformCount : 0,
                presentedShadowBaseCaptures: self && self._vrodosPresentedShadowBaseCaptureCount ? self._vrodosPresentedShadowBaseCaptureCount : 0,
                presentedShadowLastNavigationTransformCount: self && typeof self._vrodosPresentedShadowLastNavigationTransformCount === 'number'
                    ? self._vrodosPresentedShadowLastNavigationTransformCount
                    : null,
                shadowLights: []
            };

            if (!sceneObj) {
                return state;
            }

            const renderer = self && self.el ? self.el.renderer : null;
            if (renderer && renderer.shadowMap) {
                state.autoUpdate = renderer.shadowMap.autoUpdate;
                state.needsUpdate = renderer.shadowMap.needsUpdate;
                state.type = renderer.shadowMap.type;
                state.typeName = getThreeShadowMapTypeName(renderer.shadowMap.type);
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
                    state.shadowLights.push(getShadowLightDiagnostic(node));
                }
            });

            state.fitted = self && self._vrodosShadowFitLastMs ? 'yes' : 'pending';
            return state;
        }

        function getShadowUpdateMode(self) {
            if (hasPmndrsDebugFlag('dynamicShadows', 'vrodos_debug_dynamic_shadows')) {
                return 'dynamic';
            }

            const value = self && self.data ? String(self.data.shadowUpdateMode || 'static').toLowerCase() : 'static';
            return value === 'dynamic' ? 'dynamic' : 'static';
        }

        function isStaticShadowMode(self) {
            if (!self || !self.el) {
                return false;
            }

            const shadowQuality = typeof self.getEffectiveShadowQuality === 'function'
                ? self.getEffectiveShadowQuality()
                : (self.data && self.data.shadowQuality ? self.data.shadowQuality : 'medium');

            if (shadowQuality === 'off') {
                return false;
            }

            if (isPmndrsDayNightCycleEnabled(self) &&
                !hasPmndrsDebugFlag('disablePmndrsDayNightCycleDynamicShadows', 'vrodos_debug_disable_day_night_dynamic_shadows')) {
                return false;
            }

            return getShadowUpdateMode(self) === 'static';
        }

        function getNavigationShadowRefreshEligibility(self, options) {
            const opts = options || {};
            let presentationMode = typeof opts.presentationMode === 'string' && opts.presentationMode
                ? opts.presentationMode
                : '';

            if (!presentationMode && self && typeof self.getPresentationMode === 'function') {
                presentationMode = self.getPresentationMode();
            }
            if (!presentationMode) {
                presentationMode = 'inline';
            }

            if (!self || !self.el || !self.el.camera) {
                return { allowed: false, skippedReason: 'scene-not-ready', presentationMode };
            }

            const shadowQuality = typeof self.getEffectiveShadowQuality === 'function'
                ? self.getEffectiveShadowQuality()
                : (self.data && self.data.shadowQuality ? self.data.shadowQuality : 'medium');
            if (shadowQuality === 'off') {
                return { allowed: false, skippedReason: 'shadows-off', presentationMode };
            }

            if (!isStaticShadowMode(self)) {
                return { allowed: false, skippedReason: 'dynamic-shadow-mode', presentationMode };
            }

            if (presentationMode === 'immersive-xr' ||
                (typeof self.isImmersiveXrActive === 'function' && self.isImmersiveXrActive()) ||
                (typeof self.isDirectVrPresentationActive === 'function' && self.isDirectVrPresentationActive())) {
                return { allowed: false, skippedReason: 'immersive-xr', presentationMode };
            }

            if (presentationMode !== 'desktop-fullscreen') {
                return { allowed: false, skippedReason: 'presentation-mode', presentationMode };
            }

            return { allowed: true, skippedReason: '', presentationMode };
        }

        function recordNavigationShadowRefreshSkip(self, skippedReason, eligibility) {
            if (!self) {
                return;
            }

            self._vrodosNavigationShadowRefreshLastSkippedReason = skippedReason || 'skipped';
            self._vrodosNavigationShadowRefreshLastPresentationMode = eligibility && eligibility.presentationMode
                ? eligibility.presentationMode
                : null;
            updateShadowPerfDebugOverlay(self);
        }

        function clearNavigationShadowRefreshSettleTimer(self) {
            if (!self || !self._vrodosNavigationShadowRefreshSettleTimer) {
                return;
            }

            const timer = self._vrodosNavigationShadowRefreshSettleTimer;
            self._vrodosNavigationShadowRefreshSettleTimer = null;
            if (typeof window !== 'undefined' && typeof window.clearTimeout === 'function') {
                window.clearTimeout(timer);
            } else if (typeof clearTimeout === 'function') {
                clearTimeout(timer);
            }
        }

        function scheduleNavigationShadowRefreshSettle(self, refreshReason, options) {
            const opts = options || {};
            const settleMs = Number(opts.settleMs);
            if (!Number.isFinite(settleMs) || settleMs <= 0) {
                return;
            }

            const eligibility = getNavigationShadowRefreshEligibility(self, opts);
            if (!eligibility.allowed) {
                clearNavigationShadowRefreshSettleTimer(self);
                return;
            }

            clearNavigationShadowRefreshSettleTimer(self);
            const setTimer = typeof window !== 'undefined' && typeof window.setTimeout === 'function'
                ? window.setTimeout.bind(window)
                : (typeof setTimeout === 'function' ? setTimeout : null);
            if (!setTimer) {
                return;
            }

            self._vrodosNavigationShadowRefreshSettleTimer = setTimer(() => {
                self._vrodosNavigationShadowRefreshSettleTimer = null;
                applyNavigationShadowRefresh(self, `${refreshReason || 'navigation-shadow-camera'}-settle`, Object.assign({}, opts, {
                    force: true,
                    settleMs: 0
                }));
            }, settleMs);
        }

        function applyNavigationShadowRefresh(self, reason, options) {
            const refreshReason = reason || 'navigation-shadow-camera';
            const opts = options || {};
            const eligibility = getNavigationShadowRefreshEligibility(self, opts);
            if (!eligibility.allowed) {
                recordNavigationShadowRefreshSkip(self, eligibility.skippedReason, eligibility);
                return false;
            }

            let force = opts.force === true;
            const now = getRuntimeNowMs();
            const throttleMs = Number.isFinite(Number(opts.throttleMs))
                ? Math.max(0, Number(opts.throttleMs))
                : 90;

            if (!force &&
                self._vrodosNavigationShadowRefreshLastAppliedMs &&
                (now - self._vrodosNavigationShadowRefreshLastAppliedMs) < throttleMs) {
                recordNavigationShadowRefreshSkip(self, 'throttled', eligibility);
                return false;
            }

            if (!self._vrodosNavigationShadowRefreshCameraPosition) {
                self._vrodosNavigationShadowRefreshCameraPosition = new THREE.Vector3();
                self._vrodosNavigationShadowRefreshCurrentCameraPosition = new THREE.Vector3();
                force = true;
            }

            self.el.camera.getWorldPosition(self._vrodosNavigationShadowRefreshCurrentCameraPosition);
            const distanceSq = self._vrodosNavigationShadowRefreshCurrentCameraPosition.distanceToSquared(self._vrodosNavigationShadowRefreshCameraPosition);
            const minDistance = Number.isFinite(Number(opts.minDistance))
                ? Math.max(0, Number(opts.minDistance))
                : 0.35;

            self._vrodosNavigationShadowRefreshLastDistance = Math.sqrt(distanceSq);
            if (!force && minDistance > 0 && distanceSq < (minDistance * minDistance)) {
                recordNavigationShadowRefreshSkip(self, 'distance', eligibility);
                return false;
            }

            self._vrodosNavigationShadowRefreshCameraPosition.copy(self._vrodosNavigationShadowRefreshCurrentCameraPosition);
            if (!self._vrodosShadowFitCameraPosition) {
                self._vrodosShadowFitCameraPosition = new THREE.Vector3();
                self._vrodosShadowFitCurrentCameraPosition = new THREE.Vector3();
            }
            self._vrodosShadowFitCameraPosition.copy(self._vrodosNavigationShadowRefreshCurrentCameraPosition);
            self._vrodosShadowFitCurrentCameraPosition.copy(self._vrodosNavigationShadowRefreshCurrentCameraPosition);

            applyAdaptiveShadowFit(self);
            if (typeof self.markShadowDirty === 'function') {
                self.markShadowDirty(refreshReason);
            }

            self._vrodosNavigationShadowRefreshApplied = (self._vrodosNavigationShadowRefreshApplied || 0) + 1;
            self._vrodosNavigationShadowRefreshLastReason = refreshReason;
            self._vrodosNavigationShadowRefreshLastSkippedReason = '';
            self._vrodosNavigationShadowRefreshLastPresentationMode = eligibility.presentationMode;
            self._vrodosNavigationShadowRefreshLastAppliedMs = now;
            updateShadowPerfDebugOverlay(self);
            return true;
        }

        function markAllShadowLightsDirty(self) {
            const sceneObj = self && self.el ? self.el.object3D : null;
            if (!sceneObj) {
                return;
            }

            sceneObj.traverse((node) => {
                if ((node.isDirectionalLight || node.isSpotLight || node.isPointLight) && node.shadow) {
                    node.shadow.needsUpdate = true;
                }
            });
        }

        function markShadowProgramMaterialsDirty(self) {
            const sceneObj = self && self.el ? self.el.object3D : null;
            if (!sceneObj) {
                return;
            }

            sceneObj.traverse((node) => {
                if (!node || !node.material) {
                    return;
                }

                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach((material) => {
                    if (material) {
                        material.needsUpdate = true;
                    }
                });
            });
        }

        function syncShadowProgramMaterialsForType(self, shadowMapType, reason, force) {
            if (!self || typeof shadowMapType === 'undefined' || shadowMapType === null) {
                return false;
            }

            if (!force && self._vrodosShadowProgramShadowMapType === shadowMapType) {
                return false;
            }

            self._vrodosShadowProgramShadowMapType = shadowMapType;
            self._vrodosShadowProgramRefreshes = (self._vrodosShadowProgramRefreshes || 0) + 1;
            self._vrodosShadowLastProgramRefreshReason = reason || 'shadow-map-type';
            self._vrodosShadowLastProgramRefreshType = getThreeShadowMapTypeName(shadowMapType);
            markShadowProgramMaterialsDirty(self);
            return true;
        }

        function refreshShadowMapResourcesForType(self, shadowMapType, force, reason) {
            const sceneObj = self && self.el ? self.el.object3D : null;
            if (!sceneObj) {
                return false;
            }

            let refreshed = false;
            sceneObj.traverse((node) => {
                if (!node || !(node.isDirectionalLight || node.isSpotLight || node.isPointLight) || !node.shadow) {
                    return;
                }
                if (force || !isLightShadowMapCompatibleWithType(node.shadow, shadowMapType)) {
                    refreshed = disposeLightShadowMap(node.shadow) || refreshed;
                }
                node.shadow.needsUpdate = true;
            });

            if (refreshed || force) {
                if (self) {
                    self._vrodosShadowCompatibilityRefreshes = (self._vrodosShadowCompatibilityRefreshes || 0) + 1;
                    self._vrodosShadowLastCompatibilityRefreshReason = reason || (force ? 'forced' : 'incompatible');
                    self._vrodosShadowLastCompatibilityRefreshType = getThreeShadowMapTypeName(shadowMapType);
                }
                markShadowProgramMaterialsDirty(self);
            }

            return refreshed;
        }

        function shadowPerfDebugEnabled() {
            return hasPmndrsDebugFlag('shadowPerf', 'vrodos_debug_shadow_perf');
        }

        function ensureShadowPerfDebugOverlay(self) {
            if (!shadowPerfDebugEnabled() || typeof document === 'undefined') {
                return null;
            }

            if (self._vrodosShadowPerfOverlay && self._vrodosShadowPerfOverlay.parentNode) {
                return self._vrodosShadowPerfOverlay;
            }

            const overlay = document.createElement('pre');
            overlay.id = 'vrodos-shadow-perf-debug';
            overlay.style.position = 'fixed';
            overlay.style.right = '16px';
            overlay.style.bottom = '16px';
            overlay.style.zIndex = '9999';
            overlay.style.margin = '0';
            overlay.style.padding = '10px 12px';
            overlay.style.maxWidth = '360px';
            overlay.style.maxHeight = '40vh';
            overlay.style.overflow = 'auto';
            overlay.style.background = 'rgba(15, 23, 42, 0.86)';
            overlay.style.color = '#e2e8f0';
            overlay.style.font = '12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
            overlay.style.border = '1px solid rgba(148, 163, 184, 0.35)';
            overlay.style.borderRadius = '8px';
            overlay.style.pointerEvents = 'none';

            document.body.appendChild(overlay);
            self._vrodosShadowPerfOverlay = overlay;
            return overlay;
        }

        function updateShadowPerfDebugOverlay(self) {
            const overlay = ensureShadowPerfDebugOverlay(self);
            if (!overlay) {
                return;
            }

            const state = getShadowDiagnosticState(self);
            overlay.textContent = [
                'VRodos shadow perf',
                `mode: ${state.mode}`,
                `type: ${state.typeName || state.type}`,
                `autoUpdate: ${state.autoUpdate}`,
                `needsUpdate: ${state.needsUpdate}`,
                `updates: ${state.updateCount}`,
                `dirty requests: ${state.dirtyRequests}`,
                `last reason: ${state.lastDirtyReason || 'none'}`,
                `last update: ${state.lastUpdateReason || 'none'}`,
                `navigation refresh: ${state.navigationRefreshApplied}/${state.navigationRefreshRequests}`,
                `navigation refresh reason: ${state.navigationRefreshLastReason || 'none'}`,
                `navigation refresh skip: ${state.navigationRefreshLastSkippedReason || 'none'}`,
                `navigation refresh mode: ${state.navigationRefreshLastPresentationMode || 'none'}`,
                `takram signature: ${state.takramSignature || 'none'}`,
                `presented shadow transforms: ${state.presentedShadowTransforms}`,
                `presented shadow nav transform: ${state.presentedShadowLastNavigationTransformCount === null ? 'none' : state.presentedShadowLastNavigationTransformCount}`,
                `casters: ${state.casters}`,
                `receivers: ${state.receivers}`,
                `receiver-only: ${state.receiverOnly}`,
                `dir shadow lights: ${state.dirShadowLights}/${state.dirLights}`,
                `fit: ${state.fittedDirLights} ${state.fitted}`
            ].join('\n');
        }

        function capturePresentedShadowLightBase(self, light, options) {
            if (!light || !light.position || !light.target || !light.target.position) {
                return false;
            }

            const opts = options || {};
            const navigation = getImmersiveNavigationForPresentedTransforms();
            light.userData = light.userData || {};
            light.userData.vrodosPresentedShadowBasePosition = light.userData.vrodosPresentedShadowBasePosition || new THREE.Vector3();
            light.userData.vrodosPresentedShadowBaseTarget = light.userData.vrodosPresentedShadowBaseTarget || new THREE.Vector3();

            if (navigation && opts.assumeAuthored !== true) {
                navigation.renderedToAuthoredPosition(light.position, light.userData.vrodosPresentedShadowBasePosition);
                navigation.renderedToAuthoredPosition(light.target.position, light.userData.vrodosPresentedShadowBaseTarget);
            } else {
                light.userData.vrodosPresentedShadowBasePosition.copy(light.position);
                light.userData.vrodosPresentedShadowBaseTarget.copy(light.target.position);
            }

            light.userData.vrodosPresentedShadowBaseCaptured = true;
            if (self) {
                self._vrodosPresentedShadowBaseCaptureCount = (self._vrodosPresentedShadowBaseCaptureCount || 0) + 1;
            }
            return true;
        }

        function syncPresentedShadowLightTransforms(self) {
            const navigation = getImmersiveNavigationForPresentedTransforms();
            if (!self || !navigation) {
                return false;
            }

            const transformCount = typeof navigation.immersiveRootTransformCount === 'number'
                ? navigation.immersiveRootTransformCount
                : 0;
            let changed = false;
            collectDirectionalShadowLights(self).forEach((light) => {
                if (!light || !light.target || !light.userData) {
                    return;
                }

                if (
                    navigation.immersiveNavigationStrategy === 'authored-world-container' &&
                    typeof navigation.isObjectInsideImmersiveAuthoredWorld === 'function' &&
                    navigation.isObjectInsideImmersiveAuthoredWorld(light)
                ) {
                    return;
                }

                if (!light.userData.vrodosPresentedShadowBaseCaptured) {
                    capturePresentedShadowLightBase(self, light, { assumeAuthored: true });
                }

                const basePosition = light.userData.vrodosPresentedShadowBasePosition;
                const baseTarget = light.userData.vrodosPresentedShadowBaseTarget;
                if (!basePosition || !baseTarget) {
                    return;
                }

                if (light.userData.vrodosPresentedShadowLastTransformCount === transformCount) {
                    return;
                }

                navigation.authoredToRenderedPosition(basePosition, light.position);
                navigation.authoredToRenderedPosition(baseTarget, light.target.position);
                light.target.updateMatrixWorld(true);
                light.updateMatrixWorld(true);
                if (light.shadow && typeof light.shadow.updateMatrices === 'function') {
                    light.shadow.updateMatrices(light);
                }
                light.userData.vrodosPresentedShadowLastTransformCount = transformCount;
                changed = true;
            });

            if (changed) {
                self._vrodosPresentedShadowTransformCount = (self._vrodosPresentedShadowTransformCount || 0) + 1;
                self._vrodosPresentedShadowLastNavigationTransformCount = transformCount;
            }
            return changed;
        }

        H.getShadowUpdateMode = function () {
            return getShadowUpdateMode(this);
        };

        H.isStaticShadowMode = function () {
            return isStaticShadowMode(this);
        };

        H.getShadowDiagnosticState = function () {
            return getShadowDiagnosticState(this);
        };

        H.syncPresentedShadowLightTransforms = function () {
            return syncPresentedShadowLightTransforms(this);
        };

        H.requestNavigationShadowRefresh = function (reason, options) {
            if (!this || !this.el) {
                return false;
            }

            const refreshReason = reason || 'navigation-shadow-camera';
            this._vrodosNavigationShadowRefreshRequests = (this._vrodosNavigationShadowRefreshRequests || 0) + 1;
            const applied = applyNavigationShadowRefresh(this, refreshReason, options || {});
            scheduleNavigationShadowRefreshSettle(this, refreshReason, options || {});
            return applied;
        };

        H.clearNavigationShadowRefreshSettleTimer = function () {
            clearNavigationShadowRefreshSettleTimer(this);
        };

        H.markShadowDirty = function (reason) {
            if (!this || !this.el) {
                return;
            }

            const shadowQuality = typeof this.getEffectiveShadowQuality === 'function'
                ? this.getEffectiveShadowQuality()
                : (this.data && this.data.shadowQuality ? this.data.shadowQuality : 'medium');
            if (shadowQuality === 'off') {
                return;
            }

            const dirtyReason = reason || 'manual';
            this._vrodosShadowDirty = true;
            this._vrodosShadowDirtyReason = dirtyReason;
            this._vrodosShadowDirtyRequests = (this._vrodosShadowDirtyRequests || 0) + 1;
            if (this.el && typeof this.el.setAttribute === 'function') {
                this.el.setAttribute('data-vrodos-shadow-dirty-source', dirtyReason);
            }

            if (this._vrodosShadowFlushHandle) {
                updateShadowPerfDebugOverlay(this);
                return;
            }

            const flush = () => {
                this._vrodosShadowFlushHandle = null;
                if (typeof this.flushShadowUpdate === 'function') {
                    this.flushShadowUpdate();
                }
            };

            this._vrodosShadowFlushHandle = typeof requestAnimationFrame === 'function'
                ? requestAnimationFrame(flush)
                : setTimeout(flush, 16);
            updateShadowPerfDebugOverlay(this);
        };

        H.flushShadowUpdate = function () {
            if (!this || !this.el) {
                return;
            }

            const renderer = this.el.renderer;
            const shadowQuality = typeof this.getEffectiveShadowQuality === 'function'
                ? this.getEffectiveShadowQuality()
                : (this.data && this.data.shadowQuality ? this.data.shadowQuality : 'medium');
            if (!renderer || !renderer.shadowMap || shadowQuality === 'off') {
                return;
            }

            const staticMode = isStaticShadowMode(this);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.autoUpdate = !staticMode;
            const shadowProgramsRefreshed = syncShadowProgramMaterialsForType(this, renderer.shadowMap.type, 'shadow-flush', false);
            const shadowResourcesRefreshed = refreshShadowMapResourcesForType(this, renderer.shadowMap.type, false, 'shadow-flush');
            if ((shadowProgramsRefreshed || shadowResourcesRefreshed) && renderer.shadowMap) {
                renderer.shadowMap.needsUpdate = true;
            }
            renderer.shadowMap.needsUpdate = true;
            markAllShadowLightsDirty(this);

            this._vrodosShadowDirty = false;
            this._vrodosShadowUpdateCount = (this._vrodosShadowUpdateCount || 0) + 1;
            this._vrodosShadowLastUpdateReason = this._vrodosShadowDirtyReason || 'manual';
            this._vrodosShadowLastUpdateMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
            updateShadowPerfDebugOverlay(this);
        };

        H.syncStaticShadowMode = function (reason) {
            if (!this || !this.el || !this.el.renderer || !this.el.renderer.shadowMap) {
                return;
            }

            const shadowQuality = typeof this.getEffectiveShadowQuality === 'function'
                ? this.getEffectiveShadowQuality()
                : (this.data && this.data.shadowQuality ? this.data.shadowQuality : 'medium');
            const shadowsEnabled = shadowQuality !== 'off';
            const staticMode = shadowsEnabled && isStaticShadowMode(this);

            this.el.renderer.shadowMap.autoUpdate = shadowsEnabled && !staticMode;
            if (shadowsEnabled && staticMode) {
                this.markShadowDirty(reason || 'static-shadow-sync');
            }
            updateShadowPerfDebugOverlay(this);
        };

        H.applyShadowQualityProfile = function () {
            const renderer = this.el.renderer;
            const shadowQuality = typeof this.getEffectiveShadowQuality === 'function'
                ? this.getEffectiveShadowQuality()
                : (this.data.shadowQuality || 'medium');
            const shadowsEnabled = shadowQuality !== 'off';
            const contactShadowSettings = getTerrainSafeContactShadowSettings(this, this.getContactShadowSettings());
            const profileShadowType = 'pcf';
            const useDayNightPcf = shadowsEnabled && shouldUseDayNightPcfShadowMap(this);
            const shadowTypeAttr = shadowsEnabled
                ? (useDayNightPcf ? 'pcf' : normalizeAFrameShadowMapType(this.data.rootShadowType, profileShadowType))
                : 'pcf';
            this._vrodosShadowMapTypeReason = shadowsEnabled
                ? (useDayNightPcf ? 'day-night-pcf' : 'profile')
                : 'disabled';
            const runtimeShadowTypeAttr = shadowTypeAttr;
            const aframeShadowTypeAttr = getAFrameShadowComponentType(runtimeShadowTypeAttr);
            const shadowMapType = getThreeShadowMapType(runtimeShadowTypeAttr);
            const staticShadowMode = shadowsEnabled && isStaticShadowMode(this);
            const previousShadowMapType = renderer && renderer.shadowMap ? renderer.shadowMap.type : null;
            const shadowMapTypeChanged = previousShadowMapType !== null && previousShadowMapType !== shadowMapType;

            if (this.el && typeof this.el.setAttribute === 'function') {
                const currentShadow = this.el.getAttribute('shadow') || {};
                const currentEnabled = currentShadow.enabled === true || currentShadow.enabled === 'true';
                const currentType = typeof currentShadow.type === 'string' ? currentShadow.type.toLowerCase() : '';
                const currentAutoUpdate = currentShadow.autoUpdate === true || currentShadow.autoUpdate === 'true';
                const targetAutoUpdate = shadowsEnabled && !staticShadowMode;
                if (currentEnabled !== shadowsEnabled || currentType !== aframeShadowTypeAttr || currentAutoUpdate !== targetAutoUpdate) {
                    this.el.setAttribute('shadow', `enabled: ${shadowsEnabled ? 'true' : 'false'}; type: ${aframeShadowTypeAttr}; autoUpdate: ${targetAutoUpdate ? 'true' : 'false'}`);
                }
            }

            if (renderer && renderer.shadowMap) {
                renderer.shadowMap.enabled = shadowsEnabled;
                renderer.shadowMap.type = shadowMapType;
                renderer.shadowMap.autoUpdate = shadowsEnabled && !staticShadowMode;
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
                        syncTerrainShadowDepthMaterial(this, node, false);
                        return;
                    }

                    const shadowRole = getObjectShadowRole(node);
                    node.castShadow = shadowsEnabled && shadowRole !== 'receiver' && shadowRole !== 'none';
                    node.receiveShadow = shadowsEnabled && shadowRole !== 'none';
                    syncTerrainShadowDepthMaterial(this, node, node.castShadow && isTerrainSelfShadowCasterMesh(node));
                }

                if (node.isDirectionalLight || node.isSpotLight || node.isPointLight) {
                    node.userData = node.userData || {};
                    const isPhotorealHelperLight = isVrodosPhotorealHelperLight(node);
                    const isVrodosManagedLight = isVrodosManagedShadowLight(node);
                    const previousCastShadow = node.castShadow === true;
                    if (typeof node.userData.vrodosAuthoredCastShadow === 'undefined') {
                        node.userData.vrodosAuthoredCastShadow = node.castShadow === true;
                    }
                    node.castShadow = shadowsEnabled &&
                        !isPhotorealHelperLight &&
                        (isVrodosManagedLight || node.userData.vrodosAuthoredCastShadow === true);

                    if (!node.shadow) {
                        return;
                    }

                    if (node.castShadow) {
                        const targetMapSize = shadowQuality === 'high'
                            ? (node.isDirectionalLight ? 2048 : 1024)
                            : (node.isDirectionalLight ? 1024 : 512);

                        if (node.shadow.mapSize) {
                            const headsetShadowCap = typeof this.isVrRuntimeHeadsetProfile === 'function' && this.isVrRuntimeHeadsetProfile();
                            if (headsetShadowCap) {
                                const needsShrink = (node.shadow.mapSize.x || 0) > targetMapSize || (node.shadow.mapSize.y || 0) > targetMapSize;
                                node.shadow.mapSize.x = targetMapSize;
                                node.shadow.mapSize.y = targetMapSize;
                                if (needsShrink && node.shadow.map && typeof node.shadow.map.dispose === 'function') {
                                    node.shadow.map.dispose();
                                    node.shadow.map = null;
                                }
                            } else {
                                node.shadow.mapSize.x = Math.max(node.shadow.mapSize.x || 0, targetMapSize);
                                node.shadow.mapSize.y = Math.max(node.shadow.mapSize.y || 0, targetMapSize);
                            }
                        }

                        if (typeof node.userData.vrodosBaseShadowBias === 'undefined') {
                            node.userData.vrodosBaseShadowBias = (typeof node.shadow.bias === 'number') ? node.shadow.bias : 0;
                        }

                        if (typeof node.userData.vrodosBaseShadowNormalBias === 'undefined') {
                            node.userData.vrodosBaseShadowNormalBias = (typeof node.shadow.normalBias === 'number') ? node.shadow.normalBias : 0;
                        }

                        const managedShadowBias = shadowQuality === 'high' ? 0.00004 : 0.00008;
                        const managedNormalBias = shadowQuality === 'high' ? 0.045 : 0.065;
                        const managedContactShadowBias = typeof contactShadowSettings.bias === 'number' ? contactShadowSettings.bias : managedShadowBias;
                        const managedContactShadowNormalBias = typeof contactShadowSettings.normalBias === 'number' ? contactShadowSettings.normalBias : managedNormalBias;

                        if (typeof node.shadow.bias !== 'undefined') {
                            node.shadow.bias = isVrodosManagedLight
                                ? managedContactShadowBias
                                : (node.userData.vrodosBaseShadowBias !== 0 ? node.userData.vrodosBaseShadowBias : contactShadowSettings.bias);
                        }

                        if (typeof node.shadow.normalBias !== 'undefined') {
                            node.shadow.normalBias = isVrodosManagedLight
                                ? managedContactShadowNormalBias
                                : (node.userData.vrodosBaseShadowNormalBias !== 0 ? node.userData.vrodosBaseShadowNormalBias : contactShadowSettings.normalBias);
                        }

                        if (isVrodosManagedLight && node.isDirectionalLight && typeof node.shadow.radius !== 'undefined') {
                            node.shadow.radius = getPmndrsDayNightShadowRadius(this);
                        }
                    }

                    node.shadow.needsUpdate = node.castShadow || previousCastShadow !== node.castShadow;
                }
            });

            if (shadowsEnabled) {
                const shadowRefreshReason = shadowMapTypeChanged ? 'shadow-type-change' : 'shadow-profile';
                const shadowProgramsRefreshed = syncShadowProgramMaterialsForType(this, shadowMapType, shadowRefreshReason, shadowMapTypeChanged);
                const shadowResourcesRefreshed = refreshShadowMapResourcesForType(this, shadowMapType, shadowMapTypeChanged, shadowRefreshReason);
                if ((shadowProgramsRefreshed || shadowResourcesRefreshed) && renderer && renderer.shadowMap) {
                    renderer.shadowMap.needsUpdate = true;
                }
                applyAdaptiveShadowFit(this);
                if (typeof this.syncStaticShadowMode === 'function') {
                    this.syncStaticShadowMode('shadow-profile');
                }
            } else if (renderer && renderer.shadowMap) {
                renderer.shadowMap.autoUpdate = false;
            }
            updateShadowPerfDebugOverlay(this);
        };

        H.updateAdaptiveShadowFit = function (force) {
            if (!this ||
                !this.el ||
                !this.el.camera ||
                (typeof this.getEffectiveShadowQuality === 'function' ? this.getEffectiveShadowQuality() : this.data.shadowQuality) === 'off') {
                return;
            }

            if (!force && isStaticShadowMode(this)) {
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
            if (typeof this.markShadowDirty === 'function') {
                this.markShadowDirty(force ? 'adaptive-shadow-force' : 'adaptive-shadow-camera');
            }
        };

        return {
            helpers: H,
            getPmndrsDayNightShadowRadius,
            objectEntityChainHas,
            isFlatMediaShadowEntity,
            getEntityShadowRole,
            getObjectShadowRole,
            isShadowEligibleMaterial,
            isHiddenNavmeshMaterial,
            isWorldLightingParticipantMesh,
            getTerrainSafeContactShadowSettings,
            getDirectionalShadowDistanceForScene,
            getAdaptiveShadowCenter,
            schedulePmndrsAtmosphereShadowFit,
            arePmndrsDayNightCycleDynamicShadowsEnabled,
            sanitizePhotorealHelperLightAttributes,
            isPmndrsTakramHorizonRequested,
            vectorToRoundedArray,
            vectorToSignature,
            getShadowDiagnosticState,
            syncPresentedShadowLightTransforms
        };
    }
})();
