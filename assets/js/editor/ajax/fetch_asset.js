VRODOS.api.fetchAssetAndSetWidget = function(asset_id, selectedObject) {

	fetch( my_ajax_object_fetchasset_meta.ajax_url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			'action': 'vrodos_fetch_assetmeta_action',
			asset_id
		})
	})
	.then( (response) => response.text())
	.then( (assettrs_saved) => {

		const assettrs_saved_json = JSON.parse( assettrs_saved );

		const assettrs_saved_values_array = assettrs_saved_json.assettrs_saved.split( "," );

		const widgetserialno = selectedObject.dataset.widgetserialno;

		document.getElementById(
			`widget-vrodos_3d_widget-${  widgetserialno  }-camerapositionx`
		).setAttribute( "value", assettrs_saved_values_array[6] );

		document.getElementById(
			`widget-vrodos_3d_widget-${  widgetserialno  }-camerapositiony`
		).setAttribute( "value", assettrs_saved_values_array[7] );

		document.getElementById(
			`widget-vrodos_3d_widget-${  widgetserialno  }-camerapositionz`
		).setAttribute( "value", assettrs_saved_values_array[8] );

	})
	.catch( (err) => {
		alert( "Could not fetch asset. Probably deleted ?" );
		console.log( `Ajax Fetch Asset: ERROR: 179 ${  err}` );
	});
}
