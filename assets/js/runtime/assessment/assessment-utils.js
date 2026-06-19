(function () {
    "use strict";

    const namespace = window.VRodosImmerseAssessment = window.VRodosImmerseAssessment || {};
    const CEFR_LEVELS = ["A1", "A2", "B1", "B2"];
    const CEFR_ALL_MARKERS = ["ALL", "ALL LEVELS"];
    const ASSESSMENT_RENDERER_KEYS = ["Question", "ImageQuiz", "Pair", "Grid", "Text"];
    const ASSESSMENT_FAMILY_ALIASES = {
        Question: ["question", "questions", "quiz", "multiple choice", "multiplechoice", "true or false", "true/false", "truefalse"],
        ImageQuiz: ["image quiz", "imagequiz", "image question", "imagequestion", "visual quiz", "visualquiz", "picture quiz", "picturequiz"],
        Pair: ["pair", "pairs", "matching", "match", "match pairs", "matchpairs", "drag and drop", "draganddrop", "drag drop", "dragdrop"],
        Grid: ["grid", "word search", "wordsearch", "vocabulary bingo", "vocabularybingo", "bingo"],
        Text: ["text", "fill in the gaps", "fillinthegaps", "fill gaps", "fillgaps", "fill in gaps", "fillingaps", "highlight", "highlight text", "highlighttext"]
    };
    const UNSUPPORTED_ASSESSMENT_ALIASES = ["prompt", "prompts"];

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

    function normalizeLevelToken(value) {
        if (value && typeof value === "object") {
            return "";
        }

        return decodeDisplayText(String(value || "")).trim().toUpperCase();
    }

    function isAllLevel(value) {
        return CEFR_ALL_MARKERS.includes(normalizeLevelToken(value));
    }

    function normalizeLevel(value) {
        const normalized = normalizeLevelToken(value);
        return CEFR_LEVELS.includes(normalized) ? normalized : "";
    }

    function normalizeLevels(values) {
        if (!Array.isArray(values)) {
            return [];
        }

        if (values.some((value) => isAllLevel(value))) {
            return CEFR_LEVELS.slice();
        }

        return Array.from(new Set(values.map((value) => normalizeLevel(value)).filter(Boolean)));
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

    function compactComparableText(value) {
        return normalizeComparableText(value).replace(/[^a-z0-9]+/g, "");
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

    function getDecodedField(object, keys) {
        if (!object || typeof object !== "object") {
            return "";
        }

        for (const key of keys) {
            const value = object[key];
            if (value === undefined || value === null) {
                continue;
            }

            const text = decodeDisplayText(String(value)).trim();
            if (text) {
                return text;
            }
        }

        return "";
    }

    function assessmentFamilyFromValue(value) {
        const raw = decodeDisplayText(value).trim();
        if (!raw) {
            return "";
        }

        if (ASSESSMENT_RENDERER_KEYS.includes(raw)) {
            return raw;
        }

        const comparable = normalizeComparableText(raw);
        const compact = compactComparableText(raw);
        for (const rendererKey of ASSESSMENT_RENDERER_KEYS) {
            const aliases = ASSESSMENT_FAMILY_ALIASES[rendererKey] || [];
            if (aliases.includes(comparable) || aliases.includes(compact)) {
                return rendererKey;
            }
        }

        return "";
    }

    function isExplicitUnsupportedAssessmentFamily(value) {
        const comparable = normalizeComparableText(value);
        const compact = compactComparableText(value);
        return UNSUPPORTED_ASSESSMENT_ALIASES.includes(comparable) || UNSUPPORTED_ASSESSMENT_ALIASES.includes(compact);
    }

    function isSupportedPayloadFlag(value) {
        return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
    }

    function inferAssessmentArrayRendererKey(items) {
        const entries = toArray(items).filter((item) => item !== null && item !== undefined);
        if (!entries.length) {
            return "";
        }

        const objects = entries.filter((item) => item && typeof item === "object");
        if (!objects.length) {
            return "Grid";
        }

        if (objects.some((item) => item.source !== undefined || item.target !== undefined || item.left !== undefined || item.right !== undefined)) {
            return "Pair";
        }

        if (objects.some((item) =>
            item.question !== undefined ||
            item.prompt !== undefined ||
            item.answers !== undefined ||
            item.options !== undefined ||
            item.imageUrl !== undefined ||
            item.image_url !== undefined ||
            item.image !== undefined
        )) {
            return objects.some((item) => item.imageUrl || item.image_url || item.image) ? "ImageQuiz" : "Question";
        }

        if (objects.some((item) => item.start !== undefined && item.end !== undefined)) {
            return "Text";
        }

        if (objects.some((item) => item.text !== undefined || item.word !== undefined || item.hint !== undefined)) {
            return "Grid";
        }

        return "Question";
    }

    function inferAssessmentRendererKeyFromContent(content) {
        if (!content || typeof content !== "object") {
            return "";
        }

        if (Array.isArray(content)) {
            return inferAssessmentArrayRendererKey(content);
        }

        const questions = Array.isArray(content.questions) ? content.questions : [];
        if (questions.length) {
            return questions.some((question) => question && (question.imageUrl || question.image_url || question.image))
                ? "ImageQuiz"
                : "Question";
        }

        if (Array.isArray(content.pairs) && content.pairs.length) {
            return "Pair";
        }

        if (Array.isArray(content.words) && content.words.length) {
            return "Grid";
        }

        if (Array.isArray(content.items) && content.items.length) {
            return inferAssessmentArrayRendererKey(content.items);
        }

        if (content.text || (Array.isArray(content.annotations) && content.annotations.length)) {
            return "Text";
        }

        if (content.question || content.prompt || Array.isArray(content.answers) || Array.isArray(content.options)) {
            return content.imageUrl || content.image_url || content.image ? "ImageQuiz" : "Question";
        }

        return "";
    }

    function resolveAssessmentRendererKey(payload, options) {
        const cfg = options || {};
        if (!payload || (!cfg.ignoreSupported && !isSupportedPayloadFlag(payload.supported))) {
            return "";
        }

        const explicitValues = [
            payload.group,
            payload.type,
            payload.assessment_group,
            payload.assessment_type
        ];
        const declaredValues = explicitValues.filter((item) => decodeDisplayText(item).trim());

        for (const value of explicitValues) {
            const rendererKey = assessmentFamilyFromValue(value);
            if (rendererKey) {
                return rendererKey;
            }
        }

        const contentRendererKey = inferAssessmentRendererKeyFromContent(payload.content);
        const isPureUnsupportedFamily = declaredValues.length > 0 &&
            declaredValues.every((item) => isExplicitUnsupportedAssessmentFamily(item));
        if (contentRendererKey && !isPureUnsupportedFamily) {
            return contentRendererKey;
        }

        return "";
    }

    function contentWithMappedItems(content, fieldName, normalizedFrom) {
        if (Array.isArray(content)) {
            return {
                content: { [fieldName]: content },
                normalizedFrom: "array:" + fieldName
            };
        }

        if (content && typeof content === "object" && Array.isArray(content[fieldName])) {
            return {
                content,
                normalizedFrom: normalizedFrom || ""
            };
        }

        if (content && typeof content === "object" && Array.isArray(content.items)) {
            return {
                content: Object.assign({}, content, { [fieldName]: content.items }),
                normalizedFrom: "items:" + fieldName
            };
        }

        return {
            content,
            normalizedFrom: normalizedFrom || ""
        };
    }

    function normalizeAssessmentPayloadForRenderer(payload, rendererKey) {
        const key = rendererKey || resolveAssessmentRendererKey(payload, { ignoreSupported: true });
        if (!payload || !key || !payload.content || typeof payload.content !== "object") {
            return payload;
        }

        const content = payload.content;
        let normalized = { content, normalizedFrom: "" };

        if (key === "Question" || key === "ImageQuiz") {
            normalized = contentWithMappedItems(content, "questions");
            if (normalized.content === content && !Array.isArray(content.questions) && (
                content.question ||
                content.prompt ||
                Array.isArray(content.answers) ||
                Array.isArray(content.options) ||
                content.imageUrl ||
                content.image_url ||
                content.image
            )) {
                normalized = {
                    content: Object.assign({}, content, { questions: [content] }),
                    normalizedFrom: "object:questions"
                };
            }
        } else if (key === "Pair") {
            normalized = contentWithMappedItems(content, "pairs");
        } else if (key === "Grid") {
            normalized = contentWithMappedItems(content, "words");
        } else if (key === "Text") {
            normalized = contentWithMappedItems(content, "annotations");
        }

        if (normalized.content === content) {
            return payload;
        }

        return Object.assign({}, payload, {
            content: normalized.content,
            assessmentContentNormalizedFrom: normalized.normalizedFrom,
            vrContentNormalizedFrom: normalized.normalizedFrom
        });
    }

    function getAnswerTexts(question) {
        if (!question || typeof question !== "object") {
            return [];
        }

        if (Array.isArray(question.answers)) {
            return question.answers.map((item) => decodeDisplayText(item && typeof item === "object" ? getDecodedField(item, ["text", "label", "value", "answer"]) : item));
        }

        if (Array.isArray(question.options)) {
            return question.options.map((item) => decodeDisplayText(item && typeof item === "object" ? getDecodedField(item, ["text", "label", "value", "answer"]) : item));
        }

        return [];
    }

    function getCorrectIndex(question) {
        const correctIndex = Number(question && question.correctIndex);
        if (Number.isInteger(correctIndex) && correctIndex >= 0) {
            return correctIndex;
        }

        const answers = question && Array.isArray(question.answers) ? question.answers : [];
        const optionItems = answers.length ? answers : (question && Array.isArray(question.options) ? question.options : []);
        const matchedIndex = optionItems.findIndex((item) => item && typeof item === "object" && (
            item.correct === true ||
            item.isCorrect === true ||
            item.is_correct === true
        ));
        return matchedIndex >= 0 ? matchedIndex : null;
    }

    function normalizeQuestionItems(payload) {
        return toArray(payload && payload.content && payload.content.questions)
            .map((question, index) => ({
                id: question && question.id ? String(question.id) : uniqueId("question", index),
                prompt: getDecodedField(question, ["question", "prompt", "title", "text"]),
                answers: getAnswerTexts(question),
                correctIndex: getCorrectIndex(question),
                imageUrl: question && (question.imageUrl || question.image_url || question.image)
                    ? String(question.imageUrl || question.image_url || question.image)
                    : ""
            }))
            .filter((question) => question.prompt || question.answers.length || question.imageUrl);
    }

    function normalizePairEntries(payload) {
        return toArray(payload && payload.content && payload.content.pairs)
            .map((pair, index) => ({
                id: pair && pair.id ? String(pair.id) : uniqueId("pair", index),
                source: getDecodedField(pair, ["source", "left", "prompt", "question"]),
                target: getDecodedField(pair, ["target", "right", "answer", "match"])
            }))
            .filter((pair) => pair.source || pair.target);
    }

    function normalizeGridEntries(payload) {
        return toArray(payload && payload.content && payload.content.words)
            .map((word, index) => {
                const isStringWord = typeof word === "string";
                const text = isStringWord ? decodeDisplayText(word) : getDecodedField(word, ["text", "word", "label", "value"]);
                const hint = isStringWord ? "" : getDecodedField(word, ["hint", "clue", "description"]);
                return {
                    id: word && word.id ? String(word.id) : uniqueId("word", index),
                    text,
                    hint,
                    normalized: normalizeWordSearchText(text)
                };
            })
            .filter((word) => word.text && word.normalized);
    }

    function annotationTypeMatches(annotationType, requestedType) {
        const type = normalizeComparableText(annotationType);
        if (requestedType === "highlight") {
            return type === "highlight" || type === "highlight text" || type === "highlighttext";
        }
        if (requestedType === "blank") {
            return !type || type === "blank" || type === "gap" || type === "fill gap" || type === "fillgap" || type === "missing word" || type === "missingword";
        }
        return type === requestedType;
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
                annotationTypeMatches(annotation.type, type)
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
    namespace.isAllLevel = isAllLevel;
    namespace.normalizeLevels = normalizeLevels;
    namespace.decodeBase64Json = decodeBase64Json;
    namespace.escapeHtml = escapeHtml;
    namespace.normalizeComparableText = normalizeComparableText;
    namespace.compactComparableText = compactComparableText;
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
    namespace.resolveAssessmentRendererKey = resolveAssessmentRendererKey;
    namespace.normalizeAssessmentPayloadForRenderer = normalizeAssessmentPayloadForRenderer;
    namespace.inferAssessmentRendererKeyFromContent = inferAssessmentRendererKeyFromContent;
    namespace.buildAssessmentResult = buildAssessmentResult;
})();
