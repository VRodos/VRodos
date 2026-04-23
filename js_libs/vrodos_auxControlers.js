
// ─── Cel-shaded selection outline (back-face hull) ───

const CEL_OUTLINE_TAG = '__cel_outline__';
const CEL_OUTLINE_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
});

/**
 * Add a cel-shaded outline to the selected object.
 * Works by cloning each mesh with BackSide rendering, slightly scaled up.
 */
function addCelOutline(object) {
    if (!object) return;
    removeCelOutline(object);

    object.traverse((child) => {
        if (child.isMesh && child.name !== CEL_OUTLINE_TAG) {
            const outline = new THREE.Mesh(child.geometry, CEL_OUTLINE_MATERIAL);
            outline.name = CEL_OUTLINE_TAG;
            outline.scale.setScalar(1.04);
            outline.raycast = function () { }; // invisible to raycasting
            outline.frustumCulled = false;
            child.add(outline);
            if (typeof envir !== 'undefined' && envir.celOutlineMeshes) {
                envir.celOutlineMeshes.add(outline);
            }
        }
    });
}

/**
 * Remove cel-shaded outline from an object.
 */
function removeCelOutline(object) {
    if (!object) return;
    const toRemove = [];
    object.traverse((child) => {
        if (child.name === CEL_OUTLINE_TAG) toRemove.push(child);
    });
    toRemove.forEach((mesh) => {
        if (mesh.parent) mesh.parent.remove(mesh);
        if (typeof envir !== 'undefined' && envir.celOutlineMeshes) {
            envir.celOutlineMeshes.delete(mesh);
        }
    });
}

/**
 * Remove all cel outlines from the entire scene.
 */
function removeAllCelOutlines() {
    if (typeof envir === 'undefined' || !envir.scene) return;
    if (envir.celOutlineMeshes && envir.celOutlineMeshes.size > 0) {
        // Fast path: use the cache — no scene traverse needed
        for (const mesh of envir.celOutlineMeshes) {
            if (mesh.parent) mesh.parent.remove(mesh);
        }
        envir.celOutlineMeshes.clear();
        return;
    }
    // Fallback: cache not yet initialised (first call before envir is ready)
    const toRemove = [];
    envir.scene.traverse((child) => {
        if (child.name === CEL_OUTLINE_TAG) toRemove.push(child);
    });
    toRemove.forEach((mesh) => {
        if (mesh.parent) mesh.parent.remove(mesh);
    });
}

// ─── Floating Object Controls Panel helpers ───

/**
 * Show the floating Object Controls panel.
 * Positioned 100px to the right of the last mouse click,
 * clamped so it stays within the viewport.
 *
 * @param {string} [objectName] - Title shown in the panel header
 */
function showObjectControlsPanel(objectName) {
    const panel = document.getElementById('object-controls-panel');
    if (!panel) return;

    panel.classList.remove('tw-hidden');
    document.getElementById('object-manipulation-toggle').style.display = '';
    document.getElementById('axis-manipulation-buttons').style.display = '';

    if (objectName) {
        const title = document.getElementById('object-controls-title');
        if (title) title.textContent = objectName;
    }

    // Position 100px to the right of last click, clamped to viewport
    let panelW = panel.offsetWidth || 280;
    let panelH = panel.offsetHeight || 300;
    let mx = _lastClickX || (window.innerWidth / 2);
    let my = _lastClickY || (window.innerHeight / 2);

    let left = mx + 100;
    let top = my - panelH / 2;

    // If it would go off the right edge, place it to the left of the cursor instead
    if (left + panelW > window.innerWidth - 8) {
        left = mx - 100 - panelW;
    }
    // Final clamp
    left = Math.max(8, Math.min(left, window.innerWidth - panelW - 8));
    top = Math.max(40, Math.min(top, window.innerHeight - panelH - 8));

    panel.style.left = Math.round(left) + 'px';
    panel.style.top = Math.round(top) + 'px';
    panel.style.right = 'auto';
}

// Track last click position (updated by the canvas mousedown handler)
let _lastClickX = 0;
let _lastClickY = 0;

function hideObjectControlsPanel() {
    const panel = document.getElementById('object-controls-panel');
    if (panel) panel.classList.add('tw-hidden');
    updateObjectControlsMeta(null);
    hideAllPropertyPanels();
}

function humanizeObjectTypeLabel(typeValue) {
    if (!typeValue) return '';

    let aliases = {
        'walkable-surface': 'Walkable Surface',
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
        .replace(/\b\w/g, function (char) { return char.toUpperCase(); });
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
    let badge = document.getElementById('object-controls-badge');
    if (!badge) return;

    if (!object) {
        badge.classList.add('tw-hidden');
        badge.textContent = 'Object Type';
        badge.classList.remove('tw-bg-emerald-500/15', 'tw-text-emerald-300', 'tw-border-emerald-400/20');
        badge.classList.add('tw-bg-slate-500/15', 'tw-text-slate-200', 'tw-border-white/10');
        return;
    }

    let typeLabel = getObjectTypeLabel(object);
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
    let container = document.getElementById('object-properties-container');
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

    let rawValue = object.assessment_type || object.assessment_group || '';
    if (typeof vrodosDecodeDisplayText === 'function') {
        return vrodosDecodeDisplayText(rawValue).trim();
    }

    return String(rawValue || '').trim();
}

function getAssessmentLevelsList(object) {
    if (!object) return [];

    if (typeof vrodosResolvedAssessmentLevels === 'function') {
        return vrodosResolvedAssessmentLevels(object.assessment_levels || '');
    }

    return [];
}

function displayAssessmentProperties(object) {
    let section = ensureAssessmentPropertiesSection();
    if (!section || !object) return;

    let typeValue = document.getElementById('assessmentTypeValue');
    let levelsValue = document.getElementById('assessmentLevelsValue');
    let assessmentType = getAssessmentTypeLabel(object) || 'Assessment';
    let assessmentLevels = getAssessmentLevelsList(object);

    if (typeValue) {
        typeValue.textContent = assessmentType;
    }

    if (levelsValue) {
        levelsValue.innerHTML = '';

        assessmentLevels.forEach(function (level) {
            let pill = document.createElement('span');
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
    let container = document.getElementById('object-properties-container');
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

    let select = document.getElementById('walkableBehaviorSelect');
    if (select) {
        select.addEventListener('change', function () {
            if (!transform_controls || !transform_controls.object) return;

            let selectedObject = transform_controls.object;
            if (String(selectedObject.category_slug || '').toLowerCase() !== 'walkable-surface') {
                return;
            }

            let nextBehavior = vrodosNormalizeWalkableBehavior(select.value);
            if (selectedObject.walkableBehavior === nextBehavior) {
                return;
            }

            selectedObject.walkableBehavior = nextBehavior;
            if (!selectedObject.userData) {
                selectedObject.userData = {};
            }
            selectedObject.userData.walkableBehavior = nextBehavior;

            if (typeof envir !== 'undefined' && envir.scene) {
                envir.scene.dispatchEvent({ type: 'modificationPendingSave' });
            }
        });
    }

    return section;
}

function displayWalkableSurfaceProperties(object) {
    let section = ensureWalkableSurfacePropertiesSection();
    if (!section || !object) return;

    let select = document.getElementById('walkableBehaviorSelect');
    let currentBehavior = vrodosNormalizeWalkableBehavior(object.walkableBehavior);
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
    if (typeof vrodosGetPopupTargetObject === 'function') {
        return vrodosGetPopupTargetObject();
    }

    if (typeof _currentSelectedRealObject !== 'undefined' && _currentSelectedRealObject) {
        return _currentSelectedRealObject;
    }

    if (typeof transform_controls === 'undefined' || !transform_controls.object) {
        return null;
    }

    if (transform_controls.object.name === 'vrodosGizmoProxy' && transform_controls.object.realObject) {
        return transform_controls.object.realObject;
    }

    return transform_controls.object;
}

function vrodosNormalizeAudioPlaybackMode(value) {
    return String(value || '').toLowerCase() === 'autoplay' ? 'autoplay' : 'interact';
}

function vrodosNormalizeAudioLoopValue(value) {
    let normalized = String(value ?? '').toLowerCase();
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
    let targetObject = getObjectControlsTargetObject();
    if (!targetObject) return;

    let previousValue = targetObject[prop];
    let previousComparable = previousValue == null ? '' : String(previousValue);
    let nextComparable = nextValue == null ? '' : String(nextValue);

    if (previousComparable === nextComparable) {
        return;
    }

    targetObject[prop] = nextValue;
    if (!targetObject.userData) {
        targetObject.userData = {};
    }
    targetObject.userData[prop] = nextValue;

    if (typeof vrodosUndoManager !== 'undefined' && !vrodosUndoManager.isExecuting) {
        vrodosUndoManager.add(new PropertyCommand(targetObject, prop, previousValue, nextValue));
    }

    if (typeof saveChanges === 'function') {
        saveChanges();
    } else if (typeof envir !== 'undefined' && envir.scene) {
        envir.scene.dispatchEvent({ type: 'modificationPendingSave' });
    }
}

function ensureAudioPropertiesSection() {
    let container = document.getElementById('object-properties-container');
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

    let playbackModeSelect = document.getElementById('audioPlaybackModeSelect');
    let loopCheckbox = document.getElementById('audioLoopCheckbox');
    let volumeInput = document.getElementById('audioVolumeInput');
    let refDistanceInput = document.getElementById('audioRefDistanceInput');
    let maxDistanceInput = document.getElementById('audioMaxDistanceInput');
    let rolloffFactorInput = document.getElementById('audioRolloffFactorInput');

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
            let normalized = vrodosNormalizeAudioNumericValue(this.value, 1, 0, 1);
            this.value = normalized;
            vrodosCommitObjectControlsProperty('audio_volume', normalized);
        });
    }

    if (refDistanceInput) {
        refDistanceInput.addEventListener('change', function () {
            let normalized = vrodosNormalizeAudioNumericValue(this.value, 2, 0.1);
            this.value = normalized;
            vrodosCommitObjectControlsProperty('audio_ref_distance', normalized);
        });
    }

    if (maxDistanceInput) {
        maxDistanceInput.addEventListener('change', function () {
            let normalized = vrodosNormalizeAudioNumericValue(this.value, 20, 0.1);
            this.value = normalized;
            vrodosCommitObjectControlsProperty('audio_max_distance', normalized);
        });
    }

    if (rolloffFactorInput) {
        rolloffFactorInput.addEventListener('change', function () {
            let normalized = vrodosNormalizeAudioNumericValue(this.value, 1, 0);
            this.value = normalized;
            vrodosCommitObjectControlsProperty('audio_rolloff_factor', normalized);
        });
    }

    return section;
}

function displayAudioProperties(object) {
    let section = ensureAudioPropertiesSection();
    if (!section || !object) return;

    let playbackModeSelect = document.getElementById('audioPlaybackModeSelect');
    let loopCheckbox = document.getElementById('audioLoopCheckbox');
    let volumeInput = document.getElementById('audioVolumeInput');
    let refDistanceInput = document.getElementById('audioRefDistanceInput');
    let maxDistanceInput = document.getElementById('audioMaxDistanceInput');
    let rolloffFactorInput = document.getElementById('audioRolloffFactorInput');

    let playbackMode = vrodosNormalizeAudioPlaybackMode(object.audio_playback_mode);
    let loopValue = vrodosNormalizeAudioLoopValue(object.audio_loop);
    let volumeValue = vrodosNormalizeAudioNumericValue(object.audio_volume, 1, 0, 1);
    let refDistanceValue = vrodosNormalizeAudioNumericValue(object.audio_ref_distance, 2, 0.1);
    let maxDistanceValue = vrodosNormalizeAudioNumericValue(object.audio_max_distance, 20, 0.1);
    let rolloffFactorValue = vrodosNormalizeAudioNumericValue(object.audio_rolloff_factor, 1, 0);

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
    let container = document.getElementById('object-properties-container');
    if (!container) return;
    container.style.display = 'none';
    let sections = container.querySelectorAll('.object-property-section');
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

    let name = object.name;
    let hasProperties = false;
    console.log("showPropertiesInPanel", name, object.category_slug);

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
        case 'poi-imagetext':
            displayPoiImageTextProperties(null, name);
            hasProperties = true;
            break;
        case 'video':
            displayPoiVideoProperties(null, name);
            hasProperties = true;
            break;
        case 'audio':
            displayAudioProperties(object);
            hasProperties = true;
            break;
        case 'door':
            displayDoorProperties(null, name);
            hasProperties = true;
            break;
        case 'poi-link':
            displayLinkProperties(null, name);
            hasProperties = true;
            break;
        case 'chat':
        case 'poi-chat':
            displayPoiChatProperties(null, name);
            hasProperties = true;
            break;
    }

    // Dispatch by category_name (lights)
    switch (object.category_name) {
        case 'lightSun':
            displaySunProperties(null, name);
            hasProperties = true;
            break;
        case 'lightLamp':
            displayLampProperties(null, name);
            hasProperties = true;
            break;
        case 'lightSpot':
            displaySpotProperties(null, name);
            hasProperties = true;
            break;
        case 'lightAmbient':
            displayAmbientProperties(null, name);
            hasProperties = true;
            break;
    }

    // Show the container only if a property section is active
    if (hasProperties) {
        let container = document.getElementById('object-properties-container');
        if (container) container.style.display = 'block';
    }
}

// Set up drag + close once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('object-controls-panel');
    const header = document.getElementById('object-controls-header');
    const closeBtn = document.getElementById('object-controls-close');

    if (!panel || !header) return;

    // Close button hides the panel
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideObjectControlsPanel();
        });
    }

    // Draggable via header — use delta from initial pointer position
    // Panel is position:fixed, so coordinates are viewport-relative
    let isDragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;

    header.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return; // don't drag on close button
        isDragging = true;

        // For fixed positioning, getBoundingClientRect gives viewport coords directly
        let rect = panel.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        // Convert to left/top positioning (from right)
        panel.style.left = startLeft + 'px';
        panel.style.top = startTop + 'px';
        panel.style.right = 'auto';

        // Remember the starting pointer position
        startX = e.clientX;
        startY = e.clientY;

        header.setPointerCapture(e.pointerId);
        e.preventDefault();
    });

    header.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        panel.style.left = (startLeft + e.clientX - startX) + 'px';
        panel.style.top = (startTop + e.clientY - startY) + 'px';
    });

    header.addEventListener('pointerup', (e) => {
        isDragging = false;
        header.releasePointerCapture(e.pointerId);
    });
});

// GUI controls — lil-gui (successor to dat.gui)
let controlInterface = new lil.GUI({ autoPlace: false });
controlInterface.domElement.style.width = '100%';

// Remove the lil-gui title bar (our floating panel has its own header)
// and prevent collapsing — controls should always be visible
controlInterface.$title.style.display = 'none';
controlInterface.domElement.classList.add('autoHeight');

let coordLabel = ['<span style="color:red">X</span>', '<span style="color:green">Y</span>', '<span style="color:blue">Z</span>'];
let actionLabel = ['translate', 'translate', 'translate', 'rotate', 'rotate', 'rotate', 'scale', 'scale', 'scale'];


let dg_controller = Array();

let gui_controls_funs = (function () {
    // Internal storage — always numeric
    let _vals = { dg_t1: 0, dg_t2: 0, dg_t3: 0, dg_r1: 0, dg_r2: 0, dg_r3: 0, dg_s1: 0, dg_s2: 0, dg_s3: 0 };
    let obj = {};
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
for (let key in gui_controls_funs) {

    let label = actionLabel[i] + " " + coordLabel[i % 3];

    // lil-gui: .add() returns a Controller, .step() and .name() chain the same way
    // .decimals(2) handles display formatting (replaces manual toFixed hacks)
    dg_controller[i] = controlInterface.add(gui_controls_funs, key).step(0.001).decimals(2).name(key);

    // Patch getValue to ALWAYS return a number — lil-gui's updateDisplay calls .toFixed()
    // which crashes on strings/NaN. This is the definitive guard.
    (function (ctrl) {
        let _origGetValue = ctrl.getValue.bind(ctrl);
        ctrl.getValue = function () {
            let v = _origGetValue();
            return (typeof v === 'number' && !isNaN(v)) ? v : 0;
        };
    })(dg_controller[i]);

    // lil-gui escapes HTML in .name(), so set innerHTML directly for colored axis labels
    dg_controller[i].$name.innerHTML = label;

    // Add drag-to-scrub on the input: click+drag horizontally to change value
    _addDragScrub(dg_controller[i]);

    i++;
}

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
        const target = _currentSelectedRealObject || transform_controls.object;
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
            
            animate();
            triggerAutoSave();
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
 *  Add listeners: Update php, javascript and transform_controls when GUI changes
 *  Triggered once initially
 */
function commitUndoTransformFromInput(input) {
    if (typeof vrodosUndoManager === 'undefined' || vrodosUndoManager.isExecuting) return;
    if (!input._oldTRS) return;

    const target = _currentSelectedRealObject || transform_controls.object;
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
        vrodosUndoManager.add(new TransformCommand(target, input._oldTRS, newTRS));
    }
    delete input._oldTRS;
}

function controllerDatGuiOnChange() {


    // onChange fires on every value change (drag scrub + keyboard typing).
    // We only apply to the 3D object during drag (_isDragScrubbing = true).
    // Keyboard typing is committed via onFinishChange (Enter/blur).

    // --- Translation ---
    dg_controller[0].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) target.position.x = value;
    }
    );
    dg_controller[0].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_t1 = value;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) {
            target.position.x = value;
            target.updateMatrix();
            target.updateMatrixWorld();
        }
        animate();
        triggerAutoSave();
    }
    );

    dg_controller[1].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) target.position.y = value;
    }
    );
    dg_controller[1].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_t2 = value;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) {
            target.position.y = value;
            target.updateMatrix();
            target.updateMatrixWorld();
        }
        animate();
        triggerAutoSave();
    }
    );

    dg_controller[2].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) target.position.z = value;
    }
    );
    dg_controller[2].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_t3 = value;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) {
            target.position.z = value;
            target.updateMatrix();
            target.updateMatrixWorld();
        }
        animate();
        triggerAutoSave();
    }
    );

    // --- Rotation ---
    dg_controller[3].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) target.rotation.x = value / 180 * Math.PI;
    }
    );
    dg_controller[3].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_r1 = value;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) {
            target.rotation.x = value / 180 * Math.PI;
            target.updateMatrix();
            target.updateMatrixWorld();
        }
        animate();
        triggerAutoSave();
    }
    );

    dg_controller[4].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) target.rotation.y = value / 180 * Math.PI;
    }
    );
    dg_controller[4].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_r2 = value;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) {
            target.rotation.y = value / 180 * Math.PI;
            target.updateMatrix();
            target.updateMatrixWorld();
        }
        animate();
        triggerAutoSave();
    }
    );

    dg_controller[5].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) target.rotation.z = value / 180 * Math.PI;
    }
    );
    dg_controller[5].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_r3 = value;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) {
            target.rotation.z = value / 180 * Math.PI;
            target.updateMatrix();
            target.updateMatrixWorld();
        }
        animate();
        triggerAutoSave();
    }
    );

    // --- Scale ---
    dg_controller[6].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (!target) return;
        target.scale.x = value;
        if (envir.scene.keepScaleAspectRatio) {
            target.scale.y = value;
            target.scale.z = value;
        }
    }
    );
    dg_controller[6].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_s1 = value;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) {
            target.scale.x = value;
            if (envir.scene.keepScaleAspectRatio) {
                target.scale.y = value;
                target.scale.z = value;
            }
            target.updateMatrix();
            target.updateMatrixWorld();
        }
        animate();
        triggerAutoSave();
    }
    );

    dg_controller[7].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (!target) return;
        target.scale.y = value;
        if (envir.scene.keepScaleAspectRatio) {
            target.scale.x = value;
            target.scale.z = value;
        }
    }
    );
    dg_controller[7].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_s2 = value;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) {
            target.scale.y = value;
            if (envir.scene.keepScaleAspectRatio) {
                target.scale.x = value;
                target.scale.z = value;
            }
            target.updateMatrix();
            target.updateMatrixWorld();
        }
        animate();
        triggerAutoSave();
    }
    );

    dg_controller[8].onChange((value) => {
        if (!_isDragScrubbing) return;
        value = parseFloat(value) || 0;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (!target) return;
        target.scale.z = value;
        if (envir.scene.keepScaleAspectRatio) {
            target.scale.x = value;
            target.scale.y = value;
        }
    }
    );
    dg_controller[8].onFinishChange((value) => {
        value = parseFloat(value) || 0;
        gui_controls_funs.dg_s3 = value;
        const target = _currentSelectedRealObject || transform_controls.object;
        if (target) {
            target.scale.z = value;
            if (envir.scene.keepScaleAspectRatio) {
                target.scale.x = value;
                target.scale.y = value;
            }
            target.updateMatrix();
            target.updateMatrixWorld();
        }
        animate();
        triggerAutoSave();
    }
    );

    // Make slider-text controllers more interactive
    // lil-gui exposes .$input for the input element
    let opCodes = ['Tx', 'Ty', 'Tz', 'Rx', 'Ry', 'Rz', 'Sx', 'Sy', 'Sz'];
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
        if (!transform_controls || !transform_controls.object || !target) return;
        if (transform_controls.object === target) return;
        if (transform_controls.object.realObject !== target) return;

        transform_controls.object.position.copy(target.position);
        transform_controls.object.quaternion.copy(target.quaternion);
        transform_controls.object.scale.copy(target.scale);
        transform_controls.object.updateMatrix();
        transform_controls.object.updateMatrixWorld(true);
    }

    function commitInputValue() {
        const target = _currentSelectedRealObject || transform_controls.object;
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
                if (envir.scene.keepScaleAspectRatio) {
                    gui_controls_funs.dg_s2 = safeValue;
                    target.scale.y = safeValue;
                    gui_controls_funs.dg_s3 = safeValue;
                    target.scale.z = safeValue;
                }
                break;
            case 'Sy':
                gui_controls_funs.dg_s2 = safeValue;
                target.scale.y = safeValue;
                if (envir.scene.keepScaleAspectRatio) {
                    gui_controls_funs.dg_s1 = safeValue;
                    target.scale.x = safeValue;
                    gui_controls_funs.dg_s3 = safeValue;
                    target.scale.z = safeValue;
                }
                break;
            case 'Sz':
                gui_controls_funs.dg_s3 = safeValue;
                target.scale.z = safeValue;
                if (envir.scene.keepScaleAspectRatio) {
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

        if (transform_controls) {
            transform_controls.visible = true;
        }

        controller.updateDisplay();
        animate();
        triggerAutoSave();
    }

    element.addEventListener("focusout", function (event) {
        if (!skipNextFocusoutCommit) {
            commitInputValue();
        } else {
            skipNextFocusoutCommit = false;
        }
        animate();
        triggerAutoSave();
    });

    // onclick inside stop animating
    element.addEventListener("click", function (event) {
        cancelAnimationFrame(id_animation_frame);
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
window.vrodosGizmoProxy = new THREE.Object3D();
window.vrodosGizmoProxy.name = "vrodosGizmoProxy";

// State tracking for proxy-based transformation
window.vrodosRotationSensitivity = 20.0; // Default multiplier for rotation
let _qProxyStart = new THREE.Quaternion();
let _pProxyStart = new THREE.Vector3();
let _qRealStart = new THREE.Quaternion();
let _pRealStart = new THREE.Vector3();
let _currentSelectedRealObject = null;

/**
 *  When you change trs from axes controls then automatically the GUI and the php form are updated
 *
 *  OnTickLevel
 */
function updatePositionsPhpAndJavsFromControlsAxes() {

    if (!transform_controls.object) return;

    // Determine the real object we are actually trying to move
    const realObject = _currentSelectedRealObject;
    if (!realObject) return;

    const isDragging = transform_controls.dragging;
    const activeAxis = transform_controls.axis;

    // --- Proxy Sync Logic ---
    // Safety check: is the object currently attached to TransformControls actually our Proxy?
    const isWorkingOnProxy = transform_controls.object && transform_controls.object.name === "vrodosGizmoProxy";

    if (isDragging) {
        if (transform_controls.mode === 'rotate' && isWorkingOnProxy) {
            // High-Sensitivity Booster Logic (Unclamped for r181)
            // Extract the Axis and Angle of the proxy's change
            const qProxyCurrent = transform_controls.object.quaternion.clone();
            const qDelta = qProxyCurrent.clone().multiply(_qProxyStart.clone().invert());
            
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
            
            realObject.quaternion.copy(_qRealStart).multiply(boostedDelta);
            realObject.updateMatrix();
            realObject.updateMatrixWorld();
        } else {
            // 1:1 Sync for Translation, Scale, or non-proxy fallback
            realObject.position.copy(transform_controls.object.position);
            realObject.scale.copy(transform_controls.object.scale);
            if (!isWorkingOnProxy) {
                realObject.quaternion.copy(transform_controls.object.quaternion);
            }
            realObject.updateMatrix();
            realObject.updateMatrixWorld();
        }
    } else {
        // IDLE STATE: Handles follow asset
        if (isWorkingOnProxy) {
            transform_controls.object.position.copy(realObject.position);
            transform_controls.object.quaternion.copy(realObject.quaternion);
            transform_controls.object.scale.copy(realObject.scale);
            transform_controls.object.updateMatrix();
            transform_controls.object.updateMatrixWorld();
        }
    }

    // Trigger matrix updates during transformations to ensure visual consistency
    if (isDragging && transform_controls.object) {
        transform_controls.object.updateMatrix();
        transform_controls.object.updateMatrixWorld();
    }

    //--------- translate_x ---------------
    if (Math.abs(transform_controls.object.position.x - gui_controls_funs.dg_t1) > 0.0001) {
        const isMaster = !isDragging || (activeAxis && activeAxis.indexOf('X') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_t1 = transform_controls.object.position.x;
            envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    //--------- translate_y ---------------
    if (Math.abs(transform_controls.object.position.y - gui_controls_funs.dg_t2) > 0.0001) {
        const isMaster = !isDragging || (activeAxis && activeAxis.indexOf('Y') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_t2 = transform_controls.object.position.y;
            envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    //--------- translate_z ---------------
    if (Math.abs(transform_controls.object.position.z - gui_controls_funs.dg_t3) > 0.0001) {
        const isMaster = !isDragging || (activeAxis && activeAxis.indexOf('Z') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_t3 = transform_controls.object.position.z;
            envir.scene.dispatchEvent({ type: "modificationPendingSave" });
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
            envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    //---------rotate_y -------------------------------
    const rotYDeg = realObject.rotation.y * 180 / Math.PI;
    if (Math.abs(rotYDeg - gui_controls_funs.dg_r2) > rotEpsilon) {
        const isMaster = !isDragging || (activeAxis && activeAxis.indexOf('Y') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_r2 = rotYDeg;
            envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    //---------rotate_z -------------------------------
    const rotZDeg = realObject.rotation.z * 180 / Math.PI;
    if (Math.abs(rotZDeg - gui_controls_funs.dg_r3) > rotEpsilon) {
        const isMaster = !isDragging || (activeAxis && activeAxis.indexOf('Z') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_r3 = rotZDeg;
            envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    const scaleSyncEpsilon = 0.00001;
    const isScaling = transform_controls.mode === 'scale' && isDragging;
    const sStart = transform_controls._scaleStart;

    //---------scale_x -------------------------------
    if (Math.abs(realObject.scale.x - gui_controls_funs.dg_s1) > scaleSyncEpsilon){
        const isMaster = !isScaling || (activeAxis && activeAxis.indexOf('X') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_s1 = realObject.scale.x;
            if (envir.scene.keepScaleAspectRatio) {
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
            envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    //---------scale_y -------------------------------
    if (Math.abs(realObject.scale.y - gui_controls_funs.dg_s2) > scaleSyncEpsilon){
        const isMaster = !isScaling || (activeAxis && activeAxis.indexOf('Y') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_s2 = realObject.scale.y;
            envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

    //---------scale_z -------------------------------
    if (Math.abs(realObject.scale.z - gui_controls_funs.dg_s3) > scaleSyncEpsilon){
        const isMaster = !isScaling || (activeAxis && activeAxis.indexOf('Z') !== -1);
        if (isMaster) {
            gui_controls_funs.dg_s3 = realObject.scale.z;
            if (envir.scene.keepScaleAspectRatio) {
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
            envir.scene.dispatchEvent({ type: "modificationPendingSave" });
        }
    }

}



/**
 * Centralized Gizmo Attachment: Handles Proxy setup and identity delegation.
 * Use this instead of transform_controls.attach(obj)
 */
function vrodosAttachGizmo(object) {
    if (!object || object.name === "vrodosGizmoProxy") return;

    _currentSelectedRealObject = object;

    if (window.vrodosGizmoProxy) {
        // 1. Ensure proxy is in scene
        if (!envir.scene.getObjectByName("vrodosGizmoProxy")) {
            envir.scene.add(window.vrodosGizmoProxy);
        }

        // 2. Sync Proxy to Object initial state
        window.vrodosGizmoProxy.position.copy(object.position);
        window.vrodosGizmoProxy.quaternion.copy(object.quaternion);
        window.vrodosGizmoProxy.scale.copy(object.scale);

        // 3. Delegate properties for safety checks in other scripts
        window.vrodosGizmoProxy.realObject = object;
        window.vrodosGizmoProxy.category_name = object.category_name;
        window.vrodosGizmoProxy.asset_name = object.asset_name;
        window.vrodosGizmoProxy.isLight = object.isLight;
        window.vrodosGizmoProxy.parentLight = object.parentLight;
        window.vrodosGizmoProxy.locked = object.locked;
        window.vrodosGizmoProxy.name = "vrodosGizmoProxy";

        // 4. Attach handles to proxy
        transform_controls.attach(window.vrodosGizmoProxy);
    } else {
        // Fallback: attach directly to object if proxy failed to init
        transform_controls.attach(object);
    }

    transform_controls.visible = true;
}

function setDatGuiInitialVales(object){

    vrodosAttachGizmo(object);

    if (!transform_controls.object) return;

    gui_controls_funs.dg_t1 = Number(object.position.x) || 0;
    gui_controls_funs.dg_t2 = Number(object.position.y) || 0;
    gui_controls_funs.dg_t3 = Number(object.position.z) || 0;

    gui_controls_funs.dg_r1 = (Number(object.rotation.x) * 180 / Math.PI) || 0;
    gui_controls_funs.dg_r2 = (Number(object.rotation.y) * 180 / Math.PI) || 0;
    gui_controls_funs.dg_r3 = (Number(object.rotation.z) * 180 / Math.PI) || 0;

    gui_controls_funs.dg_s1 = Number(object.scale.x) || 0;
    gui_controls_funs.dg_s2 = Number(object.scale.y) || 0;
    gui_controls_funs.dg_s3 = Number(object.scale.z) || 0;

    // lil-gui: updateDisplay() reads from the bound object and formats with .decimals(2)
    for (let c = 0; c < 9; c++) {
        dg_controller[c].updateDisplay();
    }

    updatePositionsPhpAndJavsFromControlsAxes();
}
