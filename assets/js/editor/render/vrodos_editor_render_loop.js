'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.api = VRODOS.api || {};

(function initVrodosEditorRenderLoop() {
    function getEnvir() {
        return VRODOS.editor.envir || null;
    }

    function getRenderLoop() {
        return VRODOS.editor.renderLoop || null;
    }

    function isAvatarControlsEnabled() {
        return Boolean(VRODOS.editor.avatarControlsEnabled);
    }

    function getNow() {
        return window.performance && typeof window.performance.now === 'function'
            ? window.performance.now()
            : Date.now();
    }

    function getActiveCameraForEnvir(envir) {
        if (!envir) {
            return null;
        }

        if (isAvatarControlsEnabled()) {
            return envir.thirdPersonView ? envir.cameraThirdPerson : envir.cameraAvatar;
        }

        return envir.cameraOrbit;
    }

    function isTransformDragging() {
        return Boolean(
            VRODOS.editor.transforms &&
            typeof VRODOS.editor.transforms.isDragging === 'function' &&
            VRODOS.editor.transforms.isDragging()
        );
    }

    function hasAutoRotate(envir) {
        return Boolean(envir.orbitControls && envir.orbitControls.autoRotate);
    }

    function hasActiveAnimation(envir) {
        return Boolean(envir.flagPlayAnimation && envir.animationMixers && envir.animationMixers.length > 0);
    }

    function updateOrbitControls(envir) {
        const orbitControls = envir.orbitControls || null;
        if (isAvatarControlsEnabled() || !orbitControls || (!orbitControls.enableDamping && !orbitControls.autoRotate)) {
            return;
        }

        orbitControls.update();
    }

    function updatePointerLockControls() {
        if (isAvatarControlsEnabled() && typeof VRODOS.api.updatePointerLockControls === 'function') {
            VRODOS.api.updatePointerLockControls();
        }
    }

    function syncTransformCamera(camera) {
        if (camera && VRODOS.editor.transforms && typeof VRODOS.editor.transforms.setCamera === 'function') {
            VRODOS.editor.transforms.setCamera(camera);
        }
    }

    function updateAnimationMixers(envir) {
        if (!hasActiveAnimation(envir) || !envir.clock || typeof envir.clock.getDelta !== 'function') {
            return;
        }

        const delta = envir.clock.getDelta();
        for (let i = 0; i < envir.animationMixers.length; i++) {
            envir.animationMixers[i].update(delta);
        }
    }

    function updateDirectorGroundGuide(envir) {
        if (typeof envir.updateDirectorGroundGuide === 'function') {
            envir.updateDirectorGroundGuide();
        }
    }

    function renderEditorScene(envir, camera) {
        if (!camera) {
            return;
        }

        if (typeof envir.renderEditorFrame === 'function') {
            envir.renderEditorFrame(camera);
            return;
        }

        if (envir.renderer) {
            envir.renderer.render(envir.scene, camera);
        }
    }

    function shouldRenderLabels(envir, isContinuous) {
        if (!envir.labelRenderer) {
            return false;
        }

        const loop = getRenderLoop() || {};
        const labelStride = Math.max(1, Number(loop.labelFrameStride || 1));
        return !isContinuous || labelStride <= 1 || (loop.frameIndex % labelStride) === 0;
    }

    function renderLabels(envir, camera, isContinuous) {
        if (camera && shouldRenderLabels(envir, isContinuous)) {
            envir.labelRenderer.render(envir.scene, camera);
        }
    }

    function updateCompassUi(envir) {
        if (typeof envir.updateCompassUI === 'function') {
            envir.updateCompassUI();
        }
    }

    function stopLoop(loop) {
        if (loop) {
            loop.isRunning = false;
        }
        VRODOS.editor.id_animation_frame = null;
    }

    function shouldThrottleContinuousFrame(loop, timestamp, isContinuous) {
        if (!isContinuous || !loop.lastFrameAt) {
            return false;
        }

        const targetFps = Math.max(1, Number(loop.targetFps || 45));
        return (timestamp - loop.lastFrameAt) < (1000 / targetFps);
    }

    function scheduleNextFrame(step) {
        VRODOS.editor.id_animation_frame = requestAnimationFrame(step);
    }

    function scheduleLoadingRender(loop, throttleMs, elapsed) {
        if (loop.loadingRenderTimer) {
            return;
        }

        loop.loadingRenderTimer = window.setTimeout(() => {
            loop.loadingRenderTimer = null;
            loop.lastLoadingRenderAt = getNow();
            loop.needsRender = true;
            VRODOS.editor.startRenderLoop();
        }, Math.max(16, throttleMs - elapsed));
    }

    function shouldDeferLoadingRender(loop, envir) {
        if (!envir || !envir.isSceneLoading) {
            return false;
        }

        const now = getNow();
        const throttleMs = Math.max(0, Number(loop.loadingRenderThrottleMs || 0));
        const elapsed = now - Number(loop.lastLoadingRenderAt || 0);

        if (throttleMs > 0 && elapsed < throttleMs) {
            scheduleLoadingRender(loop, throttleMs, elapsed);
            return true;
        }

        loop.lastLoadingRenderAt = now;
        return false;
    }

    VRODOS.editor.getActiveCamera = function() {
        return getActiveCameraForEnvir(getEnvir());
    };

    VRODOS.editor.shouldRenderContinuously = function() {
        const envir = getEnvir();
        if (!envir) return false;

        return isAvatarControlsEnabled() ||
            isTransformDragging() ||
            hasAutoRotate(envir) ||
            hasActiveAnimation(envir);
    };

    VRODOS.editor.renderFrame = function(timestamp, isContinuous) {
        const envir = getEnvir();
        if (!envir) return;

        void timestamp;
        const camera = getActiveCameraForEnvir(envir);

        updateOrbitControls(envir);
        updatePointerLockControls();
        syncTransformCamera(camera);
        updateAnimationMixers(envir);
        updateDirectorGroundGuide(envir);
        renderEditorScene(envir, camera);
        renderLabels(envir, camera, isContinuous);
        updateCompassUi(envir);
    };

    VRODOS.editor.startRenderLoop = function() {
        const loop = getRenderLoop();
        if (!loop || loop.isRunning || VRODOS.editor.isPaused || !getEnvir()) {
            return;
        }

        loop.isRunning = true;

        const step = (timestamp) => {
            if (VRODOS.editor.isPaused || !getEnvir()) {
                stopLoop(loop);
                return;
            }

            const isContinuous = VRODOS.editor.shouldRenderContinuously();
            if (!loop.needsRender && !isContinuous) {
                stopLoop(loop);
                return;
            }

            if (shouldThrottleContinuousFrame(loop, timestamp, isContinuous)) {
                scheduleNextFrame(step);
                return;
            }

            loop.lastFrameAt = timestamp;
            loop.needsRender = false;
            loop.frameIndex = (loop.frameIndex || 0) + 1;
            VRODOS.editor.renderFrame(timestamp, isContinuous);

            if (isContinuous || loop.needsRender) {
                scheduleNextFrame(step);
                return;
            }

            stopLoop(loop);
        };

        scheduleNextFrame(step);
    };

    VRODOS.editor.stopRenderLoop = function() {
        const loop = getRenderLoop();
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
        const loop = getRenderLoop();
        if (!loop || VRODOS.editor.isPaused) {
            return;
        }

        if (shouldDeferLoadingRender(loop, getEnvir())) {
            return;
        }

        void reason;
        loop.needsRender = true;
        VRODOS.editor.startRenderLoop();
    };

    VRODOS.editor.animate = function animate() {
        VRODOS.editor.requestRender('legacy-animate');
    };
})();
