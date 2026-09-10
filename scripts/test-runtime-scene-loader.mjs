import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const template = readFileSync(resolve(root, 'templates/runtime/aframe/Master_Client_prototype.html'), 'utf8');
const component = readFileSync(resolve(root, 'assets/js/runtime/master/components/vrodos_scene_loader.component.js'), 'utf8');
const renderer = readFileSync(resolve(root, 'includes/class-vrodos-compiler-aframe-entity-renderer.php'), 'utf8');

assert.match(template, /<div id="vrodos-scene-loader-overlay"/, 'the loader must exist before A-Frame scene initialization');
assert.ok(template.indexOf('vrodos-scene-loader-overlay') < template.indexOf('<a-scene'), 'the static loader must precede the scene');
assert.match(template, /loading-screen="enabled: false;"/, 'A-Frame loading dots must be disabled');
assert.match(template, /Downloading 3D assets/, 'the early loader must display aggregate byte progress');
assert.match(template, /Downloading 3D assets \\u2014/, 'the inline loader must use an ASCII-safe JavaScript escape for its em dash');
assert.match(template, /% \\u00b7 /, 'the inline loader must use an ASCII-safe JavaScript escape for its middle dot');
assert.doesNotMatch(template, /Downloading 3D assets —/, 'the inline loader must not expose Unicode punctuation to PHP DOM serialization');
assert.match(template, /loadedBytes.*totalBytes/s, 'the early loader must aggregate loaded and known bytes');
assert.doesNotMatch(component, /createElement\('div'\).*vrodos-scene-loader-overlay/s, 'the component must not create a second overlay');
assert.match(component, /Decoding 3D assets/, 'the loader must report decode progress');
assert.match(component, /Preparing navigation/, 'the loader must wait for navigation preparation');
assert.match(component, /Preparing lighting and sky/, 'the loader must report rendering-system preparation');
assert.match(component, /showCriticalFailure/, 'critical failures must keep an actionable loader visible');
assert.match(renderer, /data-vrodos-critical/, 'critical A-Frame assets must be annotated');
assert.match(renderer, /data-vrodos-asset-size-bytes/, 'critical A-Frame assets must expose known byte sizes');

console.log('Runtime scene loader tests passed.');
