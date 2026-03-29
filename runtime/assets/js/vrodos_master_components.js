/**
 * VRodos Master Client A-Frame Components
 */

AFRAME.registerComponent('clear-frustum-culling', {
    schema: {
        disableCulling: { type: 'boolean', default: false }
    },
    init: function () {
        let el = this.el;
        el.addEventListener("model-loaded", e => {
            let mesh = el.getObject3D('mesh');
            if (!mesh) { return; }
            mesh.traverse(function (node) {
                if (node.isMesh) {
                    if (this.data.disableCulling) {
                        node.frustumCulled = false;
                    }
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            }.bind(this));
        });
    }
});

AFRAME.registerComponent('vrodos-scene-loader', {
    schema: {
        fallbackMs: { type: 'number', default: 12000 },
        minimumVisibleMs: { type: 'number', default: 350 }
    },
    init: function () {
        this.sceneEl = this.el.sceneEl || this.el;
        this.revealTargets = [];
        this.pendingModelIds = {};
        this.pendingModelCount = 0;
        this.loadedAssets = false;
        this.isReady = false;
        this.startedAt = performance.now();
        this.loadingOverlay = null;
        this.progressLabel = null;
        this.boundHandleSceneLoaded = this.handleSceneLoaded.bind(this);
        this.boundHandleAssetsLoaded = this.handleAssetsLoaded.bind(this);
        this.boundHandleModelLoaded = this.handleModelLoaded.bind(this);
        this.boundHandleModelError = this.handleModelError.bind(this);

        this.createOverlay();

        this.sceneEl.addEventListener('loaded', this.boundHandleSceneLoaded);
        this.sceneEl.addEventListener('model-loaded', this.boundHandleModelLoaded);
        this.sceneEl.addEventListener('model-error', this.boundHandleModelError);

        this.fallbackTimeout = setTimeout(this.revealScene.bind(this), this.data.fallbackMs);
    },
    createOverlay: function () {
        var overlay = document.createElement('div');
        overlay.id = 'vrodos-scene-loader-overlay';
        overlay.setAttribute('aria-live', 'polite');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '99999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.gap = '14px';
        overlay.style.background = 'radial-gradient(circle at center, rgba(32, 36, 48, 0.98) 0%, rgba(8, 10, 16, 1) 72%)';
        overlay.style.color = '#f5f7fb';
        overlay.style.fontFamily = 'Segoe UI, sans-serif';
        overlay.style.letterSpacing = '0.02em';
        overlay.style.transition = 'opacity 240ms ease';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';

        var spinner = document.createElement('div');
        spinner.style.width = '42px';
        spinner.style.height = '42px';
        spinner.style.border = '3px solid rgba(255,255,255,0.16)';
        spinner.style.borderTopColor = '#ffffff';
        spinner.style.borderRadius = '50%';
        spinner.style.animation = 'vrodos-loader-spin 0.9s linear infinite';

        var title = document.createElement('div');
        title.textContent = 'Loading scene';
        title.style.fontSize = '18px';
        title.style.fontWeight = '600';

        var progress = document.createElement('div');
        progress.textContent = 'Preparing 3D assets...';
        progress.style.fontSize = '13px';
        progress.style.opacity = '0.78';

        if (!document.getElementById('vrodos-scene-loader-style')) {
            var style = document.createElement('style');
            style.id = 'vrodos-scene-loader-style';
            style.textContent = '@keyframes vrodos-loader-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }

        overlay.appendChild(spinner);
        overlay.appendChild(title);
        overlay.appendChild(progress);
        document.body.appendChild(overlay);

        this.loadingOverlay = overlay;
        this.progressLabel = progress;
    },
    handleSceneLoaded: function () {
        this.revealTargets = Array.prototype.slice.call(
            this.sceneEl.querySelectorAll('[data-vrodos-delayed-reveal="true"]')
        );

        var assetsEl = this.sceneEl.querySelector('#scene-assets');
        if (assetsEl) {
            assetsEl.addEventListener('loaded', this.boundHandleAssetsLoaded, { once: true });
            if (assetsEl.hasLoaded) {
                this.loadedAssets = true;
            }
        } else {
            this.loadedAssets = true;
        }

        this.pendingModelIds = {};
        this.pendingModelCount = 0;

        this.revealTargets.forEach(function (target) {
            if (!target.hasAttribute('gltf-model')) {
                return;
            }

            if (target.getObject3D('mesh')) {
                return;
            }

            var targetId = target.id || ('vrodos-reveal-' + this.pendingModelCount);
            if (!target.id) {
                target.id = targetId;
            }

            this.pendingModelIds[targetId] = true;
            this.pendingModelCount += 1;
        }, this);

        this.updateProgress();
        this.maybeRevealScene();
    },
    handleAssetsLoaded: function () {
        this.loadedAssets = true;
        this.updateProgress();
        this.maybeRevealScene();
    },
    handleModelLoaded: function (event) {
        if (!event || !event.target) {
            return;
        }

        this.resolvePendingModel(event.target);
    },
    handleModelError: function (event) {
        if (!event || !event.target) {
            return;
        }

        this.resolvePendingModel(event.target);
    },
    resolvePendingModel: function (target) {
        if (!target || !target.id || !this.pendingModelIds[target.id]) {
            return;
        }

        delete this.pendingModelIds[target.id];
        this.pendingModelCount = Math.max(0, this.pendingModelCount - 1);
        this.updateProgress();
        this.maybeRevealScene();
    },
    updateProgress: function () {
        if (!this.progressLabel) {
            return;
        }

        if (!this.revealTargets.length) {
            this.progressLabel.textContent = 'Preparing scene...';
            return;
        }

        var totalModelCount = 0;
        this.revealTargets.forEach(function (target) {
            if (target.hasAttribute('gltf-model')) {
                totalModelCount += 1;
            }
        });

        if (!this.loadedAssets) {
            this.progressLabel.textContent = 'Preparing assets...';
            return;
        }

        if (!totalModelCount) {
            this.progressLabel.textContent = 'Finalizing scene...';
            return;
        }

        var loadedModelCount = totalModelCount - this.pendingModelCount;
        this.progressLabel.textContent = 'Loading 3D assets ' + loadedModelCount + '/' + totalModelCount;
    },
    maybeRevealScene: function () {
        if (this.isReady || !this.loadedAssets || this.pendingModelCount > 0) {
            return;
        }

        var elapsed = performance.now() - this.startedAt;
        var remainingDelay = Math.max(0, this.data.minimumVisibleMs - elapsed);
        window.setTimeout(this.revealScene.bind(this), remainingDelay);
    },
    revealScene: function () {
        if (this.isReady) {
            return;
        }

        this.isReady = true;

        this.revealTargets.forEach(function (target) {
            target.setAttribute('visible', 'true');
            target.removeAttribute('data-vrodos-delayed-reveal');
        });

        if (this.loadingOverlay) {
            this.loadingOverlay.style.opacity = '0';
            window.setTimeout(function () {
                if (this.loadingOverlay && this.loadingOverlay.parentNode) {
                    this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
                }
                this.loadingOverlay = null;
            }.bind(this), 260);
        }

        if (this.fallbackTimeout) {
            clearTimeout(this.fallbackTimeout);
            this.fallbackTimeout = null;
        }
    },
    remove: function () {
        this.sceneEl.removeEventListener('loaded', this.boundHandleSceneLoaded);
        this.sceneEl.removeEventListener('model-loaded', this.boundHandleModelLoaded);
        this.sceneEl.removeEventListener('model-error', this.boundHandleModelError);

        if (this.fallbackTimeout) {
            clearTimeout(this.fallbackTimeout);
        }

        if (this.loadingOverlay && this.loadingOverlay.parentNode) {
            this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
        }
    }
});

var VRODOS_NAVMESH_DEFAULTS = {
    maxStepHeight: 0.6,
    maxDropHeight: 1.0,
    maxSlope: 45
};

function vrodosClamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function vrodosCreateHiddenNavmeshMaterial(sourceMaterial) {
    return new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        colorWrite: false,
        depthWrite: false
    });
}

AFRAME.registerComponent('vrodos-navmesh-helper', {
    init: function () {
        this.applyHiddenNavmeshState = this.applyHiddenNavmeshState.bind(this);
        this.el.addEventListener('model-loaded', this.applyHiddenNavmeshState);

        if (this.el.getObject3D('mesh')) {
            this.applyHiddenNavmeshState();
        }
    },
    applyHiddenNavmeshState: function () {
        var meshRoot = this.el.getObject3D('mesh');
        if (!meshRoot) {
            return;
        }

        meshRoot.visible = true;
        meshRoot.traverse(function (node) {
            if (!node.isMesh) {
                return;
            }

            node.frustumCulled = false;
            node.castShadow = false;
            node.receiveShadow = false;

            if (Array.isArray(node.material)) {
                node.material = node.material.map(function (material) {
                    return vrodosCreateHiddenNavmeshMaterial(material);
                });
            } else if (node.material) {
                node.material = vrodosCreateHiddenNavmeshMaterial(node.material);
            }
        });
    },
    remove: function () {
        this.el.removeEventListener('model-loaded', this.applyHiddenNavmeshState);
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
        presetGroundEnabled: { type: "string", default: "1" },
        movement_disabled: { type: "string", default: "0" },
        collisionMode: { type: "string", default: "auto" },
        renderQuality: { type: "string", default: "standard" },
        shadowQuality: { type: "string", default: "medium" },
        postFXEnabled: { type: "string", default: "0" },
        cam_position: { type: "string", default: "0 1.6 0" },
        cam_rotation_y: { type: "string", default: "0" },
        avatar_enabled: { type: "string", default: "0" },
        public_chat: { type: "string", default: "0" },
    },
    applyRenderQualityProfile: function () {
        var renderer = this.el.renderer;
        if (!renderer) {
            return;
        }

        var isHighQuality = this.data.renderQuality === 'high';
        var targetPixelRatio = isHighQuality ? Math.min(window.devicePixelRatio || 1, 2) : Math.min(window.devicePixelRatio || 1, 1.25);
        renderer.setPixelRatio(targetPixelRatio);
        renderer.sortObjects = true;

        if (typeof renderer.toneMappingExposure !== 'undefined') {
            renderer.toneMappingExposure = isHighQuality ? 1.06 : 1.0;
        }

        if (typeof renderer.physicallyCorrectLights !== 'undefined') {
            renderer.physicallyCorrectLights = isHighQuality;
        }

        if (typeof renderer.outputColorSpace !== 'undefined' && typeof THREE.SRGBColorSpace !== 'undefined') {
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        } else if (typeof renderer.outputEncoding !== 'undefined' && typeof THREE.sRGBEncoding !== 'undefined') {
            renderer.outputEncoding = THREE.sRGBEncoding;
        }
    },
    applyShadowQualityProfile: function () {
        var renderer = this.el.renderer;
        var shadowQuality = this.data.shadowQuality || 'medium';
        var shadowsEnabled = shadowQuality !== 'off';

        if (renderer && renderer.shadowMap) {
            renderer.shadowMap.enabled = shadowsEnabled;
            renderer.shadowMap.type = shadowQuality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFSoftShadowMap;
            renderer.shadowMap.needsUpdate = true;
        }

        if (this.el.hasAttribute('environment')) {
            this.el.setAttribute('environment', 'shadow', shadowsEnabled ? 'true' : 'false');
        }

        this.el.object3D.traverse(function (node) {
            if (node.isMesh) {
                var isNavmeshMesh = !!(node.el && node.el.classList && node.el.classList.contains('vrodos-navmesh'));
                if (isNavmeshMesh) {
                    node.castShadow = false;
                    node.receiveShadow = false;
                    return;
                }

                node.castShadow = shadowsEnabled;
                node.receiveShadow = shadowsEnabled;
            }

            if (node.isDirectionalLight || node.isSpotLight || node.isPointLight) {
                node.castShadow = shadowsEnabled;

                if (!node.shadow) {
                    return;
                }

                if (shadowsEnabled) {
                    var targetMapSize = shadowQuality === 'high'
                        ? (node.isDirectionalLight ? 2048 : 1024)
                        : (node.isDirectionalLight ? 1024 : 512);

                    if (node.shadow.mapSize) {
                        node.shadow.mapSize.x = Math.max(node.shadow.mapSize.x || 0, targetMapSize);
                        node.shadow.mapSize.y = Math.max(node.shadow.mapSize.y || 0, targetMapSize);
                    }

                    if (typeof node.shadow.bias !== 'undefined' && !node.shadow.bias) {
                        node.shadow.bias = -0.0001;
                    }
                }

                node.shadow.needsUpdate = true;
            }
        });
    },
    applyPostFXProfile: function () {
        var renderer = this.el.renderer;
        var canvas = this.el.canvas || (renderer ? renderer.domElement : null);
        var postFxEnabled = this.data.renderQuality === 'high' && this.data.postFXEnabled !== '0';

        if (!canvas) {
            return;
        }

        canvas.style.filter = postFxEnabled ? 'contrast(1.04) saturate(1.03) brightness(1.01)' : '';

        if (renderer && typeof renderer.toneMappingExposure !== 'undefined' && postFxEnabled) {
            renderer.toneMappingExposure = 1.1;
        }
    },
    applyQualityProfiles: function () {
        this.applyRenderQualityProfile();
        this.applyShadowQualityProfile();
        this.applyPostFXProfile();
    },
    init: function () {
        this.handleQualityModelLoad = this.applyQualityProfiles.bind(this);
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

            this.applyQualityProfiles();
        });
        this.el.addEventListener('model-loaded', this.handleQualityModelLoad);

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
        const presetGroundEnabled = this.data.presetGroundEnabled !== "0";
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
                    fog: 0,
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
                let oldOceanPlane = backgroundEl.querySelector('.ocean_asset');
                if (oldOceanPlane) oldOceanPlane.parentNode.removeChild(oldOceanPlane);
                let oldPresetSky = backgroundEl.querySelector('a-sky[data-vrodos-preset-sky="true"]');
                if (oldPresetSky) oldPresetSky.parentNode.removeChild(oldPresetSky);

                if (this.data.presChoice == "ocean") {
                    backgroundEl.removeAttribute("environment");
                    let sky = document.createElement('a-sky');
                    sky.setAttribute("color", "#a4bede");
                    sky.setAttribute("data-vrodos-preset-sky", "true");
                    backgroundEl.appendChild(sky);
                    if (presetGroundEnabled) {
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
                    }
                } else {
                    backgroundEl.setAttribute("environment", "preset", this.data.presChoice);
                    backgroundEl.setAttribute("environment", "ground", presetGroundEnabled ? "flat" : "none");
                    backgroundEl.setAttribute("environment", "fog", "0");
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

        this.applyQualityProfiles();
    },
    remove: function () {
        this.el.removeEventListener('model-loaded', this.handleQualityModelLoad);
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
    schema: {
        movementSpeed: { type: 'number', default: 3.2 },
        maxStepHeight: { type: 'number', default: VRODOS_NAVMESH_DEFAULTS.maxStepHeight },
        maxDropHeight: { type: 'number', default: VRODOS_NAVMESH_DEFAULTS.maxDropHeight },
        maxSlope: { type: 'number', default: VRODOS_NAVMESH_DEFAULTS.maxSlope }
    },
    init: function () {
        this.cameraRig = this.el;
        this.sceneEl = this.el.sceneEl;
        this.cameraEl = document.querySelector('#cameraA') || document.querySelector('a-camera');
        this.thumbInput = { x: 0, y: 0 };
        this.keyboardInput = { x: 0, y: 0 };
        this.navMeshRoots = [];
        this.navMeshDirty = true;
        this.navMeshBounds = new THREE.Box3();
        this.navMeshRootBounds = new THREE.Box3();
        this.heightOffset = null;
        this.lastResolvedPosition = new THREE.Vector3();
        this.lastGroundHit = null;
        this.upVector = new THREE.Vector3(0, 1, 0);
        this.forwardVector = new THREE.Vector3();
        this.rightVector = new THREE.Vector3();
        this.currentWorldPosition = new THREE.Vector3();
        this.targetWorldPosition = new THREE.Vector3();
        this.movementOffset = new THREE.Vector3();
        this.stepPosition = new THREE.Vector3();
        this.stepDelta = new THREE.Vector3();
        this.boundsSize = new THREE.Vector3();
        this.boundsClosestPoint = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        this.wasdControlsSuppressed = null;
        this.lastRecoveryAttemptAt = 0;
        this.positionPrimed = false;

        this.handleThumbstickMove = this.handleThumbstickMove.bind(this);
        this.handleThumbstickEnd = this.handleThumbstickEnd.bind(this);
        this.handleNavmeshModelLoad = this.handleNavmeshModelLoad.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);

        this.thumbL = document.querySelector('#leftHand');
        this.thumbR = document.querySelector('#rightHand');

        if (this.thumbL) {
            this.thumbL.addEventListener('thumbstickmoved', this.handleThumbstickMove);
        }

        if (this.thumbR) {
            this.thumbR.addEventListener('thumbstickmoved', this.handleThumbstickMove);
        }

        this.sceneEl.addEventListener('model-loaded', this.handleNavmeshModelLoad);
        this.sceneEl.addEventListener('loaded', () => {
            this.navMeshDirty = true;
            this.lastGroundHit = null;
            this.positionPrimed = false;
        });

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    },
    handleThumbstickMove: function (event) {
        if (!event || !event.detail) {
            return;
        }

        this.thumbInput.x = event.detail.x || 0;
        this.thumbInput.y = event.detail.y || 0;
    },
    handleThumbstickEnd: function () {
        this.thumbInput.x = 0;
        this.thumbInput.y = 0;
    },
    handleNavmeshModelLoad: function (event) {
        if (!event || !event.target || !event.target.classList || !event.target.classList.contains('vrodos-navmesh')) {
            return;
        }

        this.navMeshDirty = true;
        this.syncHeightOffset();
    },
    shouldIgnoreKeyboardEvent: function (event) {
        var target = event ? event.target : null;
        if (!target) {
            return false;
        }

        var tagName = target.tagName ? target.tagName.toLowerCase() : '';
        return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
    },
    updateKeyboardAxis: function (code, isPressed) {
        switch (code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keyboardInput.y = isPressed ? -1 : (this.keyboardInput.y === -1 ? 0 : this.keyboardInput.y);
                return true;
            case 'KeyS':
            case 'ArrowDown':
                this.keyboardInput.y = isPressed ? 1 : (this.keyboardInput.y === 1 ? 0 : this.keyboardInput.y);
                return true;
            case 'KeyA':
            case 'ArrowLeft':
                this.keyboardInput.x = isPressed ? -1 : (this.keyboardInput.x === -1 ? 0 : this.keyboardInput.x);
                return true;
            case 'KeyD':
            case 'ArrowRight':
                this.keyboardInput.x = isPressed ? 1 : (this.keyboardInput.x === 1 ? 0 : this.keyboardInput.x);
                return true;
        }

        return false;
    },
    handleKeyDown: function (event) {
        if (!event || this.shouldIgnoreKeyboardEvent(event)) {
            return;
        }

        if (this.updateKeyboardAxis(event.code, true)) {
            event.preventDefault();
        }
    },
    handleKeyUp: function (event) {
        if (!event) {
            return;
        }

        if (this.updateKeyboardAxis(event.code, false)) {
            event.preventDefault();
        }
    },
    remove: function () {
        if (this.thumbL) {
            this.thumbL.removeEventListener('thumbstickmoved', this.handleThumbstickMove);
        }
        if (this.thumbR) {
            this.thumbR.removeEventListener('thumbstickmoved', this.handleThumbstickMove);
        }
        this.sceneEl.removeEventListener('model-loaded', this.handleNavmeshModelLoad);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    },
    getSceneSettings: function () {
        return this.sceneEl ? this.sceneEl.getAttribute('scene-settings') : null;
    },
    getNavigationAnchorObject: function () {
        if (this.cameraEl && this.cameraEl.object3D) {
            return this.cameraEl.object3D;
        }

        return this.cameraRig ? this.cameraRig.object3D : null;
    },
    getNavigationWorldPosition: function () {
        var anchorObject = this.getNavigationAnchorObject();
        if (!anchorObject) {
            return this.currentWorldPosition.set(0, 0, 0);
        }

        return anchorObject.getWorldPosition(this.currentWorldPosition);
    },
    setNavigationWorldPosition: function (targetWorldPosition) {
        var anchorObject = this.getNavigationAnchorObject();
        if (!anchorObject || !this.cameraRig || !this.cameraRig.object3D) {
            return false;
        }

        var currentWorldPosition = this.getNavigationWorldPosition();
        this.movementOffset.copy(targetWorldPosition).sub(currentWorldPosition);
        this.cameraRig.object3D.position.add(this.movementOffset);
        return true;
    },
    horizontalDistanceSquared: function (pointA, pointB) {
        if (!pointA || !pointB) {
            return Infinity;
        }

        var deltaX = pointA.x - pointB.x;
        var deltaZ = pointA.z - pointB.z;
        return deltaX * deltaX + deltaZ * deltaZ;
    },
    ensureNavigationStatePrimed: function () {
        if (this.positionPrimed) {
            return;
        }

        this.lastResolvedPosition.copy(this.getNavigationWorldPosition());
        this.lastGroundHit = null;

        if (this.areCollisionsEnabled()) {
            this.syncHeightOffset();
            this.lastResolvedPosition.copy(this.getNavigationWorldPosition());
        }

        this.positionPrimed = true;
    },
    refreshNavMeshRoots: function () {
        if (!this.navMeshDirty) {
            return;
        }

        this.navMeshRoots = [];
        this.navMeshBounds.makeEmpty();

        var navMeshEntities = this.sceneEl.querySelectorAll('.vrodos-navmesh');
        for (var i = 0; i < navMeshEntities.length; i++) {
            var meshRoot = navMeshEntities[i].getObject3D('mesh');
            if (meshRoot) {
                this.navMeshRoots.push(meshRoot);
                this.navMeshRootBounds.setFromObject(meshRoot);
                if (!this.navMeshRootBounds.isEmpty()) {
                    this.navMeshBounds.union(this.navMeshRootBounds);
                }
            }
        }

        this.navMeshDirty = false;
    },
    getRecoverySearchRadius: function (position) {
        this.refreshNavMeshRoots();
        if (this.navMeshRoots.length === 0 || this.navMeshBounds.isEmpty()) {
            return 12;
        }

        this.navMeshBounds.getSize(this.boundsSize);
        var boundsRadius = vrodosClamp(this.boundsSize.length() * 0.35, 12, 120);

        this.boundsClosestPoint.copy(position);
        this.navMeshBounds.clampPoint(position, this.boundsClosestPoint);
        var horizontalDistanceToBounds = Math.sqrt(this.horizontalDistanceSquared(position, this.boundsClosestPoint));

        return Math.max(boundsRadius, horizontalDistanceToBounds + 6);
    },
    areCollisionsEnabled: function () {
        var settings = this.getSceneSettings();
        if (!settings || settings.collisionMode === 'off') {
            return false;
        }

        this.refreshNavMeshRoots();
        return this.navMeshRoots.length > 0;
    },
    getMovementDeltaFromInput: function (inputX, inputY, distance) {
        var referenceEl = this.cameraEl || this.cameraRig || document.querySelector('#cameraA') || document.querySelector('a-camera');
        if (!referenceEl || !referenceEl.object3D) {
            return null;
        }

        referenceEl.object3D.getWorldDirection(this.forwardVector);
        this.forwardVector.y = 0;
        if (this.forwardVector.lengthSq() < 0.000001) {
            this.forwardVector.set(0, 0, -1);
        } else {
            this.forwardVector.normalize();
        }

        this.rightVector.crossVectors(this.forwardVector, this.upVector).normalize().negate();

        return {
            x: (-this.forwardVector.x * inputY + this.rightVector.x * inputX) * distance,
            z: (-this.forwardVector.z * inputY + this.rightVector.z * inputX) * distance
        };
    },
    updateWASDControlsState: function (collisionsEnabled) {
        if (this.wasdControlsSuppressed === collisionsEnabled) {
            return;
        }

        if (this.el.components && this.el.components['wasd-controls']) {
            this.el.setAttribute('wasd-controls', 'fly: false; acceleration: 20; enabled: ' + (collisionsEnabled ? 'false' : 'true'));
        }

        this.wasdControlsSuppressed = collisionsEnabled;
    },
    sampleGroundAt: function (position, referenceGroundY) {
        this.refreshNavMeshRoots();
        if (this.navMeshRoots.length === 0) {
            return null;
        }

        var originY = typeof referenceGroundY === 'number'
            ? referenceGroundY + this.data.maxStepHeight + 2
            : position.y + this.data.maxStepHeight + 2;

        this.raycaster.set(
            new THREE.Vector3(position.x, originY, position.z),
            new THREE.Vector3(0, -1, 0)
        );
        this.raycaster.far = this.data.maxStepHeight + this.data.maxDropHeight + 20;

        var intersections = this.raycaster.intersectObjects(this.navMeshRoots, true);
        for (var i = 0; i < intersections.length; i++) {
            var hit = intersections[i];
            if (!hit.face) {
                continue;
            }

            var worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
            var slope = THREE.MathUtils.radToDeg(Math.acos(vrodosClamp(worldNormal.dot(this.upVector), -1, 1)));

            if (slope <= this.data.maxSlope) {
                return {
                    point: hit.point.clone(),
                    normal: worldNormal,
                    slope: slope
                };
            }
        }

        return null;
    },
    canAttemptRecovery: function () {
        var now = performance.now();
        if (now - this.lastRecoveryAttemptAt < 250) {
            return false;
        }

        this.lastRecoveryAttemptAt = now;
        return true;
    },
    findNearestGroundAt: function (position, searchRadius) {
        var radius = typeof searchRadius === 'number' ? searchRadius : 6;
        var bestGround = this.sampleGroundAt(position);
        var bestDistanceSq = bestGround ? this.horizontalDistanceSquared(bestGround.point, position) : Infinity;

        if (bestGround && bestDistanceSq < 0.0001) {
            return bestGround;
        }

        var radii = [0.5, 1, 2, 4, radius];
        var angles = [0, 45, 90, 135, 180, 225, 270, 315];

        for (var r = 0; r < radii.length; r++) {
            var offsetRadius = radii[r];
            if (offsetRadius > radius) {
                continue;
            }

            for (var a = 0; a < angles.length; a++) {
                var radians = THREE.MathUtils.degToRad(angles[a]);
                this.targetWorldPosition.set(
                    position.x + Math.cos(radians) * offsetRadius,
                    position.y,
                    position.z + Math.sin(radians) * offsetRadius
                );

                var candidateGround = this.sampleGroundAt(this.targetWorldPosition);
                if (!candidateGround) {
                    continue;
                }

                var distanceSq = this.horizontalDistanceSquared(candidateGround.point, position);
                if (distanceSq < bestDistanceSq) {
                    bestGround = candidateGround;
                    bestDistanceSq = distanceSq;
                }
            }
        }

        return bestGround;
    },
    resolveMovementAgainstGround: function (currentPosition, deltaX, deltaZ, currentGround) {
        this.stepDelta.set(deltaX, 0, deltaZ);
        var totalDistance = this.stepDelta.length();
        if (totalDistance < 0.00001) {
            return {
                position: currentPosition.clone(),
                ground: currentGround
            };
        }

        var steps = Math.max(1, Math.ceil(totalDistance / 0.2));
        var bestPosition = currentPosition.clone();
        var bestGround = currentGround;

        for (var step = 1; step <= steps; step++) {
            this.stepPosition.copy(currentPosition);
            this.stepPosition.x += deltaX * (step / steps);
            this.stepPosition.z += deltaZ * (step / steps);

            var stepGround = this.sampleGroundAt(this.stepPosition, bestGround.point.y);
            if (!stepGround) {
                stepGround = this.findNearestGroundAt(this.stepPosition, 1.5);
            }
            if (!stepGround) {
                break;
            }

            var deltaY = stepGround.point.y - bestGround.point.y;
            if (deltaY > this.data.maxStepHeight || deltaY < -this.data.maxDropHeight) {
                break;
            }

            bestPosition.copy(this.stepPosition);
            bestGround = stepGround;
        }

        if (bestPosition.distanceToSquared(currentPosition) < 0.0000001) {
            return null;
        }

        return {
            position: bestPosition.clone(),
            ground: bestGround
        };
    },
    snapNavigationToGround: function (groundHit) {
        if (!groundHit) {
            return false;
        }

        if (this.heightOffset === null) {
            var currentPosition = this.getNavigationWorldPosition();
            this.heightOffset = currentPosition.y - groundHit.point.y;
        }

        this.heightOffset = vrodosClamp(this.heightOffset, 0.2, 2.5);
        this.targetWorldPosition.set(
            groundHit.point.x,
            groundHit.point.y + this.heightOffset,
            groundHit.point.z
        );

        if (!this.setNavigationWorldPosition(this.targetWorldPosition)) {
            return false;
        }

        this.lastResolvedPosition.copy(this.targetWorldPosition);
        this.lastGroundHit = {
            point: groundHit.point.clone(),
            normal: groundHit.normal ? groundHit.normal.clone() : null,
            slope: groundHit.slope
        };
        return true;
    },
    syncHeightOffset: function () {
        if (!this.areCollisionsEnabled()) {
            return;
        }

        var navigationPosition = this.getNavigationWorldPosition();
        var currentGround = this.findNearestGroundAt(navigationPosition, this.getRecoverySearchRadius(navigationPosition));
        if (!currentGround) {
            return;
        }

        this.heightOffset = vrodosClamp(navigationPosition.y - currentGround.point.y, 0.2, 2.5);
        this.snapNavigationToGround(currentGround);
    },
    applyDirectMovement: function (deltaX, deltaZ) {
        if (Math.abs(deltaX) < 0.00001 && Math.abs(deltaZ) < 0.00001) {
            return;
        }

        this.targetWorldPosition.copy(this.lastResolvedPosition);
        this.targetWorldPosition.x += deltaX;
        this.targetWorldPosition.z += deltaZ;

        if (this.setNavigationWorldPosition(this.targetWorldPosition)) {
            this.lastResolvedPosition.copy(this.targetWorldPosition);
            this.lastGroundHit = null;
        }
    },
    applyConstrainedMovement: function (deltaX, deltaZ) {
        if (Math.abs(deltaX) < 0.00001 && Math.abs(deltaZ) < 0.00001) {
            return true;
        }

        if (this.heightOffset === null) {
            this.syncHeightOffset();
        }

        var currentPosition = this.lastResolvedPosition.clone();
        var currentGround = this.lastGroundHit;
        if (currentGround && currentGround.point && this.horizontalDistanceSquared(currentGround.point, currentPosition) > (1.5 * 1.5)) {
            currentGround = null;
        }
        if (!currentGround) {
            currentGround = this.sampleGroundAt(
                currentPosition,
                this.lastGroundHit && this.lastGroundHit.point ? this.lastGroundHit.point.y : undefined
            );
        }
        if (!currentGround) {
            var navigationPosition = this.getNavigationWorldPosition();
            if (!this.canAttemptRecovery()) {
                return false;
            }

            currentGround = this.findNearestGroundAt(navigationPosition, this.getRecoverySearchRadius(navigationPosition));
            if (!currentGround) {
                return false;
            }

            if (this.heightOffset === null) {
                this.heightOffset = vrodosClamp(navigationPosition.y - currentGround.point.y, 0.2, 2.5);
            }

            if (!this.snapNavigationToGround(currentGround)) {
                return false;
            }

            currentPosition.copy(this.lastResolvedPosition);
        }

        var resolvedStep = this.resolveMovementAgainstGround(currentPosition, deltaX, deltaZ, currentGround);
        if (!resolvedStep) {
            return false;
        }

        var nextY = resolvedStep.ground.point.y + (this.heightOffset !== null ? this.heightOffset : 0);
        this.targetWorldPosition.set(resolvedStep.position.x, nextY, resolvedStep.position.z);
        if (!this.setNavigationWorldPosition(this.targetWorldPosition)) {
            return false;
        }

        this.lastResolvedPosition.copy(this.targetWorldPosition);
        this.lastGroundHit = {
            point: resolvedStep.ground.point.clone(),
            normal: resolvedStep.ground.normal ? resolvedStep.ground.normal.clone() : null,
            slope: resolvedStep.ground.slope
        };
        return true;
    },
    tick: function (time, timeDelta) {
        var settings = this.getSceneSettings();
        if (!settings) {
            return;
        }

        var movementDisabled = settings.movement_disabled === true || settings.movement_disabled === 'true' || settings.movement_disabled === '1';
        if (movementDisabled) {
            this.setNavigationWorldPosition(this.lastResolvedPosition);
            return;
        }

        this.ensureNavigationStatePrimed();

        var currentPosition = this.getNavigationWorldPosition().clone();
        var externalDeltaX = currentPosition.x - this.lastResolvedPosition.x;
        var externalDeltaZ = currentPosition.z - this.lastResolvedPosition.z;
        var hasExternalMovement = Math.abs(externalDeltaX) > 0.0001 || Math.abs(externalDeltaZ) > 0.0001;
        var collisionsEnabled = this.areCollisionsEnabled();
        this.updateWASDControlsState(collisionsEnabled);

        if (hasExternalMovement) {
            this.setNavigationWorldPosition(this.lastResolvedPosition);

            if (collisionsEnabled) {
                this.applyConstrainedMovement(externalDeltaX, externalDeltaZ);
            } else {
                this.applyDirectMovement(externalDeltaX, externalDeltaZ);
            }
        }

        var thumbstickX = Math.abs(this.thumbInput.x) > 0.08 ? this.thumbInput.x : 0;
        var thumbstickY = Math.abs(this.thumbInput.y) > 0.08 ? this.thumbInput.y : 0;
        var keyboardX = collisionsEnabled ? this.keyboardInput.x : 0;
        var keyboardY = collisionsEnabled ? this.keyboardInput.y : 0;
        var inputX = vrodosClamp(keyboardX + thumbstickX, -1, 1);
        var inputY = vrodosClamp(keyboardY + thumbstickY, -1, 1);

        if (inputX === 0 && inputY === 0) {
            if (!hasExternalMovement) {
                this.lastResolvedPosition.copy(this.getNavigationWorldPosition());
            }
            return;
        }

        var movementDistance = this.data.movementSpeed * (Math.min(timeDelta, 50) / 1000);
        var movementDelta = this.getMovementDeltaFromInput(inputX, inputY, movementDistance);
        if (!movementDelta) {
            return;
        }

        if (collisionsEnabled) {
            this.applyConstrainedMovement(movementDelta.x, movementDelta.z);
        } else {
            this.applyDirectMovement(movementDelta.x, movementDelta.z);
        }
    }
});

AFRAME.registerComponent('start-animation', {
    init: function () {
        // Initialization for scene starting
    }
});
