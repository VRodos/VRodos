import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(import.meta.dirname, "..");
const read = (relativePath) => readFileSync(resolve(root, relativePath), "utf8");

const compileAjax = read("includes/ajax/class-vrodos-scene-ajax.php");
assert.match(compileAjax, /check_ajax_referer\( 'vrodos_compile_scene', 'nonce', false \)/);
assert.match(compileAjax, /current_user_can\( 'edit_post', \$project_id \)/);
assert.match(compileAjax, /scene_project_mismatch/);
assert.match(compileAjax, /\$_POST\['runtimeMode'\]/);
assert.match(compileAjax, /\$_POST\['vrRuntimeProfile'\]/);
assert.doesNotMatch(compileAjax, /\$_GET\[/);

const compileRequest = read("assets/js/editor/ajax/vrodos_request_compile.js");
assert.match(compileRequest, /method: 'POST'/);
assert.match(compileRequest, /compileNonce/);

const masterTemplate = read("templates/runtime/aframe/Master_Client_prototype.html");
const runtimeBootstrap = read("assets/js/runtime/master/vrodos_master_bootstrap.js");
const runtimeBundle = read("assets/js/runtime/master/lib/vrodos-runtime-core.bundle.js");
for (const source of [masterTemplate, runtimeBootstrap, runtimeBundle]) {
    assert.doesNotMatch(source, /mvnode_token|mvnode_url|node-token-input|node-url-input|Authorization\s*[:=]|Bearer\s+/i);
}
assert.doesNotMatch(masterTemplate, /networked-scene=|networked-audio-source|networked-video-source/);

const mediaVerseAjax = read("includes/ajax/class-vrodos-mediaverse-ajax.php");
assert.match(mediaVerseAjax, /vrodos_mediaverse_upload_session/);
assert.match(mediaVerseAjax, /vrodos_mediaverse_upload_recording/);
assert.match(mediaVerseAjax, /check_ajax_referer/);
assert.match(mediaVerseAjax, /current_user_can\( 'edit_post', \$project_id \)/);
assert.match(mediaVerseAjax, /wp_safe_remote_post/);
assert.match(mediaVerseAjax, /wp_delete_file\( \$tmp_name \)/);

console.log("Compiler security contract tests passed.");
