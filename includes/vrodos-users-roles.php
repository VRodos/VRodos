<?php

//
//echo print("<pre>".print_r(array_keys(get_role( 'adv_project_master6' )->capabilities), true)."</pre>");

//
//$role = get_role( 'adv_project_master6' );
//
//
//
//

//remove_role( 'adv_project_master3');
//remove_role( 'adv_project_master2');
//remove_role( 'adv_project_master1');



//$role->add_cap('read');

//$role->remove_cap('read');
//$role->remove_cap('level_0');


//$role->remove_cap('edit_wpunity_game');
//$role->remove_cap('read_wpunity_game');
//$role->remove_cap('read_private_wpunity_game ');
//$role->remove_cap('delete_others_wpunity_game');
//$role->remove_cap('delete_wpunity_game');
//$role->remove_cap('edit_others_wpunity_game');
//
//$role->remove_cap('manage_game_type');
//$role->remove_cap('edit_game_type');
//$role->remove_cap('read_private_wpunity_game');
//$role->remove_cap('manage_game_cat');
//$role->remove_cap('edit_game_cat');
//$role->remove_cap('manage_game_type');
//$role->remove_cap('edit_game_type');
//
//echo "<br />";
//foreach ( $role->capabilities as $key => $value ) {
//    echo "{$key} => {$value} "."<br />";
//}





function vrodos_add_customroles() {
    
    // These two roles to be removed it is for old version overlap
    remove_role( 'adv_game_master');
    remove_role( 'teacher');
    
    
    // This is the new role
    add_role( 'project_master', 'Project Master');
    
    $role = get_role( 'project_master' );
    
    //$role->add_cap('read');
    //$role->add_cap('level_0');
    
//    //Caps about Games
    $role->add_cap( 'publish_vrodos_project' );
    $role->add_cap( 'edit_vrodos_project' );
    $role->add_cap( 'delete_vrodos_project' );
    $role->add_cap( 'edit_vrodos_project' );
    $role->add_cap( 'delete_vrodos_project' );
    $role->add_cap( 'read_vrodos_project' );
//
//    //Caps about Scenes
    $role->add_cap( 'publish_vrodos_scene' );
    $role->add_cap( 'edit_vrodos_scene' );
    $role->add_cap( 'delete_vrodos_scene' );
    $role->add_cap( 'edit_vrodos_scene' );
    $role->add_cap( 'delete_vrodos_scene' );
    $role->add_cap( 'read_vrodos_scene' );
//
//    //Caps about Assets
    $role->add_cap( 'publish_vrodos_asset3d' );
    $role->add_cap( 'edit_vrodos_asset3d' );
    $role->add_cap( 'delete_vrodos_asset3d' );
    $role->add_cap( 'edit_vrodos_asset3d' );
    $role->add_cap( 'delete_vrodos_asset3d' );
    $role->add_cap( 'read_vrodos_asset3d' );
    
    //Caps about Taxonomies

    $role->add_cap( 'manage_vrodos_project_type' );
    $role->add_cap( 'edit_vrodos_project_type' );
    $role->add_cap( 'manage_wpunity_taxpgame' );
    $role->add_cap( 'edit_wpunity_taxpgame' );
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



function vrodos_add_capabilities_to_admin() {
    $role = get_role( 'administrator' );

    //Caps about Games
    $role->add_cap( 'publish_vrodos_project' );
    $role->add_cap( 'edit_vrodos_project' );
    $role->add_cap( 'edit_others_vrodos_project' );
    $role->add_cap( 'delete_vrodos_project' );
    $role->add_cap( 'delete_others_vrodos_project' );
    $role->add_cap( 'read_private_vrodos_project' );
    $role->add_cap( 'edit_vrodos_project' );
    $role->add_cap( 'delete_vrodos_project' );
    $role->add_cap( 'read_vrodos_project' );

    //Caps about Scenes
    $role->add_cap( 'publish_vrodos_scene' );
    $role->add_cap( 'edit_vrodos_scene' );
    $role->add_cap( 'edit_others_vrodos_scene' );
    $role->add_cap( 'delete_vrodos_scene' );
    $role->add_cap( 'delete_others_vrodos_scene' );
    $role->add_cap( 'read_private_vrodos_scene' );
    $role->add_cap( 'edit_vrodos_scene' );
    $role->add_cap( 'delete_vrodos_scene' );
    $role->add_cap( 'read_vrodos_scene' );

    //Caps about Assets
    $role->add_cap( 'publish_vrodos_asset3d' );
    $role->add_cap( 'edit_vrodos_asset3d' );
    $role->add_cap( 'edit_others_vrodos_asset3d' );
    $role->add_cap( 'delete_vrodos_asset3d' );
    $role->add_cap( 'delete_others_vrodos_asset3d' );
    $role->add_cap( 'read_private_vrodos_asset3d' );
    $role->add_cap( 'edit_vrodos_asset3d' );
    $role->add_cap( 'delete_vrodos_asset3d' );
    $role->add_cap( 'read_vrodos_asset3d' );

    //Caps about Taxonomies
    $role->add_cap( 'manage_vrodos_project_type' );
    $role->add_cap( 'edit_vrodos_project_type' );
    $role->add_cap( 'manage_wpunity_taxpgame' );
    $role->add_cap( 'edit_wpunity_taxpgame' );
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



?>
