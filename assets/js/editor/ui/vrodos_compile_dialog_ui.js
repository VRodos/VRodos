'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.editor = VRODOS.editor || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.api = VRODOS.api || {};

(function initVrodosCompileDialogUi() {
    const dialogState = VRODOS.ui.compileDialogState;
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
            bindCompileCopyLinkControl();

            this.isBound = true;
            return true;
        }
    };

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
        VRODOS.ui.refreshLucideIcons();
    }

    function bindCompileOpenControl() {
        const compileButton = document.getElementById('compileGameBtn');
        if (!compileButton) return;

        compileButton.addEventListener('click', () => {
            if (typeof VRODOS.ui.syncCompileDialogFromSceneSettings === 'function') {
                VRODOS.ui.syncCompileDialogFromSceneSettings();
            }

            dialogState.resetDialogStatusState();
            showDialog('compile-dialog');
            pauseRenderingForCompileDialog();
        });
    }

    function bindCompileProceedControl() {
        const proceedButton = document.getElementById('compileProceedBtn');
        if (!proceedButton) return;

        proceedButton.addEventListener('click', () => {
            dialogState.resetBuildState();

            if (typeof VRODOS.ui.applyCompileDialogSettingsToScene === 'function') {
                VRODOS.ui.applyCompileDialogSettingsToScene();
            }

            dialogState.showSavePendingMessage();

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
                    dialogState.finishBuildState();
                    dialogState.showSaveFailedMessage();
                    console.warn('VRodos: compile blocked because scene save failed.', error);
                });
        });
    }

    function bindCompileCancelControl() {
        const cancelButton = document.getElementById('compileCancelBtn');
        if (!cancelButton) return;

        cancelButton.addEventListener('click', () => {
            resumeRenderingAfterCompileDialog();

            const dialog = dialogState.getElement('dialog');
            if (dialog && dialog.open) dialog.close();
        });
    }

    function bindCompileCloseControl() {
        const compileDialog = dialogState.getElement('dialog');
        if (!compileDialog) return;

        compileDialog.addEventListener('close', () => {
            if (VRODOS.editor.isPaused) {
                resumeRenderingAfterCompileDialog();
            }
        });
    }

    function bindCompileCopyLinkControl() {
        const copyButton = dialogState.getElement('copyWebLink');
        if (!copyButton) return;

        copyButton.addEventListener('click', () => {
            dialogState.copyPrimaryExperienceUrl()
                .catch((error) => {
                    console.warn('VRodos: failed to copy compiled scene URL to clipboard.', error);
                });
        });
    }

    VRODOS.ui.compileDialog = compileDialogUi;
    VRODOS.ui.bindCompileDialogControls = function() {
        return compileDialogUi.bind();
    };
})();
