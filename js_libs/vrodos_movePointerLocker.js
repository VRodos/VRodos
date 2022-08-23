// For detecting collisions while moving
// Info at http://www.html5rocks.com/en/tutorials/pointerlock/intro/

var avatarControlsEnabled = false;

// Initialize
function initPointerLock() {

    var firstPersonBlocker = document.getElementById('firstPersonBlocker');
    var firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');

    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    avatarControlsEnabled = false;
    envir.avatarControls.enabled = false;

    if (!havePointerLock) {
        firstPersonBlockerBtn.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
    }
}


function firstPersonViewWithoutLock(){

    if (!avatarControlsEnabled) {

        console.log("STATE 1");

        // // ----------- First person view ----------------------
        avatarControlsEnabled = true;

        // Mouse controls Avatar viewing
        envir.avatarControls.enabled = false;

        // Mouse controls orbit
        envir.orbitControls.enabled = false;

        // The avatarControls position is the orbit controls target
        envir.avatarControls.getObject().position = envir.orbitControls.target;

        envir.avatarControls.getObject().children[0].position = envir.orbitControls.target;
        envir.avatarControls.getObject().children[1].position = envir.orbitControls.target;

        //transform_controls.visible = false;
        //
        // // Glow effect change camera
        envir.composer = [];
        envir.setComposerAndPasses(transform_controls);

        envir.isComposerOn = true;



        // // if in 3rd person view then show the cameraobject
        envir.getSteveFrustum().visible = envir.thirdPersonView && avatarControlsEnabled;



    }else{

        console.log("STATE 2");

        // ------------- ORBIT --------------------------
        avatarControlsEnabled = false;

        envir.avatarControls.enabled = false;

        envir.orbitControls.enabled = true;

        firstPersonBlocker.style.display = '-webkit-box';
        firstPersonBlocker.style.display = '-moz-box';
        firstPersonBlocker.style.display = 'box';


        envir.thirdPersonView = false;

        //envir.scene.getObjectByName("SteveOld").visible = false;
        envir.scene.getObjectByName("Camera3Dmodel").visible = true;


        envir.composer = [];
        envir.setComposerAndPasses(transform_controls);

        envir.isComposerOn = true;

        if(!envir.is2d)
            transform_controls.visible  = true;

        envir.getSteveFrustum().visible = true;

        // ToDo: Zoom
        envir.orbitControls.reset();

        findSceneDimensions();
        envir.updateCameraGivenSceneLimits();

    }
}
