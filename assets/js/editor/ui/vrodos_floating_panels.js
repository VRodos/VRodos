'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.ui = VRODOS.ui || {};

(function initVrodosFloatingPanels() {
    const FLOATING_PANEL = {
        margin: 8,
        topChrome: 44,
        defaultMinWidth: 360,
        defaultMinHeight: 260
    };

    const IMMERSE_IDS = {
        toggle: 'toggleImmerseSceneInfoBtn',
        panel: 'immerseSceneInfoDialog',
        header: 'immerseSceneInfoHeader',
        close: 'closeImmerseSceneInfoBtn',
        copy: 'copyImmerseSceneInfoBtn',
        source: 'immerse_scene_info_source'
    };

    VRODOS.ui.immerseSceneInfoControlsBound = Boolean(VRODOS.ui.immerseSceneInfoControlsBound);

    function getElement(id) {
        return document.getElementById(id);
    }

    function refreshLucideIcons() {
        VRODOS.ui.refreshLucideIcons();
    }

    function setPanelRectPosition(panel, rect) {
        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.top}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    }

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
            // Pointer capture can already be released if the pointer leaves the window.
        }
    }

    function isPanelVisible(panel) {
        return panel && !panel.classList.contains('tw-hidden');
    }

    function getPanelMinSize(panel) {
        const computedStyle = window.getComputedStyle(panel);
        return {
            width: parseFloat(computedStyle.minWidth) || FLOATING_PANEL.defaultMinWidth,
            height: parseFloat(computedStyle.minHeight) || FLOATING_PANEL.defaultMinHeight
        };
    }

    function stopPointerEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    function bindFloatingPanelDrag(panel, header) {
        VRODOS.ui.bindDraggablePanel(panel, header, {
            clampToViewport: true,
            margin: FLOATING_PANEL.margin,
            topMargin: FLOATING_PANEL.topChrome
        });
    }

    function bindFloatingPanelResize(panel, resizeHandle) {
        if (!resizeHandle) {
            return;
        }

        let resizeState = null;

        resizeHandle.addEventListener('pointerdown', (event) => {
            const rect = panel.getBoundingClientRect();
            resizeState = {
                startX: event.clientX,
                startY: event.clientY,
                startWidth: rect.width,
                startHeight: rect.height,
                startLeft: rect.left,
                startTop: rect.top
            };

            panel.classList.add('is-resizing');
            setPanelRectPosition(panel, rect);
            safeSetPointerCapture(resizeHandle, event.pointerId);
            stopPointerEvent(event);
        });

        resizeHandle.addEventListener('pointermove', (event) => {
            if (!resizeState) return;

            const minSize = getPanelMinSize(panel);
            const maxWidth = Math.max(minSize.width, window.innerWidth - resizeState.startLeft - FLOATING_PANEL.margin);
            const maxHeight = Math.max(minSize.height, window.innerHeight - resizeState.startTop - FLOATING_PANEL.margin);
            const nextWidth = Math.min(Math.max(resizeState.startWidth + event.clientX - resizeState.startX, minSize.width), maxWidth);
            const nextHeight = Math.min(Math.max(resizeState.startHeight + event.clientY - resizeState.startY, minSize.height), maxHeight);

            panel.style.width = `${nextWidth}px`;
            panel.style.height = `${nextHeight}px`;
            stopPointerEvent(event);
        });

        const finishResize = (event) => {
            if (!resizeState) return;

            resizeState = null;
            panel.classList.remove('is-resizing');
            safeReleasePointerCapture(resizeHandle, event.pointerId);
            stopPointerEvent(event);
        };

        resizeHandle.addEventListener('pointerup', finishResize);
        resizeHandle.addEventListener('pointercancel', finishResize);
    }

    function bindFloatingPanelViewportClamp(panel) {
        window.addEventListener('resize', () => {
            if (isPanelVisible(panel)) {
                VRODOS.ui.clampFloatingPanelToViewport(panel);
            }
        });
    }

    function getResizeHandleForPanel(panelId) {
        return getElement(panelId.replace('Dialog', 'ResizeHandle'));
    }

    function getImmerseSceneInfoSourceText() {
        const sourceNode = getElement(IMMERSE_IDS.source);
        if (!sourceNode) {
            return '';
        }

        try {
            return JSON.parse(sourceNode.textContent || '""');
        } catch (error) {
            return sourceNode.textContent || '';
        }
    }

    function toggleImmerseSceneInfoPanel(panel) {
        if (panel.classList.contains('tw-hidden')) {
            VRODOS.ui.showFloatingPanel(panel);
            refreshLucideIcons();
            return;
        }

        VRODOS.ui.hideFloatingPanel(panel);
    }

    function bindImmerseSceneInfoToggle() {
        const toggleButton = getElement(IMMERSE_IDS.toggle);
        const panel = getElement(IMMERSE_IDS.panel);

        if (!toggleButton || !panel) {
            return;
        }

        toggleButton.addEventListener('click', () => toggleImmerseSceneInfoPanel(panel));
    }

    function bindImmerseSceneInfoCopy() {
        const copyButton = getElement(IMMERSE_IDS.copy);
        if (!copyButton) {
            return;
        }

        copyButton.addEventListener('click', () => {
            VRODOS.utils.copyPlainText(getImmerseSceneInfoSourceText())
                .then(() => {
                    VRODOS.ui.showTemporaryButtonSuccess(IMMERSE_IDS.copy, 'Copied!');
                })
                .catch((error) => {
                    VRODOS.ui.showTemporaryButtonWarning(IMMERSE_IDS.copy, 'Press Ctrl+C');
                    console.warn('VRodos: failed to copy imported scene information to clipboard.', error);
                });
        });
    }

    VRODOS.ui.clampFloatingPanelToViewport = function(panel) {
        if (!panel) return;

        const rect = panel.getBoundingClientRect();
        const maxLeft = Math.max(FLOATING_PANEL.margin, window.innerWidth - rect.width - FLOATING_PANEL.margin);
        const maxTop = Math.max(FLOATING_PANEL.topChrome, window.innerHeight - rect.height - FLOATING_PANEL.margin);
        const nextLeft = Math.min(Math.max(rect.left, FLOATING_PANEL.margin), maxLeft);
        const nextTop = Math.min(Math.max(rect.top, FLOATING_PANEL.topChrome), maxTop);

        panel.style.left = `${nextLeft}px`;
        panel.style.top = `${nextTop}px`;
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
        const panel = getElement(panelId);
        const header = getElement(headerId);
        const closeButton = getElement(closeButtonId);
        const resizeHandle = getResizeHandleForPanel(panelId);

        if (!panel || !header) return;
        if (panel.dataset.vrodosFloatingPanelBound === 'true') return;

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                VRODOS.ui.hideFloatingPanel(panel);
            });
        }

        bindFloatingPanelDrag(panel, header);
        bindFloatingPanelResize(panel, resizeHandle);
        bindFloatingPanelViewportClamp(panel);
        panel.dataset.vrodosFloatingPanelBound = 'true';
    };

    VRODOS.ui.bindImmerseSceneInfoControls = function() {
        if (VRODOS.ui.immerseSceneInfoControlsBound) {
            return true;
        }

        bindImmerseSceneInfoToggle();
        VRODOS.ui.initializeFloatingPanel(IMMERSE_IDS.panel, IMMERSE_IDS.header, IMMERSE_IDS.close);
        bindImmerseSceneInfoCopy();

        VRODOS.ui.immerseSceneInfoControlsBound = true;
        return true;
    };
})();
