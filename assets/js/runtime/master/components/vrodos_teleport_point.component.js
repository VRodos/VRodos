'use strict';

AFRAME.registerComponent('vrodos-teleport-point', {
    init: function () {
        this.resources = window.VRODOSMaster.RuntimeResources.createRegistry();
        this.marker = window.VRODOSTeleport.createMarker();
        this.markerMaterials = [];
        this.occupied = false;
        this.viewerPosition = new THREE.Vector3();
        this.centerPosition = new THREE.Vector3();
        this.marker.traverse(node => {
            if (node.isMesh) {
                this.resources.track(node.geometry);
                this.resources.track(node.material);
                this.markerMaterials.push({ material: node.material, opacity: node.material.opacity,
                    transparent: node.material.transparent, depthWrite: node.material.depthWrite });
            }
        });
        this.el.setObject3D('mesh', this.marker);
        this.center = this.marker.children.find(mesh => mesh.userData.teleportColorRole === 'center');
        this.pillarPosition = new THREE.Vector3();
        this.destination = new THREE.Vector3();
        this.lastGroundUpdate = -Infinity;
        this.lastGroundOrigin = new THREE.Vector3(Infinity, Infinity, Infinity);
        this.groundDirty = true;
        for (const type of ['loaded', 'model-loaded', 'object3dset', 'object3dremove', 'child-attached', 'child-detached', 'vrodos-scene-loader-ready']) {
            this.resources.listen(this.el.sceneEl, type, event => {
                this.groundDirty = true;
                if (event.target.classList.contains('vrodos-navmesh')) this.getMovement()?.markNavMeshDirty();
            }, true);
        }
        this.resources.listen(this.el.sceneEl, 'componentchanged', event => {
            if (event.target.classList.contains('vrodos-navmesh')) this.groundDirty = true;
        }, true);
        this.hovered = false;
        this.rejected = false;
        this.clearRejection = null;
        this.order = Number(this.el.getAttribute('data-vrodos-teleport-order'));
        this.label = this.el.getAttribute('data-vrodos-teleport-label');
        this.resources.listen(this.el, 'mouseenter', () => { this.hovered = true; this.updateColor(); this.updateHoverPillar(); });
        this.resources.listen(this.el, 'mouseleave', () => { this.hovered = false; this.updateColor(); this.updateHoverPillar(); });
        this.resources.listen(this.el, 'click', event => {
            if (event.detail?.originalEvent?.button !== undefined && event.detail.originalEvent.button !== 0) return;
            this.activate();
        });
        this.el.sceneEl.emit('vrodos-teleport-point-added', { point: this });
    },

    tick: function (time) {
        this.updateGroundProjection(time);
        this.updateOccupancy();
        this.updateHoverPillar();
    },

    updateGroundProjection: function (time) {
        if (time - this.lastGroundUpdate < 250) return;
        this.lastGroundUpdate = time;
        const loader = this.el.sceneEl.components['vrodos-scene-loader'];
        if (!this.el.sceneEl.hasLoaded || (loader && !loader.isReady)) return;
        const movement = this.getMovement();
        if (!movement) return;
        const mode = movement.getNavigationMode(movement.getSceneSettings());
        this.el.object3D.updateWorldMatrix(true, true);
        this.el.object3D.getWorldPosition(this.destination);
        movement.renderedToAuthoredPosition(this.destination, this.destination);
        if (!this.groundDirty && mode === this.lastGroundMode &&
            this.destination.distanceToSquared(this.lastGroundOrigin) < 1e-8) return;
        this.groundDirty = false;
        this.lastGroundMode = mode;
        this.lastGroundOrigin.copy(this.destination);
        if (mode === 'fly') {
            window.VRODOSTeleport.setMarkerGroundPosition(this.marker, null);
            return;
        }
        const ground = movement.getTeleportGround(this.destination);
        // Keep retrying pending geometry until a surface can be resolved.
        this.groundDirty = !ground;
        const renderedFloor = ground ? movement.authoredToRenderedPosition(ground.point, this.destination) : null;
        window.VRODOSTeleport.setMarkerGroundPosition(this.marker, renderedFloor);
    },

    updateOccupancy: function () {
        const movement = this.getMovement();
        let occupied = false;
        if (movement) {
            this.center.updateWorldMatrix(true, false);
            this.center.getWorldPosition(this.centerPosition);
            if (movement.isImmersiveXrPresenting()) {
                movement.getImmersivePhysicalAnchorPosition(this.viewerPosition);
            } else {
                this.viewerPosition.copy(movement.getNavigationWorldPosition());
            }
            const height = this.viewerPosition.y - this.centerPosition.y;
            this.center.worldToLocal(this.viewerPosition);
            const radius = this.marker.children[0].geometry.parameters.outerRadius;
            occupied = this.viewerPosition.x ** 2 + this.viewerPosition.y ** 2 <= radius ** 2 &&
                height >= 0 && height <= (movement.heightOffset ?? 1.6) + movement.groundSnapDistance;
        }
        if (occupied === this.occupied) return;
        this.occupied = occupied;
        for (const original of this.markerMaterials) {
            const material = original.material;
            material.opacity = original.opacity * (occupied ? 0.08 : 1);
            material.depthWrite = occupied ? false : original.depthWrite;
            const transparent = occupied || original.transparent;
            if (material.transparent !== transparent) {
                material.transparent = transparent;
                material.needsUpdate = true;
            }
        }
    },

    activate: function () {
        const movement = this.getMovement();
        if (!this.el.isConnected || !movement || !movement.canStartTeleport()) return false;
        this.el.object3D.updateWorldMatrix(true, false);
        this.el.object3D.getWorldPosition(this.destination);
        movement.renderedToAuthoredPosition(this.destination, this.destination);
        const started = movement.teleportToPoint(this.destination, this.el);
        if (!started) this.showRejection();
        this.updateHoverPillar();
        return started;
    },

    getMovement: function () {
        return this.el.sceneEl.querySelector('[custom-movement]')?.components['custom-movement'];
    },

    setMenuHovered: function (hovered) {
        this.menuHovered = hovered;
        this.updateColor();
        this.updateHoverPillar();
    },

    updateHoverPillar: function () {
        const scene = this.el.sceneEl;
        const movement = this.getMovement();
        const loader = scene.components['vrodos-scene-loader'];
        const ownPanel = scene.components['vrodos-teleport-destinations']?.panel;
        const visible = Boolean(!this.occupied && (this.hovered || this.menuHovered) && scene.hasLoaded &&
            (!loader || loader.isReady) && movement && !movement.teleportTravel &&
            (!window.VRODOSRuntimeOverlay?.interactionLocked || (this.menuHovered && ownPanel)));
        if (visible && !this.pillar) {
            this.pillar = window.VRODOSTeleport.createHoverPillar();
            this.resources.track(this.pillar.geometry);
            this.resources.track(this.pillar.material);
            scene.object3D.add(this.pillar);
        }
        if (!this.pillar) return;
        this.pillar.visible = visible;
        if (!visible) return;
        this.center.updateWorldMatrix(true, false);
        this.center.getWorldPosition(this.pillarPosition);
        scene.object3D.worldToLocal(this.pillarPosition);
        this.pillar.position.copy(this.pillarPosition);
        this.pillar.material.uniforms.color.value.set(this.rejected ? '#ef4444' : '#5eead4');
    },

    updateColor: function () {
        const colors = this.rejected ? { accent: '#ef4444', center: '#991b1b' }
            : this.hovered || this.menuHovered ? { accent: '#5eead4', center: '#14b8a6' } : { accent: '#14b8a6', center: '#0f766e' };
        this.marker.traverse(mesh => {
            if (mesh.isMesh && mesh.userData.teleportColorRole !== 'shadow') {
                mesh.material.color.set(colors[mesh.userData.teleportColorRole]);
            }
        });
    },

    showRejection: function () {
        if (this.clearRejection) this.clearRejection();
        this.rejected = true;
        this.updateColor();
        this.el.sceneEl.emit('vrodos-teleport-point-rejected', { point: this });
        this.clearRejection = this.resources.timeout(() => {
            this.clearRejection = null;
            this.rejected = false;
            this.updateColor();
        }, 600);
    },

    pause: function () {
        this.hovered = false;
        this.menuHovered = false;
        if (this.pillar) this.pillar.visible = false;
    },

    remove: function () {
        this.pause();
        this.el.sceneEl.emit('vrodos-teleport-point-removed', { point: this });
        const movement = this.getMovement();
        if (movement?.teleportTravel?.source === this.el) movement.cancelTeleport();
        this.el.removeObject3D('mesh');
        this.pillar?.removeFromParent();
        this.resources.disposeAll();
    }
});
