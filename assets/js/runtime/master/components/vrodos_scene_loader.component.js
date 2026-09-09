/**
 * VRodos Master Scene Loader Components
 */

/**
 * VRodos Master Client A-Frame Components
 */

AFRAME.registerComponent('clear-frustum-culling', {
    schema: {
        disableCulling: { type: 'boolean', default: false },
        castShadow: { type: 'boolean', default: false },
        receiveShadow: { type: 'boolean', default: false }
    },
    init: function () {
        const el = this.el;
        el.addEventListener("model-loaded", e => {
            const mesh = el.getObject3D('mesh');
            if (!mesh) { return; }
            mesh.traverse((node) => {
                if (node.isMesh) {
                    if (this.data.disableCulling) {
                        node.frustumCulled = false;
                    }
                    if (this.data.castShadow) {
                        node.castShadow = true;
                    }
                    if (this.data.receiveShadow) {
                        node.receiveShadow = true;
                    }
                }
            });
        });
    }
});

AFRAME.registerComponent('vrodos-model-origin', {
    schema: { type: 'string', default: '' },
    init: function () {
        this.boundApplyOrigin = this.applyOrigin.bind(this);
        this.warnedFailure = false;
        this.el.addEventListener('model-loaded', this.boundApplyOrigin);
    },
    update: function () {
        this.applyOrigin();
    },
    applyOrigin: function () {
        const origin = window.VRODOSModelOrigin;
        if (!origin || origin.normalizeMode(this.data) !== origin.MODE_BOUNDS_CENTER) {
            return;
        }

        const modelRoot = this.el.getObject3D('mesh');
        if (!modelRoot) {
            return;
        }

        const centered = origin.createOffsetRoot(modelRoot, this.data);
        if (!centered.applied || !centered.root) {
            if (!this.warnedFailure) {
                console.warn('VRodos: compiled GLB bounds could not be centered; the authored origin is unchanged.', {
                    id: this.el.id || '',
                    reason: centered.reason || 'unknown'
                });
                this.warnedFailure = true;
            }
            return;
        }
        if (centered.alreadyApplied || centered.root === modelRoot) {
            return;
        }

        this.el.removeObject3D('mesh');
        this.el.setObject3D('mesh', centered.root);
        this.el.emit('vrodos-model-origin-applied', {
            mode: centered.mode,
            center: [centered.center.x, centered.center.y, centered.center.z]
        }, false);
    },
    remove: function () {
        this.el.removeEventListener('model-loaded', this.boundApplyOrigin);
    }
});

AFRAME.registerComponent('vrodos-scene-loader', {
    schema: {
        minimumVisibleMs: { type: 'number', default: 350 },
        minimumSkyPhaseVisibleMs: { type: 'number', default: 220 },
        lazyConcurrentLoads: { type: 'int', default: 2 },
        lazyBatchDelayMs: { type: 'int', default: 120 }
    },
    init: function () {
        this.sceneEl = this.el.sceneEl || this.el;
        this.revealTargets = [];
        this.lazyTargets = [];
        this.lazyQueue = [];
        this.lazyStarted = false;
        this.lazyActiveCount = 0;
        this.lazyLoadedCount = 0;
        this.lazyTotalCount = 0;
        this.lazyScheduleTimer = null;
        this.lazyScheduleIsIdle = false;
        this.runtimeReadyTimer = null;
        this.pendingModelIds = {};
        this.pendingModelCount = 0;
        this.pendingAssetIds = {};
        this.pendingAssetCount = 0;
        this.loadedAssets = false;
        this.isReady = false;
        this.criticalFailure = false;
        this.navigationPrepared = false;
        this.startedAt = performance.now();
        this.loadingOverlay = null;
        this.progressLabel = null;
        this.assetsEl = null;
        this.runtimePhaseShownAt = {};
        this.boundHandleSceneLoaded = this.handleSceneLoaded.bind(this);
        this.boundHandleModelLoaded = this.handleModelLoaded.bind(this);
        this.boundHandleModelError = this.handleModelError.bind(this);
        this.boundHandleAssetReady = this.handleAssetReady.bind(this);
        this.boundHandleLazyModelReady = this.handleLazyModelReady.bind(this);
        this.boundHandleCriticalDownloadProgress = this.handleCriticalDownloadProgress.bind(this);

        this.createOverlay();

        if (this.sceneEl.hasLoaded) {
            this.handleSceneLoaded();
        } else {
            this.sceneEl.addEventListener('loaded', this.boundHandleSceneLoaded);
        }
        this.sceneEl.addEventListener('model-loaded', this.boundHandleModelLoaded);
        this.sceneEl.addEventListener('model-error', this.boundHandleModelError);


    },
    createOverlay: function () {
        this.loadingOverlay = document.getElementById('vrodos-scene-loader-overlay');
        this.progressLabel = document.getElementById('vrodos-scene-loader-progress');
        if (!this.loadingOverlay || !this.progressLabel) {
            console.error('VRodos: the static scene loader overlay is missing from the compiled client.');
        }
        const progressState = window.VRODOSSceneLoadProgress;
        if (progressState && Array.isArray(progressState.listeners)) {
            progressState.listeners.push(this.boundHandleCriticalDownloadProgress);
            if (typeof progressState.snapshot === 'function') {
                this.handleCriticalDownloadProgress(progressState.snapshot());
            }
        }
    },
    handleCriticalDownloadProgress: function (snapshot) {
        if (snapshot && Array.isArray(snapshot.failed) && snapshot.failed.length > 0) {
            this.showCriticalFailure('A required 3D asset could not be downloaded.');
        }
    },
    markRuntimePhaseVisible: function (phaseKey, message) {
        const key = phaseKey || 'runtime';
        const now = performance.now();
        if (this.progressLabel && message) {
            this.progressLabel.textContent = message;
        }
        if (!this.runtimePhaseShownAt[key]) {
            this.runtimePhaseShownAt[key] = now;
        }
        return now - this.runtimePhaseShownAt[key];
    },
    hasRuntimePhaseBeenVisibleFor: function (phaseKey, message, minimumMs) {
        const elapsed = this.markRuntimePhaseVisible(phaseKey, message);
        return elapsed >= Math.max(0, Number(minimumMs) || 0);
    },
    handleSceneLoaded: function () {
        this.activateDesktopProfileSources();
        this.revealTargets = Array.prototype.slice.call(
            this.sceneEl.querySelectorAll('[data-vrodos-delayed-reveal="true"]')
        );
        this.lazyTargets = this.collectLazyTargets();
        this.lazyQueue = this.lazyTargets.slice();
        this.lazyLoadedCount = 0;
        this.lazyTotalCount = this.lazyTargets.length;

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

            const targetId = target.id || (`vrodos-reveal-${  this.pendingModelCount}`);
            if (!target.id) {
                target.id = targetId;
            }

            this.pendingModelIds[targetId] = true;
            this.pendingModelCount += 1;
        }, this);

        this.updateProgress();
        this.maybeRevealScene();
        if (this.isReady) {
            this.startLazyLoading();
        }
    },
    activateDesktopProfileSources: function () {
        const profile = window.VRODOS_ACTIVE_DESKTOP_PROFILE && window.VRODOS_ACTIVE_DESKTOP_PROFILE.id
            ? window.VRODOS_ACTIVE_DESKTOP_PROFILE.id
            : 'high';
        Array.prototype.slice.call(this.sceneEl.querySelectorAll('[data-vrodos-profile-gltf="true"]')).forEach(function (target) {
            const selected = target.getAttribute(`data-vrodos-profile-gltf-${profile}`) || target.getAttribute('data-vrodos-profile-gltf-high');
            if (!selected) return;
            const source = `url(${selected})`;
            if (target.getAttribute('data-vrodos-load-phase') === 'critical') {
                target.setAttribute('gltf-model', source);
                target.setAttribute('data-vrodos-lazy-state', 'critical-loading');
            } else {
                target.setAttribute('data-vrodos-lazy-gltf-src', source);
                target.setAttribute('data-vrodos-lazy-state', 'queued');
            }
        });
    },
    collectLazyTargets: function () {
        return Array.prototype.slice.call(
            this.sceneEl.querySelectorAll('[data-vrodos-lazy-gltf-src]')
        ).sort(function (a, b) {
            const aPriority = parseInt(a.getAttribute('data-vrodos-load-priority'), 10);
            const bPriority = parseInt(b.getAttribute('data-vrodos-load-priority'), 10);
            return (Number.isFinite(aPriority) ? aPriority : 9999) -
                (Number.isFinite(bPriority) ? bPriority : 9999);
        });
    },
    trackBlockingAssets: function (assetsEl) {
        this.clearPendingAssets();
        this.assetsEl = assetsEl || null;

        if (!assetsEl || assetsEl.hasLoaded) {
            this.loadedAssets = true;
            return;
        }

        const blockingAssets = Array.prototype.slice.call(assetsEl.children).filter(function (assetEl) {
            return this.isBlockingAsset(assetEl);
        }, this);

        if (!blockingAssets.length) {
            this.loadedAssets = true;
            return;
        }

        this.loadedAssets = false;
        this.pendingAssetIds = {};
        this.pendingAssetCount = 0;

        // Listen for the container itself (handles A-Frame's internal timeout)
        assetsEl.addEventListener('loaded', this.boundHandleAssetReady);
        assetsEl.addEventListener('timeout', this.boundHandleAssetReady);

        blockingAssets.forEach(function (assetEl, index) {
            if (this.assetHasLoaded(assetEl)) {
                return;
            }

            const assetId = assetEl.id || (`vrodos-asset-wait-${  index}`);
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

        const tagName = assetEl.tagName.toUpperCase();

        if (assetEl.getAttribute('data-vrodos-load-phase') === 'lazy') {
            return false;
        }

        if (tagName === 'VIDEO' || tagName === 'AUDIO' || tagName === 'SOURCE') {
            return false;
        }

        return true;
    },
    assetHasLoaded: function (assetEl) {
        if (!assetEl) {
            return true;
        }

        // A-Frame built-in state
        if (assetEl.hasLoaded === true) {
            return true;
        }

        const tagName = assetEl.tagName ? assetEl.tagName.toUpperCase() : '';

        // Image check
        if (tagName === 'IMG') {
            return assetEl.complete && assetEl.naturalHeight !== 0;
        }

        // Video/Audio check (even if we don't block, good for health)
        if (tagName === 'VIDEO' || tagName === 'AUDIO') {
            return assetEl.readyState >= 3; // HAVE_FUTURE_DATA
        }

        return false;
    },
    handleAssetReady: function (event) {
        if (!event || !event.target) {
            return;
        }

        if (event.type === 'error' && event.target.getAttribute('data-vrodos-critical') === 'true') {
            this.showCriticalFailure('A required 3D asset could not be downloaded.');
            return;
        }
        this.resolvePendingAsset(event.target);
    },
    resolvePendingAsset: function (target) {
        if (!target) {
            return;
        }

        // Special case: assets container timed out or loaded everything
        if (target === this.assetsEl) {
            this.loadedAssets = true;
            this.maybeRevealScene();
            return;
        }

        if (!target.id || !this.pendingAssetIds[target.id]) {
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

        if (event.target.getAttribute('data-vrodos-load-phase') === 'critical') {
            this.showCriticalFailure('A required 3D asset could not be decoded.');
            return;
        }
        this.resolvePendingModel(event.target);
    },
    showCriticalFailure: function (message) {
        this.criticalFailure = true;
        const title = document.getElementById('vrodos-scene-loader-title');
        const spinner = document.getElementById('vrodos-scene-loader-spinner');
        const retry = document.getElementById('vrodos-scene-loader-retry');
        if (title) title.textContent = 'A required 3D asset could not be loaded';
        if (this.progressLabel) this.progressLabel.textContent = `${message} Check your connection and retry.`;
        if (spinner) spinner.style.display = 'none';
        if (retry) retry.style.display = 'block';
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

        if (this.criticalFailure) {
            return;
        }

        const downloadState = window.VRODOSSceneLoadProgress && typeof window.VRODOSSceneLoadProgress.snapshot === 'function'
            ? window.VRODOSSceneLoadProgress.snapshot()
            : null;
        if (downloadState && downloadState.totalBytes > 0 && downloadState.loadedBytes < downloadState.totalBytes) {
            window.VRODOSSceneLoadProgress.render();
            return;
        }

        if (!this.revealTargets.length) {
            this.progressLabel.textContent = 'Preparing scene...';
            return;
        }

        let totalModelCount = 0;
        this.revealTargets.forEach((target) => {
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

        const loadedModelCount = totalModelCount - this.pendingModelCount;
        this.progressLabel.textContent = `Decoding 3D assets — ${  loadedModelCount  } / ${  totalModelCount}`;
    },
    maybeRevealScene: function () {
        if (this.isReady || this.criticalFailure || !this.loadedAssets || this.pendingModelCount > 0) {
            return;
        }

        if (!this.isRuntimeReadyForReveal()) {
            this.scheduleRuntimeReadyCheck();
            return;
        }

        const elapsed = performance.now() - this.startedAt;
        const remainingDelay = Math.max(0, this.data.minimumVisibleMs - elapsed);
        window.setTimeout(this.revealScene.bind(this), remainingDelay);
    },
    isRuntimeReadyForReveal: function () {
        const settingsComponent = this.sceneEl &&
            this.sceneEl.components &&
            this.sceneEl.components['scene-settings'];
        if (!settingsComponent) {
            if (this.sceneEl && this.sceneEl.hasAttribute && this.sceneEl.hasAttribute('scene-settings')) {
                if (this.progressLabel) {
                    this.progressLabel.textContent = 'Preparing scene runtime...';
                }
                return false;
            }
            return true;
        }

        if (!this.navigationPrepared) {
            const movementEl = this.sceneEl.querySelector('[custom-movement]');
            const movement = movementEl && movementEl.components ? movementEl.components['custom-movement'] : null;
            const requiresNavigation = settingsComponent.data && settingsComponent.data.navigationMode === 'walkable' && settingsComponent.data.collisionMode !== 'off';
            if (requiresNavigation && movement && typeof movement.refreshCollisionWorld === 'function') {
                this.progressLabel.textContent = 'Preparing navigation';
                movement.refreshCollisionWorld();
                if (movement.collisionWorldDirty) {
                    return false;
                }
            }
            this.navigationPrepared = true;
            return false;
        }

        if (typeof settingsComponent.getRuntimeRevealReadinessState === 'function') {
            const readiness = settingsComponent.getRuntimeRevealReadinessState();
            const pendingKey = readiness.pending && readiness.pending[0] ? readiness.pending[0] : '';
            if (!readiness.ready && this.progressLabel) {
                if (pendingKey) {
                    this.markRuntimePhaseVisible(pendingKey, readiness.message || 'Preparing lighting and sky');
                } else {
                    this.progressLabel.textContent = readiness.message || 'Preparing scene rendering...';
                }
            }
            if (readiness.ready &&
                readiness.takramSkyRequested &&
                !readiness.takramSkyFailed &&
                !this.hasRuntimePhaseBeenVisibleFor('takram-sky', 'Preparing sky...', this.data.minimumSkyPhaseVisibleMs)) {
                return false;
            }
            return Boolean(readiness.ready);
        }

        const vrFeaturePolicy = typeof settingsComponent.getVrRuntimeFeaturePolicy === 'function'
            ? settingsComponent.getVrRuntimeFeaturePolicy()
            : null;
        const isVisibleTakramProfile = Boolean(vrFeaturePolicy && vrFeaturePolicy.takramVisibleSky);
        if (!isVisibleTakramProfile) {
            return true;
        }

        if (settingsComponent.data.postFXEngine !== 'pmndrs' ||
            typeof settingsComponent.isPmndrsAtmosphereEnabled !== 'function' ||
            !settingsComponent.isPmndrsAtmosphereEnabled()) {
            return true;
        }
        if (!window.VRODOS_TAKRAM_ATMOSPHERE) {
            return true;
        }

        if (typeof settingsComponent.prepareVrTakramVisibleSkyForReveal === 'function') {
            const ready = settingsComponent.prepareVrTakramVisibleSkyForReveal();
            if (!ready && this.progressLabel) {
                this.progressLabel.textContent = 'Preparing sky...';
            }
            return ready;
        }

        const atmosphereState = settingsComponent._pmndrsAtmosphereState || null;
        const material = atmosphereState && atmosphereState.skyMaterial ? atmosphereState.skyMaterial : null;
        const userData = material && material.userData ? material.userData : null;
        const ready = Boolean(atmosphereState && atmosphereState.ready && userData && userData.vrodosVrTakramSkyDirectShaderPatched && !userData.vrodosVrTakramSkyDirectPatchFailed);
        if (!ready && this.progressLabel) {
            this.progressLabel.textContent = "Preparing sky...";
        }
        return ready;
    },
    scheduleRuntimeReadyCheck: function () {
        if (this.runtimeReadyTimer) {
            return;
        }

        this.runtimeReadyTimer = window.setTimeout(() => {
            this.runtimeReadyTimer = null;
            this.maybeRevealScene();
        }, 120);
    },
    startLazyLoading: function () {
        if (this.lazyStarted || !this.lazyQueue.length) {
            return;
        }

        this.lazyStarted = true;
        this.scheduleLazyBatch(this.data.lazyBatchDelayMs);
    },
    scheduleLazyBatch: function (delayMs) {
        if (!this.lazyQueue.length || this.lazyScheduleTimer) {
            return;
        }

        const run = () => {
            this.lazyScheduleTimer = null;
            this.lazyScheduleIsIdle = false;
            this.loadLazyBatch();
        };

        const delay = Math.max(0, Number(delayMs) || 0);
        if (delay > 0) {
            this.lazyScheduleIsIdle = false;
            this.lazyScheduleTimer = window.setTimeout(run, delay);
            return;
        }

        if (typeof window.requestIdleCallback === 'function') {
            this.lazyScheduleIsIdle = true;
            this.lazyScheduleTimer = window.requestIdleCallback(run, { timeout: 750 });
            return;
        }

        this.lazyScheduleIsIdle = false;
        this.lazyScheduleTimer = window.setTimeout(run, 0);
    },
    loadLazyBatch: function () {
        const concurrency = Math.max(1, Number(this.data.lazyConcurrentLoads) || 1);

        while (this.lazyActiveCount < concurrency && this.lazyQueue.length) {
            this.startLazyTarget(this.lazyQueue.shift());
        }
    },
    startLazyTarget: function (target) {
        if (!target || target.getAttribute('data-vrodos-lazy-state') === 'loading' || target.hasAttribute('gltf-model')) {
            return;
        }

        const src = target.getAttribute('data-vrodos-lazy-gltf-src');
        if (!src) {
            this.lazyLoadedCount += 1;
            return;
        }

        this.lazyActiveCount += 1;
        target.setAttribute('data-vrodos-lazy-state', 'loading');
        target.addEventListener('model-loaded', this.boundHandleLazyModelReady, { once: true });
        target.addEventListener('model-error', this.boundHandleLazyModelReady, { once: true });
        target.setAttribute('gltf-model', src);
    },
    handleLazyModelReady: function (event) {
        const target = event && event.target ? event.target : null;
        if (target) {
            target.removeEventListener('model-loaded', this.boundHandleLazyModelReady);
            target.removeEventListener('model-error', this.boundHandleLazyModelReady);
            target.setAttribute('data-vrodos-lazy-state', event.type === 'model-error' ? 'error' : 'loaded');
            if (event.type === 'model-error') {
                console.warn('VRodos: optional lazy 3D asset failed after scene entry.', { id: target.id || '' });
                this.sceneEl.emit('vrodos-optional-asset-error', { id: target.id || '' }, false);
            }
        }

        this.lazyActiveCount = Math.max(0, this.lazyActiveCount - 1);
        this.lazyLoadedCount = Math.min(this.lazyTotalCount, this.lazyLoadedCount + 1);

        if (this.lazyQueue.length) {
            this.scheduleLazyBatch(this.data.lazyBatchDelayMs);
        }
    },
    revealScene: function () {
        if (this.isReady) {
            return;
        }

        this.isReady = true;
        if (this.runtimeReadyTimer) {
            window.clearTimeout(this.runtimeReadyTimer);
            this.runtimeReadyTimer = null;
        }

        this.revealTargets.forEach((target) => {
            target.setAttribute('visible', 'true');
            target.removeAttribute('data-vrodos-delayed-reveal');
        });

        const settingsComponent = this.sceneEl &&
            this.sceneEl.components &&
            this.sceneEl.components['scene-settings'];
        if (settingsComponent && typeof settingsComponent.markShadowDirty === 'function') {
            settingsComponent.markShadowDirty('scene-reveal');
        }

        if (this.loadingOverlay) {
            this.loadingOverlay.style.opacity = '0';
            this.loadingOverlay.style.pointerEvents = 'none';
            window.setTimeout(() => {
                if (this.loadingOverlay && this.loadingOverlay.parentNode) {
                    this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
                }
                this.loadingOverlay = null;
            }, 260);
        }

        this.sceneEl.emit('vrodos-scene-loader-ready', {
            revealTargets: this.revealTargets.length,
            lazyTargets: this.lazyTotalCount
        }, false);

        this.startLazyLoading();




    },
    remove: function () {
        this.sceneEl.removeEventListener('loaded', this.boundHandleSceneLoaded);
        this.sceneEl.removeEventListener('model-loaded', this.boundHandleModelLoaded);
        this.sceneEl.removeEventListener('model-error', this.boundHandleModelError);
        this.clearPendingAssets();
        if (this.lazyScheduleTimer) {
            if (this.lazyScheduleIsIdle && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(this.lazyScheduleTimer);
            } else {
                window.clearTimeout(this.lazyScheduleTimer);
            }
            this.lazyScheduleTimer = null;
        }
        if (this.runtimeReadyTimer) {
            window.clearTimeout(this.runtimeReadyTimer);
            this.runtimeReadyTimer = null;
        }
        this.lazyTargets.forEach((target) => {
            target.removeEventListener('model-loaded', this.boundHandleLazyModelReady);
            target.removeEventListener('model-error', this.boundHandleLazyModelReady);
        });
        const progressState = window.VRODOSSceneLoadProgress;
        if (progressState && Array.isArray(progressState.listeners)) {
            progressState.listeners = progressState.listeners.filter((listener) => listener !== this.boundHandleCriticalDownloadProgress);
        }

        if (this.loadingOverlay && this.loadingOverlay.parentNode) {
            this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
        }
    }
});
