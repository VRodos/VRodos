/**
 * Created by DIMITRIOS on 7/3/2022.
 */

"use strict";

class VRodos_LightsPawn_Loader {

    constructor(who) {
    };

    load(resources3D) {

        var linear_elems = document.getElementsByClassName('linearElement');
        var expo_elems = document.getElementsByClassName('exponentialElement');
        var color_elems = document.getElementsByClassName('colorElement');
        
        

        // Lights and Scene Settings loop
        for (const name in resources3D) {
            const resource = resources3D[name];
                
                if (name === 'SceneSettings') {
                   
                    
                    if (resource.fogCategory === 1) {
                        document.getElementById("FogValues").style.display="flex";
                        for (var i = 0; i < linear_elems.length; ++i) {
                            linear_elems[i].style.display="flex";
                        }
                        for (var i = 0; i < expo_elems.length; ++i) {
                            expo_elems[i].style.display="none";
                        }
                        for (var i = 0; i < color_elems.length; ++i) {
                            color_elems[i].style.display="flex";
                        }
                    } else if (resource.fogCategory === 2) {
                        document.getElementById("FogValues").style.display="flex";
                        for (var i = 0; i < linear_elems.length; ++i) {
                            linear_elems[i].style.display="none";
                        }
                        for (var i = 0; i < expo_elems.length; ++i) {
                            expo_elems[i].style.display="flex";
                        }
                        for (var i = 0; i < color_elems.length; ++i) {
                            color_elems[i].style.display="flex";
                        }
                    } else{
                        document.getElementById("FogValues").style.display="none";
                        for (var i = 0; i < linear_elems.length; ++i) {
                            linear_elems[i].style.display="none";
                        }
                        for (var i = 0; i < expo_elems.length; ++i) {
                            expo_elems[i].style.display="none";
                        }
                        for (var i = 0; i < color_elems.length; ++i) {
                            color_elems[i].style.display="none";
                        }
                    }
                    document.getElementById('FogType').value = resource.fogtype;
                    if (resource.fogCategory === 0) {
                        document.getElementById('RadioNoFog').checked = true;
                    } else if (resource.fogCategory === 1) {
                        document.getElementById('RadioLinearFog').checked = true;
                    } else if (resource.fogCategory === 2) {
                        document.getElementById('RadioExponentialFog').checked = true;
                    }                 
                    return;
                }

                 if (name === 'fogCategory'){

                    document.getElementById('FogNear').value = parseFloat(resource['fognear']);
                    document.getElementById('FogFar').value = parseFloat(resource['fogfar']);
                    document.getElementById('FogDensity').value = parseFloat(resource['fogdensity']);
                    document.getElementById('jscolorpickFog').jscolor.fromString("#" + resource['fogcolor']);
                    

                    if (resource['fogCategory'] === '1') {
                        for (var i = 0; i < linear_elems.length; ++i) {
                            linear_elems[i].style.display="flex";
                        }
                        for (var i = 0; i < expo_elems.length; ++i) {
                            expo_elems[i].style.display="none";
                        }
                        for (var i = 0; i < color_elems.length; ++i) {
                            color_elems[i].style.display="flex";
                        }
                        document.getElementById("FogValues").style.display="flex";
                    } else if (resource['fogCategory'] === '2') {
                        for (var i = 0; i < linear_elems.length; ++i) {
                            linear_elems[i].style.display="none";
                        }
                        for (var i = 0; i < expo_elems.length; ++i) {
                            expo_elems[i].style.display="flex";
                        }
                        for (var i = 0; i < color_elems.length; ++i) {
                            color_elems[i].style.display="flex";
                        }
                        document.getElementById("FogValues").style.display="flex";
                    } else{
                        for (var i = 0; i < linear_elems.length; ++i) {
                            linear_elems[i].style.display="none";
                        }
                        for (var i = 0; i < expo_elems.length; ++i) {
                            expo_elems[i].style.display="none";
                        }
                        for (var i = 0; i < color_elems.length; ++i) {
                            color_elems[i].style.display="none";
                        }
                        document.getElementById("FogValues").style.display="none";
                    }
                    if (resource['fogCategory'] === "0") {
                        document.getElementById('RadioNoFog').checked = true;
                    } else if (resource['fogCategory'] === "1") {
                        document.getElementById('RadioLinearFog').checked = true;
                    } else if (resource['fogCategory'] === "2") {
                        document.getElementById('RadioExponentialFog').checked = true;
                    }                 

                     return;
                 }
                            
                // Scene Settings
                if (name === 'ClearColor') {

                    //console.log("resources3D['ClearColor']", resources3D['ClearColor']);

                    envir.scene.background = new THREE.Color(resources3D['ClearColor']);             // this.isBackGroundNull ? null : new THREE.Color(this.back_3d_color);

                    //envir.renderer.setClearColor(resources3D['ClearColor']);

                    if (document.getElementById('sceneClearColor')) {
                        document.getElementById('sceneClearColor').value = resources3D['ClearColor'];
                    }
                    if (document.getElementById('jscolorpick')) {
                        document.getElementById('jscolorpick').value = resources3D['ClearColor'];
                    }
                    return;
                }

                let clearToParse = null;
                if (resource['category_name']) {

                    clearToParse = resource['category_name'].startsWith("light") || resource['category_name'].startsWith("pawn");

                    if(!clearToParse)
                        return;
                }


                if (resource['category_name'] === 'lightSun') {

                    var colora = new THREE.Color(resource['lightcolor'][0],
                        resource['lightcolor'][1],
                        resource['lightcolor'][2]);

                    var lightintensity = resource['lightintensity'];

                    // LIGHT
                    var lightSun = new THREE.DirectionalLight(colora, lightintensity); //  new THREE.PointLight( 0xC0C090, 0.4, 1000, 0.01 );
                    //lightSun.castShadow = true;

                    //Set up shadow properties for the light
                    lightSun.shadow.camera.near = 0.5;    // default
                    lightSun.shadow.camera.far = 500;     // default

                    // REM HERE
                    lightSun.position.set(resource['trs']['translation'][0],
                        resource['trs']['translation'][1],
                        resource['trs']['translation'][2]);

                    lightSun.rotation.set(
                        resource['trs']['rotation'][0],
                        resource['trs']['rotation'][1],
                        resource['trs']['rotation'][2]);

                    lightSun.scale.set(resource['trs']['scale'][0],
                        resource['trs']['scale'][1],
                        resource['trs']['scale'][2]);


                    lightSun.target.position.set(resource['targetposition'][0],
                        resource['targetposition'][1],
                        resource['targetposition'][2]); // where it points

                    lightSun.name = name;
                    lightSun.asset_name = "mylightSun";
                    lightSun.category_name = "lightSun";
                    lightSun.isSelectableMesh = true;
                    lightSun.isLight = true;
                    lightSun.castShadow = true;
                    lightSun.sunSky = resource['sunSky'];
                    lightSun.locked = resource['locked'];
                    lightSun.castingShadow = resource['castingShadow'];
                    lightSun.shadowMapHeight = resource['shadowMapHeight'];
                    lightSun.shadowMapWidth = resource['shadowMapWidth'];
                    lightSun.shadowCameraTop = resource['shadowCameraTop'];
                    lightSun.shadowCameraBottom = resource['shadowCameraBottom'];
                    lightSun.shadowCameraLeft = resource['shadowCameraLeft'];
                    lightSun.shadowCameraRight = resource['shadowCameraRight'];
                    lightSun.shadowBias = resource['shadowBias'];

                    //// Add Sun Helper
                    var sunSphere = new THREE.Mesh(
                        new THREE.SphereGeometry(1, 16, 8),
                        new THREE.MeshBasicMaterial({ color: colora })
                    );
                    sunSphere.isSelectableMesh = true;
                    sunSphere.name = "SunSphere";
                    lightSun.add(sunSphere);

                    // lightSun.shadow.mapSize.width = 200;
                    // lightSun.shadow.mapSize.height = 200;

                    var lightSunHelper = new THREE.DirectionalLightHelper(lightSun, 3, colora);
                    lightSunHelper.isLightHelper = true;
                    lightSunHelper.name = 'lightHelper_' + lightSun.name;
                    lightSunHelper.category_name = 'lightHelper';
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
                        new THREE.SphereGeometry(0.5, 16, 8),
                        new THREE.MeshBasicMaterial({ color: colora })
                    ));

                    lightTargetSpot.isSelectableMesh = true;
                    lightTargetSpot.name = "lightTargetSpot_" + lightSun.name;
                    lightTargetSpot.asset_name = "lightTargetSpot_" + lightSun.asset_name;
                    lightTargetSpot.category_name = "lightTargetSpot";
                    lightTargetSpot.isLightTargetSpot = true;

                    lightTargetSpot.position.set(resource['targetposition'][0],
                        resource['targetposition'][1],
                        resource['targetposition'][2]);

                    lightTargetSpot.parentLight = lightSun;
                    lightTargetSpot.parentLightHelper = lightSunHelper;

                    lightSun.target.position.set(lightTargetSpot.position.x, lightTargetSpot.position.y,
                        lightTargetSpot.position.z);

                    envir.scene.add(lightTargetSpot);

                    //Create a helper for the shadow camera (optional)
                    var lightSunShadowhelper = new THREE.CameraHelper(lightSun.shadow.camera);
                    lightSunShadowhelper.name = "lightShadowHelper_" + lightSun.name;
                    envir.scene.add(lightSunShadowhelper);


                }
                else if (resource['category_name'] === 'lightLamp') {

                    var colora = new THREE.Color(resource['lightcolor'][0],
                        resource['lightcolor'][1],
                        resource['lightcolor'][2]);

                    var lightintensity = resource['lightintensity'];
                    var lightdecay = resource['lightdecay'];
                    var lightdistance = resource['lightdistance'];
                    // LIGHT
                    var lightLamp = new THREE.PointLight(colora, lightintensity, lightdistance, lightdecay);
                    lightLamp.intensity = lightintensity;

                    lightLamp.position.set(
                        resource['trs']['translation'][0],
                        resource['trs']['translation'][1],
                        resource['trs']['translation'][2]);

                    lightLamp.rotation.set(
                        resource['trs']['rotation'][0],
                        resource['trs']['rotation'][1],
                        resource['trs']['rotation'][2]);

                    lightLamp.scale.set(resource['trs']['scale'][0],
                        resource['trs']['scale'][1],
                        resource['trs']['scale'][2]);

                //     if(isNaN(resource['scale'][0]) && resource['scale'][0] !=0 && isNaN(resource['scale'][1]) && resource['scale'][1] !=0 && isNaN(resource['scale'][3]) && resource['scale'][3] !=0){
                //         lightLamp.scale.set(
                //        resource['scale'][0],
                //        resource['scale'][1],
                //        resource['scale'][2]);
                //    }else{
                //     lightLamp.scale.set(1,1,1);
                //    }
                    lightLamp.name = name;
                    lightLamp.asset_name = "mylightLamp";
                    lightLamp.category_name = "lightLamp";
                    lightLamp.isSelectableMesh = true;
                    lightLamp.isLight = true;
                    lightLamp.castShadow = true;
                    lightLamp.shadow.radius = parseFloat(resource['shadowRadius']);

                    lightLamp.locked = resource['locked'];
                    lightLamp.lampcastingShadow = resource['lampcastingShadow'];
                    lightLamp.lampshadowMapHeight = resource['lampshadowMapHeight'];
                    lightLamp.lampshadowMapWidth = resource['lampshadowMapWidth'];
                    lightLamp.lampshadowCameraTop = resource['lampshadowCameraTop'];
                    lightLamp.lampshadowCameraBottom = resource['lampshadowCameraBottom'];
                    lightLamp.lampshadowCameraLeft = resource['lampshadowCameraLeft'];
                    lightLamp.lampshadowCameraRight = resource['lampshadowCameraRight'];
                    lightLamp.lampshadowBias = resource['lampshadowBias'];

                    // if (lightLamp.children ==='') {
                    //     lightLamp.children = [];
                    // }


                    // console.log(lightLamp);
                    envir.scene.add(lightLamp);

                    // Add Lamp Sphere
                    var lampSphere = new THREE.Mesh(
                        new THREE.SphereGeometry(0.5, 16, 8),
                        new THREE.MeshBasicMaterial({ color: colora })
                    );
                    lampSphere.isSelectableMesh = false;
                    lampSphere.name = "LampSphere";
                    lightLamp.add(lampSphere);

                    // Helper
                    var lightLampHelper = new THREE.PointLightHelper(lightLamp, 1, colora);
                    lightLampHelper.isLightHelper = true;
                    lightLampHelper.name = 'lightHelper_' + lightLamp.name;
                    lightLampHelper.category_name = 'lightHelper';
                    lightLampHelper.parentLightName = lightLamp.name;
                    envir.scene.add(lightLampHelper);

               
                    //lightLampHelper.update();

                    
                    

                    // If we do not attach them, they are not visible in Editor !
                    // if (typeof transform_controls !== "undefined") {
                    //     if (typeof attachToControls !== "undefined") {
                            // attachToControls(name, envir.scene.getObjectByName(name));
                    //     }
                    // }


                }
                // SPOT
                else if (resource['category_name'] === 'lightSpot') {

                    var colora = new THREE.Color(0.996, 1, 0);

                    var lightintensity = resource['lightintensity'];
                    var lightdecay = resource['lightdecay'];
                    var lightdistance = resource['lightdistance'];
                    var lightangle = resource['lightangle'];
                    var lightpenumbra = resource['lightpenumbra'];

                    // LIGHT
                    var lightSpot = new THREE.SpotLight(colora, lightintensity, lightdistance, lightangle, lightpenumbra, lightdecay);
                    lightSpot.intensity = lightintensity;

                    lightSpot.position.set(
                        resource['trs']['translation'][0],
                        resource['trs']['translation'][1],
                        resource['trs']['translation'][2]);

                    lightSpot.rotation.set(
                        resource['trs']['rotation'][0],
                        resource['trs']['rotation'][1],
                        resource['trs']['rotation'][2]);

                    // lightSpot.scale.set(resource['trs']['scale'][0],
                    //     resource['trs']['scale'][1],
                    //     resource['trs']['scale'][2]);

                //     if(isNaN(resource['scale'][0]) && resource['scale'][0] !=0 && isNaN(resource['scale'][1]) && resource['scale'][1] !=0 && isNaN(resource['scale'][3]) && resource['scale'][3] !=0){
                //         lightSpot.scale.set(
                //        resource['scale'][0],
                //        resource['scale'][1],
                //        resource['scale'][2]);
                //    }else{
                    lightSpot.scale.set(1,1,1);
                //    }

                // lightSpot.target.position.set(resource['targetposition'][0],
                // resource['targetposition'][1],
                // resource['targetposition'][2]); // where it points




                    lightSpot.name = name;
                    lightSpot.asset_name = "mylightSpot";
                    lightSpot.category_name = "lightSpot";
                    lightSpot.isSelectableMesh = true;
                    lightSpot.isLight = true;
                    lightSpot.locked = resource['locked'];
                    

                    lightSpot.castShadow = true;

                    // lightSpot.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 50, 1, 0.5, 100 ) );
                    // lightSpot.shadow.bias = 0.0001;



                    // lightSpot.shadow.mapSize.width = 1024;
                    // lightSpot.shadow.mapSize.height = 1024;

                    //// Add Spot Sphere
                    var spotSphere = new THREE.Mesh(
                        new THREE.SphereGeometry(1, 16, 8),
                        new THREE.MeshBasicMaterial({ color: colora })
                    );
                    spotSphere.isSelectableMesh = true;
                    spotSphere.name = "SpotSphere";
                    lightSpot.add(spotSphere);
                    // end of sphere

                    var lightTargetSpot = new THREE.Object3D();

                    lightTargetSpot.add(new THREE.Mesh(
                        new THREE.SphereGeometry(0.5, 16, 8),
                        new THREE.MeshBasicMaterial({ color: colora })
                    ));

                    lightTargetSpot.isSelectableMesh = true;
                    lightTargetSpot.name = "lightTargetSpot_" + lightSpot.name;
                    lightTargetSpot.asset_name = "lightTargetSpot_" + lightSpot.asset_name;
                    lightTargetSpot.category_name = "lightTargetSpot";
                    lightTargetSpot.isLightTargetSpot = true;

                    lightTargetSpot.position.set(resource['targetposition'][0],
                        resource['targetposition'][1],
                        resource['targetposition'][2]);

                    lightTargetSpot.parentLight = lightSpot;
                    // lightTargetSpot.parentLightHelper = lightSpotHelper;

                    envir.scene.add(lightTargetSpot);

                    lightSpot.target.updateMatrixWorld();

                    lightSpot.target.position.set(lightTargetSpot.position.x, lightTargetSpot.position.y,
                        lightTargetSpot.position.z);

                    // Add Spot cone Helper
                    // var lightSpotHelper = new THREE.SpotLightHelper(lightSpot, colora);
                    // lightSpotHelper.isLightHelper = true;
                    // lightSpotHelper.name = 'lightHelper_' + lightSpot.name;
                    // lightSpotHelper.category_name = 'lightHelper';
                    // lightSpotHelper.parentLightName = lightSpot.name;

                    envir.scene.add(lightSpot);
                    triggerAutoSave();
                    // envir.scene.add(lightSpotHelper);

                    // lightSpotHelper.update();

                    // If we do not attach them, they are not visible in Editor !
                    // if (typeof transform_controls !== "undefined") {
                    //     if (typeof attachToControls !== "undefined") {
                    //         attachToControls(name, envir.scene.getObjectByName(name));
                    //     }
                    // }

                    // updateSpot();

                }
                else if (resource['category_name'] === 'lightAmbient') {

                    var colora = new THREE.Color(resource['lightcolor'][0],
                        resource['lightcolor'][1],
                        resource['lightcolor'][2]);

                    var lightintensity = resource['lightintensity'];

                    // LIGHT
                    var lightAmbient = new THREE.AmbientLight(colora, lightintensity);
                    lightAmbient.intensity = lightintensity;

                    lightAmbient.position.set(
                        resource['trs']['translation'][0],
                        resource['trs']['translation'][1],
                        resource['trs']['translation'][2]);

                    lightAmbient.rotation.set(
                        resource['trs']['rotation'][0],
                        resource['trs']['rotation'][1],
                        resource['trs']['rotation'][2]);

                    lightAmbient.scale.set(resource['trs']['scale'][0],
                        resource['trs']['scale'][1],
                        resource['trs']['scale'][2]);

                    // if(isNaN(resource['scale'][0]) && resource['scale'][0] !=0 && isNaN(resource['scale'][1]) && resource['scale'][1] !=0 && isNaN(resource['scale'][3]) && resource['scale'][3] !=0){
                    //     lightAmbient.scale.set(
                    //        resource['scale'][0],
                    //        resource['scale'][1],
                    //        resource['scale'][2]);
                    // }else{
                    //     lightAmbient.scale.set(1,1,1);
                    // }

          
                    //lightAmbient.scale.set(1,1,1);
                    lightAmbient.name = name;
                    lightAmbient.asset_name = "mylightAmbient";
                    lightAmbient.category_name = "lightAmbient";
                    lightAmbient.isSelectableMesh = true;
                    lightAmbient.isLight = true;
                    lightAmbient.locked = resource['locked'];


                    //// Add Sun Helper
                    var ambientSphere = new THREE.Mesh(
                        new THREE.SphereGeometry(1, 16, 8),
                        new THREE.MeshBasicMaterial({ color: colora })
                    );
                    ambientSphere.isSelectableMesh = true;
                    ambientSphere.name = "ambientSphere";
                    lightAmbient.add(ambientSphere);

                    envir.scene.add(lightAmbient);

                 

                    // If we do not attach them, they are not visible in Editor !
                    // if (typeof transform_controls !== "undefined") {
                    //     if (typeof attachToControls !== "undefined") {
                    //         attachToControls(name, envir.scene.getObjectByName(name));

                    //     }
                    // }

                }
                else if (resource['category_name'] === 'pawn') {

                    // Instantiate a loader
                    const loader = new THREE.GLTFLoader();

                    // Load a glTF resource
                    loader.load(
                        // resource URL
                        pluginPath + '/assets/pawn.glb',
                        // called when the resource is loaded
                        function (gltf) {

                            var pawn = gltf.scene.children[0];


                            pawn.position.set(
                                resource['trs']['translation'][0],
                                resource['trs']['translation'][1],
                                resource['trs']['translation'][2]);

                            pawn.rotation.set(
                                resource['trs']['rotation'][0],
                                resource['trs']['rotation'][1],
                                resource['trs']['rotation'][2]);

                            pawn.scale.set(
                                resource['trs']['scale'][0],
                                resource['trs']['scale'][1],
                                resource['trs']['scale'][2]);

                            pawn.name = name;
                            pawn.asset_name = "myActor";
                            pawn.category_name = "pawn";
                            pawn.isSelectableMesh = true;
                            pawn.isLight = false;

                            pawn.material.transparent = true;
                            pawn.material.opacity = 0.6;

                            // Give a number to Pawn
                            var indexPawn = 1;
                            for (let ch of envir.scene.children) {
                                if (ch.name.includes("Pawn")) {
                                    indexPawn += 1;
                                }
                            }

                            var pawnLabelDiv = document.createElement('div');
                            pawnLabelDiv.className = '';
                            pawnLabelDiv.textContent = 'Actor ' + indexPawn;
                            pawnLabelDiv.style.marginTop = '-1em';
                            pawnLabelDiv.style.fontSize = '26px';
                            pawnLabelDiv.style.color = "yellow";
                            //pawnLabelDiv.style.letterSpacing = '4px';
                            var pawnLabel = new THREE.CSS2DObject(pawnLabelDiv);
                            pawnLabel.position.set(0, 1.5, 0);
                            pawn.add(pawnLabel);
                            //pawnLabel.layers.set( 0 );

                            envir.scene.add(pawn);

                            // If we do not attach them, they are not visible in Editor !
                            // if (typeof transform_controls !== "undefined") {
                            //     if (typeof attachToControls !== "undefined") {
                            //         attachToControls(name, envir.scene.getObjectByName(name));
                            //     }
                            // }
                            setHierarchyViewer();

                        },
                        // called while loading is progressing
                        function (xhr) {
                            //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                        },
                        // called when loading has errors
                        function (error) {
                            console.log('An error happened while loading Pawn. Error 455');
                        }
                    );
                }
        }
    }
}
