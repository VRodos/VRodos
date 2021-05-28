/**
 * Delete Game:
 *  1. Cascade delete Assets, Scenes and Game.
 *  2. Delete also taxonomies: Game name as Scene taxonomy, Game name as Asset taxonomy
 *  3. Delete also uploads related to the certain game
 *
 *  All the above are encompassed in     vrodos_delete_gameproject_frontend($game_id)
 */
function vrodos_deleteGameAjax(game_id, dialog, current_user_id, parameter_Scenepass) {

    jQuery.ajax({
        url: my_ajax_object_deletegame.ajax_url,
        type: 'POST',
        data: {
            'action': 'vrodos_delete_game_action',
            'game_id': game_id
        },
        success: function (res) {

            jQuery('#delete-dialog-progress-bar').hide();
            jQuery( "#deleteGameBtn" ).removeClass( "LinkDisabled" );
            jQuery( "#cancelDeleteGameBtn" ).removeClass( "LinkDisabled" );

            fetchAllProjectsAndAddToDOM(current_user_id, parameter_Scenepass);

            dialog.close();

        },
        error: function (xhr, ajaxOptions, thrownError) {

            jQuery('#delete-dialog-progress-bar').hide();

            jQuery( "#deleteGameBtn" ).removeClass( "LinkDisabled" );
            jQuery( "#cancelDeleteGameBtn" ).removeClass( "LinkDisabled" );

            alert("Could not delete game. Try deleting it from the administration panel");

            console.log("Ajax Delete Game: ERROR: 166" + thrownError);
        }
    });

}
