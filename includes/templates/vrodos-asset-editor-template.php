<?php
// Scripts & styles are enqueued by VRodos_Asset_Manager::enqueue_asset_editor_scripts()

// Is on back or front end ?
$isAdmin = is_admin() ? 'back' : 'front';

$data = VRodos_Asset_CPT_Manager::prepare_asset_editor_template_data();
extract($data);
?>
<!DOCTYPE html>
<html lang="en" data-theme="emerald">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asset Editor | VRodos</title>
    <?php wp_head(); ?>
    <script>
        let isAdmin="<?php echo $isAdmin; ?>";
        let path_url = null;
        let glb_file_name = <?php echo json_encode($glb_file_name); ?>;
        let no_img_path = '<?php echo esc_url($no_img_path_url ?? ''); ?>';
        var asset_title = <?php echo json_encode($asset_title_value); ?>;
        var vrodos_isEditable = <?php echo $isEditable ? 'true' : 'false'; ?>;
        var vrodosMaxUploadBytes = <?php echo (int) $max_upload_bytes; ?>;
        var vrodosMaxUploadLabel = <?php echo json_encode($max_upload_label); ?>;
    </script>
    <?php
    // Pre-apply the correct section visibility to prevent layout flicker on load.
    $initial_cat_slug = ! empty( $saved_term ) ? $saved_term[0]->slug : '';
    if ( $initial_cat_slug ) :
        $hide_3d = in_array( $initial_cat_slug, [ 'image', 'video', 'poi-imagetext', 'poi-link', 'chat' ] );
    ?>
    <style>
        <?php if ( $hide_3d ) : ?>
        #glb_file_section,
        #vrodos_3d_preview_card,
        #vrodos_editor_tip_card,
        #screenshot_section { display: none !important; }
        <?php endif; ?>
        <?php if ( $initial_cat_slug === 'image' ) : ?>
        #image_preview_card    { display: flex  !important; }
        #image_flat_file_section { display: block !important; }
        <?php elseif ( $initial_cat_slug === 'video' ) : ?>
        #video_section,
        #video_options_section,
        #video_screenshot_section { display: block !important; }
        <?php elseif ( $initial_cat_slug === 'poi-imagetext' ) : ?>
        #poi_image_text_section,
        #poi_image_file_section { display: block !important; }
        <?php elseif ( $initial_cat_slug === 'poi-link' ) : ?>
        #poi_link_section { display: block !important; }
        <?php elseif ( $initial_cat_slug === 'chat' ) : ?>
        #poi_help_section { display: block !important; }
        <?php endif; ?>
    </style>
    <?php endif; ?>
</head>
<body <?php body_class('vrodos-manager-wrapper tw-overflow-hidden'); ?>>

<div id="vrodos-asset-editor" class="vrodos-main-h tw-flex tw-flex-col tw-bg-slate-50 tw-overflow-hidden">

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
                <div class="tw-flex tw-items-center tw-gap-2 tw-bg-slate-50 tw-px-3 tw-py-1.5 tw-rounded-lg tw-border tw-border-slate-100">
                    <i data-lucide="<?php echo ($isJoker === 'true') ? 'globe' : 'folder'; ?>" class="tw-w-3 tw-h-3 tw-text-slate-400"></i>
                    <span class="tw-text-[10px] tw-font-black tw-uppercase tw-tracking-wider <?php echo ($isJoker === 'true') ? 'tw-text-slate-500' : 'tw-text-primary'; ?>">
                        <?php if ($isJoker === 'true'): ?>
                            Shared Asset
                        <?php elseif ($game_post): ?>
                            <?php echo esc_html($game_post->post_title); ?>
                        <?php else: ?>
                            Project Asset
                        <?php endif; ?>
                    </span>
                </div>
                <div class="tw-h-4 tw-w-px tw-bg-slate-200"></div>
                <a href="<?php echo $goBackToLink; ?>" class="tw-flex tw-items-center tw-gap-2 tw-text-[11px] tw-font-black tw-text-slate-400 hover:tw-text-primary tw-uppercase tw-tracking-wider tw-transition-all">
                    <i data-lucide="arrow-left" class="tw-w-4 tw-h-4"></i>
                    Back to List
                </a>
            </div>
        </div>
    </header>

    <?php if (!is_user_logged_in()) { ?>
        <main class="tw-flex-1 tw-flex tw-items-center tw-justify-center tw-p-8">
            <div class="tw-max-w-md tw-w-full tw-bg-white tw-rounded-3xl tw-p-10 tw-border tw-border-slate-200 tw-shadow-xl tw-text-center">
                <div class="tw-w-20 tw-h-20 tw-bg-slate-50 tw-rounded-2xl tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-6">
                    <i data-lucide="lock" class="tw-w-10 tw-h-10 tw-text-slate-300"></i>
                </div>
                <h2 class="tw-text-2xl tw-font-black tw-text-slate-800 tw-mb-4">Authentication Required</h2>
                <p class="tw-text-slate-500 tw-font-medium tw-mb-8">Please login to access the asset editor and manage your 3D repository.</p>
                <div class="tw-flex tw-flex-col tw-gap-3">
                    <a href="<?php echo wp_login_url(get_permalink()); ?>" class="tw-btn tw-btn-primary tw-text-white tw-font-bold tw-rounded-xl">Log In</a>
                    <a href="<?php echo wp_registration_url(); ?>" class="tw-btn tw-btn-ghost tw-text-slate-400 tw-font-bold">Create Account</a>
                </div>
            </div>
        </main>
    <?php
}
else { ?>
        <?php if (!$isOwner && !$isUserAdmin && $isEditMode) { ?>
            <div class="tw-bg-amber-50 tw-border-b tw-border-amber-200 tw-px-8 tw-py-2 tw-flex tw-items-center tw-gap-2">
                <i data-lucide="eye" class="tw-w-4 tw-h-4 tw-text-amber-600"></i>
                <span class="tw-text-xs tw-font-bold tw-text-amber-700">View Only — You do not own this asset</span>
            </div>
        <?php } ?>
        <div id="assetEditorNotice"
             class="<?php echo empty($asset_notice_message) ? 'tw-hidden ' : ''; ?>tw-border-b tw-px-8 tw-py-3 tw-flex tw-items-center tw-gap-2 <?php echo ($asset_notice_type === 'error') ? 'tw-bg-red-50 tw-border-red-200 tw-text-red-700' : 'tw-bg-emerald-50 tw-border-emerald-200 tw-text-emerald-700'; ?>"
             <?php if (!empty($asset_notice_message)) : ?>data-message="<?php echo esc_attr($asset_notice_message); ?>"<?php endif; ?>>
            <i data-lucide="<?php echo ($asset_notice_type === 'error') ? 'alert-triangle' : 'check-circle-2'; ?>" class="tw-w-4 tw-h-4"></i>
            <span id="assetEditorNoticeText" class="tw-text-xs tw-font-bold"><?php echo esc_html($asset_notice_message); ?></span>
        </div>
        <form name="3dAssetForm" id="3dAssetForm" method="POST" enctype="multipart/form-data" class="tw-flex-1 tw-flex tw-flex-col tw-min-h-0 tw-m-0 tw-bg-slate-50">
            <main class="tw-flex-1 tw-flex tw-flex-col lg:tw-flex-row tw-overflow-hidden tw-min-h-0 tw-bg-slate-50">
            
            <!-- Left Column: 3D Preview & Files -->
            <div class="tw-w-full lg:tw-w-[420px] tw-flex-none tw-bg-slate-50 tw-border-b lg:tw-border-b-0 lg:tw-border-r tw-border-slate-200 tw-overflow-y-auto lg:tw-h-full">
                <div class="tw-p-5 lg:tw-p-6 tw-space-y-4">
                    <!-- 3D Preview Card -->
                    <div id="vrodos_3d_preview_card" class="tw-bg-white tw-rounded-3xl tw-border tw-border-slate-200 tw-shadow-sm tw-overflow-hidden tw-relative tw-aspect-[4/3]">
                        <!-- Preview Overlay -->
                        <div id="previewProgressSlider" class="tw-absolute tw-inset-0 tw-z-10 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-slate-900/50 tw-backdrop-blur-sm tw-transition-opacity" style="visibility:hidden">
                            <div class="tw-bg-white tw-p-6 tw-rounded-2xl tw-shadow-2xl tw-text-center tw-min-w-[200px]">
                                <h6 id="previewProgressLabel" class="tw-text-[10px] tw-font-black tw-text-slate-400 tw-uppercase tw-tracking-widest tw-mb-3">Loading</h6>
                                <div class="tw-w-full tw-h-1.5 tw-bg-slate-100 tw-rounded-full tw-overflow-hidden">
                                    <div id="previewProgressSliderLine" class="tw-h-full tw-bg-primary tw-transition-all tw-duration-300" style="width: 0%;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Empty state placeholder -->
                        <div id="preview3dPlaceholder" class="tw-absolute tw-inset-0 tw-z-5 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-slate-50 tw-pointer-events-none">
                            <i data-lucide="box" class="tw-w-16 tw-h-16 tw-text-slate-300 tw-mb-3"></i>
                            <span class="tw-text-sm tw-font-medium tw-text-slate-400">No 3D model loaded</span>
                            <span class="tw-text-xs tw-text-slate-300 tw-mt-1">Upload a GLB file to preview</span>
                        </div>

                        <!-- 3D Canvas -->
                        <div id="wrapper_3d_inner" class="tw-w-full tw-h-full">
                            <div id="previewCanvasLabels" class="tw-absolute tw-inset-0 tw-pointer-events-none tw-z-20"></div>
                            <canvas id="previewCanvas" class="tw-w-full tw-h-full">3D canvas</canvas>
                        </div>
                        
                        <!-- Mini Controls Overlay -->
                        <div class="tw-absolute tw-bottom-4 tw-left-4 tw-z-30 tw-pointer-events-auto tw-flex tw-items-center tw-gap-2">
                            <span id="animButtonWrapper" style="display:none">
                                <button type="button" id="animButton1" onclick="asset_viewer_3d_kernel.playStopAnimation();"
                                        class="tw-btn tw-btn-xs tw-bg-white/90 tw-backdrop-blur-sm tw-border-none hover:tw-bg-white tw-shadow-md tw-rounded-lg tw-px-3 tw-gap-1.5 tw-h-8">
                                    <i data-lucide="play" class="tw-w-3.5 tw-h-3.5"></i>
                                    <span class="tw-text-[10px] tw-font-bold tw-uppercase">Anim</span>
                                </button>
                            </span>
                        </div>

                        <?php
                            // --- COLOR NORMALIZATION FOR NATIVE PICKER ---
                            $raw_color = trim($asset_back_3d_color_saved);
                            $normalized_hex = '#FFFFFF'; // Default
                            
                            if ($raw_color) {
                                // If it's already a hex (with or without #)
                                if (preg_match('/^#?([a-f0-9]{3}){1,2}$/i', $raw_color)) {
                                    $normalized_hex = '#' . ltrim($raw_color, '#');
                                } 
                                // If it's in rgb(r, g, b) format (legacy jscolor format)
                                elseif (strpos($raw_color, 'rgb') !== false) {
                                     preg_match_all('!\d+!', $raw_color, $matches);
                                     if (count($matches[0]) >= 3) {
                                         $normalized_hex = sprintf("#%02x%02x%02x", $matches[0][0], $matches[0][1], $matches[0][2]);
                                     }
                                }
                            }
                        ?>
                        <!-- Theme Control Overlay (Native Color Picker) -->
                        <div class="tw-absolute tw-bottom-4 tw-right-4 tw-z-30 tw-pointer-events-auto tw-flex tw-items-center tw-bg-white/90 tw-backdrop-blur-sm tw-rounded-xl tw-shadow-xl tw-border tw-border-slate-100 tw-h-9 tw-overflow-hidden tw-px-2 tw-gap-2">
                             <div class="tw-flex tw-items-center tw-pointer-events-none">
                                <i data-lucide="palette" class="tw-w-3.5 tw-h-3.5 tw-text-slate-400"></i>
                             </div>
                             <div class="tw-flex tw-items-center tw-gap-2">
                                 <input id="nativeColorPicker" type="color" 
                                        class="tw-w-5 tw-h-5 tw-p-0 tw-border-none tw-bg-transparent tw-cursor-pointer tw-appearance-none [&::-webkit-color-swatch-wrapper]:tw-p-0 [&::-webkit-color-swatch]:tw-rounded-md [&::-webkit-color-swatch]:tw-border-none" 
                                        value="<?php echo esc_attr($normalized_hex); ?>"
                                        oninput="updateNativeColorPicker(this, asset_viewer_3d_kernel)">
                                 <span id="colorHexLabel" class="tw-text-[10px] tw-font-black tw-text-slate-500 tw-uppercase tw-tracking-widest">
                                     <?php echo esc_html($normalized_hex); ?>
                                 </span>
                             </div>
                             <input id="assetback3dcolor" type="hidden" name="assetback3dcolor" value="<?php echo esc_attr(ltrim($normalized_hex, '#')); ?>" />
                        </div>
                    </div>

                    <!-- GLB Upload Card (Moved from sidebar) -->
                    <?php if (($isOwner || $isUserAdmin)) { ?>
                    <div id="glb_file_section" class="tw-bg-white tw-p-5 tw-rounded-3xl tw-border tw-border-slate-200 tw-shadow-sm tw-space-y-3">
                        <div class="tw-flex tw-items-center tw-justify-between">
                            <label class="tw-block tw-text-[10px] tw-font-black tw-text-slate-400 tw-uppercase tw-tracking-widest">
                                3D Content (GLB)
                            </label>
                            <i data-lucide="box" class="tw-w-4 tw-h-4 tw-text-primary"></i>
                        </div>
                        
                        <div class="tw-w-full tw-bg-slate-50 tw-border tw-border-dashed tw-border-slate-200 tw-rounded-2xl tw-p-3 tw-text-center hover:tw-border-primary hover:tw-bg-primary/5 tw-transition-all tw-group">
                            <input id="fileUploadInput" class="tw-hidden" type="file" name="multipleFilesInput[]" accept=".glb" onclick="clearList()"/>
                            <label for="fileUploadInput" class="tw-cursor-pointer tw-flex tw-flex-col tw-items-center tw-gap-2">
                                <div class="tw-w-7 tw-h-7 tw-bg-white tw-shadow-sm tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-group-hover:tw-scale-110 tw-transition-transform">
                                    <i data-lucide="upload-cloud" class="tw-w-3.5 tw-h-3.5 tw-text-primary"></i>
                                </div>
                                <div>
                                    <p id="fileUploadInputLabel" class="tw-text-xs tw-font-bold tw-text-slate-800">Model Upload</p>
                                    <p class="tw-text-[9px] tw-text-slate-400 tw-font-bold tw-uppercase">GLB MAX <?php echo esc_html( strtoupper( $max_upload_label ) ); ?></p>
                                </div>
                            </label>
                        </div>

                        <input type="hidden" name="glbFileInput" value="" id="glbFileInput" />
                        <input type="hidden" id="assettrs" name="assettrs" value="<?php echo trim($assettrs_saved); ?>" />
                    </div>
                    <?php
    }?>

                    <!-- Image Asset Preview (shown instead of 3D preview for image category) -->
                    <div id="image_preview_card" class="tw-bg-white tw-rounded-3xl tw-border tw-border-slate-200 tw-shadow-sm tw-overflow-hidden tw-relative tw-aspect-[4/3] tw-flex tw-items-center tw-justify-center" style="display:none;">
                        <img id="imageFlatPreviewSidebar"
                             src="<?php echo esc_url($imageFlatImageURL ?? ''); ?>"
                             class="tw-w-full tw-h-full tw-object-contain <?php echo empty($imageFlatImageURL) ? 'tw-hidden' : ''; ?>"
                             alt="Image preview">
                        <div id="imageFlatSidebarPlaceholder" class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-text-slate-300 <?php echo !empty($imageFlatImageURL) ? 'tw-hidden' : ''; ?>">
                            <i data-lucide="image" class="tw-w-12 tw-h-12"></i>
                            <span class="tw-text-xs tw-text-slate-400">No image saved yet</span>
                        </div>
                    </div>

                    <!-- Context Tip Card -->
                    <div id="vrodos_editor_tip_card" class="tw-bg-emerald-50 tw-border tw-border-emerald-100 tw-p-5 tw-rounded-2xl">
                        <div class="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                             <i data-lucide="sparkles" class="tw-w-4 tw-h-4 tw-text-emerald-500"></i>
                             <span class="tw-text-[10px] tw-font-black tw-text-emerald-700 tw-uppercase tw-tracking-widest">Editor Tip</span>
                        </div>
                        <p class="tw-text-[11px] tw-text-emerald-800 tw-font-medium tw-leading-relaxed">
                            Upload your GLB model here to preview it in real-time. Use the screenshot tool in the right panel to capture the preview.
                        </p>
                    </div>

                    <!-- Video Thumbnail Section (formerly Video Poster) - moved here for video assets -->
                    <div id="video_screenshot_section" class="tw-space-y-4" style="display:none;">
                        <label class="vrodos-label">
                            Video Thumbnail
                        </label>
                        <div class="tw-aspect-video tw-bg-slate-100 tw-rounded-2xl tw-overflow-hidden tw-border tw-border-slate-200">
                            <canvas id="videoSshotPreviewImg" class="tw-w-full tw-h-full tw-object-cover"></canvas>
                            <input type="hidden" name="videoSshotFileInput" id="videoSshotFileInput" accept="image/png"/>
                        </div>
                        <p class="tw-text-[10px] tw-text-slate-400 tw-font-bold tw-uppercase tw-mt-2">Auto-generated from video seek</p>
                    </div>
                </div>
            </div>

            <!-- Right Center: Main Form Area -->
            <div class="tw-flex-1 tw-bg-white lg:tw-border-l tw-border-slate-200 tw-overflow-y-auto">
                
                    
                    <!-- Primary Action Sticky Header -->
                    <div class="tw-sticky tw-top-0 tw-z-30 tw-bg-white/80 tw-backdrop-blur-md tw-border-b tw-border-slate-100 tw-px-10 tw-py-3.5 tw-flex tw-items-center tw-justify-between">
                        <div class="tw-flex tw-items-center tw-gap-3">
                            <i data-lucide="file-edit" class="tw-w-4 tw-h-4 tw-text-slate-300"></i>
                            <span class="tw-text-[10px] tw-font-black tw-text-slate-400 tw-uppercase tw-tracking-widest"><?php echo $asset_id ? 'Editing Asset' : 'New Asset'; ?></span>
                        </div>
                        <?php if (($isOwner || $isUserAdmin)) { ?>
                            <button id="formSubmitBtn" type="submit" class="tw-btn tw-btn-primary tw-text-white tw-font-black tw-px-10 tw-rounded-xl tw-shadow-lg tw-shadow-emerald-500/20 tw-transition-all active:tw-scale-95 tw-gap-2">
                                <i data-lucide="<?php echo $asset_id ? 'save' : 'plus-circle'; ?>" class="tw-w-4 tw-h-4"></i>
                                <?php echo $asset_id ? 'UPDATE ASSET' : 'CREATE ASSET'; ?>
                            </button>
                        <?php
    }?>
                    </div>

                    <!-- Metadata Form -->
                    <div class="tw-px-10 tw-py-0 tw-space-y-6">

                <?php if (($isOwner || $isUserAdmin) && $isEditMode) {
        wp_nonce_field('post_nonce', 'post_nonce_field');
?>
                        <input type="hidden" name="submitted" id="submitted" value="true"/>
                    <?php
    }?>

                <div class="tw-grid tw-grid-cols-2 tw-gap-6">
                    
                    <!-- Asset Title -->
                    <div class="tw-space-y-2">
                        <label for="assetTitle" class="vrodos-label">
                            Asset Name
                        </label>
                        <div class="tw-relative">
                            <input id="assetTitle" type="text"
                                   class="vrodos-input"
                                   name="assetTitle"
                                   placeholder="e.g. Ancient Temple"
                                   required minlength="3" maxlength="25"
                                   value="<?php echo $asset_title_value; ?>">
                        </div>
                    </div>

                    <!-- Category Selection (custom dropdown with icons) -->
                    <div class="tw-space-y-2">
                        <label class="vrodos-label">Asset Category</label>
                        <?php
                        // Icon map (mirrors vrodos_icons.js)
                        $cat_icon_map = [
                            'decoration'    => 'leaf',
                            'walkable-surface' => 'footprints',
                            'door'          => 'door-open',
                            'video'         => 'clapperboard',
                            'poi-imagetext' => 'image',
                            'image'         => 'image-play',
                            'chat'          => 'message-square',
                            'poi-link'      => 'external-link',
                        ];
                        $selected_slug = !empty($saved_term) ? $saved_term[0]->slug : '';
                        $selected_name = !empty($saved_term) ? $saved_term[0]->name : '';
                        $selected_icon = $cat_icon_map[$selected_slug] ?? 'package';
                        ?>
                        <!-- Hidden real input for form submission -->
                        <input type="hidden" id="category-select-native" name="term_id_native" value="<?php echo esc_attr($selected_slug); ?>" />
                        <style>
                            .vrodos-cat-dropdown { position: relative; }
                            .vrodos-cat-trigger {
                                display: flex; align-items: center; gap: 10px;
                                width: 100%; padding: 10px 14px; cursor: pointer;
                                background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem;
                                font-size: 14px; color: #334155; font-weight: 500;
                                transition: border-color 0.2s;
                            }
                            .vrodos-cat-trigger:hover { border-color: #cbd5e1; }
                            .vrodos-cat-trigger:focus, .vrodos-cat-trigger.open { border-color: #66cc8a; outline: none; box-shadow: 0 0 0 3px rgba(102,204,138,0.12); }
                            .vrodos-cat-trigger .trigger-icon { color: #94a3b8; flex-shrink: 0; }
                            .vrodos-cat-trigger .trigger-label { flex: 1; }
                            .vrodos-cat-trigger .trigger-chevron { color: #94a3b8; flex-shrink: 0; transition: transform 0.2s; }
                            .vrodos-cat-trigger.open .trigger-chevron { transform: rotate(180deg); }
                            .vrodos-cat-menu {
                                display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0;
                                background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem;
                                box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); z-index: 50;
                                max-height: 260px; overflow-y: auto; padding: 4px;
                            }
                            .vrodos-cat-menu.show { display: block; }
                            .vrodos-cat-option {
                                display: flex; align-items: center; gap: 10px;
                                padding: 8px 12px; cursor: pointer; border-radius: 0.375rem;
                                font-size: 13px; color: #475569; transition: background 0.15s;
                            }
                            .vrodos-cat-option:hover { background: #f1f5f9; }
                            .vrodos-cat-option.selected { background: #ecfdf5; color: #059669; font-weight: 600; }
                            .vrodos-cat-option i { color: #94a3b8; flex-shrink: 0; }
                            .vrodos-cat-option.selected i { color: #059669; }
                        </style>
                        <div class="vrodos-cat-dropdown" id="vrodos-cat-dropdown">
                            <div class="vrodos-cat-trigger" id="vrodos-cat-trigger" tabindex="0">
                                <i data-lucide="<?php echo esc_attr($selected_icon); ?>" class="trigger-icon tw-w-4 tw-h-4"></i>
                                <span class="trigger-label"><?php echo $selected_name ? esc_html($selected_name) : 'Select a category'; ?></span>
                                <i data-lucide="chevron-down" class="trigger-chevron tw-w-4 tw-h-4"></i>
                            </div>
                            <div class="vrodos-cat-menu" id="vrodos-cat-menu">
                                <?php foreach ($cat_terms as $term):
                                    $icon = $cat_icon_map[$term->slug] ?? 'package';
                                    $is_sel = (!empty($saved_term) && $saved_term[0]->term_id == $term->term_id);
                                ?>
                                <div class="vrodos-cat-option <?php echo $is_sel ? 'selected' : ''; ?>"
                                     data-value="<?php echo esc_attr($term->slug); ?>"
                                     data-cat-desc="<?php echo esc_attr($term->description); ?>"
                                     data-cat-id="<?php echo esc_attr($term->term_id); ?>"
                                     data-icon="<?php echo esc_attr($icon); ?>">
                                    <i data-lucide="<?php echo esc_attr($icon); ?>" class="tw-w-4 tw-h-4"></i>
                                    <span><?php echo esc_html($term->name); ?></span>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                        <p id="categoryDescription" class="tw-text-[11px] tw-text-emerald-600 tw-font-bold tw-leading-relaxed"></p>
                        <script>
                        (function() {
                            const dropdown = document.getElementById('vrodos-cat-dropdown');
                            const trigger  = document.getElementById('vrodos-cat-trigger');
                            const menu     = document.getElementById('vrodos-cat-menu');
                            const hidden   = document.getElementById('category-select-native');
                            const descEl   = document.getElementById('categoryDescription');

                            trigger.addEventListener('click', function() {
                                const isOpen = menu.classList.toggle('show');
                                trigger.classList.toggle('open', isOpen);
                            });

                            menu.addEventListener('click', function(e) {
                                const opt = e.target.closest('.vrodos-cat-option');
                                if (!opt) return;

                                // Update hidden input
                                hidden.value = opt.dataset.value;

                                // Update trigger label + icon
                                trigger.querySelector('.trigger-label').textContent = opt.querySelector('span').textContent;
                                const triggerIcon = trigger.querySelector('.trigger-icon');
                                triggerIcon.setAttribute('data-lucide', opt.dataset.icon);
                                triggerIcon.style.color = '#334155';
                                lucide.createIcons({ nodes: [triggerIcon] });

                                // Update selected state
                                menu.querySelectorAll('.vrodos-cat-option').forEach(o => o.classList.remove('selected'));
                                opt.classList.add('selected');

                                // Update description
                                if (descEl) descEl.textContent = opt.dataset.catDesc || '';

                                // Close
                                menu.classList.remove('show');
                                trigger.classList.remove('open');

                                // Fire change event for any listeners
                                hidden.dispatchEvent(new Event('change', { bubbles: true }));
                            });

                            // Close on outside click
                            document.addEventListener('click', function(e) {
                                if (!dropdown.contains(e.target)) {
                                    menu.classList.remove('show');
                                    trigger.classList.remove('open');
                                }
                            });
                        })();
                        </script>
                    </div>

                </div>

                <!-- Hidden inputs for legacy JS compatibility (moved outside grid) -->
                <div id="category-select" style="display:none;"></div>
                <input id="termIdInput" type="hidden" name="term_id" value="<?php echo !empty($saved_term) ? esc_attr($saved_term[0]->term_id) : ''; ?>">
                <div id="currently-selected-category" 
                     data-cat-id="<?php echo !empty($saved_term) ? esc_attr($saved_term[0]->term_id) : ''; ?>"
                     data-cat-slug="<?php echo !empty($saved_term) ? esc_attr($saved_term[0]->slug) : ''; ?>"
                     data-cat-desc="<?php echo !empty($saved_term) ? esc_attr($saved_term[0]->description) : ''; ?>">
                </div>


                <div class="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
                    <!-- Left Column: Primary Preview -->
                    <div class="tw-space-y-6">
                        <!-- Screenshot Section (Always Visible) -->
                        <div id="screenshot_section" class="tw-space-y-6" style="display: block;">
                            <div class="tw-flex tw-items-center tw-justify-between">
                                <label class="vrodos-label !tw-mb-0">
                                    Screenshot
                                </label>
                                <i data-lucide="image" class="tw-w-5 tw-h-5 tw-text-primary"></i>
                            </div>

                            <!-- Screenshot Preview -->
                            <div class="tw-relative tw-aspect-video tw-bg-slate-100 tw-rounded-3xl tw-overflow-hidden tw-border tw-border-slate-200 tw-group">
                                <?php if ($scrnImageURL): ?>
                                    <img id="sshotPreviewImg" src="<?php echo esc_url($scrnImageURL); ?>" alt="Asset Screenshot" 
                                         class="tw-w-full tw-h-full tw-object-cover tw-transition-transform group-hover:tw-scale-110 !tw-max-h-none !tw-w-full !tw-h-full">
                                <?php
        else: ?>
                                    <div class="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-text-slate-300">
                                        <i data-lucide="camera" class="tw-w-16 tw-h-16"></i>
                                    </div>
                                    <img id="sshotPreviewImg" src="" class="tw-hidden !tw-max-h-none !tw-w-full !tw-h-full">
                                <?php
        endif; ?>
                                
                                <input type="hidden" name="sshotFileInput" value="" id="sshotFileInput" accept="image/png"/>
                                
                                <!-- Capture Button Overlay -->
                                <div class="tw-absolute tw-bottom-4 tw-right-4">
                                    <button id="createModelScreenshotBtn" type="button" class="tw-btn tw-btn-md tw-bg-white/90 tw-backdrop-blur tw-border-none hover:tw-bg-white tw-text-slate-900 tw-font-bold tw-rounded-xl tw-shadow-xl tw-gap-2">
                                        <i data-lucide="camera" class="tw-w-4 tw-h-4"></i>
                                        Capture Screenshot
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Video Source Section -->
                        <div id="video_section" class="tw-space-y-6" style="display: none;">
                            <label class="vrodos-label">
                                Video Source
                            </label>
                            
                            <div class="tw-bg-slate-900 tw-rounded-2xl tw-overflow-hidden tw-shadow-xl tw-max-h-[320px] tw-flex tw-items-center tw-justify-center">
                                <video id="assetVideoTag" class="tw-w-full tw-h-full tw-max-h-[320px]" preload="auto" controls>
                                    <source id="assetVideoSource" src="<?php echo esc_url($video_attachment_file ?? ''); ?>" type="video/mp4">
                                </video>
                            </div>

                            <div class="tw-w-full tw-bg-slate-50 tw-border tw-border-dashed tw-border-slate-200 tw-rounded-2xl tw-p-3 tw-text-center hover:tw-border-primary hover:tw-bg-primary/5 tw-transition-all tw-group">
                                <input class="tw-hidden" type="file" name="videoFileInput" id="videoFileInput" accept="video/mp4,video/webm"/>
                                <label for="videoFileInput" class="tw-cursor-pointer tw-flex tw-flex-col tw-items-center tw-gap-2">
                                    <div class="tw-w-7 tw-h-7 tw-bg-white tw-shadow-sm tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-group-hover:tw-scale-110 tw-transition-transform">
                                        <i data-lucide="video" class="tw-w-3.5 tw-h-3.5 tw-text-primary"></i>
                                    </div>
                                    <div>
                                        <p id="videoUploadInputLabel" class="tw-text-xs tw-font-bold tw-text-slate-800">Choose Video</p>
                                        <p class="tw-text-[9px] tw-text-slate-400 tw-font-bold tw-uppercase">MP4, WEBM MAX 50MB</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Dynamic Category Settings -->
                    <div class="tw-space-y-10">

                        <!-- Chat Settings -->
                        <div id="poi_help_section" class="tw-space-y-6" style="display: none;">
                            <div class="tw-flex tw-items-center tw-justify-between">
                                <label class="vrodos-label !tw-mb-0">
                                    Chat Settings
                                </label>
                                <i data-lucide="message-square" class="tw-w-5 tw-h-5 tw-text-primary"></i>
                            </div>

                            <div class="vrodos-card tw-space-y-6">
                                <div>
                                    <label for="poiChatTitle" class="vrodos-label">
                                        Display Name
                                    </label>
                                    <input id="poiChatTitle" type="text"
                                           class="vrodos-input"
                                           name="poiChatTitle"
                                           placeholder="Chat Room Name"
                                           minlength="3" maxlength="50"
                                           value="<?php echo esc_attr($poi_chat_title); ?>">
                                </div>

                                <div class="tw-flex tw-items-center tw-gap-4 tw-p-4 tw-bg-white tw-rounded-2xl tw-border tw-border-slate-100">
                                    <input type="checkbox" id="poiChatIndicators" name="poiChatIndicators"
                                           class="tw-checkbox tw-checkbox-primary tw-rounded-lg"
                                           <?php echo $poi_chat_indicators; ?>/>
                                    <label for="poiChatIndicators" class="tw-cursor-pointer">
                                        <span class="tw-block tw-text-sm tw-font-black tw-text-slate-800">Show 3D Indicator</span>
                                        <span class="tw-block tw-text-[10px] tw-text-slate-400 tw-font-bold tw-uppercase tw-mt-0.5">Visible floating icon in scene</span>
                                    </label>
                                </div>

                                <div>
                                    <label for="poiChatNumPeople" class="vrodos-label">
                                        Capacity (2-8 people)
                                    </label>
                                    <div class="tw-flex tw-items-center tw-gap-4">
                                        <input id="poiChatNumPeople" type="range" min="2" max="8" step="1"
                                               class="tw-range tw-range-primary tw-range-sm tw-flex-1"
                                               name="poiChatNumPeople"
                                               value="<?php echo esc_attr($poi_chat_num_people ?: 8); ?>"
                                               oninput="this.nextElementSibling.innerText = this.value">
                                        <span class="tw-w-8 tw-h-8 tw-bg-primary tw-text-white tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-text-xs tw-font-bold">
                                            <?php echo esc_attr($poi_chat_num_people ?: 8); ?>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- POI Details (Image/Text) -->
                        <div id="poi_image_text_section" class="tw-space-y-6" style="display: none;">
                            <label class="vrodos-label">
                                Information Overlay
                            </label>
                            <div class="tw-space-y-4">
                                <input id="poiImgTitle" type="text" 
                                       class="vrodos-input" 
                                       name="poiImgTitle" 
                                       placeholder="Title of information popup"
                                       minlength="3" maxlength="50" 
                                       value="<?php echo esc_attr($poi_img_title); ?>">
                                
                                <textarea id="poiImgDescription" name="poiImgDescription" 
                                          class="vrodos-input !tw-h-auto tw-min-h-[160px] !tw-font-medium" 
                                          placeholder="Write the content here..."><?php echo esc_textarea($poi_img_content); ?></textarea>
                            </div>
                        </div>

                        <!-- External Link -->
                        <div id="poi_link_section" class="tw-space-y-4" style="display: none;">
                            <label for="assetLinkInput" class="vrodos-label">
                                Destination URL
                            </label>
                            <div class="tw-relative">
                                <div class="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-4 tw-flex tw-items-center tw-pointer-events-none">
                                    <i data-lucide="link" class="tw-w-5 tw-h-5 tw-text-slate-300"></i>
                                </div>
                                <input id="assetLinkInput" name="assetLinkInput" 
                                       class="vrodos-input !tw-pl-12" 
                                       value="<?php echo esc_textarea($asset_link); ?>">
                            </div>
                        </div>

                        <!-- Video Playback Options -->
                        <div id="video_options_section" class="tw-space-y-6" style="display: none;">
                            <label class="vrodos-label">
                                Playback Settings
                            </label>
                            <div class="tw-space-y-4">
                                <input id="videoTitle" type="text" 
                                       class="vrodos-input" 
                                       name="videoTitle" 
                                       placeholder="Video title (optional)"
                                       minlength="3" maxlength="25" 
                                       value="<?php echo esc_attr($video_title); ?>">
                                
                                <div class="tw-flex tw-items-center tw-gap-4 tw-p-5 tw-bg-slate-50 tw-rounded-2xl tw-border tw-border-slate-100">
                                    <input type="checkbox" id="video_autoloop_checkbox" name="video_autoloop_checkbox" 
                                           class="tw-checkbox tw-checkbox-primary tw-rounded-lg" <?php echo $video_autoloop; ?>/>
                                    <label for="video_autoloop_checkbox" class="tw-cursor-pointer">
                                        <span class="tw-block tw-text-sm tw-font-black tw-text-slate-800">Autoplay & Loop</span>
                                        <span class="tw-block tw-text-[10px] tw-text-slate-400 tw-font-bold tw-uppercase tw-mt-0.5">Start instantly and repeat</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Image (flat plane) Upload -->
                        <div id="image_flat_file_section" class="tw-space-y-6" style="display: none;">
                            <div class="tw-flex tw-items-center tw-justify-between tw-gap-4">
                                <label class="vrodos-label !tw-mb-0">
                                    Image
                                </label>
                                <span id="imageFlatSourceBadge" class="tw-inline-flex tw-items-center tw-rounded-full tw-px-3 tw-py-1 tw-text-[10px] tw-font-black tw-uppercase tw-tracking-wider <?php echo (($imageFlatSourceType ?? 'none') === 'local') ? 'tw-bg-emerald-100 tw-text-emerald-700' : ((($imageFlatSourceType ?? 'none') === 'external') ? 'tw-bg-amber-100 tw-text-amber-700' : 'tw-bg-slate-100 tw-text-slate-500'); ?>">
                                    <?php echo (($imageFlatSourceType ?? 'none') === 'local') ? 'Local file' : ((($imageFlatSourceType ?? 'none') === 'external') ? 'External URL' : 'No source'); ?>
                                </span>
                            </div>
                            <label for="imageFlatFileInput" class="tw-relative tw-aspect-video tw-bg-slate-100 tw-rounded-3xl tw-overflow-hidden tw-border-2 tw-border-dashed tw-border-slate-200 hover:tw-border-primary tw-transition-all group tw-cursor-pointer tw-block">
                                <img id="imageFlatPreviewImg" src="<?php echo esc_url($imageFlatImageURL ?? ''); ?>" alt="Image" class="tw-w-full tw-h-full tw-object-cover <?php echo empty($imageFlatImageURL) ? 'tw-hidden' : ''; ?>">
                                <div id="imageFlatPlaceholder" class="tw-w-full tw-h-full tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-text-slate-400 <?php echo !empty($imageFlatImageURL) ? 'tw-hidden' : ''; ?>">
                                    <i data-lucide="upload" class="tw-w-8 tw-h-8"></i>
                                    <span class="tw-text-sm tw-font-medium">Click to upload image</span>
                                </div>
                                <div class="tw-absolute tw-inset-0 tw-bg-slate-900/40 tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-flex tw-items-center tw-justify-center tw-pointer-events-none">
                                    <span class="tw-btn tw-btn-sm tw-bg-white tw-border-none tw-text-slate-900 tw-font-bold tw-rounded-xl tw-gap-2">
                                        <i data-lucide="upload" class="tw-w-4 tw-h-4"></i>
                                        Upload
                                    </span>
                                </div>
                                <input type="file" id="imageFlatFileInput" name="imageFlatFileInput" class="tw-hidden" accept="image/png, image/jpg, image/jpeg"/>
                            </label>
                            <input type="hidden" id="restoreImageOriginalUrl" name="restoreImageOriginalUrl" value="0">

                            <?php if ( ! empty( $imageFlatOriginalURL ) ) : ?>
                                <div class="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4 tw-space-y-3">
                                    <div class="tw-flex tw-items-center tw-justify-between tw-gap-3">
                                        <div>
                                            <div class="tw-text-[10px] tw-font-black tw-uppercase tw-tracking-widest tw-text-slate-500">Immerse Original URL</div>
                                            <div class="tw-text-xs tw-font-medium tw-text-slate-700">Preserved as a non-destructive fallback source.</div>
                                        </div>
                                        <?php if ( ! empty( $imageFlatCanRestoreOriginal ) ) : ?>
                                            <button type="button" id="restoreImageOriginalUrlBtn" class="tw-btn tw-btn-sm tw-rounded-xl tw-border-none tw-bg-amber-500 hover:tw-bg-amber-600 tw-text-white tw-font-bold">
                                                Restore Original URL
                                            </button>
                                        <?php endif; ?>
                                    </div>
                                    <input type="text"
                                           id="imageFlatOriginalUrlField"
                                           class="vrodos-input tw-text-xs"
                                           readonly
                                           value="<?php echo esc_attr( $imageFlatOriginalURL ); ?>">
                                    <div class="tw-flex tw-items-center tw-gap-3">
                                        <a href="<?php echo esc_url( $imageFlatOriginalURL ); ?>" target="_blank" rel="noopener noreferrer" class="tw-text-xs tw-font-bold tw-text-primary hover:tw-underline">
                                            Open original image
                                        </a>
                                        <span class="tw-text-[11px] tw-text-slate-400">
                                            Current source: <?php echo (($imageFlatSourceType ?? 'none') === 'local') ? 'local file' : ((($imageFlatSourceType ?? 'none') === 'external') ? 'external URL' : 'not set'); ?>
                                        </span>
                                    </div>
                                </div>
                            <?php endif; ?>
                        </div>

                        <!-- Image POI Upload -->
                        <div id="poi_image_file_section" class="tw-space-y-6" style="display: none;">
                            <label class="vrodos-label">
                                Infobox Image
                            </label>
                            <label for="imageFileInput" class="tw-relative tw-aspect-video tw-bg-slate-100 tw-rounded-3xl tw-overflow-hidden tw-border-2 tw-border-dashed tw-border-slate-200 hover:tw-border-primary tw-transition-all group tw-cursor-pointer tw-block">
                                <img id="imagePoiPreviewImg" src="<?php echo esc_url($imagePoiImageURL ?? ''); ?>" alt="POI Image" class="tw-w-full tw-h-full tw-object-cover <?php echo empty($imagePoiImageURL) ? 'tw-hidden' : ''; ?>">
                                <div id="imagePoiPlaceholder" class="tw-w-full tw-h-full tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-text-slate-400 <?php echo !empty($imagePoiImageURL) ? 'tw-hidden' : ''; ?>">
                                    <i data-lucide="upload" class="tw-w-8 tw-h-8"></i>
                                    <span class="tw-text-sm tw-font-medium">Click to upload image</span>
                                </div>
                                <div class="tw-absolute tw-inset-0 tw-bg-slate-900/40 tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-flex tw-items-center tw-justify-center tw-pointer-events-none">
                                    <span class="tw-btn tw-btn-sm tw-bg-white tw-border-none tw-text-slate-900 tw-font-bold tw-rounded-xl tw-gap-2">
                                        <i data-lucide="upload" class="tw-w-4 tw-h-4"></i>
                                        <?php echo empty($imagePoiImageURL) ? 'Upload' : 'Replace'; ?>
                                    </span>
                                </div>
                                <input type="file" id="imageFileInput" name="imageFileInput" class="tw-hidden" accept="image/png, image/jpg, image/jpeg"/>
                            </label>
                        </div>

                        <!-- IPR Selection Section -->
                        <div id="ipr_section" class="tw-space-y-4" style="display: none;">
                            <label for="category-ipr-select-native" class="vrodos-label">
                                Intellectual Property
                            </label>
                            <select id="category-ipr-select-native" name="term_id_ipr_native" class="tw-select tw-select-bordered tw-w-full">
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
                            <p id="categoryIPRDescription" class="tw-text-[11px] tw-text-slate-400 tw-font-bold tw-leading-relaxed"></p>
                            
                            <!-- Legacy JS Compatibility -->
                            <div id="category-ipr-select" style="display:none;"></div>
                        <input id="termIdInputIPR" type="hidden" name="term_id_ipr" value="<?php echo !empty($saved_ipr_term) ? esc_attr($saved_ipr_term[0]->term_id) : ''; ?>">
                            <div id="currently-ipr-selected"
                                 data-cat-ipr-id="<?php echo !empty($saved_ipr_term) ? esc_attr($saved_ipr_term[0]->term_id) : ''; ?>"
                                 data-cat-ipr-slug="<?php echo !empty($saved_ipr_term) ? esc_attr($saved_ipr_term[0]->slug) : ''; ?>"
                                 data-cat-ipr-desc="<?php echo !empty($saved_ipr_term) ? esc_attr($saved_ipr_term[0]->description) : ''; ?>">
                            </div>
                        </div>
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

		let back_3d_color = "<?php echo $normalized_hex; ?>";
		if (document.getElementById("nativeColorPicker")) {
		    document.getElementById("nativeColorPicker").value = back_3d_color;
		}

		let isLoggedIn = <?php echo $isUserloggedIn ? 1 : 0; ?>;
		let isEditMode = (isLoggedIn === 1) ? 1 : 0 ;
		console.log("isEditModeA:", isEditMode);

		const assetEditorNotice = document.getElementById("assetEditorNotice");
		const assetEditorNoticeText = document.getElementById("assetEditorNoticeText");
		const maxGlbUploadBytes = Number(window.vrodosMaxUploadBytes || 0);
		const maxGlbUploadLabel = window.vrodosMaxUploadLabel || '';

		// Define this globally so it's accessible to vrodos_asset_editor_scripts.js
		var sshotPreviewDefaultImg = document.getElementById("sshotPreviewImg") ? document.getElementById("sshotPreviewImg").src : "";

		let assettrs = document.getElementById( 'assettrs') ? document.getElementById( 'assettrs' ).value : "<?php echo $assettrs_saved; ?>";

		// Initialize Lucide icons
		const initIcons = () => {
			if (typeof lucide !== 'undefined') {
				lucide.createIcons();
			}
		};

		const setAssetEditorNotice = (message) => {
			if (!assetEditorNotice || !assetEditorNoticeText) return;
			assetEditorNoticeText.textContent = message;
			assetEditorNotice.classList.remove('tw-hidden');
			initIcons();
		};

		const clearAssetEditorNotice = () => {
			if (!assetEditorNotice) return;
			if (assetEditorNotice.dataset.message) return;
			assetEditorNotice.classList.add('tw-hidden');
		};

		window.vrodos_validate_selected_glb = function () {
			if (!multipleFilesInputElem || !multipleFilesInputElem.files || !multipleFilesInputElem.files.length) {
				clearAssetEditorNotice();
				return true;
			}

			const file = multipleFilesInputElem.files[0];
			if (!file || !maxGlbUploadBytes || file.size <= maxGlbUploadBytes) {
				clearAssetEditorNotice();
				return true;
			}

			setAssetEditorNotice('This GLB is too large for the current upload limit (' + maxGlbUploadLabel + '). Please reduce the file size or increase PHP upload_max_filesize/post_max_size.');
			multipleFilesInputElem.value = '';
			return false;
		};

		document.addEventListener('DOMContentLoaded', function() {
			initIcons();
			if (assetEditorNotice && assetEditorNotice.dataset.message) {
				assetEditorNotice.classList.remove('tw-hidden');
			}
			// Disable all form inputs if user cannot edit this asset
			if (!vrodos_isEditable) {
				var form = document.getElementById('3dAssetForm');
				if (form) {
					var inputs = form.querySelectorAll('input, textarea, select, button');
					inputs.forEach(function(el) { el.disabled = true; });
				}
			}
		});

		let generateVideoSshot = (canvas, video) => {
			let ctx = canvas.getContext('2d');
			// High-resolution capture: set canvas size to match video's natural dimensions
			canvas.width = video.videoWidth || 640;
			canvas.height = video.videoHeight || 360;
			ctx.drawImage( video, 0, 0, canvas.width, canvas.height);
			videoSshotFileInput.value = canvas.toDataURL('image/png');
		};

		// Debounce helper to prevent excessive processing
		let debounceTimer;
		let debouncedGenerateSshot = () => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				generateVideoSshot(videoSshotCanvas, assetVideoTag);
			}, 300);
		};

		assetVideoTag.addEventListener('loadeddata', debouncedGenerateSshot, false);
		assetVideoTag.addEventListener('seeked', debouncedGenerateSshot);

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

		const assetForm = document.getElementById('3dAssetForm');
		if (assetForm) {
			assetForm.addEventListener('submit', function(event) {
				if (!window.vrodos_validate_selected_glb()) {
					event.preventDefault();
				}
			});
		}

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
						if (document.getElementById("categoryIPRDescription")) {
						    document.getElementById("categoryIPRDescription").innerHTML = selectedOption.getAttribute("data-cat-ipr-desc");
						}
						if (document.getElementById("termIdInputIPR")) {
						    document.getElementById("termIdInputIPR").value = selectedOption.getAttribute("id");
						}
					});
				}

				let resetCategory = () => {
					// Only reset UI layout sections, don't clear 3D preview & screenshot
					// (the asset's GLB and screenshot are still valid after a category change)
					document.getElementById('glb_file_section').style.display = "block";
					document.getElementById('vrodos_3d_preview_card').style.display = "block";
					document.getElementById('vrodos_editor_tip_card').style.display = "block";
					document.getElementById('screenshot_section').style.display = "block";
					
					document.getElementById('ipr_section').style.display = "none";
					document.getElementById('poi_help_section').style.display = "none";
					document.getElementById('poi_link_section').style.display = "none";
					document.getElementById('video_section').style.display = "none";
					document.getElementById('video_options_section').style.display = "none";
					document.getElementById('video_screenshot_section').style.display = "none";
					document.getElementById('poi_image_text_section').style.display = "none";
					document.getElementById('poi_image_file_section').style.display = "none";
				document.getElementById('image_flat_file_section').style.display = "none";
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
					case "image":
							document.getElementById('glb_file_section').style.display = "none";
							document.getElementById('vrodos_3d_preview_card').style.display = "none";
							document.getElementById('image_preview_card').style.display = "flex";
							document.getElementById('vrodos_editor_tip_card').style.display = "none";
							document.getElementById('screenshot_section').style.display = "none";
							document.getElementById('image_flat_file_section').style.display = "block";
							break;
						case "poi-link":
							document.getElementById('poi_link_section').style.display = "block";
							break;
						case "video":
							document.getElementById('glb_file_section').style.display = "none";
							document.getElementById('vrodos_3d_preview_card').style.display = "none";
							document.getElementById('vrodos_editor_tip_card').style.display = "none";
							document.getElementById('screenshot_section').style.display = "none";

							document.getElementById('video_section').style.display = "block";
							document.getElementById('video_options_section').style.display = "block";
							document.getElementById('video_screenshot_section').style.display = "block";
							break;
					}
					asset_viewer_3d_kernel.resizeDisplayGL();
				};

				document.addEventListener('DOMContentLoaded', function() {
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
							iprDropdownNative.classList.add('tw-select-disabled');
						}
					}

					videoInputTag.addEventListener('change', readVideo);
				});

				function updateSelectComponent() {
					if (document.getElementById('formSubmitBtn')) {
						document.getElementById('formSubmitBtn').disabled = false;
					}

					const slug = categoryDropdownNative.value;
					// Find the selected option in the custom dropdown
					const selectedOpt = document.querySelector('#vrodos-cat-menu .vrodos-cat-option.selected');
					const catId = selectedOpt ? selectedOpt.getAttribute('data-cat-id') : '';
					const catDesc = selectedOpt ? selectedOpt.getAttribute('data-cat-desc') : '';

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
							let img = document.getElementById('imagePoiPreviewImg');
							img.src = fr.result;
							img.classList.remove('tw-hidden');
							let placeholder = document.getElementById('imagePoiPlaceholder');
							if (placeholder) placeholder.classList.add('tw-hidden');
						}
						fr.readAsDataURL(files[0]);
					} else {
						document.getElementById('imagePoiPreviewImg').src = no_img_path;
					}
				}

				const imageFlatInput = document.getElementById('imageFlatFileInput');
				const imageFlatSourceBadge = document.getElementById('imageFlatSourceBadge');
				const restoreOriginalInput = document.getElementById('restoreImageOriginalUrl');
				const restoreOriginalButton = document.getElementById('restoreImageOriginalUrlBtn');
				const imageFlatOriginalUrlField = document.getElementById('imageFlatOriginalUrlField');

				function setImageFlatSourceBadge(type, label) {
					if (!imageFlatSourceBadge) return;
					imageFlatSourceBadge.className = 'tw-inline-flex tw-items-center tw-rounded-full tw-px-3 tw-py-1 tw-text-[10px] tw-font-black tw-uppercase tw-tracking-wider';
					if (type === 'local') {
						imageFlatSourceBadge.classList.add('tw-bg-emerald-100', 'tw-text-emerald-700');
					} else if (type === 'external') {
						imageFlatSourceBadge.classList.add('tw-bg-amber-100', 'tw-text-amber-700');
					} else {
						imageFlatSourceBadge.classList.add('tw-bg-slate-100', 'tw-text-slate-500');
					}
					imageFlatSourceBadge.textContent = label;
				}

				if (imageFlatInput) {
					imageFlatInput.onchange = function (evt) {
						if (restoreOriginalInput) {
							restoreOriginalInput.value = '0';
						}
						let files = evt.target.files;
						if (FileReader && files && files.length) {
							let fr = new FileReader();
							fr.onload = function () {
								let img = document.getElementById('imageFlatPreviewImg');
								img.src = fr.result;
								img.classList.remove('tw-hidden');
								let ph = document.getElementById('imageFlatPlaceholder');
								if (ph) ph.classList.add('tw-hidden');
								let sidebarImg = document.getElementById('imageFlatPreviewSidebar');
								if (sidebarImg) { sidebarImg.src = fr.result; sidebarImg.classList.remove('tw-hidden'); }
								let sidebarPh = document.getElementById('imageFlatSidebarPlaceholder');
								if (sidebarPh) sidebarPh.classList.add('tw-hidden');
								setImageFlatSourceBadge('local', 'Local file');
							}
							fr.readAsDataURL(files[0]);
						}
					};
				}

				if (restoreOriginalButton && imageFlatOriginalUrlField) {
					restoreOriginalButton.addEventListener('click', function () {
						const originalUrl = imageFlatOriginalUrlField.value;
						if (!originalUrl) return;

						if (restoreOriginalInput) {
							restoreOriginalInput.value = '1';
						}
						if (imageFlatInput) {
							imageFlatInput.value = '';
						}

						const img = document.getElementById('imageFlatPreviewImg');
						if (img) {
							img.src = originalUrl;
							img.classList.remove('tw-hidden');
						}
						const ph = document.getElementById('imageFlatPlaceholder');
						if (ph) ph.classList.add('tw-hidden');

						const sidebarImg = document.getElementById('imageFlatPreviewSidebar');
						if (sidebarImg) {
							sidebarImg.src = originalUrl;
							sidebarImg.classList.remove('tw-hidden');
						}
						const sidebarPh = document.getElementById('imageFlatSidebarPlaceholder');
						if (sidebarPh) sidebarPh.classList.add('tw-hidden');

						setImageFlatSourceBadge('external', 'External URL');
					});
				}
			})();
		}

		let readVideo = (event) => {
			if (event.target.files && event.target.files[0]) {
				let file = event.target.files[0];
				
				// Show filename in UI
				if (document.getElementById('videoUploadInputLabel')) {
					document.getElementById('videoUploadInputLabel').textContent = file.name;
				}

				// Memory Optimization: Use ObjectURL instead of DataURL (Base64)
				let blobURL = URL.createObjectURL(file);
				
				assetVideoSrc.src = blobURL;
				assetVideoTag.load();
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
<?php
}?>
