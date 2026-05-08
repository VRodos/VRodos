AFRAME.registerComponent('door-listener', {
    schema: { type: "string", default: "default value" },
    init: function () {
        this.el.setAttribute("link", "on: click; href: " + this.data);
        this.el.addEventListener("click", evt => {
            if (evt.detail && evt.detail.originalEvent && evt.detail.originalEvent.button !== undefined) {
                if (evt.detail.originalEvent.button !== 0) return;
            }
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'door_click');
            }
        });
    }
});

AFRAME.registerComponent('vrodos-door-indicator', {
    schema: {
        color: { type: 'color', default: '#10b981' },
        emissive: { type: 'color', default: '#047857' },
        opacity: { type: 'number', default: 0.55 },
        radius: { type: 'number', default: 0.2 },
        heightOffset: { type: 'number', default: 0.35 },
        bobAmplitude: { type: 'number', default: 0.08 },
        bobSpeed: { type: 'number', default: 1.4 },
        rotateSpeed: { type: 'number', default: 1.8 }
    },

    init: function () {
        this.marker = null;
        this.basePosition = null;
        this.offset = Math.random() * Math.PI * 2;
        this.placeMarker = this.placeMarker.bind(this);
        this.el.addEventListener('model-loaded', this.placeMarker);
        this.createMarker();
        window.setTimeout(this.placeMarker, 0);
    },

    createMarker: function () {
        if (this.marker || typeof THREE === 'undefined') {
            return;
        }

        var geometry = new THREE.OctahedronGeometry(this.data.radius, 0);
        var material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(this.data.color),
            emissive: new THREE.Color(this.data.emissive),
            emissiveIntensity: 0.65,
            roughness: 0.28,
            metalness: 0.18,
            transparent: true,
            opacity: this.data.opacity,
            depthWrite: false
        });

        this.marker = new THREE.Mesh(geometry, material);
        this.marker.name = 'vrodos-door-indicator';
        this.marker.renderOrder = 5;
        this.marker.scale.set(1, 0.65, 1);
        this.el.object3D.add(this.marker);
    },

    placeMarker: function () {
        if (!this.marker || typeof THREE === 'undefined') {
            return;
        }

        this.el.object3D.updateMatrixWorld(true);
        var box = new THREE.Box3();
        this.expandBoxByObject(box, this.el.object3D);

        if (box.isEmpty()) {
            this.marker.position.set(0, 1 + this.data.heightOffset, 0);
            this.basePosition = this.marker.position.clone();
            return;
        }

        var targetWorld = new THREE.Vector3(
            (box.min.x + box.max.x) / 2,
            box.max.y + this.data.heightOffset,
            (box.min.z + box.max.z) / 2
        );
        var targetLocal = this.el.object3D.worldToLocal(targetWorld.clone());
        this.marker.position.copy(targetLocal);
        this.basePosition = targetLocal.clone();

        var worldScale = new THREE.Vector3();
        this.el.object3D.getWorldScale(worldScale);
        this.marker.scale.set(
            worldScale.x !== 0 ? 1 / Math.abs(worldScale.x) : 1,
            worldScale.y !== 0 ? 0.65 / Math.abs(worldScale.y) : 0.65,
            worldScale.z !== 0 ? 1 / Math.abs(worldScale.z) : 1
        );
    },

    expandBoxByObject: function (box, object) {
        if (!object || object === this.marker) {
            return;
        }

        if (object.geometry) {
            if (!object.geometry.boundingBox) {
                object.geometry.computeBoundingBox();
            }
            if (object.geometry.boundingBox) {
                box.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
            }
        }

        for (var i = 0; i < object.children.length; i++) {
            this.expandBoxByObject(box, object.children[i]);
        }
    },

    tick: function (time) {
        if (!this.marker || !this.basePosition) {
            return;
        }

        var seconds = time / 1000;
        var worldScale = new THREE.Vector3();
        this.el.object3D.getWorldScale(worldScale);
        var yScale = worldScale.y !== 0 ? Math.abs(worldScale.y) : 1;

        this.marker.position.y = this.basePosition.y + (
            Math.sin((seconds * this.data.bobSpeed) + this.offset) * this.data.bobAmplitude / yScale
        );
        this.marker.rotation.x = 0;
        this.marker.rotation.y = seconds * this.data.rotateSpeed;
        this.marker.rotation.z = 0;
    },

    remove: function () {
        this.el.removeEventListener('model-loaded', this.placeMarker);
        if (!this.marker) {
            return;
        }

        if (this.marker.parent) {
            this.marker.parent.remove(this.marker);
        }
        if (this.marker.geometry) {
            this.marker.geometry.dispose();
        }
        if (this.marker.material) {
            this.marker.material.dispose();
        }
        this.marker = null;
    }
});
