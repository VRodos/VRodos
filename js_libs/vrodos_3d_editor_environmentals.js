"use strict";
class vrodos_3d_editor_environmentals {

    constructor(container_3D_all){

        // Composer is for the green outline effect when selecting objects
        this.isComposerOn = true;

        // animation
        this.animationMixers = [];
        this.clock = new THREE.Clock();
        this.flagPlayAnimation = true;


        this.is2d = true;
        this.isDebug = false; // Debug mode

        this.thirdPersonView = false;

        this.ctx = this;

        this.container_3D_all = container_3D_all;

        this.SCREEN_WIDTH = this.container_3D_all.clientWidth; // 500; //window.innerWidth;
        this.SCREEN_HEIGHT = this.container_3D_all.clientHeight; // 500; //window.innerHeight;
        this.VIEW_ANGLE = 60;

        this.ASPECT = this.SCREEN_WIDTH / this.SCREEN_HEIGHT;
        this.FRUSTUM_SIZE = 100000; // For orthographic camera only
        //this.FRUSTUM_SIZE = this.SCENE_DIMENSION_SURFACE;

        // this.cameraOrbit.top    = this.FRUSTUM_SIZE / 2 * 1; // *0.8 shift it a little bit to the top
        // this.cameraOrbit.bottom = this.FRUSTUM_SIZE/ -2 * 1; // *1.2 shift it a little bit to the top
        // this.cameraOrbit.far    = 20000;


        this.SCENE_DIMENSION_SURFACE = 100; // It is the max of x z dimensions of the scene (found when all objects are loaded)

        this.NEAR = 0.01;
        this.FAR = 200000; // keep the camera empty until everything is loaded

        this.setScene();
        this.setRenderer();
        this.setOrbitCamera();
        this.setAvatarCamera();

        //this.setRecycleBin();

        //this.setArtificialFloor();
        // if (window.isAnyLight) {
        //     this.setLight();
        // }

//         this.setStats();
        this.setSky();
        this.setSunSphere();

        // This is to make selected items glow
        this.setComposer();



        // Toggle UIs to clear out vision
        jQuery('#toggleUIBtn').click(function() {
            var btn = jQuery('#toggleUIBtn');
            var icon = jQuery('#toggleUIBtn i');

            jQuery("#hierarchy-toggle-btn").click();
            jQuery("#bt_close_file_toolbar").click();
            jQuery("#scenesList-toggle-btn").click();

            if (btn.data('toggle') === 'on') {

                // Hide
                btn.addClass('mdc-theme--text-hint-on-light');
                btn.removeClass('mdc-theme--secondary');
                icon.html('<i class="material-icons">visibility_off</i>');
                btn.data('toggle', 'off');

                jQuery(".hidable").hide();  // Lights bar

                envir.isComposerOn = false;
                transform_controls.visible  = false;
                envir.getSteveFrustum().visible = false;


                envir.setVisiblityLightHelpingElements(false);

                jQuery("#wpadminbar").hide();

                // footer that is high up below admin bar
                jQuery("#colophon").hide();

                jQuery("#vr_editor_main_div")[0].style.top = 0;

                jQuery('#cookie-law-info-again').hide();
            } else {
                // Show
                btn.removeClass('mdc-theme--text-hint-on-light');
                btn.addClass('mdc-theme--secondary');
                icon.html('<i class="material-icons">visibility</i>');
                btn.data('toggle', 'on');

                jQuery(".hidable").show(); // Lights bar
                envir.isComposerOn = true;
                transform_controls.visible  = true;

                envir.setVisiblityLightHelpingElements(true);

                // wp admin bar show
                jQuery("#wpadminbar").show();

                // footer that is high up below admin bar
                jQuery("#colophon").show();

                jQuery("#vr_editor_main_div")[0].style.top = "60px";
                // if in 3rd person view then show the cameraobject
                //envir.getSteveFrustum().visible = true;

                if (envir.thirdPersonView || avatarControlsEnabled)
                    envir.getSteveFrustum().visible = false;
                else
                    envir.getSteveFrustum().visible = true; // envir.thirdPersonView && avatarControlsEnabled;

            }


            envir.turboResize();
        });


        // this.setTerrain(); // test after 74

        // Window resize event (container was added)
        //THREEx.WindowResize( this.renderer, this.cameraOrbit, this.container_3D_all);
        //THREEx.WindowResize( this.renderer, this.cameraAvatar, this.container_3D_all);

        // renderer.setSize( dom.clientWidth, dom.clientHeight );
        // // update the camera
        // camera.aspect	= dom.clientWidth/ dom.clientHeight;
        // camera.updateProjectionMatrix();

        var cols = document.querySelectorAll('.lightcolumns .lightcolumn');
        var currthis = this;
        [].forEach.call(cols, function(col) {
            col.addEventListener('dragstart', currthis.handleLightDragStart, false);
            //col.addEventListener('dragenter', currthis.handleLightDragEnter, false)
            //col.addEventListener('dragover', currthis.handleLightDragOver, false);
            //col.addEventListener('dragleave', currthis.handleLightDragLeave, false);
            //col.addEventListener('drop', currthis.handleLightDrop, false);
            //col.addEventListener('dragend', currthis.handleLightDragEnd, false);
        });

        // Resize handle
        window.addEventListener('resize', this.resize_handler, true);
    }

    handleLightDragStart(e) {

        // lightSun or lightLamp or lightSpot
        var dragData = { "categoryName": "light"+e.target.dataset.light, "title": "mylight" +
                e.target.dataset.light + "_"  + Math.floor(Date.now() / 1000) };

        var jsonDataDrag = JSON.stringify(dragData);
        e.dataTransfer.setData("text/plain", jsonDataDrag);
        //this.style.opacity = '0.7';  // this / e.target is the source node.

        return false;
    }

    setVisiblityLightHelpingElements(statusVisibility){

        for (var i=0; i < envir.scene.children.length; i++){
            var curr_obj = envir.scene.children[i];

            if (curr_obj.categoryName === 'lightHelper' || curr_obj.categoryName === 'lightTargetSpot' )
                curr_obj.visible = statusVisibility;

            if (curr_obj.categoryName === 'lightSun')
                curr_obj.children[0].visible = statusVisibility;

            if (curr_obj.categoryName === 'lightLamp')
                curr_obj.children[0].visible = statusVisibility;

            if (curr_obj.categoryName === 'lightSpot')
                curr_obj.children[0].visible = statusVisibility;

            if (curr_obj.type === 'CameraHelper') // This is the shadow camera of sun
                curr_obj.visible = statusVisibility;

        }
    }


    turboResize(){
        this.SCREEN_WIDTH = this.container_3D_all.clientWidth; // 500; //window.innerWidth;
        this.SCREEN_HEIGHT = this.container_3D_all.clientHeight; // 500; //window.innerHeight;

        this.ASPECT_NEW_RATIO = (this.SCREEN_WIDTH/this.SCREEN_HEIGHT) / this.ASPECT ;

        this.ASPECT = this.SCREEN_WIDTH/this.SCREEN_HEIGHT;


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

    resize_handler(ev){

        envir.turboResize();
    }

    makeFullScreen() {

        this.container_3D_all.style.position = 'fixed';
        this.container_3D_all.style.width = '100%';
        this.container_3D_all.style.height = '100%';
        this.container_3D_all.style.overflow = 'hidden';
        this.container_3D_all.style.zIndex = '9999';
        this.container_3D_all.style.top = '0';
        this.container_3D_all.style.left = '0';
        this.container_3D_all.style.right = '0';
        this.container_3D_all.style.bottom = '0';

        jQuery("#fullScreenBtn").html('Exit Full Screen');

        jQuery("body#header").css("display", "none" );


        if (document.getElementById('wpadminbar')) {
            document.getElementById('wpadminbar').style.zIndex = 0;
        }

        if (document.getElementById('adminmenuback')) {
            document.getElementById('adminmenuback').style.zIndex = 0;
        }

        if (document.getElementById('adminmenuwrap')) {
            document.getElementById('adminmenuwrap').style.zIndex = 0;
        }

        if (document.getElementById('wpfooter')) {
            document.getElementById('wpfooter').style.display='none';
        }

        if (document.getElementById('postcustom')) {
            document.getElementById('postcustom').style.display='none';
        }

        if (document.getElementById('postdivrich')) {
            document.getElementById('postdivrich').style.display='none';
        }

        envir.turboResize();
    }

    makeWindowedScreen(){

        this.container_3D_all.style.position = 'relative';
        this.container_3D_all.style.width = '99%';
        this.container_3D_all.style.height = '600px';
        //this.container_3D_all.style.overflow = 'auto';
        this.container_3D_all.style.height = envir.container_3D_all.clientWidth * 2 / 3 + 'px';
        this.container_3D_all.style.zIndex = '999';

        jQuery("#fullScreenBtn").html('Full Screen');

        jQuery("body#header").css("display", "block" );

        if (document.getElementById('wpadminbar')) {
            document.getElementById('wpadminbar').style.zIndex = 9999;
        }
        if (document.getElementById('adminmenuback')) {
            document.getElementById('adminmenuback').style.zIndex = 9999;
        }
        if (document.getElementById('adminmenuwrap')) {
            document.getElementById('adminmenuwrap').style.zIndex = 9999;
        }
        if (document.getElementById('wpfooter')) {
            document.getElementById('wpfooter').style.display = 'block';
        }
        if (document.getElementById('postcustom')) {
            document.getElementById('postcustom').style.display = 'block';
        }
        if (document.getElementById('postdivrich')) {
            document.getElementById('postdivrich').style.display = '';
        }

        envir.turboResize();
    }

    /**
     Set the Orbit Camera
     */
    setOrbitCamera() {

        // Do not set orthographicCamera near plane to negative values (it affects badly raycasting)
        // Try to configure orthographicCamera based on game type
        this.cameraOrbit =
            new THREE.OrthographicCamera( this.FRUSTUM_SIZE * this.ASPECT / - 2,
                                                          this.FRUSTUM_SIZE * this.ASPECT /   2,
                                                          this.FRUSTUM_SIZE /   2,
                                                          this.FRUSTUM_SIZE / - 2, 0, this.FAR);

        //     new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.ASPECT, this.NEAR, this.FAR);

        this.cameraOrbit.name = "orbitCamera";
        this.scene.add(this.cameraOrbit);

        // Cold start values
        this.cameraOrbit.position.set( 0, this.FRUSTUM_SIZE, 0);

        this.orbitControls = new THREE.OrbitControls( this.cameraOrbit, this.renderer.domElement );
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
     *
     */
    setAvatarCamera() {

        this.cameraAvatar = new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.ASPECT, 0.01, 4000);
        this.cameraAvatar.name = "avatarCamera";
        this.cameraAvatar.rotation.y = Math.PI;

        this.audiolistener = new THREE.AudioListener();
        this.cameraAvatar.add(this.audiolistener);


        this.scene.add(this.cameraAvatar);

        this.avatarControls = new THREE.PointerLockControls( this.cameraAvatar, this.renderer.domElement );
        this.avatarControls.name = "avatarControls";

        this.initAvatarPosition = new THREE.Vector3( 0, 0, 0);

        var avatarControlsYawObject = this.avatarControls.getObject();

        avatarControlsYawObject.position.set(this.initAvatarPosition.x, this.initAvatarPosition.y, this.initAvatarPosition.z);

        this.scene.add(avatarControlsYawObject);

        this.cameraThirdPerson = new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.ASPECT, 0.01, 3000);
        this.cameraThirdPerson.position.set(0, 4, 5);
        this.cameraThirdPerson.rotation.x = -0.2;
        this.cameraThirdPerson.name = "cameraThirdPerson";

        avatarControlsYawObject.add(this.cameraThirdPerson);

        //this.orbitControls.target =  avatarControlsYawObject.position; //new THREE.Vector3(0,0,0) ;//

        // Add a helper for this camera
        //  this.cameraAvatarHelper = new THREE.CameraHelper( this.cameraAvatar );
        //  this.cameraAvatarHelper.name = "cameraAvatarHelper";
        //  this.scene.add( this.cameraAvatarHelper );
    }

    setSteveToAvatarControls(){
        var Steve = envir.scene.getObjectByName("Camera3Dmodel");
        Steve.rotation.set(0, Math.PI/2, 0);
        this.avatarControls.getObject().add(Steve );
    }

    setSteveOldToAvatarControls(){
        var SteveOld = envir.scene.getObjectByName("SteveOld");
        SteveOld.rotation.set(0, Math.PI/2, 0);
        this.avatarControls.getObject().add(SteveOld );
    }


    getSteveWorldPosition(){
        return envir.avatarControls.getObject().position;
    }

    getSteveFrustum(){
        return envir.avatarControls.getObject();
    }

    setSteveWorldPosition(x,y,z,rx,ry){
        envir.avatarControls.getObject().position.x = x;
        envir.avatarControls.getObject().position.y = y;
        envir.avatarControls.getObject().position.z = z;


        envir.avatarControls.getObject().children[0].rotation.x = rx;
        envir.avatarControls.getObject().rotation.y = ry;

    }

    //================= Static Environmentals ==============================

    /**
     Set the scene
     */
    setScene() {
        this.scene = new THREE.Scene();
        this.scene.name = "digiartScene";


        // // Add Grid
        this.gridHelper = new THREE.GridHelper(2000, 40);
        this.gridHelper.name = "myGridHelper";
        this.scene.add(this.gridHelper);
        this.gridHelper.visible = false;

        // // Add Axes helper
        this.axesHelper = new THREE.AxesHelper( 100 );
        this.axesHelper.name = "myAxisHelper";
        this.scene.add(this.axesHelper);
        this.setAxisText();
        this.axesHelper.visible = false;
    }

    /*
 X, Y ,Z letters
 */
    setAxisText(){
        var loader = new THREE.FontLoader();
        loader.scene = this.scene;

        var pathn = window.location.pathname.replace(/[^/]*$/, '');
        pathn = pathn.replace('/vrodos-edit-3d-scene-page/','');

        loader.load(pathn + '/wp-content/plugins/vrodos/js_libs/threejs87/helvetiker_bold.typeface.json', this.loadtexts );
    }


    loadtexts(font){

            for (let letterAx of ['X','Y','Z']) {

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
                        text.rotation.y = - Math.PI / 2;
                    else if (letterAx == 'Y') {
                        text.rotation.x = Math.PI / 2;
                        text.rotation.z = Math.PI;
                    }else if (letterAx == 'Z')
                        text.rotation.y =  Math.PI;

                    text.position.x = letterAx == 'X' ? dist : 0;
                    text.position.y = letterAx == 'Y' ? dist : 0;
                    text.position.z = letterAx == 'Z' ? dist : 0;
                    text.scale.z = 0.001;
                    text.name = "myAxisText" + letterAx;

                    //window.envir.axesHelper.add(text);
                }
            }
    }


    /**
     Set the renderer
     */
    setRenderer() {

        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: false, logarithmicDepthBuffer: false});

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.autoClear = false;




        this.labelRenderer = new THREE.CSS2DRenderer();
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0';
        this.labelRenderer.domElement.style.fontSize = "25pt";

        this.labelRenderer.domElement.style.textShadow = "-1px -1px #000, 1px -1px #000, -1px 1px  #000, 1px 1px #000";
        this.labelRenderer.domElement.style.pointerEvents = 'none';

        this.labelRenderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        this.renderer.sortObjects = true;
        //this.renderer.setPixelRatio(this.ASPECT); //window.devicePixelRatio);
        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        // This does  work well for outlining objects in white background
        this.renderer.setClearColor( 0xeeeeee, 1);

            // This don't
        //this.scene.background = new THREE.Color( 0xffffff );

        this.renderer.sortObjects = true;
        this.renderer.name = "myRenderer";
        this.container_3D_all.appendChild( this.renderer.domElement );

        this.container_3D_all.appendChild(this.labelRenderer.domElement);
    }

    // Glowing effect on Orbit mode
    setComposer(){

        // Get current camera
        var curr_camera_input = avatarControlsEnabled ?
                    (this.thirdPersonView ? this.cameraThirdPerson : this.cameraAvatar) : this.cameraOrbit;

        this.composer = new THREE.EffectComposer( this.renderer );

        // Render Pass
        this.renderPass = new THREE.RenderPass( this.scene, curr_camera_input );

        // Outline Pass
        this.outlinePass = [];
        this.outlinePass = new THREE.OutlinePass(
            new THREE.Vector2(this.SCREEN_WIDTH, this.SCREEN_HEIGHT), this.scene, curr_camera_input);

        this.outlinePass.visibleEdgeColor = new THREE.Color( 0x00aa00 );

        this.outlinePass.depthMaterial.morphTargets = true;
        this.outlinePass.prepareMaskMaterial.morphTargets = true;

        this.outlinePass.depthMaterial.skinning = true;
        this.outlinePass.prepareMaskMaterial.skinning = true;

        // outlinePass.depthMaterial.skinning = true;
        // outlinePass.prepareMaskMaterial.skinning = true;

        this.outlinePass.edgeGlow = 5;
        this.outlinePass.edgeStrength = 5;
        this.outlinePass.edgeThickness = 2;

        // FX Pass
        this.effectFXAA = [];
        this.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
        this.effectFXAA.uniforms['resolution'].value.set(1 / this.SCREEN_WIDTH, 1 / this.SCREEN_HEIGHT );
        this.effectFXAA.renderToScreen = true;

        this.turboResize();

        // Add to composer all passes
        this.composer.addPass( this.renderPass );
        this.composer.addPass( this.outlinePass );
        this.composer.addPass( this.effectFXAA );

        this.turboResize();
    }



    addInHierarchyViewer(obj){

        // ALL but the lightTargetSpot
        if (obj.categoryName!='lightTargetSpot') {

            // ADD in the Hierarchy viewer
            var deleteButtonHTML =
                '<a href="javascript:void(0);" class="hierarchyItemDelete mdc-list-item" aria-label="Delete asset"' +
                ' title="Delete asset object" onclick="' +
                // Delete object from scene and remove it from the hierarchy viewer
                'deleterFomScene(\'' + obj.name + '\');'
                + '">' +
                '<i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Delete">delete </i>' +
                '</a>';

            var game_object_nameA_assetName = obj.name.substring(0, obj.name.length - 11);
            var game_object_nameB_dateCreated = this.unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));

            // Add as a list item
            jQuery('#hierarchy-viewer').append(
                '<li class="hierarchyItem mdc-list-item" id="' + obj.name + '">' +
                '<a href="javascript:void(0);" class="hierarchyItemName mdc-list-item"  ' +
                'data-mdc-auto-init="MDCRipple" title="" onclick="onMouseDoubleClickFocus(event,\'' + obj.name + '\')">' +
                '<span id="" class="mdc-list-item__text">' +
                game_object_nameA_assetName + '<br />' +
                '<span style="font-size:7pt; color:grey">' + game_object_nameB_dateCreated + '</span>' +
                '</span>' +
                '</a>' +
                deleteButtonHTML +
                '</li>'
            );
        } else {
            // lightTargetSpot

            // lightTargetSpot without the timestamp
            var game_object_nameA_assetName = obj.name.substring(0, obj.name.length-11); //.substring(0, obj.name.length - 11);

            // The timestamp
            var game_object_nameB_dateCreated = this.unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));

            // Add as a list item
            jQuery('#hierarchy-viewer').append(
                '<li class="hierarchyItem mdc-list-item" id="' + obj.name + '">' +
                '<a href="javascript:void(0);" class="hierarchyItemName mdc-list-item"  ' +
                'data-mdc-auto-init="MDCRipple" title="" onclick="onMouseDoubleClickFocus(event,\'' + obj.name + '\')">' +
                '<span id="" class="mdc-list-item__text">' +
                game_object_nameA_assetName + '<br />' +
                '<span style="font-size:7pt; color:grey">' + game_object_nameB_dateCreated + '</span>' +
                '</span>' +
                '</a>' +
                '' +
                '</li>'
            );


        }
    }

    setBackgroundColorHierarchyViewer(name){

        jQuery('#hierarchy-viewer li').each (
            function(idx, li) {
                jQuery(li)[0].style.background = 'rgb(244,244,244)';
            }
        );

        jQuery('#hierarchy-viewer').find('#' + name )[0].style.background = '#a4addf';
    }


    setHierarchyViewer(){


        jQuery('#hierarchy-viewer').empty();

        this.scene.traverse(function(obj) {



            if(obj.isDigiArt3DModel || obj.name === "avatarYawObject") {

                // Make the html for the delete button Avatar should not be deleted
                var deleteButtonHTML =  '';
                var resetButtonHTML =  '';

                // Normal assets (Non avatar, nor Sun)
                if (obj.name != 'avatarYawObject' && obj.categoryName!='lightSun') {

                    var deleteButtonHTML =
                        '<a href="javascript:void(0);" class="mdc-list-item" aria-label="Delete asset"' +
                        ' title="Delete asset object" onclick="' +
                        // Delete object from scene and remove it from the hierarchy viewer
                        'deleterFomScene(\'' + obj.name + '\');'
                        + '">' +
                        '<i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Delete">delete </i>' +
                        '</a>';

                    // Split the object name into 2 parts: The first part is the asset name and the second the date inserted in the scene
                    var game_object_nameA_assetName = obj.name.substring(0, obj.name.length - 11);

                    var game_object_nameB_dateCreated = envir.unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));


                } else if (obj.categoryName ==='lightSun'){
                    // SUN

                    var deleteButtonHTML =
                        '<a href="javascript:void(0);" class="mdc-list-item" aria-label="Delete asset"' +
                        ' title="Delete asset object" onclick="' +
                        // Delete object from scene and remove it from the hierarchy viewer
                        'deleterFomScene(\'' + obj.name + '\');'
                        + '">' +
                        '<i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Delete">delete </i>' +
                        '</a>';

                    var game_object_nameA_assetName = obj.name.substring(0, obj.name.length - 11);



                    var game_object_nameB_dateCreated = envir.unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));

                    // Add lightTargetSpot
                    // Add as a list item
                    jQuery('#hierarchy-viewer').append(
                        '<li class="mdc-list-item" id="'+ "lightTargetSpot_" + obj.name  + '">' +
                        '<a href="javascript:void(0);" class="mdc-list-item" style="font-size: 9pt; line-height:12pt" '+
                        'data-mdc-auto-init="MDCRipple" title="" onclick="onMouseDoubleClickFocus(event,\'' + "lightTargetSpot_" + obj.name + '\')">'+
                        '<span id="" class="mdc-list-item__text">' +
                        'lightTargetSpot_' + game_object_nameA_assetName + '<br />' +
                        '<span style="font-size:7pt; color:grey">' + game_object_nameB_dateCreated + '</span>' +
                        '</span>'+
                        '</a>' +
                        '</li>');


                } else if(obj.name === 'avatarYawObject'){
                    // AVATAR

                    resetButtonHTML =
                        '<a href="javascript:void(0);" class="mdc-list-item" aria-label="Reset asset"' +
                        ' title="Reset asset object" onclick="' +
                        // Reset 0,0,0 rot 0,0,0
                        'resetInScene(\'' + obj.name + '\');'
                        + '">' +
                        '<i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Reset">cached </i>' +
                        '</a>';

                    var game_object_nameA_assetName = "Player";
                    var game_object_nameB_dateCreated = "";
                }



                // Add as a list item
                jQuery('#hierarchy-viewer').append(
                    '<li class="mdc-list-item" id="'+ obj.name  + '">' +
                    '<a href="javascript:void(0);" class="mdc-list-item" style="font-size: 9pt; line-height:12pt" '+
                    'data-mdc-auto-init="MDCRipple" title="" onclick="onMouseDoubleClickFocus(event,\'' + obj.name + '\')">'+
                    '<span id="" class="mdc-list-item__text">' +
                    game_object_nameA_assetName + '<br />' +
                    '<span style="font-size:7pt; color:grey">' + game_object_nameB_dateCreated + '</span>' +
                    '</span>'+
                    '</a>' +
                    deleteButtonHTML +
                    resetButtonHTML +
                    '</li>');
            }
        });

    }

    updateCameraGivenSceneLimits(){



        if(this.cameraOrbit.type === 'PerspectiveCamera') {

        } else if(this.cameraOrbit.type  === 'OrthographicCamera') {

            this.ASPECT = this.container_3D_all.clientWidth / this.container_3D_all.clientHeight;
            this.cameraOrbit.left   = this.FRUSTUM_SIZE * this.ASPECT / -2;
            this.cameraOrbit.right  = this.FRUSTUM_SIZE * this.ASPECT /  2;

            this.cameraOrbit.zoom = -1.5 * this.SCENE_DIMENSION_SURFACE + 2300;


        }

        if(this.is2d){
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



    unixTimestamp_to_time( tStr){

        var unix_timestamp = parseInt(tStr);

        var date = new Date(unix_timestamp*1000);
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();
        var seconds = "0" + date.getSeconds();
        var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

        return date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear() + ' ' + formattedTime;
    }







    /**
     Set the Light
     */
    // setLight() {
    //
    //     this.lightSun = new THREE.DirectionalLight( 0xffffff, 5 ); //  new THREE.PointLight( 0xC0C090, 0.4, 1000, 0.01 );
    //     this.lightSun.position.set( 0, 5, 0 );
    //     this.lightSun.target.position.set(0, 0, 5); // where it points
    //     this.lightSun.name = "mylightSun_1590660685";
    //     this.lightSun.isDigiArt3DModel = true;
    //     this.lightSun.isLight = true;
    //
    //     //// Add Sun Helper
    //     var sunSphere = new THREE.Mesh(
    //         new THREE.SphereBufferGeometry( 1, 16, 8 ),
    //         new THREE.MeshBasicMaterial( { color: 0xffff00 } )
    //     );
    //     sunSphere.isDigiArt3DMesh = true;
    //     sunSphere.name = "SunSphere";
    //     this.lightSun.add(sunSphere);
    //     // end of sphere
    //
    //     //this.lightSunHelper = new THREE.DirectionalLightHelper( this.lightSun, 5, 0x555500);
    //
    //     this.scene.add(this.lightSun);
    //     //this.scene.add(this.lightSun.target);
    //     //this.scene.add(this.lightSunHelper ); // new THREE.PointLightHelper( this.lightSun, 1 ));
    //
    //
    //     this.lightSun.target.updateMatrixWorld();
    //     //this.lightSunHelper.update();
    //
    //
    //
    //     setTimeout(function(){ envir.addInHierarchyViewer(envir.lightSun); }, 10000);
    //
    //     //
    //     //this.sunSphere.position.y = - 700000;
    //     //this.sunSphere.visible = false;
    //     //this.scene.add( this.sunSphere );
    //
    //
    //
    //
    //
    //
    // }



    // handleLightDragOver(e) {
    //     console.log('handleLightDragOver');
    //     if (e.preventDefault) {
    //         e.preventDefault(); // Necessary. Allows us to drop.
    //     }
    //     e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
    //     return false;
    // }
    //
    // handleLightDragEnter(e) {
    //     console.log('handleLightDragEnter');
    //     // this / e.target is the current hover target.
    //     this.classList.add('over');
    // }
    //
    // handleLightDragLeave(e) {
    //     console.log('handleLightDragLeave');
    //     this.classList.remove('over');  // this / e.target is previous target element.
    // }
    //
    // // handleLightDrop(e) {
    // //     // this / e.target is current target element.
    // //     console.log('handleLightDrop');
    // //
    // //     e.preventDefault();
    // //
    // //     return false;
    // // }
    //
    // handleLightDragEnd(e) {
    // //     // this/e.target is the source node.
    // //     [].forEach.call(cols, function (col) {
    // //         col.classList.remove('over');
    // //     });
    // }




    /**
     Set the stats
     */
    // setStats() {
    //     // // Rendering stats (FPS)
    //     this.stats = new Stats();
    //     this.stats.name = "myStats";
    //     this.stats.domElement.style.position = 'absolute';
    //     this.stats.domElement.style.bottom = '35px';
    //     this.stats.domElement.style.left = '10px';
    //     this.stats.domElement.style.zIndex = 100;
    //
    //     this.container_3D_all.appendChild( this.stats.domElement );
    // }


    setSky(){

        //// Add Sky Mesh
        //this.sky = new THREE.Sky();
        //this.scene.add( this.sky.mesh );
        //
        //var uniforms = this.sky.uniforms;
        //uniforms.turbidity.value = 10;
        //uniforms.reileigh.value = 2;
        //uniforms.luminance.value = 1;
        //uniforms.mieCoefficient.value = 0.005;
        //uniforms.mieDirectionalG.value = 0.8;
    }


    setSunSphere(){

        //// Add Sun Helper
        //this.sunSphere = new THREE.Mesh(
        //    new THREE.SphereBufferGeometry( 20000, 16, 8 ),
        //    new THREE.MeshBasicMaterial( { color: 0xffffff } )
        //);
        //
        //this.sunSphere.position.y = - 700000;
        //this.sunSphere.visible = false;
        //this.scene.add( this.sunSphere );
        //
        //var inclination = 0.49;
        //var azimuth = 0.25;
        //var sun = true;
        //var distance = 400000;
        //
        //var theta = Math.PI * ( inclination - 0.5 );
        //var phi = 2 * Math.PI * (azimuth - 0.5 );
        //
        //this.sunSphere.position.x = distance * Math.cos( phi );
        //this.sunSphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
        //this.sunSphere.position.z = distance * Math.sin( phi ) * Math.cos( theta );
        //
        //this.sunSphere.visible = sun;
        //
        //this.sky.uniforms.sunPosition.value.copy( this.sunSphere.position );

    }




}
