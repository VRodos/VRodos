<?php

class VRodos_Game_CPT_Manager {

    private $vrodos_databox3;

    public function __construct() {
        $this->vrodos_databox3 = array(
            'id' => 'vrodos-projects-databox',
            'page' => 'vrodos_game',
            'context' => 'normal',
            'priority' => 'high',
            'fields' => array(
                array(
                    'name' => 'Latitude',
                    'desc' => 'Project\'s Latitude',
                    'id' => 'vrodos_game_lat',
                    'type' => 'text',
                    'std' => ''
                ),
                array(
                    'name' => 'Longitude',
                    'desc' => 'Project\'s Longitude',
                    'id' => 'vrodos_game_lng',
                    'type' => 'text',
                    'std' => ''
                ),
                array(
                    'name' => 'collaborators_ids',
                    'desc' => 'ids of collaborators starting separated and ending by semicolon',
                    'id' => 'vrodos_project_collaborators_ids',
                    'type' => 'text',
                    'std' => ''
                )
            )
        );

        add_action('transition_post_status', array($this, 'on_create_project'), 10, 3);
        add_action('add_meta_boxes', array($this, 'games_taxcategory_box'));
        add_action('save_post', array($this, 'games_taxtype_box_content_save'));
        add_filter('manage_vrodos_game_posts_columns', array($this, 'set_custom_vrodos_game_columns'));
        add_action('manage_vrodos_game_posts_custom_column', array($this, 'set_custom_vrodos_game_columns_fill'), 10, 2);
        add_action('add_meta_boxes', array($this, 'games_databox_add'));
        add_action('save_post', array($this, 'games_databox_save'));
    }


    // Generate Taxonomy (for scenes & assets) with Project's slug/name
    // Create Default Scenes for this "Project"
    public function on_create_project($new_status, $old_status, $post) {
        // Dont run this if from front-end
        if (!isset($_POST['vrodos_game_type'])) {
            return;
        }

        $post_type = get_post_type($post);

        if ($post_type == 'vrodos_game' && $new_status == 'publish' && $old_status != 'publish') {
            $projectSlug = $post->post_name;
            $projectTitle = empty($post->post_title) ? 'project-' . $projectSlug : $post->post_title;

            $project_type_id = $_POST['vrodos_game_type'];
            $project_type = get_term($project_type_id, 'vrodos_game_type');

            // If project is not a joker one
            if (!str_contains($projectSlug, '-joker')) {
                // Create a parent game tax category for the scenes
                wp_insert_term($projectTitle, 'vrodos_scene_pgame', array(
                    'description' => '-',
                    'slug' => $projectSlug,
                ));

                // Create a parent game tax category for the assets
                wp_insert_term($projectTitle, 'vrodos_asset3d_pgame', array(
                    'description' => '-',
                    'slug' => $projectSlug,
                ));

                // Link project to game type
                wp_set_object_terms($post->ID, intval($project_type_id), 'vrodos_game_type');

                // Create Default Scenes for this "Project"
                vrodos_create_default_scenes_for_game($projectSlug, $project_type_id);
            } else {
                $projectTitle = $post->post_title;
                // Create a parent game tax category for the assets
                wp_insert_term($projectTitle, 'vrodos_asset3d_pgame', array(
                    'description' => '-',
                    'slug' => $projectSlug
                ));
            }
        }
    }

    //Create Game Category Box @ Game's backend
    public function games_taxcategory_box() {
        // Removes the default metabox at side
        remove_meta_box('vrodos_game_typediv', 'vrodos_game', 'side');
        // Adds the custom metabox with select box
        add_meta_box('tagsdiv-vrodos_game_type', 'Project Type', array($this, 'projects_taxtype_box_content'), 'vrodos_game', 'side', 'high');
    }


    public function projects_taxtype_box_content($post) {
        $tax_name = 'vrodos_game_type'; ?>
        <div class="tagsdiv" id="<?php echo $tax_name; ?>">
            <p class="howto"><?php echo 'Select type for current project' ?></p>
            <?php
            // Use nonce for verification
            wp_nonce_field(plugin_basename(__FILE__), 'vrodos_game_type_noncename');
            $type_ids = wp_get_object_terms($post->ID, 'vrodos_game_type', array('fields' => 'ids'));
            $selected_type = empty($type_ids) ? '' : $type_ids[0];
            $args = array(
                'show_option_none' => 'Select Type',
                'orderby' => 'name',
                'hide_empty' => 0,
                'selected' => $selected_type,
                'name' => 'vrodos_game_type',
                'taxonomy' => 'vrodos_game_type',
                'echo' => 0,
                'option_none_value' => '-1',
                'id' => 'vrodos-select-type-dropdown'
            );
            $select = wp_dropdown_categories($args);
            $replace = "<select$1 required>";
            $select = preg_replace('#<select([^>]*)>#', $replace, $select);
            $old_option = "<option value='-1'>";
            $new_option = "<option disabled selected value=''>" . 'Select type' . "</option>";
            $select = str_replace($old_option, $new_option, $select);
            echo $select;
            ?>
        </div>
        <?php
    }

    public function games_taxtype_box_content_save($post_id) {
        // Verify if this is an auto save routine.
        if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || wp_is_post_revision($post_id))
            return;

        if (!isset($_POST['vrodos_game_type_noncename']))
            return;

        // verify this came from the our screen and with proper authorization
        if (!wp_verify_nonce($_POST['vrodos_game_type_noncename'], plugin_basename(__FILE__)))
            return;

        // Check permissions
        if ('vrodos_game' == $_POST['post_type']) {
            if (!current_user_can('edit_page', $post_id))
                return;
        } else {
            if (!current_user_can('edit_post', $post_id))
                return;
        }

        $type_ID = intval($_POST['vrodos_game_type'], 10);
        $type = ($type_ID > 0) ? get_term($type_ID, 'vrodos_game_type')->slug : NULL;
        wp_set_object_terms($post_id, $type, 'vrodos_game_type');
    }

    public function set_custom_vrodos_game_columns($columns) {
        $columns['game_slug'] = 'Project Slug';
        return $columns;
    }

    public function set_custom_vrodos_game_columns_fill($column, $post_id) {
        switch ($column) {
            case 'game_slug' :
                $mypost = get_post($post_id);
                $theSlug = $mypost->post_name;
                if (is_string($theSlug))
                    echo $theSlug;
                else
                    echo 'no slug found';
                break;
        }
    }

    //Add and Show the metabox with Custom Field for Game and the Compiler Box
    public function games_databox_add() {
        add_meta_box($this->vrodos_databox3['id'], 'Game Data', array($this, 'games_databox_show'),
            $this->vrodos_databox3['page'], $this->vrodos_databox3['context'], $this->vrodos_databox3['priority']);
        add_meta_box('vrodos-games-assembler-box', 'Game Assembler', array($this, 'games_assemblerbox_show'), 'vrodos_game', 'side', 'low');
        add_meta_box('vrodos-games-compiler-box', 'Game Compiler', array($this, 'games_compilerbox_show'), 'vrodos_game', 'side', 'low');
    }

    public function games_databox_show() {
        global $post;
        $DS = DIRECTORY_SEPARATOR;

        wp_enqueue_script('vrodos_request_compile');
        $slug = $post->post_name;
        wp_localize_script('vrodos_request_compile', 'phpvarsA',
            array('pluginsUrl' => plugins_url(),
                'PHP_OS' => PHP_OS,
                'game_dirpath' => realpath(dirname(__FILE__) . '/..') . $DS . 'games_assemble' . $DS . $slug,
                'game_urlpath' => plugins_url('vrodos') . '/games_assemble/' . $slug
            ));

        wp_enqueue_script('vrodos_assemble_request');
        wp_localize_script('vrodos_assemble_request', 'phpvarsB',
            array('pluginsUrl' => plugins_url(),
                'PHP_OS' => PHP_OS,
                'source' => realpath(dirname(__FILE__) . '/../../..') . $DS . 'uploads' . $DS . $slug,
                'target' => realpath(dirname(__FILE__) . '/..') . $DS . 'games_assemble' . $DS . $slug,
                'game_libraries_path' => realpath(dirname(__FILE__) . '/..') . $DS . 'unity_game_libraries',
                'game_id' => $post->ID
            ));

        echo '<input type="hidden" name="vrodos_games_databox_nonce" value="', wp_create_nonce(basename(__FILE__)), '" />';
        echo '<table class="form-table" id="vrodos-custom-fields-table">';
        foreach ($this->vrodos_databox3['fields'] as $field) {
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

    public function games_databox_save($post_id) {
        if (!isset($_POST['vrodos_games_databox_nonce']))
            return;

        if (!wp_verify_nonce($_POST['vrodos_games_databox_nonce'], basename(__FILE__))) {
            return $post_id;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return $post_id;
        }

        if ('page' == $_POST['post_type']) {
            if (!current_user_can('edit_page', $post_id)) {
                return $post_id;
            }
        } elseif (!current_user_can('edit_post', $post_id)) {
            return $post_id;
        }
        foreach ($this->vrodos_databox3['fields'] as $field) {
            $old = get_post_meta($post_id, $field['id'], true);
            $new = $_POST[$field['id']];
            if ($new && $new != $old) {
                update_post_meta($post_id, $field['id'], $new);
            } elseif ('' == $new && $old) {
                delete_post_meta($post_id, $field['id'], $old);
            }
        }
    }

    public function games_compilerbox_show() {
        echo '<div id="vrodos_compileButton" onclick="vrodos_compileAjax()">Compile</div>';
        echo '<div id="vrodos_compile_report1"></div>';
        echo '<div id="vrodos_compile_report2"></div>';
        echo '<div id="vrodos_zipgame_report"></div>';
        echo '<br /><br />Analytic report of compile:<br />';
        echo '<div id="vrodos_compile_game_stdoutlog_report" style="font-size: x-small"></div>';
    }

    public function games_assemblerbox_show() {
        echo '<div id="vrodos_assembleButton" onclick="vrodos_assembleAjax()">Assemble</div>';
        echo '<br /><br />Analytic report of assemble:<br />';
        echo '<div id="vrodos_assemble_report1"></div>';
        echo '<div id="vrodos_assemble_report2"></div>';
    }
}
