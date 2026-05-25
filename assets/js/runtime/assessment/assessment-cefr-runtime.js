(function () {
    "use strict";

    const namespace = window.VRodosImmerseAssessment = window.VRodosImmerseAssessment || {};
    const CEFR_LEVELS = namespace.CEFR_LEVELS || ["A1", "A2", "B1", "B2"];
    const decodeBase64Json = namespace.decodeBase64Json;
    const normalizeLevel = namespace.normalizeLevel;
    const normalizeLevels = namespace.normalizeLevels;

    function getElementLevels(element) {
        const assessmentLevels = element.getAttribute("data-assessment-levels");
        const genericLevels = element.getAttribute("data-immerse-cefr-levels");

        if (assessmentLevels) {
            return normalizeLevels(decodeBase64Json(assessmentLevels, []));
        }

        return normalizeLevels(decodeBase64Json(genericLevels, []));
    }

    function ensureDomOverlayParent(root) {
        const host = window.VRODOSMasterUI && typeof window.VRODOSMasterUI.ensureOverlayHost === "function"
            ? window.VRODOSMasterUI.ensureOverlayHost()
            : document.body;
        if (host && root && root.parentNode !== host) {
            host.appendChild(root);
        }
        if (host && host.style) {
            host.style.pointerEvents = "auto";
        }
        return host;
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
            promptScheduled: false,
            vrPromptActive: false
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
            ensureDomOverlayParent(root);

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

        runtime.showVrPrompt = function () {
            const overlayApi = window.VRODOSRuntimeOverlay || null;
            if (!overlayApi || !overlayApi.shouldUseVrPanel || !overlayApi.shouldUseVrPanel()) {
                return false;
            }

            runtime.vrPromptActive = true;
            overlayApi.openVrPanel({
                id: "vrodos-immerse-cefr-vr-overlay",
                width: 2.2,
                height: 1.35,
                distance: 2.2,
                cleanup: function () {
                    runtime.vrPromptActive = false;
                },
                render: function (api) {
                    const bounds = api.drawFrame({
                        title: "Choose CEFR level",
                        width: 2.2,
                        height: 1.35,
                        onClose: function () {
                            overlayApi.closeActivePanel("cefr-close");
                        }
                    });

                    api.addText(api.root, {
                        position: bounds.left + " " + (bounds.top - 0.05) + " 0.03",
                        value: "Select the level for this experience.",
                        color: "#334155",
                        align: "left",
                        anchor: "left",
                        width: bounds.width,
                        wrapCount: "42",
                        scale: "0.4 0.4 0.4"
                    });

                    CEFR_LEVELS.forEach((level, index) => {
                        const active = level === runtime.selectedLevel;
                        api.addButton(api.root, {
                            position: (-0.66 + index * 0.44) + " " + (bounds.top - 0.36) + " 0.04",
                            width: 0.34,
                            height: 0.24,
                            label: level,
                            color: active ? "#bbf7d0" : "#ffffff",
                            textColor: active ? "#166534" : "#0f172a",
                            textScale: "0.48 0.48 0.48",
                            onClick: function () {
                                runtime.selectedLevel = level;
                                runtime.showVrPrompt();
                            }
                        });
                    });

                    api.addButton(api.root, {
                        position: "0 " + (bounds.bottom + 0.08) + " 0.04",
                        width: 0.78,
                        height: 0.2,
                        label: "Start experience",
                        disabled: !runtime.selectedLevel,
                        color: "#5cc887",
                        onClick: function () {
                            if (!runtime.selectedLevel) {
                                return;
                            }
                            runtime.applyLevel(runtime.selectedLevel);
                            runtime.hidePrompt();
                        }
                    });
                }
            });

            return true;
        };

        runtime.showPrompt = function () {
            if (runtime.showVrPrompt()) {
                return;
            }

            runtime.ensureUi();
            ensureDomOverlayParent(runtime.root);
            runtime.root.style.display = "flex";
            runtime.selectLevel(runtime.selectedLevel || "");
        };

        runtime.hidePrompt = function () {
            if (runtime.vrPromptActive && window.VRODOSRuntimeOverlay) {
                window.VRODOSRuntimeOverlay.closeActivePanel("cefr-start");
                runtime.vrPromptActive = false;
            }
            if (runtime.root) {
                runtime.root.style.display = "none";
            }
            const host = document.getElementById("vrodos-runtime-overlay-host");
            if (host && !host.querySelector("dialog[open]")) {
                host.style.pointerEvents = "none";
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

    namespace.getCefrRuntime = getCefrRuntime;
})();
