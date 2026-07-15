import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

class EventTargetStub {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) || new Set();
    handlers.add(handler);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type, handler) {
    this.listeners.get(type)?.delete(handler);
  }

  dispatchEvent(event) {
    this.listeners.get(event.type)?.forEach((handler) => handler(event));
  }
}

class ElementStub extends EventTargetStub {
  constructor(attributes = {}) {
    super();
    this.attributes = attributes;
    this.children = [];
    this.style = {};
    this.value = '';
    this.textContent = '';
    this.classList = { add() {}, remove() {}, toggle() {} };
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }
}

const elements = new Map([
  ['aframe-scene-container', new ElementStub({ 'scene-settings': { public_chat: '1' } })],
  ['cameraA', new ElementStub({ 'player-info': { name: 'Alice', color: '#123456' } })],
  ['chatInput', new ElementStub()],
  ['chat-messages', new ElementStub()],
  ['send-msg-chat-btn', new ElementStub()],
  ['expand-chat-btn', new ElementStub()],
  ['minimize-chat-btn', new ElementStub()],
  ['chat-wrapper-el', new ElementStub()]
]);
const document = new EventTargetStub();
document.readyState = 'complete';
document.body = new EventTargetStub();
document.getElementById = (id) => elements.get(id) || null;
document.querySelector = () => elements.get('aframe-scene-container');
document.createElement = () => new ElementStub();

const subscriptions = new Map();
const broadcasts = [];
const connection = {
  subscribeToDataChannel(channel, handler) {
    subscriptions.set(channel, handler);
  },
  unsubscribeToDataChannel(channel) {
    subscriptions.delete(channel);
  },
  broadcastData(channel, payload) {
    broadcasts.push({ channel, payload });
  }
};
const window = {
  NAF: { connection },
  setTimeout,
  clearTimeout
};

const root = resolve(import.meta.dirname, '..');
const source = readFileSync(resolve(root, 'assets/js/runtime/components/chat_component.js'), 'utf8');
vm.runInNewContext(source, { window, document, console, Map, Set, Date, Object, Boolean, String });

const chat = window.VRODOSChat;
assert.ok(chat);
assert.equal(Object.isFrozen(chat), true);
assert.equal(chat.isPublicEnabled(), true);
assert.ok(subscriptions.has('chat'));

elements.get('chatInput').value = 'hello';
assert.equal(chat.sendPublicMessage(), true);
assert.deepEqual(JSON.parse(JSON.stringify(broadcasts.at(-1))), {
  channel: 'chat',
  payload: { txt: 'hello', player: { name: 'Alice', color: '#123456' } }
});

let received = 0;
const unsubscribe = chat.subscribe('private-room', () => {
  received += 1;
});
subscriptions.get('private-room')('peer', 'private-room', { txt: 'hi' }, null);
assert.equal(received, 1);
unsubscribe();
assert.equal(subscriptions.has('private-room'), false);

chat.subscribe('dispose-room', () => undefined);
assert.ok(subscriptions.has('dispose-room'));
chat.dispose();
assert.equal(subscriptions.size, 0);

console.log('Network chat runtime tests passed.');
