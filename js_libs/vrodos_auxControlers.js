/**
 * Dat-gui controls variables initialize
 *
 * @type {gui_controls_funs}
 */
var dg_s1_prev;
var dg_s2_prev;
var dg_s3_prev;

// GUI controls
/*var gui = new dat.GUI( {autoPlace: false} );*/

var controlInterface = [];
controlInterface = new dat.GUI({ autoPlace: false });
controlInterface.domElement.style = 'width:100%';

let coordLabel = ['<span style="color:red">X</span>', '<span style="color:green">Y</span>', '<span style="color:blue">Z</span>'];
let actionLabel = ['translate', 'translate', 'translate', 'rotate', 'rotate', 'rotate', 'scale', 'scale', 'scale'];


var dg_controller = Array();

var gui_controls_funs = new function () {
    this.dg_t1 = 0;
    this.dg_t2 = 0;
    this.dg_t3 = 0;
    this.dg_r1 = 0;
    this.dg_r2 = 0;
    this.dg_r3 = 0;
    this.dg_s1 = 0;
    this.dg_s2 = 0;
    this.dg_s3 = 0;
};


// Add variables to GUI
let i = 0;
for (let key in gui_controls_funs) {

    let label = actionLabel[i] + " " + coordLabel[i % 3];

    // Controller          // Interface        // UI_Vars      // var
    dg_controller[i++] = controlInterface.add(gui_controls_funs, key).step(0.001).name(label);
}


/**
 *  Add listeners: Update php, javascript and transform_controls when dat.gui changes
 *  Triggered once initially
 */
function controllerDatGuiOnChange() {


    // When gui values changes then stop animating else won't be able to type with keyboard
    dg_controller[0].onChange(function(value) {
            cancelAnimationFrame( id_animation_frame );
            transform_controls.object.position.x = gui_controls_funs.dg_t1;
            // dg_controller[0].updateDisplay();
            // dg_controller[0].isModified();
            animate();
        }
    );

    dg_controller[1].onChange(function (value) {
            cancelAnimationFrame(id_animation_frame);
            transform_controls.object.position.y = gui_controls_funs.dg_t2;
            animate();
        }
    );

    dg_controller[2].onChange(function (value) {
            cancelAnimationFrame(id_animation_frame);
            transform_controls.object.position.z = gui_controls_funs.dg_t3;
            animate();
        }
    );

    dg_controller[3].onChange(function (value) {
            cancelAnimationFrame(id_animation_frame);
            if (transform_controls.object.category_name == "camera"){
                transform_controls.object.rotation.x = 0;
                gui_controls_funs.dg_r1 = 0;
            }            
            else
                transform_controls.object.rotation.x = gui_controls_funs.dg_r1 / 180 * Math.PI;
            animate();
        }
    );

    dg_controller[4].onChange(function (value) {
            cancelAnimationFrame(id_animation_frame);
            if (transform_controls.object.category_name == "camera"){
                transform_controls.object.rotation.y = 0;
                gui_controls_funs.dg_r2 = 0;
            }            
            else
                transform_controls.object.rotation.y = gui_controls_funs.dg_r2 / 180 * Math.PI;
            animate();
        }
    );

    dg_controller[5].onChange(function (value) {
            cancelAnimationFrame(id_animation_frame);
            if (transform_controls.object.category_name == "camera"){
                transform_controls.object.rotation.z = 0;
                gui_controls_funs.dg_r3 = 0;
            }            
            else
                transform_controls.object.rotation.z = gui_controls_funs.dg_r3 / 180 * Math.PI;
            animate();
        }
    );

    // When x length changes from dat gui then change also scale, y and z lengths, and scale the object with transform controls also
    dg_controller[6].onChange(function (value) {

            cancelAnimationFrame(id_animation_frame);

            // if (dg_s1_prev) {
            if (transform_controls.object.category_name == "camera"){
                transform_controls.object.scale.x = 1;
                gui_controls_funs.dg_s1 = 1;
            }
            else{     
                if (envir.scene.keepScaleAspectRatio) {
                    transform_controls.object.scale.set(value, value, value);
                    dg_controller[7].domElement.children[0].value = value;
                    dg_controller[8].domElement.children[0].value = value;
                } else {
                    transform_controls.object.scale.set(value, gui_controls_funs.dg_s2, gui_controls_funs.dg_s3);

                }
                envir.scene.dispatchEvent({ type: "modificationPendingSave" });
                // }

                dg_s1_prev = value;
                animate();
            }
        }
    );

    dg_controller[7].onChange( function(value) {

            cancelAnimationFrame( id_animation_frame );

            // if (dg_s2_prev) {
            if (transform_controls.object.category_name == "camera"){
                transform_controls.object.scale.y = 1;
                gui_controls_funs.dg_s2 = 1;
            }
            else{
                if (envir.scene.keepScaleAspectRatio) {
                    transform_controls.object.scale.set(value, value, value);
                    dg_controller[6].domElement.children[0].value = value;
                    dg_controller[8].domElement.children[0].value = value;
                } else {
                    transform_controls.object.scale.set(gui_controls_funs.dg_s1, value, gui_controls_funs.dg_s3);
                }
                envir.scene.dispatchEvent({type:"modificationPendingSave"});
                // }

                dg_s2_prev = value;
                animate();
            }
        }
    );


    dg_controller[8].onChange( function(value) {

            cancelAnimationFrame( id_animation_frame );

            // if (dg_s3_prev) {
            if (transform_controls.object.category_name == "camera"){
                transform_controls.object.scale.z = 1;
                gui_controls_funs.dg_s3 = 1;
            }
            else{
                if (envir.scene.keepScaleAspectRatio) {
                    transform_controls.object.scale.set(value, value, value);
                    dg_controller[6].domElement.children[0].value = value;
                    dg_controller[7].domElement.children[0].value = value;
                } else {
                    transform_controls.object.scale.set(gui_controls_funs.dg_s1, gui_controls_funs.dg_s2, value);
                }

                envir.scene.dispatchEvent({type:"modificationPendingSave"});
                // }

                dg_s3_prev = value;
                animate();
            }
        }
    );

    // Make slider-text controllers more interactive
    dg_controller[0].domElement.event3DOperation = 'Tx';
    setEventListenerKeyPressControllerConstrained(dg_controller[0].domElement.childNodes[0]);

    dg_controller[1].domElement.event3DOperation = 'Ty';
    setEventListenerKeyPressControllerConstrained(dg_controller[1].domElement.childNodes[0]);

    dg_controller[2].domElement.event3DOperation = 'Tz';
    setEventListenerKeyPressControllerConstrained(dg_controller[2].domElement.childNodes[0]);

    dg_controller[3].domElement.event3DOperation = 'Rx';
    setEventListenerKeyPressControllerConstrained(dg_controller[3].domElement.childNodes[0]);

    dg_controller[4].domElement.event3DOperation = 'Ry';
    setEventListenerKeyPressControllerConstrained(dg_controller[4].domElement.childNodes[0]);

    dg_controller[5].domElement.event3DOperation = 'Rz';
    setEventListenerKeyPressControllerConstrained(dg_controller[5].domElement.childNodes[0]);

    dg_controller[6].domElement.event3DOperation = 'Sx';
    setEventListenerKeyPressControllerConstrained(dg_controller[6].domElement.children[0]);

    dg_controller[7].domElement.event3DOperation = 'Sy';
    setEventListenerKeyPressControllerConstrained(dg_controller[7].domElement.childNodes[0]);

    dg_controller[8].domElement.event3DOperation = 'Sz';
    setEventListenerKeyPressControllerConstrained(dg_controller[8].domElement.childNodes[0]);
}


/**
 * This function allows the dat gui text element of the slider to be clickable and interactive
 * @param element
 */
function setEventListenerKeyPressControllerConstrained(element) {

    element.addEventListener("focusout", function (event) {
        animate();
        triggerAutoSave();
    });

    // onclick inside stop animating
    element.addEventListener("click", function (event) {
        cancelAnimationFrame(id_animation_frame);
    });


    // While on Input Field on Focus and pressing enter for value
    element.addEventListener('keydown', function (e) {
        
        // updatePositionsPhpAndJavsFromControlsAxes();
        switch (element.parentElement.parentElement.event3DOperation) {
            case 'Tx':
                gui_controls_funs.dg_t1 = element.value;
                transform_controls.object.position.x = element.value;
                break;
            case 'Ty':
                gui_controls_funs.dg_t2 = element.value;
                transform_controls.object.position.y = element.value;
                break;
            case 'Tz':
                gui_controls_funs.dg_t3 = element.value;
                transform_controls.object.position.z = element.value;
                break;
            case 'Rx':
                gui_controls_funs.dg_r1 = element.value;
                
                transform_controls.object.rotation.x = element.value;
                break;
            case 'Ry':
                gui_controls_funs.dg_r2 = element.value;
                transform_controls.object.rotation.y = element.value;
                break;
            case 'Rz':
                gui_controls_funs.dg_r3 = element.value;
                transform_controls.object.rotation.z = element.value;
                break;
            case 'Sx':
                gui_controls_funs.dg_s1 = element.value;
                transform_controls.object.scale.x = element.value;
                if (envir.scene.keepScaleAspectRatio) {
                    gui_controls_funs.dg_s2 = element.value;
                    transform_controls.object.scale.y = element.value;
                    gui_controls_funs.dg_s3 = element.value;
                    transform_controls.object.scale.z = element.value;
                }
                break;
            case 'Sy':
                gui_controls_funs.dg_s2 = element.value;
                transform_controls.object.scale.y = element.value;
                if (envir.scene.keepScaleAspectRatio) {
                    gui_controls_funs.dg_s1 = element.value;
                    transform_controls.object.scale.x = element.value;
                    gui_controls_funs.dg_s3 = element.value;
                    transform_controls.object.scale.z = element.value;
                }
                break;
            case 'Sz':
                gui_controls_funs.dg_s3 = element.value;
                transform_controls.object.scale.z = element.value;
                if (envir.scene.keepScaleAspectRatio) {
                    gui_controls_funs.dg_s2 = element.value;
                    transform_controls.object.scale.y = element.value;
                    gui_controls_funs.dg_s1 = element.value;
                    transform_controls.object.scale.x = element.value;
                }
                break;
        }

        // 13 is enter
        // if (e.keyCode === 13) {
            animate();
            triggerAutoSave();
        // }
    }, true);
}



/**
 *  When you change trs from axes controls then automatically the dat.gui and the php form are updated
 *
 *  OnTickLevel
 */
function updatePositionsPhpAndJavsFromControlsAxes() {

    //--------- translate_x ---------------
    if ( transform_controls.object.position.x!== gui_controls_funs.dg_t1) {
        gui_controls_funs.dg_t1 = transform_controls.object.position.x;
        envir.scene.dispatchEvent({ type: "modificationPendingSave" });
    }

    //--------- translate_y ---------------
    if (transform_controls.object.position.y!== gui_controls_funs.dg_t2) {
        gui_controls_funs.dg_t2 = transform_controls.object.position.y;

        envir.scene.dispatchEvent({ type: "modificationPendingSave" });
    }

    //--------- translate_z ---------------
    if (transform_controls.object.position.z!== gui_controls_funs.dg_t3) {
        gui_controls_funs.dg_t3 = transform_controls.object.position.z;

        envir.scene.dispatchEvent({ type: "modificationPendingSave" });
    }

    //--------- rotate_x ----------------------
    if (transform_controls.object.rotation._x*180/Math.PI !== gui_controls_funs.dg_r1){
        gui_controls_funs.dg_r1 = transform_controls.object.rotation._x * 180/Math.PI;

        envir.scene.dispatchEvent({ type: "modificationPendingSave" });
    }

    //---------rotate_y -------------------------------
    if (transform_controls.object.rotation._y*180/Math.PI !== this.dg_r2){
        gui_controls_funs.dg_r2 = transform_controls.object.rotation._y * 180/Math.PI;

        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

    //---------rotate_z -------------------------------
    if (transform_controls.object.rotation._z*180/Math.PI !== gui_controls_funs.dg_r3){
        gui_controls_funs.dg_r3 = transform_controls.object.rotation._z * 180/Math.PI;

        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

    //---------scale_x -------------------------------
    if (transform_controls.object.scale.x !== gui_controls_funs.dg_s1){
        gui_controls_funs.dg_s1 = transform_controls.object.scale.x;
        if (envir.scene.keepScaleAspectRatio) {
            gui_controls_funs.dg_s2 = transform_controls.object.scale.x;
            gui_controls_funs.dg_s3 = transform_controls.object.scale.x;
        }
        envir.scene.dispatchEvent({ type: "modificationPendingSave" });
    }

    //---------scale_y -------------------------------
    if (transform_controls.object.scale.y !== gui_controls_funs.dg_s2){
        gui_controls_funs.dg_s2 = transform_controls.object.scale.y;
        if (envir.scene.keepScaleAspectRatio) {
            gui_controls_funs.dg_s1 = transform_controls.object.scale.y;
            gui_controls_funs.dg_s3 = transform_controls.object.scale.y;
        }
        envir.scene.dispatchEvent({ type: "modificationPendingSave" });
    }

    //---------scale_z -------------------------------
    if (transform_controls.object.scale.z !== gui_controls_funs.dg_s3){
        gui_controls_funs.dg_s3 = transform_controls.object.scale.z;
        if (envir.scene.keepScaleAspectRatio) {
            gui_controls_funs.dg_s1 = transform_controls.object.scale.z;
            gui_controls_funs.dg_s2 = transform_controls.object.scale.z;
        }
        envir.scene.dispatchEvent({ type: "modificationPendingSave" });
    }

}


function setDatGuiInitialVales(object){

    gui_controls_funs.dg_t1 = transform_controls.object.position.x;
    gui_controls_funs.dg_t2 = transform_controls.object.position.y;
    gui_controls_funs.dg_t3 = transform_controls.object.position.z;

    gui_controls_funs.dg_r1 = transform_controls.object.rotation.x;
    gui_controls_funs.dg_r2 = transform_controls.object.rotation.y;
    gui_controls_funs.dg_r3 = transform_controls.object.rotation.z;

    gui_controls_funs.dg_s1 = transform_controls.object.scale.x;
    gui_controls_funs.dg_s2 = transform_controls.object.scale.y;
    gui_controls_funs.dg_s3 = transform_controls.object.scale.z;

    // dg_controller[0].domElement.children[0].value = transform_controls.object.position.x;
    // dg_controller[1].domElement.children[0].value = transform_controls.object.position.y;
    // dg_controller[2].domElement.children[0].value = transform_controls.object.position.z;

    dg_controller[0].domElement.children[0].value = (Math.round(transform_controls.object.position.x * 100) / 100).toFixed(2);
    dg_controller[1].domElement.children[0].value = (Math.round(transform_controls.object.position.y * 100) / 100).toFixed(2);
    dg_controller[2].domElement.children[0].value = (Math.round(transform_controls.object.position.z * 100) / 100).toFixed(2);


    // dg_controller[3].domElement.children[0].value = transform_controls.object.rotation.x;
    // dg_controller[4].domElement.children[0].value = transform_controls.object.rotation.y;
    // dg_controller[5].domElement.children[0].value = transform_controls.object.rotation.z;

    dg_controller[3].domElement.children[0].value = (Math.round(transform_controls.object.rotation.x * 100) / 100).toFixed(2);
    dg_controller[4].domElement.children[0].value = (Math.round(transform_controls.object.rotation.y * 100) / 100).toFixed(2);
    dg_controller[5].domElement.children[0].value = (Math.round(transform_controls.object.rotation.z * 100) / 100).toFixed(2);

    // dg_controller[6].domElement.children[0].value = transform_controls.object.scale.x;
    // dg_controller[7].domElement.children[0].value = transform_controls.object.scale.y;
    // dg_controller[8].domElement.children[0].value = transform_controls.object.scale.z;

    dg_controller[6].domElement.children[0].value = (Math.round(transform_controls.object.scale.x * 100) / 100).toFixed(2);
    dg_controller[7].domElement.children[0].value = (Math.round(transform_controls.object.scale.y * 100) / 100).toFixed(2);
    dg_controller[8].domElement.children[0].value = (Math.round(transform_controls.object.scale.z * 100) / 100).toFixed(2);

    updatePositionsPhpAndJavsFromControlsAxes();
}
