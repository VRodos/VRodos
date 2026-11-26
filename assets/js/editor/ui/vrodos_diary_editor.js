(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const workspace = document.getElementById('vrodos-diary-workspace');
        const toggle = document.getElementById('vrodos-diary-toggle');
        if (!workspace || !toggle) return;

        const edit = document.getElementById('vrodos-diary-edit');
        const save = document.getElementById('vrodos-diary-save');
        const importCsv = document.getElementById('vrodos-diary-csv-import');
        const exportCsv = document.getElementById('vrodos-diary-csv-export');
        const csvFile = document.getElementById('vrodos-diary-csv-file');
        const addFind = document.getElementById('vrodos-diary-add-find');
        const panel = document.getElementById('vrodos-diary-editor');
        const status = document.getElementById('vrodos-diary-status');
        const tabsMount = document.getElementById('vrodos-diary-tabs');
        const pointStrip = document.getElementById('vrodos-diary-point-strip');
        const pointTabs = document.getElementById('vrodos-diary-point-tabs');
        const addPoint = document.getElementById('vrodos-diary-add-point');
        const timelineMount = document.getElementById('vrodos-diary-timeline');
        const viewport = document.getElementById('vrodos-diary-viewport');
        const viewportMessage = document.getElementById('vrodos-diary-viewport-message');
        const viewportReturn = document.getElementById('vrodos-diary-viewport-return');
        const menu = toggle.closest('details');

        let diary;
        let savedDraft;
        let savePromise;
        let library;
        let tab = 'stages';
        let stageId = '';
        let findId = '';
        let entryId = '';
        let busy = false;
        let pick;
        let preview;
        let importChanges = [];
        let uploadedModel;
        let safePointMarker;
        let statusMessage = '';
        let statusFailed = false;
        const visibility = new Map();
        const dangerButton = 'tw-btn-ghost tw-text-rose-300 hover:tw-bg-white/10';

        function element(tag, text = '') {
            const node = document.createElement(tag);
            node.textContent = text;
            return node;
        }

        function button(text, action, variant = 'tw-border-white/10 tw-bg-slate-700 tw-text-white hover:tw-bg-slate-600', diaryKind) {
            const node = element('button', text);
            node.type = 'button';
            node.disabled = busy;
            node.className = `tw-btn tw-btn-sm ${variant}`;
            if (diaryKind) node.prepend(window.VRODOS.ui.createDiaryIcon(diaryKind));
            node.addEventListener('click', action);
            return node;
        }

        function row(...children) {
            const node = element('div');
            node.className = 'tw-flex tw-flex-wrap tw-items-center tw-gap-2';
            node.append(...children);
            return node;
        }

        function timeline(name, records, key, selectedId, onSelect) {
            const control = element('div');
            control.className = 'diary-timeline';
            const title = element('p');
            title.className = 'tw-text-sm tw-font-semibold tw-text-white';
            const slider = element('input');
            slider.type = 'range';
            slider.min = '0';
            slider.setAttribute('aria-label', name);
            const ticks = element('div');
            ticks.className = 'diary-timeline-ticks';
            ticks.setAttribute('aria-hidden', 'true');
            ticks.append(...records.map(() => element('span')));

            function refresh() {
                const entries = ordered(records);
                const index = entries.findIndex((entry) => entry[key] === selectedId());
                const entry = entries[index];
                const heading = `${index + 1} of ${entries.length} · ${entry.title || 'Untitled entry'}`;
                title.textContent = entry.recorded_on ? `${heading} · ${entry.recorded_on}` : heading;
                slider.max = String(entries.length - 1);
                slider.value = String(index);
                slider.setAttribute('aria-valuetext', title.textContent);
                slider.disabled = busy || entries.length === 1;
                ticks.querySelector('[data-active]')?.removeAttribute('data-active');
                ticks.children[index].dataset.active = '';
            }

            function selectIndex(index) {
                const entry = ordered(records)[index];
                if (!entry || entry[key] === selectedId()) return;
                onSelect(entry);
                refresh();
            }

            slider.addEventListener('input', () => selectIndex(slider.valueAsNumber));
            const heading = element('div');
            heading.className = 'diary-timeline-heading';
            heading.append(title);
            control.append(heading, slider, ticks);
            refresh();
            return { control, refresh, selectIndex };
        }

        function card(title) {
            const node = element('section');
            node.className = 'tw-flex tw-min-w-0 tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-white/10 tw-bg-slate-900 tw-p-4';
            if (title) {
                const heading = element('h3', title);
                heading.className = 'tw-text-sm tw-font-bold tw-text-white';
                node.append(heading);
            }
            return node;
        }

        function hint(text) {
            const node = element('p', text);
            node.className = 'tw-text-sm tw-text-slate-300';
            return node;
        }

        function label(text, input) {
            const node = element('label', text);
            node.className = 'tw-grid tw-gap-1 tw-text-sm tw-font-medium tw-text-slate-200';
            input.classList.add('tw-border-white/15', 'tw-bg-slate-950', 'tw-text-slate-100');
            node.append(input);
            return node;
        }

        function field(text, record, key, type = 'text', onEdit) {
            const input = element(type === 'textarea' ? type : 'input');
            input.className = type === 'textarea'
                ? 'tw-textarea tw-textarea-bordered tw-w-full'
                : 'tw-input tw-input-bordered tw-input-sm tw-w-full';
            if (type !== 'textarea') input.type = type;
            input.name = key;
            input.value = record[key] ?? '';
            input.disabled = busy;
            input.addEventListener('input', () => {
                record[key] = input.value;
                clearPreview();
                onEdit?.();
            });
            return label(text, input);
        }

        function select(text, options, selected, change) {
            const input = element('select');
            input.className = 'tw-select tw-select-bordered tw-select-sm tw-w-full';
            for (const [id, title] of options) input.add(new Option(title, id));
            input.value = selected;
            input.disabled = busy;
            input.addEventListener('change', () => change(input.value));
            return label(text, input);
        }

        function datePicker(record, refresh) {
            const container = element('div');
            container.className = 'diary-date-picker';
            const precisionField = element('div');
            precisionField.className = 'tw-grid tw-gap-1 tw-text-sm tw-font-medium tw-text-slate-200';
            const modes = element('div');
            modes.className = 'tw-join diary-date-modes';
            modes.setAttribute('role', 'group');
            modes.setAttribute('aria-label', 'Recorded date');
            const fields = element('div');
            fields.className = 'diary-date-fields';
            const types = [['', 'None', 'No date'], ['day', 'Exact', 'Exact date'],
                ['month', 'Month', 'Month and year'], ['year', 'Year', 'Year only']];
            const parts = (record.recorded_on || '').split('-');
            const selection = record.recorded_on ? ['year', 'month', 'day'][parts.length - 1] : '';

            function setDate(value) {
                if (record.recorded_on === value) return;
                record.recorded_on = value;
                clearPreview();
                refresh();
            }

            function showFields(precision) {
                fields.replaceChildren();
                fields.hidden = !precision;
                for (const control of modes.children) {
                    const active = control.dataset.precision === precision;
                    control.setAttribute('aria-pressed', String(active));
                    control.classList.toggle('tw-btn-primary', active);
                    control.classList.toggle('tw-btn-ghost', !active);
                }
                const [yearValue = '', monthValue = '', dayValue = ''] = (record.recorded_on || '').split('-');
                if (!precision) {
                    setDate('');
                    return;
                }
                if (precision === 'day') {
                    const date = element('input');
                    date.type = 'date';
                    date.min = '0001-01-01';
                    date.max = '9999-12-31';
                    date.className = 'tw-input tw-input-bordered tw-input-sm tw-w-full';
                    date.value = dayValue ? record.recorded_on : '';
                    date.disabled = busy;
                    date.addEventListener('input', () => setDate(date.validity.valid ? date.value : ''));
                    const exactDate = label('Date', date);
                    exactDate.classList.add('diary-date-exact');
                    fields.append(exactDate);
                    setDate(date.value);
                    return;
                }
                const year = element('input');
                year.type = 'number';
                year.min = '1';
                year.max = '9999';
                year.className = 'tw-input tw-input-bordered tw-input-sm tw-w-full';
                year.value = yearValue;
                year.disabled = busy;
                let month = monthValue;
                const update = () => {
                    const padded = year.value && year.validity.valid ? String(year.valueAsNumber).padStart(4, '0') : '';
                    setDate(padded && precision === 'month' ? (month ? `${padded}-${month}` : '') : padded);
                };
                year.addEventListener('input', update);
                if (precision === 'month') {
                    const monthOptions = Array.from({ length: 12 }, (_item, index) => [
                        String(index + 1).padStart(2, '0'),
                        new Intl.DateTimeFormat(undefined, { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2020, index, 1)))
                    ]);
                    const monthField = select('Month', [['', 'Choose a month'], ...monthOptions], month,
                        (value) => { month = value; update(); });
                    monthField.classList.add('diary-date-month');
                    fields.append(monthField);
                }
                const yearField = label('Year', year);
                yearField.classList.add('diary-date-year');
                fields.append(yearField);
                update();
            }

            for (const [precision, title, description] of types) {
                const control = button(title, () => {
                    if (control.getAttribute('aria-pressed') !== 'true') showFields(precision);
                }, 'tw-join-item');
                control.dataset.precision = precision;
                control.title = description;
                control.setAttribute('aria-label', description);
                modes.append(control);
            }
            precisionField.append(element('span', 'Recorded date'), modes);
            container.append(precisionField, fields);
            showFields(selection);
            return container;
        }

        function checkbox(text, checked, change) {
            const input = element('input');
            input.type = 'checkbox';
            input.className = 'tw-checkbox tw-checkbox-primary tw-checkbox-xs';
            input.checked = checked;
            input.disabled = busy;
            input.addEventListener('change', () => { change(input.checked); clearPreview(); });
            const node = element('label');
            node.className = 'tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-slate-200';
            node.append(input, text);
            return node;
        }

        function changed() {
            clearPreview();
            render();
        }

        function clearPreview() {
            preview = null;
            importChanges = [];
            panel.querySelector('[data-import-preview]')?.remove();
            statusMessage = '';
            statusFailed = false;
            syncEntryPoints();
        }

        function show(text, failed = false) {
            statusMessage = text;
            statusFailed = failed;
            renderStatus(hasDraftChanges());
        }

        function renderStatus(hasChanges) {
            status.textContent = statusMessage || (hasChanges && !busy ? 'Unsaved diary changes' : '');
            status.classList.toggle('tw-text-rose-300', statusFailed);
            status.classList.toggle('tw-text-slate-300', !statusFailed);
        }

        const hasDraftChanges = () => diary && savedDraft !== JSON.stringify(diary);

        async function request(mode, extra = {}) {
            const config = window.vrodos_api_config;
            const body = new URLSearchParams({
                action: 'vrodos_spatial_diary', nonce: panel.dataset.nonce,
                project: config.projectId, scene: config.sceneId, mode, ...extra
            });
            const response = await fetch(config.ajax_url, { method: 'POST', credentials: 'same-origin', body });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.data || 'Diary request failed.');
            return result.data;
        }

        async function run(action) {
            if (busy) return;
            busy = true;
            render();
            try {
                await action();
            } catch (failure) {
                show(failure.message, true);
            } finally {
                busy = false;
                render();
            }
        }

        const modelAt = (id) => window.VRODOS.editor.sceneRegistry?.getByUuid(id);
        const modelName = (id) => modelAt(id)?.name || id;
        const modelCategory = (object) => window.VRODOS.utils.resolveSceneAssetCategory(object);
        const timelineOptions = (records, key) => records.map((record) =>
            [record[key], [`${record.sequence}. ${record.title}`, record.recorded_on].filter(Boolean).join(' · ')]);
        const nextNumber = (records) => Math.max(0, ...records.map((record) => Number(record.sequence) || 0)) + 1;
        const newRecord = (sequence, title) => ({ sequence, title, recorded_on: '', notes: '', source_ref: '' });
        const newId = (kind, ids) => {
            let suffix = ids.length + 1;
            while (ids.includes(`${kind}-${suffix}`)) suffix++;
            return `${kind}-${suffix}`;
        };
        const ordered = (records) => [...records].sort((a, b) => a.sequence - b.sequence);
        const selectedStage = () => diary.stages.find((entry) => entry.stage_id === stageId);
        const selectedFind = () => diary.finds.find((find) => find.find_id === findId);

        function syncSelection() {
            stageId = (selectedStage() || ordered(diary.stages)[0])?.stage_id || '';
            if (!selectedFind()) {
                findId = diary.finds[0]?.find_id || '';
                entryId = '';
            }
        }

        function syncHierarchy() {
            window.VRODOS.ui.setDiaryHierarchy(diary, stageId, tab === 'finds' ? findId : '', safePointMarker?.uuid);
        }

        function sceneModels() {
            const roots = window.VRODOS.editor.sceneRegistry?.getSelectableRoots() || [];
            const placed = roots.filter((object) =>
                object.asset_id && ['decoration', 'walkable-surface', 'collision-proxy'].includes(modelCategory(object))
            ).map((object) => object.uuid);
            return [...new Set([...placed, ...diary.models])];
        }

        function manageModel(id) {
            if (id && !diary.models.includes(id)) diary.models.push(id);
        }

        function releaseUnusedModels(candidates) {
            const used = new Set(diary.stages.flatMap((stage) => stage.layers)
                .concat(diary.finds.flatMap((find) => find.entries.map((entry) => entry.model))));
            const released = new Set(candidates.filter((id) => !used.has(id)));
            resetVisibility();
            diary.models = diary.stages.length || diary.finds.length ? diary.models.filter((id) => !released.has(id)) : [];
        }

        function libraryModels() {
            return (library || Object.values(window.vrodosAssetBrowserItemsById || {})).filter((asset) =>
                asset.glb_id && ['decoration', 'walkable-surface'].includes(modelCategory(asset))
            );
        }

        async function refreshLibrary() {
            library = await window.VRODOS.api.requestAvailableAssets(window.VRODOS.data.projectSlug, window.VRODOS.data.projectId);
        }

        function modelPreview(src) {
            const previewTile = element('span');
            previewTile.className = 'diary-model-preview';
            previewTile.setAttribute('aria-hidden', 'true');
            const icon = element('i');
            icon.dataset.lucide = 'box';
            previewTile.append(icon);
            if (src) {
                const image = element('img');
                image.alt = '';
                image.loading = 'lazy';
                image.decoding = 'async';
                image.addEventListener('error', () => image.remove(), { once: true });
                image.src = src;
                previewTile.append(image);
            }
            return previewTile;
        }

        const openModelList = () => panel.querySelector('.diary-model-list:popover-open');

        function positionModelList(list, anchor = list.previousElementSibling.getBoundingClientRect()) {
            const { clientWidth, clientHeight } = document.documentElement;
            const gap = 6;
            const above = anchor.top - 2 * gap;
            const below = clientHeight - anchor.bottom - 2 * gap;
            const opensAbove = above > below;
            const width = Math.min(anchor.width, clientWidth - 2 * gap);
            const left = Math.max(gap, Math.min(anchor.left, clientWidth - width - gap));
            list.style.width = `${width}px`;
            list.style.left = `${left}px`;
            list.style.top = opensAbove ? 'auto' : `${anchor.bottom + gap}px`;
            list.style.bottom = opensAbove ? `${clientHeight - anchor.top + gap}px` : 'auto';
            list.style.setProperty('--diary-model-list-room', `${Math.max(above, below, 0)}px`);
        }

        function alignOpenModelList() {
            const list = openModelList();
            if (!list) return;
            const anchor = list.previousElementSibling.getBoundingClientRect();
            const bounds = panel.getBoundingClientRect();
            if (anchor.bottom <= bounds.top || anchor.top >= bounds.bottom) list.hidePopover();
            else positionModelList(list, anchor);
        }

        function modelPicker(name, selected, placeholder, onSelect, { position, walkable = false, uploadedAssetId } = {}) {
            const assets = libraryModels();
            const catalog = new Map(assets.map((asset) => [String(asset.asset_id), asset]));
            const displayText = window.VRODOS.utils.displayText;
            const placed = sceneModels()
                .map((id) => ({ id, object: modelAt(id) }))
                .filter(({ id, object }) => id === selected || (object && (walkable
                    ? modelCategory(object) === 'walkable-surface' : modelCategory(object) !== 'collision-proxy')));
            const used = new Set(placed.map(({ object }) => String(object?.asset_id)));
            const choices = [
                ...placed.map(({ id, object }) => {
                    const assetId = String(object?.asset_id);
                    const asset = catalog.get(assetId);
                    return {
                        id, assetId, uploadId: asset?.glb_id ?? object?.glb_id,
                        name: object ? displayText(modelName(id)) : 'Unavailable scene placement',
                        location: 'In scene', thumbnail: asset?.screenshot_path || object?.screenshot_path
                    };
                }),
                ...assets.filter((asset) => !used.has(String(asset.asset_id)) && (!walkable || modelCategory(asset) === 'walkable-surface')).map((asset) => ({
                    id: `asset:${asset.asset_id}`, assetId: String(asset.asset_id), uploadId: asset.glb_id, name: displayText(asset.asset_name),
                    location: 'Asset library', thumbnail: asset.screenshot_path, asset
                }))
            ];
            if (walkable) choices.sort((a, b) => (Number(b.uploadId) || 0) - (Number(a.uploadId) || 0));
            const uploadedIndex = uploadedAssetId ? choices.findIndex(({ assetId }) => assetId === uploadedAssetId) : -1;
            if (uploadedIndex >= 0) choices.unshift(choices.splice(uploadedIndex, 1)[0]);
            const current = choices.find((choice) => choice.id === selected);
            if (placeholder === 'Use the previous model') {
                choices.unshift({ id: '', name: placeholder });
            } else if (selected) {
                choices.push({ id: '', name: 'Clear model' });
            }

            const trigger = element('button');
            trigger.type = 'button';
            trigger.disabled = busy;
            trigger.className = 'diary-model-picker';
            trigger.dataset.diaryModelPicker = name;
            trigger.setAttribute('aria-label', `${name}, ${current?.name || placeholder}`);
            if (current) trigger.append(modelPreview(current.thumbnail));
            trigger.append(element('span', current?.name || placeholder));
            const list = element('ul');
            list.className = 'diary-model-list';
            list.popover = 'auto';
            trigger.popoverTargetElement = list;
            list.addEventListener('beforetoggle', (event) => {
                if (event.newState === 'open') positionModelList(list);
            });

            function focusPicker() {
                [...panel.querySelectorAll('[data-diary-model-picker]')]
                    .find((control) => control.dataset.diaryModelPicker === name)?.focus();
            }

            for (const { id, name: title, thumbnail, location, asset } of choices) {
                const item = element('li');
                const choice = button('', () => {
                    list.hidePopover();
                    if (asset) {
                        placeLibraryModel(asset);
                    } else {
                        if (id !== selected) onSelect(id);
                        focusPicker();
                    }
                });
                choice.className = 'diary-model-option';
                if (id === selected) choice.setAttribute('aria-current', 'true');
                if (location) choice.append(modelPreview(thumbnail));
                const description = element('span', title);
                if (location) description.append(element('small', location));
                choice.append(description);
                item.append(choice);
                list.append(item);
            }
            if (!choices.length) {
                const empty = element('li', walkable ? 'Upload a walkable GLB to add a site model.' : 'Upload a GLB to add a model.');
                empty.className = 'tw-p-2 tw-text-sm tw-text-slate-300';
                list.append(empty);
            }
            const field = element('div');
            field.className = 'diary-model-field tw-grid tw-gap-1 tw-text-sm tw-font-medium tw-text-slate-200';
            field.append(element('span', name), trigger, list);
            if (uploadedIndex >= 0 && !busy) {
                window.queueMicrotask(() => {
                    if (trigger.isConnected && !workspace.hidden) list.showPopover();
                });
            }
            return field;

            function placeLibraryModel(asset) {
                run(async () => {
                    show('Adding the model to the scene…');
                    const { api, data, utils } = window.VRODOS;
                    const nameModel = utils.sceneUniqueObjectName(asset.asset_name, utils.getSceneDataObjectMap() || {});
                    const object = await api.addAssetToCanvas(nameModel, utils.assetBasePathFromPath(asset.path),
                        asset.category_name, asset, position || [0, 0, 0], data.pluginPath, { waitForPlacement: true, autosave: false });
                    if (!object?.uuid) throw new Error('The model could not be placed. Check the asset library and try again.');
                    show('');
                    onSelect(object.uuid);
                }).then(focusPicker);
            }
        }

        function assetControls(context) {
            const walkable = Boolean(context.vrodos_diary_point);
            const upload = button(walkable ? 'Upload walkable GLB' : 'Upload find GLB', async () => {
                if (window.VRODOS.editor.envir?.isSceneLoading) {
                    show('Wait for the scene to finish loading before uploading a model.', true);
                    return;
                }
                const target = new URL(document.getElementById('addNewAssetBtnAssetsList').href);
                const returnUrl = new URL(window.location.href);
                for (const [key, value] of Object.entries(context)) {
                    target.searchParams.set(key, value);
                    returnUrl.searchParams.set(key, value);
                }
                try {
                    await window.VRODOS.api.saveSpatialDiary({ forceSceneSave: true });
                    window.history.replaceState(window.history.state, '', returnUrl);
                    window.location.assign(target);
                } catch (error) {
                    show(error.message, true);
                }
            });
            return row(upload, button('Refresh model list', () => run(refreshLibrary)));
        }

        function resetVisibility() {
            if (!visibility.size) return;
            for (const [model, visible] of visibility) model.visible = visible;
            visibility.clear();
            window.VRODOS.editor.requestRender?.('diary-preview');
        }

        function previewModels(ids) {
            for (const id of diary.models) {
                const object = modelAt(id);
                if (!object) continue;
                if (!visibility.has(object)) visibility.set(object, object.visible);
                object.visible = ids.includes(id);
            }
            window.VRODOS.editor.requestRender?.('diary-preview');
        }

        function useViewport(message, returnLabel) {
            viewportMessage.textContent = message;
            viewportReturn.textContent = returnLabel;
            viewport.hidden = false;
            timelineMount.querySelectorAll('input, button').forEach((control) => { control.disabled = true; });
            workspace.hidden = true;
            syncEntryPoints();
            viewportReturn.focus();
        }

        function syncSafePointMarker() {
            const editor = window.VRODOS.editor;
            const scene = editor.envir?.scene;
            if (!scene || !diary?.stages.length) {
                if (!safePointMarker) return;
                if (editor.selection.get() === safePointMarker) editor.selection.clear({ source: 'diary-safe-viewpoint' });
                editor.sceneRegistry.remove(safePointMarker);
                safePointMarker.children.forEach((mesh) => mesh.geometry.dispose());
                safePointMarker.children[0].material.dispose();
                safePointMarker = null;
            } else {
                if (!safePointMarker) {
                    const marker = new THREE.Group();
                    marker.name = `diary-safe-viewpoint-${marker.uuid}`;
                    marker.asset_name = 'Safe viewpoint';
                    marker.vrodosTranslationOnly = true;
                    const material = new THREE.MeshBasicMaterial({
                        color: 0xfbbf24, side: THREE.DoubleSide, depthWrite: false, toneMapped: false
                    });
                    const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.42, 32), material);
                    ring.rotation.x = -Math.PI / 2;
                    ring.position.y = 0.025;
                    const pin = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.35, 12), material);
                    pin.rotation.z = Math.PI;
                    pin.position.y = 0.22;
                    marker.add(ring, pin);
                    marker.traverse((node) => {
                        node.vrodos_internal_helper = true;
                        node.renderOrder = 1000;
                    });
                    marker.addEventListener('vrodos-transform-commit', () => {
                        diary.safePoint = marker.position.toArray();
                        clearPreview();
                    });
                    marker.addEventListener('vrodos-lock-change', ({ locked }) => {
                        diary.safePointLocked = locked;
                        clearPreview();
                    });
                    safePointMarker = marker;
                }
                safePointMarker.locked = diary.safePointLocked === true;
                if (safePointMarker.parent !== scene) {
                    scene.add(safePointMarker);
                    editor.sceneRegistry.add(safePointMarker, { addToScene: false, selectable: false });
                }
                if (!editor.transforms.isDragging() || editor.transforms.getRealObject() !== safePointMarker) {
                    safePointMarker.position.fromArray(diary.safePoint || [0, 0, 0]);
                }
            }
            editor.requestRender?.('diary-safe-viewpoint');
        }

        function syncScenePreview() {
            const stage = diary ? selectedStage() : null;
            if (stage || diary?.finds.length) {
                const layers = stage?.layers || [];
                const selection = window.VRODOS.editor.selection;
                const selected = selection?.get();
                if (selected && diary.models.includes(selected.uuid) && !layers.includes(selected.uuid)) {
                    selection.clear({ source: 'diary-preview' });
                }
                previewModels(layers);
            } else {
                resetVisibility();
            }
            syncSafePointMarker();
            syncHierarchy();
        }

        function returnToDiary() {
            pick = null;
            viewport.hidden = true;
            workspace.hidden = false;
            render();
            workspace.querySelector('#vrodos-diary-close').focus();
        }

        function previewInViewport(ids, message) {
            previewModels(ids);
            useViewport(message, 'Back to diary');
        }

        function place(labelText, update, { model = null } = {}) {
            pick = { update, model };
            useViewport(`Click ${labelText} in the 3D viewport.`, 'Cancel');
        }

        document.addEventListener('pointerdown', (event) => {
            if (!pick || event.button !== 0 || !event.target.closest('#vr_editor_main_div canvas')) return;
            const ray = window.VRODOS.ui.raycasterSetter(event);
            const hits = pick.model && ray ? ray.intersectObject(pick.model, true) : window.VRODOS.ui.findIntersectedRaw(event);
            const hit = hits.find(({ object }) => {
                for (let node = object; node; node = node.parent) {
                    if (!node.visible) return false;
                }
                return true;
            });
            if (!hit) return;
            event.stopImmediatePropagation();
            event.preventDefault();
            const point = hit.point.clone();
            if (pick.model) pick.model.worldToLocal(point);
            pick.update(point.toArray().map((coordinate) => Number(coordinate.toFixed(4))));
            clearPreview();
            show('Point placed. Save the scene to keep it.');
            returnToDiary();
        }, true);
        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape' || viewport.hidden) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            returnToDiary();
        }, true);

        function editRecord(section, record, refreshTimeline, picker, uploadContext) {
            const heading = row(field('Title', record, 'title', 'text', refreshTimeline), datePicker(record, refreshTimeline));
            heading.classList.add('diary-form-row');
            const actions = assetControls(uploadContext);
            const notes = field('Notes', record, 'notes', 'textarea');
            section.append(heading);
            if (uploadContext.vrodos_diary_point) {
                const model = element('div');
                model.className = 'diary-stage-model';
                model.append(picker, actions);
                const details = element('div');
                details.className = 'diary-stage-details';
                details.append(model, notes);
                section.append(details);
                return;
            }
            const model = row(picker, actions);
            model.classList.add('diary-form-row');
            section.append(model, notes);
        }

        function entryOrderControls(records, entry, onReorder) {
            const entries = ordered(records);
            if (entries.length < 2) return document.createDocumentFragment();
            const index = entries.indexOf(entry);
            const details = element('details');
            const summary = element('summary', 'Change timeline order');
            summary.className = 'tw-cursor-pointer tw-text-sm tw-text-slate-200';
            const move = (neighbor) => {
                const sequence = entry.sequence;
                entry.sequence = neighbor.sequence;
                neighbor.sequence = sequence;
                onReorder?.();
                changed();
            };
            const earlier = button('Move earlier', () => move(entries[index - 1]));
            const later = button('Move later', () => move(entries[index + 1]));
            earlier.disabled = busy || index === 0;
            later.disabled = busy || index === entries.length - 1;
            const controls = row(earlier, later);
            controls.classList.add('tw-mt-2');
            details.append(summary, controls);
            return details;
        }

        function createExcavation() {
            stageId = 'stage-1';
            diary.stages.push({ ...newRecord(1, 'Before excavation'), stage_id: stageId, context_id: '', site_model: '', layers: [] });
            clearPreview();
            openWorkspace('input[name="title"]');
        }

        function createFind(discoveryStageId = '') {
            tab = 'finds';
            findId = newId('find', diary.finds.map((item) => item.find_id));
            entryId = 'entry-1';
            diary.finds.push({ find_id: findId, find_label: 'New find', discovery_stage_id: discoveryStageId,
                point: null, entries: [{ ...newRecord(1, 'Discovered'), entry_id: entryId, model: '', pins: [] }] });
            clearPreview();
            openWorkspace('input[name="find_label"]');
        }

        function addExcavationPoint() {
            const stages = ordered(diary.stages);
            const last = stages.at(-1);
            stageId = newId('stage', stages.map((item) => item.stage_id));
            diary.stages.push({ ...newRecord(nextNumber(stages), 'Excavation entry'), stage_id: stageId, context_id: '',
                site_model: last.site_model || '', layers: [...last.layers] });
            tab = 'stages';
            clearPreview();
            openWorkspace('input[name="title"]');
        }

        function renderExcavationTimeline(onSelect) {
            if (!diary.stages.length) return null;
            const excavationTimeline = timeline('Excavation timeline', diary.stages, 'stage_id', () => stageId, (next) => {
                stageId = next.stage_id;
                onSelect?.(next);
                syncScenePreview();
            });
            const { control } = excavationTimeline;
            control.querySelector('.diary-timeline-heading').prepend(window.VRODOS.ui.createDiaryIcon('excavation'));
            timelineMount.append(control);
            timelineMount.hidden = false;
            window.VRODOS.ui.refreshLucideIcons({ root: timelineMount });
            return excavationTimeline;
        }

        function renderStages(section, models) {
            const stages = ordered(diary.stages);
            const stage = selectedStage();
            if (!stage) {
                section.append(row(button('Create excavation diary', createExcavation, 'tw-btn-primary', 'excavation')));
                return;
            }
            const fields = element('div');
            fields.className = 'tw-flex tw-flex-col tw-gap-3';
            let draggedIndex = -1;
            const { refresh, selectIndex } = renderExcavationTimeline((entry) => {
                renderFields(entry);
                refreshPointTabs(true);
                panel.scrollTop = 0;
            });
            section.className = 'tw-min-w-0';
            const points = stages.map((entry, index) => {
                const control = button('', () => selectIndex(index), '');
                const pane = element('div');
                pane.id = `vrodos-diary-point-panel-${index}`;
                control.id = `vrodos-diary-point-tab-${index}`;
                control.setAttribute('role', 'tab');
                control.setAttribute('aria-controls', pane.id);
                pane.setAttribute('role', 'tabpanel');
                pane.setAttribute('aria-labelledby', control.id);
                control.append(element('span'), element('time'));
                bindPointReordering(control, entry, index);
                return { entry, control, pane };
            });
            section.append(...points.map(({ pane }) => pane));
            pointTabs.append(...points.map(({ control }) => control));
            pointStrip.hidden = false;

            function refreshPointTabs(scroll = false) {
                for (const [index, { entry, control, pane }] of points.entries()) {
                    const active = entry.stage_id === stageId;
                    const [title, date] = control.children;
                    title.textContent = `${index + 1}. ${entry.title || 'Untitled entry'}`;
                    date.textContent = entry.recorded_on;
                    date.dateTime = entry.recorded_on;
                    date.hidden = !entry.recorded_on;
                    const name = [title.textContent, entry.recorded_on].filter(Boolean).join(' · ');
                    control.title = control.draggable ? `${name}\nDrag to reorder, or use Shift+Left or Shift+Right.` : name;
                    control.setAttribute('aria-label', name);
                    control.setAttribute('aria-selected', String(active));
                    control.tabIndex = active ? 0 : -1;
                    pane.hidden = !active;
                    if (active) {
                        if (fields.parentElement !== pane) pane.append(fields);
                        if (scroll && !workspace.hidden) control.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                    }
                }
            }

            function movePoint(from, to) {
                if (from === to || to < 0 || to >= stages.length) return false;
                const slots = stages.map((entry) => entry.sequence);
                const next = [...stages];
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);
                next.forEach((entry, index) => { entry.sequence = slots[index]; });
                changed();
                return true;
            }

            function bindPointReordering(control, entry, index) {
                control.draggable = !busy && stages.length > 1;
                if (!control.draggable) return;
                control.setAttribute('aria-keyshortcuts', 'Shift+ArrowLeft Shift+ArrowRight');

                const dropSide = (event) => {
                    const bounds = control.getBoundingClientRect();
                    return event.clientX < bounds.left + bounds.width / 2 ? 'before' : 'after';
                };
                const clearDropSide = () => { delete control.dataset.dropSide; };
                control.addEventListener('dragstart', (event) => {
                    draggedIndex = index;
                    control.dataset.dragging = '';
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', entry.title);
                });
                control.addEventListener('dragover', (event) => {
                    if (draggedIndex < 0) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    if (draggedIndex !== index) control.dataset.dropSide = dropSide(event);
                });
                control.addEventListener('dragleave', clearDropSide);
                control.addEventListener('drop', (event) => {
                    if (draggedIndex < 0) return;
                    event.preventDefault();
                    const slot = index + Number(dropSide(event) === 'after');
                    const from = draggedIndex;
                    clearDropSide();
                    movePoint(from, slot > from ? slot - 1 : slot);
                });
                control.addEventListener('dragend', () => {
                    draggedIndex = -1;
                    delete control.dataset.dragging;
                    pointTabs.querySelector('[data-drop-side]')?.removeAttribute('data-drop-side');
                });
                control.addEventListener('keydown', (event) => {
                    if (!event.shiftKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    const to = index + (event.key === 'ArrowLeft' ? -1 : 1);
                    if (movePoint(index, to)) pointTabs.children[to].focus();
                });
            }

            function renderFields(entry) {
                fields.replaceChildren();
                const model = entry.site_model || '';
                const picker = modelPicker('Walkable site model', model, 'Choose a walkable GLB', (id) => {
                    uploadedModel = null;
                    manageModel(id);
                    entry.site_model = id;
                    const extra = entry.layers.filter((layer) => layer !== model && layer !== id);
                    entry.layers = id ? [id, ...extra] : extra;
                    changed();
                }, {
                    position: modelAt(model)?.position?.toArray(),
                    walkable: true,
                    uploadedAssetId: uploadedModel?.point === entry.stage_id ? uploadedModel.assetId : ''
                });
                editRecord(fields, entry, () => {
                    refresh();
                    refreshPointTabs();
                    syncHierarchy();
                }, picker, { vrodos_diary_point: entry.stage_id });
                const additional = models.filter((id) => id !== model);
                if (additional.length) {
                    const details = element('details');
                    const summary = element('summary', 'Additional layers');
                    summary.className = 'tw-cursor-pointer tw-text-sm tw-font-medium tw-text-slate-200';
                    const layers = element('div');
                    layers.className = 'tw-mt-2 tw-flex tw-flex-col tw-gap-2';
                    for (const id of additional) {
                        layers.append(checkbox(modelName(id), entry.layers.includes(id), (checked) => {
                            if (checked) manageModel(id);
                            entry.layers = checked ? [...entry.layers, id] : entry.layers.filter((layer) => layer !== id);
                            syncScenePreview();
                        }));
                    }
                    details.append(summary, layers);
                    fields.append(details);
                }
                const remove = button('Delete timeline point', () => {
                    if (diary.finds.some((find) => find.discovery_stage_id === entry.stage_id)) {
                        show('Move the linked finds to another entry or make them standalone first.', true);
                        return;
                    }
                    stageId = (stages[stages.indexOf(entry) + 1] || stages[stages.indexOf(entry) - 1])?.stage_id || '';
                    diary.stages = diary.stages.filter((item) => item !== entry);
                    if (!diary.stages.length) {
                        diary.safePoint = null;
                        diary.safePointLocked = false;
                        if (diary.finds.length) tab = 'finds';
                    }
                    releaseUnusedModels(entry.layers);
                    changed();
                }, dangerButton);
                fields.append(row(button('Add linked find diary', () => createFind(entry.stage_id), undefined, 'find'), remove));
            }
            renderFields(stage);
            refreshPointTabs(true);
        }

        function currentFindModel(entries, entry) {
            let id = '';
            for (const item of entries) {
                id = item.model || id;
                if (item === entry) return id;
            }
            return id;
        }

        function renderFinds(section) {
            const stages = ordered(diary.stages);
            const find = selectedFind();
            const header = row(section.firstElementChild,
                button('Add standalone find diary', () => createFind(), find ? undefined : 'tw-btn-primary', 'find'));
            header.classList.add('diary-section-heading');
            section.prepend(header);
            if (!find) return;
            const discovery = select('Discovery entry', [['', 'Standalone'], ...timelineOptions(stages, 'stage_id')],
                find.discovery_stage_id, (id) => {
                    find.discovery_stage_id = id;
                    if (id) stageId = id;
                    changed();
                    panel.querySelector('[name="discovery_stage_id"]').focus();
                });
            discovery.querySelector('select').name = 'discovery_stage_id';
            const metadata = row(field('Find label', find, 'find_label', 'text', syncHierarchy), discovery,
                button(find.point ? 'Move find marker' : 'Place find marker', () => {
                    const stage = stages.find((item) => item.stage_id === find.discovery_stage_id) || selectedStage();
                    previewModels(stage?.layers || []);
                    place('the discovery location', (point) => { find.point = point; });
                }));
            metadata.classList.add('diary-form-row');
            section.append(metadata);
            const entries = ordered(find.entries);
            const entry = entries.find((item) => item.entry_id === entryId) || entries[0];
            const history = row(element('h4', 'Find history'), button('Add find entry', () => {
                entryId = newId('entry', entries.map((item) => item.entry_id));
                find.entries.push({ ...newRecord(nextNumber(entries), 'Find entry'), entry_id: entryId, model: '', pins: [] });
                changed();
            }));
            history.classList.add('diary-section-heading', 'diary-history-heading');
            section.append(history);
            const removeFind = row(button('Delete find diary', () => {
                diary.finds = diary.finds.filter((item) => item !== find);
                if (!diary.finds.length && diary.stages.length) tab = 'stages';
                releaseUnusedModels(find.entries.map((item) => item.model));
                changed();
            }, dangerButton));
            if (!entry) {
                section.append(removeFind);
                return;
            }
            entryId = entry.entry_id;
            const fields = element('div');
            fields.className = 'tw-flex tw-flex-col tw-gap-3';
            const { control, refresh } = timeline('Find timeline', find.entries, 'entry_id', () => entryId, (next) => {
                entryId = next.entry_id;
                renderFindEntry(fields, find, next, refresh);
            });
            section.append(control, fields, removeFind);
            renderFindEntry(fields, find, entry, refresh);
        }

        function renderFindEntry(section, find, entry, refresh) {
            section.replaceChildren();
            const entries = ordered(find.entries);
            const modelId = currentFindModel(entries, entry);
            const model = modelAt(modelId);
            const picker = modelPicker('Model version', entry.model, entry === entries[0] ? 'Choose a model' : 'Use the previous model', (id) => {
                if (entry.pins.length && !window.confirm('Change the model and remove pins placed on this entry?')) {
                    render();
                    return;
                }
                uploadedModel = null;
                manageModel(id);
                entry.model = id;
                entry.pins = [];
                changed();
            }, { uploadedAssetId: uploadedModel?.find === find.find_id && uploadedModel?.entry === entry.entry_id ? uploadedModel.assetId : '' });
            editRecord(section, entry, refresh, picker, { vrodos_diary_find: find.find_id, vrodos_diary_entry: entry.entry_id });
            if (model) {
                section.append(row(button('Show inspection model', () => previewInViewport([modelId], `Previewing ${modelName(modelId)}.`))));
            }
            for (const [index, pin] of entry.pins.entries()) {
                section.append(field(`Annotation ${index + 1}`, pin, 'text', 'textarea'), button(`Remove pin ${index + 1}`, () => {
                    entry.pins.splice(index, 1); changed();
                }, dangerButton));
            }
            section.append(entryOrderControls(find.entries, entry, () => {
                let model = '';
                for (const item of ordered(find.entries)) {
                    model = item.model || model;
                    if (item.pins.length && item.pins[0].model !== model) {
                        item.model = item.pins[0].model;
                        model = item.model;
                    }
                }
            }), row(button('Place annotation pin', () => {
                if (!model) { show('Assign and load a find model first.', true); return; }
                previewModels([modelId]);
                place('the find model at the annotation point', (point) => entry.pins.push({ point, text: 'Annotation', model: modelId }), { model });
            }), button('Delete timeline point', () => {
                if (find.entries.length === 1) { show('Delete the find to remove its only timeline point.', true); return; }
                const following = entries[entries.indexOf(entry) + 1];
                if (entry.model && following && !following.model) following.model = entry.model;
                find.entries = find.entries.filter((item) => item !== entry);
                releaseUnusedModels([entry.model]);
                changed();
            }, dangerButton)));
        }

        function downloadCsv() {
            const excavation = tab === 'stages';
            const columns = (excavation ? panel.dataset.stageColumns : panel.dataset.findColumns).split(',');
            const records = excavation ? ordered(diary.stages) : diary.finds.flatMap((find) =>
                ordered(find.entries).map((entry) => ({ ...find, ...entry })));
            const lines = records.map((record) => columns.map((column) =>
                `"${String(record[column] ?? '').replaceAll('"', '""')}"`).join(','));
            const csv = `\uFEFF${[columns.join(','), ...lines, ''].join('\r\n')}`;
            const download = element('a');
            download.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
            download.download = excavation ? 'excavation-stages.csv' : 'find-entries.csv';
            download.click();
        }

        async function previewCsv(file) {
            clearPreview();
            await run(async () => {
                if (file.size > 1024 * 1024) throw new Error('Use a UTF-8 CSV file under 1 MB.');
                const result = await request('preview', { kind: tab, csv: await file.text(), diary: JSON.stringify(diary) });
                preview = result.diary;
                importChanges = preview ? result.changes : [];
                panel.scrollTop = 0;
                show(result.errors.length ? result.errors.join('\n') : `${result.counts.added} added, ${result.counts.updated} updated and ${result.counts.unchanged} unchanged.`, Boolean(result.errors.length));
            });
            if (!workspace.hidden) panel.querySelector('[data-apply-preview]')?.focus();
        }

        function renderImportPreview() {
            const section = card('CSV import preview');
            section.dataset.importPreview = '';
            if (importChanges.length) {
                const details = element('details');
                const list = element('ul');
                for (const item of importChanges) {
                    const { key, title, change, discovery_stage_id: discoveryId } = item;
                    const discovery = preview.stages.find((entry) => entry.stage_id === discoveryId);
                    const description = discoveryId === undefined ? '' :
                        ` · Discovery entry → ${discovery ? discovery.title : 'Standalone'}`;
                    list.append(element('li', `${change === 'added' ? 'Add' : 'Update'} ${key} · ${title}${description}`));
                }
                details.append(element('summary', 'View changes'), list);
                section.append(details);
            }
            const apply = button('Apply to draft', () => {
                preview.safePoint = diary.safePoint;
                preview.safePointLocked = diary.safePointLocked === true;
                diary = preview;
                if (tab === 'finds') stageId = selectedFind()?.discovery_stage_id || stageId;
                changed();
                show('CSV applied. Save the scene to keep these changes.');
            });
            apply.dataset.applyPreview = 'true';
            section.append(apply);
            return section;
        }

        function releaseDiaryModel(removed) {
            if (busy || !viewport.hidden || !diary?.models.includes(removed) ||
                !window.confirm(`Remove "${modelName(removed)}" from every diary entry? Its placement will return to the ordinary scene.`)) return;
            resetVisibility();
            diary.models = diary.models.filter((id) => id !== removed);
            for (const stage of diary.stages) {
                if (stage.site_model === removed) stage.site_model = '';
                stage.layers = stage.layers.filter((layer) => layer !== removed);
            }
            for (const find of diary.finds) {
                let current = '';
                for (const entry of ordered(find.entries)) {
                    current = entry.model || current;
                    if (current === removed) {
                        entry.model = '';
                        entry.pins = [];
                    }
                }
            }
            changed();
        }

        function render() {
            syncEntryPoints();
            panel.replaceChildren();
            tabsMount.replaceChildren();
            pointTabs.replaceChildren();
            pointStrip.hidden = true;
            timelineMount.replaceChildren();
            timelineMount.hidden = true;
            if (!diary) {
                if (busy) panel.append(hint('Loading diary…'));
                else panel.append(button('Retry loading diary', load));
                return;
            }
            syncSelection();
            const tabs = row(...[['stages', 'Excavation diary', 'excavation'], ['finds', 'Find diaries', 'find']].map(([id, title, kind]) => {
                const active = tab === id;
                const control = button(title, () => {
                    if (tab === id) return;
                    tab = id;
                    if (tab === 'finds') stageId = selectedFind()?.discovery_stage_id || stageId;
                    show('');
                    clearPreview();
                    render();
                    panel.scrollTop = 0;
                    tabsMount.querySelector('button[aria-pressed=true]')?.focus();
                }, active ? 'tw-btn-primary' : 'tw-btn-ghost tw-text-slate-300 hover:tw-bg-white/10 hover:tw-text-white', kind);
                control.setAttribute('aria-pressed', String(active));
                return control;
            }));
            tabsMount.append(tabs);

            const records = card(tab === 'stages' ? (diary.stages.length ? '' : 'Excavation diary') : 'Find diary');
            if (tab === 'stages') renderStages(records, sceneModels());
            else {
                renderExcavationTimeline();
                renderFinds(records);
            }
            const layout = element('div');
            layout.className = 'diary-layout';
            if (preview) layout.append(renderImportPreview());
            layout.append(records);
            panel.append(layout);
            window.VRODOS.ui.refreshLucideIcons({ root: workspace });
            if (viewport.hidden) syncScenePreview();
        }

        const setWorkspaceOpen = (open) => {
            workspace.hidden = !open;
            syncEntryPoints();
        };

        function syncEntryPoints() {
            const hasDiary = Boolean(diary && (diary.stages.length || diary.finds.length));
            const hasChanges = Boolean(hasDraftChanges());
            const expanded = !workspace.hidden || !viewport.hidden;
            edit.hidden = !hasDiary;
            save.hidden = !hasDiary && !hasChanges;
            save.disabled = busy || !hasChanges;
            renderStatus(hasChanges);
            importCsv.disabled = exportCsv.disabled = busy || !diary;
            addPoint.disabled = busy || !diary?.stages.length;
            toggle.disabled = busy;
            addFind.disabled = busy;
            const kind = tab === 'finds' ? 'find' : 'excavation';
            if (edit.dataset.diaryKind !== kind) {
                edit.dataset.diaryKind = kind;
                edit.firstElementChild.replaceWith(window.VRODOS.ui.createDiaryIcon(kind));
                window.VRODOS.ui.refreshLucideIcons({ root: edit });
            }
            toggle.setAttribute('aria-expanded', String(expanded && tab === 'stages'));
            edit.setAttribute('aria-expanded', String(expanded));
        }

        function load() {
            run(async () => {
                diary = await request('read');
                savedDraft = JSON.stringify(diary);
                if (!diary.stages.length && diary.finds.length) tab = 'finds';
                show('');
                const url = new URL(window.location.href);
                const point = url.searchParams.get('vrodos_diary_point');
                const find = diary.finds.find((item) => item.find_id === url.searchParams.get('vrodos_diary_find'));
                if (!point && !find) return;
                if (diary.stages.some((item) => item.stage_id === point)) {
                    tab = 'stages';
                    stageId = point;
                } else if (find) {
                    tab = 'finds';
                    findId = find.find_id;
                    entryId = url.searchParams.get('vrodos_diary_entry');
                    if (find.discovery_stage_id) stageId = find.discovery_stage_id;
                } else return;
                const assetId = url.searchParams.get('vrodos_diary_model');
                if (assetId) {
                    uploadedModel = { point, find: find?.find_id, entry: entryId, assetId };
                    show('Choose the uploaded GLB from the model list. Refresh the list if the asset is still being prepared.');
                }
                for (const key of ['vrodos_diary_point', 'vrodos_diary_find', 'vrodos_diary_entry', 'vrodos_diary_model']) {
                    url.searchParams.delete(key);
                }
                window.history.replaceState(window.history.state, '', url);
                setWorkspaceOpen(true);
            });
        }

        window.VRODOS.api.saveSpatialDiary = ({ sceneSaved = false, forceSceneSave = false } = {}) => {
            if (savePromise) return savePromise;
            const saveDiary = hasDraftChanges();
            if (!saveDiary && !forceSceneSave) return Promise.resolve();
            if (busy) return Promise.reject(new Error('Wait until the diary finishes loading.'));
            busy = true;
            show(saveDiary ? 'Saving diary…' : 'Saving scene…');
            render();
            savePromise = (async () => {
                if (!sceneSaved) await window.VRODOS.api.saveChanges({ force: true });
                if (!saveDiary) {
                    show('');
                    return;
                }
                const submittedPoint = diary.safePoint;
                const submittedLock = diary.safePointLocked;
                const saved = await request('save', { diary: JSON.stringify(diary) });
                const latestPoint = diary.safePoint;
                const latestLock = diary.safePointLocked;
                diary = saved;
                savedDraft = JSON.stringify(diary);
                if (latestPoint !== submittedPoint) diary.safePoint = latestPoint;
                if (latestLock !== submittedLock) diary.safePointLocked = latestLock;
                show(hasDraftChanges() ? '' : 'Diary saved with the scene.');
            })().catch((error) => {
                setWorkspaceOpen(true);
                show(error.message, true);
                throw error;
            }).finally(() => {
                busy = false;
                savePromise = null;
                render();
            });
            return savePromise;
        };

        function openWorkspace(focusSelector) {
            pick = null;
            viewport.hidden = true;
            setWorkspaceOpen(true);
            if (!diary) load();
            else render();
            panel.scrollTop = 0;
            if (focusSelector) {
                (panel.querySelector(focusSelector) || workspace.querySelector('#vrodos-diary-close')).focus();
            }
        }

        function closeWorkspace() {
            pick = null;
            viewport.hidden = true;
            setWorkspaceOpen(false);
            render();
            (edit.hidden ? menu.querySelector('summary') : edit).focus();
        }

        toggle.addEventListener('click', () => {
            menu.open = false;
            tab = 'stages';
            if (diary && !diary.stages.length) createExcavation();
            else openWorkspace('button:not(:disabled)');
        });
        addFind.addEventListener('click', () => {
            menu.open = false;
            if (diary) createFind();
            else openWorkspace();
        });
        document.addEventListener('vrodos:diary-hierarchy-select', ({ detail }) => {
            if (!diary || busy || !viewport.hidden) return;
            if (detail.safePoint) {
                if (safePointMarker) {
                    window.VRODOS.editor.selection.select(safePointMarker, { source: 'hierarchy', focusCamera: true });
                }
                return;
            }
            const previousTab = tab;
            if (detail.findId) {
                const find = diary.finds.find((item) => item.find_id === detail.findId);
                if (!find) return;
                tab = 'finds';
                if (findId !== find.find_id) entryId = '';
                findId = find.find_id;
                if (find.discovery_stage_id) stageId = find.discovery_stage_id;
            } else {
                tab = 'stages';
                stageId = detail.stageId;
            }
            if (previousTab !== tab) clearPreview();
            render();
            if (!workspace.hidden) panel.scrollTop = 0;
        });
        document.addEventListener('vrodos:diary-release-model', ({ detail }) => releaseDiaryModel(detail));
        edit.addEventListener('click', () => {
            if (workspace.hidden) openWorkspace();
            else closeWorkspace();
        });
        addPoint.addEventListener('click', addExcavationPoint);
        save.addEventListener('click', () => {
            window.VRODOS.api.saveSpatialDiary().catch((error) => console.warn('VRodos: could not save the diary.', error));
        });
        importCsv.addEventListener('click', () => csvFile.click());
        exportCsv.addEventListener('click', downloadCsv);
        csvFile.addEventListener('change', () => {
            const file = csvFile.files[0];
            csvFile.value = '';
            if (file && !busy) previewCsv(file);
        });
        document.getElementById('vrodos-diary-close').addEventListener('click', closeWorkspace);
        viewportReturn.addEventListener('click', returnToDiary);
        workspace.addEventListener('keydown', (event) => event.stopPropagation());
        pointTabs.addEventListener('keydown', (event) => {
            if (busy) return;
            const controls = [...pointTabs.children];
            const index = controls.indexOf(event.target);
            if (index < 0) return;
            let next;
            switch (event.key) {
                case 'ArrowLeft': next = (index + controls.length - 1) % controls.length; break;
                case 'ArrowRight': next = (index + 1) % controls.length; break;
                case 'Home': next = 0; break;
                case 'End': next = controls.length - 1; break;
                default: return;
            }
            event.preventDefault();
            controls[next].click();
            controls[next].focus({ preventScroll: true });
        });
        timelineMount.addEventListener('keydown', (event) => event.stopPropagation());
        panel.addEventListener('scroll', alignOpenModelList, { passive: true });
        window.addEventListener('resize', alignOpenModelList);
        const refreshWorkspace = () => {
            if (!diary || busy || !viewport.hidden || (workspace.hidden && !diary.stages.length && !diary.finds.length)) return;
            const previousPicker = openModelList()?.previousElementSibling;
            const hasPickerFocus = previousPicker?.parentElement.contains(document.activeElement);
            render();
            if (previousPicker) {
                const currentPicker = [...panel.querySelectorAll('[data-diary-model-picker]')]
                    .find((control) => control.dataset.diaryModelPicker === previousPicker.dataset.diaryModelPicker);
                if (currentPicker) {
                    currentPicker.popoverTargetElement.showPopover();
                    if (hasPickerFocus) currentPicker.focus({ preventScroll: true });
                }
            }
        };
        document.addEventListener('vrodos:scene-loaded', refreshWorkspace);
        document.addEventListener('vrodos:asset-library-loaded', refreshWorkspace);
        load();
    });
})();
