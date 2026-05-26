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
        this.leftHand = document.querySelector('#oculusLeft');
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
        this.desktopFullscreenInlineActive = false;
        this.desktopFullscreenOffscreenSince = 0;
        this.desktopFullscreenOffscreenDelay = 900;
        this.videoWorldPosition = new THREE.Vector3();
        this.videoVrPanelApi = null;
        this.videoVrPanelOpen = false;
        this.videoSpatialUiLoadPending = false;
        this.videoClickLastAt = 0;

        // Video Properties
        this.videoSourceUrl = this.videoDisplay ? (this.videoDisplay.getAttribute("data-vrodos-video-src") || "") : "";
        this.videoLoop = this.videoDisplay ? this.videoDisplay.getAttribute("data-vrodos-video-loop") === "true" : false;
        this.videoPosterSelector = this.videoDisplay ? (this.videoDisplay.getAttribute("data-vrodos-video-poster") || "") : "";
        this.videoPosterUrl = this.resolvePosterUrl();
        this.video = this.ensureVideoElement();
        this.applyWorldVideoMaterial();
        if (this.videoDisplay && this.videoDisplay.classList) {
            this.videoDisplay.classList.add("raycastable");
        }

        // Bind Methods
        this.onVideoClick = this.onVideoClick.bind(this);
        this.onPlayHintClick = this.onPlayHintClick.bind(this);
        this.onFullScreenClick = this.onFullScreenClick.bind(this);
        this.exitPanel = this.exitPanel.bind(this);
        this.playVideo = this.playVideo.bind(this);
        this.restorePanel = this.restorePanel.bind(this);
        this.restoreVid = this.restoreVid.bind(this);
        this.removeVRTraces = this.removeVRTraces.bind(this);
        this.closeVrVideoPanel = this.closeVrVideoPanel.bind(this);
        this.onDesktopFullscreenKeyDown = this.onDesktopFullscreenKeyDown.bind(this);
        this.onDesktopFullscreenChange = this.onDesktopFullscreenChange.bind(this);
        this.onDesktopFullscreenVisibilityChange = this.onDesktopFullscreenVisibilityChange.bind(this);
        this.onDesktopFullscreenBlur = this.onDesktopFullscreenBlur.bind(this);

        // Event Listeners
        document.querySelector('a-scene').addEventListener('exit-vr', this.removeVRTraces);

        if (this.dialogVideo) {
            this.dialogVideo.addEventListener('play', () => this.trackEvent('poivideo_video_play'));
            this.dialogVideo.addEventListener('pause', () => this.trackEvent('poivideo_video_pause'));
        }

        this.video.addEventListener("ended", () => this.syncUI());
        this.video.addEventListener("play", () => {
            this.updateInlinePlayHint();
            this.updateDesktopFullscreenInlineGuard();
        });
        this.video.addEventListener("pause", () => {
            this.updateInlinePlayHint();
            this.stopDesktopFullscreenInlineGuard(false);
        });
        this.video.addEventListener("ended", () => this.stopDesktopFullscreenInlineGuard(false));

        if (this.videoSourceUrl) {
            this.videoDisplay.addEventListener('click', this.onVideoClick);
            if (this.playHintEl) {
                this.playHintEl.addEventListener('click', this.onPlayHintClick);
            }
        }

        // Final Setup
        if (!window.VRODOSRuntimeOverlay && this.cam && this.videoPanel && this.videoPanel.parentNode !== this.cam) {
            this.cam.appendChild(this.videoPanel);
        }
        this.checkAutoplay();
        this.updateInlinePlayHint();
    },

    trackEvent: function(eventName) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName);
        }
    },

    shouldUseVrOverlay: function () {
        if (window.VRODOSRuntimeOverlay && typeof window.VRODOSRuntimeOverlay.shouldUseVrPanel === "function") {
            return window.VRODOSRuntimeOverlay.shouldUseVrPanel();
        }

        return Boolean(browsingModeVR);
    },

    shouldUseInlinePlayback: function () {
        if (this.shouldUseVrOverlay()) {
            return true;
        }

        if (window.VRODOSRuntimeOverlay && typeof window.VRODOSRuntimeOverlay.getPresentationMode === "function") {
            return window.VRODOSRuntimeOverlay.getPresentationMode() === "desktop-fullscreen";
        }

        return Boolean(document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement);
    },

    isDesktopFullscreenPresentation: function () {
        if (this.shouldUseVrOverlay()) {
            return false;
        }

        if (window.VRODOSRuntimeOverlay && typeof window.VRODOSRuntimeOverlay.getPresentationMode === "function") {
            return window.VRODOSRuntimeOverlay.getPresentationMode() === "desktop-fullscreen";
        }

        return Boolean(document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement);
    },

    anchorVrOverlayEntity: function (entity, options) {
        if (!entity || !this.shouldUseVrOverlay()) {
            return false;
        }

        if (window.VRODOSRuntimeOverlay && typeof window.VRODOSRuntimeOverlay.anchorElementInFrontOfCamera === "function") {
            return window.VRODOSRuntimeOverlay.anchorElementInFrontOfCamera(entity, options || {});
        }

        return false;
    },

    markOverlayTargets: function (enabled) {
        const targets = [this.videoPanel, this.fsEl, this.plEl, this.exEl, this.exFrameEl, this.titEl];
        if (this.is_fs) {
            targets.push(this.videoDisplay);
        }

        targets.forEach((target) => {
            if (!target || !target.classList) return;
            target.classList.toggle("vrodos-overlay-hit-target", enabled !== false);
        });
    },

    setOverlayInteractionActive: function (active) {
        this.markOverlayTargets(active);

        if (window.VRODOSRuntimeOverlay) {
            if (typeof window.VRODOSRuntimeOverlay.lockSceneInteraction === "function") {
                window.VRODOSRuntimeOverlay.lockSceneInteraction(active, { preserveLookInVr: true });
            }
        }
    },

    releaseSceneInteraction: function () {
        if (!window.VRODOSRuntimeOverlay) {
            return;
        }
        if (typeof window.VRODOSRuntimeOverlay.lockSceneInteraction === "function") {
            window.VRODOSRuntimeOverlay.lockSceneInteraction(false);
        }
    },

    startDesktopFullscreenInlineGuard: function () {
        if (this.desktopFullscreenInlineActive || !this.isDesktopFullscreenPresentation()) {
            return;
        }

        this.desktopFullscreenInlineActive = true;
        this.desktopFullscreenOffscreenSince = 0;
        this.releaseSceneInteraction();
        document.addEventListener("keydown", this.onDesktopFullscreenKeyDown, true);
        document.addEventListener("fullscreenchange", this.onDesktopFullscreenChange);
        document.addEventListener("webkitfullscreenchange", this.onDesktopFullscreenChange);
        document.addEventListener("mozfullscreenchange", this.onDesktopFullscreenChange);
        document.addEventListener("msfullscreenchange", this.onDesktopFullscreenChange);
        document.addEventListener("visibilitychange", this.onDesktopFullscreenVisibilityChange);
        window.addEventListener("blur", this.onDesktopFullscreenBlur);
    },

    stopDesktopFullscreenInlineGuard: function (pauseVideo) {
        if (!this.desktopFullscreenInlineActive) {
            return;
        }

        this.desktopFullscreenInlineActive = false;
        this.desktopFullscreenOffscreenSince = 0;
        document.removeEventListener("keydown", this.onDesktopFullscreenKeyDown, true);
        document.removeEventListener("fullscreenchange", this.onDesktopFullscreenChange);
        document.removeEventListener("webkitfullscreenchange", this.onDesktopFullscreenChange);
        document.removeEventListener("mozfullscreenchange", this.onDesktopFullscreenChange);
        document.removeEventListener("msfullscreenchange", this.onDesktopFullscreenChange);
        document.removeEventListener("visibilitychange", this.onDesktopFullscreenVisibilityChange);
        window.removeEventListener("blur", this.onDesktopFullscreenBlur);
        this.releaseSceneInteraction();

        if (pauseVideo && this.video && !this.video.paused) {
            this.video.pause();
        }
    },

    updateDesktopFullscreenInlineGuard: function () {
        if (this.video && !this.video.paused && this.isDesktopFullscreenPresentation()) {
            this.startDesktopFullscreenInlineGuard();
        } else {
            this.stopDesktopFullscreenInlineGuard(false);
        }
    },

    onDesktopFullscreenKeyDown: function (event) {
        if (!event || event.code !== "Escape") {
            return;
        }
        this.stopDesktopFullscreenInlineGuard(true);
    },

    onDesktopFullscreenChange: function () {
        if (!this.isDesktopFullscreenPresentation()) {
            this.stopDesktopFullscreenInlineGuard(true);
        } else {
            this.updateDesktopFullscreenInlineGuard();
        }
    },

    onDesktopFullscreenVisibilityChange: function () {
        if (document.hidden) {
            this.stopDesktopFullscreenInlineGuard(true);
        }
    },

    onDesktopFullscreenBlur: function () {
        this.stopDesktopFullscreenInlineGuard(true);
    },

    isVideoDisplayInCameraView: function () {
        const scene = this.backgroundEl || document.querySelector("a-scene");
        const camera = scene && scene.camera;
        if (!this.videoDisplay || !this.videoDisplay.object3D || !camera) {
            return true;
        }

        if (scene.object3D && typeof scene.object3D.updateMatrixWorld === "function") {
            scene.object3D.updateMatrixWorld(true);
        }
        if (typeof camera.updateMatrixWorld === "function") {
            camera.updateMatrixWorld(true);
        }

        this.videoDisplay.object3D.getWorldPosition(this.videoWorldPosition);
        this.videoWorldPosition.project(camera);

        return this.videoWorldPosition.z >= -1 &&
            this.videoWorldPosition.z <= 1 &&
            Math.abs(this.videoWorldPosition.x) <= 1.2 &&
            Math.abs(this.videoWorldPosition.y) <= 1.2;
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

    getWorldVideoMaterial: function (src) {
        var material = "side: double; transparent: true; alphaTest: 0.5; roughness: 0.85; metalness: 0; depthTest: true; depthWrite: true";
        if (src) material += "; src: " + src;
        return material;
    },

    getOverlayVideoMaterial: function (src) {
        var material = "shader: flat; side: double; transparent: true; opacity: 1; depthTest: false; depthWrite: false";
        if (src) material += "; src: " + src;
        return material;
    },

    getInlineVideoMaterialSource: function () {
        if (this.videoPrimed && this.video) return this.video_id;
        return this.videoPosterSelector || "";
    },

    setVideoDisplayShadowState: function (enabled) {
        if (!this.videoDisplay || !this.videoDisplay.getObject3D) return;
        var mesh = this.videoDisplay.getObject3D("mesh");
        if (!mesh) return;
        mesh.traverse(function (node) {
            if (!node || !node.isMesh) return;
            node.castShadow = enabled;
            node.receiveShadow = enabled;
        });
    },

    requestSceneLightingRefresh: function () {
        if (!this.backgroundEl || !this.backgroundEl.components) return;
        var settings = this.backgroundEl.components["scene-settings"];
        if (!settings) return;
        if (typeof settings.markSceneCollectionsDirty === "function") settings.markSceneCollectionsDirty();
        if (typeof settings.queueQualityRefresh === "function") settings.queueQualityRefresh(false);
    },

    applyWorldVideoMaterial: function () {
        if (!this.videoDisplay) return;
        var source = this.getInlineVideoMaterialSource();
        if (source) this.videoDisplay.setAttribute("src", source);
        this.videoDisplay.setAttribute("material", this.getWorldVideoMaterial(source));
        this.videoDisplay.setAttribute("data-vrodos-world-lighting", "true");
        this.videoDisplay.removeAttribute("data-vrodos-overlay-ui");
        if (this.videoDisplay.classList) {
            this.videoDisplay.classList.add("raycastable");
        }
        this.setVideoDisplayShadowState(true);
        requestAnimationFrame(() => this.tuneVideoTexture());
        this.requestSceneLightingRefresh();
    },

    applyOverlayVideoMaterial: function () {
        if (!this.videoDisplay) return;
        var source = this.videoPrimed ? this.video_id : this.getInlineVideoMaterialSource();
        if (source) this.videoDisplay.setAttribute("src", source);
        this.videoDisplay.setAttribute("material", this.getOverlayVideoMaterial(source));
        this.videoDisplay.setAttribute("data-vrodos-overlay-ui", "true");
        this.setVideoDisplayShadowState(false);
        requestAnimationFrame(() => this.tuneVideoTexture());
        this.requestSceneLightingRefresh();
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
        videoEl.setAttribute("playsinline", "");
        videoEl.setAttribute("webkit-playsinline", "");
        if (this.videoPosterUrl) videoEl.setAttribute("poster", this.videoPosterUrl);
        else videoEl.removeAttribute("poster");
    },

    updateInlinePlayHint: function () {
        if (!this.playHintEl) return;
        var shouldShow = !this.videoVrPanelOpen && (!this.videoPrimed || !this.video || this.video.paused);
        this.playHintEl.setAttribute("visible", shouldShow ? "true" : "false");
        this.playHintEl.classList.toggle("raycastable", shouldShow);
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
        if (this.is_fs) this.applyOverlayVideoMaterial();
        else this.applyWorldVideoMaterial();
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

    stopVideoElement: function (videoElement) {
        if (!videoElement) return;

        videoElement.pause();
        try {
            videoElement.currentTime = 0;
        } catch (_error) {
            // Some browsers reject currentTime changes before metadata is ready.
        }
    },

    stopDialogPlayback: function (videoElement) {
        this.stopVideoElement(videoElement || this.dialogVideo);
        this.stopVideoElement(this.video);
        this.syncUI();
    },

    playDialogPlayback: function (videoElement) {
        if (!videoElement) return;

        if (this.video && !this.video.paused) {
            this.video.pause();
        }

        var playPromise = videoElement.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(error => console.warn("Dialog video playback prevented:", error));
        }
    },

    syncUI: function() {
        window.VRODOS_VIDEO_MANAGER.updatePlayIcon(this.plEl, this.video.paused, this.data.id);
        this.updateInlinePlayHint();
    },

    removeVRTraces: function() {
        if (this.videoVrPanelOpen) {
            this.closeVrVideoPanel("exit-vr");
        }
        this.exitPanel();
        this.restoreVid();
        if (window.VRODOSMaster && typeof window.VRODOSMaster.setBrowsingModeVR === "function") {
            window.VRODOSMaster.setBrowsingModeVR(false);
        } else {
            browsingModeVR = false;
            window.browsingModeVR = false;
        }
        if (this.is_fs) {
            this.is_fs = false;
            this.videoDisplay.classList.remove("vrodos-overlay-hit-target");
            window.VRODOS_VIDEO_MANAGER.toggleVideoEnvironment(this.backgroundEl, false);
        }
    },

    playVideo: function() {
        this.primeVideoForPlayback();
        if (this.video.paused) {
            const playPromise = this.video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(error => console.warn("VR video playback prevented:", error));
            }
            this.trackEvent('poivideo_video_play_vr');
        } else {
            this.video.pause();
            this.trackEvent('poivideo_video_pause_vr');
        }
        this.syncUI();
        this.updateDesktopFullscreenInlineGuard();
    },

    getVideoTitle: function () {
        var titleVal = "";
        if (this.titEl && this.titEl.hasAttribute && this.titEl.hasAttribute("text")) {
            var textAttr = this.titEl.getAttribute("text");
            titleVal = textAttr && textAttr.value ? String(textAttr.value) : "";
        }
        titleVal = titleVal.trim();
        if (!titleVal || titleVal === "video-title" || titleVal === "Video Viewer") {
            return "Video";
        }
        return titleVal;
    },

    closeVrVideoPanel: function (reason) {
        this.videoVrPanelOpen = false;
        this.videoVrPanelApi = null;
        this.updateInlinePlayHint();

        if (window.VRODOSSpatialUI && typeof window.VRODOSSpatialUI.closePanel === "function") {
            window.VRODOSSpatialUI.closePanel(reason || "video-close");
        }
    },

    renderVrVideoPanel: function (api) {
        if (!api || typeof api.frame !== "function") {
            return;
        }

        var isPaused = !this.video || this.video.paused;
        var statusLabel = isPaused ? "Paused" : "Playing";
        var frame = api.frame({
            title: this.getVideoTitle(),
            headerColor: "#272727",
            paddingX: 76,
            paddingY: 58,
            footerHeight: 130,
            status: statusLabel,
            onClose: () => this.closeVrVideoPanel("video-close"),
            primary: {
                label: isPaused ? "Play" : "Pause",
                variant: isPaused ? "primary" : "secondary",
                width: 220,
                height: 64,
                textSize: 28,
                onClick: () => {
                    this.playVideo();
                    this.renderVrVideoPanel(api);
                    if (typeof api.refreshTargets === "function") {
                        api.refreshTargets();
                    }
                }
            }
        });

        api.text(frame.content, {
            text: "VR video controls",
            color: "#272727",
            fontSize: 32,
            fontWeight: 600,
            lineHeight: "120%"
        });
        api.text(frame.content, {
            text: statusLabel,
            color: isPaused ? "#5a5a5a" : "#047857",
            align: "center",
            fontSize: 46,
            fontWeight: 600,
            lineHeight: "120%",
            width: "100%"
        });
        if (typeof api.refreshTargets === "function") {
            api.refreshTargets();
        }
    },

    openVrVideoPanel: function () {
        if (!this.shouldUseVrOverlay()) {
            return false;
        }

        this.primeVideoForPlayback();

        var spatialUi = window.VRODOSSpatialUI &&
            typeof window.VRODOSSpatialUI.isAvailable === "function" &&
            window.VRODOSSpatialUI.isAvailable()
            ? window.VRODOSSpatialUI
            : null;
        if (!spatialUi || typeof spatialUi.openPanel !== "function") {
            if (window.VRODOSRuntimeOverlay &&
                    typeof window.VRODOSRuntimeOverlay.ensureSpatialUiRuntime === "function" &&
                    !this.videoSpatialUiLoadPending) {
                this.videoSpatialUiLoadPending = true;
                window.VRODOSRuntimeOverlay.ensureSpatialUiRuntime({ timeoutMs: 8000 }).then((available) => {
                    this.videoSpatialUiLoadPending = false;
                    if (available) {
                        this.openVrVideoPanel();
                    } else {
                        console.warn("[VRodos Video] VR video controls requested but pmndrs spatial UI could not be loaded.");
                    }
                });
            } else {
                console.warn("[VRodos Video] VR video controls requested but pmndrs spatial UI is unavailable.");
            }
            return true;
        }

        var panelOptions = {
            id: "vrodos-video-vr-controls-" + this.data.id,
            width: 2.25,
            height: 1.22,
            distance: 2.3,
            verticalOffset: -0.03,
            topAtEyeLevel: true,
            anchorElement: this.videoDisplay || null,
            anchorSide: "right",
            anchorRefreshFrames: this.videoDisplay ? 1 : 8,
            lockInteraction: false,
            cleanup: () => {
                this.videoVrPanelOpen = false;
                this.videoVrPanelApi = null;
                this.updateInlinePlayHint();
            },
            render: (api) => {
                this.videoVrPanelOpen = true;
                this.videoVrPanelApi = api;
                this.renderVrVideoPanel(api);
                this.updateInlinePlayHint();
            }
        };

        this.videoVrPanelApi = spatialUi.openPanel(panelOptions);
        this.videoVrPanelOpen = Boolean(this.videoVrPanelApi);
        this.updateInlinePlayHint();
        return this.videoVrPanelOpen;
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

        this.setOverlayInteractionActive(false);
    },
    
    restorePanel: function () {
        this.panelElems.forEach(elem => window.VRODOS_VIDEO_MANAGER.setEntityState(elem, true, true, 1));
        window.VRODOS_VIDEO_MANAGER.setEntityState(this.titEl, true, true, 1);
        
        if (!this.anchorVrOverlayEntity(this.videoPanel, { distance: 2.25, verticalOffset: -0.22 })) {
            this.videoPanel.setAttribute("position", this.panel_pos_dynamic);
        }
        this.setOverlayInteractionActive(true);
        
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
        
        if (this.videoDisplay && this.backgroundEl && this.videoDisplay.parentNode !== this.backgroundEl) {
            this.backgroundEl.appendChild(this.videoDisplay);
        }
        
        let p_x = this.data.orig_pos.join(' ');
        let r_x = this.data.orig_rot.map(r => r * (180 / Math.PI)).join(' ');

        this.videoDisplay.setAttribute("height", "3");
        this.videoDisplay.setAttribute("width", "4");
        this.videoDisplay.setAttribute("position", p_x);
        this.videoDisplay.setAttribute("scale", this.videoDisplay.getAttribute("original-scale"));
        this.videoDisplay.setAttribute("rotation", r_x);
        this.applyWorldVideoMaterial();
        this.videoDisplay.classList.remove("vrodos-overlay-hit-target");
        this.visCollection = [];
    },
   
    onVideoClick: function (evt) {
        if (evt.detail && evt.detail.originalEvent && evt.detail.originalEvent.button !== undefined && evt.detail.originalEvent.button !== 0) return;
        const now = typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
        if (now - (this.videoClickLastAt || 0) < 320) {
            if (evt && typeof evt.stopPropagation === "function") {
                evt.stopPropagation();
            }
            return;
        }
        this.videoClickLastAt = now;

        const viewport = window.VRODOS_VIDEO_MANAGER.getViewportAtDepth(this.panel_z);
        this.panel_pos_dynamic = (viewport.width / 2 - 1) + " -0.3 " + this.panel_z;

        this.trackEvent('video_click');

        if (this.shouldUseVrOverlay()) {
            if (this.videoVrPanelOpen) {
                this.closeVrVideoPanel("video-direct-toggle");
            }
            this.playVideo();
            return;
        }
        
        if (this.shouldUseInlinePlayback()) {
            this.primeVideoForPlayback();
            if (this.is_fs) {
                this.restoreVid();
                this.is_fs = false;
                this.videoDisplay.classList.remove("vrodos-overlay-hit-target");
                window.VRODOS_VIDEO_MANAGER.toggleVideoEnvironment(this.backgroundEl, false);
            }
            this.playVideo();
            return;
        }

        if (!this.shouldUseVrOverlay()) {
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
                this.stopDialogPlayback(video_element);
                if (videoDialog) videoDialog.removeEventListener('close', closeDialog);
            };

            if (videoDialog) {
                videoDialog.addEventListener('close', closeDialog);
                if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.showDialog === 'function') {
                    window.VRODOSMasterUI.showDialog(videoDialog);
                } else if (typeof videoDialog.showModal === 'function') {
                    videoDialog.showModal();
                }
                this.playDialogPlayback(video_element);
            }
        }
    },

    onPlayHintClick: function (evt) {
        if (evt && typeof evt.stopPropagation === "function") {
            evt.stopPropagation();
        }
        this.onVideoClick(evt || {});
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

        this.videoDisplay.classList.add("vrodos-overlay-hit-target");
        this.applyOverlayVideoMaterial();

        const fullscreenDistance = this.shouldUseVrOverlay() ? 2.65 : 25;
        const viewport = window.VRODOS_VIDEO_MANAGER.getViewportAtDepth(-fullscreenDistance);
        this.videoDisplay.setAttribute("height", viewport.height * 0.92);
        this.videoDisplay.setAttribute("width", viewport.width * 0.92);
        this.videoDisplay.setAttribute("scale", "1 1 1");
        if (!this.anchorVrOverlayEntity(this.videoDisplay, { distance: fullscreenDistance, verticalOffset: 0 })) {
            if (this.cam && this.videoDisplay.parentNode !== this.cam) {
                this.cam.appendChild(this.videoDisplay);
            }
            this.videoDisplay.setAttribute("position", "0 0 -" + fullscreenDistance);
            this.videoDisplay.setAttribute("rotation", "0 0 0");
        }
        
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
        
        this.setOverlayInteractionActive(true);
        this.syncUI();
    },

    tick: function (time) {
        if (!this.desktopFullscreenInlineActive || !this.video || this.video.paused) {
            return;
        }

        if (!this.isDesktopFullscreenPresentation()) {
            this.stopDesktopFullscreenInlineGuard(true);
            return;
        }

        if (this.isVideoDisplayInCameraView()) {
            this.desktopFullscreenOffscreenSince = 0;
            return;
        }

        if (!this.desktopFullscreenOffscreenSince) {
            this.desktopFullscreenOffscreenSince = time || performance.now();
            return;
        }

        if ((time || performance.now()) - this.desktopFullscreenOffscreenSince > this.desktopFullscreenOffscreenDelay) {
            this.stopDesktopFullscreenInlineGuard(true);
        }
    },

    remove: function () {
        this.stopDesktopFullscreenInlineGuard(true);
        if (this.videoVrPanelOpen) {
            this.closeVrVideoPanel("remove");
        }

        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.removeEventListener('exit-vr', this.removeVRTraces);
        }
        if (this.videoDisplay) {
            this.videoDisplay.removeEventListener('click', this.onVideoClick);
        }
        if (this.playHintEl) {
            this.playHintEl.removeEventListener('click', this.onPlayHintClick);
        }
    }
});

AFRAME.registerComponent('vrodos-3d-play-icon', {
    init: function () {
        const isOverlayUi = this.el.hasAttribute('data-vrodos-overlay-ui') ||
            (typeof this.el.closest === 'function' && this.el.closest('[data-vrodos-overlay-ui]'));
        const depthTest = !isOverlayUi;
        const renderOrder = isOverlayUi ? 90080 : 9000;

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
        
        // Keep the play glyph as UI, not a scene-lit physical object.
        const frontMaterial = new THREE.MeshBasicMaterial({
            color: 0xff2f2f,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1,
            depthTest,
            depthWrite: false,
            toneMapped: false
        });

        const sideMaterial = new THREE.MeshBasicMaterial({
            color: 0xb91c1c,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1,
            depthTest,
            depthWrite: false,
            toneMapped: false
        });

        const mesh = new THREE.Mesh(geometry, [frontMaterial, sideMaterial]);

        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        // Standard play button points right. 
        mesh.rotation.z = 0;
        mesh.renderOrder = renderOrder;
        mesh.frustumCulled = false;
        this.el.object3D.renderOrder = renderOrder;
        this.el.object3D.frustumCulled = false;
        this.el.setObject3D('mesh', mesh);
    }
});
