<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Securely classifies and imports a conventional PBR texture ZIP. */
final class VRodos_Surface_Material_Package {
	public const MAX_PACKAGE_BYTES = 134217728; // 128 MiB.
	public const MAX_ENTRY_COUNT   = 64;
	private const MAX_IMAGE_BYTES  = 10485760; // 10 MiB per decoded image file.
	private const MAX_TOTAL_BYTES  = 62914560; // 60 MiB across selected maps.
	private const MAX_DIMENSION    = 2048;
	private const STORAGE_ROLE     = 'surface-textures';
	private const SLOT_ORDER       = [ 'albedo', 'normal', 'roughness', 'ao', 'metalness', 'displacement' ];

	/** Inspect names and archive metadata without extracting content. */
	public static function inspect( string $zip_path ): array|WP_Error {
		if ( ! class_exists( ZipArchive::class ) ) {
			return self::error( 'vrodos_pbr_zip_unavailable', 'ZIP support is unavailable on this server.', 500 );
		}
		if ( ! is_file( $zip_path ) || ! is_readable( $zip_path ) ) {
			return self::error( 'vrodos_pbr_zip_missing', 'The PBR ZIP upload is missing.', 400 );
		}
		$package_size = filesize( $zip_path );
		if ( false === $package_size || $package_size <= 0 || $package_size > self::MAX_PACKAGE_BYTES ) {
			return self::error( 'vrodos_pbr_zip_too_large', 'PBR ZIP packages must be 128 MiB or smaller.', 413 );
		}

		$zip = new ZipArchive();
		if ( true !== $zip->open( $zip_path ) ) {
			return self::error( 'vrodos_pbr_zip_corrupt', 'The PBR package is not a readable ZIP archive.', 400 );
		}
		if ( $zip->numFiles > self::MAX_ENTRY_COUNT ) {
			$zip->close();
			return self::error( 'vrodos_pbr_zip_too_many_entries', 'PBR ZIP packages may contain at most 64 entries.', 413 );
		}

		$candidates = [];
		$ignored    = [];
		$total_size = 0;
		$is_ground108 = false;
		for ( $index = 0; $index < $zip->numFiles; $index++ ) {
			$stat = $zip->statIndex( $index, ZipArchive::FL_UNCHANGED );
			if ( ! is_array( $stat ) ) {
				$zip->close();
				return self::error( 'vrodos_pbr_zip_entry_unreadable', 'A ZIP entry could not be inspected.', 400 );
			}

			$raw_entry = (string) ( $stat['name'] ?? '' );
			$entry     = VRodos_Asset_Import_Zip_Package::normalize_entry_name( $raw_entry );
			$path_for_validation = rtrim( $entry, '/' );
			$path_segments = explode( '/', $path_for_validation );
			if (
				'' === $path_for_validation
				|| str_contains( $raw_entry, "\0" )
				|| str_starts_with( $path_for_validation, '/' )
				|| preg_match( '/^[A-Za-z]:\//', $path_for_validation )
				|| in_array( '', $path_segments, true )
				|| in_array( '.', $path_segments, true )
				|| in_array( '..', $path_segments, true )
			) {
				$zip->close();
				return self::error( 'vrodos_pbr_zip_unsafe_path', 'The ZIP contains an unsafe file path.', 400 );
			}
			if ( self::entry_is_symlink( $zip, $index ) ) {
				$zip->close();
				return self::error( 'vrodos_pbr_zip_symlink', 'PBR ZIP packages may not contain symbolic links.', 400 );
			}
			if ( str_ends_with( $entry, '/' ) ) {
				continue;
			}
			if ( self::is_metadata_entry( $entry ) ) {
				$ignored[] = basename( $entry );
				continue;
			}
			if ( ! VRodos_Asset_Import_Zip_Package::is_safe_file_entry( $entry ) ) {
				$zip->close();
				return self::error( 'vrodos_pbr_zip_unsafe_path', 'The ZIP contains an unsafe file path.', 400 );
			}

			$extension = strtolower( pathinfo( $entry, PATHINFO_EXTENSION ) );
			if ( 'zip' === $extension ) {
				$zip->close();
				return self::error( 'vrodos_pbr_zip_nested', 'Nested ZIP files are not allowed in a PBR package.', 400 );
			}
			$filename = basename( $entry );
			if ( self::is_preview_file( $filename ) ) {
				$ignored[] = $filename;
				continue;
			}
			$is_ground108 = $is_ground108 || 1 === preg_match( '/(?:^|_)ground108(?:_|$)/i', strtolower( pathinfo( $filename, PATHINFO_FILENAME ) ) );
			$classification = self::classify_filename( $filename );
			if ( null === $classification || ! in_array( $extension, [ 'jpg', 'jpeg', 'png', 'webp' ], true ) ) {
				$ignored[] = $filename;
				continue;
			}

			$size = (int) ( $stat['size'] ?? 0 );
			if ( $size <= 0 || $size > self::MAX_IMAGE_BYTES ) {
				$zip->close();
				return self::error( 'vrodos_pbr_zip_image_size', 'Every detected PBR image must be between 1 byte and 10 MiB.', 413 );
			}

			$slot      = $classification['slot'];
			$candidate = [
				'entry'       => $entry,
				'rawEntry'    => $raw_entry,
				'filename'    => $filename,
				'extension'   => $extension,
				'size'        => $size,
				'priority'    => $classification['priority'],
				'normalYSign' => $classification['normalYSign'],
			];
			if ( isset( $candidates[ $slot ] ) ) {
				$current = $candidates[ $slot ];
				if ( $current['priority'] === $candidate['priority'] ) {
					$zip->close();
					return self::error(
						'vrodos_pbr_zip_ambiguous',
						sprintf( 'The package contains ambiguous %s maps: %s and %s.', $slot, $current['filename'], $candidate['filename'] ),
						400
					);
				}
				if ( $current['priority'] > $candidate['priority'] ) {
					$ignored[] = $candidate['filename'];
					continue;
				}
				$ignored[] = $current['filename'];
				$total_size -= (int) $current['size'];
			}
			$candidates[ $slot ] = $candidate;
			$total_size += $size;
		}
		$zip->close();

		if ( ! isset( $candidates['albedo'] ) ) {
			return self::error( 'vrodos_pbr_zip_missing_albedo', 'The PBR package must contain an albedo, base-color, color, or diffuse map.', 400 );
		}
		if ( $total_size > self::MAX_TOTAL_BYTES ) {
			return self::error( 'vrodos_pbr_zip_selected_too_large', 'Detected PBR maps may total at most 60 MiB.', 413 );
		}

		$ordered = [];
		foreach ( self::SLOT_ORDER as $slot ) {
			if ( isset( $candidates[ $slot ] ) ) {
				$ordered[ $slot ] = $candidates[ $slot ];
			}
		}
		return [
			'candidates'  => $ordered,
			'ignoredFiles' => array_values( array_slice( array_unique( $ignored ), 0, 24 ) ),
			'normalYSign' => (float) ( $ordered['normal']['normalYSign'] ?? 1 ),
			'isGround108'  => $is_ground108,
		];
	}

	/** Import every validated map, rolling back all new attachments on failure. */
	public static function import( string $zip_path, int $scene_id ): array|WP_Error {
		$inspection = self::inspect( $zip_path );
		if ( is_wp_error( $inspection ) ) {
			return $inspection;
		}

		$created_ids = [];
		$maps        = [];
		foreach ( $inspection['candidates'] as $slot => $candidate ) {
			$temporary = VRodos_Asset_Import_Zip_Package::extract_entry_from_path_to_temp_file( $zip_path, (string) $candidate['rawEntry'] );
			if ( is_wp_error( $temporary ) ) {
				self::rollback( $created_ids, $scene_id );
				return self::error( 'vrodos_pbr_zip_extract_failed', 'A detected PBR map could not be extracted.', 400 );
			}

			$validated = self::validate_image( $temporary, (string) $candidate['extension'] );
			if ( is_wp_error( $validated ) ) {
				wp_delete_file( $temporary );
				self::rollback( $created_ids, $scene_id );
				return $validated;
			}

			$filename = sanitize_file_name( 'surface-' . $slot . '-' . (string) $candidate['filename'] );
			$attachment_id = VRodos_Storage_Manager::import_existing_file(
				$temporary,
				$filename,
				$validated['mime'],
				$scene_id,
				'scene',
				self::STORAGE_ROLE
			);
			wp_delete_file( $temporary );
			if ( is_wp_error( $attachment_id ) ) {
				self::rollback( $created_ids, $scene_id );
				return $attachment_id;
			}

			$attachment_id = (int) $attachment_id;
			$created_ids[] = $attachment_id;
			$url = ( new VRodos_URL_Normalizer() )->normalize( VRodos_Storage_Manager::authoring_url_for_attachment( $attachment_id ) );
			$maps[ $slot ] = [
				'attachmentId' => $attachment_id,
				'url'          => $url,
				'filename'     => (string) $candidate['filename'],
				'width'        => $validated['width'],
				'height'       => $validated['height'],
			];
		}

		$scale_warning = 'Physical tile size was not encoded in the package. The current tile size was preserved.';
		if ( ! empty( $inspection['isGround108'] ) ) {
			$scale_warning .= ' Set Tile size to 1.5 m for AmbientCG Ground108.';
		}
		return [
			'maps'          => $maps,
			'normalYSign'   => $inspection['normalYSign'],
			'ignoredFiles'  => $inspection['ignoredFiles'],
			'scaleDetected' => false,
			'warnings'      => [ $scale_warning ],
		];
	}

	/** @return array{slot:string,priority:int,normalYSign:float}|null */
	private static function classify_filename( string $filename ): ?array {
		$stem = strtolower( pathinfo( $filename, PATHINFO_FILENAME ) );
		$stem = preg_replace( '/[^a-z0-9]+/', '_', $stem );
		$has  = static fn( string $pattern ): bool => 1 === preg_match( '/(?:^|_)(?:' . $pattern . ')(?:_|$)/', $stem );

		if ( $has( 'normalgl|normal_opengl|nor_gl' ) ) return [ 'slot' => 'normal', 'priority' => 300, 'normalYSign' => 1.0 ];
		if ( $has( 'normaldx|normal_directx|nor_dx' ) ) return [ 'slot' => 'normal', 'priority' => 200, 'normalYSign' => -1.0 ];
		if ( $has( 'normal|nor' ) ) return [ 'slot' => 'normal', 'priority' => 100, 'normalYSign' => 1.0 ];
		if ( $has( 'basecolor|base_color|albedo' ) ) return [ 'slot' => 'albedo', 'priority' => 300, 'normalYSign' => 1.0 ];
		if ( $has( 'color|colour' ) ) return [ 'slot' => 'albedo', 'priority' => 200, 'normalYSign' => 1.0 ];
		if ( $has( 'diffuse|diff' ) ) return [ 'slot' => 'albedo', 'priority' => 100, 'normalYSign' => 1.0 ];
		if ( $has( 'roughness|rough' ) ) return [ 'slot' => 'roughness', 'priority' => 200, 'normalYSign' => 1.0 ];
		if ( $has( 'ambientocclusion|ambient_occlusion|occlusion|ao' ) ) return [ 'slot' => 'ao', 'priority' => 200, 'normalYSign' => 1.0 ];
		if ( $has( 'metalness|metallic|metal' ) ) return [ 'slot' => 'metalness', 'priority' => 200, 'normalYSign' => 1.0 ];
		if ( $has( 'displacement|height|disp' ) ) return [ 'slot' => 'displacement', 'priority' => 200, 'normalYSign' => 1.0 ];
		return null;
	}

	private static function validate_image( string $path, string $extension ): array|WP_Error {
		$size = filesize( $path );
		if ( false === $size || $size <= 0 || $size > self::MAX_IMAGE_BYTES ) {
			return self::error( 'vrodos_pbr_image_size', 'A detected PBR image exceeds the 10 MiB limit.', 413 );
		}
		$image = function_exists( 'wp_getimagesize' ) ? wp_getimagesize( $path ) : getimagesize( $path );
		$mime  = is_array( $image ) ? strtolower( (string) ( $image['mime'] ?? '' ) ) : '';
		$allowed = [ 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp' ];
		if ( ! is_array( $image ) || ! isset( $allowed[ $extension ] ) || $allowed[ $extension ] !== $mime ) {
			return self::error( 'vrodos_pbr_image_invalid', 'A detected PBR map is not a valid JPEG, PNG, or WebP image.', 415 );
		}
		$width  = (int) ( $image[0] ?? 0 );
		$height = (int) ( $image[1] ?? 0 );
		if ( $width <= 0 || $height <= 0 || $width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION ) {
			return self::error( 'vrodos_pbr_image_dimensions', 'PBR maps may be at most 2048 pixels on either axis.', 413 );
		}
		return [ 'mime' => $mime, 'width' => $width, 'height' => $height ];
	}

	private static function entry_is_symlink( ZipArchive $zip, int $index ): bool {
		$opsys = 0;
		$attributes = 0;
		if ( ! $zip->getExternalAttributesIndex( $index, $opsys, $attributes, ZipArchive::FL_UNCHANGED ) ) {
			return false;
		}
		return 3 === $opsys && 0120000 === ( ( $attributes >> 16 ) & 0170000 );
	}

	private static function is_metadata_entry( string $entry ): bool {
		$basename = basename( $entry );
		return str_starts_with( $entry, '__MACOSX/' ) || str_starts_with( $basename, '._' ) || '.DS_Store' === $basename;
	}

	private static function is_preview_file( string $filename ): bool {
		$stem = strtolower( pathinfo( $filename, PATHINFO_FILENAME ) );
		$stem = preg_replace( '/[^a-z0-9]+/', '_', $stem );
		return 1 === preg_match( '/(?:^|_)(?:preview|thumbnail|thumb)(?:_|$)/', $stem );
	}

	/** @param int[] $attachment_ids */
	private static function rollback( array $attachment_ids, int $scene_id ): void {
		foreach ( $attachment_ids as $attachment_id ) {
			VRodos_Storage_Manager::delete_attachment_if_owned_by( (int) $attachment_id, 'scene', $scene_id );
		}
	}

	private static function error( string $code, string $message, int $status ): WP_Error {
		return new WP_Error( $code, $message, [ 'status' => $status ] );
	}
}
