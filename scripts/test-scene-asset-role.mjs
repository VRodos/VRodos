import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

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

console.log("Scene asset role tests passed.");
