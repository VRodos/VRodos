/**
 * Create Game:
 *  1. Create Game Project
 *  2. Create Default scenes
  *
 *  All the above are encompassed in     wpunity_create_gameproject_frontend($game_id)
 */
function wpunity_createGameAjax(game_project_title, game_project_type_radio,
                                current_user_id, parameter_Scenepass) {

    console.log(game_project_title, game_project_type_radio,
        current_user_id, parameter_Scenepass);

    jQuery.ajax({
        url: isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_creategame.ajax_url,
        type: 'POST',
        data: {
            'action': 'vrodos_create_game_action',
            'game_project_title': game_project_title,
            'game_project_type_radio': game_project_type_radio
        },
        success: function (res) {

            console.log("Game project has been successfully created");

            jQuery('#createNewGameBtn').show();
            jQuery('#create-game-progress-bar').hide();

            // ajax add project to list

            //location.reload();

            fetchAllProjectsAndAddToDOM(current_user_id, parameter_Scenepass);
    },
        error: function (xhr, ajaxOptions, thrownError) {

            // jQuery('#delete-dialog-progress-bar').hide();
            //
            // jQuery( "#deleteGameBtn" ).removeClass( "LinkDisabled" );
            // jQuery( "#cancelDeleteGameBtn" ).removeClass( "LinkDisabled" );

            //alert("Could not create game");

            console.log("Ajax Create Game: ERROR: 169" + thrownError);

            console.log(thrownError)

        }
    });
}


function fetchAllProjectsAndAddToDOM(current_user_id, parameter_Scenepass){



    jQuery.ajax({
        url: isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_creategame.ajax_url,
        type: 'POST',
        data: {
            'action': 'vrodos_fetch_list_projects_action',
            'current_user_id': current_user_id,
            'parameter_Scenepass': parameter_Scenepass
        },
        success: function (res) {

            // Add list to div
            document.getElementById('ExistingProjectsDivDOM').innerHTML = res;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log("Ajax Fetch List Projects Error: ERROR: 170" + thrownError);
            console.log(thrownError)
        }
    });


}
