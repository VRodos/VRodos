AFRAME.registerComponent('vrodos-text-panel', {
    init: function () {
        this.resources = window.VRODOSMaster.RuntimeResources.createRegistry();
        this.backing = this.el.querySelector('[data-vrodos-text-backing]');
        this.labels = Array.from(this.el.querySelectorAll('a-text'));
        this.borders = Array.from(this.el.querySelectorAll('[data-vrodos-text-border]'));
        this.minHeight = Number(this.backing.getAttribute('height'));
        this.padding = this.minHeight / 2 - this.labels[0].object3D.position.y;
        this.resize = this.resize.bind(this);
        this.labels.forEach((label) => {
            this.resources.listen(label, 'textfontset', this.resize);
            this.resources.listen(label, 'componentchanged', (event) => {
                if (event.detail.name === 'text') this.resize();
            });
        });
        this.resize();
    },

    resize: function () {
        let textHeight = 0;
        this.labels.forEach((label) => {
            const text = label.components.text;
            const layout = text && text.geometry && text.geometry.layout;
            if (layout && text.mesh) {
                textHeight = Math.max(textHeight, (layout.height + layout.descender) * Math.abs(text.mesh.scale.y));
            }
        });
        if (!textHeight) return;
        const height = Math.max(this.minHeight, textHeight + this.padding * 2);
        this.backing.setAttribute('height', height);
        this.labels.forEach((label) => {
            label.object3D.position.y = height / 2 - this.padding;
        });
        this.borders.forEach((border) => {
            const edge = border.getAttribute('data-vrodos-text-border');
            if (edge === 'top' || edge === 'bottom') {
                border.object3D.position.y = (edge === 'top' ? 1 : -1) * (height / 2 - 0.045);
            } else {
                border.setAttribute('height', height - 0.09);
            }
        });
    },

    remove: function () {
        this.resources.disposeAll();
        this.backing = null;
        this.labels = null;
        this.borders = null;
    }
});
