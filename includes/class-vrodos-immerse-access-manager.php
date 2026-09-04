<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enforces the content boundary for users provisioned by the Immerse connector.
 */
class VRodos_Immerse_Access_Manager {
	public const RESTRICTED_CAPABILITY = 'vrodos_immerse_restricted';

	public function __construct() {
		add_filter( 'map_meta_cap', [ self::class, 'filter_meta_cap' ], 20, 4 );
		add_action( 'template_redirect', [ self::class, 'guard_frontend_pages' ], 1 );
	}

	public static function is_restricted_user( int $user_id = 0 ): bool {
		$user = $user_id > 0 ? get_userdata( $user_id ) : wp_get_current_user();
		return $user instanceof WP_User
			&& $user->exists()
			&& ! empty( $user->allcaps[ self::RESTRICTED_CAPABILITY ] )
			&& empty( $user->allcaps['manage_options'] );
	}

	public static function can_use_management_pages(): bool {
		return current_user_can( 'manage_options' ) || self::is_restricted_user();
	}

	public static function is_immerse_project( int $project_id ): bool {
		return $project_id > 0
			&& 'vrodos_game' === get_post_type( $project_id )
			&& 'immerse' === (string) get_post_meta( $project_id, '_immerse_source', true );
	}

	public static function resolve_parent_project_id( int $object_id ): int {
		$post_type = get_post_type( $object_id );
		if ( 'vrodos_game' === $post_type ) {
			return $object_id;
		}

		$taxonomy = 'vrodos_scene' === $post_type
			? 'vrodos_scene_pgame'
			: ( 'vrodos_asset3d' === $post_type ? 'vrodos_asset3d_pgame' : '' );
		if ( '' === $taxonomy ) {
			return 0;
		}

		$terms = wp_get_post_terms( $object_id, $taxonomy );
		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return 0;
		}

		foreach ( $terms as $term ) {
			$project = get_page_by_path( $term->slug, OBJECT, 'vrodos_game' );
			if ( $project instanceof WP_Post ) {
				return (int) $project->ID;
			}
		}

		return 0;
	}

	public static function object_belongs_to_project( int $object_id, int $project_id ): bool {
		return $project_id > 0 && self::resolve_parent_project_id( $object_id ) === $project_id;
	}

	public static function is_immerse_asset( int $asset_id ): bool {
		if ( $asset_id <= 0 || 'vrodos_asset3d' !== get_post_type( $asset_id ) ) {
			return false;
		}

		if ( 'immerse' === (string) get_post_meta( $asset_id, '_immerse_source', true ) ) {
			return true;
		}

		return self::is_immerse_project( self::resolve_parent_project_id( $asset_id ) );
	}

	public static function can_access_project( int $project_id ): bool {
		return self::is_restricted_user()
			? self::is_immerse_project( $project_id )
			: current_user_can( 'edit_post', $project_id );
	}

	public static function can_read_asset( int $asset_id ): bool {
		if ( $asset_id <= 0 || 'vrodos_asset3d' !== get_post_type( $asset_id ) ) {
			return false;
		}

		if ( self::is_restricted_user() ) {
			return VRodos_Shared_Repository_Manager::is_shared_asset( $asset_id ) || self::is_immerse_asset( $asset_id );
		}

		return current_user_can( 'edit_post', $asset_id )
			|| ( VRodos_Shared_Repository_Manager::is_shared_asset( $asset_id ) && current_user_can( 'edit_posts' ) );
	}

	public static function can_edit_asset( int $asset_id ): bool {
		if ( ! self::is_restricted_user() ) {
			return current_user_can( 'edit_post', $asset_id );
		}

		return self::is_immerse_asset( $asset_id )
			&& ! VRodos_Shared_Repository_Manager::is_shared_asset( $asset_id )
			&& self::is_immerse_project( self::resolve_parent_project_id( $asset_id ) );
	}

	public static function filter_meta_cap( array $caps, string $cap, int $user_id, array $args ): array {
		if ( ! self::is_restricted_user( $user_id ) || ! in_array( $cap, [ 'read_post', 'edit_post', 'delete_post' ], true ) ) {
			return $caps;
		}

		$object_id = absint( $args[0] ?? 0 );
		$post_type = get_post_type( $object_id );
		$allowed   = true;

		if ( 'vrodos_game' === $post_type ) {
			$allowed = 'delete_post' !== $cap && self::is_immerse_project( $object_id );
		} elseif ( 'vrodos_scene' === $post_type ) {
			$allowed = self::is_immerse_project( self::resolve_parent_project_id( $object_id ) );
		} elseif ( 'vrodos_asset3d' === $post_type ) {
			$allowed = 'read_post' === $cap
				? VRodos_Shared_Repository_Manager::is_shared_asset( $object_id ) || self::is_immerse_asset( $object_id )
				: self::is_immerse_asset( $object_id )
					&& ! VRodos_Shared_Repository_Manager::is_shared_asset( $object_id )
					&& self::is_immerse_project( self::resolve_parent_project_id( $object_id ) );
		}

		return $allowed ? $caps : [ 'do_not_allow' ];
	}

	public static function guard_frontend_pages(): void {
		if ( ! self::is_restricted_user() || ! is_page() ) {
			return;
		}

		$page_id  = get_queried_object_id();
		$template = (string) get_post_meta( $page_id, '_wp_page_template', true );
		$basename = basename( str_replace( '\\', '/', $template ) );

		if ( 'vrodos-assets-list-template.php' === $basename ) {
			$project_id = absint( $_GET['vrodos_project_id'] ?? 0 );
			if ( $project_id > 0 && ! self::is_immerse_project( $project_id ) ) {
				self::deny();
			}
			return;
		}

		if ( 'vrodos-edit-3D-scene-template.php' === $basename ) {
			$project_id = absint( $_GET['vrodos_game'] ?? 0 );
			$scene_id   = absint( $_GET['vrodos_scene'] ?? 0 );
			if (
				! self::is_immerse_project( $project_id )
				|| 'vrodos_scene' !== get_post_type( $scene_id )
				|| ! self::object_belongs_to_project( $scene_id, $project_id )
				|| ! current_user_can( 'edit_post', $scene_id )
			) {
				self::deny();
			}
			return;
		}

		if ( 'vrodos-asset-editor-template.php' !== $basename ) {
			return;
		}

		$project_id = absint( $_GET['vrodos_game'] ?? 0 );
		$asset_id   = absint( $_GET['vrodos_asset'] ?? 0 );
		$allowed    = self::is_immerse_project( $project_id );
		if ( $asset_id > 0 ) {
			$allowed = $allowed
				&& self::object_belongs_to_project( $asset_id, $project_id )
				&& self::can_edit_asset( $asset_id );
		}
		$return_project_id = absint( $_GET['vrodos_return_game'] ?? 0 );
		$return_scene_id   = absint( $_GET['vrodos_scene'] ?? 0 );
		if ( $allowed && $return_project_id > 0 ) {
			$allowed = self::is_immerse_project( $return_project_id )
				&& $return_scene_id > 0
				&& self::object_belongs_to_project( $return_scene_id, $return_project_id );
		}

		if ( ! $allowed ) {
			self::deny();
		}
	}

	private static function deny(): void {
		wp_die( 'You are not allowed to access this VRodos content.', 'Access denied', [ 'response' => 403 ] );
	}
}
