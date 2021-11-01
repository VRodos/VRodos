<?php
class ParseJSON {

    function __construct($relativepath)  {
        $this->relativepath = $relativepath;
    }

    public function init($sceneToLoad) {
    
//        $fp = fopen("output_saved2.txt","w");
//        fwrite($fp, print_r($sceneToLoad,true));
//        fclose($fp);
    
        $assetid ='';
        $assetname = '';
        $objID = '';
        $mtlID = '';
        $fbxID = '';
        $glbID = '';
        $audioID = '';

        $categoryID = '';
        $image1id = '';
        $doorName_source = '';
        $doorName_target = '';
        $sceneName_target = '';
        $sceneID_target = '';
        $archaeology_penalty = '';
        $hv_penalty = '';
        $natural_penalty = '';
        $isreward = '';
        $isCloned = '';
        $isJoker = '';



        
        
        $sceneToLoad = htmlspecialchars_decode($sceneToLoad);
        $content_JSON = json_decode($sceneToLoad);
        $json_objects = $content_JSON->objects;
    
        // For light target
        $target_position_x = 0;
        $target_position_y = 0;
        $target_position_z = 0;
    
        $light_color_r = 1;
        $light_color_g = 1;
        $light_color_b = 1;
    
        $lightintensity = 1; // Sun
    
        $lightpower = 1; // Lamp
        $lightdecay = 1; // Lamp
        $lightdistance = 100; // Lamp
        
        $lightangle = 0.7;
        $lightpenumbra = 0;
    
        $lighttargetobjectname = '';
        
        foreach ($json_objects as $key=>$value) {

            $name = $key;

            if ($name == 'avatarYawObject') {
                $path = '';
                $obj = '';
                $mtl = '';
                $categoryName = 'avatarYawObject';
    
                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = 0;

                $isLight = "false";

            } elseif ( strpos($name, 'lightSun') !== false ){
                
                $path = '';
                $obj = '';
                $mtl = '';
    
                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = $value->rotation[2];
                
                $target_position_x = $value->targetposition[0];
                $target_position_y = $value->targetposition[1];
                $target_position_z = $value->targetposition[2];
                
                $light_color_r = $value->lightcolor[0];
                $light_color_g =$value->lightcolor[1];
                $light_color_b =$value->lightcolor[2];

                $categoryName = 'lightSun';
                $isLight = "true";
                $lightintensity = $value->lightintensity;
    
            } elseif ( strpos($name, 'lightLamp') !== false ){
    
                $path = '';
                $obj = '';
                $mtl = '';
    
                $r_x = 0;
                $r_y = 0;
                $r_z = 0;
    
                $target_position_x = 0;
                $target_position_y = 0;
                $target_position_z = 0;
    
                $light_color_r = $value->lightcolor[0];
                $light_color_g = $value->lightcolor[1];
                $light_color_b = $value->lightcolor[2];
    
                $categoryName = 'lightLamp';
                $isLight = "true";
                $lightpower = $value->lightpower;
                $lightdecay = $value->lightdecay;
                $lightdistance = $value->lightdistance;
    
            } elseif ( strpos($name, 'lightSpot') !== false ){
    
                $path = '';
                $obj = '';
                $mtl = '';
                
                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = $value->rotation[2];
                
                $target_position_x = 0;
                $target_position_y = 0;
                $target_position_z = 0;
    
                $light_color_r = $value->lightcolor[0];
                $light_color_g = $value->lightcolor[1];
                $light_color_b = $value->lightcolor[2];
    
                $categoryName = 'lightSpot';
                $isLight = "true";
                $lightpower = $value->lightpower;
                $lightdecay = $value->lightdecay;
                $lightdistance = $value->lightdistance;
    
                $lightangle = $value->lightangle;
                $lightpenumbra = $value->lightpenumbra;
    
//                $fp = fopen("output_saved.txt","w");
//                fwrite($fp, print_r($value,true));
//                fclose($fp);
                
                
                $lighttargetobjectname = $value->lighttargetobjectname;

            } else {
                $path = $this->relativepath . $value->fnPath;
                $assetid= $value->assetid;
                $assetname= $value->assetname;
                $obj = $value->fnObj;
                $objID = $value->fnObjID;
                $mtl = $value->fnMtl;
                $mtlID = $value->fnMtlID;
                $categoryName = $value->categoryName;
                $categoryID = $value->categoryID;
                $image1id = $value->image1id;

                $doorName_source = $value->doorName_source;
                $doorName_target = $value->doorName_target;
                $sceneName_target = $value->sceneName_target;
                $sceneID_target = $value->sceneID_target;

                $archaeology_penalty = $value->archaeology_penalty;
                $hv_penalty = $value->hv_penalty;
                $natural_penalty = $value->natural_penalty;

                $isreward = $value->isreward;
                $isCloned = $value->isCloned;
                
                if (property_exists($value, 'isJoker') )
                    $isJoker = $value->isJoker;
                else
                    $isJoker = 'false';

                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = $value->rotation[2];
    
                $isLight = "false";
            }

            $t_x = $value->position[0];
            $t_y = $value->position[1];
            $t_z = $value->position[2];

            $scale = $value->scale[0];

            echo '<script>';
            echo 'var selected_object_trs={"translation":['.$t_x.','.$t_y.','.$t_z.'],"rotation":['.
                $r_x .','.$r_y .','.$r_z .'],'.'"scale":'.$scale.'};';

            
            
            echo 'resources3D["'.$name.'"]= {'.
                                            '"path":"'.$path.
                                            '","assetid":"'.$assetid.
                                            '","assetname":"'.$assetname.
                                            '","obj":"'.$obj.
                                            '","objID":"'.$objID.
                                            '","mtl":"'.$mtl.
                                            '","mtlID":"'.$mtlID.
                                            '","fbxID":"'.$fbxID.
                                            '","glbID":"'.$glbID.
                                            '","audioID":"'.$audioID.
                                            '","categoryName":"'.$categoryName.
                                            '","categoryID":"'.$categoryID.
                                            '","image1id":"'.$image1id.
                                            '","doorName_source":"'.$doorName_source.
                                            '","doorName_target":"'.$doorName_target.
                                            '","sceneName_target":"'.$sceneName_target.
                                            '","sceneID_target":"'.$sceneID_target.
                                            '","archaeology_penalty":"'.$archaeology_penalty.
                                            '","hv_penalty":"'.$hv_penalty.
                                            '","natural_penalty":"'.$natural_penalty.
                                            '","isreward":"'.$isreward.
                                            '","isCloned":"'.$isCloned.
                                            '","isJoker":"'.$isJoker.
                                            '","isLight":"'.$isLight.
                                            '","lightintensity":"'.$lightintensity.
                                            '","lightpower":"'.$lightpower.
                                            '","lightdecay":"'.$lightdecay.
                                            '","lightdistance":"'.$lightdistance.
                                            '","lightangle":"'.$lightangle.
                                            '","lightpenumbra":"'.$lightpenumbra.
                                            '","lighttargetobjectname":"'.$lighttargetobjectname.
                                            '","lightcolor":['.$light_color_r.','.$light_color_g.','.$light_color_b.']'.
                                            ',"targetposition":['.$target_position_x.','.$target_position_y.','.$target_position_z.']'.
                                            ',"trs":selected_object_trs};';
            
           
            
            echo '</script>';
        }
        
        return true;
    }
}
?>
