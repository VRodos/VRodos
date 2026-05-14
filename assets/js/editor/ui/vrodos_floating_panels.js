'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.ui = VRODOS.ui || {};

VRODOS.ui.clampFloatingPanelToViewport = function(panel) {
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxTop = Math.max(44, window.innerHeight - rect.height - margin);
    const nextLeft = Math.min(Math.max(rect.left, margin), maxLeft);
    const nextTop = Math.min(Math.max(rect.top, 44), maxTop);

    panel.style.left = `${nextLeft  }px`;
    panel.style.top = `${nextTop  }px`;
};

VRODOS.ui.showFloatingPanel = function(panel) {
    if (!panel) return;

    panel.classList.remove('tw-hidden');
    panel.style.display = 'flex';
    VRODOS.ui.clampFloatingPanelToViewport(panel);
};

VRODOS.ui.hideFloatingPanel = function(panel) {
    if (!panel) return;

    panel.classList.add('tw-hidden');
    panel.style.display = 'none';
};

VRODOS.ui.initializeFloatingPanel = function(panelId, headerId, closeButtonId) {
    const panel = document.getElementById(panelId);
    const header = document.getElementById(headerId);
    const closeButton = document.getElementById(closeButtonId);
    const resizeHandle = document.getElementById(panelId.replace('Dialog', 'ResizeHandle'));

    if (!panel || !header) return;

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            VRODOS.ui.hideFloatingPanel(panel);
        });
    }

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    header.addEventListener('pointerdown', (event) => {
        if (event.target.closest('button, a')) return;

        const rect = panel.getBoundingClientRect();
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        startLeft = rect.left;
        startTop = rect.top;

        panel.style.left = `${startLeft  }px`;
        panel.style.top = `${startTop  }px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        header.setPointerCapture(event.pointerId);
        event.preventDefault();
    });

    header.addEventListener('pointermove', (event) => {
        if (!isDragging) return;

        panel.style.left = `${startLeft + event.clientX - startX  }px`;
        panel.style.top = `${startTop + event.clientY - startY  }px`;
        VRODOS.ui.clampFloatingPanelToViewport(panel);
    });

    header.addEventListener('pointerup', (event) => {
        isDragging = false;
        try {
            header.releasePointerCapture(event.pointerId);
        } catch (error) {
            // Pointer capture can already be released if the pointer leaves the window.
        }
    });

    window.addEventListener('resize', () => {
        if (!panel.classList.contains('tw-hidden')) {
            VRODOS.ui.clampFloatingPanelToViewport(panel);
        }
    });

    if (resizeHandle) {
        let isResizing = false;
        let resizeStartX = 0;
        let resizeStartY = 0;
        let resizeStartWidth = 0;
        let resizeStartHeight = 0;
        let resizeStartLeft = 0;
        let resizeStartTop = 0;

        resizeHandle.addEventListener('pointerdown', (event) => {
            const rect = panel.getBoundingClientRect();
            isResizing = true;
            resizeStartX = event.clientX;
            resizeStartY = event.clientY;
            resizeStartWidth = rect.width;
            resizeStartHeight = rect.height;
            resizeStartLeft = rect.left;
            resizeStartTop = rect.top;

            panel.classList.add('is-resizing');
            panel.style.left = `${resizeStartLeft  }px`;
            panel.style.top = `${resizeStartTop  }px`;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            resizeHandle.setPointerCapture(event.pointerId);
            event.preventDefault();
            event.stopPropagation();
        });

        resizeHandle.addEventListener('pointermove', (event) => {
            if (!isResizing) return;

            const minWidth = parseFloat(window.getComputedStyle(panel).minWidth) || 360;
            const minHeight = parseFloat(window.getComputedStyle(panel).minHeight) || 260;
            const margin = 8;
            const maxWidth = Math.max(minWidth, window.innerWidth - resizeStartLeft - margin);
            const maxHeight = Math.max(minHeight, window.innerHeight - resizeStartTop - margin);
            const nextWidth = Math.min(Math.max(resizeStartWidth + event.clientX - resizeStartX, minWidth), maxWidth);
            const nextHeight = Math.min(Math.max(resizeStartHeight + event.clientY - resizeStartY, minHeight), maxHeight);

            panel.style.width = `${nextWidth  }px`;
            panel.style.height = `${nextHeight  }px`;
            event.preventDefault();
            event.stopPropagation();
        });

        resizeHandle.addEventListener('pointerup', (event) => {
            isResizing = false;
            panel.classList.remove('is-resizing');
            try {
                resizeHandle.releasePointerCapture(event.pointerId);
            } catch (error) {
                // Pointer capture can already be released if the pointer leaves the window.
            }
            event.preventDefault();
            event.stopPropagation();
        });
    }
};

VRODOS.ui.immerseSceneInfoControlsBound = false;

VRODOS.ui.bindImmerseSceneInfoControls = function() {
    if (VRODOS.ui.immerseSceneInfoControlsBound) {
        return true;
    }

    const toggleButton = document.getElementById('toggleImmerseSceneInfoBtn');
    const dialog = document.getElementById('immerseSceneInfoDialog');

    if (toggleButton && dialog) {
        toggleButton.addEventListener('click', () => {
            if (dialog.classList.contains('tw-hidden')) {
                VRODOS.ui.showFloatingPanel(dialog);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                VRODOS.ui.hideFloatingPanel(dialog);
            }
        });
    }

    VRODOS.ui.initializeFloatingPanel('immerseSceneInfoDialog', 'immerseSceneInfoHeader', 'closeImmerseSceneInfoBtn');

    const copyButton = document.getElementById('copyImmerseSceneInfoBtn');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            VRODOS.utils.copyPlainText(getImmerseSceneInfoSourceText())
                .then(() => {
                    VRODOS.ui.showTemporaryButtonSuccess('copyImmerseSceneInfoBtn', 'Copied!');
                })
                .catch((error) => {
                    VRODOS.ui.showTemporaryButtonWarning('copyImmerseSceneInfoBtn', 'Press Ctrl+C');
                    console.warn('VRodos: failed to copy imported scene information to clipboard.', error);
                });
        });
    }

    VRODOS.ui.immerseSceneInfoControlsBound = true;
    return true;
};

function getImmerseSceneInfoSourceText() {
    const sourceNode = document.getElementById('immerse_scene_info_source');
    if (!sourceNode) {
        return '';
    }

    try {
        return JSON.parse(sourceNode.textContent || '""');
    } catch (error) {
        return sourceNode.textContent || '';
    }
}
