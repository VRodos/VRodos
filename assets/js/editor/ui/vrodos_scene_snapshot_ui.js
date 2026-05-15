'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.api = VRODOS.api || {};
VRODOS.ui = VRODOS.ui || {};

VRODOS.api.newScreenshotData = null;
VRODOS.ui.sceneSnapshotControlsBound = false;

VRODOS.ui.bindSceneSnapshotControls = function() {
    if (VRODOS.ui.sceneSnapshotControlsBound) {
        return true;
    }

    bindScreenshotControls();
    bindSceneJsonDialogControls();

    VRODOS.ui.sceneSnapshotControlsBound = true;
    return true;
};

function bindScreenshotControls() {
    const takeScreenshotButton = document.getElementById('takeScreenshotBtn');
    if (takeScreenshotButton) {
        takeScreenshotButton.addEventListener('click', () => {
            VRODOS.api.takeScreenshot();
        });
    }
}

function bindSceneJsonDialogControls() {
    const toggleButton = document.getElementById('toggleViewSceneContentBtn');
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const dialog = document.getElementById('sceneJsonContent');
            if (!dialog) return;

            if (dialog.open) {
                dialog.close();
            } else {
                VRODOS.ui.refreshSceneJsonTextarea();
                dialog.showModal();
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        });
    }

    const closeButton = document.getElementById('closeJsonBtn');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            const dialog = document.getElementById('sceneJsonContent');
            if (dialog) dialog.close();
        });
    }

    const copyButton = document.getElementById('copyJsonBtn');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const textarea = document.getElementById('vrodos_scene_json_input');
            VRODOS.utils.copyTextareaText(textarea)
                .then(() => {
                    VRODOS.ui.showTemporaryButtonSuccess('copyJsonBtn', 'Copied!');
                })
                .catch((error) => {
                    if (textarea) {
                        textarea.select();
                        textarea.setSelectionRange(0, textarea.value.length);
                    }
                    VRODOS.ui.showTemporaryButtonWarning('copyJsonBtn', 'Press Ctrl+C');
                    console.warn('VRodos: failed to copy scene JSON to clipboard.', error);
                });
        });
    }

    const textarea = document.getElementById('vrodos_scene_json_input');
    if (textarea) {
        textarea.addEventListener('input', VRODOS.ui.updateSceneJsonLineNumbers);
        textarea.addEventListener('scroll', VRODOS.ui.syncSceneJsonLineNumberScroll);
    }
}

VRODOS.ui.refreshSceneJsonTextarea = function() {
    const textarea = document.getElementById('vrodos_scene_json_input');
    if (!textarea || typeof VRODOS.api.writeCurrentSceneJsonToInput !== 'function') return;

    VRODOS.api.writeCurrentSceneJsonToInput({
        input: textarea,
        pretty: true
    });
    VRODOS.ui.updateSceneJsonLineNumbers();
};

VRODOS.ui.updateSceneJsonLineNumbers = function() {
    const textarea = document.getElementById('vrodos_scene_json_input');
    const lineNumbers = document.getElementById('vrodos_scene_json_line_numbers');
    if (!textarea || !lineNumbers) return;

    const lineCount = Math.max(1, textarea.value.split('\n').length);
    let output = '';
    for (let i = 1; i <= lineCount; i++) {
        output += i;
        if (i < lineCount) output += '\n';
    }
    lineNumbers.textContent = output;
    VRODOS.ui.syncSceneJsonLineNumberScroll();
};

VRODOS.ui.syncSceneJsonLineNumberScroll = function() {
    const textarea = document.getElementById('vrodos_scene_json_input');
    const lineNumbers = document.getElementById('vrodos_scene_json_line_numbers');
    if (!textarea || !lineNumbers) return;

    lineNumbers.scrollTop = textarea.scrollTop;
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
        VRODOS.ui.updateCurrentSceneThumbnail(src);
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
    VRODOS.ui.updateCurrentSceneThumbnail(src);
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
