<!--Popups when right-clicking on 3D objects: included in vr_editor -->

<script>
    function updateSpot(){
        envir.scene.traverse(function(child) {
                if (child.light != undefined)
                    if (child.light.name === transform_controls.object.name)
                        child.update();
            }
        );
    }
    
    function updateSpotConeHelper(value){
        transform_controls.object.target = envir.scene.getObjectByName(value);
        updateSpot();
    }
    
    function enableSceneEnvironmentTexture(value){
        envir.scene.environment = value ? envir.maintexture : null;
    }

    function changeRendererToneMapping(value){
        envir.renderer.toneMappingExposure = value;
    }

    function updateObjectColorPicker(picker){
        transform_controls.object.children[0].material.color.setHex("0x" + document.getElementById("ObjectColor").value);
    }

    function updateObjectEmissiveColorPicker(picker){
        transform_controls.object.children[0].material.emissive.setHex("0x" + document.getElementById("ObjectEmissiveColor").value);
    }

    function changeEmissiveIntensity(){
        transform_controls.object.children[0].material.emissiveIntensity = parseFloat(document.getElementById("ObjectEmissiveIntensity").value);
    }

    // function changeLightMapIntensity(){
    //     transform_controls.object.children[0].material.lightMapIntensity = parseFloat(document.getElementById("ObjectLightMapIntensity").value);
    // }

    function changeRoughness(){
        transform_controls.object.children[0].material.roughness = parseFloat(document.getElementById("ObjectRoughness").value);
    }

    function changeMetalness(){
        transform_controls.object.children[0].material.metalness = parseFloat(document.getElementById("ObjectMetalness").value);
    }
    
    /// Sun Color Selector
    function updateSunColorPickerLight(picker){

        var hexcol = "0x" + document.getElementById("sunColor").value;

        // Sun as object
        transform_controls.object.color.setHex(hexcol);

        // Sun as Sphere
        transform_controls.object.children[0].material.color.setHex(hexcol);

        // Sun Helper
        var lightHelper = envir.scene.getObjectByName("lightHelper_"+transform_controls.object.name);
        lightHelper.children[0].material.color.setHex(hexcol);
        lightHelper.children[1].material.color.setHex(hexcol);

        // TargetSpot
        var lightTargetSpot = envir.scene.getObjectByName("lightTargetSpot_" + transform_controls.object.name);
        lightTargetSpot.children[0].material.color.setHex(hexcol);
    }


    /// Lamp Color Selector
    function updateLampColorPickerLight(picker){
        var hexcol = "0x" + document.getElementById("lampColor").value;
        // Lamp as object
        transform_controls.object.color.setHex(hexcol);
        // Lamp as Sphere
        transform_controls.object.children[0].material.color.setHex(hexcol);
    }


    /// Spot Color Selector
    function updateSpotColorPickerLight(picker){
        var hexcol = "0x" + document.getElementById("spotColor").value;
        
        // Spot as object
        transform_controls.object.color.setHex(hexcol);
        
        // Spot as Sphere
        transform_controls.object.children[0].material.color.setHex(hexcol);

        // Spot as Helper rays
        envir.scene.traverse(function(child) {
                if (child.light != undefined)
                    if (child.light.name === transform_controls.object.name)
                        child.color.setHex(hexcol);
            }
        );
        
        updateSpot();
    }

    /// Ambient Color Selector
    function updateAmbientColorPickerLight(picker){
        var hexcol = "0x" + document.getElementById("ambientColor").value;
        // AmbientLight as object
        transform_controls.object.color.setHex(hexcol);
        // AmbientLight as Sphere
        transform_controls.object.children[0].material.color.setHex(hexcol);
    }

    
    function initPopsVals(){

        let currentColor = transform_controls.object.children[0].material.color.getHexString().toUpperCase();
        
        document.getElementById("ObjectColor").value = currentColor;
        
        document.getElementById("ObjectColor").className =
            "jscolor {valueElement:null, value:"+ currentColor +",onFineChange:'updateObjectColorPicker(this)'}";

        document.getElementById("ObjectColor").style.backgroundColor = "#" + currentColor;

    }

    
    

    
    // Set video texture when popup change
    function textureChangeFunction() {
        var url = document.getElementById("ObjectVideoTexture").value;
        var videoDom = document.createElement('video');
        videoDom.src = url;
        videoDom.load();
        var videoTexture = new THREE.VideoTexture( videoDom );
        
        
        videoTexture.wrapS = videoTexture.wrapT = THREE.RepeatWrapping;
        
        var rX = document.getElementById("ObjectVideoTextureRepeatX").value;
        var rY = document.getElementById("ObjectVideoTextureRepeatY").value;
        
        
        
        videoTexture.repeat.set( rX, rY );
        
        var rotationTexture = document.getElementById("ObjectVideoTextureRotation").value;
        videoTexture.rotation = rotationTexture;
        
        var cX = document.getElementById("ObjectVideoTextureCenterX").value;
        var cY = document.getElementById("ObjectVideoTextureCenterY").value;
        videoTexture.center = new THREE.Vector2(cX, cY);
        
        
        var movieMaterial = new THREE.MeshBasicMaterial( { map: videoTexture, side:THREE.DoubleSide } );
        setTimeout( function() {
             transform_controls.object.children[0].material = movieMaterial;
             videoDom.play();
        }, 1000 );
    }
</script>

<!-- Artifact @ Archaeology: Popup menu to for Reward item checkbox, from  -->
<div id="popUpArtifactPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2" style="min-width: 200px;display:none; max-width:450px;padding:0px;">

    <!-- The close button-->
    <a style="position:absolute;right:35px;top:10px" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none"; return false;'>
        <!-- clearAndUnbindCheckBoxProperties("artifact_reward_checkbox"); -->
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>
    
    <div id="popup_artifact_scroller" style="overflow-y: scroll; height:300px;padding: 15px;margin: 0px;">
    
        <!-- The Color of the object -->
        <label for="ObjectColor" class="mdc-textfield__label" style="top: 12px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
            Object Color:</label>
    
        <input type="text" id="ObjectColor" name="ObjectColor" title="Set a hex number, ffffff is the default (white)"
               value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateObjectColorPicker(this)'}"
               style="width: 70px;display: inline-block;padding: 2px;text-align: right;"/>
        <br />


        <!-- The Emissive Color of the object -->
        <label for="ObjectEmissiveColor" class="mdc-textfield__label" style="top: 12px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
            Object Emissive:</label>

        <input type="text" id="ObjectEmissiveColor" name="ObjectEmissiveColor" title="Set a hex number, ffffff is the default (white)"
               value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateObjectEmissiveColorPicker(this)'}"
               style="width: 70px;display: inline-block;padding: 2px;text-align: right;"/>
        <br />

        <!-- Emissive Intensity -->
        <label for="ObjectEmissiveIntensity" class="mdc-textfield__label" style="top: 12px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
            Emissive Intensity:</label>
        <div class="mdc-slider" style="width:50%; display:inline-block; height:30px">
            <input class="mdc-slider__input" type="range" min="0" max="1" value="0.5" step="0.01"
                   id="ObjectEmissiveIntensity" name="ObjectEmissiveIntensity" aria-label="Emissive intensity slider" oninput="changeEmissiveIntensity(this);">
            <div class="mdc-slider__thumb">
                <div class="mdc-slider__thumb-knob"></div>
            </div>
        </div>
        
        <br />
        
    
        <!-- Roughness -->
        <label for="ObjectRoughness" class="mdc-textfield__label" style="top: 12px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
            Roughness:</label>
        <div class="mdc-slider" style="width:50%; display:inline-block; height:30px">
            <input class="mdc-slider__input" type="range" min="0" max="1" value="0.5" step="0.01"
                   id="ObjectRoughness" name="ObjectRoughness" aria-label="Roughness slider" oninput="changeRoughness(this);">
            <div class="mdc-slider__thumb">
                <div class="mdc-slider__thumb-knob"></div>
            </div>
        </div>

        <!-- Metalness -->
        <label for="ObjectMetalness" class="mdc-textfield__label" style="top: 12px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
            Metalness:</label>
        <div class="mdc-slider" style="width:50%; display:inline-block; height:30px">
            <input class="mdc-slider__input" type="range" min="0" max="1" value="0.5" step="0.01"
                   id="ObjectMetalness" name="ObjectMetalness" aria-label="Metalness slider"
                   oninput="changeMetalness(this);">
            <div class="mdc-slider__thumb">
                <div class="mdc-slider__thumb-knob"></div>
            </div>
        </div>

        <!-- Lightmap intensity -->
<!--        <label for="ObjectLightMapIntensity" class="mdc-textfield__label" style="top: 12px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">-->
<!--            LightMap Intensity:</label>-->
<!--        <div class="mdc-slider" style="width:50%; display:inline-block; height:30px">-->
<!--            <input class="mdc-slider__input" type="range" min="0" max="1" value="0.5" step="0.01"-->
<!--                   id="ObjectLightMapIntensity" name="ObjectLightMapIntensity" aria-label="LightMap Intensity slider"-->
<!--                   oninput="changeLightMapIntensity(this);">-->
<!--            <div class="mdc-slider__thumb">-->
<!--                <div class="mdc-slider__thumb-knob"></div>-->
<!--            </div>-->
<!--        </div>-->
        
        <!-- The Video texture of the object -->
        <label for="ObjectVideoTexture" class="mdc-textfield__label" style="top: 16px; position: relative; bottom: 5px; margin-bottom: 15px; display: inline-block; vertical-align: center;">
            Texture:</label>
    
        <select id="ObjectVideoTexture" name="ObjectVideoTexture" title="Set a texture"
                style="width: 250px;display: inline-block;text-align: right;margin-left: 20px;margin-top: 15px;vertical-align: middle;"
                onchange="textureChangeFunction(this)">
            <option selected="selected">Choose one</option>
            <?php
                foreach($videos as $v){
                    echo "<option value='$v'>$v</option>";
               }
            ?>
        </select>
        
        <br />
    
        <!-- The Video texture rotation -->
        <label for="ObjectVideoTextureRotation" class="mdc-textfield__label" style="top: 16px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
            Video Texture Rotation:</label>
    
        <input type="text" id="ObjectVideoTextureRotation" name="ObjectVideoTextureRotation" title="Texture Rotation"
               value="0" maxlength="3" class="" onchange="textureChangeFunction(this)"
               style="width: 70px;display: inline-block;padding: 2px;text-align: right;"/>
        <br />
    
        <!-- The Video texture center U -->
        <label for="ObjectVideoTextureCenterX" class="mdc-textfield__label" style="top: 16px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
            Video Texture Center U:</label>
        <input type="text" id="ObjectVideoTextureCenterX" name="ObjectVideoTextureCenterX" title="Texture Center X"
               value="0" maxlength="3" class="" onchange="textureChangeFunction(this)"
               style="width: 70px;display: inline-block;padding: 2px;text-align: right;"/>
        <br />
        
        <!-- The Video texture center V -->
        <label for="ObjectVideoTextureCenterY" class="mdc-textfield__label" style="top: 16px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
            Video Texture Center V:</label>
        <input type="text" id="ObjectVideoTextureCenterY" name="ObjectVideoTextureCenterY" title="Texture Center Y"
               value="0" maxlength="3" class="" onchange="textureChangeFunction(this)"
               style="width: 70px;display: inline-block;padding: 2px;text-align: right;"/>
        <br />
    
        <!-- The Video texture repeat X -->
        <label for="ObjectVideoTextureRepeatX" class="mdc-textfield__label" style="top: 16px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
            Video Texture Repeat X:</label>
        <input type="text" id="ObjectVideoTextureRepeatX" name="ObjectVideoTextureRepeatX" title="Texture Repeat X"
               value="0" maxlength="3" class="" onchange="textureChangeFunction(this)"
               style="width: 70px;display: inline-block;padding: 2px;text-align: right;"/>
        <br />
        
        <!-- The Video texture repeat Y -->
        <label for="ObjectVideoTextureRepeatY" class="mdc-textfield__label" style="top: 16px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
            Video Texture Repeat Y:</label>
        <input type="text" id="ObjectVideoTextureRepeatY" name="ObjectVideoTextureRepeatY" title="Texture Repeat Y"
               value="0" maxlength="3" class="" onchange="textureChangeFunction(this)"
               style="width: 70px;display: inline-block;padding: 2px;text-align: right;"/>
    
        <br />
        
        <!--  Reward checkbox -->
        <label for="artifact_reward_checkbox" class="mdc-textfield__label"
               style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">Is a reward item?</label>
        <input type="checkbox" title="Select if it is a reward item"  id="artifact_reward_checkbox" name="artifact_reward_checkbox"
               class="mdc-textfield__input mdc-theme--text-primary-on-light"
               style="width: 6ch;padding: 2px;display: inline-block; text-align: right;">
        <br />
    </div>
</div>

<!-- Sun @ Archaeology: Popup menu to for Sun Intensity and Color -->
<div id="popUpSunPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2" style="max-width: 280px; display:none">

    <!-- The close button-->
    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none";  return false;'>
        <!--        clearAndUnbindCheckBoxProperties("poi_video_reward_checkbox");-->
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>

    <!-- The intensity-->
    <label for="sunIntensity" class="mdc-textfield__label" style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
        Set Sun intensity:</label>

    <input type="text" id="sunIntensity" name="sunIntensity" title="Set a number from 0 to infinite, 1 is the default"
           value="1" maxlength="4"
           class="mdc-textfield__input" style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
           onkeyup="transform_controls.object.intensity = this.value;"/>


    <!-- The Color of the sun-->
    <label for="sunColor" class="mdc-textfield__label" style="top: 12px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
        Sun Color in Hex:</label>

    <input type="text" id="sunColor" name="sunColor" title="Set a hex number, ffffff is the default (white)"
           value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateSunColorPickerLight(this)'}"
           style="width: 70px;display: inline-block;padding: 2px;text-align: right;"/>

</div>

<!-- Lamp @ Archaeology: Popup menu to for Lamp Decay, Power, Distance and Color -->
<div id="popUpLampPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2" style="min-width:250px;display:none; max-width:300px">

    <!-- The close button-->
    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none";  return false;'>
        <!--        clearAndUnbindCheckBoxProperties("poi_video_reward_checkbox");-->
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>

    <!-- The intensity-->
    <label for="lampPower" class="mdc-textfield__label" style="top: 8px; position: initial; width: 160px; display: inline-block;margin-top: 15px;">
        Set Lamp Power:</label>

    <input type="text" id="lampPower" name="lampPower" title="Set a number from 0 to infinite, 1 is the default"
           value="1" maxlength="4"
           class="mdc-textfield__input" style="width: 6ch; padding: 2px; display: inline; text-align: right;"
           onkeyup="transform_controls.object.intensity = this.value"/>

    <!-- The Color of the Lamp-->
    <label for="lampColor" class="mdc-textfield__label" style="top: 12px; position: relative; bottom: 5px; margin-bottom: 15px; width: 160px; display: inline-block; vertical-align: bottom;">
        Lamp Color in Hex:</label>

    <input type="text" id="lampColor" name="lampColor" title="Set a hex number, ffffff is the default (white)"
           value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateLampColorPickerLight(this)'}"
           style="width: 70px;display: inline-block;padding: 2px;text-align: right;"/>

    <!-- The distance-->
    <label for="lampDistance" class="mdc-textfield__label" style="position: initial; width: 160px; display: inline-block; margin-top: 15px;">
        Set Lamp Distance:</label>

    <input type="text" id="lampDistance" name="lampDistance" title="Set a number from 0 to infinite, 100 is the default"
           value="100" maxlength="4"
           class="mdc-textfield__input" style="width: 7ch; padding: 2px; display: inline-block;text-align: right;"
           onkeyup="transform_controls.object.distance = this.value"/>

    <!-- The Decay -->
    <label for="lampDecay" class="mdc-textfield__label" style="position: initial; width: 160px; display: inline-block; margin-top: 15px;">
        Set Lamp Decay:</label>

    <input type="text" id="lampDecay" name="lampDecay" title="Set a number from 0 to infinite, 2 is the default"
           value="2" maxlength="4" class="mdc-textfield__input" style="width: 7ch; padding: 2px; display: inline-block;text-align: right;" onkeyup="transform_controls.object.decay = this.value"/>

    <!-- The Radius -->
    <label for="lampRadius" class="mdc-textfield__label" style="position: initial; width: 160px; display: inline-block; margin-top: 15px;">
        Set Lamp Radius:</label>

    <input type="text" id="lampRadius" name="lampRadius" title="Set a number from 0 to infinite, 2 is the default"
           value="8" maxlength="3" class="mdc-textfield__input" style="width: 7ch; padding: 2px; display: inline-block;text-align: right;" onkeyup="transform_controls.object.shadow.radius = this.value"/>
</div>

<!-- Spot @ Archaeology: Popup menu to for Lamp Decay, Power, Distance and Color -->
<div id="popUpSpotPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2" style="min-width: 250px;display:none; max-width:280px">

    <!-- The close button-->
    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none";  return false;'>
        <!--        clearAndUnbindCheckBoxProperties("poi_video_reward_checkbox");-->
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>


    <!-- The Target object -->
    <label for="spotTargetObject" class="mdc-textfield__label" style="position: initial; width: 150px; display: inline-block; margin-top: 15px;">
        Set target object:</label>

    <select id="spotTargetObject" name="spotTargetObject" title="Set object to place spot among the scene objects"
            class="mdc-select" style="padding: 2px; display: inline-block;"
            onchange="updateSpotConeHelper(this.value)">
    </select>


    <!-- The intensity-->
    <label for="spotPower" class="mdc-textfield__label" style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
        Set Spot Power:</label>

    <input type="text" id="spotPower" name="spotPower" title="Set a number from 0 to infinite, 1 is the default"
           value="1" maxlength="4"
           class="mdc-textfield__input" style="width: 7ch;padding: 2px;display: inline; text-align: right;"
           onkeyup="transform_controls.object.power = this.value; updateSpot();"/>

    <!-- The Color of the Lamp-->
    <label for="spotColor" class="mdc-textfield__label" style="top: 12px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
        Spot Color in Hex:</label>

    <input type="text" id="spotColor" name="spotColor" title="Set a hex number, ffffff is the default (white)"
           value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateSpotColorPickerLight(this)'}"
           style="width: 70px;display: inline-block;padding: 2px;text-align: right;"/>

    <!-- The distance-->
    <label for="spotDistance" class="mdc-textfield__label" style="position: initial; width: 150px; display: inline-block; margin-top: 15px;">
        Set Spot Distance:</label>

    <input type="text" id="spotDistance" name="spotDistance" title="Set a number from 0 to infinite, 100 is the default"
           value="100" maxlength="4"
           class="mdc-textfield__input" style="width: 7ch; padding: 2px; display: inline-block; text-align: right;"
           onkeyup="transform_controls.object.distance = this.value; updateSpot();"/>

    <!-- The Decay -->
    <label for="spotDecay" class="mdc-textfield__label" style="position: initial; width: 150px; display: inline-block; margin-top: 15px;">
        Set Spot Decay:</label>

    <input type="text" id="spotDecay" name="spotDecay" title="Set a number from 0 to infinite, 2 is the default"
           value="2" maxlength="4" class="mdc-textfield__input" style="width: 7ch; padding: 2px; display: inline-block;text-align: right;" onkeyup="transform_controls.object.decay = this.value; updateSpot();"/>

    <!-- The Angle -->
    <label for="spotAngle" class="mdc-textfield__label" style="position: initial; width: 150px; display: inline-block; margin-top: 15px;">
        Set Spot Angle:</label>

    <input type="text" id="spotAngle" name="spotAngle" title="Set a number from 0 to pi/2,  pi/4 is the default"
           value="0.785" maxlength="5" class="mdc-textfield__input" style="width: 7ch; padding: 2px; display: inline-block;text-align: right;" onkeyup="transform_controls.object.angle = this.value; updateSpot();"/>


    <!-- The Penumbra -->
    <label for="spotPenumbra" class="mdc-textfield__label" style="position: initial; width: 150px; display: inline-block; margin-top: 15px;">
        Set Penumbra:</label>

    <input type="text" id="spotPenumbra" name="spotPenumbra" title="Set a number from 0 to 1,  0 is the default"
           value="0" maxlength="4" class="mdc-textfield__input" style="width: 7ch; padding: 2px; display: inline-block;text-align: right;" onkeyup="transform_controls.object.penumbra = this.value; updateSpot();"/>

</div>


<!-- Spot @ Archaeology: Popup menu to for Lamp Decay, Power, Distance and Color -->
<div id="popUpAmbientPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2" style="min-width: 250px;display:none; max-width:280px">

    <!-- The close button-->
    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none";  return false;'>
        <!--        clearAndUnbindCheckBoxProperties("poi_video_reward_checkbox");-->
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>

    <!-- The intensity-->
    <label for="ambientIntensity" class="mdc-textfield__label" style="top: 8px; font-size:10pt; position: initial; width: 100px; display: inline-block;margin-top: 15px;">
        Set Ambient Light intensity:</label>

    <input type="text" id="ambientIntensity" name="ambientIntensity" title="Set a number from 0 to infinite, 1 is the default"
           value="1" maxlength="4"
           class="mdc-textfield__input" style="width: 7ch;padding: 2px;display: inline; text-align: right;"
           onkeyup="transform_controls.object.intensity = this.value;"/>

    <br />
    <!-- The Color of the Ambient light-->
    <label for="ambientColor" class="mdc-textfield__label" style="top: 12px; position: relative;  font-size:10pt; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
        Ambient Color in Hex:</label>

    <input type="text" id="ambientColor" name="ambientColor" title="Set a hex number, ffffff is the default (white)"
           value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateAmbientColorPickerLight(this)'}"
           style="width: 70px;display: inline-block;padding: 2px;text-align: right;"/>

</div>





<!-- Door@Archaeology: Interface for Changing the door properties -->
<div id="popUpDoorPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2"
     style="min-width: 240px; max-width:300px; display:none">

    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none"; clearAndUnbind("popupDoorSelect", "doorid", ""); return false;'>
       <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>

    <p class="mdc-typography--subheading1" style=""> Door options </p>
    <div class="mdc-textfield FullWidth" data-mdc-auto-init="MDCTextfield" id="doorInputTextfield">
        <input id="doorid" name="doorid" type="text" class="mdc-textfield__input mdc-theme--text-primary-on-light FullWidth"
               style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">
        <label for="doorid" class="mdc-textfield__label">Enter a door name </label>
        <div class="mdc-textfield__bottom-line"></div>
    </div>

    <i title="Select a destination" class="material-icons mdc-theme--text-icon-on-background"
       style="vertical-align: text-bottom;">directions</i>

    <select title="Select a destination" id="popupDoorSelect" name="popupDoorSelect"
            class="mdc-select--subheading1" style="min-width: 70%; max-width:85%; overflow:hidden; border: none; border-bottom: 1px solid rgba(0,0,0,.23);">
    </select>

    <input type="checkbox" title="Select if it is a reward item" id="door_reward_checkbox" name="door_reward_checkbox"
           class="mdc-textfield__input mdc-theme--text-primary-on-light" style="margin-top:20px; margin-left:10px;">
    <label for="door_reward_checkbox" class="mdc-textfield__label" style="margin-left:15px;">Is a reward item?</label>
</div>

<!-- Marker@WindEnergy: Interface for Changing the Marker properties :  -->
<div id="popUpMarkerPropertiesDiv"
     class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2"
     style="min-width: 100%; width: auto; bottom: auto;">

    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none"; clearAndUnbind("archaeology_penalty", null, null); clearAndUnbind("hv_distance_penalty", null, null); clearAndUnbind("natural_resource_proximity_penalty", null, null); return false;'>
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>

    <div class="mdc-layout-grid">
        <div class="mdc-layout-grid__inner">
            
            <?php if ($project_scope == 1) { ?>

                <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
                    <table>
                        <tr>
                            <td>
                                <label for="archaeology_penalty" class="mdc-textfield__label" style="position:inherit">Archaeology penalty</label>
                            </td>
                            <td>
                                <select title="" id="archaeology_penalty" name="archaeology_penalty" style="width:50px" ></select>
                            </td>
                            <td>
                                <i title="Define penalties" class="material-icons mdc-theme--text-icon-on-background" style="vertical-align: text-bottom;">attach_money</i>
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <label for="hv_distance_penalty" class="mdc-textfield__label" style="position:inherit">Distance from High voltage lines penalty</label>
                            </td>
                            <td>
                                <select title="" id="hv_distance_penalty" name="hv_distance_penalty" style="width:50px">
                                </select>
                            </td>
                            <td>
                                <i title="Define penalties" class="material-icons mdc-theme--text-icon-on-background" style="vertical-align: text-bottom;">attach_money</i>
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <label for="natural_resource_proximity_penalty" class="mdc-textfield__label" style="position:inherit">Natural park proximity penalty</label>
                            </td>
                            <td>
                                <select title="" id="natural_resource_proximity_penalty" name="natural_resource_proximity_penalty" style="width:50px">
                                </select>
                            </td>
                            <td>
                                <i title="Define penalties" class="material-icons mdc-theme--text-icon-on-background" style="vertical-align: text-bottom;">attach_money</i>
                            </td>
                        </tr>
                    </table>
                </div>
            
            <?php } ?>

            <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
                <!--                <p class="mdc-typography--title">Small Turbine</p>-->
                <iframe style="height: 400px; width: 100%; border:none;" id="turbine1-iframe"></iframe>
            </div>
            <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
                <!--                <p class="mdc-typography--title">Normal Turbine</p>-->
                <iframe style="height: 400px; width: 100%; border:none;" id="turbine2-iframe"></iframe>
            </div>
            <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
                <!--                <p class="mdc-typography--title">Big Turbine</p>-->
                <iframe style="height: 400px; width: 100%; border:none;" id="turbine3-iframe"></iframe>
            </div>

        </div>
    </div>

    <!--        <i title="Select a destination" class="material-icons mdc-theme--text-icon-on-background"-->
    <!--           style="vertical-align: text-bottom;">directions</i>-->
    <!--        <select title="Select a destination" id="popupMarkerSelect" name="popupMarkerSelect"-->
    <!--                class="mdc-select--subheading1" style="min-width: 70%; max-width:85%; overflow:hidden; border: none; border-bottom: 1px solid rgba(0,0,0,.23);">-->
    <!--        </select>-->

</div>

<!-- Microscope or Textbook @ Chemistry: Popup menu to Select a scene to go, from  -->
<?php if ($project_scope == 1) { ?>
    <div id="chemistrySceneSelectPopupDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2" style="min-width: 360px; display:none">

        <a style="float: right;" type="button" class="mdc-theme--primary"
           onclick='this.parentNode.style.display = "none"; clearAndUnbindMicroscopeTextbookProperties(); return false;'>
            <i class="material-icons" style="cursor: pointer; float: right;">close</i>
        </a>

        <i title="Select a scene to load" class="material-icons mdc-theme--text-icon-on-background" style="vertical-align: text-bottom">directions</i>
        <select title="Select a scene" id="chemistrySceneSelectComponent" class="mdc-select">
        </select>
    </div>
<?php } ?>

<!-- Gate @ Chemistry: Popup menu to Select a scene to go, from -->
<div id="chemistryGatePopupDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2" style="min-width: 360px; display:none">

    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none"; clearAndUnbindBoxProperties(); return false;'>
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>

    <i title="Select a functional Category label" class="material-icons mdc-theme--text-icon-on-background" style="vertical-align: text-bottom">label</i>
    <select title="Select a functional category label" id="chemistryGateComponent" class="mdc-select">
    </select>
</div>





<!-- POI IT @ Archaeology: Popup menu to for Reward item checkbox, from  -->
<!--<div id="popUpPoiImageTextPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2" style="min-width: 200px;display:none">-->
<!---->
<!--     The close button-->
<!--    <a style="float: right;" type="button" class="mdc-theme--primary"-->
<!--       onclick='this.parentNode.style.display = "none"; clearAndUnbindCheckBoxProperties("poi_image_text_reward_checkbox"); return false;'>-->
<!--        <i class="material-icons" style="cursor: pointer; float: right;">close</i>-->
<!--    </a>-->
<!---->
<!--    The checkbox-->
<!--    <input type="checkbox" title="Select if it is a reward item"  id="poi_image_text_reward_checkbox" name="poi_image_text_reward_checkbox"-->
<!--           class="mdc-textfield__input mdc-theme--text-primary-on-light" style="width: 100px !important; float: right; margin-left: 80px; margin-top: 20px;">-->
<!--    <label for="poi_image_text_reward_checkbox" class="mdc-textfield__label"-->
<!--           style="margin-left: 10px; bottom: 8px; margin-bottom: 0px;">Is a reward item?</label>-->
<!---->
<!--</div>-->
<!---->

<!-- POI Video @ Archaeology: Popup menu to for Reward item checkbox, from -->
<!--<div id="popUpPoiVideoPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2" style="min-width: 200px;display:none">-->
<!---->
<!--    The close button-->
<!--    <a style="float: right;" type="button" class="mdc-theme--primary"-->
<!--       onclick='this.parentNode.style.display = "none"; clearAndUnbindCheckBoxProperties("poi_video_reward_checkbox"); return false;'>-->
<!--        <i class="material-icons" style="cursor: pointer; float: right;">close</i>-->
<!--    </a>-->
<!---->

<!--    The checkbox-->
<!---->
<!--    <input type="checkbox" title="Select if it is a reward item"  id="poi_video_reward_checkbox" name="poi_image_text_reward_checkbox"-->
<!--           class="mdc-textfield__input mdc-theme--text-primary-on-light"-->
<!--           style="margin-left: 29px; width: 150px !important; float: right;">-->
<!--    <label for="poi_video_reward_checkbox" class="mdc-textfield__label" style="margin-left: 10px; bottom: 8px; margin-bottom: 0px;">-->
<!--        Is a reward item?</label>-->
<!---->
<!--</div>-->


