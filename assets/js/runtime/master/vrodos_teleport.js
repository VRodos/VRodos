'use strict';

// Shared by the Three.js editor and the compiled A-Frame navigation runtime.
window.VRODOSTeleport = {
    createMarker: function () {
        const group = new THREE.Group();
        const accent = new THREE.MeshBasicMaterial({ color: '#14b8a6', side: THREE.DoubleSide, toneMapped: false });
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.38, 0.5, 48),
            accent
        );
        const center = new THREE.Mesh(
            new THREE.CircleGeometry(0.38, 48),
            new THREE.MeshBasicMaterial({ color: '#0f766e', side: THREE.DoubleSide, toneMapped: false })
        );
        for (const mesh of [ring, center]) {
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0.025;
        }
        const pinTipHeight = 2.5;
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.16), accent);
        body.position.y = pinTipHeight + 0.45;
        const tipGeometry = new THREE.ConeGeometry(0.22 / Math.SQRT2, 0.2, 4);
        tipGeometry.rotateY(Math.PI / 4);
        tipGeometry.rotateZ(Math.PI);
        tipGeometry.scale(1, 1, 0.16 / 0.22);
        const tip = new THREE.Mesh(tipGeometry, accent);
        tip.position.y = pinTipHeight + 0.1;
        for (const mesh of [ring, center, body, tip]) {
            mesh.userData.teleportColorRole = mesh === center ? 'center' : 'accent';
            group.add(mesh);
        }
        return group;
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
