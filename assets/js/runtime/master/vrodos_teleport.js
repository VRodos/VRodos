'use strict';

// Shared by the Three.js editor and the compiled A-Frame navigation runtime.
window.VRODOSTeleport = {
    createMarker: function () {
        const group = new THREE.Group();
        const accent = new THREE.MeshBasicMaterial({ color: '#14b8a6', side: THREE.DoubleSide, toneMapped: false });
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.57, 0.75, 48),
            accent
        );
        const center = new THREE.Mesh(
            new THREE.CircleGeometry(0.57, 48),
            new THREE.MeshBasicMaterial({ color: '#0f766e', side: THREE.DoubleSide, toneMapped: false })
        );
        for (const mesh of [ring, center]) {
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0.025;
        }
        for (const mesh of [ring, center]) {
            mesh.userData.teleportColorRole = mesh === center ? 'center' : 'accent';
            mesh.userData.teleportSurfaceOffset = mesh.position.y;
            group.add(mesh);
        }
        const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(0.87, 64),
            new THREE.MeshBasicMaterial({
                color: '#0f172a', transparent: true, opacity: 0.42,
                depthWrite: false, depthTest: true, side: THREE.DoubleSide,
                toneMapped: false
            })
        );
        shadow.name = 'TeleportGroundShadow';
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.01;
        shadow.userData.teleportColorRole = 'shadow';
        shadow.userData.teleportSurfaceOffset = shadow.position.y;
        // The ground shadow is visual feedback; the teal surfaces own selection.
        shadow.raycast = () => null;
        group.add(shadow);
        return group;
    },

    createHoverPillar: function () {
        const geometry = new THREE.CylinderGeometry(1.4, 0.72, 60, 48, 1, true);
        geometry.translate(0, 30, 0);
        const material = new THREE.ShaderMaterial({
            uniforms: { color: { value: new THREE.Color('#5eead4') } },
            vertexShader: `
                varying float height;
                varying vec3 viewNormal;
                varying vec3 viewPosition;
                void main() {
                    height = uv.y;
                    viewNormal = normalMatrix * normal;
                    vec4 positionView = modelViewMatrix * vec4(position, 1.0);
                    viewPosition = -positionView.xyz;
                    gl_Position = projectionMatrix * positionView;
                }`,
            fragmentShader: `
                uniform vec3 color;
                varying float height;
                varying vec3 viewNormal;
                varying vec3 viewPosition;
                void main() {
                    float facing = abs(dot(normalize(viewNormal), normalize(viewPosition)));
                    float fade = 1.0 - smoothstep(0.4, 1.0, height);
                    gl_FragColor = vec4(color, 0.28 * facing * facing * fade);
                    #include <colorspace_fragment>
                }`,
            transparent: true, depthWrite: false, depthTest: false,
            side: THREE.DoubleSide, toneMapped: false
        });
        const pillar = new THREE.Mesh(geometry, material);
        pillar.name = 'TeleportHoverPillar';
        pillar.visible = false;
        pillar.renderOrder = 50;
        pillar.raycast = () => null;
        return pillar;
    },

    createGroundProbe: function () {
        return { raycaster: new THREE.Raycaster(), origin: new THREE.Vector3(),
            down: new THREE.Vector3(0, -1, 0), normal: new THREE.Vector3() };
    },

    findGroundBelow: function (position, targets, probe, maxSlope = 45, tolerance = 0.35, includeHidden = false) {
        probe.origin.copy(position);
        probe.origin.y += tolerance;
        probe.raycaster.set(probe.origin, probe.down);
        probe.raycaster.near = 0;
        probe.raycaster.far = Infinity;
        const hits = probe.raycaster.intersectObjects(targets, false);
        for (const hit of hits) {
            if (!hit.face) continue;
            let visible = true;
            if (!includeHidden) {
                for (let node = hit.object; node; node = node.parent) {
                    if (!node.visible) { visible = false; break; }
                }
            }
            if (!visible) continue;
            probe.normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
            if (probe.normal.y <= 0.01) continue;
            const slope = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(probe.normal.y, -1, 1)));
            return slope <= maxSlope + 0.5 ? hit : null;
        }
        return null;
    },

    setMarkerGroundPosition: function (marker, worldFloorPosition) {
        const localFloor = worldFloorPosition ? marker.worldToLocal(worldFloorPosition.clone()) : new THREE.Vector3();
        for (const mesh of marker.children) {
            mesh.position.copy(localFloor);
            mesh.position.y += mesh.userData.teleportSurfaceOffset;
        }
    },

    createTravel: function (start, end) {
        const distance = start.distanceTo(end);
        const lift = THREE.MathUtils.clamp(distance * 0.1, 0.75, 2);
        const control = start.clone().lerp(end, 0.5);
        control.y = Math.max(start.y, end.y) + 2 * lift;
        return {
            curve: new THREE.QuadraticBezierCurve3(start.clone(), control, end.clone()),
            duration: THREE.MathUtils.clamp(0.8 + distance / 12, 0.8, 2.5) * 1000,
            elapsed: 0,
            position: start.clone()
        };
    },

    sampleTravel: function (travel, progress) {
        const t = THREE.MathUtils.clamp(progress, 0, 1);
        return travel.curve.getPoint(t * t * (3 - 2 * t), travel.position);
    }
};
