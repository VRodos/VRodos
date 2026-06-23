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

        // Element Selection
        this.videoDisplay = document.querySelector(this.video_display_id);
        this.playHintEl = document.querySelector("#video-playhint_" + this.data.id);
        this.backgroundEl = document.querySelector('#aframe-scene-container');
        this.dialogVideo = document.getElementById("video-panel-video");

        // State Initialization
        this.videoPrimed = false;
        this.desktopFullscreenInlineActive = false;
        this.desktopFullscreenOffscreenSince = 0;
        this.desktopFullscreenOffscreenDelay = 900;
        this.videoWorldPosition = new THREE.Vector3();
        this.videoClickLastAt = 0;

        // Video Properties
        this.videoSourceUrl = this.videoDisplay ? (this.videoDisplay.getAttribute("data-vrodos-video-src") || "") : "";
        this.videoLoop = this.videoDisplay ? this.videoDisplay.getAttribute("data-vrodos-video-loop") === "true" : false;
        this.videoPosterSelector = this.videoDisplay ? (this.videoDisplay.getAttribute("data-vrodos-video-poster") || "") : "";
        this.videoTitle = this.videoDisplay ? (this.videoDisplay.getAttribute("data-vrodos-video-title") || "") : "";
        this.videoPosterUrl = this.resolvePosterUrl();
        this.useFlatMediaMaterial = this.shouldUseFlatVideoMaterial();
        this.video = this.ensureVideoElement();
        this.applyWorldVideoMaterial();
        if (this.videoDisplay && this.videoDisplay.classList) {
            this.videoDisplay.classList.add("raycastable");
        }

        // Bind Methods
        this.onVideoClick = this.onVideoClick.bind(this);
        this.onPlayHintClick = this.onPlayHintClick.bind(this);
        this.playVideo = this.playVideo.bind(this);
        this.removeVRTraces = this.removeVRTraces.bind(this);
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

        this.checkAutoplay();
        this.updateInlinePlayHint();
    },

    trackEvent: function(eventName) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName);
        }
    },

    isImmersivePresentation: function () {
        if (window.VRODOSRuntimeOverlay && typeof window.VRODOSRuntimeOverlay.shouldUseVrPanel === "function") {
            return window.VRODOSRuntimeOverlay.shouldUseVrPanel();
        }

        return false;
    },

    shouldUseInlinePlayback: function () {
        if (this.isImmersivePresentation()) {
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
        if (this.isImmersivePresentation()) {
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

    shouldUseFlatVideoMaterial: function () {
        if (!this.videoDisplay) return false;

        var material = this.videoDisplay.getAttribute("material");
        if (typeof material === "string" && /(?:^|;)\s*shader\s*:\s*flat(?:\s*;|$)/i.test(material)) {
            return true;
        }
        if (material && typeof material === "object" && material.shader === "flat") {
            return true;
        }

        var sceneEl = document.querySelector("a-scene");
        var settings = sceneEl && sceneEl.components ? sceneEl.components["scene-settings"] : null;
        var settingsData = settings && settings.data
            ? settings.data
            : (sceneEl && sceneEl.getAttribute ? sceneEl.getAttribute("scene-settings") : null);
        var profile = settingsData ? String(settingsData.vrRuntimeProfile || "desktop") : "desktop";
        return profile !== "desktop" && profile !== "max";
    },

    getWorldVideoMaterial: function (src) {
        var material = this.useFlatMediaMaterial
            ? "shader: flat; side: double; transparent: true; alphaTest: 0.5; depthTest: true; depthWrite: true"
            : "side: double; transparent: true; alphaTest: 0.5; roughness: 0.85; metalness: 0; depthTest: true; depthWrite: true";
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
        this.setVideoDisplayShadowState(!this.useFlatMediaMaterial);
        requestAnimationFrame(() => this.tuneVideoTexture());
        if (!this.useFlatMediaMaterial) {
            this.requestSceneLightingRefresh();
        }
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
        var shouldShow = !this.videoPrimed || !this.video || this.video.paused;
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
        this.applyWorldVideoMaterial();
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
        this.updateInlinePlayHint();
    },

    removeVRTraces: function() {
        this.stopDesktopFullscreenInlineGuard(false);
        this.applyWorldVideoMaterial();
        this.syncUI();
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

        this.trackEvent('video_click');

        if (this.shouldUseInlinePlayback()) {
            this.primeVideoForPlayback();
            this.playVideo();
            return;
        }

        let video_element = this.prepareDialogPlayback();
        if (!video_element) return;

        let videoDialog = document.querySelector('#video-controls-dialog');
        let videoTitleEl = document.querySelector('#video-controls-dialog-title');
        let videoHeaderContent = videoTitleEl ? videoTitleEl.closest('.tw-flex.tw-items-center.tw-gap-3') : null;

        if (videoTitleEl) {
            let titleVal = this.videoTitle || "";
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
    },

    onPlayHintClick: function (evt) {
        if (evt && typeof evt.stopPropagation === "function") {
            evt.stopPropagation();
        }
        this.onVideoClick(evt || {});
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
