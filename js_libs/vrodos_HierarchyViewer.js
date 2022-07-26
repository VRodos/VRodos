// Traverse the entire scene to insert scene children in Hierarchy Viewer
function setHierarchyViewer() {

    jQuery('#hierarchy-viewer').empty();

    envir.scene.traverse(function (obj) {
        if (obj.isSelectableMesh || obj.name === "avatarCamera") {

            // Make the html for the delete button Avatar should not be deleted
            var deleteButtonHTML = '';
            var resetButtonHTML = '';

            // SunSphere mesh is not needed a handler to move
            if (obj.name === "SunSphere")
                return;

            // Normal assets (Non avatar, nor Sun)
            if (obj.name != 'avatarCamera' && obj.categoryName != 'lightSun' && obj.categoryName != "lightTargetSpot") {

                deleteButtonHTML =
                    '<a href="javascript:void(0);" class="mdc-list-item" aria-label="Delete asset"' +
                    ' title="Delete asset object" onclick="' + 'deleterFomScene(\'' + obj.name + '\');' + '">' +
                    '<i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Delete">delete </i>' +
                    '</a>';

                // Split the object name into 2 parts: The first part is the asset name and the second the date inserted in the scene
                var game_object_nameA_assetName = obj.name.substring(0, obj.name.length - 11);

                var game_object_nameB_dateCreated = unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));


            } else if (obj.categoryName === 'lightSun' ) {
                // SUN

                deleteButtonHTML =
                    '<a href="javascript:void(0);" class="mdc-list-item" aria-label="Delete asset"' +
                    ' title="Delete asset object" onclick="' +
                    // Delete object from scene and remove it from the hierarchy viewer
                    'deleterFomScene(\'' + obj.name + '\');'
                    + '">' +
                    '<i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Delete">delete </i>' +
                    '</a>';

                var game_object_nameA_assetName = obj.name.substring(0, obj.name.length - 11);


                var game_object_nameB_dateCreated = unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));

                // Add lightTargetSpot
                // Add as a list item
                jQuery('#hierarchy-viewer').append(
                    '<li class="mdc-list-item" id="' + "lightTargetSpot_" + obj.name + '">' +
                    '<a href="javascript:void(0);" class="mdc-list-item" style="font-size: 9pt; line-height:12pt" ' +
                    'data-mdc-auto-init="MDCRipple" title="" onclick="onMouseDoubleClickFocus(event,\'' + "lightTargetSpot_" + obj.name + '\')">' +
                    '<span id="" class="mdc-list-item__text">' +
                    'lightTargetSpot_' + game_object_nameA_assetName + '<br />' +
                    '<span style="font-size:7pt; color:grey">' + game_object_nameB_dateCreated + '</span>' +
                    '</span>' +
                    '</a>' +
                    '</li>');


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

                var game_object_nameA_assetName = "Player";
                var game_object_nameB_dateCreated = "";
            }



            // Add as a list item

            if (obj.categoryName != "lightTargetSpot") {
                jQuery('#hierarchy-viewer').append(
                    '<li class="mdc-list-item" id="' + obj.name + '">' +
                    '<a href="javascript:void(0);" class="mdc-list-item" style="font-size: 9pt; line-height:12pt" ' +
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
        }
    });
}


// Highlight item in Hierarchy viewer
function setBackgroundColorHierarchyViewer(name) {

    jQuery('#hierarchy-viewer li').each(
        function (idx, li) {
            jQuery(li)[0].style.background = 'rgb(244, 244, 244)';
        }
    );


    jQuery('#hierarchy-viewer').find('#' + name)[0].style.background = '#a4addf';
}



// Single object add in Hierarchy
function addInHierarchyViewer(obj) {

    // ALL but the lightTargetSpot
    if (obj.categoryName != 'lightTargetSpot') {

        // ADD in the Hierarchy viewer
        var deleteButtonHTML =
            '<a href="javascript:void(0);" class="hierarchyItemDelete mdc-list-item" aria-label="Delete asset"' +
            ' title="Delete asset object" onclick="' +
            // Delete object from scene and remove it from the hierarchy viewer
            'deleterFomScene(\'' + obj.name + '\');'
            + '">' +
            '<i class="material-icons mdc-list-item__end-detail" aria-hidden="true" title="Delete">delete </i>' +
            '</a>';

        var game_object_nameA_assetName = obj.name.substring(0, obj.name.length - 11);
        var game_object_nameB_dateCreated = unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));

        // Add as a list item
        jQuery('#hierarchy-viewer').append(
            '<li class="hierarchyItem mdc-list-item" id="' + obj.name + '">' +
            '<a href="javascript:void(0);" class="hierarchyItemName mdc-list-item"  ' +
            'data-mdc-auto-init="MDCRipple" title="" onclick="onMouseDoubleClickFocus(event,\'' + obj.name + '\')">' +
            '<span id="" class="mdc-list-item__text">' +
            game_object_nameA_assetName + '<br />' +
            '<span style="font-size:7pt; color:grey">' + game_object_nameB_dateCreated + '</span>' +
            '</span>' +
            '</a>' +
            deleteButtonHTML +
            '</li>'
        );
    } else {
        // lightTargetSpot

        // lightTargetSpot without the timestamp
        var game_object_nameA_assetName = obj.name.substring(0, obj.name.length - 11); //.substring(0, obj.name.length - 11);

        // The timestamp
        var game_object_nameB_dateCreated = unixTimestamp_to_time(obj.name.substring(obj.name.length - 10, obj.name.length));

        // Add as a list item
        jQuery('#hierarchy-viewer').append(
            '<li class="hierarchyItem mdc-list-item" id="' + obj.name + '">' +
            '<a href="javascript:void(0);" class="hierarchyItemName mdc-list-item"  ' +
            'data-mdc-auto-init="MDCRipple" title="" onclick="onMouseDoubleClickFocus(event,\'' + obj.name + '\')">' +
            '<span id="" class="mdc-list-item__text">' +
            game_object_nameA_assetName + '<br />' +
            '<span style="font-size:7pt; color:grey">' + game_object_nameB_dateCreated + '</span>' +
            '</span>' +
            '</a>' +
            '' +
            '</li>'
        );
    }
}
