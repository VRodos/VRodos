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
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
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

    function renderEditorFrame(camera) {
        if (!camera || !this.renderer || !this.scene) {
            return;
        }

        this.applyEditorPerformanceProfile(false);
        this.applyEditorPixelRatio(false);
        this.renderer.render(this.scene, camera);
    }

    function applyEditorPixelRatio(force) {
        if (!this.renderer || typeof this.getEditorPixelRatio !== 'function') {
            return 1;
        }

        const nextPixelRatio = this.getEditorPixelRatio();
        const currentPixelRatio = Number(this.currentEditorPixelRatio || 0);

        if (force || Math.abs(currentPixelRatio - nextPixelRatio) > 0.001) {
            this.renderer.setPixelRatio(nextPixelRatio);
            this.currentEditorPixelRatio = nextPixelRatio;
        }

        return nextPixelRatio;
    }

    function turboResize() {
        this.updateScreenMetrics();

        this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        this.applyEditorPixelRatio(false);

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
        prototype.renderEditorFrame = renderEditorFrame;
        prototype.applyEditorPixelRatio = applyEditorPixelRatio;
        prototype.turboResize = turboResize;
        prototype.updateCameraProjectionForResize = updateCameraProjectionForResize;
    };
})();
