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
        this.pendingPlayRequest = false;
        this.fallbackPlaybackActive = false;
        this.audioAsset = this.resolveAudioAssetElement();
        this.onInteract = this.onInteract.bind(this);
        this.onSceneLoaded = this.onSceneLoaded.bind(this);
        this.onSoundLoaded = this.onSoundLoaded.bind(this);
        this.onEnded = this.onEnded.bind(this);
        this.onAudioAssetEnded = this.onAudioAssetEnded.bind(this);

        if (!window.VRODOS_AUDIO_RUNTIME) {
            window.VRODOS_AUDIO_RUNTIME = {
                activeSource: null,
                pendingSources: [],
                sources: [],
                gestureHookInstalled: false,

                ensureGestureHook: function () {
                    if (this.gestureHookInstalled) {
                        return;
                    }

                    const handleGesture = () => {
                        this.sources.forEach((source) => {
                            if (source && typeof source.prepareForGesture === 'function') {
                                source.prepareForGesture();
                            }
                        });

                        const queue = this.pendingSources.slice();
                        this.pendingSources = [];
                        queue.forEach((source) => {
                            if (source && typeof source.startAudio === 'function') {
                                source.startAudio(true);
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

                registerSource: function (source) {
                    if (!source || this.sources.indexOf(source) !== -1) {
                        return;
                    }

                    this.sources.push(source);
                },

                unregisterSource: function (source) {
                    this.sources = this.sources.filter((item) => item !== source);
                    this.pendingSources = this.pendingSources.filter((item) => item !== source);
                },

                setActive: function (source) {
                    if (this.activeSource && this.activeSource !== source && typeof this.activeSource.stopAudio === 'function') {
                        this.activeSource.stopAudio();
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

        window.VRODOS_AUDIO_RUNTIME.registerSource(this);
        window.VRODOS_AUDIO_RUNTIME.ensureGestureHook();

        if (this.audioAsset) {
            this.audioAsset.addEventListener('ended', this.onAudioAssetEnded);
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
        if (this.audioAsset) {
            this.audioAsset.removeEventListener('ended', this.onAudioAssetEnded);
        }

        this.el.removeEventListener('sound-loaded', this.onSoundLoaded);
        this.el.removeEventListener('sound-ended', this.onEnded);
        this.el.removeEventListener('click', this.onInteract);
        window.VRODOS_AUDIO_RUNTIME.clearActive(this);
        window.VRODOS_AUDIO_RUNTIME.unregisterSource(this);
    },

    onSceneLoaded: function () {
        this.soundComponent = this.el.components.sound || null;
        this.prepareAudioAsset(true);
        this.syncVisualState(false);

        if (this.pendingAutoplay) {
            this.startAudio(false);
        }
    },

    onSoundLoaded: function () {
        this.soundComponent = this.el.components.sound || null;
        if (this.pendingAutoplay || this.pendingPlayRequest) {
            this.startAudio(this.pendingPlayRequest);
        }
    },

    onEnded: function () {
        this.pendingPlayRequest = false;
        this.fallbackPlaybackActive = false;
        window.VRODOS_AUDIO_RUNTIME.clearActive(this);
        this.syncVisualState(false);
    },

    onAudioAssetEnded: function () {
        this.pendingPlayRequest = false;
        this.fallbackPlaybackActive = false;
        window.VRODOS_AUDIO_RUNTIME.clearActive(this);
        this.syncVisualState(false);
    },

    onInteract: function (evt) {
        const currentState = this.el.getAttribute('data-audio-state');
        
        // Only restrict non-primary buttons if the interaction comes from a mouse-like device
        // This ensures VR controllers (triggers/grips) continue to work in headset mode.
        if (evt.detail && evt.detail.originalEvent && evt.detail.originalEvent.button !== undefined) {
             if (evt.detail.originalEvent.button !== 0) {
                 return;
             }
        }

        console.log('[Audio] Interaction triggered on:', this.el.id, 'Attribute State:', currentState);
        
        if (this.data.mode !== 'interact') {
            return;
        }

        // Use the attribute as the source of truth for the toggle
        if (currentState === 'playing') {
            console.log('[Audio] Determined to STOP based on attribute.');
            this.stopAudio();
        } else {
            console.log('[Audio] Determined to START based on attribute.');
            this.startAudio(true);
        }
    },

    isPlaying: function () {
        if (this.audioAsset && !this.audioAsset.paused && !this.audioAsset.ended && this.audioAsset.currentSrc) {
            return true;
        }

        const sound = this.getSoundComponent();
        return !!(sound && sound.isPlaying);
    },

    resolveAudioAssetElement: function () {
        var assetId = this.el.getAttribute('data-audio-asset-id');
        if (assetId) {
            return document.getElementById(assetId);
        }

        return null;
    },

    prepareAudioAsset: function (forceLoad) {
        if (!this.audioAsset) {
            return;
        }

        this.audioAsset.preload = 'auto';
        this.audioAsset.setAttribute('playsinline', '');
        this.audioAsset.setAttribute('webkit-playsinline', '');

        // Apply audio properties from schema to the fallback element
        this.audioAsset.volume = this.data.volume;
        this.audioAsset.loop = this.data.loop;

        if ((forceLoad || this.audioAsset.readyState === 0) && typeof this.audioAsset.load === 'function') {
            try {
                this.audioAsset.load();
            } catch (e) {
                console.debug('[Audio] Preload failed:', e);
            }
        }
    },

    prepareForGesture: function () {
        this.prepareAudioAsset();
        this.resumeAudioContexts(this.getSoundComponent());
    },

    getSoundComponent: function () {
        if (!this.soundComponent) {
            this.soundComponent = this.el.components.sound || null;
        }

        return this.soundComponent;
    },

    startAudio: function (fromUserGesture) {
        this.pendingPlayRequest = true;
        const sound = this.getSoundComponent();
        console.log('[Audio] startAudio() called. fromUserGesture:', fromUserGesture, 'soundComponent exists:', !!sound);

        if (!sound) {
            console.log('[Audio] No sound component found, attempting fallback.');
            if (fromUserGesture) {
                window.VRODOS_AUDIO_RUNTIME.setActive(this);
                this.playAudioElementFallback();

                if (this.isPlaying()) {
                    console.log('[Audio] Fallback successful (immediate check).');
                    this.pendingPlayRequest = false;
                    return;
                }
            }

            console.log('[Audio] Fallback not immediate, registering pending.');
            window.VRODOS_AUDIO_RUNTIME.registerPending(this);
            return;
        }

        this.prepareAudioAsset();
        window.VRODOS_AUDIO_RUNTIME.setActive(this);
        this.resumeAudioContexts(sound);

        try {
            console.log('[Audio] Calling sound.stopSound() and sound.playSound().');
            sound.stopSound();
            sound.playSound();
            this.pendingAutoplay = false;
            this.syncVisualState(true);

            // Only attempt fallback if the primary sound component failed to start
            if (fromUserGesture && !this.isPlaying()) {
                console.log('[Audio] Primary 3D sound did not start, trying fallback.');
                this.playAudioElementFallback();
            } else if (fromUserGesture) {
                console.log('[Audio] Primary 3D sound is playing. Skipping 2D fallback to preserve spatial effect.');
            }

            if (this.isPlaying()) {
                console.log('[Audio] isPlaying() is true after play sequence.');
                this.pendingPlayRequest = false;
            }

            window.setTimeout(() => {
                const playing = this.isPlaying();
                console.log('[Audio] Delayed (250ms) isPlaying check:', playing);
                if (!playing) {
                    window.VRODOS_AUDIO_RUNTIME.registerPending(this);
                    return;
                }
                this.pendingPlayRequest = false;
            }, 250);
        } catch (e) {
            console.error('[Audio] startAudio() caught error:', e);
            window.VRODOS_AUDIO_RUNTIME.registerPending(this);
        }
    },

    stopAudio: function () {
        this.pendingPlayRequest = false;
        const sound = this.getSoundComponent();
        if (sound) {
            try {
                sound.stopSound();
            } catch (e) {
                console.debug('[Audio] stopSound failed:', e);
            }
        }

        if (this.audioAsset) {
            try {
                this.audioAsset.pause();
            } catch (e) {
                console.debug('[Audio] pause failed:', e);
            }
        }

        this.fallbackPlaybackActive = false;
        window.VRODOS_AUDIO_RUNTIME.clearActive(this);
        this.syncVisualState(false);
    },

    playAudioElementFallback: function () {
        if (!this.audioAsset || typeof this.audioAsset.play !== 'function') {
            return;
        }

        this.prepareAudioAsset();

        try {
            this.audioAsset.currentTime = 0;
        } catch (e) {
            console.debug('[Audio] currentTime reset failed:', e);
        }

        var playPromise = this.audioAsset.play();
        this.fallbackPlaybackActive = true;
        this.syncVisualState(true);

        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch((e) => {
                console.error('[Audio] Fallback play() promise rejected:', e);
                this.fallbackPlaybackActive = false;
                this.syncVisualState(false);
            });
        }
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

        const multiplier = isPlaying ? 1.15 : 1;
        object3D.scale.set(
            this.baseScale.x * multiplier,
            this.baseScale.y * multiplier,
            this.baseScale.z * multiplier
        );
    },

    resumeAudioContexts: function (sound) {
        var contexts = [];

        if (typeof THREE !== 'undefined' && THREE.AudioContext && typeof THREE.AudioContext.getContext === 'function') {
            contexts.push(THREE.AudioContext.getContext());
        }

        if (sound && sound.pool && Array.isArray(sound.pool.children)) {
            sound.pool.children.forEach(function (child) {
                if (child && child.context) {
                    contexts.push(child.context);
                }
            });
        }

        var seen = [];
        contexts.forEach(function (context) {
            if (!context || seen.indexOf(context) !== -1) {
                return;
            }

            seen.push(context);

            if (context.state === 'suspended' && typeof context.resume === 'function') {
                try {
                    context.resume();
                } catch (e) {
                    console.debug('[Audio] resume failed:', e);
                }
            }
        });
    }
});
