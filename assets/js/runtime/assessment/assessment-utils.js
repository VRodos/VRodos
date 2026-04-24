(function () {
    "use strict";

    const namespace = window.VRodosImmerseAssessment = window.VRodosImmerseAssessment || {};
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


    namespace.CEFR_LEVELS = CEFR_LEVELS;
    namespace.decodeDisplayText = decodeDisplayText;
    namespace.normalizeAssessmentLineBreaks = normalizeAssessmentLineBreaks;
    namespace.normalizeLevel = normalizeLevel;
    namespace.normalizeLevels = normalizeLevels;
    namespace.decodeBase64Json = decodeBase64Json;
    namespace.escapeHtml = escapeHtml;
    namespace.normalizeComparableText = normalizeComparableText;
    namespace.normalizeWordSearchText = normalizeWordSearchText;
    namespace.normalizeFreeText = normalizeFreeText;
    namespace.isPlaceholderText = isPlaceholderText;
    namespace.toArray = toArray;
    namespace.uniqueId = uniqueId;
    namespace.shuffleArray = shuffleArray;
    namespace.arrayEquals = arrayEquals;
    namespace.normalizeQuestionItems = normalizeQuestionItems;
    namespace.normalizePairEntries = normalizePairEntries;
    namespace.normalizeGridEntries = normalizeGridEntries;
    namespace.normalizeTextAnnotations = normalizeTextAnnotations;
    namespace.buildAssessmentResult = buildAssessmentResult;
})();
