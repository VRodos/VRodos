'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.api = VRODOS.api || {};

(function initVrodosCompileDialogUi() {
    const compileDialogUi = VRODOS.ui.compileDialog || {
        isBound: false,

        bind() {
            if (this.isBound) {
                return true;
            }

            bindCompileOpenControl();
            bindCompileProceedControl();
            bindCompileCancelControl();
            bindCompileCloseControl();

            this.isBound = true;
            return true;
        }
    };

    function createLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function setHtml(id, html) {
        const element = document.getElementById(id);
        if (element) element.innerHTML = html;
    }

    function setDisplay(id, value) {
        const element = document.getElementById(id);
        if (element) element.style.display = value;
    }

      function getCompilePid() {
        const cancelButton = document.getElementById('compileCancelBtn');
        return cancelButton ? cancelButton.getAttribute('data-unity-pid') : '';
    }

    function killCompileTaskIfNeeded() {
        const pid = getCompilePid();
        if (pid && typeof VRODOS.api.killCompileTask === 'function') {
            VRODOS.api.killCompileTask(pid);
        }
    }

    function resetCompileDialogStatusState() {
        const statusRow = document.getElementById('compileStatusRow');
        const appResultDiv = document.getElementById('appResultDiv');
        const topResultLink = document.getElementById('compileTopResultLink');
        const resultMeta = document.getElementById('compileResultMeta');

        if (statusRow) statusRow.style.display = 'flex';
        if (appResultDiv) appResultDiv.style.display = 'none';
        if (topResultLink) {
            topResultLink.classList.add('tw-hidden');
            topResultLink.setAttribute('href', '#');
        }
        if (resultMeta) {
            resultMeta.textContent = 'The experience is ready to be shared';
        }

        setHtml(
            'constantUpdateUser',
            '<i data-lucide="info" class="tw-w-4 tw-h-4 tw-inline-block tw-align-text-bottom tw-mr-1"></i> ' +
            'Configure your scene quality settings and click "Build" to construct the virtual world.'
        );
        createLucideIcons();
    }

    function pauseRenderingForCompileDialog() {
        VRODOS.editor.isPaused = true;
        VRODOS.ui.swapLucideIcon(document.getElementById('pauseRendering'), 'play');
    }

    function resumeRenderingAfterCompileDialog() {
        VRODOS.editor.isPaused = false;
        VRODOS.ui.swapLucideIcon(document.getElementById('pauseRendering'), 'pause');

        if (typeof VRODOS.editor.animate === 'function') {
            VRODOS.editor.animate();
        }
    }

    function showDialog(dialogId) {
        const dialog = document.getElementById(dialogId);
        if (!dialog || typeof dialog.showModal !== 'function') {
            return;
        }

        dialog.showModal();
        createLucideIcons();
    }

    function bindCompileOpenControl() {
        const compileButton = document.getElementById('compileGameBtn');
        if (!compileButton) return;

        compileButton.addEventListener('click', () => {
            if (typeof VRODOS.ui.syncCompileDialogFromSceneSettings === 'function') {
                VRODOS.ui.syncCompileDialogFromSceneSettings();
            }

            resetCompileDialogStatusState();
            showDialog('compile-dialog');
            pauseRenderingForCompileDialog();
        });
    }

    function resetCompileProgressState() {
        resetCompileDialogStatusState();
        setDisplay('compileProgressSlider', '');
        setDisplay('compileProgressTitle', '');
        setDisplay('vrodos-ziplink', 'none');
        setDisplay('vrodos-weblink', 'none');
        setHtml('compilationProgressText', '');
        setHtml('unityTaskMemValue', '0');
    }

    function showCompileSavePendingMessage() {
        setHtml(
            'constantUpdateUser',
            '<i data-lucide="save" class="tw-w-4 tw-h-4 tw-inline-block tw-align-text-bottom tw-mr-1"></i> ' +
            'Saving build settings and latest scene changes before build...'
        );
        createLucideIcons();
    }

    function showCompileSaveFailedMessage() {
        setHtml(
            'constantUpdateUser',
            '<i data-lucide="triangle-alert" class="tw-w-4 tw-h-4 tw-inline-block tw-align-text-bottom tw-mr-1"></i> ' +
            'Could not save the latest scene changes. Please try again.'
        );
        createLucideIcons();
    }

    function bindCompileProceedControl() {
        const proceedButton = document.getElementById('compileProceedBtn');
        if (!proceedButton) return;

        proceedButton.addEventListener('click', () => {
            resetCompileProgressState();

            if (typeof VRODOS.ui.applyCompileDialogSettingsToScene === 'function') {
                VRODOS.ui.applyCompileDialogSettingsToScene();
            }

            showCompileSavePendingMessage();

            const waitForLatestSave = typeof VRODOS.api.waitForLatestSceneSave === 'function'
                ? VRODOS.api.waitForLatestSceneSave()
                : Promise.resolve();

            waitForLatestSave
                .then(() => (typeof VRODOS.api.saveChanges === 'function') ? VRODOS.api.saveChanges({ force: true }) : Promise.resolve())
                .then(() => {
                    if (typeof VRODOS.api.compileScene === 'function') {
                        VRODOS.api.compileScene(VRODOS.editor.showPawnPositions, { skipSave: true });
                    }
                })
                .catch((error) => {
                    if (typeof VRODOS.api.hideCompileProgressSlider === 'function') {
                        VRODOS.api.hideCompileProgressSlider();
                    }
                    showCompileSaveFailedMessage();
                    console.warn('VRodos: compile blocked because scene save failed.', error);
                });
        });
    }

    function bindCompileCancelControl() {
        const cancelButton = document.getElementById('compileCancelBtn');
        if (!cancelButton) return;

        cancelButton.addEventListener('click', () => {
            resumeRenderingAfterCompileDialog();
            killCompileTaskIfNeeded();

            const dialog = document.getElementById('compile-dialog');
            if (dialog && dialog.open) dialog.close();
        });
    }

    function bindCompileCloseControl() {
        const compileDialog = document.getElementById('compile-dialog');
        if (!compileDialog) return;

        compileDialog.addEventListener('close', () => {
            if (VRODOS.editor.isPaused) {
                resumeRenderingAfterCompileDialog();
            }

            killCompileTaskIfNeeded();
        });
    }

    VRODOS.ui.compileDialog = compileDialogUi;
    VRODOS.ui.bindCompileDialogControls = function() {
        return compileDialogUi.bind();
    };
})();
