<!--Object property sections: shown inside the floating Object Controls panel on selection -->

<script>


	function vrodosGetPopupTargetObject() {
		if (typeof _currentSelectedRealObject !== 'undefined' && _currentSelectedRealObject) {
			return _currentSelectedRealObject;
		}

		if (typeof VRODOS.editor.transform_controls === 'undefined' || !VRODOS.editor.transform_controls.object) {
			return null;
		}

		if (VRODOS.editor.transform_controls.object.name === 'vrodosGizmoProxy' && VRODOS.editor.transform_controls.object.realObject) {
			return VRODOS.editor.transform_controls.object.realObject;
		}

		return VRODOS.editor.transform_controls.object;
	}

	function vrodosSetPopupNumericProp(prop, value) {
		var targetObject = vrodosGetPopupTargetObject();
		if (!targetObject) return;

		var numericValue = parseFloat(value);
		targetObject[prop] = isFinite(numericValue) ? numericValue : 0;
	}

	function vrodosSetPopupProp(prop, value) {
		var targetObject = vrodosGetPopupTargetObject();
		if (!targetObject) return;
		targetObject[prop] = value;
	}


</script>

<!-- Sun Properties -->
<div id="popUpSunPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">Sun Properties</div>

	<div class="prop-row">
		<label for="sunIntensity" class="prop-label">Intensity</label>
		<input type="text" id="sunIntensity" name="sunIntensity" title="0 to infinite, 1 is default"
				value="1" maxlength="4" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="sunColor" class="prop-label">Color</label>
		<input type="color" id="sunColor" name="sunColor" title="Select sun color"
				value="#ffffff"
				style="width: 100%; height: 24px; border: none; padding: 0; background: transparent; cursor: pointer;" />
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
				value="10" maxlength="4" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="lampColor" class="prop-label">Color</label>
		<input type="color" id="lampColor" name="lampColor" title="Select lamp color"
				value="#ffffff"
				style="width: 100%; height: 24px; border: none; padding: 0; background: transparent; cursor: pointer;" />
	</div>

	<div class="prop-row">
		<label for="lampDistance" class="prop-label">Distance</label>
		<input type="text" id="lampDistance" name="lampDistance" title="0 to infinite, 100 is default"
				value="100" maxlength="4" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="lampDecay" class="prop-label">Decay</label>
		<input type="text" id="lampDecay" name="lampDecay" title="0 to infinite, 2 is default"
				value="2" maxlength="4" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="lampRadius" class="prop-label">Radius</label>
		<input type="text" id="lampRadius" name="lampRadius" title="0 to infinite, 8 is default"
				value="8" maxlength="3" class="prop-input" />
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
				class="prop-select">
		</select>
	</div>

	<div class="prop-row">
		<label for="spotPower" class="prop-label">Power</label>
		<input type="text" id="spotPower" name="spotPower" title="0 to infinite, 1 is default"
				value="1" maxlength="4" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="spotColor" class="prop-label">Color</label>
		<input type="color" id="spotColor" name="spotColor" title="Select spot color"
				value="#ffffff"
				style="width: 100%; height: 24px; border: none; padding: 0; background: transparent; cursor: pointer;" />
	</div>

	<div class="prop-row">
		<label for="spotDistance" class="prop-label">Distance</label>
		<input type="text" id="spotDistance" name="spotDistance" title="0 to infinite, 100 is default"
				value="100" maxlength="4" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="spotDecay" class="prop-label">Decay</label>
		<input type="text" id="spotDecay" name="spotDecay" title="0 to infinite, 2 is default"
				value="2" maxlength="4" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="spotAngle" class="prop-label">Angle</label>
		<input type="text" id="spotAngle" name="spotAngle" title="0 to pi/2, pi/4 is default"
				value="0.785" maxlength="5" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="spotPenumbra" class="prop-label">Penumbra</label>
		<input type="text" id="spotPenumbra" name="spotPenumbra" title="0 to 1, 0 is default"
				value="0" maxlength="4" class="prop-input" />
	</div>
</div>

<!-- Ambient Properties -->
<div id="popUpAmbientPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">Ambient Light</div>

	<div class="prop-row">
		<label for="ambientIntensity" class="prop-label">Intensity</label>
		<input type="text" id="ambientIntensity" name="ambientIntensity"
				title="0 to infinite, 1 is default" value="1" maxlength="4" class="prop-input" />
	</div>

	<div class="prop-row">
		<label for="ambientColor" class="prop-label">Color</label>
		<input type="color" id="ambientColor" name="ambientColor" title="Select ambient color"
				value="#ffffff"
				style="width: 100%; height: 24px; border: none; padding: 0; background: transparent; cursor: pointer;" />
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

<!-- Link Properties -->
<div id="popUpLinkPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">External Link</div>

	<div class="prop-row">
		<label for="poi_link_text" class="prop-label">URL</label>
		<input type="text" id="poi_link_text" name="poi_link_text" placeholder="https://example.com"
				class="prop-input tw-flex-1" value="" 
				onkeyup="vrodosSetPopupProp('poi_link_url', this.value); VRODOS.api.saveChanges();" />
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

<!-- Chat Properties -->
<div id="popUpPoiChatPropertiesDiv" class="object-property-section" style="display:none;">
	<div class="prop-section-title">Chat Properties</div>

	<div class="prop-row">
		<label for="poi_chat_title" class="prop-label">Title</label>
		<input type="text" id="poi_chat_title" name="poi_chat_title" placeholder="Help Chat"
				class="prop-input tw-flex-1" maxlength="100" 
				onkeyup="vrodosSetPopupProp('poi_chat_title', this.value); VRODOS.api.saveChanges();" />
	</div>

	<div class="prop-row">
		<label for="poi_chat_participants" class="prop-label">Max Participants</label>
		<input type="number" id="poi_chat_participants" name="poi_chat_participants"
				min="1" max="10" value="2" class="prop-input tw-w-16" 
				onchange="vrodosSetPopupNumericProp('poi_chat_participants', this.value); VRODOS.api.saveChanges();" />
	</div>

	<div class="prop-row">
		<label for="poi_chat_indicators" class="prop-label">Show Indicators</label>
		<input type="checkbox" id="poi_chat_indicators" name="poi_chat_indicators"
				title="Show availability icons" class="tw-checkbox tw-checkbox-xs tw-checkbox-primary" 
				onchange="vrodosSetPopupProp('poi_chat_indicators', this.checked ? 1 : 0); VRODOS.api.saveChanges();" />
	</div>
</div>

