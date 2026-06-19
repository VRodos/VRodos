(function () {
    "use strict";

    const namespace = window.VRodosImmerseAssessment = window.VRodosImmerseAssessment || {};
    const decodeDisplayText = namespace.decodeDisplayText;
    const normalizeComparableText = namespace.normalizeComparableText;
    const normalizeWordSearchText = namespace.normalizeWordSearchText;
    const normalizeFreeText = namespace.normalizeFreeText;
    const isPlaceholderText = namespace.isPlaceholderText;
    const toArray = namespace.toArray;
    const shuffleArray = namespace.shuffleArray;
    const arrayEquals = namespace.arrayEquals;
    const normalizeAssessmentLineBreaks = namespace.normalizeAssessmentLineBreaks;
    const normalizeQuestionItems = namespace.normalizeQuestionItems;
    const normalizePairEntries = namespace.normalizePairEntries;
    const normalizeGridEntries = namespace.normalizeGridEntries;
    const normalizeTextAnnotations = namespace.normalizeTextAnnotations;
    const buildAssessmentResult = namespace.buildAssessmentResult;
    const resolveAssessmentRendererKey = namespace.resolveAssessmentRendererKey;
    const normalizeAssessmentPayloadForRenderer = namespace.normalizeAssessmentPayloadForRenderer;

    const PANEL_WIDTH = 2.05;
    const PANEL_HEIGHT = 1.44;

    function value(value, fallback) {
        const text = decodeDisplayText ? decodeDisplayText(value || "") : String(value || "");
        return text || fallback || "";
    }

    function makeRuntime() {
        return {
            payload: null,
            state: null,
            api: null,
            lastResult: null,
            renderer: null,
            rendererKey: "",
            renderCount: 0,
            lastOpenDiagnostics: null,
            spatialUiLoadPending: false,
            pendingPayload: null
        };
    }

    function getOverlayApi() {
        return window.VRODOSRuntimeOverlay || null;
    }

    function getSpatialUiApi() {
        const spatialUi = window.VRODOSSpatialUI || null;
        return spatialUi && typeof spatialUi.isAvailable === "function" && spatialUi.isAvailable()
            ? spatialUi
            : null;
    }

    function recordVrDiagnostic(level, message, details) {
        const spatialUi = window.VRODOSSpatialUI || null;
        if (spatialUi && typeof spatialUi.recordDiagnostic === "function") {
            spatialUi.recordDiagnostic(level || "info", "assessment: " + (message || ""), details || {});
            return;
        }
        const overlayApi = getOverlayApi();
        if (overlayApi && typeof overlayApi.recordDiagnostic === "function") {
            overlayApi.recordDiagnostic(level || "info", "assessment: " + (message || ""), details || {});
        }
    }

    function createFrame(runtime, status, primary, options) {
        const api = runtime.api;
        const payload = runtime.payload || {};
        const frameOptions = Object.assign({
            title: value(payload.title, "Assessment"),
            status: status || "",
            headerHeight: 112,
            headerPaddingX: 56,
            titleSize: 28,
            titleLineHeight: "118%",
            titleWhiteSpace: "normal",
            titleWordBreak: "break-word",
            titleMaxLines: 2,
            titleMaxCharsPerLine: 54,
            titleHeight: 66,
            headerGapColumn: 24,
            closeButtonWidth: 82,
            closeButtonHeight: 64,
            closeButtonMinWidth: 72,
            closeButtonTextSize: 34,
            closeButtonFontWeight: 700,
            paddingX: 72,
            paddingY: 52,
            footerHeight: 104,
            footerPaddingBottom: 34,
            statusFontSize: 22,
            statusLineHeight: "110%",
            scrollContent: true,
            scrollGapY: 24,
            gapY: 30,
            onClose: function () {
                runtime.close("close");
            },
            primary
        }, options || {});
        return api.frame(frameOptions);
    }

    function addInfo(api, frame, message) {
        const info = api.container(frame.content, {
            backgroundColor: "#e0f2fe",
            borderRadius: 16,
            paddingX: 24,
            paddingY: 16,
            width: "100%"
        });
        api.text(info, {
            text: message,
            color: "#075985",
            fontSize: 30,
            lineHeight: "120%"
        });
    }

    function buttonVariant(item, selectedFallback) {
        if (item.variant) {
            return item.variant;
        }
        if (item.selected || selectedFallback) {
            return "positive";
        }
        if (item.negative) {
            return "negative";
        }
        return item.secondary === false ? "primary" : "secondary";
    }

    function addButtonGrid(api, parent, items, options) {
        const cfg = options || {};
        api.grid(parent || api.content, items.map((item) => Object.assign({}, item, {
            variant: buttonVariant(item),
            textSize: item.textSize || cfg.textSize || 30,
            minHeight: item.minHeight || cfg.itemHeight || 82
        })), {
            columns: cfg.columns || 2,
            gapX: cfg.gapX || 22,
            gapY: cfg.gapY || 22,
            itemHeight: cfg.itemHeight || cfg.height || 84
        });
    }

    function resolveVrRendererKey(payload) {
        if (!payload) {
            return "";
        }

        if (typeof resolveAssessmentRendererKey === "function") {
            const sharedKey = resolveAssessmentRendererKey(payload, { ignoreSupported: true });
            if (sharedKey && VR_RENDERERS[sharedKey]) {
                return sharedKey;
            }
        }

        return "";
    }

    function normalizeVrPayloadForRenderer(payload, rendererKey) {
        return typeof normalizeAssessmentPayloadForRenderer === "function"
            ? normalizeAssessmentPayloadForRenderer(payload, rendererKey)
            : payload;
    }

    function getContentArray(content, fieldName) {
        return content && typeof content === "object" && Array.isArray(content[fieldName])
            ? content[fieldName]
            : [];
    }

    function getPayloadContentLength(payload) {
        if (payload && typeof payload.contentEncodedLength === "number") {
            return payload.contentEncodedLength;
        }
        if (!payload || typeof payload.content === "undefined") {
            return 0;
        }
        try {
            return JSON.stringify(payload.content).length;
        } catch (err) {
            return 0;
        }
    }

    function getStateCountDiagnostics(rendererKey, state) {
        const diagnostics = {
            normalizedQuestionCount: 0,
            normalizedPlayableQuestionCount: 0,
            normalizedPairCount: 0,
            normalizedGridCount: 0,
            normalizedTextAnnotationCount: 0,
            normalizedTextWordBankCount: 0
        };

        if (!state || typeof state !== "object") {
            return diagnostics;
        }

        if ((rendererKey === "Question" || rendererKey === "ImageQuiz") && Array.isArray(state.items)) {
            diagnostics.normalizedQuestionCount = state.items.length;
            diagnostics.normalizedPlayableQuestionCount = state.items.filter((item) =>
                item && (item.prompt || item.imageUrl) && Array.isArray(item.answers) && item.answers.length > 0
            ).length;
        }
        if (rendererKey === "Pair" && Array.isArray(state.entries)) {
            diagnostics.normalizedPairCount = state.entries.length;
        }
        if (rendererKey === "Grid" && Array.isArray(state.entries)) {
            diagnostics.normalizedGridCount = state.entries.length;
        }
        if (rendererKey === "Text") {
            diagnostics.normalizedTextAnnotationCount = Array.isArray(state.annotations) ? state.annotations.length : 0;
            diagnostics.normalizedTextWordBankCount = Array.isArray(state.wordBank) ? state.wordBank.length : 0;
        }

        return diagnostics;
    }

    function isVrAssessmentStateEmpty(rendererKey, state) {
        if (!rendererKey || !state || typeof state !== "object") {
            return true;
        }
        if (rendererKey === "Question" || rendererKey === "ImageQuiz") {
            return !Array.isArray(state.items) || state.items.length === 0;
        }
        if (rendererKey === "Pair" || rendererKey === "Grid") {
            return !Array.isArray(state.entries) || state.entries.length === 0;
        }
        if (rendererKey === "Text") {
            if (!Array.isArray(state.annotations) || state.annotations.length === 0) {
                return true;
            }
            return state.mode !== "highlight" && (!Array.isArray(state.wordBank) || state.wordBank.length === 0);
        }
        return false;
    }

    function getVrAssessmentPayloadDiagnostics(payload, rendererKey, state) {
        const content = payload ? payload.content : null;
        const contentIsArray = Array.isArray(content);
        const contentObject = content && typeof content === "object" && !contentIsArray ? content : {};
        const contentKeys = contentObject ? Object.keys(contentObject).slice(0, 12) : [];
        const stateCounts = getStateCountDiagnostics(rendererKey, state);

        return Object.assign({
            sourceId: payload && payload.sourceId || "",
            group: payload && payload.group || "",
            type: payload && payload.type || "",
            supported: Boolean(payload && payload.supported),
            contentLength: getPayloadContentLength(payload),
            contentType: contentIsArray ? "array" : typeof content,
            contentKeys,
            contentNormalizedFrom: payload && (payload.assessmentContentNormalizedFrom || payload.vrContentNormalizedFrom) || "",
            questionCount: contentIsArray && (rendererKey === "Question" || rendererKey === "ImageQuiz")
                ? content.length
                : getContentArray(contentObject, "questions").length,
            pairCount: contentIsArray && rendererKey === "Pair"
                ? content.length
                : getContentArray(contentObject, "pairs").length,
            wordCount: contentIsArray && rendererKey === "Grid"
                ? content.length
                : getContentArray(contentObject, "words").length,
            annotationCount: contentIsArray && rendererKey === "Text"
                ? content.length
                : getContentArray(contentObject, "annotations").length,
            rendererKey: rendererKey || "",
            desktopRendererKey: typeof namespace.resolveAssessmentRendererKey === "function"
                ? namespace.resolveAssessmentRendererKey(payload)
                : "",
            stateEmpty: isVrAssessmentStateEmpty(rendererKey, state)
        }, stateCounts);
    }

    function isImageQuizPayload(payload) {
        return resolveVrRendererKey(payload) === "ImageQuiz";
    }

    function isQuestionPayload(payload) {
        const rendererKey = resolveVrRendererKey(payload);
        return rendererKey === "Question" || rendererKey === "ImageQuiz";
    }

    function createQuestionRenderer() {
        return {
            createState: function (payload) {
                const typeKey = normalizeComparableText(payload && payload.type);
                return {
                    items: normalizeQuestionItems(payload),
                    isImageQuiz: isImageQuizPayload(payload),
                    isTrueFalse: typeKey === "true or false" || typeKey === "true/false",
                    activeIndex: 0,
                    selectedByIndex: []
                };
            },
            render: function (runtime) {
                const state = runtime.state;
                const item = state.items[state.activeIndex];
                if (!item || !item.answers.length) {
                    renderUnsupported(runtime, "This assessment has no playable question content.");
                    return;
                }

                const selectedIndex = Number.isInteger(state.selectedByIndex[state.activeIndex])
                    ? state.selectedByIndex[state.activeIndex]
                    : null;
                const frame = createFrame(runtime, "Question " + (state.activeIndex + 1) + " of " + state.items.length, {
                    label: state.activeIndex >= state.items.length - 1 ? "Finish" : "Next",
                    disabled: selectedIndex === null,
                    onClick: function () {
                        if (selectedIndex === null) {
                            return;
                        }
                        if (state.activeIndex >= state.items.length - 1) {
                            finishQuestion(runtime);
                            return;
                        }
                        state.activeIndex += 1;
                        runtime.rerender();
                    }
                });

                runtime.api.text(frame.content, {
                    text: item.prompt || "Question " + (state.activeIndex + 1),
                    color: "#0f172a",
                    fontSize: 44,
                    fontWeight: 500,
                    lineHeight: "125%"
                });

                if (item.imageUrl) {
                    runtime.api.image(frame.content, {
                        width: 820,
                        height: 360,
                        src: item.imageUrl
                    });
                }

                addButtonGrid(runtime.api, frame.content, item.answers.map((answer, index) => {
                    const selected = selectedIndex === index;
                    return {
                        label: answer || "Option " + (index + 1),
                        selected,
                        onClick: function () {
                            state.selectedByIndex[state.activeIndex] = index;
                            runtime.rerender();
                        }
                    };
                }), {
                    columns: state.isTrueFalse ? 1 : 2,
                    itemHeight: 92,
                    textSize: 32
                });
            }
        };
    }

    function finishQuestion(runtime) {
        const state = runtime.state;
        const answers = state.items.map((question, index) => {
            const responseIndex = Number.isInteger(state.selectedByIndex[index]) ? state.selectedByIndex[index] : null;
            const correctIndex = question.correctIndex;
            const isCorrect = correctIndex === null || responseIndex === null ? null : responseIndex === correctIndex;
            return {
                questionId: question.id,
                questionIndex: index,
                prompt: question.prompt,
                options: question.answers.slice(),
                selectedIndex: responseIndex,
                selectedAnswer: responseIndex !== null ? question.answers[responseIndex] || "" : "",
                correctIndex,
                correctAnswer: correctIndex !== null ? question.answers[correctIndex] || "" : "",
                isCorrect
            };
        });
        const gradedAnswers = answers.filter((answer) => answer.isCorrect !== null);
        runtime.finish(
            { answers },
            { isCorrect: gradedAnswers.length ? gradedAnswers.every((answer) => answer.isCorrect === true) : null }
        );
    }

    function createPairRenderer() {
        return {
            createState: function (payload) {
                const entries = normalizePairEntries(payload);
                const ids = entries.map((entry) => entry.id);
                return {
                    mode: normalizeComparableText(payload && payload.type) === "drag and drop" ? "dragdrop" : "matching",
                    entries,
                    entriesById: Object.fromEntries(entries.map((entry) => [entry.id, entry])),
                    sourceOrder: shuffleArray(ids),
                    targetOrder: shuffleArray(ids),
                    matchesBySource: {},
                    assignmentsByTarget: {},
                    selectedSourceId: "",
                    view: null
                };
            },
            render: function (runtime) {
                const state = runtime.state;
                if (!state.entries.length) {
                    renderUnsupported(runtime, "This pair assessment is empty.");
                    return;
                }

                const placed = state.mode === "dragdrop"
                    ? Object.keys(state.assignmentsByTarget).length
                    : Object.keys(state.matchesBySource).length;
                if (state.view && state.view.api === runtime.api && typeof runtime.api.updateButton === "function") {
                    updatePairView(runtime, placed);
                    return;
                }

                const completeButtonOptions = pairCompleteButtonOptions(runtime, state, placed);
                const frame = createFrame(runtime, pairStatusText(state, placed), completeButtonOptions, {
                    headerHeight: 124,
                    paddingX: 62,
                    paddingTop: 24,
                    paddingBottom: 18,
                    gapY: 12,
                    footerHeight: 88,
                    footerPaddingBottom: 24,
                    statusFontSize: 20,
                    statusWhiteSpace: "nowrap",
                    scrollGapY: 12
                });
                state.view = {
                    api: runtime.api,
                    statusText: frame.statusText || null,
                    primaryButton: frame.primaryButton || null,
                    sourceButtons: {},
                    targetButtons: {}
                };

                const columns = runtime.api.row(frame.content, {
                    alignItems: "flex-start",
                    gapColumn: 34,
                    width: "100%"
                });
                const sourceColumn = runtime.api.column(columns, {
                    flexGrow: 1,
                    gapRow: 14,
                    width: "50%"
                });
                const targetColumn = runtime.api.column(columns, {
                    flexGrow: 1,
                    gapRow: 14,
                    width: "50%"
                });
                runtime.api.text(sourceColumn, {
                    text: "Sources",
                    color: "#475569",
                    fontSize: 24,
                    fontWeight: 600
                });
                runtime.api.text(targetColumn, {
                    text: "Targets",
                    color: "#475569",
                    fontSize: 24,
                    fontWeight: 600
                });

                const buttonSizing = getPairButtonSizing(state);
                state.sourceOrder.forEach((sourceId) => {
                    state.view.sourceButtons[sourceId] = runtime.api.button(sourceColumn, Object.assign(
                        pairSourceButtonOptions(runtime, state, sourceId),
                        {
                            width: "100%",
                            minHeight: buttonSizing.height,
                            textSize: buttonSizing.textSize,
                            lineHeight: buttonSizing.lineHeight
                        }
                    ));
                });

                state.targetOrder.forEach((targetId) => {
                    state.view.targetButtons[targetId] = runtime.api.button(targetColumn, Object.assign(
                        pairTargetButtonOptions(runtime, state, targetId),
                        {
                            width: "100%",
                            minHeight: buttonSizing.height,
                            textSize: buttonSizing.textSize,
                            lineHeight: buttonSizing.lineHeight
                        }
                    ));
                });
            }
        };
    }

    function getPairButtonSizing(state) {
        return {
            height: state.entries.length > 6 ? 58 : 76,
            textSize: state.entries.length > 6 ? 19 : 22,
            lineHeight: "126%"
        };
    }

    function pairStatusText(state, placed) {
        return "Matched " + placed + " of " + state.entries.length + " pairs";
    }

    function pairCompleteButtonOptions(runtime, state, placed) {
        return {
            label: "Complete",
            disabled: placed !== state.entries.length,
            width: 190,
            height: 56,
            textSize: 22,
            lineHeight: "118%",
            onClick: function () {
                finishPair(runtime);
            }
        };
    }

    function pairSourceButtonOptions(runtime, state, sourceId) {
        const entry = state.entriesById[sourceId];
        const matchedTargetId = state.matchesBySource[sourceId] || "";
        const assigned = state.mode === "matching" ? Boolean(matchedTargetId) : Object.values(state.assignmentsByTarget).includes(sourceId);
        const selected = state.selectedSourceId === sourceId;
        return {
            label: entry ? entry.source || "Source" : "Source",
            variant: assigned ? "positive" : (selected ? "primary" : "secondary"),
            onClick: function () {
                if (state.mode === "matching" && state.matchesBySource[sourceId]) {
                    delete state.matchesBySource[sourceId];
                } else {
                    state.selectedSourceId = state.selectedSourceId === sourceId ? "" : sourceId;
                }
                runtime.rerender();
            }
        };
    }

    function pairTargetButtonOptions(runtime, state, targetId) {
        const entry = state.entriesById[targetId];
        const sourceId = sourceForTarget(state, targetId);
        const sourceEntry = sourceId ? state.entriesById[sourceId] : null;
        return {
            label: entry
                ? (entry.target || "Target") + (sourceEntry ? " <- " + (sourceEntry.source || "Source") : "")
                : "Target",
            variant: sourceId ? "positive" : "secondary",
            onClick: function () {
                if (sourceId) {
                    clearTarget(state, targetId);
                } else if (state.selectedSourceId) {
                    assignPair(state, state.selectedSourceId, targetId);
                }
                runtime.rerender();
            }
        };
    }

    function updatePairView(runtime, placed) {
        const state = runtime.state;
        const view = state && state.view;
        if (!view) {
            return;
        }
        const buttonSizing = getPairButtonSizing(state);
        if (view.statusText && typeof runtime.api.updateText === "function") {
            runtime.api.updateText(view.statusText, {
                text: pairStatusText(state, placed),
                color: "#5a5a5a",
                fontSize: 20,
                lineHeight: "110%",
                flexGrow: 1,
                flexShrink: 1,
                wordBreak: "keep-all",
                whiteSpace: "nowrap"
            });
        }
        runtime.api.updateButton(view.primaryButton, pairCompleteButtonOptions(runtime, state, placed));
        state.sourceOrder.forEach((sourceId) => {
            runtime.api.updateButton(view.sourceButtons[sourceId], Object.assign(
                pairSourceButtonOptions(runtime, state, sourceId),
                {
                    width: "100%",
                    minHeight: buttonSizing.height,
                    textSize: buttonSizing.textSize,
                    lineHeight: buttonSizing.lineHeight
                }
            ));
        });
        state.targetOrder.forEach((targetId) => {
            runtime.api.updateButton(view.targetButtons[targetId], Object.assign(
                pairTargetButtonOptions(runtime, state, targetId),
                {
                    width: "100%",
                    minHeight: buttonSizing.height,
                    textSize: buttonSizing.textSize,
                    lineHeight: buttonSizing.lineHeight
                }
            ));
        });
    }

    function sourceForTarget(state, targetId) {
        if (state.mode === "dragdrop") {
            return state.assignmentsByTarget[targetId] || "";
        }
        return Object.keys(state.matchesBySource).find((sourceId) => state.matchesBySource[sourceId] === targetId) || "";
    }

    function clearTarget(state, targetId) {
        if (state.mode === "dragdrop") {
            delete state.assignmentsByTarget[targetId];
            return;
        }
        Object.keys(state.matchesBySource).forEach((sourceId) => {
            if (state.matchesBySource[sourceId] === targetId) {
                delete state.matchesBySource[sourceId];
            }
        });
    }

    function assignPair(state, sourceId, targetId) {
        if (state.mode === "dragdrop") {
            Object.keys(state.assignmentsByTarget).forEach((existingTargetId) => {
                if (existingTargetId === targetId || state.assignmentsByTarget[existingTargetId] === sourceId) {
                    delete state.assignmentsByTarget[existingTargetId];
                }
            });
            state.assignmentsByTarget[targetId] = sourceId;
        } else {
            Object.keys(state.matchesBySource).forEach((existingSourceId) => {
                if (existingSourceId === sourceId || state.matchesBySource[existingSourceId] === targetId) {
                    delete state.matchesBySource[existingSourceId];
                }
            });
            state.matchesBySource[sourceId] = targetId;
        }
        state.selectedSourceId = "";
    }

    function finishPair(runtime) {
        const state = runtime.state;
        if (state.mode === "dragdrop") {
            const placements = state.entries.map((entry) => {
                const sourceId = state.assignmentsByTarget[entry.id] || "";
                const sourceEntry = state.entriesById[sourceId];
                return {
                    targetId: entry.id,
                    target: entry.target,
                    selectedSourceId: sourceId,
                    selectedSource: sourceEntry ? sourceEntry.source : "",
                    expectedSourceId: entry.id,
                    expectedSource: entry.source,
                    isCorrect: sourceId === entry.id
                };
            });
            runtime.finish(
                { placements, variant: "drag-and-drop" },
                { isCorrect: placements.every((placement) => placement.isCorrect === true) }
            );
            return;
        }

        const matches = state.entries.map((entry) => {
            const selectedTargetId = state.matchesBySource[entry.id] || "";
            const selectedTarget = state.entriesById[selectedTargetId];
            return {
                sourceId: entry.id,
                source: entry.source,
                expectedTargetId: entry.id,
                expectedTarget: entry.target,
                selectedTargetId,
                selectedTarget: selectedTarget ? selectedTarget.target : "",
                isCorrect: selectedTargetId === entry.id
            };
        });
        runtime.finish(
            { matches, variant: "matching" },
            { isCorrect: matches.every((match) => match.isCorrect === true) }
        );
    }

    function createGridRenderer() {
        return {
            createState: function (payload) {
                const entries = normalizeGridEntries(payload);
                const mode = normalizeComparableText(payload && payload.type) === "vocabulary bingo" ? "bingo" : "wordsearch";
                if (mode === "bingo") {
                    const promptOrder = shuffleArray(entries.map((entry) => entry.id));
                    return {
                        mode,
                        entries,
                        entriesById: Object.fromEntries(entries.map((entry) => [entry.id, entry])),
                        boardOrder: shuffleArray(entries.map((entry) => entry.id)),
                        promptOrder,
                        currentPromptIndex: 0,
                        markedIds: new Set(),
                        feedback: ""
                    };
                }

                return {
                    mode,
                    entries,
                    puzzle: buildSimpleWordSearch(entries),
                    foundIds: new Set(),
                    selectionStart: null
                };
            },
            render: function (runtime) {
                if (!runtime.state.entries.length) {
                    renderUnsupported(runtime, "This grid assessment is empty.");
                    return;
                }
                if (runtime.state.mode === "bingo") {
                    renderBingo(runtime);
                } else {
                    renderWordSearch(runtime);
                }
            }
        };
    }

    function buildSimpleWordSearch(entries) {
        if (!entries.length) {
            return null;
        }
        const totalLetters = entries.reduce((total, entry) => total + entry.normalized.length, 0);
        const longest = entries.reduce((max, entry) => Math.max(max, entry.normalized.length), 0);
        const size = Math.max(8, longest, Math.ceil(Math.sqrt(totalLetters * 1.4)));
        const cells = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
        const placed = [];
        const directions = [
            { row: 0, col: 1 },
            { row: 1, col: 0 },
            { row: 1, col: 1 },
            { row: 1, col: -1 }
        ];

        const canPlace = function (word, row, col, direction) {
            for (let index = 0; index < word.length; index += 1) {
                const nextRow = row + direction.row * index;
                const nextCol = col + direction.col * index;
                if (nextRow < 0 || nextCol < 0 || nextRow >= size || nextCol >= size) {
                    return false;
                }
                if (cells[nextRow][nextCol] && cells[nextRow][nextCol] !== word[index]) {
                    return false;
                }
            }
            return true;
        };

        const placeWord = function (entry) {
            const word = normalizeWordSearchText(entry.normalized);
            for (const direction of directions) {
                for (let row = 0; row < size; row += 1) {
                    for (let col = 0; col < size; col += 1) {
                        if (!canPlace(word, row, col, direction)) {
                            continue;
                        }

                        const path = [];
                        for (let index = 0; index < word.length; index += 1) {
                            const nextRow = row + direction.row * index;
                            const nextCol = col + direction.col * index;
                            cells[nextRow][nextCol] = word[index];
                            path.push(nextRow + ":" + nextCol);
                        }
                        placed.push(Object.assign({}, entry, { path }));
                        return true;
                    }
                }
            }

            return false;
        };

        const orderedEntries = entries.slice().sort((left, right) => right.normalized.length - left.normalized.length);
        for (const entry of orderedEntries) {
            if (!placeWord(entry)) {
                return null;
            }
        }

        for (let row = 0; row < size; row += 1) {
            for (let col = 0; col < size; col += 1) {
                if (!cells[row][col]) {
                    cells[row][col] = String.fromCharCode(65 + ((row * size + col) % 26));
                }
            }
        }

        return { size, cells, entries: placed };
    }

    function getCellPath(startKey, endKey, size) {
        const start = startKey.split(":").map(Number);
        const end = endKey.split(":").map(Number);
        const rowDelta = end[0] - start[0];
        const colDelta = end[1] - start[1];
        const straight = rowDelta === 0 || colDelta === 0 || Math.abs(rowDelta) === Math.abs(colDelta);
        if (!straight) {
            return [startKey];
        }
        const rowStep = rowDelta === 0 ? 0 : rowDelta / Math.abs(rowDelta);
        const colStep = colDelta === 0 ? 0 : colDelta / Math.abs(colDelta);
        const length = Math.max(Math.abs(rowDelta), Math.abs(colDelta)) + 1;
        const path = [];
        for (let i = 0; i < length; i += 1) {
            const row = start[0] + rowStep * i;
            const col = start[1] + colStep * i;
            if (row < 0 || col < 0 || row >= size || col >= size) {
                return [startKey];
            }
            path.push(row + ":" + col);
        }
        return path;
    }

    function renderWordSearch(runtime) {
        const state = runtime.state;
        if (!state.puzzle) {
            renderUnsupported(runtime, "This word search could not be built.");
            return;
        }
        const frame = createFrame(runtime, "Found " + state.foundIds.size + " of " + state.puzzle.entries.length + " words", {
            label: "Finish",
            disabled: state.foundIds.size !== state.puzzle.entries.length,
            onClick: function () {
                const words = state.puzzle.entries.map((entry) => ({
                    wordId: entry.id,
                    word: entry.text,
                    hint: entry.hint,
                    found: state.foundIds.has(entry.id)
                }));
                runtime.finish(
                    { words, variant: "word-search" },
                    { isCorrect: words.every((word) => word.found === true) }
                );
            }
        });
        addInfo(runtime.api, frame, "Tap the first and last letter of a hidden word in a straight line.");

        runtime.api.text(frame.content, {
            text: state.puzzle.entries.map((entry) => (state.foundIds.has(entry.id) ? "[x] " : "[ ] ") + entry.text).join("  "),
            color: "#334155",
            fontSize: 20,
            lineHeight: "120%"
        });

        const size = state.puzzle.size;
        const cellSize = Math.max(34, Math.min(54, Math.floor(660 / Math.max(1, size))));
        const board = runtime.api.column(frame.content, {
            alignItems: "center",
            gapRow: 7,
            width: "100%"
        });
        const foundCells = new Set();
        state.puzzle.entries.forEach((entry) => {
            if (state.foundIds.has(entry.id)) {
                entry.path.forEach((key) => foundCells.add(key));
            }
        });

        state.puzzle.cells.forEach((row, rowIndex) => {
            const rowContainer = runtime.api.row(board, {
                justifyContent: "center",
                gapColumn: 7,
                width: "100%"
            });
            row.forEach((letter, colIndex) => {
                const key = rowIndex + ":" + colIndex;
                const selected = state.selectionStart === key;
                runtime.api.button(rowContainer, {
                    label: letter,
                    variant: foundCells.has(key) ? "positive" : (selected ? "primary" : "secondary"),
                    width: cellSize,
                    height: cellSize,
                    minWidth: cellSize,
                    minHeight: cellSize,
                    textSize: Math.max(16, Math.min(22, cellSize - 20)),
                    flexShrink: 0,
                    onClick: function () {
                        if (!state.selectionStart) {
                            state.selectionStart = key;
                            runtime.rerender();
                            return;
                        }

                        const path = getCellPath(state.selectionStart, key, size);
                        const matched = state.puzzle.entries.find((entry) =>
                            !state.foundIds.has(entry.id) &&
                            (arrayEquals(path, entry.path) || arrayEquals(path, entry.path.slice().reverse()))
                        );
                        if (matched) {
                            state.foundIds.add(matched.id);
                        }
                        state.selectionStart = null;
                        runtime.rerender();
                    }
                });
            });
        });
    }

    function renderBingo(runtime) {
        const state = runtime.state;
        const currentPromptId = state.promptOrder[state.currentPromptIndex] || "";
        const currentPrompt = currentPromptId ? state.entriesById[currentPromptId] : null;
        const frame = createFrame(runtime, "Completed " + state.markedIds.size + " of " + state.entries.length + " prompts", {
            label: "Finish",
            disabled: state.markedIds.size !== state.entries.length,
            onClick: function () {
                const prompts = state.promptOrder.map((entryId, index) => {
                    const entry = state.entriesById[entryId];
                    return {
                        promptIndex: index,
                        wordId: entry.id,
                        word: entry.text,
                        hint: entry.hint,
                        wasMarked: state.markedIds.has(entry.id)
                    };
                });
                runtime.finish(
                    { prompts, variant: "vocabulary-bingo" },
                    { isCorrect: prompts.every((prompt) => prompt.wasMarked === true) }
                );
            }
        });

        runtime.api.text(frame.content, {
            text: currentPrompt ? "Prompt: " + (currentPrompt.hint || currentPrompt.text) : "All prompts completed.",
            color: currentPrompt ? "#1d4ed8" : "#166534",
            fontSize: 32,
            fontWeight: 600,
            lineHeight: "120%"
        });
        if (state.feedback) {
            runtime.api.text(frame.content, {
                text: state.feedback,
                color: "#dc2626",
                fontSize: 24,
                lineHeight: "120%"
            });
        }

        const boardSize = Math.ceil(Math.sqrt(state.entries.length));
        const slots = state.boardOrder.concat(Array.from({ length: boardSize * boardSize - state.entries.length }, () => ""));
        const cellSize = Math.max(72, Math.min(138, Math.floor(560 / Math.max(1, boardSize))));
        const board = runtime.api.column(frame.content, {
            alignItems: "center",
            gapRow: 12,
            width: "100%"
        });
        for (let row = 0; row < boardSize; row += 1) {
            const rowContainer = runtime.api.row(board, {
                justifyContent: "center",
                gapColumn: 12,
                width: "100%"
            });
            for (let col = 0; col < boardSize; col += 1) {
                const entryId = slots[row * boardSize + col];
                if (!entryId) {
                    runtime.api.container(rowContainer, {
                        width: cellSize,
                        height: cellSize,
                        flexShrink: 0
                    });
                    continue;
                }
                const entry = state.entriesById[entryId];
                const marked = state.markedIds.has(entryId);
                runtime.api.button(rowContainer, {
                    label: entry.text,
                    variant: marked ? "positive" : "secondary",
                    width: cellSize,
                    height: cellSize,
                    minWidth: cellSize,
                    minHeight: cellSize,
                    textSize: boardSize > 3 ? 18 : 22,
                    flexShrink: 0,
                    onClick: function () {
                        if (!currentPrompt || marked) {
                            return;
                        }
                        if (entryId === currentPrompt.id) {
                            state.markedIds.add(entryId);
                            state.feedback = "";
                            state.currentPromptIndex += 1;
                        } else {
                            state.feedback = "That tile does not match the current prompt.";
                        }
                        runtime.rerender();
                    }
                });
            }
        }
    }

    function createTextRenderer() {
        return {
            createState: function (payload) {
                const sourceText = normalizeAssessmentLineBreaks(decodeDisplayText(payload && payload.content && payload.content.text ? payload.content.text : ""));
                const typeKey = normalizeComparableText(payload && payload.type);
                const mode = typeKey === "highlight" ? "highlight" : "fill-gaps";
                if (mode === "highlight") {
                    return {
                        mode,
                        sourceText,
                        annotations: normalizeTextAnnotations(sourceText, payload && payload.content && payload.content.annotations, "highlight"),
                        selectedIds: new Set()
                    };
                }
                const blanks = normalizeTextAnnotations(sourceText, payload && payload.content && payload.content.annotations, "blank");
                return {
                    mode,
                    sourceText,
                    annotations: blanks,
                    values: Object.fromEntries(blanks.map((annotation) => [annotation.id, ""])),
                    wordBank: createFillGapWordBank(sourceText, blanks),
                    assignmentsByBlank: {},
                    selectedWordId: ""
                };
            },
            render: function (runtime) {
                if (runtime.state.mode === "highlight") {
                    renderHighlight(runtime);
                } else {
                    renderFillGaps(runtime);
                }
            }
        };
    }

    function createFillGapWordBank(sourceText, annotations) {
        const annotationWords = toArray(annotations)
            .map((annotation, index) => {
                const text = decodeDisplayText(annotation.correctValue || annotation.annotationText || "").trim();
                return text ? { id: "fill-gap-word-" + index, text, annotationId: annotation.id || "" } : null;
            })
            .filter(Boolean);
        if (annotationWords.length) {
            return annotationWords;
        }
        return String(sourceText || "").split(/\n\s*\n/)[0].split(",").map((word, index) => ({
            id: "fill-gap-word-" + index,
            text: decodeDisplayText(word).replace(/correct\s+word\s*:/i, "").replace(/_+/g, "").trim()
        })).filter((word) => word.text);
    }

    function assignFillGapWord(state, wordId, blankId) {
        const word = (state.wordBank || []).find((entry) => entry.id === wordId);
        if (!word || !blankId) {
            return;
        }
        Object.keys(state.assignmentsByBlank).forEach((existingBlankId) => {
            if (existingBlankId === blankId || state.assignmentsByBlank[existingBlankId] === wordId) {
                delete state.assignmentsByBlank[existingBlankId];
            }
        });
        state.assignmentsByBlank[blankId] = wordId;
        state.values[blankId] = word.text;
        state.selectedWordId = "";
    }

    function renderFillGaps(runtime) {
        const state = runtime.state;
        if (!state.annotations.length || !state.wordBank.length) {
            renderUnsupported(runtime, "This fill-in-the-gaps assessment is empty.");
            return;
        }
        const filledCount = state.annotations.filter((annotation) => normalizeFreeText(state.values[annotation.id] || "")).length;
        const frame = createFrame(runtime, "Filled " + filledCount + " of " + state.annotations.length + " blanks", {
            label: "Submit",
            disabled: filledCount !== state.annotations.length,
            onClick: function () {
                const blanks = state.annotations.map((annotation, index) => {
                    const enteredValue = state.values[annotation.id] || "";
                    const wordBankAnswer = state.wordBank && state.wordBank[index] ? state.wordBank[index].text : "";
                    const expectedValue = isPlaceholderText(annotation.correctValue)
                        ? (wordBankAnswer || annotation.text)
                        : annotation.correctValue;
                    return {
                        annotationId: annotation.id,
                        expectedValue,
                        enteredValue,
                        isCorrect: normalizeFreeText(enteredValue) === normalizeFreeText(expectedValue)
                    };
                });
                runtime.finish(
                    { blanks, variant: "fill-in-the-gaps" },
                    { isCorrect: blanks.every((blank) => blank.isCorrect === true) }
                );
            }
        });
        addInfo(runtime.api, frame, "Tap a word, then tap the blank where it belongs.");

        const assignedWordIds = new Set(Object.values(state.assignmentsByBlank || {}));
        const availableWords = state.wordBank.filter((word) => !assignedWordIds.has(word.id));
        runtime.api.text(frame.content, {
            text: "Word bank",
            color: "#475569",
            fontSize: 24,
            fontWeight: 600
        });
        addButtonGrid(runtime.api, frame.content, availableWords.map((word) => ({
            label: word.text,
            variant: state.selectedWordId === word.id ? "primary" : "secondary",
            onClick: function () {
                state.selectedWordId = state.selectedWordId === word.id ? "" : word.id;
                runtime.rerender();
            }
        })), {
            columns: 4,
            itemHeight: 58,
            textSize: 20
        });

        runtime.api.text(frame.content, {
            text: "Blanks",
            color: "#475569",
            fontSize: 24,
            fontWeight: 600
        });
        addButtonGrid(runtime.api, frame.content, state.annotations.map((annotation, index) => {
            const assignedWordId = state.assignmentsByBlank[annotation.id] || "";
            const assigned = state.wordBank.find((word) => word.id === assignedWordId);
            return {
                label: assigned ? assigned.text : "Blank " + (index + 1),
                variant: assigned ? "positive" : "secondary",
                onClick: function () {
                    if (!state.selectedWordId) {
                        delete state.assignmentsByBlank[annotation.id];
                        state.values[annotation.id] = "";
                    } else {
                        assignFillGapWord(state, state.selectedWordId, annotation.id);
                    }
                    runtime.rerender();
                }
            };
        }), {
            columns: 2,
            itemHeight: 64,
            textSize: 22
        });
    }

    function renderHighlight(runtime) {
        const state = runtime.state;
        if (!state.annotations.length) {
            renderUnsupported(runtime, "This highlight assessment is empty.");
            return;
        }
        const frame = createFrame(runtime, "Selected " + state.selectedIds.size + " of " + state.annotations.length + " highlights", {
            label: "Finish",
            disabled: state.selectedIds.size !== state.annotations.length,
            onClick: function () {
                const selections = state.annotations.map((annotation) => ({
                    annotationId: annotation.id,
                    text: state.sourceText.slice(annotation.start, annotation.end),
                    selected: state.selectedIds.has(annotation.id),
                    isCorrect: state.selectedIds.has(annotation.id)
                }));
                runtime.finish(
                    { selections, variant: "highlight" },
                    { isCorrect: selections.every((selection) => selection.isCorrect === true) }
                );
            }
        });
        addInfo(runtime.api, frame, "Select every target highlight to finish.");
        addButtonGrid(runtime.api, frame.content, state.annotations.map((annotation) => {
            const selected = state.selectedIds.has(annotation.id);
            return {
                label: state.sourceText.slice(annotation.start, annotation.end),
                variant: selected ? "positive" : "secondary",
                onClick: function () {
                    if (selected) {
                        state.selectedIds.delete(annotation.id);
                    } else {
                        state.selectedIds.add(annotation.id);
                    }
                    runtime.rerender();
                }
            };
        }), {
            columns: 2,
            itemHeight: 64,
            textSize: 22
        });
    }

    function renderUnsupported(runtime, message) {
        const frame = createFrame(runtime, runtime.payload && (runtime.payload.type || runtime.payload.group) || "Assessment", {
            visible: false
        });
        runtime.api.text(frame.content, {
            text: message || "This assessment type is not interactive in VRodos yet.",
            color: "#334155",
            fontSize: 32,
            lineHeight: "125%"
        });
    }

    const VR_RENDERERS = {
        Question: createQuestionRenderer(),
        ImageQuiz: createQuestionRenderer(),
        Pair: createPairRenderer(),
        Grid: createGridRenderer(),
        Text: createTextRenderer()
    };

    function getVrOverlayRuntime() {
        if (window.__vrodosImmerseAssessmentVrRuntime) {
            return window.__vrodosImmerseAssessmentVrRuntime;
        }

        const runtime = makeRuntime();

        runtime.close = function () {
            const spatialUi = window.VRODOSSpatialUI || null;
            if (spatialUi && typeof spatialUi.closePanel === "function") {
                spatialUi.closePanel("assessment-close");
            } else {
                runtime.reset();
            }
        };

        runtime.reset = function () {
            runtime.payload = null;
            runtime.state = null;
            runtime.renderer = null;
            runtime.rendererKey = "";
            runtime.api = null;
            runtime.renderCount = 0;
            runtime.lastOpenDiagnostics = null;
            runtime.pendingPayload = null;
        };

        runtime.finish = function (response, extra) {
            if (!runtime.payload) {
                return;
            }
            runtime.lastResult = buildAssessmentResult(runtime.payload, response, extra);
            runtime.payload.result = runtime.lastResult;
            window.__vrodosLastAssessmentResult = runtime.lastResult;
            const spatialUi = window.VRODOSSpatialUI || null;
            if (spatialUi && typeof spatialUi.closePanel === "function") {
                spatialUi.closePanel("assessment-finish");
            } else {
                runtime.reset();
            }
        };

        runtime.refreshTargets = function () {
            const spatialUi = window.VRODOSSpatialUI || null;
            if (spatialUi && typeof spatialUi.refreshInteractionTargets === "function") {
                spatialUi.refreshInteractionTargets();
                return;
            }
            if (runtime.api && typeof runtime.api.refreshTargets === "function") {
                runtime.api.refreshTargets();
            }
        };

        runtime.rerender = function () {
            if (!runtime.renderer || typeof runtime.renderer.render !== "function") {
                recordVrDiagnostic("warn", "assessment VR renderer unavailable during render", runtime.lastOpenDiagnostics || {});
                renderUnsupported(runtime);
                runtime.refreshTargets();
                return;
            }
            runtime.renderCount += 1;
            recordVrDiagnostic("debug", "rendering assessment VR panel", {
                renderCount: runtime.renderCount,
                group: runtime.payload && runtime.payload.group || "",
                type: runtime.payload && runtime.payload.type || "",
                rendererKey: runtime.rendererKey || ""
            });
            runtime.renderer.render(runtime);
            runtime.refreshTargets();
        };

        runtime.open = function (payload) {
            const overlayApi = getOverlayApi();
            const fallbackBrowsingMode = (typeof window.browsingModeVR !== "undefined" && window.browsingModeVR) ||
                (typeof browsingModeVR !== "undefined" && browsingModeVR);
            const shouldUseVrPanel = overlayApi && typeof overlayApi.shouldUseVrPanel === "function"
                ? overlayApi.shouldUseVrPanel()
                : Boolean(fallbackBrowsingMode);
            if (!shouldUseVrPanel) {
                recordVrDiagnostic("debug", "assessment opened outside immersive XR; desktop DOM overlay remains active", {
                    hasOverlayApi: Boolean(overlayApi),
                    presentationMode: overlayApi && typeof overlayApi.getPresentationMode === "function"
                        ? overlayApi.getPresentationMode()
                        : "unknown"
                });
                return false;
            }

            const spatialUi = getSpatialUiApi();
            if (!spatialUi) {
                runtime.pendingPayload = payload;
                const loadSpatialUiRuntime = overlayApi && (
                    typeof overlayApi.prewarmSpatialUiRuntime === "function"
                        ? overlayApi.prewarmSpatialUiRuntime.bind(overlayApi)
                        : (typeof overlayApi.ensureSpatialUiRuntime === "function"
                            ? overlayApi.ensureSpatialUiRuntime.bind(overlayApi)
                            : null)
                );
                if (loadSpatialUiRuntime && !runtime.spatialUiLoadPending) {
                    runtime.spatialUiLoadPending = true;
                    recordVrDiagnostic("debug", "assessment VR panel is loading spatial UI runtime on demand", {
                        group: payload && payload.group || "",
                        type: payload && payload.type || ""
                    });
                    loadSpatialUiRuntime({ timeoutMs: 8000 }).then((available) => {
                        const pending = runtime.pendingPayload;
                        runtime.spatialUiLoadPending = false;
                        runtime.pendingPayload = null;
                        if (available && pending) {
                            runtime.open(pending);
                        } else if (!available) {
                            recordVrDiagnostic("error", "assessment VR panel could not load spatial UI runtime", {
                                hasSpatialUi: Boolean(window.VRODOSSpatialUI)
                            });
                        }
                    });
                }
                recordVrDiagnostic("warn", "assessment VR panel requested but pmndrs spatial UI is unavailable", {
                    group: payload && payload.group || "",
                    type: payload && payload.type || "",
                    supported: Boolean(payload && payload.supported)
                });
                return true;
            }

            if (typeof spatialUi.closePanel === "function") {
                spatialUi.closePanel("assessment-replace");
            }

            const initialRendererKey = resolveVrRendererKey(payload);
            runtime.payload = normalizeVrPayloadForRenderer(payload, initialRendererKey);
            runtime.rendererKey = resolveVrRendererKey(runtime.payload);
            runtime.renderer = runtime.payload && runtime.rendererKey ? VR_RENDERERS[runtime.rendererKey] : null;
            runtime.state = runtime.renderer && typeof runtime.renderer.createState === "function"
                ? runtime.renderer.createState(runtime.payload)
                : {};
            runtime.lastOpenDiagnostics = Object.assign(getVrAssessmentPayloadDiagnostics(runtime.payload, runtime.rendererKey, runtime.state), {
                usesSpatialUi: true
            });
            window.__vrodosLastAssessmentVrOpenDiagnostics = runtime.lastOpenDiagnostics;
            const payloadDiagnosticMessage = runtime.renderer
                ? (runtime.lastOpenDiagnostics.stateEmpty ? "assessment VR payload normalized as empty" : "assessment VR payload normalized")
                : "assessment VR renderer unavailable";
            recordVrDiagnostic(
                runtime.renderer && !runtime.lastOpenDiagnostics.stateEmpty ? "debug" : "warn",
                payloadDiagnosticMessage,
                runtime.lastOpenDiagnostics
            );

            const panelOptions = {
                id: "vrodos-immerse-assessment-vr-overlay",
                width: PANEL_WIDTH,
                height: PANEL_HEIGHT,
                distance: 1.85,
                verticalOffset: 0,
                centerAtEyeLevel: true,
                anchorRefreshFrames: 2,
                lockInteraction: true,
                trimControllerRays: true,
                showRayHitDot: true,
                blockSceneRaycasts: true,
                cleanup: function () {
                    runtime.reset();
                },
                render: function (api) {
                    runtime.api = api;
                    runtime.rerender();
                }
            };

            runtime.api = spatialUi.openPanel(panelOptions);

            recordVrDiagnostic(runtime.api ? "debug" : "warn", "assessment VR panel open result", Object.assign({}, runtime.lastOpenDiagnostics, {
                opened: Boolean(runtime.api),
                panelApi: runtime.api && runtime.api.__spatialUi ? "spatial-ui" : "unavailable"
            }));

            if (!runtime.api) {
                runtime.reset();
            }
            return Boolean(runtime.api);
        };

        window.__vrodosImmerseAssessmentVrRuntime = runtime;
        return runtime;
    }

    namespace.getVrOverlayRuntime = getVrOverlayRuntime;
    namespace.isQuestionPayload = isQuestionPayload;
    namespace.resolveVrRendererKey = resolveVrRendererKey;
})();
