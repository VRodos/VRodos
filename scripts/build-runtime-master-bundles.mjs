import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const runtimeMasterDir = path.join(rootDir, 'assets', 'js', 'runtime', 'master');
const runtimeDir = path.join(rootDir, 'assets', 'js', 'runtime');
const outputDir = path.join(runtimeMasterDir, 'lib');
const contractPath = path.join(rootDir, 'assets', 'runtime-settings-contract.json');
const contractOutputPath = path.join(outputDir, 'vrodos-runtime-settings-contract.generated.js');
const manifestPath = path.join(rootDir, 'assets', 'runtime-build-manifest.json');

const runtimeLibrarySrc = (file) => `js/master/lib/${file}`;
const relativeSource = (file) => path.relative(rootDir, file).replaceAll(path.sep, '/');

const chunks = [
  {
    id: 'scene-components',
    label: 'Scene components',
    output: 'vrodos-runtime-scene-components.bundle.js',
    order: 10,
    features: ['scene-components', 'poi', 'media', 'audio', 'assessment'],
    files: [
      'highlight_img.js',
      'components/poi-image_component.js',
      'components/chat_poi_component.js',
      'components/indicator_component.js',
      'components/poi-link_component.js',
      'components/door_component.js',
      'components/audio_component.js',
      'components/video_component.js',
      'components/vrodos_hypnotic_hover.component.js',
      'assessment/assessment-utils.js',
      'assessment/assessment-cefr-runtime.js',
      'assessment/assessment-renderers.js',
      'assessment/assessment-overlay-runtime.js',
      'components/immerse-assessment_component.js'
    ].map((file) => path.join(runtimeDir, file))
  },
  {
    id: 'core-runtime',
    label: 'Core runtime',
    output: 'vrodos-runtime-core.bundle.js',
    order: 20,
    features: ['runtime-core', 'ui', 'rendering', 'quality-profiles', 'scene-probe'],
    files: [
      contractOutputPath,
      path.join(runtimeMasterDir, 'vrodos_master_shared.js'),
      path.join(runtimeMasterDir, 'vrodos_ui_helpers.js'),
      path.join(runtimeMasterDir, 'vrodos_master_bootstrap.js'),
      path.join(runtimeMasterDir, 'vrodos_master_rendering.js'),
      path.join(runtimeMasterDir, 'vrodos_scene_probe.js'),
      path.join(runtimeMasterDir, 'vrodos_quality_profiles.js')
    ]
  },
  {
    id: 'legacy-postfx',
    label: 'Legacy post-FX engine',
    output: 'vrodos-runtime-legacy-postfx.bundle.js',
    order: 40,
    features: ['postfx', 'legacy-postfx', 'sao', 'ssr', 'taa', 'fxaa', 'bloom'],
    files: [
      'vrodos_shaders_bloom.js',
      'vrodos_shaders_sao.js',
      'vrodos_shaders_fxaa.js',
      'vrodos_shaders_taa.js',
      'vrodos_shaders_ssr.js',
      'vrodos_shaders_composite.js',
      'vrodos_postprocessing.js'
    ].map((file) => path.join(runtimeMasterDir, file))
  },
  {
    id: 'pmndrs-postfx',
    label: 'PMNDRS post-FX adapter',
    output: 'vrodos-runtime-pmndrs-postfx.bundle.js',
    order: 50,
    dependencies: ['pmndrs-postprocessing-vendor'],
    features: ['postfx', 'pmndrs-postfx'],
    files: [
      path.join(runtimeMasterDir, 'vrodos_postprocessing_pmndrs.js')
    ]
  },
  {
    id: 'aframe-components',
    label: 'Master A-Frame components',
    output: 'vrodos-runtime-aframe-components.bundle.js',
    order: 90,
    dependencies: ['core-runtime'],
    features: ['aframe-components', 'scene-settings', 'navigation', 'avatars'],
    files: [
      'components/vrodos_scene_loader.component.js',
      'components/vrodos_avatar.component.js',
      'components/vrodos_scene_settings.component.js',
      'components/vrodos_navigation.component.js',
      'components/vrodos_misc.component.js'
    ].map((file) => path.join(runtimeMasterDir, file))
  }
];

const externalChunks = [
  {
    id: 'pmndrs-postprocessing-vendor',
    label: 'PMNDRS postprocessing vendor',
    type: 'script',
    file: 'vrodos-postprocessing.bundle.js',
    src: runtimeLibrarySrc('vrodos-postprocessing.bundle.js'),
    order: 35,
    dependencies: [],
    features: ['pmndrs-vendor', 'postprocessing'],
    generatedBy: 'build:three'
  },
  {
    id: 'takram-atmosphere',
    label: 'Takram atmosphere vendor',
    type: 'script',
    file: 'vrodos-takram-atmosphere.bundle.js',
    src: runtimeLibrarySrc('vrodos-takram-atmosphere.bundle.js'),
    order: 45,
    dependencies: [],
    features: ['takram-atmosphere', 'pmndrs-atmosphere', 'takram-celestial', 'takram-geospatial'],
    generatedBy: 'build:three'
  },
  {
    id: 'fps-meter',
    label: 'FPS meter tooling',
    type: 'inline-module',
    order: 30,
    dependencies: [],
    features: ['fps-meter', 'debug-tooling'],
    moduleImport: 'https://cdn.jsdelivr.net/npm/stats-gl@2.2.8/dist/main.js',
    readyGlobal: 'VRODOS_STATS_READY',
    global: 'Stats',
    export: 'default'
  }
];

async function buildContract() {
  const raw = await readFile(contractPath, 'utf8');
  const parsed = JSON.parse(raw);
  const source = [
    '/* Generated by scripts/build-runtime-master-bundles.mjs. Do not edit directly. */',
    '(function () {',
    `    window.VRODOS_RUNTIME_SETTINGS_CONTRACT = ${JSON.stringify(parsed, null, 4)};`,
    '}());',
    ''
  ].join('\n');

  await writeFile(contractOutputPath, source, 'utf8');
}

async function readSource(file) {
  const source = await readFile(file, 'utf8');
  return `\n/* ===== ${relativeSource(file)} ===== */\n${source.trim()}\n`;
}

async function buildChunk(chunk) {
  const sources = [];
  for (const file of chunk.files) {
    sources.push(await readSource(file));
  }

  const outputPath = path.join(outputDir, chunk.output);
  await build({
    stdin: {
      contents: sources.join('\n'),
      resolveDir: rootDir,
      sourcefile: `${chunk.id}.runtime-concat.js`
    },
    bundle: false,
    format: 'iife',
    platform: 'browser',
    target: ['es2019'],
    outfile: outputPath,
    legalComments: 'none',
    banner: {
      js: '/* Generated by scripts/build-runtime-master-bundles.mjs. Do not edit directly. */'
    }
  });

  console.log(`Built ${path.relative(rootDir, outputPath)}`);
}

function chunkManifestEntry(chunk) {
  return {
    id: chunk.id,
    label: chunk.label,
    type: 'script',
    file: chunk.output,
    src: runtimeLibrarySrc(chunk.output),
    order: chunk.order,
    dependencies: chunk.dependencies || [],
    features: chunk.features || [],
    sourceFiles: chunk.files.map(relativeSource),
    generatedBy: 'build:runtime'
  };
}

async function buildManifest() {
  const manifestChunks = {};
  for (const chunk of chunks) {
    manifestChunks[chunk.id] = chunkManifestEntry(chunk);
  }
  for (const chunk of externalChunks) {
    manifestChunks[chunk.id] = chunk;
  }

  const manifest = {
    schemaVersion: 1,
    generatedBy: 'scripts/build-runtime-master-bundles.mjs',
    runtimeRoot: 'assets/js/runtime/master/lib',
    chunks: manifestChunks
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Built ${path.relative(rootDir, manifestPath)}`);
}

await mkdir(outputDir, { recursive: true });
await buildContract();
console.log(`Built ${path.relative(rootDir, contractOutputPath)}`);

for (const chunk of chunks) {
  await buildChunk(chunk);
}

await buildManifest();
