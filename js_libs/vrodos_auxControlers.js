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
    this.dg_scale = 0;
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


controlInterface.rotate = new dat.GUI( { autoPlace: false });
controlInterface.rotate.domElement.id = 'rotatePanelGui';
controlInterface.rotate.domElement.style='width:100%';

controlInterface.scale = new dat.GUI( { autoPlace: false });
controlInterface.scale.domElement.id = 'scalePanelGui';
controlInterface.scale.domElement.style='width:100%';


var dg_controller_tx = controlInterface.translate.add( gui_controls_funs, 'dg_tx').step(0.001).name('<span style="color:red">Move x</span>');//.listen();
var dg_controller_ty = controlInterface.translate.add( gui_controls_funs, 'dg_ty').step(0.001).name('<span style="color:green">Move y</span>');//.listen();
var dg_controller_tz = controlInterface.translate.add( gui_controls_funs, 'dg_tz').step(0.001).name('<span style="color:blue">Move z</span>');//.listen();

var dg_controller_rx = controlInterface.rotate.add( gui_controls_funs, 'dg_rx', -179, 180, 0.001).name('<span style="color:red">Rotate x</span>');//.listen();
var dg_controller_ry = controlInterface.rotate.add( gui_controls_funs, 'dg_ry', -179, 180, 0.001).name('<span style="color:green">Rotate y</span>');//.listen();
var dg_controller_rz = controlInterface.rotate.add( gui_controls_funs, 'dg_rz', -179, 180, 0.001).name('<span style="color:blue">Rotate z</span>');//.listen();

//var dg_controller_sc  = controlInterface.scale.add( gui_controls_funs, 'dg_scale').min(0.001).max(1000).step(0.001).name('Scale');//.listen();
var dg_controller_dim_x = controlInterface.scale.add( gui_controls_funs, 'dg_dim_x').min(0.01).max(30).step(0.01).name('<span style="color:red">x length</span>');
var dg_controller_dim_y = controlInterface.scale.add( gui_controls_funs, 'dg_dim_y').min(0.01).max(30).step(0.01).name('<span style="color:green">y length</span>');
var dg_controller_dim_z = controlInterface.scale.add( gui_controls_funs, 'dg_dim_z').min(0.01).max(30).step(0.01).name('<span style="color:blue">z length</span>');

controlInterface.translate.domElement.style='width:100%';


/**
 *  Update php, javascript and transform_controls when dat.gui changes
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

    //dg_controller_tx.

        // // Stop animating
        // cancelAnimationFrame( id_animation_frame );
        //
        //
        // // start animating again
        // animate();


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


    // ----- Scale ----

    // dg_controller_sc.onChange(function(value) {
    //
    //         cancelAnimationFrame( id_animation_frame );
    //
    //         transform_controls.object.scale.set(gui_controls_funs.dg_scale, gui_controls_funs.dg_scale, gui_controls_funs.dg_scale);
    //
    //         var dims = findDimensions(transform_controls.object);
    //
    //         gui_controls_funs.dg_dim_x = dims[0];
    //         gui_controls_funs.dg_dim_y = dims[1];
    //         gui_controls_funs.dg_dim_z = dims[2];
    //
    //         animate();
    //     }
    // );


    // When x length changes from dat gui then change also scale, y and z lengths, and scale the object with transform controls also
    dg_controller_dim_x.onChange( function(value) {

            cancelAnimationFrame( id_animation_frame );

            if (dg_dim_x_prev) {
                //gui_controls_funs.dg_scale = gui_controls_funs.dg_scale * value / dg_dim_x_prev;

                transform_controls.object.scale.set(value, gui_controls_funs.dg_dim_y, gui_controls_funs.dg_dim_z);

                // var dims = findDimensions(transform_controls.object);
                //
                // gui_controls_funs.dg_dim_y = dims[1];
                // gui_controls_funs.dg_dim_z = dims[2];
                envir.scene.dispatchEvent({type:"modificationPendingSave"});
            }

            dg_dim_x_prev = value;
            animate();
        }
    );


    dg_controller_dim_y.onChange( function(value) {

            cancelAnimationFrame( id_animation_frame );

            if (dg_dim_y_prev) {
                //gui_controls_funs.dg_scale = gui_controls_funs.dg_scale * value / dg_dim_y_prev;

                transform_controls.object.scale.set(gui_controls_funs.dg_dim_x, value, gui_controls_funs.dg_dim_z);

                // var dims = findDimensions(transform_controls.object);
                //
                // gui_controls_funs.dg_dim_x = dims[0];
                // gui_controls_funs.dg_dim_z = dims[2];
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
    setKeyPressControllerUnconstrained(dg_controller_tx);
    setKeyPressControllerUnconstrained(dg_controller_ty);
    setKeyPressControllerUnconstrained(dg_controller_tz);
    setKeyPressControllerConstrained(dg_controller_rx);
    setKeyPressControllerConstrained(dg_controller_ry);
    setKeyPressControllerConstrained(dg_controller_rz);


    //setKeyPressControllerConstrained(dg_controller_sc);

    setKeyPressControllerConstrained(dg_controller_dim_x);
    setKeyPressControllerConstrained(dg_controller_dim_y);
    setKeyPressControllerConstrained(dg_controller_dim_z);


}

/**
 * This function allows the dat gui text element of the slider to be clickable and interactive
 *  This is for translation which is not constrained (no slider) with limits
 * @param element
 */
function setKeyPressControllerUnconstrained(element){

    var div = element.domElement.children;

    div[0].onclick = function(event){
         cancelAnimationFrame( id_animation_frame );
     };

    // While on Input Field on Focus and press enter
    div[0].addEventListener('keydown', function (e) {
        if (e.keyCode == 13) {
          animate();

          // trigger autosave
          triggerAutoSave();
        }
    });
}


/**
* This function allows the dat gui text element of the slider to be clickable and interactive
* @param element
*/
function setKeyPressControllerConstrained(element) {

    var div = element.domElement.children;

    div[0].children[0].onclick = function (event) {
        cancelAnimationFrame(id_animation_frame);
    };


    // While on Input Field on Focus and press enter
    div[0].addEventListener('keydown', function (e) {
        if (e.keyCode == 13) {
            animate();
            // trigger autosave
            triggerAutoSave();
        }
    });

}


/**
 *  When you change trs from axes controls then automatically the dat.gui and the php form are updated
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


    //---------scale by TransformTools-------------------------------
    // var val = 0;
    //
    // if (transform_controls.object.scale.x != gui_controls_funs.dg_scale){
    //     val = transform_controls.object.scale.x;
    // } else if (transform_controls.object.scale.y != gui_controls_funs.dg_scale){
    //     val = transform_controls.object.scale.y
    // } else if (transform_controls.object.scale.z != gui_controls_funs.dg_scale){
    //     val = transform_controls.object.scale.z
    // }
    //
    // //console.log("val", val);
    //
    // if (val > 0) {
    //     gui_controls_funs.dg_scale = val;
    //     transform_controls.object.scale.set( val, val, val);
    //
    //     var dims = findDimensions(transform_controls.object);
    //
    //     gui_controls_funs.dg_dim_x = dims[0];
    //     gui_controls_funs.dg_dim_y = dims[1];
    //     gui_controls_funs.dg_dim_z = dims[2];
    //
    //     // Auto-save
    //     envir.scene.dispatchEvent({type:"modificationPendingSave"});
    // }
    //--------- end of scale ------------------------
}


// Find dimensions of the selected object
function findDimensions(grouObj){

    grouObj.remove( grouObj.getObjectByName('bbox') );
    grouObj.remove( grouObj.getObjectByName('x_dim_line') );

    // ======= bbox ========================
    var box = new THREE.BoxHelper( grouObj, 0xff00ff );

    box.geometry.computeBoundingBox();
    box.name = "bbox";

    var finalVec = new THREE.Vector3().subVectors(box.geometry.boundingBox.min, box.geometry.boundingBox.max);

    var x = Math.abs(finalVec.x);
    var y = Math.abs(finalVec.y);
    var z = Math.abs(finalVec.z);

    return [x,y,z];
}

// Find dimensions of the selected object
function findBorders(grouObj){

    grouObj.remove( grouObj.getObjectByName('bbox') );
    grouObj.remove( grouObj.getObjectByName('x_dim_line') );

    // ======= bbox ========================
    var box = new THREE.BoxHelper( grouObj, 0xff00ff );

    box.geometry.computeBoundingBox();
    box.name = "bbox";

    var finalVec = new THREE.Vector3().subVectors(box.geometry.boundingBox.min, box.geometry.boundingBox.max);

    var x = Math.abs(finalVec.x);
    var y = Math.abs(finalVec.y);
    var z = Math.abs(finalVec.z);

    return [box.geometry.boundingBox.min, box.geometry.boundingBox.max];
}


// Find Limits (world coordinates) of the selected object
function findObjectLimits(groupObj){



    groupObj.remove( groupObj.getObjectByName('bbox') );
    groupObj.remove( groupObj.getObjectByName('x_dim_line') );


    // ======= bbox ========================
    try {
        var box = new THREE.BoxHelper(groupObj, 0xff00ff);

        box.geometry.computeBoundingBox();
        box.name = "bbox";

        // var finalVec = new THREE.Vector3().subVectors(box.geometry.boundingBox.min, box.geometry.boundingBox.max);
        // var x = Math.abs(finalVec.x);
        // var y = Math.abs(finalVec.y);
        // var z = Math.abs(finalVec.z);

        return [box.geometry.boundingBox.min, box.geometry.boundingBox.max];
    } catch (e){
        console.error("ERROR 512" + groupObj.name + "is problematic");
        return [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)];
    }
}


// Reset
function findSceneDimensions(){

    var xMax = 0;
    var xMin = 0;
    var zMax = 0;
    var zMin = 0;
    var yMax = 0;
    var yMin = 0;

    for (var i = 0; i < envir.scene.children.length; i++) {

        if (envir.scene.children[i].name !== "myTransformControls" && envir.scene.children[i].name !== "myGridHelper") {


            var sizeXYZ_Arr = findObjectLimits(envir.scene.children[i]);

            xMin = Math.min(sizeXYZ_Arr[0].x, xMin);
            xMax = Math.max(sizeXYZ_Arr[1].x, xMax);

            yMin = Math.min(sizeXYZ_Arr[0].y, yMin);
            yMax = Math.max(sizeXYZ_Arr[1].y, yMax);

            zMin = Math.min(sizeXYZ_Arr[0].z, zMin);
            zMax = Math.max(sizeXYZ_Arr[1].z, zMax);

        }
    }

    envir.SCENE_DIMENSION_SURFACE = Math.max(xMax - xMin, zMax - zMin);

    // In empty scene lets fix it to 10
    //envir.SCENE_DIMENSION_SURFACE = envir.SCENE_DIMENSION_SURFACE > 0 ? envir.SCENE_DIMENSION_SURFACE * 1.5 : 10;
}
