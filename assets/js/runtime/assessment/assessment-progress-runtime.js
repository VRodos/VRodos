(function () {
    "use strict";

    const namespace = window.VRodosImmerseAssessment = window.VRodosImmerseAssessment || {};

    function getAssessmentProgressRuntime() {
        if (window.__vrodosAssessmentProgressRuntime) return window.__vrodosAssessmentProgressRuntime;

        const session = namespace.getAssessmentSessionRuntime();
        const runtime = { label: null, modalOpen: false, spatialLoadPending: false, dialogObserver: null, progress: { completed: 0, total: 0, level: "" } };
        const scene = document.querySelector("a-scene");
        const resources = window.VRODOSMaster && window.VRODOSMaster.RuntimeResources
            ? window.VRODOSMaster.RuntimeResources.createRegistry() : null;

        runtime.ensureLabel = function () {
            if (runtime.label) return runtime.label;
            const label = document.createElement("div");
            label.id = "vrodos-assessment-progress";
            label.setAttribute("aria-live", "polite");
            Object.assign(label.style, {
                position: "fixed", top: "16px", right: "16px", zIndex: "1000",
                padding: "7px 11px", borderRadius: "999px", pointerEvents: "none",
                background: "rgba(15,23,42,0.58)", color: "#fff",
                font: "500 12px/1.3 system-ui, sans-serif", letterSpacing: "0.01em",
                display: "none"
            });
            document.body.appendChild(label);
            runtime.label = label;
            return label;
        };

        runtime.isImmersive = function () {
            const overlay = window.VRODOSRuntimeOverlay;
            return Boolean(overlay && overlay.shouldUseVrPanel && overlay.shouldUseVrPanel());
        };

        runtime.update = function () {
            const { completed, total, level } = runtime.progress;
            const visible = Boolean(level && total > 0 && !runtime.modalOpen);
            const text = "Assessments " + completed + " / " + total;
            const label = runtime.ensureLabel();
            label.textContent = text;
            const dialogOpen = Boolean(document.querySelector("dialog[open]"));
            label.style.display = visible && !dialogOpen && !runtime.isImmersive() ? "block" : "none";

            const spatial = window.VRODOSSpatialUI;
            if (spatial && typeof spatial.setAssessmentProgress === "function") {
                spatial.setAssessmentProgress(visible && runtime.isImmersive() ? text : "");
            } else if (visible && runtime.isImmersive()) {
                const overlay = window.VRODOSRuntimeOverlay;
                const load = overlay && (overlay.prewarmSpatialUiRuntime || overlay.ensureSpatialUiRuntime);
                if (typeof load === "function" && !runtime.spatialLoadPending) {
                    runtime.spatialLoadPending = true;
                    Promise.resolve(load.call(overlay)).then((available) => {
                        runtime.spatialLoadPending = false;
                        if (available) runtime.update();
                    }, () => { runtime.spatialLoadPending = false; });
                }
            }
        };

        runtime.setModalOpen = function (open) {
            runtime.modalOpen = Boolean(open);
            runtime.update();
        };

        runtime.dispose = function () {
            if (resources) resources.disposeAll();
            if (runtime.dialogObserver) runtime.dialogObserver.disconnect();
            if (window.VRODOSSpatialUI && window.VRODOSSpatialUI.setAssessmentProgress) {
                window.VRODOSSpatialUI.setAssessmentProgress("");
            }
            if (runtime.label) runtime.label.remove();
            runtime.label = null;
        };

        session.subscribeProgress((progress) => {
            runtime.progress = progress;
            runtime.update();
        });
        if (scene && resources) {
            resources.listen(scene, "enter-vr", () => runtime.update());
            resources.listen(scene, "exit-vr", () => runtime.update());
        }
        if (typeof MutationObserver !== "undefined" && document.body) {
            runtime.dialogObserver = new MutationObserver(() => runtime.update());
            runtime.dialogObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
        }
        if (resources) resources.listen(window, "pagehide", () => runtime.dispose());
        window.__vrodosAssessmentProgressRuntime = runtime;
        return runtime;
    }

    namespace.getAssessmentProgressRuntime = getAssessmentProgressRuntime;
})();
