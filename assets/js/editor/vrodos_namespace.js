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

VRODOS.syncLocalizedData();
