(function () {
    "use strict";

    const namespace = window.VRodosImmerseAssessment = window.VRodosImmerseAssessment || {};
    const decodeDisplayText = namespace.decodeDisplayText;
    const buildAssessmentResult = namespace.buildAssessmentResult;
    const renderEmptyState = namespace.renderEmptyState;
    const resolveRenderer = namespace.resolveRenderer;

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


    function setAttributeEnabled(el, attrName, enabled) {
        if (!el) {
            return;
        }

        const hasComponent = Boolean(el.components && el.components[attrName]);
        const hasAttribute = el.hasAttribute && el.hasAttribute(attrName);
        if (!hasComponent && !hasAttribute) {
            return;
        }

        if (hasComponent) {
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


    namespace.getOverlayRuntime = getOverlayRuntime;
    namespace.getOverlayRuntimeV2 = getOverlayRuntimeV2;
    namespace.setAssessmentSceneInteractionLocked = setAssessmentSceneInteractionLocked;
})();
