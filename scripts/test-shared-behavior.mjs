import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
let queryParses = 0;
class CountedSearchParams extends URLSearchParams {
    constructor(search) {
        super(search);
        queryParses++;
    }
}
const context = vm.createContext({ console, URLSearchParams: CountedSearchParams, TextDecoder, Uint8Array });
context.window = context;
context.document = { createElement: () => ({ set innerHTML(value) { this.value = value; }, get value() { return this._value; }, set value(value) { this._value = value; } }) };
context.atob = (value) => Buffer.from(value, 'base64').toString('binary');
context.location = { search: '?flag=1' };
for (const file of ['assets/js/editor/vrodos_namespace.js', 'assets/js/editor/ui/vrodos_cefr_badges.js', 'assets/js/runtime/assessment/assessment-utils.js', 'assets/js/runtime/master/vrodos_runtime_settings_helpers.js', 'assets/js/runtime/master/vrodos_runtime_resources.js']) {
    vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context, { filename: file });
}
const plain = (value) => JSON.parse(JSON.stringify(value));
const decodeDisplayText = context.VRODOS.utils.decodeDisplayText;
assert.equal(decodeDisplayText('UC1 &#8211; Tomb of kings'), 'UC1 – Tomb of kings');
assert.equal(decodeDisplayText('UC1 &#8212; &#8220;Tomb of kings&#8221;&#8230;'), 'UC1 — “Tomb of kings”…');
assert.equal(decodeDisplayText('UC1 &#60;stone&#62;'), 'UC1 &#60;stone&#62;');
for (const fixture of JSON.parse(readFileSync(resolve(root, 'scripts/fixtures/cefr-levels.json'), 'utf8'))) {
    assert.deepEqual(plain(context.VRODOS.utils.normalizeCefrLevels(fixture.input)), fixture.tokens);
    assert.deepEqual(plain(context.VRODOS.ui.badges.resolveCefrLevels(fixture.input, false)), fixture.levels);
}
const settings = context.VRODOSMaster.RuntimeSettings;
assert.equal(settings.debugFlag('flag', 'flag'), true);
const initialQueryParses = queryParses;
for (let i = 0; i < 1000; i++) settings.queryValue('missing');
assert.equal(queryParses, initialQueryParses, 'Stable frame-loop queries must reuse the parsed URL.');
context.location.search = '';
assert.equal(settings.debugFlag('flag', 'flag'), false);
assert.equal(queryParses, initialQueryParses + 1, 'Changing the URL must invalidate the parsed query.');
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
