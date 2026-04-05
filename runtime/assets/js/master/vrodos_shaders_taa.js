/**
 * VRodos TAA Shader — Temporal Anti-Aliasing
 * Simple temporal accumulation with aggressive YCoCg variance clipping.
 * No depth reprojection — history is sampled at the same UV and clipped to the
 * current frame's 3x3 neighborhood. When the camera moves, the clipping forces
 * the output toward the current frame, preventing ghosting.
 */
(function () {
    var VRODOSMaster = window.VRODOSMaster || (window.VRODOSMaster = {});

    function vrodosCreateTAAMaterial() {
        var material = new THREE.ShaderMaterial({
            uniforms: {
                tCurrent: { value: null },
                tHistory: { value: null },
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
                'uniform sampler2D tCurrent;',
                'uniform sampler2D tHistory;',
                'uniform vec2 resolution;',
                'varying vec2 vUv;',
                '',
                'vec3 rgbToYCoCg(vec3 c) {',
                '  return vec3(',
                '    0.25 * c.r + 0.5 * c.g + 0.25 * c.b,',
                '    0.5 * c.r - 0.5 * c.b,',
                '    -0.25 * c.r + 0.5 * c.g - 0.25 * c.b',
                '  );',
                '}',
                'vec3 yCoCgToRgb(vec3 c) {',
                '  return vec3(',
                '    c.x + c.y - c.z,',
                '    c.x + c.z,',
                '    c.x - c.y - c.z',
                '  );',
                '}',
                '',
                'void main() {',
                '  vec3 current = texture2D(tCurrent, vUv).rgb;',
                '  vec3 history = texture2D(tHistory, vUv).rgb;',
                '',
                '  // --- 3x3 neighborhood statistics in YCoCg ---',
                '  vec2 texelSize = 1.0 / resolution;',
                '  vec3 m1 = vec3(0.0);',
                '  vec3 m2 = vec3(0.0);',
                '  for (int x = -1; x <= 1; x++) {',
                '    for (int y = -1; y <= 1; y++) {',
                '      vec3 s = texture2D(tCurrent, vUv + vec2(float(x), float(y)) * texelSize).rgb;',
                '      vec3 sYCoCg = rgbToYCoCg(s);',
                '      m1 += sYCoCg;',
                '      m2 += sYCoCg * sYCoCg;',
                '    }',
                '  }',
                '',
                '  // Variance clipping (1.5 sigma) — wide enough to preserve thin geometry',
                '  vec3 mu = m1 / 9.0;',
                '  vec3 sigma = sqrt(max(m2 / 9.0 - mu * mu, vec3(0.0)));',
                '  vec3 clipMin = mu - 1.5 * sigma;',
                '  vec3 clipMax = mu + 1.5 * sigma;',
                '',
                '  // Clip history to current neighborhood',
                '  vec3 historyYCoCg = rgbToYCoCg(history);',
                '  vec3 clippedYCoCg = clamp(historyYCoCg, clipMin, clipMax);',
                '  vec3 clippedHistory = yCoCgToRgb(clippedYCoCg);',
                '',
                '  // Adaptive blend: high history weight for strong accumulation, reduce when clipped',
                '  float clipDist = length(historyYCoCg - clippedYCoCg);',
                '  float blend = mix(0.95, 0.5, clamp(clipDist * 4.0, 0.0, 1.0));',
                '',
                '  vec3 result = mix(current, clippedHistory, blend);',
                '  gl_FragColor = vec4(result, 1.0);',
                '}'
            ].join('\n'),
            depthWrite: false,
            depthTest: false
        });
        material.toneMapped = false;
        return material;
    }

    VRODOSMaster.createTAAMaterial = vrodosCreateTAAMaterial;
})();
