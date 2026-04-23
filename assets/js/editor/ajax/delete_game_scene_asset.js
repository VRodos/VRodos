/**
 * Delete Game:
 *  1. Cascade delete Assets, Scenes and Game.
 *  2. Delete also taxonomies: Game name as Scene taxonomy, Game name as Asset taxonomy
 *  3. Delete also uploads related to the certain game
 *
 *  All the above are encompassed in     vrodos_delete_gameproject_frontend($game_id)
 */
let _deleteGamePending = false;
function vrodos_deleteGameAjax(game_id, dialog, current_user_id, parameter_Scenepass) {
	if (_deleteGamePending) return;
	_deleteGamePending = true;

	fetch( my_ajax_object_deletegame.ajax_url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			'action': 'vrodos_delete_game_action',
			'game_id': game_id
		})
	})
	.then( function (response) { return response.text(); })
	.then( function (res) {

		_deleteGamePending = false;
		let progressBar = document.getElementById( 'delete-dialog-progress-bar' );
		if (progressBar) progressBar.style.display = 'none';
		let confirmBtn = document.getElementById( 'deleteProjectBtn' );
		if (confirmBtn) confirmBtn.classList.remove( 'LinkDisabled' );
		let cancelBtn = document.getElementById( 'canceldeleteProjectBtn' );
		if (cancelBtn) cancelBtn.classList.remove( 'LinkDisabled' );

		fetchAllProjectsAndAddToDOM( current_user_id, parameter_Scenepass );

		dialog.close();

	})
	.catch( function (err) {

		_deleteGamePending = false;
		let progressBar = document.getElementById( 'delete-dialog-progress-bar' );
		if (progressBar) progressBar.style.display = 'none';
		let confirmBtn = document.getElementById( 'deleteProjectBtn' );
		if (confirmBtn) confirmBtn.classList.remove( 'LinkDisabled' );
		let cancelBtn = document.getElementById( 'canceldeleteProjectBtn' );
		if (cancelBtn) cancelBtn.classList.remove( 'LinkDisabled' );

		alert( "Could not delete game. Try deleting it from the administration panel" );
		console.log( "Ajax Delete Game: ERROR: 166 " + err );
	});

}
