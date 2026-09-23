import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import * as THREE from 'three';

const root = resolve(import.meta.dirname, '..');
const VRODOS = {
    editor: {}, editorRender: {}, loader: {},
    utils: { clampNumber: (value, min, max, fallback) => Number.isFinite(Number(value))
        ? Math.min(max, Math.max(min, Number(value))) : fallback }
};
const context = vm.createContext({ window: { VRODOS }, VRODOS, THREE, console });
for (const file of [
    'assets/js/editor/render/vrodos_editor_environment_helpers.js',
    'assets/js/editor/render/vrodos_editor_director_helpers.js',
    'assets/js/editor/loaders/vrodos_loader_object_factories.js',
    'assets/js/editor/loaders/vrodos_loader_director_camera.js'
]) {
    vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context, { filename: file });
}

const methods = {};
VRODOS.editorRender.installDirectorHelperMethods(methods);
const envir = Object.assign(Object.create(methods), {
    scene: new THREE.Scene(),
    cameraAvatar: new THREE.PerspectiveCamera(),
    directorFacingQuaternion: new THREE.Quaternion(),
    directorMarkerCenter: new THREE.Vector3(),
    directorMarkerViewPosition: new THREE.Vector3(),
    directorInternalHelpers: new Set()
});
envir.cameraAvatar.name = 'avatarCamera';
envir.cameraAvatar.rotation.order = 'YXZ';
envir.scene.add(envir.cameraAvatar);
VRODOS.editor.envir = envir;
VRODOS.editor.sceneRegistry = {
    add() {},
    remove(object) { object.parent?.remove(object); }
};

function near(actual, expected, label) {
    assert.ok(Math.abs(actual - expected) < 1e-6, `${label}: ${actual} != ${expected}`);
}

const pitch = THREE.MathUtils.degToRad(25);
const yaw = THREE.MathUtils.degToRad(70);
const marker = VRODOS.loader.createDirectorMarker({ position: [2, 1.6, 3], rotation: [pitch, yaw, 0] });
assert.equal(marker.parent, envir.cameraAvatar, 'person stays attached to the Director camera');
assert.equal(marker.vrodos_internal_helper, true, 'person is editor-only');
assert.equal(marker.isSelectableMesh, true, 'person remains selectable');

const body = marker.directorUprightBody;
const bounds = new THREE.Box3().setFromObject(body);
near(bounds.min.y, 0, 'feet rest at ground when eyes are at 1.6 m');
near(bounds.max.y, 1.75, 'standing height is 1.75 m');
const upright = new THREE.Vector3(0, 1, 0).applyQuaternion(body.getWorldQuaternion(new THREE.Quaternion()));
near(upright.x, 0, 'person stays upright x');
near(upright.y, 1, 'person stays upright y');
near(upright.z, 0, 'person stays upright z');

const arrow = marker.getObjectByName('DirectorForwardShaft');
const markerForward = new THREE.Vector3(0, 0, -1).applyQuaternion(arrow.getWorldQuaternion(new THREE.Quaternion()));
const cameraForward = envir.cameraAvatar.getWorldDirection(new THREE.Vector3());
near(markerForward.distanceTo(cameraForward), 0, 'forward marker follows the full camera direction');

const editorCamera = new THREE.PerspectiveCamera();
editorCamera.position.set(2, 1, 8);
envir.updateDirectorMarkerOpacity(editorCamera);
near(marker.directorFadeMaterials[0].opacity, 1, 'person is opaque from a distance');
editorCamera.position.set(2, 0.75, 3);
envir.updateDirectorMarkerOpacity(editorCamera);
near(marker.directorFadeMaterials[0].opacity, 0.2, 'person fades when viewed up close');
near(arrow.material.opacity, 1, 'forward indicator stays visible');

const hits = new THREE.Raycaster(new THREE.Vector3(2, 1.1, 5), new THREE.Vector3(0, 0, -1))
    .intersectObjects([marker], true);
assert.ok(hits.length > 0, 'person can be picked through its visible geometry');

envir.applyDirectorTransform([4, 0.2, 5], [0, 0, 0]);
near(envir.cameraAvatar.position.y, 0.2, 'existing low camera positions remain unchanged');
envir.resetDirectorTransform();
near(envir.cameraAvatar.position.y, 1.6, 'reset restores eye height');

const starterScene = JSON.parse(readFileSync(resolve(root, 'assets/scenes/standard_scene.json'), 'utf8'));
assert.equal(starterScene.objects.avatarCamera.position[1], 1.6, 'new scenes start at eye height');

// JSON reloads contain cameraCoords rather than an avatarCamera resource.
vm.runInContext(readFileSync(resolve(root, 'assets/js/editor/loaders/vrodos_loader_multi.js'), 'utf8'), context);
VRODOS.loader.applyResourceLoadProfile = () => ({});
VRODOS.loader.handleResourceMetadata = (name, resource) => {
    if (name !== 'cameraCoords') return false;
    envir.applyDirectorTransform(resource.position, resource.rotation);
    return true;
};
VRODOS.loader.isLightOrPawnResource = () => false;
VRODOS.loader.isGlbSceneResource = () => false;
VRODOS.utils.normalizeSceneAssetCategory = () => '';
VRODOS.utils.isSceneAssessmentCategory = () => false;
VRODOS.utils.isSceneTextCategory = () => false;
VRODOS.utils.isSceneImageCategory = () => false;

envir.clearDirectorInternalHelpers();
await new VRODOS.loader.LoaderMulti().load(null, {
    cameraCoords: { position: [7, 2.4, -3], rotation: [0, 0.5, 0] }
});
assert.equal(envir.getDirectorVisualObject()?.parent, envir.cameraAvatar, 'JSON reload restores the person');
near(envir.cameraAvatar.position.y, 2.4, 'JSON reload preserves the saved camera height');

envir.clearDirectorInternalHelpers();
await new VRODOS.loader.LoaderMulti().load(null, { avatarCamera: { position: [0, 1.6, 0] } });
assert.equal(envir.getDirectorVisualObject()?.parent, envir.cameraAvatar, 'regular scene load restores the person');

console.log('Editor Director marker test passed.');
