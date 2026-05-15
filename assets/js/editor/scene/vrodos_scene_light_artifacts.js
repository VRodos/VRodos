'use strict';

window.VRODOS = window.VRODOS || { editor: {}, ui: {}, utils: {}, api: {}, data: {} };
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};

(function initVrodosSceneLightArtifacts() {
    function editorLightNumber(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function editorLightBoolean(value, fallback) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
            if (['0', 'false', 'no', 'off', ''].includes(normalized)) return false;
        }
        return fallback;
    }

    function applyEditorColor(color, hexColor) {
        if (color && typeof color.set === 'function') {
            color.set(hexColor);
        }
    }

    function applyEditorMaterialColor(material, hexColor) {
        if (Array.isArray(material)) {
            material.forEach((entry) => applyEditorMaterialColor(entry, hexColor));
            return;
        }

        if (material && material.color) {
            applyEditorColor(material.color, hexColor);
        }
    }

    function getEditorScene(scene) {
        return scene || (VRODOS.editor && VRODOS.editor.envir ? VRODOS.editor.envir.scene : null);
    }

    function removeEditorLightArtifact(object, scene, options) {
        if (!object) return false;

        const opts = options || {};
        const targetScene = getEditorScene(scene);
        const shouldDispose = opts.dispose !== false;
        const useRegistry = opts.useRegistry !== false && object.isSelectableMesh && object.vrodos_internal_helper !== true;

        if (shouldDispose) {
            if (typeof object.dispose === 'function') {
                object.dispose();
            } else if (typeof VRODOS.utils.disposeObject === 'function') {
                VRODOS.utils.disposeObject(object);
            }
        }

        if (
            useRegistry &&
            VRODOS.editor &&
            VRODOS.editor.sceneRegistry &&
            typeof VRODOS.editor.sceneRegistry.remove === 'function'
        ) {
            VRODOS.editor.sceneRegistry.remove(object, { reason: opts.reason || 'light-artifact-removed' });
        } else if (object.parent) {
            object.parent.remove(object);
        } else if (targetScene && typeof targetScene.remove === 'function') {
            targetScene.remove(object);
        }

        return true;
    }

    VRODOS.utils.getEditorLightObjectName = function(kind, lightName) {
        const prefixes = {
            helper: 'lightHelper_',
            target: 'lightTargetSpot_',
            shadow: 'lightShadowHelper_'
        };
        const prefix = prefixes[kind] || '';
        return `${prefix}${lightName || ''}`;
    };

    VRODOS.utils.getEditorLightObject = function(kind, lightName, scene) {
        const name = VRODOS.utils.getEditorLightObjectName(kind, lightName);
        if (!name) return null;

        if (kind === 'target' && VRODOS.editor && VRODOS.editor.sceneRegistry) {
            const registered = VRODOS.editor.sceneRegistry.get(name);
            if (registered) return registered;
        }

        const targetScene = getEditorScene(scene);
        return targetScene && typeof targetScene.getObjectByName === 'function'
            ? targetScene.getObjectByName(name)
            : null;
    };

    VRODOS.utils.configureEditorLightHelper = function(helper, light) {
        if (!helper || !light) return helper || null;

        helper.isLightHelper = true;
        helper.name = VRODOS.utils.getEditorLightObjectName('helper', light.name);
        helper.category_name = 'lightHelper';
        helper.parentLightName = light.name;
        helper.vrodos_internal_helper = true;
        return helper;
    };

    VRODOS.utils.createEditorLightHelper = function(light, options) {
        if (!light || typeof THREE === 'undefined') return null;

        const opts = options || {};
        const size = Number.isFinite(Number(opts.size)) ? Number(opts.size) : 1;
        const color = opts.color;
        let helper = null;

        if (light.type === 'PointLight') {
            helper = new THREE.PointLightHelper(light, size, color);
        } else if (light.type === 'SpotLight') {
            helper = new THREE.SpotLightHelper(light, color);
        } else if (light.type === 'DirectionalLight') {
            helper = new THREE.DirectionalLightHelper(light, size, color);
        }

        return VRODOS.utils.configureEditorLightHelper(helper, light);
    };

    VRODOS.utils.configureEditorLightShadowHelper = function(helper, light) {
        if (!helper || !light) return helper || null;

        helper.name = VRODOS.utils.getEditorLightObjectName('shadow', light.name);
        helper.category_name = 'lightShadowHelper';
        helper.parentLightName = light.name;
        helper.vrodos_internal_helper = true;
        return helper;
    };

    VRODOS.utils.createEditorLightShadowHelper = function(light) {
        if (!light || typeof THREE === 'undefined' || !light.shadow || !light.shadow.camera) {
            return null;
        }

        if (typeof VRODOS.utils.applyEditorLightShadowSettings === 'function') {
            VRODOS.utils.applyEditorLightShadowSettings(light);
        }

        return VRODOS.utils.configureEditorLightShadowHelper(
            new THREE.CameraHelper(light.shadow.camera),
            light
        );
    };

    VRODOS.utils.createEditorLightVisualSphere = function(name, options) {
        if (typeof THREE === 'undefined') return null;

        const opts = options || {};
        const radius = Math.max(0, editorLightNumber(opts.radius, 1));
        const widthSegments = Math.max(3, Math.round(editorLightNumber(opts.widthSegments, 16)));
        const heightSegments = Math.max(2, Math.round(editorLightNumber(opts.heightSegments, 8)));
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(radius, widthSegments, heightSegments),
            new THREE.MeshBasicMaterial({ color: opts.color })
        );

        sphere.isSelectableMesh = false;
        sphere.name = name || 'LightSphere';
        if (opts.rotation && typeof sphere.rotation.set === 'function') {
            sphere.rotation.set(
                editorLightNumber(opts.rotation[0], 0),
                editorLightNumber(opts.rotation[1], 0),
                editorLightNumber(opts.rotation[2], 0)
            );
        }
        return sphere;
    };

    VRODOS.utils.applyEditorObjectVisualColor = function(object, hexColor) {
        if (!object) return;

        applyEditorColor(object.color, hexColor);
        applyEditorMaterialColor(object.material, hexColor);
        if (object.children && object.children[0] && object.children[0].material) {
            applyEditorMaterialColor(object.children[0].material, hexColor);
        }
    };

    VRODOS.utils.applyEditorLightColor = function(light, hexColor, scene) {
        const candidate = light ? (light.realObject || light) : null;
        const targetLight = candidate && candidate.parentLight ? candidate.parentLight : candidate;
        if (!targetLight) return null;

        VRODOS.utils.applyEditorObjectVisualColor(targetLight, hexColor);

        const targetScene = getEditorScene(scene);
        VRODOS.utils.applyEditorObjectVisualColor(
            VRODOS.utils.getEditorLightObject('target', targetLight.name, targetScene),
            hexColor
        );

        const helper = VRODOS.utils.getEditorLightObject('helper', targetLight.name, targetScene);
        applyEditorColor(helper ? helper.color : null, hexColor);
        if (helper && helper.children) {
            helper.children.forEach((child) => {
                applyEditorMaterialColor(child.material, hexColor);
                applyEditorColor(child.color, hexColor);
            });
        }

        return targetLight;
    };

    VRODOS.utils.createEditorLightTarget = function(light, options) {
        if (!light || typeof THREE === 'undefined') return null;

        const opts = options || {};
        const target = new THREE.Object3D();
        const targetVisual = VRODOS.utils.createEditorLightVisualSphere('LightTargetSphere', {
            radius: editorLightNumber(opts.radius, 0.5),
            color: opts.color,
            widthSegments: opts.widthSegments,
            heightSegments: opts.heightSegments
        });
        const position = Array.isArray(opts.position) ? opts.position : [0, 0, 0];
        const helper = opts.helper || null;

        if (targetVisual) {
            target.add(targetVisual);
        }

        target.isSelectableMesh = true;
        target.name = VRODOS.utils.getEditorLightObjectName('target', light.name);
        target.category_name = 'lightTargetSpot';
        target.isLightTargetSpot = true;
        target.isLight = false;
        target.addedAt = opts.addedAt;
        target.position.set(
            editorLightNumber(position[0], 0),
            editorLightNumber(position[1], 0),
            editorLightNumber(position[2], 0)
        );
        target.parentLight = light;
        target.parentLightHelper = helper;
        VRODOS.utils.linkEditorLightTarget(light, target);
        return target;
    };

    VRODOS.utils.linkEditorLightTarget = function(light, targetObject) {
        if (!light || !targetObject || !['DirectionalLight', 'SpotLight'].includes(light.type)) {
            return false;
        }

        light.target = targetObject;
        targetObject.parentLight = light;
        light.target.updateMatrixWorld(true);
        light.updateMatrixWorld(true);
        return true;
    };

    VRODOS.utils.linkDirectionalLightTarget = function(light, targetObject) {
        if (!light || light.type !== 'DirectionalLight') {
            return false;
        }

        return VRODOS.utils.linkEditorLightTarget(light, targetObject);
    };

    VRODOS.utils.removeEditorLightArtifacts = function(light, scene, options) {
        if (!light) {
            return { helper: false, target: false, shadow: false };
        }

        const opts = options || {};
        const targetScene = getEditorScene(scene);
        const lightName = light.name || '';
        const result = {
            helper: false,
            target: false,
            shadow: false
        };

        const shadowHelper = VRODOS.utils.getEditorLightObject('shadow', lightName, targetScene);
        result.shadow = removeEditorLightArtifact(shadowHelper, targetScene, {
            dispose: opts.dispose !== false,
            reason: 'light-shadow-helper-removed',
            useRegistry: false
        });

        const targetSpot = VRODOS.utils.getEditorLightObject('target', lightName, targetScene);
        result.target = removeEditorLightArtifact(targetSpot, targetScene, {
            dispose: opts.dispose !== false,
            reason: 'light-target-removed',
            useRegistry: true
        });
        if (targetSpot) {
            targetSpot.parentLight = null;
            targetSpot.parentLightHelper = null;
        }

        if (result.target && opts.removeHierarchy !== false && VRODOS.ui && typeof VRODOS.ui.removeHierarchyEntriesForObject === 'function') {
            VRODOS.ui.removeHierarchyEntriesForObject('', VRODOS.utils.getEditorLightObjectName('target', lightName));
        }

        const lightHelper = VRODOS.utils.getEditorLightObject('helper', lightName, targetScene);
        result.helper = removeEditorLightArtifact(lightHelper, targetScene, {
            dispose: opts.dispose !== false,
            reason: 'light-helper-removed',
            useRegistry: false
        });

        return result;
    };

    VRODOS.utils.applyEditorLightShadowSettings = function(light) {
        if (!light || !light.shadow) return false;

        const shadow = light.shadow;
        const camera = shadow.camera || null;

        if (Object.prototype.hasOwnProperty.call(light, 'castingShadow')) {
            light.castShadow = editorLightBoolean(light.castingShadow, Boolean(light.castShadow));
        }
        if (Object.prototype.hasOwnProperty.call(light, 'shadowBias')) {
            shadow.bias = editorLightNumber(light.shadowBias, shadow.bias || 0);
        }
        if (Object.prototype.hasOwnProperty.call(light, 'shadowRadius')) {
            shadow.radius = editorLightNumber(light.shadowRadius, shadow.radius || 0);
        }
        if (shadow.mapSize && (
            Object.prototype.hasOwnProperty.call(light, 'shadowMapWidth') ||
            Object.prototype.hasOwnProperty.call(light, 'shadowMapHeight')
        )) {
            const mapWidth = Math.max(1, Math.round(editorLightNumber(light.shadowMapWidth, shadow.mapSize.x || 512)));
            const mapHeight = Math.max(1, Math.round(editorLightNumber(light.shadowMapHeight, shadow.mapSize.y || 512)));
            shadow.mapSize.set(mapWidth, mapHeight);
        }

        if (camera && camera.isOrthographicCamera) {
            camera.top = editorLightNumber(light.shadowCameraTop, camera.top);
            camera.bottom = editorLightNumber(light.shadowCameraBottom, camera.bottom);
            camera.left = editorLightNumber(light.shadowCameraLeft, camera.left);
            camera.right = editorLightNumber(light.shadowCameraRight, camera.right);
            if (typeof camera.updateProjectionMatrix === 'function') {
                camera.updateProjectionMatrix();
            }
        }

        light.updateMatrixWorld(true);
        if (light.target && typeof light.target.updateMatrixWorld === 'function') {
            light.target.updateMatrixWorld(true);
        }
        if (typeof shadow.updateMatrices === 'function') {
            shadow.updateMatrices(light);
        } else if (camera) {
            camera.updateMatrixWorld(true);
        }

        return true;
    };

    VRODOS.utils.updateEditorLightHelper = function(light, scene) {
        if (!light) return null;
        VRODOS.utils.applyEditorLightShadowSettings(light);

        const helper = VRODOS.utils.getEditorLightObject('helper', light.name, scene);
        if (helper && typeof helper.update === 'function') {
            VRODOS.utils.configureEditorLightHelper(helper, light);
            helper.update();
        }

        const shadowHelper = VRODOS.utils.getEditorLightObject('shadow', light.name, scene);
        if (shadowHelper && typeof shadowHelper.update === 'function') {
            VRODOS.utils.configureEditorLightShadowHelper(shadowHelper, light);
            shadowHelper.update();
        }

        return helper;
    };

    VRODOS.utils.syncEditorLightArtifacts = function(object, scene) {
        const target = object ? (object.realObject || object) : null;
        if (!target) return null;

        const light = target.parentLight || (target.isLight ? target : null);
        if (!light) return null;

        if (target.category_name === 'lightTargetSpot' && ['DirectionalLight', 'SpotLight'].includes(light.type)) {
            VRODOS.utils.linkEditorLightTarget(light, target);
        }

        target.updateMatrixWorld(true);
        const helper = VRODOS.utils.updateEditorLightHelper(light, scene);
        if (target.category_name === 'lightTargetSpot' && helper) {
            target.parentLightHelper = helper;
        }
        return helper;
    };
})();
