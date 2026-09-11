import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'espree';

const manifest = JSON.parse(readFileSync(new URL('../assets/runtime-build-manifest.json', import.meta.url), 'utf8'));
const files = manifest.chunks['scene-components'].sourceFiles;
const overlayIndex = files.indexOf('assets/js/runtime/vrodos_runtime_overlay.js');
assert(overlayIndex >= 0 && overlayIndex < files.indexOf('assets/js/runtime/assessment/assessment-overlay-runtime.js'),
    'The required shared overlay must load before assessment interaction code.');

const source = readFileSync(new URL('../assets/js/runtime/vrodos_runtime_overlay.js', import.meta.url), 'utf8');
const ast = parse(source, { ecmaVersion: 'latest', range: true });
const nodes = [];
function walk(node) {
    if (!node || typeof node !== 'object') return;
    nodes.push(node);
    for (const [key, value] of Object.entries(node)) {
        if (key === 'range') continue;
        if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === 'object') walk(value);
    }
}
walk(ast);
const helper = nodes.find(n => n.type === 'FunctionDeclaration' && n.id.name === 'setAttributeEnabled');
const lock = nodes.find(n => n.type === 'Property' && n.key.name === 'lockSceneInteraction');
function element() {
    const calls = [];
    const components = Object.fromEntries(['custom-movement', 'wasd-controls', 'movement-controls', 'look-controls'].map(name => [name, {
        play() { calls.push(`${name}:play`); }, pause() { calls.push(`${name}:pause`); }
    }]));
    return { calls, components, style: { cursor: 'grabbing' }, classList: { remove() {} },
        hasAttribute: () => false, setAttribute(name, value) { calls.push(`${name}:${value}`); } };
}
const player = element(), camera = element(), canvas = element();
let immersive = false;
const context = vm.createContext({
    document: { getElementById: () => player, body: element(), documentElement: element() },
    queryCamera: () => camera, queryScene: () => ({ canvas }), isImmersiveVrActive: () => immersive
});
vm.runInContext(source.slice(helper.start, helper.end), context);
const api = { interactionLocked: false, lockSceneInteraction: vm.runInContext(`(${source.slice(lock.value.start, lock.value.end)})`, context) };
context.window = { VRODOSRuntimeOverlay: api };
const assessment = readFileSync(new URL('../assets/js/runtime/assessment/assessment-overlay-runtime.js', import.meta.url), 'utf8');
const assessmentAst = parse(assessment, { ecmaVersion: 'latest' });
nodes.length = 0;
walk(assessmentAst);
const delegate = nodes.find(n => n.type === 'FunctionDeclaration' && n.id.name === 'setAssessmentSceneInteractionLocked');
vm.runInContext(assessment.slice(delegate.start, delegate.end), context);
context.setAssessmentSceneInteractionLocked(true);
const count = player.calls.length;
context.setAssessmentSceneInteractionLocked(true);
assert.equal(player.calls.length, count, 'Repeated opens must not pause components twice.');
assert(player.calls.includes('movement-controls:pause'));
assert(camera.calls.includes('look-controls:pause'));
context.setAssessmentSceneInteractionLocked(false);
assert.equal(canvas.style.cursor, '');
assert(player.calls.includes('custom-movement:play'));
assert(!player.calls.some(c => c.startsWith('custom-movement:enabled')), 'Custom movement uses its lifecycle, not an invented enabled attribute.');
const released = player.calls.length;
context.setAssessmentSceneInteractionLocked(false);
assert.equal(player.calls.length, released, 'Repeated close must be idempotent.');
player.calls.length = camera.calls.length = 0;
immersive = true;
api.lockSceneInteraction(true, { preserveLookInVr: true });
api.lockSceneInteraction(false, { preserveLookInVr: true });
assert(!camera.calls.some(c => c.startsWith('look-controls:')), 'VR panels must preserve HMD look tracking.');
assert(player.calls.includes('custom-movement:pause') && player.calls.includes('custom-movement:play'));
console.log('Shared overlay interaction lifecycle tests passed.');
