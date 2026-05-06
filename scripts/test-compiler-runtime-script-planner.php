<?php

define( 'ABSPATH', __DIR__ );

require_once __DIR__ . '/../includes/class-vrodos-runtime-settings-contract.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-manifest.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-runtime-script-planner.php';

function vrodos_test_scene( array $metadata ) {
	return (object) [
		'metadata' => (object) $metadata,
	];
}

function vrodos_assert_same( array $expected, array $actual, string $label ): void {
	if ( $expected === $actual ) {
		return;
	}

	fwrite( STDERR, $label . " failed.\nExpected: " . implode( ', ', $expected ) . "\nActual:   " . implode( ', ', $actual ) . "\n" );
	exit( 1 );
}

$manifest = new VRodos_Compiler_Runtime_Manifest(
	null,
	[
		'schemaVersion' => 1,
		'chunks'        => [
			'scene-components'             => [
				'id'           => 'scene-components',
				'type'         => 'script',
				'src'          => 'js/master/lib/vrodos-runtime-scene-components.bundle.js',
				'order'        => 10,
				'dependencies' => [],
			],
			'core-runtime'                 => [
				'id'           => 'core-runtime',
				'type'         => 'script',
				'src'          => 'js/master/lib/vrodos-runtime-core.bundle.js',
				'order'        => 20,
				'dependencies' => [],
			],
			'fps-meter'                    => [
				'id'           => 'fps-meter',
				'type'         => 'inline-module',
				'moduleImport' => 'https://cdn.jsdelivr.net/npm/stats-gl@2.2.8/dist/main.js',
				'readyGlobal'  => 'VRODOS_STATS_READY',
				'global'       => 'Stats',
				'export'       => 'default',
				'order'        => 30,
				'dependencies' => [],
			],
			'pmndrs-postprocessing-vendor' => [
				'id'           => 'pmndrs-postprocessing-vendor',
				'type'         => 'script',
				'src'          => 'js/master/lib/vrodos-postprocessing.bundle.js',
				'order'        => 35,
				'dependencies' => [],
			],
			'legacy-postfx'                => [
				'id'           => 'legacy-postfx',
				'type'         => 'script',
				'src'          => 'js/master/lib/vrodos-runtime-legacy-postfx.bundle.js',
				'order'        => 40,
				'dependencies' => [],
			],
			'takram-atmosphere'            => [
				'id'           => 'takram-atmosphere',
				'type'         => 'script',
				'src'          => 'js/master/lib/vrodos-takram-atmosphere.bundle.js',
				'order'        => 45,
				'dependencies' => [],
			],
			'pmndrs-postfx'                => [
				'id'           => 'pmndrs-postfx',
				'type'         => 'script',
				'src'          => 'js/master/lib/vrodos-runtime-pmndrs-postfx.bundle.js',
				'order'        => 50,
				'dependencies' => [ 'pmndrs-postprocessing-vendor' ],
			],
			'aframe-components'            => [
				'id'           => 'aframe-components',
				'type'         => 'script',
				'src'          => 'js/master/lib/vrodos-runtime-aframe-components.bundle.js',
				'order'        => 90,
				'dependencies' => [ 'core-runtime' ],
			],
		],
	]
);

$planner = new VRodos_Compiler_Runtime_Script_Planner( $manifest );

vrodos_assert_same(
	[ 'scene-components', 'core-runtime', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [] ) ),
	'no post-FX'
);

vrodos_assert_same(
	[ 'scene-components', 'core-runtime', 'legacy-postfx', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [ 'aframePostFXEnabled' => true, 'aframePostFXEngine' => 'legacy' ] ) ),
	'legacy post-FX'
);

vrodos_assert_same(
	[ 'scene-components', 'core-runtime', 'pmndrs-postprocessing-vendor', 'pmndrs-postfx', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [ 'aframePostFXEnabled' => true, 'aframePostFXEngine' => 'pmndrs', 'aframePmndrsAtmosphereEnabled' => false ] ) ),
	'PMNDRS without Takram'
);

vrodos_assert_same(
	[ 'scene-components', 'core-runtime', 'pmndrs-postprocessing-vendor', 'pmndrs-postfx', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [ 'aframePostFXEnabled' => true, 'aframePostFXEngine' => 'pmndrs', 'aframePmndrsAtmosphereEnabled' => false, 'aframePmndrsGeospatialEnabled' => true ] ) ),
	'PMNDRS geospatial disabled by Takram atmosphere gate'
);

vrodos_assert_same(
	[ 'scene-components', 'core-runtime', 'pmndrs-postprocessing-vendor', 'takram-atmosphere', 'pmndrs-postfx', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [ 'aframePostFXEnabled' => true, 'aframePostFXEngine' => 'pmndrs', 'aframePmndrsAtmosphereEnabled' => true ] ) ),
	'PMNDRS with Takram'
);

vrodos_assert_same(
	[ 'scene-components', 'core-runtime', 'fps-meter', 'aframe-components' ],
	$planner->script_ids_for_scene( vrodos_test_scene( [ 'aframeFPSMeterEnabled' => true ] ) ),
	'FPS meter'
);

echo "Runtime script planner fixtures passed.\n";
