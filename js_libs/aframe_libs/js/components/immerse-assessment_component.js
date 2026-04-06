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

    function normalizeLevel(value) {
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

    function getAssessmentLevels(element) {
        return normalizeLevels(
            decodeBase64Json(element.getAttribute("data-assessment-levels"), [])
        );
    }

    function setAssessmentVisible(element, isVisible) {
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
            chip: null,
            chipButton: null,
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
            setAssessmentVisible(element, false);
            runtime.schedulePrompt();
        };

        runtime.matchesLevel = function (element, level) {
            const levels = getAssessmentLevels(element);
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
                setAssessmentVisible(element, runtime.matchesLevel(element, normalizedLevel));
            });

            if (runtime.chipButton) {
                runtime.chipButton.textContent = normalizedLevel;
            }
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
            root.style.background = "rgba(2, 6, 23, 0.72)";
            root.style.backdropFilter = "blur(10px)";

            const panel = document.createElement("div");
            panel.style.width = "min(560px, 100%)";
            panel.style.borderRadius = "24px";
            panel.style.background = "linear-gradient(180deg, #0f172a 0%, #111827 100%)";
            panel.style.border = "1px solid rgba(148, 163, 184, 0.2)";
            panel.style.boxShadow = "0 30px 80px rgba(2, 6, 23, 0.45)";
            panel.style.padding = "26px";
            panel.style.color = "#e5e7eb";
            panel.style.fontFamily = "Segoe UI, sans-serif";

            panel.innerHTML = [
                '<div style="font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#7dd3fc;margin-bottom:8px;">Immerse CEFR Level</div>',
                '<div style="font-size:28px;font-weight:800;line-height:1.15;margin-bottom:10px;">Choose your level</div>',
                '<div style="font-size:15px;line-height:1.6;color:#cbd5e1;margin-bottom:18px;">Only assessments that match the selected CEFR level will be shown in this scene.</div>'
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
                button.style.border = "1px solid rgba(148, 163, 184, 0.2)";
                button.style.background = "rgba(15, 23, 42, 0.85)";
                button.style.color = "#f8fafc";
                button.style.borderRadius = "16px";
                button.style.padding = "16px 12px";
                button.style.fontSize = "18px";
                button.style.fontWeight = "800";
                button.style.cursor = "pointer";
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

            const helper = document.createElement("div");
            helper.textContent = "You can change this later during the scene.";
            helper.style.fontSize = "13px";
            helper.style.color = "#94a3b8";

            const continueButton = document.createElement("button");
            continueButton.type = "button";
            continueButton.textContent = "Start experience";
            continueButton.style.border = "0";
            continueButton.style.borderRadius = "999px";
            continueButton.style.padding = "12px 18px";
            continueButton.style.fontWeight = "800";
            continueButton.style.cursor = "pointer";
            continueButton.style.background = "#0f766e";
            continueButton.style.color = "#f8fafc";
            continueButton.style.opacity = "0.55";
            continueButton.style.pointerEvents = "none";
            continueButton.addEventListener("click", () => {
                if (!runtime.selectedLevel) {
                    return;
                }

                runtime.applyLevel(runtime.selectedLevel);
                runtime.hidePrompt();
            });

            footer.appendChild(helper);
            footer.appendChild(continueButton);
            panel.appendChild(buttonRow);
            panel.appendChild(footer);
            root.appendChild(panel);
            document.body.appendChild(root);

            const chip = document.createElement("div");
            chip.id = "vrodos-immerse-cefr-chip";
            chip.style.position = "fixed";
            chip.style.left = "20px";
            chip.style.top = "20px";
            chip.style.right = "auto";
            chip.style.bottom = "auto";
            chip.style.zIndex = "2147481400";
            chip.style.display = "none";

            const chipButton = document.createElement("button");
            chipButton.type = "button";
            chipButton.style.border = "1px solid rgba(148, 163, 184, 0.24)";
            chipButton.style.borderRadius = "999px";
            chipButton.style.padding = "10px 14px";
            chipButton.style.background = "rgba(15, 23, 42, 0.9)";
            chipButton.style.color = "#f8fafc";
            chipButton.style.fontWeight = "800";
            chipButton.style.cursor = "pointer";
            chipButton.style.boxShadow = "0 16px 40px rgba(2, 6, 23, 0.35)";
            chipButton.addEventListener("click", () => {
                runtime.showPrompt();
            });
            chip.appendChild(chipButton);
            document.body.appendChild(chip);

            runtime.root = root;
            runtime.levelButtons = buttons;
            runtime.continueButton = continueButton;
            runtime.chip = chip;
            runtime.chipButton = chipButton;
            runtime.initialized = true;

            runtime.selectLevel(runtime.selectedLevel || "");
        };

        runtime.selectLevel = function (level) {
            runtime.selectedLevel = normalizeLevel(level);

            Object.entries(runtime.levelButtons || {}).forEach(([buttonLevel, button]) => {
                const isActive = buttonLevel === runtime.selectedLevel;
                button.style.background = isActive ? "rgba(15, 118, 110, 0.95)" : "rgba(15, 23, 42, 0.85)";
                button.style.borderColor = isActive ? "rgba(94, 234, 212, 0.65)" : "rgba(148, 163, 184, 0.2)";
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
            runtime.chip.style.display = "none";
            runtime.selectLevel(runtime.selectedLevel || "");
        };

        runtime.hidePrompt = function () {
            if (runtime.root) {
                runtime.root.style.display = "none";
            }
            if (runtime.chip) {
                runtime.chip.style.display = "block";
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

    function getOverlayRuntime() {
        if (window.__vrodosImmerseAssessmentRuntime) {
            return window.__vrodosImmerseAssessmentRuntime;
        }

        const runtime = {
            activeIndex: 0,
            selectedIndex: null,
            payload: null,
            root: null,
            body: null,
            closeButton: null,
            nextButton: null
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
        root.style.background = "rgba(2, 6, 23, 0.7)";
        root.style.backdropFilter = "blur(10px)";

        const panel = document.createElement("div");
        panel.style.width = "min(720px, 100%)";
        panel.style.maxHeight = "min(84vh, 860px)";
        panel.style.overflow = "auto";
        panel.style.borderRadius = "22px";
        panel.style.background = "linear-gradient(180deg, #0f172a 0%, #111827 100%)";
        panel.style.color = "#e5e7eb";
        panel.style.border = "1px solid rgba(148, 163, 184, 0.28)";
        panel.style.boxShadow = "0 25px 70px rgba(2, 6, 23, 0.45)";

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.style.gap = "16px";
        header.style.padding = "20px 22px 14px";
        header.style.borderBottom = "1px solid rgba(148, 163, 184, 0.16)";

        const titleWrap = document.createElement("div");
        titleWrap.innerHTML = [
            '<div id="vrodos-immerse-assessment-kicker" style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7dd3fc;margin-bottom:6px;"></div>',
            '<div id="vrodos-immerse-assessment-title" style="font-size:24px;font-weight:800;line-height:1.2;"></div>'
        ].join("");

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.textContent = "Close";
        closeButton.style.border = "0";
        closeButton.style.borderRadius = "999px";
        closeButton.style.padding = "10px 14px";
        closeButton.style.cursor = "pointer";
        closeButton.style.background = "rgba(148, 163, 184, 0.16)";
        closeButton.style.color = "#f8fafc";
        closeButton.style.fontWeight = "700";

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
        status.style.color = "#cbd5e1";

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.textContent = "Next";
        nextButton.style.border = "0";
        nextButton.style.borderRadius = "999px";
        nextButton.style.padding = "12px 18px";
        nextButton.style.cursor = "pointer";
        nextButton.style.background = "#0f766e";
        nextButton.style.color = "#f8fafc";
        nextButton.style.fontWeight = "800";
        nextButton.style.display = "none";

        header.appendChild(titleWrap);
        header.appendChild(closeButton);
        footer.appendChild(status);
        footer.appendChild(nextButton);
        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        root.appendChild(panel);
        document.body.appendChild(root);

        runtime.root = root;
        runtime.body = body;
        runtime.closeButton = closeButton;
        runtime.nextButton = nextButton;
        runtime.status = status;
        runtime.title = titleWrap.querySelector("#vrodos-immerse-assessment-title");
        runtime.kicker = titleWrap.querySelector("#vrodos-immerse-assessment-kicker");

        runtime.hide = function () {
            runtime.root.style.display = "none";
            runtime.payload = null;
            runtime.activeIndex = 0;
            runtime.selectedIndex = null;
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
                '<div style="padding:18px;border-radius:18px;background:rgba(148,163,184,0.1);border:1px solid rgba(148,163,184,0.14);">',
                '<div style="font-size:18px;font-weight:800;margin-bottom:10px;">This assessment type is not interactive in VRODOS v1.</div>',
                '<div style="font-size:14px;line-height:1.6;color:#cbd5e1;">',
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
            const showFeedback = selected !== null && Number.isInteger(question.correctIndex);
            const correctIndex = Number.isInteger(question.correctIndex) ? Number(question.correctIndex) : null;
            const feedback = showFeedback
                ? (selected === correctIndex ? "Correct answer selected." : "Answer recorded.")
                : "Choose an answer to continue.";

            runtime.body.innerHTML = [
                question.imageUrl
                    ? `<div style="margin-bottom:16px;"><img src="${escapeHtml(question.imageUrl)}" alt="" style="width:100%;max-height:280px;object-fit:contain;border-radius:18px;background:#020617;border:1px solid rgba(148,163,184,0.14);" /></div>`
                    : "",
                `<div style="font-size:20px;font-weight:800;line-height:1.35;margin-bottom:18px;">${escapeHtml(question.question || `Question ${runtime.activeIndex + 1}`)}</div>`,
                '<div style="display:grid;gap:12px;">',
                answers.map((answer, index) => {
                    const isSelected = selected === index;
                    const isCorrect = showFeedback && correctIndex === index;
                    const background = isCorrect
                        ? "rgba(34,197,94,0.18)"
                        : isSelected
                            ? "rgba(56,189,248,0.18)"
                            : "rgba(15,23,42,0.88)";

                    const border = isCorrect
                        ? "rgba(34,197,94,0.55)"
                        : isSelected
                            ? "rgba(56,189,248,0.55)"
                            : "rgba(148,163,184,0.2)";

                    return [
                        `<button type="button" data-answer-index="${index}"`,
                        ' style="text-align:left;border-radius:16px;padding:14px 16px;border:1px solid ' + border + ';',
                        ' background:' + background + ';color:#f8fafc;cursor:pointer;font-size:15px;font-weight:700;">',
                        `${escapeHtml(answer || `Option ${index + 1}`)}`,
                        "</button>"
                    ].join("");
                }).join(""),
                "</div>",
                `<div style="margin-top:16px;font-size:13px;color:#cbd5e1;">${escapeHtml(feedback)}</div>`
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
            runtime.kicker.textContent = payload.type || payload.group || "Assessment";
            if (typeof vrodosDecodeDisplayText === "function") {
                runtime.title.textContent = vrodosDecodeDisplayText(payload.title || "Assessment");
            } else {
                runtime.title.textContent = decodeDisplayText(payload.title || "Assessment");
            }
            runtime.root.style.display = "flex";

            if (!payload.supported || !["Question", "ImageQuiz"].includes(payload.group)) {
                runtime.renderUnsupported();
                return;
            }

            runtime.renderQuestion();
        };

        closeButton.addEventListener("click", runtime.hide);
        nextButton.addEventListener("click", () => {
            const questions = runtime.getQuestions();
            if (runtime.selectedIndex === null) {
                return;
            }

            if (runtime.activeIndex >= questions.length - 1) {
                runtime.hide();
                return;
            }

            runtime.activeIndex += 1;
            runtime.selectedIndex = null;
            runtime.renderQuestion();
        });

        root.addEventListener("click", (event) => {
            if (event.target === root) {
                runtime.hide();
            }
        });

        window.__vrodosImmerseAssessmentRuntime = runtime;
        return runtime;
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
    }
})();
