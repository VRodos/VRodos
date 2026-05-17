/**
 *   Reset object in scene
 */
function _hierarchyGetRegistry() {
    return VRODOS.editor.sceneRegistry;
}

function _hierarchyGetObjectByUuid(uuid) {
    const registry = _hierarchyGetRegistry();
    return registry ? registry.get(uuid) : null;
}

function _hierarchyGetObjectByName(name) {
    const registry = _hierarchyGetRegistry();
    return registry ? registry.get(name) : null;
}

function _hierarchyGetSelectableRoots() {
    return typeof VRODOS.utils.getEditorSceneRoots === 'function'
        ? VRODOS.utils.getEditorSceneRoots(VRODOS.editor.envir ? VRODOS.editor.envir.scene : null, {
            filterSelectable: true,
            includeDirector: true,
            rebuildRegistryIfEmpty: false
        })
        : [];
}

function _hierarchyGetSelectedObject() {
    return VRODOS.editor.transforms && typeof VRODOS.editor.transforms.getRealObject === 'function'
        ? VRODOS.editor.transforms.getRealObject()
        : null;
}

function _hierarchyGetSceneObjectRecord(name) {
    return typeof VRODOS.utils.sceneGetObjectRecord === 'function'
        ? VRODOS.utils.sceneGetObjectRecord(name, { create: false })
        : null;
}

const HIERARCHY_DIRECTOR_NAME = 'avatarCamera';
const HIERARCHY_LIGHT_TARGET_CATEGORY = 'lightTargetSpot';
const HIERARCHY_INTERNAL_VISUAL_NAMES = new Set(['SunSphere', 'SpotSphere', 'LampSphere', 'ambientSphere']);

function _hierarchyCategory(obj) {
    return obj ? (obj.category_name || '') : '';
}

function _hierarchyIsDirector(obj) {
    return Boolean(obj) && obj.name === HIERARCHY_DIRECTOR_NAME;
}

function _hierarchyIsLightTarget(obj) {
    return _hierarchyCategory(obj) === HIERARCHY_LIGHT_TARGET_CATEGORY;
}

function _hierarchyIsLightCategory(obj) {
    return _hierarchyCategory(obj).startsWith('light');
}

function _hierarchyIsLightSource(obj) {
    return _hierarchyIsLightCategory(obj) && !_hierarchyIsLightTarget(obj);
}

function _hierarchyIsInternalVisualObject(obj) {
    return Boolean(obj) &&
        (obj.vrodos_internal_helper === true || HIERARCHY_INTERNAL_VISUAL_NAMES.has(obj.name));
}

function _hierarchyIsTopLevelRoot(obj) {
    return _hierarchyIsDirector(obj) || !obj.parent || obj.parent.name === 'vrodosScene';
}

function _hierarchyShouldRenderObject(obj) {
    if (!obj || _hierarchyIsInternalVisualObject(obj) || !_hierarchyIsTopLevelRoot(obj)) {
        return false;
    }

    return Boolean(obj.isSelectableMesh || _hierarchyIsDirector(obj));
}

function _hierarchyCaptureTRS(obj) {
    if (!obj) {
        return null;
    }

    return {
        pos: obj.position.clone(),
        rot: obj.rotation.clone(),
        scale: obj.scale.clone()
    };
}

function _hierarchyCommitResetUndo(obj, oldTRS) {
    if (
        !obj ||
        !oldTRS ||
        typeof VRODOS.editor.undoManager === 'undefined' ||
        VRODOS.editor.undoManager.isExecuting
    ) {
        return;
    }

    const newTRS = _hierarchyCaptureTRS(obj);
    VRODOS.editor.undoManager.add(new VRODOS.editor.TransformCommand(obj, oldTRS, newTRS));
}

function _hierarchyApplyDefaultTRS(obj) {
    if (!obj) {
        return;
    }

    obj.position.set(0, 1.3, 0);
    obj.rotation.set(0, 0, 0);
    obj.scale.set(1, 1, 1);
    obj.updateMatrix();
    obj.updateMatrixWorld(true);
}

function _hierarchySyncResetSideEffects(obj) {
    if (!obj) {
        return;
    }

    if (_hierarchyGetSelectedObject() === obj && typeof VRODOS.editor.updatePositionsAndControls === 'function') {
        VRODOS.editor.updatePositionsAndControls();
    }
    if (VRODOS.editor.sceneRegistry && typeof VRODOS.editor.sceneRegistry.invalidateBounds === 'function') {
        VRODOS.editor.sceneRegistry.invalidateBounds(obj);
    }
    if (typeof VRODOS.editor.requestRender === 'function') {
        VRODOS.editor.requestRender('hierarchy-reset');
    }
    if (typeof VRODOS.api.triggerAutoSave === 'function') {
        VRODOS.api.triggerAutoSave();
    }
}

VRODOS.ui.resetInScene = function(name) {
    let obj = null;

    if (name === HIERARCHY_DIRECTOR_NAME) {
        if (typeof VRODOS.editor.envir.resetDirectorTransform === 'function') {
            VRODOS.editor.envir.resetDirectorTransform();
        }
        obj = VRODOS.editor.envir.getDirectorObject();
    } else {
        obj = _hierarchyGetObjectByName(name);
        if (obj) {
            const oldTRS = _hierarchyCaptureTRS(obj);
            _hierarchyApplyDefaultTRS(obj);
            _hierarchyCommitResetUndo(obj, oldTRS);
        }
    }

    _hierarchySyncResetSideEffects(obj);
}

/**
 * Get the Lucide icon for a scene object.
 * Tries category_slug first (taxonomy assets), then category_name (lights/pawn),
 * using the shared VRODOS_CATEGORY_ICONS map from vrodos_icons.js.
 */
function _hierarchyIconForObject(obj) {
    if (_hierarchyIsDirector(obj)) return VRODOS.ui.getCategoryIcon('director');
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
 * Lights: "Sun 1", "Lamp 2", etc. Target spots: "Sun 1 - Target"
 * Director stays "Director".  Others keep their asset_name.
 */
function _hierarchyDisplayName(obj) {
    if (_hierarchyIsDirector(obj)) return 'Director';

    const cat = _hierarchyCategory(obj);

    // For lights, count how many of the same type appear *before* this one in traversal order
    if (_lightLabelMap[cat]) {
        let index = 0;
        const roots = _hierarchyGetSelectableRoots();
        for (let i = 0; i < roots.length; i++) {
            const child = roots[i];
            if (child.category_name === cat && child.isSelectableMesh) {
                index++;
                if (child === obj) break;
            }
        }
        return `${_lightLabelMap[cat]  } ${  index}`;
    }

    if (_hierarchyIsLightTarget(obj)) {
        // Derive from the parent light's display name
        const parentName = obj.name.replace(`${HIERARCHY_LIGHT_TARGET_CATEGORY}_`, '');
        const parentObj = _hierarchyGetObjectByName(parentName);
        if (parentObj) {
            return `${_hierarchyDisplayName(parentObj)  } - Target`;
        }
        return 'Light Target';
    }

    return VRODOS.utils.displayText(obj.asset_name || obj.name);
}

/**
 * Resolve the "added to scene" timestamp for a hierarchy item.
 * Prefer the explicit persisted field, fall back to the legacy timestamp suffix.
 */
function _hierarchyCreatedLabel(obj) {
    if (!obj || _hierarchyIsDirector(obj)) return '';

    if (_hierarchyIsLightTarget(obj)) {
        const parentName = String(obj.name || '').replace(`${HIERARCHY_LIGHT_TARGET_CATEGORY}_`, '');
        const parentObj = _hierarchyGetObjectByName(parentName);
        if (parentObj && parentObj !== obj) {
            return _hierarchyCreatedLabel(parentObj);
        }
    }

    let addedAt = Number(obj.addedAt || 0);
    if (!Number.isFinite(addedAt) || addedAt <= 0) {
        const sceneRecord = _hierarchyGetSceneObjectRecord(obj.name);
        if (sceneRecord) {
            addedAt = Number(sceneRecord.addedAt || 0);
        }
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
        ? buildLevelBadges(obj.assessment_levels || '', { emptyMeansAll: false, textClass: 'tw-text-emerald-200' })
        : buildLevelBadges(genericLevelsSource, { emptyMeansAll: false, textClass: 'tw-text-emerald-200' });

    if (!isAssessment && !levelBadgesHTML) {
        return '';
    }

    const assessmentType = VRODOS.utils.displayText(obj.assessment_type || obj.assessment_group || '').trim();
    let typeBadgeHTML = '';

    if (isAssessment && assessmentType) {
        typeBadgeHTML =
            `<span class="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-sky-400/35 tw-bg-sky-500/10 tw-px-1.5 tw-py-0.5 tw-text-[7px] tw-font-bold tw-uppercase tw-tracking-[0.12em] tw-text-sky-200">${ 
            VRODOS.utils.escapeHTML(assessmentType)
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
function isObjectControlsPanelOpen() {
    if (typeof VRODOS.ui.isObjectControlsPanelOpen === 'function') {
        return VRODOS.ui.isObjectControlsPanelOpen();
    }

    const panel = document.getElementById('object-controls-panel');
    return Boolean(panel && !panel.classList.contains('tw-hidden'));
}

function hierarchyHoverSelect(uuid) {
    // Don't change selection on hover if a properties panel is open
    if (isObjectControlsPanelOpen()) return;

    const obj = _hierarchyGetObjectByUuid(uuid);
    if (!obj || obj.locked) return;
    VRODOS.ui.selectObjectPreview(obj);
}

/**
 * Click on hierarchy item: full select with floating panel and properties.
 */
function hierarchyClickSelect(event, uuid) {
    const obj = _hierarchyGetObjectByUuid(uuid);
    if (!obj || obj.locked) return;
    // Simulate left-click event for VRODOS.ui.selectorMajor
    const fakeEvent = { button: 0 };
    VRODOS.ui.selectorMajor(fakeEvent, obj, "1");
}

function _hierarchyAttribute(value) {
    return VRODOS.utils.escapeAttribute(String(value || ''));
}

function _hierarchyHTML(value) {
    return VRODOS.utils.escapeHTML(String(value || ''));
}

function _hierarchyActionLabel(obj) {
    return VRODOS.utils.displayText(obj.asset_name || obj.name);
}

function hierarchyActionValue(actionAnchor, item, key) {
    return actionAnchor.dataset[key] || (item && item.dataset ? item.dataset[key] || '' : '');
}

function handleHierarchyActionClick(event, actionAnchor) {
    const item = actionAnchor.closest('.hierarchyItem');
    const action = actionAnchor.dataset.hierarchyAction || '';
    const uuid = hierarchyActionValue(actionAnchor, item, 'uuid');
    const name = hierarchyActionValue(actionAnchor, item, 'name');
    const assetName = hierarchyActionValue(actionAnchor, item, 'assetName') || name;

    event.preventDefault();
    event.stopPropagation();

    if (action === 'delete' && typeof VRODOS.ui.deleteFomScene === 'function') {
        VRODOS.ui.deleteFomScene(uuid, assetName);
        return;
    }

    if (action === 'lock' && typeof VRODOS.ui.lockOnScene === 'function') {
        VRODOS.ui.lockOnScene(uuid, assetName);
        return;
    }

    if (action === 'reset' && typeof VRODOS.ui.resetInScene === 'function') {
        VRODOS.ui.resetInScene(name);
    }
}

/**
 * Determine the correct insertion point for a hierarchy item.
 * Order: Director -> Lights grouped by type (Sun, Lamp, Spot, Ambient) each with target -> Regular objects
 */
const _lightTypeOrder = ['lightSun', 'lightLamp', 'lightSpot', 'lightAmbient'];

function _getItemCategory(item) {
    const name = item.getAttribute('data-name');
    if (!name) return null;
    if (name === HIERARCHY_DIRECTOR_NAME) return 'director';
    const sceneObj = _hierarchyGetObjectByName(name);
    return _hierarchyCategory(sceneObj);
}

function _findInsertionPoint(obj) {
    const viewer = document.getElementById('hierarchy-viewer');
    if (!viewer) return null;

    const items = viewer.querySelectorAll('.hierarchyItem');
    const categoryName = _hierarchyCategory(obj);
    const isDirector = _hierarchyIsDirector(obj);
    const isTarget = _hierarchyIsLightTarget(obj);
    const isLight = _hierarchyIsLightSource(obj);

    // Director always goes first
    if (isDirector) {
        return items.length > 0 ? items[0] : null;
    }

    // Light target: insert right after its source light
    if (isTarget) {
        const parentName = obj.name.replace(`${HIERARCHY_LIGHT_TARGET_CATEGORY}_`, '');
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
            if (cat === HIERARCHY_LIGHT_TARGET_CATEGORY) {
                const pName = items[i].getAttribute('data-name').replace(`${HIERARCHY_LIGHT_TARGET_CATEGORY}_`, '');
                const pObj = _hierarchyGetObjectByName(pName);
                if (pObj && pObj.category_name === categoryName) lastSameType = items[i];
            }
        }
        if (lastSameType) return lastSameType.nextElementSibling;

        // No same-type exists yet; find insertion point after preceding type groups
        for (let t = typeIndex - 1; t >= 0; t--) {
            const precedingType = _lightTypeOrder[t];
            let lastOfPreceding = null;
            for (let i = 0; i < items.length; i++) {
                const cat = _getItemCategory(items[i]);
                if (cat === precedingType) lastOfPreceding = items[i];
                if (cat === HIERARCHY_LIGHT_TARGET_CATEGORY) {
                    const pName = items[i].getAttribute('data-name').replace(`${HIERARCHY_LIGHT_TARGET_CATEGORY}_`, '');
                    const pObj = _hierarchyGetObjectByName(pName);
                    if (pObj && pObj.category_name === precedingType) lastOfPreceding = items[i];
                }
            }
            if (lastOfPreceding) return lastOfPreceding.nextElementSibling;
        }

        // No lights at all yet; insert after director
        for (let i = 0; i < items.length; i++) {
            if (items[i].getAttribute('data-name') === HIERARCHY_DIRECTOR_NAME) {
                return items[i].nextElementSibling;
            }
        }
        return items.length > 0 ? items[0] : null;
    }

    // Regular object: append at end (before skeleton if present)
    const skeleton = document.getElementById('hierarchy-skeleton');
    return skeleton || null;
}

function _hierarchyItemHTML(obj, object_name, created, deleteButtonHTML, resetButtonHTML, lockButtonHTML) {
    const iconName = _hierarchyIconForObject(obj);
    const isLight = _hierarchyIsLightCategory(obj);
    let iconColor = isLight ? 'tw-text-amber-400' : 'tw-text-white/40';
    if (_hierarchyIsDirector(obj)) iconColor = 'tw-text-blue-400';
    const assessmentBadgesHTML = _hierarchyAssessmentBadgesHTML(obj);
    const safeId = _hierarchyAttribute(obj.uuid);
    const safeName = _hierarchyAttribute(obj.name);
    const safeIconName = _hierarchyAttribute(iconName);
    const safeTitle = _hierarchyAttribute(obj.title || object_name);
    const safeObjectName = _hierarchyHTML(object_name);
    const safeCreated = _hierarchyHTML(created);

    const itemHTML = `<li class="hierarchyItem tw-flex tw-items-center tw-gap-2 tw-py-1.5 tw-px-2 tw-border-b tw-border-white/5 hover:tw-bg-white/10 tw-cursor-pointer tw-transition-colors"` +
        ` id="${  safeId  }" data-name="${  safeName  }" data-uuid="${  safeId  }">` +
        `<i data-lucide="${  safeIconName  }" class="tw-w-4 tw-h-4 tw-flex-shrink-0 ${  iconColor  }"></i>` +
        `<span class="tw-flex-1 tw-min-w-0 tw-text-[9pt] tw-leading-tight tw-text-white"` +
        ` title="${  safeTitle  }">` +
        `<span class="tw-block tw-font-medium tw-truncate">${  safeObjectName  }</span>${
        assessmentBadgesHTML
        }${created ? `<span class="tw-mt-1 tw-block tw-text-[7pt] tw-text-white/50 tw-font-normal">${  safeCreated  }</span>` : ''
        }</span>` +
        `<span class="tw-flex tw-items-center tw-gap-0.5 tw-flex-shrink-0">${ 
        deleteButtonHTML 
        }${resetButtonHTML 
        }${lockButtonHTML 
        }</span>` +
        `</li>`;

    return itemHTML;
}

VRODOS.ui.updateHierarchyViewerCount = function() {
    const viewer = document.getElementById('hierarchy-viewer');
    const countElement = document.getElementById('hierarchy-viewer-count');
    const titleElement = document.getElementById('hierarchy-viewer-title');
    const count = viewer ? viewer.querySelectorAll('.hierarchyItem').length : 0;

    if (countElement) {
        countElement.textContent = `(${  count  })`;
    }
    if (titleElement) {
        titleElement.title = `${  count  } item${count === 1 ? '' : 's'} in hierarchy viewer`;
    }
};

function _hierarchyItemMatches(item, uuid, objectName) {
    if (!item) {
        return false;
    }

    return item.id === uuid ||
        item.getAttribute('data-uuid') === uuid ||
        item.getAttribute('data-name') === objectName;
}

VRODOS.ui.getHierarchyItemsForObject = function(uuid, objectName) {
    const directItem = uuid ? document.getElementById(uuid) : null;
    if (directItem && _hierarchyItemMatches(directItem, uuid, objectName)) {
        return [directItem];
    }

    return Array.from(document.querySelectorAll('#hierarchy-viewer .hierarchyItem'))
        .filter((item) => _hierarchyItemMatches(item, uuid, objectName));
};

VRODOS.ui.getHierarchyItemForObject = function(uuid, objectName) {
    const items = VRODOS.ui.getHierarchyItemsForObject(uuid, objectName);
    return items.length > 0 ? items[0] : null;
};

VRODOS.ui.removeHierarchyEntriesForObject = function(uuid, objectName) {
    VRODOS.ui.getHierarchyItemsForObject(uuid, objectName).forEach((item) => {
        item.remove();
    });
    VRODOS.ui.updateHierarchyViewerCount();
};

VRODOS.ui.updateHierarchyLockIcon = function(object) {
    const hierarchyItem = object ? VRODOS.ui.getHierarchyItemForObject(object.uuid, object.name) : null;
    if (!hierarchyItem) {
        return;
    }

    const lockAnchor = hierarchyItem.querySelector('a[aria-label="Lock asset"]');
    if (!lockAnchor) {
        return;
    }

    const newIcon = object.locked ? 'lock' : 'lock-open';
    lockAnchor.innerHTML = `<i data-lucide="${  newIcon  }" class="tw-w-4 tw-h-4"></i>`;
    VRODOS.ui.refreshLucideIcons({ nodes: [lockAnchor] });
};

function _createHierarchyItemFragment(obj, object_name, created, deleteButtonHTML, resetButtonHTML, lockButtonHTML) {
    const temp = document.createElement('template');
    temp.innerHTML = _hierarchyItemHTML(obj, object_name, created, deleteButtonHTML, resetButtonHTML, lockButtonHTML);
    return temp.content;
}

function AppendObject(obj) {
    const viewer = document.getElementById('hierarchy-viewer');
    if (!viewer) return;

    const fragment = _hierarchyCreateObjectFragment(obj);
    let insertBefore = _findInsertionPoint(obj);
    if (!insertBefore) {
        const skeleton = document.getElementById('hierarchy-skeleton');
        if (skeleton && skeleton.parentElement === viewer) {
            insertBefore = skeleton;
        }
    }

    if (insertBefore) {
        viewer.insertBefore(fragment, insertBefore);
    } else {
        viewer.appendChild(fragment);
    }
    VRODOS.ui.updateHierarchyViewerCount();
}


function CreateDeleteButton(obj) {
    return `<button type="button" class="tw-appearance-none tw-border-0 tw-bg-transparent tw-cursor-pointer tw-p-1 tw-text-white/40 hover:tw-text-red-400 tw-transition-colors" aria-label="Delete asset"` +
        ` title="Delete asset object" data-hierarchy-action="delete" data-uuid="${  _hierarchyAttribute(obj.uuid)  }"` +
        ` data-name="${  _hierarchyAttribute(obj.name)  }" data-asset-name="${  _hierarchyAttribute(_hierarchyActionLabel(obj))  }">` +
        `<i data-lucide="trash-2" class="tw-w-4 tw-h-4"></i></button>`;
}


function CreateLockButton(obj) {
    const lock_ic = (obj.locked) ? 'lock' : 'lock-open';
    return `<button type="button" class="tw-appearance-none tw-border-0 tw-bg-transparent tw-cursor-pointer tw-p-1 tw-text-white/40 hover:tw-text-white tw-transition-colors" aria-label="Lock asset"` +
        ` title="Lock asset object" data-hierarchy-action="lock" data-uuid="${  _hierarchyAttribute(obj.uuid)  }"` +
        ` data-name="${  _hierarchyAttribute(obj.name)  }" data-asset-name="${  _hierarchyAttribute(_hierarchyActionLabel(obj))  }">` +
        `<i data-lucide="${  lock_ic  }" class="tw-w-4 tw-h-4"></i></button>`;
}

function CreateResetButton(obj){
    return `<button type="button" class="tw-appearance-none tw-border-0 tw-bg-transparent tw-cursor-pointer tw-p-1 tw-text-white/40 hover:tw-text-blue-400 tw-transition-colors" aria-label="Reset asset"` +
        ` title="Reset asset object" data-hierarchy-action="reset" data-uuid="${  _hierarchyAttribute(obj.uuid)  }"` +
        ` data-name="${  _hierarchyAttribute(obj.name)  }">` +
        `<i data-lucide="refresh-cw" class="tw-w-4 tw-h-4"></i>` +
        `</button>`;

}

function _hierarchyCanEditObject(obj) {
    return Boolean(obj) &&
        !_hierarchyIsDirector(obj) &&
        !_hierarchyIsLightTarget(obj);
}

function _hierarchyActionButtonsForObject(obj) {
    const canEdit = _hierarchyCanEditObject(obj);
    return {
        deleteButton: canEdit ? CreateDeleteButton(obj) : '',
        resetButton: CreateResetButton(obj),
        lockButton: canEdit ? CreateLockButton(obj) : ''
    };
}

function _hierarchyCreateObjectFragment(obj) {
    const actionButtons = _hierarchyActionButtonsForObject(obj);
    return _createHierarchyItemFragment(
        obj,
        _hierarchyDisplayName(obj),
        _hierarchyCreatedLabel(obj),
        actionButtons.deleteButton,
        actionButtons.resetButton,
        actionButtons.lockButton
    );
}

function _hierarchyCreateBuckets() {
    return {
        director: [],
        lights: [],
        targets: [],
        regular: []
    };
}

function _hierarchyBucketObject(obj, buckets) {
    if (_hierarchyIsDirector(obj)) {
        buckets.director.push(obj);
    } else if (_hierarchyIsLightTarget(obj)) {
        buckets.targets.push(obj);
    } else if (_hierarchyIsLightSource(obj)) {
        buckets.lights.push(obj);
    } else {
        buckets.regular.push(obj);
    }
}

function _hierarchyCollectRenderableBuckets() {
    const buckets = _hierarchyCreateBuckets();

    _hierarchyGetSelectableRoots().forEach((obj) => {
        if (_hierarchyShouldRenderObject(obj)) {
            _hierarchyBucketObject(obj, buckets);
        }
    });

    return buckets;
}

function _hierarchySortLightRows(lights, targets) {
    const sortedLights = [];
    const matchedTargets = new Set();

    _lightTypeOrder.forEach((type) => {
        lights.filter((light) => _hierarchyCategory(light) === type).forEach((light) => {
            sortedLights.push(light);
            const target = targets.find((candidate) =>
                candidate.name === `${HIERARCHY_LIGHT_TARGET_CATEGORY}_${  light.name}`);
            if (target) {
                sortedLights.push(target);
                matchedTargets.add(target);
            }
        });
    });

    targets.forEach((target) => {
        if (!matchedTargets.has(target)) {
            sortedLights.push(target);
        }
    });

    return sortedLights;
}

function _hierarchyGetRenderableObjects() {
    const buckets = _hierarchyCollectRenderableBuckets();
    return [].concat(
        buckets.director,
        _hierarchySortLightRows(buckets.lights, buckets.targets),
        buckets.regular
    );
}

// Highlight item in Hierarchy viewer; tracks previous selection to avoid full DOM scan
let _previousHighlightedId = null;

function _hierarchyScrollItemIntoView(item) {
    if (!item || typeof item.scrollIntoView !== 'function') {
        return;
    }

    window.requestAnimationFrame(() => {
        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        item.scrollIntoView({
            block: 'nearest',
            inline: 'nearest',
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
    });
}

VRODOS.ui.setBackgroundColorHierarchyViewer = function(id, options) {
    const opts = Object.assign({ scroll: true }, options || {});

    if (_previousHighlightedId) {
        const prev = document.getElementById(_previousHighlightedId);
        if (prev) prev.style.background = '';
    }

    const el = document.getElementById(id);
    if (el) {
        el.style.background = 'rgba(59, 130, 246, 0.3)';
        if (opts.scroll) {
            _hierarchyScrollItemIntoView(el);
        }
    }

    _previousHighlightedId = id;
}

// Insert registered/selectable scene children in Hierarchy Viewer.
VRODOS.ui.setHierarchyViewer = function() {
    const viewer = document.getElementById('hierarchy-viewer');
    if (!viewer) return;

    // Remove only real items, keep the skeleton placeholder if present
    viewer.querySelectorAll('.hierarchyItem').forEach((el) => { el.remove(); });

    const fragment = document.createDocumentFragment();
    _hierarchyGetRenderableObjects().forEach((obj) => {
        fragment.appendChild(_hierarchyCreateObjectFragment(obj));
    });
    viewer.appendChild(fragment);
    VRODOS.ui.updateHierarchyViewerCount();

    // Render Lucide icons in dynamically added items
    VRODOS.ui.refreshLucideIcons();
}

/**
 * Remove the skeleton loading placeholder.
 * Call this once ALL assets (lights + GLBs) have finished loading.
 */
VRODOS.ui.removeHierarchySkeleton = function() {
    const skeleton = document.getElementById('hierarchy-skeleton');
    if (skeleton) skeleton.remove();
    VRODOS.ui.updateHierarchyViewerCount();
}



// Single object add in Hierarchy
VRODOS.ui.addInHierarchyViewer = function(obj) {
    if (!_hierarchyShouldRenderObject(obj)) {
        return;
    }

    const existingItem = VRODOS.ui.getHierarchyItemForObject(obj.uuid, obj.name);
    if (existingItem) {
        VRODOS.ui.setBackgroundColorHierarchyViewer(existingItem.id || obj.uuid);
        VRODOS.ui.updateHierarchyViewerCount();
        return;
    }

    // Add as a list item
    AppendObject(obj);

    // Render Lucide icons in dynamically added items
    VRODOS.ui.refreshLucideIcons();

    VRODOS.ui.setBackgroundColorHierarchyViewer(obj.uuid);
    VRODOS.ui.updateHierarchyViewerCount();
}

/**
 * Initialize delegated event handlers on the hierarchy viewer container.
 * Call once after DOM is ready. Replaces per-item inline onmouseenter/onclick.
 */
VRODOS.ui.initHierarchyViewerEvents = function() {
    const viewer = document.getElementById('hierarchy-viewer');
    if (!viewer) return;
    VRODOS.ui.updateHierarchyViewerCount();
    if (viewer.dataset.vrodosHierarchyEventsBound === 'true') {
        return;
    }
    viewer.dataset.vrodosHierarchyEventsBound = 'true';

    viewer.addEventListener('mouseenter', (e) => {
        const item = e.target.closest('.hierarchyItem');
        if (!item) return;
        const uuid = item.dataset.uuid;
        if (uuid) hierarchyHoverSelect(uuid);
    }, true); // use capture so mouseenter fires for child elements

    viewer.addEventListener('click', (e) => {
        const actionAnchor = e.target.closest('[data-hierarchy-action]');
        if (actionAnchor) {
            handleHierarchyActionClick(e, actionAnchor);
            return;
        }

        const item = e.target.closest('.hierarchyItem');
        if (!item) return;
        const uuid = item.dataset.uuid;
        if (uuid) hierarchyClickSelect(e, uuid);
    });
}
