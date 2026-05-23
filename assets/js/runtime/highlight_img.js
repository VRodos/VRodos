AFRAME.registerComponent('highlight', {
    schema: { type: "string", default: "default value" },
    init: function () {
        this.backgroundEl = document.querySelector('#exit_' + this.data);
        this.hoverSources = new Set();
        this.mouseHovering = false;
        this.highlightColor = new THREE.Color(0x5cf2a0);

        this.onClick = this.onClick.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onRaycasterIntersected = this.onRaycasterIntersected.bind(this);
        this.onRaycasterIntersectionCleared = this.onRaycasterIntersectionCleared.bind(this);
        this.reset = this.reset.bind(this);
        this.onBackgroundClick = this.onBackgroundClick.bind(this); // Added binding
        this.applyHighlight = this.applyHighlight.bind(this);
        this.clearHighlight = this.clearHighlight.bind(this);

        this.el.addEventListener('click', this.onBackgroundClick);
        this.el.addEventListener('mouseenter', this.onMouseEnter);
        this.el.addEventListener('mouseleave', this.onMouseLeave);
        this.el.addEventListener('raycaster-intersected', this.onRaycasterIntersected);
        this.el.addEventListener('raycaster-intersected-cleared', this.onRaycasterIntersectionCleared);
        this.el.addEventListener('raycaster-intersection-cleared', this.onRaycasterIntersectionCleared);
        this.el.addEventListener('click', this.onClick);

        this.el.addEventListener("animationcomplete", e => {
            if (e.detail.name == "animation__scale") {
                console.log(e.detail.name + " Completed");
            }
        });
    },

    onClick: function (evt) {
        evt.target.object3D.traverse((child) => {
            if (child.type === 'Mesh') {
                const material = child.material;
                // SAFETY CHECK: Skip ShaderMaterials to prevent crashing on A-Frame 1.7.0
                if (!material || material.type === 'ShaderMaterial' || material.type === 'RawShaderMaterial') return;

                // Logic can go here if needed
            }
        })
    },

    onMouseEnter: function (evt) {
        this.mouseHovering = true;
        this.applyHighlight();
    },

    onRaycasterIntersected: function (evt) {
        const source = evt && evt.detail && evt.detail.el ? evt.detail.el : 'raycaster';
        this.hoverSources.add(source);
        this.applyHighlight();
    },

    applyHighlight: function () {
        this.el.object3D.receiveShadow = false;

        this.el.object3D.traverse((child) => {
            if (child.type === 'Mesh') {
                const materials = Array.isArray(child.material) ? child.material : [child.material];

                materials.forEach(material => {
                    // SAFETY CHECK: Skip ShaderMaterials
                    if (!material || material.type === 'ShaderMaterial' || material.type === 'RawShaderMaterial') return;

                    if (!material.userData.vrodosHighlightOriginal) {
                        material.userData.vrodosHighlightOriginal = {
                            color: material.color ? material.color.getHex() : null,
                            emissive: material.emissive ? material.emissive.getHex() : null,
                            emissiveIntensity: material.emissiveIntensity || 0
                        };
                    }

                    const original = material.userData.vrodosHighlightOriginal;

                    if (material.color && original.color !== null) {
                        material.color.setHex(original.color);
                        material.color.lerp(this.highlightColor, 0.35);
                    }

                    // Only set emissive if the material supports it (Standard/Phong/etc.).
                    if (material.emissive) {
                        material.emissive.copy(this.highlightColor);
                        material.emissiveIntensity = Math.max(original.emissiveIntensity, 0.65);
                    }

                    material.needsUpdate = true;
                });

                child.receiveShadow = false;
            }
        })
    },

    onMouseLeave: function (evt) {
        this.mouseHovering = false;
        if (this.hoverSources.size === 0) {
            this.clearHighlight();
        }
    },

    onRaycasterIntersectionCleared: function (evt) {
        const source = evt && evt.detail && evt.detail.el ? evt.detail.el : null;
        if (source) {
            this.hoverSources.delete(source);
            if (source.hasAttribute && source.hasAttribute('cursor')) {
                this.mouseHovering = false;
            }
        } else {
            this.hoverSources.clear();
        }

        if (this.hoverSources.size > 0 || this.mouseHovering) {
            return;
        }

        this.clearHighlight();
    },

    clearHighlight: function () {
        this.el.object3D.traverse((child) => {
            if (child.type === 'Mesh') {
                const materials = Array.isArray(child.material) ? child.material : [child.material];

                materials.forEach(material => {
                    // SAFETY CHECK: Skip ShaderMaterials
                    if (!material || material.type === 'ShaderMaterial' || material.type === 'RawShaderMaterial') return;

                    const original = material.userData.vrodosHighlightOriginal;
                    if (!original) {
                        return;
                    }

                    if (material.color && original.color !== null) {
                        material.color.setHex(original.color);
                    }

                    if (material.emissive && original.emissive !== null) {
                        material.emissive.setHex(original.emissive);
                    }

                    if (material.emissiveIntensity !== undefined) {
                        material.emissiveIntensity = original.emissiveIntensity;
                    }

                    material.needsUpdate = true;
                    delete material.userData.vrodosHighlightOriginal;
                });

                child.receiveShadow = false;
            }
        })
    },

    onBackgroundClick: function (evt) {
        this.clearHighlight();
    },

    reset: function () {
        this.hoverSources.clear();
        this.mouseHovering = false;
        this.clearHighlight();
    },

    remove: function () {
        this.hoverSources.clear();
        this.mouseHovering = false;
        this.clearHighlight();
        this.el.removeEventListener('click', this.onBackgroundClick);
        this.el.removeEventListener('mouseenter', this.onMouseEnter);
        this.el.removeEventListener('mouseleave', this.onMouseLeave);
        this.el.removeEventListener('raycaster-intersected', this.onRaycasterIntersected);
        this.el.removeEventListener('raycaster-intersected-cleared', this.onRaycasterIntersectionCleared);
        this.el.removeEventListener('raycaster-intersection-cleared', this.onRaycasterIntersectionCleared);
        this.el.removeEventListener('click', this.onClick);
    }
});
