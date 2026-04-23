/**
 * VRODOS VIDEO MANAGER
 * Central utility for handling shared logic across video components.
 */
window.VRODOS_VIDEO_MANAGER = {
    /**
     * Consolidates viewport calculation logic.
     */
    getViewportAtDepth: function (depth, camera) {
        camera = camera || (AFRAME.scenes[0] && AFRAME.scenes[0].camera);
        if (!camera) return { height: 0, width: 0 };

        const cameraOffset = camera.position.z;
        let zDepth = depth;
        if (zDepth < cameraOffset) zDepth -= cameraOffset;
        else zDepth += cameraOffset;

        const vFOV = (camera.fov * Math.PI) / 180;
        const height = 2 * Math.tan(vFOV / 2) * Math.abs(zDepth);
        const width = height * camera.aspect;

        return { height, width };
    },

    /**
     * Consolidates play icon update logic (merged playUpd and updatePlayEntity).
     */
    updatePlayIcon: function (obj, isPaused, dataId) {
        if (!obj) return;
        const icon3d = obj.querySelector('[vrodos-3d-play-icon]');
        if (isPaused) {
            if (icon3d) icon3d.setAttribute("visible", "true");
            obj.setAttribute("material", "visible: false");
        } else {
            if (icon3d) icon3d.setAttribute("visible", "false");
            obj.setAttribute("src", "#video_pas_" + dataId);
            obj.setAttribute("material", "visible: true; transparent: true; opacity: 1; depthTest: false");
        }
    },

    /**
     * Consolidates entity visibility and state logic (merged handleCamEntity and handleCamEntityText).
     */
    setEntityState: function (obj, isVisible, isTransparent, opacity) {
        if (!obj) return;
        if (isVisible) {
            if (obj.components && obj.components.material) {
                obj.components.material.material.depthTest = false;
                obj.components.material.material.transparent = isTransparent;
                obj.components.material.material.opacity = opacity;
            }
            if (obj.components && obj.components.text && obj.components.text.material) {
                obj.components.text.material.depthTest = false;
                obj.components.text.material.transparent = isTransparent;
                obj.components.text.material.opacity = opacity;
            }
            obj.setAttribute("visible", "true");
            obj.setAttribute("scale", "1 1 1");
        } else {
            obj.setAttribute("visible", "false");
            obj.setAttribute("scale", "0.0001 0.0001 0.0001");
        }
    },

    /**
     * Manages scene environment changes for video playback (fog, presets, background).
     */
    toggleVideoEnvironment: function (sceneEl, isFS) {
        if (!sceneEl) return;
        const settings = sceneEl.getAttribute("scene-settings") || {};
        const selPreset = settings.presChoice;

        if (isFS) {
            // Enter Fullscreen Environment
            if (settings.selChoice == "2" && selPreset != "ocean") {
                sceneEl.setAttribute("environment", "preset", "default");
                sceneEl.setAttribute("environment", "ground", "none");
            } else if (settings.selChoice == "2" && selPreset == "ocean") {
                sceneEl.setAttribute("fog", "type: linear; color: #AAB; far: 230; near: 0");
                const oceanCollection = document.getElementsByClassName("ocean_asset");
                for (let i = 0; i < oceanCollection.length; i++) {
                    oceanCollection[i].setAttribute("visible", "false");
                }
            }
            sceneEl.setAttribute("background", "color", "black");
            sceneEl.setAttribute("overlay", "");
        } else {
            // Restore Original Environment
            const bcgCol = settings.color || "black";
            sceneEl.setAttribute("background", "color", bcgCol);
            sceneEl.removeAttribute("overlay");

            if (settings.selChoice == "2" && selPreset != "ocean") {
                sceneEl.setAttribute("environment", "preset", selPreset);
                sceneEl.setAttribute("environment", "ground", "flat");
            } else if (settings.selChoice == "2" && selPreset == "ocean") {
                const oceanCollection = document.getElementsByClassName("ocean_asset");
                for (let i = 0; i < oceanCollection.length; i++) {
                    oceanCollection[i].setAttribute("visible", "true");
                }
                sceneEl.setAttribute("fog", "type: exponential; color: #0894d3; density: 0.06;");
            }
        }
    }
};

AFRAME.registerComponent('video-controls', {
    schema: {
        id: { default: "default value" },
        orig_pos: {
            default: ['0', '0', '0'],
            parse: function (val) {
                if (typeof val === 'string') return val.split(',');
                return val || ['0', '0', '0'];
            }
        },
        orig_rot: {
            default: ['0', '0', '0'],
            parse: function (val) {
                if (typeof val === 'string') return val.split(',');
                return val || ['0', '0', '0'];
            }
        }
    },

    init: function () {
        // IDs and Strings
        this.videoElementId = "video_" + this.data.id;
        this.video_id = "#" + this.videoElementId;
        this.video_display_id = "#video-display_" + this.data.id;
        this.vid_panel_id = "#vid-panel_" + this.data.id;

        // Element Selection
        this.videoDisplay = document.querySelector(this.video_display_id);
        this.playHintEl = document.querySelector("#video-playhint_" + this.data.id);
        this.videoPanel = document.querySelector(this.vid_panel_id);
        this.fsEl = document.querySelector("#ent_fs_" + this.data.id);
        this.plEl = document.querySelector("#ent_pl_" + this.data.id);
        this.pauseEl = document.querySelector("#ent_ex_" + this.data.id);
        this.exEl = document.querySelector("#ent_ex_" + this.data.id);
        this.exFrameEl = document.querySelector("#exit_vid_panel_" + this.data.id);
        this.titEl = document.querySelector("#ent_tit_" + this.data.id);
        this.backgroundEl = document.querySelector('#aframe-scene-container');
        this.cursorEl = document.querySelector('#cursor');
        this.playerEl = document.querySelector('#cameraA');
        this.rightHand = document.querySelector('#oculusRight');
        this.cam = document.querySelector("#cameraA");
        this.media_panel = document.getElementById("mediaPanel");
        this.recording_controls = document.getElementById("upload-recording-btn");
        this.dialogVideo = document.getElementById("video-panel-video");

        // State Initialization
        this.videoPrimed = false;
        this.is_fs = false;
        this.panel_z = -1;
        this.visCollection = [];
        this.panelElems = [this.videoPanel, this.fsEl, this.plEl, this.exEl, this.exFrameEl];
        this.entCollection = document.getElementsByClassName("hideable");

        // Video Properties
        this.videoSourceUrl = this.videoDisplay ? (this.videoDisplay.getAttribute("data-vrodos-video-src") || "") : "";
        this.videoLoop = this.videoDisplay ? this.videoDisplay.getAttribute("data-vrodos-video-loop") === "true" : false;
        this.videoPosterSelector = this.videoDisplay ? (this.videoDisplay.getAttribute("data-vrodos-video-poster") || "") : "";
        this.videoPosterUrl = this.resolvePosterUrl();
        this.video = this.ensureVideoElement();

        // Bind Methods
        this.onVideoClick = this.onVideoClick.bind(this);
        this.onFullScreenClick = this.onFullScreenClick.bind(this);
        this.exitPanel = this.exitPanel.bind(this);
        this.playVideo = this.playVideo.bind(this);
        this.restorePanel = this.restorePanel.bind(this);
        this.restoreVid = this.restoreVid.bind(this);
        this.removeVRTraces = this.removeVRTraces.bind(this);

        // Event Listeners
        document.querySelector('a-scene').addEventListener('exit-vr', this.removeVRTraces);

        if (this.dialogVideo) {
            this.dialogVideo.addEventListener('play', () => this.trackEvent('poivideo_video_play'));
            this.dialogVideo.addEventListener('pause', () => this.trackEvent('poivideo_video_pause'));
        }

        this.video.addEventListener("ended", () => this.syncUI());
        this.video.addEventListener("play", () => this.updateInlinePlayHint());
        this.video.addEventListener("pause", () => this.updateInlinePlayHint());

        if (this.videoSourceUrl) {
            this.videoDisplay.addEventListener('click', this.onVideoClick);
        }

        // Final Setup
        this.cam.add(this.videoPanel);
        this.checkAutoplay();
        this.updateInlinePlayHint();
    },

    trackEvent: function(eventName) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName);
        }
    },

    checkAutoplay: function() {
        if (this.video.getAttribute("autoplay-manual") === "true") {
            this.primeVideoForPlayback();
            var playPromise = this.video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => console.warn("Autoplay prevented:", error));
            }
        } else {
            this.videoDisplay.classList.add("raycastable");
        }
    },

    ensureVideoElement: function () {
        var existingVideo = document.getElementById(this.videoElementId);
        if (existingVideo) {
            this.prepareVideoElement(existingVideo);
            return existingVideo;
        }

        var videoEl = document.createElement("video");
        videoEl.id = this.videoElementId;
        videoEl.setAttribute("crossorigin", "anonymous");
        videoEl.setAttribute("playsinline", "");
        videoEl.setAttribute("webkit-playsinline", "");
        videoEl.style.display = "none";
        document.body.appendChild(videoEl);
        this.prepareVideoElement(videoEl);
        return videoEl;
    },

    resolvePosterUrl: function () {
        if (!this.videoPosterSelector || this.videoPosterSelector.charAt(0) !== "#") return "";
        var posterAsset = document.querySelector(this.videoPosterSelector);
        return posterAsset ? (posterAsset.getAttribute("src") || "") : "";
    },

    prepareVideoElement: function (videoEl) {
        if (!videoEl) return;
        videoEl.loop = this.videoLoop;
        videoEl.preload = videoEl.getAttribute("autoplay-manual") === "true" ? "auto" : "none";
    },

    configureDialogVideoElement: function (videoEl) {
        if (!videoEl) return;
        videoEl.preload = this.videoPrimed ? "auto" : "metadata";
        videoEl.loop = this.videoLoop;
        if (this.videoPosterUrl) videoEl.setAttribute("poster", this.videoPosterUrl);
        else videoEl.removeAttribute("poster");
    },

    updateInlinePlayHint: function () {
        if (!this.playHintEl) return;
        var shouldShow = !this.videoPrimed || !this.video || this.video.paused;
        this.playHintEl.setAttribute("visible", shouldShow ? "true" : "false");
    },

    tuneVideoTexture: function () {
        if (!this.videoDisplay || !this.videoDisplay.getObject3D || typeof THREE === "undefined") return;
        var mesh = this.videoDisplay.getObject3D("mesh");
        if (!mesh || !mesh.material || !mesh.material.map) return;

        var map = mesh.material.map;
        if (typeof THREE.LinearFilter !== "undefined") {
            map.minFilter = THREE.LinearFilter;
            map.magFilter = THREE.LinearFilter;
        }
        map.generateMipmaps = false;
        map.needsUpdate = true;
        mesh.material.needsUpdate = true;
    },

    bindInlineVideoTexture: function () {
        if (!this.videoDisplay || !this.video) return;
        this.videoDisplay.setAttribute("src", this.video_id);
        this.videoDisplay.setAttribute("material", "shader: flat; side: double; npot: true");
        requestAnimationFrame(() => this.tuneVideoTexture());
    },

    activateInlineVideoTexture: function () {
        if (!this.videoDisplay || !this.video) return;

        const bind = () => {
            if (this.video.readyState >= 3 && this.video.videoWidth > 0) {
                if (typeof this.video.requestVideoFrameCallback === "function") {
                    this.video.requestVideoFrameCallback(() => this.bindInlineVideoTexture());
                } else {
                    this.bindInlineVideoTexture();
                }
                return true;
            }
            return false;
        };

        if (bind()) return;

        const onLoaded = () => {
            if (bind()) {
                this.video.removeEventListener("loadeddata", onLoaded);
                this.video.removeEventListener("canplay", onLoaded);
            }
        };

        this.video.addEventListener("loadeddata", onLoaded);
        this.video.addEventListener("canplay", onLoaded);
    },

    primeVideoForPlayback: function () {
        if (!this.video || this.videoPrimed) {
            this.activateInlineVideoTexture();
            return;
        }

        this.videoPrimed = true;
        this.video.preload = "auto";
        this.configureDialogVideoElement(this.dialogVideo);

        if (!this.video.getAttribute("src") && this.videoSourceUrl) {
            this.video.setAttribute("src", this.videoSourceUrl);
        }

        this.activateInlineVideoTexture();
        if (typeof this.video.load === "function") this.video.load();
        this.updateInlinePlayHint();
    },

    prepareDialogPlayback: function () {
        var videoElement = this.dialogVideo || document.getElementById("video-panel-video");
        if (!videoElement) return null;

        this.dialogVideo = videoElement;
        this.configureDialogVideoElement(videoElement);

        var desiredUrl = this.video.currentSrc || this.video.getAttribute("src") || this.videoSourceUrl;
        var currentUrl = videoElement.currentSrc || videoElement.getAttribute("src") || "";

        if (desiredUrl && currentUrl !== desiredUrl) {
            videoElement.pause();
            videoElement.setAttribute("src", desiredUrl);
            if (typeof videoElement.load === "function") videoElement.load();
        }

        return videoElement;
    },

    syncUI: function() {
        window.VRODOS_VIDEO_MANAGER.updatePlayIcon(this.plEl, this.video.paused, this.data.id);
        this.updateInlinePlayHint();
    },

    removeVRTraces: function() {
        this.exitPanel();
        this.restoreVid();
        browsingModeVR = false;
        if (this.is_fs) {
            this.is_fs = false;
            this.videoDisplay.classList.remove("non-clickable");
            window.VRODOS_VIDEO_MANAGER.toggleVideoEnvironment(this.backgroundEl, false);
        }
    },

    playVideo: function() {
        this.primeVideoForPlayback();
        if (this.video.paused) {
            this.video.play();
            this.trackEvent('poivideo_video_play_vr');
        } else {
            this.video.pause();
            this.trackEvent('poivideo_video_pause_vr');
        }
        this.syncUI();
    },

    exitPanel: function () {
        this.exEl.removeEventListener('click', this.exitPanel);
        this.exFrameEl.removeEventListener('click', this.exitPanel);
        this.plEl.removeEventListener('click', this.playVideo);
        this.fsEl.removeEventListener('click', this.onFullScreenClick);

        this.videoPanel.setAttribute("position", this.panel_pos_dynamic);
        this.panelElems.forEach(elem => window.VRODOS_VIDEO_MANAGER.setEntityState(elem, false, true, 1));
        window.VRODOS_VIDEO_MANAGER.setEntityState(this.titEl, false, true, 1);

        if (!this.video.paused) this.video.pause();
        
        this.cursorEl.setAttribute("raycaster", "objects: .raycastable");
        if (this.rightHand) this.rightHand.setAttribute("raycaster", "objects: .raycastable");
    },
    
    restorePanel: function () {
        this.panelElems.forEach(elem => window.VRODOS_VIDEO_MANAGER.setEntityState(elem, true, true, 1));
        window.VRODOS_VIDEO_MANAGER.setEntityState(this.titEl, true, true, 1);
        
        this.videoPanel.setAttribute("position", this.panel_pos_dynamic);
        this.cursorEl.setAttribute("raycaster", "objects: .non-clickable");
        if (this.rightHand) this.rightHand.setAttribute("raycaster", "objects: .non-clickable");
        
        this.syncUI();

        this.exEl.addEventListener('click', this.exitPanel);
        this.exFrameEl.addEventListener('click', this.exitPanel);
        this.plEl.addEventListener('click', this.playVideo);
        this.fsEl.addEventListener('click', this.onFullScreenClick);
    },

    restoreVid: function() {
        let projType = this.backgroundEl.getAttribute("scene-settings").pr_type;
        if (projType !== "vrexpo_games") {
            this.cam.setAttribute("position", "0 0.6 0");
            if (this.media_panel) this.media_panel.style.visibility = 'visible';
            if (this.recording_controls) this.recording_controls.style.visibility = 'visible';
        }
        this.cam.setAttribute("camera", "fov", 60);
        
        this.visCollection.forEach(index => {
            let ent = this.entCollection[index];
            if (!ent) return;
            ent.setAttribute("visible", "true");
            let origScale = ent.getAttribute("original-scale") || "1 1 1";
            ent.setAttribute("scale", origScale);
        });

        if (this.playerEl.getAttribute("wasd-controls")) {
            this.playerEl.setAttribute("wasd-controls", "fly: false; acceleration:20");
        }
        
        this.backgroundEl.add(this.videoDisplay);
        
        let p_x = this.data.orig_pos.join(' ');
        let r_x = this.data.orig_rot.map(r => r * (180 / Math.PI)).join(' ');

        this.videoDisplay.setAttribute("height", "3");
        this.videoDisplay.setAttribute("width", "4");
        this.videoDisplay.setAttribute("position", p_x);
        this.videoDisplay.setAttribute("scale", this.videoDisplay.getAttribute("original-scale"));
        this.videoDisplay.setAttribute("rotation", r_x);
        this.visCollection = [];
    },
   
    onVideoClick: function (evt) {
        if (evt.detail && evt.detail.originalEvent && evt.detail.originalEvent.button !== undefined && evt.detail.originalEvent.button !== 0) return;

        const viewport = window.VRODOS_VIDEO_MANAGER.getViewportAtDepth(this.panel_z);
        this.panel_pos_dynamic = (viewport.width / 2 - 1) + " -0.3 " + this.panel_z;

        this.trackEvent('video_click');
        
        if (!browsingModeVR) {
            let video_element = this.prepareDialogPlayback();
            if (!video_element) return;

            let videoDialog = document.querySelector('#video-controls-dialog');
            let videoTitleEl = document.querySelector('#video-controls-dialog-title');
            let videoHeaderContent = videoTitleEl ? videoTitleEl.closest('.tw-flex.tw-items-center.tw-gap-3') : null;

            if (videoTitleEl) {
                let titleVal = (this.titEl && this.titEl.hasAttribute('text')) ? this.titEl.getAttribute('text').value : "";
                if (titleVal && titleVal.trim() !== '' && !["video-title", "Video Viewer"].includes(titleVal)) {
                    videoTitleEl.innerText = titleVal;
                    if (videoHeaderContent) videoHeaderContent.classList.remove('tw-hidden');
                } else {
                    if (videoHeaderContent) videoHeaderContent.classList.add('tw-hidden');
                }
            }

            const closeDialog = () => {
                video_element.pause();
                if (videoDialog) videoDialog.removeEventListener('close', closeDialog);
            };

            if (videoDialog) {
                videoDialog.addEventListener('close', closeDialog);
                if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.showDialog === 'function') {
                    window.VRODOSMasterUI.showDialog(videoDialog);
                } else if (typeof videoDialog.showModal === 'function') {
                    videoDialog.showModal();
                }
            }
        } else {
            this.primeVideoForPlayback();
            this.restorePanel();
            if (this.is_fs) {
                this.restoreVid();
                this.is_fs = false;
                this.videoDisplay.classList.remove("non-clickable");
                window.VRODOS_VIDEO_MANAGER.toggleVideoEnvironment(this.backgroundEl, false);
            }
        }
    },
    
    onFullScreenClick: function () {
        this.primeVideoForPlayback();
        this.trackEvent('poivideo_video_fullscreen_vr');

        this.is_fs = true;
        let projType = this.backgroundEl.getAttribute("scene-settings").pr_type;

        if (projType !== "vrexpo_games") {
            if (this.media_panel) this.media_panel.style.visibility = 'hidden';
            if (this.recording_controls) this.recording_controls.style.visibility = 'hidden';
        }

        window.VRODOS_VIDEO_MANAGER.toggleVideoEnvironment(this.backgroundEl, true);

        this.videoDisplay.classList.add("non-clickable");
        this.cam.add(this.videoDisplay);        
        
        const viewport = window.VRODOS_VIDEO_MANAGER.getViewportAtDepth(-25);
        this.videoDisplay.setAttribute("height", viewport.height);
        this.videoDisplay.setAttribute("width", viewport.width);
        this.videoDisplay.setAttribute("position", "0 0 -25");
        this.videoDisplay.setAttribute("scale", "1 1 1");
        this.videoDisplay.setAttribute("rotation", "0 0 0");
        
        this.panelElems.forEach(elem => window.VRODOS_VIDEO_MANAGER.setEntityState(elem, false, true, 1));
        window.VRODOS_VIDEO_MANAGER.setEntityState(this.titEl, false, true, 1);

        if (this.video.paused) this.video.play();
        
        this.visCollection = [];
        for (let i = 0; i < this.entCollection.length; i++) {
            if (this.entCollection[i] !== this.videoDisplay) {
                this.entCollection[i].setAttribute("visible", "false");
                this.entCollection[i].setAttribute("scale", "0.00001 0.00001 0.00001");
            }
            this.visCollection.push(i);
        }

        if (this.playerEl.getAttribute("wasd-controls")) {
            this.playerEl.setAttribute("wasd-controls", "fly: false; acceleration:0");
        }
        
        this.syncUI();
    }
});

AFRAME.registerComponent('vrodos-3d-play-icon', {
    init: function () {
        const shape = new THREE.Shape();
        shape.moveTo(0, 1);
        shape.lineTo(1.732, 0); 
        shape.lineTo(0, -1);
        shape.lineTo(0, 1);

        const extrudeSettings = {
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 5
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        
        // Material 0: Front and back faces (Vibrant red)
        const frontMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.4,
            roughness: 0.8,
            metalness: 0.0 // Removed metalness to avoid black look in shadow
        });

        // Material 1: Sides and bevel (Realistic falloff red)
        const sideMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcc0000,
            emissive: 0x880000,
            emissiveIntensity: 0.3,
            roughness: 0.8,
            metalness: 0.0
        });

        const mesh = new THREE.Mesh(geometry, [frontMaterial, sideMaterial]);

        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        // Add a dedicated small light so the 3D bevels are always visible
        const light = new THREE.PointLight(0xffffff, 1, 2);
        light.position.set(0.5, 0.5, 1); 
        this.el.setObject3D('light', light);

        // Standard play button points right. 
        mesh.rotation.z = 0;
        this.el.setObject3D('mesh', mesh);
    }
});
