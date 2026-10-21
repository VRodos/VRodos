<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

class WP_Error {}

function absint( $value ): int { return abs( (int) $value ); }
function is_wp_error( $value ): bool { return $value instanceof WP_Error; }
function sanitize_key( string $value ): string { return preg_replace( '/[^a-z0-9_-]/', '', strtolower( $value ) ); }
function wp_normalize_path( string $path ): string { return str_replace( '\\', '/', $path ); }
function esc_url_raw( string $url ): string { return $url; }
function current_time( string $type, bool $gmt = false ): string { return gmdate( 'Y-m-d H:i:s' ); }
function wp_parse_args( array $args, array $defaults = [] ): array { return array_merge( $defaults, $args ); }
function get_post_meta( int $id, string $key, bool $single = false ) { return $GLOBALS['metadata'][ $id ][ $key ] ?? ''; }
function update_post_meta( int $id, string $key, $value ): bool {
	if ( $GLOBALS['reject_metadata_update'] ) {
		return false;
	}
	$GLOBALS['metadata'][ $id ][ $key ] = $value;
	return true;
}
function get_attached_file( int $id, bool $unfiltered = false ) { return VRodos_Storage_Manager::$attachments[ $id ]['path'] ?? false; }
function wp_delete_file( string $path ): void { if ( is_file( $path ) ) { unlink( $path ); } }

class VRodos_Storage_Manager {
	public static array $attachments = [];
	public static array $deleted = [];
	public static int $next_id = 501;

	public static function register_existing_private_attachment( string $path, string $mime, int $owner_id, string $owner_type, string $role, string $profile = '' ): int {
		$id = self::$next_id++;
		self::$attachments[ $id ] = compact( 'path', 'owner_id', 'owner_type' );
		return $id;
	}

	public static function attachment_is_owned_by( int $id, string $owner_type, int $owner_id ): bool {
		$attachment = self::$attachments[ $id ] ?? [];
		return ( $attachment['owner_id'] ?? 0 ) === $owner_id && ( $attachment['owner_type'] ?? '' ) === $owner_type;
	}

	public static function delete_attachment_if_owned_by( int $id, string $owner_type, int $owner_id ): bool {
		if ( ! self::attachment_is_owned_by( $id, $owner_type, $owner_id ) ) {
			return false;
		}
		self::$deleted[] = $id;
		wp_delete_file( self::$attachments[ $id ]['path'] );
		unset( self::$attachments[ $id ] );
		return true;
	}

	public static function authoring_url_for_attachment( int $id ): string {
		return '/wp-admin/admin-ajax.php?action=vrodos_private_media&id=' . $id;
	}
}

require_once dirname( __DIR__ ) . '/includes/asset-optimization/trait-vrodos-asset-optimization-derivatives.php';

class DerivativeRegenerationFixture {
	use VRodos_Asset_Optimization_Derivative_Service;

	public const META_KEY = '_vrodos_asset3d_glb_derivatives';

	protected static function prepare_source_glb( int $asset_id ): array {
		return [ 'path' => '/source.glb', 'attachmentId' => 7619 ];
	}

	protected static function source_identity_matches( int $asset_id, string $sha256, int $generation ): bool {
		return 7618 === $asset_id && 'source-hash' === $sha256 && 1 === $generation;
	}

	protected static function runtime_derivative_texture_cap( string $profile ): int { return 1024; }

	public function store( array $result ): void {
		$this->store_derivative_record( 7618, $result );
	}
}

function verify_regeneration( bool $condition, string $message ): void {
	if ( ! $condition ) {
		throw new RuntimeException( $message );
	}
}

$GLOBALS['metadata'] = [];
$GLOBALS['reject_metadata_update'] = false;
$path = tempnam( sys_get_temp_dir(), 'vrodos-regeneration-' );
$replacement_path = tempnam( sys_get_temp_dir(), 'vrodos-regeneration-' );
$fixture = new DerivativeRegenerationFixture();
$result = [
	'profile' => 'web-low',
	'paths' => [ 'file' => $path, 'manifest' => $path . '.json' ],
	'options' => [ 'jobKey' => 'same-job', 'sourceSha256' => 'source-hash', 'sourceGeneration' => 1, 'textureMaxSize' => 1024 ],
	'record' => [ 'runtimeSubstitutionReady' => true ],
];

try {
	file_put_contents( $path, 'first derivative' );
	$fixture->store( $result );
	$first = get_post_meta( 7618, DerivativeRegenerationFixture::META_KEY, true )['webVariants']['same-job'];
	verify_regeneration( 501 === $first['attachmentId'], 'The first derivative must register an attachment.' );

	file_put_contents( $path, 'regenerated derivative' );
	$fixture->store( $result );
	$meta = get_post_meta( 7618, DerivativeRegenerationFixture::META_KEY, true );
	$regenerated = $meta['webVariants']['same-job'];
	verify_regeneration( $first['attachmentId'] === $regenerated['attachmentId'], 'Same-path regeneration must reuse the owned attachment.' );
	verify_regeneration( 502 === VRodos_Storage_Manager::$next_id, 'Same-path regeneration must not register another attachment.' );
	verify_regeneration( [] === VRodos_Storage_Manager::$deleted, 'Same-path regeneration must not delete the active attachment.' );
	verify_regeneration( is_file( $path ) && 'regenerated derivative' === file_get_contents( $path ), 'The regenerated GLB must remain on disk.' );
	verify_regeneration( $regenerated === $meta['derivatives']['web-low'] && 'same-job' === $meta['webProfileDefaults']['web-low'], 'All profile references must point to the regenerated attachment.' );

	$GLOBALS['reject_metadata_update'] = true;
	$result['record']['derivativeSizeBytes'] = 42;
	$rejected = false;
	try {
		$fixture->store( $result );
	} catch ( RuntimeException $error ) {
		$rejected = 'WordPress rejected the derivative metadata update.' === $error->getMessage();
	} finally {
		$GLOBALS['reject_metadata_update'] = false;
	}
	verify_regeneration( $rejected, 'A rejected metadata update must still report failure.' );
	verify_regeneration( [] === VRodos_Storage_Manager::$deleted && is_file( $path ), 'A failed metadata update must preserve the reused attachment and GLB.' );
	verify_regeneration( $meta === get_post_meta( 7618, DerivativeRegenerationFixture::META_KEY, true ), 'A failed update must preserve the previous derivative metadata.' );

	file_put_contents( $replacement_path, 'replacement derivative' );
	$result['paths'] = [ 'file' => $replacement_path, 'manifest' => $replacement_path . '.json' ];
	$fixture->store( $result );
	$replacement = get_post_meta( 7618, DerivativeRegenerationFixture::META_KEY, true )['webVariants']['same-job'];
	verify_regeneration( 502 === $replacement['attachmentId'] && [ 501 ] === VRodos_Storage_Manager::$deleted, 'A different path must register a replacement and retire the old attachment.' );
	verify_regeneration( ! is_file( $path ) && is_file( $replacement_path ), 'Retiring the old attachment must delete only its old GLB.' );
} finally {
	wp_delete_file( $path );
	wp_delete_file( $replacement_path );
}

echo "Derivative regeneration tests passed.\n";
