(function (window, document) {
  'use strict';

  const channelSubscribers = new Map();
  const attachedChannels = new Set();
  const publicHistory = [];
  const disposers = [];
  let publicChatActive = true;
  let mounted = false;
  let disposed = false;

  function timeString() {
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `[${hours}:${minutes}:${seconds}]`;
  }

  function sceneSettings() {
    const scene = document.getElementById('aframe-scene-container') || document.querySelector('a-scene');
    return scene ? scene.getAttribute('scene-settings') : null;
  }

  function isPublicEnabled() {
    const settings = sceneSettings();
    return Boolean(settings && String(settings.public_chat) === '1');
  }

  function playerInfo() {
    const camera = document.getElementById('cameraA');
    return camera ? camera.getAttribute('player-info') : null;
  }

  function appendLine(log, text, color) {
    if (!log) return;
    const line = document.createElement('span');
    line.textContent = text;
    if (color) line.style.color = color;
    log.appendChild(line);
    log.appendChild(document.createElement('br'));
  }

  function networkConnection() {
    return window.NAF && window.NAF.connection ? window.NAF.connection : null;
  }

  function attachChannel(channel) {
    if (disposed || attachedChannels.has(channel)) return;
    const connection = networkConnection();
    if (!connection || typeof connection.subscribeToDataChannel !== 'function') {
      const timer = window.setTimeout(() => attachChannel(channel), 100);
      disposers.push(() => window.clearTimeout(timer));
      return;
    }

    connection.subscribeToDataChannel(channel, (senderId, dataType, data, targetId) => {
      const subscribers = channelSubscribers.get(channel);
      if (!subscribers) return;
      subscribers.forEach((handler) => handler(senderId, dataType, data, targetId));
    });
    attachedChannels.add(channel);
  }

  function subscribe(channel, handler) {
    if (!channel || typeof handler !== 'function') return () => undefined;
    const subscribers = channelSubscribers.get(channel) || new Set();
    subscribers.add(handler);
    channelSubscribers.set(channel, subscribers);
    attachChannel(channel);
    return () => unsubscribe(channel, handler);
  }

  function unsubscribe(channel, handler) {
    const subscribers = channelSubscribers.get(channel);
    if (subscribers && handler) subscribers.delete(handler);
    if (handler && subscribers && subscribers.size > 0) return;

    channelSubscribers.delete(channel);
    if (!attachedChannels.has(channel)) return;
    const connection = networkConnection();
    if (connection && typeof connection.unsubscribeToDataChannel === 'function') {
      connection.unsubscribeToDataChannel(channel);
    }
    attachedChannels.delete(channel);
  }

  function send(channel, payload) {
    const connection = networkConnection();
    if (!connection || typeof connection.broadcastData !== 'function') return false;
    connection.broadcastData(channel, payload);
    return true;
  }

  function sendPublicMessage() {
    const input = document.getElementById('chatInput');
    const log = document.getElementById('chat-messages');
    const message = input ? input.value.trim() : '';
    if (!isPublicEnabled() || !publicChatActive || !input || !log || !message) return false;

    const stamp = timeString();
    const historyLine = `${stamp} Me: ${message}`;
    appendLine(log, historyLine);
    publicHistory.push(historyLine);
    send('chat', { txt: message, player: playerInfo() });
    if (typeof window.gtag === 'function') window.gtag('event', 'chat_public_msg_dispatched');
    input.value = '';
    return true;
  }

  function bind(element, eventName, handler, options) {
    if (!element) return;
    element.addEventListener(eventName, handler, options);
    disposers.push(() => element.removeEventListener(eventName, handler, options));
  }

  function mount() {
    if (mounted || disposed) return;
    mounted = true;
    publicChatActive = isPublicEnabled();

    if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.applyChatTabs === 'function') {
      window.VRODOSMasterUI.applyChatTabs(publicChatActive ? 'public' : 'private');
    }

    bind(document.getElementById('send-msg-chat-btn'), 'click', sendPublicMessage);
    bind(document.getElementById('chatInput'), 'keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      sendPublicMessage();
    });

    subscribe('chat', (_senderId, _dataType, data) => {
      const stamp = timeString();
      const remotePlayer = data && data.player ? data.player : {};
      const historyLine = `${stamp} ${remotePlayer.name || 'Stranger'}: ${data?.txt || ''}`;
      if (publicChatActive) appendLine(document.getElementById('chat-messages'), historyLine, remotePlayer.color || '#80c9d4');
      publicHistory.push(historyLine);
    });

    let expanded = false;
    let minimized = false;
    bind(document.getElementById('expand-chat-btn'), 'click', () => {
      const wrapper = document.getElementById('chat-wrapper-el');
      if (!wrapper) return;
      if (minimized) wrapper.classList.remove('ChatDrawerStyleMinimized');
      minimized = false;
      expanded = !expanded;
      wrapper.classList.toggle('ChatDrawerStyleExpanded', expanded);
    });
    bind(document.getElementById('minimize-chat-btn'), 'click', () => {
      const wrapper = document.getElementById('chat-wrapper-el');
      if (!wrapper) return;
      minimized = !minimized;
      expanded = false;
      wrapper.classList.toggle('ChatDrawerStyleMinimized', minimized);
      wrapper.classList.remove('ChatDrawerStyleExpanded');
    });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    disposers.splice(0).forEach((remove) => remove());
    Array.from(attachedChannels).forEach((channel) => unsubscribe(channel));
    channelSubscribers.clear();
    mounted = false;
  }

  window.VRODOSChat = Object.freeze({
    mount,
    send,
    subscribe,
    unsubscribe,
    dispose,
    sendPublicMessage,
    timeString,
    isPublicEnabled,
    isPublicActive: () => publicChatActive,
    setPublicActive: (active) => {
      publicChatActive = Boolean(active);
    },
    getPublicHistory: () => publicHistory.slice()
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})(window, document);
