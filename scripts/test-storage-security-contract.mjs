import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(root, relative), "utf8");

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Storage security contract failed: ${message}`);
    }
}

function sourceFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) return sourceFiles(absolute);
        return /\.(?:php|js)$/i.test(entry.name) ? [absolute] : [];
    });
}

const source = [
	...sourceFiles(path.join(root, "includes")),
	...sourceFiles(path.join(root, "assets", "js")),
	path.join(root, "VRodos.php")
];
const combined = source.map((file) => readFileSync(file, "utf8")).join("\n");
assert(!/add_filter\s*\(\s*["'](?:upload_dir|sanitize_file_name)["']/.test(combined), "global upload path filters are forbidden");
assert(!/\$_REQUEST\s*\[\s*["']post_id["']\s*\]/.test(combined), "request-driven post_id routing is forbidden");
assert(!/wp_ajax_nopriv_[^"']*(?:glb|source)/i.test(combined), "logged-out source delivery is forbidden");

for (const mutationFile of [
	"includes/class-vrodos-upload-manager.php",
	"includes/ajax/class-vrodos-scene-ajax.php",
	"includes/ajax/class-vrodos-asset-ajax.php",
	"includes/ajax/class-vrodos-project-ajax.php",
	"includes/asset-optimization/trait-vrodos-asset-optimization-derivatives.php",
	"includes/class-vrodos-install-manager.php"
]) {
	assert(!read(mutationFile).includes("wp_delete_attachment("), `${mutationFile} must use ownership-checked storage deletion`);
}

const storage = read("includes/class-vrodos-storage-manager.php");
assert(storage.includes("VRODOS_PRIVATE_STORAGE_DIR"), "private root override is supported");
assert(storage.includes("'site-' . get_current_blog_id()"), "private storage is site-separated");
assert(storage.includes("wp_ajax_vrodos_private_media"), "authenticated private delivery is registered");
assert(storage.includes("HTTP_RANGE") && storage.includes("REQUEST_METHOD") && storage.includes("'HEAD'"), "range and HEAD delivery are implemented");
const privateDelivery = storage.slice(storage.indexOf("public static function serve_private_media"), storage.indexOf("private static function private_file_etag"));
assert(privateDelivery.indexOf("current_user_can_access_owner") < privateDelivery.indexOf("stream_private_path"), "private delivery authorizes ownership before evaluating cache validators");
const privateStream = storage.slice(storage.indexOf("private static function stream_private_path"), storage.indexOf("private static function serve_private_staging_file"));
assert(privateStream.indexOf("while ( ob_get_level() > 0 )") < privateStream.indexOf("header( 'Content-Length:"), "private delivery clears output buffers before declaring the binary response length");
assert(privateStream.includes("Cache-Control: private, max-age=0, must-revalidate"), "normal private attachments use authenticated cache revalidation");
assert(privateStream.includes("header_remove( 'Expires' )") && privateStream.includes("header_remove( 'Pragma' )"), "private revalidation removes conflicting legacy no-cache headers");
assert(privateStream.includes("header( 'ETag: '") && privateStream.includes("header( 'Last-Modified: '"), "normal private attachments emit ETag and Last-Modified validators");
assert(privateStream.includes("! $has_range") && privateStream.includes("status_header( 304 )"), "only full private attachment responses may return 304");
assert(privateStream.includes("status_header( 206 )"), "private attachment ranges remain partial responses");
assert(privateStream.includes("Cache-Control: private, no-store"), "staging responses remain non-storeable");
const privateStaging = storage.slice(storage.indexOf("private static function serve_private_staging_file"), storage.indexOf("public static function delete_private_attachment_file"));
assert(/stream_private_path\([^;]+false\s*\)/s.test(privateStaging), "staging delivery explicitly disables revalidation");
assert(storage.includes("replace_attachment_references"), "attachment replacement uses a centralized metadata transaction");
assert(storage.includes("insert_with_markers( $htaccess, 'VRodos Published Cache'"), "the Apache cache policy uses an idempotent marked block");
assert(storage.includes('public, max-age=31536000, immutable'), "published content-addressed media receives an explicit immutable cache lifetime");
assert(storage.includes('no-store, no-cache, must-revalidate'), "published client HTML remains uncached");
const privatePromotion = storage.slice(
	storage.indexOf("public static function promote_private_temporary_glb"),
	storage.indexOf("public static function register_existing_private_attachment")
);
assert(privatePromotion.includes("self::join( $root, 'tmp' )"), "temporary promotion is restricted to the private tmp root");
assert(privatePromotion.includes("path_is_within") && privatePromotion.includes("path_contains_link") && privatePromotion.includes("is_link"), "temporary promotion rejects traversal and linked paths");
assert(privatePromotion.indexOf("@rename") < privatePromotion.indexOf("insert_private_attachment"), "temporary promotion moves the validated bytes before attachment hooks run");
assert(privatePromotion.includes("'asset', 'source', $source"), "temporary promotion supplies the staging path for registration rollback");

const postTypes = read("includes/class-vrodos-post-type-manager.php");
assert((postTypes.match(/'map_meta_cap'\s*=>\s*true/g) || []).length === 3, "project, scene, and asset capabilities are object-aware");
assert(postTypes.includes("'edit_posts'          => 'edit_vrodos_projects'"), "project collection editing uses a primitive capability");
assert(postTypes.includes("'edit_post'           => 'edit_vrodos_project'"), "single-project editing uses an object capability");
assert(postTypes.includes("'edit_posts'            => 'edit_vrodos_scenes'"), "scene collection editing uses a primitive capability");
assert(postTypes.includes("'edit_post'             => 'edit_vrodos_scene'"), "single-scene editing uses an object capability");
assert(postTypes.includes("'edit_posts'            => 'edit_vrodos_assets3d'"), "asset collection editing uses a primitive capability");
assert(postTypes.includes("'edit_post'             => 'edit_vrodos_asset3d'"), "single-asset editing uses an object capability");

const coreManager = read("includes/class-vrodos-core-manager.php");
const assetDeletion = coreManager.slice(
	coreManager.indexOf("public static function vrodos_delete_asset_3d_from_scenes"),
	coreManager.indexOf("\n\t}", coreManager.indexOf("public static function vrodos_delete_asset_3d_from_scenes"))
);
assert(assetDeletion.includes("$scene_data['objects'] = $filtered;"), "asset deletion preserves scene object keys");
assert(!assetDeletion.includes("array_values( $filtered )"), "asset deletion must not convert the scene object map into a list");

const projectAjax = read("includes/ajax/class-vrodos-project-ajax.php");
const projectListHandler = projectAjax.slice(
	projectAjax.indexOf("public function vrodos_fetch_list_projects_callback"),
	projectAjax.lastIndexOf("\n}")
);
assert(projectListHandler.includes("current_user_can( 'edit_vrodos_projects' )"), "project listing uses the collection edit capability shared by administrators and restricted Immerse users");
assert(!projectListHandler.includes("current_user_can( 'edit_vrodos_project' )"), "project listing does not invoke an object capability without an ID");

const publisher = read("includes/class-vrodos-compiler-resource-publisher.php");
assert(publisher.includes("hash_file( 'sha256'"), "published media is content-addressed");
assert(publisher.includes("published_project_directory( $this->project_id, 'media' )"), "published media is project-owned");
assert(publisher.includes("$this->desktop_profiles_enabled && absint( $meta ) > 0"), "desktop GLB derivatives are required only for assets with a GLB attachment");
assert(publisher.includes("ensure_published_cache_policy"), "publication refreshes the server cache policy without changing resource URLs");

const networkRuntime = read("services/vrodos-network-runtime/server/easyrtc-server.js");
assert(networkRuntime.includes("setPublishedCacheHeaders"), "the Node publication mounts share one cache-header policy");
assert(networkRuntime.includes('parentDirectory === "media"') && networkRuntime.includes('max-age=31536000, immutable'), "the Node runtime caches only hash-named published media immutably");
assert(networkRuntime.includes('parentDirectory === "clients"') && networkRuntime.includes('no-store, no-cache, must-revalidate'), "the Node runtime keeps generated client HTML uncached");

const cli = read("includes/class-vrodos-storage-cli-command.php");
for (const command of ["audit", "migrate", "verify", "cleanup", "purge"]) {
    assert(new RegExp(`public function ${command}\\(`).test(cli), `WP-CLI ${command} command exists`);
}
assert(cli.includes("is_link(") && cli.includes("path_is_within("), "cleanup rejects links and out-of-root targets");

const uninstall = read("includes/class-vrodos-install-manager.php");
const uninstallBody = uninstall.slice(uninstall.indexOf("public static function uninstall"), uninstall.indexOf("public function vrodos_db_create_games_versions_table"));
assert(!/DELETE FROM\s+\$wpdb->posts|wp_delete_post|DROP TABLE/i.test(uninstallBody), "uninstall preserves authored records");

console.log("Storage security contract tests passed.");
