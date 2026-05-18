'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.ui = VRODOS.ui || {};
VRODOS.utils = VRODOS.utils || {};

VRODOS.ui.refreshLucideIcons = function(options) {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        lucide.createIcons(options);
    }
};

function safeSetPointerCapture(element, pointerId) {
    if (element && typeof element.setPointerCapture === 'function') {
        element.setPointerCapture(pointerId);
    }
}

function safeReleasePointerCapture(element, pointerId) {
    if (!element || typeof element.releasePointerCapture !== 'function') {
        return;
    }

    try {
        element.releasePointerCapture(pointerId);
    } catch (error) {
        // Pointer capture can already be released when the pointer leaves the window.
    }
}

function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

VRODOS.ui.bindDraggablePanel = function(panel, handle, options) {
    if (!panel || !handle) {
        return false;
    }

    options = options || {};
    const ignoreSelector = options.ignoreSelector === undefined ? 'button, a' : options.ignoreSelector;
    const clampToViewport = Boolean(options.clampToViewport);
    const margin = Number.isFinite(options.margin) ? options.margin : 0;
    const topMargin = Number.isFinite(options.topMargin) ? options.topMargin : margin;
    let dragState = null;

    handle.addEventListener('pointerdown', (event) => {
        if (event.button !== undefined && event.button !== 0) {
            return;
        }

        if (
            ignoreSelector
            && event.target
            && typeof event.target.closest === 'function'
            && event.target.closest(ignoreSelector)
        ) {
            return;
        }

        const rect = panel.getBoundingClientRect();
        dragState = {
            startX: event.clientX,
            startY: event.clientY,
            startLeft: rect.left,
            startTop: rect.top,
            minLeft: margin,
            minTop: topMargin,
            maxLeft: Math.max(margin, window.innerWidth - rect.width - margin),
            maxTop: Math.max(topMargin, window.innerHeight - rect.height - margin)
        };

        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.top}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';

        safeSetPointerCapture(handle, event.pointerId);
        event.preventDefault();
    });

    handle.addEventListener('pointermove', (event) => {
        if (!dragState) {
            return;
        }

        let nextLeft = dragState.startLeft + event.clientX - dragState.startX;
        let nextTop = dragState.startTop + event.clientY - dragState.startY;

        if (clampToViewport) {
            nextLeft = clampNumber(nextLeft, dragState.minLeft, dragState.maxLeft);
            nextTop = clampNumber(nextTop, dragState.minTop, dragState.maxTop);
        }

        panel.style.left = `${nextLeft}px`;
        panel.style.top = `${nextTop}px`;
    });

    const finishDrag = (event) => {
        if (!dragState) {
            return;
        }

        dragState = null;
        safeReleasePointerCapture(handle, event.pointerId);
    };

    handle.addEventListener('pointerup', finishDrag);
    handle.addEventListener('pointercancel', finishDrag);
    return true;
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

VRODOS.ui.compileDialogState = (function(existing) {
    const ids = {
        appResult: 'appResultDiv',
        cancelButton: 'compileCancelBtn',
        closeButton: 'compileDialogCloseBtn',
        constantUpdate: 'constantUpdateUser',
        copyWebLink: 'buttonCopyWebLink',
        dialog: 'compile-dialog',
        openWebLink: 'openWebLinkhref',
        proceedButton: 'compileProceedBtn',
        resultMeta: 'compileResultMeta',
        saveButton: 'save-scene-button',
        statusRow: 'compileStatusRow',
        topResultLink: 'compileTopResultLink'
    };

    function getElement(key) {
        return document.getElementById(ids[key] || key);
    }

    function setDisplay(element, value) {
        if (element) {
            element.style.display = value;
        }
    }

    function setText(element, value) {
        if (element) {
            element.textContent = value;
        }
    }

    function setHtml(element, value) {
        if (element) {
            element.innerHTML = value;
        }
    }

    function setHref(element, value) {
        if (element) {
            element.setAttribute('href', value);
        }
    }

    function releaseBuildActions() {
        const proceedButton = getElement('proceedButton');
        const cancelButton = getElement('cancelButton');

        if (proceedButton) {
            proceedButton.classList.remove('LinkDisabled');
        }
        if (cancelButton) {
            cancelButton.classList.remove('LinkDisabled');
        }
    }

    function resetResultState() {
        const topResultLink = getElement('topResultLink');

        setDisplay(getElement('statusRow'), 'flex');
        setDisplay(getElement('appResult'), 'none');
        setText(getElement('resultMeta'), 'The experience is ready to be shared');

        if (topResultLink) {
            topResultLink.classList.add('tw-hidden');
            setHref(topResultLink, '#');
        }
    }

    function setStatusMessage(iconName, message) {
        setHtml(
            getElement('constantUpdate'),
            `<i data-lucide="${iconName}" class="tw-w-4 tw-h-4 tw-inline-block tw-align-text-bottom tw-mr-1"></i> ${message}`
        );
        VRODOS.ui.refreshLucideIcons();
    }

    function resetDialogStatusState() {
        resetResultState();
        setStatusMessage('info', 'Configure your scene quality settings and click "Build" to construct the virtual world.');
    }

    function resetBuildState() {
        resetDialogStatusState();
    }

    function showSavePendingMessage() {
        setStatusMessage('save', 'Saving build settings and latest scene changes before build...');
    }

    function showSaveFailedMessage() {
        setStatusMessage('triangle-alert', 'Could not save the latest scene changes. Please try again.');
    }

    function showStartedState() {
        const cancelButton = getElement('cancelButton');

        if (cancelButton) {
            cancelButton.classList.remove('LinkDisabled');
        }

        resetResultState();
        setStatusMessage('info', 'Please wait while we build your scene');
    }

    function finishBuildState() {
        releaseBuildActions();
    }

    function showPrimaryExperienceLink(primaryExperienceUrl) {
        if (!primaryExperienceUrl) {
            return;
        }

        const openWebLink = getElement('openWebLink');

        setDisplay(getElement('statusRow'), 'none');
        setDisplay(getElement('appResult'), 'flex');
        setText(getElement('resultMeta'), `Ready to be shared - ${new Date().toLocaleString()}`);

        if (openWebLink) {
            setHref(openWebLink, primaryExperienceUrl);
            setDisplay(openWebLink, '');
        }
        setDisplay(getElement('copyWebLink'), '');
        VRODOS.ui.refreshLucideIcons();
    }

    function getPrimaryExperienceUrl() {
        const openWebLink = getElement('openWebLink');
        return openWebLink ? (openWebLink.getAttribute('href') || openWebLink.href || '') : '';
    }

    function copyPrimaryExperienceUrl() {
        const url = getPrimaryExperienceUrl();

        if (!url || url === '#') {
            VRODOS.ui.showTemporaryButtonWarning(ids.copyWebLink, 'No link');
            return Promise.reject(new Error('No compiled scene URL is available to copy.'));
        }

        return VRODOS.utils.copyPlainText(url)
            .then(() => {
                VRODOS.ui.showTemporaryButtonSuccess(ids.copyWebLink, 'Copied');
                return url;
            })
            .catch((error) => {
                VRODOS.ui.showTemporaryButtonWarning(ids.copyWebLink, 'Press Ctrl+C');
                throw error;
            });
    }

    return Object.assign(existing || {}, {
        copyPrimaryExperienceUrl,
        getElement,
        getPrimaryExperienceUrl,
        finishBuildState,
        releaseBuildActions,
        resetDialogStatusState,
        resetBuildState,
        resetResultState,
        setStatusMessage,
        showPrimaryExperienceLink,
        showSaveFailedMessage,
        showSavePendingMessage,
        showStartedState
    });
})(VRODOS.ui.compileDialogState);
