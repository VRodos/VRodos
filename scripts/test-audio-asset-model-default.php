<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

$GLOBALS['vrodos_audio_asset_meta'] = [];

function get_post_meta( int $post_id, string $key, bool $single = false ) {
	return $GLOBALS['vrodos_audio_asset_meta'][ $post_id ][ $key ] ?? '';
}

function update_post_meta( int $post_id, string $key, $value ): bool {
	$GLOBALS['vrodos_audio_asset_meta'][ $post_id ][ $key ] = $value;
	return true;
}

class VRodos_Core_Manager {
	public static function get_builtin_audio_marker_url(): string {
		return 'builtin-speaker.glb';
	}

	public static function get_builtin_audio_thumbnail_url(): string {
		return 'builtin-audio.png';
	}
}

require_once dirname( __DIR__ ) . '/includes/asset-cpt/trait-vrodos-asset-cpt-shared.php';

class Audio_Asset_Defaults_Test {
	use VRodos_Asset_CPT_Shared {
		ensure_audio_asset_defaults as public apply_audio_defaults;
	}
}

function assert_audio_asset_meta( int $asset_id, string $key, $expected ): void {
	if ( get_post_meta( $asset_id, $key, true ) !== $expected ) {
		fwrite( STDERR, "Audio asset default failed for {$key}.\n" );
		exit( 1 );
	}
}

Audio_Asset_Defaults_Test::apply_audio_defaults( 1 );
assert_audio_asset_meta( 1, 'vrodos_asset3d_glb', 'builtin-speaker.glb' );
assert_audio_asset_meta( 1, 'vrodos_asset3d_screenimage', 'builtin-audio.png' );

update_post_meta( 1, 'vrodos_asset3d_glb', 42 );
update_post_meta( 1, 'vrodos_asset3d_screenimage', 43 );
Audio_Asset_Defaults_Test::apply_audio_defaults( 1 );
assert_audio_asset_meta( 1, 'vrodos_asset3d_glb', 42 );
assert_audio_asset_meta( 1, 'vrodos_asset3d_screenimage', 43 );

echo "Audio asset model defaults passed.\n";
