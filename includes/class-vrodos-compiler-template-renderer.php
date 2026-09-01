<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-compiler-types.php';

class VRodos_Compiler_Template_Renderer {
	private bool $capture_enabled = false;
	/** @var array<string, VRodos_Compile_Artifact> */
	private array $captured_artifacts = [];

	public function begin_capture(): void {
		$this->capture_enabled   = true;
		$this->captured_artifacts = [];
	}

	/** @return VRodos_Compile_Artifact[] */
	public function finish_capture(): array {
		$artifacts                 = array_values( $this->captured_artifacts );
		$this->captured_artifacts  = [];
		$this->capture_enabled     = false;
		return $artifacts;
	}

	public function abort_capture(): void {
		$this->captured_artifacts = [];
		$this->capture_enabled    = false;
	}

	public function read_runtime_template( string $filename ): string {
		return $this->read_file( VRodos_Path_Manager::runtime_template_path( $filename ) );
	}

	public function write_runtime_artifact( string $filename, string $content ) {
		if ( $this->capture_enabled ) {
			$scene_id = preg_match( '/_(\d+)\.html$/', $filename, $matches ) ? (int) $matches[1] : 0;
			$kind     = str_starts_with( $filename, 'Master_Client_' )
				? 'master'
				: ( str_starts_with( $filename, 'Simple_Client_' ) ? 'simple' : ( str_starts_with( $filename, 'index_' ) ? 'index' : 'html' ) );
			$this->captured_artifacts[ $filename ] = new VRodos_Compile_Artifact( $filename, $content, $kind, $scene_id );
			return strlen( $content );
		}

		throw new LogicException( '[VRodos] Runtime artifacts must be captured and committed through project publication.' );
	}

	public function read_file( string $filename ): string {
		if ( ! is_readable( $filename ) ) {
			throw new RuntimeException( '[VRodos] Compiler template read failed: ' . $filename );
		}

		$content = file_get_contents( $filename );
		if ( ! is_string( $content ) ) {
			throw new RuntimeException( '[VRodos] Compiler template read returned no content: ' . $filename );
		}

		return $content;
	}

	public function write_file( string $filename, string $content ) {
		$dir = dirname( $filename );
		if ( ! is_dir( $dir ) ) {
			wp_mkdir_p( $dir );
		}
		if ( ! is_dir( $dir ) || ! is_writable( $dir ) ) {
			throw new RuntimeException( '[VRodos] Compiler output directory is not writable: ' . $dir );
		}

		$result = file_put_contents( $filename, $content, LOCK_EX );
		if ( false === $result ) {
			throw new RuntimeException( '[VRodos] Compiler write failed: ' . $filename );
		}

		return $result;
	}
}
