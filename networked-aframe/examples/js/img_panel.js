AFRAME.registerComponent('info-panel', {
    schema: { type: "string", default: "default value" },
    init: function () {


        this.ImageEl = document.querySelector('#top_img_' + this.data);
        this.ImageAsset = document.querySelector('#main_img_' + this.data);
        this.TitleEl = document.querySelector('#title_' + this.data);
        this.DescriptionEl = document.querySelector('#desc_' + this.data);
        this.infoPanel = document.querySelector('#infoPanel_' + this.data);
        this.escEl = document.querySelector('#exit_' + this.data);
        this.scen = document.querySelector('#aframe-scene-container'); 
        let btn = "button_poi_" + this.data;
        this.playerEl = document.querySelector('#player');

        var img = new Image();
        const getMeta = (url, cb) => {
            const img = new Image();
            img.onload = () => cb(null, img);
            img.onerror = (err) => cb(err);
            img.src = url;
        };
        console.log(this.ImageAsset.getAttribute("src"));
        let expected_width, expected_height;
        if (this.DescriptionEl) {
            expected_width = 1.5;
            expected_height = 0.81;
            console.log("reach 1");
        }
        else {
            expected_width = 1.5;
            expected_height = 1.5;
            console.log("reach 2");
        }
        getMeta(this.ImageAsset.getAttribute("src"), (err, img) => {

            console.log(img.naturalWidth + " " +  img.naturalHeight);

            //let aspect_ratio = img.naturalWidth / img.naturalHeight;
            let aspect_ratio;
            img.naturalWidth > img.naturalHeight ? aspect_ratio = img.naturalWidth / img.naturalHeight : aspect_ratio = img.naturalHeight / img.naturalWidth;
            img.naturalWidth > img.naturalHeight ? expected_height = expected_width / aspect_ratio : expected_width = expected_height / aspect_ratio;
            /*
            if (img.naturalWidth > img.naturalHeight) {
                //expected_width = 1.5;
                expected_height = expected_width / aspect_ratio;
                console.log("height:" + expected_height);
            }
            else {
                //expected_height = 0.81;
                expected_width = expected_height / aspect_ratio;
                console.log("width:" + expected_width);
                console.log("height:" + expected_height);

            }
            */

            //while (given_height > 0.81) {
            //    expected_width = expected_width / 2;
            //    given_height = given_height / 2;
            //    console.log(expected_width, given_height);

            //}
            console.log("EXP:" + expected_height + " " + expected_width);
            let panel_pad;
            expected_width > 1.5 ? panel_pad = expected_width : panel_pad = 1.5;


            if (!this.DescriptionEl) {
                while (expected_height > 0.81) {
                    expected_width = expected_width / 2;
                    expected_height = expected_height / 2;
                    console.log("reach 1");

                }
            } else {
                while (expected_height > 1.5) {
                    expected_width = expected_width / 2;
                    expected_height = expected_height / 2;
                    console.log("reach 2");
                }

            }
            let esc_pad = (panel_pad / 2) + 0.1;

            let upd_mixin = "width: " + expected_width + "; height: " + expected_height;
            let panel_mixin = "width: " + panel_pad + "; height: 1.8";
            this.escEl.setAttribute("position", esc_pad + " 0.8 0.002");
            this.ImageEl.setAttribute("geometry", "primitive: plane;" + upd_mixin);
            this.infoPanel.setAttribute("geometry", "primitive: plane;" + panel_mixin);
        });








        this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
        this.onBackgroundClick = this.onBackgroundClick.bind(this);
        this.buttonEl = document.querySelector('#button_poi_' + this.data);
        this.backgroundEl = document.querySelector('#exit_' + this.data);

        this.buttonEl.addEventListener('click', this.onMenuButtonClick);
        this.backgroundEl.addEventListener('click', this.onBackgroundClick);
        //this.el.object3D.renderOrder = 9999999;
        //this.el.object3D.depthTest = false;

        //console.log(this.infoPanel);
        ///this.infoPanel.object3D.depthTest = false;
        //this.infoPanel.object3D.renderOrder = 999999999999;

        this.backgroundEl.addEventListener('raycaster-intersected', evt => {
            console.log("Intersected");
        });


    },

    onMenuButtonClick: function (evt) {


        this.backgroundEl.object3D.scale.set(1, 1, 1);
        this.backgroundEl.object3D.visible = true;
        this.scen.setAttribute("raycaster","objects: .raycastable");

        this.el.object3D.scale.set(1, 1, 1);
        if (AFRAME.utils.device.isMobile()) { this.el.object3D.scale.set(1.4, 1.4, 1.4); }
        this.el.object3D.visible = true;
        this.el.components.material.material.depthTest = false;
        //this.backgroundEl.sceneEl.renderer.sortObjects = true;
        this.backgroundEl.components.material.material.depthTest = false;
        //this.backgroundEl.components.material.material.clipIntersection = false;
        this.buttonEl.object3D.depthTest = false;

        this.backgroundEl.object3D.renderOrder = 9999999;
        this.buttonEl.object3D.renderOrder = 9999999;
        //clipIntersection
        this.buttonEl.components.material.material.depthTest = false;

        this.ImageEl.components.material.material.depthTest = false;
        if (!this.DescriptionEl) {
            console.log("No Desc");
        }
        else {
            this.DescriptionEl.components.text.material.depthTest = false;
        }
        this.TitleEl.components.text.material.depthTest = false;
        //console.log(this.buttonEl.components);


        this.playerEl.setAttribute("wasd-controls", "acceleration: 0");

        this.ImageEl.object3D.visible = true;

    },

    onBackgroundClick: function (evt) {
        this.backgroundEl.object3D.scale.set(0.001, 0.001, 0.001);
        this.backgroundEl.object3D.visible = false;
        this.el.object3D.scale.set(0.001, 0.001, 0.001);
        this.el.object3D.visible = false;
        this.el.emit("resetmat");
        this.playerEl.setAttribute("wasd-controls", "acceleration: 10");
        this.scen.setAttribute("raycaster","objects: .raycastable, .non-clickable");

        this.el.components.material.material.depthTest = true;
        this.ImageEl.components.material.material.depthTest = true;
        if (this.DescriptionEl == null) {
            console.log("No Desc");
        }
        else {
            this.DescriptionEl.components.text.material.depthTest = true;
        }
        this.TitleEl.components.text.material.depthTest = true;


    }
});