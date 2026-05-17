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

VRODOS.ui.compileDialogState = (function(existing) {
    const ids = {
        appResult: 'appResultDiv',
        cancelButton: 'compileCancelBtn',
        constantUpdate: 'constantUpdateUser',
        copyWebLink: 'buttonCopyWebLink',
        dialog: 'compile-dialog',
        openWebLink: 'openWebLinkhref',
        platform: 'platformInput',
        preview: 'previewApp',
        proceedButton: 'compileProceedBtn',
        progressBarValue: 'progressSliderSubLineDeterminateValue',
        progressDeterminate: 'compileProgressDeterminate',
        progressSlider: 'compileProgressSlider',
        progressText: 'compilationProgressText',
        progressTitle: 'compileProgressTitle',
        projectType: 'project-type',
        resultMeta: 'compileResultMeta',
        runtimeMode: 'compileRuntimeModeSelect',
        saveButton: 'save-scene-button',
        statusRow: 'compileStatusRow',
        taskMemory: 'unityTaskMemValue',
        topResultLink: 'compileTopResultLink',
        webLink: 'vrodos-weblink',
        zipLink: 'vrodos-ziplink'
    };

    function getElement(key) {
        return document.getElementById(ids[key] || key);
    }

    function getValue(key, fallback) {
        const element = getElement(key);
        return element ? element.value : fallback;
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

    function resetProgressState() {
        resetDialogStatusState();
        setDisplay(getElement('progressSlider'), '');
        setDisplay(getElement('progressTitle'), '');
        setDisplay(getElement('progressText'), '');
        setDisplay(getElement('zipLink'), 'none');
        setDisplay(getElement('webLink'), 'none');
        setHtml(getElement('progressText'), '');
        setHtml(getElement('taskMemory'), '0');
    }

    function showSavePendingMessage() {
        setStatusMessage('save', 'Saving build settings and latest scene changes before build...');
    }

    function showSaveFailedMessage() {
        setStatusMessage('triangle-alert', 'Could not save the latest scene changes. Please try again.');
    }

    function showStartedState() {
        const progressText = getElement('progressText');
        const cancelButton = getElement('cancelButton');

        if (cancelButton) {
            cancelButton.classList.remove('LinkDisabled');
        }

        resetResultState();
        setText(getElement('progressTitle'), 'Step: 1 / 2');
        if (progressText) {
            progressText.style.display = '';
            progressText.textContent = '';
            progressText.append('Building...');
        }
        setStatusMessage('info', 'Please wait while we build your scene');
    }

    function hideProgress(options) {
        const opts = options || {};

        setDisplay(getElement('progressSlider'), 'none');
        setDisplay(getElement('progressTitle'), 'none');
        setDisplay(getElement('progressDeterminate'), 'none');
        if (opts.hideText) {
            setDisplay(getElement('progressText'), 'none');
        }
        if (opts.resetDeterminateWidth) {
            const progressBarValue = getElement('progressBarValue');
            if (progressBarValue) {
                progressBarValue.style.width = '1px';
            }
        }
        if (opts.releaseActions !== false) {
            releaseBuildActions();
        }
    }

    function clearPreview() {
        setHtml(getElement('preview'), '');
    }

    function showPrimaryExperienceLink(primaryExperienceUrl) {
        if (!primaryExperienceUrl) {
            return;
        }

        const webLink = getElement('webLink');
        const openWebLink = getElement('openWebLink');

        setDisplay(getElement('statusRow'), 'none');
        setDisplay(getElement('appResult'), 'flex');
        setText(getElement('resultMeta'), `Ready to be shared - ${new Date().toLocaleString()}`);

        if (webLink) {
            webLink.href = primaryExperienceUrl;
            setDisplay(webLink, '');
        }
        if (openWebLink) {
            setHref(openWebLink, primaryExperienceUrl);
            setDisplay(openWebLink, '');
        }
        setDisplay(getElement('copyWebLink'), '');
        VRODOS.ui.refreshLucideIcons();
    }

    function getCompilePid() {
        const cancelButton = getElement('cancelButton');
        return cancelButton ? cancelButton.getAttribute('data-unity-pid') : '';
    }

    return Object.assign(existing || {}, {
        clearPreview,
        getCompilePid,
        getElement,
        getValue,
        hideProgress,
        releaseBuildActions,
        resetDialogStatusState,
        resetProgressState,
        resetResultState,
        setStatusMessage,
        showPrimaryExperienceLink,
        showSaveFailedMessage,
        showSavePendingMessage,
        showStartedState
    });
})(VRODOS.ui.compileDialogState);
