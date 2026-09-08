<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class VRodos_Asset_Origin {
	public const META_KEY           = '_vrodos_asset_origin_mode';
	public const MODE_BOUNDS_CENTER = 'bounds-center';

	public static function normalize_mode( $mode ): string {
		return self::MODE_BOUNDS_CENTER === (string) $mode ? self::MODE_BOUNDS_CENTER : '';
	}

	public static function mode_for_asset( int $asset_id ): string {
		if ( $asset_id <= 0 ) {
			return '';
		}

		return self::normalize_mode( get_post_meta( $asset_id, self::META_KEY, true ) );
	}

	public static function mark_bounds_centered( int $asset_id ): void {
		if ( $asset_id > 0 ) {
			update_post_meta( $asset_id, self::META_KEY, self::MODE_BOUNDS_CENTER );
		}
	}
}
