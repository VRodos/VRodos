/**
 * Created by DIMITRIOS on 7/3/2022.
 */

"use strict";

class VRodos_LightsPawn_Loader {



    constructor(who){
    };

    load(resources3D) {

        // Lights and Scene Settings loop
        for (let n in resources3D) {
            (function (name) {

                if(name === 'fogtype' || name === 'fogcolor' || name === 'fognear' || name === 'fogfar' || name === 'fogdensity') {



                    if( resources3D[name] === 'linear'){

                        console.log("resources3D['fogcolor']", resources3D['fogcolor']);

                        // envir.scene.fog = new THREE.Fog( resources3D['fogcolor'], parseFloat(resources3D['fognear']), parseFloat(resources3D['fogfar']) );
                    } else if( resources3D[name] === 'exponential') {


                        //envir.scene.fog = new THREE.FogExp2( resources3D['fogcolor'], parseFloat(resources3D['fogdensity']) );
                    }


                    return;
                }




                // Scene Settings
                if(name === 'ClearColor') {

                    //console.log("resources3D['ClearColor']", resources3D['ClearColor']);

                    envir.scene.background = new THREE.Color(resources3D['ClearColor']);             // this.isBackGroundNull ? null : new THREE.Color(this.back_3d_color);

                    //envir.renderer.setClearColor(resources3D['ClearColor']);

                    if(document.getElementById('sceneClearColor')) {
                        document.getElementById('sceneClearColor').value = resources3D['ClearColor'];
                    }
                    if(document.getElementById('jscolorpick')) {
                        document.getElementById('jscolorpick').value = resources3D['ClearColor'];
                    }
                    return;
                }

                if(name === 'toneMappingExposure') {

                    let toneMappingExposure =  parseFloat(resources3D['toneMappingExposure']);
                    envir.renderer.toneMappingExposure = toneMappingExposure;

                    if(document.getElementById('rendererToneMapping')) {
                        document.getElementById('rendererToneMapping').value = toneMappingExposure;
                    }

                    return;
                }


                if(name === 'enableEnvironmentTexture') {

                    let enableEnvironmentTexture = (resources3D['enableEnvironmentTexture'] === 'true');

                    envir.scene.environment = enableEnvironmentTexture ? envir.maintexture : "";

                    if(document.getElementById('sceneEnvironmentTexture')) {
                        document.getElementById('sceneEnvironmentTexture').checked = enableEnvironmentTexture;
                    }

                    return;
                }


                var clearToParse = resources3D[name]['categoryName'].startsWith("light") || resources3D[name]['categoryName'].startsWith("pawn");

                if(!clearToParse)
                    return;

                if (resources3D[name]['categoryName']==='lightSun'){

                    var colora = new THREE.Color(resources3D[name]['lightcolor'][0],
                        resources3D[name]['lightcolor'][1],
                        resources3D[name]['lightcolor'][2]);

                    var lightintensity = resources3D[name]['lightintensity'];

                    // LIGHT
                    var lightSun = new THREE.DirectionalLight( colora, lightintensity ); //  new THREE.PointLight( 0xC0C090, 0.4, 1000, 0.01 );
                    //lightSun.castShadow = true;

                    //Set up shadow properties for the light
                    lightSun.shadow.camera.near = 0.5;    // default
                    lightSun.shadow.camera.far = 500;     // default

                    // REM HERE
                    lightSun.position.set(resources3D[name]['trs']['translation'][0],
                        resources3D[name]['trs']['translation'][1],
                        resources3D[name]['trs']['translation'][2] );

                    lightSun.rotation.set(
                        resources3D[name]['trs']['rotation'][0],
                        resources3D[name]['trs']['rotation'][1],
                        resources3D[name]['trs']['rotation'][2] );

                    lightSun.scale.set( resources3D[name]['trs']['scale'][0],
                        resources3D[name]['trs']['scale'][1],
                        resources3D[name]['trs']['scale'][2]);


                    lightSun.target.position.set(resources3D[name]['targetposition'][0],
                        resources3D[name]['targetposition'][1],
                        resources3D[name]['targetposition'][2]); // where it points

                    //console.log("name", name);

                    lightSun.name = name;
                    lightSun.assetname = "mylightSun";
                    lightSun.categoryName = "lightSun";
                    lightSun.isSelectableMesh = true;
                    lightSun.isLight = true;

                    lightSun.castShadow = true;


                    lightSun.shadow.camera.near = 0.5;
                    lightSun.shadow.camera.far = 1000;

                    lightSun.shadow.camera.left = -30;
                    lightSun.shadow.camera.right = 30;
                    lightSun.shadow.camera.top = 30;
                    lightSun.shadow.camera.bottom = -30;

                    //// Add Sun Helper
                    var sunSphere = new THREE.Mesh(
                        new THREE.SphereBufferGeometry( 1, 16, 8 ),
                        new THREE.MeshBasicMaterial( { color: colora } )
                    );
                    sunSphere.isSelectableMesh = true;
                    sunSphere.name = "SunSphere";
                    lightSun.add(sunSphere);



                    // lightSun.shadow.mapSize.width = 200;
                    // lightSun.shadow.mapSize.height = 200;




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

                    lightTargetSpot.isSelectableMesh = true;
                    lightTargetSpot.name = "lightTargetSpot_" + lightSun.name;
                    lightTargetSpot.assetname = "lightTargetSpot_" + lightSun.assetname;
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
                    lightSunShadowhelper.name = "lightShadowHelper_" + lightSun.name;
                    envir.scene.add( lightSunShadowhelper );




                }
                else if (resources3D[name]['categoryName']==='lightLamp'){

                    var colora = new THREE.Color(resources3D[name]['lightcolor'][0],
                        resources3D[name]['lightcolor'][1],
                        resources3D[name]['lightcolor'][2]);

                    var lightintensity = resources3D[name]['lightintensity'];
                    var lightdecay = resources3D[name]['lightdecay'];
                    var lightdistance = resources3D[name]['lightdistance'];
                    // LIGHT
                    var lightLamp = new THREE.PointLight(colora, lightintensity, lightdistance, lightdecay);
                    lightLamp.intensity = lightintensity;

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
                    lightLamp.assetname = "mylightLamp";
                    lightLamp.categoryName = "lightLamp";
                    lightLamp.isSelectableMesh = true;
                    lightLamp.isLight = true;
                    lightLamp.castShadow = true;
                    lightLamp.shadow.radius = parseFloat( resources3D[name]['shadowRadius'] );

                    envir.scene.add(lightLamp);

                    // Add Lamp Sphere
                    var lampSphere = new THREE.Mesh(
                        new THREE.SphereBufferGeometry(0.5, 16, 8),
                        new THREE.MeshBasicMaterial({color: colora})
                    );
                    lampSphere.isSelectableMesh = false;
                    lampSphere.name = "LampSphere";
                    lightLamp.add(lampSphere);

                    // Helper
                    var lightLampHelper = new THREE.PointLightHelper(lightLamp, 1, colora);
                    lightLampHelper.isLightHelper = true;
                    lightLampHelper.name = 'lightHelper_' + lightLamp.name;
                    lightLampHelper.categoryName = 'lightHelper';
                    lightLampHelper.parentLightName = lightLamp.name;
                    envir.scene.add(lightLampHelper);
                    lightLampHelper.update();

                    // If we do not attach them, they are not visible in Editor !
                    if (typeof transform_controls !== "undefined") {
                        if (typeof attachToControls !== "undefined") {
                            attachToControls(name, envir.scene.getObjectByName(name));
                        }
                    }

                }
                // SPOT
                else if (resources3D[name]['categoryName']==='lightSpot')
                {

                    var colora = new THREE.Color(resources3D[name]['lightcolor'][0],
                        resources3D[name]['lightcolor'][1],
                        resources3D[name]['lightcolor'][2]);

                    var lightintensity = resources3D[name]['lightintensity'];
                    var lightdecay = resources3D[name]['lightdecay'];
                    var lightdistance = resources3D[name]['lightdistance'];
                    var lightangle = resources3D[name]['lightangle'];
                    var lightpenumbra = resources3D[name]['lightpenumbra'];

                    // LIGHT
                    var lightSpot = new THREE.SpotLight(colora, lightintensity, lightdistance, lightangle, lightpenumbra, lightdecay);
                    lightSpot.intensity = lightintensity;

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
                    lightSpot.assetname = "mylightSpot";
                    lightSpot.categoryName = "lightSpot";
                    lightSpot.isSelectableMesh = true;
                    lightSpot.isLight = true;

                    lightSpot.castShadow = true;

                    // lightSpot.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 50, 1, 0.5, 100 ) );
                    // lightSpot.shadow.bias = 0.0001;



                    // lightSpot.shadow.mapSize.width = 1024;
                    // lightSpot.shadow.mapSize.height = 1024;

                    //// Add Spot Sphere
                    var spotSphere = new THREE.Mesh(
                        new THREE.SphereBufferGeometry( 1, 16, 8 ),
                        new THREE.MeshBasicMaterial({color: colora})
                    );
                    spotSphere.isSelectableMesh = true;
                    spotSphere.name = "SpotSphere";
                    lightSpot.add(spotSphere);
                    // end of sphere

                    // Add Spot cone Helper
                    var lightSpotHelper = new THREE.SpotLightHelper(lightSpot, colora);
                    lightSpotHelper.isLightHelper = true;
                    lightSpotHelper.name = 'lightHelper_' + lightSpot.name;
                    lightSpotHelper.categoryName = 'lightHelper';
                    lightSpotHelper.parentLightName = lightSpot.name;

                    envir.scene.add(lightSpot);
                    envir.scene.add(lightSpotHelper);

                    lightSpotHelper.update();

                    // If we do not attach them, they are not visible in Editor !
                    if (typeof transform_controls !== "undefined") {
                        if (typeof attachToControls !== "undefined") {
                            attachToControls(name, envir.scene.getObjectByName(name));
                        }
                    }

                    updateSpot();



                }
                else if (resources3D[name]['categoryName']==='lightAmbient')
                {

                    //console.log("resources3D", resources3D);

                    var colora = new THREE.Color(resources3D[name]['lightcolor'][0],
                                                 resources3D[name]['lightcolor'][1],
                                                 resources3D[name]['lightcolor'][2]);

                    var lightintensity = resources3D[name]['lightintensity'];

                    // LIGHT
                    var lightAmbient = new THREE.AmbientLight(colora, lightintensity);
                    lightAmbient.intensity = lightintensity;

                    lightAmbient.position.set(
                        resources3D[name]['trs']['translation'][0],
                        resources3D[name]['trs']['translation'][1],
                        resources3D[name]['trs']['translation'][2] );

                    lightAmbient.rotation.set(
                        resources3D[name]['trs']['rotation'][0],
                        resources3D[name]['trs']['rotation'][1],
                        resources3D[name]['trs']['rotation'][2] );

                    lightAmbient.scale.set( resources3D[name]['trs']['scale'],
                                            resources3D[name]['trs']['scale'],
                                            resources3D[name]['trs']['scale']);

                    lightAmbient.name = name;
                    lightAmbient.assetname = "mylightAmbient";
                    lightAmbient.categoryName = "lightAmbient";
                    lightAmbient.isSelectableMesh = true;
                    lightAmbient.isLight = true;


                    //// Add Sun Helper
                    var ambientSphere = new THREE.Mesh(
                        new THREE.SphereBufferGeometry( 1, 16, 8 ),
                        new THREE.MeshBasicMaterial( { color: colora } )
                    );
                    ambientSphere.isSelectableMesh = true;
                    ambientSphere.name = "ambientSphere";
                    lightAmbient.add(ambientSphere);



                    envir.scene.add(lightAmbient);


                    // If we do not attach them, they are not visible in Editor !
                    if (typeof transform_controls !== "undefined") {
                        if (typeof attachToControls !== "undefined") {
                            attachToControls(name, envir.scene.getObjectByName(name));

                        }
                    }

                }
                else if (resources3D[name]['categoryName']==='pawn'){

                    // Instantiate a loader
                    const loader = new THREE.GLTFLoader();

                    // Load a glTF resource
                    loader.load(
                        // resource URL
                        pluginPath + '/assets/pawn.glb',
                        // called when the resource is loaded
                        function ( gltf ) {

                            var pawn = gltf.scene.children[0];


                            pawn.position.set(
                                resources3D[name]['trs']['translation'][0],
                                resources3D[name]['trs']['translation'][1],
                                resources3D[name]['trs']['translation'][2] );

                            pawn.rotation.set(
                                resources3D[name]['trs']['rotation'][0],
                                resources3D[name]['trs']['rotation'][1],
                                resources3D[name]['trs']['rotation'][2] );

                            pawn.scale.set( resources3D[name]['trs']['scale'],
                                resources3D[name]['trs']['scale'],
                                resources3D[name]['trs']['scale']);

                            pawn.name = name;
                            pawn.assetname = "myActor";
                            pawn.categoryName = "pawn";
                            pawn.isSelectableMesh = true;
                            pawn.isLight = false;

                            pawn.material.transparent = true;
                            pawn.material.opacity = 0.6;

                            // Give a number to Pawn
                            var indexPawn=1;
                            for (let ch of envir.scene.children){
                                if (ch.name.includes("Pawn")){
                                    indexPawn += 1;
                                }
                            }


                            var pawnLabelDiv = document.createElement( 'div' );
                            pawnLabelDiv.className = '';
                            pawnLabelDiv.textContent = 'Actor ' +  indexPawn;
                            pawnLabelDiv.style.marginTop = '-1em';
                            pawnLabelDiv.style.fontSize = '26px';
                            pawnLabelDiv.style.color = "yellow";
                            //pawnLabelDiv.style.letterSpacing = '4px';
                            var pawnLabel = new THREE.CSS2DObject( pawnLabelDiv );
                            pawnLabel.position.set( 0, 1.5, 0 );
                            pawn.add( pawnLabel );
                            //pawnLabel.layers.set( 0 );



                            envir.scene.add(pawn);

                            // If we do not attach them, they are not visible in Editor !
                            if (typeof transform_controls !== "undefined") {
                                if (typeof attachToControls !== "undefined") {
                                    attachToControls(name, envir.scene.getObjectByName(name));
                                }
                            }

                            setHierarchyViewer();

                        },
                        // called while loading is progressing
                        function ( xhr ) {
                            //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                        },
                        // called when loading has errors
                        function ( error ) {
                            console.log( 'An error happened while loading Pawn. Error 455');
                        }
                    );




            }



            })(n);
        }




    }


}
