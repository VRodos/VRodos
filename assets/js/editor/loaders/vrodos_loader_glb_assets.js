"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.utils = VRODOS.utils || {};

function vrodosLoaderMergeGlbMetadata(resource, resourcesGLB) {
    if (!resource || !resourcesGLB) return;

    if (Object.prototype.hasOwnProperty.call(resourcesGLB, 'glbURL')) {
        resource.glb_path = resourcesGLB.glbURL || '';
        resource.path = resourcesGLB.glbURL || '';
    }
	[
		'editorLoad',
		'vrodosAssetOriginMode'
	].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(resourcesGLB, key)) {
            resource[key] = resourcesGLB[key];
        }
    });
    if (resourcesGLB.screenshot_path) {
        resource.screenshot_path = resourcesGLB.screenshot_path;
    }
    if (resourcesGLB.category_slug) {
        resource.category_slug = resourcesGLB.category_slug;
    }
}

function vrodosLoaderResolveGlbUrl(resource, resourcesGLB) {
    if (!resource) return '';

    if (resourcesGLB && Object.prototype.hasOwnProperty.call(resourcesGLB, 'glbURL')) {
        return resourcesGLB.glbURL || '';
    }

    return resource.glb_path || resource.path || '';
}

function vrodosLoaderResolveEditorGlbLoadTarget(resource, resourcesGLB) {
	const canonicalUrl = vrodosLoaderResolveGlbUrl(resource, resourcesGLB);
	const editorLoad = (resourcesGLB && resourcesGLB.editorLoad) || (resource && resource.editorLoad) || null;
	if (!editorLoad) {
		const managedAsset = Boolean(resource && resource.asset_id);
		return {
			loadUrl: managedAsset ? '' : canonicalUrl,
			canonicalUrl,
			loadVariant: managedAsset ? 'none' : 'source',
			loadBytes: 0,
			usesPreview: false,
			usesDerivative: false,
			status: managedAsset ? 'missing' : (canonicalUrl ? 'ready' : 'missing'),
			message: managedAsset ? 'Authorized editor-load metadata is unavailable.' : ''
		};
	}

	const loadVariant = String(editorLoad.loadVariant || 'none');
	return {
		loadUrl: editorLoad.loadUrl || '',
		canonicalUrl: editorLoad.canonicalUrl || canonicalUrl,
		loadVariant,
		loadBytes: Number(editorLoad.loadBytes || 0),
		usesPreview: loadVariant === 'editor-preview',
		usesDerivative: loadVariant !== 'none' && loadVariant !== 'source',
		status: String(editorLoad.status || 'missing'),
		previewStatus: String(editorLoad.previewStatus || 'none'),
		message: String(editorLoad.message || ''),
		canRetry: Boolean(editorLoad.canRetry),
		canLoadSource: Boolean(editorLoad.canLoadSource)
	};
}

function vrodosLoaderStartGlbAnimations(object, animationRoot) {
    if (!object || !object.animations || object.animations.length === 0) {
        return null;
    }

    object.mixer = new THREE.AnimationMixer(animationRoot || object.scene);
    VRODOS.editor.envir.animationMixers.push(object.mixer);
    const action = object.mixer.clipAction(object.animations[0]);
    action.play();
    return object.mixer;
}

function vrodosLoaderCreateGlbSceneRoot(object, resource) {
    const contentRoot = object && object.scene;
    const requestedMode = resource && resource.vrodosAssetOriginMode;
    const origin = window.VRODOSModelOrigin;
    if (!contentRoot || !origin || origin.normalizeMode(requestedMode) !== origin.MODE_BOUNDS_CENTER) {
        return contentRoot;
    }

    const centered = origin.createOffsetRoot(contentRoot, requestedMode);
    if (!centered.applied || !centered.root) {
        console.warn('VRodos: could not center GLB asset bounds; the authored origin will be preserved.', {
            asset_id: resource.asset_id || '',
            reason: centered.reason || 'unknown'
        });
        return contentRoot;
    }

    const sceneRoot = new THREE.Group();
    sceneRoot.add(centered.root);
    sceneRoot.userData = Object.assign({}, sceneRoot.userData || {}, {
        vrodosGlbCacheInstance: Boolean(contentRoot.userData && contentRoot.userData.vrodosGlbCacheInstance),
        vrodosGlbCacheKey: contentRoot.userData && contentRoot.userData.vrodosGlbCacheKey
    });
    sceneRoot.vrodosAssetOriginCenter = [centered.center.x, centered.center.y, centered.center.z];
    return sceneRoot;
}

function vrodosLoaderAddGlbSceneObject(object, name, resources3D, loadInfo) {
    const resource = resources3D[name] || {};
    const sceneRoot = vrodosLoaderCreateGlbSceneRoot(object, resource);
    const finalObject = VRODOS.loader.setObjectProperties(sceneRoot, name, resources3D);
    finalObject.isSelectableMesh = true;
    VRODOS.loader.applyTextureAnisotropy(finalObject, VRODOS.loader.getEditorTextureAnisotropy());

    if (finalObject.children === '') {
        finalObject.children = [];
    }

    finalObject.glb_path = loadInfo.canonicalUrl || finalObject.glb_path || '';
    finalObject.path = loadInfo.canonicalUrl || finalObject.path || '';
    finalObject.editor_loaded_glb_path = loadInfo.loadUrl || '';
	finalObject.editor_preview_loaded = Boolean(loadInfo.usesPreview);
	finalObject.editor_load_variant = loadInfo.loadVariant || 'source';
    finalObject.editor_preview_status = loadInfo.status || 'none';
    finalObject.editor_preview_message = loadInfo.message || '';
    VRODOS.editor.objectFactory.addSceneObject(finalObject, {
        selectable: true,
        incrementLoaded: false,
        renderReason: 'glb-loaded'
    });

    if (typeof VRODOS.editor.envir.applyEditorPerformanceProfile === 'function') {
        VRODOS.editor.envir.applyEditorPerformanceProfile(false);
    }

    return finalObject;
}

VRODOS.loader.fetchGlbMetadata = async function(name, resource) {
    const ajaxUrl = VRODOS.utils.getAjaxUrl();
    const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			action: 'vrodos_fetch_glb_asset_action',
			nonce: window.vrodos_data.scene_mutation_nonce,
            asset_id: resource.asset_id
        })
    });

    try {
        const resText = await response.text();
        const trimmed = resText.trim();
        if (!trimmed || trimmed[0] === '<') {
            throw new Error(`GLB metadata endpoint returned HTML from ${ajaxUrl}`);
        }

        return JSON.parse(trimmed);
    } catch (error) {
        console.warn(`Could not parse metadata for asset ${  name}`, error);
        return {};
    }
};

function vrodosLoaderHasLocalGlbMetadata(resource) {
    if (!resource) {
        return false;
    }

    if (resource.asset_missing) {
        return true;
    }

    if (resource.editorMetadataHydrated === true) {
        return true;
    }

    if (resource.asset_id) {
        return false;
    }

    return Boolean(resource.glb_path || resource.path);
}

function vrodosLoaderRecordGlbMetadataCache(result) {
    if (
        VRODOS.editor &&
        VRODOS.editor.diagnostics &&
        typeof VRODOS.editor.diagnostics.recordGlbMetadataCache === 'function'
    ) {
        VRODOS.editor.diagnostics.recordGlbMetadataCache(result);
    }
}

async function vrodosLoaderResolveGlbMetadata(name, resource) {
    if (vrodosLoaderHasLocalGlbMetadata(resource)) {
        vrodosLoaderRecordGlbMetadataCache('hit');
        return {};
    }

    vrodosLoaderRecordGlbMetadataCache('miss');
    return VRODOS.loader.fetchGlbMetadata(name, resource);
}

VRODOS.loader.resolveGlbAssetRequest = async function(name, resource) {
    const resourcesGLB = await vrodosLoaderResolveGlbMetadata(name, resource);
    vrodosLoaderMergeGlbMetadata(resource, resourcesGLB);

    return {
        name,
        resource,
        loadInfo: vrodosLoaderResolveEditorGlbLoadTarget(resource, resourcesGLB)
    };
};

VRODOS.loader.pendingEditorGlbLoads = VRODOS.loader.pendingEditorGlbLoads || new Map();

function vrodosLoaderPreviewActionId(group) {
	const assetId = Number(group[0] && group[0].resource && group[0].resource.asset_id || 0);
	return assetId > 0 ? `vrodos-preview-actions-${assetId}` : '';
}

function vrodosLoaderRemovePreviewActions(group) {
	const container = document.getElementById('editorPreviewLoadActions');
	const actionId = vrodosLoaderPreviewActionId(group);
	const row = actionId ? document.getElementById(actionId) : null;
	if (row) row.remove();
	if (container && container.children.length === 0) {
		container.classList.add('tw-hidden');
	}
}

async function vrodosLoaderLoadActionGroup(group, resources3D) {
	const currentGroup = group.filter((request) => vrodosLoaderPendingRequestIsCurrent(request, resources3D));
	if (currentGroup.length === 0) {
		vrodosLoaderRemovePreviewActions(group);
		if (typeof VRODOS.api.hideSceneLoadingProgress === 'function') {
			VRODOS.api.hideSceneLoadingProgress();
		}
		return;
	}
	vrodosLoaderRemovePreviewActions(group);
	const loader = VRODOS.loader.createGltfLoader(null, {
		renderer: VRODOS.editor.envir && VRODOS.editor.envir.renderer
	});
	await VRODOS.loader.loadResolvedGlbAssetGroup(null, loader, currentGroup, resources3D);
	if (typeof window.requestAnimationFrame === 'function') {
		await new Promise((resolve) => window.requestAnimationFrame(resolve));
	}
	if (typeof VRODOS.api.hideSceneLoadingProgress === 'function') {
		VRODOS.api.hideSceneLoadingProgress();
	}
}

function vrodosLoaderShowPreviewActions(group, resources3D) {
	const representative = group[0];
	const loadInfo = representative && representative.loadInfo;
	const assetId = Number(representative && representative.resource && representative.resource.asset_id || 0);
	const container = document.getElementById('editorPreviewLoadActions');
	const actionId = vrodosLoaderPreviewActionId(group);
	if (!representative || !loadInfo || !container || !actionId || assetId <= 0) return;

	let row = document.getElementById(actionId);
	if (!row) {
		row = document.createElement('div');
		row.id = actionId;
		row.className = 'tw-rounded-xl tw-border tw-border-amber-400/40 tw-bg-slate-950/90 tw-p-3 tw-text-left tw-shadow-xl';
		container.appendChild(row);
	}
	row.replaceChildren();

	const message = document.createElement('p');
	message.className = 'tw-mb-2 tw-text-xs tw-font-semibold tw-text-slate-100';
	message.textContent = `${VRODOS.utils.loaderDisplayText(representative.resource.asset_name || representative.name)}: ${loadInfo.message || 'The optimized editor preview could not be prepared.'}`;
	row.appendChild(message);

	const controls = document.createElement('div');
	controls.className = 'tw-flex tw-flex-wrap tw-gap-2';
	row.appendChild(controls);

	if (loadInfo.canRetry) {
		const retry = document.createElement('button');
		retry.type = 'button';
		retry.className = 'tw-btn tw-btn-xs tw-border-0 tw-bg-amber-500 tw-text-white hover:tw-bg-amber-600';
		retry.textContent = 'Retry Preview';
		retry.addEventListener('click', async () => {
			retry.disabled = true;
			try {
				const response = await fetch(VRODOS.utils.getAjaxUrl(), {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						action: 'vrodos_retry_editor_preview_action',
						nonce: window.vrodos_data.scene_mutation_nonce,
						asset_id: String(assetId)
					})
				});
				const payload = await response.json();
				if (!response.ok || !payload || !payload.success) {
					throw new Error(payload && payload.data || 'Preview retry failed.');
				}
				if (document.getElementById(actionId) !== row) return;
				const refreshed = group
					.filter((request) => vrodosLoaderPendingRequestIsCurrent(request, resources3D))
					.map((request) => Object.assign({}, request, {
						loadInfo: vrodosLoaderResolveEditorGlbLoadTarget(request.resource, { editorLoad: payload.data })
					}));
				if (refreshed.length === 0) {
					vrodosLoaderRemovePreviewActions(group);
					return;
				}
				if (refreshed[0].loadInfo.loadUrl) {
					await vrodosLoaderLoadActionGroup(refreshed, resources3D);
					return;
				}
				vrodosLoaderRemovePreviewActions(group);
				if (typeof VRODOS.api.showSceneLoadingProgress === 'function') {
					VRODOS.api.showSceneLoadingProgress('Optimized preview retry queued');
				}
				vrodosLoaderSchedulePendingGroupRetry(refreshed, resources3D);
			} catch (error) {
				message.textContent = `Preview retry failed: ${error && error.message ? error.message : 'Unknown error.'}`;
				retry.disabled = false;
			}
		});
		controls.appendChild(retry);
	}

	if (loadInfo.canLoadSource && loadInfo.canonicalUrl) {
		const fullSource = document.createElement('button');
		fullSource.type = 'button';
		fullSource.className = 'tw-btn tw-btn-xs tw-border-0 tw-bg-white tw-text-slate-800 hover:tw-bg-slate-100';
		fullSource.textContent = 'Load Full Source Quality';
		fullSource.addEventListener('click', async () => {
			fullSource.disabled = true;
			const sourceGroup = group.map((request) => Object.assign({}, request, {
				loadInfo: Object.assign({}, request.loadInfo, {
					status: 'ready',
					loadUrl: request.loadInfo.canonicalUrl,
					loadVariant: 'source',
					usesPreview: false,
					usesDerivative: false,
					message: 'Loading the original source GLB.'
				})
			}));
			await vrodosLoaderLoadActionGroup(sourceGroup, resources3D);
		});
		controls.appendChild(fullSource);
	}

	container.classList.remove('tw-hidden');
	if (typeof VRODOS.api.showSceneLoadingProgress === 'function') {
		VRODOS.api.showSceneLoadingProgress('Optimized preview needs attention', { immediate: true });
	}
}

function vrodosLoaderPendingGroupKey(group) {
	const assetId = Number(group[0] && group[0].resource && group[0].resource.asset_id || 0);
	return assetId > 0
		? `asset:${assetId}`
		: group.map((request) => request.name).sort().join('|');
}

function vrodosLoaderPendingRequestIsCurrent(request, resources3D) {
	const currentResources = typeof VRODOS.utils.getSceneDataObjectMap === 'function'
		? VRODOS.utils.getSceneDataObjectMap({ create: false })
		: resources3D;
	if (!currentResources || !Object.prototype.hasOwnProperty.call(currentResources, request.name)) {
		return false;
	}

	const currentResource = currentResources[request.name] || {};
	const expectedAssetId = Number(request.resource && request.resource.asset_id || 0);
	const currentAssetId = Number(currentResource.asset_id || 0);
	return expectedAssetId === 0 || currentAssetId === expectedAssetId;
}

function vrodosLoaderSchedulePendingGroupRetry(group, resources3D) {
	const representative = group[0];
	if (!representative || representative.loadInfo.status !== 'pending' || !representative.resource.asset_id) return;

	const key = vrodosLoaderPendingGroupKey(group);
	const existing = VRODOS.loader.pendingEditorGlbLoads.get(key);
	if (existing) {
		group.forEach((request) => existing.requests.set(request.name, request));
		return;
	}
	const state = {
		attempts: 0,
		timer: null,
		stopped: false,
		requests: new Map(group.map((request) => [request.name, request]))
	};
	VRODOS.loader.pendingEditorGlbLoads.set(key, state);

	const poll = async () => {
		if (state.stopped) {
			VRODOS.loader.pendingEditorGlbLoads.delete(key);
			return;
		}
		const currentGroup = Array.from(state.requests.values()).filter((request) => (
			vrodosLoaderPendingRequestIsCurrent(request, resources3D)
		));
		if (currentGroup.length === 0) {
			VRODOS.loader.pendingEditorGlbLoads.delete(key);
			return;
		}
		state.attempts++;
		try {
			const metadata = await VRODOS.loader.fetchGlbMetadata(representative.name, representative.resource);
			const refreshed = currentGroup
				.filter((request) => vrodosLoaderPendingRequestIsCurrent(request, resources3D))
				.map((request) => {
				vrodosLoaderMergeGlbMetadata(request.resource, metadata);
				return Object.assign({}, request, {
					loadInfo: vrodosLoaderResolveEditorGlbLoadTarget(request.resource, metadata)
				});
			});
			if (refreshed.length === 0) {
				VRODOS.loader.pendingEditorGlbLoads.delete(key);
				return;
			}
			const loadInfo = refreshed[0].loadInfo;
			if (loadInfo.loadUrl) {
				VRODOS.loader.pendingEditorGlbLoads.delete(key);
				await vrodosLoaderLoadActionGroup(refreshed, resources3D);
				return;
			}
			if (loadInfo.status === 'failed' || loadInfo.status === 'missing' || loadInfo.status === 'forbidden') {
				console.warn(`Optimized editor preview for '${representative.name}' is unavailable.`, loadInfo);
				VRODOS.loader.pendingEditorGlbLoads.delete(key);
				if (loadInfo.status === 'failed') {
					vrodosLoaderShowPreviewActions(refreshed, resources3D);
				}
				return;
			}
		} catch (error) {
			console.warn(`Could not refresh optimized preview for '${representative.name}'.`, error);
		}
		const delay = Math.min(15000, 3000 + (state.attempts * 1000));
		state.timer = window.setTimeout(poll, delay);
	};

	state.timer = window.setTimeout(poll, 3000);
}

if (typeof window.addEventListener === 'function') {
	window.addEventListener('pagehide', () => {
		VRODOS.loader.pendingEditorGlbLoads.forEach((state) => {
			state.stopped = true;
			if (state.timer) window.clearTimeout(state.timer);
		});
		VRODOS.loader.pendingEditorGlbLoads.clear();
	});
}

function vrodosLoaderTrackManagerStart(manager, requests) {
    if (!manager) return;
    requests.forEach((request) => manager.itemStart(request.name));
}

function vrodosLoaderTrackManagerEnd(manager, request, failed) {
    if (!manager) return;
    if (failed) manager.itemError(request.name);
    manager.itemEnd(request.name);
}

function vrodosLoaderCreateTemplatePromise(gltfLoader, requests) {
    const representative = requests[0];
    const loadInfo = representative.loadInfo;
    const placementCount = requests.length;

    return new Promise((resolve, reject) => {
		gltfLoader.load(
            loadInfo.loadUrl,
            resolve,
			(xhr) => {
				const loadedBytes = Number(xhr.loaded || 0);
				const totalBytes = Number(xhr.total || loadInfo.loadBytes || 0);
				const mbLoaded = Math.floor(loadedBytes / 104857.6) / 10;
				const displayName = VRODOS.utils.loaderDisplayText(representative.resource.asset_name || representative.name);
				const placementLabel = placementCount > 1 ? ` (${placementCount} placements)` : '';
				if (typeof VRODOS.api.setSceneLoadingProgressText === 'function') {
					if (totalBytes > 0 && loadedBytes >= totalBytes) {
						VRODOS.api.setSceneLoadingProgressText(`Decoding '${displayName}'${placementLabel}`);
					} else if (totalBytes > 0) {
						const percent = Math.max(0, Math.min(100, Math.round((loadedBytes / totalBytes) * 100)));
						const totalMb = Math.round((totalBytes / 1048576) * 10) / 10;
						VRODOS.api.setSceneLoadingProgressText(`Loading optimized preview — ${percent}% · ${mbLoaded} / ${totalMb} MB`);
					} else {
						VRODOS.api.setSceneLoadingProgressText(`Loading optimized preview — ${mbLoaded} MB`);
					}
				}
            },
            reject
        );
    });
}

function vrodosLoaderWarnMissingPath(request) {
	const message = request.loadInfo && request.loadInfo.message
		? request.loadInfo.message
		: 'No GLB path is available.';
	console.warn(`Asset '${request.name}' was not loaded: ${message}`, {
        asset_id: request.resource.asset_id || '',
        asset_missing: Boolean(request.resource.asset_missing)
    });
}

VRODOS.loader.loadResolvedGlbAssetGroup = async function(manager, gltfLoader, requests, resources3D) {
    const group = Array.isArray(requests) ? requests.filter(Boolean) : [];
    if (group.length === 0) {
        return [];
    }

    vrodosLoaderTrackManagerStart(manager, group);
    const loadUrl = group[0].loadInfo && group[0].loadInfo.loadUrl;
	if (!loadUrl) {
		group.forEach((request) => {
			vrodosLoaderWarnMissingPath(request);
			vrodosLoaderTrackManagerEnd(manager, request, request.loadInfo.status !== 'pending');
		});
		vrodosLoaderSchedulePendingGroupRetry(group, resources3D);
		if (group[0].loadInfo.status === 'failed') {
			vrodosLoaderShowPreviewActions(group, resources3D);
		}
		return group.map(() => null);
    }

	if (typeof VRODOS.api.setSceneLoadingProgressText === 'function') {
		const label = group[0].loadInfo && group[0].loadInfo.loadVariant === 'source'
			? 'Loading full source quality'
			: 'Loading optimized preview';
		VRODOS.api.setSceneLoadingProgressText(label);
    }

	try {
		vrodosLoaderRemovePreviewActions(group);
		await VRODOS.loader.glbAssetCache.load(
            loadUrl,
            () => vrodosLoaderCreateTemplatePromise(gltfLoader, group)
		);
		if (typeof VRODOS.api.setSceneLoadingProgressText === 'function') {
			VRODOS.api.setSceneLoadingProgressText('Preparing first frame');
		}

        return group.map((request) => {
            const object = VRODOS.loader.glbAssetCache.instantiate(request.loadInfo.loadUrl);
            const finalObject = vrodosLoaderAddGlbSceneObject(
                object,
                request.name,
                resources3D,
                request.loadInfo
            );
            vrodosLoaderStartGlbAnimations(object, finalObject);

			if (request.loadInfo.usesDerivative) {
				console.info(`Loaded ${request.loadInfo.loadVariant} derivative for '${request.name}'.`, {
                    asset_id: request.resource.asset_id || '',
                    source: request.loadInfo.canonicalUrl,
                    preview: request.loadInfo.loadUrl
                });
            }

            vrodosLoaderTrackManagerEnd(manager, request, false);
            return finalObject;
        });
    } catch (error) {
        console.error('A GLB loading error happened. Error 1590', {
            error,
            url: loadUrl,
            placements: group.map((request) => request.name)
        });
        group.forEach((request) => vrodosLoaderTrackManagerEnd(manager, request, true));
        return group.map(() => null);
    }
};

VRODOS.loader.loadGlbAsset = async function(manager, gltfLoader, name, resource, resources3D) {
    try {
        const request = await VRODOS.loader.resolveGlbAssetRequest(name, resource);
        const results = await VRODOS.loader.loadResolvedGlbAssetGroup(
            manager,
            gltfLoader,
            [request],
            resources3D
        );
        return results[0] || null;
    } catch (error) {
        alert(`Could not fetch GLB asset. Probably deleted? ${name}`);
        console.error(`Ajax Fetch Asset ERROR: ${error}`);
        if (manager) {
            manager.itemStart(name);
            manager.itemError(name);
            manager.itemEnd(name);
        }
        return null;
    }
};
