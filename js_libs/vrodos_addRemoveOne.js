function addAssetToCanvas(nameModel, path, objFname, mtlFname, categoryName, dataDrag, translation, pluginPath) {

    // Add javascript variables for viewing the object correctly
    let selected_object_trs = {
        "translation": [translation[0], translation[1], translation[2]],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1]
    };


    resources3D[nameModel] = {
        "path": path,
        "assetid": dataDrag.assetid,
        "assetname": dataDrag.assetname,
        "glbID": dataDrag.glbID,
        "color": "",
        "audioID": dataDrag.audioID,
        "categoryName": dataDrag.categoryName,
        "categoryDescription": dataDrag.categoryDescription,
        "categoryIcon": dataDrag.categoryIcon,
        "categoryID": dataDrag.categoryID,
        "image1id": dataDrag.image1id,
        "videoTextureSrc": "",
        "videoTextureRepeatX": "1",
        "videoTextureRepeatY": "1",
        "videoTextureCenterX": "0",
        "videoTextureCenterY": "0",
        "videoTextureRotation": "0",
        "doorName_source": dataDrag.doorName_source,
        "doorName_target": dataDrag.doorName_target,
        "sceneName_target": dataDrag.sceneName_target,
        "sceneID_target": dataDrag.sceneID_target,
        "isreward": dataDrag.isreward,
        "isCloned": dataDrag.isCloned,
        "isJoker": dataDrag.isJoker,
        "trs": selected_object_trs
    };

    if (categoryName === 'lightSun') {


        var lightSun = new THREE.DirectionalLight(0xffffff, 1); //  new THREE.PointLight( 0xC0C090, 0.4, 1000, 0.01 );
        lightSun.castShadow = true;
        lightSun.shadowMapHeight = 200;
        lightSun.shadowMapWidth = 200;
        lightSun.name = nameModel;
        lightSun.assetname = "mylightSun";
        lightSun.isSelectableMesh = true;
        lightSun.categoryName = "lightSun";
        lightSun.isLight = true;

        //// Add Sun Helper
        var sunSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(1, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        sunSphere.isSelectableMesh = true;
        sunSphere.name = "SunSphere";
        lightSun.add(sunSphere);
        // end of sphere

        // Helper
        var lightSunHelper = new THREE.DirectionalLightHelper(lightSun, 3, 0x555500);
        lightSunHelper.isLightHelper = true;
        lightSunHelper.name = 'lightHelper_' + lightSun.name;
        lightSunHelper.categoryName = 'lightHelper';
        lightSunHelper.parentLightName = lightSun.name;

        // Target spot: Where Sun points
        var lightTargetSpot = new THREE.Object3D();

        lightTargetSpot.add(new THREE.Mesh(
            new THREE.SphereBufferGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
        ));

        lightTargetSpot.isSelectableMesh = true;
        lightTargetSpot.name = "lightTargetSpot_" + lightSun.name;
        lightTargetSpot.categoryName = "lightTargetSpot";
        lightTargetSpot.isLightTargetSpot = true;
        lightTargetSpot.isLight = false;
        lightTargetSpot.position = new THREE.Vector3(0, 0, 0);
        lightTargetSpot.parentLight = lightSun;
        lightTargetSpot.parentLightHelper = lightSunHelper;

        lightSun.target.position = lightTargetSpot.position;

        // Add shadow helper
        var lightSunShadowhelper = new THREE.CameraHelper(lightSun.shadow.camera);
        lightSunShadowhelper.name = "lightShadowHelper_" + lightSun.name;

        envir.scene.add(lightSun);
        envir.scene.add(lightSunHelper);
        envir.scene.add(lightTargetSpot);
        envir.scene.add(lightSunShadowhelper);

        lightSun.target.updateMatrixWorld();
        lightSunHelper.update();

        // Add transform controls
        var insertedObject = envir.scene.getObjectByName(nameModel);
        var trs_tmp = resources3D[nameModel]['trs'];

        trs_tmp['translation'][1] += 3; // Sun should be a little higher than objects;

        insertedObject.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        insertedObject.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        insertedObject.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);
        insertedObject.parent = envir.scene;

        // place controls to last inserted obj
        transform_controls.attach(insertedObject);

        // highlight
        envir.outlinePass.selectedObjects = [insertedObject];
        //envir.renderer.setClearColor(0xeeeeee, 1);
        //envir.scene.add(transform_controls);

        // Position
        transform_controls.object.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        transform_controls.object.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        transform_controls.object.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);

        selected_object_name = nameModel;

        setTransformControlsSize();


        //transform_controls.children[3].handleGizmos.XZY[0][0].visible = true; // DELETE GIZMO

        //transform_controls.children[3].children[0].children[1].visible = false; // ROTATE GIZMO


        // Add in scene
        addInHierarchyViewer(insertedObject);

        addInHierarchyViewer(lightTargetSpot);

        // Auto-save
        triggerAutoSave();

    }
    else if (categoryName === 'lightLamp') {

        var lightLamp = new THREE.PointLight(0xffffff, 1, 100, 2);


        lightLamp.name = nameModel;
        lightLamp.assetname = "mylightLamp";
        lightLamp.isSelectableMesh = true;
        lightLamp.categoryName = "lightLamp";
        lightLamp.isLight = true;
        lightLamp.castShadow = true;

        //// Add Lamp Helper
        var lampSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        lampSphere.isSelectableMesh = true;
        lampSphere.name = "LampSphere";
        lightLamp.add(lampSphere);
        // end of sphere

        // Helper
        var lightLampHelper = new THREE.PointLightHelper(lightLamp, 1, 0x555500);
        lightLampHelper.isLightHelper = true;
        lightLampHelper.name = 'lightHelper_' + lightLamp.name;
        lightLampHelper.categoryName = 'lightHelper';
        lightLampHelper.parentLightName = lightLamp.name;

        envir.scene.add(lightLamp);
        envir.scene.add(lightLampHelper);

        lightLampHelper.update();

        // Add transform controls
        var insertedObject = envir.scene.getObjectByName(nameModel);
        var trs_tmp = resources3D[nameModel]['trs'];

        trs_tmp['translation'][1] += 3; // Sun should be a little higher than objects;

        insertedObject.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        insertedObject.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        insertedObject.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);
        insertedObject.parent = envir.scene;

        // place controls to last inserted obj
        transform_controls.attach(insertedObject);

        // highlight
        envir.outlinePass.selectedObjects = [insertedObject];
        //envir.renderer.setClearColor(0xeeeeee, 1);
        //envir.scene.add(transform_controls);

        // Position
        transform_controls.object.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        transform_controls.object.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        transform_controls.object.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);

        selected_object_name = nameModel;

        // Dimensions
        setTransformControlsSize();
        // var dims = findDimensions(transform_controls.object);
        // var sizeT = Math.max(...dims);
        // transform_controls.setSize(sizeT > 1 ? sizeT : 1);


        //transform_controls.children[3].handleGizmos.XZY[0][0].visible = true; // DELETE GIZMO

        //transform_controls.children[3].children[0].children[1].visible = false; // ROTATE GIZMO

        // Add in scene
        addInHierarchyViewer(insertedObject);

        triggerAutoSave();

    }
    else if (categoryName === 'lightSpot') {

        var lightSpot = new THREE.SpotLight(0xffffff, 1, 5, 0.39, 0, 2);

        lightSpot.name = nameModel;
        lightSpot.assetname = "mylightSpot";
        lightSpot.isSelectableMesh = true;
        lightSpot.categoryName = "lightSpot";
        lightSpot.isLight = true;

        //// Add Lamp Helper
        var lampSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(1, 16, 8), //new THREE.ConeBufferGeometry(0.5, 1, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        lampSphere.rotation.set(Math.PI / 2, 0, 0);

        lampSphere.isSelectableMesh = true;
        lampSphere.name = "LampSphere";

        lightSpot.add(lampSphere);

        // end of sphere

        // Helper
        var lightSpotHelper = new THREE.SpotLightHelper(lightSpot, 0x555500);
        lightSpotHelper.isLightHelper = true;
        lightSpotHelper.name = 'lightHelper_' + lightSpot.name;
        lightSpotHelper.categoryName = 'lightHelper';
        lightSpotHelper.parentLightName = lightSpot.name;

        envir.scene.add(lightSpot);
        envir.scene.add(lightSpotHelper);

        lightSpotHelper.update();

        // Add transform controls
        var insertedObject = envir.scene.getObjectByName(nameModel);
        var trs_tmp = resources3D[nameModel]['trs'];

        trs_tmp['translation'][1] += 3; // Sun should be a little higher than objects;

        insertedObject.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        insertedObject.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        insertedObject.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);
        insertedObject.parent = envir.scene;

        // place controls to last inserted obj
        transform_controls.attach(insertedObject);

        // highlight
        envir.outlinePass.selectedObjects = [insertedObject];
        //envir.renderer.setClearColor(0xeeeeee, 1);
        //envir.scene.add(transform_controls);

        // Position
        transform_controls.object.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        transform_controls.object.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        transform_controls.object.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);

        selected_object_name = nameModel;

        // Dimensions
        setTransformControlsSize();
        // var dims = findDimensions(transform_controls.object);
        // var sizeT = Math.max(...dims);
        // transform_controls.setSize(sizeT > 1 ? sizeT : 1);

        //transform_controls.children[3].handleGizmos.XZY[0][0].visible = true; // DELETE GIZMO

        //transform_controls.children[3].children[0].children[1].visible = false; // ROTATE GIZMO

        // Add in scene
        addInHierarchyViewer(insertedObject);

        triggerAutoSave();


    } else if (categoryName === 'lightAmbient') {

        var lightAmbient = new THREE.AmbientLight(0xffffff, 1);

        lightAmbient.name = nameModel;
        lightAmbient.assetname = "mylightAmbient";
        lightAmbient.isSelectableMesh = true;
        lightAmbient.categoryName = "lightAmbient";
        lightAmbient.isLight = true;

        //// Add Lamp Helper
        var lampSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(1, 16, 8), //new THREE.ConeBufferGeometry(0.5, 1, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        lampSphere.rotation.set(Math.PI / 2, 0, 0);

        lampSphere.isSelectableMesh = true;
        lampSphere.name = "LampSphere";

        lightAmbient.add(lampSphere);

        envir.scene.add(lightAmbient);

        // Add transform controls
        var insertedObject = envir.scene.getObjectByName(nameModel);
        var trs_tmp = resources3D[nameModel]['trs'];

        trs_tmp['translation'][1] += 3; // Sun should be a little higher than objects;

        insertedObject.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        insertedObject.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        insertedObject.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);
        insertedObject.parent = envir.scene;

        // place controls to last inserted obj
        transform_controls.attach(insertedObject);

        // highlight
        envir.outlinePass.selectedObjects = [insertedObject];
        //envir.renderer.setClearColor(0xeeeeee, 1);
        //envir.scene.add(transform_controls);

        // Position
        transform_controls.object.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        transform_controls.object.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        transform_controls.object.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);

        selected_object_name = nameModel;

        // Dimensions
        setTransformControlsSize();
        // var dims = findDimensions(transform_controls.object);
        // var sizeT = Math.max(...dims);
        // transform_controls.setSize(sizeT > 1 ? sizeT : 1);

        //transform_controls.children[3].handleGizmos.XZY[0][0].visible = true; // DELETE GIZMO

        //transform_controls.children[3].children[0].children[1].visible = false; // ROTATE GIZMO

        // Add in scene
        addInHierarchyViewer(insertedObject);


        triggerAutoSave();

    } else if (categoryName === 'Pawn') {

        // Instantiate a loader
        const loader = new THREE.GLTFLoader();

        // Load a glTF resource
        loader.load(
            // resource URL
            pluginPath + '/assets/pawn.glb',
            // called when the resource is loaded
            function (gltf) {


                var Pawn = gltf.scene.children[0];
                Pawn.name = nameModel;
                Pawn.assetname = "myActor";
                Pawn.isSelectableMesh = true;
                Pawn.categoryName = "pawn";
                Pawn.isLight = false;


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
                //pawnLabelDiv.style.letterSpacing = '2px';
                var pawnLabel = new THREE.CSS2DObject(pawnLabelDiv);
                pawnLabel.position.set(0, 1.5, 0);
                Pawn.add(pawnLabel);
                //pawnLabel.layers.set( 0 );


                envir.scene.add(Pawn);

                // Add transform controls
                var insertedObject = envir.scene.getObjectByName(nameModel);

                var trs_tmp = resources3D[nameModel]['trs'];

                trs_tmp['translation'][1] += 3; // Sun should be a little higher than objects;

                insertedObject.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
                insertedObject.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
                insertedObject.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);
                insertedObject.parent = envir.scene;

                // place controls to last inserted obj
                transform_controls.attach(insertedObject);

                // highlight
                envir.outlinePass.selectedObjects = [insertedObject];
                //envir.renderer.setClearColor(0xeeeeee, 1);
                //envir.scene.add(transform_controls);

                // Position
                transform_controls.object.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
                transform_controls.object.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
                transform_controls.object.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);

                selected_object_name = nameModel;

                // Dimensions
                setTransformControlsSize();

                // Add in scene
                addInHierarchyViewer(insertedObject);

                // autosave
                triggerAutoSave();
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
    else {

        // Add a GLB object

        // Make progress bar visible
        jQuery("#progress").get(0).style.display = "block";
        jQuery("#progressWrapper").get(0).style.visibility = "visible";
        document.getElementById("result_download").innerHTML = "Loading";

        // Make a manager for the GLB
        var manager = new THREE.LoadingManager();

        // On progress messages
        manager.onProgress = function (item, loaded, total) {
            document.getElementById("result_download").innerHTML = resources3D[nameModel].assetname + " loading part " + loaded + " / " + total;
        };

        // When all are finished loading
        manager.onLoad = function () {

            let insertedObject = envir.scene.getObjectByName(nameModel);

            // Affine transformations
            var trs_tmp = resources3D[nameModel]['trs'];

            insertedObject.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
            insertedObject.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
            insertedObject.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);
            insertedObject.parent = envir.scene;

            // place controls to last inserted obj
            transform_controls.attach(insertedObject);

            // Make object gray if does not have any material
            if (insertedObject.children[0].isMesh) {
                if (isNaN(insertedObject.children[0].material.metalness)) {
                    let mat = insertedObject.children[0].material;
                    mat.metalness = 0;
                    mat.roughness = 0.5;
                    mat.emissiveIntensity = 0;
                    if (mat.color.r +
                        mat.color.g + mat.color.b === 0) {
                        mat.color = new THREE.Color("rgb(50%, 50%, 50%)");
                    }
                }
            }

            // highlight
            envir.composer = [];
            envir.setComposerAndPasses();
            envir.outlinePass.selectedObjects = [insertedObject];

            selected_object_name = nameModel;

            // Dimensions
            setTransformControlsSize();

            // Add in hierarchy browser
            addInHierarchyViewer(insertedObject);

            // Auto-save
            triggerAutoSave();

            // Hide progress dialogue
            jQuery("#progressWrapper").get(0).style.visibility = "hidden";
        };


        // Init downloading only the added model
        let loaderMulti = new VRodos_LoaderMulti();
        loaderMulti.load(manager, { [nameModel]: resources3D[nameModel] }, pluginPath);

        // envir.composer = [];
        // envir.setComposerAndPasses();
    }
}

/**
 *
 * Delete from scene
 *
 * @param nameToRemove
 */
function deleterFomScene(nameToRemove) {

    if (nameToRemove === "avatarCamera")
        return;

    delete resources3D[nameToRemove];

    // Get object (Child)
    var objectSelected = envir.scene.getObjectByName(nameToRemove);

    // remove animations
    isPaused = true;
    let filtered = envir.animationMixers.filter(function (el) {
        return el._root.name !== nameToRemove;
    });
    envir.animationMixers = filtered;
    isPaused = false;

    // If deleting light then remove also its LightHelper and lightTargetSpot and Shadow Helper
    if (objectSelected.isLight) {

        // Sun Shadow Helper
        envir.scene.remove(envir.scene.getObjectByName("lightShadowHelper_" + nameToRemove));

        // Sun target spot
        envir.scene.remove(envir.scene.getObjectByName("lightTargetSpot_" + nameToRemove));

        // Sun target spot remove from hierarchy viewer
        jQuery('#hierarchy-viewer').find('#' + "lightTargetSpot_" + nameToRemove).remove();

        // Light Helper (for all lights)
        envir.scene.remove(envir.scene.getObjectByName("lightHelper_" + nameToRemove));
    }

    transform_controls.detach(objectSelected);

    // prevent orbiting
    document.dispatchEvent(new CustomEvent("mouseup", { "detail": "Example of an event" }));

    // Remove object from scene
    envir.scene.remove(objectSelected);

    // Remove from hierarchy viewer
    jQuery('#hierarchy-viewer').find('#' + nameToRemove).remove();

    //transform_controls.detach();

    // Save scene
    triggerAutoSave();

    // // Only Player exists then hide delete button (single one)
    // if(envir.scene.children.length>5){
    //     let lastObject = envir.scene.children[envir.scene.children.length - 2];
    //
    //     // place controls to last inserted obj
    //     transform_controls.attach(lastObject);
    //
    //     envir.outlinePass.selectedObjects = [lastObject];
    //
    //     // highlight
    //     envir.composer = [];
    //     envir.setComposerAndPasses();
    // }
}




// function makeProducerPlane(){
//
//     var geometry = new THREE.Geometry();
//
//     geometry.vertices.push(
//         new THREE.Vector3( -50,  -50,  50 ),
//         new THREE.Vector3( -50,  -50, -50 ),
//         new THREE.Vector3(  50,  -50,  50 ),
//         new THREE.Vector3(  50,  -50, -50 ),
//     );
//
//     geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
//     geometry.faces.push( new THREE.Face3( 1, 2, 3 ) );
//
//
//     var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide, opacity: 0.5});
//     material.opacity = 0.2;
//     var plane = new THREE.Mesh( geometry, material );
//
//     return plane;
//
// }




// /**
//  *    ----------- Check for Recycle Bin Drag ----------------------------
//  */
// function checkForRecycle(){
//
//     var raycasterRecycleBin = new THREE.Raycaster();
//     var mouseDrag = new THREE.Vector2();
//
//     // handle scrolling of window
//     var offtop = envir.vr_editor_main_div.getBoundingClientRect().top;
//     var offleft =envir.vr_editor_main_div.getBoundingClientRect().left;
//
//     // translate into -1 to 1 values
//     mouseDrag.x =   ( (event.clientX - offleft)  / envir.vr_editor_main_div.clientWidth ) * 2 - 1;
//     mouseDrag.y = - ( (event.clientY - offtop) / envir.vr_editor_main_div.clientHeight ) * 2 + 1;
//
//     // calculate objects intersecting the picking ray
//     raycasterRecycleBin.setFromCamera( mouseDrag, envir.cameraOrbit );
//
//     var intersects = raycasterRecycleBin.intersectObjects( [envir.cameraOrbit.children[0]], false );
//
//     if(intersects.length>0)
//         putInRecyleBin(transform_controls.object.name);
// }
//
// /**
//  *
//  * -- Put in recycle bin --
//  *
//  * @param nameToRemove
//  */
// function putInRecyleBin(nameToRemove){
//
//     var container = document.paramsform;
//
//     // Delete Variables
//     delArchive[nameToRemove] = resources3D[nameToRemove];
//     delete resources3D[nameToRemove];
//
//     // Remove from scene and add to recycle bin
//     var objectSelected = envir.scene.getObjectByName(nameToRemove);
//
//     transform_controls.detach(objectSelected);
//
//     // prevent orbiting
//     document.dispatchEvent(new CustomEvent("mouseup", { "detail": "Example of an event" }));
//
//     envir.scene.remove(objectSelected);
//     objectSelected.position.set(0,0,0);
//
//     var bbox = new THREE.Box3().setFromObject(objectSelected);
//
//     var scale_factor_x = 2/(bbox.max.x - bbox.min.x);
//     var scale_factor_y = 2/(bbox.max.y - bbox.min.y);
//     var scale_factor_z = 2/(bbox.max.z - bbox.min.z);
//
//     if (scale_factor_x > 1000)
//         scale_factor_x = 1;
//
//     if (scale_factor_y > 1000)
//         scale_factor_y = 1;
//
//     if (scale_factor_z > 1000)
//         scale_factor_z = 1;
//
//
//     objectSelected.scale.set(scale_factor_x, scale_factor_y, scale_factor_z);
//     objectSelected.isInRecycleBin = true;
//
//     // Removed items are added to the cameraOrbit ??? Find something better
//     envir.cameraOrbit.children[0].add(objectSelected);
//
//     // Make trs box visible - invisible
//     //if (obj_ARR.length > 0) {
//     //    transform_controls.attach(obj_ARR[0]);
//     //    transform_controls.traverse(function(node){if(node.name=='trs_modeChanger') node.visible=true});
//     //}else
//     //    transform_controls.traverse(function(node){if(node.name=='trs_modeChanger') node.visible=false});
//
// }
//
//
// /**
//  * Expand items from recycle bin
//  *
//  */
// function enlistDeletedObjects(){
//
//     for(var i=0; i < envir.cameraOrbit.children[0].children.length; i++){
//         if (envir.cameraOrbit.children[0].children[i] instanceof THREE.Group){
//             var recycledItem = envir.cameraOrbit.children[0].children[i];
//             recycledItem.position.set(0, (i+1)*4, 0);
//             recycledItem.isInRecycleBin = true;
//         }
//     }
//
//     isRecycleBinDeployed = true;
// }
//
// /**
//  *   Collapse items in recycle bin
//  *
//  */
// function delistDeletedObjects(){
//
//     for(var i=0; i < envir.cameraOrbit.children[0].children.length; i++){
//         if (envir.cameraOrbit.children[0].children[i] instanceof THREE.Group){
//             var recycledItem = envir.cameraOrbit.children[0].children[i];
//             recycledItem.position.set(0,0,0);
//             recycledItem.isInRecycleBin = true;
//         }
//     }
//
//     isRecycleBinDeployed = false;
// }


