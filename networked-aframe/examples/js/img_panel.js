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
        }
        else {
            expected_width = 1.5;
            expected_height = 1.5;
        }
        if (this.ImageAsset.getAttribute("src")){
            getMeta(this.ImageAsset.getAttribute("src"), (err, img) => {

                let aspect_ratio;
                img.naturalWidth > img.naturalHeight ? aspect_ratio = img.naturalWidth / img.naturalHeight : aspect_ratio = img.naturalHeight / img.naturalWidth;
                img.naturalWidth > img.naturalHeight ? expected_height = expected_width / aspect_ratio : expected_width = expected_height / aspect_ratio;
            
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
        }








        this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
        this.onBackgroundClick = this.onBackgroundClick.bind(this);
        this.buttonEl = document.querySelector('#button_poi_' + this.data);
        this.backgroundEl = document.querySelector('#exit_' + this.data);

        

        this.buttonEl.addEventListener('click', this.onMenuButtonClick);
        //this.buttonEl.addEventListener('force-close-others', this.onMenuButtonClick);
        this.backgroundEl.addEventListener('click', this.onBackgroundClick);
       
        this.backgroundEl.addEventListener('raycaster-intersected', evt => {
            console.log("Intersected");
        });


    },

    onMenuButtonClick: function (evt) {

        this.el.emit("force-close",{value: this.data, el: this.el});
        let poi_elems = document.getElementsByClassName('openPOI');
        for (let i = 0; i < poi_elems.length; ++i) {
            poi_elems[i].object3D.scale.set(0.001, 0.001, 0.001);
            poi_elems[i].object3D.visible = false;
        }
        this.el.classList.add("openPOI");
        this.backgroundEl.object3D.scale.set(1, 1, 1);
        this.backgroundEl.object3D.visible = true;
        this.scen.setAttribute("raycaster","objects: .non-clickable");

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
            this.DescriptionEl.object3D.renderOrder = 9999999;
        }
              
        if (!this.TitleEl) {
            console.log("No Title");
        }
        else {
            this.TitleEl.components.text.material.depthTest = false;
            this.TitleEl.object3D.renderOrder = 9999999;
        }
      
        if (!this.ImageAsset.getAttribute("src")) {
            console.log("No Image");
            
        }
        else {
            this.ImageEl.components.material.material.depthTest = false;
            this.ImageEl.object3D.renderOrder = 9999999;
            console.log(this.ImageEl.components);
        }

        this.infoPanel.components.material.material.depthTest = false;
        this.infoPanel.object3D.renderOrder = 9999;
       
        
       
      

        this.playerEl.setAttribute("wasd-controls", "acceleration: 0");
        //this.playerEl.setAttribute("look-controls", "enabled: false");

       

        this.ImageEl.object3D.visible = true;

    },

    onBackgroundClick: function (evt) {
        this.backgroundEl.object3D.scale.set(0.001, 0.001, 0.001);
        this.backgroundEl.object3D.visible = false;
        this.el.object3D.scale.set(0.001, 0.001, 0.001);
        this.el.classList.remove("openPOI");
        this.el.object3D.visible = false;
        this.el.emit("resetmat");
        this.playerEl.setAttribute("wasd-controls", "acceleration: 10");
        this.playerEl.setAttribute("look-controls", "enabled: true");

        this.scen.setAttribute("raycaster","objects: .raycastable");

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