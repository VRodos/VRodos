import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { Object3D } from "three";

const root = resolve(import.meta.dirname, "..");

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Scene asset role test failed: ${message}`);
    }
}

const context = {
    console,
    document: {
        readyState: "complete",
        addEventListener() {},
        getElementById() {
            return null;
        }
    },
    TextDecoder,
    Uint8Array,
    VRODOS: {
        api: {},
        config: { SCENE_SETTINGS_SCHEMA: {} },
        data: {},
        editor: {},
        exporter: {},
        importer: {},
        loader: {},
        ui: {},
        utils: {}
    }
};
context.window = context;

for (const relativePath of [
    "assets/js/editor/core/vrodos_editor_core_utils.js",
    "assets/js/editor/scene/vrodos_scene_persistence.js"
]) {
    vm.runInNewContext(readFileSync(resolve(root, relativePath), "utf8"), context, { filename: relativePath });
}

context.VRODOS.utils.isAssessmentResource = () => false;

const decoration = { category_slug: "decoration" };
const inheritedWalkable = { category_slug: "walkable-surface" };
assert(context.VRODOS.utils.resolveSceneAssetCategory(decoration) === "decoration", "decorations must inherit their source role");
assert(context.VRODOS.utils.resolveSceneAssetCategory(inheritedWalkable) === "walkable-surface", "walkables must inherit their source role");
assert(context.VRODOS.utils.resolveSceneAssetCategory({ ...decoration, sceneAssetRole: "walkable-surface" }) === "walkable-surface", "a decoration override must resolve as walkable");
assert(context.VRODOS.utils.resolveSceneAssetCategory({ ...inheritedWalkable, sceneAssetRole: "decoration" }) === "decoration", "a walkable override must resolve as decoration");
assert(context.VRODOS.utils.resolveSceneAssetCategory({ ...decoration, sceneAssetRole: "invalid" }) === "decoration", "invalid overrides must be ignored");
assert(context.VRODOS.utils.resolveSceneAssetCategory({ category_slug: "door", sceneAssetRole: "walkable-surface" }) === "door", "non-eligible asset overrides must be ignored");
assert(context.VRODOS.utils.normalizeCompiledCollisionEnabled(undefined, decoration) === true, "decorations must default to player collision");
assert(context.VRODOS.utils.normalizeCompiledCollisionEnabled(undefined, { ...decoration, sceneAssetRole: "walkable-surface" }) === true, "decoration assets must keep their collision default after a placement role change");
assert(context.VRODOS.utils.normalizeCompiledCollisionEnabled(false, decoration) === false, "an explicitly disabled decoration must stay non-collidable");
assert(context.VRODOS.utils.normalizeCompiledCollisionEnabled(undefined, { category_slug: "door" }) === false, "other asset categories must keep collision disabled by default");

const primitivePlane = { category_slug: "primitive-plane" };
assert(context.VRODOS.utils.resolveSceneAssetCategory(primitivePlane) === "walkable-surface", "planes must default to walkable surfaces");
assert(context.VRODOS.utils.resolveSceneAssetCategory({ ...primitivePlane, sceneAssetRole: "decoration" }) === "decoration", "planes may be authored as visual-only decoration");
assert(context.VRODOS.utils.normalizeCompiledCollisionEnabled(undefined, primitivePlane) === true, "planes must default to compiled collision");
assert(context.VRODOS.utils.initializeWalkableBehaviorForRoleChange(primitivePlane) === "precise", "walkable planes must default to precise geometry");

const newDecoration = context.VRODOS.utils.sceneCreateObjectRecord("chair", "/chair.glb", "Decoration", {}, [0, 0, 0], 1);
const disabledDecoration = context.VRODOS.utils.sceneCreateObjectRecord("table", "/table.glb", "Decoration", {
    compiledCollisionEnabled: false
}, [0, 0, 0], 2);
assert(newDecoration.compiledCollisionEnabled === true, "new decoration placements must start collidable");
assert(disabledDecoration.compiledCollisionEnabled === false, "an explicit decoration collision choice must override the default");

const convertedPlacement = {
    category_slug: "decoration",
    sceneAssetRole: "walkable-surface",
    compiledCollisionEnabled: true
};
const untouchedPlacement = {
    category_slug: "decoration",
    compiledCollisionEnabled: false
};
assert(context.VRODOS.utils.resolveSceneAssetCategory(convertedPlacement) === "walkable-surface", "one placement must use its override");
assert(context.VRODOS.utils.resolveSceneAssetCategory(untouchedPlacement) === "decoration", "another placement of the asset must stay independent");
assert(context.VRODOS.utils.initializeWalkableBehaviorForRoleChange(convertedPlacement) === "auto", "a newly converted walkable must default to Auto");
convertedPlacement.walkableBehavior = "precise";
assert(context.VRODOS.utils.initializeWalkableBehaviorForRoleChange(convertedPlacement) === "precise", "an existing walking behavior must be preserved");

function exportPlacement(overrides = {}) {
    return new context.VRODOS.exporter.SceneExporter().processObject({
        uuid: "placement-1",
        name: "placement",
        asset_id: 91,
        category_name: "Decoration",
        category_slug: "decoration",
        compiledCollisionEnabled: true,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        ...overrides
    });
}

const poiPlacement = exportPlacement({ sceneAssetRole: 'poi-imagetext', scenePoiPhysicalRole: 'decoration',
    poi_img_title: 'Έκθεμα', poi_img_content: 'Πρώτη γραμμή\nΔεύτερη γραμμή', poiImageAttachmentId: 42,
    poi_img_path: '/private/photo.jpg' });
assert(poiPlacement.category_slug === 'decoration' && poiPlacement.sceneAssetRole === 'poi-imagetext', 'POI conversion must preserve the source category');
assert(poiPlacement.poiImageAttachmentId === 42 && !poiPlacement.poi_img_path, 'POI photo ID, not its transient URL, must persist');
assert(poiPlacement.poi_img_content.includes('\n') && poiPlacement.poi_img_title === 'Έκθεμα', 'Greek multiline POI content must survive saving');
assert(context.VRODOS.utils.resolveScenePhysicalCategory(poiPlacement) === 'decoration', 'POIs must preserve physical decoration behavior');
assert(context.VRODOS.utils.resolveScenePhysicalCategory({ ...poiPlacement, scenePoiPhysicalRole: 'walkable-surface' }) === 'walkable-surface', 'POIs must preserve physical walkable behavior');
assert(context.VRODOS.utils.resolveSceneAssetCategory({ ...primitivePlane, sceneAssetRole: 'poi-imagetext' }) === 'walkable-surface', 'planes must not convert to POIs');
assert(!context.VRODOS.utils.isSceneAssetRoleEligible({ category_slug: 'poi-imagetext' }), 'existing POI assets must retain their presentation');

const persisted = exportPlacement({
    sceneAssetRole: "walkable-surface",
    walkableBehavior: "auto"
});
assert(persisted.category_slug === "decoration", "persistence must retain the source category");
assert(persisted.sceneAssetRole === "walkable-surface", "persistence must retain a valid placement override");
assert(persisted.walkableBehavior === "auto", "persistence must retain walking behavior");
assert(persisted.compiledCollisionEnabled === true, "persistence must retain player collision state");
assert(exportPlacement({ compiledCollisionEnabled: undefined }).compiledCollisionEnabled === true, "persistence must apply the decoration collision default when the value is missing");
assert(exportPlacement({ compiledCollisionEnabled: false }).compiledCollisionEnabled === false, "persistence must retain a disabled decoration collision checkbox");
assert(context.VRODOS.utils.resolveSceneAssetCategory({ ...persisted }) === "walkable-surface", "a saved placement must reload with the same effective role");
assert(!Object.prototype.hasOwnProperty.call(exportPlacement({ sceneAssetRole: "invalid" }), "sceneAssetRole"), "persistence must reject invalid overrides");
assert(!Object.prototype.hasOwnProperty.call(exportPlacement({ category_slug: "door", sceneAssetRole: "walkable-surface" }), "sceneAssetRole"), "persistence must reject overrides on other asset categories");

let presentationRefreshes = 0;
let autosaves = 0;
const undoObject = {
    uuid: "undo-placement",
    name: "undo placement",
    category_slug: "decoration",
    compiledCollisionEnabled: true,
    userData: {}
};
context.VRODOS.editor.sceneRegistry = {
    get(identifier) {
        return identifier === undoObject.uuid || identifier === undoObject.name ? undoObject : null;
    }
};
context.VRODOS.editor.envir = { scene: {} };
context.VRODOS.editor.animate = () => {};
context.VRODOS.api.triggerAutoSave = () => {
    autosaves++;
};
context.VRODOS.ui.refreshSceneAssetRolePresentation = () => {
    presentationRefreshes++;
};

vm.runInNewContext(readFileSync(resolve(root, 'assets/js/editor/loaders/vrodos_loader_generated_assets.js'), 'utf8'), context);
vm.runInNewContext(
    readFileSync(resolve(root, "assets/js/editor/scene/vrodos_undo_engine.js"), "utf8"),
    context,
    { filename: "assets/js/editor/scene/vrodos_undo_engine.js" }
);

context.VRODOS.utils.initializeWalkableBehaviorForRoleChange(undoObject);
undoObject.sceneAssetRole = "walkable-surface";
undoObject.userData.sceneAssetRole = "walkable-surface";
context.VRODOS.editor.undoManager.add(
    new context.VRODOS.editor.PropertyCommand(undoObject, "sceneAssetRole", undefined, "walkable-surface")
);
context.VRODOS.editor.undoManager.undo();
assert(context.VRODOS.utils.resolveSceneAssetCategory(undoObject) === "decoration", "undo must restore the inherited role");
assert(!Object.prototype.hasOwnProperty.call(undoObject, "sceneAssetRole"), "undo must remove an optional override");
assert(undoObject.walkableBehavior === "auto", "undo must preserve initialized walking behavior");
assert(undoObject.compiledCollisionEnabled === true, "undo must preserve collision state");
context.VRODOS.editor.undoManager.redo();
assert(context.VRODOS.utils.resolveSceneAssetCategory(undoObject) === "walkable-surface", "redo must restore the placement override");
assert(undoObject.userData.sceneAssetRole === "walkable-surface", "redo must keep object metadata in sync");
assert(presentationRefreshes === 2 && autosaves === 2, "undo and redo must refresh presentation and autosave");

const poiRoleCommand = new context.VRODOS.editor.PropertyCommand(undoObject, 'sceneAssetRole', 'walkable-surface', 'poi-imagetext');
poiRoleCommand.redo();
assert(context.VRODOS.utils.resolveSceneAssetCategory(undoObject) === 'poi-imagetext', 'redo enters POI mode');
assert(undoObject.scenePoiPhysicalRole === 'walkable-surface', 'entering POI mode remembers the previous physical role');
poiRoleCommand.undo();
assert(context.VRODOS.utils.resolveSceneAssetCategory(undoObject) === 'walkable-surface', 'undo restores walkable mode');
poiRoleCommand.redo();
const photoCommand = new context.VRODOS.editor.PoiImageCommand(undoObject, { attachmentId: undefined, url: '' }, { attachmentId: 42, url: '/photo.jpg' });
let photoRefreshes = 0;
context.VRODOS.ui.getSelectedPropertyTarget = () => undoObject;
context.VRODOS.ui.refreshPoiImageControls = () => { photoRefreshes++; };
photoCommand.redo();
assert(undoObject.poiImageAttachmentId === 42, 'photo change belongs to its initiating placement');
photoCommand.undo();
assert(!Object.hasOwn(undoObject, 'poiImageAttachmentId') && undoObject.poi_img_path === '', 'photo undo restores the previous image choice');
assert(photoRefreshes === 2, 'photo undo and redo refresh the selected placement preview');
photoCommand.redo();
poiRoleCommand.undo();
assert(undoObject.poiImageAttachmentId === 42, 'switching away from POI keeps authored content');
const saveSource = readFileSync(resolve(root, 'assets/js/editor/ajax/vrodos_save_scene_ajax.js'), 'utf8');
vm.runInNewContext(saveSource.slice(saveSource.indexOf('function collectRetainedPoiImageIds()'), saveSource.indexOf('function parseSceneSaveResponse')), context);
context.VRODOS.editor.undoManager.add(photoCommand);
assert(context.collectRetainedPoiImageIds().includes(42), 'photo references in undo history must survive scene cleanup');
context.VRODOS.editor.undoManager.undo();
assert(context.collectRetainedPoiImageIds().includes(42), 'photo references in redo history must also survive cleanup');
const duplicatePoi = exportPlacement({ ...poiPlacement, uuid: 'placement-copy', name: 'copy' });
assert(duplicatePoi.poiImageAttachmentId === 42 && duplicatePoi.poi_img_content === poiPlacement.poi_img_content, 'duplicated placements retain their POI content');

const transformed = new Object3D();
transformed.name = 'transformed-object';
transformed.position.x = 1;
const otherSelection = new Object3D();
let selection = otherSelection;
context.VRODOS.editor.sceneRegistry.get = (id) => id === transformed.uuid ? transformed : null;
context.VRODOS.editor.sceneRegistry.invalidateBounds = () => {};
context.VRODOS.editor.transforms = { syncProxyToObject() {} };
context.VRODOS.editor.selection = {
    select(object, options) {
        assert(options.setMode === false, 'undo must preserve the active transform mode');
        assert(options.openPanel === false, 'undo and redo must not open the object properties popup');
        assert(options.syncGui === true && options.showProperties === true, 'undo and redo must hydrate existing transform and property controls');
        selection = object;
    }
};
const transformState = (x) => ({ pos: { x, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0, order: 'XYZ' }, scale: { x: 1, y: 1, z: 1 } });
const transformCommand = new context.VRODOS.editor.TransformCommand(transformed, transformState(0), transformState(1));
transformCommand.undo();
assert(selection === transformed && transformed.position.x === 0, 'cross-object undo must synchronize through the selection service');
selection = otherSelection;
transformCommand.redo();
assert(selection === transformed && transformed.position.x === 1, 'cross-object redo must synchronize through the selection service');

console.log("Scene asset role and transform selection tests passed.");
