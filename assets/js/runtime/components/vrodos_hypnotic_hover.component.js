/**
 * VRodos Hypnotic Hover Component
 * Adds a subtle Y-axis floating animation to objects.
 */
AFRAME.registerComponent('vrodos-hypnotic-hover', {
    schema: {
        amplitude: { type: 'number', default: 0.08 }, // How high it floats
        speed: { type: 'number', default: 1.5 },    // How fast it moves
        enabled: { type: 'boolean', default: true }
    },

    init: function () {
        this.initialY = this.el.object3D.position.y;
        this.deferredToImmersiveWorldTransform = false;
        // Random offset so they don't all move in sync
        this.offset = Math.random() * Math.PI * 2;
    },
    isImmersiveXrPresenting: function () {
        const sceneEl = this.el && this.el.sceneEl ? this.el.sceneEl : null;
        const renderer = sceneEl && sceneEl.renderer ? sceneEl.renderer : null;
        return Boolean(
            sceneEl &&
            typeof sceneEl.is === 'function' &&
            sceneEl.is('vr-mode') &&
            renderer &&
            renderer.xr &&
            renderer.xr.isPresenting
        );
    },
    isTopLevelSceneRoot: function () {
        const sceneEl = this.el && this.el.sceneEl ? this.el.sceneEl : null;
        return Boolean(sceneEl && this.el && this.el.parentElement === sceneEl);
    },
    shouldDeferToImmersiveWorldTransform: function () {
        return this.isImmersiveXrPresenting() && this.isTopLevelSceneRoot();
    },

    tick: function (time, timeDelta) {
        if (!this.data.enabled) {
            return;
        }

        if (this.shouldDeferToImmersiveWorldTransform()) {
            this.deferredToImmersiveWorldTransform = true;
            return;
        }

        this.deferredToImmersiveWorldTransform = false;

        // Calculate sine wave bounce
        var bounce = Math.sin((time / 1000 * this.data.speed) + this.offset) * this.data.amplitude;

        // Apply to position
        this.el.object3D.position.y = this.initialY + bounce;
    },

    remove: function() {
        // Reset to initial position on remove
        if (this.el.object3D && !this.shouldDeferToImmersiveWorldTransform()) {
            this.el.object3D.position.y = this.initialY;
        }
    }
});
