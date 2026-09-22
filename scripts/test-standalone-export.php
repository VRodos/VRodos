<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . '/' );
$GLOBALS['standalone_plugin_url'] = 'http://wp.local/wordpress/wp-content/plugins/VRodos/';

final class VRodos_Path_Manager {
	public static function plugin_url(): string {
		return $GLOBALS['standalone_plugin_url'];
	}
	public static function plugin_path(): string {
		return dirname( __DIR__ ) . '/';
	}
}

function wp_parse_url( string $url, int $component ) {
	return parse_url( $url, $component );
}

function trailingslashit( string $value ): string {
	return rtrim( $value, '/' ) . '/';
}

function wp_upload_dir(): array {
	return [ 'baseurl' => 'http://wp.local/wordpress/wp-content/uploads', 'basedir' => __DIR__ ];
}

function wp_json_encode( $value, int $flags = 0 ): string {
	return json_encode( $value, $flags | JSON_THROW_ON_ERROR );
}

require_once dirname( __DIR__ ) . '/includes/class-vrodos-scene-standalone-exporter.php';

function standalone_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		throw new RuntimeException( $message );
	}
}

$html = <<<'HTML'
<script src="http://wp.local/wordpress/wp-content/plugins/VRodos/assets/vendor/aframe/aframe-master.min.js"></script>
<script type="module">import("http://wp.local/wordpress/wp-content/plugins/VRodos/assets/vendor/stats-gl/main.js");</script>
<script>var context = {"projectId":765,"sceneId":766,"ajaxUrl":"http://wp.local/wordpress/wp-admin/admin-ajax.php"};</script>
<script>window.VRODOS_PLUGIN_URL = "/wordpress/wp-content/plugins/VRodos/";</script>
<a-asset-item src="http://wp.local/wordpress/wp-content/uploads/vrodos/published/projects/765/media/terrain.glb"></a-asset-item>
<img src="/wordpress/wp-content/uploads/vrodos/published/projects/765/media/poster.png">
<a-asset-item src="../../assets/models/editor/checkmark.glb"></a-asset-item>
HTML;

$method = new ReflectionMethod( VRodos_Scene_Standalone_Exporter::class, 'rewrite_html' );
$result = $method->invoke( new VRodos_Scene_Standalone_Exporter(), $html );
standalone_assert( str_contains( $result, 'import("./wp-content/plugins/VRodos/assets/vendor/stats-gl/main.js")' ), 'Exported module imports must be explicit relative URLs.' );
standalone_assert( ! str_contains( $result, '/wordpress/' ), 'The package must not depend on the WordPress installation directory.' );
foreach ( [
	'./wp-content/plugins/VRodos/assets/vendor/aframe/aframe-master.min.js',
	'./wp-content/plugins/VRodos/assets/models/editor/checkmark.glb',
	'./wp-content/uploads/vrodos/published/projects/765/media/terrain.glb',
	'./wp-content/uploads/vrodos/published/projects/765/media/poster.png',
] as $url ) {
	standalone_assert( str_contains( $result, 'src="' . $url . '"' ), 'Missing portable dependency URL: ' . $url );
}
standalone_assert( str_contains( $result, '"ajaxUrl":"","standalone":true' ), 'Standalone exports must disable WordPress AJAX.' );
$GLOBALS['standalone_plugin_url'] = 'http://wp.local/wp-content/plugins/VRodos/';
$collector = new ReflectionMethod( VRodos_Scene_Standalone_Exporter::class, 'collect_dependencies' );
$files = $collector->invoke( new VRodos_Scene_Standalone_Exporter(), '<a-scene vrodos-controls-hint></a-scene>' );
standalone_assert( isset( $files['wp-content/plugins/VRodos/assets/js/runtime/master/lib/vrodos-runtime-spatial-ui.bundle.js'] ), 'Scenes without spatial content must export the controls hint bundle.' );
standalone_assert( ! isset( $files['wp-content/plugins/VRodos/assets/js/runtime/master/lib/vrodos-runtime-assessment.bundle.js'] ), 'POI-only exports must not collect assessment code.' );
$assessment_files = $collector->invoke( new VRodos_Scene_Standalone_Exporter(), '<script src="/wp-content/plugins/VRodos/assets/js/runtime/master/lib/vrodos-runtime-assessment.bundle.js?ver=test"></script>' );
standalone_assert( isset( $assessment_files['wp-content/plugins/VRodos/assets/js/runtime/master/lib/vrodos-runtime-assessment.bundle.js'] ), 'Assessment exports must include the selected assessment bundle.' );
foreach ( [
	'fonts/noto-sans/NotoSans-Regular.ttf',
	'fonts/noto-sans/NotoSans-Bold.ttf',
	'zappar-msdf-generator/worker.js',
	'zappar-msdf-generator/msdfgen_wasm.wasm',
] as $asset ) {
	standalone_assert( isset( $files[ 'wp-content/plugins/VRodos/assets/vendor/' . $asset ] ), 'Spatial UI exports must include ' . $asset );
}
echo "Standalone export URL acceptance checks passed.\n";
