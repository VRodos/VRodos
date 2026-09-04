/** Tiny dependency-free capability probe shared by bootstrap and diagnostics. */
(function () {
    window.VRODOSHardwareCapabilities = window.VRODOSHardwareCapabilities || {};
    const Capabilities = window.VRODOSHardwareCapabilities;

    function stringValue(value) { return typeof value === 'string' ? value.trim() : ''; }
    function platformLabel() {
        if (typeof navigator === 'undefined') return '';
        return (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '';
    }

    Capabilities.classifyAdapter = function (details) {
        const source = details || {};
        const label = `${stringValue(source.vendor)} ${stringValue(source.renderer)}`.toLowerCase();
        const windows = /windows|win32|win64/i.test(source.platform || platformLabel());
        if (/swiftshader|llvmpipe|lavapipe|software rasterizer|microsoft basic render driver/.test(label)) {
            return { adapterClass: 'software', confidence: 'high', softwareRendering: true };
        }
        if (/apple/.test(label) && /(apple\s+m\d|apple\s+gpu|metal)/.test(label)) {
            return { adapterClass: 'unified', confidence: 'high', softwareRendering: false };
        }
        if (/nvidia|geforce|quadro|rtx|gtx|intel.*arc|arc.*intel/.test(label)) {
            return { adapterClass: 'discrete-likely', confidence: /intel/.test(label) ? 'medium' : 'high', softwareRendering: false };
        }
        if (windows && /intel/.test(label) && /\b(hd|uhd|iris|graphics family)\b/.test(label)) {
            return { adapterClass: 'integrated-likely', confidence: 'medium', softwareRendering: false };
        }
        if (/radeon\s+(rx|pro)|firepro/.test(label)) {
            return { adapterClass: 'discrete-likely', confidence: 'medium', softwareRendering: false };
        }
        return { adapterClass: 'unknown', confidence: label.trim() ? 'low' : 'none', softwareRendering: false };
    };

    function compileShader(context, type, source) {
        const shader = context.createShader(type);
        context.shaderSource(shader, source);
        context.compileShader(shader);
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
            context.deleteShader(shader);
            return null;
        }
        return shader;
    }

    Capabilities.probe = function (selection) {
        const rules = selection || {};
        const state = {
            webgl2: false, majorPerformanceCaveat: false, vendor: '', renderer: '', informationSource: 'unavailable',
            adapterClass: 'unknown', confidence: 'none', softwareRendering: false, maxTextureSize: null,
            deviceMemoryGiB: typeof navigator !== 'undefined' && Number.isFinite(navigator.deviceMemory) ? navigator.deviceMemory : null,
            hardwareConcurrency: typeof navigator !== 'undefined' && Number.isFinite(navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : null,
            medianFrameMs: null
        };
        if (typeof document === 'undefined') return state;
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        let context = null;
        try {
            context = canvas.getContext('webgl2', {
                powerPreference: 'high-performance', failIfMajorPerformanceCaveat: true,
                antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false
            });
        } catch (error) {
            state.majorPerformanceCaveat = true;
        }
        if (!context) return state;

        state.webgl2 = true;
        state.maxTextureSize = context.getParameter(context.MAX_TEXTURE_SIZE);
        state.vendor = stringValue(context.getParameter(context.VENDOR));
        state.renderer = stringValue(context.getParameter(context.RENDERER));
        state.informationSource = state.vendor || state.renderer ? 'masked' : 'unavailable';
        try {
            const info = context.getExtension('WEBGL_debug_renderer_info');
            if (info) {
                state.vendor = stringValue(context.getParameter(info.UNMASKED_VENDOR_WEBGL)) || state.vendor;
                state.renderer = stringValue(context.getParameter(info.UNMASKED_RENDERER_WEBGL)) || state.renderer;
                state.informationSource = 'webgl-debug-renderer-info';
            }
        } catch (error) {
            // Adapter details may be withheld for privacy.
        }
        Object.assign(state, Capabilities.classifyAdapter({ vendor: state.vendor, renderer: state.renderer, platform: platformLabel() }));

        const vertex = compileShader(context, context.VERTEX_SHADER, '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
        const fragment = compileShader(context, context.FRAGMENT_SHADER, '#version 300 es\nprecision highp float;out vec4 c;void main(){vec2 p=gl_FragCoord.xy/256.;float v=0.;for(int i=0;i<24;i++){v+=sin(p.x*float(i+1))*cos(p.y*float(i+1));}c=vec4(fract(v),p,1.);}');
        const program = vertex && fragment ? context.createProgram() : null;
        if (program) {
            context.attachShader(program, vertex);
            context.attachShader(program, fragment);
            context.linkProgram(program);
        }
        if (program && context.getProgramParameter(program, context.LINK_STATUS)) {
            const buffer = context.createBuffer();
            context.bindBuffer(context.ARRAY_BUFFER, buffer);
            context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), context.STATIC_DRAW);
            const location = context.getAttribLocation(program, 'p');
            context.enableVertexAttribArray(location);
            context.vertexAttribPointer(location, 2, context.FLOAT, false, 0, 0);
            context.useProgram(program);
            const frameTimes = [];
            const deadline = performance.now() + Math.max(100, Math.min(500, Number(rules.benchmarkDurationMs) || 450));
            while (performance.now() < deadline) {
                const started = performance.now();
                for (let draw = 0; draw < 48; draw += 1) context.drawArrays(context.TRIANGLES, 0, 3);
                context.finish();
                frameTimes.push(performance.now() - started);
            }
            frameTimes.sort(function (left, right) { return left - right; });
            state.medianFrameMs = frameTimes.length ? frameTimes[Math.floor(frameTimes.length / 2)] : null;
            context.deleteBuffer(buffer);
            context.deleteProgram(program);
        }
        if (vertex) context.deleteShader(vertex);
        if (fragment) context.deleteShader(fragment);
        const lose = context.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
        return state;
    };

    function safeStorage(storage, method, key, value) {
        try { return storage && typeof storage[method] === 'function' ? storage[method](key, value) : null; } catch (error) { return null; }
    }

    Capabilities.selectProfile = function (manifest) {
        if (!manifest || manifest.buildMode !== 'adaptive') {
            throw new Error('[VRodos] Hardware profile selection requires an adaptive desktop manifest.');
        }
        const availableProfiles = Object.keys(manifest.profiles || {}).filter(function (profile) { return ['low', 'medium', 'high'].includes(profile); });
        const valid = ['auto'].concat(availableProfiles);
        let query = '';
        try { query = new URLSearchParams(window.location.search || '').get(manifest.queryParameter || 'vrodos_quality') || ''; } catch (error) { query = ''; }
        query = String(query).toLowerCase();
        const stored = String(safeStorage(window.localStorage, 'getItem', manifest.storageKey || 'vrodos.desktopQualityOverride.v1') || 'auto').toLowerCase();
        const requested = valid.indexOf(query) !== -1 ? query : (valid.indexOf(stored) !== -1 ? stored : 'auto');
        const source = valid.indexOf(query) !== -1 ? 'query' : (requested !== 'auto' ? 'saved-override' : 'auto');
        if (requested !== 'auto') return { profile: requested, requested, source, reason: source, probe: null };
        const rules = manifest.selection || {};
        const probe = Capabilities.probe(rules);
        let profile = 'medium';
        let reason = 'balanced-capability';
        if (!probe.webgl2 || probe.majorPerformanceCaveat || probe.softwareRendering || probe.adapterClass === 'unknown' ||
            (Number.isFinite(probe.deviceMemoryGiB) && probe.deviceMemoryGiB <= Number(rules.lowDeviceMemoryGiB || 4)) ||
            (Number.isFinite(probe.maxTextureSize) && probe.maxTextureSize < Number(rules.minimumTextureSize || 8192)) ||
            !Number.isFinite(probe.medianFrameMs) || probe.medianFrameMs > Number(rules.lowFrameMs || 18)) {
            profile = 'low';
            reason = 'conservative-low-capability';
        } else if ((probe.adapterClass === 'discrete-likely' || probe.adapterClass === 'unified') &&
            probe.medianFrameMs <= Number(rules.highFrameMs || 8) &&
            (!Number.isFinite(probe.deviceMemoryGiB) || probe.deviceMemoryGiB >= Number(rules.highDeviceMemoryGiB || 8)) &&
            (!Number.isFinite(probe.hardwareConcurrency) || probe.hardwareConcurrency >= Number(rules.highHardwareConcurrency || 8))) {
            profile = 'high';
            reason = 'high-capability';
        }
        const downgrade = String(safeStorage(window.sessionStorage, 'getItem', manifest.sessionDowngradeKey || 'vrodos.desktopQualityDowngrade.v1') || '').toLowerCase();
        const rank = { low: 0, medium: 1, high: 2 };
        if (Object.prototype.hasOwnProperty.call(rank, downgrade) && rank[downgrade] < rank[profile]) {
            profile = downgrade;
            reason = 'session-downgrade';
        }
        return { profile, requested, source, reason, probe };
    };

    Capabilities.bootstrap = function (manifest) {
        const decision = Capabilities.selectProfile(manifest || {});
        const profile = manifest.profiles && manifest.profiles[decision.profile]
            ? manifest.profiles[decision.profile]
            : manifest.profiles[Object.keys(manifest.profiles || {})[0]];
        window.VRODOS_DESKTOP_PROFILE_MANIFEST = manifest;
        window.VRODOS_ACTIVE_DESKTOP_PROFILE = Object.assign({}, profile, decision, { id: decision.profile });
        document.write((manifest.loaders && manifest.loaders[decision.profile]) || '');
        return window.VRODOS_ACTIVE_DESKTOP_PROFILE;
    };
}());
