'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.api = VRODOS.api || {};

(function initVrodosEditorRenderLoop() {
    VRODOS.editor.getActiveCamera = function() {
        const curr_camera = (typeof VRODOS.editor.avatarControlsEnabled !== 'undefined' && VRODOS.editor.avatarControlsEnabled) ?
            (VRODOS.editor.envir.thirdPersonView ? VRODOS.editor.envir.cameraThirdPerson : VRODOS.editor.envir.cameraAvatar) : VRODOS.editor.envir.cameraOrbit;

        return curr_camera;
    };

    VRODOS.editor.shouldRenderContinuously = function() {
        const envir = VRODOS.editor.envir;
        if (!envir) return false;

        if (VRODOS.editor.avatarControlsEnabled) return true;
        if (VRODOS.editor.transforms && VRODOS.editor.transforms.isDragging()) return true;
        if (envir.orbitControls && envir.orbitControls.autoRotate) return true;
        if (envir.flagPlayAnimation && envir.animationMixers && envir.animationMixers.length > 0) return true;

        return false;
    };

    VRODOS.editor.renderFrame = function(timestamp, isContinuous) {
        const envir = VRODOS.editor.envir;
        if (!envir) return;

        const curr_camera = VRODOS.editor.getActiveCamera();

        if (!VRODOS.editor.avatarControlsEnabled &&
            envir.orbitControls &&
            (envir.orbitControls.enableDamping || envir.orbitControls.autoRotate)) {
            envir.orbitControls.update();
        }

        if (VRODOS.editor.avatarControlsEnabled && typeof VRODOS.api.updatePointerLockControls === 'function') {
            VRODOS.api.updatePointerLockControls();
        }

        VRODOS.editor.transforms.setCamera(curr_camera);

        if (VRODOS.editor.envir.flagPlayAnimation && VRODOS.editor.envir.animationMixers.length > 0) {
            const new_time = VRODOS.editor.envir.clock.getDelta();
            for (let i = 0; i < VRODOS.editor.envir.animationMixers.length; i++) {
                VRODOS.editor.envir.animationMixers[i].update(new_time);
            }
        }

        if (typeof VRODOS.editor.envir.updateDirectorGroundGuide === 'function') {
            VRODOS.editor.envir.updateDirectorGroundGuide();
        }

        if (typeof envir.renderEditorFrame === 'function') {
            envir.renderEditorFrame(curr_camera);
        } else if (envir.renderer) {
            envir.renderer.render(envir.scene, curr_camera);
        }

        const loop = VRODOS.editor.renderLoop || {};
        const labelStride = Math.max(1, Number(loop.labelFrameStride || 1));
        if (envir.labelRenderer && (!isContinuous || labelStride <= 1 || (loop.frameIndex % labelStride) === 0)) {
            envir.labelRenderer.render(envir.scene, curr_camera);
        }

        if (typeof VRODOS.editor.envir.updateCompassUI === 'function') {
            VRODOS.editor.envir.updateCompassUI();
        }
    };

    VRODOS.editor.startRenderLoop = function() {
        const loop = VRODOS.editor.renderLoop;
        if (!loop || loop.isRunning || VRODOS.editor.isPaused || !VRODOS.editor.envir) {
            return;
        }

        loop.isRunning = true;

        const step = (timestamp) => {
            if (VRODOS.editor.isPaused || !VRODOS.editor.envir) {
                loop.isRunning = false;
                VRODOS.editor.id_animation_frame = null;
                return;
            }

            const isContinuous = VRODOS.editor.shouldRenderContinuously();
            if (!loop.needsRender && !isContinuous) {
                loop.isRunning = false;
                VRODOS.editor.id_animation_frame = null;
                return;
            }

            const targetFps = Math.max(1, Number(loop.targetFps || 45));
            const minFrameMs = 1000 / targetFps;
            if (isContinuous && loop.lastFrameAt && (timestamp - loop.lastFrameAt) < minFrameMs) {
                VRODOS.editor.id_animation_frame = requestAnimationFrame(step);
                return;
            }

            loop.lastFrameAt = timestamp;
            loop.needsRender = false;
            loop.frameIndex = (loop.frameIndex || 0) + 1;
            VRODOS.editor.renderFrame(timestamp, isContinuous);

            if (isContinuous || loop.needsRender) {
                VRODOS.editor.id_animation_frame = requestAnimationFrame(step);
                return;
            }

            loop.isRunning = false;
            VRODOS.editor.id_animation_frame = null;
        };

        VRODOS.editor.id_animation_frame = requestAnimationFrame(step);
    };

    VRODOS.editor.stopRenderLoop = function() {
        const loop = VRODOS.editor.renderLoop;
        if (VRODOS.editor.id_animation_frame) {
            cancelAnimationFrame(VRODOS.editor.id_animation_frame);
        }
        VRODOS.editor.id_animation_frame = null;
        if (loop) {
            loop.isRunning = false;
            loop.needsRender = false;
        }
    };

    VRODOS.editor.requestRender = function(reason) {
        const loop = VRODOS.editor.renderLoop;
        if (!loop || VRODOS.editor.isPaused) {
            return;
        }

        const envir = VRODOS.editor.envir;
        if (envir && envir.isSceneLoading) {
            const now = window.performance && typeof window.performance.now === 'function'
                ? window.performance.now()
                : Date.now();
            const throttleMs = Math.max(0, Number(loop.loadingRenderThrottleMs || 0));
            const elapsed = now - Number(loop.lastLoadingRenderAt || 0);

            if (throttleMs > 0 && elapsed < throttleMs) {
                if (!loop.loadingRenderTimer) {
                    loop.loadingRenderTimer = window.setTimeout(() => {
                        loop.loadingRenderTimer = null;
                        loop.lastLoadingRenderAt = window.performance && typeof window.performance.now === 'function'
                            ? window.performance.now()
                            : Date.now();
                        loop.needsRender = true;
                        VRODOS.editor.startRenderLoop();
                    }, Math.max(16, throttleMs - elapsed));
                }
                return;
            }

            loop.lastLoadingRenderAt = now;
        }

        void reason;
        loop.needsRender = true;
        VRODOS.editor.startRenderLoop();
    };

    VRODOS.editor.animate = function animate() {
        VRODOS.editor.requestRender('legacy-animate');
    };
})();

