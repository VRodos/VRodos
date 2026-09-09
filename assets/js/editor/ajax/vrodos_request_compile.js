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
	const SLOW_BUILD_WARNING_MS = 2 * 60 * 1000;
	const STALLED_BUILD_TIMEOUT_MS = 15 * 60 * 1000;
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
			const compileError = new Error((urls.data && urls.data.message) || urls.data || 'Compile failed.');
			compileError.compileData = urls.data && typeof urls.data === 'object' ? urls.data : {};
			throw compileError;
		}
		return urls || {};
	}

	function normalizeBuildProgress(data, fallbackMessage) {
		const source = data && typeof data === 'object' ? data : {};
		const ready = Math.max(0, Number(source.ready) || 0);
		const total = Math.max(0, Number(source.total) || 0);
		const phaseSource = source.phase && typeof source.phase === 'object' ? source.phase : {};
		const profiles = Array.isArray(source.profiles) ? source.profiles.map((profile) => ({
			assetId: Math.max(0, Number(profile.assetId) || 0),
			assetLabel: String(profile.assetLabel || `Asset #${profile.assetId || ''}`).trim(),
			profile: String(profile.profile || ''),
			profileLabel: String(profile.profileLabel || profile.profile || 'Profile'),
			status: ['queued', 'running', 'ready', 'failed'].includes(profile.status) ? profile.status : 'queued',
			step: Math.max(0, Number(profile.step) || 0),
			totalSteps: Math.max(0, Number(profile.totalSteps) || 0),
			percent: Math.max(0, Math.min(100, Number(profile.percent) || 0)),
			message: String(profile.message || ''),
			updatedAt: String(profile.updatedAt || '')
		})) : [];
		const calculatedPercent = total > 0 ? Math.round((ready / total) * 100) : 0;

		return {
			ready,
			total,
			percent: Math.max(0, Math.min(100, Number.isFinite(Number(source.percent)) ? Number(source.percent) : calculatedPercent)),
			message: String(source.message || fallbackMessage || 'Preparing build…'),
			phase: {
				key: String(phaseSource.key || 'asset-optimization'),
				step: Math.max(1, Number(phaseSource.step) || 2),
				totalSteps: Math.max(1, Number(phaseSource.totalSteps) || 3),
				label: String(phaseSource.label || 'Preparing desktop assets')
			},
			profiles
		};
	}

	function noteMeaningfulProgress(build, progress) {
		const now = Date.now();
		let advanced = progress.ready > build.bestReady;
		build.bestReady = Math.max(build.bestReady, progress.ready);

		progress.profiles.forEach((profile) => {
			const key = `${profile.assetId}:${profile.profile}`;
			const previous = build.bestProfileProgress[key] || { step: 0, percent: 0, ready: false };
			const ready = profile.status === 'ready';
			if (profile.step > previous.step || profile.percent > previous.percent || (ready && !previous.ready)) {
				advanced = true;
			}
			build.bestProfileProgress[key] = {
				step: Math.max(previous.step, profile.step),
				percent: Math.max(previous.percent, profile.percent),
				ready: previous.ready || ready
			};
		});

		if (advanced) {
			build.lastMeaningfulProgressAt = now;
		}
		return Math.max(0, now - build.lastMeaningfulProgressAt);
	}

	function updateBuildProgress(build, data, fallbackMessage) {
		const progress = normalizeBuildProgress(data, fallbackMessage);
		const idleMs = noteMeaningfulProgress(build, progress);
		Object.assign(build, progress);
		dialogState.showBuildProgress(build);
		return idleMs;
	}

	function stopStalledBuild(build) {
		if (!activeBuild || activeBuild.id !== build.id) return;
		if (build.timeoutId) window.clearTimeout(build.timeoutId);
		build.timeoutId = null;
		build.controller = null;
		build.stalled = true;
		build.message = 'Asset preparation stopped making progress. Completed work was saved. Retry the build; if it stalls again, contact an administrator.';
		activeBuild = null;
		dialogState.finishBuildState();
		if (typeof dialogState.showBuildStalled === 'function') {
			dialogState.showBuildStalled(build, build.message);
		} else {
			dialogState.showBuildFailure(build, build.message);
		}
	}

	function shouldSaveBeforeCompile(compileOptions) {
		return !compileOptions.skipSave &&
			typeof VRODOS.api.waitForLatestSceneSave === 'function' &&
			typeof VRODOS.api.saveChanges === 'function' &&
			getElement('saveButton') &&
			VRODOS.editor.envir &&
			VRODOS.editor.envir.scene;
	}

	function runCompileRequest(build) {
		if (!activeBuild || activeBuild.id !== build.id || build.cancelled) return;
		build.timeoutId = null;
		if (!build.phase || Number(build.phase.step) < 2) {
			build.phase = { key: 'asset-optimization', step: 2, totalSteps: 3, label: 'Preparing desktop assets' };
			build.message = 'Checking build requirements…';
			dialogState.showBuildProgress(build);
		}
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
			.then((payload) => {
				if (!activeBuild || activeBuild.id !== build.id || build.cancelled) return null;
				if (payload && payload.pending === true) {
					const idleMs = updateBuildProgress(build, payload, payload.message);
					if (idleMs >= STALLED_BUILD_TIMEOUT_MS) {
						stopStalledBuild(build);
						return null;
					}
					if (idleMs >= SLOW_BUILD_WARNING_MS) {
						build.message = 'This is taking longer than usual. You can close this dialog and continue editing; asset preparation will continue in the background.';
						dialogState.showBuildProgress(build);
						dialogState.setStatusMessage('clock-alert', build.message);
					} else {
						dialogState.setStatusMessage('loader-circle', build.message);
					}
					const retryAfterMs = Math.max(1000, Math.min(10000, Number(payload.retryAfterMs) || 3000));
					build.timeoutId = window.setTimeout(() => runCompileRequest(build), retryAfterMs);
					return null;
				}
				return assertCompileSuccess(payload);
			})
			.then((urls) => {
				if (!urls || !activeBuild || activeBuild.id !== build.id || build.cancelled) return;
				const primaryExperienceUrl = resolvePrimaryExperienceUrl(urls);

				build.phase = { key: 'complete', step: 3, totalSteps: 3, label: 'Build complete' };
				build.percent = 100;
				activeBuild = null;
				dialogState.finishBuildState();
				dialogState.hideBuildProgress();
				dialogState.showPrimaryExperienceLink(primaryExperienceUrl);
			})
			.catch((err) => {
				if (build.cancelled || (err && err.name === 'AbortError') || !activeBuild || activeBuild.id !== build.id) return;
				updateBuildProgress(build, err && err.compileData, err && err.message);
				console.error('VRodos scene build failed.', err);
				activeBuild = null;
				dialogState.finishBuildState();
				dialogState.showBuildFailure(build, err && err.message ? err.message : 'Build failed.');
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
			percent: 0,
			message: 'Starting build…',
			phase: { key: 'save', step: 1, totalSteps: 3, label: 'Saving scene changes' },
			profiles: [],
			cancelled: false,
			stalled: false,
			controller: null,
			timeoutId: null,
			bestReady: 0,
			bestProfileProgress: Object.create(null),
			lastMeaningfulProgressAt: Date.now()
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
		dialogState.showBuildProgress(activeBuild);
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
		dialogState.setStatusMessage('circle-x', 'Stopped waiting. Completed or in-progress asset preparation is preserved and can be reused by a later build.');
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
			dialogState.showBuildProgress(build);
			VRODOS.api.waitForLatestSceneSave()
				.then(() => VRODOS.api.saveChanges({ force: true }))
				.then(() => {
					if (!activeBuild || activeBuild.id !== build.id || build.cancelled) return;
					build.message = 'Starting build…';
					runCompileRequest(build);
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

		runCompileRequest(build);
	};

})();
