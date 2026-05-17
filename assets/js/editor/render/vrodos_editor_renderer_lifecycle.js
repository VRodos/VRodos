"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.editorRender = VRODOS.editorRender || {};
VRODOS.editor = VRODOS.editor || {};

(function initVrodosEditorRendererLifecycle() {
    const cameraDefaults = VRODOS.editorRender.camera;
    const zoomDefaults = VRODOS.editorRender.zoom;

    function requestEditorRender(reason) {
        if (VRODOS.editor && typeof VRODOS.editor.requestRender === 'function') {
            VRODOS.editor.requestRender(reason);
        }
    }

    function bindResizeHandler() {
        if (this.vrodosResizeHandlerBound === true) {
            return;
        }

        this.vrodosResizeHandler = () => {
            this.turboResize();
            requestEditorRender('resize');
        };
        window.addEventListener('resize', this.vrodosResizeHandler, true);
        this.vrodosResizeHandlerBound = true;
    }

    function configureRenderer() {
        this.renderer.shadowMap.enabled = false;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.autoClear = true;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.sortObjects = true;
    }

    function bindRendererContextHandlers() {
        if (!this.renderer || !this.renderer.domElement || this.vrodosContextHandlersBound === true) {
            return;
        }

        this.vrodosHandleContextLost = (event) => {
            event.preventDefault();
            if (VRODOS.editor && typeof VRODOS.editor.stopRenderLoop === 'function') {
                VRODOS.editor.stopRenderLoop();
            }
            console.warn('VRodos editor WebGL context lost. Rendering is paused until the browser restores it.');
        };

        this.vrodosHandleContextRestored = () => {
            this.configureRenderer();
            this.turboResize();
            requestEditorRender('webglcontextrestored');
        };

        this.renderer.domElement.addEventListener('webglcontextlost', this.vrodosHandleContextLost, false);
        this.renderer.domElement.addEventListener('webglcontextrestored', this.vrodosHandleContextRestored, false);
        this.vrodosContextHandlersBound = true;
    }

    function configureLabelRenderer() {
        Object.assign(this.labelRenderer.domElement.style, {
            position: 'absolute',
            top: '0',
            fontSize: '25pt',
            textShadow: '-1px -1px #000, 1px -1px #000, -1px 1px  #000, 1px 1px #000',
            pointerEvents: 'none'
        });
    }

    function updateScreenMetrics() {
        const width = this.vr_editor_main_div ? this.vr_editor_main_div.clientWidth : 0;
        const height = this.vr_editor_main_div ? this.vr_editor_main_div.clientHeight : 0;

        this.SCREEN_WIDTH = Math.max(width || 1, 1);
        this.SCREEN_HEIGHT = Math.max(height || 1, 1);
        this.ASPECT = this.SCREEN_WIDTH / this.SCREEN_HEIGHT;
    }

    function setComposerAndPasses(transformControls) {
        const camera = this.isAvatarControlsEnabled() ? this.cameraAvatar : this.cameraOrbit;

        if (transformControls) {
            transformControls.camera = camera;
        }

        this.composer = new THREE.EffectComposer(this.renderer);
        this.renderPass = new THREE.RenderPass(this.scene, camera);

        this.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
        this.effectFXAA.uniforms.resolution.value.set(1 / this.SCREEN_WIDTH, 1 / this.SCREEN_HEIGHT);
        this.effectFXAA.renderToScreen = true;

        this.turboResize();

        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.effectFXAA);

        this.turboResize();
    }

    function updateComposerCamera(camera) {
        if (!camera) {
            return;
        }

        if (this.renderPass) {
            this.renderPass.camera = camera;
        }
    }

    function renderEditorFrame(camera) {
        if (!camera || !this.renderer || !this.scene) {
            return;
        }

        this.applyEditorPerformanceProfile(false);

        if (this.isComposerOn && this.composer && this.renderPass) {
            this.updateComposerCamera(camera);
            this.composer.render();
            return;
        }

        this.renderer.render(this.scene, camera);
    }

    function turboResize() {
        this.updateScreenMetrics();

        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        this.renderer.setPixelRatio(this.getEditorPixelRatio());

        this.labelRenderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        this.updateCameraProjectionForResize();

        if (this.cameraAvatar) {
            this.cameraAvatar.aspect = this.ASPECT;
            this.cameraAvatar.updateProjectionMatrix();
        }

        if (this.cameraThirdPerson) {
            this.cameraThirdPerson.aspect = this.ASPECT;
            this.cameraThirdPerson.updateProjectionMatrix();
        }

        const pixelRatio = this.getEditorPixelRatio();
        if (this.composer) {
            if (typeof this.composer.setSize === 'function') {
                this.composer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
            } else if (this.composer.renderer) {
                this.composer.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
            }
            if (typeof this.composer.setPixelRatio === 'function') {
                this.composer.setPixelRatio(pixelRatio);
            } else if (this.composer.renderer) {
                this.composer.renderer.setPixelRatio(pixelRatio);
            }
        }

        if (this.effectFXAA && this.effectFXAA.uniforms && this.effectFXAA.uniforms.resolution) {
            this.effectFXAA.uniforms.resolution.value.set(
                1 / (this.SCREEN_WIDTH * pixelRatio),
                1 / (this.SCREEN_HEIGHT * pixelRatio)
            );
        }
    }

    function updateCameraProjectionForResize() {
        if (!this.cameraOrbit) {
            return;
        }

        if (this.cameraOrbit.type === 'PerspectiveCamera') {
            this.cameraOrbit.aspect = this.ASPECT;
        } else if (this.cameraOrbit.type === 'OrthographicCamera') {
            const frustumSize = this.FRUSTUM_SIZE || cameraDefaults.frustumSize;
            this.cameraOrbit.left = frustumSize * this.ASPECT / -2;
            this.cameraOrbit.right = frustumSize * this.ASPECT / 2;
            this.cameraOrbit.top = frustumSize / 2;
            this.cameraOrbit.bottom = frustumSize / -2;
            this.cameraOrbit.zoom = VRODOS.utils.clampNumber(
                this.cameraOrbit.zoom,
                zoomDefaults.min,
                zoomDefaults.max,
                zoomDefaults.fallback
            );
        }

        this.cameraOrbit.updateProjectionMatrix();
        if (this.orbitControls) {
            this.orbitControls.update();
        }
    }

    VRODOS.editorRender.installRendererLifecycleMethods = function(prototype) {
        if (!prototype) return;

        prototype.bindResizeHandler = bindResizeHandler;
        prototype.configureRenderer = configureRenderer;
        prototype.bindRendererContextHandlers = bindRendererContextHandlers;
        prototype.configureLabelRenderer = configureLabelRenderer;
        prototype.updateScreenMetrics = updateScreenMetrics;
        prototype.setComposerAndPasses = setComposerAndPasses;
        prototype.updateComposerCamera = updateComposerCamera;
        prototype.renderEditorFrame = renderEditorFrame;
        prototype.turboResize = turboResize;
        prototype.updateCameraProjectionForResize = updateCameraProjectionForResize;
    };
})();
