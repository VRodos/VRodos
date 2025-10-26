<?php
/**
 * Created by PhpStorm.
 * User: tpapazoglou
 * Date: 22/5/2017
 * Time: 3:40 μμ
 */

function vrodos_project_type_icon($project_category){

    // Set game type icon
    switch($project_category){
        case 'vrexpo':
            $project_type_icon = "public";
            break;
        case 'virtualproduction':
            $project_type_icon = "theaters";
            break;
        case 'Archaeology':
        default:
            $project_type_icon = "account_balance";
            break;
    }
    return $project_type_icon;
}


function vrodos_return_project_type($id) {

    if (!$id) {
        return null;
    }

    $all_project_category = get_the_terms( $id, 'vrodos_game_type' );

    $project_category = $all_project_category ? $all_project_category[0]->name : null;

    $project_type_icon = vrodos_project_type_icon($project_category);

    $obj = new stdClass();
    $obj->string = $project_category;
    $obj->icon = $project_type_icon;

    return $obj;
}

function vrEditorBreadcrumpDisplay($scene_post, $goBackTo_AllProjects_link,
                                   $project_type, $project_type_icon, $project_post){


    $scene_title = $scene_post ? $scene_post->post_title : ' ';

    echo '<div id="sceneInfoBreadcrump" '.
        ' class="mdc-textfield mdc-theme--text-primary-on-dark mdc-form-field"'.
        ' data-mdc-auto-init="MDCTextfield">'.

        // Project Scene path at breadcrump
        ' <div id="projectNameBreadcrump" >'.
        '<a title="Back" style="margin-left:10px; margin-right:10px"'.
        ' href="'.$goBackTo_AllProjects_link.'">'.
        '<i class="material-icons mdc-theme--text-primary-on-dark sceneArrowBack">arrow_back</i>'.
        '</a>'.

        '<i class="material-icons mdc-theme--text-icon-on-dark sceneProjectTypeLabel"'.
        ' title="'.$project_type.'">'.$project_type_icon.
        '</i> '.
        '<span title="Project Title">'. $project_post->post_title.'</span>'.
        '<i class="material-icons mdc-theme--text-icon-on-dark chevronRight">chevron_right</i>'.
        '</div>'.

        // Title Name at breadcrumps
        '<input id="sceneTitleInput" name="sceneTitleInput"'.
        ' title="Scene Title" placeholder="Scene Title"'.
        ' value="'.$scene_title.'" type="text"'.
        ' class="mdc-textfield__input mdc-theme--text-primary-on-dark"'.
        ' aria-controls="title-validation-msg" minlength="3" required>'.
        '<p id="title-validation-msg"'.
        ' class="mdc-textfield-helptext mdc-textfield-helptext--validation-msg titleLengthSuggest">'.
        ' Must be at least 3 characters long'.
        '</p>'.

        // bottom line below title input
        '<div class="mdc-textfield__bottom-line"></div>'.
        '</div>';
}
?>
