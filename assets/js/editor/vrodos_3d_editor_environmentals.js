"use strict";

const VRODOS_EDITOR_CAMERA = VRODOS.editorRender.camera;
const VRODOS_EDITOR_SCENE_DEFAULTS = VRODOS.editorRender.sceneDefaults;
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
        this.directorVisualObject = null;
        this.directorHitProxy = null;
        this.directorInternalHelpers = new Set();
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

}

VRODOS.editorRender.installPerformanceProfileMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editorRender.installRendererLifecycleMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editorRender.installCameraMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editorRender.installDirectorHelperMethods(vrodos_3d_editor_environmentals.prototype);
VRODOS.editor.Environmentals = vrodos_3d_editor_environmentals;
