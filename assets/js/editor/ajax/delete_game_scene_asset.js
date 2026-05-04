/**
 * Delete Game:
 *  1. Cascade delete Assets, Scenes and Game.
 *  2. Delete also taxonomies: Game name as Scene taxonomy, Game name as Asset taxonomy
 *  3. Delete also uploads related to the certain game
 *
 *  All the above are encompassed in     vrodos_delete_gameproject_frontend($game_id)
 */
VRODOS.api.isDeleteProjectPending = false;
VRODOS.api.deleteProject = function(game_id, dialog, current_user_id, parameter_Scenepass) {
	if (VRODOS.api.isDeleteProjectPending) return;
	VRODOS.api.isDeleteProjectPending = true;

	fetch( my_ajax_object_deletegame.ajax_url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			'action': 'vrodos_delete_game_action',
			game_id
		})
	})
	.then( (response) => response.text())
	.then( (res) => {

		VRODOS.api.isDeleteProjectPending = false;
		const progressBar = document.getElementById( 'delete-dialog-progress-bar' );
		if (progressBar) progressBar.style.display = 'none';
		const confirmBtn = document.getElementById( 'deleteProjectBtn' );
		if (confirmBtn) confirmBtn.classList.remove( 'LinkDisabled' );
		const cancelBtn = document.getElementById( 'canceldeleteProjectBtn' );
		if (cancelBtn) cancelBtn.classList.remove( 'LinkDisabled' );

		VRODOS.api.fetchAllProjectsAndAddToDOM( current_user_id, parameter_Scenepass );

		dialog.close();

	})
	.catch( (err) => {

		VRODOS.api.isDeleteProjectPending = false;
		const progressBar = document.getElementById( 'delete-dialog-progress-bar' );
		if (progressBar) progressBar.style.display = 'none';
		const confirmBtn = document.getElementById( 'deleteProjectBtn' );
		if (confirmBtn) confirmBtn.classList.remove( 'LinkDisabled' );
		const cancelBtn = document.getElementById( 'canceldeleteProjectBtn' );
		if (cancelBtn) cancelBtn.classList.remove( 'LinkDisabled' );

		alert( "Could not delete game. Try deleting it from the administration panel" );
		console.log( `Ajax Delete Game: ERROR: 166 ${  err}` );
	});

}
