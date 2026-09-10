import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const template = readFileSync(resolve(root, 'templates/pages/vrodos-asset-editor-template.php'), 'utf8');
const script = readFileSync(resolve(root, 'assets/js/editor/vrodos_asset_editor_scripts.js'), 'utf8');
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

assert.match(manager, /wp_ajax_vrodos_asset_save_progress/, 'asset save progress endpoint must be registered for authenticated users');
assert.match(shared, /check_ajax_referer\( 'post_nonce', 'nonce', false \)/, 'asset save progress endpoint must verify the editor nonce');
assert.match(shared, /get_current_user_id\(\).*hash\( 'sha256', \$operation_id \)/s, 'progress records must be scoped to the current user and opaque operation id');
for (const stage of ['validate', 'record', 'media', 'finalize', 'complete']) {
    assert.match(submission, new RegExp(`update_frontend_asset_save_progress\\([\\s\\S]*?'${stage}'`), `server save flow must publish the ${stage} milestone`);
}

console.log('Asset editor save progress tests passed.');
