'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.api = VRODOS.api || {};
VRODOS.ui = VRODOS.ui || {};

VRODOS.api.newScreenshotData = null;
VRODOS.api.isSceneIconManuallySelected = false;

VRODOS.ui.refreshSceneJsonTextarea = function() {
    const textarea = document.getElementById('vrodos_scene_json_input');
    if (!textarea || !VRODOS.exporter || !VRODOS.exporter.SceneExporter || !VRODOS.editor.envir || !VRODOS.editor.envir.scene) return;

    const exporter = new VRODOS.exporter.SceneExporter();
    const exportedJson = exporter.parse(VRODOS.editor.envir.scene);

    try {
        textarea.value = JSON.stringify(JSON.parse(exportedJson), null, 2);
    } catch (error) {
        textarea.value = exportedJson;
    }
};

VRODOS.api.waitForLatestSceneSave = function() {
    if (typeof VRODOS.api.whenSceneSaveSettles === 'function') {
        return VRODOS.api.whenSceneSaveSettles();
    }

    return Promise.resolve();
};

VRODOS.api.persistSceneScreenshot = function() {
    return VRODOS.api.waitForLatestSceneSave()
        .then(() => (typeof VRODOS.api.saveChanges === 'function') ? VRODOS.api.saveChanges({force: true}) : Promise.resolve())
        .catch((error) => {
            console.warn('VRodos: scene screenshot could not be saved.', error);
        });
};

VRODOS.ui.setSceneScreenshotPreview = function(src) {
    const sceneShot = document.getElementById('vrodos_scene_sshot');
    const placeholder = document.getElementById('vrodos_scene_sshot_placeholder');

    if (!sceneShot) {
        return;
    }

    if (src) {
        sceneShot.src = src;
        sceneShot.classList.remove('tw-hidden');
        if (placeholder) {
            placeholder.classList.add('tw-hidden');
        }
    } else {
        sceneShot.removeAttribute('src');
        sceneShot.classList.add('tw-hidden');
        if (placeholder) {
            placeholder.classList.remove('tw-hidden');
        }
    }
};

VRODOS.ui.updateCurrentSceneThumbnail = function(src) {
    if (!src) {
        return;
    }

    const drawerThumb = document.querySelector('.current-scene-thumb');
    if (drawerThumb) {
        drawerThumb.src = src;
        return;
    }

    const placeholder = document.querySelector('.current-scene-thumb-placeholder');
    if (placeholder) {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'tw-w-full tw-h-full tw-object-cover current-scene-thumb';
        placeholder.replaceWith(img);
    }
};

VRODOS.api.takeScreenshot = function() {
    if (!VRODOS.editor || !VRODOS.editor.envir || !VRODOS.editor.envir.renderer || !VRODOS.editor.envir.scene) {
        return;
    }

    if (VRODOS.editor.transforms) {
        VRODOS.editor.transforms.setVisible(false);
    }

    const camera = VRODOS.editor.avatarControlsEnabled ? VRODOS.editor.envir.cameraAvatar : VRODOS.editor.envir.cameraOrbit;
    if (!camera) {
        if (VRODOS.editor.transforms) {
            VRODOS.editor.transforms.setVisible(true);
        }
        return;
    }

    let offscreenRenderer = null;

    try {
        const sourceCanvas = VRODOS.editor.envir.renderer.domElement;
        offscreenRenderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true });
        offscreenRenderer.setSize(sourceCanvas.width, sourceCanvas.height);
        offscreenRenderer.render(VRODOS.editor.envir.scene, camera);

        VRODOS.api.newScreenshotData = offscreenRenderer.domElement.toDataURL('image/jpeg');
        VRODOS.ui.setSceneScreenshotPreview(VRODOS.api.newScreenshotData);
        VRODOS.ui.updateCurrentSceneThumbnail(VRODOS.api.newScreenshotData);
    } finally {
        if (offscreenRenderer) {
            offscreenRenderer.dispose();
        }

        if (VRODOS.editor.transforms) {
            VRODOS.editor.transforms.setVisible(true);
        }
    }

    VRODOS.api.persistSceneScreenshot();
};
