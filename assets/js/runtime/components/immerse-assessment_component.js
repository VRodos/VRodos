(function () {
    "use strict";

    const namespace = window.VRodosImmerseAssessment = window.VRodosImmerseAssessment || {};

    function payloadFromElement(element) {
        const title = namespace.decodeDisplayText(element.getAttribute("data-assessment-title") || "Assessment");
        const type = namespace.decodeDisplayText(element.getAttribute("data-assessment-type") || "");
        const group = namespace.decodeDisplayText(element.getAttribute("data-assessment-group") || "");
        const supported = element.getAttribute("data-assessment-supported") === "true";
        const encodedContent = element.getAttribute("data-assessment-content") || "";
        const content = namespace.decodeBase64Json(encodedContent, {});
        const levels = namespace.decodeBase64Json(element.getAttribute("data-assessment-levels"), []);
        const assetId = Number(element.getAttribute("data-assessment-asset-id") || "0") || 0;
        const assessmentSourceId = element.getAttribute("data-assessment-source-id") || "";

        return {
            sourceId: element.getAttribute("data-vrodos-scene-object-id") || element.id || "",
            sceneObjectId: element.getAttribute("data-vrodos-scene-object-id") || element.id || "",
            assetId,
            assessmentSourceId,
            immerseAssessmentId: assessmentSourceId,
            projectId: Number(element.getAttribute("data-vrodos-project-id") || "0") || 0,
            sceneId: Number(element.getAttribute("data-vrodos-scene-id") || "0") || 0,
            sceneTitle: namespace.decodeDisplayText(element.getAttribute("data-vrodos-scene-title") || ""),
            title,
            type,
            group,
            supported,
            content,
            contentEncodedLength: encodedContent.length,
            levels,
            anchorElement: element
        };
    }

    if (typeof AFRAME !== "undefined") {
        AFRAME.registerComponent("immerse-assessment-launcher", {
            init: function () {
                namespace.getCefrRuntime().register(this.el);

                this.onClick = () => {
                    const runtime = namespace.getOverlayRuntime();
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
                namespace.getCefrRuntime().register(this.el);
            }
        });
    }
})();
