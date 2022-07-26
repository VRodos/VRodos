<!--  Open/Close Right Hierarchy panel-->
<a id="hierarchy-toggle-btn" data-toggle='on' type="button"
   class="HierarchyToggleStyle HierarchyToggleOn hidable mdc-button mdc-button--raised mdc-button--primary mdc-button--dense"
   title="Toggle hierarchy viewer" data-mdc-auto-init="MDCRipple">
	<i class="material-icons">menu</i>
</a>

<!-- Right Panel -->
<div id="right-elements-panel" class="right-elements-panel-style">
	
	<!-- Title -->
	<div id="vr_editor_right_panel_title" class="row-right-panel">Scene controls</div>
	
	<!-- Cogwheel options -->
	<div id="row_cogwheel" class="row-right-panel">
		<a type="button" id="optionsPopupBtn"
		   class="VrEditorOptionsBtnStyle mdc-button mdc-button--raised mdc-button--primary mdc-button--dense"
		   title="Edit scene options" data-mdc-auto-init="MDCRipple">
			<i class="material-icons">settings</i>
		</a>
	</div>
	
	<!-- 4 Buttons in a row -->
	<div id="row2" class="row-right-panel">
		
		<!--  Toggle Around Tour -->
		<a type="button" id="toggle-tour-around-btn" data-toggle='off' data-mdc-auto-init="MDCRipple"
		   title="Auto-rotate 3D tour"
		   class="EditorTourToggleBtn mdc-button mdc-button--raised mdc-button--dense mdc-button--primary">
			<i class="material-icons">rotate_90_degrees_ccw</i>
		</a>
		
		<!--  Dimensionality 2D 3D toggle -->
		<a id="dim-change-btn" data-mdc-auto-init="MDCRipple"
		   title="Toggle between 2D mode (top view) and 3D mode (view with angle)."
		   class="EditorDimensionToggleBtn mdc-button mdc-button--raised mdc-button--dense mdc-button--primary">
			2D
		</a>
		
		<!-- The button to start walking in the 3d environment -->
		<div id="firstPersonBlocker" class="VrWalkInButtonStyle">
			<a type="button" id="firstPersonBlockerBtn" data-toggle='on'
			   class="mdc-button mdc-button--dense mdc-button--raised mdc-button--primary"
			   title="Change camera to First Person View - Move: W,A,S,D,Q,E,R,F keys"
			   data-mdc-auto-init="MDCRipple">
				VIEW
			</a>
		</div>
		

	</div>
	
	<!--  Object Controls T,R,S -->
	<div id="row3" class="row-right-panel" style="display:block">
		
		<div class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light" style="padding-left:10px; background: whitesmoke"> Object controls</div>
		
		<!-- Translate, Rotate, Scale Buttons -->
		<div id="object-manipulation-toggle"
		     class="ObjectManipulationToggle mdc-typography" style="display: none;">
			<!-- Translate -->
			<input type="radio" id="translate-switch" name="object-manipulation-switch" value="translate" checked/>
			<label for="translate-switch" class="affineSwitch">Move</label>
			<!-- Rotate -->
			<input type="radio" id="rotate-switch" name="object-manipulation-switch" value="rotate" />
			<label for="rotate-switch" class="affineSwitch">Rotate</label>
			<!-- Scale -->
			<input type="radio" id="scale-switch" name="object-manipulation-switch" value="scale" />
			<label for="scale-switch" class="affineSwitch">Scale</label>
		</div>
	</div>
	
	<!-- Numerical input for Move rotate scale -->
	<div id="row4" class="row-right-panel">
		<div id="numerical_gui-container" class="VrGuiContainerStyle mdc-typography mdc-elevation--z1"></div>
	</div>
	
	<!--  Axes resize -->
	<div id="row5" class="row-right-panel" style="padding-top:6px; padding-left:5px; padding-bottom:6px; background:whitesmoke">
		<span class="mdc-typography--subheading1 mdc-theme--text-secondary-on-light">Axes controls size:</span>
		<div id="axis-manipulation-buttons" class="AxisManipulationBtns mdc-typography" style="display: none;">
			<a id="axis-size-decrease-btn" data-mdc-auto-init="MDCRipple" title="Decrease axes size" class="mdc-button mdc-button--raised mdc-button--dense mdc-button--primary">-</a>
			<a id="axis-size-increase-btn" data-mdc-auto-init="MDCRipple" title="Increase axes size" class="mdc-button mdc-button--raised mdc-button--dense mdc-button--primary">+</a>
		</div>
	</div>
	
	<!-- Hierarchy viewer -->
	<div id="row6" class="row-right-panel" style="max-height:50%;">
		<div class="HierarchyViewerStyle mdc-card" id="hierarchy-viewer-container">
			<span class="hierarchyViewerTitle mdc-typography--subheading1 mdc-theme--text-primary-on-background" style="">Hierarchy Viewer</span>
			<hr class="mdc-list-divider">
			<ul class="mdc-list" id="hierarchy-viewer" style="max-height: 300px; overflow-y: scroll"></ul>
		</div>
	</div>
	
	<!-- Set Clear Color -->
	<div id="sceneClearColorDiv" class="mdc-textfield mdc-textfield--textarea mdc-textfield--upgraded" data-mdc-auto-init="MDCTextfield" style="width:100%; margin:0px; padding:0px; height:70px; background: rgba(255,255,255,0.5)">

        <ul class="RadioButtonList" style="margin:0px">
            <li class="mdc-form-field" id="sceneColorRadioListItem" onclick="" style="height:30px; margin:0px; font-size:xx-small">
                <div class="mdc-radio">
                    <input class="mdc-radio__native-control" type="radio" id="sceneColorRadio"
                           name="sceneColorTypeRadio" value="color">
                    <div class="mdc-radio__background">
                        <div class="mdc-radio__outer-circle"></div>
                        <div class="mdc-radio__inner-circle"></div>
                    </div>
                    
                </div>
                <label id="sceneColorRadio-label" for="sceneColorRadio" style="margin-bottom: 0;">Color</label>

                <input id="jscolorpick" class="mdc-textfield__input jscolor {onFineChange:'updateClearColorPicker(this)'}" autocomplete="off" style="margin-left: 30px;padding: 0px;font-size: 10px;width: 50px;" >

                <input type="text" id="sceneClearColor" class="mdc-textfield__input" name="sceneClearColor" form="3dAssetForm" value="#000000" style="visibility: hidden; height: 20px; width:20px">

         
            </li>

<!--            <li class="mdc-form-field" id="sceneEnvMapRadioListItem" onclick="" style="height:30px; margin:0px; font-size:xx-small">-->
<!--                <div class="mdc-radio" >-->
<!--                    <input class="mdc-radio__native-control" type="radio" id="sceneEnvMapRadio"-->
<!--                           name="sceneEnvMapTypeRadio" value="envmap" checked>-->
<!--                    <div class="mdc-radio__background">-->
<!--                        <div class="mdc-radio__outer-circle"></div>-->
<!--                        <div class="mdc-radio__inner-circle"></div>-->
<!--                    </div>-->
<!--                </div>-->
<!--                <label id="sceneEnvMapRadio-label" for="sceneEnvMapRadio" style="margin-bottom: 0;">Environmental map</label>-->
<!--            </li>-->
        </ul>


    
	
		
  
  
		<label for="sceneClearColor" class="mdc-textfield__label mdc-textfield__label--float-above"
		       style="background: none;font-size:10px; width: 70%;padding:5px">Scene Background</label>


   
        
	</div>
	
	<!-- Set RendererToneMapping  -->
	<div id="rendererToneMappingDiv"
	     class="mdc-textfield mdc-textfield--textarea mdc-textfield--upgraded"
	     style="width:100%; margin:0px; padding:0px; height:30px; background: rgba(255,255,255,0.5)">
		
		
		<label for="rendererToneMapping"
		       class="mdc-theme--text-secondary-on-light"
		       style="width:110px;font-size: 9px;padding-left: 5px;height:100%;padding-top:12px;line-height: 10px">Renderer Tone Mapping</label>
		
		<input type="range" min="0" max="2" value="1" step="0.01"
		       id="rendererToneMappingSlider" class="mdc-slider__input"
		       style="width:120px;padding:5px;margin-left:5px"
		       name="rendererToneMappingSlider" form="3dAssetForm"
		       onchange="changeRendererToneMapping(this.value); document.getElementById('rendererToneMapping').value = this.value;">
		
		<input type="number" id="rendererToneMapping" name="rendererToneMapping"
		       min="0" max="2" step="0.01"
		       style="width:45px;font-size:10px;min-height: 10px;margin-left:5px;height:20px;margin-bottom:4px;padding:0;"
		       onchange="changeRendererToneMapping(this.value); document.getElementById('rendererToneMappingSlider').value = this.value;">
	</div>
	
	<!-- Enable Environmental texture  -->
	<div id="sceneEnvironmentTextureDiv"
	     class="mdc-textfield mdc-textfield--textarea mdc-textfield--upgraded"
	     style="width:100%; margin:0; padding:0; height:30px; background: rgba(255,255,255,0.5)">
		
		<input type="checkbox"
		       id="sceneEnvironmentTexture"
		       style="width:15px;display:flex !important;float:right;position:absolute;right:5px;top:10px;padding:0;"
		       name="sceneEnvironmentTexture" form="3dAssetForm"
		       onchange="enableSceneEnvironmentTexture(this.checked)">
		
		<label for="sceneEnvironmentTexture"
		       class="mdc-textfield__label mdc-textfield__label--float-above"
		       style="background: none;font-size:10px; width: 70%;padding:5px;font-weight:bold">Enable environment texture</label>
	</div>

</div>
