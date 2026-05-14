"use strict";

const VRODOS_EDITOR_CAMERA = VRODOS.editorRender.camera;
const VRODOS_EDITOR_SCENE_DEFAULTS = VRODOS.editorRender.sceneDefaults;
const VRODOS_EDITOR_ZOOM = VRODOS.editorRender.zoom;
const VRODOS_DIRECTOR_GROUND_GUIDE = VRODOS.editorRender.directorGroundGuide;
const VRODOS_EDITOR_PERFORMANCE_DEFAULTS = VRODOS.editorRender.performanceDefaults;
const vrodosDirectorSafeVector = VRODOS.editorRender.directorSafeVector;
const vrodosDirectorIsInternalHelper = VRODOS.editorRender.directorIsInternalHelper;
const vrodosDirectorGroundGuideObjectExcluded = VRODOS.editorRender.directorGroundGuideObjectExcluded;
const vrodosDirectorGroundGuideObjectVisible = VRODOS.editorRender.directorGroundGuideObjectVisible;
const vrodosGetPointerLockObject = VRODOS.editorRender.getPointerLockObject;
const vrodosEditorHardwareProfile = VRODOS.editorRender.hardwareProfile;
const vrodosEnvironmentResolveBaseUrl = VRODOS.editorRender.resolveBaseUrl;

class vrodos_3d_editor_environmentals {

    constructor(vr_editor_main_div) {

        // animation
        this.animationMixers = [];
        this.clock = new THREE.Clock();
        this.flagPlayAnimation = true;

        // scene object caches — maintained by add/remove operations to avoid per-interaction scene.traverse()
        this.selectableMeshes = new Set();   // top-level objects with isSelectableMesh = true
        this.selectableMeshesArray = [];
        this.selectableMeshesDirty = true;
        this.celOutlineMeshes = new Set();   // active __cel_outline__ back-face hull meshes
        this.positionalAudioNodes = [];      // THREE.PositionalAudio nodes (future audio support)
        this.directorGroundGuideTargets = [];
        this.directorGroundGuideTargetsDirty = true;
        this.directorGroundGuideLastUpdateAt = 0;
        this.directorGroundGuideLastTargetRefreshAt = 0;
        this.directorGroundGuideRaycaster = new THREE.Raycaster();
        this.directorGroundGuideRayOrigin = new THREE.Vector3();
        this.directorGroundGuideRayDirection = new THREE.Vector3(0, -1, 0);
        this.directorGroundGuideHitNormal = new THREE.Vector3(0, 1, 0);
        this.directorGroundGuidePlaneNormal = new THREE.Vector3(0, 0, 1);
        this.directorGroundGuideOffsetPosition = new THREE.Vector3();
        this.directorGroundGuideRotation = new THREE.Quaternion();
        this.directorGroundGuideGroup = null;
        this.compassDirection = new THREE.Vector3();
        this.editorPerformanceProfile = null;
        this.composer = null;
        this.renderPass = null;
        this.outlinePass = null;
        this.effectFXAA = null;

        // The editor uses lightweight cel outlines, so the composer/FXAA path stays opt-in.
        this.isComposerOn = false;
        this.is2d = false;
        this.thirdPersonView = false;
        this.isSceneLoading = false;

        this.ctx = this;

        this.vr_editor_main_div = vr_editor_main_div;

        this.updateScreenMetrics();
        this.VIEW_ANGLE = VRODOS_EDITOR_CAMERA.viewAngle;

        this.FRUSTUM_SIZE = VRODOS_EDITOR_CAMERA.frustumSize; // For orthographic camera only

        this.SCENE_DIMENSION_SURFACE = VRODOS_EDITOR_SCENE_DEFAULTS.surfaceDimension; // It is the max of x z dimensions of the scene (found when all objects are loaded)
        this.SCENE_CENTER_X = VRODOS_EDITOR_SCENE_DEFAULTS.centerX;
        this.SCENE_CENTER_Y = VRODOS_EDITOR_SCENE_DEFAULTS.centerY;
        this.SCENE_CENTER_Z = VRODOS_EDITOR_SCENE_DEFAULTS.centerZ;

        this.NEAR = VRODOS_EDITOR_CAMERA.near;
        this.FAR = VRODOS_EDITOR_CAMERA.far; // keep the camera empty until everything is loaded

        // -- Set Renderer ----
        // antialias: false — MSAA backbuffer is never used once EffectComposer is active (FXAA handles AA via composer)
        this.renderer = new THREE.WebGLRenderer({antialias: false, alpha: false, logarithmicDepthBuffer: false});
        this.configureRenderer();
        this.bindRendererContextHandlers();
        // Label renderer for CSS2D renderer
        this.labelRenderer = new THREE.CSS2DRenderer();
        this.configureLabelRenderer();
        this.labelRenderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

         // ------ Create Scene -------
        this.scene = new THREE.Scene();
        this.scene.name = "vrodosScene";
        this.bindDirectorGroundGuideSceneMutationHooks();

        this.loadSceneEnvironmentTexture();

        // --- Add Grid to scene
        this.gridHelper = new THREE.GridHelper(
            VRODOS_EDITOR_SCENE_DEFAULTS.gridSize,
            VRODOS_EDITOR_SCENE_DEFAULTS.gridDivisions
        );
        this.gridHelper.name = "myGridHelper";
        this.scene.add(this.gridHelper);
        this.gridHelper.visible = true;

        // -- Add Axes helper
        this.axesHelper = new THREE.AxesHelper(VRODOS_EDITOR_SCENE_DEFAULTS.axesSize);
        this.axesHelper.name = "myAxisHelper";
        this.scene.add(this.axesHelper);
        this.axesHelper.visible = true;


        // add the renderers to the canvas
        this.vr_editor_main_div.appendChild(this.renderer.domElement);
        this.vr_editor_main_div.appendChild(this.labelRenderer.domElement);

        //-------------------------
        this.setOrbitCamera();
        this.setAvatarCamera();

        // Composer is kept as an opt-in path; normal editing renders directly.
        this.applyEditorPerformanceProfile(true);

        this.bindResizeHandler();
    }

    bindResizeHandler() {
        window.addEventListener('resize', () => {
            this.turboResize();
            if (VRODOS.editor && typeof VRODOS.editor.requestRender === 'function') {
                VRODOS.editor.requestRender('resize');
            }
        }, true);
    }

    configureRenderer() {
        this.renderer.shadowMap.enabled = false;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.autoClear = true;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.sortObjects = true;
    }

    bindRendererContextHandlers() {
        if (!this.renderer || !this.renderer.domElement) {
            return;
        }

        this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            if (VRODOS.editor && typeof VRODOS.editor.stopRenderLoop === 'function') {
                VRODOS.editor.stopRenderLoop();
            }
            console.warn('VRodos editor WebGL context lost. Rendering is paused until the browser restores it.');
        }, false);

        this.renderer.domElement.addEventListener('webglcontextrestored', () => {
            this.configureRenderer();
            this.turboResize();
            if (VRODOS.editor && typeof VRODOS.editor.requestRender === 'function') {
                VRODOS.editor.requestRender('webglcontextrestored');
            }
        }, false);
    }

    configureLabelRenderer() {
        Object.assign(this.labelRenderer.domElement.style, {
            position: 'absolute',
            top: '0',
            fontSize: '25pt',
            textShadow: '-1px -1px #000, 1px -1px #000, -1px 1px  #000, 1px 1px #000',
            pointerEvents: 'none'
        });
    }

    updateScreenMetrics() {
        const width = this.vr_editor_main_div ? this.vr_editor_main_div.clientWidth : 0;
        const height = this.vr_editor_main_div ? this.vr_editor_main_div.clientHeight : 0;

        this.SCREEN_WIDTH = Math.max(width || 1, 1);
        this.SCREEN_HEIGHT = Math.max(height || 1, 1);
        this.ASPECT = this.SCREEN_WIDTH / this.SCREEN_HEIGHT;
    }

    getEditableObjectCount() {
        if (this.selectableMeshes && this.selectableMeshes.size > 0) {
            return this.selectableMeshes.size;
        }

        const registry = VRODOS.editor && VRODOS.editor.sceneRegistry ? VRODOS.editor.sceneRegistry : null;
        if (registry && typeof registry.getSelectableRoots === 'function') {
            const roots = registry.getSelectableRoots({ rebuildIfEmpty: false });
            return roots.filter((node) => node && node.isSelectableMesh && node.vrodos_internal_helper !== true).length;
        }

        return 0;
    }

    getEditorPerformanceProfile() {
        const hardware = vrodosEditorHardwareProfile();
        const editableObjectCount = this.getEditableObjectCount();
        const isLowEndHardware = hardware.cores <= 4 || hardware.memory <= 4;
        const isDenseScene = editableObjectCount >= VRODOS_EDITOR_PERFORMANCE_DEFAULTS.denseSceneObjectCount;
        const shouldDegrade = isLowEndHardware || isDenseScene;

        return {
            targetFps: shouldDegrade ? VRODOS_EDITOR_PERFORMANCE_DEFAULTS.lowEndTargetFps : VRODOS_EDITOR_PERFORMANCE_DEFAULTS.targetFps,
            pixelRatioCap: shouldDegrade ? VRODOS_EDITOR_PERFORMANCE_DEFAULTS.lowEndPixelRatioCap : VRODOS_EDITOR_PERFORMANCE_DEFAULTS.pixelRatioCap,
            labelFrameStride: shouldDegrade ? VRODOS_EDITOR_PERFORMANCE_DEFAULTS.lowEndLabelFrameStride : VRODOS_EDITOR_PERFORMANCE_DEFAULTS.labelFrameStride,
            loaderConcurrency: shouldDegrade ? VRODOS_EDITOR_PERFORMANCE_DEFAULTS.lowEndLoaderConcurrency : VRODOS_EDITOR_PERFORMANCE_DEFAULTS.loaderConcurrency,
            textureAnisotropy: shouldDegrade ? VRODOS_EDITOR_PERFORMANCE_DEFAULTS.lowEndTextureAnisotropy : VRODOS_EDITOR_PERFORMANCE_DEFAULTS.textureAnisotropy,
            isLowEndHardware,
            isDenseScene,
            editableObjectCount
        };
    }

    applyEditorPerformanceProfile(force) {
        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? performance.now()
            : Date.now();
        const loop = VRODOS.editor && VRODOS.editor.renderLoop ? VRODOS.editor.renderLoop : null;

        if (!force && loop && (now - (loop.lastQualitySampleAt || 0)) < 1000) {
            return this.editorPerformanceProfile;
        }

        const profile = this.getEditorPerformanceProfile();
        this.editorPerformanceProfile = profile;

        if (loop) {
            loop.targetFps = profile.targetFps;
            loop.pixelRatioCap = profile.pixelRatioCap;
            loop.labelFrameStride = profile.labelFrameStride;
            loop.loaderConcurrency = profile.loaderConcurrency;
            loop.lastQualitySampleAt = now;
        }

        if (this.renderer) {
            this.renderer.setPixelRatio(this.getEditorPixelRatio());
        }
        if (this.composer) {
            if (typeof this.composer.setPixelRatio === 'function') {
                this.composer.setPixelRatio(this.getEditorPixelRatio());
            } else if (this.composer.renderer) {
                this.composer.renderer.setPixelRatio(this.getEditorPixelRatio());
            }
        }

        return profile;
    }

    getEditorPixelRatio() {
        const devicePixelRatio = (typeof window !== 'undefined' && Number.isFinite(window.devicePixelRatio))
            ? window.devicePixelRatio
            : 1;
        const loop = VRODOS.editor && VRODOS.editor.renderLoop ? VRODOS.editor.renderLoop : {};
        const cap = Number(loop.pixelRatioCap || VRODOS_EDITOR_PERFORMANCE_DEFAULTS.pixelRatioCap);

        return Math.max(1, Math.min(devicePixelRatio || 1, cap));
    }

    getEditorTextureAnisotropyCap() {
        const profile = this.editorPerformanceProfile || this.applyEditorPerformanceProfile(true);
        return profile ? profile.textureAnisotropy : VRODOS_EDITOR_PERFORMANCE_DEFAULTS.textureAnisotropy;
    }

    loadSceneEnvironmentTexture() {
        const imageBaseUrl = vrodosEnvironmentResolveBaseUrl(VRODOS.data.pluginPath, 'imageBaseUrl', 'assets/images/');
        const hdrLoader = new THREE.HDRLoader();

        hdrLoader.setPath(`${imageBaseUrl  }hdr/`)
            .load('Stonewall_Ref.hdr', (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                this.maintexture = texture;
                this.scene.environment = this.maintexture;
            });
    }

    isAvatarControlsEnabled() {
        return typeof VRODOS.editor.avatarControlsEnabled !== 'undefined' && VRODOS.editor.avatarControlsEnabled;
    }


    // EffectComposer for rendering, outline pass compatibility, and FXAA antialiasing.
    setComposerAndPasses(transformControls) {

        // Get current camera
        const camera = this.isAvatarControlsEnabled() ? this.cameraAvatar : this.cameraOrbit;

        if (transformControls) {
            transformControls.camera = camera;
        }

        this.composer = new THREE.EffectComposer(this.renderer);
        this.renderPass = new THREE.RenderPass(this.scene, camera);

        // Outline Pass
        this.outlinePass = new THREE.OutlinePass(
            new THREE.Vector2(this.SCREEN_WIDTH, this.SCREEN_HEIGHT), this.scene, camera);
        // OutlinePass disabled — replaced by cel-shaded back-face hull outline
        // (see VRODOS.ui.addCelOutline/VRODOS.ui.removeCelOutline in vrodos_auxControlers.js)
        this.outlinePass.enabled = false;

        // FX Pass
        this.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
        this.effectFXAA.uniforms.resolution.value.set(1 / this.SCREEN_WIDTH, 1 / this.SCREEN_HEIGHT);
        this.effectFXAA.renderToScreen = true;

        this.turboResize();

        // Add to composer all passes
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.outlinePass);
        this.composer.addPass(this.effectFXAA);

        this.turboResize();
    }

    updateComposerCamera(camera) {
        if (!camera) {
            return;
        }

        if (this.renderPass) {
            this.renderPass.camera = camera;
        }

        if (this.outlinePass) {
            this.outlinePass.renderCamera = camera;
            this.outlinePass.camera = camera;
        }
    }

    renderEditorFrame(camera) {
        if (!camera || !this.renderer || !this.scene) {
            return;
        }

        this.applyEditorPerformanceProfile(false);

        if (this.isComposerOn && this.composer && this.renderPass) {
            this.updateComposerCamera(camera);
            this.composer.render();
            return;
        }

        this.renderer.render(this.scene, camera);
    }

    // Resize renderers without changing the user's current orbit target, position, or zoom.
    turboResize() {

        this.updateScreenMetrics();

        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        this.renderer.setPixelRatio(this.getEditorPixelRatio());

        this.labelRenderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        //----------------------------------------------

        this.updateCameraProjectionForResize();

        //----------------------------------------------------------------
        if (this.cameraAvatar) {
            this.cameraAvatar.aspect = this.ASPECT;
            this.cameraAvatar.updateProjectionMatrix();
        }

        if (this.cameraThirdPerson) {
            this.cameraThirdPerson.aspect = this.ASPECT;
            this.cameraThirdPerson.updateProjectionMatrix();
        }

        //---------------------------------------------------------------
        const pixelRatio = this.getEditorPixelRatio();
        if (this.composer) {
            if (typeof this.composer.setSize === 'function') {
                this.composer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
            } else if (this.composer.renderer) {
                this.composer.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
            }
            if (typeof this.composer.setPixelRatio === 'function') {
                this.composer.setPixelRatio(pixelRatio);
            } else if (this.composer.renderer) {
                this.composer.renderer.setPixelRatio(pixelRatio);
            }
        }
        if (this.effectFXAA && this.effectFXAA.uniforms && this.effectFXAA.uniforms.resolution) {
            this.effectFXAA.uniforms.resolution.value.set(1 / (this.SCREEN_WIDTH * pixelRatio), 1 / (this.SCREEN_HEIGHT * pixelRatio));
        }
    }

    updateCameraProjectionForResize() {
        if (!this.cameraOrbit) {
            return;
        }

        if (this.cameraOrbit.type === 'PerspectiveCamera') {
            this.cameraOrbit.aspect = this.ASPECT;
        } else if (this.cameraOrbit.type === 'OrthographicCamera') {
            this.cameraOrbit.left = this.FRUSTUM_SIZE * this.ASPECT / -2;
            this.cameraOrbit.right = this.FRUSTUM_SIZE * this.ASPECT / 2;
            this.cameraOrbit.top = this.FRUSTUM_SIZE / 2;
            this.cameraOrbit.bottom = this.FRUSTUM_SIZE / -2;
            this.cameraOrbit.zoom = VRODOS.utils.clampNumber(
                this.cameraOrbit.zoom,
                VRODOS_EDITOR_ZOOM.min,
                VRODOS_EDITOR_ZOOM.max,
                VRODOS_EDITOR_ZOOM.fallback
            );
        }

        this.cameraOrbit.updateProjectionMatrix();
        if (this.orbitControls) {
            this.orbitControls.update();
        }
    }

    getActiveEditorCamera() {
        if (this.isAvatarControlsEnabled()) {
            return this.thirdPersonView ? this.cameraThirdPerson : this.cameraAvatar;
        }

        return this.cameraOrbit;
    }

    updateCompassUI() {
        const compassElement = document.getElementById('scene-editor-compass');
        if (!compassElement) {
            return;
        }

        const needleElement = document.getElementById('scene-editor-compass-needle');
        const activeCamera = this.getActiveEditorCamera();

        if (!activeCamera || !needleElement) {
            return;
        }

        const direction = this.compassDirection;
        activeCamera.getWorldDirection(direction);
        direction.y = 0;

        if (direction.lengthSq() < 1e-6) {
            needleElement.style.transform = 'rotate(0deg)';
            return;
        }

        direction.normalize();

        const headingRadians = Math.atan2(direction.x, -direction.z);
        const headingDegrees = (THREE.MathUtils.radToDeg(headingRadians) + 360) % 360;

        needleElement.style.transform = `rotate(${  headingDegrees.toFixed(2)  }deg)`;
    }

    /**
     Set the Orbit Camera
     */
    setOrbitCamera() {

        // Camera Orbit is the default camera of the scene editor, which is an orthographic one
        // Do not set orthographicCamera near plane to negative values (it affects badly raycasting)
        // Try to configure orthographicCamera based on game type
        this.cameraOrbit = new THREE.OrthographicCamera(this.FRUSTUM_SIZE * this.ASPECT / -2,
            this.FRUSTUM_SIZE * this.ASPECT / 2,
            this.FRUSTUM_SIZE / 2,
            this.FRUSTUM_SIZE / -2, 0, this.FAR);

        //     new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.ASPECT, this.NEAR, this.FAR);

        this.cameraOrbit.name = "orbitCamera";
        this.scene.add(this.cameraOrbit);

        // Cold start values
        this.cameraOrbit.position.set(0, this.FRUSTUM_SIZE, 0);

        // Controls for Orbit camera
        this.orbitControls = new THREE.OrbitControls(this.cameraOrbit, this.renderer.domElement);
        this.orbitControls.userPanSpeed = 1;
        // Keep editor picking deterministic: orbit rotation should stop immediately on mouseup.
        this.orbitControls.enableDamping = false;
        this.orbitControls.dampingFactor = 0;
        this.orbitControls.zoomSpeed = 1.25;
        this.orbitControls.object.zoom = 1;
        this.orbitControls.minZoom = 1;
        this.orbitControls.maxZoom = 10000;
        this.orbitControls.enableRotate = true;

        // Real-time gizmo scaling during zoom
        this.orbitControls.addEventListener('change', () => {
            if (typeof VRODOS.ui.transform.setSize === 'function') {
                VRODOS.ui.transform.setSize();
            }
            if (VRODOS.editor && typeof VRODOS.editor.requestRender === 'function') {
                VRODOS.editor.requestRender('orbit-change');
            }
        });
    }

    /**
     *  Set the Avatar camera
     */
    setAvatarCamera() {

        // Avatar camera is a Perspective camera
        this.cameraAvatar = new THREE.PerspectiveCamera(
            this.VIEW_ANGLE,
            this.ASPECT,
            VRODOS_EDITOR_CAMERA.near,
            VRODOS_EDITOR_CAMERA.avatarFar
        );
        this.cameraAvatar.name = "avatarCamera";
        this.cameraAvatar.category_name = "avatarYawObject";
        this.cameraAvatar.isSelectableMesh = true;
        this.cameraAvatar.rotation.order = 'YXZ';
        this.cameraAvatar.rotation.y = Math.PI*2;

        this.audiolistener = new THREE.AudioListener();
        this.cameraAvatar.add(this.audiolistener);

        this.scene.add(this.cameraAvatar);

        // Avatar camera Controls is a PointerLockControls

        this.avatarControls = new THREE.PointerLockControls(this.cameraAvatar, this.renderer.domElement);
        this.avatarControls.name = "avatarControls";

        // Avatar Yaw controls
        const avatarControlsYawObject = vrodosGetPointerLockObject(this.avatarControls);
        if (!avatarControlsYawObject) {
            return;
        }
        this.initAvatarPosition = new THREE.Vector3(0, 0, 0);
        avatarControlsYawObject.position.set(this.initAvatarPosition.x, this.initAvatarPosition.y, this.initAvatarPosition.z);
        this.scene.add(avatarControlsYawObject);

        // Third person camera is a Perspective camera
        this.cameraThirdPerson = new THREE.PerspectiveCamera(
            this.VIEW_ANGLE,
            this.ASPECT,
            VRODOS_EDITOR_CAMERA.near,
            VRODOS_EDITOR_CAMERA.thirdPersonFar
        );
        this.cameraThirdPerson.position.set(0, 4, 5);
        this.cameraThirdPerson.rotation.x = -0.2;
        this.cameraThirdPerson.name = "cameraThirdPerson";

        avatarControlsYawObject.add(this.cameraThirdPerson);

    }


    clearDirectorInternalHelpers() {
        const director = this.getDirectorObject();

        if (director) {
            const childrenToRemove = director.children.filter((child) => vrodosDirectorIsInternalHelper(child));

            childrenToRemove.forEach((child) => {
                director.remove(child);
            });
        }

        const rootHelpers = [];
        this.scene.traverse((child) => {
            if (child === director) {
                return;
            }

            if (vrodosDirectorIsInternalHelper(child)) {
                rootHelpers.push(child);
            }
        });

        rootHelpers.forEach((child) => {
            if (child.parent) {
                child.parent.remove(child);
            }
        });
    }

    createDirectorHitProxy() {
        const geometry = new THREE.BoxGeometry(2.2, 2.2, 2.2);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.001,
            depthWrite: false
        });

        const hitProxy = new THREE.Mesh(geometry, material);
        hitProxy.name = "DirectorHitProxy";
        hitProxy.vrodos_internal_helper = true;
        hitProxy.isSelectableMesh = true;
        hitProxy.renderOrder = -1;
        hitProxy.frustumCulled = false;
        hitProxy.visible = true;
        hitProxy.position.set(0, 0, 0);
        hitProxy.updateMatrixWorld(true);

        return hitProxy;
    }

    setCamMeshToAvatarControls() {
        const camMesh = this.getDirectorVisualObject();
        const director = this.getDirectorObject();

        if (!camMesh || !director) {
            return;
        }

        if (camMesh.parent !== director) {
            director.add(camMesh);
        }
        camMesh.updateMatrixWorld(true);
    }

    getDirectorRig() {
        return vrodosGetPointerLockObject(this.avatarControls);
    }

    syncFirstPersonRigToDirector() {
        const director = this.getDirectorObject();
        const rig = this.getDirectorRig();

        if (!director) {
            return;
        }

        director.updateMatrixWorld(true);

        if (rig && rig !== director) {
            rig.position.copy(director.position);
            rig.quaternion.copy(director.quaternion);
            rig.scale.set(1, 1, 1);
            rig.updateMatrixWorld(true);

            if (this.cameraAvatar && this.cameraAvatar.parent === rig) {
                this.cameraAvatar.position.set(0, 0, 0);
                this.cameraAvatar.rotation.set(0, 0, 0);
                this.cameraAvatar.scale.set(1, 1, 1);
                this.cameraAvatar.updateMatrixWorld(true);
            }
            return;
        }

        if (rig) {
            rig.updateMatrixWorld(true);
        }
    }

    setDirectorWorldPosition(x, y, z, rx, ry) {
        const director = this.getDirectorObject();
        if (!director) {
            return;
        }

        director.position.set(x, y, z);
        director.rotation.set(rx, ry, 0);
        this.setCamMeshToAvatarControls();
        director.updateMatrixWorld(true);
    }

    getDirectorObject() {
        return this.scene.getObjectByName("avatarCamera") || this.cameraAvatar || null;
    }

    getDirectorVisualObject() {
        return this.scene.getObjectByName("Camera3Dmodel") || null;
    }

    getDirectorHitProxy() {
        return this.scene.getObjectByName("DirectorHitProxy") || null;
    }

    installDirectorHelpers(camMesh, hitProxy) {
        const director = this.getDirectorObject();
        if (!director) {
            return;
        }

        this.clearDirectorInternalHelpers();

        if (camMesh) {
            director.add(camMesh);
            camMesh.updateMatrixWorld(true);
        }

        if (hitProxy) {
            director.add(hitProxy);
            hitProxy.updateMatrixWorld(true);
        }
    }

    applyDirectorTransform(position, rotation) {
        const director = this.getDirectorObject();
        if (!director) {
            return;
        }

        const safePosition = vrodosDirectorSafeVector(position, [0, 0.2, 0]);
        const safeRotation = vrodosDirectorSafeVector(rotation, [0, 0, 0]);

        director.position.set(safePosition[0], safePosition[1], safePosition[2]);
        director.rotation.set(safeRotation[0], safeRotation[1], safeRotation[2]);
        director.scale.set(1, 1, 1);
        this.setCamMeshToAvatarControls();
        director.updateMatrixWorld(true);
    }

    moveDirectorToOrbitTarget() {
        const director = this.getDirectorObject();
        if (!director || !this.orbitControls) {
            return;
        }

        const safeFloorY = 0.2;
        const targetY = Number(this.orbitControls.target.y);
        const currentY = Number(director.position.y);

        director.position.x = this.orbitControls.target.x;
        director.position.z = this.orbitControls.target.z;
        director.position.y = Math.max(
            Number.isFinite(currentY) ? currentY : safeFloorY,
            Number.isFinite(targetY) ? targetY : safeFloorY,
            safeFloorY
        );
        director.scale.set(1, 1, 1);
        this.setCamMeshToAvatarControls();
        director.updateMatrixWorld(true);
    }

    resetDirectorTransform() {
        this.applyDirectorTransform([0, 0.2, 0], [0, 0, 0]);
    }

    isDirectorGroundGuideObject(object) {
        let current = object || null;

        while (current) {
            if (current.name === 'DirectorGroundGuide' ||
                current.name === 'DirectorGroundGuideShadow' ||
                current.name === 'DirectorGroundGuideRing') {
                return true;
            }

            current = current.parent || null;
        }

        return false;
    }

    bindDirectorGroundGuideSceneMutationHooks() {
        if (!this.scene || this.scene.vrodosDirectorGroundGuideMutationHooksInstalled === true) {
            return;
        }

        const scene = this.scene;
        const originalAdd = scene.add.bind(scene);
        const originalRemove = scene.remove.bind(scene);
        const environment = this;

        scene.add = function(...objects) {
            const result = originalAdd(...objects);
            if (objects.some((object) => !environment.isDirectorGroundGuideObject(object))) {
                environment.markDirectorGroundGuideTargetsDirty();
            }
            return result;
        };

        scene.remove = function(...objects) {
            const result = originalRemove(...objects);
            if (objects.some((object) => !environment.isDirectorGroundGuideObject(object))) {
                environment.markDirectorGroundGuideTargetsDirty();
            }
            return result;
        };

        scene.vrodosDirectorGroundGuideMutationHooksInstalled = true;
    }

    markDirectorGroundGuideTargetsDirty() {
        this.directorGroundGuideTargetsDirty = true;
        this.selectableMeshesDirty = true;
    }

    ensureDirectorGroundGuide() {
        if (this.directorGroundGuideGroup) {
            if (this.directorGroundGuideGroup.parent !== this.scene) {
                this.scene.add(this.directorGroundGuideGroup);
            }
            return this.directorGroundGuideGroup;
        }

        const group = new THREE.Group();
        group.name = 'DirectorGroundGuide';
        group.vrodos_internal_helper = true;
        group.isSelectableMesh = false;
        group.visible = false;
        group.renderOrder = 10000;
        group.frustumCulled = false;

        const shadowGeometry = new THREE.CircleGeometry(VRODOS_DIRECTOR_GROUND_GUIDE.radius, 64);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x0f172a,
            transparent: true,
            opacity: 0.42,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            polygonOffsetUnits: -4
        });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.name = 'DirectorGroundGuideShadow';

        const ringGeometry = new THREE.TorusGeometry(
            VRODOS_DIRECTOR_GROUND_GUIDE.radius,
            VRODOS_DIRECTOR_GROUND_GUIDE.ringTubeRadius,
            8,
            64
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            depthTest: true,
            polygonOffset: true,
            polygonOffsetFactor: -5,
            polygonOffsetUnits: -5
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.name = 'DirectorGroundGuideRing';

        group.add(shadow);
        group.add(ring);
        group.traverse((node) => {
            node.vrodos_internal_helper = true;
            node.isSelectableMesh = false;
            node.frustumCulled = false;
            node.renderOrder = 10000;
        });

        this.directorGroundGuideGroup = group;
        this.scene.add(group);

        return group;
    }

    refreshDirectorGroundGuideTargets(now) {
        const targets = [];

        if (!this.scene) {
            this.directorGroundGuideTargets = targets;
            this.directorGroundGuideTargetsDirty = false;
            return;
        }

        this.scene.traverse((node) => {
            if (!node || !node.isMesh) {
                return;
            }

            if (vrodosDirectorGroundGuideObjectExcluded(node)) {
                return;
            }

            targets.push(node);
        });

        this.directorGroundGuideTargets = targets;
        this.directorGroundGuideTargetsDirty = false;
        this.directorGroundGuideLastTargetRefreshAt = now;
    }

    hideDirectorGroundGuide() {
        if (this.directorGroundGuideGroup) {
            this.directorGroundGuideGroup.visible = false;
        }
    }

    updateDirectorGroundGuide() {
        if (!this.scene) {
            return;
        }

        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? performance.now()
            : Date.now();

        if ((now - this.directorGroundGuideLastUpdateAt) < VRODOS_DIRECTOR_GROUND_GUIDE.updateIntervalMs) {
            return;
        }
        this.directorGroundGuideLastUpdateAt = now;

        const director = this.getDirectorObject();
        if (!director) {
            this.hideDirectorGroundGuide();
            return;
        }

        if (this.directorGroundGuideTargetsDirty ||
            (now - this.directorGroundGuideLastTargetRefreshAt) > VRODOS_DIRECTOR_GROUND_GUIDE.targetRefreshIntervalMs) {
            this.refreshDirectorGroundGuideTargets(now);
        }

        if (this.directorGroundGuideTargets.length === 0) {
            this.hideDirectorGroundGuide();
            return;
        }

        this.scene.updateMatrixWorld(false);
        director.getWorldPosition(this.directorGroundGuideRayOrigin);

        if (!Number.isFinite(this.directorGroundGuideRayOrigin.y)) {
            this.hideDirectorGroundGuide();
            return;
        }

        this.directorGroundGuideRaycaster.near = 0;
        this.directorGroundGuideRaycaster.far = VRODOS_DIRECTOR_GROUND_GUIDE.maxDistance;
        this.directorGroundGuideRaycaster.set(
            this.directorGroundGuideRayOrigin,
            this.directorGroundGuideRayDirection
        );

        const intersections = this.directorGroundGuideRaycaster.intersectObjects(this.directorGroundGuideTargets, false);
        for (let i = 0; i < intersections.length; i++) {
            const hit = intersections[i];
            if (!hit || !hit.object || !hit.face || !hit.point) {
                continue;
            }

            if (!vrodosDirectorGroundGuideObjectVisible(hit.object) ||
                vrodosDirectorGroundGuideObjectExcluded(hit.object)) {
                continue;
            }

            this.directorGroundGuideHitNormal.copy(hit.face.normal)
                .transformDirection(hit.object.matrixWorld)
                .normalize();

            if (this.directorGroundGuideHitNormal.lengthSq() < 0.000001) {
                continue;
            }

            const guide = this.ensureDirectorGroundGuide();
            this.directorGroundGuideOffsetPosition.copy(hit.point).addScaledVector(
                this.directorGroundGuideHitNormal,
                VRODOS_DIRECTOR_GROUND_GUIDE.surfaceOffset
            );
            this.directorGroundGuideRotation.setFromUnitVectors(
                this.directorGroundGuidePlaneNormal,
                this.directorGroundGuideHitNormal
            );

            guide.position.copy(this.directorGroundGuideOffsetPosition);
            guide.quaternion.copy(this.directorGroundGuideRotation);
            guide.visible = true;
            guide.updateMatrixWorld(true);
            return;
        }

        this.hideDirectorGroundGuide();
    }

    fitCameraToSceneLimits() {

        if (this.cameraOrbit.type === 'PerspectiveCamera') {

        } else if (this.cameraOrbit.type === 'OrthographicCamera') {

            this.ASPECT = this.vr_editor_main_div.clientWidth / this.vr_editor_main_div.clientHeight;
            this.cameraOrbit.left = this.FRUSTUM_SIZE * this.ASPECT / -2;
            this.cameraOrbit.right = this.FRUSTUM_SIZE * this.ASPECT / 2;
            this.cameraOrbit.zoom = VRODOS.utils.orthoFitZoom(this.FRUSTUM_SIZE, this.ASPECT, this.SCENE_DIMENSION_SURFACE);
        }

        if (this.is2d) {
            this.cameraOrbit.position.set(this.SCENE_CENTER_X, this.FRUSTUM_SIZE, this.SCENE_CENTER_Z);

        } else {
            this.cameraOrbit.position.set(
                this.SCENE_CENTER_X + this.FRUSTUM_SIZE,
                this.FRUSTUM_SIZE,
                this.SCENE_CENTER_Z + this.FRUSTUM_SIZE
            );
        }

        if (this.orbitControls) {
            this.orbitControls.target.set(this.SCENE_CENTER_X, this.SCENE_CENTER_Y, this.SCENE_CENTER_Z);
            this.orbitControls.update();
        }

        this.cameraOrbit.zoom = VRODOS.utils.clampNumber(
            this.cameraOrbit.zoom,
            VRODOS_EDITOR_ZOOM.min,
            VRODOS_EDITOR_ZOOM.max,
            VRODOS_EDITOR_ZOOM.fallback
        );
        this.cameraOrbit.updateProjectionMatrix();
    }
}

VRODOS.editor.Environmentals = vrodos_3d_editor_environmentals;
