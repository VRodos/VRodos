/* global _getEditorInput, _setEditorInputValue, _setEditorInputChecked, _showEditorPanel, _getPropertyPanelState, _populateEditorSelect, _getFirstChildMaterialColorHex, _setDoorSelectValue, _bindDoorSelectToObject, _getLightShadowRadius, getObjectControlsElement, vrodosGetEffectiveObjectCategory, vrodosNormalizeWalkableBehavior, vrodosNormalizeObjectShadowRole, vrodosNormalizeObjectMaterialRole, getObjectControlsTargetObject, vrodosNormalizeAudioPlaybackMode, vrodosNormalizeAudioLoopValue, vrodosNormalizeAudioNumericValue, vrodosCommitObjectControlsProperty, VRODOS_PLANE_TEXTURE_SLOT_PROPERTIES, vrodosPlaneNumericValue, vrodosPlaneTextureState, vrodosPlaneSurfaceMaterialState, vrodosSavePlaneSurfaceMaterialPackage, vrodosSavePlaneTextureChange, refreshSceneAssetRolePresentation */
/* exported displayAssessmentProperties, displaySceneAssetRoleProperties, displayWalkableSurfaceProperties, displayCollisionProperties, displayShadowRoleProperties, displayMaterialRoleProperties, displayAudioProperties */

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

    const doorSelect = _getEditorInput('popupDoorSelect');
    _setDoorSelectValue(doorSelect, panelState.sceneObj);
    _bindDoorSelectToObject(doorSelect, panelState.sceneObj);
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

function ensureSceneAssetRolePropertiesSection() {
    const container = getObjectControlsElement('propertiesContainer');
    if (!container) return null;

    let section = document.getElementById('sceneAssetRolePropertiesDiv');
    if (section) {
        return section;
    }

    section = document.createElement('div');
    section.id = 'sceneAssetRolePropertiesDiv';
    section.className = 'object-property-section';
    section.style.display = 'none';
    section.innerHTML =
        '<div class="prop-section-title" style="padding-bottom:2px; margin-bottom:2px;">Scene Role</div>' +
        '<div class="tw-flex tw-flex-col tw-gap-2 tw-px-3 tw-pb-3" style="padding-top:2px;">' +
        '<label for="sceneAssetRoleSelect" class="tw-text-[11px] tw-font-semibold tw-text-slate-200">Role for this placement</label>' +
        '<select id="sceneAssetRoleSelect" class="tw-select tw-select-sm tw-w-full tw-bg-slate-900/70 tw-border-white/10 tw-text-slate-100">' +
        '<option value="decoration">Decoration</option>' +
        '<option value="walkable-surface">Walkable Surface</option>' +
        '</select>' +
        '<div class="tw-text-[10px] tw-leading-relaxed tw-text-slate-400">This changes only this placement in the current scene. The uploaded asset and its other placements stay unchanged.</div>' +
        '</div>';

    container.appendChild(section);

    const select = document.getElementById('sceneAssetRoleSelect');
    if (select) {
        select.addEventListener('change', function () {
            const selectedObject = getObjectControlsTargetObject();
            if (!selectedObject || typeof VRODOS.utils.isSceneAssetRoleEligible !== 'function' ||
                !VRODOS.utils.isSceneAssetRoleEligible(selectedObject)) {
                return;
            }

            const nextRole = VRODOS.utils.normalizeSceneAssetRole(this.value);
            const previousRole = vrodosGetEffectiveObjectCategory(selectedObject);
            if (!nextRole || nextRole === previousRole) {
                return;
            }

            if (nextRole === 'walkable-surface' && typeof VRODOS.utils.initializeWalkableBehaviorForRoleChange === 'function') {
                VRODOS.utils.initializeWalkableBehaviorForRoleChange(selectedObject);
            }

            const override = typeof VRODOS.utils.sceneAssetRoleOverrideFor === 'function'
                ? VRODOS.utils.sceneAssetRoleOverrideFor(selectedObject, nextRole)
                : nextRole;
            vrodosCommitObjectControlsProperty('sceneAssetRole', override || undefined);
            refreshSceneAssetRolePresentation(selectedObject);
        });
    }

    return section;
}

function displaySceneAssetRoleProperties(object) {
    const section = ensureSceneAssetRolePropertiesSection();
    if (!section || !object) return;

    const select = document.getElementById('sceneAssetRoleSelect');
    if (select) {
        select.value = vrodosGetEffectiveObjectCategory(object);
    }

    section.style.display = 'block';
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

            if (vrodosGetEffectiveObjectCategory(selectedObject) !== 'walkable-surface') {
                return;
            }

            const nextBehavior = vrodosNormalizeWalkableBehavior(select.value);
            vrodosCommitObjectControlsProperty('walkableBehavior', nextBehavior);
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

let vrodosCollisionPreview = null;

VRODOS.ui.clearCollisionPreview = function () {
    if (!vrodosCollisionPreview) return;
    vrodosCollisionPreview.removeFromParent();
    vrodosCollisionPreview.geometry.dispose();
    vrodosCollisionPreview.material.dispose();
    vrodosCollisionPreview = null;
};

function showCollisionPreview(object) {
    VRODOS.ui.clearCollisionPreview();
    const bounds = object && object.vrodosCollisionBounds;
    if (!bounds || !VRODOS.utils.normalizeCompiledCollisionEnabled(object.compiledCollisionEnabled, object)) return;
    const center = object.vrodosAssetOriginMode === 'bounds-center' ? [0, 0, 0] : bounds.center;
    const geometry = new THREE.BoxGeometry(...bounds.min.map((min, i) => Math.max(0.001, bounds.max[i] - min)));
    const edges = new THREE.EdgesGeometry(geometry);
    geometry.dispose();
    vrodosCollisionPreview = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x22d3ee, depthTest: false }));
    vrodosCollisionPreview.position.fromArray(center);
    vrodosCollisionPreview.raycast = () => undefined;
    vrodosCollisionPreview.renderOrder = 1000;
    vrodosCollisionPreview.userData.editorOnly = true;
    object.add(vrodosCollisionPreview);
}

function ensureCollisionPropertiesSection() {
    const container = getObjectControlsElement('propertiesContainer');
    if (!container) return null;

    let section = document.getElementById('compiledCollisionPropertiesDiv');
    if (section) {
        return section;
    }

    section = document.createElement('div');
    section.id = 'compiledCollisionPropertiesDiv';
    section.className = 'object-property-section';
    section.style.display = 'none';
    section.innerHTML =
        '<div class="prop-section-title" style="padding-bottom:2px; margin-bottom:2px;">Player Collision</div>' +
        '<div class="tw-flex tw-flex-col tw-gap-2 tw-px-3 tw-pb-3" style="padding-top:2px;">' +
        '<label class="tw-flex tw-items-center tw-gap-2 tw-text-[11px] tw-font-semibold tw-text-slate-200">' +
        '<input type="checkbox" id="compiledCollisionEnabledCheckbox" class="tw-checkbox tw-checkbox-xs tw-checkbox-primary">' +
        '<span id="compiledCollisionLabel">Collides with player</span>' +
        '</label>' +
        '<div class="tw-text-[10px] tw-leading-relaxed tw-text-slate-400">Only enabled objects are compiled into the player collision world.</div>' +
        '<div id="decorationCollisionDetails"><button type="button" id="inspectDecorationCollider" class="tw-btn tw-btn-xs">Inspect box</button>' +
        '<div class="tw-text-[10px] tw-leading-relaxed tw-text-slate-400">The box blocks empty space inside the asset bounds, including arch openings and concave recesses.</div></div>' +
        '</div>';

    container.appendChild(section);

    const checkbox = document.getElementById('compiledCollisionEnabledCheckbox');
    if (checkbox) {
        checkbox.addEventListener('change', function () {
            VRODOS.ui.clearCollisionPreview();
            vrodosCommitObjectControlsProperty('compiledCollisionEnabled', Boolean(this.checked));
        });
    }

    document.getElementById('inspectDecorationCollider').addEventListener('click', () => {
        if (vrodosCollisionPreview) VRODOS.ui.clearCollisionPreview();
        else showCollisionPreview(getObjectControlsTargetObject());
    });

    return section;
}

function displayCollisionProperties(object) {
    VRODOS.ui.clearCollisionPreview();
    const section = ensureCollisionPropertiesSection();
    if (!section || !object) return;

    const checkbox = document.getElementById('compiledCollisionEnabledCheckbox');
    const enabled = VRODOS.utils.normalizeCompiledCollisionEnabled(object.compiledCollisionEnabled, object);
    const decoration = VRODOS.utils.resolveSceneAssetCategory(object) === 'decoration' && object.category_slug !== 'primitive-plane';
    document.getElementById('compiledCollisionLabel').textContent = decoration ? 'Automatic box collision' : 'Collides with player';
    document.getElementById('decorationCollisionDetails').style.display = decoration ? 'block' : 'none';
    document.getElementById('inspectDecorationCollider').disabled = !enabled || !object.vrodosCollisionBounds;
    object.compiledCollisionEnabled = enabled;
    if (!object.userData) {
        object.userData = {};
    }
    object.userData.compiledCollisionEnabled = enabled;

    if (checkbox) {
        checkbox.checked = enabled;
    }

    section.style.display = 'block';
}

function ensureShadowRolePropertiesSection() {
    const container = getObjectControlsElement('propertiesContainer');
    if (!container) return null;

    let section = document.getElementById('shadowRolePropertiesDiv');
    if (section) {
        return section;
    }

    section = document.createElement('div');
    section.id = 'shadowRolePropertiesDiv';
    section.className = 'object-property-section';
    section.style.display = 'none';
    section.innerHTML =
        '<div class="prop-section-title" style="padding-bottom:2px; margin-bottom:2px;">Lighting</div>' +
        '<div class="tw-flex tw-flex-col tw-gap-2 tw-px-3 tw-pb-3" style="padding-top:2px;">' +
        '<label for="shadowRoleSelect" class="tw-text-[11px] tw-font-semibold tw-text-slate-200">Shadow Role</label>' +
        '<select id="shadowRoleSelect" class="tw-select tw-select-sm tw-w-full tw-bg-slate-900/70 tw-border-white/10 tw-text-slate-100">' +
        '<option value="auto">Auto</option>' +
        '<option value="caster-receiver">Cast and Receive</option>' +
        '<option value="receiver">Receive Only</option>' +
        '<option value="none">No Shadows</option>' +
        '</select>' +
        '<div class="tw-text-[10px] tw-leading-relaxed tw-text-slate-400">Use Cast and Receive for visible terrain that should self-shadow. Use Receive Only for flat floors and No Shadows for effects or helper visuals.</div>' +
        '</div>';

    container.appendChild(section);

    const select = document.getElementById('shadowRoleSelect');
    if (select) {
        select.addEventListener('change', function () {
            vrodosCommitObjectControlsProperty('vrodosShadowRole', vrodosNormalizeObjectShadowRole(this.value));
        });
    }

    return section;
}

function displayShadowRoleProperties(object) {
    const section = ensureShadowRolePropertiesSection();
    if (!section || !object) return;

    const select = document.getElementById('shadowRoleSelect');
    const role = vrodosNormalizeObjectShadowRole(object.vrodosShadowRole || object.shadowRole);
    object.vrodosShadowRole = role;
    if (!object.userData) {
        object.userData = {};
    }
    object.userData.vrodosShadowRole = role;

    if (select) {
        select.value = role;
    }

    section.style.display = 'block';
}

function ensureMaterialRolePropertiesSection() {
    const container = getObjectControlsElement('propertiesContainer');
    if (!container) return null;

    let section = document.getElementById('materialRolePropertiesDiv');
    if (section) {
        return section;
    }

    section = document.createElement('div');
    section.id = 'materialRolePropertiesDiv';
    section.className = 'object-property-section';
    section.style.display = 'none';
    section.innerHTML =
        '<div class="prop-section-title" style="padding-bottom:2px; margin-bottom:2px;">Material</div>' +
        '<div class="tw-flex tw-flex-col tw-gap-2 tw-px-3 tw-pb-3" style="padding-top:2px;">' +
        '<label for="materialRoleSelect" class="tw-text-[11px] tw-font-semibold tw-text-slate-200">Material Role</label>' +
        '<select id="materialRoleSelect" class="tw-select tw-select-sm tw-w-full tw-bg-slate-900/70 tw-border-white/10 tw-text-slate-100">' +
        '<option value="auto">Auto</option>' +
        '<option value="terrain-matte">Terrain Matte</option>' +
        '<option value="authored-pbr">Authored PBR</option>' +
        '<option value="wet-glossy">Wet / Glossy</option>' +
        '</select>' +
        '<div class="tw-text-[10px] tw-leading-relaxed tw-text-slate-400">Use Terrain Matte for rocky/photogrammetry terrain. Use Authored PBR or Wet / Glossy when shine is intentional.</div>' +
        '</div>';

    container.appendChild(section);

    const select = document.getElementById('materialRoleSelect');
    if (select) {
        select.addEventListener('change', function () {
            vrodosCommitObjectControlsProperty('vrodosMaterialRole', vrodosNormalizeObjectMaterialRole(this.value));
        });
    }

    return section;
}

function displayMaterialRoleProperties(object) {
    const section = ensureMaterialRolePropertiesSection();
    if (!section || !object) return;

    const select = document.getElementById('materialRoleSelect');
    const role = vrodosNormalizeObjectMaterialRole(object.vrodosMaterialRole || object.materialRole);
    object.vrodosMaterialRole = role;
    if (!object.userData) {
        object.userData = {};
    }
    object.userData.vrodosMaterialRole = role;

    if (select) {
        select.value = role;
    }

    section.style.display = 'block';
}

function ensurePrimitivePlanePropertiesSection() {
    const container = getObjectControlsElement('propertiesContainer');
    if (!container) return null;

    let section = document.getElementById('primitivePlanePropertiesDiv');
    if (section) return section;

    section = document.createElement('div');
    section.id = 'primitivePlanePropertiesDiv';
    section.className = 'object-property-section';
    section.style.display = 'none';
    const textureRows = Object.entries(VRODOS_PLANE_TEXTURE_SLOT_PROPERTIES).map(([slot, definition]) => (
        '<div class="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-rounded-md tw-border tw-border-white/10 tw-bg-slate-900/30 tw-px-2 tw-py-1.5">' +
        '<div class="tw-min-w-0 tw-flex-1">' +
        `<div class="tw-truncate tw-text-[10px] tw-font-semibold tw-text-slate-300" title="${definition.label}">${definition.label}</div>` +
        `<span data-plane-texture-status="${slot}" class="tw-block tw-text-[9px] tw-text-slate-400"></span>` +
        '</div>' +
        '<div class="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1">' +
        `<input id="planeTexture_${slot}" data-plane-texture-input="${slot}" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" class="tw-hidden">` +
        `<button type="button" data-plane-texture-upload="${slot}" class="tw-btn tw-btn-outline tw-btn-xs tw-min-w-[64px]" title="Upload ${definition.label} map">Upload</button>` +
        `<button type="button" data-plane-texture-remove="${slot}" class="tw-btn tw-btn-ghost tw-btn-xs tw-px-1.5" title="Remove ${definition.label} map">Clear</button>` +
        '</div>' +
        '</div>'
    )).join('');
    section.innerHTML = `
        <div class="prop-section-title">Plane Surface</div>
        <div class="tw-flex tw-flex-col tw-gap-2 tw-px-3 tw-pb-3">
            <input id="planeSurfacePackageInput" type="file" accept=".zip,application/zip" class="tw-hidden">
            <button id="planeSurfacePackageButton" type="button" class="tw-btn tw-btn-primary tw-btn-sm tw-w-full">Import PBR ZIP</button>
            <div id="planeSurfacePackageProgressWrap" class="tw-hidden tw-w-full tw-overflow-hidden tw-rounded tw-bg-slate-800" aria-hidden="true">
                <div id="planeSurfacePackageProgress" role="progressbar" aria-label="PBR ZIP upload progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" class="tw-h-1.5 tw-bg-sky-400" style="width:0%"></div>
            </div>
            <div id="planeSurfacePackageSummary" role="status" aria-live="polite" class="tw-text-[9px] tw-leading-relaxed tw-text-slate-300"></div>
            <div class="tw-grid tw-grid-cols-2 tw-gap-2">
                <label class="tw-text-[10px] tw-text-slate-300">Width (m)<input id="planeWidthInput" type="number" min="0.1" max="10000" step="0.1" class="tw-input tw-input-xs tw-w-full tw-bg-slate-900/70"></label>
                <label class="tw-text-[10px] tw-text-slate-300">Depth (m)<input id="planeDepthInput" type="number" min="0.1" max="10000" step="0.1" class="tw-input tw-input-xs tw-w-full tw-bg-slate-900/70"></label>
                <label class="tw-text-[10px] tw-text-slate-300">Base color<input id="planeSurfaceColorInput" type="color" class="tw-input tw-input-xs tw-w-full tw-bg-slate-900/70"></label>
                <label class="tw-text-[10px] tw-text-slate-300">Tile size (m)<input id="planeTileSizeInput" type="number" min="0.01" max="10000" step="0.1" class="tw-input tw-input-xs tw-w-full tw-bg-slate-900/70"></label>
                <label class="tw-text-[10px] tw-text-slate-300">Roughness<input id="planeRoughnessInput" type="number" min="0" max="1" step="0.05" class="tw-input tw-input-xs tw-w-full tw-bg-slate-900/70"></label>
                <label class="tw-text-[10px] tw-text-slate-300">Metalness<input id="planeMetalnessInput" type="number" min="0" max="1" step="0.05" class="tw-input tw-input-xs tw-w-full tw-bg-slate-900/70"></label>
                <label class="tw-text-[10px] tw-text-slate-300">Normal strength<input id="planeNormalScaleInput" type="number" min="0" max="2" step="0.05" class="tw-input tw-input-xs tw-w-full tw-bg-slate-900/70"></label>
                <label class="tw-text-[10px] tw-text-slate-300">AO intensity<input id="planeAoIntensityInput" type="number" min="0" max="2" step="0.05" class="tw-input tw-input-xs tw-w-full tw-bg-slate-900/70"></label>
            </div>
            <label class="tw-flex tw-items-center tw-gap-2 tw-rounded-md tw-border tw-border-white/10 tw-bg-slate-900/30 tw-px-2 tw-py-2 tw-text-[10px] tw-font-semibold tw-text-slate-200">
                <input id="planeAntiTilingInput" type="checkbox" class="tw-checkbox tw-checkbox-xs tw-checkbox-primary">
                <span>Break up repetition</span>
            </label>
            <div class="tw-grid tw-grid-cols-2 tw-gap-2">
                <label class="tw-text-[10px] tw-text-slate-300">Patch size (tiles)<input id="planePatchTilesInput" type="number" min="0.5" max="4" step="0.05" class="tw-input tw-input-xs tw-w-full tw-bg-slate-900/70"></label>
                <label class="tw-text-[10px] tw-text-slate-300">Blend sharpness<input id="planeBlendSharpnessInput" type="number" min="1" max="12" step="0.5" class="tw-input tw-input-xs tw-w-full tw-bg-slate-900/70"></label>
            </div>
            <div class="tw-mt-1 tw-flex tw-flex-col tw-gap-2">${textureRows}</div>
            <div class="tw-text-[9px] tw-leading-relaxed tw-text-slate-400">Use seamless OpenGL PBR maps. Stochastic tiling blends three seeded samples across the full PBR surface while preserving physical tile size. ZIP import keeps the current tile size. Recommended: 1K; maximum: 2K.</div>
        </div>`;
    container.appendChild(section);

    const numericBindings = [
        ['planeWidthInput', 'planeWidth', 100, 0.1, 10000],
        ['planeDepthInput', 'planeDepth', 100, 0.1, 10000],
        ['planeTileSizeInput', 'surfaceTileSizeMeters', 2, 0.01, 10000],
        ['planeRoughnessInput', 'surfaceRoughness', 1, 0, 1],
        ['planeMetalnessInput', 'surfaceMetalness', 0, 0, 1],
        ['planeNormalScaleInput', 'surfaceNormalScale', 1, 0, 2],
        ['planeAoIntensityInput', 'surfaceAoIntensity', 1, 0, 2],
        ['planePatchTilesInput', 'surfaceAntiTilingPatchTiles', 1.25, 0.5, 4],
        ['planeBlendSharpnessInput', 'surfaceAntiTilingBlendSharpness', 4, 1, 12]
    ];
    numericBindings.forEach(([id, property, fallback, minimum, maximum]) => {
        document.getElementById(id)?.addEventListener('change', function() {
            const value = vrodosPlaneNumericValue(this.value, fallback, minimum, maximum);
            this.value = value;
            vrodosCommitObjectControlsProperty(property, value);
        });
    });
    document.getElementById('planeSurfaceColorInput')?.addEventListener('change', function() {
        vrodosCommitObjectControlsProperty('surfaceColor', this.value);
    });
    document.getElementById('planeAntiTilingInput')?.addEventListener('change', function() {
        vrodosCommitObjectControlsProperty('surfaceAntiTilingEnabled', this.checked);
    });

    document.getElementById('planeSurfacePackageButton')?.addEventListener('click', () => {
        document.getElementById('planeSurfacePackageInput')?.click();
    });
    document.getElementById('planeSurfacePackageInput')?.addEventListener('change', async function() {
        const file = this.files && this.files[0];
        const object = getObjectControlsTargetObject();
        const button = document.getElementById('planeSurfacePackageButton');
        const progressWrap = document.getElementById('planeSurfacePackageProgressWrap');
        const progress = document.getElementById('planeSurfacePackageProgress');
        const summary = document.getElementById('planeSurfacePackageSummary');
        if (!file || !object || object.category_slug !== 'primitive-plane') return;
        if (file.size > 128 * 1024 * 1024) {
            const message = 'PBR ZIP packages must be 128 MiB or smaller.';
            if (summary) summary.textContent = message;
            window.alert(message);
            this.value = '';
            return;
        }
        if (button) {
            button.disabled = true;
            button.textContent = 'Uploading…';
        }
        if (progressWrap) {
            progressWrap.classList.remove('tw-hidden');
            progressWrap.setAttribute('aria-hidden', 'false');
        }
        if (summary) summary.textContent = 'Uploading package…';
        try {
            const oldState = vrodosPlaneSurfaceMaterialState(object);
            const imported = await VRODOS.api.uploadSurfaceMaterialPackage(file, (percent) => {
                if (progress) {
                    progress.style.width = `${percent}%`;
                    progress.setAttribute('aria-valuenow', String(percent));
                }
                if (summary) summary.textContent = percent < 100 ? `Uploading package… ${percent}%` : 'Detecting and validating maps…';
            });
            await vrodosSavePlaneSurfaceMaterialPackage(object, oldState, imported);
            const detected = Object.keys(imported.maps || {}).map((slot) => VRODOS_PLANE_TEXTURE_SLOT_PROPERTIES[slot]?.label || slot);
            const ignoredCount = Array.isArray(imported.ignoredFiles) ? imported.ignoredFiles.length : 0;
            const warning = Array.isArray(imported.warnings) && imported.warnings[0] ? ` ${imported.warnings[0]}` : '';
            if (summary) {
                summary.dataset.planeUuid = object.uuid;
                summary.textContent = `Detected: ${detected.join(', ')}.${ignoredCount ? ` Ignored ${ignoredCount} unrelated/alternate file${ignoredCount === 1 ? '' : 's'}.` : ''}${warning}`;
            }
            displayPrimitivePlaneProperties(object);
        } catch (error) {
            if (summary) summary.textContent = `Import failed: ${error.message || 'Unknown error.'}`;
            window.alert(error.message || 'PBR ZIP import failed.');
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = 'Import PBR ZIP';
            }
            if (progressWrap) {
                progressWrap.classList.add('tw-hidden');
                progressWrap.setAttribute('aria-hidden', 'true');
            }
            if (progress) {
                progress.style.width = '0%';
                progress.setAttribute('aria-valuenow', '0');
            }
            this.value = '';
        }
    });

    section.querySelectorAll('[data-plane-texture-upload]').forEach((button) => {
        button.addEventListener('click', function() {
            document.getElementById(`planeTexture_${this.dataset.planeTextureUpload}`)?.click();
        });
    });

    section.querySelectorAll('[data-plane-texture-input]').forEach((input) => {
        input.addEventListener('change', async function() {
            const file = this.files && this.files[0];
            const slot = this.dataset.planeTextureInput;
            const object = getObjectControlsTargetObject();
            const status = section.querySelector(`[data-plane-texture-status="${slot}"]`);
            if (!file || !object || object.category_slug !== 'primitive-plane') return;
            if (status) status.textContent = 'Uploading…';
            try {
                const oldState = vrodosPlaneTextureState(object, slot);
                const uploaded = await VRODOS.api.uploadSurfaceTexture(file, slot);
                await vrodosSavePlaneTextureChange(object, slot, oldState, {
                    attachmentId: uploaded.attachmentId,
                    url: uploaded.url,
                    ...(slot === 'normal' ? { normalYSign: 1 } : {})
                });
                displayPrimitivePlaneProperties(object);
            } catch (error) {
                if (status) status.textContent = 'Failed';
                window.alert(error.message || 'Texture upload failed.');
            } finally {
                this.value = '';
            }
        });
    });
    section.querySelectorAll('[data-plane-texture-remove]').forEach((button) => {
        button.addEventListener('click', async function() {
            const slot = this.dataset.planeTextureRemove;
            const object = getObjectControlsTargetObject();
            if (!object || object.category_slug !== 'primitive-plane') return;
            const oldState = vrodosPlaneTextureState(object, slot);
            if (!oldState.attachmentId && !oldState.url) return;
            try {
                await vrodosSavePlaneTextureChange(object, slot, oldState, {
                    attachmentId: 0,
                    url: '',
                    ...(slot === 'normal' ? { normalYSign: 1 } : {})
                });
                displayPrimitivePlaneProperties(object);
            } catch (error) {
                window.alert(error.message || 'Could not remove the texture.');
            }
        });
    });
    return section;
}

function displayPrimitivePlaneProperties(object) {
    const section = ensurePrimitivePlanePropertiesSection();
    if (!section || !object) return;
    const values = {
        planeWidthInput: object.planeWidth,
        planeDepthInput: object.planeDepth,
        planeSurfaceColorInput: object.surfaceColor || '#ffffff',
        planeTileSizeInput: object.surfaceTileSizeMeters,
        planeRoughnessInput: object.surfaceRoughness,
        planeMetalnessInput: object.surfaceMetalness,
        planeNormalScaleInput: object.surfaceNormalScale,
        planeAoIntensityInput: object.surfaceAoIntensity,
        planePatchTilesInput: object.surfaceAntiTilingPatchTiles ?? 1.25,
        planeBlendSharpnessInput: object.surfaceAntiTilingBlendSharpness ?? 4
    };
    Object.entries(values).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) input.value = value;
    });
    const antiTiling = document.getElementById('planeAntiTilingInput');
    if (antiTiling) antiTiling.checked = ![false, 0, '0', 'false'].includes(object.surfaceAntiTilingEnabled);
    const packageSummary = document.getElementById('planeSurfacePackageSummary');
    if (packageSummary?.dataset.planeUuid && packageSummary.dataset.planeUuid !== object.uuid) {
        packageSummary.textContent = '';
        delete packageSummary.dataset.planeUuid;
    }
    Object.entries(VRODOS_PLANE_TEXTURE_SLOT_PROPERTIES).forEach(([slot, definition]) => {
        const hasTexture = Number(object[definition.attachment]) > 0 || Boolean(object[definition.url]);
        const status = section.querySelector(`[data-plane-texture-status="${slot}"]`);
        const upload = section.querySelector(`[data-plane-texture-upload="${slot}"]`);
        const remove = section.querySelector(`[data-plane-texture-remove="${slot}"]`);
        if (status) {
            if (hasTexture && definition.authoringOnly) status.textContent = 'Imported — not rendered';
            else if (hasTexture && slot === 'normal' && Number(object.surfaceNormalYSign) < 0) status.textContent = 'Assigned — DirectX Y corrected';
            else status.textContent = hasTexture ? 'Assigned' : 'No map assigned';
        }
        if (upload) upload.textContent = hasTexture ? 'Replace' : 'Upload';
        if (remove) remove.disabled = !hasTexture;
    });
    section.style.display = 'block';
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
