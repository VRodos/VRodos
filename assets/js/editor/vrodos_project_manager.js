document.addEventListener('DOMContentLoaded', () => {
    // Move modal wrapper to body root to ensure it breaks out of any clipping containers (WP theme wrappers)
    const modalWrapper = document.getElementById('vrodos-modal-wrapper');
    if (modalWrapper && modalWrapper.parentElement !== document.body) {
        document.body.appendChild(modalWrapper);
    }

    lucide.createIcons();
    VRODOS.api.fetchAllProjectsAndAddToDOM(vrodos_project_manager_data.current_user_id, vrodos_project_manager_data.parameter_Scenepass, -1, true);
    setupProjectCountSync();

    // Modals (DaisyUI)
    const dialog = document.getElementById('delete-dialog');

    // Descriptions for each Project
    function loadProjectTypeDescription() {
        const checked = document.querySelector('input[name="projectTypeRadio"]:checked');
        const val = checked ? checked.value : 'archaeology_games';
        let content = '';
        if (val === 'vrexpo_games') {
            content = "Create a VR expo space";
        } else if (val === 'virtualproduction_games'){
            content = "Create a Multiuser Virtual Production project";
        }
        document.getElementById('project-description-label').innerHTML = content;
    }
    loadProjectTypeDescription();

    // Add event listener for the project type radio buttons
    document.querySelectorAll('input[name="projectTypeRadio"]').forEach(radio => {
        radio.addEventListener('change', loadProjectTypeDescription);
    });

    document.getElementById('createNewProjectBtn').addEventListener('click', (e) => {
        // Title of game project
        const titleEl = document.getElementById('title');
        const title_vrodos_project = titleEl ? titleEl.value : "";

        if (title_vrodos_project && title_vrodos_project.length > 2) {
            const checkedRadio = document.querySelector('input[name="projectTypeRadio"]:checked');
            const project_type = checkedRadio ? checkedRadio.value : 'archaeology_games';

            // CREATE THE PROJECT !
            VRODOS.api.createProject(title_vrodos_project, project_type, vrodos_project_manager_data.current_user_id, vrodos_project_manager_data.parameter_Scenepass);

            // UI state updates
            document.getElementById('createNewProjectBtn').style.display = 'none';
            document.getElementById('create-game-progress-bar').style.display = '';
        } else {
            if (titleEl) {
                titleEl.focus();
                titleEl.classList.add('tw-input-error');
            }
        }
    });

    // Delegated event listener for project actions (deletion, rename)
    document.getElementById('ExistingProjectsDivDOM').addEventListener('click', (e) => {
        // Delete button
        const deleteBtn = e.target.closest('.vrodos-delete-project-btn');
        if (deleteBtn) {
            const gameId = deleteBtn.dataset.gameId;
            const gameTitle = deleteBtn.dataset.gameTitle || "this project";
            if (gameId) {
                deleteProject(gameId, gameTitle);
            }
            return;
        }

        // Rename button (Pencil)
        const renameBtn = e.target.closest('.vrodos-rename-project-btn');
        if (renameBtn) {
            const gameId = renameBtn.dataset.gameId;
            if (gameId) VRODOS.api.enterEditMode(gameId);
            return;
        }

        // Save Rename button (Check)
        const saveBtn = e.target.closest('.vrodos-save-rename-btn');
        if (saveBtn) {
            const gameId = saveBtn.dataset.gameId;
            if (gameId) VRODOS.api.saveRename(gameId);
            return;
        }

        // Cancel Rename button (X)
        const cancelBtn = e.target.closest('.vrodos-cancel-rename-btn');
        if (cancelBtn) {
            const gameId = cancelBtn.dataset.gameId;
            if (gameId) VRODOS.api.exitEditMode(gameId);
            return;
        }
    });

    function deleteProject(id, projectTitle) {
        const dialogTitle = document.getElementById("delete-dialog-title");
        const dialogDescription = document.getElementById("delete-dialog-description");

        dialogTitle.textContent = `Delete ${  projectTitle  }?`;
        dialogDescription.textContent = "Are you sure you want to delete this project? There is no Undo functionality once you delete it.";
        dialog.dataset.projectId = id;
        dialog.showModal();
    }

    document.getElementById('deleteProjectBtn').addEventListener('click', (e) => {
        document.getElementById('delete-dialog-progress-bar').style.display = '';
        VRODOS.api.deleteProject(dialog.dataset.projectId, dialog, vrodos_project_manager_data.current_user_id, vrodos_project_manager_data.parameter_Scenepass);
    });

    document.getElementById('canceldeleteProjectBtn').addEventListener('click', (e) => {
        document.getElementById('delete-dialog-progress-bar').style.display = 'none';
        dialog.close();
    });

    function setupProjectCountSync() {
        const projectRoot = document.getElementById('ExistingProjectsDivDOM');
        const observerRoot = projectRoot ? projectRoot.parentElement : null;

        function readContainerCount(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return null;

            const dataCount = container.getAttribute('data-project-count');
            if (dataCount !== null && /^\d+$/.test(dataCount)) {
                return dataCount;
            }

            return Array.from(container.children).filter(child => child.nodeType === 1).length.toString();
        }

        function updateCountIndicator() {
            const indicator = document.getElementById('projects-count-indicator');
            if (!indicator) return;

            const immerseContainer = document.getElementById('ic-immerse-projects');
            const isImmerseVisible = immerseContainer && !immerseContainer.classList.contains('tw-hidden');
            const count = (isImmerseVisible
                ? readContainerCount('ic-pm-project-container')
                : readContainerCount('vrodos-list-projects-container')) || '0';

            indicator.textContent = count;
        }

        document.addEventListener('click', (event) => {
            if (event.target.closest('.ic-pm-tab')) {
                setTimeout(updateCountIndicator, 0);
            }
        });

        document.addEventListener('change', (event) => {
            if (event.target.matches('#ic-pm-usecase-filter')) {
                setTimeout(updateCountIndicator, 0);
            }
        });

        if (observerRoot) {
            new MutationObserver(() => setTimeout(updateCountIndicator, 0)).observe(observerRoot, {
                childList: true,
                subtree: true
            });
        }
    }

});
