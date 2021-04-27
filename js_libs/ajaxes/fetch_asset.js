function vrodos_fetch_Assettrs_and_setWidget(asset_id, selectedObject) {

    jQuery.ajax({
        url: my_ajax_object_fetchasset_meta.ajax_url,
        type: 'POST',
        data: {
            'action': 'vrodos_fetch_assetmeta_action',
            'asset_id': asset_id
        },
        success: function (assettrs_saved) {

            assettrs_saved_json = JSON.parse(assettrs_saved);

            let assettrs_saved_values_array = assettrs_saved_json.assettrs_saved.split(",");

            let widgetserialno = selectedObject.dataset.widgetserialno;

            document.getElementById("widget-vrodos_3d_widget-"+ widgetserialno+"-camerapositionx"
                        ).setAttribute("value", assettrs_saved_values_array[6]);

            document.getElementById("widget-vrodos_3d_widget-"+ widgetserialno+"-camerapositiony"
                        ).setAttribute("value", assettrs_saved_values_array[7]);

            document.getElementById("widget-vrodos_3d_widget-"+ widgetserialno+"-camerapositionz"
                        ).setAttribute("value", assettrs_saved_values_array[8]);

        },
        error: function (xhr, ajaxOptions, thrownError) {

            alert("Could not fetch asset. Probably deleted ?");

            console.log("Ajax Fetch Asset: ERROR: 179" + thrownError);
        }
    });
}




