/* global VRODOS_OBJECT_CONTROLS_IDS, displaySharedPropertySections, displayAssessmentProperties, displaySceneAssetRoleProperties, displayWalkableSurfaceProperties, vrodosIsPlayerCollisionEligible, vrodosIsShadowRoleEligible, vrodosIsMaterialRoleEligible, displayCollisionProperties, displayShadowRoleProperties, displayMaterialRoleProperties, displayPrimitivePlaneProperties, displayAudioProperties */
/* exported isObjectControlsPanelOpen, showObjectControlsPanel, refreshSceneAssetRolePresentation */

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
        'primitive-plane': 'Plane',
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

    if (String(object.category_slug || object.category_name || '').toLowerCase() === 'primitive-plane') {
        return 'Plane';
    }

    return humanizeObjectTypeLabel(
        vrodosGetEffectiveObjectCategory(object) || object.asset_type || ''
    );
}

function vrodosGetEffectiveObjectCategory(object) {
    if (!object) return '';

    return typeof VRODOS.utils.resolveSceneAssetCategory === 'function'
        ? VRODOS.utils.resolveSceneAssetCategory(object)
        : String(object.category_slug || object.category_name || '').trim();
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

function hideAllPropertyPanels() {
    const container = getObjectControlsElement('propertiesContainer');
    if (!container) return;
    container.style.display = 'none';
    const sections = container.querySelectorAll('.object-property-section');
    for (let i = 0; i < sections.length; i++) {
        sections[i].style.display = 'none';
    }
}

function showPropertiesInPanel(object) {
    if (!object) return;
    hideAllPropertyPanels();
    updateObjectControlsMeta(object);

    let hasProperties = false;

    if (typeof VRODOS.utils.isSceneAssetRoleEligible === 'function' && VRODOS.utils.isSceneAssetRoleEligible(object)) {
        displaySceneAssetRoleProperties(object);
        hasProperties = true;
    }

    if (String(object.category_slug || object.category_name || '').toLowerCase() === 'primitive-plane') {
        displayPrimitivePlaneProperties(object);
        hasProperties = true;
    }

    switch (vrodosGetEffectiveObjectCategory(object)) {
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

    if (vrodosIsPlayerCollisionEligible(object)) {
        displayCollisionProperties(object);
        hasProperties = true;
    }

    if (vrodosIsShadowRoleEligible(object)) {
        displayShadowRoleProperties(object);
        hasProperties = true;
    }

    if (vrodosIsMaterialRoleEligible(object)) {
        displayMaterialRoleProperties(object);
        hasProperties = true;
    }

    hasProperties = displaySharedPropertySections(null, object) || hasProperties;

    // Show the container only if a property section is active
    if (hasProperties) {
        const container = getObjectControlsElement('propertiesContainer');
        if (container) container.style.display = 'block';
    }
}

function refreshSceneAssetRolePresentation(object) {
    if (!object) return;

    showPropertiesInPanel(object);
    if (typeof VRODOS.ui.updateHierarchyObjectType === 'function') {
        VRODOS.ui.updateHierarchyObjectType(object);
    }
    if (typeof VRODOS.editor.requestRender === 'function') {
        VRODOS.editor.requestRender('scene-asset-role-changed');
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

    // Draggable via header; panel coordinates are viewport-relative.
    VRODOS.ui.bindDraggablePanel(panel, header, {
        ignoreSelector: 'button'
    });
}
