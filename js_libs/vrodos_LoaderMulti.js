/**
 * Created by DIMITRIOS on 7/3/2016.
 */

"use strict";

class VRodos_LoaderMulti {

    constructor(who){
    };

    load(manager, resources3D, pluginPath) {

        for (let n in resources3D) {
            (function (name) {

                if(name==='SceneSettings')
                    return;

                // Lights are in a different loop
                if (resources3D[name]['categoryName'].startsWith("light"))
                    return;

                let mtlLoader = new THREE.MTLLoader();

                // Load Steve
                if (name == 'avatarYawObject') {

                    //console.log('avatarYawObject');
                    //mtlLoader.setPath(pluginPath+"/assets/Steve/");
                    // STEVE is the CAMERA MESH

                    // Load camera 3D model
                    mtlLoader.load(pluginPath + "/assets/Steve/camera.mtl", function (materials) {

                        materials.preload();

                        let objloader = new THREE.OBJLoader();
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
                                envir.setCamMeshToAvatarControls();
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

                        let objloader = new THREE.OBJLoader();
                        objloader.setMaterials(materials);

                        objloader.load(pluginPath + '/assets/Steve/Steve.obj', 'after',
                            function (object) {

                                object.name = "SteveOld";
                                object.children[0].name = "SteveMeshOld";
                                object.renderOrder = 1;
                                object.visible = false;

                                envir.scene.add(object);
                                envir.setSteveToAvatarControls();

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

                        console.log("OBJ loading");

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

                                    jQuery("#progressWrapper").get(0).style.visibility= "hidden";

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



                    } else if (resources3D[name]['fbxID'] !== "" && resources3D[name]['fbxID'] !== undefined) {

                        console.log("FBX loading");
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
                                loader.load(fbxURL,

                                    function ( object ) {

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
                                        jQuery("#progressWrapper").get(0).style.visibility= "hidden";


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

                                alert("Could not fetch FBX asset. Probably deleted ?");

                                console.log("Ajax Fetch FBX Asset: ERROR: 179" + thrownError);
                            }
                        });
                    } else if (resources3D[name]['glbID'] !== "" && resources3D[name]['glbID'] !== undefined) {

                        jQuery.ajax({
                            url: my_ajax_object_fetchasset.ajax_url,
                            type: 'POST',
                            data: {
                                'action': 'vrodos_fetch_glb_asset_action',
                                'asset_id': resources3D[name]['assetid']
                            },
                            success: function (res) {

                                let resourcesGLB = JSON.parse(res);

                                let glbURL = resourcesGLB['glbURL'];

                                // Instantiate a loader
                                const loader = new THREE.GLTFLoader(manager);

                                loader.load(glbURL,

                                    // called when the resource is loaded
                                    function (object) {


                                    //console.log(object);


                                        if (object.animations.length > 0) {
                                            // Animation set
                                            object.mixer = new THREE.AnimationMixer(object.scene);
                                            envir.animationMixers.push(object.mixer);
                                            let action = object.mixer.clipAction(object.animations[0]);
                                            action.play();
                                        }
                                        //
                                        object = setObjectProperties(object.scene, name, resources3D);
                                        object.isDigiArt3DMesh = true;
                                        // //------------------------------
                                        envir.scene.add(object);
                                        jQuery("#progressWrapper").get(0).style.visibility= "hidden";
                                    },
                                    // called while loading is progressing
                                    function (xhr) {

                                        var downloadedBytes = name.substring(0, name.length - 11) + " downloaded " +
                                            Math.floor(xhr.loaded / 104857.6) / 10 + ' Mb';

                                        document.getElementById("result_download2").innerHTML = downloadedBytes;
                                    },
                                    // called when loading has errors
                                    function (error) {


                                        console.log('An GLB loading error happened. Error 1590', error);

                                    }
                                );
                            }
                            ,
                            // Ajax error
                            error: function (xhr, ajaxOptions, thrownError) {

                                alert("Could not fetch GLB asset. Probably deleted ? "+ name);

                                console.log("Ajax Fetch Asset: ERROR: 189" + thrownError);
                            }
                        });

                    } else {

                        alert("Unsupported 3D model format. Error 118.");
                        //
                        console.log("name", name);
                        // console.log("fbxID", resources3D[name]['fbxID']);
                        // console.log("glbID", resources3D[name]['glbID']);
                        //
                        console.log("Unsupported 3D model format: ERROR: 118");

                    }
                }
            })(n);
        }



    }
}

// Set loaded Object or Scene (for GLBs) properties
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

    object.fbxID = resources3D[name]['fbxID'];
    object.glbID = resources3D[name]['glbID'];




    object.children[0].material.color.setHex( "0x" +  resources3D[name]['color'] );
    object.children[0].receiveShadow = true;
    object.children[0].castShadow = true;

    //============== Video texture ==========
    if(resources3D[name]['videoTextureSrc']!=='') {

        //console.log("resources3D[name]['videoTextureSrc']", resources3D[name]['videoTextureSrc']);
       startVideo(resources3D, name);
    }

    //=======================================



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

    object.scale.set( resources3D[name]['trs']['scale'][0],
        resources3D[name]['trs']['scale'][1],
        resources3D[name]['trs']['scale'][2]);


    return object;
}

function startVideo (resources3D, name){

    //console.log("startVideo");

    var videoDom = Array();
    var videoTexture = Array();

    videoDom[name] = document.createElement('video');
    videoDom[name].autoplay = true;
    videoDom[name].muted = true;
    videoDom[name].src = resources3D[name]['videoTextureSrc'];
    videoDom[name].load();
    videoTexture[name] = new THREE.VideoTexture(videoDom[name]);

    videoTexture[name].wrapS = videoTexture[name].wrapT = THREE.RepeatWrapping;

    var rX = resources3D[name]['videoTextureRepeatX'];
    var rY = resources3D[name]['videoTextureRepeatY'];

    videoTexture[name].repeat.set(rX, rY);
    videoTexture[name].rotation = resources3D[name]['videoTextureRotation'];

    var cX = resources3D[name]['videoTextureCenterX'];
    var cY = resources3D[name]['videoTextureCenterY'];
    videoTexture[name].center = new THREE.Vector2(cX, cY);


    var cHex = "#" + resources3D[name]['color'];

    var movieMaterial = new THREE.MeshBasicMaterial({map: videoTexture[name], side: THREE.DoubleSide, color: cHex});

    setTimeout(function () {
        envir.scene.getChildByName(name).children[0].material = movieMaterial;

        // const promise = videoDom[name].play();
        // if(promise !== undefined){
        //     promise.then(() => {
        //         // Autoplay started
        //     }).catch(error => {
        //         // Autoplay was prevented.
        //         videoDom[name].muted = false;
        //         videoDom[name].play();
        //     });
        // }

        document.body.addEventListener("mousemove", function () {
            //videoDom[name].muted = false;
            videoDom[name].play();
        });

    }, 1000);
}
