import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'espree';
import * as THREE from 'three';

const scene = new THREE.Scene();
const light = new THREE.SpotLight();
light.name = 'test-lamp';
light.category_name = 'lightLamp';
scene.add(light);
let selected = light;
let saves = 0;
const inputs = new Map();
for (const id of ['lampPower', 'lampRadius', 'ambientColor', 'spotTargetObject', 'poi_chat_title', 'poi_image_title_text', 'poi_image_desc_text', 'teleport_point_name', 'popupDoorSelect']) {
    const handlers = {};
    inputs.set(id, { value: '', addEventListener(type, callback) { handlers[type] = callback; },
        fire(type, value) { if (value !== undefined) this.value = value; handlers[type]?.call(this); } });
}
inputs.get('popupDoorSelect').dataset = {};
inputs.get('popupDoorSelect').options = ['Default', '102', '103'].map(value => ({ value, textContent: value }));
const context = vm.createContext({ THREE, console,
    document: { readyState: 'loading', addEventListener() {}, getElementById: id => inputs.get(id) || null },
    vrodosPersistentPropertyListenersBound: false,
    getSelectedPropertyTarget: () => selected,
    getEditorSceneObjectByName: name => scene.getObjectByName(name),
    getEditorSceneObjectByUuid: uuid => scene.getObjectByProperty('uuid', uuid),
    VRODOS: { editor: { envir: { scene }, requestRender() {}, animate() {},
        sceneRegistry: { get: id => scene.getObjectByProperty('uuid', id) } },
    utils: {}, ui: {}, loader: { refreshPrimitivePlaneProperty() {} },
    api: { saveChanges() { saves++; }, triggerAutoSave() { saves++; } } }
});
context.window = context;
const read = path => readFileSync(new URL(`../assets/js/editor/${path}`, import.meta.url), 'utf8');
vm.runInContext(read('scene/vrodos_scene_light_artifacts.js'), context);
vm.runInContext(read('scene/vrodos_undo_engine.js'), context);
const source = read('ui/vrodos_property_controls.js');
const names = new Set(['initPersistentPropertyListeners', 'bindPoiImageControls', '_getEditorInput', '_bindEditorInputChange',
    '_bindTrackedEditorInputChange', '_getLightShadowRadius', '_getFirstChildMaterialColorHex',
    '_getObjectColorHex', 'sanitizeInputValue', 'displaySharedPropertySections',
    '_normalizeDoorTargetValue', '_getDoorTargetValue', '_findDoorTargetOption', '_setDoorSelectValue',
    '_bindDoorSelectToObject', '_getDoorSelectObject', '_syncDoorTargetSceneRecord']);
for (const node of parse(source, { ecmaVersion: 'latest' }).body) {
    if (node.type === 'FunctionDeclaration' && names.has(node.id.name)) {
        vm.runInContext(source.slice(node.start, node.end), context);
    }
}
context.initPersistentPropertyListeners();
const power = inputs.get('lampPower');
const initialPower = light.power;
power.fire('focus');
power.fire('input', '25');
power.fire('input', '50');
assert.equal(light.power, 50);
assert.equal(saves, 0, 'Live previews must not save.');
power.fire('change');
assert.equal(saves, 1);
const manager = context.VRODOS.editor.undoManager;
assert.equal(manager.undoStack.length, 1);
manager.undo();
assert.equal(light.power, initialPower);
manager.redo();
assert.equal(light.power, 50);
power.fire('change');
assert.equal(saves, 3, 'Repeated unchanged commit must not save or capture undo.');
const radius = inputs.get('lampRadius');
const originalRadius = light.shadow.radius;
radius.fire('focus');
radius.fire('input', '4');
radius.fire('change');
assert.equal(light.shadow.radius, 4);
manager.undo();
assert.equal(light.shadow.radius, originalRadius, 'Undo must restore the actual shadow object.');
manager.redo();
assert.equal(light.shadow.radius, 4);
const color = inputs.get('ambientColor');
color.fire('focus');
color.fire('input', '#ff0000');
color.fire('change');
assert.equal(light.color.getHexString(), 'ff0000');
manager.undo();
assert.equal(light.color.getHexString(), 'ffffff');
const originalTarget = light.target;
const newTarget = new THREE.Object3D();
newTarget.name = 'new-target';
scene.add(newTarget);
inputs.get('spotTargetObject').fire('change', newTarget.name);
assert.equal(light.target, newTarget);
manager.undo();
assert.equal(light.target, originalTarget, 'Undo must restore light targeting through the shared linker.');
manager.redo();
assert.equal(light.target, newTarget);
const other = new THREE.Object3D();
scene.add(other);
power.fire('focus');
selected = other;
power.fire('change', '999');
assert.equal(other.power, undefined, 'A stale focused input must not edit a different selection.');
inputs.get('poi_chat_title').fire('change', 'Discussion');
assert.equal(other.poi_chat_title, 'Discussion', 'Shared non-light property inputs must remain usable.');
inputs.get('poi_image_title_text').fire('change', 'Έκθεμα');
inputs.get('poi_image_desc_text').fire('change', 'Πρώτη γραμμή\nΔεύτερη γραμμή');
assert.equal(other.poi_img_title, 'Έκθεμα', 'POI title input must update the title property.');
assert.equal(other.poi_img_content, 'Πρώτη γραμμή\nΔεύτερη γραμμή', 'POI description preserves Greek and line breaks.');
manager.undo();
assert.equal(other.poi_img_content, undefined, 'POI text can be undone independently.');
manager.redo();
assert.equal(other.poi_img_content, 'Πρώτη γραμμή\nΔεύτερη γραμμή', 'POI text redo restores content.');
inputs.get('teleport_point_name').fire('change', 'Είσοδος ναού');
assert.equal(other.asset_name, 'Είσοδος ναού', 'Destination names use the placement display name consumed by compilation.');

// Image placements expose the existing text bindings without exposing a dialog photo.
vm.runInContext(read('core/vrodos_editor_core_utils.js'), context);
const categories = read('ui/vrodos_property_categories.js');
const panelAssignment = parse(categories, { ecmaVersion: 'latest' }).body.find(node =>
    node.type === 'ExpressionStatement' && node.expression.left?.property?.name === 'displayPoiImageTextProperties');
vm.runInContext(categories.slice(panelAssignment.start, panelAssignment.end), context);
for (const id of ['poi_text_properties_heading', 'poi_photo_properties', 'image_dialog_properties_hint']) {
    inputs.set(id, { textContent: '', hidden: false });
}
const panel = { style: {} };
context._getPropertyPanelState = () => ({ panel, sceneObj: selected });
context._setEditorInputValue = (id, value) => { inputs.get(id).value = value; };
context._showEditorPanel = target => { target.style.display = ''; };
context.VRODOS.ui.refreshPoiImageControls = () => {};
context.vrodosGetEffectiveObjectCategory = object => object.category_slug;
other.category_slug = 'image';
other.poi_img_title = 'Default';
other.poi_img_content = 'Default description';
const secondImage = new THREE.Object3D();
secondImage.category_slug = 'image';
secondImage.poi_img_title = 'Default';
secondImage.poi_img_content = 'Default description';
scene.add(secondImage);
assert.equal(context.displaySharedPropertySections({}, other), true);
assert.equal(inputs.get('poi_text_properties_heading').textContent, 'Optional text dialog');
assert.equal(inputs.get('poi_photo_properties').hidden, true);
assert.equal(inputs.get('poi_image_title_text').value, 'Default');
inputs.get('poi_image_title_text').fire('change', 'My placement');
assert.equal(secondImage.poi_img_title, 'Default', 'Editing one Image must not change another placement.');
inputs.get('poi_image_title_text').fire('change', '');
inputs.get('poi_image_desc_text').fire('change', '');
assert.equal(other.poi_img_title, '');
assert.equal(other.poi_img_content, '');
manager.undo();
assert.equal(other.poi_img_content, 'Default description');
manager.redo();
assert.equal(other.poi_img_content, '', 'Redo must retain an explicitly cleared Image description.');
other.category_slug = 'poi-imagetext';
context.displaySharedPropertySections({}, other);
assert.equal(inputs.get('poi_photo_properties').hidden, false, 'Selecting a normal POI restores photo controls.');
assert.equal(inputs.get('image_dialog_properties_hint').hidden, true);

const doorAssignment = parse(categories, { ecmaVersion: 'latest' }).body.find(node =>
    node.type === 'ExpressionStatement' && node.expression.left?.property?.name === 'displayDoorProperties');
vm.runInContext(categories.slice(doorAssignment.start, doorAssignment.end), context);
context.vrodosGetEffectiveObjectCategory = context.VRODOS.utils.resolveSceneAssetCategory;
other.category_slug = 'decoration';
other.sceneAssetRole = 'door';
panel.style.display = 'none';
assert.equal(context.displaySharedPropertySections({}, other), true);
assert.equal(panel.style.display, '', 'A decoration with the Door role must expose destination controls.');
const destination = inputs.get('popupDoorSelect');
assert.equal(destination.value, 'Default');
const savesBeforeDestination = saves;
destination.fire('change', '102');
assert.equal(other.sceneID_target, '102', 'Converted doors must accept a destination scene.');
assert.equal(saves, savesBeforeDestination + 1, 'Choosing a door destination must save.');
manager.undo();
assert.equal(other.sceneID_target, '', 'Undo must clear a newly chosen door destination.');
manager.redo();
assert.equal(other.sceneID_target, '102', 'Redo must restore the door destination.');
context.displaySharedPropertySections({}, other);
assert.equal(destination.value, '102', 'Reopening a converted door must display its destination.');
selected = null;
power.fire('focus');
power.fire('change', '1');
console.log('Editor property preview, commit, and undo tests passed.');
