<?php

/** Source-owned bounds, independent of derivative quality and placement transforms. */
final class VRodos_Asset_Collision_Bounds {
	public const META_KEY = '_vrodos_asset_collision_bounds';

	public static function valid( $record ): bool {
		if ( ! is_array( $record ) || 1 !== ( $record['schemaVersion'] ?? 0 ) ) {
			return false;
		}
		foreach ( [ 'min', 'max', 'center' ] as $key ) {
			if ( ! is_array( $record[ $key ] ?? null ) || 3 !== count( $record[ $key ] ) ) {
				return false;
			}
			foreach ( $record[ $key ] as $value ) {
				if ( ! is_numeric( $value ) || ! is_finite( (float) $value ) ) {
					return false;
				}
			}
		}
		foreach ( [ 0, 1, 2 ] as $axis ) {
			if ( $record['min'][ $axis ] > $record['max'][ $axis ] ) {
				return false;
			}
		}
		return true;
	}

	public static function ensure( int $asset_id, array $source ) {
		$identity = (string) ( $source['sha256'] ?? '' );
		$record = get_post_meta( $asset_id, self::META_KEY, true );
		if ( '' !== $identity && self::valid( $record ) && ( $record['sourceSha256'] ?? '' ) === $identity ) {
			return $record;
		}
		if ( '' === $identity || ! function_exists( 'proc_open' ) ) {
			return new WP_Error( 'vrodos_collision_bounds_unavailable', 'Source identity and Node.js process support are required for collision bounds.' );
		}
		$node = trim( (string) apply_filters( 'vrodos_asset_optimizer_node_command', 'node' ) );
		$process = @proc_open(
			[ $node, VRodos_Path_Manager::plugin_path( 'scripts/asset-source-bounds.mjs' ), $source['path'] ],
			[ [ 'pipe', 'r' ], [ 'pipe', 'w' ], [ 'pipe', 'w' ] ], $pipes, null, null, [ 'bypass_shell' => true ]
		);
		if ( ! is_resource( $process ) ) {
			return new WP_Error( 'vrodos_collision_bounds_process', 'Cannot start source collision bounds inspection.' );
		}
		fclose( $pipes[0] );
		stream_set_blocking( $pipes[1], false );
		stream_set_blocking( $pipes[2], false );
		$output = '';
		$error = '';
		$started = time();
		do {
			$output .= stream_get_contents( $pipes[1] );
			$error .= stream_get_contents( $pipes[2] );
			$status = proc_get_status( $process );
			if ( ! $status['running'] ) { break; }
			if ( time() - $started > 120 ) {
				proc_terminate( $process );
				$error = 'Source bounds inspection timed out.';
				break;
			}
			usleep( 100000 );
		} while ( true );
		$output .= stream_get_contents( $pipes[1] );
		$error .= stream_get_contents( $pipes[2] );
		fclose( $pipes[1] );
		fclose( $pipes[2] );
		proc_close( $process );
		$record = json_decode( $output, true );
		if ( ! is_array( $record ) || 0 !== (int) $status['exitcode'] ) {
			return new WP_Error( 'vrodos_collision_bounds_failed', 'Cannot inspect source collision bounds. ' . substr( trim( $error ), 0, 500 ) );
		}
		$record['schemaVersion'] = 1;
		$record['sourceSha256'] = $identity;
		if ( ! self::valid( $record ) ) {
			return new WP_Error( 'vrodos_collision_bounds_invalid', 'Source collision bounds are invalid.' );
		}
		update_post_meta( $asset_id, self::META_KEY, $record );
		return $record;
	}
}
