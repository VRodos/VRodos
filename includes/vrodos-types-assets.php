<?php

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
