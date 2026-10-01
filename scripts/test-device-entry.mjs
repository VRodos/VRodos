import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/js/runtime/vrodos_device_entry.js', import.meta.url), 'utf8');
const variants = {
    desktop: 'Master_Client_101.html',
    headset: 'Master_Client_101_headset.html',
    'pc-rendered-vr': 'Master_Client_101_pc-rendered-vr.html'
};

function fixture({ ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform, supported, query = '', hash = '' } = {}) {
    let probes = 0;
    const timers = new Map();
    const redirects = [];
    const window = {
        location: { href: `https://scene.test/clients/index_101.html${query}${hash}`, search: query, hash,
            replace: (url) => redirects.push(url) },
        setTimeout: (callback, delay) => { assert.equal(delay, 3000); timers.set(1, callback); return 1; },
        clearTimeout: (handle) => timers.delete(handle)
    };
    const navigator = { userAgent: ua, userAgentData: platform ? { platform } : undefined };
    if (supported !== undefined) navigator.xr = {
        isSessionSupported(mode) { probes++; assert.equal(mode, 'immersive-vr'); return supported(); },
        requestSession() { throw new Error('Routing must never start an immersive session.'); }
    };
    vm.runInNewContext(source, { window, navigator, URL, URLSearchParams });
    return { api: window.VRODOSDeviceEntry, timers, redirects, probes: () => probes };
}

for (const ua of [
    'Mozilla/5.0 (Linux; Android 12; Quest 3) OculusBrowser/39.0 Mobile VR',
    'Mozilla/5.0 (X11; Linux x86_64; Quest 3) OculusBrowser/39.0 Chrome/136 VR',
    'Mozilla/5.0 (Windows NT 10.0) OculusBrowser/39.0 Safari/537.36'
]) {
    const headset = fixture({ ua, supported: () => Promise.resolve(true) });
    assert.equal(await headset.api.selectTarget(variants), 'headset', 'Quest identity precedes desktop/WebXR checks');
    assert.equal(headset.probes(), 0, 'Quest does not probe PCVR availability');
}
for (const platform of ['Windows', 'macOS', 'Linux']) {
    const pcvr = fixture({ ua: 'Privacy browser', platform, supported: () => Promise.resolve(true) });
    assert.equal(await pcvr.api.selectTarget(variants), 'pc-rendered-vr');
}
for (const supported of [undefined, () => Promise.resolve(false), () => Promise.reject(new Error('denied')), () => { throw new Error('blocked'); }]) {
    assert.equal(await fixture({ supported }).api.selectTarget(variants), 'desktop');
}
assert.equal(await fixture({ ua: 'Mozilla/5.0 (Linux; Android 14) Mobile', supported: () => Promise.resolve(true) }).api.selectTarget(variants), 'desktop');
for (const profile of Object.keys(variants)) {
    const forced = fixture({ ua: 'OculusBrowser/39 Quest 3', query: `?vrodos_target=${profile}` });
    assert.equal(await forced.api.selectTarget(variants), profile);
}
assert.equal(await fixture({ query: '?vrodos_target=arbitrary' }).api.selectTarget(variants), 'desktop');
const individual = fixture({ supported: () => Promise.resolve(true) });
assert.equal(await individual.api.selectTarget({ headset: 'Master_Client_101.html' }), 'headset');
assert.equal(individual.probes(), 0, 'Individual builds bypass detection');

let release;
const slow = fixture({ supported: () => new Promise((resolve) => { release = resolve; }) });
const navigation = slow.api.bootstrap(variants);
slow.timers.get(1)();
await navigation;
assert.equal(slow.redirects.length, 1);
assert.ok(slow.redirects[0].endsWith('Master_Client_101.html'));
release(true);
await Promise.resolve();
assert.equal(slow.redirects.length, 1, 'Late WebXR results cannot redirect after the deadline');
assert.equal(slow.timers.size, 0);

const preserved = fixture({ query: '?vrodos_target=headset&vrodos_quality=low&learner=A%20B', hash: '#arrival' });
await preserved.api.bootstrap(variants);
assert.equal(preserved.redirects[0], 'https://scene.test/clients/Master_Client_101_headset.html?vrodos_target=headset&vrodos_quality=low&learner=A%20B#arrival');

// Scene transitions retain the concrete variant selected at entry and its query context.
const components = {};
vm.runInNewContext(readFileSync(new URL('../assets/js/runtime/components/door_component.js', import.meta.url), 'utf8'), {
    AFRAME: { registerComponent(name, definition) { components[name] = definition; } },
    window: { location: { href: 'https://scene.test/clients/Master_Client_101_headset.html?learner=A%20B&vrodos_target=headset', search: '?learner=A%20B&vrodos_target=headset' },
        VRODOSMaster: { RuntimeResources: { createRegistry: () => ({ listen() {} }) } } },
    URL
});
for (const filename of Object.values(variants)) {
    let link;
    components['door-listener'].init.call({ data: filename, el: { setAttribute(name, value) { assert.equal(name, 'link'); link = value; } } });
    assert.equal(link, `on: click; href: https://scene.test/clients/${filename}?learner=A%20B&vrodos_target=headset`);
}
console.log('Automatic device routing acceptance tests passed.');
