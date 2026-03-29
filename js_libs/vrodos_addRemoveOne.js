function getSceneObjectAddedAt(dataDrag) {
    const existingValue = dataDrag && dataDrag.addedAt ? Number(dataDrag.addedAt) : 0;
    return Number.isFinite(existingValue) && existingValue > 0
        ? Math.floor(existingValue)
        : Math.floor(Date.now() / 1000);
}

/**
 * Create a Sun light in the scene.
 */
function vrodos_createLightSun(nameModel, addedAt) {
    let lightSun = new THREE.DirectionalLight(0xffffff, 1);
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
    lightSun.name = nameModel;
    lightSun['asset_name'] = "mylightSun";
    lightSun.isSelectableMesh = true;
    lightSun['category_name'] = "lightSun";
    lightSun['category_slug'] = "lightSun";
    lightSun.isLight = true;
    lightSun.addedAt = addedAt;

    const hexcol = "0xffff00";

    // Add Sun Helper (visual representation in editor)
    let sunSphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    sunSphere.isSelectableMesh = true;
    sunSphere.name = "SunSphere";
    lightSun.add(sunSphere);

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

    // Add shadow camera helper
    let lightSunShadowhelper = new THREE.CameraHelper(lightSun.shadow.camera);
    lightSunShadowhelper.name = "lightShadowHelper_" + lightSun.name;

    envir.scene.add(lightSun);
    envir.scene.add(lightSunHelper);
    envir.scene.add(lightTargetSpot);
    envir.scene.add(lightSunShadowhelper);

    lightSun.target.updateMatrixWorld();
    lightSunHelper.update();

    // Set initial transformations
    let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];
    trs_tmp['translation'][1] += 3; // Sun should be higher than objects

    lightSun.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
    lightSun.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
    lightSun.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);

    // Attach Editor Controls
    transform_controls.attach(lightSun);
    removeAllCelOutlines();
    addCelOutline(lightSun);

    selected_object_name = nameModel;
    setTransformControlsSize();

    addInHierarchyViewer(lightSun);
    addInHierarchyViewer(lightTargetSpot);

    lightSun.color.setHex(hexcol);
    lightSun.children[0].material.color.setHex(hexcol);
    lightSunHelper.children[0].material.color.setHex(hexcol);
    lightSunHelper.children[1].material.color.setHex(hexcol);
    lightTargetSpot.children[0].material.color.setHex(hexcol);

    triggerAutoSave();
}

/**
 * Create a Lamp light in the scene.
 */
function vrodos_createLightLamp(nameModel, addedAt) {
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

    const hexcol = "0xffff00";

    // Add Lamp Helper visual representation
    let lampSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    lampSphere.isSelectableMesh = true;
    lampSphere.name = "LampSphere";
    lightLamp.add(lampSphere);

    let lightLampHelper = new THREE.PointLightHelper(lightLamp, 1, 0x555500);
    lightLampHelper.isLightHelper = true;
    lightLampHelper.name = 'lightHelper_' + lightLamp.name;
    lightLampHelper['category_name'] = 'lightHelper';
    lightLampHelper.parentLightName = lightLamp.name;

    envir.scene.add(lightLamp);
    envir.scene.add(lightLampHelper);
    lightLampHelper.update();

    let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];
    trs_tmp['translation'][1] += 3;

    lightLamp.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
    lightLamp.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
    lightLamp.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);

    transform_controls.attach(lightLamp);
    removeAllCelOutlines();
    addCelOutline(lightLamp);

    lightLamp.color.setHex(hexcol);
    lightLamp.power = 10;

    selected_object_name = nameModel;
    setTransformControlsSize();
    addInHierarchyViewer(lightLamp);

    triggerAutoSave();
}

/**
 * Create a Spot light in the scene.
 */
function vrodos_createLightSpot(nameModel, addedAt) {
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

    let lampSphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    lampSphere.rotation.set(Math.PI / 2, 0, 0);
    lampSphere.isSelectableMesh = true;
    lampSphere.name = "LampSphere";
    lightSpot.add(lampSphere);

    lightTargetSpot.isSelectableMesh = true;
    lightTargetSpot.name = "lightTargetSpot_" + lightSpot.name;
    lightTargetSpot['category_name'] = "lightTargetSpot";
    lightTargetSpot.isLightTargetSpot = true;
    lightTargetSpot.isLight = false;
    lightTargetSpot.addedAt = addedAt;
    lightTargetSpot.position = new THREE.Vector3(0, 0, 0);
    lightTargetSpot.parentLight = lightSpot;

    lightSpot.target.position = lightTargetSpot.position;

    envir.scene.add(lightSpot);
    envir.scene.add(lightTargetSpot);

    lightSpot.target.updateMatrixWorld();

    let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];
    trs_tmp['translation'][1] += 3;

    lightSpot.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
    lightSpot.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
    lightSpot.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);

    transform_controls.attach(lightSpot);
    removeAllCelOutlines();
    addCelOutline(lightSpot);

    selected_object_name = nameModel;
    setTransformControlsSize();

    addInHierarchyViewer(lightSpot);
    addInHierarchyViewer(lightTargetSpot);

    triggerAutoSave();
}

/**
 * Create an Ambient light in the scene.
 */
function vrodos_createLightAmbient(nameModel, addedAt) {
    let lightAmbient = new THREE.AmbientLight(0xffffff, 1);
    lightAmbient.name = nameModel;
    lightAmbient['asset_name'] = "mylightAmbient";
    lightAmbient.isSelectableMesh = true;
    lightAmbient['category_name'] = "lightAmbient";
    lightAmbient.isLight = true;
    lightAmbient.addedAt = addedAt;

    let lampSphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    lampSphere.rotation.set(Math.PI / 2, 0, 0);
    lampSphere.isSelectableMesh = true;
    lampSphere.name = "LampSphere";
    lightAmbient.add(lampSphere);

    envir.scene.add(lightAmbient);

    let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];
    trs_tmp['translation'][1] += 3;

    lightAmbient.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
    lightAmbient.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
    lightAmbient.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);

    transform_controls.attach(lightAmbient);
    removeAllCelOutlines();
    addCelOutline(lightAmbient);

    selected_object_name = nameModel;
    setTransformControlsSize();
    addInHierarchyViewer(lightAmbient);

    triggerAutoSave();
}

/**
 * Handle Pawn actor creation.
 */
function vrodos_createPawn(nameModel, addedAt, pluginPath) {
    const loader = new THREE.GLTFLoader();

    loader.load(
        pluginPath + '/assets/pawn.glb',
        (gltf) => {
            let Pawn = gltf.scene.children[0];
            Pawn.name = nameModel;
            Pawn['asset_name'] = "myActor";
            Pawn.isSelectableMesh = true;
            Pawn['category_name'] = "pawn";
            Pawn.isLight = false;
            Pawn.addedAt = addedAt;

            let indexPawn = 1;
            for (let ch of envir.scene.children) {
                if (ch.name.includes("Pawn")) indexPawn++;
            }

            let pawnLabelDiv = document.createElement('div');
            pawnLabelDiv.textContent = 'Actor ' + indexPawn;
            pawnLabelDiv.style.marginTop = '-1em';
            pawnLabelDiv.style.fontSize = '26px';
            pawnLabelDiv.style.color = "yellow";

            let pawnLabel = new THREE.CSS2DObject(pawnLabelDiv);
            pawnLabel.position.set(0, 1.5, 0);
            Pawn.add(pawnLabel);

            envir.scene.add(Pawn);

            let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];
            trs_tmp['translation'][1] += 3;

            Pawn.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
            Pawn.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
            Pawn.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);

            transform_controls.attach(Pawn);
            removeAllCelOutlines();
            addCelOutline(Pawn);

            selected_object_name = nameModel;
            setTransformControlsSize();
            addInHierarchyViewer(Pawn);

            triggerAutoSave();
        },
        null,
        (error) => console.log('Error loading Pawn GLB:', error)
    );
}

/**
 * Handle regular GLB asset loading.
 */
function vrodos_createGlbAsset(nameModel, addedAt, pluginPath) {
    document.getElementById("progress").style.display = "block";
    document.getElementById("progressWrapper").style.visibility = "visible";
    document.getElementById("result_download").innerHTML = "Loading";

    let manager = new THREE.LoadingManager();
    manager.onProgress = (item, loaded, total) => {
        document.getElementById("result_download").innerHTML = vrodos_scene_data.objects[nameModel]['asset_name'] + " loading part " + loaded + " / " + total;
    };

    manager.onLoad = () => {
        let insertedObject = envir.scene.getObjectByName(nameModel);
        let trs_tmp = vrodos_scene_data.objects[nameModel]['trs'];

        insertedObject.position.set(trs_tmp['translation'][0], trs_tmp['translation'][1], trs_tmp['translation'][2]);
        insertedObject.rotation.set(trs_tmp['rotation'][0], trs_tmp['rotation'][1], trs_tmp['rotation'][2]);
        insertedObject.scale.set(trs_tmp['scale'][0], trs_tmp['scale'][1], trs_tmp['scale'][2]);

        if (insertedObject.children[0].isMesh) {
            let mat = insertedObject.children[0].material;
            if (isNaN(mat.metalness)) {
                mat.metalness = 0;
                mat.roughness = 0.5;
                mat.emissiveIntensity = 0;
                if (mat.color.r + mat.color.g + mat.color.b === 0) {
                    mat.color = new THREE.Color("rgb(50%, 50%, 50%)");
                }
            }
        }

        transform_controls.attach(insertedObject);
        envir.setComposerAndPasses();
        removeAllCelOutlines();
        addCelOutline(insertedObject);

        selected_object_name = nameModel;
        setTransformControlsSize();
        addInHierarchyViewer(insertedObject);

        triggerAutoSave();
        document.getElementById("progressWrapper").style.visibility = "hidden";
    };

    let loaderMulti = new VRodos_LoaderMulti();
    loaderMulti.load(manager, { [nameModel]: vrodos_scene_data.objects[nameModel] }, pluginPath);
}

/**
 * Main function to add objects to the canvas.
 */
function addAssetToCanvas(nameModel, path, categoryName, dataDrag, translation, pluginPath) {
    const addedAt = getSceneObjectAddedAt(dataDrag);

    // Initial persistence structure
    vrodos_scene_data.objects[nameModel] = {
        "path": path,
        "trs": {
            "translation": [translation[0], translation[1], translation[2]],
            "rotation": [0, 0, 0],
            "scale": [1, 1, 1]
        },
        "fnPath": path ? path.substring(path.lastIndexOf('/') + 1) : '',
        "asset_name": nameModel,
        "category_name": categoryName,
        "isLight": categoryName.includes("light"),
        "addedAt": addedAt,
    };

    // Copy drag data properties
    Object.keys(dataDrag).forEach((key) => {
        vrodos_scene_data.objects[nameModel][key] = dataDrag[key];
    });

    const categoryHandlers = {
        'lightSun': () => vrodos_createLightSun(nameModel, addedAt),
        'lightLamp': () => vrodos_createLightLamp(nameModel, addedAt),
        'lightSpot': () => vrodos_createLightSpot(nameModel, addedAt),
        'lightAmbient': () => vrodos_createLightAmbient(nameModel, addedAt),
        'Pawn': () => vrodos_createPawn(nameModel, addedAt, pluginPath),
        'pawn': () => vrodos_createPawn(nameModel, addedAt, pluginPath)
    };

    // Execute the specific handler or fallback to generic GLB asset loader
    if (categoryHandlers[categoryName]) {
        categoryHandlers[categoryName]();
    } else {
        vrodos_createGlbAsset(nameModel, addedAt, pluginPath);
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
