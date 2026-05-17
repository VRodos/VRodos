"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.editorRender = VRODOS.editorRender || {};

(function initVrodosEditorEnvironmentBootstrap() {
    const cameraDefaults = VRODOS.editorRender.camera;
    const sceneDefaults = VRODOS.editorRender.sceneDefaults;

    function initializeEditorState() {
        this.animationMixers = [];
        this.clock = new THREE.Clock();
        this.flagPlayAnimation = true;

        this.selectableMeshes = new Set();
        this.selectableMeshesArray = [];
        this.selectableMeshesDirty = true;
        this.celOutlineMeshes = new Set();
        this.positionalAudioNodes = [];

        this.directorGroundGuideTargets = [];
        this.directorGroundGuideTargetCache = new WeakMap();
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

        this.is2d = false;
        this.thirdPersonView = false;
        this.isSceneLoading = false;
        this.ctx = this;
    }

    function initializeSceneMetrics() {
        this.updateScreenMetrics();
        this.VIEW_ANGLE = cameraDefaults.viewAngle;
        this.FRUSTUM_SIZE = cameraDefaults.frustumSize;

        this.SCENE_DIMENSION_SURFACE = sceneDefaults.surfaceDimension;
        this.SCENE_CENTER_X = sceneDefaults.centerX;
        this.SCENE_CENTER_Y = sceneDefaults.centerY;
        this.SCENE_CENTER_Z = sceneDefaults.centerZ;

        this.NEAR = cameraDefaults.near;
        this.FAR = cameraDefaults.far;
    }

    function initializeRenderers() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: false,
            logarithmicDepthBuffer: false
        });
        this.configureRenderer();
        this.bindRendererContextHandlers();

        this.labelRenderer = new THREE.CSS2DRenderer();
        this.configureLabelRenderer();
        this.labelRenderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
    }

    function attachRenderers() {
        this.vr_editor_main_div.appendChild(this.renderer.domElement);
        this.vr_editor_main_div.appendChild(this.labelRenderer.domElement);
    }

    function initializeEnvironment(vrEditorMainDiv) {
        this.vr_editor_main_div = vrEditorMainDiv;

        this.initializeEditorState();
        this.initializeSceneMetrics();
        this.initializeRenderers();
        this.createEditorScene();
        this.addEditorSceneHelpers();
        this.attachRenderers();
        this.setOrbitCamera();
        this.setAvatarCamera();
        this.applyEditorPerformanceProfile(true);
        this.bindResizeHandler();
    }

    VRODOS.editorRender.installEnvironmentBootstrapMethods = function(prototype) {
        if (!prototype) return;

        prototype.initializeEditorState = initializeEditorState;
        prototype.initializeSceneMetrics = initializeSceneMetrics;
        prototype.initializeRenderers = initializeRenderers;
        prototype.attachRenderers = attachRenderers;
        prototype.initializeEnvironment = initializeEnvironment;
    };
})();
