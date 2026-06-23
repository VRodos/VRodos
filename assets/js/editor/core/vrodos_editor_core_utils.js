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
    const displayTextFieldNames = Object.freeze([
        'asset_name',
        'asset_slug',
        'assessment_title',
        'assessment_type',
        'assessment_group',
        'immerse_object_type'
    ]);
    const displayTextFieldSet = new Set(displayTextFieldNames);
    const lightCategoryNames = Object.freeze(['lightSun', 'lightLamp', 'lightSpot', 'lightAmbient']);
    const sceneCategoryAliases = Object.freeze({
        Pawn: 'pawn',
        pawn: 'pawn',
        '3D Text': '3d-text',
        '3d-text': '3d-text',
        Assessment: 'assessment',
        assessment: 'assessment',
        'blocking-obstacles': 'collision-proxy',
        lightSun: 'lightSun',
        lightLamp: 'lightLamp',
        lightSpot: 'lightSpot',
        lightAmbient: 'lightAmbient',
        image: 'image'
    });

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

    function safeTRS(trs) {
        const source = trs || {};
        return {
            translation: safeVector(source.translation, [0, 0, 0]),
            rotation: safeVector(source.rotation, [0, 0, 0]),
            scale: safeScale(source.scale)
        };
    }

    function applyTRSToObject(object, trs) {
        if (!object) {
            return null;
        }

        const safe = safeTRS(trs);
        object.position.set(safe.translation[0], safe.translation[1], safe.translation[2]);
        object.rotation.set(safe.rotation[0], safe.rotation[1], safe.rotation[2]);
        object.scale.set(safe.scale[0], safe.scale[1], safe.scale[2]);
        return object;
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

    function cleanRepeatedUrlText(value) {
        let text = typeof value === 'string' ? value.trim() : '';
        while (/https?:\/\//i.test(text) && text.lastIndexOf('http') > 0) {
            text = text.substring(text.lastIndexOf('http'));
        }

        return text;
    }

    function isAbsoluteAssetUrl(value) {
        return /^https?:\/\//i.test(value) || String(value || '').startsWith('//');
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

    function decodeBase64Unicode(value) {
        if (typeof value !== 'string' || value === '') {
            return '';
        }

        try {
            const binary = window.atob(value);
            const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
            return new TextDecoder('utf-8').decode(bytes);
        } catch (err) {
            try {
                return window.atob(value);
            } catch (fallbackErr) {
                return '';
            }
        }
    }

    function sceneNameText(value) {
        return displayText(value).trim();
    }

    function isDisplayTextField(key) {
        return displayTextFieldSet.has(key);
    }

    function normalizeSceneAssetCategory(category) {
        const value = String(category || '').trim();
        return sceneCategoryAliases[value] || value;
    }

    function isSceneLightCategory(category) {
        const normalized = normalizeSceneAssetCategory(category);
        return lightCategoryNames.indexOf(normalized) !== -1 || normalized.startsWith('light');
    }

    function isScenePawnCategory(category) {
        return normalizeSceneAssetCategory(category) === 'pawn';
    }

    function isSceneLightOrPawnCategory(category) {
        return isSceneLightCategory(category) || isScenePawnCategory(category);
    }

    function isSceneAssessmentCategory(category) {
        return normalizeSceneAssetCategory(category) === 'assessment';
    }

    function isSceneTextCategory(category) {
        return normalizeSceneAssetCategory(category) === '3d-text';
    }

    function isSceneImageCategory(category) {
        return normalizeSceneAssetCategory(category) === 'image';
    }

    function normalizeDisplayTextFields(resource, fields) {
        if (!resource || typeof resource !== 'object') {
            return resource;
        }

        const fieldNames = Array.isArray(fields) ? fields : displayTextFieldNames;
        fieldNames.forEach((key) => {
            if (typeof resource[key] === 'string') {
                resource[key] = displayText(resource[key]);
            }
        });

        return resource;
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

    function normalizeRelativeUploadPath(value, uploadDir) {
        let fnPath = cleanRepeatedUrlText(value);
        if (!fnPath) {
            return '';
        }

        const normalizedUploadDir = cleanRepeatedUrlText(uploadDir).replace(/\/+$/, '');
        if (normalizedUploadDir && fnPath.includes(normalizedUploadDir)) {
            fnPath = fnPath.substring(fnPath.indexOf(normalizedUploadDir) + normalizedUploadDir.length);
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

    function resolveUploadAssetPath(resource, uploadDir) {
        const explicitPath = cleanRepeatedUrlText(resource && resource.path);
        if (explicitPath && isAbsoluteAssetUrl(explicitPath)) {
            return explicitPath;
        }

        const fnPath = cleanRepeatedUrlText(resource && resource.fnPath);
        if (!fnPath) {
            return '';
        }

        if (isAbsoluteAssetUrl(fnPath) || fnPath.startsWith('uploads/')) {
            return fnPath;
        }

        const relativePath = normalizeRelativeUploadPath(fnPath, uploadDir);
        if (!relativePath) {
            return '';
        }

        return uploadDir ? joinUrl(uploadDir, relativePath) : relativePath;
    }

    function assetFnPathFromPath(value) {
        const path = cleanRepeatedUrlText(value);
        if (!path) {
            return '';
        }

        if (path.indexOf('wp-content/uploads') !== -1 || path.indexOf('uploads/') !== -1) {
            return normalizeRelativeUploadPath(path);
        }

        return path.substring(path.lastIndexOf('/') + 1);
    }

    function assetBasePathFromPath(value) {
        const path = cleanRepeatedUrlText(value);
        if (!path) {
            return '';
        }

        const slashIndex = path.lastIndexOf('/');
        return slashIndex === -1 ? '' : path.substring(0, slashIndex + 1);
    }

    function readDataAttributes(element) {
        const data = {};
        if (!element || !element.attributes) {
            return data;
        }

        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            if (!attr || typeof attr.name !== 'string' || !attr.name.startsWith('data-')) {
                continue;
            }

            data[attr.name.substring(5)] = attr.value;
        }

        return data;
    }

    function createAssetDragPayload(element) {
        const dragData = readDataAttributes(element);
        if (dragData.text_content_b64) {
            dragData.text_content = decodeBase64Unicode(dragData.text_content_b64);
            delete dragData.text_content_b64;
        }

        normalizeDisplayTextFields(dragData);
        const titleSlug = displayText((element && element.getAttribute && element.getAttribute('data-asset_slug')) || dragData.asset_slug || 'scene_object');
        dragData.title = `${titleSlug  }_${  Date.now()}`;
        dragData.name = dragData.title;
        return dragData;
    }

    function createLightPawnDragPayload(lightPawnType) {
        const type = String(lightPawnType || '').trim();
        if (['Sun', 'Spot', 'Lamp', 'Ambient'].indexOf(type) !== -1) {
            return {
                category_name: `light${type}`,
                title: `mylight${type}_${Date.now()}`
            };
        }

        if (type === 'Pawn') {
            return {
                category_name: 'Pawn',
                title: `aPawn_${Date.now()}`
            };
        }

        return null;
    }

    function readJsonDataTransfer(event, types) {
        const dataTransfer = event && event.dataTransfer;
        if (!dataTransfer || typeof dataTransfer.getData !== 'function') {
            return null;
        }

        const candidateTypes = Array.isArray(types) && types.length ? types : ['text', 'text/plain'];
        let rawPayload = '';
        for (const type of candidateTypes) {
            rawPayload = dataTransfer.getData(type);
            if (rawPayload) {
                break;
            }
        }

        if (!rawPayload) {
            return null;
        }

        try {
            return JSON.parse(rawPayload);
        } catch (error) {
            console.warn('VRodos: ignored invalid JSON drag/drop payload.', error);
            return null;
        }
    }

    function writeJsonDataTransfer(event, data, type) {
        const dataTransfer = event && event.dataTransfer;
        if (!dataTransfer || typeof dataTransfer.setData !== 'function') {
            return false;
        }

        dataTransfer.setData(type || 'text/plain', JSON.stringify(data || {}));
        return true;
    }

    Object.assign(VRODOS.utils, {
        safeNumber,
        clampNumber,
        safeVector,
        safeScale,
        safeTRS,
        applyTRSToObject,
        joinUrl,
        resolveBaseUrl,
        cleanRepeatedUrlText,
        isAbsoluteAssetUrl,
        displayText,
        displayTextFieldNames,
        escapeHTML,
        escapeAttribute,
        decodeBase64Unicode,
        sceneNameText,
        isDisplayTextField,
        normalizeSceneAssetCategory,
        isSceneLightCategory,
        isScenePawnCategory,
        isSceneLightOrPawnCategory,
        isSceneAssessmentCategory,
        isSceneTextCategory,
        isSceneImageCategory,
        normalizeDisplayTextFields,
        safeObjectName,
        ensureSceneObjectName,
        normalizeRelativeUploadPath,
        resolveUploadAssetPath,
        assetFnPathFromPath,
        assetBasePathFromPath,
        readDataAttributes,
        createAssetDragPayload,
        createLightPawnDragPayload,
        readJsonDataTransfer,
        writeJsonDataTransfer
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
