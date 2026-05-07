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

	function removeNoticeQueryParam() {
		if (!window.history || typeof window.history.replaceState !== 'function') {
			return;
		}

		const url = new URL(window.location.href);
		if (!url.searchParams.has('vrodos_asset_opt_notice')) {
			return;
		}

		url.searchParams.delete('vrodos_asset_opt_notice');
		window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
	}

	function dismissDashboardNotice(notice) {
		if (!notice) {
			return;
		}
		notice.remove();
	}

	function attachNoticeClose(notice) {
		const close = notice ? notice.querySelector('[data-vrodos-dashboard-notice-close]') : null;
		if (close) {
			close.addEventListener('click', () => dismissDashboardNotice(notice));
		}
	}

	function showDashboardNotice(message, isError) {
		if (!message) {
			return;
		}

		const panel = document.querySelector('#vrodos-dashboard-panel-assets');
		if (!panel) {
			return;
		}

		const existing = panel.querySelector('[data-vrodos-dashboard-notice]');
		if (existing) {
			existing.remove();
		}

		const notice = document.createElement('div');
		notice.className = [
			'tw-m-6',
			'tw-mb-0',
			'tw-flex',
			'tw-items-center',
			'tw-gap-3',
			'tw-rounded-xl',
			'tw-border',
			'tw-px-4',
			'tw-py-3',
			'tw-text-sm',
			'tw-font-bold',
			isError ? 'tw-border-amber-200 tw-bg-amber-50 tw-text-amber-900' : 'tw-border-emerald-200 tw-bg-emerald-50 tw-text-emerald-900'
		].join(' ');
		notice.dataset.vrodosDashboardNotice = '1';
		notice.innerHTML = `
			<i data-lucide="${isError ? 'triangle-alert' : 'check-circle'}" class="tw-w-5 tw-h-5 tw-shrink-0"></i>
			<span class="tw-flex-1"></span>
			<button type="button" class="tw-btn tw-btn-ghost tw-btn-xs tw-min-h-0 tw-h-7 tw-w-7 tw-p-0" data-vrodos-dashboard-notice-close aria-label="Dismiss notice">
				<i data-lucide="x" class="tw-w-4 tw-h-4"></i>
			</button>
		`;
		notice.querySelector('span').textContent = message;
		panel.prepend(notice);
		attachNoticeClose(notice);

		if (window.lucide && typeof window.lucide.createIcons === 'function') {
			window.lucide.createIcons();
		}
	}

	function initializeDashboardNotice() {
		const notice = document.querySelector('[data-vrodos-dashboard-notice]');
		if (!notice) {
			removeNoticeQueryParam();
			return;
		}

		attachNoticeClose(notice);
		removeNoticeQueryParam();
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
				showDashboardNotice(payload.message || '', !response || response.success !== true);
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
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initializeDashboardNotice);
	} else {
		initializeDashboardNotice();
	}
}());
