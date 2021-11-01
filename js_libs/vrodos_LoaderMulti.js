/**
 * Created by DIMITRIOS on 7/3/2016.
 */

"use strict";

class VRodos_LoaderMulti {

    constructor(){ };

    load(manager, resources3D, pluginPath) {

         for (let n in resources3D) {
            (function (name) {

                // Lights are in a different loop
                if (resources3D[name]['categoryName'].startsWith("light"))
                    return;

                let mtlLoader = new THREE.MTLLoader();

                // Load Steve
                if (name == 'avatarYawObject') {
                    //mtlLoader.setPath(pluginPath+"/assets/Steve/");
                    // STEVE is the CAMERA MESH

                    // Load camera 3D model
                    mtlLoader.load(pluginPath + "/assets/Steve/camera.mtl", function (materials) {

                        materials.preload();

                        let objloader = new THREE.OBJLoader(manager);
                        objloader.setMaterials(materials);

                        objloader.load(pluginPath + '/assets/Steve/camera.obj', 'after',
                            function (object) {

                                object.name = "Camera3Dmodel";
                                object.children[0].name = "Camera3DmodelMesh";

                                // Make a shield around Steve
                                let geometry = new THREE.BoxGeometry(4.2, 4.2, 4.2);
                                geometry.name = "SteveShieldGeometry";
                                let material = new THREE.MeshBasicMaterial({
                                    color: 0xaaaaaa,
                                    transparent: true,
                                    opacity: 0.2,
                                    visible: false
                                });

                                let steveShieldMesh = new THREE.Mesh(geometry, material);
                                steveShieldMesh.name = 'SteveShieldMesh';
                                //--------------------------

                                object.add(steveShieldMesh);

                                object.renderOrder = 1;

                                envir.scene.add(object);
                                envir.setSteveToAvatarControls();
                                // envir.setSteveWorldPosition(resources3D[name]['trs']['translation'][0],
                                //     resources3D[name]['trs']['translation'][1],
                                //     resources3D[name]['trs']['translation'][2],
                                //     resources3D[name]['trs']['rotation'][0],
                                //     resources3D[name]['trs']['rotation'][1]
                                // );
                            }
                        );
                    });


                    // STEVE OLD IS THE HUMAN MESH

                    // Steve Final old is the Steve 3D model
                    mtlLoader.load(pluginPath + "/assets/Steve/Steve.mtl", function (materials) {

                        materials.preload();

                        let objloader = new THREE.OBJLoader(manager);
                        objloader.setMaterials(materials);

                        objloader.load(pluginPath + '/assets/Steve/Steve.obj', 'after',
                            function (object) {

                                object.name = "SteveOld";
                                object.children[0].name = "SteveMeshOld";
                                object.renderOrder = 1;
                                object.visible = false;

                                envir.scene.add(object);
                                envir.setSteveOldToAvatarControls();

                                envir.setSteveWorldPosition(resources3D[name]['trs']['translation'][0],
                                    resources3D[name]['trs']['translation'][1],
                                    resources3D[name]['trs']['translation'][2],
                                    resources3D[name]['trs']['rotation'][0],
                                    resources3D[name]['trs']['rotation'][1]
                                );
                            }
                        );
                    });


                }else {

                    //------------------- OBJ Loading --------------------------
                    if (resources3D[name]['mtl'] != '') {
                        mtlLoader.setPath(resources3D[name]['path']);
                        mtlLoader.load(resources3D[name]['mtl'], function (materials) {

                            materials.preload();

                            var objLoader = new THREE.OBJLoader(manager);
                            objLoader.setMaterials(materials);
                            objLoader.setPath(resources3D[name]['path']);

                            objLoader.load(resources3D[name]['obj'], 'after',

                                // OnObjLoad
                                function (object) {

                                    object.traverse(function (node) {

                                        if (node.material) {
                                            if (node.material.name) {
                                                if (node.material.name.includes("Transparent")) {
                                                    node.material.transparent = true;
                                                    // to make transparency behind transparency to work
                                                    node.material.alphaTest = 0.5;
                                                }
                                            }
                                        }

                                        if (node instanceof THREE.Mesh) {
                                            node.isDigiArt3DMesh = true;
                                            node.castShadow = true;
                                            node.receiveShadow = true;
                                            if (node.name.includes("renderOrder")) {
                                                let iR = node.name.indexOf("renderOrder");
                                                node.renderOrder = parseInt(node.name.substring(iR + 12, iR + 15));
                                            }
                                        }
                                    });

                                    object = setObjectProperties(object, name, resources3D);
                                    envir.scene.add(object);
                                },

                                //onObjProgressLoad
                                function (xhr) {
                                    var downloadedBytes = name.substring(0, name.length - 11) + " downloaded " +
                                        Math.floor(xhr.loaded / 104857.6) / 10 + ' Mb';
                                    document.getElementById("result_download2").innerHTML = downloadedBytes;
                                },

                                //onObjErrorLoad
                                function (xhr) {
                                    console.log("Error in loading OBJ: Error code 1512");
                                }
                            );

                        });



                    } else if (resources3D[name]['fbx'] !== '') {

                        // ------------------ FBX Loading ---------------------------------

                        jQuery.ajax({
                            url: my_ajax_object_fetchasset.ajax_url,
                            type: 'POST',
                            data: {
                                'action': 'vrodos_fetch_fbx_asset_action',
                                'asset_id': resources3D[name]['assetid']
                            },
                            success: function (res) {

                                let resourcesFBX = JSON.parse(res);

                                let textureFilesURLs = resourcesFBX['texturesURLs'];
                                let fbxURL = resourcesFBX['fbxURL'];

                                // let baseUrlPath = fbxURL.substring(0, fbxURL.lastIndexOf("/")+1);
                                // let fbxFileName =  fbxURL.replace(/^.*[\\\/]/, '');
                                // console.log(fbxFileName, baseUrlPath);

                                let loader = new THREE.FBXLoader(manager);
                                loader.load(fbxURL, function ( object ) {

                                    // Animation set
                                    object.mixer = new THREE.AnimationMixer( object );
                                    envir.animationMixers.push(object.mixer);

                                    if (object.animations.length >0 ){
                                        let action = object.mixer.clipAction( object.animations[ 0 ] );
                                        action.play();
                                    } else {
                                        console.log("Your FBX does not have animation");
                                    }

                                    object.traverse(function (node) {
                                            if (node.material) {
                                                if (node.material.name) {
                                                    if (node.material.name.includes("Transparent")) {
                                                        node.material.transparent = true;
                                                        // to make transparency behind transparency to work
                                                        node.material.alphaTest = 0.5;
                                                    }
                                                }
                                            }

                                            if (node instanceof THREE.Mesh) {
                                                node.isDigiArt3DMesh = true;
                                                node.castShadow = true;
                                                node.receiveShadow = true;
                                                if (node.name.includes("renderOrder")) {
                                                    let iR = node.name.indexOf("renderOrder");
                                                    node.renderOrder = parseInt(node.name.substring(iR + 12, iR + 15));
                                                }
                                            }
                                        });


                                        object = setObjectProperties(object, name, resources3D);

                                        // -------- Sound --------------
                                        // create the PositionalAudio object (passing in the listener)
                                        let audioOf3DObject = new THREE.PositionalAudio( envir.audiolistener );

                                        // load a sound and set it as the PositionalAudio object's buffer

                                        //if(resourcesFBX['audioURL']){

                                            const audioLoader = new THREE.AudioLoader();
                                            audioLoader.load( resourcesFBX['audioURL'], function( buffer ) {
                                                audioOf3DObject.setBuffer( buffer );
                                                audioOf3DObject.setRefDistance( 2000 );
                                                audioOf3DObject.setDirectionalCone(330, 230, 0.01);
                                                audioOf3DObject.setLoop(true);
                                                audioOf3DObject.play();
                                            });

                                            object.add(audioOf3DObject);
                                        //}

                                        //------------------------------

                                        envir.scene.add( object );

                                    },
                                    //onFBXProgressLoad
                                    function (xhr) {
                                        var downloadedBytes = name.substring(0, name.length - 11) + " downloaded " +
                                            Math.floor(xhr.loaded / 104857.6) / 10 + ' Mb';

                                        document.getElementById("result_download2").innerHTML = downloadedBytes;
                                    },
                                    // XHR error
                                    function (xhr) {
                                        console.log("Error in loading FBX: Error code 1513", xhr);
                                    },

                                    textureFilesURLs, resources3D[name]['assetname']

                                    );


                            },
                            // Ajax error
                            error: function (xhr, ajaxOptions, thrownError) {

                                alert("Could not fetch asset. Probably deleted ?");

                                console.log("Ajax Fetch Asset: ERROR: 179" + thrownError);
                            }
                        });
                    } else if (resources3D[name]['glb'] !== '') {

                        // Instantiate a loader
                        const loader = new THREE.GLTFLoader();

                        // loader.load(glbFilename,
                        //     // called when the resource is loaded
                        //     function ( gltf ) {
                        //
                        //         if (gltf.animations.length>0) {
                        //
                        //             let glbmixer = new THREE.AnimationMixer(gltf.scene);
                        //             scope.mixers.push(glbmixer);
                        //             scope.action = glbmixer.clipAction(gltf.animations[0]);
                        //
                        //             // Display button to start animation inside the Asset 3D previewer
                        //             scope.animationButton.style.display = "inline-block";
                        //
                        //         } else {
                        //
                        //             // Display button to start animation inside the Asset 3D previewer
                        //             scope.animationButton.style.display = "none";
                        //         }
                        //
                        //         if (scope.boundingSphereButton) {
                        //             scope.boundingSphereButton.style.display = "inline-block";
                        //         }
                        //
                        //         // Add to root
                        //         scope.scene.getChildByName('root').add(gltf.scene);
                        //         scope.zoomer(scope.scene.getChildByName('root'));
                        //         scope.kickRendererOnDemand();
                        //
                        //         //jQuery('#previewProgressSlider')[0].style.visibility = "hidden";
                        //
                        //     },
                        //     // called while loading is progressing
                        //     function ( xhr ) {
                        //
                        //         scope.previewProgressLabel.innerHTML =
                        //             Math.round( xhr.loaded / xhr.total * 100 ) + '% loaded';
                        //
                        //     },
                        //     // called when loading has errors
                        //     function ( error ) {
                        //
                        //         console.log( 'An error happened', error );
                        //
                        //     }
                        // );



                    }
                }
            })(n);
        }


        // Lights loop
        for (var n in resources3D) {
            (function (name) {

             if (!resources3D[name]['categoryName'].startsWith("light"))
                return;

             if (resources3D[name]['categoryName']==='lightSun' ){

                var colora = new THREE.Color(resources3D[name]['lightcolor'][0],
                    resources3D[name]['lightcolor'][1],
                    resources3D[name]['lightcolor'][2]);

                var lightintensity = resources3D[name]['lightintensity'];

                // LIGHT
                var lightSun = new THREE.DirectionalLight( colora, lightintensity ); //  new THREE.PointLight( 0xC0C090, 0.4, 1000, 0.01 );
                //lightSun.castShadow = true;

                 //Set up shadow properties for the light
                 lightSun.shadow.mapSize.width = 2048;  // default
                 lightSun.shadow.mapSize.height = 2048; // default
                 lightSun.shadow.camera.near = 0.5;    // default
                 lightSun.shadow.camera.far = 500;     // default

                // REM HERE
                lightSun.position.set(
                    resources3D[name]['trs']['translation'][0],
                resources3D[name]['trs']['translation'][1],
                resources3D[name]['trs']['translation'][2] );

                lightSun.rotation.set(
                    resources3D[name]['trs']['rotation'][0],
                resources3D[name]['trs']['rotation'][1],
                resources3D[name]['trs']['rotation'][2] );

                lightSun.scale.set( resources3D[name]['trs']['scale'],
                resources3D[name]['trs']['scale'],
                resources3D[name]['trs']['scale']);


                lightSun.target.position.set(resources3D[name]['targetposition'][0],
                resources3D[name]['targetposition'][1],
                resources3D[name]['targetposition'][2]); // where it points

                lightSun.name = name;
                lightSun.categoryName = "lightSun";
                lightSun.isDigiArt3DModel = true;
                lightSun.isLight = true;

                lightSun.castShadow = true;
                lightSun.shadow.mapSize.width = 512;
                lightSun.shadow.mapSize.height = 512;

                 lightSun.shadow.camera.near = 0.5;
                 lightSun.shadow.camera.far = 1000;

                 lightSun.shadow.camera.left = -10;
                 lightSun.shadow.camera.right = 10;
                 lightSun.shadow.camera.top = 10;
                 lightSun.shadow.camera.bottom = -10;

                //// Add Sun Helper
                var sunSphere = new THREE.Mesh(
                    new THREE.SphereBufferGeometry( 1, 16, 8 ),
                    new THREE.MeshBasicMaterial( { color: colora } )
                );
                sunSphere.isDigiArt3DMesh = true;
                sunSphere.name = "SunSphere";
                lightSun.add(sunSphere);


                var lightSunHelper = new THREE.DirectionalLightHelper( lightSun, 3, colora);
                lightSunHelper.isLightHelper = true;
                lightSunHelper.name = 'lightHelper_' + lightSun.name;
                lightSunHelper.categoryName = 'lightHelper';
                lightSunHelper.parentLightName = name;
                envir.scene.add(lightSunHelper);

                // end of sphere
                envir.scene.add(lightSun);

                lightSun.target.updateMatrixWorld();
                lightSunHelper.update();

                // REM LOAD ALSO THE SPOT HELPER AND EXPORT IMPORT IT : SEE FROM ADD REMOVE ONE !!!!
                // Target spot: Where Sun points
                var lightTargetSpot = new THREE.Object3D();

                lightTargetSpot.add(new THREE.Mesh(
                new THREE.SphereBufferGeometry( 0.5, 16, 8 ),
                new THREE.MeshBasicMaterial( { color: colora } )
                ));

                lightTargetSpot.isDigiArt3DMesh = true;
                lightTargetSpot.name = "lightTargetSpot_" + lightSun.name;
                lightTargetSpot.categoryName = "lightTargetSpot";
                lightTargetSpot.isLightTargetSpot = true;

                lightTargetSpot.position.set(resources3D[name]['targetposition'][0],
                resources3D[name]['targetposition'][1],
                resources3D[name]['targetposition'][2]);

                lightTargetSpot.parentLight = lightSun;
                lightTargetSpot.parentLightHelper = lightSunHelper;

                lightSun.target.position.set(lightTargetSpot.position.x, lightTargetSpot.position.y,
                                                lightTargetSpot.position.z) ;

                envir.scene.add(lightTargetSpot);

                 //Create a helper for the shadow camera (optional)
                 var lightSunShadowhelper = new THREE.CameraHelper( lightSun.shadow.camera );
                 envir.scene.add( lightSunShadowhelper );

        } else if (resources3D[name]['categoryName']==='lightLamp' ){

            var colora = new THREE.Color(resources3D[name]['lightcolor'][0],
                resources3D[name]['lightcolor'][1],
                resources3D[name]['lightcolor'][2]);

            var lightpower = resources3D[name]['lightpower'];
            var lightdecay = resources3D[name]['lightdecay'];
            var lightdistance = resources3D[name]['lightdistance'];


            // LIGHT
            var lightLamp = new THREE.PointLight(colora, lightpower, lightdistance, lightdecay);
            lightLamp.power = lightpower;


            lightLamp.position.set(
                resources3D[name]['trs']['translation'][0],
                resources3D[name]['trs']['translation'][1],
                resources3D[name]['trs']['translation'][2] );

            lightLamp.rotation.set(
                resources3D[name]['trs']['rotation'][0],
                resources3D[name]['trs']['rotation'][1],
                resources3D[name]['trs']['rotation'][2] );

            lightLamp.scale.set( resources3D[name]['trs']['scale'],
                resources3D[name]['trs']['scale'],
                resources3D[name]['trs']['scale']);

            lightLamp.name = name;
            lightLamp.categoryName = "lightLamp";
            lightLamp.isDigiArt3DModel = true;
            lightLamp.isLight = true;

                 lightLamp.castShadow = true;

            //// Add Lamp Sphere
            var lampSphere = new THREE.Mesh(
                new THREE.SphereBufferGeometry(0.5, 16, 8),
                new THREE.MeshBasicMaterial({color: colora})
            );
            lampSphere.isDigiArt3DMesh = true;
            lampSphere.name = "LampSphere";
            lightLamp.add(lampSphere);
            // end of sphere

            // Helper
            var lightLampHelper = new THREE.PointLightHelper(lightLamp, 1, colora);
            lightLampHelper.isLightHelper = true;
            lightLampHelper.name = 'lightHelper_' + lightLamp.name;
            lightLampHelper.categoryName = 'lightHelper';
            lightLampHelper.parentLightName = lightLamp.name;

            envir.scene.add(lightLamp);
            envir.scene.add(lightLampHelper);

            lightLampHelper.update();

        } else if (resources3D[name]['categoryName']==='lightSpot' ){

            var colora = new THREE.Color(resources3D[name]['lightcolor'][0],
                resources3D[name]['lightcolor'][1],
                resources3D[name]['lightcolor'][2]);

            var lightpower = resources3D[name]['lightpower'];
            var lightdecay = resources3D[name]['lightdecay'];
            var lightdistance = resources3D[name]['lightdistance'];
            var lightangle = resources3D[name]['lightangle'];
            var lightpenumbra = resources3D[name]['lightpenumbra'];

            // LIGHT
            var lightSpot = new THREE.SpotLight(colora, lightpower, lightdistance, lightangle, lightpenumbra, lightdecay);
            lightSpot.power = lightpower;

            lightSpot.position.set(
                resources3D[name]['trs']['translation'][0],
                resources3D[name]['trs']['translation'][1],
                resources3D[name]['trs']['translation'][2] );

            lightSpot.rotation.set(
                resources3D[name]['trs']['rotation'][0],
                resources3D[name]['trs']['rotation'][1],
                resources3D[name]['trs']['rotation'][2] );

            lightSpot.scale.set( resources3D[name]['trs']['scale'],
                resources3D[name]['trs']['scale'],
                resources3D[name]['trs']['scale']);

            lightSpot.name = name;
            lightSpot.categoryName = "lightSpot";
            lightSpot.isDigiArt3DModel = true;
            lightSpot.isLight = true;

              lightSpot.castShadow = true;



              lightSpot.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 50, 1, 0.5, 100 ) );
              lightSpot.shadow.bias = 0.0001;
             //
              lightSpot.shadow.mapSize.width = 1024;
              lightSpot.shadow.mapSize.height = 1024;



            //// Add Spot Cone
            var spotSphere = new THREE.Mesh(
                new THREE.SphereBufferGeometry( 1, 16, 8 ),
                new THREE.MeshBasicMaterial({color: colora})
            );
            spotSphere.isDigiArt3DMesh = true;
            spotSphere.name = "SpotSphere";
            lightSpot.add(spotSphere);
            // end of sphere

            // Helper
            var lightSpotHelper = new THREE.SpotLightHelper(lightSpot, colora);
            lightSpotHelper.isLightHelper = true;
            lightSpotHelper.name = 'lightHelper_' + lightSpot.name;
            lightSpotHelper.categoryName = 'lightHelper';
            lightSpotHelper.parentLightName = lightSpot.name;

            envir.scene.add(lightSpot);
            envir.scene.add(lightSpotHelper);

            lightSpotHelper.update();

        }
        })(n);
        }
    }
}


function setObjectProperties(object, name, resources3D) {
    object.isDigiArt3DModel = true;
    object.isLight = resources3D[name]['isLight'];
    object.name = name;
    object.assetname = resources3D[name]['assetname'];
    object.assetid = resources3D[name]['assetid'];
    object.fnPath = resources3D[name]['path'];

    // avoid revealing the full path. Use the relative in the saving format.
    object.fnPath = object.fnPath.substring( object.fnPath.indexOf('uploads/') + 7);

    object.fnObj = resources3D[name]['obj'];
    object.fnObjID = resources3D[name]['objID'];
    object.fnMtl = resources3D[name]['mtl'];
    object.fnMtlID = resources3D[name]['mtlID'];

    object.fnFbxID = resources3D[name]['fbxID'];

    object.audioID = resources3D[name]['audioID'];

    object.categoryID = resources3D[name]['categoryID'];
    object.categoryName = resources3D[name]['categoryName'];

    object.diffImages = resources3D[name]['diffImages'];
    object.diffImageIDs = resources3D[name]['diffImageIDs'];

    object.image1id = resources3D[name]['image1id'];

    object.doorName_source = resources3D[name]['doorName_source'];
    object.doorName_target = resources3D[name]['doorName_target'];
    object.sceneName_target = resources3D[name]['sceneName_target'];
    object.sceneID_target = resources3D[name]['sceneID_target'];

    object.archaeology_penalty = resources3D[name]['archaeology_penalty'];
    object.hv_penalty = resources3D[name]['hv_penalty'];
    object.natural_penalty = resources3D[name]['natural_penalty'];

    object.isreward = resources3D[name]['isreward'];
    object.isCloned = resources3D[name]['isCloned'];

    //object.type_behavior = resources3D[name]['type_behavior'];

    object.position.set(
        resources3D[name]['trs']['translation'][0],
        resources3D[name]['trs']['translation'][1],
        resources3D[name]['trs']['translation'][2] );

    object.rotation.set(
        resources3D[name]['trs']['rotation'][0],
        resources3D[name]['trs']['rotation'][1],
        resources3D[name]['trs']['rotation'][2] );

    object.scale.set( resources3D[name]['trs']['scale'],
        resources3D[name]['trs']['scale'],
        resources3D[name]['trs']['scale']);

    return object;
}
