/**
 * Editor persistence schema generated from the runtime settings contract.
 * Only metadata that intentionally remains outside that contract belongs here.
 */

'use strict';

(() => {
    const contractSettings = (window.VRODOS_RUNTIME_SETTINGS_CONTRACT || {}).sceneSettings || {};
    VRODOS.config.SCENE_SETTINGS_SCHEMA = {
        fogtype: { type: 'string', default: 'none', envirKey: 'fogtype' },
        aframePostFXVignetteEnabled: { type: 'boolean', default: false, envirKey: 'aframePostFXVignetteEnabled' },
    };

    Object.entries(contractSettings).forEach(([contractKey, setting]) => {
        if (!setting || !setting.metadataKey) return;
        VRODOS.config.SCENE_SETTINGS_SCHEMA[setting.metadataKey] = {
            type: ['enum', 'string'].includes(setting.type) ? 'string' : (setting.type || 'string'),
            default: setting.default,
            envirKey: setting.metadataKey,
            contractKey,
        };
    });

    VRODOS.sceneSettings = VRODOS.sceneSettings || {};
    VRODOS.sceneSettings.schema = VRODOS.config.SCENE_SETTINGS_SCHEMA;
})();
