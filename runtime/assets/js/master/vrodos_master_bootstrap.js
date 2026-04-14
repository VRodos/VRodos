/**
 * VRodos Master runtime bootstrap.
 */

(function () {
    var apiPatternSingle = {
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

    var apiPatternSingleMin = {
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

    var apiPatternSingleMax = {
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

    var apiPatternSingleStep = {
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
        element.dataset.vrodosBootstrap += '|' + key;
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
        bindOnce(document.body, 'late-join-sync', function () {
            document.body.addEventListener('clientConnected', function (evt) {
                var myCam = VRODOSMaster.getElement('cameraA', true);
                if (myCam && myCam.components['player-info'] && myCam.components.networked) {
                    myCam.components.networked.syncAll(evt.detail.clientId, true);
                }
            });
        });
    }

    function bindScreenShareButton() {
        var screenBtnEle = VRODOSMaster.getElement('screen-btn-sendscreen', true);
        bindOnce(screenBtnEle, 'screen-share', function (buttonEl) {
            buttonEl.addEventListener('click', function () {
                navigator.mediaDevices.getDisplayMedia({
                    preferCurrentTab: true,
                    selfBrowserSurface: 'include',
                    audio: true
                }).then(function (stream) {
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

        var entities = window.NAF.connection.entities.entities;
        var panelsSizeControlsDiv = VRODOSMaster.getElement('panelsSizeControlsDiv', true);
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

        var nActor = 0;
        var panels = {};
        var elementsDatGui = [];
        var videoUserGui = [];

        for (var entityId in entities) {
            if (!Object.prototype.hasOwnProperty.call(entities, entityId)) {
                continue;
            }

            var entityNode = entities[entityId];
            if (!entityNode.childNodes || entityNode.childNodes.length < 2) {
                continue;
            }

            var height = entityNode.childNodes[1].getAttribute('height');
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

                var low = property + 'Low';
                var high = property + 'High';
                var step = property + 'Step';
                var controller = videoUserGui[entityId].add(apiPatternSingle, property, apiPatternSingleMin[low], apiPatternSingleMax[high], apiPatternSingleStep[step]);
                controller.nActor = nActor - 1;
                controller.currentEntityId = entityId;
                controller.currentProperty = property;
                elementsDatGui[entityId][property] = controller;

                if (['w', 'h', 'x', 'y', 'z', 'rx', 'ry', 'rz'].some(function (prefix) { return property.indexOf(prefix) === 0; })) {
                    controller.panelaki = panels[entityId];
                    controller.domElement.pName = entityId;
                    controller.onChange(function () {
                        var panel = this.panelaki !== undefined ? this.panelaki : this.parent.controllers[5].panelaki;
                        var value = apiPatternSingle[this.property];

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
                            var rotation = panel.getAttribute('rotation');
                            if (this.property === 'rx') {
                                panel.setAttribute('rotation', value + ' ' + rotation.y + ' ' + rotation.z);
                            } else if (this.property === 'ry') {
                                panel.setAttribute('rotation', rotation.x + ' ' + value + ' ' + rotation.z);
                            } else if (this.property === 'rz') {
                                panel.setAttribute('rotation', rotation.x + ' ' + rotation.y + ' ' + value);
                            }
                        }
                    });
                    continue;
                }

                controller.onChange(function () {
                    var domAffected = document.getElementsByClassName('videoPlaneGreenClass')[this.nActor];
                    if (domAffected) {
                        domAffected.setAttribute('networked-video-source', this.currentProperty, apiPatternSingle[this.currentProperty]);
                    }
                });
            }
        }
    }

    function bindStatusControls() {
        var btStatusControls = VRODOSMaster.getElement('obtainStatusAndSetSizeControls', true);
        bindOnce(btStatusControls, 'status-controls', function (buttonEl) {
            buttonEl.addEventListener('click', function () {
                buildVideoControlGui(buttonEl);
            });
        });
    }

    function startRecording(stream) {
        var recorder = new MediaRecorder(stream);
        var data = [];

        recorder.ondataavailable = function (event) {
            data.push(event.data);
        };
        recorder.start();

        return Promise.all([
            new Promise(function (resolve, reject) {
                recorder.onstop = resolve;
                recorder.onerror = function (event) {
                    reject(event.name);
                };
            })
        ]).then(function () {
            return data;
        });
    }

    function stopRecording(stream) {
        stream.getTracks().forEach(function (track) {
            track.stop();
        });

        var recordBtn = VRODOSMaster.getElement('start-recording-btn', true);
        var downloadBtn = VRODOSMaster.getElement('download-recording-btn', true);
        var uploadBtn = VRODOSMaster.getElement('upload-recording-btn', true);

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
        var recordButton = VRODOSMaster.getElement('start-recording-btn', true);
        var videoPreview = VRODOSMaster.getElement('video-preview', true);
        var downloadButton = VRODOSMaster.getElement('download-recording-btn', true);
        var uploadButton = VRODOSMaster.getElement('upload-recording-btn', true);
        var captureLabel = VRODOSMaster.getElement('captured-video-label', true);
        var recording = VRODOSMaster.getElement('recording', true);

        bindOnce(recordButton, 'recording', function (buttonEl) {
            buttonEl.addEventListener('click', function () {
                if (captureLabel) {
                    captureLabel.innerHTML = '';
                }

                navigator.mediaDevices.getDisplayMedia({
                    preferCurrentTab: true,
                    selfBrowserSurface: 'include',
                    systemAudio: 'include',
                    video: { cursor: 'never' },
                    audio: true
                }).then(function (stream) {
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

                    return new Promise(function (resolve) {
                        videoPreview.onplaying = resolve;
                    });
                }).then(function () {
                    if (!videoPreview || typeof videoPreview.captureStream !== 'function') {
                        return null;
                    }

                    return startRecording(videoPreview.captureStream());
                }).then(function (recordedChunks) {
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
                        captureLabel.innerHTML = 'Recorded ' + VRODOSMaster.formatBytes(window.recordedBlob.size) + ' of ' + window.recordedBlob.type + ' media.';
                    }
                });
            }, false);
        });

        bindOnce(uploadButton, 'upload-recording', function (buttonEl) {
            buttonEl.addEventListener('click', function () {
                if (!window.recordedBlob) {
                    return;
                }

                buttonEl.disabled = true;
                var mvUrlInput = VRODOSMaster.getElement('node-url-input', true);
                var mvTokenInput = VRODOSMaster.getElement('node-token-input', true);
                var mvProjectIdInput = VRODOSMaster.getElement('mv-project-id-input', true);
                var mvUrl = mvUrlInput ? mvUrlInput.value : '';
                var mvToken = mvTokenInput ? mvTokenInput.value : '';
                var mvProjectId = mvProjectIdInput ? mvProjectIdInput.value : '';

                var videoFile = new File([window.recordedBlob], 'vrodos-' + window.recordedBlob.size + '.webm', { type: window.recordedBlob.type });
                var formData = new FormData();
                formData.append('file', videoFile);

                fetch(mvUrl + '/dam/assets?description=Recorded video from VRodos&externalTool=VRodos', {
                    method: 'POST',
                    headers: { Authorization: 'Bearer ' + mvToken },
                    body: formData
                }).then(function (response) {
                    if (response.ok) {
                        return response.json();
                    }

                    buttonEl.disabled = false;
                    alert('There has been a problem uploading your video to MediaVerse platform');
                    return null;
                }).then(function (data) {
                    if (!data) {
                        return;
                    }

                    fetch(mvUrl + '/dam/project/' + mvProjectId + '/projectOutput', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: 'Bearer ' + mvToken
                        },
                        body: JSON.stringify({ projectOutput: [data.key] })
                    }).then(function (response) {
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

    function bindDirectorControls() {
        bindOnce(document.body, 'director-keydown', function () {
            document.addEventListener('keydown', function (event) {
                if (event.keyCode !== 88) {
                    return;
                }

                var actionsDiv = VRODOSMaster.getElement('actionsDiv', true);
                var datGui = document.getElementsByClassName('dg ac')[0];

                if (actionsDiv) {
                    actionsDiv.style.display = 'block';
                }

                if (datGui) {
                    datGui.style.display = 'block';
                }

                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            });
        });

        var directorControls = VRODOSMaster.getElement('toggle_controls', true);
        bindOnce(directorControls, 'director-controls', function (buttonEl) {
            buttonEl.onclick = function () {
                var actionsDiv = VRODOSMaster.getElement('actionsDiv', true);
                var datGui = document.getElementsByClassName('dg ac')[0];
                var elem = document.body;

                if (actionsDiv) {
                    actionsDiv.style.display = 'none';
                }

                if (datGui) {
                    datGui.style.display = 'none';
                }

                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.mozRequestFullScreen) {
                    elem.mozRequestFullScreen();
                } else if (elem.webkitRequestFullScreen) {
                    elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                } else if (elem.msRequestFullscreen) {
                    elem.msRequestFullscreen();
                }
            };
        });
    }

    function bindSceneAssetVisibility() {
        var sceneAssets = VRODOSMaster.queryOne('#scene-assets');
        bindOnce(sceneAssets, 'scene-assets-visible', function (assetsEl) {
            assetsEl.addEventListener('loaded', function () {
                var chatWrapper = VRODOSMaster.getElement('chat-wrapper-el', true);
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
