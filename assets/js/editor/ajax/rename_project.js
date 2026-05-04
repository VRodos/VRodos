/**
 * Rename Project AJAX
 */
VRODOS.api.renameProject = function(projectId, newTitle, onComplete) {
    fetch(vrodos_project_manager_data.isAdmin == "back" ? 'admin-ajax.php' : my_ajax_object_creategame.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            'action': 'vrodos_rename_project_action',
            'project_id': projectId,
            'project_title': newTitle
        })
    })
    .then(response => response.text())
    .then(result => {
        if (onComplete) onComplete(true, result);
    })
    .catch(err => {
        console.error("Error renaming project:", err);
        if (onComplete) onComplete(false, err);
    });
}

VRODOS.api.enterEditMode = function(gameId) {
    const titleEl = document.getElementById(`${gameId}-title`);
    const inputEl = document.getElementById(`${gameId}-title-input`);
    const editBtn = document.querySelector(`.vrodos-rename-project-btn[data-game-id="${gameId}"]`);
    const actionsEl = document.getElementById(`${gameId}-rename-actions`);

    if (titleEl && inputEl && editBtn && actionsEl) {
        titleEl.classList.add('tw-hidden');
        inputEl.classList.remove('tw-hidden');
        editBtn.classList.add('tw-hidden');
        actionsEl.classList.remove('tw-hidden');
        inputEl.focus();
        inputEl.select();

        // Add temporary listeners for Enter and Escape
        const handleKeys = (e) => {
            if (e.key === 'Enter') {
                VRODOS.api.saveRename(gameId);
                inputEl.removeEventListener('keydown', handleKeys);
            } else if (e.key === 'Escape') {
                VRODOS.api.exitEditMode(gameId);
                inputEl.removeEventListener('keydown', handleKeys);
            }
        };
        inputEl.addEventListener('keydown', handleKeys);
    }
}

VRODOS.api.exitEditMode = function(gameId) {
    const titleEl = document.getElementById(`${gameId}-title`);
    const inputEl = document.getElementById(`${gameId}-title-input`);
    const editBtn = document.querySelector(`.vrodos-rename-project-btn[data-game-id="${gameId}"]`);
    const actionsEl = document.getElementById(`${gameId}-rename-actions`);

    if (titleEl && inputEl && editBtn && actionsEl) {
        titleEl.classList.remove('tw-hidden');
        inputEl.classList.add('tw-hidden');
        editBtn.classList.remove('tw-hidden');
        actionsEl.classList.add('tw-hidden');
        inputEl.value = titleEl.textContent; // Reset input to current title
    }
}

VRODOS.api.saveRename = function(gameId) {
    const titleEl = document.getElementById(`${gameId}-title`);
    const inputEl = document.getElementById(`${gameId}-title-input`);
    const newTitle = inputEl.value.trim();

    if (newTitle && newTitle !== titleEl.textContent) {
        // Disable input while saving
        inputEl.disabled = true;
        
        VRODOS.api.renameProject(gameId, newTitle, (success, result) => {
            inputEl.disabled = false;
            if (success) {
                titleEl.textContent = result;
                // Also update data attribute on delete button if it exists
                const deleteBtn = document.querySelector(`.vrodos-delete-project-btn[data-game-id="${gameId}"]`);
                if (deleteBtn) deleteBtn.dataset.gameTitle = result;
                VRODOS.api.exitEditMode(gameId);
            } else {
                alert("Failed to rename project. Please try again.");
                inputEl.focus();
            }
        });
    } else {
        VRODOS.api.exitEditMode(gameId);
    }
}
