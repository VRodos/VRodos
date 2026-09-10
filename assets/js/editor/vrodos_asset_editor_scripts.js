/**
 * Asset editor helpers for the model-package upload and preview workflow.
 */
'use strict';

function vrodos_set_asset_screenshot_preview(src) {
    const sshotImg = document.getElementById('sshotPreviewImg');
    const placeholder = document.getElementById('sshotPreviewPlaceholder');
    const hasSource = Boolean(src);

    if (sshotImg) {
        if (hasSource) {
            sshotImg.src = src;
            sshotImg.classList.remove('tw-hidden');
        } else {
            sshotImg.removeAttribute('src');
            sshotImg.classList.add('tw-hidden');
        }
    }

    if (placeholder) {
        placeholder.classList.toggle('tw-hidden', hasSource);
    }
}

function vrodos_clear_asset_files(asset_viewer_3d_kernel) {
    if (asset_viewer_3d_kernel && asset_viewer_3d_kernel.renderer) {
        asset_viewer_3d_kernel.clearAllAssets('vrodos_clear_asset_files');
    }

    const glbInput = document.getElementById('glbFileInput');
    if (glbInput) {
        glbInput.value = '';
    }

    const fileUploadInput = document.getElementById('fileUploadInput');
    if (fileUploadInput) {
        fileUploadInput.value = '';
    }

    const importTokenInput = document.getElementById('assetImportUploadToken');
    if (importTokenInput) {
        importTokenInput.value = '';
    }

    window.vrodosZipPreflightState = {
        status: 'idle',
        token: '',
        canSave: true,
        message: ''
    };

    const screenshotInput = document.getElementById('sshotFileInput');
    if (screenshotInput) {
        screenshotInput.value = '';
    }

    const sshotImg = document.getElementById('sshotPreviewImg');
    if (sshotImg) {
        vrodos_set_asset_screenshot_preview(window.sshotPreviewDefaultImg);
    }

    const previewTitle = document.getElementById('objectPreviewTitle');
    if (previewTitle) {
        previewTitle.style.display = 'none';
    }
}

window.vrodosZipPreflightState = window.vrodosZipPreflightState || {
    status: 'idle',
    token: '',
    canSave: true,
    message: ''
};

let vrodosModelSelectionSerial = 0;
const VRODOS_MODEL_UPLOAD_EXTENSIONS = ['glb', 'zip', 'blend', 'fbx', 'obj', 'dae', 'gltf'];
const VRODOS_MODEL_CONVERSION_EXTENSIONS = ['blend', 'fbx', 'obj', 'dae', 'gltf'];

function vrodos_set_asset_editor_submit_locked(isLocked, label) {
    const submitBtn = document.getElementById('formSubmitBtn');
    if (!submitBtn) {
        return;
    }

    if (!submitBtn.dataset.vrodosDefaultHtml) {
        submitBtn.dataset.vrodosDefaultHtml = submitBtn.innerHTML;
    }

    submitBtn.disabled = Boolean(isLocked);
    submitBtn.setAttribute('aria-busy', isLocked ? 'true' : 'false');

    if (label) {
        submitBtn.textContent = label;
        return;
    }

    if (!isLocked) {
        submitBtn.innerHTML = submitBtn.dataset.vrodosDefaultHtml;
    }
}
window.vrodos_set_asset_editor_submit_locked = vrodos_set_asset_editor_submit_locked;

let vrodosAssetSaveProgressPreviousFocus = null;
let vrodosAssetSaveProgressStartedAt = 0;
let vrodosAssetSaveProgressElapsedTimer = 0;
const VRODOS_ASSET_SAVE_STAGES = ['upload', 'validate', 'record', 'media', 'finalize'];

function vrodos_update_asset_save_elapsed() {
    const elapsed = document.getElementById('assetSaveProgressElapsed');
    if (!elapsed || !vrodosAssetSaveProgressStartedAt) {
        return;
    }
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - vrodosAssetSaveProgressStartedAt) / 1000));
    elapsed.textContent = `Elapsed ${elapsedSeconds}s`;
}

function vrodos_update_asset_save_steps(stage) {
    const normalizedStage = String(stage || '').toLowerCase();
    if (!normalizedStage) {
        return;
    }

    const activeIndex = VRODOS_ASSET_SAVE_STAGES.indexOf(normalizedStage);
    const completeAll = normalizedStage === 'complete';
    document.querySelectorAll('[data-save-stage]').forEach((step) => {
        const stepIndex = VRODOS_ASSET_SAVE_STAGES.indexOf(step.dataset.saveStage || '');
        const isComplete = completeAll || (activeIndex >= 0 && stepIndex < activeIndex);
        const isActive = !completeAll && activeIndex >= 0 && stepIndex === activeIndex;
        step.classList.toggle('is-complete', isComplete);
        step.classList.toggle('is-active', isActive);
        if (isActive) {
            step.setAttribute('aria-current', 'step');
        } else {
            step.removeAttribute('aria-current');
        }
    });
}

function vrodos_set_asset_save_progress(options = {}) {
    const overlay = document.getElementById('assetSaveProgressOverlay');
    const editor = document.getElementById('vrodos-asset-editor');
    const title = document.getElementById('assetSaveProgressTitle');
    const message = document.getElementById('assetSaveProgressMessage');
    const detail = document.getElementById('assetSaveProgressDetail');
    const percentLabel = document.getElementById('assetSaveProgressPercent');
    const track = document.getElementById('assetSaveProgressTrack');
    const bar = document.getElementById('assetSaveProgressBar');
    if (!overlay || !track || !bar) {
        return;
    }

    const isIndeterminate = options.indeterminate === true;
    const isFailed = options.status === 'failed';
    const percent = Math.max(0, Math.min(100, Math.round(Number(options.percent) || 0)));
    const wasHidden = overlay.classList.contains('tw-hidden');

    overlay.inert = false;
    overlay.classList.remove('tw-hidden');
    overlay.classList.add('tw-flex');
    overlay.setAttribute('aria-hidden', 'false');
    if (editor) {
        editor.setAttribute('aria-busy', 'true');
        if (wasHidden) {
            vrodosAssetSaveProgressPreviousFocus = document.activeElement;
            Array.from(editor.children).forEach((child) => {
                if (child !== overlay && !child.inert) {
                    child.inert = true;
                    child.dataset.vrodosProgressInert = 'true';
                }
            });
        }
    }
    if (title && options.title) {
        title.textContent = options.title;
    }
    if (message && options.message) {
        message.textContent = options.message;
    }
    if (detail) {
        detail.textContent = options.detail || '';
    }
    vrodos_update_asset_save_steps(options.stage);
    if (wasHidden) {
        vrodosAssetSaveProgressStartedAt = Date.now();
        window.clearInterval(vrodosAssetSaveProgressElapsedTimer);
        vrodosAssetSaveProgressElapsedTimer = window.setInterval(vrodos_update_asset_save_elapsed, 1000);
        vrodos_update_asset_save_elapsed();
        window.requestAnimationFrame(() => {
            if (!overlay.inert && overlay.getAttribute('aria-hidden') === 'false') {
                overlay.focus();
            }
        });
    }

    bar.classList.toggle('vrodos-indeterminate', isIndeterminate);
    bar.classList.toggle('vrodos-progress-error', isFailed);
    if (isIndeterminate) {
        bar.style.removeProperty('width');
        track.removeAttribute('aria-valuemin');
        track.removeAttribute('aria-valuemax');
        track.removeAttribute('aria-valuenow');
        if (percentLabel) {
            percentLabel.textContent = 'Working…';
        }
        return;
    }

    bar.style.setProperty('width', `${percent}%`, 'important');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('aria-valuenow', String(percent));
    if (percentLabel) {
        percentLabel.textContent = `${percent}%`;
    }
}

function vrodos_hide_asset_save_progress() {
    const overlay = document.getElementById('assetSaveProgressOverlay');
    const editor = document.getElementById('vrodos-asset-editor');
    const focusTarget = vrodosAssetSaveProgressPreviousFocus;
    if (overlay && overlay.contains(document.activeElement)) {
        document.activeElement.blur();
    }
    if (editor) {
        editor.removeAttribute('aria-busy');
        Array.from(editor.children).forEach((child) => {
            if (child.dataset.vrodosProgressInert === 'true') {
                child.inert = false;
                delete child.dataset.vrodosProgressInert;
            }
        });
    }
    if (overlay) {
        overlay.inert = true;
        overlay.classList.add('tw-hidden');
        overlay.classList.remove('tw-flex');
        overlay.setAttribute('aria-hidden', 'true');
    }
    vrodosAssetSaveProgressPreviousFocus = null;
    vrodosAssetSaveProgressStartedAt = 0;
    window.clearInterval(vrodosAssetSaveProgressElapsedTimer);
    vrodosAssetSaveProgressElapsedTimer = 0;

    const restoreFocus = () => {
        if (focusTarget && focusTarget.isConnected && !focusTarget.disabled) {
            focusTarget.focus({ preventScroll: true });
        }
    };
    restoreFocus();
    if (focusTarget && focusTarget.disabled) {
        window.requestAnimationFrame(restoreFocus);
    }
}

window.vrodos_set_asset_save_progress = vrodos_set_asset_save_progress;
window.vrodos_hide_asset_save_progress = vrodos_hide_asset_save_progress;

function vrodos_get_asset_editor_ajax_url() {
    return (window.VRODOS && VRODOS.utils && typeof VRODOS.utils.getAjaxUrl === 'function')
        ? VRODOS.utils.getAjaxUrl()
        : '/wp-admin/admin-ajax.php';
}

function vrodos_upload_model_chunk_request(ajaxUrl, formData, onProgress, onUploadComplete) {
    return new Promise((resolve, reject) => {
        const request = new window.XMLHttpRequest();
        request.open('POST', ajaxUrl, true);
        request.withCredentials = true;

        request.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && typeof onProgress === 'function') {
                onProgress(event.loaded, event.total);
            }
        });
        request.upload.addEventListener('load', () => {
            if (typeof onUploadComplete === 'function') {
                onUploadComplete();
            }
        });
        request.addEventListener('load', () => {
            let payload = null;
            try {
                payload = JSON.parse(request.responseText);
            } catch (_error) {
                // The shared error formatter below supplies the user-facing fallback.
            }

            if (request.status < 200 || request.status >= 300 || !payload || !payload.success) {
                reject(new Error(vrodos_payload_error_message(payload, 'The model chunk upload failed.')));
                return;
            }
            resolve(payload);
        });
        request.addEventListener('error', () => reject(new Error('The model chunk upload lost its network connection.')));
        request.addEventListener('abort', () => reject(new Error('The model chunk upload was cancelled.')));
        request.send(formData);
    });
}

function vrodos_create_asset_save_operation_id() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID().toLowerCase();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function vrodos_fetch_asset_save_progress(ajaxUrl, operationId, nonce) {
    const body = new URLSearchParams();
    body.set('action', 'vrodos_asset_save_progress');
    body.set('assetSaveOperationId', operationId);
    body.set('nonce', nonce);
    const response = await window.fetch(ajaxUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: body.toString()
    });
    if (!response.ok) {
        throw new Error(`Progress request failed with HTTP ${response.status}.`);
    }
    const payload = await response.json();
    return payload && payload.success && payload.data ? payload.data : null;
}

function vrodos_start_asset_save_progress_polling(ajaxUrl, operationId, nonce, onProgress) {
    let stopped = false;
    let timer = 0;
    let requestRunning = false;

    const poll = async () => {
        if (stopped || requestRunning) {
            return;
        }
        requestRunning = true;
        try {
            const progress = await vrodos_fetch_asset_save_progress(ajaxUrl, operationId, nonce);
            if (progress && progress.status !== 'waiting' && typeof onProgress === 'function') {
                onProgress(progress);
            }
        } catch (_error) {
            // The save request remains authoritative. A transient polling failure
            // must not cancel a valid asset save.
        } finally {
            requestRunning = false;
            if (!stopped) {
                timer = window.setTimeout(poll, 500);
            }
        }
    };

    poll();
    return () => {
        stopped = true;
        window.clearTimeout(timer);
    };
}

window.vrodos_submit_asset_form_with_progress = function (form) {
    return new Promise((resolve, reject) => {
        const nonceInput = form ? form.querySelector('[name="post_nonce_field"]') : null;
        if (!form || !nonceInput || !nonceInput.value) {
            reject(new Error('The save security token is missing. Reload the page and try again.'));
            return;
        }

        const ajaxUrl = vrodos_get_asset_editor_ajax_url();
        const operationId = vrodos_create_asset_save_operation_id();
        const formData = new FormData(form);
        formData.set('assetSaveOperationId', operationId);
        let latestProgress = null;
        const applyServerProgress = (progress) => {
            latestProgress = progress;
            vrodos_set_asset_save_progress({
                title: progress.status === 'failed' ? 'Save Needs Attention' : 'Saving Asset',
                stage: progress.stage,
                status: progress.status,
                message: progress.message,
                detail: progress.detail,
                percent: progress.percent
            });
        };
        const stopPolling = vrodos_start_asset_save_progress_polling(
            ajaxUrl,
            operationId,
            nonceInput.value,
            applyServerProgress
        );

        const request = new window.XMLHttpRequest();
        request.open('POST', form.action || window.location.href, true);
        request.withCredentials = true;
        request.upload.addEventListener('progress', (event) => {
            if (!event.lengthComputable) {
                return;
            }
            const percent = Math.min(12, Math.max(1, Math.round((event.loaded / event.total) * 12)));
            const loadedMb = (event.loaded / (1024 * 1024)).toFixed(1);
            const totalMb = (event.total / (1024 * 1024)).toFixed(1);
            vrodos_set_asset_save_progress({
                title: 'Saving Asset',
                stage: 'upload',
                message: 'Transferring asset files…',
                detail: `${loadedMb} of ${totalMb} MB sent to the server.`,
                percent
            });
        });
        request.upload.addEventListener('load', () => {
            vrodos_set_asset_save_progress({
                title: 'Saving Asset',
                stage: 'validate',
                message: 'Upload received. Validating details…',
                detail: 'The server is checking the asset before saving it.',
                percent: 14
            });
        });
        request.addEventListener('load', async () => {
            stopPolling();
            try {
                const finalProgress = await vrodos_fetch_asset_save_progress(ajaxUrl, operationId, nonceInput.value);
                if (finalProgress && finalProgress.status !== 'waiting') {
                    applyServerProgress(finalProgress);
                }
            } catch (_error) {
                // Fall through to the HTTP result and redirect below.
            }

            if (request.status < 200 || request.status >= 400) {
                reject(new Error(`The server could not save the asset (HTTP ${request.status}).`));
                return;
            }

            if (!latestProgress || !['complete', 'failed'].includes(latestProgress.status)) {
                reject(new Error('The server finished responding but did not confirm that the asset was saved. Your uploaded source remains safe; please try saving again.'));
                return;
            }

            const redirectUrl = latestProgress.redirectUrl || request.responseURL || form.action || window.location.href;
            window.setTimeout(() => {
                window.location.assign(redirectUrl);
                resolve(true);
            }, latestProgress && latestProgress.status === 'failed' ? 900 : 350);
        });
        request.addEventListener('error', () => {
            stopPolling();
            reject(new Error('The save request lost its network connection. Your uploaded source remains safe; please try saving again.'));
        });
        request.addEventListener('abort', () => {
            stopPolling();
            reject(new Error('The asset save was cancelled.'));
        });

        vrodos_set_asset_save_progress({
            title: 'Saving Asset',
            stage: 'upload',
            message: 'Starting secure save…',
            detail: 'Preparing asset details and any remaining media for transfer.',
            percent: 0
        });
        request.send(formData);
    });
};

function vrodos_payload_error_message(payload, fallback) {
    let message = fallback;
    if (payload && payload.data) {
        if (typeof payload.data === 'string') {
            message = payload.data;
        } else if (payload.data.message) {
            message = payload.data.message;
        } else if (payload.data.error) {
            message = payload.data.error;
        }

        if (typeof payload.data === 'object' && payload.data.diagnostic) {
            const diagnostic = String(payload.data.diagnostic).trim();
            if (diagnostic && !String(message).includes(diagnostic)) {
                message = `${message} Details: ${diagnostic.slice(0, 700)}`;
            }
        }
    }

    return message;
}

function vrodos_set_zip_preflight_state(nextState) {
    window.vrodosZipPreflightState = {
        ...window.vrodosZipPreflightState,
        ...nextState
    };
}

function file_reader_cortex(file, asset_viewer_3d_kernel_local) {
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    if (extension !== 'glb') {
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        asset_viewer_3d_kernel_local.GlbBuffer = reader.result || '';
        asset_viewer_3d_kernel_local.checkerCompleteReading(extension);
    };
    reader.readAsArrayBuffer(file);
}

function vrodos_get_model_file_extension(file) {
    return file && file.name ? (file.name.split('.').pop() || '').toLowerCase() : '';
}

function vrodos_is_supported_model_file(file) {
    return VRODOS_MODEL_UPLOAD_EXTENSIONS.includes(vrodos_get_model_file_extension(file));
}

function vrodos_event_contains_files(event) {
    if (!event || !event.dataTransfer) {
        return false;
    }

    const types = Array.from(event.dataTransfer.types || []);
    return types.includes('Files') || types.includes('application/x-moz-file');
}

function vrodos_set_model_drop_active(dropZone, isActive) {
    if (!dropZone) {
        return;
    }

    dropZone.classList.toggle('vrodos-model-drop-zone-active', isActive);
}

function vrodos_clear_model_drop_active() {
    document.querySelectorAll('[data-vrodos-model-drop-zone="true"]').forEach((dropZone) => {
        vrodos_set_model_drop_active(dropZone, false);
    });
}

function vrodos_select_dropped_model_file(fileInput, file) {
    if (!fileInput) {
        vrodos_set_asset_editor_notice('The model upload field is unavailable. Reload the page and try again.');
        return false;
    }

    if (fileInput.disabled) {
        vrodos_set_asset_editor_notice('This asset is read-only. Model uploads are disabled.');
        return false;
    }

    if (!vrodos_is_supported_model_file(file)) {
        vrodos_set_asset_editor_notice('Supported model uploads are GLB, ZIP, BLEND, FBX, OBJ, DAE, and glTF files.');
        return false;
    }

    if (typeof window.DataTransfer === 'undefined') {
        vrodos_set_asset_editor_notice('This browser does not support drag-and-drop model upload. Use the file picker instead.');
        return false;
    }

    const transfer = new window.DataTransfer();
    transfer.items.add(file);
    clearList();
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new window.Event('change', { bubbles: true }));
    return true;
}

function vrodos_init_model_upload_dropzones() {
    const fileInput = document.getElementById('fileUploadInput');
    const dropZones = Array.from(document.querySelectorAll('[data-vrodos-model-drop-zone="true"]'));
    if (!dropZones.length) {
        return;
    }

    document.addEventListener('dragover', (event) => {
        if (!vrodos_event_contains_files(event)) {
            return;
        }

        event.preventDefault();
    }, false);

    document.addEventListener('drop', (event) => {
        if (!vrodos_event_contains_files(event)) {
            return;
        }

        event.preventDefault();
        vrodos_clear_model_drop_active();
    }, false);

    dropZones.forEach((dropZone) => {
        let dragDepth = 0;

        dropZone.addEventListener('dragenter', (event) => {
            if (!vrodos_event_contains_files(event)) {
                return;
            }

            event.preventDefault();
            dragDepth += 1;
            vrodos_set_model_drop_active(dropZone, true);
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'copy';
            }
        });

        dropZone.addEventListener('dragover', (event) => {
            if (!vrodos_event_contains_files(event)) {
                return;
            }

            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'copy';
            }
        });

        dropZone.addEventListener('dragleave', (event) => {
            if (!vrodos_event_contains_files(event)) {
                return;
            }

            dragDepth = Math.max(0, dragDepth - 1);
            if (dragDepth === 0) {
                vrodos_set_model_drop_active(dropZone, false);
            }
        });

        dropZone.addEventListener('drop', (event) => {
            if (!vrodos_event_contains_files(event)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            dragDepth = 0;
            vrodos_set_model_drop_active(dropZone, false);

            const files = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files : [];
            const file = files.length ? files[0] : null;
            if (!file) {
                return;
            }

            vrodos_select_dropped_model_file(fileInput, file);
        });
    });
}

function addHandlerFor3Dfiles(asset_viewer_3d_kernel_local, multipleFilesInputElem) {
    const handleFileSelect = (event) => {
        vrodosModelSelectionSerial += 1;
        const selectionSerial = vrodosModelSelectionSerial;
        const importTokenInput = document.getElementById('assetImportUploadToken');
        if (importTokenInput) {
            importTokenInput.value = '';
        }
        vrodos_set_zip_preflight_state({
            status: 'idle',
            token: '',
            canSave: true,
            message: ''
        });

        if (typeof window.vrodos_validate_selected_model === 'function' &&
            !window.vrodos_validate_selected_model()) {
            return;
        }

        const input = event.target;
        const file = input && input.files && input.files.length ? input.files[0] : null;
        if (!file) {
            return;
        }

        const extension = vrodos_get_model_file_extension(file);
        const label = document.getElementById('fileUploadInputLabel');
        if (label) {
            label.textContent = file.name;
        }

        const screenshotImg = document.getElementById('sshotPreviewImg');
        if (screenshotImg) {
            vrodos_set_asset_screenshot_preview(window.sshotPreviewDefaultImg);
        }

        const screenshotInput = document.getElementById('sshotFileInput');
        if (screenshotInput) {
            screenshotInput.value = '';
        }

        if (extension === 'zip' || VRODOS_MODEL_CONVERSION_EXTENSIONS.includes(extension)) {
            vrodos_set_asset_editor_notice(extension === 'zip' ? 'Uploading ZIP package for inspection...' : `Uploading ${extension.toUpperCase()} model for conversion...`, false);
            const form = document.getElementById('3dAssetForm');
            window.vrodos_prepare_selected_model_upload(form, selectionSerial);
            return;
        }

        if (extension !== 'glb') {
            vrodos_set_asset_editor_notice('This model package will be converted to GLB after the asset is saved.', false);
            return;
        }

        file_reader_cortex(file, asset_viewer_3d_kernel_local);
    };

    if (multipleFilesInputElem) {
        multipleFilesInputElem.addEventListener('change', handleFileSelect, false);
    }
}

function vrodos_set_asset_editor_notice(message, isError = true) {
    const notice = document.getElementById('assetEditorNotice');
    const text = document.getElementById('assetEditorNoticeText');
    if (!notice || !text) {
        return;
    }

    notice.classList.remove('tw-hidden', 'tw-bg-red-50', 'tw-border-red-200', 'tw-text-red-700', 'tw-bg-emerald-50', 'tw-border-emerald-200', 'tw-text-emerald-700');
    notice.classList.add(isError ? 'tw-bg-red-50' : 'tw-bg-emerald-50', isError ? 'tw-border-red-200' : 'tw-border-emerald-200', isError ? 'tw-text-red-700' : 'tw-text-emerald-700');
    text.textContent = message;
}

async function vrodos_preview_prepared_glb_url(url) {
    const viewer = window.asset_viewer_3d_kernel;
    if (!url || !viewer) {
        return false;
    }

    vrodos_set_asset_editor_notice('Loading prepared GLB preview...', false);
    const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'same-origin'
    });
    if (!response.ok) {
        throw new Error('Prepared GLB preview request failed.');
    }

    viewer.GlbBuffer = await response.arrayBuffer();
    viewer.checkerCompleteReading('glb');
    return true;
}

window.vrodos_inspect_staged_zip_upload = async function (token, form) {
    const nonceInput = form ? form.querySelector('[name="post_nonce_field"]') : null;
    if (!token || !nonceInput || !nonceInput.value) {
        throw new Error('The ZIP inspection request is missing its security token.');
    }

    const body = new URLSearchParams();
    body.set('action', 'vrodos_asset_import_inspect_staged_upload');
    body.set('nonce', nonceInput.value);
    body.set('token', token);

    const response = await fetch(vrodos_get_asset_editor_ajax_url(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body,
        credentials: 'same-origin'
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || !payload.success) {
        throw new Error(vrodos_payload_error_message(payload, 'The ZIP package inspection failed.'));
    }

    return payload.data || {};
};

window.vrodos_prepare_staged_zip_upload = async function (token, form) {
    const nonceInput = form ? form.querySelector('[name="post_nonce_field"]') : null;
    if (!token || !nonceInput || !nonceInput.value) {
        throw new Error('The ZIP preparation request is missing its security token.');
    }

    const body = new URLSearchParams();
    body.set('action', 'vrodos_asset_import_prepare_staged_upload');
    body.set('nonce', nonceInput.value);
    body.set('token', token);

    const response = await fetch(vrodos_get_asset_editor_ajax_url(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body,
        credentials: 'same-origin'
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || !payload.success) {
        throw new Error(vrodos_payload_error_message(payload, 'The ZIP package could not be prepared.'));
    }

    return payload.data || {};
};

window.vrodos_fetch_staged_zip_status = async function (token, form) {
    const nonceInput = form ? form.querySelector('[name="post_nonce_field"]') : null;
    if (!token || !nonceInput || !nonceInput.value) {
        throw new Error('The ZIP progress request is missing its security token.');
    }

    const body = new URLSearchParams();
    body.set('action', 'vrodos_asset_import_staged_upload_status');
    body.set('nonce', nonceInput.value);
    body.set('token', token);

    const response = await fetch(vrodos_get_asset_editor_ajax_url(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body,
        credentials: 'same-origin'
    });
    const payload = await response.json().catch(() => null);
    if (!payload || !payload.success) {
        throw new Error(vrodos_payload_error_message(payload, 'The ZIP package progress could not be checked.'));
    }

    return payload.data || {};
};

function vrodos_format_staged_zip_progress(status) {
    const percent = Number.isFinite(Number(status.percent))
        ? Math.max(0, Math.min(100, Math.round(Number(status.percent))))
        : 0;
    const message = status.message || 'Blender conversion running...';

    if (status.status === 'converting' || status.status === 'running') {
        return `Blender ${percent}% - ${message}`;
    }
    if (status.status === 'inspecting' || status.status === 'preparing') {
        return `${percent}% - ${message}`;
    }
    if (status.status === 'ready') {
        return `100% - ${message}`;
    }

    return message;
}

function vrodos_start_staged_zip_progress_polling(token, form) {
    let stopped = false;
    let timeoutId = null;

    const poll = async () => {
        if (stopped) {
            return;
        }

        try {
            const status = await window.vrodos_fetch_staged_zip_status(token, form);
            if (stopped) {
                return;
            }

            const progressMessage = vrodos_format_staged_zip_progress(status);
            vrodos_set_zip_preflight_state({
                status: status.status || window.vrodosZipPreflightState.status,
                token,
                canSave: Boolean(status.can_save),
                message: progressMessage,
                diagnostic: status.diagnostic || window.vrodosZipPreflightState.diagnostic || '',
                selected: status.selected || window.vrodosZipPreflightState.selected || ''
            });
            vrodos_set_asset_editor_notice(progressMessage, status.status === 'failed');

            const percent = Number.isFinite(Number(status.percent))
                ? Math.max(0, Math.min(100, Math.round(Number(status.percent))))
                : 0;
            const isConversion = status.status === 'converting' || status.status === 'running';
            vrodos_set_asset_save_progress({
                title: 'Preparing Model',
                message: isConversion ? 'Converting model…' : 'Preparing model package…',
                detail: status.message || progressMessage,
                percent,
                indeterminate: !Number.isFinite(Number(status.percent))
            });

            if (status.status === 'ready' || status.status === 'failed') {
                return;
            }
        } catch (_error) {
            // Keep the main prepare request authoritative; transient polling failures should not stop conversion.
        }

        if (!stopped) {
            timeoutId = window.setTimeout(poll, 900);
        }
    };

    timeoutId = window.setTimeout(poll, 700);

    return () => {
        stopped = true;
        if (timeoutId) {
            window.clearTimeout(timeoutId);
        }
    };
}

window.vrodos_prepare_selected_zip_upload = async function (form, selectionSerial) {
    return window.vrodos_prepare_selected_model_upload(form, selectionSerial);
};

window.vrodos_prepare_selected_model_upload = async function (form, selectionSerial) {
    const tokenInput = document.getElementById('assetImportUploadToken');
    vrodos_set_asset_editor_submit_locked(true, 'Preparing Model...');
    vrodos_set_asset_save_progress({
        title: 'Preparing Model',
        message: 'Uploading model package…',
        detail: 'Preparing the selected model before it can be saved.',
        percent: 0
    });
    vrodos_set_zip_preflight_state({
        status: 'uploading',
        token: '',
        canSave: false,
        message: 'Uploading model package for preparation...'
    });

    const uploaded = await window.vrodos_upload_selected_model_in_chunks(form, { prepareModel: true, source: 'selection' });
    if (selectionSerial !== vrodosModelSelectionSerial) {
        return false;
    }

    if (!uploaded) {
        if (tokenInput) {
            tokenInput.value = '';
        }
        vrodos_set_zip_preflight_state({
            status: 'failed',
            token: '',
            canSave: false,
            message: window.vrodosZipPreflightState.message || 'Model package preparation failed.'
        });
        vrodos_hide_asset_save_progress();
        vrodos_set_asset_editor_submit_locked(false);
        return false;
    }

    vrodos_hide_asset_save_progress();
    vrodos_set_asset_editor_submit_locked(false);
    return true;
};

window.vrodos_upload_selected_model_in_chunks = async function (form, options = {}) {
    const fileInput = document.getElementById('fileUploadInput');
    const tokenInput = document.getElementById('assetImportUploadToken');
    const nonceInput = form ? form.querySelector('[name="post_nonce_field"]') : null;
    const file = fileInput && fileInput.files && fileInput.files.length ? fileInput.files[0] : null;

    if (!file) {
        const zipState = window.vrodosZipPreflightState || {};
        if (tokenInput && tokenInput.value && zipState.token === tokenInput.value) {
            if (zipState.status === 'ready' && zipState.canSave) {
                return true;
            }
            vrodos_set_asset_editor_notice(zipState.message || 'ZIP inspection has not completed successfully.');
            return false;
        }
        return true;
    }

    if (tokenInput && tokenInput.value) {
        fileInput.value = '';
        return true;
    }

    if (!nonceInput || !nonceInput.value) {
        vrodos_set_asset_editor_notice('The upload security token is missing. Reload the page and try again.');
        return false;
    }
    if (!tokenInput) {
        vrodos_set_asset_editor_notice('The model upload staging field is missing. Reload the page and try again.');
        return false;
    }

    const chunkSize = 8 * 1024 * 1024;
    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
    const uploadId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    const shouldPrepareModel = options.prepareModel === true || (extension === 'zip' && options.inspectZip !== false);
    if (!VRODOS_MODEL_UPLOAD_EXTENSIONS.includes(extension)) {
        vrodos_set_asset_editor_notice('Supported model uploads are GLB, ZIP, BLEND, FBX, OBJ, DAE, and glTF files.');
        return false;
    }
    const ajaxUrl = vrodos_get_asset_editor_ajax_url();
    const progressTitle = shouldPrepareModel ? 'Preparing Model' : 'Saving Asset';
    const uploadProgress = (uploadedBytes) => {
        const clampedBytes = Math.min(file.size, Math.max(0, uploadedBytes));
        const percent = file.size > 0 ? Math.floor((clampedBytes / file.size) * 100) : 100;
        const uploadedMb = (clampedBytes / (1024 * 1024)).toFixed(1);
        const totalMb = (file.size / (1024 * 1024)).toFixed(1);

        return {
            message: `Uploading model — ${percent}% (${uploadedMb}/${totalMb} MB)`,
            detail: `${uploadedMb} of ${totalMb} MB uploaded`,
            percent
        };
    };
    const reportUploadProgress = (uploadedBytes) => {
        const progress = uploadProgress(uploadedBytes);
        vrodos_set_asset_editor_notice(progress.message, false);
        vrodos_set_asset_save_progress({
            title: progressTitle,
            message: 'Uploading model…',
            detail: progress.detail,
            percent: progress.percent
        });
    };

    vrodos_set_asset_editor_submit_locked(true, shouldPrepareModel ? 'Preparing Model...' : 'Uploading Model...');
    reportUploadProgress(0);

    try {
        let finalPayload = null;
        let uploadedBytes = 0;
        for (let index = 0; index < totalChunks; index += 1) {
            const start = index * chunkSize;
            const chunk = file.slice(start, Math.min(start + chunkSize, file.size));
            const formData = new FormData();
            formData.append('action', 'vrodos_upload_model_chunk_action');
            formData.append('nonce', nonceInput.value);
            formData.append('upload_id', uploadId);
            formData.append('chunk_index', String(index));
            formData.append('total_chunks', String(totalChunks));
            formData.append('file_name', file.name);
            formData.append('project_id', String(window.vrodosAssetEditorProjectId || '0'));
            formData.append('chunk', chunk, file.name);

            reportUploadProgress(uploadedBytes);
            const payload = await vrodos_upload_model_chunk_request(
                ajaxUrl,
                formData,
                (chunkUploadedBytes) => reportUploadProgress(start + Math.min(chunk.size, chunkUploadedBytes)),
                () => {
                    if (index === totalChunks - 1) {
                        const totalMb = (file.size / (1024 * 1024)).toFixed(1);
                        vrodos_set_asset_save_progress({
                            title: progressTitle,
                            message: 'Assembling and validating model…',
                            detail: `${totalMb} MB uploaded. The server is finalizing the staged file.`,
                            indeterminate: true
                        });
                    }
                }
            );
            finalPayload = payload;
            uploadedBytes += chunk.size;
            reportUploadProgress(uploadedBytes);
        }

        if (!finalPayload || !finalPayload.data || !finalPayload.data.complete) {
            throw new Error('The model upload did not finish assembling on the server.');
        }

        if (tokenInput) {
            tokenInput.value = uploadId;
        }
        if (shouldPrepareModel) {
            let inspection = null;
            let prepareStatus = 'converting';
            let prepareMessage = `Blender is converting the selected ${extension.toUpperCase()} model to GLB. This can take a few minutes...`;

            if (extension === 'zip') {
                vrodos_set_zip_preflight_state({
                    status: 'inspecting',
                    token: uploadId,
                    canSave: false,
                    message: 'Inspecting ZIP package contents...'
                });
                vrodos_set_asset_editor_notice('Inspecting ZIP package contents...', false);
                vrodos_set_asset_save_progress({
                    title: 'Preparing Model',
                    message: 'Inspecting ZIP package…',
                    detail: 'Checking the uploaded package for a usable model source.',
                    indeterminate: true
                });
                inspection = await window.vrodos_inspect_staged_zip_upload(uploadId, form);
                if (!inspection.can_save) {
                    throw new Error(inspection.message || 'ZIP package has no usable model source.');
                }

                prepareStatus = inspection.requires_blender ? 'converting' : 'preparing';
                prepareMessage = inspection.requires_blender
                    ? 'Blender is converting the selected ZIP source to GLB. This can take a few minutes...'
                    : 'Extracting the selected GLB from the ZIP package...';
            }

            vrodos_set_zip_preflight_state({
                status: prepareStatus,
                token: uploadId,
                canSave: false,
                message: prepareMessage,
                diagnostic: inspection ? inspection.diagnostic || '' : '',
                selected: inspection ? inspection.selected || file.name : file.name
            });
            vrodos_set_asset_editor_notice(prepareMessage, false);
            vrodos_set_asset_save_progress({
                title: 'Preparing Model',
                message: prepareStatus === 'converting' ? 'Converting model…' : 'Preparing model package…',
                detail: prepareMessage,
                indeterminate: true
            });

            const stopProgressPolling = prepareStatus === 'converting'
                ? vrodos_start_staged_zip_progress_polling(uploadId, form)
                : null;
            let prepared = null;
            try {
                prepared = await window.vrodos_prepare_staged_zip_upload(uploadId, form);
            } finally {
                if (typeof stopProgressPolling === 'function') {
                    stopProgressPolling();
                }
            }
            if (!prepared.can_save) {
                throw new Error(prepared.message || 'ZIP package could not be prepared for asset save.');
            }

            vrodos_set_zip_preflight_state({
                status: 'ready',
                token: uploadId,
                canSave: true,
                message: prepared.message || 'Model package is ready. Saving will attach the prepared GLB.',
                diagnostic: prepared.diagnostic || (inspection ? inspection.diagnostic || '' : ''),
                selected: prepared.selected || (inspection ? inspection.selected || '' : file.name)
            });
            fileInput.value = '';
            let readyMessage = prepared.message || 'Model package is ready. Saving will attach the prepared GLB.';
            if (prepared.prepared_url) {
                try {
                    vrodos_set_asset_save_progress({
                        title: 'Preparing Model',
                        message: 'Loading prepared preview…',
                        detail: 'The model is ready and its preview is being loaded.',
                        indeterminate: true
                    });
                    const previewLoaded = await vrodos_preview_prepared_glb_url(prepared.prepared_url);
                    if (previewLoaded) {
                        readyMessage = `${readyMessage} Preview loaded.`;
                    }
                } catch (previewError) {
                    readyMessage = `${readyMessage} Preview could not load: ${previewError && previewError.message ? previewError.message : 'unknown error'}`;
                }
            }
            vrodos_set_asset_editor_notice(readyMessage, false);
            vrodos_set_asset_save_progress({
                title: 'Preparing Model',
                message: 'Model package ready',
                detail: readyMessage,
                percent: 100
            });
            return true;
        }

        fileInput.value = '';
        vrodos_set_asset_editor_notice(extension === 'glb' ? 'GLB upload completed. Saving asset...' : 'Model upload completed. Saving asset and queueing conversion...', false);
        return true;
    } catch (error) {
        const message = error && error.message ? error.message : 'The model upload failed.';
        if (shouldPrepareModel) {
            if (tokenInput) {
                tokenInput.value = '';
            }
            vrodos_set_zip_preflight_state({
                status: 'failed',
                token: '',
                canSave: false,
                message
            });
        }
        vrodos_set_asset_editor_notice(message);
        vrodos_hide_asset_save_progress();
        return false;
    } finally {
        vrodos_set_asset_editor_submit_locked(false);
    }
};

window.vrodos_upload_selected_glb_in_chunks = window.vrodos_upload_selected_model_in_chunks;



function updateNativeColorPicker(input, asset_viewer_3d_kernel_local) {
    const hex = input.value;
    const label = document.getElementById('colorHexLabel');
    if (label) {
        label.innerText = hex.toUpperCase();
    }

    const hiddenInput = document.getElementById('assetback3dcolor');
    if (hiddenInput) {
        hiddenInput.value = hex.replace('#', '');
    }

    if (asset_viewer_3d_kernel_local && asset_viewer_3d_kernel_local.scene) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        asset_viewer_3d_kernel_local.scene.background.setRGB(r, g, b);
        asset_viewer_3d_kernel_local.render();
    }
}

function vrodos_create_model_sshot(asset_viewer_3d_kernel_local) {
	if (!asset_viewer_3d_kernel_local || !asset_viewer_3d_kernel_local.renderer || !asset_viewer_3d_kernel_local.previewReady) {
        vrodos_set_asset_editor_notice('The 3D preview is not ready yet. Wait for the model preview to load and try again.');
        return;
    }

    if (typeof asset_viewer_3d_kernel_local.resizeDisplayGL === 'function' && asset_viewer_3d_kernel_local.resizeDisplayGL() === false) {
        vrodos_set_asset_editor_notice('The 3D preview is not visible yet. Wait for the preview panel to finish loading and try again.');
        return;
    }

    // Determine dimensions from the existing canvas
    const canvas = asset_viewer_3d_kernel_local.renderer.domElement;
    const w = canvas.width;
    const h = canvas.height;

    if (w <= 0 || h <= 0) {
        vrodos_set_asset_editor_notice('The 3D preview is not ready yet. Wait for the model preview to load and try again.');
        return;
    }

    // Use an offscreen renderer to capture the screenshot reliably
    const offscreenRenderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true, alpha: false });
    offscreenRenderer.setSize(w, h);
    offscreenRenderer.setClearColor(asset_viewer_3d_kernel_local.scene.background || 0x000000, 1);
    offscreenRenderer.render(asset_viewer_3d_kernel_local.scene, asset_viewer_3d_kernel_local.camera);

    const sourceCanvas = offscreenRenderer.domElement;
    const sourceRatio = w / h;
    const targetWidth = Math.min(960, Math.max(1, w));
    const targetHeight = Math.max(1, Math.round(targetWidth / sourceRatio));

    // Create a resized canvas for the final thumbnail
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = targetWidth;
    resizedCanvas.height = targetHeight;

    const ctx = resizedCanvas.getContext('2d');
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

    const screenshotDataUrl = resizedCanvas.toDataURL('image/jpeg', 0.82);
    vrodos_set_asset_screenshot_preview(screenshotDataUrl);
    document.getElementById('sshotFileInput').value = screenshotDataUrl;

    // Clean up
    offscreenRenderer.dispose();
}

function vrodos_format_editor_preview_bytes(bytes) {
	const value = Number(bytes || 0);
	if (!Number.isFinite(value) || value <= 0) return '';
	return `${Math.round((value / 1048576) * 10) / 10} MB`;
}

function vrodos_asset_editor_preview_label(state) {
	const variant = String((state && state.loadVariant) || 'none');
	if (variant === 'editor-preview') return 'Editor Preview';
	if (variant === 'source') return 'Full Source Quality';
	if (variant.startsWith('web-')) return `${variant.replace('web-', 'Web ')} Preview`;
	if (state && state.status === 'failed') return 'Preview Failed';
	if (state && state.status === 'pending') return 'Preparing Preview';
	return 'Preview';
}

function vrodos_update_asset_editor_preview_controls(state) {
	const current = state || {};
	const badge = document.getElementById('assetPreviewQualityBadge');
	const retryButton = document.getElementById('assetPreviewRetryBtn');
	const fullSourceButton = document.getElementById('assetPreviewFullSourceBtn');
	const placeholderTitle = document.getElementById('preview3dPlaceholderTitle');
	const placeholderDetail = document.getElementById('preview3dPlaceholderDetail');
	if (badge) {
		const source = vrodos_format_editor_preview_bytes(current.sourceBytes);
		const loaded = vrodos_format_editor_preview_bytes(current.loadBytes);
		badge.textContent = vrodos_asset_editor_preview_label(current);
		badge.title = [current.message || '', source && loaded && source !== loaded ? `${source} source · ${loaded} loaded` : '']
			.filter(Boolean)
			.join(' — ');
	}
	if (retryButton) {
		retryButton.classList.toggle('tw-hidden', !current.canRetry);
		retryButton.disabled = false;
	}
	if (fullSourceButton) {
		const show = Boolean(current.canLoadSource && current.loadVariant !== 'source');
		fullSourceButton.classList.toggle('tw-hidden', !show);
		fullSourceButton.disabled = false;
	}
	if (placeholderTitle && placeholderDetail && !current.loadUrl) {
		if (current.status === 'pending') {
			placeholderTitle.textContent = 'Optimized preview is being prepared';
			placeholderDetail.textContent = current.message || 'This model will appear automatically when it is ready.';
		} else if (current.status === 'failed') {
			placeholderTitle.textContent = 'Preview generation needs attention';
			placeholderDetail.textContent = current.message || 'Retry the preview or load the full source.';
		} else if (current.status === 'forbidden') {
			placeholderTitle.textContent = 'Preview unavailable';
			placeholderDetail.textContent = current.message || 'You cannot access this asset.';
		}
	}
}

async function vrodos_fetch_asset_editor_load_state() {
	const config = window.vrodos_api_config || {};
	const assetId = Number(window.vrodosAssetEditorAssetId || 0);
	if (!assetId || !config.ajax_url || !config.editor_load_nonce) return null;
	const response = await fetch(config.ajax_url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			action: 'vrodos_fetch_glb_asset_action',
			nonce: config.editor_load_nonce,
			asset_id: String(assetId)
		})
	});
	if (!response.ok) throw new Error(`Preview status request failed with HTTP ${response.status}.`);
	const payload = await response.json();
	return payload && payload.editorLoad ? payload.editorLoad : null;
}

function vrodos_init_asset_editor_preview_controls(viewer) {
	let state = window.vrodosAssetEditorLoad || {};
	let stopped = false;
	let timer = null;
	let explicitSource = false;
	const retryButton = document.getElementById('assetPreviewRetryBtn');
	const fullSourceButton = document.getElementById('assetPreviewFullSourceBtn');

	const schedulePoll = () => {
		if (stopped || timer || !['pending', 'queued', 'running', 'stale', 'waiting-high'].includes(String(state.previewStatus || state.status || ''))) return;
		timer = window.setTimeout(async () => {
			timer = null;
			try {
				const nextState = await vrodos_fetch_asset_editor_load_state();
				if (!nextState) return;
				state = nextState;
				window.vrodosAssetEditorLoad = state;
				vrodos_update_asset_editor_preview_controls(state);
				if (
					!explicitSource &&
					viewer &&
					state.loadUrl &&
					(
						String((viewer.currentLoadInfo && viewer.currentLoadInfo.loadVariant) || 'none') !== String(state.loadVariant || 'none') ||
						String((viewer.currentLoadInfo && viewer.currentLoadInfo.loadUrl) || '') !== String(state.loadUrl || '')
					)
				) {
					viewer.loadAssetUrl(state.loadUrl, Object.assign({}, state, { loadUrl: state.loadUrl }));
				}
			} catch (error) {
				console.warn('VRodos: could not refresh editor preview status.', error);
			}
			schedulePoll();
		}, 3000);
	};

	if (fullSourceButton) {
		fullSourceButton.addEventListener('click', () => {
			const sourceUrl = state.canonicalUrl || window.canonical_glb_file_name || '';
			if (!sourceUrl || !viewer) return;
			explicitSource = true;
			stopped = true;
			if (timer) {
				window.clearTimeout(timer);
				timer = null;
			}
			state = Object.assign({}, state, {
				status: 'ready',
				loadUrl: sourceUrl,
				loadVariant: 'source',
				loadBytes: Number(state.sourceBytes || 0),
				message: 'Loading the original source GLB.'
			});
			vrodos_update_asset_editor_preview_controls(state);
			viewer.loadAssetUrl(sourceUrl, Object.assign({}, state, { loadUrl: sourceUrl }));
		});
	}

	if (retryButton) {
		retryButton.addEventListener('click', async () => {
			const config = window.vrodos_api_config || {};
			const assetId = Number(window.vrodosAssetEditorAssetId || 0);
			if (!assetId || !config.ajax_url || !config.editor_load_nonce) return;
			retryButton.disabled = true;
			try {
				const response = await fetch(config.ajax_url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						action: 'vrodos_retry_editor_preview_action',
						nonce: config.editor_load_nonce,
						asset_id: String(assetId)
					})
				});
				const payload = await response.json();
				if (!response.ok || !payload.success) throw new Error(payload.data || 'Preview retry failed.');
				state = payload.data;
				window.vrodosAssetEditorLoad = state;
				vrodos_update_asset_editor_preview_controls(state);
				schedulePoll();
			} catch (error) {
				console.warn('VRodos: editor preview retry failed.', error);
				retryButton.disabled = false;
			}
		});
	}

	window.addEventListener('pagehide', () => {
		stopped = true;
		if (timer) window.clearTimeout(timer);
	}, { once: true });
	vrodos_update_asset_editor_preview_controls(state);
	schedulePoll();
}

function loadFileInputLabel() {
    const inputLabel = document.getElementById('fileUploadInputLabel');
    const input = document.getElementById('fileUploadInput');

    if (inputLabel) {
        inputLabel.innerHTML = 'Select a model package';
    }

    if (input) {
        input.accept = '.glb,.zip,.blend,.fbx,.obj,.dae,.gltf';
    }
}

function vrodos_reset_panels(asset_viewer_3d_kernel, _whocalls) {
    vrodos_clear_asset_files(asset_viewer_3d_kernel);
    document.querySelectorAll('div.ProducerPlotTooltip').forEach((el) => {
        el.remove();
    });
}

function clearList() {
    vrodos_reset_panels(window.asset_viewer_3d_kernel, 'clearList');
    loadFileInputLabel();
}

function setScreenshotHandler() {
    const sshotBtn = document.getElementById('createModelScreenshotBtn');
    if (sshotBtn && document.getElementById('sshotPreviewImg')) {
        sshotBtn.addEventListener('click', () => {
            vrodos_create_model_sshot(window.asset_viewer_3d_kernel);
        });
    }
}

window.addHandlerFor3Dfiles = addHandlerFor3Dfiles;
window.updateNativeColorPicker = updateNativeColorPicker;
window.setScreenshotHandler = setScreenshotHandler;
window.vrodos_init_asset_editor_preview_controls = vrodos_init_asset_editor_preview_controls;

function vrodos_init_asset_import_status_polling() {
    const initialStatus = window.vrodosAssetImportStatus || {};
    const assetId = Number(window.vrodosAssetEditorAssetId || 0);
    const notice = document.getElementById('assetImportStatusNotice');
    const text = document.getElementById('assetImportStatusText');
    const retryBtn = document.getElementById('assetImportRetryBtn');
    const form = document.getElementById('3dAssetForm');
    const nonceInput = form ? form.querySelector('[name="post_nonce_field"]') : null;

    if (!assetId || !notice || !text || !nonceInput) {
        return;
    }

    const ajaxUrl = (window.VRODOS && VRODOS.utils && typeof VRODOS.utils.getAjaxUrl === 'function')
        ? VRODOS.utils.getAjaxUrl()
        : '/wp-admin/admin-ajax.php';

    const setImportNotice = (status, message, canRetry) => {
        notice.classList.remove('tw-hidden', 'tw-bg-red-50', 'tw-border-red-200', 'tw-text-red-700', 'tw-bg-emerald-50', 'tw-border-emerald-200', 'tw-text-emerald-700');
        const isFailed = status === 'failed';
        notice.classList.add(isFailed ? 'tw-bg-red-50' : 'tw-bg-emerald-50', isFailed ? 'tw-border-red-200' : 'tw-border-emerald-200', isFailed ? 'tw-text-red-700' : 'tw-text-emerald-700');
        notice.dataset.status = status || '';
        text.textContent = message || '';
        if (retryBtn) {
            retryBtn.classList.toggle('tw-hidden', !(isFailed && canRetry));
        }
    };

    const fetchStatus = async () => {
        const body = new URLSearchParams();
        body.set('action', 'vrodos_asset_import_status');
        body.set('nonce', nonceInput.value);
        body.set('asset_id', String(assetId));
        const response = await fetch(ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body,
            credentials: 'same-origin'
        });
        const payload = await response.json();
        if (!payload || !payload.success) {
            throw new Error(vrodos_payload_error_message(payload, 'Could not fetch model import status.'));
        }
        return payload.data || {};
    };

    let shouldReloadAfterImport = initialStatus.status === 'pending' || initialStatus.status === 'running';
    const poll = async () => {
        try {
            const status = await fetchStatus();
            const optimization = status.optimization || {};
            const optimizationStatus = optimization.familyStatus || optimization.status;
            const optimizationActive = optimizationStatus === 'queued' || optimizationStatus === 'running';
            const optimizationFailed = optimizationStatus === 'failed';
            if (status.status === 'ready' && optimizationActive) {
                const percent = Number(optimization.familyPercent ?? optimization.percent ?? 0);
                setImportNotice('running', `${optimization.activeMessage || optimization.message || 'Optimizing GLB for the web.'}${percent > 0 ? ` ${percent}%` : ''}`, false);
            } else if (status.status === 'ready' && optimizationFailed) {
                setImportNotice('failed', `${optimization.message || 'Web optimization failed. The original GLB is unchanged.'} Use GLB Optimization to retry.`, false);
            } else {
                setImportNotice(status.status, status.message, status.can_retry);
            }
            if (status.status === 'ready') {
                if (shouldReloadAfterImport) {
                    setTimeout(() => window.location.reload(), 900);
                    return;
                }
                if (optimizationActive) {
                    setTimeout(poll, 5000);
                }
                return;
            }
            if (status.status === 'pending' || status.status === 'running') {
                setTimeout(poll, 5000);
            }
        } catch (error) {
            setImportNotice('failed', error && error.message ? error.message : 'Could not fetch model import status.', false);
        }
    };

    if (retryBtn) {
        retryBtn.addEventListener('click', async () => {
            const body = new URLSearchParams();
            body.set('action', 'vrodos_asset_import_retry');
            body.set('nonce', nonceInput.value);
            body.set('asset_id', String(assetId));
            retryBtn.disabled = true;
            try {
                const response = await fetch(ajaxUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                    body,
                    credentials: 'same-origin'
                });
                const payload = await response.json();
                if (!payload || !payload.success) {
                    throw new Error(vrodos_payload_error_message(payload, 'Could not retry model import.'));
                }
                setImportNotice('pending', 'Model package is queued for GLB conversion.', false);
                shouldReloadAfterImport = true;
                setTimeout(poll, 1500);
            } catch (error) {
                setImportNotice('failed', error && error.message ? error.message : 'Could not retry model import.', false);
            } finally {
                retryBtn.disabled = false;
            }
        });
    }

    const initialOptimization = initialStatus.optimization || {};
    const initialOptimizationStatus = initialOptimization.familyStatus || initialOptimization.status;
    if (initialStatus.status === 'pending' || initialStatus.status === 'running' || initialOptimizationStatus === 'queued' || initialOptimizationStatus === 'running') {
        if (initialStatus.status === 'ready') {
            const percent = Number(initialOptimization.familyPercent ?? initialOptimization.percent ?? 0);
            setImportNotice('running', `${initialOptimization.activeMessage || initialOptimization.message || 'Optimizing GLB for the web.'}${percent > 0 ? ` ${percent}%` : ''}`, false);
        } else {
            setImportNotice(initialStatus.status, initialStatus.message, false);
        }
        setTimeout(poll, 1500);
    }
}

document.addEventListener('DOMContentLoaded', vrodos_init_model_upload_dropzones);
document.addEventListener('DOMContentLoaded', vrodos_init_asset_import_status_polling);
