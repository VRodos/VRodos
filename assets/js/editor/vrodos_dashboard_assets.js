(function () {
	'use strict';

	function closestAction(target) {
		if (!target || typeof target.closest !== 'function') {
			return null;
		}
		return target.closest('[data-vrodos-dashboard-action]');
	}

	function setBusy(element, busy) {
		if (!element) {
			return;
		}
		element.dataset.vrodosBusy = busy ? '1' : '0';
		element.classList.toggle('tw-opacity-50', busy);
		element.classList.toggle('tw-pointer-events-none', busy);
	}

	function requestDashboardAction(action, assetId, extra) {
		const config = window.vrodosDashboardAssets || {};
		const body = new URLSearchParams({
			action,
			asset_id: assetId,
			nonce: config.nonce || ''
		});

		Object.keys(extra || {}).forEach((key) => {
			body.set(key, extra[key]);
		});

		return fetch(config.ajaxUrl || window.ajaxurl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body
		}).then((response) => response.json());
	}

	function updateRow(assetId, payload) {
		const row = document.querySelector(`[data-vrodos-dashboard-asset-row="${assetId}"]`);
		if (!row || !payload) {
			return;
		}

		if (payload.rowVisible === false) {
			row.remove();
			return;
		}

		const cells = payload.cells || {};
		Object.keys(cells).forEach((name) => {
			const cell = row.querySelector(`[data-vrodos-dashboard-cell="${name}"]`);
			if (cell) {
				cell.innerHTML = cells[name];
			}
		});

		const actions = row.querySelector('[data-vrodos-dashboard-cell="actions"]');
		if (actions && typeof payload.actionsHtml === 'string') {
			actions.innerHTML = payload.actionsHtml;
		}

		if (window.lucide && typeof window.lucide.createIcons === 'function') {
			window.lucide.createIcons();
		}
	}

	function handleClick(event) {
		const actionEl = closestAction(event.target);
		if (!actionEl || actionEl.dataset.vrodosBusy === '1') {
			return;
		}

		const action = actionEl.dataset.vrodosDashboardAction;
		if (action !== 'refresh-analysis' && action !== 'toggle-compile') {
			return;
		}

		const assetId = actionEl.dataset.assetId;
		if (!assetId) {
			return;
		}

		event.preventDefault();
		setBusy(actionEl, true);

		const ajaxAction = action === 'refresh-analysis'
			? 'vrodos_dashboard_refresh_asset_glb_analysis'
			: 'vrodos_dashboard_toggle_asset_compile_use';
		const extra = action === 'toggle-compile'
			? { enabled: actionEl.dataset.enabled || '0', profile: 'safe-draco' }
			: {};

		requestDashboardAction(ajaxAction, assetId, extra)
			.then((response) => {
				const payload = response && response.data ? response.data : {};
				updateRow(assetId, payload);
				if (!response || response.success !== true) {
					window.console.warn('[VRodos] Dashboard asset action failed', payload.message || payload);
				}
			})
			.catch((error) => {
				window.console.warn('[VRodos] Dashboard asset action failed', error);
			})
			.finally(() => {
				setBusy(actionEl, false);
			});
	}

	document.addEventListener('click', handleClick);
}());
