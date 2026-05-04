/**
 * VRodos SAO Shaders — Scalable Ambient Occlusion + bilateral blur
 */
(function () {
    const VRODOSMaster = window.VRODOSMaster || (window.VRODOSMaster = {});

    function vrodosCreateSAOMaterial() {
        const material = new THREE.ShaderMaterial({
            defines: {
                'NUM_SAMPLES': 16,
                'NUM_RINGS': 4
            },
            uniforms: {
                tDepth: { value: null },
                size: { value: new THREE.Vector2(512, 512) },
                cameraNear: { value: 1 },
                cameraFar: { value: 100 },
                intensity: { value: 0.12 },
                bias: { value: 0.005 },
                kernelRadius: { value: 16.0 },
                maxDistance: { value: 120.0 }
            },
            vertexShader: [
                'varying vec2 vUv;',
                'void main() {',
                '  vUv = uv;',
                '  gl_Position = vec4(position.xy, 0.0, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                '#define PI2 6.283185307179586',
                'varying vec2 vUv;',
                'uniform highp sampler2D tDepth;',
                'uniform float cameraNear;',
                'uniform float cameraFar;',
                'uniform float intensity;',
                'uniform float bias;',
                'uniform float kernelRadius;',
                'uniform vec2 size;',
                'uniform float maxDistance;',
                '',
                'float linearizeDepth(float d) {',
                '  return (cameraNear * cameraFar) / (cameraFar - d * (cameraFar - cameraNear));',
                '}',
                '',
                'highp float rand(const in vec2 uv) {',
                '  const highp float a = 12.9898, b = 78.233, c = 43758.5453;',
                '  highp float dt = dot(uv.xy, vec2(a, b)), sn = mod(dt, PI2);',
                '  return fract(sin(sn) * c);',
                '}',
                '',
                'void main() {',
                '  float rawDepth = texture2D(tDepth, vUv).x;',
                '  if (rawDepth >= 0.9999) { gl_FragColor = vec4(1.0); return; }',
                '',
                '  float centerDepth = linearizeDepth(rawDepth);',
                '  if (centerDepth > maxDistance) { gl_FragColor = vec4(1.0); return; }',
                '',
                '  float effectiveBias = bias * centerDepth;',
                '  float aoRadius = kernelRadius;',
                '  float screenRadius = aoRadius * size.y / (centerDepth * 2.0);',
                '  screenRadius = clamp(screenRadius, 2.0, 64.0);',
                '',
                '  float angle = rand(vUv) * PI2;',
                '  float angleStep = PI2 * float(NUM_RINGS) / float(NUM_SAMPLES);',
                '  float invSamples = 1.0 / float(NUM_SAMPLES);',
                '  vec2 radiusStep = vec2(screenRadius * invSamples) / size;',
                '  vec2 radius = radiusStep;',
                '',
                '  float occlusion = 0.0;',
                '  float validSamples = 0.0;',
                '  for (int i = 0; i < NUM_SAMPLES; i++) {',
                '    vec2 sampleUv = vUv + vec2(cos(angle), sin(angle)) * radius;',
                '    radius += radiusStep;',
                '    angle += angleStep;',
                '',
                '    float sRaw = texture2D(tDepth, sampleUv).x;',
                '    if (sRaw >= 0.9999) { validSamples += 1.0; continue; }',
                '',
                '    float sampleDepth = linearizeDepth(sRaw);',
                '    float depthDiff = centerDepth - sampleDepth;',
                '    validSamples += 1.0;',
                '',
                '    float rangeCheck = 1.0 - smoothstep(aoRadius * 0.5, aoRadius * 2.0, abs(depthDiff));',
                '    float occFactor = smoothstep(effectiveBias, effectiveBias * 3.0, depthDiff);',
                '    occlusion += occFactor * rangeCheck;',
                '  }',
                '',
                '  occlusion = (validSamples > 0.0) ? occlusion / validSamples * intensity : 0.0;',
                '  float distFade = smoothstep(maxDistance * 0.4, maxDistance, centerDepth);',
                '  occlusion *= (1.0 - distFade);',
                '',
                '  gl_FragColor = vec4(vec3(clamp(1.0 - occlusion, 0.0, 1.0)), 1.0);',
                '}'
            ].join('\n'),
            depthWrite: false,
            depthTest: false
        });
        material.toneMapped = false;
        return material;
    }

    function vrodosCreateSAOBlurMaterial() {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                tDepth: { value: null },
                cameraNear: { value: 1 },
                cameraFar: { value: 100 },
                size: { value: new THREE.Vector2(512, 512) },
                direction: { value: new THREE.Vector2(1.0, 0.0) },
                depthCutoff: { value: 0.01 }
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
                'uniform highp sampler2D tDepth;',
                'uniform float cameraNear;',
                'uniform float cameraFar;',
                'uniform vec2 size;',
                'uniform vec2 direction;',
                'uniform float depthCutoff;',
                'varying vec2 vUv;',
                '',
                'float getLinearDepth(const in vec2 uv) {',
                '  float d = texture2D(tDepth, uv).x;',
                '  float viewZ = (cameraNear * cameraFar) / ((cameraFar - cameraNear) * d - cameraFar);',
                '  return (-viewZ - cameraNear) / (cameraFar - cameraNear);',
                '}',
                '',
                'void main() {',
                '  vec2 texel = direction / max(size, vec2(1.0));',
                '  float centerDepth = getLinearDepth(vUv);',
                '  float result = 0.0;',
                '  float weightSum = 0.0;',
                // 9-tap bilateral Gaussian (sigma ~3.0)
                '  float weights[9];',
                '  weights[0] = 0.0162; weights[1] = 0.0540; weights[2] = 0.1216;',
                '  weights[3] = 0.1945; weights[4] = 0.2270; weights[5] = 0.1945;',
                '  weights[6] = 0.1216; weights[7] = 0.0540; weights[8] = 0.0162;',
                '  for (int i = 0; i < 9; i++) {',
                '    vec2 offset = texel * float(i - 4);',
                '    vec2 sampleUv = vUv + offset;',
                '    float sampleDepth = getLinearDepth(sampleUv);',
                '    float depthDiff = abs(centerDepth - sampleDepth);',
                '    if (depthDiff < depthCutoff) {',
                '      float sampleValue = texture2D(tDiffuse, sampleUv).r;',
                '      result += sampleValue * weights[i];',
                '      weightSum += weights[i];',
                '    }',
                '  }',
                '  if (weightSum > 0.0) {',
                '    result /= weightSum;',
                '  } else {',
                '    result = texture2D(tDiffuse, vUv).r;',
                '  }',
                '  gl_FragColor = vec4(vec3(result), 1.0);',
                '}'
            ].join('\n'),
            depthWrite: false,
            depthTest: false
        });
        material.toneMapped = false;
        return material;
    }

    VRODOSMaster.createSAOMaterial = vrodosCreateSAOMaterial;
    VRODOSMaster.createSAOBlurMaterial = vrodosCreateSAOBlurMaterial;
})();
