(function (window, document, AFRAME) {
  'use strict';

  function appendLogLine(log, text, color = '') {
    if (!log) return;
    const line = document.createElement('span');
    line.textContent = text;
    if (color) line.style.color = color;
    log.appendChild(line);
    log.appendChild(document.createElement('br'));
  }

  AFRAME.registerComponent('chat-poi', {
    schema: {
      scene_id: { type: 'string', default: 'false' },
      num_participants: { type: 'string', default: '2' }
    },

    init() {
      this.chatApi = window.VRODOSChat;
      this.cleanup = [];
      this.privateHistory = [];
      this.privateUnsubscribe = null;
      this.privateSendHandler = null;

      if (!this.chatApi || typeof this.chatApi.send !== 'function' || typeof this.chatApi.subscribe !== 'function') {
        console.warn('[VRodos] chat-poi disabled because VRODOSChat is unavailable.');
        return;
      }

      this.sendButton = document.getElementById('send-msg-chat-btn');
      this.chatInput = document.getElementById('chatInput');
      this.chatLog = document.getElementById('chat-messages');
      this.exitButton = document.getElementById('exit-private-chat-btn');
      if (!this.sendButton || !this.chatInput || !this.chatLog) {
        console.warn('[VRodos] chat-poi disabled because the chat drawer is incomplete.');
        return;
      }
      this.maxParticipants = Number(this.data.num_participants);
      if (this.maxParticipants === -1) {
        this.maxParticipants = Number.MAX_SAFE_INTEGER;
      } else if (!Number.isFinite(this.maxParticipants) || this.maxParticipants < 1) {
        this.maxParticipants = 2;
      }

      this.el.setAttribute('isActive', 'false');
      this.el.setAttribute('currentState', this.isPublicEnabled() ? 'public' : 'private');
      this.setSelectedPrivateChatLabel();
      this.emitAvailabilityChange();

      const scene = this.el.sceneEl || document.querySelector('a-scene');
      this.bind(scene, 'enter-vr', () => this.el.classList.remove('raycastable'));
      this.bind(scene, 'exit-vr', () => this.el.classList.add('raycastable'));
      this.bind(this.el, 'click', (event) => this.handleClick(event));
      this.bind(document, 'chat-selected', (event) => this.handleChatSelected(event));
      this.bind(document, 'entityCreated', () => this.emitAvailabilityChange());
      this.bind(document.body, 'entityRemoved', () => this.emitAvailabilityChange());
      this.bind(document.body, 'clientDisconnected', () => this.emitAvailabilityChange());
      this.bind(document.body, 'connected', () => this.emitAvailabilityChange());
      this.bind(document, 'componentchanged', (event) => {
        if (event.detail?.name === 'player-info') this.emitAvailabilityChange();
      });
      this.bind(this.exitButton, 'click', () => this.exitPrivateChat(), true);
    },

    bind(element, eventName, handler, options) {
      if (!element) return;
      element.addEventListener(eventName, handler, options);
      this.cleanup.push(() => element.removeEventListener(eventName, handler, options));
    },

    isPublicEnabled() {
      return Boolean(this.chatApi?.isPublicEnabled());
    },

    isNetworkReady() {
      return Boolean(window.NAF?.connection && typeof window.NAF.connection.broadcastData === 'function');
    },

    playerInfo() {
      const camera = document.getElementById('cameraA');
      return camera?.getAttribute('player-info') || {};
    },

    privateChatId() {
      return this.el.getAttribute('id') || `chat-${this.data.scene_id}`;
    },

    occupancy() {
      const chatId = this.privateChatId();
      return Array.from(document.querySelectorAll('[player-info]')).filter((player) => {
        const data = player.components?.['player-info']?.data || player.getAttribute('player-info');
        return data?.currentPrivateChat === chatId;
      }).length;
    },

    emitAvailabilityChange() {
      const occupancy = this.occupancy();
      const isFull = this.maxParticipants !== Number.MAX_SAFE_INTEGER && occupancy >= this.maxParticipants;
      this.el.emit('chat-availability-change', isFull ? 'full' : 'available', false);
      document.dispatchEvent(
        new CustomEvent('chat-occupancy-changed', {
          detail: { chatId: this.privateChatId(), occupancy, maxParticipants: this.maxParticipants, isFull }
        })
      );
    },

    setPrivateButtonVisible(visible) {
      const button = document.getElementById('private-chat-button');
      if (!button) return;
      if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.setButtonVisible === 'function') {
        window.VRODOSMasterUI.setButtonVisible(button, visible);
      } else {
        button.style.visibility = visible ? 'visible' : 'hidden';
      }
    },

    setTab(activeTab) {
      if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.applyChatTabs === 'function') {
        window.VRODOSMasterUI.applyChatTabs(activeTab);
        return;
      }
      if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.setChatTabState === 'function') {
        window.VRODOSMasterUI.setChatTabState(activeTab);
        return;
      }

      ['public', 'private'].forEach((tab) => {
        const button = document.getElementById(`${tab}-chat-button`);
        if (!button) return;
        const active = tab === activeTab;
        button.classList.toggle('tw-btn-active', active);
        button.classList.toggle('tw-btn-primary', active);
        button.classList.toggle('tw-btn-ghost', !active);
        if (active) button.classList.remove('tw-hidden');
      });
    },

    setSelectedPrivateChatLabel() {
      const label = document.getElementById('private-chat-button-label') || document.getElementById('private-chat-button');
      if (label) label.textContent = this.el.getAttribute('title') || 'Private';
    },

    showDrawer() {
      const wrapper = document.getElementById('chat-wrapper-el');
      if (!wrapper) return false;
      wrapper.style.visibility = 'visible';
      wrapper.style.display = 'flex';
      wrapper.classList.remove('tw-hidden');
      return true;
    },

    handleClick(event) {
      if (event.detail?.originalEvent?.button !== undefined && event.detail.originalEvent.button !== 0) return;
      if (!this.showDrawer()) return;

      this.setSelectedPrivateChatLabel();
      this.setPrivateButtonVisible(true);
      this.setTab('private');
      this.chatApi.setPublicActive(false);
      const publicButton = document.getElementById('public-chat-button');
      if (publicButton) publicButton.disabled = !this.isPublicEnabled();
      if (typeof window.gtag === 'function') window.gtag('event', 'chat_initiation');

      if (this.playerInfo().currentPrivateChat) return;
      this.chatLog.replaceChildren();
      appendLogLine(this.chatLog, `Connecting to private chat '${this.el.getAttribute('title') || 'Private'}'`);

      if (!this.isNetworkReady()) {
        appendLogLine(this.chatLog, 'Chat is still synchronizing. Please wait a moment and click again.');
        return;
      }
      if (this.occupancy() >= this.maxParticipants) {
        appendLogLine(this.chatLog, 'Current chat is full. Please try again later.');
        this.setPrivateButtonVisible(false);
        if (this.isPublicEnabled()) this.renderChatState('public', 'Current chat is full. Returning to public chat.');
        return;
      }

      const camera = document.getElementById('cameraA');
      camera?.setAttribute('player-info', 'currentPrivateChat', this.privateChatId());
      this.el.setAttribute('isActive', 'true');
      this.el.setAttribute('currentState', 'private');
      if (this.exitButton) this.exitButton.style.display = 'inline-block';
      appendLogLine(this.chatLog, 'Connected. Press X to leave.');
      this.startPrivateChannel();
      this.emitAvailabilityChange();
      if (typeof window.gtag === 'function') window.gtag('event', 'chat_join');
    },

    startPrivateChannel() {
      this.stopPrivateChannel();
      const chatId = this.privateChatId();
      this.privateUnsubscribe = this.chatApi.subscribe(chatId, (_senderId, _dataType, data) => {
        const player = data?.player || {};
        const line = `${this.chatApi.timeString()} ${player.name || 'Stranger'}: ${data?.txt || ''}`;
        this.privateHistory.push({ text: line, color: player.color || '#80c9d4' });
        if (this.el.getAttribute('currentState') === 'private') appendLogLine(this.chatLog, line, player.color);
      });
      this.privateSendHandler = () => {
        const message = this.chatInput?.value.trim() || '';
        if (!message) return;
        const line = `${this.chatApi.timeString()} Me: ${message}`;
        this.privateHistory.push({ text: line, color: '' });
        appendLogLine(this.chatLog, line);
        this.chatApi.send(chatId, { txt: message, player: this.playerInfo() });
        this.chatInput.value = '';
        if (typeof window.gtag === 'function') window.gtag('event', 'chat_private_msg_dispatched');
      };
      this.sendButton?.addEventListener('click', this.privateSendHandler, true);
    },

    stopPrivateChannel() {
      if (this.privateSendHandler) this.sendButton?.removeEventListener('click', this.privateSendHandler, true);
      this.privateSendHandler = null;
      if (this.privateUnsubscribe) this.privateUnsubscribe();
      this.privateUnsubscribe = null;
    },

    handleChatSelected(event) {
      if (this.el.getAttribute('isActive') !== 'true') return;
      const requested = event.detail;
      if (requested === 'public' && !this.isPublicEnabled()) {
        console.warn('[VRodos] Public chat is disabled for this scene.');
        return;
      }
      if (requested !== 'public' && requested !== 'private') return;
      this.el.setAttribute('currentState', requested);
      this.renderChatState(requested);
    },

    renderChatState(state, message = '') {
      this.chatLog.replaceChildren();
      if (state === 'public') {
        this.stopPrivateChannel();
        this.chatApi.setPublicActive(true);
        appendLogLine(this.chatLog, message || 'Connected to public chat.');
        this.chatApi.getPublicHistory().forEach((line) => appendLogLine(this.chatLog, line));
      } else {
        this.chatApi.setPublicActive(false);
        appendLogLine(this.chatLog, `Connected to private chat '${this.el.getAttribute('title') || 'Private'}'.`);
        this.privateHistory.forEach((line) => appendLogLine(this.chatLog, line.text, line.color));
        this.startPrivateChannel();
      }
      this.setTab(state);
    },

    exitPrivateChat() {
      if (this.el.getAttribute('isActive') !== 'true') return;
      this.stopPrivateChannel();
      document.getElementById('cameraA')?.setAttribute('player-info', 'currentPrivateChat', '');
      this.el.setAttribute('isActive', 'false');
      this.el.setAttribute('currentState', this.isPublicEnabled() ? 'public' : 'private');
      if (this.exitButton) this.exitButton.style.display = 'none';
      this.privateHistory = [];
      this.setPrivateButtonVisible(false);
      this.emitAvailabilityChange();

      if (this.isPublicEnabled()) {
        this.renderChatState('public', 'Exited private chat. Connected to public chat.');
      } else {
        const wrapper = document.getElementById('chat-wrapper-el');
        if (wrapper) wrapper.style.visibility = 'hidden';
        this.setTab('private');
      }
    },

    remove() {
      this.stopPrivateChannel();
      const camera = document.getElementById('cameraA');
      const player = camera?.getAttribute('player-info');
      if (player?.currentPrivateChat === this.privateChatId()) {
        camera.setAttribute('player-info', 'currentPrivateChat', '');
      }
      this.cleanup.splice(0).forEach((dispose) => dispose());
    }
  });
})(window, document, AFRAME);
