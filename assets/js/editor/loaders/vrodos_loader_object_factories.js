"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.utils = VRODOS.utils || {};

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

