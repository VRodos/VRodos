document.addEventListener('DOMContentLoaded', function() {
    // Move modal wrapper to body root to ensure it breaks out of any clipping containers (WP theme wrappers)
    const modalWrapper = document.getElementById('vrodos-modal-wrapper');
    if (modalWrapper && modalWrapper.parentElement !== document.body) {
        document.body.appendChild(modalWrapper);
    }

    window.mdc.autoInit();
    lucide.createIcons();
    fetchAllProjectsAndAddToDOM(vrodos_project_manager_data.current_user_id, vrodos_project_manager_data.parameter_Scenepass);

    // Modals (DaisyUI)
    let dialog = document.getElementById('delete-dialog');
    let dialogCollaborators = document.getElementById('collaborate-dialog');

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

        dialogTitle.innerHTML = "Delete " + projectTitle + "?";
        dialogDescription.innerHTML = "Are you sure you want to delete this project? There is no Undo functionality once you delete it.";
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

    // ------- Collaborators -------------------
    function collaborateProject(project_id) {
        let dialogTitle = document.getElementById("collaborate-dialog-title");
        let dialogDescription = document.getElementById("collaborate-dialog-description");
        
        let projectTitleElement = document.getElementById(project_id+"-title");
        let projectTitle = projectTitleElement ? projectTitleElement.innerText.trim() : "this project";

        dialogTitle.innerHTML = "Collaborators on " + projectTitle;

        dialogDescription.innerHTML = "Manage who has access to <span class=\"tw-font-bold tw-text-slate-700\">" + projectTitle + "</span>. For example 'mail1@gmail.com'";

        dialogCollaborators.project_id = project_id;

        //jQuery('.chips-initial').material_chip({data: [], placeholder: 'Your collaborator email'});

        // Fetch collaborators and insert to "textarea-collaborators"
        vrodos_fetchCollabsAjax(project_id);
    }

    jQuery('#updateCollabsBtn').click( function (e) {

        var allChipsContainers = document.querySelectorAll('.chips');
        var singleChipContainer = M.Chips.getInstance(allChipsContainers[0]);

        // Get collabs emails
        var currCollabsEmails = singleChipContainer.getData();

        console.log("currCollabsEmails1", currCollabsEmails);

        currCollabsEmails = currCollabsEmails.map(function(elem){return elem.tag}).join(";");

        console.log("currCollabsEmails2", currCollabsEmails);

        // 2. Update ids of collaborators ;15;5;4;
        vrodos_updateCollabsAjax(dialogCollaborators.project_id, dialogCollaborators, currCollabsEmails);
    });

    jQuery('#cancelCollabsBtn').click( function (e) {
        dialogCollaborators.close();
    });
});
