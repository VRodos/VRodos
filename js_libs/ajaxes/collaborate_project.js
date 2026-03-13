/**
 * Collaborate on Project:
 *
 *  All the above are encompassed in     vrodos_collaborate_project_frontend_callback
 */
function vrodos_updateCollabsAjax(project_id, dialogCollab, collabs_emails) {

	jQuery.ajax(
		{
			url: my_ajax_object_collaborate_project.ajax_url,
			type: 'POST',
			data: {
				'action': 'vrodos_collaborate_project_action',
				'project_id': project_id,
				'collabs_emails': collabs_emails
			},
			success: function (res) {

				console.log( res );
				if (res.indexOf( "ERROR" ) != -1) {
					alert( res );
				}

				dialogCollaborators.close();

			},
			error: function (xhr, ajaxOptions, thrownError) {

				alert( "Could not add collaborators." );

				console.log( "Ajax Add collaborators: ERROR: 116" + thrownError );
			}
		}
	);

}



function vrodos_fetchCollabsAjax(project_id) {

	jQuery.ajax(
		{
			url: my_ajax_object_collaborate_project.ajax_url,
			type: 'POST',
			data: {
				'action': 'vrodos_fetch_collaborators_action',
				'project_id': project_id
			},
			success: function (res) {
				var collabs_emails = res;

				console.log( collabs_emails );

				if (collabs_emails == '') {
					jQuery( '#textarea-collaborators' ).val('');
				} else {
					jQuery( '#textarea-collaborators' ).val(collabs_emails);
				}

				dialogCollaborators.showModal();

			},
			error: function (xhr, ajaxOptions, thrownError) {
				alert( "Could not fetch collaborators." );
				console.log( "Ajax Fetch collaborators: ERROR: 116a" + thrownError );
			}
		}
	);

}
