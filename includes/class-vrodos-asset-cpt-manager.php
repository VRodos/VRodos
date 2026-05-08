<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/asset-cpt/trait-vrodos-asset-cpt-shared.php';
require_once __DIR__ . '/asset-cpt/trait-vrodos-asset-cpt-submission.php';
require_once __DIR__ . '/asset-cpt/trait-vrodos-asset-cpt-taxonomy-admin.php';
require_once __DIR__ . '/asset-cpt/trait-vrodos-asset-cpt-metabox-admin.php';
require_once __DIR__ . '/asset-cpt/class-vrodos-asset-cpt-admin-controller.php';

/**
 * Thin hook registrar and compatibility facade for the VRodos Asset CPT admin.
 */
class VRodos_Asset_CPT_Manager {
	private array $vrodos_databox1;
	private VRodos_Asset_CPT_Admin_Controller $controller;

	public function __construct() {
		$this->define_asset_fields();
		$this->controller = new VRodos_Asset_CPT_Admin_Controller( $this->vrodos_databox1 );
		$this->register_hooks();
	}

	private function define_asset_fields(): void {
		$table_of_asset_fields = [
      // Short , full, id, type, default, single, show_in_rest
      ['GLB File', 'GLB File', 'vrodos_asset3d_glb', 'string', '', true, true],
      ['Audio File', 'Audio File for the 3D model', 'vrodos_asset3d_audio', 'string', '', true, true],
      ['Audio Playback Mode', 'Audio playback mode', 'vrodos_asset3d_audio_playback_mode', 'string', 'interact', true, true],
      ['Audio Loop', 'Audio loop enabled', 'vrodos_asset3d_audio_loop', 'string', '0', true, true],
      ['Audio Volume', 'Audio volume', 'vrodos_asset3d_audio_volume', 'string', '1', true, true],
      ['Audio Ref Distance', 'Audio reference distance', 'vrodos_asset3d_audio_ref_distance', 'string', '2', true, true],
      ['Audio Max Distance', 'Audio max distance', 'vrodos_asset3d_audio_max_distance', 'string', '20', true, true],
      ['Audio Rolloff Factor', 'Audio rolloff factor', 'vrodos_asset3d_audio_rolloff_factor', 'string', '1', true, true],
      ['Diffusion Image', 'Diffusion Image', 'vrodos_asset3d_diffimage', 'string', '', false, true],
      ['Screenshot Image', 'Screenshot Image', 'vrodos_asset3d_screenimage', 'string', '', true, true],
      ['Next Scene (Only for Doors)', 'Next Scene', 'vrodos_asset3d_scene', 'string', '', true, true],
      ['Video', 'Video', 'vrodos_asset3d_video', 'string', '', true, true],
      ['isreward', 'isreward', 'vrodos_asset3d_isreward', 'string', '0', true, true],
      ['isCloned', 'isCloned', 'vrodos_asset3d_isCloned', 'string', 'false', true, true],
      ['isShared', 'isShared Asset', 'vrodos_asset3d_isJoker', 'string', 'false', true, true],
      ['fonts', 'fonts', 'vrodos_asset3d_fonts', 'string', '', true, true],
      ['back_3d_color', '3D viewer background color', 'vrodos_asset3d_back3dcolor', 'string', '#FFFFFF', true, true],
      ['Asset TRS', 'Initial asset translation, rotation, scale for the asset editor', 'vrodos_asset3d_assettrs', 'string', '0,0,0,0,0,0,0,0,0', true, true],
  ];

		$asset_fields = [];
		foreach ( $table_of_asset_fields as $field_data ) {
			$asset_fields[] = ['name'         => $field_data[0], 'desc'         => $field_data[1], 'id'           => $field_data[2], 'type'         => $field_data[3], 'std'          => $field_data[4], 'single'       => $field_data[5], 'show_in_rest' => $field_data[6]];
		}

		$this->vrodos_databox1 = ['id'       => 'vrodos-assets-databox', 'page'     => 'vrodos_asset3d', 'context'  => 'normal', 'priority' => 'high', 'fields'   => $asset_fields];
	}

	private function register_hooks(): void {
		add_action( 'init', $this->vrodos_asset3d_metas_description(...), 1 );
		add_action( 'save_post', $this->vrodos_create_pathdata_asset(...), 10, 3 );
		add_action( 'save_post', $this->vrodos_assets_databox_save(...) );
		add_action( 'save_post', $this->vrodos_asset_tax_category_box_content_save(...) );
		add_action( 'save_post', $this->vrodos_assets_taxcategory_ipr_box_content_save(...) );
		add_action( 'save_post', $this->vrodos_asset_project_box_content_save(...) );
		add_action( 'init', $this->vrodos_allowAuthorEditing(...) );
		add_filter( 'wp_dropdown_users_args', $this->change_user_dropdown(...), 10, 2 );
		add_action( 'add_meta_boxes', $this->vrodos_assets_taxcategory_box(...) );
		add_action( 'add_meta_boxes', $this->vrodos_assets_databox_add(...) );
		add_action( 'restrict_manage_posts', $this->vrodos_render_asset_type_admin_filter(...), 10, 2 );
		add_action( 'pre_get_posts', $this->vrodos_filter_assets_admin_query_by_type(...) );
		add_filter( 'manage_vrodos_asset3d_posts_columns', $this->vrodos_set_custom_vrodos_asset3d_columns(...) );
		add_action( 'manage_vrodos_asset3d_posts_custom_column', $this->vrodos_set_custom_vrodos_asset3d_columns_fill(...), 10, 2 );
		add_action( 'init', $this->handle_asset_frontend_submission(...) );
	}

	public function vrodos_asset3d_metas_description(): void { $this->controller->vrodos_asset3d_metas_description(); }
	public function vrodos_create_pathdata_asset( $post_ID, $post, $update ): void { $this->controller->vrodos_create_pathdata_asset( $post_ID, $post, $update ); }
	public function vrodos_assets_databox_save( $post_id ): void { $this->controller->vrodos_assets_databox_save( $post_id ); }
	public function vrodos_asset_tax_category_box_content_save( $post_id ): void { $this->controller->vrodos_asset_tax_category_box_content_save( $post_id ); }
	public function vrodos_assets_taxcategory_ipr_box_content_save( $post_id ): void { $this->controller->vrodos_assets_taxcategory_ipr_box_content_save( $post_id ); }
	public function vrodos_asset_project_box_content_save( $post_id ): void { $this->controller->vrodos_asset_project_box_content_save( $post_id ); }
	public function vrodos_allowAuthorEditing(): void { $this->controller->vrodos_allowAuthorEditing(); }
	public function change_user_dropdown( $query_args, $r ) { return $this->controller->change_user_dropdown( $query_args, $r ); }
	public function vrodos_assets_taxcategory_box(): void { $this->controller->vrodos_assets_taxcategory_box(); }
	public function vrodos_assets_databox_add(): void { $this->controller->vrodos_assets_databox_add(); }
	public function vrodos_render_asset_type_admin_filter( $post_type, $which = '' ): void { $this->controller->vrodos_render_asset_type_admin_filter( $post_type, $which ); }
	public function vrodos_filter_assets_admin_query_by_type( $query ): void { $this->controller->vrodos_filter_assets_admin_query_by_type( $query ); }
	public function vrodos_set_custom_vrodos_asset3d_columns( $columns ): array { return $this->controller->vrodos_set_custom_vrodos_asset3d_columns( $columns ); }
	public function vrodos_set_custom_vrodos_asset3d_columns_fill( $column, $post_id ): void { $this->controller->vrodos_set_custom_vrodos_asset3d_columns_fill( $column, $post_id ); }
	public function handle_asset_frontend_submission(): void { $this->controller->handle_asset_frontend_submission(); }

	public static function create_asset_frontend( $asset_pgame_id, $asset_cat_id, $game_slug, $asset_cat_ipr_id, $asset_title, $asset_fonts, $asset_back_3d_color, $asset_trs, $asset_description ) {
		return VRodos_Asset_CPT_Admin_Controller::create_asset_frontend( $asset_pgame_id, $asset_cat_id, $game_slug, $asset_cat_ipr_id, $asset_title, $asset_fonts, $asset_back_3d_color, $asset_trs, $asset_description );
	}

	public static function update_asset_frontend( $asset_pgame_id, $asset_cat_id, $asset_id, $asset_cat_ipr_id, $asset_title, $asset_fonts, $asset_back_3d_color, $asset_trs, $asset_description ) {
		return VRodos_Asset_CPT_Admin_Controller::update_asset_frontend( $asset_pgame_id, $asset_cat_id, $asset_id, $asset_cat_ipr_id, $asset_title, $asset_fonts, $asset_back_3d_color, $asset_trs, $asset_description );
	}

	public static function update_asset_meta( $asset_id, $asset_fonts, $asset_back_3d_color, $asset_trs ): void {
		VRodos_Asset_CPT_Admin_Controller::update_asset_meta( $asset_id, $asset_fonts, $asset_back_3d_color, $asset_trs );
	}

	public static function prepare_asset_editor_template_data(): array {
		return VRodos_Asset_CPT_Admin_Controller::prepare_asset_editor_template_data();
	}
}
