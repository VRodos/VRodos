<?php

function vrodos_create_archaeology_mainmenu_unity($scene_post,$scene_type_ID,$scene_id,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file){
    //DATA of mainmenu-arch-yaml
    $term_meta_s_mainmenu = vrodos_getSceneYAML_archaeology('menu');
    $title_text = $scene_post->post_title;
    $is_bt_settings_active = intval ( get_post_meta($scene_id,'vrodos_menu_has_options',true) );
    $is_help_bt_active = intval ( get_post_meta($scene_id,'vrodos_menu_has_help',true) );
    $is_login_bt_active = intval ( get_post_meta($scene_id,'vrodos_menu_has_login',true) );
    $is_exit_button_active = 1;//TODO
    $featured_image_sprite_id = get_post_thumbnail_id( $scene_id );//The Featured Image ID
    $featured_image_sprite_guid = 'dad02368a81759f4784c7dbe752b05d6';//if there's no Featured Image

    if($featured_image_sprite_id != ''){
        $featured_image_sprite_guid = vrodos_compile_sprite_upload($featured_image_sprite_id, $gameSlug, $scene_id);
    }

    $file_content = vrodos_replace_mainmenu_unity($term_meta_s_mainmenu,$title_text,$featured_image_sprite_guid,$is_bt_settings_active,$is_help_bt_active,$is_exit_button_active,$is_login_bt_active);

    $file = $game_path . '/' . 'S_MainMenu.unity';
    $create_file = fopen($file, "w") or die("Unable to open file!");
    fwrite($create_file, $file_content);
    fclose($create_file);

    
    //Add Static Pages to EditorBuilderSettings.asset and in HandyBuilder.cs
    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Reward.unity');//Update the EditorBuildSettings.asset by adding new Scene
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, 'Assets/scenes/S_Reward.unity');

    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_SceneSelector.unity');//Update the EditorBuildSettings.asset by adding new Scene
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, 'Assets/scenes/S_SceneSelector.unity');

    // Settings button active switch
    if($is_bt_settings_active == '1'){
        //CREATE SETTINGS/OPTIONS Unity file
        $term_meta_s_settings = vrodos_getSceneYAML_archaeology('options');
        $file_content2 = vrodos_replace_settings_unity($term_meta_s_settings);

        $file2 = $game_path . '/S_Settings.unity';
        $create_file2 = fopen($file2, "w") or die("Unable to open file!");
        fwrite($create_file2,$file_content2);
        fclose($create_file2);

        vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Settings.unity');//Update the EditorBuildSettings.asset by adding new Scene
        $file2_path_CS = 'Assets/scenes/' . 'S_Settings.unity';
        vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file2_path_CS);
    }

    if($is_help_bt_active == '1'){
        //CREATE HELP Unity file
        $term_meta_s_help = vrodos_getSceneYAML_archaeology('help');
        $text_help_scene = get_post_meta($scene_id,'vrodos_scene_help_text',true);
        $img_help_scene_id = get_post_meta($scene_id,'vrodos_scene_helpimg',true);
        $img_help_scene_guid = 'dad02368a81759f4784c7dbe752b05d6'; //if there's no Featured Image (custom field at Main Menu)
        if($img_help_scene_id != ''){$img_help_scene_guid = vrodos_compile_sprite_upload($img_help_scene_id,$gameSlug,$scene_id);}
        $file_content3 = vrodos_replace_help_unity($term_meta_s_help,$text_help_scene,$img_help_scene_guid);

        $file3 = $game_path . '/' . 'S_Help.unity';
        $create_file3 = fopen($file3, "w") or die("Unable to open file!");
        fwrite($create_file3, $file_content3);
        fclose($create_file3);

        vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Help.unity');//Update the EditorBuildSettings.asset by adding new Scene
        vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, 'Assets/scenes/S_Help.unity');
    }

    if($is_login_bt_active == '1'){
        //CREATE Login Unity file
        $term_meta_s_login = vrodos_getSceneYAML_archaeology('login');
        $file_content4 = vrodos_replace_login_unity($term_meta_s_login);

        $file4 = $game_path . '/S_Login.unity';
        $create_file4 = fopen($file4, "w") or die("Unable to open file!");
        fwrite($create_file4,$file_content4);
        fclose($create_file4);

        vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Login.unity');//Update the EditorBuildSettings.asset by adding new Scene
        vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, 'Assets/scenes/S_Login.unity');
    }
}

function vrodos_create_archaeology_credentials_unity($scene_post,$scene_type_ID,$scene_id,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file){
    //DATA of Credits Scene
    $term_meta_s_credits = vrodos_getSceneYAML_archaeology('credits');
    $credits_content = $scene_post->post_content;

    $featured_image_sprite_id = get_post_thumbnail_id( $scene_id );//The Featured Image ID
    $featured_image_sprite_guid = 'dad02368a81759f4784c7dbe752b05d6'; //if there's no Featured Image
    if($featured_image_sprite_id != ''){$featured_image_sprite_guid = vrodos_compile_sprite_upload($featured_image_sprite_id,$gameSlug,$scene_id);}
    $file_content5 = vrodos_replace_creditsscene_unity($term_meta_s_credits,$credits_content,$featured_image_sprite_guid);

    $file5 = $game_path . '/S_Credits.unity';
    $create_file5 = fopen($file5, "w") or die("Unable to open file!");
    fwrite($create_file5, $file_content5);
    fclose($create_file5);

    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Credits.unity');//Update the EditorBuildSettings.asset by adding new Scene
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, 'Assets/scenes/S_Credits.unity');
}

function vrodos_create_archaeology_wonderaround_unity($scene_post, $scene_type_ID, $scene_id, $gameSlug, $game_path, $fileEditorBuildSettings, $handybuilder_file,
                                                       $scenes_counter, $gameType){
    //DATA of Wonder Around Scene
    $term_meta_wonder_around = vrodos_getSceneYAML_archaeology('wanderaround');
    //$json_scene = get_post_meta($scene_id,'vrodos_scene_json_input',true);
    $scene_name = $scene_post->post_name;
    $scene_title = $scene_post->post_title;
    $scene_desc = get_post_meta($scene_id, 'vrodos_scene_caption', true); //$scene_post->post_content;

    $featured_image_edu_sprite_id = get_post_thumbnail_id( $scene_id );//The Featured Image ID
    $featured_image_edu_sprite_guid = 'dad02368a81759f4784c7dbe752b05d6';//if there's no Featured Image
    if($featured_image_edu_sprite_id != ''){$featured_image_edu_sprite_guid = vrodos_compile_sprite_upload($featured_image_edu_sprite_id,$gameSlug,$scene_id);}

    $file_contentA = vrodos_replace_wonderaround_unity($term_meta_wonder_around,$scene_id); //empty energy scene with Avatar!
    $fileA = $game_path . '/' . $scene_name . '.unity';
    $create_fileA = fopen($fileA, "w") or die("Unable to open file!");
    fwrite($create_fileA, $file_contentA);
    fclose($create_fileA);

    vrodos_compile_append_scene_to_s_selector($scene_id, $scene_name, $scene_title, $scene_desc, $scene_type_ID,
         $game_path, $scenes_counter, $featured_image_edu_sprite_guid, $gameType);

    $fileApath_forCS = 'Assets/scenes/' . $scene_name . '.unity';
    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,$fileApath_forCS);//Update the EditorBuildSettings.asset by adding new Scene
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $fileApath_forCS);
}



//==========================================================================================================================================
//==========================================================================================================================================

function vrodos_replace_wonderaround_unity($term_meta_wonder_around, $scene_id){

    $scene_json = get_post($scene_id)->post_content;

    $jsonScene = htmlspecialchars_decode ( $scene_json );
    $sceneJsonARR = json_decode($jsonScene, TRUE);

    foreach ($sceneJsonARR['objects'] as $key => $value ) {
        if ($key == 'avatarCamera') {
            $x_pos = - $value['position'][0]; // x is in the opposite site in unity
            $y_pos = $value['position'][1];
            $z_pos = $value['position'][2];

            // In FPV: Chemistry, Archaeology we have two quaternions (player around y only, firstpersonchar around x only)
            // In RTS: Windenergy we have one quaternion

            $x_player_rot = $value['quaternion_player'][0];
            $y_player_rot = $value['quaternion_player'][1];
            $z_player_rot = $value['quaternion_player'][2];
            $w_player_rot = $value['quaternion_player'][3];

            $x_camera_rot = $value['quaternion_camera'][0];
            $y_camera_rot = $value['quaternion_camera'][1];
            $z_camera_rot = $value['quaternion_camera'][2];
            $w_camera_rot = $value['quaternion_camera'][3];

        }
    }
    $file_content_return = str_replace("___[player_position_x]___",$x_pos,$term_meta_wonder_around);
    $file_content_return = str_replace("___[player_position_y]___",$y_pos,$file_content_return);
    $file_content_return = str_replace("___[player_position_z]___",$z_pos,$file_content_return);

    $file_content_return = str_replace("___[player_rotation_x]___",$x_player_rot,$file_content_return);
    $file_content_return = str_replace("___[player_rotation_y]___",$y_player_rot,$file_content_return);
    $file_content_return = str_replace("___[player_rotation_z]___",$z_player_rot,$file_content_return);
    $file_content_return = str_replace("___[player_rotation_w]___",$w_player_rot,$file_content_return);

    $file_content_return = str_replace("___[camera_rotation_x]___", $x_camera_rot, $file_content_return);
    $file_content_return = str_replace("___[camera_rotation_y]___", $y_camera_rot, $file_content_return);
    $file_content_return = str_replace("___[camera_rotation_z]___", $z_camera_rot, $file_content_return);
    $file_content_return = str_replace("___[camera_rotation_w]___", $w_camera_rot, $file_content_return);


    return $file_content_return;
}

function vrodos_replace_decoration_arch_unity($decorarch_yaml,$decor_fid,$decor_obj_guid,$decor_pos_x,$decor_pos_y,
                                               $decor_pos_z,$decor_rot_x,$decor_rot_y,$decor_rot_z,$decor_rot_w,
                                               $decor_scale_x,$decor_scale_y,$decor_scale_z,$decor_title){

    $file_content_return = str_replace("___[decor_fid]___",$decor_fid,$decorarch_yaml);
    $file_content_return = str_replace("___[decor_obj_guid]___",$decor_obj_guid,$file_content_return);
    $file_content_return = str_replace("___[decor_pos_x]___",$decor_pos_x,$file_content_return);
    $file_content_return = str_replace("___[decor_pos_y]___",$decor_pos_y,$file_content_return);
    $file_content_return = str_replace("___[decor_pos_z]___",$decor_pos_z,$file_content_return);
    $file_content_return = str_replace("___[decor_rot_x]___",$decor_rot_x,$file_content_return);
    $file_content_return = str_replace("___[decor_rot_y]___",$decor_rot_y,$file_content_return);
    $file_content_return = str_replace("___[decor_rot_z]___",$decor_rot_z,$file_content_return);
    $file_content_return = str_replace("___[decor_rot_w]___",$decor_rot_w,$file_content_return);
    $file_content_return = str_replace("___[decor_scale_x]___",$decor_scale_x,$file_content_return);
    $file_content_return = str_replace("___[decor_scale_y]___",$decor_scale_y,$file_content_return);
    $file_content_return = str_replace("___[decor_scale_z]___",$decor_scale_z,$file_content_return);
    $file_content_return = str_replace("___[decor_title]___",$decor_title,$file_content_return);

    return $file_content_return;
}

function vrodos_replace_artifact_unity($artifact_yaml, $poi_a_fid, $poi_a_pos_x, $poi_a_pos_y, $poi_a_pos_z, $poi_a_rot_x,
                                        $poi_a_rot_y,$poi_a_rot_z,$poi_a_rot_w,$poi_a_scale_x,$poi_a_scale_y,
                                        $poi_a_scale_z,$poi_a_title,$poi_a_transform_fid,$poi_a_obj_fid,$poi_a_obj_guid, $poi_a_text,
                                        $poi_a_isreward){

    $file_content_return = str_replace("___[poi_a_fid]___",$poi_a_fid,$artifact_yaml);
    $file_content_return = str_replace("___[poi_a_pos_x]___",$poi_a_pos_x,$file_content_return);
    $file_content_return = str_replace("___[poi_a_pos_y]___",$poi_a_pos_y,$file_content_return);
    $file_content_return = str_replace("___[poi_a_pos_z]___",$poi_a_pos_z,$file_content_return);
    $file_content_return = str_replace("___[poi_a_rot_x]___",$poi_a_rot_x,$file_content_return);
    $file_content_return = str_replace("___[poi_a_rot_y]___",$poi_a_rot_y,$file_content_return);
    $file_content_return = str_replace("___[poi_a_rot_z]___",$poi_a_rot_z,$file_content_return);
    $file_content_return = str_replace("___[poi_a_rot_w]___",$poi_a_rot_w,$file_content_return);
    $file_content_return = str_replace("___[poi_a_scale_x]___",$poi_a_scale_x,$file_content_return);
    $file_content_return = str_replace("___[poi_a_scale_y]___",$poi_a_scale_y,$file_content_return);
    $file_content_return = str_replace("___[poi_a_scale_z]___",$poi_a_scale_z,$file_content_return);
    $file_content_return = str_replace("___[poi_a_title]___",$poi_a_title,$file_content_return);
    $file_content_return = str_replace("___[poi_a_transform_fid]___",$poi_a_transform_fid,$file_content_return);
    $file_content_return = str_replace("___[poi_a_obj_fid]___",$poi_a_obj_fid,$file_content_return);
    $file_content_return = str_replace("___[poi_a_obj_guid]___",$poi_a_obj_guid,$file_content_return);
    $file_content_return = str_replace("___[poi_a_text]___",  json_encode($poi_a_text, JSON_UNESCAPED_SLASHES), $file_content_return);
    $file_content_return = str_replace("___[poi_a_isreward]___", $poi_a_isreward , $file_content_return);

    $ff = fopen("output_title.txt","a");
    fwrite($ff, $poi_a_title);
    fclose($ff);
    
    return $file_content_return;
}

function vrodos_replace_door_unity($door_yaml,$door_fid,$door_pos_x,$door_pos_y,$door_pos_z,$door_rot_x,$door_rot_y,$door_rot_z,
                                    $door_rot_w,$door_scale_x,$door_scale_y,$door_scale_z,
                                    $door_title,
                                    $door_scene_arrival,$door_door_arrival,$door_transform_fid,$door_obj_fid,$door_guid, $door_isreward){

    $file_content_return = str_replace("___[door_fid]___",$door_fid,$door_yaml);
    $file_content_return = str_replace("___[door_pos_x]___",$door_pos_x,$file_content_return);
    $file_content_return = str_replace("___[door_pos_y]___",$door_pos_y,$file_content_return);
    $file_content_return = str_replace("___[door_pos_z]___",$door_pos_z,$file_content_return);
    $file_content_return = str_replace("___[door_rot_x]___",$door_rot_x,$file_content_return);
    $file_content_return = str_replace("___[door_rot_y]___",$door_rot_y,$file_content_return);
    $file_content_return = str_replace("___[door_rot_z]___",$door_rot_z,$file_content_return);
    $file_content_return = str_replace("___[door_rot_w]___",$door_rot_w,$file_content_return);
    $file_content_return = str_replace("___[door_scale_x]___",$door_scale_x,$file_content_return);
    $file_content_return = str_replace("___[door_scale_y]___",$door_scale_y,$file_content_return);
    $file_content_return = str_replace("___[door_scale_z]___",$door_scale_z,$file_content_return);
    $file_content_return = str_replace("___[door_title]___", $door_title, $file_content_return);
    $file_content_return = str_replace("___[door_scene_arrival]___",$door_scene_arrival,$file_content_return);
    $file_content_return = str_replace("___[door_door_arrival]___",$door_door_arrival,$file_content_return);
    
    $file_content_return = str_replace("___[door_isreward]___", $door_isreward, $file_content_return);
    
    $file_content_return = str_replace("___[door_transform_fid]___",$door_transform_fid,$file_content_return);
    $file_content_return = str_replace("___[door_obj_fid]___",$door_obj_fid,$file_content_return);
    $file_content_return = str_replace("___[door_guid]___",$door_guid,$file_content_return);

    return $file_content_return;
}

function vrodos_replace_poi_vid_unity($poi_vid_yaml,$poi_v_fid,$poi_v_pos_x,$poi_v_pos_y,$poi_v_pos_z,$poi_v_rot_x,$poi_v_rot_y,$poi_v_rot_z,
                                       $poi_v_rot_w,$poi_v_scale_x,$poi_v_scale_y,$poi_v_scale_z,$poi_v_title,$poi_v_trans_fid,
                                       $poi_v_obj_fid,$poi_v_obj_guid,$poi_v_v_name, $poi_v_v_url, $poi_v_isreward){

    $file_content_return = str_replace("___[poi_v_fid]___",$poi_v_fid,$poi_vid_yaml);
    $file_content_return = str_replace("___[poi_v_pos_x]___",$poi_v_pos_x,$file_content_return);
    $file_content_return = str_replace("___[poi_v_pos_y]___",$poi_v_pos_y,$file_content_return);
    $file_content_return = str_replace("___[poi_v_pos_z]___",$poi_v_pos_z,$file_content_return);
    $file_content_return = str_replace("___[poi_v_rot_x]___",$poi_v_rot_x,$file_content_return);
    $file_content_return = str_replace("___[poi_v_rot_y]___",$poi_v_rot_y,$file_content_return);
    $file_content_return = str_replace("___[poi_v_rot_z]___",$poi_v_rot_z,$file_content_return);
    $file_content_return = str_replace("___[poi_v_rot_w]___",$poi_v_rot_w,$file_content_return);
    $file_content_return = str_replace("___[poi_v_scale_x]___",$poi_v_scale_x,$file_content_return);
    $file_content_return = str_replace("___[poi_v_scale_y]___",$poi_v_scale_y,$file_content_return);
    $file_content_return = str_replace("___[poi_v_scale_z]___",$poi_v_scale_z,$file_content_return);
    $file_content_return = str_replace("___[poi_v_title]___",$poi_v_title,$file_content_return);
    $file_content_return = str_replace("___[poi_v_trans_fid]___",$poi_v_trans_fid,$file_content_return);
    $file_content_return = str_replace("___[poi_v_obj_fid]___",$poi_v_obj_fid,$file_content_return);
    $file_content_return = str_replace("___[poi_v_obj_guid]___",$poi_v_obj_guid,$file_content_return);
    $file_content_return = str_replace("___[poi_v_v_name]___",$poi_v_v_name,$file_content_return);
    $file_content_return = str_replace("___[poi_v_v_url]___",$poi_v_v_url,$file_content_return);
    
    $file_content_return = str_replace("___[poi_v_isreward]___", $poi_v_isreward, $file_content_return);

    return $file_content_return;
}

function vrodos_replace_poi_img_unity($poi_img_yaml,$poi_it_fid,
                                       $poi_it_pos_x,$poi_it_pos_y,$poi_it_pos_z,$poi_it_rot_x,$poi_it_rot_y,$poi_it_rot_z,$poi_it_rot_w,
                                       $poi_it_scale_x,$poi_it_scale_y,$poi_it_scale_z,
                                       $poi_it_title,$poi_it_sprite_name,
                                       $poi_it_text,$poi_it_connector_fid,$poi_it_obj_fid,$poi_it_obj_guid, $poi_it_isreward){

    $file_content_return = str_replace("___[poi_it_fid]___",$poi_it_fid,$poi_img_yaml);
    $file_content_return = str_replace("___[poi_it_pos_x]___",$poi_it_pos_x,$file_content_return);
    $file_content_return = str_replace("___[poi_it_pos_y]___",$poi_it_pos_y,$file_content_return);
    $file_content_return = str_replace("___[poi_it_pos_z]___",$poi_it_pos_z,$file_content_return);
    $file_content_return = str_replace("___[poi_it_rot_x]___",$poi_it_rot_x,$file_content_return);
    $file_content_return = str_replace("___[poi_it_rot_y]___",$poi_it_rot_y,$file_content_return);
    $file_content_return = str_replace("___[poi_it_rot_z]___",$poi_it_rot_z,$file_content_return);
    $file_content_return = str_replace("___[poi_it_rot_w]___",$poi_it_rot_w,$file_content_return);
    $file_content_return = str_replace("___[poi_it_scale_x]___",$poi_it_scale_x,$file_content_return);
    $file_content_return = str_replace("___[poi_it_scale_y]___",$poi_it_scale_y,$file_content_return);
    $file_content_return = str_replace("___[poi_it_scale_z]___",$poi_it_scale_z,$file_content_return);
    $file_content_return = str_replace("___[poi_it_title]___",$poi_it_title,$file_content_return);
    $file_content_return = str_replace("___[poi_it_sprite_name]___",$poi_it_sprite_name,$file_content_return);
    $file_content_return = str_replace("___[poi_it_text]___",$poi_it_text,$file_content_return);
    
    $file_content_return = str_replace("___[poi_it_isreward]___",$poi_it_isreward,$file_content_return);
    
    $file_content_return = str_replace("___[poi_it_connector_fid]___",$poi_it_connector_fid,$file_content_return);
    $file_content_return = str_replace("___[poi_it_obj_fid]___",$poi_it_obj_fid,$file_content_return);
    $file_content_return = str_replace("___[poi_it_obj_guid]___",$poi_it_obj_guid,$file_content_return);

    return $file_content_return;
}

function vrodos_replace_site_unity($site_yaml,$site_fid,$site_obj_guid,$site_position_x,$site_position_y,$site_position_z,$site_rotation_x,$site_rotation_y,$site_rotation_z,$site_rotation_w,$site_scale_x,$site_scale_y,$site_scale_z,$site_title){
    $file_content_return = str_replace("___[site_fid]___",$site_fid,$site_yaml);
    $file_content_return = str_replace("___[site_obj_guid]___",$site_obj_guid,$file_content_return);
    $file_content_return = str_replace("___[site_position_x]___",$site_position_x,$file_content_return);
    $file_content_return = str_replace("___[site_position_y]___",$site_position_y,$file_content_return);
    $file_content_return = str_replace("___[site_position_z]___",$site_position_z,$file_content_return);
    $file_content_return = str_replace("___[site_rotation_x]___",$site_rotation_x,$file_content_return);
    $file_content_return = str_replace("___[site_rotation_y]___",$site_rotation_y,$file_content_return);
    $file_content_return = str_replace("___[site_rotation_z]___",$site_rotation_z,$file_content_return);
    $file_content_return = str_replace("___[site_rotation_w]___",$site_rotation_w,$file_content_return);
    $file_content_return = str_replace("___[site_scale_x]___",$site_scale_x,$file_content_return);
    $file_content_return = str_replace("___[site_scale_y]___",$site_scale_y,$file_content_return);
    $file_content_return = str_replace("___[site_scale_z]___",$site_scale_z,$file_content_return);
    $file_content_return = str_replace("___[site_title]___",$site_title,$file_content_return);

    return $file_content_return;
}

?>
