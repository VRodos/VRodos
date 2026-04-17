AFRAME.registerComponent('audio-source-controls', {
    schema: {
        mode: { default: 'interact' },
        loop: { default: false },
        volume: { default: 1 },
        refDistance: { default: 2 },
        maxDistance: { default: 20 },
        rolloffFactor: { default: 1 },
        distanceModel: { default: 'inverse' }
    },

    init: function () {
        this.soundComponent = null;
        this.pendingAutoplay = this.data.mode === 'autoplay';
        this.onInteract = this.onInteract.bind(this);
        this.onSceneLoaded = this.onSceneLoaded.bind(this);
        this.onSoundLoaded = this.onSoundLoaded.bind(this);
        this.onEnded = this.onEnded.bind(this);

        if (!window.VRODOS_AUDIO_RUNTIME) {
            window.VRODOS_AUDIO_RUNTIME = {
                activeSource: null,
                pendingSources: [],
                gestureHookInstalled: false,

                ensureGestureHook: function () {
                    if (this.gestureHookInstalled) {
                        return;
                    }

                    const handleGesture = () => {
                        const queue = this.pendingSources.slice();
                        this.pendingSources = [];
                        queue.forEach((source) => {
                            if (source && typeof source.play === 'function') {
                                source.play(true);
                            }
                        });
                    };

                    ['click', 'touchstart', 'keydown'].forEach((eventName) => {
                        document.addEventListener(eventName, handleGesture, { once: true, passive: true });
                    });

                    this.gestureHookInstalled = true;
                },

                registerPending: function (source) {
                    if (!source) {
                        return;
                    }

                    if (this.pendingSources.indexOf(source) === -1) {
                        this.pendingSources.push(source);
                    }

                    this.ensureGestureHook();
                },

                setActive: function (source) {
                    if (this.activeSource && this.activeSource !== source && typeof this.activeSource.stop === 'function') {
                        this.activeSource.stop();
                    }

                    this.activeSource = source;
                },

                clearActive: function (source) {
                    if (this.activeSource === source) {
                        this.activeSource = null;
                    }
                }
            };
        }

        this.el.addEventListener('sound-loaded', this.onSoundLoaded);
        this.el.addEventListener('sound-ended', this.onEnded);
        this.el.addEventListener('click', this.onInteract);

        const sceneEl = this.el.sceneEl;
        if (sceneEl && sceneEl.hasLoaded) {
            this.onSceneLoaded();
        } else if (sceneEl) {
            sceneEl.addEventListener('loaded', this.onSceneLoaded, { once: true });
        }
    },

    remove: function () {
        this.el.removeEventListener('sound-loaded', this.onSoundLoaded);
        this.el.removeEventListener('sound-ended', this.onEnded);
        this.el.removeEventListener('click', this.onInteract);
        window.VRODOS_AUDIO_RUNTIME.clearActive(this);
    },

    onSceneLoaded: function () {
        this.soundComponent = this.el.components.sound || null;
        this.syncVisualState(false);

        if (this.pendingAutoplay) {
            this.play(false);
        }
    },

    onSoundLoaded: function () {
        this.soundComponent = this.el.components.sound || null;
        if (this.pendingAutoplay) {
            this.play(false);
        }
    },

    onEnded: function () {
        window.VRODOS_AUDIO_RUNTIME.clearActive(this);
        this.syncVisualState(false);
    },

    onInteract: function () {
        if (this.data.mode !== 'interact') {
            return;
        }

        if (this.isPlaying()) {
            this.stop();
        } else {
            this.play(true);
        }
    },

    isPlaying: function () {
        const sound = this.getSoundComponent();
        return !!(sound && sound.isPlaying);
    },

    getSoundComponent: function () {
        if (!this.soundComponent) {
            this.soundComponent = this.el.components.sound || null;
        }

        return this.soundComponent;
    },

    play: function (fromUserGesture) {
        const sound = this.getSoundComponent();
        if (!sound) {
            if (!fromUserGesture) {
                window.VRODOS_AUDIO_RUNTIME.registerPending(this);
            }
            return;
        }

        window.VRODOS_AUDIO_RUNTIME.setActive(this);

        try {
            sound.stopSound();
        } catch (e) {
        }

        try {
            sound.playSound();
            this.pendingAutoplay = false;
            this.syncVisualState(true);

            if (!fromUserGesture) {
                window.setTimeout(() => {
                    if (!this.isPlaying()) {
                        window.VRODOS_AUDIO_RUNTIME.registerPending(this);
                    }
                }, 250);
            }
        } catch (e) {
            if (!fromUserGesture) {
                window.VRODOS_AUDIO_RUNTIME.registerPending(this);
            }
        }
    },

    stop: function () {
        const sound = this.getSoundComponent();
        if (sound) {
            try {
                sound.stopSound();
            } catch (e) {
            }
        }

        window.VRODOS_AUDIO_RUNTIME.clearActive(this);
        this.syncVisualState(false);
    },

    syncVisualState: function (isPlaying) {
        this.el.setAttribute('data-audio-state', isPlaying ? 'playing' : 'idle');
        this.el.classList.toggle('audio-playing', !!isPlaying);

        const object3D = this.el.object3D;
        if (!object3D) {
            return;
        }

        if (!this.baseScale) {
            this.baseScale = object3D.scale.clone();
        }

        const multiplier = isPlaying ? 1.08 : 1;
        object3D.scale.set(
            this.baseScale.x * multiplier,
            this.baseScale.y * multiplier,
            this.baseScale.z * multiplier
        );
    }
});
