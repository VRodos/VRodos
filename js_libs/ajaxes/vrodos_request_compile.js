
function vrodos_compileAjax(showPawnPositions) {

    // In which platform to compile, e.g. Aframe
    var platform = jQuery("#platformInput").attr("value");

    // Change UI text label
    var compilationProgressText = jQuery("#compilationProgressText");

    // Enable cancel button
    jQuery( "#compileCancelBtn" ).removeClass( "LinkDisabled" );

    if (platform === 'platform-Aframe'){

        // steps = [
        //     "Get Scene Information from scene setup",
        //     "Transform to Aframe format",
        //     "Provide link"
        // ];

        jQuery("#compileProgressTitle").html("Step: 1 / 2");
        compilationProgressText.append('<p>Get Scene Information from scene setup</p>');

        jQuery("#constantUpdateUser").html(
            '<i title="Instructions" class="material-icons AlignIconToBottom">info</i> ' +
                    'Please wait while we build your scene'
        );

        // ajax for Aframe compiling : Transform envir.scene.children to an html aframe page
        jQuery.ajax({
            url :  isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_compile.ajax_url,
            type : 'GET',
            data : {
                'action': 'vrodos_compile_action',
                'projectId': my_ajax_object_compile.projectId,
                'projectSlug': my_ajax_object_compile.slug,
                'showPawnPositions': showPawnPositions,
                'vrodos_scene' : my_ajax_object_compile.sceneId,
                'outputFormat': platform
            },
            success : function(urlExperienceSequenceJSON) {

                console.log(urlExperienceSequenceJSON);

                let urlExperienceSequence = JSON.parse(urlExperienceSequenceJSON);

                jQuery("#compileProgressTitle").hide();
                jQuery("#progressSliderSubLineDeterminateValue").width(1);
                jQuery("#compileProgressDeterminate").hide();
                jQuery("#compileProgressSlider").hide();

                jQuery("#compilationProgressText").hide();

                jQuery("#constantUpdateUser").html(
                    '<i title="Instructions" class="material-icons AlignIconToBottom">info</i> ' +
                    'Finished'
                );

                function previewerConstruct(urlAddress, iFrameId, captionText){

                    let compile_dialogue_div = document.getElementById("previewApp");

                    // Preview Index
                    let iframe = compile_dialogue_div.children[iFrameId];

                    if (!iframe) {
                        iframe = document.createElement('iframe');
                        iframe.style.background = "yellowBright";
                        iframe.style.width = "320px";
                        iframe.style.height = "200px";
                        iframe.style.margin = "auto";
                        iframe.style.border = "1px solid black";
                        iframe.style.marginLeft = "10px";
                        iframe.setAttribute('id', iFrameId); // assign an id

                        caption_iframe = document.createElement('span');
                        caption_iframe.setAttribute("class", "captioniframe");
                        caption_iframe.innerText = captionText;

                        compile_dialogue_div.append(caption_iframe);

                        compile_dialogue_div.append(iframe);
                    }

                    iframe.src = urlAddress;
                }

                //previewerConstruct(urlExperienceSequence["index"], "iFramePreviewAframeIndex", "Index");
                //previewerConstruct(urlExperienceSequence["MasterClient"], "iFramePreviewAframeMasterClient", "Director");
                //previewerConstruct(urlExperienceSequence["SimpleClient"],"iFramePreviewAframeSimpleClient", "Actor");

                jQuery("#appResultDiv").show();
                jQuery("#vrodos-weblink")[0].href=urlExperienceSequence["index"];
                document.getElementById("webLinkInput").value = urlExperienceSequence["index"];

                document.getElementById("openWebLinkhref").setAttribute("href", urlExperienceSequence["index"]);

                console.log("Ajax Aframe Success");
            },
            error : function(xhr, ajaxOptions, thrownError) {
                console.log("Ajax Aframe ERROR 189: " + thrownError);
                console.log(ajaxOptions);
                hideCompileProgressSlider();
            }
        });
    }
}


// Hide compile progress slider
function hideCompileProgressSlider() {
    jQuery( "#compileProgressSlider" ).hide();
    jQuery( "#compileProgressTitle" ).hide();
    jQuery( "#compileProgressDeterminate" ).hide();
    jQuery( "#platform-select" ).removeClass( "mdc-select--disabled" ).attr( "aria-disabled","false" );

    jQuery( "#compileProceedBtn" ).removeClass( "LinkDisabled" );
    jQuery( "#compileCancelBtn" ).removeClass( "LinkDisabled" );
}
