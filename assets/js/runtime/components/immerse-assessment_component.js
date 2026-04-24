(function () {
    "use strict";

    const CEFR_LEVELS = ["A1", "A2", "B1", "B2"];

    function decodeDisplayText(value) {
        let text = typeof value === "string" ? value : "";
        if (!text) {
            return "";
        }

        if (/%[0-9a-fA-F]{2}/.test(text)) {
            try {
                text = decodeURIComponent(text);
            } catch (error) {
                // Keep original text if URL decoding fails.
            }
        }

        for (let i = 0; i < 3 && /(?:\\\\u|\\u|u)[0-9a-fA-F]{4}/.test(text); i += 1) {
            const decoded = text.replace(/(?:\\\\u|\\u|u)([0-9a-fA-F]{4})/g, (_, hex) =>
                String.fromCharCode(parseInt(hex, 16))
            );

            if (!decoded || decoded === text) {
                break;
            }

            text = decoded;
        }

        return text;
    }

    function normalizeAssessmentLineBreaks(value) {
        return String(value || "")
            .replace(/\r\n?/g, "\n")
            .replace(/([.!?;:])nn(?=\S)/g, "$1\n\n")
            .replace(/(:)n(?=\S)/g, "$1\n")
            .replace(/([.!?;:])n(?=\s*[Α-ΩΆΈΉΊΌΎΏ])/g, "$1\n")
            .replace(/([.!?;:])n(?=\s*(?:\d+\.|[A-ZΑ-ΩΆΈΉΊΌΎΏ]))/g, "$1\n")
            .replace(/([^A-Za-z])nn(?=\S)/g, "$1\n\n")
            .replace(/ntn(?=[Α-ΩΆΈΉΊΌΎΏ])/g, "\n\n")
            .replace(/([^\s])nn(?=[Α-ΩΆΈΉΊΌΎΏ])/g, "$1\n\n")
            .replace(/([^\s])n(?=\d+\.)/g, "$1\n");
    }

    function normalizeLevel(value) {
        if (value && typeof value === "object") {
            return "";
        }

        const normalized = String(value || "").trim().toUpperCase();
        return CEFR_LEVELS.includes(normalized) ? normalized : "";
    }

    function normalizeLevels(values) {
        if (!Array.isArray(values)) {
            return [];
        }

        return Array.from(
            new Set(
                values
                    .map((value) => normalizeLevel(value))
                    .filter(Boolean)
            )
        );
    }

    function decodeBase64Json(value, fallback) {
        if (!value) {
            return fallback;
        }

        try {
            const binary = window.atob(value);
            const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
            const json = new TextDecoder("utf-8").decode(bytes);
            const parsed = JSON.parse(json);
            return parsed ?? fallback;
        } catch (error) {
            console.warn("Could not decode assessment payload.", error);
            return fallback;
        }
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getElementLevels(element) {
        const assessmentLevels = element.getAttribute("data-assessment-levels");
        const genericLevels = element.getAttribute("data-immerse-cefr-levels");

        if (assessmentLevels) {
            return normalizeLevels(decodeBase64Json(assessmentLevels, []));
        }

        return normalizeLevels(decodeBase64Json(genericLevels, []));
    }

    function setCefrControlledVisible(element, isVisible) {
        element.setAttribute("visible", isVisible ? "true" : "false");

        if (!element.dataset.immerseRaycastableOriginal) {
            element.dataset.immerseRaycastableOriginal = element.classList.contains("raycastable") ? "true" : "false";
        }

        if (isVisible) {
            if (element.dataset.immerseRaycastableOriginal === "true") {
                element.classList.add("raycastable");
            }
        } else {
            element.classList.remove("raycastable");
        }
    }

    function getCefrRuntime() {
        if (window.__vrodosImmerseCefrRuntime) {
            return window.__vrodosImmerseCefrRuntime;
        }

        const runtime = {
            elements: [],
            selectedLevel: "",
            selectedButton: null,
            root: null,
            continueButton: null,
            initialized: false,
            promptScheduled: false
        };

        runtime.register = function (element) {
            if (!element || runtime.elements.includes(element)) {
                return;
            }

            runtime.elements.push(element);
            element.removeAttribute("data-vrodos-delayed-reveal");
            setCefrControlledVisible(element, false);
            runtime.schedulePrompt();
        };

        runtime.matchesLevel = function (element, level) {
            const levels = getElementLevels(element);
            if (!level) {
                return false;
            }

            if (!levels.length) {
                return true;
            }

            return levels.includes(level);
        };

        runtime.applyLevel = function (level) {
            const normalizedLevel = normalizeLevel(level);
            runtime.selectedLevel = normalizedLevel;
            if (!normalizedLevel) {
                return;
            }

            runtime.elements.forEach((element) => {
                setCefrControlledVisible(element, runtime.matchesLevel(element, normalizedLevel));
            });
        };

        runtime.ensureUi = function () {
            if (runtime.initialized) {
                return;
            }

            const root = document.createElement("div");
            root.id = "vrodos-immerse-cefr-overlay";
            root.style.position = "fixed";
            root.style.inset = "0";
            root.style.zIndex = "2147481500";
            root.style.display = "none";
            root.style.alignItems = "center";
            root.style.justifyContent = "center";
            root.style.padding = "24px";
            root.style.background = "rgba(148, 163, 184, 0.34)";
            root.style.backdropFilter = "blur(12px)";

            const panel = document.createElement("div");
            panel.style.width = "min(560px, 100%)";
            panel.style.borderRadius = "24px";
            panel.style.background = "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)";
            panel.style.border = "1px solid rgba(203, 213, 225, 0.9)";
            panel.style.boxShadow = "0 28px 80px rgba(15, 23, 42, 0.18)";
            panel.style.padding = "26px";
            panel.style.color = "#1e293b";
            panel.style.fontFamily = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

            panel.innerHTML = [
                '<div style="font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#3b82f6;margin-bottom:8px;">CEFR Level</div>',
                '<div style="font-size:28px;font-weight:800;line-height:1.15;color:#0f172a;margin-bottom:18px;">Choose your level</div>'
            ].join("");

            const buttonRow = document.createElement("div");
            buttonRow.style.display = "grid";
            buttonRow.style.gridTemplateColumns = "repeat(4, minmax(0, 1fr))";
            buttonRow.style.gap = "12px";
            buttonRow.style.marginBottom = "18px";

            const buttons = {};
            CEFR_LEVELS.forEach((level) => {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = level;
                button.dataset.cefrLevel = level;
                button.style.border = "1px solid rgba(203, 213, 225, 0.95)";
                button.style.background = "#ffffff";
                button.style.color = "#1e293b";
                button.style.borderRadius = "16px";
                button.style.padding = "16px 12px";
                button.style.fontSize = "18px";
                button.style.fontWeight = "800";
                button.style.cursor = "pointer";
                button.style.boxShadow = "0 8px 18px rgba(15,23,42,0.04)";
                button.style.transition = "transform 120ms ease, border-color 120ms ease, background 120ms ease";
                button.addEventListener("click", () => {
                    runtime.selectLevel(level);
                });
                buttonRow.appendChild(button);
                buttons[level] = button;
            });

            const footer = document.createElement("div");
            footer.style.display = "flex";
            footer.style.justifyContent = "space-between";
            footer.style.alignItems = "center";
            footer.style.gap = "12px";

            const continueButton = document.createElement("button");
            continueButton.type = "button";
            continueButton.textContent = "Start experience";
            continueButton.style.border = "0";
            continueButton.style.borderRadius = "999px";
            continueButton.style.padding = "12px 18px";
            continueButton.style.fontWeight = "800";
            continueButton.style.cursor = "pointer";
            continueButton.style.background = "#5cc887";
            continueButton.style.color = "#ffffff";
            continueButton.style.opacity = "0.55";
            continueButton.style.pointerEvents = "none";
            continueButton.addEventListener("click", () => {
                if (!runtime.selectedLevel) {
                    return;
                }

                runtime.applyLevel(runtime.selectedLevel);
                runtime.hidePrompt();
            });

            footer.appendChild(continueButton);
            panel.appendChild(buttonRow);
            panel.appendChild(footer);
            root.appendChild(panel);
            document.body.appendChild(root);

            runtime.root = root;
            runtime.levelButtons = buttons;
            runtime.continueButton = continueButton;
            runtime.initialized = true;

            runtime.selectLevel(runtime.selectedLevel || "");
        };

        runtime.selectLevel = function (level) {
            runtime.selectedLevel = normalizeLevel(level);

            Object.entries(runtime.levelButtons || {}).forEach(([buttonLevel, button]) => {
                const isActive = buttonLevel === runtime.selectedLevel;
                button.style.background = isActive ? "rgba(92, 200, 135, 0.14)" : "#ffffff";
                button.style.color = isActive ? "#166534" : "#1e293b";
                button.style.borderColor = isActive ? "rgba(92, 200, 135, 0.9)" : "rgba(203, 213, 225, 0.95)";
                button.style.transform = isActive ? "translateY(-1px)" : "translateY(0)";
            });

            if (runtime.continueButton) {
                const enabled = Boolean(runtime.selectedLevel);
                runtime.continueButton.style.opacity = enabled ? "1" : "0.55";
                runtime.continueButton.style.pointerEvents = enabled ? "auto" : "none";
            }
        };

        runtime.showPrompt = function () {
            runtime.ensureUi();
            runtime.root.style.display = "flex";
            runtime.selectLevel(runtime.selectedLevel || "");
        };

        runtime.hidePrompt = function () {
            if (runtime.root) {
                runtime.root.style.display = "none";
            }
        };

        runtime.schedulePrompt = function () {
            if (runtime.promptScheduled) {
                return;
            }

            runtime.promptScheduled = true;

            const waitForSceneReady = () => {
                const scene = document.querySelector("a-scene");
                const loaderOverlay = document.getElementById("vrodos-scene-loader-overlay");

                if (!scene || !scene.hasLoaded || loaderOverlay) {
                    window.setTimeout(waitForSceneReady, 180);
                    return;
                }

                runtime.showPrompt();
            };

            waitForSceneReady();
        };

        window.__vrodosImmerseCefrRuntime = runtime;
        return runtime;
    }

    function normalizeComparableText(value) {
        return decodeDisplayText(value)
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    function normalizeWordSearchText(value) {
        return decodeDisplayText(value)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");
    }

    function normalizeFreeText(value) {
        return decodeDisplayText(value)
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    function isPlaceholderText(value) {
        return !normalizeFreeText(String(value || "").replace(/_+/g, ""));
    }

    function toArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function uniqueId(prefix, index) {
        return `${prefix}-${index + 1}`;
    }

    function shuffleArray(values) {
        const copy = values.slice();
        for (let index = copy.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            const temp = copy[index];
            copy[index] = copy[swapIndex];
            copy[swapIndex] = temp;
        }
        return copy;
    }

    function arrayEquals(left, right) {
        if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
            return false;
        }

        for (let index = 0; index < left.length; index += 1) {
            if (left[index] !== right[index]) {
                return false;
            }
        }

        return true;
    }

    function getAnswerTexts(question) {
        if (!question || typeof question !== "object") {
            return [];
        }

        if (Array.isArray(question.answers)) {
            return question.answers.map((item) => decodeDisplayText(item && typeof item === "object" ? item.text : item));
        }

        if (Array.isArray(question.options)) {
            return question.options.map((item) => decodeDisplayText(item && typeof item === "object" ? item.text : item));
        }

        return [];
    }

    function getCorrectIndex(question) {
        const correctIndex = Number(question && question.correctIndex);
        return Number.isInteger(correctIndex) && correctIndex >= 0 ? correctIndex : null;
    }

    function normalizeQuestionItems(payload) {
        return toArray(payload && payload.content && payload.content.questions)
            .map((question, index) => ({
                id: question && question.id ? String(question.id) : uniqueId("question", index),
                prompt: decodeDisplayText(question && question.question ? question.question : ""),
                answers: getAnswerTexts(question),
                correctIndex: getCorrectIndex(question),
                imageUrl: question && question.imageUrl ? String(question.imageUrl) : ""
            }))
            .filter((question) => question.prompt || question.answers.length || question.imageUrl);
    }

    function normalizePairEntries(payload) {
        return toArray(payload && payload.content && payload.content.pairs)
            .map((pair, index) => ({
                id: pair && pair.id ? String(pair.id) : uniqueId("pair", index),
                source: decodeDisplayText(pair && pair.source ? pair.source : ""),
                target: decodeDisplayText(pair && pair.target ? pair.target : "")
            }))
            .filter((pair) => pair.source || pair.target);
    }

    function normalizeGridEntries(payload) {
        return toArray(payload && payload.content && payload.content.words)
            .map((word, index) => {
                const text = decodeDisplayText(word && word.text ? word.text : "");
                const hint = decodeDisplayText(word && word.hint ? word.hint : "");
                return {
                    id: word && word.id ? String(word.id) : uniqueId("word", index),
                    text,
                    hint,
                    normalized: normalizeWordSearchText(text)
                };
            })
            .filter((word) => word.text && word.normalized);
    }

    function normalizeTextAnnotations(text, annotations, type) {
        const textLength = String(text || "").length;
        const ordered = toArray(annotations)
            .map((annotation, index) => {
                const start = Number(annotation && annotation.start);
                const end = Number(annotation && annotation.end);
                const annotationText = decodeDisplayText(annotation && annotation.text ? annotation.text : "");
                const correctValue = decodeDisplayText(
                    annotation && annotation.correctValue
                        ? annotation.correctValue
                        : (annotation && annotation.value ? annotation.value : annotationText)
                );

                return {
                    id: annotation && annotation.id ? String(annotation.id) : uniqueId(type || "annotation", index),
                    start,
                    end,
                    type: annotation && annotation.type ? String(annotation.type) : "",
                    correctValue,
                    annotationText
                };
            })
            .filter((annotation) =>
                annotation.type === type
                && Number.isFinite(annotation.start)
                && Number.isFinite(annotation.end)
                && annotation.start >= 0
                && annotation.end > annotation.start
                && annotation.end <= textLength
            )
            .sort((left, right) => left.start - right.start || left.end - right.end);

        const normalized = [];
        let cursor = -1;
        ordered.forEach((annotation) => {
            if (annotation.start < cursor) {
                return;
            }
            normalized.push(Object.assign({}, annotation, {
                correctValue: annotation.correctValue || String(text || "").slice(annotation.start, annotation.end)
            }));
            cursor = annotation.end;
        });

        return normalized;
    }

    function buildAssessmentResult(payload, response, extra) {
        return Object.assign({
            completedAt: new Date().toISOString(),
            title: payload && payload.title ? payload.title : "",
            type: payload && payload.type ? payload.type : "",
            group: payload && payload.group ? payload.group : "",
            levels: Array.isArray(payload && payload.levels) ? payload.levels.slice() : [],
            completionState: "completed",
            response: response || {}
        }, extra || {});
    }

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
            '<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:16px;background:#f0f7ff;border:1px solid rgba(59,130,246,0.15);color:#1e40af;font-size:14px;line-height:1.5;">' +
            '<div style="flex-shrink:0;margin-top:1px;color:#3b82f6;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></div>' +
            '<div>Select one source and one target to lock a pair. You can clear any existing pair before finishing.</div>' +
            '</div>',
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
            '<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:16px;background:#f0f7ff;border:1px solid rgba(59,130,246,0.15);color:#1e40af;font-size:14px;line-height:1.5;">' +
            '<div style="flex-shrink:0;margin-top:1px;color:#3b82f6;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></div>' +
            '<div>Drag each source chip onto the correct target. You can also tap a source and then tap a target if drag and drop is unavailable.</div>' +
            '</div>',
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
            '<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:16px;background:#f0f7ff;border:1px solid rgba(59,130,246,0.15);color:#1e40af;font-size:14px;line-height:1.5;">' +
            '<div style="flex-shrink:0;margin-top:1px;color:#3b82f6;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></div>' +
            '<div>Drag across letters in a straight line to find each hidden word. Words can appear forwards, backwards, vertically, horizontally, or diagonally.</div>' +
            '</div>',
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
            '<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:16px;background:#f0f7ff;border:1px solid rgba(59,130,246,0.15);color:#1e40af;font-size:14px;line-height:1.5;">' +
            '<div style="flex-shrink:0;margin-top:1px;color:#3b82f6;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></div>' +
            '<div>Drag each word into a blank. You can also tap a word and then tap a blank.</div>' +
            '</div>',
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

    function getOverlayRuntimeV2() {
        if (window.__vrodosImmerseAssessmentRuntime) {
            return window.__vrodosImmerseAssessmentRuntime;
        }

        const runtime = {
            lastResult: null,
            payload: null,
            renderer: null,
            state: null,
            root: null,
            body: null,
            nextButton: null,
            dismissButton: null,
            status: null,
            title: null,
            kicker: null
        };

        const root = document.createElement("div");
        root.id = "vrodos-immerse-assessment-overlay";
        root.style.position = "fixed";
        root.style.inset = "0";
        root.style.zIndex = "2147482000";
        root.style.display = "none";
        root.style.alignItems = "center";
        root.style.justifyContent = "center";
        root.style.padding = "24px";
        root.style.background = "rgba(148, 163, 184, 0.34)";
        root.style.backdropFilter = "blur(12px)";
        root.style.fontFamily = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

        const panel = document.createElement("div");
        panel.style.width = "min(720px, 100%)";
        panel.style.maxHeight = "min(84vh, 860px)";
        panel.style.overflow = "auto";
        panel.style.borderRadius = "22px";
        panel.style.background = "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)";
        panel.style.color = "#1e293b";
        panel.style.border = "1px solid rgba(203, 213, 225, 0.9)";
        panel.style.boxShadow = "0 28px 80px rgba(15, 23, 42, 0.18)";

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "flex-start";
        header.style.gap = "16px";
        header.style.padding = "20px 22px 14px";
        header.style.borderBottom = "1px solid rgba(226, 232, 240, 0.9)";

        const titleWrap = document.createElement("div");
        titleWrap.innerHTML = [
            '<div id="vrodos-immerse-assessment-kicker" style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#3b82f6;margin-bottom:6px;"></div>',
            '<div id="vrodos-immerse-assessment-title" style="font-size:24px;font-weight:800;line-height:1.2;color:#0f172a;"></div>'
        ].join("");

        const dismissButton = document.createElement("button");
        dismissButton.type = "button";
        dismissButton.setAttribute("aria-label", "Close assessment");
        dismissButton.style.border = "1px solid rgba(203, 213, 225, 0.95)";
        dismissButton.style.borderRadius = "999px";
        dismissButton.style.width = "42px";
        dismissButton.style.height = "42px";
        dismissButton.style.cursor = "pointer";
        dismissButton.style.background = "#ffffff";
        dismissButton.style.color = "#475569";
        dismissButton.style.fontSize = "24px";
        dismissButton.style.lineHeight = "1";
        dismissButton.style.fontWeight = "500";
        dismissButton.innerHTML = "&times;";

        const body = document.createElement("div");
        body.id = "vrodos-immerse-assessment-body";
        body.style.padding = "22px";

        const footer = document.createElement("div");
        footer.style.display = "flex";
        footer.style.justifyContent = "space-between";
        footer.style.alignItems = "center";
        footer.style.gap = "12px";
        footer.style.padding = "0 22px 22px";

        const status = document.createElement("div");
        status.id = "vrodos-immerse-assessment-status";
        status.style.fontSize = "13px";
        status.style.color = "#64748b";

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.textContent = "Finish";
        nextButton.style.border = "0";
        nextButton.style.borderRadius = "999px";
        nextButton.style.padding = "12px 18px";
        nextButton.style.cursor = "pointer";
        nextButton.style.background = "#5cc887";
        nextButton.style.color = "#ffffff";
        nextButton.style.fontWeight = "800";
        nextButton.style.display = "none";

        header.appendChild(titleWrap);
        header.appendChild(dismissButton);
        footer.appendChild(status);
        footer.appendChild(nextButton);
        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        root.appendChild(panel);
        document.body.appendChild(root);

        runtime.root = root;
        runtime.body = body;
        runtime.nextButton = nextButton;
        runtime.dismissButton = dismissButton;
        runtime.status = status;
        runtime.title = titleWrap.querySelector("#vrodos-immerse-assessment-title");
        runtime.kicker = titleWrap.querySelector("#vrodos-immerse-assessment-kicker");

        runtime.configurePrimaryAction = function (config) {
            const options = config || {};
            const visible = Boolean(options.visible);
            runtime.nextButton.style.display = visible ? "inline-flex" : "none";
            runtime.nextButton.textContent = options.label || "Finish";
            runtime.nextButton.disabled = Boolean(options.disabled);
            runtime.nextButton.style.opacity = runtime.nextButton.disabled ? "0.55" : "1";
            runtime.nextButton.style.pointerEvents = runtime.nextButton.disabled ? "none" : "auto";
        };

        runtime.setStatus = function (message) {
            runtime.status.textContent = message || "";
        };

        runtime.resetState = function () {
            if (runtime.state && typeof runtime.state.cleanup === "function") {
                runtime.state.cleanup();
            }

            runtime.payload = null;
            runtime.renderer = null;
            runtime.state = null;
            runtime.body.innerHTML = "";
            runtime.setStatus("");
            runtime.configurePrimaryAction({ visible: false });
        };

        runtime.hide = function () {
            runtime.root.style.display = "none";
            setAssessmentSceneInteractionLocked(false);
            runtime.resetState();
        };

        runtime.finish = function (response, extra) {
            if (!runtime.payload) {
                return;
            }

            runtime.lastResult = buildAssessmentResult(runtime.payload, response, extra);
            runtime.payload.result = runtime.lastResult;
            window.__vrodosLastAssessmentResult = runtime.lastResult;
            runtime.hide();
        };

        runtime.renderUnsupported = function () {
            const isPromptFamily = runtime.payload && runtime.payload.group === "Prompt";
            renderEmptyState(
                runtime,
                "This assessment type is not interactive in VRodos yet.",
                isPromptFamily
                    ? "Prompt-family assessments are intentionally left read-only in this release. The scene still compiles safely."
                    : "The scene still compiles safely, but this assessment currently opens as a read-only card. Supported interactive groups are Question, Image quiz, Pair, Grid, and Text."
            );
        };

        runtime.rerender = function () {
            if (!runtime.renderer || typeof runtime.renderer.render !== "function") {
                runtime.renderUnsupported();
                return;
            }

            runtime.renderer.render(runtime);
        };

        runtime.open = function (payload) {
            runtime.resetState();
            runtime.payload = payload;
            runtime.kicker.textContent = payload.type || payload.group || "Assessment";
            if (typeof vrodosDecodeDisplayText === "function") {
                runtime.title.textContent = vrodosDecodeDisplayText(payload.title || "Assessment");
            } else {
                runtime.title.textContent = decodeDisplayText(payload.title || "Assessment");
            }
            runtime.root.style.display = "flex";
            setAssessmentSceneInteractionLocked(true);

            runtime.renderer = resolveRenderer(payload);
            if (!runtime.renderer) {
                runtime.renderUnsupported();
                return;
            }

            runtime.state = typeof runtime.renderer.createState === "function"
                ? runtime.renderer.createState(payload, runtime)
                : {};
            runtime.rerender();
        };

        dismissButton.addEventListener("click", runtime.hide);
        nextButton.addEventListener("click", () => {
            if (!runtime.renderer || typeof runtime.renderer.onPrimaryAction !== "function") {
                return;
            }

            runtime.renderer.onPrimaryAction(runtime);
        });

        window.__vrodosImmerseAssessmentRuntime = runtime;
        return runtime;
    }

    function getOverlayRuntime() {
        return getOverlayRuntimeV2();
    }

    function getOverlayRuntimeLegacy() {
        if (window.__vrodosImmerseAssessmentRuntime) {
            return window.__vrodosImmerseAssessmentRuntime;
        }

        const runtime = {
            activeIndex: 0,
            selectedIndex: null,
            recordedAnswers: [],
            lastResult: null,
            payload: null,
            root: null,
            body: null,
            nextButton: null,
            dismissButton: null
        };

        const root = document.createElement("div");
        root.id = "vrodos-immerse-assessment-overlay";
        root.style.position = "fixed";
        root.style.inset = "0";
        root.style.zIndex = "2147482000";
        root.style.display = "none";
        root.style.alignItems = "center";
        root.style.justifyContent = "center";
        root.style.padding = "24px";
        root.style.background = "rgba(148, 163, 184, 0.34)";
        root.style.backdropFilter = "blur(12px)";
        root.style.fontFamily = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

        const panel = document.createElement("div");
        panel.style.width = "min(720px, 100%)";
        panel.style.maxHeight = "min(84vh, 860px)";
        panel.style.overflow = "auto";
        panel.style.borderRadius = "22px";
        panel.style.background = "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)";
        panel.style.color = "#1e293b";
        panel.style.border = "1px solid rgba(203, 213, 225, 0.9)";
        panel.style.boxShadow = "0 28px 80px rgba(15, 23, 42, 0.18)";

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "flex-start";
        header.style.gap = "16px";
        header.style.padding = "20px 22px 14px";
        header.style.borderBottom = "1px solid rgba(226, 232, 240, 0.9)";

        const titleWrap = document.createElement("div");
        titleWrap.innerHTML = [
            '<div id="vrodos-immerse-assessment-kicker" style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#3b82f6;margin-bottom:6px;"></div>',
            '<div id="vrodos-immerse-assessment-title" style="font-size:24px;font-weight:800;line-height:1.2;color:#0f172a;"></div>'
        ].join("");

        const actionsWrap = document.createElement("div");
        actionsWrap.style.display = "flex";
        actionsWrap.style.alignItems = "center";
        actionsWrap.style.gap = "0";

        const dismissButton = document.createElement("button");
        dismissButton.type = "button";
        dismissButton.setAttribute("aria-label", "Close assessment");
        dismissButton.textContent = "×";
        dismissButton.style.border = "1px solid rgba(203, 213, 225, 0.95)";
        dismissButton.style.borderRadius = "999px";
        dismissButton.style.width = "42px";
        dismissButton.style.height = "42px";
        dismissButton.style.cursor = "pointer";
        dismissButton.style.background = "#ffffff";
        dismissButton.style.color = "#475569";
        dismissButton.style.fontSize = "24px";
        dismissButton.style.lineHeight = "1";
        dismissButton.style.fontWeight = "500";
        dismissButton.innerHTML = "&times;";

        const body = document.createElement("div");
        body.id = "vrodos-immerse-assessment-body";
        body.style.padding = "22px";

        const footer = document.createElement("div");
        footer.style.display = "flex";
        footer.style.justifyContent = "space-between";
        footer.style.alignItems = "center";
        footer.style.gap = "12px";
        footer.style.padding = "0 22px 22px";

        const status = document.createElement("div");
        status.id = "vrodos-immerse-assessment-status";
        status.style.fontSize = "13px";
        status.style.color = "#64748b";

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.textContent = "Next";
        nextButton.style.border = "0";
        nextButton.style.borderRadius = "999px";
        nextButton.style.padding = "12px 18px";
        nextButton.style.cursor = "pointer";
        nextButton.style.background = "#5cc887";
        nextButton.style.color = "#ffffff";
        nextButton.style.fontWeight = "800";
        nextButton.style.display = "none";

        header.appendChild(titleWrap);
        actionsWrap.appendChild(dismissButton);
        header.appendChild(actionsWrap);
        footer.appendChild(status);
        footer.appendChild(nextButton);
        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        root.appendChild(panel);
        document.body.appendChild(root);

        runtime.root = root;
        runtime.body = body;
        runtime.nextButton = nextButton;
        runtime.dismissButton = dismissButton;
        runtime.status = status;
        runtime.title = titleWrap.querySelector("#vrodos-immerse-assessment-title");
        runtime.kicker = titleWrap.querySelector("#vrodos-immerse-assessment-kicker");

        runtime.hide = function () {
            runtime.root.style.display = "none";
            setAssessmentSceneInteractionLocked(false);
            runtime.payload = null;
            runtime.activeIndex = 0;
            runtime.selectedIndex = null;
            runtime.recordedAnswers = [];
        };

        runtime.getQuestions = function () {
            if (!runtime.payload) {
                return [];
            }

            const content = runtime.payload.content || {};
            if (runtime.payload.group === "Question" || runtime.payload.group === "ImageQuiz") {
                return Array.isArray(content.questions) ? content.questions : [];
            }

            return [];
        };

        runtime.renderUnsupported = function () {
            runtime.body.innerHTML = [
                '<div style="padding:18px;border-radius:18px;background:#ffffff;border:1px solid rgba(226,232,240,0.95);box-shadow:0 12px 30px rgba(15,23,42,0.06);">',
                '<div style="font-size:18px;font-weight:800;margin-bottom:10px;color:#0f172a;">This assessment type is not interactive in VRODOS v1.</div>',
                '<div style="font-size:14px;line-height:1.6;color:#64748b;">',
                'The scene can still compile safely, but this assessment currently opens as a read-only card. Supported interactive groups are Question and Image quiz.',
                '</div>',
                '</div>'
            ].join("");
            runtime.status.textContent = runtime.payload.type || runtime.payload.group || "Assessment";
            runtime.nextButton.style.display = "none";
        };

        runtime.renderQuestion = function () {
            const questions = runtime.getQuestions();
            const question = questions[runtime.activeIndex];
            if (!question) {
                runtime.hide();
                return;
            }

            const answers = Array.isArray(question.answers)
                ? question.answers.map((item) => item && typeof item === "object" ? item.text : item)
                : Array.isArray(question.options)
                    ? question.options.map((item) => item && typeof item === "object" ? item.text : item)
                    : [];

            const selected = runtime.selectedIndex;

            runtime.body.innerHTML = [
                question.imageUrl
                    ? `<div style="margin-bottom:16px;"><img src="${escapeHtml(question.imageUrl)}" alt="" style="width:100%;max-height:280px;object-fit:contain;border-radius:18px;background:#f8fafc;border:1px solid rgba(226,232,240,0.95);" /></div>`
                    : "",
                `<div style="font-size:20px;font-weight:800;line-height:1.35;margin-bottom:18px;color:#0f172a;">${escapeHtml(question.question || `Question ${runtime.activeIndex + 1}`)}</div>`,
                '<div style="display:grid;gap:12px;">',
                answers.map((answer, index) => {
                    const isSelected = selected === index;
                    const background = isSelected ? "rgba(92, 200, 135, 0.14)" : "#ffffff";
                    const border = isSelected ? "rgba(92, 200, 135, 0.9)" : "rgba(203, 213, 225, 0.95)";
                    const color = isSelected ? "#166534" : "#1e293b";

                    return [
                        `<button type="button" class="assessment-answer-option" data-answer-index="${index}"`,
                        ' style="text-align:left;border-radius:16px;padding:14px 16px;border:1px solid ' + border + ';',
                        ' background:' + background + ';color:' + color + ';cursor:pointer;font-size:15px;font-weight:700;box-shadow:0 8px 18px rgba(15,23,42,0.04);">',
                        `${escapeHtml(answer || `Option ${index + 1}`)}`,
                        "</button>"
                    ].join("");
                }).join(""),
                "</div>"
            ].join("");

            runtime.status.textContent = `Question ${runtime.activeIndex + 1} of ${questions.length}`;
            runtime.nextButton.textContent = runtime.activeIndex === questions.length - 1 ? "Finish" : "Next";
            runtime.nextButton.style.display = "inline-flex";
            runtime.nextButton.style.opacity = selected === null ? "0.55" : "1";
            runtime.nextButton.style.pointerEvents = selected === null ? "none" : "auto";

            runtime.body.querySelectorAll("[data-answer-index]").forEach((button) => {
                button.addEventListener("click", () => {
                    runtime.selectedIndex = Number(button.getAttribute("data-answer-index"));
                    runtime.renderQuestion();
                });
            });
        };

        runtime.open = function (payload) {
            runtime.payload = payload;
            runtime.activeIndex = 0;
            runtime.selectedIndex = null;
            runtime.recordedAnswers = [];
            runtime.kicker.textContent = payload.type || payload.group || "Assessment";
            if (typeof vrodosDecodeDisplayText === "function") {
                runtime.title.textContent = vrodosDecodeDisplayText(payload.title || "Assessment");
            } else {
                runtime.title.textContent = decodeDisplayText(payload.title || "Assessment");
            }
            runtime.root.style.display = "flex";
            setAssessmentSceneInteractionLocked(true);

            if (!payload.supported || !["Question", "ImageQuiz"].includes(payload.group)) {
                runtime.renderUnsupported();
                return;
            }

            runtime.renderQuestion();
        };

        dismissButton.addEventListener("click", runtime.hide);
        nextButton.addEventListener("click", () => {
            const questions = runtime.getQuestions();
            if (runtime.selectedIndex === null) {
                return;
            }

            const currentQuestion = questions[runtime.activeIndex] || {};
            const currentAnswers = Array.isArray(currentQuestion.answers)
                ? currentQuestion.answers.map((item) => item && typeof item === "object" ? item.text : item)
                : Array.isArray(currentQuestion.options)
                    ? currentQuestion.options.map((item) => item && typeof item === "object" ? item.text : item)
                    : [];

            runtime.recordedAnswers[runtime.activeIndex] = {
                questionIndex: runtime.activeIndex,
                prompt: currentQuestion.question || "",
                selectedIndex: runtime.selectedIndex,
                selectedAnswer: currentAnswers[runtime.selectedIndex] || ""
            };

            if (runtime.activeIndex >= questions.length - 1) {
                if (runtime.payload) {
                    runtime.lastResult = {
                        completedAt: new Date().toISOString(),
                        title: runtime.payload.title || "",
                        type: runtime.payload.type || "",
                        group: runtime.payload.group || "",
                        levels: Array.isArray(runtime.payload.levels) ? runtime.payload.levels.slice() : [],
                        answers: runtime.recordedAnswers.slice()
                    };
                    runtime.payload.result = runtime.lastResult;
                    window.__vrodosLastAssessmentResult = runtime.lastResult;
                }
                runtime.hide();
                return;
            }

            runtime.activeIndex += 1;
            runtime.selectedIndex = null;
            runtime.renderQuestion();
        });

        window.__vrodosImmerseAssessmentRuntime = runtime;
        return runtime;
    }

    function setAttributeEnabled(el, attrName, enabled) {
        if (!el) {
            return;
        }

        if (el.components && el.components[attrName]) {
            if (enabled && typeof el.components[attrName].play === "function") {
                el.components[attrName].play();
            } else if (!enabled && typeof el.components[attrName].pause === "function") {
                el.components[attrName].pause();
            }
        }

        if (attrName === "custom-movement") {
            return;
        }

        el.setAttribute(attrName, "enabled: " + (enabled ? "true" : "false"));
    }

    function setAssessmentSceneInteractionLocked(isLocked) {
        const player = document.getElementById("player");
        const camera = document.getElementById("cameraA");
        const scene = document.querySelector("a-scene");
        const canvas = scene && scene.canvas ? scene.canvas : null;

        setAttributeEnabled(player, "custom-movement", !isLocked);
        setAttributeEnabled(player, "wasd-controls", !isLocked);
        setAttributeEnabled(player, "look-controls", !isLocked);
        setAttributeEnabled(camera, "custom-movement", !isLocked);
        setAttributeEnabled(camera, "look-controls", !isLocked);

        if (!isLocked) {
            document.body.style.cursor = "";
            document.documentElement.style.cursor = "";
            document.body.classList.remove("a-grab-cursor", "a-grabbing");
            document.documentElement.classList.remove("a-grab-cursor", "a-grabbing");

            if (canvas) {
                canvas.style.cursor = "";
                canvas.classList.remove("a-grab-cursor", "a-grabbing");
            }
        }
    }

    function payloadFromElement(element) {
        const title = decodeDisplayText(element.getAttribute("data-assessment-title") || "Assessment");
        const type = decodeDisplayText(element.getAttribute("data-assessment-type") || "");
        const group = decodeDisplayText(element.getAttribute("data-assessment-group") || "");
        const supported = element.getAttribute("data-assessment-supported") === "true";
        const content = decodeBase64Json(element.getAttribute("data-assessment-content"), {});
        const levels = decodeBase64Json(element.getAttribute("data-assessment-levels"), []);

        return {
            title,
            type,
            group,
            supported,
            content,
            levels
        };
    }

    if (typeof AFRAME !== "undefined") {
        AFRAME.registerComponent("immerse-assessment-launcher", {
            init: function () {
                getCefrRuntime().register(this.el);

                this.onClick = () => {
                    const runtime = getOverlayRuntime();
                    runtime.open(payloadFromElement(this.el));
                };

                this.el.addEventListener("click", this.onClick);
            },

            remove: function () {
                if (this.onClick) {
                    this.el.removeEventListener("click", this.onClick);
                }
            }
        });

        AFRAME.registerComponent("immerse-cefr-asset", {
            init: function () {
                getCefrRuntime().register(this.el);
            }
        });
    }
})();
