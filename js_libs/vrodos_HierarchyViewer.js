function AppendObject(obj, game_object_nameA_assetName, game_object_nameB_dateCreated, deleteButtonHTML, resetButtonHTML){

    jQuery('#hierarchy-viewer').append(
        '<li class="hierarchyItem mdc-list-item" id="' + obj.name + '">' +
        '<a href="javascript:void(0);" class="hierarchyItem mdc-list-item" ' +
        'style="font-size: 9pt; line-height:12pt" ' +
        'data-mdc-auto-init="MDCRipple" title="" onclick="onMouseDoubleClickFocus(event,\'' + obj.name + '\')">' +
        '<span id="" class="mdc-list-item__text">' +
        game_object_nameA_assetName + '<br />' +
        '<span style="font-size:7pt; color:grey">' + game_object_nameB_dateCreated + '</span>' +
        '</span>' +
        '</a>' +
        deleteButtonHTML +
        resetButtonHTML +
        '</li>');
}


function CreateDeleteButton(obj){

    let deleteButton = '<a href="javascript:void(0);" class="hierarchyItemDelete mdc-list-item" aria-label="Delete asset"' + ' title="Delete asset object" onclick="' + 'deleterFomScene(\'' + obj.name + '\');' + '">' +
        '<i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Delete">delete </i>' + '</a>';

    return deleteButton;
}

// Highlight item in Hierarchy viewer
function setBackgroundColorHierarchyViewer(name) {

    jQuery('#hierarchy-viewer li').each(
        function (idx, li) {
            jQuery(li)[0].style.background = 'rgb(244, 244, 244)';
        }
    );

    console.log("name", name);

    jQuery('#hierarchy-viewer').find('#' + name)[0].style.background = '#a4addf';
}

// Traverse the entire scene to insert scene children in Hierarchy Viewer
function setHierarchyViewer() {

    jQuery('#hierarchy-viewer').empty();

    envir.scene.traverse(function (obj) {
        if (obj.isSelectableMesh || obj.name === "avatarCamera") {

            // Make the html for the delete button Avatar should not be deleted
            let deleteButtonHTML = CreateDeleteButton(obj);
            let resetButtonHTML = '';

            // SunSphere mesh is not needed a handler to move
            if (obj.name === "SunSphere" || obj.name === "SpotSphere" || obj.name === "ambientSphere")
                return;

            // Normal assets (Non avatar, nor Sun)
            if (obj.name !== 'avatarCamera') {

                // Split the object name into 2 parts: The first part is the asset name and the second the date inserted in the scene
                var game_object_nameA_assetName = obj.assetname; // obj.name.substring(0, obj.name.length - 11);

                var game_object_nameB_dateCreated = unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));

            } else if (obj.name === 'avatarCamera') {
                // AVATAR

                resetButtonHTML =
                    '<a href="javascript:void(0);" class="mdc-list-item" aria-label="Reset asset"' +
                    ' title="Reset asset object" onclick="' +
                    // Reset 0,0,0 rot 0,0,0
                    'resetInScene(\'' + obj.name + '\');'
                    + '">' +
                    '<i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Reset">cached </i>' +
                    '</a>';

                var game_object_nameA_assetName = "Director";
                var game_object_nameB_dateCreated = "";
            }

            // Add as a list item

            if (obj.categoryName !== "lightTargetSpot") {

                AppendObject(obj, game_object_nameA_assetName, game_object_nameB_dateCreated, deleteButtonHTML, resetButtonHTML);
            } else {
                AppendObject(obj, game_object_nameA_assetName, game_object_nameB_dateCreated,"","");
            }
        }
    });
}






// Single object add in Hierarchy
function addInHierarchyViewer(obj) {

    let resetButtonHTML = '';

    // ALL but the lightTargetSpot
    if (obj.categoryName !== 'lightTargetSpot') {

        // ADD in the Hierarchy viewer
        var deleteButtonHTML = CreateDeleteButton(obj);

        var game_object_nameA_assetName = obj.assetname; // .name.substring(0, obj.name.length - 11);
        var game_object_nameB_dateCreated = unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));

        // Add as a list item
        AppendObject(obj, game_object_nameA_assetName, game_object_nameB_dateCreated, deleteButtonHTML, resetButtonHTML);

    } else {
        // lightTargetSpot

        // lightTargetSpot without the timestamp
        var game_object_nameA_assetName = obj.name.substring(0, obj.name.length - 11); //.substring(0, obj.name.length - 11);

        // The timestamp
        var game_object_nameB_dateCreated = unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));

        AppendObject(obj, game_object_nameA_assetName, game_object_nameB_dateCreated ,"","");
    }
}
