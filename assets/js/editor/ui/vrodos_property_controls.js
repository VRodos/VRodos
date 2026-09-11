/* global isObjectControlsPanelOpen, setObjectControlsActionsVisible, showObjectControlsPanel, hideObjectControlsPanel, vrodosGetEffectiveObjectCategory, showPropertiesInPanel, refreshSceneAssetRolePresentation, bindObjectControlsPanelEvents */
/* exported VRODOS_OBJECT_CONTROLS_IDS, displaySharedPropertySections, vrodosNormalizeWalkableBehavior, vrodosNormalizeObjectShadowRole, vrodosNormalizeObjectMaterialRole, vrodosIsPlayerCollisionEligible, vrodosIsShadowRoleEligible, vrodosIsMaterialRoleEligible, vrodosNormalizeAudioPlaybackMode, vrodosNormalizeAudioLoopValue, vrodosNormalizeAudioNumericValue, vrodosCommitObjectControlsProperty, vrodosPlaneSurfaceMaterialState, vrodosSavePlaneSurfaceMaterialPackage, vrodosSavePlaneTextureChange */
// Shared property inputs and change application.

const VRODOS_OBJECT_CONTROLS_IDS = {
    panel: 'object-controls-panel',
    header: 'object-controls-header',
    closeButton: 'object-controls-close',
    title: 'object-controls-title',
    badge: 'object-controls-badge',
    propertiesContainer: 'object-properties-container',
    manipulationToggle: 'object-manipulation-toggle',
    axisButtons: 'axis-manipulation-buttons'
};

function _getEditorInput(id) {
    return document.getElementById(id);
}

function _setEditorInputValue(id, value) {
    const el = _getEditorInput(id);
    if (el) {
        el.value = value;
    }
    return el;
}

function _setEditorInputChecked(id, checked) {
    const el = _getEditorInput(id);
    if (el) {
        el.checked = Boolean(checked);
    }
    return el;
}

function _showEditorPanel(panel) {
    if (panel) {
        panel.style.display = '';
    }
}

function sanitizeInputValue(value) {
    const re = new RegExp('^$|^-?(\\d+)?(\\.?\\d*)?$');
    return value.match(re) === null ? 0 : Number(value);
}

function getEditorSceneObjectByUuid(uuid) {
    const registry = VRODOS.editor.sceneRegistry;
    return registry ? registry.get(uuid) : null;
}

function getEditorSceneObjectByName(name) {
    const registry = VRODOS.editor.sceneRegistry;
    return registry ? registry.get(name) : null;
}

function getSelectedPropertyTarget() {
    return VRODOS.editor.transforms.getRealObject();
}

function getSceneObjectOrSelected(name) {
    return getEditorSceneObjectByName(name) || getSelectedPropertyTarget();
}

function _getPropertyPanelState(panelId, name, options) {
    const panel = document.getElementById(panelId);
    if (!panel) {
        return null;
    }

    const opts = options || {};
    const sceneObj = opts.selectedFallback
        ? getSceneObjectOrSelected(name)
        : getEditorSceneObjectByName(name);
    return sceneObj ? { panel, sceneObj } : null;
}

function _populateEditorSelect(id, values) {
    const selectEl = _getEditorInput(id);
    if (!selectEl) {
        return null;
    }

    selectEl.innerText = '';
    values.forEach((value) => {
        if (value) {
            selectEl.appendChild(new Option(value));
        }
    });
    return selectEl;
}

function _bindEditorInputChange(id, handler) {
    const el = _getEditorInput(id);
    if (el) {
        el.addEventListener('change', handler);
    }
    return el;
}

function _bindTrackedEditorInputChange(id, handler) {
    const el = _getEditorInput(id);
    if (!el) {
        return null;
    }

    el.addEventListener('focus', function() {
        this._oldVal = this.value;
    });
    el.addEventListener('change', handler);
    return el;
}

function _getFirstChildMaterialColorHex(sceneObj) {
    const material = sceneObj &&
        sceneObj.children &&
        sceneObj.children[0] &&
        sceneObj.children[0].material;

    return material && material.color && typeof material.color.getHexString === 'function'
        ? `#${  material.color.getHexString()}`
        : null;
}


function _getObjectColorHex(sceneObj) {
    return sceneObj && sceneObj.color && typeof sceneObj.color.getHexString === 'function'
        ? `#${  sceneObj.color.getHexString()}`
        : null;
}

function _normalizeDoorTargetValue(value) {
    const normalized = String(value || '').trim();
    return normalized && normalized !== 'Default' ? normalized : '';
}

function _getDoorTargetValue(sceneObj) {
    if (!sceneObj) {
        return '';
    }

    return _normalizeDoorTargetValue(
        sceneObj.sceneID_target ||
        sceneObj.sceneid_target ||
        sceneObj.scene_id_target ||
        sceneObj.vrodos_asset3d_scene ||
        sceneObj.asset3d_scene ||
        ''
    );
}

function _findDoorTargetOption(selectEl, sceneObj) {
    if (!selectEl) {
        return null;
    }

    const targetValue = _getDoorTargetValue(sceneObj);
    if (targetValue) {
        const byValue = Array.from(selectEl.options).find((option) => option.value === targetValue);
        if (byValue) {
            return byValue;
        }
    }

    const legacySceneName = sceneObj && sceneObj.sceneName_target
        ? String(sceneObj.sceneName_target).trim()
        : '';
    if (legacySceneName) {
        const byText = Array.from(selectEl.options).find((option) => option.textContent.trim() === legacySceneName);
        if (byText) {
            return byText;
        }
    }

    return Array.from(selectEl.options).find((option) => option.value === 'Default') || selectEl.options[0] || null;
}

function _setDoorSelectValue(selectEl, sceneObj) {
    const option = _findDoorTargetOption(selectEl, sceneObj);
    if (!selectEl || !option) {
        return null;
    }

    Array.from(selectEl.options).forEach((item) => {
        item.selected = item === option;
        item.defaultSelected = item === option;
    });
    selectEl.value = option.value;
    return option.value;
}

function _bindDoorSelectToObject(selectEl, sceneObj) {
    if (!selectEl || !sceneObj) {
        return;
    }

    selectEl.dataset.vrodosObjectUuid = sceneObj.uuid || '';
    selectEl.dataset.vrodosObjectName = sceneObj.name || '';
}

function _getDoorSelectObject(selectEl) {
    if (!selectEl) {
        return null;
    }

    const dataset = selectEl.dataset || {};
    return getEditorSceneObjectByUuid(dataset.vrodosObjectUuid) ||
        getEditorSceneObjectByName(dataset.vrodosObjectName) ||
        getSelectedPropertyTarget();
}

function _syncDoorTargetSceneRecord(sceneObj, value) {
    if (
        !sceneObj ||
        !VRODOS.utils ||
        typeof VRODOS.utils.sceneFindObjectRecord !== 'function'
    ) {
        return;
    }

    const record = VRODOS.utils.sceneFindObjectRecord(sceneObj.uuid, sceneObj);
    if (record && record.value && typeof record.value === 'object') {
        record.value.sceneID_target = value;
    }
}

function _getLightShadowRadius(light) {
    if (light && Number.isFinite(Number(light.shadowRadius))) {
        return Number(light.shadowRadius);
    }
    if (light && light.shadow && Number.isFinite(Number(light.shadow.radius))) {
        return Number(light.shadow.radius);
    }
    return 0;
}




















function displaySharedPropertySections(event, object) {
    if (!object) return false;

    const name = object.name;
    let hasProperties = false;

    switch (object.category_slug) {
        case 'poi-imagetext':
            VRODOS.ui.displayPoiImageTextProperties(event, name);
            hasProperties = true;
            break;
        case 'door':
            VRODOS.ui.displayDoorProperties(event, name);
            hasProperties = true;
            break;
        case 'poi-link':
            VRODOS.ui.displayLinkProperties(event, name);
            hasProperties = true;
            break;
        case 'chat':
        case 'poi-chat':
            VRODOS.ui.displayPoiChatProperties(event, name);
            hasProperties = true;
            break;
        default:
            break;
    }

    switch (object.category_name) {
        case 'lightSun':
            VRODOS.ui.displaySunProperties(event, name);
            hasProperties = true;
            break;
        case 'lightLamp':
            VRODOS.ui.displayLampProperties(event, name);
            hasProperties = true;
            break;
        case 'lightSpot':
            VRODOS.ui.displaySpotProperties(event, name);
            hasProperties = true;
            break;
        case 'lightAmbient':
            VRODOS.ui.displayAmbientProperties(event, name);
            hasProperties = true;
            break;
        default:
            break;
    }

    return hasProperties;
}

let vrodosPersistentPropertyListenersBound = false;

function initPersistentPropertyListeners() {
    if (vrodosPersistentPropertyListenersBound) {
        return;
    }
    vrodosPersistentPropertyListenersBound = true;

    const applyProperty = (object, property, value) => {
        if (object.isLight) {
            VRODOS.utils.applyEditorLightProperty(object, property, value, VRODOS.editor.envir.scene);
        } else {
            object[property] = value;
        }
        VRODOS.editor.requestRender('light-property-change');
    };
    const commitProperty = (object, property, oldValue, newValue) => {
        if (oldValue === newValue) return;
        const manager = VRODOS.editor.undoManager;
        if (!manager.isExecuting) {
            manager.add(new VRODOS.editor.PropertyCommand(object, property, oldValue, newValue));
        }
        VRODOS.api.saveChanges();
    };
    const bindPropEntries = (entries) => {
        entries.forEach(({ id, prop, isCheckbox = false, sanitize = false }) => {
            _bindEditorInputChange(id, function() {
                const object = getSelectedPropertyTarget();
                if (!object) return;
                const oldValue = object[prop];
                let value = isCheckbox ? (this.checked ? 1 : 0) : this.value;
                if (sanitize) value = sanitizeInputValue(value);
                if (oldValue === value) return;
                applyProperty(object, prop, value);
                commitProperty(object, prop, oldValue, value);
            });
        });
    };
    const bindLiveProperty = (id, property, readValue, parseValue, eligible = () => true) => {
        const input = _getEditorInput(id);
        if (!input) return;
        let edit = null;
        input.addEventListener('focus', () => {
            const object = getSelectedPropertyTarget();
            edit = object && eligible(object) ? { object, oldValue: readValue(object) } : null;
        });
        const apply = (commit) => {
            const object = getSelectedPropertyTarget();
            if (!object || !eligible(object) || (edit && edit.object !== object)) return;
            if (!edit) edit = { object, oldValue: readValue(object) };
            const value = parseValue(input.value);
            applyProperty(object, property, value);
            if (commit) {
                commitProperty(object, property, edit.oldValue, value);
                edit.oldValue = value;
            }
        };
        input.addEventListener('input', () => apply(false));
        input.addEventListener('change', () => apply(true));
    };
    const bindLiveNumericEntries = (entries) => {
        entries.forEach(({ id, prop }) => bindLiveProperty(id, prop, object => object[prop], sanitizeInputValue));
    };
    const bindLiveShadowRadius = (id) => bindLiveProperty(
        id, 'shadowRadius', _getLightShadowRadius, sanitizeInputValue, object => Boolean(object.shadow)
    );
    const bindLiveColor = (id, getCurrentColor) => bindLiveProperty(id, 'color', getCurrentColor, value => value);
    const bindSpotTargetObject = () => {
        _bindEditorInputChange('spotTargetObject', function() {
            const object = getSelectedPropertyTarget();
            const target = getEditorSceneObjectByName(this.value);
            if (!object || !target || object.target === target) return;
            const previous = object.target;
            applyProperty(object, 'target', target);
            commitProperty(object, 'target', previous, target);
        });
    };

    bindLiveColor('sunColor', _getFirstChildMaterialColorHex);
    bindLiveNumericEntries([
        { id: 'sunIntensity', prop: 'intensity' }
    ]);
    bindPropEntries([
        { id: 'sunShadowCameraBottom', prop: 'shadowCameraBottom', sanitize: true },
        { id: 'sunShadowCameraTop', prop: 'shadowCameraTop', sanitize: true },
        { id: 'sunShadowCameraLeft', prop: 'shadowCameraLeft', sanitize: true },
        { id: 'sunShadowCameraRight', prop: 'shadowCameraRight', sanitize: true },
        { id: 'sunshadowMapHeight', prop: 'shadowMapHeight', sanitize: true },
        { id: 'sunshadowMapWidth', prop: 'shadowMapWidth', sanitize: true },
        { id: 'sunshadowBias', prop: 'shadowBias', sanitize: true },
        { id: 'castShadow', prop: 'castingShadow', isCheckbox: true },
        { id: 'sunSky', prop: 'sunSky', isCheckbox: true }
    ]);

    bindLiveColor('lampColor', _getFirstChildMaterialColorHex);
    bindLiveNumericEntries([
        { id: 'lampPower', prop: 'power' },
        { id: 'lampDecay', prop: 'decay' },
        { id: 'lampDistance', prop: 'distance' }
    ]);
    bindLiveShadowRadius('lampRadius');
    bindPropEntries([
        { id: 'lampShadowCameraBottom', prop: 'lampshadowCameraBottom', sanitize: true },
        { id: 'lampShadowCameraTop', prop: 'lampshadowCameraTop', sanitize: true },
        { id: 'lampShadowCameraLeft', prop: 'lampshadowCameraLeft', sanitize: true },
        { id: 'lampShadowCameraRight', prop: 'lampshadowCameraRight', sanitize: true },
        { id: 'lampshadowMapHeight', prop: 'lampshadowMapHeight', sanitize: true },
        { id: 'lampshadowMapWidth', prop: 'lampshadowMapWidth', sanitize: true },
        { id: 'lampshadowBias', prop: 'lampshadowBias', sanitize: true },
        { id: 'lampcastShadow', prop: 'lampcastingShadow', isCheckbox: true }
    ]);

    bindLiveColor('spotColor', _getFirstChildMaterialColorHex);
    bindLiveNumericEntries([
        { id: 'spotPower', prop: 'power', sanitize: true },
        { id: 'spotDecay', prop: 'decay', sanitize: true },
        { id: 'spotDistance', prop: 'distance', sanitize: true },
        { id: 'spotAngle', prop: 'angle', sanitize: true },
        { id: 'spotPenumbra', prop: 'penumbra', sanitize: true }
    ]);
    bindSpotTargetObject();

    bindLiveColor('ambientColor', _getObjectColorHex);
    bindLiveNumericEntries([
        { id: 'ambientIntensity', prop: 'intensity' }
    ]);

    const commitDoorTargetSelection = function () {
        const obj = _getDoorSelectObject(this);
        if (!obj || this.value === "Default" || !this.value) {
            return;
        }

        const hadSceneIdTarget = Boolean(_normalizeDoorTargetValue(obj.sceneID_target));
        const oldVal = _getDoorTargetValue(obj);
        const newVal = String(this.value);

        obj.sceneID_target = newVal;
        _syncDoorTargetSceneRecord(obj, newVal);
        _setDoorSelectValue(this, obj);

        if (String(oldVal || '') === newVal && hadSceneIdTarget) {
            return;
        }

        this._oldVal = newVal;

        if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
            VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'sceneID_target', oldVal, newVal));
        }
        VRODOS.api.saveChanges();
    };
    const doorSelect = _bindTrackedEditorInputChange('popupDoorSelect', commitDoorTargetSelection);
    if (doorSelect) {
        doorSelect.addEventListener('input', commitDoorTargetSelection);
    }

    _bindTrackedEditorInputChange('poi_link_text', function () {
        const obj = getSelectedPropertyTarget();
        if (!obj) {
            return;
        }

        const oldVal = this._oldVal !== undefined ? this._oldVal : (obj.poi_link_url || '');
        const newVal = this.value;

        if (oldVal !== newVal) {
            obj.poi_link_url = newVal;
            if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'poi_link_url', oldVal, newVal));
            }
            VRODOS.api.saveChanges();
        }
    });

    const setTitle = _getEditorInput('poi_image_title_text');
    const setDesc = _getEditorInput('poi_image_desc_text');

    _bindEditorInputChange('poi_image_desc_checkbox', function () {
        const obj = getSelectedPropertyTarget();
        if (!obj) {
            return;
        }

        const oldContent = obj.poi_img_content;
        const newContent = this.checked ? (setDesc && setDesc.value ? setDesc.value : '') : null;
        const newTitle = setTitle ? setTitle.value : obj.poi_img_title;

        if (oldContent !== newContent) {
            obj.poi_img_content = newContent;
            obj.poi_img_title = newTitle;

            if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'poi_img_content', oldContent, newContent));
            }

            if (setDesc) setDesc.style.display = this.checked ? "block" : "none";
            VRODOS.api.saveChanges();
        }
    });

    bindPropEntries([
        { id: 'poi_img_title_text', prop: 'poi_img_title' },
        { id: 'poi_image_desc_text', prop: 'poi_img_content' },
        { id: 'poi_chat_title', prop: 'poi_chat_title' },
        { id: 'poi_chat_participants', prop: 'poi_chat_participants', sanitize: true },
        { id: 'poi_chat_indicators', prop: 'poi_chat_indicators', isCheckbox: true }
    ]);
}

function bindPersistentPropertyListenersWhenReady() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPersistentPropertyListeners, { once: true });
        return;
    }

    initPersistentPropertyListeners();
}

bindPersistentPropertyListenersWhenReady();









/**
 * Show the floating Object Controls panel.
 * Positioned 100px to the right of the last mouse click,
 * clamped so it stays within the viewport.
 *
 * @param {string} [objectName] - Title shown in the panel header
 */


// Track last click position (updated by the canvas mousedown handler)
VRODOS.editor._lastClickX = 0;
VRODOS.editor._lastClickY = 0;























function vrodosNormalizeWalkableBehavior(value) {
    return String(value || '').toLowerCase() === 'auto' ? 'auto' : 'precise';
}





const VRODOS_COLLIDABLE_CATEGORY_SLUGS = new Set([
    'decoration',
    'walkable-surface',
    'collision-proxy',
    'door',
    'poi-link',
    'chat',
    'poi-chat',
    'audio',
    'video',
    'image',
    '3d-text',
    'poi-imagetext',
    'assessment'
]);

function vrodosNormalizeObjectShadowRole(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return ['auto', 'caster-receiver', 'receiver', 'none'].includes(normalized) ? normalized : 'auto';
}

function vrodosNormalizeObjectMaterialRole(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return ['auto', 'terrain-matte', 'authored-pbr', 'wet-glossy'].includes(normalized) ? normalized : 'auto';
}

function vrodosIsPlayerCollisionEligible(object) {
    if (!object || object.isLight) {
        return false;
    }

    const categorySlug = vrodosGetEffectiveObjectCategory(object).toLowerCase();
    if (VRODOS_COLLIDABLE_CATEGORY_SLUGS.has(categorySlug)) {
        return true;
    }

    if (object.name === 'avatarCamera' || object.category_name === 'pawn') {
        return false;
    }

    return Boolean(object.glb_path || object.image_path || object.video_path || object.poi_img_path || object.poi_image_path || object.text_content);
}

function vrodosIsShadowRoleEligible(object) {
    if (!object || object.isLight) {
        return false;
    }

    const categorySlug = String(object.category_slug || '').toLowerCase();
    if (categorySlug === 'collision-proxy') {
        return false;
    }
    if (object.name === 'avatarCamera' || object.category_name === 'pawn') {
        return false;
    }

    return categorySlug === 'primitive-plane' || Boolean(object.glb_path || object.image_path || object.video_path || object.poi_img_path || object.poi_image_path || object.text_content);
}

function vrodosIsMaterialRoleEligible(object) {
    if (!object || object.isLight) {
        return false;
    }

    const categorySlug = String(object.category_slug || '').toLowerCase();
    if (categorySlug === 'collision-proxy') {
        return false;
    }
    if (object.name === 'avatarCamera' || object.category_name === 'pawn') {
        return false;
    }

    return categorySlug === 'primitive-plane' || Boolean(object.glb_path);
}













function getObjectControlsTargetObject() {
    if (typeof VRODOS.ui.getPopupTargetObject === 'function') {
        return VRODOS.ui.getPopupTargetObject();
    }

    return getSelectedTransformObject();
}

function vrodosNormalizeAudioPlaybackMode(value) {
    return String(value || '').toLowerCase() === 'autoplay' ? 'autoplay' : 'interact';
}

function vrodosNormalizeAudioLoopValue(value) {
    const normalized = String(value ?? '').toLowerCase();
    return (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') ? '1' : '0';
}

function vrodosNormalizeAudioNumericValue(value, fallback, minimum, maximum) {
    let numericValue = parseFloat(value);

    if (!isFinite(numericValue)) {
        numericValue = fallback;
    }

    if (typeof minimum === 'number') {
        numericValue = Math.max(minimum, numericValue);
    }

    if (typeof maximum === 'number') {
        numericValue = Math.min(maximum, numericValue);
    }

    return String(numericValue);
}

function vrodosCommitObjectControlsProperty(prop, nextValue) {
    const targetObject = getObjectControlsTargetObject();
    if (!targetObject) return;

    const previousValue = targetObject[prop];
    const previousComparable = previousValue == null ? '' : String(previousValue);
    const nextComparable = nextValue == null ? '' : String(nextValue);

    if (previousComparable === nextComparable) {
        return;
    }

    if (!targetObject.userData) {
        targetObject.userData = {};
    }
    if (prop === 'sceneAssetRole' && (nextValue === undefined || nextValue === null || nextValue === '')) {
        delete targetObject.sceneAssetRole;
        delete targetObject.userData.sceneAssetRole;
    } else {
        targetObject[prop] = nextValue;
        targetObject.userData[prop] = nextValue;
    }

    VRODOS.loader.refreshPrimitivePlaneProperty(targetObject, prop);

    if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
        VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(targetObject, prop, previousValue, nextValue));
    }

    if (typeof VRODOS.api.saveChanges === 'function') {
        VRODOS.api.saveChanges();
    } else if (typeof VRODOS.editor.envir !== 'undefined' && VRODOS.editor.envir.scene) {
        VRODOS.editor.envir.scene.dispatchEvent({ type: 'modificationPendingSave' });
    }
}

const VRODOS_PLANE_TEXTURE_SLOT_PROPERTIES = Object.freeze({
    albedo: { attachment: 'surfaceAlbedoAttachmentId', url: 'surfaceAlbedoUrl', label: 'Albedo' },
    normal: { attachment: 'surfaceNormalAttachmentId', url: 'surfaceNormalUrl', label: 'Normal' },
    roughness: { attachment: 'surfaceRoughnessAttachmentId', url: 'surfaceRoughnessUrl', label: 'Roughness' },
    ao: { attachment: 'surfaceAoAttachmentId', url: 'surfaceAoUrl', label: 'Ambient Occlusion' },
    metalness: { attachment: 'surfaceMetalnessAttachmentId', url: 'surfaceMetalnessUrl', label: 'Metalness' },
    displacement: { attachment: 'surfaceDisplacementAttachmentId', url: 'surfaceDisplacementUrl', label: 'Displacement', authoringOnly: true }
});

function vrodosPlaneNumericValue(value, fallback, minimum, maximum) {
    const number = Number(value);
    return Math.min(maximum, Math.max(minimum, Number.isFinite(number) ? number : fallback));
}

function vrodosApplyPlaneTextureState(object, slot, state) {
    const definition = VRODOS_PLANE_TEXTURE_SLOT_PROPERTIES[slot];
    if (!object || !definition) return;

    object[definition.attachment] = Number(state.attachmentId) || 0;
    object[definition.url] = String(state.url || '');
    object.userData = object.userData || {};
    object.userData[definition.attachment] = object[definition.attachment];
    if (object[definition.url]) object.userData[definition.url] = object[definition.url];
    else delete object.userData[definition.url];
    if (slot === 'normal' && Object.prototype.hasOwnProperty.call(state, 'normalYSign')) {
        object.surfaceNormalYSign = Number(state.normalYSign) < 0 ? -1 : 1;
        object.userData.surfaceNormalYSign = object.surfaceNormalYSign;
    }
    if (VRODOS.loader && typeof VRODOS.loader.setPrimitivePlaneTexture === 'function') {
        VRODOS.loader.setPrimitivePlaneTexture(object, slot, object[definition.url]);
    }
}

function vrodosPlaneTextureState(object, slot) {
    const definition = VRODOS_PLANE_TEXTURE_SLOT_PROPERTIES[slot];
    const state = {
        attachmentId: definition ? Number(object[definition.attachment]) || 0 : 0,
        url: definition ? String(object[definition.url] || '') : ''
    };
    if (slot === 'normal') state.normalYSign = Number(object.surfaceNormalYSign) < 0 ? -1 : 1;
    return state;
}

function vrodosAddPlaneTextureUndo(object, slot, oldState, newState) {
    if (typeof VRODOS.editor.undoManager === 'undefined' || VRODOS.editor.undoManager.isExecuting || typeof VRODOS.editor.PlaneTextureCommand !== 'function') {
        return null;
    }
    const command = new VRODOS.editor.PlaneTextureCommand(object, slot, oldState, newState);
    VRODOS.editor.undoManager.add(command);
    return command;
}

function vrodosRemoveFailedPlaneTextureUndo(command) {
    const manager = VRODOS.editor.undoManager;
    if (!manager || !command || manager.undoStack.at(-1) !== command) return;
    manager.undoStack.pop();
    manager.updateButtons();
}

function vrodosPlaneSurfaceMaterialState(object) {
    const slots = {};
    Object.keys(VRODOS_PLANE_TEXTURE_SLOT_PROPERTIES).forEach((slot) => {
        slots[slot] = vrodosPlaneTextureState(object, slot);
    });
    return {
        slots,
        properties: {
            surfaceNormalYSign: Number(object.surfaceNormalYSign) < 0 ? -1 : 1,
            surfaceAntiTilingEnabled: ![false, 0, '0', 'false'].includes(object.surfaceAntiTilingEnabled),
            surfaceAntiTilingPatchTiles: vrodosPlaneNumericValue(object.surfaceAntiTilingPatchTiles, 1.25, 0.5, 4),
            surfaceAntiTilingBlendSharpness: vrodosPlaneNumericValue(object.surfaceAntiTilingBlendSharpness, 4, 1, 12)
        }
    };
}

async function vrodosSavePlaneSurfaceMaterialPackage(object, oldState, packageData) {
    const maps = packageData && packageData.maps ? packageData.maps : {};
    const nextState = {
        slots: {},
        properties: {
            ...oldState.properties,
            surfaceNormalYSign: Number(packageData.normalYSign) < 0 ? -1 : 1,
            surfaceAntiTilingEnabled: Boolean(maps.albedo)
        }
    };
    Object.keys(VRODOS_PLANE_TEXTURE_SLOT_PROPERTIES).forEach((slot) => {
        const map = maps[slot];
        nextState.slots[slot] = map
            ? { attachmentId: Number(map.attachmentId) || 0, url: String(map.url || '') }
            : { attachmentId: 0, url: '' };
    });

    let command = null;
    try {
        VRODOS.editor.applyPlaneSurfaceMaterialState(object, nextState, { updateUi: false, autosave: false });
        command = new VRODOS.editor.PlaneSurfaceMaterialCommand(object, oldState, nextState);
        VRODOS.editor.undoManager.add(command);
        await VRODOS.api.saveChanges({ force: true });
        return nextState;
    } catch (error) {
        vrodosRemoveFailedPlaneTextureUndo(command);
        VRODOS.editor.applyPlaneSurfaceMaterialState(object, oldState, { updateUi: false, autosave: false });
        await Promise.allSettled(Object.values(maps).map((map) => (
            map && map.attachmentId ? VRODOS.api.deleteSurfaceTexture(map.attachmentId) : Promise.resolve()
        )));
        throw error;
    }
}

async function vrodosSavePlaneTextureChange(object, slot, oldState, newState) {
    vrodosApplyPlaneTextureState(object, slot, newState);
    const command = vrodosAddPlaneTextureUndo(object, slot, oldState, newState);
    try {
        await VRODOS.api.saveChanges({ force: true });
    } catch (error) {
        vrodosRemoveFailedPlaneTextureUndo(command);
        vrodosApplyPlaneTextureState(object, slot, oldState);
        if (newState.attachmentId && newState.attachmentId !== oldState.attachmentId) {
            VRODOS.api.deleteSurfaceTexture(newState.attachmentId).catch((deleteError) => {
                console.warn('VRodos: could not clean up the failed surface texture upload.', deleteError);
            });
        }
        throw error;
    }
}









/**
 * Hide all object property sections inside the floating panel.
 */


/**
 * Show properties for the selected object inside the floating panel,
 * based on its category_slug / category_name.
 */






// Set up drag + close once DOM is ready.
document.addEventListener('DOMContentLoaded', bindObjectControlsPanelEvents);
if (document.readyState !== 'loading') {
    bindObjectControlsPanelEvents();
}

// GUI controls — lil-gui (successor to dat.gui)
const controlInterface = new lil.GUI({ autoPlace: false });
controlInterface.domElement.style.width = '100%';

// Remove the lil-gui title bar (our floating panel has its own header)
// and prevent collapsing — controls should always be visible
controlInterface.$title.style.display = 'none';
controlInterface.domElement.classList.add('autoHeight');

const coordLabel = ['<span style="color:red">X</span>', '<span style="color:green">Y</span>', '<span style="color:blue">Z</span>'];
const actionLabel = ['translate', 'translate', 'translate', 'rotate', 'rotate', 'rotate', 'scale', 'scale', 'scale'];


const dg_controller = Array();

const gui_controls_funs = (function () {
    // Internal storage — always numeric
    const _vals = { dg_t1: 0, dg_t2: 0, dg_t3: 0, dg_r1: 0, dg_r2: 0, dg_r3: 0, dg_s1: 0, dg_s2: 0, dg_s3: 0 };
    const obj = {};
    // Define getter/setter for each property so lil-gui never stores a string
    Object.keys(_vals).forEach((key) => {
        Object.defineProperty(obj, key, {
            get: function () { return _vals[key]; },
            set: function (v) { _vals[key] = parseFloat(v) || 0; },
            enumerable: true,
            configurable: true
        });
    });
    return obj;
})();


// Add variables to GUI
let i = 0;
Object.keys(gui_controls_funs).forEach((key) => {

    const label = `${actionLabel[i]  } ${  coordLabel[i % 3]}`;

    // lil-gui: .add() returns a Controller, .step() and .name() chain the same way
    // .decimals(2) handles display formatting (replaces manual toFixed hacks)
    dg_controller[i] = controlInterface.add(gui_controls_funs, key).step(0.001).decimals(2).name(key);

    // Patch getValue to ALWAYS return a number — lil-gui's updateDisplay calls .toFixed()
    // which crashes on strings/NaN. This is the definitive guard.
    (function (ctrl) {
        const _origGetValue = ctrl.getValue.bind(ctrl);
        ctrl.getValue = function () {
            const v = _origGetValue();
            return (typeof v === 'number' && !isNaN(v)) ? v : 0;
        };
    })(dg_controller[i]);

    // lil-gui escapes HTML in .name(), so set innerHTML directly for colored axis labels
    dg_controller[i].$name.innerHTML = label;

    // Add drag-to-scrub on the input: click+drag horizontally to change value
    _addDragScrub(dg_controller[i]);

    i++;
});

// Global flag: true while a drag-scrub is active on any lil-gui input.
// Used by onChange handlers to distinguish drag (apply live) vs keyboard (skip until commit).
let _isDragScrubbing = false;
window.vrodosGuiKeyboardEditing = window.vrodosGuiKeyboardEditing || 0;

/**
 * Adds mouse-drag scrubbing to a lil-gui number controller input.
 * Click and drag horizontally on the input to adjust the value.
 * Single click (no drag) focuses the input for keyboard editing.
 * Sensitivity adapts: translation/rotation use 0.01 per pixel, scale uses 0.005.
 */
function _addDragScrub(controller) {
    const input = controller.$input;
    const DRAG_THRESHOLD = 3; // pixels before drag starts
    let pointerDown = false;
    let dragging = false;
    let startX = 0;
    let startValue = 0;
    let isKeyboardEditing = false; // true when user clicked to type

    // Determine sensitivity from the controller property name
    const isScale = controller.property.startsWith('dg_s');
    const sensitivity = isScale ? 0.005 : 0.01;

    function setKeyboardEditing(nextState) {
        if (isKeyboardEditing === nextState) return;

        isKeyboardEditing = nextState;

        if (nextState) {
            window.vrodosGuiKeyboardEditing = (window.vrodosGuiKeyboardEditing || 0) + 1;
            input.dataset.vrodosKeyboardEditing = '1';
        } else {
            window.vrodosGuiKeyboardEditing = Math.max(0, (window.vrodosGuiKeyboardEditing || 0) - 1);
            delete input.dataset.vrodosKeyboardEditing;
        }
    }

    input.style.cursor = 'ew-resize';

    function captureTransformStart() {
        const target = getSelectedTransformObject();
        if (target && !input._oldTRS) {
            input._oldTRS = {
                pos: target.position.clone(),
                rot: target.rotation.clone(),
                scale: target.scale.clone()
            };
        }
    }

    // Block lil-gui's internal input handler during keyboard typing.
    // lil-gui listens on 'input' event and calls setValue() on every keystroke,
    // which moves the 3D object in real time. We stop that during keyboard mode.
    input.addEventListener('input', (e) => {
        if (isKeyboardEditing) {
            e.stopImmediatePropagation();
        }
    }, true); // capture phase — fires before lil-gui's handler

    input.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        // If input is already focused (user is typing), don't interfere
        if (isKeyboardEditing) return;
        pointerDown = true;
        dragging = false;
        startX = e.clientX;
        startValue = controller.getValue();
        
        captureTransformStart();
        
        input.setPointerCapture(e.pointerId);
        e.preventDefault(); // Prevent focus on pointerdown — we decide on pointerup
    });

    input.addEventListener('pointermove', (e) => {
        if (!pointerDown) return;
        const dx = e.clientX - startX;
        // Start dragging only after threshold
        if (!dragging && Math.abs(dx) >= DRAG_THRESHOLD) {
            dragging = true;
            _isDragScrubbing = true;
            input.style.cursor = 'ew-resize';
        }
        if (dragging) {
            const newValue = startValue + dx * sensitivity;
            controller.setValue(parseFloat(newValue.toFixed(3)));
        }
    });

    input.addEventListener('pointerup', (e) => {
        if (!pointerDown) return;
        const wasDragging = dragging;
        pointerDown = false;
        dragging = false;
        input.releasePointerCapture(e.pointerId);

        if (wasDragging) {
            // Finished a drag — resume animation and save
            _isDragScrubbing = false;
            
            // Commit Undo Transform
            commitUndoTransformFromInput(input);
            
            VRODOS.editor.animate();
            VRODOS.api.triggerAutoSave();
        } else {
            // Was a click (no drag) — enter keyboard editing mode
            setKeyboardEditing(true);
            input.focus();
            input.select();
            input.style.cursor = 'text';
        }
    });

    input.addEventListener('focus', () => {
        captureTransformStart();
        setKeyboardEditing(true);
        input.style.cursor = 'text';
    });

    // Exit keyboard editing mode on blur
    input.addEventListener('blur', () => {
        setKeyboardEditing(false);
        input.style.cursor = 'ew-resize';
        
        // Commit Undo Transform for keyboard edits
        commitUndoTransformFromInput(input);
    });

    // On Enter or Escape, blur the input — onFinishChange handles the actual update
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            input.blur();
        }
    });
}


/**
 *  Add listeners: Update php, javascript, and transform service state when GUI changes
 *  Triggered once initially
 */
function commitUndoTransformFromInput(input) {
    if (typeof VRODOS.editor.undoManager === 'undefined' || VRODOS.editor.undoManager.isExecuting) return;
    if (!input._oldTRS) return;

    const target = getSelectedTransformObject();
    if (!target) return;

    const newTRS = {
        pos: target.position.clone(),
        rot: target.rotation.clone(),
        scale: target.scale.clone()
    };

    const moved = target.position.distanceToSquared(input._oldTRS.pos) > 0.000001 ||
                  target.scale.distanceToSquared(input._oldTRS.scale) > 0.000001 ||
                  Math.abs(target.rotation.x - input._oldTRS.rot.x) > 0.0001 ||
                  Math.abs(target.rotation.y - input._oldTRS.rot.y) > 0.0001 ||
                  Math.abs(target.rotation.z - input._oldTRS.rot.z) > 0.0001;

    if (moved) {
        VRODOS.editor.undoManager.add(new VRODOS.editor.TransformCommand(target, input._oldTRS, newTRS));
    }
    delete input._oldTRS;
}

function syncLiveGuiTransformChange(target) {
    if (!target) return;

    target.updateMatrix();
    target.updateMatrixWorld(true);
    syncAttachedProxyToObject(target);

    if (typeof VRODOS.editor.requestRender === 'function') {
        VRODOS.editor.requestRender('transform-gui-drag');
    }
}

function controllerDatGuiOnChange() {


    // Keyboard edits commit on finish; scrubbing applies the same transform live.
    const groups = [
        { property: 'position', guiPrefix: 'dg_t' },
        { property: 'rotation', guiPrefix: 'dg_r' },
        { property: 'scale', guiPrefix: 'dg_s' }
    ];
    groups.forEach(({ property, guiPrefix }, groupIndex) => {
        ['x', 'y', 'z'].forEach((axis, axisIndex) => {
            const controller = dg_controller[groupIndex * 3 + axisIndex];
            const apply = (target, value) => {
                target[property][axis] = property === 'rotation' ? value / 180 * Math.PI : value;
                if (property === 'scale' && VRODOS.editor.envir.scene.keepScaleAspectRatio) {
                    target.scale.set(value, value, value);
                }
            };
            controller.onChange((value) => {
                if (!_isDragScrubbing) return;
                const target = getSelectedTransformObject();
                if (!target) return;
                apply(target, parseFloat(value) || 0);
                syncLiveGuiTransformChange(target);
            });
            controller.onFinishChange((value) => {
                value = parseFloat(value) || 0;
                gui_controls_funs[guiPrefix + (axisIndex + 1)] = value;
                const target = getSelectedTransformObject();
                if (target) {
                    apply(target, value);
                    target.updateMatrix();
                    target.updateMatrixWorld();
                    syncAttachedProxyToObject(target);
                }
                VRODOS.editor.animate();
                VRODOS.api.triggerAutoSave();
            });
        });
    });

    // Make slider-text controllers more interactive
    // lil-gui exposes .$input for the input element
    const opCodes = ['Tx', 'Ty', 'Tz', 'Rx', 'Ry', 'Rz', 'Sx', 'Sy', 'Sz'];
    for (let idx = 0; idx < 9; idx++) {
        dg_controller[idx]._opCode = opCodes[idx];
        setEventListenerKeyPressControllerConstrained(dg_controller[idx].$input, dg_controller[idx]);
    }
}


/**
 * This function allows the gui text element of the slider to be clickable and interactive
 * @param element - the input element
 * @param controller - the lil-gui controller (has _opCode custom property)
 */
function setEventListenerKeyPressControllerConstrained(element, controller) {
    let skipNextFocusoutCommit = false;

    function syncAttachedProxy(target) {
        VRODOS.editor.transforms.syncProxyToObject(target);
    }

    function commitInputValue() {
        const target = getSelectedTransformObject();
        if (!target) return;

        const parsed = parseFloat(element.value);
        const safeValue = Number.isFinite(parsed) ? parsed : 0;

        switch (controller._opCode) {
            case 'Tx':
                gui_controls_funs.dg_t1 = safeValue;
                target.position.x = safeValue;
                break;
            case 'Ty':
                gui_controls_funs.dg_t2 = safeValue;
                target.position.y = safeValue;
                break;
            case 'Tz':
                gui_controls_funs.dg_t3 = safeValue;
                target.position.z = safeValue;
                break;
            case 'Rx':
                gui_controls_funs.dg_r1 = safeValue;
                target.rotation.x = safeValue / 180 * Math.PI;
                break;
            case 'Ry':
                gui_controls_funs.dg_r2 = safeValue;
                target.rotation.y = safeValue / 180 * Math.PI;
                break;
            case 'Rz':
                gui_controls_funs.dg_r3 = safeValue;
                target.rotation.z = safeValue / 180 * Math.PI;
                break;
            case 'Sx':
                gui_controls_funs.dg_s1 = safeValue;
                target.scale.x = safeValue;
                if (VRODOS.editor.envir.scene.keepScaleAspectRatio) {
                    gui_controls_funs.dg_s2 = safeValue;
                    target.scale.y = safeValue;
                    gui_controls_funs.dg_s3 = safeValue;
                    target.scale.z = safeValue;
                }
                break;
            case 'Sy':
                gui_controls_funs.dg_s2 = safeValue;
                target.scale.y = safeValue;
                if (VRODOS.editor.envir.scene.keepScaleAspectRatio) {
                    gui_controls_funs.dg_s1 = safeValue;
                    target.scale.x = safeValue;
                    gui_controls_funs.dg_s3 = safeValue;
                    target.scale.z = safeValue;
                }
                break;
            case 'Sz':
                gui_controls_funs.dg_s3 = safeValue;
                target.scale.z = safeValue;
                if (VRODOS.editor.envir.scene.keepScaleAspectRatio) {
                    gui_controls_funs.dg_s1 = safeValue;
                    target.scale.x = safeValue;
                    gui_controls_funs.dg_s2 = safeValue;
                    target.scale.y = safeValue;
                }
                break;
            default:
                return;
        }

        target.updateMatrix();
        target.updateMatrixWorld(true);
        syncAttachedProxy(target);

        VRODOS.editor.transforms.setVisible(true);

        controller.updateDisplay();
        VRODOS.editor.animate();
        VRODOS.api.triggerAutoSave();
    }

    element.addEventListener("focusout", () => {
        if (!skipNextFocusoutCommit) {
            commitInputValue();
        } else {
            skipNextFocusoutCommit = false;
        }
        VRODOS.editor.animate();
        VRODOS.api.triggerAutoSave();
    });

    // onclick inside stop animating
    element.addEventListener("click", () => {
        if (typeof VRODOS.editor.stopRenderLoop === 'function') {
            VRODOS.editor.stopRenderLoop();
        } else {
            cancelAnimationFrame(VRODOS.editor.id_animation_frame);
        }
    });


    // Keyboard edits are committed only on Enter / blur.
    // This keeps temporary text edits away from Three.js while still allowing
    // a safe, explicit commit when the user finishes typing.
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'NumpadEnter') {
            skipNextFocusoutCommit = true;
            e.preventDefault();
            e.stopImmediatePropagation();
            commitInputValue();
            element.blur();
            return;
        }

        if (e.key === 'Escape') {
            skipNextFocusoutCommit = true;
            e.preventDefault();
            e.stopImmediatePropagation();
            controller.updateDisplay();
            element.blur();
        }
    }, true);
}



// =================================================================================
// 3D TRANSFORMATION PROXY SYSTEM
// =================================================================================
// Purpose: Enables high-sensitivity rotation in the current Three.js editor stack.
// Why: Modern Three.js clamps slerp(t) to [0,1]. To achieve >1x scaling, we use an 
// interactive Proxy handles object and manually extrapolate the Delta Axis-Angle.
// =================================================================================

// Global Gizmo Proxy to decouple interaction from visual result
window.vrodosGizmoProxy = window.vrodosGizmoProxy || new THREE.Object3D();
window.vrodosGizmoProxy.name = "vrodosGizmoProxy";
window.vrodosGizmoProxy.vrodos_internal_helper = true;
window.vrodosGizmoProxy.isSelectableMesh = false;

// State tracking for proxy-based transformation
window.vrodosRotationSensitivity = 20.0; // Default multiplier for rotation
VRODOS.editor.transforms.dragState = VRODOS.editor.transforms.dragState || {
    scaleStart: null,
    qProxyStart: new THREE.Quaternion(),
    pProxyStart: new THREE.Vector3(),
    qRealStart: new THREE.Quaternion(),
    pRealStart: new THREE.Vector3()
};
VRODOS.editor.qProxyStart = VRODOS.editor.transforms.dragState.qProxyStart;
VRODOS.editor.pProxyStart = VRODOS.editor.transforms.dragState.pProxyStart;
VRODOS.editor.qRealStart = VRODOS.editor.transforms.dragState.qRealStart;
VRODOS.editor.pRealStart = VRODOS.editor.transforms.dragState.pRealStart;
VRODOS.editor.currentSelectedRealObject = null;

function vrodosFiniteNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function syncAttachedProxyToObject(target) {
    VRODOS.editor.transforms.syncProxyToObject(target);
    syncLightArtifactsForTransform(target);
}

function syncLightArtifactsForTransform(target) {
    if (typeof VRODOS.utils.syncEditorLightArtifacts === 'function' && VRODOS.editor.envir) {
        VRODOS.utils.syncEditorLightArtifacts(target, VRODOS.editor.envir.scene);
    }
}

function ensureTransformControlsVisible() {
    if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.ensureVisible === 'function') {
        VRODOS.editor.transforms.ensureVisible();
    }
}

/**
 *  When you change trs from axes controls then automatically the GUI and the php form are updated
 *
 *  OnTickLevel
 */
function updatePositionsPhpAndJavsFromControlsAxes() {

    const attachedObject = VRODOS.editor.transforms.getAttachedObject();
    if (!attachedObject) return;

    // Determine the real object we are actually trying to move
    const realObject = getSelectedTransformObject();
    if (!realObject) return;
    const isLocked = typeof VRODOS.utils.isEditorObjectLocked === 'function'
        ? VRODOS.utils.isEditorObjectLocked(realObject)
        : Boolean(realObject.locked);
    if (isLocked) {
        if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.syncProxyToObject === 'function') {
            VRODOS.editor.transforms.syncProxyToObject(realObject);
        }
        if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.detach === 'function') {
            VRODOS.editor.transforms.detach();
        }
        return;
    }

    const isDragging = VRODOS.editor.transforms.isDragging();
    const activeAxis = VRODOS.editor.transforms.getAxis();

    // --- Proxy Sync Logic ---
    // Safety check: is the object currently attached to TransformControls actually our Proxy?
    const isWorkingOnProxy = attachedObject.name === "vrodosGizmoProxy";

    if (isDragging) {
        if (VRODOS.editor.transforms.getMode() === 'rotate' && isWorkingOnProxy) {
            // High-Sensitivity Booster Logic (unclamped rotation scale)
            // Extract the Axis and Angle of the proxy's change
            const qProxyCurrent = attachedObject.quaternion.clone();
            const dragState = VRODOS.editor.transforms.dragState;
            const qDelta = qProxyCurrent.clone().multiply(dragState.qProxyStart.clone().invert());
            
            const angle = 2 * Math.acos(Math.min(1, Math.max(-1, qDelta.w)));
            const s = Math.sqrt(1 - qDelta.w * qDelta.w);
            const axis = new THREE.Vector3();
            if (s < 0.0001) {
                axis.set(1, 0, 0); 
            } else {
                axis.set(qDelta.x / s, qDelta.y / s, qDelta.z / s);
            }
            
            // Rebuild the rotation with the multiplier applied directly to the angle
            const boostedDelta = new THREE.Quaternion().setFromAxisAngle(axis, angle * window.vrodosRotationSensitivity);
            
            realObject.quaternion.copy(dragState.qRealStart).multiply(boostedDelta);
            realObject.updateMatrix();
            realObject.updateMatrixWorld();
        } else {
            // 1:1 Sync for Translation, Scale, or non-proxy fallback
            realObject.position.copy(attachedObject.position);
            realObject.scale.copy(attachedObject.scale);
            if (!isWorkingOnProxy) {
                realObject.quaternion.copy(attachedObject.quaternion);
            }
            realObject.updateMatrix();
            realObject.updateMatrixWorld();
        }
    } else {
        // IDLE STATE: Handles follow asset
        if (isWorkingOnProxy) {
            attachedObject.position.copy(realObject.position);
            attachedObject.quaternion.copy(realObject.quaternion);
            attachedObject.scale.copy(realObject.scale);
            attachedObject.updateMatrix();
            attachedObject.updateMatrixWorld();
        }
    }

    // Trigger matrix updates during transformations to ensure visual consistency
    if (isDragging) {
        attachedObject.updateMatrix();
        attachedObject.updateMatrixWorld();
        syncLightArtifactsForTransform(realObject);
    }

    //--------- translate_x ---------------
    if (Math.abs(realObject.position.x - gui_controls_funs.dg_t1) > 0.0001) {
        const isMaster = !isDragging || (activeAxis && activeAxis.indexOf('X') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_t1 = realObject.position.x;
            VRODOS.editor.envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    //--------- translate_y ---------------
    if (Math.abs(realObject.position.y - gui_controls_funs.dg_t2) > 0.0001) {
        const isMaster = !isDragging || (activeAxis && activeAxis.indexOf('Y') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_t2 = realObject.position.y;
            VRODOS.editor.envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    //--------- translate_z ---------------
    if (Math.abs(realObject.position.z - gui_controls_funs.dg_t3) > 0.0001) {
        const isMaster = !isDragging || (activeAxis && activeAxis.indexOf('Z') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_t3 = realObject.position.z;
            VRODOS.editor.envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    // Rotation epsilon - use a slightly larger one for stability during gizmo interaction
    const rotEpsilon = 0.001;

    //--------- rotate_x ----------------------
    const rotXDeg = realObject.rotation.x * 180 / Math.PI;
    if (Math.abs(rotXDeg - gui_controls_funs.dg_r1) > rotEpsilon) {
        const isMaster = !isDragging || (activeAxis && activeAxis.indexOf('X') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_r1 = rotXDeg;
            VRODOS.editor.envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    //---------rotate_y -------------------------------
    const rotYDeg = realObject.rotation.y * 180 / Math.PI;
    if (Math.abs(rotYDeg - gui_controls_funs.dg_r2) > rotEpsilon) {
        const isMaster = !isDragging || (activeAxis && activeAxis.indexOf('Y') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_r2 = rotYDeg;
            VRODOS.editor.envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    //---------rotate_z -------------------------------
    const rotZDeg = realObject.rotation.z * 180 / Math.PI;
    if (Math.abs(rotZDeg - gui_controls_funs.dg_r3) > rotEpsilon) {
        const isMaster = !isDragging || (activeAxis && activeAxis.indexOf('Z') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_r3 = rotZDeg;
            VRODOS.editor.envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    const scaleSyncEpsilon = 0.00001;
    const isScaling = VRODOS.editor.transforms.getMode() === 'scale' && isDragging;
    const sStart = VRODOS.editor.transforms.dragState.scaleStart;

    //---------scale_x -------------------------------
    if (Math.abs(realObject.scale.x - gui_controls_funs.dg_s1) > scaleSyncEpsilon){
        const isMaster = !isScaling || (activeAxis && activeAxis.indexOf('X') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_s1 = realObject.scale.x;
            if (VRODOS.editor.envir.scene.keepScaleAspectRatio) {
                if (isScaling && sStart && Math.abs(sStart.x) > 0.0001) {
                    const ratio = realObject.scale.x / sStart.x;
                    realObject.scale.y = sStart.y * ratio;
                    realObject.scale.z = sStart.z * ratio;
                } else {
                    realObject.scale.x = realObject.scale.z;
                    realObject.scale.y = realObject.scale.z;
                }
                gui_controls_funs.dg_s1 = realObject.scale.x;
                gui_controls_funs.dg_s2 = realObject.scale.y;
            }
            VRODOS.editor.envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    //---------scale_y -------------------------------
    if (Math.abs(realObject.scale.y - gui_controls_funs.dg_s2) > scaleSyncEpsilon){
        const isMaster = !isScaling || (activeAxis && activeAxis.indexOf('Y') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_s2 = realObject.scale.y;
            VRODOS.editor.envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    //---------scale_z -------------------------------
    if (Math.abs(realObject.scale.z - gui_controls_funs.dg_s3) > scaleSyncEpsilon){
        const isMaster = !isScaling || (activeAxis && activeAxis.indexOf('Z') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_s3 = realObject.scale.z;
            if (VRODOS.editor.envir.scene.keepScaleAspectRatio) {
                if (isScaling && sStart && Math.abs(sStart.z) > 0.0001) {
                    const ratio = realObject.scale.z / sStart.z;
                    realObject.scale.x = sStart.x * ratio;
                    realObject.scale.y = sStart.y * ratio;
                } else {
                    realObject.scale.x = realObject.scale.z;
                    realObject.scale.y = realObject.scale.z;
                }
                gui_controls_funs.dg_s1 = realObject.scale.x;
                gui_controls_funs.dg_s2 = realObject.scale.y;
            }
            VRODOS.editor.envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

}



/**
 * Centralized Gizmo Attachment: Handles Proxy setup and identity delegation.
 * Use this instead of touching TransformControls directly.
 */
function vrodosAttachGizmo(object) {
    return VRODOS.editor.transforms.attach(object);
}

function clearTransformSelection() {
    VRODOS.editor.transforms.detach();
}

function attachTransformTarget(object) {
    clearTransformSelection();
    return vrodosAttachGizmo(object);
}

function getSelectedTransformObject() {
    return VRODOS.editor.transforms.getRealObject();
}

function syncTransformGuiFromObject(object) {
    const target = object || getSelectedTransformObject();
    if (!target) return;

    syncAttachedProxyToObject(target);
    ensureTransformControlsVisible();

    gui_controls_funs.dg_t1 = vrodosFiniteNumber(target.position.x, 0);
    gui_controls_funs.dg_t2 = vrodosFiniteNumber(target.position.y, 0);
    gui_controls_funs.dg_t3 = vrodosFiniteNumber(target.position.z, 0);

    gui_controls_funs.dg_r1 = vrodosFiniteNumber(target.rotation.x, 0) * 180 / Math.PI;
    gui_controls_funs.dg_r2 = vrodosFiniteNumber(target.rotation.y, 0) * 180 / Math.PI;
    gui_controls_funs.dg_r3 = vrodosFiniteNumber(target.rotation.z, 0) * 180 / Math.PI;

    gui_controls_funs.dg_s1 = vrodosFiniteNumber(target.scale.x, 1);
    gui_controls_funs.dg_s2 = vrodosFiniteNumber(target.scale.y, 1);
    gui_controls_funs.dg_s3 = vrodosFiniteNumber(target.scale.z, 1);

    for (let c = 0; c < dg_controller.length; c++) {
        if (dg_controller[c] && typeof dg_controller[c].updateDisplay === 'function') {
            dg_controller[c].updateDisplay();
        }
    }
}

VRODOS.ui.setDatGuiInitialVales = function(object){
    if (!object) return;

    vrodosAttachGizmo(object);

    syncTransformGuiFromObject(object);
    if (typeof VRODOS.editor.requestRender === 'function') {
        VRODOS.editor.requestRender('transform-gui-synced');
    }
}

VRODOS.ui.attachGizmo = vrodosAttachGizmo;
VRODOS.ui.clearTransformSelection = clearTransformSelection;
VRODOS.ui.attachTransformTarget = attachTransformTarget;
VRODOS.ui.getSelectedTransformObject = getSelectedTransformObject;
VRODOS.ui.getEditorSceneObjectByUuid = getEditorSceneObjectByUuid;
VRODOS.ui.getEditorSceneObjectByName = getEditorSceneObjectByName;
VRODOS.ui.getSelectedPropertyTarget = getSelectedPropertyTarget;
VRODOS.ui.sanitizeInputValue = sanitizeInputValue;
VRODOS.ui.syncTransformGuiFromObject = syncTransformGuiFromObject;
VRODOS.editor.transforms = VRODOS.editor.transforms || {};
VRODOS.editor.transforms.syncGui = syncTransformGuiFromObject;
VRODOS.editor.transforms.syncFromControls = updatePositionsPhpAndJavsFromControlsAxes;
VRODOS.ui.showObjectControlsPanel = showObjectControlsPanel;
VRODOS.ui.hideObjectControlsPanel = hideObjectControlsPanel;
VRODOS.ui.isObjectControlsPanelOpen = isObjectControlsPanelOpen;
VRODOS.ui.bindObjectControlsPanelEvents = bindObjectControlsPanelEvents;
VRODOS.ui.setObjectControlsActionsVisible = setObjectControlsActionsVisible;
VRODOS.ui.showPropertiesInPanel = showPropertiesInPanel;
VRODOS.ui.refreshSceneAssetRolePresentation = refreshSceneAssetRolePresentation;
VRODOS.ui.controlInterface = controlInterface;
VRODOS.ui.controllerDatGuiOnChange = controllerDatGuiOnChange;
VRODOS.ui.updatePositionsPhpAndJavsFromControlsAxes = updatePositionsPhpAndJavsFromControlsAxes;
