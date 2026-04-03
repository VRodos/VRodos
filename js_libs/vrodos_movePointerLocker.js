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

        // // ----------- First person view ----------------------
        avatarControlsEnabled = true;
        let event_add_mv = new CustomEvent("add_movement");
        document.dispatchEvent(event_add_mv);

        // Mouse controls Avatar viewing
        envir.avatarControls.enabled = false;

        // Mouse controls orbit
        envir.orbitControls.enabled = false;

        // Keep the saved Director transform as the source of truth when entering first-person preview.
        envir.moveDirectorToOrbitTarget();

        //transform_controls.visible = false;
        //
        // // Glow effect change camera
        envir.composer = [];
        envir.setComposerAndPasses(transform_controls);

        envir.isComposerOn = true;



        // // if in 3rd person view then show the cameraobject
        envir.getDirectorRig().visible = envir.thirdPersonView && avatarControlsEnabled;



    }else{

        // ------------- ORBIT --------------------------
        avatarControlsEnabled = false;
        var event_rm_mv = new CustomEvent("remove_movement");
        document.dispatchEvent(event_rm_mv);

        envir.avatarControls.enabled = false;

        envir.orbitControls.enabled = true;

        firstPersonBlocker.style.display = '-webkit-box';
        firstPersonBlocker.style.display = '-moz-box';
        firstPersonBlocker.style.display = 'box';


        envir.thirdPersonView = false;

        if (envir.getDirectorVisualObject()) envir.getDirectorVisualObject().visible = true;


        envir.composer = [];
        envir.setComposerAndPasses(transform_controls);

        envir.isComposerOn = true;

        if(!envir.is2d)
            transform_controls.visible  = true;

        envir.getDirectorRig().visible = true;

        // ToDo: Zoom
        envir.orbitControls.reset();

        findSceneDimensions();
        envir.updateCameraGivenSceneLimits();

    }
}
