<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Converts archived glTF material workflows before a GLB becomes an authoring source. */
final class VRodos_Asset_Import_Glb_Normalizer {
	public const LEGACY_EXTENSION        = 'KHR_materials_pbrSpecularGlossiness';
	public const CONVERSION_TOOL         = 'gltf-transform';
	public const CONVERSION_VERSION      = 'gltf-transform-4.4.2-metalrough-v1';
	public const CONVERSION_TOOL_META    = '_vrodos_asset_import_conversion_tool';
	public const CONVERSION_VERSION_META = '_vrodos_asset_import_conversion_version';

	private const GLB_MAGIC       = 'glTF';
	private const GLB_VERSION     = 2;
	private const JSON_CHUNK      = 0x4E4F534A;
	private const TIMEOUT_SECONDS = 600;

	/**
	 * Convert a legacy specular/glossiness GLB to metallic/roughness when needed.
	 *
	 * @return array{path:string,converted:bool,tool:string,version:string,diagnostic:string,inspection:array}|WP_Error
	 */
	public static function normalize( string $source_path, string $output_path ): array|WP_Error {
		$inspection = self::inspect_file( $source_path );
		if ( is_wp_error( $inspection ) ) {
			return $inspection;
		}

		if ( empty( $inspection['hasLegacySpecularGlossiness'] ) ) {
			return [
				'path'       => $source_path,
				'converted'  => false,
				'tool'       => '',
				'version'    => '',
				'diagnostic' => 'GLB material workflow is runtime-compatible.',
				'inspection' => $inspection,
			];
		}

		if ( '' === $output_path || wp_normalize_path( $output_path ) === wp_normalize_path( $source_path ) ) {
			return new WP_Error( 'vrodos_glb_normalizer_output_invalid', 'Legacy GLB conversion requires a separate output file.' );
		}
		$source_dir = realpath( dirname( $source_path ) );
		$output_dir = realpath( dirname( $output_path ) );
		if (
			false === $source_dir
			|| false === $output_dir
			|| wp_normalize_path( $source_dir ) !== wp_normalize_path( $output_dir )
			|| 'glb' !== strtolower( pathinfo( $output_path, PATHINFO_EXTENSION ) )
		) {
			return new WP_Error( 'vrodos_glb_normalizer_output_invalid', 'Legacy GLB conversion output must be a GLB beside the staged source.' );
		}
		if ( file_exists( $output_path ) ) {
			return new WP_Error( 'vrodos_glb_normalizer_output_exists', 'Legacy GLB conversion refused to overwrite an existing file.' );
		}

		$conversion = self::run_metalrough_conversion( $source_path, $output_path );
		if ( is_wp_error( $conversion ) ) {
			self::delete_generated_output( $output_path );
			return $conversion;
		}

		$output_inspection = self::inspect_file( $output_path );
		if ( is_wp_error( $output_inspection ) ) {
			self::delete_generated_output( $output_path );
			return new WP_Error( 'vrodos_glb_normalizer_output_invalid', 'Converted GLB validation failed: ' . $output_inspection->get_error_message() );
		}
		if ( ! empty( $output_inspection['hasLegacySpecularGlossiness'] ) ) {
			self::delete_generated_output( $output_path );
			return new WP_Error( 'vrodos_glb_normalizer_extension_remained', 'Converted GLB still declares the archived specular/glossiness material extension.' );
		}

		return [
			'path'       => $output_path,
			'converted'  => true,
			'tool'       => self::CONVERSION_TOOL,
			'version'    => self::CONVERSION_VERSION,
			'diagnostic' => 'Converted archived KHR_materials_pbrSpecularGlossiness materials to metallic/roughness.',
			'inspection' => $output_inspection,
		];
	}

	/** @return array{hasLegacySpecularGlossiness:bool,hasMetallicRoughness:bool,extensionsUsed:array,extensionsRequired:array,generator:string}|WP_Error */
	public static function inspect_file( string $path ): array|WP_Error {
		$json = self::read_glb_json( $path );
		if ( is_wp_error( $json ) ) {
			return $json;
		}

		$used     = self::string_list( $json['extensionsUsed'] ?? [] );
		$required = self::string_list( $json['extensionsRequired'] ?? [] );
		$legacy   = in_array( self::LEGACY_EXTENSION, $used, true ) || in_array( self::LEGACY_EXTENSION, $required, true );
		$has_metallic_roughness = false;

		foreach ( is_array( $json['materials'] ?? null ) ? $json['materials'] : [] as $material ) {
			if ( ! is_array( $material ) ) {
				continue;
			}
			if ( isset( $material['pbrMetallicRoughness'] ) ) {
				$has_metallic_roughness = true;
			}
			if ( isset( $material['extensions'][ self::LEGACY_EXTENSION ] ) ) {
				$legacy = true;
			}
		}

		return [
			'hasLegacySpecularGlossiness' => $legacy,
			'hasMetallicRoughness'         => $has_metallic_roughness,
			'extensionsUsed'               => $used,
			'extensionsRequired'           => $required,
			'generator'                    => sanitize_text_field( (string) ( $json['asset']['generator'] ?? '' ) ),
		];
	}

	public static function record_asset_result( int $asset_id, array $result ): void {
		if ( $asset_id <= 0 ) {
			return;
		}

		if ( ! empty( $result['converted'] ) ) {
			update_post_meta( $asset_id, self::CONVERSION_TOOL_META, self::CONVERSION_TOOL );
			update_post_meta( $asset_id, self::CONVERSION_VERSION_META, self::CONVERSION_VERSION );
			return;
		}

		delete_post_meta( $asset_id, self::CONVERSION_TOOL_META );
		delete_post_meta( $asset_id, self::CONVERSION_VERSION_META );
	}

	private static function read_glb_json( string $path ): array|WP_Error {
		if ( '' === $path || ! is_file( $path ) ) {
			return new WP_Error( 'vrodos_glb_normalizer_missing', 'GLB file does not exist.' );
		}

		$handle = @fopen( $path, 'rb' );
		if ( ! is_resource( $handle ) ) {
			return new WP_Error( 'vrodos_glb_normalizer_open_failed', 'GLB file could not be opened.' );
		}

		$header = fread( $handle, 12 );
		if ( 12 !== strlen( $header ) || self::GLB_MAGIC !== substr( $header, 0, 4 ) ) {
			fclose( $handle );
			return new WP_Error( 'vrodos_glb_normalizer_header_invalid', 'File is not a valid binary GLB.' );
		}
		if ( self::GLB_VERSION !== self::uint32_le( substr( $header, 4, 4 ) ) ) {
			fclose( $handle );
			return new WP_Error( 'vrodos_glb_normalizer_version_invalid', 'Only GLB version 2 can be normalized.' );
		}

		$declared_length = self::uint32_le( substr( $header, 8, 4 ) );
		$file_size       = filesize( $path );
		if ( $declared_length < 20 || false === $file_size || $declared_length > (int) $file_size ) {
			fclose( $handle );
			return new WP_Error( 'vrodos_glb_normalizer_length_invalid', 'GLB length declaration is invalid.' );
		}

		$chunk_header = fread( $handle, 8 );
		if ( 8 !== strlen( $chunk_header ) || self::JSON_CHUNK !== self::uint32_le( substr( $chunk_header, 4, 4 ) ) ) {
			fclose( $handle );
			return new WP_Error( 'vrodos_glb_normalizer_json_missing', 'GLB JSON chunk is missing.' );
		}

		$json_length = self::uint32_le( substr( $chunk_header, 0, 4 ) );
		if ( $json_length <= 0 || 20 + $json_length > $declared_length ) {
			fclose( $handle );
			return new WP_Error( 'vrodos_glb_normalizer_json_length_invalid', 'GLB JSON chunk length is invalid.' );
		}

		$json_bytes = fread( $handle, $json_length );
		fclose( $handle );
		if ( strlen( $json_bytes ) !== $json_length ) {
			return new WP_Error( 'vrodos_glb_normalizer_json_incomplete', 'GLB JSON chunk is incomplete.' );
		}

		$decoded = json_decode( rtrim( $json_bytes, " \t\r\n\0" ), true );
		return is_array( $decoded )
			? $decoded
			: new WP_Error( 'vrodos_glb_normalizer_json_invalid', 'GLB JSON chunk is invalid.' );
	}

	private static function run_metalrough_conversion( string $source_path, string $output_path ): array|WP_Error {
		if ( ! function_exists( 'proc_open' ) ) {
			return new WP_Error( 'vrodos_glb_normalizer_process_disabled', 'Legacy GLB conversion requires PHP proc_open.' );
		}

		$cli_path = VRodos_Path_Manager::plugin_path( 'node_modules/@gltf-transform/cli/bin/cli.js' );
		if ( ! is_file( $cli_path ) ) {
			return new WP_Error( 'vrodos_glb_normalizer_cli_missing', 'Legacy GLB conversion requires the installed @gltf-transform/cli package.' );
		}

		$node = trim( (string) apply_filters( 'vrodos_asset_optimizer_node_command', 'node' ) );
		if ( '' === $node ) {
			return new WP_Error( 'vrodos_glb_normalizer_node_missing', 'Legacy GLB conversion requires a configured Node.js executable.' );
		}

		$descriptors = [
			0 => [ 'pipe', 'r' ],
			1 => [ 'pipe', 'w' ],
			2 => [ 'pipe', 'w' ],
		];
		$process = @proc_open(
			[ $node, $cli_path, 'metalrough', $source_path, $output_path ],
			$descriptors,
			$pipes,
			dirname( $cli_path ),
			null,
			[ 'bypass_shell' => true ]
		);
		if ( ! is_resource( $process ) ) {
			return new WP_Error( 'vrodos_glb_normalizer_process_failed', 'Legacy GLB conversion process could not be started.' );
		}

		fclose( $pipes[0] );
		stream_set_blocking( $pipes[1], false );
		stream_set_blocking( $pipes[2], false );
		$stdout    = '';
		$stderr    = '';
		$started   = time();
		$exit_code = null;
		$timed_out = false;
		$timeout   = max( 30, (int) apply_filters( 'vrodos_asset_legacy_material_conversion_timeout', self::TIMEOUT_SECONDS ) );

		while ( true ) {
			$stdout .= (string) stream_get_contents( $pipes[1] );
			$stderr .= (string) stream_get_contents( $pipes[2] );
			$status = proc_get_status( $process );
			if ( empty( $status['running'] ) ) {
				$exit_code = isset( $status['exitcode'] ) ? (int) $status['exitcode'] : null;
				break;
			}
			if ( time() - $started > $timeout ) {
				$timed_out = true;
				@proc_terminate( $process );
				break;
			}
			usleep( 100000 );
		}

		$stdout .= (string) stream_get_contents( $pipes[1] );
		$stderr .= (string) stream_get_contents( $pipes[2] );
		fclose( $pipes[1] );
		fclose( $pipes[2] );
		$close_code = proc_close( $process );
		if ( null === $exit_code || $exit_code < 0 ) {
			$exit_code = (int) $close_code;
		}

		if ( $timed_out ) {
			return new WP_Error( 'vrodos_glb_normalizer_timeout', 'Legacy GLB material conversion timed out.' );
		}
		if ( 0 !== $exit_code || ! is_file( $output_path ) ) {
			$output = trim( $stderr . "\n" . $stdout );
			if ( strlen( $output ) > 2000 ) {
				$output = substr( $output, -2000 );
			}
			return new WP_Error(
				'vrodos_glb_normalizer_conversion_failed',
				'Legacy GLB material conversion failed.' . ( '' !== $output ? ' ' . $output : '' )
			);
		}

		return [ 'success' => true ];
	}

	private static function string_list( $value ): array {
		return array_values( array_unique( array_map( 'strval', is_array( $value ) ? $value : [] ) ) );
	}

	private static function uint32_le( string $bytes ): int {
		$value = unpack( 'Vvalue', $bytes );
		return is_array( $value ) ? (int) $value['value'] : 0;
	}

	private static function delete_generated_output( string $path ): void {
		if ( '' !== $path && is_file( $path ) ) {
			wp_delete_file( $path );
		}
	}
}
