/* GLB-only 3D viewer used by the asset editor. */
function vrodosAssetViewerJoinUrl(base, path) {
    return `${String(base || '').replace(/\/+$/, '')  }/${  String(path || '').replace(/^\/+/, '')}`;
}

function vrodosAssetViewerResolveBaseUrl(localizedKey, pluginPath, fallbackRelative) {
    const paths = (typeof vrodos_data !== 'undefined' && vrodos_data.paths) ? vrodos_data.paths : {};

    if (paths[localizedKey]) {
        return paths[localizedKey];
    }

    const pluginBaseUrl = paths.pluginBaseUrl || (typeof pluginPath === 'string' ? pluginPath : '');
    if (pluginBaseUrl) {
        return vrodosAssetViewerJoinUrl(pluginBaseUrl, fallbackRelative);
    }

    return String(fallbackRelative || '').replace(/^\/+/, '');
}

class VRodos_AssetViewer_3D_kernel {

    setZeroVars() {
        this.GlbBuffer = '';
    }

    constructor(
        canvasToBindTo,
        canvasLabelsToBindTo,
        animationButton,
        previewProgressLabel,
        previewProgressLine,
        back_3d_color,
        audioElement = null,
        glbFilename = null,
        statsSwitch = true,
        isBackGroundNull = false,
        lockTranslation = false,
        enableZoom = true,
        assettrs = '0,0,0,0,0,0,0,0,-100',
        boundingSphereButton = null
    ) {
        this.statsSwitch = statsSwitch;
        this.canvasToBindTo = canvasToBindTo;
        this.canvasLabelsToBindTo = canvasLabelsToBindTo;
        this.animationButton = animationButton;
        this.animationButtonWrapper = animationButton ? animationButton.parentElement : null;
        this.previewProgressLabel = previewProgressLabel;
        this.previewProgressLine = previewProgressLine;
        this.back_3d_color = back_3d_color;
        this.audioElement = audioElement;
        this.boundingSphereButton = boundingSphereButton;
        this.isBackGroundNull = isBackGroundNull;
        this.assettrsDOM = document.getElementById('assettrs');
        this.assettrs = (assettrs || '0,0,0,0,0,0,0,0,-100').split(',');
        this.mixers = [];
        this.action = null;
        this.clock = new THREE.Clock();
        this.idRequestFrame = null;

        this.setZeroVars();

        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvasToBindTo,
            antialias: true,
            logarithmicDepthBuffer: true,
            alpha: true
        });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        if (this.statsSwitch && typeof Stats !== 'undefined') {
            try {
                this.stats = new Stats({ minimal: true });

                // Initialize with renderer for GPU tracking if stats-gl
                if (typeof this.stats.init === 'function') {
                    this.stats.init(this.renderer);
                }

                const wrapper = document.getElementById('wrapper_3d_inner');
                if (wrapper) {
                    wrapper.appendChild(this.stats.dom);
                    this.stats.dom.style.position = 'absolute';
                    this.stats.dom.style.top = '12px';
                    this.stats.dom.style.left = '12px';
                    this.stats.dom.style.right = 'auto';
                    this.stats.dom.style.zIndex = '9999';
                }
            } catch (e) {
                console.warn("VRodos: AssetViewer stats failed to initialize.", e);
                this.stats = null;
            }
        }

        this.aspectRatio = 1;
        this.recalcAspectRatio();

        const cameraPosX = parseFloat(this.assettrs[6] || 0);
        const cameraPosY = parseFloat(this.assettrs[7] || 0);
        const cameraPosZ = parseFloat(this.assettrs[8] || -100);

        this.cameraDefaults = {
            posCamera: new THREE.Vector3(cameraPosX, cameraPosY, cameraPosZ),
            posCameraTarget: new THREE.Vector3(0, 0, 0),
            near: 0.01,
            far: 10000,
            fov: 45
        };

        this.camera = new THREE.PerspectiveCamera(
            this.cameraDefaults.fov,
            this.aspectRatio,
            this.cameraDefaults.near,
            this.cameraDefaults.far
        );
        this.cameraTarget = this.cameraDefaults.posCameraTarget.clone();
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.zoomSpeed = 1.02;
        this.controls.enablePan = !lockTranslation;
        this.controls.enableZoom = enableZoom;

        const root = new THREE.Group();
        root.name = 'root';
        this.scene.add(root);

        this.boundRender = this.render.bind(this);
        this.initGL();
        this.attachAnimationClickHandler();
        this.loader_asset_exists(glbFilename);

        this.canvasResizeBounded = this.onCanvasResize.bind(this);
        window.addEventListener('resize', this.canvasResizeBounded, true);
    }

    attachAnimationClickHandler() {
        this.renderer.domElement.addEventListener('click', (event) => {
            const root = this.scene.getObjectByName('root');
            if (!root) {
                return;
            }

            const mouse = new THREE.Vector2();
            const raycaster = new THREE.Raycaster();
            const rect = this.canvasToBindTo.getBoundingClientRect();

            mouse.x = ((event.clientX - rect.left) / this.canvasToBindTo.clientWidth) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / this.canvasToBindTo.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);

            const intersects = raycaster.intersectObjects(root.children, true);
            if (intersects.length > 0 && this.mixers.length > 0) {
                this.playStopAnimation();
            }
        }, true);
    }

    onCanvasResize() {
        this.resizeDisplayGL();
    }

    addControlEventListeners() {
        this.controls.addEventListener('change', this.boundRender);
    }

    removeControlEventListeners() {
        this.controls.removeEventListener('change', this.boundRender);
    }

    hasPlayableAnimations(animations) {
        if (!animations || animations.length === 0) {
            return false;
        }

        return animations.some((clip) => clip.duration > 0 && clip.tracks && clip.tracks.length > 0);
    }

    playStopAnimation() {
        if (!this.action) {
            return;
        }

        if (!this.action.isRunning()) {
            this.removeControlEventListeners();
            this.startAutoLoopRendering();

            if (this.audioElement) {
                this.audioElement.play();
            }

            this.action.paused = false;
            this.action.play();
            return;
        }

        this.stopAutoLoopRendering();
        this.addControlEventListeners();

        if (this.audioElement) {
            this.audioElement.pause();
        }

        this.action.paused = true;
    }

    render() {
        if (!this.renderer.autoClear) {
            this.renderer.clear();
        }

        if (this.statsSwitch && this.stats) {
            this.stats.update();
        }

        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);

        if (this.mixers.length > 0) {
            this.mixers[0].update(this.clock.getDelta());
        }

        if (this.assettrsDOM) {
            this.assettrsDOM.value = `${Math.round(this.camera.position.x * 1000) / 1000},` +
                `${Math.round(this.camera.position.y * 1000) / 1000},` +
                `${Math.round(this.camera.position.z * 1000) / 1000},` +
                `${Math.round(this.camera.rotation.x * 1000) / 1000},` +
                `${Math.round(this.camera.rotation.y * 1000) / 1000},` +
                `${Math.round(this.camera.rotation.z * 1000) / 1000},` +
                `${Math.round(this.camera.position.x * 1000) / 1000},` +
                `${Math.round(this.camera.position.y * 1000) / 1000},` +
                `${Math.round(this.camera.position.z * 1000) / 1000}`;
        }
    }

    kickRendererOnDemand() {
        this.render();
        this.addControlEventListeners();
        this.resizeDisplayGL();
        this.render();
        this.setPreviewLoading(false);
    }

    startAutoLoopRendering() {
        const looprender = () => {
            this.idRequestFrame = requestAnimationFrame(looprender);
            this.boundRender();
        };

        looprender();
    }

    stopAutoLoopRendering() {
        cancelAnimationFrame(this.idRequestFrame);
        this.idRequestFrame = null;
    }

    checkerCompleteReading() {
        if (this.GlbBuffer) {
            this.loadGlbStream(this.GlbBuffer);
        }
    }

    initGL() {
        this.scene.background = this.isBackGroundNull ? null : new THREE.Color(this.back_3d_color);

        this.labelRenderer = new THREE.CSS2DRenderer();
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0';
        this.labelRenderer.domElement.style.fontSize = '25pt';
        this.labelRenderer.domElement.style.textShadow = '-1px -1px #000, 1px -1px #000, -1px 1px  #000, 1px 1px #000';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        this.canvasLabelsToBindTo.appendChild(this.labelRenderer.domElement);

        if (this.audioElement != null) {
            this.listener = new THREE.AudioListener();
            this.camera.add(this.listener);
            this.positionalAudio = new THREE.PositionalAudio(this.listener);
            this.positionalAudio.name = 'audio1';
            this.positionalAudio.setMediaElementSource(this.audioElement);
            this.positionalAudio.setRefDistance(200);
            this.positionalAudio.setDirectionalCone(330, 230, 0.01);
            this.scene.getObjectByName('root').add(this.positionalAudio);
        }

        this.resetCamera();

        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        const directionalLight1 = new THREE.DirectionalLight(0xa0a050);
        const directionalLight2 = new THREE.DirectionalLight(0x909050);
        const directionalLight3 = new THREE.DirectionalLight(0xa0a050);

        directionalLight1.position.set(-1000, -550, 1000);
        directionalLight2.position.set(1000, 550, -1000);
        directionalLight3.position.set(0, 550, 0);

        this.scene.add(directionalLight1);
        this.scene.add(directionalLight2);
        this.scene.add(directionalLight3);
        this.scene.add(ambientLight);
    }

    clearAllAssets(whocalls) {
        this.setZeroVars();
        this.stopAutoLoopRendering();
        this.mixers = [];
        this.action = null;

        if (this.animationButtonWrapper) {
            this.animationButtonWrapper.style.display = 'none';
        }

        if (this.boundingSphereButton) {
            this.boundingSphereButton.style.display = 'none';
        }

        const placeholder = document.getElementById('preview3dPlaceholder');
        if (placeholder) {
            placeholder.style.display = '';
        }

        const existingSphere = this.scene.getObjectByName('myBoundingSphere');
        if (existingSphere && existingSphere.parent) {
            existingSphere.parent.remove(existingSphere);
        }

        const rootObj = this.scene.getObjectByName('root');
        if (!rootObj) {
            return;
        }

        rootObj.traverse((node) => {
            if (node.geometry) {
                node.geometry.dispose();
            }

            if (!node.material) {
                return;
            }

            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach((material) => {
                for (const key in material) {
                    if (material[key] && typeof material[key].dispose === 'function') {
                        material[key].dispose();
                    }
                }
                material.dispose();
            });
        });

        if (rootObj.clear) {
            rootObj.clear();
        }
    }

    getDracoDecoderPath() {
        const vendorDir = window.vrodos_three_vendor_dir || 'three-r181';
        const vendorBaseUrl = vrodosAssetViewerResolveBaseUrl(
            'vendorBaseUrl',
            typeof vrodos_data !== 'undefined' ? vrodos_data.pluginPath : '',
            'assets/vendor/'
        );

        if (window.vrodos_three_decoder_path) {
            return window.vrodos_three_decoder_path;
        }

        if (window.vrodos_three_vendor_base) {
            return `${window.vrodos_three_vendor_base  }draco/`;
        }

        return vrodosAssetViewerJoinUrl(vendorBaseUrl, `${vendorDir  }/draco/`);
    }

    createGlbLoader() {
        const loader = new THREE.GLTFLoader();
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath(this.getDracoDecoderPath());
        loader.setDRACOLoader(dracoLoader);
        return loader;
    }

    setPreviewLoading(isVisible) {
        if (this.previewProgressLabel) {
            this.previewProgressLabel.style.visibility = isVisible ? 'visible' : 'hidden';
        }

        if (this.previewProgressLine) {
            this.previewProgressLine.style.width = isVisible ? '0%' : '100%';
        }
    }

    handleLoadedGltf(gltf) {
        if (this.hasPlayableAnimations(gltf.animations)) {
            const glbMixer = new THREE.AnimationMixer(gltf.scene);
            this.mixers.push(glbMixer);
            this.action = glbMixer.clipAction(gltf.animations[0]);

            if (this.animationButtonWrapper) {
                this.animationButtonWrapper.style.display = '';
            }
        } else if (this.animationButtonWrapper) {
            this.animationButtonWrapper.style.display = 'none';
        }

        if (this.boundingSphereButton) {
            this.boundingSphereButton.style.display = 'inline-block';
        }

        this.scene.getObjectByName('root').add(gltf.scene);
        this.zoomer(this.scene.getObjectByName('root'));
        this.kickRendererOnDemand();

        const placeholder = document.getElementById('preview3dPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    }

    loadGlbStream(glbBuffer) {
        this.clearAllAssets('loadGlbStream');
        this.setPreviewLoading(true);

        const loader = this.createGlbLoader();
        loader.parse(
            glbBuffer,
            '',
            (gltf) => {
                this.handleLoadedGltf(gltf);
            },
            (error) => {
                console.log('An error happened', error);
                this.setPreviewLoading(false);
            }
        );
    }

    computeSceneBoundingSphereAll(myGroupObj) {
        const box = new THREE.Box3().setFromObject(myGroupObj);
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);

        const safeRadius = Math.max(sphere.radius || 0, 0.1);
        const sphereGeometry = new THREE.SphereGeometry(safeRadius, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        const sphereObject = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphereObject.visible = false;
        sphereObject.name = 'myBoundingSphere';

        return [sphere.center.clone(), safeRadius, sphereObject];
    }

    showHideBoundSphere() {
        const sphObj = this.scene.getObjectByName('myBoundingSphere');
        if (!sphObj) {
            return;
        }

        sphObj.visible = !sphObj.visible;
        this.render();
    }

    loader_asset_exists(glbFilename = null) {
        if (this.renderer) {
            this.clearAllAssets('loader_asset_exists');
        }

        if (!glbFilename) {
            return;
        }

        this.setPreviewLoading(true);

        const loader = this.createGlbLoader();
        loader.load(
            glbFilename,
            (gltf) => {
                this.handleLoadedGltf(gltf);
            },
            (xhr) => {
                if (!this.previewProgressLine || !xhr.total) {
                    return;
                }

                const progress = Math.max(0, Math.min(100, Math.round((xhr.loaded / xhr.total) * 100)));
                this.previewProgressLine.style.width = `${progress  }%`;
            },
            (error) => {
                console.log('An error happened', error);
                this.setPreviewLoading(false);
            }
        );
    }

    zoomer(towhatObj) {
        const existingSphere = this.scene.getObjectByName('myBoundingSphere');
        if (existingSphere && existingSphere.parent) {
            existingSphere.parent.remove(existingSphere);
        }

        const sphere = this.computeSceneBoundingSphereAll(towhatObj);
        this.scene.add(sphere[2]);
        const sphereCenter = sphere[0].clone();
        const totalRadius = Math.max(sphere[1], 0.1);

        if (this.controls.enableZoom) {
            this.controls.target.copy(sphereCenter);
            this.controls.minDistance = 0.01 * totalRadius;
            this.controls.maxDistance = 100 * totalRadius;
            this.controls.update();
        }

        this.cameraTarget.copy(sphereCenter);
        this.frameCameraToSphere(sphereCenter, totalRadius);
    }

    resizeDisplayGL() {
        this.recalcAspectRatio();
        this.renderer.setSize(this.canvasToBindTo.offsetWidth, this.canvasToBindTo.offsetHeight, false);
        this.labelRenderer.setSize(this.canvasLabelsToBindTo.offsetWidth, this.canvasLabelsToBindTo.offsetHeight, false);
        this.updateCamera();
        this.render();
    }

    recalcAspectRatio() {
        this.aspectRatio = this.canvasToBindTo.offsetHeight === 0 ? 1 : this.canvasToBindTo.offsetWidth / this.canvasToBindTo.offsetHeight;
    }

    resetCamera() {
        this.camera.position.copy(this.cameraDefaults.posCamera);
        this.cameraTarget.copy(this.controls.target || this.cameraDefaults.posCameraTarget);
        this.updateCamera();
    }

    frameCameraToSphere(center, radius) {
        const safeRadius = Math.max(radius, 0.1);
        const fovRadians = THREE.MathUtils.degToRad(this.camera.fov);
        const fitDistance = safeRadius / Math.sin(fovRadians / 2);
        const cameraDirection = new THREE.Vector3(0.85, 0.55, 1).normalize();
        const cameraPosition = center.clone().add(cameraDirection.multiplyScalar(fitDistance * 1.1));

        this.camera.position.copy(cameraPosition);
        this.camera.near = Math.max(safeRadius / 200, 0.01);
        this.camera.far = Math.max(safeRadius * 200, 1000);
        this.updateCamera();
    }

    updateCamera() {
        this.camera.aspect = this.aspectRatio;
        this.camera.lookAt(this.cameraTarget);
        this.camera.updateProjectionMatrix();
    }
}
