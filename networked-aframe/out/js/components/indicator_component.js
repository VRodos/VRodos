AFRAME.registerComponent('indicator-availability', {
    schema: { 
        isfull: { default: "false" },
        num_participants: {type: "string", default: "2" }
    },
    init: function () {
        let element = this.el;
        this.initSync = false;
        this.maxParticipants = Number(this.data.num_participants);

        if (this.maxParticipants ===  -1)
            this.maxParticipants = Number.MAX_SAFE_INTEGER;
            

        document.addEventListener("chat-ready", (evt)=>{
            let id = element.getAttribute("id");
            this.initSync = true;
            let  chatListCheck = [...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'].data.currentPrivateChat).filter(function(x){return x== id}).length;
            if(chatListCheck < this.maxParticipants)
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
        checkIndicatorEntity.classList.add("non-vr");
        checkIndicatorEntity.classList.add("hideable");
        xIndicatorEntity.setAttribute("visible", "false");
        xIndicatorEntity.setAttribute("id", "#x_id");
        xIndicatorEntity.setAttribute("gltf-model", "#x_indicator_id");
        xIndicatorEntity.classList.add("non-vr");
        xIndicatorEntity.classList.add("hideable");

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
            checkIndicatorEntity.object3D.position.set(element.getAttribute("position").x, bbox.max.y + 1, element.getAttribute("position").z);
            xIndicatorEntity.object3D.position.set(element.getAttribute("position").x, bbox.max.y + 1, element.getAttribute("position").z);
            parentEntity.setAttribute("visible", "true");
        });
    },
    tick:function () {
        let chat_id = this.el.getAttribute("id");
        let  chatListUpdate = [...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'].data.currentPrivateChat).filter(function(x){return x== chat_id}).length;

        if (chatListUpdate === this.maxParticipants || this.initSync == false){
            this.el.emit('chat-availability-change', "full", false);
            this.data.isfull = "true";
        }else if (chatListUpdate < this.maxParticipants){
            this.el.emit('chat-availability-change', "available", false);
            this.data.isfull = "false";
        }
        
    }
});