"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.editor = VRODOS.editor || {};

function vrodosLoaderHasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function vrodosLoaderValue(resource, key, fallback) {
    return vrodosLoaderHasOwn(resource, key) ? resource[key] : fallback;
}

function vrodosLoaderLightColor(resource, fallback) {
    const lightColor = resource && resource.lightcolor;
    if (Array.isArray(lightColor) && lightColor.length >= 3) {
        return new THREE.Color(lightColor[0], lightColor[1], lightColor[2]);
    }
    return new THREE.Color(fallback);
}

function vrodosLoaderConfigureLightMetadata(light, name, resource, metadata) {
    const defaults = metadata || {};
    const source = resource || {};

    light.name = name;
    light.asset_name = defaults.assetName;
    light.category_name = defaults.categoryName;
    if (defaults.categorySlug || source.category_slug) {
        light.category_slug = source.category_slug || defaults.categorySlug;
    }
    light.isSelectableMesh = true;
    light.isLight = true;
    light.addedAt = source.addedAt;
    if (vrodosLoaderHasOwn(source, 'locked')) {
        light.locked = source.locked;
    }

    return light;
}

VRODOS.loader.createEditorSunLightObjects = function(name, resource, options) {
    const source = resource || {};
    const opts = options || {};
    const color = vrodosLoaderHasOwn(opts, 'color') ? opts.color : vrodosLoaderLightColor(source, 0xffffff);
    const helperColor = vrodosLoaderHasOwn(opts, 'helperColor') ? opts.helperColor : color;
    const targetColor = vrodosLoaderHasOwn(opts, 'targetColor') ? opts.targetColor : color;
    const visualColor = vrodosLoaderHasOwn(opts, 'visualColor') ? opts.visualColor : color;
    const light = new THREE.DirectionalLight(color, vrodosLoaderValue(source, 'lightintensity', 1));

    if (opts.loadDefaults) {
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500;
    }

    vrodosLoaderConfigureLightMetadata(light, name, source, {
        assetName: "mylightSun",
        categoryName: "lightSun",
        categorySlug: opts.addDefaults ? "lightSun" : ''
    });
    light.castShadow = true;
    light.sunSky = vrodosLoaderValue(source, 'sunSky', opts.addDefaults ? true : undefined);
    light.castingShadow = vrodosLoaderValue(source, 'castingShadow', opts.addDefaults ? true : undefined);
    light.shadowMapHeight = vrodosLoaderValue(source, 'shadowMapHeight', opts.addDefaults ? "1024" : undefined);
    light.shadowMapWidth = vrodosLoaderValue(source, 'shadowMapWidth', opts.addDefaults ? "1024" : undefined);
    light.shadowCameraTop = vrodosLoaderValue(source, 'shadowCameraTop', opts.addDefaults ? "200" : undefined);
    light.shadowCameraBottom = vrodosLoaderValue(source, 'shadowCameraBottom', opts.addDefaults ? "-200" : undefined);
    light.shadowCameraLeft = vrodosLoaderValue(source, 'shadowCameraLeft', opts.addDefaults ? "-200" : undefined);
    light.shadowCameraRight = vrodosLoaderValue(source, 'shadowCameraRight', opts.addDefaults ? "200" : undefined);
    light.shadowBias = vrodosLoaderValue(source, 'shadowBias', opts.addDefaults ? "-0.001" : undefined);
    if (opts.addDefaults) {
        light.defaultColor = vrodosLoaderValue(source, 'defaultColor', "0xffffff");
    }

    const sphere = VRODOS.utils.createEditorLightVisualSphere('SunSphere', {
        radius: 1,
        color: visualColor
    });
    light.add(sphere);

    const helper = VRODOS.utils.createEditorLightHelper(light, {
        size: 3,
        color: helperColor
    });
    const target = VRODOS.utils.createEditorLightTarget(light, {
        addedAt: source.addedAt,
        color: targetColor,
        helper,
        position: Array.isArray(source.targetposition) ? source.targetposition : [0, 0, 0]
    });
    const shadowHelper = VRODOS.utils.createEditorLightShadowHelper(light);

    return { light, helper, target, shadowHelper };
};

VRODOS.loader.createEditorLampLightObjects = function(name, resource, options) {
    const source = resource || {};
    const opts = options || {};
    const color = vrodosLoaderHasOwn(opts, 'color') ? opts.color : vrodosLoaderLightColor(source, 0xffffff);
    const visualColor = vrodosLoaderHasOwn(opts, 'visualColor') ? opts.visualColor : color;
    const helperColor = vrodosLoaderHasOwn(opts, 'helperColor') ? opts.helperColor : color;
    const light = new THREE.PointLight(
        color,
        vrodosLoaderValue(source, 'lightintensity', opts.addDefaults ? 1 : undefined),
        vrodosLoaderValue(source, 'lightdistance', opts.addDefaults ? 100 : undefined),
        vrodosLoaderValue(source, 'lightdecay', opts.addDefaults ? 2 : undefined)
    );

    vrodosLoaderConfigureLightMetadata(light, name, source, {
        assetName: "mylightLamp",
        categoryName: "lightLamp"
    });
    light.castShadow = true;
    if (vrodosLoaderHasOwn(source, 'shadowRadius')) {
        light.shadow.radius = parseFloat(source.shadowRadius);
    }
    light.lampcastingShadow = vrodosLoaderValue(source, 'lampcastingShadow', opts.addDefaults ? true : undefined);
    light.lampshadowMapHeight = vrodosLoaderValue(source, 'lampshadowMapHeight', opts.addDefaults ? "1024" : undefined);
    light.lampshadowMapWidth = vrodosLoaderValue(source, 'lampshadowMapWidth', opts.addDefaults ? "1024" : undefined);
    light.lampshadowCameraTop = vrodosLoaderValue(source, 'lampshadowCameraTop', opts.addDefaults ? "200" : undefined);
    light.lampshadowCameraBottom = vrodosLoaderValue(source, 'lampshadowCameraBottom', opts.addDefaults ? "-200" : undefined);
    light.lampshadowCameraLeft = vrodosLoaderValue(source, 'lampshadowCameraLeft', opts.addDefaults ? "-200" : undefined);
    light.lampshadowCameraRight = vrodosLoaderValue(source, 'lampshadowCameraRight', opts.addDefaults ? "200" : undefined);
    light.lampshadowBias = vrodosLoaderValue(source, 'lampshadowBias', opts.addDefaults ? "-0.001" : undefined);
    if (vrodosLoaderHasOwn(opts, 'power')) {
        light.power = opts.power;
    }

    const sphere = VRODOS.utils.createEditorLightVisualSphere('LampSphere', {
        radius: 0.5,
        color: visualColor
    });
    light.add(sphere);

    const helper = VRODOS.utils.createEditorLightHelper(light, {
        size: 1,
        color: helperColor
    });

    return { light, helper };
};

VRODOS.loader.createEditorSpotLightObjects = function(name, resource, options) {
    const source = resource || {};
    const opts = options || {};
    const color = vrodosLoaderHasOwn(opts, 'color') ? opts.color : new THREE.Color(0.996, 1, 0);
    const visualColor = vrodosLoaderHasOwn(opts, 'visualColor') ? opts.visualColor : color;
    const helperColor = vrodosLoaderHasOwn(opts, 'helperColor') ? opts.helperColor : color;
    const targetColor = vrodosLoaderHasOwn(opts, 'targetColor') ? opts.targetColor : helperColor;
    const light = new THREE.SpotLight(
        color,
        vrodosLoaderValue(source, 'lightintensity', opts.addDefaults ? 1 : undefined),
        vrodosLoaderValue(source, 'lightdistance', opts.addDefaults ? 5 : undefined),
        vrodosLoaderValue(source, 'lightangle', opts.addDefaults ? 0.39 : undefined),
        vrodosLoaderValue(source, 'lightpenumbra', opts.addDefaults ? 0 : undefined),
        vrodosLoaderValue(source, 'lightdecay', opts.addDefaults ? 2 : undefined)
    );

    light.scale.set(1, 1, 1);
    vrodosLoaderConfigureLightMetadata(light, name, source, {
        assetName: "mylightSpot",
        categoryName: "lightSpot"
    });
    light.castShadow = true;

    const sphereOptions = {
        radius: 1,
        color: visualColor
    };
    if (opts.visualRotation) {
        sphereOptions.rotation = opts.visualRotation;
    }
    const sphere = VRODOS.utils.createEditorLightVisualSphere('SpotSphere', sphereOptions);
    light.add(sphere);

    const helper = VRODOS.utils.createEditorLightHelper(light, {
        color: helperColor
    });
    const target = VRODOS.utils.createEditorLightTarget(light, {
        addedAt: source.addedAt,
        color: targetColor,
        helper,
        position: Array.isArray(source.targetposition) ? source.targetposition : [0, 0, 0]
    });

    return { light, helper, target };
};

VRODOS.loader.createEditorAmbientLightObjects = function(name, resource, options) {
    const source = resource || {};
    const opts = options || {};
    const color = vrodosLoaderHasOwn(opts, 'color') ? opts.color : vrodosLoaderLightColor(source, 0xffffff);
    const visualColor = vrodosLoaderHasOwn(opts, 'visualColor') ? opts.visualColor : 0xffff00;
    const light = new THREE.AmbientLight(color, vrodosLoaderValue(source, 'lightintensity', 1));

    vrodosLoaderConfigureLightMetadata(light, name, source, {
        assetName: "mylightAmbient",
        categoryName: "lightAmbient"
    });

    const sphereOptions = {
        radius: 1,
        color: visualColor
    };
    if (opts.visualRotation) {
        sphereOptions.rotation = opts.visualRotation;
    }
    const sphere = VRODOS.utils.createEditorLightVisualSphere('ambientSphere', sphereOptions);
    light.add(sphere);

    return { light };
};

function vrodosLoaderLoadSunAsset(name, resource) {
    const lightObjects = VRODOS.loader.createEditorSunLightObjects(name, resource, {
        loadDefaults: true
    });
    const light = lightObjects.light;
    VRODOS.loader.applyTRSToSceneObject(light, resource.trs);

    VRODOS.loader.registerLoadedEditorObject(light, { renderReason: 'sun-loaded' });
    VRODOS.loader.registerLoadedEditorObject(lightObjects.target, { renderReason: 'sun-target-loaded' });
    VRODOS.editor.envir.scene.add(lightObjects.helper);
    if (lightObjects.shadowHelper) {
        VRODOS.editor.envir.scene.add(lightObjects.shadowHelper);
    }
    VRODOS.utils.syncEditorLightArtifacts(light, VRODOS.editor.envir.scene);
}

function vrodosLoaderLoadLampAsset(name, resource) {
    const lightObjects = VRODOS.loader.createEditorLampLightObjects(name, resource);
    const light = lightObjects.light;

    VRODOS.loader.applyTRSToSceneObject(light, resource.trs);
    VRODOS.loader.registerLoadedEditorObject(light, { renderReason: 'lamp-loaded' });
    VRODOS.editor.envir.scene.add(lightObjects.helper);
}

function vrodosLoaderLoadSpotAsset(name, resource) {
    const lightObjects = VRODOS.loader.createEditorSpotLightObjects(name, resource);
    const light = lightObjects.light;

    VRODOS.loader.applyTRSToSceneObject(light, resource.trs);
    VRODOS.loader.registerLoadedEditorObject(lightObjects.target, { renderReason: 'spot-target-loaded' });
    VRODOS.loader.registerLoadedEditorObject(light, { renderReason: 'spot-loaded' });
    VRODOS.editor.envir.scene.add(lightObjects.helper);
    VRODOS.utils.syncEditorLightArtifacts(light, VRODOS.editor.envir.scene);
}

function vrodosLoaderLoadAmbientAsset(name, resource) {
    const lightObjects = VRODOS.loader.createEditorAmbientLightObjects(name, resource);
    const light = lightObjects.light;

    VRODOS.loader.applyTRSToSceneObject(light, resource.trs);
    VRODOS.loader.registerLoadedEditorObject(light, { renderReason: 'ambient-loaded' });
}

VRODOS.loader.loadLightAsset = function(name, resource, category) {
    const handlers = {
        lightSun: vrodosLoaderLoadSunAsset,
        lightLamp: vrodosLoaderLoadLampAsset,
        lightSpot: vrodosLoaderLoadSpotAsset,
        lightAmbient: vrodosLoaderLoadAmbientAsset
    };

    if (!handlers[category]) return false;

    handlers[category](name, resource);
    return true;
};
