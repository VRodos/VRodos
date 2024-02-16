AFRAME.registerComponent('indicator-availability', {
    init: function () {
        //var backgroundEl = document.querySelector('#exit_' + this.data);
        // var buttonEl = document.querySelector('#button_poi_' + this.data);

       

        function check1(oldvalue) {
            undefined === oldvalue && (oldvalue = value);
            clearcheck = setInterval(repeatcheck,500,oldvalue);
            function repeatcheck(oldvalue) {
                if (value !== oldvalue) {
                    // do something
                    clearInterval(clearcheck)
                    console.log("check1 value changed from " +
                        oldvalue + " to " + value);
                }
            }
        }

        console.log("chatlist: ");
        //console.log(document.getElementById('cameraA').getAttribute('player-info', 'fullChatTables'));

        // function setReadyListener() {
        //     const readyListener = () => {
        //       if (chatlist > 0) {
        //         console.log("READY LISTENER");
        //         return alert("Ready!");
        //       }
        //       return setTimeout(readyListener, 250);
        //     };
        //     readyListener();
        // }

        let indicatorAsset = document.getElementById('indicator_id');
        let indicatorEntity = document.createElement('a-entity');
        let parentEntity = document.createElement('a-entity');
        let element = this.el;

        let chatIsFull = false;
        indicatorEntity.setAttribute("gltf-model", "#indicator_id");
        parentEntity.appendChild(indicatorEntity);
        parentEntity.appendChild(element);

        document.getElementById("aframe-scene-container").appendChild(parentEntity);

        

        // setReadyListener();
        

        element.addEventListener("eventChatMembers", (evt) => {
            console.log(evt);
        });

        element.addEventListener("click", e => {console.log([...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'])); });

        console.log(([...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'].data.fullChatTable))); 
        element.addEventListener("model-loaded", e => {

            let  chatlist = [...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'].data.fullChatTable).filter(function(x){return x== element.getAttribute("id")});

            console.log(([...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'].data.fullChatTable))); 

                       
            //this.el.object3D.visible = false;

            //this.buttonEl.emit("temp");
            

           
           
            // console.log(this.excEl + " Found");
            // this.excEl.object3D.visible = true;
            //indicatorEntity.object3D.position.set(0, 0, 0);
            // this.excEl.object3D.scale.set(30, 30, 30);
            let bbox = new THREE.Box3().setFromObject(this.el.object3D);
            const vector = new THREE.Vector3();
            let centered_values = bbox.getCenter(vector);

            indicatorEntity.object3D.position.set(element.getAttribute("position").x, element.getAttribute("position").y + 5, element.getAttribute("position").z);
            //const realWorldPosition = indicatorEntity.object3D.getWorldPosition(new THREE.Vector3());


            // this.excEl.object3D.traverse((child) => {
            //     if (child.type === 'Mesh') {
            //         const material = child.material;
            //         console.log("Mat found");
            //         console.log(child);
            //         //child.position.set(0, 0, 0);
            //         //material.color.r = 0;

            //         //material.color.g = 0;
            //         material.metalness = 0;
            //         material.roughness = 0;

            //         material.color.setHex("0xccad00");


            //     }
            // })
        });
    }
});