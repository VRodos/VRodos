let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let viewUp = false;
let viewDown = false;

let avatar_movement_speed_factor = 0.1;

let prevTime = performance.now();
let velocity = new THREE.Vector3();
let torgue = new THREE.Vector3();

// MOUSE DOWN
// document.addEventListener( 'mousedown', function ( event ) {
//     if (avatarControlsEnabled) {
//         switch (event.button) {
//             case 0: moveForward = true; break;
//             case 2: moveBackward = true; break;
//         }
//     }
// }, true);
//
// // MOUSE UP
// document.addEventListener( 'mouseup', function ( event ) {
//     if (avatarControlsEnabled) {
//         switch (event.button) {
//             case 0: moveForward = false; break;
//             case 2: moveBackward = false; break;
//         }
//     }
// }, true);
//
// WHEEL

document.addEventListener('wheel', (event) => {
    if (avatarControlsEnabled)
        if (event.deltaY)
            if (event.deltaY > 0) {
                envir.cameraAvatar.fov += 1;
                envir.cameraAvatar.updateProjectionMatrix();
                //moveUp = true;
            } else {
                envir.cameraAvatar.fov -= 1;
                envir.cameraAvatar.updateProjectionMatrix();
            }
}, true);

firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');

if (firstPersonBlockerBtn) {
};

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
let keydown_handler = (ev) => {
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
let keyup_handler = (ev) => {
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

    let time = performance.now();
    let delta = ( time - prevTime ) / 1000;

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
    let pointerLockObject = (typeof vrodosGetPointerLockObject === 'function') ?
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

//for (let vertexIndex = 0; vertexIndex < 1; vertexIndex++) //cubeRayShield.geometry.vertices.length
//{
//    let localVertex = cubeRayShield.geometry.vertices[vertexIndex].clone();
//    let globalVertex = localVertex.applyProjection(cubeRayShield.matrixWorld);
//
//
//    let directorWorldPosition = director.position.clone().applyProjection(director.matrixWorld);
//
//    let directionVector = globalVertex.sub(directorWorldPosition);
//
//    let dirVecNorm = directionVector.clone().normalize();
//
//    // Visualize Raycaster with a line
//    //    let geometryL = new THREE.Geometry();
//    //    let geometryL = new THREE.Geometry();
//    //    geometryL.vertices.push(directorWorldPosition,
//    //        directorWorldPosition.clone().add(dirVecNorm)
//    //    );
//    //    console.log(director.position.clone(), director.position.clone().add(dirVecNorm));
//    //    envir.scene.add(new THREE.Line(geometryL, new THREE.LineBasicMaterial({color: 0x0000ff})));
//
//    let raycaster = new THREE.Raycaster(directorWorldPosition, dirVecNorm, 1, 10);
//    let actMesh = getActiveMeshes();
//    let collisionResults = raycaster.intersectObjects( actMesh, true );
//}


// Collider test: Make everything touched red
//for ( let i = 0; i < collisionResults.length; i++ )
//    collisionResults[ i ].object.material.color.set( 0xff0000 );


//        let isOnObject = collisionResults.length > 0; // && collisionResults[0].distance < directionVector.length();




// When the avatar moves then move the camera to follow him

//if (!avatarControlsEnabled) {
//    //envir.orbitControls.object.translateX(velocity.x * delta);
//    //envir.orbitControls.object.translateY(velocity.y * delta);
//    //envir.orbitControls.object.translateZ(velocity.z * delta);
//
//
//}
//
//


// Update the camera Y not to be so low
//if ( moveForward )
//    envir.orbitControls.object.translateY( - velocity.y * delta );

//if ( envir.avatarControls.object.position.y < 1.80 ) {
//    velocity.y = 0;
//    envir.avatarControls.object.position.y = 0;
//    envir.avatarControls.object.children[1].position.y=0;
//    envir.avatarControls.object.children[0].position.y=0;
//
//    canJump = true;
//}
