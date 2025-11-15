/**
 * Created by tpapazoglou on 11/7/2017.
 * Modified by dverver on 18/10/2017: Multiple jpgs as textures. fReader called once not twice for the same file.
 * dverver 02/04/2018
 * dverver 17/07/2020
 */
'use strict';

// Initial slide to show (carousel top)
var slideIndex = 0;
var sshotPreviewDefaultImg;
var asset_viewer_3d_kernel = null;


function vrodos_clear_asset_files(asset_viewer_3d_kernel) {

    if (asset_viewer_3d_kernel.renderer) {
        asset_viewer_3d_kernel.clearAllAssets("vrodos_clear_asset_files");
    }

    // Clear inputs
    document.getElementById("glbFileInput").value = "";

    // Clear select 3D files input
    if (document.getElementById("fileUploadInput")){
        document.getElementById("fileUploadInput").value = "";
    }
        

    document.getElementById("sshotFileInput").value = "";


    // Clear screenshot
    jQuery("#sshotPreviewImg").attr('src', sshotPreviewDefaultImg);

    // Clear Title in Preview
    jQuery("#objectPreviewTitle").hide();
}


// File reader cortex
function file_reader_cortex(file, asset_viewer_3d_kernel_local){

    // Get the extension
    let type = file.name.split('.').pop();

    // set the reader
    let reader = new FileReader();

    switch (type) {
        case 'pdb': asset_viewer_3d_kernel_local.nPdb = 1; reader.readAsText(file);        break;
        case 'mtl': asset_viewer_3d_kernel_local.nMtl = 1; reader.readAsText(file);        break;
        case 'obj': asset_viewer_3d_kernel_local.nObj = 1; reader.readAsArrayBuffer(file); break;
        case 'fbx': asset_viewer_3d_kernel_local.nFbx = 1; reader.readAsArrayBuffer(file); break;
        case 'glb':
            asset_viewer_3d_kernel_local.nGlb = 1;
            reader.readAsArrayBuffer(file);
            document.getElementById('glbFileInput').value = file;
            break;
        case 'jpg': reader.readAsDataURL(file);     break;
        case 'png': reader.readAsDataURL(file);     break;
        case 'gif': reader.readAsDataURL(file);     break;
    }

    // --- Read it ------------------------
    reader.onload = (function(reader) {
        return function() {

            let fileContent = reader.result ? reader.result : '';

            let dec = new TextDecoder();

            switch (type) {
                case 'mtl':
                    // Replace quotes because they create a bug in input form
                    document.getElementById('mtlFileInput').value = fileContent.replace(/'/g, "");
                    break;
                case 'obj': document.getElementById('objFileInput').value = dec.decode(fileContent); break;
                case 'fbx':
                    document.getElementById('fbxFileInput').value = dec.decode(fileContent);
                    asset_viewer_3d_kernel_local.FbxBuffer =  fileContent;
                    break;
                case 'glb':
                    //document.getElementById('glbFileInput').value = dec.decode(fileContent);
                    asset_viewer_3d_kernel_local.GlbBuffer =  fileContent;
                    break;
                case 'pdb': document.getElementById('pdbFileInput').value = fileContent; break;
                case 'jpg':
                case 'png':
                case 'gif':
                    jQuery('#3dAssetForm').append(
                        '<input type="hidden" name="textureFileInput['+file.name+
                        ']" id="textureFileInput" value="' + fileContent + '" />');
                    break;
            }

            // console.log("TYPE", type + " " + file);
            asset_viewer_3d_kernel_local.checkerCompleteReading( type );

        };
    })(reader);
}


function addHandlerFor3Dfiles(asset_viewer_3d_kernel_local, multipleFilesInputElem) {

    // PREVIEW Handler (not uploaded yet): Load from selected files
    let _handleFileSelect = function ( event ) {

        let input = document.getElementById('fileUploadInput');
        let children = "";

        for (let i = 0; i < input.files.length; ++i) {
            children += '<li>' + input.files.item(i).name + '</li>';
        }

        // Reset Screenshot
        document.getElementById("sshotPreviewImg").src = sshotPreviewDefaultImg;
        document.getElementById("sshotFileInput").value = "";

        // Copy because clear asset files in the following clears the total input fields also.
        // Files are blobs
        let files = {... event.target.files};

        //  Read each file and put the string content in an input dom
        for ( let i = 0; i < Object.keys(files).length; i++) {
            if (files[i].name.includes('jpg')){
                asset_viewer_3d_kernel_local.nJpg ++;
            } else if (files[i].name.includes('png')){
                asset_viewer_3d_kernel_local.nPng ++;
            } else if (files[i].name.includes('gif')){
                asset_viewer_3d_kernel_local.nGif ++;
            }
        }

        //  Read each file and put the string content in an input dom
        for ( let i = 0; i < Object.keys(files).length; i++) {
            file_reader_cortex(files[i], asset_viewer_3d_kernel_local);
        }
    };
    // End of event handler

    // Set event handler on input dom element
    if(multipleFilesInputElem)
        multipleFilesInputElem.addEventListener( 'change' , _handleFileSelect, false );
}


//--------------------- Auxiliary (Easy stuff) -------------------------------------------------------------

function updateColorPicker(picker, asset_viewer_3d_kernel_local){
    document.getElementById('assetback3dcolor').value = picker.toRGBString();

    asset_viewer_3d_kernel_local.scene.background.r = picker.rgb[0]/255;
    asset_viewer_3d_kernel_local.scene.background.g = picker.rgb[1]/255;
    asset_viewer_3d_kernel_local.scene.background.b = picker.rgb[2]/255;

    // Change top border line color for portrait mode
    /*document.getElementById('text-asset-sidebar').style.borderTop="5px solid " +
        rgbToHex(picker.rgb[0]-40, picker.rgb[1]-40, picker.rgb[2]-40) ;*/

    asset_viewer_3d_kernel_local.render();
}

function rgbToHex(r, g, b) {

    /*If values are negative make them zero*/
    r = Math.max(r, 0);
    g = Math.max(g, 0);
    b = Math.max(b, 0);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Create model screenshot
function vrodos_create_model_sshot(asset_viewer_3d_kernel_local) {

    asset_viewer_3d_kernel_local.render();

    // I used html2canvas because there is no toDataURL in labelRenderer so there were no labels
    html2canvas(document.querySelector("#wrapper_3d_inner")).then(canvas => {

        asset_viewer_3d_kernel_local.render();
        document.getElementById("sshotPreviewImg").src = canvas.toDataURL("image/png");

        //------------ Resize and Crop ---------------------------------------
        const targetWidth = 356;
        const targetHeight = 200;
        const targetRatio = targetWidth / targetHeight;

        let sourceWidth = canvas.width;
        let sourceHeight = canvas.height;
        let sourceRatio = sourceWidth / sourceHeight;

        let sourceX = 0;
        let sourceY = 0;

        if (sourceRatio > targetRatio) {
            // Source is wider than target, crop the sides
            let newSourceWidth = sourceHeight * targetRatio;
            sourceX = (sourceWidth - newSourceWidth) / 2;
            sourceWidth = newSourceWidth;
        } else if (sourceRatio < targetRatio) {
            // Source is taller than target, crop the top and bottom
            let newSourceHeight = sourceWidth / targetRatio;
            sourceY = (sourceHeight - newSourceHeight) / 2;
            sourceHeight = newSourceHeight;
        }

        let resizedCanvas = document.createElement("canvas");
        resizedCanvas.width = targetWidth;
        resizedCanvas.height = targetHeight;

        resizedCanvas.getContext("2d").drawImage(
            canvas,
            sourceX, sourceY,
            sourceWidth, sourceHeight,
            0, 0,
            targetWidth, targetHeight
        );

        document.getElementById("sshotFileInput").value = resizedCanvas.toDataURL();
    });
}



function loadFileInputLabel(objectType) {

    let inputLabel = document.getElementById('fileUploadInputLabel');
    let input = document.getElementById('fileUploadInput');

    if (inputLabel)
        if (objectType === 'pdb') {
            inputLabel.innerHTML = 'Select a pdb file';
            input.accept = ".pdb";
        } else if (objectType === 'obj') {
            inputLabel.innerHTML = 'Select an a) obj, b) mtl, & c) optional texture files (jpgs or pngs)';
            input.accept = ".obj,.mtl,.jpg,.png";
        } else if (objectType === 'fbx') {
            inputLabel.innerHTML = 'Select an a) fbx & b) optional texture file (gif, jpg, png)';
            input.accept = ".fbx,.jpg,.png,.gif";
        } else if (objectType === 'glb') {
            inputLabel.innerHTML = 'Select a glb file';
            input.accept = ".glb";
        }
}

function vrodos_reset_panels(asset_viewer_3d_kernel, whocalls) {

    console.log("vrodos_reset_panels", whocalls)

    // Clear all
    vrodos_clear_asset_files(asset_viewer_3d_kernel);

    if (jQuery("ProducerPlotTooltip")) {
        jQuery("div.ProducerPlotTooltip").remove();
    }
}

function clearList() {
    vrodos_reset_panels(asset_viewer_3d_kernel, "clearList");
}

function setScreenshotHandler(){

    // Screenshot handler
    if (document.getElementById("sshotPreviewImg")) {
        jQuery("#createModelScreenshotBtn").click(function () {
            asset_viewer_3d_kernel.renderer.preserveDrawingBuffer = true;
            vrodos_create_model_sshot(asset_viewer_3d_kernel);
        });
    }

}

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // Data passed from the backend via wp_localize_script
    const {
        isAdmin,
        glb_file_name,
        no_img_path,
        asset_title,
        back_3d_color,
        isLoggedIn,
        assettrs_saved,
        sshotPreviewDefaultImg_local
    } = vrodos_asset_editor_data;

    const assetVideoSrc = document.getElementById("assetVideoSource");
    const assetVideoTag = document.getElementById("assetVideoTag");
    const videoInputTag = document.getElementById("videoFileInput");
    const videoSshotCanvas = document.getElementById("videoSshotPreviewImg");
    const videoSshotFileInput = document.getElementById("videoSshotFileInput");
    const multipleFilesInputElem = document.getElementById('fileUploadInput');

    if (document.getElementById("jscolorpick")) {
        document.getElementById("jscolorpick").value = back_3d_color;
    }

    let isEditMode = (isLoggedIn === 1) ? 1 : 0;
    console.log("isEditModeA:", isEditMode);

    let assettrs = document.getElementById('assettrs') ? document.getElementById('assettrs').value : assettrs_saved;

    let mdc = window.mdc;
    mdc.autoInit();

    if (assetVideoTag) {
        assetVideoTag.addEventListener('loadeddata', function () {
            generateVideoSshot(videoSshotCanvas, assetVideoTag);
        }, false);
        assetVideoTag.addEventListener('seeked', function () {
            generateVideoSshot(videoSshotCanvas, assetVideoTag);
        });
    }

    setScreenshotHandler();

    // ------- Class to load 3D model ---------
    asset_viewer_3d_kernel = new VRodos_AssetViewer_3D_kernel(document.getElementById('previewCanvas'),
        document.getElementById('previewCanvasLabels'),
        document.getElementById('animButton1'),
        document.getElementById('previewProgressLabel'),
        document.getElementById('previewProgressSliderLine'),
        back_3d_color,
        null,
        null, // path_url is null
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

    // Select category handler
    if (isEditMode === 1) {

        sshotPreviewDefaultImg = sshotPreviewDefaultImg_local;

        (function () {
            let MDCSelect = mdc.select.MDCSelect;
            const categoryDropdown = new MDCSelect(document.getElementById('category-select'));
            const IPRDropdown = new MDCSelect(document.getElementById('category-ipr-select'));

            let preSelectedCatId = document.getElementById('currently-selected-category').getAttribute("data-cat-id");

            categoryDropdown.listen('MDCSelect:change', () => {
                let currentSlug = updateSelectComponent(true);
                resetCategory();
                loadLayout(currentSlug);
            });

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
                    jQuery("#categoryIPRDescription")[0].innerHTML = IPRDropdown.selectedOptions[0].getAttribute("data-cat-ipr-desc");

                    // Change the value of termIdInputIPR
                    jQuery("#termIdInputIPR").attr("value", IPRDropdown.selectedOptions[0].getAttribute("id"));
                });
            }

            // Load preselected asset cat
            if (preSelectedCatId) {
                let selectedElement = document.getElementById(preSelectedCatId);
                if(selectedElement) {
                    selectedElement.setAttribute("aria-selected", true);
                }

                let catSlug = updateSelectComponent(false);
                loadLayout(catSlug);
            }

            // Load preselected ipr cat cat
            if (jQuery('#currently-ipr-selected').attr("data-cat-ipr-id")) {
                jQuery('#' + selectedCatIPRId).attr("aria-selected", true);
                jQuery('#category-ipr-select').addClass('mdc-select--disabled').attr("aria-disabled", true);
            }

            // Create listener for video tag
            if (videoInputTag) {
                videoInputTag.addEventListener('change', readVideo);
            }


            // Function to initialize layout
            function updateSelectComponent(hasValue) {
                asset_viewer_3d_kernel.resizeDisplayGL();
                if (document.getElementById('formSubmitBtn')) {
                    document.getElementById('formSubmitBtn').disabled = false;
                }

                let descText = document.getElementById('categoryDescription');
                let slug = '';

                if (hasValue) {
                    document.getElementById('termIdInput').setAttribute('value', categoryDropdown.value);
                    let selectedOption = categoryDropdown.list_.root.querySelector('[data-value="' + categoryDropdown.value + '"]');
                    descText.innerHTML = selectedOption.getAttribute("data-cat-desc");
                    slug = selectedOption.getAttribute("data-value");

                } else {
                    document.getElementById('termIdInput').setAttribute('value', preSelectedCatId);
                    descText.innerHTML = document.getElementById('currently-selected-category').getAttribute("data-cat-desc");
                    slug = document.getElementById('currently-selected-category').getAttribute("data-cat-slug");
                }
                return slug;
            }


            document.getElementById('imageFileInput').onchange = function (evt) {

                let tgt = evt.target || window.event.srcElement,
                    files = tgt.files;

                // FileReader support
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

            reader.onload = function (e) {
                assetVideoSrc.src = e.target.result
                assetVideoTag.load();
            }.bind(this)
            reader.readAsDataURL(event.target.files[0]);
        }
    };

    let generateVideoSshot = (canvas, video) => {
        if (canvas) {
            let ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, 320, 240);
            videoSshotFileInput.value = canvas.toDataURL('image/png');
        }
    };
});
