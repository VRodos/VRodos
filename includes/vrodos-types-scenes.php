<?php

// Create metabox with Custom Fields for Scene -($vrodos_databox4)
//$def_json = vrodos_getDefaultJSONscene('energy');

//All information about scenes meta fields
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
        ),
        array(
            'name' => 'Scene Latitude',
            'desc' => 'Scene\'s Latitude',
            'id' => 'vrodos_scene_lat',
            'type' => 'text',
            'std' => ''
        ),array(
            'name' => 'Scene Longitude',
            'desc' => 'Scene\'s Longitude',
            'id' => 'vrodos_scene_lng',
            'type' => 'text',
            'std' => ''
        )
    )
);

$vrodos_scenes_metas_helpdata = array(
    'id' => 'vrodos-scenes-databox-helpdata',
    'page' => 'vrodos_scene',
    'context' => 'side',
    'priority' => 'low',
    'fields' => array(
        array(
            'name' => 'Help Scene Text',
            'desc' => 'Text for the Help scene (if activated)',
            'id' => 'vrodos_scene_help_text',
            'type' => 'textarea',
            'std' => ''
        ),
        array(
            'name' => 'Help Scene Image',
            'desc' => 'Help Scene Image',
            'id' => 'vrodos_scene_helpimg',
            'type' => 'text',
            'std' => ''
        ),
    )
);


// Create Scene - Scene as custom type 'vrodos_scene'
function vrodos_scenes_construct(){

//    $ff = fopen("output_order_log.txt","a");
//    fwrite($ff, '11 vrodos_scenes_construct'.chr(13));
//    fclose($ff);
    
    
    $labels = array(
        'name' => _x('Scenes', 'post type general name'),
        'singular_name' => _x('Scene', 'post type singular name'),
        'menu_name' => _x('Scenes', 'admin menu'),
        'name_admin_bar' => _x('Scene', 'add new on admin bar'),
        'add_new' => _x('Add New', 'add new on menu'),
        'add_new_item' => __('Add New Scene'),
        'new_item' => __('New Scene'),
        'edit' => __('Edit'),
        'edit_item' => __('Edit Scene'),
        'view' => __('View'),
        'view_item' => __('View Scene'),
        'all_items' => __('All Scenes'),
        'search_items' => __('Search Scenes'),
        'parent_item_colon' => __('Parent Scenes:'),
        'parent' => __('Parent Scene'),
        'not_found' => __('No Scenes found.'),
        'not_found_in_trash' => __('No Scenes found in Trash.')
    );
    $args = array(
        'labels' => $labels,
        'description' => 'Displays several Scenes of a Game',
        'public' => true,
        'exclude_from_search' => true,
        'publicly_queryable' => false,
        'show_in_nav_menus' => false,
        'show_ui'           => true,
        'show_in_menu'      => false,
        'menu_position' => 25,
        'menu_icon' => 'dashicons-media-default',
        'taxonomies' => array('vrodos_scene_pgame','vrodos_scene_yaml'),
        'supports' => array('title', 'author', 'editor', 'custom-fields', 'thumbnail','revisions'),
        'hierarchical' => false,
        'has_archive' => false,
        //'map_meta_cap' => true,
        'capabilities' => array(
            'publish_posts' => 'publish_vrodos_scene',
            'edit_posts' => 'edit_vrodos_scene',
            'edit_others_posts' => 'edit_others_vrodos_scene',
            'delete_posts' => 'delete_vrodos_scene',
            'delete_others_posts' => 'delete_others_vrodos_scene',
            'read_private_posts' => 'read_private_vrodos_scene',
            'edit_post' => 'edit_vrodos_scene',
            'delete_post' => 'delete_vrodos_scene',
            'read_post' => 'read_vrodos_scene',
        ),
    );
    register_post_type('vrodos_scene', $args);
}


// Create Scene Taxonomy, namely the game that the scene belongs
function vrodos_scenes_parent_project_tax_define() {

//    $ff = fopen("output_order_log.txt","a");
//    fwrite($ff, '12 vrodos_scenes_taxpgame'.chr(13));
//    fclose($ff);
    
    $labels = array(
        'name' => _x('Parent Project', 'taxonomy general name'),
        'singular_name' => _x('Parent Project', 'taxonomy singular name'),
        'menu_name' => _x('Parent Projects', 'admin menu'),
        'search_items' => __('Search Parent Projects'),
        'all_items' => __('All Parent Projects'),
        'parent_item' => __('Parent Project'),
        'parent_item_colon' => __('Parent Project:'),
        'edit_item' => __('Edit Parent Project'),
        'update_item' => __('Update Parent Project'),
        'add_new_item' => __('Add New Parent Project'),
        'new_item_name' => __('New Parent Project')
    );
    
    $args = array(
        'description' => 'Project that the Scene belongs',
        'labels' => $labels,
        'public' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'hierarchical' => false,
        'show_admin_column' => true,
        'capabilities' => array (
            'manage_terms' => 'manage_vrodos_taxpgame',
            'edit_terms' => 'manage_vrodos_taxpgame',
            'delete_terms' => 'manage_vrodos_taxpgame',
            'assign_terms' => 'edit_vrodos_taxpgame'
        ),
    );
    
    register_taxonomy('vrodos_scene_pgame', 'vrodos_scene', $args);
}

// Create Scene YAML Template - YAML Template that the Scene belongs as custom taxonomy 'vrodos_scene_yaml'
function vrodos_scenes_taxyaml(){
    $labels = array(
        'name' => _x('Scene Type', 'taxonomy general name'),
        'singular_name' => _x('Scene Type', 'taxonomy singular name'),
        'menu_name' => _x('Scene Types', 'admin menu'),
        'search_items' => __('Search Scene Types'),
        'all_items' => __('All Scene Types'),
        'parent_item' => __('Parent Scene Type'),
        'parent_item_colon' => __('Parent Scene Type:'),
        'edit_item' => __('Edit Scene Type'),
        'update_item' => __('Update Scene Type'),
        'add_new_item' => __('Add New Scene Type'),
        'new_item_name' => __('New Scene Type')
    );
    $args = array(
        'description' => 'Scene Type (YAML Template) that the Scene belongs',
        'labels' => $labels,
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'hierarchical' => true,
        'show_admin_column' => true,
        'capabilities' => array (
            'manage_terms' => 'manage_vrodos_scene_yaml',
            'edit_terms' => 'manage_vrodos_scene_yaml',
            'delete_terms' => 'manage_vrodos_scene_yaml',
            'assign_terms' => 'edit_vrodos_scene_yaml'
        ),
    );
    register_taxonomy('vrodos_scene_yaml', 'vrodos_scene', $args);
}



// Create Scene's Game Box @ scene's backend
function vrodos_scenes_taxgame_box() {
    
    remove_meta_box( 'vrodos_scene_pgamediv', 'vrodos_scene', 'side' ); //Removes the default metabox at side
    remove_meta_box( 'vrodos_scene_yamldiv', 'vrodos_scene', 'side' ); //Removes the default metabox at side
    
    add_meta_box( 'tagsdiv-vrodos_scene_pgame','Scene Game','vrodos_scenes_taxgame_box_content', 'vrodos_scene', 'side' , 'high'); //Adds the custom metabox with select box
    add_meta_box( 'tagsdiv-vrodos_scene_yamldiv','Scene YAML','vrodos_scenes_taxyaml_box_content', 'vrodos_scene', 'side' , 'high'); //Adds the custom metabox with select box
}


function vrodos_scenes_taxgame_box_content($post){
    $tax_name = 'vrodos_scene_pgame';
    
    ?>
    
    <div class="tagsdiv" id="<?php echo $tax_name; ?>">
        
        <p class="howto"><?php echo 'Select Game for current Scene' ?></p>
        
        <?php
        // Use nonce for verification
        wp_nonce_field( plugin_basename( __FILE__ ), 'vrodos_scene_pgame_noncename' );
        $type_IDs = wp_get_object_terms( $post->ID, 'vrodos_scene_pgame', array('fields' => 'ids') );
        
        $args = array(
            'show_option_none'   => 'Select Game',
            'orderby'            => 'name',
            'hide_empty'         => 0,
            'selected'           => $type_IDs[0],
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
        $new_option = "<option disabled selected value=''>".'Select category'."</option>";
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
        $type_IDs = wp_get_object_terms( $post->ID, 'vrodos_scene_yaml', array('fields' => 'ids') );
        
        $args = array(
            'show_option_none'   => 'Select YAML',
            'orderby'            => 'name',
            'hide_empty'         => 0,
            'selected'           => $type_IDs[0],
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
        if ( ! ( current_user_can( 'edit_page', $post_id )  ) )
            return;
    }
    else
    {
        if ( ! ( current_user_can( 'edit_post', $post_id ) ) )
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
        if ( ! ( current_user_can( 'edit_page', $post_id )  ) )
            return;
    }
    else
    {
        if ( ! ( current_user_can( 'edit_post', $post_id ) ) )
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
    global $vrodos_scenes_metas_definition,$vrodos_scenes_metas_helpdata, $post;
    
    
    add_meta_box($vrodos_scenes_metas_definition['id'],
        'Scene Data',
        'vrodos_scenes_metas_adminside_show',
        $vrodos_scenes_metas_definition['page'],
        $vrodos_scenes_metas_definition['context'],
        $vrodos_scenes_metas_definition['priority']);
    
    add_meta_box($vrodos_scenes_metas_helpdata['id'],
        'Help Scene Data',
        'vrodos_scenes_metas_helpdata_adminside_show',
        $vrodos_scenes_metas_helpdata['page'],
        $vrodos_scenes_metas_helpdata['context'],
        $vrodos_scenes_metas_helpdata['priority']);
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
// Scene Meta help scene data show
function vrodos_scenes_metas_helpdata_adminside_show(){
    global $vrodos_scenes_metas_helpdata, $post;
    // Use nonce for verification
    echo '<input type="hidden" name="vrodos_scenes_databox_nonce" value="', wp_create_nonce(basename(__FILE__)), '" />';
    
    $value_of_helptext = get_post_meta($post->ID,$vrodos_scenes_metas_helpdata['fields'][0]['id'], true);
    $value_of_helpimg = get_post_meta($post->ID,$vrodos_scenes_metas_helpdata['fields'][1]['id'], true);
    echo '<textarea name="', esc_attr($vrodos_scenes_metas_helpdata['fields'][0]['id']), '" id="', esc_attr($vrodos_scenes_metas_helpdata['fields'][0]['id']), '" cols="60" rows="4" style="width:97%">', esc_attr($value_of_helptext ? $value_of_helptext : $vrodos_scenes_metas_helpdata['fields'][0]['std']), '</textarea>', '<br />', esc_html($vrodos_scenes_metas_helpdata['fields'][0]['desc']);
    echo '<br /><br />';
    echo '<input type="text" name="', esc_attr($vrodos_scenes_metas_helpdata['fields'][1]['id']), '" id="', esc_attr($vrodos_scenes_metas_helpdata['fields'][1]['id']), '" value="', esc_attr($value_of_helpimg ? $value_of_helpimg : $vrodos_scenes_metas_helpdata['fields'][1]['std']), '" size="30" style="width:97%" />', '<br />', esc_html($vrodos_scenes_metas_helpdata['fields'][1]['desc']);
    //echo '<input id="' . esc_attr($vrodos_databox_helpdata['fields'][1]['id']) . '_btn" type="button" value="Upload Help Image"/>';
}

// Save data from this metabox with Custom Field for Scene
function vrodos_scenes_metas_save($post_id) {
    
    global $vrodos_scenes_metas_definition,$vrodos_scenes_metas_helpdata;
    
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
        if (!current_user_can('edit_page', $post_id)) {
            return $post_id;
        }
    } elseif (!current_user_can('edit_post', $post_id)) {
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
    foreach ($vrodos_scenes_metas_helpdata['fields'] as $field) {
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
