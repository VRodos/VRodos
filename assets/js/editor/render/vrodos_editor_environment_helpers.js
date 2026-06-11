"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.editorRender = VRODOS.editorRender || {};
VRODOS.utils = VRODOS.utils || {};

(function initVrodosEditorEnvironmentHelpers() {
    const camera = Object.freeze({
        viewAngle: 60,
        frustumSize: 100000,
        near: 0.01,
        far: 200000,
        avatarFar: 4000,
        thirdPersonFar: 3000
    });

    const sceneDefaults = Object.freeze({
        surfaceDimension: 100,
        centerX: 0,
        centerY: 0,
        centerZ: 0,
        gridSize: 2000,
        gridDivisions: 40,
        axesSize: 100
    });

    const zoom = Object.freeze({
        min: 10,
        max: 5000,
        fallback: 600
    });

    const directorGroundGuide = Object.freeze({
        updateIntervalMs: 50,
        targetRefreshIntervalMs: 1000,
        maxDistance: 1000000,
        radius: 0.45,
        ringTubeRadius: 0.018,
        surfaceOffset: 0.012
    });

    const performanceDefaults = Object.freeze({
        targetFps: 45,
        lowEndTargetFps: 30,
        pixelRatioCap: 1.25,
        lowEndPixelRatioCap: 1,
        labelFrameStride: 2,
        lowEndLabelFrameStride: 3,
        loaderConcurrency: 3,
        lowEndLoaderConcurrency: 1,
        textureAnisotropy: 4,
        lowEndTextureAnisotropy: 2,
        denseSceneObjectCount: 75
    });

    const directorGroundGuideExcludedNames = new Set([
        'avatarCamera',
        'avatarControls',
        'avatarPitchObject',
        'Camera3Dmodel',
        'Camera3DmodelMesh',
        'DirectorGroundGuide',
        'DirectorGroundGuideShadow',
        'DirectorGroundGuideRing',
        'DirectorHitProxy',
        'myAxisHelper',
        'myGridHelper',
        'myTransformControls',
        'rayLine',
        'vrodosGizmoProxy',
        'vrodos_cel_outline',
        'bbox',
        'xline',
        'yline',
        'zline'
    ]);

    function orthoFitZoom(frustumSize, aspect, sceneSurfaceDimension) {
        const safeDimension = Math.max(Number(sceneSurfaceDimension) || 0, 10);
        const safeAspect = Math.max(Number(aspect) || 1, 0.1);
        const visibleWidth = safeDimension * 2.2;
        const computedZoom = (frustumSize * safeAspect) / visibleWidth;

        return VRODOS.utils.clampNumber(
            computedZoom,
            zoom.min,
            zoom.max,
            zoom.fallback
        );
    }

    function directorSafeVector(values, fallback) {
        const safeFallback = Array.isArray(fallback) ? fallback : [0, 0, 0];
        const source = Array.isArray(values) ? values : safeFallback;

        return [
            VRODOS.utils.clampNumber(source[0], -1000000, 1000000, safeFallback[0]),
            VRODOS.utils.clampNumber(source[1], -1000000, 1000000, safeFallback[1]),
            VRODOS.utils.clampNumber(source[2], -1000000, 1000000, safeFallback[2])
        ];
    }

    function directorIsInternalHelper(object) {
        if (!object) {
            return false;
        }

        if (['Camera3Dmodel', 'Camera3DmodelMesh', 'DirectorHitProxy'].includes(object.name)) {
            return true;
        }

        let current = object.parent || null;
        while (current) {
            if (current.name === 'Camera3Dmodel') {
                return true;
            }
            current = current.parent || null;
        }

        return false;
    }

    function directorGroundGuideObjectExcluded(object) {
        let current = object || null;

        while (current) {
            if (current.vrodos_internal_helper === true) {
                return true;
            }

            if (directorGroundGuideExcludedNames.has(current.name)) {
                return true;
            }

            if (current.category_name === 'lightHelper' || current.category_name === 'lightTargetSpot') {
                return true;
            }

            current = current.parent || null;
        }

        return false;
    }

    function directorGroundGuideObjectVisible(object) {
        let current = object || null;

        while (current) {
            if (current.visible === false) {
                return false;
            }

            current = current.parent || null;
        }

        return true;
    }

    function getPointerLockObject(pointerLockControls) {
        if (!pointerLockControls) {
            return null;
        }

        return pointerLockControls.object || null;
    }

    function hardwareProfile() {
        const nav = typeof navigator !== 'undefined' ? navigator : {};
        const cores = Number(nav.hardwareConcurrency || 4);
        const memory = Number(nav.deviceMemory || 4);

        return {
            cores: Number.isFinite(cores) ? cores : 4,
            memory: Number.isFinite(memory) ? memory : 4
        };
    }

    function resolveBaseUrl(pluginPath, localizedKey, fallbackRelative) {
        return VRODOS.utils.resolveBaseUrl(pluginPath, localizedKey, fallbackRelative);
    }

    function createFrameTimer() {
        if (THREE && typeof THREE.Timer === 'function') {
            const timer = new THREE.Timer();
            if (typeof timer.connect === 'function' && typeof document !== 'undefined') {
                timer.connect(document);
            }
            return timer;
        }

        return new THREE.Clock();
    }

    Object.assign(VRODOS.editorRender, {
        camera,
        sceneDefaults,
        zoom,
        directorGroundGuide,
        performanceDefaults,
        directorGroundGuideExcludedNames,
        orthoFitZoom,
        directorSafeVector,
        directorIsInternalHelper,
        directorGroundGuideObjectExcluded,
        directorGroundGuideObjectVisible,
        getPointerLockObject,
        hardwareProfile,
        resolveBaseUrl,
        createFrameTimer
    });

    VRODOS.utils.orthoFitZoom = orthoFitZoom;
    VRODOS.utils.getPointerLockObject = getPointerLockObject;
})();
