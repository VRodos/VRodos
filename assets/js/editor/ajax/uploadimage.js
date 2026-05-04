VRODOS.api.uploadImage = function() {

	const formData = new FormData();
	const input    = document.getElementById( "img_upload_bcg" );

	if (input.files && input.files[0]) {

		const fn        = input.files[0].name;
		const extension = fn.split( '.' ).pop();

		const reader = new FileReader();

		reader.onload = function (e) {

			formData.append( "action", "image_upload_action" );
			formData.append( "image", e.target.result );
			formData.append( "imagetype", extension );
			formData.append( "filename", fn );
			formData.append( "projectid", VRODOS.config.projectId );
			formData.append( "sceneid", VRODOS.config.sceneId );
			formData.append( "_ajax_nonce", VRODOS.data.upload_image_nonce );

			fetch( VRODOS.config.isAdmin === "back" ? 'admin-ajax.php' : VRODOS.utils.getAjaxUrl(), {
				method: 'POST',
				body: formData
			})
			.then( (response) => response.text())
			.then( (response) => {

				const cleanResponse      = response.replace( 'File Uploaded Successfully', '' );
				const data                 = JSON.parse( cleanResponse );
				console.log( data.url );
				VRODOS.editor.envir.scene.img_bcg_path = data.url;

				const saveBtn = document.getElementById( 'save-scene-button' );
				saveBtn.innerHTML = "Saving...";
				saveBtn.classList.add( "LinkDisabled" );
				document.getElementById( "compileGameBtn" ).disabled = true;

				// Export using the new VRODOS.exporter.SceneExporter
				const exporter = new VRODOS.exporter.SceneExporter();
				document.getElementById( 'vrodos_scene_json_input' ).value = exporter.parse( VRODOS.editor.envir.scene );

				document.getElementById( 'uploadImgThumb' ).src    = data.url;
				document.getElementById( 'uploadImgThumb' ).hidden = false;

				VRODOS.api.saveScene();
			});

		};
		reader.readAsDataURL( input.files[0] );
	}
}



