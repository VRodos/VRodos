<?php

class VRodos_Scene_CPT_Manager {

	private array $vrodos_scenes_metas_definition;

	public function __construct() {
		add_action( 'init', $this->handle_new_scene_submission(...) );

		$this->vrodos_scenes_metas_definition = ['id'       => 'vrodos-scenes-databox', 'page'     => 'vrodos_scene', 'context'  => 'normal', 'priority' => 'high', 'fields'   => [['name' => 'Scene caption', 'desc' => 'Scene caption', 'id'   => 'vrodos_scene_caption', 'type' => 'textarea', 'std'  => '']]];

		add_action( 'add_meta_boxes', $this->scenes_taxgame_box(...) );
		add_action( 'save_post', $this->scenes_taxgame_box_content_save(...) );
		add_action( 'save_post', $this->scenes_taxyaml_box_content_save(...) );
		add_filter( 'manage_vrodos_scene_posts_columns', $this->set_custom_vrodos_scene_columns(...) );
		add_action( 'manage_vrodos_scene_posts_custom_column', $this->set_custom_vrodos_scene_columns_fill(...), 10, 2 );
		add_action( 'add_meta_boxes', $this->scenes_meta_definitions_add(...) );
		add_action( 'save_post', $this->scenes_metas_save(...) );
		add_filter( 'wp_revisions_to_keep', $this->ns_limit_revisions(...), 10, 2 );
	}

	public function ns_limit_revisions( $num, $post ): int {

		$N              = 50; // Keep only the latest N revisions
		$target_types   = ['vrodos_scene'];
		$is_target_type = in_array( $post->post_type, $target_types );
		return $is_target_type ? $N : $num;
	}

	// Create Scene's Game Box @ scene's backend
	public function scenes_taxgame_box(): void {
		// Removes default side metaboxes
		remove_meta_box( 'vrodos_scene_pgamediv', 'vrodos_scene', 'side' );
		remove_meta_box( 'vrodos_scene_yamldiv', 'vrodos_scene', 'side' );

		// Adds a Project selection custom metabox
		add_meta_box( 'tagsdiv-vrodos_scene_pgame', 'Parent Project', $this->scenes_taxgame_box_content(...), 'vrodos_scene', 'side', 'high' );
		// Adds a YAML selection custom metabox
		add_meta_box( 'tagsdiv-vrodos_scene_yamldiv', 'Scene YAML', $this->scenes_taxyaml_box_content(...), 'vrodos_scene', 'side', 'high' );
	}

	public function scenes_taxgame_box_content( $post ): void {
		$tax_name = 'vrodos_scene_pgame';
		?>
		<div class="tagsdiv" id="<?php echo $tax_name; ?>">
			<p class="howto"><?php echo 'Select Project for current Scene'; ?></p>
			<?php
			// Use nonce for verification
			wp_nonce_field( plugin_basename( __FILE__ ), 'vrodos_scene_pgame_noncename' );
			$type_ids      = wp_get_object_terms( $post->ID, 'vrodos_scene_pgame', ['fields' => 'ids'] );
			$selected_type = empty( $type_ids ) ? '' : $type_ids[0];
			$args          = ['show_option_none'  => 'Select Project', 'orderby'           => 'name', 'hide_empty'        => 0, 'selected'          => $selected_type, 'name'              => 'vrodos_scene_pgame', 'taxonomy'          => 'vrodos_scene_pgame', 'echo'              => 0, 'option_none_value' => '-1', 'id'                => 'vrodos-select-pgame-dropdown'];
			$select        = wp_dropdown_categories( $args );
			$replace       = '<select$1 required>';
			$select        = preg_replace( '#<select([^>]*)>#', $replace, $select );
			$old_option    = "<option value='-1'>";
			$new_option    = "<option disabled selected value=''>" . 'Select project' . '</option>';
			$select        = str_replace( $old_option, $new_option, $select );
			echo $select;
			?>
		</div>
		<?php
	}

	public function scenes_taxyaml_box_content( $post ): void {
		$tax_name = 'vrodos_scene_yaml';
		?>
		<div class="tagsdiv" id="<?php echo $tax_name; ?>">
			<p class="howto"><?php echo 'Select YAML for current Scene'; ?></p>
			<?php
			// Use nonce for verification
			wp_nonce_field( plugin_basename( __FILE__ ), 'vrodos_scene_yaml_noncename' );
			$type_ids      = wp_get_object_terms( $post->ID, 'vrodos_scene_yaml', ['fields' => 'ids'] );
			$selected_type = empty( $type_ids ) ? '' : $type_ids[0];
			$args          = ['show_option_none'  => 'Select YAML', 'orderby'           => 'name', 'hide_empty'        => 0, 'selected'          => $selected_type, 'name'              => 'vrodos_scene_yaml', 'taxonomy'          => 'vrodos_scene_yaml', 'echo'              => 0, 'option_none_value' => '-1', 'id'                => 'vrodos-select-yaml-dropdown'];
			$select        = wp_dropdown_categories( $args );
			$replace       = '<select$1 required>';
			$select        = preg_replace( '#<select([^>]*)>#', $replace, $select );
			$old_option    = "<option value='-1'>";
			$new_option    = "<option disabled selected value=''>" . 'Select YAML' . '</option>';
			$select        = str_replace( $old_option, $new_option, $select );
			echo $select;
			?>
		</div>
		<?php
	}

	public function scenes_taxgame_box_content_save( $post_id ): void {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) ) {
			return;
		}

		if ( ! isset( $_POST['vrodos_scene_pgame_noncename'] ) ) {
			return;
		}

		if ( ! wp_verify_nonce( $_POST['vrodos_scene_pgame_noncename'], plugin_basename( __FILE__ ) ) ) {
			return;
		}

		if ( 'vrodos_scene' == $_POST['post_type'] ) {
			if ( ! current_user_can( 'edit_pages', $post_id ) ) {
				return;
			}
		} elseif ( ! current_user_can( 'edit_posts', $post_id ) ) {
				return;
		}

		$type_ID = intval( $_POST['vrodos_scene_pgame'], 10 );
		$type    = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_scene_pgame' )->slug : null;
		wp_set_object_terms( $post_id, $type, 'vrodos_scene_pgame' );
	}

	public function scenes_taxyaml_box_content_save( $post_id ): void {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) ) {
			return;
		}

		if ( ! isset( $_POST['vrodos_scene_yaml_noncename'] ) ) {
			return;
		}

		if ( ! wp_verify_nonce( $_POST['vrodos_scene_yaml_noncename'], plugin_basename( __FILE__ ) ) ) {
			return;
		}

		if ( 'vrodos_scene' == $_POST['post_type'] ) {
			if ( ! current_user_can( 'edit_pages', $post_id ) ) {
				return;
			}
		} elseif ( ! current_user_can( 'edit_posts', $post_id ) ) {
				return;
		}

		$type_ID = intval( $_POST['vrodos_scene_yaml'], 10 );
		$type    = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_scene_yaml' )->slug : null;
		wp_set_object_terms( $post_id, $type, 'vrodos_scene_yaml' );
	}

	public function set_custom_vrodos_scene_columns( $columns ): array {
		$columns['scene_slug'] = 'Scene Slug';
		return $columns;
	}

	public function set_custom_vrodos_scene_columns_fill( $column, $post_id ): void {
		switch ( $column ) {
			case 'scene_slug':
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

	public function scenes_meta_definitions_add(): void {
		add_meta_box(
			$this->vrodos_scenes_metas_definition['id'],
			'Scene Data',
			$this->scenes_metas_adminside_show(...),
			$this->vrodos_scenes_metas_definition['page'],
			$this->vrodos_scenes_metas_definition['context'],
			$this->vrodos_scenes_metas_definition['priority']
		);
	}

	public function scenes_metas_adminside_show(): void {
		global $post;
		echo '<input type="hidden" name="vrodos_scenes_databox_nonce" value="', wp_create_nonce( basename( __FILE__ ) ), '" />';
		echo '<table class="form-table" id="vrodos-custom-fields-table">';
		foreach ( $this->vrodos_scenes_metas_definition['fields'] as $field ) {
			$meta = get_post_meta( $post->ID, $field['id'], true );
			echo '<tr>',
			'<th style="width:20%"><label for="', esc_attr( $field['id'] ), '">', esc_html( $field['name'] ), '</label></th>',
			'<td>';

			switch ( $field['type'] ) {
				case 'text':
					echo '<input type="text" name="', esc_attr( $field['id'] ), '" id="', esc_attr( $field['id'] ), '" value="', esc_attr( $meta ?: $field['std'] ), '" size="30" style="width:97%" />', '<br />', esc_html( $field['desc'] );
					break;
				case 'numeric':
					echo '<input type="number" name="', esc_attr( $field['id'] ), '" id="', esc_attr( $field['id'] ), '" value="', esc_attr( $meta ?: $field['std'] ), '" size="30" style="width:97%" />', '<br />', esc_html( $field['desc'] );
					break;
				case 'textarea':
					echo '<textarea name="', esc_attr( $field['id'] ), '" id="', esc_attr( $field['id'] ), '" cols="60" rows="4" style="width:97%">', esc_attr( $meta ?: $field['std'] ), '</textarea>', '<br />', esc_html( $field['desc'] );
					break;
				case 'select':
					echo '<select name="', esc_attr( $field['id'] ), '" id="', esc_attr( $field['id'] ), '">';
					foreach ( $field['options'] as $option ) {
						echo '<option ', $meta == $option ? ' selected="selected"' : '', '>', esc_html( $option ), '</option>';
					}
					echo '</select>';
					break;
				case 'checkbox':
					echo '<input type="checkbox" name="', esc_attr( $field['id'] ), '" id="', esc_attr( $field['id'] ), '"', $meta ? ' checked="checked"' : '', ' />';
					break;
			}
			echo '</td><td>',
			'</td></tr>';
		}
		echo '</table>';
	}

	public function scenes_metas_save( $post_id ) {
		if ( ! isset( $_POST['vrodos_scenes_databox_nonce'] ) ) {
			return;
		}

		if ( ! wp_verify_nonce( $_POST['vrodos_scenes_databox_nonce'], basename( __FILE__ ) ) ) {
			return $post_id;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return $post_id;
		}
		if ( 'page' == $_POST['post_type'] ) {
			if ( ! current_user_can( 'edit_pages', $post_id ) ) {
				return $post_id;
			}
		} elseif ( ! current_user_can( 'edit_posts', $post_id ) ) {
			return $post_id;
		}
		foreach ( $this->vrodos_scenes_metas_definition['fields'] as $field ) {
			$old = get_post_meta( $post_id, $field['id'], true );
			$new = $_POST[ $field['id'] ];
			if ( $new && $new != $old ) {
				update_post_meta( $post_id, $field['id'], $new );
			} elseif ( '' == $new && $old ) {
				delete_post_meta( $post_id, $field['id'], $old );
			}
		}
		return $post_id;
	}

	public static function parse_scene_json_and_prepare_script_data( $scene_json, $relative_path ): array {
		$scene_data   = [];
		$scene_json   = htmlspecialchars_decode( (string) $scene_json );
		$content_json = json_decode( $scene_json );

		if ( json_last_error() !== JSON_ERROR_NONE || ! isset( $content_json->metadata ) ) {
			return $scene_data;
		}

		$json_metadata = $content_json->metadata;

		// Metadata
		$scene_data['ClearColor']             = $json_metadata->ClearColor ?? '#ffffff';
		$scene_data['enableGeneralChat']      = $json_metadata->enableGeneralChat ?? false;
		$scene_data['enableAvatar']           = $json_metadata->enableAvatar ?? false;
		$scene_data['disableMovement']        = $json_metadata->disableMovement ?? false;
		$scene_data['aframeCollisionMode']    = $json_metadata->aframeCollisionMode ?? 'auto';
		$scene_data['aframeRenderQuality']    = $json_metadata->aframeRenderQuality ?? 'standard';
		$scene_data['aframeShadowQuality']    = $json_metadata->aframeShadowQuality ?? 'medium';
		$scene_data['aframeAAQuality']        = $json_metadata->aframeAAQuality ?? 'balanced';
		$scene_data['aframeFPSMeterEnabled']  = $json_metadata->aframeFPSMeterEnabled ?? false;
		$scene_data['aframeLegacyHorizonStageSize'] = isset( $json_metadata->aframeLegacyHorizonStageSize ) ? max( 500, min( 8000, (int) $json_metadata->aframeLegacyHorizonStageSize ) ) : 5000;
		$scene_data['aframeAmbientOcclusionPreset'] = $json_metadata->aframeAmbientOcclusionPreset ?? 'balanced';
		$scene_data['aframeContactShadowPreset'] = $json_metadata->aframeContactShadowPreset ?? 'soft';
		$scene_data['aframePostFXEnabled']    = $json_metadata->aframePostFXEnabled ?? false;
		$scene_data['aframePostFXBloomEnabled'] = $json_metadata->aframePostFXBloomEnabled ?? false;
		$scene_data['aframePostFXColorEnabled'] = $json_metadata->aframePostFXColorEnabled ?? true;
		$scene_data['aframePostFXVignetteEnabled'] = false;
		$scene_data['aframePostFXEdgeAAEnabled'] = $json_metadata->aframePostFXEdgeAAEnabled ?? true;
		$scene_data['aframePostFXEdgeAAStrength'] = $json_metadata->aframePostFXEdgeAAStrength ?? 3;
		$scene_data['aframePostFXTAAEnabled'] = $json_metadata->aframePostFXTAAEnabled ?? false;
		$scene_data['aframePostFXSSREnabled'] = $json_metadata->aframePostFXSSREnabled ?? false;
		$scene_data['aframePostFXSSRStrength'] = $json_metadata->aframePostFXSSRStrength ?? 'off';
		$scene_data['aframeBloomStrength']    = $json_metadata->aframeBloomStrength ?? 'off';
		$scene_data['aframeExposurePreset']   = $json_metadata->aframeExposurePreset ?? 'neutral';
		$scene_data['aframeContrastPreset']   = $json_metadata->aframeContrastPreset ?? 'balanced';
		if ( isset( $json_metadata->aframePostFXBloomEnabled ) && ! filter_var( $json_metadata->aframePostFXBloomEnabled, FILTER_VALIDATE_BOOLEAN ) ) {
			$scene_data['aframeBloomStrength'] = 'off';
		}
		$scene_data['aframePostFXBloomEnabled'] = 'off' !== $scene_data['aframeBloomStrength'];
		$scene_data['aframeReflectionProfile'] = $json_metadata->aframeReflectionProfile ?? 'balanced';
		$scene_data['aframeReflectionSource'] = $json_metadata->aframeReflectionSource ?? 'hdr';
		$scene_data['aframeHorizonSkyPreset'] = $json_metadata->aframeHorizonSkyPreset ?? 'natural';
		$scene_data['aframeEnvMapPreset'] = $json_metadata->aframeEnvMapPreset ?? 'none';
		$scene_data['aframePostFXEngine'] = ( $json_metadata->aframePostFXEngine ?? 'legacy' ) === 'pmndrs' ? 'pmndrs' : 'legacy';
		$pmndrs_aa_mode_raw = $json_metadata->aframePmndrsAAMode ?? 'inherit';
		$scene_data['aframePmndrsAAMode'] = in_array( $pmndrs_aa_mode_raw, [ 'none', 'smaa', 'msaa' ], true ) ? $pmndrs_aa_mode_raw : 'inherit';
		$pmndrs_aa_preset_raw = $json_metadata->aframePmndrsAAPreset ?? 'inherit';
		$scene_data['aframePmndrsAAPreset'] = in_array( $pmndrs_aa_preset_raw, [ 'low', 'medium', 'high', 'ultra' ], true ) ? $pmndrs_aa_preset_raw : 'inherit';
		$scene_data['aframePmndrsBloomIntensity'] = isset( $json_metadata->aframePmndrsBloomIntensity ) ? (float) $json_metadata->aframePmndrsBloomIntensity : 1.0;
		$scene_data['aframePmndrsBloomThreshold'] = isset( $json_metadata->aframePmndrsBloomThreshold ) ? (float) $json_metadata->aframePmndrsBloomThreshold : 0.62;
		$scene_data['aframePmndrsVignetteEnabled'] = $json_metadata->aframePmndrsVignetteEnabled ?? false;
		$scene_data['aframePmndrsVignetteDarkness'] = isset( $json_metadata->aframePmndrsVignetteDarkness ) ? (float) $json_metadata->aframePmndrsVignetteDarkness : 0.5;
		$scene_data['aframePmndrsToneMappingExposure'] = isset( $json_metadata->aframePmndrsToneMappingExposure ) ? (float) $json_metadata->aframePmndrsToneMappingExposure : 1.0;
		$scene_data['aframePmndrsAtmosphereEnabled'] = $json_metadata->aframePmndrsAtmosphereEnabled ?? true;
		$scene_data['aframePmndrsAtmosphereQuality'] = $json_metadata->aframePmndrsAtmosphereQuality ?? 'balanced';
		$scene_data['aframePmndrsSunElevationDeg'] = isset( $json_metadata->aframePmndrsSunElevationDeg ) ? (float) $json_metadata->aframePmndrsSunElevationDeg : 10;
		$scene_data['aframePmndrsSunAzimuthDeg'] = isset( $json_metadata->aframePmndrsSunAzimuthDeg ) ? (float) $json_metadata->aframePmndrsSunAzimuthDeg : 38;
		$scene_data['aframePmndrsSunDistance'] = isset( $json_metadata->aframePmndrsSunDistance ) ? (float) $json_metadata->aframePmndrsSunDistance : 5200;
		$scene_data['aframePmndrsSunAngularRadius'] = isset( $json_metadata->aframePmndrsSunAngularRadius ) ? (float) $json_metadata->aframePmndrsSunAngularRadius : 0.0068;
		$scene_data['aframePmndrsAerialStrength'] = isset( $json_metadata->aframePmndrsAerialStrength ) ? (float) $json_metadata->aframePmndrsAerialStrength : 0.85;
		$scene_data['aframePmndrsAlbedoScale'] = isset( $json_metadata->aframePmndrsAlbedoScale ) ? (float) $json_metadata->aframePmndrsAlbedoScale : 0.96;
		$scene_data['aframePmndrsTransmittanceEnabled'] = $json_metadata->aframePmndrsTransmittanceEnabled ?? true;
		$scene_data['aframePmndrsInscatterEnabled'] = $json_metadata->aframePmndrsInscatterEnabled ?? true;
		$scene_data['aframePmndrsGroundEnabled'] = $json_metadata->aframePmndrsGroundEnabled ?? true;
		$scene_data['aframePmndrsGroundAlbedo'] = $json_metadata->aframePmndrsGroundAlbedo ?? '#f0e6d6';
		$scene_data['aframePmndrsRayleighScale'] = isset( $json_metadata->aframePmndrsRayleighScale ) ? (float) $json_metadata->aframePmndrsRayleighScale : 1.0;
		$scene_data['aframePmndrsMieScatteringScale'] = isset( $json_metadata->aframePmndrsMieScatteringScale ) ? (float) $json_metadata->aframePmndrsMieScatteringScale : 0.9;
		$scene_data['aframePmndrsMieExtinctionScale'] = isset( $json_metadata->aframePmndrsMieExtinctionScale ) ? (float) $json_metadata->aframePmndrsMieExtinctionScale : 1.0;
		$scene_data['aframePmndrsMiePhaseG'] = isset( $json_metadata->aframePmndrsMiePhaseG ) ? (float) $json_metadata->aframePmndrsMiePhaseG : 0.8;
		$scene_data['aframePmndrsAbsorptionScale'] = isset( $json_metadata->aframePmndrsAbsorptionScale ) ? (float) $json_metadata->aframePmndrsAbsorptionScale : 1.0;
		$scene_data['aframePmndrsMoonEnabled'] = $json_metadata->aframePmndrsMoonEnabled ?? false;
		$scene_data['backgroundPresetOption'] = $json_metadata->backgroundPresetOption ?? '1';
		$scene_data['backgroundPresetGroundEnabled'] = $json_metadata->backgroundPresetGroundEnabled ?? true;
		$scene_data['backgroundImagePath']    = $json_metadata->backgroundImagePath ?? '';
		$scene_data['backgroundStyleOption']  = $json_metadata->backgroundStyleOption ?? 1;

		if ( property_exists( $json_metadata, 'fogCategory' ) ) {
			$scene_data['SceneSettings'] = [
				'fogCategory' => $json_metadata->fogCategory,
				'fogtype'     => $json_metadata->fogtype ?? 'none',
				'fogcolor'    => $json_metadata->fogcolor ?? '#ffffff',
				'fognear'     => $json_metadata->fognear ?? 0.1,
				'fogfar'      => $json_metadata->fogfar ?? 1000,
				'fogdensity'  => $json_metadata->fogdensity ?? 0.01,
			];
			// Keep for backward compatibility if needed by other legacy scripts
			$scene_data['fogCategory'] = $json_metadata->fogCategory;
			$scene_data['fogcolor']    = $json_metadata->fogcolor ?? '#ffffff';
			$scene_data['fognear']     = $json_metadata->fognear ?? 0.1;
			$scene_data['fogfar']      = $json_metadata->fogfar ?? 1000;
			$scene_data['fogdensity']  = $json_metadata->fogdensity ?? 0.01;
		}

		// Objects
		$scene_data['objects'] = [];
		if ( isset( $content_json->objects ) ) {
			foreach ( $content_json->objects as $key => $value ) {
				$name        = $key;
				$object_data = (array) $value;

				$is_light = false;

				if ( $name === 'avatarCamera' ) {
					$object_data['category_name'] = 'avatarYawObject';
					$object_data['path']          = '';
				} elseif ( str_contains( $name, 'lightSun' ) ) {
					$is_light = true;
				} elseif ( str_contains( $name, 'lightLamp' ) ) {
					$is_light = true;
				} elseif ( str_contains( $name, 'lightSpot' ) ) {
					$is_light = true;
				} elseif ( str_contains( $name, 'lightAmbient' ) ) {
					$is_light = true;
				} elseif ( str_contains( $name, 'Pawn' ) ) {
					$object_data['asset_name'] = $name;
					$object_data['path']       = '';
				} elseif ( ( $object_data['category_slug'] ?? '' ) === 'assessment' ) {
					// Immerse connector integration: assessment scene objects are editor/runtime
					// placeholders and do not point to an uploaded binary asset.
					$object_data['path'] = '';
				} else {
					// Standard Object
					$object_data['path']             = $relative_path . ( $value->fnPath ?? '' );
					$object_data['overrideMaterial'] = $value->overrideMaterial ?? 'false';
					$object_data['is_joker']         = $value->is_joker ?? 'false';
				}

				$object_data['isLight'] = $is_light;

				// Recreate the 'trs' object that the frontend scripts expect.
				$t_x = $value->position[0] ?? 0;
				$t_y = $value->position[1] ?? 0;
				$t_z = $value->position[2] ?? 0;

				$r_x = $value->rotation[0] ?? 0;
				$r_y = $value->rotation[1] ?? 0;
				$r_z = $value->rotation[2] ?? 0;

				$s_x = $value->scale[0] ?? 1;
				$s_y = $value->scale[1] ?? 1;
				$s_z = $value->scale[2] ?? 1;

				$object_data['trs'] = ['translation' => [$t_x, $t_y, $t_z], 'rotation'    => [$r_x, $r_y, $r_z], 'scale'       => [$s_x, $s_y, $s_z]];

				$scene_data['objects'][ $name ] = $object_data;
			}
		}

		return $scene_data;
	}

	public static function get_scene_dat_for_script(): array {
		$upload_url       = wp_upload_dir()['baseurl'];
		$current_scene_id = isset( $_GET['vrodos_scene'] ) ? sanitize_text_field( intval( $_GET['vrodos_scene'] ) ) : null;
		$resolved_project = self::resolve_project_post_from_scene( (int) $current_scene_id );
		$project_id       = $resolved_project instanceof WP_Post
			? (int) $resolved_project->ID
			: ( isset( $_GET['vrodos_game'] ) ? sanitize_text_field( intval( $_GET['vrodos_game'] ) ) : null );
		$project_type     = $project_id ? VRodos_Core_Manager::vrodos_return_project_type( $project_id )->string : null;

		// Fallback to first scene if no scene ID provided
		if ( empty( $current_scene_id ) && ! empty( $project_id ) ) {
			$project = get_post( $project_id );
			if ( $project ) {
				$scene_pgame_term = get_term_by( 'slug', $project->post_name, 'vrodos_scene_pgame' );
				if ( $scene_pgame_term ) {
					$first_scene_query = VRodos_Core_Manager::getProjectScenes( $scene_pgame_term->term_id );
					if ( $first_scene_query->have_posts() ) {
						$first_scene_query->the_post();
						$current_scene_id = get_the_ID();
						wp_reset_postdata();
					}
				}
			}
		}

		$scene_post         = $current_scene_id ? get_post( $current_scene_id ) : null;
		$scene_json_from_db = ( $scene_post && $scene_post->post_content )
			? $scene_post->post_content
			: VRodos_Core_Manager::vrodos_getDefaultJSONscene( strtolower( $project_type ?? '' ) );

		$scene_model = new Vrodos_Scene_Model( $scene_json_from_db );
		$sceneJSON   = $scene_model->to_json();

		return self::parse_scene_json_and_prepare_script_data( $sceneJSON, $upload_url );
	}


	public static function prepare_scene_editor_data(): array {
		$data = [];

		// Permalink structure
		$perma_structure             = (bool) get_option( 'permalink_structure' );
		$data['parameter_pass']      = $perma_structure ? '?vrodos_game=' : '&vrodos_game=';
		$data['parameter_Scenepass'] = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';
		$data['parameter_assetpass'] = $perma_structure ? '?vrodos_asset=' : '&vrodos_asset=';

		// Scene & Project IDs
		$data['current_scene_id'] = isset( $_GET['vrodos_scene'] ) ? sanitize_text_field( intval( $_GET['vrodos_scene'] ) ) : null;
		$data['project_id']       = isset( $_GET['vrodos_game'] ) ? sanitize_text_field( intval( $_GET['vrodos_game'] ) ) : null;
		$data['is_immerse_project'] = $data['project_id']
			? get_post_meta( $data['project_id'], '_immerse_source', true ) === 'immerse'
			: false;

		// From VRodos_Game_CPT_Manager::prepare_compile_dialogue_data()
		$compile_data = VRodos_Game_CPT_Manager::prepare_compile_dialogue_data();
		if ( ! empty( $compile_data ) ) {
			$data = array_merge( $data, $compile_data );
		} else {
			// Ensure project_id is consistent even if compile data fails
			$data['project_id']        = isset( $_GET['vrodos_game'] ) ? sanitize_text_field( intval( $_GET['vrodos_game'] ) ) : null;
			$data['projectSlug']       = '';
			$data['project_type']      = '';
			$data['project_type_slug'] = '';
			$data['single_lowercase']  = 'project';
		}

		// Legacy Archaeology data
		$data['doorsAllInfo'] = null;
		if ( isset( $data['project_type'] ) && $data['project_type'] === 'Archaeology' && function_exists( 'vrodos_get_all_doors_of_project_fastversion' ) ) {
			$data['doorsAllInfo'] = vrodos_get_all_doors_of_project_fastversion( $data['project_id'] );
		}

		// Fallback: if no scene ID in URL, use the first scene of the project
		if ( empty( $data['current_scene_id'] ) && ! empty( $data['project_id'] ) ) {
			$project = get_post( $data['project_id'] );
			if ( $project ) {
				$scene_pgame_term = get_term_by( 'slug', $project->post_name, 'vrodos_scene_pgame' );
				if ( $scene_pgame_term ) {
					$first_scene_query = VRodos_Core_Manager::getProjectScenes( $scene_pgame_term->term_id );
					if ( $first_scene_query->have_posts() ) {
						$first_scene_query->the_post();
						$data['current_scene_id'] = get_the_ID();
						wp_reset_postdata();
					}
				}
			}
		}

		// Scene Post
		$data['scene_post'] = $data['current_scene_id'] ? get_post( $data['current_scene_id'] ) : null;
		$data['sceneTitle'] = $data['scene_post'] ? $data['scene_post']->post_name : '';

		// The scene's own parent-project relationship is the authoritative source of
		// project context for the editor.
		$resolved_project_post = self::resolve_project_post_from_scene( (int) $data['current_scene_id'] );
		if ( $resolved_project_post instanceof WP_Post ) {
			$data['project_post'] = $resolved_project_post;
			$data['project_id']   = (int) $resolved_project_post->ID;
			$data['projectSlug']  = $resolved_project_post->post_name;
		}

		// Environment
		$data['isAdmin'] = is_admin() ? 'back' : 'front';

		// Page URLs
		$allProjectsPage_res     = VRodos_Core_Manager::vrodos_getEditpage( 'game' );
		$data['allProjectsPage'] = $allProjectsPage_res ?: null;

		$newAssetPage_res     = VRodos_Core_Manager::vrodos_getEditpage( 'asset' );
		$data['newAssetPage'] = $newAssetPage_res ?: null;

		$editscenePage_res     = VRodos_Core_Manager::vrodos_getEditpage( 'scene' );
		$data['editscenePage'] = $editscenePage_res ?: null;

		// Media
		$data['videos'] = VRodos_Core_Manager::vrodos_getVideoAttachmentsFromMediaLibrary();

		// Asset Edit URL
		$data['urlforAssetEdit'] = '';
		if ( $data['newAssetPage'] && isset( $data['newAssetPage'][0]->ID ) && $data['project_id'] && $data['current_scene_id'] ) {
			$data['urlforAssetEdit'] = esc_url(
				get_permalink( $data['newAssetPage'][0]->ID ) . $data['parameter_pass'] . $data['project_id'] .
				'&vrodos_scene=' . $data['current_scene_id'] . '&vrodos_asset='
			);
		}

		// User Data
		$current_user       = wp_get_current_user();
		$data['user_email'] = '';
		if ( $current_user->exists() ) {
			$user_data          = get_userdata( get_current_user_id() );
			$data['user_email'] = $user_data->user_email;
		}
		$data['current_user_id'] = get_current_user_id();
		$data['is_user_admin']   = current_user_can( 'administrator' );

		// Parent Project Term ID
		$allScenePGame = isset( $data['projectSlug'] ) && ! empty( $data['projectSlug'] )
			? get_term_by( 'slug', $data['projectSlug'], 'vrodos_scene_pgame' )
			: null;

		// If projectSlug is still missing, derive it from the scene parent term.
		if ( ! $allScenePGame && ! empty( $data['current_scene_id'] ) ) {
			$scene_terms = wp_get_post_terms( (int) $data['current_scene_id'], 'vrodos_scene_pgame' );
			if ( ! is_wp_error( $scene_terms ) && ! empty( $scene_terms ) ) {
				$allScenePGame = $scene_terms[0];
				if ( empty( $data['projectSlug'] ) ) {
					$data['projectSlug'] = $allScenePGame->slug;
				}
			}
		}

		$data['parent_project_id_as_term_id'] = $allScenePGame ? $allScenePGame->term_id : null;
		$data['project_post'] = $data['project_id'] ? get_post( $data['project_id'] ) : null;

		if ( empty( $data['projectSlug'] ) && $data['project_post'] instanceof WP_Post ) {
			$data['projectSlug'] = $data['project_post']->post_name;
		}

		$data['is_immerse_project'] = $data['project_id']
			? get_post_meta( $data['project_id'], '_immerse_source', true ) === 'immerse'
			: false;

		if ( ! empty( $data['project_id'] ) ) {
			$project_type_obj = VRodos_Core_Manager::vrodos_return_project_type( $data['project_id'] );
			if ( empty( $data['project_type'] ) && $project_type_obj ) {
				$data['project_type'] = $project_type_obj->string;
			}
			if ( empty( $data['project_type_icon'] ) && $project_type_obj ) {
				$data['project_type_icon'] = $project_type_obj->icon;
			}
			if ( empty( $data['project_type_slug'] ) ) {
				$project_type_terms = wp_get_object_terms( $data['project_id'], 'vrodos_game_type' );
				if ( ! is_wp_error( $project_type_terms ) && ! empty( $project_type_terms ) && ! empty( $project_type_terms[0]->slug ) ) {
					$data['project_type_slug'] = $project_type_terms[0]->slug;
				}
			}
		}

		// Project Type Icon (used in breadcrumb)
		$project_type_obj          = $data['project_id'] ? VRodos_Core_Manager::vrodos_return_project_type( $data['project_id'] ) : null;
		$data['project_type_icon'] = $project_type_obj ? $project_type_obj->icon : '';

		// Back link for breadcrumb
		$data['goBackTo_AllProjects_link'] = ( $data['allProjectsPage'] && isset( $data['allProjectsPage'][0]->ID ) ) ? esc_url( get_permalink( $data['allProjectsPage'][0]->ID ) ) : '';

		// Text for buttons based on project type
		if ( isset( $data['project_type'] ) && $data['project_type'] === 'Archaeology' ) {
			$data['single_first'] = 'Tour';
		} else {
			$data['single_first'] = 'Project';
		}

		// Paths and URLs
		$data['pluginpath'] = plugin_dir_url( VRODOS_PLUGIN_FILE );
		$data['upload_dir'] = str_replace( '\\', '/', wp_upload_dir()['basedir'] );
		$data['upload_url'] = wp_upload_dir()['baseurl'];

		return $data;
	}

	private static function resolve_project_post_from_scene( int $scene_id ): ?WP_Post {
		if ( $scene_id <= 0 ) {
			return null;
		}

		$scene_terms = wp_get_post_terms( $scene_id, 'vrodos_scene_pgame' );
		if ( is_wp_error( $scene_terms ) || empty( $scene_terms ) || ! ( $scene_terms[0] instanceof WP_Term ) ) {
			return null;
		}

		$project_post = get_page_by_path( $scene_terms[0]->slug, OBJECT, 'vrodos_game' );
		return $project_post instanceof WP_Post ? $project_post : null;
	}

	public function handle_new_scene_submission(): void {
		if ( ! isset( $_POST['submitted'] ) || ! isset( $_POST['post_nonce_field'] ) || ! wp_verify_nonce( $_POST['post_nonce_field'], 'post_nonce' ) ) {
			return;
		}

		$project_id = isset( $_POST['project_id'] ) ? intval( $_POST['project_id'] ) : 0;
		if ( ! $project_id ) {
			return;
		}

		$sceneMetaType     = 'scene'; // default 'scene' MetaType (3js)
		$thegameType_terms = wp_get_post_terms( $project_id, 'vrodos_game_type' );

		if ( is_wp_error( $thegameType_terms ) || empty( $thegameType_terms ) ) {
			wp_die( 'Error: Project type not found.' );
		}
		$project_type = VRodos_Core_Manager::vrodos_return_project_type( $project_id )->string;
		$default_json = VRodos_Core_Manager::vrodos_getDefaultJSONscene( strtolower( $project_type ) );

		$newscene_yaml_tax = get_term_by( 'slug', 'wonderaround-yaml', 'vrodos_scene_yaml' );

		$project_post        = get_post( $project_id );
		$project_slug        = $project_post->post_name;
		$parent_project_term = get_term_by( 'slug', $project_slug, 'vrodos_scene_pgame' );

		$scene_taxonomies = ['vrodos_scene_pgame' => [$parent_project_term->term_id], 'vrodos_scene_yaml'  => [$newscene_yaml_tax->term_id]];

		$scene_metas = ['vrodos_scene_default'  => 0, 'vrodos_scene_caption'  => esc_attr( strip_tags( $_POST['scene-caption'] ?? '' ) ), 'vrodos_scene_metatype' => $sceneMetaType];

		// Place new scene after all existing ones
		$existing_scene_ids = VRodos_Core_Manager::vrodos_get_all_sceneids_of_game( $parent_project_term->term_id );
		$max_order = 0;
		foreach ( $existing_scene_ids as $sid ) {
			$order = (int) get_post_field( 'menu_order', $sid );
			if ( $order > $max_order ) { $max_order = $order; }
		}

		$scene_information = ['post_title'   => esc_attr( strip_tags( (string) $_POST['scene-title'] ) ), 'post_content' => $default_json, 'post_type'    => 'vrodos_scene', 'post_status'  => 'publish', 'menu_order'   => $max_order + 1, 'tax_input'    => $scene_taxonomies, 'meta_input'   => $scene_metas];

		$scene_id = wp_insert_post( $scene_information );

		if ( $scene_id ) {
			$editscenePage_res  = VRodos_Core_Manager::vrodos_getEditpage( 'scene' );
			$edit_scene_page_id = $editscenePage_res[0]->ID;

			$perma_structure     = (bool) get_option( 'permalink_structure' );
			$parameter_Scenepass = $perma_structure ? '?vrodos_scene=' : '&vrodos_scene=';

			$loadMainSceneLink = get_permalink( $edit_scene_page_id ) . $parameter_Scenepass . $scene_id . '&vrodos_game=' . $project_id . '&scene_type=' . $sceneMetaType;

			wp_redirect( $loadMainSceneLink );
			exit;
		}
	}
}
