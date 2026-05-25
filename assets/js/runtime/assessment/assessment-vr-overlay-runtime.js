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

    const PANEL_WIDTH = 2.8;
    const PANEL_HEIGHT = 1.85;

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
            renderer: null
        };
    }

    function getOverlayApi() {
        return window.VRODOSRuntimeOverlay || null;
    }

    function createFrame(runtime, status, primary) {
        const api = runtime.api;
        const payload = runtime.payload || {};
        const bounds = api.drawFrame({
            title: value(payload.title, "Assessment"),
            width: PANEL_WIDTH,
            height: PANEL_HEIGHT,
            onClose: function () {
                runtime.close("close");
            }
        });

        api.addText(api.root, {
            position: bounds.left + " " + (bounds.bottom + 0.02) + " 0.03",
            value: status || "",
            color: "#475569",
            align: "left",
            anchor: "left",
            width: 1.6,
            wrapCount: "34",
            maxLength: 96,
            scale: "0.36 0.36 0.36"
        });

        if (primary && primary.visible !== false) {
            api.addButton(api.root, {
                position: (bounds.right - 0.3) + " " + (bounds.bottom + 0.04) + " 0.03",
                width: 0.56,
                height: 0.17,
                label: primary.label || "Finish",
                disabled: Boolean(primary.disabled),
                color: "#5cc887",
                onClick: primary.onClick
            });
        }

        return {
            left: bounds.left,
            right: bounds.right,
            top: bounds.top,
            bottom: bounds.bottom + 0.22,
            width: bounds.width,
            height: bounds.height - 0.18
        };
    }

    function addInfo(api, bounds, message) {
        api.addPlane(api.root, {
            position: "0 " + bounds.top + " 0.02",
            width: bounds.width,
            height: 0.17,
            material: "shader: flat; color: #e0f2fe; side: double; transparent: false; opacity: 1; depthTest: false; depthWrite: false"
        });
        api.addText(api.root, {
            position: bounds.left + " " + bounds.top + " 0.035",
            value: message,
            color: "#075985",
            align: "left",
            anchor: "left",
            width: bounds.width - 0.1,
            wrapCount: "58",
            maxLength: 160,
            scale: "0.34 0.34 0.34"
        });
    }

    function addButtonGrid(api, items, options) {
        const cfg = options || {};
        const columns = cfg.columns || 2;
        const width = cfg.width || 0.92;
        const height = cfg.height || 0.18;
        const gapX = cfg.gapX || 0.08;
        const gapY = cfg.gapY || 0.06;
        const startX = cfg.startX || -((columns - 1) * (width + gapX)) / 2;
        const startY = cfg.startY || 0;

        items.forEach((item, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            api.addButton(api.root, {
                position: (startX + col * (width + gapX)) + " " + (startY - row * (height + gapY)) + " 0.035",
                width,
                height,
                label: item.label,
                color: item.color || "#ffffff",
                textColor: item.textColor || "#0f172a",
                disabled: item.disabled,
                onClick: item.onClick,
                maxLength: item.maxLength || 80,
                wrapCount: item.wrapCount || "24",
                textScale: item.textScale || "0.35 0.35 0.35"
            });
        });
    }

    function isQuestionPayload(payload) {
        return payload && (payload.group === "Question" || payload.group === "ImageQuiz");
    }

    function createQuestionRenderer() {
        return {
            createState: function (payload) {
                const typeKey = normalizeComparableText(payload && payload.type);
                return {
                    items: normalizeQuestionItems(payload),
                    isImageQuiz: payload && payload.group === "ImageQuiz",
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
                const bounds = createFrame(runtime, "Question " + (state.activeIndex + 1) + " of " + state.items.length, {
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

                runtime.api.addText(runtime.api.root, {
                    position: bounds.left + " " + bounds.top + " 0.03",
                    value: item.prompt || "Question " + (state.activeIndex + 1),
                    color: "#0f172a",
                    align: "left",
                    anchor: "left",
                    width: bounds.width,
                    wrapCount: "48",
                    maxLength: 260,
                    scale: "0.48 0.48 0.48"
                });

                let gridStartY = bounds.top - 0.34;
                if (item.imageUrl) {
                    runtime.api.addImage(runtime.api.root, {
                        position: "0 " + (bounds.top - 0.28) + " 0.025",
                        width: 1.1,
                        height: 0.5,
                        src: item.imageUrl
                    });
                    gridStartY = bounds.top - 0.86;
                }

                addButtonGrid(runtime.api, item.answers.map((answer, index) => {
                    const selected = selectedIndex === index;
                    return {
                        label: answer || "Option " + (index + 1),
                        color: selected ? "#bbf7d0" : "#ffffff",
                        textColor: selected ? "#166534" : "#0f172a",
                        onClick: function () {
                            state.selectedByIndex[state.activeIndex] = index;
                            runtime.rerender();
                        }
                    };
                }), {
                    columns: state.isTrueFalse ? 1 : 2,
                    width: state.isTrueFalse ? 1.8 : 1.22,
                    height: 0.2,
                    startY: gridStartY
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
                    selectedSourceId: ""
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
                const bounds = createFrame(runtime, "Matched " + placed + " of " + state.entries.length + " pairs", {
                    label: "Finish",
                    disabled: placed !== state.entries.length,
                    onClick: function () {
                        finishPair(runtime);
                    }
                });
                addInfo(runtime.api, bounds, "Tap a source, then tap its target. Tap a completed pair to clear it.");

                const topY = bounds.top - 0.25;
                runtime.api.addText(runtime.api.root, {
                    position: (bounds.left + 0.08) + " " + topY + " 0.03",
                    value: "Sources",
                    color: "#334155",
                    align: "left",
                    anchor: "left",
                    width: 1,
                    wrapCount: "20",
                    scale: "0.36 0.36 0.36"
                });
                runtime.api.addText(runtime.api.root, {
                    position: "0.2 " + topY + " 0.03",
                    value: "Targets",
                    color: "#334155",
                    align: "left",
                    anchor: "left",
                    width: 1,
                    wrapCount: "20",
                    scale: "0.36 0.36 0.36"
                });

                const buttonHeight = Math.max(0.115, Math.min(0.17, 0.9 / Math.max(1, state.entries.length)));
                const yStart = topY - 0.16;
                const yStep = buttonHeight + 0.035;

                state.sourceOrder.forEach((sourceId, index) => {
                    const entry = state.entriesById[sourceId];
                    const matchedTargetId = state.matchesBySource[sourceId] || "";
                    const assigned = state.mode === "matching" ? Boolean(matchedTargetId) : Object.values(state.assignmentsByTarget).includes(sourceId);
                    const selected = state.selectedSourceId === sourceId;
                    runtime.api.addButton(runtime.api.root, {
                        position: "-0.68 " + (yStart - index * yStep) + " 0.035",
                        width: 1.18,
                        height: buttonHeight,
                        label: entry ? entry.source || "Source" : "Source",
                        color: assigned ? "#bbf7d0" : (selected ? "#dbeafe" : "#ffffff"),
                        textColor: assigned ? "#166534" : "#0f172a",
                        textScale: "0.28 0.28 0.28",
                        onClick: function () {
                            if (state.mode === "matching" && state.matchesBySource[sourceId]) {
                                delete state.matchesBySource[sourceId];
                            } else {
                                state.selectedSourceId = state.selectedSourceId === sourceId ? "" : sourceId;
                            }
                            runtime.rerender();
                        }
                    });
                });

                state.targetOrder.forEach((targetId, index) => {
                    const entry = state.entriesById[targetId];
                    const sourceId = sourceForTarget(state, targetId);
                    runtime.api.addButton(runtime.api.root, {
                        position: "0.68 " + (yStart - index * yStep) + " 0.035",
                        width: 1.18,
                        height: buttonHeight,
                        label: entry ? entry.target || "Target" : "Target",
                        color: sourceId ? "#bbf7d0" : "#ffffff",
                        textColor: sourceId ? "#166534" : "#0f172a",
                        textScale: "0.28 0.28 0.28",
                        onClick: function () {
                            if (sourceId) {
                                clearTarget(state, targetId);
                            } else if (state.selectedSourceId) {
                                assignPair(state, state.selectedSourceId, targetId);
                            }
                            runtime.rerender();
                        }
                    });
                });
            }
        };
    }

    function sourceForTarget(state, targetId) {
        if (state.mode === "dragdrop") {
            return Object.keys(state.assignmentsByTarget).find((key) => key === targetId && state.assignmentsByTarget[key]) || "";
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
        const bounds = createFrame(runtime, "Found " + state.foundIds.size + " of " + state.puzzle.entries.length + " words", {
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
        addInfo(runtime.api, bounds, "Tap the first and last letter of a hidden word in a straight line.");

        runtime.api.addText(runtime.api.root, {
            position: bounds.left + " " + (bounds.top - 0.2) + " 0.03",
            value: state.puzzle.entries.map((entry) => (state.foundIds.has(entry.id) ? "[x] " : "[ ] ") + entry.text).join("  "),
            color: "#334155",
            align: "left",
            anchor: "left",
            width: bounds.width,
            wrapCount: "64",
            maxLength: 180,
            scale: "0.28 0.28 0.28"
        });

        const size = state.puzzle.size;
        const cellSize = Math.min(0.09, 1.02 / size);
        const boardWidth = size * cellSize;
        const startX = -boardWidth / 2 + cellSize / 2;
        const startY = bounds.top - 0.42;
        const foundCells = new Set();
        state.puzzle.entries.forEach((entry) => {
            if (state.foundIds.has(entry.id)) {
                entry.path.forEach((key) => foundCells.add(key));
            }
        });

        state.puzzle.cells.forEach((row, rowIndex) => {
            row.forEach((letter, colIndex) => {
                const key = rowIndex + ":" + colIndex;
                const selected = state.selectionStart === key;
                runtime.api.addButton(runtime.api.root, {
                    position: (startX + colIndex * cellSize) + " " + (startY - rowIndex * cellSize) + " 0.04",
                    width: cellSize * 0.9,
                    height: cellSize * 0.9,
                    label: letter,
                    color: foundCells.has(key) ? "#bbf7d0" : (selected ? "#dbeafe" : "#ffffff"),
                    textColor: foundCells.has(key) ? "#166534" : "#0f172a",
                    textScale: "0.22 0.22 0.22",
                    wrapCount: "2",
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
        const bounds = createFrame(runtime, "Completed " + state.markedIds.size + " of " + state.entries.length + " prompts", {
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

        runtime.api.addText(runtime.api.root, {
            position: bounds.left + " " + bounds.top + " 0.03",
            value: currentPrompt ? "Prompt: " + (currentPrompt.hint || currentPrompt.text) : "All prompts completed.",
            color: currentPrompt ? "#1d4ed8" : "#166534",
            align: "left",
            anchor: "left",
            width: bounds.width,
            wrapCount: "54",
            maxLength: 180,
            scale: "0.42 0.42 0.42"
        });
        if (state.feedback) {
            runtime.api.addText(runtime.api.root, {
                position: bounds.left + " " + (bounds.top - 0.2) + " 0.03",
                value: state.feedback,
                color: "#dc2626",
                align: "left",
                anchor: "left",
                width: bounds.width,
                wrapCount: "54",
                maxLength: 120,
                scale: "0.32 0.32 0.32"
            });
        }

        const boardSize = Math.ceil(Math.sqrt(state.entries.length));
        const slots = state.boardOrder.concat(Array.from({ length: boardSize * boardSize - state.entries.length }, () => ""));
        const cellSize = Math.min(0.38, 1.08 / boardSize);
        const startX = -(boardSize - 1) * cellSize / 2;
        const startY = bounds.top - 0.42;
        slots.forEach((entryId, index) => {
            if (!entryId) {
                return;
            }
            const entry = state.entriesById[entryId];
            const row = Math.floor(index / boardSize);
            const col = index % boardSize;
            const marked = state.markedIds.has(entryId);
            runtime.api.addButton(runtime.api.root, {
                position: (startX + col * cellSize) + " " + (startY - row * cellSize) + " 0.04",
                width: cellSize * 0.9,
                height: cellSize * 0.9,
                label: entry.text,
                color: marked ? "#bbf7d0" : "#ffffff",
                textColor: marked ? "#166534" : "#0f172a",
                textScale: "0.27 0.27 0.27",
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
        });
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
        const bounds = createFrame(runtime, "Filled " + filledCount + " of " + state.annotations.length + " blanks", {
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
        addInfo(runtime.api, bounds, "Tap a word, then tap the blank where it belongs.");

        const assignedWordIds = new Set(Object.values(state.assignmentsByBlank || {}));
        const availableWords = state.wordBank.filter((word) => !assignedWordIds.has(word.id));
        addButtonGrid(runtime.api, availableWords.map((word) => ({
            label: word.text,
            color: state.selectedWordId === word.id ? "#dbeafe" : "#ffffff",
            onClick: function () {
                state.selectedWordId = state.selectedWordId === word.id ? "" : word.id;
                runtime.rerender();
            }
        })), {
            columns: 4,
            width: 0.58,
            height: 0.15,
            startY: bounds.top - 0.25,
            textScale: "0.25 0.25 0.25"
        });

        state.annotations.forEach((annotation, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const assignedWordId = state.assignmentsByBlank[annotation.id] || "";
            const assigned = state.wordBank.find((word) => word.id === assignedWordId);
            runtime.api.addButton(runtime.api.root, {
                position: (-0.62 + col * 1.24) + " " + (bounds.top - 0.62 - row * 0.22) + " 0.04",
                width: 1.1,
                height: 0.17,
                label: assigned ? assigned.text : "Blank " + (index + 1),
                color: assigned ? "#bbf7d0" : "#f1f5f9",
                textColor: assigned ? "#166534" : "#475569",
                onClick: function () {
                    if (!state.selectedWordId) {
                        delete state.assignmentsByBlank[annotation.id];
                        state.values[annotation.id] = "";
                    } else {
                        assignFillGapWord(state, state.selectedWordId, annotation.id);
                    }
                    runtime.rerender();
                }
            });
        });
    }

    function renderHighlight(runtime) {
        const state = runtime.state;
        if (!state.annotations.length) {
            renderUnsupported(runtime, "This highlight assessment is empty.");
            return;
        }
        const bounds = createFrame(runtime, "Selected " + state.selectedIds.size + " of " + state.annotations.length + " highlights", {
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
        addInfo(runtime.api, bounds, "Select every target highlight to finish.");
        addButtonGrid(runtime.api, state.annotations.map((annotation) => {
            const selected = state.selectedIds.has(annotation.id);
            return {
                label: state.sourceText.slice(annotation.start, annotation.end),
                color: selected ? "#bbf7d0" : "#fef3c7",
                textColor: selected ? "#166534" : "#92400e",
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
            width: 1.2,
            height: 0.17,
            startY: bounds.top - 0.28
        });
    }

    function renderUnsupported(runtime, message) {
        const bounds = createFrame(runtime, runtime.payload && (runtime.payload.type || runtime.payload.group) || "Assessment", {
            visible: false
        });
        runtime.api.addText(runtime.api.root, {
            position: bounds.left + " " + (bounds.top - 0.08) + " 0.03",
            value: message || "This assessment type is not interactive in VRodos yet.",
            color: "#334155",
            align: "left",
            anchor: "left",
            width: bounds.width,
            wrapCount: "46",
            maxLength: 240,
            scale: "0.48 0.48 0.48"
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
            const overlayApi = getOverlayApi();
            if (overlayApi) {
                overlayApi.closeActivePanel("assessment-close");
            }
            runtime.reset();
        };

        runtime.reset = function () {
            runtime.payload = null;
            runtime.state = null;
            runtime.renderer = null;
            runtime.api = null;
        };

        runtime.finish = function (response, extra) {
            if (!runtime.payload) {
                return;
            }
            runtime.lastResult = buildAssessmentResult(runtime.payload, response, extra);
            runtime.payload.result = runtime.lastResult;
            window.__vrodosLastAssessmentResult = runtime.lastResult;
            const overlayApi = getOverlayApi();
            if (overlayApi) {
                overlayApi.closeActivePanel("assessment-finish");
            }
            runtime.reset();
        };

        runtime.refreshTargets = function () {
            if (runtime.api && typeof runtime.api.refreshTargets === "function") {
                runtime.api.refreshTargets();
                return;
            }
            const overlayApi = getOverlayApi();
            if (overlayApi && typeof overlayApi.refreshRaycasters === "function") {
                overlayApi.refreshRaycasters();
            }
        };

        runtime.rerender = function () {
            if (!runtime.renderer || typeof runtime.renderer.render !== "function") {
                renderUnsupported(runtime);
                runtime.refreshTargets();
                return;
            }
            runtime.renderer.render(runtime);
            runtime.refreshTargets();
        };

        runtime.open = function (payload) {
            const overlayApi = getOverlayApi();
            if (!overlayApi || !overlayApi.shouldUseVrPanel()) {
                return false;
            }

            runtime.payload = payload;
            runtime.renderer = payload && payload.supported ? VR_RENDERERS[payload.group] : null;
            runtime.state = runtime.renderer && typeof runtime.renderer.createState === "function"
                ? runtime.renderer.createState(payload)
                : {};

            runtime.api = overlayApi.openVrPanel({
                id: "vrodos-immerse-assessment-vr-overlay",
                width: PANEL_WIDTH,
                height: PANEL_HEIGHT,
                distance: 3.15,
                verticalOffset: -0.08,
                lockInteraction: false,
                retargetRaycasters: false,
                cleanup: function () {
                    runtime.reset();
                },
                render: function (api) {
                    runtime.api = api;
                    runtime.rerender();
                }
            });

            return Boolean(runtime.api);
        };

        window.__vrodosImmerseAssessmentVrRuntime = runtime;
        return runtime;
    }

    namespace.getVrOverlayRuntime = getVrOverlayRuntime;
    namespace.isQuestionPayload = isQuestionPayload;
})();
