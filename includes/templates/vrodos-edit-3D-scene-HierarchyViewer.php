<!-- Right Panel -->
<div id="right-elements-panel" class="right-elements-panel-style tw-flex tw-flex-col tw-text-white/90">

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
        <div class="tw-flex tw-flex-col tw-w-full tw-bg-transparent" id="hierarchy-viewer-container">
            <div class="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-mb-1 tw-bg-slate-950/40">
                <i data-lucide="layers-2" class="tw-w-3 tw-h-3 tw-text-emerald-400"></i>
                <span class="tw-font-bold tw-text-[10px] tw-text-white tw-uppercase tw-tracking-widest">Hierarchy Viewer</span>
            </div>

            <ul id="hierarchy-viewer" class="tw-list-none tw-m-0 tw-pl-3 tw-pr-1" style="max-height: 50vh; overflow-y: auto;">
                <!-- Skeleton placeholders (removed when all assets finish loading) -->
                <li id="hierarchy-skeleton" style="padding: 8px; display: flex; flex-direction: column; gap: 10px;">
                    <style>
                        @keyframes skeleton-pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 0.7; } }
                        .skel-bar { background: rgba(255, 255, 255, 0.1); border-radius: 4px; animation: skeleton-pulse 1.5s ease-in-out infinite; }
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
    <div class="tw-w-full tw-m-0 tw-overflow-y-auto tw-bg-transparent tw-p-0 tw-flex-1 tw-min-h-0">

        <div class="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-mb-1 tw-bg-slate-950/40">
            <i data-lucide="settings-2" class="tw-w-3 tw-h-3 tw-text-indigo-400"></i>
            <span class="tw-font-bold tw-text-[10px] tw-text-white tw-uppercase tw-tracking-widest">Scene options</span>
        </div>

        <div class="tw-flex tw-items-center tw-gap-2 tw-mt-1 tw-px-3 tw-py-1">
            <input type="checkbox" id="enableGeneralChatCheckbox" name="enableGeneralChatCheckbox" form="3dAssetForm"
                   class="tw-checkbox tw-checkbox-xs tw-checkbox-primary tw-bg-slate-800 tw-border-white/20"
                   onchange="toggleBroadcastChat(this.checked)">
            <label for="enableGeneralChatCheckbox" class="tw-text-xs tw-font-semibold tw-text-white/90 tw-cursor-pointer">Enable global chat</label>
        </div>

        <div class="tw-flex tw-items-center tw-gap-2 tw-mt-1 tw-px-3 tw-py-1">
            <input type="checkbox" id="enableAvatarCheckbox" name="enableAvatarCheckbox" form="3dAssetForm"
                   class="tw-checkbox tw-checkbox-xs tw-checkbox-primary tw-bg-slate-800 tw-border-white/20"
                   onchange="toggleEnableAvatar(this.checked)">
            <label for="enableAvatarCheckbox" class="tw-text-xs tw-font-semibold tw-text-white/90 tw-cursor-pointer">Enable avatar selection</label>
        </div>

        <div class="tw-flex tw-items-center tw-gap-2 tw-mt-1 tw-px-3 tw-py-1">
            <input type="checkbox" id="moveDisableCheckbox" name="moveDisableCheckbox" form="3dAssetForm"
                   class="tw-checkbox tw-checkbox-xs tw-checkbox-primary tw-bg-slate-800 tw-border-white/20"
                   onchange="toggleDisableMovement(this.checked)">
            <label for="moveDisableCheckbox" class="tw-text-xs tw-font-semibold tw-text-white/90 tw-cursor-pointer">Disable movement</label>
        </div>

        <div class="tw-flex tw-items-start tw-gap-2 tw-mt-1 tw-px-3 tw-py-1">
            <input type="checkbox" id="aframeCollisionModeCheckbox" name="aframeCollisionModeCheckbox" form="3dAssetForm"
                   class="tw-checkbox tw-checkbox-xs tw-checkbox-primary tw-bg-slate-800 tw-border-white/20 tw-mt-0.5"
                   onchange="toggleAframeCollisionMode(this.checked)">
            <label for="aframeCollisionModeCheckbox" class="tw-cursor-pointer">
                <span class="tw-block tw-text-xs tw-font-semibold tw-text-white/90">Enable walkable surface collisions</span>
                <span class="tw-block tw-text-[10px] tw-text-white/55">Auto-applies only when Walkable Surface assets exist in the scene.</span>
            </label>
        </div>

        <div class="tw-flex tw-flex-col tw-gap-1">

            <div class="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-mt-4 tw-mb-1 tw-bg-slate-950/40">
                <i data-lucide="palette" class="tw-w-3 tw-h-3 tw-text-rose-400"></i>
                <span class="tw-font-bold tw-text-[10px] tw-text-white tw-uppercase tw-tracking-widest">Background style</span>
            </div>

            <style>
                .bcg-toggle { display: inline-flex; background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 2px; margin-top: 4px; margin-bottom: 4px; gap: 2px; }
                .bcg-toggle input { display: none; }
                .bcg-toggle label { padding: 4px 8px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255, 255, 255, 0.7); border-radius: 6px; cursor: pointer; transition: all 0.15s ease; user-select: none; text-align: center; }
                .bcg-toggle label:hover { color: #ffffff; }
                .bcg-toggle input:checked + label { background: rgba(255, 255, 255, 0.1); color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
            </style>
            <div class="tw-px-3 tw-py-1">
                <div class="bcg-toggle" id="bcgToggleGroup">
                    <input type="radio" id="sceneNoBackground" name="sceneColorTypeRadio" value="None" />
                    <label for="sceneNoBackground" onclick="bcgRadioSelect({value:4})">None</label>
                    <input type="radio" id="sceneHorizon" name="sceneColorTypeRadio" value="Horizon" checked />
                    <label for="sceneHorizon" onclick="bcgRadioSelect({value:0})">Horizon</label>
                    <input type="radio" id="sceneColorRadio" name="sceneColorTypeRadio" value="color" />
                    <label for="sceneColorRadio" onclick="bcgRadioSelect({value:1})">Color</label>
                    <input type="radio" id="sceneSky" name="sceneColorTypeRadio" value="sky" />
                    <label for="sceneSky" onclick="bcgRadioSelect({value:2})">Presets</label>
                    <input type="radio" id="sceneCustomImage" name="sceneColorTypeRadio" value="Custom_img" />
                    <label for="sceneCustomImage" onclick="bcgRadioSelect({value:3})">Image</label>
                </div>
                <p id="sceneHorizonDescription" class="tw-hidden tw-mt-2 tw-text-[11px] tw-leading-relaxed tw-text-white/60">
                    Auto-generates a natural outdoor horizon with clear sky, sunlight, and balanced scene lighting for a bright daytime look.
                </p>
            </div>
            <!-- Background sub-options (shown/hidden by bcgRadioSelect) -->
            <div id="bcgSubOptions" class="tw-flex tw-flex-col tw-gap-2 tw-mt-1 tw-mb-1 tw-px-3 tw-py-1">
                <div id="bcgHorizonSkyRow" class="tw-flex tw-items-center tw-gap-2" style="display:none">
                    <label class="tw-text-xs tw-text-white/80 tw-w-20 tw-flex-shrink-0">Sky preset</label>
                    <select name="horizonSkyPreset" id="horizonSkyPreset" class="tw-select tw-select-xs tw-bg-slate-800 tw-text-white tw-border-white/10" style="font-size: 10px;" onchange="handleHorizonSkyPresetChange(this)">
                        <option value="natural">Natural</option>
                        <option value="clear">Clear</option>
                        <option value="crisp">Crisp</option>
                    </select>
                </div>
                <div id="bcgColorRow" class="tw-flex tw-items-center tw-gap-2" style="display:none">
                    <label class="tw-text-xs tw-text-white/80 tw-w-12 tw-flex-shrink-0">Color</label>
                    <input id="jscolorpick" class="jscolor {onFineChange:'updateClearColorPicker(this)'}" autocomplete="off" disabled
                           value="000000" style="height:26px; width:60px; padding:2px; border:1px solid rgba(255,255,255,0.1); border-radius:4px; cursor:pointer; background: #1e293b; color: white;">
                    <input type="text" id="sceneClearColor" name="sceneClearColor" form="3dAssetForm" value="#000000" style="visibility:hidden; position:absolute;">
                </div>
                <div id="bcgPresetsRow" class="tw-flex tw-items-center tw-gap-2" style="display:none">
                    <label class="tw-text-xs tw-text-white/80 tw-w-12 tw-flex-shrink-0">Preset</label>
                    <select name="presetsBcg" id="presetsBcg" disabled class="tw-select tw-select-xs tw-bg-slate-800 tw-text-white tw-border-white/10" style="font-size: 10px;">
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
                </div>
                <div id="bcgPresetGroundRow" class="tw-flex tw-items-center tw-gap-2 tw-ml-14" style="display:none">
                    <label class="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-white/80 tw-cursor-pointer">
                        <input id="presetGroundToggle" type="checkbox" class="tw-checkbox tw-checkbox-xs tw-checkbox-primary" checked>
                        <span>Enable preset ground</span>
                    </label>
                </div>
                <div id="bcgImageRow" class="tw-flex tw-items-center tw-gap-2" style="display:none">
                    <label class="tw-text-xs tw-text-white/80 tw-w-12 tw-flex-shrink-0">Image</label>
                    <input id="img_upload_bcg" type="file" name="ImgUploadBcg" value="" accept=".jpg, .png" disabled onchange="imgUpload()"
                           style="font-size: 10px; max-width: 140px; color: rgba(255,255,255,0.6);">
                    <div class="thumbnailImg">
                        <img id="uploadImgThumb" hidden style="max-height:30px; border-radius:4px;">
                    </div>
                </div>
            </div>
        </div>


        <div class="tw-flex tw-flex-col tw-gap-1">
            <div class="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-mt-4 tw-mb-1 tw-bg-slate-950/40">
                <i data-lucide="cloud" class="tw-w-3 tw-h-3 tw-text-sky-400"></i>
                <span class="tw-font-bold tw-text-[10px] tw-text-white tw-uppercase tw-tracking-widest">Fog settings</span>
            </div>

            <style>
                .fog-toggle { display: inline-flex; background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 2px; margin-top: 4px; margin-bottom: 4px; gap: 2px; }
                .fog-toggle input { display: none; }
                .fog-toggle label { padding: 4px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255, 255, 255, 0.7); border-radius: 6px; cursor: pointer; transition: all 0.15s ease; user-select: none; text-align: center; }
                .fog-toggle label:hover { color: #ffffff; }
                .fog-toggle input:checked + label { background: rgba(255, 255, 255, 0.1); color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
            </style>
            <div class="tw-px-3 tw-py-1">
                <div id="FogTypeRadioButtonList" class="fog-toggle" onclick="loadFogType()">
                    <input type="radio" id="RadioNoFog" name="projectTypeRadio" checked value="1" />
                    <label for="RadioNoFog">None</label>
                    <input type="radio" id="RadioLinearFog" name="projectTypeRadio" value="2" />
                    <label for="RadioLinearFog">Linear</label>
                    <input type="radio" id="RadioExponentialFog" name="projectTypeRadio" value="3" />
                    <label for="RadioExponentialFog">Exp</label>
                </div>

                <input type="text" id="FogType" name="FogType"
                       form="3dAssetForm" value="none" style="visibility:hidden;display:none"/>

                <div id="FogValues" style="display:none" class="tw-flex tw-flex-col tw-gap-2 tw-mt-1 tw-mb-2">
                    <span class="tw-font-semibold tw-text-xs tw-text-white/90">Fog values</span>

                    <div class="colorElement tw-flex tw-items-center tw-gap-2" style="display:none">
                        <label class="tw-text-xs tw-text-white/80 tw-w-12 tw-flex-shrink-0">Color</label>
                        <input id="jscolorpickFog" class="jscolor {onFineChange:'updateFogColorPicker(this)'}" autocomplete="off"
                               style="height:26px; width:60px; padding:2px; border:1px solid rgba(255,255,255,0.1); border-radius:4px; cursor:pointer; background: #1e293b; color: white;">
                        <input type="text" id="FogColor" name="FogColor" form="3dAssetForm" value="" style="visibility:hidden; position:absolute;">
                    </div>

                    <div class="linearElement tw-flex tw-items-center tw-gap-2" style="display:none">
                        <label for="FogNear" class="tw-text-xs tw-text-white/80 tw-w-12 tw-flex-shrink-0">Near</label>
                        <input type="text" id="FogNear" name="FogNear" form="3dAssetForm" onchange="updateFog()" value="000000"
                               class="tw-input tw-input-xs tw-input-bordered tw-w-16 tw-bg-slate-800 tw-text-white tw-border-white/10">
                    </div>

                    <div class="linearElement tw-flex tw-items-center tw-gap-2" style="display:none">
                        <label for="FogFar" class="tw-text-xs tw-text-white/80 tw-w-12 tw-flex-shrink-0">Far</label>
                        <input type="text" id="FogFar" name="FogFar" form="3dAssetForm" value="230" onchange="updateFog()"
                               class="tw-input tw-input-xs tw-input-bordered tw-w-16 tw-bg-slate-800 tw-text-white tw-border-white/10">
                    </div>

                    <div class="exponentialElement tw-flex tw-flex-col tw-gap-2 tw-mb-2" style="display:none">
                        <div class="tw-flex tw-items-center tw-justify-between">
                            <label for="FogDensitySlider" class="tw-text-xs tw-font-semibold tw-text-white/80">Density</label>
                            <span id="FogDensityLabel" class="tw-text-[10px] tw-font-bold tw-text-primary tw-uppercase">OFF</span>
                        </div>
                        <input type="range" min="0" max="3" value="0" step="1" 
                               class="tw-range tw-range-xs tw-range-primary" id="FogDensitySlider"
                               oninput="handleFogDensitySlider(this.value)">
                        <div class="tw-w-full tw-flex tw-justify-between tw-text-[9px] tw-px-1 tw-opacity-50">
                            <span>OFF</span>
                            <span>FAR</span>
                            <span>MID</span>
                            <span>NEAR</span>
                        </div>
                        <input type="hidden" id="FogDensity" name="FogDensity" form="3dAssetForm" value="0.0">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
