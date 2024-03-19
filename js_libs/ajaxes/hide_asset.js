function vrodos_hideAssetAjax(asset_id, game_slug, isCloned) {

    console.log("ajaxx");

    document.getElementById("asset-" + asset_id).classList.add("hide");   

    jQuery.ajax({
        url: my_ajax_object_hideasset.ajax_url,
        type: 'POST',
        data: {
            'action': 'vrodos_hide_asset_action',
            'asset_id': asset_id,
            'game_slug': game_slug,
        },
        success: function (res) {

            res = JSON.parse(res);


        },
        error: function (xhr, ajaxOptions, thrownError) {

            console.log("Ajax Hide Asset: ERROR" + thrownError);
        }
    });
}