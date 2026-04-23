/**
 *   Reset object in scene
 */
function resetInScene(name) {
    let obj = null;

    if (name === "avatarCamera") {
        if (typeof envir.resetDirectorTransform === 'function') {
            envir.resetDirectorTransform();
        }
        obj = envir.getDirectorObject();
    } else {
        obj = envir.scene.getObjectByName(name);
        if (obj) {
            // [NEW] Capture start state for Undo
            const oldTRS = {
                pos: obj.position.clone(),
                rot: obj.rotation.clone(),
                scale: obj.scale.clone()
            };

            obj.position.set(0, 1.3, 0);
            obj.rotation.set(0, 0, 0);
            obj.scale.set(1, 1, 1);

            // [NEW] Commit command
            if (typeof vrodosUndoManager !== 'undefined' && !vrodosUndoManager.isExecuting) {
                const newTRS = { pos: obj.position.clone(), rot: obj.rotation.clone(), scale: obj.scale.clone() };
                vrodosUndoManager.add(new TransformCommand(obj, oldTRS, newTRS));
            }
        }
    }

    if (obj) {
        // Update transform controls if this object is selected
        if (typeof transform_controls !== 'undefined' && transform_controls.object === obj) {
            if (typeof updatePositionsAndControls === 'function') {
                updatePositionsAndControls();
            }
        }

        // Trigger save
        if (typeof triggerAutoSave === 'function') {
            triggerAutoSave();
        }
    }
}

/**
 * Get the Lucide icon for a scene object.
 * Tries category_slug first (taxonomy assets), then category_name (lights/pawn),
 * using the shared VRODOS_CATEGORY_ICONS map from vrodos_icons.js.
 */
function _hierarchyIconForObject(obj) {
    if (obj.name === 'avatarCamera') return vrodos_getCategoryIcon('director');
    // Prefer category_slug (taxonomy), fall back to category_name (runtime lights/pawn)
    return vrodos_getCategoryIcon(obj.category_slug) !== VRODOS_CATEGORY_ICON_DEFAULT
        ? vrodos_getCategoryIcon(obj.category_slug)
        : vrodos_getCategoryIcon(obj.category_name);
}

/**
 * Friendly label map for light category_name values
 */
const _lightLabelMap = {
    'lightSun':     'Sun',
    'lightLamp':    'Lamp',
    'lightSpot':    'Spot',
    'lightAmbient': 'Ambient',
};

/**
 * Create a friendly display name for hierarchy items.
 * Lights: "Sun 1", "Lamp 2", etc.   Target spots: "Sun 1 — Target"
 * Director stays "Director".  Others keep their asset_name.
 */
function _hierarchyDisplayName(obj) {
    if (obj.name === 'avatarCamera') return 'Director';

    const cat = obj.category_name || '';

    // For lights, count how many of the same type appear *before* this one in traversal order
    if (_lightLabelMap[cat]) {
        let index = 0;
        let found = false;
        envir.scene.traverse((child) => {
            if (found) return;
            if (child.category_name === cat && child.isSelectableMesh) {
                index++;
                if (child === obj) found = true;
            }
        });
        return _lightLabelMap[cat] + ' ' + index;
    }

    if (cat === 'lightTargetSpot') {
        // Derive from the parent light's display name
        const parentName = obj.name.replace('lightTargetSpot_', '');
        let parentObj = envir.scene.getObjectByName(parentName);
        if (parentObj) {
            return _hierarchyDisplayName(parentObj) + ' — Target';
        }
        return 'Light Target';
    }

    if (typeof vrodosDecodeDisplayText === 'function') {
        return vrodosDecodeDisplayText(obj.asset_name || obj.name);
    }

    return obj.asset_name || obj.name;
}

/**
 * Resolve the "added to scene" timestamp for a hierarchy item.
 * Prefer the explicit persisted field, fall back to the legacy timestamp suffix.
 */
function _hierarchyCreatedLabel(obj) {
    if (!obj || obj.name === 'avatarCamera') return '';

    if (obj.category_name === 'lightTargetSpot') {
        let parentName = String(obj.name || '').replace('lightTargetSpot_', '');
        let parentObj = envir.scene.getObjectByName(parentName);
        if (parentObj && parentObj !== obj) {
            return _hierarchyCreatedLabel(parentObj);
        }
    }

    let addedAt = Number(obj.addedAt || 0);
    if ((!Number.isFinite(addedAt) || addedAt <= 0) &&
        typeof vrodos_scene_data !== 'undefined' &&
        vrodos_scene_data.objects &&
        vrodos_scene_data.objects[obj.name]) {
        addedAt = Number(vrodos_scene_data.objects[obj.name].addedAt || 0);
    }

    if (Number.isFinite(addedAt) && addedAt > 0) {
        if (addedAt > 9999999999) {
            addedAt = Math.floor(addedAt / 1000);
        }
        let addedLabel = unixTimestamp_to_time(String(Math.floor(addedAt)));
        return (addedLabel && !addedLabel.includes('NaN')) ? addedLabel : '';
    }

    let name = String(obj.name || '');
    let match = name.match(/(\d{10})$/);
    if (!match) return '';

    let created = unixTimestamp_to_time(match[1]);
    return (created && !created.includes('NaN')) ? created : '';
}

function _hierarchyEscapeHTML(text) {
    return String(text || '')
        .replace(/\&/g, '&amp;')
        .replace(/\</g, '&lt;')
        .replace(/\>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _hierarchyDecodeText(value) {
    let text = typeof value === 'string' ? value : '';
    if (!text) return '';

    if (/%[0-9a-fA-F]{2}/.test(text)) {
        try {
            text = decodeURIComponent(text);
        } catch (err) {
            // Keep original text if decoding fails.
        }
    }

    if (/(?:\\u|u)[0-9a-fA-F]{4}/.test(text)) {
        text = text.replace(/(?:\\u|u)([0-9a-fA-F]{4})/g, function (_, hex) {
            return String.fromCharCode(parseInt(hex, 16));
        });
    }

    return text;
}

function _hierarchyNormalizeCefrLevels(levels) {
    let source = levels;
    let allowedLevels = ['A1', 'A2', 'B1', 'B2', 'ALL', 'ALL LEVELS'];

    if (Array.isArray(source)) {
        return source
            .map(function (level) {
                if (level && typeof level === 'object') {
                    return '';
                }
                return _hierarchyDecodeText(level).trim().toUpperCase();
            })
            .filter(Boolean);
    }

    if (typeof source === 'string' && source.trim() !== '') {
        try {
            source = JSON.parse(source);
        } catch (err) {
            try {
                const binary = window.atob(source);
                const bytes = Uint8Array.from(binary, function (ch) { return ch.charCodeAt(0); });
                const decoded = new TextDecoder('utf-8').decode(bytes);
                source = JSON.parse(decoded);
            } catch (base64Err) {
                const matches = source.toUpperCase().match(/\b(?:A1|A2|B1|B2|ALL LEVELS|ALL)\b/g);
                source = matches || [];
            }
        }
    }

    if (!Array.isArray(source)) {
        return [];
    }

    return Array.from(new Set(source
        .map(function (level) { return _hierarchyDecodeText(level).trim().toUpperCase(); })
        .filter(function (level) { return allowedLevels.indexOf(level) !== -1; })
        .filter(Boolean)));
}

function _hierarchyResolvedCefrLevels(levels, emptyMeansAll) {
    let normalizedLevels = _hierarchyNormalizeCefrLevels(levels);
    let allLevels = ['A1', 'A2', 'B1', 'B2'];

    if (!normalizedLevels.length) {
        return emptyMeansAll === false ? [] : allLevels;
    }

    if (normalizedLevels.indexOf('ALL') !== -1 || normalizedLevels.indexOf('ALL LEVELS') !== -1) {
        return allLevels;
    }

    return allLevels.filter(function (level) {
        return normalizedLevels.indexOf(level) !== -1;
    });
}

function _hierarchyResolvedAssessmentLevels(levels) {
    return _hierarchyResolvedCefrLevels(levels, true);
}

function _hierarchyAssetBrowserItemForObject(obj) {
    if (!obj || !window.vrodosAssetBrowserItemsById) {
        return null;
    }

    let assetId = obj.asset_id || '';
    if (assetId === '') {
        return null;
    }

    return window.vrodosAssetBrowserItemsById[String(assetId)] || null;
}

function _hierarchyAssessmentBadgesHTML(obj) {
    if (!obj) {
        return '';
    }

    let categorySlug = String(obj.category_slug || '').toLowerCase();
    let categoryName = String(obj.category_name || '').toLowerCase();
    let assetBrowserItem = _hierarchyAssetBrowserItemForObject(obj);
    let genericLevelsSource = obj.immerse_cefr_levels
        || (assetBrowserItem ? assetBrowserItem.immerse_cefr_levels || '' : '');
    let isAssessment = categorySlug === 'assessment' || categoryName === 'assessment';
    let genericLevels = _hierarchyResolvedCefrLevels(genericLevelsSource, false);
    if (!isAssessment && !genericLevels.length) {
        return '';
    }

    let assessmentType = _hierarchyDecodeText(obj.assessment_type || obj.assessment_group || '').trim();
    let assessmentLevels = isAssessment
        ? _hierarchyResolvedAssessmentLevels(obj.assessment_levels || '')
        : genericLevels;
    let typeBadgeHTML = '';
    let levelBadgesHTML = '';

    if (isAssessment && assessmentType) {
        typeBadgeHTML =
            '<span class="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-sky-400/35 tw-bg-sky-500/10 tw-px-1.5 tw-py-0.5 tw-text-[7px] tw-font-bold tw-uppercase tw-tracking-[0.12em] tw-text-sky-200">' +
            _hierarchyEscapeHTML(assessmentType) +
            '</span>';
    }

    if (assessmentLevels.length) {
        levelBadgesHTML = assessmentLevels.map(function (level) {
            return (
                '<span class="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-emerald-400/35 tw-bg-emerald-500/10 tw-px-1.5 tw-py-0.5 tw-text-[7px] tw-font-bold tw-uppercase tw-tracking-[0.12em] tw-text-emerald-200">' +
                _hierarchyEscapeHTML(level) +
                '</span>'
            );
        }).join('');
    }

    if (!typeBadgeHTML && !levelBadgesHTML) {
        return '';
    }

    return '<span class="tw-mt-1 tw-flex tw-flex-col tw-gap-1 tw-leading-none">' +
        (typeBadgeHTML ? '<span class="tw-flex tw-flex-wrap tw-gap-1">' + typeBadgeHTML + '</span>' : '') +
        (levelBadgesHTML ? '<span class="tw-flex tw-flex-wrap tw-gap-1">' + levelBadgesHTML + '</span>' : '') +
        '</span>';
}

/**
 * Hover on hierarchy item: lightweight select (gizmo + outline, no panel).
 */
function hierarchyHoverSelect(uuid) {
    // Don't change selection on hover if a properties panel is open
    let panel = document.getElementById('object-controls-panel');
    if (panel && !panel.classList.contains('tw-hidden')) return;

    let obj = envir.scene.getObjectByProperty('uuid', uuid);
    if (!obj || obj.locked) return;
    selectObjectPreview(obj);
}

/**
 * Click on hierarchy item: full select with floating panel and properties.
 */
function hierarchyClickSelect(event, uuid) {
    let obj = envir.scene.getObjectByProperty('uuid', uuid);
    if (!obj || obj.locked) return;
    // Simulate left-click event for selectorMajor
    let fakeEvent = { button: 0 };
    selectorMajor(fakeEvent, obj, "1");
}

/**
 * Determine the correct insertion point for a hierarchy item.
 * Order: Director → Lights grouped by type (Sun, Lamp, Spot, Ambient) each with target → Regular objects
 */
let _lightTypeOrder = ['lightSun', 'lightLamp', 'lightSpot', 'lightAmbient'];

function _getItemCategory(item) {
    let name = item.getAttribute('data-name');
    if (!name) return null;
    if (name === 'avatarCamera') return 'director';
    let sceneObj = envir.scene.getObjectByName(name);
    return sceneObj ? (sceneObj.category_name || '') : '';
}

function _findInsertionPoint(obj) {
    let viewer = document.getElementById('hierarchy-viewer');
    if (!viewer) return null;

    let items = viewer.querySelectorAll('.hierarchyItem');
    let categoryName = obj.category_name || '';
    let isDirector = obj.name === 'avatarCamera';
    let isTarget = categoryName === 'lightTargetSpot';
    let isLight = categoryName.startsWith('light') && !isTarget;

    // Director always goes first
    if (isDirector) {
        return items.length > 0 ? items[0] : null;
    }

    // Light target: insert right after its source light
    if (isTarget) {
        let parentName = obj.name.replace('lightTargetSpot_', '');
        for (let i = 0; i < items.length; i++) {
            if (items[i].getAttribute('data-name') === parentName) {
                return items[i].nextElementSibling;
            }
        }
    }

    // Light source: insert after the last item of the same type, or after the preceding type group
    if (isLight) {
        let typeIndex = _lightTypeOrder.indexOf(categoryName);

        // Find the last item of the same light type (including its targets)
        let lastSameType = null;
        for (let i = 0; i < items.length; i++) {
            let cat = _getItemCategory(items[i]);
            if (cat === categoryName) lastSameType = items[i];
            // Also count targets that belong to this type
            if (cat === 'lightTargetSpot') {
                let pName = items[i].getAttribute('data-name').replace('lightTargetSpot_', '');
                let pObj = envir.scene.getObjectByName(pName);
                if (pObj && pObj.category_name === categoryName) lastSameType = items[i];
            }
        }
        if (lastSameType) return lastSameType.nextElementSibling;

        // No same-type exists yet — find insertion point after preceding type groups
        for (let t = typeIndex - 1; t >= 0; t--) {
            let precedingType = _lightTypeOrder[t];
            let lastOfPreceding = null;
            for (let i = 0; i < items.length; i++) {
                let cat = _getItemCategory(items[i]);
                if (cat === precedingType) lastOfPreceding = items[i];
                if (cat === 'lightTargetSpot') {
                    let pName = items[i].getAttribute('data-name').replace('lightTargetSpot_', '');
                    let pObj = envir.scene.getObjectByName(pName);
                    if (pObj && pObj.category_name === precedingType) lastOfPreceding = items[i];
                }
            }
            if (lastOfPreceding) return lastOfPreceding.nextElementSibling;
        }

        // No lights at all yet — insert after director
        for (let i = 0; i < items.length; i++) {
            if (items[i].getAttribute('data-name') === 'avatarCamera') {
                return items[i].nextElementSibling;
            }
        }
        return items.length > 0 ? items[0] : null;
    }

    // Regular object: append at end (before skeleton if present)
    let skeleton = document.getElementById('hierarchy-skeleton');
    return skeleton || null;
}

function AppendObject(obj, object_name, created, deleteButtonHTML, resetButtonHTML, lockButtonHTML){

    let iconName = _hierarchyIconForObject(obj);
    let categoryName = obj.category_name || '';
    let isLight = categoryName.startsWith('light');
    let iconColor = isLight ? 'tw-text-amber-400' : 'tw-text-white/40';
    if (obj.name === 'avatarCamera') iconColor = 'tw-text-blue-400';
    let assessmentBadgesHTML = _hierarchyAssessmentBadgesHTML(obj);

    let itemHTML = '<li class="hierarchyItem tw-flex tw-items-center tw-gap-2 tw-py-1.5 tw-px-2 tw-border-b tw-border-white/5 hover:tw-bg-white/10 tw-cursor-pointer tw-transition-colors"' +
        ' id="' + obj.uuid + '" data-name="' + obj.name + '" data-uuid="' + obj.uuid + '">' +
        '<i data-lucide="' + iconName + '" class="tw-w-4 tw-h-4 tw-flex-shrink-0 ' + iconColor + '"></i>' +
        '<span class="tw-flex-1 tw-min-w-0 tw-text-[9pt] tw-leading-tight tw-text-white"' +
        ' title="' + (obj.title || object_name) + '">' +
        '<span class="tw-block tw-font-medium tw-truncate">' + object_name + '</span>' +
        assessmentBadgesHTML +
        (created ? '<span class="tw-mt-1 tw-block tw-text-[7pt] tw-text-white/50 tw-font-normal">' + created + '</span>' : '') +
        '</span>' +
        '<span class="tw-flex tw-items-center tw-gap-0.5 tw-flex-shrink-0">' +
        deleteButtonHTML +
        resetButtonHTML +
        lockButtonHTML +
        '</span>' +
        '</li>';

    let viewer = document.getElementById('hierarchy-viewer');
    if (!viewer) return;

    let temp = document.createElement('template');
    temp.innerHTML = itemHTML;
    let insertBefore = _findInsertionPoint(obj);
    if (!insertBefore) {
        let skeleton = document.getElementById('hierarchy-skeleton');
        if (skeleton && skeleton.parentElement === viewer) {
            insertBefore = skeleton;
        }
    }

    if (insertBefore) {
        viewer.insertBefore(temp.content, insertBefore);
    } else {
        viewer.appendChild(temp.content);
    }
}


function CreateDeleteButton(obj) {
    return '<a href="javascript:void(0);" class="tw-p-1 tw-text-white/40 hover:tw-text-red-400 tw-transition-colors" aria-label="Delete asset"' +
        ' title="Delete asset object" onclick="event.stopPropagation(); deleteFomScene(\'' + obj.uuid + '\', \'' + obj.asset_name + '\');">' +
        '<i data-lucide="trash-2" class="tw-w-4 tw-h-4"></i>' + '</a>';
}


function CreateLockButton(obj) {
    let lock_ic = (obj.locked) ? 'lock' : 'lock-open';
    return '<a href="javascript:void(0);" class="tw-p-1 tw-text-white/40 hover:tw-text-white tw-transition-colors" aria-label="Lock asset"' +
        ' title="Lock asset object" onclick="event.stopPropagation(); lockOnScene(\'' + obj.uuid + '\', \'' + obj.asset_name + '\');">' +
        '<i data-lucide="' + lock_ic + '" class="tw-w-4 tw-h-4"></i>' + '</a>';
}

function CreateResetButton(obj){
    // Properly escape names for onclick
    const escapedName = (obj.name || "").replace(/'/g, "\\'");
    return '<a href="javascript:void(0);" class="tw-p-1 tw-text-white/40 hover:tw-text-blue-400 tw-transition-colors" aria-label="Reset asset"' +
        ' title="Reset asset object" onclick="event.stopPropagation(); ' +
        'resetInScene(\'' + escapedName + '\');'
        + '">' +
        '<i data-lucide="refresh-cw" class="tw-w-4 tw-h-4"></i>' +
        '</a>';

}

// Highlight item in Hierarchy viewer — tracks previous selection to avoid full DOM scan
let _previousHighlightedId = null;

function setBackgroundColorHierarchyViewer(id) {
    if (_previousHighlightedId) {
        let prev = document.getElementById(_previousHighlightedId);
        if (prev) prev.style.background = '';
    }

    let el = document.getElementById(id);
    if (el) el.style.background = 'rgba(59, 130, 246, 0.3)';

    _previousHighlightedId = id;
}

// Traverse the entire scene to insert scene children in Hierarchy Viewer
function setHierarchyViewer() {

    // Remove only real items, keep the skeleton placeholder if present
    document.querySelectorAll('#hierarchy-viewer .hierarchyItem').forEach((el) => { el.remove(); });

    // Collect all hierarchy-worthy objects
    let director = [];
    let lights = [];      // light sources (sun, lamp, spot, ambient)
    let targets = [];     // light targets
    let regular = [];

    envir.scene.traverse((obj) => {
        if (obj.name !== 'avatarCamera' && obj.parent && obj.parent.name !== 'vrodosScene') return;
        if (obj.name === "SunSphere" || obj.name === "SpotSphere" || obj.name === "LampSphere" || obj.name === "ambientSphere") return;
        if (obj.vrodos_internal_helper === true) return;
        if (!obj.isSelectableMesh && obj.name !== "avatarCamera") return;

        if (obj.name === 'avatarCamera') { director.push(obj); }
        else if ((obj.category_name || '') === 'lightTargetSpot') { targets.push(obj); }
        else if ((obj.category_name || '').startsWith('light')) { lights.push(obj); }
        else { regular.push(obj); }
    });

    // Group lights by type, then each source followed by its target
    let lightTypeOrder = ['lightSun', 'lightLamp', 'lightSpot', 'lightAmbient'];
    let sortedLights = [];
    lightTypeOrder.forEach((type) => {
        lights.filter((l) => { return l.category_name === type; }).forEach((light) => {
            sortedLights.push(light);
            let target = targets.find((t) => { return t.name === 'lightTargetSpot_' + light.name; });
            if (target) sortedLights.push(target);
        });
    });
    // Add any orphan targets not matched above
    targets.forEach((t) => {
        if (sortedLights.indexOf(t) === -1) sortedLights.push(t);
    });

    let sorted = [].concat(director, sortedLights, regular);

    sorted.forEach((obj) => {
        let asset_name = _hierarchyDisplayName(obj);
        let created = _hierarchyCreatedLabel(obj);
        let deleteButton = obj.category_name === "lightTargetSpot" || obj.name === 'avatarCamera' ? "" :
            CreateDeleteButton(obj);
        let lockButton = obj.category_name === "lightTargetSpot" || obj.name === 'avatarCamera' ? "" :
            CreateLockButton(obj);
        AppendObject(obj, asset_name, created, deleteButton, CreateResetButton(obj), lockButton);
    });

    // Render Lucide icons in dynamically added items
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Remove the skeleton loading placeholder.
 * Call this once ALL assets (lights + GLBs) have finished loading.
 */
function removeHierarchySkeleton() {
    let skeleton = document.getElementById('hierarchy-skeleton');
    if (skeleton) skeleton.remove();
}



// Single object add in Hierarchy
function addInHierarchyViewer(obj) {
    if (!obj || obj.vrodos_internal_helper === true) {
        return;
    }

    let existingItem = Array.from(document.querySelectorAll('#hierarchy-viewer .hierarchyItem')).find((item) => {
        return item.getAttribute('data-uuid') === obj.uuid || item.getAttribute('data-name') === obj.name;
    });
    if (existingItem) {
        setBackgroundColorHierarchyViewer(existingItem.id || obj.uuid);
        return;
    }

    let asset_name = _hierarchyDisplayName(obj);

    let created = _hierarchyCreatedLabel(obj);

    let deleteButton = obj['category_name'] === "lightTargetSpot" ? "" : CreateDeleteButton(obj);

    let lockButton = obj['category_name'] === "lightTargetSpot" ? "" : CreateLockButton(obj);

    // Add as a list item
    AppendObject(obj, asset_name, created, deleteButton, CreateResetButton(obj), lockButton);

    // Render Lucide icons in dynamically added items
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setBackgroundColorHierarchyViewer(obj.uuid);
}

/**
 * Initialize delegated event handlers on the hierarchy viewer container.
 * Call once after DOM is ready. Replaces per-item inline onmouseenter/onclick.
 */
function initHierarchyViewerEvents() {
    let viewer = document.getElementById('hierarchy-viewer');
    if (!viewer) return;

    viewer.addEventListener('mouseenter', (e) => {
        let item = e.target.closest('.hierarchyItem');
        if (!item) return;
        let uuid = item.dataset.uuid;
        if (uuid) hierarchyHoverSelect(uuid);
    }, true); // use capture so mouseenter fires for child elements

    viewer.addEventListener('click', (e) => {
        // Ignore clicks on action buttons (delete, lock, reset)
        if (e.target.closest('a[aria-label]')) return;
        let item = e.target.closest('.hierarchyItem');
        if (!item) return;
        let uuid = item.dataset.uuid;
        if (uuid) hierarchyClickSelect(e, uuid);
    });
}
