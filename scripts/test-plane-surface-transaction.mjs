import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");

function assert(condition, message) {
    if (!condition) throw new Error(`Plane surface transaction test failed: ${message}`);
}

const textureUpdates = [];
let refreshCount = 0;
let saveCount = 0;
const plane = {
    uuid: "plane-transaction",
    name: "Ground",
    category_slug: "primitive-plane",
    userData: {},
    surfaceTileSizeMeters: 1.5,
    surfaceAlbedoAttachmentId: 1,
    surfaceAlbedoUrl: "/old-color.jpg"
};

const context = {
    console,
    document: { readyState: "complete", getElementById: () => null },
    VRODOS: {
        api: { triggerAutoSave: () => saveCount++ },
        editor: {
            envir: { scene: {} },
            animate() {},
            sceneRegistry: {
                get(key) {
                    return key === plane.uuid || key === plane.name ? plane : null;
                }
            }
        },
        loader: {
            setPrimitivePlaneTexture(_object, slot, url) {
                textureUpdates.push([slot, url]);
            },
            refreshPrimitivePlaneMaterial() {
                refreshCount++;
            }
        },
        ui: { showPropertiesInPanel() {} },
        utils: {}
    }
};
context.window = context;
vm.runInNewContext(
    readFileSync(resolve(root, "assets/js/editor/scene/vrodos_undo_engine.js"), "utf8"),
    context,
    { filename: "vrodos_undo_engine.js" }
);

const oldState = {
    slots: {
        albedo: { attachmentId: 1, url: "/old-color.jpg" },
        normal: { attachmentId: 0, url: "" },
        roughness: { attachmentId: 0, url: "" },
        ao: { attachmentId: 0, url: "" },
        metalness: { attachmentId: 0, url: "" },
        displacement: { attachmentId: 0, url: "" }
    },
    properties: {
        surfaceNormalYSign: 1,
        surfaceAntiTilingEnabled: false,
        surfaceAntiTilingPatchTiles: 1.25,
        surfaceAntiTilingBlendSharpness: 4
    }
};
const newState = {
    slots: {
        albedo: { attachmentId: 10, url: "/new-color.jpg" },
        normal: { attachmentId: 11, url: "/new-normal.jpg" },
        roughness: { attachmentId: 12, url: "/new-rough.jpg" },
        ao: { attachmentId: 13, url: "/new-ao.jpg" },
        metalness: { attachmentId: 14, url: "/new-metal.jpg" },
        displacement: { attachmentId: 15, url: "/new-height.jpg" }
    },
    properties: {
        surfaceNormalYSign: -1,
        surfaceAntiTilingEnabled: true,
        surfaceAntiTilingPatchTiles: 1.25,
        surfaceAntiTilingBlendSharpness: 4
    }
};

context.VRODOS.editor.applyPlaneSurfaceMaterialState(plane, newState, { updateUi: false, autosave: false });
const command = new context.VRODOS.editor.PlaneSurfaceMaterialCommand(plane, oldState, newState);
context.VRODOS.editor.undoManager.add(command);
assert(context.VRODOS.editor.undoManager.undoStack.length === 1, "a package replacement creates one undo command");
assert(plane.surfaceDisplacementAttachmentId === 15, "displacement is retained as authoring state");
assert(!textureUpdates.some(([slot]) => slot === "displacement"), "displacement is never sent to the renderer");
assert(plane.surfaceTileSizeMeters === 1.5, "package replacement preserves physical tile size");

context.VRODOS.editor.undoManager.undo();
assert(plane.surfaceAlbedoAttachmentId === 1 && plane.surfaceNormalAttachmentId === 0, "undo restores the complete previous surface");
assert(plane.surfaceMetalnessAttachmentId === 0 && plane.surfaceDisplacementAttachmentId === 0, "undo clears slots absent from the previous surface");

context.VRODOS.editor.undoManager.redo();
assert(plane.surfaceAlbedoAttachmentId === 10 && plane.surfaceNormalAttachmentId === 11, "redo restores the complete imported surface");
assert(plane.surfaceNormalYSign === -1, "redo restores DirectX normal correction state");
assert(refreshCount === 3 && saveCount === 2, "initial apply, undo, and redo each refresh once while only undo/redo autosave");

console.log("Plane surface transaction tests passed.");
