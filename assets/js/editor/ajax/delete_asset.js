/**
 * Delete Asset
 *
 * Parameters from javascript
 * asset_id : the asset to delete
 */
VRODOS.api.isDeleteAssetPending = false;
VRODOS.api.parseDeleteAssetResponse = function(responseText) {
	const text = String(responseText || '').trim();
	if (!text) {
		return null;
	}

	try {
		return JSON.parse(text);
	} catch (_error) {
		const jsonStart = text.indexOf('{');
		const jsonEnd = text.lastIndexOf('}');
		if (jsonStart !== -1 && jsonEnd > jsonStart) {
			try {
				return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
			} catch (_jsonError) {
				return null;
			}
		}
	}

	return null;
};

VRODOS.api.closeDeleteAssetDialog = function() {
	const deleteDialog = document.getElementById('vrodos_delete_asset_modal') || document.getElementById('delete-dialog');
	if (!deleteDialog) {
		return;
	}

	const progressBar = document.getElementById('delete-scene-dialog-progress-bar');
	if (progressBar) {
		progressBar.style.display = 'none';
		progressBar.classList.add('tw-hidden');
	}

	if (typeof deleteDialog.close === 'function' && deleteDialog.open) {
		deleteDialog.close();
		return;
	}

	deleteDialog.style.display = 'none';
};

VRODOS.api.removeDeletedAssetFromUi = function(deletedAssetId, asset_id) {
	const editorScene = VRODOS.editor && VRODOS.editor.envir && VRODOS.editor.envir.scene
		? VRODOS.editor.envir.scene
		: null;

	// remove asset from scene (if we are at scene editor)
	if (editorScene) {
		if (editorScene.children) {
			const names_to_remove = [];
			for (let i = 0; i < editorScene.children.length; i++) {
				if (String(editorScene.children[i].assetid) === String(deletedAssetId)) {
					names_to_remove.push(editorScene.children[i].name);
				}
			}

			for (let i = 0; i < names_to_remove.length; i++) {
				editorScene.remove(editorScene.getObjectByName(names_to_remove[i]));
			}
		}

		const progressBar = document.getElementById(`deleteAssetProgressBar-${  asset_id}`);
		if (progressBar) {
			progressBar.style.display = 'none';
		}

		const assetEl = document.getElementById(`asset-${  asset_id}`);
		if (assetEl) {
			assetEl.style.transition = 'opacity 0.3s';
			assetEl.style.opacity = '0';
			setTimeout(() => { assetEl.remove(); }, 300);
		}
		return;
	}

	// remove the respective tile from the Project editor
	const tileEl = document.getElementById(`${  deletedAssetId}`);
	if (tileEl) {
		tileEl.style.transition = 'opacity 0.3s';
		tileEl.style.opacity = '0';
		setTimeout(() => { tileEl.remove(); }, 300);
	}
};

VRODOS.api.deleteAsset = function(asset_id, game_slug) {
	if (VRODOS.api.isDeleteAssetPending) return;
	VRODOS.api.isDeleteAssetPending = true;

	if (VRODOS.editor && VRODOS.editor.envir && VRODOS.editor.envir.scene) {
		const progressBar = document.getElementById( `deleteAssetProgressBar-${  asset_id}` );
		if (progressBar) progressBar.style.display = '';
		const assetEl = document.getElementById( `asset-${  asset_id}` );
		if (assetEl) assetEl.classList.add( "LinkDisabled" );
	}

	fetch( VRODOS.utils.getAjaxUrl(), {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			'action': 'vrodos_delete_asset_action',
			asset_id,
			game_slug
		})
	})
	.then( (response) => response.text().then( (text) => ({ ok: response.ok, text }) ) )
	.then( (result) => {

		VRODOS.api.isDeleteAssetPending = false;
		const payload = VRODOS.api.parseDeleteAssetResponse(result.text);

		if (!result.ok) {
			const message = payload && payload.data ? payload.data : result.text;
			throw new Error(message || 'Asset deletion failed.');
		}

		const deletedAssetId = payload && payload.success && payload.data && payload.data.asset_id
			? payload.data.asset_id
			: parseInt( result.text, 10 );

		if (!deletedAssetId) {
			throw new Error('Asset deletion response was not valid.');
		}

		try {
			VRODOS.api.closeDeleteAssetDialog();
			VRODOS.api.removeDeletedAssetFromUi(deletedAssetId, asset_id);
		} catch (cleanupError) {
			console.log(`Ajax Delete Asset: cleanup warning after successful delete: ${  cleanupError}`);
		}

	})
	.catch( (err) => {

		VRODOS.api.isDeleteAssetPending = false;
		const progressBar = document.getElementById( `deleteAssetProgressBar-${  asset_id}` );
		if (progressBar) progressBar.style.display = 'none';

		const assetEl = document.getElementById( `asset-${  asset_id}` );
		if (assetEl) assetEl.classList.remove( "LinkDisabled" );

		alert( "Could not delete asset. Please try again or try deleting it from the administration panel." );
		console.log( `Ajax Delete Asset: ERROR: 170 ${  err}` );
	});
}
