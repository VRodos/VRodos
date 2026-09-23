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
            VRODOS.editor.updatePositionsAndControls({ force: true });
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

    function setTransformCamera(camera) {
        if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.setCamera === 'function' && camera) {
            VRODOS.editor.transforms.setCamera(camera);
        }
    }

    function capturePreviewVisibility(envir) {
        const rig = getDirectorRig(envir);
        const visual = getDirectorObject(envir) && envir.getDirectorVisualObject ? envir.getDirectorVisualObject() : null;
        const controls = VRODOS.editor.transform_controls;
        VRODOS.editor.firstPersonPreviewVisibility = {
            grid: envir.gridHelper ? envir.gridHelper.visible : null,
            axes: envir.axesHelper ? envir.axesHelper.visible : null,
            rig: rig ? rig.visible : null,
            visual: visual ? visual.visible : null,
            transforms: controls ? controls.visible : null
        };
        if (envir.gridHelper) envir.gridHelper.visible = false;
        if (envir.axesHelper) envir.axesHelper.visible = false;
        if (visual) visual.visible = false;
        if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.setVisible === 'function') {
            VRODOS.editor.transforms.setVisible(false);
        }
    }

    function restorePreviewVisibility(envir) {
        const saved = VRODOS.editor.firstPersonPreviewVisibility;
        if (!saved) return;
        if (envir.gridHelper && saved.grid !== null) envir.gridHelper.visible = saved.grid;
        if (envir.axesHelper && saved.axes !== null) envir.axesHelper.visible = saved.axes;
        const rig = getDirectorRig(envir);
        if (rig && saved.rig !== null) rig.visible = saved.rig;
        const visual = envir.getDirectorVisualObject ? envir.getDirectorVisualObject() : null;
        if (visual && saved.visual !== null) visual.visible = saved.visual;
        if (saved.transforms !== null && VRODOS.editor.transforms && typeof VRODOS.editor.transforms.setVisible === 'function') {
            VRODOS.editor.transforms.setVisible(saved.transforms);
        }
        VRODOS.editor.firstPersonPreviewVisibility = null;
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

    function enterFirstPersonView(envir) {
        VRODOS.editor.avatarControlsEnabled = true;
        dispatchMovementEvent(ADD_MOVEMENT_EVENT);

        setControlsEnabled(envir, 'avatarControls', false);
        setControlsEnabled(envir, 'orbitControls', false);

        saveDirectorPreviewTransform(envir);
        syncFirstPersonRigToDirector(envir);
		capturePreviewVisibility(envir);
		if (envir.cameraAvatar) {
			envir.cameraAvatar.fov = 60;
			envir.cameraAvatar.near = 0.1;
			envir.cameraAvatar.far = 7000;
			envir.cameraAvatar.updateProjectionMatrix();
		}

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
        setTransformCamera(envir.cameraOrbit);

        restoreDirectorPreviewTransform(envir);
        restorePreviewVisibility(envir);
        clearDirectorPreviewTransform();
        if (envir.orbitControls) envir.orbitControls.update();
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

    function bindFirstPersonMouseLook() {
        const envir = getEnvir();
        const canvas = envir && envir.renderer ? envir.renderer.domElement : null;
        if (!canvas || canvas.vrodosFirstPersonLookBound) return;
        canvas.vrodosFirstPersonLookBound = true;
        let dragging = false;
        let lastX = 0;
        let lastY = 0;
        canvas.addEventListener('mousedown', (event) => {
            if (!VRODOS.editor.avatarControlsEnabled || event.button !== 0) return;
            dragging = true;
            lastX = event.clientX;
            lastY = event.clientY;
        });
        document.addEventListener('mousemove', (event) => {
            if (!dragging || !VRODOS.editor.avatarControlsEnabled || !envir.cameraAvatar) return;
            const deltaX = event.clientX - lastX;
            const deltaY = event.clientY - lastY;
            lastX = event.clientX;
            lastY = event.clientY;
            envir.cameraAvatar.rotation.y -= deltaX * 0.002;
            envir.cameraAvatar.rotation.x = THREE.MathUtils.clamp(
                envir.cameraAvatar.rotation.x - deltaY * 0.002,
                -Math.PI / 2 + 0.01,
                Math.PI / 2 - 0.01
            );
            requestPointerRender('first-person-look');
        });
        document.addEventListener('mouseup', () => { dragging = false; });
        window.addEventListener('blur', () => { dragging = false; });
    }

    VRODOS.api.firstPersonViewWithoutLock = function() {
        const envir = getEnvir();
        if (!envir) {
            return;
        }

        if (!VRODOS.editor.avatarControlsEnabled) {
            bindFirstPersonMouseLook();
            enterFirstPersonView(envir);
            return;
        }

        exitFirstPersonView(envir);
    };
})();
