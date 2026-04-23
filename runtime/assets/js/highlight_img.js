AFRAME.registerComponent('highlight', {
    schema: { type: "string", default: "default value" },
    init: function () {
        this.backgroundEl = document.querySelector('#exit_' + this.data);

        this.onClick = this.onClick.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.reset = this.reset.bind(this);
        this.onBackgroundClick = this.onBackgroundClick.bind(this); // Added binding
        this.applyHighlight = this.applyHighlight.bind(this);
        this.clearHighlight = this.clearHighlight.bind(this);

        this.el.addEventListener('click', this.onBackgroundClick);
        this.el.addEventListener('mouseenter', this.onMouseEnter);
        this.el.addEventListener('mouseleave', this.onMouseLeave);
        this.el.addEventListener('raycaster-intersected-cleared', this.onMouseLeave);
        this.el.addEventListener('raycaster-intersection-cleared', this.onMouseLeave);
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

                    var c = new THREE.Color();
                    c.set(material.color);

                    var hex_val = "0x" + c.getHexString();

                    // Only set emissive if the material supports it (Standard/Basic/Phong)
                    if (material.emissive) {
                        material.emissive = new THREE.Color(parseInt(hex_val));
                        material.emissiveIntensity = 0.8; // Increased for better visibility
                    }
                });

                child.receiveShadow = false;
            }
        })
    },

    onMouseLeave: function (evt) {
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
        this.clearHighlight();
    },

    remove: function () {
        this.clearHighlight();
        this.el.removeEventListener('click', this.onBackgroundClick);
        this.el.removeEventListener('mouseenter', this.onMouseEnter);
        this.el.removeEventListener('mouseleave', this.onMouseLeave);
        this.el.removeEventListener('raycaster-intersected-cleared', this.onMouseLeave);
        this.el.removeEventListener('raycaster-intersection-cleared', this.onMouseLeave);
        this.el.removeEventListener('click', this.onClick);
    }
});
