"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.utils = VRODOS.utils || {};

VRODOS.loader.primitivePlaneMaterialProperties = Object.freeze([
    'planeWidth', 'planeDepth', 'surfaceColor', 'surfaceRoughness', 'surfaceMetalness',
    'surfaceTileSizeMeters', 'surfaceNormalScale', 'surfaceAoIntensity', 'surfaceNormalYSign',
    'surfaceAntiTilingEnabled', 'surfaceAntiTilingPatchTiles', 'surfaceAntiTilingBlendSharpness'
]);

VRODOS.loader.refreshPrimitivePlaneProperty = function (object, property) {
    if (object.category_slug !== 'primitive-plane') return;
    if (property === 'planeWidth' || property === 'planeDepth') {
        VRODOS.loader.refreshPrimitivePlaneGeometry(object);
    }
    if (VRODOS.loader.primitivePlaneMaterialProperties.includes(property)) {
        VRODOS.loader.refreshPrimitivePlaneMaterial(object);
    }
};

function vrodosLoaderShouldSelectImmediate(resource) {
    return Boolean(resource && resource.trs && !(VRODOS.editor.envir && VRODOS.editor.envir.isSceneLoading));
}

function vrodosLoaderHideProgressWrapper() {
    if (VRODOS.api && typeof VRODOS.api.hideSceneLoadingProgress === 'function') {
        VRODOS.api.hideSceneLoadingProgress({ clearTimers: false });
        return;
    }

    const progressWrapper = document.getElementById("progressWrapper");
    if (progressWrapper) {
        progressWrapper.style.visibility = "hidden";
    }
}

function vrodosLoaderAddGeneratedSceneObject(object, resource, options) {
    const opts = Object.assign({
        source: 'generated-loaded',
        renderReason: 'generated-loaded',
        immediateSelect: vrodosLoaderShouldSelectImmediate(resource)
    }, options || {});

    VRODOS.editor.objectFactory.addSceneObject(object, {
        selectable: true,
        updateHierarchy: VRODOS.loader.shouldBuildHierarchyDuringLoad() || opts.immediateSelect,
        select: opts.immediateSelect,
        frame: opts.immediateSelect,
        autosave: opts.immediateSelect,
        openPanel: false,
        showProperties: false,
        source: opts.source,
        renderReason: opts.renderReason
    });

    if (opts.immediateSelect) {
        vrodosLoaderHideProgressWrapper();
    }

    return object;
}

VRODOS.loader.loadAssessmentAsset = function(name, resource, resources3D) {
    return new Promise((resolve) => {
        const object = VRODOS.loader.createAssessmentObject(name, resource);
        VRODOS.loader.setObjectProperties(object, name, resources3D);
        VRODOS.editor.objectFactory.addSceneObject(object, {
            selectable: true,
            updateHierarchy: VRODOS.loader.shouldBuildHierarchyDuringLoad(),
            renderReason: 'assessment-loaded'
        });
        resolve(object);
    });
};

VRODOS.loader.loadTextAsset = function(name, resource, resources3D) {
    return new Promise((resolve) => {
        const object = VRODOS.loader.createTextPanelObject(name, resource);
        VRODOS.loader.setObjectProperties(object, name, resources3D);
        resolve(vrodosLoaderAddGeneratedSceneObject(object, resource, {
            source: 'text-loaded',
            renderReason: 'text-loaded'
        }));
    });
};

VRODOS.loader.loadVideoAsset = function(name, resource, resources3D) {
    return new Promise((resolve) => {
        const object = VRODOS.loader.createVideoDisplayObject(name, resource);
        VRODOS.loader.setObjectProperties(object, name, resources3D);
        resolve(vrodosLoaderAddGeneratedSceneObject(object, resource, {
            source: 'video-loaded',
            renderReason: 'video-loaded'
        }));
    });
};

VRODOS.loader.loadImageAsset = function(manager, name, resource, resources3D) {
    return new Promise((resolve) => {
        const imageUrl = resource.image_path;
        if (!imageUrl) {
            VRODOS.editor.envir.loadedObjectsCount++;
            resolve(null);
            return;
        }

        const geometry = new THREE.PlaneGeometry(2, 2);
        let object = null;

        if (manager) manager.itemStart(name);
        const texture = new THREE.TextureLoader(manager).load(
            imageUrl,
            () => {
                if (manager) manager.itemEnd(name);
                resolve(object);
            },
            undefined,
            () => {
                if (manager) {
                    manager.itemError(name);
                    manager.itemEnd(name);
                }
                resolve(object);
            }
        );
        const material = VRODOS.loader.createDoubleSidedTextureMaterial(texture);
        object = new THREE.Mesh(geometry, material);
        object = VRODOS.loader.setObjectProperties(object, name, resources3D);
        object.isSelectableMesh = true;

        vrodosLoaderAddGeneratedSceneObject(object, resource, {
            source: 'image-loaded',
            renderReason: 'image-loaded'
        });
    });
};

const VRODOS_PRIMITIVE_PLANE_DEFAULTS = Object.freeze({
    planeWidth: 100,
    planeDepth: 100,
    surfaceColor: '#ffffff',
    surfaceRoughness: 1,
    surfaceMetalness: 0,
    surfaceTileSizeMeters: 2,
    surfaceNormalScale: 1,
    surfaceAoIntensity: 1,
    surfaceNormalYSign: 1,
    surfaceAntiTilingEnabled: true,
    surfaceAntiTilingPatchTiles: 1.25,
    surfaceAntiTilingBlendSharpness: 4
});

const VRODOS_PRIMITIVE_PLANE_TEXTURES = Object.freeze({
    albedo: { url: 'surfaceAlbedoUrl', material: 'map', color: true },
    normal: { url: 'surfaceNormalUrl', material: 'normalMap', color: false },
    roughness: { url: 'surfaceRoughnessUrl', material: 'roughnessMap', color: false },
    ao: { url: 'surfaceAoUrl', material: 'aoMap', color: false },
    metalness: { url: 'surfaceMetalnessUrl', material: 'metalnessMap', color: false }
});

function vrodosClampPrimitivePlaneNumber(value, fallback, minimum, maximum) {
    const number = Number(value);
    return Math.min(maximum, Math.max(minimum, Number.isFinite(number) ? number : fallback));
}

function vrodosNormalizePrimitivePlane(object) {
    object.planeWidth = vrodosClampPrimitivePlaneNumber(object.planeWidth, VRODOS_PRIMITIVE_PLANE_DEFAULTS.planeWidth, 0.1, 10000);
    object.planeDepth = vrodosClampPrimitivePlaneNumber(object.planeDepth, VRODOS_PRIMITIVE_PLANE_DEFAULTS.planeDepth, 0.1, 10000);
    object.surfaceRoughness = vrodosClampPrimitivePlaneNumber(object.surfaceRoughness, VRODOS_PRIMITIVE_PLANE_DEFAULTS.surfaceRoughness, 0, 1);
    object.surfaceMetalness = vrodosClampPrimitivePlaneNumber(object.surfaceMetalness, VRODOS_PRIMITIVE_PLANE_DEFAULTS.surfaceMetalness, 0, 1);
    object.surfaceTileSizeMeters = vrodosClampPrimitivePlaneNumber(object.surfaceTileSizeMeters, VRODOS_PRIMITIVE_PLANE_DEFAULTS.surfaceTileSizeMeters, 0.01, 10000);
    object.surfaceNormalScale = vrodosClampPrimitivePlaneNumber(object.surfaceNormalScale, VRODOS_PRIMITIVE_PLANE_DEFAULTS.surfaceNormalScale, 0, 2);
    object.surfaceAoIntensity = vrodosClampPrimitivePlaneNumber(object.surfaceAoIntensity, VRODOS_PRIMITIVE_PLANE_DEFAULTS.surfaceAoIntensity, 0, 2);
    object.surfaceNormalYSign = Number(object.surfaceNormalYSign) < 0 ? -1 : 1;
    object.surfaceAntiTilingEnabled = ![false, 0, '0', 'false'].includes(object.surfaceAntiTilingEnabled);
    object.surfaceAntiTilingPatchTiles = vrodosClampPrimitivePlaneNumber(object.surfaceAntiTilingPatchTiles, VRODOS_PRIMITIVE_PLANE_DEFAULTS.surfaceAntiTilingPatchTiles, 0.5, 4);
    object.surfaceAntiTilingBlendSharpness = vrodosClampPrimitivePlaneNumber(object.surfaceAntiTilingBlendSharpness, VRODOS_PRIMITIVE_PLANE_DEFAULTS.surfaceAntiTilingBlendSharpness, 1, 12);
    delete object.surfaceVariationScaleMeters;
    delete object.surfaceVariationStrength;
    object.surfaceColor = /^#[0-9a-f]{6}$/i.test(String(object.surfaceColor || ''))
        ? String(object.surfaceColor)
        : VRODOS_PRIMITIVE_PLANE_DEFAULTS.surfaceColor;
    return object;
}

function vrodosConfigurePrimitivePlaneTexture(texture, object, isColorTexture) {
    if (!texture) return;

    if (THREE.RepeatWrapping !== undefined) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
    }
    if (isColorTexture && THREE.SRGBColorSpace !== undefined) {
        texture.colorSpace = THREE.SRGBColorSpace;
    } else if (!isColorTexture && THREE.NoColorSpace !== undefined) {
        texture.colorSpace = THREE.NoColorSpace;
    }
    const repeatU = object.planeWidth / object.surfaceTileSizeMeters;
    const repeatV = object.planeDepth / object.surfaceTileSizeMeters;
    if (texture.repeat && typeof texture.repeat.set === 'function') {
        texture.repeat.set(repeatU, repeatV);
    }
    texture.channel = 0;
    texture.needsUpdate = true;
    if (typeof VRODOS.loader.getEditorTextureAnisotropy === 'function') {
        texture.anisotropy = VRODOS.loader.getEditorTextureAnisotropy();
    }
}

VRODOS.loader.refreshPrimitivePlaneGeometry = function(object) {
    if (!object || object.category_slug !== 'primitive-plane') return object;
    vrodosNormalizePrimitivePlane(object);

    const previousGeometry = object.geometry;
    object.geometry = new THREE.PlaneGeometry(object.planeWidth, object.planeDepth, 1, 1);
    if (previousGeometry && typeof previousGeometry.dispose === 'function') {
        previousGeometry.dispose();
    }
    if (typeof object.updateMatrixWorld === 'function') object.updateMatrixWorld(true);
    if (VRODOS.editor.sceneRegistry && typeof VRODOS.editor.sceneRegistry.invalidateBounds === 'function') {
        VRODOS.editor.sceneRegistry.invalidateBounds(object);
    }
    return object;
};

VRODOS.loader.refreshPrimitivePlaneMaterial = function(object) {
    if (!object || object.category_slug !== 'primitive-plane' || !object.material) return object;
    vrodosNormalizePrimitivePlane(object);

    if (object.material.color && typeof object.material.color.set === 'function') {
        object.material.color.set(object.surfaceColor);
    }
    object.material.roughness = object.surfaceRoughness;
    object.material.metalness = object.surfaceMetalness;
    object.material.aoMapIntensity = object.surfaceAoIntensity;
    if (object.material.normalScale && typeof object.material.normalScale.set === 'function') {
        object.material.normalScale.set(object.surfaceNormalScale, object.surfaceNormalScale * object.surfaceNormalYSign);
    }
    Object.values(VRODOS_PRIMITIVE_PLANE_TEXTURES).forEach((definition) => {
        vrodosConfigurePrimitivePlaneTexture(object.material[definition.material], object, definition.color);
    });
    if (window.VRODOSSurfaceMaterial) {
        window.VRODOSSurfaceMaterial.applyStochasticTiling(object.material, {
            enabled: object.surfaceAntiTilingEnabled && Boolean(object.surfaceAlbedoUrl || object.material.map),
            patchTiles: object.surfaceAntiTilingPatchTiles,
            blendSharpness: object.surfaceAntiTilingBlendSharpness,
            seed: window.VRODOSSurfaceMaterial.seedFromString(object.uuid)
        });
    }
    object.material.needsUpdate = true;
    if (typeof VRODOS.editor.requestRender === 'function') {
        VRODOS.editor.requestRender('primitive-plane-material');
    }
    return object;
};

VRODOS.loader.setPrimitivePlaneTexture = function(object, slot, url) {
    const definition = VRODOS_PRIMITIVE_PLANE_TEXTURES[slot];
    if (!object || !definition || !object.material) return Promise.resolve(null);

    const previousTexture = object.material[definition.material];
    object[definition.url] = String(url || '');
    if (!object[definition.url]) {
        object.material[definition.material] = null;
        if (previousTexture && typeof previousTexture.dispose === 'function') previousTexture.dispose();
        VRODOS.loader.refreshPrimitivePlaneMaterial(object);
        if (typeof VRODOS.editor.requestRender === 'function') VRODOS.editor.requestRender('primitive-plane-texture-cleared');
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        const textureLoader = new THREE.TextureLoader();
        let nextTexture = null;
        nextTexture = textureLoader.load(
            object[definition.url],
            (loadedTexture) => {
                vrodosConfigurePrimitivePlaneTexture(loadedTexture, object, definition.color);
                if (typeof VRODOS.editor.requestRender === 'function') VRODOS.editor.requestRender('primitive-plane-texture-loaded');
                resolve(loadedTexture);
            },
            undefined,
            () => resolve(null)
        );
        vrodosConfigurePrimitivePlaneTexture(nextTexture, object, definition.color);
        object.material[definition.material] = nextTexture;
        VRODOS.loader.refreshPrimitivePlaneMaterial(object);
        if (previousTexture && previousTexture !== nextTexture && typeof previousTexture.dispose === 'function') {
            previousTexture.dispose();
        }
    });
};

VRODOS.loader.loadPrimitivePlaneTextures = function(object) {
    return Promise.all(Object.entries(VRODOS_PRIMITIVE_PLANE_TEXTURES).map(([slot, definition]) => (
        VRODOS.loader.setPrimitivePlaneTexture(object, slot, object[definition.url])
    )));
};

VRODOS.loader.createPrimitivePlaneObject = function(name, resource) {
    const values = vrodosNormalizePrimitivePlane(Object.assign({}, VRODOS_PRIMITIVE_PLANE_DEFAULTS, resource || {}));
    const normalScale = THREE.Vector2 ? new THREE.Vector2(values.surfaceNormalScale, values.surfaceNormalScale * values.surfaceNormalYSign) : undefined;
    const materialOptions = {
        color: values.surfaceColor,
        roughness: values.surfaceRoughness,
        metalness: values.surfaceMetalness,
        side: THREE.FrontSide,
        aoMapIntensity: values.surfaceAoIntensity
    };
    if (normalScale) materialOptions.normalScale = normalScale;

    const object = new THREE.Mesh(
        new THREE.PlaneGeometry(values.planeWidth, values.planeDepth, 1, 1),
        new THREE.MeshStandardMaterial(materialOptions)
    );
    object.planeWidth = values.planeWidth;
    object.planeDepth = values.planeDepth;
    object.surfaceColor = values.surfaceColor;
    object.surfaceRoughness = values.surfaceRoughness;
    object.surfaceMetalness = values.surfaceMetalness;
    object.surfaceTileSizeMeters = values.surfaceTileSizeMeters;
    object.surfaceNormalScale = values.surfaceNormalScale;
    object.surfaceAoIntensity = values.surfaceAoIntensity;
    object.surfaceNormalYSign = values.surfaceNormalYSign;
    object.surfaceAntiTilingEnabled = values.surfaceAntiTilingEnabled;
    object.surfaceAntiTilingPatchTiles = values.surfaceAntiTilingPatchTiles;
    object.surfaceAntiTilingBlendSharpness = values.surfaceAntiTilingBlendSharpness;
    object.name = name;
    object.asset_name = values.asset_name || name;
    object.category_name = 'primitive-plane';
    object.category_slug = 'primitive-plane';
    object.compiledCollisionEnabled = values.compiledCollisionEnabled !== false;
    object.walkableBehavior = values.walkableBehavior === 'auto' ? 'auto' : 'precise';
    object.vrodosShadowRole = values.vrodosShadowRole || 'receiver';
    object.vrodosMaterialRole = values.vrodosMaterialRole || 'authored-pbr';
    object.isSelectableMesh = true;
    return object;
};

VRODOS.loader.loadPrimitivePlaneAsset = function(name, resource, resources3D) {
    return new Promise((resolve) => {
        let object = VRODOS.loader.createPrimitivePlaneObject(name, resource);
        object = VRODOS.loader.setObjectProperties(object, name, resources3D);
        vrodosNormalizePrimitivePlane(object);
        VRODOS.loader.refreshPrimitivePlaneGeometry(object);
        VRODOS.loader.refreshPrimitivePlaneMaterial(object);
        VRODOS.loader.loadPrimitivePlaneTextures(object).finally(() => {
            resolve(vrodosLoaderAddGeneratedSceneObject(object, resource, {
                source: 'primitive-plane-loaded',
                renderReason: 'primitive-plane-loaded'
            }));
        });
    });
};
