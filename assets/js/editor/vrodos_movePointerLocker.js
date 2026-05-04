// For detecting collisions while moving
// Info at http://www.html5rocks.com/en/tutorials/pointerlock/intro/

VRODOS.editor.avatarControlsEnabled = false;
VRODOS.editor.originalDirectorPos = null;
VRODOS.editor.originalDirectorRot = null;
VRODOS.editor.originalRigPos = null;
VRODOS.editor.originalRigRot = null;




// Initialize
VRODOS.api.initPointerLock = function() {

    const firstPersonBlocker = document.getElementById('firstPersonBlocker');
    VRODOS.editor.firstPersonBlockerBtn = document.getElementById('firstPersonBlockerBtn');

    const havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    VRODOS.editor.avatarControlsEnabled = false;
    VRODOS.editor.envir.avatarControls.enabled = false;

    if (!havePointerLock) {
        VRODOS.editor.firstPersonBlockerBtn.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
    }
};


VRODOS.api.firstPersonViewWithoutLock = function(){

    if (!VRODOS.editor.avatarControlsEnabled) {

        // // ----------- First person view ----------------------
        VRODOS.editor.avatarControlsEnabled = true;
        const event_add_mv = new CustomEvent("add_movement");
        document.dispatchEvent(event_add_mv);

        // Mouse controls Avatar viewing
        VRODOS.editor.envir.avatarControls.enabled = false;

        // Mouse controls orbit
        VRODOS.editor.envir.orbitControls.enabled = false;

        // Save current director and rig transform before entering FP mode
        const director = VRODOS.editor.envir.getDirectorObject();
        const rig = VRODOS.editor.envir.getDirectorRig();
        if (director) {
            VRODOS.editor.originalDirectorPos = director.position.clone();
            VRODOS.editor.originalDirectorRot = director.rotation.clone();
        }
        if (rig) {
            VRODOS.editor.originalRigPos = rig.position.clone();
            VRODOS.editor.originalRigRot = rig.rotation.clone();
        }


        // Keep the saved Director transform as the source of truth when entering first-person preview.
        VRODOS.editor.envir.moveDirectorToOrbitTarget();


        //VRODOS.editor.transform_controls.visible = false;
        //
        // // Glow effect change camera
        VRODOS.editor.envir.composer = [];
        VRODOS.editor.envir.setComposerAndPasses(VRODOS.editor.transform_controls);

        VRODOS.editor.envir.isComposerOn = true;



        // // if in 3rd person view then show the cameraobject
        VRODOS.editor.envir.getDirectorRig().visible = VRODOS.editor.envir.thirdPersonView && VRODOS.editor.avatarControlsEnabled;



    }else{

        // ------------- ORBIT --------------------------
        VRODOS.editor.avatarControlsEnabled = false;
        const event_rm_mv = new CustomEvent("remove_movement");
        document.dispatchEvent(event_rm_mv);

        VRODOS.editor.envir.avatarControls.enabled = false;

        VRODOS.editor.envir.orbitControls.enabled = true;

        const firstPersonBlocker = document.getElementById('firstPersonBlocker');
        firstPersonBlocker.style.display = '-webkit-box';
        firstPersonBlocker.style.display = '-moz-box';
        firstPersonBlocker.style.display = 'box';


        VRODOS.editor.envir.thirdPersonView = false;

        if (VRODOS.editor.envir.getDirectorVisualObject()) VRODOS.editor.envir.getDirectorVisualObject().visible = true;


        VRODOS.editor.envir.composer = [];
        VRODOS.editor.envir.setComposerAndPasses(VRODOS.editor.transform_controls);

        VRODOS.editor.envir.isComposerOn = true;

        if(!VRODOS.editor.envir.is2d)
            {VRODOS.editor.transform_controls.visible  = true;}

        VRODOS.editor.envir.getDirectorRig().visible = true;

        // Restore Director transform to what it was before entering FP mode
        if (VRODOS.editor.originalDirectorPos && VRODOS.editor.originalDirectorRot) {

            // Reset movement state to stop any ongoing momentum or stuck keys
            if (typeof VRODOS.api.resetAvatarMovement === 'function') {
                VRODOS.api.resetAvatarMovement();
            }

            VRODOS.editor.envir.applyDirectorTransform(
                [VRODOS.editor.originalDirectorPos.x, VRODOS.editor.originalDirectorPos.y, VRODOS.editor.originalDirectorPos.z],
                [VRODOS.editor.originalDirectorRot.x, VRODOS.editor.originalDirectorRot.y, VRODOS.editor.originalDirectorRot.z]
            );

            // Restore Rig transform (ensures world position is correct)
            const rig = VRODOS.editor.envir.getDirectorRig();
            if (rig && VRODOS.editor.originalRigPos && VRODOS.editor.originalRigRot) {
                rig.position.copy(VRODOS.editor.originalRigPos);
                rig.rotation.copy(VRODOS.editor.originalRigRot);
                rig.updateMatrixWorld(true);
            }


            // Refresh GUI and Hierarchy
            if (typeof VRODOS.editor.updatePositionsAndControls === 'function') {
                VRODOS.editor.updatePositionsAndControls();
            }
            if (typeof VRODOS.ui.setHierarchyViewer === 'function') {
                VRODOS.ui.setHierarchyViewer();
            }

            VRODOS.editor.originalDirectorPos = null;
            VRODOS.editor.originalDirectorRot = null;
            VRODOS.editor.originalRigPos = null;
            VRODOS.editor.originalRigRot = null;
        }



        // ToDo: Zoom
        VRODOS.editor.envir.orbitControls.reset();

        VRODOS.utils.findSceneDimensions();
        VRODOS.editor.envir.fitCameraToSceneLimits();

    }
};


