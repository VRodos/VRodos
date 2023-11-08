<!--  Open/Close Right Hierarchy panel-->
<a id="hierarchy-toggle-btn" data-toggle='on' type="button"
   class="HierarchyToggleStyle HierarchyToggleOn hidable mdc-button mdc-button--raised mdc-button--primary mdc-button--dense"
   title="Toggle hierarchy viewer" data-mdc-auto-init="MDCRipple">
    <i class="material-icons">menu</i>
</a>

<!-- Right Panel -->
<div id="right-elements-panel" class="right-elements-panel-style">

    <!-- 4 Buttons in a row -->
    <div id="row2" class="row-right-panel"></div>

    <!--  Object Controls T,R,S -->
    <div id="row3" class="row-right-panel" style="display:block">
        <div class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light" style="padding-left:10px; background: whitesmoke"> Object controls</div>
    </div>

    <!-- Numerical input for Move rotate scale -->
    <div id="row4" class="row-right-panel" style="max-height:25%; overflow-y: auto">
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
            <a id="axis-size-increase-btn" data-mdc-auto-init="MDCRipple" title="Increase axes size" class="mdc-button mdc-button--raised mdc-button--dense mdc-button--primary">+</a>
            <a id="axis-size-decrease-btn" data-mdc-auto-init="MDCRipple" title="Decrease axes size" class="mdc-button mdc-button--raised mdc-button--dense mdc-button--primary">-</a>
        </div>

    </div>

    <div id="scale-lock-div"
         style="display: block; width:100%; margin:0; padding:0; height:30px; background: rgba(255,255,255,0.5)">

        <input type="checkbox"
               title="Constrain Scale dims to one value"
               id="scaleLockCheckbox"
               name="scaleLockCheckbox"
               form="3dAssetForm"
               class="mdc-checkbox mdc-form-field mdc-theme--text-primary-on-light"
               onchange="keepScaleAspectRatio(this.checked)">
        <label for="scaleLockCheckbox" class="mdc-typography--body1 mdc-theme--text-primary-on-light" style="vertical-align: middle; cursor: pointer;">Constrain Scale dims to single value</label>

    </div>

    <!-- Hierarchy viewer -->
    <div id="row6" class="row-right-panel" style="max-height:30%;">
        <div class="HierarchyViewerStyle mdc-card" id="hierarchy-viewer-container">
            <span class="HierarchyViewerTitle mdc-typography--subheading1 mdc-theme--text-primary-on-background">Hierarchy Viewer</span>
            <hr class="mdc-list-divider">
            <ul class="mdc-list" id="hierarchy-viewer" style="max-height: 300px; overflow-y: auto; padding-left: 14px;"></ul>
        </div>
    </div>

    <!-- Extra options -->
    <div style="width:100%; margin:0; height: 32%; overflow-y: scroll; background: rgba(255,255,255,0.5)">

        <span class="mdc-typography--subheading1 mdc-theme--text-primary-on-background">Scene options</span>

        <!-- Set Broadcast chat -->
        <div style="display: block">
            <input type="checkbox" title="Enable global chat" id="enableGeneralChatCheckbox" name="enableGeneralChatCheckbox" form="3dAssetForm" class="mdc-checkbox mdc-form-field mdc-theme--text-primary-on-light" onchange="toggleBroadcastChat(this.checked)">
            <label for="enableGeneralChatCheckbox" class="mdc-typography--body1 mdc-theme--text-primary-on-light" style="vertical-align: middle; cursor: pointer;">Enable general chat</label>
        </div>

        <hr>

        <span class="mdc-typography--subheading1 mdc-theme--text-primary-on-background">Background style</span>

        <ul class="RadioButtonList" style="padding: 0;">
            <label for="sceneNone">
            <li class="mdc-form-field" for="sceneNone" id="scenesceneNoneListItem" onclick="bcgRadioSelect(this)" value="0"  style="height:30px; margin:0; font-size:xx-small">
                <div class="mdc-radio">
                    <input class="mdc-radio__native-control" type="radio" id="sceneNone"
                           name="sceneColorTypeRadio" value="None">
                    <div class="mdc-radio__background">
                        <div class="mdc-radio__outer-circle"></div>
                        <div class="mdc-radio__inner-circle"></div>
                    </div>
                </div>
                <label id="sceneSkyRadio-label" for="sceneNone" style="margin-bottom: 0;">None</label>
            </li>
            </label>
            <label for="sceneColorRadio">
            <li class="mdc-form-field"  id="sceneColorRadioListItem" onclick="bcgRadioSelect(this)" value="1" style="height:30px; margin:0; font-size:xx-small">
                <div class="mdc-radio" >
                    <input class="mdc-radio__native-control" type="radio" id="sceneColorRadio"
                           name="sceneColorTypeRadio" value="color">
                    <div class="mdc-radio__background">
                        <div class="mdc-radio__outer-circle"></div>
                        <div class="mdc-radio__inner-circle"></div>
                    </div>

                </div>
                <label for="sceneColorRadio" style="vertical-align: middle; cursor: pointer; font-size:xx-small">Background Color</label>
                <input id="jscolorpick" hidden class="mdc-textfield__input jscolor {onFineChange:'updateClearColorPicker(this)'}" autocomplete="off" disabled style="margin-left: 30px;padding: 0;font-size: 10px;width: 50px;" >
                <input type="text" id="sceneClearColor" class="mdc-textfield__input" name="sceneClearColor" form="3dAssetForm" value="#000000" style="visibility: hidden; height: 20px; width:20px;">

            </li>
            </label>
            <label for="sceneSky">
            <li class="mdc-form-field"  id="scenesceneSkyRadioListItem" onclick="bcgRadioSelect(this)" value="2" style="height:30px; margin:0; font-size:xx-small">
                <div class="mdc-radio">
                    <input class="mdc-radio__native-control" type="radio" id="sceneSky"
                           name="sceneColorTypeRadio" value="sky">
                    <div class="mdc-radio__background">
                        <div class="mdc-radio__outer-circle"></div>
                        <div class="mdc-radio__inner-circle"></div>
                    </div>
                </div>
                <label id="sceneSkyRadio-label" for="sceneSky" style="margin-bottom: 0;">Presets</label>
                <select name="presetsBcg" hidden id="presetsBcg" disabled style=" font-size: 10px;">
                    <option value="default">Default</option>
                    <option value="egypt">Egypt</option>
                    <option value="forest">Forest</option>
                    <option value="contact">Contact</option>
                    <option value="checkerboard">Checkerboard</option>
                    <option value="goldmine">Goldmine</option>
                    <option value="goaland">Goaland</option>
                    <option value="yavapai">Yavapai</option>
                    <option value="threetowers">Threetowers</option>
                    <option value="arches">Arches</option>
                    <option value="tron">Tron</option>
                    <option value="japan">Japan</option>
                    <option value="dream">Dream</option>
                    <option value="poison">Poison</option>
                    <option value="volcano">Volcano</option>
                    <option value="starry">Starry</option>
                    <option value="osiris">Osiris</option>
                    <option value="moon">Moon</option>
                    <option value="ocean">Ocean</option>
                </select>
            </li>
            </label>
            <label for="sceneCustomImage">
            <li class="mdc-form-field"  id="sceneCustomImageRadioListItem" onclick="bcgRadioSelect(this)" value="3" style="height:30px; margin:0; font-size:xx-small">
                <div class="mdc-radio">
                    <input class="mdc-radio__native-control" type="radio" id="sceneCustomImage"
                           name="sceneColorTypeRadio" value="Custom_img">
                    <div class="mdc-radio__background">
                        <div class="mdc-radio__outer-circle"></div>
                        <div class="mdc-radio__inner-circle"></div>
                    </div>
                </div>
                <label id="sceneCustomImageRadio-label" for="sceneCustomImage" style="margin-bottom: 0;">Custom Image</label>
                <div class="thumbnailImg">
                <img id="uploadImgThumb" hidden>
                </div>
                <input id="img_upload_bcg" hidden class="mdc-theme--primary" type="file" name="ImgUploadBcg" value="" accept=".jpg, .png" disabled onchange="imgUpload()" style="margin-left: 50px; font-size: 10px;" />
            </li>
            </label>
        </ul>

        <hr>

        <span class="mdc-typography--subheading1 mdc-theme--text-primary-on-background">Fog</span>

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


        <span class="mdc-typography--subheading1 mdc-theme--text-primary-on-background">Fog values</span>

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