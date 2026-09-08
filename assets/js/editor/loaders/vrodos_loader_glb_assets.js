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
        'sourceSizeBytes',
        'editorPreviewGlbURL',
        'editorPreviewStatus',
        'editorPreviewMessage',
        'editorPreviewShouldUse',
        'editorPreviewReasons',
        'glbAnalysis',
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
    const previewUrl = resourcesGLB && resourcesGLB.editorPreviewGlbURL
        ? resourcesGLB.editorPreviewGlbURL
        : (resource && resource.editorPreviewGlbURL ? resource.editorPreviewGlbURL : '');
    const previewStatus = String(
        (resourcesGLB && resourcesGLB.editorPreviewStatus) ||
        (resource && resource.editorPreviewStatus) ||
        'none'
    );
    const shouldUsePreview = Boolean(
        (resourcesGLB && resourcesGLB.editorPreviewShouldUse) ||
        (resource && resource.editorPreviewShouldUse)
    );

    if (shouldUsePreview && previewStatus === 'ready' && previewUrl) {
        return {
            loadUrl: previewUrl,
            canonicalUrl,
            usesPreview: true,
            status: previewStatus,
            message: (resourcesGLB && resourcesGLB.editorPreviewMessage) || (resource && resource.editorPreviewMessage) || 'Editor preview optimized.'
        };
    }

    return {
        loadUrl: canonicalUrl,
        canonicalUrl,
        usesPreview: false,
        status: previewStatus,
        message: (resourcesGLB && resourcesGLB.editorPreviewMessage) || (resource && resource.editorPreviewMessage) || ''
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
                const mbLoaded = Math.floor(xhr.loaded / 104857.6) / 10;
                const displayName = VRODOS.utils.loaderDisplayText(representative.resource.asset_name || representative.name);
                const placementLabel = placementCount > 1 ? ` (${placementCount} placements)` : '';
                if (typeof VRODOS.api.setSceneLoadingProgressText === 'function') {
                    VRODOS.api.setSceneLoadingProgressText(`'${displayName}'${placementLabel} downloaded ${mbLoaded} Mb`);
                }
            },
            reject
        );
    });
}

function vrodosLoaderWarnMissingPath(request) {
    console.warn(`Asset '${request.name}' has no GLB path and will be skipped.`, {
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
            vrodosLoaderTrackManagerEnd(manager, request, true);
        });
        return group.map(() => null);
    }

    if (typeof VRODOS.api.setSceneLoadingProgressText === 'function') {
        VRODOS.api.setSceneLoadingProgressText('Loading ...');
    }

    try {
        await VRODOS.loader.glbAssetCache.load(
            loadUrl,
            () => vrodosLoaderCreateTemplatePromise(gltfLoader, group)
        );

        return group.map((request) => {
            const object = VRODOS.loader.glbAssetCache.instantiate(request.loadInfo.loadUrl);
            const finalObject = vrodosLoaderAddGlbSceneObject(
                object,
                request.name,
                resources3D,
                request.loadInfo
            );
            vrodosLoaderStartGlbAnimations(object, finalObject);

            if (request.loadInfo.usesPreview) {
                console.info(`Loaded editor preview derivative for '${request.name}'.`, {
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
