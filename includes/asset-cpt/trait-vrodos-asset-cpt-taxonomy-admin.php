<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_CPT_Taxonomy_Admin {
	public function vrodos_allowAuthorEditing(): void {
		add_post_type_support( 'vrodos_asset3d', 'author' );
	}

	public function change_user_dropdown( $query_args, $r ) {
		$screen = get_current_screen();
		if ( $screen->post_type == 'vrodos_asset3d' ) {
			if ( isset( $query_args['who'] ) ) {
				unset( $query_args['who'] );
			}
			$query_args['role__in'] = ['administrator'];
		}
		return $query_args;
	}

	public function vrodos_render_asset_type_admin_filter( $post_type, $which = '' ): void {
		if ( $post_type !== 'vrodos_asset3d' ) {
			return;
		}

		$selected = isset( $_GET['vrodos_asset_type'] ) ? absint( $_GET['vrodos_asset_type'] ) : 0;

		wp_dropdown_categories(
			[
				'show_option_all' => __( 'All Asset Types' ),
				'taxonomy'        => 'vrodos_asset3d_cat',
				'name'            => 'vrodos_asset_type',
				'id'              => 'filter-by-vrodos-asset-type',
				'class'           => 'postform',
				'orderby'         => 'name',
				'hide_empty'      => false,
				'selected'        => $selected,
				'value_field'     => 'term_id',
			]
		);
	}

	public function vrodos_filter_assets_admin_query_by_type( $query ): void {
		if ( ! is_admin() || ! $query->is_main_query() ) {
			return;
		}

		if ( $query->get( 'post_type' ) !== 'vrodos_asset3d' ) {
			return;
		}

		$asset_type_id = isset( $_GET['vrodos_asset_type'] ) ? absint( $_GET['vrodos_asset_type'] ) : 0;
		if ( $asset_type_id <= 0 ) {
			return;
		}

		$tax_query   = (array) $query->get( 'tax_query' );
		$tax_query[] = [
			'taxonomy' => 'vrodos_asset3d_cat',
			'field'    => 'term_id',
			'terms'    => [ $asset_type_id ],
		];

		$query->set( 'tax_query', $tax_query );
	}

	public function vrodos_assets_taxcategory_box(): void {
		remove_meta_box( 'tagsdiv-vrodos_asset3d_pgame', 'vrodos_asset3d', 'side' );
		remove_meta_box( 'tagsdiv-vrodos_asset3d_cat', 'vrodos_asset3d', 'side' );
		remove_meta_box( 'tagsdiv-vrodos_asset3d_ipr_cat', 'vrodos_asset3d', 'side' );
		add_meta_box( 'vrodos_asset_project_selectbox', 'Project', $this->vrodos_assets_tax_select_project_box_content(...), 'vrodos_asset3d', 'side', 'high' );
		add_meta_box( 'vrodos_asset3d_category_selectbox', 'Asset Category', $this->vrodos_assets_tax_select_category_box_content(...), 'vrodos_asset3d', 'side', 'high' );
		add_meta_box( 'vrodos_asset3d_ipr_cat_selectbox', 'Asset IPR Category', $this->vrodos_assets_tax_select_iprcategory_box_content(...), 'vrodos_asset3d', 'side', 'high' );
	}

	public function vrodos_assets_tax_select_project_box_content( $post ): void {
		$tax_name = 'vrodos_asset3d_pgame';
		?>
		<div class="tagsdiv" id="<?php echo $tax_name; ?>">
			<p class="howto">Select project that this asset belongs to</p>
			<?php
			$nonce_field = wp_nonce_field( self::NONCE_BASENAME, 'vrodos_asset3d_pgame_noncename', true, false );
			echo str_replace( ' id="_ajax_nonce"', '', $nonce_field );
			$type_IDs   = wp_get_object_terms( $post->ID, 'vrodos_asset3d_pgame', ['fields' => 'ids'] );
			$type_ID    = ( ! is_wp_error( $type_IDs ) && ! empty( $type_IDs ) ) ? $type_IDs[0] : 0;
			$args       = ['show_option_none'  => 'Select Category', 'orderby'           => 'name', 'hide_empty'        => 0, 'selected'          => $type_ID, 'name'              => 'vrodos_asset3d_pgame', 'taxonomy'          => 'vrodos_asset3d_pgame', 'echo'              => 0, 'option_none_value' => '-1', 'id'                => 'vrodos-select-category-dropdown'];
			$select     = wp_dropdown_categories( $args );
			$replace    = '<select$1 required>';
			$select     = preg_replace( '#<select([^>]*)>#', $replace, $select );
			$old_option = "<option value='-1'>";
			$new_option = "<option disabled selected value=''>" . 'Select Game' . '</option>';
			$select     = str_replace( $old_option, $new_option, $select );
			echo $select;
			?>
		</div>
		<?php
	}

	public function vrodos_asset_tax_category_box_content_save( $post_id ): void {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! isset( $_POST['vrodos_asset3d_cat_noncename'] ) || ! wp_verify_nonce( $_POST['vrodos_asset3d_cat_noncename'], self::NONCE_BASENAME ) || ! current_user_can( 'edit_vrodos_asset3d_cat', $post_id ) ) {
			return;
		}
		$type_ID = intval( $_POST['vrodos_asset3d_cat'], 10 );
		$term    = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_asset3d_cat' ) : null;
		$type    = ( ! is_wp_error( $term ) && ! empty( $term ) ) ? $term->slug : null;
		wp_set_object_terms( $post_id, $type, 'vrodos_asset3d_cat' );
	}

	public function vrodos_assets_tax_select_category_box_content( $post ): void {
		$tax_name = 'vrodos_asset3d_cat';
		?>
		<div class="tagsdiv" id="<?php echo $tax_name; ?>">
			<p class="howto">Select category for current Asset</p>
			<?php
			$nonce_field = wp_nonce_field( self::NONCE_BASENAME, 'vrodos_asset3d_cat_noncename', true, false );
			echo str_replace( ' id="_ajax_nonce"', '', $nonce_field );
			$type_IDs   = wp_get_object_terms( $post->ID, 'vrodos_asset3d_cat', ['fields' => 'ids'] );
			$type_ID    = ( ! is_wp_error( $type_IDs ) && ! empty( $type_IDs ) ) ? $type_IDs[0] : 0;
			$args       = ['show_option_none'  => 'Select Category', 'orderby'           => 'name', 'hide_empty'        => 0, 'selected'          => $type_ID, 'name'              => 'vrodos_asset3d_cat', 'taxonomy'          => 'vrodos_asset3d_cat', 'echo'              => 0, 'option_none_value' => '-1', 'id'                => 'vrodos-select-asset3d-cat-dropdown'];
			$select     = wp_dropdown_categories( $args );
			$replace    = "<select$1 onchange='vrodos_hidecfields_asset3d();' required>";
			$select     = preg_replace( '#<select([^>]*)>#', $replace, $select );
			$old_option = "<option value='-1'>";
			$new_option = "<option disabled selected value=''>" . 'Select Category' . '</option>';
			$select     = str_replace( $old_option, $new_option, $select );
			echo $select;
			?>
		</div>
		<?php
	}

	public function vrodos_assets_tax_select_iprcategory_box_content( $post ): void {
		$tax_name = 'vrodos_asset3d_ipr_cat';
		?>
		<div class="tagsdiv" id="<?php echo $tax_name; ?>">
			<p class="howto">Select IPR category for current Asset</p>
			<?php
			$nonce_field = wp_nonce_field( self::NONCE_BASENAME, 'vrodos_asset3d_ipr_cat_noncename', true, false );
			echo str_replace( ' id="_ajax_nonce"', '', $nonce_field );
			$type_ids      = wp_get_object_terms( $post->ID, 'vrodos_asset3d_ipr_cat', ['fields' => 'ids'] );
			$selected_type = ( ! is_wp_error( $type_ids ) && ! empty( $type_ids ) ) ? $type_ids[0] : '';
			$args          = ['show_option_none'  => 'Select IPR Category', 'orderby'           => 'name', 'hide_empty'        => 0, 'selected'          => $selected_type, 'name'              => 'vrodos_asset3d_ipr_cat', 'taxonomy'          => 'vrodos_asset3d_ipr_cat', 'echo'              => 0, 'option_none_value' => '-1', 'id'                => 'vrodos-select-asset3d-ipr-cat-dropdown'];
			$select        = wp_dropdown_categories( $args );
			$replace       = '<select$1 required>';
			$select        = preg_replace( '#<select([^>]*)>#', $replace, $select );
			$old_option    = "<option value='-1'>";
			$new_option    = "<option disabled selected value=''>" . 'Select IPR category' . '</option>';
			$select        = str_replace( $old_option, $new_option, $select );
			echo $select;
			?>
		</div>
		<?php
	}

	public function vrodos_assets_taxcategory_ipr_box_content_save( $post_id ): void {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! isset( $_POST['vrodos_asset3d_ipr_cat_noncename'] ) || ! wp_verify_nonce( $_POST['vrodos_asset3d_ipr_cat_noncename'], self::NONCE_BASENAME ) || ! current_user_can( 'edit_vrodos_asset3d_iprcat', $post_id ) ) {
			return;
		}
		$type_ID = intval( $_POST['vrodos_asset3d_ipr_cat'], 10 );
		$term    = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_asset3d_ipr_cat' ) : null;
		$type    = ( ! is_wp_error( $term ) && ! empty( $term ) ) ? $term->slug : null;
		wp_set_object_terms( $post_id, $type, 'vrodos_asset3d_ipr_cat' );
	}

	public function vrodos_asset_project_box_content_save( $post_id ): void {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! isset( $_POST['vrodos_asset3d_pgame_noncename'] ) || ! wp_verify_nonce( $_POST['vrodos_asset3d_pgame_noncename'], self::NONCE_BASENAME ) || ! current_user_can( 'edit_vrodos_asset3d_pgame', $post_id ) ) {
			return;
		}
		$type_ID = intval( $_POST['vrodos_asset3d_pgame'], 10 );
		$term    = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_asset3d_pgame' ) : null;
		$type    = ( ! is_wp_error( $term ) && ! empty( $term ) ) ? $term->slug : null;
		wp_set_object_terms( $post_id, $type, 'vrodos_asset3d_pgame' );
	}
}
