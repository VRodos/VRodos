let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let viewUp = false;
let viewDown = false;

const avatar_movement_speed_factor = 0.1;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const torgue = new THREE.Vector3();

document.addEventListener('wheel', (event) => {
    if (avatarControlsEnabled)
        {if (event.deltaY)
            {if (event.deltaY > 0) {
                envir.cameraAvatar.fov += 1;
                envir.cameraAvatar.updateProjectionMatrix();
                //moveUp = true;
            } else {
                envir.cameraAvatar.fov -= 1;
                envir.cameraAvatar.updateProjectionMatrix();
            }}}
}, true);

firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');

document.addEventListener('remove_movement',
    (event) => {
        //abortController.abort()
        document.removeEventListener('keydown', keydown_handler);
        document.removeEventListener('keyup', keyup_handler);

    }
);


document.addEventListener('add_movement',
    (event) => {
        document.addEventListener('keydown', keydown_handler);
        document.addEventListener('keyup', keyup_handler);
    }
);
const keydown_handler = (ev) => {
    switch (ev.keyCode) {
        //---------------------------- TRS ---------------------------------------
        case 80: pauseClickFun(); break; // r
        case 82: viewUp = true; break; // r
        case 70: viewDown = true; break; // f
        case 187: break;
        case 107: transform_controls.setSize(transform_controls.size + 0.1); break; // +,=,num+
        case 189: break;
        case 10: transform_controls.setSize(Math.max(transform_controls.size - 0.1, 0.1)); break;// -,_,num-
        //-------------------------------- PointerLock -----------------------
        case 38: break;// up arrow
        case 87: moveForward = true; break; // w
        case 37: break;// left
        case 65: moveLeft = true; break;// a
        case 40: break;// down
        case 83: moveBackward = true; break; // s
        case 39: break; // right
        case 68: moveRight = true; break; // d
        case 81: moveUp = true; break; // Q
        case 69: moveDown = true; break; // E
        case 32: break; // space
        case 96: break;// 0
        case 46:
            // If focus is on main screen but not at inputs
            if (ev.composedPath()[0].tagName === "BODY") {
                deleteFomScene(transform_controls.object.uuid);
            }
            break; //  delete
    }
};
const keyup_handler = (ev) => {
    switch (ev.keyCode) {
        case 38: // up
        case 87: moveForward = false; break; // w
        case 37: // left
        case 65: moveLeft = false; break; // a
        case 40: // down
        case 83: moveBackward = false; break; // s
        case 39: // right
        case 68: moveRight = false; break; // d
        case 69: moveDown = false; break;  // e
        case 81: moveUp = false; break; // e
        case 82: viewUp = false; break; // r
        case 70: viewDown = false; break; // f
    }

};


/* Update the Director rig while moving with key presses */
const updatePointerLockControls = function(){

    const time = performance.now();
    const delta = ( time - prevTime ) / 1000;

    // Reductors of velocity
    velocity.x -= velocity.x * 2.0 * delta;
    velocity.y -= velocity.y * 2.0 * delta;
    velocity.z -= velocity.z * 2.0 * delta;

    // Reductor of rotation along Y
    torgue.y = torgue.y * 0.7; // * delta;
    torgue.x = torgue.x * 0.7; // * delta;

    if (moveForward) velocity.z -= avatar_movement_speed_factor * delta;
    if (moveBackward) velocity.z += avatar_movement_speed_factor * delta;
    if (moveLeft) torgue.y += avatar_movement_speed_factor * delta;
    if (moveRight) torgue.y -= avatar_movement_speed_factor * delta;
    if ( moveUp ) velocity.y -= avatar_movement_speed_factor * delta;
    if ( moveDown ) velocity.y += avatar_movement_speed_factor * delta;
    if ( viewUp ) torgue.x -= avatar_movement_speed_factor * delta;
    if ( viewDown ) torgue.x += avatar_movement_speed_factor * delta;

    // Move avatar
    const pointerLockObject = (typeof vrodosGetPointerLockObject === 'function') ?
        vrodosGetPointerLockObject(envir.avatarControls) :
        (envir.avatarControls ? envir.avatarControls.object : null);

    if (!pointerLockObject) {
        prevTime = time;
        return;
    }

    pointerLockObject.translateX( velocity.x );
    pointerLockObject.translateY( velocity.y );
    pointerLockObject.translateZ( velocity.z );

    // if (!avatarControlsEnabled)
    pointerLockObject.rotation.y += torgue.y;
    envir.cameraAvatar.rotation.x += torgue.x;

    // moveUp = false;
    // moveDown = false;

    prevTime = time;
}

// TODO: RAYCASTING SIGNIFICANTLY DETERIORATES RENDERING SPEED

function vrodosResetAvatarMovement() {
    velocity.set(0, 0, 0);
    torgue.set(0, 0, 0);
    moveForward = moveBackward = moveLeft = moveRight = moveUp = moveDown = viewUp = viewDown = false;
}
