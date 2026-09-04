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

	function buildCompileRequest(projectId, sceneId, showPawnPositions) {
		const scene = VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene : {};
		const params = new URLSearchParams({
			action: 'vrodos_compile_action',
			projectId,
			showPawnPositions,
			vrodos_scene: sceneId,
			runtimeMode: scene.aframeRuntimeMode === 'networked' ? 'networked' : 'single-player',
			vrRuntimeProfile: scene.aframeVrRuntimeProfile || 'desktop',
			nonce: VRODOS.config.compileNonce || VRODOS.data.compile_nonce || (window.vrodos_api_config && window.vrodos_api_config.compileNonce) || ''
		});
		const ajaxBase = VRODOS.config.isAdmin === 'back' ? 'admin-ajax.php' : VRODOS.utils.getAjaxUrl();
		return { url: ajaxBase, body: params };
	}

	function parseCompileResponse(response) {
		return response.text().then((text) => {
			let payload;
			try {
				payload = JSON.parse(text);
			} catch (error) {
				throw new Error(text || `Compile request failed with HTTP ${response.status}`);
			}
			if (!response.ok) {
				const errorData = payload && payload.data;
				const compileError = new Error((errorData && errorData.message) || errorData || `Compile request failed with HTTP ${response.status}`);
				compileError.compileData = errorData && typeof errorData === 'object' ? errorData : {};
				throw compileError;
			}
			return payload;
		});
	}

	function assertCompileSuccess(urls) {
		if (urls && urls.success === false) {
			throw new Error((urls.data && urls.data.message) || urls.data || 'Compile failed.');
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

	function runCompileRequest(projectId, sceneId, resolvedShowPawnPositions, attempt) {
		const requestAttempt = Number(attempt || 0);
		if (requestAttempt === 0) dialogState.showStartedState();
		const request = buildCompileRequest(projectId, sceneId, resolvedShowPawnPositions);

		fetch(request.url, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: request.body.toString()
		})
			.then(parseCompileResponse)
			.then(assertCompileSuccess)
			.then((urls) => {
				const primaryExperienceUrl = resolvePrimaryExperienceUrl(urls);

				dialogState.finishBuildState();
				dialogState.showPrimaryExperienceLink(primaryExperienceUrl);
			})
			.catch((err) => {
				const pending = err && err.compileData && err.compileData.pending === true;
				if (pending && requestAttempt < 200) {
					const status = document.getElementById('constantUpdateUser');
					if (status) status.textContent = err.message;
					const retryAfterMs = Math.max(1000, Math.min(10000, Number(err.compileData.retryAfterMs) || 3000));
					window.setTimeout(
						() => runCompileRequest(projectId, sceneId, resolvedShowPawnPositions, requestAttempt + 1),
						retryAfterMs
					);
					return;
				}
				console.log(`Ajax Aframe ERROR 189: ${err}`);
				const status = document.getElementById('constantUpdateUser');
				if (status && err && err.message) status.textContent = err.message;
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
