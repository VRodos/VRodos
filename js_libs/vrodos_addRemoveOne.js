function addAssetToCanvas(nameModel, path, categoryName, dataDrag, translation, pluginPath) {

    // Add javascript variables for viewing the object correctly
    let selected_object_trs = {
        "translation": [translation[0], translation[1], translation[2]],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1]
    };

    vrodos_scene_data.objects[nameModel] = {
        "path": path,
        "trs": selected_object_trs,
        "fnPath": path ? path.substring(path.lastIndexOf('/') + 1) : '',
        "asset_name": nameModel,
        "category_name": categoryName,
        "isLight": categoryName.includes("light"),
    };

    for (let entry in Object.keys(dataDrag)) {
        vrodos_scene_data.objects[nameModel][Object.keys(dataDrag)[entry]] = Object.values(dataDrag)[entry];
    }
    
    if (categoryName === 'lightSun') {

        let lightSun = new THREE.DirectionalLight(0xffffff, 1); //  new THREE.PointLight( 0xC0C090, 0.4, 1000, 0.01 );
        lightSun.castShadow = true;
        lightSun.sunSky = true;
        lightSun.castingShadow = true;
        lightSun.shadowMapHeight = "1024";
        lightSun.shadowMapWidth = "1024";
        lightSun.shadowCameraTop = "200";
        lightSun.shadowCameraBottom = "-200";
        lightSun.shadowCameraLeft = "-200";
        lightSun.shadowCameraRight = "200";
        lightSun.shadowBias = "-0.001";
        lightSun.defaultColor = "0xffff00";
        lightSun.castingShadow = true;
        lightSun.name = nameModel;
        lightSun['asset_name'] = "mylightSun";
        lightSun.isSelectableMesh = true;
        lightSun['category_name'] = "lightSun";
        lightSun['category_slug'] = "lightSun";
        lightSun.isLight = true;

        let hexcol = "0xffff00";

        //// Add Sun Helper
        let sunSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(1, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        sunSphere.isSelectableMesh = true;
        sunSphere.name = "SunSphere";
        lightSun.add(sunSphere);
        // end of sphere

        // Helper
        let lightSunHelper = new THREE.DirectionalLightHelper(lightSun, 3, 0x555500);
        lightSunHelper.isLightHelper = true;
        lightSunHelper.name = 'lightHelper_' + lightSun.name;
        lightSunHelper['category_name'] = 'lightHelper';
        lightSunHelper.parentLightName = lightSun.name;

        // Target spot: Where Sun points
        let lightTargetSpot = new THREE.Object3D();

        lightTargetSpot.add(new THREE.Mesh(
            new THREE.SphereBufferGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
        ));

        lightTargetSpot.isSelectableMesh = true;
        lightTargetSpot.name = "lightTargetSpot_" + lightSun.name;
        lightTargetSpot['category_name'] = "lightTargetSpot";
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
        let insertedObject = envir.scene.getObjectByName(nameModel);
        let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

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

        document.getElementById('numerical_gui-container').style.display="block";
        setDatGuiInitialVales(envir.scene.getObjectByProperty( 'uuid' , insertedObject.uuid));

        //transform_controls.children[3].handleGizmos.XZY[0][0].visible = true; // DELETE GIZMO
        //transform_controls.children[3].children[0].children[1].visible = false; // ROTATE GIZMO

        // Add in scene
        addInHierarchyViewer(insertedObject);
        addInHierarchyViewer(lightTargetSpot);

        // Auto-save
       

        transform_controls.object.color.setHex(hexcol);

        // Sun as Sphere
        transform_controls.object.children[0].material.color.setHex(hexcol);

        // Sun Helper
        let lightHelper = envir.scene.getObjectByName("lightHelper_" + transform_controls.object.name);
        lightHelper.children[0].material.color.setHex(hexcol);
        lightHelper.children[1].material.color.setHex(hexcol);

        // TargetSpot
        lightTargetSpot = envir.scene.getObjectByName("lightTargetSpot_" + transform_controls.object.name);
        lightTargetSpot.children[0].material.color.setHex(hexcol);

        triggerAutoSave();

    }
    else if (categoryName === 'lightLamp') {

        let lightLamp = new THREE.PointLight(0xffffff, 1, 100, 2);

        lightLamp.name = nameModel;
        lightLamp['asset_name'] = "mylightLamp";
        lightLamp.isSelectableMesh = true;
        lightLamp['category_name'] = "lightLamp";
        lightLamp.isLight = true;
        lightLamp.castShadow = true;

        lightLamp.lampcastingShadow = true;
        lightLamp.lampshadowMapHeight = "1024";
        lightLamp.lampshadowMapWidth = "1024";
        lightLamp.lampshadowCameraTop = "200";
        lightLamp.lampshadowCameraBottom = "-200";
        lightLamp.lampshadowCameraLeft = "-200";
        lightLamp.lampshadowCameraRight = "200";
        lightLamp.lampshadowBias = "-0.001";
        
        let hexcol = "0xffff00";
        //// Add Lamp Helper
        let lampSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        lampSphere.isSelectableMesh = true;
        lampSphere.name = "LampSphere";
        lightLamp.add(lampSphere);
        // end of sphere

        // Helper
        let lightLampHelper = new THREE.PointLightHelper(lightLamp, 1, 0x555500);
        lightLampHelper.isLightHelper = true;
        lightLampHelper.name = 'lightHelper_' + lightLamp.name;
        lightLampHelper['category_name'] = 'lightHelper';
        lightLampHelper.parentLightName = lightLamp.name;

        envir.scene.add(lightLamp);
        envir.scene.add(lightLampHelper);

        lightLampHelper.update();

        // Add transform controls
        let insertedObject = envir.scene.getObjectByName(nameModel);
        let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

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
        transform_controls.object.color.setHex(hexcol);
        transform_controls.object.power = 10;
        

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

        document.getElementById('numerical_gui-container').style.display="block";
        setDatGuiInitialVales(envir.scene.getObjectByProperty( 'uuid' , insertedObject.uuid));


        //transform_controls.children[3].handleGizmos.XZY[0][0].visible = true; // DELETE GIZMO

        //transform_controls.children[3].children[0].children[1].visible = false; // ROTATE GIZMO

        // Add in scene
        addInHierarchyViewer(insertedObject);

        triggerAutoSave();

    }
    else if (categoryName === 'lightSpot') {

        let lightSpot = new THREE.SpotLight(0xffffff, 1, 5, 0.39, 0, 2);

        lightSpot.name = nameModel;
        lightSpot['asset_name'] = "mylightSpot";
        lightSpot.isSelectableMesh = true;
        lightSpot['category_name'] = "lightSpot";
        lightSpot.isLight = true;

        let lightTargetSpot = new THREE.Object3D();

        lightTargetSpot.add(new THREE.Mesh(
            new THREE.SphereBufferGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
        ));

        let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];


        //// Add Lamp Helper
        let lampSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(1, 16, 8), //new THREE.ConeBufferGeometry(0.5, 1, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        lampSphere.rotation.set(Math.PI / 2, 0, 0);

        lampSphere.isSelectableMesh = true;
        lampSphere.name = "LampSphere";

        lightSpot.add(lampSphere);

        // end of sphere

        // Helper
        // let lightSpotHelper = new THREE.SpotLightHelper(lightSpot, 0x555500);
        // lightSpotHelper.isLightHelper = true;
        // lightSpotHelper.name = 'lightHelper_' + lightSpot.name;
        // lightSpotHelper['category_name'] = 'lightHelper';
        // lightSpotHelper.parentLightName = lightSpot.name;

        
        lightTargetSpot.isSelectableMesh = true;
        lightTargetSpot.name = "lightTargetSpot_" + lightSpot.name;
        lightTargetSpot['category_name'] = "lightTargetSpot";
        lightTargetSpot.isLightTargetSpot = true;
        lightTargetSpot.isLight = false;
        lightTargetSpot.position = new THREE.Vector3(0,0,0);
        lightTargetSpot.parentLight = lightSpot;
        // lightTargetSpot.parentLightHelper = lightSpotHelper;

        lightSpot.target.position = lightTargetSpot.position;


        envir.scene.add(lightSpot);
        // envir.scene.add(lightSpotHelper);
        envir.scene.add(lightTargetSpot);

        lightSpot.target.updateMatrixWorld();
        // lightSpotHelper.update();

        // Add transform controls
        let insertedObject = envir.scene.getObjectByName(nameModel);
        let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

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

        document.getElementById('numerical_gui-container').style.display="block";
        setDatGuiInitialVales(envir.scene.getObjectByProperty( 'uuid' , insertedObject.uuid));
        // var dims = findDimensions(transform_controls.object);
        // var sizeT = Math.max(...dims);
        // transform_controls.setSize(sizeT > 1 ? sizeT : 1);

        //transform_controls.children[3].handleGizmos.XZY[0][0].visible = true; // DELETE GIZMO

        //transform_controls.children[3].children[0].children[1].visible = false; // ROTATE GIZMO

        // Add in scene
        addInHierarchyViewer(insertedObject);
        addInHierarchyViewer(lightTargetSpot);

        lightTargetSpot = envir.scene.getObjectByName("lightTargetSpot_" + transform_controls.object.name);

        triggerAutoSave();


    } else if (categoryName === 'lightAmbient') {

        let lightAmbient = new THREE.AmbientLight(0xffffff, 1);

        lightAmbient.name = nameModel;
        lightAmbient['asset_name'] = "mylightAmbient";
        lightAmbient.isSelectableMesh = true;
        lightAmbient['category_name'] = "lightAmbient";
        lightAmbient.isLight = true;

        //// Add Lamp Helper
        let lampSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(1, 16, 8), //new THREE.ConeBufferGeometry(0.5, 1, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        lampSphere.rotation.set(Math.PI / 2, 0, 0);

        lampSphere.isSelectableMesh = true;
        lampSphere.name = "LampSphere";

        lightAmbient.add(lampSphere);

        envir.scene.add(lightAmbient);

        // Add transform controls
        let insertedObject = envir.scene.getObjectByName(nameModel);
        let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

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


                let Pawn = gltf.scene.children[0];
                Pawn.name = nameModel;
                Pawn['asset_name'] = "myActor";
                Pawn.isSelectableMesh = true;
                Pawn['category_name'] = "pawn";
                Pawn.isLight = false;


                // Give a number to Pawn
                let indexPawn = 1;
                for (let ch of envir.scene.children) {
                    if (ch.name.includes("Pawn")) {
                        indexPawn += 1;
                    }
                }


                let pawnLabelDiv = document.createElement('div');
                pawnLabelDiv.className = '';
                pawnLabelDiv.textContent = 'Actor ' + indexPawn;
                pawnLabelDiv.style.marginTop = '-1em';
                pawnLabelDiv.style.fontSize = '26px';
                pawnLabelDiv.style.color = "yellow";
                //pawnLabelDiv.style.letterSpacing = '2px';
                let pawnLabel = new THREE.CSS2DObject(pawnLabelDiv);
                pawnLabel.position.set(0, 1.5, 0);
                Pawn.add(pawnLabel);
                //pawnLabel.layers.set( 0 );


                envir.scene.add(Pawn);

                // Add transform controls
                let insertedObject = envir.scene.getObjectByName(nameModel);

                let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

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
        let manager = new THREE.LoadingManager();
        // On progress messages
        manager.onProgress = function (item, loaded, total) {
            document.getElementById("result_download").innerHTML = vrodos_scene_data.objects[nameModel]['asset_name'] + " loading part " + loaded + " / " + total;
        };


        // When all are finished loading
        manager.onLoad = function () {

            let insertedObject = envir.scene.getObjectByName(nameModel);

            // Affine transformations
            let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

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

            //document.getElementById('numerical_gui-container').style.visibility = 'visible';
            document.getElementById('numerical_gui-container').style.display="block";
            setDatGuiInitialVales(envir.scene.getObjectByProperty( 'uuid' , insertedObject.uuid));
            // Hide progress dialogue
            jQuery("#progressWrapper").get(0).style.visibility = "hidden";
        };


        // Init downloading only the added model
        let loaderMulti = new VRodos_LoaderMulti();
        loaderMulti.load(manager, { [nameModel]: vrodos_scene_data.objects[nameModel] }, pluginPath);

        // envir.composer = [];
        // envir.setComposerAndPasses();
    }
}


function deleteFomScene(uuid, name) {

    if (name) {
        document.getElementById("confirm-asset-deletion-title").innerHTML = 'Delete ' + name + '?';
        document.getElementById("confirm-asset-deletion-description").innerHTML = 'Do you really want to delete the asset named <b>' + name + '</b>?';
    }

    let delete_dialog_element = new mdc.dialog.MDCDialog(document.querySelector('#confirm-deletion-dialog'));
    let closeDialogListener = function(event) {
        delete_dialog_element.unlisten("MDCDialog:cancel", closeDialogListener);
    };
    delete_dialog_element.show();
    delete_dialog_element.listen("MDCDialog:cancel", closeDialogListener);

    let delUuid = uuid;
    let selUuid;
    if( typeof(transform_controls.object) != "undefined" )
        selUuid = transform_controls.object.uuid;
    else
        selUuid = "unassigned";
    // var selUuid = (typeof checkUuid != "undefined") ? checkUuid : "unassigned";
    let delete_btn_element = document.getElementById("delete-asset-btn-confirmation");
    delete_btn_element.addEventListener('click', function() {
        transform_controls.detach();
        deleteAssetFromScene(uuid);
        if(selUuid != "unassigned"){
             if (delUuid != selUuid){
            transform_controls.attach(envir.scene.getObjectByProperty( 'uuid' , selUuid));
            setDatGuiInitialVales(envir.scene.getObjectByProperty( 'uuid' , selUuid));
            }
            else{
                document.getElementById('numerical_gui-container').style.display="none";
            }
        }else{
            document.getElementById('numerical_gui-container').style.display="none";
        }
       
    }, { once: true });
}

function lockOnScene(uuid, name) {

    let selectedObject = envir.scene.getObjectByProperty( 'uuid' , uuid);
    let editorObject = transform_controls.object;
    let hierarchy_icon = document.getElementById(uuid).querySelector('.hierarchyItemLock').querySelector('.material-icons');
   
    if (selectedObject.locked){
        selectedObject.locked = false;
        
        hierarchy_icon.textContent = "lock_open";
        transform_controls.attach(envir.scene.getObjectByProperty( 'uuid' , uuid));
        setDatGuiInitialVales(envir.scene.getObjectByProperty( 'uuid' , uuid));
        document.getElementById('numerical_gui-container').style.display="block";
    }else{
        selectedObject.locked = true;
        transform_controls.detach();
        hierarchy_icon.textContent = "lock_outline";
        document.getElementById('numerical_gui-container').style.display="none";
    }

    setBackgroundColorHierarchyViewer(uuid);
    
    saveChanges();

}

/**
 *
 * Delete from scene
 *
 * @param uuid
 */
function deleteAssetFromScene(uuid) {

    let resChildren = Object.values(vrodos_scene_data.objects);
    let envirChildren = Object.values(envir.scene.children);

    // 1. Delete object from js array (if it exists. Usually it is saved after reload)
    for (let i in resChildren) {
        if (typeof resChildren[i] === 'object' && resChildren[i] !== null) {
            if (resChildren[i].uuid == uuid) {
                delete vrodos_scene_data.objects[resChildren[i].name];
            }
        }
    }

    // 2. Find actual object inside scene
    let objectSelected;
    for (let i in envirChildren) {
        if (typeof envirChildren[i] === 'object' && envirChildren[i] !== null) {
            if (envirChildren[i].uuid == uuid) {
                objectSelected = envir.scene.getObjectByName(envirChildren[i].name);
            }
        }
    }


    // remove animations
    isPaused = true;
    let filtered = envir.animationMixers.filter(function (el) {
        return el._root.name !== objectSelected.name;
    });
    envir.animationMixers = filtered;
    isPaused = false;

    // If deleting light then remove also its LightHelper and lightTargetSpot and Shadow Helper
    if (typeof(objectSelected) != "undefined"){
        if (objectSelected.isLight) {

            // Sun Shadow Helper
            envir.scene.remove(envir.scene.getObjectByName("lightShadowHelper_" + objectSelected.name));
    
            // Sun target spot
            envir.scene.remove(envir.scene.getObjectByName("lightTargetSpot_" + objectSelected.name));
    
            // Sun target spot remove from hierarchy viewer
            let target = "lightTargetSpot_" + objectSelected.name;
            jQuery("[data-name='" +target +"']").remove();
    
            // Light Helper (for all lights)
            envir.scene.remove(envir.scene.getObjectByName("lightHelper_" + objectSelected.name));
        }
    }
    

    transform_controls.detach(objectSelected);

    // prevent orbiting
    document.dispatchEvent(new CustomEvent("mouseup", { "detail": "Example of an event" }));

    // Remove object from scene
    envir.scene.remove(objectSelected);

    // Remove from hierarchy viewer
    jQuery('#hierarchy-viewer').find('#' + uuid).remove();

    //transform_controls.detach();

    // Save scene
    triggerAutoSave();

}

