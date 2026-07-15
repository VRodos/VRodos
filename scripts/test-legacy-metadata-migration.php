<?php

define( 'ABSPATH', __DIR__ );

if ( ! class_exists( 'VRodos_Path_Manager' ) ) {
	final class VRodos_Path_Manager {
		public static function plugin_path( string $relative = '' ): string {
			return dirname( __DIR__ ) . '/' . ltrim( str_replace( '\\', '/', $relative ), '/' );
		}
	}
}

require_once __DIR__ . '/../includes/class-vrodos-runtime-settings-contract.php';
require_once __DIR__ . '/../includes/class-vrodos-legacy-metadata-migration.php';

function vrodos_migration_assert( bool $condition, string $label ): void {
	if ( $condition ) {
		return;
	}
	fwrite( STDERR, $label . " failed.\n" );
	exit( 1 );
}

$migration       = new VRodos_Legacy_Metadata_Migration();
$migrate_overlay = new ReflectionMethod( $migration, 'migrate_composite_params' );
$migrate_preset  = new ReflectionMethod( $migration, 'migrate_atmosphere_preset' );

$metadata = (object) [
	'aframeRenderQuality' => 'high',
	'composite_params'    => 'renderQuality: performance; fogdensity: 0.25; runtimeMode: single-player; hoveringInteractables: false; malformed',
];
$malformed = 0;
$changed   = $migrate_overlay->invokeArgs( $migration, [ $metadata, &$malformed ] );
vrodos_migration_assert( true === $changed, 'legacy overlay migration reports a change' );
vrodos_migration_assert( ! property_exists( $metadata, 'composite_params' ), 'legacy overlay is removed' );
vrodos_migration_assert( 'high' === $metadata->aframeRenderQuality, 'canonical metadata takes precedence' );
vrodos_migration_assert( 0.25 === $metadata->fogdensity, 'allowlisted wire value migrates to canonical metadata' );
vrodos_migration_assert( ! property_exists( $metadata, 'aframeHoveringInteractables' ), 'editor-only contract fields are not migrated onto the scene-settings wire' );
vrodos_migration_assert( 3 === $malformed, 'blocked, editor-only, and malformed values are reported' );

$second_malformed = 0;
vrodos_migration_assert(
	false === $migrate_overlay->invokeArgs( $migration, [ $metadata, &$second_malformed ] ),
	'legacy overlay migration is idempotent'
);
vrodos_migration_assert( 0 === $second_malformed, 'idempotent pass adds no malformed count' );

$atmosphere = (object) [ 'aframePmndrsSunElevationDeg' => 15 ];
vrodos_migration_assert( true === $migrate_preset->invoke( $migration, $atmosphere ), 'legacy atmosphere fields select custom preset' );
vrodos_migration_assert( 'custom' === $atmosphere->aframePmndrsAtmospherePreset, 'custom atmosphere preset is canonicalized' );
vrodos_migration_assert( false === $migrate_preset->invoke( $migration, $atmosphere ), 'atmosphere migration is idempotent' );

echo "Legacy metadata migration tests passed.\n";
