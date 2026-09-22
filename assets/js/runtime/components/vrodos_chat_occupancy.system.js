/** Scene-owned membership shared by private-chat launchers and indicators. */
AFRAME.registerSystem('vrodos-chat-occupancy', {
    init: function () {
        this.resources = window.VRODOSMaster.RuntimeResources.createRegistry();
        this.players = new Map();
        this.counts = new Map();
        this.chats = new Map();
        this.removed = false;
        const reconcile = () => this.reconcile();
        this.resources.listen(this.el, 'loaded', reconcile);
        this.resources.listen(document, 'entityCreated', reconcile);
        this.resources.listen(document.body, 'connected', reconcile);
        this.resources.listen(document.body, 'entityRemoved', (event) => {
            if (!event.detail?.networkId) return;
            for (const player of this.players.keys()) {
                if (player.el.getAttribute('networked')?.networkId === event.detail?.networkId) this.unregisterPlayer(player);
            }
        });
        this.resources.listen(document.body, 'clientDisconnected', (event) => {
            const clientId = event.detail?.clientId;
            if (!clientId) return;
            for (const player of this.players.keys()) {
                const networked = player.el.getAttribute('networked');
                if (networked?.owner === clientId || networked?.creator === clientId) this.unregisterPlayer(player);
            }
        });
        this.reconcile();
    },
    normalizeCapacity: function (value) {
        const capacity = Number(value);
        return capacity === -1 ? Number.MAX_SAFE_INTEGER : (Number.isFinite(capacity) && capacity >= 1 ? capacity : 2);
    },
    occupancy: function (chatId) {
        return this.counts.get(chatId) || 0;
    },
    updatePlayer: function (player) {
        if (this.removed || player.el.sceneEl !== this.el) return;
        const previous = this.players.get(player) || '';
        const next = player.data.currentPrivateChat || '';
        this.players.set(player, next);
        if (previous === next) return;
        this.changeCount(previous, -1);
        this.changeCount(next, 1);
    },
    unregisterPlayer: function (player) {
        const previous = this.players.get(player);
        if (!this.players.delete(player)) return;
        this.changeCount(previous, -1);
    },
    changeCount: function (chatId, delta) {
        if (!chatId) return;
        const count = Math.max(0, this.occupancy(chatId) + delta);
        if (count) this.counts.set(chatId, count);
        else this.counts.delete(chatId);
        for (const [el, chat] of this.chats) {
            if (chat.id === chatId) this.publish(el);
        }
    },
    reconcile: function () {
        if (this.removed) return;
        const active = new Set();
        this.el.querySelectorAll('[player-info]').forEach((el) => {
            const player = el.components?.['player-info'];
            if (!player || player.removed) return;
            active.add(player);
            this.updatePlayer(player);
        });
        for (const player of this.players.keys()) {
            if (!active.has(player)) this.unregisterPlayer(player);
        }
    },
    registerChat: function (el, id, capacity) {
        this.chats.set(el, { id, capacity: this.normalizeCapacity(capacity), lastCount: null });
        this.publish(el);
    },
    unregisterChat: function (el) {
        this.chats.delete(el);
    },
    publish: function (el) {
        const chat = this.chats.get(el);
        if (!chat || this.removed) return;
        const occupancy = this.occupancy(chat.id);
        if (chat.lastCount === occupancy) return;
        chat.lastCount = occupancy;
        const isFull = occupancy >= chat.capacity;
        el.emit('chat-availability-change', isFull ? 'full' : 'available', false);
        document.dispatchEvent(new CustomEvent('chat-occupancy-changed', {
            detail: { chatId: chat.id, occupancy, maxParticipants: chat.capacity, isFull }
        }));
    },
    remove: function () {
        this.removed = true;
        this.resources.disposeAll();
        this.players.clear();
        this.counts.clear();
        this.chats.clear();
    }
});
