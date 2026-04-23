/**
 * VRodos Bloom Shaders — Bright-pass + Gaussian blur
 */
(function () {
    var VRODOSMaster = window.VRODOSMaster || (window.VRODOSMaster = {});

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

    VRODOSMaster.createBrightPassMaterial = vrodosCreateBrightPassMaterial;
    VRODOSMaster.createGaussianBlurMaterial = vrodosCreateGaussianBlurMaterial;
})();
