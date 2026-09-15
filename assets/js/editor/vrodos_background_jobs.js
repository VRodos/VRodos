(function () {
	'use strict';

	const root = document.getElementById('vrodos-background-jobs');
	const config = window.vrodosBackgroundJobs || {};
	if (!root) return;
	let loading = false;

	function formatTime(label) {
		return label || '—';
	}

	function textCell(row, value) {
		const cell = document.createElement('td');
		cell.textContent = value == null || value === '' ? '—' : String(value);
		row.appendChild(cell);
		return cell;
	}

	function assetLink(container, label, url) {
		if (!url) {
			container.textContent = label || 'Unknown asset';
			return;
		}
		const link = document.createElement('a');
		link.href = url;
		link.textContent = label || 'Unknown asset';
		container.appendChild(link);
	}

	function renderJobs(container, jobs, emptyMessage) {
		container.replaceChildren();
		if (!Array.isArray(jobs) || !jobs.length) {
			const empty = document.createElement('p');
			empty.className = 'description';
			empty.textContent = emptyMessage;
			container.appendChild(empty);
			return;
		}
		const wrapper = document.createElement('div');
		wrapper.style.overflowX = 'auto';
		const table = document.createElement('table');
		table.className = 'widefat striped';
		const head = document.createElement('thead');
		const heading = document.createElement('tr');
		['Asset', 'Job', 'Status / progress', 'Priority', 'Scheduled', 'Last update', 'Details'].forEach((label) => {
			const cell = document.createElement('th');
			cell.scope = 'col';
			cell.textContent = label;
			heading.appendChild(cell);
		});
		head.appendChild(heading);
		table.appendChild(head);
		const body = document.createElement('tbody');
		jobs.forEach((job) => {
			const row = document.createElement('tr');
			const asset = document.createElement('td');
			assetLink(asset, job.assetLabel, job.editUrl);
			const id = document.createElement('small');
			id.textContent = ` #${Number(job.assetId) || 0}`;
			asset.appendChild(id);
			row.appendChild(asset);
			textCell(row, job.type);
			const status = job.status === 'running' ? 'Running' :
				job.status === 'queued' ? 'Queued' :
				job.status === 'ready' ? 'Completed' : 'Failed';
			textCell(row, job.percent == null ? status : `${status} · ${job.percent}%`);
			textCell(row, job.priority);
			const scheduled = Number(job.scheduledAt) || 0;
			textCell(row, scheduled > 0 && scheduled <= Date.now() / 1000 ? 'Due now' : formatTime(job.scheduledAtLabel));
			textCell(row, formatTime(job.updatedAtLabel));
			const details = textCell(row, job.message);
			if (job.note) {
				const note = document.createElement('div');
				note.style.fontWeight = '600';
				note.textContent = job.note;
				details.appendChild(note);
			}
			body.appendChild(row);
		});
		table.appendChild(body);
		wrapper.appendChild(table);
		container.appendChild(wrapper);
	}

	function render(snapshot) {
		if (!snapshot || !snapshot.scheduler || !snapshot.worker) return;
		const cron = snapshot.scheduler;
		const lastTick = cron.lastTickAt ? `last tick ${formatTime(cron.lastTickAtLabel)}` : 'no recorded tick';
		const nextTick = cron.nextTickAt ? `; next scheduled ${formatTime(cron.nextTickAtLabel)}` : '';
		root.querySelector('[data-vrodos-jobs-cron]').textContent =
			`${cron.status} · ${lastTick}${nextTick} · request cron ${cron.cronDisabled ? 'disabled' : 'enabled'}`;
		const workerCell = root.querySelector('[data-vrodos-jobs-worker]');
		workerCell.replaceChildren();
		workerCell.appendChild(document.createTextNode(snapshot.worker.status));
		if (snapshot.worker.assetLabel) {
			workerCell.appendChild(document.createTextNode(` · ${snapshot.worker.type || 'Asset'}: `));
			assetLink(workerCell, snapshot.worker.assetLabel, snapshot.worker.editUrl);
		}
		if (snapshot.worker.expiresAt) {
			workerCell.appendChild(document.createTextNode(` · lease expires ${formatTime(snapshot.worker.expiresAtLabel)}`));
		}
		if (snapshot.worker.note) {
			workerCell.appendChild(document.createTextNode(` · ${snapshot.worker.note}`));
		}
		renderJobs(root.querySelector('[data-vrodos-jobs-active]'), snapshot.active, 'No asset jobs are running or queued.');
		renderJobs(root.querySelector('[data-vrodos-jobs-recent]'), snapshot.recent, 'No recent completed or failed jobs are recorded.');
		root.querySelector('[data-vrodos-jobs-updated]').textContent = `Updated ${formatTime(snapshot.generatedAtLabel)} · refreshes every 10 seconds while this tab is visible`;
	}

	function refresh() {
		if (loading || document.hidden) return;
		loading = true;
		const body = new URLSearchParams({
			action: config.action || 'vrodos_background_jobs_status',
			nonce: config.nonce || ''
		});
		fetch(config.ajaxUrl || window.ajaxurl, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: body.toString()
		})
			.then((response) => response.json())
			.then((payload) => {
				if (!payload || !payload.success) throw new Error('Status request failed.');
				render(payload.data);
			})
			.catch(() => {
				root.querySelector('[data-vrodos-jobs-updated]').textContent = 'Could not refresh background jobs. Use Refresh now to retry.';
			})
			.finally(() => { loading = false; });
	}

	root.querySelector('[data-vrodos-jobs-refresh]').addEventListener('click', refresh);
	document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
	render(config.initial);
	window.setInterval(refresh, 10000);
}());
