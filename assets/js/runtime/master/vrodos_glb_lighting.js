'use strict';

(function initVrodosGlbLighting(global) {
    const EXTREME_LIGHT_INTENSITY = 1000;
    const TOTAL_LIGHT_BUDGET = 1200;
    const LOCAL_LIGHT_BUDGET = 200;
    const DIRECTIONAL_LIGHT_BUDGET = 2.5;

    function normalize(root) {
        if (!root || typeof root.traverse !== 'function') return null;

        const lights = [];
        root.traverse((node) => {
            if (
                (node.isPointLight || node.isSpotLight || node.isDirectionalLight) &&
                Number.isFinite(node.intensity) && node.intensity > 0 &&
                !(node.userData && node.userData.vrodosGlbLightNormalized)
            ) {
                lights.push(node);
            }
        });
        if (!lights.length) return null;

        const maximum = lights.reduce((value, light) => Math.max(value, light.intensity), 0);
        if (maximum < EXTREME_LIGHT_INTENSITY) return null;

        const total = lights.reduce((sum, light) => sum + light.intensity, 0);
        const scale = Math.min(1, TOTAL_LIGHT_BUDGET / total, LOCAL_LIGHT_BUDGET / maximum);
        lights.forEach((light) => {
            const original = light.intensity;
            light.intensity = Math.min(original * scale,
                light.isDirectionalLight ? DIRECTIONAL_LIGHT_BUDGET : LOCAL_LIGHT_BUDGET);
            light.userData = Object.assign({}, light.userData, {
                vrodosGlbLightNormalized: true,
                vrodosGlbLightOriginalIntensity: original
            });
        });
        return { count: lights.length, originalTotal: total, scale };
    }

    global.VRODOSGlbLighting = { normalize };
})(window);
