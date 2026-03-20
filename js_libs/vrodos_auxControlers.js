/**
 * lil-gui controls variables initialize (migrated from dat.gui)
 *
 * @type {gui_controls_funs}
 */
var dg_s1_prev;
var dg_s2_prev;
var dg_s3_prev;

// ─── Cel-shaded selection outline (back-face hull) ───

const CEL_OUTLINE_TAG = '__cel_outline__';
const CEL_OUTLINE_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
});

/**
 * Add a cel-shaded outline to the selected object.
 * Works by cloning each mesh with BackSide rendering, slightly scaled up.
 */
function addCelOutline(object) {
    if (!object) return;
    removeCelOutline(object);

    object.traverse(function (child) {
        if (child.isMesh && child.name !== CEL_OUTLINE_TAG) {
            const outline = new THREE.Mesh(child.geometry, CEL_OUTLINE_MATERIAL);
            outline.name = CEL_OUTLINE_TAG;
            outline.scale.setScalar(1.04);
            outline.raycast = function () {}; // invisible to raycasting
            outline.frustumCulled = false;
            child.add(outline);
        }
    });
}

/**
 * Remove cel-shaded outline from an object.
 */
function removeCelOutline(object) {
    if (!object) return;
    const toRemove = [];
    object.traverse(function (child) {
        if (child.name === CEL_OUTLINE_TAG) toRemove.push(child);
    });
    toRemove.forEach(function (mesh) {
        if (mesh.parent) mesh.parent.remove(mesh);
    });
}

/**
 * Remove all cel outlines from the entire scene.
 */
function removeAllCelOutlines() {
    if (typeof envir === 'undefined' || !envir.scene) return;
    const toRemove = [];
    envir.scene.traverse(function (child) {
        if (child.name === CEL_OUTLINE_TAG) toRemove.push(child);
    });
    toRemove.forEach(function (mesh) {
        if (mesh.parent) mesh.parent.remove(mesh);
    });
}

// ─── Floating Object Controls Panel helpers ───

function showObjectControlsPanel(objectName) {
    const panel = document.getElementById('object-controls-panel');
    if (panel) {
        panel.classList.remove('tw-hidden');
        jQuery('#object-manipulation-toggle').show();
        jQuery('#axis-manipulation-buttons').show();
        if (objectName) {
            const title = document.getElementById('object-controls-title');
            if (title) title.textContent = objectName;
        }
    }
}

function hideObjectControlsPanel() {
    const panel = document.getElementById('object-controls-panel');
    if (panel) panel.classList.add('tw-hidden');
    hideAllPropertyPanels();
}

/**
 * Hide all object property sections inside the floating panel.
 */
function hideAllPropertyPanels() {
    var container = document.getElementById('object-properties-container');
    if (!container) return;
    container.style.display = 'none';
    var sections = container.querySelectorAll('.object-property-section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].style.display = 'none';
    }
}

/**
 * Show properties for the selected object inside the floating panel,
 * based on its category_slug / category_name.
 */
function showPropertiesInPanel(object) {
    if (!object) return;
    hideAllPropertyPanels();

    var name = object.name;
    var hasProperties = false;

    // Dispatch by category_slug first
    switch (object.category_slug) {
        case 'poi-imagetext':
            displayPoiImageTextProperties(null, name);
            hasProperties = true;
            break;
        case 'video':
            displayPoiVideoProperties(null, name);
            hasProperties = true;
            break;
        case 'door':
            displayDoorProperties(null, name);
            hasProperties = true;
            break;
        case 'poi-link':
            displayLinkProperties(null, name);
            hasProperties = true;
            break;
    }

    // Dispatch by category_name (lights)
    switch (object.category_name) {
        case 'lightSun':
            displaySunProperties(null, name);
            hasProperties = true;
            break;
        case 'lightLamp':
            displayLampProperties(null, name);
            hasProperties = true;
            break;
        case 'lightSpot':
            displaySpotProperties(null, name);
            hasProperties = true;
            break;
        case 'lightAmbient':
            displayAmbientProperties(null, name);
            hasProperties = true;
            break;
    }

    // Show the container only if a property section is active
    if (hasProperties) {
        var container = document.getElementById('object-properties-container');
        if (container) container.style.display = 'block';
    }
}

// Set up drag + close once DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    const panel = document.getElementById('object-controls-panel');
    const header = document.getElementById('object-controls-header');
    const closeBtn = document.getElementById('object-controls-close');

    if (!panel || !header) return;

    // Close button hides the panel
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            hideObjectControlsPanel();
        });
    }

    // Draggable via header
    let isDragging = false, offsetX = 0, offsetY = 0;

    header.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button')) return; // don't drag on close button
        isDragging = true;
        // Use the panel's current CSS left/top (relative to offset parent),
        // not getBoundingClientRect (relative to viewport) — avoids jump on first click
        var computedLeft = parseInt(panel.style.left, 10);
        var computedTop = parseInt(panel.style.top, 10);
        // If panel was positioned with right instead of left, resolve to left
        if (isNaN(computedLeft)) {
            var rect = panel.getBoundingClientRect();
            var parentRect = panel.offsetParent ? panel.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
            computedLeft = rect.left - parentRect.left;
            computedTop = rect.top - parentRect.top;
        }
        offsetX = e.clientX - computedLeft;
        offsetY = e.clientY - computedTop;
        header.setPointerCapture(e.pointerId);
        e.preventDefault();
    });

    header.addEventListener('pointermove', function (e) {
        if (!isDragging) return;
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
        panel.style.right = 'auto';
    });

    header.addEventListener('pointerup', function (e) {
        isDragging = false;
        header.releasePointerCapture(e.pointerId);
    });
});

// GUI controls — lil-gui (successor to dat.gui)
var controlInterface = new lil.GUI({ autoPlace: false });
controlInterface.domElement.style.width = '100%';

// Remove the lil-gui title bar (our floating panel has its own header)
// and prevent collapsing — controls should always be visible
controlInterface.$title.style.display = 'none';
controlInterface.domElement.classList.add('autoHeight');

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

    // lil-gui: .add() returns a Controller, .step() and .name() chain the same way
    // .decimals(2) handles display formatting (replaces manual toFixed hacks)
    dg_controller[i] = controlInterface.add(gui_controls_funs, key).step(0.001).decimals(2).name(key);

    // lil-gui escapes HTML in .name(), so set innerHTML directly for colored axis labels
    dg_controller[i].$name.innerHTML = label;

    // Add drag-to-scrub on the input: click+drag horizontally to change value
    _addDragScrub(dg_controller[i]);

    i++;
}

/**
 * Adds mouse-drag scrubbing to a lil-gui number controller input.
 * Click and drag horizontally on the input to adjust the value.
 * Sensitivity adapts: translation/rotation use 0.01 per pixel, scale uses 0.005.
 */
function _addDragScrub(controller) {
    const input = controller.$input;
    let dragging = false;
    let startX = 0;
    let startValue = 0;

    // Determine sensitivity from the controller property name
    const isScale = controller.property.startsWith('dg_s');
    const sensitivity = isScale ? 0.005 : 0.01;

    input.style.cursor = 'ew-resize';

    input.addEventListener('pointerdown', function (e) {
        // Only scrub on left button; skip if user clicked to type
        if (e.button !== 0) return;
        dragging = true;
        startX = e.clientX;
        startValue = controller.getValue();
        input.setPointerCapture(e.pointerId);
        e.preventDefault();
        cancelAnimationFrame(id_animation_frame);
    });

    input.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const newValue = startValue + dx * sensitivity;
        controller.setValue(parseFloat(newValue.toFixed(3)));
    });

    input.addEventListener('pointerup', function (e) {
        if (!dragging) return;
        dragging = false;
        input.releasePointerCapture(e.pointerId);
        animate();
        triggerAutoSave();
    });
}


/**
 *  Add listeners: Update php, javascript and transform_controls when GUI changes
 *  Triggered once initially
 */
function controllerDatGuiOnChange() {


    // When gui values changes then stop animating else won't be able to type with keyboard
    dg_controller[0].onChange(function(value) {
            cancelAnimationFrame( id_animation_frame );
            transform_controls.object.position.x = gui_controls_funs.dg_t1;
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

    // When x length changes from gui then change also scale, y and z lengths
    dg_controller[6].onChange(function (value) {

            cancelAnimationFrame(id_animation_frame);

            if (transform_controls.object.category_name == "camera"){
                transform_controls.object.scale.x = 1;
                gui_controls_funs.dg_s1 = 1;
            }
            else{
                if (envir.scene.keepScaleAspectRatio) {
                    transform_controls.object.scale.set(value, value, value);
                    gui_controls_funs.dg_s2 = value;
                    gui_controls_funs.dg_s3 = value;
                    dg_controller[7].updateDisplay();
                    dg_controller[8].updateDisplay();
                } else {
                    transform_controls.object.scale.set(value, gui_controls_funs.dg_s2, gui_controls_funs.dg_s3);

                }
                envir.scene.dispatchEvent({ type: "modificationPendingSave" });

                dg_s1_prev = value;
                animate();
            }
        }
    );

    dg_controller[7].onChange( function(value) {

            cancelAnimationFrame( id_animation_frame );

            if (transform_controls.object.category_name == "camera"){
                transform_controls.object.scale.y = 1;
                gui_controls_funs.dg_s2 = 1;
            }
            else{
                if (envir.scene.keepScaleAspectRatio) {
                    transform_controls.object.scale.set(value, value, value);
                    gui_controls_funs.dg_s1 = value;
                    gui_controls_funs.dg_s3 = value;
                    dg_controller[6].updateDisplay();
                    dg_controller[8].updateDisplay();
                } else {
                    transform_controls.object.scale.set(gui_controls_funs.dg_s1, value, gui_controls_funs.dg_s3);
                }
                envir.scene.dispatchEvent({type:"modificationPendingSave"});

                dg_s2_prev = value;
                animate();
            }
        }
    );


    dg_controller[8].onChange( function(value) {

            cancelAnimationFrame( id_animation_frame );

            if (transform_controls.object.category_name == "camera"){
                transform_controls.object.scale.z = 1;
                gui_controls_funs.dg_s3 = 1;
            }
            else{
                if (envir.scene.keepScaleAspectRatio) {
                    transform_controls.object.scale.set(value, value, value);
                    gui_controls_funs.dg_s1 = value;
                    gui_controls_funs.dg_s2 = value;
                    dg_controller[6].updateDisplay();
                    dg_controller[7].updateDisplay();
                } else {
                    transform_controls.object.scale.set(gui_controls_funs.dg_s1, gui_controls_funs.dg_s2, value);
                }

                envir.scene.dispatchEvent({type:"modificationPendingSave"});

                dg_s3_prev = value;
                animate();
            }
        }
    );

    // Make slider-text controllers more interactive
    // lil-gui exposes .$input for the input element
    let opCodes = ['Tx','Ty','Tz','Rx','Ry','Rz','Sx','Sy','Sz'];
    for (let idx = 0; idx < 9; idx++) {
        dg_controller[idx]._opCode = opCodes[idx];
        setEventListenerKeyPressControllerConstrained(dg_controller[idx].$input, dg_controller[idx]);
    }
}


/**
 * This function allows the gui text element of the slider to be clickable and interactive
 * @param element - the input element
 * @param controller - the lil-gui controller (has _opCode custom property)
 */
function setEventListenerKeyPressControllerConstrained(element, controller) {

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

        switch (controller._opCode) {
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

        animate();
        triggerAutoSave();
    }, true);
}



/**
 *  When you change trs from axes controls then automatically the GUI and the php form are updated
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
    if (transform_controls.object.rotation.x*180/Math.PI !== gui_controls_funs.dg_r1){
        gui_controls_funs.dg_r1 = transform_controls.object.rotation.x * 180/Math.PI;

        envir.scene.dispatchEvent({ type: "modificationPendingSave" });
    }

    //---------rotate_y -------------------------------
    if (transform_controls.object.rotation.y*180/Math.PI !== this.dg_r2){
        gui_controls_funs.dg_r2 = transform_controls.object.rotation.y * 180/Math.PI;

        envir.scene.dispatchEvent({type:"modificationPendingSave"});
    }

    //---------rotate_z -------------------------------
    if (transform_controls.object.rotation.z*180/Math.PI !== gui_controls_funs.dg_r3){
        gui_controls_funs.dg_r3 = transform_controls.object.rotation.z * 180/Math.PI;

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

    // lil-gui: updateDisplay() reads from the bound object and formats with .decimals(2)
    for (let c = 0; c < 9; c++) {
        dg_controller[c].updateDisplay();
    }

    updatePositionsPhpAndJavsFromControlsAxes();
}
