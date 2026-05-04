/**
 * VRodos Unified Namespace
 * 
 * This object serves as the single source of truth for global states
 * across the Editor and Runtime environments.
 */
window.VRODOS = window.VRODOS || {
    editor: {
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
        updatePositionsAndControls: () => {},
        animate: () => {}
    },
    runtime: {},
    data: {
        editor: {},
        scene: {}
    },
    api: {
        whenSceneSaveSettles: () => Promise.resolve()
    },
    exporter: {},
    importer: {},
    loader: {},
    ui: {
        outlines: {},
        hierarchy: {},
        transform: {}
    },
    utils: {},
    config: Object.assign({
        ajax_url: '',
        isAdmin: 'front',
        plugin_url: '',
        current_user_id: -1,
        parameter_Scenepass: ''
    }, typeof vrodos_api_config !== 'undefined' ? vrodos_api_config : {})
};
