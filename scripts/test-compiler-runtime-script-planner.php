<?php

define( 'ABSPATH', __DIR__ );

if ( ! class_exists( 'VRodos_Path_Manager' ) ) {
	class VRodos_Path_Manager {
		public static function plugin_path( string $relative = '' ): string {
			return dirname( __DIR__ ) . '/' . ltrim( str_replace( '\\', '/', $relative ), '/' );
		}
	}
}

require_once __DIR__ . '/../includes/class-vrodos-runtime-settings-contract.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-feature-flags.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-manifest.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-script-planner.php';

function vrodos_test_scene( array $metadata, $objects = null ) {
	$scene = (object) [
		'metadata' => (object) $metadata,
	];
	if ( null !== $objects ) {
		$scene->objects = $objects;
	}

	return $scene;
}

function vrodos_assert_same( array $expected, array $actual, string $label ): void {
	if ( $expected === $actual ) {
		return;
	}

	fwrite( STDERR, $label . " failed.\nExpected: " . implode( ', ', $expected ) . "\nActual:   " . implode( ', ', $actual ) . "\n" );
	exit( 1 );
}

function vrodos_assert_contains( string $haystack, string $needle, string $label ): void {
	if ( str_contains( $haystack, $needle ) ) {
		return;
	}

	fwrite( STDERR, $label . " failed: missing " . $needle . "\n" );
	exit( 1 );
}

function vrodos_assert_not_contains( string $haystack, string $needle, string $label ): void {
	if ( ! str_contains( $haystack, $needle ) ) {
		return;
	}

	fwrite( STDERR, $label . " failed: unexpected " . $needle . "\n" );
	exit( 1 );
}

function vrodos_assert_order( string $haystack, string $first, string $second, string $label ): void {
	$first_pos  = strpos( $haystack, $first );
	$second_pos = strpos( $haystack, $second );
	if ( false !== $first_pos && false !== $second_pos && $first_pos < $second_pos ) {
		return;
	}

	fwrite( STDERR, $label . " failed: expected " . $first . " before " . $second . "\n" );
	exit( 1 );
}

function vrodos_test_chunk( string $id, string $type, string $src, int $order, array $dependencies = [], array $extra = [] ): array {
	return array_merge(
		[
			'id'           => $id,
			'type'         => $type,
			'src'          => $src,
			'order'        => $order,
			'dependencies' => $dependencies,
			'features'     => [ $id ],
		],
		$extra
	);
}

function vrodos_assert_manifest_error( array $manifest, string $expected_message, string $label ): void {
	try {
		new VRodos_Compiler_Runtime_Manifest( null, $manifest );
	} catch ( RuntimeException $error ) {
		if ( str_contains( $error->getMessage(), $expected_message ) ) {
			return;
		}

		fwrite( STDERR, $label . " failed with wrong error.\nExpected message containing: " . $expected_message . "\nActual: " . $error->getMessage() . "\n" );
		exit( 1 );
	}

	fwrite( STDERR, $label . " failed: manifest was accepted.\n" );
	exit( 1 );
}

$manifest = new VRodos_Compiler_Runtime_Manifest(
	null,
	[
		'schemaVersion' => 1,
		'chunks'        => [
			'scene-components'             => vrodos_test_chunk( 'scene-components', 'script', 'js/master/lib/vrodos-runtime-scene-components.bundle.js', 10 ),
			'spatial-ui'                   => vrodos_test_chunk( 'spatial-ui', 'script', 'js/master/lib/vrodos-runtime-spatial-ui.bundle.js', 12, [ 'scene-components' ] ),
			'networked-components'         => vrodos_test_chunk( 'networked-components', 'script', 'js/master/lib/vrodos-runtime-networked-components.bundle.js', 15 ),
			'core-runtime'                 => vrodos_test_chunk( 'core-runtime', 'script', 'js/master/lib/vrodos-runtime-core.bundle.js', 20 ),
			'fps-meter'                    => vrodos_test_chunk( 'fps-meter', 'inline-module', '', 30, [], [
				'moduleImport' => 'https://cdn.jsdelivr.net/npm/stats-gl@2.2.8/dist/main.js',
				'readyGlobal'  => 'VRODOS_STATS_READY',
				'global'       => 'Stats',
				'export'       => 'default',
			] ),
			'collision-bvh-vendor'         => vrodos_test_chunk( 'collision-bvh-vendor', 'script', 'js/master/lib/vrodos-collision-bvh.bundle.js', 32 ),
			'pmndrs-postprocessing-vendor' => vrodos_test_chunk( 'pmndrs-postprocessing-vendor', 'script', 'js/master/lib/vrodos-postprocessing.bundle.js', 35 ),
			'legacy-postfx'                => vrodos_test_chunk( 'legacy-postfx', 'script', 'js/master/lib/vrodos-runtime-legacy-postfx.bundle.js', 40 ),
			'takram-atmosphere'            => vrodos_test_chunk( 'takram-atmosphere', 'script', 'js/master/lib/vrodos-takram-atmosphere.bundle.js', 45 ),
			'pmndrs-postfx'                => vrodos_test_chunk( 'pmndrs-postfx', 'script', 'js/master/lib/vrodos-runtime-pmndrs-postfx.bundle.js', 50, [ 'pmndrs-postprocessing-vendor' ] ),
			'aframe-components'            => vrodos_test_chunk( 'aframe-components', 'script', 'js/master/lib/vrodos-runtime-aframe-components.bundle.js', 90, [ 'core-runtime' ] ),
		],
	]
);

$planner = new VRodos_Compiler_Runtime_Script_Planner( $manifest );

$versioned_manifest = new VRodos_Compiler_Runtime_Manifest(
	null,
	[
		'schemaVersion' => 1,
		'chunks'        => [
			'scene-components' => vrodos_test_chunk(
				'scene-components',
				'script',
				'js/master/lib/vrodos-runtime-scene-components.bundle.js',
				10,
				[],
				[ 'version' => 'cache-test-1' ]
			),
		],
	]
);
$versioned_planner  = new VRodos_Compiler_Runtime_Script_Planner( $versioned_manifest );
vrodos_assert_contains(
	$versioned_planner->render_scripts_for_chunk_ids( [ 'scene-components' ] ),
	'vrodos-runtime-scene-components.bundle.js?ver=cache-test-1',
	'runtime script cache busting'
);

vrodos_assert_same(
	[ 'scene-components', 'networked-components', 'core-runtime', 'collision-bvh-vendor', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [] ) ),
	'no post-FX'
);

vrodos_assert_same(
	[ 'scene-components', 'spatial-ui', 'networked-components', 'core-runtime', 'collision-bvh-vendor', 'aframe-components' ],
	$planner->script_ids_for_scene(
		vrodos_test_scene(
			[],
			(object) [
				'assessment_one' => (object) [
					'category_slug'     => 'assessment',
					'assessment_group'  => 'Question',
					'assessment_levels' => 'WyJBMSJd',
				],
			]
		)
	),
	'assessment spatial UI'
);

vrodos_assert_same(
	[ 'scene-components', 'spatial-ui', 'networked-components', 'core-runtime', 'collision-bvh-vendor', 'aframe-components' ],
	$planner->script_ids_for_scene(
		vrodos_test_scene(
			[],
			(object) [
				'cefr_attachment' => (object) [
					'category_slug'         => 'image',
					'immerse_object_type'   => 'attachment',
					'immerse_cefr_levels'   => 'WyJBMiJd',
				],
			]
		)
	),
	'CEFR spatial UI'
);

vrodos_assert_same(
	[ 'scene-components', 'spatial-ui', 'networked-components', 'core-runtime', 'collision-bvh-vendor', 'aframe-components' ],
	$planner->script_ids_for_scene(
		vrodos_test_scene(
			[],
			(object) [
				'video_one' => (object) [
					'category_slug' => 'video',
					'video_url'     => 'https://example.test/video.mp4',
				],
			]
		)
	),
	'video spatial UI'
);

vrodos_assert_same(
	[ 'scene-components', 'networked-components', 'core-runtime', 'collision-bvh-vendor', 'legacy-postfx', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [ 'aframePostFXEnabled' => true, 'aframePostFXEngine' => 'legacy' ] ) ),
	'legacy post-FX'
);

vrodos_assert_same(
	[ 'scene-components', 'networked-components', 'core-runtime', 'collision-bvh-vendor', 'pmndrs-postprocessing-vendor', 'pmndrs-postfx', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [ 'aframePostFXEnabled' => true, 'aframePostFXEngine' => 'pmndrs', 'aframePmndrsAtmosphereEnabled' => false ] ) ),
	'PMNDRS without Takram'
);

vrodos_assert_same(
	[ 'scene-components', 'networked-components', 'core-runtime', 'collision-bvh-vendor', 'pmndrs-postprocessing-vendor', 'pmndrs-postfx', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [ 'aframePostFXEnabled' => true, 'aframePostFXEngine' => 'pmndrs', 'aframePmndrsAtmosphereEnabled' => false, 'aframePmndrsGeospatialEnabled' => true ] ) ),
	'PMNDRS geospatial disabled by Takram atmosphere gate'
);

vrodos_assert_same(
	[ 'scene-components', 'networked-components', 'core-runtime', 'collision-bvh-vendor', 'pmndrs-postprocessing-vendor', 'takram-atmosphere', 'pmndrs-postfx', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [ 'aframePostFXEnabled' => true, 'aframePostFXEngine' => 'pmndrs', 'aframePmndrsAtmosphereEnabled' => true ] ) ),
	'PMNDRS with Takram'
);

vrodos_assert_same(
	[ 'scene-components', 'networked-components', 'core-runtime', 'fps-meter', 'collision-bvh-vendor', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [ 'aframeFPSMeterEnabled' => true ] ) ),
	'FPS meter'
);

vrodos_assert_same(
	[ 'scene-components', 'core-runtime', 'collision-bvh-vendor', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [] ), 'single-player' ),
	'single-player no networked components'
);

vrodos_assert_same(
	[ 'scene-components', 'networked-components', 'core-runtime', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [ 'aframeCollisionMode' => 'off' ] ) ),
	'collision disabled'
);

$no_postfx_html = $planner->render_scripts_for_scene( vrodos_test_scene( [] ) );
vrodos_assert_contains( $no_postfx_html, 'vrodos-runtime-scene-components.bundle.js', 'no post-FX script tags' );
vrodos_assert_contains( $no_postfx_html, 'vrodos-runtime-networked-components.bundle.js', 'no post-FX script tags' );
vrodos_assert_contains( $no_postfx_html, 'vrodos-runtime-core.bundle.js', 'no post-FX script tags' );
vrodos_assert_contains( $no_postfx_html, 'vrodos-collision-bvh.bundle.js', 'no post-FX script tags' );
vrodos_assert_contains( $no_postfx_html, 'vrodos-runtime-aframe-components.bundle.js', 'no post-FX script tags' );
vrodos_assert_not_contains( $no_postfx_html, 'vrodos-runtime-spatial-ui.bundle.js', 'no post-FX script tags' );
vrodos_assert_not_contains( $no_postfx_html, 'vrodos-postprocessing.bundle.js', 'no post-FX script tags' );
vrodos_assert_not_contains( $no_postfx_html, 'vrodos-takram-atmosphere.bundle.js', 'no post-FX script tags' );

$assessment_html = $planner->render_scripts_for_scene(
	vrodos_test_scene(
		[],
		(object) [
			'assessment_one' => (object) [
				'category_name' => 'Assessment',
			],
		]
	)
);
vrodos_assert_contains( $assessment_html, 'vrodos-runtime-spatial-ui.bundle.js', 'assessment spatial UI script tags' );
vrodos_assert_order( $assessment_html, 'vrodos-runtime-scene-components.bundle.js', 'vrodos-runtime-spatial-ui.bundle.js', 'assessment spatial UI script order' );
vrodos_assert_order( $assessment_html, 'vrodos-runtime-spatial-ui.bundle.js', 'vrodos-runtime-networked-components.bundle.js', 'assessment spatial UI script order' );

$pmndrs_takram_html = $planner->render_scripts_for_scene( vrodos_test_scene( [ 'aframePostFXEnabled' => true, 'aframePostFXEngine' => 'pmndrs', 'aframePmndrsAtmosphereEnabled' => true ] ) );
vrodos_assert_order( $pmndrs_takram_html, 'vrodos-postprocessing.bundle.js', 'vrodos-takram-atmosphere.bundle.js', 'PMNDRS Takram script order' );
vrodos_assert_order( $pmndrs_takram_html, 'vrodos-takram-atmosphere.bundle.js', 'vrodos-runtime-pmndrs-postfx.bundle.js', 'PMNDRS Takram script order' );

$single_player_html = $planner->render_scripts_for_scene( vrodos_test_scene( [] ), 'single-player' );
vrodos_assert_not_contains( $single_player_html, 'vrodos-runtime-networked-components.bundle.js', 'single-player script tags' );

vrodos_assert_manifest_error(
	[
		'schemaVersion' => 1,
		'chunks'        => [
			'a' => vrodos_test_chunk( 'a', 'script', 'a.js', 10 ),
			'b' => vrodos_test_chunk( 'b', 'script', 'b.js', 10 ),
		],
	],
	'share order',
	'duplicate chunk order validation'
);

vrodos_assert_manifest_error(
	[
		'schemaVersion' => 1,
		'chunks'        => [
			'a' => vrodos_test_chunk( 'a', 'script', 'a.js', 10, [ 'missing' ] ),
		],
	],
	'undeclared dependency',
	'undeclared dependency validation'
);

vrodos_assert_manifest_error(
	[
		'schemaVersion' => 1,
		'chunks'        => [
			'a' => vrodos_test_chunk( 'a', 'script', 'a.js', 10, [], [ 'features' => [] ] ),
		],
	],
	'no feature coverage',
	'feature coverage validation'
);

$actual_manifest = new VRodos_Compiler_Runtime_Manifest();
vrodos_assert_same(
	[ 'scene-components', 'networked-components', 'core-runtime', 'collision-bvh-vendor', 'aframe-components' ],
	$actual_manifest->resolve_chunk_ids( [ 'scene-components', 'networked-components', 'core-runtime', 'collision-bvh-vendor', 'aframe-components' ] ),
	'actual generated manifest validation'
);

echo "Runtime script planner fixtures passed.\n";
