<?php

function vrodos_create_chemistry_selector_unity($gameID,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file){

}

function vrodos_create_chemistry_mainmenu_unity($scene_post,$scene_type_ID,$scene_id,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file){
    //DATA of mainmenu
    $term_meta_s_mainmenu = vrodos_getSceneYAML_chemistry('menu');
    $title_text = $scene_post->post_title;

    //$is_bt_settings_active = intval ( get_post_meta($scene_id,'vrodos_menu_has_options',true) ); //Future Addition to Yaml
    //$is_login_bt_active = intval ( get_post_meta($scene_id,'vrodos_menu_has_login',true) ); //Future Addition to Yaml
    //$is_help_bt_active = intval ( get_post_meta($scene_id,'vrodos_menu_has_help',true) ); //Future Addition to Yaml
    $is_bt_settings_active = 0; //Always OFF
    $is_help_bt_active = 1; //Always ON
    $is_login_bt_active = 1; //Always ON
    $is_exit_button_active = 1;  //Always ON

    $featured_image_sprite_id = get_post_thumbnail_id( $scene_id );//The Featured Image ID
    $featured_image_sprite_guid = 'dad02368a81759f4784c7dbe752b05d6';//if there's no Featured Image

    if($featured_image_sprite_id != ''){
        $featured_image_sprite_guid = vrodos_compile_sprite_upload($featured_image_sprite_id, $gameSlug, $scene_id);
    }

    $file_content = vrodos_replace_mainmenu_chem_unity($term_meta_s_mainmenu,$title_text,$featured_image_sprite_guid,$is_bt_settings_active,$is_help_bt_active,$is_exit_button_active,$is_login_bt_active);

    $file = $game_path . '/' . 'S_MainMenu.unity';
    $create_file = fopen($file, "w") or die("Unable to open file!");
    fwrite($create_file, $file_content);
    fclose($create_file);
    
    //Add Static Pages to cs & BuildSettings (Main Menu must be first)
    //vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Reward.unity');//Update the EditorBuildSettings.asset by adding new Scene
    //$file_path_rewCS = 'Assets/scenes/' . 'S_Reward.unity';
    //vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file_path_rewCS);

    //vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_SceneSelector.unity');//Update the EditorBuildSettings.asset by adding new Scene
    //$file_path_selCS = 'Assets/scenes/' . 'S_SceneSelector.unity';
    //vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file_path_selCS);

    if($is_bt_settings_active == '1'){
        //CREATE SETTINGS/OPTIONS Unity file
        $term_meta_s_settings = vrodos_getSceneYAML_chemistry('settings');
        $file_content2 = vrodos_replace_settings_chem_unity($term_meta_s_settings);

        $file2 = $game_path . '/' . 'S_Settings.unity';
        $create_file2 = fopen($file2, "w") or die("Unable to open file!");
        fwrite($create_file2,$file_content2);
        fclose($create_file2);

        vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Settings.unity');//Update the EditorBuildSettings.asset by adding new Scene
        $file2_path_CS = 'Assets/scenes/' . 'S_Settings.unity';
        vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file2_path_CS);
    }

    if($is_help_bt_active == '1'){
        //CREATE HELP Unity file
        $term_meta_s_help = vrodos_getSceneYAML_chemistry('help');
        $text_help_scene = get_post_meta($scene_id,'vrodos_scene_help_text',true);
        $img_help_scene_id = get_post_meta($scene_id,'vrodos_scene_helpimg',true);
        $img_help_scene_guid = 'dad02368a81759f4784c7dbe752b05d6'; //if there's no Featured Image (custom field at Main Menu)
        $imgbg_help_scene_guid = 'dad02368a81759f4784c7dbe752b05d6';
        if($img_help_scene_id != ''){$img_help_scene_guid = vrodos_compile_sprite_upload($img_help_scene_id,$gameSlug,$scene_id);}
        $file_content3 = vrodos_replace_help_chem_unity($term_meta_s_help,$text_help_scene,$img_help_scene_guid,$imgbg_help_scene_guid);

        $file3 = $game_path . '/' . 'S_Help.unity';
        $create_file3 = fopen($file3, "w") or die("Unable to open file!");
        fwrite($create_file3, $file_content3);
        fclose($create_file3);

        vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Help.unity');//Update the EditorBuildSettings.asset by adding new Scene
        $file3_path_CS = 'Assets/scenes/' . 'S_Help.unity';
        vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file3_path_CS);
    }

    if($is_login_bt_active == '1'){
        //CREATE Login Unity file
        $term_meta_s_login = vrodos_getSceneYAML_chemistry('login');
        $WanderAroundScene_title = 'S_Lab';

        $file_content4 = vrodos_replace_login_chem_unity($term_meta_s_login,$WanderAroundScene_title,$gameSlug);

        $file4 = $game_path . '/S_Login.unity';
        $create_file4 = fopen($file4, "w") or die("Unable to open file!");
        fwrite($create_file4,$file_content4);
        fclose($create_file4);

        vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Login.unity');//Update the EditorBuildSettings.asset by adding new Scene
        $file4_path_CS = 'Assets/scenes/' . 'S_Login.unity';
        vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file4_path_CS);
    }


}

function vrodos_create_chemistry_credentials_unity($scene_post,$scene_type_ID,$scene_id,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file){
    //DATA of Credits Scene
    $term_meta_s_credits = vrodos_getSceneYAML_chemistry('credits');
    $credits_content = $scene_post->post_content;

    $featured_image_sprite_id = get_post_thumbnail_id( $scene_id );//The Featured Image ID
    $featured_image_sprite_guid = 'dad02368a81759f4784c7dbe752b05d6'; //if there's no Featured Image

    $background_image_sprite_guid = 'dad02368a81759f4784c7dbe752b05d6'; //there's no Background Image

    if($featured_image_sprite_id != ''){$featured_image_sprite_guid = vrodos_compile_sprite_upload($featured_image_sprite_id,$gameSlug,$scene_id);}
    $file_content5 = vrodos_replace_creditsscene_chem_unity($term_meta_s_credits,$credits_content,$featured_image_sprite_guid,$background_image_sprite_guid);

    $file5 = $game_path . '/' . 'S_Credits.unity';
    $create_file5 = fopen($file5, "w") or die("Unable to open file!");
    fwrite($create_file5, $file_content5);
    fclose($create_file5);

    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Credits.unity');//Update the EditorBuildSettings.asset by adding new Scene
    $file5_path_CS = 'Assets/scenes/' . 'S_Credits.unity';
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file5_path_CS);
}

function vrodos_create_chemistry_exam2d_unity($scene_post,$scene_type_ID,$scene_id,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file,$scenes_counter,$gameType){

    $exam_slug = $scene_post->post_name;

    $term_meta_exam2d_chem = vrodos_getSceneYAML_chemistry('exam2d');
    $file_contentA = vrodos_replace_chemistry_exam2D_unity($term_meta_exam2d_chem,$gameSlug);

    $fileA = $game_path . '/' . $exam_slug . '.unity';
    $create_fileA = fopen($fileA, "w") or die("Unable to open file!");
    fwrite($create_fileA, $file_contentA);
    fclose($create_fileA);

    $fileApath_forCS = 'Assets/scenes/' . $exam_slug . '.unity';
    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,$fileApath_forCS);//Update the EditorBuildSettings.asset by adding new Scene
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $fileApath_forCS);
}

function vrodos_create_chemistry_exam3d_unity($scene_post,$scene_type_ID,$scene_id,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file,$scenes_counter,$gameType){

    $exam_slug = $scene_post->post_name;

    $term_meta_exam3d_chem = vrodos_getSceneYAML_chemistry('exam3d');
    $file_contentA = vrodos_replace_chemistry_exam3D_unity($term_meta_exam3d_chem,$gameSlug);

    $fileA = $game_path . '/' . $exam_slug . '.unity';
    $create_fileA = fopen($fileA, "w") or die("Unable to open file!");
    fwrite($create_fileA, $file_contentA);
    fclose($create_fileA);

    $fileApath_forCS = 'Assets/scenes/' . $exam_slug . '.unity';
    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,$fileApath_forCS);//Update the EditorBuildSettings.asset by adding new Scene
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $fileApath_forCS);

}

function vrodos_create_chemistry_lab_unity($scene_post,$scene_type_ID,$scene_id,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file,$scenes_counter,$gameType){
    //DATA of Chemistry Wander Around Scene
    $term_meta_wander_around_chem = vrodos_getSceneYAML_chemistry('lab');
    $scene_name = $scene_post->post_name;
    $scene_title = $scene_post->post_title;
    $scene_desc = $scene_post->post_content;

    $featured_image_edu_sprite_id = get_post_thumbnail_id( $scene_id );//The Featured Image ID
    $featured_image_edu_sprite_guid = 'dad02368a81759f4784c7dbe752b05d6';//if there's no Featured Image
    if($featured_image_edu_sprite_id != ''){$featured_image_edu_sprite_guid = vrodos_compile_sprite_upload($featured_image_edu_sprite_id,$gameSlug,$scene_id);}


    $file_contentA = vrodos_replace_chemistry_lab_unity($term_meta_wander_around_chem,$scene_id); //empty energy scene with Avatar!
    $file_contentAb = vrodos_addAssets_chemistry_lab_unity($scene_id);//add objects from json
    //$fileA = $game_path . '/' . $scene_name . '.unity';
    $fileA = $game_path . '/' . 'S_Lab' . '.unity';
    $create_fileA = fopen($fileA, "w") or die("Unable to open file!");
    fwrite($create_fileA, $file_contentA);
    fwrite($create_fileA,$file_contentAb);
    fclose($create_fileA);

    $fileApath_forCS = 'Assets/scenes/' . /*$scene_name*/'S_Lab' . '.unity';
    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,$fileApath_forCS);//Update the EditorBuildSettings.asset by adding new Scene
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $fileApath_forCS);

}

function vrodos_addAssets_chemistry_lab_unity($scene_id){
    $scene_json = get_post($scene_id)->post_content;

    $jsonScene = htmlspecialchars_decode ( $scene_json );
    $sceneJsonARR = json_decode($jsonScene, TRUE);

    $current_fid = 51;
    $allObjectsYAML = '';
    $LF = chr(10) ;// line break

    foreach ($sceneJsonARR['objects'] as $key => $value ) {
        if ($key == 'avatarCamera') {
            //do something about AVATAR
        } else {
            if ($value['categoryName'] == 'Room') {

                $room_id = $value['assetid'];
                $asset_type = get_the_terms( $room_id, 'vrodos_asset3d_cat' );
                $asset_type_ID = $asset_type[0]->term_id;

                $room_obj = get_post_meta($room_id,'vrodos_asset3d_obj',true);

                $room_yaml = vrodos_getAssetYAML_chemistry('room');
                $room_fid = vrodos_create_fids($current_fid++);
                $room_mesh_fid = vrodos_create_fids($current_fid++); //($room_fid+1)
                $room_mesh_collider_fid = vrodos_create_fids($current_fid++); // ($room_fid+2)
                $room_obj_guid =  vrodos_create_guids('obj', $room_obj);
                $room_position_x = - $value['position'][0]; // x is in the opposite site in unity
                $room_position_y = $value['position'][1];
                $room_position_z = $value['position'][2];
                $room_rotation_x = $value['quaternion'][0];
                $room_rotation_y = $value['quaternion'][1];
                $room_rotation_z = $value['quaternion'][2];
                $room_rotation_w = $value['quaternion'][3];
                $room_scale_x = $value['scale'][0];
                $room_scale_y = $value['scale'][1];
                $room_scale_z = $value['scale'][2];
                $room_title = get_the_title($room_id);

                $room_finalyaml = vrodos_replace_room_unity($room_yaml,$room_fid,$room_mesh_fid,$room_mesh_collider_fid,$room_obj_guid,$room_position_x,$room_position_y,$room_position_z,$room_rotation_x,$room_rotation_y,$room_rotation_z,$room_rotation_w,$room_scale_x,$room_scale_y,$room_scale_z,$room_title);
                $allObjectsYAML = $allObjectsYAML . $LF . $room_finalyaml;
            }

            if ($value['categoryName'] == 'Gate') {

                $gate_id = $value['assetid'];
                $asset_type = get_the_terms( $gate_id, 'vrodos_asset3d_cat' );
                $asset_type_ID = $asset_type[0]->term_id;

                $gate_obj = get_post_meta($gate_id,'vrodos_asset3d_obj',true);

                $gate_yaml = vrodos_getAssetYAML_chemistry('gate');
                $gate_fid = vrodos_create_fids($current_fid++);
                $gate_mesh_fid = vrodos_create_fids($current_fid++);//($gate_fid+1)
                $gate_mesh_collider_fid = vrodos_create_fids($current_fid++);//($gate_fid+2)
                $gate_fid4 = vrodos_create_fids($current_fid++);
                $gate_fid5 = vrodos_create_fids($current_fid++);
                $gate_obj_guid = vrodos_create_guids('obj', $gate_obj);
                $gate_position_x = - $value['position'][0]; // x is in the opposite site in unity
                $gate_position_y = $value['position'][1];
                $gate_position_z = $value['position'][2];
                $gate_rotation_x = $value['quaternion'][0];
                $gate_rotation_y = $value['quaternion'][1];
                $gate_rotation_z = $value['quaternion'][2];
                $gate_rotation_w = $value['quaternion'][3];
                $gate_scale_x = $value['scale'][0];
                $gate_scale_y = $value['scale'][1];
                $gate_scale_z = $value['scale'][2];
                $gate_targetID = $value['sceneID_target'];
                $gate_type = get_the_terms( $gate_targetID, 'vrodos_scene_yaml' );
                $gate_type_slug = $gate_type[0]->slug;//We changed the Main Menu unity name so we have to check and replace
                $interactable_value = '0';//temp values
                $scoreManager_Fid = '0';//temp values

                $targetScene_id = $value['sceneID_target'];
                $target_post = get_post($targetScene_id);
                $target_post_slug = $target_post->post_name;

                if($gate_type_slug == 'mainmenu-chem-yaml'){
                    $moleculeNamingScene_fid = 'S_MainMenu';
                    $interactable_value = '2';
                    $scoreManager_Fid = '0'; //'1599989332634340';
                }elseif($gate_type_slug == 'exam2d-chem-yaml') {
                    $moleculeNamingScene_fid = $target_post_slug;
                    $interactable_value = '0';
                    $scoreManager_Fid = '0';
                }elseif($gate_type_slug == 'exam3d-chem-yaml') {
                    $moleculeNamingScene_fid = $target_post_slug;
                    $interactable_value = '1';
                    $scoreManager_Fid = '0';
                }else{
                    $moleculeNamingScene_fid = $target_post_slug;
                }

                $gate_finalyaml = vrodos_replace_gate_unity2($gate_yaml,$gate_fid,$gate_mesh_fid,$gate_mesh_collider_fid,$gate_obj_guid,$gate_position_x,$gate_position_y,$gate_position_z,$gate_rotation_x,$gate_rotation_y,$gate_rotation_z,$gate_rotation_w,$gate_scale_x,$gate_scale_y,$gate_scale_z,$moleculeNamingScene_fid,$interactable_value,$scoreManager_Fid,$gate_fid4,$gate_fid5);

                //$gate_finalyaml = vrodos_replace_gate_unity($gate_yaml,$gate_fid,$gate_mesh_fid,$gate_mesh_collider_fid,$gate_obj_guid,$gate_position_x,$gate_position_y,$gate_position_z,$gate_rotation_x,$gate_rotation_y,$gate_rotation_z,$gate_rotation_w,$gate_scale_x,$gate_scale_y,$gate_scale_z,$moleculeNamingScene_fid);
                $allObjectsYAML = $allObjectsYAML . $LF . $gate_finalyaml;
            }
        }
    }

    //return all objects
    return $allObjectsYAML;
}


//==========================================================================================================================================
//==========================================================================================================================================

function vrodos_replace_mainmenu_chem_unity($term_meta_s_mainmenu,$title_text,$featured_image_sprite_guid,$is_bt_settings_active,$is_help_bt_active,$is_exit_button_active,$is_login_bt_active){
    $file_content_return = str_replace("___[mainmenu_featured_image_sprite]___",$featured_image_sprite_guid,$term_meta_s_mainmenu);
    //$file_content_return = str_replace("___[mainmenu_title_text]___",$title_text,$file_content_return);
    //$file_content_return = str_replace("___[mainmenu_is_bt_settings_active]___",$is_bt_settings_active,$file_content_return);
    //$file_content_return = str_replace("___[mainmenu_is_help_bt_active]___",$is_help_bt_active,$file_content_return);
    //$file_content_return = str_replace("___[mainmenu_is_exit_button_active]___",$is_exit_button_active,$file_content_return);
    //$file_content_return = str_replace("___[mainmenu_is_login_bt_active]___",$is_login_bt_active,$file_content_return);

    return $file_content_return;

}

function vrodos_replace_creditsscene_chem_unity($term_meta_s_credits,$credits_content,$featured_image_sprite_guid,$background_image_sprite_guid){
    $file_content_return = str_replace("___[text_credits_scene]___",$credits_content,$term_meta_s_credits);
    $file_content_return = str_replace("___[img_credits_scene]___",$featured_image_sprite_guid,$file_content_return);
    $file_content_return = str_replace("___[imgbg_credits_scene]___",$background_image_sprite_guid,$file_content_return);

    return $file_content_return;
}

function vrodos_replace_settings_chem_unity($term_meta_s_settings){
    return $term_meta_s_settings;
}

function vrodos_replace_help_chem_unity($term_meta_s_help,$text_help_scene,$img_help_scene_guid,$imgbg_help_scene_guid){
    $file_content_return = str_replace("___[text_help_scene]___",$text_help_scene,$term_meta_s_help);
    $file_content_return = str_replace("___[img_help_scene]___",$img_help_scene_guid,$file_content_return);
    $file_content_return = str_replace("___[imgbg_help_scene]___",$imgbg_help_scene_guid,$file_content_return);

    return $file_content_return;
}

function vrodos_replace_login_chem_unity($term_meta_s_login,$WanderAroundScene_title,$gameSlug){
    $available_Molecules = vrodos_replace_chemistry_exam_AvailableMolecules($gameSlug);
    $defaul_strategy = vrodos_replace_chemistry_exam_defaulStrategy($gameSlug);

    $file_content_return = str_replace("___[WanderAroundScene]___",$WanderAroundScene_title,$term_meta_s_login);
    $file_content_return = str_replace("___[available_Molecules]___",$available_Molecules,$file_content_return);
    $file_content_return = str_replace("___[defaul_strategy]___",$defaul_strategy,$file_content_return);

    return $file_content_return;
}

function vrodos_replace_chemistry_lab_unity($term_meta_wander_around_chem,$scene_id){

    $scene_json = get_post($scene_id)->post_content;

    $jsonScene = htmlspecialchars_decode ( $scene_json );
    $sceneJsonARR = json_decode($jsonScene, TRUE);

    foreach ($sceneJsonARR['objects'] as $key => $value ) {
        if ($key == 'avatarCamera') {
            $x_pos = - $value['position'][0]; // x is in the opposite site in unity
            $y_pos = $value['position'][1];
            $z_pos = $value['position'][2];
            $x_player_rot = $value['quaternion_player'][0];
            $y_player_rot = $value['quaternion_player'][1];
            $z_player_rot = $value['quaternion_player'][2];
            $w_player_rot = $value['quaternion_player'][3];
        }
    }
    $file_content_return = str_replace("___[player_position_x]___",$x_pos,$term_meta_wander_around_chem);
    $file_content_return = str_replace("___[player_position_y]___",$y_pos,$file_content_return);
    $file_content_return = str_replace("___[player_position_z]___",$z_pos,$file_content_return);

    $file_content_return = str_replace("___[player_rotation_x]___",$x_player_rot,$file_content_return);
    $file_content_return = str_replace("___[player_rotation_y]___",$y_player_rot,$file_content_return);
    $file_content_return = str_replace("___[player_rotation_z]___",$z_player_rot,$file_content_return);
    $file_content_return = str_replace("___[player_rotation_w]___",$w_player_rot,$file_content_return);

    return $file_content_return;

}

function vrodos_replace_chemistry_exam2D_unity($term_meta_exam2d_chem,$gameSlug){

//    $available_Molecules = vrodos_replace_chemistry_exam_AvailableMolecules($gameSlug);
//    $defaul_strategy = vrodos_replace_chemistry_exam_defaulStrategy($gameSlug);
//
//    $file_content_return = str_replace("___[available_Molecules]___",$available_Molecules,$term_meta_exam2d_chem);
//    $file_content_return = str_replace("___[defaul_strategy]___",$defaul_strategy,$file_content_return);
    $file_content_return = $term_meta_exam2d_chem;

    return $file_content_return;

}

function vrodos_replace_chemistry_exam_AvailableMolecules($gameSlug){
    /* 4 kena:
    - name: ___[mole_formula_name]___
        formula: ___[mole_formula_type]___
     */

    $args = array(
        'name'        => $gameSlug,
        'post_type'   => 'vrodos_game',
        'post_status' => 'publish',
        'numberposts' => 1
    );
    $my_post = get_posts($args);
    $project_id = $my_post[0]->ID;

    $availableMole = '';
    $savedMoleculesVal = get_post_meta($project_id, 'vrodos_exam_enabled_molecules',true);//The enabled molecules for Exams
    $savedMoleculesVal = json_decode($savedMoleculesVal);

    $count = 0;
    foreach ($savedMoleculesVal as $moleculeID) {
        $moleName = get_the_title( $moleculeID );
    
        $moleName[0] = strtoupper($moleName[0]);
        
        $mole_type = get_post_meta($moleculeID, 'vrodos_molecule_ChemicalTypeVal', true);
        $firstLine = '- name: ' . $moleName;
        $secondLine = str_repeat(' ', 4) . 'formula: ' . $mole_type;
        if($count==0){$availableMole .= $firstLine . PHP_EOL;} // line change;
        else{$availableMole .= str_repeat(' ', 2) . $firstLine . PHP_EOL;} // line change;
        $availableMole .= $secondLine . PHP_EOL; // line change;
        $count++;
    }

    return $availableMole;
}

function vrodos_replace_chemistry_exam_defaulStrategy($gameSlug){
    /*
    - ___[mole_formula_type]___
    */

    $args = array(
        'name'        => $gameSlug,
        'post_type'   => 'vrodos_game',
        'post_status' => 'publish',
        'numberposts' => 1
    );
    $my_post = get_posts($args);
    $project_id = $my_post[0]->ID;

    $defaulStrategy = '';
    $savedMoleculesVal = get_post_meta($project_id, 'vrodos_exam_enabled_molecules',true);//The enabled molecules for Exams
    $savedMoleculesVal = json_decode($savedMoleculesVal);

    $count = 0;
    foreach ($savedMoleculesVal as $moleculeID) {
        $mole_type = get_post_meta($moleculeID, 'vrodos_molecule_ChemicalTypeVal', true);
        if($count==0){$secondLine = '- ' . $mole_type;}
        else{$secondLine = str_repeat(' ', 2) . '- ' . $mole_type;}
        $defaulStrategy .= $secondLine . PHP_EOL; // line change;
        $count++;
    }
    return $defaulStrategy;
}

function vrodos_replace_chemistry_exam_molePrefabs($gameSlug){
    /*
    - {fileID: ___[prefab_fileId]___, guid: ___[prefab_guid]___, type: 2}
    */

    $args = array(
        'name'        => $gameSlug,
        'post_type'   => 'vrodos_game',
        'post_status' => 'publish',
        'numberposts' => 1
    );
    $my_post = get_posts($args);
    $project_id = $my_post[0]->ID;

    $molePrefabs = '';
    $savedMoleculesVal = get_post_meta($project_id, 'vrodos_exam_enabled_molecules',true);//The enabled molecules for Exams
    $savedMoleculesVal = json_decode($savedMoleculesVal);
    $count = 0;
    foreach ($savedMoleculesVal as $moleculeID) {
        $mole_pref = $moleculeID . '9';
        $mole_pref = str_pad($mole_pref, 32 , "0", STR_PAD_LEFT);
        $mole_pref_id = $moleculeID . '941';
        $mole_pref_id = str_pad($mole_pref_id, 32 , "0", STR_PAD_LEFT);
        if($count==0){$secondLine = '- {fileID: ' . $mole_pref_id . ', guid: ' . $mole_pref . ', type: 2}';}
        else{$secondLine = str_repeat(' ', 2) . '- {fileID: ' . $mole_pref_id . ', guid: ' . $mole_pref . ', type: 2}';}
        $molePrefabs .= $secondLine . PHP_EOL; // line change;
        $count++;
    }

    return $molePrefabs;
}

function vrodos_replace_chemistry_exam3D_unity($term_meta_exam3d_chem,$gameSlug){

    //$available_Molecules = vrodos_replace_chemistry_exam_AvailableMolecules($gameSlug);
    //$defaul_strategy = vrodos_replace_chemistry_exam_defaulStrategy($gameSlug);
    $molecule_prefabs = vrodos_replace_chemistry_exam_molePrefabs($gameSlug);

    $file_content_return = str_replace("___[molecule_prefabs]___",$molecule_prefabs,$term_meta_exam3d_chem);
    //$file_content_return = str_replace("___[available_Molecules]___",$available_Molecules,$file_content_return);
    //$file_content_return = str_replace("___[defaul_strategy]___",$defaul_strategy,$file_content_return);

    return $file_content_return;

}

function vrodos_replace_room_unity($room_yaml,$room_fid,$room_mesh_fid,$room_mesh_collider_fid,$room_obj_guid,$room_position_x,$room_position_y,$room_position_z,$room_rotation_x,$room_rotation_y,$room_rotation_z,$room_rotation_w,$room_scale_x,$room_scale_y,$room_scale_z,$room_title){
    $file_content_return = str_replace("___[room_fid]___",$room_fid,$room_yaml);
    $file_content_return = str_replace("___[room_mesh_fid]___",$room_mesh_fid,$file_content_return);
    $file_content_return = str_replace("___[room_mesh_collider_fid]___",$room_mesh_collider_fid,$file_content_return);
    $file_content_return = str_replace("___[room_obj_guid]___",$room_obj_guid,$file_content_return);
    $file_content_return = str_replace("___[room_position_x]___",$room_position_x,$file_content_return);
    $file_content_return = str_replace("___[room_position_y]___",$room_position_y,$file_content_return);
    $file_content_return = str_replace("___[room_position_z]___",$room_position_z,$file_content_return);
    $file_content_return = str_replace("___[room_rotation_x]___",$room_rotation_x,$file_content_return);
    $file_content_return = str_replace("___[room_rotation_y]___",$room_rotation_y,$file_content_return);
    $file_content_return = str_replace("___[room_rotation_z]___",$room_rotation_z,$file_content_return);
    $file_content_return = str_replace("___[room_rotation_w]___",$room_rotation_w,$file_content_return);
    $file_content_return = str_replace("___[room_scale_x]___",$room_scale_x,$file_content_return);
    $file_content_return = str_replace("___[room_scale_y]___",$room_scale_y,$file_content_return);
    $file_content_return = str_replace("___[room_scale_z]___",$room_scale_z,$file_content_return);
    $file_content_return = str_replace("___[room_title]___",$room_title,$file_content_return);

    return $file_content_return;
}

function vrodos_replace_gate_unity($gate_yaml,$gate_fid,$gate_mesh_fid,$gate_mesh_collider_fid,$gate_obj_guid,$gate_position_x,$gate_position_y,$gate_position_z,$gate_rotation_x,$gate_rotation_y,$gate_rotation_z,$gate_rotation_w,$gate_scale_x,$gate_scale_y,$gate_scale_z,$moleculeNamingScene_fid){
    $file_content_return = str_replace("___[gate_fid]___",$gate_fid,$gate_yaml);
    $file_content_return = str_replace("___[gate_mesh_fid]___",$gate_mesh_fid,$file_content_return);
    $file_content_return = str_replace("___[gate_mesh_collider_fid]___",$gate_mesh_collider_fid,$file_content_return);
    $file_content_return = str_replace("___[gate_obj_guid]___",$gate_obj_guid,$file_content_return);
    $file_content_return = str_replace("___[gate_position_x]___",$gate_position_x,$file_content_return);
    $file_content_return = str_replace("___[gate_position_y]___",$gate_position_y,$file_content_return);
    $file_content_return = str_replace("___[gate_position_z]___",$gate_position_z,$file_content_return);
    $file_content_return = str_replace("___[gate_rotation_x]___",$gate_rotation_x,$file_content_return);
    $file_content_return = str_replace("___[gate_rotation_y]___",$gate_rotation_y,$file_content_return);
    $file_content_return = str_replace("___[gate_rotation_z]___",$gate_rotation_z,$file_content_return);
    $file_content_return = str_replace("___[gate_rotation_w]___",$gate_rotation_w,$file_content_return);
    $file_content_return = str_replace("___[gate_scale_x]___",$gate_scale_x,$file_content_return);
    $file_content_return = str_replace("___[gate_scale_y]___",$gate_scale_y,$file_content_return);
    $file_content_return = str_replace("___[gate_scale_z]___",$gate_scale_z,$file_content_return);
    $file_content_return = str_replace("___[moleculeNamingScene_fid]___",$moleculeNamingScene_fid,$file_content_return);

    return $file_content_return;

}

function vrodos_replace_gate_unity2($gate_yaml,$gate_fid,$gate_mesh_fid,$gate_mesh_collider_fid,$gate_obj_guid,$gate_position_x,$gate_position_y,$gate_position_z,$gate_rotation_x,$gate_rotation_y,$gate_rotation_z,$gate_rotation_w,$gate_scale_x,$gate_scale_y,$gate_scale_z,$moleculeNamingScene_fid,$interactable_value,$scoreManager_Fid,$gate_fid4,$gate_fid5){
    $file_content_return = str_replace("___[gate_fid]___",$gate_fid,$gate_yaml);
    $file_content_return = str_replace("___[gate_fid4]___",$gate_fid4,$file_content_return);
    $file_content_return = str_replace("___[gate_fid5]___",$gate_fid5,$file_content_return);
    $file_content_return = str_replace("___[gate_mesh_fid]___",$gate_mesh_fid,$file_content_return);
    $file_content_return = str_replace("___[gate_mesh_collider_fid]___",$gate_mesh_collider_fid,$file_content_return);
    $file_content_return = str_replace("___[gate_obj_guid]___",$gate_obj_guid,$file_content_return);
    $file_content_return = str_replace("___[gate_position_x]___",$gate_position_x,$file_content_return);
    $file_content_return = str_replace("___[gate_position_y]___",$gate_position_y,$file_content_return);
    $file_content_return = str_replace("___[gate_position_z]___",$gate_position_z,$file_content_return);
    $file_content_return = str_replace("___[gate_rotation_x]___",$gate_rotation_x,$file_content_return);
    $file_content_return = str_replace("___[gate_rotation_y]___",$gate_rotation_y,$file_content_return);
    $file_content_return = str_replace("___[gate_rotation_z]___",$gate_rotation_z,$file_content_return);
    $file_content_return = str_replace("___[gate_rotation_w]___",$gate_rotation_w,$file_content_return);
    $file_content_return = str_replace("___[gate_scale_x]___",$gate_scale_x,$file_content_return);
    $file_content_return = str_replace("___[gate_scale_y]___",$gate_scale_y,$file_content_return);
    $file_content_return = str_replace("___[gate_scale_z]___",$gate_scale_z,$file_content_return);
    $file_content_return = str_replace("___[Scene_To_Load]___",$moleculeNamingScene_fid,$file_content_return);
    $file_content_return = str_replace("___[interactable_value]___",$interactable_value,$file_content_return);
    $file_content_return = str_replace("___[scoreManager_Fid]___",$scoreManager_Fid,$file_content_return);

    return $file_content_return;
}


function vrodos_replace_molecule_unity(){}

?>
