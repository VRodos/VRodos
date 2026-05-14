'use strict';

window.VRODOS = window.VRODOS || {};
VRODOS.ui = VRODOS.ui || {};

(function initVrodosSceneListUi() {
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

    function bindScenesDrawerToggle() {
        const button = document.getElementById('scenesList-toggle-btn');
        const wrapper = document.getElementById('scenesDrawerWrapper');

        if (!button || !wrapper) {
            return;
        }

        button.addEventListener('click', function() {
            if (button.classList.contains('scenesListToggleOn')) {
                button.classList.add('scenesListToggleOff');
                button.classList.remove('scenesListToggleOn');
                VRODOS.ui.swapLucideIcon(this, 'chevron-up');
                wrapper.classList.add('closed-drawer');
            } else {
                button.classList.add('scenesListToggleOn');
                button.classList.remove('scenesListToggleOff');
                VRODOS.ui.swapLucideIcon(this, 'chevron-down');
                wrapper.classList.remove('closed-drawer');
            }

            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    function bindSceneReorder() {
        const container = document.getElementById('scenesInsideVREditor');
        if (!container) return;

        let dragItem = null;

        container.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.SceneCardContainer[draggable]');
            if (!card) return;
            dragItem = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/vrodos-scene-reorder', 'true');
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const card = e.target.closest('.SceneCardContainer[draggable]');
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
            if (dragItem) dragItem.classList.remove('dragging');
            dragItem = null;
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
        const nonceField = document.querySelector('[name="post_nonce_field"]');
        if (nonceField) formData.append('nonce', nonceField.value);

        container.querySelectorAll('.SceneCardContainer[draggable]').forEach((card) => {
            formData.append('scene_ids[]', card.dataset.sceneId);
        });

        fetch(VRODOS.utils.getAjaxUrl(), { method: 'POST', body: formData });
    }

    function bindDeleteSceneDialog() {
        const deleteButton = document.getElementById('deleteSceneDialogDeleteBtn');
        const cancelButton = document.getElementById('deleteSceneDialogCancelBtn');

        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                const progress = document.getElementById('delete-scene-dialog-progress-bar');
                if (progress) progress.style.display = '';
                deleteButton.classList.add('LinkDisabled');
                if (cancelButton) cancelButton.classList.add('LinkDisabled');
                const dialog = document.getElementById('delete-dialog');
                if (dialog) {
                    VRODOS.api.deleteScene(dialog.dataset.sceneId, window.url_scene_redirect);
                }
            });
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                const progress = document.getElementById('delete-scene-dialog-progress-bar');
                if (progress) progress.style.display = 'none';
                const dialog = document.getElementById('delete-dialog');
                if (dialog && dialog.open) dialog.close();
            });
        }

        document.querySelectorAll('.cardDeleteIcon').forEach((button) => {
            button.addEventListener('click', function() {
                openDeleteSceneDialog(this);
            });
        });
    }

    function openDeleteSceneDialog(button) {
        const sceneId = button.dataset.sceneid || button.dataset.sceneId;
        const dialogTitle = document.getElementById('delete-dialog-title');
        const dialogDescription = document.getElementById('delete-dialog-description');
        const sceneTitleNode = document.getElementById(`${sceneId}-title`);
        const sceneTitle = sceneTitleNode ? sceneTitleNode.textContent.trim() : 'this scene';

        if (dialogTitle) {
            dialogTitle.textContent = `Delete ${sceneTitle}?`;
        }
        if (dialogDescription) {
            dialogDescription.innerHTML = `Are you sure you want to delete your scene '${sceneTitle}'? There is no Undo functionality once you delete it.`;
        }

        const dialog = document.getElementById('delete-dialog');
        if (dialog) {
            dialog.dataset.sceneId = sceneId;
            dialog.showModal();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    VRODOS.ui.sceneList = sceneListUi;
    VRODOS.ui.bindSceneListControls = function() {
        return sceneListUi.bind();
    };
})();
