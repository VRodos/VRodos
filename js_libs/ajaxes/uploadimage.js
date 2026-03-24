function imgUpload(){

	let formData = new FormData();
	let input    = document.getElementById( "img_upload_bcg" );

	if (input.files && input.files[0]) {

		let fn        = input.files[0].name;
		let extension = fn.split( '.' ).pop();

		let reader = new FileReader();

		reader.onload = function (e) {

			formData.append( "action", "image_upload_action" );
			formData.append( "image", e.target.result );
			formData.append( "imagetype", extension );
			formData.append( "filename", fn );
			formData.append( "projectid", my_ajax_object_compile.projectId );
			formData.append( "sceneid", my_ajax_object_compile.sceneId );

			fetch( isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_uploadimage.ajax_url, {
				method: 'POST',
				body: formData
			})
			.then( function (response) { return response.text(); })
			.then( function (response) {

				const cleanResponse      = response.replace( 'File Uploaded Successfully', '' );
				let data                 = JSON.parse( cleanResponse );
				console.log( data.url );
				envir.scene.img_bcg_path = data.url;

				let saveBtn = document.getElementById( 'save-scene-button' );
				saveBtn.innerHTML = "Saving...";
				saveBtn.classList.add( "LinkDisabled" );
				document.getElementById( "compileGameBtn" ).disabled = true;

				// Export using the new VrodosSceneExporter
				let exporter = new VrodosSceneExporter();
				document.getElementById( 'vrodos_scene_json_input' ).value = exporter.parse( envir.scene );

				document.getElementById( 'uploadImgThumb' ).src    = data.url;
				document.getElementById( 'uploadImgThumb' ).hidden = false;

				vrodos_saveSceneAjax();
			});

		};
		reader.readAsDataURL( input.files[0] );
	}
}
