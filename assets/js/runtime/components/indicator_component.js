AFRAME.registerComponent('indicator-availability', {
    schema: {
        isfull: { default: "false" },
        num_participants: { type: "number", default: 2 }
    },
    init: function () {
        this.element = this.el;
        this.lastAvailabilityState = null;
        this.lastOccupancyCheck = 0;
        this.maxParticipants = Number(this.data.num_participants);

        if (this.maxParticipants === -1) {
            this.maxParticipants = Number.MAX_SAFE_INTEGER;
        } else if (!Number.isFinite(this.maxParticipants) || this.maxParticipants < 1) {
            this.maxParticipants = 2;
        }

        this.checkIndicatorEntity = document.createElement('a-entity');
        this.checkIndicatorEntity.setAttribute("gltf-model", "#check_indicator_id");
        this.checkIndicatorEntity.setAttribute("visible", "true");
        this.checkIndicatorEntity.setAttribute("scale", "0.32 0.32 0.32");

        this.xIndicatorEntity = document.createElement('a-entity');
        this.xIndicatorEntity.setAttribute("gltf-model", "#x_indicator_id");
        this.xIndicatorEntity.setAttribute("visible", "false");
        this.xIndicatorEntity.setAttribute("scale", "0.32 0.32 0.32");

        this.element.appendChild(this.checkIndicatorEntity);
        this.element.appendChild(this.xIndicatorEntity);

        this.element.addEventListener("chat-availability-change", (evt) => {
            this.setAvailabilityState(evt.detail === "full" ? "full" : "available");
        });

        this.handleOccupancyChanged = (evt) => {
            if (!evt.detail || !evt.detail.chatId || evt.detail.chatId === this.element.getAttribute("id")) {
                this.updateAvailability();
            }
        };
        document.addEventListener('chat-occupancy-changed', this.handleOccupancyChanged);

        this.positionIndicators = this.positionIndicators.bind(this);
        this.element.addEventListener("model-loaded", this.positionIndicators);
        this.checkIndicatorEntity.addEventListener("model-loaded", this.disableIndicatorCulling.bind(this));
        this.xIndicatorEntity.addEventListener("model-loaded", this.disableIndicatorCulling.bind(this));

        setTimeout(this.positionIndicators, 500);
        this.updateAvailability();
    },
    disableIndicatorCulling: function () {
        [this.checkIndicatorEntity, this.xIndicatorEntity].forEach(function (indicator) {
            indicator.object3D.traverse(function (object) {
                object.frustumCulled = false;
            });
        });
    },
    positionIndicators: function () {
        if (!this.element || !this.element.object3D) {
            return;
        }

        this.element.object3D.updateMatrixWorld(true);

        let bbox = new THREE.Box3().setFromObject(this.element.object3D);
        let worldPos = new THREE.Vector3();
        this.element.object3D.getWorldPosition(worldPos);

        if (bbox.isEmpty()) {
            bbox.min.copy(worldPos);
            bbox.max.copy(worldPos);
        }

        let targetWorldPos = new THREE.Vector3(worldPos.x, bbox.max.y + 0.5, worldPos.z);
        let localPos = targetWorldPos.clone();
        this.element.object3D.worldToLocal(localPos);

        this.checkIndicatorEntity.object3D.position.copy(localPos);
        this.xIndicatorEntity.object3D.position.copy(localPos);
    },
    getPrivateChatOccupancy: function () {
        let chatId = this.element.getAttribute("id");

        return [...document.querySelectorAll('[player-info]')].filter(function (playerEl) {
            if (!playerEl.components || !playerEl.components['player-info']) {
                return false;
            }

            return playerEl.components['player-info'].data.currentPrivateChat == chatId;
        }).length;
    },
    setAvailabilityState: function (state) {
        if (this.lastAvailabilityState === state) {
            return;
        }

        this.lastAvailabilityState = state;
        this.data.isfull = state === "full" ? "true" : "false";
        this.checkIndicatorEntity.setAttribute("visible", state !== "full");
        this.xIndicatorEntity.setAttribute("visible", state === "full");
    },
    updateAvailability: function () {
        let occupancy = this.getPrivateChatOccupancy();
        let isFull = this.maxParticipants !== Number.MAX_SAFE_INTEGER && occupancy >= this.maxParticipants;
        this.setAvailabilityState(isFull ? "full" : "available");
    },
    faceCamera: function () {
        let camera = document.getElementById('cameraA') || document.querySelector('[camera]');

        if (!camera || !camera.object3D) {
            return;
        }

        let cameraWorldPos = new THREE.Vector3();
        camera.object3D.getWorldPosition(cameraWorldPos);

        this.checkIndicatorEntity.object3D.lookAt(cameraWorldPos);
        // checkmark.glb has a different forward axis than xmark.glb, so compensate after billboarding.
        this.checkIndicatorEntity.object3D.rotateY(Math.PI * 1.5);

        this.xIndicatorEntity.object3D.lookAt(cameraWorldPos);
    },
    tick: function (time) {
        this.faceCamera();

        if (time - this.lastOccupancyCheck < 250) {
            return;
        }

        this.lastOccupancyCheck = time;
        this.updateAvailability();
    },
    remove: function () {
        this.element.removeEventListener("model-loaded", this.positionIndicators);
        document.removeEventListener('chat-occupancy-changed', this.handleOccupancyChanged);
    }
});
