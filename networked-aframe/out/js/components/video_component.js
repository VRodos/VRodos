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

        this.video_id = "#video_" + this.data.id;
        this.video = document.querySelector(this.video_id);
        this.video_display_id = "#video-display_" + this.data.id;
        this.vid_panel_id = "#vid-panel_" + this.data.id;
        this.videoDisplay = document.querySelector(this.video_display_id);
        this.videoPanel = document.querySelector(this.vid_panel_id);
        this.fsEl = document.querySelector("#ent_fs_" + this.data.id);
        this.plEl = document.querySelector("#ent_pl_" + this.data.id);
        this.pauseEl = document.querySelector("#ent_ex_" + this.data.id);
        this.exEl = document.querySelector("#ent_ex_" + this.data.id);
        this.exFrameEl = document.querySelector("#exit_vid_panel_" + this.data.id);
        this.titEl = document.querySelector("#ent_tit_" + this.data.id);
        this.backgroundEl = document.querySelector('#aframe-scene-container');
        this.cursorEl = document.querySelector('#cursor');
        this.playerEl = document.querySelector('#cameraA');
        this.rightHand = document.querySelector('#oculusRight');
        this.cam = document.querySelector("#cameraA");
        this.media_panel = document.getElementById("mediaPanel");
        this.recording_controls = document.getElementById("upload-recording-btn");
        this.panel_pos_dynamic;
        this.is_fs = false;
        this.panel_z = -1;
        this.restorePanel = this.restorePanel.bind(this);
        this.restoreVid = this.restoreVid.bind(this);
        this.removeVRTraces = this.removeVRTraces.bind(this);
        this.visCollection = [];

        this.panelElems = [this.videoPanel, this.fsEl, this.plEl, this.exEl, this.exFrameEl];
        document.querySelector('a-scene').addEventListener('exit-vr', this.removeVRTraces);

        if(this.video.getAttribute("autoplay-manual") == "true"){
            this.video.play();
        }else{
            this.videoDisplay.classList.add("raycastable");                    
        }
             
        this.visibleHeightAtZDepth = ( depth ) => {
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
          
        this.visibleWidthAtZDepth = ( depth ) => {
            const camera = AFRAME.scenes[0].camera;
            const height = this.visibleHeightAtZDepth( depth, camera );
            let width = height * camera.aspect;
            return width;
        };

        this.cam.add(this.videoPanel);

        this.entCollection = document.getElementsByClassName("hideable");

        this.video.addEventListener("ended", (e) => {
            this.playUpd(this.plEl);
        });
        
        if (this.video.getAttribute("src")){
            this.onVideoClick = this.onVideoClick.bind(this);
            this.exitPanel = this.exitPanel.bind(this);
            this.playVideo = this.playVideo.bind(this);
            this.onFullScreenClick = this.onFullScreenClick.bind(this);
            this.videoDisplay.addEventListener('click', this.onVideoClick);
        }
    },

    removeVRTraces: function(evt){
        this.exEl.removeEventListener('click', this.exitPanel);
        this.exFrameEl.removeEventListener('click', this.exitPanel);
        this.plEl.removeEventListener('click', this.playVideo);
        this.fsEl.removeEventListener('click', this.onFullScreenClick);

        this.handleCamEntity = this.handleCamEntity.bind(this);
        this.handleCamEntityText = this.handleCamEntityText.bind(this);
        this.playUpd = this.playUpd.bind(this); 
        this.restoreVid();
        this.panelElems.map((elem) => this.handleCamEntity(elem, false, true, 1));
        this.handleCamEntityText(this.titEl, false, true, 1);
        if (this.video.paused) {
            console.log("Video Paused. Exiting...")
        }
        else {
            this.video.pause();
        }
        this.cursorEl.setAttribute("raycaster","objects: .raycastable");
        if(this.rightHand)
            this.rightHand.setAttribute("raycaster","objects: .raycastable");

        browsingModeVR = false;

        if(this.is_fs){
            this.is_fs = false;
            this.videoDisplay.classList.remove("non-clickable");
            let orig_preset = this.backgroundEl.getAttribute("scene-settings").presChoice; 
            if(this.backgroundEl.getAttribute("scene-settings").selChoice == "2" && orig_preset != "ocean"){
                this.backgroundEl.setAttribute("environment", "preset", orig_preset);
                this.backgroundEl.setAttribute("environment", "ground", "flat");
            }else if(this.backgroundEl.getAttribute("scene-settings").selChoice == "2" && orig_preset == "ocean"){
                const oceanCollection = document.getElementsByClassName("ocean_asset");
                for (let i = 0; i < oceanCollection.length; i++) {
                    oceanCollection[i].setAttribute("visible", "true");          
                }
                this.backgroundEl.setAttribute("fog","type: exponential; color: #0894d3; density: 0.06;");
            }
        }
    },

    playUpd: function(obj) {
        if (this.video.paused) {
            obj.setAttribute("src", "#video_pl_" + this.data.id);   
        }
        else {
            obj.setAttribute("src", "#video_pas_" + this.data.id);
        }
        obj.setAttribute("material", "depthTest: false");
        obj.setAttribute("material", "transparent: true");
        obj.setAttribute("material", "opacity: 1");
    },

    playVideo: function(event) {
        if (this.video.paused) {
            this.video.play();
        }
        else {
            this.video.pause();
        }
        this.playUpd(this.plEl);
    },

    exitPanel: function (event) {
        this.exEl.removeEventListener('click', this.exitPanel);
        this.exFrameEl.removeEventListener('click', this.exitPanel);
        this.plEl.removeEventListener('click', this.playVideo);
        this.fsEl.removeEventListener('click', this.onFullScreenClick);
        this.handleCamEntity = this.handleCamEntity.bind(this);

        this.handleCamEntityText = this.handleCamEntityText.bind(this);
        this.playUpd = this.playUpd.bind(this);
        this.videoPanel.setAttribute("position", this.panel_pos_dynamic);
        this.panelElems.map((elem) => this.handleCamEntity(elem, false, true, 1));
        this.handleCamEntityText(this.titEl, false, true, 1);

        if (this.video.paused) {
            console.log("video Paused. Exiting...");
        }
        else {
            this.video.pause();
        }
        this.cursorEl.setAttribute("raycaster","objects: .raycastable");
        if(this.rightHand)
            this.rightHand.setAttribute("raycaster","objects: .raycastable");
    },

    handleCamEntityText: function (obj, non_visible, trans, opac) {
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
            obj.setAttribute("scale", "0.0001 0.0001 0.0001");
        }
    },
    
    restorePanel: function (){
        this.handleCamEntity = this.handleCamEntity.bind(this);
        this.handleCamEntityText = this.handleCamEntityText.bind(this);
        this.playUpd = this.playUpd.bind(this);
        this.panelElems.map((elem) => this.handleCamEntity(elem, true, true, 1));
        this.handleCamEntityText(this.titEl, true, true, 1);
        
        this.videoPanel.setAttribute("position", this.panel_pos_dynamic);
        this.cursorEl.setAttribute("raycaster","objects: .non-clickable");
        if(this.rightHand)
            this.rightHand.setAttribute("raycaster","objects: .non-clickable");
        this.playUpd(this.plEl);

        this.exEl.addEventListener('click', this.exitPanel);
        this.exFrameEl.addEventListener('click', this.exitPanel);
        this.plEl.addEventListener('click', this.playVideo);
        this.fsEl.addEventListener('click', this.onFullScreenClick);
    },

    restoreVid: function(){
        this.restorePanel = this.restorePanel.bind(this);
        let projType = this.backgroundEl.getAttribute("scene-settings").pr_type;
        if (projType != "vrexpo_games")
        {
            this.cam.setAttribute("position", "0 0.6 0");
            this.media_panel.setAttribute( "style", 'visibility: visible;' );        //TODO change based on project type
            this.recording_controls.setAttribute('style', 'visibility: visible;');
        }
        this.cam.setAttribute("camera", "fov", 60);
        let bcgCol = this.backgroundEl.getAttribute("scene-settings").color;
        this.backgroundEl.setAttribute("background", "color", bcgCol);
        for (let i = 0; i < this.visCollection.length; i++) {
            this.entCollection[this.visCollection[i]].setAttribute("visible", "true");
            if (this.entCollection[this.visCollection[i]].getAttribute("original-scale"))
                this.entCollection[this.visCollection[i]].setAttribute("scale", this.entCollection[this.visCollection[i]].getAttribute("original-scale"));    //TODO: incorporate asset manager solution to avoid this
            else
                this.entCollection[this.visCollection[i]].setAttribute("scale", "1 1 1");
        }

        if (this.playerEl.getAttribute("wasd-controls")){
            this.playerEl.setAttribute("wasd-controls", "fly: false; acceleration:20");
        }else
            this.cam.setAttribute("wasd-controls-enabled", "true");
        
        this.backgroundEl.add(this.videoDisplay);
        
        let p_x = this.data.orig_pos[0] + ' ' + this.data.orig_pos[1] + ' ' + this.data.orig_pos[2];
        let r_x = this.data.orig_rot[0] * (180 / Math.PI) + ' ' + this.data.orig_rot[1] * (180 / Math.PI) + ' ' + this.data.orig_rot[2] * (180 / Math.PI);

        this.videoDisplay.setAttribute("height", "3");
        this.videoDisplay.setAttribute("width", "4");
        this.videoDisplay.setAttribute("position", p_x);
        this.videoDisplay.setAttribute("scale", this.videoDisplay.getAttribute("original-scale"));
        this.videoDisplay.setAttribute("rotation", r_x);
        this.visCollection = [];
    },
    
    updatePlayEntity: function (obj) {
        if (this.video.paused) {
            obj.setAttribute("src", "#video_pl_" + this.data.id);          
        }
        else {
            obj.setAttribute("src", "#video_pas_" + this.data.id);     
        }
        obj.setAttribute("material", "depthTest: false");
        obj.setAttribute("material", "transparent: true");
        obj.setAttribute("material", "opacity: 1");
    },

    handleCamEntity: function (obj, non_visible, trans, opac) {
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
            obj.setAttribute("scale", "0.0001 0.0001 0.0001");
        }

    },
   
    onVideoClick:  function (evt) {
        
        this.panel_pos_dynamic =  (this.visibleWidthAtZDepth(this.panel_z)/2 - 0.3) + " " + "0" + " " + this.panel_z; //From rightmost position  subtract panel width (0.2) and padding
        this.restorePanel = this.restorePanel.bind(this);
        
        if (!browsingModeVR) {
            let video_element = document.getElementById("video-panel-video");
            video_element.innerHTML = '';
            let video_source = document.createElement('source');
            let video_file_url = this.video.getAttribute("src");

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
            this.restorePanel();
            if(this.is_fs){
                this.restoreVid();
                this.is_fs = false;
                this.videoDisplay.classList.remove("non-clickable");
                let orig_preset = this.backgroundEl.getAttribute("scene-settings").presChoice; 
                if(this.backgroundEl.getAttribute("scene-settings").selChoice == "2" && orig_preset != "ocean"){
                    this.backgroundEl.setAttribute("environment", "preset", orig_preset);
                    this.backgroundEl.setAttribute("environment", "ground", "flat");
                }else if(this.backgroundEl.getAttribute("scene-settings").selChoice == "2" && orig_preset == "ocean"){
                    const oceanCollection = document.getElementsByClassName("ocean_asset");
                    for (let i = 0; i < oceanCollection.length; i++) {
                        oceanCollection[i].setAttribute("visible", "true");          
                    }
                    this.backgroundEl.setAttribute("fog","type: exponential; color: #0894d3; density: 0.06;");
                }
            }
        }
    },
    
    onFullScreenClick:  function (evt) {
        this.is_fs = true;
        let projType = this.backgroundEl.getAttribute("scene-settings").pr_type;
        let selPreset = this.backgroundEl.getAttribute("scene-settings").presChoice;
        this.fsEl = document.querySelector("#ent_fs_" + this.data.id);
        this.plEl = document.querySelector("#ent_pl_" + this.data.id);
        this.pauseEl = document.querySelector("#ent_ex_" + this.data.id);
        this.exEl = document.querySelector("#ent_ex_" + this.data.id);
        this.exFrameEl = document.querySelector("#exit_vid_panel_" + this.data.id);
        this.titEl = document.querySelector("#ent_tit_" + this.data.id);        
        this.updatePlayEntity = this.updatePlayEntity.bind(this);
        this.handleCamEntity = this.handleCamEntity.bind(this);
        
        this.visibleHeightAtZDepth = ( depth ) => {
            const camera = AFRAME.scenes[0].camera;
            const cameraOffset = camera.position.z;
            if ( depth < cameraOffset ) depth -= cameraOffset;
            else depth += cameraOffset;
            const vFOV = camera.fov * Math.PI / 180; 
            return 2 * Math.tan( vFOV / 2 ) * Math.abs( depth );
          };
          
        this.visibleWidthAtZDepth = ( depth ) => {
            const camera = AFRAME.scenes[0].camera;
            const height = this.visibleHeightAtZDepth( depth, camera );
            let width = height * camera.aspect;
            return width;
        };

        if (projType != "vrexpo_games")
        {
            this.media_panel.setAttribute( "style", 'visibility: hidden;' );
            this.recording_controls.setAttribute('style', 'visibility: hidden;');
        }

        if(this.backgroundEl.getAttribute("scene-settings").selChoice == "2" && selPreset != "ocean"){
            this.backgroundEl.setAttribute("environment", "preset", "default");
            this.backgroundEl.setAttribute("environment", "ground", "none");
        }else if(this.backgroundEl.getAttribute("scene-settings").selChoice == "2" && selPreset == "ocean"){
            this.backgroundEl.setAttribute("fog","type: linear; color: #AAB; far: 230; near: 0");
            const oceanCollection = document.getElementsByClassName("ocean_asset");

            for (let i = 0; i < oceanCollection.length; i++) {
                oceanCollection[i].setAttribute("visible", "false");  
            }
        }

        this.backgroundEl.setAttribute("background", "color", "black");
        this.backgroundEl.setAttribute("overlay", "");
        this.videoDisplay.classList.add("non-clickable");
        this.cam.add(this.videoDisplay);        
        this.videoDisplay.setAttribute("height", this.visibleHeightAtZDepth(-25));
        this.videoDisplay.setAttribute("width", this.visibleWidthAtZDepth(-25));
        this.videoDisplay.setAttribute("position", "0 0 -25");
        this.videoDisplay.setAttribute("scale", "1 1 1");
        this.videoDisplay.setAttribute("rotation", "0 0 0");
        
        this.panelElems.map((elem) => this.handleCamEntity(elem, false, true, 1));
        this.handleCamEntityText(this.titEl, false, true, 1);

        if (this.video.paused) {
            this.video.play();
        }
        
        for (let i = 0; i < this.entCollection.length; i++) {

            if (this.entCollection[i] !=this.videoDisplay){
                this.entCollection[i].setAttribute("visible", "false");
                this.entCollection[i].setAttribute("scale", "0.00001 0.00001 0.00001");
            }
            this.visCollection.push(i);
        }
        if (this.playerEl.getAttribute("wasd-controls")){
            this.playerEl.setAttribute("wasd-controls", "fly: false; acceleration:0");
        }else
            this.cam.setAttribute("wasd-controls-enabled", "false");
            this.updatePlayEntity(this.plEl);
    }
});