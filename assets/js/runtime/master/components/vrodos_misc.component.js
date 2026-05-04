/**
 * VRodos Master Misc Components
 */

AFRAME.registerComponent('autoplay-sound', {
    init: function () {
        this.el.addEventListener("loaded", () => {
            this.el.components.sound.playSound();
        });
    }
});

AFRAME.registerComponent('entity-movement-emitter', {
    schema: {
        clip: { type: "string", default: "idle" },
    },
    init: function () {
        const shouldCaptureKeyEvent = AFRAME.utils.shouldCaptureKeyEvent;
        const elem = this.el;

        document.addEventListener('keydown', (event) => {
            const cameraA = document.getElementById('cameraA');
            if (!cameraA) return;

            if (event.keyCode === 87) {
                if (shouldCaptureKeyEvent(event)) {
                    cameraA.setAttribute('avatar-movement-info', 'movementState', "walkingforward");
                }
            } else if (event.keyCode === 83) {
                if (shouldCaptureKeyEvent(event)) {
                    elem.emit('avatar-changed-animation', "walkingdown", false);
                    cameraA.setAttribute('avatar-movement-info', 'movementState', "walkingdown");
                }
            } else if (event.keyCode === 68) {
                if (shouldCaptureKeyEvent(event)) {
                    elem.emit('avatar-changed-animation', "walkingright", false);
                    cameraA.setAttribute('avatar-movement-info', 'movementState', "walkingright");
                }
            } else if (event.keyCode === 65) {
                if (shouldCaptureKeyEvent(event)) {
                    elem.emit('avatar-changed-animation', "walkingleft", false);
                    cameraA.setAttribute('avatar-movement-info', 'movementState', "walkingleft");
                }
            } else {
                elem.emit('avatar-changed-animation', "idle", false);
            }
        });

        document.addEventListener('keyup', (event) => {
            const cameraA = document.getElementById('cameraA');
            if (cameraA) {
                elem.emit('avatar-changed-animation', "stopped", false);
                cameraA.setAttribute('avatar-movement-info', 'movementState', "stop");
            }
        });
    }
});

AFRAME.registerComponent('static-mask-me', {
    init: function () {
        const el = this.el;
        const maskMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: false,
            colorWrite: false,
        });
        maskMaterial.needsUpdate = true;
        const mesh = el.getObject3D('mesh');
        if (!mesh) return;
        mesh.traverse(node => {
            if (node.isMesh) {
                node.material = maskMaterial;
                node.renderOrder = 999;
            }
        });
    }
});

AFRAME.registerComponent('render-order-change', {
    schema: {
        renderingOrderArg: { type: 'string', default: '2000' }
    },
    init: function () {
        const el = this.el;
        const mesh = el.getObject3D('mesh');
        if (!mesh) return;
        mesh.traverse(node => {
            if (node.isMesh) {
                node.renderOrder = this.data.renderingOrderArg;
            }
        });
    }
});

AFRAME.registerComponent("overlay", {
    dependencies: ['material'],
    init: function () {
        this.el.sceneEl.renderer.sortObjects = true;
        this.el.object3D.renderOrder = 100;
        if (this.el.components.material && this.el.components.material.material) {
            this.el.components.material.material.depthTest = false;
        }
    }
});

AFRAME.registerComponent('show-position', {
    init: function () {
        this.positionShow = document.getElementById("positionShow");
        this.occupantsNumberShow = document.getElementById("occupantsNumberShow");
    },
    tick: function (time, timeDelta) {
        if (this.positionShow) {
            const p = this.el.getAttribute('position');
            this.positionShow.innerHTML = `${Math.round(p.x * 100) / 100  }, ${  Math.round(p.y * 100) / 100  }, ${  Math.round(p.z * 100) / 100}`;
        }

        if (this.occupantsNumberShow && typeof window.easyrtc !== 'undefined' && typeof window.NAF !== 'undefined') {
            const occupants = window.easyrtc.getRoomOccupantsAsMap(window.NAF.room);
            if (occupants) {
                this.occupantsNumberShow.innerHTML = Object.keys(occupants).length;
            }
        }
    }
});


AFRAME.registerComponent('start-animation', {
    init: function () {
        // Initialization for scene starting
    }
});
