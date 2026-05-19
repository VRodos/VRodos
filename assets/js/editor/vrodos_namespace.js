/**
 * VRodos Unified Namespace
 * 
 * This object serves as the single source of truth for global states
 * across the Editor and Runtime environments.
 */
window.VRODOS = window.VRODOS || {};

Object.assign(window.VRODOS, {
    editor: {
        ...(window.VRODOS.editor || {}),
        _lastClickX: 0,
        _lastClickY: 0,
        envir: null,
        transform_controls: null,
        transform_controls_helper: null,
        avatarControlsEnabled: false,
        selected_object_name: null,
        undoManager: null,
        currentSelectedRealObject: null,
        isPaused: false,
        manager: null,
        firstPersonBlockerBtn: null,
        id_animation_frame: null,
        renderLoop: {
            isRunning: false,
            needsRender: false,
            frameIndex: 0,
            lastFrameAt: 0,
            lastQualitySampleAt: 0,
            lastLoadingRenderAt: 0,
            loadingRenderTimer: null,
            loadingRenderThrottleMs: 180,
            lastLoadingProgressAt: 0,
            loadingProgressTimer: null,
            pendingLoadingProgressText: '',
            loadingProgressThrottleMs: 120,
            targetFps: 45,
            pixelRatioCap: 1.25,
            labelFrameStride: 2,
            loaderConcurrency: 3
        }
    },
    runtime: window.VRODOS.runtime || {},
    data: {
        ...(window.VRODOS.data || {}),
        editor: {},
        scene: {}
    },
    api: {
        ...(window.VRODOS.api || {}),
        whenSceneSaveSettles: () => Promise.resolve()
    },
    exporter: window.VRODOS.exporter || {},
    importer: window.VRODOS.importer || {},
    loader: window.VRODOS.loader || {},
    ui: {
        ...(window.VRODOS.ui || {}),
        outlines: {},
        hierarchy: {},
        transform: {},
        mapActions: {}
    },
    utils: window.VRODOS.utils || {},
    config: Object.assign({
        ajax_url: '',
        isAdmin: 'front',
        plugin_url: '',
        current_user_id: -1,
        parameter_Scenepass: ''
    }, window.vrodos_api_config || {})
});

VRODOS.syncLocalizedData = function() {
    if (window.vrodos_api_config) {
        VRODOS.config = Object.assign(VRODOS.config || {}, window.vrodos_api_config);
    }

    if (window.vrodos_data) {
        VRODOS.data = Object.assign(VRODOS.data || {}, window.vrodos_data);
        VRODOS.data.paths = VRODOS.data.paths || {};
        VRODOS.data.sceneId = VRODOS.data.sceneId || VRODOS.data.scene_id || '';
        VRODOS.data.showPawnPositions = VRODOS.data.showPawnPositions || 'false';
        VRODOS.config = Object.assign(VRODOS.config || {}, {
            ajax_url: VRODOS.data.ajax_url || VRODOS.config.ajax_url || '',
            isAdmin: VRODOS.data.isAdmin || VRODOS.config.isAdmin || 'front',
            plugin_url: VRODOS.data.pluginPath || VRODOS.config.plugin_url || '',
            current_user_id: VRODOS.data.current_user_id || VRODOS.config.current_user_id || -1,
            projectId: VRODOS.data.projectId || VRODOS.config.projectId || '',
            sceneId: VRODOS.data.sceneId || VRODOS.data.scene_id || VRODOS.config.sceneId || '',
            slug: VRODOS.data.projectSlug || VRODOS.config.slug || ''
        });
    }
};

VRODOS.utils.getAjaxUrl = function() {
    if (VRODOS.config && VRODOS.config.ajax_url) {
        return VRODOS.config.ajax_url;
    }

    if (VRODOS.data && VRODOS.data.ajax_url) {
        return VRODOS.data.ajax_url;
    }

    if (VRODOS.data && VRODOS.data.siteurl) {
        return `${String(VRODOS.data.siteurl).replace(/\/+$/, '')}/wp-admin/admin-ajax.php`;
    }

    return '/wp-admin/admin-ajax.php';
};

VRODOS.utils.decodeDisplayText = function(value) {
    let text = typeof value === 'string' ? value : (value == null ? '' : String(value));
    if (!text) return '';

    for (let i = 0; i < 2; i++) {
        if (/%[0-9a-fA-F]{2}/.test(text)) {
            try {
                const decoded = decodeURIComponent(text);
                if (decoded === text) break;
                text = decoded;
            } catch (err) {
                break;
            }
        }
    }

    return text.replace(/(?:\\+|\/+)?u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCodePoint(parseInt(hex, 16))
    );
};

VRODOS.utils.encodeBase64Json = function(value) {
    const json = JSON.stringify(value);
    if (typeof window.TextEncoder !== 'undefined') {
        const bytes = new window.TextEncoder().encode(json);
        let binary = '';
        bytes.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });
        return window.btoa(binary);
    }

    const encoded = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
    );
    return window.btoa(encoded);
};

VRODOS.utils.normalizeCefrLevels = function(levels) {
    let source = levels;
    const allowedLevels = ['A1', 'A2', 'B1', 'B2', 'ALL', 'ALL LEVELS'];

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
                const matches = source.toUpperCase().match(/\b(?:ALL LEVELS|ALL|A1|A2|B1|B2)\b/g);
                source = matches || [];
            }
        }
    }

    if (typeof source === 'string') {
        const matches = source.toUpperCase().match(/\b(?:ALL LEVELS|ALL|A1|A2|B1|B2)\b/g);
        source = matches || [];
    }

    if (!Array.isArray(source)) {
        return [];
    }

    return Array.from(new Set(source
        .map((level) => VRODOS.utils.decodeDisplayText(level).trim().toUpperCase())
        .filter((level) => allowedLevels.indexOf(level) !== -1)
        .filter(Boolean)));
};

VRODOS.utils.normalizeAssessmentLevels = function(levels) {
    return VRODOS.utils.normalizeCefrLevels(levels);
};

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
};

VRODOS.utils.encodeAssessmentLevelsForScene = function(levels) {
    const normalizedLevels = typeof VRODOS.utils.normalizeAssessmentLevels === 'function'
        ? VRODOS.utils.normalizeAssessmentLevels(levels)
        : VRODOS.utils.normalizeCefrLevels(levels);

    return normalizedLevels.length > 0
        ? VRODOS.utils.encodeBase64Json(normalizedLevels)
        : '';
};

VRODOS.utils.isAssessmentResource = function(resource) {
    if (!resource || typeof resource !== 'object') {
        return false;
    }

    const categorySlug = String(resource.category_slug || '').toLowerCase();
    const categoryName = String(resource.category_name || '').toLowerCase();
    return categorySlug === 'assessment' || categoryName === 'assessment';
};

VRODOS.utils.assessmentMetadataScore = function(resource) {
    if (!VRODOS.utils.isAssessmentResource(resource)) {
        return 0;
    }

    const type = VRODOS.utils.decodeDisplayText(resource.assessment_type || '').trim();
    const group = VRODOS.utils.decodeDisplayText(resource.assessment_group || '').trim();
    const sourceId = String(resource.assessment_source_id || resource.asset_id || '').trim();
    const levels = typeof VRODOS.utils.normalizeAssessmentLevels === 'function'
        ? VRODOS.utils.normalizeAssessmentLevels(resource.assessment_levels || '')
        : VRODOS.utils.normalizeCefrLevels(resource.assessment_levels || '');
    const content = String(resource.assessment_content || '').trim();

    return (sourceId ? 4 : 0) +
        (type ? 3 : 0) +
        (group ? 2 : 0) +
        (levels.length > 0 ? 3 : 0) +
        (content ? 1 : 0);
};

VRODOS.utils.hasCompleteAssessmentMetadata = function(resource) {
    if (!VRODOS.utils.isAssessmentResource(resource)) {
        return true;
    }

    const type = VRODOS.utils.decodeDisplayText(resource.assessment_type || resource.assessment_group || '').trim();
    const levels = typeof VRODOS.utils.normalizeAssessmentLevels === 'function'
        ? VRODOS.utils.normalizeAssessmentLevels(resource.assessment_levels || '')
        : VRODOS.utils.normalizeCefrLevels(resource.assessment_levels || '');

    return type !== '' && levels.length > 0;
};

VRODOS.utils.isEditorInternalObjectName = function(name) {
    return [
        'vrodosGizmoProxy',
        'myTransformControls',
        'myAxisHelper',
        'myGridHelper',
        'rayLine',
        'xline',
        'yline',
        'zline',
        'bbox'
    ].indexOf(String(name || '')) !== -1;
};

VRODOS.utils.isEditorInternalObject = function(object, name) {
    if (VRODOS.utils.isEditorInternalObjectName(name || (object && object.name))) {
        return true;
    }

    return Boolean(object && object.vrodos_internal_helper === true);
};

VRODOS.utils.getEditorSceneRoots = function(scene, options) {
    const opts = Object.assign({
        filterSelectable: false,
        includeDirector: true,
        rebuildRegistryIfEmpty: true
    }, options || {});
    const registry = VRODOS.editor && VRODOS.editor.sceneRegistry;
    const registryRoots = registry && typeof registry.getSelectableRoots === 'function'
        ? registry.getSelectableRoots({ rebuildIfEmpty: opts.rebuildRegistryIfEmpty })
        : [];

    if (Array.isArray(registryRoots) && registryRoots.length > 0) {
        return typeof VRODOS.utils.dedupeEditorSceneRoots === 'function'
            ? VRODOS.utils.dedupeEditorSceneRoots(registryRoots, { reason: 'registry-roots', log: false })
            : registryRoots;
    }

    if (!scene) {
        return [];
    }

    const roots = [];
    const shouldInclude = (object) => {
        if (!object) return false;
        if (VRODOS.utils.isEditorInternalObject(object)) return false;
        if (!opts.filterSelectable) return true;
        return Boolean(object.isSelectableMesh || (opts.includeDirector && object.name === 'avatarCamera'));
    };
    const addIfIncluded = (object) => {
        if (shouldInclude(object)) {
            roots.push(object);
        }
    };

    if (Array.isArray(scene.children)) {
        scene.children.forEach(addIfIncluded);
    }

    return typeof VRODOS.utils.dedupeEditorSceneRoots === 'function'
        ? VRODOS.utils.dedupeEditorSceneRoots(roots, { reason: 'scene-children-roots', log: false })
        : roots;
};

VRODOS.utils.getSelectableEditorSceneRoots = function(scene, options) {
    const envir = VRODOS.editor && VRODOS.editor.envir ? VRODOS.editor.envir : null;
    const targetScene = scene || (envir ? envir.scene : null);
    const opts = Object.assign({
        includeDirector: true,
        rebuildRegistryIfEmpty: false
    }, options || {});

    return VRODOS.utils.getEditorSceneRoots(targetScene, Object.assign({}, opts, {
        filterSelectable: true
    }));
};

VRODOS.utils.getNextPawnIndex = function(scene) {
    const source = VRODOS.utils.getEditorSceneRoots(scene);

    let count = 1;
    source.forEach((object) => {
        if (!object) return;
        const name = object.name || '';
        if (object.category_name === 'pawn' || name.includes('Pawn')) {
            count++;
        }
    });

    return count;
};

VRODOS.utils.sceneObjectDuplicateKey = function(resource) {
    if (!resource || typeof resource !== 'object') {
        return '';
    }

    if (VRODOS.utils.isAssessmentResource(resource)) {
        const assessmentSource = String(
            resource.assessment_source_id ||
            resource.asset_id ||
            resource.asset_slug ||
            ''
        ).trim();
        if (assessmentSource) {
            return `assessment|${assessmentSource}`;
        }
    }

    const addedAt = Number(resource.addedAt || 0);
    if (!Number.isFinite(addedAt) || addedAt <= 0) {
        return '';
    }

    const trs = resource.trs || {};
    const vectorKey = (value, fallback) => {
        const vector = Array.isArray(value)
            ? value
            : (value && typeof value === 'object' && ['x', 'y', 'z'].every((axis) => axis in value)
                ? [value.x, value.y, value.z]
                : fallback);
        return vector.map((entry) => {
            const numberValue = Number(entry);
            return Number.isFinite(numberValue) ? numberValue.toFixed(5) : '0.00000';
        }).join(',');
    };

    const category = String(resource.category_slug || resource.category_name || '');
    const source = String(
        resource.asset_id ||
        resource.glb_id ||
        resource.fnPath ||
        resource.path ||
        resource.glb_path ||
        resource.image_path ||
        resource.asset_name ||
        ''
    );
    const translation = vectorKey(trs.translation || resource.position || resource.translation, [0, 0, 0]);
    const rotation = vectorKey(trs.rotation || resource.rotation, [0, 0, 0]);
    const scale = vectorKey(trs.scale || resource.scale, [1, 1, 1]);
    const target = vectorKey(resource.targetposition, [0, 0, 0]);

    return [category, source, Math.floor(addedAt), translation, rotation, scale, target].join('|');
};

VRODOS.utils.dedupeEditorSceneRoots = function(roots, options) {
    if (!Array.isArray(roots) || roots.length === 0) {
        return [];
    }

    const opts = options || {};
    const seenUuids = new Map();
    const seenNames = new Map();
    const seenLogical = new Map();
    const skipped = [];
    const deduped = [];

    roots.forEach((object) => {
        if (!object) {
            return;
        }

        if (VRODOS.utils.isAssessmentResource(object) && !VRODOS.utils.hasCompleteAssessmentMetadata(object)) {
            skipped.push({ name: object.name || object.uuid || 'assessment', original: 'incomplete-assessment' });
            return;
        }

        const uuid = object.uuid ? String(object.uuid) : '';
        const name = object.name ? String(object.name) : '';
        const logicalKey = VRODOS.utils.sceneObjectDuplicateKey(object);
        const existing = (uuid && seenUuids.get(uuid)) ||
            (name && seenNames.get(name)) ||
            (logicalKey && seenLogical.get(logicalKey));

        if (existing) {
            skipped.push({ name: name || uuid, original: existing });
            return;
        }

        deduped.push(object);
        if (uuid) seenUuids.set(uuid, name || uuid);
        if (name) seenNames.set(name, name);
        if (logicalKey) seenLogical.set(logicalKey, name || uuid);
    });

    if (skipped.length > 0 && opts.log !== false) {
        console.warn('VRodos: skipped duplicate editor scene roots', {
            reason: opts.reason || 'scene-roots',
            skipped
        });
    }

    return deduped;
};

VRODOS.utils.dedupeSceneDataObjects = function(objects, options) {
    if (!objects || typeof objects !== 'object') {
        return [];
    }

    const opts = options || {};
    const seen = new Map();
    const seenScores = new Map();
    const removed = [];

    Object.keys(objects).forEach((name) => {
        const object = objects[name];
        if (VRODOS.utils.isEditorInternalObject(object, name)) {
            removed.push({ name, reason: 'editor-internal-helper' });
            delete objects[name];
            return;
        }

        if (VRODOS.utils.isAssessmentResource(object) && !VRODOS.utils.hasCompleteAssessmentMetadata(object)) {
            removed.push({ name, reason: 'incomplete-assessment' });
            delete objects[name];
            return;
        }

        const key = VRODOS.utils.sceneObjectDuplicateKey(object);
        if (!key) {
            return;
        }

        if (seen.has(key)) {
            const existingName = seen.get(key);
            const currentScore = VRODOS.utils.assessmentMetadataScore(object);
            const existingScore = seenScores.get(key) || 0;

            if (currentScore > existingScore && objects[existingName]) {
                removed.push({ name: existingName, original: name, reason: 'lower-quality-duplicate' });
                delete objects[existingName];
                seen.set(key, name);
                seenScores.set(key, currentScore);
                return;
            }

            removed.push({ name, original: existingName, reason: 'duplicate' });
            delete objects[name];
            return;
        }

        seen.set(key, name);
        seenScores.set(key, VRODOS.utils.assessmentMetadataScore(object));
    });

    if (removed.length > 0 && opts.log !== false) {
        console.warn('VRodos: removed invalid or duplicate saved scene objects before load', removed);
    }

    return removed;
};

VRODOS.syncLocalizedData();
