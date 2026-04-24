
"use strict";

const VRODOS_BORDER_HELPER_NAMES = Object.freeze([
    'bbox',
    'x_dim_line'
]);

const VRODOS_SCENE_BOUNDS_EXCLUDED_NAMES = Object.freeze([
    'myTransformControls',
    'myGridHelper',
    'myAxisHelper',
    'orbitCamera',
    'avatarCamera'
]);

const VRODOS_LIGHT_BOUND_TYPES = Object.freeze([
    'PointLight',
    'PointLightHelper',
    'SpotLight'
]);

function removeBoundsHelpers(groupObj) {
    if (!groupObj) {
        return;
    }

    VRODOS_BORDER_HELPER_NAMES.forEach((helperName) => {
        const helper = groupObj.getObjectByName(helperName);
        if (helper) {
            groupObj.remove(helper);
        }
    });
}

function createBoundsTarget(groupObj) {
    if (!groupObj || VRODOS_LIGHT_BOUND_TYPES.includes(groupObj.type)) {
        const geometryBox = new THREE.BoxGeometry(1, 1, 1);
        const materialBox = new THREE.MeshBasicMaterial({color: 0x00ff00});
        return new THREE.Mesh(geometryBox, materialBox);
    }

    return groupObj;
}

function createBoxHelper(groupObj) {
    const boundsTarget = createBoundsTarget(groupObj);
    const box = new THREE.BoxHelper(boundsTarget, 0xff00ff);
    box.geometry.computeBoundingBox();
    box.name = 'bbox';

    return box;
}

function getObjectBoundingBox(groupObj) {
    removeBoundsHelpers(groupObj);

    const box = createBoxHelper(groupObj);
    if (!box.geometry.boundingBox) {
        return null;
    }

    return box.geometry.boundingBox;
}

function isSceneBoundsCandidate(sceneChild) {
    if (!sceneChild || VRODOS_SCENE_BOUNDS_EXCLUDED_NAMES.includes(sceneChild.name)) {
        return false;
    }

    if (sceneChild.category_name === 'lightHelper' || sceneChild.category_name === 'lightTargetSpot') {
        return false;
    }

    if (typeof sceneChild.name === 'string' && sceneChild.name.startsWith('lightShadowHelper_')) {
        return false;
    }

    return sceneChild.vrodos_internal_helper !== true;
}

// Find dimensions of the selected object
function findDimensions(groupObj) {
    const fallbackDimensions = [1, 1, 1];

    try {
        const boundingBox = getObjectBoundingBox(groupObj);
        if (!boundingBox) {
            return fallbackDimensions;
        }

        const finalVec = new THREE.Vector3().subVectors(boundingBox.min, boundingBox.max);
        const dimensions = [
            Math.abs(finalVec.x),
            Math.abs(finalVec.y),
            Math.abs(finalVec.z)
        ];

        if (dimensions.some((dimension) => !Number.isFinite(dimension))) {
            return fallbackDimensions;
        }

        return dimensions;
    } catch (e) {
        console.warn('findDimensions: could not compute bounds for', groupObj ? groupObj.name : groupObj, e.message);
        return fallbackDimensions;
    }
}

// Find dimensions of the selected object
function findBorders(groupObj) {
    const boundingBox = getObjectBoundingBox(groupObj);

    if (!boundingBox) {
        return [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
    }

    return [boundingBox.min, boundingBox.max];
}


function getEmptyBounds() {
    return [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
}


// Find Limits (world coordinates) of the selected object
function findObjectLimits(groupObj) {
    try {
        const boundingBox = getObjectBoundingBox(groupObj);
        if (!boundingBox) {
            return getEmptyBounds();
        }

        return [boundingBox.min, boundingBox.max];
    } catch (e) {
        console.error('findObjectLimits: could not compute bounds for', groupObj ? groupObj.name : groupObj, e.message);
        return getEmptyBounds();
    }
}


// Reset
function findSceneDimensions() {

    if (typeof envir === 'undefined' || !envir || !envir.scene) {
        return;
    }

    const bounds = {
        xMax: 0,
        xMin: 0,
        yMax: 0,
        yMin: 0,
        zMax: 0,
        zMin: 0,
        hasSceneContent: false
    };

    envir.scene.children
        .filter(isSceneBoundsCandidate)
        .forEach((sceneChild) => {
            const objectBounds = findObjectLimits(sceneChild);
            bounds.hasSceneContent = true;

            bounds.xMin = Math.min(objectBounds[0].x, bounds.xMin);
            bounds.xMax = Math.max(objectBounds[1].x, bounds.xMax);

            bounds.yMin = Math.min(objectBounds[0].y, bounds.yMin);
            bounds.yMax = Math.max(objectBounds[1].y, bounds.yMax);

            bounds.zMin = Math.min(objectBounds[0].z, bounds.zMin);
            bounds.zMax = Math.max(objectBounds[1].z, bounds.zMax);
        });

    envir.SCENE_DIMENSION_SURFACE = Math.max(bounds.xMax - bounds.xMin, bounds.zMax - bounds.zMin);
    envir.SCENE_CENTER_X = bounds.hasSceneContent ? (bounds.xMin + bounds.xMax) / 2 : 0;
    envir.SCENE_CENTER_Y = bounds.hasSceneContent ? (bounds.yMin + bounds.yMax) / 2 : 0;
    envir.SCENE_CENTER_Z = bounds.hasSceneContent ? (bounds.zMin + bounds.zMax) / 2 : 0;
}
