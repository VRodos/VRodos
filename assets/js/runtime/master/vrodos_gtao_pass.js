import * as THREE from 'three';
import { Pass } from 'postprocessing';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';

export function gtaoOptionsForPreset(preset) {
    switch (preset) {
        case 'soft': return { samples: 8, denoiseSamples: 8, resolutionScale: 0.5, intensity: 0.65 };
        case 'strong': return { samples: 20, denoiseSamples: 16, resolutionScale: 0.75, intensity: 1.35 };
        default: return { samples: 12, denoiseSamples: 12, resolutionScale: 0.5, intensity: 1 };
    }
}

// AO is computed from a matching, single-sample geometry buffer. The beauty
// buffer keeps its MSAA samples; AO never samples its resolved depth at edges.
export class VRodosGtaoPass extends Pass {
    constructor(scene, camera, normalPass, preset) {
        super('VRodosGTAO');
        this.needsSwap = true;
        this.normalPass = normalPass; // Borrowed; the composer owns this pass.
        this.options = gtaoOptionsForPreset(preset);
        const target = normalPass.renderTarget;
        if (!target.depthTexture) {
            target.depthTexture = new THREE.DepthTexture(target.width, target.height, THREE.FloatType);
            target.depthTexture.name = 'VRodos.GTAO.GeometryDepth';
            target.dispose();
        }
        this.gtao = new GTAOPass(scene, camera);
        this.gtao.setGBuffer(target.depthTexture, normalPass.texture);
        this.gtao.output = GTAOPass.OUTPUT.Off;
        this.gtao.updateGtaoMaterial({ radius: 0.75, thickness: 1, samples: this.options.samples });
        this.gtao.updatePdMaterial({ samples: this.options.denoiseSamples, radius: 4 });
        this.fullscreenMaterial = new THREE.ShaderMaterial({
            name: 'VRodosGTAOComposite', depthTest: false, depthWrite: false, toneMapped: false,
            uniforms: {
                inputBuffer: new THREE.Uniform(null), aoBuffer: new THREE.Uniform(this.gtao.gtaoMap),
                geometryDepth: new THREE.Uniform(target.depthTexture), geometryNormal: new THREE.Uniform(normalPass.texture),
                resolution: new THREE.Uniform(new THREE.Vector2()), aoResolution: new THREE.Uniform(new THREE.Vector2()),
                cameraNear: new THREE.Uniform(camera.near), cameraFar: new THREE.Uniform(camera.far),
                perspectiveCamera: new THREE.Uniform(camera.isPerspectiveCamera), intensity: new THREE.Uniform(this.options.intensity)
            },
            vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
            fragmentShader: /* glsl */`
                varying vec2 vUv;
                uniform sampler2D inputBuffer, aoBuffer, geometryDepth, geometryNormal;
                uniform vec2 resolution, aoResolution;
                uniform float cameraNear, cameraFar, intensity;
                uniform bool perspectiveCamera;
                float viewDepth(vec2 uv) {
                    float d = texture2D(geometryDepth, uv).r;
                    return perspectiveCamera ? cameraNear * cameraFar / (cameraFar - d * (cameraFar - cameraNear))
                        : mix(cameraNear, cameraFar, d);
                }
                void main() {
                    vec4 color = texture2D(inputBuffer, vUv);
                    float ao = 1.0;
                    if (texture2D(geometryDepth, vUv).r < 1.0) {
                        float z = viewDepth(vUv);
                        vec3 n = normalize(texture2D(geometryNormal, vUv).xyz * 2.0 - 1.0);
                        vec2 pos = vUv * aoResolution - 0.5;
                        vec2 cell = floor(pos), f = fract(pos);
                        float total = 0.0, sum = 0.0;
                        for (int y = 0; y < 2; y++) {
                            for (int x = 0; x < 2; x++) {
                                vec2 offset = vec2(float(x), float(y));
                                vec2 uv = (cell + offset + 0.5) / aoResolution;
                                vec3 sn = normalize(texture2D(geometryNormal, uv).xyz * 2.0 - 1.0);
                                vec2 bilinear = mix(1.0 - f, f, offset);
                                float w = bilinear.x * bilinear.y * pow(max(dot(n, sn), 0.0), 16.0)
                                    * exp(-abs(z - viewDepth(uv)) / max(0.02, z * 0.01));
                                sum += texture2D(aoBuffer, uv).r * w;
                                total += w;
                            }
                        }
                        ao = total > 0.00001 ? sum / total : 1.0;
                        vec2 pixel = 1.0 / resolution;
                        float jump = max(max(abs(viewDepth(vUv + vec2(pixel.x, 0.0)) - z), abs(viewDepth(vUv - vec2(pixel.x, 0.0)) - z)),
                            max(abs(viewDepth(vUv + vec2(0.0, pixel.y)) - z), abs(viewDepth(vUv - vec2(0.0, pixel.y)) - z)));
                        // At silhouettes the resolved MSAA color contains multiple
                        // surfaces. Do not darken those mixed-coverage pixels.
                        ao = mix(ao, 1.0, smoothstep(max(0.02, z * 0.05), max(0.04, z * 0.1), jump));
                    }
                    gl_FragColor = vec4(color.rgb * clamp(1.0 - (1.0 - ao) * intensity, 0.0, 1.0), color.a);
                }
            `
        });
    }
    set mainCamera(camera) {
        this.gtao.camera = camera;
        this.normalPass.mainCamera = camera;
        const u = this.fullscreenMaterial.uniforms;
        u.cameraNear.value = camera.near; u.cameraFar.value = camera.far;
        u.perspectiveCamera.value = camera.isPerspectiveCamera;
    }
    get mainCamera() { return this.gtao.camera; }
    setSize(width, height) {
        const w = Math.max(1, Math.round(width * this.options.resolutionScale));
        const h = Math.max(1, Math.round(height * this.options.resolutionScale));
        this.gtao.setSize(w, h);
        this.fullscreenMaterial.uniforms.resolution.value.set(width, height);
        this.fullscreenMaterial.uniforms.aoResolution.value.set(w, h);
    }
    render(renderer, inputBuffer, outputBuffer) {
        const target = renderer.getRenderTarget();
        try {
            this.mainCamera = this.gtao.camera;
            this.gtao.render(renderer, null, inputBuffer);
            this.fullscreenMaterial.uniforms.inputBuffer.value = inputBuffer.texture;
            renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer);
            renderer.render(this.scene, this.camera);
        } finally {
            renderer.setRenderTarget(target);
        }
    }
    dispose() {
        if (!this.gtao) return;
        // Three's FullScreenQuad geometry is shared across addon pass instances.
        // GTAOPass owns its targets/materials, but must not release that geometry.
        this.gtao._fsQuad.dispose = () => undefined;
        this.gtao.dispose();
        const material = this.fullscreenMaterial;
        for (const key of ['inputBuffer', 'aoBuffer', 'geometryDepth', 'geometryNormal']) material.uniforms[key].value = null;
        material.dispose();
        this.scene.remove(this.screen);
        this.screen = null;
        this.gtao = null; this.normalPass = null;
        // Geometry/depth/normal textures are borrowed from their owning passes.
        // Never run Pass.dispose(), which would dispose borrowed properties.
    }
}
