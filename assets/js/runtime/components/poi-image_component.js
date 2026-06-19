function vrodosPoiImageHasValidUrl(url) {
    if (!url) return false;
    const normalized = String(url).trim().toLowerCase();
    return normalized !== '' && normalized !== 'false' && normalized !== 'null' && normalized !== 'undefined' && normalized !== '0';
}

AFRAME.registerComponent('info-panel', {
    schema: { type: "string", default: "" },

    init: function () {
        this.buttonEl = document.querySelector('#button_poi_' + this.data) || this.el;
        this.scen = document.querySelector('#aframe-scene-container');
        this.spatialPoiPanelApi = null;
        this.spatialPoiLoadPending = false;
        this.spatialPoiDescriptionPages = [];
        this.spatialPoiPage = 0;

        this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
        this.onVrExit = this.onVrExit.bind(this);

        if (this.buttonEl) {
            this.buttonEl.addEventListener('click', this.onMenuButtonClick);
        }
        if (this.scen) {
            this.scen.addEventListener('exit-vr', this.onVrExit);
        }
    },

    remove: function () {
        this.closeSpatialPoiPanel("component-remove");
        if (this.buttonEl) {
            this.buttonEl.removeEventListener('click', this.onMenuButtonClick);
        }
        if (this.scen) {
            this.scen.removeEventListener('exit-vr', this.onVrExit);
        }
    },

    shouldUseVrOverlay: function () {
        if (window.VRODOSRuntimeOverlay && typeof window.VRODOSRuntimeOverlay.shouldUseVrPanel === "function") {
            return window.VRODOSRuntimeOverlay.shouldUseVrPanel();
        }

        return Boolean(browsingModeVR);
    },

    onVrExit: function () {
        this.closeSpatialPoiPanel("exit-vr");
    },

    getSpatialUiApi: function () {
        const spatialUi = window.VRODOSSpatialUI || null;
        return spatialUi && typeof spatialUi.isAvailable === "function" && spatialUi.isAvailable()
            ? spatialUi
            : null;
    },

    recordSpatialPoiDiagnostic: function (level, message, details) {
        const spatialUi = window.VRODOSSpatialUI || null;
        if (spatialUi && typeof spatialUi.recordDiagnostic === "function") {
            spatialUi.recordDiagnostic(level || "info", "poi-image: " + (message || ""), details || {});
            return;
        }
        const overlayApi = window.VRODOSRuntimeOverlay || null;
        if (overlayApi && typeof overlayApi.recordDiagnostic === "function") {
            overlayApi.recordDiagnostic(level || "info", "poi-image: " + (message || ""), details || {});
        }
    },

    getLegacyElementTextValue: function (selector, fallbackAttribute) {
        const el = document.querySelector(selector);
        if (!el || typeof el.getAttribute !== "function") {
            return "";
        }

        const textAttr = el.getAttribute("text");
        if (textAttr && typeof textAttr === "object" && textAttr.value) {
            return textAttr.value;
        }

        const directValue = el.getAttribute("value");
        if (directValue) {
            return directValue;
        }

        return fallbackAttribute ? (el.getAttribute(fallbackAttribute) || "") : "";
    },

    getPoiTitleText: function () {
        return this.buttonEl && this.buttonEl.getAttribute("data-vrodos-poi-title")
            ? this.buttonEl.getAttribute("data-vrodos-poi-title")
            : (this.getLegacyElementTextValue("#title_" + this.data, "title_to_add") || "Info");
    },

    getPoiDescriptionText: function () {
        return this.buttonEl && this.buttonEl.getAttribute("data-vrodos-poi-description")
            ? this.buttonEl.getAttribute("data-vrodos-poi-description")
            : this.getLegacyElementTextValue("#desc_" + this.data, "text_to_add");
    },

    getPoiImageUrl: function () {
        if (this.buttonEl && this.buttonEl.getAttribute("data-vrodos-poi-image-src")) {
            return this.buttonEl.getAttribute("data-vrodos-poi-image-src");
        }
        const legacyAsset = document.querySelector("#main_img_" + this.data);
        return legacyAsset && typeof legacyAsset.getAttribute === "function"
            ? legacyAsset.getAttribute("src")
            : "";
    },

    buildSpatialDescriptionPages: function () {
        const text = this.getPoiDescriptionText();
        const maxLength = 420;
        if (!text || text.length <= maxLength) {
            return text ? [text] : [];
        }

        const pages = [];
        let cursor = 0;
        while (cursor < text.length) {
            let next = Math.min(text.length, cursor + maxLength);
            if (next < text.length) {
                const breakIndex = text.lastIndexOf(" ", next);
                if (breakIndex > cursor + 120) {
                    next = breakIndex;
                }
            }
            pages.push(text.slice(cursor, next).trim());
            cursor = next;
            while (text[cursor] === " ") {
                cursor += 1;
            }
        }

        return pages.filter(Boolean);
    },

    closeSpatialPoiPanel: function (reason) {
        if (!this.spatialPoiPanelApi) {
            return;
        }

        const spatialUi = window.VRODOSSpatialUI || null;
        if (spatialUi && typeof spatialUi.closePanel === "function") {
            spatialUi.closePanel(reason || "poi-close");
        } else if (this.spatialPoiPanelApi && typeof this.spatialPoiPanelApi.close === "function") {
            this.spatialPoiPanelApi.close(reason || "poi-close");
        }
        this.spatialPoiPanelApi = null;
    },

    renderSpatialPoiPanel: function () {
        const api = this.spatialPoiPanelApi;
        if (!api || typeof api.frame !== "function") {
            return;
        }

        const pages = this.spatialPoiDescriptionPages || [];
        const pageIndex = Math.max(0, Math.min(this.spatialPoiPage || 0, Math.max(0, pages.length - 1)));
        const imageUrl = this.getPoiImageUrl();
        const frame = api.frame({
            title: this.getPoiTitleText(),
            status: pages.length > 1 ? "Page " + (pageIndex + 1) + " of " + pages.length : "",
            paddingX: 78,
            paddingY: 58,
            gapY: 24,
            primary: {
                label: "Close",
                variant: "secondary",
                onClick: () => {
                    this.closeSpatialPoiPanel("poi-close");
                }
            },
            onClose: () => {
                this.closeSpatialPoiPanel("poi-close");
            }
        });

        if (vrodosPoiImageHasValidUrl(imageUrl)) {
            api.image(frame.content, {
                src: imageUrl,
                width: 820,
                height: pages.length ? 310 : 520,
                objectFit: "contain",
                borderRadius: 14
            });
        }

        if (pages[pageIndex]) {
            api.text(frame.content, {
                text: pages[pageIndex],
                color: "#0f172a",
                fontSize: 31,
                lineHeight: "128%",
                width: "100%"
            });
        }

        if (pages.length > 1) {
            const nav = api.row(frame.content, {
                justifyContent: "center",
                gapColumn: 24,
                width: "100%"
            });
            api.button(nav, {
                label: "Prev",
                variant: "secondary",
                disabled: pageIndex <= 0,
                width: 190,
                height: 62,
                textSize: 26,
                onClick: () => {
                    this.spatialPoiPage = Math.max(0, pageIndex - 1);
                    this.renderSpatialPoiPanel();
                }
            });
            api.button(nav, {
                label: "Next",
                variant: "primary",
                disabled: pageIndex >= pages.length - 1,
                width: 190,
                height: 62,
                textSize: 26,
                onClick: () => {
                    this.spatialPoiPage = Math.min(pages.length - 1, pageIndex + 1);
                    this.renderSpatialPoiPanel();
                }
            });
        }
    },

    openSpatialPoiPanel: function () {
        const spatialUi = this.getSpatialUiApi();
        const diagnostics = {
            id: this.data || "",
            title: this.getPoiTitleText(),
            hasImage: vrodosPoiImageHasValidUrl(this.getPoiImageUrl()),
            descriptionLength: this.getPoiDescriptionText().length
        };

        if (!spatialUi) {
            const overlayApi = window.VRODOSRuntimeOverlay || null;
            const loadSpatialUiRuntime = overlayApi && (
                typeof overlayApi.prewarmSpatialUiRuntime === "function"
                    ? overlayApi.prewarmSpatialUiRuntime.bind(overlayApi)
                    : (typeof overlayApi.ensureSpatialUiRuntime === "function"
                        ? overlayApi.ensureSpatialUiRuntime.bind(overlayApi)
                        : null)
            );
            if (loadSpatialUiRuntime && !this.spatialPoiLoadPending) {
                this.spatialPoiLoadPending = true;
                loadSpatialUiRuntime({ timeoutMs: 8000 }).then((available) => {
                    this.spatialPoiLoadPending = false;
                    if (available && this.shouldUseVrOverlay()) {
                        this.openSpatialPoiPanel();
                    } else if (!available) {
                        this.recordSpatialPoiDiagnostic("warn", "spatial UI runtime could not be loaded for immersive POI panel", diagnostics);
                    }
                });
            }
            this.recordSpatialPoiDiagnostic("warn", "spatial UI unavailable; suppressing legacy immersive POI panel", diagnostics);
            return true;
        }

        this.closeSpatialPoiPanel("replace");
        this.spatialPoiPage = 0;
        this.spatialPoiDescriptionPages = this.buildSpatialDescriptionPages();
        this.spatialPoiPanelApi = spatialUi.openPanel({
            id: "vrodos-poi-image-vr-" + (this.data || "panel"),
            width: 1.95,
            height: 1.38,
            distance: 1.8,
            verticalOffset: 0,
            centerAtEyeLevel: true,
            anchorRefreshFrames: 2,
            lockInteraction: true,
            trimControllerRays: true,
            showRayHitDot: true,
            blockSceneRaycasts: true,
            cleanup: () => {
                this.spatialPoiPanelApi = null;
            },
            render: (api) => {
                this.spatialPoiPanelApi = api;
                this.renderSpatialPoiPanel();
            }
        });

        this.recordSpatialPoiDiagnostic(this.spatialPoiPanelApi ? "debug" : "warn", "spatial POI panel open result", Object.assign({}, diagnostics, {
            opened: Boolean(this.spatialPoiPanelApi)
        }));
        return true;
    },

    onMenuButtonClick: function (evt) {
        if (evt.detail && evt.detail.originalEvent && evt.detail.originalEvent.button !== undefined) {
            if (evt.detail.originalEvent.button !== 0) return;
        }

        if (typeof window.gtag === 'function') {
            window.gtag('event', 'poiimgtext_open');
        }

        if (this.shouldUseVrOverlay()) {
            this.openSpatialPoiPanel();
            return;
        }

        const titleEl = document.getElementById("poi-img-dialog-title");
        const imageEl = document.getElementById("poi-img-dialog-image");
        const descriptionEl = document.getElementById("poi-img-dialog-description");
        const imageUrl = this.getPoiImageUrl();

        if (titleEl) {
            titleEl.textContent = this.getPoiTitleText();
        }
        if (imageEl) {
            if (vrodosPoiImageHasValidUrl(imageUrl)) {
                imageEl.style.display = "inline";
                imageEl.src = imageUrl;
            } else {
                imageEl.style.display = "none";
                imageEl.removeAttribute("src");
            }
        }
        if (descriptionEl) {
            descriptionEl.textContent = this.getPoiDescriptionText();
        }

        let imageDialog = document.querySelector('#poi-img-dialog');
        if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.showDialog === 'function') {
            window.VRODOSMasterUI.showDialog(imageDialog);
        } else if (imageDialog && typeof imageDialog.showModal === 'function') {
            imageDialog.showModal();
        }
    }
});
