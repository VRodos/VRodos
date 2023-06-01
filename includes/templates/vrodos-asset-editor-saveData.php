<?php

function vrodos_create_asset_3DFilesExtra_frontend($assetNewId, $assetTitle, $gameSlug, $projectId){

    // Clear out all previous

    // 1. DELETE ATTACHMENTS OF PARENT POST (ASSET POST)
    $attachments = get_children( array('post_parent' => $assetNewId, 'post_type' => 'attachment') );

    foreach ($attachments as $attachment) {

        // Delete attachment post (apart from screenshot)
        if (!strpos($attachment->post_title, 'screenshot')) {

            // Delete all metas of the attachment post
            $attachment_metas = get_post_meta($attachment->ID);

            foreach(array_keys($attachment_metas) as $attachment_meta_key) {
                delete_post_meta($attachment->ID, $attachment_meta_key);
            }

            // Delete attchment post
            wp_delete_post($attachment->ID, true);
        }
    }

    // 2. Upload and update DB
    if ($_POST['glbFileInput']) {

        // GLB upload and add id of uploaded file to postmeta  vrodos_asset3d_glb of asset
        if (strlen($_POST['glbFileInput']) > 0) {
            $glbFile_id = vrodos_upload_AssetText(null, 'glb' . $assetTitle, $assetNewId,
                $_FILES, 0, $projectId);

            update_post_meta($assetNewId, 'vrodos_asset3d_glb', $glbFile_id);
        }
    }
}


// Create asset
function vrodos_create_asset_frontend($assetPGameID, $assetCatID, $gameSlug, $assetCatIPRID, $assetTitle, $assetFonts, $assetback3dcolor, $assettrs, $assetDescription){

    $asset_taxonomies = array(
        'vrodos_asset3d_pgame' => array($assetPGameID),
        'vrodos_asset3d_cat' => array($assetCatID),
        'vrodos_asset3d_ipr_cat' => array($assetCatIPRID)
    );

    $asset_information = array(
        'post_title' => $assetTitle,
        'post_content' => $assetDescription,
        'post_type' => 'vrodos_asset3d',
        'post_status' => 'publish',
        'tax_input' => $asset_taxonomies,
    );

    $asset_id = wp_insert_post($asset_information);
    update_post_meta($asset_id, 'vrodos_asset3d_pathData', $gameSlug);

    vrodos_update_asset_meta($asset_id, $assetFonts, $assetback3dcolor, $assettrs);

    return $asset_id ? $asset_id : 0;
}


// Update asset
function vrodos_update_asset_frontend($assetPGameID, $assetCatID, $assetId, $assetCatIPRID, $assetTitle, $assetFonts, $assetback3dcolor, $assettrs, $assetDescription) {

    $asset_taxonomies = array(
        'vrodos_asset3d_pgame' => array($assetPGameID),
        'vrodos_asset3d_cat' => array($assetCatID),
        'vrodos_asset3d_ipr_cat' => array($assetCatIPRID)
    );
    $data = array(
        'ID' => $assetId,
        'post_title' => $assetTitle,
        'post_content' => $assetDescription,
        'tax_input' => $asset_taxonomies,
    );
    wp_update_post($data);
    vrodos_update_asset_meta($assetId, $assetFonts, $assetback3dcolor, $assettrs);

    return 1;
}

function vrodos_create_asset_addImages_frontend($asset_newID){

    $asset_imageForm = [];
    for ($i=0; $i<=4; $i++){
        $asset_imageForm[$i] =  $_FILES['image'.$i.'Input'];

        if ($i==0){
            // Featured image (thumbnail)
            $attachment_id = vrodos_upload_img_vid_aud( $asset_imageForm[0], $asset_newID);

            // Dont set post thumbnail. another call does that.
            // set_post_thumbnail( $asset_newID, $attachment_id );
            update_post_meta($asset_newID, 'vrodos_asset3d_image'.$i, $attachment_id);
        } else { // Images 1,2,3,4
            if ($asset_imageForm[$i]['error'] != 4) { // No error
                $attachment_id_image = vrodos_upload_img_vid_aud($asset_imageForm[$i], $asset_newID);
                update_post_meta($asset_newID, 'vrodos_asset3d_image'.$i, $attachment_id_image);
            }
        }
    }

}


function vrodos_create_asset_addAudio_frontend($asset_newID){
    $asset_audioForm = $_FILES['audioFileInput'];

    // 4 error means empty
    if ( $asset_audioForm['error'] == 4  )
        return;

    $attachment_audio_id = vrodos_upload_img_vid_aud( $asset_audioForm, $asset_newID);
    update_post_meta( $asset_newID, 'vrodos_asset3d_audio', $attachment_audio_id );
}



function vrodos_create_asset_addVideo_frontend($asset_newID) {
    $asset_videoForm = $_FILES['videoFileInput'];

    // 4 error means empty
    if ( $asset_videoForm['error'] == 4  )
        return;

    $attachment_video_id = vrodos_upload_img_vid_aud( $asset_videoForm, $asset_newID);
    update_post_meta( $asset_newID, 'vrodos_asset3d_video', $attachment_video_id );
}


//--------------  For Cloning only -------------------------------------------------------------------------------------
//function vrodos_copy_3Dfiles($asset_newID, $asset_sourceID){
//
//    // Get the source post
//    $assetpostMeta = get_post_meta($asset_sourceID);
//
//    if ($assetpostMeta['vrodos_asset3d_pdb'][0])
//        update_post_meta($asset_newID, 'vrodos_asset3d_pdb', $assetpostMeta['vrodos_asset3d_pdb'][0]);
//
//    if ($assetpostMeta['vrodos_asset3d_mtl'][0])
//        update_post_meta($asset_newID, 'vrodos_asset3d_mtl', $assetpostMeta['vrodos_asset3d_mtl'][0]);
//
//    if($assetpostMeta['vrodos_asset3d_obj'][0])
//        update_post_meta($asset_newID, 'vrodos_asset3d_obj', $assetpostMeta['vrodos_asset3d_obj'][0]);
//
//    if($assetpostMeta['vrodos_asset3d_screenimage'][0])
//        update_post_meta($asset_newID, 'vrodos_asset3d_screenimage', $assetpostMeta['vrodos_asset3d_screenimage'][0]);
//
//    if (count($assetpostMeta['vrodos_asset3d_diffimage']) > 0) {
//        delete_post_meta($asset_newID, 'vrodos_asset3d_diffimage');
//        for ($m = 0; $m < count($assetpostMeta['vrodos_asset3d_diffimage']); $m++)
//            add_post_meta($asset_newID, 'vrodos_asset3d_diffimage', $assetpostMeta['vrodos_asset3d_diffimage'][$m]);
//    }
//}


function vrodos_update_asset_meta($asset_id, $assetFonts, $assetback3dcolor, $assettrs){

    update_post_meta($asset_id, 'vrodos_asset3d_fonts', $assetFonts);
    update_post_meta($asset_id, 'vrodos_asset3d_back3dcolor', $assetback3dcolor);
    update_post_meta($asset_id, 'vrodos_asset3d_assettrs', $assettrs);

}
