(function(root) {
    'use strict';

    const STATE_PROPERTY = '__vrodosStochasticTilingState';
    const CACHE_KEY = 'vrodos-stochastic-pbr-tiling-v2';

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

    // Triangular three-sample stochastic tiling adapted from Fabrice Neyret's
    // hexagonal texture tiling method and the MIT-licensed three-hex-tiling shader.
    // https://github.com/Ameobea/three-hex-tiling/blob/main/src/shaders/tileBreakingNeyret.frag
    const STOCHASTIC_GLSL = `
uniform float vrodosTilingEnabled;
uniform float vrodosPatchTiles;
uniform float vrodosBlendSharpness;
uniform float vrodosVariationSeed;

vec2 vrodosSurfaceHash22(vec2 point) {
    vec2 seedOffset = vec2(17.17, 47.47) * vrodosVariationSeed;
    vec2 value = vec2(
        dot(point, vec2(127.1, 311.7)),
        dot(point, vec2(269.5, 183.3))
    );
    return fract(sin(value + seedOffset) * 43758.5453);
}

void vrodosBuildStochasticUv(
    vec2 uv,
    out vec2 offsetA,
    out vec2 offsetB,
    out vec2 offsetC,
    out vec3 blendWeights
) {
    mat2 inverseTriangleLattice = mat2(1.0, 0.0, -0.577350269, 1.154700538);
    vec2 latticePosition = inverseTriangleLattice * (uv / max(vrodosPatchTiles, 0.5));
    vec2 latticeCell = floor(latticePosition);
    vec3 barycentric = vec3(fract(latticePosition), 0.0);
    barycentric.z = 1.0 - barycentric.x - barycentric.y;

    vec2 idA;
    vec2 idB;
    vec2 idC;
    vec3 weights;
    if (barycentric.z > 0.0) {
        idA = latticeCell;
        idB = latticeCell + vec2(0.0, 1.0);
        idC = latticeCell + vec2(1.0, 0.0);
        weights = vec3(barycentric.z, barycentric.y, barycentric.x);
    } else {
        idA = latticeCell + vec2(1.0, 1.0);
        idB = latticeCell + vec2(1.0, 0.0);
        idC = latticeCell + vec2(0.0, 1.0);
        weights = vec3(-barycentric.z, 1.0 - barycentric.y, 1.0 - barycentric.x);
    }

    weights = pow(max(weights, vec3(0.0)), vec3(max(vrodosBlendSharpness, 1.0)));
    weights /= max(dot(weights, vec3(1.0)), 0.00001);

    offsetA = vrodosSurfaceHash22(idA);
    offsetB = vrodosSurfaceHash22(idB);
    offsetC = vrodosSurfaceHash22(idC);
    blendWeights = weights;
}

vec4 vrodosStochasticTexture(
    sampler2D sourceMap,
    vec2 uv,
    vec2 offsetA,
    vec2 offsetB,
    vec2 offsetC,
    vec3 blendWeights
) {
    vec4 result = texture2D(sourceMap, uv);
    if (vrodosTilingEnabled >= 0.5) {
        vec2 gradientX = dFdx(uv);
        vec2 gradientY = dFdy(uv);
        vec4 sampleA = textureGrad(sourceMap, uv - offsetA, gradientX, gradientY);
        vec4 sampleB = textureGrad(sourceMap, uv - offsetB, gradientX, gradientY);
        vec4 sampleC = textureGrad(sourceMap, uv - offsetC, gradientX, gradientY);
        result = sampleA * blendWeights.x + sampleB * blendWeights.y + sampleC * blendWeights.z;
    }
    return result;
}

vec4 vrodosStochasticAlbedo(
    sampler2D sourceMap,
    vec2 uv,
    vec2 offsetA,
    vec2 offsetB,
    vec2 offsetC,
    vec3 blendWeights
) {
    vec4 result = texture2D(sourceMap, uv);
    if (vrodosTilingEnabled >= 0.5) {
        vec2 gradientX = dFdx(uv);
        vec2 gradientY = dFdy(uv);
        vec4 sampleA = textureGrad(sourceMap, uv - offsetA, gradientX, gradientY);
        vec4 sampleB = textureGrad(sourceMap, uv - offsetB, gradientX, gradientY);
        vec4 sampleC = textureGrad(sourceMap, uv - offsetC, gradientX, gradientY);
        vec4 meanColor = textureLod(sourceMap, vec2(0.5), 99.0);
        vec3 centered = (sampleA.rgb - meanColor.rgb) * blendWeights.x
            + (sampleB.rgb - meanColor.rgb) * blendWeights.y
            + (sampleC.rgb - meanColor.rgb) * blendWeights.z;
        vec3 corrected = meanColor.rgb + centered / max(length(blendWeights), 0.00001);
        float alpha = dot(vec3(sampleA.a, sampleB.a, sampleC.a), blendWeights);
        result = vec4(clamp(corrected, 0.0, 1.0), alpha);
    }
    return result;
}`;

    const MAP_FRAGMENT = `
#ifdef USE_MAP
    vec4 sampledDiffuseColor = vrodosStochasticAlbedo(map, vMapUv, vrodosOffsetA, vrodosOffsetB, vrodosOffsetC, vrodosBlendWeights);
    #ifdef DECODE_VIDEO_TEXTURE
        sampledDiffuseColor = sRGBTransferEOTF(sampledDiffuseColor);
    #endif
    diffuseColor *= sampledDiffuseColor;
#endif`;

    const ROUGHNESS_FRAGMENT = `
float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
    vec4 texelRoughness = vrodosStochasticTexture(roughnessMap, vRoughnessMapUv, vrodosOffsetA, vrodosOffsetB, vrodosOffsetC, vrodosBlendWeights);
    roughnessFactor *= texelRoughness.g;
#endif`;

    const METALNESS_FRAGMENT = `
float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
    vec4 texelMetalness = vrodosStochasticTexture(metalnessMap, vMetalnessMapUv, vrodosOffsetA, vrodosOffsetB, vrodosOffsetC, vrodosBlendWeights);
    metalnessFactor *= texelMetalness.b;
#endif`;

    const NORMAL_FRAGMENT = `
#ifdef USE_NORMALMAP_OBJECTSPACE
    normal = normalize(vrodosStochasticTexture(normalMap, vNormalMapUv, vrodosOffsetA, vrodosOffsetB, vrodosOffsetC, vrodosBlendWeights).xyz * 2.0 - 1.0);
    #ifdef FLIP_SIDED
        normal = -normal;
    #endif
    #ifdef DOUBLE_SIDED
        normal = normal * faceDirection;
    #endif
    normal = normalize(normalMatrix * normal);
#elif defined(USE_NORMALMAP_TANGENTSPACE)
    vec3 mapN = normalize(vrodosStochasticTexture(normalMap, vNormalMapUv, vrodosOffsetA, vrodosOffsetB, vrodosOffsetC, vrodosBlendWeights).xyz * 2.0 - 1.0);
    #if defined(USE_PACKED_NORMALMAP)
        mapN = vec3(mapN.xy, sqrt(saturate(1.0 - dot(mapN.xy, mapN.xy))));
    #endif
    mapN.xy *= normalScale;
    normal = normalize(tbn * mapN);
#elif defined(USE_BUMPMAP)
    normal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd(), faceDirection);
#endif`;

    const AO_FRAGMENT = `
#ifdef USE_AOMAP
    float ambientOcclusion = (vrodosStochasticTexture(aoMap, vAoMapUv, vrodosOffsetA, vrodosOffsetB, vrodosOffsetC, vrodosBlendWeights).r - 1.0) * aoMapIntensity + 1.0;
    reflectedLight.indirectDiffuse *= ambientOcclusion;
    #if defined(USE_CLEARCOAT)
        clearcoatSpecularIndirect *= ambientOcclusion;
    #endif
    #if defined(USE_SHEEN)
        sheenSpecularIndirect *= ambientOcclusion;
    #endif
    #if defined(USE_ENVMAP) && defined(STANDARD)
        float dotNV = saturate(dot(geometryNormal, geometryViewDir));
        reflectedLight.indirectSpecular *= computeSpecularOcclusion(dotNV, ambientOcclusion, material.roughness);
    #endif
#endif`;

    function installPatch(material) {
        const previousCompile = typeof material.onBeforeCompile === 'function'
            ? material.onBeforeCompile
            : function() { return undefined; };
        const previousCacheKey = typeof material.customProgramCacheKey === 'function'
            ? material.customProgramCacheKey
            : function() { return ''; };
        const state = {
            enabled: true,
            patchTiles: 1.25,
            blendSharpness: 4,
            seed: 0,
            uniforms: null
        };
        Object.defineProperty(material, STATE_PROPERTY, {
            value: state,
            configurable: true
        });

        material.onBeforeCompile = function(shader, renderer) {
            previousCompile.call(this, shader, renderer);
            shader.uniforms.vrodosTilingEnabled = { value: state.enabled ? 1 : 0 };
            shader.uniforms.vrodosPatchTiles = { value: state.patchTiles };
            shader.uniforms.vrodosBlendSharpness = { value: state.blendSharpness };
            shader.uniforms.vrodosVariationSeed = { value: state.seed };
            state.uniforms = shader.uniforms;

            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', `#include <common>\n${STOCHASTIC_GLSL}`)
                .replace(
                    'void main() {',
                    `void main() {
    vec2 vrodosOffsetA = vec2(0.0);
    vec2 vrodosOffsetB = vec2(0.0);
    vec2 vrodosOffsetC = vec2(0.0);
    vec3 vrodosBlendWeights = vec3(1.0, 0.0, 0.0);
    #if defined(USE_MAP)
        vrodosBuildStochasticUv(vMapUv, vrodosOffsetA, vrodosOffsetB, vrodosOffsetC, vrodosBlendWeights);
    #elif defined(USE_NORMALMAP)
        vrodosBuildStochasticUv(vNormalMapUv, vrodosOffsetA, vrodosOffsetB, vrodosOffsetC, vrodosBlendWeights);
    #elif defined(USE_ROUGHNESSMAP)
        vrodosBuildStochasticUv(vRoughnessMapUv, vrodosOffsetA, vrodosOffsetB, vrodosOffsetC, vrodosBlendWeights);
    #elif defined(USE_METALNESSMAP)
        vrodosBuildStochasticUv(vMetalnessMapUv, vrodosOffsetA, vrodosOffsetB, vrodosOffsetC, vrodosBlendWeights);
    #elif defined(USE_AOMAP)
        vrodosBuildStochasticUv(vAoMapUv, vrodosOffsetA, vrodosOffsetB, vrodosOffsetC, vrodosBlendWeights);
    #endif`
                )
                .replace('#include <map_fragment>', MAP_FRAGMENT)
                .replace('#include <roughnessmap_fragment>', ROUGHNESS_FRAGMENT)
                .replace('#include <metalnessmap_fragment>', METALNESS_FRAGMENT)
                .replace('#include <normal_fragment_maps>', NORMAL_FRAGMENT)
                .replace('#include <aomap_fragment>', AO_FRAGMENT);
        };
        material.customProgramCacheKey = function() {
            return `${previousCacheKey.call(this)}|${CACHE_KEY}`;
        };
        material.needsUpdate = true;
        return state;
    }

    function applyStochasticTiling(material, options) {
        if (!material) return null;
        const settings = options || {};
        if (!material[STATE_PROPERTY] && settings.enabled === false) return null;
        const state = material[STATE_PROPERTY] || installPatch(material);
        state.enabled = settings.enabled !== false;
        state.patchTiles = finiteNumber(settings.patchTiles, 1.25, 0.5, 4);
        state.blendSharpness = finiteNumber(settings.blendSharpness, 4, 1, 12);
        state.seed = finiteNumber(settings.seed, 0, 0, 1);
        if (state.uniforms) {
            state.uniforms.vrodosTilingEnabled.value = state.enabled ? 1 : 0;
            state.uniforms.vrodosPatchTiles.value = state.patchTiles;
            state.uniforms.vrodosBlendSharpness.value = state.blendSharpness;
            state.uniforms.vrodosVariationSeed.value = state.seed;
        }
        return state;
    }

    root.VRODOSSurfaceMaterial = Object.freeze({
        applyStochasticTiling,
        seedFromString
    });
})(typeof window !== 'undefined' ? window : globalThis);
