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
            vrPromptActive: false,
            vrPanelApi: null,
            levelApplied: false,
            presentationEventsBound: false
        };

        runtime.register = function (element) {
            if (!element || runtime.elements.includes(element)) {
                return;
            }

            runtime.elements.push(element);
            element.removeAttribute("data-vrodos-delayed-reveal");
            setCefrControlledVisible(element, false);
            if (runtime.levelApplied && runtime.selectedLevel) {
                setCefrControlledVisible(element, runtime.matchesLevel(element, runtime.selectedLevel));
                return;
            }
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

            runtime.levelApplied = true;
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

        runtime.isImmersiveVrActive = function () {
            const overlayApi = window.VRODOSRuntimeOverlay || null;
            if (overlayApi && typeof overlayApi.getPresentationMode === "function") {
                return overlayApi.getPresentationMode() === "immersive-xr";
            }

            const scene = document.querySelector("a-scene");
            return Boolean(scene && scene.renderer && scene.renderer.xr && scene.renderer.xr.isPresenting);
        };

        runtime.hideDomPrompt = function () {
            if (runtime.root) {
                runtime.root.style.display = "none";
            }
            const host = document.getElementById("vrodos-runtime-overlay-host");
            if (host && !host.querySelector("dialog[open]")) {
                host.style.pointerEvents = "none";
            }
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

        runtime.renderVrPrompt = function (api) {
            const panelApi = api || runtime.vrPanelApi;
            if (!panelApi) {
                return;
            }

            const width = 2.42;
            const height = 1.42;
            panelApi.clear();
            panelApi.addPlane(panelApi.root, {
                position: "0 0 0",
                width,
                height,
                layer: 10,
                material: "shader: flat; color: #f8fafc; side: double; transparent: false; opacity: 1; depthTest: false; depthWrite: false"
            });
            panelApi.addPlane(panelApi.root, {
                position: "0 0.48 0.01",
                width,
                height: 0.34,
                layer: 20,
                material: "shader: flat; color: #0f172a; side: double; transparent: false; opacity: 1; depthTest: false; depthWrite: false"
            });
            panelApi.addText(panelApi.root, {
                position: "-1.04 0.54 0.025",
                value: "CEFR Level",
                color: "#93c5fd",
                align: "left",
                anchor: "left",
                width: 1.8,
                wrapCount: "28",
                scale: "0.34 0.34 0.34"
            });
            panelApi.addText(panelApi.root, {
                position: "-1.04 0.42 0.025",
                value: "Choose your level",
                color: "#ffffff",
                align: "left",
                anchor: "left",
                width: 2,
                wrapCount: "28",
                scale: "0.52 0.52 0.52"
            });
            panelApi.addText(panelApi.root, {
                position: "-1.04 0.18 0.025",
                value: "Use your controller ray or gaze cursor to select a level, then start the experience.",
                color: "#334155",
                align: "left",
                anchor: "left",
                width: 2.05,
                wrapCount: "50",
                maxLength: 160,
                scale: "0.32 0.32 0.32"
            });

            CEFR_LEVELS.forEach((level, index) => {
                const active = level === runtime.selectedLevel;
                panelApi.addButton(panelApi.root, {
                    position: (-0.75 + index * 0.5) + " -0.12 0.04",
                    width: 0.38,
                    height: 0.26,
                    label: level,
                    color: active ? "#bbf7d0" : "#ffffff",
                    textColor: active ? "#166534" : "#0f172a",
                    textScale: "0.5 0.5 0.5",
                    wrapCount: "4",
                    onClick: function () {
                        runtime.selectedLevel = level;
                        runtime.renderVrPrompt(panelApi);
                    }
                });
            });

            panelApi.addButton(panelApi.root, {
                position: "0 -0.48 0.04",
                width: 1.02,
                height: 0.22,
                label: "Start experience",
                disabled: !runtime.selectedLevel,
                color: "#5cc887",
                textScale: "0.36 0.36 0.36",
                onClick: function () {
                    if (!runtime.selectedLevel) {
                        return;
                    }
                    runtime.applyLevel(runtime.selectedLevel);
                    runtime.hidePrompt();
                }
            });

            if (typeof panelApi.refreshTargets === "function") {
                panelApi.refreshTargets();
            }
        };

        runtime.showVrPrompt = function () {
            const overlayApi = window.VRODOSRuntimeOverlay || null;
            if (!overlayApi || !overlayApi.shouldUseVrPanel || !overlayApi.shouldUseVrPanel()) {
                return false;
            }

            runtime.hideDomPrompt();
            if (runtime.vrPromptActive && runtime.vrPanelApi) {
                runtime.renderVrPrompt(runtime.vrPanelApi);
                return true;
            }

            runtime.vrPromptActive = true;
            runtime.vrPanelApi = overlayApi.openVrPanel({
                id: "vrodos-immerse-cefr-vr-overlay",
                width: 2.42,
                height: 1.42,
                distance: 3.05,
                verticalOffset: -0.08,
                lockInteraction: false,
                retargetRaycasters: false,
                cleanup: function () {
                    runtime.vrPromptActive = false;
                    runtime.vrPanelApi = null;
                },
                render: function (api) {
                    runtime.vrPanelApi = api;
                    runtime.renderVrPrompt(api);
                }
            });

            if (!runtime.vrPanelApi) {
                runtime.vrPromptActive = false;
            }
            return Boolean(runtime.vrPanelApi);
        };

        runtime.showPrompt = function () {
            if (runtime.showVrPrompt()) {
                return;
            }

            if (runtime.isImmersiveVrActive()) {
                runtime.hideDomPrompt();
                window.setTimeout(() => {
                    if (!runtime.levelApplied) {
                        runtime.showPrompt();
                    }
                }, 180);
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
                runtime.vrPanelApi = null;
            }
            runtime.hideDomPrompt();
        };

        runtime.bindPresentationEvents = function () {
            if (runtime.presentationEventsBound) {
                return;
            }

            const bind = function () {
                const scene = document.querySelector("a-scene");
                if (!scene) {
                    window.setTimeout(bind, 120);
                    return;
                }

                runtime.presentationEventsBound = true;
                scene.addEventListener("enter-vr", () => {
                    if (!runtime.levelApplied && runtime.elements.length) {
                        window.setTimeout(() => runtime.showPrompt(), 160);
                    }
                });
                scene.addEventListener("exit-vr", () => {
                    if (!runtime.levelApplied && runtime.vrPromptActive) {
                        runtime.hidePrompt();
                        window.setTimeout(() => runtime.showPrompt(), 120);
                    }
                });
            };

            bind();
        };

        runtime.schedulePrompt = function () {
            if (runtime.promptScheduled) {
                return;
            }

            runtime.promptScheduled = true;
            runtime.bindPresentationEvents();

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
