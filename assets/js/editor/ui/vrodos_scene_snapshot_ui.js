'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.api = VRODOS.api || {};
VRODOS.ui = VRODOS.ui || {};

VRODOS.api.newScreenshotData = null;
VRODOS.ui.sceneSnapshotControlsBound = Boolean(VRODOS.ui.sceneSnapshotControlsBound);

(function initVrodosSceneSnapshotUi() {
    const SNAPSHOT_IDS = {
        takeScreenshot: 'takeScreenshotBtn',
        jsonToggle: 'toggleViewSceneContentBtn',
        jsonDialog: 'sceneJsonContent',
        jsonClose: 'closeJsonBtn',
        jsonCopy: 'copyJsonBtn',
        jsonInput: 'vrodos_scene_json_input',
        screenshotImage: 'vrodos_scene_sshot',
        screenshotPlaceholder: 'vrodos_scene_sshot_placeholder'
    };
    const CURRENT_SCENE_THUMB_SELECTOR = '.current-scene-thumb';
    const CURRENT_SCENE_PLACEHOLDER_SELECTOR = '.current-scene-thumb-placeholder';
    const CURRENT_SCENE_THUMB_CLASS = 'tw-w-full tw-h-full tw-object-cover current-scene-thumb';

    const sceneSnapshotUi = VRODOS.ui.sceneSnapshot || {
        isBound: VRODOS.ui.sceneSnapshotControlsBound,

        bind() {
            if (this.isBound) {
                return true;
            }

            bindScreenshotControls();
            bindSceneJsonDialogControls();

            this.isBound = true;
            VRODOS.ui.sceneSnapshotControlsBound = true;
            return true;
        }
    };

    function getElement(id) {
        return document.getElementById(id);
    }

    function queryElement(selector) {
        return document.querySelector(selector);
    }

    function refreshLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function getJsonDialog() {
        return getElement(SNAPSHOT_IDS.jsonDialog);
    }

    function getJsonTextarea() {
        return getElement(SNAPSHOT_IDS.jsonInput);
    }

    function openJsonDialog(dialog) {
        VRODOS.ui.refreshSceneJsonTextarea();
        dialog.showModal();
        refreshLucideIcons();
    }

    function closeDialog(dialog) {
        if (dialog && typeof dialog.close === 'function') {
            dialog.close();
        }
    }

    function toggleJsonDialog() {
        const dialog = getJsonDialog();
        if (!dialog) return;

        if (dialog.open) {
            closeDialog(dialog);
            return;
        }

        openJsonDialog(dialog);
    }

    function bindScreenshotControls() {
        const takeScreenshotButton = getElement(SNAPSHOT_IDS.takeScreenshot);
        if (takeScreenshotButton) {
            takeScreenshotButton.addEventListener('click', () => {
                VRODOS.api.takeScreenshot();
            });
        }
    }

    function bindSceneJsonDialogControls() {
        const toggleButton = getElement(SNAPSHOT_IDS.jsonToggle);
        if (toggleButton) {
            toggleButton.addEventListener('click', toggleJsonDialog);
        }

        const closeButton = getElement(SNAPSHOT_IDS.jsonClose);
        if (closeButton) {
            closeButton.addEventListener('click', () => closeDialog(getJsonDialog()));
        }

        const copyButton = getElement(SNAPSHOT_IDS.jsonCopy);
        if (copyButton) {
            copyButton.addEventListener('click', copySceneJsonToClipboard);
        }
    }

    function selectTextareaContents(textarea) {
        if (!textarea) {
            return;
        }

        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
    }

    function copySceneJsonToClipboard() {
        const textarea = getJsonTextarea();
        VRODOS.utils.copyTextareaText(textarea)
            .then(() => {
                VRODOS.ui.showTemporaryButtonSuccess(SNAPSHOT_IDS.jsonCopy, 'Copied!');
            })
            .catch((error) => {
                selectTextareaContents(textarea);
                VRODOS.ui.showTemporaryButtonWarning(SNAPSHOT_IDS.jsonCopy, 'Press Ctrl+C');
                console.warn('VRodos: failed to copy scene JSON to clipboard.', error);
            });
    }

    function getEditorEnvironment() {
        return VRODOS.editor && VRODOS.editor.envir ? VRODOS.editor.envir : null;
    }

    function setTransformControlsVisible(isVisible) {
        if (VRODOS.editor && VRODOS.editor.transforms && typeof VRODOS.editor.transforms.setVisible === 'function') {
            VRODOS.editor.transforms.setVisible(isVisible);
        }
    }

    function getScreenshotCamera(envir) {
        if (!envir) {
            return null;
        }

        return VRODOS.editor && VRODOS.editor.avatarControlsEnabled ? envir.cameraAvatar : envir.cameraOrbit;
    }

    function createScreenshotRenderer(sourceCanvas) {
        const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true });
        renderer.setSize(sourceCanvas.width, sourceCanvas.height, false);
        return renderer;
    }

    function disposeScreenshotRenderer(renderer) {
        if (!renderer) {
            return;
        }

        if (renderer.renderLists && typeof renderer.renderLists.dispose === 'function') {
            renderer.renderLists.dispose();
        }
        renderer.dispose();
    }

    function renderScreenshotDataUrl(envir, camera) {
        let offscreenRenderer = null;

        try {
            const sourceCanvas = envir.renderer.domElement;
            offscreenRenderer = createScreenshotRenderer(sourceCanvas);
            offscreenRenderer.render(envir.scene, camera);
            return offscreenRenderer.domElement.toDataURL('image/jpeg');
        } finally {
            disposeScreenshotRenderer(offscreenRenderer);
        }
    }

    VRODOS.ui.refreshSceneJsonTextarea = function() {
        const textarea = getJsonTextarea();
        if (!textarea || typeof VRODOS.api.writeCurrentSceneJsonToInput !== 'function') return;

        VRODOS.api.writeCurrentSceneJsonToInput({
            input: textarea,
            pretty: true
        });
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
        const sceneShot = getElement(SNAPSHOT_IDS.screenshotImage);
        const placeholder = getElement(SNAPSHOT_IDS.screenshotPlaceholder);

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

        const drawerThumb = queryElement(CURRENT_SCENE_THUMB_SELECTOR);
        if (drawerThumb) {
            drawerThumb.src = src;
            return;
        }

        const placeholder = queryElement(CURRENT_SCENE_PLACEHOLDER_SELECTOR);
        if (placeholder) {
            const img = document.createElement('img');
            img.src = src;
            img.className = CURRENT_SCENE_THUMB_CLASS;
            placeholder.replaceWith(img);
        }
    };

    VRODOS.api.takeScreenshot = function() {
        const envir = getEditorEnvironment();
        if (!envir || !envir.renderer || !envir.scene) {
            return;
        }

        setTransformControlsVisible(false);

        const camera = getScreenshotCamera(envir);
        if (!camera) {
            setTransformControlsVisible(true);
            return;
        }

        try {
            VRODOS.api.newScreenshotData = renderScreenshotDataUrl(envir, camera);
            VRODOS.ui.setSceneScreenshotPreview(VRODOS.api.newScreenshotData);
        } finally {
            setTransformControlsVisible(true);
        }

        VRODOS.api.persistSceneScreenshot();
    };

    VRODOS.ui.sceneSnapshot = sceneSnapshotUi;
    VRODOS.ui.bindSceneSnapshotControls = function() {
        return sceneSnapshotUi.bind();
    };
})();
