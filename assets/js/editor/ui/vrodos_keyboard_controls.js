'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.api = VRODOS.api || {};
VRODOS.ui = VRODOS.ui || {};

(function initVrodosKeyboardControls() {
    const MOVEMENT_SPEED = 2;
    const movementState = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
        listenersBound: false
    };

    let prevTime = performance.now();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const movement = new THREE.Vector3();
    const upAxis = new THREE.Vector3(0, 1, 0);

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
                movementState.down = value;
                return true;
            case 69: // E
                movementState.up = value;
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
        const target = event.target;
        if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
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
                if (isAvatarControlsEnabled() && setMovementFlag(event.keyCode, true)) {
                    event.preventDefault();
                    requestKeyboardRender('keyboard-movement-keydown');
                }
                break;
        }
    }

    function orbitPanKeydownHandler(event) {
        const directions = {
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            ArrowUp: [0, 1],
            ArrowDown: [0, -1]
        };
        const direction = directions[event.key];
        const target = event.target;
        const envir = VRODOS.editor && VRODOS.editor.envir;
        if (!direction || !envir || isAvatarControlsEnabled() || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
            (target && target.closest && target.closest('input, textarea, select, button, a, [contenteditable], [role="tab"], [role="dialog"]'))) {
            return;
        }
        if (typeof envir.panOrbitOnGround === 'function' && envir.orbitControls && envir.orbitControls.enabled) {
            event.preventDefault();
            envir.panOrbitOnGround(direction[0], direction[1]);
        }
    }

    function keyupHandler(event) {
        if (setMovementFlag(event.keyCode, false)) {
            if (isAvatarControlsEnabled()) event.preventDefault();
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

    document.addEventListener('remove_movement', () => {
        unbindMovementListeners();
    });

    document.addEventListener('add_movement', () => {
        bindMovementListeners();
    });
    document.addEventListener('keydown', orbitPanKeydownHandler);
    window.addEventListener('blur', () => VRODOS.api.resetAvatarMovement());

    VRODOS.editor.firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');

    /* Preview desktop movement at the published walking speed. */
    VRODOS.api.updatePointerLockControls = function() {
        const time = performance.now();
        const delta = Math.max(0, Math.min((time - prevTime) / 1000, 0.25));
        prevTime = time;
        const camera = getAvatarCamera();
        if (!camera || !delta) return;

        camera.getWorldDirection(forward);
        forward.y = 0;
        if (forward.lengthSq() < 0.000001) forward.set(0, 0, -1);
        forward.normalize();
        right.crossVectors(forward, upAxis).normalize();
        movement.set(0, 0, 0);
        if (movementState.forward) movement.add(forward);
        if (movementState.backward) movement.sub(forward);
        if (movementState.left) movement.sub(right);
        if (movementState.right) movement.add(right);
        if (movementState.up) movement.y += 1;
        if (movementState.down) movement.y -= 1;
        if (movement.lengthSq() > 0) camera.position.addScaledVector(movement.normalize(), MOVEMENT_SPEED * delta);
    };

    VRODOS.api.resetAvatarMovement = function() {
        prevTime = performance.now();
        movementState.forward = false;
        movementState.backward = false;
        movementState.left = false;
        movementState.right = false;
        movementState.up = false;
        movementState.down = false;
    };
})();
