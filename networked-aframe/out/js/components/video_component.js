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
        let video_border_id = "#video-border_" + data.id;
        let vid_panel_id = "#vid-panel_" + data.id;

        let videoDisplay = document.querySelector(video_display_id);
        let videoPanel = document.querySelector(vid_panel_id);
        let videoBorder = document.querySelector(video_border_id);




        let fsEl = document.querySelector("#ent_fs_" + data.id);
        let plEl = document.querySelector("#ent_pl_" + data.id);
        let exEl = document.querySelector("#ent_ex_" + data.id);
        let titEl = document.querySelector("#ent_tit_" + data.id);
        let backgroundEl = document.querySelector('#aframe-scene-container');

        let playerEl = document.querySelector('#cameraA');
        let rightHand = document.querySelector('#oculusRight');
        
        let cam = document.querySelector("#cameraA");
        let camRig = document.querySelector("#camera-rig");

        let media_panel = document.getElementById("mediaPanel");
        let recording_controls = document.getElementById("upload-recording-btn");

        cam.add(videoPanel);




        const entCollection = document.getElementsByClassName("hideable");


        video.addEventListener("ended", (e) => {
            playUpd(plEl);

        })

        function restoreVidPos(border, disp, panel) {
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

            restoreVidPos(videoBorder, videoDisplay, videoPanel);
        });



        let visCollection = [];
        let height = 15;
        let width = 20;
        let dist = 25;

        function addToCam(obj, non_visible, trans, opac) {

            if (non_visible) {
                obj.object3D.renderOrder = 9999999;
                //clipIntersection
                obj.components.material.material.depthTest = false;
                obj.components.material.material.transparent = trans;
                obj.components.material.material.opacity = opac;

                obj.setAttribute("visible", "true");
                obj.setAttribute("scale", "1 1 1");

            }
            else {
                obj.setAttribute("visible", "false");
                obj.setAttribute("scale", "0.001 0.001 0.001");

            }

        };

        function addToCamText(obj, non_visible, trans, opac) {
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

        exEl.addEventListener("mouseup", function (event) {
            addToCam(videoPanel, false, true, 0.3);
            if (video.paused) {
                console.log("Video Paused. Exiting...")

            }
            else {
                video.pause();

            }
            videoDisplay.classList.remove("non-clickable");
            videoPanel.classList.remove("non-clickable");
            backgroundEl.setAttribute("raycaster","objects: .raycastable");
            if(rightHand)
                rightHand.setAttribute("raycaster","objects: .raycastable");
        });



        fsEl.addEventListener("mouseup", function (event) {

            let projType = backgroundEl.getAttribute("scene-settings").pr_type;
           
            if (projType != "vrexpo_games")
            {
          
                //cam.setAttribute("position", "0 0 0");
                media_panel.setAttribute( "style", 'visibility: hidden;' );
                recording_controls.setAttribute('style', 'visibility: hidden;');
            }


            cam.setAttribute("camera", "fov", 2 * Math.atan((height / 2) / (dist)) * (180 / Math.PI));
            backgroundEl.setAttribute("background", "color", "black");
            backgroundEl.setAttribute("overlay", "");


            cam.add(videoBorder);
            cam.add(videoDisplay);
            videoBorder.setAttribute("height", "15");
            videoBorder.setAttribute("width", "20");
            videoDisplay.setAttribute("height", "15");
            videoDisplay.setAttribute("width", "20");
            videoBorder.setAttribute("position", "0 0 -25");
            videoDisplay.setAttribute("position", "0 0 -25");
            videoBorder.setAttribute("scale", "1 1 1");
            videoDisplay.setAttribute("scale", "1 1 1");
            videoBorder.setAttribute("rotation", "0 0 0");
            videoDisplay.setAttribute("rotation", "0 0 0");
            console.log(videoBorder);

            if (video.paused) {
                video.play();

            }
            for (let i = 0; i < entCollection.length; i++) {

                if (entCollection[i] !=videoDisplay){
                    entCollection[i].setAttribute("visible", "false");
                    console.log(entCollection[i].getAttribute("visible"));
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

        function restoreVid(){
            let projType = backgroundEl.getAttribute("scene-settings").pr_type;
           
            if (projType != "vrexpo_games")
            {
                cam.setAttribute("position", "0 0.6 0");
                media_panel.setAttribute( "style", 'visibility: visible;' );        //TODO change based on project type
                recording_controls.setAttribute('style', 'visibility: visible;');
            }

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
            backgroundEl.add(videoBorder);
            backgroundEl.add(videoDisplay);
            let p_x = data.orig_pos[0] + ' ' + data.orig_pos[1] + ' ' + data.orig_pos[2];
            let r_x = data.orig_rot[0] * (180 / Math.PI) + ' ' + data.orig_rot[1] * (180 / Math.PI) + ' ' + data.orig_rot[2] * (180 / Math.PI);


            videoBorder.setAttribute("height", "3");
            videoBorder.setAttribute("width", "4");

            videoDisplay.setAttribute("height", "3");
            videoDisplay.setAttribute("width", "4");
            videoBorder.setAttribute("position", p_x);
            videoDisplay.setAttribute("position", p_x);
            videoBorder.setAttribute("scale", videoBorder.getAttribute("original-scale"));
            videoDisplay.setAttribute("scale", videoBorder.getAttribute("original-scale"));

            videoBorder.setAttribute("rotation", r_x);
            videoDisplay.setAttribute("rotation", r_x);
            //videoDisplay.setAttribute("position", "%s %s %s", p_x, p_y, p_z);
            console.log(videoBorder.getAttribute("rotation"));
            console.log(data.orig_rot[0] + " " + data.orig_rot[1] + " " + data.orig_rot[2]);
            visCollection = [];
        }
        if (video.getAttribute("src")){
            videoBorder.addEventListener("click", function (event) {
                addToCam(videoPanel, true, true, 1);
                addToCam(fsEl, true, true, 1);
                addToCam(plEl, true, true, 1);
                addToCam(exEl, true, true, 1);
                addToCamText(titEl, true, true, 1);
                videoDisplay.classList.add("non-clickable");
                videoPanel.classList.add("non-clickable");
                backgroundEl.setAttribute("raycaster","objects: .non-clickable");
                if(rightHand)
                    rightHand.setAttribute("raycaster","objects: .non-clickable");
                playUpd(plEl);

                if (video.paused) {
                    console.log("border clicked");
                }
                else if (video.play){
                    restoreVid();
                }
                if (video.ended){
                    restoreVid();
                }
            });
        }

    }

});