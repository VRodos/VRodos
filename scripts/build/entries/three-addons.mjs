import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const THREE = window.THREE || (window.AFRAME && window.AFRAME.THREE) || {};
THREE.HDRLoader = HDRLoader;
THREE.RGBELoader = RGBELoader || HDRLoader;
window.THREE = THREE;
window.VRODOS_THREE_ADDONS = {
  HDRLoader,
  RGBELoader: THREE.RGBELoader
};
