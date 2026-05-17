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
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
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

        container.addEventListener('dragstart', (e) => {
            const card = findSceneCard(e);
            if (!card) return;

            dragItem = card;
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

            const rect = card.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            if (e.clientX < midX) {
                container.insertBefore(dragItem, card);
            } else {
                container.insertBefore(dragItem, card.nextSibling);
            }
        });

        container.addEventListener('dragend', () => {
            const hadDraggedScene = Boolean(dragItem);
            if (dragItem) dragItem.classList.remove('dragging');
            dragItem = null;

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
                VRODOS.api.deleteScene(elements.dialog.dataset.sceneId, window.url_scene_redirect);
            });
        }

        if (elements.cancelButton) {
            elements.cancelButton.addEventListener('click', () => {
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
