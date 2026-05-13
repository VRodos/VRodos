VRODOS.utils.getSceneObjectAddedAt = function(dataDrag) {
    const existingValue = dataDrag && dataDrag.addedAt ? Number(dataDrag.addedAt) : 0;
    return Number.isFinite(existingValue) && existingValue > 0
        ? Math.floor(existingValue)
        : Math.floor(Date.now() / 1000);
}

VRODOS.utils.joinUrl = function(base, path) {
    return `${String(base || '').replace(/\/+$/, '')  }/${  String(path || '').replace(/^\/+/, '')}`;
}

VRODOS.utils.resolveBaseUrl = function(pluginPath, localizedKey, fallbackRelative) {
    const paths = (typeof VRODOS.data !== 'undefined' && VRODOS.data.paths) ? VRODOS.data.paths : {};

    if (paths[localizedKey]) {
        return paths[localizedKey];
    }

    const pluginBaseUrl = paths.pluginBaseUrl || (typeof VRODOS.data.pluginPath === 'string' ? VRODOS.data.pluginPath : '');
    if (pluginBaseUrl) {
        return VRODOS.utils.joinUrl(pluginBaseUrl, fallbackRelative);
    }

    return String(fallbackRelative || '').replace(/^\/+/, '');
}

function getSceneObjectByUuid(uuid) {
    if (!uuid || !VRODOS.editor.sceneRegistry) return null;
    return VRODOS.editor.sceneRegistry.get(uuid);
}

function getSceneObjectByName(name) {
    if (!name || !VRODOS.editor.sceneRegistry) return null;
    return VRODOS.editor.sceneRegistry.get(name);
}

VRODOS.ui.frameNewSceneObject = function(object3D) {
    if (!object3D || !VRODOS.editor.envir || !VRODOS.editor.envir.cameraOrbit || !VRODOS.editor.envir.orbitControls) {
        return;
    }

    object3D.updateWorldMatrix(true, true);

    const bounds = new THREE.Box3().setFromObject(object3D);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();

    if (bounds.isEmpty()) {
        object3D.getWorldPosition(center);
        size.set(1, 1, 1);
    } else {
        bounds.getCenter(center);
        bounds.getSize(size);
    }

    const focusDimension = Math.max(size.x, size.y, size.z, 1);
    const paddedSurface = Math.max(focusDimension * 2.4, 6);
    const currentOffset = new THREE.Vector3().subVectors(VRODOS.editor.envir.cameraOrbit.position, VRODOS.editor.envir.orbitControls.target);

    if (currentOffset.lengthSq() < 0.000001) {
        currentOffset.set(VRODOS.editor.envir.FRUSTUM_SIZE, VRODOS.editor.envir.FRUSTUM_SIZE, VRODOS.editor.envir.FRUSTUM_SIZE);
    }

    VRODOS.editor.envir.orbitControls.target.copy(center);

    if (VRODOS.editor.envir.is2d) {
        VRODOS.editor.envir.cameraOrbit.position.set(center.x, VRODOS.editor.envir.FRUSTUM_SIZE, center.z);
    } else {
        VRODOS.editor.envir.cameraOrbit.position.copy(center).add(currentOffset);
    }

    if (typeof VRODOS.utils.orthoFitZoom === 'function') {
        VRODOS.editor.envir.cameraOrbit.zoom = VRODOS.utils.orthoFitZoom(VRODOS.editor.envir.FRUSTUM_SIZE, VRODOS.editor.envir.ASPECT, paddedSurface);
    }

    if (typeof VRODOS.utils.clampNumber === 'function') {
        VRODOS.editor.envir.cameraOrbit.zoom = VRODOS.utils.clampNumber(VRODOS.editor.envir.cameraOrbit.zoom, 10, 5000, 600);
    }

    VRODOS.editor.envir.cameraOrbit.updateProjectionMatrix();
    VRODOS.editor.envir.orbitControls.update();
}

VRODOS.ui.registerSceneObject = function(object, options) {
    const opts = Object.assign({
        selectable: true,
        updateHierarchy: true,
        select: false,
        frame: false,
        autosave: false,
        renderReason: 'object-added'
    }, options || {});

    return VRODOS.editor.objectFactory.addSceneObject(object, opts);
}

VRODOS.ui.selectNewSceneObject = function(object, options) {
    const opts = Object.assign({
        source: 'add-object',
        openPanel: false,
        showProperties: false,
        frame: true,
        autosave: true
    }, options || {});

    VRODOS.editor.selection.select(object, {
        source: opts.source,
        openPanel: opts.openPanel,
        showProperties: opts.showProperties,
        focusHierarchy: true,
        outline: true,
        syncGui: true,
        setMode: true
    });

    if (opts.frame && typeof VRODOS.ui.frameNewSceneObject === 'function') {
        VRODOS.ui.frameNewSceneObject(object);
    }
    if (object) {
        VRODOS.editor.selected_object_name = object.name;
    }
    if (VRODOS.ui.transform && typeof VRODOS.ui.transform.setSize === 'function') {
        VRODOS.ui.transform.setSize();
    }
    if (opts.autosave && typeof VRODOS.api.triggerAutoSave === 'function') {
        VRODOS.api.triggerAutoSave();
    }
    return object;
}

VRODOS.utils.normalizeAssessmentLevels = function(levels) {
    let source = levels;

    if (typeof source === 'string' && source.trim() !== '') {
        try {
            source = JSON.parse(source);
        } catch (err) {
            try {
                const binary = window.atob(source);
                const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
                const decoded = new TextDecoder('utf-8').decode(bytes);
                source = JSON.parse(decoded);
            } catch (base64Err) {
                source = source.split(/[,\s]+/);
            }
        }
    }

    if (!Array.isArray(source)) {
        return [];
    }

    return Array.from(new Set(
        source
            .map((level) => VRODOS.utils.decodeDisplayText(level).trim().toUpperCase())
            .filter(Boolean)
    ));
}

VRODOS.utils.resolvedAssessmentLevels = function(levels) {
    const normalizedLevels = VRODOS.utils.normalizeAssessmentLevels(levels);
    const allLevels = ['A1', 'A2', 'B1', 'B2'];

    if (!normalizedLevels.length) {
        return allLevels;
    }

    if (normalizedLevels.includes('ALL') || normalizedLevels.includes('ALL LEVELS')) {
        return allLevels;
    }

    return allLevels.filter((level) => normalizedLevels.includes(level));
}

VRODOS.utils.drawRoundedRect = function(ctx, x, y, width, height, radius, fillStyle, strokeStyle, lineWidth) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }

    if (strokeStyle && lineWidth > 0) {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
}

VRODOS.ui.createAssessmentInfoPlate = function(type, levels) {
    if (typeof THREE.CanvasTexture === 'undefined') {
        return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return null;
    }

    const resolvedType = VRODOS.utils.decodeDisplayText(type || 'Assessment').trim() || 'Assessment';
    const resolvedLevels = VRODOS.utils.resolvedAssessmentLevels(levels);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    VRODOS.utils.drawRoundedRect(ctx, 8, 8, 496, 176, 22, 'rgba(15, 23, 42, 0.92)', 'rgba(148, 163, 184, 0.28)', 2);

    ctx.font = '700 28px Arial';
    ctx.textBaseline = 'middle';
    const typeMetrics = ctx.measureText(resolvedType);
    const typeWidth = Math.min(typeMetrics.width + 48, 460);
    VRODOS.utils.drawRoundedRect(ctx, 26, 24, typeWidth, 38, 18, 'rgba(14, 165, 233, 0.14)', 'rgba(56, 189, 248, 0.5)', 2);
    ctx.fillStyle = '#bae6fd';
    ctx.fillText(resolvedType, 50, 43);

    const startX = 28;
    const startY = 92;
    const gap = 12;
    let currentX = startX;

    ctx.font = '700 24px Arial';
    resolvedLevels.forEach((level) => {
        const levelWidth = ctx.measureText(level).width + 34;
        VRODOS.utils.drawRoundedRect(ctx, currentX, startY, levelWidth, 34, 17, 'rgba(16, 185, 129, 0.14)', 'rgba(52, 211, 153, 0.44)', 2);
        ctx.fillStyle = '#bbf7d0';
        ctx.fillText(level, currentX + 17, startY + 17);
        currentX += levelWidth + gap;
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    if (typeof THREE.SRGBColorSpace !== 'undefined') {
        texture.colorSpace = THREE.SRGBColorSpace;
    }

    const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(1.02, 0.38),
        new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        })
    );
    plate.name = 'assessment_info_plate';
    plate.position.set(0, 0.05, 0.051);
    plate.isSelectableMesh = false;
    plate.renderOrder = 12;
    return plate;
}

VRODOS.ui.createAssessmentLabel = function(title, type, levels) {
    if (typeof THREE.CSS2DObject === 'undefined') {
        return null;
    }

    const labelEl = document.createElement('div');
    labelEl.style.minWidth = '150px';
    labelEl.style.maxWidth = '190px';
    labelEl.style.padding = '8px 10px';
    labelEl.style.borderRadius = '10px';
    labelEl.style.background = 'rgba(15, 23, 42, 0.92)';
    labelEl.style.border = '1px solid rgba(148, 163, 184, 0.45)';
    labelEl.style.boxShadow = '0 10px 26px rgba(15, 23, 42, 0.3)';
    labelEl.style.backdropFilter = 'blur(8px)';
    labelEl.style.color = '#e2e8f0';
    labelEl.style.fontFamily = 'Arial, sans-serif';
    labelEl.style.pointerEvents = 'none';

    const typeEl = document.createElement('div');
    typeEl.textContent = VRODOS.utils.decodeDisplayText(type || 'Assessment');
    typeEl.style.fontSize = '10px';
    typeEl.style.fontWeight = '700';
    typeEl.style.textTransform = 'uppercase';
    typeEl.style.letterSpacing = '0.08em';
    typeEl.style.color = '#38bdf8';
    typeEl.style.marginBottom = '4px';

    const titleEl = document.createElement('div');
    titleEl.textContent = VRODOS.utils.decodeDisplayText(title || 'Assessment');
    titleEl.style.fontSize = '12px';
    titleEl.style.fontWeight = '700';
    titleEl.style.lineHeight = '1.3';
    titleEl.style.marginBottom = '6px';

    const levelsWrap = document.createElement('div');
    levelsWrap.style.display = 'flex';
    levelsWrap.style.flexWrap = 'wrap';
    levelsWrap.style.gap = '4px';

    VRODOS.utils.resolvedAssessmentLevels(levels).forEach((level) => {
        const levelEl = document.createElement('span');
        levelEl.textContent = level;
        levelEl.style.display = 'inline-flex';
        levelEl.style.alignItems = 'center';
        levelEl.style.padding = '3px 7px';
        levelEl.style.borderRadius = '999px';
        levelEl.style.border = '1px solid rgba(52, 211, 153, 0.35)';
        levelEl.style.background = 'rgba(16, 185, 129, 0.12)';
        levelEl.style.fontSize = '9px';
        levelEl.style.fontWeight = '700';
        levelEl.style.letterSpacing = '0.04em';
        levelEl.style.color = '#bbf7d0';
        levelsWrap.appendChild(levelEl);
    });

    labelEl.appendChild(typeEl);
    labelEl.appendChild(titleEl);
    labelEl.appendChild(levelsWrap);

    const label = new THREE.CSS2DObject(labelEl);
    label.position.set(0, 0.9, 0);
    return label;
}

VRODOS.ui.createAssessmentPlaceholder = function(nameModel, resource) {
    const assessmentGroup = new THREE.Group();
    assessmentGroup.name = nameModel;
    assessmentGroup.asset_name = VRODOS.utils.decodeDisplayText(resource.asset_name || resource.assessment_title || 'Assessment');
    assessmentGroup.asset_slug = resource.asset_slug || '';
    assessmentGroup.asset_id = resource.asset_id || 0;
    assessmentGroup.category_name = resource.category_name || 'Assessment';
    assessmentGroup.category_slug = 'assessment';
    assessmentGroup.assessment_title = VRODOS.utils.decodeDisplayText(resource.assessment_title || resource.asset_name || 'Assessment');
    assessmentGroup.assessment_type = VRODOS.utils.decodeDisplayText(resource.assessment_type || '');
    assessmentGroup.assessment_group = VRODOS.utils.decodeDisplayText(resource.assessment_group || '');
    assessmentGroup.assessment_source_id = resource.assessment_source_id || '';
    assessmentGroup.assessment_content = resource.assessment_content || '';
    assessmentGroup.assessment_levels = VRODOS.utils.normalizeAssessmentLevels(resource.assessment_levels || '');
    assessmentGroup.assessment_supported = resource.assessment_supported || 'false';
    assessmentGroup.addedAt = resource.addedAt || Math.floor(Date.now() / 1000);
    assessmentGroup.isSelectableMesh = true;
    assessmentGroup.isLight = false;
    assessmentGroup.fnPath = '';

    const card = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.1,
            0.72,
            0.08
        ),
        new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            emissive: 0x0b1220,
            roughness: 0.85,
            metalness: 0.1
        })
    );
    card.name = `${nameModel}_card`;
    card.isSelectableMesh = false;
    card.castShadow = true;
    card.receiveShadow = true;

    const accent = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.12,
            0.1,
            0.09
        ),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    accent.position.set(0, 0.31, 0);
    accent.name = `${nameModel}_accent`;
    accent.isSelectableMesh = false;

    const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 24, 24),
        new THREE.MeshBasicMaterial({ color: resource.assessment_supported === 'true' ? 0x22c55e : 0xf59e0b })
    );
    dot.position.set(
        -0.42,
        -0.18,
        0.06
    );
    dot.name = `${nameModel}_status`;
    dot.isSelectableMesh = false;

    assessmentGroup.add(card);
    assessmentGroup.add(accent);
    assessmentGroup.add(dot);

    const infoPlate = VRODOS.ui.createAssessmentInfoPlate(
        assessmentGroup.assessment_type || assessmentGroup.assessment_group,
        assessmentGroup.assessment_levels
    );
    if (infoPlate) {
        assessmentGroup.add(infoPlate);
    }

    return assessmentGroup;
}

/**
 * Create a Sun light in the scene.
 */
VRODOS.api.createLightSun = function(nameModel, addedAt) {
    const lightSun = new THREE.DirectionalLight(0xffffff, 1);
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
    lightSun.defaultColor = "0xffffff";
    lightSun.name = nameModel;
    lightSun.asset_name = "mylightSun";
    lightSun.isSelectableMesh = true;
    lightSun.category_name = "lightSun";
    lightSun.category_slug = "lightSun";
    lightSun.isLight = true;
    lightSun.addedAt = addedAt;
    const hexcol = 0xffffff;

    // Add Sun Helper (visual representation in editor)
    const sunSphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    sunSphere.isSelectableMesh = false;
    sunSphere.name = "SunSphere";
    lightSun.add(sunSphere);

    const lightSunHelper = new THREE.DirectionalLightHelper(lightSun, 3, 0xcccccc);
    lightSunHelper.isLightHelper = true;
    lightSunHelper.name = `lightHelper_${  lightSun.name}`;
    lightSunHelper.category_name = 'lightHelper';
    lightSunHelper.parentLightName = lightSun.name;
    lightSunHelper.vrodos_internal_helper = true;

    // Target spot: Where Sun points
    const lightTargetSpot = new THREE.Object3D();
    lightTargetSpot.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    ));
    lightTargetSpot.children[0].isSelectableMesh = false;

    lightTargetSpot.isSelectableMesh = true;
    lightTargetSpot.name = `lightTargetSpot_${  lightSun.name}`;
    lightTargetSpot.category_name = "lightTargetSpot";
    lightTargetSpot.isLightTargetSpot = true;
    lightTargetSpot.isLight = false;
    lightTargetSpot.addedAt = addedAt;
    lightTargetSpot.position = new THREE.Vector3(0, 0, 0);
    lightTargetSpot.parentLight = lightSun;
    lightTargetSpot.parentLightHelper = lightSunHelper;

    lightSun.target.position = lightTargetSpot.position;

    // Add shadow camera helper
    const lightSunShadowhelper = new THREE.CameraHelper(lightSun.shadow.camera);
    lightSunShadowhelper.name = `lightShadowHelper_${  lightSun.name}`;
    lightSunShadowhelper.vrodos_internal_helper = true;

    VRODOS.ui.registerSceneObject(lightSun, { updateHierarchy: false, incrementLoaded: false, renderReason: 'light-sun-added' });
    VRODOS.editor.envir.scene.add(lightSunHelper);
    VRODOS.ui.registerSceneObject(lightTargetSpot, { updateHierarchy: false, incrementLoaded: false, renderReason: 'light-target-added' });
    VRODOS.editor.envir.scene.add(lightSunShadowhelper);

    lightSun.target.updateMatrixWorld();
    lightSunHelper.update();

    // Set initial transformations
    const trs_tmp = VRODOS.data.scene_data.objects[nameModel].trs;
    trs_tmp.translation[1] += 3; // Sun should be higher than objects

    lightSun.position.set(trs_tmp.translation[0], trs_tmp.translation[1], trs_tmp.translation[2]);
    lightSun.rotation.set(trs_tmp.rotation[0], trs_tmp.rotation[1], trs_tmp.rotation[2]);
    lightSun.scale.set(trs_tmp.scale[0], trs_tmp.scale[1], trs_tmp.scale[2]);

    VRODOS.ui.addInHierarchyViewer(lightSun);
    VRODOS.ui.addInHierarchyViewer(lightTargetSpot);

    lightSun.color.setHex(hexcol);
    lightSun.children[0].material.color.setHex(hexcol);
    lightSunHelper.children[0].material.color.setHex(hexcol);
    lightSunHelper.children[1].material.color.setHex(hexcol);
    lightTargetSpot.children[0].material.color.setHex(hexcol);

    VRODOS.ui.selectNewSceneObject(lightSun, { source: 'light-sun-added' });
}

/**
 * Create a Lamp light in the scene.
 */
VRODOS.api.createLightLamp = function(nameModel, addedAt) {
    const lightLamp = new THREE.PointLight(0xffffff, 1, 100, 2);
    lightLamp.name = nameModel;
    lightLamp.asset_name = "mylightLamp";
    lightLamp.isSelectableMesh = true;
    lightLamp.category_name = "lightLamp";
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
    const lampSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    lampSphere.isSelectableMesh = false;
    lampSphere.name = "LampSphere";
    lightLamp.add(lampSphere);

    const lightLampHelper = new THREE.PointLightHelper(lightLamp, 1, 0x555500);
    lightLampHelper.isLightHelper = true;
    lightLampHelper.name = `lightHelper_${  lightLamp.name}`;
    lightLampHelper.category_name = 'lightHelper';
    lightLampHelper.parentLightName = lightLamp.name;
    lightLampHelper.vrodos_internal_helper = true;

    VRODOS.ui.registerSceneObject(lightLamp, { updateHierarchy: false, incrementLoaded: false, renderReason: 'light-lamp-added' });
    VRODOS.editor.envir.scene.add(lightLampHelper);
    lightLampHelper.update();

    const trs_tmp = VRODOS.data.scene_data.objects[nameModel].trs;
    trs_tmp.translation[1] += 3;

    lightLamp.position.set(trs_tmp.translation[0], trs_tmp.translation[1], trs_tmp.translation[2]);
    lightLamp.rotation.set(trs_tmp.rotation[0], trs_tmp.rotation[1], trs_tmp.rotation[2]);
    lightLamp.scale.set(trs_tmp.scale[0], trs_tmp.scale[1], trs_tmp.scale[2]);

    lightLamp.color.setHex(hexcol);
    lightLamp.power = 10;

    VRODOS.ui.addInHierarchyViewer(lightLamp);

    VRODOS.ui.selectNewSceneObject(lightLamp, { source: 'light-lamp-added' });
}

/**
 * Create a Spot light in the scene.
 */
VRODOS.api.createLightSpot = function(nameModel, addedAt) {
    const lightSpot = new THREE.SpotLight(0xffffff, 1, 5, 0.39, 0, 2);
    lightSpot.name = nameModel;
    lightSpot.asset_name = "mylightSpot";
    lightSpot.isSelectableMesh = true;
    lightSpot.category_name = "lightSpot";
    lightSpot.isLight = true;
    lightSpot.addedAt = addedAt;

    const lightTargetSpot = new THREE.Object3D();
    lightTargetSpot.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    ));
    lightTargetSpot.children[0].isSelectableMesh = false;

    const lampSphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    lampSphere.rotation.set(Math.PI / 2, 0, 0);
    lampSphere.isSelectableMesh = false;
    lampSphere.name = "SpotSphere";
    lightSpot.add(lampSphere);

    lightTargetSpot.isSelectableMesh = true;
    lightTargetSpot.name = `lightTargetSpot_${  lightSpot.name}`;
    lightTargetSpot.category_name = "lightTargetSpot";
    lightTargetSpot.isLightTargetSpot = true;
    lightTargetSpot.isLight = false;
    lightTargetSpot.addedAt = addedAt;
    lightTargetSpot.position = new THREE.Vector3(0, 0, 0);
    lightTargetSpot.parentLight = lightSpot;

    lightSpot.target.position = lightTargetSpot.position;

    VRODOS.ui.registerSceneObject(lightSpot, { updateHierarchy: false, incrementLoaded: false, renderReason: 'light-spot-added' });
    VRODOS.ui.registerSceneObject(lightTargetSpot, { updateHierarchy: false, incrementLoaded: false, renderReason: 'light-target-added' });

    lightSpot.target.updateMatrixWorld();

    const trs_tmp = VRODOS.data.scene_data.objects[nameModel].trs;
    trs_tmp.translation[1] += 3;

    lightSpot.position.set(trs_tmp.translation[0], trs_tmp.translation[1], trs_tmp.translation[2]);
    lightSpot.rotation.set(trs_tmp.rotation[0], trs_tmp.rotation[1], trs_tmp.rotation[2]);
    lightSpot.scale.set(trs_tmp.scale[0], trs_tmp.scale[1], trs_tmp.scale[2]);

    VRODOS.ui.addInHierarchyViewer(lightSpot);
    VRODOS.ui.addInHierarchyViewer(lightTargetSpot);

    VRODOS.ui.selectNewSceneObject(lightSpot, { source: 'light-spot-added' });
}

/**
 * Create an Ambient light in the scene.
 */
VRODOS.api.createLightAmbient = function(nameModel, addedAt) {
    const lightAmbient = new THREE.AmbientLight(0xffffff, 1);
    lightAmbient.name = nameModel;
    lightAmbient.asset_name = "mylightAmbient";
    lightAmbient.isSelectableMesh = true;
    lightAmbient.category_name = "lightAmbient";
    lightAmbient.isLight = true;
    lightAmbient.addedAt = addedAt;

    const lampSphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    lampSphere.rotation.set(Math.PI / 2, 0, 0);
    lampSphere.isSelectableMesh = false;
    lampSphere.name = "ambientSphere";
    lightAmbient.add(lampSphere);

    VRODOS.ui.registerSceneObject(lightAmbient, { updateHierarchy: false, incrementLoaded: false, renderReason: 'light-ambient-added' });

    const trs_tmp = VRODOS.data.scene_data.objects[nameModel].trs;
    trs_tmp.translation[1] += 3;

    lightAmbient.position.set(trs_tmp.translation[0], trs_tmp.translation[1], trs_tmp.translation[2]);
    lightAmbient.rotation.set(trs_tmp.rotation[0], trs_tmp.rotation[1], trs_tmp.rotation[2]);
    lightAmbient.scale.set(trs_tmp.scale[0], trs_tmp.scale[1], trs_tmp.scale[2]);

    VRODOS.ui.addInHierarchyViewer(lightAmbient);

    VRODOS.ui.selectNewSceneObject(lightAmbient, { source: 'light-ambient-added' });
}

/**
 * Handle Pawn actor creation.
 */
VRODOS.api.createPawn = function(nameModel, addedAt, pluginPath) {
    const loader = new THREE.GLTFLoader();
    const modelBaseUrl = VRODOS.utils.resolveBaseUrl(VRODOS.data.pluginPath, 'modelBaseUrl', 'assets/models/');

    loader.load(
        `${modelBaseUrl  }editor/pawn.glb`,
        (gltf) => {
            const Pawn = gltf.scene.children[0];
            Pawn.name = nameModel;
            Pawn.asset_name = "myActor";
            Pawn.isSelectableMesh = true;
            Pawn.category_name = "pawn";
            Pawn.isLight = false;
            Pawn.addedAt = addedAt;

            const indexPawn = VRODOS.utils.getNextPawnIndex(VRODOS.editor.envir.scene);

            const pawnLabelDiv = document.createElement('div');
            pawnLabelDiv.textContent = `Actor ${  indexPawn}`;
            pawnLabelDiv.style.marginTop = '-1em';
            pawnLabelDiv.style.fontSize = '26px';
            pawnLabelDiv.style.color = "yellow";

            const pawnLabel = new THREE.CSS2DObject(pawnLabelDiv);
            pawnLabel.position.set(0, 1.5, 0);
            Pawn.add(pawnLabel);

            VRODOS.ui.registerSceneObject(Pawn, { updateHierarchy: false, incrementLoaded: false, renderReason: 'pawn-added' });

            const trs_tmp = VRODOS.data.scene_data.objects[nameModel].trs;
            trs_tmp.translation[1] += 3;

            Pawn.position.set(trs_tmp.translation[0], trs_tmp.translation[1], trs_tmp.translation[2]);
            Pawn.rotation.set(trs_tmp.rotation[0], trs_tmp.rotation[1], trs_tmp.rotation[2]);
            Pawn.scale.set(trs_tmp.scale[0], trs_tmp.scale[1], trs_tmp.scale[2]);

            VRODOS.ui.addInHierarchyViewer(Pawn);

            VRODOS.ui.selectNewSceneObject(Pawn, { source: 'pawn-added' });
        },
        null,
        (error) => console.log('Error loading Pawn GLB:', error)
    );
}

/**
 * Handle regular GLB asset loading.
 */
VRODOS.api.createGlbAsset = function(nameModel, addedAt, pluginPath) {
    document.getElementById("progress").style.display = "block";
    document.getElementById("progressWrapper").style.visibility = "visible";
    document.getElementById("result_download").innerHTML = "Loading";

    const manager = new THREE.LoadingManager();
    manager.onProgress = (item, loaded, total) => {
        const progressEl = document.getElementById("result_download");
        if (progressEl) {
            const assetName = VRODOS.utils.decodeDisplayText(VRODOS.data.scene_data.objects[nameModel].asset_name || nameModel);
            progressEl.textContent = `${assetName} loading part ${loaded} / ${total}`;
        }
    };

    manager.onLoad = () => {
        const insertedObject = getSceneObjectByName(nameModel);
        if (!insertedObject) return;
        const trs_tmp = VRODOS.data.scene_data.objects[nameModel].trs;

        insertedObject.position.set(trs_tmp.translation[0], trs_tmp.translation[1], trs_tmp.translation[2]);
        insertedObject.rotation.set(trs_tmp.rotation[0], trs_tmp.rotation[1], trs_tmp.rotation[2]);
        insertedObject.scale.set(trs_tmp.scale[0], trs_tmp.scale[1], trs_tmp.scale[2]);

        if (insertedObject.children[0].isMesh) {
            const mat = insertedObject.children[0].material;
            if (isNaN(mat.metalness)) {
                mat.metalness = 0;
                mat.roughness = 0.5;
                mat.emissiveIntensity = 0;
                if (mat.color.r + mat.color.g + mat.color.b === 0) {
                    mat.color = new THREE.Color("rgb(50%, 50%, 50%)");
                }
            }
        }

        VRODOS.ui.addInHierarchyViewer(insertedObject);

        VRODOS.ui.selectNewSceneObject(insertedObject, { source: 'glb-added' });
        if (typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender('asset-added');
        }
        document.getElementById("progressWrapper").style.visibility = "hidden";
    };

    const loaderMulti = new VRODOS.loader.LoaderMulti();
    loaderMulti.load(manager, { [nameModel]: VRODOS.data.scene_data.objects[nameModel] }, VRODOS.data.pluginPath);
}

VRODOS.api.createAssessmentAsset = function(nameModel, addedAt) {
    const resource = VRODOS.data.scene_data.objects[nameModel] || {};
    const assessmentObject = VRODOS.ui.createAssessmentPlaceholder(nameModel, {
        ...resource,
        addedAt
    });

    const trs_tmp = resource.trs || {
        translation: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
    };

    assessmentObject.position.set(trs_tmp.translation[0], trs_tmp.translation[1], trs_tmp.translation[2]);
    assessmentObject.rotation.set(trs_tmp.rotation[0], trs_tmp.rotation[1], trs_tmp.rotation[2]);
    assessmentObject.scale.set(trs_tmp.scale[0], trs_tmp.scale[1], trs_tmp.scale[2]);

    VRODOS.ui.registerSceneObject(assessmentObject, {
        selectable: true,
        updateHierarchy: true,
        incrementLoaded: false,
        renderReason: 'assessment-added'
    });
    VRODOS.ui.selectNewSceneObject(assessmentObject, { source: 'assessment-added' });
}

VRODOS.api.createTextAsset = function(nameModel, addedAt) {
    const resource = VRODOS.data.scene_data.objects[nameModel] || {};
    const textObject = VRODOS.loader.createTextPanelObject(nameModel, {
        ...resource,
        addedAt
    });

    VRODOS.loader.setObjectProperties(textObject, nameModel, VRODOS.data.scene_data.objects);
    textObject.addedAt = addedAt;

    VRODOS.ui.registerSceneObject(textObject, {
        selectable: true,
        updateHierarchy: true,
        incrementLoaded: false,
        renderReason: 'text-added'
    });
    VRODOS.ui.selectNewSceneObject(textObject, { source: 'text-added' });
}

/**
 * Main function to add objects to the canvas.
 */
VRODOS.api.addAssetToCanvas = function(nameModel, path, categoryName, dataDrag, translation, pluginPath) {
    const addedAt = VRODOS.utils.getSceneObjectAddedAt(dataDrag);

    // Initial persistence structure
    VRODOS.data.scene_data.objects[nameModel] = {
        path,
        "trs": {
            "translation": [translation[0], translation[1], translation[2]],
            "rotation": [0, 0, 0],
            "scale": [1, 1, 1]
        },
        "fnPath": (function() {
            if (!path) return '';
            const idx = path.indexOf('uploads/');
            return idx !== -1 ? path.substring(idx + 8) : path.substring(path.lastIndexOf('/') + 1);
        })(),
        "asset_name": nameModel,
        "category_name": categoryName,
        "isLight": categoryName.includes("light"),
        addedAt,
    };

    // Copy drag data properties
    Object.keys(dataDrag).forEach((key) => {
        VRODOS.data.scene_data.objects[nameModel][key] = dataDrag[key];
    });

    const categoryHandlers = {
        'lightSun': () => VRODOS.api.createLightSun(nameModel, addedAt),
        'lightLamp': () => VRODOS.api.createLightLamp(nameModel, addedAt),
        'lightSpot': () => VRODOS.api.createLightSpot(nameModel, addedAt),
        'lightAmbient': () => VRODOS.api.createLightAmbient(nameModel, addedAt),
        'Pawn': () => VRODOS.api.createPawn(nameModel, addedAt, VRODOS.data.pluginPath),
        'pawn': () => VRODOS.api.createPawn(nameModel, addedAt, VRODOS.data.pluginPath),
        '3D Text': () => VRODOS.api.createTextAsset(nameModel, addedAt),
        '3d-text': () => VRODOS.api.createTextAsset(nameModel, addedAt),
        'Assessment': () => VRODOS.api.createAssessmentAsset(nameModel, addedAt),
        'assessment': () => VRODOS.api.createAssessmentAsset(nameModel, addedAt)
    };

    // Execute the specific handler or fallback to generic GLB asset loader
    if (categoryHandlers[categoryName]) {
        categoryHandlers[categoryName]();
    } else {
        VRODOS.api.createGlbAsset(nameModel, addedAt, VRODOS.data.pluginPath);
    }

    // [NEW] Capture for Undo Manager
    if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
        VRODOS.editor.undoManager.add(new VRODOS.editor.AddObjectCommand(nameModel, VRODOS.data.scene_data.objects[nameModel]));
    }
}


VRODOS.ui.deleteFomScene = function(uuid, name) {

    if (name) {
        document.getElementById("confirm-asset-deletion-title").innerHTML = `Delete ${  name  }?`;
        document.getElementById("confirm-asset-deletion-description").innerHTML = `Do you really want to delete the asset named <b>${  name  }</b>?`;
    }

    const selectedObject = VRODOS.editor.transforms.getRealObject();

    VRODOS.editor.selection.clear({ source: 'delete-dialog-open', hidePanel: false });

    const delete_dialog_element = document.getElementById('confirm-deletion-dialog');
    delete_dialog_element.showModal();

    const delUuid = uuid;
    const selUuid = selectedObject ? selectedObject.uuid : "unassigned";
    // var selUuid = (typeof checkUuid != "undefined") ? checkUuid : "unassigned";
    const delete_btn_element = document.getElementById("delete-asset-btn-confirmation");
    delete_btn_element.addEventListener('click', () => {
        delete_dialog_element.close();
        VRODOS.editor.selection.clear({ source: 'delete-confirmed', hidePanel: false });
        VRODOS.api.deleteAssetFromScene(uuid, true);
        if (selUuid !== "unassigned") {
            if (delUuid !== selUuid) {
                const objectToReselect = getSceneObjectByUuid(selUuid);
                if (objectToReselect) {
                    VRODOS.editor.selection.select(objectToReselect, { source: 'delete-reselect' });
                }
            } else {
                VRODOS.ui.hideObjectControlsPanel();
            }
        } else {
            VRODOS.ui.hideObjectControlsPanel();
        }
       
    }, { once: true });
}

VRODOS.ui.removeHierarchyEntriesForObject = function(uuid, objectName) {
    document.querySelectorAll('#hierarchy-viewer .hierarchyItem').forEach((item) => {
        if (
            item.id === uuid ||
            item.getAttribute('data-uuid') === uuid ||
            item.getAttribute('data-name') === objectName
        ) {
            item.remove();
        }
    });
    if (typeof VRODOS.ui.updateHierarchyViewerCount === 'function') {
        VRODOS.ui.updateHierarchyViewerCount();
    }
}

VRODOS.ui.lockOnScene = function(uuid, name) {

    const selectedObject = getSceneObjectByUuid(uuid);
    const hierarchyItem = document.getElementById(uuid);
    if (!selectedObject) return;

    if (selectedObject.locked){
        selectedObject.locked = false;
        VRODOS.editor.selection.select(selectedObject, { source: 'lock-toggle' });
        VRODOS.ui.showObjectControlsPanel();
    }else{
        selectedObject.locked = true;
        VRODOS.editor.selection.clear({ source: 'lock-toggle' });
        VRODOS.ui.hideObjectControlsPanel();
    }

    // Update the lock icon in the hierarchy viewer (Lucide)
    if (hierarchyItem) {
        const lockAnchor = hierarchyItem.querySelector('a[aria-label="Lock asset"]');
        if (lockAnchor) {
            const newIcon = selectedObject.locked ? 'lock' : 'lock-open';
            lockAnchor.innerHTML = `<i data-lucide="${  newIcon  }" class="tw-w-4 tw-h-4"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [lockAnchor] });
        }
    }

    VRODOS.ui.setBackgroundColorHierarchyViewer(uuid);

    VRODOS.api.saveChanges();

}

/**
 *
 * Delete from scene
 *
 * @param uuid
 * @param preventDispose
 */
VRODOS.api.deleteAssetFromScene = function(uuid, preventDispose = false) {

    // 1. Delete object from js array (if it exists. Usually it is saved after reload)
    for (const obj of Object.values(VRODOS.data.scene_data.objects)) {
        if (typeof obj === 'object' && obj !== null && obj.uuid == uuid) {
            delete VRODOS.data.scene_data.objects[obj.name];
            break;
        }
    }

    const objectSelected = getSceneObjectByUuid(uuid);

    if (!objectSelected) return;

    // [NEW] Capture for Undo Manager before deletion
    if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
        const target = objectSelected.realObject || objectSelected;
        const objData = VRODOS.data.scene_data.objects[target.name];
        if (objData) {
            VRODOS.editor.undoManager.add(new VRODOS.editor.DeleteObjectCommand(target.name, objData, target));
        }
    }


    // remove animations
    VRODOS.editor.isPaused = true;
    VRODOS.editor.envir.animationMixers = VRODOS.editor.envir.animationMixers.filter(el => el._root.name !== objectSelected.name);
    VRODOS.editor.isPaused = false;

    // If deleting light then remove also its LightHelper and lightTargetSpot and Shadow Helper
    if (objectSelected.isLight) {
        // Sun Shadow Helper
        const shadowHelper = VRODOS.editor.envir.scene.getObjectByName(`lightShadowHelper_${  objectSelected.name}`);
        if (shadowHelper) { shadowHelper.dispose(); VRODOS.editor.envir.scene.remove(shadowHelper); }

        // Sun target spot
        const targetSpot = VRODOS.editor.envir.scene.getObjectByName(`lightTargetSpot_${  objectSelected.name}`);
        if (targetSpot) {
            VRODOS.editor.sceneRegistry.remove(targetSpot, { reason: 'light-target-removed' });
        }

        // Sun target spot remove from hierarchy viewer
        VRODOS.ui.removeHierarchyEntriesForObject('', `lightTargetSpot_${objectSelected.name}`);

        // Light Helper (for all lights)
        const lightHelper = VRODOS.editor.envir.scene.getObjectByName(`lightHelper_${  objectSelected.name}`);
        if (lightHelper) { lightHelper.dispose(); VRODOS.editor.envir.scene.remove(lightHelper); }
    }
    

    // Remove cel outline if present
    if (typeof VRODOS.ui.removeCelOutline === 'function') VRODOS.ui.removeCelOutline(objectSelected);

    VRODOS.editor.selection.clear({ source: 'object-deleted' });

    // prevent orbiting
    document.dispatchEvent(new CustomEvent("mouseup", { "detail": "Example of an event" }));

    // Dispose GPU resources (geometry, materials, textures) to prevent VRAM leaks
    if (!preventDispose) {
        VRODOS.utils.disposeObject(objectSelected);
    }

    // Remove object from scene
    VRODOS.editor.sceneRegistry.remove(objectSelected, { reason: 'object-deleted' });

    // Remove from hierarchy viewer
    VRODOS.ui.removeHierarchyEntriesForObject(uuid, objectSelected.name);

    if (VRODOS.editor.render && typeof VRODOS.editor.render.request === 'function') {
        VRODOS.editor.render.request('object-deleted');
    }

    // Save scene
    VRODOS.api.triggerAutoSave();
}

/**
 * Dispose GPU resources (geometry, materials, textures) to prevent VRAM leaks
 */
VRODOS.utils.disposeObject = function(object) {
    if (!object) return;
    object.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach((mat) => {
                for (const key in mat) {
                    if (mat[key] && typeof mat[key].dispose === 'function') {
                        mat[key].dispose(); // textures, env maps, etc.
                    }
                }
                mat.dispose();
            });
        }
    });
}
