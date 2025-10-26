<?php

// Create metabox with Custom Fields for Scene -($vrodos_databox4)
//$def_json = vrodos_getDefaultJSONscene('energy');

// All information about scenes meta fields
$vrodos_scenes_metas_definition = array(
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


// Create Scene's Game Box @ scene's backend
function vrodos_scenes_taxgame_box() {

    // Removes default side metaboxes
    remove_meta_box( 'vrodos_scene_pgamediv', 'vrodos_scene', 'side' );
    remove_meta_box( 'vrodos_scene_yamldiv', 'vrodos_scene', 'side' );

    // Adds a Project selection custom metabox
    add_meta_box( 'tagsdiv-vrodos_scene_pgame','Parent Project','vrodos_scenes_taxgame_box_content', 'vrodos_scene', 'side' , 'high');
    // Adds a YAML selection custom metabox
    add_meta_box( 'tagsdiv-vrodos_scene_yamldiv','Scene YAML','vrodos_scenes_taxyaml_box_content', 'vrodos_scene', 'side' , 'high');
}


function vrodos_scenes_taxgame_box_content($post){
    $tax_name = 'vrodos_scene_pgame';

    ?>

    <div class="tagsdiv" id="<?php echo $tax_name; ?>">

        <p class="howto"><?php echo 'Select Project for current Scene' ?></p>

        <?php
        // Use nonce for verification
        wp_nonce_field( plugin_basename( __FILE__ ), 'vrodos_scene_pgame_noncename' );
        $type_ids = wp_get_object_terms( $post->ID, 'vrodos_scene_pgame', array('fields' => 'ids') );
        $selected_type = empty($type_ids) ? '' : $type_ids[0];

        $args = array(
            'show_option_none'   => 'Select Project',
            'orderby'            => 'name',
            'hide_empty'         => 0,
            'selected'           => $selected_type,
            'name'               => 'vrodos_scene_pgame',
            'taxonomy'           => 'vrodos_scene_pgame',
            'echo'               => 0,
            'option_none_value'  => '-1',
            'id' => 'vrodos-select-category-dropdown'
        );

        $select = wp_dropdown_categories($args);

        $replace = "<select$1 required>";
        $select  = preg_replace( '#<select([^>]*)>#', $replace, $select );

        $old_option = "<option value='-1'>";
        $new_option = "<option disabled selected value=''>".'Select project'."</option>";
        $select = str_replace($old_option, $new_option, $select);

        echo $select;
        ?>

    </div>
    <?php
}

function vrodos_scenes_taxyaml_box_content($post){
    $tax_name = 'vrodos_scene_yaml';

    ?>

    <div class="tagsdiv" id="<?php echo $tax_name; ?>">

        <p class="howto"><?php echo 'Select YAML for current Scene' ?></p>

        <?php
        // Use nonce for verification
        wp_nonce_field( plugin_basename( __FILE__ ), 'vrodos_scene_yaml_noncename' );
        $type_ids = wp_get_object_terms( $post->ID, 'vrodos_scene_yaml', array('fields' => 'ids') );
        $selected_type = empty($type_ids) ? '' : $type_ids[0];

        $args = array(
            'show_option_none'   => 'Select YAML',
            'orderby'            => 'name',
            'hide_empty'         => 0,
            'selected'           => $selected_type,
            'name'               => 'vrodos_scene_yaml',
            'taxonomy'           => 'vrodos_scene_yaml',
            'echo'               => 0,
            'option_none_value'  => '-1',
            'id' => 'vrodos-select-category-dropdown'
        );

        $select = wp_dropdown_categories($args);

        $replace = "<select$1 required>";
        $select  = preg_replace( '#<select([^>]*)>#', $replace, $select );

        $old_option = "<option value='-1'>";
        $new_option = "<option disabled selected value=''>".'Select YAML'."</option>";
        $select = str_replace($old_option, $new_option, $select);

        echo $select;
        ?>

    </div>
    <?php
}

/**
 * Save the parent game taxonomy field
 *
 */
function vrodos_scenes_taxgame_box_content_save( $post_id ) {

    global $wpdb;

    // verify if this is an auto save routine.
    // If it is our form has not been submitted, so we dont want to do anything
    if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) )
        return;

    if (!isset($_POST['vrodos_scene_pgame_noncename']))
        return;

    // verify this came from the our screen and with proper authorization,
    // because save_post can be triggered at other times
    if ( !wp_verify_nonce( $_POST['vrodos_scene_pgame_noncename'], plugin_basename( __FILE__ ) ) )
        return;


    // Check permissions
    if ( 'vrodos_scene' == $_POST['post_type'] )
    {
        if ( ! ( current_user_can( 'edit_pages', $post_id )  ) )
            return;
    }
    else
    {
        if ( ! ( current_user_can( 'edit_posts', $post_id ) ) )
            return;
    }

    // OK, we're authenticated: we need to find and save the data
    $type_ID = intval($_POST['vrodos_scene_pgame'], 10);

    $type = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_scene_pgame' )->slug : NULL;

    wp_set_object_terms(  $post_id , $type, 'vrodos_scene_pgame' );

}



function vrodos_scenes_taxyaml_box_content_save( $post_id ) {

    global $wpdb;

    // verify if this is an auto save routine.
    // If it is our form has not been submitted, so we dont want to do anything
    if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) )
        return;

    if (!isset($_POST['vrodos_scene_yaml_noncename']))
        return;

    // verify this came from the our screen and with proper authorization,
    // because save_post can be triggered at other times
    if ( !wp_verify_nonce( $_POST['vrodos_scene_yaml_noncename'], plugin_basename( __FILE__ ) ) )
        return;


    // Check permissions
    if ( 'vrodos_scene' == $_POST['post_type'] )
    {
        if ( ! ( current_user_can( 'edit_pages', $post_id )  ) )
            return;
    }
    else
    {
        if ( ! ( current_user_can( 'edit_posts', $post_id ) ) )
            return;
    }

    // OK, we're authenticated: we need to find and save the data
    $type_ID = intval($_POST['vrodos_scene_yaml'], 10);

    $type = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_scene_yaml' )->slug : NULL;

    wp_set_object_terms(  $post_id , $type, 'vrodos_scene_yaml' );

}

function vrodos_set_custom_vrodos_scene_columns($columns) {
    $columns['scene_slug'] = 'Scene Slug';
    return $columns;
}

// Add the data to the custom columns for the scene post type
function vrodos_set_custom_vrodos_scene_columns_fill( $column, $post_id ) {
    switch ( $column ) {

        case 'scene_slug' :
            $mypost = get_post($post_id);
            $theSlug = $mypost->post_name;
            if ( is_string( $theSlug ) )
                echo $theSlug;
            else
                echo 'no slug found';
            break;
    }
}


// Add and Show the metabox with Custom Field for Scene - ($vrodos_databox4)
function vrodos_scenes_meta_definitions_add() {
    global $vrodos_scenes_metas_definition, $post;


    add_meta_box($vrodos_scenes_metas_definition['id'],
        'Scene Data',
        'vrodos_scenes_metas_adminside_show',
        $vrodos_scenes_metas_definition['page'],
        $vrodos_scenes_metas_definition['context'],
        $vrodos_scenes_metas_definition['priority']);
}


// Scenes Databox Show
function vrodos_scenes_metas_adminside_show(){
    global $vrodos_scenes_metas_definition, $post;

    // Use nonce for verification
    echo '<input type="hidden" name="vrodos_scenes_databox_nonce" value="', wp_create_nonce(basename(__FILE__)), '" />';

    //$categoryAsset = wp_get_post_terms($assetID, 'vrodos_asset3d_cat');
    //echo $categoryAssetSlug = $categoryAsset[0]->name;

    echo '<table class="form-table" id="vrodos-custom-fields-table">';

    foreach ($vrodos_scenes_metas_definition['fields'] as $field) {

        // get current post meta data
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

// Save data from this metabox with Custom Field for Scene
function vrodos_scenes_metas_save($post_id) {

    global $vrodos_scenes_metas_definition;

    if (!isset($_POST['vrodos_scenes_databox_nonce']))
        return;

    // verify nonce
    if (!wp_verify_nonce($_POST['vrodos_scenes_databox_nonce'], basename(__FILE__))) {
        return $post_id;
    }
    // check autosave
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return $post_id;
    }
    // check permissions
    if ('page' == $_POST['post_type']) {
        if (!current_user_can('edit_pages', $post_id)) {
            return $post_id;
        }
    } elseif (!current_user_can('edit_posts', $post_id)) {
        return $post_id;
    }
    foreach ($vrodos_scenes_metas_definition['fields'] as $field) {
        $old = get_post_meta($post_id, $field['id'], true);
        $new = $_POST[$field['id']];
        if ($new && $new != $old) {
            update_post_meta($post_id, $field['id'], $new);
        } elseif ('' == $new && $old) {
            delete_post_meta($post_id, $field['id'], $old);
        }
    }
}

?>
