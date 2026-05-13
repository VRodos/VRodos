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
            targetFps: 45,
            pixelRatioCap: 1.25,
            labelFrameStride: 2,
            loaderConcurrency: 2
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

VRODOS.utils.getEditorSceneRoots = function(scene, options) {
    const opts = Object.assign({
        filterSelectable: false,
        includeDirector: true,
        traverseFallback: false
    }, options || {});
    const registry = VRODOS.editor && VRODOS.editor.sceneRegistry;
    const registryRoots = registry && typeof registry.getSelectableRoots === 'function'
        ? registry.getSelectableRoots()
        : [];

    if (Array.isArray(registryRoots) && registryRoots.length > 0) {
        return registryRoots;
    }

    if (!scene) {
        return [];
    }

    const roots = [];
    const shouldInclude = (object) => {
        if (!object) return false;
        if (!opts.filterSelectable) return true;
        return Boolean(object.isSelectableMesh || (opts.includeDirector && object.name === 'avatarCamera'));
    };
    const addIfIncluded = (object) => {
        if (shouldInclude(object)) {
            roots.push(object);
        }
    };

    if (opts.traverseFallback && typeof scene.traverse === 'function') {
        scene.traverse(addIfIncluded);
        return roots;
    }

    if (Array.isArray(scene.children)) {
        scene.children.forEach(addIfIncluded);
    }

    return roots;
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

VRODOS.utils.getEditorLightObjectName = function(kind, lightName) {
    const prefixes = {
        helper: 'lightHelper_',
        target: 'lightTargetSpot_',
        shadow: 'lightShadowHelper_'
    };
    const prefix = prefixes[kind] || '';
    return `${prefix}${lightName || ''}`;
};

VRODOS.utils.getEditorLightObject = function(kind, lightName, scene) {
    const name = VRODOS.utils.getEditorLightObjectName(kind, lightName);
    if (!name) return null;

    if (kind === 'target' && VRODOS.editor && VRODOS.editor.sceneRegistry) {
        const registered = VRODOS.editor.sceneRegistry.get(name);
        if (registered) return registered;
    }

    return scene && typeof scene.getObjectByName === 'function'
        ? scene.getObjectByName(name)
        : null;
};

VRODOS.utils.updateEditorLightHelper = function(light, scene) {
    if (!light) return null;
    const helper = VRODOS.utils.getEditorLightObject('helper', light.name, scene);
    if (helper && typeof helper.update === 'function') {
        helper.update();
    }
    return helper;
};

VRODOS.syncLocalizedData();
