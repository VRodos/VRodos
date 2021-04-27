'use strict';

function wpunity_read_url(input, id) {

    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            jQuery(id).attr('src', e.target.result);
        };

        reader.readAsDataURL(input.files[0]);
    }
}


function vrodos_fillin_widget_assettrs( selectedObject ) {

    if (selectedObject) {
        let asset_id = selectedObject.value;
        vrodos_fetch_Assettrs_and_setWidget(asset_id, selectedObject);


    }
}





