<?php

// Create Asset3D as custom type 'vrodos_asset3d'
function vrodos_assets_construct(){

    $labels = array(
        'name' => _x('Assets 3D', 'post type general name'),
        'singular_name' => _x('Asset 3D', 'post type singular name'),
        'menu_name' => _x('Assets 3D', 'admin menu'),
        'name_admin_bar' => _x('Asset 3D', 'add new on admin bar'),
        'add_new' => _x('Add New', 'add new on menu'),
        'add_new_item' => __('Add New Asset 3D'),
        'new_item' => __('New Asset 3D'),
        'edit' => __('Edit'),
        'edit_item' => __('Edit Asset 3D'),
        'view' => __('View'),
        'view_item' => __('View Asset 3D'),
        'all_items' => __('All Assets 3D'),
        'search_items' => __('Search Assets 3D'),
        'parent_item_colon' => __('Parent Assets 3D:'),
        'parent' => __('Parent Asset 3D'),
        'not_found' => __('No Assets 3D found.'),
        'not_found_in_trash' => __('No Assets 3D found in Trash.')
    );

    $args = array(
        'labels' => $labels,
        'description' => 'Displays Assets 3D',
        'public' => true,
        'exclude_from_search' => true,
        'publicly_queryable' => false,
        'show_in_nav_menus' => false,
        'show_ui'               => true, // (bool) Whether to generate and allow a UI for managing this post type in the admin. Default is value of $public.
        'show_in_menu'          => false, // Where to show the post type in the admin menu. To work, $show_ui must be true. If true, the post type is shown in its own top level menu. If false, no menu is shown. If a string of an existing top level menu ('tools.php' or 'edit.php?post_type=page', for example), the post type will be placed as a sub-menu of that. Default is value of $show_ui.
        'menu_position' => 25,
        'menu_icon' => 'dashicons-editor-textcolor',
        'taxonomies' => array('vrodos_asset3d_cat', 'vrodos_asset3d_pgame', 'vrodos_asset3d_ipr_cat'),
        'supports' => array('title', 'editor', 'custom-fields', 'thumbnail','revisions','author'),
        'hierarchical' => false,
        'show_in_graphql' => true,
        'graphql_single_name' => 'vrodosAsset3d',
        'graphql_plural_name' => 'vrodosAssets3d',
        'has_archive' => false,
        //'map_meta_cap'=>true,
        'capabilities' => array(
            'publish_posts' => 'publish_vrodos_asset3d',
            'edit_posts' => 'edit_vrodos_asset3d',
            'edit_others_posts' => 'edit_others_vrodos_asset3d',
            'delete_posts' => 'delete_vrodos_asset3d',
            'delete_others_posts' => 'delete_others_vrodos_asset3d',
            'read_private_posts' => 'read_private_vrodos_asset3d',
            'edit_post' => 'edit_vrodos_asset3d',
            'delete_post' => 'delete_vrodos_asset3d',
            'read_post' => 'read_vrodos_asset3d',
        ),
    );
    register_post_type('vrodos_asset3d', $args);
}

// Create custom taxonomy "Asset Type"
function vrodos_assets_taxcategory(){

    $labels = array(
        'name' => _x('Asset Type', 'taxonomy general name'),
        'singular_name' => _x('Asset Type', 'taxonomy singular name'),
        'menu_name' => _x('Asset Types', 'admin menu'),
        'search_items' => __('Search Asset Types'),
        'all_items' => __('All Asset Types'),
        'parent_item' => __('Parent Asset Type'),
        'parent_item_colon' => __('Parent Asset Type:'),
        'edit_item' => __('Edit Asset Type'),
        'update_item' => __('Update Asset Type'),
        'add_new_item' => __('Add New Asset Type'),
        'new_item_name' => __('New Asset Type')
    );

    $args = array(
        'description' => 'Type of 3D asset',
        'labels' => $labels,
        'public' => false,
        'show_ui' => true,
        'hierarchical' => false,
        'show_admin_column' => true,
        'capabilities' => array (
            'manage_terms' => 'manage_vrodos_asset3d_cat',
            'edit_terms' => 'manage_vrodos_asset3d_cat',
            'delete_terms' => 'manage_vrodos_asset3d_cat',
            'assign_terms' => 'edit_vrodos_asset3d_cat'
        ),
        'show_in_graphql' => true,
        'graphql_single_name' => 'VrodosAsset3DCategory',
        'graphql_plural_name' => 'VrodosAsset3DCategories',
    );
    register_taxonomy('vrodos_asset3d_cat', 'vrodos_asset3d', $args);
}

// Create Asset Project as custom taxonomy
function vrodos_assets_taxpgame(){

    $labels = array(
        'name' => _x('Asset Parent Taxonomy', 'taxonomy general name'),
        'singular_name' => _x('Parent Taxonomy', 'taxonomy singular name'),
        'menu_name' => _x('Parent Taxonomies', 'admin menu'),
        'search_items' => __('Search Parent Taxonomies'),
        'all_items' => __('All Asset Parent Taxonomies'),
        'parent_item' => __('Asset Parent Taxonomy'),
        'parent_item_colon' => __('Asset Parent Taxonomy:'),
        'edit_item' => __('Edit Parent Taxonomy'),
        'update_item' => __('Update Parent Taxonomy'),
        'add_new_item' => __('Add New Parent Taxonomy'),
        'new_item_name' => __('New Parent Taxonomy')
    );

    $args = array(
        'description' => 'Parent Taxonomy assignment of a 3D Asset',
        'labels' => $labels,
        'public' => false,
        'show_ui' => true,
        'hierarchical' => false,
        'show_admin_column' => true,
        'capabilities' => array (
            'manage_terms' => 'manage_vrodos_asset3d_pgame',
            'edit_terms' => 'manage_vrodos_asset3d_pgame',
            'delete_terms' => 'manage_vrodos_asset3d_pgame',
            'assign_terms' => 'edit_vrodos_asset3d_pgame'
        ),
    );
    register_taxonomy('vrodos_asset3d_pgame', 'vrodos_asset3d', $args);
}

// ================================================================
// Create Asset Category as custom taxonomy
function vrodos_assets_taxcategory_ipr(){
    $labels = array(
        'name' => _x('Asset IPR', 'taxonomy general name'),
        'singular_name' => _x('Asset IPR', 'taxonomy singular name'),
        'menu_name' => _x('Asset IPR', 'admin menu'),
        'search_items' => __('Search Asset by IPR'),
        'all_items' => __('All Asset IPRs'),
        'parent_item' => __('Parent Asset IPR'),
        'parent_item_colon' => __('Parent Asset IPR:'),
        'edit_item' => __('Edit Asset IPR'),
        'update_item' => __('Update Asset IPR'),
        'add_new_item' => __('Add New Asset IPR'),
        'new_item_name' => __('New Asset IPR')
    );
    $args = array(
        'description' => 'IPR taxonomy of 3D asset',
        'labels' => $labels,
        'public' => true,
        'show_ui' => true,
        'hierarchical' => false,
        'show_admin_column' => true,
        'capabilities' => array (
            'manage_terms' => 'manage_vrodos_asset3d_iprcat',
            'edit_terms' => 'manage_vrodos_asset3d_iprcat',
            'delete_terms' => 'manage_vrodos_asset3d_iprcat',
            'assign_terms' => 'edit_vrodos_asset3d_iprcat'
        ),
    );
    register_taxonomy('vrodos_asset3d_ipr_cat', 'vrodos_asset3d', $args);

    $terms_ipr = [
        ['Private','Nobody can view or edit the asset','asset_private'],
        ['Shared_A - View','Others can view only', 'asset_shared_type_a'],
        ['Shared_B - (A) & Clone','Others can view, comment, and clone asset with custom descriptions','asset_shared_type_b'],
        ['Shared_C - (A,B) & Use ','Others can view, comment, clone and use in experiences','asset_shared_type_c'],
        ['Shared_D - (A,B,C) & Download','Others can view, comment, clone, use in experiences and download','asset_shared_type_d'],
        ['Shared_E - Free to reuse in any way','Others can reuse in any way they see fit','asset_shared_type_e']
    ];

    foreach ($terms_ipr as $ti) {
        wp_insert_term($ti[0], 'vrodos_asset3d_ipr_cat', array('description' => $ti[1], 'slug' => $ti[2]));
    }
}


// Create PathData for each asset as custom field in order to upload files at pathdata/models folder
function vrodos_create_pathdata_asset( $post_ID, $post, $update ) {

    if (get_post_type($post_ID) === 'vrodos_asset3d' ) {

        $parentGameID = $_GET['vrodos_game'] ?? null;

        if (!is_numeric($parentGameID)) {
            /*  echo "ERROR 455: ParentGameID is not numeric.";
              echo '<br>';*/
            return;
        }

        $parentGameID = intval($parentGameID);
        $parentGameSlug = ( $parentGameID > 0 ) ? get_post( $parentGameID )->post_name : NULL;

        update_post_meta($post_ID,'vrodos_asset3d_pathData', $parentGameSlug);
    }
}

function vrodos_allowAuthorEditing()
{
    add_post_type_support( 'vrodos_asset3d', 'author' );
}

function change_user_dropdown( $query_args, $r ){

    // get screen object
    $screen = get_current_screen();

    // list users whose role is e.g. 'Editor' for 'post' post type
    if( $screen->post_type == 'vrodos_asset3d' ) {

        if (isset($query_args['who'])) {
            unset($query_args['who']);
        }

        $query_args['role__in'] = array('administrator');
    }

    return $query_args;
}


// ==========  Asset Taxes ===============

// Remove standard boxes and add custom in the admin back-end
function vrodos_assets_taxcategory_box() {

    remove_meta_box( 'tagsdiv-vrodos_asset3d_pgame', 'vrodos_asset3d', 'side' );
    remove_meta_box( 'tagsdiv-vrodos_asset3d_cat', 'vrodos_asset3d', 'side' );
    remove_meta_box( 'tagsdiv-vrodos_asset3d_ipr_cat', 'vrodos_asset3d', 'side' );

    add_meta_box( 'vrodos_asset_project_selectbox','Project', 'vrodos_assets_tax_select_project_box_content', 'vrodos_asset3d', 'side' , 'high');

    add_meta_box( 'vrodos_asset3d_category_selectbox','Asset Category', 'vrodos_assets_tax_select_category_box_content', 'vrodos_asset3d', 'side' , 'high');

    add_meta_box( 'vrodos_asset3d_ipr_cat_selectbox','Asset IPR Category', 'vrodos_assets_tax_select_iprcategory_box_content', 'vrodos_asset3d', 'side' , 'high');
}

function vrodos_assets_tax_select_project_box_content($post){

    $tax_name = 'vrodos_asset3d_pgame';
    ?>
    <div class="tagsdiv" id="<?php echo $tax_name; ?>">

        <p class="howto"><?php echo 'Select project that this asset belongs to' ?></p>

        <?php
        // Use nonce for verification
        wp_nonce_field( plugin_basename( __FILE__ ), 'vrodos_asset3d_pgame_noncename' );
        $type_IDs = wp_get_object_terms( $post->ID, 'vrodos_asset3d_pgame', array('fields' => 'ids') );

        $type_ID = $type_IDs ? $type_IDs[0] : 0 ;

        $args = array(
            'show_option_none'   => 'Select Category',
            'orderby'            => 'name',
            'hide_empty'         => 0,
            'selected'           => $type_ID,
            'name'               => 'vrodos_asset3d_pgame',
            'taxonomy'           => 'vrodos_asset3d_pgame',
            'echo'               => 0,
            'option_none_value'  => '-1',
            'id' => 'vrodos-select-category-dropdown'
        );

        $select = wp_dropdown_categories($args);

        $replace = "<select$1 required>";
        $select  = preg_replace( '#<select([^>]*)>#', $replace, $select );

        $old_option = "<option value='-1'>";
        $new_option = "<option disabled selected value=''>".'Select Game'."</option>";
        $select = str_replace($old_option, $new_option, $select);

        echo $select;
        ?>
    </div>
    <?php
}

// Save vrodos_asset3d_cat
function vrodos_asset_tax_category_box_content_save( $post_id ) {

    // verify if this is an auto save routine.
    // If it is our form has not been submitted, so we dont want to do anything
    if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) ||
        !isset($_POST['vrodos_asset3d_cat_noncename']) ||
        !wp_verify_nonce( $_POST['vrodos_asset3d_cat_noncename'], plugin_basename( __FILE__ ) ) ||
        // verify this came from the our screen and with proper authorization,
        // because save_post can be triggered at other times
//        !current_user_can( 'edit_pages',$post_id ) || // Check permissions
        !current_user_can( 'edit_vrodos_asset3d_cat',$post_id ) // Verify that user can edit categories
    ) {
        return;
    }

    // OK, we're authenticated: we need to find and save the data
    $type_ID = intval($_POST['vrodos_asset3d_cat'], 10);
    $type = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_asset3d_cat' )->slug : NULL;
    wp_set_object_terms(  $post_id , $type, 'vrodos_asset3d_cat' );
}


// Select the category (admin select box)
function vrodos_assets_tax_select_category_box_content($post){
    $tax_name = 'vrodos_asset3d_cat';
    ?>
    <div class="tagsdiv" id="<?php echo $tax_name; ?>">

        <p class="howto"><?php echo 'Select category for current Asset' ?></p>

        <?php
        // Use nonce for verification
        wp_nonce_field( plugin_basename( __FILE__ ), 'vrodos_asset3d_cat_noncename' );
        $type_IDs = wp_get_object_terms( $post->ID, 'vrodos_asset3d_cat', array('fields' => 'ids') );

        $type_ID = $type_IDs ? $type_IDs[0] : 0 ;

        $args = array(
            'show_option_none'   => 'Select Category',
            'orderby'            => 'name',
            'hide_empty'         => 0,
            'selected'           => $type_ID,
            'name'               => 'vrodos_asset3d_cat',
            'taxonomy'           => 'vrodos_asset3d_cat',
            'echo'               => 0,
            'option_none_value'  => '-1',
            'id'                 => 'vrodos-select-asset3d-cat-dropdown',
        );

        $select = wp_dropdown_categories($args);

                $replace = "<select$1 onchange='vrodos_hidecfields_asset3d();' required>";
                $select  = preg_replace( '#<select([^>]*)>#', $replace, $select );

                $old_option = "<option value='-1'>";
                $new_option = "<option disabled selected value=''>".'Select Category'."</option>";
                $select = str_replace($old_option, $new_option, $select);

        echo $select;
        ?>
    </div>
    <?php
}

//============ IPR categories ====================
function vrodos_assets_tax_select_iprcategory_box_content($post){
    $tax_name = 'vrodos_asset3d_ipr_cat';
    ?>
    <div class="tagsdiv" id="<?php echo $tax_name; ?>">

        <p class="howto"><?php echo 'Select IPR category for current Asset' ?></p>

        <?php
        // Use nonce for verification
        wp_nonce_field( plugin_basename( __FILE__ ), 'vrodos_asset3d_ipr_cat_noncename' );
        $type_ids = wp_get_object_terms( $post->ID, 'vrodos_asset3d_ipr_cat', array('fields' => 'ids') );
        $selected_type = empty($type_ids) ? '' : $type_ids[0];

        $args = array(
            'show_option_none'   => 'Select IPR Category',
            'orderby'            => 'name',
            'hide_empty'         => 0,
            'selected'           => $selected_type,
            'name'               => 'vrodos_asset3d_ipr_cat',
            'taxonomy'           => 'vrodos_asset3d_ipr_cat',
            'echo'               => 0,
            'option_none_value'  => '-1',
            'id' => 'vrodos-select-asset3d-ipr-cat-dropdown',
        );



        $select = wp_dropdown_categories($args);

        $replace = "<select$1 required>";
        $select  = preg_replace( '#<select([^>]*)>#', $replace, $select );

        $old_option = "<option value='-1'>";
        $new_option = "<option disabled selected value=''>".'Select IPR category'."</option>";
        $select = str_replace($old_option, $new_option, $select);

        echo $select;
        ?>
    </div>
    <?php
}

// Save IPR category
function vrodos_assets_taxcategory_ipr_box_content_save( $post_id ) {

    // verify if this is an auto save routine.
    // If it is our form has not been submitted, so we dont want to do anything
    if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) ||
        wp_is_post_revision( $post_id ) ||
        ! isset($_POST['vrodos_asset3d_ipr_cat_noncename']) ||
        !wp_verify_nonce( $_POST['vrodos_asset3d_ipr_cat_noncename'], plugin_basename( __FILE__ ) ) ||
        //!current_user_can( 'edit_pages', $post_id ) ||
        !current_user_can( 'edit_vrodos_asset3d_iprcat',$post_id ) // Verify that user can edit categories
    ) {
        return;
    }

    // OK, we're authenticated: we need to find and save the data
    $type_ID = intval($_POST['vrodos_asset3d_ipr_cat'], 10);
    $type = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_asset3d_ipr_cat' )->slug : NULL;
    wp_set_object_terms(  $post_id , $type, 'vrodos_asset3d_ipr_cat' );
}


// Save vrodos_asset3d_pgame
function vrodos_asset_project_box_content_save($post_id ) {

//    $fg = fopen("output_gg.txt","w");
//    fwrite($fg, "1".chr(13));

    // verify if this is an auto save routine.
    // If it is our form has not been submitted, so we dont want to do anything
    if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) ||
        wp_is_post_revision( $post_id ) ||
        !isset($_POST['vrodos_asset3d_pgame_noncename']) ||
        !wp_verify_nonce( $_POST['vrodos_asset3d_pgame_noncename'], plugin_basename( __FILE__ ) ) ||
        //!current_user_can( 'edit_pages', $post_id ) ||
        !current_user_can( 'edit_vrodos_asset3d_pgame', $post_id )
    ) {
        return;
    }

    // OK, we're authenticated: we need to find and save the data
    $type_ID = intval($_POST['vrodos_asset3d_pgame'], 10);
    $type = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_asset3d_pgame' )->slug : NULL;
    wp_set_object_terms(  $post_id , $type, 'vrodos_asset3d_pgame' );
}


function vrodos_set_custom_vrodos_asset3d_columns($columns) {
    $columns['asset_slug'] = 'Asset Slug';
    return $columns;
}

function vrodos_set_custom_vrodos_asset3d_columns_fill( $column, $post_id ) {
    switch ( $column ) {
        case 'asset_slug' :
            $mypost = get_post($post_id);
            $theSlug = $mypost->post_name;
            if ( is_string( $theSlug ) )
                echo $theSlug;
            else
                echo 'no slug found';
            break;
    }
}
