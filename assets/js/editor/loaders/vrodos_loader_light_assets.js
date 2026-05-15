"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.loader = VRODOS.loader || {};
VRODOS.utils = VRODOS.utils || {};
VRODOS.editor = VRODOS.editor || {};

function vrodosLoaderLightColor(resource, fallback) {
    const lightColor = resource && resource.lightcolor;
    if (Array.isArray(lightColor) && lightColor.length >= 3) {
        return new THREE.Color(lightColor[0], lightColor[1], lightColor[2]);
    }
    return new THREE.Color(fallback);
}

function vrodosLoaderLoadSunAsset(name, resource) {
    const color = vrodosLoaderLightColor(resource, 0xffffff);
    const light = new THREE.DirectionalLight(color, resource.lightintensity);

    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    VRODOS.loader.applyTRSToSceneObject(light, resource.trs);

    const targetPosition = Array.isArray(resource.targetposition) ? resource.targetposition : [0, 0, 0];

    light.name = name;
    light.asset_name = "mylightSun";
    light.category_name = "lightSun";
    light.isSelectableMesh = true;
    light.isLight = true;
    light.addedAt = resource.addedAt;
    light.castShadow = true;
    light.sunSky = resource.sunSky;
    light.locked = resource.locked;
    light.castingShadow = resource.castingShadow;
    light.shadowMapHeight = resource.shadowMapHeight;
    light.shadowMapWidth = resource.shadowMapWidth;
    light.shadowCameraTop = resource.shadowCameraTop;
    light.shadowCameraBottom = resource.shadowCameraBottom;
    light.shadowCameraLeft = resource.shadowCameraLeft;
    light.shadowCameraRight = resource.shadowCameraRight;
    light.shadowBias = resource.shadowBias;

    const sphere = VRODOS.utils.createEditorLightVisualSphere('SunSphere', {
        radius: 1,
        color
    });
    light.add(sphere);

    const helper = VRODOS.utils.createEditorLightHelper(light, {
        size: 3,
        color
    });
    VRODOS.loader.registerLoadedEditorObject(light, { renderReason: 'sun-loaded' });

    const targetSpot = VRODOS.utils.createEditorLightTarget(light, {
        addedAt: resource.addedAt,
        color,
        helper,
        position: targetPosition
    });
    VRODOS.loader.registerLoadedEditorObject(targetSpot, { renderReason: 'sun-target-loaded' });
    VRODOS.editor.envir.scene.add(helper);

    const shadowHelper = VRODOS.utils.createEditorLightShadowHelper(light);
    if (shadowHelper) {
        VRODOS.editor.envir.scene.add(shadowHelper);
    }
    VRODOS.utils.syncEditorLightArtifacts(light, VRODOS.editor.envir.scene);
}

function vrodosLoaderLoadLampAsset(name, resource) {
    const color = vrodosLoaderLightColor(resource, 0xffffff);
    const light = new THREE.PointLight(color, resource.lightintensity, resource.lightdistance, resource.lightdecay);

    VRODOS.loader.applyTRSToSceneObject(light, resource.trs);
    light.name = name;
    light.asset_name = "mylightLamp";
    light.category_name = "lightLamp";
    light.isSelectableMesh = true;
    light.isLight = true;
    light.addedAt = resource.addedAt;
    light.castShadow = true;
    light.shadow.radius = parseFloat(resource.shadowRadius);
    light.locked = resource.locked;
    light.lampcastingShadow = resource.lampcastingShadow;
    light.lampshadowMapHeight = resource.lampshadowMapHeight;
    light.lampshadowMapWidth = resource.lampshadowMapWidth;
    light.lampshadowCameraTop = resource.lampshadowCameraTop;
    light.lampshadowCameraBottom = resource.lampshadowCameraBottom;
    light.lampshadowCameraLeft = resource.lampshadowCameraLeft;
    light.lampshadowCameraRight = resource.lampshadowCameraRight;
    light.lampshadowBias = resource.lampshadowBias;

    VRODOS.loader.registerLoadedEditorObject(light, { renderReason: 'lamp-loaded' });

    const sphere = VRODOS.utils.createEditorLightVisualSphere('LampSphere', {
        radius: 0.5,
        color
    });
    light.add(sphere);

    const helper = VRODOS.utils.createEditorLightHelper(light, {
        size: 1,
        color
    });
    VRODOS.editor.envir.scene.add(helper);
}

function vrodosLoaderLoadSpotAsset(name, resource) {
    const color = new THREE.Color(0.996, 1, 0);
    const light = new THREE.SpotLight(color, resource.lightintensity, resource.lightdistance, resource.lightangle, resource.lightpenumbra, resource.lightdecay);

    VRODOS.loader.applyTRSToSceneObject(light, resource.trs);
    light.scale.set(1, 1, 1);
    light.name = name;
    light.asset_name = "mylightSpot";
    light.category_name = "lightSpot";
    light.isSelectableMesh = true;
    light.isLight = true;
    light.addedAt = resource.addedAt;
    light.locked = resource.locked;
    light.castShadow = true;

    const sphere = VRODOS.utils.createEditorLightVisualSphere('SpotSphere', {
        radius: 1,
        color
    });
    light.add(sphere);

    const targetPosition = Array.isArray(resource.targetposition) ? resource.targetposition : [0, 0, 0];
    const helper = VRODOS.utils.createEditorLightHelper(light, {
        color
    });
    const targetSpot = VRODOS.utils.createEditorLightTarget(light, {
        addedAt: resource.addedAt,
        color,
        helper,
        position: targetPosition
    });

    VRODOS.loader.registerLoadedEditorObject(targetSpot, { renderReason: 'spot-target-loaded' });
    VRODOS.loader.registerLoadedEditorObject(light, { renderReason: 'spot-loaded' });
    VRODOS.editor.envir.scene.add(helper);
    VRODOS.utils.syncEditorLightArtifacts(light, VRODOS.editor.envir.scene);
}

function vrodosLoaderLoadAmbientAsset(name, resource) {
    const color = vrodosLoaderLightColor(resource, 0xffffff);
    const helperColor = 0xffff00;
    const light = new THREE.AmbientLight(color, resource.lightintensity);

    VRODOS.loader.applyTRSToSceneObject(light, resource.trs);
    light.name = name;
    light.asset_name = "mylightAmbient";
    light.category_name = "lightAmbient";
    light.isSelectableMesh = true;
    light.isLight = true;
    light.addedAt = resource.addedAt;
    light.locked = resource.locked;

    const sphere = VRODOS.utils.createEditorLightVisualSphere('ambientSphere', {
        radius: 1,
        color: helperColor
    });
    light.add(sphere);

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
