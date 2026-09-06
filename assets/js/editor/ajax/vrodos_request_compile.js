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
	let activeBuild = null;

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

	function buildCompileRequest(projectId, sceneId, showPawnPositions, buildId) {
		const scene = VRODOS.editor.envir && VRODOS.editor.envir.scene ? VRODOS.editor.envir.scene : {};
		const params = new URLSearchParams({
			action: 'vrodos_compile_action',
			projectId,
			showPawnPositions,
			vrodos_scene: sceneId,
			runtimeMode: scene.aframeRuntimeMode === 'networked' ? 'networked' : 'single-player',
			vrRuntimeProfile: scene.aframeVrRuntimeProfile || 'desktop',
			buildId,
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

	function runCompileRequest(build, attempt) {
		const requestAttempt = Number(attempt || 0);
		if (!activeBuild || activeBuild.id !== build.id || build.cancelled) return;
		const request = buildCompileRequest(build.projectId, build.sceneId, build.showPawnPositions, build.id);
		build.controller = new window.AbortController();

		fetch(request.url, {
			method: 'POST',
			credentials: 'same-origin',
			signal: build.controller.signal,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: request.body.toString()
		})
			.then(parseCompileResponse)
			.then(assertCompileSuccess)
			.then((urls) => {
				if (!activeBuild || activeBuild.id !== build.id || build.cancelled) return;
				const primaryExperienceUrl = resolvePrimaryExperienceUrl(urls);

				activeBuild = null;
				dialogState.finishBuildState();
				dialogState.hideBuildProgress();
				dialogState.showPrimaryExperienceLink(primaryExperienceUrl);
			})
			.catch((err) => {
				if (build.cancelled || (err && err.name === 'AbortError') || !activeBuild || activeBuild.id !== build.id) return;
				const pending = err && err.compileData && err.compileData.pending === true;
				if (pending && requestAttempt < 200) {
					build.ready = Number(err.compileData.ready) || 0;
					build.total = Number(err.compileData.total) || 0;
					build.message = err.message;
					const status = document.getElementById('constantUpdateUser');
					if (status) status.textContent = err.message;
					dialogState.showBuildProgress(build.ready, build.total, err.message);
					const retryAfterMs = Math.max(1000, Math.min(10000, Number(err.compileData.retryAfterMs) || 3000));
					build.timeoutId = window.setTimeout(
						() => runCompileRequest(build, requestAttempt + 1),
						retryAfterMs
					);
					return;
				}
				console.log(`Ajax Aframe ERROR 189: ${err}`);
				const status = document.getElementById('constantUpdateUser');
				if (status && err && err.message) status.textContent = err.message;
				activeBuild = null;
				dialogState.finishBuildState();
				dialogState.hideBuildProgress();
			});
	}

	function createBuildId() {
		const bytes = new Uint8Array(16);
		window.crypto.getRandomValues(bytes);
		return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
	}

	function createActiveBuild(projectId, sceneId, showPawnPositions) {
		activeBuild = {
			id: createBuildId(),
			projectId,
			sceneId,
			showPawnPositions,
			ready: 0,
			total: 0,
			message: 'Starting build…',
			cancelled: false,
			controller: null,
			timeoutId: null
		};
		dialogState.showStartedState();
		return activeBuild;
	}

	function sendCancellation(build) {
		const params = new URLSearchParams({
			action: 'vrodos_cancel_compile_action',
			projectId: build.projectId,
			vrodos_scene: build.sceneId,
			buildId: build.id,
			nonce: VRODOS.config.compileNonce || VRODOS.data.compile_nonce || (window.vrodos_api_config && window.vrodos_api_config.compileNonce) || ''
		});
		const ajaxBase = VRODOS.config.isAdmin === 'back' ? 'admin-ajax.php' : VRODOS.utils.getAjaxUrl();
		return fetch(ajaxBase, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: params.toString(),
			keepalive: true
		});
	}

	VRODOS.api.isCompileRunning = function() {
		return Boolean(activeBuild && !activeBuild.cancelled);
	};

	VRODOS.api.restoreCompileUi = function() {
		if (!VRODOS.api.isCompileRunning()) return false;
		dialogState.showStartedState();
		dialogState.showBuildProgress(activeBuild.ready, activeBuild.total, activeBuild.message);
		return true;
	};

	VRODOS.api.cancelCompile = function() {
		if (!VRODOS.api.isCompileRunning()) return Promise.resolve(false);
		const build = activeBuild;
		build.cancelled = true;
		if (build.timeoutId) window.clearTimeout(build.timeoutId);
		if (build.controller) build.controller.abort();
		activeBuild = null;
		dialogState.finishBuildState();
		dialogState.hideBuildProgress();
		dialogState.setStatusMessage('circle-x', 'Build canceled. Asset optimization already running may finish and be reused by a later build.');
		return sendCancellation(build).then(() => true).catch((error) => {
			console.warn('VRodos: the local build stopped, but the server cancellation request failed.', error);
			return false;
		});
	};

	VRODOS.api.compileScene = function(showPawnPositions, options) {
		const sceneId = VRODOS.config.sceneId || VRODOS.data.sceneId || VRODOS.data.scene_id || '';
		const projectId = VRODOS.config.projectId || VRODOS.data.projectId || '';
		const resolvedShowPawnPositions = (showPawnPositions === true || showPawnPositions === 'true') ? 'true' : 'false';
		const compileOptions = options || {};
		if (VRODOS.api.isCompileRunning()) {
			VRODOS.api.restoreCompileUi();
			return;
		}

		if (!sceneId || !projectId) {
			console.warn('VRodos: compile blocked because project or scene id is missing.', { projectId, sceneId });
			dialogState.finishBuildState();
			return;
		}

		if (!compileOptions.skipSave && typeof VRODOS.ui.applyCompileDialogSettingsToScene === 'function') {
			VRODOS.ui.applyCompileDialogSettingsToScene();
		}
		const build = createActiveBuild(projectId, sceneId, resolvedShowPawnPositions);

		if (shouldSaveBeforeCompile(compileOptions)) {
			build.message = 'Saving build settings and latest scene changes…';
			dialogState.showSavePendingMessage();
			dialogState.showBuildProgress(0, 0, build.message);
			VRODOS.api.waitForLatestSceneSave()
				.then(() => VRODOS.api.saveChanges({ force: true }))
				.then(() => {
					if (!activeBuild || activeBuild.id !== build.id || build.cancelled) return;
					build.message = 'Starting build…';
					runCompileRequest(build, 0);
				})
				.catch((error) => {
					if (build.cancelled || !activeBuild || activeBuild.id !== build.id) return;
					activeBuild = null;
					console.warn('VRodos: compile blocked because scene save failed.', error);
					dialogState.finishBuildState();
					dialogState.hideBuildProgress();
					dialogState.showSaveFailedMessage();
				});
			return;
		}

		runCompileRequest(build, 0);
	};

})();
