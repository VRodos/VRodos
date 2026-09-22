/**
 * VRodos Master Misc Components
 */

AFRAME.registerComponent('autoplay-sound', {
    init: function () {
        this.resources = window.VRODOSMaster.RuntimeResources.createRegistry();
        this.resources.listen(this.el, "loaded", () => {
            this.el.components.sound.playSound();
        });
    },
    remove: function () { this.resources.disposeAll(); }
});

AFRAME.registerComponent('vrodos-stochastic-tiling', {
    dependencies: ['material'],
    schema: {
        enabled: { type: 'boolean', default: true },
        patchTiles: { type: 'number', default: 1.25 },
        blendSharpness: { type: 'number', default: 4 },
        seed: { type: 'number', default: 0 }
    },
    init: function () {
        this.applyTiling = this.applyTiling.bind(this);
        this.el.addEventListener('object3dset', this.applyTiling);
        this.el.addEventListener('materialtextureloaded', this.applyTiling);
        this.applyTiling();
    },
    update: function () {
        this.applyTiling();
    },
    applyTiling: function () {
        const helper = window.VRODOSSurfaceMaterial;
        const mesh = this.el.getObject3D('mesh');
        if (!helper || !mesh) return;
        mesh.traverse((node) => {
            if (!node.isMesh || !node.material) return;
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach((material) => helper.applyStochasticTiling(material, {
                enabled: this.data.enabled && Boolean(material.map),
                patchTiles: this.data.patchTiles,
                blendSharpness: this.data.blendSharpness,
                seed: this.data.seed
            }));
        });
    },
    remove: function () {
        this.el.removeEventListener('object3dset', this.applyTiling);
        this.el.removeEventListener('materialtextureloaded', this.applyTiling);
        const mesh = this.el.getObject3D('mesh');
        const helper = window.VRODOSSurfaceMaterial;
        if (!mesh || !helper) return;
        mesh.traverse((node) => {
            const materials = node && node.material
                ? (Array.isArray(node.material) ? node.material : [node.material])
                : [];
            materials.forEach((material) => helper.applyStochasticTiling(material, { enabled: false }));
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
        this.resources = window.VRODOSMaster.RuntimeResources.createRegistry();

        this.resources.listen(document, 'keydown', (event) => {
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

        this.resources.listen(document, 'keyup', (event) => {
            const cameraA = document.getElementById('cameraA');
            if (cameraA) {
                elem.emit('avatar-changed-animation', "stopped", false);
                cameraA.setAttribute('avatar-movement-info', 'movementState', "stop");
            }
        });
    },
    remove: function () { this.resources.disposeAll(); }
});

AFRAME.registerComponent('static-mask-me', {
    init: function () {
        const el = this.el;
        this.originals = new Map();
        const mesh = el.getObject3D('mesh');
        if (!mesh) return;
        const maskMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: false,
            colorWrite: false,
        });
        maskMaterial.needsUpdate = true;
        this.maskMaterial = maskMaterial;
        mesh.traverse(node => {
            if (node.isMesh) {
                this.originals.set(node, { material: node.material, renderOrder: node.renderOrder });
                node.material = maskMaterial;
                node.renderOrder = 999;
            }
        });
    },
    remove: function () {
        this.originals.forEach((original, mesh) => {
            if (mesh.material === this.maskMaterial) mesh.material = original.material;
            if (mesh.renderOrder === 999) mesh.renderOrder = original.renderOrder;
        });
        this.originals.clear();
        if (this.maskMaterial) this.maskMaterial.dispose();
        this.maskMaterial = null;
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
        this.worldPosition = new THREE.Vector3();
        this.lastTextUpdate = -Infinity;
        this.movementEl = null;
    },
    getDisplayedPosition: function () {
        if (!this.movementEl || !this.movementEl.isConnected || !this.movementEl.components['custom-movement']) {
            this.movementEl = this.el.sceneEl.querySelector('[custom-movement]');
        }
        const movementEl = this.movementEl;
        const movement = movementEl && movementEl.components ? movementEl.components['custom-movement'] : null;
        if (movement && typeof movement.getNavigationWorldPosition === 'function') {
            return movement.getNavigationWorldPosition();
        }

        if (this.el.object3D && typeof this.el.object3D.getWorldPosition === 'function') {
            return this.el.object3D.getWorldPosition(this.worldPosition);
        }

        return this.el.getAttribute('position');
    },
    tick: function (time, timeDelta) {
        if (time - this.lastTextUpdate < 250) return;
        this.lastTextUpdate = time;
        if (this.positionShow) {
            const p = this.getDisplayedPosition();
            const text = `${Math.round(p.x * 100) / 100  }, ${  Math.round(p.y * 100) / 100  }, ${  Math.round(p.z * 100) / 100}`;
            if (this.positionShow.textContent !== text) this.positionShow.textContent = text;
        }

        if (this.occupantsNumberShow && typeof window.easyrtc !== 'undefined' && typeof window.NAF !== 'undefined') {
            const occupants = window.easyrtc.getRoomOccupantsAsMap(window.NAF.room);
            if (occupants) {
                const text = String(Object.keys(occupants).length);
                if (this.occupantsNumberShow.textContent !== text) this.occupantsNumberShow.textContent = text;
            }
        }
    },
    remove: function () {
        this.movementEl = null;
        this.positionShow = null;
        this.occupantsNumberShow = null;
    }
});


AFRAME.registerComponent('start-animation', {
    init: function () {
        // Initialization for scene starting
    }
});
