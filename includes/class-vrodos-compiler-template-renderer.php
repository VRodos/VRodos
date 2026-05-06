<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_Template_Renderer {
	public function read_runtime_template( string $filename ): string {
		return $this->read_file( VRodos_Path_Manager::runtime_template_path( $filename ) );
	}

	public function write_runtime_build( string $filename, string $content ) {
		return $this->write_file( VRodos_Path_Manager::runtime_build_path( $filename ), $content );
	}

	public function read_file( string $filename ): string {
		if ( ! is_readable( $filename ) ) {
			error_log( '[VRodos] Compiler template read failed: ' . $filename );
			return '';
		}

		$content = file_get_contents( $filename );
		return is_string( $content ) ? $content : '';
	}

	public function write_file( string $filename, string $content ) {
		$dir = dirname( $filename );
		if ( ! is_dir( $dir ) ) {
			wp_mkdir_p( $dir );
		}

		$result = file_put_contents( $filename, $content );
		if ( false === $result ) {
			error_log( '[VRodos] Compiler write failed: ' . $filename );
		}

		return $result;
	}
}
