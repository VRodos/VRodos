/**
 * Delete Scene
 *
 * Parameters from javascript
 * scene_id : the scene to delete
 * wpunity_deleteSceneAjax()
 *
 */
function wpunity_deleteSceneAjax(scene_id, url_scene_redirect) {

    jQuery.ajax({
        url: my_ajax_object_deletescene.ajax_url,
        type: 'POST',
        data: {
            'action': 'vrodos_delete_scene_action',
            'scene_id': scene_id,
            'url_scene_redirect': url_scene_redirect
        },
        success: function (res) {

            console.log("Scene with title=" + res + " was succesfully deleted");

            jQuery('#delete-scene-dialog-progress-bar').hide();
            jQuery( "#deleteSceneDialogDeleteBtn" ).removeClass( "LinkDisabled" );
            jQuery( "#deleteSceneDialogCancelBtn" ).removeClass( "LinkDisabled" );

            deleteDialog.close();

            jQuery( "#scene-" + scene_id).fadeOut(300, function() { jQuery(this).remove(); });

            window.location.replace(url_scene_redirect);

        },
        error: function (xhr, ajaxOptions, thrownError) {

            jQuery('#delete-scene-dialog-progress-bar').hide();

            jQuery( "#deleteSceneDialogDeleteBtn" ).removeClass( "LinkDisabled" );
            jQuery( "#deleteSceneDialogCancelBtn" ).removeClass( "LinkDisabled" );

            alert("Could not delete game. Try deleting it from the administration panel");

            console.log("Ajax Delete Scene: ERROR: 167" + thrownError);
        }
    });

}
