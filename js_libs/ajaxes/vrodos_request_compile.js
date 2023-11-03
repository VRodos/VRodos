
function vrodos_compileAjax(showPawnPositions) {

    // In which platform to compile, e.g. Aframe
    var platform = document.getElementById("platformInput").value;

    // Change UI text label
    var compilationProgressText = document.getElementById("compilationProgressText");

    let projectType = document.getElementById("project-type").value;

    // Enable cancel button
    jQuery( "#compileCancelBtn" ).removeClass( "LinkDisabled" );

    // steps = [
    //     "Get Scene Information from scene setup",
    //     "Transform to Aframe format",
    //     "Provide link"
    // ];

    jQuery("#compileProgressTitle").html("Step: 1 / 2");
    compilationProgressText.append('Building...');

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

            let urlExperienceSequence = JSON.parse(urlExperienceSequenceJSON);

            jQuery("#compileProgressTitle").hide();
            jQuery("#progressSliderSubLineDeterminateValue").width(1);
            jQuery("#compileProgressDeterminate").hide();
            jQuery("#compileProgressSlider").hide();
            jQuery("#compilationProgressText").hide();

            jQuery("#constantUpdateUser").html(
                '<i title="Instructions" class="material-icons AlignIconToBottom">info</i> ' +
                'Finished successfully! - ' + new Date().toLocaleString()
            );

            let compile_dialogue_div = document.getElementById("previewApp");
            compile_dialogue_div.innerHTML = "";

            function createLinks(url, captionText){

                let section = document.createElement('div');
                section.style.cssText = 'padding-top: 8px;';

                let title = document.createElement('span');
                title.style.cssText = 'color: black; font-weight:500;';
                title.innerText = captionText +': ';

                section.append(title);

                let link = document.createElement('a');
                link.innerText = url;
                link.setAttribute("href", url);
                link.setAttribute("target", '_blank');
                section.append(link);

                compile_dialogue_div.append(section);
            }

            if (projectType === 'vrexpo') {
                createLinks(urlExperienceSequence["MasterClient"], "Exposition link");
                createLinks(urlExperienceSequence["SimpleClient"], "Actor link");
            } else {
                createLinks(urlExperienceSequence["index"], "Index");
                createLinks(urlExperienceSequence["MasterClient"], "Director");
                createLinks(urlExperienceSequence["SimpleClient"],"Actor");
            }


            if (projectType !== 'vrexpo') {
                jQuery("#appResultDiv").show();
            }

            jQuery("#vrodos-weblink")[0].href=urlExperienceSequence["index"];

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


// Hide compile progress slider
function hideCompileProgressSlider() {
    jQuery( "#compileProgressSlider" ).hide();
    jQuery( "#compileProgressTitle" ).hide();
    jQuery( "#compileProgressDeterminate" ).hide();
    jQuery( "#compileProceedBtn" ).removeClass( "LinkDisabled" );
    jQuery( "#compileCancelBtn" ).removeClass( "LinkDisabled" );
}
