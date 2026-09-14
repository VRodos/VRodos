/** Seed A-Frame's mouse look state once, before its first orientation update. */
AFRAME.registerComponent('vrodos-camera-start', {
    dependencies: ['look-controls'],
    schema: {
        pitch: { type: 'number', default: 0 },
        yaw: { type: 'number', default: 0 }
    },
    init: function () {
        const pitch = AFRAME.THREE.MathUtils.degToRad(this.data.pitch);
        const yaw = AFRAME.THREE.MathUtils.degToRad(this.data.yaw);
        const lookControls = this.el.components['look-controls'];
        lookControls.pitchObject.rotation.x = pitch;
        lookControls.yawObject.rotation.y = yaw;
        this.el.object3D.rotation.set(pitch, yaw, 0, 'YXZ');
    }
});
