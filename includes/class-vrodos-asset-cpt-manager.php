<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * VRodos_Asset_CPT_Manager Class.
 *
 * Manages the Custom Post Type for VRodos Assets, including meta boxes,
 * custom fields, and admin columns.
 */
class VRodos_Asset_CPT_Manager {

	/**
	 * The meta box definition for asset data.
	 *
	 * @var array
	 */
	private $vrodos_databox1;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->define_asset_fields();
		$this->register_hooks();
	}

	/**
	 * Define the custom fields for the Asset CPT.
	 */
	private function define_asset_fields() {
		$table_of_asset_fields = array(
			// Short , full, id, type, default, single, show_in_rest
			array( 'GLB File', 'GLB File', 'vrodos_asset3d_glb', 'string', '', true, true ),
			array( 'Audio File', 'Audio File for the 3D model', 'vrodos_asset3d_audio', 'string', '', true, true ),
			array( 'Diffusion Image', 'Diffusion Image', 'vrodos_asset3d_diffimage', 'string', '', false, true ),
			array( 'Screenshot Image', 'Screenshot Image', 'vrodos_asset3d_screenimage', 'string', '', true, true ),
			array( 'Next Scene (Only for Doors)', 'Next Scene', 'vrodos_asset3d_scene', 'string', '', true, true ),
			array( 'Video', 'Video', 'vrodos_asset3d_video', 'string', '', true, true ),
			array( 'isreward', 'isreward', 'vrodos_asset3d_isreward', 'string', '0', true, true ),
			array( 'isCloned', 'isCloned', 'vrodos_asset3d_isCloned', 'string', 'false', true, true ),
			array( 'isJoker', 'isJoker', 'vrodos_asset3d_isJoker', 'string', 'false', true, true ),
			array( 'fonts', 'fonts', 'vrodos_asset3d_fonts', 'string', '', true, true ),
			array( 'back_3d_color', '3D viewer background color', 'vrodos_asset3d_back3dcolor', 'string', "rgb(221, 185, 155)", true, true ),
			array( 'Asset TRS', 'Initial asset translation, rotation, scale for the asset editor', 'vrodos_asset3d_assettrs', 'string', '0,0,0,0,0,0,0,0,0', true, true ),
		);

		$asset_fields = [];
		foreach ( $table_of_asset_fields as $field_data ) {
			$asset_fields[] = array(
				'name'         => $field_data[0],
				'desc'         => $field_data[1],
				'id'           => $field_data[2],
				'type'         => $field_data[3],
				'std'          => $field_data[4],
				'single'       => $field_data[5],
				'show_in_rest' => $field_data[6],
			);
		}

		$this->vrodos_databox1 = array(
			'id'       => 'vrodos-assets-databox',
			'page'     => 'vrodos_asset3d',
			'context'  => 'normal',
			'priority' => 'high',
			'fields'   => $asset_fields,
		);
	}

	/**
	 * Register all the hooks for the Asset CPT.
	 */
	private function register_hooks() {
		// Meta and data handling
		add_action( 'init', array( $this, 'vrodos_asset3d_metas_description' ), 1 );
		add_action( 'save_post', array( $this, 'vrodos_create_pathdata_asset' ), 10, 3 );
		add_action( 'save_post', array( $this, 'vrodos_assets_databox_save' ) );
		add_action( 'save_post', array( $this, 'vrodos_asset_tax_category_box_content_save' ) );
		add_action( 'save_post', array( $this, 'vrodos_assets_taxcategory_ipr_box_content_save' ) );
		add_action( 'save_post', array( $this, 'vrodos_asset_project_box_content_save' ) );

		// Admin UI and meta boxes
		add_action( 'init', array( $this, 'vrodos_allowAuthorEditing' ) );
		add_filter( 'wp_dropdown_users_args', array( $this, 'change_user_dropdown' ), 10, 2 );
		add_action( 'add_meta_boxes', array( $this, 'vrodos_assets_taxcategory_box' ) );
		add_action( 'add_meta_boxes', array( $this, 'vrodos_assets_databox_add' ) );

		// Admin columns
		add_filter( 'manage_vrodos_asset3d_posts_columns', array( $this, 'vrodos_set_custom_vrodos_asset3d_columns' ) );
		add_action( 'manage_vrodos_asset3d_posts_custom_column', array( $this, 'vrodos_set_custom_vrodos_asset3d_columns_fill' ), 10, 2 );
	}

	/**
	 * Create PathData for each asset as custom field.
	 */
	public function vrodos_create_pathdata_asset( $post_ID, $post, $update ) {
		if ( get_post_type( $post_ID ) === 'vrodos_asset3d' ) {
			$parentGameID = $_GET['vrodos_game'] ?? null;
			if ( ! is_numeric( $parentGameID ) ) {
				return;
			}
			$parentGameID   = intval( $parentGameID );
			$parentGameSlug = ( $parentGameID > 0 ) ? get_post( $parentGameID )->post_name : null;
			update_post_meta( $post_ID, 'vrodos_asset3d_pathData', $parentGameSlug );
		}
	}

	/**
	 * Add author support to assets.
	 */
	public function vrodos_allowAuthorEditing() {
		add_post_type_support( 'vrodos_asset3d', 'author' );
	}

	/**
	 * Customize the user dropdown in the author meta box.
	 */
	public function change_user_dropdown( $query_args, $r ) {
		$screen = get_current_screen();
		if ( $screen->post_type == 'vrodos_asset3d' ) {
			if ( isset( $query_args['who'] ) ) {
				unset( $query_args['who'] );
			}
			$query_args['role__in'] = array( 'administrator' );
		}
		return $query_args;
	}

	/**
	 * Remove standard taxonomy boxes and add custom ones.
	 */
	public function vrodos_assets_taxcategory_box() {
		remove_meta_box( 'tagsdiv-vrodos_asset3d_pgame', 'vrodos_asset3d', 'side' );
		remove_meta_box( 'tagsdiv-vrodos_asset3d_cat', 'vrodos_asset3d', 'side' );
		remove_meta_box( 'tagsdiv-vrodos_asset3d_ipr_cat', 'vrodos_asset3d', 'side' );
		add_meta_box( 'vrodos_asset_project_selectbox', 'Project', array( $this, 'vrodos_assets_tax_select_project_box_content' ), 'vrodos_asset3d', 'side', 'high' );
		add_meta_box( 'vrodos_asset3d_category_selectbox', 'Asset Category', array( $this, 'vrodos_assets_tax_select_category_box_content' ), 'vrodos_asset3d', 'side', 'high' );
		add_meta_box( 'vrodos_asset3d_ipr_cat_selectbox', 'Asset IPR Category', array( $this, 'vrodos_assets_tax_select_iprcategory_box_content' ), 'vrodos_asset3d', 'side', 'high' );
	}

	/**
	 * Content for the project selection meta box.
	 */
	public function vrodos_assets_tax_select_project_box_content( $post ) {
		$tax_name = 'vrodos_asset3d_pgame';
		?>
		<div class="tagsdiv" id="<?php echo $tax_name; ?>">
			<p class="howto">Select project that this asset belongs to</p>
			<?php
			$nonce_field = wp_nonce_field( basename( __FILE__ ), 'vrodos_asset3d_pgame_noncename', true, false );
			echo str_replace( ' id="_ajax_nonce"', '', $nonce_field );
			$type_IDs = wp_get_object_terms( $post->ID, 'vrodos_asset3d_pgame', array( 'fields' => 'ids' ) );
			$type_ID  = $type_IDs ? $type_IDs[0] : 0;
			$args     = array(
				'show_option_none'  => 'Select Category',
				'orderby'           => 'name',
				'hide_empty'        => 0,
				'selected'          => $type_ID,
				'name'              => 'vrodos_asset3d_pgame',
				'taxonomy'          => 'vrodos_asset3d_pgame',
				'echo'              => 0,
				'option_none_value' => '-1',
				'id'                => 'vrodos-select-category-dropdown',
			);
			$select   = wp_dropdown_categories( $args );
			$replace  = "<select$1 required>";
			$select   = preg_replace( '#<select([^>]*)>#', $replace, $select );
			$old_option = "<option value='-1'>";
			$new_option = "<option disabled selected value=''>" . 'Select Game' . "</option>";
			$select     = str_replace( $old_option, $new_option, $select );
			echo $select;
			?>
		</div>
		<?php
	}

	/**
	 * Save the asset category taxonomy data.
	 */
	public function vrodos_asset_tax_category_box_content_save( $post_id ) {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! isset( $_POST['vrodos_asset3d_cat_noncename'] ) || ! wp_verify_nonce( $_POST['vrodos_asset3d_cat_noncename'], basename( __FILE__ ) ) || ! current_user_can( 'edit_vrodos_asset3d_cat', $post_id ) ) {
			return;
		}
		$type_ID = intval( $_POST['vrodos_asset3d_cat'], 10 );
		$type    = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_asset3d_cat' )->slug : null;
		wp_set_object_terms( $post_id, $type, 'vrodos_asset3d_cat' );
	}

	/**
	 * Content for the asset category selection meta box.
	 */
	public function vrodos_assets_tax_select_category_box_content( $post ) {
		$tax_name = 'vrodos_asset3d_cat';
		?>
		<div class="tagsdiv" id="<?php echo $tax_name; ?>">
			<p class="howto">Select category for current Asset</p>
			<?php
			$nonce_field = wp_nonce_field( basename( __FILE__ ), 'vrodos_asset3d_cat_noncename', true, false );
			echo str_replace( ' id="_ajax_nonce"', '', $nonce_field );
			$type_IDs = wp_get_object_terms( $post->ID, 'vrodos_asset3d_cat', array( 'fields' => 'ids' ) );
			$type_ID  = $type_IDs ? $type_IDs[0] : 0;
			$args     = array(
				'show_option_none'  => 'Select Category',
				'orderby'           => 'name',
				'hide_empty'        => 0,
				'selected'          => $type_ID,
				'name'              => 'vrodos_asset3d_cat',
				'taxonomy'          => 'vrodos_asset3d_cat',
				'echo'              => 0,
				'option_none_value' => '-1',
				'id'                => 'vrodos-select-asset3d-cat-dropdown',
			);
			$select     = wp_dropdown_categories( $args );
			$replace    = "<select$1 onchange='vrodos_hidecfields_asset3d();' required>";
			$select     = preg_replace( '#<select([^>]*)>#', $replace, $select );
			$old_option = "<option value='-1'>";
			$new_option = "<option disabled selected value=''>" . 'Select Category' . "</option>";
			$select     = str_replace( $old_option, $new_option, $select );
			echo $select;
			?>
		</div>
		<?php
	}

	/**
	 * Content for the IPR category selection meta box.
	 */
	public function vrodos_assets_tax_select_iprcategory_box_content( $post ) {
		$tax_name = 'vrodos_asset3d_ipr_cat';
		?>
		<div class="tagsdiv" id="<?php echo $tax_name; ?>">
			<p class="howto">Select IPR category for current Asset</p>
			<?php
			$nonce_field = wp_nonce_field( basename( __FILE__ ), 'vrodos_asset3d_ipr_cat_noncename', true, false );
			echo str_replace( ' id="_ajax_nonce"', '', $nonce_field );
			$type_ids        = wp_get_object_terms( $post->ID, 'vrodos_asset3d_ipr_cat', array( 'fields' => 'ids' ) );
			$selected_type   = empty( $type_ids ) ? '' : $type_ids[0];
			$args            = array(
				'show_option_none'  => 'Select IPR Category',
				'orderby'           => 'name',
				'hide_empty'        => 0,
				'selected'          => $selected_type,
				'name'              => 'vrodos_asset3d_ipr_cat',
				'taxonomy'          => 'vrodos_asset3d_ipr_cat',
				'echo'              => 0,
				'option_none_value' => '-1',
				'id'                => 'vrodos-select-asset3d-ipr-cat-dropdown',
			);
			$select          = wp_dropdown_categories( $args );
			$replace         = "<select$1 required>";
			$select          = preg_replace( '#<select([^>]*)>#', $replace, $select );
			$old_option      = "<option value='-1'>";
			$new_option      = "<option disabled selected value=''>" . 'Select IPR category' . "</option>";
			$select          = str_replace( $old_option, $new_option, $select );
			echo $select;
			?>
		</div>
		<?php
	}

	/**
	 * Save the IPR category taxonomy data.
	 */
	public function vrodos_assets_taxcategory_ipr_box_content_save( $post_id ) {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! isset( $_POST['vrodos_asset3d_ipr_cat_noncename'] ) || ! wp_verify_nonce( $_POST['vrodos_asset3d_ipr_cat_noncename'], basename( __FILE__ ) ) || ! current_user_can( 'edit_vrodos_asset3d_iprcat', $post_id ) ) {
			return;
		}
		$type_ID = intval( $_POST['vrodos_asset3d_ipr_cat'], 10 );
		$type    = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_asset3d_ipr_cat' )->slug : null;
		wp_set_object_terms( $post_id, $type, 'vrodos_asset3d_ipr_cat' );
	}

	/**
	 * Save the project taxonomy data.
	 */
	public function vrodos_asset_project_box_content_save( $post_id ) {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! isset( $_POST['vrodos_asset3d_pgame_noncename'] ) || ! wp_verify_nonce( $_POST['vrodos_asset3d_pgame_noncename'], basename( __FILE__ ) ) || ! current_user_can( 'edit_vrodos_asset3d_pgame', $post_id ) ) {
			return;
		}
		$type_ID = intval( $_POST['vrodos_asset3d_pgame'], 10 );
		$type    = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_asset3d_pgame' )->slug : null;
		wp_set_object_terms( $post_id, $type, 'vrodos_asset3d_pgame' );
	}

	/**
	 * Add custom columns to the asset list table.
	 */
	public function vrodos_set_custom_vrodos_asset3d_columns( $columns ) {
		$columns['asset_slug'] = 'Asset Slug';
		return $columns;
	}

	/**
	 * Fill the content of the custom columns.
	 */
	public function vrodos_set_custom_vrodos_asset3d_columns_fill( $column, $post_id ) {
		switch ( $column ) {
			case 'asset_slug':
				$mypost  = get_post( $post_id );
				$theSlug = $mypost->post_name;
				if ( is_string( $theSlug ) ) {
					echo $theSlug;
				} else {
					echo 'no slug found';
				}
				break;
		}
	}

	/**
	 * Register meta fields for the asset CPT.
	 */
	public function vrodos_asset3d_metas_description() {
		foreach ( $this->vrodos_databox1['fields'] as $meta_entry ) {
			register_post_meta(
				'vrodos_asset3d',
				$meta_entry['id'],
				array(
					'type'         => $meta_entry['type'],
					'default'      => $meta_entry['std'],
					'description'  => $meta_entry['desc'],
					'single'       => $meta_entry['single'],
					'show_in_rest' => $meta_entry['show_in_rest'],
				)
			);
		}
	}

	/**
	 * Add the main data meta box.
	 */
	public function vrodos_assets_databox_add() {
		add_meta_box( 'vrodos-assets-infobox', 'Description Tips for Image-Text', array( $this, 'vrodos_assets_infobox_show' ), 'vrodos_asset3d', 'normal', 'high' );
		add_meta_box( $this->vrodos_databox1['id'], 'Asset Data', array( $this, 'vrodos_assets_databox_show' ), $this->vrodos_databox1['page'], $this->vrodos_databox1['context'], $this->vrodos_databox1['priority'] );
	}

	/**
	 * Show the info box content.
	 */
	public function vrodos_assets_infobox_show() {
		?>
		<style>#vrodos-assets-infobox{display:none;}</style>
		&lt;b&gt;&lt;size=40&gt;MyTitle&lt;/size&gt;&lt;/b&gt; <br/>
		&lt;size=32&gt;&lt;color=green>My description goes here.&lt;/color&gt;&lt;/size&gt; <br/><br/>
		Supported tags<br/>
		&lt;b&gt;Renders the text in boldface.&lt;/b&gt;<br/>
		&lt;i&gt;Renders the text in italics.&lt;/i&gt;<br/>
		&lt;size=20&gt;Sets the size of the text according to the parameter value, given in pixels.&lt;/size&gt;<br/>
		&lt;color=blue&gt;Sets the color of the text according to the parameter value.&lt;/color&gt;<br/>
		<?php
	}

	/**
	 * Show the main data meta box content.
	 */
	public function vrodos_assets_databox_show() {
		global $post;
		$hideshow = $post->post_status == 'publish' ? 'none' : 'block';
		?>
		<div id="vrodos_assets_box_wrapper" style="display:<?php echo $hideshow; ?>;">
			<span class="dashicons dashicons-lock">You must publish the Asset first, in order to fill its data</span>
		</div>
		<input type="hidden" name="vrodos_assets_databox_nonce" value="<?php echo wp_create_nonce( basename( __FILE__ ) ); ?>" />
		<table class="form-table" id="vrodos-custom-fields-table">
			<tbody>
			<?php foreach ( $this->vrodos_databox1['fields'] as $field ) : ?>
				<?php $post_meta_id = get_post_meta( $post->ID, $field['id'], true ); ?>
				<?php
				$valMaxUpload         = intval( ini_get( 'upload_max_filesize' ) );
				$attacmentSizeMessage = $valMaxUpload < 100 ? "Files bigger than " . $valMaxUpload . " MB can not be uploaded <br/> Add to .htaccess the following two lines <br/> php_value upload_max_filesize 256M<br>php_value post_max_size 512M" : '';
				$extension            = substr( $field['id'], strrpos( $field['id'], '_' ) + 1 );
				$showSection          = 'table-row';
				switch ( $extension ) {
					case 'audio':
					case 'diffimage':
					case 'scene':
					case 'video':
					case 'fonts':
					case 'isreward':
					case 'back3dcolor':
						$showSection = 'none';
						break;
				}
				?>
				<tr id="<?php echo esc_attr( $field['id'] ); ?>_field" style="display: <?php echo $showSection; ?>">
					<th style="width:15%">
						<label for="<?php echo esc_attr( $field['id'] ); ?>"><?php echo esc_html( $field['name'] ); ?></label>
						<p><?php echo $attacmentSizeMessage; ?></p>
					</th>
					<td>
						<?php
						$attachment_url  = $post_meta_id ? wp_get_attachment_url( $post_meta_id ) : 'No ' . $field['name'];
						$preview_id      = 'vrodos_asset3d_' . $extension . '_preview';
						$preview_content = $post_meta_id ? "3D object too big to show here" : $extension . " is not defined.";
						switch ( $extension ) {
							case 'glb':
							case 'audio':
								?>
								<input type="text" name="<?php echo esc_attr( $field['id'] ); ?>" readonly
									   id="<?php echo esc_attr( $field['id'] ); ?>"
									   value="<?php echo esc_attr( $post_meta_id ? $post_meta_id : $field['std'] ); ?>"
									   size="30" style="width:65%"/>
								<input id="<?php echo esc_attr( $field['id'] ); ?>_btn" type="button"
									   value="Upload <?php echo esc_html( $field['name'] ); ?>"/>
								<p>Pathfile: <?php echo $attachment_url; ?></p>
								<label for="<?php echo $preview_id; ?>">Preview <?php echo $extension; ?>: </label>
								<textarea id="<?php echo $preview_id; ?>" readonly
										  style=" width:100%; height:200px;"><?php echo $preview_content; ?></textarea>
								<?php
								break;
							case 'diffimage':
							case 'screenimage':
								?>
								<input type="text" name="<?php echo esc_attr( $field['id'] ); ?>" readonly
									   id="<?php echo esc_attr( $field['id'] ); ?>"
									   value="<?php echo esc_attr( $post_meta_id ? $post_meta_id : $field['std'] ); ?>"
									   size="30" style="width:65%"/>
								<input id="<?php echo esc_attr( $field['id'] ); ?>_btn" type="button"
									   value="Upload <?php echo esc_html( $field['name'] ); ?>"/>
								<p>Pathfile: <?php echo $attachment_url; ?></p>
								<img id="<?php echo $preview_id; ?>" style="width:50%; height:auto"
									 src="<?php echo wp_get_attachment_url( $post_meta_id ); ?>"
									 alt="<?php echo $extension; ?> preview image"/>
								<?php
								break;
							case 'isCloned':
							case 'isJoker':
							case 'assettrs':
								?>
								<input type="text" name="<?php echo esc_attr( $field['id'] ); ?>" readonly
									   id="<?php echo esc_attr( $field['id'] ); ?>"
									   value="<?php echo esc_attr( $post_meta_id ? $post_meta_id : $field['std'] ); ?>"
									   size="30" style="width:65%"/>
								<?php
								break;
							case 'scene':
							case 'video':
							case 'fonts':
								// TODO: Add mechanisms for these.
								break;
						}
						?>
					</td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
		<script>
            // JavaScript for meta box interactions
            function vrodos_hidecfields_asset3d() {
                let e = document.getElementById("vrodos-select-asset3d-cat-dropdown");
                let text = e.options[e.selectedIndex].text;
                let sceneField = document.getElementById('vrodos_asset3d_scene_field');
                let infoBox = document.getElementById('vrodos-assets-infobox');

                if (text === 'Doors') {
                    sceneField.style.display = 'block';
                    infoBox.style.display = 'none';
                } else {
                    sceneField.style.display = 'none';
                    if (text === 'Points of Interest (Image-Text)') {
                        infoBox.style.display = 'block';
                    } else {
                        infoBox.style.display = 'none';
                    }
                }
            }
            jQuery(document).ready(function($) {
                let file_frame;
                let wp_media_post_id = wp.media.model.settings.post.id;
                let set_to_post_id = <?php echo $post->ID; ?>;

                $('#vrodos_asset3d_glb_btn').on('click', function() { uploadAssetToPage('vrodos_asset3d_glb', 'model/gltf-binary', 'GLB'); });
                $('#vrodos_asset3d_screenimage_btn').on('click', function() { uploadAssetToPage('vrodos_asset3d_screenimage', 'image', 'Screenshot Image'); });

                function uploadAssetToPage(id, mime_type, type_string) {
                    wp.media.model.settings.post.id = set_to_post_id;
                    file_frame = wp.media({
                        title: 'Select ' + type_string + ' file to upload',
                        button: { text: 'Use this ' + type_string + ' file' },
                        multiple: false,
                        library: { type: mime_type }
                    });
                    file_frame.on('select', function() {
                        let attachment = file_frame.state().get('selection').first().toJSON();
                        $('#' + id).val(attachment.id);
                        if (mime_type === 'image') {
                            $('#' + id + '_preview').attr('src', attachment.url);
                        }
                        wp.media.model.settings.post.id = wp_media_post_id;
                    });
                    file_frame.open();
                }
                $('a.add_media').on('click', function() {
                    wp.media.model.settings.post.id = wp_media_post_id;
                });
            });
		</script>
		<?php
	}

	/**
	 * Save the data from the main asset data meta box.
	 */
	public function vrodos_assets_databox_save( $post_id ) {
		if ( ! isset( $_POST['vrodos_assets_databox_nonce'] ) || ! wp_verify_nonce( $_POST['vrodos_assets_databox_nonce'], basename( __FILE__ ) ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		foreach ( $this->vrodos_databox1['fields'] as $field ) {
			if ( isset( $_POST[ $field['id'] ] ) ) {
				$new = $_POST[ $field['id'] ];
				$old = get_post_meta( $post_id, $field['id'], true );
				if ( $new && $new != $old ) {
					update_post_meta( $post_id, $field['id'], $new );
				} elseif ( '' == $new && $old ) {
					delete_post_meta( $post_id, $field['id'], $old );
				}
			}
		}
	}


	// --- Asset saving and updating logic ---

	/**
	 * Create extra 3D files for the asset.
	 */
	public static function create_asset_3dfiles_extra_frontend($asset_new_id, $project_id, $asset_cat_id) {
		// Clear out all previous attachments
		$attachments = get_children( array('post_parent' => $asset_new_id, 'post_type' => 'attachment') );
		foreach ($attachments as $attachment) {
			if (strpos($attachment->post_title, 'screenshot') === false) {
				wp_delete_attachment($attachment->ID, true);
			}
		}

		// Upload and update DB
		if (isset($_FILES['glbFileInput']) && $_FILES['glbFileInput']['error'] === UPLOAD_ERR_OK) {
			$glb_file_id = VRodos_Upload_Manager::upload_asset_text(
				null,
				'glb_' . $asset_new_id . '_' . $asset_cat_id,
				$asset_new_id,
				$_FILES,
				0,
				$project_id
			);
			update_post_meta($asset_new_id, 'vrodos_asset3d_glb', $glb_file_id);
		}
	}

	/**
	 * Create a new asset from the frontend.
	 */
	public static function create_asset_frontend($asset_pgame_id, $asset_cat_id, $game_slug, $asset_cat_ipr_id, $asset_title, $asset_fonts, $asset_back_3d_color, $asset_trs, $asset_description) {
		$asset_taxonomies = array(
			'vrodos_asset3d_pgame'    => array($asset_pgame_id),
			'vrodos_asset3d_cat'      => array($asset_cat_id),
			'vrodos_asset3d_ipr_cat'  => array($asset_cat_ipr_id),
		);

		$asset_information = array(
			'post_title'   => $asset_title,
			'post_content' => $asset_description,
			'post_type'    => 'vrodos_asset3d',
			'post_status'  => 'publish',
			'tax_input'    => $asset_taxonomies,
		);

		$asset_id = wp_insert_post($asset_information);
		update_post_meta($asset_id, 'vrodos_asset3d_pathData', $game_slug);
		self::update_asset_meta($asset_id, $asset_fonts, $asset_back_3d_color, $asset_trs);

		return $asset_id ? $asset_id : 0;
	}

	/**
	 * Update an existing asset from the frontend.
	 */
	public static function update_asset_frontend($asset_pgame_id, $asset_cat_id, $asset_id, $asset_cat_ipr_id, $asset_title, $asset_fonts, $asset_back_3d_color, $asset_trs, $asset_description) {
		$asset_taxonomies = array(
			'vrodos_asset3d_pgame'    => array($asset_pgame_id),
			'vrodos_asset3d_cat'      => array($asset_cat_id),
			'vrodos_asset3d_ipr_cat'  => array($asset_cat_ipr_id),
		);

		$data = array(
			'ID'           => $asset_id,
			'post_title'   => $asset_title,
			'post_content' => $asset_description,
			'tax_input'    => $asset_taxonomies,
		);

		wp_update_post($data);
		self::update_asset_meta($asset_id, $asset_fonts, $asset_back_3d_color, $asset_trs);

		return 1;
	}

	/**
	 * Add images to the asset.
	 */
	public static function create_asset_add_images_frontend($asset_id, $file) {
		$attachment_id = VRodos_Upload_Manager::upload_img_vid_aud($file, $asset_id);
		update_post_meta($asset_id, 'vrodos_asset3d_poi_imgtxt_image', $attachment_id);
	}

	/**
	 * Add audio to the asset.
	 */
	public static function create_asset_add_audio_frontend($asset_new_id) {
		if (isset($_FILES['audioFileInput']) && $_FILES['audioFileInput']['error'] !== UPLOAD_ERR_NO_FILE) {
			$attachment_audio_id = VRodos_Upload_Manager::upload_img_vid_aud($_FILES['audioFileInput'], $asset_new_id);
			update_post_meta($asset_new_id, 'vrodos_asset3d_audio', $attachment_audio_id);
		}
	}

	/**
	 * Add video to the asset.
	 */
	public static function create_asset_add_video_frontend($asset_new_id) {
		if (isset($_FILES['videoFileInput']) && $_FILES['videoFileInput']['error'] !== UPLOAD_ERR_NO_FILE) {
			$attachment_video_id = VRodos_Upload_Manager::upload_img_vid_aud($_FILES['videoFileInput'], $asset_new_id);
			update_post_meta($asset_new_id, 'vrodos_asset3d_video', $attachment_video_id);
		}
	}

	/**
	 * Update the asset's meta data.
	 */
	public static function update_asset_meta($asset_id, $asset_fonts, $asset_back_3d_color, $asset_trs) {
		update_post_meta($asset_id, 'vrodos_asset3d_fonts', $asset_fonts);
		update_post_meta($asset_id, 'vrodos_asset3d_back3dcolor', $asset_back_3d_color);
		update_post_meta($asset_id, 'vrodos_asset3d_assettrs', $asset_trs);
	}
}
