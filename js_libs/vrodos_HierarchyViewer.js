/**
 *   Reset object in scene
 */
function resetInScene(name){

    if (name === "avatarCamera") {
        envir.avatarControls.getObject().position.set(0, 0.2, 0);
        envir.avatarControls.getObject().quaternion.set(0, 0, 0, 1);
        envir.avatarControls.getObject().children[0].rotation.set(0, 0, 0);
        envir.avatarControls.getObject().children[0].scale.set(1, 1, 1);
    } else {
        envir.scene.getObjectByName(name).position.set(0, 1.3, 0);
        envir.scene.getObjectByName(name).rotation.set(0, 0, 0);
        envir.scene.getObjectByName(name).scale.set(1, 1, 1);
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
        envir.scene.traverse(function (child) {
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

    return obj.asset_name || obj.name;
}

/**
 * Hover on hierarchy item: lightweight select (gizmo + outline, no panel).
 */
function hierarchyHoverSelect(uuid) {
    // Don't change selection on hover if a properties panel is open
    var panel = document.getElementById('object-controls-panel');
    if (panel && !panel.classList.contains('tw-hidden')) return;

    var obj = envir.scene.getObjectByProperty('uuid', uuid);
    if (!obj || obj.locked) return;
    selectObjectPreview(obj);
}

/**
 * Click on hierarchy item: full select with floating panel and properties.
 */
function hierarchyClickSelect(event, uuid) {
    var obj = envir.scene.getObjectByProperty('uuid', uuid);
    if (!obj || obj.locked) return;
    // Simulate left-click event for selectorMajor
    var fakeEvent = { button: 0 };
    selectorMajor(fakeEvent, obj, "1");
}

/**
 * Determine the correct insertion point for a hierarchy item.
 * Order: Director → Lights grouped by type (Sun, Lamp, Spot, Ambient) each with target → Regular objects
 */
var _lightTypeOrder = ['lightSun', 'lightLamp', 'lightSpot', 'lightAmbient'];

function _getItemCategory(item) {
    var name = item.getAttribute('data-name');
    if (!name) return null;
    if (name === 'avatarCamera') return 'director';
    var sceneObj = envir.scene.getObjectByName(name);
    return sceneObj ? (sceneObj.category_name || '') : '';
}

function _findInsertionPoint(obj) {
    var viewer = document.getElementById('hierarchy-viewer');
    if (!viewer) return null;

    var items = viewer.querySelectorAll('.hierarchyItem');
    var categoryName = obj.category_name || '';
    var isDirector = obj.name === 'avatarCamera';
    var isTarget = categoryName === 'lightTargetSpot';
    var isLight = categoryName.startsWith('light') && !isTarget;

    // Director always goes first
    if (isDirector) {
        return items.length > 0 ? items[0] : null;
    }

    // Light target: insert right after its source light
    if (isTarget) {
        var parentName = obj.name.replace('lightTargetSpot_', '');
        for (var i = 0; i < items.length; i++) {
            if (items[i].getAttribute('data-name') === parentName) {
                return items[i].nextElementSibling;
            }
        }
    }

    // Light source: insert after the last item of the same type, or after the preceding type group
    if (isLight) {
        var typeIndex = _lightTypeOrder.indexOf(categoryName);

        // Find the last item of the same light type (including its targets)
        var lastSameType = null;
        for (var i = 0; i < items.length; i++) {
            var cat = _getItemCategory(items[i]);
            if (cat === categoryName) lastSameType = items[i];
            // Also count targets that belong to this type
            if (cat === 'lightTargetSpot') {
                var pName = items[i].getAttribute('data-name').replace('lightTargetSpot_', '');
                var pObj = envir.scene.getObjectByName(pName);
                if (pObj && pObj.category_name === categoryName) lastSameType = items[i];
            }
        }
        if (lastSameType) return lastSameType.nextElementSibling;

        // No same-type exists yet — find insertion point after preceding type groups
        for (var t = typeIndex - 1; t >= 0; t--) {
            var precedingType = _lightTypeOrder[t];
            var lastOfPreceding = null;
            for (var i = 0; i < items.length; i++) {
                var cat = _getItemCategory(items[i]);
                if (cat === precedingType) lastOfPreceding = items[i];
                if (cat === 'lightTargetSpot') {
                    var pName = items[i].getAttribute('data-name').replace('lightTargetSpot_', '');
                    var pObj = envir.scene.getObjectByName(pName);
                    if (pObj && pObj.category_name === precedingType) lastOfPreceding = items[i];
                }
            }
            if (lastOfPreceding) return lastOfPreceding.nextElementSibling;
        }

        // No lights at all yet — insert after director
        for (var i = 0; i < items.length; i++) {
            if (items[i].getAttribute('data-name') === 'avatarCamera') {
                return items[i].nextElementSibling;
            }
        }
        return items.length > 0 ? items[0] : null;
    }

    // Regular object: append at end (before skeleton if present)
    var skeleton = document.getElementById('hierarchy-skeleton');
    return skeleton || null;
}

function AppendObject(obj, object_name, created, deleteButtonHTML, resetButtonHTML, lockButtonHTML){

    let iconName = _hierarchyIconForObject(obj);
    let categoryName = obj.category_name || '';
    let isLight = categoryName.startsWith('light');
    let iconColor = isLight ? 'tw-text-amber-400' : 'tw-text-white/40';
    if (obj.name === 'avatarCamera') iconColor = 'tw-text-blue-400';

    var itemHTML = '<li class="hierarchyItem tw-flex tw-items-center tw-gap-2 tw-py-1.5 tw-px-2 tw-border-b tw-border-white/5 hover:tw-bg-white/10 tw-cursor-pointer tw-transition-colors"' +
        ' id="' + obj.uuid + '" data-name="' + obj.name + '"' +
        ' onmouseenter="hierarchyHoverSelect(\'' + obj.uuid + '\')"' +
        ' onclick="hierarchyClickSelect(event,\'' + obj.uuid + '\')">' +
        '<i data-lucide="' + iconName + '" class="tw-w-4 tw-h-4 tw-flex-shrink-0 ' + iconColor + '"></i>' +
        '<span class="tw-flex-1 tw-min-w-0 tw-truncate tw-text-[9pt] tw-leading-tight tw-text-white"' +
        ' title="' + (obj.title || object_name) + '">' +
        '<span class="tw-font-medium">' + object_name + '</span>' +
        (created ? '<br/><span class="tw-text-[7pt] tw-text-white/50 tw-font-normal">' + created + '</span>' : '') +
        '</span>' +
        '<span class="tw-flex tw-items-center tw-gap-0.5 tw-flex-shrink-0">' +
        deleteButtonHTML +
        resetButtonHTML +
        lockButtonHTML +
        '</span>' +
        '</li>';

    var viewer = document.getElementById('hierarchy-viewer');
    if (!viewer) return;

    var temp = document.createElement('template');
    temp.innerHTML = itemHTML;
    var insertBefore = _findInsertionPoint(obj);

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

    return '<a href="javascript:void(0);" class="tw-p-1 tw-text-white/40 hover:tw-text-blue-400 tw-transition-colors" aria-label="Reset asset"' +
        ' title="Reset asset object" onclick="event.stopPropagation(); ' +
        'resetInScene(\'' + obj.name + '\');'
        + '">' +
        '<i data-lucide="refresh-cw" class="tw-w-4 tw-h-4"></i>' +
        '</a>';

}

// Highlight item in Hierarchy viewer
function setBackgroundColorHierarchyViewer(id) {

    document.querySelectorAll('#hierarchy-viewer li').forEach(function (li) {
        li.style.background = '';
    });

    var el = document.getElementById(id);
    if (el) el.style.background = 'rgba(59, 130, 246, 0.3)';
}

// Traverse the entire scene to insert scene children in Hierarchy Viewer
function setHierarchyViewer() {

    // Remove only real items, keep the skeleton placeholder if present
    document.querySelectorAll('#hierarchy-viewer .hierarchyItem').forEach(function (el) { el.remove(); });

    // Collect all hierarchy-worthy objects
    var director = [];
    var lights = [];      // light sources (sun, lamp, spot, ambient)
    var targets = [];     // light targets
    var regular = [];

    envir.scene.traverse(function (obj) {
        if (obj.name === "SunSphere" || obj.name === "SpotSphere" || obj.name === "ambientSphere") return;
        if (!obj.isSelectableMesh && obj.name !== "avatarCamera") return;

        if (obj.name === 'avatarCamera') { director.push(obj); }
        else if ((obj.category_name || '') === 'lightTargetSpot') { targets.push(obj); }
        else if ((obj.category_name || '').startsWith('light')) { lights.push(obj); }
        else { regular.push(obj); }
    });

    // Group lights by type, then each source followed by its target
    var lightTypeOrder = ['lightSun', 'lightLamp', 'lightSpot', 'lightAmbient'];
    var sortedLights = [];
    lightTypeOrder.forEach(function (type) {
        lights.filter(function (l) { return l.category_name === type; }).forEach(function (light) {
            sortedLights.push(light);
            var target = targets.find(function (t) { return t.name === 'lightTargetSpot_' + light.name; });
            if (target) sortedLights.push(target);
        });
    });
    // Add any orphan targets not matched above
    targets.forEach(function (t) {
        if (sortedLights.indexOf(t) === -1) sortedLights.push(t);
    });

    var sorted = [].concat(director, sortedLights, regular);

    sorted.forEach(function (obj) {
        var asset_name = _hierarchyDisplayName(obj);
        var created = obj.name === 'avatarCamera' ? "" : unixTimestamp_to_time(
            obj.name.substring(obj.name.length - 10, obj.name.length));
        var deleteButton = obj.category_name === "lightTargetSpot" || obj.name === 'avatarCamera' ? "" :
            CreateDeleteButton(obj);
        var lockButton = obj.category_name === "lightTargetSpot" || obj.name === 'avatarCamera' ? "" :
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
    var skeleton = document.getElementById('hierarchy-skeleton');
    if (skeleton) skeleton.remove();
}



// Single object add in Hierarchy
function addInHierarchyViewer(obj) {

    let asset_name = _hierarchyDisplayName(obj);

    let created = unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));

    let deleteButton = obj['category_name'] === "lightTargetSpot" ? "" : CreateDeleteButton(obj);

    let lockButton = obj['category_name'] === "lightTargetSpot" ? "" : CreateLockButton(obj);

    // Add as a list item
    AppendObject(obj, asset_name, created, deleteButton, CreateResetButton(obj), lockButton);

    // Render Lucide icons in dynamically added items
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setBackgroundColorHierarchyViewer(obj.uuid);
}
