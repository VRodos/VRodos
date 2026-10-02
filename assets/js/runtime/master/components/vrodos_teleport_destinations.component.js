'use strict';

AFRAME.registerComponent('vrodos-teleport-destinations', {
    init: function () {
        this.resources = window.VRODOSMaster.RuntimeResources.createRegistry();
        this.points = new Set();
        this.controllers = new Map();
        this.page = 0;
        this.generation = 0;
        this.removed = false;
        this.paused = false;
        this.opening = false;
        this.panel = null;
        this.rejectedPoint = null;
        this.syncPresentation = this.syncPresentation.bind(this);
        this.resources.listen(this.el, 'vrodos-teleport-point-added', event => this.registerPoint(event.detail.point));
        this.resources.listen(this.el, 'vrodos-teleport-point-removed', event => this.unregisterPoint(event.detail.point));
        this.resources.listen(this.el, 'vrodos-teleport-point-rejected', event => this.showRejection(event.detail.point));
        ['loaded', 'vrodos-scene-loader-ready', 'enter-vr', 'exit-vr'].forEach(type => {
            this.resources.listen(this.el, type, this.syncPresentation);
        });
        this.resources.listen(document, 'fullscreenchange', this.syncPresentation);
        this.resources.listen(this.el, 'componentinitialized', event => {
            if (event.detail.name === 'custom-movement') this.syncPresentation();
        });
        this.resources.listen(this.el, 'child-attached', () => this.bindControllers());
        this.resources.listen(this.el, 'child-detached', () => this.bindControllers());
        this.resources.listen(window, 'pagehide', () => this.pause());
        this.el.querySelectorAll('[vrodos-teleport-point]').forEach(el => {
            if (el.components['vrodos-teleport-point']) this.registerPoint(el.components['vrodos-teleport-point']);
        });
        this.bindControllers();
        this.syncPresentation();
    },

    registerPoint: function (point) {
        this.points.add(point);
        this.refreshPoints();
    },

    unregisterPoint: function (point) {
        if (this.previewPoint === point) this.setPreviewPoint(null);
        this.points.delete(point);
        if (this.rejectedPoint === point) this.rejectedPoint = null;
        this.refreshPoints();
    },

    refreshPoints: function () {
        this.orderedPoints = [...this.points].sort((a, b) => a.order - b.order);
        this.page = Math.min(this.page, Math.max(0, Math.ceil(this.points.size / 6) - 1));
        this.renderDesktop();
        if (!this.points.size) this.closePanel('no-destinations');
        else if (this.panel) this.renderPanel(this.panel);
        this.syncPresentation();
    },

    bindControllers: function () {
        for (const [el, resources] of this.controllers) {
            if (!el.isConnected) {
                resources.disposeAll();
                this.controllers.delete(el);
            }
        }
        this.el.querySelectorAll('#oculusLeft, #oculusRight').forEach(el => {
            if (this.controllers.has(el)) return;
            const resources = window.VRODOSMaster.RuntimeResources.createRegistry();
            resources.listen(el, 'thumbstickdown', event => {
                event.stopPropagation();
                this.togglePanel();
            });
            this.controllers.set(el, resources);
        });
    },

    isImmersive: function () {
        return window.VRODOSRuntimeOverlay.getPresentationMode() === 'immersive-xr';
    },

    isReady: function () {
        const loader = this.el.components['vrodos-scene-loader'];
        return !this.removed && !this.paused && this.el.hasLoaded && (!loader || loader.isReady);
    },

    canActivate: function () {
        return this.isReady() && Boolean(this.movement) && !this.movement.removed &&
            !this.movement.teleportPaused && !this.movement.teleportTravel &&
            !window.VRODOSRuntimeOverlay.interactionLocked;
    },

    syncPresentation: function () {
        if (this.removed) return;
        this.movement = this.el.querySelector('[custom-movement]')?.components['custom-movement'];
        if (!this.isImmersive()) this.closePanel('presentation-change');
        else if (!this.panel) {
            this.pointerPoint = null;
            this.focusedPoint = null;
            this.setPreviewPoint(null);
        }
        if (!this.desktop) return;
        const fullscreen = document.fullscreenElement;
        const host = fullscreen && !['CANVAS', 'IFRAME'].includes(fullscreen.tagName) ? fullscreen : document.body;
        if (this.desktop.parentNode !== host) host.append(this.desktop);
        this.desktop.hidden = !this.isReady() || this.isImmersive() || !this.points.size;
        this.updateAvailability();
        this.syncDesktopPreview();
    },

    // Observe cached navigation state, without searching the scene every frame.
    tick: function () {
        this.updateAvailability();
    },

    updateAvailability: function () {
        const available = this.canActivate();
        if (available === this.available) return;
        this.available = available;
        this.buttons?.forEach(button => { button.disabled = !available; });
        this.syncDesktopPreview();
    },

    setPreviewPoint: function (point) {
        if (this.previewPoint === point) return;
        this.previewPoint?.setMenuHovered(false);
        this.previewPoint = point;
        point?.setMenuHovered(true);
    },

    syncDesktopPreview: function () {
        if (!this.desktop || this.isImmersive()) return;
        const point = !this.desktop.hidden && this.canActivate() ? this.pointerPoint || this.focusedPoint : null;
        this.setPreviewPoint(point);
        this.tooltip.textContent = point ? point.label : '';
        this.tooltip.hidden = !point;
    },

    renderDesktop: function () {
        if (!this.desktop && !this.points.size) return;
        if (!this.desktop) {
            this.style = document.createElement('style');
            this.style.textContent = `
.vrodos-destinations { position:fixed; top:max(16px,env(safe-area-inset-top)); left:50%; transform:translateX(-50%); max-width:calc(100vw - 32px - env(safe-area-inset-left) - env(safe-area-inset-right)); z-index:10000; color:#fff; font-family:"Segoe UI",sans-serif; pointer-events:none; }
.vrodos-destinations[hidden], .vrodos-destinations__label[hidden] { display:none; }
.vrodos-destinations__list { display:flex; gap:8px; overflow-x:auto; padding:4px; scrollbar-width:thin; pointer-events:auto; }
.vrodos-destinations__button { flex:0 0 48px; width:48px; height:48px; border-radius:50%; border:0; background:rgb(18 24 32 / 65%); backdrop-filter:blur(10px); color:#fff; font:650 16px "Segoe UI",sans-serif; cursor:pointer; }
.vrodos-destinations__button:hover { background:rgb(15 118 110 / 85%); }
.vrodos-destinations__button:focus-visible { outline:2px solid #5eead4; outline-offset:2px; }
.vrodos-destinations__button:disabled { opacity:.5; cursor:default; }
.vrodos-destinations__button[data-rejected="true"] { background:#991b1b; }
.vrodos-destinations__label { position:absolute; top:calc(100% + 8px); left:50%; transform:translateX(-50%); box-sizing:border-box; padding:8px 12px; width:max-content; max-width:min(320px,calc(100vw - 32px)); border:0; border-radius:10px; background:rgb(18 24 32 / 85%); color:#fff; font-size:13px; text-align:center; overflow-wrap:anywhere; }
`;
            document.head.append(this.style);
            this.desktop = document.createElement('nav');
            this.desktop.className = 'vrodos-destinations';
            this.desktop.setAttribute('aria-label', 'Teleport destinations');
            this.list = document.createElement('div');
            this.list.className = 'vrodos-destinations__list';
            this.tooltip = document.createElement('span');
            this.tooltip.className = 'vrodos-destinations__label';
            this.tooltip.hidden = true;
            this.desktop.append(this.list, this.tooltip);
            const pointForEvent = event => {
                const button = event.target.closest('.vrodos-destinations__button');
                return button ? this.orderedPoints.find(point => point.order === Number(button.dataset.order)) : null;
            };
            this.resources.listen(this.desktop, 'click', event => {
                const point = pointForEvent(event);
                if (point && this.canActivate()) point.activate();
            });
            ['mouseover', 'focusin'].forEach(type => this.resources.listen(this.desktop, type, event => {
                const point = pointForEvent(event);
                if (type === 'mouseover') this.pointerPoint = point;
                else this.focusedPoint = point;
                this.syncDesktopPreview();
            }));
            ['mouseleave', 'focusout'].forEach(type => this.resources.listen(this.desktop, type, () => {
                if (type === 'mouseleave') this.pointerPoint = null;
                else this.focusedPoint = null;
                this.syncDesktopPreview();
            }));
            ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'touchstart', 'touchend', 'wheel', 'keydown', 'keyup'].forEach(type => {
                this.resources.listen(this.desktop, type, event => event.stopPropagation());
            });
        }
        this.buttons = this.orderedPoints.map(point => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'vrodos-destinations__button';
            button.dataset.order = String(point.order);
            button.textContent = String(point.order);
            button.setAttribute('aria-label', `Teleport to ${point.order}. ${point.label}`);
            return button;
        });
        this.list.replaceChildren(...this.buttons);
        this.pointerPoint = null;
        this.focusedPoint = null;
        this.setPreviewPoint(null);
        this.tooltip.hidden = true;
        this.available = null;
        this.updateAvailability();
        this.updateRejection();
    },

    togglePanel: async function () {
        if (!this.isImmersive()) return;
        if (this.panel || this.opening) {
            this.closePanel('toggle');
            return;
        }
        if (!this.points.size || !this.canActivate()) return;
        const generation = ++this.generation;
        this.opening = true;
        try {
            const loaded = await window.VRODOSRuntimeOverlay.ensureSpatialUiRuntime();
            if (!loaded || generation !== this.generation || !this.canActivate() || !this.isImmersive()) return;
            if (!await window.VRODOSSpatialUI.prewarm()) return;
            if (generation !== this.generation || !this.canActivate() || !this.isImmersive() || !this.points.size) return;
            this.panel = window.VRODOSSpatialUI.openPanel({
                id: 'teleport-destinations', width: 0.85, height: 0.8, designWidthPx: 650,
                distance: 2, centerAtEyeLevel: true, anchorRefreshFrames: 0,
                background: '#18202b', borderWidth: 0,
                render: api => this.renderPanel(api),
                cleanup: () => { this.setPreviewPoint(null); this.panel = null; this.spatialButtons = null; }
            });
        } catch (error) {
            window.VRODOSRuntimeOverlay.recordDiagnostic('warn', 'Could not open teleport destinations.', { error: String(error) });
        } finally {
            if (generation === this.generation) this.opening = false;
        }
    },

    renderPanel: function (api) {
        this.setPreviewPoint(null);
        api.frame({ title: 'Destinations', titleSize: 32, headerHeight: 78,
            paddingX: 24, paddingY: 16, gapY: 10, footerHeight: 64, footerPaddingBottom: 16 });
        this.spatialButtons = new Map();
        this.orderedPoints.slice(this.page * 6, this.page * 6 + 6).forEach(point => {
            const button = api.button(api.content, { label: `${point.order}. ${point.label}`, width: '100%',
                height: 68, fontSize: 26, variant: point === this.rejectedPoint ? 'negative' : 'secondary',
                onHoverChange: hovered => {
                    if (hovered && this.panel === api) this.setPreviewPoint(point);
                    else if (!hovered && this.previewPoint === point) this.setPreviewPoint(null);
                },
                onClick: event => {
                    event?.stopPropagation();
                    this.selectDestination(point);
                } });
            this.spatialButtons.set(point, button);
        });
        const pages = Math.ceil(this.points.size / 6);
        if (pages > 1) {
            api.button(api.footer, { label: 'Previous', height: 48, fontSize: 22, disabled: this.page === 0,
                onClick: () => { this.page--; this.renderPanel(api); } });
            api.text(api.footer, { text: `${this.page + 1} / ${pages}`, color: '#fff', fontSize: 22 });
            api.button(api.footer, { label: 'Next', height: 48, fontSize: 22, disabled: this.page + 1 >= pages,
                onClick: () => { this.page++; this.renderPanel(api); } });
        }
    },

    selectDestination: function (point) {
        if (!this.panel || !this.points.has(point)) return;
        this.closePanel('teleport');
        if (!this.canActivate()) return;
        if (!point.activate()) {
            // Reopen on the next frame after pointer teardown, retaining rejection feedback.
            const generation = this.generation;
            this.resources.frame(() => {
                if (generation === this.generation) this.togglePanel();
            });
        }
    },

    showRejection: function (point) {
        if (!this.points.has(point)) return;
        this.clearRejection?.();
        this.rejectedPoint = point;
        this.updateRejection();
        this.clearRejection = this.resources.timeout(() => {
            this.clearRejection = null;
            this.rejectedPoint = null;
            this.updateRejection();
        }, 600);
    },

    updateRejection: function () {
        this.buttons?.forEach((button, index) => {
            button.dataset.rejected = String(this.orderedPoints[index] === this.rejectedPoint);
        });
        if (this.panel) {
            this.spatialButtons.forEach((button, point) => {
                this.panel.updateButton(button, { variant: point === this.rejectedPoint ? 'negative' : 'secondary' });
            });
        }
    },

    closePanel: function (reason) {
        this.setPreviewPoint(null);
        this.generation++;
        this.opening = false;
        if (this.panel) this.panel.close(reason);
        this.panel = null;
        this.spatialButtons = null;
    },

    play: function () {
        this.paused = false;
        this.syncPresentation();
    },

    pause: function () {
        this.paused = true;
        this.pointerPoint = null;
        this.focusedPoint = null;
        this.closePanel('pause');
        if (this.desktop) this.desktop.hidden = true;
    },

    remove: function () {
        this.pause();
        this.removed = true;
        this.resources.disposeAll();
        this.controllers.forEach(resources => resources.disposeAll());
        this.controllers.clear();
        this.points.clear();
        this.orderedPoints = [];
        this.buttons = null;
        this.movement = null;
        this.desktop?.remove();
        this.style?.remove();
    }
});
