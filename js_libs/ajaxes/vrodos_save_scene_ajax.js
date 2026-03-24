function vrodos_saveSceneAjax() {

	let postdata = new URLSearchParams({
		'action': 'vrodos_save_scene_async_action',
		'scene_id': isAdmin == "back" ? phpmyvarC.scene_id : my_ajax_object_savescene.scene_id,
		'scene_json': document.getElementById( "vrodos_scene_json_input" ).value,
		'scene_title': document.getElementById( "sceneTitleInput" ).value,
		'scene_caption': document.getElementById( "sceneCaptionInput" ).value
	});

	if (new_screenshot_data) {
		postdata.append( 'scene_screenshot', new_screenshot_data );
		new_screenshot_data = null;
	}

	fetch( isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_savescene.ajax_url, {
		method: 'POST',
		body: postdata
	})
	.then( function (response) { return response.text(); })
	.then( function (data) {

		let save_scene_btn       = document.getElementById( "save-scene-button" );
		save_scene_btn.innerHTML = "All changes saved";

		let enableSaveFunctionality = function () {
			save_scene_btn.innerHTML = "Save Scene";
			save_scene_btn.classList.remove( "LinkDisabled" );
			document.getElementById( "compileGameBtn" ).disabled = false;
		};
		document.getElementById( "compileGameBtn" ).disabled = true;
		setTimeout( enableSaveFunctionality, 2000 );
	})
	.catch( function (err) {

		console.log( "Ajax Save Scene: ERROR: 156 - " + err );
		alert( "Save Scene Error - " + err );

		let saveBtn = document.getElementById( 'save-scene-button' );
		saveBtn.innerHTML = "Save scene";
		saveBtn.classList.remove( "LinkDisabled" );
	});
}


function _resetUndoRedoButtons() {
	let undoBtn = document.getElementById( 'undo-scene-button' );
	let redoBtn = document.getElementById( 'redo-scene-button' );
	undoBtn.innerHTML = "<i data-lucide='undo-2'></i>";
	undoBtn.classList.remove( "LinkDisabled" );
	redoBtn.innerHTML = "<i data-lucide='redo-2'></i>";
	redoBtn.classList.remove( "LinkDisabled" );
	if (typeof lucide !== 'undefined') lucide.createIcons();
}


function vrodos_undoSceneAjax(UPLOAD_DIR, post_revision_no_in) {

	fetch( isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_savescene.ajax_url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			'action': 'vrodos_undo_scene_async_action',
			'scene_id': isAdmin == "back" ? phpmyvarC.scene_id : my_ajax_object_savescene.scene_id,
			'UPLOAD_DIR': UPLOAD_DIR,
			'post_revision_no': post_revision_no_in
		})
	})
	.then( function (response) { return response.text(); })
	.then( function (scene_json) {
		_resetUndoRedoButtons();
		parseJSON_LoadScene( scene_json );
	})
	.catch( function (err) {
		console.log( "Ajax Undo Scene: ERROR: 158 - " + err );
		_resetUndoRedoButtons();
	});
}

function vrodos_redoSceneAjax(UPLOAD_DIR, post_revision_no_in) {

	fetch( isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_savescene.ajax_url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			'action': 'vrodos_redo_scene_async_action',
			'scene_id': isAdmin == "back" ? phpmyvarC.scene_id : my_ajax_object_savescene.scene_id,
			'UPLOAD_DIR': UPLOAD_DIR,
			'post_revision_no': post_revision_no_in
		})
	})
	.then( function (response) { return response.text(); })
	.then( function (scene_json) {
		_resetUndoRedoButtons();
		parseJSON_LoadScene( scene_json );
	})
	.catch( function (err) {
		console.log( "Ajax Redo Scene: ERROR: 158 - " + err );
		_resetUndoRedoButtons();
	});
}
