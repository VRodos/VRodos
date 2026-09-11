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

VRODOS.api.deleteSurfaceTexture = function(attachmentId) {
    const formData = new FormData();
    formData.append('action', 'vrodos_delete_surface_texture_action');
    formData.append('nonce', window.vrodos_data.scene_mutation_nonce);
    formData.append('scene_id', VRODOS.config.sceneId);
    formData.append('attachment_id', attachmentId);
    return vrodosSurfaceTextureRequest(formData);
};
