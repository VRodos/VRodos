function imgUpload(){

    
    let custom_img = document.getElementById('img_upload_bcg');
    let formData = new FormData();
    let file = custom_img.files[0];

    //console.log(my_ajax_object_savescene.scene_id);
    
    formData.append("action", "image_upload_action");  
    formData.append("image", file);
    formData.append("projectid", my_ajax_object_compile.projectId);
    formData.append("sceneid", my_ajax_object_compile.sceneId);
    
    
    jQuery.ajax({
        url: isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_uploadimage.ajax_url,
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success:function(response){console.log(response)}
    });
   
}