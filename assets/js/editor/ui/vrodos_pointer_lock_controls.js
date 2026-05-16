'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.api = VRODOS.api || {};
VRODOS.ui = VRODOS.ui || {};

(function initVrodosPointerLockControls() {
    const ADD_MOVEMENT_EVENT = 'add_movement';
    const REMOVE_MOVEMENT_EVENT = 'remove_movement';
    const POINTER_LOCK_UNSUPPORTED_MESSAGE = 'Your browser doesn\'t seem to support Pointer Lock API';

    VRODOS.editor.avatarControlsEnabled = false;
    VRODOS.editor.originalDirectorPos = null;
    VRODOS.editor.originalDirectorRot = null;
    VRODOS.editor.originalRigPos = null;
    VRODOS.editor.originalRigRot = null;

    function getEnvir() {
        return VRODOS.editor ? VRODOS.editor.envir : null;
    }

    function getFirstPersonBlockerButton() {
        VRODOS.editor.firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');
        return VRODOS.editor.firstPersonBlockerBtn;
    }

    function getFirstPersonBlocker() {
        return document.getElementById('firstPersonBlocker');
    }

    function hasPointerLockSupport() {
        return 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    }

    function dispatchMovementEvent(type) {
        document.dispatchEvent(new CustomEvent(type));
    }

    function requestPointerRender(reason) {
        if (typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender(reason);
        }
    }

    function resetAvatarMovement() {
        if (typeof VRODOS.api.resetAvatarMovement === 'function') {
            VRODOS.api.resetAvatarMovement();
        }
    }

    function setControlsEnabled(envir, controlName, enabled) {
        const controls = envir && envir[controlName] ? envir[controlName] : null;
        if (controls) {
            controls.enabled = enabled;
        }
    }

    function getDirectorRig(envir) {
        return envir && typeof envir.getDirectorRig === 'function' ? envir.getDirectorRig() : null;
    }

    function getDirectorObject(envir) {
        return envir && typeof envir.getDirectorObject === 'function' ? envir.getDirectorObject() : null;
    }

    function saveDirectorPreviewTransform(envir) {
        const director = getDirectorObject(envir);
        const rig = getDirectorRig(envir);

        VRODOS.editor.originalDirectorPos = director ? director.position.clone() : null;
        VRODOS.editor.originalDirectorRot = director ? director.rotation.clone() : null;
        VRODOS.editor.originalRigPos = rig ? rig.position.clone() : null;
        VRODOS.editor.originalRigRot = rig ? rig.rotation.clone() : null;
    }

    function restoreDirectorPreviewTransform(envir) {
        if (!VRODOS.editor.originalDirectorPos || !VRODOS.editor.originalDirectorRot) {
            return;
        }

        resetAvatarMovement();

        if (typeof envir.applyDirectorTransform === 'function') {
            envir.applyDirectorTransform(
                [
                    VRODOS.editor.originalDirectorPos.x,
                    VRODOS.editor.originalDirectorPos.y,
                    VRODOS.editor.originalDirectorPos.z
                ],
                [
                    VRODOS.editor.originalDirectorRot.x,
                    VRODOS.editor.originalDirectorRot.y,
                    VRODOS.editor.originalDirectorRot.z
                ]
            );
        }

        const rig = getDirectorRig(envir);
        if (rig && VRODOS.editor.originalRigPos && VRODOS.editor.originalRigRot) {
            rig.position.copy(VRODOS.editor.originalRigPos);
            rig.rotation.copy(VRODOS.editor.originalRigRot);
            rig.updateMatrixWorld(true);
        }

        if (typeof VRODOS.editor.updatePositionsAndControls === 'function') {
            VRODOS.editor.updatePositionsAndControls();
        }
        if (typeof VRODOS.ui.setHierarchyViewer === 'function') {
            VRODOS.ui.setHierarchyViewer();
        }
    }

    function clearDirectorPreviewTransform() {
        VRODOS.editor.originalDirectorPos = null;
        VRODOS.editor.originalDirectorRot = null;
        VRODOS.editor.originalRigPos = null;
        VRODOS.editor.originalRigRot = null;
    }

    function syncFirstPersonRigToDirector(envir) {
        resetAvatarMovement();
        if (envir && typeof envir.syncFirstPersonRigToDirector === 'function') {
            envir.syncFirstPersonRigToDirector();
        }
    }

    function setDirectorRigVisible(envir, visible) {
        const rig = getDirectorRig(envir);
        if (rig) {
            rig.visible = visible;
        }
    }

    function setDirectorVisualVisible(envir, visible) {
        const directorVisual = envir && typeof envir.getDirectorVisualObject === 'function' ? envir.getDirectorVisualObject() : null;
        if (directorVisual) {
            directorVisual.visible = visible;
        }
    }

    function setTransformCamera(camera) {
        if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.setCamera === 'function' && camera) {
            VRODOS.editor.transforms.setCamera(camera);
        }
    }

    function setTransformControlsVisible(envir, visible) {
        if (!envir || envir.is2d || !VRODOS.editor.transforms || typeof VRODOS.editor.transforms.setVisible !== 'function') {
            return;
        }

        VRODOS.editor.transforms.setVisible(visible);
    }

    function showFirstPersonBlocker() {
        const firstPersonBlocker = getFirstPersonBlocker();
        if (!firstPersonBlocker) {
            return;
        }

        firstPersonBlocker.style.display = '-webkit-box';
        firstPersonBlocker.style.display = '-moz-box';
        firstPersonBlocker.style.display = 'box';
    }

    function fitOrbitCameraToScene(envir) {
        const orbitControls = envir && envir.orbitControls ? envir.orbitControls : null;
        if (orbitControls && typeof orbitControls.reset === 'function') {
            orbitControls.reset();
        }
        if (VRODOS.utils && typeof VRODOS.utils.findSceneDimensions === 'function') {
            VRODOS.utils.findSceneDimensions();
        }
        if (envir && typeof envir.fitCameraToSceneLimits === 'function') {
            envir.fitCameraToSceneLimits();
        }
    }

    function enterFirstPersonView(envir) {
        VRODOS.editor.avatarControlsEnabled = true;
        dispatchMovementEvent(ADD_MOVEMENT_EVENT);

        setControlsEnabled(envir, 'avatarControls', false);
        setControlsEnabled(envir, 'orbitControls', false);

        saveDirectorPreviewTransform(envir);
        syncFirstPersonRigToDirector(envir);

        setDirectorRigVisible(envir, Boolean(envir.thirdPersonView && VRODOS.editor.avatarControlsEnabled));
        setTransformCamera(envir.thirdPersonView ? envir.cameraThirdPerson : envir.cameraAvatar);
        requestPointerRender('first-person-enabled');
    }

    function exitFirstPersonView(envir) {
        VRODOS.editor.avatarControlsEnabled = false;
        dispatchMovementEvent(REMOVE_MOVEMENT_EVENT);

        setControlsEnabled(envir, 'avatarControls', false);
        setControlsEnabled(envir, 'orbitControls', true);

        showFirstPersonBlocker();
        envir.thirdPersonView = false;
        setDirectorVisualVisible(envir, true);
        setTransformCamera(envir.cameraOrbit);
        setTransformControlsVisible(envir, true);
        setDirectorRigVisible(envir, true);

        restoreDirectorPreviewTransform(envir);
        clearDirectorPreviewTransform();
        fitOrbitCameraToScene(envir);
        requestPointerRender('first-person-disabled');
    }

    VRODOS.api.initPointerLock = function() {
        const firstPersonBlockerBtn = getFirstPersonBlockerButton();
        const envir = getEnvir();

        VRODOS.editor.avatarControlsEnabled = false;
        setControlsEnabled(envir, 'avatarControls', false);

        if (!hasPointerLockSupport() && firstPersonBlockerBtn) {
            firstPersonBlockerBtn.innerHTML = POINTER_LOCK_UNSUPPORTED_MESSAGE;
        }
    };

    VRODOS.api.firstPersonViewWithoutLock = function() {
        const envir = getEnvir();
        if (!envir) {
            return;
        }

        if (!VRODOS.editor.avatarControlsEnabled) {
            enterFirstPersonView(envir);
            return;
        }

        exitFirstPersonView(envir);
    };
})();
