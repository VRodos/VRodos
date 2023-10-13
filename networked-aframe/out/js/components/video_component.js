AFRAME.registerComponent('video-controls', {
    schema: {
        id: { default: "default value" },
        orig_pos: {
            'parse': function (val) {
                return val.split(',');
            }
        },
        orig_rot: {
            'parse': function (val) {
                return val.split(',');
            }
        }
    },
    init: function () {


        let data = this.data;
        let video_id = "#video_" + data.id;
        let video = document.querySelector(video_id);

        let video_display_id = "#video-display_" + data.id;
        let vid_panel_id = "#vid-panel_" + data.id;

        let videoDisplay = document.querySelector(video_display_id);
        let videoPanel = document.querySelector(vid_panel_id);
        let fsEl = document.querySelector("#ent_fs_" + data.id);
        let plEl = document.querySelector("#ent_pl_" + data.id);
        let pauseEl = document.querySelector("#ent_ex_" + data.id);
        let exEl = document.querySelector("#ent_ex_" + data.id);
        let exFrameEl = document.querySelector("#exit_vid_panel_" + data.id);
        let titEl = document.querySelector("#ent_tit_" + data.id);
        let backgroundEl = document.querySelector('#aframe-scene-container');
        let playerEl = document.querySelector('#cameraA');
        let rightHand = document.querySelector('#oculusRight');

        let cam = document.querySelector("#cameraA");
        let camRig = document.querySelector("#camera-rig");

        let media_panel = document.getElementById("mediaPanel");
        let recording_controls = document.getElementById("upload-recording-btn");

        let assets = document.getElementById("scene-assets");

        let panel_pos_dynamic;
        let is_fs = false;
        let panel_z = -1;

       
        if(video.getAttribute("autoplay-manual") == "true")
            video.play();
        

        const visibleHeightAtZDepth = ( depth ) => {
            const camera = AFRAME.scenes[0].camera;
            // compensate for cameras not positioned at z=0
            const cameraOffset = camera.position.z;
            if ( depth < cameraOffset ) depth -= cameraOffset;
            else depth += cameraOffset;
          
            // vertical fov in radians
            const vFOV = camera.fov * Math.PI / 180; 
            //const vFOV = 60 * Math.PI / 180;        //FoV should be taken from camera but in extreme cases the fov is not restored on time
          
            // Math.abs to ensure the result is always positive
            return 2 * Math.tan( vFOV / 2 ) * Math.abs( depth );
          };
          
        const visibleWidthAtZDepth = ( depth ) => {
            const camera = AFRAME.scenes[0].camera;
            const height = visibleHeightAtZDepth( depth, camera );
            let width = height * camera.aspect;
            return width;
        };



        cam.add(videoPanel);
        




        const entCollection = document.getElementsByClassName("hideable");


        video.addEventListener("ended", (e) => {
            playUpd(plEl);

        })

        function restoreVidPos(border, panel) {
            let offsetX = 20;


            var curr_rot = border.getAttribute('rotation');

            border.object3D.rotation.set(
                THREE.MathUtils.degToRad(0),
                THREE.MathUtils.degToRad(0),
                THREE.MathUtils.degToRad(0)
            );

            border.object3D.rotation.set(
                THREE.MathUtils.degToRad(data.orig_rot[0] * (180 / Math.PI)),
                THREE.MathUtils.degToRad(data.orig_rot[1] * (180 / Math.PI)),
                THREE.MathUtils.degToRad(data.orig_rot[2] * (180 / Math.PI))
            );

        }


        backgroundEl.addEventListener('loaded', function () {

            restoreVidPos(videoDisplay, videoPanel);
        });



        let visCollection = [];
        let height = 15;
        let width = 20;
        let dist = 25;

        function handleCamEntity(obj, non_visible, trans, opac) {

            // backgroundEl.renderer.sortObjects = true;
            
            if (non_visible) {
                obj.object3D.renderOrder = 9999999;
                //clipIntersection
                obj.components.material.material.depthTest = false;
                obj.components.material.material.transparent = trans;
                obj.components.material.material.opacity = opac;
                // if(obj == lineEl){
                //     obj.object3D.renderOrder = 999999999999;
                //     obj.components.material.material.transparent = false;
                // }
                

                obj.setAttribute("visible", "true");
                obj.setAttribute("scale", "1 1 1");

            }
            else {
                obj.setAttribute("visible", "false");
                obj.setAttribute("scale", "0.001 0.001 0.001");

            }

        };

        function handleCamEntityText(obj, non_visible, trans, opac) {
            if (non_visible) {
                obj.object3D.renderOrder = 9999999;
                //clipIntersection
                obj.components.text.material.depthTest = false;
                obj.components.text.material.transparent = trans;
                obj.components.text.material.opacity = opac;

                obj.setAttribute("visible", "true");
                obj.setAttribute("scale", "1 1 1");
            }
            else {
                obj.setAttribute("visible", "false");
                obj.setAttribute("scale", "0.001 0.001 0.001");

            }

        };
        function playUpd(obj) {
            if (video.paused) {
                obj.setAttribute("src", "#video_pl_" + data.id);
                
            }
            else {
                obj.setAttribute("src", "#video_pas_" + data.id);
                
            }
            obj.setAttribute("material", "depthTest: false");
            obj.setAttribute("material", "transparent: true");
            obj.setAttribute("material", "opacity: 1");

        };

        plEl.addEventListener("mouseup", function (event) {
            if (video.paused) {
                video.play();
                
            }
            else {
                video.pause();

            }
            playUpd(plEl);

        });
        exFrameEl.addEventListener("mouseup", function (event) {
           
            videoPanel.setAttribute("position", panel_pos_dynamic);
            handleCamEntity(videoPanel, false, true, 0.3);
            if (video.paused) {
                console.log("Video Paused. Exiting...")

            }
            else {
                video.pause();

            }
            // videoDisplay.classList.remove("non-clickable");
            // videoPanel.classList.remove("non-clickable");

         
            
            backgroundEl.setAttribute("raycaster","objects: .raycastable");
            if(rightHand)
                rightHand.setAttribute("raycaster","objects: .raycastable");
        });

        exEl.addEventListener("mouseup", function (event) {
           
            videoPanel.setAttribute("position", panel_pos_dynamic);
            handleCamEntity(videoPanel, false, true, 0.3);
            // if (video.paused) {
            //     console.log("Video Paused. Exiting...")

            // }
            // else {
            //     video.pause();

            // }
            // videoDisplay.classList.remove("non-clickable");
            // videoPanel.classList.remove("non-clickable");

         
            
            backgroundEl.setAttribute("raycaster","objects: .raycastable");
            if(rightHand)
                rightHand.setAttribute("raycaster","objects: .raycastable");
        });



        fsEl.addEventListener("mouseup", function (event) {

            is_fs = true;
            let projType = backgroundEl.getAttribute("scene-settings").pr_type;
            
    
            if (projType != "vrexpo_games")
            {

                //cam.setAttribute("position", "0 0 0");
                media_panel.setAttribute( "style", 'visibility: hidden;' );
                recording_controls.setAttribute('style', 'visibility: hidden;');
            }

            if(backgroundEl.getAttribute("scene-settings").selChoice == "2"){
                backgroundEl.setAttribute("environment", "preset", "default");
                backgroundEl.setAttribute("environment", "ground", "none");
                //backgroundEl.setAttribute("environment", "dressing", "none");
                //backgroundEl.setAttribute("environment", "playArea", "10");
                // backgroundEl.setAttribute("environment", "dressingAmount", "0");
                
            }

            
            backgroundEl.setAttribute("background", "color", "black");
            backgroundEl.setAttribute("overlay", "");
            videoDisplay.classList.add("non-clickable");
            // videoPanel.classList.add("non-clickable");
            cam.add(videoDisplay);
            videoDisplay.setAttribute("height", visibleHeightAtZDepth(-25));
            videoDisplay.setAttribute("width", visibleWidthAtZDepth(-25));
            videoDisplay.setAttribute("position", "0 0 -25");
            videoDisplay.setAttribute("scale", "1 1 1");
            videoDisplay.setAttribute("rotation", "0 0 0");

            handleCamEntity(videoPanel, false, true, 1);
            handleCamEntity(fsEl, false, true, 1);
            handleCamEntity(plEl, false, true, 1);
            handleCamEntity(exEl, false, true, 1);
            // handleCamEntity(lineEl, false, true, 1);
            handleCamEntityText(titEl, false, true, 1);

            if (video.paused) {
                video.play();

            }
            for (let i = 0; i < entCollection.length; i++) {

                if (entCollection[i] !=videoDisplay){
                    entCollection[i].setAttribute("visible", "false");
                    entCollection[i].setAttribute("scale", "0.00001 0.00001 0.00001");
                }

                visCollection.push(i);
            }
            if (playerEl.getAttribute("wasd-controls")){
                playerEl.setAttribute("wasd-controls", "fly: false; acceleration:0");
            }else
                cam.setAttribute("wasd-controls-enabled", "false");
            playUpd(plEl);
        });

        function removeVRTraces(){
            restoreVid();
            // panel_pos_dynamic =  (visibleWidthAtZDepth(panel_z)/2 - 0.3) + " " + "0" + " " + panel_z;
            // videoPanel.setAttribute("position", panel_pos_dynamic);
            handleCamEntity(videoPanel, false, true, 0.3);
            if (video.paused) {
                console.log("Video Paused. Exiting...")

            }
            else {
                video.pause();

            }
            // videoDisplay.classList.remove("non-clickable");
            // videoPanel.classList.remove("non-clickable");
            backgroundEl.setAttribute("raycaster","objects: .raycastable");
            if(rightHand)
                rightHand.setAttribute("raycaster","objects: .raycastable");

        }
        function restorePanel(){
            
            handleCamEntity(videoPanel, true, true, 1);
            handleCamEntity(fsEl, true, true, 1);
            handleCamEntity(plEl, true, true, 1);
            handleCamEntity(exEl, true, true, 1);
            // handleCamEntity(lineEl, true, true, 1);
            handleCamEntityText(titEl, true, true, 1);
            videoPanel.setAttribute("position", panel_pos_dynamic);
            
            // videoDisplay.classList.remove("raycastable");
            backgroundEl.setAttribute("raycaster","objects: .non-clickable");
            if(rightHand)
                rightHand.setAttribute("raycaster","objects: .non-clickable");
            playUpd(plEl);
        }

        function restoreVid(){




            let projType = backgroundEl.getAttribute("scene-settings").pr_type;

            if (projType != "vrexpo_games")
            {
                cam.setAttribute("position", "0 0.6 0");
                media_panel.setAttribute( "style", 'visibility: visible;' );        //TODO change based on project type
                recording_controls.setAttribute('style', 'visibility: visible;');
            }

            if(backgroundEl.getAttribute("scene-settings").selChoice == "2")
                backgroundEl.setAttribute("environment", "ground", "flat");

            cam.setAttribute("camera", "fov", 60);
            let bcgCol = backgroundEl.getAttribute("scene-settings").color;
            backgroundEl.setAttribute("background", "color", bcgCol);
            for (let i = 0; i < visCollection.length; i++) {
                entCollection[visCollection[i]].setAttribute("visible", "true");
                if (entCollection[visCollection[i]].getAttribute("original-scale"))
                    entCollection[visCollection[i]].setAttribute("scale", entCollection[visCollection[i]].getAttribute("original-scale"));    //TODO: incorporate asset manager solution to avoid this
                else
                    entCollection[visCollection[i]].setAttribute("scale", "1 1 1");
            }

            if (playerEl.getAttribute("wasd-controls")){
                playerEl.setAttribute("wasd-controls", "fly: false; acceleration:20");
            }else
                cam.setAttribute("wasd-controls-enabled", "true");
            //playerEl.setAttribute("look-controls", "enabled: true");
            backgroundEl.add(videoDisplay);
            let p_x = data.orig_pos[0] + ' ' + data.orig_pos[1] + ' ' + data.orig_pos[2];
            let r_x = data.orig_rot[0] * (180 / Math.PI) + ' ' + data.orig_rot[1] * (180 / Math.PI) + ' ' + data.orig_rot[2] * (180 / Math.PI);


            videoDisplay.setAttribute("height", "3");
            videoDisplay.setAttribute("width", "4");
            videoDisplay.setAttribute("position", p_x);
            videoDisplay.setAttribute("scale", videoDisplay.getAttribute("original-scale"));

            videoDisplay.setAttribute("rotation", r_x);
            //videoDisplay.setAttribute("position", "%s %s %s", p_x, p_y, p_z);
            visCollection = [];
        }
        document.querySelector('a-scene').addEventListener('exit-vr',  function () {
            removeVRTraces()
        });
     

       
        if (video.getAttribute("src")){

            videoDisplay.addEventListener("click", function (event) {

                panel_pos_dynamic =  (visibleWidthAtZDepth(panel_z)/2 - 0.3) + " " + "0" + " " + panel_z; //From rightmost position  subtract panel width (0.2) and padding
                
                if (!browsingModeVR) {

                    let video_element = document.getElementById("video-panel-video");
                    video_element.innerHTML = '';
                    let video_source = document.createElement('source');
                    let video_file_url = video.getAttribute("src");

                    video_source.setAttribute('src', video_file_url );
                    video_source.setAttribute('type', 'video/'+ video_file_url.split('.')[1]);
                    video_element.appendChild(video_source);

                    let video_dialog_element = new mdc.dialog.MDCDialog(document.querySelector('#video-controls-dialog'));

                    let closeDialogListener = function(event) {
                        video_element.pause();
                        video_dialog_element.unlisten("MDCDialog:cancel", closeDialogListener);
                    };
                    video_dialog_element.show();
                    video_dialog_element.listen("MDCDialog:cancel", closeDialogListener);


                } else {
                    
                    restorePanel();
                    if(is_fs){
                        restoreVid();
                        is_fs = false;
                        videoDisplay.classList.remove("non-clickable");

                        let orig_preset = backgroundEl.getAttribute("scene-settings").presChoice; 
                        if(backgroundEl.getAttribute("scene-settings").selChoice == "2"){
                            backgroundEl.setAttribute("environment", "preset", orig_preset);
                            backgroundEl.setAttribute("environment", "ground", "flat");
                        }
                    }
                    
                    
                }
            });
        }

    }

});