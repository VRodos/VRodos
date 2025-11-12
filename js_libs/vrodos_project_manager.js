document.addEventListener('DOMContentLoaded', function() {
    window.mdc.autoInit();

    fetchAllProjectsAndAddToDOM(vrodos_project_manager_data.current_user_id, vrodos_project_manager_data.parameter_Scenepass);

    // Delete Dialogue
    let dialog = new mdc.dialog.MDCDialog(document.querySelector('#delete-dialog'));
    dialog.focusTrap_.deactivate();

    // Collaborators Dialogue
    let dialogCollaborators = new mdc.dialog.MDCDialog(document.querySelector('#collaborate-dialog'));
    dialogCollaborators.focusTrap_.deactivate();

    // Descriptions for each Project
    function loadProjectTypeDescription() {
        let checked = document.querySelector('input[name="projectTypeRadio"]:checked').value;
        let content = '';
        if (checked === 'archaeology_games') {
            content = "Design a virtual tour of your own";
        } else if (checked === 'vrexpo_games'){
            content = "Create a VR expo space";
        } else if (checked === 'virtualproduction_games'){
            content = "Create a Multiuser Virtual Production project";
        }
        document.getElementById('project-description-label').innerHTML = content;
    }
    loadProjectTypeDescription();

    // Add event listener for the project type radio buttons
    document.getElementById('project-type-radio-list').addEventListener('click', loadProjectTypeDescription);

    jQuery('#createNewProjectBtn').click( function (e) {
        // Title of game project
        let title_vrodos_project = document.getElementById('title').value;
        if (title_vrodos_project.length > 2) {
            let project_type = document.querySelector('input[name="projectTypeRadio"]:checked').value;

            // CREATE THE PROJECT !
            vrodos_createProjectAjax(title_vrodos_project, project_type, vrodos_project_manager_data.current_user_id, vrodos_project_manager_data.parameter_Scenepass);
            document.getElementById('createNewProjectBtn').style.display = 'none';
            document.getElementById('create-game-progress-bar').style.display = '';
        }
    });

    function deleteProject(id) {
        let dialogTitle = document.getElementById("delete-dialog-title");
        let dialogDescription = document.getElementById("delete-dialog-description");
        let projectTitle = document.getElementById(id+"-title").innerHTML;
        projectTitle = projectTitle.substring(0, projectTitle.indexOf('<'));
        projectTitle = projectTitle.trim();

        dialogTitle.innerHTML = "<b>Delete " + projectTitle+"?</b>";
        dialogDescription.innerHTML = "Are you sure you want to delete your project '" +projectTitle + "'? There is no Undo functionality once you delete it.";
        dialog.id = id;
        dialog.show();
    }

    jQuery('#deleteProjectBtn').click( function (e) {
        jQuery('#delete-dialog-progress-bar').show();
        vrodos_deleteGameAjax(dialog.id, dialog, vrodos_project_manager_data.current_user_id, vrodos_project_manager_data.parameter_Scenepass);
    });

    jQuery('#canceldeleteProjectBtn').click( function (e) {
        jQuery('#delete-dialog-progress-bar').hide();
        dialog.close();
    });


    // ------- Collaborators -------------------
    function collaborateProject(project_id) {
        let dialogTitle = document.getElementById("collaborate-dialog-title");
        let dialogDescription = document.getElementById("collaborate-dialog-description");
        let projectTitle = document.getElementById(project_id+"-title").innerHTML;
        projectTitle = projectTitle.substring(0, projectTitle.indexOf('<'));
        projectTitle = projectTitle.trim();

        dialogTitle.innerHTML = "<b>Collaborators on " + projectTitle+"?</b>";

        dialogDescription.innerHTML = "Make your selection for  '" +projectTitle + "'. For example 'mail1@gmail.com'";

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
