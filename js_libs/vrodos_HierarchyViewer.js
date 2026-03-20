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

function AppendObject(obj, object_name, created, deleteButtonHTML, resetButtonHTML, lockButtonHTML){

    let iconName = _hierarchyIconForObject(obj);
    let categoryName = obj.category_name || '';
    let isLight = categoryName.startsWith('light');
    let iconColor = isLight ? 'tw-text-amber-400' : 'tw-text-slate-400';
    if (obj.name === 'avatarCamera') iconColor = 'tw-text-blue-400';

    jQuery('#hierarchy-viewer').append(
        '<li class="hierarchyItem tw-flex tw-items-center tw-gap-2 tw-py-1.5 tw-px-2 tw-border-b tw-border-slate-200/60 hover:tw-bg-blue-50/70 tw-cursor-pointer tw-transition-colors" id="' + obj.uuid + '" data-name="' + obj.name + '">' +
        '<i data-lucide="' + iconName + '" class="tw-w-4 tw-h-4 tw-flex-shrink-0 ' + iconColor + '"></i>' +
        '<a href="javascript:void(0);" class="tw-flex-1 tw-min-w-0 tw-truncate tw-text-[9pt] tw-leading-tight tw-text-slate-700 tw-no-underline" ' +
        'title="' + (obj.title || object_name) + '" onclick="onMouseDoubleClickFocus(event,\'' + obj.uuid + '\')">' +
        '<span class="tw-font-medium">' + object_name + '</span>' +
        (created ? '<br/><span class="tw-text-[7pt] tw-text-slate-400 tw-font-normal">' + created + '</span>' : '') +
        '</a>' +
        '<span class="tw-flex tw-items-center tw-gap-0.5 tw-flex-shrink-0">' +
        deleteButtonHTML +
        resetButtonHTML +
        lockButtonHTML +
        '</span>' +
        '</li>');
}


function CreateDeleteButton(obj) {
    return '<a href="javascript:void(0);" class="tw-p-1 tw-text-slate-500 hover:tw-text-red-500 tw-transition-colors" aria-label="Delete asset"' +
        ' title="Delete asset object" onclick="' + 'deleteFomScene(\'' + obj.uuid + '\', \'' + obj.asset_name + '\');' + '">' +
        '<i data-lucide="trash-2" class="tw-w-4 tw-h-4"></i>' + '</a>';
}


function CreateLockButton(obj) {
    let lock_ic = (obj.locked) ? 'lock' : 'lock-open';
    return '<a href="javascript:void(0);" class="tw-p-1 tw-text-slate-500 hover:tw-text-slate-700 tw-transition-colors" aria-label="Lock asset"' +
        ' title="Lock asset object" onclick="' + 'lockOnScene(\'' + obj.uuid + '\', \'' + obj.asset_name + '\');' + '">' +
        '<i data-lucide="' + lock_ic + '" class="tw-w-4 tw-h-4"></i>' + '</a>';
}

function CreateResetButton(obj){

    return '<a href="javascript:void(0);" class="tw-p-1 tw-text-slate-500 hover:tw-text-blue-500 tw-transition-colors" aria-label="Reset asset"' +
        ' title="Reset asset object" onclick="' +
        'resetInScene(\'' + obj.name + '\');'
        + '">' +
        '<i data-lucide="refresh-cw" class="tw-w-4 tw-h-4"></i>' +
        '</a>';

}

// Highlight item in Hierarchy viewer
function setBackgroundColorHierarchyViewer(id) {

    jQuery('#hierarchy-viewer li').each(
        function (idx, li) {
            jQuery(li)[0].style.background = '';
        }
    );

    document.getElementById(id).style.background = 'rgb(191, 219, 254)';
}

// Traverse the entire scene to insert scene children in Hierarchy Viewer
function setHierarchyViewer() {

    jQuery('#hierarchy-viewer').empty();
    let editorObject = transform_controls.object;

   
    // if (editorObject.locked){
    //     transform_controls.detach();
    // }


    envir.scene.traverse(function (obj) {

        // SunSphere mesh is not needed a handler to move
        if (obj.name === "SunSphere" || obj.name === "SpotSphere" || obj.name === "ambientSphere")
            return;

        if (obj.isSelectableMesh || obj.name === "avatarCamera") {

            let asset_name = _hierarchyDisplayName(obj);

            let created = obj.name === 'avatarCamera' ? "" : unixTimestamp_to_time(
                obj.name.substring(obj.name.length - 10, obj.name.length));

            let deleteButton = obj['category_name'] === "lightTargetSpot" || obj.name === 'avatarCamera' ? "" :
                CreateDeleteButton(obj);

            let lockButton = obj['category_name'] === "lightTargetSpot" || obj.name === 'avatarCamera' ? "" :
                CreateLockButton(obj);

            // Add as a list item
            AppendObject(obj, asset_name, created, deleteButton, CreateResetButton(obj),  lockButton);
        }
    });

    // Render Lucide icons in dynamically added items
    if (typeof lucide !== 'undefined') lucide.createIcons();
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
