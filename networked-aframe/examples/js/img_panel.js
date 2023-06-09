AFRAME.registerComponent('info-panel', {
    schema: { type: "string", default: "default value" },
    init: function () {


        this.ImageEl = document.querySelector('#top_img_' + this.data);
        this.TitleEl = document.querySelector('#title_' + this.data);
        this.DescriptionEl = document.querySelector('#desc_' + this.data);
        this.infoPanel = document.querySelector('#infoPanel_' + this.data);
        let btn = "button_poi_" + this.data;
        this.playerEl = document.querySelector('#player');






        this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
        this.onBackgroundClick = this.onBackgroundClick.bind(this);
        this.buttonEl = document.querySelector('#button_poi_' + this.data);
        this.backgroundEl = document.querySelector('#exit_' + this.data);

        this.buttonEl.addEventListener('click', this.onMenuButtonClick);
        this.backgroundEl.addEventListener('click', this.onBackgroundClick);
        //this.el.object3D.renderOrder = 9999999;
        //this.el.object3D.depthTest = false;

        console.log(this.infoPanel);
        ///this.infoPanel.object3D.depthTest = false;
        //this.infoPanel.object3D.renderOrder = 999999999999;

        this.backgroundEl.addEventListener('raycaster-intersected', evt => {
            console.log("Intersected");
        });


    },

    onMenuButtonClick: function (evt) {


        this.backgroundEl.object3D.scale.set(1, 1, 1);
        this.backgroundEl.object3D.visible = true;

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
        if (this.DescriptionEl == null) {
            console.log("No Desc");
        }
        else {
            this.DescriptionEl.components.text.material.depthTest = false;
        }
        this.TitleEl.components.text.material.depthTest = false;
        console.log(this.buttonEl.components);


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