(function () {
    "use strict";

    const namespace = window.VRodosImmerseAssessment = window.VRodosImmerseAssessment || {};
    const decodeDisplayText = namespace.decodeDisplayText;
    const escapeHtml = namespace.escapeHtml;
    const normalizeComparableText = namespace.normalizeComparableText;
    const normalizeWordSearchText = namespace.normalizeWordSearchText;
    const normalizeFreeText = namespace.normalizeFreeText;
    const isPlaceholderText = namespace.isPlaceholderText;
    const toArray = namespace.toArray;
    const uniqueId = namespace.uniqueId;
    const shuffleArray = namespace.shuffleArray;
    const arrayEquals = namespace.arrayEquals;
    const normalizeAssessmentLineBreaks = namespace.normalizeAssessmentLineBreaks;
    const normalizeQuestionItems = namespace.normalizeQuestionItems;
    const normalizePairEntries = namespace.normalizePairEntries;
    const normalizeGridEntries = namespace.normalizeGridEntries;
    const normalizeTextAnnotations = namespace.normalizeTextAnnotations;

    function renderEmptyState(runtime, title, description) {
        runtime.body.innerHTML = [
            '<div style="padding:18px;border-radius:18px;background:#ffffff;border:1px solid rgba(226,232,240,0.95);box-shadow:0 12px 30px rgba(15,23,42,0.06);">',
            `<div style="font-size:18px;font-weight:800;margin-bottom:10px;color:#0f172a;">${escapeHtml(title)}</div>`,
            `<div style="font-size:14px;line-height:1.6;color:#64748b;">${escapeHtml(description)}</div>`,
            "</div>"
        ].join("");
        runtime.setStatus(runtime.payload && (runtime.payload.type || runtime.payload.group) || "Assessment");
        runtime.configurePrimaryAction({ visible: false });
    }

    function renderInfoCallout(message) {
        return [
            '<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:16px;background:#f0f7ff;border:1px solid rgba(59,130,246,0.15);color:#1e40af;font-size:14px;line-height:1.5;">',
            '<div style="flex-shrink:0;margin-top:1px;color:#3b82f6;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></div>',
            `<div>${escapeHtml(message)}</div>`,
            "</div>"
        ].join("");
    }

    function createQuestionRenderer() {
        return {
            createState(payload) {
                return {
                    items: normalizeQuestionItems(payload),
                    activeIndex: 0,
                    selectedByIndex: []
                };
            },
            render(runtime) {
                const state = runtime.state;
                const items = state.items;
                const question = items[state.activeIndex];
                if (!question) {
                    renderEmptyState(runtime, "This assessment is empty.", "Add at least one question in Immerse to make it playable in VRodos.");
                    return;
                }

                if (!question.answers.length) {
                    renderEmptyState(runtime, "This question has no answers.", "Add answer options in Immerse to make this assessment playable in VRodos.");
                    return;
                }

                const selectedIndex = Number.isInteger(state.selectedByIndex[state.activeIndex])
                    ? state.selectedByIndex[state.activeIndex]
                    : null;

                runtime.body.innerHTML = [
                    question.imageUrl
                        ? `<div style="margin-bottom:16px;"><img src="${escapeHtml(question.imageUrl)}" alt="" style="width:100%;max-height:280px;object-fit:contain;border-radius:18px;background:#f8fafc;border:1px solid rgba(226,232,240,0.95);" /></div>`
                        : "",
                    `<div style="font-size:20px;font-weight:800;line-height:1.35;margin-bottom:18px;color:#0f172a;">${escapeHtml(question.prompt || `Question ${state.activeIndex + 1}`)}</div>`,
                    '<div style="display:grid;gap:12px;">',
                    question.answers.map((answer, index) => {
                        const isSelected = selectedIndex === index;
                        const background = isSelected ? "rgba(92, 200, 135, 0.14)" : "#ffffff";
                        const border = isSelected ? "rgba(92, 200, 135, 0.9)" : "rgba(203, 213, 225, 0.95)";
                        const color = isSelected ? "#166534" : "#1e293b";

                        return [
                            `<button type="button" data-answer-index="${index}"`,
                            ' style="text-align:left;border-radius:16px;padding:14px 16px;border:1px solid ' + border + ';',
                            ' background:' + background + ';color:' + color + ';cursor:pointer;font-size:15px;font-weight:700;box-shadow:0 8px 18px rgba(15,23,42,0.04);">',
                            `${escapeHtml(answer || `Option ${index + 1}`)}`,
                            "</button>"
                        ].join("");
                    }).join(""),
                    "</div>"
                ].join("");

                runtime.body.querySelectorAll("[data-answer-index]").forEach((button) => {
                    button.addEventListener("click", () => {
                        state.selectedByIndex[state.activeIndex] = Number(button.getAttribute("data-answer-index"));
                        runtime.rerender();
                    });
                });

                runtime.setStatus(`Question ${state.activeIndex + 1} of ${items.length}`);
                runtime.configurePrimaryAction({
                    visible: true,
                    label: state.activeIndex >= items.length - 1 ? "Finish" : "Next",
                    disabled: selectedIndex === null
                });
            },
            onPrimaryAction(runtime) {
                const state = runtime.state;
                const items = state.items;
                const currentQuestion = items[state.activeIndex];
                if (!currentQuestion) {
                    return;
                }

                const selectedIndex = Number.isInteger(state.selectedByIndex[state.activeIndex])
                    ? state.selectedByIndex[state.activeIndex]
                    : null;
                if (selectedIndex === null) {
                    return;
                }

                if (state.activeIndex >= items.length - 1) {
                    const answers = items.map((question, index) => {
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
                    return;
                }

                state.activeIndex += 1;
                runtime.rerender();
            }
        };
    }

    function findSourceByAssignedTarget(matchesBySource, targetId) {
        return Object.keys(matchesBySource).find((sourceId) => matchesBySource[sourceId] === targetId) || "";
    }

    function assignMatchingPair(state, sourceId, targetId) {
        Object.keys(state.matchesBySource).forEach((existingSourceId) => {
            if (existingSourceId === sourceId || state.matchesBySource[existingSourceId] === targetId) {
                delete state.matchesBySource[existingSourceId];
            }
        });

        state.matchesBySource[sourceId] = targetId;
        state.selectedSourceId = "";
        state.selectedTargetId = "";
    }

    function assignDragDropPair(state, sourceId, targetId) {
        Object.keys(state.assignmentsByTarget).forEach((existingTargetId) => {
            if (existingTargetId === targetId || state.assignmentsByTarget[existingTargetId] === sourceId) {
                delete state.assignmentsByTarget[existingTargetId];
            }
        });

        state.assignmentsByTarget[targetId] = sourceId;
        state.selectedSourceId = "";
        state.dragSourceId = "";
    }

    function createPairRenderer() {
        return {
            createState(payload) {
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
                    selectedTargetId: "",
                    dragSourceId: ""
                };
            },
            render(runtime) {
                const state = runtime.state;
                if (!state.entries.length) {
                    renderEmptyState(runtime, "This assessment is empty.", "Add at least one pair in Immerse to make it playable in VRodos.");
                    return;
                }

                if (state.mode === "dragdrop") {
                    renderDragDropPair(runtime);
                    return;
                }

                renderMatchingPair(runtime);
            },
            onPrimaryAction(runtime) {
                const state = runtime.state;
                const entries = state.entries;
                if (state.mode === "dragdrop") {
                    if (Object.keys(state.assignmentsByTarget).length !== entries.length) {
                        return;
                    }

                    const placements = entries.map((entry) => {
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

                if (Object.keys(state.matchesBySource).length !== entries.length) {
                    return;
                }

                const matches = entries.map((entry) => {
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
        };
    }

    function renderMatchingPair(runtime) {
        const state = runtime.state;
        const matchedCount = Object.keys(state.matchesBySource).length;

        runtime.body.innerHTML = [
            '<div style="display:grid;gap:20px;">',
            renderInfoCallout("Select one source and one target to lock a pair. You can clear any existing pair before finishing."),
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">',
            '<div style="padding:18px;border-radius:18px;background:#ffffff;border:1px solid rgba(226,232,240,0.95);">',
            '<div style="font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:12px;">Sources</div>',
            '<div style="display:grid;gap:10px;">',
            state.sourceOrder.map((sourceId) => {
                const entry = state.entriesById[sourceId];
                const matchedTargetId = state.matchesBySource[sourceId] || "";
                const matchedTarget = matchedTargetId ? state.entriesById[matchedTargetId] : null;
                const isSelected = state.selectedSourceId === sourceId;
                return [
                    `<div style="border-radius:16px;border:1px solid ${isSelected ? "rgba(92,200,135,0.9)" : "rgba(203,213,225,0.95)"};padding:12px;background:${isSelected ? "rgba(92,200,135,0.12)" : "#ffffff"};">`,
                    `<button type="button" data-match-source-id="${escapeHtml(sourceId)}" style="width:100%;text-align:left;border:0;background:transparent;padding:0;cursor:pointer;font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(entry.source || "Untitled source")}</button>`,
                    matchedTarget
                        ? `<div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;"><span style="font-size:12px;color:#166534;font-weight:700;">Matched with ${escapeHtml(matchedTarget.target || "target")}</span><button type="button" data-unmatch-source-id="${escapeHtml(sourceId)}" style="border:0;background:transparent;color:#dc2626;font-size:12px;font-weight:700;cursor:pointer;">Clear</button></div>`
                        : '<div style="margin-top:8px;font-size:12px;color:#94a3b8;">Not matched yet</div>',
                    "</div>"
                ].join("");
            }).join(""),
            "</div>",
            "</div>",
            '<div style="padding:18px;border-radius:18px;background:#ffffff;border:1px solid rgba(226,232,240,0.95);">',
            '<div style="font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:12px;">Targets</div>',
            '<div style="display:grid;gap:10px;">',
            state.targetOrder.map((targetId) => {
                const entry = state.entriesById[targetId];
                const assignedSourceId = findSourceByAssignedTarget(state.matchesBySource, targetId);
                const assignedSource = assignedSourceId ? state.entriesById[assignedSourceId] : null;
                const isSelected = state.selectedTargetId === targetId;
                return [
                    `<div style="border-radius:16px;border:1px solid ${isSelected ? "rgba(59,130,246,0.9)" : "rgba(203,213,225,0.95)"};padding:12px;background:${isSelected ? "rgba(59,130,246,0.10)" : "#ffffff"};">`,
                    `<button type="button" data-match-target-id="${escapeHtml(targetId)}" style="width:100%;text-align:left;border:0;background:transparent;padding:0;cursor:pointer;font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(entry.target || "Untitled target")}</button>`,
                    assignedSource
                        ? `<div style="margin-top:8px;font-size:12px;color:#166534;font-weight:700;">Linked to ${escapeHtml(assignedSource.source || "source")}</div>`
                        : '<div style="margin-top:8px;font-size:12px;color:#94a3b8;">Waiting for a source</div>',
                    "</div>"
                ].join("");
            }).join(""),
            "</div>",
            "</div>",
            "</div>",
            "</div>"
        ].join("");

        runtime.body.querySelectorAll("[data-match-source-id]").forEach((button) => {
            button.addEventListener("click", () => {
                const sourceId = button.getAttribute("data-match-source-id") || "";
                state.selectedSourceId = state.selectedSourceId === sourceId ? "" : sourceId;
                if (state.selectedSourceId && state.selectedTargetId) {
                    assignMatchingPair(state, state.selectedSourceId, state.selectedTargetId);
                }
                runtime.rerender();
            });
        });

        runtime.body.querySelectorAll("[data-match-target-id]").forEach((button) => {
            button.addEventListener("click", () => {
                const targetId = button.getAttribute("data-match-target-id") || "";
                state.selectedTargetId = state.selectedTargetId === targetId ? "" : targetId;
                if (state.selectedSourceId && state.selectedTargetId) {
                    assignMatchingPair(state, state.selectedSourceId, state.selectedTargetId);
                }
                runtime.rerender();
            });
        });

        runtime.body.querySelectorAll("[data-unmatch-source-id]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                const sourceId = button.getAttribute("data-unmatch-source-id") || "";
                delete state.matchesBySource[sourceId];
                if (state.selectedSourceId === sourceId) {
                    state.selectedSourceId = "";
                }
                runtime.rerender();
            });
        });

        runtime.setStatus(`Matched ${matchedCount} of ${state.entries.length} pairs`);
        runtime.configurePrimaryAction({
            visible: true,
            label: "Finish",
            disabled: matchedCount !== state.entries.length
        });
    }

    function renderDragDropPair(runtime) {
        const state = runtime.state;
        const assignedSourceIds = new Set(Object.values(state.assignmentsByTarget));
        const availableSourceIds = state.sourceOrder.filter((sourceId) => !assignedSourceIds.has(sourceId));
        const placedCount = Object.keys(state.assignmentsByTarget).length;

        runtime.body.innerHTML = [
            '<div style="display:grid;gap:20px;">',
            renderInfoCallout("Drag each source chip onto the correct target. You can also tap a source and then tap a target if drag and drop is unavailable."),
            '<div style="padding:18px;border-radius:18px;background:#ffffff;border:1px solid rgba(226,232,240,0.95);">',
            '<div style="font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:12px;">Source Bank</div>',
            '<div style="display:flex;flex-wrap:wrap;gap:10px;">',
            availableSourceIds.length
                ? availableSourceIds.map((sourceId) => {
                    const entry = state.entriesById[sourceId];
                    const isSelected = state.selectedSourceId === sourceId;
                    return `<button type="button" draggable="true" data-drag-source-id="${escapeHtml(sourceId)}" style="border-radius:999px;padding:10px 14px;border:1px solid ${isSelected ? "rgba(92,200,135,0.9)" : "rgba(203,213,225,0.95)"};background:${isSelected ? "rgba(92,200,135,0.14)" : "#ffffff"};cursor:grab;font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(entry.source || "Source")}</button>`;
                }).join("")
                : '<div style="font-size:14px;color:#166534;font-weight:700;">All sources are placed.</div>',
            "</div>",
            "</div>",
            '<div style="display:grid;gap:12px;">',
            state.targetOrder.map((targetId) => {
                const entry = state.entriesById[targetId];
                const assignedSourceId = state.assignmentsByTarget[targetId] || "";
                const assignedSource = assignedSourceId ? state.entriesById[assignedSourceId] : null;
                return [
                    `<div data-drop-target-id="${escapeHtml(targetId)}" style="border-radius:18px;border:1px dashed ${assignedSource ? "rgba(92,200,135,0.9)" : "rgba(148,163,184,0.6)"};padding:14px 16px;background:${assignedSource ? "rgba(92,200,135,0.10)" : "rgba(248,250,252,0.95)"};">`,
                    `<div style="font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">Target</div>`,
                    `<div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:10px;">${escapeHtml(entry.target || "Target")}</div>`,
                    assignedSource
                        ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;"><span style="display:inline-flex;align-items:center;border-radius:999px;padding:9px 12px;background:#ffffff;border:1px solid rgba(92,200,135,0.9);font-size:13px;font-weight:700;color:#166534;">${escapeHtml(assignedSource.source || "Source")}</span><button type="button" data-clear-target-id="${escapeHtml(targetId)}" style="border:0;background:transparent;color:#dc2626;font-size:12px;font-weight:700;cursor:pointer;">Clear</button></div>`
                        : '<div style="font-size:13px;color:#94a3b8;">Drop a source here</div>',
                    "</div>"
                ].join("");
            }).join(""),
            "</div>",
            "</div>"
        ].join("");

        runtime.body.querySelectorAll("[data-drag-source-id]").forEach((button) => {
            button.addEventListener("click", () => {
                const sourceId = button.getAttribute("data-drag-source-id") || "";
                state.selectedSourceId = state.selectedSourceId === sourceId ? "" : sourceId;
                runtime.rerender();
            });

            button.addEventListener("dragstart", (event) => {
                const sourceId = button.getAttribute("data-drag-source-id") || "";
                state.dragSourceId = sourceId;
                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", sourceId);
                }
            });

            button.addEventListener("dragend", () => {
                state.dragSourceId = "";
            });
        });

        runtime.body.querySelectorAll("[data-drop-target-id]").forEach((panel) => {
            panel.addEventListener("dragover", (event) => {
                event.preventDefault();
            });

            panel.addEventListener("drop", (event) => {
                event.preventDefault();
                const targetId = panel.getAttribute("data-drop-target-id") || "";
                const sourceId = state.dragSourceId
                    || (event.dataTransfer ? event.dataTransfer.getData("text/plain") : "")
                    || state.selectedSourceId;
                if (!sourceId || !targetId) {
                    return;
                }
                assignDragDropPair(state, sourceId, targetId);
                runtime.rerender();
            });

            panel.addEventListener("click", () => {
                const targetId = panel.getAttribute("data-drop-target-id") || "";
                if (!state.selectedSourceId || !targetId) {
                    return;
                }
                assignDragDropPair(state, state.selectedSourceId, targetId);
                runtime.rerender();
            });
        });

        runtime.body.querySelectorAll("[data-clear-target-id]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                const targetId = button.getAttribute("data-clear-target-id") || "";
                delete state.assignmentsByTarget[targetId];
                runtime.rerender();
            });
        });

        runtime.setStatus(`Placed ${placedCount} of ${state.entries.length} items`);
        runtime.configurePrimaryAction({
            visible: true,
            label: "Finish",
            disabled: placedCount !== state.entries.length
        });
    }

    const WORD_SEARCH_DIRECTIONS = [
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: -1 },
        { row: 0, col: -1 },
        { row: -1, col: 0 },
        { row: -1, col: -1 },
        { row: -1, col: 1 }
    ];

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getAxisRange(size, delta, length) {
        if (delta > 0) {
            return [0, size - length];
        }
        if (delta < 0) {
            return [length - 1, size - 1];
        }
        return [0, size - 1];
    }

    function createEmptyGrid(size) {
        return Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
    }

    function buildWordSearchPuzzle(entries) {
        if (!entries.length) {
            return null;
        }

        const longestWord = entries.reduce((maxLength, entry) => Math.max(maxLength, entry.normalized.length), 0);
        const totalLetters = entries.reduce((count, entry) => count + entry.normalized.length, 0);
        const minSize = Math.max(8, longestWord, Math.ceil(Math.sqrt(totalLetters * 1.4)));
        const maxSize = Math.max(14, longestWord);
        const placementOrder = entries.slice().sort((left, right) => right.normalized.length - left.normalized.length);

        for (let size = minSize; size <= maxSize; size += 1) {
            for (let attempt = 0; attempt < 18; attempt += 1) {
                const cells = createEmptyGrid(size);
                const placements = {};
                let failed = false;

                for (const entry of placementOrder) {
                    const directions = shuffleArray(WORD_SEARCH_DIRECTIONS);
                    let placed = false;

                    for (const direction of directions) {
                        const [rowMin, rowMax] = getAxisRange(size, direction.row, entry.normalized.length);
                        const [colMin, colMax] = getAxisRange(size, direction.col, entry.normalized.length);

                        for (let tries = 0; tries < 80; tries += 1) {
                            const row = randomInt(rowMin, rowMax);
                            const col = randomInt(colMin, colMax);
                            let canPlace = true;

                            for (let letterIndex = 0; letterIndex < entry.normalized.length; letterIndex += 1) {
                                const cellRow = row + direction.row * letterIndex;
                                const cellCol = col + direction.col * letterIndex;
                                const existingLetter = cells[cellRow][cellCol];
                                const nextLetter = entry.normalized[letterIndex];
                                if (existingLetter && existingLetter !== nextLetter) {
                                    canPlace = false;
                                    break;
                                }
                            }

                            if (!canPlace) {
                                continue;
                            }

                            const path = [];
                            for (let letterIndex = 0; letterIndex < entry.normalized.length; letterIndex += 1) {
                                const cellRow = row + direction.row * letterIndex;
                                const cellCol = col + direction.col * letterIndex;
                                const nextLetter = entry.normalized[letterIndex];
                                cells[cellRow][cellCol] = nextLetter;
                                path.push(`${cellRow}:${cellCol}`);
                            }

                            placements[entry.id] = path;
                            placed = true;
                            break;
                        }

                        if (placed) {
                            break;
                        }
                    }

                    if (!placed) {
                        failed = true;
                        break;
                    }
                }

                if (failed) {
                    continue;
                }

                for (let row = 0; row < size; row += 1) {
                    for (let col = 0; col < size; col += 1) {
                        if (!cells[row][col]) {
                            cells[row][col] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                        }
                    }
                }

                return {
                    size,
                    cells,
                    entries: entries.map((entry) => ({
                        id: entry.id,
                        text: entry.text,
                        hint: entry.hint,
                        normalized: entry.normalized,
                        path: placements[entry.id] || []
                    }))
                };
            }
        }

        return null;
    }

    function getWordSearchPath(start, end, size) {
        const deltaRow = end.row - start.row;
        const deltaCol = end.col - start.col;
        const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
        const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);
        const straightLine = deltaRow === 0 || deltaCol === 0 || Math.abs(deltaRow) === Math.abs(deltaCol);

        if (!straightLine) {
            return [`${start.row}:${start.col}`];
        }

        const length = Math.max(Math.abs(deltaRow), Math.abs(deltaCol)) + 1;
        const keys = [];
        for (let index = 0; index < length; index += 1) {
            const row = start.row + stepRow * index;
            const col = start.col + stepCol * index;
            if (row < 0 || row >= size || col < 0 || col >= size) {
                return [`${start.row}:${start.col}`];
            }
            keys.push(`${row}:${col}`);
        }

        return keys;
    }

    function collectFoundWordSearchCells(entries, foundIds) {
        const cells = new Set();
        entries.forEach((entry) => {
            if (!foundIds.has(entry.id)) {
                return;
            }
            entry.path.forEach((key) => cells.add(key));
        });
        return cells;
    }

    function paintWordSearchBoard(runtime) {
        const state = runtime.state;
        const foundCellKeys = collectFoundWordSearchCells(state.puzzle.entries, state.foundIds);
        const selectedKeys = new Set(state.selectionKeys);
        runtime.body.querySelectorAll("[data-wordsearch-cell]").forEach((button) => {
            const key = button.getAttribute("data-wordsearch-cell") || "";
            let background = "#ffffff";
            let borderColor = "rgba(203,213,225,0.95)";
            let color = "#0f172a";

            if (foundCellKeys.has(key)) {
                background = "rgba(92,200,135,0.18)";
                borderColor = "rgba(92,200,135,0.95)";
                color = "#166534";
            } else if (selectedKeys.has(key)) {
                background = "rgba(59,130,246,0.16)";
                borderColor = "rgba(59,130,246,0.85)";
                color = "#1d4ed8";
            }

            button.style.background = background;
            button.style.borderColor = borderColor;
            button.style.color = color;
        });
    }

    function finalizeWordSearchSelection(runtime) {
        const state = runtime.state;
        if (!state || state.mode !== "wordsearch" || !state.isSelecting) {
            return;
        }

        state.isSelecting = false;
        const selection = state.selectionKeys.slice();
        const matchedEntry = state.puzzle.entries.find((entry) =>
            !state.foundIds.has(entry.id)
            && (arrayEquals(selection, entry.path) || arrayEquals(selection, entry.path.slice().reverse()))
        );

        if (matchedEntry) {
            state.foundIds.add(matchedEntry.id);
        }

        state.selectionStart = null;
        state.selectionKeys = [];
        runtime.rerender();
    }

    function createGridRenderer() {
        return {
            createState(payload, runtime) {
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

                const puzzle = buildWordSearchPuzzle(entries);
                const state = {
                    mode,
                    entries,
                    puzzle,
                    foundIds: new Set(),
                    selectionStart: null,
                    selectionKeys: [],
                    isSelecting: false,
                    cleanup: null
                };

                const pointerUpHandler = () => finalizeWordSearchSelection(runtime);
                document.addEventListener("pointerup", pointerUpHandler);
                document.addEventListener("pointercancel", pointerUpHandler);
                state.cleanup = () => {
                    document.removeEventListener("pointerup", pointerUpHandler);
                    document.removeEventListener("pointercancel", pointerUpHandler);
                };

                return state;
            },
            render(runtime) {
                const state = runtime.state;
                if (!state.entries.length) {
                    renderEmptyState(runtime, "This assessment is empty.", "Add at least one word in Immerse to make it playable in VRodos.");
                    return;
                }

                if (state.mode === "bingo") {
                    renderVocabularyBingo(runtime);
                    return;
                }

                renderWordSearch(runtime);
            },
            onPrimaryAction(runtime) {
                const state = runtime.state;
                if (state.mode === "bingo") {
                    if (state.markedIds.size !== state.entries.length) {
                        return;
                    }

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
                    return;
                }

                if (!state.puzzle || state.foundIds.size !== state.puzzle.entries.length) {
                    return;
                }

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
        };
    }

    function renderWordSearch(runtime) {
        const state = runtime.state;
        const puzzle = state.puzzle;
        if (!puzzle) {
            renderEmptyState(runtime, "This word search could not be built.", "Try shorter words or remove punctuation-heavy items in Immerse, then compile again.");
            return;
        }

        runtime.body.innerHTML = [
            '<div style="display:grid;gap:18px;">',
            renderInfoCallout("Drag across letters in a straight line to find each hidden word. Words can appear forwards, backwards, vertically, horizontally, or diagonally."),
            '<div style="display:flex;flex-wrap:wrap;gap:8px;">',
            puzzle.entries.map((entry) => {
                const found = state.foundIds.has(entry.id);
                return `<span style="display:inline-flex;align-items:center;border-radius:999px;padding:8px 12px;border:1px solid ${found ? "rgba(92,200,135,0.9)" : "rgba(203,213,225,0.95)"};background:${found ? "rgba(92,200,135,0.14)" : "#ffffff"};color:${found ? "#166534" : "#334155"};font-size:13px;font-weight:700;">${escapeHtml(entry.text)}</span>`;
            }).join(""),
            "</div>",
            `<div style="display:grid;grid-template-columns:repeat(${puzzle.size}, minmax(0, 1fr));gap:6px;max-width:min(100%, 640px);">`,
            puzzle.cells.map((row, rowIndex) =>
                row.map((letter, colIndex) =>
                    `<button type="button" data-wordsearch-cell="${rowIndex}:${colIndex}" style="aspect-ratio:1 / 1;border-radius:12px;border:1px solid rgba(203,213,225,0.95);background:#ffffff;font-size:15px;font-weight:800;color:#0f172a;cursor:pointer;user-select:none;">${escapeHtml(letter)}</button>`
                ).join("")
            ).join(""),
            "</div>",
            "</div>"
        ].join("");

        runtime.body.querySelectorAll("[data-wordsearch-cell]").forEach((button) => {
            button.addEventListener("pointerdown", (event) => {
                event.preventDefault();
                const key = button.getAttribute("data-wordsearch-cell") || "";
                const [row, col] = key.split(":").map((value) => Number(value));
                state.isSelecting = true;
                state.selectionStart = { row, col };
                state.selectionKeys = [key];
                paintWordSearchBoard(runtime);
            });

            button.addEventListener("pointerenter", () => {
                if (!state.isSelecting || !state.selectionStart) {
                    return;
                }
                const key = button.getAttribute("data-wordsearch-cell") || "";
                const [row, col] = key.split(":").map((value) => Number(value));
                state.selectionKeys = getWordSearchPath(state.selectionStart, { row, col }, puzzle.size);
                paintWordSearchBoard(runtime);
            });
        });

        paintWordSearchBoard(runtime);
        runtime.setStatus(`Found ${state.foundIds.size} of ${puzzle.entries.length} words`);
        runtime.configurePrimaryAction({
            visible: true,
            label: "Finish",
            disabled: state.foundIds.size !== puzzle.entries.length
        });
    }

    function renderVocabularyBingo(runtime) {
        const state = runtime.state;
        const total = state.entries.length;
        const boardSize = Math.ceil(Math.sqrt(total));
        const boardSlots = state.boardOrder.concat(Array.from({ length: boardSize * boardSize - total }, () => ""));
        const currentPromptId = state.promptOrder[state.currentPromptIndex] || "";
        const currentPrompt = currentPromptId ? state.entriesById[currentPromptId] : null;

        runtime.body.innerHTML = [
            '<div style="display:grid;gap:18px;">',
            currentPrompt
                ? `<div style="padding:18px;border-radius:18px;background:rgba(59,130,246,0.08);border:1px solid rgba(147,197,253,0.5);"><div style="font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#1d4ed8;margin-bottom:8px;">Current prompt</div><div style="font-size:20px;font-weight:800;color:#0f172a;margin-bottom:6px;">${escapeHtml(currentPrompt.hint || currentPrompt.text)}</div><div style="font-size:13px;color:#64748b;">Mark the matching word on the board.</div></div>`
                : '<div style="padding:18px;border-radius:18px;background:rgba(92,200,135,0.12);border:1px solid rgba(92,200,135,0.45);font-size:15px;font-weight:700;color:#166534;">All prompts completed. Review the board and finish.</div>',
            state.feedback
                ? `<div style="font-size:13px;font-weight:700;color:#dc2626;">${escapeHtml(state.feedback)}</div>`
                : "",
            `<div style="display:grid;grid-template-columns:repeat(${boardSize}, minmax(0, 1fr));gap:10px;">`,
            boardSlots.map((entryId) => {
                if (!entryId) {
                    return '<div style="aspect-ratio:1 / 1;border-radius:16px;background:rgba(226,232,240,0.55);border:1px dashed rgba(203,213,225,0.95);"></div>';
                }

                const entry = state.entriesById[entryId];
                const marked = state.markedIds.has(entryId);
                return `<button type="button" data-bingo-word-id="${escapeHtml(entryId)}" style="aspect-ratio:1 / 1;border-radius:16px;border:1px solid ${marked ? "rgba(92,200,135,0.95)" : "rgba(203,213,225,0.95)"};background:${marked ? "rgba(92,200,135,0.16)" : "#ffffff"};padding:12px;font-size:14px;font-weight:700;color:${marked ? "#166534" : "#0f172a"};cursor:${marked ? "default" : "pointer"};">${escapeHtml(entry.text)}</button>`;
            }).join(""),
            "</div>",
            "</div>"
        ].join("");

        runtime.body.querySelectorAll("[data-bingo-word-id]").forEach((button) => {
            button.addEventListener("click", () => {
                const wordId = button.getAttribute("data-bingo-word-id") || "";
                if (!wordId || state.markedIds.has(wordId) || !currentPrompt) {
                    return;
                }

                if (wordId === currentPrompt.id) {
                    state.markedIds.add(wordId);
                    state.feedback = "";
                    if (state.currentPromptIndex < state.promptOrder.length) {
                        state.currentPromptIndex += 1;
                    }
                } else {
                    state.feedback = "That does not match the current prompt. Try again.";
                }

                runtime.rerender();
            });
        });

        runtime.setStatus(`Completed ${state.markedIds.size} of ${state.entries.length} prompts`);
        runtime.configurePrimaryAction({
            visible: true,
            label: "Finish",
            disabled: state.markedIds.size !== state.entries.length
        });
    }

    function buildTextSegments(text, annotations) {
        const sourceText = String(text || "");
        const segments = [];
        let cursor = 0;

        annotations.forEach((annotation) => {
            if (cursor < annotation.start) {
                segments.push({ type: "text", text: sourceText.slice(cursor, annotation.start) });
            }

            segments.push({
                type: annotation.type,
                id: annotation.id,
                text: sourceText.slice(annotation.start, annotation.end),
                correctValue: annotation.correctValue
            });
            cursor = annotation.end;
        });

        if (cursor < sourceText.length) {
            segments.push({ type: "text", text: sourceText.slice(cursor) });
        }

        return segments;
    }

    function formatFillGapTextSegment(value) {
        return escapeHtml(
            String(value || "")
                .replace(/(^|[\s.,;:!?])n(?=_)/g, "$1")
                .replace(/(^|[\s.,;:!?])n(?=[α-ωάέήίόύώϊϋΐΰΑ-ΩΆΈΉΊΌΎΏ])/g, "$1")
                .replace(/_+/g, "")
        ).replace(/\n/g, "<br />");
    }

    function extractFillGapWordBank(sourceText) {
        const text = String(sourceText || "");
        const firstBlock = text.split(/\n\s*\n/)[0] || "";
        const markerMatch = firstBlock.match(/correct\s+word\s*:/i);
        const wordListText = markerMatch ? firstBlock.slice(markerMatch.index + markerMatch[0].length) : firstBlock;

        return wordListText
            .split(",")
            .map((word) => decodeDisplayText(word).replace(/_+/g, "").trim())
            .filter(Boolean)
            .map((word, index) => ({
                id: `fill-gap-word-${index}`,
                text: word
            }));
    }

    function createFillGapWordBank(sourceText, annotations) {
        const annotationWords = toArray(annotations)
            .map((annotation, index) => {
                const text = decodeDisplayText(
                    annotation && annotation.correctValue
                        ? annotation.correctValue
                        : (annotation && annotation.annotationText ? annotation.annotationText : "")
                ).trim();

                return text
                    ? {
                        id: `fill-gap-word-${index}`,
                        text,
                        annotationId: annotation.id || ""
                    }
                    : null;
            })
            .filter(Boolean);

        return annotationWords.length ? annotationWords : extractFillGapWordBank(sourceText);
    }

    function stripFillGapWordBankIntro(value) {
        const text = String(value || "");
        const firstBlock = text.split(/\n\s*\n/)[0] || "";
        if (!/correct\s+word\s*:/i.test(firstBlock)) {
            return text;
        }

        return text.replace(/^[\s\S]*?\n\s*\n/, "");
    }

    function assignFillGapWord(state, wordId, blankId) {
        const word = state.wordsById[wordId];
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
        state.dragWordId = "";
    }

    function createTextRenderer() {
        return {
            createState(payload) {
                const sourceText = normalizeAssessmentLineBreaks(decodeDisplayText(payload && payload.content && payload.content.text ? payload.content.text : ""));
                const typeKey = normalizeComparableText(payload && payload.type);
                const mode = typeKey === "highlight" ? "highlight" : "fill-gaps";
                if (mode === "highlight") {
                    const highlights = normalizeTextAnnotations(sourceText, payload && payload.content && payload.content.annotations, "highlight");
                    return {
                        mode,
                        sourceText,
                        annotations: highlights,
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
                    selectedWordId: "",
                    dragWordId: ""
                };
            },
            render(runtime) {
                if (runtime.state.mode === "highlight") {
                    renderHighlightText(runtime);
                    return;
                }
                renderFillGapsText(runtime);
            },
            onPrimaryAction(runtime) {
                const state = runtime.state;
                if (state.mode === "highlight") {
                    if (state.selectedIds.size !== state.annotations.length) {
                        return;
                    }

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
                    return;
                }

                const blanks = state.annotations.map((annotation, index) => {
                    const enteredValue = state.values[annotation.id] || "";
                    const wordBankAnswer = state.wordBank && state.wordBank[index] ? state.wordBank[index].text : "";
                    const expectedValue = isPlaceholderText(annotation.correctValue)
                        ? (wordBankAnswer || annotation.text)
                        : annotation.correctValue;
                    const isCorrect = normalizeFreeText(enteredValue) === normalizeFreeText(expectedValue);
                    return {
                        annotationId: annotation.id,
                        expectedValue,
                        enteredValue,
                        isCorrect
                    };
                });

                runtime.finish(
                    { blanks, variant: "fill-in-the-gaps" },
                    { isCorrect: blanks.every((blank) => blank.isCorrect === true) }
                );
            }
        };
    }

    function updateFillGapControls(runtime) {
        const state = runtime.state;
        const filledCount = state.annotations.filter((annotation) => normalizeFreeText(state.values[annotation.id] || "")).length;
        runtime.setStatus(`Filled ${filledCount} of ${state.annotations.length} blanks`);
        runtime.configurePrimaryAction({
            visible: true,
            label: "Submit",
            disabled: filledCount !== state.annotations.length
        });
    }

    function renderFillGapsText(runtime) {
        const state = runtime.state;
        if (!state.annotations.length || !state.sourceText) {
            renderEmptyState(runtime, "This assessment is empty.", "Add text and at least one blank annotation in Immerse to make it playable in VRodos.");
            return;
        }

        const segments = buildTextSegments(state.sourceText, state.annotations);
        const wordsById = Object.fromEntries((state.wordBank || []).map((word) => [word.id, word]));
        state.wordsById = wordsById;
        const assignedWordIds = new Set(Object.values(state.assignmentsByBlank || {}));
        const availableWords = (state.wordBank || []).filter((word) => !assignedWordIds.has(word.id));
        let textSegmentIndex = 0;

        runtime.body.innerHTML = [
            '<div style="display:grid;gap:18px;">',
            renderInfoCallout("Drag each word into a blank. You can also tap a word and then tap a blank."),
            '<div style="padding:18px;border-radius:18px;background:#ffffff;border:1px solid rgba(226,232,240,0.95);box-shadow:0 1px 3px rgba(0,0,0,0.02);">',
            '<div style="font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:12px;">Word Bank</div>',
            '<div style="display:flex;flex-wrap:wrap;gap:10px;">',
            availableWords.length
                ? availableWords.map((word) => {
                    const isSelected = state.selectedWordId === word.id;
                    return `<button type="button" draggable="true" data-fill-gap-word-id="${escapeHtml(word.id)}" style="border-radius:999px;padding:10px 16px;border:1px solid ${isSelected ? "rgba(59,130,246,0.8)" : "rgba(226,232,240,0.9)"};background:${isSelected ? "rgba(59,130,246,0.08)" : "#ffffff"};box-shadow:0 2px 5px rgba(15,23,42,0.04);cursor:grab;font-size:14px;font-weight:700;color:${isSelected ? "#1d4ed8" : "#334155"};transition:all 0.15s ease;">${escapeHtml(word.text)}</button>`;
                }).join("")
                : '<div style="font-size:14px;color:#10b981;font-weight:700;display:flex;align-items:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg> All words are placed.</div>',
            "</div>",
            "</div>",
            '<div style="padding:26px;border-radius:20px;background:#ffffff;border:1px solid rgba(226,232,240,0.95);font-family:\'Outfit\', -apple-system, sans-serif;font-size:20px;line-height:2.4;color:#1e293b;white-space:pre-wrap;box-shadow:0 4px 20px rgba(15,23,42,0.02);">',
            segments.map((segment) => {
                if (segment.type !== "blank") {
                    const displayText = textSegmentIndex === 0 ? stripFillGapWordBankIntro(segment.text) : segment.text;
                    textSegmentIndex += 1;
                    return formatFillGapTextSegment(displayText);
                }

                const assignedWordId = state.assignmentsByBlank[segment.id] || "";
                const assignedWord = assignedWordId ? wordsById[assignedWordId] : null;
                return [
                    `<span role="button" tabindex="0" data-fill-gap-blank-id="${escapeHtml(segment.id)}" style="display:inline-flex;align-items:center;justify-content:center;${assignedWord ? "min-width:14ch;" : "width:14ch;"}max-width:calc(100% - 8px);min-height:2.25em;margin:0 4px;padding:2px 10px;border-radius:12px;border:2px ${assignedWord ? "solid" : "dashed"} ${assignedWord ? "rgba(16,185,129,0.8)" : "rgba(203,213,225,1)"};background:${assignedWord ? "rgba(16,185,129,0.06)" : "#f1f5f9"};font:inherit;color:${assignedWord ? "#065f46" : "#64748b"};vertical-align:middle;cursor:pointer;box-sizing:border-box;transition:all 0.2s ease;box-shadow:${assignedWord ? "inset 0 2px 4px rgba(0,0,0,0.02)" : "none"};">`,
                    assignedWord ? `<span style="display:block;min-width:0;white-space:normal;text-align:center;line-height:1.2;font-weight:700;">${escapeHtml(assignedWord.text)}</span><button type="button" data-clear-blank-id="${escapeHtml(segment.id)}" aria-label="Clear answer" title="Clear answer" style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;margin-left:8px;flex:0 0 auto;border:0;border-radius:999px;background:rgba(244,63,94,0.1);color:#e11d48;cursor:pointer;transition:background 0.2s ease;"><svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>` : "",
                    "</span>"
                ].join("");
            }).join(""),
            "</div>",
            "</div>"
        ].join("");

        runtime.body.querySelectorAll("[data-fill-gap-word-id]").forEach((button) => {
            button.addEventListener("click", () => {
                const wordId = button.getAttribute("data-fill-gap-word-id") || "";
                state.selectedWordId = state.selectedWordId === wordId ? "" : wordId;
                runtime.rerender();
            });

            button.addEventListener("dragstart", (event) => {
                const wordId = button.getAttribute("data-fill-gap-word-id") || "";
                state.dragWordId = wordId;
                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", wordId);
                }
            });

            button.addEventListener("dragend", () => {
                state.dragWordId = "";
            });
        });

        runtime.body.querySelectorAll("[data-fill-gap-blank-id]").forEach((slot) => {
            slot.addEventListener("dragover", (event) => {
                event.preventDefault();
            });

            slot.addEventListener("drop", (event) => {
                event.preventDefault();
                const blankId = slot.getAttribute("data-fill-gap-blank-id") || "";
                const wordId = state.dragWordId
                    || (event.dataTransfer ? event.dataTransfer.getData("text/plain") : "")
                    || state.selectedWordId;
                assignFillGapWord(state, wordId, blankId);
                runtime.rerender();
            });

            slot.addEventListener("click", () => {
                const blankId = slot.getAttribute("data-fill-gap-blank-id") || "";
                if (!state.selectedWordId) {
                    return;
                }
                assignFillGapWord(state, state.selectedWordId, blankId);
                runtime.rerender();
            });
        });

        runtime.body.querySelectorAll("[data-clear-blank-id]").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                const blankId = button.getAttribute("data-clear-blank-id") || "";
                const wordId = state.assignmentsByBlank[blankId] || "";
                delete state.assignmentsByBlank[blankId];
                state.values[blankId] = "";
                if (state.selectedWordId === wordId) {
                    state.selectedWordId = "";
                }
                runtime.rerender();
            });
        });

        updateFillGapControls(runtime);
    }

    function renderHighlightText(runtime) {
        const state = runtime.state;
        if (!state.annotations.length || !state.sourceText) {
            renderEmptyState(runtime, "This assessment is empty.", "Add text and at least one highlight annotation in Immerse to make it playable in VRodos.");
            return;
        }

        const segments = buildTextSegments(state.sourceText, state.annotations);
        runtime.body.innerHTML = [
            '<div style="display:grid;gap:18px;">',
            '<div style="padding:16px 18px;border-radius:18px;background:rgba(59,130,246,0.08);color:#1d4ed8;font-size:14px;line-height:1.6;">Select every highlighted target in the passage to finish.</div>',
            '<div style="padding:20px;border-radius:18px;background:#ffffff;border:1px solid rgba(226,232,240,0.95);font-family:Georgia,\'Times New Roman\',serif;font-size:18px;line-height:1.9;color:#0f172a;white-space:pre-wrap;">',
            segments.map((segment) => {
                if (segment.type !== "highlight") {
                    return escapeHtml(segment.text).replace(/\n/g, "<br />");
                }

                const selected = state.selectedIds.has(segment.id);
                return `<span role="button" tabindex="0" data-highlight-id="${escapeHtml(segment.id)}" style="display:inline;border-radius:8px;padding:0 3px;background:${selected ? "rgba(92,200,135,0.18)" : "rgba(250,204,21,0.24)"};border-bottom:2px solid ${selected ? "rgba(92,200,135,0.95)" : "rgba(234,179,8,0.95)"};cursor:pointer;">${escapeHtml(segment.text)}</span>`;
            }).join(""),
            "</div>",
            "</div>"
        ].join("");

        runtime.body.querySelectorAll("[data-highlight-id]").forEach((button) => {
            button.addEventListener("click", () => {
                const annotationId = button.getAttribute("data-highlight-id") || "";
                if (state.selectedIds.has(annotationId)) {
                    state.selectedIds.delete(annotationId);
                } else {
                    state.selectedIds.add(annotationId);
                }
                runtime.rerender();
            });
        });

        runtime.setStatus(`Selected ${state.selectedIds.size} of ${state.annotations.length} highlights`);
        runtime.configurePrimaryAction({
            visible: true,
            label: "Finish",
            disabled: state.selectedIds.size !== state.annotations.length
        });
    }

    const ASSESSMENT_RENDERERS = {
        Question: createQuestionRenderer(),
        ImageQuiz: createQuestionRenderer(),
        Pair: createPairRenderer(),
        Grid: createGridRenderer(),
        Text: createTextRenderer()
    };

    function resolveRenderer(payload) {
        if (!payload || !payload.supported) {
            return null;
        }

        return ASSESSMENT_RENDERERS[payload.group] || null;
    }



    namespace.renderEmptyState = renderEmptyState;
    namespace.resolveRenderer = resolveRenderer;
    namespace.ASSESSMENT_RENDERERS = ASSESSMENT_RENDERERS;
})();
