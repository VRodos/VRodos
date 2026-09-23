/** Play the first embedded clip of an authored GLB, matching the scene editor. */
AFRAME.registerComponent('vrodos-glb-animation', {
    init: function () {
        this.resources = window.VRODOSMaster.RuntimeResources.createRegistry();
        this.model = null;
        this.mixer = null;

        this.resources.listen(this.el, 'model-loaded', (event) => {
            if (event.target === this.el) this.startAnimation(event.detail.model);
        });
        this.resources.listen(this.el, 'model-error', (event) => {
            if (event.target === this.el) this.stopAnimation();
        });

        this.startAnimation(this.el.components['gltf-model']?.model);
    },
    startAnimation: function (model) {
        if (model === this.model) return;
        this.stopAnimation();
        if (!model) return;

        this.model = model;
        const clip = Array.isArray(model.animations) ? model.animations[0] : null;
        if (!clip) return;

        const three = AFRAME.THREE;
        this.mixer = new three.AnimationMixer(model);
        this.mixer.clipAction(clip).setLoop(three.LoopRepeat, Infinity).play();
    },
    stopAnimation: function () {
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.model);
        }
        this.mixer = null;
        this.model = null;
    },
    tick: function (time, delta) {
        if (!this.mixer) return;
        if (this.el.components['gltf-model']?.model !== this.model) {
            this.stopAnimation();
            return;
        }
        if (Number.isFinite(delta) && delta > 0) this.mixer.update(delta / 1000);
    },
    remove: function () {
        this.resources.disposeAll();
        this.stopAnimation();
    }
});
