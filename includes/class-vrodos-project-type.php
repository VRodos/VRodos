<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class VRodos_Project_Type {
	public const ARCHAEOLOGICAL_SITE = 'archaeological_site_games';

	public static function supports_diaries( string $type ): bool {
		return self::ARCHAEOLOGICAL_SITE === $type;
	}

	public static function uses_exhibition_runtime( string $type ): bool {
		return 'vrexpo_games' === $type || self::supports_diaries( $type );
	}
}
