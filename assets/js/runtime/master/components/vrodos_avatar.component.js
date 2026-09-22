/**
 * VRodos Master Avatar Components
 */

AFRAME.registerComponent('avatar-movement-info', {
    schema: {
        movementState: { type: 'string', default: 'idle' }
    }
});

AFRAME.registerComponent('player-info', {
    schema: {
        name: { type: 'string', default: `user-${  Math.round(Math.random() * 10000)}` },
        color: { type: 'color', default: typeof window.ntExample !== 'undefined' ? window.ntExample.randomColor() : '#cccccc' },
        gltf: { default: '', type: 'string' },
        avatarType: { default: 'blob', type: 'string' },
        animationsLoaded: { default: '', type: 'string' },
        currentPrivateChat: { default: '', type: 'string' },
        fullChatTable: { default: [], type: 'array' },
        connectedUsers: { default: 0, type: 'number' }
    },
    init: function () {
        this.resources = window.VRODOSMaster.RuntimeResources.createRegistry();
        this.removed = false;
        this.occupancySystem = this.el.sceneEl?.systems['vrodos-chat-occupancy'];
        this.occupancySystem?.updatePlayer(this);
        this.anims_loaded = false;
        this.ownedByLocalUser = this.el.id === 'cameraA';

        if (this.ownedByLocalUser) {
            this.nametagInput = document.getElementById('username-overlay');
            if (this.nametagInput) {
                this.nametagInput.value = this.data.name;
            }
            const colorChanger = document.getElementById('color-changer');
            if (colorChanger) {
                colorChanger.style.backgroundColor = this.data.color;
                colorChanger.style.color = this.data.color;
            }
        }

        // Listen for template instantiation
        this.resources.listen(this.el, 'instantiated', () => {
            this.applyAvatar();
        });

        // Always try to apply avatar on init.
        this.applyAvatar();
    },
    applyAvatar: function () {
        if (this.removed) return;
        const elem = this.el;
        const isRemote = !this.ownedByLocalUser;

        this.head = this.el.querySelector('.head');
        this.face = this.el.querySelector('.face');
        this.nametag = this.el.querySelector('.nametag');


        if (isRemote) {
            if (!this.head && !this.rpm_model) {
                // Missing visuals handled by retry loop below
            }
        }

        if (!this.head && !this.rpm_model && !this.ownedByLocalUser) {
            // Only retry if we are using the expo template which is SUPPOSED to have these
            const networked = this.el.getAttribute('networked');
            if (networked && networked.template === '#avatar-template-expo') {
                if (!this.avatarRetryTimeout && (!this.retryCount || this.retryCount < 10)) {
                    this.retryCount = (this.retryCount || 0) + 1;
                    this.avatarRetryTimeout = this.resources.timeout(() => {
                        this.avatarRetryTimeout = null;
                        if (this.el) this.applyAvatar();
                    }, 200);
                }
            }
            return;
        }

        if (this.data.avatarType) {
            if (this.data.avatarType === 'no-avatar') {
                if (isRemote) elem.setAttribute('visible', 'false');
                if (this.head) this.head.setAttribute("visible", "false");
                if (this.face) this.face.setAttribute("visible", "false");
                if (this.nametag) this.nametag.setAttribute("visible", "false");
            } else if (this.data.avatarType === 'blob') {
                if (isRemote) {
                    elem.setAttribute('visible', 'true');
                    elem.removeAttribute('data-vrodos-delayed-reveal');
                }
                if (this.head) {
                    this.head.setAttribute('material', { color: this.data.color });
                    this.head.setAttribute('visible', 'true');
                }
                if (this.face) this.face.setAttribute('visible', 'true');
                if (this.nametag) {
                    this.nametag.setAttribute('value', this.data.name);
                    this.nametag.setAttribute('visible', 'true');
                }
            }
        }
    },
    update: function () {
        this.occupancySystem?.updatePlayer(this);
        this.applyAvatar();
    },
    remove: function () {
        this.occupancySystem?.unregisterPlayer(this);
        this.occupancySystem = null;
        this.removed = true;
        this.resources.disposeAll();
        this.avatarRetryTimeout = null;
    }
});
