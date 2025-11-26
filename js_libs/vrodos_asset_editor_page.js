jQuery(document).ready(function($) {
    'use strict';

    let isAdmin = vrodos_asset_editor_data.isAdmin;
    let path_url = null;
    let glb_file_name = vrodos_asset_editor_data.glb_file_name;
    let no_img_path = vrodos_asset_editor_data.no_img_path_url;
    var asset_title = vrodos_asset_editor_data.asset_title_value;

    const assetVideoSrc = document.getElementById("assetVideoSource");
    const assetVideoTag = document.getElementById("assetVideoTag");

    const videoInputTag = document.getElementById("videoFileInput");
    const videoSshotCanvas = document.getElementById("videoSshotPreviewImg");
    const videoSshotFileInput = document.getElementById("videoSshotFileInput");

    const multipleFilesInputElem = document.getElementById( 'fileUploadInput' );

    let back_3d_color = vrodos_asset_editor_data.back_3d_color;
    if (document.getElementById("jscolorpick"))
        document.getElementById("jscolorpick").value = back_3d_color;

    let isLoggedIn = vrodos_asset_editor_data.isUserloggedIn ? 1: 0;
    let isEditMode = (isLoggedIn === 1) ? 1 : 0 ;
    console.log("isEditModeA:", isEditMode);

    let assettrs = document.getElementById( 'assettrs') ? document.getElementById( 'assettrs' ).value : vrodos_asset_editor_data.assettrs_saved;

    let mdc = window.mdc;
    mdc.autoInit();

    if (assetVideoTag) {
        assetVideoTag.addEventListener('loadeddata', function() {
            generateVideoSshot(videoSshotCanvas, assetVideoTag);
        }, false);
        assetVideoTag.addEventListener('seeked', function(){
            generateVideoSshot(videoSshotCanvas, assetVideoTag);
        });
    }

    setScreenshotHandler();

    // ------- Class to load 3D model ---------
    let asset_viewer_3d_kernel = new VRodos_AssetViewer_3D_kernel(document.getElementById( 'previewCanvas' ),
        document.getElementById( 'previewCanvasLabels' ),
        document.getElementById('animButton1'),
        document.getElementById('previewProgressLabel'),
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
        document.getElementById('boundSphButton'));

    addHandlerFor3Dfiles(asset_viewer_3d_kernel, multipleFilesInputElem);

    // Load existing 3D models
    // asset_viewer_3d_kernel.loader_asset_exists( path_url, mtl_file_name, obj_file_name, pdb_file_name, fbx_file_name,
    //                                                      glb_file_name, textures_fbx_string_connected);


    // Select category handler
    if( isEditMode === 1) {
        // clear canvas and divs for fields
        // vrodos_reset_panels(asset_viewer_3d_kernel, "initial script");
        var sshotPreviewDefaultImg = vrodos_asset_editor_data.sshotPreviewDefaultImg;

        (function() {

            let MDCSelect = mdc.select.MDCSelect;
            const categoryDropdown = new MDCSelect(document.getElementById('category-select'));
            const IPRDropdown = new MDCSelect(document.getElementById('category-ipr-select'));

            let preSelectedCatIdEl = document.getElementById('currently-selected-category');
            let preSelectedCatId = preSelectedCatIdEl ? preSelectedCatIdEl.getAttribute("data-cat-id") : null;

            if (categoryDropdown) {
                categoryDropdown.listen('MDCSelect:change', () => {
                    let currentSlug = updateSelectComponent(true);
                    resetCategory();
                    loadLayout(currentSlug);
                });
            }


            let resetCategory = () => {
                // Clear file list
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
                    default:
                        break;

                }
            };

            let selectedCatIPRId = jQuery('#currently-ipr-selected').attr("data-cat-ipr-id");

            if (IPRDropdown) {
                IPRDropdown.listen('MDCSelect:change', () => {
                    // Change the description of the popup
                    jQuery("#categoryIPRDescription")[0].innerHTML =  IPRDropdown.selectedOptions[0].getAttribute("data-cat-ipr-desc");

                    // Change the value of termIdInputIPR
                    jQuery("#termIdInputIPR").attr( "value", IPRDropdown.selectedOptions[0].getAttribute("id") );
                });
            }


            // Load preselected asset cat
            if (preSelectedCatId && document.getElementById(preSelectedCatId)) {
                document.getElementById(preSelectedCatId).setAttribute("aria-selected", "true");
                let catSlug = updateSelectComponent(false);
                loadLayout(catSlug);
            }

            // Load preselected ipr cat cat
            if (jQuery('#currently-ipr-selected').attr("data-cat-ipr-id")) {
                jQuery('#'+ selectedCatIPRId).attr("aria-selected", true);
                jQuery('#category-ipr-select').addClass('mdc-select--disabled').attr( "aria-disabled", true);
            }

            // Create listener for video tag
            if (videoInputTag)
                videoInputTag.addEventListener('change',  readVideo);


            // Function to initialize layout
            // parameter denotes if new asset or edit asset
            function updateSelectComponent(hasValue) {

                //vrodos_reset_panels(asset_viewer_3d_kernel, "loadlayout");
                asset_viewer_3d_kernel.resizeDisplayGL();
                if (document.getElementById('formSubmitBtn')) {
                    document.getElementById('formSubmitBtn').disabled = false;
                }

                let descText = document.getElementById('categoryDescription');
                let termIdInput = document.getElementById('termIdInput');
                let currentlySelectedCategory = document.getElementById('currently-selected-category');

                let slug = '';

                if(hasValue) {
                    termIdInput.setAttribute('value', categoryDropdown.value);
                    let selectedOption = document.querySelector(`#category-select .mdc-list-item[data-value='${categoryDropdown.value}']`);
                    descText.innerHTML = selectedOption.getAttribute("data-cat-desc");
                    slug = selectedOption.getAttribute("data-value");

                } else {
                    termIdInput.setAttribute('value', preSelectedCatId);
                    descText.innerHTML = currentlySelectedCategory.getAttribute("data-cat-desc");
                    slug = currentlySelectedCategory.getAttribute("data-cat-slug");
                }
                return slug;
            }

            let imageFileInput = document.getElementById('imageFileInput');
            if (imageFileInput) {
                imageFileInput.onchange = function (evt) {

                    let tgt = evt.target || window.event.srcElement,
                        files = tgt.files;

                    // FileReader support
                    if (FileReader && files && files.length) {
                        let fr = new FileReader();
                        fr.onload = function () {
                            document.getElementById('imagePoiPreviewImg').src = fr.result;
                        }
                        fr.readAsDataURL(files[0]);
                    }
                    else {
                        if (document.getElementById('imagePoiPreviewImg'))
                            document.getElementById('imagePoiPreviewImg').src = no_img_path;
                    }
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

    let generateVideoSshot = (canvas, video) => {
        if (!canvas) return;
        let ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage( video, 0, 0, 320, 240);
            videoSshotFileInput.value = canvas.toDataURL('image/png');
        }
    };
});
