import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const context = vm.createContext({ console, URLSearchParams, TextDecoder, Uint8Array });
context.window = context;
context.document = { createElement: () => ({ set innerHTML(value) { this.value = value; }, get value() { return this._value; }, set value(value) { this._value = value; } }) };
context.atob = (value) => Buffer.from(value, 'base64').toString('binary');
context.location = { search: '?flag=1' };
for (const file of ['assets/js/editor/vrodos_namespace.js', 'assets/js/editor/ui/vrodos_cefr_badges.js', 'assets/js/runtime/assessment/assessment-utils.js', 'assets/js/runtime/master/vrodos_runtime_settings_helpers.js', 'assets/js/runtime/master/vrodos_runtime_resources.js']) {
    vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context, { filename: file });
}
const plain = (value) => JSON.parse(JSON.stringify(value));
for (const fixture of JSON.parse(readFileSync(resolve(root, 'scripts/fixtures/cefr-levels.json'), 'utf8'))) {
    assert.deepEqual(plain(context.VRODOS.utils.normalizeCefrLevels(fixture.input)), fixture.tokens);
    assert.deepEqual(plain(context.VRODOS.ui.badges.resolveCefrLevels(fixture.input, false)), fixture.levels);
}
const settings = context.VRODOSMaster.RuntimeSettings;
assert.equal(settings.debugFlag('flag', 'flag'), true);
context.location.search = '';
assert.equal(settings.debugFlag('flag', 'flag'), false);
context.VRODOS_DEBUG = { flag: true };
assert.equal(settings.debugFlag('flag', 'flag'), true);
context.VRODOS_DEBUG.flag = false;
assert.equal(settings.debugFlag('flag', 'flag'), false);
const assessment = context.VRodosImmerseAssessment;
const state = { items: [{ id: 'q1', prompt: 'Ερώτηση', answers: ['Ναι', 'Όχι'], correctIndex: 0 }], selectedByIndex: {} };
assert.equal(assessment.gradeResponses(assessment.buildQuestionAnswers(state), 'isCorrect', true), null);
state.selectedByIndex[0] = 0;
assert.equal(assessment.gradeResponses(assessment.buildQuestionAnswers(state), 'isCorrect', true), true);
state.selectedByIndex[0] = 1;
assert.equal(assessment.gradeResponses(assessment.buildQuestionAnswers(state), 'isCorrect', true), false);
assert.deepEqual(plain(state.items[0].answers), ['Ναι', 'Όχι']);
console.log('Shared CEFR, debug flags, and assessment response tests passed.');

let disposals = 0;
const material = { dispose() { disposals++; } };
const geometry = { dispose() { disposals++; } };
const registry = context.VRODOSMaster.RuntimeResources.createRegistry();
registry.track({ geometry, material });
registry.track(material);
registry.track(geometry);
registry.track([material, geometry]);
registry.disposeAll();
registry.disposeAll();
assert.equal(disposals, 2, 'Shared resources must be disposed exactly once per registry teardown.');
