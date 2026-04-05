/**
 * VRodos Composite Shader — Final post-FX compositing pass
 * Combines AO, SSR, bloom, color grading, vignette, and exposure.
 */
(function () {
    var VRODOSMaster = window.VRODOSMaster || (window.VRODOSMaster = {});

    function vrodosCreatePhotorealPostMaterial() {
        var material = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                tBloom: { value: null },
                tSAO: { value: null },
                tSSR: { value: null },
                ssrStrength: { value: 0.0 },
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
                'uniform sampler2D tSAO;',
                'uniform sampler2D tSSR;',
                'uniform float ssrStrength;',
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
                'void main() {',
                '  vec4 base = texture2D(tDiffuse, vUv);',
                '  float ao = texture2D(tSAO, vUv).r;',
                '  vec3 color = base.rgb * ao;',
                // SSR blending (alpha = hit mask, rgb = reflected color)
                '  vec4 ssr = texture2D(tSSR, vUv);',
                '  color = mix(color, ssr.rgb, ssr.a * ssrStrength);',
                '  vec3 bloom = texture2D(tBloom, vUv).rgb;',
                '  color += bloom * bloomStrength;',
                // Color grading (in sRGB space — RT is already ACES+sRGB encoded by Three.js
                // because postProcessingTarget.isXRRenderTarget=true + colorSpace=SRGBColorSpace)
                '  color = applySaturation(color, saturation);',
                '  color = (color - 0.5) * contrast + 0.5;',
                // Vignette
                '  float dist = distance(vUv, vec2(0.5));',
                '  float vignette = smoothstep(0.95, 0.24, dist);',
                '  color *= mix(1.0 - vignetteStrength, 1.0, vignette);',
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
