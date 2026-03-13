/**
 * Create Game:
 *  1. Create Game Project
 *  2. Create Default scenes
 *
 *  All the above are encompassed in     vrodos_create_gameproject_frontend($game_id)
 */
function vrodos_createProjectAjax(project_title, project_type_slug, current_user_id, parameter_Scenepass) {

	jQuery.ajax(
		{
			url: vrodos_project_manager_data.isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_creategame.ajax_url,
			type: 'POST',
			data: {
				'action': 'vrodos_create_project_action',
				'project_title': project_title,
				'project_type_slug': project_type_slug
			},
			success: function (new_project_id) {

				console.log( "Game project has been successfully created" );

				jQuery( '#createNewProjectBtn' ).show();
				jQuery( '#create-game-progress-bar' ).hide();

				fetchAllProjectsAndAddToDOM( current_user_id, parameter_Scenepass, new_project_id );

			},
			error: function (xhr, ajaxOptions, thrownError) {

				// jQuery('#delete-dialog-progress-bar').hide();
				//
				// jQuery( "#deleteGameBtn" ).removeClass( "LinkDisabled" );
				// jQuery( "#cancelDeleteGameBtn" ).removeClass( "LinkDisabled" );

				// alert("Could not create game");

				console.log( "Ajax Create Game: ERROR: 169" + thrownError );
				console.log( thrownError )

			}
		}
	);
}


function fetchAllProjectsAndAddToDOM(current_user_id, parameter_Scenepass, new_project_id=-1, is_initial_load = false){

	jQuery.ajax(
		{
			url: vrodos_project_manager_data.isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_creategame.ajax_url,
			type: 'POST',
			data: {
				'action': 'vrodos_fetch_list_projects_action',
				'current_user_id': current_user_id,
				'parameter_Scenepass': parameter_Scenepass,
                'is_initial_load': is_initial_load
			},
			success: function (domhtml) {

				// Add list to div
				document.getElementById( 'ExistingProjectsDivDOM' ).innerHTML = domhtml;
                
                // Update projects count
                let listContainer = document.getElementById('vrodos-list-projects-container');
                if (listContainer) {
                    let count = listContainer.getAttribute('data-project-count');
                    let indicator = document.getElementById('projects-count-indicator');
                    if (indicator) indicator.innerHTML = count;
                }

                // Initialize Lucide icons
                lucide.createIcons();

				// Open the project automatically
				if (new_project_id > -1) {
					jQuery( "#3d-editor-bt-" + new_project_id )[0].click();
				}

			},
			error: function (xhr, ajaxOptions, thrownError) {
				console.log( "Ajax Fetch List Projects Error: ERROR: 170" + thrownError );
				console.log( thrownError )
			}
		}
	);

}
