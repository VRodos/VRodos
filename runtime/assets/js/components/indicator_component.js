AFRAME.registerComponent('indicator-availability', {
    schema: { 
        isfull: { default: "false" },
        num_participants: { type: "number", default: 2 }
    },
    init: function () {
        let element = this.el;
        this.initSync = false;

        let checkIndicatorEntity = document.createElement('a-entity');
        checkIndicatorEntity.setAttribute("gltf-model", "#check_indicator_id");
        checkIndicatorEntity.setAttribute("visible", "true");
        checkIndicatorEntity.setAttribute("scale", "0.2 0.2 0.2");
        checkIndicatorEntity.setAttribute("billboard", "");

        let xIndicatorEntity = document.createElement('a-entity');
        xIndicatorEntity.setAttribute("gltf-model", "#x_indicator_id");
        xIndicatorEntity.setAttribute("visible", "false");
        xIndicatorEntity.setAttribute("scale", "0.2 0.2 0.2");
        xIndicatorEntity.setAttribute("billboard", "");

        element.appendChild(checkIndicatorEntity);
        element.appendChild(xIndicatorEntity);

        element.addEventListener("chat-availability-change", (evt) => {
            if (evt.detail === "full"){
                checkIndicatorEntity.setAttribute("visible", "false");
                xIndicatorEntity.setAttribute("visible", "true");
            } else if (evt.detail === "available"){
                checkIndicatorEntity.setAttribute("visible", "true");
                xIndicatorEntity.setAttribute("visible", "false");
            }
        });

        document.addEventListener('chat-ready', () => {
            console.log("Indicator sync ready for", element.id);
            this.initSync = true;
        });

        element.addEventListener("model-loaded", e => {
            // Wait to ensure meshes are fully initialized for bounding box
            setTimeout(() => {
                let bbox = new THREE.Box3().setFromObject(element.object3D);
                let worldPos = new THREE.Vector3();
                element.object3D.getWorldPosition(worldPos);
                
                let targetWorldPos = new THREE.Vector3(worldPos.x, bbox.max.y + 0.5, worldPos.z);
                let localPos = targetWorldPos.clone();
                element.object3D.worldToLocal(localPos);
                
                checkIndicatorEntity.object3D.position.copy(localPos);
                xIndicatorEntity.object3D.position.copy(localPos);
            }, 500);
        });
    },
    tick: function () {
        if (!this.initSync) return;

        let chat_id = this.el.getAttribute("id");
        let chatListUpdate = [...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'].data.currentPrivateChat).filter(function(x){return x == chat_id}).length;

        if (chatListUpdate >= this.data.num_participants) {
            this.el.emit('chat-availability-change', "full", false);
            this.data.isfull = "true";
        } else if (chatListUpdate < this.data.num_participants) {
            this.el.emit('chat-availability-change', "available", false);
            this.data.isfull = "false";
        }
    }
});