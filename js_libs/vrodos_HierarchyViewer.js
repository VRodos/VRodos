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
        '<li class="hierarchyItem mdc-list-item" id="' + obj.uuid + '" data-name="' +obj.name+'">' +
        '<a href="javascript:void(0);" class="hierarchyItem mdc-list-item" ' +
        'style="font-size: 9pt; line-height:12pt" ' +
        'data-mdc-auto-init="MDCRipple" title="'+ obj.title +'" onclick="onMouseDoubleClickFocus(event,\'' + obj.uuid + '\')">' +
        '<span id="" class="mdc-list-item__text">' +
        object_name + '<br />' +
        '<span style="font-size:7pt; color:grey">' + created + '</span>' +
        '</span>' +
        '</a>' +
        deleteButtonHTML +
        resetButtonHTML +
        lockButtonHTML +
        '</li>');
}


function CreateDeleteButton(obj) {
    return '<a href="javascript:void(0);" class="hierarchyItemDelete mdc-list-item" aria-label="Delete asset"' +
        ' title="Delete asset object" onclick="' + 'deleteFomScene(\'' + obj.uuid + '\', \'' + obj.asset_name + '\');' + '">' +
        '<i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Delete">delete </i>' + '</a>';
}


function CreateLockButton(obj) {
    let lock_ic;
    lock_ic = (obj.locked) ? 'lock_outline' : 'lock_open';
    return '<a href="javascript:void(0);" class="hierarchyItemLock mdc-list-item" aria-label="Lock asset"' +
        ' title="Lock asset object" onclick="' + 'lockOnScene(\'' + obj.uuid + '\', \'' + obj.asset_name + '\');' + '">' +
        '<i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Lock">' + lock_ic + ' </i>' + '</a>';
}

function CreateResetButton(obj){

    return '<a href="javascript:void(0);" class="mdc-list-item" aria-label="Reset asset"' +
        ' title="Reset asset object" onclick="' +
        // Reset 0,0,0 rot 0,0,0
        'resetInScene(\'' + obj.name + '\');'
        + '">' +
        '<i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Reset">cached</i>' +
        '</a>';

}

// Highlight item in Hierarchy viewer
function setBackgroundColorHierarchyViewer(id) {

    jQuery('#hierarchy-viewer li').each(
        function (idx, li) {
            jQuery(li)[0].style.background = 'rgb(223, 223, 223)';
        }
    );

    document.getElementById(id).style.background = '#a4addf';
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
}



// Single object add in Hierarchy
function addInHierarchyViewer(obj) {

    let asset_name = obj['category_name'] !== 'lightTargetSpot' ? obj['asset_name'] : obj.name.substring(0, obj.name.length - 11);

    let created = unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));

    let deleteButton = obj['category_name'] === "lightTargetSpot" ? "" : CreateDeleteButton(obj);

    // Add as a list item
    AppendObject(obj, asset_name, created, deleteButton, CreateResetButton(obj), CreateLockButton(obj));

    setBackgroundColorHierarchyViewer(obj.uuid);
}
