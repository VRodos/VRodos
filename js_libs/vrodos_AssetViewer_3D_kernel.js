/* 3D viewer for all types of files in assetEditor */
class VRodos_AssetViewer_3D_kernel {

    // asset_viewer_3d_kernel.scene.children :
    // 0: root (pdb, audio, fbx, GLB, OBJ)
    // 1,2,3,4: Directional light 1,2,3, 4: Ambient light

    // PDB is the same loader for url and client side
    // OBJ, FBX, and GLB call first an xhr loader in editor_scripts.js and then the streaming version here


    // noinspection DuplicatedCode
    setZeroVars() {
        this.nObj = 0;
        this.nFbx = 0;
        this.nMtl = 0;
        this.nJpg = 0;
        this.nPng = 0;
        this.nPdb = 0;
        this.nGif = 0;
        this.nGlb = 0;
        this.FbxBuffer = '';
        this.texturesBuffer = [];
    }

    constructor(canvasToBindTo,
                canvasLabelsToBindTo,
                animationButton,
                previewProgressLabel,
                previewProgressLine,
                back_3d_color, audioElement,
                pathUrl = null, mtlFilename = null,
                objFilename= null, pdbFileContent = null,
                fbxFilename = null, glbFilename = null,
                textures_fbx_string_connected = null,
                statsSwitch = true,
                isBackGroundNull = false,
                lockTranslation = false,
                enableZoom = true,
                assettrs = '0,0,0,0,0,0,0,0,-100', boundingSphereButton = null) {




        //console.log(pathUrl, fbxFilename + " t:" + textures_fbx_string_connected );

        this.statsSwitch = statsSwitch;

        this.canvasToBindTo= canvasToBindTo;
        this.animationButton = animationButton;
        this.boundingSphereButton = boundingSphereButton;
        this.canvasLabelsToBindTo = canvasLabelsToBindTo;
        this.previewProgressLabel = previewProgressLabel;
        this.previewProgressLine = previewProgressLine;

        this.setZeroVars()
        this.back_3d_color = back_3d_color;

        this.isBackGroundNull = isBackGroundNull;

        this.FbxBuffer = '';
        this.GlbBuffer = '';

        this.path_url = null;
        this.mtl_file_name = this.obj_file_name = this.pdb_file_name = this.fbx_file_name = this.glb_file_name;

        this.assettrs = assettrs.split(',');
        this.scene = new THREE.Scene();

        if (this.statsSwitch) {
            this.stats = new Stats();
            document.getElementById('wrapper_3d_inner').appendChild(this.stats.dom);
            this.stats.dom.style.removeProperty("left");
        }

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvasToBindTo,
            antialias: true,
            logarithmicDepthBuffer: true,
            alpha: true
        });

        //this.renderer.setClearAlpha(1);
        this.renderer.setClearColor(0x000000,0);


        this.renderer.domElement.addEventListener("click", onclick, true);
        let selectedObject;


        let scope = this;
        function onclick(event) {
            let mouse = new THREE.Vector2();

            mouse.x =   ( (event.clientX - scope.canvasToBindTo.getBoundingClientRect().left) /
                scope.canvasToBindTo.clientWidth ) * 2 - 1;
            mouse.y = - ( (event.clientY - scope.canvasToBindTo.getBoundingClientRect().top ) /
                scope.canvasToBindTo.clientHeight ) * 2 + 1;

            let raycaster = new THREE.Raycaster();

            raycaster.setFromCamera(mouse, scope.camera);

            let intersects = raycaster.intersectObjects(scope.scene.children[0].children, true); //array

            //scope.raylineShow(raycaster);

            if (intersects.length > 0) {
                selectedObject = intersects[0];
                if ( scope.mixers.length > 0 ) {
                    scope.playStopAnimation();
                }
            }
        }


        this.camera = null;
        this.listener = null;

        this.audioElement = audioElement;

        this.aspectRatio = 1;
        this.recalcAspectRatio();




        let cameraPosX = this.assettrs[6];
        let cameraPosY = this.assettrs[7];
        let cameraPosZ = this.assettrs[8];



        this.cameraDefaults = {
            posCamera: new THREE.Vector3(cameraPosX, cameraPosY, cameraPosZ),
            posCameraTarget: new THREE.Vector3(0, 0, 0),
            near: 0.01,
            far: 10000,
            fov: 45
        };

        // Set up camera
        this.camera = new THREE.PerspectiveCamera(this.cameraDefaults.fov,
            this.aspectRatio, this.cameraDefaults.near, this.cameraDefaults.far);

        this.cameraTarget = this.cameraDefaults.posCameraTarget;

        // Trackball or OrbitControls controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);





        //this.scene.add(new THREE.AxisHelper(5,5,5));

        this.controls.zoomSpeed = 1.02;
        //this.controls.dynamicDampingFactor = 0.3;
        //this.controls.dynamicDampingFactor = 0;
        //this.controls.staticMoving = true;

        this.controls.enablePan = !lockTranslation;
        this.controls.enableZoom = enableZoom;

        // this.updateTRSfields();
        // this.controls.addEventListener('change', this.updateTRSfields);

        // For the animation
        this.clock = new THREE.Clock();
        this.mixers = [];

        // Scene.children[0] is root: Here all chemistry 3D and 2D labels items are stored
        let root = new THREE.Group();
        root.name = "root";
        this.scene.add( root );


        // const size = 10;
        // const divisions = 10;
        //
        // const gridHelper = new THREE.GridHelper( size, divisions );
        // this.scene.add( gridHelper );


        // - OBJ Specific - Setup loader
        try {
            this.wwObjLoader2 = new THREE.OBJLoader2.WWOBJLoader2();
            this.wwObjLoader2.setCrossOrigin('anonymous');
        } catch (e) {
            console.log("ERROR WW15", "Web Workers for OBJ not found")
        }

        this.boundRender = this.render.bind( this );
        this.initGL();


        this.loader_asset_exists( pathUrl, mtlFilename,
            objFilename, pdbFileContent,
            fbxFilename, glbFilename,
            textures_fbx_string_connected);

        // Resize Canvas
        this.canvasResizeBounded = this.onCanvasResize.bind(this);
        window.addEventListener( 'resize', this.canvasResizeBounded, true );
    }


    onCanvasResize(){
        this.resizeDisplayGL();
    }

    raylineShow(raycasterPick){

        let points = [];

        let c = 1000;
        points.push(raycasterPick.ray.origin);
        points.push(new THREE.Vector3((raycasterPick.ray.origin.x + c*raycasterPick.ray.direction.x),
            (raycasterPick.ray.origin.y + c*raycasterPick.ray.direction.y),
            (raycasterPick.ray.origin.z + c*raycasterPick.ray.direction.z))
        );

        let geolinecast = new THREE.BufferGeometry().setFromPoints( points );

        let myBulletLine = new THREE.Line( geolinecast, new THREE.LineBasicMaterial({color: 0x0000ff}));
        myBulletLine.name = 'rayLine';

        this.scene.add(myBulletLine);

        // This will force scene to update and show the line
        //this.camera.position.x += 0.1;

        // let scope = this;
        // setTimeout(function () {
        //      scope.camera.position.x -= 0.2;
        //  }, 1500);

        // Remove the line
        // setTimeout(function () {
        //     scope.scene.remove(scope.scene.getObjectByName('rayLine'));
        // }, 3500);


    }


    // Add OrbitControl listeners to render on demand
    addControlEventListeners(){

        this.controls.addEventListener('change', this.boundRender);





        // this.controls.dispatchEvent( { type: 'change' } );
        //window.addEventListener('resize', this.boundRender);
    }

    // Remove OrbitControl listeners to render on demand. (this is useful for continuous animation)
    removeControlEventListeners(){

        this.controls.removeEventListener('change', this.boundRender);

        //window.removeEventListener('resize', this.boundRender);
    }

    // Play or Stop animation
    playStopAnimation(){

        if (!this.action.isRunning()) {

            this.removeControlEventListeners();
            this.startAutoLoopRendering();

            // Play the audio
            if (this.audioElement) {
                this.audioElement.play();
            }

            // Play the animation
            this.action.paused = false;
            this.action.play();

        } else {

            this.stopAutoLoopRendering();
            this.addControlEventListeners();

            if (this.audioElement) {
                this.audioElement.pause();
            }
            this.action.paused = true;

        }
    }

    // Start Renderer amd label Renderer
    render() {

        if (!this.renderer.autoClear)
            this.renderer.clear();

        if (this.statsSwitch) {
            this.stats.update();
        }
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);

        // Animation
        if ( this.mixers.length > 0 ) {
            this.mixers[ 0 ].update( this.clock.getDelta() );
        }


        let assettrsDOM = document.getElementById('assettrs');

        if(assettrsDOM){
            assettrsDOM.value = Math.round(this.controls.object.position.x*1000)/1000 +','+
                Math.round(this.controls.object.position.y*1000)/1000 +','+
                Math.round(this.controls.object.position.z*1000)/1000 + ','+
                Math.round(this.controls.object.rotation.x*1000)/1000 + ','+
                Math.round(this.controls.object.rotation.y*1000)/1000 + ','+
                Math.round(this.controls.object.rotation.z*1000)/1000 + ','+
                Math.round(this.camera.position.x*1000)/1000 + ','+
                Math.round(this.camera.position.y*1000)/1000 + ','+
                Math.round(this.camera.position.z*1000)/1000
        }

    }

    // Render only when OrbitControls change of window is resized
    kickRendererOnDemand() {
        this.render();
        this.addControlEventListeners();
        this.resizeDisplayGL();
        this.render();
        if (this.previewProgressLabel)
            this.previewProgressLabel.style.visibility = "hidden";
    }

    // Start auto loop (when animation)
    startAutoLoopRendering(){
        // continuous rendering
        let scope = this;

        let looprender = function(){
            scope.idRequestFrame = requestAnimationFrame(looprender);
            scope.boundRender();
        }

        looprender();
    }

    // Stop auto loop rendering (when animation)
    stopAutoLoopRendering(){
        cancelAnimationFrame(this.idRequestFrame);
    }

    /**
     * Reading from  files on client side for OBJ, FBX, and GLB
     */
    checkerCompleteReading( whocalls ){

        if ((this.nObj === 1 && this.objFileContent !== '') ||
            (this.nFbx === 1 && this.FbxBuffer !== '') || (this.nGlb === 1 && this.GlbBuffer !== '') ){

            // Show progress slider
            //jQuery('#previewProgressSlider').show();

            // Make the definition with the obj
            if (this.nObj === 1){

                let objFileContent = document.getElementById('objFileInput').value;
                let mtlFileContent = document.getElementById('mtlFileInput').value;


                let encoder = new TextEncoder();
                let uint8Array = encoder.encode(objFileContent);

                let objectDefinition = {
                    name: this.nObj === 1 ? 'userObj':'userFbx',
                    objAsArrayBuffer: uint8Array,
                    pathTexture: "",
                    mtlAsString: null
                };

                if (this.nMtl === 0) {
                    // Start without MTL
                    this.loadObjStream(objectDefinition);

                } else {
                    if (mtlFileContent!==''){

                        objectDefinition.mtlAsString = mtlFileContent;

                        if (this.nJpg===0 && this.nPng===0 ){
                            // Start without Textures
                            this.loadObjStream(objectDefinition);

                        } else {
                            // Else check if textures have been loaded
                            let nTexturesLength = jQuery("input[id='textureFileInput']").length;

                            if ((this.nPng>0 && this.nPng === nTexturesLength)
                                || ( this.nJpg>0 && this.nJpg === nTexturesLength) ) {

                                // Get textureFileInput array with jQuery
                                let textFil = jQuery("input[id='textureFileInput']");

                                // Store here the raw image textures
                                objectDefinition.pathTexture = [];

                                for (let k = 0; k < textFil.length; k++){
                                    let myname = textFil[k].name;

                                    // do some text processing on the names to remove textureFileInput[ and ] from name
                                    myname = myname.replace('textureFileInput[','');
                                    myname = myname.replace(']','');

                                    objectDefinition.pathTexture[myname] = textFil[k].value;
                                }



                                this.loadObjStream(objectDefinition);
                            }
                        }
                    }
                }
            } else if (this.nFbx === 1){

                // Get all fields
                let texturesStreams = jQuery("input[id='textureFileInput']");
                let nTexturesLoaded = texturesStreams.length;

                if ( nTexturesLoaded < this.nJpg || nTexturesLoaded < this.nPng || nTexturesLoaded < this.nGif){
                    console.log("Not all textures loaded yet");
                    return;
                }

                if ( nTexturesLoaded === 0 )
                    texturesStreams = '';

                // console.log("Ignite reading fbx");

                this.loadFbxStream(this.FbxBuffer, texturesStreams);

            } else if (this.nGlb === 1){
                console.log("Ignite reading glb");

                this.loadGlbStream(this.GlbBuffer);

            }

        }
    }

    // Initialize Scene
    initGL(){


        this.scene.background = this.isBackGroundNull ? null : new THREE.Color(this.back_3d_color);


        // - Label renderer -
        this.labelRenderer = new THREE.CSS2DRenderer();
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0';
        this.labelRenderer.domElement.style.fontSize = "25pt";
        this.labelRenderer.domElement.style.textShadow = "-1px -1px #000, 1px -1px #000, -1px 1px  #000, 1px 1px #000";
        this.labelRenderer.domElement.style.pointerEvents = 'none';


        // add label renderer
        this.canvasLabelsToBindTo.appendChild(this.labelRenderer.domElement);


        // Add audio listener to the camera
        if (this.audioElement!=null) {
            this.listener = new THREE.AudioListener();
            this.camera.add(this.listener);
            this.positionalAudio = new THREE.PositionalAudio(this.listener);

            this.positionalAudio.name = "audio1";
            this.positionalAudio.setMediaElementSource(this.audioElement);
            this.positionalAudio.setRefDistance(200);
            this.positionalAudio.setDirectionalCone(330, 230, 0.01);

            // This adds the audio element to loaded 3D object
            this.scene.getChildByName('root').add(this.positionalAudio);
        }

        this.resetCamera();

        // Light
        let ambientLight = new THREE.AmbientLight(0x404040,2);
        let directionalLight1 = new THREE.DirectionalLight(0xA0A050);
        let directionalLight2 = new THREE.DirectionalLight(0x909050);
        let directionalLight3 = new THREE.DirectionalLight(0xA0A050);

        directionalLight1.position.set(-1000,  -550,  1000);
        directionalLight2.position.set( 1000,   550, -1000);
        directionalLight3.position.set(    0,   550,     0);

        // Scene.children[1],[2],[3],[4] are lights
        this.scene.add(directionalLight1);
        this.scene.add(directionalLight2);
        this.scene.add(directionalLight3);
        this.scene.add(ambientLight);

        // ---- OBJ asynch loader ---------

        let scope = this;

        // Function for OBJ: Function to load materials
        let materialsLoaded = function (materials) {
            for (let k in materials) {
                if(materials.hasOwnProperty(k)) {
                    materials[k].transparent = true;
                    materials[k].alphaTest = 0.1;
                }
            }
        };

        // Function for OBJ: Report for meshes
        let meshLoaded = function (name, bufferGeometry, material) {};

        // Function on Completed Loading
        let completedLoading = function () {
            console.log('Loading complete for OBJ WW!');

            if (scope.previewProgressLabel) {
                scope.previewProgressLine.style.width = '0';
                scope.previewProgressLabel.innerHTML = "";
            }

            scope.zoomer(scope.scene.getChildByName('root'));

            scope.kickRendererOnDemand();

            //scope.controls.target(scope.scene.getChildByName('root'));

            // // Auto create screenshot;
            // setTimeout(function(){
            //     jQuery("#button_qrcode").click(); // close qr code
            //     jQuery("#createModelScreenshotBtn").click();
            // },1000);
        };

        try {
            this.wwObjLoader2.registerCallbackProgress(this._reportProgress);
            this.wwObjLoader2.registerCallbackCompletedLoading(completedLoading);
            this.wwObjLoader2.registerCallbackMaterialsLoaded(materialsLoaded);
            this.wwObjLoader2.registerCallbackMeshLoaded(meshLoaded);
        } catch (e){
            console.log("Can load OBJ", "ERROR O151");
        }

        return true;
    }

    // Clear Previous model
    clearAllAssets(whocalls) {

//        console.log("CLEARING", whocalls);

        this.setZeroVars();

        // Hide animation button
        this.animationButton.style.display = "none";

        // Clear animations
        this.mixers = [];

        // Clear any GLB, FBX, PDB or OBJ
        if (this.scene.getObjectByName('root').clear)
            this.scene.getObjectByName('root').clear(); // remove all children of root
    }

    /* OBJ Loader */
    loadObjStream(objDef) {

        let prepData = new THREE.OBJLoader2.WWOBJLoader2.PrepDataArrayBuffer(
            objDef.name,
            objDef.objAsArrayBuffer,
            objDef.pathTexture,  // URL if already uploaded or array of raw images if in preview (client side)
            objDef.mtlAsString
        );

        prepData.setSceneGraphBaseNode(this.scene.getChildByName('root'));
        prepData.setStreamMeshes(true);
        this.wwObjLoader2.prepareRun(prepData);
        this.wwObjLoader2.run();
    }


    /* FBX loader */
    loadFbxStream(fbxBuffer, texturesStreams) {

        // Clear Previous
        this.clearAllAssets("loadFbxStream");

        let fbxLoader = new THREE.FBXLoader();

        let fbxObject = fbxLoader.parseStream(fbxBuffer, texturesStreams);

        // With animation
        if ( fbxObject.animations.length > 0 ) {

            fbxObject.mixer = new THREE.AnimationMixer( fbxObject );

            this.mixers.push( fbxObject.mixer );

            this.action = fbxObject.mixer.clipAction( fbxObject.animations[0] );

            // Display button to start animation inside the Asset 3D previewer
            this.animationButton.style.display = "inline-block";

            // No-animation
        } else {
            this.animationButton.style.display = "none";
        }

        // FBX is added to root
        this.scene.getChildByName("root").add(fbxObject);

        // zoom
        this.zoomer(this.scene.getChildByName('root'));

        // Kick renderer
        let scope = this;
        setTimeout(function(){scope.kickRendererOnDemand();} , 500);
    }

    /* GLB GLTF loader */
    loadGlbStream(GlbBuffer) {
        let scope = this;

        // Clear Previous
        this.clearAllAssets("loadGlbStream");

        let manager = new THREE.LoadingManager();
        manager.onProgress = function( item, loaded, total ) {};

        let glbLoader = new THREE.GLTFLoader( manager );

        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath( '/wp-content/plugins/vrodos/js_libs/threejs141/draco/' );
        glbLoader.setDRACOLoader( dracoLoader );


        // Load a glTF resource
        glbLoader.parse(
            GlbBuffer, '',
            // called when the resource is loaded
            function ( gltf ) {

                if ( gltf.animations.length > 0) {

                    let glbMixer = new THREE.AnimationMixer( gltf.scene );
                    scope.mixers.push( glbMixer );
                    scope.action = glbMixer.clipAction( gltf.animations[0] );

                    // Display button to start animation inside the Asset 3D previewer
                    scope.animationButton.style.display = "inline-block";

                } else {

                    // Display button to start animation inside the Asset 3D previewer
                    scope.animationButton.style.display = "none";

                }

                scope.scene.getObjectByName('root').add( gltf.scene );
                scope.zoomer(scope.scene.getObjectByName('root'));
                scope.kickRendererOnDemand();
                //setTimeout(function(){scope.kickRendererOnDemand();} , 1);

            },
            '',
            // called when loading has errors
            function ( error ) {

                console.log( 'An error happened' );

            }
        );

    }

    /*  Auto zoom on obj with multiple meshes */
    computeSceneBoundingSphereAll(myGroupObj)
    {
        let sceneBSCenter = new THREE.Vector3(0,0,0);
        let sceneBSRadius = 0;
        let nObjects = 0;

        myGroupObj.traverse( function (object)
        {
            if (object instanceof THREE.Mesh)
            {

                //console.log(object.position);
                sceneBSCenter.add( object.position );
                nObjects ++;
            }
        } );

        // console.log(nObjects, sceneBSCenter);
        sceneBSCenter.divideScalar(nObjects);

        myGroupObj.traverse( function (object)
        {
            if (object instanceof THREE.Mesh)
            {
                object.geometry.computeBoundingSphere();

                // Object radius
                let radius = object.geometry.boundingSphere.radius;

//                console.log(object.name + " " + radius, object.position);


                if (radius) {
                    sceneBSRadius = Math.max(sceneBSRadius, radius + object.position.length());
                }
            }
        } );

        let sphereGeometry = new THREE.SphereGeometry(sceneBSRadius, 32, 32);
        let sphereMaterial = new THREE.MeshBasicMaterial({color:0x00ff00, wireframe:true})
        let sphereObject = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphereObject.visible = false;
        sphereObject.name = "myBoundingSphere";

        return [sceneBSCenter, sceneBSRadius, sphereObject];
    }


    showHideBoundSphere(){
        let sphObj = this.scene.getObjectByName('myBoundingSphere');
        let isVisible = sphObj.visible;
        sphObj.visible = isVisible ? false : true;
        this.render();
    }


    //-------------------- loading from saved data --------------------------------------
    loader_asset_exists( pathUrl = null, mtlFilename = null,
                         objFilename= null, pdbFileContent = null,
                         fbxFilename = null, glbFilename = null,
                         textures_fbx_string_connected = null) {

        if (this.scene != null) {
            if (this.renderer)
                this.clearAllAssets("loader_asset_exists");
        }




        // GLB
        if (glbFilename){
            //console.log("Loading from existing resource","GLB");
            //console.log("glbFilename", glbFilename);

            // Instantiate a loader
            const loader = new THREE.GLTFLoader();

            //loader.setDRACOLoader( new THREE.DRACOLoader() );

            // const dracoLoader = new THREE.DRACOLoader();
            // dracoLoader.setDecoderPath( '/wordpress/wp-content/plugins/vrodos/js_libs/threejs119/draco/' );
            // loader.setDRACOLoader( dracoLoader );

            let scope = this;

            // Load a glTF resource
            loader.load(
                // resource URL
                glbFilename,
                // called when the resource is loaded
                function ( gltf ) {

                    if (gltf.animations.length>0) {

                        let glbmixer = new THREE.AnimationMixer(gltf.scene);
                        scope.mixers.push(glbmixer);
                        scope.action = glbmixer.clipAction(gltf.animations[0]);

                        // Display button to start animation inside the Asset 3D previewer
                        scope.animationButton.style.display = "inline-block";

                    } else {

                        // Display button to start animation inside the Asset 3D previewer
                        scope.animationButton.style.display = "none";
                    }

                    if (scope.boundingSphereButton) {
                        scope.boundingSphereButton.style.display = "inline-block";
                    }

                    // Add to root
                    scope.scene.getObjectByName('root').add(gltf.scene);
                    scope.zoomer(scope.scene.getObjectByName('root'));
                    scope.kickRendererOnDemand();

                    //jQuery('#previewProgressSlider')[0].style.visibility = "hidden";

                },
                // called while loading is progressing
                function ( xhr ) {

                    scope.previewProgressLabel.innerHTML =
                        Math.floor(xhr.loaded / 104857.6) / 10 + ' Mb';

                },
                // called when loading has errors
                function ( error ) {

                    console.log( 'An error happened', error );

                }
            );

            // OBJ load
        } else if (pathUrl) {

            //console.log("Loading from existing resource","OBJ");

            let scope = this;

            let manager = new THREE.LoadingManager();

            if (objFilename) { // this means that 3D model exists for this asset

                var mtlLoader = new THREE.MTLLoader();

                mtlLoader.setPath(pathUrl);

                mtlLoader.load(mtlFilename, function (materials) {
                    materials.preload();

                    var objLoader = new THREE.OBJLoader(manager);
                    objLoader.setMaterials(materials);
                    objLoader.setPath(pathUrl);

                    objLoader.load(objFilename, 'after',
                        // OnObjLoad
                        function (object) {

                            // Find bounding sphere
                            let sphere = scope.computeSceneBoundingSphereAll(object);

                            // translate object to the center
                            object.traverse(function (object) {
                                if (object instanceof THREE.Mesh) {
                                    object.geometry.translate(-sphere[0].x, -sphere[0].y, -sphere[0].z);
                                }
                            });

                            // Add to pivot
                            scope.scene.getChildByName('root').add(object);

                            // Find new zoom
                            var totalradius = sphere[1];
                            scope.controls.minDistance = 0.001 * totalradius;
                            scope.controls.maxDistance = 15 * totalradius;

                            scope.zoomer(scope.scene.getChildByName('root'));
                            scope.kickRendererOnDemand();

                            //jQuery('#previewProgressSlider')[0].style.visibility = "hidden";

                        },
                        //onObjProgressLoad
                        function (xhr) {

                            if (this.previewProgressLabel) {
                                this.previewProgressLabel.innerHTML =
                                    Math.round(xhr.loaded / xhr.total * 100) + '% loaded';
                                //Math.round(xhr.loaded / 1000) + "KB";
                            }
                        },
                        //onObjErrorLoad
                        function (xhr) {
                            console.log("Error 351");
                        }
                    );
                });


            } else if (fbxFilename){


                //console.log("Loading from existing resource","FBX");

                // split texture string into each texture
                let url_files = textures_fbx_string_connected.split('|');



                if (url_files[0].includes('.jpg')){
                    this.nJpg = url_files.length;
                } else if (url_files[0].includes('.png')){
                    this.nJpg = url_files.length;
                } else if (url_files[0].includes('.gif')){
                    this.nJpg = url_files.length;
                }

                // console.log("this.nJpg", this.nJpg);


                // Add the fbx also
                url_files.push(pathUrl + fbxFilename);

                for (let i=0; i < url_files.length; i++) {

                    let xhr = new XMLHttpRequest();
                    let basename = '';

                    let url = url_files[i];//.replace('http:', 'https:');


                    if( url.includes(".txt") ) {

                        // We want the basename and the extension for naming the file object
                        basename = url.replace('.txt', '.fbx');
                        basename = new String(basename).substring(basename.lastIndexOf('/') + 1);

                        // Set xhr to get the url as text
                        xhr.open('GET', url, true);
                        //xhr.responseType = 'text';
                        xhr.responseType = 'arraybuffer';

                    } else if (url.includes("texture") ) {

                        basename = new String(url).substring(url.lastIndexOf('/') + 1);

                        let file_extension = basename.split('.').pop();

                        let i_first_underscore = basename.indexOf('_');
                        let i_last_underscore = basename.lastIndexOf('_');
                        basename = basename.substring(i_first_underscore+1, i_last_underscore);
                        basename = basename.replace('texture_','');

                        basename = basename  + "." + file_extension;
                        xhr.open('GET', url, true);
                        xhr.responseType = 'blob';
                    }

                    let scope = this;

                    xhr.onload = function (e) {
                        if (this.status === 200) {

                            let file = new File([this.response], basename);
                            scope.file_reader_cortex2(file);
                        }
                    };

                    xhr.send();
                }

            } else {
                console.log("WARNING", "UNKNOWN 155");
            }
        }

    }


    // File reader cortex
    file_reader_cortex2(file){

        let scope = this;

        // Get the extension
        let type = file.name.split('.').pop();

        // set the reader
        let reader = new FileReader();

        switch (type) {
            case 'pdb': this.nPdb = 1; reader.readAsText(file);        break;
            case 'mtl': this.nMtl = 1; reader.readAsText(file);        break;
            case 'obj': this.nObj = 1; reader.readAsArrayBuffer(file); break;
            case 'fbx': this.nFbx = 1; reader.readAsArrayBuffer(file); break;
            case 'glb': this.nGlb = 1; reader.readAsArrayBuffer(file); break;
            case 'jpg': reader.readAsDataURL(file);     break;
            case 'png': reader.readAsDataURL(file);     break;
            case 'gif': reader.readAsDataURL(file);     break;
        }

        // --- Read it ------------------------
        reader.onload = (function(reader) {
            return function() {

                let fileContent = reader.result ? reader.result : '';

                let dec = new TextDecoder();

                switch (type) {
                    case 'mtl':
                        // Replace quotes because they create a bug in input form
                        document.getElementById('mtlFileInput').value = fileContent.replace(/'/g, "");
                        break;
                    case 'obj': document.getElementById('objFileInput').value = dec.decode(fileContent); break;
                    case 'fbx':

                        let x = document.createElement("INPUT");
                        x.setAttribute("type", "hidden");
                        x.setAttribute("id", "fbxFileInput");
                        document.body.appendChild(x);

                        document.getElementById('fbxFileInput').value = dec.decode(fileContent);
                        scope.FbxBuffer =  fileContent;
                        break;
                    case 'glb':
                        document.getElementById('glbFileInput').value = dec.decode(fileContent);
                        scope.GlbBuffer =  fileContent;
                        break;
                    case 'pdb': document.getElementById('pdbFileInput').value = fileContent; break;
                    case 'jpg':
                    case 'png':
                    case 'gif':
                        let y = document.createElement("INPUT");
                        y.setAttribute("type", "hidden");
                        y.setAttribute("id", "textureFileInput");
                        y.setAttribute("value", fileContent);
                        y.setAttribute("name", "textureFileInput["+ file.name + "]");
                        document.body.appendChild(y);

                        // jQuery('#3dAssetForm').append(
                        //     '<input type="hidden" name="textureFileInput['+file.name+
                        //     ']" id="textureFileInput" value="' + fileContent + '" />');
                        break;
                }

                // console.log("TYPE", type + " " + file);
                scope.checkerCompleteReading( type );
            };
        })(reader);
    }



    // ----------------- Auxiliary ---------------------------

    /* Zoom to object */
    zoomer(towhatObj){ // FBX or OBJ


        if (this.controls.enableZoom) {

            let sphere = this.computeSceneBoundingSphereAll(towhatObj);

            this.scene.add(sphere[2]);

            let totalRadius = sphere[1];
            this.controls.minDistance = 0.01 * totalRadius;
            this.controls.maxDistance = 100 * totalRadius;
            this.resizeDisplayGL();
            this.controls.update();
        }



        this.controls.object.position.x =  parseFloat(this.assettrs[0]);
        this.controls.object.position.y =  parseFloat(this.assettrs[1]);
        this.controls.object.position.z =  parseFloat(this.assettrs[2]);

        this.controls.object.rotation.x =  parseFloat(this.assettrs[3]);
        this.controls.object.rotation.y =  parseFloat(this.assettrs[4]);
        this.controls.object.rotation.z =  parseFloat(this.assettrs[5]);

        this.resetCamera();
    }

    // Resize Renderer and Label Renderer
    resizeDisplayGL() {

        // This is needed for TrackballControls
        //this.controls.handleResize();

        this.recalcAspectRatio();

        this.renderer.setSize(this.canvasToBindTo.offsetWidth, this.canvasToBindTo.offsetHeight, false);
        this.labelRenderer.setSize(this.canvasLabelsToBindTo.offsetWidth, this.canvasLabelsToBindTo.offsetHeight, false);

        this.updateCamera();

    }

    // Recalculate canvas aspect ratio
    recalcAspectRatio() {
        this.aspectRatio = ( this.canvasToBindTo.offsetHeight === 0 ) ? 1 : this.canvasToBindTo.offsetWidth / this.canvasToBindTo.offsetHeight;
    }

    // Reset Camera
    resetCamera() {
        this.camera.position.copy(this.cameraDefaults.posCamera);
        this.cameraTarget.copy(this.cameraDefaults.posCameraTarget);
        this.updateCamera();
    }

    // Update camera aspect
    updateCamera() {
        this.camera.aspect = this.aspectRatio;
        this.camera.lookAt(this.cameraTarget);
        this.camera.updateProjectionMatrix();
    }

    // Report in console
    _reportProgress(text) {
        console.log('Progress: ' + text);
    }
}





