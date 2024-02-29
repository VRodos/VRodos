<!--Popups when right-clicking on 3D objects: included in vr_editor -->


<script>

    function changeOverrideMaterial() {
        transform_controls.object.children[0].overrideMaterial = 'true';
    }


    function updateSpot() {
        envir.scene.traverse(function (child) {
                if (child.light != undefined)
                    if (child.light.name === transform_controls.object.name)
                        child.update();
            }
        );
    }

    function updateSpotConeHelper(value) {
        transform_controls.object.target = envir.scene.getObjectByName(value);
        updateSpot();
    }

    function enableSceneEnvironmentTexture(value) {
        envir.scene.environment = value ? envir.maintexture : null;
    }

    function keepScaleAspectRatio(value) {
        envir.scene.keepScaleAspectRatio = value;
    }

    function toggleBroadcastChat(value) {
        envir.scene.enableGeneralChat = value;
        saveChanges();
    }

    function toggleEnableAvatar(value) {
        envir.scene.enableAvatar = value;
        saveChanges();
    }

    function toggleDisableMovement(value) {
        envir.scene.disableMovement = value;
        saveChanges();
    }

    function changeRendererToneMapping(value) {
        envir.renderer.toneMappingExposure = value;
    }

    function updateObjectColorPicker(picker) {
        transform_controls.object.children[0].material.color.setHex("0x" + document.getElementById("ObjectColor").value);
    }

    function updateObjectEmissiveColorPicker(picker) {
        transform_controls.object.children[0].material.emissive.setHex("0x" + document.getElementById("ObjectEmissiveColor").value);
    }

    function changeEmissiveIntensity() {
        transform_controls.object.children[0].material.emissiveIntensity = parseFloat(document.getElementById("ObjectEmissiveIntensity").value);
    }

    // function changeLightMapIntensity(){
    //     transform_controls.object.children[0].material.lightMapIntensity = parseFloat(document.getElementById("ObjectLightMapIntensity").value);
    // }

    function changeRoughness() {
        transform_controls.object.children[0].material.roughness = parseFloat(document.getElementById("ObjectRoughness").value);
    }

    function changeMetalness() {
        transform_controls.object.children[0].material.metalness = parseFloat(document.getElementById("ObjectMetalness").value);
    }

    function validate(evt) {
        var theEvent = evt || window.event;

        // Handle paste
        if (theEvent.type === 'paste') {
            key = event.clipboardData.getData('text/plain');
        } else {
        // Handle key press
            var key = theEvent.keyCode || theEvent.which;
            key = String.fromCharCode(key);
        }
        var regex = /^$|^-?(\\d+)?(\\.?\\d*)?$/; //^-?[0-9]*(?:\.[0-9]+)?$/
        var re = new RegExp('^$|^-?(\\d+)?(\\.?\\d*)?$');
        if( !regex.test(key) ) {
            theEvent.returnValue = false;
            if(theEvent.preventDefault) theEvent.preventDefault();
        }
    }

    



    /// Sun Color Selector
    function updateSunColorPickerLight(picker) {

        var hexcol = "0x" + document.getElementById("sunColor").value;

        // Sun as object
        transform_controls.object.color.setHex(hexcol);

        // Sun as Sphere
        transform_controls.object.children[0].material.color.setHex(hexcol);

        // Sun Helper
        var lightHelper = envir.scene.getObjectByName("lightHelper_" + transform_controls.object.name);
        lightHelper.children[0].material.color.setHex(hexcol);
        lightHelper.children[1].material.color.setHex(hexcol);

        // TargetSpot
        var lightTargetSpot = envir.scene.getObjectByName("lightTargetSpot_" + transform_controls.object.name);
        lightTargetSpot.children[0].material.color.setHex(hexcol);
    }


    /// Lamp Color Selector
    function updateLampColorPickerLight(picker) {
        var hexcol = "0x" + document.getElementById("lampColor").value;
        // Lamp as object
        transform_controls.object.color.setHex(hexcol);
        // Lamp as Sphere
        transform_controls.object.children[0].material.color.setHex(hexcol);
    }


    /// Spot Color Selector
    function updateSpotColorPickerLight(picker) {
        var hexcol = "0x" + document.getElementById("spotColor").value;

        // Spot as object
        transform_controls.object.color.setHex(hexcol);

        // Spot as Sphere
        transform_controls.object.children[0].material.color.setHex(hexcol);

        // Spot as Helper rays
        envir.scene.traverse(function (child) {
                if (child.light != undefined)
                    if (child.light.name === transform_controls.object.name)
                        child.color.setHex(hexcol);
            }
        );

        updateSpot();
    }

    /// Ambient Color Selector
    function updateAmbientColorPickerLight(picker) {
        var hexcol = "0x" + document.getElementById("ambientColor").value;
        // AmbientLight as object
        transform_controls.object.color.setHex(hexcol);
        // AmbientLight as Sphere
        transform_controls.object.children[0].material.color.setHex(hexcol);
    }


    // Set video texture when popup change
    function textureChangeFunction() {
        var url = document.getElementById("ObjectVideoTexture").value;
        var videoDom = document.createElement('video');
        videoDom.src = url;
        videoDom.load();
        var videoTexture = new THREE.VideoTexture(videoDom);


        videoTexture.wrapS = videoTexture.wrapT = THREE.RepeatWrapping;

        var rX = document.getElementById("ObjectVideoTextureRepeatX").value;
        var rY = document.getElementById("ObjectVideoTextureRepeatY").value;



        videoTexture.repeat.set(rX, rY);

        var rotationTexture = document.getElementById("ObjectVideoTextureRotation").value;
        videoTexture.rotation = rotationTexture;

        var cX = document.getElementById("ObjectVideoTextureCenterX").value;
        var cY = document.getElementById("ObjectVideoTextureCenterY").value;
        videoTexture.center = new THREE.Vector2(cX, cY);


        var movieMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
        setTimeout(function () {
            transform_controls.object.children[0].material = movieMaterial;
            videoDom.play();
        }, 1000);


    }
</script>

<!-- Sun @ Archaeology: Popup menu to for Sun Intensity and Color -->
<div id="popUpSunPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2"
     style="max-width: 280px; display:none;">

    <!-- The close button-->
    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none";  return false;'>
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>

    <!-- The intensity-->
    <label for="sunIntensity" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
        Set Sun intensity:</label>

    <input type="text" id="sunIntensity" name="sunIntensity" title="Set a number from 0 to infinite, 1 is the default"
           value="1" maxlength="4" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
           onkeyup="transform_controls.object.intensity = this.value;" />


    <!-- The Color of the sun-->
    <label for="sunColor" class="mdc-textfield__label"
           style="top: 12px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
        Sun Color in Hex:</label>

    <input type="text" id="sunColor" name="sunColor" title="Set a hex number, ffffff is the default (white)"
           value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateSunColorPickerLight(this)'}"
           style="width: 70px;display: inline-block;padding: 2px;text-align: right;" />
    <label for="castShadow" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
        Enable Shadows:</label>

    <input type="checkbox" id="castShadow" name="castShadow" value="shadow_bool" checked="true" title="Enable cast shadow functionality"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />

           
    <label for="sunShadowCameraBottom" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Bottom:</label>

    <input type="text"   id="sunShadowCameraBottom" name="sunShadowCameraBottom" 
           value="-200" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />
    
    <label for="sunShadowCameraTop" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Top:</label>

    <input type="text"  id="sunShadowCameraTop" name="sunShadowCameraTop" 
           value="200" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />

    <label for="sunShadowCameraLeft" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Left:</label>

    <input type="text"  id="sunShadowCameraLeft" name="sunShadowCameraLeft" 
           value="-200" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />
    
    <label for="sunShadowCameraRight" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Right:</label>

    <input type="text"  id="sunShadowCameraRight" name="sunShadowCameraRight" 
           value="200" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />

    <label for="sunshadowMapHeight" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Map Height:</label>

    <input type="text"  id="sunshadowMapHeight" name="sunshadowMapHeight" 
           value="1024" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />
    
    <label for="sunshadowMapWidth" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Map Width:</label>

    <input type="text"  id="sunshadowMapWidth" name="sunshadowMapWidth" 
           value="1024" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />
    
    <label for="sunshadowBias" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Bias (Try decrementing e.g.: -0.001, if your scene objects have a large Y distance from ground):</label>

    <input type="text" id="sunshadowBias"  name="sunshadowBias" 
           value="-0.001" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />
</div>

<!-- Lamp @ Archaeology: Popup menu to for Lamp Decay, Power, Distance and Color -->
<div id="popUpLampPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2"
     style="min-width:250px;display:none; max-width:300px">

    <!-- The close button-->
    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none"; saveChanges(); return false;'>
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>

    <!-- The intensity-->
    <label for="lampPower" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 160px; display: inline-block;margin-top: 15px;">
        Set Lamp Power:</label>

    <input type="text" id="lampPower" name="lampPower" title="Set a number from 0 to infinite, 1 is the default"
           value="10" maxlength="4" class="mdc-textfield__input"
           style="width: 6ch; padding: 2px; display: inline; text-align: right;"
           onkeyup="transform_controls.object.power = this.value" />

    <!-- The Color of the Lamp-->
    <label for="lampColor" class="mdc-textfield__label"
           style="top: 12px; position: relative; bottom: 5px; margin-bottom: 15px; width: 160px; display: inline-block; vertical-align: bottom;">
        Lamp Color in Hex:</label>

    <input type="text" id="lampColor" name="lampColor" title="Set a hex number, ffffff is the default (white)"
           value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateLampColorPickerLight(this)'}"
           style="width: 70px;display: inline-block;padding: 2px;text-align: right;" />

    <!-- The distance-->
    <label for="lampDistance" class="mdc-textfield__label"
           style="position: initial; width: 160px; display: inline-block; margin-top: 15px;">
        Set Lamp Distance:</label>

    <input type="text" id="lampDistance" name="lampDistance" title="Set a number from 0 to infinite, 100 is the default"
           value="100" maxlength="4" class="mdc-textfield__input"
           style="width: 7ch; padding: 2px; display: inline-block;text-align: right;"
           onkeyup="transform_controls.object.distance = this.value" />

    <!-- The Decay -->
    <label for="lampDecay" class="mdc-textfield__label"
           style="position: initial; width: 160px; display: inline-block; margin-top: 15px;">
        Set Lamp Decay:</label>

    <input type="text" id="lampDecay" name="lampDecay" title="Set a number from 0 to infinite, 2 is the default"
           value="2" maxlength="4" class="mdc-textfield__input"
           style="width: 7ch; padding: 2px; display: inline-block;text-align: right;"
           onkeyup="transform_controls.object.decay = this.value" />

    <!-- The Radius -->
    <label for="lampRadius" class="mdc-textfield__label"
           style="position: initial; width: 160px; display: inline-block; margin-top: 15px;">
        Set Lamp Radius:</label>

    <input type="text" id="lampRadius" name="lampRadius" title="Set a number from 0 to infinite, 2 is the default"
           value="8" maxlength="3" class="mdc-textfield__input"
           style="width: 7ch; padding: 2px; display: inline-block;text-align: right;"
           onkeyup="transform_controls.object.shadow.radius = this.value" />

    <label for="lampcastShadow" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
        Enable Shadows:</label>

    <input type="checkbox" id="lampcastShadow" name="lampcastShadow" value="shadow_bool" checked="true" title="Enable cast shadow functionality"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />
       
    <label for="lampShadowCameraBottom" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Bottom:</label>

    <input type="text"   id="lampShadowCameraBottom" name="lampShadowCameraBottom" 
           value="-200" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />
    
    <label for="lampShadowCameraTop" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Top:</label>

    <input type="text"  id="lampShadowCameraTop" name="lampShadowCameraTop" 
           value="200" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />

    <label for="lampShadowCameraLeft" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Left:</label>

    <input type="text"  id="lampShadowCameraLeft" name="lampShadowCameraLeft" 
           value="-200" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />
    
    <label for="lampShadowCameraRight" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Right:</label>

    <input type="text"  id="lampShadowCameraRight" name="lampShadowCameraRight" 
           value="200" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />

    <label for="lampshadowMapHeight" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Map Height:</label>

    <input type="text"  id="lampshadowMapHeight" name="lampshadowMapHeight" 
           value="1024" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />
    
    <label for="lampshadowMapWidth" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
         Shadow Map Width:</label>

    <input type="text"  id="lampshadowMapWidth" name="lampshadowMapWidth" 
           value="1024" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />
    
    <label for="lampshadowBias" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
        Shadow Bias (Try decrementing e.g.: -0.001, if your scene objects have a large Y distance from ground):</label>

    <input type="text" id="lampshadowBias"  name="lampshadowBias" 
           value="-0.001" maxlength="6" class="mdc-textfield__input"
           style="width: 6ch;padding: 2px;display: inline-block; text-align: right;"
            />

</div>

<!-- Spot @ Archaeology: Popup menu to for Lamp Decay, Power, Distance and Color -->
<div id="popUpSpotPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2"
     style="min-width: 250px;display:none; max-width:280px">

    <!-- The close button-->
    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none";  return false;'>
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>


    <!-- The Target object -->
    <label for="spotTargetObject" class="mdc-textfield__label"
           style="position: initial; width: 150px; display: inline-block; margin-top: 15px;">
        Set target object:</label>

    <select id="spotTargetObject" name="spotTargetObject" title="Set object to place spot among the scene objects"
            class="mdc-select" style="padding: 2px; display: inline-block;" onchange="updateSpotConeHelper(this.value)">
    </select>


    <!-- The intensity-->
    <label for="spotPower" class="mdc-textfield__label"
           style="top: 8px; position: initial; width: 150px; display: inline-block;margin-top: 15px;">
        Set Spot Power:</label>

    <input type="text" id="spotPower" name="spotPower" title="Set a number from 0 to infinite, 1 is the default"
           value="1" maxlength="4" class="mdc-textfield__input"
           style="width: 7ch;padding: 2px;display: inline; text-align: right;"
           onkeyup="transform_controls.object.power = this.value; updateSpot();" />

    <!-- The Color of the Lamp-->
    <label for="spotColor" class="mdc-textfield__label"
           style="top: 12px; position: relative; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
        Spot Color in Hex:</label>

    <input type="text" id="spotColor" name="spotColor" title="Set a hex number, ffffff is the default (white)"
           value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateSpotColorPickerLight(this)'}"
           style="width: 70px;display: inline-block;padding: 2px;text-align: right;" />

    <!-- The distance-->
    <label for="spotDistance" class="mdc-textfield__label"
           style="position: initial; width: 150px; display: inline-block; margin-top: 15px;">
        Set Spot Distance:</label>

    <input type="text" id="spotDistance" name="spotDistance" title="Set a number from 0 to infinite, 100 is the default"
           value="100" maxlength="4" class="mdc-textfield__input"
           style="width: 7ch; padding: 2px; display: inline-block; text-align: right;"
           onkeyup="transform_controls.object.distance = this.value; updateSpot();" />

    <!-- The Decay -->
    <label for="spotDecay" class="mdc-textfield__label"
           style="position: initial; width: 150px; display: inline-block; margin-top: 15px;">
        Set Spot Decay:</label>

    <input type="text" id="spotDecay" name="spotDecay" title="Set a number from 0 to infinite, 2 is the default"
           value="2" maxlength="4" class="mdc-textfield__input"
           style="width: 7ch; padding: 2px; display: inline-block;text-align: right;"
           onkeyup="transform_controls.object.decay = this.value; updateSpot();" />

    <!-- The Angle -->
    <label for="spotAngle" class="mdc-textfield__label"
           style="position: initial; width: 150px; display: inline-block; margin-top: 15px;">
        Set Spot Angle:</label>

    <input type="text" id="spotAngle" name="spotAngle" title="Set a number from 0 to pi/2,  pi/4 is the default"
           value="0.785" maxlength="5" class="mdc-textfield__input"
           style="width: 7ch; padding: 2px; display: inline-block;text-align: right;"
           onkeyup="transform_controls.object.angle = this.value; updateSpot();" />


    <!-- The Penumbra -->
    <label for="spotPenumbra" class="mdc-textfield__label"
           style="position: initial; width: 150px; display: inline-block; margin-top: 15px;">
        Set Penumbra:</label>

    <input type="text" id="spotPenumbra" name="spotPenumbra" title="Set a number from 0 to 1,  0 is the default"
           value="0" maxlength="4" class="mdc-textfield__input"
           style="width: 7ch; padding: 2px; display: inline-block;text-align: right;"
           onkeyup="transform_controls.object.penumbra = this.value; updateSpot();" />

</div>


<!-- Spot @ Archaeology: Popup menu to for Lamp Decay, Power, Distance and Color -->
<div id="popUpAmbientPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2"
     style="min-width: 250px;display:none; max-width:280px">

    <!-- The close button-->
    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none";  return false;'>
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>

    <!-- The intensity-->
    <label for="ambientIntensity" class="mdc-textfield__label"
           style="top: 8px; font-size:10pt; position: initial; width: 100px; display: inline-block;margin-top: 15px;">
        Set Ambient Light intensity:</label>

    <input type="text" id="ambientIntensity" name="ambientIntensity"
           title="Set a number from 0 to infinite, 1 is the default" value="1" maxlength="4" class="mdc-textfield__input"
           style="width: 7ch;padding: 2px;display: inline; text-align: right;"
           onkeyup="transform_controls.object.intensity = this.value;" />

    <br />
    <!-- The Color of the Ambient light-->
    <label for="ambientColor" class="mdc-textfield__label"
           style="top: 12px; position: relative;  font-size:10pt; bottom: 5px; margin-bottom: 15px; width: 150px; display: inline-block; vertical-align: bottom;">
        Ambient Color in Hex:</label>

    <input type="text" id="ambientColor" name="ambientColor" title="Set a hex number, ffffff is the default (white)"
           value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateAmbientColorPickerLight(this)'}"
           style="width: 70px;display: inline-block;padding: 2px;text-align: right;" />

</div>





<!-- Door@Archaeology: Interface for Changing the door properties -->
<div id="popUpDoorPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2"
     style="min-width: 240px; max-width:300px; display:none">

    <a style="float: right;" type="button" class="mdc-theme--primary" onclick='this.parentNode.style.display = "none";'>
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>

    <p class="mdc-typography--subheading1" style=""> Select Door Destination </p>
    <!--
    <div class="mdc-textfield FullWidth" data-mdc-auto-init="MDCTextfield" id="doorInputTextfield">
        <input id="doorid" name="doorid" type="text" class="mdc-textfield__input mdc-theme--text-primary-on-light FullWidth"
               style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">
        <label for="doorid" class="mdc-textfield__label">Enter a door name </label>
        <div class="mdc-textfield__bottom-line"></div>
    </div>
    
    <i title="Select a destination" class="material-icons mdc-theme--text-icon-on-background"
       style="vertical-align: text-bottom;">directions</i>
    -->


    <select title="Select a destination" id="popupDoorSelect" name="popupDoorSelect" class="mdc-select--subheading1"
            style="min-width: 70%; max-width:85%; overflow:hidden; border: none; border-bottom: 1px solid rgba(0,0,0,.23);">

        <?php
        //option.text = txt;
        //$val = "Default";
        $def = "Default";
        $sel = true;
        echo "<option value='$def' selected='$sel' disabled='$sel'>$def</option>";

        $sceneIdList = vrodos_get_all_sceneids_of_game($parent_project_id_as_term_id);
        foreach ($sceneIdList as $sc) {
            //echo "<option value='$sc'>$sc</option>";
            $scene_title = get_the_title($sc);
            echo "<option value='$sc'>$scene_title</option>";
        }
        ?>
    </select>
    </select>
    <!-- 
    <input type="checkbox" title="Select if it is a reward item" id="door_reward_checkbox" name="door_reward_checkbox"
           class="mdc-textfield__input mdc-theme--text-primary-on-light" style="margin-top:20px; margin-left:10px;">
    <label for="door_reward_checkbox" class="mdc-textfield__label" style="margin-left:15px;">Is a reward item?</label>
    -->
</div>

<!-- Marker@WindEnergy: Interface for Changing the Marker properties :  -->
<div id="popUpMarkerPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2"
     style="min-width: 100%; width: auto; bottom: auto;">

    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none"; clearAndUnbind("archaeology_penalty", null, null); clearAndUnbind("hv_distance_penalty", null, null); clearAndUnbind("natural_resource_proximity_penalty", null, null); return false;'>
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>

    <div class="mdc-layout-grid">
        <div class="mdc-layout-grid__inner">

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


<!-- POI IT @ Archaeology: Popup menu to for Reward item checkbox, from  -->
<div id="popUpPoiImageTextPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2" style="min-width: 200px; max-width: 400px; display:none">
    <!--     The close button-->
    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none";  return false;'>
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>

    <div style=" position: relative; width: 40%; float: left; clear:both; font-size: 12px"   >
        <h3 class="mdc-typography--title" style="margin-bottom: 0; font-size: 18px">Title</h3>
        <input type="text" id="poi_image_title_text" name="poiImgTitle" placeholder="The title of the Poi" class="changablefont mdc-textfield__input mdc-theme--text-primary-on-light"
               style="width: 250px;" maxlength="100" value="" />
    </div>


    <div style=" position: relative; width: 70%; float: left; clear:both;">
        <h3 class="mdc-typography--title" style="margin-bottom: 0; font-size: 18px">Update Image (WIP)</h3>
        <input id="ImgUploadInput"
               class="mdc-theme--primary" type="file"
               name="ImgloadInput"
               value="" multiple accept=".jpg,.png"
               onclick=""
               disabled

        />
    </div>
    <!---->
    <!--    The checkbox-->
    <div style=" position: relative; width: 70%; float: left; clear:both;">
        <h3 class="mdc-typography--title" style="margin-bottom: 0; font-size: 18px">Add Description</h3>
        <input type="checkbox" id="poi_image_desc_checkbox" name="poi_image_desc_checkbox" title="If selected a description can be inserted" value=""
               checked="true">
    </div>




    <div style=" position: relative; width: 40%; float: left; clear:both; font-size: 12px">
        <input type="text" id="poi_image_desc_text" name="poiImgDesc" placeholder="The description of the Poi" class="changablefont mdc-textfield__input mdc-theme--text-primary-on-light"
               style="width: 250px;"
               value="" />
    </div>


    <!---->
</div>
<!---->

<!-- POI Video @ Archaeology: Popup menu to for Reward item checkbox, from -->
<div id="popUpPoiVideoPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2"
     style="min-width: 200px;display:none">
    <!---->
    <!--    The close button-->
    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none";  return false;'>
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>
    <input type="checkbox" id="poi_video_reward_checkbox" name="poi_video_reward_checkbox" value="center_video"
           checked="true">
    <label for="center_video_1"> Center Video</label><br>

    <!--
    <select name="poi_video_focus_dropdown" id="poi_video_focus_dropdown">
        <option value="none" selected>None</option>
        <option value="center">Center</option>
        <option value="up">Up</option>
        <option value="down">down</option>
        <option value="left">left</option>
        <option value="right">right</option>
    </select>
    -->
    <div class="slidecontainer">
        <label for="slidecontainer_1"> X Coordinates:</label><br>

        <span class="limit">-30</span>
        <input type="range" min="-30" max="30" value="0" class="slider" id="focus_X" disabled="false">
        <span class="limit">30</span>
    </div>

    <div class="slidecontainer">
        <label for="slidecontainer_2"> Z Coordinates:</label><br>
        <span class="limit">-50</span>
        <input type="range" min="-50" max="0" value="0" class="slider" id="focus_Z" disabled="false">
        <span class="limit">0</span>
    </div>

    <!--
    <input type="checkbox" title="Select if it is a reward item" id="poi_video_reward_checkbox"
        name="poi_image_text_reward_checkbox" class="mdc-textfield__input mdc-theme--text-primary-on-light"
        style="margin-left: 29px; width: 150px !important; float: right;">
    <label for="poi_video_reward_checkbox" class="mdc-textfield__label"
        style="margin-left: 10px; bottom: 8px; margin-bottom: 0px;">
        Is a reward item?</label>-->

</div>

<!-- POI Video @ Archaeology: Popup menu to for Reward item checkbox, from -->
<div id="popUpLinkPropertiesDiv" class="EditorObjOverlapSelectStyle mdc-theme--background mdc-elevation--z2"
     style="min-width: 200px;display:none">
    <!---->
    <!--    The close button-->
    <a style="float: right;" type="button" class="mdc-theme--primary"
       onclick='this.parentNode.style.display = "none";  return false;'>
        <i class="material-icons" style="cursor: pointer; float: right;">close</i>
    </a>
    <input type="text" id="poi_link_text" name="poi_link_text">
</div>