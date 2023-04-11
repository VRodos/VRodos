/**
 * Created by tpapazoglou on 11/7/2017.
 * Modified by dverver on 18/10/2017: Multiple jpgs as textures. fReader called once not twice for the same file.
 * dverver 02/04/2018
 * dverver 17/07/2020
 */
'use strict';

var currLanguage = "English";

// Initial slide to show (carousel top)
var slideIndex = 0;


function vrodos_clear_asset_files(asset_viewer_3d_kernel) {

    if (asset_viewer_3d_kernel.renderer) {
        asset_viewer_3d_kernel.clearAllAssets("vrodos_clear_asset_files");
    }

    // Clear inputs
    document.getElementById("fbxFileInput").value = "";
    document.getElementById("mtlFileInput").value = "";
    document.getElementById("objFileInput").value = "";
    document.getElementById("pdbFileInput").value = "";
    document.getElementById("glbFileInput").value = "";


    // Clear add texture hidden fields
    while ( jQuery("[id^=textureFileInput]").length > 0) {
        jQuery("[id^=textureFileInput]")[0].remove();
    }

    // Clear select 3D files input
    if (document.getElementById("fileUploadInput"))
        document.getElementById("fileUploadInput").value = "";

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
        let output = document.getElementById('fileList3D');
        let children = "";

        for (let i = 0; i < input.files.length; ++i) {
            children += '<li>' + input.files.item(i).name + '</li>';
        }
        output.innerHTML = '<ul>'+children+'</ul>';

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

function applyFont(font) {
    console.log('You selected font: ' + font);

    // Replace + signs with spaces for css
    font = font.replace(/\+/g, ' ');

    // Split font into family and weight
    font = font.split(':');

    let fontFamily = font[0];
    let fontWeight = font[1] || 400;

    // Set selected font on paragraphs
    jQuery('.changablefont').css({fontFamily:"'"+fontFamily+"'", fontWeight:fontWeight});
}

function resizeText(multiplier) {
    window.event.preventDefault();
    window.event.stopPropagation();
    window.event.stopImmediatePropagation();
    if (document.body.style.fontSize == "") {
        document.body.style.fontSize = "1.0em";
    }
    document.body.style.fontSize = parseFloat(document.body.style.fontSize) + (multiplier * 0.2) + "em";


    // document.getElementsByClassName("asset3d_desc_view")[0].style.marginTop =
    //     (parseFloat(document.getElementsByClassName("asset3d_desc_view")[0].style.marginTop)+multiplier*10)+"px";

    return false;
}



function showSlides(i) {


    // Get slides div
    let slides = document.getElementsByClassName("mySlides");


    if(slides.length == 0)
        return;

    // Hide all
    for (let j = 0; j < slides.length; j++) {
        slides[j].style.display = "none";
    }

    if (i >= slides.length) {slideIndex = 0}
    if (i < 0) {slideIndex = slides.length}

    i = slideIndex;

    console.log(slides);

    // Show only one
    slides[i].style.display = "block";
}

function plusSlides(i) {
    showSlides(slideIndex += i);
}

// Create model screenshot
function vrodos_create_model_sshot(asset_viewer_3d_kernel_local) {

    asset_viewer_3d_kernel_local.render();

    // I used html2canvas because there is no toDataURL in labelRenderer so there were no labels
    html2canvas(document.querySelector("#wrapper_3d_inner")).then(canvas => {

        asset_viewer_3d_kernel_local.render();
        document.getElementById("sshotPreviewImg").src = canvas.toDataURL("image/png");

        //------------ Resize ---------------------------------------
        let resizedCanvas = document.createElement("canvas");
        let resizedContext = resizedCanvas.getContext("2d");
        let context = canvas.getContext("2d");
        resizedCanvas.height = "150";
        resizedCanvas.width = "265";
        resizedContext.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);

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

    jQuery("#assetDescription").show();
    jQuery("#doorDetailsPanel").hide();
    //jQuery("#imgDetailsPanel").hide();
    //jQuery("#videoDetailsPanel").hide();
    jQuery("#objectPreviewTitle").hide();
}

function clearList() {
    vrodos_reset_panels(asset_viewer_3d_kernel, "clearList");
}




function openAccess(accessLevel) {

    var i, tabcontent, tablinks;

    // The description
    tabcontent = document.getElementsByClassName("tabcontent2");

    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // tablinks = document.getElementsByClassName("tablinks2");
    // for (i = 0; i < tablinks.length; i++) {
    //     tablinks[i].className = tablinks[i].className.replace(" active", "");
    // }

    document.getElementById(currLanguage + accessLevel).style.display = "block";

    window.event.currentTarget.className += " active";
}


function openLanguage(lang) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent2");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks2");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    currLanguage = lang;

    document.getElementById(lang).style.display = "block";

    var titLang = eval('asset_title_'+currLanguage.toLowerCase()+'_saved');

    //console.log(titLang);

    if (titLang === '')
        titLang = eval('asset_title_english_saved');

    document.getElementById("assetTitleView").innerHTML = titLang;

    window.event.currentTarget.className += " active";
}

// Start P2P conference
function startConf(){
    jQuery("#confwindow")[0].style.display="";
    jQuery("#confwindow_helper")[0].style.display="none";

    document.getElementById('iframeConf').src =
        "https://heliosvr.mklab.iti.gr:3000/call/<?php echo $assetLangPack2['asset_title_saved']; ?>";

    vrodos_notify_confpeers();
}

// function setCanvasDivSize(){
//
//     // Responsive Layout (text panel vs 3D model panel
//     if (window.innerWidth < window.innerHeight) {
//
//         const initCH = document.getElementById('text-asset-sidebar').clientHeight;
//         const initCH2 = document.getElementById('wrapper_3d_inner').clientHeight;
//
//         document.getElementById('text-asset-sidebar').addEventListener('scroll', function () {
//             document.getElementById("text-asset-sidebar").style.height = (initCH + this.scrollTop / 2 + 5).toString();
//             document.getElementById("wrapper_3d_inner").style.height = (initCH2 - this.scrollTop / 2 + 5).toString();
//             asset_viewer_3d_kernel.resizeDisplayGL();
//         });
//     }
//
// }

function generateQRcode(){

    // Generate QR Code
    const qrcode = new QRCode(
        document.getElementById("qrcode_img"), {
            text: window.location.href.replace('#','&qrcode=none#'),
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

}

function screenshotHandlerSet(){

    // Screenshot handler
    if (document.getElementById("sshotPreviewImg")) {
        jQuery("#createModelScreenshotBtn").click(function () {
            asset_viewer_3d_kernel.renderer.preserveDrawingBuffer = true;
            vrodos_create_model_sshot(asset_viewer_3d_kernel);
        });
    }

}

function hideAdminBar(){
    // Hide admin bar of wordpress
    jQuery("#wpadminbar").hide();
    jQuery(".js no-svg").css("margin-top:0px");
}
