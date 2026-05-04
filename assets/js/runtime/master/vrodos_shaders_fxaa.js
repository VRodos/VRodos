/**
 * VRodos FXAA Shader — NVIDIA FXAA 3.11
 */
(function () {
    const VRODOSMaster = window.VRODOSMaster || (window.VRODOSMaster = {});

    function vrodosCreateFXAAMaterial() {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                resolution: { value: new THREE.Vector2(1 / 1024, 1 / 512) }
            },
            vertexShader: [
                'varying vec2 vUv;',
                'void main() {',
                '  vUv = uv;',
                '  gl_Position = vec4(position.xy, 0.0, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'precision highp float;',
                'uniform sampler2D tDiffuse;',
                'uniform vec2 resolution;',
                'varying vec2 vUv;',
                '#define FxaaTexTop(t, p) texture2D(t, p, -100.0)',
                '#define FxaaTexOff(t, p, o, r) texture2D(t, p + (o * r), -100.0)',
                'float contrast(vec4 a, vec4 b) {',
                '  vec4 diff = abs(a - b);',
                '  return max(max(max(diff.r, diff.g), diff.b), diff.a);',
                '}',
                'vec4 FxaaPixelShader(vec2 posM, sampler2D tex, vec2 fxaaQualityRcpFrame, float fxaaQualityEdgeThreshold, float fxaaQualityinvEdgeThreshold) {',
                '  vec4 rgbaM = FxaaTexTop(tex, posM);',
                '  vec4 rgbaS = FxaaTexOff(tex, posM, vec2(0.0, 1.0), fxaaQualityRcpFrame.xy);',
                '  vec4 rgbaE = FxaaTexOff(tex, posM, vec2(1.0, 0.0), fxaaQualityRcpFrame.xy);',
                '  vec4 rgbaN = FxaaTexOff(tex, posM, vec2(0.0,-1.0), fxaaQualityRcpFrame.xy);',
                '  vec4 rgbaW = FxaaTexOff(tex, posM, vec2(-1.0, 0.0), fxaaQualityRcpFrame.xy);',
                '  bool earlyExit = max(max(max(contrast(rgbaM, rgbaN), contrast(rgbaM, rgbaS)), contrast(rgbaM, rgbaE)), contrast(rgbaM, rgbaW)) < fxaaQualityEdgeThreshold;',
                '  if (earlyExit) { return rgbaM; }',
                '  float contrastN = contrast(rgbaM, rgbaN);',
                '  float contrastS = contrast(rgbaM, rgbaS);',
                '  float contrastE = contrast(rgbaM, rgbaE);',
                '  float contrastW = contrast(rgbaM, rgbaW);',
                '  float relativeVContrast = (contrastN + contrastS) - (contrastE + contrastW);',
                '  relativeVContrast *= fxaaQualityinvEdgeThreshold;',
                '  bool horzSpan = relativeVContrast > 0.;',
                '  if (abs(relativeVContrast) < .3) {',
                '    vec2 dirToEdge;',
                '    dirToEdge.x = contrastE > contrastW ? 1. : -1.;',
                '    dirToEdge.y = contrastS > contrastN ? 1. : -1.;',
                '    vec4 rgbaAlongH = FxaaTexOff(tex, posM, vec2(dirToEdge.x, -dirToEdge.y), fxaaQualityRcpFrame.xy);',
                '    float matchAlongH = contrast(rgbaM, rgbaAlongH);',
                '    vec4 rgbaAlongV = FxaaTexOff(tex, posM, vec2(-dirToEdge.x, dirToEdge.y), fxaaQualityRcpFrame.xy);',
                '    float matchAlongV = contrast(rgbaM, rgbaAlongV);',
                '    relativeVContrast = matchAlongV - matchAlongH;',
                '    relativeVContrast *= fxaaQualityinvEdgeThreshold;',
                '    if (abs(relativeVContrast) < .3) {',
                '      return mix(rgbaM, (rgbaN + rgbaS + rgbaE + rgbaW) * .25, .4);',
                '    }',
                '    horzSpan = relativeVContrast > 0.;',
                '  }',
                '  if (!horzSpan) { rgbaN = rgbaW; }',
                '  if (!horzSpan) { rgbaS = rgbaE; }',
                '  bool pairN = contrast(rgbaM, rgbaN) > contrast(rgbaM, rgbaS);',
                '  if (!pairN) { rgbaN = rgbaS; }',
                '  vec2 offNP;',
                '  offNP.x = (!horzSpan) ? 0.0 : fxaaQualityRcpFrame.x;',
                '  offNP.y = (horzSpan) ? 0.0 : fxaaQualityRcpFrame.y;',
                '  bool doneN = false;',
                '  bool doneP = false;',
                '  float nDist = 0.;',
                '  float pDist = 0.;',
                '  vec2 posN = posM;',
                '  vec2 posP = posM;',
                '',
                '  // Unrolled sampling loop (5 iterations) to avoid X3595 gradient instructions in varying loop iteration',
                '  for (int i = 0; i < 5; i++) { // Const loop count is fine for compiler',
                '    float increment = float(i + 1);',
                '    if (!doneN) {',
                '      nDist += increment;',
                '      posN = posM + offNP * nDist;',
                '      vec4 rgbaEndN = FxaaTexTop(tex, posN.xy);',
                '      doneN = contrast(rgbaEndN, rgbaM) > contrast(rgbaEndN, rgbaN);',
                '    }',
                '    if (!doneP) {',
                '      pDist += increment;',
                '      posP = posM - offNP * pDist;',
                '      vec4 rgbaEndP = FxaaTexTop(tex, posP.xy);',
                '      doneP = contrast(rgbaEndP, rgbaM) > contrast(rgbaEndP, rgbaN);',
                '    }',
                '    if (doneN || doneP) break;',
                '  }',
                '',
                '  if (!doneP && !doneN) { return rgbaM; }',
                '  float dist = min(doneN ? nDist / 5.0 : 1.0, doneP ? pDist / 5.0 : 1.0);',
                '  dist = 1. - pow(dist, .5);',
                '  return mix(rgbaM, rgbaN, dist * .5);',
                '}',
                'void main() {',
                '  const float edgeDetectionQuality = .2;',
                '  const float invEdgeDetectionQuality = 1. / edgeDetectionQuality;',
                '  gl_FragColor = FxaaPixelShader(vUv, tDiffuse, resolution, edgeDetectionQuality, invEdgeDetectionQuality);',
                '}'
            ].join('\n'),
            depthWrite: false,
            depthTest: false
        });
        material.toneMapped = false;
        return material;
    }

    VRODOSMaster.createFXAAMaterial = vrodosCreateFXAAMaterial;
    
    // Inject into THREE namespace to replace the bundled one if it's causing warnings in the editor
    if (window.THREE) {
        window.THREE.FXAAShader = {
            uniforms: {
                tDiffuse: { value: null },
                resolution: { value: new THREE.Vector2(1 / 1024, 1 / 512) }
            },
            vertexShader: [
                'varying vec2 vUv;',
                'void main() {',
                '  vUv = uv;',
                '  gl_Position = vec4(position.xy, 0.0, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: vrodosCreateFXAAMaterial().fragmentShader
        };
    }
})();
