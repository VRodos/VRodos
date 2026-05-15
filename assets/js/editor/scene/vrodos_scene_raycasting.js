'use strict';

VRODOS.utils.normalizeIntersectedObjects = function(intersectedObjects) {

    const res = [];

    for (let i = 0; i < intersectedObjects.length; i++) {

        let examineObject = intersectedObjects[i].object;
        if (!examineObject) {
            continue;
        }

        while (examineObject && examineObject.parent && examineObject.parent.name !== "vrodosScene") {
            examineObject = examineObject.parent;
        }

        if (!examineObject) {
            continue;
        }

        res.push(examineObject);
    }

    // remove duplicates
    return Array.from(new Set(res));
}

VRODOS.ui.findIntersectedRaw = function(event) {

    const raycasterPick = VRODOS.ui.raycasterSetter(event);

    // All 3D meshes that can be clicked
    const activeMeshes = VRODOS.ui.getActiveMeshes();

    return raycasterPick.intersectObjects(activeMeshes, true);
}

VRODOS.ui.findIntersected = function(event) {

    return VRODOS.utils.normalizeIntersectedObjects(VRODOS.ui.findIntersectedRaw(event));
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

function _getEditorInput(id) {
    return document.getElementById(id);
}

function _showEditorPanel(panel) {
    if (panel) {
        panel.style.display = '';
    }
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

// Reusable raycaster and mouse vector (avoid allocations per event)
const _reusableRaycaster = new THREE.Raycaster();
const _reusableMouse = new THREE.Vector2();

// raycasting for picking objects
VRODOS.ui.raycasterSetter = function(event) {

    // calculate mouse position in normalized device coordinates
    const mainDiv = document.getElementById('vr_editor_main_div');
    const rect = mainDiv.getBoundingClientRect();
    _reusableMouse.x = ((event.clientX - rect.left) / mainDiv.clientWidth) * 2 - 1;
    _reusableMouse.y = - ((event.clientY - rect.top) / mainDiv.clientHeight) * 2 + 1;

    // Main Raycast object
    _reusableRaycaster.setFromCamera(_reusableMouse, VRODOS.editor.avatarControlsEnabled ? VRODOS.editor.envir.cameraAvatar : VRODOS.editor.envir.cameraOrbit);

    return _reusableRaycaster;
}


// This raycasting is used for drag n droping objects into the scene in 2D mode in order to
// find the correct y (height) to place the object
VRODOS.api.dragDropVerticalRayCasting = function(event) {
    const intersects = VRODOS.ui.findIntersectedRaw(event);
    return intersects.length === 0 ? [0, 0, 0] : [intersects[0].point.x, intersects[0].point.y, intersects[0].point.z];
}


// On Double click center screen and focus to that object
VRODOS.ui.onMouseDoubleClickFocus = function(event, id) {

    if (typeof id == 'undefined') {
        id = VRODOS.editor.envir.scene.getObjectById(VRODOS.editor.selected_object_name);
    }

    if (arguments.length === 2) {
        const obj = getEditorSceneObjectByUuid(id);
        if (obj && !obj.locked) {
            VRODOS.ui.selectorMajor(event, obj, "1");
        }
    }

    // Don't move the camera — just select the object.
    // Camera navigation is done manually by the user via orbit controls.
}


// ─── Click vs drag detection ───────────────────────────────
// We record the mousedown position and only trigger selection on mouseup
// if the mouse hasn't moved more than a few pixels (i.e. it was a click).
const _mouseDownPos = { x: 0, y: 0 };
let _mouseDownTime = 0;
const _CLICK_THRESHOLD = 5; // pixels
VRODOS.editor.suppressNextSelection = false; // Set by drop handler to prevent selection on drop

VRODOS.ui.onMouseDown = function(event) {
    _mouseDownPos.x = event.clientX;
    _mouseDownPos.y = event.clientY;
    _mouseDownTime = performance.now();
    // Store for panel positioning
    VRODOS.editor._lastClickX = event.clientX;
    VRODOS.editor._lastClickY = event.clientY;
};
VRODOS.ui.onMouseUp = function(event) {
    const dx = event.clientX - _mouseDownPos.x;
    const dy = event.clientY - _mouseDownPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Always trigger auto-save on mouseup
    if (typeof VRODOS.api.saveSceneEventHandler === 'function') {
        VRODOS.api.saveSceneEventHandler(event);
    }

    // Suppress selection after a drop event
    if (VRODOS.editor.suppressNextSelection) {
        VRODOS.editor.suppressNextSelection = false;
        return;
    }

    // Only trigger selection if it was a click, not a drag
    if (dist > _CLICK_THRESHOLD) return;

    VRODOS.ui.onLeftMouseClick(event);
};
VRODOS.ui.setSelectionIndicator = function(object) {
    if (!object) return;
    if (typeof VRODOS.ui.removeAllCelOutlines === 'function') {
        VRODOS.ui.removeAllCelOutlines();
    }
    if (typeof VRODOS.ui.addCelOutline === 'function') {
        VRODOS.ui.addCelOutline(object);
    }
};

VRODOS.utils.findParentSceneObject = function(object) {
    if (!object) return null;
    let curr = object;
    while (curr && curr.parent && curr.parent.name !== "vrodosScene") {
        curr = curr.parent;
    }
    return curr;
};
/**
 * Detect mouse click (fires on mouseup if pointer didn't move)
 *
 * @param event
 */
VRODOS.ui.onLeftMouseClick = function(event) {
    // If doing affine transformations with transform controls, then ignore select
    if (VRODOS.editor.transforms.isDragging())
        {return;}

    // Middle click return
    if (event.button === 1)
        {return;}

    event.preventDefault();
    event.stopPropagation();

    const intersects = VRODOS.ui.findIntersected(event);

    if (intersects.length === 0) {
        // Clicked empty canvas - deselect current object
        if (event.button === 0) {
            VRODOS.editor.selection.clear({ source: 'empty-canvas' });
        }
        return;
    }

    // If only one object is intersected
    if (intersects.length === 1) {

        if (!intersects[0].locked)
            {VRODOS.ui.selectorMajor(event, intersects[0], "2");}
        return;
    }

    // More than one objects intersected
    const selectedTransformObject = getSelectedPropertyTarget();
    const prevSelected = selectedTransformObject ? selectedTransformObject.name : null;
    let selectNext = false;
    let i = 0;

    for (i = 0; i < intersects.length; i++) {
        selectNext = prevSelected === intersects[i].name;
        if (selectNext)
            {break;}
    }

    if (!selectNext || i === intersects.length - 1)
        {i = -1;}

    if (!intersects[0].locked)
        {VRODOS.ui.selectorMajor(event, intersects[i + 1], "3");}

}// onMouseDown


/**
 * Select an object
 *
 * @param event
 * @param inters
 */
/**
 * Lightweight selection: attach gizmo + outline, highlight in hierarchy.
 * No floating panel or properties shown. Used by hierarchy hover.
 */
VRODOS.ui.selectObjectPreview = function(objectSel) {
    if (!objectSel) return;

    VRODOS.editor.selection.select(objectSel, {
        source: 'hierarchy-preview',
        openPanel: false,
        showProperties: false,
        focusHierarchy: true,
        outline: true,
        syncGui: true
    });
}

VRODOS.ui.selectorMajor = function(event, objectSel, whocalls) {
    if (!event || event.button !== 0 || !objectSel) return;

    VRODOS.editor.selection.select(objectSel, {
        source: whocalls || 'selector-major',
        openPanel: true,
        showProperties: true,
        focusHierarchy: true,
        outline: true,
        syncGui: true,
        setMode: true
    });
}

// Right Click: Show properties
VRODOS.ui.contextMenuClick = function(event) {
    event.preventDefault();
    const intersected = VRODOS.ui.findIntersected(event);

    if (intersected.length === 0)
        {return;}

       
    // Check if right-clicked is the one selected already with left-click
    const selectedTransformObject = getSelectedPropertyTarget();
    if (selectedTransformObject && intersected[0].name === selectedTransformObject.name) {
        showProperties(event, intersected[0]);
    }


}

// Right click raycast operations
function showProperties(event, object) {

    //var objectParent  = inters.object.parent;
    const name = object.name;
    switch (object.category_slug) {
        case 'decoration':
            // Don't display a popup in decoration. You can only change name and glb file from asset editor!
            break;
        case 'poi-imagetext':
            VRODOS.ui.displayPoiImageTextProperties(event, name);
            break;
        case 'door':
            VRODOS.ui.displayDoorProperties(event, name);
            break;
        case 'poi-link':
            VRODOS.ui.displayLinkProperties(event, name);
            break;
        case 'chat':
        case 'poi-chat':
            VRODOS.ui.displayPoiChatProperties(event, name);
            break;
        // case 'lightSun':
        //     VRODOS.ui.displaySunProperties(event, name);
        //     break;
        // case 'lightLamp':
        //     VRODOS.ui.displayLampProperties(event, name);
        //     break;
        // case 'lightSpot':
        //     VRODOS.ui.displaySpotProperties(event, name);
        //     break;
        // case 'lightAmbient':
        //     VRODOS.ui.displayAmbientProperties(event, name);
        //     break;
        default:
            break;
    }
    switch (object.category_name) {
        case 'lightSun':
            VRODOS.ui.displaySunProperties(event, name);
            break;
        case 'lightLamp':
            VRODOS.ui.displayLampProperties(event, name);
            break;
        // case 'lightSpot':
        //     VRODOS.ui.displaySpotProperties(event, name);
        //     break;
        // case 'lightAmbient':
        //     VRODOS.ui.displayAmbientProperties(event, name);
        //     break;
        default:
            break;
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

function getSceneObjectFromHierarchyItem(item) {
    if (!item) return null;
    if (typeof item.getAttribute !== 'function') return null;
    const uuid = item.getAttribute('data-uuid') || item.id;
    const name = item.getAttribute('data-name');
    return (uuid ? getEditorSceneObjectByUuid(uuid) : null) || (name ? getEditorSceneObjectByName(name) : null);
}

function getSpotTargetOptionObjects() {
    const scene = VRODOS.editor.envir ? VRODOS.editor.envir.scene : null;
    const roots = typeof VRODOS.utils.getEditorSceneRoots === 'function'
        ? VRODOS.utils.getEditorSceneRoots(scene, {
            filterSelectable: true,
            includeDirector: true,
            rebuildRegistryIfEmpty: false
        })
        : [];

    if (roots.length > 0) {
        return roots;
    }

    const hierViewer = document.getElementById('hierarchy-viewer');
    if (!hierViewer) return [];

    return Array.from(hierViewer.querySelectorAll('.hierarchyItem'))
        .map(getSceneObjectFromHierarchyItem)
        .filter(Boolean);
}

/**
 * Sun properties
 *
 * @param event
 * @param name
 */
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

// LAMP PROPERTIES DIV show
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


// SPOT PROPERTIES DIV show
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

    // Show Selection (inside floating panel)
    _showEditorPanel(panelState.panel);
}



// AMBIENT PROPERTIES DIV show
VRODOS.ui.displayAmbientProperties = function(event, name) {
    const panelState = _getPropertyPanelState("popUpAmbientPropertiesDiv", name, { selectedFallback: true });
    if (!panelState) return;
    const sceneObj = panelState.sceneObj;

    if (sceneObj && sceneObj.color) {
        _setEditorInputValue('ambientColor', `#${  sceneObj.color.getHexString()}`);
    }

    _setEditorInputValue('ambientIntensity', sceneObj.intensity || 1);

    // Show Selection (inside floating panel)
    _showEditorPanel(panelState.panel);
}




/**
 * Selecting a DoorTarget for the DoorSource
 *
 * @param event
 * @param name
 */
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

/**
 * Initializes persistent event listeners for light and properties panels
 * so that we don't need to bind/unbind them on every click.
 */
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
    // --- Sun Properties ---
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

    // --- Lamp Properties ---
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

    // --- Spot Properties ---
    bindLiveColor('spotColor', _getFirstChildMaterialColorHex);
    bindLiveNumericEntries([
        { id: 'spotPower', prop: 'power', sanitize: true },
        { id: 'spotDecay', prop: 'decay', sanitize: true },
        { id: 'spotDistance', prop: 'distance', sanitize: true },
        { id: 'spotAngle', prop: 'angle', sanitize: true },
        { id: 'spotPenumbra', prop: 'penumbra', sanitize: true }
    ]);
    bindSpotTargetObject();

    // --- Ambient Properties ---
    bindLiveColor('ambientColor', _getObjectColorHex);
    bindLiveNumericEntries([
        { id: 'ambientIntensity', prop: 'intensity' }
    ]);

    // --- Door & Link Properties ---
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
        if (obj && this.value) {
            const oldVal = this._oldVal || obj.poi_link_url;
            const newVal = this.value;

            if (oldVal !== newVal) {
                obj.poi_link_url = newVal;
                if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                    VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'poi_link_url', oldVal, newVal));
                }
                VRODOS.api.saveChanges();
            }
        }
    });

    // --- POI Image Text Properties ---
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
                // For complex multi-prop changes, we could use a custom command, but VRODOS.editor.PropertyCommand is enough for the main content
                VRODOS.editor.undoManager.add(new VRODOS.editor.PropertyCommand(obj, 'poi_img_content', oldContent, newContent));
            }

            if (setDesc) setDesc.style.display = this.checked ? "block" : "none";
            VRODOS.api.saveChanges();
        }
    });

    bindProp('poi_img_title_text', 'poi_img_title');
    bindProp('poi_image_desc_text', 'poi_img_content');

    // --- POI Chat Properties ---
    bindPropEntries([
        { id: 'poi_chat_title', prop: 'poi_chat_title' },
        { id: 'poi_chat_participants', prop: 'poi_chat_participants', sanitize: true },
        { id: 'poi_chat_indicators', prop: 'poi_chat_indicators', isCheckbox: true }
    ]);
}

// Call once when script loads
initPersistentPropertyListeners();

/**
 * Get active meshes for raycast picking method
 *
 * @returns {Array}
 */
VRODOS.ui.getActiveMeshes = function() {
    const registry = VRODOS.editor.sceneRegistry;
    const envir = VRODOS.editor.envir;
    const registryMeshes = registry && typeof registry.getSelectableRoots === 'function'
        ? registry.getSelectableRoots({ rebuildIfEmpty: false })
        : [];
    if (registryMeshes.length > 0) {
        return registryMeshes;
    }

    // Fast path: use the pre-built cache maintained by add/remove operations
    if (envir && envir.selectableMeshes && envir.selectableMeshes.size > 0) {
        if (envir.selectableMeshesDirty ||
            !Array.isArray(envir.selectableMeshesArray) ||
            envir.selectableMeshesArray.length !== envir.selectableMeshes.size) {
            envir.selectableMeshesArray = typeof VRODOS.utils.dedupeEditorSceneRoots === 'function'
                ? VRODOS.utils.dedupeEditorSceneRoots(Array.from(envir.selectableMeshes), { reason: 'raycast-selectable-cache', log: false })
                : Array.from(envir.selectableMeshes);
            envir.selectableMeshesDirty = false;
        }

        return envir.selectableMeshesArray;
    }

    return [];
}

/**
 * Poi image text properties
 *
 * @param event
 * @param name
 */
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
