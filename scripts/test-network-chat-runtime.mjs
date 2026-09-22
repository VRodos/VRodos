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

// Membership changes drive every POI without a polling tick or DOM recount.
let occupancyDefinition;
const occupancyContext = vm.createContext({ window, document, console,
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  AFRAME: { registerSystem: (_name, definition) => { occupancyDefinition = definition; } }
});
vm.runInContext(readFileSync(resolve(root, 'assets/js/runtime/master/vrodos_runtime_resources.js'), 'utf8'), occupancyContext);
vm.runInContext(readFileSync(resolve(root, 'assets/js/runtime/components/vrodos_chat_occupancy.system.js'), 'utf8'), occupancyContext);
const scene = new EventTargetStub();
let members = [];
scene.querySelectorAll = () => members.map(player => player.el);
const occupancy = Object.assign(Object.create(occupancyDefinition), { el: scene });
occupancy.init();
const events = [];
const poi = { emit: (_name, state) => events.push(state) };
occupancy.registerChat(poi, 'room', 2);
const player = (networkId, owner) => {
  const el = new ElementStub({ networked: { networkId, owner } });
  el.sceneEl = scene;
  const component = { el, data: { currentPrivateChat: 'room' } };
  el.components = { 'player-info': component };
  members.push(component);
  return component;
};
const local = player('local', 'me'), remote = player('remote', 'peer');
occupancy.updatePlayer(local); occupancy.updatePlayer(remote); occupancy.updatePlayer(remote);
assert.equal(occupancy.occupancy('room'), 2, 'local and remote membership are counted once');
assert.deepEqual(events, ['available', 'available', 'full']);
remote.data.currentPrivateChat = 'other'; occupancy.updatePlayer(remote);
assert.equal(occupancy.occupancy('room'), 1); assert.equal(occupancy.occupancy('other'), 1);
document.body.dispatchEvent({ type: 'entityRemoved', detail: {} });
assert.equal(occupancy.occupancy('room'), 1, 'unidentified removal must not remove local membership');
document.body.dispatchEvent({ type: 'clientDisconnected', detail: { clientId: 'peer' } });
assert.equal(occupancy.occupancy('other'), 0);
members = [local]; occupancy.reconcile();
assert.equal(occupancy.occupancy('room'), 1);
assert.equal(occupancy.normalizeCapacity(-1), Number.MAX_SAFE_INTEGER);
assert.equal(occupancy.normalizeCapacity(0), 2);
occupancy.unregisterPlayer(local); occupancy.unregisterPlayer(local);
assert.equal(occupancy.occupancy('room'), 0);
occupancy.unregisterChat(poi); occupancy.remove();
assert.equal(occupancy.players.size, 0); assert.equal(occupancy.chats.size, 0);
assert.equal([...scene.listeners.values()].some(listeners => listeners.size), false);
console.log('Network chat runtime and shared occupancy tests passed.');
