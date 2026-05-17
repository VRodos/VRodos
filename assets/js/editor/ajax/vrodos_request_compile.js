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

	function getElementValue(key, fallback) {
		return dialogState.getValue(key, fallback);
	}

	function createCompileResultLink(preview, url, captionText) {
		if (!preview || !url) {
			return;
		}

		const section = document.createElement('div');
		section.style.cssText = 'padding-top: 8px;';

		const title = document.createElement('span');
		title.style.cssText = 'color: black; font-weight:500;';
		title.innerText = `${captionText}: `;

		const link = document.createElement('a');
		link.innerText = url;
		link.setAttribute('href', url);
		link.setAttribute('target', '_blank');

		section.append(title);
		section.append(link);
		preview.append(section);
	}

	function hasRuntimeVariants(urls) {
		return Boolean(
			urls.LocalMasterClient ||
			urls.PublicMasterClient ||
			urls.LocalCurrentSceneMasterClient ||
			urls.PublicCurrentSceneMasterClient
		);
	}

	function resolvePrimaryExperienceUrl(urls, projectType) {
		return urls.CurrentSceneMasterClient ||
			(projectType === 'vrexpo_games'
				? (urls.MasterClient || urls.index || urls.SimpleClient || '')
				: (urls.MasterClient || urls.index || urls.SimpleClient || ''));
	}

	function renderRuntimeVariantLinks(preview, urls, projectType) {
		if (projectType === 'vrexpo_games') {
			createCompileResultLink(
				preview,
				urls.LocalCurrentSceneMasterClient || urls.LocalMasterClient,
				'Local network scene link'
			);
			createCompileResultLink(
				preview,
				urls.PublicCurrentSceneMasterClient || urls.PublicMasterClient,
				'Public scene link'
			);

			if (urls.LocalMasterClient && urls.LocalMasterClient !== urls.LocalCurrentSceneMasterClient) {
				createCompileResultLink(preview, urls.LocalMasterClient, 'Local network base scene link');
			}
			if (urls.PublicMasterClient && urls.PublicMasterClient !== urls.PublicCurrentSceneMasterClient) {
				createCompileResultLink(preview, urls.PublicMasterClient, 'Public base scene link');
			}
			return;
		}

		createCompileResultLink(preview, urls.LocalIndex, 'Local network index');
		createCompileResultLink(
			preview,
			urls.LocalCurrentSceneMasterClient || urls.LocalMasterClient,
			'Local network director (current scene)'
		);
		createCompileResultLink(
			preview,
			urls.LocalCurrentSceneSimpleClient || urls.LocalSimpleClient,
			'Local network actor (current scene)'
		);
		createCompileResultLink(preview, urls.PublicIndex, 'Public index');
		createCompileResultLink(
			preview,
			urls.PublicCurrentSceneMasterClient || urls.PublicMasterClient,
			'Public director (current scene)'
		);
		createCompileResultLink(
			preview,
			urls.PublicCurrentSceneSimpleClient || urls.PublicSimpleClient,
			'Public actor (current scene)'
		);
	}

	function renderLegacyRuntimeLinks(preview, urls, projectType) {
		if (projectType === 'vrexpo_games') {
			createCompileResultLink(preview, urls.CurrentSceneMasterClient || urls.MasterClient, 'Scene link');
			if (urls.MasterClient && urls.MasterClient !== urls.CurrentSceneMasterClient) {
				createCompileResultLink(preview, urls.MasterClient, 'Base scene link');
			}
			return;
		}

		createCompileResultLink(preview, urls.index, 'Index');
		createCompileResultLink(preview, urls.CurrentSceneMasterClient || urls.MasterClient, 'Director (current scene)');
		createCompileResultLink(preview, urls.CurrentSceneSimpleClient || urls.SimpleClient, 'Actor (current scene)');
	}

	function renderCompileResultLinks(preview, urls, projectType) {
		const isSinglePlayerRuntime = urls.RuntimeMode === 'single-player';

		if (isSinglePlayerRuntime) {
			createCompileResultLink(preview, urls.CurrentSceneMasterClient || urls.MasterClient, 'Scene link');
		} else if (hasRuntimeVariants(urls)) {
			renderRuntimeVariantLinks(preview, urls, projectType);
		} else {
			renderLegacyRuntimeLinks(preview, urls, projectType);
		}
	}

	function getSceneRuntimeMode() {
		return VRODOS.editor.envir && VRODOS.editor.envir.scene
			? VRODOS.editor.envir.scene.aframeRuntimeMode
			: '';
	}

	function resolveRuntimeMode() {
		const selectedRuntimeMode = getElementValue('runtimeMode', getSceneRuntimeMode());
		return selectedRuntimeMode === 'single-player' ? 'single-player' : 'networked';
	}

	function buildCompileUrl(projectId, sceneId, showPawnPositions, platform, runtimeMode) {
		const params = new URLSearchParams({
			action: 'vrodos_compile_action',
			projectId,
			showPawnPositions,
			vrodos_scene: sceneId,
			outputFormat: platform,
			runtimeMode
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
		const preview = getElement('preview');
		const platform = getElementValue('platform', '');
		const projectType = getElementValue('projectType', '');
		const runtimeMode = resolveRuntimeMode();

		dialogState.showStartedState();

		fetch(buildCompileUrl(projectId, sceneId, resolvedShowPawnPositions, platform, runtimeMode))
			.then(parseCompileResponse)
			.then(assertCompileSuccess)
			.then((urls) => {
				const primaryExperienceUrl = resolvePrimaryExperienceUrl(urls, projectType);

				dialogState.hideProgress({ hideText: true, resetDeterminateWidth: true });
				dialogState.clearPreview();
				renderCompileResultLinks(preview, urls, projectType);
				dialogState.showPrimaryExperienceLink(primaryExperienceUrl);
			})
			.catch((err) => {
				console.log(`Ajax Aframe ERROR 189: ${err}`);
				VRODOS.api.hideCompileProgressSlider();
			});
	}

	VRODOS.api.compileScene = function(showPawnPositions, options) {
		const sceneId = VRODOS.config.sceneId || VRODOS.data.sceneId || VRODOS.data.scene_id || '';
		const projectId = VRODOS.config.projectId || VRODOS.data.projectId || '';
		const resolvedShowPawnPositions = (showPawnPositions === true || showPawnPositions === 'true') ? 'true' : 'false';
		const compileOptions = options || {};

		if (!sceneId || !projectId) {
			console.warn('VRodos: compile blocked because project or scene id is missing.', { projectId, sceneId });
			VRODOS.api.hideCompileProgressSlider();
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
					VRODOS.api.hideCompileProgressSlider();
				});
			return;
		}

		runCompileRequest(projectId, sceneId, resolvedShowPawnPositions);
	};

	VRODOS.api.hideCompileProgressSlider = function() {
		dialogState.hideProgress();
	};
})();
