function imgUpload(){

    let formData = new FormData();
    let input = document.getElementById("img_upload_bcg");

    if (input.files && input.files[0]) {

        let fn = input.files[0].name;
        let extension = fn.split('.').pop();

        let reader = new FileReader();

        reader.onload = function (e) {

            formData.append("action", "image_upload_action");
            formData.append("image", e.target.result);
            formData.append("imagetype", extension);
            formData.append("filename", fn);
            formData.append("projectid", my_ajax_object_compile.projectId);
            formData.append("sceneid", my_ajax_object_compile.sceneId);


            jQuery.ajax({
                url: isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_uploadimage.ajax_url,
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success:function(response) {

                    //response_saved_json = JSON.parse(response);
                    //envir.scene.img_bcg_path = response.responseText;
                    //let data = JSON.parse(JSON.stringify(response))
                    const cleanResponse = response.replace('File Uploaded Successfully', '');
                    let data = JSON.parse(cleanResponse)
                    console.log(data.url);
                    envir.scene.img_bcg_path = data.url;
                    

                    jQuery('#save-scene-button').html("Saving...").addClass("LinkDisabled");
                    document.getElementById("compileGameBtn").disabled = true;

                    // Export using a custom variant of the old deprecated class SceneExporter
                    let exporter = new THREE.SceneExporter();
                    //env.getObjectByName(name).follow_camera = 2;
                    document.getElementById('vrodos_scene_json_input').value = exporter.parse(envir.scene);

                    //let test = document.getElementById('vrodos_scene_json_input').value;

                    //var json = JSON.stringify(test);

                    //console.log(test);
                    document.getElementById('uploadImgThumb').src = data.url;
                    document.getElementById('uploadImgThumb').hidden = false;

                    vrodos_saveSceneAjax();
                }
            });

        };
        reader.readAsDataURL(input.files[0]);
    }
}