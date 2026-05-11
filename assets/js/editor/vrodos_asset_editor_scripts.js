/**
 * Asset editor helpers for the model-package upload and preview workflow.
 */
'use strict';

const slideIndex = 0;

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

    const glbChunkTokenInput = document.getElementById('glbChunkUploadToken');
    if (glbChunkTokenInput) {
        glbChunkTokenInput.value = '';
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

function vrodos_get_asset_editor_ajax_url() {
    return (window.VRODOS && VRODOS.utils && typeof VRODOS.utils.getAjaxUrl === 'function')
        ? VRODOS.utils.getAjaxUrl()
        : '/wp-admin/admin-ajax.php';
}

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

        const extension = (file.name.split('.').pop() || '').toLowerCase();
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

        const chunkTokenInput = document.getElementById('glbChunkUploadToken');
        if (chunkTokenInput) {
            chunkTokenInput.value = '';
        }

        if (extension === 'zip') {
            vrodos_set_asset_editor_notice('Uploading ZIP package for inspection...', false);
            const form = document.getElementById('3dAssetForm');
            window.vrodos_prepare_selected_zip_upload(form, selectionSerial);
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
    const tokenInput = document.getElementById('assetImportUploadToken');
    vrodos_set_zip_preflight_state({
        status: 'uploading',
        token: '',
        canSave: false,
        message: 'Uploading ZIP package for inspection...'
    });

    const uploaded = await window.vrodos_upload_selected_model_in_chunks(form, { inspectZip: true, source: 'selection' });
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
            message: window.vrodosZipPreflightState.message || 'ZIP package inspection failed.'
        });
        return false;
    }

    return true;
};

window.vrodos_upload_selected_model_in_chunks = async function (form, options = {}) {
    const fileInput = document.getElementById('fileUploadInput');
    const tokenInput = document.getElementById('assetImportUploadToken');
    const oldGlbTokenInput = document.getElementById('glbChunkUploadToken');
    const nonceInput = form ? form.querySelector('[name="post_nonce_field"]') : null;
    const submitBtn = document.getElementById('formSubmitBtn');
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
    const shouldInspectZip = extension === 'zip' && options.inspectZip !== false;
    if (!['glb', 'zip', 'blend', 'fbx', 'obj', 'dae', 'gltf'].includes(extension)) {
        vrodos_set_asset_editor_notice('Supported model uploads are GLB, ZIP, BLEND, FBX, OBJ, DAE, and glTF files.');
        return false;
    }
    const ajaxUrl = vrodos_get_asset_editor_ajax_url();
    const formatUploadProgress = (uploadedBytes) => {
        const clampedBytes = Math.min(file.size, Math.max(0, uploadedBytes));
        const percent = file.size > 0 ? Math.floor((clampedBytes / file.size) * 100) : 100;
        const uploadedMb = (clampedBytes / (1024 * 1024)).toFixed(1);
        const totalMb = (file.size / (1024 * 1024)).toFixed(1);

        return `Uploading model ${percent}% (${uploadedMb}/${totalMb} MB)`;
    };

    if (submitBtn) {
        submitBtn.disabled = true;
    }

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

            vrodos_set_asset_editor_notice(formatUploadProgress(uploadedBytes), false);
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload || !payload.success) {
                throw new Error(vrodos_payload_error_message(payload, 'The model chunk upload failed.'));
            }
            finalPayload = payload;
            uploadedBytes += chunk.size;
            vrodos_set_asset_editor_notice(formatUploadProgress(uploadedBytes), false);
        }

        if (!finalPayload || !finalPayload.data || !finalPayload.data.complete) {
            throw new Error('The model upload did not finish assembling on the server.');
        }

        if (tokenInput) {
            tokenInput.value = uploadId;
        }
        if (oldGlbTokenInput) {
            oldGlbTokenInput.value = '';
        }

        if (shouldInspectZip) {
            vrodos_set_zip_preflight_state({
                status: 'inspecting',
                token: uploadId,
                canSave: false,
                message: 'Inspecting ZIP package contents...'
            });
            vrodos_set_asset_editor_notice('Inspecting ZIP package contents...', false);
            const inspection = await window.vrodos_inspect_staged_zip_upload(uploadId, form);
            if (!inspection.can_save) {
                throw new Error(inspection.message || 'ZIP package has no usable model source.');
            }

            const prepareStatus = inspection.requires_blender ? 'converting' : 'preparing';
            const prepareMessage = inspection.requires_blender
                ? 'Blender is converting the selected ZIP source to GLB. This can take a few minutes...'
                : 'Extracting the selected GLB from the ZIP package...';
            vrodos_set_zip_preflight_state({
                status: prepareStatus,
                token: uploadId,
                canSave: false,
                message: prepareMessage,
                diagnostic: inspection.diagnostic || '',
                selected: inspection.selected || ''
            });
            vrodos_set_asset_editor_notice(prepareMessage, false);

            const stopProgressPolling = inspection.requires_blender
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
                message: prepared.message || 'ZIP package is ready. Saving will attach the prepared GLB.',
                diagnostic: prepared.diagnostic || inspection.diagnostic || '',
                selected: prepared.selected || inspection.selected || ''
            });
            fileInput.value = '';
            let readyMessage = prepared.message || 'ZIP package is ready. Saving will attach the prepared GLB.';
            if (prepared.prepared_url) {
                try {
                    const previewLoaded = await vrodos_preview_prepared_glb_url(prepared.prepared_url);
                    if (previewLoaded) {
                        readyMessage = `${readyMessage} Preview loaded.`;
                    }
                } catch (previewError) {
                    readyMessage = `${readyMessage} Preview could not load: ${previewError && previewError.message ? previewError.message : 'unknown error'}`;
                }
            }
            vrodos_set_asset_editor_notice(readyMessage, false);
            return true;
        }

        fileInput.value = '';
        vrodos_set_asset_editor_notice(extension === 'glb' ? 'GLB upload completed. Saving asset...' : 'Model upload completed. Saving asset and queueing conversion...', false);
        return true;
    } catch (error) {
        const message = error && error.message ? error.message : 'The model upload failed.';
        if (extension === 'zip') {
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
        return false;
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
        }
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

function rgbToHex(r, g, b) {
    r = Math.max(r, 0);
    g = Math.max(g, 0);
    b = Math.max(b, 0);
    return `#${  ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function vrodos_create_model_sshot(asset_viewer_3d_kernel_local) {
    if (!asset_viewer_3d_kernel_local || !asset_viewer_3d_kernel_local.renderer) {
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

function vrodos_reset_panels(asset_viewer_3d_kernel, whocalls) {
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

    const poll = async () => {
        try {
            const status = await fetchStatus();
            setImportNotice(status.status, status.message, status.can_retry);
            if (status.status === 'ready') {
                setTimeout(() => window.location.reload(), 900);
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
                setTimeout(poll, 1500);
            } catch (error) {
                setImportNotice('failed', error && error.message ? error.message : 'Could not retry model import.', false);
            } finally {
                retryBtn.disabled = false;
            }
        });
    }

    if (initialStatus.status === 'pending' || initialStatus.status === 'running') {
        setImportNotice(initialStatus.status, initialStatus.message, false);
        setTimeout(poll, 1500);
    }
}

document.addEventListener('DOMContentLoaded', vrodos_init_asset_import_status_polling);
