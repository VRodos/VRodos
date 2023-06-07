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

        $assetid = '';
        $assetname = '';

        $glbID = '';

        $categoryID = '';
        $categorySlug = '';

        $isCloned = '';
        $isJoker = '';
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
                $path = '';
                $categoryName = 'avatarYawObject';

                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = 0;

                $isLight = "false";

            } elseif (strpos($name, 'lightSun') !== false) {

                $path = '';

                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = $value->rotation[2];

                $target_position_x = $value->targetposition[0];
                $target_position_y = $value->targetposition[1];
                $target_position_z = $value->targetposition[2];

                $light_color_r = $value->lightcolor[0];
                $light_color_g = $value->lightcolor[1];
                $light_color_b = $value->lightcolor[2];

                $categoryName = 'lightSun';
                $isLight = "true";
                $lightintensity = $value->lightintensity;

            } elseif (strpos($name, 'lightLamp') !== false) {

                $path = '';

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
                $lightintensity = $value->lightintensity;
                $lightdecay = $value->lightdecay;
                $lightdistance = $value->lightdistance;
                $shadowRadius = $value->shadowRadius;

            } elseif (strpos($name, 'lightSpot') !== false) {

                $path = '';

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
                $lightintensity = $value->lightintensity;
                $lightdecay = $value->lightdecay;
                $lightdistance = $value->lightdistance;

                $lightangle = $value->lightangle;
                $lightpenumbra = $value->lightpenumbra;


                $lighttargetobjectname = $value->lighttargetobjectname;

            } elseif (strpos($name, 'lightAmbient') !== false) {

                $path = '';

                $assetname = 'lightAmbient';

                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = $value->rotation[2];

                $target_position_x = 0;
                $target_position_y = 0;
                $target_position_z = 0;

                $light_color_r = $value->lightcolor[0];
                $light_color_g = $value->lightcolor[1];
                $light_color_b = $value->lightcolor[2];

                $categoryName = 'lightAmbient';
                $isLight = "true";
                $lightintensity = $value->lightintensity;
                $lightdecay = '';
                $lightdistance = '';

                $lightangle = '';
                $lightpenumbra = '';


                $lighttargetobjectname = '';

            } elseif (strpos($name, 'Pawn') !== false) {

                $path = '';

                $assetname = $name;

                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = $value->rotation[2];

                $target_position_x = 0;
                $target_position_y = 0;
                $target_position_z = 0;

                $categoryName = 'pawn';
                $isLight = "false";


            } else {

                $path = $this->relativepath . $value->fnPath;
                $assetid = $value->assetid;
                $assetname = $value->assetname;

                if (isset($value->overrideMaterial)) {
                    $overrideMaterial = $value->overrideMaterial;
                } else {
                    $overrideMaterial = "false";
                }

                $color = $value->color;
                $emissive = $value->emissive;
                $emissiveIntensity = $value->emissiveIntensity;
                $roughness = $value->roughness;
                $metalness = $value->metalness;

                $glbID = $value->glbID;

                $categoryName = $value->categoryName;
                $categoryID = $value->categoryID;

                $isCloned = $value->isCloned;

                if (property_exists($value, 'isJoker'))
                    $isJoker = $value->isJoker;
                else
                    $isJoker = 'false';

                $r_x = $value->rotation[0];
                $r_y = $value->rotation[1];
                $r_z = $value->rotation[2];

                $isLight = "false";
            }


            // Common for all

            $t_x = $value->position[0];
            $t_y = $value->position[1];
            $t_z = $value->position[2];

            $s_x = $value->scale[0];
            $s_y = $value->scale[1];
            $s_z = $value->scale[2];


            //echo $name." ".$assetname." ".$lightintensity."<br />";

            // Make javascript variable resources 3D
            echo '<script type="text/javascript">';
            echo 'var selected_object_trs={"translation":[' . $t_x . ',' . $t_y . ',' . $t_z . '],"rotation":[' .
                $r_x . ',' . $r_y . ',' . $r_z . '],' . '"scale":[' . $s_x . ',' . $s_y . ',' . $s_z . ']};';


            echo 'resources3D["' . $name . '"]= {' .
                '"path":"' . $path .
                '","assetid":"' . $assetid .
                '","assetname":"' . $assetname .
                '","glbID":"' . $glbID .
                '","overrideMaterial":"' . $overrideMaterial,
                '","color":"' . $color .
                '","emissive":"' . $emissive .
                '","emissiveIntensity":"' . $emissiveIntensity .
                '","roughness":"' . $roughness .
                '","metalness":"' . $metalness .
                '","categoryName":"' . $categoryName .
                '","categoryID":"' . $categoryID .
                '","isCloned":"' . $isCloned .
                '","isJoker":"' . $isJoker .
                '","isLight":"' . $isLight .
                '","lightintensity":"' . $lightintensity .
                '","shadowRadius":"' . $shadowRadius .
                '","lightdecay":"' . $lightdecay .
                '","lightdistance":"' . $lightdistance .
                '","lightangle":"' . $lightangle .
                '","lightpenumbra":"' . $lightpenumbra .
                '","lighttargetobjectname":"' . $lighttargetobjectname .
                '","lightcolor":[' . $light_color_r . ',' . $light_color_g . ',' . $light_color_b . ']' .
                ',"targetposition":[' . $target_position_x . ',' . $target_position_y . ',' . $target_position_z . ']' .
                ',"trs":selected_object_trs};';

            //echo 'console.log("resources3D");';
            echo '</script>';

        }


        return $resources3D;
    }
}
