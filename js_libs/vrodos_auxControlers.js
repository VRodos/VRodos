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


var controlInterface = new dat.GUI( { autoPlace: false });
controlInterface.domElement.style='width:100%';

let coordLabel = ['<span style="color:red">X</span>', '<span style="color:green">Y</span>', '<span style="color:blue">Z</span>'];
let actionLabel = ['translate','translate','translate','rotate','rotate','rotate','scale', 'scale', 'scale'];


var dg_controller = Array();

var gui_controls_funs = {
    1 : 0,
    2 : 0,
    3 : 0,
    4 : 0,
    5: 0,
    6 : 0,
    7 : 0,
    8 : 0,
    9 : 0
};


// Add variables to GUI
let i = 0;
for (let key in gui_controls_funs){

    // Label
    let label = actionLabel[i] + " " + coordLabel[i%3];

    // Controller          // Interface        // UI_Vars      // var
    dg_controller[i++] = controlInterface.add(gui_controls_funs, key).step(0.001).name(label);
}


/**
 *  Add listeners: Update php, javascript and transform_controls when dat.gui changes
 *
 *  Triggered once initially
 *
 */
function controllerDatGuiOnChange() {

    let actionLabel = ['position','position','position','rotation','rotation','rotation','scale', 'scale', 'scale'];
    for (let k=0 ; k<9; k++){

        dg_controller[k].onChange(function(value) {

                // Stop animating
                cancelAnimationFrame( id_animation_frame );

                // update object position and scale
                if (actionLabel[k] !== 'rotation')
                {
                    transform_controls.object[actionLabel[k]].setComponent(k % 3, value);
                    // update rotation
                } else if (actionLabel[k] === 'rotation') {

                    switch (k) {
                        case 3:
                            transform_controls.object['rotation'].x = value/180*Math.PI;
                            break;
                        case 4:
                            transform_controls.object['rotation'].y = value/180*Math.PI;
                            break;
                        case 5:
                            transform_controls.object['rotation'].z = value/180*Math.PI;
                            break;
                    }

                }
                // start animating again
                animate();
            }
        );

    }




    // When you move the mouse up or down inside a datgui then update object affines
    for (let j=0; j<9; j++){

        // set an indicator for the operation
        dg_controller[j].domElement.event3DOperation = j;

        // Get the text field;
        let element = dg_controller[j].domElement.childNodes[0];

        // onclick inside stop animating
        element.addEventListener("click", function (event) {
            cancelAnimationFrame(id_animation_frame);
        });

        // While on Input Field on Focus and press enter
        element.addEventListener('keydown', function (e) {

            let operationIndex = element.parentElement.parentElement.event3DOperation;

            // Update gui variables
            gui_controls_funs[operationIndex] = element.value;

            // Update transform controls
            switch (operationIndex) {
                case 0:
                case 1:
                case 2:
                    transform_controls.object.position.setComponent(operationIndex, element.value);
                    break;
                case 3:
                    transform_controls.object.rotation.x = element.value;
                    break;
                case 4:
                    transform_controls.object.rotation.y = element.value;
                    break;
                case 5:
                    transform_controls.object.rotation.z = element.value;
                    break;
                case 6:
                case 7:
                case 8:
                    transform_controls.object.scale.setComponent(operationIndex,  element.value);
                    break;
            }

            // 13 is enter
            if (e.keyCode === 13) {
                animate();
                triggerAutoSave();
            }
        }, true);

    }
}



/**
 *  When you change trs from axes controls then automatically the dat.gui and the php form are updated
 *
 *  OnTickLevel
 */
function updatePositionsPhpAndJavsFromControlsAxes(){

    //--------- translate_x ---------------
    if (transform_controls.object.position.x !== gui_controls_funs[0]){

        gui_controls_funs[0] = transform_controls.object.position.x;

        // Auto-save
        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

//     //--------- translate_y ---------------
//     if (transform_controls.object.position.y!= gui_controls_funs.dg_t2){
//         gui_controls_funs.dg_t2 = transform_controls.object.position.y;
//
//         // Auto-save
//         envir.scene.dispatchEvent({type:"modificationPendingSave"});
//     }
//
//     //--------- translate_z ---------------
//     if (transform_controls.object.position.z!= gui_controls_funs.dg_t3){
//         gui_controls_funs.dg_t3 = transform_controls.object.position.z;
//
//         // Auto-save
//         envir.scene.dispatchEvent({type:"modificationPendingSave"});
//     }
//
//     //--------- rotate_x ----------------------
//     if (transform_controls.object.rotation._x*180/Math.PI != gui_controls_funs.dg_r1){
//         gui_controls_funs.dg_r1 = transform_controls.object.rotation._x * 180/Math.PI;
//
//         // Auto-save
//         envir.scene.dispatchEvent({type:"modificationPendingSave"});
//     }
//
//     //---------rotate_y -------------------------------
//     if (transform_controls.object.rotation._y*180/Math.PI != this.dg_r2){
//         gui_controls_funs.dg_r2 = transform_controls.object.rotation._y * 180/Math.PI;
//         envir.scene.dispatchEvent({type:"modificationPendingSave"});
//     }
//
//     //---------rotate_z -------------------------------
//     if (transform_controls.object.rotation._z*180/Math.PI != gui_controls_funs.dg_r3){
//         gui_controls_funs.dg_r3 = transform_controls.object.rotation._z * 180/Math.PI;
//         envir.scene.dispatchEvent({type:"modificationPendingSave"});
//     }
//
//     //---------scale_x -------------------------------
//     if (transform_controls.object.scale.x != gui_controls_funs.dg_s1){
//         gui_controls_funs.dg_s1 = transform_controls.object.scale.x;
//         envir.scene.dispatchEvent({type:"modificationPendingSave"});
//     }
//
//     //---------scale_y -------------------------------
//     if (transform_controls.object.scale.y != gui_controls_funs.dg_s2){
//         gui_controls_funs.dg_s2 = transform_controls.object.scale.y;
//         envir.scene.dispatchEvent({type:"modificationPendingSave"});
//     }
//
//     //---------scale_z -------------------------------
//     if (transform_controls.object.scale.z != gui_controls_funs.dg_s3){
//         gui_controls_funs.dg_s3 = transform_controls.object.scale.z;
//         envir.scene.dispatchEvent({type:"modificationPendingSave"});
//     }
//
}
