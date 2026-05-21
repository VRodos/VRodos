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
        'editorPreviewMustAvoidSource',
        'editorPreviewReasons',
        'glbAnalysis'
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

function vrodosLoaderResolveGlbUrl(resource, resourcesGLB, modelBaseUrl) {
    if (!resource) return '';

    if (resource.category_slug === "video") {
        return `${modelBaseUrl  }editor/tv_flat_scaled_rotated.glb`;
    }

    if (resourcesGLB && Object.prototype.hasOwnProperty.call(resourcesGLB, 'glbURL')) {
        return resourcesGLB.glbURL || '';
    }

    return resource.glb_path || resource.path || '';
}

function vrodosLoaderResolveCanonicalGlbUrl(resource, resourcesGLB) {
    if (resourcesGLB && Object.prototype.hasOwnProperty.call(resourcesGLB, 'glbURL')) {
        return resourcesGLB.glbURL || '';
    }

    return resource && (resource.glb_path || resource.path || '') || '';
}

function vrodosLoaderResolveEditorGlbLoadTarget(resource, resourcesGLB, modelBaseUrl) {
    const canonicalUrl = vrodosLoaderResolveGlbUrl(resource, resourcesGLB, modelBaseUrl);
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
    const mustAvoidSource = Boolean(
        (resourcesGLB && resourcesGLB.editorPreviewMustAvoidSource) ||
        (resource && resource.editorPreviewMustAvoidSource)
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

    if (shouldUsePreview && mustAvoidSource) {
        return {
            loadUrl: '',
            canonicalUrl,
            usesPreview: false,
            skipSource: true,
            status: previewStatus,
            message: (resourcesGLB && resourcesGLB.editorPreviewMessage) || (resource && resource.editorPreviewMessage) || 'Large asset preview is not ready yet.'
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

function vrodosLoaderStartGlbAnimations(object) {
    if (!object || !object.animations || object.animations.length === 0) {
        return null;
    }

    object.mixer = new THREE.AnimationMixer(object.scene);
    VRODOS.editor.envir.animationMixers.push(object.mixer);
    const action = object.mixer.clipAction(object.animations[0]);
    action.play();
    return object.mixer;
}

function vrodosLoaderAddGlbSceneObject(object, name, resources3D, loadInfo) {
    const finalObject = VRODOS.loader.setObjectProperties(object.scene, name, resources3D);
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

function vrodosLoaderCreateLargeAssetPlaceholder(name, resource, resources3D, loadInfo) {
    const group = new THREE.Group();
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.MeshBasicMaterial({
            color: 0x0f766e,
            transparent: true,
            opacity: 0.18,
            wireframe: true
        })
    );
    box.name = `${name}_large_asset_placeholder_box`;
    box.isSelectableMesh = false;
    group.add(box);

    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 24, 16),
        new THREE.MeshBasicMaterial({ color: 0x14b8a6 })
    );
    marker.name = `${name}_large_asset_preview_status`;
    marker.position.set(0, 0.78, 0);
    marker.isSelectableMesh = false;
    group.add(marker);

    VRODOS.loader.setObjectProperties(group, name, resources3D);
    group.isSelectableMesh = true;
    group.glb_path = loadInfo.canonicalUrl || resource.glb_path || '';
    group.path = loadInfo.canonicalUrl || resource.path || '';
    group.editor_loaded_glb_path = '';
    group.editor_preview_loaded = false;
    group.editor_preview_placeholder = true;
    group.editor_preview_status = loadInfo.status || 'queued';
    group.editor_preview_message = loadInfo.message || 'Large asset preview is not ready yet.';
    group.editor_preview_full_load_available = true;

    VRODOS.editor.objectFactory.addSceneObject(group, {
        selectable: true,
        incrementLoaded: false,
        renderReason: 'large-glb-placeholder'
    });

    if (typeof VRODOS.api.setSceneLoadingProgressText === 'function') {
        VRODOS.api.setSceneLoadingProgressText(group.editor_preview_message);
    }

    return group;
}

VRODOS.loader.fetchGlbMetadata = async function(name, resource) {
    const ajaxUrl = VRODOS.utils.getAjaxUrl();
    const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            action: 'vrodos_fetch_glb_asset_action',
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

    if (resource.asset_id) {
        return false;
    }

    if (VRODOS.utils.normalizeSceneAssetCategory(resource.category_slug) === 'video') {
        return true;
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

VRODOS.loader.loadGlbAsset = function(manager, gltfLoader, name, resource, resources3D, options) {
    const opts = options || {};
    const modelBaseUrl = opts.modelBaseUrl || '';

    return new Promise((resolve) => {
        const fetchAndLoadGLB = async () => {
            try {
                if (manager) manager.itemStart(name);

                const resourcesGLB = await vrodosLoaderResolveGlbMetadata(name, resource);
                vrodosLoaderMergeGlbMetadata(resource, resourcesGLB);

                const loadInfo = vrodosLoaderResolveEditorGlbLoadTarget(resource, resourcesGLB, modelBaseUrl);
                if (loadInfo.skipSource) {
                    const placeholder = vrodosLoaderCreateLargeAssetPlaceholder(name, resource, resources3D, loadInfo);
                    console.warn(`Large asset '${name}' was not loaded because its editor preview is not ready.`, {
                        asset_id: resource.asset_id || '',
                        status: loadInfo.status,
                        message: loadInfo.message
                    });
                    if (manager) manager.itemEnd(name);
                    resolve(placeholder);
                    return;
                }

                if (!loadInfo.loadUrl) {
                    if (manager) {
                        manager.itemError(name);
                        manager.itemEnd(name);
                    }
                    console.warn(`Asset '${name}' has no GLB path and will be skipped.`, {
                        asset_id: resource.asset_id || '',
                        asset_missing: Boolean(resource.asset_missing)
                    });
                    resolve(null);
                    return;
                }

                if (typeof VRODOS.api.setSceneLoadingProgressText === 'function') {
                    VRODOS.api.setSceneLoadingProgressText("Loading ...");
                }

                gltfLoader.load(
                    loadInfo.loadUrl,
                    (object) => {
                        vrodosLoaderStartGlbAnimations(object);
                        const finalObject = vrodosLoaderAddGlbSceneObject(object, name, resources3D, loadInfo);
                        if (loadInfo.usesPreview) {
                            console.info(`Loaded editor preview derivative for '${name}'.`, {
                                asset_id: resource.asset_id || '',
                                source: loadInfo.canonicalUrl,
                                preview: loadInfo.loadUrl
                            });
                        }
                        if (manager) manager.itemEnd(name);
                        resolve(finalObject);
                    },
                    (xhr) => {
                        const mbLoaded = Math.floor(xhr.loaded / 104857.6) / 10;
                        const displayName = VRODOS.utils.loaderDisplayText(resource.asset_name || name);
                        if (typeof VRODOS.api.setSceneLoadingProgressText === 'function') {
                            VRODOS.api.setSceneLoadingProgressText(`'${displayName}' downloaded ${mbLoaded} Mb`);
                        }
                    },
                    (error) => {
                        console.error('A GLB loading error happened. Error 1590', error);
                        if (manager) {
                            manager.itemError(name);
                            manager.itemEnd(name);
                        }
                        resolve(null);
                    }
                );
            } catch (err) {
                alert(`Could not fetch GLB asset. Probably deleted? ${name}`);
                console.error(`Ajax Fetch Asset ERROR: ${err}`);
                if (manager) {
                    manager.itemError(name);
                    manager.itemEnd(name);
                }
                resolve(null);
            }
        };

        fetchAndLoadGLB();
    });
};
