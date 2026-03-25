function vrodos_compileAjax(showPawnPositions) {

	// In which platform to compile, e.g. Aframe
	var platform = document.getElementById( "platformInput" ).value;

	// Change UI text label
	var compilationProgressText = document.getElementById( "compilationProgressText" );

	let projectType = document.getElementById( "project-type" ).value;

	// Enable cancel button
	document.getElementById( "compileCancelBtn" ).classList.remove( "LinkDisabled" );

	document.getElementById( "compileProgressTitle" ).textContent = "Step: 1 / 2";
	compilationProgressText.append( 'Building...' );

	document.getElementById( "constantUpdateUser" ).innerHTML =
		'<i data-lucide="info" class="tw-w-4 tw-h-4 tw-inline-block tw-align-text-bottom tw-mr-1"></i> ' +
		'Please wait while we build your scene';
	if (typeof lucide !== 'undefined') lucide.createIcons();

	// Build query string for GET request
	let params = new URLSearchParams({
		'action': 'vrodos_compile_action',
		'projectId': my_ajax_object_compile.projectId,
		'projectSlug': my_ajax_object_compile.slug,
		'showPawnPositions': showPawnPositions,
		'vrodos_scene': my_ajax_object_compile.sceneId,
		'outputFormat': platform
	});

	let url = (isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_compile.ajax_url) + '?' + params.toString();

	// ajax for Aframe compiling : Transform envir.scene.children to an html aframe page
	fetch( url )
	.then( function (response) { return response.text(); })
	.then( function (urlExperienceSequenceJSON) {

		let urlExperienceSequence = JSON.parse( urlExperienceSequenceJSON );

		document.getElementById( "compileProgressTitle" ).style.display = 'none';
		document.getElementById( "progressSliderSubLineDeterminateValue" ).style.width = '1px';
		document.getElementById( "compileProgressDeterminate" ).style.display = 'none';
		document.getElementById( "compileProgressSlider" ).style.display = 'none';
		document.getElementById( "compilationProgressText" ).style.display = 'none';

		document.getElementById( "constantUpdateUser" ).innerHTML =
			'<i data-lucide="info" class="tw-w-4 tw-h-4 tw-inline-block tw-align-text-bottom tw-mr-1"></i> ' +
			'Finished successfully! - ' + new Date().toLocaleString();
		if (typeof lucide !== 'undefined') lucide.createIcons();

		let compile_dialogue_div       = document.getElementById( "previewApp" );
		compile_dialogue_div.innerHTML = "";

		function createLinks(url, captionText){

			let section           = document.createElement( 'div' );
			section.style.cssText = 'padding-top: 8px;';

			let title           = document.createElement( 'span' );
			title.style.cssText = 'color: black; font-weight:500;';
			title.innerText     = captionText + ': ';

			section.append( title );

			let link       = document.createElement( 'a' );
			link.innerText = url;
			link.setAttribute( "href", url );
			link.setAttribute( "target", '_blank' );
			section.append( link );

			compile_dialogue_div.append( section );
		}

		if (projectType === 'vrexpo') {
			createLinks( urlExperienceSequence["MasterClient"], "Exposition link" );
		} else {
			createLinks( urlExperienceSequence["index"], "Index" );
			createLinks( urlExperienceSequence["MasterClient"], "Director" );
			createLinks( urlExperienceSequence["SimpleClient"],"Actor" );
			document.getElementById( "appResultDiv" ).style.display = '';
			document.getElementById( "vrodos-weblink" ).href = urlExperienceSequence["index"];
			document.getElementById( "openWebLinkhref" ).setAttribute( "href", urlExperienceSequence["index"] );
		}

	})
	.catch( function (err) {
		console.log( "Ajax Aframe ERROR 189: " + err );
		hideCompileProgressSlider();
	});
}


// Hide compile progress slider
function hideCompileProgressSlider() {
	document.getElementById( "compileProgressSlider" ).style.display = 'none';
	document.getElementById( "compileProgressTitle" ).style.display = 'none';
	document.getElementById( "compileProgressDeterminate" ).style.display = 'none';
	document.getElementById( "compileProceedBtn" ).classList.remove( "LinkDisabled" );
	document.getElementById( "compileCancelBtn" ).classList.remove( "LinkDisabled" );
}
