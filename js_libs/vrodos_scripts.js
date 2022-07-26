'use strict';

function setTransformControlsSize(){
    // Dimensions
    var dims = findDimensions(transform_controls.object);

    var sizeT = Math.max(...dims) / 20;
    transform_controls.setSize(sizeT > 1 ? sizeT : 1);
}

function vrodos_read_url(input, id) {

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

function unixTimestamp_to_time(tStr) {
    var unix_timestamp = parseInt(tStr);
    var date = new Date(unix_timestamp * 1000);
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();
    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    return date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear() + ' ' + formattedTime;
}

function updateClearColorPicker(picker){
    document.getElementById('sceneClearColor').value = picker.toRGBString();
    var hex = rgbToHex(picker.rgb[0], picker.rgb[1], picker.rgb[2]);
    //envir.renderer.setClearColor(hex);
    envir.scene.background = new THREE.Color(hex);
}

function rgbToHex(red, green, blue) {
    const rgb = (red << 16) | (green << 8) | (blue << 0);
    return '#' + (0x1000000 + rgb).toString(16).slice(1);
}

