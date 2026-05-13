/**
 *   Reset object in scene
 */
VRODOS.ui.resetInScene = function(name) {
    let obj = null;

    if (name === "avatarCamera") {
        if (typeof VRODOS.editor.envir.resetDirectorTransform === 'function') {
            VRODOS.editor.envir.resetDirectorTransform();
        }
        obj = VRODOS.editor.envir.getDirectorObject();
    } else {
        obj = VRODOS.editor.envir.scene.getObjectByName(name);
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
            if (typeof VRODOS.editor.undoManager !== 'undefined' && !VRODOS.editor.undoManager.isExecuting) {
                const newTRS = { pos: obj.position.clone(), rot: obj.rotation.clone(), scale: obj.scale.clone() };
                VRODOS.editor.undoManager.add(new VRODOS.editor.TransformCommand(obj, oldTRS, newTRS));
            }
        }
    }

    if (obj) {
        // Update transform controls if this object is selected
        if (typeof VRODOS.editor.transform_controls !== 'undefined' && VRODOS.editor.transform_controls.object === obj) {
            if (typeof VRODOS.editor.updatePositionsAndControls === 'function') {
                VRODOS.editor.updatePositionsAndControls();
            }
        }

        // Trigger save
        if (typeof triggerAutoSave === 'function') {
            VRODOS.api.triggerAutoSave();
        }
    }
}

/**
 * Get the Lucide icon for a scene object.
 * Tries category_slug first (taxonomy assets), then category_name (lights/pawn),
 * using the shared VRODOS_CATEGORY_ICONS map from vrodos_icons.js.
 */
function _hierarchyIconForObject(obj) {
    if (obj.name === 'avatarCamera') return VRODOS.ui.getCategoryIcon('director');
    // Prefer category_slug (taxonomy), fall back to category_name (runtime lights/pawn)
    return VRODOS.ui.getCategoryIcon(obj.category_slug) !== VRODOS.ui.icons.categoryIconDefault
        ? VRODOS.ui.getCategoryIcon(obj.category_slug)
        : VRODOS.ui.getCategoryIcon(obj.category_name);
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
        VRODOS.editor.envir.scene.traverse((child) => {
            if (found) return;
            if (child.category_name === cat && child.isSelectableMesh) {
                index++;
                if (child === obj) found = true;
            }
        });
        return `${_lightLabelMap[cat]  } ${  index}`;
    }

    if (cat === 'lightTargetSpot') {
        // Derive from the parent light's display name
        const parentName = obj.name.replace('lightTargetSpot_', '');
        const parentObj = VRODOS.editor.envir.scene.getObjectByName(parentName);
        if (parentObj) {
            return `${_hierarchyDisplayName(parentObj)  } — Target`;
        }
        return 'Light Target';
    }

    if (typeof VRODOS.utils.decodeDisplayText === 'function') {
        return VRODOS.utils.decodeDisplayText(obj.asset_name || obj.name);
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
        const parentName = String(obj.name || '').replace('lightTargetSpot_', '');
        const parentObj = VRODOS.editor.envir.scene.getObjectByName(parentName);
        if (parentObj && parentObj !== obj) {
            return _hierarchyCreatedLabel(parentObj);
        }
    }

    let addedAt = Number(obj.addedAt || 0);
    if ((!Number.isFinite(addedAt) || addedAt <= 0) &&
        typeof VRODOS.data.scene_data !== 'undefined' &&
        VRODOS.data.scene_data.objects &&
        VRODOS.data.scene_data.objects[obj.name]) {
        addedAt = Number(VRODOS.data.scene_data.objects[obj.name].addedAt || 0);
    }

    if (Number.isFinite(addedAt) && addedAt > 0) {
        if (addedAt > 9999999999) {
            addedAt = Math.floor(addedAt / 1000);
        }
        const addedLabel = _hierarchyUnixTimestampToDateTime(Math.floor(addedAt));
        return (addedLabel && !addedLabel.includes('NaN')) ? addedLabel : '';
    }

    const name = String(obj.name || '');
    const match = name.match(/(\d{10})$/);
    if (!match) return '';

    const created = _hierarchyUnixTimestampToDateTime(match[1]);
    return (created && !created.includes('NaN')) ? created : '';
}

function _hierarchyUnixTimestampToDateTime(unixTimestamp) {
    const secondsValue = Number(unixTimestamp);
    if (!Number.isFinite(secondsValue) || secondsValue <= 0) {
        return '';
    }

    const date = new Date(secondsValue * 1000);
    const day = `0${date.getDate()}`.slice(-2);
    const month = `0${date.getMonth() + 1}`.slice(-2);
    const year = `0${date.getFullYear() % 100}`.slice(-2);
    const hours = `0${date.getHours()}`.slice(-2);
    const minutes = `0${date.getMinutes()}`.slice(-2);

    return `${day}/${month}/${year} ${hours}:${minutes}`;
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
        text = text.replace(/(?:\\u|u)([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    }

    return text;
}

function _hierarchyAssetBrowserItemForObject(obj) {
    if (!obj || !window.vrodosAssetBrowserItemsById) {
        return null;
    }

    const assetId = obj.asset_id || '';
    if (assetId === '') {
        return null;
    }

    return window.vrodosAssetBrowserItemsById[String(assetId)] || null;
}

function _hierarchyAssessmentBadgesHTML(obj) {
    if (!obj) {
        return '';
    }

    const categorySlug = String(obj.category_slug || '').toLowerCase();
    const categoryName = String(obj.category_name || '').toLowerCase();
    const assetBrowserItem = _hierarchyAssetBrowserItemForObject(obj);
    const genericLevelsSource = obj.immerse_cefr_levels
        || (assetBrowserItem ? assetBrowserItem.immerse_cefr_levels || '' : '');
    const isAssessment = categorySlug === 'assessment' || categoryName === 'assessment';
    const buildLevelBadges = typeof VRODOS.ui.buildCefrLevelBadgesHTML === 'function'
        ? VRODOS.ui.buildCefrLevelBadgesHTML
        : function() { return ''; };
    const levelBadgesHTML = isAssessment
        ? buildLevelBadges(obj.assessment_levels || '', { emptyMeansAll: true, textClass: 'tw-text-emerald-200' })
        : buildLevelBadges(genericLevelsSource, { emptyMeansAll: false, textClass: 'tw-text-emerald-200' });

    if (!isAssessment && !levelBadgesHTML) {
        return '';
    }

    const assessmentType = _hierarchyDecodeText(obj.assessment_type || obj.assessment_group || '').trim();
    let typeBadgeHTML = '';

    if (isAssessment && assessmentType) {
        typeBadgeHTML =
            `<span class="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-sky-400/35 tw-bg-sky-500/10 tw-px-1.5 tw-py-0.5 tw-text-[7px] tw-font-bold tw-uppercase tw-tracking-[0.12em] tw-text-sky-200">${ 
            _hierarchyEscapeHTML(assessmentType)
            }</span>`;
    }

    if (!typeBadgeHTML && !levelBadgesHTML) {
        return '';
    }

    return `<span class="tw-mt-1 tw-flex tw-flex-col tw-gap-1 tw-leading-none">${ 
        typeBadgeHTML ? `<span class="tw-flex tw-flex-wrap tw-gap-1">${  typeBadgeHTML  }</span>` : '' 
        }${levelBadgesHTML ? `<span class="tw-flex tw-flex-wrap tw-gap-1">${  levelBadgesHTML  }</span>` : '' 
        }</span>`;
}

/**
 * Hover on hierarchy item: lightweight select (gizmo + outline, no panel).
 */
function hierarchyHoverSelect(uuid) {
    // Don't change selection on hover if a properties panel is open
    const panel = document.getElementById('object-controls-panel');
    if (panel && !panel.classList.contains('tw-hidden')) return;

    const obj = VRODOS.editor.envir.scene.getObjectByProperty('uuid', uuid);
    if (!obj || obj.locked) return;
    VRODOS.ui.selectObjectPreview(obj);
}

/**
 * Click on hierarchy item: full select with floating panel and properties.
 */
function hierarchyClickSelect(event, uuid) {
    const obj = VRODOS.editor.envir.scene.getObjectByProperty('uuid', uuid);
    if (!obj || obj.locked) return;
    // Simulate left-click event for VRODOS.ui.selectorMajor
    const fakeEvent = { button: 0 };
    VRODOS.ui.selectorMajor(fakeEvent, obj, "1");
}

/**
 * Determine the correct insertion point for a hierarchy item.
 * Order: Director → Lights grouped by type (Sun, Lamp, Spot, Ambient) each with target → Regular objects
 */
const _lightTypeOrder = ['lightSun', 'lightLamp', 'lightSpot', 'lightAmbient'];

function _getItemCategory(item) {
    const name = item.getAttribute('data-name');
    if (!name) return null;
    if (name === 'avatarCamera') return 'director';
    const sceneObj = VRODOS.editor.envir.scene.getObjectByName(name);
    return sceneObj ? (sceneObj.category_name || '') : '';
}

function _findInsertionPoint(obj) {
    const viewer = document.getElementById('hierarchy-viewer');
    if (!viewer) return null;

    const items = viewer.querySelectorAll('.hierarchyItem');
    const categoryName = obj.category_name || '';
    const isDirector = obj.name === 'avatarCamera';
    const isTarget = categoryName === 'lightTargetSpot';
    const isLight = categoryName.startsWith('light') && !isTarget;

    // Director always goes first
    if (isDirector) {
        return items.length > 0 ? items[0] : null;
    }

    // Light target: insert right after its source light
    if (isTarget) {
        const parentName = obj.name.replace('lightTargetSpot_', '');
        for (let i = 0; i < items.length; i++) {
            if (items[i].getAttribute('data-name') === parentName) {
                return items[i].nextElementSibling;
            }
        }
    }

    // Light source: insert after the last item of the same type, or after the preceding type group
    if (isLight) {
        const typeIndex = _lightTypeOrder.indexOf(categoryName);

        // Find the last item of the same light type (including its targets)
        let lastSameType = null;
        for (let i = 0; i < items.length; i++) {
            const cat = _getItemCategory(items[i]);
            if (cat === categoryName) lastSameType = items[i];
            // Also count targets that belong to this type
            if (cat === 'lightTargetSpot') {
                const pName = items[i].getAttribute('data-name').replace('lightTargetSpot_', '');
                const pObj = VRODOS.editor.envir.scene.getObjectByName(pName);
                if (pObj && pObj.category_name === categoryName) lastSameType = items[i];
            }
        }
        if (lastSameType) return lastSameType.nextElementSibling;

        // No same-type exists yet — find insertion point after preceding type groups
        for (let t = typeIndex - 1; t >= 0; t--) {
            const precedingType = _lightTypeOrder[t];
            let lastOfPreceding = null;
            for (let i = 0; i < items.length; i++) {
                const cat = _getItemCategory(items[i]);
                if (cat === precedingType) lastOfPreceding = items[i];
                if (cat === 'lightTargetSpot') {
                    const pName = items[i].getAttribute('data-name').replace('lightTargetSpot_', '');
                    const pObj = VRODOS.editor.envir.scene.getObjectByName(pName);
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
    const skeleton = document.getElementById('hierarchy-skeleton');
    return skeleton || null;
}

function AppendObject(obj, object_name, created, deleteButtonHTML, resetButtonHTML, lockButtonHTML){

    const iconName = _hierarchyIconForObject(obj);
    const categoryName = obj.category_name || '';
    const isLight = categoryName.startsWith('light');
    let iconColor = isLight ? 'tw-text-amber-400' : 'tw-text-white/40';
    if (obj.name === 'avatarCamera') iconColor = 'tw-text-blue-400';
    const assessmentBadgesHTML = _hierarchyAssessmentBadgesHTML(obj);

    const itemHTML = `<li class="hierarchyItem tw-flex tw-items-center tw-gap-2 tw-py-1.5 tw-px-2 tw-border-b tw-border-white/5 hover:tw-bg-white/10 tw-cursor-pointer tw-transition-colors"` +
        ` id="${  obj.uuid  }" data-name="${  obj.name  }" data-uuid="${  obj.uuid  }">` +
        `<i data-lucide="${  iconName  }" class="tw-w-4 tw-h-4 tw-flex-shrink-0 ${  iconColor  }"></i>` +
        `<span class="tw-flex-1 tw-min-w-0 tw-text-[9pt] tw-leading-tight tw-text-white"` +
        ` title="${  obj.title || object_name  }">` +
        `<span class="tw-block tw-font-medium tw-truncate">${  object_name  }</span>${ 
        assessmentBadgesHTML 
        }${created ? `<span class="tw-mt-1 tw-block tw-text-[7pt] tw-text-white/50 tw-font-normal">${  created  }</span>` : '' 
        }</span>` +
        `<span class="tw-flex tw-items-center tw-gap-0.5 tw-flex-shrink-0">${ 
        deleteButtonHTML 
        }${resetButtonHTML 
        }${lockButtonHTML 
        }</span>` +
        `</li>`;

    const viewer = document.getElementById('hierarchy-viewer');
    if (!viewer) return;

    const temp = document.createElement('template');
    temp.innerHTML = itemHTML;
    let insertBefore = _findInsertionPoint(obj);
    if (!insertBefore) {
        const skeleton = document.getElementById('hierarchy-skeleton');
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
    return `<a href="javascript:void(0);" class="tw-p-1 tw-text-white/40 hover:tw-text-red-400 tw-transition-colors" aria-label="Delete asset"` +
        ` title="Delete asset object" onclick="event.stopPropagation(); VRODOS.ui.deleteFomScene('${  obj.uuid  }', '${  obj.asset_name  }');">` +
        `<i data-lucide="trash-2" class="tw-w-4 tw-h-4"></i>` + `</a>`;
}


function CreateLockButton(obj) {
    const lock_ic = (obj.locked) ? 'lock' : 'lock-open';
    return `<a href="javascript:void(0);" class="tw-p-1 tw-text-white/40 hover:tw-text-white tw-transition-colors" aria-label="Lock asset"` +
        ` title="Lock asset object" onclick="event.stopPropagation(); VRODOS.ui.lockOnScene('${  obj.uuid  }', '${  obj.asset_name  }');">` +
        `<i data-lucide="${  lock_ic  }" class="tw-w-4 tw-h-4"></i>` + `</a>`;
}

function CreateResetButton(obj){
    // Properly escape names for onclick
    const escapedName = (obj.name || "").replace(/'/g, "\\'");
    return `<a href="javascript:void(0);" class="tw-p-1 tw-text-white/40 hover:tw-text-blue-400 tw-transition-colors" aria-label="Reset asset"` +
        ` title="Reset asset object" onclick="event.stopPropagation(); ` +
        `VRODOS.ui.resetInScene('${  escapedName  }');`
        + `">` +
        `<i data-lucide="refresh-cw" class="tw-w-4 tw-h-4"></i>` +
        `</a>`;

}

// Highlight item in Hierarchy viewer — tracks previous selection to avoid full DOM scan
let _previousHighlightedId = null;

VRODOS.ui.setBackgroundColorHierarchyViewer = function(id) {
    if (_previousHighlightedId) {
        const prev = document.getElementById(_previousHighlightedId);
        if (prev) prev.style.background = '';
    }

    const el = document.getElementById(id);
    if (el) el.style.background = 'rgba(59, 130, 246, 0.3)';

    _previousHighlightedId = id;
}

// Traverse the entire scene to insert scene children in Hierarchy Viewer
VRODOS.ui.setHierarchyViewer = function() {

    // Remove only real items, keep the skeleton placeholder if present
    document.querySelectorAll('#hierarchy-viewer .hierarchyItem').forEach((el) => { el.remove(); });

    // Collect all hierarchy-worthy objects
    const director = [];
    const lights = [];      // light sources (sun, lamp, spot, ambient)
    const targets = [];     // light targets
    const regular = [];

    VRODOS.editor.envir.scene.traverse((obj) => {
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
    const lightTypeOrder = ['lightSun', 'lightLamp', 'lightSpot', 'lightAmbient'];
    const sortedLights = [];
    lightTypeOrder.forEach((type) => {
        lights.filter((l) => l.category_name === type).forEach((light) => {
            sortedLights.push(light);
            const target = targets.find((t) => t.name === `lightTargetSpot_${  light.name}`);
            if (target) sortedLights.push(target);
        });
    });
    // Add any orphan targets not matched above
    targets.forEach((t) => {
        if (sortedLights.indexOf(t) === -1) sortedLights.push(t);
    });

    const sorted = [].concat(director, sortedLights, regular);

    sorted.forEach((obj) => {
        const asset_name = _hierarchyDisplayName(obj);
        const created = _hierarchyCreatedLabel(obj);
        const deleteButton = obj.category_name === "lightTargetSpot" || obj.name === 'avatarCamera' ? "" :
            CreateDeleteButton(obj);
        const lockButton = obj.category_name === "lightTargetSpot" || obj.name === 'avatarCamera' ? "" :
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
VRODOS.ui.removeHierarchySkeleton = function() {
    const skeleton = document.getElementById('hierarchy-skeleton');
    if (skeleton) skeleton.remove();
}



// Single object add in Hierarchy
VRODOS.ui.addInHierarchyViewer = function(obj) {
    if (!obj || obj.vrodos_internal_helper === true) {
        return;
    }

    const existingItem = Array.from(document.querySelectorAll('#hierarchy-viewer .hierarchyItem')).find((item) => item.getAttribute('data-uuid') === obj.uuid || item.getAttribute('data-name') === obj.name);
    if (existingItem) {
        VRODOS.ui.setBackgroundColorHierarchyViewer(existingItem.id || obj.uuid);
        return;
    }

    const asset_name = _hierarchyDisplayName(obj);

    const created = _hierarchyCreatedLabel(obj);

    const deleteButton = obj.category_name === "lightTargetSpot" ? "" : CreateDeleteButton(obj);

    const lockButton = obj.category_name === "lightTargetSpot" ? "" : CreateLockButton(obj);

    // Add as a list item
    AppendObject(obj, asset_name, created, deleteButton, CreateResetButton(obj), lockButton);

    // Render Lucide icons in dynamically added items
    if (typeof lucide !== 'undefined') lucide.createIcons();

    VRODOS.ui.setBackgroundColorHierarchyViewer(obj.uuid);
}

/**
 * Initialize delegated event handlers on the hierarchy viewer container.
 * Call once after DOM is ready. Replaces per-item inline onmouseenter/onclick.
 */
VRODOS.ui.initHierarchyViewerEvents = function() {
    const viewer = document.getElementById('hierarchy-viewer');
    if (!viewer) return;

    viewer.addEventListener('mouseenter', (e) => {
        const item = e.target.closest('.hierarchyItem');
        if (!item) return;
        const uuid = item.dataset.uuid;
        if (uuid) hierarchyHoverSelect(uuid);
    }, true); // use capture so mouseenter fires for child elements

    viewer.addEventListener('click', (e) => {
        // Ignore clicks on action buttons (delete, lock, reset)
        if (e.target.closest('a[aria-label]')) return;
        const item = e.target.closest('.hierarchyItem');
        if (!item) return;
        const uuid = item.dataset.uuid;
        if (uuid) hierarchyClickSelect(e, uuid);
    });
}

