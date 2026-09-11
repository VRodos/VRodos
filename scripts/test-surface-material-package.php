<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

final class WP_Error {
	public function __construct( private string $code, private string $message, private mixed $data = null ) {}
	public function get_error_code(): string { return $this->code; }
	public function get_error_message(): string { return $this->message; }
	public function get_error_data(): mixed { return $this->data; }
}

function is_wp_error( mixed $value ): bool { return $value instanceof WP_Error; }
function wp_generate_uuid4(): string { return bin2hex( random_bytes( 16 ) ); }
function wp_mkdir_p( string $directory ): bool { return is_dir( $directory ) || mkdir( $directory, 0777, true ); }
function sanitize_file_name( string $filename ): string { return preg_replace( '/[^A-Za-z0-9._-]/', '-', $filename ); }
function wp_delete_file( string $path ): bool { return ! is_file( $path ) || unlink( $path ); }
function wp_getimagesize( string $path ): array|false { return getimagesize( $path ); }

final class VRodos_URL_Normalizer {
	public function normalize( string $url ): string { return $url; }
}

final class VRodos_Storage_Manager {
	public static int $next_id = 100;
	public static string $fail_slot = '';
	/** @var int[] */
	public static array $created_ids = [];
	/** @var int[] */
	public static array $deleted_ids = [];

	public static function temporary_directory( string $_operation, string $_token = '' ): string { return sys_get_temp_dir() . DIRECTORY_SEPARATOR; }
	public static function import_existing_file( string $_source, string $filename, string $_mime, int $_owner_id, string $_owner_type, string $_role ): int|WP_Error {
		if ( '' !== self::$fail_slot && str_contains( $filename, 'surface-' . self::$fail_slot . '-' ) ) {
			return new WP_Error( 'forced_storage_failure', 'Forced storage failure.' );
		}
		$id = self::$next_id++;
		self::$created_ids[] = $id;
		return $id;
	}
	public static function authoring_url_for_attachment( int $attachment_id ): string { return '/private/' . $attachment_id; }
	public static function delete_attachment_if_owned_by( int $attachment_id, string $_owner_type, int $_owner_id ): bool {
		self::$deleted_ids[] = $attachment_id;
		return true;
	}
}

require_once dirname( __DIR__ ) . '/includes/asset-import/class-vrodos-asset-import-zip-package.php';
require_once dirname( __DIR__ ) . '/includes/asset-import/class-vrodos-surface-material-package.php';

function vrodos_surface_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		fwrite( STDERR, "Surface material package test failed: {$message}\n" );
		exit( 1 );
	}
}

/** @param array<string,string> $entries */
function vrodos_surface_zip( array $entries ): string {
	$path = tempnam( sys_get_temp_dir(), 'vrodos-pbr-' );
	$zip  = new ZipArchive();
	vrodos_surface_assert( true === $zip->open( $path, ZipArchive::CREATE | ZipArchive::OVERWRITE ), 'test ZIP creation must succeed' );
	foreach ( $entries as $name => $contents ) {
		$zip->addFromString( $name, $contents );
	}
	$zip->close();
	return $path;
}

$temporary_paths = [];
try {
	$ground = vrodos_surface_zip(
		[
			'Ground108_2K-JPG_Color.jpg' => 'color',
			'Ground108_2K-JPG_NormalDX.jpg' => 'dx',
			'Ground108_2K-JPG_NormalGL.jpg' => 'gl',
			'Ground108_2K-JPG_Roughness.jpg' => 'rough',
			'Ground108_2K-JPG_AmbientOcclusion.jpg' => 'ao',
			'Ground108_2K-JPG_Displacement.jpg' => 'height',
			'Ground108_2K-JPG_Color_Preview.jpg' => 'preview',
			'Ground108_2K-JPG.blend' => 'ignored',
			'Ground108.png' => 'preview',
		]
	);
	$temporary_paths[] = $ground;
	$inspection = VRodos_Surface_Material_Package::inspect( $ground );
	vrodos_surface_assert( ! is_wp_error( $inspection ), 'Ground108-style package must classify' );
	vrodos_surface_assert( [ 'albedo', 'normal', 'roughness', 'ao', 'displacement' ] === array_keys( $inspection['candidates'] ), 'Ground108 detects five semantic maps' );
	vrodos_surface_assert( str_ends_with( $inspection['candidates']['normal']['filename'], 'NormalGL.jpg' ), 'OpenGL normal wins over DirectX normal' );
	vrodos_surface_assert( 1.0 === $inspection['normalYSign'], 'OpenGL normal keeps positive Y' );
	vrodos_surface_assert( in_array( 'Ground108_2K-JPG_NormalDX.jpg', $inspection['ignoredFiles'], true ), 'alternate DirectX normal is reported as ignored' );
	vrodos_surface_assert( in_array( 'Ground108_2K-JPG_Color_Preview.jpg', $inspection['ignoredFiles'], true ), 'preview images are ignored before map classification' );
	vrodos_surface_assert( true === $inspection['isGround108'], 'Ground108 packages are identified for their tile-size guidance' );

	$dx = vrodos_surface_zip( [ 'Soil_BaseColor.png' => 'color', 'Soil_NormalDX.png' => 'dx' ] );
	$temporary_paths[] = $dx;
	$dx_inspection = VRodos_Surface_Material_Package::inspect( $dx );
	vrodos_surface_assert( ! is_wp_error( $dx_inspection ) && -1.0 === $dx_inspection['normalYSign'], 'DirectX-only normal records negative Y correction' );

	$missing = vrodos_surface_zip( [ 'Soil_Roughness.png' => 'rough' ] );
	$temporary_paths[] = $missing;
	$missing_result = VRodos_Surface_Material_Package::inspect( $missing );
	vrodos_surface_assert( is_wp_error( $missing_result ) && 'vrodos_pbr_zip_missing_albedo' === $missing_result->get_error_code(), 'missing albedo is rejected' );

	$ambiguous = vrodos_surface_zip( [ 'Soil_Color.jpg' => 'one', 'Soil_Colour.jpg' => 'two' ] );
	$temporary_paths[] = $ambiguous;
	$ambiguous_result = VRodos_Surface_Material_Package::inspect( $ambiguous );
	vrodos_surface_assert( is_wp_error( $ambiguous_result ) && 'vrodos_pbr_zip_ambiguous' === $ambiguous_result->get_error_code(), 'same-priority duplicate maps are rejected' );

	$unsafe = vrodos_surface_zip( [ 'Soil_Color.jpg' => 'color', '../escape.png' => 'bad' ] );
	$temporary_paths[] = $unsafe;
	$unsafe_result = VRodos_Surface_Material_Package::inspect( $unsafe );
	vrodos_surface_assert( is_wp_error( $unsafe_result ) && 'vrodos_pbr_zip_unsafe_path' === $unsafe_result->get_error_code(), 'path traversal is rejected' );

	$dot_segment = vrodos_surface_zip( [ 'Soil_Color.jpg' => 'color', 'maps/./Soil_NormalGL.jpg' => 'bad' ] );
	$temporary_paths[] = $dot_segment;
	$dot_segment_result = VRodos_Surface_Material_Package::inspect( $dot_segment );
	vrodos_surface_assert( is_wp_error( $dot_segment_result ) && 'vrodos_pbr_zip_unsafe_path' === $dot_segment_result->get_error_code(), 'non-canonical dot path segments are rejected' );

	$metadata_traversal = vrodos_surface_zip( [ 'Soil_Color.jpg' => 'color', '__MACOSX/../escape.png' => 'bad' ] );
	$temporary_paths[] = $metadata_traversal;
	$metadata_traversal_result = VRodos_Surface_Material_Package::inspect( $metadata_traversal );
	vrodos_surface_assert( is_wp_error( $metadata_traversal_result ) && 'vrodos_pbr_zip_unsafe_path' === $metadata_traversal_result->get_error_code(), 'metadata-looking traversal entries are rejected rather than ignored' );

	$nested = vrodos_surface_zip( [ 'Soil_Color.jpg' => 'color', 'more.zip' => 'zip' ] );
	$temporary_paths[] = $nested;
	$nested_result = VRodos_Surface_Material_Package::inspect( $nested );
	vrodos_surface_assert( is_wp_error( $nested_result ) && 'vrodos_pbr_zip_nested' === $nested_result->get_error_code(), 'nested ZIPs are rejected' );

	$symlink = tempnam( sys_get_temp_dir(), 'vrodos-pbr-link-' );
	$symlink_zip = new ZipArchive();
	vrodos_surface_assert( true === $symlink_zip->open( $symlink, ZipArchive::CREATE | ZipArchive::OVERWRITE ), 'symlink test ZIP creation must succeed' );
	$symlink_zip->addFromString( 'Soil_Color.jpg', 'color' );
	$symlink_zip->addFromString( 'Soil_Normal.jpg', 'target.jpg' );
	$symlink_zip->setExternalAttributesName( 'Soil_Normal.jpg', 3, 0120777 << 16 );
	$symlink_zip->close();
	$temporary_paths[] = $symlink;
	$symlink_result = VRodos_Surface_Material_Package::inspect( $symlink );
	vrodos_surface_assert( is_wp_error( $symlink_result ) && 'vrodos_pbr_zip_symlink' === $symlink_result->get_error_code(), 'symbolic links are rejected' );

	$many_entries = [ 'Soil_Color.jpg' => 'color' ];
	for ( $index = 0; $index < 64; $index++ ) {
		$many_entries[ 'metadata-' . $index . '.txt' ] = 'x';
	}
	$many = vrodos_surface_zip( $many_entries );
	$temporary_paths[] = $many;
	$many_result = VRodos_Surface_Material_Package::inspect( $many );
	vrodos_surface_assert( is_wp_error( $many_result ) && 'vrodos_pbr_zip_too_many_entries' === $many_result->get_error_code(), 'more than 64 entries are rejected' );

	$large = vrodos_surface_zip( [ 'Soil_Color.jpg' => str_repeat( 'x', 10485761 ) ] );
	$temporary_paths[] = $large;
	$large_result = VRodos_Surface_Material_Package::inspect( $large );
	vrodos_surface_assert( is_wp_error( $large_result ) && 'vrodos_pbr_zip_image_size' === $large_result->get_error_code(), 'oversized detected images are rejected' );

	$corrupt = tempnam( sys_get_temp_dir(), 'vrodos-pbr-corrupt-' );
	file_put_contents( $corrupt, 'not a zip' );
	$temporary_paths[] = $corrupt;
	$corrupt_result = VRodos_Surface_Material_Package::inspect( $corrupt );
	vrodos_surface_assert( is_wp_error( $corrupt_result ) && 'vrodos_pbr_zip_corrupt' === $corrupt_result->get_error_code(), 'corrupt ZIPs are rejected' );

	$tiny_png = base64_decode( 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', true );
	$import_zip = vrodos_surface_zip(
		[
			'Soil_Color.png' => $tiny_png,
			'Soil_NormalGL.png' => $tiny_png,
			'Soil_Roughness.png' => $tiny_png,
			'Soil_AO.png' => $tiny_png,
			'Soil_Metalness.png' => $tiny_png,
			'Soil_Displacement.png' => $tiny_png,
		]
	);
	$temporary_paths[] = $import_zip;
	$import_result = VRodos_Surface_Material_Package::import( $import_zip, 77 );
	vrodos_surface_assert( ! is_wp_error( $import_result ) && 6 === count( $import_result['maps'] ), 'valid maps import as one complete package' );
	vrodos_surface_assert( isset( $import_result['maps']['metalness'], $import_result['maps']['displacement'] ), 'metalness and authoring-only displacement are stored' );
	vrodos_surface_assert( ! str_contains( $import_result['warnings'][0], '1.5 m' ), 'generic packages do not receive Ground108-specific scale guidance' );

	VRodos_Storage_Manager::$created_ids = [];
	VRodos_Storage_Manager::$deleted_ids = [];
	VRodos_Storage_Manager::$fail_slot = 'roughness';
	$failed_import = VRodos_Surface_Material_Package::import( $import_zip, 77 );
	vrodos_surface_assert( is_wp_error( $failed_import ), 'storage failure aborts package import' );
	vrodos_surface_assert( VRodos_Storage_Manager::$created_ids === VRodos_Storage_Manager::$deleted_ids, 'storage failure deletes every attachment created earlier in the transaction' );
	VRodos_Storage_Manager::$fail_slot = '';

	$provided = 'C:/Users/tpapazoglou/Downloads/Ground108_2K-JPG.zip';
	if ( is_file( $provided ) ) {
		$provided_result = VRodos_Surface_Material_Package::inspect( $provided );
		vrodos_surface_assert( ! is_wp_error( $provided_result ), 'supplied Ground108 ZIP must inspect successfully' );
		vrodos_surface_assert( [ 'albedo', 'normal', 'roughness', 'ao', 'displacement' ] === array_keys( $provided_result['candidates'] ), 'supplied Ground108 ZIP detects the expected five maps' );
	}
} finally {
	foreach ( $temporary_paths as $path ) {
		@unlink( $path );
	}
}

fwrite( STDOUT, "Surface material package tests passed.\n" );
