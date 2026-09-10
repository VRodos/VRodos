import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const template = readFileSync(resolve(root, 'templates/pages/vrodos-asset-editor-template.php'), 'utf8');
const script = readFileSync(resolve(root, 'assets/js/editor/vrodos_asset_editor_scripts.js'), 'utf8');
const viewer = readFileSync(resolve(root, 'assets/js/editor/vrodos_AssetViewer_3D_kernel.js'), 'utf8');
const manager = readFileSync(resolve(root, 'includes/class-vrodos-asset-cpt-manager.php'), 'utf8');
const shared = readFileSync(resolve(root, 'includes/asset-cpt/trait-vrodos-asset-cpt-shared.php'), 'utf8');
const submission = readFileSync(resolve(root, 'includes/asset-cpt/trait-vrodos-asset-cpt-submission.php'), 'utf8');

for (const stage of ['upload', 'validate', 'record', 'media', 'finalize']) {
    assert.match(template, new RegExp(`data-save-stage=["']${stage}["']`), `save dialog must render the ${stage} stage`);
}
assert.match(template, /assetSaveProgressElapsed/, 'save dialog must expose elapsed time');
assert.doesNotMatch(template, /assetForm\.submit\(\)/, 'final asset saves must not abandon progress through native form submission');

assert.match(script, /vrodos_submit_asset_form_with_progress/, 'asset editor must submit the final save asynchronously');
assert.match(script, /assetSaveOperationId/, 'asset save request and progress polling must share an operation id');
assert.match(script, /request\.upload\.addEventListener\('progress'/, 'remaining media uploads must report real byte progress');
assert.match(script, /vrodos_asset_save_progress/, 'asset editor must poll authenticated server progress');
assert.match(script, /status !== 'waiting'/, 'waiting polls must not replace meaningful upload feedback');
assert.match(script, /!\['complete', 'failed'\]\.includes\(latestProgress\.status\)/, 'HTTP completion must not be mistaken for a confirmed asset save');

for (const control of ['assetPreviewQualityBadge', 'assetPreviewRetryBtn', 'assetPreviewFullSourceBtn']) {
    assert.match(template, new RegExp(`id=["']${control}["']`), `asset editor must render ${control}`);
}
assert.match(submission, /resolve_editor_glb_load/, 'asset editor bootstrap must use the shared authorized GLB resolver');
assert.match(script, /vrodos_retry_editor_preview_action/, 'failed editor previews must expose an authenticated retry action');
assert.match(script, /state\.canonicalUrl/, 'full source quality must remain an explicit action');
assert.match(script, /optimization\.familyStatus \|\| optimization\.status/, 'post-import polling must remain active across the full ordered derivative family');
assert.match(script, /optimization\.familyPercent \?\? optimization\.percent/, 'post-import progress must report the full derivative family rather than stopping after High');
assert.match(script, /optimization\.activeMessage \|\| optimization\.message/, 'post-import status must describe the currently active derivative stage');
assert.match(viewer, /this\.previewProgressOverlay = previewProgressLabel/, 'the loading overlay must stay separate from its status label');
assert.match(viewer, /Decoding model/, 'asset preview progress must distinguish decoding from downloading');
assert.match(viewer, /Preparing first frame/, 'asset preview progress must remain visible through first-frame preparation');
assert.match(viewer, /this\.screenshotButton\.disabled = !this\.previewReady/, 'screenshot capture must wait until the preview is ready');
assert.match(viewer, /loadGeneration !== this\.loadGeneration/, 'late responses from replaced preview requests must be discarded');

assert.match(manager, /wp_ajax_vrodos_asset_save_progress/, 'asset save progress endpoint must be registered for authenticated users');
assert.match(shared, /check_ajax_referer\( 'post_nonce', 'nonce', false \)/, 'asset save progress endpoint must verify the editor nonce');
assert.match(shared, /get_current_user_id\(\).*hash\( 'sha256', \$operation_id \)/s, 'progress records must be scoped to the current user and opaque operation id');
for (const stage of ['validate', 'record', 'media', 'finalize', 'complete']) {
    assert.match(submission, new RegExp(`update_frontend_asset_save_progress\\([\\s\\S]*?'${stage}'`), `server save flow must publish the ${stage} milestone`);
}

console.log('Asset editor save progress tests passed.');
