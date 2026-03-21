<!--Object property sections: shown inside the floating Object Controls panel on selection -->

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

	function updateObjectColorPicker(picker) {
		transform_controls.object.children[0].material.color.setHex("0x" + document.getElementById("ObjectColor").value);
	}

	function updateObjectEmissiveColorPicker(picker) {
		transform_controls.object.children[0].material.emissive.setHex("0x" + document.getElementById("ObjectEmissiveColor").value);
	}

	function changeEmissiveIntensity() {
		transform_controls.object.children[0].material.emissiveIntensity = parseFloat(document.getElementById("ObjectEmissiveIntensity").value);
	}

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
		var regex = /^$|^-?(\\d+)?(\\.?\\d*)?$/;
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

<!-- Sun Properties -->
<div id="popUpSunPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">Sun Properties</div>

	<div class="prop-row">
		<label for="sunIntensity" class="prop-label">Intensity</label>
		<input type="text" id="sunIntensity" name="sunIntensity" title="0 to infinite, 1 is default"
				value="1" maxlength="4" class="prop-input"
				onkeyup="transform_controls.object.intensity = this.value;" />
	</div>

	<div class="prop-row">
		<label for="sunColor" class="prop-label">Color (hex)</label>
		<input type="text" id="sunColor" name="sunColor" title="Hex color, ffffff = white"
				value="ffff00" maxlength="6" class="jscolor {onFineChange:'updateSunColorPickerLight(this)'} prop-input" />
	</div>

	<div class="prop-row">
		<label for="castShadow" class="prop-label">Shadows</label>
		<input type="checkbox" id="castShadow" name="castShadow" value="shadow_bool" checked="true"
				title="Enable cast shadow" class="tw-checkbox tw-checkbox-xs tw-checkbox-primary" />
	</div>

	<div class="prop-row">
		<label for="sunSky" class="prop-label">Create Sky</label>
		<input type="checkbox" id="sunSky" name="sunSky" value="sky_bool" checked="true"
				title="Add horizon (not compatible with presets)" class="tw-checkbox tw-checkbox-xs tw-checkbox-primary" />
	</div>

	<div class="prop-row">
		<label for="sunShadowCameraBottom" class="prop-label">Shadow Bottom</label>
		<input type="text" id="sunShadowCameraBottom" name="sunShadowCameraBottom"
				value="-200" maxlength="6" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="sunShadowCameraTop" class="prop-label">Shadow Top</label>
		<input type="text" id="sunShadowCameraTop" name="sunShadowCameraTop"
				value="200" maxlength="6" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="sunShadowCameraLeft" class="prop-label">Shadow Left</label>
		<input type="text" id="sunShadowCameraLeft" name="sunShadowCameraLeft"
				value="-200" maxlength="6" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="sunShadowCameraRight" class="prop-label">Shadow Right</label>
		<input type="text" id="sunShadowCameraRight" name="sunShadowCameraRight"
				value="200" maxlength="6" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="sunshadowMapHeight" class="prop-label">Map Height</label>
		<input type="text" id="sunshadowMapHeight" name="sunshadowMapHeight"
				value="1024" maxlength="6" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="sunshadowMapWidth" class="prop-label">Map Width</label>
		<input type="text" id="sunshadowMapWidth" name="sunshadowMapWidth"
				value="1024" maxlength="6" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="sunshadowBias" class="prop-label" title="Try decrementing e.g.: -0.001 if objects have large Y distance from ground">Shadow Bias</label>
		<input type="text" id="sunshadowBias" name="sunshadowBias"
				value="-0.001" maxlength="6" class="prop-input" />
	</div>
</div>

<!-- Lamp Properties -->
<div id="popUpLampPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">Lamp Properties</div>

	<div class="prop-row">
		<label for="lampPower" class="prop-label">Power</label>
		<input type="text" id="lampPower" name="lampPower" title="0 to infinite, 1 is default"
				value="10" maxlength="4" class="prop-input"
				onkeyup="transform_controls.object.power = this.value" />
	</div>

	<div class="prop-row">
		<label for="lampColor" class="prop-label">Color (hex)</label>
		<input type="text" id="lampColor" name="lampColor" title="Hex color, ffffff = white"
				value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateLampColorPickerLight(this)'} prop-input" />
	</div>

	<div class="prop-row">
		<label for="lampDistance" class="prop-label">Distance</label>
		<input type="text" id="lampDistance" name="lampDistance" title="0 to infinite, 100 is default"
				value="100" maxlength="4" class="prop-input"
				onkeyup="transform_controls.object.distance = this.value" />
	</div>

	<div class="prop-row">
		<label for="lampDecay" class="prop-label">Decay</label>
		<input type="text" id="lampDecay" name="lampDecay" title="0 to infinite, 2 is default"
				value="2" maxlength="4" class="prop-input"
				onkeyup="transform_controls.object.decay = this.value" />
	</div>

	<div class="prop-row">
		<label for="lampRadius" class="prop-label">Radius</label>
		<input type="text" id="lampRadius" name="lampRadius" title="0 to infinite, 8 is default"
				value="8" maxlength="3" class="prop-input"
				onkeyup="transform_controls.object.shadow.radius = this.value" />
	</div>

	<div class="prop-row">
		<label for="lampcastShadow" class="prop-label">Shadows</label>
		<input type="checkbox" id="lampcastShadow" name="lampcastShadow" value="shadow_bool" checked="true"
				title="Enable cast shadow" class="tw-checkbox tw-checkbox-xs tw-checkbox-primary" />
	</div>

	<div class="prop-row">
		<label for="lampShadowCameraBottom" class="prop-label">Shadow Bottom</label>
		<input type="text" id="lampShadowCameraBottom" name="lampShadowCameraBottom"
				value="-200" maxlength="6" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="lampShadowCameraTop" class="prop-label">Shadow Top</label>
		<input type="text" id="lampShadowCameraTop" name="lampShadowCameraTop"
				value="200" maxlength="6" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="lampShadowCameraLeft" class="prop-label">Shadow Left</label>
		<input type="text" id="lampShadowCameraLeft" name="lampShadowCameraLeft"
				value="-200" maxlength="6" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="lampShadowCameraRight" class="prop-label">Shadow Right</label>
		<input type="text" id="lampShadowCameraRight" name="lampShadowCameraRight"
				value="200" maxlength="6" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="lampshadowMapHeight" class="prop-label">Map Height</label>
		<input type="text" id="lampshadowMapHeight" name="lampshadowMapHeight"
				value="1024" maxlength="6" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="lampshadowMapWidth" class="prop-label">Map Width</label>
		<input type="text" id="lampshadowMapWidth" name="lampshadowMapWidth"
				value="1024" maxlength="6" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="lampshadowBias" class="prop-label" title="Try decrementing e.g.: -0.001 if objects have large Y distance from ground">Shadow Bias</label>
		<input type="text" id="lampshadowBias" name="lampshadowBias"
				value="-0.001" maxlength="6" class="prop-input" />
	</div>
</div>

<!-- Spot Properties -->
<div id="popUpSpotPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">Spot Properties</div>

	<div class="prop-row">
		<label for="spotTargetObject" class="prop-label">Target object</label>
		<select id="spotTargetObject" name="spotTargetObject" title="Set spot target among scene objects"
				class="prop-select" onchange="updateSpotConeHelper(this.value)">
		</select>
	</div>

	<div class="prop-row">
		<label for="spotPower" class="prop-label">Power</label>
		<input type="text" id="spotPower" name="spotPower" title="0 to infinite, 1 is default"
				value="1" maxlength="4" class="prop-input"
				onkeyup="transform_controls.object.power = this.value; updateSpot();" />
	</div>

	<div class="prop-row">
		<label for="spotColor" class="prop-label">Color (hex)</label>
		<input type="text" id="spotColor" name="spotColor" title="Hex color, ffffff = white"
				value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateSpotColorPickerLight(this)'} prop-input" />
	</div>

	<div class="prop-row">
		<label for="spotDistance" class="prop-label">Distance</label>
		<input type="text" id="spotDistance" name="spotDistance" title="0 to infinite, 100 is default"
				value="100" maxlength="4" class="prop-input"
				onkeyup="transform_controls.object.distance = this.value; updateSpot();" />
	</div>

	<div class="prop-row">
		<label for="spotDecay" class="prop-label">Decay</label>
		<input type="text" id="spotDecay" name="spotDecay" title="0 to infinite, 2 is default"
				value="2" maxlength="4" class="prop-input"
				onkeyup="transform_controls.object.decay = this.value; updateSpot();" />
	</div>

	<div class="prop-row">
		<label for="spotAngle" class="prop-label">Angle</label>
		<input type="text" id="spotAngle" name="spotAngle" title="0 to pi/2, pi/4 is default"
				value="0.785" maxlength="5" class="prop-input"
				onkeyup="transform_controls.object.angle = this.value; updateSpot();" />
	</div>

	<div class="prop-row">
		<label for="spotPenumbra" class="prop-label">Penumbra</label>
		<input type="text" id="spotPenumbra" name="spotPenumbra" title="0 to 1, 0 is default"
				value="0" maxlength="4" class="prop-input"
				onkeyup="transform_controls.object.penumbra = this.value; updateSpot();" />
	</div>
</div>

<!-- Ambient Properties -->
<div id="popUpAmbientPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">Ambient Light</div>

	<div class="prop-row">
		<label for="ambientIntensity" class="prop-label">Intensity</label>
		<input type="text" id="ambientIntensity" name="ambientIntensity"
				title="0 to infinite, 1 is default" value="1" maxlength="4" class="prop-input"
				onkeyup="transform_controls.object.intensity = this.value;" />
	</div>

	<div class="prop-row">
		<label for="ambientColor" class="prop-label">Color (hex)</label>
		<input type="text" id="ambientColor" name="ambientColor" title="Hex color, ffffff = white"
				value="ffffff" maxlength="6" class="jscolor {onFineChange:'updateAmbientColorPickerLight(this)'} prop-input" />
	</div>
</div>

<!-- Door Properties -->
<div id="popUpDoorPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">Door Destination</div>

	<div class="prop-row">
		<label for="popupDoorSelect" class="prop-label">Scene</label>
		<select title="Select a destination" id="popupDoorSelect" name="popupDoorSelect" class="prop-select">
			<?php
			$def = 'Default';
			$sel = true;
			echo "<option value='$def' selected='$sel' disabled='$sel'>$def</option>";

			$sceneIdList = VRodos_Core_Manager::vrodos_get_all_sceneids_of_game( $parent_project_id_as_term_id );
			foreach ( $sceneIdList as $sc ) {
				$scene_title = get_the_title( $sc );
				echo "<option value='$sc'>$scene_title</option>";
			}
			?>
		</select>
	</div>
</div>

<!-- Marker Properties (WindEnergy) -->
<div id="popUpMarkerPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">Marker Properties</div>
	<div class="tw-grid tw-grid-cols-3 tw-gap-1">
		<iframe style="height: 300px; width: 100%; border:none;" id="turbine1-iframe"></iframe>
		<iframe style="height: 300px; width: 100%; border:none;" id="turbine2-iframe"></iframe>
		<iframe style="height: 300px; width: 100%; border:none;" id="turbine3-iframe"></iframe>
	</div>
</div>

<!-- POI Image/Text Properties -->
<div id="popUpPoiImageTextPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">POI Image/Text</div>

	<div class="prop-row">
		<label for="poi_image_title_text" class="prop-label">Title</label>
		<input type="text" id="poi_image_title_text" name="poiImgTitle" placeholder="POI title"
				class="prop-input tw-flex-1" maxlength="100" value="" />
	</div>

	<div class="prop-row">
		<label class="prop-label">Image (WIP)</label>
		<input id="ImgUploadInput" type="file" name="ImgloadInput"
				value="" multiple accept=".jpg,.png" disabled
				class="tw-text-[10px] tw-text-slate-400" />
	</div>

	<div class="prop-row">
		<label for="poi_image_desc_checkbox" class="prop-label">Description</label>
		<input type="checkbox" id="poi_image_desc_checkbox" name="poi_image_desc_checkbox"
				title="Enable description" value="" checked="true"
				class="tw-checkbox tw-checkbox-xs tw-checkbox-primary" />
	</div>

	<div class="prop-row">
		<label for="poi_image_desc_text" class="prop-label">Text</label>
		<input type="text" id="poi_image_desc_text" name="poiImgDesc" placeholder="Description"
				class="prop-input tw-flex-1" value="" />
	</div>
</div>

<!-- POI Video Properties -->
<div id="popUpPoiVideoPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">POI Video</div>

	<div class="prop-row">
		<label for="poi_video_reward_checkbox" class="prop-label">Center Video</label>
		<input type="checkbox" id="poi_video_reward_checkbox" name="poi_video_reward_checkbox" value="center_video"
				checked="true" class="tw-checkbox tw-checkbox-xs tw-checkbox-primary" />
	</div>

	<div class="prop-row tw-flex-col tw-items-stretch">
		<label class="prop-label tw-mb-1">X Coordinates</label>
		<div class="tw-flex tw-items-center tw-gap-1">
			<span class="tw-text-[9px] tw-text-slate-500">-30</span>
			<input type="range" min="-30" max="30" value="0" class="tw-range tw-range-xs tw-range-primary tw-flex-1" id="focus_X">
			<span class="tw-text-[9px] tw-text-slate-500">30</span>
		</div>
	</div>

	<div class="prop-row tw-flex-col tw-items-stretch">
		<label class="prop-label tw-mb-1">Z Coordinates</label>
		<div class="tw-flex tw-items-center tw-gap-1">
			<span class="tw-text-[9px] tw-text-slate-500">-50</span>
			<input type="range" min="-50" max="0" value="0" class="tw-range tw-range-xs tw-range-primary tw-flex-1" id="focus_Z">
			<span class="tw-text-[9px] tw-text-slate-500">0</span>
		</div>
	</div>
</div>

<!-- Link Properties -->
<div id="popUpLinkPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">Link</div>

	<div class="prop-row">
		<label for="poi_link_text" class="prop-label">URL</label>
		<input type="text" id="poi_link_text" name="poi_link_text" placeholder="https://..."
				class="prop-input tw-flex-1" />
	</div>
</div>
