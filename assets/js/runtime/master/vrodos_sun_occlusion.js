/** Scene geometry occlusion of the visible sun, haze, and lens flare.
 * Raycast caches and lifecycle state remain on the existing scene component.
 */
(function () {
    VRODOSMaster.SunOcclusion = Object.freeze({ create });

    function create({ shadow, setPmndrsSkyMaterialNativeSun }) {
        const {
            objectEntityChainHas,
            isWorldLightingParticipantMesh,
            isShadowEligibleMaterial
        } = shadow;

        function isPmndrsSunOccluderMesh(node) {
            if (!node || !node.isMesh || !node.visible) {
                return false;
            }
            let current = node.parent;
            while (current) {
                if (current.visible === false) {
                    return false;
                }
                current = current.parent || null;
            }
            if (node.userData && (node.userData.vrodosPmndrsAtmosphereSky || node.userData.vrodosPmndrsTakramLightSource)) {
                return false;
            }
            if (objectEntityChainHas(node, (entityEl) => (
                entityEl.hasAttribute('data-vrodos-pmndrs-sun') ||
                entityEl.hasAttribute('data-vrodos-overlay-ui') ||
                entityEl.hasAttribute('data-vrodos-collision-hidden') ||
                entityEl.hasAttribute('vrodos-collider-helper')
            ))) {
                return false;
            }
            if (!isWorldLightingParticipantMesh(node)) {
                return false;
            }
            return isShadowEligibleMaterial(node.material);
        }

        function getPmndrsSunOccluderTriangleCount(node) {
            const geometry = node && node.geometry ? node.geometry : null;
            if (!geometry) {
                return 0;
            }

            if (geometry.index && typeof geometry.index.count === 'number') {
                return Math.floor(geometry.index.count / 3);
            }

            const position = geometry.attributes ? geometry.attributes.position : null;
            return position && typeof position.count === 'number' ? Math.floor(position.count / 3) : 0;
        }

        function refreshPmndrsSunOccluderCache(self) {
            if (!self || !self.el || !self.el.object3D) {
                return [];
            }

            const now = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
            if (Array.isArray(self._pmndrsSunOcclusionTargets) && self._pmndrsSunOcclusionTargetsLastMs && (now - self._pmndrsSunOcclusionTargetsLastMs) < 2500) {
                return self._pmndrsSunOcclusionTargets;
            }

            const targets = [];
            self.el.object3D.traverse((node) => {
                if (!isPmndrsSunOccluderMesh(node) || !node.geometry) {
                    return;
                }

                if (!node.geometry.boundingBox && typeof node.geometry.computeBoundingBox === 'function') {
                    node.geometry.computeBoundingBox();
                }

                if (!node.geometry.boundingBox) {
                    return;
                }

                const triangleCount = getPmndrsSunOccluderTriangleCount(node);
                targets.push({
                    node,
                    triangleCount,
                    precise: triangleCount <= 60000 || Boolean(node.geometry.boundsTree)
                });
            });

            self._pmndrsSunOcclusionTargets = targets;
            self._pmndrsSunOcclusionTargetsLastMs = now;
            return targets;
        }

        function computePmndrsSunOcclusionFactor(self, sunDirection, maxDistance) {
            if (!self || !self.el || !self.el.object3D || !self.el.camera || !sunDirection || sunDirection.lengthSq() < 0.0001 || typeof THREE.Raycaster !== 'function') {
                return 1;
            }

            const now = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
            if (self._pmndrsSunOcclusionLastMs && (now - self._pmndrsSunOcclusionLastMs) < 300 && typeof self._pmndrsSunOcclusionFactor === 'number') {
                return self._pmndrsSunOcclusionFactor;
            }

            if (!self._pmndrsSunOcclusionRaycaster) {
                self._pmndrsSunOcclusionRaycaster = new THREE.Raycaster();
                self._pmndrsSunOcclusionOrigin = new THREE.Vector3();
                self._pmndrsSunOcclusionDirection = new THREE.Vector3();
                self._pmndrsSunOcclusionWorldBox = new THREE.Box3();
                self._pmndrsSunOcclusionHits = [];
            }

            const origin = self._pmndrsSunOcclusionOrigin;
            const direction = self._pmndrsSunOcclusionDirection.copy(sunDirection).normalize();
            self.el.camera.getWorldPosition(origin);
            origin.addScaledVector(direction, 0.5);

            const far = Math.max(10, Math.min(Number.isFinite(Number(maxDistance)) ? Number(maxDistance) : 5200, 20000));
            const raycaster = self._pmndrsSunOcclusionRaycaster;
            raycaster.set(origin, direction);
            raycaster.near = 0.1;
            raycaster.far = far;
            raycaster.firstHitOnly = true;

            const targets = refreshPmndrsSunOccluderCache(self);
            let factor = 1;
            for (let i = 0; i < targets.length; i++) {
                const target = targets[i];
                const node = target.node;
                if (!node || !node.geometry || !node.geometry.boundingBox) {
                    continue;
                }

                self._pmndrsSunOcclusionWorldBox.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld);
                if (!raycaster.ray.intersectsBox(self._pmndrsSunOcclusionWorldBox)) {
                    continue;
                }

                if (!target.precise) {
                    continue;
                }

                self._pmndrsSunOcclusionHits.length = 0;
                raycaster.intersectObject(node, false, self._pmndrsSunOcclusionHits);
                if (self._pmndrsSunOcclusionHits.some((hit) => hit && hit.distance > 0.1 && hit.distance < far * 0.985)) {
                    factor = 0;
                    break;
                }
            }

            self._pmndrsSunOcclusionFactor = factor;
            self._pmndrsSunOcclusionLastMs = now;
            return factor;
        }

        function applyPmndrsSunOcclusion(self, sunDirection, maxDistance) {
            const factor = computePmndrsSunOcclusionFactor(self, sunDirection, maxDistance);
            const state = self && self._pmndrsAtmosphereState ? self._pmndrsAtmosphereState : null;
            if (state && state.skyMaterial && typeof state.skyMaterial.sun !== 'undefined') {
                const cloudSpriteOwnsSunDisk = Boolean(self && self._pmndrsCloudSunDiskSpriteActive === true);
                const cloudPhaseHidesNativeSunDisk = Boolean(self && self._pmndrsCloudSunDiskTakramPhaseNativeHidden === true);
                const shouldShowSkySun = !cloudSpriteOwnsSunDisk && !cloudPhaseHidesNativeSunDisk && factor > 0.01;
                setPmndrsSkyMaterialNativeSun(self, shouldShowSkySun);
            }

            const sunEl = typeof document !== 'undefined' ? document.getElementById('vrodos-pmndrs-sun') : null;
            if (sunEl && sunEl.object3D) {
                sunEl.object3D.visible = factor > 0.01;
            }
            const hazeEl = typeof document !== 'undefined' ? document.getElementById('vrodos-pmndrs-sun-haze') : null;
            if (hazeEl && hazeEl.object3D) {
                hazeEl.object3D.visible = factor > 0.01;
            }

            if (self && self.pmndrsLensFlareEffect && typeof self.pmndrsLensFlareEffect.intensity === 'number') {
                const baseIntensity = typeof self.pmndrsLensFlareEffect._vrodosBaseIntensity === 'number'
                    ? self.pmndrsLensFlareEffect._vrodosBaseIntensity
                    : (typeof self._pmndrsLensFlareBaseIntensity === 'number' && self._pmndrsLensFlareBaseIntensity > 0
                        ? self._pmndrsLensFlareBaseIntensity
                        : (self.pmndrsLensFlareEffect.intensity || 0.005));
                self.pmndrsLensFlareEffect._vrodosBaseIntensity = baseIntensity;
                self._pmndrsLensFlareBaseIntensity = baseIntensity;
                self._pmndrsLensFlareSceneOcclusionFactor = factor;
                const cloudFactor = typeof self._pmndrsLensFlareCloudFactor === 'number'
                    ? self._pmndrsLensFlareCloudFactor
                    : 1;
                self.pmndrsLensFlareEffect.intensity = baseIntensity * factor * cloudFactor;
            }

            return factor;
        }

        return { apply: applyPmndrsSunOcclusion };
    }
})();
