<?php

function vrodos_create_asset_3DFilesExtra_frontend($asset_newID, $assetTitleForm, $gameSlug){

    // Clear out all previous
    
    // 1. DELETE ATTACHMENTS OF PARENT POST (ASSET POST)
    $attachments = get_children( array('post_parent' => $asset_newID, 'post_type' => 'attachment') );
    
    foreach ($attachments as $attachment){
        
        // Delete attachment post (apart from screenshot)
        if (!strpos($attachment->post_title, 'screenshot')) {
    
    
            // Delete all metas of the attachment post
            $attachment_metas = get_post_meta($attachment->ID);
    
            $file_name = get_post_meta($attachment->ID, '_wp_attached_file', true);
            
            foreach(array_keys($attachment_metas) as $attachment_meta_key) {
                delete_post_meta($attachment->ID, $attachment_meta_key);
            }
            
            // Delete attchment post
            wp_delete_post($attachment->ID, true);
        }
    }
    
    // 1. Check if already exists
    // 2. Upload and update DB

    //----- Upload textures and get final filenames as uploaded on server ----------------------
    $textureNamesIn  = [];
    
    $content_texture = [];
    
    // store the extensions
    $extension_texture_file = [];
    
    // Texture
    if (isset($_POST['textureFileInput']))
    if ($_POST['textureFileInput']!=null) {
    
        // DELETE EXISTING TEXTURE POST, FILE, and its META:
        $diff_images_ids = get_post_meta($asset_newID,'vrodos_asset3d_diffimage');
    
        if (count($diff_images_ids) > 0) {
      
            for ( $i=0 ; $i < count($diff_images_ids); $i++ ) {
                // Remove previous file from file system
                $prevfMeta = get_post_meta($diff_images_ids[$i],
                                            '_wp_attachment_metadata', false);
    
                if (count($prevfMeta) > 0) {
                    if (file_exists($prevfMeta[$i]['file'])) {
                        unlink($prevfMeta[$i]['file']);
                    }
                }
    
                // Delete texture post. Automatically its meta should be deleted as well.
                wp_delete_post($diff_images_ids[$i]);
            }
        }
        
        
        
        // Make an array of textures
        foreach (array_keys($_POST['textureFileInput']) as $texture) {
            
            // Get the basename of texture
            $basename_texture = str_replace(['.jpg','.png','.gif'], '', $texture);
            
            // Get the content
            $content_texture[$basename_texture] = $_POST['textureFileInput'][$texture];
            
            // Get the extension (jpg or png or gif)
            $extension_texture_file[$basename_texture] = pathinfo($texture, PATHINFO_EXTENSION);
 
            // Store basenames to an array
            $textureNamesIn[] = $basename_texture;
        }
        
        // Processed basenames
        $textureNamesOut = [];
        
        for ($i = 0; $i < count($content_texture); $i++) {
            
            // Upload texture content
            $texturePost_id = vrodos_upload_asset_texture(
                $content_texture[$textureNamesIn[$i]], // content of file
                'texture_' . $textureNamesIn[$i] . '_' . $assetTitleForm, // new filename
                $asset_newID, // asset id
                $extension_texture_file[$textureNamesIn[$i]]  // extension
            );
            
            // Get filename in the server
            $textureFile_filename = basename(get_attached_file($texturePost_id));
            
            // Store filenames
            $textureNamesOut[] = $textureFile_filename;
        }
    }
    
    //-MTL: Change filenames of textures inside mtl according to the final filenames on server
    $mtl_content = $_POST['mtlFileInput'];

    // MTL : Open mtl file and replace jpg filename
    if($_POST['mtlFileInput']!=null) {
        if(strlen($_POST['mtlFileInput']) > 0) {
            
            // parse texture names
            for ($k = 0; $k < count($textureNamesIn); $k++) {

                // Find if it is jpg or png by content header
                $imageContentLine = substr($content_texture[$textureNamesIn[$k]], 0, 20);
    
                // replace the original basename of jpg with the final name of jpg in the server
                if ( strpos($imageContentLine, "jpeg") ) {
                    $mtl_content = preg_replace("/.*\bmap_Kd\b.*\b" . $textureNamesIn[$k] . ".jpg\b/ui",
                        "map_Kd " . $textureNamesOut[$k], $mtl_content);
                } else if (strpos($imageContentLine, "png")){
                    $mtl_content = preg_replace("/.*\bmap_Kd\b.*\b" . $textureNamesIn[$k] . ".png\b/ui",
                        "map_Kd " . $textureNamesOut[$k], $mtl_content);
                } else {
                    echo "Uknown texture file type: Error 856";
                    return;
                }
                
            }
        }
    }

    
    $obj_content = $_POST['objFileInput'];

    if ($_POST['mtlFileInput']!=null && $_POST['objFileInput']!=null) {
        if (strlen(trim($_POST['mtlFileInput']))>0 && strlen(trim($_POST['objFileInput']))>0) {
          
            // 1. Upload mtl content as text and get the id of meta
            $mtlFile_id = vrodos_upload_AssetText(
                            $mtl_content,               // the content
                    'material' .                 // it should have the keyword material in finale basename
                            $assetTitleForm,            // It should have also the title of Asset
                            $asset_newID,               // Asset id
                            null, null
            );
            
            // 2. Add id of mtl as post meta on asset
            update_post_meta($asset_newID, 'vrodos_asset3d_mtl', $mtlFile_id);
   
            // 3. OBJ: Get filename of mtl (remove path and txt extension) on the server
            $mtl_filename = basename(get_attached_file($mtlFile_id),'txt'). 'mtl';

            $nCharsToSearch = strlen($obj_content) > 500 ? 500 : strlen($obj_content);

            // 4. Search for replace only in the first 500 characters to avoid memory issues
            $obj_contentfirst = preg_replace("/.*\b" . 'mtllib' . "\b.*\n/ui", // find mtllib line
                                             "mtllib " . $mtl_filename . "\n", // replace
                                             substr($obj_content, 0, $nCharsToSearch)); // search on first nchrs

            // Replace the patch
            $obj_content = substr_replace($obj_content, $obj_contentfirst, 0, $nCharsToSearch);
            
            // 5. Upload OBJ
            $objFile_id = vrodos_upload_AssetText($obj_content, // the OBJ content
                                           'obj' .$assetTitleForm, // it should have the obj and title as name
                                                  $asset_newID,
                                                  null, null
                                                );

            // 6. Add id of obj as post meta on asset
            update_post_meta($asset_newID, 'vrodos_asset3d_obj', $objFile_id);
        }
    } else if ($_POST['fbxFileInput']) {

        // Fbx as text
        $fbx_content = stripslashes($_POST['fbxFileInput']);
    
        // Fbx as binary
        $nFiles = count($_FILES['multipleFilesInput']['name']);
    
        $index_file_fbx = -1;
    
        for ($i = 0; $i < $nFiles; $i++) {
            if (strpos($_FILES['multipleFilesInput']['name'][$i], '.fbx') > 0) {
                $index_file_fbx = $i;
            }
        }

        if (substr($fbx_content, 0, 18) === "Kaydara FBX Binary") {
        
            // Upload FBX file as BINARY
            if ($index_file_fbx != -1) {
                // 1. Upload FBX file as BINARY
                $fbxFile_id = vrodos_upload_AssetText(null, 'fbx' . $assetTitleForm, $asset_newID,
                    $_FILES, $index_file_fbx);
            
                // 2. Set value of attachment IDs at custom fields
                update_post_meta($asset_newID, 'vrodos_asset3d_fbx', $fbxFile_id);
            }
        
        } else {
        
            // Upload FBX file as TEXT
            $fbxFile_id = vrodos_upload_AssetText($fbx_content, 'fbx' . $assetTitleForm, $asset_newID,
                null, null);
        
            // 2. Set value of attachment IDs at custom fields
            update_post_meta($asset_newID, 'vrodos_asset3d_fbx', $fbxFile_id);
        
        }
    } else if ($_POST['pdbFileInput']){
        
        if (strlen($_POST['pdbFileInput']) > 0) {
            $pdbFile_id = vrodos_upload_AssetText($_POST['pdbFileInput'], 'pdb' . $assetTitleForm,
                                                                    $asset_newID, null, null);
            
            update_post_meta($asset_newID, 'vrodos_asset3d_pdb', $pdbFile_id);
        }
        
    } else if ($_POST['glbFileInput']) {
    
        // GLB upload and add id of uploaded file to postmeta  vrodos_asset3d_glb of asset
        
        if (strlen($_POST['glbFileInput']) > 0) {
            $glbFile_id = vrodos_upload_AssetText(null, 'glb' . $assetTitleForm, $asset_newID,
                $_FILES, 0);
            
            update_post_meta($asset_newID, 'vrodos_asset3d_glb', $glbFile_id);
        }
        
    }
}


// Create asset
function vrodos_create_asset_frontend($assetPGameID, $assetCatID, $gameSlug, $assetCatIPRID, $asset_language_pack, $assetFonts, $assetback3dcolor, $assettrs){

    $asset_taxonomies = array(
        'vrodos_asset3d_pgame' => array($assetPGameID,),
        'vrodos_asset3d_cat' => array($assetCatID,),
        'vrodos_asset3d_ipr_cat' => array($assetCatIPRID,)
    );
    
    $asset_information = array(
        'post_title' => $asset_language_pack['assetTitleForm'],
        'post_content' => $asset_language_pack['assetDescForm'],
        'post_type' => 'vrodos_asset3d',
        'post_status' => 'publish',
        'tax_input' => $asset_taxonomies,
    );

    $asset_id = wp_insert_post($asset_information);
    update_post_meta($asset_id, 'vrodos_asset3d_pathData', $gameSlug);
    
    vrodos_update_asset_texts($asset_id, $asset_language_pack, $assetFonts, $assetback3dcolor, $assettrs);

    return $asset_id ? $asset_id : 0;
}


// Update asset
function vrodos_update_asset_frontend($assetPGameID, $assetCatID, $asset_id, $assetCatIPRID,
                                       $asset_language_pack, $assetFonts, $assetback3dcolor, $assettrs){
    $asset_taxonomies = array(
        'vrodos_asset3d_pgame' => array($assetPGameID,),
        'vrodos_asset3d_cat' => array($assetCatID,),
        'vrodos_asset3d_ipr_cat' => array($assetCatIPRID,)
    );
    $asset_new_info = array(
        'ID' => $asset_id,
        'post_title' => $asset_language_pack['assetTitleForm'],
        'post_content' => $asset_language_pack['assetDescForm'],
        'tax_input' => $asset_taxonomies,
    );

    wp_update_post($asset_new_info);
    
    vrodos_update_asset_texts($asset_id, $asset_language_pack, $assetFonts, $assetback3dcolor, $assettrs);
    
    return 1;
}

function vrodos_create_asset_addImages_frontend($asset_newID){
    
    $asset_imageForm = [];
    for ($i=0; $i<=4; $i++){
        $asset_imageForm[$i] =  $_FILES['image'.$i.'Input'];
        
        if ($i==0){
            // Featured image (thumbnail)
            $attachment_id = vrodos_upload_img_vid_aud( $asset_imageForm[0], $asset_newID);
            set_post_thumbnail( $asset_newID, $attachment_id );
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



function vrodos_create_asset_addVideo_frontend($asset_newID){
    $asset_videoForm = $_FILES['videoFileInput'];
    
    // 4 error means empty
    if ( $asset_videoForm['error'] == 4  )
        return;
    
    $attachment_video_id = vrodos_upload_img_vid_aud( $asset_videoForm, $asset_newID);
    update_post_meta( $asset_newID, 'vrodos_asset3d_video', $attachment_video_id );
}



// ------------- Chemistry - Wind Energy related ----------------------------
function vrodos_create_asset_consumerExtra_frontend($asset_newID){
    //Energy Consumption
    $safe_cons_values = range(0, 2000, 5);
    $safe_cons_values2 = range(0, 1000, 5);

    $energyConsumptionMinValForm = intval($_POST['energyConsumptionMinVal']);
    $energyConsumptionMaxValForm = intval($_POST['energyConsumptionMaxVal']);
    $energyConsumptionMeanValForm = intval($_POST['energyConsumptionMeanVal']);
    $energyConsumptionVarianceValForm = intval($_POST['energyConsumptionVarianceVal']);

    if (!in_array($energyConsumptionMinValForm, $safe_cons_values, true)) {$energyConsumptionMinValForm = '';}
    if (!in_array($energyConsumptionMaxValForm, $safe_cons_values, true)) {$energyConsumptionMaxValForm = '';}
    if (!in_array($energyConsumptionMeanValForm, $safe_cons_values, true)) {$energyConsumptionMeanValForm = '';}
    if (!in_array($energyConsumptionVarianceValForm, $safe_cons_values2, true)) {$energyConsumptionVarianceValForm = '';}

    $energyConsumption = array('min' => $energyConsumptionMinValForm, 'max' => $energyConsumptionMaxValForm, 'mean' => $energyConsumptionMeanValForm, 'var' => $energyConsumptionVarianceValForm);

    update_post_meta($asset_newID, 'vrodos_energyConsumption', $energyConsumption);
}

function vrodos_create_asset_terrainExtra_frontend($asset_newID){
    $underPowerIncomeValForm = floatval($_POST['underPowerIncomeVal']);
    $correctPowerIncomeValForm = floatval($_POST['correctPowerIncomeVal']);
    $overPowerIncomeValForm = floatval($_POST['overPowerIncomeVal']);
    $accessCostPenaltyForm = intval($_POST['accessCostPenalty']);
    $archProximityPenaltyForm = intval($_POST['archProximityPenalty']);
    $naturalReserveProximityPenaltyForm = intval($_POST['naturalReserveProximityPenalty']);
    $hiVoltLineDistancePenaltyForm = intval($_POST['hiVoltLineDistancePenalty']);
    $physicsWindMinValForm = intval($_POST['physicsWindMinVal']);
    $physicsWindMaxValForm = intval($_POST['physicsWindMaxVal']);
    $physicsWindMeanValForm = intval($_POST['physicsWindMeanVal']);
    $physicsWindVarianceValForm = intval($_POST['physicsWindVarianceVal']);

    //Income (in $)
    $safe_income_values = range(-5, 5, 0.5);
    if (!in_array($underPowerIncomeValForm, $safe_income_values, true)) {$underPowerIncomeValForm = '';}
    if (!in_array($correctPowerIncomeValForm, $safe_income_values, true)) {$correctPowerIncomeValForm = '';}
    if (!in_array($overPowerIncomeValForm, $safe_income_values, true)) {$overPowerIncomeValForm = '';}

    $energyConsumptionIncome = array('under' => $underPowerIncomeValForm, 'correct' => $correctPowerIncomeValForm, 'over' => $overPowerIncomeValForm);

    //Construction Penalties (in $)
    $safe_penalty_values = array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    if (!in_array($accessCostPenaltyForm, $safe_penalty_values, true)) {$accessCostPenaltyForm = '';}
    if (!in_array($archProximityPenaltyForm, $safe_penalty_values, true)) {$archProximityPenaltyForm = '';}
    if (!in_array($naturalReserveProximityPenaltyForm, $safe_penalty_values, true)) {$naturalReserveProximityPenaltyForm = '';}
    if (!in_array($hiVoltLineDistancePenaltyForm, $safe_penalty_values, true)) {$hiVoltLineDistancePenaltyForm = '';}

    $constructionPenalties = array('access' => $accessCostPenaltyForm, 'arch' => $archProximityPenaltyForm, 'natural' => $naturalReserveProximityPenaltyForm, 'hiVolt' => $hiVoltLineDistancePenaltyForm);

    //Physics
    $safe_physics_values = range(0, 40, 1);
    $safe_physics_values2 = range(1, 100, 1);//for Wind Variance
    if (!in_array($physicsWindMinValForm, $safe_physics_values, true)) {$physicsWindMinValForm = '';}
    if (!in_array($physicsWindMaxValForm, $safe_physics_values, true)) {$physicsWindMaxValForm = '';}
    if (!in_array($physicsWindMeanValForm, $safe_physics_values, true)) {$physicsWindMeanValForm = '';}
    if (!in_array($physicsWindVarianceValForm, $safe_physics_values2, true)) {$physicsWindVarianceValForm = '';}

    $physicsValues = array('min' => $physicsWindMinValForm, 'max' => $physicsWindMaxValForm, 'mean' => $physicsWindMeanValForm, 'variance' => $physicsWindVarianceValForm);

    update_post_meta($asset_newID, 'vrodos_energyConsumptionIncome', $energyConsumptionIncome);
    update_post_meta($asset_newID, 'vrodos_physicsValues', $physicsValues);
    update_post_meta($asset_newID, 'vrodos_constructionPenalties', $constructionPenalties);
}

function vrodos_create_asset_producerExtra_frontend($asset_newID){
    $producerTurbineSizeValForm = intval($_POST['producerTurbineSizeVal']);
    $producerDmgCoeffValForm = floatval($_POST['producerDmgCoeffVal']);
    $producerCostValForm = intval($_POST['producerCostVal']);
    $producerRepairCostValForm = floatval($_POST['producerRepairCostVal']);
    $producerClassValForm = $_POST['producerClassVal'];
    $producerWindSpeedClassValForm = floatval($_POST['producerWindSpeedClassVal']);
    $producerMaxPowerValForm = floatval($_POST['producerMaxPowerVal']);
    $producerPowerProductionValForm = $_POST['producerPowerProductionVal'];

    //Producer Options-Costs
    $safe_opt_val = range(3, 250, 1);
    $safe_opt_dmg = range(0.001, 0.02, 0.001);
    $safe_opt_cost = range(1, 10, 1);
    $safe_opt_repaid = range(0.5, 5, 0.5);
    if (!in_array($producerTurbineSizeValForm, $safe_opt_val, true)) {$producerTurbineSizeValForm = '';}
    if (!in_array($producerDmgCoeffValForm, $safe_opt_dmg, true)) {$producerDmgCoeffValForm = '';}
    if (!in_array($producerCostValForm, $safe_opt_cost, true)) {$producerCostValForm = '';}
    if (!in_array($producerRepairCostValForm, $safe_opt_repaid, true)) {$producerRepairCostValForm = '';}

    $producerOptCosts = array('size' => $producerTurbineSizeValForm, 'dmg' => $producerDmgCoeffValForm, 'cost' => $producerCostValForm, 'repaid' => $producerRepairCostValForm);
    $producerOptGen = array('class' => $producerClassValForm, 'speed' => $producerWindSpeedClassValForm, 'power' => $producerMaxPowerValForm);

    update_post_meta($asset_newID, 'vrodos_producerPowerProductionVal', $producerPowerProductionValForm);
    update_post_meta($asset_newID, 'vrodos_producerOptCosts', $producerOptCosts);
    update_post_meta($asset_newID, 'vrodos_producerOptGen', $producerOptGen);
}



function vrodos_create_asset_moleculeExtra_frontend($asset_newID){
    $moleculeChemicalType = $_POST['moleculeChemicalType'];
    $moleculeFunctionalGroupInput = $_POST['moleculeFunctionalGroupInput'];
    $moleculeFluidViscosity = floatval($_POST['molecule-fluid-viscosity-slider-label']);
    $moleculeFluidColorVal = $_POST['moleculeFluidColorVal'];

    update_post_meta($asset_newID, 'vrodos_molecule_ChemicalTypeVal', $moleculeChemicalType);
    update_post_meta($asset_newID, 'vrodos_molecule_FunctionalGroupVal', $moleculeFunctionalGroupInput);
    update_post_meta($asset_newID, 'vrodos_molecule_FluidViscosityVal', $moleculeFluidViscosity);
    update_post_meta($asset_newID, 'vrodos_molecule_FluidColorVal', $moleculeFluidColorVal);
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


function vrodos_update_asset_texts($asset_id, $alp, $assetFonts, $assetback3dcolor, $assettrs){

    update_post_meta($asset_id, 'vrodos_asset3d_fonts', $assetFonts);
    update_post_meta($asset_id, 'vrodos_asset3d_back3dcolor', $assetback3dcolor);
    update_post_meta($asset_id, 'vrodos_asset3d_assettrs', $assettrs);
    
    update_post_meta($asset_id, 'vrodos_asset3d_description_kids', $alp['assetDescFormKids']);
    update_post_meta($asset_id, 'vrodos_asset3d_description_experts', $alp['assetDescFormExperts']);
    update_post_meta($asset_id, 'vrodos_asset3d_description_perception', $alp['assetDescFormPerception']);
    
    $languages = ['Greek', 'Spanish', 'French', 'German', 'Russian'];

    for ($i = 0; $i < count($languages); $i++) {
        update_post_meta($asset_id, 'vrodos_asset3d_title_'.strtolower($languages[$i]),
                                                                                 $alp['assetTitleForm'.$languages[$i]]);
        
        update_post_meta($asset_id, 'vrodos_asset3d_description_'.strtolower($languages[$i]),
                                                                                  $alp['assetDescForm'.$languages[$i]]);
        
        update_post_meta($asset_id, 'vrodos_asset3d_description_'.strtolower($languages[$i]).'_kids',
                                                                           $alp['assetDescForm'.$languages[$i].'Kids']);
        
        update_post_meta($asset_id, 'vrodos_asset3d_description_'.strtolower($languages[$i]).'_experts',
                                                                        $alp['assetDescForm'.$languages[$i].'Experts']);
        
        update_post_meta($asset_id, 'vrodos_asset3d_description_'.strtolower($languages[$i]).'_perception',
                                                                     $alp['assetDescForm'.$languages[$i].'Perception']);
    }
}
?>
