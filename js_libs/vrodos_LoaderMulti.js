/**
 * Created by DIMITRIOS on 7/3/2016.
 */

"use strict";

class VRodos_LoaderMulti {

    constructor(who) {
    };

    load(manager, resources3D, pluginPath) {

        const loader = new THREE.GLTFLoader(manager);

        for (let n in resources3D) {
            (function (name) {

                if (name === 'ClearColor' || name === 'toneMappingExposure' | name === 'enableEnvironmentTexture')
                    return;

                // Fog is not parsed here but in LightsPawn_Loader
                if (name === 'fogtype' || name === 'fogcolor' || name === 'fognear' || name === 'fogfar' || name === 'fogdensity') {
                    return;
                }

                // Lights are in a different loop
                if (resources3D[name]['category_name']) {
                    if (resources3D[name]['category_name'].startsWith("light") || resources3D[name]['category_name'].startsWith("pawn"))
                        return;
                }

                // Load Camera object
                if (name == 'avatarCamera') {

                    loader.load(pluginPath + "/assets/Steve/camera.glb",

                        // called when the resource is loaded
                        function (objectMain) {


                            let object = objectMain.scene.children[0];
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

                            //object = setObjectProperties(object.scene, name, resources3D);
                            //object.isSelectableMesh = true;
                            //envir.scene.add(object);
                            //jQuery("#progressWrapper").get(0).style.visibility= "hidden";
                        },
                        // called while loading is progressing
                        function (xhr) {


                        },
                        // called when loading has errors
                        function (error) {
                            console.log('Can not load camera GLB, loading error happened. Error 1595', error);
                        }
                    );

                } else { // GLB 3D models

                    if (resources3D[name]['glb_id'] !== "" && resources3D[name]['glb_id'] !== undefined) {

                        jQuery.ajax({
                            url: my_ajax_object_fetchasset.ajax_url,
                            type: 'POST',
                            data: {
                                'action': 'vrodos_fetch_glb_asset_action',
                                'asset_id': resources3D[name]['asset_id']
                            },
                            success: function (res) {

                                let resourcesGLB = JSON.parse(res);
                                let glbURL = resourcesGLB['glbURL'];

                                console.log(resourcesGLB);


                                // Instantiate a loader

                                jQuery("#progressWrapper").get(0).style.visibility = "visible";
                                document.getElementById("result_download").innerHTML = "Loading ...";

                                loader.load(glbURL,

                                    // called when the resource is loaded
                                    function (object) {

                                        if (object.animations.length > 0) {
                                            // Animation set
                                            object.mixer = new THREE.AnimationMixer(object.scene);
                                            envir.animationMixers.push(object.mixer);
                                            let action = object.mixer.clipAction(object.animations[0]);
                                            action.play();
                                        }

                                        object = setObjectProperties(object.scene, name, resources3D);

                                        object.isSelectableMesh = true;
                                        envir.scene.add(object);
                                    },
                                    // called while loading is progressing
                                    function (xhr) {

                                        document.getElementById("result_download").innerHTML = "'" +
                                            resources3D[name]['asset_name'] + "' downloaded " +
                                            Math.floor(xhr.loaded / 104857.6) / 10 + ' Mb';
                                    },
                                    // called when loading has errors
                                    function (error) {
                                        console.log('An GLB loading error happened. Error 1590', error);
                                    }
                                );
                            },
                            // Ajax error
                            error: function (xhr, ajaxOptions, thrownError) {

                                alert("Could not fetch GLB asset. Probably deleted ? " + name);

                                console.log("Ajax Fetch Asset: ERROR: 189" + thrownError);
                            }
                        });

                    } else {

                        //alert("Unsupported 3D model format. Error 118.");
                        // console.log("name", name);
                        // console.log("glbID", resources3D[name]['glbID']);
                        // console.log("Unsupported 3D model format: ERROR: 118");
                    }
                }
            })(n);
        }
    }
}

// Set loaded Object or Scene (for GLBs) properties
function setObjectProperties(object, name, resources3D) {

    // Automatically load values that are available
    for (let entry in Object.keys(resources3D[name])) {
        if (!['id', 'translation', 'position', 'rotation', 'scale', 'quaternion'].includes(Object.keys(resources3D[name])[entry])) {
            object[[Object.keys(resources3D[name])[entry]]] = Object.values(resources3D[name])[entry];
        }
    }


    object.isSelectableMesh = true;
    object.isLight = resources3D[name]['isLight'];
    object.fnPath = resources3D[name]['path'];

    // avoid revealing the full path. Use the relative in the saving format.
    object.fnPath = object.fnPath.substring(object.fnPath.indexOf('uploads/') + 7);
    object['glb_id'] = resources3D[name]['glb_id'];


    if (resources3D[name]['overrideMaterial'] === "true") {
        if (object.children[0].isMesh) {
            object.children[0].material.color.setHex("0x" + resources3D[name]['color']);
            object.children[0].material.emissive.setHex("0x" + resources3D[name]['emissive']);
            object.children[0].material.roughness = parseFloat(resources3D[name]['roughness']);
            object.children[0].material.metalness = parseFloat(resources3D[name]['metalness']);
            object.children[0].material.emissiveIntensity = parseFloat(resources3D[name]['emissiveIntensity']);
            object.children[0].receiveShadow = true;
            object.children[0].castShadow = true;
        }
    }
    //============== Video texture ==========


    if (resources3D[name]['videoTextureSrc']) {
        if (resources3D[name]['videoTextureSrc'] !== "undefined") {
            console.log("The object has video texture:", resources3D[name]['videoTextureSrc'])
            startVideo(resources3D, name);
        }
    }

    object.position.set(
        resources3D[name]['trs']['translation'][0],
        resources3D[name]['trs']['translation'][1],
        resources3D[name]['trs']['translation'][2]);

    object.rotation.set(
        resources3D[name]['trs']['rotation'][0],
        resources3D[name]['trs']['rotation'][1],
        resources3D[name]['trs']['rotation'][2]);

    object.scale.set(
        resources3D[name]['trs']['scale'][0],
        resources3D[name]['trs']['scale'][1],
        resources3D[name]['trs']['scale'][2] );


    return object;
}

function startVideo (resources3D, name){

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

    var movieMaterial = new THREE.MeshBasicMaterial({ map: videoTexture[name], side: THREE.DoubleSide, color: cHex });


    setTimeout(function () {

        envir.scene.getObjectByName(name).children[0].material = movieMaterial;

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
            videoDom[name].play();
        });

    }, 1000);
}
