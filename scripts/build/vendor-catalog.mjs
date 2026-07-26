import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fromPluginRoot, runtimeLibraryRoot } from './paths.mjs';

export const packageJsonPath = fromPluginRoot('package.json');
export const packageLockPath = fromPluginRoot('package-lock.json');
export const runtimeVersionManifestPath = fromPluginRoot('assets/runtime-version-manifest.json');

export const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
export const packageLockJson = JSON.parse(readFileSync(packageLockPath, 'utf8'));

export function getLockedPackageVersion(packageName) {
  const packageEntry = packageLockJson.packages?.[`node_modules/${packageName}`];
  if (!packageEntry?.version) {
    throw new Error(`Missing locked version for ${packageName}. Run npm install first.`);
  }

  return packageEntry.version;
}

export function getPackageRuntimeConfig() {
  return packageJson.vrodos?.runtime ?? {};
}

export function getThreeRuntimeConfig() {
  const version = getLockedPackageVersion('three');
  const versionParts = version.split('.');
  const revision = versionParts[0] === '0' ? versionParts[1] : versionParts[0];

  if (!revision || !/^\d+$/.test(revision)) {
    throw new Error(`Unable to derive Three revision from version ${version}.`);
  }

  const vendorDir = `three-r${revision}`;

  return {
    version,
    revision,
    vendorDir,
    bundleFile: `vrodos-three-r${revision}.bundle.js`
  };
}

const runtimeBundle = (bundleFile, details = {}) => ({
  bundleFile,
  bundlePath: `${runtimeLibraryRoot}/${bundleFile}`,
  ...details
});

export const threeRuntimeConfig = getThreeRuntimeConfig();

export const vendorArtifacts = Object.freeze({
  aframe: {
    bundlePath: 'assets/vendor/aframe/aframe-master.min.js'
  },
  three: {
    bundleFile: threeRuntimeConfig.bundleFile,
    bundlePath: `assets/vendor/${threeRuntimeConfig.vendorDir}/${threeRuntimeConfig.bundleFile}`,
    packages: ['three', 'postprocessing']
  },
  threeAddons: runtimeBundle('vrodos-three-addons.bundle.js', {
    global: 'VRODOS_THREE_ADDONS',
    packages: ['three']
  }),
  postprocessing: runtimeBundle('vrodos-postprocessing.bundle.js', {
    global: 'POSTPROCESSING',
    packages: ['postprocessing', 'three']
  }),
  takramAtmosphere: runtimeBundle('vrodos-takram-atmosphere.bundle.js', {
    global: 'VRODOS_TAKRAM_ATMOSPHERE',
    effectsGlobal: 'VRODOS_TAKRAM_EFFECTS',
    packages: [
      '@takram/three-atmosphere',
      '@takram/three-geospatial-effects',
      'postprocessing',
      'three'
    ]
  }),
  takramClouds: runtimeBundle('vrodos-takram-clouds.bundle.js', {
    global: 'VRODOS_TAKRAM_CLOUDS',
    packages: [
      '@takram/three-clouds',
      '@takram/three-geospatial',
      '@takram/three-atmosphere',
      'postprocessing',
      'three'
    ]
  }),
  collisionBvh: runtimeBundle('vrodos-collision-bvh.bundle.js', {
    global: 'VRODOS_COLLISION_BVH',
    packages: ['three-mesh-bvh', 'three']
  }),
  statsGl: {
    bundleFile: 'main.js',
    bundlePath: 'assets/vendor/stats-gl/main.js',
    packages: ['stats-gl']
  }
});

export const decoderAssets = Object.freeze([
  {
    label: 'Draco decoder assets',
    packageName: 'three',
    source: 'node_modules/three/examples/jsm/libs/draco',
    destination: `assets/vendor/${threeRuntimeConfig.vendorDir}/draco`,
    recursive: true
  },
  {
    label: 'Basis/KTX2 transcoder assets',
    packageName: 'three',
    source: 'node_modules/three/examples/jsm/libs/basis',
    destination: `assets/vendor/${threeRuntimeConfig.vendorDir}/basis`,
    recursive: true
  },
  {
    label: 'Meshopt decoder asset',
    packageName: 'meshoptimizer',
    source: 'node_modules/meshoptimizer/meshopt_decoder.cjs',
    destination: `assets/vendor/${threeRuntimeConfig.vendorDir}/meshopt/meshopt_decoder.js`
  }
]);

export const takramAssetCopies = Object.freeze([
  {
    label: 'Takram stars data asset',
    packageName: '@takram/three-atmosphere',
    source: 'node_modules/@takram/three-atmosphere/assets/stars.bin',
    destination: 'assets/vendor/takram-atmosphere/stars.bin'
  },
  ...['local_weather.png', 'shape.bin', 'shape_detail.bin', 'turbulence.png'].map((file) => ({
    label: `Takram cloud ${file} asset`,
    packageName: '@takram/three-clouds',
    source: `node_modules/@takram/three-clouds/assets/${file}`,
    destination: `assets/vendor/takram-clouds/${file}`
  }))
]);

export const requiredStaticAssets = Object.freeze([
  {
    label: 'Takram cloud STBN data asset',
    path: 'assets/vendor/takram-clouds/stbn.bin'
  }
]);

export const browserVendorAssets = Object.freeze([
  {
    packageName: 'aframe-extras',
    source: 'dist/aframe-extras.min.js',
    destination: 'assets/vendor/aframe-extras/aframe-extras.min.js'
  },
  {
    packageName: 'aframe-environment-component',
    source: 'dist/aframe-environment-component.min.js',
    destination: 'assets/vendor/aframe-environment/aframe-environment-component.min.js'
  },
  {
    packageName: 'lil-gui',
    source: 'dist/lil-gui.umd.js',
    destination: 'assets/vendor/lil-gui/lil-gui.umd.js'
  },
  {
    packageName: 'lil-gui',
    source: 'dist/lil-gui.css',
    destination: 'assets/vendor/lil-gui/lil-gui.css'
  },
  {
    packageName: 'lucide',
    source: 'dist/umd/lucide.min.js',
    destination: 'assets/vendor/lucide/lucide.min.js'
  }
]);

export const requiredRuntimePackages = Object.freeze(Array.from(new Set([
  ...Object.values(vendorArtifacts).flatMap((artifact) => artifact.packages || []),
  ...decoderAssets.map((asset) => asset.packageName),
  ...takramAssetCopies.map((asset) => asset.packageName),
  ...browserVendorAssets.map((asset) => asset.packageName)
])));

export function runtimeLibrarySource(bundleFile) {
  return `js/master/lib/${bundleFile}`;
}

export function packageModulePath(packageName, relativePath) {
  return path.join(
    fromPluginRoot('node_modules'),
    ...packageName.split('/'),
    ...String(relativePath).split('/')
  );
}

export function createRuntimeVersionManifest(aframeArtifact) {
  const browserPackages = Array.from(new Set([
    ...browserVendorAssets.map((asset) => asset.packageName),
    ...vendorArtifacts.statsGl.packages
  ]));
  const browserVersions = Object.fromEntries(
    browserPackages.map((packageName) => [packageName, getLockedPackageVersion(packageName)])
  );
  const browserFiles = Object.fromEntries([
    ...browserVendorAssets.map((asset) => [
      `${asset.packageName}:${path.posix.basename(asset.destination)}`,
      asset.destination
    ]),
    ['stats-gl:main.js', vendorArtifacts.statsGl.bundlePath]
  ]);

  return {
    schemaVersion: 2,
    generatedBy: 'scripts/build-runtime-vendors.mjs',
    aframe: {
      label: aframeArtifact.metadata.label,
      source: aframeArtifact.metadata.source,
      version: aframeArtifact.metadata.version,
      commit: aframeArtifact.metadata.commit,
      sourceCommit: aframeArtifact.metadata.sourceCommit,
      artifactCommit: aframeArtifact.artifactCommit,
      url: aframeArtifact.metadata.url,
      bundlePath: vendorArtifacts.aframe.bundlePath,
      sha256: aframeArtifact.sha256,
      requestedPowerPreference: 'high-performance'
    },
    three: {
      version: threeRuntimeConfig.version,
      revision: threeRuntimeConfig.revision,
      vendorDir: threeRuntimeConfig.vendorDir,
      bundleFile: threeRuntimeConfig.bundleFile,
      bundlePath: vendorArtifacts.three.bundlePath,
      decoders: {
        dracoDecoderPath: `assets/vendor/${threeRuntimeConfig.vendorDir}/draco/gltf/`,
        basisTranscoderPath: `assets/vendor/${threeRuntimeConfig.vendorDir}/basis/`,
        meshoptDecoderPath: `assets/vendor/${threeRuntimeConfig.vendorDir}/meshopt/meshopt_decoder.js`
      }
    },
    threeAddons: {
      global: vendorArtifacts.threeAddons.global,
      bundleFile: vendorArtifacts.threeAddons.bundleFile,
      bundlePath: vendorArtifacts.threeAddons.bundlePath
    },
    postprocessing: {
      version: getLockedPackageVersion('postprocessing'),
      global: vendorArtifacts.postprocessing.global,
      bundleFile: vendorArtifacts.postprocessing.bundleFile,
      bundlePath: vendorArtifacts.postprocessing.bundlePath
    },
    takram: {
      atmosphereVersion: getLockedPackageVersion('@takram/three-atmosphere'),
      cloudsVersion: getLockedPackageVersion('@takram/three-clouds'),
      effectsVersion: getLockedPackageVersion('@takram/three-geospatial-effects'),
      global: vendorArtifacts.takramAtmosphere.global,
      bundleFile: vendorArtifacts.takramAtmosphere.bundleFile,
      bundlePath: vendorArtifacts.takramAtmosphere.bundlePath,
      cloudsGlobal: vendorArtifacts.takramClouds.global,
      cloudsBundleFile: vendorArtifacts.takramClouds.bundleFile,
      cloudsBundlePath: vendorArtifacts.takramClouds.bundlePath,
      starsDataPath: 'assets/vendor/takram-atmosphere/stars.bin',
      assets: {
        starsDataPath: 'assets/vendor/takram-atmosphere/stars.bin',
        cloudsBasePath: 'assets/vendor/takram-clouds/',
        cloudsLocalWeatherPath: 'assets/vendor/takram-clouds/local_weather.png',
        cloudsShapePath: 'assets/vendor/takram-clouds/shape.bin',
        cloudsShapeDetailPath: 'assets/vendor/takram-clouds/shape_detail.bin',
        cloudsTurbulencePath: 'assets/vendor/takram-clouds/turbulence.png',
        cloudsStbnPath: 'assets/vendor/takram-clouds/stbn.bin'
      }
    },
    collisionBvh: {
      version: getLockedPackageVersion('three-mesh-bvh'),
      global: vendorArtifacts.collisionBvh.global,
      bundleFile: vendorArtifacts.collisionBvh.bundleFile,
      bundlePath: vendorArtifacts.collisionBvh.bundlePath
    },
    browserLibraries: {
      versions: browserVersions,
      files: browserFiles
    }
  };
}
