'use strict';

AFRAME.registerComponent('vrodos-teleport-point', {
    init: function () {
        this.resources = window.VRODOSMaster.RuntimeResources.createRegistry();
        this.marker = window.VRODOSTeleport.createMarker();
        this.marker.traverse(node => {
            if (node.isMesh) {
                this.resources.track(node.geometry);
                this.resources.track(node.material);
            }
        });
        this.el.setObject3D('mesh', this.marker);
        this.destination = new THREE.Vector3();
        this.hovered = false;
        this.rejected = false;
        this.clearRejection = null;
        this.resources.listen(this.el, 'mouseenter', () => { this.hovered = true; this.updateColor(); });
        this.resources.listen(this.el, 'mouseleave', () => { this.hovered = false; this.updateColor(); });
        this.resources.listen(this.el, 'click', event => {
            if (event.detail?.originalEvent?.button !== undefined && event.detail.originalEvent.button !== 0) return;
            const movement = this.getMovement();
            if (!movement || !movement.canStartTeleport()) return;
            this.el.object3D.updateWorldMatrix(true, false);
            this.el.object3D.getWorldPosition(this.destination);
            movement.renderedToAuthoredPosition(this.destination, this.destination);
            if (!movement.teleportToPoint(this.destination, this.el)) this.showRejection();
        });
    },

    getMovement: function () {
        return this.el.sceneEl.querySelector('[custom-movement]')?.components['custom-movement'];
    },

    updateColor: function () {
        const colors = this.rejected ? { accent: '#ef4444', center: '#991b1b' }
            : this.hovered ? { accent: '#5eead4', center: '#14b8a6' } : { accent: '#14b8a6', center: '#0f766e' };
        this.marker.traverse(mesh => {
            if (mesh.isMesh) mesh.material.color.set(colors[mesh.userData.teleportColorRole]);
        });
    },

    showRejection: function () {
        if (this.clearRejection) this.clearRejection();
        this.rejected = true;
        this.updateColor();
        this.clearRejection = this.resources.timeout(() => {
            this.clearRejection = null;
            this.rejected = false;
            this.updateColor();
        }, 600);
    },

    remove: function () {
        const movement = this.getMovement();
        if (movement?.teleportTravel?.source === this.el) movement.cancelTeleport();
        this.el.removeObject3D('mesh');
        this.resources.disposeAll();
    }
});
