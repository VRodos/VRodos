/**
 * Create Game:
 *  1. Create Game Project
 *  2. Create Default scenes
  *
 *  All the above are encompassed in     vrodos_create_gameproject_frontend($game_id)
 */
function vrodos_createProjectAjax(project_title, project_type, current_user_id, parameter_Scenepass) {

    console.log("project_type", project_type);

    jQuery.ajax({
        url: isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_creategame.ajax_url,
        type: 'POST',
        data: {
            'action': 'vrodos_create_project_action',
            'project_title': project_title,
            'project_type_radio': project_type
        },
        success: function (res) {

            console.log("Game project has been successfully created");

            jQuery('#createNewProjectBtn').show();
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
