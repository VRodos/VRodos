// ─── Floating Object Controls Panel helpers ───

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

function _applyEditorLightColor(object, hexColor) {
    const scene = VRODOS.editor && VRODOS.editor.envir ? VRODOS.editor.envir.scene : null;
    if (VRODOS.utils && typeof VRODOS.utils.applyEditorLightColor === 'function') {
        VRODOS.utils.applyEditorLightColor(object, hexColor, scene);
    }
}

function _getObjectColorHex(sceneObj) {
    return sceneObj && sceneObj.color && typeof sceneObj.color.getHexString === 'function'
        ? `#${  sceneObj.color.getHexString()}`
        : null;
}

function _getDoorTargetDisplayValue(sceneObj) {
    if (sceneObj.sceneID_target) {
        return sceneObj.sceneID_target;
    }
    if (sceneObj.doorName_target) {
        return `${sceneObj.doorName_target  } at ${  sceneObj.sceneName_target}`;
    }
    return 'Default';
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

function _setLightShadowRadius(light, value) {
    if (!light || !light.shadow) {
        return false;
    }

    const numericValue = sanitizeInputValue(value);
    light.shadow.radius = numericValue;
    light.shadowRadius = numericValue;
    return true;
}

function getSpotTargetOptionObjects() {
    return typeof VRODOS.utils.getSelectableEditorSceneRoots === 'function'
        ? VRODOS.utils.getSelectableEditorSceneRoots()
        : [];
}

VRODOS.ui.displaySunProperties = function(event, name) {
    const panelState = _getPropertyPanelState("popUpSunPropertiesDiv", name);
    if (!panelState) return;
    const sceneObj = panelState.sceneObj;

    _setEditorInputChecked('castShadow', sceneObj.castingShadow);
    _setEditorInputChecked('sunSky', sceneObj.sunSky);
    _setEditorInputValue('sunShadowCameraBottom', sceneObj.shadowCameraBottom);
    _setEditorInputValue('sunShadowCameraTop', sceneObj.shadowCameraTop);
    _setEditorInputValue('sunShadowCameraLeft', sceneObj.shadowCameraLeft);
    _setEditorInputValue('sunShadowCameraRight', sceneObj.shadowCameraRight);
    _setEditorInputValue('sunshadowMapHeight', sceneObj.shadowMapHeight);
    _setEditorInputValue('sunshadowMapWidth', sceneObj.shadowMapWidth);
    _setEditorInputValue('sunshadowBias', sceneObj.shadowBias);

    const sunColor = _getFirstChildMaterialColorHex(sceneObj);
    if (sunColor) {
        _setEditorInputValue('sunColor', sunColor);
    }

    _setEditorInputValue('sunIntensity', sceneObj.intensity || sceneObj.lightintensity || 1);

    _showEditorPanel(panelState.panel);
}

VRODOS.ui.displayLampProperties = function(event, name) {
    const panelState = _getPropertyPanelState("popUpLampPropertiesDiv", name);
    if (!panelState) return;
    const sceneObj = panelState.sceneObj;

    _setEditorInputChecked('lampcastShadow', sceneObj.lampcastingShadow);
    _setEditorInputValue('lampShadowCameraBottom', sceneObj.lampshadowCameraBottom);
    _setEditorInputValue('lampShadowCameraTop', sceneObj.lampshadowCameraTop);
    _setEditorInputValue('lampShadowCameraLeft', sceneObj.lampshadowCameraLeft);
    _setEditorInputValue('lampShadowCameraRight', sceneObj.lampshadowCameraRight);
    _setEditorInputValue('lampshadowMapHeight', sceneObj.lampshadowMapHeight);
    _setEditorInputValue('lampshadowMapWidth', sceneObj.lampshadowMapWidth);
    _setEditorInputValue('lampshadowBias', sceneObj.lampshadowBias);

    const lampColor = _getFirstChildMaterialColorHex(sceneObj);
    if (lampColor) {
        _setEditorInputValue('lampColor', lampColor);
    }

    _setEditorInputValue('lampPower', sceneObj.power);
    _setEditorInputValue('lampDecay', sceneObj.decay);
    _setEditorInputValue('lampDistance', sceneObj.distance);
    _setEditorInputValue('lampRadius', _getLightShadowRadius(sceneObj));

    _showEditorPanel(panelState.panel);
}

VRODOS.ui.displaySpotProperties = function(event, name) {
    const panelState = _getPropertyPanelState("popUpSpotPropertiesDiv", name, { selectedFallback: true });
    if (!panelState) return;
    const sceneObj = panelState.sceneObj;

    _populateEditorSelect('spotTargetObject', getSpotTargetOptionObjects().map((sceneObject) =>
        sceneObject && sceneObject.name ? sceneObject.name : null));

    const spotColor = _getFirstChildMaterialColorHex(sceneObj);
    if (spotColor) {
        _setEditorInputValue('spotColor', spotColor);
    }

    _setEditorInputValue('spotPower', sceneObj.power || 1);
    _setEditorInputValue('spotDecay', sceneObj.decay || 2);
    _setEditorInputValue('spotDistance', sceneObj.distance || 0);
    _setEditorInputValue('spotAngle', sceneObj.angle || Math.PI / 3);
    _setEditorInputValue('spotPenumbra', sceneObj.penumbra || 0);
    if (sceneObj.target) {
        _setEditorInputValue('spotTargetObject', sceneObj.target.name);
    }

    _showEditorPanel(panelState.panel);
}

VRODOS.ui.displayAmbientProperties = function(event, name) {
    const panelState = _getPropertyPanelState("popUpAmbientPropertiesDiv", name, { selectedFallback: true });
    if (!panelState) return;
    const sceneObj = panelState.sceneObj;

    if (sceneObj && sceneObj.color) {
        _setEditorInputValue('ambientColor', `#${  sceneObj.color.getHexString()}`);
    }

    _setEditorInputValue('ambientIntensity', sceneObj.intensity || 1);

    _showEditorPanel(panelState.panel);
}

VRODOS.ui.displayDoorProperties = function(event, name) {
    const panelState = _getPropertyPanelState("popUpDoorPropertiesDiv", name);
    if (!panelState) return;

    _setEditorInputValue('popupDoorSelect', _getDoorTargetDisplayValue(panelState.sceneObj));
    _showEditorPanel(panelState.panel);
}

VRODOS.ui.displayLinkProperties = function(event, name) {
    const panelState = _getPropertyPanelState("popUpLinkPropertiesDiv", name);
    if (!panelState) return;

    _setEditorInputValue('poi_link_text', panelState.sceneObj.poi_link_url || '');
    _showEditorPanel(panelState.panel);
}

VRODOS.ui.displayPoiChatProperties = function(event, name) {
    const panelState = _getPropertyPanelState("popUpPoiChatPropertiesDiv", name);
    if (!panelState) return;
    const sceneObj = panelState.sceneObj;

    _setEditorInputValue('poi_chat_title', sceneObj.poi_chat_title || 'Help Chat');
    _setEditorInputValue('poi_chat_participants', sceneObj.poi_chat_participants || 2);
    _setEditorInputChecked('poi_chat_indicators', sceneObj.poi_chat_indicators);

    _showEditorPanel(panelState.panel);
}

VRODOS.ui.displayPoiImageTextProperties = function(event, name) {
    const panelState = _getPropertyPanelState("popUpPoiImageTextPropertiesDiv", name);
    if (!panelState) return;
    const sceneObj = panelState.sceneObj;
    const hasContent = sceneObj.poi_img_content != null;
    const setDesc = _setEditorInputValue('poi_image_desc_text', sceneObj.poi_img_content || '');

    _setEditorInputChecked('poi_image_desc_checkbox', hasContent);
    if (setDesc) {
        setDesc.style.display = hasContent ? "block" : "none";
    }
    _setEditorInputValue('poi_image_title_text', sceneObj.poi_img_title || '');

    _showEditorPanel(panelState.panel);
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

function initPersistentPropertyListeners() {
    const setProp = (prop, isCheckbox, sanitize = false) => function () {
        const obj = getSelectedPropertyTarget();
        if (!obj) {
            return;
        }

        const oldValue = obj[prop];
        let val = isCheckbox ? (this.checked ? 1 : 0) : this.value;
        if (sanitize) val = sanitizeInputValue(val);

        if (oldValue !== val) {
            obj[prop] = val;
            if (obj.isLight && typeof VRODOS.utils.syncEditorLightArtifacts === 'function') {
                VRODOS.utils.syncEditorLightArtifacts(obj, VRODOS.editor.envir ? VRODOS.editor.envir.scene : null);
            }
            if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, prop, oldValue, val));
            }
            if (typeof VRODOS.editor.requestRender === 'function') {
                VRODOS.editor.requestRender('light-property-change');
            }
            VRODOS.api.saveChanges();
        }
    };

    const bindProp = (id, prop, isCheckbox = false, sanitize = false) =>
        _bindEditorInputChange(id, setProp(prop, isCheckbox, sanitize));
    const bindPropEntries = (entries) => {
        entries.forEach((entry) => {
            bindProp(entry.id, entry.prop, entry.isCheckbox, entry.sanitize);
        });
    };
    const syncLightPropertyEdit = (obj) => {
        if (obj && obj.isLight && typeof VRODOS.utils.syncEditorLightArtifacts === 'function') {
            VRODOS.utils.syncEditorLightArtifacts(obj, VRODOS.editor.envir ? VRODOS.editor.envir.scene : null);
        }
        if (typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender('light-property-change');
        }
    };
    const bindLiveNumericProp = (id, prop) => {
        const el = _getEditorInput(id);
        if (!el) {
            return null;
        }

        el.addEventListener('focus', function() {
            const obj = getSelectedPropertyTarget();
            this._oldVal = obj ? obj[prop] : undefined;
        });
        el.addEventListener('input', function () {
            const obj = getSelectedPropertyTarget();
            if (!obj) {
                return;
            }

            obj[prop] = sanitizeInputValue(this.value);
            syncLightPropertyEdit(obj);
        });
        el.addEventListener('change', function () {
            const obj = getSelectedPropertyTarget();
            if (!obj) {
                return;
            }

            const oldValue = this._oldVal;
            const newValue = sanitizeInputValue(this.value);
            obj[prop] = newValue;
            syncLightPropertyEdit(obj);
            if (oldValue !== newValue) {
                if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                    VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, prop, oldValue, newValue));
                }
                VRODOS.api.saveChanges();
            }
        });
        return el;
    };
    const bindLiveNumericEntries = (entries) => {
        entries.forEach((entry) => {
            bindLiveNumericProp(entry.id, entry.prop);
        });
    };
    const bindLiveShadowRadius = (id) => {
        const el = _getEditorInput(id);
        if (!el) {
            return null;
        }

        el.addEventListener('focus', function() {
            this._oldVal = _getLightShadowRadius(getSelectedPropertyTarget());
        });
        el.addEventListener('input', function () {
            const obj = getSelectedPropertyTarget();
            if (_setLightShadowRadius(obj, this.value)) {
                syncLightPropertyEdit(obj);
            }
        });
        el.addEventListener('change', function () {
            const obj = getSelectedPropertyTarget();
            if (!_setLightShadowRadius(obj, this.value)) {
                return;
            }

            const oldValue = this._oldVal;
            const newValue = _getLightShadowRadius(obj);
            syncLightPropertyEdit(obj);
            if (oldValue !== newValue) {
                if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                    VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'shadowRadius', oldValue, newValue));
                }
                VRODOS.api.saveChanges();
            }
        });
        return el;
    };
    const bindLiveColor = (id, getCurrentColor) => {
        const el = _getEditorInput(id);
        if (!el) {
            return null;
        }

        el.addEventListener('focus', function() {
            const obj = getSelectedPropertyTarget();
            this._oldVal = obj ? (getCurrentColor(obj) || this.value) : this.value;
        });
        el.addEventListener('input', function () {
            const obj = getSelectedPropertyTarget();
            if (!obj) {
                return;
            }

            _applyEditorLightColor(obj, this.value);
            syncLightPropertyEdit(obj);
        });
        el.addEventListener('change', function () {
            const obj = getSelectedPropertyTarget();
            if (!obj) {
                return;
            }

            const oldVal = this._oldVal || getCurrentColor(obj);
            const newVal = this.value;
            if (!oldVal) {
                return;
            }

            _applyEditorLightColor(obj, newVal);
            syncLightPropertyEdit(obj);
            if (oldVal !== newVal) {
                if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                    VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'color', oldVal, newVal));
                }
                VRODOS.api.saveChanges();
            }
        });
        return el;
    };
    const bindSpotTargetObject = () => {
        _bindEditorInputChange('spotTargetObject', function () {
            const obj = getSelectedPropertyTarget();
            const newTarget = getEditorSceneObjectByName(this.value);
            if (!obj || !newTarget || obj.target === newTarget) {
                return;
            }

            const oldTarget = obj.target;
            if (typeof VRODOS.utils.linkEditorLightTarget === 'function') {
                VRODOS.utils.linkEditorLightTarget(obj, newTarget);
            } else {
                obj.target = newTarget;
            }
            syncLightPropertyEdit(obj);

            if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'target', oldTarget, newTarget));
            }
            VRODOS.api.saveChanges();
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

    _bindTrackedEditorInputChange('popupDoorSelect', function () {
        const obj = getSelectedPropertyTarget();
        if (obj && this.value !== "Default" && this.value) {
            const oldVal = this._oldVal || obj.sceneID_target;
            const newVal = this.value;

            if (oldVal !== newVal) {
                obj.sceneID_target = newVal;
                if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                    VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'sceneID_target', oldVal, newVal));
                }
                VRODOS.api.saveChanges();
            }
        }
    });

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

    bindProp('poi_img_title_text', 'poi_img_title');
    bindProp('poi_image_desc_text', 'poi_img_content');

    bindPropEntries([
        { id: 'poi_chat_title', prop: 'poi_chat_title' },
        { id: 'poi_chat_participants', prop: 'poi_chat_participants', sanitize: true },
        { id: 'poi_chat_indicators', prop: 'poi_chat_indicators', isCheckbox: true }
    ]);
}

initPersistentPropertyListeners();

function getObjectControlsElement(key) {
    return document.getElementById(VRODOS_OBJECT_CONTROLS_IDS[key]);
}

function isObjectControlsPanelOpen() {
    const panel = getObjectControlsElement('panel');
    return Boolean(panel && !panel.classList.contains('tw-hidden'));
}

function setObjectControlsActionsVisible(isVisible) {
    const displayValue = isVisible ? '' : 'none';
    const manipulationToggle = getObjectControlsElement('manipulationToggle');
    const axisButtons = getObjectControlsElement('axisButtons');

    if (manipulationToggle) manipulationToggle.style.display = displayValue;
    if (axisButtons) axisButtons.style.display = displayValue;
}

function positionObjectControlsPanel(panel) {
    const panelW = panel.offsetWidth || 280;
    const panelH = panel.offsetHeight || 300;
    const mx = VRODOS.editor._lastClickX || (window.innerWidth / 2);
    const my = VRODOS.editor._lastClickY || (window.innerHeight / 2);

    let left = mx + 100;
    let top = my - panelH / 2;

    if (left + panelW > window.innerWidth - 8) {
        left = mx - 100 - panelW;
    }

    left = Math.max(8, Math.min(left, window.innerWidth - panelW - 8));
    top = Math.max(40, Math.min(top, window.innerHeight - panelH - 8));

    panel.style.left = `${Math.round(left)  }px`;
    panel.style.top = `${Math.round(top)  }px`;
    panel.style.right = 'auto';
}

/**
 * Show the floating Object Controls panel.
 * Positioned 100px to the right of the last mouse click,
 * clamped so it stays within the viewport.
 *
 * @param {string} [objectName] - Title shown in the panel header
 */
function showObjectControlsPanel(objectName) {
    const panel = getObjectControlsElement('panel');
    if (!panel) return;

    panel.classList.remove('tw-hidden');
    setObjectControlsActionsVisible(true);
    bindObjectControlsPanelEvents();

    if (objectName) {
        const title = getObjectControlsElement('title');
        if (title) title.textContent = objectName;
    }

    positionObjectControlsPanel(panel);
}

// Track last click position (updated by the canvas mousedown handler)
VRODOS.editor._lastClickX = 0;
VRODOS.editor._lastClickY = 0;

function hideObjectControlsPanel() {
    const panel = getObjectControlsElement('panel');
    if (panel) panel.classList.add('tw-hidden');
    setObjectControlsActionsVisible(false);
    updateObjectControlsMeta(null);
    hideAllPropertyPanels();
}

function humanizeObjectTypeLabel(typeValue) {
    if (!typeValue) return '';

    const aliases = {
        'walkable-surface': 'Walkable Surface',
        '3d-text': '3D Text',
        'poi-imagetext': 'Image Text POI',
        'poi-link': 'Link POI',
        'lightSun': 'Sun Light',
        'lightLamp': 'Lamp Light',
        'lightSpot': 'Spot Light',
        'lightAmbient': 'Ambient Light',
        'lightTargetSpot': 'Light Target',
        'avatarCamera': 'Camera',
        'pawn': 'Pawn'
    };

    if (aliases[typeValue]) {
        return aliases[typeValue];
    }

    return String(typeValue)
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getObjectTypeLabel(object) {
    if (!object) return '';

    return humanizeObjectTypeLabel(
        object.category_slug ||
        object.category_name ||
        object.asset_type ||
        ''
    );
}

function updateObjectControlsMeta(object) {
    const badge = getObjectControlsElement('badge');
    if (!badge) return;

    if (!object) {
        badge.classList.add('tw-hidden');
        badge.textContent = 'Object Type';
        badge.classList.remove('tw-bg-emerald-500/15', 'tw-text-emerald-300', 'tw-border-emerald-400/20');
        badge.classList.add('tw-bg-slate-500/15', 'tw-text-slate-200', 'tw-border-white/10');
        return;
    }

    const typeLabel = getObjectTypeLabel(object);
    if (!typeLabel) {
        badge.classList.add('tw-hidden');
        return;
    }

    badge.textContent = typeLabel;
    badge.classList.remove('tw-hidden');
    badge.classList.remove('tw-bg-emerald-500/15', 'tw-text-emerald-300', 'tw-border-emerald-400/20');
    badge.classList.add('tw-bg-slate-500/15', 'tw-text-slate-200', 'tw-border-white/10');
}

function ensureAssessmentPropertiesSection() {
    const container = getObjectControlsElement('propertiesContainer');
    if (!container) return null;

    let section = document.getElementById('popUpAssessmentPropertiesDiv');
    if (section) {
        return section;
    }

    section = document.createElement('div');
    section.id = 'popUpAssessmentPropertiesDiv';
    section.className = 'object-property-section';
    section.style.display = 'none';
    section.innerHTML =
        '<div class="prop-section-title" style="padding-bottom:2px; margin-bottom:2px;">Assessment Details</div>' +
        '<div class="tw-flex tw-flex-col tw-gap-2 tw-px-3 tw-pb-3" style="padding-top:2px;">' +
        '<div>' +
        '<div id="assessmentTypeValue" class="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-sky-400/35 tw-bg-sky-500/10 tw-px-2 tw-py-0.5 tw-text-[9px] tw-font-bold tw-uppercase tw-tracking-[0.1em] tw-text-sky-200"></div>' +
        '</div>' +
        '<div>' +
        '<div id="assessmentLevelsValue" class="tw-flex tw-flex-wrap tw-gap-1"></div>' +
        '</div>' +
        '</div>';

    container.appendChild(section);
    return section;
}

function getAssessmentTypeLabel(object) {
    if (!object) return '';

    const rawValue = object.assessment_type || object.assessment_group || '';
    return VRODOS.utils.displayText(rawValue).trim();
}

function getAssessmentLevelsList(object) {
    if (!object) return [];

    const normalizedLevels = typeof VRODOS.utils.normalizeAssessmentLevels === 'function'
        ? VRODOS.utils.normalizeAssessmentLevels(object.assessment_levels || '')
        : [];
    if (!normalizedLevels.length) {
        return [];
    }

    if (typeof VRODOS.utils.resolvedAssessmentLevels === 'function') {
        return VRODOS.utils.resolvedAssessmentLevels(object.assessment_levels || '');
    }

    return [];
}

function displayAssessmentProperties(object) {
    const section = ensureAssessmentPropertiesSection();
    if (!section || !object) return;

    const typeValue = document.getElementById('assessmentTypeValue');
    const levelsValue = document.getElementById('assessmentLevelsValue');
    const assessmentType = getAssessmentTypeLabel(object) || 'Assessment';
    const assessmentLevels = getAssessmentLevelsList(object);

    if (typeValue) {
        typeValue.textContent = assessmentType;
    }

    if (levelsValue) {
        levelsValue.innerHTML = '';

        assessmentLevels.forEach((level) => {
            const pill = document.createElement('span');
            pill.className = 'tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-emerald-400/35 tw-bg-emerald-500/10 tw-px-1.5 tw-py-0.5 tw-text-[9px] tw-font-bold tw-uppercase tw-tracking-[0.1em] tw-text-emerald-200';
            pill.textContent = level;
            levelsValue.appendChild(pill);
        });
    }

    section.style.display = 'block';
}

function vrodosNormalizeWalkableBehavior(value) {
    return String(value || '').toLowerCase() === 'auto' ? 'auto' : 'precise';
}

function ensureWalkableSurfacePropertiesSection() {
    const container = getObjectControlsElement('propertiesContainer');
    if (!container) return null;

    let section = document.getElementById('walkableSurfacePropertiesDiv');
    if (section) {
        return section;
    }

    section = document.createElement('div');
    section.id = 'walkableSurfacePropertiesDiv';
    section.className = 'object-property-section';
    section.style.display = 'none';
    section.innerHTML =
        '<div class="prop-section-title" style="padding-bottom:2px; margin-bottom:2px;">Walkable Surface</div>' +
        '<div class="tw-flex tw-flex-col tw-gap-2 tw-px-3 tw-pb-3" style="padding-top:2px;">' +
        '<label for="walkableBehaviorSelect" class="tw-text-[11px] tw-font-semibold tw-text-slate-200">Walking Behavior</label>' +
        '<select id="walkableBehaviorSelect" class="tw-select tw-select-sm tw-w-full tw-bg-slate-900/70 tw-border-white/10 tw-text-slate-100">' +
        '<option value="precise">Precise</option>' +
        '<option value="auto">Auto</option>' +
        '</select>' +
        '<div class="tw-text-[10px] tw-leading-relaxed tw-text-slate-400">Use <strong class="tw-text-slate-300">Auto</strong> for uploaded GLBs with messy or uneven topology. Use <strong class="tw-text-slate-300">Precise</strong> for cleaner helper meshes.</div>' +
        '</div>';

    container.appendChild(section);

    const select = document.getElementById('walkableBehaviorSelect');
    if (select) {
        select.addEventListener('change', () => {
            const selectedObject = getObjectControlsTargetObject();
            if (!selectedObject) return;

            if (String(selectedObject.category_slug || '').toLowerCase() !== 'walkable-surface') {
                return;
            }

            const nextBehavior = vrodosNormalizeWalkableBehavior(select.value);
            if (selectedObject.walkableBehavior === nextBehavior) {
                return;
            }

            selectedObject.walkableBehavior = nextBehavior;
            if (!selectedObject.userData) {
                selectedObject.userData = {};
            }
            selectedObject.userData.walkableBehavior = nextBehavior;

            if (typeof VRODOS.editor.envir !== 'undefined' && VRODOS.editor.envir.scene) {
                VRODOS.editor.envir.scene.dispatchEvent({ type: 'modificationPendingSave' });
            }
        });
    }

    return section;
}

function displayWalkableSurfaceProperties(object) {
    const section = ensureWalkableSurfacePropertiesSection();
    if (!section || !object) return;

    const select = document.getElementById('walkableBehaviorSelect');
    const currentBehavior = vrodosNormalizeWalkableBehavior(object.walkableBehavior);
    object.walkableBehavior = currentBehavior;

    if (object.userData) {
        object.userData.walkableBehavior = currentBehavior;
    }

    if (select) {
        select.value = currentBehavior;
    }

    section.style.display = 'block';
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

    targetObject[prop] = nextValue;
    if (!targetObject.userData) {
        targetObject.userData = {};
    }
    targetObject.userData[prop] = nextValue;

    if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
        VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(targetObject, prop, previousValue, nextValue));
    }

    if (typeof saveChanges === 'function') {
        VRODOS.api.saveChanges();
    } else if (typeof VRODOS.editor.envir !== 'undefined' && VRODOS.editor.envir.scene) {
        VRODOS.editor.envir.scene.dispatchEvent({ type: 'modificationPendingSave' });
    }
}

function ensureAudioPropertiesSection() {
    const container = getObjectControlsElement('propertiesContainer');
    if (!container) return null;

    let section = document.getElementById('audioPropertiesDiv');
    if (section) {
        return section;
    }

    section = document.createElement('div');
    section.id = 'audioPropertiesDiv';
    section.className = 'object-property-section';
    section.style.display = 'none';
    section.innerHTML =
        '<div class="prop-section-title" style="padding-bottom:2px; margin-bottom:2px;">Audio Settings</div>' +
        '<div class="tw-flex tw-flex-col tw-gap-3 tw-px-3 tw-pb-3" style="padding-top:2px;">' +
        '<div class="tw-flex tw-flex-col tw-gap-1">' +
        '<label for="audioPlaybackModeSelect" class="tw-text-[11px] tw-font-semibold tw-text-slate-200">Playback Mode</label>' +
        '<select id="audioPlaybackModeSelect" class="tw-select tw-select-sm tw-w-full tw-bg-slate-900/70 tw-border-white/10 tw-text-slate-100">' +
        '<option value="interact">Interact</option>' +
        '<option value="autoplay">Autoplay</option>' +
        '</select>' +
        '</div>' +
        '<label class="tw-flex tw-items-center tw-gap-2 tw-text-[11px] tw-font-semibold tw-text-slate-200">' +
        '<input type="checkbox" id="audioLoopCheckbox" class="tw-checkbox tw-checkbox-xs tw-checkbox-primary">' +
        '<span>Loop</span>' +
        '</label>' +
        '<div class="tw-grid tw-grid-cols-1 tw-gap-2">' +
        '<div class="tw-flex tw-flex-col tw-gap-1">' +
        '<label for="audioVolumeInput" class="tw-text-[11px] tw-font-semibold tw-text-slate-200">Volume</label>' +
        '<input id="audioVolumeInput" type="number" min="0" max="1" step="0.1" class="tw-input tw-input-sm tw-w-full tw-bg-slate-900/70 tw-border-white/10 tw-text-slate-100">' +
        '</div>' +
        '<div class="tw-flex tw-flex-col tw-gap-1">' +
        '<label for="audioRefDistanceInput" class="tw-text-[11px] tw-font-semibold tw-text-slate-200">Reference Distance</label>' +
        '<input id="audioRefDistanceInput" type="number" min="0.1" step="0.1" class="tw-input tw-input-sm tw-w-full tw-bg-slate-900/70 tw-border-white/10 tw-text-slate-100">' +
        '</div>' +
        '<div class="tw-flex tw-flex-col tw-gap-1">' +
        '<label for="audioMaxDistanceInput" class="tw-text-[11px] tw-font-semibold tw-text-slate-200">Max Distance</label>' +
        '<input id="audioMaxDistanceInput" type="number" min="0.1" step="0.1" class="tw-input tw-input-sm tw-w-full tw-bg-slate-900/70 tw-border-white/10 tw-text-slate-100">' +
        '</div>' +
        '<div class="tw-flex tw-flex-col tw-gap-1">' +
        '<label for="audioRolloffFactorInput" class="tw-text-[11px] tw-font-semibold tw-text-slate-200">Rolloff Factor</label>' +
        '<input id="audioRolloffFactorInput" type="number" min="0" step="0.1" class="tw-input tw-input-sm tw-w-full tw-bg-slate-900/70 tw-border-white/10 tw-text-slate-100">' +
        '</div>' +
        '</div>' +
        '<div class="tw-text-[10px] tw-leading-relaxed tw-text-slate-400">These values are saved on the scene object and used by the compiled scene runtime.</div>' +
        '</div>';

    container.appendChild(section);

    const playbackModeSelect = document.getElementById('audioPlaybackModeSelect');
    const loopCheckbox = document.getElementById('audioLoopCheckbox');
    const volumeInput = document.getElementById('audioVolumeInput');
    const refDistanceInput = document.getElementById('audioRefDistanceInput');
    const maxDistanceInput = document.getElementById('audioMaxDistanceInput');
    const rolloffFactorInput = document.getElementById('audioRolloffFactorInput');

    if (playbackModeSelect) {
        playbackModeSelect.addEventListener('change', function () {
            vrodosCommitObjectControlsProperty('audio_playback_mode', vrodosNormalizeAudioPlaybackMode(this.value));
        });
    }

    if (loopCheckbox) {
        loopCheckbox.addEventListener('change', function () {
            vrodosCommitObjectControlsProperty('audio_loop', this.checked ? '1' : '0');
        });
    }

    if (volumeInput) {
        volumeInput.addEventListener('change', function () {
            const normalized = vrodosNormalizeAudioNumericValue(this.value, 1, 0, 1);
            this.value = normalized;
            vrodosCommitObjectControlsProperty('audio_volume', normalized);
        });
    }

    if (refDistanceInput) {
        refDistanceInput.addEventListener('change', function () {
            const normalized = vrodosNormalizeAudioNumericValue(this.value, 2, 0.1);
            this.value = normalized;
            vrodosCommitObjectControlsProperty('audio_ref_distance', normalized);
        });
    }

    if (maxDistanceInput) {
        maxDistanceInput.addEventListener('change', function () {
            const normalized = vrodosNormalizeAudioNumericValue(this.value, 20, 0.1);
            this.value = normalized;
            vrodosCommitObjectControlsProperty('audio_max_distance', normalized);
        });
    }

    if (rolloffFactorInput) {
        rolloffFactorInput.addEventListener('change', function () {
            const normalized = vrodosNormalizeAudioNumericValue(this.value, 1, 0);
            this.value = normalized;
            vrodosCommitObjectControlsProperty('audio_rolloff_factor', normalized);
        });
    }

    return section;
}

function displayAudioProperties(object) {
    const section = ensureAudioPropertiesSection();
    if (!section || !object) return;

    const playbackModeSelect = document.getElementById('audioPlaybackModeSelect');
    const loopCheckbox = document.getElementById('audioLoopCheckbox');
    const volumeInput = document.getElementById('audioVolumeInput');
    const refDistanceInput = document.getElementById('audioRefDistanceInput');
    const maxDistanceInput = document.getElementById('audioMaxDistanceInput');
    const rolloffFactorInput = document.getElementById('audioRolloffFactorInput');

    const playbackMode = vrodosNormalizeAudioPlaybackMode(object.audio_playback_mode);
    const loopValue = vrodosNormalizeAudioLoopValue(object.audio_loop);
    const volumeValue = vrodosNormalizeAudioNumericValue(object.audio_volume, 1, 0, 1);
    const refDistanceValue = vrodosNormalizeAudioNumericValue(object.audio_ref_distance, 2, 0.1);
    const maxDistanceValue = vrodosNormalizeAudioNumericValue(object.audio_max_distance, 20, 0.1);
    const rolloffFactorValue = vrodosNormalizeAudioNumericValue(object.audio_rolloff_factor, 1, 0);

    object.audio_playback_mode = playbackMode;
    object.audio_loop = loopValue;
    object.audio_volume = volumeValue;
    object.audio_ref_distance = refDistanceValue;
    object.audio_max_distance = maxDistanceValue;
    object.audio_rolloff_factor = rolloffFactorValue;
    object.audio_distance_model = object.audio_distance_model || 'inverse';

    if (playbackModeSelect) playbackModeSelect.value = playbackMode;
    if (loopCheckbox) loopCheckbox.checked = loopValue === '1';
    if (volumeInput) volumeInput.value = volumeValue;
    if (refDistanceInput) refDistanceInput.value = refDistanceValue;
    if (maxDistanceInput) maxDistanceInput.value = maxDistanceValue;
    if (rolloffFactorInput) rolloffFactorInput.value = rolloffFactorValue;

    section.style.display = 'block';
}

/**
 * Hide all object property sections inside the floating panel.
 */
function hideAllPropertyPanels() {
    const container = getObjectControlsElement('propertiesContainer');
    if (!container) return;
    container.style.display = 'none';
    const sections = container.querySelectorAll('.object-property-section');
    for (let i = 0; i < sections.length; i++) {
        sections[i].style.display = 'none';
    }
}

/**
 * Show properties for the selected object inside the floating panel,
 * based on its category_slug / category_name.
 */
function showPropertiesInPanel(object) {
    if (!object) return;
    hideAllPropertyPanels();
    updateObjectControlsMeta(object);

    let hasProperties = false;

    // Dispatch by category_slug first
    switch (object.category_slug) {
        case 'assessment':
            displayAssessmentProperties(object);
            hasProperties = true;
            break;
        case 'walkable-surface':
            displayWalkableSurfaceProperties(object);
            hasProperties = true;
            break;
        case 'audio':
            displayAudioProperties(object);
            hasProperties = true;
            break;
        default:
            break;
    }

    hasProperties = displaySharedPropertySections(null, object) || hasProperties;

    // Show the container only if a property section is active
    if (hasProperties) {
        const container = getObjectControlsElement('propertiesContainer');
        if (container) container.style.display = 'block';
    }
}

function bindObjectControlsPanelEvents() {
    const panel = getObjectControlsElement('panel');
    const header = getObjectControlsElement('header');
    const closeBtn = getObjectControlsElement('closeButton');

    if (!panel || !header) return;
    if (panel.dataset.vrodosObjectControlsBound === '1') return;
    panel.dataset.vrodosObjectControlsBound = '1';

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideObjectControlsPanel();
        });
    }

    // Draggable via header — use delta from initial pointer position
    // Panel is position:fixed, so coordinates are viewport-relative
    let isDragging = false; let startX = 0; let startY = 0; let startLeft = 0; let startTop = 0;

    header.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return; // don't drag on close button
        isDragging = true;

        // For fixed positioning, getBoundingClientRect gives viewport coords directly
        const rect = panel.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        // Convert to left/top positioning (from right)
        panel.style.left = `${startLeft  }px`;
        panel.style.top = `${startTop  }px`;
        panel.style.right = 'auto';

        // Remember the starting pointer position
        startX = e.clientX;
        startY = e.clientY;

        header.setPointerCapture(e.pointerId);
        e.preventDefault();
    });

    header.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        panel.style.left = `${startLeft + e.clientX - startX  }px`;
        panel.style.top = `${startTop + e.clientY - startY  }px`;
    });

    header.addEventListener('pointerup', (e) => {
        isDragging = false;
        header.releasePointerCapture(e.pointerId);
    });
}

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
        
        // [NEW] Capture start TRS for Undo
        const target = getSelectedTransformObject();
        if (target) {
            input._oldTRS = {
                pos: target.position.clone(),
                rot: target.rotation.clone(),
                scale: target.scale.clone()
            };
        }
        
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


    // onChange fires on every value change (drag scrub + keyboard typing).
    // We only apply to the 3D object during drag (_isDragScrubbing = true).
    // Keyboard typing is committed via onFinishChange (Enter/blur).

    // --- Translation ---
    dg_controller[0].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = getSelectedTransformObject();
        if (target) {
            target.position.x = value;
            syncLiveGuiTransformChange(target);
        }
    }
    );
    dg_controller[0].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_t1 = value;
        const target = getSelectedTransformObject();
        if (target) {
            target.position.x = value;
            target.updateMatrix();
            target.updateMatrixWorld();
            syncAttachedProxyToObject(target);
        }
        VRODOS.editor.animate();
        VRODOS.api.triggerAutoSave();
    }
    );

    dg_controller[1].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = getSelectedTransformObject();
        if (target) {
            target.position.y = value;
            syncLiveGuiTransformChange(target);
        }
    }
    );
    dg_controller[1].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_t2 = value;
        const target = getSelectedTransformObject();
        if (target) {
            target.position.y = value;
            target.updateMatrix();
            target.updateMatrixWorld();
            syncAttachedProxyToObject(target);
        }
        VRODOS.editor.animate();
        VRODOS.api.triggerAutoSave();
    }
    );

    dg_controller[2].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = getSelectedTransformObject();
        if (target) {
            target.position.z = value;
            syncLiveGuiTransformChange(target);
        }
    }
    );
    dg_controller[2].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_t3 = value;
        const target = getSelectedTransformObject();
        if (target) {
            target.position.z = value;
            target.updateMatrix();
            target.updateMatrixWorld();
            syncAttachedProxyToObject(target);
        }
        VRODOS.editor.animate();
        VRODOS.api.triggerAutoSave();
    }
    );

    // --- Rotation ---
    dg_controller[3].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = getSelectedTransformObject();
        if (target) {
            target.rotation.x = value / 180 * Math.PI;
            syncLiveGuiTransformChange(target);
        }
    }
    );
    dg_controller[3].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_r1 = value;
        const target = getSelectedTransformObject();
        if (target) {
            target.rotation.x = value / 180 * Math.PI;
            target.updateMatrix();
            target.updateMatrixWorld();
            syncAttachedProxyToObject(target);
        }
        VRODOS.editor.animate();
        VRODOS.api.triggerAutoSave();
    }
    );

    dg_controller[4].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = getSelectedTransformObject();
        if (target) {
            target.rotation.y = value / 180 * Math.PI;
            syncLiveGuiTransformChange(target);
        }
    }
    );
    dg_controller[4].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_r2 = value;
        const target = getSelectedTransformObject();
        if (target) {
            target.rotation.y = value / 180 * Math.PI;
            target.updateMatrix();
            target.updateMatrixWorld();
            syncAttachedProxyToObject(target);
        }
        VRODOS.editor.animate();
        VRODOS.api.triggerAutoSave();
    }
    );

    dg_controller[5].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = getSelectedTransformObject();
        if (target) {
            target.rotation.z = value / 180 * Math.PI;
            syncLiveGuiTransformChange(target);
        }
    }
    );
    dg_controller[5].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_r3 = value;
        const target = getSelectedTransformObject();
        if (target) {
            target.rotation.z = value / 180 * Math.PI;
            target.updateMatrix();
            target.updateMatrixWorld();
            syncAttachedProxyToObject(target);
        }
        VRODOS.editor.animate();
        VRODOS.api.triggerAutoSave();
    }
    );

    // --- Scale ---
    dg_controller[6].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = getSelectedTransformObject();
        if (!target) return;
        target.scale.x = value;
        if (VRODOS.editor.envir.scene.keepScaleAspectRatio) {
            target.scale.y = value;
            target.scale.z = value;
        }
        syncLiveGuiTransformChange(target);
    }
    );
    dg_controller[6].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_s1 = value;
        const target = getSelectedTransformObject();
        if (target) {
            target.scale.x = value;
            if (VRODOS.editor.envir.scene.keepScaleAspectRatio) {
                target.scale.y = value;
                target.scale.z = value;
            }
            target.updateMatrix();
            target.updateMatrixWorld();
            syncAttachedProxyToObject(target);
        }
        VRODOS.editor.animate();
        VRODOS.api.triggerAutoSave();
    }
    );

    dg_controller[7].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = getSelectedTransformObject();
        if (!target) return;
        target.scale.y = value;
        if (VRODOS.editor.envir.scene.keepScaleAspectRatio) {
            target.scale.x = value;
            target.scale.z = value;
        }
        syncLiveGuiTransformChange(target);
    }
    );
    dg_controller[7].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_s2 = value;
        const target = getSelectedTransformObject();
        if (target) {
            target.scale.y = value;
            if (VRODOS.editor.envir.scene.keepScaleAspectRatio) {
                target.scale.x = value;
                target.scale.z = value;
            }
            target.updateMatrix();
            target.updateMatrixWorld();
            syncAttachedProxyToObject(target);
        }
        VRODOS.editor.animate();
        VRODOS.api.triggerAutoSave();
    }
    );

    dg_controller[8].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = getSelectedTransformObject();
        if (!target) return;
        target.scale.z = value;
        if (VRODOS.editor.envir.scene.keepScaleAspectRatio) {
            target.scale.x = value;
            target.scale.y = value;
        }
        syncLiveGuiTransformChange(target);
    }
    );
    dg_controller[8].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_s3 = value;
        const target = getSelectedTransformObject();
        if (target) {
            target.scale.z = value;
            if (VRODOS.editor.envir.scene.keepScaleAspectRatio) {
                target.scale.x = value;
                target.scale.y = value;
            }
            target.updateMatrix();
            target.updateMatrixWorld();
            syncAttachedProxyToObject(target);
        }
        VRODOS.editor.animate();
        VRODOS.api.triggerAutoSave();
    }
    );

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
// Purpose: Enables high-sensitivity rotation in Three.js r181.
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

    const isDragging = VRODOS.editor.transforms.isDragging();
    const activeAxis = VRODOS.editor.transforms.getAxis();

    // --- Proxy Sync Logic ---
    // Safety check: is the object currently attached to TransformControls actually our Proxy?
    const isWorkingOnProxy = attachedObject.name === "vrodosGizmoProxy";

    if (isDragging) {
        if (VRODOS.editor.transforms.getMode() === 'rotate' && isWorkingOnProxy) {
            // High-Sensitivity Booster Logic (Unclamped for r181)
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
VRODOS.ui.controlInterface = controlInterface;
VRODOS.ui.controllerDatGuiOnChange = controllerDatGuiOnChange;
VRODOS.ui.updatePositionsPhpAndJavsFromControlsAxes = updatePositionsPhpAndJavsFromControlsAxes;
