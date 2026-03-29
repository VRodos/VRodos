function getSceneObjectAddedAt(dataDrag) {
    const existingValue = dataDrag && dataDrag.addedAt ? Number(dataDrag.addedAt) : 0;
    return Number.isFinite(existingValue) && existingValue > 0
        ? Math.floor(existingValue)
        : Math.floor(Date.now() / 1000);
}

function addAssetToCanvas(nameModel, path, categoryName, dataDrag, translation, pluginPath) {
    let trs_tmp;
    const addedAt = getSceneObjectAddedAt(dataDrag);

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
        "addedAt": addedAt,
    };

    for (let entry in Object.keys(dataDrag)) {
        vrodos_scene_data.objects[nameModel][Object.keys(dataDrag)[entry]] = Object.values(dataDrag)[entry];
    }
    vrodos_scene_data.objects[nameModel].addedAt = addedAt;
    
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
        lightSun.addedAt = addedAt;

        let hexcol = "0xffff00";

        //// Add Sun Helper
        let sunSphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 8),
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
            new THREE.SphereGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
        ));

        lightTargetSpot.isSelectableMesh = true;
        lightTargetSpot.name = "lightTargetSpot_" + lightSun.name;
        lightTargetSpot['category_name'] = "lightTargetSpot";
        lightTargetSpot.isLightTargetSpot = true;
        lightTargetSpot.isLight = false;
        lightTargetSpot.addedAt = addedAt;
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
        trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

        trs_tmp['translation'][1] += 3; // Sun should be a little higher than objects;

        insertedObject.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        insertedObject.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        insertedObject.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);
        insertedObject.parent = envir.scene;

        // place controls to last inserted obj
        transform_controls.attach(insertedObject);

        // highlight
        removeAllCelOutlines(); addCelOutline(insertedObject);
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
        lightLamp.addedAt = addedAt;

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
            new THREE.SphereGeometry(0.5, 16, 8),
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
        trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

        trs_tmp['translation'][1] += 3; // Sun should be a little higher than objects;

        insertedObject.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        insertedObject.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        insertedObject.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);
        insertedObject.parent = envir.scene;

        // place controls to last inserted obj
        transform_controls.attach(insertedObject);

        // highlight
        removeAllCelOutlines(); addCelOutline(insertedObject);
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
        lightSpot.addedAt = addedAt;

        let lightTargetSpot = new THREE.Object3D();

        lightTargetSpot.add(new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
        ));

        trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];


        //// Add Lamp Helper
        let lampSphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 8), //new THREE.ConeBufferGeometry(0.5, 1, 16, 8),
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
        lightTargetSpot.addedAt = addedAt;
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
        trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

        trs_tmp['translation'][1] += 3; // Sun should be a little higher than objects;

        insertedObject.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        insertedObject.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        insertedObject.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);
        insertedObject.parent = envir.scene;

        // place controls to last inserted obj
        transform_controls.attach(insertedObject);

        // highlight
        removeAllCelOutlines(); addCelOutline(insertedObject);
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
        lightAmbient.addedAt = addedAt;

        //// Add Lamp Helper
        let lampSphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 8), //new THREE.ConeBufferGeometry(0.5, 1, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        lampSphere.rotation.set(Math.PI / 2, 0, 0);

        lampSphere.isSelectableMesh = true;
        lampSphere.name = "LampSphere";

        lightAmbient.add(lampSphere);

        envir.scene.add(lightAmbient);

        // Add transform controls
        let insertedObject = envir.scene.getObjectByName(nameModel);
        trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

        trs_tmp['translation'][1] += 3; // Sun should be a little higher than objects;

        insertedObject.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        insertedObject.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        insertedObject.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);
        insertedObject.parent = envir.scene;

        // place controls to last inserted obj
        transform_controls.attach(insertedObject);

        // highlight
        removeAllCelOutlines(); addCelOutline(insertedObject);
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
                Pawn.addedAt = addedAt;


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

                trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

                trs_tmp['translation'][1] += 3; // Sun should be a little higher than objects;

                insertedObject.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
                insertedObject.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
                insertedObject.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);
                insertedObject.parent = envir.scene;

                // place controls to last inserted obj
                transform_controls.attach(insertedObject);

                // highlight
                removeAllCelOutlines(); addCelOutline(insertedObject);
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
        document.getElementById("progress").style.display = "block";
        document.getElementById("progressWrapper").style.visibility = "visible";
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
            trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

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
            removeAllCelOutlines(); addCelOutline(insertedObject);

            selected_object_name = nameModel;

            // Dimensions
            setTransformControlsSize();

            // Add in hierarchy browser
            addInHierarchyViewer(insertedObject);

            // Auto-save
            triggerAutoSave();

            // Hide progress dialogue
            document.getElementById("progressWrapper").style.visibility = "hidden";
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

    let delete_dialog_element = document.getElementById('confirm-deletion-dialog');
    delete_dialog_element.showModal();

    let delUuid = uuid;
    let selUuid;
    if( typeof(transform_controls.object) != "undefined" )
        selUuid = transform_controls.object.uuid;
    else
        selUuid = "unassigned";
    // var selUuid = (typeof checkUuid != "undefined") ? checkUuid : "unassigned";
    let delete_btn_element = document.getElementById("delete-asset-btn-confirmation");
    delete_btn_element.addEventListener('click', function() {
        delete_dialog_element.close();
        transform_controls.detach();
        deleteAssetFromScene(uuid);
        if(selUuid != "unassigned"){
             if (delUuid != selUuid){
            transform_controls.attach(envir.scene.getObjectByProperty( 'uuid' , selUuid));
            setDatGuiInitialVales(envir.scene.getObjectByProperty( 'uuid' , selUuid));
            }
            else{
                hideObjectControlsPanel();
            }
        }else{
            hideObjectControlsPanel();
        }
       
    }, { once: true });
}

function lockOnScene(uuid, name) {

    let selectedObject = envir.scene.getObjectByProperty( 'uuid' , uuid);
    let hierarchyItem = document.getElementById(uuid);

    if (selectedObject.locked){
        selectedObject.locked = false;
        transform_controls.attach(envir.scene.getObjectByProperty( 'uuid' , uuid));
        setDatGuiInitialVales(envir.scene.getObjectByProperty( 'uuid' , uuid));
        showObjectControlsPanel();
    }else{
        selectedObject.locked = true;
        transform_controls.detach();
        hideObjectControlsPanel();
    }

    // Update the lock icon in the hierarchy viewer (Lucide)
    if (hierarchyItem) {
        let lockAnchor = hierarchyItem.querySelector('a[aria-label="Lock asset"]');
        if (lockAnchor) {
            let newIcon = selectedObject.locked ? 'lock' : 'lock-open';
            lockAnchor.innerHTML = '<i data-lucide="' + newIcon + '" class="tw-w-4 tw-h-4"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [lockAnchor] });
        }
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

    // 1. Delete object from js array (if it exists. Usually it is saved after reload)
    for (const obj of Object.values(vrodos_scene_data.objects)) {
        if (typeof obj === 'object' && obj !== null && obj.uuid == uuid) {
            delete vrodos_scene_data.objects[obj.name];
            break;
        }
    }

    // 2. Find actual object inside scene
    let objectSelected = null;
    for (const child of envir.scene.children) {
        if (typeof child === 'object' && child !== null && child.uuid == uuid) {
            objectSelected = child; // We found the direct child map
            break;
        }
    }

    if (!objectSelected) return;


    // remove animations
    isPaused = true;
    envir.animationMixers = envir.animationMixers.filter(el => el._root.name !== objectSelected.name);
    isPaused = false;

    // If deleting light then remove also its LightHelper and lightTargetSpot and Shadow Helper
    if (objectSelected.isLight) {
        // Sun Shadow Helper
        let shadowHelper = envir.scene.getObjectByName("lightShadowHelper_" + objectSelected.name);
        if (shadowHelper) { shadowHelper.dispose(); envir.scene.remove(shadowHelper); }

        // Sun target spot
        let targetSpot = envir.scene.getObjectByName("lightTargetSpot_" + objectSelected.name);
        if (targetSpot) envir.scene.remove(targetSpot);

        // Sun target spot remove from hierarchy viewer
        let targetEl = document.querySelector(`[data-name="lightTargetSpot_${objectSelected.name}"]`);
        if (targetEl) targetEl.remove();

        // Light Helper (for all lights)
        let lightHelper = envir.scene.getObjectByName("lightHelper_" + objectSelected.name);
        if (lightHelper) { lightHelper.dispose(); envir.scene.remove(lightHelper); }
    }
    

    // Remove cel outline if present
    if (typeof removeCelOutline === 'function') removeCelOutline(objectSelected);

    transform_controls.detach(objectSelected);

    // prevent orbiting
    document.dispatchEvent(new CustomEvent("mouseup", { "detail": "Example of an event" }));

    // Dispose GPU resources (geometry, materials, textures) to prevent VRAM leaks
    objectSelected.traverse(function (node) {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
            let materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach(function (mat) {
                for (const key in mat) {
                    if (mat[key] && typeof mat[key].dispose === 'function') {
                        mat[key].dispose(); // textures, env maps, etc.
                    }
                }
                mat.dispose();
            });
        }
    });

    // Remove object from scene
    envir.scene.remove(objectSelected);

    // Remove from hierarchy viewer
    let hierItem = document.getElementById(uuid);
    if (hierItem) hierItem.remove();

    //transform_controls.detach();

    // Save scene
    triggerAutoSave();

}
