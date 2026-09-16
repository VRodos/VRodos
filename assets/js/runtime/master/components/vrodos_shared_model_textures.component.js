/* Share immutable GLB image sources; Three owns GPU reference counting by source/sampler. */
(function () {
    const scenes = new WeakMap();
    AFRAME.registerComponent('vrodos-shared-model-textures', {
        init: function () {
            this.onModelLoaded = this.share.bind(this);
            this.el.addEventListener('model-loaded', this.onModelLoaded);
            this.share();
        },
        share: function () {
            const root = this.el.getObject3D('mesh');
            if (!root || root === this.root) return;
            this.release();
            const scene = this.el.sceneEl;
            let src = this.el.getAttribute('gltf-model');
            if (typeof src !== 'string' || !src || !scene) return;
            if (src[0] === '#') src = scene.querySelector(src)?.getAttribute('src');
            if (!src) return;
            const textures = new Set();
            root.traverse(node => {
                for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
                    if (!material) continue;
                    for (const key of Object.keys(material).sort()) {
                        const texture = material[key];
                        if (texture?.isTexture && !texture.isVideoTexture && !texture.isCanvasTexture) textures.add(texture);
                    }
                }
            });
            if (!textures.size) return;
            let pool = scenes.get(scene);
            if (!pool) { pool = new Map(); scenes.set(scene, pool); }
            let entry = pool.get(src);
            const list = Array.from(textures);
            if (!entry) {
                entry = { images: list.map(texture => ({ source: texture.source, mipmaps: texture.mipmaps })), users: new Set() };
                pool.set(src, entry);
            } else {
                // Only identical immutable GLBs participate. Keep per-placement Texture and Material state.
                if (entry.images.length !== list.length) return;
                list.forEach((texture, index) => {
                    const image = entry.images[index];
                    if (texture.source === image.source) return;
                    texture.dispose(); // Release an existing upload before changing the source identity.
                    texture.source = image.source;
                    texture.mipmaps = image.mipmaps;
                    texture.needsUpdate = true;
                });
            }
            entry.users.add(this);
            this.entry = entry;
            this.pool = pool;
            this.key = src;
            this.root = root;
        },
        release: function () {
            if (this.entry) {
                this.entry.users.delete(this);
                if (!this.entry.users.size) this.pool.delete(this.key);
            }
            this.entry = null;
            this.pool = null;
            this.root = null;
        },
        remove: function () {
            this.el.removeEventListener('model-loaded', this.onModelLoaded);
            this.release();
        }
    });
}());
