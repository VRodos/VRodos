/**
 * VRodos Master runtime bootstrap.
 */
/* global VRODOSMaster */

(function () {
    const apiPatternSingle = {
        ThresholdMin: 0.106,
        ThresholdMax: 0.13,
        red: 48,
        green: 146,
        blue: 89,
        w: 1,
        h: 0.75,
        x: 0,
        y: 0,
        z: 0,
        rx: 0,
        ry: 0,
        rz: 0
    };

    const apiPatternSingleMin = {
        ThresholdMinLow: 0,
        ThresholdMaxLow: 0,
        redLow: 0,
        greenLow: 0,
        blueLow: 0,
        wLow: 0.1,
        hLow: 0.1,
        xLow: -100000,
        yLow: -100000,
        zLow: -100000,
        rxLow: -100,
        ryLow: -100,
        rzLow: -100
    };

    const apiPatternSingleMax = {
        ThresholdMinHigh: 0.4,
        ThresholdMaxHigh: 0.4,
        redHigh: 255,
        greenHigh: 255,
        blueHigh: 255,
        wHigh: 5,
        hHigh: 5,
        xHigh: 100000,
        yHigh: 100000,
        zHigh: 100000,
        rxHigh: 100,
        ryHigh: 100,
        rzHigh: 100
    };

    const apiPatternSingleStep = {
        ThresholdMinStep: 0.001,
        ThresholdMaxStep: 0.001,
        redStep: 1,
        greenStep: 1,
        blueStep: 1,
        wStep: 0.05,
        hStep: 0.05,
        xStep: 10,
        yStep: 10,
        zStep: 10,
        rxStep: 0.1,
        ryStep: 0.1,
        rzStep: 0.1
    };

    function bindOnce(element, key, binder) {
        if (!element) {
            return;
        }

        element.dataset.vrodosBootstrap = element.dataset.vrodosBootstrap || '';
        if (element.dataset.vrodosBootstrap.indexOf(key) !== -1) {
            return;
        }

        binder(element);
        element.dataset.vrodosBootstrap += `|${  key}`;
    }

    function registerAvatarSchema() {
        if (typeof NAF === 'undefined') {
            return;
        }

        if (!NAF.schemas.getComponentsOriginal) {
            NAF.schemas.getComponentsOriginal = NAF.schemas.getComponents;
        }

        NAF.schemas.getComponents = function (template) {
            if (!NAF.schemas.hasTemplate('#avatar-template-expo')) {
                NAF.schemas.add({
                    template: '#avatar-template-expo',
                    components: [
                        'position',
                        'player-info',
                        'avatar-movement-info',
                        {
                            selector: '.rpm_avatar',
                            component: 'gltf-model'
                        },
                        {
                            component: 'rotation',
                            requiresNetworkUpdate: VRODOSMaster.vectorRequiresUpdateRotation(0.5)
                        }
                    ]
                });
            }

            return NAF.schemas.getComponentsOriginal(template);
        };
    }

    function bindLateJoinSync() {
        bindOnce(document.body, 'late-join-sync', () => {
            document.body.addEventListener('clientConnected', (evt) => {
                const myCam = VRODOSMaster.getElement('cameraA', true);
                if (myCam && myCam.components['player-info'] && myCam.components.networked) {
                    myCam.components.networked.syncAll(evt.detail.clientId, true);
                }
            });
        });
    }

    function bindScreenShareButton() {
        const screenBtnEle = VRODOSMaster.getElement('screen-btn-sendscreen', true);
        bindOnce(screenBtnEle, 'screen-share', (buttonEl) => {
            buttonEl.addEventListener('click', () => {
                navigator.mediaDevices.getDisplayMedia({
                    preferCurrentTab: true,
                    selfBrowserSurface: 'include',
                    audio: true
                }).then((stream) => {
                    if (NAF.connection.adapter.addLocalMediaStream) {
                        NAF.connection.adapter.addLocalMediaStream(stream, 'screen');
                    }
                });
            });
        });
    }

    function buildVideoControlGui(buttonEl) {
        if (typeof window.NAF === 'undefined' || typeof lil === 'undefined') {
            return;
        }

        const entities = window.NAF.connection.entities.entities;
        const panelsSizeControlsDiv = VRODOSMaster.getElement('panelsSizeControlsDiv', true);
        if (panelsSizeControlsDiv) {
            panelsSizeControlsDiv.replaceChildren([]);
        }

        try {
            if (buttonEl.gui) {
                buttonEl.gui.destroy();
            }
        } catch (error) {
            // Ignore old GUI teardown failures.
        }

        buttonEl.gui = new lil.GUI({ width: 200 });

        if (!entities) {
            return;
        }

        let nActor = 0;
        const panels = {};
        const elementsDatGui = [];
        const videoUserGui = [];

        for (const entityId in entities) {
            if (!Object.prototype.hasOwnProperty.call(entities, entityId)) {
                continue;
            }

            const entityNode = entities[entityId];
            if (!entityNode.childNodes || entityNode.childNodes.length < 2) {
                continue;
            }

            const height = entityNode.childNodes[1].getAttribute('height');
            if (!height) {
                continue;
            }

            nActor += 1;
            videoUserGui[entityId] = buttonEl.gui.addFolder(entityId);
            panels[entityId] = entityNode.childNodes[0].id === 'videoPlaneGreen' ? entityNode.childNodes[0] : entityNode.childNodes[1];
            elementsDatGui[entityId] = [];

            for (var property in apiPatternSingle) {
                if (!Object.prototype.hasOwnProperty.call(apiPatternSingle, property)) {
                    continue;
                }

                const low = `${property  }Low`;
                const high = `${property  }High`;
                const step = `${property  }Step`;
                const controller = videoUserGui[entityId].add(apiPatternSingle, property, apiPatternSingleMin[low], apiPatternSingleMax[high], apiPatternSingleStep[step]);
                controller.nActor = nActor - 1;
                controller.currentEntityId = entityId;
                controller.currentProperty = property;
                elementsDatGui[entityId][property] = controller;

                if (['w', 'h', 'x', 'y', 'z', 'rx', 'ry', 'rz'].some((prefix) => property.indexOf(prefix) === 0)) {
                    controller.panelaki = panels[entityId];
                    controller.domElement.pName = entityId;
                    controller.onChange(function () {
                        const panel = this.panelaki !== undefined ? this.panelaki : this.parent.controllers[5].panelaki;
                        const value = apiPatternSingle[this.property];

                        if (this.property === 'w') {
                            panel.setAttribute('width', value);
                        } else if (this.property === 'h') {
                            panel.setAttribute('height', value);
                        } else if (this.property === 'x') {
                            panel.getAttribute('position').x = value / 10000;
                        } else if (this.property === 'y') {
                            panel.getAttribute('position').y = value / 10000;
                        } else if (this.property === 'z') {
                            panel.getAttribute('position').z = value / 10000;
                        } else if (this.property.indexOf('r') === 0) {
                            const rotation = panel.getAttribute('rotation');
                            if (this.property === 'rx') {
                                panel.setAttribute('rotation', `${value  } ${  rotation.y  } ${  rotation.z}`);
                            } else if (this.property === 'ry') {
                                panel.setAttribute('rotation', `${rotation.x  } ${  value  } ${  rotation.z}`);
                            } else if (this.property === 'rz') {
                                panel.setAttribute('rotation', `${rotation.x  } ${  rotation.y  } ${  value}`);
                            }
                        }
                    });
                    continue;
                }

                controller.onChange(function () {
                    const domAffected = document.getElementsByClassName('videoPlaneGreenClass')[this.nActor];
                    if (domAffected) {
                        domAffected.setAttribute('networked-video-source', this.currentProperty, apiPatternSingle[this.currentProperty]);
                    }
                });
            }
        }
    }

    function bindStatusControls() {
        const btStatusControls = VRODOSMaster.getElement('obtainStatusAndSetSizeControls', true);
        bindOnce(btStatusControls, 'status-controls', (buttonEl) => {
            buttonEl.addEventListener('click', () => {
                buildVideoControlGui(buttonEl);
            });
        });
    }

    function startRecording(stream) {
        const recorder = new MediaRecorder(stream);
        const data = [];

        recorder.ondataavailable = function (event) {
            data.push(event.data);
        };
        recorder.start();

        return Promise.all([
            new Promise((resolve, reject) => {
                recorder.onstop = resolve;
                recorder.onerror = function (event) {
                    reject(event.name);
                };
            })
        ]).then(() => data);
    }

    function stopRecording(stream) {
        stream.getTracks().forEach((track) => {
            track.stop();
        });

        const recordBtn = VRODOSMaster.getElement('start-recording-btn', true);
        const downloadBtn = VRODOSMaster.getElement('download-recording-btn', true);
        const uploadBtn = VRODOSMaster.getElement('upload-recording-btn', true);

        if (recordBtn) {
            recordBtn.disabled = false;
        }

        if (downloadBtn) {
            downloadBtn.style.visibility = 'visible';
        }

        if (uploadBtn) {
            uploadBtn.disabled = false;
        }
    }

    function bindRecordingControls() {
        const recordButton = VRODOSMaster.getElement('start-recording-btn', true);
        const videoPreview = VRODOSMaster.getElement('video-preview', true);
        const downloadButton = VRODOSMaster.getElement('download-recording-btn', true);
        const uploadButton = VRODOSMaster.getElement('upload-recording-btn', true);
        const captureLabel = VRODOSMaster.getElement('captured-video-label', true);
        const recording = VRODOSMaster.getElement('recording', true);

        bindOnce(recordButton, 'recording', (buttonEl) => {
            buttonEl.addEventListener('click', () => {
                if (captureLabel) {
                    captureLabel.innerHTML = '';
                }

                navigator.mediaDevices.getDisplayMedia({
                    preferCurrentTab: true,
                    selfBrowserSurface: 'include',
                    systemAudio: 'include',
                    video: { cursor: 'never' },
                    audio: true
                }).then((stream) => {
                    buttonEl.disabled = true;
                    if (downloadButton) {
                        downloadButton.style.visibility = 'hidden';
                    }

                    if (!videoPreview) {
                        return null;
                    }

                    videoPreview.style.display = 'block';
                    videoPreview.srcObject = stream;
                    videoPreview.captureStream = videoPreview.captureStream || videoPreview.mozCaptureStream;
                    stream.getVideoTracks()[0].onended = function () {
                        videoPreview.style.display = 'none';
                        stopRecording(videoPreview.srcObject);
                    };

                    return new Promise((resolve) => {
                        videoPreview.onplaying = resolve;
                    });
                }).then(() => {
                    if (!videoPreview || typeof videoPreview.captureStream !== 'function') {
                        return null;
                    }

                    return startRecording(videoPreview.captureStream());
                }).then((recordedChunks) => {
                    if (!recordedChunks) {
                        return;
                    }

                    window.recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });

                    if (recording) {
                        recording.src = URL.createObjectURL(window.recordedBlob);
                    }

                    if (downloadButton && recording) {
                        downloadButton.style.visibility = 'visible';
                        downloadButton.href = recording.src;
                        downloadButton.download = 'RecordedVideo.webm';
                    }

                    if (uploadButton && recording) {
                        uploadButton.href = recording.src;
                    }

                    if (captureLabel) {
                        captureLabel.innerHTML = `Recorded ${  VRODOSMaster.formatBytes(window.recordedBlob.size)  } of ${  window.recordedBlob.type  } media.`;
                    }
                });
            }, false);
        });

        bindOnce(uploadButton, 'upload-recording', (buttonEl) => {
            buttonEl.addEventListener('click', () => {
                if (!window.recordedBlob) {
                    return;
                }

                buttonEl.disabled = true;
                const mvUrlInput = VRODOSMaster.getElement('node-url-input', true);
                const mvTokenInput = VRODOSMaster.getElement('node-token-input', true);
                const mvProjectIdInput = VRODOSMaster.getElement('mv-project-id-input', true);
                const mvUrl = mvUrlInput ? mvUrlInput.value : '';
                const mvToken = mvTokenInput ? mvTokenInput.value : '';
                const mvProjectId = mvProjectIdInput ? mvProjectIdInput.value : '';

                const videoFile = new File([window.recordedBlob], `vrodos-${  window.recordedBlob.size  }.webm`, { type: window.recordedBlob.type });
                const formData = new FormData();
                formData.append('file', videoFile);

                fetch(`${mvUrl  }/dam/assets?description=Recorded video from VRodos&externalTool=VRodos`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${  mvToken}` },
                    body: formData
                }).then((response) => {
                    if (response.ok) {
                        return response.json();
                    }

                    buttonEl.disabled = false;
                    alert('There has been a problem uploading your video to MediaVerse platform');
                    return null;
                }).then((data) => {
                    if (!data) {
                        return;
                    }

                    fetch(`${mvUrl  }/dam/project/${  mvProjectId  }/projectOutput`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${  mvToken}`
                        },
                        body: JSON.stringify({ projectOutput: [data.key] })
                    }).then((response) => {
                        buttonEl.disabled = false;
                        if (response.ok) {
                            alert('The video has been successfully uploaded to MediaVerse!');
                            return;
                        }

                        alert('There has been a problem uploading your video to MediaVerse platform');
                    });
                });
            });
        });
    }

    function handleFullscreenResult(result) {
        if (result && typeof result.catch === 'function') {
            result.catch((error) => {
                console.warn('[VRodos] Fullscreen request was ignored by the browser.', error);
            });
        }
    }

    function getFullscreenElement() {
        return document.fullscreenElement ||
            document.mozFullScreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement ||
            null;
    }

    function exitFullscreenIfActive() {
        if (!getFullscreenElement()) {
            return;
        }

        if (document.exitFullscreen) {
            handleFullscreenResult(document.exitFullscreen());
        } else if (document.mozCancelFullScreen) {
            handleFullscreenResult(document.mozCancelFullScreen());
        } else if (document.webkitCancelFullScreen) {
            handleFullscreenResult(document.webkitCancelFullScreen());
        } else if (document.msExitFullscreen) {
            handleFullscreenResult(document.msExitFullscreen());
        }
    }

    function requestFullscreen(element) {
        if (!element || getFullscreenElement()) {
            return;
        }

        if (element.requestFullscreen) {
            handleFullscreenResult(element.requestFullscreen());
        } else if (element.mozRequestFullScreen) {
            handleFullscreenResult(element.mozRequestFullScreen());
        } else if (element.webkitRequestFullScreen) {
            handleFullscreenResult(element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT));
        } else if (element.msRequestFullscreen) {
            handleFullscreenResult(element.msRequestFullscreen());
        }
    }

    function bindDirectorControls() {
        bindOnce(document.body, 'director-keydown', () => {
            document.addEventListener('keydown', (event) => {
                if (event.keyCode !== 88) {
                    return;
                }

                const actionsDiv = VRODOSMaster.getElement('actionsDiv', true);
                const datGui = document.getElementsByClassName('dg ac')[0];

                if (actionsDiv) {
                    actionsDiv.style.display = 'block';
                }

                if (datGui) {
                    datGui.style.display = 'block';
                }

                exitFullscreenIfActive();
            });
        });

        const directorControls = VRODOSMaster.getElement('toggle_controls', true);
        bindOnce(directorControls, 'director-controls', (buttonEl) => {
            buttonEl.onclick = function () {
                const actionsDiv = VRODOSMaster.getElement('actionsDiv', true);
                const datGui = document.getElementsByClassName('dg ac')[0];
                const elem = document.body;

                if (actionsDiv) {
                    actionsDiv.style.display = 'none';
                }

                if (datGui) {
                    datGui.style.display = 'none';
                }

                requestFullscreen(elem);
            };
        });
    }

    function bindSceneAssetVisibility() {
        const sceneAssets = VRODOSMaster.queryOne('#scene-assets');
        bindOnce(sceneAssets, 'scene-assets-visible', (assetsEl) => {
            assetsEl.addEventListener('loaded', () => {
                const chatWrapper = VRODOSMaster.getElement('chat-wrapper-el', true);
                if (chatWrapper && chatWrapper.getAttribute('data-visible') === 'true') {
                    chatWrapper.style.visibility = 'visible';
                }
            });
        });
    }

    function init() {
        registerAvatarSchema();
        bindLateJoinSync();
        bindScreenShareButton();
        bindStatusControls();
        bindRecordingControls();
        bindDirectorControls();
        bindSceneAssetVisibility();
    }

    window.connectionResolve = function () {
        bindScreenShareButton();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        return;
    }

    init();
})();
