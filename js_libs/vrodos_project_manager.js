document.addEventListener('DOMContentLoaded', function() {
    // Move modal wrapper to body root to ensure it breaks out of any clipping containers (WP theme wrappers)
    const modalWrapper = document.getElementById('vrodos-modal-wrapper');
    if (modalWrapper && modalWrapper.parentElement !== document.body) {
        document.body.appendChild(modalWrapper);
    }

    lucide.createIcons();
    fetchAllProjectsAndAddToDOM(vrodos_project_manager_data.current_user_id, vrodos_project_manager_data.parameter_Scenepass, -1, true);

    // Modals (DaisyUI)
    let dialog = document.getElementById('delete-dialog');

    // Descriptions for each Project
    function loadProjectTypeDescription() {
        let checked = document.querySelector('input[name="projectTypeRadio"]:checked');
        let val = checked ? checked.value : 'archaeology_games';
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

    jQuery('#createNewProjectBtn').click( function (e) {
        // Title of game project
        let titleEl = document.getElementById('title');
        let title_vrodos_project = titleEl ? titleEl.value : "";
        
        if (title_vrodos_project && title_vrodos_project.length > 2) {
            let checkedRadio = document.querySelector('input[name="projectTypeRadio"]:checked');
            let project_type = checkedRadio ? checkedRadio.value : 'archaeology_games';

            // CREATE THE PROJECT !
            vrodos_createProjectAjax(title_vrodos_project, project_type, vrodos_project_manager_data.current_user_id, vrodos_project_manager_data.parameter_Scenepass);
            
            // UI state updates
            document.getElementById('createNewProjectBtn').style.display = 'none';
            document.getElementById('create-game-progress-bar').style.display = '';
        } else {
            if (titleEl) {
                titleEl.focus();
                titleEl.classList.add('d-input-error');
            }
        }
    });

    // Delegated event listener for project deletion
    jQuery('#ExistingProjectsDivDOM').on('click', '.vrodos-delete-project-btn', function() {
        let gameId = jQuery(this).data('game-id');
        let gameTitle = jQuery(this).data('game-title') || "this project";
        if (gameId) {
            deleteProject(gameId, gameTitle);
        }
    });

    function deleteProject(id, projectTitle) {
        let dialogTitle = document.getElementById("delete-dialog-title");
        let dialogDescription = document.getElementById("delete-dialog-description");

        dialogTitle.textContent = "Delete " + projectTitle + "?";
        dialogDescription.textContent = "Are you sure you want to delete this project? There is no Undo functionality once you delete it.";
        dialog.dataset.projectId = id;
        dialog.showModal();
    }

    jQuery('#deleteProjectBtn').click( function (e) {
        jQuery('#delete-dialog-progress-bar').show();
        vrodos_deleteGameAjax(dialog.dataset.projectId, dialog, vrodos_project_manager_data.current_user_id, vrodos_project_manager_data.parameter_Scenepass);
    });

    jQuery('#canceldeleteProjectBtn').click( function (e) {
        jQuery('#delete-dialog-progress-bar').hide();
        dialog.close();
    });

});
