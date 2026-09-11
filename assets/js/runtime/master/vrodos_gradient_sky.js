/** Lights-only horizon gradient sky. Scene state and cleanup call sites remain unchanged. */
(function () {
    function getVrTakramLightsOnlySkyColors(preset) {
        if (preset === 'clear') {
            return {
                top: '#82c7fb',
                horizon: '#fff0d3',
                bottom: '#f8fbff'
            };
        }
        if (preset === 'crisp') {
            return {
                top: '#8fc8f6',
                horizon: '#fff1d8',
                bottom: '#f8fbff'
            };
        }

        return {
            top: '#94c9f5',
            horizon: '#ffefd8',
            bottom: '#f8fbff'
        };
    }

    function removeVrTakramLightsOnlyGradientSky(self) {
        const sky = self && self._vrTakramLightsOnlyGradientSky;
        if (!sky) {
            return;
        }

        if (sky.parent) {
            sky.parent.remove(sky);
        }
        if (sky.geometry && typeof sky.geometry.dispose === 'function') {
            sky.geometry.dispose();
        }
        if (sky.material && typeof sky.material.dispose === 'function') {
            sky.material.dispose();
        }
        self._vrTakramLightsOnlyGradientSky = null;
    }

    function ensureVrTakramLightsOnlyGradientSky(self, preset) {
        if (!self || !self.el || !self.el.object3D || typeof THREE === 'undefined') {
            return null;
        }

        let sky = self._vrTakramLightsOnlyGradientSky || null;
        if (!sky) {
            const geometry = new THREE.SphereGeometry(4000, 32, 16);
            const material = new THREE.ShaderMaterial({
                side: THREE.BackSide,
                depthWrite: false,
                depthTest: false,
                fog: false,
                uniforms: {
                    topColor: { value: new THREE.Color('#94c9f5') },
                    horizonColor: { value: new THREE.Color('#ffefd8') },
                    bottomColor: { value: new THREE.Color('#f8fbff') }
                },
                vertexShader: [
                    'varying vec3 vSkyDirection;',
                    'void main() {',
                    '  vSkyDirection = normalize(position);',
                    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                    '}'
                ].join('\n'),
                fragmentShader: [
                    'uniform vec3 topColor;',
                    'uniform vec3 horizonColor;',
                    'uniform vec3 bottomColor;',
                    'varying vec3 vSkyDirection;',
                    'void main() {',
                    '  float h = clamp(vSkyDirection.y * 0.5 + 0.5, 0.0, 1.0);',
                    '  vec3 lower = mix(bottomColor, horizonColor, smoothstep(0.0, 0.48, h));',
                    '  vec3 upper = mix(horizonColor, topColor, smoothstep(0.48, 1.0, h));',
                    '  vec3 color = mix(lower, upper, smoothstep(0.42, 0.66, h));',
                    '  gl_FragColor = vec4(color, 1.0);',
                    '}'
                ].join('\n')
            });
            material.toneMapped = false;

            sky = new THREE.Mesh(geometry, material);
            sky.name = 'vrodosVrTakramLightsOnlyGradientSky';
            sky.frustumCulled = false;
            sky.renderOrder = -1000;
            sky.userData.vrodosVrTakramLightsOnlySky = true;
            sky.castShadow = false;
            sky.receiveShadow = false;
            sky.raycast = function () {};
            self.el.object3D.add(sky);
            self._vrTakramLightsOnlyGradientSky = sky;
        } else if (sky.parent !== self.el.object3D) {
            self.el.object3D.add(sky);
        }

        const colors = getVrTakramLightsOnlySkyColors(preset);
        if (sky.material && sky.material.uniforms) {
            sky.material.uniforms.topColor.value.set(colors.top);
            sky.material.uniforms.horizonColor.value.set(colors.horizon);
            sky.material.uniforms.bottomColor.value.set(colors.bottom);
        }
        sky.visible = true;
        return sky;
    }

    VRODOSMaster.GradientSky = Object.freeze({
        ensureVrTakramLightsOnlyGradientSky,
        removeVrTakramLightsOnlyGradientSky
    });
})();
