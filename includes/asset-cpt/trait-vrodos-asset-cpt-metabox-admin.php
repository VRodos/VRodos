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
		$hideshow               = $post->post_status == 'publish' ? 'none' : 'block';
		$saved_asset_type_terms = wp_get_post_terms( $post->ID, 'vrodos_asset3d_cat' );
		$is_audio_asset         = ! is_wp_error( $saved_asset_type_terms ) && ! empty( $saved_asset_type_terms ) && ( $saved_asset_type_terms[0]->slug ?? '' ) === 'audio';
		$audio_field_ids        = [
			'vrodos_asset3d_audio',
			'vrodos_asset3d_audio_playback_mode',
			'vrodos_asset3d_audio_loop',
			'vrodos_asset3d_audio_volume',
			'vrodos_asset3d_audio_ref_distance',
			'vrodos_asset3d_audio_max_distance',
			'vrodos_asset3d_audio_rolloff_factor',
		];
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
				$is_audio_field       = in_array( $field['id'], $audio_field_ids, true );
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
				if ( $is_audio_field ) {
					$showSection = $is_audio_asset ? 'table-row' : 'none';
				}
				?>
				<tr id="<?php echo esc_attr( $field['id'] ); ?>_field" class="<?php echo $is_audio_field ? 'vrodos-audio-asset-field' : ''; ?>" style="display: <?php echo $showSection; ?>">
					<th style="width:15%">
						<label for="<?php echo esc_attr( $field['id'] ); ?>"><?php echo esc_html( $field['name'] ); ?></label>
						<p><?php echo $attacmentSizeMessage; ?></p>
					</th>
					<td>
						<?php
						$attachment_url  = $post_meta_id ? self::resolve_media_meta_url( $post_meta_id ) : '';
						$preview_id      = 'vrodos_asset3d_' . $extension . '_preview';
						$preview_content = $post_meta_id ? '3D object too big to show here' : $extension . ' is not defined.';
						switch ( $field['id'] ) {
							case 'vrodos_asset3d_audio_playback_mode':
								$playback_mode = in_array( (string) $post_meta_id, [ 'autoplay', 'interact' ], true ) ? (string) $post_meta_id : 'interact';
								?>
								<select name="<?php echo esc_attr( $field['id'] ); ?>" id="<?php echo esc_attr( $field['id'] ); ?>">
									<option value="interact" <?php selected( $playback_mode, 'interact' ); ?>>Interact</option>
									<option value="autoplay" <?php selected( $playback_mode, 'autoplay' ); ?>>Autoplay</option>
								</select>
								<?php
								break;
							case 'vrodos_asset3d_audio_loop':
								?>
								<input type="hidden" name="<?php echo esc_attr( $field['id'] ); ?>" value="0"/>
								<label>
									<input type="checkbox" name="<?php echo esc_attr( $field['id'] ); ?>" id="<?php echo esc_attr( $field['id'] ); ?>" value="1" <?php checked( filter_var( $post_meta_id, FILTER_VALIDATE_BOOLEAN ) ); ?>/>
									Loop audio
								</label>
								<?php
								break;
							case 'vrodos_asset3d_audio_volume':
								?>
								<input type="number" name="<?php echo esc_attr( $field['id'] ); ?>" id="<?php echo esc_attr( $field['id'] ); ?>" value="<?php echo esc_attr( $post_meta_id ?: $field['std'] ); ?>" min="0" max="1" step="0.1"/>
								<?php
								break;
							case 'vrodos_asset3d_audio_ref_distance':
							case 'vrodos_asset3d_audio_max_distance':
								?>
								<input type="number" name="<?php echo esc_attr( $field['id'] ); ?>" id="<?php echo esc_attr( $field['id'] ); ?>" value="<?php echo esc_attr( $post_meta_id ?: $field['std'] ); ?>" min="0.1" step="0.1"/>
								<?php
								break;
							case 'vrodos_asset3d_audio_rolloff_factor':
								?>
								<input type="number" name="<?php echo esc_attr( $field['id'] ); ?>" id="<?php echo esc_attr( $field['id'] ); ?>" value="<?php echo esc_attr( $post_meta_id ?: $field['std'] ); ?>" min="0" step="0.1"/>
								<?php
								break;
							default:
								switch ( $extension ) {
							case 'glb':
								?>
								<input type="text" name="<?php echo esc_attr( $field['id'] ); ?>" readonly
										id="<?php echo esc_attr( $field['id'] ); ?>"
										value="<?php echo esc_attr( $post_meta_id ?: $field['std'] ); ?>"
										size="30" style="width:65%"/>
								<input id="<?php echo esc_attr( $field['id'] ); ?>_btn" type="button"
										value="Upload <?php echo esc_html( $field['name'] ); ?>"/>
								<p>Pathfile: <?php echo $attachment_url ? esc_html( $attachment_url ) : esc_html( 'No ' . $field['name'] ); ?></p>
								<div id="<?php echo esc_attr( $preview_id ); ?>" class="vrodos-admin-glb-preview" data-glb-url="<?php echo esc_url( $attachment_url ); ?>">
									<div class="vrodos-admin-glb-preview-status">Loading 3D preview...</div>
								</div>
								<?php
								break;
							case 'audio':
								?>
								<input type="text" name="<?php echo esc_attr( $field['id'] ); ?>" readonly
										id="<?php echo esc_attr( $field['id'] ); ?>"
										value="<?php echo esc_attr( $post_meta_id ?: $field['std'] ); ?>"
										size="30" style="width:65%"/>
								<input id="<?php echo esc_attr( $field['id'] ); ?>_btn" type="button"
										value="Upload <?php echo esc_html( $field['name'] ); ?>"/>
								<p>Pathfile: <?php echo $attachment_url ? esc_html( $attachment_url ) : esc_html( 'No ' . $field['name'] ); ?></p>
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
								<p>Pathfile: <?php echo $attachment_url ? esc_html( $attachment_url ) : esc_html( 'No ' . $field['name'] ); ?></p>
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
				if (!e || e.selectedIndex < 0) {
					return;
				}
				let text = e.options[e.selectedIndex].text.trim();
				let normalizedText = text.toLowerCase();
				let sceneField = document.getElementById('vrodos_asset3d_scene_field');
				let infoBox = document.getElementById('vrodos-assets-infobox');
				let isAudio = normalizedText === 'audio';

				document.querySelectorAll('.vrodos-audio-asset-field').forEach(function(row) {
					row.style.display = isAudio ? 'table-row' : 'none';
				});

				if (normalizedText === 'door' || normalizedText === 'doors') {
					if (sceneField) sceneField.style.display = 'block';
					if (infoBox) infoBox.style.display = 'none';
				} else {
					if (sceneField) sceneField.style.display = 'none';
					if (normalizedText === 'poi - image / text' || normalizedText === 'points of interest (image-text)') {
						if (infoBox) infoBox.style.display = 'block';
					} else {
						if (infoBox) infoBox.style.display = 'none';
					}
				}
			}

			function vrodos_dispose_admin_glb_preview() {
				let state = window.vrodosAdminGlbPreviewState;
				if (!state) {
					return;
				}
				if (state.animationFrame) {
					cancelAnimationFrame(state.animationFrame);
				}
				if (state.resizeObserver) {
					state.resizeObserver.disconnect();
				}
				if (state.scene) {
					state.scene.traverse(function(object) {
						if (object.geometry && typeof object.geometry.dispose === 'function') {
							object.geometry.dispose();
						}
						if (object.material) {
							let materials = Array.isArray(object.material) ? object.material : [object.material];
							materials.forEach(function(material) {
								if (material && typeof material.dispose === 'function') {
									material.dispose();
								}
							});
						}
					});
				}
				if (state.renderer) {
					state.renderer.dispose();
				}
				window.vrodosAdminGlbPreviewState = null;
			}

			function vrodos_init_admin_glb_preview(glbUrl) {
				let preview = document.getElementById('vrodos_asset3d_glb_preview');
				if (!preview) {
					return;
				}

				let status = preview.querySelector('.vrodos-admin-glb-preview-status');
				let url = glbUrl || preview.getAttribute('data-glb-url') || '';
				preview.setAttribute('data-glb-url', url);
				vrodos_dispose_admin_glb_preview();
				Array.from(preview.querySelectorAll('canvas')).forEach(function(canvas) {
					canvas.remove();
				});
				if (status) {
					status.style.display = 'flex';
					status.textContent = url ? 'Loading 3D preview...' : 'No GLB selected';
				}

				if (!url) {
					if (status) status.textContent = 'No GLB selected';
					return;
				}
				if (!window.THREE || !THREE.WebGLRenderer || !THREE.GLTFLoader) {
					if (status) status.textContent = '3D preview unavailable';
					return;
				}

				function getPreviewSize() {
					let rect = preview.getBoundingClientRect();
					let fallbackRect = preview.parentElement ? preview.parentElement.getBoundingClientRect() : rect;
					let rawWidth = rect.width > 0 ? rect.width : fallbackRect.width;
					let width = Math.min(Math.max(Math.floor(rawWidth || 320), 320), 1200);
					let rawHeight = rect.height > 0 ? rect.height : width * 9 / 16;
					let height = Math.min(Math.max(Math.floor(rawHeight || 260), 260), 420);

					return { width: width, height: height };
				}

				let previewSize = getPreviewSize();
				let width = previewSize.width;
				let height = previewSize.height;
				let scene = new THREE.Scene();
				scene.background = new THREE.Color(0x111827);

				let camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
				camera.position.set(2, 1.5, 2);

				let renderer = new THREE.WebGLRenderer({ antialias: true });
				if (THREE.SRGBColorSpace) {
					renderer.outputColorSpace = THREE.SRGBColorSpace;
				}
				renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
				renderer.setSize(width, height);
				renderer.domElement.style.width = '100%';
				renderer.domElement.style.height = '100%';
				preview.appendChild(renderer.domElement);

				scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6));
				let keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
				keyLight.position.set(3, 5, 4);
				scene.add(keyLight);

				let controls = null;
				if (THREE.OrbitControls) {
					controls = new THREE.OrbitControls(camera, renderer.domElement);
					controls.enableDamping = true;
					controls.dampingFactor = 0.08;
				}

				let loader = new THREE.GLTFLoader();
				if (THREE.DRACOLoader && typeof loader.setDRACOLoader === 'function') {
					let dracoLoader = new THREE.DRACOLoader();
					dracoLoader.setDecoderPath(window.vrodos_three_draco_decoder_path || window.vrodos_three_decoder_path || '');
					loader.setDRACOLoader(dracoLoader);
				}

				let state = { scene: scene, renderer: renderer, animationFrame: null, resizeObserver: null };
				window.vrodosAdminGlbPreviewState = state;

				function render() {
					state.animationFrame = requestAnimationFrame(render);
					if (controls) controls.update();
					renderer.render(scene, camera);
				}

				function fitCamera(object) {
					let box = new THREE.Box3().setFromObject(object);
					if (box.isEmpty()) {
						return;
					}
					let size = box.getSize(new THREE.Vector3());
					let center = box.getCenter(new THREE.Vector3());
					let maxDim = Math.max(size.x, size.y, size.z, 0.1);
					let distance = (maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))) * 1.6;
					camera.near = Math.max(distance / 100, 0.01);
					camera.far = Math.max(distance * 100, 1000);
					camera.position.set(center.x + distance, center.y + distance * 0.55, center.z + distance);
					camera.lookAt(center);
					camera.updateProjectionMatrix();
					if (controls) {
						controls.target.copy(center);
						controls.update();
					}
				}

				loader.load(
					url,
					function(gltf) {
						scene.add(gltf.scene);
						fitCamera(gltf.scene);
						if (status) status.style.display = 'none';
					},
					undefined,
					function(error) {
						console.warn('VRodos GLB preview failed to load.', error);
						if (status) status.textContent = 'Could not load 3D preview';
					}
				);

				if (window.ResizeObserver) {
					state.resizeObserver = new ResizeObserver(function() {
						let nextSize = getPreviewSize();
						let nextWidth = nextSize.width;
						let nextHeight = nextSize.height;
						camera.aspect = nextWidth / nextHeight;
						camera.updateProjectionMatrix();
						renderer.setSize(nextWidth, nextHeight);
					});
					state.resizeObserver.observe(preview);
				}

				render();
			}

			document.addEventListener('DOMContentLoaded', function() {
				let file_frame;
				let wp_media_post_id = wp.media.model.settings.post.id;
				let set_to_post_id = <?php echo $post->ID; ?>;

				document.getElementById('vrodos_asset3d_glb_btn').addEventListener('click', function() { uploadAssetToPage('vrodos_asset3d_glb', 'model/gltf-binary', 'GLB'); });
				document.getElementById('vrodos_asset3d_audio_btn').addEventListener('click', function() { uploadAssetToPage('vrodos_asset3d_audio', 'audio', 'Audio'); });
				document.getElementById('vrodos_asset3d_screenimage_btn').addEventListener('click', function() { uploadAssetToPage('vrodos_asset3d_screenimage', 'image', 'Screenshot Image'); });
				document.getElementById('vrodos-select-asset3d-cat-dropdown').addEventListener('change', vrodos_hidecfields_asset3d);
				vrodos_hidecfields_asset3d();
				vrodos_init_admin_glb_preview();

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
						if (id === 'vrodos_asset3d_glb') {
							vrodos_init_admin_glb_preview(attachment.url);
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
				$new = wp_unslash( $_POST[ $field['id'] ] );
				switch ( $field['id'] ) {
					case 'vrodos_asset3d_audio_playback_mode':
						$new = sanitize_key( (string) $new );
						if ( ! in_array( $new, [ 'autoplay', 'interact' ], true ) ) {
							$new = 'interact';
						}
						update_post_meta( $post_id, $field['id'], $new );
						continue 2;
					case 'vrodos_asset3d_audio_loop':
						update_post_meta( $post_id, $field['id'], ! empty( $new ) ? '1' : '0' );
						continue 2;
					case 'vrodos_asset3d_audio_volume':
						update_post_meta( $post_id, $field['id'], self::sanitize_audio_float_setting( $new, 0.0, 1.0, 1.0 ) );
						continue 2;
					case 'vrodos_asset3d_audio_ref_distance':
						update_post_meta( $post_id, $field['id'], self::sanitize_audio_float_setting( $new, 0.1, 1000.0, 2.0 ) );
						continue 2;
					case 'vrodos_asset3d_audio_max_distance':
						update_post_meta( $post_id, $field['id'], self::sanitize_audio_float_setting( $new, 0.1, 10000.0, 20.0 ) );
						continue 2;
					case 'vrodos_asset3d_audio_rolloff_factor':
						update_post_meta( $post_id, $field['id'], self::sanitize_audio_float_setting( $new, 0.0, 10.0, 1.0 ) );
						continue 2;
				}

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
