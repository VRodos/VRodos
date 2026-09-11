<?php

/** Read-only GLB inspection and recommendation calculations, independent of admin/queue state. */
class VRodos_Glb_Analysis {
	public const GLB_MAGIC = 'glTF';
	public const GLB_VERSION = 2;
	public const GLB_JSON_CHUNK = 0x4E4F534A;
	public const GLTF_TRIANGLES_MODE = 4;
	public const GLTF_TRIANGLE_STRIP_MODE = 5;
	public const GLTF_TRIANGLE_FAN_MODE = 6;

	public static function read_glb_json( string $path ) {
		$handle = fopen( $path, 'rb' );
		if ( false === $handle ) {
			return new WP_Error( 'vrodos_glb_analysis_open_failed', 'Could not open GLB for analysis.' );
		}

		$header = fread( $handle, 12 );
		if ( ! is_string( $header ) || strlen( $header ) < 12 ) {
			fclose( $handle );
			return new WP_Error( 'vrodos_glb_analysis_short_header', 'GLB header is incomplete.' );
		}

		if ( substr( $header, 0, 4 ) !== self::GLB_MAGIC ) {
			fclose( $handle );
			return new WP_Error( 'vrodos_glb_analysis_bad_magic', 'File is not a binary GLB.' );
		}

		$version = self::read_uint32_le( substr( $header, 4, 4 ) );
		$length  = self::read_uint32_le( substr( $header, 8, 4 ) );
		if ( self::GLB_VERSION !== $version ) {
			fclose( $handle );
			return new WP_Error( 'vrodos_glb_analysis_bad_version', 'Only GLB version 2 can be analyzed.' );
		}

		$offset = 12;
		while ( $offset + 8 <= $length && ! feof( $handle ) ) {
			$chunk_header = fread( $handle, 8 );
			if ( ! is_string( $chunk_header ) || strlen( $chunk_header ) < 8 ) {
				break;
			}

			$chunk_length = self::read_uint32_le( substr( $chunk_header, 0, 4 ) );
			$chunk_type   = self::read_uint32_le( substr( $chunk_header, 4, 4 ) );
			$offset      += 8;

			if ( self::GLB_JSON_CHUNK === $chunk_type ) {
				$json_text = fread( $handle, $chunk_length );
				fclose( $handle );
				if ( ! is_string( $json_text ) ) {
					return new WP_Error( 'vrodos_glb_analysis_json_read_failed', 'Could not read GLB JSON chunk.' );
				}

				$decoded = json_decode( trim( $json_text ), true );
				if ( ! is_array( $decoded ) ) {
					return new WP_Error( 'vrodos_glb_analysis_json_invalid', 'GLB JSON chunk is invalid.' );
				}

				return $decoded;
			}

			if ( 0 !== fseek( $handle, $chunk_length, SEEK_CUR ) ) {
				fclose( $handle );
				return new WP_Error( 'vrodos_glb_analysis_seek_failed', 'GLB chunk table is invalid.' );
			}
			$offset += $chunk_length;
		}

		fclose( $handle );
		return new WP_Error( 'vrodos_glb_analysis_json_missing', 'GLB does not contain a JSON chunk.' );
	}

	private static function read_uint32_le( string $bytes ): int {
		$value = unpack( 'Vvalue', $bytes );
		return is_array( $value ) ? (int) $value['value'] : 0;
	}

	public static function analyze_gltf_json( array $gltf ): array {
		$meshes       = is_array( $gltf['meshes'] ?? null ) ? $gltf['meshes'] : [];
		$nodes        = is_array( $gltf['nodes'] ?? null ) ? $gltf['nodes'] : [];
		$materials    = is_array( $gltf['materials'] ?? null ) ? $gltf['materials'] : [];
		$textures     = is_array( $gltf['textures'] ?? null ) ? $gltf['textures'] : [];
		$images       = is_array( $gltf['images'] ?? null ) ? $gltf['images'] : [];
		$animations   = is_array( $gltf['animations'] ?? null ) ? $gltf['animations'] : [];
		$buffers      = is_array( $gltf['buffers'] ?? null ) ? $gltf['buffers'] : [];
		$buffer_views = is_array( $gltf['bufferViews'] ?? null ) ? $gltf['bufferViews'] : [];
		$accessors    = is_array( $gltf['accessors'] ?? null ) ? $gltf['accessors'] : [];
		$extensions   = self::extension_set( $gltf );
		$used_materials = [];
		$geometry_buffer_views = [];
		$image_buffer_views = [];
		$uncompressed_image_buffer_views = [];
		$basis_image_indices = [];
		$primitive_count = 0;
		$indexed_primitive_count = 0;
		$vertex_count = 0;
		$submitted_vertex_count = 0;
		$estimated_triangles = 0;
		$max_primitive_submitted_count = 0;
		$max_primitive_triangles = 0;

		foreach ( $meshes as $mesh ) {
			foreach ( is_array( $mesh['primitives'] ?? null ) ? $mesh['primitives'] : [] as $primitive ) {
				if ( ! is_array( $primitive ) ) {
					continue;
				}
				++$primitive_count;
				$mode = isset( $primitive['mode'] ) ? (int) $primitive['mode'] : self::GLTF_TRIANGLES_MODE;
				if ( isset( $primitive['indices'] ) ) {
					++$indexed_primitive_count;
					$buffer_view = self::accessor_buffer_view( $accessors, (int) $primitive['indices'] );
					if ( null !== $buffer_view ) {
						$geometry_buffer_views[ $buffer_view ] = true;
					}
				}
				if ( isset( $primitive['material'] ) ) {
					$used_materials[ (int) $primitive['material'] ] = true;
				}
				foreach ( is_array( $primitive['attributes'] ?? null ) ? $primitive['attributes'] : [] as $accessor_index ) {
					$buffer_view = self::accessor_buffer_view( $accessors, (int) $accessor_index );
					if ( null !== $buffer_view ) {
						$geometry_buffer_views[ $buffer_view ] = true;
					}
				}
				foreach ( array_keys( is_array( $primitive['extensions'] ?? null ) ? $primitive['extensions'] : [] ) as $extension_name ) {
					$extensions[ (string) $extension_name ] = true;
				}

				$submitted = self::primitive_submitted_count( $accessors, $primitive );
				$vertices  = self::primitive_vertex_count( $accessors, $primitive );
				$triangles = self::estimate_primitive_triangles( $mode, $submitted );
				$submitted_vertex_count += $submitted;
				$vertex_count += $vertices;
				$estimated_triangles += $triangles;
				$max_primitive_submitted_count = max( $max_primitive_submitted_count, $submitted );
				$max_primitive_triangles = max( $max_primitive_triangles, $triangles );
			}
		}

		foreach ( $textures as $texture ) {
			$basis_source = is_array( $texture ) ? ( $texture['extensions']['KHR_texture_basisu']['source'] ?? null ) : null;
			if ( null !== $basis_source ) {
				$basis_image_indices[ (int) $basis_source ] = true;
			}
		}

		foreach ( $images as $image_index => $image ) {
			if ( is_array( $image ) && isset( $image['bufferView'] ) ) {
				$image_buffer_views[ (int) $image['bufferView'] ] = true;
				if ( empty( $basis_image_indices[ (int) $image_index ] ) ) {
					$uncompressed_image_buffer_views[ (int) $image['bufferView'] ] = true;
				}
			}
		}

		$buffer_bytes = 0;
		foreach ( $buffers as $buffer ) {
			$buffer_bytes += is_array( $buffer ) ? (int) ( $buffer['byteLength'] ?? 0 ) : 0;
		}

		$geometry_bytes = self::sum_buffer_view_bytes( $buffer_views, array_keys( $geometry_buffer_views ) );
		$image_bytes    = self::sum_buffer_view_bytes( $buffer_views, array_keys( $image_buffer_views ) );
		$uncompressed_image_bytes = self::sum_buffer_view_bytes( $buffer_views, array_keys( $uncompressed_image_buffer_views ) );
		$extension_names = array_keys( $extensions );
		sort( $extension_names );

		return [
			'assetVersion' => (string) ( $gltf['asset']['version'] ?? '' ),
			'generator'    => (string) ( $gltf['asset']['generator'] ?? '' ),
			'counts'       => [
				'nodes'             => count( $nodes ),
				'meshes'            => count( $meshes ),
				'primitives'        => $primitive_count,
				'indexedPrimitives' => $indexed_primitive_count,
				'materials'         => count( $materials ),
				'usedMaterials'     => count( $used_materials ),
				'textures'          => count( $textures ),
				'images'            => count( $images ),
				'animations'        => count( $animations ),
			],
			'geometry'     => [
				'estimatedTriangles'          => $estimated_triangles,
				'vertexCount'                 => $vertex_count,
				'submittedVertexCount'        => $submitted_vertex_count,
				'maxPrimitiveSubmittedCount'  => $max_primitive_submitted_count,
				'maxPrimitiveTriangles'       => $max_primitive_triangles,
				'estimatedGeometryBytes'      => $geometry_bytes,
			],
			'payload'      => [
				'declaredBufferBytes' => $buffer_bytes,
				'estimatedImageBytes' => $image_bytes,
				'estimatedUncompressedImageBytes' => $uncompressed_image_bytes,
			],
			'extensions'   => [
				'used'                   => $extension_names,
				'hasMeshopt'             => ! empty( $extensions['EXT_meshopt_compression'] ),
				'hasDraco'               => ! empty( $extensions['KHR_draco_mesh_compression'] ),
				'hasKtx2'                => ! empty( $extensions['KHR_texture_basisu'] ),
				'hasGeometryCompression' => ! empty( $extensions['EXT_meshopt_compression'] ) || ! empty( $extensions['KHR_draco_mesh_compression'] ),
				'hasTextureCompression'  => ! empty( $extensions['KHR_texture_basisu'] ),
			],
		];
	}

	private static function extension_set( array $gltf ): array {
		$extensions = [];
		foreach ( [ 'extensionsUsed', 'extensionsRequired' ] as $key ) {
			foreach ( is_array( $gltf[ $key ] ?? null ) ? $gltf[ $key ] : [] as $extension_name ) {
				$extensions[ (string) $extension_name ] = true;
			}
		}
		return $extensions;
	}

	private static function accessor_buffer_view( array $accessors, int $accessor_index ): ?int {
		if ( ! isset( $accessors[ $accessor_index ] ) || ! is_array( $accessors[ $accessor_index ] ) ) {
			return null;
		}
		return isset( $accessors[ $accessor_index ]['bufferView'] ) ? (int) $accessors[ $accessor_index ]['bufferView'] : null;
	}

	private static function sum_buffer_view_bytes( array $buffer_views, array $indices ): int {
		$total = 0;
		foreach ( $indices as $index ) {
			if ( isset( $buffer_views[ $index ] ) && is_array( $buffer_views[ $index ] ) ) {
				$total += (int) ( $buffer_views[ $index ]['byteLength'] ?? 0 );
			}
		}
		return $total;
	}

	private static function primitive_submitted_count( array $accessors, array $primitive ): int {
		if ( isset( $primitive['indices'] ) && isset( $accessors[ (int) $primitive['indices'] ] ) && is_array( $accessors[ (int) $primitive['indices'] ] ) ) {
			return (int) ( $accessors[ (int) $primitive['indices'] ]['count'] ?? 0 );
		}

		$position = $primitive['attributes']['POSITION'] ?? null;
		if ( null !== $position && isset( $accessors[ (int) $position ] ) && is_array( $accessors[ (int) $position ] ) ) {
			return (int) ( $accessors[ (int) $position ]['count'] ?? 0 );
		}

		return 0;
	}

	private static function primitive_vertex_count( array $accessors, array $primitive ): int {
		$position = $primitive['attributes']['POSITION'] ?? null;
		if ( null !== $position && isset( $accessors[ (int) $position ] ) && is_array( $accessors[ (int) $position ] ) ) {
			return (int) ( $accessors[ (int) $position ]['count'] ?? 0 );
		}
		return 0;
	}

	private static function estimate_primitive_triangles( int $mode, int $submitted_count ): int {
		if ( $submitted_count <= 0 ) {
			return 0;
		}
		if ( self::GLTF_TRIANGLES_MODE === $mode ) {
			return (int) floor( $submitted_count / 3 );
		}
		if ( self::GLTF_TRIANGLE_STRIP_MODE === $mode || self::GLTF_TRIANGLE_FAN_MODE === $mode ) {
			return max( 0, $submitted_count - 2 );
		}
		return 0;
	}

	public static function recommendations_for_analysis( array $analysis ): array {
		$size_bytes     = (int) ( $analysis['sourceSizeBytes'] ?? 0 );
		$triangles      = (int) ( $analysis['geometry']['estimatedTriangles'] ?? 0 );
		$primitives     = (int) ( $analysis['counts']['primitives'] ?? 0 );
		$materials      = (int) ( $analysis['counts']['usedMaterials'] ?? $analysis['counts']['materials'] ?? 0 );
		$images         = (int) ( $analysis['counts']['images'] ?? 0 );
		$geometry_bytes = (int) ( $analysis['geometry']['estimatedGeometryBytes'] ?? 0 );
		$image_bytes    = (int) ( $analysis['payload']['estimatedUncompressedImageBytes'] ?? $analysis['payload']['estimatedImageBytes'] ?? 0 );
		$extensions     = is_array( $analysis['extensions'] ?? null ) ? $analysis['extensions'] : [];
		$flags          = [];
		$reasons        = [];
		$recommendations = self::empty_recommendations();

		if ( $size_bytes >= 50 * 1024 * 1024 ) {
			$flags[] = 'very_large_file';
		} elseif ( $size_bytes >= 20 * 1024 * 1024 ) {
			$flags[] = 'large_file';
		}
		if ( $triangles >= 500000 ) {
			$flags[] = 'high_triangles';
		} elseif ( $triangles >= 100000 ) {
			$flags[] = 'moderate_high_triangles';
		}
		if ( $primitives >= 100 ) {
			$flags[] = 'many_primitives';
		}
		if ( $materials >= 20 ) {
			$flags[] = 'many_materials';
		}

		$geometry_meaningful = $geometry_bytes >= 1024 * 1024 || $triangles >= 50000 || $primitives >= 50 || ( $size_bytes >= 5 * 1024 * 1024 && $triangles >= 10000 );
		if ( empty( $extensions['hasGeometryCompression'] ) && $geometry_meaningful ) {
			$flags[] = 'missing_geometry_compression';
			$recommendations['geometryDerivative'] = true;
			$reasons[] = 'Source has meaningful geometry and no Draco/Meshopt compression.';
		}

		$texture_payload_likely = $image_bytes >= 8 * 1024 * 1024
			|| ( $size_bytes >= 20 * 1024 * 1024 && $images > 0 && ( 0 === $geometry_bytes || $geometry_bytes < (int) ( $size_bytes * 0.45 ) ) );
		if ( $images > 0 && $image_bytes > 0 && $texture_payload_likely ) {
			$flags[] = 'missing_texture_compression';
			$recommendations['textureDerivative'] = true;
			$reasons[] = 'Texture payload appears significant and no KTX2/Basis texture compression is present.';
		}

		if ( $triangles >= 100000 || $primitives >= 100 || (int) ( $analysis['geometry']['maxPrimitiveTriangles'] ?? 0 ) >= 50000 ) {
			$flags[] = 'lod_candidate';
			$recommendations['lodDerivative'] = true;
			$reasons[] = 'Geometry is large enough to benefit from explicit distance-based LOD candidates.';
		}

		if ( ! $recommendations['geometryDerivative'] && ! $recommendations['textureDerivative'] && ! $recommendations['lodDerivative'] ) {
			$reasons[] = empty( $extensions['hasGeometryCompression'] ) ? 'No high-benefit derivative target was detected.' : 'Geometry compression is already present or the asset is small.';
		}

		return [
			'flags'           => array_values( array_unique( $flags ) ),
			'recommendations' => $recommendations,
			'reasons'         => $reasons,
			'suggestedAction' => self::suggested_action_for_recommendations( $recommendations ),
		];
	}

	public static function empty_recommendations(): array {
		return [
			'geometryDerivative' => false,
			'textureDerivative'  => false,
			'lodDerivative'      => false,
		];
	}

	private static function suggested_action_for_recommendations( array $recommendations ): string {
		if ( ! empty( $recommendations['geometryDerivative'] ) || ! empty( $recommendations['textureDerivative'] ) ) {
			return 'Prepare the automatic Web High KTX2/Draco derivative.';
		}
		if ( ! empty( $recommendations['lodDerivative'] ) ) {
			return 'Plan explicit LOD derivatives and distance bands.';
		}
		return 'No derivative is recommended by the cheap analysis.';
	}
}

