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
assert(storage.includes("replace_attachment_references"), "attachment replacement uses a centralized metadata transaction");

const postTypes = read("includes/class-vrodos-post-type-manager.php");
assert((postTypes.match(/'map_meta_cap'\s*=>\s*true/g) || []).length === 3, "project, scene, and asset capabilities are object-aware");
assert(postTypes.includes("'edit_posts'          => 'edit_vrodos_projects'"), "project collection editing uses a primitive capability");
assert(postTypes.includes("'edit_post'           => 'edit_vrodos_project'"), "single-project editing uses an object capability");
assert(postTypes.includes("'edit_posts'            => 'edit_vrodos_scenes'"), "scene collection editing uses a primitive capability");
assert(postTypes.includes("'edit_post'             => 'edit_vrodos_scene'"), "single-scene editing uses an object capability");
assert(postTypes.includes("'edit_posts'            => 'edit_vrodos_assets3d'"), "asset collection editing uses a primitive capability");
assert(postTypes.includes("'edit_post'             => 'edit_vrodos_asset3d'"), "single-asset editing uses an object capability");

const projectAjax = read("includes/ajax/class-vrodos-project-ajax.php");
const projectListHandler = projectAjax.slice(
	projectAjax.indexOf("public function vrodos_fetch_list_projects_callback"),
	projectAjax.lastIndexOf("\n}")
);
assert(projectListHandler.includes("current_user_can( 'publish_vrodos_projects' )"), "project listing uses a collection-level capability");
assert(!projectListHandler.includes("current_user_can( 'edit_vrodos_project' )"), "project listing does not invoke an object capability without an ID");

const publisher = read("includes/class-vrodos-compiler-resource-publisher.php");
assert(publisher.includes("hash_file( 'sha256'"), "published media is content-addressed");
assert(publisher.includes("published_project_directory( $this->project_id, 'media' )"), "published media is project-owned");

const cli = read("includes/class-vrodos-storage-cli-command.php");
for (const command of ["audit", "migrate", "verify", "cleanup", "purge"]) {
    assert(new RegExp(`public function ${command}\\(`).test(cli), `WP-CLI ${command} command exists`);
}
assert(cli.includes("is_link(") && cli.includes("path_is_within("), "cleanup rejects links and out-of-root targets");

const uninstall = read("includes/class-vrodos-install-manager.php");
const uninstallBody = uninstall.slice(uninstall.indexOf("public static function uninstall"), uninstall.indexOf("public function vrodos_db_create_games_versions_table"));
assert(!/DELETE FROM\s+\$wpdb->posts|wp_delete_post|DROP TABLE/i.test(uninstallBody), "uninstall preserves authored records");

console.log("Storage security contract tests passed.");
