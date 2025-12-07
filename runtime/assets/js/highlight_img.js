AFRAME.registerComponent('highlight', {
    schema: { type: "string", default: "default value" },
    init: function () {
        this.backgroundEl = document.querySelector('#exit_' + this.data);

        this.onClick = this.onClick.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.reset = this.reset.bind(this);
        this.onBackgroundClick = this.onBackgroundClick.bind(this); // Added binding

        this.el.addEventListener('click', this.onBackgroundClick);
        this.el.addEventListener('mouseenter', this.onMouseEnter);
        this.el.addEventListener('mouseleave', this.onMouseLeave);
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
        evt.target.object3D.receiveShadow = false;

        evt.target.object3D.traverse((child) => {
            if (child.type === 'Mesh') {
                const material = child.material;

                // SAFETY CHECK: Skip ShaderMaterials to prevent crashing on A-Frame 1.7.0
                if (!material || material.type === 'ShaderMaterial' || material.type === 'RawShaderMaterial') return;

                var c = new THREE.Color();
                c.set(material.color);

                material.userData.originalColor = c.getHexString();
                var hex_val = "0x" + c.getHexString();

                // Only set emissive if the material supports it (Standard/Basic/Phong)
                if (material.emissive) {
                    material.emissive = new THREE.Color(parseInt(hex_val));
                    material.emissiveIntensity = 0.3;
                }

                child.receiveShadow = false;
            }
        })
    },

    onMouseLeave: function (evt) {
        if (this.el.is('clicked')) { return; }

        evt.target.object3D.traverse((child) => {
            if (child.type === 'Mesh') {
                const material = child.material;

                // SAFETY CHECK: Skip ShaderMaterials
                if (!material || material.type === 'ShaderMaterial' || material.type === 'RawShaderMaterial') return;

                if (material.userData.originalColor) {
                    material.color.setHex("0x" + material.userData.originalColor);
                }

                if (material.emissiveIntensity !== undefined) {
                    material.emissiveIntensity = 0;
                }

                child.receiveShadow = false;
            }
        })
    },

    onBackgroundClick: function (evt) {
        evt.target.object3D.traverse((child) => {
            if (child.type === 'Mesh') {
                const material = child.material;

                // SAFETY CHECK: Skip ShaderMaterials
                if (!material || material.type === 'ShaderMaterial' || material.type === 'RawShaderMaterial') return;

                if (material.userData.originalColor) {
                    material.color.setHex("0x" + material.userData.originalColor);
                }
            }
        })
    },

    reset: function () {
        // Reset logic
    }
});