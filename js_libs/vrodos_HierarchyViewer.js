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

function AppendObject(obj, object_name, created, deleteButtonHTML, resetButtonHTML, lockButtonHTML){

    jQuery('#hierarchy-viewer').append(
        '<li class="hierarchyItem tw-flex tw-items-center tw-py-1 tw-px-1 tw-border-b tw-border-slate-300 hover:tw-bg-slate-300/50 tw-cursor-pointer" id="' + obj.uuid + '" data-name="' +obj.name+'">' +
        '<a href="javascript:void(0);" class="tw-flex-1 tw-min-w-0 tw-text-[9pt] tw-leading-[12pt] tw-text-slate-700 tw-no-underline" ' +
        'title="'+ obj.title +'" onclick="onMouseDoubleClickFocus(event,\'' + obj.uuid + '\')">' +
        '<span>' +
        object_name + '<br />' +
        '<span class="tw-text-[7pt] tw-text-slate-400">' + created + '</span>' +
        '</span>' +
        '</a>' +
        deleteButtonHTML +
        resetButtonHTML +
        lockButtonHTML +
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

            let asset_name = obj.name === 'avatarCamera' ? "Director" : obj.asset_name;

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

    let asset_name = obj['category_name'] !== 'lightTargetSpot' ? obj['asset_name'] : obj.name.substring(0, obj.name.length - 11);

    let created = unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));

    let deleteButton = obj['category_name'] === "lightTargetSpot" ? "" : CreateDeleteButton(obj);

    // Add as a list item
    AppendObject(obj, asset_name, created, deleteButton, CreateResetButton(obj), CreateLockButton(obj));

    // Render Lucide icons in dynamically added items
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setBackgroundColorHierarchyViewer(obj.uuid);
}
