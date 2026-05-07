<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_CPT_Metabox_Admin {
	public function vrodos_create_pathdata_asset( $post_ID, $post, $update ): void {
		if ( get_post_type( $post_ID ) === 'vrodos_asset3d' ) {
			$parentGameID = $_GET['vrodos_game'] ?? null;
			if ( ! is_numeric( $parentGameID ) ) {
				return;
			}
			$parentGameID   = intval( $parentGameID );
			$game_post = get_post( $parentGameID );
			$parentGameSlug = $game_post ? $game_post->post_name : '';
			update_post_meta( $post_ID, 'vrodos_asset3d_pathData', $parentGameSlug );
		}
	}

	public function vrodos_set_custom_vrodos_asset3d_columns( $columns ): array {
		$columns['asset_slug'] = 'Asset Slug';
		return $columns;
	}

	public function vrodos_set_custom_vrodos_asset3d_columns_fill( $column, $post_id ): void {
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

	public function vrodos_asset3d_metas_description(): void {
		foreach ( $this->vrodos_databox1['fields'] as $meta_entry ) {
			register_post_meta(
				'vrodos_asset3d',
				$meta_entry['id'],
				['type'         => $meta_entry['type'], 'default'      => $meta_entry['std'], 'description'  => $meta_entry['desc'], 'single'       => $meta_entry['single'], 'show_in_rest' => $meta_entry['show_in_rest']]
			);
		}
	}

	public function vrodos_assets_databox_add(): void {
		add_meta_box( 'vrodos-assets-infobox', 'Description Tips for Image-Text', $this->vrodos_assets_infobox_show(...), 'vrodos_asset3d', 'normal', 'high' );
		add_meta_box( $this->vrodos_databox1['id'], 'Asset Data', $this->vrodos_assets_databox_show(...), $this->vrodos_databox1['page'], $this->vrodos_databox1['context'], $this->vrodos_databox1['priority'] );
	}

	public function vrodos_assets_infobox_show(): void {
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

	public function vrodos_assets_databox_show(): void {
		global $post;
		$hideshow = $post->post_status == 'publish' ? 'none' : 'block';
		?>
		<div id="vrodos_assets_box_wrapper" style="display:<?php echo $hideshow; ?>;">
			<span class="dashicons dashicons-lock">You must publish the Asset first, in order to fill its data</span>
		</div>
		<input type="hidden" name="vrodos_assets_databox_nonce" value="<?php echo wp_create_nonce( self::NONCE_BASENAME ); ?>" />
		<table class="form-table" id="vrodos-custom-fields-table">
			<tbody>
			<?php foreach ( $this->vrodos_databox1['fields'] as $field ) : ?>
				<?php $post_meta_id = get_post_meta( $post->ID, $field['id'], true ); ?>
				<?php
				$valMaxUpload         = intval( ini_get( 'upload_max_filesize' ) );
				$attacmentSizeMessage = $valMaxUpload < 100 ? 'Files bigger than ' . $valMaxUpload . ' MB can not be uploaded <br/> Add to .htaccess the following two lines <br/> php_value upload_max_filesize 256M<br>php_value post_max_size 512M' : '';
				$extension            = substr( (string) $field['id'], strrpos( (string) $field['id'], '_' ) + 1 );
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
						$preview_content = $post_meta_id ? '3D object too big to show here' : $extension . ' is not defined.';
						switch ( $extension ) {
							case 'glb':
							case 'audio':
								?>
								<input type="text" name="<?php echo esc_attr( $field['id'] ); ?>" readonly
										id="<?php echo esc_attr( $field['id'] ); ?>"
										value="<?php echo esc_attr( $post_meta_id ?: $field['std'] ); ?>"
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
										value="<?php echo esc_attr( $post_meta_id ?: $field['std'] ); ?>"
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
							case 'isJoker': // Displayed as 'isShared' in labels but keep ID for logic
							case 'assettrs':
								?>
								<input type="text" name="<?php echo esc_attr( $field['id'] ); ?>" readonly
										id="<?php echo esc_attr( $field['id'] ); ?>"
										value="<?php echo esc_attr( $post_meta_id ?: $field['std'] ); ?>"
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
			document.addEventListener('DOMContentLoaded', function() {
				let file_frame;
				let wp_media_post_id = wp.media.model.settings.post.id;
				let set_to_post_id = <?php echo $post->ID; ?>;

				document.getElementById('vrodos_asset3d_glb_btn').addEventListener('click', function() { uploadAssetToPage('vrodos_asset3d_glb', 'model/gltf-binary', 'GLB'); });
				document.getElementById('vrodos_asset3d_screenimage_btn').addEventListener('click', function() { uploadAssetToPage('vrodos_asset3d_screenimage', 'image', 'Screenshot Image'); });

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
						document.getElementById(id).value = attachment.id;
						if (mime_type === 'image') {
							var preview = document.getElementById(id + '_preview');
							if (preview) preview.src = attachment.url;
						}
						wp.media.model.settings.post.id = wp_media_post_id;
					});
					file_frame.open();
				}
				document.querySelectorAll('a.add_media').forEach(function(el) {
					el.addEventListener('click', function() {
						wp.media.model.settings.post.id = wp_media_post_id;
					});
				});
			});
		</script>
		<?php
	}

	public function vrodos_assets_databox_save( $post_id ): void {
		if ( ! isset( $_POST['vrodos_assets_databox_nonce'] ) || ! wp_verify_nonce( $_POST['vrodos_assets_databox_nonce'], self::NONCE_BASENAME ) ) {
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
}
