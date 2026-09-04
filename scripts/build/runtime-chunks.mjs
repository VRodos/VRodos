import {
  runtimeLibrarySource,
  vendorArtifacts
} from './vendor-catalog.mjs';
import { runtimeLibraryRoot } from './paths.mjs';

export const runtimeBuildManifestPath = 'assets/runtime-build-manifest.json';
export const generatedRuntimeContractPath =
  'assets/js/runtime/master/lib/vrodos-runtime-settings-contract.generated.js';

const runtimeSource = (file) => `assets/js/runtime/${file}`;
const masterSource = (file) => `assets/js/runtime/master/${file}`;

export const runtimeBuildChunks = Object.freeze([
  {
    id: 'scene-components',
    label: 'Scene components',
    output: 'vrodos-runtime-scene-components.bundle.js',
    order: 10,
    features: ['scene-components', 'poi', 'media', 'audio', 'assessment'],
    sourceFiles: [
      'vrodos_runtime_overlay.js',
      'highlight_img.js',
      'components/poi-image_component.js',
      'components/poi-link_component.js',
      'components/door_component.js',
      'components/audio_component.js',
      'components/video_component.js',
      'components/vrodos_hypnotic_hover.component.js',
      'assessment/assessment-utils.js',
      'assessment/assessment-session-runtime.js',
      'assessment/assessment-cefr-runtime.js',
      'assessment/assessment-renderers.js',
      'assessment/assessment-vr-overlay-runtime.js',
      'assessment/assessment-overlay-runtime.js',
      'components/immerse-assessment_component.js'
    ].map(runtimeSource)
  },
  {
    id: 'spatial-ui',
    label: 'Spatial UI runtime',
    output: 'vrodos-runtime-spatial-ui.bundle.js',
    order: 12,
    dependencies: ['scene-components'],
    features: ['spatial-ui', 'horizon-ui', 'assessment', 'video'],
    activationCapabilities: ['spatial-ui'],
    bundle: true,
    entryPoint: 'scripts/build/entries/spatial-ui.mjs',
    sourceFiles: [runtimeSource('spatial-ui/vrodos_spatial_ui.js')]
  },
  {
    id: 'networked-components',
    label: 'Networked scene components',
    output: 'vrodos-runtime-networked-components.bundle.js',
    order: 15,
    features: ['networked-components', 'chat', 'availability'],
    activationCapabilities: ['networking'],
    sourceFiles: [
      'components/chat_component.js',
      'components/chat_poi_component.js',
      'components/indicator_component.js'
    ].map(runtimeSource)
  },
  {
    id: 'core-runtime',
    label: 'Core runtime',
    output: 'vrodos-runtime-core.bundle.js',
    order: 20,
    dependencies: ['three-addons-vendor'],
    features: ['runtime-core', 'ui', 'rendering', 'quality-profiles', 'scene-probe'],
    sourceFiles: [
      generatedRuntimeContractPath,
      masterSource('vrodos_master_shared.js'),
      masterSource('vrodos_runtime_settings_helpers.js'),
      masterSource('vrodos_runtime_profile_policy.js'),
      masterSource('vrodos_runtime_render_policy.js'),
      masterSource('vrodos_runtime_resources.js'),
      masterSource('vrodos_ui_helpers.js'),
      masterSource('vrodos_hardware_capabilities.js'),
      masterSource('vrodos_hardware_diagnostics.js'),
      masterSource('vrodos_master_bootstrap.js'),
      masterSource('vrodos_spector_debug.js'),
      masterSource('vrodos_master_rendering.js'),
      masterSource('vrodos_scene_probe.js'),
      masterSource('vrodos_quality_profiles.js')
    ]
  },
  {
    id: 'legacy-postfx',
    label: 'Legacy post-FX engine',
    output: 'vrodos-runtime-legacy-postfx.bundle.js',
    order: 40,
    features: ['postfx', 'legacy-postfx', 'sao', 'ssr', 'taa', 'fxaa', 'bloom'],
    activationCapabilities: ['postfx:legacy'],
    sourceFiles: [
      'vrodos_shaders_bloom.js',
      'vrodos_shaders_sao.js',
      'vrodos_shaders_fxaa.js',
      'vrodos_shaders_taa.js',
      'vrodos_shaders_ssr.js',
      'vrodos_shaders_composite.js',
      'vrodos_postprocessing.js'
    ].map(masterSource)
  },
  {
    id: 'pmndrs-postfx',
    label: 'PMNDRS post-FX adapter',
    output: 'vrodos-runtime-pmndrs-postfx.bundle.js',
    order: 50,
    dependencies: ['pmndrs-postprocessing-vendor'],
    features: ['postfx', 'pmndrs-postfx'],
    activationCapabilities: ['postfx:pmndrs'],
    sourceFiles: [masterSource('vrodos_postprocessing_pmndrs.js')]
  },
  {
    id: 'aframe-components',
    label: 'Master A-Frame components',
    output: 'vrodos-runtime-aframe-components.bundle.js',
    order: 90,
    dependencies: ['core-runtime'],
    features: ['aframe-components', 'scene-settings', 'navigation', 'avatars'],
    sourceFiles: [
      'components/vrodos_scene_loader.component.js',
      'components/vrodos_avatar.component.js',
      'components/vrodos_scene_settings.component.js',
      'components/vrodos_runtime_pipeline.component.js',
      'components/vrodos_navigation.component.js',
      'components/vrodos_misc.component.js'
    ].map(masterSource)
  }
]);

function vendorScriptChunk(artifactId, chunk) {
  const artifact = vendorArtifacts[artifactId];
  if (!artifact?.bundleFile || !artifact?.bundlePath) {
    throw new Error(`Runtime vendor artifact is not declared: ${artifactId}`);
  }

  return {
    id: chunk.id,
    label: chunk.label,
    type: 'script',
    file: artifact.bundleFile,
    src: runtimeLibrarySource(artifact.bundleFile),
    order: chunk.order,
    dependencies: chunk.dependencies || [],
    features: chunk.features || [],
    ...(chunk.activationCapabilities?.length
      ? { activationCapabilities: chunk.activationCapabilities }
      : {}),
    generatedBy: 'build:vendor',
    artifactId
  };
}

export const externalRuntimeChunks = Object.freeze([
  vendorScriptChunk('threeAddons', {
    id: 'three-addons-vendor',
    label: 'Three addons vendor',
    order: 18,
    dependencies: [],
    features: ['three-addons', 'hdr-loader']
  }),
  vendorScriptChunk('postprocessing', {
    id: 'pmndrs-postprocessing-vendor',
    label: 'PMNDRS postprocessing vendor',
    order: 35,
    dependencies: [],
    features: ['pmndrs-vendor', 'postprocessing']
  }),
  vendorScriptChunk('takramAtmosphere', {
    id: 'takram-atmosphere',
    label: 'Takram atmosphere vendor',
    order: 45,
    dependencies: ['pmndrs-postprocessing-vendor'],
    features: ['takram-atmosphere', 'pmndrs-atmosphere', 'takram-celestial', 'takram-geospatial'],
    activationCapabilities: ['atmosphere:takram']
  }),
  vendorScriptChunk('takramClouds', {
    id: 'takram-clouds',
    label: 'Takram volumetric clouds vendor',
    order: 46,
    dependencies: ['takram-atmosphere'],
    features: ['takram-clouds', 'pmndrs-clouds', 'volumetric-clouds'],
    activationCapabilities: ['clouds:takram']
  }),
  vendorScriptChunk('collisionBvh', {
    id: 'collision-bvh-vendor',
    label: 'Static collision BVH vendor',
    order: 32,
    dependencies: [],
    features: ['collision-bvh', 'navigation', 'player-collision'],
    activationCapabilities: ['collision-bvh']
  }),
  {
    id: 'fps-meter',
    label: 'FPS meter tooling',
    type: 'inline-module',
    order: 30,
    dependencies: [],
    features: ['fps-meter', 'debug-tooling'],
    activationCapabilities: ['fps-meter'],
    moduleImport: `VRODOS_PLUGIN_URL_PLACEHOLDER${vendorArtifacts.statsGl.bundlePath}`,
    readyGlobal: 'VRODOS_STATS_READY',
    global: 'Stats',
    export: 'default',
    artifactId: 'statsGl'
  }
]);

function builtChunkManifestEntry(chunk) {
  return {
    id: chunk.id,
    label: chunk.label,
    type: 'script',
    file: chunk.output,
    src: runtimeLibrarySource(chunk.output),
    order: chunk.order,
    dependencies: chunk.dependencies || [],
    features: chunk.features || [],
    ...(chunk.activationCapabilities?.length
      ? { activationCapabilities: chunk.activationCapabilities }
      : {}),
    sourceFiles: chunk.sourceFiles,
    generatedBy: 'build:runtime'
  };
}

export function createRuntimeBuildManifest() {
  const chunks = {};

  for (const chunk of runtimeBuildChunks) {
    chunks[chunk.id] = builtChunkManifestEntry(chunk);
  }
  for (const chunk of externalRuntimeChunks) {
    const { artifactId: _artifactId, ...manifestChunk } = chunk;
    chunks[chunk.id] = manifestChunk;
  }

  return {
    schemaVersion: 2,
    generatedBy: 'scripts/build-runtime-master-bundles.mjs',
    runtimeRoot: runtimeLibraryRoot,
    chunks
  };
}
