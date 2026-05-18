'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.ui = VRODOS.ui || {};

(function initVrodosSceneListUi() {
    const SCENE_LIST_IDS = {
        drawerToggle: 'scenesList-toggle-btn',
        drawerWrapper: 'scenesDrawerWrapper',
        container: 'scenesInsideVREditor',
        deleteDialog: 'delete-dialog',
        deleteTitle: 'delete-dialog-title',
        deleteDescription: 'delete-dialog-description',
        deleteProgress: 'delete-scene-dialog-progress-bar',
        deleteButton: 'deleteSceneDialogDeleteBtn',
        closeButton: 'deleteSceneDialogCloseBtn',
        cancelButton: 'deleteSceneDialogCancelBtn'
    };
    const SCENE_CARD_SELECTOR = '.SceneCardContainer[draggable]';
    const DELETE_BUTTON_SELECTOR = '.cardDeleteIcon';

    const sceneListUi = VRODOS.ui.sceneList || {
        isBound: false,

        bind() {
            if (this.isBound) {
                return true;
            }

            bindScenesDrawerToggle();
            bindSceneReorder();
            bindDeleteSceneDialog();

            this.isBound = true;
            return true;
        }
    };

    function getElement(id) {
        return document.getElementById(id);
    }

    function queryElement(selector) {
        return document.querySelector(selector);
    }

    function refreshLucideIcons() {
        VRODOS.ui.refreshLucideIcons();
    }

    function swapIcon(button, iconName) {
        if (typeof VRODOS.ui.swapLucideIcon === 'function') {
            VRODOS.ui.swapLucideIcon(button, iconName);
        }
    }

    function closestTarget(event, selector) {
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return null;
        return target.closest(selector);
    }

    function findSceneCard(event) {
        return closestTarget(event, SCENE_CARD_SELECTOR);
    }

    function setDrawerOpen(button, wrapper, isOpen) {
        button.classList.toggle('scenesListToggleOn', isOpen);
        button.classList.toggle('scenesListToggleOff', !isOpen);
        button.dataset.toggle = isOpen ? 'on' : 'off';
        swapIcon(button, isOpen ? 'chevron-down' : 'chevron-up');
        wrapper.classList.toggle('closed-drawer', !isOpen);
    }

    function bindScenesDrawerToggle() {
        const button = getElement(SCENE_LIST_IDS.drawerToggle);
        const wrapper = getElement(SCENE_LIST_IDS.drawerWrapper);

        if (!button || !wrapper) {
            return;
        }

        button.addEventListener('click', function() {
            const shouldOpen = !button.classList.contains('scenesListToggleOn');
            setDrawerOpen(this, wrapper, shouldOpen);
            refreshLucideIcons();
        });
    }

    function bindSceneReorder() {
        const container = getElement(SCENE_LIST_IDS.container);
        if (!container) return;

        let dragItem = null;
        let dragMidpointCache = new WeakMap();

        function clearDragMidpointCache() {
            dragMidpointCache = new WeakMap();
        }

        function getSceneCardMidX(card) {
            if (!dragMidpointCache.has(card)) {
                const rect = card.getBoundingClientRect();
                dragMidpointCache.set(card, rect.left + rect.width / 2);
            }
            return dragMidpointCache.get(card);
        }

        function insertDragItemBefore(referenceNode) {
            if (!dragItem || dragItem === referenceNode || dragItem.nextSibling === referenceNode) {
                return;
            }

            container.insertBefore(dragItem, referenceNode);
            clearDragMidpointCache();
        }

        container.addEventListener('dragstart', (e) => {
            const card = findSceneCard(e);
            if (!card) return;

            dragItem = card;
            clearDragMidpointCache();
            card.classList.add('dragging');
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('application/vrodos-scene-reorder', 'true');
            }
        });

        container.addEventListener('dragover', (e) => {
            if (!dragItem) return;

            e.preventDefault();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'move';
            }

            const card = findSceneCard(e);
            if (!card || card === dragItem) return;

            const referenceNode = e.clientX < getSceneCardMidX(card) ? card : card.nextSibling;
            insertDragItemBefore(referenceNode);
        });

        container.addEventListener('dragend', () => {
            const hadDraggedScene = Boolean(dragItem);
            if (dragItem) dragItem.classList.remove('dragging');
            dragItem = null;
            clearDragMidpointCache();

            if (!hadDraggedScene) {
                return;
            }

            updateSceneOrderBadges(container);
            saveSceneOrder(container);
        });
    }

    function updateSceneOrderBadges(container) {
        container.querySelectorAll('.SceneCardContainer[draggable] .scene-order-badge').forEach((badge, index) => {
            badge.textContent = index + 1;
        });
    }

    function saveSceneOrder(container) {
        const formData = new FormData();
        formData.append('action', 'vrodos_reorder_scenes_action');
        const nonceField = queryElement('[name="post_nonce_field"]');
        if (nonceField) formData.append('nonce', nonceField.value);

        container.querySelectorAll(SCENE_CARD_SELECTOR).forEach((card) => {
            formData.append('scene_ids[]', card.dataset.sceneId);
        });

        fetch(VRODOS.utils.getAjaxUrl(), { method: 'POST', body: formData });
    }

    function getDeleteDialogElements() {
        return {
            dialog: getElement(SCENE_LIST_IDS.deleteDialog),
            title: getElement(SCENE_LIST_IDS.deleteTitle),
            description: getElement(SCENE_LIST_IDS.deleteDescription),
            progress: getElement(SCENE_LIST_IDS.deleteProgress),
            deleteButton: getElement(SCENE_LIST_IDS.deleteButton),
            closeButton: getElement(SCENE_LIST_IDS.closeButton),
            cancelButton: getElement(SCENE_LIST_IDS.cancelButton),
            container: getElement(SCENE_LIST_IDS.container)
        };
    }

    function setDeleteDialogBusy(elements, isBusy) {
        if (elements.progress) {
            elements.progress.style.display = isBusy ? '' : 'none';
        }
        if (elements.deleteButton) {
            elements.deleteButton.classList.toggle('LinkDisabled', isBusy);
        }
        if (elements.cancelButton) {
            elements.cancelButton.classList.toggle('LinkDisabled', isBusy);
        }
    }

    function closeDeleteDialog(dialog) {
        if (dialog && dialog.open && typeof dialog.close === 'function') {
            dialog.close();
        }
    }

    function bindDeleteSceneDialog() {
        const elements = getDeleteDialogElements();

        if (elements.deleteButton) {
            elements.deleteButton.addEventListener('click', () => {
                if (!elements.dialog || !elements.dialog.dataset.sceneId) {
                    return;
                }

                setDeleteDialogBusy(elements, true);
                VRODOS.api.deleteScene(elements.dialog.dataset.sceneId, elements.dialog.dataset.redirectUrl);
            });
        }

        if (elements.cancelButton) {
            elements.cancelButton.addEventListener('click', () => {
                setDeleteDialogBusy(elements, false);
                closeDeleteDialog(elements.dialog);
            });
        }

        if (elements.closeButton) {
            elements.closeButton.addEventListener('click', () => {
                setDeleteDialogBusy(elements, false);
                closeDeleteDialog(elements.dialog);
            });
        }

        if (!elements.container) {
            return;
        }

        elements.container.addEventListener('click', (event) => {
            const button = closestTarget(event, DELETE_BUTTON_SELECTOR);
            if (!button) return;

            event.preventDefault();
            openDeleteSceneDialog(button);
        });
    }

    function getSceneIdFromDeleteButton(button) {
        return button ? button.dataset.sceneid || button.dataset.sceneId || '' : '';
    }

    function getSceneTitle(sceneId) {
        const sceneTitleNode = sceneId ? getElement(`${sceneId}-title`) : null;
        const sceneTitle = sceneTitleNode ? sceneTitleNode.textContent.trim() : '';
        return sceneTitle || 'this scene';
    }

    function isUsableRedirectUrl(value) {
        return typeof value === 'string' && value.trim() !== '' && value.trim() !== 'undefined';
    }

    function getSceneCardRedirectUrl(card) {
        if (!card || typeof card.querySelector !== 'function') {
            return '';
        }

        const link = card.querySelector('a[href]');
        return link && isUsableRedirectUrl(link.href) ? link.href : '';
    }

    function getFirstRemainingSceneRedirectUrl(deletedSceneId, container) {
        if (!container || typeof container.querySelectorAll !== 'function') {
            return '';
        }

        const cards = Array.from(container.querySelectorAll(SCENE_CARD_SELECTOR));
        const firstRemainingCard = cards.find((card) => card.dataset.sceneId !== deletedSceneId);
        return getSceneCardRedirectUrl(firstRemainingCard);
    }

    function getDeleteRedirectUrl(sceneId, button, elements) {
        const buttonRedirectUrl = button ? button.dataset.redirectUrl : '';
        if (isUsableRedirectUrl(buttonRedirectUrl)) {
            return buttonRedirectUrl;
        }

        if (isUsableRedirectUrl(window.url_scene_redirect)) {
            return window.url_scene_redirect;
        }

        const firstRemainingUrl = getFirstRemainingSceneRedirectUrl(sceneId, elements.container);
        if (isUsableRedirectUrl(firstRemainingUrl)) {
            return firstRemainingUrl;
        }

        return window.location.href;
    }

    function openDeleteSceneDialog(button) {
        const sceneId = getSceneIdFromDeleteButton(button);
        if (!sceneId) {
            return;
        }

        const elements = getDeleteDialogElements();
        const sceneTitle = getSceneTitle(sceneId);

        if (elements.title) {
            elements.title.textContent = `Delete ${sceneTitle}?`;
        }
        if (elements.description) {
            elements.description.textContent = `Are you sure you want to delete your scene '${sceneTitle}'? There is no Undo functionality once you delete it.`;
        }

        if (elements.dialog) {
            elements.dialog.dataset.sceneId = sceneId;
            elements.dialog.dataset.redirectUrl = getDeleteRedirectUrl(sceneId, button, elements);
            setDeleteDialogBusy(elements, false);
            elements.dialog.showModal();
            refreshLucideIcons();
        }
    }

    VRODOS.ui.sceneList = sceneListUi;
    VRODOS.ui.bindSceneListControls = function() {
        return sceneListUi.bind();
    };
})();
