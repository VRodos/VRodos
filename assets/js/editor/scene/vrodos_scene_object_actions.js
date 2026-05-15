VRODOS.utils.getSceneObjectAddedAt = function(dataDrag) {
    const existingValue = dataDrag && dataDrag.addedAt ? Number(dataDrag.addedAt) : 0;
    return Number.isFinite(existingValue) && existingValue > 0
        ? Math.floor(existingValue)
        : Math.floor(Date.now() / 1000);
}

function getSceneObjectByUuid(uuid) {
    if (!uuid || !VRODOS.editor.sceneRegistry) return null;
    return VRODOS.editor.sceneRegistry.get(uuid);
}

function getSceneObjectByName(name) {
    if (!name || !VRODOS.editor.sceneRegistry) return null;
    return VRODOS.editor.sceneRegistry.get(name);
}

function getPendingSceneObjectAdds() {
    VRODOS.editor.pendingSceneObjectAdds = VRODOS.editor.pendingSceneObjectAdds || new Map();
    return VRODOS.editor.pendingSceneObjectAdds;
}

function prunePendingSceneObjectAdds() {
    const pendingAdds = getPendingSceneObjectAdds();
    const now = Date.now();
    pendingAdds.forEach((startedAt, objectName) => {
        if (now - startedAt > 30000) {
            pendingAdds.delete(objectName);
        }
    });
}

function markSceneObjectAddPending(nameModel) {
    if (!nameModel) {
        return;
    }

    const pendingAdds = getPendingSceneObjectAdds();
    pendingAdds.set(nameModel, Date.now());
    window.setTimeout(() => {
        const startedAt = pendingAdds.get(nameModel);
        if (startedAt && Date.now() - startedAt > 14000) {
            pendingAdds.delete(nameModel);
        }
    }, 15000);
}

function isSceneObjectAddPending(nameModel) {
    if (!nameModel) {
        return false;
    }

    prunePendingSceneObjectAdds();
    return getPendingSceneObjectAdds().has(nameModel);
}

function clearSceneObjectAddPending(nameModel) {
    if (!nameModel || !VRODOS.editor.pendingSceneObjectAdds) {
        return;
    }

    VRODOS.editor.pendingSceneObjectAdds.delete(nameModel);
}

function getSceneObjectRecord(nameModel) {
    return (VRODOS.data && VRODOS.data.scene_data && VRODOS.data.scene_data.objects)
        ? VRODOS.data.scene_data.objects[nameModel]
        : null;
}

function applyAddedObjectTRS(object, nameModel, options) {
    const opts = options || {};
    const record = getSceneObjectRecord(nameModel);
    if (!record) {
        return object;
    }

    record.trs = record.trs || {};
    if (opts.yOffset) {
        record.trs.translation = VRODOS.utils.safeVector(record.trs.translation, [0, 0, 0]);
        record.trs.translation[1] += opts.yOffset;
    }

    return VRODOS.utils.applyTRSToObject(object, record.trs);
}

function addedObjectRegisterOptions(renderReason) {
    return { selectable: true, incrementLoaded: false, renderReason };
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

VRODOS.ui.finalizeSceneObjectAdd = function(object, options) {
    const opts = Object.assign({
        alreadyRegistered: false,
        registerOptions: {},
        updateHierarchy: true,
        select: true,
        selectOptions: {}
    }, options || {});

    const registeredObject = opts.alreadyRegistered
        ? object
        : VRODOS.ui.registerSceneObject(object, Object.assign({}, opts.registerOptions || {}, {
            updateHierarchy: false,
            select: false,
            frame: false,
            autosave: false
        }));

    if (!registeredObject || registeredObject !== object) {
        return registeredObject;
    }

    if (opts.updateHierarchy && typeof VRODOS.ui.addInHierarchyViewer === 'function') {
        VRODOS.ui.addInHierarchyViewer(registeredObject);
    }

    if (opts.select) {
        VRODOS.ui.selectNewSceneObject(registeredObject, opts.selectOptions || {});
    }

    return registeredObject;
}

VRODOS.utils.normalizeAssessmentLevels = function(levels) {
    return typeof VRODOS.utils.normalizeCefrLevels === 'function'
        ? VRODOS.utils.normalizeCefrLevels(levels)
        : [];
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

    const resolvedType = VRODOS.utils.displayText(type || 'Assessment').trim() || 'Assessment';
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

    const texture = VRODOS.loader.createCanvasTexture(canvas);

    const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(1.02, 0.38),
        VRODOS.loader.createDoubleSidedTextureMaterial(texture, {
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
    typeEl.textContent = VRODOS.utils.displayText(type || 'Assessment');
    typeEl.style.fontSize = '10px';
    typeEl.style.fontWeight = '700';
    typeEl.style.textTransform = 'uppercase';
    typeEl.style.letterSpacing = '0.08em';
    typeEl.style.color = '#38bdf8';
    typeEl.style.marginBottom = '4px';

    const titleEl = document.createElement('div');
    titleEl.textContent = VRODOS.utils.displayText(title || 'Assessment');
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
    resource = VRODOS.utils.normalizeDisplayTextFields(Object.assign({}, resource || {}));

    const assessmentGroup = new THREE.Group();
    const assessmentSourceId = String(resource.assessment_source_id || '').trim();
    assessmentGroup.name = nameModel;
    assessmentGroup.asset_name = VRODOS.utils.displayText(resource.asset_name || resource.assessment_title || 'Assessment');
    assessmentGroup.asset_slug = resource.asset_slug || '';
    assessmentGroup.asset_id = resource.asset_id || 0;
    assessmentGroup.category_name = resource.category_name || 'Assessment';
    assessmentGroup.category_slug = 'assessment';
    assessmentGroup.assessment_title = VRODOS.utils.displayText(resource.assessment_title || resource.asset_name || 'Assessment');
    assessmentGroup.assessment_type = VRODOS.utils.displayText(resource.assessment_type || '');
    assessmentGroup.assessment_group = VRODOS.utils.displayText(resource.assessment_group || '');
    assessmentGroup.assessment_source_id = resource.assessment_source_id || '';
    assessmentGroup.assessment_content = resource.assessment_content || '';
    assessmentGroup.assessment_levels = VRODOS.utils.normalizeAssessmentLevels(resource.assessment_levels || '');
    assessmentGroup.assessment_supported = resource.assessment_supported || 'false';
    assessmentGroup.immerse_managed = resource.immerse_managed || (assessmentSourceId ? 'true' : '');
    assessmentGroup.immerse_object_type = resource.immerse_object_type || (assessmentSourceId ? 'assessment' : '');
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
    const sunSphere = VRODOS.utils.createEditorLightVisualSphere('SunSphere', {
        radius: 1,
        color: 0xffffff
    });
    lightSun.add(sunSphere);

    const lightSunHelper = VRODOS.utils.createEditorLightHelper(lightSun, {
        size: 3,
        color: 0xcccccc
    });

    // Target spot: Where Sun points
    const lightTargetSpot = VRODOS.utils.createEditorLightTarget(lightSun, {
        addedAt,
        color: 0xffffff,
        helper: lightSunHelper
    });

    // Add shadow camera helper
    const lightSunShadowhelper = VRODOS.utils.createEditorLightShadowHelper(lightSun);

    applyAddedObjectTRS(lightSun, nameModel, { yOffset: 3 });

    lightSun.color.setHex(hexcol);
    lightSun.children[0].material.color.setHex(hexcol);
    lightSunHelper.children[0].material.color.setHex(hexcol);
    lightSunHelper.children[1].material.color.setHex(hexcol);
    lightTargetSpot.children[0].material.color.setHex(hexcol);

    const registeredLightSun = VRODOS.ui.finalizeSceneObjectAdd(lightSun, {
        registerOptions: addedObjectRegisterOptions('light-sun-added'),
        select: false
    });
    if (registeredLightSun !== lightSun) {
        return registeredLightSun;
    }

    VRODOS.editor.envir.scene.add(lightSunHelper);
    const registeredLightTarget = VRODOS.ui.finalizeSceneObjectAdd(lightTargetSpot, {
        registerOptions: addedObjectRegisterOptions('light-target-added'),
        select: false
    });
    if (registeredLightTarget && registeredLightTarget !== lightTargetSpot) {
        VRODOS.utils.linkDirectionalLightTarget(lightSun, registeredLightTarget);
    }
    if (lightSunShadowhelper) {
        VRODOS.editor.envir.scene.add(lightSunShadowhelper);
    }

    VRODOS.utils.syncEditorLightArtifacts(lightSun, VRODOS.editor.envir.scene);
    VRODOS.ui.selectNewSceneObject(lightSun, { source: 'light-sun-added' });
    return lightSun;
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
    const lampSphere = VRODOS.utils.createEditorLightVisualSphere('LampSphere', {
        radius: 0.5,
        color: 0xffff00
    });
    lightLamp.add(lampSphere);

    const lightLampHelper = VRODOS.utils.createEditorLightHelper(lightLamp, {
        size: 1,
        color: 0x555500
    });

    applyAddedObjectTRS(lightLamp, nameModel, { yOffset: 3 });

    lightLamp.color.setHex(hexcol);
    lightLamp.power = 10;

    const registeredLightLamp = VRODOS.ui.finalizeSceneObjectAdd(lightLamp, {
        registerOptions: addedObjectRegisterOptions('light-lamp-added'),
        select: false
    });
    if (registeredLightLamp !== lightLamp) {
        return registeredLightLamp;
    }

    VRODOS.editor.envir.scene.add(lightLampHelper);
    lightLampHelper.update();
    VRODOS.ui.selectNewSceneObject(lightLamp, { source: 'light-lamp-added' });
    return lightLamp;
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

    const lampSphere = VRODOS.utils.createEditorLightVisualSphere('SpotSphere', {
        radius: 1,
        color: 0xffff00,
        rotation: [Math.PI / 2, 0, 0]
    });
    lightSpot.add(lampSphere);

    const lightSpotHelper = VRODOS.utils.createEditorLightHelper(lightSpot, {
        color: 0xffaa00
    });
    const lightTargetSpot = VRODOS.utils.createEditorLightTarget(lightSpot, {
        addedAt,
        color: 0xffaa00,
        helper: lightSpotHelper
    });

    applyAddedObjectTRS(lightSpot, nameModel, { yOffset: 3 });

    const registeredLightSpot = VRODOS.ui.finalizeSceneObjectAdd(lightSpot, {
        registerOptions: addedObjectRegisterOptions('light-spot-added'),
        select: false
    });
    if (registeredLightSpot !== lightSpot) {
        return registeredLightSpot;
    }

    const registeredLightTarget = VRODOS.ui.finalizeSceneObjectAdd(lightTargetSpot, {
        registerOptions: addedObjectRegisterOptions('light-target-added'),
        select: false
    });
    if (registeredLightTarget && registeredLightTarget !== lightTargetSpot) {
        VRODOS.utils.linkEditorLightTarget(lightSpot, registeredLightTarget);
        registeredLightTarget.parentLightHelper = lightSpotHelper;
    }
    VRODOS.editor.envir.scene.add(lightSpotHelper);
    VRODOS.utils.syncEditorLightArtifacts(lightSpot, VRODOS.editor.envir.scene);
    VRODOS.ui.selectNewSceneObject(lightSpot, { source: 'light-spot-added' });
    return lightSpot;
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

    const lampSphere = VRODOS.utils.createEditorLightVisualSphere('ambientSphere', {
        radius: 1,
        color: 0xffff00,
        rotation: [Math.PI / 2, 0, 0]
    });
    lightAmbient.add(lampSphere);

    applyAddedObjectTRS(lightAmbient, nameModel, { yOffset: 3 });

    return VRODOS.ui.finalizeSceneObjectAdd(lightAmbient, {
        registerOptions: addedObjectRegisterOptions('light-ambient-added'),
        selectOptions: { source: 'light-ambient-added' }
    });
}

/**
 * Handle Pawn actor creation.
 */
VRODOS.api.createPawn = function(nameModel, addedAt, _pluginPath) {
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

            applyAddedObjectTRS(Pawn, nameModel, { yOffset: 3 });

            VRODOS.ui.finalizeSceneObjectAdd(Pawn, {
                registerOptions: addedObjectRegisterOptions('pawn-added'),
                selectOptions: { source: 'pawn-added' }
            });
        },
        null,
        (error) => console.log('Error loading Pawn GLB:', error)
    );
}

/**
 * Handle regular GLB asset loading.
 */
VRODOS.api.createGlbAsset = function(nameModel, _addedAt, _pluginPath) {
    VRODOS.api.showSceneLoadingProgress("Loading", { immediate: true });

    const manager = new THREE.LoadingManager();
    VRODOS.api.configureSceneLoadingManager(manager, {
        onProgress: (_item, loaded, total) => {
            const assetName = VRODOS.utils.displayText(VRODOS.data.scene_data.objects[nameModel].asset_name || nameModel);
            VRODOS.api.setSceneLoadingProgressText(`${assetName} loading part ${loaded} / ${total}`, { immediate: true });
        },
        onLoad: () => {
            const insertedObject = getSceneObjectByName(nameModel);
            if (!insertedObject) {
                VRODOS.api.hideSceneLoadingProgress();
                return;
            }
            applyAddedObjectTRS(insertedObject, nameModel);

            VRODOS.loader.prepareLoadedGlbRootMaterial(insertedObject);

            VRODOS.ui.finalizeSceneObjectAdd(insertedObject, {
                alreadyRegistered: true,
                selectOptions: { source: 'glb-added' }
            });
            if (typeof VRODOS.editor.requestRender === 'function') {
                VRODOS.editor.requestRender('asset-added');
            }
            VRODOS.api.hideSceneLoadingProgress();
        }
    });

    const loaderMulti = new VRODOS.loader.LoaderMulti();
    loaderMulti.load(manager, { [nameModel]: VRODOS.data.scene_data.objects[nameModel] }, VRODOS.data.pluginPath);
}

VRODOS.api.createAssessmentAsset = function(nameModel, addedAt) {
    const resource = VRODOS.data.scene_data.objects[nameModel] || {};
    if (typeof VRODOS.utils.hasCompleteAssessmentMetadata === 'function' && !VRODOS.utils.hasCompleteAssessmentMetadata(resource)) {
        console.warn('VRodos: skipped incomplete assessment scene object', {
            name: nameModel,
            asset_id: resource.asset_id || '',
            assessment_source_id: resource.assessment_source_id || ''
        });
        return null;
    }

    const assessmentObject = VRODOS.ui.createAssessmentPlaceholder(nameModel, {
        ...resource,
        addedAt
    });

    VRODOS.utils.applyTRSToObject(assessmentObject, resource.trs);

    VRODOS.ui.finalizeSceneObjectAdd(assessmentObject, {
        registerOptions: addedObjectRegisterOptions('assessment-added'),
        selectOptions: { source: 'assessment-added' }
    });

    return assessmentObject;
}

VRODOS.api.createTextAsset = function(nameModel, addedAt) {
    const resource = VRODOS.data.scene_data.objects[nameModel] || {};
    const textObject = VRODOS.loader.createTextPanelObject(nameModel, {
        ...resource,
        addedAt
    });

    VRODOS.loader.setObjectProperties(textObject, nameModel, VRODOS.data.scene_data.objects);
    textObject.addedAt = addedAt;

    VRODOS.ui.finalizeSceneObjectAdd(textObject, {
        registerOptions: addedObjectRegisterOptions('text-added'),
        selectOptions: { source: 'text-added' }
    });
}

/**
 * Main function to add objects to the canvas.
 */
VRODOS.api.addAssetToCanvas = function(nameModel, path, categoryName, dataDrag, translation, _pluginPath) {
    if (!nameModel) {
        return null;
    }

    dataDrag = VRODOS.utils.normalizeDisplayTextFields(Object.assign({}, dataDrag || {}));
    const pendingResource = Object.assign({
        category_name: categoryName,
        category_slug: dataDrag.category_slug || categoryName
    }, dataDrag);
    if (
        typeof VRODOS.utils.isAssessmentResource === 'function' &&
        VRODOS.utils.isAssessmentResource(pendingResource) &&
        typeof VRODOS.utils.hasCompleteAssessmentMetadata === 'function' &&
        !VRODOS.utils.hasCompleteAssessmentMetadata(pendingResource)
    ) {
        console.warn('VRodos: assessment asset is missing required metadata and was not added to the scene', {
            name: nameModel,
            asset_id: pendingResource.asset_id || '',
            assessment_source_id: pendingResource.assessment_source_id || ''
        });
        const progressEl = document.getElementById("result_download");
        if (progressEl) {
            progressEl.innerHTML = "Assessment metadata is incomplete. Refresh assets and try again.";
        }
        return null;
    }

    const existingObject = getSceneObjectByName(nameModel);
    if (existingObject || isSceneObjectAddPending(nameModel)) {
        console.warn("VRodos: skipped duplicate scene object add", nameModel);
        return existingObject || null;
    }

    markSceneObjectAddPending(nameModel);
    translation = Array.isArray(translation) ? translation : [0, 0, 0];
    const addedAt = VRODOS.utils.getSceneObjectAddedAt(dataDrag);

    VRODOS.data.scene_data.objects[nameModel] = VRODOS.utils.sceneCreateObjectRecord(nameModel, path, categoryName, dataDrag, translation, addedAt);

    const categoryHandlers = {
        'lightSun': () => VRODOS.api.createLightSun(nameModel, addedAt),
        'lightLamp': () => VRODOS.api.createLightLamp(nameModel, addedAt),
        'lightSpot': () => VRODOS.api.createLightSpot(nameModel, addedAt),
        'lightAmbient': () => VRODOS.api.createLightAmbient(nameModel, addedAt),
        'pawn': () => VRODOS.api.createPawn(nameModel, addedAt, VRODOS.data.pluginPath),
        '3d-text': () => VRODOS.api.createTextAsset(nameModel, addedAt),
        'assessment': () => VRODOS.api.createAssessmentAsset(nameModel, addedAt)
    };
    const addCategory = VRODOS.utils.normalizeSceneAssetCategory(categoryName);

    // Execute the specific handler or fallback to generic GLB asset loader
    try {
        if (categoryHandlers[addCategory]) {
            categoryHandlers[addCategory]();
        } else {
            VRODOS.api.createGlbAsset(nameModel, addedAt, VRODOS.data.pluginPath);
        }
    } catch (error) {
        clearSceneObjectAddPending(nameModel);
        delete VRODOS.data.scene_data.objects[nameModel];
        throw error;
    }

    // [NEW] Capture for Undo Manager
    if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
        VRODOS.editor.undoManager.add(new VRODOS.editor.AddObjectCommand(nameModel, VRODOS.data.scene_data.objects[nameModel]));
    }

    return getSceneObjectByName(nameModel);
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

VRODOS.ui.lockOnScene = function(uuid, _name) {

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
        if (typeof obj === 'object' && obj !== null && String(obj.uuid) === String(uuid)) {
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

    // If deleting light then remove its editor-only helper, target, and shadow helper artifacts.
    if (objectSelected.isLight) {
        VRODOS.utils.removeEditorLightArtifacts(objectSelected, VRODOS.editor.envir.scene, {
            dispose: true,
            removeHierarchy: true
        });
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
