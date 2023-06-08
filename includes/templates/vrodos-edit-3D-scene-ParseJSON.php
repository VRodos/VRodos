<?php
class ParseJSON
{

    function __construct($relativepath)
    {
        $this->relativepath = $relativepath;
    }

    public function init($sceneToLoad)
    {

        $resources3D = [];

        $asset_id = '';
        $asset_name = '';

        $glb_id = '';

        $category_id = '';
        $category_slug = '';

        $is_cloned = '';
        $is_joker = '';
        $color = ''; // object color override
        $emissive = '';
        $emissiveIntensity = '';
        $roughness = '';
        $metalness = '';

        $sceneToLoad = htmlspecialchars_decode($sceneToLoad);
        $content_JSON = json_decode($sceneToLoad);
        $json_metadata = $content_JSON->metadata;

        echo '<script>';
        echo 'resources3D["ClearColor"]= "' . $json_metadata->ClearColor . '";';

        if (property_exists($json_metadata, "fogtype")) {
            echo 'resources3D["fogtype"]= "' . $json_metadata->fogtype . '";';
            echo 'resources3D["fogcolor"]= "' . $json_metadata->fogcolor . '";';
            echo 'resources3D["fognear"]= "' . $json_metadata->fognear . '";';
            echo 'resources3D["fogfar"]= "' . $json_metadata->fogfar . '";';
            echo 'resources3D["fogdensity"]= "' . $json_metadata->fogdensity . '";';
        }

        echo 'resources3D["toneMappingExposure"]= "' . $json_metadata->toneMappingExposure . '";';
        echo 'resources3D["enableEnvironmentTexture"]= "' . $json_metadata->enableEnvironmentTexture . '";';
        echo '</script>';


        $json_objects = $content_JSON->objects;

        // For light target
        $target_position_x = 0;
        $target_position_y = 0;
        $target_position_z = 0;

        $light_color_r = 1;
        $light_color_g = 1;
        $light_color_b = 1;

        $lightintensity = 1; // Sun
        $lightdecay = 1; // Lamp
        $lightdistance = 100; // Lamp
        $shadowRadius = 8;

        $lightangle = 0.7;
        $lightpenumbra = 0;

        $lighttargetobjectname = '';

        $overrideMaterial = "false";

        foreach ($json_objects as $key => $value) {

            $name = $key;

            if ($name == 'avatarCamera') {

                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = 0;

                $value->path = "";
                $value->isLight = "false";

            } elseif (strpos($name, 'lightSun') !== false) {

                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = $value->rotation[2];

                $target_position_x = $value->targetposition[0];
                $target_position_y = $value->targetposition[1];
                $target_position_z = $value->targetposition[2];

                $light_color_r = $value->lightcolor[0];
                $light_color_g = $value->lightcolor[1];
                $light_color_b = $value->lightcolor[2];

                $value->path = "";
                $value->isLight = "true";


            } elseif (strpos($name, 'lightLamp') !== false) {


                $r_x = 0;
                $r_y = 0;
                $r_z = 0;

                $target_position_x = 0;
                $target_position_y = 0;
                $target_position_z = 0;

                $light_color_r = $value->lightcolor[0];
                $light_color_g = $value->lightcolor[1];
                $light_color_b = $value->lightcolor[2];

                $value->path = "";
                $value->isLight = "true";

            } elseif (strpos($name, 'lightSpot') !== false) {

                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = $value->rotation[2];

                $target_position_x = 0;
                $target_position_y = 0;
                $target_position_z = 0;

                $light_color_r = $value->lightcolor[0];
                $light_color_g = $value->lightcolor[1];
                $light_color_b = $value->lightcolor[2];

                $value->path = "";
                $value->isLight = "true";

            } elseif (strpos($name, 'lightAmbient') !== false) {


                $value->asset_name = 'lightAmbient';

                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = $value->rotation[2];

                $target_position_x = 0;
                $target_position_y = 0;
                $target_position_z = 0;

                $light_color_r = $value->lightcolor[0];
                $light_color_g = $value->lightcolor[1];
                $light_color_b = $value->lightcolor[2];

                $value->path = "";
                $value->isLight = "true";


            } elseif (strpos($name, 'Pawn') !== false) {

                $value->asset_name = $name;

                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = $value->rotation[2];

                $target_position_x = 0;
                $target_position_y = 0;
                $target_position_z = 0;

                $value->path = "";
                $value->isLight = "false";


            } else {
                // Object

                $value->path = $this->relativepath . $value->fnPath;

                if (!isset($value->overrideMaterial)) {
                    $value->overrideMaterial = 'false';
                }

                if (!property_exists($value, 'is_joker')) {
                    $value->is_joker = 'false';
                }


                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = $value->rotation[2];

                $value->isLight = "false";
            }


            // Common for all

            $t_x = $value->position[0];
            $t_y = $value->position[1];
            $t_z = $value->position[2];

            $s_x = $value->scale[0];
            $s_y = $value->scale[1];
            $s_z = $value->scale[2];

            //echo $name." ".$assetname." ".$lightintensity."<br />";

            /*var_dump($value);
            exit;*/

            $trs = '{"translation":[' . $t_x . ',' . $t_y . ',' . $t_z . '],"rotation":[' . $r_x . ',' . $r_y . ',' . $r_z . '], "scale":[' . $s_x . ',' . $s_y . ',' . $s_z . ']} ';

            $resourcesString = 'resources3D["' . $name . '"]={ ';
            foreach($value as $entry=>$val) {

                if (is_array($val)) {
                    $resourcesString .= '"'.$entry.'":['.implode(", ", $val).'], ';
                }
                else if (is_object($val)) {
                    // need to further check this
                }
                else {
                    $resourcesString .= '"'.$entry.'":"'.$val.'", ';
                }

            }

            $resourcesString .= '"targetposition":[' . $target_position_x . ',' . $target_position_y . ',' . $target_position_z . '], ';
            $resourcesString .= '"lightcolor":[' . $light_color_r . ',' . $light_color_g . ',' . $light_color_b . '], ';
            $resourcesString .= '"lightintensity":"' . $lightintensity .'", ';
            $resourcesString .= '"trs":' . $trs . " };";


            // Make javascript variable resources 3D
            echo '<script type="text/javascript">';
            echo 'var selected_object_trs=' . $trs . ';';

            echo $resourcesString;
            echo '</script>';

        }

        return $resources3D;
    }
}
