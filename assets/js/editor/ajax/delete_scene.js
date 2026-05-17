'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.api = VRODOS.api || {};
VRODOS.utils = VRODOS.utils || {};

(function initVrodosDeleteSceneAjax() {
	const DELETE_SCENE_IDS = {
		dialog: 'delete-dialog',
		progress: 'delete-scene-dialog-progress-bar',
		deleteButton: 'deleteSceneDialogDeleteBtn',
		cancelButton: 'deleteSceneDialogCancelBtn'
	};

	function getElement(id) {
		return document.getElementById(id);
	}

	function setDeleteSceneDialogBusy(isBusy) {
		const progress = getElement(DELETE_SCENE_IDS.progress);
		const deleteButton = getElement(DELETE_SCENE_IDS.deleteButton);
		const cancelButton = getElement(DELETE_SCENE_IDS.cancelButton);

		if (progress) {
			progress.style.display = isBusy ? '' : 'none';
		}
		if (deleteButton) {
			deleteButton.classList.toggle('LinkDisabled', isBusy);
		}
		if (cancelButton) {
			cancelButton.classList.toggle('LinkDisabled', isBusy);
		}
	}

	function closeDeleteSceneDialog() {
		const dialog = getElement(DELETE_SCENE_IDS.dialog);
		if (dialog && dialog.open && typeof dialog.close === 'function') {
			dialog.close();
		}
	}

	function fadeOutDeletedScene(sceneId) {
		const sceneEl = getElement(`scene-${sceneId}`);
		if (!sceneEl) {
			return;
		}

		sceneEl.style.transition = 'opacity 0.3s';
		sceneEl.style.opacity = '0';
		setTimeout(() => {
			sceneEl.remove();
		}, 300);
	}

	function resetDeleteSceneDialog() {
		setDeleteSceneDialogBusy(false);
		closeDeleteSceneDialog();
	}

	function isUsableRedirectUrl(value) {
		return typeof value === 'string' && value.trim() !== '' && value.trim() !== 'undefined';
	}

	function getFallbackRedirectUrl() {
		const dialog = getElement(DELETE_SCENE_IDS.dialog);
		if (dialog && isUsableRedirectUrl(dialog.dataset.redirectUrl)) {
			return dialog.dataset.redirectUrl;
		}

		return window.location.href;
	}

	function resolveRedirectUrl(redirectUrl) {
		return isUsableRedirectUrl(redirectUrl) ? redirectUrl : getFallbackRedirectUrl();
	}

	/**
	 * Delete Scene.
	 *
	 * Parameters from JavaScript:
	 * - sceneId: the scene to delete.
	 * - redirectUrl: URL to open after deletion.
	 */
	VRODOS.api.deleteScene = function(sceneId, redirectUrl) {
		const resolvedRedirectUrl = resolveRedirectUrl(redirectUrl);

		fetch(VRODOS.utils.getAjaxUrl(), {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				action: 'vrodos_delete_scene_action',
				scene_id: sceneId,
				url_scene_redirect: resolvedRedirectUrl
			})
		})
			.then((response) => response.text())
			.then((res) => {
				console.log(`Scene with title=${res} was successfully deleted`);

				resetDeleteSceneDialog();
				fadeOutDeletedScene(sceneId);

				window.location.replace(resolvedRedirectUrl);
			})
			.catch((err) => {
				resetDeleteSceneDialog();

				alert('Could not delete scene. Try deleting it from the administration panel.');
				console.log(`Ajax Delete Scene: ERROR: 167 ${err}`);
			});
	};
})();
