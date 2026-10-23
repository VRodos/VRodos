<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/asset-optimization/class-vrodos-glb-analysis.php';

/** Prepared, asset-owned lighting bakes selected only by standalone headset builds. */
final class VRodos_Headset_Baked_Asset {
	public const META = 'vrodos_asset3d_headset_baked_glb';
	private const SOURCE_HASH_META = '_vrodos_headset_baked_source_sha256';

	public static function status( int $asset_id ): string {
		if ( ! absint( get_post_meta( $asset_id, self::META, true ) ) ) {
			return 'Not added';
		}
		try {
			self::selected_path( $asset_id, 'headset', true, 4096 );
			return 'Ready';
		} catch ( RuntimeException $error ) {
			return $error->getMessage();
		}
	}

	public static function replace_upload( int $asset_id, array $file ): void {
		if ( (int) ( $file['error'] ?? UPLOAD_ERR_NO_FILE ) !== UPLOAD_ERR_OK ) {
			throw new RuntimeException( 'The baked GLB upload did not complete.', 409 );
		}
		self::validate( (string) ( $file['tmp_name'] ?? '' ), 4096 );
		$id = VRodos_Storage_Manager::store_uploaded_attachment( $file, $asset_id, 'asset', 'headset-baked' );
		if ( is_wp_error( $id ) ) {
			throw new RuntimeException( $id->get_error_message(), 409 );
		}
		try {
			self::replace( $asset_id, (int) $id );
		} catch ( RuntimeException $error ) {
			VRodos_Storage_Manager::delete_unreferenced_attachment_if_owned_by( (int) $id, 'asset', $asset_id );
			throw $error;
		}
	}

	public static function selected_path( int $asset_id, string $runtime_profile, bool $enabled, int $texture_cap ): string {
		if ( ! $enabled || 'headset' !== $runtime_profile ) {
			return '';
		}
		$id = absint( get_post_meta( $asset_id, self::META, true ) );
		if ( ! $id ) {
			return '';
		}
		$source = get_attached_file( absint( get_post_meta( $asset_id, 'vrodos_asset3d_glb', true ) ), true );
		$hash = get_post_meta( $asset_id, self::SOURCE_HASH_META, true );
		if ( ! is_string( $source ) || ! is_readable( $source ) || ! is_string( $hash ) || ! hash_equals( $hash, hash_file( 'sha256', $source ) ) ) {
			throw new RuntimeException( "Asset #{$asset_id}: the headset bake needs rebaking or reattaching after the original model changed.", 409 );
		}
		if ( ! VRodos_Storage_Manager::attachment_is_owned_by( $id, 'asset', $asset_id ) ) {
			throw new RuntimeException( "Asset #{$asset_id}: the headset bake is not in this asset's private storage.", 409 );
		}
		$path = get_attached_file( $id, true );
		self::validate( (string) $path, $texture_cap );
		return $path;
	}

	public static function replace( int $asset_id, int $attachment_id ): void {
		$old = absint( get_post_meta( $asset_id, self::META, true ) );
		if ( ! $attachment_id ) {
			delete_post_meta( $asset_id, self::META );
			delete_post_meta( $asset_id, self::SOURCE_HASH_META );
			if ( $old ) {
				VRodos_Storage_Manager::delete_unreferenced_attachment_if_owned_by( $old, 'asset', $asset_id );
			}
			return;
		}
		if ( ! current_user_can( 'edit_post', $attachment_id ) || 'attachment' !== get_post_type( $attachment_id ) ) {
			throw new RuntimeException( 'You cannot use that baked model attachment.', 409 );
		}
		$path = (string) get_attached_file( $attachment_id, true );
		self::validate( $path, 4096 );
		$source_id = absint( get_post_meta( $asset_id, 'vrodos_asset3d_glb', true ) );
		$source = (string) get_attached_file( $source_id, true );
		if ( ! $source_id || ! is_readable( $source ) || $source_id === $attachment_id ) {
			throw new RuntimeException( 'Choose a separate baked GLB for an asset with a readable original model.', 409 );
		}
		// Saving other asset fields must not re-certify an already stale bake.
		if ( $old === $attachment_id ) {
			return;
		}
		if ( ! VRodos_Storage_Manager::attachment_is_owned_by( $attachment_id, 'asset', $asset_id ) ) {
			$copy = VRodos_Storage_Manager::import_existing_file( $path, basename( $path ), 'model/gltf-binary', $asset_id, 'asset', 'headset-baked' );
			if ( is_wp_error( $copy ) ) {
				throw new RuntimeException( $copy->get_error_message(), 409 );
			}
			$attachment_id = (int) $copy;
		}
		$result = VRodos_Storage_Manager::replace_attachment_references( $asset_id, 'asset', [ self::META ], $attachment_id );
		if ( is_wp_error( $result ) ) {
			throw new RuntimeException( $result->get_error_message(), 409 );
		}
		update_post_meta( $asset_id, self::SOURCE_HASH_META, hash_file( 'sha256', $source ) );
	}

	public static function validate( string $path, int $texture_cap ): void {
		if ( ! is_file( $path ) || ! is_readable( $path ) || filesize( $path ) > 100 * 1024 * 1024 ) {
			throw new RuntimeException( 'The prepared baked GLB must be readable and no larger than 100 MiB.', 409 );
		}
		$gltf = VRodos_Glb_Analysis::read_glb_json( $path );
		if ( is_wp_error( $gltf ) ) {
			throw new RuntimeException( $gltf->get_error_message(), 409 );
		}
		if ( empty( $gltf['meshes'] ) || ! empty( $gltf['extensions']['KHR_lights_punctual']['lights'] ) ) {
			throw new RuntimeException( 'The prepared baked GLB must contain meshes and no embedded runtime lights.', 409 );
		}
		foreach ( array_merge( $gltf['buffers'] ?? [], $gltf['images'] ?? [] ) as $resource ) {
			if ( isset( $resource['uri'] ) ) {
				throw new RuntimeException( 'The prepared baked GLB must embed its buffers and textures.', 409 );
			}
		}
		$handle = fopen( $path, 'rb' );
		try {
			$header = fread( $handle, 20 );
			$json_length = unpack( 'Vlength', substr( $header, 12, 4 ) )['length'];
			fseek( $handle, 20 + $json_length );
			$bin = fread( $handle, 8 );
			$bin_header = strlen( $bin ) === 8 ? unpack( 'Vlength/Vtype', $bin ) : [];
			$bin_start = 28 + $json_length;
			foreach ( $gltf['images'] ?? [] as $image ) {
				$view = $gltf['bufferViews'][ $image['bufferView'] ?? -1 ] ?? [];
				$offset = (int) ( $view['byteOffset'] ?? 0 );
				$length = (int) ( $view['byteLength'] ?? 0 );
				if ( ( $bin_header['type'] ?? 0 ) !== 0x004E4942 || (int) ( $view['buffer'] ?? -1 ) !== 0 || $offset < 0 || $length < 24 || $length > 32 * 1024 * 1024 || $offset + $length > ( $bin_header['length'] ?? 0 ) || $bin_start + $offset + $length > filesize( $path ) ) {
					throw new RuntimeException( 'The prepared baked GLB has an invalid embedded image.', 409 );
				}
				fseek( $handle, $bin_start + $offset );
				$bytes = fread( $handle, $length );
				if ( substr( $bytes, 0, 12 ) === "\xABKTX 20\xBB\r\n\x1A\n" ) {
					$dimensions = strlen( $bytes ) >= 28 ? array_values( unpack( 'Vwidth/Vheight', substr( $bytes, 20, 8 ) ) ) : [];
				} else {
					$dimensions = @getimagesizefromstring( $bytes );
				}
				if ( ! $dimensions || min( $dimensions[0], $dimensions[1] ) < 1 || max( $dimensions[0], $dimensions[1] ) > $texture_cap ) {
					throw new RuntimeException( "A baked texture exceeds the selected {$texture_cap}px headset quality or has an unsupported format. Prepare a bake within that cap.", 409 );
				}
			}
		} finally {
			fclose( $handle );
		}
	}
}
