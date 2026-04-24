(function () {
    "use strict";

    const namespace = window.VRodosImmerseAssessment = window.VRodosImmerseAssessment || {};

    function payloadFromElement(element) {
        const title = namespace.decodeDisplayText(element.getAttribute("data-assessment-title") || "Assessment");
        const type = namespace.decodeDisplayText(element.getAttribute("data-assessment-type") || "");
        const group = namespace.decodeDisplayText(element.getAttribute("data-assessment-group") || "");
        const supported = element.getAttribute("data-assessment-supported") === "true";
        const content = namespace.decodeBase64Json(element.getAttribute("data-assessment-content"), {});
        const levels = namespace.decodeBase64Json(element.getAttribute("data-assessment-levels"), []);

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
