/**
 * Local-only GPU/context diagnostics and desktop performance guidance.
 *
 * This helper deliberately inspects the WebGL context created by A-Frame. It
 * never creates a probe context and never changes authored rendering quality.
 */
(function () {
    window.VRODOSMaster = window.VRODOSMaster || {};

    const Master = window.VRODOSMaster;
    const Helpers = Master.SceneSettingsHelpers = Master.SceneSettingsHelpers || {};
    const Hardware = Master.HardwareDiagnostics = Master.HardwareDiagnostics || {};
    const REQUESTED_POWER_PREFERENCE = 'high-performance';
    const SETTLE_DURATION_MS = 3000;
    const SAMPLE_DURATION_MS = 8000;
    const MINIMUM_VALID_FRAMES = 120;
    const LOW_FPS_THRESHOLD = 45;
    const MAXIMUM_VALID_DELTA_MS = 250;
    const DISMISSAL_KEY = 'vrodos.desktopGpuAdvisory.dismissed';

    function stringValue(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function safeGetParameter(context, parameter) {
        if (!context || typeof context.getParameter !== 'function' || typeof parameter === 'undefined') {
            return null;
        }

        try {
            const value = context.getParameter(parameter);
            return typeof value === 'undefined' ? null : value;
        } catch (err) {
            return null;
        }
    }

    function readContextAttributes(context) {
        if (!context || typeof context.getContextAttributes !== 'function') {
            return null;
        }

        try {
            const attributes = context.getContextAttributes();
            if (!attributes) {
                return null;
            }

            const keys = [
                'alpha',
                'antialias',
                'depth',
                'desynchronized',
                'failIfMajorPerformanceCaveat',
                'powerPreference',
                'premultipliedAlpha',
                'preserveDrawingBuffer',
                'stencil',
                'xrCompatible'
            ];
            const result = {};
            keys.forEach(function (key) {
                if (Object.prototype.hasOwnProperty.call(attributes, key)) {
                    result[key] = attributes[key];
                }
            });
            return result;
        } catch (err) {
            return null;
        }
    }

    function getPlatformLabel() {
        const navigatorValue = typeof navigator !== 'undefined' ? navigator : null;
        if (!navigatorValue) {
            return '';
        }

        if (navigatorValue.userAgentData && navigatorValue.userAgentData.platform) {
            return navigatorValue.userAgentData.platform;
        }

        return navigatorValue.platform || navigatorValue.userAgent || '';
    }

    Hardware.classifyAdapter = window.VRODOSHardwareCapabilities.classifyAdapter;

    Hardware.createGpuState = function () {
        return {
            api: 'unavailable',
            requestedPowerPreference: REQUESTED_POWER_PREFERENCE,
            contextPowerPreference: null,
            vendor: '',
            renderer: '',
            informationSource: 'unavailable',
            adapterClass: 'unknown',
            confidence: 'none',
            softwareRendering: false,
            canForceAdapter: false,
            webglVersion: '',
            shadingLanguageVersion: '',
            contextAttributes: null,
            drawingBuffer: { width: 0, height: 0 },
            cssSize: { width: 0, height: 0 },
            devicePixelRatio: null,
            limits: {
                maxTextureSize: null,
                maxCubeMapTextureSize: null,
                maxRenderbufferSize: null,
                maxSamples: null,
                maxCombinedTextureImageUnits: null
            }
        };
    };

    Hardware.createPerformanceState = function (status) {
        return {
            status: status || 'waiting-for-scene',
            sampleDurationMs: 0,
            validFrameCount: 0,
            averageFps: null,
            p95FrameMs: null,
            sustainedLowFps: false,
            advisoryReason: ''
        };
    };

    Hardware.summarizePerformance = function (frameDeltas, durationMs) {
        const samples = Array.isArray(frameDeltas) ? frameDeltas.filter(function (delta) {
            return Number.isFinite(delta) && delta > 0 && delta <= MAXIMUM_VALID_DELTA_MS;
        }) : [];
        const totalDurationMs = Number.isFinite(durationMs)
            ? durationMs
            : samples.reduce(function (total, delta) { return total + delta; }, 0);
        const state = Hardware.createPerformanceState(
            samples.length >= MINIMUM_VALID_FRAMES ? 'complete' : 'insufficient-samples'
        );

        state.sampleDurationMs = Math.round(totalDurationMs);
        state.validFrameCount = samples.length;
        if (!samples.length) {
            return state;
        }

        const averageFrameMs = samples.reduce(function (total, delta) { return total + delta; }, 0) / samples.length;
        const sorted = samples.slice().sort(function (left, right) { return left - right; });
        const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
        state.averageFps = Math.round((1000 / averageFrameMs) * 10) / 10;
        state.p95FrameMs = Math.round(sorted[p95Index] * 10) / 10;
        state.sustainedLowFps = state.status === 'complete' && state.averageFps < LOW_FPS_THRESHOLD;
        return state;
    };

    Hardware.resolveAdvisoryReason = function (gpu, performance, debugForced) {
        const gpuState = gpu || Hardware.createGpuState();
        const performanceState = performance || Hardware.createPerformanceState();

        if (debugForced) {
            return 'debug-forced';
        }
        if (gpuState.softwareRendering || gpuState.adapterClass === 'software') {
            return 'software-rendering';
        }
        if (!performanceState.sustainedLowFps) {
            return '';
        }
        if (gpuState.adapterClass === 'integrated-likely') {
            return 'integrated-low-fps';
        }
        if (gpuState.adapterClass === 'unknown') {
            return 'unknown-low-fps';
        }
        return '';
    };

    Hardware.isDebugEnabled = function () {
        if (window.VRODOS_DEBUG && window.VRODOS_DEBUG.gpu === true) {
            return true;
        }

        try {
            const params = new URLSearchParams(window.location.search || '');
            const value = (params.get('vrodos_debug_gpu') || '').toLowerCase();
            return value === '1' || value === 'true';
        } catch (err) {
            return false;
        }
    };

    Hardware.canSample = function (conditions) {
        const state = conditions || {};
        return state.desktop !== false &&
            state.immersive !== true &&
            state.loaderReady === true &&
            state.visible !== false;
    };

    Hardware.shouldReuseAdvisory = function (state, reason) {
        return Boolean(state && state.banner && state.banner.parentNode && state.bannerReason === reason);
    };

    function readRendererDimensions(renderer, gpu) {
        const context = renderer && typeof renderer.getContext === 'function' ? renderer.getContext() : null;
        const canvas = renderer ? renderer.domElement : null;
        let cssWidth = canvas && Number.isFinite(canvas.clientWidth) ? canvas.clientWidth : 0;
        let cssHeight = canvas && Number.isFinite(canvas.clientHeight) ? canvas.clientHeight : 0;

        if (canvas && typeof canvas.getBoundingClientRect === 'function') {
            const bounds = canvas.getBoundingClientRect();
            cssWidth = Math.round(bounds.width || cssWidth || 0);
            cssHeight = Math.round(bounds.height || cssHeight || 0);
        }

        gpu.drawingBuffer = {
            width: context && Number.isFinite(context.drawingBufferWidth) ? context.drawingBufferWidth : 0,
            height: context && Number.isFinite(context.drawingBufferHeight) ? context.drawingBufferHeight : 0
        };
        gpu.cssSize = { width: cssWidth, height: cssHeight };
        gpu.devicePixelRatio = typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : null;
    }

    Hardware.readRendererState = function (renderer) {
        const gpu = Hardware.createGpuState();
        if (!renderer || typeof renderer.getContext !== 'function') {
            return gpu;
        }

        let context = null;
        try {
            context = renderer.getContext();
        } catch (err) {
            return gpu;
        }
        if (!context) {
            return gpu;
        }

        const attributes = readContextAttributes(context);
        const maskedVendor = stringValue(safeGetParameter(context, context.VENDOR));
        const maskedRenderer = stringValue(safeGetParameter(context, context.RENDERER));
        let vendor = maskedVendor;
        let rendererName = maskedRenderer;
        let informationSource = vendor || rendererName ? 'masked' : 'unavailable';

        try {
            const extension = typeof context.getExtension === 'function'
                ? context.getExtension('WEBGL_debug_renderer_info')
                : null;
            if (extension) {
                const unmaskedVendor = stringValue(safeGetParameter(context, extension.UNMASKED_VENDOR_WEBGL));
                const unmaskedRenderer = stringValue(safeGetParameter(context, extension.UNMASKED_RENDERER_WEBGL));
                if (unmaskedVendor || unmaskedRenderer) {
                    vendor = unmaskedVendor || vendor;
                    rendererName = unmaskedRenderer || rendererName;
                    informationSource = 'webgl-debug-renderer-info';
                }
            }
        } catch (err) {
            // The debug extension is optional and may be withheld for privacy.
        }

        const classification = Hardware.classifyAdapter({
            vendor,
            renderer: rendererName,
            platform: getPlatformLabel()
        });
        const isWebGl2 = Boolean(renderer.capabilities && renderer.capabilities.isWebGL2 === true);
        gpu.api = isWebGl2 ? 'WebGL 2' : 'WebGL 1';
        gpu.requestedPowerPreference = REQUESTED_POWER_PREFERENCE;
        gpu.contextPowerPreference = attributes && typeof attributes.powerPreference === 'string'
            ? attributes.powerPreference
            : null;
        gpu.vendor = vendor;
        gpu.renderer = rendererName;
        gpu.informationSource = informationSource;
        gpu.adapterClass = classification.adapterClass;
        gpu.confidence = classification.confidence;
        gpu.softwareRendering = classification.softwareRendering;
        gpu.webglVersion = stringValue(safeGetParameter(context, context.VERSION));
        gpu.shadingLanguageVersion = stringValue(safeGetParameter(context, context.SHADING_LANGUAGE_VERSION));
        gpu.contextAttributes = attributes;
        gpu.limits = {
            maxTextureSize: safeGetParameter(context, context.MAX_TEXTURE_SIZE),
            maxCubeMapTextureSize: safeGetParameter(context, context.MAX_CUBE_MAP_TEXTURE_SIZE),
            maxRenderbufferSize: safeGetParameter(context, context.MAX_RENDERBUFFER_SIZE),
            maxSamples: typeof context.MAX_SAMPLES === 'undefined' ? null : safeGetParameter(context, context.MAX_SAMPLES),
            maxCombinedTextureImageUnits: safeGetParameter(context, context.MAX_COMBINED_TEXTURE_IMAGE_UNITS)
        };
        readRendererDimensions(renderer, gpu);
        return gpu;
    };

    function isDesktop(component) {
        return !component || typeof component.getVrRuntimeProfile !== 'function' || component.getVrRuntimeProfile() === 'desktop';
    }

    function isImmersive(component) {
        return Boolean(component && typeof component.isVrPresentationActive === 'function' && component.isVrPresentationActive());
    }

    function isDocumentVisible() {
        return typeof document.visibilityState === 'undefined' || document.visibilityState === 'visible';
    }

    function readDismissal() {
        try {
            return window.sessionStorage.getItem(DISMISSAL_KEY) === '1';
        } catch (err) {
            return false;
        }
    }

    function storeDismissal() {
        try {
            window.sessionStorage.setItem(DISMISSAL_KEY, '1');
        } catch (err) {
            // A blocked sessionStorage should not break the compiled runtime.
        }
    }

    Hardware.dismissalKey = DISMISSAL_KEY;
    Hardware.readSessionDismissal = readDismissal;
    Hardware.storeSessionDismissal = storeDismissal;

    function adapterLabel(gpu) {
        return gpu.renderer || gpu.vendor || 'Adapter details unavailable';
    }

    function formatMetric(value, suffix) {
        return Number.isFinite(value) ? `${value}${suffix || ''}` : 'not sampled';
    }

    function addSteps(container) {
        const steps = document.createElement('ol');
        steps.style.margin = '10px 0 0 20px';
        steps.style.padding = '0';
        steps.style.display = 'none';
        steps.style.lineHeight = '1.5';
        [
            'Open Settings → System → Display → Graphics.',
            'Add the active browser executable.',
            'Select Options → High performance.',
            'Fully exit every browser process and reopen it.',
            'Verify browser hardware acceleration, AC power, and an appropriate Windows/OEM performance mode.',
            'Use NVIDIA Control Panel only when Windows has no application preference.'
        ].forEach(function (label) {
            const item = document.createElement('li');
            item.textContent = label;
            steps.appendChild(item);
        });
        container.appendChild(steps);
        return steps;
    }

    function removeAdvisory(state) {
        if (state && state.banner && state.banner.parentNode) {
            state.banner.parentNode.removeChild(state.banner);
        }
        if (state) {
            state.banner = null;
            state.bannerReason = '';
            state.bannerMetrics = null;
        }
    }

    function updateAdvisoryMetrics(state) {
        if (!state || !state.bannerMetrics) {
            return;
        }

        const gpu = state.gpu;
        const performance = state.performance;
        const buffer = gpu.drawingBuffer || {};
        state.bannerMetrics.textContent = `Adapter: ${adapterLabel(gpu)} · Average: ${formatMetric(performance.averageFps, ' FPS')} · Buffer: ${buffer.width || 0}×${buffer.height || 0}`;
    }

    function showAdvisory(component, reason) {
        const state = component._vrodosHardwareDiagnostics;
        if (!state || state.dismissed || !isDesktop(component) || isImmersive(component)) {
            removeAdvisory(state);
            return;
        }

        const ui = window.VRODOSMasterUI;
        const host = ui && typeof ui.ensureOverlayHost === 'function' ? ui.ensureOverlayHost() : document.body;
        if (!host) {
            return;
        }

        if (Hardware.shouldReuseAdvisory(state, reason)) {
            updateAdvisoryMetrics(state);
            return;
        }

        removeAdvisory(state);
        const banner = document.createElement('aside');
        banner.id = 'vrodos-gpu-advisory';
        banner.setAttribute('role', 'status');
        banner.style.position = 'absolute';
        banner.style.top = '16px';
        banner.style.right = '16px';
        banner.style.width = 'min(430px, calc(100vw - 32px))';
        banner.style.boxSizing = 'border-box';
        banner.style.padding = '16px';
        banner.style.border = '1px solid rgba(251, 191, 36, 0.8)';
        banner.style.borderRadius = '12px';
        banner.style.background = 'rgba(17, 24, 39, 0.96)';
        banner.style.color = '#f9fafb';
        banner.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.35)';
        banner.style.font = '14px/1.4 system-ui, sans-serif';
        banner.style.pointerEvents = 'auto';

        const title = document.createElement('strong');
        title.style.display = 'block';
        title.style.fontSize = '16px';
        title.textContent = reason === 'software-rendering'
            ? 'Software rendering is active'
            : 'Desktop rendering may be GPU-limited';
        banner.appendChild(title);

        const message = document.createElement('p');
        message.style.margin = '8px 0';
        if (reason === 'integrated-low-fps') {
            message.textContent = 'The browser reports an integrated Intel adapter and sustained low frame rate. Windows may be routing this browser to power-saving graphics.';
        } else if (reason === 'unknown-low-fps') {
            message.textContent = 'The adapter could not be identified reliably and the measured frame rate is low. Check the browser GPU assignment before changing scene quality.';
        } else if (reason === 'software-rendering') {
            message.textContent = 'The WebGL renderer reports a software adapter. Hardware acceleration or the browser GPU assignment needs attention.';
        } else {
            message.textContent = 'GPU diagnostics are being shown because VRodos GPU debug mode is enabled.';
        }
        banner.appendChild(message);

        const metrics = document.createElement('div');
        metrics.style.fontSize = '12px';
        metrics.style.color = '#d1d5db';
        banner.appendChild(metrics);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        actions.style.marginTop = '12px';
        const stepsButton = document.createElement('button');
        stepsButton.type = 'button';
        stepsButton.className = 'tw-btn tw-btn-sm';
        stepsButton.textContent = 'Show steps';
        const dismissButton = document.createElement('button');
        dismissButton.type = 'button';
        dismissButton.className = 'tw-btn tw-btn-sm tw-btn-ghost';
        dismissButton.textContent = 'Dismiss';
        actions.appendChild(stepsButton);
        actions.appendChild(dismissButton);
        banner.appendChild(actions);

        const steps = addSteps(banner);
        stepsButton.addEventListener('click', function () {
            const show = steps.style.display === 'none';
            steps.style.display = show ? 'block' : 'none';
            stepsButton.textContent = show ? 'Hide steps' : 'Show steps';
        });
        dismissButton.addEventListener('click', function () {
            state.dismissed = true;
            storeDismissal();
            removeAdvisory(state);
        });

        host.appendChild(banner);
        state.banner = banner;
        state.bannerReason = reason;
        state.bannerMetrics = metrics;
        updateAdvisoryMetrics(state);
    }

    function showQualityRecommendation(component, target, direction) {
        const state = component._vrodosHardwareDiagnostics;
        if (!state || state.dismissed || !target || isImmersive(component)) return;
        const reason = `quality-${direction}-${target}`;
        if (Hardware.shouldReuseAdvisory(state, reason)) return;
        removeAdvisory(state);
        const ui = window.VRODOSMasterUI;
        const host = ui && typeof ui.ensureOverlayHost === 'function' ? ui.ensureOverlayHost() : document.body;
        if (!host) return;

        const banner = document.createElement('aside');
        banner.id = 'vrodos-quality-recommendation';
        banner.setAttribute('role', 'status');
        banner.style.cssText = 'position:absolute;top:16px;right:16px;width:min(390px,calc(100vw - 32px));box-sizing:border-box;padding:16px;border:1px solid rgba(16,185,129,.75);border-radius:12px;background:rgba(17,24,39,.96);color:#f9fafb;box-shadow:0 16px 40px rgba(0,0,0,.35);font:14px/1.4 system-ui,sans-serif;pointer-events:auto;';
        const title = document.createElement('strong');
        title.style.display = 'block';
        title.textContent = direction === 'down' ? 'A lower quality profile is recommended' : 'This device can try a higher quality profile';
        const message = document.createElement('p');
        message.style.margin = '8px 0 12px';
        message.textContent = direction === 'down'
            ? `The settled frame-rate sample is below the target. Switch to ${target} for smoother playback?`
            : `The settled frame-rate sample has clear headroom. Try ${target}?`;
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:8px;';
        const apply = document.createElement('button');
        apply.type = 'button';
        apply.className = 'tw-btn tw-btn-sm tw-btn-primary';
        apply.textContent = `Use ${target}`;
        const keep = document.createElement('button');
        keep.type = 'button';
        keep.className = 'tw-btn tw-btn-sm tw-btn-ghost';
        keep.textContent = 'Keep current';
        apply.addEventListener('click', function () {
            const manifest = window.VRODOS_DESKTOP_PROFILE_MANIFEST || {};
            try { window.localStorage.setItem(manifest.storageKey || 'vrodos.desktopQualityOverride.v1', target); } catch (error) { /* Storage is optional. */ }
            window.location.reload();
        });
        keep.addEventListener('click', function () {
            state.dismissed = true;
            storeDismissal();
            removeAdvisory(state);
        });
        actions.appendChild(apply);
        actions.appendChild(keep);
        banner.appendChild(title);
        banner.appendChild(message);
        banner.appendChild(actions);
        host.appendChild(banner);
        state.banner = banner;
        state.bannerReason = reason;
    }

    function evaluateProfilePerformance(component) {
        const state = component && component._vrodosHardwareDiagnostics;
        const active = window.VRODOS_ACTIVE_DESKTOP_PROFILE;
        if (!state || !active || state.performance.status !== 'complete' || active.source === 'query') return;
        const manifest = window.VRODOS_DESKTOP_PROFILE_MANIFEST || {};
        if (manifest.buildMode !== 'adaptive') {
            state.recommendation = null;
            return;
        }
        const available = Object.keys(manifest.profiles || {});
        if (available.length < 2) {
            state.recommendation = null;
            return;
        }
        const rules = manifest.selection || {};
        const averageFps = Number(state.performance.averageFps);
        const p95 = Number(state.performance.p95FrameMs);
        const poor = averageFps < Number(rules.downgradeAverageFps || 45) || p95 > Number(rules.downgradeP95FrameMs || 33);
        const order = ['low', 'medium', 'high'];
        const index = order.indexOf(active.id);
        state.recommendation = null;
        if (poor && index > 0) {
            const desiredTarget = averageFps < Number(rules.severeAverageFps || 28) ? 'low' : order[index - 1];
            const target = order.slice(0, index).reverse().find(function (profile) {
                return available.indexOf(profile) !== -1 && order.indexOf(profile) <= order.indexOf(desiredTarget);
            });
            if (!target) return;
            state.recommendation = { direction: 'down', target };
            if (active.source === 'auto') {
                const key = (window.VRODOS_DESKTOP_PROFILE_MANIFEST || {}).sessionDowngradeKey || 'vrodos.desktopQualityDowngrade.v1';
                let alreadyDowngraded = false;
                try { alreadyDowngraded = Boolean(window.sessionStorage.getItem(key)); } catch (error) { alreadyDowngraded = true; }
                if (!alreadyDowngraded) {
                    try { window.sessionStorage.setItem(key, target); } catch (error) { return; }
                    window.location.reload();
                    return;
                }
            }
            showQualityRecommendation(component, target, 'down');
            return;
        }
        if (!poor && averageFps >= 58 && p95 <= 20 && index >= 0 && index < order.length - 1) {
            const target = order.slice(index + 1).find(function (profile) { return available.indexOf(profile) !== -1; });
            if (!target) return;
            state.recommendation = { direction: 'up', target };
            showQualityRecommendation(component, target, 'up');
        }
    }

    function publish(component, reason) {
        if (component && typeof component.publishRuntimeFeatureState === 'function') {
            component.publishRuntimeFeatureState(reason || 'gpu-diagnostics');
        }
    }

    function logDiagnostics(component, reason) {
        const state = component && component._vrodosHardwareDiagnostics;
        if (!state || !state.debugForced || typeof console === 'undefined' || typeof console.info !== 'function') {
            return;
        }

        console.info('[VRodos][GPU diagnostics]', reason, {
            gpu: state.gpu,
            performance: state.performance,
            desktopProfile: state.profile,
            recommendation: state.recommendation,
            estimatedTextureMemoryMiB: state.profile && state.profile.assets
                ? state.profile.assets.estimatedTextureMemoryMiB
                : null,
            loadedChunks: state.profile && Array.isArray(state.profile.chunkIds) ? state.profile.chunkIds : [],
            downgradeStatus: state.profile && state.profile.reason === 'session-downgrade'
                ? 'session-downgrade'
                : 'none',
            canForceAdapter: false
        });
    }

    function evaluateAdvisory(component) {
        const state = component && component._vrodosHardwareDiagnostics;
        if (!state) {
            return;
        }

        const reason = Hardware.resolveAdvisoryReason(state.gpu, state.performance, state.debugForced);
        state.performance.advisoryReason = reason;
        if (reason) {
            showAdvisory(component, reason);
        } else {
            removeAdvisory(state);
        }
    }

    function resetSampling(component, reason) {
        const state = component._vrodosHardwareDiagnostics;
        state.settleDurationMs = 0;
        state.sampleDurationMs = 0;
        state.frameDeltas = [];
        state.performance = Hardware.createPerformanceState(state.loaderReady ? 'settling' : 'waiting-for-scene');
        evaluateAdvisory(component);
        publish(component, reason || 'gpu-sampling-reset');
    }

    function refreshGpuState(component, reason) {
        const state = component._vrodosHardwareDiagnostics;
        state.gpu = Hardware.readRendererState(component.el && component.el.renderer);
        evaluateAdvisory(component);
        publish(component, reason || 'gpu-context');
        logDiagnostics(component, reason || 'gpu-context');
    }

    Helpers.initializeHardwareDiagnostics = function () {
        const loader = this.el && this.el.components ? this.el.components['vrodos-scene-loader'] : null;
        const debugForced = Hardware.isDebugEnabled();
        this._vrodosHardwareDiagnostics = {
            gpu: Hardware.readRendererState(this.el && this.el.renderer),
            performance: Hardware.createPerformanceState(loader && loader.isReady ? 'settling' : 'waiting-for-scene'),
            loaderReady: Boolean(loader && loader.isReady),
            settleDurationMs: 0,
            sampleDurationMs: 0,
            frameDeltas: [],
            debugForced,
            dismissed: debugForced ? false : readDismissal(),
            banner: null,
            profile: window.VRODOS_ACTIVE_DESKTOP_PROFILE || null,
            recommendation: null
        };

        const handleLoaderReady = function () {
            const state = this._vrodosHardwareDiagnostics;
            if (!state) {
                return;
            }
            state.loaderReady = true;
            resetSampling(this, 'gpu-scene-ready');
        }.bind(this);
        const handleContextRestored = function () {
            refreshGpuState(this, 'gpu-context-restored');
            resetSampling(this, 'gpu-context-restored-sampling');
        }.bind(this);
        const handlePresentationChange = function () {
            evaluateAdvisory(this);
        }.bind(this);
        const canvas = this.el
            ? (this.el.canvas || (this.el.renderer && this.el.renderer.domElement))
            : null;

        if (this.runtimeResources && typeof this.runtimeResources.listen === 'function') {
            this.runtimeResources.listen(this.el, 'vrodos-scene-loader-ready', handleLoaderReady);
            if (canvas) {
                this.runtimeResources.listen(canvas, 'webglcontextrestored', handleContextRestored);
            }
            this.runtimeResources.listen(this.el, 'enter-vr', handlePresentationChange);
            this.runtimeResources.listen(this.el, 'exit-vr', handlePresentationChange);
        } else if (this.el && typeof this.el.addEventListener === 'function') {
            this.el.addEventListener('vrodos-scene-loader-ready', handleLoaderReady);
            this._vrodosHardwareDiagnostics.manualListeners = [
                { target: this.el, type: 'vrodos-scene-loader-ready', handler: handleLoaderReady }
            ];
            if (canvas && typeof canvas.addEventListener === 'function') {
                canvas.addEventListener('webglcontextrestored', handleContextRestored);
                this._vrodosHardwareDiagnostics.manualListeners.push({
                    target: canvas,
                    type: 'webglcontextrestored',
                    handler: handleContextRestored
                });
            }
        }

        evaluateAdvisory(this);
        logDiagnostics(this, 'initialized');
    };

    Helpers.getHardwareDiagnosticsState = function () {
        const state = this._vrodosHardwareDiagnostics;
        if (!state) {
            return {
                gpu: Hardware.createGpuState(),
                performance: Hardware.createPerformanceState('unavailable')
            };
        }

        if (this.el && this.el.renderer) {
            readRendererDimensions(this.el.renderer, state.gpu);
        }
        return { gpu: state.gpu, performance: state.performance, profile: state.profile, recommendation: state.recommendation };
    };

    Helpers.updateHardwarePerformanceDiagnostics = function (time, timeDelta) {
        const state = this._vrodosHardwareDiagnostics;
        if (!state) {
            return;
        }

        if (state.gpu.api === 'unavailable' && this.el && this.el.renderer) {
            refreshGpuState(this, 'gpu-renderer-available');
        }

        const immersive = isImmersive(this);
        if (!Hardware.canSample({
            desktop: isDesktop(this),
            immersive,
            loaderReady: state.loaderReady,
            visible: isDocumentVisible()
        })) {
            if (immersive) {
                removeAdvisory(state);
            }
            return;
        }

        if (state.performance.status === 'complete' || state.performance.status === 'insufficient-samples') {
            evaluateAdvisory(this);
            evaluateProfilePerformance(this);
            return;
        }

        const delta = Number(timeDelta);
        if (!Number.isFinite(delta) || delta <= 0 || delta > MAXIMUM_VALID_DELTA_MS) {
            return;
        }

        if (state.settleDurationMs < SETTLE_DURATION_MS) {
            state.settleDurationMs += delta;
            state.performance.status = 'settling';
            if (state.settleDurationMs < SETTLE_DURATION_MS) {
                return;
            }
            state.performance.status = 'sampling';
            publish(this, 'gpu-sampling-started');
            return;
        }

        state.sampleDurationMs += delta;
        state.frameDeltas.push(delta);
        state.performance.status = 'sampling';
        state.performance.sampleDurationMs = Math.round(state.sampleDurationMs);
        state.performance.validFrameCount = state.frameDeltas.length;
        if (state.sampleDurationMs < SAMPLE_DURATION_MS) {
            return;
        }

        state.performance = Hardware.summarizePerformance(state.frameDeltas, state.sampleDurationMs);
        evaluateAdvisory(this);
        evaluateProfilePerformance(this);
        publish(this, 'gpu-sampling-complete');
        logDiagnostics(this, 'sampling-complete');
    };

    Helpers.disposeHardwareDiagnostics = function () {
        const state = this._vrodosHardwareDiagnostics;
        if (!state) {
            return;
        }

        removeAdvisory(state);
        if (Array.isArray(state.manualListeners)) {
            state.manualListeners.forEach(function (listener) {
                if (listener.target && typeof listener.target.removeEventListener === 'function') {
                    listener.target.removeEventListener(listener.type, listener.handler);
                }
            });
        }
        this._vrodosHardwareDiagnostics = null;
    };
}());
