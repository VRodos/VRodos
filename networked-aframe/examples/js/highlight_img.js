AFRAME.registerComponent('highlight', {
    schema: { type: "string", default: "default value" },
    init: function () {
        //var backgroundEl = document.querySelector('#exit_' + this.data);
        this.backgroundEl = document.querySelector('#exit_' + this.data);
        this.buttonEl = document.querySelector('#button_poi_' + this.data);
        this.onClick = this.onClick.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.reset = this.reset.bind(this);

        //backgroundEl.addEventListener('click', this.reset);

        this.buttonEl.addEventListener('click', this.onBackgroundClick);
        this.buttonEl.addEventListener('mouseenter', this.onMouseEnter);
        this.buttonEl.addEventListener('mouseleave', this.onMouseLeave);
        this.buttonEl.addEventListener('click', this.onClick);




        this.buttonEl.addEventListener("animationcomplete", e => {
            //this.el.object3D.visible = false;

            //this.buttonEl.emit("temp");
            console.log(e.detail.name);
            if (e.detail.name == "animation__scale") {
                //this.buttonEl.addEventListener('mouseleave', this.onMouseLeave);
                console.log(e.detail.name + " Completed");

            }


            //this.el.setAttribute("src", "#search");
            //this.el.setAttribute("src", "#search");
            //window.location.replace(this.data);
        });


    },


    onClick: function (evt) {

        //this.el.addState('clicked');
        //evt.target.object3D.scale.set(1.2, 1.2, 1.2);
        evt.target.object3D.traverse((child) => {

            if (child.type === 'Mesh') {
                const material = child.material;

                material.color.setHex(0xff0000);

            }
        })
    },

    onMouseEnter: function (evt) {


        evt.target.object3D.traverse((child) => {

            if (child.type === 'Mesh') {
                const material = child.material;
                var c = new THREE.Color();
                c.set(material.color);

                material.userData.originalColor = c.getHexString();

                material.color.setHex(0xff0000);

            }
        })

        buttonEl = this.buttonEl;


        buttonEl.setAttribute('material', 'color', 'blue');

    },

    onMouseLeave: function (evt) {
        if (this.el.is('clicked')) { return; }
        buttonEl.setAttribute('material', 'color', 'white');
        evt.target.object3D.traverse((child) => {

            if (child.type === 'Mesh') {
                const material = child.material;

                material.color.setHex("0x" + material.userData.originalColor);

            }
        })
        //this.buttonEl.emit("tmp2");

    },
    onBackgroundClick: function (evt) {
        console.log("reached");
        evt.target.object3D.traverse((child) => {

            if (child.type === 'Mesh') {
                const material = child.material;

                material.color.setHex("0x" + material.userData.originalColor);

            }
        })

    },



    reset: function () {




        //buttonEl.emit('mouseleave');
    }
});