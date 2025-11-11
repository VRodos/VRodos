<?php

class VRodos_Scene_CPT_Manager {

    private $vrodos_scenes_metas_definition;

    public function __construct() {
        $this->vrodos_scenes_metas_definition = array(
            'id' => 'vrodos-scenes-databox',
            'page' => 'vrodos_scene',
            'context' => 'normal',
            'priority' => 'high',
            'fields' => array(
                array(
                    'name' => 'Scene caption',
                    'desc' => 'Scene caption',
                    'id' => 'vrodos_scene_caption',
                    'type' => 'textarea',
                    'std' => ''
                )
            )
        );

        add_action('add_meta_boxes', array($this, 'scenes_taxgame_box'));
        add_action('save_post', array($this, 'scenes_taxgame_box_content_save'));
        add_action('save_post', array($this, 'scenes_taxyaml_box_content_save'));
        add_filter('manage_vrodos_scene_posts_columns', array($this, 'set_custom_vrodos_scene_columns'));
        add_action('manage_vrodos_scene_posts_custom_column', array($this, 'set_custom_vrodos_scene_columns_fill'), 10, 2);
        add_action('add_meta_boxes', array($this, 'scenes_meta_definitions_add'));
        add_action('save_post', array($this, 'scenes_metas_save'));
        add_filter('wp_revisions_to_keep', array($this, 'ns_limit_revisions'), 10, 2);
    }

    public function ns_limit_revisions($num, $post){

        $N = 50; // Keep only the latest N revisions
        $target_types = array('vrodos_scene');
        $is_target_type = in_array($post->post_type, $target_types);
        return $is_target_type ? $N : $num;
    }

    // Create Scene's Game Box @ scene's backend
    public function scenes_taxgame_box() {
        // Removes default side metaboxes
        remove_meta_box('vrodos_scene_pgamediv', 'vrodos_scene', 'side');
        remove_meta_box('vrodos_scene_yamldiv', 'vrodos_scene', 'side');

        // Adds a Project selection custom metabox
        add_meta_box('tagsdiv-vrodos_scene_pgame', 'Parent Project', array($this, 'scenes_taxgame_box_content'), 'vrodos_scene', 'side', 'high');
        // Adds a YAML selection custom metabox
        add_meta_box('tagsdiv-vrodos_scene_yamldiv', 'Scene YAML', array($this, 'scenes_taxyaml_box_content'), 'vrodos_scene', 'side', 'high');
    }

    public function scenes_taxgame_box_content($post) {
        $tax_name = 'vrodos_scene_pgame';
        ?>
        <div class="tagsdiv" id="<?php echo $tax_name; ?>">
            <p class="howto"><?php echo 'Select Project for current Scene' ?></p>
            <?php
            // Use nonce for verification
            wp_nonce_field(plugin_basename(__FILE__), 'vrodos_scene_pgame_noncename');
            $type_ids = wp_get_object_terms($post->ID, 'vrodos_scene_pgame', array('fields' => 'ids'));
            $selected_type = empty($type_ids) ? '' : $type_ids[0];
            $args = array(
                'show_option_none' => 'Select Project',
                'orderby' => 'name',
                'hide_empty' => 0,
                'selected' => $selected_type,
                'name' => 'vrodos_scene_pgame',
                'taxonomy' => 'vrodos_scene_pgame',
                'echo' => 0,
                'option_none_value' => '-1',
                'id' => 'vrodos-select-pgame-dropdown'
            );
            $select = wp_dropdown_categories($args);
            $replace = "<select$1 required>";
            $select = preg_replace('#<select([^>]*)>#', $replace, $select);
            $old_option = "<option value='-1'>";
            $new_option = "<option disabled selected value=''>" . 'Select project' . "</option>";
            $select = str_replace($old_option, $new_option, $select);
            echo $select;
            ?>
        </div>
        <?php
    }

    public function scenes_taxyaml_box_content($post) {
        $tax_name = 'vrodos_scene_yaml';
        ?>
        <div class="tagsdiv" id="<?php echo $tax_name; ?>">
            <p class="howto"><?php echo 'Select YAML for current Scene' ?></p>
            <?php
            // Use nonce for verification
            wp_nonce_field(plugin_basename(__FILE__), 'vrodos_scene_yaml_noncename');
            $type_ids = wp_get_object_terms($post->ID, 'vrodos_scene_yaml', array('fields' => 'ids'));
            $selected_type = empty($type_ids) ? '' : $type_ids[0];
            $args = array(
                'show_option_none' => 'Select YAML',
                'orderby' => 'name',
                'hide_empty' => 0,
                'selected' => $selected_type,
                'name' => 'vrodos_scene_yaml',
                'taxonomy' => 'vrodos_scene_yaml',
                'echo' => 0,
                'option_none_value' => '-1',
                'id' => 'vrodos-select-yaml-dropdown'
            );
            $select = wp_dropdown_categories($args);
            $replace = "<select$1 required>";
            $select = preg_replace('#<select([^>]*)>#', $replace, $select);
            $old_option = "<option value='-1'>";
            $new_option = "<option disabled selected value=''>" . 'Select YAML' . "</option>";
            $select = str_replace($old_option, $new_option, $select);
            echo $select;
            ?>
        </div>
        <?php
    }

    public function scenes_taxgame_box_content_save($post_id) {
        if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || wp_is_post_revision($post_id))
            return;

        if (!isset($_POST['vrodos_scene_pgame_noncename']))
            return;

        if (!wp_verify_nonce($_POST['vrodos_scene_pgame_noncename'], plugin_basename(__FILE__)))
            return;

        if ('vrodos_scene' == $_POST['post_type']) {
            if (!current_user_can('edit_pages', $post_id))
                return;
        } else {
            if (!current_user_can('edit_posts', $post_id))
                return;
        }

        $type_ID = intval($_POST['vrodos_scene_pgame'], 10);
        $type = ($type_ID > 0) ? get_term($type_ID, 'vrodos_scene_pgame')->slug : NULL;
        wp_set_object_terms($post_id, $type, 'vrodos_scene_pgame');
    }

    public function scenes_taxyaml_box_content_save($post_id) {
        if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || wp_is_post_revision($post_id))
            return;

        if (!isset($_POST['vrodos_scene_yaml_noncename']))
            return;

        if (!wp_verify_nonce($_POST['vrodos_scene_yaml_noncename'], plugin_basename(__FILE__)))
            return;

        if ('vrodos_scene' == $_POST['post_type']) {
            if (!current_user_can('edit_pages', $post_id))
                return;
        } else {
            if (!current_user_can('edit_posts', $post_id))
                return;
        }

        $type_ID = intval($_POST['vrodos_scene_yaml'], 10);
        $type = ($type_ID > 0) ? get_term($type_ID, 'vrodos_scene_yaml')->slug : NULL;
        wp_set_object_terms($post_id, $type, 'vrodos_scene_yaml');
    }

    public function set_custom_vrodos_scene_columns($columns) {
        $columns['scene_slug'] = 'Scene Slug';
        return $columns;
    }

    public function set_custom_vrodos_scene_columns_fill($column, $post_id) {
        switch ($column) {
            case 'scene_slug' :
                $mypost = get_post($post_id);
                $theSlug = $mypost->post_name;
                if (is_string($theSlug))
                    echo $theSlug;
                else
                    echo 'no slug found';
                break;
        }
    }

    public function scenes_meta_definitions_add() {
        add_meta_box($this->vrodos_scenes_metas_definition['id'],
            'Scene Data',
            array($this, 'scenes_metas_adminside_show'),
            $this->vrodos_scenes_metas_definition['page'],
            $this->vrodos_scenes_metas_definition['context'],
            $this->vrodos_scenes_metas_definition['priority']);
    }

    public function scenes_metas_adminside_show() {
        global $post;
        echo '<input type="hidden" name="vrodos_scenes_databox_nonce" value="', wp_create_nonce(basename(__FILE__)), '" />';
        echo '<table class="form-table" id="vrodos-custom-fields-table">';
        foreach ($this->vrodos_scenes_metas_definition['fields'] as $field) {
            $meta = get_post_meta($post->ID, $field['id'], true);
            echo '<tr>',
            '<th style="width:20%"><label for="', esc_attr($field['id']), '">', esc_html($field['name']), '</label></th>',
            '<td>';

            switch ($field['type']) {
                case 'text':
                    echo '<input type="text" name="', esc_attr($field['id']), '" id="', esc_attr($field['id']), '" value="', esc_attr($meta ? $meta : $field['std']), '" size="30" style="width:97%" />', '<br />', esc_html($field['desc']);
                    break;
                case 'numeric':
                    echo '<input type="number" name="', esc_attr($field['id']), '" id="', esc_attr($field['id']), '" value="', esc_attr($meta ? $meta : $field['std']), '" size="30" style="width:97%" />', '<br />', esc_html($field['desc']);
                    break;
                case 'textarea':
                    echo '<textarea name="', esc_attr($field['id']), '" id="', esc_attr($field['id']), '" cols="60" rows="4" style="width:97%">', esc_attr($meta ? $meta : $field['std']), '</textarea>', '<br />', esc_html($field['desc']);
                    break;
                case 'select':
                    echo '<select name="', esc_attr($field['id']), '" id="', esc_attr($field['id']), '">';
                    foreach ($field['options'] as $option) {
                        echo '<option ', $meta == $option ? ' selected="selected"' : '', '>', esc_html($option), '</option>';
                    }
                    echo '</select>';
                    break;
                case 'checkbox':
                    echo '<input type="checkbox" name="', esc_attr($field['id']), '" id="', esc_attr($field['id']), '"', $meta ? ' checked="checked"' : '', ' />';
                    break;
            }
            echo '</td><td>',
            '</td></tr>';
        }
        echo '</table>';
    }

    public function scenes_metas_save($post_id) {
        if (!isset($_POST['vrodos_scenes_databox_nonce']))
            return;

        if (!wp_verify_nonce($_POST['vrodos_scenes_databox_nonce'], basename(__FILE__))) {
            return $post_id;
        }
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return $post_id;
        }
        if ('page' == $_POST['post_type']) {
            if (!current_user_can('edit_pages', $post_id)) {
                return $post_id;
            }
        } elseif (!current_user_can('edit_posts', $post_id)) {
            return $post_id;
        }
        foreach ($this->vrodos_scenes_metas_definition['fields'] as $field) {
            $old = get_post_meta($post_id, $field['id'], true);
            $new = $_POST[$field['id']];
            if ($new && $new != $old) {
                update_post_meta($post_id, $field['id'], $new);
            } elseif ('' == $new && $old) {
                delete_post_meta($post_id, $field['id'], $old);
            }
        }
    }

    public static function parse_scene_json_and_prepare_script_data($scene_json, $relative_path) {
        $scene_data = array();
        $scene_json = htmlspecialchars_decode($scene_json);
        $content_json = json_decode($scene_json);

        if (json_last_error() !== JSON_ERROR_NONE || !isset($content_json->metadata)) {
            return $scene_data;
        }

        $json_metadata = $content_json->metadata;

        // Metadata
        $scene_data['ClearColor'] = $json_metadata->ClearColor ?? '0x000000';
        $scene_data['toneMappingExposure'] = $json_metadata->toneMappingExposure ?? 1.0;
        $scene_data['enableGeneralChat'] = $json_metadata->enableGeneralChat ?? false;
        $scene_data['enableAvatar'] = $json_metadata->enableAvatar ?? false;
        $scene_data['disableMovement'] = $json_metadata->disableMovement ?? false;
        $scene_data['backgroundPresetOption'] = $json_metadata->backgroundPresetOption ?? null;
        $scene_data['backgroundImagePath'] = $json_metadata->backgroundImagePath ?? null;
        $scene_data['backgroundStyleOption'] = $json_metadata->backgroundStyleOption ?? null;

        if (property_exists($json_metadata, "fogCategory")) {
            $scene_data["fogCategory"] = $json_metadata->fogCategory;
            $scene_data["fogcolor"] = $json_metadata->fogcolor;
            $scene_data["fognear"] = $json_metadata->fognear;
            $scene_data["fogfar"] = $json_metadata->fogfar;
            $scene_data["fogdensity"] = $json_metadata->fogdensity;
        }

        // Objects
        $scene_data['objects'] = array();
        if (isset($content_json->objects)) {
            foreach ($content_json->objects as $key => $value) {
                $name = $key;
                $object_data = (array)$value;

                $is_light = false;

                if ($name === 'avatarCamera') {
                    $object_data['category_name'] = 'avatarYawObject';
                    $object_data['path'] = "";
                } elseif (strpos($name, 'lightSun') !== false) {
                    $is_light = true;
                } elseif (strpos($name, 'lightLamp') !== false) {
                    $is_light = true;
                } elseif (strpos($name, 'lightSpot') !== false) {
                    $is_light = true;
                } elseif (strpos($name, 'lightAmbient') !== false) {
                    $is_light = true;
                } elseif (strpos($name, 'Pawn') !== false) {
                    $object_data['asset_name'] = $name;
                    $object_data['path'] = "";
                } else {
                    // Standard Object
                    $object_data['path'] = $relative_path . ($value->fnPath ?? '');
                    $object_data['overrideMaterial'] = $value->overrideMaterial ?? 'false';
                    $object_data['is_joker'] = $value->is_joker ?? 'false';
                }

                $object_data['isLight'] = $is_light;
                $scene_data['objects'][$name] = $object_data;
            }
        }

        return $scene_data;
    }
}
