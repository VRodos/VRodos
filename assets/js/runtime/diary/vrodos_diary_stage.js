(function () {
    'use strict';

    const pendingAttribute = 'data-vrodos-diary-pending';
    const colliderSelector = '.vrodos-navmesh,.vrodos-collider';

    function disposeModel(root, movement) {
        const materials = new Set();
        const geometries = new Set();
        const textures = new Set();
        root?.traverse((node) => {
            if (!node.isMesh) return;
            movement?.releaseDiaryCollision(node);
            geometries.add(node.geometry);
            for (const material of [node.material].flat().filter(Boolean)) {
                materials.add(material);
                for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
            }
            node.skeleton?.dispose();
        });
        for (const texture of textures) texture.dispose();
        for (const material of materials) material.dispose();
        for (const geometry of geometries) geometry?.dispose();
    }

    function withClipping(records, plane) {
        const materials = new Map();
        for (const record of records) {
            if (record.entity.hasAttribute('data-vrodos-collision-hidden')) continue;
            record.entity.getObject3D('mesh')?.traverse((mesh) => {
                if (!mesh.isMesh) return;
                const original = mesh.material;
                const instances = [original].flat().map((material) => {
                    const instance = material.clone();
                    instance.clippingPlanes = [...(material.clippingPlanes || []), plane];
                    return instance;
                });
                mesh.material = Array.isArray(original) ? instances : instances[0];
                materials.set(mesh, { original, instances, assigned: mesh.material, castShadow: mesh.castShadow });
                // The stage refreshes its shadow maps once at commit.
                mesh.castShadow = false;
            });
        }
        return () => {
            for (const [mesh, { original, instances, assigned, castShadow }] of materials) {
                if (mesh.material === assigned) mesh.material = original;
                mesh.castShadow = castShadow;
                instances.forEach((material) => material.dispose());
            }
        };
    }

    AFRAME.registerComponent('vrodos-spatial-diary', {
        init() {
            this.resources = window.VRODOSMaster.RuntimeResources.createRegistry();
            this.active = new Map();
            this.loading = new Set();
            this.index = -1;
            this.target = -1;
            this.generation = 0;
            this.ready = false;
            this.start = this.start.bind(this);
            this.resources.listen(this.el, 'vrodos-scene-loader-ready', this.start);
            this.resources.listen(this.el, 'loaded', () => {
                if (!this.el.components['vrodos-scene-loader']) this.start();
            });
            if (this.el.hasLoaded && (!this.el.components['vrodos-scene-loader'] || this.el.components['vrodos-scene-loader'].isReady)) {
                this.resources.timeout(this.start, 0);
            }
        },

        start() {
            if (this.ready || this.removed) return;
            this.dataSet = window.VRODOS_RUNTIME_CONTEXT?.spatialDiary;
            this.world = this.el.querySelector('#vrodos-authored-world');
            if (!this.dataSet?.stages.length || !this.world) return;
            this.templates = new Map([...document.querySelectorAll('template[data-vrodos-diary-model]')]
                .map((template) => [template.dataset.vrodosDiaryModel, template.content.firstElementChild]));
            this.movement = this.el.querySelector('[custom-movement]')?.components['custom-movement'];
            this.safePoint = this.dataSet.safePoint ? new THREE.Vector3(...this.dataSet.safePoint) : null;
            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.view = new window.VRODOSDiaryView(this);
            this.ready = true;
            this.select(0);
        },

        url(source) {
            const profile = window.VRODOS_ACTIVE_DESKTOP_PROFILE?.id;
            return (profile && source.getAttribute(`data-vrodos-diary-src-${profile}`)) || source.getAttribute('data-vrodos-diary-src');
        },

        loadModel(id, parent, inspect = false) {
            const source = this.templates.get(id);
            if (!source) throw new Error('The diary model is missing from this build.');
            const entity = source.cloneNode(true);
            entity.removeAttribute('id');
            entity.setAttribute(pendingAttribute, '');
            entity.setAttribute('visible', 'false');
            if (inspect) {
                ['position', 'rotation', 'scale', 'shadow', 'vrodos-glb-animation'].forEach((name) => entity.removeAttribute(name));
                entity.replaceChildren();
                entity.classList.remove('vrodos-navmesh', 'vrodos-collider');
            }

            const record = { id, entity, mesh: null };
            this.loading.add(record);
            record.promise = new Promise((resolve, reject) => {
                let timedOut = false;
                const timeout = window.setTimeout(() => {
                    timedOut = true;
                    reject(new Error('The scan is taking too long to load. Try again.'));
                }, 30000);
                const loaded = (event) => {
                    if (event.target !== entity) return;
                    cleanup();
                    record.mesh = event.detail.model;
                    if (record.disposed || timedOut || this.removed) {
                        disposeModel(record.mesh, this.movement);
                        return;
                    }
                    resolve(record);
                };
                const error = () => { cleanup(); reject(new Error('A diary model could not be loaded. Try again.')); };
                const cleanup = () => {
                    window.clearTimeout(timeout);
                    entity.removeEventListener('model-loaded', loaded);
                    entity.removeEventListener('model-error', error);
                    this.loading.delete(record);
                };
                entity.addEventListener('model-loaded', loaded);
                entity.addEventListener('model-error', error);
                parent.append(entity);
                entity.setAttribute('gltf-model', `url(${this.url(source)})`);
            });
            return record;
        },

        discard(record) {
            if (record.disposed) return;
            record.disposed = true;
            const hiddenHelper = record.entity.components?.['vrodos-collider-helper'];
            if (hiddenHelper) record.entity.removeAttribute('vrodos-collider-helper');
            record.entity.remove();
            disposeModel(record.mesh, this.movement);
        },

        select(index) {
            if (this.removed || !Number.isInteger(index) || !this.dataSet.stages[index]) return;
            if (index === this.target && (this.processing || index === this.index)) return;
            this.target = index;
            this.generation++;
            this.view.update();
            if (!this.processing) this.loadSelection();
        },

        async loadSelection() {
            if (this.removed || this.target === this.index) return;
            const index = this.target;
            const generation = this.generation;
            const stage = this.dataSet.stages[index];
            const incoming = [];
            const outgoing = [...this.active.values()].filter((record) => !stage.layers.includes(record.id));
            this.processing = true;
            this.view.status(`Loading ${stage.title}…`);
            try {
                for (const id of stage.layers) if (!this.active.has(id)) incoming.push(this.loadModel(id, this.world));
                const results = await Promise.allSettled(incoming.map((record) => record.promise));
                if (this.removed || generation !== this.generation) return;
                const failure = results.find((result) => result.status === 'rejected');
                if (failure) throw failure.reason;
                await this.transition(index, generation, incoming, outgoing);
                if (generation === this.generation) this.view.status('');
            } catch (error) {
                if (!this.removed && generation === this.generation) this.view.status(error.message, true);
            } finally {
                for (const record of incoming) if (this.active.get(record.id) !== record) this.discard(record);
                this.processing = false;
                if (!this.removed) {
                    this.view.update();
                    if (generation !== this.generation) this.loadSelection();
                    else if (this.index === index) this.prefetchNext();
                }
            }
        },

        inspect(incoming, outgoing) {
            const physical = [...incoming, ...outgoing].some(({ entity }) => entity.matches(colliderSelector) || entity.querySelector(colliderSelector));
            if (!physical) return null;
            if (this.movement?.getNavigationMode() !== 'walkable') return null;
            const ground = this.movement.inspectDiaryGround(incoming.map(({ entity }) => entity), outgoing.map(({ entity }) => entity), this.safePoint);
            if (!ground) throw new Error('There is no safe landing for this entry. Return to stable ground and try again.');
            return ground;
        },

        async transition(index, generation, incoming, outgoing) {
            let ground = this.inspect(incoming, outgoing);
            const animate = this.index >= 0 && (incoming.length || outgoing.length) && !this.reducedMotion.matches;
            const movement = this.movement;
            if (movement) movement.diaryTransition = true;
            try {
                if (animate && ground?.relocate) {
                    await this.view.fade(true);
                } else if (animate) {
                    await this.sweep(incoming, outgoing, generation);
                }
                if (this.removed || generation !== this.generation) return;
                ground = this.inspect(incoming, outgoing);
                if (ground?.relocate && !this.view.faded && !this.reducedMotion.matches) await this.view.fade(true);
                if (this.removed || generation !== this.generation) return;
                // Recheck the tracked footprint after the fade or reveal.
                ground = this.inspect(incoming, outgoing);
                this.commit(index, incoming, outgoing, ground);
            } finally {
                if (this.view?.faded) await this.view.fade(false);
                if (movement) movement.diaryTransition = false;
            }
        },

        sweep(incoming, outgoing, generation) {
            const bounds = new THREE.Box3();
            for (const { entity } of [...incoming, ...outgoing]) {
                if (!entity.hasAttribute('data-vrodos-collision-hidden')) bounds.expandByObject(entity.object3D);
            }
            if (bounds.isEmpty()) return Promise.resolve();
            const renderer = this.el.renderer;
            const clipping = renderer.localClippingEnabled;
            renderer.localClippingEnabled = true;
            const oldPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0));
            const newPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0));
            const restoreOld = withClipping(outgoing, oldPlane);
            const restoreNew = withClipping(incoming, newPlane);
            const started = performance.now();
            return new Promise((resolve) => {
                const finish = () => {
                    restoreOld();
                    restoreNew();
                    this.cancelSweep = null;
                    // The spatial UI can enable renderer clipping in the meantime.
                    if (!clipping && !window.VRODOSSpatialUI?.getActivePanel?.()) renderer.localClippingEnabled = false;
                    for (const record of incoming) record.entity.object3D.visible = false;
                    resolve();
                };
                this.cancelSweep = finish;
                const advance = () => {
                    if (this.removed || generation !== this.generation) return finish();
                    const t = Math.min(1, (performance.now() - started) / 350);
                    const x = THREE.MathUtils.lerp(bounds.min.x - 0.001, bounds.max.x + 0.001, t * t * (3 - 2 * t));
                    oldPlane.constant = -x;
                    newPlane.constant = x;
                    for (const record of incoming) record.entity.object3D.visible = true;
                    if (t === 1) finish();
                    else this.resources.frame(advance);
                };
                advance();
            });
        },

        commit(index, incoming, outgoing, ground) {
            for (const record of outgoing) {
                this.active.delete(record.id);
                this.discard(record);
            }
            for (const record of incoming) {
                record.entity.removeAttribute(pendingAttribute);
                record.entity.setAttribute('visible', 'true');
                this.active.set(record.id, record);
            }
            if (ground) this.movement.commitDiaryGround(ground);
            const settings = this.el.components['scene-settings'];
            settings?.markShadowDirty('diary-entry');
            settings?.queueQualityRefresh(false);
            this.index = index;
            this.view.update();
        },

        prefetchNext() {
            this.prefetch?.abort();
            const next = this.dataSet.stages[this.index + 1];
            if (!next) return;
            const controller = new AbortController();
            this.prefetch = controller;
            const urls = new Set(next.layers.filter((id) => !this.active.has(id)).map((id) => this.url(this.templates.get(id))));
            this.resources.timeout(async () => {
                for (const url of urls) {
                    if (controller.signal.aborted || this.index !== this.target) return;
                    try {
                        const response = await fetch(url, { signal: controller.signal, priority: 'low' });
                        if (response.ok && response.body) {
                            const reader = response.body.getReader();
                            while (!(await reader.read()).done) { /* Fill the immutable browser cache. */ }
                        }
                    } catch { /* Playback reports errors for selected entries. */ }
                }
            }, 500);
        },

        remove() {
            this.removed = true;
            this.prefetch?.abort();
            this.cancelSweep?.();
            this.view?.remove();
            for (const record of this.loading) this.discard(record);
            for (const record of this.active.values()) this.discard(record);
            this.active.clear();
            if (this.movement) {
                this.movement.diaryTransition = false;
                if (!this.movement.removed) this.movement.markNavMeshDirty();
            }
            this.resources.disposeAll();
        }
    });
})();
