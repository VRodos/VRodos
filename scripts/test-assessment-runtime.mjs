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
        updatedButtons: 0,
        updatedTexts: 0,

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
                contentOuter: createNode("frame-content-outer"),
                footer: createNode("frame-footer"),
                statusText: null,
                primaryButton: null
            };
            frame.contentOuter.children.push(frame.content);
            this.frames.push(frame);
            if (options && options.status) {
                frame.statusText = this.text(frame.footer, { text: options.status });
            }
            if (options && options.primary && options.primary.visible !== false) {
                frame.primaryButton = this.button(frame.footer, options.primary);
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

        scroll(parent, options) {
            return this.container(parent, Object.assign({ overflow: "scroll" }, options));
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
            node.setProperties = (nextOptions) => {
                node.options = Object.assign({}, node.options || {}, nextOptions || {});
            };
            this.texts.push(options || {});
            if (parent && parent.children) {
                parent.children.push(node);
            }
            return node;
        },

        updateText(text, options) {
            if (text && typeof text.setProperties === "function") {
                text.setProperties(options || {});
            }
            this.updatedTexts += 1;
            return text;
        },

        button(parent, options) {
            const node = createNode("button", options);
            node.setProperties = (nextOptions) => {
                node.options = Object.assign({}, node.options || {}, nextOptions || {});
            };
            this.buttons.push(options || {});
            if (parent && parent.children) {
                parent.children.push(node);
            }
            return node;
        },

        updateButton(button, options) {
            if (button && typeof button.setProperties === "function") {
                button.setProperties(options || {});
            }
            this.updatedButtons += 1;
            return button;
        },

        selectionCard(parent, options) {
            const card = this.button(parent, options);
            card.kind = "selection-card";
            return card;
        },

        updateSelectionCard(card, options) {
            card.setProperties(options);
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
    "assets/js/runtime/assessment/assessment-session-runtime.js",
    "assets/js/runtime/assessment/assessment-renderers.js",
    "assets/js/runtime/assessment/assessment-vr-overlay-runtime.js"
].forEach((file) => {
    vm.runInContext(readFileSync(resolve(root, file), "utf8"), context, { filename: file });
});

const namespace = windowStub.VRodosImmerseAssessment;
namespace.getAssessmentProgressRuntime = () => ({ setModalOpen() {} });
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
        payload: makePayload("Bingo", "Grid", "Vocabulary bingo", {
            words: [
                { id: "barcelona", text: "Barcelona", isCorrect: true },
                { id: "montserrat", text: "Montserrat", isCorrect: false },
                { id: "serrada", text: "muntanya serrada", isCorrect: true },
                { id: "roques", text: "roques", isCorrect: false }
            ]
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
    assert(activePanel.config.distance === 2.15, `${fixture.name}: expected readable assessment panel distance`);
    assert(activePanel.api.refreshed > 0, `${fixture.name}: spatial targets were not refreshed`);

    const scrollFrame = activePanel.api.frames.at(-1);
    assert(scrollFrame.options.scrollContent === true, `${fixture.name}: assessment must allow overflow scrolling`);
    assert(!activePanel.api.buttons.some(button => /^Scroll (up|down)$/.test(button.label)), `${fixture.name}: scroll buttons must not take assessment space`);

    const genericUnsupported = activePanel.api.texts.some((entry) =>
        String(entry.text || "").includes("This assessment type is not interactive in VRodos yet")
    );
    assert(!genericUnsupported, `${fixture.name}: rendered generic unsupported message`);
    const frameOptions = activePanel.api.frames[0] && activePanel.api.frames[0].options || {};
    const supportedWordBreak = new Set(["keep-all", "break-all", "break-word"]);
    assert(supportedWordBreak.has(frameOptions.titleWordBreak), `${fixture.name}: unsupported title wordBreak ${frameOptions.titleWordBreak}`);
    assert(frameOptions.titleMaxLines === 2, `${fixture.name}: expected two-line assessment header clamp`);
    if (fixture.expected === "Question" || fixture.expected === "ImageQuiz") {
        const content = fixture.payload.content || {};
        const question = Array.isArray(content.items) ? content.items[0] : (Array.isArray(content.questions) ? content.questions[0] : null);
        const answers = question && (question.options || question.answers) || [];
        const answerButton = activePanel.api.buttons.find((entry) => entry.label === answers[0]);
        assert(answerButton && typeof answerButton.onClick === "function", `${fixture.name}: answer button missing click handler`);
        const frameCountBeforeSelection = activePanel.api.frames.length;
        const updatedButtonsBeforeSelection = activePanel.api.updatedButtons;
        answerButton.onClick();
        assert(activePanel.api.frames.length === frameCountBeforeSelection, `${fixture.name}: answer click recreated the frame`);
        assert(activePanel.api.updatedButtons > updatedButtonsBeforeSelection, `${fixture.name}: answer click did not update buttons in place`);
    }
    if (fixture.expected === "ImageQuiz") {
        const image = activePanel.api.images[0] || {};
        assert(image.width === 636, `${fixture.name}: expected image quiz fixed 70% column width`);
        assert(image.height === undefined, `${fixture.name}: expected image quiz auto height`);
        assert(image.maxHeight === 392, `${fixture.name}: expected constrained image quiz visual height`);
        assert(image.objectFit === "contain", `${fixture.name}: expected image quiz to preserve full image`);
        assert(image.keepAspectRatio === true, `${fixture.name}: expected image quiz to keep aspect ratio`);
        const answerButton = activePanel.api.buttons.find((entry) => entry.label === "A") || {};
        assert(answerButton.width === "100%", `${fixture.name}: expected vertical answer button column`);
        assert(answerButton.minHeight === 78, `${fixture.name}: expected readable image quiz answer height`);
        assert(answerButton.lineHeight === "126%", `${fixture.name}: expected readable image quiz answer line height`);
    }
    if (fixture.expected === "Pair") {
        assert(frameOptions.headerHeight === 124, `${fixture.name}: expected compact two-line pair header`);
        assert(frameOptions.titleWhiteSpace === "normal", `${fixture.name}: expected pair title to wrap`);
        assert(frameOptions.titleWordBreak === "break-word", `${fixture.name}: expected pair title to wrap safely`);
        assert(frameOptions.scrollContent === true, `${fixture.name}: expected scrollable assessment content`);
        assert(frameOptions.statusFontSize === 20, `${fixture.name}: expected compact pair footer status`);
        assert(frameOptions.paddingTop === 24, `${fixture.name}: expected pair content to start near the header`);
        assert(!activePanel.api.texts.some((entry) =>
            String(entry.text || "").includes("Tap a source")
        ), `${fixture.name}: pair help callout should be hidden`);
        assert(activePanel.api.buttons.some((entry) => entry.label === "Complete"), `${fixture.name}: Complete button was not rendered`);
        const sourceText = fixture.payload.content.items
            ? fixture.payload.content.items[0].source
            : fixture.payload.content.pairs[0].source;
        const targetText = fixture.payload.content.items
            ? fixture.payload.content.items[0].target
            : fixture.payload.content.pairs[0].target;
        const sourceButton = activePanel.api.buttons.find((entry) => entry.label === sourceText);
        const targetButton = activePanel.api.buttons.find((entry) => entry.label === targetText);
        assert(sourceButton && typeof sourceButton.onClick === "function", `${fixture.name}: source button missing click handler`);
        assert(targetButton && typeof targetButton.onClick === "function", `${fixture.name}: target button missing click handler`);
        const frameCountBeforeSelection = activePanel.api.frames.length;
        sourceButton.onClick();
        targetButton.onClick();
        assert(activePanel.api.frames.length === frameCountBeforeSelection, `${fixture.name}: pair click recreated the frame`);
        assert(activePanel.api.updatedButtons > 0, `${fixture.name}: pair click did not update buttons in place`);
    }
    windowStub.VRODOSSpatialUI.closePanel("test-reset");
});

assert(runtime.open(clone(fixtures[0].payload)) === true, "Initial replacement fixture did not open");
assert(runtime.open(clone(fixtures[2].payload)) === true, "Replacement fixture did not open");
assert(windowStub.__vrodosLastAssessmentVrOpenDiagnostics.rendererKey === fixtures[2].expected, "Replacement open lost its renderer diagnostics");
assert(activePanel && !activePanel.api.texts.some((entry) =>
    String(entry.text || "").includes("This assessment type is not interactive in VRodos yet")
), "Replacement open rendered generic unsupported message");
windowStub.VRODOSSpatialUI.closePanel("test-reset");

const recordedAssessmentResults = [];
namespace.getAssessmentSessionRuntime = () => ({
    recordAssessmentResult(payload, result) {
        recordedAssessmentResults.push({ payload, result });
    }
});
const finishPayload = clone(fixtures[0].payload);
assert(runtime.open(finishPayload) === true, "Finish hook fixture did not open");
const finishAnswer = activePanel.api.buttons.find((entry) => entry.label === "One");
assert(finishAnswer && typeof finishAnswer.onClick === "function", "Finish hook answer button missing");
finishAnswer.onClick();
const finishPrimary = activePanel.api.frames[0] && activePanel.api.frames[0].primaryButton;
assert(finishPrimary && typeof finishPrimary.options.onClick === "function", "Finish hook primary button missing");
finishPrimary.options.onClick();
assert(recordedAssessmentResults.length === 1, "Assessment finish did not notify session recorder");
assert(recordedAssessmentResults[0].result.completionState === "completed", "Recorded result is not completed");
assert(activePanel.config.id === "vrodos-assessment-result", "Finish did not replace the VR assessment with a result card");
assert(activePanel.api.texts.some((entry) => String(entry.text).includes("1 correct")), "VR result card omitted the correct count");
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

async function runSessionRuntimeHarness() {
    const writes = [];
    const store = new Map();
    let failNextResult = true;
    const sessionWindow = {
        console,
        location: {
            href: "http://localhost:10005/wp-content/uploads/vrodos/published/projects/11/clients/Master_Client_11.html",
            search: ""
        },
        navigator: { userAgent: "assessment-session-test" },
        sessionStorage: {
            getItem(key) {
                return store.has(key) ? store.get(key) : null;
            },
            setItem(key, value) {
                store.set(key, String(value));
            },
            removeItem(key) {
                store.delete(key);
            }
        },
        VRODOS_IMMERSE_RESULTS_CONFIG: {
            enabled: true,
            restUrl: "http://wp.local/wp-json/vrodos-immerse/v1/results",
            token: "token-1",
            projectId: 7,
            projectSlug: "demo-project",
            projectTitle: "Demo Project",
            sceneId: 11,
            sceneTitle: "Scene 1",
            lessonId: "lesson-1",
            useCaseId: "usecase-1",
            expectedAssessments: [
                { assetId: 101, assessmentSourceId: "assessment-101", levels: ["B1"] }
            ]
        },
        fetch(url, options) {
            const body = JSON.parse(options.body || "{}");
            writes.push({ url, body });
            if (url.endsWith("/assessment-results") && failNextResult) {
                failNextResult = false;
                return Promise.reject(new Error("simulated write failure"));
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true })
            });
        }
    };
    sessionWindow.window = sessionWindow;

    const sessionContext = vm.createContext({
        window: sessionWindow,
        console,
        TextDecoder,
        Uint8Array,
        URL,
        URLSearchParams,
        navigator: sessionWindow.navigator,
        setTimeout,
        clearTimeout
    });
    [
        "assets/js/runtime/assessment/assessment-utils.js",
        "assets/js/runtime/assessment/assessment-session-runtime.js"
    ].forEach((file) => {
        vm.runInContext(readFileSync(resolve(root, file), "utf8"), sessionContext, { filename: file });
    });

    const sessionNamespace = sessionWindow.VRodosImmerseAssessment;
    const session = sessionNamespace.getAssessmentSessionRuntime();
    assert(session.isEnabled() === true, "Session runtime should be enabled from config");
    assert(session.hasIdentity() === false, "Session should not start with identity");
    assert(session.setIdentity("", "B1") === false, "Session accepted an empty name");
    assert(session.setIdentity("  Ada   Lovelace  ", "B1") === true, "Session rejected valid identity");
    await session.flushPending();
    assert(writes.some((entry) => entry.url.endsWith("/attempts/start")), "Attempt start was not posted");

    session.recordAssessmentResult(
        {
            title: "Multiple choice",
            type: "Multiple Choice",
            group: "Question",
            supported: true,
            levels: ["B1"],
            assetId: 101,
            assessmentSourceId: "assessment-101",
            sceneObjectId: "assessment-object-1",
            content: {}
        },
        {
            completedAt: "2026-06-23T10:00:00.000Z",
            completionState: "completed",
            response: { answers: [{ selectedIndex: 0 }] },
            isCorrect: true
        }
    );
    await session.flushPending();
    await session.flushPending();
    assert((session.state.pendingWrites || []).length === 0, "Pending writes did not retry successfully");
    const resultWrite = writes.find((entry) => entry.url.endsWith("/assessment-results") && entry.body.result_uuid);
    assert(resultWrite, "Assessment result was not posted");
    assert(resultWrite.url.startsWith("http://localhost:10005/wp-json/"), "Local dev REST URL was not rewritten to the current origin");
    assert(resultWrite.body.asset_id === 101, "Assessment result did not include asset id");
    assert(resultWrite.body.assessment_source_id === "assessment-101", "Assessment result did not include source id");
    assert(resultWrite.body.attempt && resultWrite.body.attempt.assessment_total === 1, "Assessment result did not include the full attempt payload");
    assert(writes.some((entry) => entry.url.endsWith("/attempts/complete")), "Completed attempt was not posted");
}

async function runSessionIdentityChangeHarness() {
    const writes = [];
    const store = new Map();

    const sessionWindow = {
        console,
        location: {
            href: "https://example.test/Master_Client_11.html",
            search: ""
        },
        navigator: { userAgent: "assessment-session-identity-change-test" },
        sessionStorage: {
            getItem(key) {
                return store.has(key) ? store.get(key) : null;
            },
            setItem(key, value) {
                store.set(key, String(value));
            },
            removeItem(key) {
                store.delete(key);
            }
        },
        VRODOS_IMMERSE_RESULTS_CONFIG: {
            enabled: true,
            restUrl: "https://example.test/wp-json/vrodos-immerse/v1/results",
            token: "token-1",
            projectId: 7,
            projectSlug: "demo-project",
            projectTitle: "Demo Project",
            sceneId: 11,
            sceneTitle: "Scene 1",
            lessonId: "lesson-1",
            useCaseId: "usecase-1",
            expectedAssessments: [
                { assetId: 101, assessmentSourceId: "assessment-a1", levels: ["A1"] },
                { assetId: 102, assessmentSourceId: "assessment-a2", levels: ["A2"] }
            ]
        },
        fetch(url, options) {
            const body = JSON.parse(options.body || "{}");
            writes.push({ url, body });
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true })
            });
        }
    };
    sessionWindow.window = sessionWindow;

    const sessionContext = vm.createContext({
        window: sessionWindow,
        console,
        TextDecoder,
        Uint8Array,
        URL,
        URLSearchParams,
        navigator: sessionWindow.navigator,
        setTimeout,
        clearTimeout
    });
    [
        "assets/js/runtime/assessment/assessment-utils.js",
        "assets/js/runtime/assessment/assessment-session-runtime.js"
    ].forEach((file) => {
        vm.runInContext(readFileSync(resolve(root, file), "utf8"), sessionContext, { filename: file });
    });

    const session = sessionWindow.VRodosImmerseAssessment.getAssessmentSessionRuntime();
    assert(session.hasIdentity() === false, "Identity change harness should start without stored identity");
    assert(session.setIdentity("Ada Lovelace", "A2") === true, "Session rejected initial A2 identity");
    await session.flushPending();
    const oldAttemptUuid = session.state.attemptUuid;
    session.state.completedAssessmentKeys = ["assessment-a2"];
    session.state.pendingWrites.push({
        id: "assessment-result:old-a2",
        path: "assessment-results",
        payload: {
            attempt_uuid: oldAttemptUuid,
            cefr_level: "A2",
            result: { attemptUuid: oldAttemptUuid, cefrLevel: "A2" }
        },
        attempts: 1,
        createdAt: "2026-06-23T09:01:00.000Z"
    });
    session.save();
    assert(session.setIdentity("Ada Lovelace", "A1") === true, "Session rejected valid A1 identity change");
    assert(session.state.cefrLevel === "A1", "Session state did not switch to A1");
    assert(session.state.attemptUuid !== oldAttemptUuid, "Identity change did not create a new attempt");
    assert((session.state.pendingWrites || []).every((item) => item && item.payload && item.payload.attempt_uuid !== oldAttemptUuid), "Old A2 pending write was not removed");

    await session.flushPending();
    session.recordAssessmentResult(
        {
            title: "A1 question",
            type: "Multiple Choice",
            group: "Question",
            supported: true,
            levels: ["A1"],
            assetId: 101,
            assessmentSourceId: "assessment-a1",
            sceneObjectId: "assessment-object-a1",
            content: {}
        },
        {
            completedAt: "2026-06-23T10:15:00.000Z",
            completionState: "completed",
            response: { answers: [{ selectedIndex: 0 }] },
            isCorrect: true
        }
    );
    await session.flushPending();

    const resultWrite = writes.find((entry) => entry.url.endsWith("/assessment-results"));
    assert(resultWrite, "A1 assessment result was not posted after identity change");
    assert(resultWrite.body.cefr_level === "A1", "Assessment result kept the stale A2 CEFR level");
    assert(resultWrite.body.attempt_uuid === session.state.attemptUuid, "Assessment result did not use the new attempt UUID");
    assert(!writes.some((entry) => entry.url.endsWith("/assessment-results") && entry.body && entry.body.cefr_level === "A2"), "Stale A2 assessment result was posted after switching to A1");
}

function createCefrElement(levels) {
    const attributes = { "data-immerse-cefr-levels": Buffer.from(JSON.stringify(levels)).toString("base64") };
    const classes = new Set(["raycastable"]);
    return {
        dataset: {},
        classList: { contains: (name) => classes.has(name), add: (name) => classes.add(name), remove: (name) => classes.delete(name) },
        getAttribute: (name) => attributes[name] || null,
        setAttribute: (name, value) => { attributes[name] = value; },
        removeAttribute: (name) => { delete attributes[name]; }
    };
}

function runCefrIdentityHarness() {
    const cefrWindow = {
        console,
        location: { search: "" },
        navigator: { userAgent: "cefr-identity-test" },
        sessionStorage: {
            getItem() {
                return null;
            },
            setItem() {},
            removeItem() {}
        },
        VRODOS_IMMERSE_RESULTS_CONFIG: {
            enabled: true,
            restUrl: "https://example.test/wp-json/vrodos-immerse/v1/results",
            token: "token-1",
            projectId: 7,
            sceneId: 11
        }
    };
    cefrWindow.window = cefrWindow;
    const cefrContext = vm.createContext({
        window: cefrWindow,
        document: { getElementById: () => null },
        console,
        TextDecoder,
        Uint8Array,
        URLSearchParams,
        navigator: cefrWindow.navigator,
        setTimeout,
        clearTimeout
    });
    [
        "assets/js/runtime/master/vrodos_runtime_resources.js",
        "assets/js/runtime/assessment/assessment-utils.js",
        "assets/js/runtime/assessment/assessment-session-runtime.js",
        "assets/js/runtime/assessment/assessment-cefr-runtime.js"
    ].forEach((file) => {
        vm.runInContext(readFileSync(resolve(root, file), "utf8"), cefrContext, { filename: file });
    });

    const cefrRuntime = cefrWindow.VRodosImmerseAssessment.getCefrRuntime();
    cefrRuntime.schedulePrompt = () => {};
    const a1 = createCefrElement(["A1"]), b1 = createCefrElement(["B1"]);
    cefrRuntime.register(a1);
    cefrRuntime.register(b1);
    let dismissals = 0;
    cefrRuntime.hidePrompt = () => { dismissals += 1; };
    assert(cefrRuntime.requiresParticipantName() === true, "CEFR runtime should require a name for Immerse results");
    assert(cefrRuntime.canStart() === false, "CEFR runtime should not start without level and name");
    cefrRuntime.startExperience();
    assert(dismissals === 0 && !cefrRuntime.levelApplied, "Empty Start dismissed the prompt");
    cefrRuntime.selectLevel("B1");
    assert(cefrRuntime.canStart() === false, "CEFR runtime should not start without a name");
    const api = createSpatialApi();
    cefrRuntime.renderVrPrompt(api);
    assert(api.frames[0].options.showClose === false, "VR startup prompt allows implicit dismissal");
    assert(api.frames[0].primaryButton.options.disabled, "VR Start must stay disabled without a name");
    cefrRuntime.startExperience();
    assert(dismissals === 0, "Start dismissed the prompt without a name");
    cefrRuntime.setParticipantName("Ada");
    assert(cefrRuntime.canStart() === true, "CEFR runtime should start with name and level");
    api.buttons.find((button) => button.label === "SKIP").onClick();
    assert(dismissals === 1 && cefrRuntime.levelApplied && cefrRuntime.selectedLevel === "ALL", "VR SKIP did not explicitly start at ALL");
    assert(cefrRuntime.participantName === "", "SKIP retained a partially entered name");
    assert([a1, b1].every((element) => element.getAttribute("visible") === "true" && element.classList.contains("raycastable")), "SKIP did not reveal all CEFR content");
    const late = createCefrElement(["A2"]);
    cefrRuntime.register(late);
    assert(late.getAttribute("visible") === "true" && late.classList.contains("raycastable"), "Late CEFR content did not inherit ALL");
    const session = cefrWindow.VRodosImmerseAssessment.getAssessmentSessionRuntime();
    session.recordAssessmentResult({ assetId: 1 }, { isCorrect: true });
    assert(!session.hasIdentity() && session.state.pendingWrites.length === 0, "SKIP created or submitted a named results session");
    cefrRuntime.unregister(a1);
    cefrRuntime.unregister(b1);
    cefrRuntime.unregister(late);
}

async function runAssessmentFreeSceneHarness() {
    const savedSession = JSON.stringify({
        attemptUuid: "existing-attempt",
        displayName: "Ada",
        cefrLevel: "B1",
        pendingWrites: [{ id: "saved-result", path: "assessment-results", payload: {} }]
    });
    const store = new Map([["vrodos:immerse-results:7", savedSession]]);
    let storageReads = 0;
    const writes = [];
    const sceneWindow = {
        console,
        location: { search: "?vrodos_new_attempt=1" },
        sessionStorage: {
            getItem(key) { storageReads += 1; return store.get(key) || null; },
            setItem(key, value) { store.set(key, value); },
            removeItem(key) { store.delete(key); }
        },
        VRODOS_IMMERSE_RESULTS_CONFIG: {
            enabled: false,
            restUrl: "https://example.test/wp-json/vrodos-immerse/v1/results",
            token: "scene-token",
            projectId: 7,
            sceneId: 12,
            expectedAssessments: []
        },
        atob(value) { return Buffer.from(value, "base64").toString("binary"); },
        fetch(url) { writes.push(url); return Promise.resolve({ ok: true }); }
    };
    sceneWindow.window = sceneWindow;
    const sceneContext = vm.createContext({ window: sceneWindow, document: { getElementById: () => null }, console, URLSearchParams, TextDecoder, Uint8Array });
    vm.runInContext(readFileSync(resolve(root, "assets/js/runtime/master/vrodos_runtime_resources.js"), "utf8"), sceneContext);
    ["assessment-utils.js", "assessment-session-runtime.js", "assessment-cefr-runtime.js"].forEach((file) => {
        vm.runInContext(readFileSync(resolve(root, "assets/js/runtime/assessment", file), "utf8"), sceneContext, { filename: file });
    });
    const session = sceneWindow.VRodosImmerseAssessment.getAssessmentSessionRuntime();
    const cefr = sceneWindow.VRodosImmerseAssessment.getCefrRuntime();
    assert(!session.isEnabled() && !session.hasIdentity(), "Assessment-free scene restored a participant identity");
    assert(storageReads === 0, "Assessment-free scene read a stored results session");
    assert(!cefr.applyStoredIdentityIfAvailable(), "Assessment-free scene applied a stored participant identity");
    cefr.showStoredSessionPrompt({ displayName: "Ada", cefrLevel: "B1" });
    assert(!cefr.sessionPromptShown && !cefr.promptScheduled, "Assessment-free scene without attachments opened a dialog");
    assert(!session.setIdentity("Ada", "B1"), "Disabled results session accepted participant identity");
    session.enqueue("test", "attempts/start", {});
    session.recordAssessmentResult({ assetId: 1 }, { isCorrect: true });
    await session.ensureAttemptStarted();
    await session.flushPending();
    session.clearSession();
    session.save();
    assert(writes.length === 0 && session.state.pendingWrites.length === 0, "Assessment-free scene submitted or queued results");
    assert(store.size === 1 && store.get("vrodos:immerse-results:7") === savedSession, "Assessment-free scene changed the project's stored results session");

    let prompts = 0;
    cefr.schedulePrompt = () => { prompts += 1; };
    const a1 = createCefrElement(["A1"]), b1 = createCefrElement(["B1"]);
    cefr.register(a1);
    cefr.register(b1);
    assert(prompts > 0 && !cefr.requiresParticipantName(), "CEFR attachments did not retain a level-only prompt");
    const api = createSpatialApi();
    let nameInputs = 0;
    api.inputField = () => { nameInputs += 1; };
    cefr.renderVrPrompt(api);
    assert(nameInputs === 0 && ["A1", "A2", "B1", "B2"].every((level) => api.buttons.some((button) => button.label === level)), "Immersive CEFR-only prompt requested a name or lost its levels");
    cefr.selectLevel("A1");
    assert(cefr.canStart(), "CEFR-only selection required a participant name");
    cefr.hidePrompt = () => {};
    cefr.startExperience();
    assert(a1.getAttribute("visible") === "true" && a1.classList.contains("raycastable"), "Matching CEFR attachment stayed hidden");
    assert(b1.getAttribute("visible") === "false" && !b1.classList.contains("raycastable"), "Nonmatching CEFR attachment remained selectable");
    assert(writes.length === 0 && !session.hasIdentity(), "CEFR-only start created a results session");
    cefr.unregister(a1);
    assert(cefr.elements.length === 1 && cefr.elements[0] === b1, "Removed CEFR placements must not be retained");
    cefr.unregister(b1);
    assert(cefr.elements.length === 0 && cefr.resources === null && !cefr.promptScheduled, "Last CEFR removal must release presentation resources");
    cefr.register(a1);
    assert(cefr.resources && cefr.elements.length === 1, "CEFR must support a fresh placement after teardown");
    cefr.unregister(a1);
}

function renderedFillGapPassage() {
    const passage = activePanel.api.frames.at(-1).content.children.find((node) => node.options.backgroundColor === "#e0f2fe");
    return passage.children.map((line) => line.children.map((node) => node.options.text || node.options.label || "").join("")).join("\n");
}

// One word bank and inline blanks; selections and revisions preserve the attempt.
{
    const answers = ["temple", "marble", "column", "the", "goddess", "statue", "steps", "pediment", "democracy", "Athens"];
    const text = answers.map((answer) => "Place " + answer + " here.").join(" ");
    let cursor = 0;
    const annotations = answers.map((answer, index) => {
        const start = text.indexOf(answer, cursor);
        cursor = start + answer.length;
        return { id: "gap-" + index, start, end: cursor, type: "blank", correctValue: answer };
    });
    const payload = makePayload("Ten gaps", "Text", "Fill in the gaps", { text, annotations });
    runtime.open(payload);
    const headsetWordOrder = runtime.state.wordBank.map((word) => word.text).join("|");
    assert(headsetWordOrder !== answers.join("|"), "VR fill gaps: word bank exposed the authored answer order");
    const desktopWordBank = namespace.resolveRenderer(payload).createState(payload).wordBank;
    assert(desktopWordBank.map((word) => word.text).join("|") !== answers.join("|"), "Desktop fill gaps: word bank exposed the authored answer order");
    const repeatedWords = [{ text: "same" }, { text: "same" }, { text: "other" }];
    assert(namespace.shuffleFillGapWordBank(repeatedWords).map((word) => word.text).join("|") !== "same|same|other", "Fill gaps: repeated words kept the visible answer order");
    function buttons() {
        const pending = [activePanel.api.frames.at(-1).content, activePanel.api.frames.at(-1).footer];
        const result = [];
        while (pending.length) {
            const node = pending.pop();
            if (node.kind === "button") result.push(node.options);
            pending.push(...node.children);
        }
        return result;
    }
    const button = (label) => buttons().find((entry) => entry.label === label);
    const click = (label) => {
        const target = button(label);
        assert(target && !target.disabled, "Fill gaps: unavailable action " + label);
        target.onClick();
    };
    const blank = (index) => buttons().find((entry) => entry.label.startsWith("[" + (index + 1) + ":"));
    const choose = (answer, index) => { click(answer); blank(index).onClick(); };
    for (const label of ["Previous", "Next", "Clear", "Back words", "More words", "Gap 1"]) {
        assert(!button(label), "Fill gaps: redundant control remains: " + label);
    }
    assert(answers.every((answer) => button(answer)), "Fill gaps: words still require paging");
    assert(renderedFillGapPassage() === answers.map((_, index) => "Place [" + (index + 1) + ": ____] here.").join(" "), "Fill gaps: complete passage was not masked");
    assert(button("Submit").disabled, "Fill gaps: incomplete submission enabled");
    const frame = activePanel.api.frames.at(-1);
    const renderCount = runtime.renderCount;
    click(answers[0]);
    assert(!runtime.state.values["gap-0"], "Fill gaps: choosing a word filled an unselected blank");
    blank(0).onClick();
    assert(frame.statusText.options.text === "Filled 1 of 10 blanks", "Fill gaps: blank click did not assign the selected word");
    assert(button(answers[0]).disabled, "Fill gaps: used word was available twice");
    blank(0).onClick();
    assert(!runtime.state.values["gap-0"] && !button(answers[0]).disabled, "Fill gaps: tapping an answer did not clear and release its word");
    choose(answers[1], 0);
    choose(answers[0], 0);
    assert(!button(answers[1]).disabled, "Fill gaps: replacing an answer did not release its previous word");
    for (let index = 1; index < answers.length; index += 1) choose(answers[index], index);
    assert(activePanel.api.frames.at(-1) === frame && runtime.renderCount === renderCount, "Fill gaps: answering rebuilt the panel");
    assert(runtime.state.wordBank.map((word) => word.text).join("|") === headsetWordOrder, "Fill gaps: word bank reshuffled during an attempt");
    click("Submit");
    assert(windowStub.__vrodosLastAssessmentResult.isCorrect === true, "Fill gaps: complete response graded incorrectly");

    const numberedText = "1.The Parthenon is an ancient temple in Athens. Visit it today.\n2.The building is made of marble. Each column supports the roof.\n3.Η δημοκρατία ξεκίνησε εδώ.";
    const numberedAnswers = ["temple", "marble", "column", "δημοκρατία"];
    const numberedAnnotations = numberedAnswers.map((answer, index) => {
        const start = numberedText.indexOf(answer);
        return { id: "numbered-" + index, start, end: start + answer.length, type: "blank", correctValue: answer };
    });
    runtime.open(makePayload("Numbered passage", "Text", "Fill in the gaps", { text: numberedText, annotations: numberedAnnotations }));
    const maskedPassage = numberedText.replace("temple", "[1: ____]").replace("marble", "[2: ____]").replace("column", "[3: ____]").replace("δημοκρατία", "[4: ____]");
    assert(renderedFillGapPassage() === maskedPassage, "Fill gaps: complete numbered/Greek passage was lost");
    choose("column", 2);
    choose("marble", 1);
    assert(renderedFillGapPassage().includes("[2: marble]") && renderedFillGapPassage().includes("[3: column]"), "Fill gaps: direct blank selection lost responses");
    const longText = "The " + "very ancient ".repeat(30) + "temple stands in Athens.";
    const start = longText.indexOf("temple");
    runtime.open(makePayload("Long passage", "Text", "Fill in the gaps", {
        text: longText, annotations: [{ start, end: start + 6, type: "blank", correctValue: "temple" }]
    }));
    assert(renderedFillGapPassage() === longText.replace("temple", "[1: ____]"), "Fill gaps: long text was truncated");
    for (const prefix of ["1.\t", "1.", "1.t"]) {
        const tabText = prefix + "The temple stands in Athens.";
        const tabStart = tabText.indexOf("temple");
        runtime.open(makePayload("Tab formatting", "Text", "Fill in the gaps", {
            text: tabText, annotations: [{ start: tabStart, end: tabStart + 6, type: "blank", correctValue: "temple" }]
        }));
        assert(!renderedFillGapPassage().includes("tThe"), "Fill gaps: tab repair changed annotation offsets");
        assert(renderedFillGapPassage().includes("The [1: ____] stands in Athens."), "Fill gaps: tab repair lost content");
    }
    const legitimateText = "1.temple architecture matters.";
    runtime.open(makePayload("Legitimate t", "Text", "Fill in the gaps", {
        text: legitimateText, annotations: [{ start: 9, end: 21, type: "blank", correctValue: "architecture" }]
    }));
    assert(renderedFillGapPassage().startsWith("1.temple"), "Fill gaps: legitimate leading t was removed");
    runtime.close("test");
}

// Both intact and damaged imports separate desktop bullet definitions and VR
// phrases while preserving the authored answer spans in both renderers.
{
    const words = ["Athena", "Caryatids", "Poseidon", "Ionic style"];
    const text = "•\tAthena – The goddess of wisdom and the city's protector.\n•\tCaryatids – Sculpted figures supporting columns.\n•\tPoseidon – The god of the sea.\n•\tIonic style – An order with scroll-shaped capitals.";
    const annotations = words.map((word, index) => {
        const start = text.indexOf(word);
        return { id: "bullet-" + index, start, end: start + word.length, type: "blank", correctValue: word };
    });
    const damagedText = text.replace(/\n/g, "n").replace(/\t/g, "t");
    for (const sourceText of [text, damagedText, damagedText.replace(/•/g, "*")]) {
        const payload = makePayload("Bullet definitions", "Text", "Fill in the gaps", { text: sourceText, annotations });
        const renderer = namespace.resolveRenderer(payload);
        const desktop = {
            payload, state: renderer.createState(payload),
            body: { innerHTML: "", querySelectorAll: () => [] },
            setStatus(status) { this.status = status; },
            configurePrimaryAction(options) { this.primary = options; }
        };
        renderer.render(desktop);
        assert((desktop.body.innerHTML.match(/<br \/>[•*]\t/g) || []).length === 3, "Desktop fill gaps: bullet definitions did not start on separate lines");
        assert(!desktop.body.innerHTML.includes("n•t"), "Desktop fill gaps: control character residue rendered");
        assert(desktop.primary.disabled && desktop.status === "Filled 0 of 4 blanks", "Desktop fill gaps: incorrect initial completion state");
        runtime.open(payload);
        const passage = renderedFillGapPassage();
        assert(passage.split("\n").length === 4 && passage.includes("[4: ____]"), "VR fill gaps: complete bullet passage was not shown");
        [desktop.state, runtime.state].forEach((state) => state.annotations.forEach((annotation, index) => {
            assert(state.sourceText.slice(annotation.start, annotation.end) === words[index], "Fill gaps: control characters shifted answer offsets");
        }));
        runtime.close("test");
    }
    const ordinaryText = "1.temple architecture matters.\n•temple\n•tRNA is a molecule.";
    assert(namespace.normalizeAssessmentLineBreaks(ordinaryText) === ordinaryText, "Fill gaps: list repair changed legitimate leading t characters");
}

// Highlight selects entire blank-line-separated verses, then grades one submission.
{
    const text = "First correct line\ncontinued verse\n \nWrong verse\n\nΔεύτερος σωστός\nστίχος\n\nUntouched distractor";
    const secondStart = text.indexOf("Δεύτερος");
    const payload = makePayload("Verses", "Text", "Highlight", {
        text,
        annotations: [
            { start: 6, end: 13, type: "highlight" },
            { start: secondStart, end: secondStart + 8, type: "highlight" }
        ]
    });
    const renderer = namespace.resolveRenderer(payload);
    const desktop = {
        payload, state: renderer.createState(payload), buttons: new Map(),
        body: {
            innerHTML: "",
            querySelectorAll() {
                for (const match of this.innerHTML.matchAll(/data-highlight-id="([^"]+)"/g)) {
                    desktop.buttons.set(match[1], {
                        style: {}, getAttribute: () => match[1], setAttribute() {},
                        addEventListener(type, handler) { this[type] = handler; }
                    });
                }
                return [...desktop.buttons.values()];
            }
        },
        setStatus(status) { this.status = status; },
        configurePrimaryAction(options) { this.primary = options; },
        finish(response, extra) { this.lastResult = namespace.buildAssessmentResult(payload, response, extra); }
    };
    renderer.render(desktop);
    const verses = desktop.state.verses;
    assert(verses.length === 4 && verses[0].text === "First correct line\ncontinued verse", "Highlight: single line breaks must remain in the verse");
    assert(verses[2].text === "Δεύτερος σωστός\nστίχος", "Highlight: Greek verse was split or damaged");
    assert(desktop.buttons.size === 4 && desktop.primary.disabled, "Highlight: every verse must be selectable without an initial selection");
    renderer.onPrimaryAction(desktop);
    assert(!desktop.lastResult, "Highlight: empty submission accepted");
    const select = (index) => desktop.buttons.get(verses[index].id).click();
    select(0);
    assert(!desktop.primary.disabled, "Highlight: partial answer cannot be submitted");
    renderer.onPrimaryAction(desktop);
    assert(desktop.lastResult.score === 50 && !desktop.lastResult.isCorrect, "Highlight: missed correct verse did not reduce score");
    select(2);
    assert(namespace.buildHighlightResult(desktop.state).extra.score === 100, "Highlight: all correct verses must score 100");
    select(1);
    renderer.onPrimaryAction(desktop);
    assert(desktop.lastResult.score === 50 && !desktop.lastResult.isCorrect, "Highlight: wrong selection did not reduce score");
    assert(desktop.lastResult.response.selections[3].isCorrect === null, "Highlight: untouched distractor earned points");
    select(1); select(1);
    assert(desktop.state.selectedIds.size === 3, "Highlight: repeated selection was counted twice");

    runtime.open(clone(payload));
    const frame = activePanel.api.frames.at(-1);
    const renderCount = runtime.renderCount;
    const vrButton = (label) => activePanel.api.buttons.findLast((button) => button.label === label);
    const verseCards = frame.content.children.filter(node => node.kind === "selection-card");
    assert(verseCards.length === verses.length, "VR highlight: each verse needs a separate reading card");
    assert(verseCards.every((card, index) => card.options.selected === false && card.options.label === verses[index].text), "VR highlight: verse text or neutral initial selection changed");
    const lastResult = runtime.lastResult;
    vrButton("Submit").onClick();
    assert(runtime.lastResult === lastResult, "VR highlight: empty submission accepted");
    for (const index of [0, 2, 1]) vrButton(verses[index].text).onClick();
    assert(verseCards[0].options.selected && verseCards[2].options.selected, "VR highlight: selection indicators did not update");
    vrButton(verses[1].text).onClick();
    vrButton(verses[1].text).onClick();
    assert(runtime.renderCount === renderCount && activePanel.api.frames.at(-1) === frame, "VR highlight: verse selection replaced controller targets");
    vrButton("Submit").onClick();
    assert(runtime.lastResult.score === 50, "VR highlight: wrong selection penalty was lost");
    assert(JSON.stringify(runtime.lastResult.response) === JSON.stringify(desktop.lastResult.response), "Highlight: desktop and VR submissions disagree");
    const allWrong = namespace.createHighlightState(text, payload.content.annotations);
    allWrong.selectedIds.add(allWrong.verses[1].id);
    assert(namespace.buildHighlightResult(allWrong).extra.score === 0, "Highlight: score must never be negative");
    const unconfigured = namespace.createHighlightState(text, []);
    unconfigured.selectedIds.add(unconfigured.verses[0].id);
    assert(!namespace.canSubmitHighlight(unconfigured), "Highlight: missing answer key must not complete");
    const windowsText = "  😀 σωστό\r\nσυνέχεια\r\n \t\r\nλάθος  ";
    const windowsState = namespace.createHighlightState(windowsText, [{ start: 2, end: 4, type: "highlight" }]);
    assert(windowsState.verses.length === 2 && windowsState.verses[0].expectedSelected && !windowsState.verses[1].expectedSelected, "Highlight: CRLF/UTF-16 offsets changed the answer key");
    runtime.close("test");
}

// Bingo uses the authored correctness flags, with one board shared by desktop
// and VR. Wrong selections count once; unselected distractors earn no points.
{
    const payload = clone(fixtures.find((fixture) => fixture.name === "vocabulary bingo").payload);
    const renderer = namespace.resolveRenderer(payload);
    const desktop = {
        payload,
        state: renderer.createState(payload),
        body: {
            innerHTML: "",
            querySelectorAll() {
                desktop.buttons = new Map();
                for (const match of this.innerHTML.matchAll(/data-bingo-word-id="([^"]+)"/g)) {
                    const button = {
                        getAttribute: () => match[1],
                        addEventListener(type, handler) { this[type] = handler; }
                    };
                    desktop.buttons.set(match[1], button);
                }
                return [...desktop.buttons.values()];
            }
        },
        setStatus(status) { this.status = status; },
        configurePrimaryAction(options) { this.primary = options; },
        rerender() { renderer.render(this); },
        finish(response, extra) { this.lastResult = namespace.buildAssessmentResult(payload, response, extra); }
    };
    desktop.rerender();
    assert(desktop.primary.disabled, "Desktop bingo: Finish must wait for every correct answer");
    renderer.onPrimaryAction(desktop);
    assert(!desktop.lastResult, "Desktop bingo: premature completion was accepted");
    desktop.buttons.get("barcelona").click();
    assert(desktop.primary.disabled && desktop.status.includes("(50%)"), "Desktop bingo: one answer completed a multi-answer board");
    desktop.buttons.get("montserrat").click();
    desktop.buttons.get("montserrat").click();
    desktop.buttons.get("barcelona").click();
    assert(desktop.state.selectedIds.size === 2, "Desktop bingo: repeat clicks changed scoring");
    desktop.buttons.get("serrada").click();
    assert(!desktop.primary.disabled && desktop.status.includes("Accuracy 67%"), "Desktop bingo: completion/accuracy is incorrect");
    desktop.buttons.get("roques").click();
    renderer.onPrimaryAction(desktop);
    assert(desktop.lastResult.score === 67 && desktop.lastResult.isCorrect === false, "Desktop bingo: wrong selections were lost from final score");
    assert(desktop.lastResult.response.selections.length === 3, "Bingo: unselected distractors must not inflate the grade");
    const wrong = desktop.lastResult.response.selections.find((entry) => entry.wordId === "montserrat");
    assert(wrong.selected && !wrong.expectedSelected && !wrong.isCorrect, "Bingo: incorrect selection result is ambiguous");

    runtime.open(clone(payload));
    function vrButton(label) { return activePanel.api.buttons.findLast((button) => button.label === label); }
    const previousResult = runtime.lastResult;
    const finishEarly = vrButton("Finish").onClick;
    finishEarly();
    assert(runtime.lastResult === previousResult, "VR bingo: premature completion was accepted");
    vrButton("Barcelona").onClick();
    assert(vrButton("Finish").disabled, "VR bingo: Finish enabled before all answers were found");
    vrButton("Montserrat").onClick();
    vrButton("✗ Montserrat").onClick();
    vrButton("muntanya serrada").onClick();
    assert(!vrButton("Finish").disabled, "VR bingo: completed board cannot finish");
    vrButton("Finish").onClick();
    assert(JSON.stringify(runtime.lastResult.response) === JSON.stringify(desktop.lastResult.response), "Bingo: desktop and VR responses disagree");
    assert(runtime.lastResult.score === 67 && runtime.lastResult.isCorrect === false, "VR bingo: incorrect score");
    assert(activePanel.api.texts.some((entry) => entry.text.includes("Accuracy 67%")), "VR bingo: final percentage was not shown");
    const summary = namespace.summarizeAssessmentResult(runtime.lastResult);
    assert(summary.correct === 2 && summary.incorrect === 1 && summary.ungraded === 0, "Bingo: correctness summary disagrees with accuracy");
    runtime.close("test");

    runtime.open(clone(payload));
    vrButton("muntanya serrada").onClick();
    vrButton("Barcelona").onClick();
    vrButton("Finish").onClick();
    assert(runtime.lastResult.score === 100 && runtime.lastResult.isCorrect === true, "Bingo: perfect selection did not score 100%");
    runtime.close("test");

    for (const words of [[], [{ id: "none", text: "No correct answer", isCorrect: false }]]) {
        const invalid = makePayload("Unconfigured bingo", "Grid", "Vocabulary bingo", { words });
        const invalidState = renderer.createState(invalid);
        assert(!namespace.getBingoProgress(invalidState).complete, "Bingo: empty/unconfigured board must never complete");
        assert(Number.isFinite(namespace.getBingoProgress(invalidState).score), "Bingo: empty board produced an invalid percentage");
    }
}

runCefrIdentityHarness();
await runAssessmentFreeSceneHarness();
await runSessionRuntimeHarness();
await runSessionIdentityChangeHarness();

{
    const summary = namespace.summarizeAssessmentResult({ response: {
        answers: [{ isCorrect: true }, { isCorrect: false }, { isCorrect: null }]
    } });
    assert(summary.correct === 1 && summary.incorrect === 1 && summary.ungraded === 1,
        "Mixed assessment answers were not summarized correctly");
    for (const [field, entries] of [
        ["placements", [{ isCorrect: true }, { isCorrect: false }]],
        ["words", [{ found: true }, { found: false }]],
        ["prompts", [{ wasMarked: true }, { wasMarked: false }]],
        ["blanks", [{ isCorrect: true }, { isCorrect: false }]]
    ]) {
        const counts = namespace.summarizeAssessmentResult({ response: { [field]: entries } });
        assert(counts.correct === 1 && counts.incorrect === 1 && counts.ungraded === 0,
            `${field} assessment counts were not summarized correctly`);
    }
    const store = new Map();
    function localSession(search, deliveryDisabled = false, sceneId = 11) {
        const localWindow = {
            console,
            VRODOS_RUNTIME_CONTEXT: { projectId: 7, sceneId },
            VRODOS_IMMERSE_RESULTS_CONFIG: deliveryDisabled ? { enabled: false, projectId: 7, sceneId } : undefined,
            location: { search: search || "" },
            sessionStorage: {
                getItem: (key) => store.get(key) || null,
                setItem: (key, value) => store.set(key, value),
                removeItem: (key) => store.delete(key)
            }
        };
        localWindow.window = localWindow;
        const localContext = vm.createContext({ window: localWindow, console, URLSearchParams, TextDecoder, Uint8Array });
        ["assessment-utils.js", "assessment-session-runtime.js"].forEach((file) => {
            vm.runInContext(readFileSync(resolve(root, "assets/js/runtime/assessment", file), "utf8"), localContext, { filename: file });
        });
        return localWindow.VRodosImmerseAssessment.getAssessmentSessionRuntime();
    }
    const first = localSession();
    const playable = (assessmentSourceId, levels = ["B1"]) => ({
        supported: true, group: "Question", assessmentSourceId, sceneId: 11, levels,
        content: { questions: [{ question: "Ready?", answers: ["Yes", "No"], correctIndex: 0 }] }
    });
    const a = playable("a"), b = playable("b"), otherLevel = playable("a2", ["A2"]);
    const repeatedAsset = { ...playable(""), assetId: 555, sourceId: "placement-1" };
    const repeatedAssetOtherPlacement = { ...repeatedAsset, sourceId: "placement-2" };
    first.registerAssessment({}, a);
    first.registerAssessment({}, a);
    first.registerAssessment({}, b);
    first.registerAssessment({}, repeatedAsset);
    first.registerAssessment({}, repeatedAssetOtherPlacement);
    first.registerAssessment({}, otherLevel);
    first.registerAssessment({}, { ...playable("read-only"), supported: false });
    first.setStageLevel("B1");
    assert(first.getStageProgress().total === 3, "Stage total included duplicates, another CEFR level, or read-only content");
    first.recordAssessmentResult(a, { response: { answers: [{ isCorrect: false }] } });
    first.recordAssessmentResult(a, { response: { answers: [{ isCorrect: true }] } });
    assert(first.getStageProgress().completed === 1, "Retaking an assessment incremented stage progress");
    const restored = localSession();
    restored.registerAssessment({}, a);
    restored.registerAssessment({}, b);
    restored.setStageLevel("B1");
    assert(restored.getStageProgress().completed === 1, "Stage progress did not survive reload");
    const nextScene = localSession("", false, 12);
    nextScene.registerAssessment({}, { ...a, sceneId: 12 });
    nextScene.setStageLevel("B1");
    assert(nextScene.getStageProgress().completed === 0, "Completion in one scene counted in another scene");
    const restarted = localSession("?vrodos_new_attempt=1");
    restarted.registerAssessment({}, a);
    restarted.registerAssessment({}, b);
    restarted.setStageLevel("B1");
    assert(restarted.getStageProgress().completed === 0, "A new attempt retained previous stage progress");
    const disabledDelivery = localSession("", true);
    disabledDelivery.registerAssessment({}, a);
    disabledDelivery.setStageLevel("B1");
    disabledDelivery.recordAssessmentResult(a, { response: { answers: [{ isCorrect: true }] } });
    const disabledReload = localSession("", true);
    disabledReload.registerAssessment({}, a);
    disabledReload.setStageLevel("B1");
    assert(disabledReload.getStageProgress().completed === 1,
        "Progress with results delivery disabled did not survive reload");
}

console.log(`Assessment runtime harness passed ${fixtures.length + 19} cases.`);
