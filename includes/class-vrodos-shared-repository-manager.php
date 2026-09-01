<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Canonical identities for the three shared asset repositories.
 */
final class VRodos_Shared_Repository_Manager {
	private const REPOSITORIES = [
		'archaeology_games'         => 'vrodos-shared-assets-archaeology',
		'vrexpo_games'              => 'vrodos-shared-assets-vrexpo',
		'virtualproduction_games'   => 'vrodos-shared-assets-virtual-production',
	];

	public static function slug_for_taxonomy( string $taxonomy ): string {
		return self::REPOSITORIES[ $taxonomy ] ?? '';
	}

	public static function all_slugs(): array {
		return array_values( self::REPOSITORIES );
	}

	public static function is_shared_asset( int $asset_id ): bool {
		return '1' === (string) get_post_meta( $asset_id, '_vrodos_asset_is_shared', true );
	}
}
