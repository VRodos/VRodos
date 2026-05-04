VRODOS.api.sceneSavePromise = Promise.resolve();
VRODOS.api.isSceneSavePending = false;

VRODOS.api.whenSceneSaveSettles = function() {
	return VRODOS.api.sceneSavePromise || Promise.resolve();
}

VRODOS.api.saveScene = function() {

	const postdata = new URLSearchParams({
		'action': 'vrodos_save_scene_async_action',
		'scene_id': VRODOS.config.sceneId,
		'scene_json': document.getElementById( "vrodos_scene_json_input" ).value,
		'scene_title': document.getElementById( "sceneTitleInput" ).value,
		'scene_caption': document.getElementById( "sceneCaptionInput" ).value
	});

	let pendingScreenshotData = null;
	if (VRODOS.api.newScreenshotData) {
		pendingScreenshotData = VRODOS.api.newScreenshotData;
		postdata.append( 'scene_screenshot', pendingScreenshotData );
	}

	VRODOS.api.isSceneSavePending = true;

	VRODOS.api.sceneSavePromise = fetch( VRODOS.config.isAdmin === "back" ? 'admin-ajax.php' : VRODOS.config.ajax_url, {
		method: 'POST',
		body: postdata
	})
	.then( (response) => response.text())
	.then( (data) => {

		const save_scene_btn       = document.getElementById( "save-scene-button" );
		save_scene_btn.innerHTML = "All changes saved";

		const enableSaveFunctionality = function () {
			save_scene_btn.innerHTML = "Save Scene";
			save_scene_btn.classList.remove( "LinkDisabled" );
			document.getElementById( "compileGameBtn" ).disabled = false;
		};
		document.getElementById( "compileGameBtn" ).disabled = true;
		setTimeout( enableSaveFunctionality, 2000 );
		if (pendingScreenshotData && VRODOS.api.newScreenshotData === pendingScreenshotData) {
			VRODOS.api.newScreenshotData = null;
		}
		return data;
	})
	.catch( (err) => {

		console.log( `Ajax Save Scene: ERROR: 156 - ${  err}` );
		alert( `Save Scene Error - ${  err}` );

		const saveBtn = document.getElementById( 'save-scene-button' );
		saveBtn.innerHTML = "Save scene";
		saveBtn.classList.remove( "LinkDisabled" );
		throw err;
	})
	.finally( () => {
		VRODOS.api.isSceneSavePending = false;
	});

	return VRODOS.api.sceneSavePromise;
}
