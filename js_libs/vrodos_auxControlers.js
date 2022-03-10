/**
 * Dat-gui controls variables initialize
 *
 * @type {gui_controls_funs}
 */
var gui_controls_funs = new function() {
    this.dg_tx = 0;
    this.dg_ty = 0;
    this.dg_tz = 0;
    this.dg_rx = 0;
    this.dg_ry = 0;
    this.dg_rz = 0;
    this.dg_dim_x = 0;
    this.dg_dim_y = 0;
    this.dg_dim_z = 0;
};

var dg_dim_x_prev;
var dg_dim_y_prev;
var dg_dim_z_prev;

// GUI controls
/*var gui = new dat.GUI( {autoPlace: false} );*/

var controlInterface = [];
controlInterface.translate = new dat.GUI( { autoPlace: false });
controlInterface.translate.domElement.id = 'translatePanelGui';
controlInterface.translate.domElement.style='width:100%';

controlInterface.rotate = new dat.GUI( { autoPlace: false });
controlInterface.rotate.domElement.id = 'rotatePanelGui';
controlInterface.rotate.domElement.style='width:100%';

controlInterface.scale = new dat.GUI( { autoPlace: false });
controlInterface.scale.domElement.id = 'scalePanelGui';
controlInterface.scale.domElement.style='width:100%';


var dg_controller_tx = controlInterface.translate.add( gui_controls_funs, 'dg_tx').step(0.001).name('<span style="color:red">Move x</span>');
var dg_controller_ty = controlInterface.translate.add( gui_controls_funs, 'dg_ty').step(0.001).name('<span style="color:green">Move y</span>');
var dg_controller_tz = controlInterface.translate.add( gui_controls_funs, 'dg_tz').step(0.001).name('<span style="color:blue">Move z</span>');

var dg_controller_rx = controlInterface.rotate.add( gui_controls_funs, 'dg_rx', -179, 180, 0.001).name('<span style="color:red">Rotate x</span>');
var dg_controller_ry = controlInterface.rotate.add( gui_controls_funs, 'dg_ry', -179, 180, 0.001).name('<span style="color:green">Rotate y</span>');
var dg_controller_rz = controlInterface.rotate.add( gui_controls_funs, 'dg_rz', -179, 180, 0.001).name('<span style="color:blue">Rotate z</span>');

var dg_controller_dim_x = controlInterface.scale.add( gui_controls_funs, 'dg_dim_x').min(0.01).max(100).step(0.01).name('<span style="color:red">x length</span>');
var dg_controller_dim_y = controlInterface.scale.add( gui_controls_funs, 'dg_dim_y').min(0.01).max(100).step(0.01).name('<span style="color:green">y length</span>');
var dg_controller_dim_z = controlInterface.scale.add( gui_controls_funs, 'dg_dim_z').min(0.01).max(100).step(0.01).name('<span style="color:blue">z length</span>');




/**
 *  Update php, javascript and transform_controls when dat.gui changes
 *
 *  Triggered once initially
 *
 */
function controllerDatGuiOnChange() {

    // When gui values changes then stop animating else won't be able to type with keyboard
    dg_controller_tx.onChange(function(value) {

            // Stop animating
            cancelAnimationFrame( id_animation_frame );

            // update object position
            transform_controls.object.position.x = gui_controls_funs.dg_tx;

            // start animating again
            animate();
        }
    );

    dg_controller_ty.onChange(function(value) {
            cancelAnimationFrame( id_animation_frame );
            transform_controls.object.position.y = gui_controls_funs.dg_ty;
            animate();
        }
    );

    dg_controller_tz.onChange(function(value) {
            cancelAnimationFrame( id_animation_frame );
            transform_controls.object.position.z = gui_controls_funs.dg_tz;
            animate();
        }
    );

    dg_controller_rx.onChange(function(value) {
            cancelAnimationFrame( id_animation_frame );
            transform_controls.object.rotation.x = gui_controls_funs.dg_rx/180*Math.PI;
            animate();
        }
    );

    dg_controller_ry.onChange(function(value) {
            cancelAnimationFrame( id_animation_frame );
            transform_controls.object.rotation.y = gui_controls_funs.dg_ry / 180*Math.PI;
            animate();
        }
    );

    dg_controller_rz.onChange(function(value) {
            cancelAnimationFrame( id_animation_frame );
            transform_controls.object.rotation.z = gui_controls_funs.dg_rz / 180*Math.PI;
            animate();
        }
    );

    // When x length changes from dat gui then change also scale, y and z lengths, and scale the object with transform controls also
    dg_controller_dim_x.onChange( function(value) {

            cancelAnimationFrame( id_animation_frame );

            if (dg_dim_x_prev) {
                transform_controls.object.scale.set(value, gui_controls_funs.dg_dim_y, gui_controls_funs.dg_dim_z);
                envir.scene.dispatchEvent({type:"modificationPendingSave"});
            }

            dg_dim_x_prev = value;
            animate();
        }
    );


    dg_controller_dim_y.onChange( function(value) {

            cancelAnimationFrame( id_animation_frame );

            if (dg_dim_y_prev) {
                transform_controls.object.scale.set(gui_controls_funs.dg_dim_x, value, gui_controls_funs.dg_dim_z);
                envir.scene.dispatchEvent({type:"modificationPendingSave"});
            }

            dg_dim_y_prev = value;
            animate();
        }
    );


    dg_controller_dim_z.onChange( function(value) {

            cancelAnimationFrame( id_animation_frame );

            if (dg_dim_z_prev) {
                //gui_controls_funs.dg_scale = gui_controls_funs.dg_scale * value / dg_dim_z_prev;

                transform_controls.object.scale.set(gui_controls_funs.dg_dim_x, gui_controls_funs.dg_dim_y, value);

                // var dims = findDimensions(transform_controls.object);
                //
                // gui_controls_funs.dg_dim_x = dims[0];
                // gui_controls_funs.dg_dim_y = dims[1];
                envir.scene.dispatchEvent({type:"modificationPendingSave"});
            }

            dg_dim_z_prev = value;
            animate();
        }
    );

    // Make slider-text controllers more interactive
    dg_controller_tx.domElement.childNodes[0].event3DOperation = 'Tx';
    setEventListenerKeyPressControllerUnconstrained(dg_controller_tx.domElement.childNodes[0]);

    dg_controller_ty.domElement.childNodes[0].event3DOperation = 'Ty';
    setEventListenerKeyPressControllerUnconstrained(dg_controller_ty.domElement.childNodes[0]);

    dg_controller_tz.domElement.childNodes[0].event3DOperation = 'Tz';
    setEventListenerKeyPressControllerUnconstrained(dg_controller_tz.domElement.childNodes[0]);

    // Input Text listeners
    dg_controller_rx.domElement.children[0].childNodes[0].event3DOperation = 'Rx';
    setEventListenerKeyPressControllerConstrained(dg_controller_rx.domElement.children[0].childNodes[0]);

    dg_controller_ry.domElement.children[0].childNodes[0].event3DOperation = 'Ry';
    setEventListenerKeyPressControllerConstrained(dg_controller_ry.domElement.children[0].childNodes[0]);

    dg_controller_rz.domElement.children[0].childNodes[0].event3DOperation = 'Rz';
    setEventListenerKeyPressControllerConstrained(dg_controller_rz.domElement.children[0].childNodes[0]);

    dg_controller_dim_x.domElement.children[0].childNodes[0].event3DOperation = 'Sx';
    setEventListenerKeyPressControllerConstrained(dg_controller_dim_x.domElement.children[0].childNodes[0]);

    dg_controller_dim_y.domElement.children[0].childNodes[0].event3DOperation = 'Sy';
    setEventListenerKeyPressControllerConstrained(dg_controller_dim_y.domElement.children[0].childNodes[0]);

    dg_controller_dim_z.domElement.children[0].childNodes[0].event3DOperation = 'Sz';
    setEventListenerKeyPressControllerConstrained(dg_controller_dim_z.domElement.children[0].childNodes[0]);
}


/**
 * This function allows the dat gui text element of the slider to be clickable and interactive
 * @param element
 */
function setEventListenerKeyPressControllerConstrained(element) {

    // onclick inside stop animating
    element.addEventListener("click", function (event) {
        cancelAnimationFrame(id_animation_frame);
    });

    // While on Input Field on Focus and press enter
    element.addEventListener('keydown', function (e) {

        switch (element.event3DOperation) {
            case 'Sx':
                gui_controls_funs.dg_dim_x = element.value;
                transform_controls.object.scale.x = element.value;
                break;
            case 'Sy':
                gui_controls_funs.dg_dim_y = element.value;
                transform_controls.object.scale.y = element.value;
                break;
            case 'Sz':
                gui_controls_funs.dg_dim_z = element.value;
                transform_controls.object.scale.z = element.value;
                break;
            case 'Rx':
                gui_controls_funs.dg_rx = element.value;
                transform_controls.object.rotation.x = element.value;
                break;
            case 'Ry':
                gui_controls_funs.dg_ry = element.value;
                transform_controls.object.rotation.y = element.value;
                break;
            case 'Rz':
                gui_controls_funs.dg_rz = element.value;
                transform_controls.object.rotation.z = element.value;
                break;

        }

        // 13 is enter
        if (e.keyCode == 13) {
            animate();
            triggerAutoSave();
        }
    }, true);
}

/**
 * This function allows the dat gui text element of the slider to be clickable and interactive
 *  This is for translation which is not constrained (no slider) with limits
 * @param element
 */
function setEventListenerKeyPressControllerUnconstrained(element){

    element.addEventListener("click", function (event) {
         cancelAnimationFrame( id_animation_frame );
     });

    // While on Input Field on Focus and press enter
    element.addEventListener('keydown', function (e) {

        // REM : HERE . Do it per object
        switch (element.event3DOperation) {
            case 'Tx':
                gui_controls_funs.dg_tx = element.value;
                transform_controls.object.position.x = element.value;
                break;
            case 'Ty':
                gui_controls_funs.dg_ty = element.value;
                transform_controls.object.position.y = element.value;
                break;
            case 'Tz':
                gui_controls_funs.dg_tz = element.value;
                transform_controls.object.position.z = element.value;
                break;
        }

        if (e.keyCode == 13) {
          animate();
          // trigger autosave
          triggerAutoSave();
        }
    }, true);
}





/**
 *  When you change trs from axes controls then automatically the dat.gui and the php form are updated
 *
 *  OnTickLevel
 */
function updatePositionsPhpAndJavsFromControlsAxes(){

    //--------- translate_x ---------------
    if (transform_controls.object.position.x!= gui_controls_funs.dg_tx){
        gui_controls_funs.dg_tx = transform_controls.object.position.x;
        // Auto-save
        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

    //--------- translate_y ---------------
    if (transform_controls.object.position.y!= gui_controls_funs.dg_ty){
        gui_controls_funs.dg_ty = transform_controls.object.position.y;

        // Auto-save
        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

    //--------- translate_z ---------------
    if (transform_controls.object.position.z!= gui_controls_funs.dg_tz){
        gui_controls_funs.dg_tz = transform_controls.object.position.z;

        // Auto-save
        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

    //--------- rotate_x ----------------------
    if (transform_controls.object.rotation._x*180/Math.PI != gui_controls_funs.dg_rx){
        gui_controls_funs.dg_rx = transform_controls.object.rotation._x * 180/Math.PI;

        // Auto-save
        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

    //---------rotate_y -------------------------------
    if (transform_controls.object.rotation._y*180/Math.PI != this.dg_ry){
        gui_controls_funs.dg_ry = transform_controls.object.rotation._y * 180/Math.PI;
        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

    //---------rotate_z -------------------------------
    if (transform_controls.object.rotation._z*180/Math.PI != gui_controls_funs.dg_rz){
        gui_controls_funs.dg_rz = transform_controls.object.rotation._z * 180/Math.PI;
        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

    //---------scale_x -------------------------------
    if (transform_controls.object.scale.x != gui_controls_funs.dg_dim_x){
        gui_controls_funs.dg_dim_x = transform_controls.object.scale.x;
        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

    //---------scale_y -------------------------------
    if (transform_controls.object.scale.y != gui_controls_funs.dg_dim_y){
        gui_controls_funs.dg_dim_y = transform_controls.object.scale.y;
        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

    //---------scale_z -------------------------------
    if (transform_controls.object.scale.z != gui_controls_funs.dg_dim_z){
        gui_controls_funs.dg_dim_z = transform_controls.object.scale.z;
        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

}
