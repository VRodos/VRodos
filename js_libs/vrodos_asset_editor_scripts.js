/**
 * Asset editor helpers for the GLB-only upload and preview workflow.
 */
'use strict';

let slideIndex = 0;

function vrodos_set_asset_screenshot_preview(src) {
    const sshotImg = document.getElementById('sshotPreviewImg');
    const placeholder = document.getElementById('sshotPreviewPlaceholder');
    const hasSource = !!src;

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

    const screenshotInput = document.getElementById('sshotFileInput');
    if (screenshotInput) {
        screenshotInput.value = '';
    }

    const sshotImg = document.getElementById('sshotPreviewImg');
    if (sshotImg) {
        vrodos_set_asset_screenshot_preview(sshotPreviewDefaultImg);
    }

    const previewTitle = document.getElementById('objectPreviewTitle');
    if (previewTitle) {
        previewTitle.style.display = 'none';
    }
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
        if (typeof window.vrodos_validate_selected_glb === 'function' &&
            !window.vrodos_validate_selected_glb()) {
            return;
        }

        const input = event.target;
        const file = input && input.files && input.files.length ? input.files[0] : null;
        if (!file) {
            return;
        }

        const extension = (file.name.split('.').pop() || '').toLowerCase();
        if (extension !== 'glb') {
            return;
        }

        const label = document.getElementById('fileUploadInputLabel');
        if (label) {
            label.textContent = file.name;
        }

        const screenshotImg = document.getElementById('sshotPreviewImg');
        if (screenshotImg) {
            vrodos_set_asset_screenshot_preview(sshotPreviewDefaultImg);
        }

        const screenshotInput = document.getElementById('sshotFileInput');
        if (screenshotInput) {
            screenshotInput.value = '';
        }

        file_reader_cortex(file, asset_viewer_3d_kernel_local);
    };

    if (multipleFilesInputElem) {
        multipleFilesInputElem.addEventListener('change', handleFileSelect, false);
    }
}



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
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function vrodos_create_model_sshot(asset_viewer_3d_kernel_local) {
    // Determine dimensions from the existing canvas
    const canvas = asset_viewer_3d_kernel_local.renderer.domElement;
    const w = canvas.width;
    const h = canvas.height;

    // Use an offscreen renderer to capture the screenshot reliably
    const offscreenRenderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true, alpha: true });
    offscreenRenderer.setSize(w, h);
    offscreenRenderer.setClearColor(asset_viewer_3d_kernel_local.scene.background || 0x000000, 1);
    offscreenRenderer.render(asset_viewer_3d_kernel_local.scene, asset_viewer_3d_kernel_local.camera);

    const sourceCanvas = offscreenRenderer.domElement;
    const sourceRatio = w / h;
    const targetWidth = 1068;
    const targetHeight = Math.max(1, Math.round(targetWidth / sourceRatio));

    // Create a resized canvas for the final thumbnail
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = targetWidth;
    resizedCanvas.height = targetHeight;

    const ctx = resizedCanvas.getContext('2d');
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

    const screenshotDataUrl = resizedCanvas.toDataURL('image/png');
    vrodos_set_asset_screenshot_preview(screenshotDataUrl);
    document.getElementById('sshotFileInput').value = screenshotDataUrl;

    // Clean up
    offscreenRenderer.dispose();
}

function loadFileInputLabel() {
    const inputLabel = document.getElementById('fileUploadInputLabel');
    const input = document.getElementById('fileUploadInput');

    if (inputLabel) {
        inputLabel.innerHTML = 'Select a glb file';
    }

    if (input) {
        input.accept = '.glb';
    }
}

function vrodos_reset_panels(asset_viewer_3d_kernel, whocalls) {
    vrodos_clear_asset_files(asset_viewer_3d_kernel);
    document.querySelectorAll('div.ProducerPlotTooltip').forEach((el) => {
        el.remove();
    });
}

function clearList() {
    vrodos_reset_panels(asset_viewer_3d_kernel, 'clearList');
    loadFileInputLabel();
}

function setScreenshotHandler() {
    const sshotBtn = document.getElementById('createModelScreenshotBtn');
    if (sshotBtn && document.getElementById('sshotPreviewImg')) {
        sshotBtn.addEventListener('click', () => {
            vrodos_create_model_sshot(asset_viewer_3d_kernel);
        });
    }
}
