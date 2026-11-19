(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const workspace = document.getElementById('vrodos-diary-workspace');
        const toggle = document.getElementById('vrodos-diary-toggle');
        if (!workspace || !toggle) return;

        const edit = document.getElementById('vrodos-diary-edit');
        const save = document.getElementById('vrodos-diary-save');
        const menuLabel = toggle.querySelector('span');
        const panel = document.getElementById('vrodos-diary-editor');
        const status = document.getElementById('vrodos-diary-status');
        const tabsMount = document.getElementById('vrodos-diary-tabs');
        const timelineMount = document.getElementById('vrodos-diary-timeline');
        const viewport = document.getElementById('vrodos-diary-viewport');
        const viewportMessage = document.getElementById('vrodos-diary-viewport-message');
        const viewportReturn = document.getElementById('vrodos-diary-viewport-return');
        const menu = toggle.closest('details');

        let diary;
        let savedDraft;
        let savePromise;
        let startingDiary = false;
        let library;
        let tab = 'stages';
        let stageId = '';
        let findId = '';
        let entryId = '';
        let busy = false;
        let pick;
        let preview;
        let importChanges = [];
        const visibility = new Map();
        const dangerButton = 'tw-btn-ghost tw-text-rose-300 hover:tw-bg-white/10';

        function element(tag, text = '') {
            const node = document.createElement(tag);
            node.textContent = text;
            return node;
        }

        function button(text, action, variant = 'tw-border-white/10 tw-bg-slate-700 tw-text-white hover:tw-bg-slate-600') {
            const node = element('button', text);
            node.type = 'button';
            node.disabled = busy;
            node.className = `tw-btn tw-btn-sm ${variant}`;
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
            control.className = 'diary-timeline tw-rounded-lg tw-border tw-border-white/10 tw-bg-slate-900 tw-p-3';
            const title = element('p');
            title.className = 'tw-text-sm tw-font-semibold tw-text-white';
            const slider = element('input');
            slider.type = 'range';
            slider.min = '0';
            slider.setAttribute('aria-label', name);
            const previous = button('Previous', () => selectIndex(slider.valueAsNumber - 1));
            const next = button('Next', () => selectIndex(slider.valueAsNumber + 1));

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
                previous.disabled = busy || index === 0;
                next.disabled = busy || index === entries.length - 1;
            }

            function selectIndex(index) {
                const entry = ordered(records)[index];
                if (!entry || entry[key] === selectedId()) return;
                onSelect(entry);
                refresh();
            }

            slider.addEventListener('input', () => selectIndex(slider.valueAsNumber));
            control.append(title, previous, slider, next);
            refresh();
            return { control, refresh };
        }

        function card(title) {
            const node = element('section');
            node.className = 'tw-flex tw-min-w-0 tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-white/10 tw-bg-slate-900 tw-p-4';
            const heading = element('h3', title);
            heading.className = 'tw-text-sm tw-font-bold tw-text-white';
            node.append(heading);
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

        function field(text, record, key, type = 'text') {
            const input = element(type === 'textarea' ? type : 'input');
            input.className = type === 'textarea'
                ? 'tw-textarea tw-textarea-bordered tw-w-full'
                : 'tw-input tw-input-bordered tw-input-sm tw-w-full';
            if (type !== 'textarea') input.type = type;
            input.value = record[key] ?? '';
            input.disabled = busy;
            input.addEventListener('input', () => {
                record[key] = input.value;
                clearPreview();
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
            container.className = 'tw-flex tw-flex-col tw-gap-2';
            const fields = element('div');
            fields.className = 'diary-date-fields';
            const types = [['', 'No date'], ['day', 'Exact date'], ['month', 'Month and year'], ['year', 'Year only']];
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
                    fields.append(label('Date', date));
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
                    fields.append(select('Month', [['', 'Choose a month'], ...monthOptions], month, (value) => { month = value; update(); }));
                }
                fields.append(label('Year', year));
                update();
            }

            container.append(select('Recorded date', types, selection, showFields), fields);
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
            panel.querySelector('[data-apply-preview]')?.remove();
            panel.querySelector('[data-import-changes]')?.remove();
            syncEntryPoints();
            if (hasDraftChanges()) show('Unsaved diary changes');
        }

        function show(text, failed = false) {
            status.textContent = text;
            status.classList.toggle('tw-text-rose-300', failed);
            status.classList.toggle('tw-text-slate-300', !failed);
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
        const timelineOptions = (records, key) => records.map((record) => [record[key], `${record.sequence}. ${record.title}`]);
        const nextNumber = (records) => Math.max(0, ...records.map((record) => Number(record.sequence) || 0)) + 1;
        const newRecord = (sequence, title) => ({ sequence, title, recorded_on: '', notes: '', source_ref: '' });
        const newId = (kind, ids) => {
            let suffix = ids.length + 1;
            while (ids.includes(`${kind}-${suffix}`)) suffix++;
            return `${kind}-${suffix}`;
        };
        const ordered = (records) => [...records].sort((a, b) => a.sequence - b.sequence);
        const selectedStage = () => diary.stages.find((entry) => entry.stage_id === stageId);

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

        function modelPicker(name, selected, placeholder, onSelect, position) {
            const assets = libraryModels();
            const catalog = new Map(assets.map((asset) => [String(asset.asset_id), asset]));
            const displayText = window.VRODOS.utils.displayText;
            const placed = sceneModels()
                .map((id) => ({ id, object: modelAt(id) }))
                .filter(({ id, object }) => id === selected || modelCategory(object) !== 'collision-proxy');
            const used = new Set(placed.map(({ object }) => String(object?.asset_id)));
            const choices = [
                ...placed.map(({ id, object }) => ({
                    id, name: object ? displayText(modelName(id)) : 'Unavailable scene placement', location: 'In scene',
                    thumbnail: catalog.get(String(object?.asset_id))?.screenshot_path || object?.screenshot_path
                })),
                ...assets.filter((asset) => !used.has(String(asset.asset_id))).map((asset) => ({
                    id: `asset:${asset.asset_id}`, name: displayText(asset.asset_name), location: 'Asset library', thumbnail: asset.screenshot_path, asset
                }))
            ];
            const current = choices.find((choice) => choice.id === selected);
            if (placeholder === 'Use the previous model') {
                choices.unshift({ id: '', name: placeholder });
            } else if (selected) {
                choices.push({ id: '', name: 'Clear model' });
            }

            const disclosure = element('details');
            disclosure.className = 'diary-model-picker';
            const summary = element('summary');
            summary.dataset.diaryModelPicker = name;
            summary.setAttribute('aria-label', `${name}, ${current?.name || placeholder}`);
            if (busy) {
                summary.setAttribute('aria-disabled', 'true');
                summary.addEventListener('click', (event) => event.preventDefault());
            }
            if (current) summary.append(modelPreview(current.thumbnail));
            summary.append(element('span', current?.name || placeholder));
            const list = element('ul');
            list.className = 'diary-model-list';

            function focusPicker() {
                [...panel.querySelectorAll('[data-diary-model-picker]')]
                    .find((control) => control.dataset.diaryModelPicker === name)?.focus();
            }

            for (const { id, name: title, thumbnail, location, asset } of choices) {
                const item = element('li');
                const choice = button('', () => {
                    disclosure.open = false;
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
                const empty = element('li', 'Upload a GLB to add a model.');
                empty.className = 'tw-p-2 tw-text-sm tw-text-slate-300';
                list.append(empty);
            }
            disclosure.addEventListener('keydown', (event) => {
                if (event.key !== 'Escape' || !disclosure.open) return;
                event.preventDefault();
                disclosure.open = false;
                summary.focus();
            });
            disclosure.addEventListener('toggle', () => {
                if (disclosure.open) disclosure.scrollIntoView({ block: 'nearest' });
            });
            disclosure.append(summary, list);
            const field = element('div');
            field.className = 'tw-grid tw-gap-1 tw-text-sm tw-font-medium tw-text-slate-200';
            field.append(element('span', name), disclosure);
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

        function assetControls() {
            const upload = element('a', 'Upload GLB');
            upload.className = 'tw-btn tw-btn-sm tw-border-white/10 tw-bg-slate-700 tw-text-white hover:tw-bg-slate-600';
            upload.href = document.getElementById('addNewAssetBtnAssetsList').href;
            upload.target = '_blank';
            upload.rel = 'noopener';
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
            timelineMount.hidden = true;
            workspace.hidden = true;
            viewportReturn.focus();
        }

        function syncScenePreview() {
            const stage = diary ? selectedStage() : null;
            if (stage) {
                const selection = window.VRODOS.editor.selection;
                const selected = selection?.get();
                if (selected && diary.models.includes(selected.uuid) && !stage.layers.includes(selected.uuid)) {
                    selection.clear({ source: 'diary-preview' });
                }
                previewModels(stage.layers);
            } else {
                resetVisibility();
            }
            window.VRODOS.ui.setDiaryHierarchy?.(diary, stage?.stage_id);
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

        function place(labelText, update, model = null) {
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

        function editRecord(section, record, refreshTimeline) {
            section.addEventListener('input', refreshTimeline);
            section.append(field('Title', record, 'title'), datePicker(record, refreshTimeline),
                field('Notes', record, 'notes', 'textarea'));
        }

        function entryOrderControls(records, entry, onReorder) {
            const entries = ordered(records);
            const index = entries.indexOf(entry);
            const details = element('details');
            if (entries.length < 2) return details;
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

        function renderStages(section, models) {
            const stages = ordered(diary.stages);
            const stage = selectedStage() || stages[0];
            if (!stage) {
                if (!startingDiary) {
                    section.append(hint('Start with the 3D model visitors will see first.'),
                        row(button('Create excavation diary', () => {
                            startingDiary = true;
                            run(refreshLibrary);
                        }, 'tw-btn-primary')));
                    return;
                }
                section.append(modelPicker('Base model', '', 'Choose a scene or library model', (id) => {
                    if (!id) return;
                    manageModel(id);
                    stageId = 'stage-1';
                    diary.stages.push({ ...newRecord(1, 'Before excavation'), stage_id: stageId, context_id: '', site_model: id, layers: [id] });
                    startingDiary = false;
                    changed();
                }), assetControls());
                return;
            }
            stageId = stage.stage_id;
            section.append(row(button('Add timeline point', () => {
                const last = stages.at(-1);
                stageId = newId('stage', stages.map((item) => item.stage_id));
                diary.stages.push({ ...newRecord(nextNumber(stages), 'Excavation entry'), stage_id: stageId, context_id: '',
                    site_model: last.site_model || '', layers: [...last.layers] });
                changed();
            }), button('Delete timeline point', () => {
                const entry = selectedStage();
                if (diary.finds.some((find) => find.discovery_stage_id === entry.stage_id)) {
                    show('Reassign the finds linked to this point first.', true);
                    return;
                }
                diary.stages = diary.stages.filter((item) => item !== entry);
                startingDiary = false;
                if (!diary.stages.length) {
                    diary.models = [];
                    diary.safePoint = null;
                    resetVisibility();
                }
                changed();
            }, dangerButton)));
            const fields = element('div');
            const { control, refresh } = timeline('Excavation timeline', diary.stages, 'stage_id', () => stageId, (next) => {
                stageId = next.stage_id;
                renderFields(next);
                syncScenePreview();
            });
            timelineMount.append(control);
            timelineMount.hidden = !viewport.hidden;
            function renderFields(entry) {
                fields.replaceChildren();
                const model = entry.site_model || '';
                fields.append(modelPicker(entry === ordered(diary.stages)[0] ? 'Base model' : 'Site model', model, 'Choose a model', (id) => {
                    manageModel(id);
                    entry.site_model = id;
                    const extra = entry.layers.filter((layer) => layer !== model && layer !== id);
                    entry.layers = id ? [id, ...extra] : extra;
                    changed();
                }, modelAt(model)?.position?.toArray()));
                const additional = models.filter((id) => id !== model);
                if (additional.length) {
                    const details = element('details');
                    details.open = entry.layers.some((id) => id !== model);
                    const summary = element('summary', 'Additional layers');
                    summary.className = 'tw-cursor-pointer tw-text-sm tw-font-medium tw-text-slate-200';
                    const layers = element('div');
                    layers.className = 'tw-mt-2 tw-flex tw-flex-col tw-gap-2';
                    for (const id of additional) {
                        layers.append(checkbox(modelName(id), entry.layers.includes(id), (checked) => {
                            if (checked) {
                                manageModel(id);
                                panel.querySelector('[data-diary-scene-setup]').replaceWith(renderSceneSetup());
                            }
                            entry.layers = checked ? [...entry.layers, id] : entry.layers.filter((layer) => layer !== id);
                            syncScenePreview();
                        }));
                    }
                    details.append(summary, layers);
                    fields.append(details);
                }
                editRecord(fields, entry, () => {
                    refresh();
                    window.VRODOS.ui.setDiaryHierarchy?.(diary, stageId);
                });
                fields.append(entryOrderControls(diary.stages, entry));
            }
            fields.className = 'tw-flex tw-flex-col tw-gap-3';
            section.append(fields);
            renderFields(stage);
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
            if (!diary.stages.length) {
                section.append(hint('Add an excavation entry before recording a find.'));
                return;
            }
            const stages = ordered(diary.stages);
            const find = diary.finds.find((item) => item.find_id === findId) || diary.finds[0];
            section.append(button('Add find', () => {
                findId = newId('find', diary.finds.map((item) => item.find_id));
                diary.finds.push({ find_id: findId, find_label: 'New find', discovery_stage_id: stages[0].stage_id,
                    point: null, entries: [{ ...newRecord(1, 'Discovered'), entry_id: 'entry-1', model: '', pins: [] }] });
                changed();
            }));
            if (!find) return;
            findId = find.find_id;
            section.append(select('Find', diary.finds.map((item) => [item.find_id, item.find_label]), findId, (id) => {
                findId = id; entryId = ''; render();
            }), field('Find label', find, 'find_label'), select('Discovery entry', timelineOptions(stages, 'stage_id'),
                find.discovery_stage_id, (id) => { find.discovery_stage_id = id; changed(); }), row(
                button(find.point ? 'Move find marker' : 'Place find marker', () => {
                    previewModels(stages.find((stage) => stage.stage_id === find.discovery_stage_id).layers);
                    place('the discovery location', (point) => { find.point = point; });
                }),
                button('Remove find', () => { diary.finds = diary.finds.filter((item) => item !== find); changed(); }, dangerButton)
            ));
            const entries = ordered(find.entries);
            const entry = entries.find((item) => item.entry_id === entryId) || entries[0];
            section.append(button('Add find entry', () => {
                entryId = newId('entry', entries.map((item) => item.entry_id));
                find.entries.push({ ...newRecord(nextNumber(entries), 'Find entry'), entry_id: entryId, model: '', pins: [] });
                changed();
            }));
            if (!entry) return;
            entryId = entry.entry_id;
            const fields = element('div');
            fields.className = 'tw-flex tw-flex-col tw-gap-3';
            const { control, refresh } = timeline('Find timeline', find.entries, 'entry_id', () => entryId, (next) => {
                entryId = next.entry_id;
                renderFindEntry(fields, find, next, refresh);
            });
            section.append(control, fields);
            renderFindEntry(fields, find, entry, refresh);
        }

        function renderFindEntry(section, find, entry, refresh) {
            section.replaceChildren();
            const entries = ordered(find.entries);
            const modelId = currentFindModel(entries, entry);
            const model = modelAt(modelId);
            editRecord(section, entry, refresh);
            section.append(modelPicker('Model version', entry.model, entry === entries[0] ? 'Choose a model' : 'Use the previous model', (id) => {
                if (entry.pins.length && !window.confirm('Change the model and remove pins placed on this entry?')) {
                    render();
                    return;
                }
                manageModel(id);
                entry.model = id;
                entry.pins = [];
                changed();
            }));
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
                place('the find model at the annotation point', (point) => entry.pins.push({ point, text: 'Annotation', model: modelId }), model);
            }), button('Delete timeline point', () => {
                if (find.entries.length === 1) { show('Delete the find to remove its only timeline point.', true); return; }
                const following = entries[entries.indexOf(entry) + 1];
                if (entry.model && following && !following.model) following.model = entry.model;
                find.entries = find.entries.filter((item) => item !== entry);
                changed();
            }, dangerButton)));
        }

        function renderImports() {
            const section = card('CSV import');
            const columns = tab === 'stages' ? panel.dataset.stageColumns : panel.dataset.findColumns;
            const template = element('a', 'Download CSV template');
            template.className = 'tw-link tw-text-emerald-400 tw-text-sm';
            template.href = `data:text/csv;charset=utf-8,${encodeURIComponent(`${columns}\r\n`)}`;
            template.download = tab === 'stages' ? 'excavation-stages.csv' : 'find-entries.csv';
            const file = element('input');
            file.className = 'tw-file-input tw-file-input-bordered tw-file-input-sm tw-w-full';
            file.type = 'file';
            file.accept = '.csv,text/csv';
            file.disabled = busy;
            file.addEventListener('change', () => {
                const selected = file.files[0];
                if (!selected) return;
                run(async () => {
                    if (selected.size > 1024 * 1024) throw new Error('Use a UTF-8 CSV file under 1 MB.');
                    const result = await request('preview', { kind: tab, csv: await selected.text(), diary: JSON.stringify(diary) });
                    preview = result.diary;
                    importChanges = result.diary ? result.changes : [];
                    show(result.errors.length ? result.errors.join('\n') : `${result.counts.added} added, ${result.counts.updated} updated and ${result.counts.unchanged} unchanged.`, Boolean(result.errors.length));
                });
            });
            section.append(template, label('Preview CSV import', file));
            if (preview) {
                if (importChanges.length) {
                    const details = element('details');
                    const list = element('ul');
                    for (const { key, title, change } of importChanges) list.append(element('li', `${change === 'added' ? 'Add' : 'Update'} ${key} · ${title}`));
                    details.dataset.importChanges = 'true';
                    details.append(element('summary', 'View changes'), list);
                    section.append(details);
                }
                const apply = button('Apply to draft', () => {
                    diary = preview;
                    changed();
                    show('CSV applied. Save the scene to keep these changes.');
                });
                apply.dataset.applyPreview = 'true';
                section.append(apply);
            }
            return section;
        }

        function renderSceneSetup() {
            const setup = card('Scene setup');
            setup.dataset.diarySceneSetup = '';
            if (tab === 'stages') {
                setup.append(hint('Choose stable ground that stays walkable in every entry.'));
                const safe = button(diary.safePoint ? 'Move safe viewpoint' : 'Place safe viewpoint', () => {
                    previewModels(selectedStage().layers);
                    place('stable walkable ground', (point) => { diary.safePoint = point; });
                });
                safe.disabled = busy || !selectedStage();
                setup.append(row(safe));
            }
            if (diary.models.length) {
                const details = element('details');
                const summary = element('summary', 'Diary assets');
                summary.className = 'tw-cursor-pointer tw-text-sm tw-font-medium tw-text-slate-200';
                const content = element('div');
                content.className = 'tw-mt-2 tw-flex tw-flex-col tw-gap-2';
                let releaseId = diary.models[0];
                content.append(select('Asset', diary.models.map((id) => [id, modelName(id)]), releaseId, (id) => { releaseId = id; }),
                    row(button('Remove from diary', () => {
                        const removed = releaseId;
                        if (!window.confirm(`Remove "${modelName(removed)}" from every diary entry? Its placement will return to the ordinary scene.`)) return;
                        resetVisibility();
                        diary.models = diary.models.filter((id) => id !== removed);
                        for (const stage of diary.stages) {
                            if (stage.site_model === removed) stage.site_model = '';
                            stage.layers = stage.layers.filter((id) => id !== removed);
                        }
                        for (const find of diary.finds) {
                            let current = '';
                            for (const entry of ordered(find.entries)) {
                                current = entry.model || current;
                                if (current === removed) { entry.model = ''; entry.pins = []; }
                            }
                        }
                        changed();
                    }, dangerButton)));
                details.append(summary, content);
                setup.append(details);
            }
            if (diary.stages.length) setup.append(assetControls());
            return setup;
        }

        function render() {
            syncEntryPoints();
            panel.replaceChildren();
            tabsMount.replaceChildren();
            timelineMount.replaceChildren();
            timelineMount.hidden = true;
            if (!diary) {
                if (busy) panel.append(hint('Loading diary…'));
                else panel.append(button('Retry loading diary', load));
                return;
            }
            const tabs = row(...[['stages', 'Excavation diary'], ['finds', 'Find diary']].map(([id, title]) => {
                const active = tab === id;
                const control = button(title, () => {
                    if (tab === id) return;
                    tab = id;
                    show('');
                    clearPreview();
                    render();
                    panel.scrollTop = 0;
                    tabsMount.querySelector('button[aria-pressed=true]')?.focus();
                }, active ? 'tw-btn-primary' : 'tw-btn-ghost tw-text-slate-300 hover:tw-bg-white/10 hover:tw-text-white');
                control.setAttribute('aria-pressed', String(active));
                return control;
            }));
            tabsMount.append(tabs);

            const records = card(tab === 'stages' ? 'Excavation entry' : 'Find timeline');
            const models = sceneModels();
            if (tab === 'stages') renderStages(records, models);
            else renderFinds(records);
            const setup = element('div');
            setup.className = 'tw-flex tw-min-w-0 tw-flex-col tw-gap-4';
            if (diary.stages.length) setup.append(renderSceneSetup());
            const imports = element('details');
            const importSummary = element('summary', 'Import from CSV');
            importSummary.className = 'tw-cursor-pointer tw-py-2 tw-text-sm tw-text-slate-200';
            imports.open = Boolean(preview);
            imports.append(importSummary, renderImports());
            setup.append(imports);
            const layout = element('div');
            layout.className = 'diary-layout';
            layout.append(records, setup);
            panel.append(layout);
            window.VRODOS.ui.refreshLucideIcons({ nodes: [panel] });
            if (viewport.hidden) syncScenePreview();
        }

        const setWorkspaceOpen = (open) => {
            workspace.hidden = !open;
            syncEntryPoints();
        };

        function syncEntryPoints() {
            const hasDiary = Boolean(diary?.stages.length);
            const hasChanges = Boolean(hasDraftChanges());
            const expanded = !workspace.hidden || !viewport.hidden;
            edit.hidden = !hasDiary;
            save.hidden = !hasDiary && !hasChanges;
            save.disabled = busy || !hasChanges;
            menuLabel.textContent = hasDiary ? 'Edit excavation diary' : 'Excavation diary';
            toggle.setAttribute('aria-expanded', String(expanded));
            edit.setAttribute('aria-expanded', String(expanded));
        }

        function load(openSavedDiary = false) {
            run(async () => {
                diary = await request('read');
                savedDraft = JSON.stringify(diary);
                show('');
                if (openSavedDiary === true && diary.stages.length) setWorkspaceOpen(true);
            });
        }

        window.VRODOS.api.saveSpatialDiary = ({ sceneSaved = false } = {}) => {
            if (savePromise) return savePromise;
            if (!hasDraftChanges()) return Promise.resolve();
            if (busy) return Promise.reject(new Error('Wait until the diary finishes loading.'));
            busy = true;
            render();
            savePromise = (async () => {
                if (!sceneSaved) await window.VRODOS.api.saveChanges({ force: true });
                diary = await request('save', { diary: JSON.stringify(diary) });
                savedDraft = JSON.stringify(diary);
                show('Diary saved with the scene.');
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

        function openWorkspace(focusWorkspace) {
            if (!viewport.hidden) {
                returnToDiary();
                return;
            }
            setWorkspaceOpen(true);
            if (!diary) load();
            else render();
            if (focusWorkspace) {
                (panel.querySelector('button:not(:disabled), summary') || workspace.querySelector('#vrodos-diary-close')).focus();
            }
        }

        function closeWorkspace() {
            pick = null;
            viewport.hidden = true;
            tab = 'stages';
            setWorkspaceOpen(false);
            render();
            (edit.hidden ? menu.querySelector('summary') : edit).focus();
        }

        toggle.addEventListener('click', () => {
            menu.open = false;
            tab = 'stages';
            openWorkspace(true);
        });
        edit.addEventListener('click', () => {
            if (workspace.hidden && viewport.hidden) openWorkspace(false);
            else closeWorkspace();
        });
        save.addEventListener('click', () => document.getElementById('save-scene-button').click());
        document.getElementById('vrodos-diary-close').addEventListener('click', closeWorkspace);
        viewportReturn.addEventListener('click', returnToDiary);
        workspace.addEventListener('keydown', (event) => event.stopPropagation());
        timelineMount.addEventListener('keydown', (event) => event.stopPropagation());
        const refreshWorkspace = () => {
            if (!diary || busy || !viewport.hidden || (workspace.hidden && !diary.stages.length)) return;
            const previousPicker = panel.querySelector('.diary-model-picker[open] > summary');
            const hasPickerFocus = previousPicker?.parentElement.contains(document.activeElement);
            render();
            if (previousPicker) {
                const currentPicker = [...panel.querySelectorAll('[data-diary-model-picker]')]
                    .find((control) => control.dataset.diaryModelPicker === previousPicker.dataset.diaryModelPicker);
                if (currentPicker) {
                    currentPicker.parentElement.open = true;
                    if (hasPickerFocus) currentPicker.focus();
                }
            }
        };
        document.addEventListener('vrodos:scene-loaded', refreshWorkspace);
        document.addEventListener('vrodos:asset-library-loaded', refreshWorkspace);
        load(true);
    });
})();
