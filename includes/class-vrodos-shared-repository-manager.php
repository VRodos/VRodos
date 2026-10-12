<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Canonical identities for the three shared asset repositories.
 */
final class VRodos_Shared_Repository_Manager {
	public const SHARED_META = '_vrodos_asset_is_shared';

	public static function register_hooks(): void {
		add_filter( 'rest_pre_insert_vrodos_asset3d', [ self::class, 'validate_rest_visibility' ], 10, 2 );
		add_action( 'added_post_meta', [ self::class, 'visibility_changed' ], 10, 3 );
		add_action( 'updated_post_meta', [ self::class, 'visibility_changed' ], 10, 3 );
	}

	public static function visibility_changed( $meta_id, int $asset_id, string $key ): void {
		if ( self::SHARED_META === $key && 'vrodos_asset3d' === get_post_type( $asset_id ) ) {
			self::clear_asset_list_cache();
		}
	}

	/** Internal promotion; callers authorize the operation before invoking it. */
	public static function make_shared( int $asset_id ): true|WP_Error {
		if ( 'vrodos_asset3d' !== get_post_type( $asset_id ) ) {
			return new WP_Error( 'invalid_asset', 'Asset not found.' );
		}
		if ( ! self::is_shared_asset( $asset_id ) ) {
			update_post_meta( $asset_id, self::SHARED_META, '1' );
			if ( ! self::is_shared_asset( $asset_id ) ) {
				return new WP_Error( 'asset_sharing_failed', 'Could not make the asset Shared.' );
			}
		}
		self::clear_asset_list_cache();
		return true;
	}

	public static function clear_asset_list_cache(): void {
		global $wpdb;
		$wpdb->query( $wpdb->prepare(
			"DELETE FROM $wpdb->options WHERE option_name LIKE %s OR option_name LIKE %s",
			$wpdb->esc_like( '_transient_vrodos_assets_' ) . '%',
			$wpdb->esc_like( '_transient_timeout_vrodos_assets_' ) . '%'
		) );
	}

	/** Used in deletion queries before applying their batch limit. */
	public static function private_assets_meta_query(): array {
		return [
			'relation' => 'OR',
			[ 'key' => self::SHARED_META, 'compare' => 'NOT EXISTS' ],
			[ 'key' => self::SHARED_META, 'value' => '1', 'compare' => '!=' ],
		];
	}

	public static function validate_rest_visibility( $prepared_post, WP_REST_Request $request ) {
		$meta = $request->get_param( 'meta' );
		if ( self::is_shared_asset( absint( $request->get_param( 'id' ) ) )
			&& is_array( $meta ) && array_key_exists( self::SHARED_META, $meta )
			&& ! rest_sanitize_boolean( $meta[ self::SHARED_META ] ) ) {
			return new WP_Error( 'asset_sharing_permanent', 'Shared assets cannot be made private.', [ 'status' => 400 ] );
		}
		return $prepared_post;
	}
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
		return '1' === (string) get_post_meta( $asset_id, self::SHARED_META, true );
	}
}
