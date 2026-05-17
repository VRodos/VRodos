'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.api = VRODOS.api || {};
VRODOS.config = VRODOS.config || {};
VRODOS.data = VRODOS.data || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};

(function initVrodosCompileRequestApi() {
	const dialogState = VRODOS.ui.compileDialogState;

	function getElement(key) {
		return dialogState.getElement(key);
	}

	function resolvePrimaryExperienceUrl(urls) {
		return urls.CurrentSceneMasterClient ||
			urls.LocalCurrentSceneMasterClient ||
			urls.PublicCurrentSceneMasterClient ||
			urls.MasterClient ||
			urls.LocalMasterClient ||
			urls.PublicMasterClient ||
			urls.index ||
			urls.LocalIndex ||
			urls.PublicIndex ||
			urls.SimpleClient ||
			'';
	}

	function buildCompileUrl(projectId, sceneId, showPawnPositions) {
		const params = new URLSearchParams({
			action: 'vrodos_compile_action',
			projectId,
			showPawnPositions,
			vrodos_scene: sceneId
		});
		const ajaxBase = VRODOS.config.isAdmin === 'back' ? 'admin-ajax.php' : VRODOS.utils.getAjaxUrl();
		return `${ajaxBase}?${params.toString()}`;
	}

	function parseCompileResponse(response) {
		return response.text().then((text) => {
			if (!response.ok) {
				throw new Error(text || `Compile request failed with HTTP ${response.status}`);
			}
			return JSON.parse(text);
		});
	}

	function assertCompileSuccess(urls) {
		if (urls && urls.success === false) {
			throw new Error(urls.data || 'Compile failed.');
		}
		return urls || {};
	}

	function shouldSaveBeforeCompile(compileOptions) {
		return !compileOptions.skipSave &&
			typeof VRODOS.api.waitForLatestSceneSave === 'function' &&
			typeof VRODOS.api.saveChanges === 'function' &&
			getElement('saveButton') &&
			VRODOS.editor.envir &&
			VRODOS.editor.envir.scene;
	}

	function runCompileRequest(projectId, sceneId, resolvedShowPawnPositions) {
		dialogState.showStartedState();

		fetch(buildCompileUrl(projectId, sceneId, resolvedShowPawnPositions))
			.then(parseCompileResponse)
			.then(assertCompileSuccess)
			.then((urls) => {
				const primaryExperienceUrl = resolvePrimaryExperienceUrl(urls);

				dialogState.finishBuildState();
				dialogState.showPrimaryExperienceLink(primaryExperienceUrl);
			})
			.catch((err) => {
				console.log(`Ajax Aframe ERROR 189: ${err}`);
				dialogState.finishBuildState();
			});
	}

	VRODOS.api.compileScene = function(showPawnPositions, options) {
		const sceneId = VRODOS.config.sceneId || VRODOS.data.sceneId || VRODOS.data.scene_id || '';
		const projectId = VRODOS.config.projectId || VRODOS.data.projectId || '';
		const resolvedShowPawnPositions = (showPawnPositions === true || showPawnPositions === 'true') ? 'true' : 'false';
		const compileOptions = options || {};

		if (!sceneId || !projectId) {
			console.warn('VRodos: compile blocked because project or scene id is missing.', { projectId, sceneId });
			dialogState.finishBuildState();
			return;
		}

		if (!compileOptions.skipSave && typeof VRODOS.ui.applyCompileDialogSettingsToScene === 'function') {
			VRODOS.ui.applyCompileDialogSettingsToScene();
		}

		if (shouldSaveBeforeCompile(compileOptions)) {
			VRODOS.api.waitForLatestSceneSave()
				.then(() => VRODOS.api.saveChanges({ force: true }))
				.then(() => runCompileRequest(projectId, sceneId, resolvedShowPawnPositions))
				.catch((error) => {
					console.warn('VRodos: compile blocked because scene save failed.', error);
					dialogState.finishBuildState();
				});
			return;
		}

		runCompileRequest(projectId, sceneId, resolvedShowPawnPositions);
	};

})();
