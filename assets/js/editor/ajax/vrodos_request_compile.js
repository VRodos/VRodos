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

	const runCompileRequest = function() {
	// In which platform to compile, e.g. Aframe
	const platform = document.getElementById( "platformInput" ).value;
	const runtimeModeControl = document.getElementById( "compileRuntimeModeSelect" );
	const sceneRuntimeMode = VRODOS.editor && VRODOS.editor.envir && VRODOS.editor.envir.scene
		? VRODOS.editor.envir.scene.aframeRuntimeMode
		: '';
	const selectedRuntimeMode = runtimeModeControl ? runtimeModeControl.value : sceneRuntimeMode;
	const runtimeMode = selectedRuntimeMode === 'single-player'
		? 'single-player'
		: 'networked';

	// Change UI text label
	const compilationProgressText = document.getElementById( "compilationProgressText" );

	const projectType = document.getElementById( "project-type" ).value;

	// Enable cancel button
	document.getElementById( "compileCancelBtn" ).classList.remove( "LinkDisabled" );

	const statusRow = document.getElementById( "compileStatusRow" );
	const appResultDiv = document.getElementById( "appResultDiv" );
	const resultMeta = document.getElementById( "compileResultMeta" );
	const topResultLink = document.getElementById( "compileTopResultLink" );
	if (statusRow) {
		statusRow.style.display = 'flex';
	}
	if (appResultDiv) {
		appResultDiv.style.display = 'none';
	}
	if (resultMeta) {
		resultMeta.textContent = 'The experience is ready to be shared';
	}
	if (topResultLink) {
		topResultLink.classList.add( "tw-hidden" );
		topResultLink.setAttribute( "href", "#" );
	}

	document.getElementById( "compileProgressTitle" ).textContent = "Step: 1 / 2";
	compilationProgressText.append( 'Building...' );

	document.getElementById( "constantUpdateUser" ).innerHTML =
		'<i data-lucide="info" class="tw-w-4 tw-h-4 tw-inline-block tw-align-text-bottom tw-mr-1"></i> ' +
		'Please wait while we build your scene';
	if (typeof lucide !== 'undefined') lucide.createIcons();

	// Build query string for GET request
	const params = new URLSearchParams({
		'action': 'vrodos_compile_action',
		projectId,
		
		'showPawnPositions': resolvedShowPawnPositions,
		'vrodos_scene': sceneId,
		'outputFormat': platform,
		runtimeMode
	});

	const url = `${VRODOS.config.isAdmin === "back" ? 'admin-ajax.php' : VRODOS.utils.getAjaxUrl()  }?${  params.toString()}`;

	// ajax for Aframe compiling : Transform VRODOS.editor.envir.scene.children to an html aframe page
	fetch( url )
	.then( (response) => response.text().then((text) => {
		if (!response.ok) {
			throw new Error(text || `Compile request failed with HTTP ${response.status}`);
		}
		return text;
	}))
	.then( (urlExperienceSequenceJSON) => {

		const urlExperienceSequence = JSON.parse( urlExperienceSequenceJSON );
		if (urlExperienceSequence && urlExperienceSequence.success === false) {
			throw new Error(urlExperienceSequence.data || 'Compile failed.');
		}
		const primaryExperienceUrl = urlExperienceSequence.CurrentSceneMasterClient
			|| (projectType === 'vrexpo_games'
				? (urlExperienceSequence.MasterClient || urlExperienceSequence.index || urlExperienceSequence.SimpleClient || '')
				: (urlExperienceSequence.MasterClient || urlExperienceSequence.index || urlExperienceSequence.SimpleClient || ''));

		document.getElementById( "compileProgressTitle" ).style.display = 'none';
		document.getElementById( "progressSliderSubLineDeterminateValue" ).style.width = '1px';
		document.getElementById( "compileProgressDeterminate" ).style.display = 'none';
		document.getElementById( "compileProgressSlider" ).style.display = 'none';
		document.getElementById( "compilationProgressText" ).style.display = 'none';

		const compile_dialogue_div       = document.getElementById( "previewApp" );
		compile_dialogue_div.innerHTML = "";

		function createLinks(url, captionText){
			if (!url) {
				return;
			}

			const section           = document.createElement( 'div' );
			section.style.cssText = 'padding-top: 8px;';

			const title           = document.createElement( 'span' );
			title.style.cssText = 'color: black; font-weight:500;';
			title.innerText     = `${captionText  }: `;

			section.append( title );

			const link       = document.createElement( 'a' );
			link.innerText = url;
			link.setAttribute( "href", url );
			link.setAttribute( "target", '_blank' );
			section.append( link );

			compile_dialogue_div.append( section );
		}

		const hasRuntimeVariants = Boolean(
			urlExperienceSequence.LocalMasterClient ||
			urlExperienceSequence.PublicMasterClient ||
			urlExperienceSequence.LocalCurrentSceneMasterClient ||
			urlExperienceSequence.PublicCurrentSceneMasterClient
		);
		const isSinglePlayerRuntime = urlExperienceSequence.RuntimeMode === 'single-player';

		if (isSinglePlayerRuntime) {
			createLinks(urlExperienceSequence.CurrentSceneMasterClient || urlExperienceSequence.MasterClient, "Scene link");
		} else if (hasRuntimeVariants) {
			if (projectType === 'vrexpo_games') {
				createLinks(
					urlExperienceSequence.LocalCurrentSceneMasterClient || urlExperienceSequence.LocalMasterClient,
					"Local network scene link"
				);
				if (urlExperienceSequence.PublicCurrentSceneMasterClient || urlExperienceSequence.PublicMasterClient) {
					createLinks(
						urlExperienceSequence.PublicCurrentSceneMasterClient || urlExperienceSequence.PublicMasterClient,
						"Public scene link"
					);
				}
				if (
					urlExperienceSequence.LocalMasterClient &&
					urlExperienceSequence.LocalMasterClient !== urlExperienceSequence.LocalCurrentSceneMasterClient
				) {
					createLinks(urlExperienceSequence.LocalMasterClient, "Local network base scene link");
				}
				if (
					urlExperienceSequence.PublicMasterClient &&
					urlExperienceSequence.PublicMasterClient !== urlExperienceSequence.PublicCurrentSceneMasterClient
				) {
					createLinks(urlExperienceSequence.PublicMasterClient, "Public base scene link");
				}
			} else {
				createLinks(urlExperienceSequence.LocalIndex, "Local network index");
				createLinks(
					urlExperienceSequence.LocalCurrentSceneMasterClient || urlExperienceSequence.LocalMasterClient,
					"Local network director (current scene)"
				);
				createLinks(
					urlExperienceSequence.LocalCurrentSceneSimpleClient || urlExperienceSequence.LocalSimpleClient,
					"Local network actor (current scene)"
				);
				createLinks(urlExperienceSequence.PublicIndex, "Public index");
				createLinks(
					urlExperienceSequence.PublicCurrentSceneMasterClient || urlExperienceSequence.PublicMasterClient,
					"Public director (current scene)"
				);
				createLinks(
					urlExperienceSequence.PublicCurrentSceneSimpleClient || urlExperienceSequence.PublicSimpleClient,
					"Public actor (current scene)"
				);
			}
		} else if (projectType === 'vrexpo_games') {
			createLinks( urlExperienceSequence.CurrentSceneMasterClient || urlExperienceSequence.MasterClient, "Scene link" );
			if (urlExperienceSequence.MasterClient && urlExperienceSequence.MasterClient !== urlExperienceSequence.CurrentSceneMasterClient) {
				createLinks( urlExperienceSequence.MasterClient, "Base scene link" );
			}
		} else {
			createLinks( urlExperienceSequence.index, "Index" );
			createLinks( urlExperienceSequence.CurrentSceneMasterClient || urlExperienceSequence.MasterClient, "Director (current scene)" );
			createLinks( urlExperienceSequence.CurrentSceneSimpleClient || urlExperienceSequence.SimpleClient,"Actor (current scene)" );
		}

		if (primaryExperienceUrl) {
			const webLink = document.getElementById( "vrodos-weblink" );
			const openWebLink = document.getElementById( "openWebLinkhref" );
			const copyButton = document.getElementById( "buttonCopyWebLink" );

			if (statusRow) {
				statusRow.style.display = 'none';
			}
			if (appResultDiv) {
				appResultDiv.style.display = 'flex';
			}
			if (resultMeta) {
				resultMeta.textContent = `Ready to be shared - ${  new Date().toLocaleString()}`;
			}
			if (webLink) {
				webLink.href = primaryExperienceUrl;
				webLink.style.display = '';
			}
			if (openWebLink) {
				openWebLink.setAttribute( "href", primaryExperienceUrl );
				openWebLink.style.display = '';
			}
			if (copyButton) {
				copyButton.style.display = '';
			}
			if (typeof lucide !== 'undefined') lucide.createIcons();
		}

	})
	.catch( (err) => {
		console.log( `Ajax Aframe ERROR 189: ${  err}` );
		VRODOS.api.hideCompileProgressSlider();
	});
	};

	if (!compileOptions.skipSave && typeof VRODOS.ui.applyCompileDialogSettingsToScene === 'function') {
		VRODOS.ui.applyCompileDialogSettingsToScene();
	}

	if (
		!compileOptions.skipSave &&
		typeof VRODOS.api.waitForLatestSceneSave === 'function' &&
		typeof VRODOS.api.saveChanges === 'function' &&
		document.getElementById('save-scene-button') &&
		VRODOS.editor &&
		VRODOS.editor.envir &&
		VRODOS.editor.envir.scene
	) {
		VRODOS.api.waitForLatestSceneSave()
			.then(() => VRODOS.api.saveChanges({force: true}))
			.then(runCompileRequest)
			.catch((error) => {
				console.warn('VRodos: compile blocked because scene save failed.', error);
				VRODOS.api.hideCompileProgressSlider();
			});
		return;
	}

	runCompileRequest();
}


// Hide compile progress slider
VRODOS.api.hideCompileProgressSlider = function() {
	document.getElementById( "compileProgressSlider" ).style.display = 'none';
	document.getElementById( "compileProgressTitle" ).style.display = 'none';
	document.getElementById( "compileProgressDeterminate" ).style.display = 'none';
	document.getElementById( "compileProceedBtn" ).classList.remove( "LinkDisabled" );
	document.getElementById( "compileCancelBtn" ).classList.remove( "LinkDisabled" );
}
