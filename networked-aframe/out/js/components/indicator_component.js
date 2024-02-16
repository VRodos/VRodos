AFRAME.registerComponent('indicator-availability', {
    schema: { isfull: { default: "false" } },
    init: function () {
        let element = this.el;

        document.addEventListener("chat-selected", (evt)=>{
            let id = element.getAttribute("id");
            let  chatListCheck = [...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'].data.currentPrivateChat).filter(function(x){return x== id}).length;
            if(chatListCheck < 2)
            {
                element.emit('chat-availability-change', "available", false);
            }else{
                element.emit('chat-availability-change', "full", false);
            }
        })

        let checkIndicatorEntity = document.createElement('a-entity');
        let xIndicatorEntity = document.createElement('a-entity');
        let parentEntity = document.createElement('a-entity');
        parentEntity.setAttribute("visible", "false");
        let chatIsFull = false;

        checkIndicatorEntity.setAttribute("visible", "false");
        checkIndicatorEntity.setAttribute("id", "check_id");
        checkIndicatorEntity.setAttribute("gltf-model", "#check_indicator_id");
        checkIndicatorEntity.setAttribute("rotation", "0 270 0");

        xIndicatorEntity.setAttribute("visible", "false");
        xIndicatorEntity.setAttribute("id", "#x_id");
        xIndicatorEntity.setAttribute("gltf-model", "#x_indicator_id");

        parentEntity.appendChild(checkIndicatorEntity);
        parentEntity.appendChild(xIndicatorEntity);
        parentEntity.appendChild(element);
        
        document.getElementById("aframe-scene-container").appendChild(parentEntity);

        element.addEventListener("chat-availability-change", (evt) => {
            if (evt.detail === "full"){
                checkIndicatorEntity.setAttribute("visible", "false");
                xIndicatorEntity.setAttribute("visible", "true");
            }else if (evt.detail === "available"){
                checkIndicatorEntity.setAttribute("visible", "true");
                xIndicatorEntity.setAttribute("visible", "false");
            }
        });
        element.addEventListener("model-loaded", e => {

            let  chatlist = [...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'].data.fullChatTable).filter(function(x){return x== element.getAttribute("id")});
            let bbox = new THREE.Box3().setFromObject(this.el.object3D);
            const vector = new THREE.Vector3();
            let centered_values = bbox.getCenter(vector);
            checkIndicatorEntity.object3D.position.set(element.getAttribute("position").x, element.getAttribute("position").y + 5, element.getAttribute("position").z);
            xIndicatorEntity.object3D.position.set(element.getAttribute("position").x, element.getAttribute("position").y + 5, element.getAttribute("position").z);
            parentEntity.setAttribute("visible", "true");
        });
    },
    tick:function () {
        let chat_id = this.el.getAttribute("id");
        let  chatListUpdate = [...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'].data.currentPrivateChat).filter(function(x){return x== chat_id}).length;

        if (chatListUpdate === 2 && this.data.isfull === "false"){
            this.el.emit('chat-availability-change', "full", false);
            this.data.isfull = "true";
        }else if (chatListUpdate < 2 && this.data.isfull === "true"){
            this.el.emit('chat-availability-change', "available", false);
            this.data.isfull = "false";
        }
        
    }
});