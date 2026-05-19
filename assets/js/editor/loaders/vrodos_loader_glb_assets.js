"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.utils = VRODOS.utils || {};

function vrodosLoaderMergeGlbMetadata(resource, resourcesGLB) {
    if (!resource || !resourcesGLB) return;

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

    return resourcesGLB && resourcesGLB.glbURL ? resourcesGLB.glbURL : (resource.glb_path || resource.path || '');
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

function vrodosLoaderAddGlbSceneObject(object, name, resources3D, glbURL) {
    const finalObject = VRODOS.loader.setObjectProperties(object.scene, name, resources3D);
    finalObject.isSelectableMesh = true;
    VRODOS.loader.applyTextureAnisotropy(finalObject, VRODOS.loader.getEditorTextureAnisotropy());

    if (finalObject.children === '') {
        finalObject.children = [];
    }

    finalObject.glb_path = glbURL;
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

                const glbURL = vrodosLoaderResolveGlbUrl(resource, resourcesGLB, modelBaseUrl);
                if (!glbURL) {
                    if (manager) {
                        manager.itemError(name);
                        manager.itemEnd(name);
                    }
                    console.warn(`Asset '${name}' has no GLB path and will be skipped.`);
                    resolve(null);
                    return;
                }

                if (typeof VRODOS.api.setSceneLoadingProgressText === 'function') {
                    VRODOS.api.setSceneLoadingProgressText("Loading ...");
                }

                gltfLoader.load(
                    glbURL,
                    (object) => {
                        vrodosLoaderStartGlbAnimations(object);
                        const finalObject = vrodosLoaderAddGlbSceneObject(object, name, resources3D, glbURL);
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
