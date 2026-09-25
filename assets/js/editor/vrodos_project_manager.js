document.addEventListener('DOMContentLoaded', () => {
    // Move modal wrapper to body root to ensure it breaks out of any clipping containers (WP theme wrappers)
    const modalWrapper = document.getElementById('vrodos-modal-wrapper');
    if (modalWrapper && modalWrapper.parentElement !== document.body) {
        document.body.appendChild(modalWrapper);
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        lucide.createIcons();
    }

	const projectManager = document.getElementById('vrodos-project-manager');
    if (!projectManager) {
        return;
    }

	const initialProjectSource = window.vrodosProjectManagerInitialSource === 'immerse' ? 'immerse' : 'vrodos';
	setupProjectSourceTabs();
	VRODOS.api.selectProjectSource(initialProjectSource);
	VRODOS.api.fetchAllProjectsAndAddToDOM(VRODOS.config.current_user_id, VRODOS.config.parameter_Scenepass, -1, true, initialProjectSource);
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
		const description = document.getElementById('project-description-label');
		if (description) description.innerHTML = content;
    }
    loadProjectTypeDescription();

    // Add event listener for the project type radio buttons
    document.querySelectorAll('input[name="projectTypeRadio"]').forEach(radio => {
        radio.addEventListener('change', loadProjectTypeDescription);
    });

	const createProjectButton = document.getElementById('createNewProjectBtn');
	if (createProjectButton) {
		createProjectButton.addEventListener('click', () => {
        // Title of game project
        const titleEl = document.getElementById('title');
        const title_vrodos_project = titleEl ? titleEl.value : "";

        if (title_vrodos_project && title_vrodos_project.length > 2) {
            const checkedRadio = document.querySelector('input[name="projectTypeRadio"]:checked');
            const project_type = checkedRadio ? checkedRadio.value : 'archaeology_games';

            // CREATE THE PROJECT !
            VRODOS.api.createProject(title_vrodos_project, project_type, VRODOS.config.current_user_id, VRODOS.config.parameter_Scenepass);

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
	}

    function setUseCasePillState(button, selected) {
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        button.classList.toggle('tw-border-primary/30', selected);
        button.classList.toggle('tw-bg-primary/10', selected);
        button.classList.toggle('tw-text-primary', selected);
        button.classList.toggle('tw-border-base-300', !selected);
        button.classList.toggle('tw-bg-base-100', !selected);
        button.classList.toggle('tw-text-base-content/40', !selected);
    }

    // Delegated event listener for project actions (filtering, deletion, rename)
    const projectList = document.getElementById('ExistingProjectsDivDOM');
    projectList.addEventListener('click', (e) => {
        const useCasePill = e.target.closest('.vrodos-use-case-all, .vrodos-use-case-toggle');
        if (useCasePill) {
            const allPill = projectList.querySelector('.vrodos-use-case-all');
            const useCasePills = Array.from(projectList.querySelectorAll('.vrodos-use-case-toggle'));
            if (useCasePill === allPill) {
                useCasePills.forEach(pill => setUseCasePillState(pill, false));
                setUseCasePillState(allPill, true);
            } else {
                const wasAllSelected = allPill.getAttribute('aria-pressed') === 'true';
                setUseCasePillState(allPill, false);
                if (wasAllSelected) {
                    useCasePills.forEach(pill => setUseCasePillState(pill, pill === useCasePill));
                } else {
                    setUseCasePillState(useCasePill, useCasePill.getAttribute('aria-pressed') !== 'true');
                }
                if (!useCasePills.some(pill => pill.getAttribute('aria-pressed') === 'true')) {
                    setUseCasePillState(allPill, true);
                }
            }
            const showAll = allPill.getAttribute('aria-pressed') === 'true';
            useCasePills.forEach(pill => {
                const group = document.getElementById(`vrodos-use-case-group-${pill.dataset.useCaseGroup}`);
                if (group) group.hidden = !showAll && pill.getAttribute('aria-pressed') !== 'true';
            });
            return;
        }

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

	const deleteProjectButton = document.getElementById('deleteProjectBtn');
	if (deleteProjectButton) {
		deleteProjectButton.addEventListener('click', () => {
			document.getElementById('delete-dialog-progress-bar').style.display = '';
			VRODOS.api.deleteProject(dialog.dataset.projectId, dialog, VRODOS.config.current_user_id, VRODOS.config.parameter_Scenepass);
		});
	}

	const cancelDeleteProjectButton = document.getElementById('canceldeleteProjectBtn');
	if (cancelDeleteProjectButton) {
		cancelDeleteProjectButton.addEventListener('click', () => {
			document.getElementById('delete-dialog-progress-bar').style.display = 'none';
			dialog.close();
		});
	}

    function setupProjectSourceTabs() {
        const tabs = Array.from(document.querySelectorAll('.vrodos-project-source-tab'));

        VRODOS.api.selectProjectSource = function(source) {
            const normalizedSource = source === 'immerse' ? 'immerse' : 'vrodos';
            VRODOS.api.currentProjectSource = normalizedSource;

            tabs.forEach(tab => {
                const isActive = tab.dataset.projectSource === normalizedSource;
                tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
                tab.classList.toggle('tw-bg-base-100', isActive);
                tab.classList.toggle('tw-shadow-sm', isActive);
                tab.classList.toggle('tw-btn-ghost', !isActive);
            });
        };

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const source = tab.dataset.projectSource === 'immerse' ? 'immerse' : 'vrodos';
                if (source === VRODOS.api.currentProjectSource) return;

                VRODOS.api.selectProjectSource(source);
                VRODOS.api.fetchAllProjectsAndAddToDOM(
                    VRODOS.config.current_user_id,
                    VRODOS.config.parameter_Scenepass,
                    -1,
                    false,
                    source
                );
            });
        });
    }

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

            indicator.textContent = readContainerCount('vrodos-list-projects-container') || '0';
        }

        if (observerRoot) {
            new MutationObserver(() => setTimeout(updateCountIndicator, 0)).observe(observerRoot, {
                childList: true,
                subtree: true
            });
        }
    }

});
