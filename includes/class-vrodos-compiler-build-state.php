<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Tracks cancellable compile requests for the current WordPress user. */
final class VRodos_Compiler_Build_State {
	private const CANCELLED_TRANSIENT_PREFIX = 'vrodos_compile_cancelled_';

	public static function normalize_build_id( string $build_id ): string {
		$build_id = sanitize_key( $build_id );
		return preg_match( '/^[a-z0-9-]{8,64}$/', $build_id ) ? $build_id : '';
	}

	public static function cancel( string $build_id, int $project_id ): bool {
		$build_id = self::normalize_build_id( $build_id );
		if ( '' === $build_id || $project_id <= 0 ) {
			return false;
		}

		return set_transient( self::cancelled_key( $build_id, $project_id ), 1, HOUR_IN_SECONDS );
	}

	public static function is_cancelled( string $build_id, int $project_id ): bool {
		$build_id = self::normalize_build_id( $build_id );
		return '' !== $build_id && $project_id > 0 && false !== get_transient( self::cancelled_key( $build_id, $project_id ) );
	}

	private static function cancelled_key( string $build_id, int $project_id ): string {
		$scope = get_current_user_id() . ':' . $project_id . ':' . $build_id;
		return self::CANCELLED_TRANSIENT_PREFIX . md5( $scope );
	}
}
