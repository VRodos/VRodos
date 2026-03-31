/**
 * VRodos Master Client A-Frame Components
 */

AFRAME.registerComponent('clear-frustum-culling', {
    schema: {
        disableCulling: { type: 'boolean', default: false }
    },
    init: function () {
        let el = this.el;
        el.addEventListener("model-loaded", e => {
            let mesh = el.getObject3D('mesh');
            if (!mesh) { return; }
            mesh.traverse(function (node) {
                if (node.isMesh) {
                    if (this.data.disableCulling) {
                        node.frustumCulled = false;
                    }
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            }.bind(this));
        });
    }
});

AFRAME.registerComponent('vrodos-scene-loader', {
    schema: {
        fallbackMs: { type: 'number', default: 12000 },
        minimumVisibleMs: { type: 'number', default: 350 }
    },
    init: function () {
        this.sceneEl = this.el.sceneEl || this.el;
        this.revealTargets = [];
        this.pendingModelIds = {};
        this.pendingModelCount = 0;
        this.loadedAssets = false;
        this.isReady = false;
        this.startedAt = performance.now();
        this.loadingOverlay = null;
        this.progressLabel = null;
        this.boundHandleSceneLoaded = this.handleSceneLoaded.bind(this);
        this.boundHandleAssetsLoaded = this.handleAssetsLoaded.bind(this);
        this.boundHandleModelLoaded = this.handleModelLoaded.bind(this);
        this.boundHandleModelError = this.handleModelError.bind(this);

        this.createOverlay();

        this.sceneEl.addEventListener('loaded', this.boundHandleSceneLoaded);
        this.sceneEl.addEventListener('model-loaded', this.boundHandleModelLoaded);
        this.sceneEl.addEventListener('model-error', this.boundHandleModelError);

        this.fallbackTimeout = setTimeout(this.revealScene.bind(this), this.data.fallbackMs);
    },
    createOverlay: function () {
        var overlay = document.createElement('div');
        overlay.id = 'vrodos-scene-loader-overlay';
        overlay.setAttribute('aria-live', 'polite');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '99999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.gap = '14px';
        overlay.style.background = 'radial-gradient(circle at center, rgba(32, 36, 48, 0.98) 0%, rgba(8, 10, 16, 1) 72%)';
        overlay.style.color = '#f5f7fb';
        overlay.style.fontFamily = 'Segoe UI, sans-serif';
        overlay.style.letterSpacing = '0.02em';
        overlay.style.transition = 'opacity 240ms ease';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';

        var spinner = document.createElement('div');
        spinner.style.width = '42px';
        spinner.style.height = '42px';
        spinner.style.border = '3px solid rgba(255,255,255,0.16)';
        spinner.style.borderTopColor = '#ffffff';
        spinner.style.borderRadius = '50%';
        spinner.style.animation = 'vrodos-loader-spin 0.9s linear infinite';

        var title = document.createElement('div');
        title.textContent = 'Loading scene';
        title.style.fontSize = '18px';
        title.style.fontWeight = '600';

        var progress = document.createElement('div');
        progress.textContent = 'Preparing 3D assets...';
        progress.style.fontSize = '13px';
        progress.style.opacity = '0.78';

        if (!document.getElementById('vrodos-scene-loader-style')) {
            var style = document.createElement('style');
            style.id = 'vrodos-scene-loader-style';
            style.textContent = '@keyframes vrodos-loader-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }

        overlay.appendChild(spinner);
        overlay.appendChild(title);
        overlay.appendChild(progress);
        document.body.appendChild(overlay);

        this.loadingOverlay = overlay;
        this.progressLabel = progress;
    },
    handleSceneLoaded: function () {
        this.revealTargets = Array.prototype.slice.call(
            this.sceneEl.querySelectorAll('[data-vrodos-delayed-reveal="true"]')
        );

        var assetsEl = this.sceneEl.querySelector('#scene-assets');
        if (assetsEl) {
            assetsEl.addEventListener('loaded', this.boundHandleAssetsLoaded, { once: true });
            if (assetsEl.hasLoaded) {
                this.loadedAssets = true;
            }
        } else {
            this.loadedAssets = true;
        }

        this.pendingModelIds = {};
        this.pendingModelCount = 0;

        this.revealTargets.forEach(function (target) {
            if (!target.hasAttribute('gltf-model')) {
                return;
            }

            if (target.getObject3D('mesh')) {
                return;
            }

            var targetId = target.id || ('vrodos-reveal-' + this.pendingModelCount);
            if (!target.id) {
                target.id = targetId;
            }

            this.pendingModelIds[targetId] = true;
            this.pendingModelCount += 1;
        }, this);

        this.updateProgress();
        this.maybeRevealScene();
    },
    handleAssetsLoaded: function () {
        this.loadedAssets = true;
        this.updateProgress();
        this.maybeRevealScene();
    },
    handleModelLoaded: function (event) {
        if (!event || !event.target) {
            return;
        }

        this.resolvePendingModel(event.target);
    },
    handleModelError: function (event) {
        if (!event || !event.target) {
            return;
        }

        this.resolvePendingModel(event.target);
    },
    resolvePendingModel: function (target) {
        if (!target || !target.id || !this.pendingModelIds[target.id]) {
            return;
        }

        delete this.pendingModelIds[target.id];
        this.pendingModelCount = Math.max(0, this.pendingModelCount - 1);
        this.updateProgress();
        this.maybeRevealScene();
    },
    updateProgress: function () {
        if (!this.progressLabel) {
            return;
        }

        if (!this.revealTargets.length) {
            this.progressLabel.textContent = 'Preparing scene...';
            return;
        }

        var totalModelCount = 0;
        this.revealTargets.forEach(function (target) {
            if (target.hasAttribute('gltf-model')) {
                totalModelCount += 1;
            }
        });

        if (!this.loadedAssets) {
            this.progressLabel.textContent = 'Preparing assets...';
            return;
        }

        if (!totalModelCount) {
            this.progressLabel.textContent = 'Finalizing scene...';
            return;
        }

        var loadedModelCount = totalModelCount - this.pendingModelCount;
        this.progressLabel.textContent = 'Loading 3D assets ' + loadedModelCount + '/' + totalModelCount;
    },
    maybeRevealScene: function () {
        if (this.isReady || !this.loadedAssets || this.pendingModelCount > 0) {
            return;
        }

        var elapsed = performance.now() - this.startedAt;
        var remainingDelay = Math.max(0, this.data.minimumVisibleMs - elapsed);
        window.setTimeout(this.revealScene.bind(this), remainingDelay);
    },
    revealScene: function () {
        if (this.isReady) {
            return;
        }

        this.isReady = true;

        this.revealTargets.forEach(function (target) {
            target.setAttribute('visible', 'true');
            target.removeAttribute('data-vrodos-delayed-reveal');
        });

        if (this.loadingOverlay) {
            this.loadingOverlay.style.opacity = '0';
            window.setTimeout(function () {
                if (this.loadingOverlay && this.loadingOverlay.parentNode) {
                    this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
                }
                this.loadingOverlay = null;
            }.bind(this), 260);
        }

        if (this.fallbackTimeout) {
            clearTimeout(this.fallbackTimeout);
            this.fallbackTimeout = null;
        }
    },
    remove: function () {
        this.sceneEl.removeEventListener('loaded', this.boundHandleSceneLoaded);
        this.sceneEl.removeEventListener('model-loaded', this.boundHandleModelLoaded);
        this.sceneEl.removeEventListener('model-error', this.boundHandleModelError);

        if (this.fallbackTimeout) {
            clearTimeout(this.fallbackTimeout);
        }

        if (this.loadingOverlay && this.loadingOverlay.parentNode) {
            this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
        }
    }
});

var VRODOS_NAVMESH_DEFAULTS = {
    maxStepHeight: 0.6,
    maxDropHeight: 1.0,
    maxSlope: 45
};

function vrodosClamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function vrodosCreateHiddenNavmeshMaterial(sourceMaterial) {
    return new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        colorWrite: false,
        depthWrite: false
    });
}

function vrodosApplyTextureQuality(texture, options, isColorTexture) {
    if (!texture) {
        return;
    }

    if (isColorTexture) {
        if (typeof texture.colorSpace !== 'undefined' && typeof THREE.SRGBColorSpace !== 'undefined') {
            texture.colorSpace = THREE.SRGBColorSpace;
        } else if (typeof texture.encoding !== 'undefined' && typeof THREE.sRGBEncoding !== 'undefined') {
            texture.encoding = THREE.sRGBEncoding;
        }
    }

    if (!texture.isVideoTexture && typeof options.maxAnisotropy === 'number' && options.maxAnisotropy > 0) {
        var targetAnisotropy = options.renderQuality === 'high'
            ? Math.min(options.maxAnisotropy, 16)
            : Math.min(options.maxAnisotropy, 8);
        texture.anisotropy = Math.max(texture.anisotropy || 0, targetAnisotropy);
    }

    if (!texture.isVideoTexture) {
        if (typeof THREE.LinearFilter !== 'undefined') {
            texture.magFilter = THREE.LinearFilter;
        }
        if (typeof THREE.LinearMipmapLinearFilter !== 'undefined') {
            texture.minFilter = THREE.LinearMipmapLinearFilter;
        }
        texture.generateMipmaps = true;
    }

    texture.needsUpdate = true;
}

function vrodosGetExplicitMaterialOverrides(entityEl) {
    if (!entityEl) {
        return {};
    }

    if (typeof entityEl.getDOMAttribute === 'function') {
        return entityEl.getDOMAttribute('material') || {};
    }

    return entityEl.getAttribute('material') || {};
}

function vrodosEnhanceMeshMaterial(material, overrides, options) {
    if (!material) {
        return;
    }

    material.userData = material.userData || {};

    vrodosApplyTextureQuality(material.map, options, true);
    vrodosApplyTextureQuality(material.emissiveMap, options, true);
    vrodosApplyTextureQuality(material.aoMap, options, false);
    vrodosApplyTextureQuality(material.metalnessMap, options, false);
    vrodosApplyTextureQuality(material.roughnessMap, options, false);
    vrodosApplyTextureQuality(material.normalMap, options, false);

    material.dithering = options.renderQuality === 'high';

    if (typeof material.envMapIntensity !== 'undefined') {
        if (typeof material.userData.vrodosBaseEnvMapIntensity === 'undefined') {
            material.userData.vrodosBaseEnvMapIntensity = material.envMapIntensity || 1;
        }

        var targetEnvMapIntensity = material.userData.vrodosBaseEnvMapIntensity;
        if (options.reflectionProfile === 'soft') {
            targetEnvMapIntensity = Math.max(material.userData.vrodosBaseEnvMapIntensity * 0.5, 0.3);
        } else if (options.renderQuality === 'high') {
            targetEnvMapIntensity = options.reflectionProfile === 'enhanced'
                ? Math.max(material.userData.vrodosBaseEnvMapIntensity, 2.0)
                : Math.max(material.userData.vrodosBaseEnvMapIntensity, 1.0);
        } else if (options.reflectionProfile === 'enhanced') {
            targetEnvMapIntensity = Math.max(material.userData.vrodosBaseEnvMapIntensity, 1.5);
        }

        material.envMapIntensity = targetEnvMapIntensity;
    }

    if (typeof material.shadowSide !== 'undefined' && typeof THREE.FrontSide !== 'undefined') {
        material.shadowSide = THREE.FrontSide;
    }

    if (material.transparent && typeof material.alphaTest !== 'undefined') {
        material.alphaTest = Math.max(material.alphaTest || 0, 0.003);
    }

    if (typeof overrides.color !== 'undefined' && overrides.color !== null && overrides.color !== '' && material.color) {
        material.color.set(overrides.color);
    }

    if (typeof overrides.emissive !== 'undefined' && overrides.emissive !== null && overrides.emissive !== '' && material.emissive) {
        material.emissive.set(overrides.emissive);
    }

    if (typeof overrides.emissiveIntensity !== 'undefined' && overrides.emissiveIntensity !== null && overrides.emissiveIntensity !== '' && typeof material.emissiveIntensity !== 'undefined') {
        material.emissiveIntensity = parseFloat(overrides.emissiveIntensity);
    } else if (options.renderQuality === 'high' && material.emissive && material.emissiveMap && typeof material.emissiveIntensity !== 'undefined') {
        if (typeof material.userData.vrodosBaseEmissiveIntensity === 'undefined') {
            material.userData.vrodosBaseEmissiveIntensity = material.emissiveIntensity || 1;
        }
        material.emissiveIntensity = Math.max(material.userData.vrodosBaseEmissiveIntensity, 1.05);
    } else if (typeof material.emissiveIntensity !== 'undefined' && typeof material.userData.vrodosBaseEmissiveIntensity !== 'undefined') {
        material.emissiveIntensity = material.userData.vrodosBaseEmissiveIntensity;
    }

    if (typeof overrides.roughness !== 'undefined' && overrides.roughness !== null && overrides.roughness !== '' && typeof material.roughness !== 'undefined') {
        material.roughness = parseFloat(overrides.roughness);
    }

    if (typeof overrides.metalness !== 'undefined' && overrides.metalness !== null && overrides.metalness !== '' && typeof material.metalness !== 'undefined') {
        material.metalness = parseFloat(overrides.metalness);
    }

    if (options.renderQuality === 'high') {
        if (typeof material.aoMapIntensity !== 'undefined' && material.aoMap) {
            if (typeof material.userData.vrodosBaseAoMapIntensity === 'undefined') {
                material.userData.vrodosBaseAoMapIntensity = material.aoMapIntensity || 1;
            }
            var targetAoIntensity = material.userData.vrodosBaseAoMapIntensity;
            switch (options.ambientOcclusionPreset) {
                case 'off':
                    targetAoIntensity = material.userData.vrodosBaseAoMapIntensity;
                    break;
                case 'soft':
                    targetAoIntensity = Math.max(material.userData.vrodosBaseAoMapIntensity, 1.04);
                    break;
                case 'strong':
                    targetAoIntensity = Math.max(material.userData.vrodosBaseAoMapIntensity, 1.22);
                    break;
                default:
                    targetAoIntensity = Math.max(material.userData.vrodosBaseAoMapIntensity, 1.12);
                    break;
            }
            material.aoMapIntensity = targetAoIntensity;
        }

        if (typeof material.normalScale !== 'undefined' && material.normalMap && material.normalScale) {
            if (!material.userData.vrodosBaseNormalScale && typeof material.normalScale.clone === 'function') {
                material.userData.vrodosBaseNormalScale = material.normalScale.clone();
            }

            if (material.userData.vrodosBaseNormalScale && typeof material.normalScale.copy === 'function') {
                var normalBoost = 1.0;
                switch (options.ambientOcclusionPreset) {
                    case 'soft':
                        normalBoost = 1.02;
                        break;
                    case 'strong':
                        normalBoost = 1.08;
                        break;
                    case 'off':
                        normalBoost = 1.0;
                        break;
                    default:
                        normalBoost = 1.05;
                        break;
                }
                material.normalScale.copy(material.userData.vrodosBaseNormalScale).multiplyScalar(normalBoost);
            }
        }
    } else {
        if (typeof material.aoMapIntensity !== 'undefined' && typeof material.userData.vrodosBaseAoMapIntensity !== 'undefined') {
            material.aoMapIntensity = material.userData.vrodosBaseAoMapIntensity;
        }

        if (typeof material.normalScale !== 'undefined' && material.userData.vrodosBaseNormalScale && typeof material.normalScale.copy === 'function') {
            material.normalScale.copy(material.userData.vrodosBaseNormalScale);
        }
    }

    material.needsUpdate = true;
}

AFRAME.registerComponent('vrodos-navmesh-helper', {
    init: function () {
        this.applyHiddenNavmeshState = this.applyHiddenNavmeshState.bind(this);
        this.el.addEventListener('model-loaded', this.applyHiddenNavmeshState);

        if (this.el.getObject3D('mesh')) {
            this.applyHiddenNavmeshState();
        }
    },
    applyHiddenNavmeshState: function () {
        var meshRoot = this.el.getObject3D('mesh');
        if (!meshRoot) {
            return;
        }

        meshRoot.visible = true;
        meshRoot.traverse(function (node) {
            if (!node.isMesh) {
                return;
            }

            node.frustumCulled = false;
            node.castShadow = false;
            node.receiveShadow = false;

            if (Array.isArray(node.material)) {
                node.material = node.material.map(function (material) {
                    return vrodosCreateHiddenNavmeshMaterial(material);
                });
            } else if (node.material) {
                node.material = vrodosCreateHiddenNavmeshMaterial(node.material);
            }
        });
    },
    remove: function () {
        this.el.removeEventListener('model-loaded', this.applyHiddenNavmeshState);
    }
});

AFRAME.registerComponent('avatar-movement-info', {
    schema: {
        movementState: { type: 'string', default: 'idle' }
    },
    init: function () {

    }
});

AFRAME.registerComponent('avatar-rotation-info', {
    schema: {
        rotationState: { type: 'string', default: 'idle' }
    },
    init: function () {

    }
});

// --- Multi-pass bloom shaders ---

function vrodosCreateBrightPassMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: null },
            threshold: { value: 0.80 }
        },
        vertexShader: [
            'varying vec2 vUv;',
            'void main() {',
            '  vUv = uv;',
            '  gl_Position = vec4(position.xy, 0.0, 1.0);',
            '}'
        ].join('\n'),
        fragmentShader: [
            'uniform sampler2D tDiffuse;',
            'uniform float threshold;',
            'varying vec2 vUv;',
            'void main() {',
            '  vec4 color = texture2D(tDiffuse, vUv);',
            '  float brightness = max(max(color.r, color.g), color.b);',
            '  float contribution = smoothstep(threshold, threshold + 0.15, brightness);',
            '  gl_FragColor = vec4(color.rgb * contribution, 1.0);',
            '}'
        ].join('\n'),
        depthWrite: false,
        depthTest: false
    });
}

function vrodosCreateGaussianBlurMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: null },
            direction: { value: new THREE.Vector2(1.0, 0.0) },
            resolution: { value: new THREE.Vector2(1, 1) }
        },
        vertexShader: [
            'varying vec2 vUv;',
            'void main() {',
            '  vUv = uv;',
            '  gl_Position = vec4(position.xy, 0.0, 1.0);',
            '}'
        ].join('\n'),
        fragmentShader: [
            'uniform sampler2D tDiffuse;',
            'uniform vec2 direction;',
            'uniform vec2 resolution;',
            'varying vec2 vUv;',
            'void main() {',
            '  vec2 texel = direction / max(resolution, vec2(1.0));',
            // 9-tap Gaussian kernel (sigma ~3.0)
            '  vec4 result = vec4(0.0);',
            '  result += texture2D(tDiffuse, vUv - 4.0 * texel) * 0.0162;',
            '  result += texture2D(tDiffuse, vUv - 3.0 * texel) * 0.0540;',
            '  result += texture2D(tDiffuse, vUv - 2.0 * texel) * 0.1216;',
            '  result += texture2D(tDiffuse, vUv - 1.0 * texel) * 0.1945;',
            '  result += texture2D(tDiffuse, vUv)                * 0.2270;',
            '  result += texture2D(tDiffuse, vUv + 1.0 * texel) * 0.1945;',
            '  result += texture2D(tDiffuse, vUv + 2.0 * texel) * 0.1216;',
            '  result += texture2D(tDiffuse, vUv + 3.0 * texel) * 0.0540;',
            '  result += texture2D(tDiffuse, vUv + 4.0 * texel) * 0.0162;',
            '  gl_FragColor = result;',
            '}'
        ].join('\n'),
        depthWrite: false,
        depthTest: false
    });
}

// --- FXAA pass (NVIDIA FXAA 3.11) ---

function vrodosCreateFXAAMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: null },
            resolution: { value: new THREE.Vector2(1 / 1024, 1 / 512) }
        },
        vertexShader: [
            'varying vec2 vUv;',
            'void main() {',
            '  vUv = uv;',
            '  gl_Position = vec4(position.xy, 0.0, 1.0);',
            '}'
        ].join('\n'),
        fragmentShader: [
            'precision highp float;',
            'uniform sampler2D tDiffuse;',
            'uniform vec2 resolution;',
            'varying vec2 vUv;',
            '#define FxaaTexTop(t, p) texture2D(t, p, -100.0)',
            '#define FxaaTexOff(t, p, o, r) texture2D(t, p + (o * r), -100.0)',
            '#define NUM_SAMPLES 5',
            'float contrast(vec4 a, vec4 b) {',
            '  vec4 diff = abs(a - b);',
            '  return max(max(max(diff.r, diff.g), diff.b), diff.a);',
            '}',
            'vec4 FxaaPixelShader(vec2 posM, sampler2D tex, vec2 fxaaQualityRcpFrame, float fxaaQualityEdgeThreshold, float fxaaQualityinvEdgeThreshold) {',
            '  vec4 rgbaM = FxaaTexTop(tex, posM);',
            '  vec4 rgbaS = FxaaTexOff(tex, posM, vec2(0.0, 1.0), fxaaQualityRcpFrame.xy);',
            '  vec4 rgbaE = FxaaTexOff(tex, posM, vec2(1.0, 0.0), fxaaQualityRcpFrame.xy);',
            '  vec4 rgbaN = FxaaTexOff(tex, posM, vec2(0.0,-1.0), fxaaQualityRcpFrame.xy);',
            '  vec4 rgbaW = FxaaTexOff(tex, posM, vec2(-1.0, 0.0), fxaaQualityRcpFrame.xy);',
            '  bool earlyExit = max(max(max(contrast(rgbaM, rgbaN), contrast(rgbaM, rgbaS)), contrast(rgbaM, rgbaE)), contrast(rgbaM, rgbaW)) < fxaaQualityEdgeThreshold;',
            '  if (earlyExit) { return rgbaM; }',
            '  float contrastN = contrast(rgbaM, rgbaN);',
            '  float contrastS = contrast(rgbaM, rgbaS);',
            '  float contrastE = contrast(rgbaM, rgbaE);',
            '  float contrastW = contrast(rgbaM, rgbaW);',
            '  float relativeVContrast = (contrastN + contrastS) - (contrastE + contrastW);',
            '  relativeVContrast *= fxaaQualityinvEdgeThreshold;',
            '  bool horzSpan = relativeVContrast > 0.;',
            '  if (abs(relativeVContrast) < .3) {',
            '    vec2 dirToEdge;',
            '    dirToEdge.x = contrastE > contrastW ? 1. : -1.;',
            '    dirToEdge.y = contrastS > contrastN ? 1. : -1.;',
            '    vec4 rgbaAlongH = FxaaTexOff(tex, posM, vec2(dirToEdge.x, -dirToEdge.y), fxaaQualityRcpFrame.xy);',
            '    float matchAlongH = contrast(rgbaM, rgbaAlongH);',
            '    vec4 rgbaAlongV = FxaaTexOff(tex, posM, vec2(-dirToEdge.x, dirToEdge.y), fxaaQualityRcpFrame.xy);',
            '    float matchAlongV = contrast(rgbaM, rgbaAlongV);',
            '    relativeVContrast = matchAlongV - matchAlongH;',
            '    relativeVContrast *= fxaaQualityinvEdgeThreshold;',
            '    if (abs(relativeVContrast) < .3) {',
            '      return mix(rgbaM, (rgbaN + rgbaS + rgbaE + rgbaW) * .25, .4);',
            '    }',
            '    horzSpan = relativeVContrast > 0.;',
            '  }',
            '  if (!horzSpan) { rgbaN = rgbaW; }',
            '  if (!horzSpan) { rgbaS = rgbaE; }',
            '  bool pairN = contrast(rgbaM, rgbaN) > contrast(rgbaM, rgbaS);',
            '  if (!pairN) { rgbaN = rgbaS; }',
            '  vec2 offNP;',
            '  offNP.x = (!horzSpan) ? 0.0 : fxaaQualityRcpFrame.x;',
            '  offNP.y = (horzSpan) ? 0.0 : fxaaQualityRcpFrame.y;',
            '  bool doneN = false;',
            '  bool doneP = false;',
            '  float nDist = 0.;',
            '  float pDist = 0.;',
            '  vec2 posN = posM;',
            '  vec2 posP = posM;',
            '  for (int i = 0; i < NUM_SAMPLES; i++) {',
            '    float increment = float(i + 1);',
            '    if (!doneN) {',
            '      nDist += increment;',
            '      posN = posM + offNP * nDist;',
            '      vec4 rgbaEndN = FxaaTexTop(tex, posN.xy);',
            '      doneN = contrast(rgbaEndN, rgbaM) > contrast(rgbaEndN, rgbaN);',
            '    }',
            '    if (!doneP) {',
            '      pDist += increment;',
            '      posP = posM - offNP * pDist;',
            '      vec4 rgbaEndP = FxaaTexTop(tex, posP.xy);',
            '      doneP = contrast(rgbaEndP, rgbaM) > contrast(rgbaEndP, rgbaN);',
            '    }',
            '    if (doneN || doneP) { break; }',
            '  }',
            '  if (!doneP && !doneN) { return rgbaM; }',
            '  float dist = min(doneN ? nDist / float(NUM_SAMPLES) : 1., doneP ? pDist / float(NUM_SAMPLES) : 1.);',
            '  dist = 1. - pow(dist, .5);',
            '  return mix(rgbaM, rgbaN, dist * .5);',
            '}',
            'void main() {',
            '  const float edgeDetectionQuality = .2;',
            '  const float invEdgeDetectionQuality = 1. / edgeDetectionQuality;',
            '  gl_FragColor = FxaaPixelShader(vUv, tDiffuse, resolution, edgeDetectionQuality, invEdgeDetectionQuality);',
            '}'
        ].join('\n'),
        depthWrite: false,
        depthTest: false
    });
}

function vrodosCreatePhotorealPostMaterial() {
    var material = new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: null },
            tBloom: { value: null },
            bloomStrength: { value: 0.35 },
            vignetteStrength: { value: 0.16 },
            saturation: { value: 1.04 },
            contrast: { value: 1.04 },
            exposure: { value: 1.0 },
            outputExposure: { value: 1.06 }
        },
        vertexShader: [
            'varying vec2 vUv;',
            'void main() {',
            '  vUv = uv;',
            '  gl_Position = vec4(position.xy, 0.0, 1.0);',
            '}'
        ].join('\n'),
        fragmentShader: [
            'uniform sampler2D tDiffuse;',
            'uniform sampler2D tBloom;',
            'uniform float bloomStrength;',
            'uniform float vignetteStrength;',
            'uniform float saturation;',
            'uniform float contrast;',
            'uniform float exposure;',
            'uniform float outputExposure;',
            'varying vec2 vUv;',
            'vec3 applySaturation(vec3 color, float sat) {',
            '  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));',
            '  return mix(vec3(luma), color, sat);',
            '}',
            'vec3 linearToSRGB(vec3 c) {',
            '  vec3 lo = c * 12.92;',
            '  vec3 hi = pow(c, vec3(1.0 / 2.4)) * 1.055 - 0.055;',
            '  return mix(lo, hi, step(vec3(0.0031308), c));',
            '}',
            'void main() {',
            '  vec4 base = texture2D(tDiffuse, vUv);',
            '  vec3 bloom = texture2D(tBloom, vUv).rgb;',
            '  vec3 color = base.rgb + bloom * bloomStrength;',
            // Color grading
            '  color = applySaturation(color, saturation);',
            '  color = (color - 0.5) * contrast + 0.5;',
            // Vignette
            '  float dist = distance(vUv, vec2(0.5));',
            '  float vignette = smoothstep(0.95, 0.24, dist);',
            '  color *= mix(1.0 - vignetteStrength, 1.0, vignette);',
            '  color *= exposure;',
            '  color = clamp(color, 0.0, 1.0);',
            '  color = linearToSRGB(color);',
            '  gl_FragColor = vec4(color, base.a);',
            '}'
        ].join('\n'),
        depthWrite: false,
        depthTest: false
    });
    material.toneMapped = false;
    return material;
}

AFRAME.registerComponent('player-info', {
    schema: {
        name: { type: 'string', default: 'user-' + Math.round(Math.random() * 10000) },
        color: { type: 'color', default: typeof window.ntExample !== 'undefined' ? window.ntExample.randomColor() : '#cccccc' },
        gltf: { default: '', type: 'string' },
        avatarType: { default: 'blob', type: 'string' },
        animationsLoaded: { default: '', type: 'string' },
        currentPrivateChat: { default: '', type: 'string' },
        fullChatTable: { default: [], type: 'array' },
        connectedUsers: { default: 0, type: 'number' }
    },
    init: function () {
        this.anims_loaded = false;
        this.ownedByLocalUser = this.el.id === 'cameraA';

        if (this.ownedByLocalUser) {
            this.nametagInput = document.getElementById('username-overlay');
            if (this.nametagInput) {
                this.nametagInput.value = this.data.name;
            }
            const colorChanger = document.getElementById('color-changer');
            if (colorChanger) {
                colorChanger.style.backgroundColor = this.data.color;
                colorChanger.style.color = this.data.color;
            }
        }

        // Listen for template instantiation
        this.el.addEventListener('instantiated', (evt) => {
            this.applyAvatar();
        });

        // Always try to apply avatar on init.
        this.applyAvatar();
    },
    applyAvatar: function () {
        const elem = this.el;
        const isRemote = !this.ownedByLocalUser;

        this.head = this.el.querySelector('.head');
        this.face = this.el.querySelector('.face');
        this.nametag = this.el.querySelector('.nametag');


        if (isRemote) {
            if (!this.head && !this.rpm_model) {
                // Missing visuals handled by retry loop below
            }
        }

        if (!this.head && !this.rpm_model && !this.ownedByLocalUser) {
            // Only retry if we are using the expo template which is SUPPOSED to have these
            const networked = this.el.getAttribute('networked');
            if (networked && networked.template === '#avatar-template-expo') {
                if (!this.avatarRetryTimeout && (!this.retryCount || this.retryCount < 10)) {
                    this.retryCount = (this.retryCount || 0) + 1;
                    this.avatarRetryTimeout = setTimeout(() => {
                        this.avatarRetryTimeout = null;
                        if (this.el) this.applyAvatar();
                    }, 200);
                }
            }
            return;
        }

        if (this.data.avatarType) {
            if (this.data.avatarType === 'no-avatar') {
                if (this.head) this.head.setAttribute("visible", "false");
                if (this.face) this.face.setAttribute("visible", "false");
                if (this.nametag) this.nametag.setAttribute("visible", "false");
            } else if (this.data.avatarType === 'blob') {
                if (this.head) {
                    this.head.setAttribute('material', { color: this.data.color });
                    this.head.setAttribute('visible', 'true');
                }
                if (this.face) this.face.setAttribute('visible', 'true');
                if (this.nametag) {
                    this.nametag.setAttribute('value', this.data.name);
                    this.nametag.setAttribute('visible', 'true');
                }
            }
        }
    },
    update: function (oldData) {
        this.applyAvatar();
    },
    remove: function () {
        if (this.avatarRetryTimeout) {
            clearTimeout(this.avatarRetryTimeout);
        }
    }
});

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

        Array.prototype.forEach.call(this.el.querySelectorAll('[data-vrodos-photoreal-light="true"]'), function (entityEl) {
            if (entityEl && entityEl.object3D) {
                self.hideSceneProbeObject(entityEl.object3D, hiddenObjects, hiddenLookup);
            }
        });

        Array.prototype.forEach.call(this.el.querySelectorAll('.vrodos-navmesh'), function (entityEl) {
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
            this.isPostFXOptionEnabled('postFXEdgeAAEnabled');
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

        this.postProcessingTarget = new THREE.WebGLRenderTarget(width, height, {
            depthBuffer: true
        });
        if (typeof this.postProcessingTarget.samples !== 'undefined') {
            var maxSamples = (renderer.capabilities && renderer.capabilities.maxSamples) ? renderer.capabilities.maxSamples : 4;
            this.postProcessingTarget.samples = Math.min(maxSamples, this.getAAQualitySampleCount());
        }
        this.postProcessingMaterial = vrodosCreatePhotorealPostMaterial();
        this.postProcessingScene = new THREE.Scene();
        this.postProcessingCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.postProcessingQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postProcessingMaterial);
        this.postProcessingScene.add(this.postProcessingQuad);

        // Multi-pass bloom targets (half resolution)
        var halfW = Math.max(1, Math.floor(width / 2));
        var halfH = Math.max(1, Math.floor(height / 2));
        this.bloomTargetA = new THREE.WebGLRenderTarget(halfW, halfH, { depthBuffer: false });
        this.bloomTargetB = new THREE.WebGLRenderTarget(halfW, halfH, { depthBuffer: false });
        this.bloomBrightPassMaterial = vrodosCreateBrightPassMaterial();
        this.bloomBlurMaterial = vrodosCreateGaussianBlurMaterial();
        this.bloomBlurMaterial.uniforms.resolution.value.set(halfW, halfH);
        this.bloomQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bloomBrightPassMaterial);
        this.bloomScene = new THREE.Scene();
        this.bloomScene.add(this.bloomQuad);

        // FXAA pass (full resolution, after composite)
        this.fxaaTarget = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
        this.fxaaMaterial = vrodosCreateFXAAMaterial();
        this.fxaaMaterial.uniforms.resolution.value.set(1.0 / width, 1.0 / height);
        this.fxaaQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.fxaaMaterial);
        this.fxaaScene = new THREE.Scene();
        this.fxaaScene.add(this.fxaaQuad);

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

                // Pass 1: Render scene to main target
                renderer.setRenderTarget(this.postProcessingTarget);
                renderer.clear(true, true, true);
                this.postProcessingOriginalRender(scene, camera);

                // Multi-pass bloom (only if bloom is enabled)
                var bloomValue = this.getBloomStrengthValue();
                if (bloomValue > 0 && this.bloomTargetA && this.bloomTargetB) {
                    // Pass 2: Bright-pass extraction → bloomTargetA (half-res)
                    this.bloomQuad.material = this.bloomBrightPassMaterial;
                    this.bloomBrightPassMaterial.uniforms.tDiffuse.value = this.postProcessingTarget.texture;
                    renderer.setRenderTarget(this.bloomTargetA);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.bloomScene, this.postProcessingCamera);

                    // Pass 3: Horizontal Gaussian blur → bloomTargetB
                    this.bloomQuad.material = this.bloomBlurMaterial;
                    this.bloomBlurMaterial.uniforms.tDiffuse.value = this.bloomTargetA.texture;
                    this.bloomBlurMaterial.uniforms.direction.value.set(1.0, 0.0);
                    renderer.setRenderTarget(this.bloomTargetB);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.bloomScene, this.postProcessingCamera);

                    // Pass 4: Vertical Gaussian blur → bloomTargetA (ping-pong)
                    this.bloomBlurMaterial.uniforms.tDiffuse.value = this.bloomTargetB.texture;
                    this.bloomBlurMaterial.uniforms.direction.value.set(0.0, 1.0);
                    renderer.setRenderTarget(this.bloomTargetA);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.bloomScene, this.postProcessingCamera);

                    // Feed blurred bloom to composite shader
                    this.postProcessingMaterial.uniforms.tBloom.value = this.bloomTargetA.texture;
                } else {
                    // No bloom — feed 1x1 black texture (null would cause GPU errors)
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
                this.postProcessingMaterial.uniforms.outputExposure.value = 1.0;

                var useFXAA = this.isPostFXOptionEnabled('postFXEdgeAAEnabled') && this.fxaaTarget && this.fxaaMaterial;
                if (useFXAA) {
                    // Pass 5: Composite → fxaaTarget
                    renderer.setRenderTarget(this.fxaaTarget);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.postProcessingScene, this.postProcessingCamera);

                    // Pass 6: FXAA → screen
                    this.fxaaMaterial.uniforms.tDiffuse.value = this.fxaaTarget.texture;
                    this.fxaaQuad.material = this.fxaaMaterial;
                    renderer.setRenderTarget(null);
                    renderer.clear(true, true, true);
                    this.postProcessingOriginalRender(this.fxaaScene, this.postProcessingCamera);
                } else {
                    // Pass 5: Composite → screen (no FXAA)
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
        if (this._blackBloomTexture) { this._blackBloomTexture.dispose(); }
        this._blackBloomTexture = null;
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

        // physicallyCorrectLights removed in Three.js r150→r165; always on in r173 (A-Frame 1.7.1)
        // outputColorSpace & toneMapping are already set by A-Frame's renderer system
        // (colorManagement: true → SRGBColorSpace; renderer="toneMapping: ACESFilmic" in HTML)
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
        var maxAnisotropy = renderer && typeof renderer.capabilities !== 'undefined' && typeof renderer.capabilities.getMaxAnisotropy === 'function'
            ? renderer.capabilities.getMaxAnisotropy()
            : 0;
        var options = {
            renderQuality: this.data.renderQuality || 'standard',
            maxAnisotropy: maxAnisotropy,
            reflectionProfile: this.data.reflectionProfile || 'balanced',
            ambientOcclusionPreset: this.getAmbientOcclusionPreset()
        };

        Array.prototype.forEach.call(this.el.querySelectorAll('.override-materials'), function (entityEl) {
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
        }

        lightEl.setAttribute('light', attributes);
        lightEl.setAttribute('position', position);
        lightEl.setAttribute('data-vrodos-photoreal-light', 'true');
        lightEl.setAttribute('visible', 'true');
        return lightEl;
    },
    removePhotorealHelperLights: function () {
        Array.prototype.forEach.call(this.el.querySelectorAll('[data-vrodos-photoreal-light="true"]'), function (lightEl) {
            if (lightEl.parentNode) {
                lightEl.parentNode.removeChild(lightEl);
            }
        });
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

        var hasAuthorLights = Array.prototype.some.call(this.el.querySelectorAll('[light]'), function (lightEl) {
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
    },
    init: function () {
        this.handleQualityModelLoad = () => {
            this.applyQualityProfiles();
            this.requestSceneProbeRefresh(true);
        };
        this.handleResize = this.updatePostProcessingSize.bind(this);
        this.postProcessingSize = new THREE.Vector2();
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
        this._blackBloomTexture = null;
        window.addEventListener('resize', this.handleResize);
        // Event - When scene is loaded
        this.el.addEventListener("loaded", () => {
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

            this.applyQualityProfiles();
            this.requestSceneProbeRefresh(true);
        });
        this.el.addEventListener('model-loaded', this.handleQualityModelLoad);

        this.el.addEventListener("enter-vr", () => {
            if (typeof browsingModeVR !== 'undefined') browsingModeVR = true;
            this.applyEnvMapProfile();
            this.syncPostProcessingState();
            if (typeof gtag !== 'undefined') gtag('event', 'vr_enabled');
        });
        this.el.addEventListener("exit-vr", () => {
            if (typeof browsingModeVR !== 'undefined') browsingModeVR = false;
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

        this.applyQualityProfiles();
    },
    remove: function () {
        this.el.removeEventListener('model-loaded', this.handleQualityModelLoad);
        window.removeEventListener('resize', this.handleResize);
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

AFRAME.registerComponent('autoplay-sound', {
    init: function () {
        this.el.addEventListener("loaded", () => {
            this.el.components.sound.playSound();
        });
    }
});

AFRAME.registerComponent('entity-movement-emitter', {
    schema: {
        clip: { type: "string", default: "idle" },
    },
    init: function () {
        var shouldCaptureKeyEvent = AFRAME.utils.shouldCaptureKeyEvent;
        var elem = this.el;

        document.addEventListener('keydown', function (event) {
            const cameraA = document.getElementById('cameraA');
            if (!cameraA) return;

            if (event.keyCode === 87) {
                if (shouldCaptureKeyEvent(event)) {
                    cameraA.setAttribute('avatar-movement-info', 'movementState', "walkingforward");
                }
            } else if (event.keyCode === 83) {
                if (shouldCaptureKeyEvent(event)) {
                    elem.emit('avatar-changed-animation', "walkingdown", false);
                    cameraA.setAttribute('avatar-movement-info', 'movementState', "walkingdown");
                }
            } else if (event.keyCode === 68) {
                if (shouldCaptureKeyEvent(event)) {
                    elem.emit('avatar-changed-animation', "walkingright", false);
                    cameraA.setAttribute('avatar-movement-info', 'movementState', "walkingright");
                }
            } else if (event.keyCode === 65) {
                if (shouldCaptureKeyEvent(event)) {
                    elem.emit('avatar-changed-animation', "walkingleft", false);
                    cameraA.setAttribute('avatar-movement-info', 'movementState', "walkingleft");
                }
            } else {
                elem.emit('avatar-changed-animation', "idle", false);
            }
        });

        document.addEventListener('keyup', function (event) {
            const cameraA = document.getElementById('cameraA');
            if (cameraA) {
                elem.emit('avatar-changed-animation', "stopped", false);
                cameraA.setAttribute('avatar-movement-info', 'movementState', "stop");
            }
        });
    }
});

AFRAME.registerComponent('entity-rotation-emitter', {
    init: function () {
        this.el.addEventListener('componentchanged', function (evt) {
            if (evt.detail.name === 'rotation') {
                // Rotation sync handled by NAF
            }
        });
    }
});

AFRAME.registerComponent('animation-embed', {
    schema: {
        clip: { type: "string", default: "idle" },
        glb_id: { type: "string", default: "" }
    },
    init: function () {
        var loader = new THREE.GLTFLoader();
        this.el.addEventListener("model-loaded", e => {
            var objectMesh = this.el.getObject3D("mesh");
            var link = "../assets/templates/multimalev2.glb";
            var elem = this.el;
            if (this.el.object3DMap.mesh.children[0].userData.name === "Armature") {
                loader.load(link, function (gltf) {
                    for (let i = 0; i < gltf.animations.length; i++) {
                        objectMesh.animations[i] = gltf.animations[i];
                    }
                    elem.removeAttribute('animation-mixer');
                    elem.setAttribute('animation-mixer', "clip: idle");
                    elem.addState('loadedanimations');
                });
            } else {
                elem.addState('noanimations');
                elem.object3D.traverse((child) => {
                    if (child.name.includes('Hand')) {
                        child.visible = false;
                    }
                });
            }
        });
    }
});

AFRAME.registerComponent('static-mask-me', {
    init: function () {
        let el = this.el;
        const maskMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: false,
            colorWrite: false,
        });
        maskMaterial.needsUpdate = true;
        let mesh = el.getObject3D('mesh');
        if (!mesh) return;
        mesh.traverse(node => {
            if (node.isMesh) {
                node.material = maskMaterial;
                node.renderOrder = 999;
            }
        });
    }
});

AFRAME.registerComponent('render-order-change', {
    schema: {
        renderingOrderArg: { type: 'string', default: '2000' }
    },
    init: function () {
        let el = this.el;
        let mesh = el.getObject3D('mesh');
        if (!mesh) return;
        mesh.traverse(node => {
            if (node.isMesh) {
                node.renderOrder = this.data.renderingOrderArg;
            }
        });
    }
});

AFRAME.registerComponent("overlay", {
    dependencies: ['material'],
    init: function () {
        this.el.sceneEl.renderer.sortObjects = true;
        this.el.object3D.renderOrder = 100;
        if (this.el.components.material && this.el.components.material.material) {
            this.el.components.material.material.depthTest = false;
        }
    }
});

AFRAME.registerComponent('show-position', {
    init: function () {
        this.positionShow = document.getElementById("positionShow");
        this.occupantsNumberShow = document.getElementById("occupantsNumberShow");
    },
    tick: function (time, timeDelta) {
        if (this.positionShow) {
            let p = this.el.getAttribute('position');
            this.positionShow.innerHTML = Math.round(p.x * 100) / 100 + ", " + Math.round(p.y * 100) / 100 + ", " + Math.round(p.z * 100) / 100;
        }

        if (this.occupantsNumberShow && typeof window.easyrtc !== 'undefined' && typeof window.NAF !== 'undefined') {
            let occupants = window.easyrtc.getRoomOccupantsAsMap(window.NAF.room);
            if (occupants) {
                this.occupantsNumberShow.innerHTML = Object.keys(occupants).length;
            }
        }
    }
});

AFRAME.registerComponent('custom-movement', {
    schema: {
        movementSpeed: { type: 'number', default: 3.2 },
        maxStepHeight: { type: 'number', default: VRODOS_NAVMESH_DEFAULTS.maxStepHeight },
        maxDropHeight: { type: 'number', default: VRODOS_NAVMESH_DEFAULTS.maxDropHeight },
        maxSlope: { type: 'number', default: VRODOS_NAVMESH_DEFAULTS.maxSlope }
    },
    init: function () {
        this.cameraRig = this.el;
        this.sceneEl = this.el.sceneEl;
        this.cameraEl = document.querySelector('#cameraA') || document.querySelector('a-camera');
        this.thumbInput = { x: 0, y: 0 };
        this.keyboardInput = { x: 0, y: 0 };
        this.navMeshRoots = [];
        this.navMeshDirty = true;
        this.navMeshBounds = new THREE.Box3();
        this.navMeshRootBounds = new THREE.Box3();
        this.heightOffset = null;
        this.lastResolvedPosition = new THREE.Vector3();
        this.lastGroundHit = null;
        this.upVector = new THREE.Vector3(0, 1, 0);
        this.forwardVector = new THREE.Vector3();
        this.rightVector = new THREE.Vector3();
        this.currentWorldPosition = new THREE.Vector3();
        this.targetWorldPosition = new THREE.Vector3();
        this.movementOffset = new THREE.Vector3();
        this.stepPosition = new THREE.Vector3();
        this.stepDelta = new THREE.Vector3();
        this.boundsSize = new THREE.Vector3();
        this.boundsClosestPoint = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        this.wasdControlsSuppressed = null;
        this.lastRecoveryAttemptAt = 0;
        this.positionPrimed = false;

        this.handleThumbstickMove = this.handleThumbstickMove.bind(this);
        this.handleThumbstickEnd = this.handleThumbstickEnd.bind(this);
        this.handleNavmeshModelLoad = this.handleNavmeshModelLoad.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);

        this.thumbL = document.querySelector('#leftHand');
        this.thumbR = document.querySelector('#rightHand');

        if (this.thumbL) {
            this.thumbL.addEventListener('thumbstickmoved', this.handleThumbstickMove);
        }

        if (this.thumbR) {
            this.thumbR.addEventListener('thumbstickmoved', this.handleThumbstickMove);
        }

        this.sceneEl.addEventListener('model-loaded', this.handleNavmeshModelLoad);
        this.sceneEl.addEventListener('loaded', () => {
            this.navMeshDirty = true;
            this.lastGroundHit = null;
            this.positionPrimed = false;
        });

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    },
    handleThumbstickMove: function (event) {
        if (!event || !event.detail) {
            return;
        }

        this.thumbInput.x = event.detail.x || 0;
        this.thumbInput.y = event.detail.y || 0;
    },
    handleThumbstickEnd: function () {
        this.thumbInput.x = 0;
        this.thumbInput.y = 0;
    },
    handleNavmeshModelLoad: function (event) {
        if (!event || !event.target || !event.target.classList || !event.target.classList.contains('vrodos-navmesh')) {
            return;
        }

        this.navMeshDirty = true;
        this.syncHeightOffset();
    },
    shouldIgnoreKeyboardEvent: function (event) {
        var target = event ? event.target : null;
        if (!target) {
            return false;
        }

        var tagName = target.tagName ? target.tagName.toLowerCase() : '';
        return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
    },
    updateKeyboardAxis: function (code, isPressed) {
        switch (code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keyboardInput.y = isPressed ? -1 : (this.keyboardInput.y === -1 ? 0 : this.keyboardInput.y);
                return true;
            case 'KeyS':
            case 'ArrowDown':
                this.keyboardInput.y = isPressed ? 1 : (this.keyboardInput.y === 1 ? 0 : this.keyboardInput.y);
                return true;
            case 'KeyA':
            case 'ArrowLeft':
                this.keyboardInput.x = isPressed ? -1 : (this.keyboardInput.x === -1 ? 0 : this.keyboardInput.x);
                return true;
            case 'KeyD':
            case 'ArrowRight':
                this.keyboardInput.x = isPressed ? 1 : (this.keyboardInput.x === 1 ? 0 : this.keyboardInput.x);
                return true;
        }

        return false;
    },
    handleKeyDown: function (event) {
        if (!event || this.shouldIgnoreKeyboardEvent(event)) {
            return;
        }

        if (this.updateKeyboardAxis(event.code, true)) {
            event.preventDefault();
        }
    },
    handleKeyUp: function (event) {
        if (!event) {
            return;
        }

        if (this.updateKeyboardAxis(event.code, false)) {
            event.preventDefault();
        }
    },
    remove: function () {
        if (this.thumbL) {
            this.thumbL.removeEventListener('thumbstickmoved', this.handleThumbstickMove);
        }
        if (this.thumbR) {
            this.thumbR.removeEventListener('thumbstickmoved', this.handleThumbstickMove);
        }
        this.sceneEl.removeEventListener('model-loaded', this.handleNavmeshModelLoad);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    },
    getSceneSettings: function () {
        return this.sceneEl ? this.sceneEl.getAttribute('scene-settings') : null;
    },
    getNavigationAnchorObject: function () {
        if (this.cameraEl && this.cameraEl.object3D) {
            return this.cameraEl.object3D;
        }

        return this.cameraRig ? this.cameraRig.object3D : null;
    },
    getNavigationWorldPosition: function () {
        var anchorObject = this.getNavigationAnchorObject();
        if (!anchorObject) {
            return this.currentWorldPosition.set(0, 0, 0);
        }

        return anchorObject.getWorldPosition(this.currentWorldPosition);
    },
    setNavigationWorldPosition: function (targetWorldPosition) {
        var anchorObject = this.getNavigationAnchorObject();
        if (!anchorObject || !this.cameraRig || !this.cameraRig.object3D) {
            return false;
        }

        var currentWorldPosition = this.getNavigationWorldPosition();
        this.movementOffset.copy(targetWorldPosition).sub(currentWorldPosition);
        this.cameraRig.object3D.position.add(this.movementOffset);
        return true;
    },
    horizontalDistanceSquared: function (pointA, pointB) {
        if (!pointA || !pointB) {
            return Infinity;
        }

        var deltaX = pointA.x - pointB.x;
        var deltaZ = pointA.z - pointB.z;
        return deltaX * deltaX + deltaZ * deltaZ;
    },
    ensureNavigationStatePrimed: function () {
        if (this.positionPrimed) {
            return;
        }

        this.lastResolvedPosition.copy(this.getNavigationWorldPosition());
        this.lastGroundHit = null;

        if (this.areCollisionsEnabled()) {
            this.syncHeightOffset();
            this.lastResolvedPosition.copy(this.getNavigationWorldPosition());
        }

        this.positionPrimed = true;
    },
    refreshNavMeshRoots: function () {
        if (!this.navMeshDirty) {
            return;
        }

        this.navMeshRoots = [];
        this.navMeshBounds.makeEmpty();

        var navMeshEntities = this.sceneEl.querySelectorAll('.vrodos-navmesh');
        for (var i = 0; i < navMeshEntities.length; i++) {
            var meshRoot = navMeshEntities[i].getObject3D('mesh');
            if (meshRoot) {
                this.navMeshRoots.push(meshRoot);
                this.navMeshRootBounds.setFromObject(meshRoot);
                if (!this.navMeshRootBounds.isEmpty()) {
                    this.navMeshBounds.union(this.navMeshRootBounds);
                }
            }
        }

        this.navMeshDirty = false;
    },
    getRecoverySearchRadius: function (position) {
        this.refreshNavMeshRoots();
        if (this.navMeshRoots.length === 0 || this.navMeshBounds.isEmpty()) {
            return 12;
        }

        this.navMeshBounds.getSize(this.boundsSize);
        var boundsRadius = vrodosClamp(this.boundsSize.length() * 0.35, 12, 120);

        this.boundsClosestPoint.copy(position);
        this.navMeshBounds.clampPoint(position, this.boundsClosestPoint);
        var horizontalDistanceToBounds = Math.sqrt(this.horizontalDistanceSquared(position, this.boundsClosestPoint));

        return Math.max(boundsRadius, horizontalDistanceToBounds + 6);
    },
    areCollisionsEnabled: function () {
        var settings = this.getSceneSettings();
        if (!settings || settings.collisionMode === 'off') {
            return false;
        }

        this.refreshNavMeshRoots();
        return this.navMeshRoots.length > 0;
    },
    getMovementDeltaFromInput: function (inputX, inputY, distance) {
        var referenceEl = this.cameraEl || this.cameraRig || document.querySelector('#cameraA') || document.querySelector('a-camera');
        if (!referenceEl || !referenceEl.object3D) {
            return null;
        }

        referenceEl.object3D.getWorldDirection(this.forwardVector);
        this.forwardVector.y = 0;
        if (this.forwardVector.lengthSq() < 0.000001) {
            this.forwardVector.set(0, 0, -1);
        } else {
            this.forwardVector.normalize();
        }

        this.rightVector.crossVectors(this.forwardVector, this.upVector).normalize().negate();

        return {
            x: (-this.forwardVector.x * inputY + this.rightVector.x * inputX) * distance,
            z: (-this.forwardVector.z * inputY + this.rightVector.z * inputX) * distance
        };
    },
    updateWASDControlsState: function (collisionsEnabled) {
        if (this.wasdControlsSuppressed === collisionsEnabled) {
            return;
        }

        if (this.el.components && this.el.components['wasd-controls']) {
            this.el.setAttribute('wasd-controls', 'fly: false; acceleration: 20; enabled: ' + (collisionsEnabled ? 'false' : 'true'));
        }

        this.wasdControlsSuppressed = collisionsEnabled;
    },
    sampleGroundAt: function (position, referenceGroundY) {
        this.refreshNavMeshRoots();
        if (this.navMeshRoots.length === 0) {
            return null;
        }

        var originY = typeof referenceGroundY === 'number'
            ? referenceGroundY + this.data.maxStepHeight + 2
            : position.y + this.data.maxStepHeight + 2;

        this.raycaster.set(
            new THREE.Vector3(position.x, originY, position.z),
            new THREE.Vector3(0, -1, 0)
        );
        this.raycaster.far = this.data.maxStepHeight + this.data.maxDropHeight + 20;

        var intersections = this.raycaster.intersectObjects(this.navMeshRoots, true);
        for (var i = 0; i < intersections.length; i++) {
            var hit = intersections[i];
            if (!hit.face) {
                continue;
            }

            var worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
            var slope = THREE.MathUtils.radToDeg(Math.acos(vrodosClamp(worldNormal.dot(this.upVector), -1, 1)));

            if (slope <= this.data.maxSlope) {
                return {
                    point: hit.point.clone(),
                    normal: worldNormal,
                    slope: slope
                };
            }
        }

        return null;
    },
    canAttemptRecovery: function () {
        var now = performance.now();
        if (now - this.lastRecoveryAttemptAt < 250) {
            return false;
        }

        this.lastRecoveryAttemptAt = now;
        return true;
    },
    findNearestGroundAt: function (position, searchRadius) {
        var radius = typeof searchRadius === 'number' ? searchRadius : 6;
        var bestGround = this.sampleGroundAt(position);
        var bestDistanceSq = bestGround ? this.horizontalDistanceSquared(bestGround.point, position) : Infinity;

        if (bestGround && bestDistanceSq < 0.0001) {
            return bestGround;
        }

        var radii = [0.5, 1, 2, 4, radius];
        var angles = [0, 45, 90, 135, 180, 225, 270, 315];

        for (var r = 0; r < radii.length; r++) {
            var offsetRadius = radii[r];
            if (offsetRadius > radius) {
                continue;
            }

            for (var a = 0; a < angles.length; a++) {
                var radians = THREE.MathUtils.degToRad(angles[a]);
                this.targetWorldPosition.set(
                    position.x + Math.cos(radians) * offsetRadius,
                    position.y,
                    position.z + Math.sin(radians) * offsetRadius
                );

                var candidateGround = this.sampleGroundAt(this.targetWorldPosition);
                if (!candidateGround) {
                    continue;
                }

                var distanceSq = this.horizontalDistanceSquared(candidateGround.point, position);
                if (distanceSq < bestDistanceSq) {
                    bestGround = candidateGround;
                    bestDistanceSq = distanceSq;
                }
            }
        }

        return bestGround;
    },
    resolveMovementAgainstGround: function (currentPosition, deltaX, deltaZ, currentGround) {
        this.stepDelta.set(deltaX, 0, deltaZ);
        var totalDistance = this.stepDelta.length();
        if (totalDistance < 0.00001) {
            return {
                position: currentPosition.clone(),
                ground: currentGround
            };
        }

        var steps = Math.max(1, Math.ceil(totalDistance / 0.2));
        var bestPosition = currentPosition.clone();
        var bestGround = currentGround;

        for (var step = 1; step <= steps; step++) {
            this.stepPosition.copy(currentPosition);
            this.stepPosition.x += deltaX * (step / steps);
            this.stepPosition.z += deltaZ * (step / steps);

            var stepGround = this.sampleGroundAt(this.stepPosition, bestGround.point.y);
            if (!stepGround) {
                stepGround = this.findNearestGroundAt(this.stepPosition, 1.5);
            }
            if (!stepGround) {
                break;
            }

            var deltaY = stepGround.point.y - bestGround.point.y;
            if (deltaY > this.data.maxStepHeight || deltaY < -this.data.maxDropHeight) {
                break;
            }

            bestPosition.copy(this.stepPosition);
            bestGround = stepGround;
        }

        if (bestPosition.distanceToSquared(currentPosition) < 0.0000001) {
            return null;
        }

        return {
            position: bestPosition.clone(),
            ground: bestGround
        };
    },
    snapNavigationToGround: function (groundHit) {
        if (!groundHit) {
            return false;
        }

        if (this.heightOffset === null) {
            var currentPosition = this.getNavigationWorldPosition();
            this.heightOffset = currentPosition.y - groundHit.point.y;
        }

        this.heightOffset = vrodosClamp(this.heightOffset, 0.2, 2.5);
        this.targetWorldPosition.set(
            groundHit.point.x,
            groundHit.point.y + this.heightOffset,
            groundHit.point.z
        );

        if (!this.setNavigationWorldPosition(this.targetWorldPosition)) {
            return false;
        }

        this.lastResolvedPosition.copy(this.targetWorldPosition);
        this.lastGroundHit = {
            point: groundHit.point.clone(),
            normal: groundHit.normal ? groundHit.normal.clone() : null,
            slope: groundHit.slope
        };
        return true;
    },
    syncHeightOffset: function () {
        if (!this.areCollisionsEnabled()) {
            return;
        }

        var navigationPosition = this.getNavigationWorldPosition();
        var currentGround = this.findNearestGroundAt(navigationPosition, this.getRecoverySearchRadius(navigationPosition));
        if (!currentGround) {
            return;
        }

        this.heightOffset = vrodosClamp(navigationPosition.y - currentGround.point.y, 0.2, 2.5);
        this.snapNavigationToGround(currentGround);
    },
    applyDirectMovement: function (deltaX, deltaZ) {
        if (Math.abs(deltaX) < 0.00001 && Math.abs(deltaZ) < 0.00001) {
            return;
        }

        this.targetWorldPosition.copy(this.lastResolvedPosition);
        this.targetWorldPosition.x += deltaX;
        this.targetWorldPosition.z += deltaZ;

        if (this.setNavigationWorldPosition(this.targetWorldPosition)) {
            this.lastResolvedPosition.copy(this.targetWorldPosition);
            this.lastGroundHit = null;
        }
    },
    applyConstrainedMovement: function (deltaX, deltaZ) {
        if (Math.abs(deltaX) < 0.00001 && Math.abs(deltaZ) < 0.00001) {
            return true;
        }

        if (this.heightOffset === null) {
            this.syncHeightOffset();
        }

        var currentPosition = this.lastResolvedPosition.clone();
        var currentGround = this.lastGroundHit;
        if (currentGround && currentGround.point && this.horizontalDistanceSquared(currentGround.point, currentPosition) > (1.5 * 1.5)) {
            currentGround = null;
        }
        if (!currentGround) {
            currentGround = this.sampleGroundAt(
                currentPosition,
                this.lastGroundHit && this.lastGroundHit.point ? this.lastGroundHit.point.y : undefined
            );
        }
        if (!currentGround) {
            var navigationPosition = this.getNavigationWorldPosition();
            if (!this.canAttemptRecovery()) {
                return false;
            }

            currentGround = this.findNearestGroundAt(navigationPosition, this.getRecoverySearchRadius(navigationPosition));
            if (!currentGround) {
                return false;
            }

            if (this.heightOffset === null) {
                this.heightOffset = vrodosClamp(navigationPosition.y - currentGround.point.y, 0.2, 2.5);
            }

            if (!this.snapNavigationToGround(currentGround)) {
                return false;
            }

            currentPosition.copy(this.lastResolvedPosition);
        }

        var resolvedStep = this.resolveMovementAgainstGround(currentPosition, deltaX, deltaZ, currentGround);
        if (!resolvedStep) {
            return false;
        }

        var nextY = resolvedStep.ground.point.y + (this.heightOffset !== null ? this.heightOffset : 0);
        this.targetWorldPosition.set(resolvedStep.position.x, nextY, resolvedStep.position.z);
        if (!this.setNavigationWorldPosition(this.targetWorldPosition)) {
            return false;
        }

        this.lastResolvedPosition.copy(this.targetWorldPosition);
        this.lastGroundHit = {
            point: resolvedStep.ground.point.clone(),
            normal: resolvedStep.ground.normal ? resolvedStep.ground.normal.clone() : null,
            slope: resolvedStep.ground.slope
        };
        return true;
    },
    tick: function (time, timeDelta) {
        var settings = this.getSceneSettings();
        if (!settings) {
            return;
        }

        var movementDisabled = settings.movement_disabled === true || settings.movement_disabled === 'true' || settings.movement_disabled === '1';
        if (movementDisabled) {
            this.setNavigationWorldPosition(this.lastResolvedPosition);
            return;
        }

        this.ensureNavigationStatePrimed();

        var currentPosition = this.getNavigationWorldPosition().clone();
        var externalDeltaX = currentPosition.x - this.lastResolvedPosition.x;
        var externalDeltaZ = currentPosition.z - this.lastResolvedPosition.z;
        var hasExternalMovement = Math.abs(externalDeltaX) > 0.0001 || Math.abs(externalDeltaZ) > 0.0001;
        var collisionsEnabled = this.areCollisionsEnabled();
        this.updateWASDControlsState(collisionsEnabled);

        if (hasExternalMovement) {
            this.setNavigationWorldPosition(this.lastResolvedPosition);

            if (collisionsEnabled) {
                this.applyConstrainedMovement(externalDeltaX, externalDeltaZ);
            } else {
                this.applyDirectMovement(externalDeltaX, externalDeltaZ);
            }
        }

        var thumbstickX = Math.abs(this.thumbInput.x) > 0.08 ? this.thumbInput.x : 0;
        var thumbstickY = Math.abs(this.thumbInput.y) > 0.08 ? this.thumbInput.y : 0;
        var keyboardX = collisionsEnabled ? this.keyboardInput.x : 0;
        var keyboardY = collisionsEnabled ? this.keyboardInput.y : 0;
        var inputX = vrodosClamp(keyboardX + thumbstickX, -1, 1);
        var inputY = vrodosClamp(keyboardY + thumbstickY, -1, 1);

        if (inputX === 0 && inputY === 0) {
            if (!hasExternalMovement) {
                this.lastResolvedPosition.copy(this.getNavigationWorldPosition());
            }
            return;
        }

        var movementDistance = this.data.movementSpeed * (Math.min(timeDelta, 50) / 1000);
        var movementDelta = this.getMovementDeltaFromInput(inputX, inputY, movementDistance);
        if (!movementDelta) {
            return;
        }

        if (collisionsEnabled) {
            this.applyConstrainedMovement(movementDelta.x, movementDelta.z);
        } else {
            this.applyDirectMovement(movementDelta.x, movementDelta.z);
        }
    }
});

AFRAME.registerComponent('start-animation', {
    init: function () {
        // Initialization for scene starting
    }
});
