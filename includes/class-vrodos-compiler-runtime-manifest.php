<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_Runtime_Manifest {
	private const DEFAULT_RELATIVE_PATH = 'assets/runtime-build-manifest.json';

	private array $manifest;
	private bool $validate_files = false;

	public function __construct( ?string $manifest_path = null, ?array $manifest = null ) {
		if ( null !== $manifest ) {
			$this->manifest = $this->validate_manifest( $manifest );
			return;
		}

		$path = $manifest_path ?: VRodos_Path_Manager::plugin_path( self::DEFAULT_RELATIVE_PATH );
		$this->validate_files = true;
		if ( ! is_readable( $path ) ) {
			throw new RuntimeException( '[VRodos] Runtime build manifest is missing: ' . $path );
		}

		$decoded = json_decode( (string) file_get_contents( $path ), true );
		if ( ! is_array( $decoded ) ) {
			throw new RuntimeException( '[VRodos] Runtime build manifest is invalid JSON: ' . $path );
		}

		$this->manifest = $this->validate_manifest( $decoded );
	}

	public function chunk( string $chunk_id ): array {
		$chunks = $this->manifest['chunks'];
		if ( ! isset( $chunks[ $chunk_id ] ) || ! is_array( $chunks[ $chunk_id ] ) ) {
			throw new RuntimeException( '[VRodos] Runtime chunk is not declared in manifest: ' . $chunk_id );
		}

		return $chunks[ $chunk_id ];
	}

	public function resolve_chunk_ids( array $requested_ids ): array {
		$resolved = [];
		foreach ( $requested_ids as $chunk_id ) {
			$this->append_chunk_with_dependencies( (string) $chunk_id, $resolved );
		}

		usort(
			$resolved,
			function ( string $left, string $right ): int {
				$left_chunk  = $this->chunk( $left );
				$right_chunk = $this->chunk( $right );
				$order_delta = (int) $left_chunk['order'] <=> (int) $right_chunk['order'];
				if ( 0 !== $order_delta ) {
					return $order_delta;
				}

				return strcmp( $left, $right );
			}
		);

		return array_values( $resolved );
	}

	public function chunks_for_ids( array $chunk_ids ): array {
		return array_map(
			function ( string $chunk_id ): array {
				return $this->chunk( $chunk_id );
			},
			$chunk_ids
		);
	}

	private function append_chunk_with_dependencies( string $chunk_id, array &$resolved ): void {
		$chunk = $this->chunk( $chunk_id );
		foreach ( (array) ( $chunk['dependencies'] ?? [] ) as $dependency_id ) {
			$this->append_chunk_with_dependencies( (string) $dependency_id, $resolved );
		}

		if ( ! in_array( $chunk_id, $resolved, true ) ) {
			$resolved[] = $chunk_id;
		}
	}

	private function validate_manifest( array $manifest ): array {
		if ( (int) ( $manifest['schemaVersion'] ?? 0 ) !== 1 ) {
			throw new RuntimeException( '[VRodos] Unsupported runtime build manifest schema.' );
		}

		if ( ! isset( $manifest['chunks'] ) || ! is_array( $manifest['chunks'] ) ) {
			throw new RuntimeException( '[VRodos] Runtime build manifest has no chunks.' );
		}

		$order_to_chunk_id = [];
		foreach ( $manifest['chunks'] as $chunk_id => $chunk ) {
			if ( ! is_array( $chunk ) ) {
				throw new RuntimeException( '[VRodos] Runtime chunk entry is invalid: ' . $chunk_id );
			}

			if ( (string) ( $chunk['id'] ?? '' ) !== (string) $chunk_id ) {
				throw new RuntimeException( '[VRodos] Runtime chunk id mismatch: ' . $chunk_id );
			}

			if ( empty( $chunk['type'] ) || ! isset( $chunk['order'] ) ) {
				throw new RuntimeException( '[VRodos] Runtime chunk is missing type/order: ' . $chunk_id );
			}

			$order = (int) $chunk['order'];
			if ( isset( $order_to_chunk_id[ $order ] ) ) {
				throw new RuntimeException( '[VRodos] Runtime chunks share order ' . $order . ': ' . $order_to_chunk_id[ $order ] . ', ' . $chunk_id );
			}
			$order_to_chunk_id[ $order ] = (string) $chunk_id;

			if ( ! isset( $chunk['features'] ) || ! is_array( $chunk['features'] ) || empty( $chunk['features'] ) ) {
				throw new RuntimeException( '[VRodos] Runtime chunk has no feature coverage declaration: ' . $chunk_id );
			}

			if ( 'script' === $chunk['type'] && empty( $chunk['src'] ) ) {
				throw new RuntimeException( '[VRodos] Runtime script chunk is missing src: ' . $chunk_id );
			}

			if ( 'inline-module' === $chunk['type'] && empty( $chunk['moduleImport'] ) ) {
				throw new RuntimeException( '[VRodos] Runtime inline module chunk is missing moduleImport: ' . $chunk_id );
			}

			foreach ( (array) ( $chunk['dependencies'] ?? [] ) as $dependency_id ) {
				if ( ! isset( $manifest['chunks'][ (string) $dependency_id ] ) ) {
					throw new RuntimeException( '[VRodos] Runtime chunk has an undeclared dependency: ' . $chunk_id . ' -> ' . (string) $dependency_id );
				}
			}

			if ( $this->validate_files && 'script' === $chunk['type'] ) {
				$this->validate_chunk_file_exists( $manifest, (string) $chunk_id, $chunk );
			}
		}

		return $manifest;
	}

	private function validate_chunk_file_exists( array $manifest, string $chunk_id, array $chunk ): void {
		$file = (string) ( $chunk['file'] ?? '' );
		if ( '' === $file ) {
			throw new RuntimeException( '[VRodos] Runtime script chunk is missing file: ' . $chunk_id );
		}

		$runtime_root = (string) ( $manifest['runtimeRoot'] ?? '' );
		$relative     = ltrim( str_replace( '\\', '/', $runtime_root . '/' . $file ), '/' );
		$path         = class_exists( 'VRodos_Path_Manager' )
			? VRodos_Path_Manager::plugin_path( $relative )
			: dirname( __DIR__ ) . '/' . $relative;

		if ( ! is_readable( $path ) ) {
			throw new RuntimeException( '[VRodos] Runtime script chunk file is missing: ' . $chunk_id . ' at ' . $path );
		}
	}
}
