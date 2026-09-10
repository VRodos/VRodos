/* GLB-only 3D viewer used by the asset editor. */
function vrodosCreateSpecGlossMaterialExtension(parser) {
    const extensionName = 'KHR_materials_pbrSpecularGlossiness';

    return {
        name: extensionName,

        getMaterialType(materialIndex) {
            const materialDef = parser.json.materials[materialIndex] || {};
            return materialDef.extensions && materialDef.extensions[extensionName]
                ? THREE.MeshPhongMaterial
                : null;
        },

        extendMaterialParams(materialIndex, materialParams) {
            const materialDef = parser.json.materials[materialIndex] || {};
            const extension = materialDef.extensions && materialDef.extensions[extensionName];
            if (!extension) {
                return Promise.resolve();
            }

            delete materialParams.metalness;
            delete materialParams.roughness;
            delete materialParams.metalnessMap;
            delete materialParams.roughnessMap;

            const pending = [];
            materialParams.color = new THREE.Color(1, 1, 1);
            materialParams.opacity = 1;
            materialParams.specular = new THREE.Color(1, 1, 1);
            materialParams.shininess = 30;

            if (Array.isArray(extension.diffuseFactor) && extension.diffuseFactor.length >= 3) {
                materialParams.color.setRGB(
                    extension.diffuseFactor[0],
                    extension.diffuseFactor[1],
                    extension.diffuseFactor[2],
                    THREE.LinearSRGBColorSpace
                );
                materialParams.opacity = extension.diffuseFactor[3] !== undefined ? extension.diffuseFactor[3] : 1;
            }

            if (Array.isArray(extension.specularFactor) && extension.specularFactor.length >= 3) {
                materialParams.specular.setRGB(
                    extension.specularFactor[0],
                    extension.specularFactor[1],
                    extension.specularFactor[2],
                    THREE.LinearSRGBColorSpace
                );
            }

            if (extension.glossinessFactor !== undefined) {
                materialParams.shininess = Math.max(0, Math.min(1, extension.glossinessFactor)) * 100;
            }

            if (extension.diffuseTexture !== undefined) {
                pending.push(parser.assignTexture(materialParams, 'map', extension.diffuseTexture, THREE.SRGBColorSpace));
            }

            if (extension.specularGlossinessTexture !== undefined) {
                pending.push(parser.assignTexture(materialParams, 'specularMap', extension.specularGlossinessTexture));
            }

            return Promise.all(pending);
        }
    };
}

function vrodosAssetViewerCreateFrameTimer() {
    if (THREE && typeof THREE.Timer === 'function') {
        const timer = new THREE.Timer();
        if (typeof timer.connect === 'function' && typeof document !== 'undefined') {
            timer.connect(document);
        }
        return timer;
    }

    return new THREE.Clock();
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
		boundingSphereButton = null,
		loadInfo = {}
	) {
        this.statsSwitch = statsSwitch;
        this.canvasToBindTo = canvasToBindTo;
        this.canvasLabelsToBindTo = canvasLabelsToBindTo;
        this.animationButton = animationButton;
        this.animationButtonWrapper = animationButton ? animationButton.parentElement : null;
		this.previewProgressOverlay = previewProgressLabel;
		this.previewProgressLabel = document.getElementById('previewProgressLabel');
		this.previewProgressLine = previewProgressLine;
		this.previewProgressDetail = document.getElementById('previewProgressDetail');
        this.back_3d_color = back_3d_color;
        this.audioElement = audioElement;
		this.boundingSphereButton = boundingSphereButton;
		this.screenshotButton = document.getElementById('createModelScreenshotBtn');
		this.currentLoadInfo = loadInfo || {};
		this.previewReady = false;
		this.previewAwaitingFirstFrame = false;
		this.loadGeneration = 0;
        this.isBackGroundNull = isBackGroundNull;
        this.assettrsDOM = document.getElementById('assettrs');
        this.assettrs = (assettrs || '0,0,0,0,0,0,0,0,-100').split(',');
        this.mixers = [];
        this.action = null;
        this.clock = vrodosAssetViewerCreateFrameTimer();
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
		this.loader_asset_exists(glbFilename, this.currentLoadInfo);

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
            const width = rect.width || this.canvasToBindTo.clientWidth || this.canvasToBindTo.offsetWidth || 0;
            const height = rect.height || this.canvasToBindTo.clientHeight || this.canvasToBindTo.offsetHeight || 0;

            if (width <= 0 || height <= 0) {
                return;
            }

            mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);

            const intersects = raycaster.intersectObjects(root.children, true);
            if (intersects.length > 0 && this.mixers.length > 0) {
                this.playStopAnimation();
            }
        }, true);
    }

    onCanvasResize() {
		if (this.resizeDisplayGL() && this.previewAwaitingFirstFrame) {
			this.finishPreviewLoad();
		}
    }

    addControlEventListeners() {
        this.controls.addEventListener('change', this.boundRender);
    }

    removeControlEventListeners() {
        this.controls.removeEventListener('change', this.boundRender);
    }

    getCanvasDisplaySize() {
        if (!this.canvasToBindTo) {
            return { width: 0, height: 0 };
        }

        const rect = typeof this.canvasToBindTo.getBoundingClientRect === 'function'
            ? this.canvasToBindTo.getBoundingClientRect()
            : { width: 0, height: 0 };

        return {
            width: Math.floor(rect.width || this.canvasToBindTo.clientWidth || this.canvasToBindTo.offsetWidth || 0),
            height: Math.floor(rect.height || this.canvasToBindTo.clientHeight || this.canvasToBindTo.offsetHeight || 0)
        };
    }

    ensureRendererSize() {
        const size = this.getCanvasDisplaySize();
        if (size.width <= 0 || size.height <= 0) {
            return false;
        }

        const pixelRatio = typeof this.renderer.getPixelRatio === 'function' ? this.renderer.getPixelRatio() : 1;
        const expectedWidth = Math.max(1, Math.floor(size.width * pixelRatio));
        const expectedHeight = Math.max(1, Math.floor(size.height * pixelRatio));
        const sizeChanged = this.canvasToBindTo.width !== expectedWidth || this.canvasToBindTo.height !== expectedHeight;

        if (sizeChanged) {
            this.renderer.setSize(size.width, size.height, false);
            this.recalcAspectRatio();
            this.camera.aspect = this.aspectRatio;
            this.camera.updateProjectionMatrix();
        }

        if (this.labelRenderer) {
            this.labelRenderer.setSize(size.width, size.height);
        }

        return true;
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
        if (!this.ensureRendererSize()) {
            return false;
        }

        if (!this.renderer.autoClear) {
            this.renderer.clear();
        }

        if (this.statsSwitch && this.stats) {
            this.stats.update();
        }

        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);

        if (this.mixers.length > 0) {
            if (typeof this.clock.update === 'function') {
                this.clock.update();
            }
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

        return true;
    }

	kickRendererOnDemand() {
		this.addControlEventListeners();
		if (this.resizeDisplayGL()) {
			this.finishPreviewLoad();
			return;
		}

		requestAnimationFrame(() => {
			if (this.resizeDisplayGL()) {
				this.finishPreviewLoad();
			}
		});
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

	clearAllAssets(_whocalls) {
		this.setZeroVars();
		this.loadGeneration++;
		this.previewAwaitingFirstFrame = false;
		this.setPreviewReady(false);
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

		this.disposeObjectResources(rootObj);

		if (rootObj.clear) {
			rootObj.clear();
		}
	}

	disposeObjectResources(root) {
		if (!root || typeof root.traverse !== 'function') return;
		root.traverse((node) => {
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
	}

    createGlbLoader() {
        if (!VRODOS.loader || typeof VRODOS.loader.createGltfLoader !== 'function') {
            throw new Error('VRodos GLTF decoder configuration is required before creating the asset viewer loader.');
        }
        const loader = VRODOS.loader.createGltfLoader(null, { renderer: this.renderer });
        loader.register(vrodosCreateSpecGlossMaterialExtension);
        return loader;
    }

	setPreviewLoading(isVisible, title = '') {
		if (this.previewProgressOverlay) {
			this.previewProgressOverlay.style.visibility = isVisible ? 'visible' : 'hidden';
		}
		if (this.previewProgressLabel && title) {
			this.previewProgressLabel.textContent = title;
		}

		if (this.previewProgressLine) {
			this.previewProgressLine.style.width = isVisible ? '0%' : '100%';
		}

		if (!isVisible && this.previewProgressDetail) {
			this.previewProgressDetail.textContent = '';
		}
	}

	setPreviewStatus(title, detail = '') {
		if (this.previewProgressLabel && title) {
			this.previewProgressLabel.textContent = title;
		}
		if (this.previewProgressDetail) {
			this.previewProgressDetail.textContent = detail;
		}
	}

	setPreviewReady(isReady) {
		this.previewReady = Boolean(isReady);
		if (this.screenshotButton) {
			this.screenshotButton.disabled = !this.previewReady;
			this.screenshotButton.setAttribute('aria-disabled', this.previewReady ? 'false' : 'true');
		}
	}

	finishPreviewLoad() {
		this.previewAwaitingFirstFrame = false;
		this.setPreviewLoading(false);
		this.setPreviewReady(true);
		if (typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
			window.dispatchEvent(new CustomEvent('vrodos:asset-preview-ready', {
				detail: { loadInfo: this.currentLoadInfo || {} }
			}));
		}
	}

	formatBytes(bytes) {
		const value = Number(bytes || 0);
		if (!Number.isFinite(value) || value <= 0) return '0 MB';
		return `${Math.round((value / 1048576) * 10) / 10} MB`;
	}

	loadingTitle() {
		return this.currentLoadInfo && this.currentLoadInfo.loadVariant === 'source'
			? 'Loading full source quality'
			: 'Loading optimized preview';
	}

	handleLoadedGltf(gltf) {
		this.setPreviewStatus('Preparing first frame');
		this.previewAwaitingFirstFrame = true;
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
		const loadGeneration = this.loadGeneration;
		this.currentLoadInfo = { loadVariant: 'source', status: 'ready' };
		this.setPreviewLoading(true, 'Decoding model');

        const loader = this.createGlbLoader();
        loader.parse(
            glbBuffer,
			'',
			(gltf) => {
				if (loadGeneration !== this.loadGeneration) {
					this.disposeObjectResources(gltf && gltf.scene);
					return;
				}
				this.handleLoadedGltf(gltf);
			},
			(error) => {
				if (loadGeneration !== this.loadGeneration) return;
				console.log('An error happened', error);
				this.setPreviewLoading(false);
				this.setPreviewReady(false);
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

	loader_asset_exists(glbFilename = null, loadInfo = {}) {
        if (this.renderer) {
            this.clearAllAssets('loader_asset_exists');
        }
		const loadGeneration = this.loadGeneration;

		if (!glbFilename) {
			return;
		}

		this.currentLoadInfo = loadInfo || {};
		this.setPreviewLoading(true, this.loadingTitle());
		this.setPreviewReady(false);

        const loader = this.createGlbLoader();
		loader.load(
			glbFilename,
			(gltf) => {
				if (loadGeneration !== this.loadGeneration) {
					this.disposeObjectResources(gltf && gltf.scene);
					return;
				}
				this.setPreviewStatus('Preparing first frame');
				this.handleLoadedGltf(gltf);
			},
			(xhr) => {
				if (loadGeneration !== this.loadGeneration) return;
				const loaded = Number(xhr.loaded || 0);
				const total = Number(xhr.total || this.currentLoadInfo.loadBytes || 0);
				if (!total) {
					this.setPreviewStatus(this.loadingTitle(), loaded > 0 ? `${this.formatBytes(loaded)} downloaded` : 'Starting download');
					return;
				}

				const progress = Math.max(0, Math.min(100, Math.round((loaded / total) * 100)));
				if (this.previewProgressLine) {
					this.previewProgressLine.style.width = `${progress}%`;
				}
				if (loaded >= total) {
					this.setPreviewStatus('Decoding model', `${this.formatBytes(total)} downloaded`);
				} else {
					this.setPreviewStatus(this.loadingTitle(), `${progress}% · ${this.formatBytes(loaded)} / ${this.formatBytes(total)}`);
				}
			},
			(error) => {
				if (loadGeneration !== this.loadGeneration) return;
				console.log('An error happened', error);
				this.setPreviewLoading(false);
				this.setPreviewReady(false);
			}
		);
	}

	loadAssetUrl(glbFilename, loadInfo = {}) {
		this.loader_asset_exists(glbFilename, loadInfo);
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
        if (!this.ensureRendererSize()) {
            return false;
        }

        this.render();
        return true;
    }

    recalcAspectRatio() {
        const size = this.getCanvasDisplaySize();
        this.aspectRatio = size.height === 0 ? 1 : size.width / size.height;
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

VRODOS.editor.AssetViewer3DKernel = VRodos_AssetViewer_3D_kernel;
