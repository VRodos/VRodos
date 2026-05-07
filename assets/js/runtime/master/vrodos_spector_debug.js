/**
 * Debug-only Spector.js integration for compiled VRodos runtimes.
 *
 * Normal URLs do nothing. Add ?vrodos_spector=1 to load the standalone
 * Spector bundle and expose window.VRODOS_SPECTOR for manual WebGL captures.
 */
(function () {
    const SPECTOR_CDN_URL = 'https://cdn.jsdelivr.net/npm/spectorjs@0.9.30/dist/spector.bundle.js';

    function isSpectorDebugEnabled() {
        if (window.VRODOS_DEBUG && window.VRODOS_DEBUG.spector === true) {
            return true;
        }

        if (!window.location || !window.location.search) {
            return false;
        }

        try {
            return new URLSearchParams(window.location.search).get('vrodos_spector') === '1';
        } catch (error) {
            return false;
        }
    }

    function whenBodyReady(callback) {
        if (document.body) {
            callback();
            return;
        }

        document.addEventListener('DOMContentLoaded', callback, { once: true });
    }

    function loadSpectorScript() {
        if (window.SPECTOR && window.SPECTOR.Spector) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-vrodos-spector-debug="true"]');
            if (existing) {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => reject(new Error('Spector.js failed to load.')), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = SPECTOR_CDN_URL;
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.dataset.vrodosSpectorDebug = 'true';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Spector.js failed to load.'));
            (document.head || document.documentElement).appendChild(script);
        });
    }

    function startSpectorDebugMode() {
        whenBodyReady(() => {
            try {
                const spector = window.VRODOS_SPECTOR || new window.SPECTOR.Spector();
                window.VRODOS_SPECTOR = spector;

                if (!window.VRODOS_SPECTOR_CANVAS_SPY_ACTIVE && typeof spector.spyCanvases === 'function') {
                    spector.spyCanvases();
                    window.VRODOS_SPECTOR_CANVAS_SPY_ACTIVE = true;
                }

                if (!window.VRODOS_SPECTOR_UI_ACTIVE && typeof spector.displayUI === 'function') {
                    spector.displayUI();
                    window.VRODOS_SPECTOR_UI_ACTIVE = true;
                }

                console.info('[VRodos] Spector.js debug mode ready. Use window.VRODOS_SPECTOR for captures.');
            } catch (error) {
                console.warn('[VRodos] Spector.js debug mode failed to initialize:', error);
            }
        });
    }

    if (!isSpectorDebugEnabled()) {
        return;
    }

    loadSpectorScript()
        .then(startSpectorDebugMode)
        .catch((error) => {
            console.warn('[VRodos] Spector.js debug mode could not load:', error);
        });
}());
