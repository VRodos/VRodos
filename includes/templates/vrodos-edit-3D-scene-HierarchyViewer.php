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


    <!-- 4 Buttons in a row -->
    <div id="row2" class="row-right-panel"></div>

    <!--  Object Controls T,R,S -->
    <div id="row3" class="row-right-panel" style="display:block">
        <div class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light" style="padding-left:10px; background: whitesmoke"> Object controls</div>
    </div>

    <!-- Numerical input for Move rotate scale -->
    <div id="row4" class="row-right-panel" style="max-height:25%;; overflow: scroll">
        <div id="numerical_gui-container" class="VrGuiContainerStyle mdc-typography mdc-elevation--z1"></div>
    </div>

    <!--  Axes resize -->
    <div id="row5" class="row-right-panel" style="padding-top:6px; padding-left:5px; padding-bottom:6px; background:whitesmoke">
		<span class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light"
              style="max-width:50px; font-size:8pt !important; line-height: 1em; letter-spacing: 0">Axes controls:</span>


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

        <div id="axis-manipulation-buttons" class="AxisManipulationBtns mdc-typography" style="display: none;">
            <a id="axis-size-increase-btn" data-mdc-auto-init="MDCRipple" title="Increase axes size" class="mdc-button mdc-button--raised mdc-button--dense mdc-button--primary" style="width-min:50px">+</a>
            <a id="axis-size-decrease-btn" data-mdc-auto-init="MDCRipple" title="Decrease axes size" class="mdc-button mdc-button--raised mdc-button--dense mdc-button--primary"  style="width-min:50px">-</a>
        </div>
    </div>

    <!-- Hierarchy viewer -->
    <div id="row6" class="row-right-panel" style="max-height:30%;">
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
               style="background: none; font-size:10px; width: 70%;padding:5px;font-weight:bold">Enable environment texture</label>
    </div>

    <!-- Enable Environmental texture  -->
    <div id="sceneFogDiv"
         style="border: 1px black solid; width:100%; margin:0; padding:0; height:140px; background: rgba(255,255,255,0.5); overflow:scroll">

        <div style="background: none; margin:5px; font-size:10px; width: 70%; font-weight: bold; color:gray ">Fog</div>


        <!--        <input type="checkbox"-->
        <!--               id="sceneEnvironmentTexture"-->
        <!--               style="width:15px;display:flex !important;float:right;position:absolute;right:5px;top:10px;padding:0;"-->
        <!--               name="sceneEnvironmentTexture" form="3dAssetForm"-->
        <!--               onchange="enableSceneEnvironmentTexture(this.checked)">-->

        <!--        loadProjectTypeDescription();-->
        <ul class="RadioButtonList" id="FogTypeRadioButtonList" onclick="loadFogType()" style="margin-bottom:0;display:block">

            <li class="mdc-form-field">
                <div class="mdc-radio">
                    <input class="mdc-radio__native-control" type="radio" id="RadioNoFog"
                           checked="" name="projectTypeRadio" value="1">
                    <div class="mdc-radio__background">
                        <div class="mdc-radio__outer-circle"></div>
                        <div class="mdc-radio__inner-circle"></div>
                    </div>
                </div>
                <label for="RadioNoFog" style="font-size: 9pt !important;">
                    No Fog
                </label>
            </li>

            <li class="mdc-form-field">
                <div class="mdc-radio">
                    <input class="mdc-radio__native-control" type="radio" id="RadioLinearFog"
                           name="projectTypeRadio" value="2">
                    <div class="mdc-radio__background">
                        <div class="mdc-radio__outer-circle"></div>
                        <div class="mdc-radio__inner-circle"></div>
                    </div>
                </div>
                <label for="RadioLinearFog" style="font-size: 9pt !important;">
                    Linear Fog
                </label>
            </li>

            <li class="mdc-form-field">
                <div class="mdc-radio">
                    <input class="mdc-radio__native-control" type="radio" id="RadioExponentialFog"
                           name="projectTypeRadio" value="3">
                    <div class="mdc-radio__background">
                        <div class="mdc-radio__outer-circle"></div>
                        <div class="mdc-radio__inner-circle"></div>
                    </div>
                </div>
                <label for="RadioExponentialFog" style="font-size: 9pt !important;">Exponential</label>
            </li>
        </ul>

        <input type="text" id="FogType" name="FogType" class="mdc-textfield__input"
               form="3dAssetForm" value="none" style="visibility:hidden;display:none"/>

        <div id="fogvalues" style="display:block">

            <span style="display:block; margin-left:10px; font-size:9pt; font-weight: bold; color:gray; height:40px">Color:
                
                <input id="jscolorpickFog" class="mdc-textfield__input jscolor {onFineChange:'updateFogColorPicker(this)'}" autocomplete="off" style="height: 30px; padding:3px; border: 1px black solid;display:inline-block; width:80px; margin-left:5px" >

                <input type="text" id="FogColor" name="FogColor" class="mdc-textfield__input" form="3dAssetForm" value="#000000" style="visibility: hidden; height: 20px; width:20px;">
            </span>

            <span style="display:block; margin:10px; font-size:9pt; font-weight: bold; color:black">Near limit (linear only):
                <input type="text" id="FogNear" class="mdc-textfield__input" name="FogNear" form="3dAssetForm" onchange="updateFog()" value="0" style="height: 20px; border: 1px black solid;display:inline-block; width:40px; margin-left:5px">
            </span>

            <span style="display:block; margin:10px; font-size:9pt; font-weight: bold; color:black">Far limit (linear only):
                <input type="text" id="FogFar" class="mdc-textfield__input" name="FogFar" form="3dAssetForm" value="230"  onchange="updateFog()" style="height: 20px; border: 1px black solid;display:inline-block; width:40px; margin-left:5px">
            </span>

            <span style="display:block; margin:10px; font-size:9pt; font-weight: bold; color:black">Density (exponential only):
                <input type="text" id="FogDensity" class="mdc-textfield__input" name="FogDensity" form="3dAssetForm" value="0.1" onchange="updateFog()" style="height: 20px; border: 1px black solid;display:inline-block; width:40px; margin-left:5px">
            </span>
        </div>
    </div>
</div>
