function vrodosPoiImageHasValidUrl(url) {
    if (!url) return false;
    const normalized = String(url).trim().toLowerCase();
    return normalized !== '' && normalized !== 'false' && normalized !== 'null' && normalized !== 'undefined' && normalized !== '0';
}

AFRAME.registerComponent('info-panel', {
    schema: { type: "string", default: "default value" },
    init: function () {

        this.ImageEl = document.querySelector('#top_img_' + this.data);
        this.ImageAsset = document.querySelector('#main_img_' + this.data);
        this.TitleEl = document.querySelector('#title_' + this.data);
        this.DescriptionEl = document.querySelector('#desc_' + this.data);
        this.PageEl = document.querySelector('#page_' + this.data);
        this.infoPanel = document.querySelector('#infoPanel_' + this.data);
        //this.escEl = document.querySelector('#exit_' + this.data);
        this.scen = document.querySelector('#aframe-scene-container');
        let btn = "button_poi_" + this.data;
        this.playerEl = document.querySelector('#cameraA');
        this.cam = document.querySelector("#cameraA");


        this.buttonEl = document.querySelector('#button_poi_' + this.data);
        this.buttonNextEl = document.querySelector('#next_' + this.data);
        this.buttonPrevEl = document.querySelector('#prev_' + this.data);
        this.backgroundEl = document.querySelector('#exit_' + this.data);
        this.cursorEl = document.querySelector('#cursor');
        this.buttonNextPanelEl = document.querySelector('#next_panel_' + this.data);
        this.buttonPrevPanelEl = document.querySelector('#prev_panel_' + this.data);
        this.buttonEscPanelEl = document.querySelector('#exit_panel_' + this.data);


        if (this.TitleEl)
            this.TitleEl.setAttribute("text","value",this.TitleEl.getAttribute("title_to_add"));
        if(this.DescriptionEl)
            this.DescriptionEl.setAttribute("text","value",this.DescriptionEl.getAttribute("text_to_add"));

        if(this.buttonNextEl)
            this.buttonNextEl.object3D.renderOrder = 9999999;
        if(this.buttonNextPanelEl)
            this.buttonNextPanelEl.object3D.renderOrder = 99999;
        if(this.buttonPrevPanelEl)
            this.buttonPrevPanelEl.object3D.renderOrder = 99999;
        if(this.buttonPrevEl)
            this.buttonPrevEl.object3D.renderOrder = 9999999;
        if(this.buttonEscPanelEl)
            this.buttonEscPanelEl.object3D.renderOrder = 9999999;


        this.desc_list = [];
        this.readingPos = 0;

        if (!window.VRODOSRuntimeOverlay && this.cam && this.infoPanel && this.infoPanel.parentNode !== this.cam) {
            this.cam.appendChild(this.infoPanel);
        }

        const getMeta = (url, cb) => {
            const img = new Image();
            img.onload = () => cb(null, img);
            img.onerror = (err) => cb(err, null);
            img.src = url;
        };

        let content_length = 90;
        if(!this.DescriptionEl){
            this.chunks = 0;
        }
        else
        {
            this.chunks = Math.floor((this.DescriptionEl.getAttribute("text").value).length / content_length);
            if ((this.DescriptionEl.getAttribute("text").value).length % content_length > 0 && ((this.DescriptionEl.getAttribute("text").value).length > content_length )){
                this.chunks +=1;
            }

            for (let x = 0; x < this.chunks; x++) {
                let output = (this.DescriptionEl.getAttribute("text").value).substring( x * content_length, x * content_length + content_length);
                this.desc_list.push(output);

            }



            if (this.chunks > 1){
                this.DescriptionEl.setAttribute("text","value",this.desc_list[0]);
                this.buttonPrevEl.object3D.visible = false;
                this.buttonPrevEl.object3D.scale.set(0.001, 0.001, 0.001);
                this.buttonPrevPanelEl.object3D.visible = false;
                this.buttonPrevPanelEl.object3D.scale.set(0.001, 0.001, 0.001);

            }
            this.indPos = this.readingPos + 1;
            if(this.PageEl)
                this.PageEl.setAttribute("text", "value", "page " + this.indPos + " out of " + this.chunks);
        }


        //this.DescriptionEl.getAttribute("text").value = desc_list[0];

        let expected_width, expected_height, exceed_height;
        if (this.DescriptionEl) {
            expected_width = 1.4;
            expected_height = 0.75;
            exceed_height = 0.8;

        }
        else {
            expected_width = 1.4;
            expected_height = 1.4;
            exceed_height = 1.4;
        }
        const imageSrc = this.ImageAsset ? this.ImageAsset.getAttribute("src") : '';
        if (vrodosPoiImageHasValidUrl(imageSrc)){
            getMeta(imageSrc, (err, img) => {
                if (err || !img || !img.naturalWidth || !img.naturalHeight) {
                    return;
                }

                let aspect_ratio;
                img.naturalWidth > img.naturalHeight ? aspect_ratio = img.naturalWidth / img.naturalHeight : aspect_ratio = img.naturalHeight / img.naturalWidth;
                img.naturalWidth > img.naturalHeight ? expected_height = expected_width / aspect_ratio : expected_width = expected_height / aspect_ratio;


                let panel_pad;
                expected_width > 1.4 ? panel_pad = expected_width : panel_pad = 1.4;

                if (!this.DescriptionEl) {
                    if (img.naturalWidth /987  < expected_width && img.naturalHeight /987  < expected_height)
                    {

                        expected_width = img.naturalWidth /987 ;
                        expected_height = img.naturalHeight /987 ;


                    }else{

                        while (expected_height > exceed_height) {
                            expected_width = expected_width / 2;
                            expected_height = expected_height / 2;

                        }
                    }

                } else {

                    if (img.naturalWidth /987  < expected_width && img.naturalHeight /987  < expected_height)
                    {
                        expected_width = img.naturalWidth /987 ;
                        expected_height = img.naturalHeight /987 ;


                    }else{
                        while (expected_height > exceed_height) {
                            expected_width = expected_width / 2;
                            expected_height = expected_height / 2;
                        }
                    }
                }
                if (expected_width>= 0.8)
                    panel_pad =1.5;

                //let esc_pad = (panel_pad / 2) + 0.1;
                // console.log("EXP:" + expected_height + " " + expected_width);

                let upd_mixin = "width: " + expected_width + "; height: " + expected_height;
                let panel_mixin = "width: " + panel_pad + "; height: 1.8";
                //this.escEl.setAttribute("position", esc_pad + " 0.8 0.002");
                this.ImageEl.setAttribute("geometry", "primitive: plane;" + upd_mixin);
                this.infoPanel.setAttribute("geometry", "primitive: plane;" + panel_mixin);
            });
        }







        this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
        this.onBackgroundClick = this.onBackgroundClick.bind(this);
        this.onVrExit = this.onVrExit.bind(this);
        if (this.buttonNextEl)
            this.onNextButtonClick = this.onNextButtonClick.bind(this);
        if (this.buttonPrevEl)
            this.onPrevButtonClick = this.onPrevButtonClick.bind(this);


        this.buttonEl.addEventListener('click', this.onMenuButtonClick);
        if (this.buttonNextEl)
            this.buttonNextEl.addEventListener('click', this.onNextButtonClick);
        if (this.buttonNextPanelEl)
            this.buttonNextPanelEl.addEventListener('click', this.onNextButtonClick);
        if (this.buttonPrevPanelEl)
            this.buttonPrevPanelEl.addEventListener('click', this.onPrevButtonClick);
        if (this.buttonPrevEl)
            this.buttonPrevEl.addEventListener('click', this.onPrevButtonClick);
        // this.buttonEl.addEventListener('force-close-others', this.onMenuButtonClick);
        this.backgroundEl.addEventListener('click', this.onBackgroundClick);
        this.buttonEscPanelEl.addEventListener('click', this.onBackgroundClick);

        // this.backgroundEl.addEventListener('raycaster-intersected', evt => {
        //     console.log("Intersected");
        // });

        if (this.scen) {
            this.scen.addEventListener('exit-vr', this.onVrExit);
        }

    },

    shouldUseVrOverlay: function () {
        if (window.VRODOSRuntimeOverlay && typeof window.VRODOSRuntimeOverlay.shouldUseVrPanel === "function") {
            return window.VRODOSRuntimeOverlay.shouldUseVrPanel();
        }

        return Boolean(browsingModeVR);
    },

    anchorVrOverlayEntity: function (entity, options) {
        if (!entity || !this.shouldUseVrOverlay()) {
            return false;
        }

        if (window.VRODOSRuntimeOverlay && typeof window.VRODOSRuntimeOverlay.anchorElementInFrontOfCamera === "function") {
            return window.VRODOSRuntimeOverlay.anchorElementInFrontOfCamera(entity, options || {});
        }

        return false;
    },

    setOverlayInteractionActive: function (active) {
        [
            this.el,
            this.infoPanel,
            this.ImageEl,
            this.TitleEl,
            this.DescriptionEl,
            this.PageEl,
            this.backgroundEl,
            this.buttonNextEl,
            this.buttonPrevEl,
            this.buttonNextPanelEl,
            this.buttonPrevPanelEl,
            this.buttonEscPanelEl
        ].forEach((target) => {
            if (!target || !target.classList) return;
            target.classList.toggle("vrodos-overlay-hit-target", active !== false);
        });

        if (window.VRODOSRuntimeOverlay) {
            if (typeof window.VRODOSRuntimeOverlay.lockSceneInteraction === "function") {
                window.VRODOSRuntimeOverlay.lockSceneInteraction(active, { preserveLookInVr: true });
            }
            if (typeof window.VRODOSRuntimeOverlay.setOverlayRaycastMode === "function") {
                window.VRODOSRuntimeOverlay.setOverlayRaycastMode(active);
            }
            return;
        }

        if (this.cursorEl) {
            this.cursorEl.setAttribute("raycaster", "objects: " + (active ? ".vrodos-overlay-hit-target" : ".raycastable"));
        }
    },

    onVrExit: function () {
        this.closeSpatialPoiPanel("exit-vr");
        if (this.el && this.el.classList && this.el.classList.contains("openPOI")) {
            this.onBackgroundClick({});
        }
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
    getElementTextValue: function (el, fallbackAttribute) {
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
        return this.TitleEl && this.TitleEl.getAttribute("title_to_add")
            ? this.TitleEl.getAttribute("title_to_add")
            : (this.getElementTextValue(this.TitleEl, "title_to_add") || "Info");
    },
    getPoiDescriptionText: function () {
        return this.DescriptionEl && this.DescriptionEl.getAttribute("text_to_add")
            ? this.DescriptionEl.getAttribute("text_to_add")
            : (this.getElementTextValue(this.DescriptionEl, "text_to_add") || "");
    },
    getPoiImageUrl: function () {
        return this.ImageAsset && typeof this.ImageAsset.getAttribute === "function"
            ? this.ImageAsset.getAttribute("src")
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
            distance: 2.25,
            verticalOffset: -0.03,
            topAtEyeLevel: true,
            anchorElement: this.buttonEl || null,
            anchorSide: "right",
            anchorRefreshFrames: this.buttonEl ? 1 : 8,
            lockInteraction: false,
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

    onNextButtonClick: function (evt) {
        if (evt.detail && evt.detail.originalEvent && evt.detail.originalEvent.button !== undefined) {
            if (evt.detail.originalEvent.button !== 0) return;
        }


        this.readingPos += 1;

        this.indPos = this.readingPos + 1;
        if(this.PageEl)
            this.PageEl.setAttribute("text", "value", "page " + this.indPos + " out of " + this.chunks);

        this.DescriptionEl.setAttribute("text","value",this.desc_list[this.readingPos]);
        if(this.readingPos == this.chunks -1) {
            this.buttonNextEl.object3D.visible = false;
            this.buttonNextEl.object3D.scale.set(0.001, 0.001, 0.001);

            this.buttonNextPanelEl.object3D.visible = false;
            this.buttonNextPanelEl.object3D.scale.set(0.001, 0.001, 0.001);
        }
        this.buttonPrevEl.object3D.visible = true;
        this.buttonPrevEl.setAttribute("scale", this.buttonPrevEl.getAttribute("original-scale"));
        this.buttonPrevPanelEl.object3D.visible = true;
        this.buttonPrevPanelEl.setAttribute("scale", this.buttonPrevPanelEl.getAttribute("original-scale"));


    },
    onPrevButtonClick: function (evt) {
        if (evt.detail && evt.detail.originalEvent && evt.detail.originalEvent.button !== undefined) {
            if (evt.detail.originalEvent.button !== 0) return;
        }


        this.readingPos -= 1;
        this.indPos = this.readingPos + 1;
        if(this.PageEl)
            this.PageEl.setAttribute("text", "value", "page " + this.indPos + " out of " + this.chunks);

        this.DescriptionEl.setAttribute("text","value",this.desc_list[this.readingPos]);
        if(this.readingPos == 0) {
            this.buttonPrevEl.object3D.visible = false;
            this.buttonPrevEl.object3D.scale.set(0.001, 0.001, 0.001);

            this.buttonPrevPanelEl.object3D.visible = false;
            this.buttonPrevPanelEl.object3D.scale.set(0.001, 0.001, 0.001);
        }
        this.buttonNextEl.object3D.visible = true;
        this.buttonNextEl.setAttribute("scale", this.buttonNextEl.getAttribute("original-scale"));

        this.buttonNextPanelEl.object3D.visible = true;
        this.buttonNextPanelEl.setAttribute("scale", this.buttonNextPanelEl.getAttribute("original-scale"));

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

        if(this.TitleEl)
            document.getElementById("poi-img-dialog-title").innerHTML = this.getPoiTitleText();

        if (this.ImageAsset && vrodosPoiImageHasValidUrl(this.ImageAsset.getAttribute("src"))) {
            document.getElementById("poi-img-dialog-image").style.display = "inline";
            document.getElementById("poi-img-dialog-image").src = this.ImageAsset.getAttribute("src");
        } else  {
            document.getElementById("poi-img-dialog-image").style.display = "none";
        }

        if(this.DescriptionEl)
            document.getElementById("poi-img-dialog-description").innerHTML = this.getPoiDescriptionText();
        let imageDialog = document.querySelector('#poi-img-dialog');
        if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.showDialog === 'function') {
            window.VRODOSMasterUI.showDialog(imageDialog);
        } else if (imageDialog && typeof imageDialog.showModal === 'function') {
            imageDialog.showModal();
        }
    },

    onBackgroundClick: function (evt) {
        if (evt.detail && evt.detail.originalEvent && evt.detail.originalEvent.button !== undefined) {
            if (evt.detail.originalEvent.button !== 0) return;
        }

        this.backgroundEl.object3D.scale.set(0.0001, 0.0001, 0.0001);
        this.backgroundEl.object3D.visible = false;
        this.el.object3D.scale.set(0.0001, 0.0001, 0.0001);
        this.el.classList.remove("openPOI");
        this.el.object3D.visible = false;
        this.el.emit("resetmat");
        if (this.playerEl.getAttribute("wasd-controls")){
            this.playerEl.setAttribute("wasd-controls", "fly: false; acceleration:20");
        }
        // else
        //     this.cam.setAttribute("wasd-controls-enabled", "true");
        //this.playerEl.setAttribute("look-controls", "enabled: true");

        this.setOverlayInteractionActive(false);

        this.el.components.material.material.depthTest = true;
        this.ImageEl.components.material.material.depthTest = true;
        if (this.DescriptionEl == null) {
            console.log("No Desc");
        }
        else {
            this.DescriptionEl.components.text.material.depthTest = true;
        }
        this.TitleEl.components.text.material.depthTest = true;

        ///this.cam.setAttribute("wasd-controls-enabled", "true");


    }
});
