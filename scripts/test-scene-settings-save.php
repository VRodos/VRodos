<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

final class VRodos_Path_Manager {
	public static function plugin_path( string $relative_path = '' ): string {
		$root = dirname( __DIR__ ) . DIRECTORY_SEPARATOR;
		return $root . str_replace( [ '/', '\\' ], DIRECTORY_SEPARATOR, $relative_path );
	}
}

function wp_json_encode( $value, int $flags = 0 ): string {
	return (string) json_encode( $value, $flags );
}

function vrodos_scene_settings_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		fwrite( STDERR, "Scene settings save test failed: {$message}\n" );
		exit( 1 );
	}
}

function vrodos_scene_settings_expect_invalid( callable $callback, string $message ): void {
	try {
		$callback();
	} catch ( InvalidArgumentException $error ) {
		return;
	}
	vrodos_scene_settings_assert( false, $message );
}

require_once dirname( __DIR__ ) . '/includes/class-vrodos-scene-settings-merger.php';

$objects = [];
for ( $index = 1; $index <= 18; $index++ ) {
	$objects[ 'Imported ' . $index ] = (object) [
		'uuid'     => 'imported-' . $index,
		'position' => [ $index, $index + 1, $index + 2 ],
		'rotation' => [ 0.1, 0.2, 0.3 ],
		'scale'    => [ 1, 1, 1 ],
	];
}
$objects['Plane'] = (object) [
	'uuid'                         => 'd4fac2e0-6e13-4b40-b562-c8f27fdda85a',
	'category_slug'                => 'primitive-plane',
	'position'                     => [ 14.173954339359625, 0, -69.61660493702948 ],
	'rotation'                     => [ 0, 0, 0 ],
	'scale'                        => [ 1, 1, 1 ],
	'surfaceAlbedoAttachmentId'    => 1586,
	'surfaceNormalAttachmentId'    => 1587,
	'surfaceRoughnessAttachmentId' => 1588,
];

$canonical = (object) [
	'metadata'    => (object) [
		'formatVersion'         => 4,
		'timestamp'             => 1,
		'objects'               => 19,
		'aframeVrRuntimeProfile' => 'desktop',
		'authoringMarker'       => 'preserve-me',
	],
	'urlBaseType' => 'relativeToScene',
	'objects'     => (object) $objects,
];
$canonical_objects = json_encode( $canonical->objects );

$incoming = (object) [
	'aframeVrRuntimeProfile'        => 'desktop',
	'aframeVrFramebufferScale'      => 99,
	'fogtype'                       => 'INVALID',
	'aframePostFXVignetteEnabled'   => 'yes',
	'desktopPerformanceProfiles'    => (object) [
		'schemaVersion' => 2,
		'activeTab'     => 'low',
		'buildMode'     => 'custom',
		'profiles'      => (object) [],
	],
	'unknownMetadataField'          => 'ignore-me',
];

$merged = VRodos_Scene_Settings_Merger::merge_json(
	(string) json_encode( $canonical ),
	(string) json_encode( $incoming )
);

vrodos_scene_settings_assert( $canonical_objects === json_encode( $merged->objects ), 'object UUIDs, transforms, count, and Plane data must remain byte-for-byte equivalent after decoding' );
vrodos_scene_settings_assert( 'relativeToScene' === $merged->urlBaseType, 'urlBaseType must be preserved' );
vrodos_scene_settings_assert( 19 === $merged->metadata->objects, 'object count must be recalculated from the canonical map' );
vrodos_scene_settings_assert( 'd4fac2e0-6e13-4b40-b562-c8f27fdda85a' === $merged->objects->Plane->uuid, 'the original Plane UUID must survive' );
vrodos_scene_settings_assert( [ 14.173954339359625, 0, -69.61660493702948 ] === $merged->objects->Plane->position, 'the original Plane transform must survive' );
vrodos_scene_settings_assert( 'desktop' === $merged->metadata->aframeVrRuntimeProfile, 'the Desktop runtime target must remain selected' );
vrodos_scene_settings_assert( 1.5 === $merged->metadata->aframeVrFramebufferScale, 'runtime settings must be normalized by the shared contract' );
vrodos_scene_settings_assert( 'none' === $merged->metadata->fogtype, 'fog metadata must be normalized' );
vrodos_scene_settings_assert( true === $merged->metadata->aframePostFXVignetteEnabled, 'vignette metadata must be normalized' );
vrodos_scene_settings_assert( 'preserve-me' === $merged->metadata->authoringMarker, 'unrelated canonical metadata must remain intact' );
vrodos_scene_settings_assert( ! property_exists( $merged->metadata, 'unknownMetadataField' ), 'unknown incoming metadata must not be persisted' );
vrodos_scene_settings_assert( 2 === $merged->metadata->desktopPerformanceProfiles['schemaVersion'], 'desktop profile state must be normalized to schema v2' );
vrodos_scene_settings_assert( 'custom' === $merged->metadata->desktopPerformanceProfiles['buildMode'], 'desktop profile build mode must be normalized' );
vrodos_scene_settings_assert( 'custom' === $merged->metadata->desktopPerformanceProfiles['activeTab'], 'Custom mode must persist the Custom tab' );

vrodos_scene_settings_expect_invalid(
	static fn() => VRodos_Scene_Settings_Merger::merge_json( (string) json_encode( $canonical ), '{bad-json' ),
	'malformed settings JSON must be rejected'
);
vrodos_scene_settings_expect_invalid(
	static fn() => VRodos_Scene_Settings_Merger::merge_json( (string) json_encode( $canonical ), '{"objects":{"Plane":null}}' ),
	'an attempted object payload must be rejected'
);
vrodos_scene_settings_expect_invalid(
	static fn() => VRodos_Scene_Settings_Merger::merge_json( (string) json_encode( $canonical ), '{"aframeVrRuntimeProfile":{"value":"desktop"}}' ),
	'non-scalar runtime settings must be rejected'
);
vrodos_scene_settings_expect_invalid(
	static fn() => VRodos_Scene_Settings_Merger::merge_json( (string) json_encode( $canonical ), '{"desktopPerformanceProfiles":[]}' ),
	'desktop profile arrays must be rejected'
);
vrodos_scene_settings_expect_invalid(
	static fn() => VRodos_Scene_Settings_Merger::merge_json( (string) json_encode( $canonical ), '{"desktopPerformanceProfiles":{"schemaVersion":2,"profiles":{"low":{"settings":"invalid"}}}}' ),
	'malformed desktop profile settings must be rejected'
);

$invalid_profiles = (object) [
	'desktopPerformanceProfiles' => (object) [
		'schemaVersion' => 2,
		'activeTab'     => 'low',
		'buildMode'     => 'adaptive',
		'profiles'      => (object) [
			'low' => (object) [
				'settings' => (object) [ 'shadowQuality' => 'high' ],
			],
		],
	],
];
vrodos_scene_settings_expect_invalid(
	static fn() => VRodos_Scene_Settings_Merger::merge_json( (string) json_encode( $canonical ), (string) json_encode( $invalid_profiles ) ),
	'invalid desktop profile overrides must be rejected'
);

echo "Scene settings merge tests passed.\n";
