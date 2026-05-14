'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};

(function initVrodosEditorDiagnostics() {
    const diagnostics = VRODOS.editor.diagnostics || {};

    diagnostics.loadTimings = diagnostics.loadTimings || [];
    diagnostics.currentLoad = null;

    diagnostics.markLoadStart = function(reason) {
        this.currentLoad = {
            reason: reason || 'scene-load',
            startedAt: typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now()
        };
        return this.currentLoad;
    };

    diagnostics.markLoadEnd = function(status) {
        if (!this.currentLoad) {
            return null;
        }

        const endedAt = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
        const timing = Object.assign({}, this.currentLoad, {
            status: status || 'complete',
            endedAt,
            durationMs: endedAt - this.currentLoad.startedAt
        });

        this.loadTimings.push(timing);
        if (this.loadTimings.length > 20) {
            this.loadTimings.shift();
        }
        this.currentLoad = null;
        return timing;
    };

    diagnostics.snapshot = function() {
        const envir = VRODOS.editor.envir || {};
        const rendererInfo = envir.renderer && envir.renderer.info ? envir.renderer.info : {};
        const registry = VRODOS.editor.sceneRegistry || null;
        const loop = VRODOS.editor.renderLoop || {};

        return {
            renderLoop: {
                isRunning: Boolean(loop.isRunning),
                needsRender: Boolean(loop.needsRender),
                frameIndex: Number(loop.frameIndex || 0),
                targetFps: Number(loop.targetFps || 0),
                pixelRatioCap: Number(loop.pixelRatioCap || 0),
                labelFrameStride: Number(loop.labelFrameStride || 0)
            },
            scene: {
                children: envir.scene && envir.scene.children ? envir.scene.children.length : 0,
                selectableRoots: registry && registry.selectableRoots ? registry.selectableRoots.size : 0,
                registryByUuid: registry && registry.byUuid ? registry.byUuid.size : 0,
                registryByName: registry && registry.byName ? registry.byName.size : 0
            },
            renderer: {
                calls: rendererInfo.render ? rendererInfo.render.calls : 0,
                triangles: rendererInfo.render ? rendererInfo.render.triangles : 0,
                geometries: rendererInfo.memory ? rendererInfo.memory.geometries : 0,
                textures: rendererInfo.memory ? rendererInfo.memory.textures : 0
            },
            loads: {
                active: this.currentLoad,
                recent: this.loadTimings.slice()
            }
        };
    };

    VRODOS.editor.diagnostics = diagnostics;
})();
