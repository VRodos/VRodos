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
        if (this.el && this.el.classList && this.el.classList.contains("openPOI")) {
            this.onBackgroundClick({});
        }
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

        if (!this.shouldUseVrOverlay()) {

            if(this.TitleEl)
                document.getElementById("poi-img-dialog-title").innerHTML = this.TitleEl.getAttribute("text").value;

            if (this.ImageAsset && vrodosPoiImageHasValidUrl(this.ImageAsset.getAttribute("src"))) {
                document.getElementById("poi-img-dialog-image").style.display = "inline";
                document.getElementById("poi-img-dialog-image").src = this.ImageAsset.getAttribute("src");
            } else  {
                document.getElementById("poi-img-dialog-image").style.display = "none";
            }

            if(this.DescriptionEl)
                document.getElementById("poi-img-dialog-description").innerHTML = this.DescriptionEl.getAttribute("text_to_add");
            let imageDialog = document.querySelector('#poi-img-dialog');
            if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.showDialog === 'function') {
                window.VRODOSMasterUI.showDialog(imageDialog);
            } else if (imageDialog && typeof imageDialog.showModal === 'function') {
                imageDialog.showModal();
            }


        } else {

            //this.el.emit("force-close",{value: this.data, el: this.el});
            let poi_elems = document.getElementsByClassName('openPOI');
            for (let i = 0; i < poi_elems.length; ++i) {
                poi_elems[i].object3D.scale.set(0.001, 0.001, 0.001);
                poi_elems[i].object3D.visible = false;
            }
            this.el.classList.add("openPOI");
            // this.scen.components.raycaster.refreshObjects();
            this.backgroundEl.setAttribute("scale", this.backgroundEl.getAttribute("original-scale"));
            // this.backgroundEl.setAttribute("material", "color", "white");
            this.backgroundEl.object3D.visible = true;
            this.setOverlayInteractionActive(true);

            this.el.object3D.scale.set(1, 1, 1);
            if (AFRAME.utils.device.isMobile()) { this.el.object3D.scale.set(1.4, 1.4, 1.4); }
            if (!this.anchorVrOverlayEntity(this.el, { distance: 2.35, verticalOffset: -0.08 })) {
                this.el.object3D.position.z = -2.5;
            }
            this.el.object3D.visible = true;

            this.el.components.material.material.depthTest = false;
            //this.backgroundEl.sceneEl.renderer.sortObjects = true;
            this.backgroundEl.components.material.material.depthTest = false;
            //this.backgroundEl.components.material.material.clipIntersection = false;
            this.buttonEl.object3D.depthTest = false;

            this.backgroundEl.object3D.renderOrder = 99999999;
            this.buttonEl.object3D.renderOrder = 99999;
            //clipIntersection
            this.buttonEl.components.material.material.depthTest = false;


            if (!this.DescriptionEl) {
                console.log("No Desc");
            }
            else {
                this.DescriptionEl.components.text.material.depthTest = false;
                this.DescriptionEl.object3D.renderOrder = 99999;
            }
            if (!this.PageEl) {
                console.log("No Desc");
            }
            else {
                this.PageEl.components.text.material.depthTest = false;
                this.PageEl.object3D.renderOrder = 99999;
            }

            if (!this.TitleEl) {
                console.log("No Title");
            }
            else {
                this.TitleEl.components.text.material.depthTest = false;
                this.TitleEl.object3D.renderOrder = 99999;
            }

            if (!this.ImageAsset || !vrodosPoiImageHasValidUrl(this.ImageAsset.getAttribute("src"))) {
                console.log("No Image");

            }
            else {
                this.ImageEl.components.material.material.depthTest = false;
                this.ImageEl.object3D.renderOrder = 99999;
                console.log(this.ImageEl.components);
            }

            this.infoPanel.components.material.material.depthTest = false;
            this.infoPanel.object3D.renderOrder = 9999;

            if (this.playerEl.getAttribute("wasd-controls")){
                this.playerEl.setAttribute("wasd-controls", "fly: false; acceleration:0");
            }
            // else
            //     this.cam.setAttribute("wasd-controls-enabled", "false");
            //playerEl.setAttribute("look-controls", "enabled: false");
            //this.playerEl.setAttribute("movement-controls", "speed: 0");
            //this.playerEl.setAttribute("look-controls", "enabled: false");


            this.ImageEl.object3D.visible = true;

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
