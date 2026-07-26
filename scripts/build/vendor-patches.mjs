import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fromPluginRoot } from './paths.mjs';

const takramCloudsSharedPath = fromPluginRoot(
  'node_modules/@takram/three-clouds/build/shared.js'
);

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
