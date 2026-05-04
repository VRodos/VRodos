/**
 * Create Game:
 *  1. Create Game Project
 *  2. Create Default scenes
 *
 *  All the above are encompassed in     vrodos_create_gameproject_frontend($game_id)
 */
VRODOS.api.isCreateProjectPending = false;
VRODOS.api.createProject = function(project_title, project_type_slug, current_user_id, parameter_Scenepass) {
	if (VRODOS.api.isCreateProjectPending) return;
	VRODOS.api.isCreateProjectPending = true;

	fetch( vrodos_project_manager_data.isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_creategame.ajax_url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			'action': 'vrodos_create_project_action',
			project_title,
			project_type_slug
		})
	})
	.then( (response) => response.text())
	.then( (new_project_id) => {

		VRODOS.api.isCreateProjectPending = false;
		console.log( "Game project has been successfully created" );

		document.getElementById( 'createNewProjectBtn' ).style.display = '';
		document.getElementById( 'create-game-progress-bar' ).style.display = 'none';

		VRODOS.api.fetchAllProjectsAndAddToDOM( current_user_id, parameter_Scenepass, new_project_id );

	})
	.catch( (err) => {

		VRODOS.api.isCreateProjectPending = false;
		document.getElementById( 'createNewProjectBtn' ).style.display = '';
		document.getElementById( 'create-game-progress-bar' ).style.display = 'none';

		console.log( `Ajax Create Game: ERROR: 169 ${  err}` );
	});
}


VRODOS.api.fetchAllProjectsAndAddToDOM = function(current_user_id, parameter_Scenepass, new_project_id=-1, is_initial_load = false){

	fetch( vrodos_project_manager_data.isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_creategame.ajax_url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			'action': 'vrodos_fetch_list_projects_action',
			current_user_id,
			parameter_Scenepass,
			is_initial_load
		})
	})
	.then( (response) => response.text())
	.then( (domhtml) => {

		// Add list to div
		document.getElementById( 'ExistingProjectsDivDOM' ).innerHTML = domhtml;

		// Update projects count
		const listContainer = document.getElementById('vrodos-list-projects-container');
		if (listContainer) {
			const count = listContainer.getAttribute('data-project-count');
			const indicator = document.getElementById('projects-count-indicator');
			if (indicator) indicator.textContent = count;
		}

		// Initialize Lucide icons
		lucide.createIcons();

		// Open the project automatically
		if (new_project_id > -1) {
			const btn = document.getElementById( `3d-editor-bt-${  new_project_id}` );
			if (btn) btn.click();
		}

	})
	.catch( (err) => {
		console.log( `Ajax Fetch List Projects Error: ERROR: 170 ${  err}` );
	});

}
