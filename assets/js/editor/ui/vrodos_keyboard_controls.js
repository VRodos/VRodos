'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.api = VRODOS.api || {};
VRODOS.ui = VRODOS.ui || {};

(function initVrodosKeyboardControls() {
    const MOVEMENT_SPEED = 0.5;
    const ROTATION_SPEED = 0.3;
    const movementState = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
        viewUp: false,
        viewDown: false,
        listenersBound: false
    };

    let prevTime = performance.now();
    const velocity = new THREE.Vector3();
    const torque = new THREE.Vector3();

    function isAvatarControlsEnabled() {
        return Boolean(VRODOS.editor && VRODOS.editor.avatarControlsEnabled);
    }

    function getAvatarCamera() {
        return VRODOS.editor && VRODOS.editor.envir ? VRODOS.editor.envir.cameraAvatar : null;
    }

    function requestKeyboardRender(reason) {
        if (VRODOS.editor && typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender(reason || 'keyboard-controls');
        }
    }

    function setMovementFlag(keyCode, value) {
        switch (keyCode) {
            case 87: // W
                movementState.forward = value;
                return true;
            case 83: // S
                movementState.backward = value;
                return true;
            case 65: // A
                movementState.left = value;
                return true;
            case 68: // D
                movementState.right = value;
                return true;
            case 81: // Q
                movementState.up = value;
                return true;
            case 69: // E
                movementState.down = value;
                return true;
            case 82: // R
                movementState.viewUp = value;
                return true;
            case 70: // F
                movementState.viewDown = value;
                return true;
            default:
                return false;
        }
    }

    function shouldDeleteSelectedObject(event) {
        const composedPath = typeof event.composedPath === 'function' ? event.composedPath() : [];
        const eventTarget = composedPath[0] || event.target;
        return eventTarget && eventTarget.tagName === 'BODY';
    }

    function keydownHandler(event) {
        switch (event.keyCode) {
            case 80: // P
                if (VRODOS.ui && typeof VRODOS.ui.pauseClickFun === 'function') {
                    VRODOS.ui.pauseClickFun();
                }
                break;
            case 107: // Numpad +
            case 187: // + / =
                if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.scaleSize === 'function') {
                    VRODOS.editor.transforms.scaleSize(1.1);
                }
                break;
            case 109: // Numpad -
            case 189: // - / _
                if (VRODOS.editor.transforms && typeof VRODOS.editor.transforms.scaleSize === 'function') {
                    VRODOS.editor.transforms.scaleSize(0.9);
                }
                break;
            case 46: // Delete
                if (shouldDeleteSelectedObject(event) && VRODOS.editor.transforms) {
                    const selectedObject = VRODOS.editor.transforms.getRealObject();
                    if (selectedObject && typeof VRODOS.ui.deleteFomScene === 'function') {
                        VRODOS.ui.deleteFomScene(selectedObject.uuid);
                    }
                }
                break;
            default:
                if (setMovementFlag(event.keyCode, true)) {
                    requestKeyboardRender('keyboard-movement-keydown');
                }
                break;
        }
    }

    function keyupHandler(event) {
        if (setMovementFlag(event.keyCode, false)) {
            requestKeyboardRender('keyboard-movement-keyup');
        }
    }

    function bindMovementListeners() {
        if (movementState.listenersBound) {
            return;
        }

        document.addEventListener('keydown', keydownHandler);
        document.addEventListener('keyup', keyupHandler);
        movementState.listenersBound = true;
    }

    function unbindMovementListeners() {
        if (!movementState.listenersBound) {
            return;
        }

        document.removeEventListener('keydown', keydownHandler);
        document.removeEventListener('keyup', keyupHandler);
        movementState.listenersBound = false;
    }

    document.addEventListener('wheel', (event) => {
        if (!isAvatarControlsEnabled() || !event.deltaY) {
            return;
        }

        const camera = getAvatarCamera();
        if (!camera) {
            return;
        }

        camera.fov += event.deltaY > 0 ? 1 : -1;
        camera.updateProjectionMatrix();
        requestKeyboardRender('avatar-fov-wheel');
    }, true);

    document.addEventListener('remove_movement', () => {
        unbindMovementListeners();
    });

    document.addEventListener('add_movement', () => {
        bindMovementListeners();
    });

    VRODOS.editor.firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');

    /* Update the Director rig while moving with key presses. */
    VRODOS.api.updatePointerLockControls = function() {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 2.0 * delta;
        velocity.y -= velocity.y * 2.0 * delta;
        velocity.z -= velocity.z * 2.0 * delta;

        torque.y *= 0.7;
        torque.x *= 0.7;

        if (movementState.forward) velocity.z -= MOVEMENT_SPEED * delta;
        if (movementState.backward) velocity.z += MOVEMENT_SPEED * delta;
        if (movementState.left) torque.y += ROTATION_SPEED * delta;
        if (movementState.right) torque.y -= ROTATION_SPEED * delta;
        if (movementState.up) velocity.y -= MOVEMENT_SPEED * delta;
        if (movementState.down) velocity.y += MOVEMENT_SPEED * delta;
        if (movementState.viewUp) torque.x -= ROTATION_SPEED * delta;
        if (movementState.viewDown) torque.x += ROTATION_SPEED * delta;

        const controls = VRODOS.editor.envir ? VRODOS.editor.envir.avatarControls : null;
        const pointerLockObject = VRODOS.utils.getPointerLockObject(controls);

        if (!pointerLockObject) {
            prevTime = time;
            return;
        }

        pointerLockObject.translateX(velocity.x);
        pointerLockObject.translateY(velocity.y);
        pointerLockObject.translateZ(velocity.z);

        pointerLockObject.rotation.y += torque.y;
        const avatarCamera = getAvatarCamera();
        if (avatarCamera) {
            avatarCamera.rotation.x += torque.x;
        }

        prevTime = time;
    };

    VRODOS.api.resetAvatarMovement = function() {
        velocity.set(0, 0, 0);
        torque.set(0, 0, 0);
        movementState.forward = false;
        movementState.backward = false;
        movementState.left = false;
        movementState.right = false;
        movementState.up = false;
        movementState.down = false;
        movementState.viewUp = false;
        movementState.viewDown = false;
    };
})();
