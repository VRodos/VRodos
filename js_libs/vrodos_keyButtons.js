var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveUp = false;
var moveDown = false;
var viewUp = false;
var viewDown = false;


var prevTime = performance.now();
var velocity = new THREE.Vector3();
var torgue = new THREE.Vector3();

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
document.addEventListener( 'wheel', function ( event ) {
    if (avatarControlsEnabled)
        if (event.deltaY)
            if (event.deltaY>0) {
                envir.cameraAvatar.fov += 1;
                envir.cameraAvatar.updateProjectionMatrix();
                //moveUp = true;
            }else {
                envir.cameraAvatar.fov -= 1;
                envir.cameraAvatar.updateProjectionMatrix();
            }
}, true);

// KEY DOWN
document.addEventListener( 'keydown',
    function ( event ) {

        var objManipulationSwitch = jQuery('input:radio[name=object-manipulation-switch]');

        switch ( event.keyCode ) {
            //---------------------------- TRS ---------------------------------------
            case 80: console.log("Pause"); pauseClickFun(); break; // r
            case 82: viewUp=true; break; // r
            case 70: viewDown=true; break; // f
            case 187: break;
            case 107: transform_controls.setSize(transform_controls.size + 0.1); break; // +,=,num+
            case 189: break;
            case 10: transform_controls.setSize(Math.max(transform_controls.size - 0.1, 0.1));break;// -,_,num-
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
                if(event.composedPath()[0].tagName === "BODY") {
                    deleterFomScene(transform_controls.object.name);
                }
                break;//  delete
        }
    });

// KEY UP
document.addEventListener( 'keyup',
    function ( event ) {

        //triggerAutoSave(); // too slow
        switch( event.keyCode ) {
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
            case 70: viewDown =false; break; // f
        }
    }, false
);


/* Update Steve when Steve walks by key presses */
function updatePointerLockControls(){

    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;

    // Reductors of velocity
    velocity.x -= velocity.x * 2.0 * delta;
    velocity.y -= velocity.y * 2.0 * delta;
    velocity.z -= velocity.z * 2.0 * delta;

    // Reductor of rotation along Y
    torgue.y = torgue.y * 0.7; // * delta;
    torgue.x = torgue.x * 0.7; // * delta;


    if (moveForward) velocity.z -= 0.3 * delta;
    if (moveBackward) velocity.z += 0.3 * delta;
    if (moveLeft) torgue.y += 0.3 * delta;
    if (moveRight) torgue.y -= 0.3 * delta;
    if ( moveUp ) velocity.y -= 0.3 * delta;
    if ( moveDown ) velocity.y += 0.3 * delta;
    if ( viewUp ) torgue.x -= 0.3 * delta;
    if ( viewDown ) torgue.x += 0.3 * delta;

    // Move avatar
    envir.avatarControls.getObject().translateX( velocity.x );
    envir.avatarControls.getObject().translateY( velocity.y );
    envir.avatarControls.getObject().translateZ( velocity.z );

    // if (!avatarControlsEnabled)
    envir.avatarControls.getObject().rotation.y += torgue.y;
    envir.cameraAvatar.rotation.x += torgue.x;

    // moveUp = false;
    // moveDown = false;

    prevTime = time;
}

// TODO: RAYCASTING SIGNIFICANTLY DETERIORATES RENDERING SPEED

//for (var vertexIndex = 0; vertexIndex < 1; vertexIndex++) //cubeRayShield.geometry.vertices.length
//{
//    var localVertex = cubeRayShield.geometry.vertices[vertexIndex].clone();
//    var globalVertex = localVertex.applyProjection(cubeRayShield.matrixWorld);
//
//
//    var steveWorldPosition = Steve.position.clone().applyProjection(Steve.matrixWorld);
//
//    var directionVector = globalVertex.sub( steveWorldPosition  );
//
//    var dirVecNorm = directionVector.clone().normalize();
//
//    // Visualize Raycaster with a line
//    //    var geometryL = new THREE.Geometry();
//    //    var geometryL = new THREE.Geometry();
//    //    geometryL.vertices.push(steveWorldPosition,
//    //        steveWorldPosition.clone().add(dirVecNorm)
//    //    );
//    //    console.log(Steve.position.clone(), Steve.position.clone().add(dirVecNorm));
//    //    envir.scene.add(new THREE.Line(geometryL, new THREE.LineBasicMaterial({color: 0x0000ff})));
//
//    var raycaster = new THREE.Raycaster( steveWorldPosition, dirVecNorm, 1, 10);
//    var actMesh = getActiveMeshes();
//    var collisionResults = raycaster.intersectObjects( actMesh, true );
//}


// Collider test: Make everything touched red
//for ( var i = 0; i < collisionResults.length; i++ )
//    collisionResults[ i ].object.material.color.set( 0xff0000 );


//        var isOnObject = collisionResults.length > 0; // && collisionResults[0].distance < directionVector.length();




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

//if ( envir.avatarControls.getObject().position.y < 1.80 ) {
//    velocity.y = 0;
//    envir.avatarControls.getObject().position.y = 0;
//    envir.avatarControls.getObject().children[1].position.y=0;
//    envir.avatarControls.getObject().children[0].position.y=0;
//
//    canJump = true;
//}
