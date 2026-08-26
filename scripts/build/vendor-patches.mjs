import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fromPluginRoot } from './paths.mjs';

const takramCloudsSharedPath = fromPluginRoot(
  'node_modules/@takram/three-clouds/build/shared.js'
);
const takramAtmosphereSharedPath = fromPluginRoot(
  'node_modules/@takram/three-atmosphere/build/shared.js'
);

function replaceRequired(source, original, replacement, label) {
  if (!source.includes(original)) {
    throw new Error(`Takram atmosphere moon shader patch failed: ${label}`);
  }
  return source.replace(original, replacement);
}

function patchTakramAtmosphereMoonSource(source) {
  source = replaceRequired(
    source,
    `uniform float lunarRadianceScale;
uniform vec3 groundAlbedo;

#include "sky"`,
    `uniform float lunarRadianceScale;
// VRODOS_TEXTURED_MOON_SHADER_PATCH
uniform vec3 vrodosMoonLightDirection;
uniform mat4 vrodosMoonFixedToECEFMatrix;
uniform sampler2D vrodosMoonColorTexture;
uniform float vrodosMoonIllumination;
uniform float vrodosMoonHaloRadiusScale;
uniform float vrodosMoonHaloStrength;
uniform vec3 groundAlbedo;

#include "sky"`,
    'SkyMaterial moon uniforms did not match the expected upstream form'
  );

  source = replaceRequired(
    source,
    `  #ifdef MOON
  float intersection = intersectSphere(rayDirection, moonDirection, moonAngularRadius);`,
    `  #ifdef MOON
  #ifdef VRODOS_CINEMATIC_MOON_HALO
  // VRODOS_CINEMATIC_MOON_HALO_SHADER_PATCH
  float vrodosMoonViewDot = dot(rayDirection, moonDirection);
  float vrodosMoonAngle = acos(clamp(vrodosMoonViewDot, -1.0, 1.0));
  float vrodosMoonHaloInner = moonAngularRadius * 0.92;
  float vrodosMoonHaloOuter = moonAngularRadius * vrodosMoonHaloRadiusScale;
  float vrodosMoonHalo =
    smoothstep(vrodosMoonHaloInner, moonAngularRadius * 1.08, vrodosMoonAngle) *
    (1.0 - smoothstep(moonAngularRadius * 1.05, vrodosMoonHaloOuter, vrodosMoonAngle));
  if (vrodosMoonHalo > 0.0 && vrodosMoonIllumination > 0.0) {
    radiance +=
      transmittance *
      getLunarRadiance(moonAngularRadius) *
      lunarRadianceScale *
      vec3(0.82, 0.90, 1.0) *
      (vrodosMoonHaloStrength * vrodosMoonIllumination * vrodosMoonHalo);
  }
  #endif // VRODOS_CINEMATIC_MOON_HALO

  float intersection = intersectSphere(rayDirection, moonDirection, moonAngularRadius);`,
    'Takram moon block did not match the expected upstream form'
  );

  source = replaceRequired(
    source,
    `    vec3 normal = normalize(moonDirection - rayDirection * intersection);
    float diffuse = orenNayarDiffuse(-sunDirection, rayDirection, normal);
    float viewDotMoon = dot(rayDirection, moonDirection);`,
    `    vec3 normal = normalize(moonDirection - rayDirection * intersection);
    vec3 moonLightDirection = -sunDirection;
    vec3 moonColor = vec3(1.0);
    #ifdef VRODOS_TEXTURED_MOON
    moonLightDirection = normalize(vrodosMoonLightDirection);
    vec3 normalMoonFixed = (transpose(mat3(vrodosMoonFixedToECEFMatrix)) * normal).xzy;
    vec2 moonUv = vec2(
      atan(normalMoonFixed.z, normalMoonFixed.x) / (2.0 * PI) + 0.5,
      asin(clamp(normalMoonFixed.y, -1.0, 1.0)) / PI + 0.5
    );
    // The NASA color map is decoded to linear sRGB. Normalize its sampled
    // mean luminance so it modulates Takram's existing lunar radiance instead
    // of applying lunar albedo a second time.
    const float VRODOS_MOON_COLOR_GAIN = 3.2;
    const float VRODOS_MOON_COLOR_SATURATION = 0.06;
    vec3 sampledMoonColor = texture(vrodosMoonColorTexture, moonUv).rgb;
    float moonLuminance = dot(sampledMoonColor, vec3(0.2126, 0.7152, 0.0722));
    moonColor = mix(
      vec3(moonLuminance),
      sampledMoonColor,
      VRODOS_MOON_COLOR_SATURATION
    ) * VRODOS_MOON_COLOR_GAIN;
    #endif // VRODOS_TEXTURED_MOON
    float diffuse = orenNayarDiffuse(moonLightDirection, rayDirection, normal);
    float viewDotMoon = dot(rayDirection, moonDirection);`,
    'Oren-Nayar moon shading block did not match the expected upstream form'
  );

  source = replaceRequired(
    source,
    `      lunarRadianceScale *
      diffuse *`,
    `      lunarRadianceScale *
      moonColor *
      diffuse *`,
    'lunar radiance expression did not match the expected upstream form'
  );

  source = replaceRequired(
    source,
    `        lunarRadianceScale: new d(o),
        groundAlbedo: new d(s.clone()),`,
    `        lunarRadianceScale: new d(o),
        vrodosMoonLightDirection: new d(new p(0, 0, 1)),
        vrodosMoonFixedToECEFMatrix: new d(new D()),
        vrodosMoonColorTexture: new d(null),
        vrodosMoonIllumination: new d(1),
        vrodosMoonHaloRadiusScale: new d(1),
        vrodosMoonHaloStrength: new d(0),
        groundAlbedo: new d(s.clone()),`,
    'SkyMaterial uniform construction did not match the expected upstream form'
  );

  source = replaceRequired(
    source,
    `uniform vec3 sunDirection;

in vec3 vCameraPosition;
in vec3 vRayDirection;`,
    `uniform vec3 sunDirection;
// VRODOS_MOON_STAR_OCCLUSION_SHADER_PATCH
uniform vec3 vrodosMoonOcclusionDirection;
uniform float vrodosMoonOcclusionCosine;

in vec3 vCameraPosition;
in vec3 vRayDirection;`,
    'StarsMaterial fragment uniforms did not match the expected upstream form'
  );

  source = replaceRequired(
    source,
    `  #ifdef BACKGROUND
  vec3 rayDirection = normalize(vRayDirection);
  float r = length(vCameraPosition);`,
    `  #ifdef BACKGROUND
  vec3 rayDirection = normalize(vRayDirection);
  if (
    vrodosMoonOcclusionCosine < 1.0 &&
    dot(rayDirection, normalize(vrodosMoonOcclusionDirection)) > vrodosMoonOcclusionCosine
  ) {
    discard;
  }
  float r = length(vCameraPosition);`,
    'StarsMaterial background fragment block did not match the expected upstream form'
  );

  source = replaceRequired(
    source,
    `        magnitudeRange: new d(new oe(-2, 8)),
        intensity: new d(r),
        ...o.uniforms`,
    `        magnitudeRange: new d(new oe(-2, 8)),
        intensity: new d(r),
        vrodosMoonOcclusionDirection: new d(new p(0, 0, 1)),
        vrodosMoonOcclusionCosine: new d(1),
        ...o.uniforms`,
    'StarsMaterial uniform construction did not match the expected upstream form'
  );

  return source;
}

export function createTakramAtmosphereMoonShaderPatchPlugin() {
  const sharedPath = path.normalize(takramAtmosphereSharedPath);
  return {
    name: 'vrodos-takram-atmosphere-moon-shader-patch',
    setup(buildContext) {
      buildContext.onLoad(
        { filter: /@takram[\\/]three-atmosphere[\\/]build[\\/]shared\.js$/ },
        async (args) => {
          if (path.normalize(args.path) !== sharedPath) {
            return null;
          }
          const source = await readFile(args.path, 'utf8');
          return {
            contents: patchTakramAtmosphereMoonSource(source),
            loader: 'js'
          };
        }
      );
    }
  };
}

function patchTakramCloudsSharedSource(source) {
  const original = `vec2 getGlobeUv(const vec3 position) {
  return getCubeSphereUv(position);
}`;
  const replacement = `vec2 getVrodosLocalHorizonUv(const vec3 position) {
  vec3 worldPosition = (ecefToWorldMatrix * vec4(position - altitudeCorrection, 1.0)).xyz;
  return worldPosition.xz / (2.0 * bottomRadius) + vec2(0.5);
}

vec2 getGlobeUv(const vec3 position) {
  #ifdef VRODOS_LOCAL_HORIZON_WEATHER_UV
  return getVrodosLocalHorizonUv(position);
  #else
  return getCubeSphereUv(position);
  #endif
}`;
  if (!source.includes(original)) {
    throw new Error(
      'Takram clouds shader patch failed: getGlobeUv() source did not match the expected upstream form'
    );
  }
  return source.replace(original, replacement);
}

export function createTakramCloudsShaderPatchPlugin() {
  const sharedPath = path.normalize(takramCloudsSharedPath);
  return {
    name: 'vrodos-takram-clouds-shader-patch',
    setup(buildContext) {
      buildContext.onLoad(
        { filter: /@takram[\\/]three-clouds[\\/]build[\\/]shared\.js$/ },
        async (args) => {
          if (path.normalize(args.path) !== sharedPath) {
            return null;
          }
          const source = await readFile(args.path, 'utf8');
          return {
            contents: patchTakramCloudsSharedSource(source),
            loader: 'js'
          };
        }
      );
    }
  };
}

function patchThreeClassicLoaderUrlSource(source, loaderName) {
  const assetDirectory = loaderName === 'DRACOLoader' ? 'draco' : 'basis';
  const upstreamDirectory = `../libs/${assetDirectory}/`;
  const marker = `const VRODOS_THREE_CLASSIC_BUNDLE_URL =
  (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) ||
  (typeof location !== 'undefined' ? location.href : 'http://localhost/');

`;

  if (!source.includes(upstreamDirectory) || !source.includes('import.meta.url')) {
    throw new Error(
      `${loaderName} classic-bundle URL patch failed: expected r185 import.meta URL defaults were not found`
    );
  }

  return marker + source
    .replaceAll(upstreamDirectory, `./${assetDirectory}/`)
    .replaceAll('import.meta.url', 'VRODOS_THREE_CLASSIC_BUNDLE_URL');
}

export function createThreeClassicLoaderUrlPatchPlugin() {
  return {
    name: 'vrodos-three-classic-loader-url-patch',
    setup(buildContext) {
      buildContext.onLoad(
        { filter: /three[\\/]examples[\\/]jsm[\\/]loaders[\\/](?:DRACOLoader|KTX2Loader)\.js$/ },
        async (args) => {
          const loaderName = path.basename(args.path, '.js');
          const source = await readFile(args.path, 'utf8');
          return {
            contents: patchThreeClassicLoaderUrlSource(source, loaderName),
            loader: 'js'
          };
        }
      );
    }
  };
}

export async function rewriteTakramCloudBundleAssetDefaults(bundlePath) {
  const source = await readFile(bundlePath, 'utf8');
  const replacements = [
    [
      /`https:\/\/media\.githubusercontent\.com\/media\/takram-design-engineering\/three-geospatial\/\$\{[^}]+\}\/packages\/core\/assets\/stbn\.bin`/g,
      "'assets/vendor/takram-clouds/stbn.bin'"
    ],
    [
      /`https:\/\/media\.githubusercontent\.com\/media\/takram-design-engineering\/three-geospatial\/\$\{[^}]+\}\/packages\/clouds\/assets\/local_weather\.png`/g,
      "'assets/vendor/takram-clouds/local_weather.png'"
    ],
    [
      /`https:\/\/media\.githubusercontent\.com\/media\/takram-design-engineering\/three-geospatial\/\$\{[^}]+\}\/packages\/clouds\/assets\/shape\.bin`/g,
      "'assets/vendor/takram-clouds/shape.bin'"
    ],
    [
      /`https:\/\/media\.githubusercontent\.com\/media\/takram-design-engineering\/three-geospatial\/\$\{[^}]+\}\/packages\/clouds\/assets\/shape_detail\.bin`/g,
      "'assets/vendor/takram-clouds/shape_detail.bin'"
    ],
    [
      /`https:\/\/media\.githubusercontent\.com\/media\/takram-design-engineering\/three-geospatial\/\$\{[^}]+\}\/packages\/clouds\/assets\/turbulence\.png`/g,
      "'assets/vendor/takram-clouds/turbulence.png'"
    ]
  ];
  const rewritten = replacements.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    source
  );

  if (!rewritten.includes('VRODOS_LOCAL_HORIZON_WEATHER_UV')) {
    throw new Error(
      'Takram clouds bundle patch failed: VRODOS_LOCAL_HORIZON_WEATHER_UV define is missing from generated bundle'
    );
  }
  if (rewritten !== source) {
    await writeFile(bundlePath, rewritten, 'utf8');
  }
}
