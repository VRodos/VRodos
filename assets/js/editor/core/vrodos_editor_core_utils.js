'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.api = VRODOS.api || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.exporter = VRODOS.exporter || {};
VRODOS.importer = VRODOS.importer || {};

(function initVrodosEditorCoreUtils() {
    function safeNumber(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function clampNumber(value, min, max, fallback) {
        const parsed = Number(value);
        const next = Number.isFinite(parsed) ? parsed : fallback;
        return Math.min(max, Math.max(min, next));
    }

    function safeVector(values, fallback) {
        const safeFallback = Array.isArray(fallback) ? fallback : [0, 0, 0];
        const source = Array.isArray(values) ? values : safeFallback;

        return [
            safeNumber(source[0], safeFallback[0]),
            safeNumber(source[1], safeFallback[1]),
            safeNumber(source[2], safeFallback[2])
        ];
    }

    function safeScale(values) {
        return safeVector(values, [1, 1, 1]);
    }

    function joinUrl(base, path) {
        return `${String(base || '').replace(/\/+$/, '')  }/${  String(path || '').replace(/^\/+/, '')}`;
    }

    function resolveBaseUrl(pluginPath, localizedKey, fallbackRelative) {
        const paths = (VRODOS.data && VRODOS.data.paths) ? VRODOS.data.paths : {};

        if (paths[localizedKey]) {
            return paths[localizedKey];
        }

        const pluginBaseUrl = paths.pluginBaseUrl || (typeof pluginPath === 'string' && pluginPath ? pluginPath : (VRODOS.data && VRODOS.data.pluginPath) || '');
        if (pluginBaseUrl) {
            return joinUrl(pluginBaseUrl, fallbackRelative);
        }

        return String(fallbackRelative || '').replace(/^\/+/, '');
    }

    function displayText(value) {
        return typeof VRODOS.utils.decodeDisplayText === 'function'
            ? VRODOS.utils.decodeDisplayText(value)
            : (value == null ? '' : String(value));
    }

    function escapeHTML(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttribute(value) {
        return escapeHTML(String(value ?? ''))
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function sceneNameText(value) {
        return displayText(value).trim();
    }

    function safeObjectName(name, resource, object, fallbackIndex) {
        const currentName = sceneNameText(name);
        if (currentName !== '') {
            return currentName;
        }

        const objectName = sceneNameText(object && object.name);
        if (objectName !== '') {
            return objectName;
        }

        const source = resource || {};
        const slugPart = sceneNameText(source.asset_slug);
        const idPart = source.asset_id ? String(source.asset_id).trim() : '';
        const uuidSource = source.uuid || (object && object.uuid) || fallbackIndex || Date.now();
        const uuidPart = String(uuidSource).split('-')[0];

        return `${(slugPart || 'scene_object') + (idPart ? `_${  idPart}` : '')  }_${  uuidPart}`;
    }

    function ensureSceneObjectName(node, fallbackIndex) {
        const name = safeObjectName(node && node.name, node || {}, node, fallbackIndex);
        if (node && !node.name) {
            node.name = name;
        }
        return name;
    }

    function normalizeRelativeUploadPath(value) {
        let fnPath = typeof value === 'string' ? value : '';
        if (!fnPath) {
            return '';
        }

        while (/https?:\/\//i.test(fnPath) && fnPath.lastIndexOf('http') > 0) {
            fnPath = fnPath.substring(fnPath.lastIndexOf('http'));
        }

        for (const tag of ['wp-content/uploads', 'uploads/']) {
            const idx = fnPath.indexOf(tag);
            if (idx !== -1) {
                fnPath = fnPath.substring(idx + tag.length);
                break;
            }
        }

        while (fnPath.startsWith('/')) {
            fnPath = fnPath.substring(1);
        }

        return fnPath;
    }

    Object.assign(VRODOS.utils, {
        safeNumber,
        clampNumber,
        safeVector,
        safeScale,
        joinUrl,
        resolveBaseUrl,
        displayText,
        escapeHTML,
        escapeAttribute,
        sceneNameText,
        safeObjectName,
        ensureSceneObjectName,
        normalizeRelativeUploadPath
    });

    VRODOS.utils.loaderJoinUrl = joinUrl;
    VRODOS.utils.loaderResolveBaseUrl = resolveBaseUrl;
    VRODOS.utils.loaderSafeNumber = safeNumber;
    VRODOS.utils.loaderSafeVector = safeVector;
    VRODOS.utils.loaderSafeScale = safeScale;
    VRODOS.utils.loaderSafeObjectName = function(name, resource, object) {
        return safeObjectName(name, resource, object);
    };
    VRODOS.utils.loaderDisplayText = displayText;

    VRODOS.utils.sceneSafeNumber = safeNumber;
    VRODOS.utils.sceneSafeVector = safeVector;
    VRODOS.utils.sceneSafeScale = safeScale;
    VRODOS.utils.sceneSafeObjectName = ensureSceneObjectName;

})();
