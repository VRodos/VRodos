/**
 * VRodos Master Scene Loader Components
 */

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
        this.pendingAssetIds = {};
        this.pendingAssetCount = 0;
        this.loadedAssets = false;
        this.isReady = false;
        this.startedAt = performance.now();
        this.loadingOverlay = null;
        this.progressLabel = null;
        this.assetsEl = null;
        this.boundHandleSceneLoaded = this.handleSceneLoaded.bind(this);
        this.boundHandleModelLoaded = this.handleModelLoaded.bind(this);
        this.boundHandleModelError = this.handleModelError.bind(this);
        this.boundHandleAssetReady = this.handleAssetReady.bind(this);

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

        this.trackBlockingAssets(this.sceneEl.querySelector('#scene-assets'));

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
    trackBlockingAssets: function (assetsEl) {
        this.clearPendingAssets();
        this.assetsEl = assetsEl || null;

        if (!assetsEl) {
            this.loadedAssets = true;
            return;
        }

        var blockingAssets = Array.prototype.slice.call(assetsEl.children).filter(function (assetEl) {
            return this.isBlockingAsset(assetEl);
        }, this);

        if (!blockingAssets.length) {
            this.loadedAssets = true;
            return;
        }

        this.loadedAssets = false;
        this.pendingAssetIds = {};
        this.pendingAssetCount = 0;

        blockingAssets.forEach(function (assetEl, index) {
            if (this.assetHasLoaded(assetEl)) {
                return;
            }

            var assetId = assetEl.id || ('vrodos-asset-wait-' + index);
            if (!assetEl.id) {
                assetEl.id = assetId;
            }

            this.pendingAssetIds[assetId] = true;
            this.pendingAssetCount += 1;
            assetEl.addEventListener('load', this.boundHandleAssetReady);
            assetEl.addEventListener('loaded', this.boundHandleAssetReady);
            assetEl.addEventListener('error', this.boundHandleAssetReady);
        }, this);

        if (this.pendingAssetCount === 0) {
            this.loadedAssets = true;
        }
    },
    clearPendingAssets: function () {
        if (!this.assetsEl) {
            this.pendingAssetIds = {};
            this.pendingAssetCount = 0;
            return;
        }

        Array.prototype.slice.call(this.assetsEl.children).forEach(function (assetEl) {
            assetEl.removeEventListener('load', this.boundHandleAssetReady);
            assetEl.removeEventListener('loaded', this.boundHandleAssetReady);
            assetEl.removeEventListener('error', this.boundHandleAssetReady);
        }, this);

        this.pendingAssetIds = {};
        this.pendingAssetCount = 0;
    },
    isBlockingAsset: function (assetEl) {
        if (!assetEl || !assetEl.tagName) {
            return false;
        }

        var tagName = assetEl.tagName.toUpperCase();

        if (tagName === 'VIDEO' || tagName === 'AUDIO' || tagName === 'SOURCE') {
            return false;
        }

        return true;
    },
    assetHasLoaded: function (assetEl) {
        if (!assetEl) {
            return true;
        }

        if (assetEl.hasLoaded === true) {
            return true;
        }

        if (assetEl.tagName && assetEl.tagName.toUpperCase() === 'IMG') {
            return assetEl.complete;
        }

        return false;
    },
    handleAssetReady: function (event) {
        if (!event || !event.target) {
            return;
        }

        this.resolvePendingAsset(event.target);
    },
    resolvePendingAsset: function (target) {
        if (!target || !target.id || !this.pendingAssetIds[target.id]) {
            return;
        }

        target.removeEventListener('load', this.boundHandleAssetReady);
        target.removeEventListener('loaded', this.boundHandleAssetReady);
        target.removeEventListener('error', this.boundHandleAssetReady);

        delete this.pendingAssetIds[target.id];
        this.pendingAssetCount = Math.max(0, this.pendingAssetCount - 1);
        this.loadedAssets = this.pendingAssetCount === 0;
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
            this.progressLabel.textContent = 'Preparing scene assets...';
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
        this.clearPendingAssets();
 
        if (this.fallbackTimeout) {
            clearTimeout(this.fallbackTimeout);
        }

        if (this.loadingOverlay && this.loadingOverlay.parentNode) {
            this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
        }
    }
});
