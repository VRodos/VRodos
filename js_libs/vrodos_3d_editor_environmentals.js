// noinspection DuplicatedCode

"use strict";
class vrodos_3d_editor_environmentals {

    constructor(vr_editor_main_div) {

        // animation
        this.animationMixers = [];
        this.clock = new THREE.Clock();
        this.flagPlayAnimation = true;

        // Composer is for the green outline effect when selecting objects
        this.isComposerOn = true;
        this.is2d = true;
        this.thirdPersonView = false;

        this.ctx = this;

        this.vr_editor_main_div = vr_editor_main_div;

        this.SCREEN_WIDTH = this.vr_editor_main_div.clientWidth; // 500; //window.innerWidth;
        this.SCREEN_HEIGHT = this.vr_editor_main_div.clientHeight; // 500; //window.innerHeight;
        this.VIEW_ANGLE = 60;

        this.ASPECT = this.SCREEN_WIDTH / this.SCREEN_HEIGHT;
        this.FRUSTUM_SIZE = 100000; // For orthographic camera only

        this.SCENE_DIMENSION_SURFACE = 100; // It is the max of x z dimensions of the scene (found when all objects are loaded)

        this.NEAR = 0.01;
        this.FAR = 200000; // keep the camera empty until everything is loaded

        // ------ Create Scene -------
        this.scene = new THREE.Scene();
        this.scene.name = "vrodosScene";

        // Add a background to the scene
        var rgbeloader = new THREE.RGBELoader();


        rgbeloader.setPath( '/wordpress/wp-content/plugins/vrodos/images/hdr/' )
            .load( 'quarry_01_1k.hdr', function ( texture ) {

                texture.mapping = THREE.EquirectangularReflectionMapping;

                //envir.scene.background = texture;
                envir.scene.environment = texture;

            } );


        this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 256 );
        this.cubeRenderTarget.texture.type = THREE.HalfFloatType;

        // REM HERE
        // Check envmap for every material
        this.cubeCamera = new THREE.CubeCamera( 1, 1000, this.cubeRenderTarget );

        // --- Add Grid to scene
        this.gridHelper = new THREE.GridHelper(2000, 40);
        this.gridHelper.name = "myGridHelper";
        this.scene.add(this.gridHelper);
        this.gridHelper.visible = false;

        // -- Add Axes helper
        this.axesHelper = new THREE.AxesHelper(100);
        this.axesHelper.name = "myAxisHelper";
        this.scene.add(this.axesHelper);
        this.setAxisText();
        this.axesHelper.visible = false;

        // -- Set Renderer ----
        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: false, logarithmicDepthBuffer: false});

        this.renderer.shadowMap.enabled = true;

        // BasicShadowMap gives unfiltered shadow maps - fastest, but lowest quality.
        // PCFShadowMap filters shadow maps using the Percentage-Closer Filtering (PCF) algorithm (default).
        // PCFSoftShadowMap filters shadow maps using the Percentage-Closer Filtering (PCF) algorithm with better soft shadows especially when using low-resolution shadow maps.
        // VSMShadowMap filters shadow maps using the Variance Shadow Map (VSM) algorithm. When using VSMShadowMap all shadow receivers will also cast shadows.
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.autoClear = false;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.5;



        // Label renderer for CSS2D renderer
        this.labelRenderer = new THREE.CSS2DRenderer();
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0';
        this.labelRenderer.domElement.style.fontSize = "25pt";
        this.labelRenderer.domElement.style.textShadow = "-1px -1px #000, 1px -1px #000, -1px 1px  #000, 1px 1px #000";
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        this.labelRenderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        this.renderer.sortObjects = true;
        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);


        // This works well for outlining objects in white background
        this.renderer.setClearColor(0xeeeeee, 1);

        // add the renderers to the canvas
        this.vr_editor_main_div.appendChild(this.renderer.domElement);
        this.vr_editor_main_div.appendChild(this.labelRenderer.domElement);

        //-------------------------
        this.setOrbitCamera();
        this.setAvatarCamera();

        // This is to make selected items glow
        this.setComposerAndPasses();

        // Resize handle
        window.addEventListener('resize', (event) => {this.turboResize();}, true);
    }


    // EffectComposer for 1) rendering; 2) Outline effect; 3) FXAA antializing
    setComposerAndPasses() {

        // Get current camera
        var curr_camera_input = avatarControlsEnabled ?
            (this.thirdPersonView ? this.cameraThirdPerson : this.cameraAvatar) : this.cameraOrbit;

        this.composer = new THREE.EffectComposer(this.renderer);

        this.renderPass = new THREE.RenderPass(this.scene, curr_camera_input);

        // Outline Pass
        this.outlinePass = [];
        this.outlinePass = new THREE.OutlinePass(
            new THREE.Vector2(this.SCREEN_WIDTH, this.SCREEN_HEIGHT), this.scene, curr_camera_input);
        this.outlinePass.visibleEdgeColor = new THREE.Color(0x00aa00);
        this.outlinePass.depthMaterial.morphTargets = true;
        this.outlinePass.prepareMaskMaterial.morphTargets = true;
        this.outlinePass.depthMaterial.skinning = true;
        this.outlinePass.prepareMaskMaterial.skinning = true;
        this.outlinePass.edgeGlow = 5;
        this.outlinePass.edgeStrength = 5;
        this.outlinePass.edgeThickness = 2;

        // FX Pass
        this.effectFXAA = [];
        this.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
        this.effectFXAA.uniforms['resolution'].value.set(1 / this.SCREEN_WIDTH, 1 / this.SCREEN_HEIGHT);
        this.effectFXAA.renderToScreen = true;

        this.turboResize();

        // Add to composer all passes
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.outlinePass);
        this.composer.addPass(this.effectFXAA);

        this.turboResize();
    }

    // Resize renderers
    turboResize() {

        this.SCREEN_WIDTH = this.vr_editor_main_div.clientWidth; // 500; //window.innerWidth;
        this.SCREEN_HEIGHT = this.vr_editor_main_div.clientHeight; // 500; //window.innerHeight;
        this.ASPECT = this.SCREEN_WIDTH / this.SCREEN_HEIGHT;

        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        this.renderer.setPixelRatio(this.ASPECT);

        this.labelRenderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        //----------------------------------------------

        this.updateCameraGivenSceneLimits();

        //----------------------------------------------------------------
        this.cameraAvatar.aspect = this.ASPECT;
        this.cameraAvatar.updateProjectionMatrix();

        this.cameraThirdPerson.aspect = this.ASPECT;
        this.cameraThirdPerson.updateProjectionMatrix();

        //---------------------------------------------------------------
        this.composer.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        this.composer.renderer.setPixelRatio(this.ASPECT);
        this.effectFXAA.uniforms['resolution'].value.set(1 / this.SCREEN_WIDTH / this.ASPECT, 1 / this.SCREEN_HEIGHT / this.ASPECT);
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
        //this.orbitControls.target.set( 0, 0, 0);
        this.orbitControls.object.zoom = 1;
        this.orbitControls.object.updateProjectionMatrix();
        this.orbitControls.name = "orbitControls";
        this.orbitControls.enableRotate = false;

        // Add a helper for debug purpose
        // this.cameraOrbitHelper = new THREE.CameraHelper( this.cameraOrbit );
        // this.scene.add( this.cameraOrbitHelper );
    }

    /**
     *  Set the Avatar camera
     */
    setAvatarCamera() {

        // Avatar camera is a Perspective camera
        this.cameraAvatar = new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.ASPECT, 0.01, 4000);
        this.cameraAvatar.name = "avatarCamera";
        this.cameraAvatar.rotation.y = Math.PI;

        this.audiolistener = new THREE.AudioListener();
        this.cameraAvatar.add(this.audiolistener);

        this.scene.add(this.cameraAvatar);

        // Avatar camera Controls is a PointerLockControls
        this.avatarControls = new THREE.PointerLockControls(this.cameraAvatar, this.renderer.domElement);
        this.avatarControls.name = "avatarControls";

        // Avatar Yaw controls
        var avatarControlsYawObject = this.avatarControls.getObject();
        this.initAvatarPosition = new THREE.Vector3(0, 0, 0);
        avatarControlsYawObject.position.set(this.initAvatarPosition.x, this.initAvatarPosition.y, this.initAvatarPosition.z);
        this.scene.add(avatarControlsYawObject);

        // Third person camera is a Perspective camera
        this.cameraThirdPerson = new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.ASPECT, 0.01, 3000);
        this.cameraThirdPerson.position.set(0, 4, 5);
        this.cameraThirdPerson.rotation.x = -0.2;
        this.cameraThirdPerson.name = "cameraThirdPerson";

        avatarControlsYawObject.add(this.cameraThirdPerson);

        // Add a helper for this camera
        //  this.cameraAvatarHelper = new THREE.CameraHelper( this.cameraAvatar );
        //  this.cameraAvatarHelper.name = "cameraAvatarHelper";
        //  this.scene.add( this.cameraAvatarHelper );
    }


    setCamMeshToAvatarControls() {
        var CamMesh = envir.scene.getObjectByName("Camera3Dmodel");
        CamMesh.rotation.set(0, Math.PI / 2, 0);
        this.avatarControls.getObject().add(CamMesh);
    }

    setSteveToAvatarControls() {
        var SteveOld = envir.scene.getObjectByName("SteveOld");
        SteveOld.rotation.set(0, Math.PI / 2, 0);
        this.avatarControls.getObject().add(SteveOld);
    }

    getSteveFrustum() {
        return envir.avatarControls.getObject();
    }

    setSteveWorldPosition(x, y, z, rx, ry) {
        envir.avatarControls.getObject().position.x = x;
        envir.avatarControls.getObject().position.y = y;
        envir.avatarControls.getObject().position.z = z;
        envir.avatarControls.getObject().children[0].rotation.x = rx;
        envir.avatarControls.getObject().rotation.y = ry;
    }

    //================= Static Environmentals ==============================

    /* X, Y ,Z letters  for axes */
    setAxisText() {
        var loader = new THREE.FontLoader();
        loader.scene = this.scene;
        // var pathn = window.location.pathname.replace(/[^/]*$/, '');
        // pathn = pathn.split('/').slice(0,-2).join('/');
        loader.load(siteurl + '/wp-content/plugins/VRodos/js_libs/threejs87/helvetiker_bold.typeface.json', this.loadtexts);
    }

    loadtexts(font) {

        for (let letterAx of ['X', 'Y', 'Z']) {
            for (var dist = 10; dist < 200; dist = dist + 10) {
                var textGeo = new THREE.TextGeometry(dist + " m", {
                    font: font,
                    size: 0.2,
                    // height: 50,
                    // curveSegments: 12,
                    // bevelThickness: 2,
                    // bevelSize: 5,
                    // bevelEnabled: true
                });
                var color = new THREE.Color();
                color.setRGB(letterAx == 'X' ? 255 : 0, letterAx == 'Y' ? 255 : 0, letterAx == 'Z' ? 255 : 0);
                var textMaterial = new THREE.MeshBasicMaterial({color: color});
                var text = new THREE.Mesh(textGeo, textMaterial);

                if (letterAx == 'X')
                    text.rotation.y = -Math.PI / 2;
                else if (letterAx == 'Y') {
                    text.rotation.x = Math.PI / 2;
                    text.rotation.z = Math.PI;
                } else if (letterAx == 'Z')
                    text.rotation.y = Math.PI;

                text.position.x = letterAx == 'X' ? dist : 0;
                text.position.y = letterAx == 'Y' ? dist : 0;
                text.position.z = letterAx == 'Z' ? dist : 0;
                text.scale.z = 0.001;
                text.name = "myAxisText" + letterAx;

                //window.envir.axesHelper.add(text);
            }
        }
    }




    updateCameraGivenSceneLimits() {

        if (this.cameraOrbit.type === 'PerspectiveCamera') {

        } else if (this.cameraOrbit.type === 'OrthographicCamera') {

            this.ASPECT = this.vr_editor_main_div.clientWidth / this.vr_editor_main_div.clientHeight;
            this.cameraOrbit.left = this.FRUSTUM_SIZE * this.ASPECT / -2;
            this.cameraOrbit.right = this.FRUSTUM_SIZE * this.ASPECT / 2;

            this.cameraOrbit.zoom = -1.5 * this.SCENE_DIMENSION_SURFACE + 2300;
        }

        if (this.is2d) {
            this.cameraOrbit.position.set(0, this.FRUSTUM_SIZE, 0);

            // this.cameraOrbit.rotation._x = - Math.PI/2;
            // this.cameraOrbit.rotation._y = 0;
            // this.cameraOrbit.rotation._z = 0;

            //this.cameraOrbit. orbitControls.object.quaternion = new THREE.Quaternion(0.707, 0 , 0, 0.707);

        } else {
            this.cameraOrbit.position.set(this.FRUSTUM_SIZE, this.FRUSTUM_SIZE, this.FRUSTUM_SIZE);
        }

        this.cameraOrbit.updateProjectionMatrix();
        //this.orbitControls.object.updateProjectionMatrix();
    }

    // setBackground() {
    //     //
    //     // console.log("1");
    //     // const loader = new THREE.CubeTextureLoader();
    //     // const texture = loader.load([
    //     //     'https://r105.threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/pos-x.jpg',
    //     //     'https://r105.threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/neg-x.jpg',
    //     //     'https://r105.threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/pos-y.jpg',
    //     //     'https://r105.threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/neg-y.jpg',
    //     //     'https://r105.threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/pos-z.jpg',
    //     //     'https://r105.threejsfundamentals.org/threejs/resources/images/cubemaps/computer-history-museum/neg-z.jpg',
    //     // ]);
    //     // this.scene.background = texture;
    //
    //     // Load envMap.
    //     var textureLoader = new THREE.TextureLoader();
    //     var envmap_texture = textureLoader.load(siteurl + '/wp-content/plugins/VRodos/images/hdr/venice_sunset_1k.hdr');
    //     // envmap_texture.mapping = THREE.EquirectangularReflectionMapping;
    //     // envmap_texture.encoding = THREE.sRGBEncoding;
    //
    //     this.scene.background = envmap_texture;
    // }
}
