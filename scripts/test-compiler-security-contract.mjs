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
assert.match(compileAjax, /runtime_contract_invalid/);

const compileRequest = read("assets/js/editor/ajax/vrodos_request_compile.js");
assert.match(compileRequest, /method: 'POST'/);
assert.match(compileRequest, /compileNonce/);

const compilerManager = read("includes/class-vrodos-compiler-manager.php");
const targetAssembler = read("includes/class-vrodos-compiler-target-assembler.php");
const compilerTypes = read("includes/class-vrodos-compiler-types.php");
assert.doesNotMatch(compilerManager, /function compile_aframe\s*\(/);
assert.doesNotMatch(compilerManager, /function nodeJSpath\s*\(/);
assert.doesNotMatch(compilerManager, /function normalize_url\s*\(/);
assert.doesNotMatch(compilerManager, /RUNTIME_MODE_(?:NETWORKED|SINGLE_PLAYER)/);
assert.doesNotMatch(compilerTypes, /function to_legacy_payload\s*\(/);
assert.match(compilerManager, /target_assembler->render/);
assert.doesNotMatch(compilerManager, /function create(?:Master|Simple|Index)/);
assert.match(targetAssembler, /VRodos_Runtime_Target_Plan::MASTER/);

const projectAjax = read("includes/ajax/class-vrodos-project-ajax.php");
assert.match(projectAjax, /VRodos_Runtime_URL_Resolver/);
assert.doesNotMatch(projectAjax, /nodeJSpath/);

const masterTemplate = read("templates/runtime/aframe/Master_Client_prototype.html");
const runtimeBootstrap = read("assets/js/runtime/master/vrodos_master_bootstrap.js");
const runtimeBundle = read("assets/js/runtime/master/lib/vrodos-runtime-core.bundle.js");
for (const source of [masterTemplate, runtimeBootstrap, runtimeBundle]) {
    assert.doesNotMatch(source, /mvnode_token|mvnode_url|node-token-input|node-url-input|Authorization\s*[:=]|Bearer\s+/i);
}
assert.doesNotMatch(masterTemplate, /networked-scene=|networked-audio-source|networked-video-source/);
assert.doesNotMatch(masterTemplate, /https:\/\/unpkg\.com|https:\/\/cdn\.jsdelivr\.net/);

const simpleTemplate = read("templates/runtime/aframe/Simple_Client_prototype.html");
assert.match(simpleTemplate, /\/socket\.io\/socket\.io\.js/);
assert.doesNotMatch(simpleTemplate, /cdnjs\.cloudflare\.com|unpkg\.com/);

const runtimeManifest = JSON.parse(read("assets/runtime-build-manifest.json"));
assert.equal(runtimeManifest.schemaVersion, 2);
assert.ok(runtimeManifest.chunks["networked-components"].sourceFiles.includes("assets/js/runtime/components/chat_component.js"));
const chatRuntime = read("assets/js/runtime/components/chat_component.js");
const chatPoiRuntime = read("assets/js/runtime/components/chat_poi_component.js");
assert.match(chatRuntime, /window\.VRODOSChat = Object\.freeze/);
assert.match(chatPoiRuntime, /window\.VRODOSChat/);
assert.doesNotMatch(chatPoiRuntime, /NAF\.connection\.entities/);
assert.doesNotMatch(chatPoiRuntime, /\beasyrtc\b/);

const networkService = read("services/vrodos-network-runtime/server/easyrtc-server.js");
assert.match(networkService, /app\.get\("\/healthz"/);
assert.match(networkService, /path\.resolve\(__dirname, "keys\.json"\)/);
assert.doesNotMatch(networkService, /services", "networked-aframe", "server", "keys\.json"/);

const mediaVerseAjax = read("includes/ajax/class-vrodos-mediaverse-ajax.php");
assert.match(mediaVerseAjax, /vrodos_mediaverse_upload_session/);
assert.match(mediaVerseAjax, /vrodos_mediaverse_upload_recording/);
assert.match(mediaVerseAjax, /check_ajax_referer/);
assert.match(mediaVerseAjax, /current_user_can\( 'edit_post', \$project_id \)/);
assert.match(mediaVerseAjax, /wp_safe_remote_post/);
assert.match(mediaVerseAjax, /wp_delete_file\( \$tmp_name \)/);

console.log("Compiler security contract tests passed.");
