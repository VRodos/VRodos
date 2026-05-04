/**
 * VRodos Composite Shader — Final post-FX compositing pass
 * Combines AO, SSR, bloom, color grading, vignette, and exposure.
 *
 * Feature flags (passed via `features` object at creation time) compile out
 * disabled paths entirely using `#define` — disabled effects consume zero
 * texture bandwidth and zero ALU. Since post-FX settings are static per
 * session, this is a safe compile-time specialization.
 *
 * Accepted features: { sao, ssr, bloom, colorGrading, vignette }
 */
(function () {
    var VRODOSMaster = window.VRODOSMaster || (window.VRODOSMaster = {});

    function vrodosCreatePhotorealPostMaterial(features) {
        features = features || {};
        var defines = {};
        if (features.sao) { defines.VRODOS_USE_SAO = ''; }
        if (features.ssr) { defines.VRODOS_USE_SSR = ''; }
        if (features.bloom) { defines.VRODOS_USE_BLOOM = ''; }
        if (features.colorGrading) { defines.VRODOS_USE_COLOR_GRADING = ''; }
        if (features.vignette) { defines.VRODOS_USE_VIGNETTE = ''; }

        var uniforms = {
            tDiffuse: { value: null },
            exposure: { value: 1.0 }
        };
        if (features.sao) { uniforms.tSAO = { value: null }; }
        if (features.ssr) {
            uniforms.tSSR = { value: null };
            uniforms.ssrStrength = { value: 0.0 };
        }
        if (features.bloom) {
            uniforms.tBloom = { value: null };
            uniforms.bloomStrength = { value: 0.35 };
        }
        if (features.colorGrading) {
            uniforms.saturation = { value: 1.04 };
            uniforms.contrast = { value: 1.04 };
        }
        if (features.vignette) {
            uniforms.vignetteStrength = { value: 0.16 };
        }

        var material = new THREE.ShaderMaterial({
            defines,
            uniforms,
            vertexShader: [
                'varying vec2 vUv;',
                'void main() {',
                '  vUv = uv;',
                '  gl_Position = vec4(position.xy, 0.0, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform sampler2D tDiffuse;',
                'uniform float exposure;',
                '#ifdef VRODOS_USE_SAO',
                'uniform sampler2D tSAO;',
                '#endif',
                '#ifdef VRODOS_USE_SSR',
                'uniform sampler2D tSSR;',
                'uniform float ssrStrength;',
                '#endif',
                '#ifdef VRODOS_USE_BLOOM',
                'uniform sampler2D tBloom;',
                'uniform float bloomStrength;',
                '#endif',
                '#ifdef VRODOS_USE_COLOR_GRADING',
                'uniform float saturation;',
                'uniform float contrast;',
                'vec3 applySaturation(vec3 color, float sat) {',
                '  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));',
                '  return mix(vec3(luma), color, sat);',
                '}',
                '#endif',
                '#ifdef VRODOS_USE_VIGNETTE',
                'uniform float vignetteStrength;',
                '#endif',
                'varying vec2 vUv;',
                'void main() {',
                '  vec4 base = texture2D(tDiffuse, vUv);',
                '#ifdef VRODOS_USE_SAO',
                '  float ao = texture2D(tSAO, vUv).r;',
                '  vec3 color = base.rgb * ao;',
                '#else',
                '  vec3 color = base.rgb;',
                '#endif',
                '#ifdef VRODOS_USE_SSR',
                '  vec4 ssr = texture2D(tSSR, vUv);',
                '  color = mix(color, ssr.rgb, ssr.a * ssrStrength);',
                '#endif',
                '#ifdef VRODOS_USE_BLOOM',
                '  vec3 bloom = texture2D(tBloom, vUv).rgb;',
                '  color += bloom * bloomStrength;',
                '#endif',
                // Color grading (in sRGB space — RT is already ACES+sRGB encoded by Three.js
                // because postProcessingTarget.isXRRenderTarget=true + colorSpace=SRGBColorSpace)
                '#ifdef VRODOS_USE_COLOR_GRADING',
                '  color = applySaturation(color, saturation);',
                '  color = (color - 0.5) * contrast + 0.5;',
                '#endif',
                '#ifdef VRODOS_USE_VIGNETTE',
                '  float dist = distance(vUv, vec2(0.5));',
                '  float vignette = smoothstep(0.95, 0.24, dist);',
                '  color *= mix(1.0 - vignetteStrength, 1.0, vignette);',
                '#endif',
                '  color *= exposure;',
                '  color = clamp(color, 0.0, 1.0);',
                // No linearToSRGB here — RT is already fully encoded (ACES + sRGB applied by Three.js)
                '  gl_FragColor = vec4(color, base.a);',
                '}'
            ].join('\n'),
            depthWrite: false,
            depthTest: false
        });
        material.toneMapped = false;
        return material;
    }

    VRODOSMaster.createPhotorealPostMaterial = vrodosCreatePhotorealPostMaterial;
})();
