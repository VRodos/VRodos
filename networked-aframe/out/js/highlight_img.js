AFRAME.registerComponent('highlight', {
    schema: { type: "string", default: "default value" },
    init: function () {
        //var backgroundEl = document.querySelector('#exit_' + this.data);
        this.backgroundEl = document.querySelector('#exit_' + this.data);
        //this.buttonEl = document.querySelector('#button_poi_' + this.data);
        // if (this.buttonEl == null) {
        //     this.buttonEl = document.querySelector('#entity_' + this.data);
        //     console.log(this.buttonEl);
        // }
        this.onClick = this.onClick.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.reset = this.reset.bind(this);

        //backgroundEl.addEventListener('click', this.reset);

        this.el.addEventListener('click', this.onBackgroundClick);
        this.el.addEventListener('mouseenter', this.onMouseEnter);
        this.el.addEventListener('mouseleave', this.onMouseLeave);
        this.el.addEventListener('click', this.onClick);
        var flag = "test";

        // const realWorldPosition = this.buttonEl.object3D.getWorldPosition(new THREE.Vector3());






        this.el.addEventListener("animationcomplete", e => {
            //this.el.object3D.visible = false;

            //this.buttonEl.emit("temp");
            //console.log(e.detail.name);
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
                //console.log(material);

                //material.emissiveIntensity = 0.5;


            }
        })
    },

    onMouseEnter: function (evt) {

        //evt.target.object3D.castShadow = true;
        evt.target.object3D.receiveShadow = false;
        let sceneBSCenter = new THREE.Vector3(0, 0, 0);
        let sceneBSRadius = 0;
        /*
        this.excEl = document.querySelector('#excMark_' + this.data);
        console.log(this.excEl + " Found");
        this.excEl.object3D.visible = true;
        //this.excEl.object3D.position.set(0, 0, 0);
        this.excEl.object3D.scale.set(10, 10, 10);
        var bbox = new THREE.Box3().setFromObject(this.el.object3D);
        const vector = new THREE.Vector3();
        var centered_values = bbox.getCenter(vector);

        this.excEl.object3D.position.set(centered_values.x, bbox.max.y + 1, centered_values.z);

        console.log(bbox.getCenter(vector));
        console.log(bbox);
        */


        //console.log("%s  %s  %s", "h", "h", "j");
        //console.log(centered_values.x + "vector x");

        //this.excEl.setAttribute('position', "%s  %s  %s", vector.x, "2.5400084200698636", vector.z);

        //console.log(bbox.getCenter(vector));
        //console.log(bbox);




        evt.target.object3D.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                //child.geometry.computeBoundingSphere();
                //console.log("It is");
                //let radius = child.geometry.boundingSphere.radius;
                //var bbox = new THREE.Box3().setFromObject(child);
                //const vector = new THREE.Vector3();

                //console.log(bbox.getCenter(vector));


                //console.log(realWorldPosition.x);
                //if (radius) {
                //    sceneBSRadius = Math.max(sceneBSRadius, radius);
                //}
                //let sphereGeometry = new THREE.SphereGeometry(sceneBSRadius / 5, 32, 32);
                //let sphereGeometry = new THREE.sphereGeometry(4, 5, 5);
                //let sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
                //let sphereObject = new THREE.Mesh(sphereGeometry, sphereMaterial);
                //sphereObject.visible = true;
                //sphereObject.name = "myBoundingsphere";
                //console.log(this.el.getAttribute("position"));

                //this.el.sceneEl.setObject3D('mesh', sphereObject);
                //sphereObject.position.set(vector.x, vector.y, vector.z);

                //this.el.sceneEl.

            }

            if (child.type === 'Mesh') {

                const material = child.material;
                //material.side = THREE.FrontSide;

                var c = new THREE.Color();
                c.set(material.color);

                material.userData.originalColor = c.getHexString();
                var hex_val = "0x" + c.getHexString();
                //console.log(material);
                ///material.transparent = true; // enable to modify opacity correctly
                //material.opacity = 0.9;

                material.emissive = new THREE.Color(parseInt(hex_val));
                //material.emissive = new THREE.Color(0xccad00);
                material.emissiveIntensity = 0.3;
                //child.castShadow = true;
                child.receiveShadow = false;

                //material.color.setHex(0xff0000);


            }
        })

        //buttonEl = this.buttonEl;
        //buttonEl.emit("tmp1");


        //buttonEl.setAttribute('material', 'color', 'blue');

    },

    onMouseLeave: function (evt) {
        if (this.el.is('clicked')) { return; }
        // buttonEl.setAttribute('material', 'color', 'white');
        evt.target.object3D.traverse((child) => {

            if (child.type === 'Mesh') {
                const material = child.material;

                material.color.setHex("0x" + material.userData.originalColor);
                material.emissiveIntensity = 0;
                //child.castShadow = false;
                child.receiveShadow = false;

            }
        })
        //this.buttonEl.emit("tmp2");

    },
    onBackgroundClick: function (evt) {
        //console.log("reached");
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