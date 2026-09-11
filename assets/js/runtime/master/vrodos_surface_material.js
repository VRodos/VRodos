(function(root) {
    'use strict';

    const STATE_PROPERTY = '__vrodosSurfaceVariationState';
    const CACHE_KEY = 'vrodos-balanced-surface-variation-v1';

    function finiteNumber(value, fallback, minimum, maximum) {
        const number = Number(value);
        return Math.min(maximum, Math.max(minimum, Number.isFinite(number) ? number : fallback));
    }

    function seedFromString(value) {
        const text = String(value || 'vrodos-surface');
        let hash = 2166136261;
        for (let index = 0; index < text.length; index++) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0) / 4294967295;
    }

    function installPatch(material) {
        const previousCompile = typeof material.onBeforeCompile === 'function'
            ? material.onBeforeCompile
            : function() { return undefined; };
        const previousCacheKey = typeof material.customProgramCacheKey === 'function'
            ? material.customProgramCacheKey
            : function() { return ''; };
        const state = {
            enabled: true,
            scale: 32,
            strength: 0.12,
            seed: 0,
            uniforms: null
        };
        Object.defineProperty(material, STATE_PROPERTY, {
            value: state,
            configurable: true
        });

        material.onBeforeCompile = function(shader, renderer) {
            previousCompile.call(this, shader, renderer);
            shader.uniforms.vrodosVariationScale = { value: state.scale };
            shader.uniforms.vrodosVariationStrength = { value: state.enabled ? state.strength : 0 };
            shader.uniforms.vrodosVariationSeed = { value: state.seed };
            state.uniforms = shader.uniforms;

            shader.vertexShader = shader.vertexShader
                .replace(
                    '#include <common>',
                    '#include <common>\nvarying vec2 vVrodosSurfaceMeters;'
                )
                .replace(
                    '#include <begin_vertex>',
                    '#include <begin_vertex>\nvVrodosSurfaceMeters = position.xy;'
                );

            shader.fragmentShader = shader.fragmentShader
                .replace(
                    '#include <common>',
                    `#include <common>
varying vec2 vVrodosSurfaceMeters;
uniform float vrodosVariationScale;
uniform float vrodosVariationStrength;
uniform float vrodosVariationSeed;

float vrodosSurfaceHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32 + vrodosVariationSeed * 19.17);
    return fract(p.x * p.y);
}

float vrodosSurfaceNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(vrodosSurfaceHash(i), vrodosSurfaceHash(i + vec2(1.0, 0.0)), f.x),
        mix(vrodosSurfaceHash(i + vec2(0.0, 1.0)), vrodosSurfaceHash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}`
                )
                .replace(
                    'void main() {',
                    'void main() {\nfloat vrodosMacroVariation = 0.0;'
                )
                .replace(
                    '#include <map_fragment>',
                    `#include <map_fragment>
vrodosMacroVariation = 0.68 * vrodosSurfaceNoise(vVrodosSurfaceMeters / max(vrodosVariationScale, 0.001))
    + 0.32 * vrodosSurfaceNoise(vVrodosSurfaceMeters / max(vrodosVariationScale * 0.47, 0.001) + 17.0);
float vrodosVariationSigned = (vrodosMacroVariation - 0.5) * 2.0;
diffuseColor.rgb *= clamp(1.0 + vrodosVariationSigned * vrodosVariationStrength, 0.75, 1.25);`
                )
                .replace(
                    '#include <roughnessmap_fragment>',
                    `#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor + (vrodosMacroVariation - 0.5) * vrodosVariationStrength * 0.35, 0.0, 1.0);`
                );
        };
        material.customProgramCacheKey = function() {
            return `${previousCacheKey.call(this)}|${CACHE_KEY}`;
        };
        material.needsUpdate = true;
        return state;
    }

    function applyBalancedVariation(material, options) {
        if (!material) return null;
        const settings = options || {};
        if (!material[STATE_PROPERTY] && settings.enabled === false) return null;
        const state = material[STATE_PROPERTY] || installPatch(material);
        state.enabled = settings.enabled !== false;
        state.scale = finiteNumber(settings.scale, 32, 1, 10000);
        state.strength = finiteNumber(settings.strength, 0.12, 0, 0.5);
        state.seed = finiteNumber(settings.seed, 0, 0, 1);
        if (state.uniforms) {
            state.uniforms.vrodosVariationScale.value = state.scale;
            state.uniforms.vrodosVariationStrength.value = state.enabled ? state.strength : 0;
            state.uniforms.vrodosVariationSeed.value = state.seed;
        }
        return state;
    }

    root.VRODOSSurfaceMaterial = Object.freeze({
        applyBalancedVariation,
        seedFromString
    });
})(typeof window !== 'undefined' ? window : globalThis);
