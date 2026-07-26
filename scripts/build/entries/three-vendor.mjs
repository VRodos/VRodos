import * as THREEBase from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import * as POSTPROCESSING from 'postprocessing';

const THREE = window.THREE && typeof window.THREE === 'object' ? window.THREE : {};

Object.assign(THREE, { ...THREEBase }, {
  OrbitControls,
  TransformControls,
  PointerLockControls,
  GLTFLoader,
  DRACOLoader,
  HDRLoader,
  KTX2Loader,
  MeshoptDecoder,
  // Compatibility alias for older VRodos editor/runtime code paths.
  RGBELoader: HDRLoader,
  CSS2DRenderer,
  CSS2DObject,
  EffectComposer,
  RenderPass,
  ShaderPass,
  OutlinePass,
  FXAAShader
});

window.THREE = THREE;
window.Stats = Stats;
window.POSTPROCESSING = POSTPROCESSING;
