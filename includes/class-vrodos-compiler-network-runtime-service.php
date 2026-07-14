<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Owns optional network-runtime process startup outside HTML generation.
 */
final class VRodos_Compiler_Network_Runtime_Service {
	public function ensure_started(): bool {
		$server_script = VRodos_Path_Manager::networked_aframe_server_path();
		if ( ! is_readable( $server_script ) ) {
			return false;
		}

		if ( PHP_OS_FAMILY === 'Windows' ) {
			$command = 'start "" /B node "' . str_replace( '"', '\\"', $server_script ) . '"';
			$handle  = @popen( $command, 'r' );
			if ( is_resource( $handle ) ) {
				pclose( $handle );
				return true;
			}
			return false;
		}

		if ( $this->process_exists( 'vrodos-network-runtime' ) ) {
			return true;
		}

		$command = 'node ' . escapeshellarg( $server_script ) . ' > /dev/null 2>/dev/null &';
		@shell_exec( $command );
		return true;
	}

	private function process_exists( string $process_name ): bool {
		$output = [];
		@exec( 'ps -A -o command=', $output );
		foreach ( $output as $line ) {
			if ( str_contains( strtolower( (string) $line ), strtolower( $process_name ) ) ) {
				return true;
			}
		}
		return false;
	}
}
