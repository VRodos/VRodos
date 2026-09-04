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
            bindCompileSaveSettingsControl();
            bindCompileProceedControl();
            bindCompileCancelControl();
            bindCompileDialogCloseButton();
            bindCompileLaunchControl();
            bindCompileCloseControl();
            bindCompileCopyLinkControl();
            bindStandaloneExportControl();

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

    function closeCompileDialogIfOpen() {
        const dialog = dialogState.getElement('dialog');
        if (dialog && dialog.open) {
            dialog.close();
        }
    }

    function bindCompileOpenControl() {
        const compileButton = document.getElementById('compileGameBtn');
        if (!compileButton) return;

        compileButton.addEventListener('click', () => {
            if (VRODOS.ui.desktopPerformanceProfiles && typeof VRODOS.ui.desktopPerformanceProfiles.prepare === 'function') {
                VRODOS.ui.desktopPerformanceProfiles.prepare();
            }
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
            if (typeof VRODOS.ui.applyCompileDialogSettingsToScene === 'function') {
                VRODOS.ui.applyCompileDialogSettingsToScene();
            }
            const profileEditor = VRODOS.ui.desktopPerformanceProfiles;
            const profileErrors = profileEditor && typeof profileEditor.validationErrors === 'function'
                ? profileEditor.validationErrors()
                : [];
            if (profileErrors.length) {
                const status = document.getElementById('constantUpdateUser');
                if (status) status.textContent = `Build blocked: ${profileErrors[0]}`;
                return;
            }
            dialogState.resetBuildState();

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

    function bindCompileSaveSettingsControl() {
        const saveButton = document.getElementById('compileSaveSettingsBtn');
        if (!saveButton) return;

        const label = saveButton.querySelector('span');
        saveButton.addEventListener('click', () => {
            if (typeof VRODOS.ui.applyCompileDialogSettingsToScene === 'function') {
                VRODOS.ui.applyCompileDialogSettingsToScene();
            }

            const profileEditor = VRODOS.ui.desktopPerformanceProfiles;
            const profileErrors = profileEditor && typeof profileEditor.validationErrors === 'function'
                ? profileEditor.validationErrors()
                : [];
            const status = document.getElementById('constantUpdateUser');
            if (profileErrors.length) {
                if (status) status.textContent = `Save blocked: ${profileErrors[0]}`;
                return;
            }

            saveButton.disabled = true;
            if (label) label.textContent = 'Saving…';
            if (status) status.textContent = 'Saving build settings…';

            const waitForLatestSave = typeof VRODOS.api.waitForLatestSceneSave === 'function'
                ? VRODOS.api.waitForLatestSceneSave()
                : Promise.resolve();

            waitForLatestSave
                .then(() => (typeof VRODOS.api.saveChanges === 'function') ? VRODOS.api.saveChanges({ force: true }) : Promise.resolve())
                .then(() => {
                    if (label) label.textContent = 'Saved';
                    if (status) status.textContent = 'Build settings saved. No build was started.';
                    window.setTimeout(() => {
                        if (label && saveButton.isConnected) label.textContent = 'Save';
                    }, 2000);
                })
                .catch((error) => {
                    if (label) label.textContent = 'Save';
                    if (status) status.textContent = 'Build settings could not be saved.';
                    console.warn('VRodos: build settings save failed.', error);
                })
                .finally(() => {
                    saveButton.disabled = false;
                });
        });
    }

    function bindCompileCancelControl() {
        const cancelButton = document.getElementById('compileCancelBtn');
        if (!cancelButton) return;

        cancelButton.addEventListener('click', () => {
            resumeRenderingAfterCompileDialog();
            closeCompileDialogIfOpen();
        });
    }

    function bindCompileDialogCloseButton() {
        const closeButton = dialogState.getElement('closeButton');
        if (!closeButton) return;

        closeButton.addEventListener('click', closeCompileDialogIfOpen);
    }

    function bindCompileLaunchControl() {
        const launchLink = dialogState.getElement('openWebLink');
        if (!launchLink) return;

        launchLink.addEventListener('click', closeCompileDialogIfOpen);
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

    function parseExportFilename(contentDisposition, fallback) {
        const match = String(contentDisposition || '').match(/filename="?([^";]+)"?/i);
        return match && match[1] ? match[1] : fallback;
    }

    function bindStandaloneExportControl() {
        const exportButton = document.getElementById('downloadStandaloneZip');
        if (!exportButton) return;

        exportButton.addEventListener('click', () => {
            const sceneId = VRODOS.config.sceneId || VRODOS.data.sceneId || VRODOS.data.scene_id || '';
            const projectId = VRODOS.config.projectId || VRODOS.data.projectId || '';
            const nonce = VRODOS.config.exportNonce || VRODOS.data.export_nonce || (window.vrodos_api_config && window.vrodos_api_config.exportNonce) || '';
            const ajaxBase = VRODOS.config.isAdmin === 'back' ? 'admin-ajax.php' : VRODOS.utils.getAjaxUrl();

            if (!sceneId || !projectId || !nonce) {
                console.warn('VRodos: standalone export blocked because its request context is incomplete.');
                return;
            }

            const originalHtml = exportButton.innerHTML;
            exportButton.disabled = true;
            exportButton.innerHTML = '<span class="tw-loading tw-loading-spinner tw-loading-xs"></span> Packaging';
            const params = new URLSearchParams({
                action: 'vrodos_export_scene_zip_action',
                projectId,
                vrodos_scene: sceneId,
                nonce
            });

            fetch(ajaxBase, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: params.toString()
            })
                .then(async (response) => {
                    if (!response.ok) {
                        const payload = await response.json().catch(() => null);
                        const errorData = payload && payload.data;
                        throw new Error((errorData && errorData.message) || errorData || `Export failed with HTTP ${response.status}`);
                    }
                    return Promise.all([
                        response.blob(),
                        Promise.resolve(parseExportFilename(response.headers.get('Content-Disposition'), `vrodos-scene-${sceneId}.zip`))
                    ]);
                })
                .then(([blob, filename]) => {
                    const downloadUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(downloadUrl);
                })
                .catch((error) => {
                    console.warn('VRodos: standalone ZIP export failed.', error);
                    const status = document.getElementById('constantUpdateUser');
                    if (status) status.textContent = error.message;
                })
                .finally(() => {
                    exportButton.disabled = false;
                    exportButton.innerHTML = originalHtml;
                    VRODOS.ui.refreshLucideIcons();
                });
        });
    }

    VRODOS.ui.compileDialog = compileDialogUi;
    VRODOS.ui.bindCompileDialogControls = function() {
        return compileDialogUi.bind();
    };
})();
