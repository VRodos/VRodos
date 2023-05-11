<?php

function vrodos_compile_s_selector_replace_tile_gen($term_meta_s_selector2,$tile_pos_x,$tile_pos_y,$guid_tile_sceneselector,$seq_index_of_scene,$name_of_panel,$guid_sprite_scene_featured_img,$text_title_tile,$text_description_tile,$name_of_scene_to_load,$guid_tile_recttransform){
    $file_content_return = str_replace("___[guid_tile_sceneselector]___",$guid_tile_sceneselector,$term_meta_s_selector2);
    $file_content_return = str_replace("___[seq_index_of_scene]___",$seq_index_of_scene,$file_content_return);
    $file_content_return = str_replace("___[tile_pos_x]___",$tile_pos_x,$file_content_return);
    $file_content_return = str_replace("___[tile_pos_y]___",$tile_pos_y,$file_content_return);
    $file_content_return = str_replace("___[name_of_panel]___",$name_of_panel,$file_content_return);
    $file_content_return = str_replace("___[guid_sprite_scene_featured_img]___",$guid_sprite_scene_featured_img,$file_content_return);
    $file_content_return = str_replace("___[text_title_tile]___",$text_title_tile,$file_content_return);
    $file_content_return = str_replace("___[text_description_tile]___",$text_description_tile,$file_content_return);
    $file_content_return = str_replace("___[name_of_scene_to_load]___",$name_of_scene_to_load,$file_content_return);
    $file_content_return = str_replace("___[guid_tile_recttransform]___",$guid_tile_recttransform,$file_content_return);

    return $file_content_return;
}

//==========================================================================================================================================
//==========================================================================================================================================
//TODO Create different replace functions for each game project (if necessary)

function vrodos_replace_spritemeta($sprite_meta_yaml,$sprite_meta_guid){
    $unix_time = time();

    $file_content_return = str_replace("___[jpg_guid]___",$sprite_meta_guid,$sprite_meta_yaml);
    $file_content_return = str_replace("___[unx_time_created]___",$unix_time,$file_content_return);

    return $file_content_return;
}

