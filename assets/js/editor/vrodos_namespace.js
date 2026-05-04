/**
 * VRodos Unified Namespace
 * 
 * This object serves as the single source of truth for global states
 * across the Editor and Runtime environments.
 */
window.VRODOS = window.VRODOS || {
    editor: {
        _lastClickX: 0,
        _lastClickY: 0
    },
    runtime: {},
    data: {},
    api: {}
};
