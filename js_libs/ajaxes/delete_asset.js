/**
 * Delete Asset
 *
 * Parameters from javascript
 * asset_id : the asset to delete
 */
let _deleteAssetPending = false;
function vrodos_deleteAssetAjax(asset_id, game_slug, isCloned) {
	if (_deleteAssetPending) return;
	_deleteAssetPending = true;

	if (typeof envir != "undefined") {
		let progressBar = document.getElementById( "deleteAssetProgressBar-" + asset_id );
		if (progressBar) progressBar.style.display = '';
		let assetEl = document.getElementById( "asset-" + asset_id );
		if (assetEl) assetEl.classList.add( "LinkDisabled" );
	}

	fetch( my_ajax_object_deleteasset.ajax_url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			'action': 'vrodos_delete_asset_action',
			'asset_id': asset_id,
			'game_slug': game_slug,
			'isCloned': isCloned
		})
	})
	.then( function (response) { return response.text(); })
	.then( function (res) {

		_deleteAssetPending = false;
		res = JSON.parse( res );

		if (deleteDialog) {
			let progressBar = document.getElementById( 'delete-scene-dialog-progress-bar' );
			if (progressBar) progressBar.style.display = 'none';
			deleteDialog.close();
		}

		// remove asset from scene (if we are at scene editor)
		if (typeof envir != "undefined") {
			// Remove objects from scene
			let names_to_remove = [];
			for (let i = 0; i < envir.scene.children.length; i++) {
				if (envir.scene.children[i].assetid == "" + res + "") {
					names_to_remove.push( envir.scene.children[i].name );
				}
			}

			for (let i = 0; i < names_to_remove.length; i++) {
				envir.scene.remove( envir.scene.getObjectByName( names_to_remove[i] ) );
			}

			let progressBar = document.getElementById( "deleteAssetProgressBar-" + asset_id );
			if (progressBar) progressBar.style.display = 'none';

			let deleteDialog2 = document.getElementById( "delete-dialog" );
			if (deleteDialog2) deleteDialog2.style.display = 'none';

			let assetEl = document.getElementById( "asset-" + asset_id );
			if (assetEl) {
				assetEl.style.transition = 'opacity 0.3s';
				assetEl.style.opacity = '0';
				setTimeout( function () { assetEl.remove(); }, 300 );
			}
		} else {
			// remove the respective tile from the Project editor
			let tileEl = document.getElementById( "" + asset_id );
			if (tileEl) {
				tileEl.style.transition = 'opacity 0.3s';
				tileEl.style.opacity = '0';
				setTimeout( function () { tileEl.remove(); }, 300 );
			}
		}

	})
	.catch( function (err) {

		_deleteAssetPending = false;
		let progressBar = document.getElementById( "deleteAssetProgressBar-" + asset_id );
		if (progressBar) progressBar.style.display = 'none';

		let assetEl = document.getElementById( "asset-" + asset_id );
		if (assetEl) assetEl.classList.remove( "LinkDisabled" );

		alert( "Could not delete asset. Please try again or try deleting it from the administration panel." );
		console.log( "Ajax Delete Asset: ERROR: 170 " + err );
	});
}
