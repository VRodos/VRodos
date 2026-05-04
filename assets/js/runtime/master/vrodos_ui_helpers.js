(function () {
    window.VRODOSMasterUI = window.VRODOSMasterUI || {};

    const api = window.VRODOSMasterUI;

    api.renderIcons = function (options) {
        if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons(options);
        }
    };

    api.ensureDialog = function (dialog) {
        if (!dialog || dialog.dataset.vrodosDialogBound === 'true') {
            return dialog;
        }

        dialog.dataset.vrodosDialogBound = 'true';

        dialog.addEventListener('click', (event) => {
            const modalBox = dialog.querySelector('.tw-modal-box');
            if (!modalBox) {
                return;
            }

            if (!modalBox.contains(event.target)) {
                dialog.close('backdrop');
            }
        });

        return dialog;
    };

    api.showDialog = function (dialogOrSelector) {
        const dialog = typeof dialogOrSelector === 'string'
            ? document.querySelector(dialogOrSelector)
            : dialogOrSelector;

        if (!dialog) {
            return null;
        }

        api.ensureDialog(dialog);

        if (dialog.open) {
            dialog.close();
        }

        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', 'open');
        }

        api.renderIcons();
        return dialog;
    };

    api.closeDialog = function (dialogOrSelector, returnValue) {
        const dialog = typeof dialogOrSelector === 'string'
            ? document.querySelector(dialogOrSelector)
            : dialogOrSelector;

        if (!dialog) {
            return;
        }

        if (typeof dialog.close === 'function') {
            dialog.close(returnValue || '');
        } else {
            dialog.removeAttribute('open');
        }
    };

    api.setButtonVisible = function (buttonOrId, visible) {
        const button = typeof buttonOrId === 'string'
            ? document.getElementById(buttonOrId)
            : buttonOrId;

        if (!button) {
            return;
        }

        button.classList.toggle('tw-hidden', !visible);
        button.style.visibility = visible ? 'visible' : 'hidden';
        button.setAttribute('aria-hidden', visible ? 'false' : 'true');
    };

    api.setChatTabState = function (activeTab) {
        const publicBtn = document.getElementById('public-chat-button');
        const privateBtn = document.getElementById('private-chat-button');

        [
            { button: publicBtn, active: activeTab === 'public' },
            { button: privateBtn, active: activeTab === 'private' }
        ].forEach((entry) => {
            if (!entry.button) {
                return;
            }

            entry.button.classList.toggle('tw-btn-active', entry.active);
            entry.button.classList.toggle('tw-btn-primary', entry.active);
            entry.button.classList.toggle('tw-btn-ghost', !entry.active);
            entry.button.setAttribute('aria-selected', entry.active ? 'true' : 'false');
        });
    };

    api.getChatCapabilities = function () {
        const sceneEl = document.getElementById('aframe-scene-container') || document.querySelector('a-scene');
        const settings = sceneEl ? sceneEl.getAttribute('scene-settings') : null;
        const hasPublic = Boolean(settings && String(settings.public_chat) === '1');
        const hasPrivate = Boolean(document.querySelector('[chat-poi]'));

        return {
            public: hasPublic,
            private: hasPrivate,
            any: hasPublic || hasPrivate
        };
    };

    api.applyChatTabs = function (activeTab) {
        const capabilities = api.getChatCapabilities();
        const publicBtn = document.getElementById('public-chat-button');
        const privateBtn = document.getElementById('private-chat-button');
        let resolvedActiveTab = activeTab;

        if (resolvedActiveTab === 'public' && !capabilities.public) {
            resolvedActiveTab = capabilities.private ? 'private' : '';
        }

        if (resolvedActiveTab === 'private' && !capabilities.private) {
            resolvedActiveTab = capabilities.public ? 'public' : '';
        }

        if (!resolvedActiveTab) {
            resolvedActiveTab = capabilities.public ? 'public' : (capabilities.private ? 'private' : '');
        }

        api.setButtonVisible(publicBtn, capabilities.public);
        api.setButtonVisible(privateBtn, capabilities.private);

        if (publicBtn) {
            publicBtn.disabled = !capabilities.public || !capabilities.private;
        }

        if (privateBtn) {
            privateBtn.disabled = !capabilities.private;
        }

        api.setChatTabState(resolvedActiveTab);

        return {
            activeTab: resolvedActiveTab,
            capabilities
        };
    };

    document.addEventListener('click', (event) => {
        const closeTrigger = event.target.closest('[data-dialog-close]');
        if (!closeTrigger) {
            return;
        }

        const dialog = closeTrigger.closest('dialog');
        if (!dialog) {
            return;
        }

        api.closeDialog(dialog, closeTrigger.getAttribute('data-dialog-close'));
    });

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('dialog.vrodos-runtime-dialog').forEach(api.ensureDialog);
        api.renderIcons();
    });
})();
