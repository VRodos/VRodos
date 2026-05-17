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
		if ( $screen && $screen->post_type === 'vrodos_asset3d' ) {
			if ( isset( $query_args['who'] ) ) {
				unset( $query_args['who'] );
			}
			$query_args['role__in'] = ['administrator'];
		}
		return $query_args;
	}

	private function vrodos_render_asset_taxonomy_select( WP_Post $post, string $taxonomy, string $nonce_name, string $description, string $placeholder, string $select_id, array $extra_args = [] ): void {
		$type_ids      = wp_get_object_terms( $post->ID, $taxonomy, ['fields' => 'ids'] );
		$selected_type = ( ! is_wp_error( $type_ids ) && ! empty( $type_ids ) ) ? (int) $type_ids[0] : 0;

		$args = array_merge(
			[
				'show_option_none'  => $placeholder,
				'orderby'           => 'name',
				'hide_empty'        => false,
				'selected'          => $selected_type,
				'name'              => $taxonomy,
				'taxonomy'          => $taxonomy,
				'echo'              => 0,
				'option_none_value' => '',
				'id'                => $select_id,
				'class'             => 'widefat',
				'required'          => true,
			],
			$extra_args
		);
		?>
		<div class="tagsdiv" id="<?php echo esc_attr( $taxonomy ); ?>">
			<p class="howto"><?php echo esc_html( $description ); ?></p>
			<?php
			wp_nonce_field( self::NONCE_BASENAME, $nonce_name );
			echo wp_dropdown_categories( $args );
			?>
		</div>
		<?php
	}

	private function vrodos_can_save_asset_taxonomy( int $post_id, string $nonce_name, string $capability ): bool {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) ) {
			return false;
		}

		if ( get_post_type( $post_id ) !== 'vrodos_asset3d' ) {
			return false;
		}

		if ( ! isset( $_POST[ $nonce_name ] ) ) {
			return false;
		}

		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ $nonce_name ] ) ), self::NONCE_BASENAME ) ) {
			return false;
		}

		return current_user_can( $capability, $post_id );
	}

	private function vrodos_get_posted_asset_term( string $taxonomy ): ?WP_Term {
		$term_id = isset( $_POST[ $taxonomy ] ) ? absint( wp_unslash( $_POST[ $taxonomy ] ) ) : 0;
		if ( $term_id <= 0 ) {
			return null;
		}

		$term = get_term( $term_id, $taxonomy );
		return ( $term instanceof WP_Term ) ? $term : null;
	}

	private function vrodos_set_single_asset_taxonomy_term( int $post_id, string $taxonomy, ?WP_Term $term ): void {
		$term_ids = $term ? [ (int) $term->term_id ] : [];
		wp_set_object_terms( $post_id, $term_ids, $taxonomy, false );
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
		$this->vrodos_render_asset_taxonomy_select(
			$post,
			'vrodos_asset3d_pgame',
			'vrodos_asset3d_pgame_noncename',
			'Select project that this asset belongs to',
			'Select Game',
			'vrodos-select-category-dropdown'
		);
	}

	public function vrodos_asset_tax_category_box_content_save( $post_id ): void {
		if ( ! $this->vrodos_can_save_asset_taxonomy( (int) $post_id, 'vrodos_asset3d_cat_noncename', 'edit_vrodos_asset3d_cat' ) ) {
			return;
		}

		$taxonomy = 'vrodos_asset3d_cat';
		$term     = $this->vrodos_get_posted_asset_term( $taxonomy );
		if ( $term && ( $term->slug ?? '' ) === 'assessment' && ! self::is_assessment_asset( (int) $post_id ) ) {
			return;
		}
		if ( self::is_assessment_asset( (int) $post_id ) ) {
			wp_set_object_terms( $post_id, 'assessment', $taxonomy );
			return;
		}

		$this->vrodos_set_single_asset_taxonomy_term( (int) $post_id, $taxonomy, $term );
	}

	public function vrodos_assets_tax_select_category_box_content( $post ): void {
		$tax_name = 'vrodos_asset3d_cat';
		$assessment_term = get_term_by( 'slug', 'assessment', $tax_name );
		$is_assessment_asset = self::is_assessment_asset( (int) $post->ID );
		if ( $is_assessment_asset && $assessment_term ) {
			?>
			<div class="tagsdiv" id="<?php echo esc_attr( $tax_name ); ?>">
				<p class="howto">Select category for current Asset</p>
				<?php wp_nonce_field( self::NONCE_BASENAME, 'vrodos_asset3d_cat_noncename' ); ?>
				<input type="hidden" name="vrodos_asset3d_cat" value="<?php echo esc_attr( $assessment_term->term_id ); ?>"/>
				<p><strong><?php echo esc_html( $assessment_term->name ); ?></strong></p>
				<p class="description">Assessment assets can be edited, but their category is managed by the assessment import flow.</p>
			</div>
			<?php
			return;
		}

		$args = [];
		if ( $assessment_term ) {
			$args['exclude'] = (string) $assessment_term->term_id;
		}

		$this->vrodos_render_asset_taxonomy_select(
			$post,
			$tax_name,
			'vrodos_asset3d_cat_noncename',
			'Select category for current Asset',
			'Select Category',
			'vrodos-select-asset3d-cat-dropdown',
			$args
		);
	}

	public function vrodos_assets_tax_select_iprcategory_box_content( $post ): void {
		$this->vrodos_render_asset_taxonomy_select(
			$post,
			'vrodos_asset3d_ipr_cat',
			'vrodos_asset3d_ipr_cat_noncename',
			'Select IPR category for current Asset',
			'Select IPR category',
			'vrodos-select-asset3d-ipr-cat-dropdown'
		);
	}

	public function vrodos_assets_taxcategory_ipr_box_content_save( $post_id ): void {
		if ( ! $this->vrodos_can_save_asset_taxonomy( (int) $post_id, 'vrodos_asset3d_ipr_cat_noncename', 'edit_vrodos_asset3d_iprcat' ) ) {
			return;
		}

		$taxonomy = 'vrodos_asset3d_ipr_cat';
		$this->vrodos_set_single_asset_taxonomy_term( (int) $post_id, $taxonomy, $this->vrodos_get_posted_asset_term( $taxonomy ) );
	}

	public function vrodos_asset_project_box_content_save( $post_id ): void {
		if ( ! $this->vrodos_can_save_asset_taxonomy( (int) $post_id, 'vrodos_asset3d_pgame_noncename', 'edit_vrodos_asset3d_pgame' ) ) {
			return;
		}

		$taxonomy = 'vrodos_asset3d_pgame';
		$this->vrodos_set_single_asset_taxonomy_term( (int) $post_id, $taxonomy, $this->vrodos_get_posted_asset_term( $taxonomy ) );
	}
}
