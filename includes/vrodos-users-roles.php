<?php

function vrodos_add_customroles() {
    
    // These two roles to be removed it is for old version overlap
    remove_role( 'adv_game_master');
    remove_role( 'teacher');

    // This is the new role
    add_role( 'project_master', 'Project Master');
    
    $role = get_role( 'project_master' );

    // Caps about Games
    $role->add_cap( 'publish_vrodos_project' );
    $role->add_cap( 'read_vrodos_project' );
    $role->add_cap( 'edit_vrodos_project' );
    $role->add_cap( 'delete_vrodos_project' );

    // Caps about Scenes
    $role->add_cap( 'publish_vrodos_scene' );
    $role->add_cap( 'edit_vrodos_scene' );
    $role->add_cap( 'delete_vrodos_scene' );
    $role->add_cap( 'read_vrodos_scene' );

    // Caps about Assets
    $role->add_cap( 'publish_vrodos_asset3d' );
    $role->add_cap( 'edit_vrodos_asset3d' );
    $role->add_cap( 'delete_vrodos_asset3d' );
    $role->add_cap( 'read_vrodos_asset3d' );
    
    // Caps about Taxonomies
    $role->add_cap( 'manage_vrodos_project_type' );
    $role->add_cap( 'edit_vrodos_project_type' );
    $role->add_cap( 'manage_vrodos_taxpgame' );
    $role->add_cap( 'edit_vrodos_taxpgame' );
    $role->add_cap( 'manage_vrodos_scene_yaml' );
    $role->add_cap( 'edit_vrodos_scene_yaml' );
    
    $role->add_cap( 'manage_vrodos_asset3d_cat' );
    $role->add_cap( 'manage_vrodos_asset3d_iprcat' );
    $role->add_cap( 'manage_vrodos_asset3d_pgame' );

    $role->add_cap( 'edit_vrodos_asset3d_cat' );
    $role->add_cap( 'edit_vrodos_asset3d_iprcat' );
    $role->add_cap( 'edit_vrodos_asset3d_pgame' );
    
    unset( $role );
}

function vrodos_add_capabilities_to_admin() {
    $role = get_role( 'administrator' );

    // Caps about Games
    $role->add_cap( 'publish_vrodos_project' );
    $role->add_cap( 'edit_vrodos_project' );
    $role->add_cap( 'edit_others_vrodos_project' );
    $role->add_cap( 'delete_vrodos_project' );
    $role->add_cap( 'delete_others_vrodos_project' );
    $role->add_cap( 'read_private_vrodos_project' );
    $role->add_cap( 'read_vrodos_project' );

    // Caps about Scenes
    $role->add_cap( 'publish_vrodos_scene' );
    $role->add_cap( 'edit_vrodos_scene' );
    $role->add_cap( 'edit_others_vrodos_scene' );
    $role->add_cap( 'delete_vrodos_scene' );
    $role->add_cap( 'delete_others_vrodos_scene' );
    $role->add_cap( 'read_private_vrodos_scene' );
    $role->add_cap( 'read_vrodos_scene' );

    // Caps about Assets
    $role->add_cap( 'publish_vrodos_asset3d' );
    $role->add_cap( 'edit_vrodos_asset3d' );
    $role->add_cap( 'edit_others_vrodos_asset3d' );
    $role->add_cap( 'delete_vrodos_asset3d' );
    $role->add_cap( 'delete_others_vrodos_asset3d' );
    $role->add_cap( 'read_private_vrodos_asset3d' );
    $role->add_cap( 'read_vrodos_asset3d' );

    // Caps about Taxonomies
    $role->add_cap( 'manage_vrodos_project_type' );
    $role->add_cap( 'edit_vrodos_project_type' );
    $role->add_cap( 'manage_vrodos_taxpgame' );
    $role->add_cap( 'edit_vrodos_taxpgame' );
    $role->add_cap( 'manage_vrodos_scene_yaml' );
    $role->add_cap( 'edit_vrodos_scene_yaml' );
    
    $role->add_cap( 'manage_vrodos_asset3d_cat' );
    $role->add_cap( 'manage_vrodos_asset3d_iprcat' );
    
    $role->add_cap( 'edit_vrodos_asset3d_cat' );
    $role->add_cap( 'edit_vrodos_asset3d_iprcat' );
    
    $role->add_cap( 'manage_vrodos_asset3d_pgame' );
    $role->add_cap( 'edit_vrodos_asset3d_pgame' );

    unset( $role );
}

function extra_user_profile_field_mvnode_token( $user ) { ?>
    <h3><?php _e("MediaVerse extra information", "blank"); ?></h3>
    
    <table class="form-table">
        <tr>
            <th><label for="mvnode_token"><?php _e("MediaVerse Node Token"); ?></label></th>
            <td>
                <input type="text" name="mvnode_token" id="mvnode_token" value="<?php
                      echo esc_attr( get_the_author_meta( 'mvnode_token', $user->ID ) );
                      ?>" class="regular-text" /><br />
                <span class="description"><?php _e("The registered MV node token."); ?></span>
            </td>
        </tr>
        
    </table>
<?php }

function save_extra_user_profile_field_mvnode_token( $user_id ) {
	if ( empty( $_POST['_wpnonce'] ) || ! wp_verify_nonce( $_POST['_wpnonce'], 'update-user_' . $user_id ) ) {
		return false;
	}
	
	if ( !current_user_can( 'edit_user', $user_id ) ) {
		return false;
	}
 
	update_user_meta( $user_id, 'mvnode_token', $_POST['mvnode_token'] );
    return true;
}

function extra_user_profile_field_mvnode_url( $user ) { ?>

    <table class="form-table">
        <tr>
            <th><label for="mvnode_url"><?php _e("MediaVerse Node URL"); ?></label></th>
            <td>
                <input type="text" name="mvnode_url" id="mvnode_url" value="<?php
                echo esc_attr( get_the_author_meta( 'mvnode_url', $user->ID ) );
                ?>" class="regular-text" /><br />
                <span class="description"><?php _e("The registered MV node url."); ?></span>
            </td>
        </tr>

    </table>
<?php }

function save_extra_user_profile_field_mvnode_url( $user_id ) {
    if ( empty( $_POST['_wpnonce'] ) || ! wp_verify_nonce( $_POST['_wpnonce'], 'update-user_' . $user_id ) ) {
        return false;
    }

    if ( !current_user_can( 'edit_user', $user_id ) ) {
        return false;
    }

    update_user_meta( $user_id, 'mvnode_url', $_POST['mvnode_url'] );
    return true;
}

?>
