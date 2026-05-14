VRODOS.api.sceneSavePromise = Promise.resolve();
VRODOS.api.isSceneSavePending = false;
VRODOS.api.isSceneSaveQueued = false;
VRODOS.api.sceneSaveGeneration = 0;

VRODOS.api.whenSceneSaveSettles = function() {
	return VRODOS.api.sceneSavePromise || Promise.resolve();
}

VRODOS.api.setSceneSaveControlsSaving = function() {
	const saveBtn = document.getElementById( "save-scene-button" );
	if (saveBtn) {
		saveBtn.innerHTML = "Saving...";
		saveBtn.classList.add( "LinkDisabled" );
	}
	const compileBtn = document.getElementById( "compileGameBtn" );
	if (compileBtn) {
		compileBtn.disabled = true;
	}
}

VRODOS.api.setSceneSaveControlsSaved = function(saveGeneration) {
	const saveBtn = document.getElementById( "save-scene-button" );
	const compileBtn = document.getElementById( "compileGameBtn" );

	if (saveBtn) {
		saveBtn.innerHTML = "All changes saved";
	}
	if (compileBtn) {
		compileBtn.disabled = true;
	}

	setTimeout( () => {
		if (
			VRODOS.api.sceneSaveGeneration !== saveGeneration ||
			VRODOS.api.isSceneSavePending ||
			VRODOS.api.isSceneSaveQueued
		) {
			return;
		}

		if (saveBtn) {
			saveBtn.innerHTML = "Save Scene";
			saveBtn.classList.remove( "LinkDisabled" );
		}
		if (compileBtn) {
			compileBtn.disabled = false;
		}
	}, 2000 );
}

VRODOS.api.setSceneSaveControlsFailed = function() {
	const saveBtn = document.getElementById( "save-scene-button" );
	if (saveBtn) {
		saveBtn.innerHTML = "Save scene";
		saveBtn.classList.remove( "LinkDisabled" );
	}
	const compileBtn = document.getElementById( "compileGameBtn" );
	if (compileBtn) {
		compileBtn.disabled = false;
	}
}

VRODOS.api.exportCurrentSceneForSave = function() {
	if (!VRODOS.editor.envir || !VRODOS.editor.envir.scene || !VRODOS.exporter.SceneExporter) {
		return false;
	}

	const sceneInput = document.getElementById( "vrodos_scene_json_input" );
	if (!sceneInput) {
		return false;
	}

	const exporter = new VRODOS.exporter.SceneExporter();
	sceneInput.value = exporter.parse( VRODOS.editor.envir.scene );
	return true;
}

VRODOS.api.saveChanges = function(options) {
	const saveOptions = options || {};
	if (saveOptions.force && !VRODOS.api.isSceneSavePending) {
		VRODOS.api.isSceneSaveQueued = false;
	}

	if (VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading) {
		return Promise.resolve();
	}

	if (VRODOS.api.isSceneSavePending) {
		VRODOS.api.isSceneSaveQueued = true;
		return VRODOS.api.whenSceneSaveSettles();
	}

	if (!VRODOS.api.exportCurrentSceneForSave()) {
		return Promise.resolve();
	}

	VRODOS.api.setSceneSaveControlsSaving();
	return VRODOS.api.saveScene();
}

VRODOS.api.saveScene = function() {
	if (VRODOS.api.isSceneSavePending) {
		VRODOS.api.isSceneSaveQueued = true;
		return VRODOS.api.whenSceneSaveSettles();
	}

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
	const saveGeneration = VRODOS.api.sceneSaveGeneration + 1;
	VRODOS.api.sceneSaveGeneration = saveGeneration;

	VRODOS.api.sceneSavePromise = fetch( VRODOS.config.isAdmin === "back" ? 'admin-ajax.php' : VRODOS.utils.getAjaxUrl(), {
		method: 'POST',
		body: postdata
	})
	.then( (response) => response.text().then((text) => {
		const trimmedText = String(text || '').trim();
		let payload = null;
		try {
			payload = JSON.parse(trimmedText);
		} catch (err) {
			payload = null;
		}

		if (!response.ok || trimmedText === 'false' || trimmedText === '0' || (payload && payload.success === false)) {
			const message = payload && payload.data
				? (typeof payload.data === 'string' ? payload.data : JSON.stringify(payload.data))
				: (trimmedText || `HTTP ${response.status}`);
			throw new Error(message);
		}

		return payload || trimmedText;
	}))
	.then( (data) => {

		VRODOS.api.setSceneSaveControlsSaved(saveGeneration);
		if (pendingScreenshotData && VRODOS.api.newScreenshotData === pendingScreenshotData) {
			VRODOS.api.newScreenshotData = null;
		}
		return data;
	})
	.catch( (err) => {

		console.log( `Ajax Save Scene: ERROR: 156 - ${  err}` );
		alert( `Save Scene Error - ${  err}` );

		VRODOS.api.isSceneSaveQueued = false;
		VRODOS.api.setSceneSaveControlsFailed();
		throw err;
	})
	.finally( () => {
		VRODOS.api.isSceneSavePending = false;
	})
	.then( (data) => {
		if (!VRODOS.api.isSceneSaveQueued) {
			return data;
		}

		VRODOS.api.isSceneSaveQueued = false;
		return VRODOS.api.saveChanges({ force: true });
	});

	return VRODOS.api.sceneSavePromise;
}
