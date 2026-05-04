/**
 * VRodos pmndrs Post-Processing Pipeline (clean-room sibling to vrodos_postprocessing.js)
 *
 * Uses pmndrs/postprocessing 6.39 (window.POSTPROCESSING, bundled by
 * scripts/build-three-vendor.mjs) to drive an EffectComposer that fuses every
 * supported effect into a single EffectPass for the lowest possible per-frame
 * cost. This module is selected per-scene via the postFXEngine scene-settings
 * field. See POSTPROCESSING_MIGRATION_PLAN.md §11 for the architectural decision.
 *
 * Effects merged into one EffectPass when their flags are set:
 *   - BloomEffect          (bloomStrength > 0)
 *   - BrightnessContrast   (postFXColorEnabled)
 *   - HueSaturation        (postFXColorEnabled)
 *   - LUT3DEffect          (pmndrsLutEnabled)
 *   - VignetteEffect       (postFXVignetteEnabled)
 *   - NoiseEffect          (pmndrsNoiseEnabled)
 *   - ChromaticAberration  (pmndrsChromaticAberrationEnabled)
 *   - ToneMappingEffect    (always, ACES Filmic)
 *   - SMAAEffect           (pmndrsAAMode === 'smaa')
 *
 * Effects inserted as standalone pmndrs-compatible passes:
 *   - NormalPass           (ambientOcclusionPreset !== 'off', native SSAO support pass)
 *
 * Multisample AA is applied at the composer level when
 * pmndrsAAMode === 'msaa', WebGL2 multisampling is available, and
 * ambient occlusion is not active.
 *
 * NOT supported in this engine — scenes that need these stay on postFXEngine='legacy':
 *   - SSR  (no actively-maintained pmndrs-compatible SSR effect in this VRodos pipeline)
 *   - TRAA (pmndrs/postprocessing 6.x removed TAA from core)
 *
 * Hard rule: this file must never import, call, or share render targets with
 * vrodos_postprocessing.js. Mutually exclusive engines, zero blending.
 */
/* global VRODOSMaster */
(function () {
    if (typeof VRODOSMaster === 'undefined') {
        return;
    }
    var H = VRODOSMaster.PmndrsHelpers = VRODOSMaster.PmndrsHelpers || {};

    /**
     * Convert the shared ambientOcclusionPreset string to native PMNDRS SSAOEffect settings.
     */
    function nativeSsaoOptionsForPreset(PP, preset) {
        var blendFunction = (PP && PP.BlendFunction) ? PP.BlendFunction.MULTIPLY : undefined;
        var defaults = {
            blendFunction,
            distanceScaling: true,
            depthAwareUpsampling: true,
            depthAwareUpsamplingThreshold: 0.997,
            distanceThreshold: 0.02,
            distanceFalloff: 0.0025,
            rangeThreshold: 0.0003,
            rangeFalloff: 0.0001,
            luminanceInfluence: 0.7,
            minRadiusScale: 0.33,
            bias: 0.025,
            fade: 0.01
        };

        switch (preset) {
            case 'soft':
                return Object.assign({}, defaults, {
                    samples: 9,
                    rings: 7,
                    radius: 0.06,
                    intensity: 1.33,
                    resolutionScale: 0.5
                });
            case 'strong':
                return Object.assign({}, defaults, {
                    samples: 32,
                    rings: 7,
                    radius: 0.06,
                    intensity: 2.01,
                    resolutionScale: 1.0
                });
            case 'balanced':
            default:
                return Object.assign({}, defaults, {
                    samples: 20,
                    rings: 7,
                    radius: 0.06,
                    intensity: 1.67,
                    resolutionScale: 0.75
                });
        }
    }

    /**
     * Map the legacy bloomStrength preset to a numeric intensity for pmndrs BloomEffect,
     * then multiply by the per-scene Pmndrs bloom intensity tweak. Threshold is also
     * taken from the per-scene tweak. Both knobs come from the compile dialog and are
     * persisted via scene-settings (pmndrsBloomIntensity / pmndrsBloomThreshold).
     */
    function isHorizonBackground(self) {
        return Boolean(self && self.data && self.data.selChoice === '0');
    }

    function bloomOptionsForLegacyValue(self, legacyValue, intensityMultiplier, threshold) {
        // legacy values are roughly 0..2; pmndrs intensity is roughly 0..3
        var mult = (typeof intensityMultiplier === 'number' && !isNaN(intensityMultiplier)) ? intensityMultiplier : 1.0;
        var thr = (typeof threshold === 'number' && !isNaN(threshold)) ? threshold : 0.62;
        var options = {
            intensity: Math.max(0, legacyValue) * 1.4 * mult,
            luminanceThreshold: thr,
            luminanceSmoothing: 0.18,
            mipmapBlur: true
        };

        return options;
    }

    /**
     * Read a pmndrs-tweak number from the component's `data` (A-Frame schema).
     * Schema fields are typed as 'string' (see vrodos_scene_settings.component.js)
     * so we always parseFloat. Returns `fallback` on parse failure or out-of-range.
     */
    function readPmndrsNumber(self, key, min, max, fallback) {
        var raw = (self && self.data && self.data[key] !== undefined) ? self.data[key] : fallback;
        var n = parseFloat(raw);
        if (isNaN(n)) return fallback;
        if (n < min) return min;
        if (n > max) return max;
        return n;
    }

    function readPmndrsBool(self, key) {
        if (!self || !self.data) return false;
        var v = self.data[key];
        return v === true || v === 'true' || v === '1' || v === 1;
    }

    function normalizePmndrsLutLook(value) {
        switch (value) {
            case 'warm-film':
            case 'cool-clarity':
            case 'cinematic-contrast':
            case 'soft-fade':
                return value;
            default:
                return 'neutral';
        }
    }

    function clamp01(value) {
        return Math.max(0, Math.min(1, value));
    }

    function applyLutLookTransform(look, r, g, b) {
        var luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
        var contrast;

        switch (look) {
            case 'warm-film':
                contrast = 1.06;
                r = (r - 0.5) * contrast + 0.5 + 0.035;
                g = (g - 0.5) * 1.02 + 0.5 + 0.012;
                b = (b - 0.5) * 0.96 + 0.5 - 0.025;
                r = r * 0.98 + luma * 0.02;
                g = g * 0.98 + luma * 0.02;
                b = b * 0.98 + luma * 0.02;
                break;
            case 'cool-clarity':
                contrast = 1.08;
                r = (r - 0.5) * 0.99 + 0.5 - 0.018;
                g = (g - 0.5) * 1.04 + 0.5 + 0.006;
                b = (b - 0.5) * contrast + 0.5 + 0.03;
                break;
            case 'cinematic-contrast':
                contrast = 1.16;
                r = Math.pow(clamp01((r - 0.5) * contrast + 0.5), 0.96);
                g = Math.pow(clamp01((g - 0.5) * 1.1 + 0.5), 1.0);
                b = Math.pow(clamp01((b - 0.5) * 1.12 + 0.5), 1.04);
                break;
            case 'soft-fade':
                contrast = 0.88;
                r = (r - 0.5) * contrast + 0.5 + 0.035;
                g = (g - 0.5) * contrast + 0.5 + 0.025;
                b = (b - 0.5) * contrast + 0.5 + 0.012;
                r = r * 0.94 + luma * 0.06;
                g = g * 0.94 + luma * 0.06;
                b = b * 0.94 + luma * 0.06;
                break;
            case 'neutral':
            default:
                break;
        }

        return [clamp01(r), clamp01(g), clamp01(b)];
    }

    function createBuiltInPmndrsLut(PP, look) {
        var size = 16;
        var lut = PP.LookupTexture.createNeutral(size);
        var data = lut && lut.image ? lut.image.data : null;
        var i;
        var rgb;

        if (!data) {
            return null;
        }

        look = normalizePmndrsLutLook(look);
        lut.name = `vrodos-${  look}`;
        if (look === 'neutral') {
            return lut;
        }

        for (i = 0; i < data.length; i += 4) {
            rgb = applyLutLookTransform(look, data[i], data[i + 1], data[i + 2]);
            data[i] = rgb[0];
            data[i + 1] = rgb[1];
            data[i + 2] = rgb[2];
            data[i + 3] = 1;
        }
        lut.needsUpdate = true;
        return lut;
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

    function getPmndrsAAMode(self) {
        if (!self || typeof self.getPmndrsAAMode !== 'function') {
            return 'none';
        }
        return self.getPmndrsAAMode();
    }

    function getPmndrsAAPreset(self) {
        if (!self || typeof self.getPmndrsAAPreset !== 'function') {
            return 'medium';
        }
        return self.getPmndrsAAPreset();
    }

    function isPmndrsAAEnabled(self) {
        return Boolean(self && self.data && self.data.postFXEngine === 'pmndrs' && getPmndrsAAMode(self) !== 'none');
    }

    function isPmndrsAmbientOcclusionEnabled(self) {
        return Boolean(self && typeof self.getAmbientOcclusionPreset === 'function' && self.getAmbientOcclusionPreset() !== 'off');
    }

    function getPmndrsAmbientOcclusionBackend(self) {
        return isPmndrsAmbientOcclusionEnabled(self) ? 'native-ssao' : 'off';
    }

    function getPmndrsRequestedMultisampling(self, renderer) {
        var requestedSamples = 0;
        var maxSamples = 0;

        if (!isPmndrsAAEnabled(self) || getPmndrsAAMode(self) !== 'msaa' || isPmndrsAmbientOcclusionEnabled(self) || hasPmndrsDebugFlag('disablePmndrsMsaa', 'vrodos_debug_disable_pmndrs_msaa')) {
            return 0;
        }
        if (!renderer || !renderer.capabilities || renderer.capabilities.isWebGL2 !== true) {
            return 0;
        }

        switch (getPmndrsAAPreset(self)) {
            case 'low':
                requestedSamples = 2;
                break;
            case 'high':
                requestedSamples = 8;
                break;
            case 'ultra':
                requestedSamples = 16;
                break;
            case 'medium':
            default:
                requestedSamples = 4;
                break;
        }

        maxSamples = parseInt(renderer.capabilities.maxSamples, 10);
        if (!isNaN(maxSamples) && maxSamples > 0) {
            requestedSamples = Math.min(requestedSamples, maxSamples);
        }

        return Math.max(0, Math.floor(requestedSamples));
    }

    function getPmndrsSmaaPreset(self, PP) {
        if (!isPmndrsAAEnabled(self) || getPmndrsAAMode(self) !== 'smaa' || hasPmndrsDebugFlag('disablePmndrsSmaa', 'vrodos_debug_disable_pmndrs_smaa') || !PP || !PP.SMAAPreset) {
            return null;
        }

        switch (getPmndrsAAPreset(self)) {
            case 'low':
                return PP.SMAAPreset.LOW;
            case 'medium':
                return PP.SMAAPreset.MEDIUM;
            case 'high':
                return PP.SMAAPreset.HIGH;
            case 'ultra':
                return PP.SMAAPreset.ULTRA;
            default:
                return PP.SMAAPreset.MEDIUM;
        }
    }

    function getPmndrsComposerSignature(self, renderer, atmosphereConfig, PP) {
        var smaaPreset = getPmndrsSmaaPreset(self, PP);
        return `${getPmndrsAtmosphereModeSignature(self, atmosphereConfig) 
            }|ao:${  (self && typeof self.getAmbientOcclusionPreset === 'function') ? self.getAmbientOcclusionPreset() : 'off' 
            }|aoBackend:${  getPmndrsAmbientOcclusionBackend(self) 
            }|aaMode:${  getPmndrsAAMode(self) 
            }|aaPreset:${  getPmndrsAAPreset(self) 
            }|msaa:${  getPmndrsRequestedMultisampling(self, renderer) 
            }|smaa:${  smaaPreset === null ? 'off' : smaaPreset 
            }|lut:${  readPmndrsBool(self, 'pmndrsLutEnabled')  }:${  normalizePmndrsLutLook(self && self.data ? self.data.pmndrsLutLook : 'neutral')  }:${  readPmndrsNumber(self, 'pmndrsLutStrength', 0, 1, 1.0) 
            }|noise:${  readPmndrsBool(self, 'pmndrsNoiseEnabled')  }:${  readPmndrsNumber(self, 'pmndrsNoiseOpacity', 0, 0.2, 0.04) 
            }|chroma:${  readPmndrsBool(self, 'pmndrsChromaticAberrationEnabled')  }:${  readPmndrsNumber(self, 'pmndrsChromaticAberrationOffset', 0, 0.006, 0.0015)}`;
    }

    function isPmndrsAADebugOverlayEnabled() {
        return hasPmndrsDebugFlag('pmndrsAADebugOverlay', 'vrodos_debug_pmndrs_aa');
    }

    function shouldEnablePmndrsHorizonAerial(self) {
        return isHorizonBackground(self) &&
            hasPmndrsDebugFlag('enablePmndrsHorizonAerial', 'vrodos_debug_enable_pmndrs_horizon_aerial');
    }

    function getPmndrsHorizonFoliageAlphaTestTarget() {
        return 0.35;
    }

    function isPmndrsHorizonFoliageOverlayCandidateMaterial(material) {
        var materialName;

        if (!material || material.visible === false || material.colorWrite === false) {
            return false;
        }

        if (typeof material.opacity === 'number' && material.opacity <= 0) {
            return false;
        }

        if ((typeof material.alphaTest === 'number' && material.alphaTest > 0) && (material.map || material.alphaMap)) {
            return true;
        }

        if (material.transparent === true && (material.map || material.alphaMap)) {
            return true;
        }

        materialName = (typeof material.name === 'string') ? material.name.toLowerCase() : '';
        if ((material.map || material.alphaMap) && /leaf|leaves|palm|frond|tree|bush|plant|foliage|vegetation/.test(materialName)) {
            return true;
        }

        return false;
    }

    function createPmndrsHorizonCutoutMaterial(material, cacheTag) {
        var clone;
        var prevOnBeforeCompile;

        if (!material || typeof material.clone !== 'function') {
            return material;
        }

        clone = material.clone();
        clone.transparent = false;
        clone.opacity = 1;
        clone.alphaTest = Math.max(material.alphaTest || 0, getPmndrsHorizonFoliageAlphaTestTarget());
        if (typeof clone.depthWrite !== 'undefined') {
            clone.depthWrite = true;
        }
        if (typeof clone.depthTest !== 'undefined') {
            clone.depthTest = true;
        }
        if (typeof clone.colorWrite !== 'undefined') {
            clone.colorWrite = true;
        }
        if (typeof clone.blending !== 'undefined') {
            clone.blending = THREE.NormalBlending;
        }
        if (typeof clone.alphaHash !== 'undefined') {
            clone.alphaHash = false;
        }
        if (typeof clone.alphaToCoverage !== 'undefined') {
            clone.alphaToCoverage = false;
        }
        if (typeof clone.premultipliedAlpha !== 'undefined') {
            clone.premultipliedAlpha = false;
        }
        prevOnBeforeCompile = clone.onBeforeCompile;
        clone.onBeforeCompile = function (shader, renderer) {
            if (typeof prevOnBeforeCompile === 'function') {
                prevOnBeforeCompile.call(this, shader, renderer);
            }
            if (typeof shader.fragmentShader === 'string' && shader.fragmentShader.indexOf('diffuseColor.a = 1.0;') === -1) {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <opaque_fragment>',
                    'diffuseColor.a = 1.0;\n#include <opaque_fragment>'
                );
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <output_fragment>',
                    'diffuseColor.a = 1.0;\n#include <output_fragment>'
                );
            }
        };
        clone.customProgramCacheKey = function () {
            return `vrodos-horizon-${  cacheTag  }-opaque-cutout`;
        };
        clone.needsUpdate = true;
        return clone;
    }

    function restoreAllPmndrsHorizonFoliageMaterials(self) {
        var overrides;
        var uuid;
        var entry;

        if (!self || !self._pmndrsHorizonFoliageObjectOverrides) {
            return;
        }

        overrides = self._pmndrsHorizonFoliageObjectOverrides;
        for (uuid in overrides) {
            if (!Object.prototype.hasOwnProperty.call(overrides, uuid)) {
                continue;
            }

            entry = overrides[uuid];
            if (!entry || !entry.object) {
                continue;
            }

            entry.object.material = entry.originalMaterial;
            if (entry.normalizedMaterials && entry.normalizedMaterials.length) {
                entry.normalizedMaterials.forEach(function (material) {
                    if (material && typeof material.dispose === 'function') {
                        material.dispose();
                    }
                });
            }
        }

        self._pmndrsHorizonFoliageObjectOverrides = {};
    }

    function applyPmndrsHorizonFoliageMaterialNormalization(self) {
        var overlayPass;
        var overrides;
        var seen;
        var alphaTestTarget;
        var uuid;
        var entry;

        if (!self) {
            return;
        }

        overlayPass = self.pmndrsHorizonFoliageOverlayPass;
        if (!overlayPass || !overlayPass.selection) {
            restoreAllPmndrsHorizonFoliageMaterials(self);
            return;
        }

        overrides = self._pmndrsHorizonFoliageObjectOverrides = self._pmndrsHorizonFoliageObjectOverrides || {};
        seen = {};

        overlayPass.selection.forEach(function (object) {
            var materials;
            var i;
            var material;
            var normalizedMaterials;
            var objectKey;

            if (!object || !object.material) {
                return;
            }

            objectKey = object.uuid || String(Math.random());
            seen[objectKey] = true;
            materials = Array.isArray(object.material) ? object.material : [object.material];
            normalizedMaterials = [];
            for (i = 0; i < materials.length; i++) {
                material = materials[i];
                if (!isPmndrsHorizonFoliageOverlayCandidateMaterial(material)) {
                    normalizedMaterials.push(material);
                    continue;
                }

                normalizedMaterials.push(createPmndrsHorizonCutoutMaterial(material, 'scene-foliage'));
            }

            if (!overrides[objectKey]) {
                overrides[objectKey] = {
                    object,
                    originalMaterial: object.material,
                    normalizedMaterials: []
                };
            } else if (overrides[objectKey].normalizedMaterials && overrides[objectKey].normalizedMaterials.length) {
                overrides[objectKey].normalizedMaterials.forEach(function (oldMaterial) {
                    if (oldMaterial && oldMaterial !== object.material && typeof oldMaterial.dispose === 'function') {
                        oldMaterial.dispose();
                    }
                });
            }

            overrides[objectKey].normalizedMaterials = normalizedMaterials.filter(function (candidate, idx) {
                return candidate !== materials[idx];
            });
            object.material = Array.isArray(object.material) ? normalizedMaterials : normalizedMaterials[0];
        });

        for (uuid in overrides) {
            if (!Object.prototype.hasOwnProperty.call(overrides, uuid) || seen[uuid]) {
                continue;
            }

            entry = overrides[uuid];
            if (!entry || !entry.object) {
                delete overrides[uuid];
                continue;
            }

            entry.object.material = entry.originalMaterial;
            if (entry.normalizedMaterials && entry.normalizedMaterials.length) {
                entry.normalizedMaterials.forEach(function (material) {
                    if (material && typeof material.dispose === 'function') {
                        material.dispose();
                    }
                });
            }
            delete overrides[uuid];
        }
    }

    function isPmndrsHorizonFoliageOverlayCandidateMesh(node) {
        var materials;
        var nodeName;
        var i;

        if (!node || !node.isMesh || node.visible === false || !node.material) {
            return false;
        }

        if (node.userData && (node.userData.vrodosPmndrsAtmosphereSky || node.userData.vrodosPmndrsLegacySuppressed)) {
            return false;
        }

        if (node.el && node.el.classList && node.el.classList.contains('vrodos-navmesh')) {
            return false;
        }

        nodeName = (typeof node.name === 'string') ? node.name.toLowerCase() : '';
        if (/leaf|leaves|palm|frond|tree|bush|plant|foliage|vegetation/.test(nodeName)) {
            return true;
        }

        materials = Array.isArray(node.material) ? node.material : [node.material];
        for (i = 0; i < materials.length; i++) {
            if (isPmndrsHorizonFoliageOverlayCandidateMaterial(materials[i])) {
                return true;
            }
        }

        return false;
    }

    function refreshPmndrsHorizonFoliageOverlaySelection(self, scene) {
        var overlayPass;
        var selectedCount = 0;
        var selectedSummaries = [];

        if (!self || !scene) {
            return 0;
        }

        overlayPass = self.pmndrsHorizonFoliageOverlayPass;
        if (!overlayPass || !overlayPass.selection) {
            return 0;
        }

        overlayPass.selection.clear();
        scene.traverse(function (node) {
            if (!isPmndrsHorizonFoliageOverlayCandidateMesh(node)) {
                return;
            }

            overlayPass.selection.add(node);
            selectedCount++;
            if (selectedSummaries.length < 12) {
                var materials = Array.isArray(node.material) ? node.material : [node.material];
                var materialSummary = materials.map(function (material) {
                    if (!material) {
                        return 'null-material';
                    }
                    return [
                        (material.name || material.type || 'material'),
                        `transparent=${  material.transparent === true ? '1' : '0'}`,
                        `opacity=${  typeof material.opacity === 'number' ? material.opacity.toFixed(2) : 'n/a'}`,
                        `alphaTest=${  typeof material.alphaTest === 'number' ? material.alphaTest.toFixed(3) : 'n/a'}`,
                        `map=${  material.map ? '1' : '0'}`,
                        `alphaMap=${  material.alphaMap ? '1' : '0'}`
                    ].join(',');
                }).join(' | ');
                selectedSummaries.push(`${node.name || node.uuid || 'unnamed-mesh'  } -> ${  materialSummary}`);
            }
        });

        if (self._pmndrsHorizonFoliageOverlaySelectedCount !== selectedCount) {
            console.info(`[VRodos] PMNDRS Horizon foliage overlay selection refreshed: ${  selectedCount  } alpha-cutout mesh(es) will bypass aerial compositing.`);
            self._pmndrsHorizonFoliageOverlaySelectedCount = selectedCount;
            if (selectedSummaries.length > 0) {
                console.info(`[VRodos] PMNDRS Horizon foliage overlay meshes:\n${  selectedSummaries.join('\n')}`);
            }
        }

        return selectedCount;
    }

    function PmndrsHorizonFoliageOverlayPass(scene, camera, PP, THREE) {
        this.THREE = THREE;
        this.name = 'VRodosPmndrsHorizonFoliageOverlayPass';
        this.enabled = true;
        this.needsSwap = false;
        this.needsDepthTexture = false;
        this.renderToScreen = false;
        this.selection = new PP.Selection(undefined, 30);
        this.renderPass = new PP.RenderPass(scene, camera);
        this.renderPass.ignoreBackground = true;
        this.renderPass.skipShadowMapUpdate = true;
        this.renderPass.selection = this.selection;
        this._overlayMaterialCache = {};
        if (this.renderPass.clearPass) {
            this.renderPass.clearPass.overrideClearColor = new THREE.Color(0x000000);
            this.renderPass.clearPass.overrideClearAlpha = 0;
        }
        this.renderTarget = new THREE.WebGLRenderTarget(1, 1, {
            depthBuffer: false,
            stencilBuffer: false,
            type: THREE.HalfFloatType
        });
        this.renderTarget.texture.name = 'VRodos.Pmndrs.HorizonFoliageOverlay';
        this.renderTarget.texture.generateMipmaps = false;
        this.renderTarget.texture.minFilter = THREE.NearestFilter;
        this.renderTarget.texture.magFilter = THREE.NearestFilter;
    }

    Object.defineProperty(PmndrsHorizonFoliageOverlayPass.prototype, 'map', {
        get: function () {
            return this.renderTarget ? this.renderTarget.texture : null;
        }
    });

    Object.defineProperty(PmndrsHorizonFoliageOverlayPass.prototype, 'mainCamera', {
        get: function () {
            return this.renderPass ? this.renderPass.mainCamera : null;
        },
        set: function (camera) {
            if (this.renderPass) {
                this.renderPass.mainCamera = camera;
            }
        }
    });

    PmndrsHorizonFoliageOverlayPass.prototype.initialize = function (renderer, alpha, frameBufferType) {
        if (this.renderPass && typeof this.renderPass.initialize === 'function') {
            this.renderPass.initialize(renderer, alpha, frameBufferType);
        }
    };

    PmndrsHorizonFoliageOverlayPass.prototype.getOverlayMaterial = function (material) {
        var cacheKey;
        var overlayMaterial;
        var prevOnBeforeCompile;

        if (!material || typeof material.clone !== 'function') {
            return material;
        }

        cacheKey = material.uuid || material.id || String(Math.random());
        overlayMaterial = this._overlayMaterialCache[cacheKey];
        if (overlayMaterial && overlayMaterial.userData && overlayMaterial.userData.vrodosOverlaySourceVersion === material.version) {
            return overlayMaterial;
        }

        if (overlayMaterial && typeof overlayMaterial.dispose === 'function') {
            overlayMaterial.dispose();
        }

        overlayMaterial = material.clone();
        overlayMaterial.transparent = false;
        overlayMaterial.opacity = 1;
        if (typeof overlayMaterial.alphaTest === 'number') {
            overlayMaterial.alphaTest = Math.max(material.alphaTest || 0, 0.003);
        }
        if (typeof overlayMaterial.depthWrite !== 'undefined') {
            overlayMaterial.depthWrite = true;
        }
        if (typeof overlayMaterial.depthTest !== 'undefined') {
            overlayMaterial.depthTest = true;
        }
        if (typeof overlayMaterial.colorWrite !== 'undefined') {
            overlayMaterial.colorWrite = true;
        }
        if (typeof overlayMaterial.blending !== 'undefined') {
            overlayMaterial.blending = this.THREE.NormalBlending;
        }
        if (typeof overlayMaterial.premultipliedAlpha !== 'undefined') {
            overlayMaterial.premultipliedAlpha = false;
        }
        if (typeof overlayMaterial.alphaHash !== 'undefined') {
            overlayMaterial.alphaHash = false;
        }
        if (typeof overlayMaterial.alphaToCoverage !== 'undefined') {
            overlayMaterial.alphaToCoverage = false;
        }
        prevOnBeforeCompile = overlayMaterial.onBeforeCompile;
        overlayMaterial.onBeforeCompile = function (shader, renderer) {
            if (typeof prevOnBeforeCompile === 'function') {
                prevOnBeforeCompile.call(this, shader, renderer);
            }
            if (typeof shader.fragmentShader === 'string' && shader.fragmentShader.indexOf('diffuseColor.a = 1.0;') === -1) {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <opaque_fragment>',
                    'diffuseColor.a = 1.0;\n#include <opaque_fragment>'
                );
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <output_fragment>',
                    'diffuseColor.a = 1.0;\n#include <output_fragment>'
                );
            }
        };
        overlayMaterial.customProgramCacheKey = function () {
            return 'vrodos-horizon-foliage-overlay-opaque-cutout';
        };
        overlayMaterial.needsUpdate = true;
        overlayMaterial.userData = overlayMaterial.userData || {};
        overlayMaterial.userData.vrodosOverlaySourceVersion = material.version;
        this._overlayMaterialCache[cacheKey] = overlayMaterial;
        return overlayMaterial;
    };

    PmndrsHorizonFoliageOverlayPass.prototype.prepareSelectionMaterials = function () {
        var swaps = [];
        var self = this;

        if (!this.selection || this.selection.size === 0) {
            return swaps;
        }

        this.selection.forEach(function (object) {
            var originalMaterial;
            var overlayMaterial;

            if (!object || !object.material) {
                return;
            }

            originalMaterial = object.material;
            if (Array.isArray(originalMaterial)) {
                overlayMaterial = originalMaterial.map(function (material) {
                    return self.getOverlayMaterial(material);
                });
            } else {
                overlayMaterial = self.getOverlayMaterial(originalMaterial);
            }

            swaps.push({
                object,
                material: originalMaterial
            });
            object.material = overlayMaterial;
        });

        return swaps;
    };

    PmndrsHorizonFoliageOverlayPass.prototype.restoreSelectionMaterials = function (swaps) {
        var i;
        var swap;

        for (i = 0; i < swaps.length; i++) {
            swap = swaps[i];
            if (!swap || !swap.object) {
                continue;
            }
            swap.object.material = swap.material;
        }
    };

    PmndrsHorizonFoliageOverlayPass.prototype.render = function (renderer, inputBuffer, outputBuffer, deltaTime, stencilTest) {
        var swaps;

        if (this.renderPass) {
            swaps = this.prepareSelectionMaterials();
            try {
                this.renderPass.render(renderer, this.renderTarget, null, deltaTime, stencilTest);
            } finally {
                this.restoreSelectionMaterials(swaps);
            }
        }
    };

    PmndrsHorizonFoliageOverlayPass.prototype.setSize = function (width, height) {
        if (this.renderTarget) {
            this.renderTarget.setSize(width, height);
        }
    };

    PmndrsHorizonFoliageOverlayPass.prototype.setDepthTexture = function (depthTexture, depthPacking) {
        this.depthTexture = depthTexture || null;
        this.depthPacking = depthPacking;
    };

    PmndrsHorizonFoliageOverlayPass.prototype.getDepthTexture = function () {
        return this.depthTexture || null;
    };

    PmndrsHorizonFoliageOverlayPass.prototype.dispose = function () {
        var cacheKey;

        if (this.selection && typeof this.selection.clear === 'function') {
            this.selection.clear();
        }
        for (cacheKey in this._overlayMaterialCache) {
            if (Object.prototype.hasOwnProperty.call(this._overlayMaterialCache, cacheKey) &&
                this._overlayMaterialCache[cacheKey] &&
                typeof this._overlayMaterialCache[cacheKey].dispose === 'function') {
                this._overlayMaterialCache[cacheKey].dispose();
            }
        }
        this._overlayMaterialCache = {};
        if (this.renderTarget && typeof this.renderTarget.dispose === 'function') {
            this.renderTarget.dispose();
        }
        if (this.renderPass && typeof this.renderPass.dispose === 'function') {
            this.renderPass.dispose();
        }
    };

    function ensurePmndrsAADebugOverlay(self) {
        if (!self || !isPmndrsAADebugOverlayEnabled() || typeof document === 'undefined' || !document.body) {
            return null;
        }

        if (!self._pmndrsAADebugOverlay) {
            var overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.left = '12px';
            overlay.style.bottom = '12px';
            overlay.style.zIndex = '99999';
            overlay.style.padding = '8px 10px';
            overlay.style.borderRadius = '8px';
            overlay.style.background = 'rgba(5, 15, 30, 0.88)';
            overlay.style.color = '#7ef9ff';
            overlay.style.font = '12px/1.35 Consolas, Monaco, monospace';
            overlay.style.whiteSpace = 'pre';
            overlay.style.pointerEvents = 'none';
            overlay.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.28)';
            overlay.textContent = 'PMNDRS AA DEBUG\nwaiting for composer...';
            document.body.appendChild(overlay);
            self._pmndrsAADebugOverlay = overlay;
        }

        return self._pmndrsAADebugOverlay;
    }

    function updatePmndrsAADebugOverlay(self) {
        var overlay = ensurePmndrsAADebugOverlay(self);
        var renderer;
        var requestedMsaa;
        var appliedMsaa;
        var maxSamples;
        var lines;

        if (!overlay) {
            return;
        }

        renderer = self && self.el ? self.el.renderer : null;
        requestedMsaa = (self && typeof self._pmndrsRequestedMultisampling === 'number') ? self._pmndrsRequestedMultisampling : getPmndrsRequestedMultisampling(self, renderer);
        appliedMsaa = (self && typeof self._pmndrsAppliedMultisampling === 'number') ? self._pmndrsAppliedMultisampling : 0;
        maxSamples = (renderer && renderer.capabilities && !isNaN(parseInt(renderer.capabilities.maxSamples, 10))) ? parseInt(renderer.capabilities.maxSamples, 10) : 0;

        lines = [
            'PMNDRS AA DEBUG',
            `mode: ${  getPmndrsAAMode(self)}`,
            `preset: ${  getPmndrsAAPreset(self)}`,
            `requested msaa: ${  requestedMsaa}`,
            `applied msaa: ${  appliedMsaa}`,
            `webgl2/maxSamples: ${  (renderer && renderer.capabilities && renderer.capabilities.isWebGL2 === true) ? 'yes' : 'no'  }/${  maxSamples}`,
            `smaa effect: ${  self && self.pmndrsSmaaEffect ? 'yes' : 'no'}`,
            `smaa preset: ${  (self && self._pmndrsAppliedSmaaPreset !== null && self._pmndrsAppliedSmaaPreset !== undefined) ? self._pmndrsAppliedSmaaPreset : 'off'}`,
            `composer: ${  self && self.pmndrsComposer ? 'yes' : 'no'}`,
            `effect pass: ${  self && self.pmndrsEffectPass ? 'yes' : 'no'}`,
            `ao: ${  self && self.pmndrsNativeSsaoEffect ? 'native-ssao' : 'off'}`,
            `bloom: ${  self && self.pmndrsBloomEffect ? 'yes' : 'no'}`,
            `lut: ${  self && self.pmndrsLutEffect ? normalizePmndrsLutLook(self.data.pmndrsLutLook) : 'off'}`,
            `noise: ${  self && self.pmndrsNoiseEffect ? 'yes' : 'off'}`,
            `chromatic: ${  self && self.pmndrsChromaticAberrationEffect ? 'yes' : 'off'}`,
            `atmosphere: ${  self && self.pmndrsAerialPerspectiveEffect ? 'effect' : ((self && typeof self.isPmndrsAtmosphereEnabled === 'function' && self.isPmndrsAtmosphereEnabled()) ? 'takram-only' : 'off')}`,
            `horizon aerial: ${  shouldEnablePmndrsHorizonAerial(self) ? 'experimental-on' : 'off'}`,
            `msaa fallback: ${  (self && self._pmndrsMsaaFallbackReason) ? self._pmndrsMsaaFallbackReason : 'none'}`
        ];

        overlay.textContent = lines.join('\n');
    }

    function getPmndrsAtmosphereModeSignature(self, atmosphereConfig) {
        if (!(atmosphereConfig && atmosphereConfig.enabled)) {
            return 'atmosphere:off';
        }

        if (isHorizonBackground(self)) {
            return shouldEnablePmndrsHorizonAerial(self) ? 'atmosphere:horizon-aerial' : 'atmosphere:horizon-sky';
        }

        return 'atmosphere:world';
    }

    function disposePmndrsNativeSsaoResources(self) {
        if (!self) {
            return;
        }

        if (self.pmndrsNativeSsaoEffect && typeof self.pmndrsNativeSsaoEffect.dispose === 'function') {
            self.pmndrsNativeSsaoEffect.dispose();
        }
        if (self.pmndrsNativeNormalPass && typeof self.pmndrsNativeNormalPass.dispose === 'function') {
            self.pmndrsNativeNormalPass.dispose();
        }
    }

    function disposePmndrsComposerResources(self) {
        if (!self) {
            return;
        }

        disposePmndrsNativeSsaoResources(self);

        if (self.pmndrsComposer) {
            try {
                self.pmndrsComposer.dispose();
            } catch (err) {
                console.warn('[VRodos] pmndrs composer.dispose failed:', err);
            }
        }

        self.pmndrsComposer = null;
        self.pmndrsRenderPass = null;
        self.pmndrsEffectPass = null;
        self.pmndrsNativeNormalPass = null;
        self.pmndrsNativeSsaoEffect = null;
        self.pmndrsBloomEffect = null;
        self.pmndrsSmaaEffect = null;
        if (self.pmndrsLutTexture && typeof self.pmndrsLutTexture.dispose === 'function') {
            self.pmndrsLutTexture.dispose();
        }
        self.pmndrsLutTexture = null;
        self.pmndrsLutEffect = null;
        self.pmndrsNoiseEffect = null;
        self.pmndrsChromaticAberrationEffect = null;
        self.pmndrsAerialPerspectiveEffect = null;
        self.pmndrsHorizonFoliageOverlayPass = null;
        restoreAllPmndrsHorizonFoliageMaterials(self);
        self._pmndrsAtmosphereSignature = null;
        self._pmndrsComposerSignature = null;
        self._pmndrsRequestedMultisampling = 0;
        self._pmndrsAppliedMultisampling = 0;
        self._pmndrsAppliedSmaaPreset = null;
        self._pmndrsMsaaFallbackReason = '';
        self._pmndrsHorizonFoliageOverlaySelectedCount = 0;
        self._pmndrsLastW = 0;
        self._pmndrsLastH = 0;
        updatePmndrsAADebugOverlay(self);
    }

    function syncPmndrsAerialPerspectiveEffect(self, camera, atmosphereConfig) {
        if (!self || !self.pmndrsAerialPerspectiveEffect || !(atmosphereConfig && atmosphereConfig.enabled)) {
            return;
        }

        var atmosphereState = (typeof self.ensurePmndrsAtmosphereResources === 'function') ? self.ensurePmndrsAtmosphereResources() : null;
        if (atmosphereState && !atmosphereState.failed && atmosphereState.textures) {
            self.pmndrsAerialPerspectiveEffect.irradianceTexture = atmosphereState.textures.irradianceTexture || null;
            self.pmndrsAerialPerspectiveEffect.scatteringTexture = atmosphereState.textures.scatteringTexture || null;
            self.pmndrsAerialPerspectiveEffect.transmittanceTexture = atmosphereState.textures.transmittanceTexture || null;
            self.pmndrsAerialPerspectiveEffect.singleMieScatteringTexture = atmosphereState.textures.singleMieScatteringTexture || null;
            self.pmndrsAerialPerspectiveEffect.higherOrderScatteringTexture = atmosphereState.textures.higherOrderScatteringTexture || null;
        }

        if (camera && typeof self.pmndrsAerialPerspectiveEffect.mainCamera !== 'undefined') {
            self.pmndrsAerialPerspectiveEffect.mainCamera = camera;
        }

        if (typeof self.applyPmndrsAtmosphereConfigToTarget === 'function') {
            self.applyPmndrsAtmosphereConfigToTarget(self.pmndrsAerialPerspectiveEffect, atmosphereConfig);
        }
    }

    /**
     * Lazily build the EffectComposer on the first intercepted render call.
     * Deferring construction until the first real frame guarantees that
     *   - the active scene camera exists,
     *   - the renderer canvas has non-zero dimensions (Phase 0 zero-canvas race fix),
     *   - any A-Frame deferred init has settled.
     */
    H._buildPmndrsComposer = function (scene, camera) {
        var renderer = this.el.renderer;
        var PP = window.POSTPROCESSING;
        var THREE = window.THREE;
        var atmosphereConfig = (typeof this.getPmndrsAtmosphereConfig === 'function') ? this.getPmndrsAtmosphereConfig() : null;
        if (!renderer || !PP || !THREE || !camera) {
            return false;
        }

        var composer;
        var requestedMultisampling = getPmndrsRequestedMultisampling(this, renderer);
        var requestedMultisamplingInitial = requestedMultisampling;
        var composerOptions = {
            frameBufferType: THREE.HalfFloatType
        };
        if (requestedMultisampling > 0) {
            composerOptions.multisampling = requestedMultisampling;
        }
        try {
            composer = new PP.EffectComposer(renderer, composerOptions);
        } catch (err) {
            if (requestedMultisampling > 0) {
                console.warn('[VRodos] pmndrs EffectComposer multisampling init failed, retrying without MSAA:', err);
                requestedMultisampling = 0;
                this._pmndrsMsaaFallbackReason = 'composer-init-failed';
                try {
                    composer = new PP.EffectComposer(renderer, {
                        frameBufferType: THREE.HalfFloatType
                    });
                } catch (retryErr) {
                    console.error('[VRodos] pmndrs EffectComposer construction failed:', retryErr);
                    return false;
                }
            } else {
                console.error('[VRodos] pmndrs EffectComposer construction failed:', err);
                return false;
            }
        }

        // Defensive setSize — guard against the A-Frame zero-canvas race observed in Phase 0.
        var w = (renderer.domElement && (renderer.domElement.clientWidth || renderer.domElement.width)) || window.innerWidth || 1;
        var h = (renderer.domElement && (renderer.domElement.clientHeight || renderer.domElement.height)) || window.innerHeight || 1;
        composer.setSize(Math.max(1, w), Math.max(1, h));

        var renderPass = new PP.RenderPass(scene, camera);
        composer.addPass(renderPass);

        var effects = [];
        this._pmndrsAtmosphereSignature = getPmndrsAtmosphereModeSignature(this, atmosphereConfig);
        this._pmndrsComposerSignature = getPmndrsComposerSignature(this, renderer, atmosphereConfig, PP);
        this._pmndrsRequestedMultisampling = requestedMultisamplingInitial;
        this._pmndrsAppliedMultisampling = requestedMultisampling;
        this._pmndrsAppliedSmaaPreset = null;
        if (!this._pmndrsMsaaFallbackReason) {
            this._pmndrsMsaaFallbackReason = '';
        }
        if (getPmndrsAAMode(this) === 'msaa' && isPmndrsAmbientOcclusionEnabled(this)) {
            this._pmndrsMsaaFallbackReason = 'ao-disables-msaa';
        }

        if (atmosphereConfig && atmosphereConfig.enabled && (!isHorizonBackground(this) || shouldEnablePmndrsHorizonAerial(this))) {
            var VTA = window.VRODOS_TAKRAM_ATMOSPHERE;
            var atmosphereState = (typeof this.ensurePmndrsAtmosphereResources === 'function') ? this.ensurePmndrsAtmosphereResources() : null;
            var useHorizonAerial = shouldEnablePmndrsHorizonAerial(this);

            if (VTA && atmosphereState && !atmosphereState.failed && atmosphereState.textures) {
                try {
                    this.pmndrsAerialPerspectiveEffect = new VTA.AerialPerspectiveEffect(camera, {
                        reconstructNormal: useHorizonAerial,
                        irradianceTexture: atmosphereState.textures.irradianceTexture || null,
                        scatteringTexture: atmosphereState.textures.scatteringTexture || null,
                        transmittanceTexture: atmosphereState.textures.transmittanceTexture || null,
                        singleMieScatteringTexture: atmosphereState.textures.singleMieScatteringTexture || null,
                        higherOrderScatteringTexture: atmosphereState.textures.higherOrderScatteringTexture || null,
                        transmittance: atmosphereConfig.transmittanceEnabled,
                        inscatter: atmosphereConfig.inscatterEnabled,
                        albedoScale: atmosphereConfig.albedoScale,
                        sky: useHorizonAerial,
                        sun: atmosphereConfig.takramSunEnabled !== false,
                        moon: atmosphereConfig.moonEnabled,
                        ground: atmosphereConfig.groundEnabled
                    });
                    if (useHorizonAerial && !this._pmndrsHorizonAerialWarned) {
                        console.info('[VRodos] PMNDRS Horizon AerialPerspectiveEffect experimental path enabled via ?vrodos_debug_enable_pmndrs_horizon_aerial=1. Takram SkyMaterial ownership is bypassed for this scene so the post-process aerial path can be re-validated on r181.');
                        this._pmndrsHorizonAerialWarned = true;
                    }
                    if (typeof this.applyPmndrsAtmosphereConfigToTarget === 'function') {
                        this.applyPmndrsAtmosphereConfigToTarget(this.pmndrsAerialPerspectiveEffect, atmosphereConfig);
                    }
                    if (useHorizonAerial && PP && PP.Selection && PP.RenderPass) {
                        this.pmndrsHorizonFoliageOverlayPass = new PmndrsHorizonFoliageOverlayPass(scene, camera, PP, THREE);
                        refreshPmndrsHorizonFoliageOverlaySelection(this, scene);
                        applyPmndrsHorizonFoliageMaterialNormalization(this);
                        composer.addPass(this.pmndrsHorizonFoliageOverlayPass);
                        this.pmndrsAerialPerspectiveEffect.overlay = this.pmndrsHorizonFoliageOverlayPass;
                    } else {
                        this.pmndrsHorizonFoliageOverlayPass = null;
                        restoreAllPmndrsHorizonFoliageMaterials(this);
                    }
                    effects.push(this.pmndrsAerialPerspectiveEffect);
                } catch (err) {
                    console.warn('[VRodos] pmndrs Takram AerialPerspectiveEffect construction failed, skipping:', err);
                    this.pmndrsAerialPerspectiveEffect = null;
                    this.pmndrsHorizonFoliageOverlayPass = null;
                    restoreAllPmndrsHorizonFoliageMaterials(this);
                }
            } else if (!this._pmndrsAtmosphereWarned) {
                console.info('[VRodos] PMNDRS atmosphere requested but Takram atmosphere resources are not ready - using fallback horizon visuals.');
                this._pmndrsAtmosphereWarned = true;
            }
        } else if (atmosphereConfig && atmosphereConfig.enabled && isHorizonBackground(this)) {
            // Horizon keeps using Takram SkyMaterial directly. The post-process
            // AerialPerspectiveEffect triggers repeated depth blit errors on the
            // current pinned A-Frame runtime, which also manifests visually as an
            // opaque white ground cap over the horizon. Use the explicit debug
            // opt-in above to re-test the full post-process aerial path on r181
            // without flipping the shipped default.
            this.pmndrsAerialPerspectiveEffect = null;
            restoreAllPmndrsHorizonFoliageMaterials(this);
        }

        // SSAO through the shared ambientOcclusionPreset control.
        // Native POSTPROCESSING.SSAOEffect is the default PMNDRS AO backend.
        var aoPreset = (typeof this.getAmbientOcclusionPreset === 'function') ? this.getAmbientOcclusionPreset() : 'off';
        this.pmndrsNativeNormalPass = null;
        this.pmndrsNativeSsaoEffect = null;
        if (aoPreset && aoPreset !== 'off') {
            if (PP.NormalPass && PP.SSAOEffect) {
                try {
                    var nativeSsaoOptions = nativeSsaoOptionsForPreset(PP, aoPreset);
                    this.pmndrsNativeNormalPass = new PP.NormalPass(scene, camera, { resolutionScale: 1.0 });
                    composer.addPass(this.pmndrsNativeNormalPass);
                    this.pmndrsNativeSsaoEffect = new PP.SSAOEffect(camera, this.pmndrsNativeNormalPass.texture, nativeSsaoOptions);
                    if (this.pmndrsNativeSsaoEffect.defines && this.pmndrsNativeSsaoEffect.defines.set) {
                        this.pmndrsNativeSsaoEffect.defines.set('THRESHOLD', String(nativeSsaoOptions.depthAwareUpsamplingThreshold));
                    }
                    effects.push(this.pmndrsNativeSsaoEffect);
                } catch (err) {
                    console.warn('[VRodos] pmndrs native SSAOEffect construction failed, skipping AO:', err);
                    disposePmndrsNativeSsaoResources(this);
                    this.pmndrsNativeNormalPass = null;
                    this.pmndrsNativeSsaoEffect = null;
                }
            } else if (!this._pmndrsNativeSsaoSkipWarned) {
                console.info(`[VRodos] pmndrs pipeline: AO preset "${  aoPreset  }" requested but POSTPROCESSING.NormalPass/SSAOEffect is not loaded.`);
                this._pmndrsNativeSsaoSkipWarned = true;
            }
        }

        // Bloom (intensity & threshold come from per-scene Pmndrs tweaks)
        var bloomVal = (typeof this.getBloomStrengthValue === 'function') ? this.getBloomStrengthValue() : 0;
        var pmndrsBloomMult = readPmndrsNumber(this, 'pmndrsBloomIntensity', 0, 3, 1.0);
        var pmndrsBloomThr  = readPmndrsNumber(this, 'pmndrsBloomThreshold', 0, 1, 0.62);
        if (bloomVal > 0 && pmndrsBloomMult > 0) {
            try {
                this.pmndrsBloomEffect = new PP.BloomEffect(bloomOptionsForLegacyValue(this, bloomVal, pmndrsBloomMult, pmndrsBloomThr));
                effects.push(this.pmndrsBloomEffect);
            } catch (err) {
                console.warn('[VRodos] pmndrs BloomEffect construction failed, skipping:', err);
                this.pmndrsBloomEffect = null;
            }
        }

        // ACES Filmic tone mapping — applied before color grading so that
        // grading (brightness/contrast, hue/saturation, vignette) operates
        // on perceptually uniform (LDR) colours, preventing washed-out results.
        // Per-scene exposure multiplier is applied via the renderer's toneMappingExposure.
        try {
            effects.push(new PP.ToneMappingEffect({ mode: PP.ToneMappingMode.ACES_FILMIC }));
            var pmndrsExposure = readPmndrsNumber(this, 'pmndrsToneMappingExposure', 0.3, 2.5, 1.0);
            if (renderer && typeof renderer.toneMappingExposure !== 'undefined') {
                this._pmndrsPrevToneMappingExposure = renderer.toneMappingExposure;
                renderer.toneMappingExposure = pmndrsExposure;
            }
            if (renderer && typeof renderer.toneMapping !== 'undefined' && typeof THREE.NoToneMapping !== 'undefined') {
                this._pmndrsPrevToneMapping = renderer.toneMapping;
                renderer.toneMapping = THREE.NoToneMapping;
            }
        } catch (err) {
            console.warn('[VRodos] pmndrs ToneMappingEffect failed, skipping:', err);
        }

        // Color grading — Brightness/Contrast + Hue/Saturation
        if (this.isPostFXOptionEnabled && this.isPostFXOptionEnabled('postFXColorEnabled')) {
            try {
                var contrastVal = (typeof this.getContrastValue === 'function') ? this.getContrastValue() : 1.0;
                var saturationVal = (typeof this.getSaturationValue === 'function') ? this.getSaturationValue() : 1.0;
                effects.push(new PP.BrightnessContrastEffect({ contrast: contrastVal - 1.0, brightness: 0.0 }));
                effects.push(new PP.HueSaturationEffect({ saturation: saturationVal - 1.0, hue: 0.0 }));
            } catch (err) {
                console.warn('[VRodos] pmndrs color grading effects failed, skipping:', err);
            }
        }

        this.pmndrsLutEffect = null;
        this.pmndrsLutTexture = null;
        if (readPmndrsBool(this, 'pmndrsLutEnabled') && readPmndrsNumber(this, 'pmndrsLutStrength', 0, 1, 1.0) > 0) {
            try {
                var lutLook = normalizePmndrsLutLook(this.data.pmndrsLutLook);
                var lutStrength = readPmndrsNumber(this, 'pmndrsLutStrength', 0, 1, 1.0);
                if (PP.LUT3DEffect && PP.LookupTexture && typeof PP.LookupTexture.createNeutral === 'function') {
                    this.pmndrsLutTexture = createBuiltInPmndrsLut(PP, lutLook);
                    if (!this.pmndrsLutTexture) {
                        throw new Error('Built-in LUT texture creation returned empty.');
                    }
                    this.pmndrsLutEffect = new PP.LUT3DEffect(this.pmndrsLutTexture, {
                        blendFunction: PP.BlendFunction ? PP.BlendFunction.NORMAL : undefined,
                        tetrahedralInterpolation: true
                    });
                    if (this.pmndrsLutEffect.blendMode && this.pmndrsLutEffect.blendMode.opacity) {
                        this.pmndrsLutEffect.blendMode.opacity.value = lutStrength;
                    }
                    effects.push(this.pmndrsLutEffect);
                } else if (!this._pmndrsLutSkipWarned) {
                    console.info('[VRodos] pmndrs LUT requested but LUT3DEffect/LookupTexture is not loaded.');
                    this._pmndrsLutSkipWarned = true;
                }
            } catch (err) {
                console.warn('[VRodos] pmndrs built-in LUT construction failed, skipping:', err);
                if (this.pmndrsLutTexture && typeof this.pmndrsLutTexture.dispose === 'function') {
                    this.pmndrsLutTexture.dispose();
                }
                this.pmndrsLutTexture = null;
                this.pmndrsLutEffect = null;
            }
        }

        // Vignette — pmndrs engine has its own per-scene flag (legacy postFXVignetteEnabled
        // is hard-coded false, so we honour pmndrsVignetteEnabled instead)
        var pmndrsVignetteOn = readPmndrsBool(this, 'pmndrsVignetteEnabled');
        if (pmndrsVignetteOn) {
            try {
                var vDarkness = readPmndrsNumber(this, 'pmndrsVignetteDarkness', 0, 1, 0.5);
                effects.push(new PP.VignetteEffect({ offset: 0.35, darkness: vDarkness }));
            } catch (err) {
                console.warn('[VRodos] pmndrs VignetteEffect failed, skipping:', err);
            }
        }

        this.pmndrsNoiseEffect = null;
        if (readPmndrsBool(this, 'pmndrsNoiseEnabled')) {
            try {
                this.pmndrsNoiseEffect = new PP.NoiseEffect({
                    blendFunction: PP.BlendFunction ? PP.BlendFunction.SCREEN : undefined,
                    premultiply: false
                });
                if (this.pmndrsNoiseEffect.blendMode && this.pmndrsNoiseEffect.blendMode.opacity) {
                    this.pmndrsNoiseEffect.blendMode.opacity.value = readPmndrsNumber(this, 'pmndrsNoiseOpacity', 0, 0.2, 0.04);
                }
                effects.push(this.pmndrsNoiseEffect);
            } catch (err) {
                console.warn('[VRodos] pmndrs NoiseEffect failed, skipping:', err);
                this.pmndrsNoiseEffect = null;
            }
        }

        this.pmndrsChromaticAberrationEffect = null;
        if (readPmndrsBool(this, 'pmndrsChromaticAberrationEnabled')) {
            try {
                var chromaOffset = readPmndrsNumber(this, 'pmndrsChromaticAberrationOffset', 0, 0.006, 0.0015);
                this.pmndrsChromaticAberrationEffect = new PP.ChromaticAberrationEffect({
                    offset: new THREE.Vector2(chromaOffset, chromaOffset * 0.5),
                    radialModulation: true,
                    modulationOffset: 0.25
                });
                effects.push(this.pmndrsChromaticAberrationEffect);
            } catch (err) {
                console.warn('[VRodos] pmndrs ChromaticAberrationEffect failed, skipping:', err);
                this.pmndrsChromaticAberrationEffect = null;
            }
        }

        // PMNDRS anti-aliasing — exclusive mode selection:
        //   - none: no PMNDRS AA
        //   - smaa: SMAAEffect only
        //   - msaa: composer multisampling only
        // FXAA stays disabled due the Horizon sun halo artifact it introduced on
        // the pinned r181 stack.
        var smaaPreset = getPmndrsSmaaPreset(this, PP);
        if (smaaPreset !== null) {
            try {
                this.pmndrsSmaaEffect = new PP.SMAAEffect({ preset: smaaPreset });
                effects.push(this.pmndrsSmaaEffect);
                this._pmndrsAppliedSmaaPreset = smaaPreset;
            } catch (err) {
                console.warn('[VRodos] pmndrs SMAAEffect construction failed, continuing without SMAA:', err);
                this.pmndrsSmaaEffect = null;
                this._pmndrsAppliedSmaaPreset = null;
            }
        } else {
            this.pmndrsSmaaEffect = null;
            this._pmndrsAppliedSmaaPreset = null;
        }

        // SSR / TRAA are not supported in this engine — log once per scene load.
        var wantsSSR = this.isPostFXOptionEnabled && this.isPostFXOptionEnabled('postFXSSREnabled');
        var wantsTAA = this.isPostFXOptionEnabled && this.isPostFXOptionEnabled('postFXTAAEnabled');
        if ((wantsSSR || wantsTAA) && !this._pmndrsSsrTraaWarned) {
            console.info('[VRodos] SSR/TRAA requested but not available in pmndrs pipeline — switch postFXEngine to "legacy" if those effects are required.');
            this._pmndrsSsrTraaWarned = true;
        }

        if (effects.length === 0) {
            // Nothing to merge — just feed the scene through with no post-FX.
            // Composer is still useful because it handles the final blit, but we
            // skip the EffectPass entirely to avoid an empty fragment shader.
            this.pmndrsEffectPass = null;
        } else {
            try {
                // EffectPass takes (camera, ...effects). Use spread (es2019 target).
                this.pmndrsEffectPass = new PP.EffectPass(camera, ...effects);
                composer.addPass(this.pmndrsEffectPass);
            } catch (err) {
                console.error('[VRodos] pmndrs EffectPass construction failed:', err);
                try { composer.dispose(); } catch (e) { /* swallow */ }
                return false;
            }
        }

        this.pmndrsComposer = composer;
        this.pmndrsRenderPass = renderPass;
        this._pmndrsLastW = 0;
        this._pmndrsLastH = 0;

        // Reserved for future adaptive AO tuning.
        this._pmndrsAdaptive = {
            halfRate: false,
            frameCounter: 0,
            fpsHistory: new Float32Array(30),
            fpsHistoryIdx: 0,
            fpsHistoryFilled: false,
            lastStateChange: (typeof performance !== 'undefined' ? performance.now() : Date.now()),
            lastFrameTime: (typeof performance !== 'undefined' ? performance.now() : Date.now())
        };

        updatePmndrsAADebugOverlay(this);

        return true;
    };

    H.enablePmndrsPostProcessing = function () {
        var renderer = this.el.renderer;
        if (!renderer || this.pmndrsActive) {
            return;
        }
        if (!window.POSTPROCESSING) {
            console.error('[VRodos] pmndrs engine selected but window.POSTPROCESSING is not loaded — post-FX disabled');
            return;
        }
        if (typeof THREE === 'undefined' && typeof window.THREE === 'undefined') {
            console.error('[VRodos] pmndrs engine selected but window.THREE is not loaded — post-FX disabled');
            return;
        }

        this.postProcessingSize = this.postProcessingSize || new (window.THREE.Vector2)();
        this.pmndrsOriginalRender = renderer.render.bind(renderer);
        this.pmndrsActive = true;
        this.pmndrsRendering = false;
        this._pmndrsSsrTraaWarned = false;
        this._pmndrsAtmosphereWarned = false;
        ensurePmndrsAADebugOverlay(this);
        updatePmndrsAADebugOverlay(this);

        var self = this;
        renderer.render = function (scene, camera) {
            var shouldIntercept = self.pmndrsActive &&
                self.shouldUsePostProcessing() &&
                !self.pmndrsRendering &&
                !self.sceneProbeCapturing &&
                scene === self.el.object3D &&
                camera;

            if (!shouldIntercept) {
                return self.pmndrsOriginalRender(scene, camera);
            }

            // Lazy composer build on first valid frame — guarantees camera and canvas
            // are ready (Phase 0 zero-canvas race fix).
            var atmosphereConfig = (typeof self.getPmndrsAtmosphereConfig === 'function') ? self.getPmndrsAtmosphereConfig() : null;
            var composerSignature = getPmndrsComposerSignature(self, self.el && self.el.renderer, atmosphereConfig, window.POSTPROCESSING);
            if (self.pmndrsComposer && self._pmndrsComposerSignature !== composerSignature) {
                disposePmndrsComposerResources(self);
            }
            if (!self.pmndrsComposer) {
                var built = self._buildPmndrsComposer(scene, camera);
                if (!built || !self.pmndrsComposer) {
                    return self.pmndrsOriginalRender(scene, camera);
                }
            }

            // Camera may change between frames (e.g. cinematic switches) — keep RenderPass in sync.
            if (self.pmndrsRenderPass && self.pmndrsRenderPass.mainCamera !== camera) {
                self.pmndrsRenderPass.mainCamera = camera;
                if (self.pmndrsEffectPass && typeof self.pmndrsEffectPass.mainCamera !== 'undefined') {
                    self.pmndrsEffectPass.mainCamera = camera;
                }
                if (self.pmndrsNativeNormalPass && typeof self.pmndrsNativeNormalPass.mainCamera !== 'undefined') {
                    self.pmndrsNativeNormalPass.mainCamera = camera;
                }
                if (self.pmndrsNativeSsaoEffect && typeof self.pmndrsNativeSsaoEffect.mainCamera !== 'undefined') {
                    self.pmndrsNativeSsaoEffect.mainCamera = camera;
                }
                if (self.pmndrsAerialPerspectiveEffect && typeof self.pmndrsAerialPerspectiveEffect.mainCamera !== 'undefined') {
                    self.pmndrsAerialPerspectiveEffect.mainCamera = camera;
                }
                if (self.pmndrsHorizonFoliageOverlayPass && typeof self.pmndrsHorizonFoliageOverlayPass.mainCamera !== 'undefined') {
                    self.pmndrsHorizonFoliageOverlayPass.mainCamera = camera;
                }
            }

            syncPmndrsAerialPerspectiveEffect(self, camera, atmosphereConfig);
            if (self.pmndrsHorizonFoliageOverlayPass && self.sceneCollectionsDirty) {
                refreshPmndrsHorizonFoliageOverlaySelection(self, scene);
                applyPmndrsHorizonFoliageMaterialNormalization(self);
            }
            self.updatePmndrsPostProcessingSize();
            self._updatePmndrsAdaptiveAO();

            self.pmndrsRendering = true;
            try {
                self.pmndrsComposer.render();
            } catch (err) {
                console.error('[VRodos] pmndrs composer.render failed:', err);
                // Fall back to direct render so the scene keeps drawing
                self.pmndrsOriginalRender(scene, camera);
            } finally {
                self.pmndrsRendering = false;
                updatePmndrsAADebugOverlay(self);
            }
        };
    };

    H.updatePmndrsPostProcessingSize = function () {
        if (!this.pmndrsComposer || !this.el.renderer) {
            return;
        }
        var renderer = this.el.renderer;
        var size = this.postProcessingSize;
        renderer.getSize(size);
        // pmndrs/postprocessing's EffectComposer.setSize expects CSS pixels (NOT
        // device pixels) — it re-applies the renderer pixel ratio internally.
        // The legacy file pre-multiplies because its custom composer is built
        // around physical pixel buffers. Multiplying here causes max-texture-size
        // overflow on HiDPI screens and the framebuffer comes back with zero-size
        // attachments (black screen).
        var w = Math.max(1, Math.floor(size.x));
        var h = Math.max(1, Math.floor(size.y));
        if (this._pmndrsLastW !== w || this._pmndrsLastH !== h) {
            this.pmndrsComposer.setSize(w, h);
            this._pmndrsLastW = w;
            this._pmndrsLastH = h;
        }
    };

    /**
     * Reserved for future adaptive PMNDRS AO tuning. Native SSAOEffect is kept
     * deterministic for now.
     */
    H._updatePmndrsAdaptiveAO = function () {};

    H.disablePmndrsPostProcessing = function () {
        if (!this.pmndrsActive || !this.el.renderer) {
            return;
        }
        if (this.pmndrsOriginalRender) {
            this.el.renderer.render = this.pmndrsOriginalRender;
        }
        if (typeof this._pmndrsPrevToneMappingExposure === 'number' && this.el.renderer) {
            this.el.renderer.toneMappingExposure = this._pmndrsPrevToneMappingExposure;
            this._pmndrsPrevToneMappingExposure = undefined;
        }
        if (typeof this._pmndrsPrevToneMapping !== 'undefined' && this.el.renderer) {
            this.el.renderer.toneMapping = this._pmndrsPrevToneMapping;
            this._pmndrsPrevToneMapping = undefined;
        }
        disposePmndrsComposerResources(this);
        this.pmndrsOriginalRender = null;
        this.pmndrsActive = false;
        this.pmndrsRendering = false;
        this._pmndrsAdaptive = null;
        this._pmndrsSsrTraaWarned = false;
        this._pmndrsAtmosphereWarned = false;
        updatePmndrsAADebugOverlay(this);
    };

    /**
     * Engine-aware sync. Replaces the legacy syncPostProcessingState when
     * postFXEngine === 'pmndrs'. The component-side dispatcher (Phase 2c) decides
     * which sync method to call based on the scene-settings field.
     */
    H.syncPmndrsPostProcessingState = function () {
        if (this.shouldUsePostProcessing()) {
            this.enablePmndrsPostProcessing();
            this.updatePmndrsPostProcessingSize();
            return;
        }
        this.disablePmndrsPostProcessing();
    };
})();
