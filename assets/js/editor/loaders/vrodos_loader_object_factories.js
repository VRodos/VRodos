"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
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

function vrodosLoaderApplyVideoTextureToMesh(node, texture) {
    node.material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });
    node.material.needsUpdate = true;
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

VRODOS.loader.createAssessmentObject = function(name, resource) {
    if (typeof VRODOS.ui.createAssessmentPlaceholder === 'function') {
        return VRODOS.ui.createAssessmentPlaceholder(name, resource);
    }

    const fallback = new THREE.Group();
    fallback.name = name;
    fallback.asset_name = VRODOS.utils.loaderDisplayText(resource.asset_name || resource.assessment_title || 'Assessment');
    fallback.category_name = resource.category_name || 'Assessment';
    fallback.category_slug = 'assessment';
    fallback.assessment_title = VRODOS.utils.loaderDisplayText(resource.assessment_title || resource.asset_name || 'Assessment');
    fallback.assessment_type = VRODOS.utils.loaderDisplayText(resource.assessment_type || '');
    fallback.assessment_group = VRODOS.utils.loaderDisplayText(resource.assessment_group || '');
    fallback.assessment_source_id = resource.assessment_source_id || '';
    fallback.assessment_content = resource.assessment_content || '';
    fallback.assessment_levels = resource.assessment_levels || '';
    fallback.assessment_supported = resource.assessment_supported || 'false';
    fallback.immerse_managed = resource.immerse_managed || (resource.assessment_source_id ? 'true' : '');
    fallback.immerse_object_type = resource.immerse_object_type || (resource.assessment_source_id ? 'assessment' : '');
    fallback.isSelectableMesh = true;
    fallback.isLight = false;

    const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.72, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.1 })
    );
    box.isSelectableMesh = false;
    fallback.add(box);

    return fallback;
};

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

    const texture = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace) {
        texture.colorSpace = THREE.SRGBColorSpace;
    }
    texture.needsUpdate = true;

    return texture;
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
        new THREE.MeshBasicMaterial({
            map: VRODOS.loader.createTextPanelTexture(text),
            transparent: true,
            side: THREE.DoubleSide,
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
            object[key] = ['asset_name', 'assessment_title', 'assessment_type', 'assessment_group'].includes(key)
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

    if (String(object.category_slug || '').toLowerCase() === 'walkable-surface') {
        object.walkableBehavior = (String(resource.walkableBehavior || object.walkableBehavior || '').toLowerCase() === 'auto')
            ? 'auto'
            : 'precise';
    }

    VRODOS.loader.applyVideoThumbnailTexture(object, resource);

    const trs = resource.trs || {};
    const translation = VRODOS.utils.loaderSafeVector(trs.translation || resource.position || resource.translation, [0, 0, 0]);
    const rotation = VRODOS.utils.loaderSafeVector(trs.rotation || resource.rotation, [0, 0, 0]);
    const scale = VRODOS.utils.loaderSafeScale(trs.scale || resource.scale);

    object.position.set(
        translation[0],
        translation[1],
        translation[2]);

    object.rotation.set(
        rotation[0],
        rotation[1],
        rotation[2]);

    object.scale.set(
        scale[0],
        scale[1],
        scale[2]);

    return object;
};
