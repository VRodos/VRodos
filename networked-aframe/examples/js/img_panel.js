AFRAME.registerComponent('info-panel', {
    schema: { type: "string", default: "default value" },
    init: function () {


        this.ImageEl = document.querySelector('#top_img_' + this.data);
        this.TitleEl = document.querySelector('#title_' + this.data);
        this.DescriptionEl = document.querySelector('#desc_' + this.data);
        let btn = "button_poi_" + this.data;

        console.log(btn);




        this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
        this.onBackgroundClick = this.onBackgroundClick.bind(this);
        this.buttonEl = document.querySelector('#button_poi_' + this.data);
        this.backgroundEl = document.querySelector('#exit_' + this.data);

        this.buttonEl.addEventListener('click', this.onMenuButtonClick);
        this.backgroundEl.addEventListener('click', this.onBackgroundClick);
        this.el.object3D.renderOrder = 9999999;
        this.el.object3D.depthTest = false;

    },

    onMenuButtonClick: function (evt) {


        this.backgroundEl.object3D.scale.set(1, 1, 1);

        this.el.object3D.scale.set(1, 1, 1);
        if (AFRAME.utils.device.isMobile()) { this.el.object3D.scale.set(1.4, 1.4, 1.4); }
        this.el.object3D.visible = true;

        this.ImageEl.object3D.visible = true;

    },

    onBackgroundClick: function (evt) {
        this.backgroundEl.object3D.scale.set(0.001, 0.001, 0.001);
        this.el.object3D.scale.set(0.001, 0.001, 0.001);
        this.el.object3D.visible = false;
        this.el.emit("resetmat");


    }
});