<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Asset_Import_Zip_Package {
	private const MAX_SCAN_DEPTH = 2;

	public static function scan( string $zip_path, int $depth = 0, string $display_prefix = '' ): array {
		$result = [
			'success'                     => false,
			'glb'                         => null,
			'candidate'                   => null,
			'temp_files'                  => [],
			'safe_file_count'             => 0,
			'unsafe_entry_count'          => 0,
			'nested_zip_count'            => 0,
			'max_depth_zip_count'         => 0,
			'glb_count'                   => 0,
			'zero_size_glb_count'         => 0,
			'glb_external_ref_count'      => 0,
			'glb_external_missing_count'  => 0,
			'conversion_extension_counts' => [],
			'scan_errors'                 => [],
		];

		$zip = new ZipArchive();
		if ( $zip->open( $zip_path ) !== true ) {
			$result['error'] = 'Could not open ZIP file.';
			return $result;
		}

		$result['success'] = true;
		$conversion_extensions = array_keys( self::get_conversion_priority_map() );
		$safe_entry_lookup     = [];
		$glb_entries           = [];

		for ( $index = 0; $index < $zip->numFiles; $index++ ) {
			$stat = $zip->statIndex( $index );
			if ( ! is_array( $stat ) ) {
				continue;
			}

			$raw_entry = (string) ( $stat['name'] ?? '' );
			$entry     = self::normalize_entry_name( $raw_entry );
			if ( ! self::is_safe_file_entry( $entry ) ) {
				$result['unsafe_entry_count']++;
				continue;
			}

			$result['safe_file_count']++;
			$safe_entry_lookup[ $entry ] = true;
			$display_entry = $display_prefix . $entry;
			$extension     = strtolower( pathinfo( $entry, PATHINFO_EXTENSION ) );
			$size          = (int) ( $stat['size'] ?? 0 );

			if ( 'zip' === $extension ) {
				$result['nested_zip_count']++;
				if ( $depth >= self::MAX_SCAN_DEPTH ) {
					$result['max_depth_zip_count']++;
					continue;
				}

				$nested_zip = self::extract_entry_to_temp_file( $zip, $raw_entry );
				if ( is_wp_error( $nested_zip ) ) {
					$result['scan_errors'][] = 'Could not inspect nested ZIP "' . $display_entry . '": ' . $nested_zip->get_error_message();
					continue;
				}

				$result['temp_files'][] = $nested_zip;
				$nested_result          = self::scan( $nested_zip, $depth + 1, $display_entry . '!' );
				self::merge_scan_result( $result, $nested_result );
				continue;
			}

			if ( 'glb' === $extension ) {
				$result['glb_count']++;
				if ( $size <= 0 ) {
					$result['zero_size_glb_count']++;
					continue;
				}

				$glb_entries[] = [
					'display_entry'  => $display_entry,
					'local_entry'    => $entry,
					'zip_entry'      => $raw_entry,
					'container_path' => $zip_path,
					'extension'      => 'glb',
					'size'           => $size,
				];
				continue;
			}

			if ( in_array( $extension, $conversion_extensions, true ) ) {
				$result['conversion_extension_counts'][ $extension ] = ( $result['conversion_extension_counts'][ $extension ] ?? 0 ) + 1;
				if ( $size <= 0 ) {
					continue;
				}

				$result['candidate'] = self::select_better_conversion_candidate(
					is_array( $result['candidate'] ) ? $result['candidate'] : null,
					[
						'display_entry'  => $display_entry,
						'local_entry'    => $entry,
						'zip_entry'      => $raw_entry,
						'container_path' => $zip_path,
						'extension'      => $extension,
						'size'           => $size,
						'gltf_info'      => 'gltf' === $extension ? self::inspect_gltf_entry( $zip, $raw_entry ) : [],
					]
				);
			}
		}

		foreach ( $glb_entries as $glb_entry ) {
			$external = self::inspect_glb_external_resources( $zip, (string) $glb_entry['zip_entry'], (string) $glb_entry['local_entry'], $safe_entry_lookup );
			if ( ! empty( $external['error'] ) ) {
				$result['scan_errors'][] = 'Could not inspect GLB resources for "' . (string) $glb_entry['display_entry'] . '": ' . (string) $external['error'];
			}

			$glb_entry['external_refs']        = (array) ( $external['external_refs'] ?? [] );
			$glb_entry['external_missing']     = (array) ( $external['external_missing'] ?? [] );
			$glb_entry['requires_repack']      = ! empty( $glb_entry['external_refs'] );
			$result['glb_external_ref_count'] += count( $glb_entry['external_refs'] );
			$result['glb_external_missing_count'] += count( $glb_entry['external_missing'] );

			$result['glb'] = self::select_better_glb(
				is_array( $result['glb'] ) ? $result['glb'] : null,
				$glb_entry
			);
		}

		$zip->close();
		ksort( $result['conversion_extension_counts'] );

		return $result;
	}

	public static function format_selection_diagnostic( array $selection ): string {
		$parts = [
			'Scanned ' . (int) ( $selection['safe_file_count'] ?? 0 ) . ' safe file(s)',
			'found ' . (int) ( $selection['glb_count'] ?? 0 ) . ' GLB file(s)',
		];

		$unsafe_count = (int) ( $selection['unsafe_entry_count'] ?? 0 );
		if ( $unsafe_count > 0 ) {
			$parts[] = 'ignored ' . $unsafe_count . ' unsafe or metadata entries';
		}

		$zero_size_count = (int) ( $selection['zero_size_glb_count'] ?? 0 );
		if ( $zero_size_count > 0 ) {
			$parts[] = 'ignored ' . $zero_size_count . ' zero-byte GLB file(s)';
		}

		$external_ref_count = (int) ( $selection['glb_external_ref_count'] ?? 0 );
		if ( $external_ref_count > 0 ) {
			$parts[] = 'found ' . $external_ref_count . ' external GLB resource reference(s)';
		}

		$external_missing_count = (int) ( $selection['glb_external_missing_count'] ?? 0 );
		if ( $external_missing_count > 0 ) {
			$parts[] = 'missing ' . $external_missing_count . ' referenced GLB resource(s)';
		}

		$conversion_extensions = array_filter(
			array_map( 'strval', array_keys( (array) ( $selection['conversion_extension_counts'] ?? [] ) ) )
		);
		if ( ! empty( $conversion_extensions ) ) {
			$parts[] = 'found conversion candidate extension(s): .' . implode( ', .', $conversion_extensions );
		}

		$nested_count = (int) ( $selection['nested_zip_count'] ?? 0 );
		if ( $nested_count > 0 ) {
			$parts[] = 'inspected ' . $nested_count . ' nested ZIP entries';
		}

		$max_depth_count = (int) ( $selection['max_depth_zip_count'] ?? 0 );
		if ( $max_depth_count > 0 ) {
			$parts[] = 'skipped ' . $max_depth_count . ' nested ZIP entries at max depth';
		}

		if ( ! empty( $selection['glb']['display_entry'] ) ) {
			$parts[] = 'selected GLB: ' . (string) $selection['glb']['display_entry'];
		} elseif ( ! empty( $selection['candidate']['display_entry'] ) ) {
			$parts[] = 'selected conversion source: ' . (string) $selection['candidate']['display_entry'];
			$gltf_info = (array) ( $selection['candidate']['gltf_info'] ?? [] );
			if ( ! empty( $gltf_info['textureless_vertex_color_mesh'] ) ) {
				$parts[] = 'selected glTF has vertex colors but no images, textures, or materials, so no external desert texture can be restored from this ZIP';
			}
		}

		$scan_errors = array_filter( array_map( 'strval', (array) ( $selection['scan_errors'] ?? [] ) ) );
		if ( ! empty( $scan_errors ) ) {
			$parts[] = implode( ' ', array_slice( $scan_errors, 0, 3 ) );
		}

		return implode( '; ', $parts ) . '.';
	}

	public static function extract_entry_from_path_to_temp_file( string $zip_path, string $entry ): string|WP_Error {
		if ( '' === $zip_path || '' === $entry ) {
			return new WP_Error( 'zip_entry_missing', 'Selected ZIP entry is missing.' );
		}

		$zip = new ZipArchive();
		if ( $zip->open( $zip_path ) !== true ) {
			return new WP_Error( 'zip_open_failed', 'Could not open selected ZIP container.' );
		}

		$result = self::extract_entry_to_temp_file( $zip, $entry );
		$zip->close();

		return $result;
	}

	private static function inspect_gltf_entry( ZipArchive $zip, string $raw_entry ): array {
		$source = $zip->getStream( $raw_entry );
		if ( ! is_resource( $source ) ) {
			return [];
		}

		$json = stream_get_contents( $source );
		fclose( $source );
		$data = json_decode( is_string( $json ) ? $json : '', true );
		if ( ! is_array( $data ) ) {
			return [];
		}

		$image_count    = count( (array) ( $data['images'] ?? [] ) );
		$texture_count  = count( (array) ( $data['textures'] ?? [] ) );
		$material_count = count( (array) ( $data['materials'] ?? [] ) );
		$has_vertex_colors = false;
		foreach ( (array) ( $data['meshes'] ?? [] ) as $mesh ) {
			foreach ( (array) ( $mesh['primitives'] ?? [] ) as $primitive ) {
				$attributes = (array) ( $primitive['attributes'] ?? [] );
				foreach ( array_keys( $attributes ) as $attribute_name ) {
					if ( str_starts_with( (string) $attribute_name, 'COLOR_' ) ) {
						$has_vertex_colors = true;
						break 3;
					}
				}
			}
		}

		return [
			'image_count'                   => $image_count,
			'texture_count'                 => $texture_count,
			'material_count'                => $material_count,
			'has_vertex_colors'             => $has_vertex_colors,
			'textureless_vertex_color_mesh' => $has_vertex_colors && 0 === $image_count && 0 === $texture_count && 0 === $material_count,
		];
	}

	public static function extract_safe_package( string $zip_path, string $source_entry ): array|WP_Error {
		if ( '' === $zip_path || '' === $source_entry ) {
			return new WP_Error( 'zip_package_missing', 'Selected conversion source is missing.' );
		}

		$zip = new ZipArchive();
		if ( $zip->open( $zip_path ) !== true ) {
			return new WP_Error( 'zip_open_failed', 'Could not open ZIP package for conversion.' );
		}

		$target_dir = self::create_temp_directory( 'vrodos-asset-import-package-' );
		if ( is_wp_error( $target_dir ) ) {
			$zip->close();
			return $target_dir;
		}

		for ( $index = 0; $index < $zip->numFiles; $index++ ) {
			$stat = $zip->statIndex( $index );
			if ( ! is_array( $stat ) ) {
				continue;
			}

			$raw_entry = (string) ( $stat['name'] ?? '' );
			$entry     = self::normalize_entry_name( $raw_entry );
			if ( ! self::is_safe_file_entry( $entry ) ) {
				continue;
			}

			$source = $zip->getStream( $raw_entry );
			if ( ! is_resource( $source ) ) {
				continue;
			}

			$target_path   = trailingslashit( $target_dir ) . str_replace( '/', DIRECTORY_SEPARATOR, $entry );
			$target_parent = dirname( $target_path );
			if ( ! wp_mkdir_p( $target_parent ) ) {
				fclose( $source );
				$zip->close();
				self::cleanup_paths( [ $target_dir ] );
				return new WP_Error( 'mkdir_failed', 'Could not create temporary extraction directory.' );
			}

			$target = fopen( $target_path, 'wb' );
			if ( ! $target ) {
				fclose( $source );
				$zip->close();
				self::cleanup_paths( [ $target_dir ] );
				return new WP_Error( 'fopen_failed', 'Could not write temporary extracted file.' );
			}

			stream_copy_to_stream( $source, $target );
			fclose( $source );
			fclose( $target );
		}

		$zip->close();

		$source_path = trailingslashit( $target_dir ) . str_replace( '/', DIRECTORY_SEPARATOR, $source_entry );
		if ( ! file_exists( $source_path ) ) {
			self::cleanup_paths( [ $target_dir ] );
			return new WP_Error( 'source_missing', 'Selected conversion source was not extracted.' );
		}

		if ( strtolower( pathinfo( $source_path, PATHINFO_EXTENSION ) ) === 'gltf' ) {
			self::repair_gltf_sidecar_paths( $source_path, $target_dir );
		}

		return [
			'dir'         => $target_dir,
			'source_path' => $source_path,
		];
	}

	public static function cleanup_paths( array $paths ): void {
		$paths = array_unique( array_filter( array_map( 'strval', $paths ) ) );
		usort(
			$paths,
			static fn( string $a, string $b ): int => strlen( $b ) <=> strlen( $a )
		);

		foreach ( $paths as $path ) {
			if ( is_dir( $path ) ) {
				self::recursive_remove_directory( $path );
			} elseif ( is_file( $path ) ) {
				@unlink( $path );
			}
		}
	}

	public static function normalize_entry_name( string $entry ): string {
		return trim( str_replace( '\\', '/', $entry ) );
	}

	public static function is_safe_file_entry( string $entry ): bool {
		if ( '' === $entry || str_ends_with( $entry, '/' ) || str_starts_with( $entry, '/' ) || preg_match( '/^[A-Za-z]:\//', $entry ) ) {
			return false;
		}

		$parts = explode( '/', $entry );
		foreach ( $parts as $part ) {
			if ( '' === $part || '..' === $part ) {
				return false;
			}
		}

		$basename = basename( $entry );
		return ! (
			str_starts_with( $entry, '__MACOSX/' )
			|| str_starts_with( $basename, '._' )
			|| '.DS_Store' === $basename
		);
	}

	private static function inspect_glb_external_resources( ZipArchive $zip, string $raw_entry, string $local_entry, array $safe_entry_lookup ): array {
		$json = self::read_glb_json_from_zip_entry( $zip, $raw_entry );
		if ( is_wp_error( $json ) ) {
			return [
				'external_refs'    => [],
				'external_missing' => [],
				'error'            => $json->get_error_message(),
			];
		}

		$data = json_decode( $json, true );
		if ( ! is_array( $data ) ) {
			return [
				'external_refs'    => [],
				'external_missing' => [],
				'error'            => 'GLB JSON chunk could not be parsed.',
			];
		}

		$uris = [];
		foreach ( [ 'buffers', 'images' ] as $collection_key ) {
			foreach ( (array) ( $data[ $collection_key ] ?? [] ) as $item ) {
				if ( is_array( $item ) && isset( $item['uri'] ) ) {
					$uris[] = (string) $item['uri'];
				}
			}
		}

		$external_refs    = [];
		$external_missing = [];
		foreach ( array_unique( array_filter( array_map( 'trim', $uris ) ) ) as $uri ) {
			if ( self::is_embedded_uri( $uri ) ) {
				continue;
			}

			$resolved_entry = self::resolve_glb_resource_entry( $local_entry, $uri );
			$external_refs[] = $uri;
			if ( '' === $resolved_entry || empty( $safe_entry_lookup[ $resolved_entry ] ) ) {
				$external_missing[] = $uri;
			}
		}

		return [
			'external_refs'    => array_values( array_unique( $external_refs ) ),
			'external_missing' => array_values( array_unique( $external_missing ) ),
			'error'            => '',
		];
	}

	private static function read_glb_json_from_zip_entry( ZipArchive $zip, string $raw_entry ): string|WP_Error {
		$source = $zip->getStream( $raw_entry );
		if ( ! is_resource( $source ) ) {
			return new WP_Error( 'zip_stream_failed', 'Could not open GLB entry stream.' );
		}

		$header = self::read_stream_bytes( $source, 12 );
		if ( strlen( $header ) < 12 || substr( $header, 0, 4 ) !== 'glTF' ) {
			fclose( $source );
			return new WP_Error( 'invalid_glb', 'The GLB header is invalid.' );
		}

		while ( ! feof( $source ) ) {
			$chunk_header = self::read_stream_bytes( $source, 8 );
			if ( '' === $chunk_header ) {
				break;
			}
			if ( strlen( $chunk_header ) < 8 ) {
				fclose( $source );
				return new WP_Error( 'invalid_glb_chunk', 'The GLB chunk header is incomplete.' );
			}

			$length_parts = unpack( 'Vlength', substr( $chunk_header, 0, 4 ) );
			$chunk_length = (int) ( $length_parts['length'] ?? 0 );
			$chunk_type   = substr( $chunk_header, 4, 4 );
			if ( $chunk_length < 0 ) {
				fclose( $source );
				return new WP_Error( 'invalid_glb_chunk', 'The GLB chunk length is invalid.' );
			}

			if ( 'JSON' === $chunk_type ) {
				$json = self::read_stream_bytes( $source, $chunk_length );
				fclose( $source );
				if ( strlen( $json ) < $chunk_length ) {
					return new WP_Error( 'invalid_glb_json', 'The GLB JSON chunk is incomplete.' );
				}

				return trim( $json, " \t\r\n\0" );
			}

			self::skip_stream_bytes( $source, $chunk_length );
		}

		fclose( $source );
		return new WP_Error( 'missing_glb_json', 'The GLB JSON chunk is missing.' );
	}

	private static function read_stream_bytes( $source, int $length ): string {
		$data = '';
		while ( strlen( $data ) < $length && ! feof( $source ) ) {
			$chunk = fread( $source, min( 8192, $length - strlen( $data ) ) );
			if ( false === $chunk || '' === $chunk ) {
				break;
			}
			$data .= $chunk;
		}

		return $data;
	}

	private static function skip_stream_bytes( $source, int $length ): void {
		$remaining = $length;
		while ( $remaining > 0 && ! feof( $source ) ) {
			$chunk = fread( $source, min( 8192, $remaining ) );
			if ( false === $chunk || '' === $chunk ) {
				break;
			}
			$remaining -= strlen( $chunk );
		}
	}

	private static function is_embedded_uri( string $uri ): bool {
		return str_starts_with( strtolower( $uri ), 'data:' );
	}

	private static function repair_gltf_sidecar_paths( string $gltf_path, string $package_dir ): void {
		$data = json_decode( (string) file_get_contents( $gltf_path ), true );
		if ( ! is_array( $data ) ) {
			return;
		}

		$uris = [];
		foreach ( [ 'buffers', 'images' ] as $collection_key ) {
			foreach ( (array) ( $data[ $collection_key ] ?? [] ) as $item ) {
				if ( is_array( $item ) && isset( $item['uri'] ) ) {
					$uris[] = (string) $item['uri'];
				}
			}
		}

		$basename_index = self::build_extracted_basename_index( $package_dir );
		$extension_index = self::build_extracted_extension_index( $package_dir );
		$source_dir     = dirname( $gltf_path );
		foreach ( array_unique( array_filter( array_map( 'trim', $uris ) ) ) as $uri ) {
			if ( self::is_embedded_uri( $uri ) ) {
				continue;
			}

			$relative_path = self::normalize_entry_name( rawurldecode( preg_split( '/[?#]/', $uri )[0] ?? '' ) );
			if ( '' === $relative_path || str_starts_with( $relative_path, '/' ) || preg_match( '/^[a-z][a-z0-9+.-]*:/i', $relative_path ) || preg_match( '/^[A-Za-z]:\//', $relative_path ) ) {
				continue;
			}

			$expected_relative = self::collapse_relative_path( $relative_path );
			if ( '' === $expected_relative || ! self::is_safe_file_entry( $expected_relative ) ) {
				continue;
			}

			$expected_path = $source_dir . DIRECTORY_SEPARATOR . str_replace( '/', DIRECTORY_SEPARATOR, $expected_relative );
			if ( is_file( $expected_path ) ) {
				continue;
			}

			$expected_extension = strtolower( pathinfo( $expected_relative, PATHINFO_EXTENSION ) );
			$fallback = $basename_index[ strtolower( basename( $expected_relative ) ) ] ?? '';
			if ( '' === $fallback && $expected_extension && count( $extension_index[ $expected_extension ] ?? [] ) === 1 ) {
				$fallback = (string) $extension_index[ $expected_extension ][0];
			}
			if ( '' === $fallback || ! is_file( $fallback ) ) {
				continue;
			}

			$expected_parent = dirname( $expected_path );
			if ( ! is_dir( $expected_parent ) ) {
				wp_mkdir_p( $expected_parent );
			}
			if ( is_dir( $expected_parent ) ) {
				@copy( $fallback, $expected_path );
			}
		}
	}

	private static function build_extracted_basename_index( string $package_dir ): array {
		$index = [];
		if ( ! is_dir( $package_dir ) ) {
			return $index;
		}

		try {
			$items = new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator( $package_dir, FilesystemIterator::SKIP_DOTS ),
				RecursiveIteratorIterator::SELF_FIRST
			);
			foreach ( $items as $item ) {
				if ( ! $item->isFile() ) {
					continue;
				}
				$basename = strtolower( $item->getBasename() );
				$index[ $basename ] ??= $item->getPathname();
			}
		} catch ( UnexpectedValueException ) {
			return $index;
		}

		return $index;
	}

	private static function build_extracted_extension_index( string $package_dir ): array {
		$index = [];
		if ( ! is_dir( $package_dir ) ) {
			return $index;
		}

		try {
			$items = new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator( $package_dir, FilesystemIterator::SKIP_DOTS ),
				RecursiveIteratorIterator::SELF_FIRST
			);
			foreach ( $items as $item ) {
				if ( ! $item->isFile() ) {
					continue;
				}
				$extension = strtolower( pathinfo( $item->getBasename(), PATHINFO_EXTENSION ) );
				if ( '' === $extension ) {
					continue;
				}
				$index[ $extension ] ??= [];
				$index[ $extension ][] = $item->getPathname();
			}
		} catch ( UnexpectedValueException ) {
			return $index;
		}

		return $index;
	}

	private static function resolve_glb_resource_entry( string $local_entry, string $uri ): string {
		$path = preg_split( '/[?#]/', $uri )[0] ?? '';
		$path = self::normalize_entry_name( rawurldecode( $path ) );
		if ( '' === $path || str_starts_with( $path, '/' ) || preg_match( '/^[a-z][a-z0-9+.-]*:/i', $path ) || preg_match( '/^[A-Za-z]:\//', $path ) ) {
			return '';
		}

		$base_dir = self::normalize_entry_name( dirname( $local_entry ) );
		$combined = ( '.' === $base_dir || '' === $base_dir ) ? $path : $base_dir . '/' . $path;
		$normalized = self::collapse_relative_path( $combined );

		return self::is_safe_file_entry( $normalized ) ? $normalized : '';
	}

	private static function collapse_relative_path( string $path ): string {
		$parts = [];
		foreach ( explode( '/', self::normalize_entry_name( $path ) ) as $part ) {
			if ( '' === $part || '.' === $part ) {
				continue;
			}
			if ( '..' === $part ) {
				if ( empty( $parts ) ) {
					return '';
				}
				array_pop( $parts );
				continue;
			}
			$parts[] = $part;
		}

		return implode( '/', $parts );
	}

	private static function merge_scan_result( array &$base, array $child ): void {
		foreach ( [ 'temp_files', 'scan_errors' ] as $key ) {
			$base[ $key ] = array_merge( (array) ( $base[ $key ] ?? [] ), (array) ( $child[ $key ] ?? [] ) );
		}

		foreach ( [ 'safe_file_count', 'unsafe_entry_count', 'nested_zip_count', 'max_depth_zip_count', 'glb_count', 'zero_size_glb_count', 'glb_external_ref_count', 'glb_external_missing_count' ] as $key ) {
			$base[ $key ] = (int) ( $base[ $key ] ?? 0 ) + (int) ( $child[ $key ] ?? 0 );
		}

		foreach ( (array) ( $child['conversion_extension_counts'] ?? [] ) as $extension => $count ) {
			$base['conversion_extension_counts'][ $extension ] = ( $base['conversion_extension_counts'][ $extension ] ?? 0 ) + (int) $count;
		}

		if ( ! empty( $child['glb'] ) ) {
			$base['glb'] = self::select_better_glb(
				is_array( $base['glb'] ) ? $base['glb'] : null,
				(array) $child['glb']
			);
		}

		if ( ! empty( $child['candidate'] ) ) {
			$base['candidate'] = self::select_better_conversion_candidate(
				is_array( $base['candidate'] ) ? $base['candidate'] : null,
				(array) $child['candidate']
			);
		}
	}

	private static function select_better_glb( ?array $current, array $candidate ): array {
		if ( null === $current ) {
			return $candidate;
		}

		$current_missing   = ! empty( $current['external_missing'] );
		$candidate_missing = ! empty( $candidate['external_missing'] );
		if ( $current_missing !== $candidate_missing ) {
			return $candidate_missing ? $current : $candidate;
		}

		$current_size   = (int) ( $current['size'] ?? 0 );
		$candidate_size = (int) ( $candidate['size'] ?? 0 );
		if ( $candidate_size > $current_size ) {
			return $candidate;
		}

		if (
			$candidate_size === $current_size
			&& strcmp( (string) ( $candidate['display_entry'] ?? '' ), (string) ( $current['display_entry'] ?? '' ) ) < 0
		) {
			return $candidate;
		}

		return $current;
	}

	private static function select_better_conversion_candidate( ?array $current, array $candidate ): array {
		if ( null === $current ) {
			return $candidate;
		}

		$priority_map       = self::get_conversion_priority_map();
		$current_priority   = (int) ( $priority_map[ (string) ( $current['extension'] ?? '' ) ] ?? 999 );
		$candidate_priority = (int) ( $priority_map[ (string) ( $candidate['extension'] ?? '' ) ] ?? 999 );
		if ( $candidate_priority < $current_priority ) {
			return $candidate;
		}
		if ( $candidate_priority > $current_priority ) {
			return $current;
		}

		$current_size   = (int) ( $current['size'] ?? 0 );
		$candidate_size = (int) ( $candidate['size'] ?? 0 );
		if ( $candidate_size > $current_size ) {
			return $candidate;
		}
		if (
			$candidate_size === $current_size
			&& strcmp( (string) ( $candidate['display_entry'] ?? '' ), (string) ( $current['display_entry'] ?? '' ) ) < 0
		) {
			return $candidate;
		}

		return $current;
	}

	private static function get_conversion_priority_map(): array {
		return [
			'blend' => 0,
			'fbx'   => 1,
			'obj'   => 2,
			'dae'   => 3,
			'gltf'  => 4,
		];
	}

	private static function extract_entry_to_temp_file( ZipArchive $zip, string $entry ): string|WP_Error {
		$source = $zip->getStream( $entry );
		if ( ! is_resource( $source ) ) {
			return new WP_Error( 'zip_stream_failed', 'Could not open ZIP entry stream.' );
		}

		$tmp_path = self::create_temp_file( basename( $entry ) );
		if ( is_wp_error( $tmp_path ) ) {
			fclose( $source );
			return $tmp_path;
		}

		$target = fopen( $tmp_path, 'wb' );
		if ( ! $target ) {
			fclose( $source );
			@unlink( $tmp_path );
			return new WP_Error( 'fopen_failed', 'Could not open temp file for extracted GLB.' );
		}

		stream_copy_to_stream( $source, $target );
		fclose( $source );
		fclose( $target );

		return $tmp_path;
	}

	private static function create_temp_file( string $prefix ): string|WP_Error {
		$prefix = preg_replace( '/[^A-Za-z0-9_-]/', '-', $prefix );
		foreach ( self::temp_directory_candidates() as $temp_dir ) {
			$temp_dir = rtrim( (string) $temp_dir, "\\/" );
			if ( '' === $temp_dir ) {
				continue;
			}
			if ( ! is_dir( $temp_dir ) && ! wp_mkdir_p( $temp_dir ) ) {
				continue;
			}
			if ( ! is_writable( $temp_dir ) ) {
				continue;
			}

			$path = @tempnam( $temp_dir, $prefix ?: 'vrodos-' );
			if ( is_string( $path ) && '' !== $path ) {
				return $path;
			}
		}

		return new WP_Error( 'tmp_failed', 'Could not create a writable temporary file for ZIP extraction.' );
	}

	private static function temp_directory_candidates(): array {
		$candidates = [];
		$upload_dir = wp_upload_dir();
		if ( empty( $upload_dir['error'] ) && ! empty( $upload_dir['basedir'] ) ) {
			$candidates[] = trailingslashit( (string) $upload_dir['basedir'] ) . 'vrodos-asset-import-temp';
		}
		if ( function_exists( 'get_temp_dir' ) ) {
			$candidates[] = get_temp_dir();
		}
		$candidates[] = sys_get_temp_dir();

		return array_values( array_unique( array_filter( array_map( 'strval', $candidates ) ) ) );
	}

	private static function create_temp_directory( string $prefix ): string|WP_Error {
		$upload_dir = wp_upload_dir();
		if ( empty( $upload_dir['error'] ) && ! empty( $upload_dir['basedir'] ) ) {
			$temp_root = trailingslashit( (string) $upload_dir['basedir'] ) . 'vrodos-asset-import-temp';
			$base      = trailingslashit( $temp_root ) . $prefix . wp_generate_uuid4();
			if ( wp_mkdir_p( $base ) ) {
				return $base;
			}
		}

		$fallback = trailingslashit( get_temp_dir() ) . $prefix . wp_generate_uuid4();
		if ( wp_mkdir_p( $fallback ) ) {
			return $fallback;
		}

		return new WP_Error( 'tmp_dir_failed', 'Could not create temporary directory.' );
	}

	private static function recursive_remove_directory( string $dir ): void {
		if ( ! is_dir( $dir ) ) {
			return;
		}

		try {
			$items = new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator( $dir, RecursiveDirectoryIterator::SKIP_DOTS ),
				RecursiveIteratorIterator::CHILD_FIRST
			);

			foreach ( $items as $item ) {
				$path = $item->getPathname();
				if ( $item->isDir() ) {
					@rmdir( $path );
				} else {
					@unlink( $path );
				}
			}
		} catch ( UnexpectedValueException $exception ) {
			error_log( '[VRodos Asset Import] Could not inspect temp directory for cleanup: ' . $dir . ' - ' . $exception->getMessage() );
		}

		@rmdir( $dir );
	}
}
