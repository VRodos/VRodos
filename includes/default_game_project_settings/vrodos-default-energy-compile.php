<?php

function vrodos_create_energy_standardScenes_unity($gameID,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file){
    

    //SIMULATION SCENE FIELDS
    $term_meta_simuFields = vrodos_getSceneYAML_energy('fields');
    $file_simuFields = $game_path . '/' . 'Stage3(Plains).unity';
    $create_file1 = fopen($file_simuFields, "w") or die("Unable to open file!");
    fwrite($create_file1, $term_meta_simuFields);
    fclose($create_file1);

    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/Stage3(Plains).unity');//Update the EditorBuildSettings.asset by adding new Scene
    $file_path_selCS = 'Assets/scenes/' . 'Stage3(Plains).unity';
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file_path_selCS);

    //SIMULATION SCENE MOUNTAINS
    $term_meta_simuMount = vrodos_getSceneYAML_energy('mountains');
    $file_simuMount = $game_path . '/' . 'Stage3(Mountains).unity';
    $create_file2 = fopen($file_simuMount, "w") or die("Unable to open file!");
    fwrite($create_file2, $term_meta_simuMount);
    fclose($create_file2);

    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/Stage3(Mountains).unity');//Update the EditorBuildSettings.asset by adding new Scene
    $file_path_selCS = 'Assets/scenes/' . 'Stage3(Mountains).unity';
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file_path_selCS);

    //SIMULATION SCENE FIELDS
    $term_meta_simuSea = vrodos_getSceneYAML_energy('seashore');
    $file_simuSea = $game_path . '/' . 'Stage3(Seashore).unity';
    $create_file3 = fopen($file_simuSea, "w") or die("Unable to open file!");
    fwrite($create_file3, $term_meta_simuSea);
    fclose($create_file3);

    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/Stage3(Seashore).unity');//Update the EditorBuildSettings.asset by adding new Scene
    $file_path_selCS = 'Assets/scenes/' . 'Stage3(Seashore).unity';
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file_path_selCS);


    //SIMULATION SCENE STATS
    $term_meta_stats = vrodos_getSceneYAML_energy('stats');
    $file_Stats = $game_path . '/' . 'S_Stats.unity';
    $create_file4 = fopen($file_Stats, "w") or die("Unable to open file!");
    fwrite($create_file4, $term_meta_stats);
    fclose($create_file4);

    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Stats.unity');//Update the EditorBuildSettings.asset by adding new Scene
    $file_path_selCS = 'Assets/scenes/' . 'S_Stats.unity';
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file_path_selCS);


    //SIMULATION SCENE TURBINE SELECTION
    $term_meta_turb = vrodos_getSceneYAML_energy('turbines');
    $file_turb = $game_path . '/' . 'S_TurbineSelection.unity';
    $create_file5 = fopen($file_turb, "w") or die("Unable to open file!");
    fwrite($create_file5, $term_meta_turb);
    fclose($create_file5);

    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_TurbineSelection.unity');//Update the EditorBuildSettings.asset by adding new Scene
    $file_path_selCS = 'Assets/scenes/' . 'S_TurbineSelection.unity';
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file_path_selCS);

}

function vrodos_getRegionalscene_byGame($parent_project_id_as_term_id,$regType){

    $myquery_args = array(
        'post_type' => 'vrodos_scene',
        'posts_per_page' => -1,
        'tax_query' => array(
            array(
                'taxonomy' => 'vrodos_scene_pgame',
                'field'    => 'term_id',
                'terms'    => $parent_project_id_as_term_id,
            ),
        ),
        'meta_query' => array(
            array(
                'key'     => 'vrodos_scene_environment',
                'value'   => $regType,
                'compare' => 'IN',
            ),
        'orderby' => 'ID',
        'order' => 'DESC',
        )
    );

    $custom_query = new WP_Query( $myquery_args );

    if ( $custom_query->have_posts() ) :
        while ( $custom_query->have_posts() ) :
            $custom_query->the_post();
            $scene_id = get_the_ID();
        endwhile;
    endif;
    wp_reset_query();

    //vrodos_scene_environment

    return $scene_id;
}


function vrodos_create_energy_selector_unity($gameID,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file){
    $mountains_activation = 0;
    $seashore_activation = 0;
    $fields_activation = 0;
    $allScenePGame = get_term_by('slug', $gameSlug, 'vrodos_scene_pgame');
    $parent_project_id_as_term_id = $allScenePGame->term_id;

    $mount_id = vrodos_getRegionalscene_byGame($parent_project_id_as_term_id,'mountain');
    $fields_id = vrodos_getRegionalscene_byGame($parent_project_id_as_term_id,'fields');
    $sea_id = vrodos_getRegionalscene_byGame($parent_project_id_as_term_id,'seashore');

    $mount_json = get_post($mount_id)->post_content; //,'vrodos_scene_json_input',true);
    $fields_json = get_post($fields_id)->post_content; //,'vrodos_scene_json_input',true);
    $sea_json = get_post($sea_id)->content; //,'vrodos_scene_json_input',true);

    
    
    if(vrodos_countEnergyMarkers($mount_json)){$mountains_activation = 1;}
    if(vrodos_countEnergyMarkers($fields_json)){$fields_activation = 1;}
    if(vrodos_countEnergyMarkers($sea_json)){$seashore_activation = 1;}
    
//    $fo = fopen("output_energy_scenes.txt","w");
//    fwrite($fo, "Mount" . $mountains_activation);
//    fwrite($fo, "\n");
//    fwrite($fo, "Fields" . $fields_activation);
//    fwrite($fo, "\n");
//    fwrite($fo, "Sea" . $seashore_activation);
//    fclose($fo);
    
    $term_meta_s_selector = vrodos_getSceneYAML_energy('selector');
    $file_selector = $game_path . '/' . 'S_SceneSelector.unity';
    $file_content = vrodos_replace_sceneselector_energy_unity($term_meta_s_selector,$mountains_activation,$seashore_activation,$fields_activation);
    $create_file2 = fopen($file_selector, "w") or die("Unable to open file!");
    fwrite($create_file2, $file_content);
    fclose($create_file2);

    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_SceneSelector.unity');//Update the EditorBuildSettings.asset by adding new Scene
    $file_path_selCS = 'Assets/scenes/' . 'S_SceneSelector.unity';
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file_path_selCS);
}

function vrodos_create_energy_mainmenu_unity($scene_post,$scene_type_ID,$scene_id,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file){
    //DATA of mainmenu
    $term_meta_s_mainmenu = vrodos_getSceneYAML_energy('menu');

    //$is_bt_settings_active = intval ( get_post_meta($scene_id,'vrodos_menu_has_options',true) );
    //$is_help_bt_active = intval ( get_post_meta($scene_id,'vrodos_menu_has_help',true) );
    //$is_login_bt_active = intval ( get_post_meta($scene_id,'vrodos_menu_has_login',true) );

    $is_bt_settings_active = 0;//Always OFF
    $is_help_bt_active = 1;//Always ON
    $is_login_bt_active = 1;//Always ON

    $featured_image_sprite_id = get_post_thumbnail_id( $scene_id );//The Featured Image ID
    $featured_image_sprite_guid = 'dad02368a81759f4784c7dbe752b05d6';//if there's no Featured Image

    if($featured_image_sprite_id != ''){
        $featured_image_sprite_guid = vrodos_compile_sprite_upload($featured_image_sprite_id, $gameSlug, $scene_id);
    }

    $file_content = vrodos_replace_mainmenu_energy_unity($term_meta_s_mainmenu,$featured_image_sprite_guid);

    $file = $game_path . '/' . 'S_MainMenu.unity';
    $create_file = fopen($file, "w") or die("Unable to open file!");
    fwrite($create_file, $file_content);
    fclose($create_file);

    //Add Static Pages to cs & BuildSettings (Main Menu must be first)
    //vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Reward.unity');//Update the EditorBuildSettings.asset by adding new Scene
    //$file_path_rewCS = 'Assets/scenes/' . 'S_Reward.unity';
    //vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file_path_rewCS);

    if($is_bt_settings_active == '1'){
        //CREATE SETTINGS/OPTIONS Unity file
        $term_meta_s_settings = vrodos_getSceneYAML_energy('settings');
        $file_content2 = vrodos_replace_settings_unity($term_meta_s_settings);

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
        $term_meta_s_help = vrodos_getSceneYAML_energy('help');
        $text_help_scene = get_post_meta($scene_id,'vrodos_scene_help_text',true);
        $img_help_scene_id = get_post_meta($scene_id,'vrodos_scene_helpimg',true);
        $img_help_scene_guid = 'dad02368a81759f4784c7dbe752b05d6'; //if there's no Featured Image (custom field at Main Menu)
        if($img_help_scene_id != ''){$img_help_scene_guid = vrodos_compile_sprite_upload($img_help_scene_id,$gameSlug,$scene_id);}
        $file_content3 = vrodos_replace_help_energy_unity($term_meta_s_help,$text_help_scene,$img_help_scene_guid);

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
        $term_meta_s_login = vrodos_getSceneYAML_energy('login');
        $file_content4 = vrodos_replace_login_energy_unity($term_meta_s_login);

        $file4 = $game_path . '/S_Login.unity';
        $create_file4 = fopen($file4, "w") or die("Unable to open file!");
        fwrite($create_file4,$file_content4);
        fclose($create_file4);

        vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Login.unity');//Update the EditorBuildSettings.asset by adding new Scene
        $file4_path_CS = 'Assets/scenes/' . 'S_Login.unity';
        vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file4_path_CS);
    }
}

function vrodos_create_energy_credentials_unity($scene_post,$scene_type_ID,$scene_id,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file){
    //DATA of Credits Scene
    $term_meta_s_credits = vrodos_getSceneYAML_energy('credits');
    $credits_content = $scene_post->post_content;

    $featured_image_sprite_id = get_post_thumbnail_id( $scene_id );//The Featured Image ID
    $featured_image_sprite_guid = 'dad02368a81759f4784c7dbe752b05d6'; //if there's no Featured Image
    if($featured_image_sprite_id != ''){$featured_image_sprite_guid = vrodos_compile_sprite_upload($featured_image_sprite_id,$gameSlug,$scene_id);}
    $file_content5 = vrodos_replace_creditsscene_energy_unity($term_meta_s_credits,$credits_content,$featured_image_sprite_guid);

    $file5 = $game_path . '/' . 'S_Credits.unity';
    $create_file5 = fopen($file5, "w") or die("Unable to open file!");
    fwrite($create_file5, $file_content5);
    fclose($create_file5);

    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,'Assets/scenes/S_Credits.unity');//Update the EditorBuildSettings.asset by adding new Scene
    $file5_path_CS = 'Assets/scenes/' . 'S_Credits.unity';
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file5_path_CS);
}

function vrodos_create_energy_educational_unity($scene_post,$scene_type_ID,$scene_id,$gameSlug,$game_path,$fileEditorBuildSettings,$handybuilder_file,$scenes_counter,$gameType){

//    $fg = fopen("output_edu_energy.txt","w");
//
//    fwrite($fg, "1");
    
    //DATA of Educational Energy Scene
    $term_meta_educational_energy = vrodos_getSceneYAML_energy('regional');
    $scene_name = $scene_post->post_name;
    $scene_title = $scene_post->post_title;
    $scene_desc = $scene_post->post_content;
    
//    fwrite($fg, "2");
    
    //S_Mountains, S_Fields, S_Seashore fixed unity filenames
    $scene_env = get_post_meta($scene_id,'vrodos_scene_environment',true);
    $scene_unity_title = 'S_Mountains';
    if($scene_env == 'seashore'){$scene_unity_title = 'S_Seashore';}
    if($scene_env == 'fields'){$scene_unity_title = 'S_Fields';}
    
//    fwrite($fg, "3");

    $featured_image_edu_sprite_id = get_post_thumbnail_id( $scene_id );//The Featured Image ID
    $featured_image_edu_sprite_guid = 'dad02368a81759f4784c7dbe752b05d6';//if there's no Featured Image
    if($featured_image_edu_sprite_id != ''){$featured_image_edu_sprite_guid =
        vrodos_compile_sprite_upload($featured_image_edu_sprite_id, $gameSlug, $scene_id);}
    
//    fwrite($fg, "4");
    
    $file_content7 = vrodos_replace_educational_energy_unity($term_meta_educational_energy,$scene_id); //empty energy scene with Avatar!
    
//    fwrite($fg, "5");

//    fwrite($fg, "\n");
//    fwrite($fg, $scene_id);
    
    
    $file_content7b = vrodos_addAssets_educational_energy_unity($scene_id);//add objects from json
    
//    fwrite($fg, "6");
    
    $file7 = $game_path . '/' . $scene_unity_title . '.unity';
    $create_file7 = fopen($file7, "w") or die("Unable to open file!");
    
//    fwrite($fg, "7");
    
    fwrite($create_file7, $file_content7);
    fwrite($create_file7,$file_content7b);
    fclose($create_file7);
    
//    fwrite($fg, "8");

    $file7path_forCS = 'Assets/scenes/' . $scene_unity_title . '.unity';
    vrodos_append_scenes_in_EditorBuildSettings_dot_asset($fileEditorBuildSettings,$file7path_forCS);//Update the EditorBuildSettings.asset by adding new Scene
    vrodos_add_in_HandyBuilder_cs($handybuilder_file, null, $file7path_forCS);
    
//    fwrite($fg, "success");
//    fclose($fg);
}

function vrodos_addAssets_educational_energy_unity($scene_id){

//    $ff = fopen("output_assets_edu.txt","w");

    
    
    $scene_json = get_post($scene_id)->post_content; //,'vrodos_scene_json_input',true);
    
    
    //fwrite($ff, print_r($scene_json));
    
    $jsonScene = htmlspecialchars_decode ( $scene_json );
    
    
    $sceneJsonARR = json_decode($jsonScene, TRUE);
    
    //fwrite($ff, print_r($sceneJsonARR,true));
    
    $current_fid = 51;
    $allObjectsYAML = '';
    $LF = chr(10) ;// line break
    
    //fwrite($ff, "2");
    
    
    
    foreach ($sceneJsonARR['objects'] as $key => $value ) {
        if ($key == 'avatarYawObject') {
            //do something about AVATAR
        }else{
    
//            fwrite($ff, "3:");
//            fwrite($ff, $value['categoryName']);
//
            
            if ($value['categoryName'] == 'Terrain'){
    
                
                $terrain_id = $value['assetid'];
                $asset_type = get_the_terms( $terrain_id, 'vrodos_asset3d_cat' );
                $asset_type_ID = $asset_type[0]->term_id;
                $terrain_obj = get_post_meta($terrain_id,'vrodos_asset3d_obj',true);

                $terrain_yaml = vrodos_getAssetYAML_energy('terrain');
                $fid_of_terrain = vrodos_create_fids($current_fid++);
                $fid_of_terrain1 = vrodos_create_fids($current_fid++);//($fid_of_terrain+1)
                $fid_of_terrain2 = vrodos_create_fids($current_fid++);//($fid_of_terrain+2)
                $guid_terrain_mesh = vrodos_create_guids('obj', $terrain_obj);
                $x_pos_terrain = - $value['position'][0]; // x is in the opposite site in unity
                $y_pos_terrain = $value['position'][1];
                $z_pos_terrain = $value['position'][2];
    
//                fwrite($ff, "32:");
//                fwrite($ff,  print_r($value, true));
//                //$quats = transform_minusx_radiansToquaternions($value['rotation'][0], $value['rotation'][1], $value['rotation'][2]);

                $x_rotation_terrain = $value['quaternion'][0]; // $quats[0]; //$value['quaternion'][0];
                $y_rotation_terrain = $value['quaternion'][1]; //$quats[1]; //$value['quaternion'][1];
                $z_rotation_terrain = $value['quaternion'][2]; //$quats[2]; //$value['quaternion'][2];
                $w_rotation_terrain = $value['quaternion'][3]; //$quats[3]; //$value['quaternion'][3];
                $x_scale_terrain = $value['scale'][0];
                $y_scale_terrain = $value['scale'][1];
                $z_scale_terrain = $value['scale'][2];
    
      //          fwrite($ff, "33:");
                
                $terrain_finalyaml = vrodos_replace_terrain_unity($terrain_yaml,$fid_of_terrain,$fid_of_terrain1,$fid_of_terrain2,$guid_terrain_mesh,$x_pos_terrain,$y_pos_terrain,$z_pos_terrain,$x_rotation_terrain,$y_rotation_terrain,$z_rotation_terrain,$w_rotation_terrain,$x_scale_terrain,$y_scale_terrain,$z_scale_terrain);
                $allObjectsYAML = $allObjectsYAML . $LF . $terrain_finalyaml;
    
//                fwrite($ff, "34:");
//
//                fwrite($ff, "4");
            }
            if ($value['categoryName'] == 'Decoration'){
                $deco_id = $value['assetid'];
                $asset_type = get_the_terms( $deco_id, 'vrodos_asset3d_cat' );
                $asset_type_ID = $asset_type[0]->term_id;
                $deco_obj = get_post_meta($deco_id,'vrodos_asset3d_obj',true);

                $deco_yaml = vrodos_getAssetYAML_energy('decor');
                $fid_decorator = vrodos_create_fids($current_fid++);
                $fid_decorator1 = vrodos_create_fids($current_fid++);//($fid_decorator+1)
                $fid_decorator2 = vrodos_create_fids($current_fid++);//($fid_decorator+2)
                $guid_obj_decorator = vrodos_create_guids('obj', $deco_obj);
                $x_pos_decorator = - $value['position'][0]; // x is in the opposite site in unity
                $y_pos_decorator = $value['position'][1];
                $z_pos_decorator = $value['position'][2];
                $x_rotation_decorator = $value['quaternion'][0];
                $y_rotation_decorator = $value['quaternion'][1];
                $z_rotation_decorator = $value['quaternion'][2];
                $w_rotation_decorator = $value['quaternion'][3];
                $x_scale_decorator = $value['scale'][0];
                $y_scale_decorator = $value['scale'][1];
                $z_scale_decorator = $value['scale'][2];

                $deco_finalyaml = vrodos_replace_decorator_unity($deco_yaml,$fid_decorator,$fid_decorator1,$fid_decorator2,$guid_obj_decorator,$x_pos_decorator,$y_pos_decorator,$z_pos_decorator,$x_rotation_decorator,$y_rotation_decorator,$z_rotation_decorator,$w_rotation_decorator,$x_scale_decorator,$y_scale_decorator,$z_scale_decorator);
                $allObjectsYAML = $allObjectsYAML . $LF . $deco_finalyaml;
    
                //fwrite($ff, "5");
            }
            if ($value['categoryName'] == 'Marker'){
                $marker_id = $value['assetid'];
                $asset_type = get_the_terms( $marker_id, 'vrodos_asset3d_cat' );
                $asset_type_ID = $asset_type[0]->term_id;
                $marker_obj = get_post_meta($marker_id,'vrodos_asset3d_obj',true);

                $marker_yaml = vrodos_getAssetYAML_energy('marker');
                $fid_marker = vrodos_create_fids($current_fid++);
                $fid_marker1 = vrodos_create_fids($current_fid++);//($fid_marker+1)
                $fid_marker2 = vrodos_create_fids($current_fid++);//($fid_marker+2)
                $fid_marker3 = vrodos_create_fids($current_fid++);//($fid_marker+3)
                $guid_obj_marker = vrodos_create_guids('obj', $marker_obj);
                $x_pos_marker = - $value['position'][0]; // x is in the opposite site in unity
                $y_pos_marker = $value['position'][1];
                $z_pos_marker = $value['position'][2];
                $x_rotation_marker = $value['quaternion'][0];
                $y_rotation_marker = $value['quaternion'][1];
                $z_rotation_marker = $value['quaternion'][2];
                $w_rotation_marker = $value['quaternion'][3];
                $x_scale_marker = $value['scale'][0];
                $y_scale_marker = $value['scale'][1];
                $z_scale_marker = $value['scale'][2];

                $archaelogical_penalty = $value['archaeology_penalty'];
                $nature_penalty = $value['natural_penalty'];
                $HV_penalty = $value['hv_penalty'];

                $marker_finalyaml = vrodos_replace_marker_unity($marker_yaml,$fid_marker,$fid_marker1,$fid_marker2,$fid_marker3,$guid_obj_marker,$x_pos_marker,$y_pos_marker,$z_pos_marker,$x_rotation_marker,$y_rotation_marker,$z_rotation_marker,$w_rotation_marker,$x_scale_marker,$y_scale_marker,$z_scale_marker,$archaelogical_penalty,$nature_penalty,$HV_penalty);
                $allObjectsYAML = $allObjectsYAML . $LF . $marker_finalyaml;
    
    //            fwrite($ff, "6");
            }
            /*
            if ($value['categoryName'] == 'Consumer'){
                $consumer_id = $value['assetid'];
                $asset_type = get_the_terms( $consumer_id, 'vrodos_asset3d_cat' );
                $asset_type_ID = $asset_type[0]->term_id;

                $consumer_obj = get_post_meta($consumer_id,'vrodos_asset3d_obj',true);
                $consumer_yaml = get_term_meta($asset_type_ID,'vrodos_yamlmeta_assetcat_pat',true);
                $energy_consumption = get_post_meta($consumer_id,'vrodos_energyConsumption',true);

                $fid_prefab_consumer_parent = vrodos_create_fids($current_fid++);
                $x_pos_consumer = - $value['position'][0]; // x is in the opposite site in unity
                $y_pos_consumer = $value['position'][1];
                $z_pos_consumer = $value['position'][2];
                $x_rotation_consumer = $value['quaternion'][0];
                $y_rotation_consumer = $value['quaternion'][1];
                $z_rotation_consumer = $value['quaternion'][2];
                $w_rotation_consumer = $value['quaternion'][3];
                $name_consumer = get_the_title($consumer_id);
                $fid_consumer_prefab_transform = vrodos_create_fids($current_fid++);
                $fid_consumer_prefab_child = vrodos_create_fids($current_fid++);
                $guid_consumer_prefab_child_obj = vrodos_create_guids('obj', $consumer_obj);


                // REM STATHIS
                $mean_power_consumer = $energy_consumption['mean'];
                $var_power_consumer = $energy_consumption['var'];
                $min_power_consumer = $energy_consumption['min'];
                $max_power_consumer = $energy_consumption['max'];


                $consumer_finalyaml = vrodos_replace_consumer_unity($consumer_yaml,$fid_prefab_consumer_parent,$x_pos_consumer,$y_pos_consumer,
                    $z_pos_consumer,$x_rotation_consumer,$y_rotation_consumer,$z_rotation_consumer,$w_rotation_consumer,$name_consumer,$fid_consumer_prefab_transform,
                    $fid_consumer_prefab_child,$guid_consumer_prefab_child_obj,
                    $mean_power_consumer, $var_power_consumer, $min_power_consumer, $max_power_consumer);
                $allObjectsYAML = $allObjectsYAML . $LF . $consumer_finalyaml;
            }

            if ($value['categoryName'] == 'Producer'){
                $producer_id = $value['assetid'];
                $asset_type = get_the_terms( $producer_id, 'vrodos_asset3d_cat' );
                $asset_type_ID = $asset_type[0]->term_id;

                $producer_obj = get_post_meta($producer_id,'vrodos_asset3d_obj',true);
                $prod_optCosts = get_post_meta($producer_id,'vrodos_producerOptCosts',true);
                $prod_optGen = get_post_meta($producer_id,'vrodos_producerOptGen',true);
                $prod_powerVal = get_post_meta($producer_id,'vrodos_producerPowerProductionVal',true);
                $prod_powerVal = str_replace(array('[',']'), '',$prod_powerVal);//remove all [ ]
                $prod_powerVal_array = explode(',', $prod_powerVal);//create Array with values of string


                $producer_yaml = get_term_meta($asset_type_ID,'vrodos_yamlmeta_assetcat_pat',true);
                $fid_producer = vrodos_create_fids($current_fid++);
                $x_pos_producer = - $value['position'][0]; // x is in the opposite site in unity
                $y_pos_producer = $value['position'][1];
                $z_pos_producer = $value['position'][2];
                $x_rot_parent = $value['quaternion'][0];
                $y_rot_parent = $value['quaternion'][1];
                $z_rot_parent = $value['quaternion'][2];
                $w_rot_parent = $value['quaternion'][3];
                $rotor_diameter = $prod_optCosts['size'];
                $y_position_infoquad = $rotor_diameter * (1.5);
                $y_pos_quadselector = $rotor_diameter * (-0.95);
                $turbine_name_class = $prod_optGen['class'];
                $turbine_max_power = $prod_optGen['power'];
                $turbine_cost = $prod_optCosts['cost'];
                $rotor_diameter = $prod_optCosts['size'];
                $turbine_windspeed_class = $prod_optGen['speed'];
                $turbine_repair_cost = $prod_optCosts['repaid'];
                $turbine_damage_coefficient = $prod_optCosts['dmg'];
                $fid_transformation_parent_producer = vrodos_create_fids($current_fid++);
                $fid_child_producer = vrodos_create_fids($current_fid++);
                $obj_guid_producer = vrodos_create_guids('obj', $producer_obj);
                $producer_name = get_the_title($producer_id);
                $power_curve_val = $prod_powerVal_array;

                $producer_finalyaml = vrodos_replace_producer_unity($producer_yaml,$fid_producer,$x_pos_producer,$y_pos_producer,$z_pos_producer,$x_rot_parent,$y_rot_parent,$z_rot_parent,$w_rot_parent,$y_position_infoquad,$y_pos_quadselector,$turbine_name_class,$turbine_max_power,$turbine_cost,$rotor_diameter,$turbine_windspeed_class,$turbine_repair_cost,$turbine_damage_coefficient,$fid_transformation_parent_producer,$fid_child_producer,$obj_guid_producer,$producer_name,$power_curve_val);
                $allObjectsYAML = $allObjectsYAML . $LF . $producer_finalyaml;
            }
            */
        }
    }
    
//    fwrite($ff, "success");
//
//    fclose($ff);
    
    //return all objects
    return $allObjectsYAML;

}

//==========================================================================================================================================
//==========================================================================================================================================

function vrodos_replace_sceneselector_energy_unity($term_meta_s_selector,$mountains_activation,$seashore_activation,$fields_activation){
    $file_content_return = str_replace("___[mountains_activation]___",$mountains_activation,$term_meta_s_selector);
    $file_content_return = str_replace("___[seashore_activation]___",$seashore_activation,$file_content_return);
    $file_content_return = str_replace("___[fields_activation]___",$fields_activation,$file_content_return);

    return $file_content_return;
}

function vrodos_replace_mainmenu_energy_unity($term_meta_s_mainmenu,$featured_image_sprite_guid){
    $file_content_return = str_replace("___[mainmenu_featured_image_sprite]___",$featured_image_sprite_guid,$term_meta_s_mainmenu);

    return $file_content_return;
}

function vrodos_replace_creditsscene_energy_unity($term_meta_s_credits,$credits_content,$featured_image_sprite_guid){
    $file_content_return = str_replace("___[text_credits_scene]___",$credits_content,$term_meta_s_credits);
    $file_content_return = str_replace("___[img_credits_scene]___",$featured_image_sprite_guid,$file_content_return);

    return $file_content_return;
}

function vrodos_replace_help_energy_unity($term_meta_s_help,$text_help_scene,$img_help_scene_guid){
    $file_content_return = str_replace("___[text_help_scene]___",$text_help_scene,$term_meta_s_help);
    $file_content_return = str_replace("___[img_help_scene]___",$img_help_scene_guid,$file_content_return);

    return $file_content_return;
}

function vrodos_replace_login_energy_unity($term_meta_s_login){
    return $term_meta_s_login;
}

function vrodos_replace_educational_energy_unity($term_meta_educational_energy,$scene_id){

    $scene_json = get_post($scene_id)->post_content;//,'vrodos_scene_json_input',true);

    $jsonScene = htmlspecialchars_decode ( $scene_json );
    $sceneJsonARR = json_decode($jsonScene, TRUE);

    foreach ($sceneJsonARR['objects'] as $key => $value ) {
        if ($key == 'avatarYawObject') {
            $x_pos = - $value['position'][0]; // x is in the opposite site in unity
            $y_pos = $value['position'][1];
            $z_pos = $value['position'][2];
            $x_rot = $value['quaternion'][0];
            $y_rot = $value['quaternion'][1];
            $z_rot = $value['quaternion'][2];
            $w_rot = $value['quaternion'][3];
        }
    }
    $file_content_return = str_replace("___[camera_regional_position_x]___",$x_pos,$term_meta_educational_energy);
    $file_content_return = str_replace("___[camera_regional_position_y]___",$y_pos,$file_content_return);
    $file_content_return = str_replace("___[camera_regional_position_z]___",$z_pos,$file_content_return);
    $file_content_return = str_replace("___[camera_regional_rotation_x]___",$x_rot,$file_content_return);
    $file_content_return = str_replace("___[camera_regional_rotation_y]___",$y_rot,$file_content_return);
    $file_content_return = str_replace("___[camera_regional_rotation_z]___",$z_rot,$file_content_return);
    $file_content_return = str_replace("___[camera_regional_rotation_w]___",$w_rot,$file_content_return);
    return $file_content_return;
}

function vrodos_replace_terrain_unity($terrain_yaml,$fid_of_terrain,$fid_of_terrain1,$fid_of_terrain2,$guid_terrain_mesh,$x_pos_terrain,$y_pos_terrain,$z_pos_terrain,$x_rotation_terrain,$y_rotation_terrain,$z_rotation_terrain,$w_rotation_terrain,$x_scale_terrain,$y_scale_terrain,$z_scale_terrain){
    $file_content_return = str_replace("___[terrain_fid]___",$fid_of_terrain,$terrain_yaml);
    $file_content_return = str_replace("___[terrain_fid1]___",$fid_of_terrain1,$file_content_return);
    $file_content_return = str_replace("___[terrain_fid2]___",$fid_of_terrain2,$file_content_return);
    $file_content_return = str_replace("___[terrain_guid]___",$guid_terrain_mesh,$file_content_return);
    $file_content_return = str_replace("___[terrain_position_x]___",$x_pos_terrain,$file_content_return);
    $file_content_return = str_replace("___[terrain_position_y]___",$y_pos_terrain,$file_content_return);
    $file_content_return = str_replace("___[terrain_position_z]___",$z_pos_terrain,$file_content_return);
    $file_content_return = str_replace("___[terrain_rotation_x]___",$x_rotation_terrain,$file_content_return);
    $file_content_return = str_replace("___[terrain_rotation_y]___",$y_rotation_terrain,$file_content_return);
    $file_content_return = str_replace("___[terrain_rotation_z]___",$z_rotation_terrain,$file_content_return);
    $file_content_return = str_replace("___[terrain_rotation_w]___",$w_rotation_terrain,$file_content_return);
    $file_content_return = str_replace("___[terrain_scale_x]___",$x_scale_terrain,$file_content_return);
    $file_content_return = str_replace("___[terrain_scale_y]___",$y_scale_terrain,$file_content_return);
    $file_content_return = str_replace("___[terrain_scale_z]___",$z_scale_terrain,$file_content_return);

    return $file_content_return;
}

/*
function vrodos_replace_consumer_unity($consumer_yaml,$fid_prefab_consumer_parent,$x_pos_consumer,$y_pos_consumer,$z_pos_consumer,$x_rotation_consumer,$y_rotation_consumer,$z_rotation_consumer,$w_rotation_consumer,$name_consumer,$fid_consumer_prefab_transform,
                                        $fid_consumer_prefab_child,$guid_consumer_prefab_child_obj,
                                        $mean_power_consumer, $var_power_consumer, $min_power_consumer, $max_power_consumer){

    $file_content_return = str_replace("___[fid_prefab_consumer_parent]___",$fid_prefab_consumer_parent,$consumer_yaml);
    $file_content_return = str_replace("___[x_pos_consumer]___",$x_pos_consumer,$file_content_return);
    $file_content_return = str_replace("___[y_pos_consumer]___",$y_pos_consumer,$file_content_return);
    $file_content_return = str_replace("___[z_pos_consumer]___",$z_pos_consumer,$file_content_return);
    $file_content_return = str_replace("___[x_rotation_consumer]___",$x_rotation_consumer,$file_content_return);
    $file_content_return = str_replace("___[y_rotation_consumer]___",$y_rotation_consumer,$file_content_return);
    $file_content_return = str_replace("___[z_rotation_consumer]___",$z_rotation_consumer,$file_content_return);
    $file_content_return = str_replace("___[w_rotation_consumer]___",$w_rotation_consumer,$file_content_return);
    $file_content_return = str_replace("___[name_consumer]___",$name_consumer,$file_content_return);



    $file_content_return = str_replace("___[mean_power_consumer]___", $mean_power_consumer, $file_content_return);
    $file_content_return = str_replace("___[var_power_consumer]___", $var_power_consumer, $file_content_return);
    $file_content_return = str_replace("___[min_power_consumer]___", $min_power_consumer, $file_content_return);
    $file_content_return = str_replace("___[max_power_consumer]___", $max_power_consumer, $file_content_return);

    $file_content_return = str_replace("___[fid_consumer_prefab_transform]___",$fid_consumer_prefab_transform,$file_content_return);
    $file_content_return = str_replace("___[fid_consumer_prefab_child]___",$fid_consumer_prefab_child,$file_content_return);
    $file_content_return = str_replace("___[guid_consumer_prefab_child_obj]___",$guid_consumer_prefab_child_obj,$file_content_return);

    return $file_content_return;
}
*/

/*
function vrodos_replace_producer_unity($producer_yaml,$fid_producer,$x_pos_producer,$y_pos_producer,$z_pos_producer,$x_rot_parent,$y_rot_parent,$z_rot_parent,$w_rot_parent,$y_position_infoquad,$y_pos_quadselector,$turbine_name_class,$turbine_max_power,$turbine_cost,$rotor_diameter,$turbine_windspeed_class,$turbine_repair_cost,$turbine_damage_coefficient,$fid_transformation_parent_producer,$fid_child_producer,$obj_guid_producer,$producer_name,$power_curve_val){

    $file_content_return = str_replace("___[fid_producer]___",$fid_producer,$producer_yaml);
    $file_content_return = str_replace("___[x_pos_producer]___",$x_pos_producer,$file_content_return);
    $file_content_return = str_replace("___[y_pos_producer]___",$y_pos_producer,$file_content_return);
    $file_content_return = str_replace("___[z_pos_producer]___",$z_pos_producer,$file_content_return);
    $file_content_return = str_replace("___[x_rot_parent]___",$x_rot_parent,$file_content_return);
    $file_content_return = str_replace("___[y_rot_parent]___",$y_rot_parent,$file_content_return);
    $file_content_return = str_replace("___[z_rot_parent]___",$z_rot_parent,$file_content_return);
    $file_content_return = str_replace("___[w_rot_parent]___",$w_rot_parent,$file_content_return);
    $file_content_return = str_replace("___[y_position_infoquad]___",$y_position_infoquad,$file_content_return);
    $file_content_return = str_replace("___[y_pos_quadselector]___",$y_pos_quadselector,$file_content_return);
    $file_content_return = str_replace("___[turbine_name_class]___",$turbine_name_class,$file_content_return);
    $file_content_return = str_replace("___[turbine_max_power]___",$turbine_max_power,$file_content_return);
    $file_content_return = str_replace("___[turbine_cost]___",$turbine_cost,$file_content_return);
    $file_content_return = str_replace("___[rotor_diameter]___",$rotor_diameter,$file_content_return);
    $file_content_return = str_replace("___[turbine_windspeed_class]___",$turbine_windspeed_class,$file_content_return);
    $file_content_return = str_replace("___[turbine_repair_cost]___",$turbine_repair_cost,$file_content_return);
    $file_content_return = str_replace("___[turbine_damage_coefficient]___",$turbine_damage_coefficient,$file_content_return);
    $file_content_return = str_replace("___[fid_transformation_parent_producer]___",$fid_transformation_parent_producer,$file_content_return);
    $file_content_return = str_replace("___[fid_child_producer]___",$fid_child_producer,$file_content_return);
    $file_content_return = str_replace("___[obj_guid_producer]___",$obj_guid_producer,$file_content_return);
    $file_content_return = str_replace("___[producer_name]___",$producer_name,$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_0]___",$power_curve_val[1],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_1]___",$power_curve_val[3],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_2]___",$power_curve_val[5],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_3]___",$power_curve_val[7],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_4]___",$power_curve_val[9],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_5]___",$power_curve_val[11],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_6]___",$power_curve_val[13],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_7]___",$power_curve_val[15],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_8]___",$power_curve_val[17],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_9]___",$power_curve_val[19],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_10]___",$power_curve_val[21],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_11]___",$power_curve_val[23],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_12]___",$power_curve_val[25],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_13]___",$power_curve_val[27],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_14]___",$power_curve_val[29],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_15]___",$power_curve_val[31],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_16]___",$power_curve_val[33],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_17]___",$power_curve_val[35],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_18]___",$power_curve_val[37],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_19]___",$power_curve_val[39],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_20]___",$power_curve_val[41],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_21]___",$power_curve_val[43],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_22]___",$power_curve_val[45],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_23]___",$power_curve_val[47],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_24]___",$power_curve_val[49],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_25]___",$power_curve_val[51],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_26]___",$power_curve_val[53],$file_content_return);
    $file_content_return = str_replace("___[power_curve_val_27]___",$power_curve_val[55],$file_content_return);

    return $file_content_return;
}
*/

function vrodos_replace_marker_unity($marker_yaml,$fid_marker,$fid_marker1,$fid_marker2,$fid_marker3,$guid_obj_marker,$x_pos_marker,$y_pos_marker,$z_pos_marker,$x_rotation_marker,$y_rotation_marker,$z_rotation_marker,$w_rotation_marker,$x_scale_marker,$y_scale_marker,$z_scale_marker,$archaelogical_penalty,$nature_penalty,$HV_penalty){

    $file_content_return = str_replace("___[marker_fid]___",$fid_marker,$marker_yaml);
    $file_content_return = str_replace("___[marker_fid1]___",$fid_marker1,$file_content_return);
    $file_content_return = str_replace("___[marker_fid2]___",$fid_marker2,$file_content_return);
    $file_content_return = str_replace("___[marker_fid3]___",$fid_marker3,$file_content_return);
    $file_content_return = str_replace("___[marker_obj_guid]___",$guid_obj_marker,$file_content_return);
    $file_content_return = str_replace("___[marker_position_x]___",$x_pos_marker,$file_content_return);
    $file_content_return = str_replace("___[marker_position_y]___",$y_pos_marker,$file_content_return);
    $file_content_return = str_replace("___[marker_position_z]___",$z_pos_marker,$file_content_return);
    $file_content_return = str_replace("___[marker_rotation_x]___",$x_rotation_marker,$file_content_return);
    $file_content_return = str_replace("___[marker_rotation_y]___",$y_rotation_marker,$file_content_return);
    $file_content_return = str_replace("___[marker_rotation_z]___",$z_rotation_marker,$file_content_return);
    $file_content_return = str_replace("___[marker_rotation_w]___",$w_rotation_marker,$file_content_return);
    $file_content_return = str_replace("___[marker_scale_x]___",$x_scale_marker,$file_content_return);
    $file_content_return = str_replace("___[marker_scale_y]___",$y_scale_marker,$file_content_return);
    $file_content_return = str_replace("___[marker_scale_z]___",$z_scale_marker,$file_content_return);
    $file_content_return = str_replace("___[archaelogical_penalty]___",$archaelogical_penalty,$file_content_return);
    $file_content_return = str_replace("___[nature_penalty]___",$nature_penalty,$file_content_return);
    $file_content_return = str_replace("___[HV_penalty]___",$HV_penalty,$file_content_return);


    return $file_content_return;

}


function vrodos_replace_decorator_unity($deco_yaml,$fid_decorator,$fid_decorator1,$fid_decorator2,$guid_obj_decorator,$x_pos_decorator,$y_pos_decorator,$z_pos_decorator,$x_rotation_decorator,$y_rotation_decorator,$z_rotation_decorator,$w_rotation_decorator,$x_scale_decorator,$y_scale_decorator,$z_scale_decorator){
    $file_content_return = str_replace("___[decor_fid]___",$fid_decorator,$deco_yaml);
    $file_content_return = str_replace("___[decor_fid1]___",$fid_decorator1,$file_content_return);
    $file_content_return = str_replace("___[decor_fid2]___",$fid_decorator2,$file_content_return);
    $file_content_return = str_replace("___[decor_guid]___",$guid_obj_decorator,$file_content_return);
    $file_content_return = str_replace("___[decor_position_x]___",$x_pos_decorator,$file_content_return);
    $file_content_return = str_replace("___[decor_position_y]___",$y_pos_decorator,$file_content_return);
    $file_content_return = str_replace("___[decor_position_z]___",$z_pos_decorator,$file_content_return);
    $file_content_return = str_replace("___[decor_rotation_x]___",$x_rotation_decorator,$file_content_return);
    $file_content_return = str_replace("___[decor_rotation_y]___",$y_rotation_decorator,$file_content_return);
    $file_content_return = str_replace("___[decor_rotation_z]___",$z_rotation_decorator,$file_content_return);
    $file_content_return = str_replace("___[decor_rotation_w]___",$w_rotation_decorator,$file_content_return);
    $file_content_return = str_replace("___[decor_scale_x]___",$x_scale_decorator,$file_content_return);
    $file_content_return = str_replace("___[decor_scale_y]___",$y_scale_decorator,$file_content_return);
    $file_content_return = str_replace("___[decor_scale_z]___",$z_scale_decorator,$file_content_return);

    return $file_content_return;
}


?>
