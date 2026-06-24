(function () {
    "use strict";

    const namespace = window.VRodosImmerseAssessment = window.VRodosImmerseAssessment || {};
    const CEFR_LEVELS = namespace.CEFR_LEVELS || ["A1", "A2", "B1", "B2"];
    const decodeBase64Json = namespace.decodeBase64Json;
    const normalizeLevel = namespace.normalizeLevel;
    const normalizeLevels = namespace.normalizeLevels;
    const VR_PROMPT_RETRY_DELAY_MS = 250;
    const VR_PROMPT_RETRY_LIMIT = 240;
    const VR_PROMPT_XR_OPEN_DELAYS_MS = [0, 80, 180, 400, 900];
    const VR_PANEL_WIDTH = 2.12;
    const VR_PANEL_HEIGHT = 1.42;
    const VR_PANEL_DISTANCE = 2.05;
    const VR_PANEL_VERTICAL_OFFSET = -0.04;
    const VR_KICKER_SIZE = 24;
    const VR_LEVEL_BUTTON_TEXT_SIZE = 34;
    const VR_START_BUTTON_TEXT_SIZE = 26;

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

    function getAssessmentSessionRuntime() {
        return typeof namespace.getAssessmentSessionRuntime === "function"
            ? namespace.getAssessmentSessionRuntime()
            : null;
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

    function isLoaderOverlayVisible(overlay) {
        if (!overlay || !overlay.isConnected) {
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
            participantName: "",
            selectedButton: null,
            root: null,
            participantInput: null,
            continueButton: null,
            initialized: false,
            promptScheduled: false,
            vrPromptActive: false,
            vrPanelApi: null,
            levelApplied: false,
            presentationEventsBound: false,
            vrPromptRetryCount: 0,
            spatialUiLoadPending: false,
            spatialUiFontWarmupPending: false,
            spatialUiFontsReady: false,
            spatialUiFontWarmupPromise: null,
            vrLevelButtons: {},
            vrNameInput: null,
            vrStartButton: null,
            xrSessionEventsBound: false,
            pendingVrPromptLock: false
        };

        runtime.register = function (element) {
            if (!element || runtime.elements.includes(element)) {
                return;
            }

            runtime.elements.push(element);
            element.removeAttribute("data-vrodos-delayed-reveal");
            setCefrControlledVisible(element, false);
            runtime.applyStoredIdentityIfAvailable();
            if (runtime.levelApplied && runtime.selectedLevel) {
                setCefrControlledVisible(element, runtime.matchesLevel(element, runtime.selectedLevel));
                return;
            }
            runtime.schedulePrompt();
        };

        runtime.requiresParticipantName = function () {
            const session = getAssessmentSessionRuntime();
            return Boolean(session && typeof session.isEnabled === "function" && session.isEnabled());
        };

        runtime.normalizedParticipantName = function () {
            return String(runtime.participantName || "").replace(/\s+/g, " ").trim();
        };

        runtime.canStart = function () {
            if (!runtime.selectedLevel) {
                return false;
            }
            return !runtime.requiresParticipantName() || Boolean(runtime.normalizedParticipantName());
        };

        runtime.applyStoredIdentityIfAvailable = function () {
            const session = getAssessmentSessionRuntime();
            if (!session || typeof session.hasIdentity !== "function" || !session.hasIdentity()) {
                return false;
            }
            const identity = typeof session.getIdentity === "function" ? session.getIdentity() : {};
            const level = normalizeLevel(identity.cefrLevel || "");
            if (!level) {
                return false;
            }
            runtime.participantName = String(identity.displayName || "");
            runtime.applyLevel(level);
            return true;
        };

        runtime.startExperience = function () {
            if (!runtime.canStart()) {
                return;
            }
            const session = getAssessmentSessionRuntime();
            if (session && typeof session.setIdentity === "function" && runtime.requiresParticipantName()) {
                session.setIdentity(runtime.normalizedParticipantName(), runtime.selectedLevel);
            }
            runtime.applyLevel(runtime.selectedLevel);
            runtime.hidePrompt();
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

            const nameWrap = document.createElement("label");
            nameWrap.style.display = runtime.requiresParticipantName() ? "block" : "none";
            nameWrap.style.marginBottom = "18px";
            nameWrap.style.fontSize = "12px";
            nameWrap.style.fontWeight = "800";
            nameWrap.style.color = "#475569";
            nameWrap.style.letterSpacing = "0.08em";
            nameWrap.style.textTransform = "uppercase";
            nameWrap.textContent = "Name";

            const nameInput = document.createElement("input");
            nameInput.type = "text";
            nameInput.autocomplete = "name";
            nameInput.placeholder = "Enter your name";
            nameInput.value = runtime.participantName || "";
            nameInput.style.display = "block";
            nameInput.style.width = "100%";
            nameInput.style.boxSizing = "border-box";
            nameInput.style.marginTop = "8px";
            nameInput.style.border = "1px solid rgba(203, 213, 225, 0.95)";
            nameInput.style.borderRadius = "16px";
            nameInput.style.padding = "13px 14px";
            nameInput.style.fontSize = "16px";
            nameInput.style.fontWeight = "700";
            nameInput.style.color = "#0f172a";
            nameInput.style.background = "#ffffff";
            nameInput.addEventListener("input", () => {
                runtime.setParticipantName(nameInput.value);
            });
            nameWrap.appendChild(nameInput);

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
                runtime.startExperience();
            });

            footer.appendChild(continueButton);
            panel.appendChild(nameWrap);
            panel.appendChild(buttonRow);
            panel.appendChild(footer);
            root.appendChild(panel);
            ensureDomOverlayParent(root);

            runtime.root = root;
            runtime.participantInput = nameInput;
            runtime.participantInputWrap = nameWrap;
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

        runtime.setPendingVrPromptLock = function (locked) {
            const overlayApi = window.VRODOSRuntimeOverlay || null;
            if (!overlayApi || typeof overlayApi.lockSceneInteraction !== "function") {
                return;
            }
            const shouldLock = Boolean(locked);
            if (runtime.pendingVrPromptLock === shouldLock) {
                return;
            }
            runtime.pendingVrPromptLock = shouldLock;
            overlayApi.lockSceneInteraction(shouldLock, { preserveLookInVr: true });
            recordVrDiagnostic("debug", "CEFR VR pending prompt interaction lock changed", {
                locked: shouldLock
            });
        };

        runtime.isSceneReadyForPrompt = function () {
            const scene = document.querySelector("a-scene");
            if (!scene || !scene.hasLoaded) {
                return false;
            }

            const loader = scene.components && scene.components["vrodos-scene-loader"];
            if (loader && loader.isReady !== true) {
                return false;
            }

            const loaderOverlay = document.getElementById("vrodos-scene-loader-overlay");
            return !isLoaderOverlayVisible(loaderOverlay);
        };

        runtime.updateStartState = function () {
            if (runtime.participantInput) {
                runtime.participantInput.value = runtime.participantName || "";
            }
            if (runtime.participantInputWrap) {
                runtime.participantInputWrap.style.display = runtime.requiresParticipantName() ? "block" : "none";
            }

            const enabled = runtime.canStart();
            if (runtime.continueButton) {
                runtime.continueButton.style.opacity = enabled ? "1" : "0.55";
                runtime.continueButton.style.pointerEvents = enabled ? "auto" : "none";
            }
            if (runtime.vrStartButton && runtime.vrPanelApi && typeof runtime.vrPanelApi.updateButton === "function") {
                runtime.vrPanelApi.updateButton(runtime.vrStartButton, runtime.vrStartButtonOptions());
            }
        };

        runtime.setParticipantName = function (value) {
            runtime.participantName = String(value || "").replace(/\s+/g, " ").trimStart();
            runtime.updateStartState();
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

            runtime.updateStartState();
        };

        runtime.renderVrPrompt = function (api) {
            const panelApi = api || runtime.vrPanelApi;
            if (!panelApi) {
                return;
            }

            runtime.vrLevelButtons = {};
            runtime.vrStartButton = null;

            const frame = panelApi.frame({
                title: "Choose your level",
                showClose: false,
                paddingX: 64,
                paddingY: 34,
                gapY: 22,
                primary: runtime.vrStartButtonOptions()
            });
            runtime.vrStartButton = frame.primaryButton || null;
            panelApi.text(frame.content, {
                text: "CEFR Level",
                color: "#2563eb",
                fontSize: VR_KICKER_SIZE,
                fontWeight: 800,
                lineHeight: "118%",
                whiteSpace: "normal"
            });

            if (runtime.requiresParticipantName()) {
                if (typeof panelApi.inputField === "function") {
                    runtime.vrNameInput = panelApi.inputField(frame.content, {
                        label: "Name",
                        placeholder: "Enter your name",
                        defaultValue: runtime.participantName || "",
                        width: "100%",
                        minHeight: 96,
                        fontSize: 30,
                        labelFontSize: 20,
                        inputFontSize: 30,
                        inputHeight: 54,
                        onValueChange: function (value) {
                            runtime.setParticipantName(value);
                        }
                    });
                } else {
                    panelApi.text(frame.content, {
                        text: "Name entry is unavailable in this runtime.",
                        color: "#b45309",
                        fontSize: 24,
                        lineHeight: "120%"
                    });
                }
            }

            const levelRow = panelApi.row(frame.content, {
                gapColumn: 20,
                justifyContent: "center",
                alignItems: "stretch",
                width: "100%",
                minHeight: 90
            });
            CEFR_LEVELS.forEach((level, index) => {
                const button = panelApi.button(levelRow, Object.assign(
                    runtime.vrLevelButtonOptions(level, index),
                    {
                        onClick: function () {
                            runtime.selectVrLevel(level, panelApi);
                        }
                    }
                ));
                runtime.vrLevelButtons[level] = button;
            });

            if (typeof panelApi.refreshTargets === "function") {
                panelApi.refreshTargets();
            }
            recordVrDiagnostic("debug", "rendered CEFR VR prompt", {
                selectedLevel: runtime.selectedLevel || "",
                panelApi: panelApi.__spatialUi ? "spatial-ui" : "unavailable"
            });
        };

        runtime.vrLevelButtonOptions = function (level, index) {
            const active = level === runtime.selectedLevel;
            return {
                label: String(level || "").trim() || "L" + (index + 1),
                variant: active ? "positive" : "secondary",
                width: 148,
                height: 88,
                minHeight: 88,
                textSize: VR_LEVEL_BUTTON_TEXT_SIZE,
                fontWeight: 800,
                textColor: active ? "#ffffff" : "#0f172a"
            };
        };

        runtime.vrStartButtonOptions = function () {
            return {
                label: "Start experience",
                variant: "primary",
                disabled: !runtime.canStart(),
                width: 360,
                height: 66,
                textSize: VR_START_BUTTON_TEXT_SIZE,
                fontWeight: 800,
                textColor: runtime.canStart() ? "#ffffff" : "rgba(39,39,39,0.35)",
                onClick: function () {
                    runtime.startExperience();
                }
            };
        };

        runtime.updateVrPromptSelection = function (panelApi, previousLevel) {
            if (!panelApi || typeof panelApi.updateButton !== "function") {
                runtime.renderVrPrompt(panelApi);
                return;
            }

            const levelsToUpdate = new Set();
            if (previousLevel) {
                levelsToUpdate.add(previousLevel);
            }
            if (runtime.selectedLevel) {
                levelsToUpdate.add(runtime.selectedLevel);
            }

            levelsToUpdate.forEach((level) => {
                const index = CEFR_LEVELS.indexOf(level);
                const button = runtime.vrLevelButtons[level];
                if (button && index > -1) {
                    panelApi.updateButton(button, runtime.vrLevelButtonOptions(level, index));
                }
            });
            if (runtime.vrStartButton) {
                panelApi.updateButton(runtime.vrStartButton, runtime.vrStartButtonOptions());
            }
            if (typeof panelApi.refreshTargets === "function") {
                panelApi.refreshTargets();
            }
            recordVrDiagnostic("debug", "updated CEFR VR prompt selection", {
                selectedLevel: runtime.selectedLevel || "",
                panelApi: panelApi.__spatialUi ? "spatial-ui" : "unavailable"
            });
        };

        runtime.selectVrLevel = function (level, panelApi) {
            const nextLevel = normalizeLevel(level);
            if (!nextLevel || runtime.selectedLevel === nextLevel) {
                return;
            }
            const previousLevel = runtime.selectedLevel;
            runtime.selectedLevel = nextLevel;
            runtime.updateVrPromptSelection(panelApi || runtime.vrPanelApi, previousLevel);
        };

        runtime.prewarmSpatialUiFonts = function (spatialUi) {
            if (runtime.spatialUiFontsReady) {
                return true;
            }
            if (!spatialUi || typeof spatialUi.prewarm !== "function") {
                runtime.spatialUiFontsReady = true;
                return true;
            }
            if (runtime.spatialUiFontWarmupPending) {
                return true;
            }

            const prewarmResult = spatialUi.prewarm();
            if (!prewarmResult || typeof prewarmResult.then !== "function") {
                runtime.spatialUiFontsReady = true;
                return true;
            }

            runtime.spatialUiFontWarmupPending = true;
            runtime.spatialUiFontWarmupPromise = prewarmResult;
            recordVrDiagnostic("debug", "CEFR VR prompt started spatial UI font prewarm in the background", {});
            prewarmResult.then((available) => {
                runtime.spatialUiFontsReady = true;
                if (available === false) {
                    recordVrDiagnostic("warn", "CEFR VR prompt spatial font prewarm returned fallback state", {});
                }
            }).catch((error) => {
                runtime.spatialUiFontsReady = true;
                recordVrDiagnostic("warn", "CEFR VR prompt font prewarm failed; opening with spatial UI fallback font", {
                    error: error && error.message || String(error)
                });
            }).finally(() => {
                runtime.spatialUiFontWarmupPending = false;
                runtime.spatialUiFontWarmupPromise = null;
            });
            return true;
        };

        runtime.showVrPrompt = function () {
            const overlayApi = window.VRODOSRuntimeOverlay || null;
            const shouldUseVrPanel = overlayApi && typeof overlayApi.shouldUseVrPanel === "function"
                ? overlayApi.shouldUseVrPanel()
                : runtime.isImmersiveVrActive();
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
                return true;
            }

            const panelOptions = {
                id: "vrodos-immerse-cefr-vr-overlay",
                width: VR_PANEL_WIDTH,
                height: VR_PANEL_HEIGHT,
                distance: VR_PANEL_DISTANCE,
                verticalOffset: VR_PANEL_VERTICAL_OFFSET,
                centerAtEyeLevel: true,
                anchorRefreshFrames: 2,
                lockInteraction: true,
                trimControllerRays: true,
                showRayHitDot: true,
                blockSceneRaycasts: true,
                useImmediateFont: true,
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
                runtime.setPendingVrPromptLock(true);
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

            runtime.prewarmSpatialUiFonts(spatialUi);

            runtime.vrPromptActive = true;
            runtime.vrPanelApi = spatialUi.openPanel(panelOptions);

            if (!runtime.vrPanelApi) {
                runtime.vrPromptActive = false;
            } else {
                runtime.pendingVrPromptLock = false;
            }
            recordVrDiagnostic(runtime.vrPanelApi || runtime.vrPromptRetryCount === 0 || runtime.vrPromptRetryCount % 20 === 0 ? (runtime.vrPanelApi ? "debug" : "warn") : "debug", "CEFR VR prompt open result", {
                opened: Boolean(runtime.vrPanelApi),
                panelApi: runtime.vrPanelApi && runtime.vrPanelApi.__spatialUi ? "spatial-ui" : "unavailable"
            });
            return Boolean(runtime.vrPanelApi);
        };

        runtime.scheduleVrPromptRetry = function (delayMs) {
            const parsedDelay = Number(delayMs);
            const delay = Number.isFinite(parsedDelay)
                ? Math.max(0, parsedDelay)
                : VR_PROMPT_RETRY_DELAY_MS;
            window.setTimeout(() => {
                if (!runtime.levelApplied && runtime.isImmersiveVrActive()) {
                    runtime.showPrompt();
                }
            }, delay);
        };

        runtime.showPrompt = function () {
            if (!runtime.isSceneReadyForPrompt()) {
                if (runtime.isImmersiveVrActive()) {
                    runtime.hideDomPrompt();
                    runtime.setPendingVrPromptLock(true);
                    runtime.scheduleVrPromptRetry(120);
                }
                return;
            }

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
            runtime.setPendingVrPromptLock(false);
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
                        runtime.setPendingVrPromptLock(true);
                        runtime.hideDomPrompt();
                        VR_PROMPT_XR_OPEN_DELAYS_MS.forEach((delay) => {
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
                    } else {
                        runtime.setPendingVrPromptLock(false);
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

            const waitForSceneReady = () => {
                if (!runtime.isSceneReadyForPrompt()) {
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
