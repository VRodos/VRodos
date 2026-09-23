import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import * as Three from 'three';

const root = resolve(import.meta.dirname, '..');

class OrbitControls {
    constructor(object) {
        this.object = object;
        this.target = new Three.Vector3();
    }

    addEventListener() {}

    update() {
        this.object.lookAt(this.target);
    }
}

const VRODOS = {
    editorRender: {
        camera: { near: 0.01, avatarFar: 4000, thirdPersonFar: 3000 },
        zoom: { min: 10, max: 5000, fallback: 600 }
    },
    editor: {},
    editorScene: {},
    api: {},
    ui: {},
    utils: {
        orthoFitZoom: () => 500,
        displayText: (value) => value
    }
};
let selected = null;
let transformCamera = null;
VRODOS.editor.transforms = {
    getRealObject: () => selected,
    attach: (object) => { selected = object; },
    detach: () => { selected = null; },
    setCamera: (camera) => { transformCamera = camera; },
    setMode() {},
    getMode: () => 'translate',
    syncGui() {}
};
VRODOS.editor.sceneRegistry = {
    add() {},
    getBounds: (object) => new Three.Box3().setFromObject(object)
};
VRODOS.editor.render = { request() {} };
const context = vm.createContext({
    window: { VRODOS },
    VRODOS,
    THREE: { ...Three, OrbitControls },
    document: { getElementById: () => null }
});

for (const file of [
    'assets/js/editor/render/vrodos_editor_cameras.js',
    'assets/js/editor/scene/vrodos_scene_selection.js',
    'assets/js/editor/scene/vrodos_scene_raycasting.js'
]) {
    vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context, { filename: file });
}

const scene = new Three.Scene();
const envir = {
    scene,
    renderer: { domElement: {} },
    updateScreenMetrics() {},
    VIEW_ANGLE: 60,
    ASPECT: 1.5,
    FRUSTUM_SIZE: 100000,
    NEAR: 0.01,
    FAR: 200000,
    SCENE_DIMENSION_SURFACE: 100,
    SCENE_DIMENSION_HEIGHT: 50,
    SCENE_CENTER_X: 0,
    SCENE_CENTER_Y: 0,
    SCENE_CENTER_Z: 0,
    is2d: false
};
VRODOS.editorRender.installCameraMethods(envir);
envir.setOrbitCamera();
VRODOS.editor.envir = envir;
VRODOS.ui.addCelOutline = () => {};
VRODOS.ui.removeAllCelOutlines = () => {};

const building = new Three.Mesh(new Three.BoxGeometry(10, 8, 12));
building.position.set(40, 4, 15);
scene.add(building);

const initial3DPosition = envir.cameraOrbit3D.position.clone();
const initial3DTarget = envir.orbitControls.target.clone();
VRODOS.ui.selectObjectPreview(building);
assert.ok(envir.cameraOrbit3D.position.equals(initial3DPosition), 'hierarchy preview must not move the camera');
assert.ok(envir.orbitControls.target.equals(initial3DTarget), 'hierarchy preview must not move the pivot');

const initial3DOffset = envir.cameraOrbit3D.position.clone().sub(envir.orbitControls.target);
const initial2DOffset = envir.cameraOrbit2D.position.clone().sub(envir.orbitTarget2D);
const initial2DZoom = envir.cameraOrbit2D.zoom;
VRODOS.ui.selectorMajor({ button: 0 }, building, 'canvas');
assert.ok(envir.orbitControls.target.equals(building.position), 'confirmed selection must center the pivot');
assert.ok(envir.cameraOrbit3D.position.clone().sub(envir.orbitControls.target).distanceTo(initial3DOffset) < 1e-9, '3D selection must preserve camera offset');
assert.ok(envir.cameraOrbit2D.position.clone().sub(envir.orbitTarget2D).distanceTo(initial2DOffset) < 1e-9, '2D selection must preserve camera offset');
assert.equal(envir.cameraOrbit2D.zoom, initial2DZoom, 'selection must preserve 2D zoom');

const selectedTarget = envir.orbitControls.target.clone();
VRODOS.editor.selection.clear({ source: 'test' });
assert.ok(envir.orbitControls.target.equals(selectedTarget), 'deselection must leave the orbit pivot in place');

envir.setOrbitCameraMode(true);
assert.equal(envir.cameraOrbit, envir.cameraOrbit2D);
assert.equal(envir.orbitControls.object, envir.cameraOrbit2D);
assert.equal(transformCamera, envir.cameraOrbit2D);
envir.cameraOrbit2D.position.x += 5;
envir.orbitControls.target.x += 5;
envir.setOrbitCameraMode(false);
envir.setOrbitCameraMode(true);
assert.equal(envir.orbitControls.target.x, building.position.x + 5, 'mode switching must preserve the 2D pan');
assert.equal(envir.cameraOrbit2D.zoom, initial2DZoom, 'mode switching must preserve the 2D zoom');

envir.setOrbitCameraMode(false);
envir.frameOrbitObject(building);
const frameDistance = envir.cameraOrbit3D.position.distanceTo(envir.orbitControls.target);
assert.ok(frameDistance < initial3DOffset.length(), 'new-object framing must move closer than the scene overview');
assert.ok(frameDistance > 8, 'new-object framing must leave the object visible');
assert.ok(envir.orbitTarget2D.equals(building.position), 'framing must also center the inactive top view');

const perspectivePosition = envir.cameraOrbit3D.position.clone();
const perspectiveTarget = envir.orbitControls.target.clone();
const expectedHeight = frameDistance * 2 * Math.tan(Three.MathUtils.degToRad(envir.VIEW_ANGLE) / 2);
assert.equal(envir.setOrbitProjection('orthographic'), true);
assert.equal(envir.cameraOrbit, envir.cameraOrbitOrtho3D);
assert.ok(envir.cameraOrbit.position.equals(perspectivePosition), 'switching projection must preserve camera position');
assert.ok(envir.orbitControls.target.equals(perspectiveTarget), 'switching projection must preserve the target');
assert.ok(Math.abs((envir.cameraOrbit.top - envir.cameraOrbit.bottom) / envir.cameraOrbit.zoom - expectedHeight) < 1e-8, 'projection switch must preserve apparent scale at the target');
assert.equal(transformCamera, envir.cameraOrbitOrtho3D, 'transform controls must use the active orthographic camera');

envir.cameraOrbit.zoom = 2;
envir.cameraOrbit.updateProjectionMatrix();
envir.setOrbitProjection('perspective');
assert.ok(Math.abs(envir.cameraOrbit.position.distanceTo(perspectiveTarget) - frameDistance / 2) < 1e-8, 'orthographic zoom must become perspective distance');
envir.setOrbitProjection('orthographic');
const orthoZoom = envir.cameraOrbit.zoom;
envir.setOrbitCameraMode(true);
assert.equal(envir.setOrbitProjection('perspective'), false, '2D top view must not change the 3D projection');
envir.setOrbitCameraMode(false);
assert.equal(envir.cameraOrbit, envir.cameraOrbitOrtho3D, 'returning from 2D must restore the chosen 3D projection');
assert.equal(envir.cameraOrbit.zoom, orthoZoom, '2D top view must not alter 3D orthographic scale');
envir.frameOrbitObject(building);
assert.ok(Number.isFinite(envir.cameraOrbit.zoom) && envir.cameraOrbit.zoom > 0, 'orthographic object framing must set a usable zoom');

console.log('Editor camera navigation test passed.');
