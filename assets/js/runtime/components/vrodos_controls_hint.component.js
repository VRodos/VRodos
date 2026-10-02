(function () {
    'use strict';

    // Filled SVG paths render consistently in both desktop DOM and spatial UI.
    const controller = '<path fill-rule="evenodd" d="M25 5C13 5 5 12 5 23c0 8 5 13 11 15l7 18c1 3 4 4 7 3l9-3c3-1 4-4 3-7l-4-15c6-3 10-8 10-14C48 11 38 5 25 5Zm0 3c11 0 20 5 20 12 0 5-4 9-10 12l-1 1 5 17c.5 2 0 3-2 3.5l-8 2.5c-1.5.5-2.5 0-3-1.5l-8-19-1-.5C11 33 8 29 8 23 8 14 15 8 25 8Z"/><circle cx="32" cy="24" r="2"/><circle cx="38" cy="19" r="2"/>';
    const stick = '<path fill-rule="evenodd" d="M20 12a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"/><circle cx="20" cy="20" r="3"/>';
    const badge = '<path fill-rule="evenodd" d="M52 39a11 11 0 1 1 0 22 11 11 0 0 1 0-22Zm0 2.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z"/>';
    const mouse = '<path fill-rule="evenodd" d="M32 6c-10 0-16 6-16 16v20c0 10 6 16 16 16s16-6 16-16V22C48 12 42 6 32 6Zm0 3c8 0 13 5 13 13v20c0 8-5 13-13 13s-13-5-13-13V22c0-8 5-13 13-13Z"/><path d="M31 9h2v18h-2ZM19 26h26v2H19ZM29 11c-6 .8-9 4.8-9 11v1h9Z"/>';
    const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="white" aria-hidden="true" focusable="false">${body}</svg>`;
    const controlsIcons = Object.fromEntries(Object.entries({
        'left-stick': `${controller}${stick}${badge}<path d="M48 44h2.5v9h6v2.5H48Z"/>`,
        'right-stick': `<g transform="translate(53 0) scale(-1 1)">${controller}${stick}</g>${badge}<path fill-rule="evenodd" d="M47 44h6c6 0 6 7 2 8l3 4h-3l-3-4h-2v4h-3Zm3 2.5v3h3c2 0 2-3 0-3Z"/>`,
        'right-trigger': '<path fill-rule="evenodd" d="M15 10h34c5 0 8 4 9 9l4 24c1 6-3 11-9 11H11C5 54 1 49 2 43l4-24c1-5 4-9 9-9Zm0 3c-3 0-5 3-6 7L5 44c-.5 4 2 7 6 7h42c4 0 6.5-3 6-7l-4-24c-1-4-3-7-6-7Z"/><path fill-rule="evenodd" d="M15 21h9c12 0 12 13 4 15l7 9h-5l-7-9h-4v9h-4Zm4 4v7h5c6 0 6-7 0-7Z"/><path d="M35 21h18v4h-7v20h-4V25h-7Z"/>',
        'jump-buttons': '<path fill-rule="evenodd" d="M17 17a15 15 0 1 1 0 30 15 15 0 0 1 0-30Zm0 3a12 12 0 1 0 0 24 12 12 0 0 0 0-24ZM47 17a15 15 0 1 1 0 30 15 15 0 0 1 0-30Zm0 3a12 12 0 1 0 0 24 12 12 0 0 0 0-24Z"/><path fill-rule="evenodd" d="M15 24h4l7 16h-4l-1.5-4h-7L12 40H8Zm2 4-2.5 5h5ZM39 24h4l4 5.5 4-5.5h4l-6 8 6 8h-4l-4-5.5-4 5.5h-4l6-8Z"/>',
        'reset-buttons': '<path fill-rule="evenodd" d="M17 17a15 15 0 1 1 0 30 15 15 0 0 1 0-30Zm0 3a12 12 0 1 0 0 24 12 12 0 0 0 0-24ZM47 17a15 15 0 1 1 0 30 15 15 0 0 1 0-30Zm0 3a12 12 0 1 0 0 24 12 12 0 0 0 0-24Z"/><path d="M11 25h7c7 0 9 7 4 9 6 3 3 9-4 9h-7Zm4 3v4h3c3 0 3-4 0-4Zm0 7v5h3c4 0 4-5 0-5ZM37 25h4l6 8 6-8h4l-8 11v7h-4v-7Z"/>',
        'mouse-click': mouse,
        'mouse-drag': `<g transform="translate(8 8) scale(.75)">${mouse}</g><path d="M1 32l7-7v5h8v4H8v5ZM63 32l-7-7v5h-8v4h8v5Z"/>`
    }).map(([name, body]) => [name, { name, content: svg(body) }]));

    AFRAME.registerComponent('vrodos-controls-hint', {
        init: function () {
            this.resources = window.VRODOSMaster.RuntimeResources.createRegistry();
            this.hostFullscreen = false;
            this.mode = null;
            this.generation = 0;
            this.timeout = null;
            this.removed = false;
            this.syncPresentation = this.syncPresentation.bind(this);
            this.onPageHide = this.hide.bind(this);
            this.sceneEventNames = ['loaded', 'enter-vr', 'exit-vr', 'vrodos-scene-loader-ready'];
            this.sceneEventNames.forEach((event) => this.resources.listen(this.el, event, this.syncPresentation));
            this.resources.listen(document, 'fullscreenchange', this.syncPresentation);
            this.resources.listen(window, 'pagehide', this.onPageHide);
            this.resources.listen(document, 'pointerdown', event => {
                if (this.viewMenu && !this.viewMenu.contains(event.target)) this.setViewMenuOpen(false);
            });
            this.resources.listen(document, 'keydown', event => {
                if (event.key === 'Escape' && this.viewPanel && !this.viewPanel.hidden) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.setViewMenuOpen(false, true);
                }
            });
            this.syncPresentation();
        },

        setHostFullscreen: function (active) {
            this.hostFullscreen = active;
            this.syncPresentation();
        },

        bindFullscreenHost: function () {
            const canvas = this.el.canvas;
            if (this.fullscreenCanvas || !canvas || !this.el.requestFullscreen) return;
            // A-Frame requests canvas fullscreen; DOM hints need the scene container in the top layer.
            this.fullscreenCanvas = canvas;
            this.fullscreenDescriptor = Object.getOwnPropertyDescriptor(canvas, 'requestFullscreen');
            this.requestSceneFullscreen = (options) => this.el.requestFullscreen(options);
            canvas.requestFullscreen = this.requestSceneFullscreen;
        },

        getItems: function (immersive) {
            const movement = this.el.querySelector('[custom-movement]')?.components?.['custom-movement'];
            const settings = this.el.getAttribute('scene-settings');
            const disabled = [true, 'true', '1'].includes(settings?.movement_disabled);
            const items = [];
            const add = (input, action, icon) => items.push({ input, action, icon: controlsIcons[icon] });
            const keyboardMovement = this.el.querySelector('[wasd-controls]')?.components?.['wasd-controls'];
            if (!disabled && (movement || (!immersive && keyboardMovement?.data.enabled))) {
                add(immersive ? 'Left stick' : 'WASD', 'Move', immersive ? 'left-stick' : undefined);
                if (immersive) add('Right stick', 'Turn', 'right-stick');
            }
            if (!immersive) add('Left click drag', 'Look', 'mouse-drag');
            add(immersive ? 'Point + right trigger (RT)' : 'Left click', 'Select', immersive ? 'right-trigger' : 'mouse-click');
            if (movement && !disabled && movement.getNavigationMode(settings) === 'walkable' && movement.areCollisionsEnabled(settings)) {
                add(immersive ? 'A / X' : 'Space', 'Jump', immersive ? 'jump-buttons' : undefined);
            }
            if (immersive && movement) add('B / Y', 'Reset height', 'reset-buttons');
            if (immersive && this.el.components['vrodos-teleport-destinations']?.points.size) {
                add('Press either stick', 'Destinations', 'left-stick');
            }
            return items;
        },

        syncPresentation: function () {
            if (this.removed) return;
            this.bindFullscreenHost();
            const loader = this.el.components['vrodos-scene-loader'];
            const ready = this.el.hasLoaded && (!loader || loader.isReady);
            const presentation = window.VRODOSRuntimeOverlay.getPresentationMode();
            const mode = presentation === 'immersive-xr' ? presentation
                : this.hostFullscreen ? 'desktop-fullscreen' : presentation;
            const nextMode = ready ? mode : 'inline';
            if (nextMode === this.mode) {
                if (ready && nextMode !== 'immersive-xr') this.showViewMenu();
                return;
            }
            this.hide();
            this.mode = nextMode;
            if (ready && nextMode !== 'immersive-xr') this.showViewMenu();
            if (nextMode === 'inline') {
                return;
            }
            const generation = this.generation;
            if (nextMode === 'immersive-xr') {
                this.showVr(generation);
            } else {
                this.showDesktop(this.getItems(false));
                this.startTimer();
            }
        },

        showVr: async function (generation) {
            try {
                const available = await window.VRODOSRuntimeOverlay.ensureSpatialUiRuntime();
                if (!available || generation !== this.generation || this.removed) return;
                const spatial = window.VRODOSSpatialUI;
                if (!await spatial.prewarm() || generation !== this.generation || this.removed) return;
                if (spatial.showControlsHint(this.getItems(true))) this.startTimer();
            } catch (error) {
                window.VRODOSRuntimeOverlay.recordDiagnostic('warn', 'Could not show VR controls hint.', { error: String(error) });
            }
        },

        startTimer: function () {
            if (this.timeout) this.timeout();
            this.timeout = this.resources.timeout(() => this.hideHints(), 5000);
        },

        ensureDesktopStyle: function () {
            if (!this.style) {
                this.style = document.createElement('style');
                this.style.textContent = `
.vrodos-controls-hint { position:fixed; left:50%; bottom:clamp(22px,3vw,40px); z-index:10000; display:flex; justify-content:center; flex-wrap:wrap; gap:8px; width:max-content; max-width:calc(100% - 24px); transform:translateX(-50%); pointer-events:none; font-family:"Segoe UI",sans-serif; }
.vrodos-controls-hint[hidden] { display:none; }
.vrodos-controls-hint__pill { min-height:40px; box-sizing:border-box; padding:8px 12px; display:inline-flex; align-items:center; gap:9px; border:1px solid rgb(255 255 255 / 20%); border-radius:999px; background:rgb(18 18 17 / 46%); box-shadow:0 10px 28px rgb(0 0 0 / 16%); color:#fff; font-size:12px; font-weight:650; line-height:1; white-space:nowrap; backdrop-filter:blur(10px) saturate(1.2); }
.vrodos-controls-hint__keys { display:inline-flex; gap:3px; }
.vrodos-controls-hint__keys svg { display:block; width:26px; height:26px; }
.vrodos-controls-hint kbd { min-width:21px; height:21px; padding:0 3px; box-sizing:border-box; display:grid; place-items:center; border:1px solid rgb(255 255 255 / 46%); border-radius:5px; background:rgb(255 255 255 / 8%); box-shadow:inset 0 -1px 0 rgb(255 255 255 / 16%); color:#fff; font:inherit; font-size:10px; font-weight:760; }
.vrodos-view-mode { position:fixed; left:max(16px,env(safe-area-inset-left)); bottom:max(16px,env(safe-area-inset-bottom)); z-index:10000; font-family:"Segoe UI",sans-serif; color:#fff; }
.vrodos-view-mode[hidden], .vrodos-view-mode__panel[hidden] { display:none; }
.vrodos-view-mode__toggle, .vrodos-view-mode__panel { box-sizing:border-box; border:1px solid rgb(255 255 255 / 20%); border-radius:12px; background:rgb(18 24 32 / 65%); box-shadow:0 10px 28px rgb(0 0 0 / 16%); backdrop-filter:blur(10px) saturate(1.2); }
.vrodos-view-mode__toggle { width:48px; height:48px; padding:12px; display:flex; align-items:center; justify-content:center; color:inherit; cursor:pointer; }
.vrodos-view-mode__toggle svg { display:block; width:24px; height:24px; }
.vrodos-view-mode__panel { position:absolute; left:0; bottom:calc(100% + 8px); display:flex; flex-direction:column; gap:4px; padding:6px; width:min(220px,calc(100vw - 32px)); max-height:60vh; overflow:auto; }
.vrodos-view-mode__option { min-height:44px; box-sizing:border-box; display:flex; align-items:center; padding:10px 12px; border-radius:8px; color:inherit; font-size:13px; font-weight:650; text-decoration:none; }
.vrodos-view-mode__option:hover { background:rgb(255 255 255 / 12%); }
.vrodos-view-mode__option[aria-current="page"] { background:rgb(20 184 166 / 25%); }
.vrodos-view-mode__option[aria-current="page"]::after { content:"✓"; margin-left:auto; padding-left:12px; }
.vrodos-view-mode__toggle:focus-visible, .vrodos-view-mode__option:focus-visible { outline:2px solid #5eead4; outline-offset:2px; }
`;
                document.head.append(this.style);
            }
        },

        getDesktopHost: function () {
            const fullscreen = document.fullscreenElement;
            return fullscreen && !['CANVAS', 'IFRAME'].includes(fullscreen.tagName) ? fullscreen : document.body;
        },

        showViewMenu: function () {
            const variants = Object.entries(JSON.parse(this.el.getAttribute('data-vrodos-device-variants') || '{}'));
            if (variants.length < 2) return;
            this.ensureDesktopStyle();
            if (!this.viewMenu) {
                this.viewMenu = document.createElement('div');
                this.viewMenu.className = 'vrodos-view-mode';
                this.viewToggle = document.createElement('button');
                this.viewToggle.type = 'button';
                this.viewToggle.className = 'vrodos-view-mode__toggle';
                this.viewToggle.innerHTML = svg('<path fill-rule="evenodd" d="M10 8h44a6 6 0 0 1 6 6v28a6 6 0 0 1-6 6H34v6h12v4H18v-4h12v-6H10a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6Zm0 4a2 2 0 0 0-2 2v28a2 2 0 0 0 2 2h44a2 2 0 0 0 2-2V14a2 2 0 0 0-2-2Z"/>');
                this.viewToggle.setAttribute('aria-label', 'View mode');
                this.viewToggle.setAttribute('title', 'View mode');
                this.viewToggle.setAttribute('aria-controls', 'vrodos-view-mode-options');
                this.viewPanel = document.createElement('div');
                this.viewPanel.id = 'vrodos-view-mode-options';
                this.viewPanel.className = 'vrodos-view-mode__panel';
                this.viewPanel.setAttribute('role', 'group');
                this.viewPanel.setAttribute('aria-label', 'View mode');
                const currentProfile = this.el.getAttribute('scene-settings').vrRuntimeProfile;
                variants.forEach(([profile, filename]) => {
                    const link = document.createElement('a');
                    const url = new URL(filename, window.location.href);
                    url.search = window.location.search;
                    url.searchParams.set('vrodos_target', profile);
                    url.hash = window.location.hash;
                    link.href = url.href;
                    link.textContent = { desktop: 'PC', headset: 'Standalone VR', 'pc-rendered-vr': 'PCVR' }[profile];
                    link.className = 'vrodos-view-mode__option';
                    if (profile === currentProfile) link.setAttribute('aria-current', 'page');
                    this.viewPanel.append(link);
                });
                this.viewMenu.append(this.viewToggle, this.viewPanel);
                this.setViewMenuOpen(false);
                this.resources.listen(this.viewToggle, 'click', () => this.setViewMenuOpen(this.viewPanel.hidden));
                this.resources.listen(this.viewPanel, 'click', () => this.setViewMenuOpen(false));
                ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'touchstart', 'touchend', 'wheel'].forEach(type => {
                    this.resources.listen(this.viewMenu, type, event => event.stopPropagation());
                });
            }
            const host = this.getDesktopHost();
            if (this.viewMenu.parentNode !== host) host.append(this.viewMenu);
            this.viewMenu.hidden = false;
        },

        setViewMenuOpen: function (open, restoreFocus) {
            if (!this.viewPanel) return;
            this.viewPanel.hidden = !open;
            this.viewToggle.setAttribute('aria-expanded', String(open));
            if (restoreFocus) this.viewToggle.focus();
        },

        showDesktop: function (items) {
            this.ensureDesktopStyle();
            if (!this.desktop) {
                this.desktop = document.createElement('div');
                this.desktop.className = 'vrodos-controls-hint';
                this.desktop.setAttribute('role', 'status');
                this.desktop.setAttribute('aria-live', 'polite');
            }
            this.desktop.replaceChildren();
            items.forEach(({ input, action, icon }) => {
                const pill = document.createElement('span');
                pill.className = 'vrodos-controls-hint__pill';
                const keys = document.createElement('span');
                keys.className = 'vrodos-controls-hint__keys';
                if (icon) {
                    keys.innerHTML = icon.content;
                    keys.setAttribute('role', 'img');
                    keys.setAttribute('aria-label', input);
                    keys.setAttribute('title', input);
                } else if (input === 'WASD' || input === 'Space') {
                    (input === 'WASD' ? [...input] : [input]).forEach((key) => {
                        const kbd = document.createElement('kbd');
                        kbd.textContent = key;
                        keys.append(kbd);
                    });
                } else keys.textContent = input;
                const label = document.createElement('span');
                label.textContent = action;
                pill.append(keys, label);
                this.desktop.append(pill);
            });
            this.getDesktopHost().append(this.desktop);
            this.desktop.hidden = false;
        },

        hideHints: function () {
            this.generation += 1;
            if (this.timeout) this.timeout();
            this.timeout = null;
            if (this.desktop) this.desktop.hidden = true;
            window.VRODOSSpatialUI?.hideControlsHint();
        },

        hide: function () {
            this.hideHints();
            this.setViewMenuOpen(false);
            if (this.viewMenu) this.viewMenu.hidden = true;
        },

        remove: function () {
            this.removed = true;
            this.hide();
            this.resources.disposeAll();
            if (this.fullscreenCanvas && this.fullscreenCanvas.requestFullscreen === this.requestSceneFullscreen) {
                if (this.fullscreenDescriptor) Object.defineProperty(this.fullscreenCanvas, 'requestFullscreen', this.fullscreenDescriptor);
                else delete this.fullscreenCanvas.requestFullscreen;
            }
            this.desktop?.remove();
            this.viewMenu?.remove();
            this.style?.remove();
        }
    });
}());
