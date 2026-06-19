import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const diagnostics = [];

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function createNode(kind, options) {
    return {
        kind,
        options: options || {},
        children: []
    };
}

function createSpatialApi() {
    const api = {
        __spatialUi: true,
        frames: [],
        texts: [],
        buttons: [],
        images: [],
        grids: [],
        refreshed: 0,

        clear() {
            this.frames = [];
            this.texts = [];
            this.buttons = [];
            this.images = [];
            this.grids = [];
        },

        refreshTargets() {
            this.refreshed += 1;
        },

        frame(options) {
            const frame = {
                kind: "frame",
                options: options || {},
                content: createNode("frame-content"),
                footer: createNode("frame-footer")
            };
            this.frames.push(frame);
            if (options && options.primary && options.primary.visible !== false) {
                this.button(frame.footer, options.primary);
            }
            return frame;
        },

        container(parent, options) {
            const node = createNode("container", options);
            if (parent && parent.children) {
                parent.children.push(node);
            }
            return node;
        },

        row(parent, options) {
            const node = createNode("row", options);
            if (parent && parent.children) {
                parent.children.push(node);
            }
            return node;
        },

        column(parent, options) {
            const node = createNode("column", options);
            if (parent && parent.children) {
                parent.children.push(node);
            }
            return node;
        },

        text(parent, options) {
            const node = createNode("text", options);
            this.texts.push(options || {});
            if (parent && parent.children) {
                parent.children.push(node);
            }
            return node;
        },

        button(parent, options) {
            const node = createNode("button", options);
            this.buttons.push(options || {});
            if (parent && parent.children) {
                parent.children.push(node);
            }
            return node;
        },

        grid(parent, items, options) {
            const node = createNode("grid", options);
            this.grids.push({ items: items || [], options: options || {} });
            if (parent && parent.children) {
                parent.children.push(node);
            }
            (items || []).forEach((item) => this.button(node, item));
            return node;
        },

        image(parent, options) {
            const node = createNode("image", options);
            this.images.push(options || {});
            if (parent && parent.children) {
                parent.children.push(node);
            }
            return node;
        }
    };

    return api;
}

let activePanel = null;

const windowStub = {
    console,
    atob(value) {
        return Buffer.from(String(value), "base64").toString("binary");
    },
    browsingModeVR: true,
    VRodosImmerseAssessment: {},
    VRODOSRuntimeOverlay: {
        shouldUseVrPanel() {
            return true;
        },
        getPresentationMode() {
            return "immersive-vr";
        },
        recordDiagnostic(level, message, details) {
            diagnostics.push({ level, message, details });
        }
    },
    VRODOSSpatialUI: {
        isAvailable() {
            return true;
        },
        openPanel(config) {
            this.closePanel("replace");
            const api = createSpatialApi();
            activePanel = { config: config || {}, api };
            if (config && typeof config.render === "function") {
                config.render(api);
            }
            return api;
        },
        closePanel(reason) {
            if (activePanel && activePanel.config && typeof activePanel.config.cleanup === "function") {
                activePanel.config.cleanup(reason || "close");
            }
            activePanel = null;
        },
        refreshInteractionTargets() {
            if (activePanel && activePanel.api) {
                activePanel.api.refreshTargets();
            }
        },
        recordDiagnostic(level, message, details) {
            diagnostics.push({ level, message, details });
        }
    }
};
windowStub.window = windowStub;

const context = vm.createContext({
    window: windowStub,
    console,
    TextDecoder,
    Uint8Array,
    Buffer,
    setTimeout,
    clearTimeout
});

[
    "assets/js/runtime/assessment/assessment-utils.js",
    "assets/js/runtime/assessment/assessment-renderers.js",
    "assets/js/runtime/assessment/assessment-vr-overlay-runtime.js"
].forEach((file) => {
    vm.runInContext(readFileSync(resolve(root, file), "utf8"), context, { filename: file });
});

const namespace = windowStub.VRodosImmerseAssessment;
const runtime = namespace.getVrOverlayRuntime();

function makePayload(title, group, type, content) {
    return {
        title,
        group,
        type,
        supported: true,
        content,
        levels: ["A1"],
        sourceId: title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    };
}

const fixtures = [
    {
        name: "multiple choice items",
        expected: "Question",
        payload: makePayload("Multiple choice", "Assessment", "Multiple Choice", {
            items: [{ prompt: "Pick one", options: ["One", "Two"], correctIndex: 0 }]
        })
    },
    {
        name: "true false",
        expected: "Question",
        payload: makePayload("True false", "Question", "True/False", {
            questions: [{ question: "The sky is blue.", answers: ["True", "False"], correctIndex: 0 }]
        })
    },
    {
        name: "prompt group true false type",
        expected: "Question",
        payload: makePayload("Prompt true false", "Prompt", "True False", {
            items: [{ prompt: "VR works for true false.", options: ["True", "False"], correctIndex: 0 }]
        })
    },
    {
        name: "image quiz",
        expected: "ImageQuiz",
        payload: makePayload("Image quiz", "Image Quiz", "Visual Quiz", {
            questions: [{ prompt: "What is shown?", imageUrl: "https://example.test/image.png", answers: ["A", "B"], correctIndex: 1 }]
        })
    },
    {
        name: "matching pairs items",
        expected: "Pair",
        payload: makePayload("Matching", "Matching", "Match Pairs", {
            items: [{ source: "cat", target: "cat-el" }, { source: "dog", target: "dog-el" }]
        })
    },
    {
        name: "drag drop",
        expected: "Pair",
        payload: makePayload("Drag drop", "Pair", "Drag and Drop", {
            pairs: [{ source: "red", target: "color" }, { source: "apple", target: "fruit" }]
        })
    },
    {
        name: "word search",
        expected: "Grid",
        payload: makePayload("Word search", "Grid", "Word Search", {
            words: [{ text: "CAT", hint: "animal" }, { text: "DOG", hint: "animal" }]
        })
    },
    {
        name: "vocabulary bingo",
        expected: "Grid",
        payload: makePayload("Bingo", "Vocabulary Bingo", "Bingo", {
            words: ["ALPHA", "BETA", "GAMMA", "DELTA"]
        })
    },
    {
        name: "fill gaps",
        expected: "Text",
        payload: makePayload("Fill gaps", "Text", "Fill in the gaps", {
            text: "The ___ is blue.",
            annotations: [{ start: 4, end: 7, type: "blank", correctValue: "sky" }]
        })
    },
    {
        name: "highlight",
        expected: "Text",
        payload: makePayload("Highlight", "Highlight Text", "Highlight", {
            text: "Blue sky",
            annotations: [{ start: 0, end: 4, type: "highlight" }]
        })
    }
];

fixtures.forEach((fixture) => {
    const payload = clone(fixture.payload);
    const resolvedKey = namespace.resolveAssessmentRendererKey(payload, { ignoreSupported: true });
    assert(resolvedKey === fixture.expected, `${fixture.name}: expected resolver ${fixture.expected}, got ${resolvedKey}`);

    const opened = runtime.open(payload);
    assert(opened === true, `${fixture.name}: VR panel did not open`);

    const diagnostics = windowStub.__vrodosLastAssessmentVrOpenDiagnostics;
    assert(diagnostics.rendererKey === fixture.expected, `${fixture.name}: expected VR renderer ${fixture.expected}, got ${diagnostics.rendererKey}`);
    assert(diagnostics.stateEmpty === false, `${fixture.name}: normalized VR state was empty`);
    assert(activePanel && activePanel.api.buttons.length > 0, `${fixture.name}: no interactive buttons rendered`);
    assert(activePanel.api.refreshed > 0, `${fixture.name}: spatial targets were not refreshed`);

    const genericUnsupported = activePanel.api.texts.some((entry) =>
        String(entry.text || "").includes("This assessment type is not interactive in VRodos yet")
    );
    assert(!genericUnsupported, `${fixture.name}: rendered generic unsupported message`);
    windowStub.VRODOSSpatialUI.closePanel("test-reset");
});

assert(runtime.open(clone(fixtures[0].payload)) === true, "Initial replacement fixture did not open");
assert(runtime.open(clone(fixtures[2].payload)) === true, "Replacement fixture did not open");
assert(windowStub.__vrodosLastAssessmentVrOpenDiagnostics.rendererKey === fixtures[2].expected, "Replacement open lost its renderer diagnostics");
assert(activePanel && !activePanel.api.texts.some((entry) =>
    String(entry.text || "").includes("This assessment type is not interactive in VRodos yet")
), "Replacement open rendered generic unsupported message");
windowStub.VRODOSSpatialUI.closePanel("test-reset");

const unsupported = makePayload("Prompt", "Prompt", "Prompt", {
    items: [{ prompt: "Read-only prompt", options: ["Continue"] }]
});
const unsupportedKey = namespace.resolveAssessmentRendererKey(unsupported, { ignoreSupported: true });
assert(unsupportedKey === "", `Prompt should remain unsupported, got ${unsupportedKey}`);
assert(runtime.open(clone(unsupported)) === true, "Prompt panel should open as unsupported read-only state");
assert(windowStub.__vrodosLastAssessmentVrOpenDiagnostics.rendererKey === "", "Prompt diagnostic should have no renderer");
assert(activePanel.api.texts.some((entry) =>
    String(entry.text || "").includes("This assessment type is not interactive in VRodos yet")
), "Prompt should render the generic unsupported message");
windowStub.VRODOSSpatialUI.closePanel("test-reset");

console.log(`Assessment runtime harness passed ${fixtures.length + 2} cases.`);
