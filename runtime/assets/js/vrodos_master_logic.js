/**
 * VRodos Master Client Utility Logic
 */

// Vector update logic for NAF rotation components
const vectorRequiresUpdateRotation = epsilon => {
    return () => {
        let prev = null;
        return curr => {
            if (prev === null) {
                prev = new THREE.Vector3(curr.x, curr.y, curr.z);
                return true;
            } else if (!NAF.utils.almostEqualVec3(prev, curr, epsilon)) {
                curr.x = 0;
                prev.copy(curr);
                return true;
            }
            return false;
        };
    };
};

// Global interaction mode flag
let browsingModeVR = false;

// Shared utility for random colors
window.ntExample = window.ntExample || {
    randomColor: () => {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }
};

/**
 * Avatar Selection
 */
window.selectAvatarType = (val) => {
    let radioVal = val ? val : document.querySelector('input[name="avatar-radios"]:checked').value;
    const cameraA = document.getElementById('cameraA');
    if (cameraA) {
        cameraA.setAttribute('player-info', 'avatarType', radioVal);
    }
};

/**
 * NAF Schema Registration
 */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof NAF !== 'undefined') {
        // Backup original if not already done
        if (!NAF.schemas.getComponentsOriginal) {
            NAF.schemas.getComponentsOriginal = NAF.schemas.getComponents;
        }

        NAF.schemas.getComponents = (template) => {
            if (!NAF.schemas.hasTemplate('#avatar-template-expo')) {
                NAF.schemas.add({
                    template: '#avatar-template-expo',
                    components: [
                        'position',
                        'player-info',
                        'avatar-movement-info',
                        {
                            selector: '.rpm_avatar',
                            component: 'gltf-model',
                        },
                        {
                            component: 'rotation',
                            requiresNetworkUpdate: vectorRequiresUpdateRotation(0.5)
                        }
                    ]
                });
            }
            return NAF.schemas.getComponentsOriginal(template);
        };
    }
});

/**
 * Network Events
 */
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('clientConnected', function (evt) {
        // Force sync for late joiners
        let myCam = document.getElementById('cameraA');
        if (myCam && myCam.components['player-info'] && myCam.components.networked) {
            myCam.components.networked.syncAll(evt.detail.clientId, true);
        }
    });
});

// Called by Networked-Aframe when connected to server
function connectionResolve() {
    onConnect();
}

function onConnect() {
    const screenBtnEle = document.getElementById('screen-btn-sendscreen');
    if (screenBtnEle) {
        screenBtnEle.addEventListener('click', function () {
            navigator.mediaDevices.getDisplayMedia({
                preferCurrentTab: true,
                selfBrowserSurface: 'include',
                audio: true
            }).then((stream) => {
                if (NAF.connection.adapter.addLocalMediaStream) {
                    NAF.connection.adapter.addLocalMediaStream(stream, "screen");
                }
            });
        });
    }
}

/**
 * Dat.GUI Controls for Networked Video
 */
const api_pattern_single = {
    ThresholdMin: 0.106,
    ThresholdMax: 0.13,
    red: 48, green: 146, blue: 89,
    w: 1, h: 0.75,
    x: 0, y: 0, z: 0,
    rx: 0, ry: 0, rz: 0
};

const api_pattern_singleMin = {
    ThresholdMinLow: 0, ThresholdMaxLow: 0, redLow: 0, greenLow: 0, blueLow: 0,
    wLow: 0.1, hLow: 0.1, xLow: -100000, yLow: -100000, zLow: -100000,
    rxLow: -100, ryLow: -100, rzLow: -100
};

const api_pattern_singleMax = {
    ThresholdMinHigh: 0.4, ThresholdMaxHigh: 0.4, redHigh: 255, greenHigh: 255, blueHigh: 255,
    wHigh: 5, hHigh: 5, xHigh: 100000, yHigh: 100000, zHigh: 100000,
    rxHigh: 100, ryHigh: 100, rzHigh: 100
};

const api_pattern_singleStep = {
    ThresholdMinStep: 0.001, ThresholdMaxStep: 0.001, redStep: 1, greenStep: 1, blueStep: 1,
    wStep: 0.05, hStep: 0.05, xStep: 10, yStep: 10, zStep: 10,
    rxStep: 0.1, ryStep: 0.1, rzStep: 0.1
};

document.addEventListener('DOMContentLoaded', () => {
    let btStatusControls = document.getElementById('obtainStatusAndSetSizeControls');
    if (btStatusControls) {
        btStatusControls.addEventListener('click', function () {
            if (typeof window.NAF === 'undefined') return;

            let entities = window.NAF.connection.entities.entities;
            let panelsSizeControlsDiv = document.getElementById('panelsSizeControlsDiv');
            if (panelsSizeControlsDiv) panelsSizeControlsDiv.replaceChildren([]);

            try {
                if (btStatusControls.gui) btStatusControls.gui.destroy();
            } catch (e) { }

            if (typeof dat === 'undefined') return;
            btStatusControls.gui = new dat.GUI({ width: 200 });

            let elementsDatGui = [];
            let videoUserGui = [];
            let nActor = 0;

            if (entities) {
                let panel = {};
                for (let e in entities) {
                    let entityNode = window.NAF.connection.entities.entities[e];
                    if (!entityNode.childNodes || entityNode.childNodes.length < 2) continue;

                    let h = entityNode.childNodes[1].getAttribute('height');
                    if (h) {
                        nActor++;
                        videoUserGui[e] = btStatusControls.gui.addFolder(e);
                        panel[e] = entityNode.childNodes[0].id === "videoPlaneGreen" ?
                            entityNode.childNodes[0] : entityNode.childNodes[1];

                        elementsDatGui[e] = [];
                        for (let a in api_pattern_single) {
                            let L = a + "Low";
                            let H = a + "High";
                            let S = a + "Step";

                            elementsDatGui[e][a] = videoUserGui[e].add(api_pattern_single, a, api_pattern_singleMin[L], api_pattern_singleMax[H], api_pattern_singleStep[S]);

                            if (['w', 'h', 'x', 'y', 'z', 'rx', 'ry', 'rz'].some(p => a.startsWith(p))) {
                                elementsDatGui[e][a].panelaki = panel[e];
                                elementsDatGui[e][a].domElement.pName = e;
                                elementsDatGui[e][a].onChange(function () {
                                    let p = this.panelaki !== undefined ? this.panelaki : btStatusControls.gui.__folders[this.domElement.parentElement.pName].__controllers[5].panelaki;
                                    let prop = this.property;
                                    let val = api_pattern_single[prop];

                                    if (prop === 'w') p.setAttribute('width', val);
                                    else if (prop === 'h') p.setAttribute('height', val);
                                    else if (prop === 'x') p.getAttribute('position').x = val / 10000;
                                    else if (prop === 'y') p.getAttribute('position').y = val / 10000;
                                    else if (prop === 'z') p.getAttribute('position').z = val / 10000;
                                    else if (prop.startsWith('r')) {
                                        let rot = p.getAttribute('rotation');
                                        if (prop === 'rx') p.setAttribute('rotation', val + " " + rot.y + " " + rot.z);
                                        else if (prop === 'ry') p.setAttribute('rotation', rot.x + " " + val + " " + rot.z);
                                        else if (prop === 'rz') p.setAttribute('rotation', rot.x + " " + rot.y + " " + val);
                                    }
                                });
                            } else {
                                elementsDatGui[e][a].onChange(function () {
                                    let domAffected = document.getElementsByClassName("videoPlaneGreenClass")[elementsDatGui[e][a].nActor];
                                    if (domAffected) domAffected.setAttribute("networked-video-source", this.property, api_pattern_single[this.property]);
                                });
                            }
                            elementsDatGui[e][a].nActor = nActor - 1;
                        }
                    }
                }
            }
        });
    }
});

/**
 * Recording Controls
 */
let recordedBlob;

function startRecording(stream) {
    let recorder = new MediaRecorder(stream);
    let data = [];
    recorder.ondataavailable = event => data.push(event.data);
    recorder.start();
    let stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = event => reject(event.name);
    });
    return Promise.all([stopped]).then(() => data);
}

function stopRecording(stream) {
    stream.getTracks().forEach(track => track.stop());
    const recordBtn = document.getElementById('start-recording-btn');
    const downloadBtn = document.getElementById('download-recording-btn');
    const uploadBtn = document.getElementById('upload-recording-btn');
    if (recordBtn) recordBtn.disabled = false;
    if (downloadBtn) downloadBtn.style.visibility = 'visible';
    if (uploadBtn) uploadBtn.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
    let record_button = document.getElementById('start-recording-btn');
    let video_preview = document.getElementById('video-preview');
    let download_button = document.getElementById('download-recording-btn');
    let upload_button = document.getElementById('upload-recording-btn');
    let capture_label = document.getElementById('captured-video-label');
    let recording = document.getElementById('recording');

    if (record_button) {
        record_button.addEventListener("click", function () {
            if (capture_label) capture_label.innerHTML = '';
            navigator.mediaDevices.getDisplayMedia({
                preferCurrentTab: true,
                selfBrowserSurface: 'include',
                systemAudio: 'include',
                video: { cursor: 'never' },
                audio: true
            }).then(stream => {
                record_button.disabled = true;
                if (download_button) download_button.style.visibility = 'hidden';
                if (video_preview) {
                    video_preview.style.display = 'block';
                    video_preview.srcObject = stream;
                    video_preview.captureStream = video_preview.captureStream || video_preview.mozCaptureStream;
                    stream.getVideoTracks()[0].onended = function () {
                        video_preview.style.display = 'none';
                        stopRecording(video_preview.srcObject);
                    };
                    return new Promise(resolve => video_preview.onplaying = resolve);
                }
            }).then(() => startRecording(video_preview.captureStream()))
                .then(recordedChunks => {
                    recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
                    if (recording) recording.src = URL.createObjectURL(recordedBlob);
                    if (download_button) {
                        download_button.style.visibility = 'visible';
                        download_button.href = recording.src;
                        download_button.download = "RecordedVideo.webm";
                    }
                    if (upload_button) upload_button.href = recording.src;
                    if (capture_label) capture_label.innerHTML = "Recorded " + formatBytes(recordedBlob.size) + " of " + recordedBlob.type + " media.";
                });
        }, false);
    }

    if (upload_button) {
        upload_button.addEventListener("click", function () {
            upload_button.disabled = true;
            const mv_url = document.getElementById('node-url-input').value;
            const mv_token = document.getElementById('node-token-input').value;
            const mv_project_id = document.getElementById('mv-project-id-input').value;

            const video_file = new File([recordedBlob], 'vrodos-' + recordedBlob.size + '.webm', { type: recordedBlob.type });
            let formData = new FormData();
            formData.append('file', video_file);

            fetch(mv_url + '/dam/assets?description=' + 'Recorded video from VRodos' + '&externalTool=VRodos', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${mv_token}` },
                body: formData
            }).then(response => {
                if (response.ok) return response.json();
                upload_button.disabled = false;
                alert("There has been a problem uploading your video to MediaVerse platform");
            }).then(data => {
                if (!data) return;
                fetch(mv_url + '/dam/project/' + mv_project_id + '/projectOutput', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mv_token}` },
                    body: JSON.stringify({ "projectOutput": [data.key] })
                }).then(response => {
                    upload_button.disabled = false;
                    if (response.ok) alert('The video has been successfully uploaded to MediaVerse!');
                    else alert("There has been a problem uploading your video to MediaVerse platform");
                })
            });
        });
    }
});

/**
 * Screen & Layout Controls
 */
document.addEventListener('keydown', function (e) {
    if (e.keyCode === 88) { // 'X' key
        const actionsDiv = document.getElementById('actionsDiv');
        if (actionsDiv) actionsDiv.style.display = 'block';

        const datGui = document.getElementsByClassName('dg ac')[0];
        if (datGui) datGui.style.display = 'block';

        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitCancelFullScreen) document.webkitCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    let director_controls = document.getElementById("toggle_controls");
    if (director_controls) {
        director_controls.onclick = function () {
            const actionsDiv = document.getElementById('actionsDiv');
            if (actionsDiv) actionsDiv.style.display = 'none';

            const datGui = document.getElementsByClassName('dg ac')[0];
            if (datGui) datGui.style.display = 'none';

            let elem = document.body;
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
            else if (elem.webkitRequestFullScreen) elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
        };
    }
});

/**
 * Utility Functions
 */
const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
};

/**
 * Scene Initialization
 */
document.addEventListener('DOMContentLoaded', () => {
    const sceneAssets = document.querySelector('#scene-assets');
    if (sceneAssets) {
        sceneAssets.addEventListener('loaded', function () {
            // Don't show HTML component (chat) while loader is active
            const chatWrapper = document.getElementById("chat-wrapper-el");
            if (chatWrapper && chatWrapper.getAttribute('data-visible') === 'true') {
                chatWrapper.style.visibility = 'visible';
            }
        });
    }
});
