<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Owns optional network-runtime process startup outside HTML generation.
 */
final class VRodos_Compiler_Network_Runtime_Service {
	private string $health_url;
	private $health_check;
	private $spawn;

	public function __construct( string $runtime_base_url = 'http://localhost:5832/', ?callable $health_check = null, ?callable $spawn = null ) {
		$this->health_url   = trailingslashit( $runtime_base_url ) . 'healthz';
		$this->health_check = $health_check;
		$this->spawn        = $spawn;
	}

	public function ensure_started(): bool {
		if ( $this->is_healthy() ) {
			return true;
		}

		$server_script = VRodos_Path_Manager::networked_aframe_server_path();
		if ( ! is_readable( $server_script ) ) {
			return false;
		}
		if ( ! $this->spawn_process( $server_script ) ) {
			return false;
		}

		for ( $attempt = 0; $attempt < 10; $attempt++ ) {
			usleep( 200000 );
			if ( $this->is_healthy() ) {
				return true;
			}
		}
		return false;
	}

	private function is_healthy(): bool {
		if ( is_callable( $this->health_check ) ) {
			return (bool) call_user_func( $this->health_check, $this->health_url );
		}
		$response = wp_remote_get(
			$this->health_url,
			[
				'timeout'     => 1,
				'redirection' => 0,
			]
		);
		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}
		$body = json_decode( (string) wp_remote_retrieve_body( $response ), true );
		return is_array( $body ) && 'ok' === (string) ( $body['status'] ?? '' );
	}

	private function spawn_process( string $server_script ): bool {
		if ( is_callable( $this->spawn ) ) {
			return (bool) call_user_func( $this->spawn, $server_script );
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

		$command = 'node ' . escapeshellarg( $server_script ) . ' > /dev/null 2>/dev/null &';
		@shell_exec( $command );
		return true;
	}
}
