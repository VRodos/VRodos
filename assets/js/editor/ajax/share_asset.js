(function () {
    'use strict';

    function init() {
        const form = document.getElementById('3dAssetForm');
        const snapshot = () => form ? JSON.stringify(Array.from(new FormData(form), ([key, value]) =>
            [key, value instanceof File ? [value.name, value.size, value.lastModified] : value])) : '';
        const initial = snapshot();
        let pending = false;

        for (const button of document.querySelectorAll('[data-vrodos-share-asset]')) {
            button.addEventListener('click', async () => {
                if (pending) return;
                const error = button.parentElement.querySelector('[data-vrodos-share-error]');
                error.textContent = '';
                if (form && document.getElementById('formSubmitBtn')?.disabled) {
                    error.textContent = 'Wait until the asset save or upload finishes.';
                    return;
                }
                if (form && snapshot() !== initial && !window.confirm(
                    'This editor has unsaved changes. OK discards them and continues to sharing. Cancel lets you save them first.')) return;
                if (!window.confirm('Make this asset Shared across projects? Sharing is permanent. Immerse Users can use Shared assets but cannot edit them.')) return;

                pending = true;
                button.disabled = true;
                try {
                    const response = await fetch(vrodosAssetSharing.url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            action: 'vrodos_make_asset_shared_action',
                            asset_id: button.dataset.vrodosShareAsset,
                            nonce: vrodosAssetSharing.nonce
                        })
                    });
                    const result = await response.json();
                    if (!response.ok || !result.success) throw new Error(result.data || 'Could not make the asset Shared.');
                    if (form) window.location.assign(vrodosAssetSharing.sharedListUrl);
                    else window.location.reload();
                } catch (failure) {
                    error.textContent = failure.message || 'Could not make the asset Shared.';
                    button.disabled = false;
                    pending = false;
                }
            });
        }
    }

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init, { once: true });
})();
