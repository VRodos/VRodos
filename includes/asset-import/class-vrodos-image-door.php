<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Embed a transport image in the same two-metre plane used by image assets. */
final class VRodos_Image_Door {
	public const IMAGE_META = 'vrodos_asset3d_door_image';
	private const MODEL_META = '_vrodos_door_image_glb';

	public static function register_hooks(): void {
		add_action( 'added_post_meta', [ self::class, 'model_changed' ], 5, 4 );
		add_action( 'updated_post_meta', [ self::class, 'model_changed' ], 5, 4 );
	}

	public static function model_changed( int $meta_id, int $asset_id, string $key, mixed $value ): void {
		if ( 'vrodos_asset3d_glb' !== $key || (int) $value <= 0 || (int) $value === (int) get_post_meta( $asset_id, self::MODEL_META, true ) ) {
			return;
		}
		$image_id = (int) get_post_meta( $asset_id, self::IMAGE_META, true );
		if ( $image_id > 0 ) {
			delete_post_meta( $asset_id, self::IMAGE_META );
			update_post_meta( $asset_id, self::MODEL_META, (int) $value );
			VRodos_Storage_Manager::delete_unreferenced_attachment_if_owned_by( $image_id, 'asset', $asset_id );
		}
	}

	/** Existing explicit model replacements remain authoritative on unchanged-URL reimport. */
	public static function needs_source_import( int $asset_id ): bool {
		return (int) get_post_meta( $asset_id, self::IMAGE_META, true ) <= 0
			&& (int) get_post_meta( $asset_id, self::MODEL_META, true ) <= 0;
	}

	public static function is_image_door( int $asset_id ): bool {
		return has_term( 'door', 'vrodos_asset3d_cat', $asset_id )
			&& (int) get_post_meta( $asset_id, self::IMAGE_META, true ) > 0;
	}

	/** Stage both owned files; callers activate only after the pair is ready. */
	public static function prepare_source( string $path, string $filename, int $asset_id ): array|WP_Error {
		$info = @getimagesize( $path );
		if ( ! is_array( $info ) ) {
			return new WP_Error( 'invalid_door_image', 'Choose a readable PNG, JPEG, WebP or GIF door image.' );
		}
		$image_id = VRodos_Storage_Manager::import_existing_file( $path, $filename, (string) $info['mime'], $asset_id, 'asset', 'source' );
		if ( is_wp_error( $image_id ) ) {
			return $image_id;
		}
		return self::prepare_attachment( $asset_id, (int) $image_id );
	}

	private static function prepare_attachment( int $asset_id, int $image_id ): array|WP_Error {
		$directory = VRodos_Storage_Manager::temporary_directory( 'image-door' );
		if ( is_wp_error( $directory ) ) {
			VRodos_Storage_Manager::delete_attachment_if_owned_by( $image_id, 'asset', $asset_id );
			return $directory;
		}
		$output = trailingslashit( $directory ) . 'door.glb';
		try {
			$path = get_attached_file( $image_id, true );
			$result = self::convert_to_glb( is_string( $path ) ? $path : '', $output );
			if ( is_wp_error( $result ) ) {
				VRodos_Storage_Manager::delete_attachment_if_owned_by( $image_id, 'asset', $asset_id );
				return $result;
			}
			$normalization = VRodos_Asset_Import_Glb_Normalizer::normalize( $output, trailingslashit( $directory ) . 'normalized.glb' );
			if ( is_wp_error( $normalization ) ) {
				VRodos_Storage_Manager::delete_attachment_if_owned_by( $image_id, 'asset', $asset_id );
				return $normalization;
			}
			$model_id = VRodos_Storage_Manager::import_existing_file( (string) $normalization['path'], 'door.glb', 'model/gltf-binary', $asset_id, 'asset', 'source' );
			if ( is_wp_error( $model_id ) ) {
				VRodos_Storage_Manager::delete_attachment_if_owned_by( $image_id, 'asset', $asset_id );
				return $model_id;
			}
			return [ 'image_attachment_id' => $image_id, 'attachment_id' => (int) $model_id, 'normalization' => $normalization ];
		} finally {
			wp_delete_file( $output );
			wp_delete_file( trailingslashit( $directory ) . 'normalized.glb' );
			@rmdir( $directory );
		}
	}

	public static function activate( int $asset_id, array $prepared ): bool|WP_Error {
		$references = [
			self::IMAGE_META => (int) $prepared['image_attachment_id'],
			self::MODEL_META => (int) $prepared['attachment_id'],
			'vrodos_asset3d_glb' => (int) $prepared['attachment_id'],
		];
		if ( get_post_meta( $asset_id, '_immerse_source', true ) === 'immerse' ) {
			$references = [ '_immerse_local_attachment_id' => (int) $prepared['attachment_id'] ] + $references;
		}
		$result = VRodos_Storage_Manager::replace_attachment_reference_map( $asset_id, 'asset', $references );
		if ( is_wp_error( $result ) ) {
			foreach ( array_unique( array_values( $references ) ) as $id ) {
				VRodos_Storage_Manager::delete_unreferenced_attachment_if_owned_by( $id, 'asset', $asset_id );
			}
			return $result;
		}
		VRodos_Asset_Origin::mark_bounds_centered( $asset_id );
		VRodos_Asset_Import_Glb_Normalizer::record_asset_result( $asset_id, $prepared['normalization'] );
		return true;
	}

	/** Authenticated controllers call this only for an existing image-based door. */
	public static function replace_upload( int $asset_id, array $file ): bool|WP_Error {
		if ( ! self::is_image_door( $asset_id ) ) {
			return new WP_Error( 'not_image_door', 'This asset is not an image-based door.' );
		}
		$image_id = VRodos_Storage_Manager::store_uploaded_attachment( $file, $asset_id, 'asset', 'source' );
		if ( is_wp_error( $image_id ) ) {
			return $image_id;
		}
		$prepared = self::prepare_attachment( $asset_id, (int) $image_id );
		return is_wp_error( $prepared ) ? $prepared : self::activate( $asset_id, $prepared );
	}

	public static function convert_to_glb( string $source_path, string $output_path ): bool|WP_Error {
		$info = @getimagesize( $source_path );
		$image = @file_get_contents( $source_path );
		if ( ! is_array( $info ) || ! is_string( $image ) || empty( $info[0] ) || empty( $info[1] ) ) {
			return new WP_Error( 'invalid_transport_image', 'The transport attachment is not a readable image.' );
		}
		$mime = (string) ( $info['mime'] ?? '' );
		if ( ! in_array( $mime, [ 'image/png', 'image/jpeg' ], true ) ) {
			// glTF's core image formats are PNG/JPEG. Convert other raster formats
			// to PNG instead of introducing a browser-specific texture extension.
			if ( ! function_exists( 'imagecreatefromstring' ) ) {
				return new WP_Error( 'transport_image_decoder_missing', 'GD is required to convert this transport image to PNG.' );
			}
			$decoded = @imagecreatefromstring( $image );
			if ( false === $decoded ) {
				return new WP_Error( 'invalid_transport_image', 'The transport image could not be decoded.' );
			}
			imagesavealpha( $decoded, true );
			ob_start();
			$encoded = imagepng( $decoded );
			$image = ob_get_clean();
			imagedestroy( $decoded );
			if ( ! $encoded || ! is_string( $image ) ) {
				return new WP_Error( 'transport_image_encode_failed', 'The transport image could not be encoded as PNG.' );
			}
			$mime = 'image/png';
		}

		$binary = pack( 'g*', -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0 );
		$binary .= pack( 'g*', 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 );
		$binary .= pack( 'g*', 0, 1, 1, 1, 1, 0, 0, 0 );
		$binary .= pack( 'v*', 0, 1, 2, 0, 2, 3 );
		$image_offset = strlen( $binary );
		$binary .= $image;
		$binary .= str_repeat( "\0", ( 4 - strlen( $binary ) % 4 ) % 4 );
		$document = [
			'asset' => [ 'version' => '2.0', 'generator' => 'VRodos Immerse Image Transport' ],
			'extensionsUsed' => [ 'KHR_materials_unlit' ],
			'scene' => 0,
			'scenes' => [ [ 'nodes' => [ 0 ] ] ],
			'nodes' => [ [ 'mesh' => 0 ] ],
			'meshes' => [ [ 'primitives' => [ [
				'attributes' => [ 'POSITION' => 0, 'NORMAL' => 1, 'TEXCOORD_0' => 2 ],
				'indices' => 3, 'material' => 0,
			] ] ] ],
			'accessors' => [
				[ 'bufferView' => 0, 'componentType' => 5126, 'count' => 4, 'type' => 'VEC3', 'min' => [ -1, -1, 0 ], 'max' => [ 1, 1, 0 ] ],
				[ 'bufferView' => 1, 'componentType' => 5126, 'count' => 4, 'type' => 'VEC3' ],
				[ 'bufferView' => 2, 'componentType' => 5126, 'count' => 4, 'type' => 'VEC2' ],
				[ 'bufferView' => 3, 'componentType' => 5123, 'count' => 6, 'type' => 'SCALAR' ],
			],
			'bufferViews' => [
				[ 'buffer' => 0, 'byteOffset' => 0, 'byteLength' => 48, 'target' => 34962 ],
				[ 'buffer' => 0, 'byteOffset' => 48, 'byteLength' => 48, 'target' => 34962 ],
				[ 'buffer' => 0, 'byteOffset' => 96, 'byteLength' => 32, 'target' => 34962 ],
				[ 'buffer' => 0, 'byteOffset' => 128, 'byteLength' => 12, 'target' => 34963 ],
				[ 'buffer' => 0, 'byteOffset' => $image_offset, 'byteLength' => strlen( $image ) ],
			],
			'buffers' => [ [ 'byteLength' => strlen( $binary ) ] ],
			'images' => [ [ 'bufferView' => 4, 'mimeType' => $mime ] ],
			'textures' => [ [ 'source' => 0 ] ],
			'materials' => [ [
				'extensions' => [ 'KHR_materials_unlit' => (object) [] ],
				'doubleSided' => true,
				'alphaMode' => 'image/png' === $mime ? 'BLEND' : 'OPAQUE',
				'pbrMetallicRoughness' => [ 'baseColorTexture' => [ 'index' => 0 ], 'metallicFactor' => 0, 'roughnessFactor' => 1 ],
			] ],
		];
		$json = wp_json_encode( $document, JSON_UNESCAPED_SLASHES );
		if ( ! is_string( $json ) ) {
			return new WP_Error( 'transport_model_encode_failed', 'The transport model could not be encoded.' );
		}
		$json .= str_repeat( ' ', ( 4 - strlen( $json ) % 4 ) % 4 );
		$glb = 'glTF' . pack( 'VV', 2, 28 + strlen( $json ) + strlen( $binary ) )
			. pack( 'VV', strlen( $json ), 0x4E4F534A ) . $json
			. pack( 'VV', strlen( $binary ), 0x004E4942 ) . $binary;
		if ( strlen( $glb ) !== @file_put_contents( $output_path, $glb, LOCK_EX ) ) {
			return new WP_Error( 'transport_model_write_failed', 'The transport model could not be written.' );
		}
		return true;
	}
}
