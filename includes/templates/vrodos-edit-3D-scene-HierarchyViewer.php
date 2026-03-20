<!-- Right Panel -->
<div id="right-elements-panel" class="right-elements-panel-style tw-flex tw-flex-col tw-bg-slate-100 tw-text-slate-800">

    <!-- Open/Close Sidebar Handle (Nested for seamless extension) -->
    <a id="bt_close_hierarchy_toolbar" data-toggle="on" type="button"
       class="HierarchyToggleStyle HierarchyToggleOn hidable"
       title="Toggle hierarchy viewer">
        <div class="tw-flex tw-items-center tw-justify-center">
            <i data-lucide="chevron-right" class="tw-w-3 tw-h-3"></i>
        </div>
    </a>

    <!-- Hierarchy viewer -->
    <div id="row6" class="row-right-panel">
        <div class="tw-flex tw-flex-col tw-w-full tw-bg-slate-200" id="hierarchy-viewer-container">
            <span class="tw-font-semibold tw-text-sm tw-text-slate-700 tw-px-3 tw-py-1.5">Hierarchy Viewer</span>
            <hr class="tw-border-slate-300">
            <ul id="hierarchy-viewer" class="tw-list-none tw-m-0 tw-pl-3 tw-pr-1" style="max-height: 50vh; overflow-y: auto;">
                <!-- Skeleton placeholders (removed when all assets finish loading) -->
                <li id="hierarchy-skeleton" style="padding: 8px; display: flex; flex-direction: column; gap: 10px;">
                    <style>
                        @keyframes skeleton-pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 0.7; } }
                        .skel-bar { background: #94a3b8; border-radius: 4px; animation: skeleton-pulse 1.5s ease-in-out infinite; }
                    </style>
                    <div style="display:flex; align-items:center; gap:8px;"><div class="skel-bar" style="width:16px; height:16px; flex-shrink:0;"></div><div class="skel-bar" style="height:12px; flex:1;"></div><div class="skel-bar" style="width:32px; height:12px;"></div></div>
                    <div style="display:flex; align-items:center; gap:8px;"><div class="skel-bar" style="width:16px; height:16px; flex-shrink:0;"></div><div class="skel-bar" style="height:12px; width:75%;"></div><div class="skel-bar" style="width:32px; height:12px;"></div></div>
                    <div style="display:flex; align-items:center; gap:8px;"><div class="skel-bar" style="width:16px; height:16px; flex-shrink:0;"></div><div class="skel-bar" style="height:12px; width:60%;"></div><div class="skel-bar" style="width:32px; height:12px;"></div></div>
                    <div style="display:flex; align-items:center; gap:8px;"><div class="skel-bar" style="width:16px; height:16px; flex-shrink:0;"></div><div class="skel-bar" style="height:12px; width:80%;"></div><div class="skel-bar" style="width:32px; height:12px;"></div></div>
                    <div style="display:flex; align-items:center; gap:8px;"><div class="skel-bar" style="width:16px; height:16px; flex-shrink:0;"></div><div class="skel-bar" style="height:12px; width:50%;"></div><div class="skel-bar" style="width:32px; height:12px;"></div></div>
                </li>
            </ul>
        </div>
    </div>

    <!-- Extra options -->
    <div class="tw-w-full tw-m-0 tw-overflow-y-auto tw-bg-white/50 tw-px-3 tw-py-2 tw-flex-1 tw-min-h-0">

        <span class="tw-font-semibold tw-text-sm tw-text-slate-700">Scene options</span>

        <!-- Set Broadcast chat -->
        <div class="tw-flex tw-items-center tw-gap-2 tw-mt-1">
            <input type="checkbox" title="Enable global chat" id="enableGeneralChatCheckbox" name="enableGeneralChatCheckbox" form="3dAssetForm" class="d-checkbox d-checkbox-sm d-checkbox-primary" onchange="toggleBroadcastChat(this.checked)">
            <label for="enableGeneralChatCheckbox" class="tw-text-sm tw-text-slate-700 tw-cursor-pointer">Enable general chat</label>
        </div>

        <div class="tw-flex tw-items-center tw-gap-2 tw-mt-1">
            <input type="checkbox" title="Enable avatar selection" id="enableAvatarCheckbox" name="enableAvatarCheckbox" form="3dAssetForm" class="d-checkbox d-checkbox-sm d-checkbox-primary" onchange="toggleEnableAvatar(this.checked)">
            <label for="enableAvatarCheckbox" class="tw-text-sm tw-text-slate-700 tw-cursor-pointer">Enable avatar selection</label>
        </div>

        <div class="tw-flex tw-items-center tw-gap-2 tw-mt-1">
            <input type="checkbox" title="Disable movement" id="moveDisableCheckbox" name="moveDisableCheckbox" form="3dAssetForm" class="d-checkbox d-checkbox-sm d-checkbox-primary" onchange="toggleDisableMovement(this.checked)">
            <label for="moveDisableCheckbox" class="tw-text-sm tw-text-slate-700 tw-cursor-pointer">Disable movement</label>
        </div>

        <hr class="tw-my-2 tw-border-slate-300">

        <span class="tw-font-semibold tw-text-sm tw-text-slate-700">Background style</span>

        <ul class="tw-list-none tw-p-0 tw-m-0">
            <li class="tw-flex tw-items-center tw-gap-2 tw-h-[30px]" id="scenesceneNoneListItem" onclick="bcgRadioSelect(this)" value="0">
                <input type="radio" id="sceneNone" name="sceneColorTypeRadio" value="None" class="d-radio d-radio-sm d-radio-primary">
                <label for="sceneNone" class="tw-text-xs tw-text-slate-700 tw-cursor-pointer tw-mb-0">Background: Horizon</label>
            </li>
            <li class="tw-flex tw-items-center tw-gap-2 tw-h-[30px]" id="sceneColorRadioListItem" onclick="bcgRadioSelect(this)" value="1">
                <input type="radio" id="sceneColorRadio" name="sceneColorTypeRadio" value="color" class="d-radio d-radio-sm d-radio-primary">
                <label for="sceneColorRadio" class="tw-text-xs tw-text-slate-700 tw-cursor-pointer tw-mb-0">Background Color</label>
                <input id="jscolorpick" hidden class="jscolor {onFineChange:'updateClearColorPicker(this)'}" autocomplete="off" disabled style="margin-left: 10px; padding: 0; font-size: 10px; width: 50px;">
                <input type="text" id="sceneClearColor" name="sceneClearColor" form="3dAssetForm" value="#000000" style="visibility: hidden; height: 20px; width:20px;">
            </li>
            <li class="tw-flex tw-items-center tw-gap-2 tw-h-[30px]" id="scenesceneSkyRadioListItem" onclick="bcgRadioSelect(this)" value="2">
                <input type="radio" id="sceneSky" name="sceneColorTypeRadio" value="sky" class="d-radio d-radio-sm d-radio-primary">
                <label for="sceneSky" class="tw-text-xs tw-text-slate-700 tw-cursor-pointer tw-mb-0">Presets</label>
                <select name="presetsBcg" hidden id="presetsBcg" disabled class="d-select d-select-xs tw-ml-2" style="font-size: 10px;">
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
            <li class="tw-flex tw-items-center tw-gap-2 tw-h-[30px]" id="sceneCustomImageRadioListItem" onclick="bcgRadioSelect(this)" value="3">
                <input type="radio" id="sceneCustomImage" name="sceneColorTypeRadio" value="Custom_img" class="d-radio d-radio-sm d-radio-primary">
                <label for="sceneCustomImage" class="tw-text-xs tw-text-slate-700 tw-cursor-pointer tw-mb-0">Custom Image</label>
                <div class="thumbnailImg">
                    <img id="uploadImgThumb" hidden>
                </div>
                <input id="img_upload_bcg" hidden type="file" name="ImgUploadBcg" value="" accept=".jpg, .png" disabled onchange="imgUpload()" style="margin-left: 20px; font-size: 10px;">
            </li>
        </ul>

        <hr class="tw-my-2 tw-border-slate-300">

        <span class="tw-font-semibold tw-text-sm tw-text-slate-700">Fog</span>

        <style>
            .fog-toggle { display: inline-flex; background: #e2e8f0; border-radius: 8px; padding: 2px; margin-top: 4px; margin-bottom: 12px; gap: 2px; }
            .fog-toggle input { display: none; }
            .fog-toggle label { padding: 4px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; user-select: none; text-align: center; }
            .fog-toggle label:hover { color: #334155; }
            .fog-toggle input:checked + label { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
        </style>
        <div id="FogTypeRadioButtonList" class="fog-toggle" onclick="loadFogType()">
            <input type="radio" id="RadioNoFog" name="projectTypeRadio" checked value="1" />
            <label for="RadioNoFog">None</label>
            <input type="radio" id="RadioLinearFog" name="projectTypeRadio" value="2" />
            <label for="RadioLinearFog">Linear</label>
            <input type="radio" id="RadioExponentialFog" name="projectTypeRadio" value="3" />
            <label for="RadioExponentialFog">Exponential</label>
        </div>

        <input type="text" id="FogType" name="FogType"
               form="3dAssetForm" value="none" style="visibility:hidden;display:none"/>

        <span class="tw-font-semibold tw-text-sm tw-text-slate-700" id="FogValues" style="display:none">Fog values</span>

        <span style="display:none; margin-left:10px; font-size:9pt; font-weight: bold; color:gray; height:40px" class="colorElement">Color:
                <input id="jscolorpickFog" class="jscolor {onFineChange:'updateFogColorPicker(this)'}" autocomplete="off" style="height: 30px; padding:3px; border: 1px black solid; display:inline-block; width:80px; margin-left:5px">
                <input type="text" id="FogColor" name="FogColor" class="colorElement" form="3dAssetForm" value="" style="visibility: hidden; height: 20px; width:20px;">
            </span>

        <span style="display:none; margin:10px; font-size:9pt; font-weight: bold; color:black" class="linearElement">Near limit (linear only):
                <input type="text" id="FogNear" class="tw-h-5 tw-border tw-border-black tw-inline-block tw-w-10 tw-ml-1 linearElement" name="FogNear" form="3dAssetForm" onchange="updateFog()" value="000000">
            </span>

        <span style="display:none; margin:10px; font-size:9pt; font-weight: bold; color:black" class="linearElement">Far limit (linear only):
                <input type="text" id="FogFar" class="tw-h-5 tw-border tw-border-black tw-inline-block tw-w-10 tw-ml-1 linearElement" name="FogFar" form="3dAssetForm" value="230" onchange="updateFog()">
            </span>

        <span style="display:none; margin:10px; font-size:9pt; font-weight: bold; color:black" class="exponentialElement">Density (exponential only):
                <input type="text" id="FogDensity" class="tw-h-5 tw-border tw-border-black tw-inline-block tw-w-10 tw-ml-1 exponentialElement" name="FogDensity" form="3dAssetForm" value="0.1" onchange="updateFog()">
            </span>
    </div>
</div>
