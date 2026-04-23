/**
 * VRodos TAA Shader — Temporal Anti-Aliasing
 * Temporal accumulation with YCoCg variance clipping and Catmull-Rom history
 * sampling. No depth reprojection — history is sampled at the same UV and
 * clipped to the current frame's 3x3 neighborhood. Catmull-Rom resampling
 * preserves high-frequency texture detail across repeated accumulations,
 * preventing the "JPG mush" that bilinear history sampling accumulates.
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
                '// 5-tap Catmull-Rom history sample (Filmic SMAA / Jimenez).',
                '// Preserves sharpness across repeated temporal resamples, whereas',
                '// bilinear sampling would compound softening every frame.',
                'vec3 sampleHistoryCatmullRom(sampler2D tex, vec2 uv, vec2 texSize) {',
                '  vec2 samplePos = uv * texSize;',
                '  vec2 texPos1 = floor(samplePos - 0.5) + 0.5;',
                '  vec2 f = samplePos - texPos1;',
                '  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));',
                '  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);',
                '  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));',
                '  vec2 w3 = f * f * (-0.5 + 0.5 * f);',
                '  vec2 w12 = w1 + w2;',
                '  vec2 offset12 = w2 / (w1 + w2);',
                '  vec2 texPos0 = (texPos1 - 1.0) / texSize;',
                '  vec2 texPos3 = (texPos1 + 2.0) / texSize;',
                '  vec2 texPos12 = (texPos1 + offset12) / texSize;',
                '  vec3 result = vec3(0.0);',
                '  result += texture2D(tex, vec2(texPos12.x, texPos0.y)).rgb * (w12.x * w0.y);',
                '  result += texture2D(tex, vec2(texPos0.x,  texPos12.y)).rgb * (w0.x  * w12.y);',
                '  result += texture2D(tex, vec2(texPos12.x, texPos12.y)).rgb * (w12.x * w12.y);',
                '  result += texture2D(tex, vec2(texPos3.x,  texPos12.y)).rgb * (w3.x  * w12.y);',
                '  result += texture2D(tex, vec2(texPos12.x, texPos3.y)).rgb * (w12.x * w3.y);',
                '  return max(result, vec3(0.0));',
                '}',
                '',
                'void main() {',
                '  vec3 current = texture2D(tCurrent, vUv).rgb;',
                '  vec3 history = sampleHistoryCatmullRom(tHistory, vUv, resolution);',
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
                '  // Variance clipping (1.0 sigma) — tight enough to reject stale blurry history',
                '  vec3 mu = m1 / 9.0;',
                '  vec3 sigma = sqrt(max(m2 / 9.0 - mu * mu, vec3(0.0)));',
                '  vec3 clipMin = mu - 1.0 * sigma;',
                '  vec3 clipMax = mu + 1.0 * sigma;',
                '',
                '  // Clip history to current neighborhood',
                '  vec3 historyYCoCg = rgbToYCoCg(history);',
                '  vec3 clippedYCoCg = clamp(historyYCoCg, clipMin, clipMax);',
                '  vec3 clippedHistory = yCoCgToRgb(clippedYCoCg);',
                '',
                '  // Adaptive blend: moderate history weight, reduce when clipping is active',
                '  float clipDist = length(historyYCoCg - clippedYCoCg);',
                '  float blend = mix(0.88, 0.5, clamp(clipDist * 4.0, 0.0, 1.0));',
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
