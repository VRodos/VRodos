<?php
wp_enqueue_style('vrodos_frontend_stylesheet');
wp_enqueue_style('vrodos_material_stylesheet');

// Is on back or front end ?
$isAdmin = is_admin() ? 'back' : 'front';
?>

	<script>
		let isAdmin="<?php echo $isAdmin; ?>";
		console.log("VRodos: Asset Editor Template Loaded");
	</script>

<?php
$data = VRodos_Asset_CPT_Manager::prepare_asset_editor_template_data();
extract($data);
?>
	<script>
		let path_url = null;
		let glb_file_name = <?php echo json_encode($glb_file_name); ?>;
		let no_img_path = '<?php echo esc_url($no_img_path_url ?? ''); ?>';
		var asset_title = <?php echo json_encode($asset_title_value); ?>;
	</script>
<!DOCTYPE html>
<html lang="en" data-theme="emerald">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asset Editor | VRodos</title>
    <script src="https://unpkg.com/lucide@latest"></script>
    <?php wp_head(); ?>
</head>
<body <?php body_class('vrodos-manager-wrapper tw-bg-slate-50 tw-text-slate-900 tw-antialiased vrodos-main-h tw-overflow-hidden'); ?>>

<div id="vrodos-asset-editor" class="vrodos-main-h tw-flex tw-flex-col">

    <!-- Header (Unified Light Header) -->
    <header class="tw-h-16 tw-flex-none tw-bg-white tw-border-b tw-border-slate-200 tw-px-8 tw-z-[60] tw-shadow-sm tw-flex tw-items-center">
        <div class="tw-w-full tw-flex tw-items-center tw-justify-between">
            <div class="tw-flex tw-items-center tw-gap-4">
                <span class="tw-text-xl tw-font-black tw-tracking-tight tw-text-primary">VRODOS</span>
            </div>

            <div class="tw-flex tw-items-center tw-gap-6">
                <div class="tw-flex tw-items-center tw-gap-3">
                    <h1 class="tw-text-xs tw-font-bold tw-text-slate-400 tw-uppercase tw-tracking-widest">Asset Editor</h1>
                </div>
                <div class="tw-h-4 tw-w-px tw-bg-slate-200"></div>
                <a href="<?php echo $goBackToLink; ?>" class="tw-flex tw-items-center tw-gap-2 tw-text-[11px] tw-font-black tw-text-slate-400 hover:tw-text-primary tw-uppercase tw-tracking-wider tw-transition-all">
                    <i data-lucide="arrow-left" class="tw-w-4 tw-h-4"></i>
                    Back to List
                </a>
            </div>
        </div>
    </header>

    <?php if (!is_user_logged_in() || !current_user_can('administrator')) { ?>
        <main class="tw-flex-1 tw-flex tw-items-center tw-justify-center tw-p-8">
            <div class="tw-max-w-md tw-w-full tw-bg-white tw-rounded-3xl tw-p-10 tw-border tw-border-slate-200 tw-shadow-xl tw-text-center">
                <div class="tw-w-20 tw-h-20 tw-bg-slate-50 tw-rounded-2xl tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-6">
                    <i data-lucide="lock" class="tw-w-10 tw-h-10 tw-text-slate-300"></i>
                </div>
                <h2 class="tw-text-2xl tw-font-black tw-text-slate-800 tw-mb-4">Authentication Required</h2>
                <p class="tw-text-slate-500 tw-font-medium tw-mb-8">Please login to access the asset editor and manage your 3D repository.</p>
                <div class="tw-flex tw-flex-col tw-gap-3">
                    <a href="<?php echo wp_login_url(get_permalink()); ?>" class="d-btn d-btn-primary tw-text-white tw-font-bold tw-rounded-xl">Log In</a>
                    <a href="<?php echo wp_registration_url(); ?>" class="d-btn d-btn-ghost tw-text-slate-400 tw-font-bold">Create Account</a>
                </div>
            </div>
        </main>
    <?php
}
else { ?>
        <form name="3dAssetForm" id="3dAssetForm" method="POST" enctype="multipart/form-data" class="tw-flex-1 tw-flex tw-flex-col">
            <main class="tw-flex-1 tw-flex tw-flex-col lg:tw-flex-row tw-overflow-hidden">
            
            <!-- Left Column: 3D Preview & Files -->
            <div class="tw-w-full lg:tw-w-[420px] tw-flex-none tw-bg-slate-50 tw-border-b lg:tw-border-b-0 lg:tw-border-r tw-border-slate-200 tw-overflow-y-auto lg:tw-h-full">
                <div class="tw-p-6 lg:tw-p-8 tw-space-y-6">
                    <!-- 3D Preview Card -->
                    <div class="tw-bg-white tw-rounded-3xl tw-border tw-border-slate-200 tw-shadow-sm tw-overflow-hidden tw-relative tw-aspect-[4/3]">
                        <!-- Preview Overlay -->
                        <div id="previewProgressSlider" class="tw-absolute tw-inset-0 tw-z-10 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-slate-900/50 tw-backdrop-blur-sm tw-transition-opacity">
                            <div class="tw-bg-white tw-p-6 tw-rounded-2xl tw-shadow-2xl tw-text-center tw-min-w-[200px]">
                                <h6 id="previewProgressLabel" class="tw-text-[10px] tw-font-black tw-text-slate-400 tw-uppercase tw-tracking-widest tw-mb-3">Loading</h6>
                                <div class="tw-w-full tw-h-1.5 tw-bg-slate-100 tw-rounded-full tw-overflow-hidden">
                                    <div id="previewProgressSliderLine" class="tw-h-full tw-bg-primary tw-transition-all tw-duration-300" style="width: 0%;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 3D Canvas -->
                        <div id="wrapper_3d_inner" class="tw-w-full tw-h-full">
                            <div id="previewCanvasLabels" class="tw-absolute tw-inset-0 tw-pointer-events-none tw-z-20"></div>
                            <canvas id="previewCanvas" class="tw-w-full tw-h-full">3D canvas</canvas>
                        </div>
                        
                        <!-- Mini Controls Overlay -->
                        <div class="tw-absolute tw-bottom-4 tw-left-4 tw-z-30 tw-pointer-events-auto tw-flex tw-items-center tw-gap-2">
                            <button type="button" id="animButton1" onclick="asset_viewer_3d_kernel.playStopAnimation();" 
                                    class="d-btn d-btn-xs tw-bg-white/90 tw-backdrop-blur-sm tw-border-none hover:tw-bg-white tw-shadow-md tw-rounded-lg tw-px-3 tw-gap-1.5 tw-h-8">
                                <i data-lucide="play" class="tw-w-3.5 tw-h-3.5"></i>
                                <span class="tw-text-[10px] tw-font-bold tw-uppercase">Anim</span>
                            </button>
                        </div>

                        <!-- Theme Control Overlay (BG Color) -->
                        <div class="tw-absolute tw-bottom-4 tw-right-4 tw-z-30 tw-pointer-events-auto tw-flex tw-items-center tw-gap-2 tw-bg-white/90 tw-backdrop-blur-sm tw-px-3 tw-rounded-lg tw-shadow-md tw-border tw-border-slate-100 tw-h-8">
                             <i data-lucide="palette" class="tw-w-3.5 tw-h-3.5 tw-text-slate-400"></i>
                             <input id="jscolorpick" class="tw-w-20 tw-h-5 tw-rounded-md tw-cursor-pointer tw-border-none jscolor {onFineChange:'updateColorPicker(this, asset_viewer_3d_kernel)'}" value="000000">
                             <input id="assetback3dcolor" type="hidden" name="assetback3dcolor" value="<?php echo esc_attr(trim($asset_back_3d_color_saved)); ?>" />
                        </div>
                    </div>

                    <!-- GLB Upload Card (Moved from sidebar) -->
                    <?php if (($isOwner || $isUserAdmin)) { ?>
                    <div id="glb_file_section" class="tw-bg-white tw-p-6 tw-rounded-3xl tw-border tw-border-slate-200 tw-shadow-sm tw-space-y-4">
                        <div class="tw-flex tw-items-center tw-justify-between">
                            <label class="tw-block tw-text-[10px] tw-font-black tw-text-slate-400 tw-uppercase tw-tracking-widest">
                                3D Content (GLB)
                            </label>
                            <i data-lucide="box" class="tw-w-4 tw-h-4 tw-text-primary"></i>
                        </div>
                        
                        <div class="tw-w-full tw-bg-slate-50 tw-border tw-border-dashed tw-border-slate-200 tw-rounded-2xl tw-p-4 tw-text-center hover:tw-border-primary hover:tw-bg-primary/5 tw-transition-all tw-group">
                            <input id="fileUploadInput" class="tw-hidden" type="file" name="multipleFilesInput[]" accept=".glb" onclick="clearList()"/>
                            <label for="fileUploadInput" class="tw-cursor-pointer tw-flex tw-flex-col tw-items-center tw-gap-2">
                                <div class="tw-w-8 tw-h-8 tw-bg-white tw-shadow-sm tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-group-hover:tw-scale-110 tw-transition-transform">
                                    <i data-lucide="upload-cloud" class="tw-w-4 tw-h-4 tw-text-primary"></i>
                                </div>
                                <div>
                                    <p id="fileUploadInputLabel" class="tw-text-xs tw-font-bold tw-text-slate-800">Model Upload</p>
                                    <p class="tw-text-[9px] tw-text-slate-400 tw-font-bold tw-uppercase">GLB MAX 50MB</p>
                                </div>
                            </label>
                        </div>

                        <input type="hidden" name="glbFileInput" value="" id="glbFileInput" />
                        <input type="hidden" id="assettrs" name="assettrs" value="<?php echo trim($assettrs_saved); ?>" />
                    </div>
                    <?php
	}?>

                    <!-- Context Tip Card -->
                    <div class="tw-bg-emerald-50 tw-border tw-border-emerald-100 tw-p-5 tw-rounded-2xl">
                        <div class="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                             <i data-lucide="sparkles" class="tw-w-4 tw-h-4 tw-text-emerald-500"></i>
                             <span class="tw-text-[10px] tw-font-black tw-text-emerald-700 tw-uppercase tw-tracking-widest">Editor Tip</span>
                        </div>
                        <p class="tw-text-[11px] tw-text-emerald-800 tw-font-medium tw-leading-relaxed">
                            Upload your GLB model here to preview it in real-time. Use the screenshot tool in the right panel to capture the preview.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Right Center: Main Form Area -->
            <div class="tw-flex-1 tw-bg-white lg:tw-border-l tw-border-slate-200 tw-overflow-y-auto">
                
                    
                    <!-- Primary Action Sticky Header -->
                    <div class="tw-sticky tw-top-0 tw-z-30 tw-bg-white/80 tw-backdrop-blur-md tw-border-b tw-border-slate-100 tw-px-10 tw-py-5 tw-flex tw-items-center tw-justify-between">
                        <div class="tw-flex tw-items-center tw-gap-3">
                            <i data-lucide="file-edit" class="tw-w-4 tw-h-4 tw-text-slate-300"></i>
                            <span class="tw-text-[10px] tw-font-black tw-text-slate-400 tw-uppercase tw-tracking-widest"><?php echo $asset_id ? 'Editing Asset' : 'New Asset'; ?></span>
                        </div>
                        <?php if (($isOwner || $isUserAdmin)) { ?>
                            <button id="formSubmitBtn" type="submit" class="d-btn d-btn-primary tw-text-white tw-font-black tw-px-10 tw-rounded-xl tw-shadow-lg tw-shadow-emerald-500/20 tw-transition-all active:tw-scale-95 tw-gap-2">
                                <i data-lucide="<?php echo $asset_id ? 'save' : 'plus-circle'; ?>" class="tw-w-4 tw-h-4"></i>
                                <?php echo $asset_id ? 'UPDATE ASSET' : 'CREATE ASSET'; ?>
                            </button>
                        <?php } ?>
                    </div>

                    <!-- Metadata Form -->
                    <div class="tw-px-10 tw-py-6 tw-space-y-8">

                <?php if (($isOwner || $isUserAdmin) && $isEditMode) {
		wp_nonce_field('post_nonce', 'post_nonce_field');
?>
                        <input type="hidden" name="submitted" id="submitted" value="true"/>
                    <?php
	}?>

                <div class="tw-grid tw-grid-cols-2 tw-gap-6">
                    
                    <!-- Asset Title -->
                    <div class="tw-space-y-4">
                        <label for="assetTitle" class="tw-block tw-text-xs tw-font-bold tw-text-slate-400 tw-uppercase tw-tracking-widest">
                            Asset Name
                        </label>
                        <div class="tw-relative">
                            <input id="assetTitle" type="text"
                                   class="tw-w-full tw-bg-slate-50 tw-border-slate-200 tw-rounded-2xl tw-px-4 tw-py-3 tw-text-sm tw-text-slate-900 focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-transition-all tw-font-bold tw-placeholder-slate-300"
                                   name="assetTitle"
                                   placeholder="e.g. Ancient Temple"
                                   required minlength="3" maxlength="25"
                                   value="<?php echo $asset_title_value; ?>">
                        </div>
                    </div>

                    <!-- Category Selection -->
                    <div class="tw-space-y-4">
                        <label for="category-select-native" class="tw-block tw-text-xs tw-font-bold tw-text-slate-400 tw-uppercase tw-tracking-widest">
                            Asset Category
                        </label>
                        <div class="tw-relative">
                            <select id="category-select-native" name="term_id_native" class="tw-w-full tw-bg-slate-50 tw-border-slate-200 tw-rounded-2xl tw-px-4 tw-py-3 tw-text-sm tw-text-slate-900 focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-transition-all tw-font-bold tw-appearance-none d-select d-select-ghost d-select-sm tw-cursor-pointer">
                                <option disabled <?php echo empty($saved_term) ? 'selected' : ''; ?>>Select a category</option>
                                <?php foreach ($cat_terms as $term):
		$isSelected = !empty($saved_term) && $saved_term[0]->term_id == $term->term_id;
?>
                                    <option value="<?php echo esc_attr($term->slug); ?>" 
                                            data-cat-desc="<?php echo esc_attr($term->description); ?>"
                                            data-cat-id="<?php echo esc_attr($term->term_id); ?>"
                                            <?php echo $isSelected ? 'selected' : ''; ?>>
                                        <?php echo esc_html($term->name); ?>
                                    </option>
                                <?php
	endforeach; ?>
                            </select>
                            <div class="tw-absolute tw-inset-y-0 tw-right-0 tw-pr-4 tw-flex tw-items-center tw-pointer-events-none text-slate-400">
                                <i data-lucide="chevron-down" class="tw-w-5 tw-h-5"></i>
                            </div>
                        </div>
                        <p id="categoryDescription" class="tw-text-[11px] tw-text-emerald-600 tw-font-bold tw-leading-relaxed"></p>
                    </div>

                </div>

                <!-- Hidden inputs for legacy JS compatibility (moved outside grid) -->
                <div id="category-select" style="display:none;"></div>
                <input id="termIdInput" type="hidden" name="term_id" value="">
                <div id="currently-selected-category" 
                     data-cat-id="<?php echo !empty($saved_term) ? esc_attr($saved_term[0]->term_id) : ''; ?>"
                     data-cat-slug="<?php echo !empty($saved_term) ? esc_attr($saved_term[0]->slug) : ''; ?>"
                     data-cat-desc="<?php echo !empty($saved_term) ? esc_attr($saved_term[0]->description) : ''; ?>">
                </div>


                <div id="video_section" class="tw-space-y-6" style="display: none;">
                    <label class="tw-block tw-text-xs tw-font-bold tw-text-slate-400 tw-uppercase tw-tracking-widest">
                        Video Source
                    </label>
                    
                    <div class="tw-bg-slate-900 tw-rounded-2xl tw-overflow-hidden tw-shadow-xl">
                        <video id="assetVideoTag" class="tw-w-full tw-aspect-video" preload="auto" controls>
                            <source id="assetVideoSource" src="<?php echo esc_url($video_attachment_file ?? ''); ?>" type="video/mp4">
                        </video>
                    </div>

                    <div class="tw-flex tw-gap-3">
                        <input class="d-file-input d-file-input-bordered tw-w-full tw-rounded-xl" type="file" name="videoFileInput" id="videoFileInput" accept="video/mp4,video/webm"/>
                    </div>
                    <p class="tw-text-[10px] tw-text-slate-400 tw-font-bold tw-uppercase">Supported formats: MP4, WebM</p>
                </div>

                <div id="screenshot_section" class="tw-space-y-6" style="display: block;">
                    <div class="tw-flex tw-items-center tw-justify-between">
                        <label class="tw-block tw-text-xs tw-font-bold tw-text-slate-400 tw-uppercase tw-tracking-widest">
                            Screenshot
                        </label>
                        <i data-lucide="image" class="tw-w-5 tw-h-5 tw-text-primary"></i>
                    </div>

                    <div class="tw-w-1/2">
                        <!-- Screenshot Preview (Full width of the 50% container) -->
                        <div class="tw-relative tw-aspect-video tw-bg-slate-100 tw-rounded-3xl tw-overflow-hidden tw-border tw-border-slate-200 tw-group">
                            <?php if ($scrnImageURL) : ?>
                                <img id="sshotPreviewImg" src="<?php echo esc_url($scrnImageURL); ?>" alt="Asset Screenshot" 
                                     class="tw-w-full tw-h-full tw-object-cover tw-transition-transform group-hover:tw-scale-110 !tw-max-h-none !tw-w-full !tw-h-full">
                            <?php else : ?>
                                <div class="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-text-slate-300">
                                    <i data-lucide="camera" class="tw-w-16 tw-h-16"></i>
                                </div>
                                <img id="sshotPreviewImg" src="" class="tw-hidden !tw-max-h-none !tw-w-full !tw-h-full">
                            <?php endif; ?>
                            
                            <input type="hidden" name="sshotFileInput" value="" id="sshotFileInput" accept="image/png"/>
                            
                            <!-- Capture Button Overlay -->
                            <div class="tw-absolute tw-bottom-4 tw-right-4">
                                <button id="createModelScreenshotBtn" type="button" class="d-btn d-btn-md tw-bg-white/90 tw-backdrop-blur tw-border-none hover:tw-bg-white tw-text-slate-900 tw-font-bold tw-rounded-xl tw-shadow-xl tw-gap-2">
                                    <i data-lucide="camera" class="tw-w-4 tw-h-4"></i>
                                    Capture Screenshot
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="video_screenshot_section" class="tw-space-y-4" style="display:none;">
                    <label class="tw-block tw-text-xs tw-font-bold tw-text-slate-400 tw-uppercase tw-tracking-widest">
                        Video Poster
                    </label>
                    <div class="tw-aspect-video tw-bg-slate-100 tw-rounded-2xl tw-overflow-hidden tw-border tw-border-slate-200">
                        <canvas id="videoSshotPreviewImg" class="tw-w-full tw-h-full tw-object-cover"></canvas>
                        <input type="hidden" name="videoSshotFileInput" id="videoSshotFileInput" accept="image/png"/>
                    </div>
                    <p class="tw-text-[10px] tw-text-slate-400 tw-font-bold tw-uppercase tw-mt-2">Auto-generated from video seek</p>
                </div>

                <!-- POI Details (Image/Text) -->
                <div id="poi_image_text_section" class="tw-space-y-6" style="display: none;">
                    <label class="tw-block tw-text-xs tw-font-bold tw-text-slate-400 tw-uppercase tw-tracking-widest">
                        Information Overlay
                    </label>
                    <div class="tw-space-y-4">
                        <input id="poiImgTitle" type="text" 
                               class="tw-w-full tw-bg-slate-50 tw-border-slate-200 tw-rounded-2xl tw-px-6 tw-py-4 tw-text-slate-900 focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-transition-all tw-font-bold tw-placeholder-slate-300" 
                               name="poiImgTitle" 
                               placeholder="Title of information popup"
                               minlength="3" maxlength="50" 
                               value="<?php echo esc_attr($poi_img_title); ?>">
                        
                        <textarea id="poiImgDescription" name="poiImgDescription" 
                                  class="tw-w-full tw-bg-slate-50 tw-border-slate-200 tw-rounded-2xl tw-px-6 tw-py-4 tw-text-slate-900 focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-transition-all tw-font-medium tw-placeholder-slate-300 min-h-[160px]" 
                                  placeholder="Write the content here..."><?php echo esc_textarea($poi_img_content); ?></textarea>
                    </div>
                </div>

                <!-- Chat Options -->
                <div id="poi_help_section" class="tw-bg-slate-50 tw-p-8 tw-rounded-3xl tw-border tw-border-slate-200 tw-mt-4" style="display: none;">
                    <h3 class="tw-text-slate-900 tw-font-black tw-text-lg tw-mb-6 tw-flex tw-items-center tw-gap-3">
                        <i data-lucide="message-square" class="tw-w-6 tw-h-6 tw-text-primary"></i>
                        Collaboration Settings
                    </h3>

                    <div class="tw-space-y-8">
                        <div>
                            <label for="poiChatTitle" class="tw-block tw-text-[10px] tw-font-black tw-text-slate-400 tw-uppercase tw-tracking-widest tw-mb-3">
                                Display Name
                            </label>
                            <input id="poiChatTitle" type="text"
                                   class="tw-w-full tw-bg-white tw-border-slate-200 tw-rounded-2xl tw-px-6 tw-py-4 tw-text-slate-900 focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-transition-all tw-font-bold"
                                   name="poiChatTitle"
                                   minlength="3" maxlength="50"
                                   value="<?php echo esc_attr($poi_chat_title); ?>">
                        </div>

                        <div class="tw-flex tw-items-center tw-gap-4 tw-p-5 tw-bg-white tw-rounded-2xl tw-border tw-border-slate-100">
                            <input type="checkbox" id="poiChatIndicators" name="poiChatIndicators"
                                   class="d-checkbox d-checkbox-primary tw-rounded-lg"
                                   <?php echo $poi_chat_indicators; ?>/>
                            <label for="poiChatIndicators" class="tw-cursor-pointer">
                                <span class="tw-block tw-text-sm tw-font-black tw-text-slate-800">Show 3D Indicator</span>
                                <span class="tw-block tw-text-[10px] tw-text-slate-400 tw-font-bold tw-uppercase tw-mt-0.5">Visible floating icon in the scene</span>
                            </label>
                        </div>

                        <div>
                            <label for="poiChatNumPeople" class="tw-block tw-text-[10px] tw-font-black tw-text-slate-400 tw-uppercase tw-tracking-widest tw-mb-3">
                                Capacity (2-8 learners)
                            </label>
                            <input id="poiChatNumPeople" type="number"
                                   class="tw-w-full tw-bg-white tw-border-slate-200 tw-rounded-2xl tw-px-6 tw-py-4 tw-text-slate-900 focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-transition-all tw-font-bold"
                                   name="poiChatNumPeople"
                                   min="2" max="8"
                                   value="<?php echo esc_attr($poi_chat_num_people); ?>">
                        </div>
                    </div>
                </div>

                <!-- External Link -->
                <div id="poi_link_section" class="tw-space-y-4" style="display: none;">
                    <label for="assetLinkInput" class="tw-block tw-text-xs tw-font-bold tw-text-slate-400 tw-uppercase tw-tracking-widest">
                        Destination URL
                    </label>
                    <div class="tw-relative">
                        <div class="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-4 tw-flex tw-items-center tw-pointer-events-none">
                            <i data-lucide="link" class="tw-w-5 tw-h-5 tw-text-slate-300"></i>
                        </div>
                        <input id="assetLinkInput" name="assetLinkInput" 
                               class="tw-w-full tw-bg-slate-50 tw-border-slate-200 tw-rounded-2xl tw-pl-12 tw-pr-4 tw-py-4 tw-text-slate-900 focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-transition-all tw-font-bold" 
                               value="<?php echo esc_textarea($asset_link); ?>">
                    </div>
                </div>

                <!-- Video Options -->
                <div id="video_options_section" class="tw-space-y-6" style="display: none;">
                    <label class="tw-block tw-text-xs tw-font-bold tw-text-slate-400 tw-uppercase tw-tracking-widest">
                        Playback Settings
                    </label>
                    <div class="tw-space-y-4">
                        <input id="videoTitle" type="text" 
                               class="tw-w-full tw-bg-slate-50 tw-border-slate-200 tw-rounded-2xl tw-px-6 tw-py-4 tw-text-slate-900 focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-transition-all tw-font-bold tw-placeholder-slate-300" 
                               name="videoTitle" 
                               placeholder="Video title (optional)"
                               minlength="3" maxlength="25" 
                               value="<?php echo esc_attr($video_title); ?>">
                        
                        <div class="tw-flex tw-items-center tw-gap-4 tw-p-5 tw-bg-slate-50 tw-rounded-2xl tw-border tw-border-slate-100">
                            <input type="checkbox" id="video_autoloop_checkbox" name="video_autoloop_checkbox" 
                                   class="d-checkbox d-checkbox-primary tw-rounded-lg" <?php echo $video_autoloop; ?>/>
                            <label for="video_autoloop_checkbox" class="tw-cursor-pointer">
                                <span class="tw-block tw-text-sm tw-font-black tw-text-slate-800">Autoplay & Loop</span>
                                <span class="tw-block tw-text-[10px] tw-text-slate-400 tw-font-bold tw-uppercase tw-mt-0.5">Start instantly and repeat</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Image POI Upload -->
                <div id="poi_image_file_section" class="tw-space-y-6" style="display: none;">
                    <label class="tw-block tw-text-xs tw-font-bold tw-text-slate-400 tw-uppercase tw-tracking-widest">
                        Infobox Image
                    </label>
                    <div class="tw-relative tw-aspect-video tw-bg-slate-100 tw-rounded-3xl tw-overflow-hidden tw-border-2 tw-border-dashed tw-border-slate-200 hover:tw-border-primary tw-transition-all group">
                        <img id="imagePoiPreviewImg" src="<?php echo esc_url($imagePoiImageURL ?? ''); ?>" alt="POI Image" class="tw-w-full tw-h-full tw-object-cover">
                        <div class="tw-absolute tw-inset-0 tw-bg-slate-900/40 tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-flex tw-items-center tw-justify-center">
                            <label for="imageFileInput" class="d-btn d-btn-sm tw-bg-white tw-border-none hover:tw-bg-slate-100 tw-text-slate-900 tw-font-bold tw-rounded-xl tw-gap-2 tw-cursor-pointer">
                                <i data-lucide="upload" class="tw-w-4 tw-h-4"></i>
                                Replace
                            </label>
                        </div>
                        <input type="file" id="imageFileInput" name="imageFileInput" class="tw-hidden" accept="image/png, image/jpg, image/jpeg"/>
                    </div>
                </div>

                <!-- IPR Selection -->
                <div id="ipr_section" class="tw-space-y-4" style="display: none;">
                    <label for="category-ipr-select-native" class="tw-block tw-text-xs tw-font-bold tw-text-slate-400 tw-uppercase tw-tracking-widest">
                        Intellectual Property
                    </label>
                    <div class="tw-relative">
                        <div class="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-4 tw-flex tw-items-center tw-pointer-events-none">
                            <i data-lucide="shield-check" class="tw-w-5 tw-h-5 tw-text-slate-300"></i>
                        </div>
                        <select id="category-ipr-select-native" name="term_id_ipr_native" class="tw-w-full tw-bg-slate-50 tw-border-slate-200 tw-rounded-2xl tw-pl-12 tw-pr-4 tw-py-4 tw-text-slate-900 focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-transition-all tw-font-bold tw-appearance-none d-select d-select-ghost tw-cursor-pointer">
                            <option disabled <?php echo empty($saved_ipr_term) ? 'selected' : ''; ?>>Select IPR Plan</option>
                            <?php foreach ($cat_ipr_terms as $term_ipr):
		$isSelected = !empty($saved_ipr_term) && $saved_ipr_term[0]->term_id == $term_ipr->term_id;
?>
                                <option value="<?php echo esc_attr($term_ipr->slug); ?>" 
                                        data-cat-ipr-desc="<?php echo esc_attr($term_ipr->description); ?>"
                                        id="<?php echo esc_attr($term_ipr->term_id); ?>"
                                        <?php echo $isSelected ? 'selected' : ''; ?>>
                                    <?php echo esc_html($term_ipr->name); ?>
                                </option>
                            <?php
	endforeach; ?>
                        </select>
                    </div>
                    <p id="categoryIPRDescription" class="tw-text-[11px] tw-text-slate-400 tw-font-bold tw-leading-relaxed"></p>
                    
                    <!-- Legacy JS Compatibility -->
                    <div id="category-ipr-select" style="display:none;"></div>
                    <input id="termIdInputIPR" type="hidden" name="term_id_ipr" value="">
                    <div id="currently-ipr-selected"
                         data-cat-ipr-id="<?php echo !empty($saved_ipr_term) ? esc_attr($saved_ipr_term[0]->term_id) : ''; ?>"
                         data-cat-ipr-slug="<?php echo !empty($saved_ipr_term) ? esc_attr($saved_ipr_term[0]->slug) : ''; ?>"
                         data-cat-ipr-desc="<?php echo !empty($saved_ipr_term) ? esc_attr($saved_ipr_term[0]->description) : ''; ?>">
                    </div>
                </div>
            </div>

    <!-- Audio Hidden Panel -->
    <div id="audioDetailsPanel" class="tw-hidden">
        <input class="FullWidth" type="file" name="audioFileInput" value="" id="audioFileInput" accept="audio/mp3,audio/wav"/>
        <audio id='audioFile' controls loop preload="auto">
            <source src="<?php echo esc_url($audio_attachment_file ?? ''); ?>" type="audio/<?php echo esc_attr($audio_file_type); ?>">
        </audio>
    </div>


	<script type="text/javascript">
		'use strict';

		const assetVideoSrc = document.getElementById("assetVideoSource");
		const assetVideoTag = document.getElementById("assetVideoTag");

		const videoInputTag = document.getElementById("videoFileInput");
		const videoSshotCanvas = document.getElementById("videoSshotPreviewImg");
		const videoSshotFileInput = document.getElementById("videoSshotFileInput");

		const multipleFilesInputElem = document.getElementById( 'fileUploadInput' );

		let back_3d_color = "<?php echo $back_3d_color; ?>";
		document.getElementById("jscolorpick").value = back_3d_color;

		let isLoggedIn = <?php echo $isUserloggedIn ? 1 : 0; ?>;
		let isEditMode = (isLoggedIn === 1) ? 1 : 0 ;
		console.log("isEditModeA:", isEditMode);

		// Define this globally so it's accessible to vrodos_asset_editor_scripts.js
		var sshotPreviewDefaultImg = document.getElementById("sshotPreviewImg") ? document.getElementById("sshotPreviewImg").src : "";

		let assettrs = document.getElementById( 'assettrs') ? document.getElementById( 'assettrs' ).value : "<?php echo $assettrs_saved; ?>";

		// Initialize Lucide icons
		const initIcons = () => {
			if (typeof lucide !== 'undefined') {
				lucide.createIcons();
			}
		};

		document.addEventListener('DOMContentLoaded', initIcons);

		assetVideoTag.addEventListener('loadeddata', function() {
			generateVideoSshot(videoSshotCanvas, assetVideoTag);
		}, false);
		assetVideoTag.addEventListener('seeked', function(){
			generateVideoSshot(videoSshotCanvas, assetVideoTag);
		});

		setScreenshotHandler();

		// ------- Class to load 3D model ---------
		let asset_viewer_3d_kernel = new VRodos_AssetViewer_3D_kernel(document.getElementById( 'previewCanvas' ),
			document.getElementById( 'previewCanvasLabels' ),
			document.getElementById('animButton1'),
			document.getElementById('previewProgressSlider'), // Hide entire slider when ready
			document.getElementById('previewProgressSliderLine'),
			back_3d_color,
			null,
			path_url, // OBJ textures path
			null,
			null,
			null,
			null,
			glb_file_name,
			null,
			false,
			false,
			false,
			true,
			assettrs,
			null); // boundSphButton removed

		addHandlerFor3Dfiles(asset_viewer_3d_kernel, multipleFilesInputElem);

		// Select category handler
		if( isEditMode === 1) {

			(function() {
				const categoryDropdownNative = document.getElementById('category-select-native');
				const iprDropdownNative = document.getElementById('category-ipr-select-native');

				if (categoryDropdownNative) {
					categoryDropdownNative.addEventListener('change', () => {
						let currentSlug = updateSelectComponent();
						resetCategory();
						loadLayout(currentSlug);
						initIcons(); // Re-initialize icons for new sections
					});
				}

				if (iprDropdownNative) {
					iprDropdownNative.addEventListener('change', () => {
						const selectedOption = iprDropdownNative.options[iprDropdownNative.selectedIndex];
						document.getElementById("categoryIPRDescription").innerHTML = selectedOption.getAttribute("data-cat-ipr-desc");
						document.getElementById("termIdInputIPR").value = selectedOption.getAttribute("id");
					});
				}

				let resetCategory = () => {
					clearList();
					document.getElementById('glb_file_section').style.display = "block";
					document.getElementById('screenshot_section').style.display = "block";
					document.getElementById('ipr_section').style.display = "none";
					document.getElementById('poi_help_section').style.display = "none";
					document.getElementById('poi_link_section').style.display = "none";
					document.getElementById('video_section').style.display = "none";
					document.getElementById('video_options_section').style.display = "none";
					document.getElementById('video_screenshot_section').style.display = "none";
					document.getElementById('poi_image_text_section').style.display = "none";
					document.getElementById('poi_image_file_section').style.display = "none";
				};

				let loadLayout = (slug) => {
					switch (slug) {
						case "chat":
							document.getElementById('ipr_section').style.display = "none";
							document.getElementById('poi_help_section').style.display = "block";
							break;
						case "poi-imagetext":
							document.getElementById('poi_image_text_section').style.display = "block";
							document.getElementById('poi_image_file_section').style.display = "block";
							break;
						case "poi-link":
							document.getElementById('poi_link_section').style.display = "block";
							break;
						case "video":
							document.getElementById('glb_file_section').style.display = "none";
							document.getElementById('screenshot_section').style.display = "none";
							document.getElementById('video_section').style.display = "block";
							document.getElementById('video_options_section').style.display = "block";
							document.getElementById('video_screenshot_section').style.display = "block";
							break;
					}
					asset_viewer_3d_kernel.resizeDisplayGL();
				};

				jQuery( document ).ready(function() {
					// Load preselected asset cat
					const currentlySelected = document.getElementById('currently-selected-category');
					if (currentlySelected && currentlySelected.getAttribute("data-cat-id")) {
						let catSlug = updateSelectComponent();
						loadLayout(catSlug);
					}

					// Load preselected ipr cat
					const iprSelected = document.getElementById('currently-ipr-selected');
					if (iprSelected && iprSelected.getAttribute("data-cat-ipr-id")) {
						if (iprDropdownNative) {
							iprDropdownNative.disabled = true;
							iprDropdownNative.classList.add('d-select-disabled');
						}
					}

					videoInputTag.addEventListener('change', readVideo);
				});

				function updateSelectComponent() {
					if (document.getElementById('formSubmitBtn')) {
						document.getElementById('formSubmitBtn').disabled = false;
					}

					const selectedOption = categoryDropdownNative.options[categoryDropdownNative.selectedIndex];
					const slug = selectedOption.value;
					const catId = selectedOption.getAttribute('data-cat-id');
					const catDesc = selectedOption.getAttribute('data-cat-desc');

					document.getElementById('termIdInput').value = catId;
					document.getElementById('categoryDescription').innerHTML = catDesc;
					
					return slug;
				}

				document.getElementById('imageFileInput').onchange = function (evt) {
					let tgt = evt.target || window.event.srcElement,
						files = tgt.files;

					if (FileReader && files && files.length) {
						let fr = new FileReader();
						fr.onload = function () {
							document.getElementById('imagePoiPreviewImg').src = fr.result;
						}
						fr.readAsDataURL(files[0]);
					} else {
						document.getElementById('imagePoiPreviewImg').src = no_img_path;
					}
				}
			})();
		}

		let readVideo = (event) => {
			if (event.target.files && event.target.files[0]) {
				let reader = new FileReader();

				reader.onload = function(e) {
					assetVideoSrc.src = e.target.result
					assetVideoTag.load();
				}.bind(this)
				reader.readAsDataURL(event.target.files[0]);
			}
		};

	</script>
    </div>
    </main>
    </form>
    </div>
	<?php wp_footer(); ?>
</body>
</html>
<?php } ?>
