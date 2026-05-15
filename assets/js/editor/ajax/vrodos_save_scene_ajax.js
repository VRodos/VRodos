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
	return typeof VRODOS.api.writeCurrentSceneJsonToInput === 'function' &&
		VRODOS.api.writeCurrentSceneJsonToInput();
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

VRODOS.api.clickSceneSaveButton = function() {
	const saveButton = document.getElementById( 'save-scene-button' );
	if (saveButton && typeof saveButton.click === 'function') {
		saveButton.click();
		return;
	}

	VRODOS.api.saveChanges({ force: true });
}

VRODOS.api.saveSceneEventHandler = function(e) {
	if (!e || !e.type) {
		return;
	}

	VRODOS.ui = VRODOS.ui || {};
	VRODOS.ui.mapActions = VRODOS.ui.mapActions || {};

	if (VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading) {
		return;
	}

	if (e.type === 'modificationPendingSave') {
		VRODOS.ui.mapActions[e.type] = true;
	}

	if (e.type === 'mouseup') {
		VRODOS.ui.mapActions[e.type] = true;

		if (VRODOS.ui.mapActions.mouseup && VRODOS.ui.mapActions.modificationPendingSave) {
			VRODOS.api.clickSceneSaveButton();
			VRODOS.ui.mapActions = {};
		}
	}
}

VRODOS.api.commitPendingSceneSave = function() {
	if (VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading) {
		return;
	}

	VRODOS.ui = VRODOS.ui || {};
	VRODOS.ui.mapActions = VRODOS.ui.mapActions || {};
	VRODOS.ui.mapActions.modificationPendingSave = true;
	VRODOS.api.clickSceneSaveButton();
	VRODOS.ui.mapActions = {};
}

VRODOS.api.triggerAutoSave = function() {
	if (!VRODOS.editor.envir || !VRODOS.editor.envir.scene) {
		return;
	}

	if (VRODOS.editor.envir.isSceneLoading) {
		return;
	}

	// For non-canvas actions like lil-gui finish-change, insert/delete, and property edits,
	// save directly instead of synthesizing a mouseup event. Synthetic mouseup bubbled back
	// into lil-gui's own onMouseUp handler and caused recursive autosave loops.
	VRODOS.editor.envir.scene.dispatchEvent({ type: 'modificationPendingSave' });
	VRODOS.api.commitPendingSceneSave();
}
