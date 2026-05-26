(function () {
    "use strict";

    const namespace = window.VRodosImmerseAssessment = window.VRodosImmerseAssessment || {};
    const CEFR_LEVELS = namespace.CEFR_LEVELS || ["A1", "A2", "B1", "B2"];
    const decodeBase64Json = namespace.decodeBase64Json;
    const normalizeLevel = namespace.normalizeLevel;
    const normalizeLevels = namespace.normalizeLevels;
    const VR_PROMPT_RETRY_DELAY_MS = 250;
    const VR_PROMPT_RETRY_LIMIT = 240;

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

    function getSpatialUiApi() {
        const spatialUi = window.VRODOSSpatialUI || null;
        return spatialUi && typeof spatialUi.isAvailable === "function" && spatialUi.isAvailable()
            ? spatialUi
            : null;
    }

    function recordVrDiagnostic(level, message, details) {
        const spatialUi = window.VRODOSSpatialUI || null;
        if (spatialUi && typeof spatialUi.recordDiagnostic === "function") {
            spatialUi.recordDiagnostic(level || "info", "cefr: " + (message || ""), details || {});
            return;
        }
        const overlayApi = window.VRODOSRuntimeOverlay || null;
        if (overlayApi && typeof overlayApi.recordDiagnostic === "function") {
            overlayApi.recordDiagnostic(level || "info", "cefr: " + (message || ""), details || {});
        }
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

    function isLoaderOverlayBlockingPrompt(overlay, startedAt) {
        if (!overlay || !overlay.isConnected) {
            return false;
        }
        if (performance.now() - startedAt > 12000) {
            return false;
        }
        const style = window.getComputedStyle ? window.getComputedStyle(overlay) : overlay.style;
        if (!style) {
            return true;
        }
        const opacity = Number(style.opacity);
        return style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.pointerEvents !== "none" &&
            (!Number.isFinite(opacity) || opacity > 0.01);
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
            presentationEventsBound: false,
            vrPromptRetryCount: 0,
            spatialUiLoadPending: false,
            xrSessionEventsBound: false
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
            const overlayApi = window.VRODOSRuntimeOverlay || null;
            if (overlayApi && typeof overlayApi.refreshRaycasters === "function") {
                overlayApi.refreshRaycasters();
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

            const frame = panelApi.frame({
                title: "Choose your level",
                showClose: false,
                headerColor: "#272727",
                headerHeight: 128,
                titleSize: 40,
                paddingX: 72,
                paddingY: 42,
                gapY: 26,
                footerHeight: 112,
                footerPaddingBottom: 42
            });
            panelApi.text(frame.content, {
                text: "CEFR Level",
                color: "#2563eb",
                fontSize: 32,
                fontWeight: 800,
                whiteSpace: "normal"
            });

            const levelRow = panelApi.row(frame.content, {
                gapColumn: 24,
                justifyContent: "center",
                alignItems: "stretch",
                width: "100%",
                marginTop: 10
            });
            CEFR_LEVELS.forEach((level, index) => {
                const active = level === runtime.selectedLevel;
                const label = String(level || "").trim() || "L" + (index + 1);
                panelApi.button(levelRow, {
                    label,
                    variant: active ? "positive" : "secondary",
                    width: 156,
                    height: 92,
                    textSize: 40,
                    fontWeight: 800,
                    textColor: active ? "#ffffff" : "#0f172a",
                    onClick: function () {
                        runtime.selectedLevel = level;
                        runtime.renderVrPrompt(panelApi);
                    }
                });
            });

            panelApi.button(frame.footer, {
                label: "Start experience",
                variant: "primary",
                disabled: !runtime.selectedLevel,
                width: 380,
                height: 74,
                textSize: 30,
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
            recordVrDiagnostic("debug", "rendered CEFR VR prompt", {
                selectedLevel: runtime.selectedLevel || "",
                panelApi: panelApi.__spatialUi ? "spatial-ui" : "unavailable"
            });
        };

        runtime.showVrPrompt = function () {
            const overlayApi = window.VRODOSRuntimeOverlay || null;
            const fallbackBrowsingMode = (typeof window.browsingModeVR !== "undefined" && window.browsingModeVR) ||
                (typeof browsingModeVR !== "undefined" && browsingModeVR);
            const shouldUseVrPanel = overlayApi && typeof overlayApi.shouldUseVrPanel === "function"
                ? overlayApi.shouldUseVrPanel()
                : Boolean(fallbackBrowsingMode || runtime.isImmersiveVrActive());
            if (!shouldUseVrPanel) {
                recordVrDiagnostic("debug", "CEFR prompt using DOM because immersive XR is inactive", {
                    hasOverlayApi: Boolean(overlayApi),
                    presentationMode: overlayApi && typeof overlayApi.getPresentationMode === "function"
                        ? overlayApi.getPresentationMode()
                        : "unknown"
                });
                return false;
            }

            runtime.hideDomPrompt();
            if (runtime.vrPromptActive && runtime.vrPanelApi) {
                runtime.renderVrPrompt(runtime.vrPanelApi);
                return true;
            }

            runtime.vrPromptActive = true;
            const panelOptions = {
                id: "vrodos-immerse-cefr-vr-overlay",
                width: 1.85,
                height: 1.05,
                distance: 1.95,
                verticalOffset: -0.2,
                topAtEyeLevel: true,
                anchorRefreshFrames: 8,
                lockInteraction: false,
                cleanup: function () {
                    runtime.vrPromptActive = false;
                    runtime.vrPanelApi = null;
                },
                render: function (api) {
                    runtime.vrPanelApi = api;
                    runtime.renderVrPrompt(api);
                }
            };
            const spatialUi = getSpatialUiApi();
            if (!spatialUi) {
                runtime.vrPromptActive = false;
                if (overlayApi && typeof overlayApi.ensureSpatialUiRuntime === "function" && !runtime.spatialUiLoadPending) {
                    runtime.spatialUiLoadPending = true;
                    recordVrDiagnostic("debug", "CEFR VR prompt is loading spatial UI runtime on demand", {
                        hasSpatialUi: Boolean(window.VRODOSSpatialUI)
                    });
                    overlayApi.ensureSpatialUiRuntime({ timeoutMs: 12000 }).then((available) => {
                        runtime.spatialUiLoadPending = false;
                        if (available && !runtime.levelApplied) {
                            runtime.vrPromptRetryCount = 0;
                            runtime.showPrompt();
                        } else if (!available) {
                            recordVrDiagnostic("error", "CEFR VR prompt could not load spatial UI runtime", {
                                hasSpatialUi: Boolean(window.VRODOSSpatialUI)
                            });
                        }
                    });
                }
                recordVrDiagnostic(runtime.vrPromptRetryCount === 0 || runtime.vrPromptRetryCount % 20 === 0 ? "warn" : "debug", "CEFR VR prompt requires spatial UI; no A-Frame fallback will be opened", {
                    hasSpatialUi: Boolean(window.VRODOSSpatialUI)
                });
                return false;
            }
            runtime.vrPanelApi = spatialUi.openPanel(panelOptions);

            if (!runtime.vrPanelApi) {
                runtime.vrPromptActive = false;
            }
            recordVrDiagnostic(runtime.vrPanelApi || runtime.vrPromptRetryCount === 0 || runtime.vrPromptRetryCount % 20 === 0 ? (runtime.vrPanelApi ? "debug" : "warn") : "debug", "CEFR VR prompt open result", {
                opened: Boolean(runtime.vrPanelApi),
                panelApi: runtime.vrPanelApi && runtime.vrPanelApi.__spatialUi ? "spatial-ui" : "unavailable"
            });
            return Boolean(runtime.vrPanelApi);
        };

        runtime.scheduleVrPromptRetry = function (delayMs) {
            window.setTimeout(() => {
                if (!runtime.levelApplied && runtime.isImmersiveVrActive()) {
                    runtime.showPrompt();
                }
            }, Number(delayMs) || VR_PROMPT_RETRY_DELAY_MS);
        };

        runtime.showPrompt = function () {
            if (runtime.showVrPrompt()) {
                runtime.vrPromptRetryCount = 0;
                return;
            }

            if (runtime.isImmersiveVrActive()) {
                runtime.hideDomPrompt();
                if (runtime.spatialUiLoadPending) {
                    runtime.scheduleVrPromptRetry(350);
                    return;
                }
                runtime.vrPromptRetryCount += 1;
                if (runtime.vrPromptRetryCount > VR_PROMPT_RETRY_LIMIT) {
                    if (runtime.vrPromptRetryCount === VR_PROMPT_RETRY_LIMIT + 1 || runtime.vrPromptRetryCount % 40 === 0) {
                        recordVrDiagnostic("error", "CEFR VR prompt is still waiting for spatial UI/session readiness", {
                            attempts: runtime.vrPromptRetryCount
                        });
                    }
                    runtime.scheduleVrPromptRetry(2000);
                    return;
                }
                if (runtime.vrPromptRetryCount === 1 || runtime.vrPromptRetryCount % 20 === 0) {
                    recordVrDiagnostic("warn", "CEFR VR prompt retrying until immersive spatial UI is ready", {
                        attempts: runtime.vrPromptRetryCount
                    });
                }
                runtime.scheduleVrPromptRetry(VR_PROMPT_RETRY_DELAY_MS);
                return;
            }

            runtime.ensureUi();
            ensureDomOverlayParent(runtime.root);
            runtime.root.style.display = "flex";
            runtime.selectLevel(runtime.selectedLevel || "");
        };

        runtime.hidePrompt = function () {
            if (runtime.vrPromptActive && window.VRODOSSpatialUI && typeof window.VRODOSSpatialUI.closePanel === "function") {
                window.VRODOSSpatialUI.closePanel("cefr-start");
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
                const scheduleVrOpenAttempts = function () {
                    if (!runtime.levelApplied && runtime.elements.length) {
                        runtime.vrPromptRetryCount = 0;
                        runtime.hideDomPrompt();
                        [0, 250, 750, 1500, 3000].forEach((delay) => {
                            runtime.scheduleVrPromptRetry(delay);
                        });
                    }
                };

                scene.addEventListener("enter-vr", () => {
                    scheduleVrOpenAttempts();
                });
                scene.addEventListener("exit-vr", () => {
                    if (!runtime.levelApplied && runtime.vrPromptActive) {
                        runtime.hidePrompt();
                        window.setTimeout(() => runtime.showPrompt(), 120);
                    }
                });
                scene.addEventListener("loaded", () => {
                    if (runtime.isImmersiveVrActive()) {
                        scheduleVrOpenAttempts();
                    }
                });
                scene.addEventListener("vrodos-scene-loader-ready", () => {
                    if (runtime.isImmersiveVrActive()) {
                        scheduleVrOpenAttempts();
                    }
                });

                const bindXrSessionStart = function (attempt) {
                    if (runtime.xrSessionEventsBound) {
                        return;
                    }
                    const xr = scene.renderer && scene.renderer.xr;
                    if (xr && typeof xr.addEventListener === "function") {
                        xr.addEventListener("sessionstart", scheduleVrOpenAttempts);
                        runtime.xrSessionEventsBound = true;
                        return;
                    }
                    if ((attempt || 0) < 80) {
                        window.setTimeout(() => bindXrSessionStart((attempt || 0) + 1), 250);
                    }
                };
                bindXrSessionStart(0);
            };

            bind();
        };

        runtime.schedulePrompt = function () {
            if (runtime.promptScheduled) {
                return;
            }

            runtime.promptScheduled = true;
            runtime.bindPresentationEvents();
            const startedAt = performance.now();

            const waitForSceneReady = () => {
                const scene = document.querySelector("a-scene");
                const loaderOverlay = document.getElementById("vrodos-scene-loader-overlay");

                if (!scene || !scene.hasLoaded || isLoaderOverlayBlockingPrompt(loaderOverlay, startedAt)) {
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
