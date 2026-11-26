(function () {
    'use strict';

    const element = (tag, text = '') => {
        const node = document.createElement(tag);
        node.textContent = text;
        return node;
    };

    function diaryIcon(name) {
        const icon = element('i');
        icon.setAttribute('data-lucide', name);
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    }

    function button(text, action, iconName) {
        const node = element('button', text);
        node.type = 'button';
        if (iconName) node.prepend(diaryIcon(iconName));
        node.addEventListener('click', action);
        return node;
    }

    function dateAndTitle(entry) {
        return [entry?.recorded_on, entry?.title].filter(Boolean).join(' · ');
    }

    class DiaryView {
        constructor(component) {
            this.component = component;
            this.scene = component.el;
            this.resources = component.resources;
            this.stages = component.dataSet.stages;
            this.finds = component.dataSet.finds;
            this.menuTitle = this.stages.length ? 'Excavation diary' : 'Find diaries';
            this.menuIcon = this.stages.length ? 'shovel' : 'amphora';
            this.markers = new Map();
            this.stageIndexes = new Map(this.stages.map((stage, index) => [stage.stage_id, index]));
            this.buildDesktop();
            const left = this.scene.querySelector('#oculusLeft');
            if (left) this.resources.listen(left, 'thumbstickdown', (event) => {
                if (!this.inVr()) return;
                event.stopPropagation();
                if (this.find || this.panel) this.closePanel();
                else if (!window.VRODOSSpatialUI?.getActivePanel()) this.openDiaryMenu();
            });
            for (const type of ['enter-vr', 'exit-vr']) this.resources.listen(this.scene, type, () => this.presentationChanged());
            this.resources.listen(document, 'fullscreenchange', () => this.mountDesktop());
            this.resources.listen(document, 'keydown', (event) => {
                if (event.key === 'Escape' && this.find && !this.inVr()) this.closeFind();
            });
            if (this.scene.canvas) this.resources.listen(this.scene.canvas, 'click', (event) => this.pickDesktopPin(event));
            this.presentationChanged();
        }

        inVr() {
            return window.VRODOSRuntimeOverlay?.shouldUseVrPanel();
        }

        buildDesktop() {
            this.style = element('style', `
.vrodos-diary-ui { color: #f8fafc; font: 14px/1.45 system-ui, sans-serif; position: fixed; bottom: max(18px,env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); z-index: 10005; width: min(520px,calc(100vw - 32px)); }
.vrodos-diary-ui section { padding: 12px 16px; border: 1px solid #cbd5e17a; border-radius: 14px; background: #102124ec; box-shadow: 0 8px 24px #0008; }
.vrodos-diary-ui :is(h2,h3,p) { margin: 0 0 6px; }
.vrodos-diary-ui [data-lucide] { display: inline-block; vertical-align: -.2em; width: 1em; height: 1em; margin-inline-end: .45em; }
.vrodos-diary-ui p { white-space: pre-wrap; max-height: 8rem; overflow: auto; }
.vrodos-diary-ui nav { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; }
.vrodos-diary-ui button { background: #23474a; color: #fff; border: 1px solid #9fc0b5; border-radius: 6px; padding: 5px 10px; cursor: pointer; }
.vrodos-diary-ui button:focus-visible { outline: 2px solid #89eed0; outline-offset: 2px; }
.vrodos-diary-ui button:disabled { opacity: .45; cursor: default; }
.vrodos-diary-ui [data-error=true] { color: #fecaca; }
.vrodos-diary-ui input[type=range] { flex: 1; accent-color: #7fdabb; min-width: 70px; }
.vrodos-diary-ui .vrodos-find-inspector { position: fixed; height: max-content; right: 0; bottom: 0; max-height: 65vh; overflow: auto; width: min(290px,calc(100vw - 32px)); }
.vrodos-diary-ui[hidden], .vrodos-diary-ui [hidden] { display: none; }
.vrodos-diary-fade { position: fixed; inset: 0; z-index: 10004; pointer-events: none; background: #000; opacity: 0; }
`);
            document.head.append(this.style);
            this.desktop = element('aside');
            this.desktop.className = 'vrodos-diary-ui';
            this.desktop.setAttribute('aria-label', this.menuTitle);
            this.timeline = element('section');
            const heading = element('h2');
            this.title = element('span', this.menuTitle);
            heading.append(diaryIcon(this.menuIcon), this.title);
            this.findList = element('nav');
            this.findList.setAttribute('aria-label', 'Find diaries');
            this.timeline.append(heading);
            if (this.stages.length) this.buildDesktopTimeline();
            this.timeline.append(this.findList);
            this.desktop.append(this.timeline);
            window.lucide?.createIcons({ root: heading });
            for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'touchstart', 'touchend', 'wheel', 'keydown', 'keyup']) {
                this.resources.listen(this.desktop, type, (event) => {
                    if (event.key !== 'Escape') event.stopPropagation();
                });
            }
        }

        buildDesktopTimeline() {
            this.notes = element('p');
            this.source = element('small');
            this.statusLine = element('p');
            this.statusLine.setAttribute('role', 'status');
            this.range = element('input');
            this.range.type = 'range';
            this.range.min = '0';
            this.range.max = String(this.stages.length - 1);
            this.range.setAttribute('aria-label', 'Excavation timeline');
            this.range.addEventListener('input', () => this.component.select(this.range.valueAsNumber));
            this.previous = button('Previous', () => this.component.select(this.selection() - 1));
            this.next = button('Next', () => this.component.select(this.selection() + 1));
            this.retry = button('Retry', () => this.component.select(this.component.target));
            this.retry.hidden = true;
            const timelineButtons = element('nav');
            timelineButtons.append(this.previous, this.range, this.next, this.retry);
            this.timeline.append(this.notes, this.source, this.statusLine, timelineButtons);
        }

        mountDesktop() {
            const fullscreen = document.fullscreenElement;
            const host = fullscreen && !['CANVAS', 'IFRAME'].includes(fullscreen.tagName) ? fullscreen : document.body;
            if (this.desktop.parentNode !== host) host.append(this.desktop);
            if (this.desktopFade && this.desktopFade.parentNode !== host) host.append(this.desktopFade);
        }

        presentationChanged() {
            this.closePanel();
            this.mountDesktop();
            this.desktop.hidden = this.inVr();
        }

        selection() {
            return Math.max(0, this.component.target);
        }

        availableFinds() {
            const index = this.component.index;
            return this.finds.filter((find) => find.discovery_stage_id === '' ||
                (this.stageIndexes.get(find.discovery_stage_id) ?? Infinity) <= index);
        }

        update() {
            if (this.stages.length) {
                const current = this.stages[this.component.index];
                this.title.textContent = current ? dateAndTitle(current) : this.menuTitle;
                this.notes.textContent = current?.notes || '';
                this.source.textContent = [current?.context_id, current?.source_ref].filter(Boolean).join(' · ');
                this.range.value = String(this.selection());
                this.range.setAttribute('aria-valuetext', dateAndTitle(this.stages[this.selection()]));
                this.previous.disabled = this.selection() === 0;
                this.next.disabled = this.selection() >= this.stages.length - 1;
                this.retry.hidden = !this.failed || this.component.processing;
            }
            this.syncMarkers();
            if (this.panel && !this.find) this.renderDiaryMenu(this.panel);
        }

        status(text, failed = false) {
            this.message = text;
            this.failed = failed;
            this.statusLine.textContent = text;
            this.statusLine.dataset.error = String(failed);
            this.retry.hidden = !failed;
            if (this.panel && !this.find) this.renderDiaryMenu(this.panel);
        }

        syncMarkers() {
            const available = this.availableFinds();
            const ids = new Set(available.map((find) => find.find_id));
            let changed = false;
            for (const [id, marker] of this.markers) {
                if (ids.has(id)) continue;
                marker.remove();
                this.markers.delete(id);
                changed = true;
            }
            for (const find of available) {
                if (this.markers.has(find.find_id)) continue;
                const marker = element('a-entity');
                const [x, y, z] = find.point;
                marker.setAttribute('position', `${x} ${y + 0.18} ${z}`);
                marker.setAttribute('geometry', 'primitive: sphere; radius: 0.105; segmentsWidth: 12; segmentsHeight: 8');
                marker.setAttribute('material', 'shader: flat; color: #68f1c2');
                marker.setAttribute('title', find.find_label);
                marker.classList.add('raycastable');
                marker.addEventListener('click', () => this.openFind(find));
                this.component.world.append(marker);
                this.markers.set(find.find_id, marker);
                changed = true;
            }
            if (changed) {
                this.findList.replaceChildren(...available.map((find) => button(find.find_label, () => this.openFind(find), 'amphora')));
                window.lucide?.createIcons({ root: this.findList });
            }
        }

        openDiaryMenu() {
            this.panel = window.VRODOSSpatialUI?.openPanel({
                id: 'spatial-diary', width: 1.25, height: 0.93, distance: 1.7,
                centerAtEyeLevel: true, lockInteraction: false, blockSceneRaycasts: true,
                trimControllerRays: true, showRayHitDot: true,
                render: (api) => this.renderDiaryMenu(api), cleanup: () => { this.panel = null; }
            });
        }

        renderDiaryMenu(api) {
            const current = this.stages[this.component.index];
            api.frame({ title: this.menuTitle, titleIcon: this.menuIcon, titleSize: 32, headerHeight: 78, footerHeight: 76 });
            if (current) api.text(api.content, { text: [dateAndTitle(current), current.notes, current.source_ref].filter(Boolean).join('\n'), fontSize: 22 });
            if (this.message) api.text(api.content, { text: this.message, fontSize: 22, color: this.failed ? '#991b1b' : '#14534a' });
            this.stages.forEach((stage, index) => api.button(api.content, {
                label: `${index === this.component.index ? '✓ ' : ''}${dateAndTitle(stage)}`,
                variant: index === this.component.index ? 'primary' : 'secondary', width: '100%', height: 54, fontSize: 23,
                onClick: () => this.component.select(index)
            }));
            for (const find of this.availableFinds()) api.button(api.content, {
                label: `Inspect ${find.find_label}`, variant: 'secondary', width: '100%', height: 52, fontSize: 23,
                onClick: () => this.resources.frame(() => this.openFind(find))
            });
            if (this.stages.length) {
                api.button(api.footer, { label: 'Previous', disabled: this.selection() === 0, height: 48, fontSize: 23,
                    onClick: () => this.component.select(this.selection() - 1) });
                api.button(api.footer, { label: 'Next', disabled: this.selection() === this.stages.length - 1, height: 48, fontSize: 23,
                    onClick: () => this.component.select(this.selection() + 1) });
            }
        }

        closePanel() {
            if (this.panel) this.panel.close('diary-close');
            else if (this.find) this.closeFind();
        }

        openFind(find) {
            if (this.find === find) return;
            if (this.component.processing) return;
            if (window.VRODOSSpatialUI?.getActivePanel() && !this.panel) return;
            if (!this.panel && window.VRODOSRuntimeOverlay?.interactionLocked) return;
            this.closePanel();
            this.find = find;
            this.findIndex = -1;
            this.rotation = 0;
            this.lift = 0;
            this.objectHost = new THREE.Group();
            this.siteVisibility = this.component.world.object3D.visible;
            this.component.world.object3D.visible = false;
            if (this.inVr()) {
                this.panel = window.VRODOSSpatialUI?.openPanel({
                    id: 'find-diary', width: 1.15, height: 1.05, distance: 1.85,
                    centerAtEyeLevel: true, lockInteraction: true, blockSceneRaycasts: true,
                    trimControllerRays: true, showRayHitDot: true,
                    render: (api) => this.setupVrFind(api), cleanup: () => { this.panel = null; this.closeFind(); }
                });
                if (!this.panel) { this.closeFind(); return; }
            } else {
                this.timeline.hidden = true;
                window.VRODOSRuntimeOverlay?.lockSceneInteraction(true);
                this.desktopLocked = true;
                this.inspector = element('section');
                this.inspector.className = 'vrodos-find-inspector';
                this.inspector.setAttribute('aria-label', 'Find diary');
                this.desktop.append(this.inspector);
                // World-space placement keeps the find on the same renderer as the site.
                this.scene.object3D.add(this.objectHost);
                const camera = this.scene.camera;
                camera.updateWorldMatrix(true, false);
                this.objectHost.position.copy(camera.localToWorld(new THREE.Vector3(-0.32, 0.03, -1.3)));
                camera.getWorldQuaternion(this.objectHost.quaternion);
            }
            this.selectFindEntry(0);
        }

        setupVrFind(api) {
            api.group.add(this.objectHost);
            this.objectHost.position.set(-0.84, 0.02, 0.18);
            this.renderVrFind(api);
        }

        async selectFindEntry(index) {
            const find = this.find;
            if (!find?.entries[index]) return;
            const generation = (this.findGeneration || 0) + 1;
            this.findGeneration = generation;
            const modelId = find.entries.slice(0, index + 1).reverse().find((entry) => entry.model)?.model;
            this.findStatus = 'Loading model…';
            this.renderFind();
            let record;
            try {
                if (this.findModel?.id !== modelId) {
                    record = this.component.loadModel(modelId, this.scene, true);
                    await record.promise;
                    if (generation !== this.findGeneration) return;
                    this.clearPins();
                    if (this.findModel) this.component.discard(this.findModel);
                    this.findModel = record;
                    const entity = record.entity.object3D;
                    const mesh = record.entity.getObject3D('mesh');
                    const bounds = new THREE.Box3().setFromObject(mesh);
                    const center = entity.worldToLocal(bounds.getCenter(new THREE.Vector3()));
                    const dimensions = bounds.getSize(new THREE.Vector3());
                    const scale = 0.68 / Math.max(0.001, dimensions.x, dimensions.y, dimensions.z);
                    this.objectHost.add(entity);
                    entity.position.copy(center.multiplyScalar(-scale));
                    entity.scale.setScalar(scale);
                    if (!Number.isFinite(center.x)) throw new Error('The find cannot be framed.');
                    mesh.traverse((node) => { if (node.isMesh) node.castShadow = false; });
                    record.entity.setAttribute('visible', 'true');
                }
                this.findIndex = index;
                this.pinIndex = -1;
                this.findStatus = '';
                this.buildPins(find.entries[index]);
                this.applyRotation();
            } catch (error) {
                if (generation === this.findGeneration) this.findStatus = error.message;
            } finally {
                if (record && this.findModel !== record) this.component.discard(record);
                if (generation === this.findGeneration) this.renderFind();
            }
        }

        clearPins() {
            for (const pin of this.pins || []) {
                pin.removeFromParent(); pin.geometry.dispose(); pin.material.dispose();
            }
            this.pins = [];
        }

        buildPins(entry) {
            this.clearPins();
            const root = this.findModel?.entity.object3D;
            if (!root) return;
            for (const data of entry.pins) {
                const pin = new THREE.Mesh(new THREE.SphereGeometry(0.017 / root.scale.x, 12, 8), new THREE.MeshBasicMaterial({
                    color: '#59e6bd', depthTest: false, depthWrite: false
                }));
                pin.position.fromArray(data.point);
                pin.renderOrder = 9;
                root.add(pin);
                this.pins.push(pin);
            }
        }

        selectPin(index) {
            this.pinIndex = index;
            this.pins.forEach((pin, pinIndex) => pin.material.color.set(pinIndex === index ? '#ffbd5b' : '#59e6bd'));
            this.renderFind();
        }

        pickDesktopPin(event) {
            if (!this.find || this.inVr() || !this.pins?.length) return;
            const bounds = this.scene.canvas.getBoundingClientRect();
            const mouse = new THREE.Vector2((event.clientX - bounds.left) * 2 / bounds.width - 1,
                1 - (event.clientY - bounds.top) * 2 / bounds.height);
            const ray = new THREE.Raycaster();
            ray.setFromCamera(mouse, this.scene.camera);
            const hit = ray.intersectObjects(this.pins, false)[0];
            if (hit) this.selectPin(this.pins.indexOf(hit.object));
        }

        applyRotation() {
            const model = this.findModel?.entity.object3D;
            if (!model) return;
            const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.lift, this.rotation, 0, 'YXZ'));
            const pivot = model.userData.diaryPivot || (model.userData.diaryPivot = model.position.clone());
            model.position.copy(pivot).applyQuaternion(rotation);
            model.quaternion.copy(rotation);
        }

        rotate(yaw, pitch = 0) {
            this.rotation += yaw;
            this.lift = THREE.MathUtils.clamp(this.lift + pitch, -Math.PI / 2, Math.PI / 2);
            this.applyRotation();
        }

        renderFind() {
            if (this.panel) this.renderVrFind(this.panel);
            if (!this.inspector) return;
            const entry = this.find.entries[this.findIndex];
            const entries = element('select');
            entries.setAttribute('aria-label', 'Find timeline');
            entries.add(new Option('Select an entry', '-1'));
            this.find.entries.forEach((record, index) => entries.add(new Option(dateAndTitle(record), String(index))));
            entries.value = String(this.findIndex);
            entries.addEventListener('change', () => this.selectFindEntry(Number(entries.value)));
            const actions = element('nav');
            actions.append(button('Rotate left', () => this.rotate(-0.36)), button('Rotate right', () => this.rotate(0.36)),
                button('Tilt up', () => this.rotate(0, -0.25)), button('Tilt down', () => this.rotate(0, 0.25)));
            const pins = element('nav');
            entry?.pins.forEach((pin, index) => pins.append(button(`Pin ${index + 1}`, () => this.selectPin(index))));
            const title = element('h2', this.find.find_label);
            title.prepend(diaryIcon('amphora'));
            this.inspector.replaceChildren(title, entries, element('p', entry?.notes || ''),
                element('small', entry?.source_ref || ''), element('p', this.findStatus || ''), actions, pins,
                element('p', entry?.pins[this.pinIndex]?.text || ''),
                button(this.stages.length ? 'Back to excavation' : 'Back to find diaries', () => this.closeFind()));
            window.lucide?.createIcons({ root: title });
        }

        renderVrFind(api) {
            const entry = this.find.entries[this.findIndex];
            api.frame({ title: this.find.find_label, titleIcon: 'amphora', titleSize: 32, headerHeight: 78, footerHeight: 80 });
            api.text(api.content, { text: [entry?.notes, entry?.source_ref, this.findStatus].filter(Boolean).join('\n'), fontSize: 23 });
            this.find.entries.forEach((record, index) => api.button(api.content, {
                label: dateAndTitle(record), width: '100%', height: 52, fontSize: 23,
                variant: index === this.findIndex ? 'primary' : 'secondary', onClick: () => this.selectFindEntry(index)
            }));
            entry?.pins.forEach((pin, index) => api.button(api.content, {
                label: `Pin ${index + 1}${index === this.pinIndex ? ` · ${pin.text}` : ''}`,
                width: '100%', height: 54, fontSize: 23, onClick: () => this.selectPin(index)
            }));
            api.button(api.footer, { label: 'Rotate left', height: 48, fontSize: 22, onClick: () => this.rotate(-0.36) });
            api.button(api.footer, { label: 'Rotate right', height: 48, fontSize: 22, onClick: () => this.rotate(0.36) });
        }

        closeFind() {
            if (!this.find) return;
            this.findGeneration = (this.findGeneration || 0) + 1;
            this.clearPins();
            if (this.findModel) this.component.discard(this.findModel);
            this.findModel = null;
            this.objectHost?.removeFromParent();
            this.component.world.object3D.visible = this.siteVisibility;
            this.find = null;
            this.inspector?.remove();
            this.inspector = null;
            this.timeline.hidden = false;
            if (this.desktopLocked) window.VRODOSRuntimeOverlay?.lockSceneInteraction(false);
            this.desktopLocked = false;
        }

        fade(dark) {
            if (this.removed) return Promise.resolve();
            this.faded = dark;
            const inVr = this.inVr();
            if (dark && inVr) {
                this.vrFade = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({
                    color: 0x000000, side: THREE.BackSide, transparent: true, opacity: 0, depthTest: false, depthWrite: false
                }));
                this.vrFade.renderOrder = 12000;
                this.scene.object3D.add(this.vrFade);
            } else if (dark) {
                this.desktopFade = element('div');
                this.desktopFade.className = 'vrodos-diary-fade';
                this.mountDesktop();
            }
            const started = performance.now();
            return new Promise((resolve) => {
                this.finishFade = resolve;
                const frame = () => {
                    const progress = Math.min(1, (performance.now() - started) / 145);
                    const opacity = dark ? progress : 1 - progress;
                    if (this.vrFade) {
                        this.component.movement?.getImmersivePhysicalAnchorPosition(this.vrFade.position);
                        this.vrFade.material.opacity = opacity;
                    }
                    if (this.desktopFade) this.desktopFade.style.opacity = String(opacity);
                    if (progress < 1 && !this.removed) this.resources.frame(frame);
                    else {
                        this.finishFade = null;
                        if (!dark) this.clearFade();
                        resolve();
                    }
                };
                frame();
            });
        }

        clearFade() {
            this.vrFade?.removeFromParent();
            this.vrFade?.geometry.dispose();
            this.vrFade?.material.dispose();
            this.desktopFade?.remove();
            this.vrFade = null;
            this.desktopFade = null;
        }

        remove() {
            this.removed = true;
            this.finishFade?.();
            this.clearFade();
            this.closePanel();
            for (const marker of this.markers.values()) marker.remove();
            this.desktop.remove();
            this.style.remove();
        }
    }

    window.VRODOSDiaryView = DiaryView;
})();
