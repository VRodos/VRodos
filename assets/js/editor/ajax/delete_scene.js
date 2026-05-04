/**
 * Delete Scene
 *
 * Parameters from javascript
 * scene_id : the scene to delete
 * vrodos_deleteSceneAjax()
 */
function vrodos_deleteSceneAjax(scene_id, url_scene_redirect) {

	fetch( my_ajax_object_deletescene.ajax_url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			'action': 'vrodos_delete_scene_action',
			scene_id,
			url_scene_redirect
		})
	})
	.then( (response) => response.text())
	.then( (res) => {

		console.log( `Scene with title=${  res  } was succesfully deleted` );

		document.getElementById( 'delete-scene-dialog-progress-bar' ).style.display = 'none';
		document.getElementById( 'deleteSceneDialogDeleteBtn' ).classList.remove( 'LinkDisabled' );
		document.getElementById( 'deleteSceneDialogCancelBtn' ).classList.remove( 'LinkDisabled' );

		const dlg = document.getElementById('delete-dialog');
		if (dlg && dlg.open) dlg.close();

		const sceneEl = document.getElementById( `scene-${  scene_id}` );
		if (sceneEl) {
			sceneEl.style.transition = 'opacity 0.3s';
			sceneEl.style.opacity = '0';
			setTimeout( () => { sceneEl.remove(); }, 300 );
		}

		window.location.replace( url_scene_redirect );

	})
	.catch( (err) => {

		document.getElementById( 'delete-scene-dialog-progress-bar' ).style.display = 'none';
		document.getElementById( 'deleteSceneDialogDeleteBtn' ).classList.remove( 'LinkDisabled' );
		document.getElementById( 'deleteSceneDialogCancelBtn' ).classList.remove( 'LinkDisabled' );

		alert( "Could not delete scene. Try deleting it from the administration panel." );
		console.log( `Ajax Delete Scene: ERROR: 167 ${  err}` );
	});

}
