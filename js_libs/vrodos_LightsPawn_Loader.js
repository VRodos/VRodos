class VRodos_LightsPawn_Loader {
    constructor(who) {}

    /**
     * Update visibility of fog-related UI elements.
     */
    updateFogUI(fogCategory) {
        const linearElems = document.getElementsByClassName('linearElement');
        const expoElems = document.getElementsByClassName('exponentialElement');
        const colorElems = document.getElementsByClassName('colorElement');
        const fogValues = document.getElementById("FogValues");

        const isLinear = String(fogCategory) === '1';
        const isExponential = String(fogCategory) === '2';
        const isNone = String(fogCategory) === '0';

        if (fogValues) fogValues.style.display = isNone ? "none" : "flex";

        for (let el of linearElems) el.style.display = isLinear ? "flex" : "none";
        for (let el of expoElems) el.style.display = isExponential ? "flex" : "none";
        for (let el of colorElems) el.style.display = isNone ? "none" : "flex";

        const radioMap = { '0': 'RadioNoFog', '1': 'RadioLinearFog', '2': 'RadioExponentialFog' };
        if (radioMap[fogCategory]) {
            const radio = document.getElementById(radioMap[fogCategory]);
            if (radio) radio.checked = true;
        }
    }

    /**
     * Main load entry point for lights and pawns.
     */
    load(resources3D, providedPath, manager) {
        if (!resources3D) return;
        const pendingLoads = [];
        
        // Use provided path or fallback to global pluginPath
        const finalPath = providedPath || (typeof pluginPath !== 'undefined' ? pluginPath : '');

        for (const name in resources3D) {
            const resource = resources3D[name];

            // 1. Recursive handling for nested objects
            if (name === 'objects' && typeof resource === 'object') {
                pendingLoads.push(this.load(resource, finalPath, manager));
                continue;
            }

            // 2. Handle Special Scene Keys (Metadata)
            if (name === 'SceneSettings') {
                this.processSceneSettings(resource);
                continue;
            }

            // Restore Director/Camera position
            if (name === 'cameraCoords' && typeof resource === 'object') {
                if (typeof envir !== 'undefined' && typeof envir.applyDirectorTransform === 'function') {
                    envir.applyDirectorTransform(resource.position, resource.rotation);
                }
                continue;
            }

            // Fallback for flat metadata (backward compatibility)
            if (name === 'fogCategory' || name === 'fogcolor' || name === 'fognear' || name === 'fogfar' || name === 'fogdensity') {
               this.processSceneSettings(resources3D);
               continue;
            }

            if (name === 'ClearColor') {
                if (envir?.scene) {
                    envir.scene.background = new THREE.Color(resource);
                }
                ['sceneClearColor', 'jscolorpick'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = resource;
                });
                continue;
            }

            // 3. Filter for Lights and Pawns
            const category = resource['category_name'];
            if (!category || (!category.startsWith("light") && !category.startsWith("pawn"))) {
                continue;
            }

            // 4. Dispatch to Category Handlers
            const pendingLoad = this.dispatchToHandlers(name, resource, finalPath, category, manager);
            if (pendingLoad) {
                pendingLoads.push(pendingLoad);
            }
        }

        return Promise.allSettled(pendingLoads);
    }

    processSceneSettings(settings) {
        if (!settings) return;

        // Populate UI fields
        const fields = { 
            'FogNear': 'fognear', 'FogFar': 'fogfar', 
            'FogDensity': 'fogdensity' 
        };
        Object.entries(fields).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (el && settings[key] !== undefined) el.value = parseFloat(settings[key]);
        });

        // Sync Fog Type
        if (settings.fogtype) {
            const fogTypeInput = document.getElementById('FogType');
            if (fogTypeInput) fogTypeInput.value = settings.fogtype;
        }

        // Sync Color Picker
        if (settings.fogcolor) {
            const fcolor = settings.fogcolor;
            const colorValue = fcolor.startsWith('#') ? fcolor : '#' + fcolor;
            const picker = document.getElementById('jscolorpickFog');
            if (picker) {
                picker.value = colorValue;
            }
        }

        // Update Visibility & Radio buttons
        if (settings.fogCategory !== undefined) {
            this.updateFogUI(settings.fogCategory);
        }
        
        // Apply to THREE.js Scene
        if (typeof updateFog === 'function') {
            updateFog("loading");
        }
    }

    dispatchToHandlers(name, resource, finalPath, category, manager) {
        const handlers = {
            'lightSun': () => this.initSun(name, resource),
            'lightLamp': () => this.initLamp(name, resource),
            'lightSpot': () => this.initSpot(name, resource),
            'lightAmbient': () => this.initAmbient(name, resource),
            'pawn': () => this.initPawn(name, resource, finalPath, manager)
        };

        if (handlers[category]) {
            return handlers[category]();
        }
    }

    initSun(name, resource) {
        const lc = resource['lightcolor'];
        const color = new THREE.Color(lc[0], lc[1], lc[2]);
        const light = new THREE.DirectionalLight(color, resource['lightintensity']);

        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500;
        this.applyTRS(light, resource['trs']);

        const tp = resource['targetposition'];
        light.target.position.set(tp[0], tp[1], tp[2]);
        
        light.name = name;
        light.asset_name = "mylightSun";
        light.category_name = "lightSun";
        light.isSelectableMesh = true;
        light.isLight = true;
        light.addedAt = resource['addedAt'];
        light.castShadow = true;
        light.sunSky = resource['sunSky'];
        light.locked = resource['locked'];
        light.castingShadow = resource['castingShadow'];
        light.shadowMapHeight = resource['shadowMapHeight'];
        light.shadowMapWidth = resource['shadowMapWidth'];
        light.shadowCameraTop = resource['shadowCameraTop'];
        light.shadowCameraBottom = resource['shadowCameraBottom'];
        light.shadowCameraLeft = resource['shadowCameraLeft'];
        light.shadowCameraRight = resource['shadowCameraRight'];
        light.shadowBias = resource['shadowBias'];

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 8),
            new THREE.MeshBasicMaterial({ color })
        );
        sphere.isSelectableMesh = false;
        sphere.name = "SunSphere";
        light.add(sphere);

        const helper = new THREE.DirectionalLightHelper(light, 3, color);
        helper.isLightHelper = true;
        helper.name = 'lightHelper_' + light.name;
        helper.category_name = 'lightHelper';
        helper.parentLightName = name;
        helper.vrodos_internal_helper = true;
        envir.scene.add(helper);
        envir.scene.add(light);

        light.target.updateMatrixWorld();
        helper.update();

        const targetSpot = new THREE.Object3D();
        targetSpot.add(new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color })
        ));
        targetSpot.children[0].isSelectableMesh = false;
        targetSpot.isSelectableMesh = true;
        targetSpot.name = "lightTargetSpot_" + light.name;
        targetSpot.category_name = "lightTargetSpot";
        targetSpot.isLightTargetSpot = true;
        targetSpot.addedAt = resource['addedAt'];
        targetSpot.position.set(tp[0], tp[1], tp[2]);
        targetSpot.parentLight = light;
        targetSpot.parentLightHelper = helper;

        light.target.position.copy(targetSpot.position);
        envir.scene.add(targetSpot);
        if (envir.selectableMeshes) {
            envir.selectableMeshes.add(light);
            envir.selectableMeshes.add(targetSpot);
        }

        const shadowHelper = new THREE.CameraHelper(light.shadow.camera);
        shadowHelper.name = "lightShadowHelper_" + light.name;
        shadowHelper.vrodos_internal_helper = true;
        envir.scene.add(shadowHelper);
    }

    initLamp(name, resource) {
        const lc = resource['lightcolor'];
        const color = new THREE.Color(lc[0], lc[1], lc[2]);
        const light = new THREE.PointLight(color, resource['lightintensity'], resource['lightdistance'], resource['lightdecay']);
        
        this.applyTRS(light, resource['trs']);
        light.name = name;
        light.asset_name = "mylightLamp";
        light.category_name = "lightLamp";
        light.isSelectableMesh = true;
        light.isLight = true;
        light.addedAt = resource['addedAt'];
        light.castShadow = true;
        light.shadow.radius = parseFloat(resource['shadowRadius']);
        light.locked = resource['locked'];
        light.lampcastingShadow = resource['lampcastingShadow'];
        light.lampshadowMapHeight = resource['lampshadowMapHeight'];
        light.lampshadowMapWidth = resource['lampshadowMapWidth'];
        light.lampshadowCameraTop = resource['lampshadowCameraTop'];
        light.lampshadowCameraBottom = resource['lampshadowCameraBottom'];
        light.lampshadowCameraLeft = resource['lampshadowCameraLeft'];
        light.lampshadowCameraRight = resource['lampshadowCameraRight'];
        light.lampshadowBias = resource['lampshadowBias'];

        envir.scene.add(light);
        if (envir.selectableMeshes) envir.selectableMeshes.add(light);

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color })
        );
        sphere.isSelectableMesh = false;
        sphere.name = "LampSphere";
        light.add(sphere);

        const helper = new THREE.PointLightHelper(light, 1, color);
        helper.isLightHelper = true;
        helper.name = 'lightHelper_' + light.name;
        helper.category_name = 'lightHelper';
        helper.parentLightName = light.name;
        helper.vrodos_internal_helper = true;
        envir.scene.add(helper);
    }

    initSpot(name, resource) {
        const color = new THREE.Color(0.996, 1, 0);
        const light = new THREE.SpotLight(color, resource['lightintensity'], resource['lightdistance'], resource['lightangle'], resource['lightpenumbra'], resource['lightdecay']);

        this.applyTRS(light, resource['trs']);
        light.scale.set(1, 1, 1);
        light.name = name;
        light.asset_name = "mylightSpot";
        light.category_name = "lightSpot";
        light.isSelectableMesh = true;
        light.isLight = true;
        light.addedAt = resource['addedAt'];
        light.locked = resource['locked'];
        light.castShadow = true;

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 8),
            new THREE.MeshBasicMaterial({ color })
        );
        sphere.isSelectableMesh = false;
        sphere.name = "SpotSphere";
        light.add(sphere);

        const tp = resource['targetposition'];
        const targetSpot = new THREE.Object3D();
        targetSpot.add(new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 8),
            new THREE.MeshBasicMaterial({ color })
        ));
        targetSpot.children[0].isSelectableMesh = false;
        targetSpot.isSelectableMesh = true;
        targetSpot.name = "lightTargetSpot_" + light.name;
        targetSpot.category_name = "lightTargetSpot";
        targetSpot.isLightTargetSpot = true;
        targetSpot.addedAt = resource['addedAt'];
        targetSpot.position.set(tp[0], tp[1], tp[2]);
        targetSpot.parentLight = light;

        envir.scene.add(targetSpot);
        if (envir.selectableMeshes) {
            envir.selectableMeshes.add(light);
            envir.selectableMeshes.add(targetSpot);
        }
        light.target.updateMatrixWorld();
        light.target.position.copy(targetSpot.position);

        envir.scene.add(light);
        // No triggerAutoSave here — this loader only restores saved state.
        // User-initiated spot light creation (vrodos_createLightSpot in vrodos_addRemoveOne.js)
        // handles its own triggerAutoSave().
    }

    initAmbient(name, resource) {
        const lc = resource['lightcolor'];
        const color = new THREE.Color(lc[0], lc[1], lc[2]);
        const helperColor = 0xffff00;
        const light = new THREE.AmbientLight(color, resource['lightintensity']);

        this.applyTRS(light, resource['trs']);
        light.name = name;
        light.asset_name = "mylightAmbient";
        light.category_name = "lightAmbient";
        light.isSelectableMesh = true;
        light.isLight = true;
        light.addedAt = resource['addedAt'];
        light.locked = resource['locked'];

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 8),
            new THREE.MeshBasicMaterial({ color: helperColor })
        );
        sphere.isSelectableMesh = false;
        sphere.name = "ambientSphere";
        light.add(sphere);

        envir.scene.add(light);
        if (envir.selectableMeshes) envir.selectableMeshes.add(light);
    }

    initPawn(name, resource, finalPath, manager) {
        return new Promise((resolve) => {
            if (manager) manager.itemStart(name);
            const loader = new THREE.GLTFLoader();
            loader.load(
                finalPath + '/assets/pawn.glb',
                (gltf) => {
                    const pawn = gltf.scene.children[0];
                    this.applyTRS(pawn, resource['trs']);

                    pawn.name = name;
                    pawn.asset_name = "myActor";
                    pawn.category_name = "pawn";
                    pawn.isSelectableMesh = true;
                    pawn.isLight = false;
                    pawn.material.transparent = true;
                    pawn.material.opacity = 0.6;

                    let indexPawn = 1;
                    for (let ch of envir.scene.children) {
                        if (ch.name.includes("Pawn")) indexPawn++;
                    }

                    const labelDiv = document.createElement('div');
                    labelDiv.textContent = 'Actor ' + indexPawn;
                    labelDiv.style.marginTop = '-1em';
                    labelDiv.style.fontSize = '26px';
                    labelDiv.style.color = "yellow";

                    const label = new THREE.CSS2DObject(labelDiv);
                    label.position.set(0, 1.5, 0);
                    pawn.add(label);

                    envir.scene.add(pawn);
                    if (typeof setHierarchyViewer === 'function') setHierarchyViewer();
                    if (manager) manager.itemEnd(name);
                    resolve();
                },
                null,
                (error) => {
                    console.log('Error loading Pawn during scene boot:', error);
                    if (manager) {
                        manager.itemError(name);
                        manager.itemEnd(name);
                    }
                    resolve();
                }
            );
        });
    }

    applyTRS(obj, trs) {
        if (!trs) return;
        const t = trs['translation'];
        const r = trs['rotation'];
        const s = trs['scale'];
        obj.position.set(t[0], t[1], t[2]);
        obj.rotation.set(r[0], r[1], r[2]);
        obj.scale.set(s[0], s[1], s[2]);
    }
}
