function imgUpload(){

    String.prototype.hashCode = function() {
        var hash = 0,
          i, chr;
        if (this.length === 0) return hash;
        for (i = 0; i < this.length; i++) {
          chr = this.charCodeAt(i);
          hash = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
        }
        return hash;
      }

    
    let custom_img = document.getElementById('img_upload_bcg');
    let formData = new FormData();
    let file = custom_img.files[0];
    const currentDate = new Date();

    let blob = file.slice(0, file.size, 'image/png'); 
    let newFile;
    if (file.type == "image/png"){
        newFile = new File([blob], String(currentDate.getTime()).hashCode() + '_bcg.png', {type: 'image/png'});
    }else{
        newFile = new File([blob], String(currentDate.getTime()).hashCode() + '_bcg.jpg', {type: 'image/jpg'});
    }
    //console.log(id);

    //console.log(my_ajax_object_savescene.scene_id);
    
    formData.append("action", "image_upload_action");  
    formData.append("image", newFile);
    formData.append("imagetype", file.type);
    formData.append("projectid", my_ajax_object_compile.projectId);
    formData.append("sceneid", my_ajax_object_compile.sceneId);
    
    
    jQuery.ajax({
        url: isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_uploadimage.ajax_url,
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success:function(response){
            //response_saved_json = JSON.parse(response);
            //envir.scene.img_bcg_path = response.responseText;
            //let data = JSON.parse(JSON.stringify(response))
            const cleanResponse = response.replace('File Uploaded Successfully', '');
            let data = JSON.parse(cleanResponse)
            console.log(data.url);
            envir.scene.img_bcg_path = data.url;

            jQuery('#save-scene-button').html("Saving...").addClass("LinkDisabled");

            // Export using a custom variant of the old deprecated class SceneExporter
            let exporter = new THREE.SceneExporter();
            //env.getObjectByName(name).follow_camera = 2;
            document.getElementById('vrodos_scene_json_input').value = exporter.parse(envir.scene);

            //let test = document.getElementById('vrodos_scene_json_input').value;

            //var json = JSON.stringify(test);

            //console.log(test);

            vrodos_saveSceneAjax();
        }
    });
   
}