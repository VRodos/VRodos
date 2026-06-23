"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};

const VRODOS_LOADER_TEXTURE_MAP_SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'];

VRODOS.utils.runLimitedTasks = async function(tasks, limit) {
    const queue = Array.isArray(tasks) ? tasks : [];
    const safeLimit = Math.max(1, Number(limit) || 1);
    const workers = [];
    let nextIndex = 0;

    async function runNext() {
        while (nextIndex < queue.length) {
            const task = queue[nextIndex];
            nextIndex++;
            if (typeof task !== 'function') {
                continue;
            }
            await task();
        }
    }

    for (let i = 0; i < Math.min(safeLimit, queue.length); i++) {
        workers.push(runNext());
    }

    return Promise.allSettled(workers);
};

VRODOS.loader.shouldBuildHierarchyDuringLoad = function() {
    return !(VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading);
};

VRODOS.loader.prepareDirectorCameraObject = function(object) {
    if (!object) return null;

    object.name = "Camera3Dmodel";
    object.vrodos_internal_helper = true;
    object.isSelectableMesh = true;
    object.renderOrder = 1;

    if (typeof object.traverse === 'function') {
        object.traverse((child) => {
            child.vrodos_internal_helper = true;
            if (child !== object) {
                child.isSelectableMesh = Boolean(child.isMesh);
            }
        });
    }

    if (object.children && object.children[0]) {
        object.children[0].name = "Camera3DmodelMesh";
    }

    return object;
};

VRODOS.loader.getEditorTextureAnisotropy = function() {
    const envir = VRODOS.editor ? VRODOS.editor.envir : null;
    const renderer = envir ? envir.renderer : null;
    const rendererMaxAniso = renderer && renderer.capabilities &&
        typeof renderer.capabilities.getMaxAnisotropy === 'function'
        ? renderer.capabilities.getMaxAnisotropy()
        : 1;
    const editorAnisoCap = envir && typeof envir.getEditorTextureAnisotropyCap === 'function'
        ? envir.getEditorTextureAnisotropyCap()
        : 4;

    return Math.min(Math.max(1, Number(rendererMaxAniso) || 1), Math.max(1, Number(editorAnisoCap) || 1));
};

VRODOS.loader.applyTextureAnisotropy = function(object, maxAniso) {
    const safeMaxAniso = Math.max(1, Number(maxAniso) || 1);
    if (!object || typeof object.traverse !== 'function' || safeMaxAniso <= 1) {
        return false;
    }

    object.traverse((node) => {
        if (!node.isMesh) return;

        const mats = Array.isArray(node.material) ? node.material : [node.material];
        for (const mat of mats) {
            if (!mat) continue;

            for (const slot of VRODOS_LOADER_TEXTURE_MAP_SLOTS) {
                if (mat[slot] && mat[slot].isTexture) {
                    mat[slot].anisotropy = safeMaxAniso;
                    mat[slot].needsUpdate = true;
                }
            }
        }
    });

    return true;
};

VRODOS.loader.createCanvasTexture = function(canvas) {
    const texture = new THREE.CanvasTexture(canvas);
    if (typeof THREE.SRGBColorSpace !== 'undefined') {
        texture.colorSpace = THREE.SRGBColorSpace;
    }
    texture.needsUpdate = true;
    return texture;
};

VRODOS.loader.createDoubleSidedTextureMaterial = function(texture, options) {
    const material = new THREE.MeshBasicMaterial(Object.assign({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    }, options || {}));
    material.needsUpdate = true;
    return material;
};

VRODOS.loader.prepareFallbackPbrMaterial = function(material) {
    if (!material || !Number.isNaN(Number(material.metalness))) {
        return material;
    }

    material.metalness = 0;
    material.roughness = 0.5;
    material.emissiveIntensity = 0;

    const color = material.color;
    if (
        color &&
        Number(color.r) + Number(color.g) + Number(color.b) === 0 &&
        typeof THREE.Color === 'function'
    ) {
        material.color = new THREE.Color("rgb(50%, 50%, 50%)");
    }

    return material;
};

VRODOS.loader.prepareLoadedGlbRootMaterial = function(object) {
    const firstChild = object && object.children ? object.children[0] : null;
    if (!firstChild || !firstChild.isMesh) {
        return object;
    }

    const materials = Array.isArray(firstChild.material) ? firstChild.material : [firstChild.material];
    materials.forEach((material) => {
        VRODOS.loader.prepareFallbackPbrMaterial(material);
    });

    return object;
};

function vrodosLoaderApplyVideoTextureToMesh(node, texture) {
    node.material = VRODOS.loader.createDoubleSidedTextureMaterial(texture);
}

function vrodosLoaderIsVideoScreenMesh(node) {
    const nodeName = (node && node.name ? node.name : "").toLowerCase();
    return nodeName.includes('screen') || nodeName.includes('display') || nodeName.includes('plane');
}

VRODOS.loader.applyVideoThumbnailTexture = function(object, resource) {
    if (!object || typeof object.traverse !== 'function' || !resource || resource.category_slug !== 'video') {
        return false;
    }

    const screenshotPath = resource.screenshot_path || resource.poi_img_path || resource.poi_image_path;
    if (!screenshotPath) {
        return false;
    }

    const texLoader = new THREE.TextureLoader();
    texLoader.setCrossOrigin('anonymous');
    texLoader.load(
        screenshotPath,
        (texture) => {
            let screenFound = false;
            const fallbackMeshes = [];

            object.traverse((node) => {
                if (!node.isMesh) return;

                fallbackMeshes.push(node);
                if (vrodosLoaderIsVideoScreenMesh(node)) {
                    vrodosLoaderApplyVideoTextureToMesh(node, texture);
                    screenFound = true;
                }
            });

            if (!screenFound) {
                fallbackMeshes.forEach((node) => {
                    vrodosLoaderApplyVideoTextureToMesh(node, texture);
                });
            }
        },
        undefined,
        (err) => {
            console.error("Error loading video thumbnail texture:", screenshotPath, err);
        }
    );

    return true;
};

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
};

VRODOS.loader.createAssessmentInfoPlate = function(type, levels) {
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
};

VRODOS.loader.createAssessmentLabel = function(title, type, levels) {
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
};

VRODOS.loader.createAssessmentPlaceholder = function(nameModel, resource) {
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

    const infoPlate = VRODOS.loader.createAssessmentInfoPlate(
        assessmentGroup.assessment_type || assessmentGroup.assessment_group,
        assessmentGroup.assessment_levels
    );
    if (infoPlate) {
        assessmentGroup.add(infoPlate);
    }

    return assessmentGroup;
};

VRODOS.loader.createAssessmentObject = function(name, resource) {
    return VRODOS.loader.createAssessmentPlaceholder(name, resource);
};

VRODOS.ui.createAssessmentInfoPlate = VRODOS.loader.createAssessmentInfoPlate;
VRODOS.ui.createAssessmentLabel = VRODOS.loader.createAssessmentLabel;
VRODOS.ui.createAssessmentPlaceholder = VRODOS.loader.createAssessmentPlaceholder;

VRODOS.loader.normalizeTextPanelContent = function(resource) {
    let text = '';
    if (resource && typeof resource.text_content === 'string') {
        text = resource.text_content;
    } else if (resource && typeof resource.text === 'string') {
        text = resource.text;
    }

    text = String(text || '')
        .replace(/\r\n?/g, '\n')
        .replace(/\t/g, '    ')
        .replace(/[ \u00a0]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    if (text.length > 2000) {
        text = `${text.slice(0, 2000).trimEnd()  }...`;
    }

    return text || 'Text asset';
};

VRODOS.loader.wrapTextPanelLines = function(ctx, text, maxWidth, maxLines) {
    const lines = [];
    const paragraphs = String(text || '').split('\n');

    paragraphs.forEach((paragraph, paragraphIndex) => {
        const words = paragraph.trim() === '' ? [''] : paragraph.trim().split(/\s+/);
        let line = '';

        words.forEach((word) => {
            const testLine = line ? `${line  } ${  word}` : word;
            if (ctx.measureText(testLine).width <= maxWidth || line === '') {
                line = testLine;
                return;
            }

            lines.push(line);
            line = word;
        });

        if (line || words.length === 1) {
            lines.push(line);
        }

        if (paragraphIndex < paragraphs.length - 1) {
            lines.push('');
        }
    });

    if (lines.length > maxLines) {
        return lines.slice(0, Math.max(0, maxLines - 1)).concat('...');
    }

    return lines;
};

VRODOS.loader.normalizeCompiledCollisionEnabled = function(value) {
    if (value === undefined || value === null || value === '') {
        return false;
    }

    const normalized = String(value).trim().toLowerCase();
    return !(normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off');
};

VRODOS.loader.createTextPanelTexture = function(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 1088;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111827';
    ctx.font = '600 34px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const paddingX = 56;
    const paddingY = 64;
    const lineHeight = 47;
    const maxLines = Math.floor((canvas.height - paddingY * 2) / lineHeight);
    const lines = VRODOS.loader.wrapTextPanelLines(ctx, text, canvas.width - paddingX * 2, maxLines);

    lines.forEach((line, index) => {
        ctx.fillText(line, paddingX, paddingY + index * lineHeight);
    });

    return VRODOS.loader.createCanvasTexture(canvas);
};

VRODOS.loader.createTextPanelObject = function(name, resource) {
    const text = VRODOS.loader.normalizeTextPanelContent(resource || {});
    const panelWidth = 1.25;
    const panelHeight = 1.77;
    const textWidth = 1.08;
    const textHeight = 1.54;
    const group = new THREE.Group();
    group.name = name;
    group.asset_name = VRODOS.utils.loaderDisplayText((resource && resource.asset_name) || name);
    group.category_name = (resource && resource.category_name) || '3D Text';
    group.category_slug = '3d-text';
    group.text_content = text;
    group.text_format = (resource && resource.text_format) || '';
    group.text_truncated = (resource && resource.text_truncated) || '';
    group.isSelectableMesh = true;
    group.isLight = false;

    const panel = new THREE.Mesh(
        new THREE.BoxGeometry(panelWidth, panelHeight, 0.035),
        new THREE.MeshStandardMaterial({
            color: 0xfaf7ef,
            roughness: 0.78,
            metalness: 0,
            side: THREE.FrontSide
        })
    );
    panel.name = `${name  }_panel`;
    panel.isSelectableMesh = false;
    group.add(panel);

    const border = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(panelWidth * 0.94, panelHeight * 0.95)),
        new THREE.LineBasicMaterial({ color: 0x1f2937, transparent: true, opacity: 0.45 })
    );
    border.name = `${name  }_border`;
    border.position.z = 0.024;
    border.isSelectableMesh = false;
    group.add(border);

    const textPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(textWidth, textHeight),
        VRODOS.loader.createDoubleSidedTextureMaterial(VRODOS.loader.createTextPanelTexture(text), {
            depthWrite: false
        })
    );
    textPlane.name = `${name  }_text`;
    textPlane.position.z = 0.026;
    textPlane.isSelectableMesh = false;
    group.add(textPlane);

    return group;
};

VRODOS.loader.setObjectProperties = function(object, name, resources3D) {
    const resource = resources3D[name] || {};

    const excludeKeys = new Set([
        'id',
        'translation',
        'position',
        'rotation',
        'scale',
        'quaternion',
        'children',
        'trs',
        'follow_camera',
        'follow_camera_x',
        'follow_camera_z'
    ]);

    for (const [key, value] of Object.entries(resource)) {
        if (!excludeKeys.has(key)) {
            object[key] = VRODOS.utils.isDisplayTextField(key)
                ? VRODOS.utils.loaderDisplayText(value)
                : value;
        }
    }

    object.name = VRODOS.utils.loaderSafeObjectName(name, resource, object);
    resource.name = object.name;
    object.isSelectableMesh = true;
    object.isLight = resource.isLight;
    object.fnPath = resource.path || object.fnPath || '';
    object.fnPath = typeof VRODOS.utils.normalizeRelativeUploadPath === 'function'
        ? VRODOS.utils.normalizeRelativeUploadPath(object.fnPath)
        : object.fnPath;
    object.glb_id = resource.glb_id;
    object.category_slug = typeof VRODOS.utils.normalizeSceneAssetCategory === 'function'
        ? VRODOS.utils.normalizeSceneAssetCategory(object.category_slug || resource.category_slug || object.category_name)
        : object.category_slug;
    resource.category_slug = object.category_slug || resource.category_slug;
    object.compiledCollisionEnabled = VRODOS.loader.normalizeCompiledCollisionEnabled(
        resource.compiledCollisionEnabled !== undefined
            ? resource.compiledCollisionEnabled
            : object.compiledCollisionEnabled
    );
    object.vrodosShadowRole = ['auto', 'caster-receiver', 'receiver', 'none'].includes(String(resource.vrodosShadowRole || resource.shadowRole || object.vrodosShadowRole || '').toLowerCase())
        ? String(resource.vrodosShadowRole || resource.shadowRole || object.vrodosShadowRole).toLowerCase()
        : 'auto';
    object.vrodosMaterialRole = ['auto', 'terrain-matte', 'authored-pbr', 'wet-glossy'].includes(String(resource.vrodosMaterialRole || resource.materialRole || object.vrodosMaterialRole || '').toLowerCase())
        ? String(resource.vrodosMaterialRole || resource.materialRole || object.vrodosMaterialRole).toLowerCase()
        : 'auto';

    if (String(object.category_slug || '').toLowerCase() === 'walkable-surface') {
        object.walkableBehavior = (String(resource.walkableBehavior || object.walkableBehavior || '').toLowerCase() === 'auto')
            ? 'auto'
            : 'precise';
    }

    VRODOS.loader.applyVideoThumbnailTexture(object, resource);

    const trs = resource.trs || {};
    VRODOS.utils.applyTRSToObject(object, {
        translation: trs.translation || resource.position || resource.translation,
        rotation: trs.rotation || resource.rotation,
        scale: trs.scale || resource.scale
    });

    return object;
};
