/** Renderer quality, material enhancement, and reflection intensity policy.
 * State and lifecycle remain on the existing scene component.
 */
/* global vrodosEnhanceMeshMaterial, vrodosGetExplicitMaterialOverrides */
(function () {
    VRODOSMaster.RenderQuality = Object.freeze({ create });

    function create({ shadow, lighting, host }) {
        const H = {};
        const {
            objectEntityChainHas,
            isFlatMediaShadowEntity,
            getEntityShadowRole,
            getObjectShadowRole,
            isHiddenNavmeshMaterial,
            isWorldLightingParticipantMesh
        } = shadow;
        const {
            getPmndrsExposureValue,
            getPmndrsRuntimeLightingSmoothingMs,
            getPmndrsNightReflectionIntensityScale
        } = lighting;
        const {
            getThreeToneMappingForPmndrsMode,
            normalizeReflectionOcclusionMode,
            getPmndrsCloudSunOcclusionState,
            getPmndrsCloudMoonOcclusionState
        } = host;
        const smoothPmndrsRuntimeLightValue = VRODOSMaster.LightSmoothing.value;

        H.applyRenderQualityProfile = function () {
            const renderer = this.el.renderer;
            if (!renderer) {
                return;
            }

            if (typeof this.applyVrRenderBudgetPolicy === 'function') {
                this.applyVrRenderBudgetPolicy('quality-profile');
            }

            const renderQuality = typeof this.getRenderQualityLevel === 'function' ? this.getRenderQualityLevel() : (this.data.renderQuality === 'high' ? 'high' : 'standard');
            const isHighQuality = renderQuality === 'high';
            const isPerformanceQuality = renderQuality === 'performance';
            const activeRenderBudget = window.VRODOS_ACTIVE_DESKTOP_PROFILE && window.VRODOS_ACTIVE_DESKTOP_PROFILE.renderBudget
                ? window.VRODOS_ACTIVE_DESKTOP_PROFILE.renderBudget
                : null;
            let targetPixelRatio = Math.min(window.devicePixelRatio || 1, isHighQuality ? 2 : (isPerformanceQuality ? 0.9 : 1));
            if (isHighQuality) {
                targetPixelRatio = Math.max(targetPixelRatio, this.getAAQualityPixelRatioTarget());
            }
            if (this.shouldUseEdgeAAOversample()) {
                targetPixelRatio = Math.max(targetPixelRatio, 1.15 + (this.getEdgeAAStrengthFactor() * 0.7));
            }
            targetPixelRatio = VRODOSMaster.RenderPixelBudget.apply(this, renderer, targetPixelRatio, {
                renderQuality,
                isPerformanceQuality,
                minPixelRatio: activeRenderBudget ? Number(activeRenderBudget.minPixelRatio || 0.75) : (isPerformanceQuality ? 0.75 : 1),
                maxPixelRatio: activeRenderBudget ? Number(activeRenderBudget.maxPixelRatio || 1.5) : (isHighQuality ? 1.5 : (isPerformanceQuality ? 0.9 : 1))
            });
            const isXrPresenting = typeof this.isImmersiveXrActive === 'function'
                ? this.isImmersiveXrActive()
                : Boolean(renderer.xr && renderer.xr.isPresenting);
            if (!isXrPresenting) {
                renderer.setPixelRatio(targetPixelRatio);
            }
            if (typeof renderer.sortObjects !== 'undefined') {
                const rendererSettings = this.el.getAttribute('renderer') || {};
                renderer.sortObjects = rendererSettings.sortTransparentObjects === true ||
                    rendererSettings.sortTransparentObjects === 'true';
            }

            if (typeof renderer.toneMappingExposure !== 'undefined') {
                if (this.data.postFXEngine === 'pmndrs') {
                    const atmosphereConfig = typeof this.getPmndrsAtmosphereConfig === 'function'
                        ? this.getPmndrsAtmosphereConfig()
                        : null;
                    renderer.toneMappingExposure = smoothPmndrsRuntimeLightValue(
                        this,
                        'takramToneMappingExposure',
                        getPmndrsExposureValue(this),
                        getPmndrsRuntimeLightingSmoothingMs(atmosphereConfig),
                        renderer.toneMappingExposure
                    );
                } else {
                    renderer.toneMappingExposure = isHighQuality ? 1.06 : 1.0;
                }
            }

            // physicallyCorrectLights was removed in Three.js r150-r165 and is always on in modern A-Frame/Three runtimes.
            // The compiler initializes color/tone mapping on <a-scene>; these guards keep runtime profile changes aligned.
            if (typeof renderer.outputColorSpace !== 'undefined' && typeof THREE.SRGBColorSpace !== 'undefined') {
                renderer.outputColorSpace = THREE.SRGBColorSpace;
            }

            if (typeof renderer.toneMapping !== 'undefined') {
                const isPmndrsComposerActive = this.data.postFXEngine === 'pmndrs' &&
                    typeof this.shouldUsePostProcessing === 'function' &&
                    this.shouldUsePostProcessing();
                if (isPmndrsComposerActive && typeof THREE.NoToneMapping !== 'undefined') {
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
                (typeof this.getEffectiveShadowQuality === 'function' ? this.getEffectiveShadowQuality() : this.data.shadowQuality) !== 'off' &&
                !(typeof this.isVrPresentationActive === 'function' && this.isVrPresentationActive());
            const reflectionSmoothingMs = getPmndrsRuntimeLightingSmoothingMs(atmosphereConfig);
            const cloudSunOcclusion = getPmndrsCloudSunOcclusionState(this, atmosphereConfig, reflectionSmoothingMs, reflectionSmoothingMs);
            const cloudMoonOcclusion = getPmndrsCloudMoonOcclusionState(this, atmosphereConfig, reflectionSmoothingMs);
            const cloudSunReflectionFactor = cloudSunOcclusion && typeof cloudSunOcclusion.cloudReflectionFactor === 'number'
                ? cloudSunOcclusion.cloudReflectionFactor
                : 1;
            const cloudMoonReflectionFactor = cloudMoonOcclusion && typeof cloudMoonOcclusion.cloudMoonReflectionFactor === 'number'
                ? cloudMoonOcclusion.cloudMoonReflectionFactor
                : 1;
            const cloudReflectionFactor = Math.min(cloudSunReflectionFactor, cloudMoonReflectionFactor);
            const reflectionTargetScale = getPmndrsNightReflectionIntensityScale(this, atmosphereConfig, reflectionSource) * cloudReflectionFactor;
            const reflectionIntensityScale = reflectionSmoothingMs > 0 && typeof this._vrodosReflectionEnvironmentIntensityScale === 'number'
                ? this._vrodosReflectionEnvironmentIntensityScale
                : reflectionTargetScale;
            const options = {
                renderQuality: this.data.renderQuality || 'standard',
                maxAnisotropy,
                reflectionsEnabled,
                reflectionProfile: this.data.reflectionProfile || 'balanced',
                reflectionSource,
                reflectionOcclusionMode,
                shadowAwareReflections,
                reflectionIntensityScale,
                ambientOcclusionPreset: this.getAmbientOcclusionPreset(),
                environmentMap: sceneObj ? (sceneObj.environment || null) : null
            };
            const enhancedMaterials = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
            const reflectionIntensityMaterials = [];
            const reflectionIntensityMaterialSet = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
            const trackReflectionIntensityMaterial = function (material) {
                if (!material || typeof material.envMapIntensity === 'undefined') {
                    return;
                }
                if (reflectionIntensityMaterialSet) {
                    if (reflectionIntensityMaterialSet.has(material)) {
                        return;
                    }
                    reflectionIntensityMaterialSet.add(material);
                }
                reflectionIntensityMaterials.push(material);
            };
            const enhanceMaterialOnce = function (material, overrides) {
                if (!material || isHiddenNavmeshMaterial(material)) {
                    return;
                }
                if (enhancedMaterials && enhancedMaterials.has(material)) {
                    return;
                }
                vrodosEnhanceMeshMaterial(material, overrides || {}, options);
                trackReflectionIntensityMaterial(material);
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
                if (getEntityShadowRole(entityEl) !== 'none') {
                    overrides.vrodosShadowReceiver = true;
                }
                if (isFlatMediaShadowEntity(entityEl)) {
                    overrides.vrodosReadableMedia = true;
                }
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

                    const nodeShadowRole = getObjectShadowRole(node);
                    const nodeOverrides = {};
                    if (nodeShadowRole !== 'none' && isWorldLightingParticipantMesh(node)) {
                        nodeOverrides.vrodosShadowReceiver = true;
                    }
                    if (objectEntityChainHas(node, isFlatMediaShadowEntity)) {
                        nodeOverrides.vrodosReadableMedia = true;
                    }

                    if (Array.isArray(node.material)) {
                        node.material.forEach((material) => {
                            enhanceMaterialOnce(material, nodeOverrides);
                        });
                    } else {
                        enhanceMaterialOnce(node.material, nodeOverrides);
                    }
                });
            }

            this._vrodosReflectionIntensityMaterials = reflectionIntensityMaterials;
            if (typeof this.markShadowDirty === 'function') {
                this.markShadowDirty('material-profile');
            }
        };
        H.updateReflectionEnvironmentIntensity = function (time, reflectionSource) {
            const sceneObj = this.el && this.el.object3D ? this.el.object3D : null;
            const source = reflectionSource || (typeof this.getEffectiveReflectionSource === 'function'
                ? this.getEffectiveReflectionSource()
                : 'none');
            if (!sceneObj || !sceneObj.environment || (source !== 'hdr' && source !== 'scene-probe' && source !== 'takram-sky')) {
                return;
            }

            const atmosphereConfig = this.getPmndrsAtmosphereConfig ? this.getPmndrsAtmosphereConfig() : null;
            const smoothingMs = getPmndrsRuntimeLightingSmoothingMs(atmosphereConfig);
            const cloudSunOcclusion = getPmndrsCloudSunOcclusionState(this, atmosphereConfig, smoothingMs, smoothingMs);
            const cloudMoonOcclusion = getPmndrsCloudMoonOcclusionState(this, atmosphereConfig, smoothingMs);
            const cloudSunReflectionFactor = cloudSunOcclusion && typeof cloudSunOcclusion.cloudReflectionFactor === 'number'
                ? cloudSunOcclusion.cloudReflectionFactor
                : 1;
            const cloudMoonReflectionFactor = cloudMoonOcclusion && typeof cloudMoonOcclusion.cloudMoonReflectionFactor === 'number'
                ? cloudMoonOcclusion.cloudMoonReflectionFactor
                : 1;
            const cloudReflectionFactor = Math.min(cloudSunReflectionFactor, cloudMoonReflectionFactor);
            const targetScale = getPmndrsNightReflectionIntensityScale(this, atmosphereConfig, source) * cloudReflectionFactor;
            const smoothedScale = smoothPmndrsRuntimeLightValue(
                this,
                `reflectionEnvironmentIntensity:${source}`,
                targetScale,
                smoothingMs,
                this._vrodosReflectionEnvironmentIntensityScale
            );
            this._vrodosReflectionEnvironmentIntensityScale = smoothedScale;

            if (typeof sceneObj.environmentIntensity !== 'undefined') {
                sceneObj.environmentIntensity = smoothedScale;
            }

            const materials = this._vrodosReflectionIntensityMaterials || [];
            const getTargetEnvMapIntensity = typeof window !== 'undefined' && typeof window.vrodosGetTargetEnvMapIntensity === 'function'
                ? window.vrodosGetTargetEnvMapIntensity
                : null;
            if (!materials.length || !getTargetEnvMapIntensity) {
                return;
            }

            const reflectionsEnabled = typeof this.areReflectionsEnabled === 'function' ? this.areReflectionsEnabled() : true;
            const options = {
                renderQuality: this.data.renderQuality || 'standard',
                reflectionsEnabled,
                reflectionProfile: this.data.reflectionProfile || 'balanced',
                reflectionSource: source,
                reflectionIntensityScale: smoothedScale,
                environmentMap: sceneObj.environment
            };

            materials.forEach((material) => {
                if (!material || typeof material.envMapIntensity === 'undefined') {
                    return;
                }
                material.envMapIntensity = getTargetEnvMapIntensity(material, options);
            });

            this._vrodosReflectionEnvironmentLastUpdateMs = typeof time === 'number' ? time : null;
        };

        return H;
    }
})();
