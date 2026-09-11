'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.api = VRODOS.api || {};

function vrodosSurfaceTextureRequest(formData) {
    return fetch(VRODOS.config.isAdmin === 'back' ? 'admin-ajax.php' : VRODOS.utils.getAjaxUrl(), {
        method: 'POST',
        body: formData
    }).then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload || payload.success === false) {
            const data = payload && payload.data;
            const message = typeof data === 'string' ? data : (data && data.message) || `HTTP ${response.status}`;
            throw new Error(message);
        }
        return payload.data || payload;
    });
}

VRODOS.api.uploadSurfaceTexture = function(file, slot) {
    const formData = new FormData();
    formData.append('action', 'vrodos_upload_surface_texture_action');
    formData.append('nonce', window.vrodos_data.scene_mutation_nonce);
    formData.append('project_id', VRODOS.config.projectId);
    formData.append('scene_id', VRODOS.config.sceneId);
    formData.append('slot', slot);
    formData.append('texture', file);
    return vrodosSurfaceTextureRequest(formData);
};

VRODOS.api.uploadSurfaceMaterialPackage = function(file, onProgress) {
    const formData = new FormData();
    formData.append('action', 'vrodos_upload_surface_material_package_action');
    formData.append('nonce', window.vrodos_data.scene_mutation_nonce);
    formData.append('project_id', VRODOS.config.projectId);
    formData.append('scene_id', VRODOS.config.sceneId);
    formData.append('surface_package', file);

    return new Promise((resolve, reject) => {
        const request = new window.XMLHttpRequest();
        request.open('POST', VRODOS.config.isAdmin === 'back' ? 'admin-ajax.php' : VRODOS.utils.getAjaxUrl());
        request.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && typeof onProgress === 'function') {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        });
        request.addEventListener('load', () => {
            let payload = null;
            try {
                payload = JSON.parse(String(request.responseText || '').trim());
            } catch (_error) {
                payload = null;
            }
            if (request.status < 200 || request.status >= 300 || !payload || payload.success === false) {
                const data = payload && payload.data;
                const message = typeof data === 'string'
                    ? data
                    : (data && data.message) || `PBR ZIP upload failed (HTTP ${request.status || 0}).`;
                reject(new Error(message));
                return;
            }
            resolve(payload.data || payload);
        });
        request.addEventListener('error', () => reject(new Error('The PBR ZIP upload could not reach the server.')));
        request.addEventListener('abort', () => reject(new Error('The PBR ZIP upload was cancelled.')));
        request.send(formData);
    });
};

VRODOS.api.deleteSurfaceTexture = function(attachmentId) {
    const formData = new FormData();
    formData.append('action', 'vrodos_delete_surface_texture_action');
    formData.append('nonce', window.vrodos_data.scene_mutation_nonce);
    formData.append('scene_id', VRODOS.config.sceneId);
    formData.append('attachment_id', attachmentId);
    return vrodosSurfaceTextureRequest(formData);
};
