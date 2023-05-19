AFRAME.registerComponent('indicator', {
    schema: { type: "string", default: "default value" },
    init: function () {
        //var backgroundEl = document.querySelector('#exit_' + this.data);
        var buttonEl = document.querySelector('#button_poi_' + this.data);



        buttonEl.addEventListener("model-loaded", e => {
            //this.el.object3D.visible = false;

            //this.buttonEl.emit("temp");
            console.log("Model Loaded");
            this.excEl = document.querySelector('#excMark_' + this.data);
            console.log(this.excEl + " Found");
            this.excEl.object3D.visible = true;
            //this.excEl.object3D.position.set(0, 0, 0);
            this.excEl.object3D.scale.set(30, 30, 30);
            var bbox = new THREE.Box3().setFromObject(buttonEl.object3D);
            const vector = new THREE.Vector3();
            var centered_values = bbox.getCenter(vector);

            this.excEl.object3D.position.set(centered_values.x, bbox.max.y + 1, centered_values.z);
            const realWorldPosition = buttonEl.object3D.getWorldPosition(new THREE.Vector3());


            this.excEl.object3D.traverse((child) => {
                if (child.type === 'Mesh') {
                    const material = child.material;
                    console.log("Mat found");
                    console.log(material);
                    //material.color.r = 0;

                    //material.color.g = 0;
                    material.metalness = 0;
                    material.roughness = 0;

                    material.color.setHex("0xccad00");


                }
            })
        });










    },





});