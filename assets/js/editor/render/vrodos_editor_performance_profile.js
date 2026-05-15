"use strict";

window.VRODOS = window.VRODOS || {};
VRODOS.editorRender = VRODOS.editorRender || {};
VRODOS.editor = VRODOS.editor || {};

(function initVrodosEditorPerformanceProfile() {
    const performanceDefaults = VRODOS.editorRender.performanceDefaults;
    const hardwareProfile = VRODOS.editorRender.hardwareProfile;

    function getEditableObjectCount() {
        if (this.selectableMeshes && this.selectableMeshes.size > 0) {
            return this.selectableMeshes.size;
        }

        const registry = VRODOS.editor && VRODOS.editor.sceneRegistry ? VRODOS.editor.sceneRegistry : null;
        if (registry && typeof registry.getSelectableRoots === 'function') {
            const roots = registry.getSelectableRoots({ rebuildIfEmpty: false });
            return roots.filter((node) => node && node.isSelectableMesh && node.vrodos_internal_helper !== true).length;
        }

        return 0;
    }

    function getEditorPerformanceProfile() {
        const hardware = hardwareProfile();
        const editableObjectCount = this.getEditableObjectCount();
        const isLowEndHardware = hardware.cores <= 4 || hardware.memory <= 4;
        const isDenseScene = editableObjectCount >= performanceDefaults.denseSceneObjectCount;
        const shouldDegrade = isLowEndHardware || isDenseScene;

        return {
            targetFps: shouldDegrade ? performanceDefaults.lowEndTargetFps : performanceDefaults.targetFps,
            pixelRatioCap: shouldDegrade ? performanceDefaults.lowEndPixelRatioCap : performanceDefaults.pixelRatioCap,
            labelFrameStride: shouldDegrade ? performanceDefaults.lowEndLabelFrameStride : performanceDefaults.labelFrameStride,
            loaderConcurrency: shouldDegrade ? performanceDefaults.lowEndLoaderConcurrency : performanceDefaults.loaderConcurrency,
            textureAnisotropy: shouldDegrade ? performanceDefaults.lowEndTextureAnisotropy : performanceDefaults.textureAnisotropy,
            isLowEndHardware,
            isDenseScene,
            editableObjectCount
        };
    }

    function applyEditorPerformanceProfile(force) {
        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? performance.now()
            : Date.now();
        const loop = VRODOS.editor && VRODOS.editor.renderLoop ? VRODOS.editor.renderLoop : null;

        if (!force && loop && (now - (loop.lastQualitySampleAt || 0)) < 1000) {
            return this.editorPerformanceProfile;
        }

        const profile = this.getEditorPerformanceProfile();
        this.editorPerformanceProfile = profile;

        if (loop) {
            loop.targetFps = profile.targetFps;
            loop.pixelRatioCap = profile.pixelRatioCap;
            loop.labelFrameStride = profile.labelFrameStride;
            loop.loaderConcurrency = profile.loaderConcurrency;
            loop.lastQualitySampleAt = now;
        }

        if (this.renderer) {
            this.renderer.setPixelRatio(this.getEditorPixelRatio());
        }
        if (this.composer) {
            if (typeof this.composer.setPixelRatio === 'function') {
                this.composer.setPixelRatio(this.getEditorPixelRatio());
            } else if (this.composer.renderer) {
                this.composer.renderer.setPixelRatio(this.getEditorPixelRatio());
            }
        }

        return profile;
    }

    function getEditorPixelRatio() {
        const devicePixelRatio = (typeof window !== 'undefined' && Number.isFinite(window.devicePixelRatio))
            ? window.devicePixelRatio
            : 1;
        const loop = VRODOS.editor && VRODOS.editor.renderLoop ? VRODOS.editor.renderLoop : {};
        const cap = Number(loop.pixelRatioCap || performanceDefaults.pixelRatioCap);

        return Math.max(1, Math.min(devicePixelRatio || 1, cap));
    }

    function getEditorTextureAnisotropyCap() {
        const profile = this.editorPerformanceProfile || this.applyEditorPerformanceProfile(true);
        return profile ? profile.textureAnisotropy : performanceDefaults.textureAnisotropy;
    }

    VRODOS.editorRender.installPerformanceProfileMethods = function(prototype) {
        if (!prototype) return;

        prototype.getEditableObjectCount = getEditableObjectCount;
        prototype.getEditorPerformanceProfile = getEditorPerformanceProfile;
        prototype.applyEditorPerformanceProfile = applyEditorPerformanceProfile;
        prototype.getEditorPixelRatio = getEditorPixelRatio;
        prototype.getEditorTextureAnisotropyCap = getEditorTextureAnisotropyCap;
    };
})();
