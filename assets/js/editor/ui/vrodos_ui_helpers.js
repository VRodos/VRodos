'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};

VRODOS.ui.refreshLucideIcons = function(options) {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        lucide.createIcons(options);
    }
};

VRODOS.ui.swapLucideIcon = function(container, iconName) {
    if (!container) return;
    const icon = container.querySelector('[data-lucide], svg');
    if (icon) {
        const newIcon = document.createElement('i');
        newIcon.setAttribute('data-lucide', iconName);
        // Preserve original sizing classes.
        const origClasses = (icon.getAttribute('class') || '').replace(/lucide[^\s]*/g, '').trim();
        if (origClasses) newIcon.setAttribute('class', origClasses);
        icon.replaceWith(newIcon);
        VRODOS.ui.refreshLucideIcons();
    }
};

VRODOS.ui.focusWithoutScroll = function(element) {
    if (!element || typeof element.focus !== 'function') return;

    try {
        element.focus({ preventScroll: true });
    } catch (error) {
        element.focus();
    }
};

VRODOS.utils.copyTextareaText = function(textarea) {
    if (!textarea) {
        return Promise.reject(new Error('No textarea available for clipboard copy.'));
    }

    const text = textarea.value || '';

    if (window.isSecureContext && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(text).catch(() => VRODOS.utils.fallbackCopyTextareaText(textarea));
    }

    return VRODOS.utils.fallbackCopyTextareaText(textarea);
};

VRODOS.utils.fallbackCopyTextareaText = function(textarea) {
    return new Promise((resolve, reject) => {
        const activeElement = document.activeElement;
        const originalSelectionStart = textarea.selectionStart;
        const originalSelectionEnd = textarea.selectionEnd;

        try {
            VRODOS.ui.focusWithoutScroll(textarea);
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);

            const copied = document.execCommand('copy');
            textarea.setSelectionRange(originalSelectionStart || 0, originalSelectionEnd || 0);

            if (activeElement && typeof activeElement.focus === 'function' && activeElement !== textarea) {
                VRODOS.ui.focusWithoutScroll(activeElement);
            }

            if (copied) {
                resolve();
            } else {
                reject(new Error('Clipboard copy command was rejected.'));
            }
        } catch (error) {
            textarea.select();
            reject(error);
        }
    });
};

VRODOS.utils.copyPlainText = function(text) {
    text = text || '';

    if (window.isSecureContext && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(text).catch(() => VRODOS.utils.fallbackCopyPlainText(text));
    }

    return VRODOS.utils.fallbackCopyPlainText(text);
};

VRODOS.utils.fallbackCopyPlainText = function(text) {
    return new Promise((resolve, reject) => {
        const textarea = document.createElement('textarea');
        const activeElement = document.activeElement;

        textarea.value = text || '';
        textarea.setAttribute('readonly', 'readonly');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        textarea.style.opacity = '0';

        document.body.appendChild(textarea);

        try {
            VRODOS.ui.focusWithoutScroll(textarea);
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);

            const copied = document.execCommand('copy');
            textarea.remove();

            if (activeElement && typeof activeElement.focus === 'function') {
                VRODOS.ui.focusWithoutScroll(activeElement);
            }

            if (copied) {
                resolve();
            } else {
                reject(new Error('Clipboard copy command was rejected.'));
            }
        } catch (error) {
            textarea.remove();
            reject(error);
        }
    });
};

VRODOS.ui.showTemporaryButtonSuccess = function(buttonId, message) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    const orig = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="check" class="tw-w-3.5 tw-h-3.5"></i> ${  message}`;
    VRODOS.ui.refreshLucideIcons();

    setTimeout(() => {
        btn.innerHTML = orig;
        VRODOS.ui.refreshLucideIcons();
    }, 1500);
};

VRODOS.ui.showTemporaryButtonWarning = function(buttonId, message) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    const orig = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="triangle-alert" class="tw-w-3.5 tw-h-3.5"></i> ${  message}`;
    VRODOS.ui.refreshLucideIcons();

    setTimeout(() => {
        btn.innerHTML = orig;
        VRODOS.ui.refreshLucideIcons();
    }, 2500);
};
