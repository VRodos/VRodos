/**
 * VRodos Master Client A-Frame Components
 */

AFRAME.registerComponent('clear-frustum-culling', {
    init: function () {
        let el = this.el;
        el.addEventListener("model-loaded", e => {
            let mesh = el.getObject3D('mesh');
            if (!mesh) { return; }
            mesh.traverse(function (node) {
                if (node.isMesh) {
                    node.frustumCulled = false;
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
        });
    }
});

AFRAME.registerComponent('avatar-movement-info', {
    schema: {
        movementState: { type: 'string', default: 'idle' }
    },
    init: function () {

    }
});

AFRAME.registerComponent('avatar-rotation-info', {
    schema: {
        rotationState: { type: 'string', default: 'idle' }
    },
    init: function () {

    }
});

AFRAME.registerComponent('player-info', {
    schema: {
        name: { type: 'string', default: 'user-' + Math.round(Math.random() * 10000) },
        color: { type: 'color', default: typeof window.ntExample !== 'undefined' ? window.ntExample.randomColor() : '#cccccc' },
        gltf: { default: '', type: 'string' },
        avatarType: { default: 'blob', type: 'string' },
        animationsLoaded: { default: '', type: 'string' },
        currentPrivateChat: { default: '', type: 'string' },
        fullChatTable: { default: [], type: 'array' },
        connectedUsers: { default: 0, type: 'number' }
    },
    init: function () {
        this.anims_loaded = false;
        this.ownedByLocalUser = this.el.id === 'cameraA';

        if (this.ownedByLocalUser) {
            this.nametagInput = document.getElementById('username-overlay');
            if (this.nametagInput) {
                this.nametagInput.value = this.data.name;
            }
            const colorChanger = document.getElementById('color-changer');
            if (colorChanger) {
                colorChanger.style.backgroundColor = this.data.color;
                colorChanger.style.color = this.data.color;
            }
        }

        // Listen for template instantiation
        this.el.addEventListener('instantiated', (evt) => {
            this.applyAvatar();
        });

        // Always try to apply avatar on init.
        this.applyAvatar();
    },
    applyAvatar: function () {
        const elem = this.el;
        const isRemote = !this.ownedByLocalUser;

        this.head = this.el.querySelector('.head');
        this.face = this.el.querySelector('.face');
        this.nametag = this.el.querySelector('.nametag');


        if (isRemote) {
            if (!this.head && !this.rpm_model) {
                // Missing visuals handled by retry loop below
            }
        }

        if (!this.head && !this.rpm_model && !this.ownedByLocalUser) {
            // Only retry if we are using the expo template which is SUPPOSED to have these
            const networked = this.el.getAttribute('networked');
            if (networked && networked.template === '#avatar-template-expo') {
                if (!this.avatarRetryTimeout && (!this.retryCount || this.retryCount < 10)) {
                    this.retryCount = (this.retryCount || 0) + 1;
                    this.avatarRetryTimeout = setTimeout(() => {
                        this.avatarRetryTimeout = null;
                        if (this.el) this.applyAvatar();
                    }, 200);
                }
            }
            return;
        }

        if (this.data.avatarType) {
            if (this.data.avatarType === 'no-avatar') {
                if (this.head) this.head.setAttribute("visible", "false");
                if (this.face) this.face.setAttribute("visible", "false");
                if (this.nametag) this.nametag.setAttribute("visible", "false");
            } else if (this.data.avatarType === 'blob') {
                if (this.head) {
                    this.head.setAttribute('material', { color: this.data.color });
                    this.head.setAttribute('visible', 'true');
                }
                if (this.face) this.face.setAttribute('visible', 'true');
                if (this.nametag) {
                    this.nametag.setAttribute('value', this.data.name);
                    this.nametag.setAttribute('visible', 'true');
                }
            }
        }
    },
    update: function (oldData) {
        this.applyAvatar();
    },
    remove: function () {
        if (this.avatarRetryTimeout) {
            clearTimeout(this.avatarRetryTimeout);
        }
    }
});

AFRAME.registerComponent('scene-settings', {
    schema: {
        color: { type: "string", default: "#ffffff" },
        pr_type: { type: "string", default: "default" },
        img_link: { type: "string", default: "no_link" },
        selChoice: { type: "string", default: "0" },
        presChoice: { type: "string", default: "default" },
        movement_disabled: { type: "string", default: "0" },
        cam_position: { type: "string", default: "0 1.6 0" },
        cam_rotation_y: { type: "string", default: "0" },
        avatar_enabled: { type: "string", default: "0" },
        public_chat: { type: "string", default: "0" },
    },
    init: function () {
        // Event - When scene is loaded
        this.el.addEventListener("loaded", () => {
            if (this.data.pr_type === "vrexpo_games") {
                document.getElementById("cameraA").setAttribute("position", this.data.cam_position);
            }

            const privateChatBtn = document.getElementById("private-chat-button");
            if (privateChatBtn) {
                privateChatBtn.addEventListener("click", () => {
                    let event = new CustomEvent('chat-selected', { "detail": "private" });
                    document.dispatchEvent(event);
                    if (typeof gtag !== 'undefined') gtag('event', 'chat_private_tab_selected');
                });
            }

            const publicChatBtn = document.getElementById("public-chat-button");
            if (publicChatBtn) {
                publicChatBtn.addEventListener("click", (evt) => {
                    let event = new CustomEvent('chat-selected', { "detail": "public" });
                    document.dispatchEvent(event);
                    if (typeof gtag !== 'undefined') gtag('event', 'chat_public_tab_selected');
                });
            }

            const sceneContainer = document.getElementById("aframe-scene-container");
            if (sceneContainer) {
                const settings = sceneContainer.getAttribute("scene-settings");
                if (settings.public_chat == "0") {
                    if (privateChatBtn) privateChatBtn.disabled = true;
                } else {
                    if (publicChatBtn) {
                        publicChatBtn.style.visibility = 'visible';
                        publicChatBtn.classList.add('mdc-tab--active');
                        publicChatBtn.disabled = true;
                    }
                }
            }

            // Avatar Selector
            let avatarDialog = document.querySelector('#avatar-selection-dialog');
            if (avatarDialog) {
                let avatar_dialog_element = new mdc.dialog.MDCDialog(avatarDialog);
                let closeAvatarDialogListener = function (event) {
                    avatar_dialog_element.unlisten("MDCDialog:cancel", closeAvatarDialogListener);
                    if (typeof selectAvatarType !== 'undefined') selectAvatarType('no-avatar');
                };

                const settings = sceneContainer.getAttribute("scene-settings");
                if (settings && settings.avatar_enabled == 1) {
                    avatar_dialog_element.show();
                    avatar_dialog_element.listen("MDCDialog:cancel", closeAvatarDialogListener);
                } else {
                    if (typeof selectAvatarType !== 'undefined') selectAvatarType('no-avatar');
                }
            }
        });

        this.el.addEventListener("enter-vr", () => {
            if (typeof browsingModeVR !== 'undefined') browsingModeVR = true;
            if (typeof gtag !== 'undefined') gtag('event', 'vr_enabled');
        });
        this.el.addEventListener("exit-vr", () => {
            if (typeof browsingModeVR !== 'undefined') browsingModeVR = false;
            if (typeof gtag !== 'undefined') gtag('event', 'vr_disabled');
        });

        let cam = document.querySelector("#cameraA");
        if (cam) {
            if (this.data.pr_type !== "vrexpo_games") {
                cam.setAttribute("camera", "fov: 60");
            } else {
                cam.setAttribute("fov", "60");
                cam.setAttribute("camera", "fov: 60");
                let my_face = cam.querySelector('.face');
                if (my_face) my_face.setAttribute("visible", "false");
            }
        }

        let backgroundEl = this.el;
        if (!this.data.selChoice) this.data.selChoice = "0";

        switch (this.data.selChoice) {
            case "0":
                backgroundEl.removeAttribute("background");
                let oldSun = document.querySelector('a-sun-sky');
                if (oldSun) oldSun.parentNode.removeChild(oldSun);
                let manSky = document.getElementById('default-sky');
                if (manSky) manSky.parentNode.removeChild(manSky);
                let manSun = document.getElementById('default-sun');
                if (manSun) manSun.parentNode.removeChild(manSun);
                backgroundEl.setAttribute("environment", {
                    preset: 'default',
                    skyType: 'atmosphere',
                    lighting: 'distant',
                    ground: 'none',
                    playArea: 1,
                    shadow: true
                });
                break;
            case "1":
                backgroundEl.removeAttribute("environment");
                let manSky1 = document.getElementById('default-sky');
                if (manSky1) manSky1.parentNode.removeChild(manSky1);
                let manSun1 = document.getElementById('default-sun');
                if (manSun1) manSun1.parentNode.removeChild(manSun1);
                let oldSun1 = document.querySelector('a-sun-sky');
                if (oldSun1) oldSun1.parentNode.removeChild(oldSun1);
                backgroundEl.setAttribute("background", "color", this.data.color);
                break;
            case "2":
                let manSky2 = document.getElementById('default-sky');
                if (manSky2) manSky2.parentNode.removeChild(manSky2);
                let manSun2 = document.getElementById('default-sun');
                if (manSun2) manSun2.parentNode.removeChild(manSun2);
                let oldSun2 = document.querySelector('a-sun-sky');
                if (oldSun2) oldSun2.parentNode.removeChild(oldSun2);

                if (this.data.presChoice == "ocean") {
                    backgroundEl.removeAttribute("environment");
                    let sky = document.createElement('a-sky');
                    sky.setAttribute("color", "#a4bede");
                    backgroundEl.appendChild(sky);
                    let plane = document.createElement('a-plane');
                    plane.setAttribute("color", "#ffffff");
                    plane.setAttribute("position", "0 4.5 0");
                    plane.setAttribute("height", "11");
                    plane.setAttribute("width", "11");
                    plane.setAttribute("rotation", "90 90 0");
                    plane.setAttribute("material", "opacity:0.4");
                    plane.setAttribute("scale", "15 15 15");
                    plane.setAttribute("class", "ocean_asset");
                    backgroundEl.appendChild(plane);
                } else {
                    backgroundEl.setAttribute("environment", "preset", this.data.presChoice);
                    backgroundEl.setAttribute("environment", "ground", "flat");
                    backgroundEl.setAttribute("environment", "playArea", "1.4");
                    backgroundEl.setAttribute("environment", "shadow", "true");
                }
                break;
            case "3":
                let customImgAsset = document.querySelector('#custom_sky');
                if (customImgAsset && customImgAsset.getAttribute("src")) {
                    let skyElem = document.createElement('a-sky');
                    skyElem.setAttribute("id", "sky");
                    skyElem.setAttribute("src", "#custom_sky");
                    backgroundEl.appendChild(skyElem);
                } else {
                    backgroundEl.setAttribute("background", "color", "#ffffff");
                }
                break;
        }
    }
});

AFRAME.registerComponent('autoplay-sound', {
    init: function () {
        this.el.addEventListener("loaded", () => {
            this.el.components.sound.playSound();
        });
    }
});

AFRAME.registerComponent('entity-movement-emitter', {
    schema: {
        clip: { type: "string", default: "idle" },
    },
    init: function () {
        var shouldCaptureKeyEvent = AFRAME.utils.shouldCaptureKeyEvent;
        var elem = this.el;

        document.addEventListener('keydown', function (event) {
            const cameraA = document.getElementById('cameraA');
            if (!cameraA) return;

            if (event.keyCode === 87) {
                if (shouldCaptureKeyEvent(event)) {
                    cameraA.setAttribute('avatar-movement-info', 'movementState', "walkingforward");
                }
            } else if (event.keyCode === 83) {
                if (shouldCaptureKeyEvent(event)) {
                    elem.emit('avatar-changed-animation', "walkingdown", false);
                    cameraA.setAttribute('avatar-movement-info', 'movementState', "walkingdown");
                }
            } else if (event.keyCode === 68) {
                if (shouldCaptureKeyEvent(event)) {
                    elem.emit('avatar-changed-animation', "walkingright", false);
                    cameraA.setAttribute('avatar-movement-info', 'movementState', "walkingright");
                }
            } else if (event.keyCode === 65) {
                if (shouldCaptureKeyEvent(event)) {
                    elem.emit('avatar-changed-animation', "walkingleft", false);
                    cameraA.setAttribute('avatar-movement-info', 'movementState', "walkingleft");
                }
            } else {
                elem.emit('avatar-changed-animation', "idle", false);
            }
        });

        document.addEventListener('keyup', function (event) {
            const cameraA = document.getElementById('cameraA');
            if (cameraA) {
                elem.emit('avatar-changed-animation', "stopped", false);
                cameraA.setAttribute('avatar-movement-info', 'movementState', "stop");
            }
        });
    }
});

AFRAME.registerComponent('entity-rotation-emitter', {
    init: function () {
        this.el.addEventListener('componentchanged', function (evt) {
            if (evt.detail.name === 'rotation') {
                // Rotation sync handled by NAF
            }
        });
    }
});

AFRAME.registerComponent('animation-embed', {
    schema: {
        clip: { type: "string", default: "idle" },
        glb_id: { type: "string", default: "" }
    },
    init: function () {
        var loader = new THREE.GLTFLoader();
        this.el.addEventListener("model-loaded", e => {
            var objectMesh = this.el.getObject3D("mesh");
            var link = "../assets/templates/multimalev2.glb";
            var elem = this.el;
            if (this.el.object3DMap.mesh.children[0].userData.name === "Armature") {
                loader.load(link, function (gltf) {
                    for (let i = 0; i < gltf.animations.length; i++) {
                        objectMesh.animations[i] = gltf.animations[i];
                    }
                    elem.removeAttribute('animation-mixer');
                    elem.setAttribute('animation-mixer', "clip: idle");
                    elem.addState('loadedanimations');
                });
            } else {
                elem.addState('noanimations');
                elem.object3D.traverse((child) => {
                    if (child.name.includes('Hand')) {
                        child.visible = false;
                    }
                });
            }
        });
    }
});

AFRAME.registerComponent('static-mask-me', {
    init: function () {
        let el = this.el;
        const maskMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: false,
            colorWrite: false,
        });
        maskMaterial.needsUpdate = true;
        let mesh = el.getObject3D('mesh');
        if (!mesh) return;
        mesh.traverse(node => {
            if (node.isMesh) {
                node.material = maskMaterial;
                node.renderOrder = 999;
            }
        });
    }
});

AFRAME.registerComponent('render-order-change', {
    schema: {
        renderingOrderArg: { type: 'string', default: '2000' }
    },
    init: function () {
        let el = this.el;
        let mesh = el.getObject3D('mesh');
        if (!mesh) return;
        mesh.traverse(node => {
            if (node.isMesh) {
                node.renderOrder = this.data.renderingOrderArg;
            }
        });
    }
});

AFRAME.registerComponent("overlay", {
    dependencies: ['material'],
    init: function () {
        this.el.sceneEl.renderer.sortObjects = true;
        this.el.object3D.renderOrder = 100;
        if (this.el.components.material && this.el.components.material.material) {
            this.el.components.material.material.depthTest = false;
        }
    }
});

AFRAME.registerComponent('show-position', {
    init: function () {
        this.positionShow = document.getElementById("positionShow");
        this.occupantsNumberShow = document.getElementById("occupantsNumberShow");
    },
    tick: function (time, timeDelta) {
        if (this.positionShow) {
            let p = this.el.getAttribute('position');
            this.positionShow.innerHTML = Math.round(p.x * 100) / 100 + ", " + Math.round(p.y * 100) / 100 + ", " + Math.round(p.z * 100) / 100;
        }

        if (this.occupantsNumberShow && typeof window.easyrtc !== 'undefined' && typeof window.NAF !== 'undefined') {
            let occupants = window.easyrtc.getRoomOccupantsAsMap(window.NAF.room);
            if (occupants) {
                this.occupantsNumberShow.innerHTML = Object.keys(occupants).length;
            }
        }
    }
});

AFRAME.registerComponent('custom-movement', {
    init: function () {
        const cameraEl = document.querySelector('a-camera');
        const cameraRig = this.el;
        const thumbL = document.querySelector('#leftHand');
        const thumbR = document.querySelector('#rightHand');

        if (thumbL) {
            thumbL.addEventListener('thumbstickmoved', (event) => {
                // Movement logic for Oculus
            });
        }

        if (thumbR) {
            thumbR.addEventListener('thumbstickmoved', (event) => {
                const thumbstickX = event.detail.x;
                const thumbstickY = event.detail.y;
                if (cameraEl) {
                    const rotation = cameraEl.getAttribute('rotation');
                    const angleY = (rotation.y * Math.PI) / 180;
                    const direction = new THREE.Vector3(-Math.sin(angleY), 0, -Math.cos(angleY));
                    const movementSpeed = 0.1;
                    cameraRig.object3D.translateX(-direction.x * thumbstickY * movementSpeed - direction.z * thumbstickX * movementSpeed);
                    cameraRig.object3D.translateZ(-direction.z * thumbstickY * movementSpeed + direction.x * thumbstickX * movementSpeed);
                }
            });
        }
    }
});

AFRAME.registerComponent('start-animation', {
    init: function () {
        // Initialization for scene starting
    }
});
