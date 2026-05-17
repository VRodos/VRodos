'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.api = VRODOS.api || {};
VRODOS.config = VRODOS.config || {};
VRODOS.data = VRODOS.data || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};

(function initVrodosCompileRequestApi() {
	const COMPILE_ELEMENT_IDS = {
		appResult: 'appResultDiv',
		cancelButton: 'compileCancelBtn',
		constantUpdate: 'constantUpdateUser',
		copyWebLink: 'buttonCopyWebLink',
		platform: 'platformInput',
		preview: 'previewApp',
		proceedButton: 'compileProceedBtn',
		progressBarValue: 'progressSliderSubLineDeterminateValue',
		progressDeterminate: 'compileProgressDeterminate',
		progressSlider: 'compileProgressSlider',
		progressText: 'compilationProgressText',
		progressTitle: 'compileProgressTitle',
		projectType: 'project-type',
		resultMeta: 'compileResultMeta',
		runtimeMode: 'compileRuntimeModeSelect',
		saveButton: 'save-scene-button',
		statusRow: 'compileStatusRow',
		topResultLink: 'compileTopResultLink',
		webLink: 'vrodos-weblink',
		openWebLink: 'openWebLinkhref'
	};

	function getElement(key) {
		return document.getElementById(COMPILE_ELEMENT_IDS[key] || key);
	}

	function getElementValue(key, fallback) {
		const element = getElement(key);
		return element ? element.value : fallback;
	}

	function setDisplay(element, value) {
		if (element) {
			element.style.display = value;
		}
	}

	function setText(element, value) {
		if (element) {
			element.textContent = value;
		}
	}

	function setHtml(element, value) {
		if (element) {
			element.innerHTML = value;
		}
	}

	function setHref(element, value) {
		if (element) {
			element.setAttribute('href', value);
		}
	}

	function getCompileElements() {
		return {
			appResult: getElement('appResult'),
			cancelButton: getElement('cancelButton'),
			constantUpdate: getElement('constantUpdate'),
			copyWebLink: getElement('copyWebLink'),
			openWebLink: getElement('openWebLink'),
			preview: getElement('preview'),
			proceedButton: getElement('proceedButton'),
			progressBarValue: getElement('progressBarValue'),
			progressDeterminate: getElement('progressDeterminate'),
			progressSlider: getElement('progressSlider'),
			progressText: getElement('progressText'),
			progressTitle: getElement('progressTitle'),
			resultMeta: getElement('resultMeta'),
			statusRow: getElement('statusRow'),
			topResultLink: getElement('topResultLink'),
			webLink: getElement('webLink')
		};
	}

	function setCompileStatusMessage(els, iconName, message) {
		setHtml(
			els.constantUpdate,
			`<i data-lucide="${iconName}" class="tw-w-4 tw-h-4 tw-inline-block tw-align-text-bottom tw-mr-1"></i> ${message}`
		);
		VRODOS.ui.refreshLucideIcons();
	}

	function resetCompileResultState(els) {
		setDisplay(els.statusRow, 'flex');
		setDisplay(els.appResult, 'none');
		setText(els.resultMeta, 'The experience is ready to be shared');

		if (els.topResultLink) {
			els.topResultLink.classList.add('tw-hidden');
			setHref(els.topResultLink, '#');
		}
	}

	function showCompileStartedState(els) {
		if (els.cancelButton) {
			els.cancelButton.classList.remove('LinkDisabled');
		}

		resetCompileResultState(els);
		setText(els.progressTitle, 'Step: 1 / 2');
		if (els.progressText) {
			els.progressText.append('Building...');
		}
		setCompileStatusMessage(els, 'info', 'Please wait while we build your scene');
	}

	function hideCompileProgressElements(els) {
		setDisplay(els.progressTitle, 'none');
		setDisplay(els.progressDeterminate, 'none');
		setDisplay(els.progressSlider, 'none');
		setDisplay(els.progressText, 'none');

		if (els.progressBarValue) {
			els.progressBarValue.style.width = '1px';
		}
	}

	function clearCompilePreview(els) {
		setHtml(els.preview, '');
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

	function renderCompileResultLinks(els, urls, projectType) {
		const isSinglePlayerRuntime = urls.RuntimeMode === 'single-player';

		if (isSinglePlayerRuntime) {
			createCompileResultLink(els.preview, urls.CurrentSceneMasterClient || urls.MasterClient, 'Scene link');
		} else if (hasRuntimeVariants(urls)) {
			renderRuntimeVariantLinks(els.preview, urls, projectType);
		} else {
			renderLegacyRuntimeLinks(els.preview, urls, projectType);
		}
	}

	function showPrimaryExperienceLink(els, primaryExperienceUrl) {
		if (!primaryExperienceUrl) {
			return;
		}

		setDisplay(els.statusRow, 'none');
		setDisplay(els.appResult, 'flex');
		setText(els.resultMeta, `Ready to be shared - ${new Date().toLocaleString()}`);

		if (els.webLink) {
			els.webLink.href = primaryExperienceUrl;
			setDisplay(els.webLink, '');
		}
		if (els.openWebLink) {
			setHref(els.openWebLink, primaryExperienceUrl);
			setDisplay(els.openWebLink, '');
		}
		setDisplay(els.copyWebLink, '');
		VRODOS.ui.refreshLucideIcons();
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
		const els = getCompileElements();
		const platform = getElementValue('platform', '');
		const projectType = getElementValue('projectType', '');
		const runtimeMode = resolveRuntimeMode();

		showCompileStartedState(els);

		fetch(buildCompileUrl(projectId, sceneId, resolvedShowPawnPositions, platform, runtimeMode))
			.then(parseCompileResponse)
			.then(assertCompileSuccess)
			.then((urls) => {
				const primaryExperienceUrl = resolvePrimaryExperienceUrl(urls, projectType);

				hideCompileProgressElements(els);
				clearCompilePreview(els);
				renderCompileResultLinks(els, urls, projectType);
				showPrimaryExperienceLink(els, primaryExperienceUrl);
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
		const els = getCompileElements();

		setDisplay(els.progressSlider, 'none');
		setDisplay(els.progressTitle, 'none');
		setDisplay(els.progressDeterminate, 'none');

		if (els.proceedButton) {
			els.proceedButton.classList.remove('LinkDisabled');
		}
		if (els.cancelButton) {
			els.cancelButton.classList.remove('LinkDisabled');
		}
	};
})();
