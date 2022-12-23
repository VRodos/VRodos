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
		case 'Archaeology':
			$project_type_icon = "account_balance";
			break;
		case 'Energy':
			$project_type_icon = "power";
			break;
		case 'Chemistry':
			$project_type_icon = "bubble_chart";
			break;
		case 'vrexpo':
			$project_type_icon = "public";
			break;
		case 'virtualproduction':
			$project_type_icon = "theaters";
			break;
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
            '</i>'.
//                $project_type.
            '<i class="material-icons mdc-theme--text-icon-on-dark chevronRight">chevron_right</i>'.
                $project_post->post_title.
            '<i class="material-icons mdc-theme--text-icon-on-dark chevronRight">chevron_right</i>'.
        '</div>'.

        //Title Name at breadcrumps
        '<input id="sceneTitleInput" name="sceneTitleInput"'.
               ' title="Scene title" placeholder="Scene title"'.
               ' value="'.$scene_post->post_title.'" type="text"'.
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

function panelsAnalytics($project_type, $project_saved_keys){
    
      // Panels 2,3 and 4 are Analytics
	  if ( $project_type === "Energy" || $project_type === "Chemistry" ) {  ?>

            <div class="panel" id="panel-2" role="tabpanel" aria-hidden="true">
                <div id="analyticsIframeFallback" class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12"></div>
                <div id="analyticsIframeContainer">
                    <iframe id="analyticsIframeContent"></iframe>
                </div>
            </div>

			<?php if($project_saved_keys['expID'] != ''){ ?>
                <div class="panel" id="panel-3" role="tabpanel" aria-hidden="true">
                    <div id="atRiskIframeContainer" style="position: relative; overflow: hidden; padding-top: 180%;">
                        <iframe id="atRiskIframeContent" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"></iframe>
                    </div>
                </div>

     <?php } ?>
     
     <?php if($project_type === "Chemistry"){ ?>
                <div class="panel" id="panel-4" role="tabpanel" aria-hidden="true">
                    <div style="position: relative; overflow: hidden; padding-top: 100%;">
                        <iframe id="ddaIframeContent" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"></iframe>
                    </div>
                </div>
	    <?php } ?>

	<?php }
 
}
?>
<?php

// For Wind Energy show scenes info in edit-scene
function sceneDetailsInfo($project_type){

      if($project_type === "Energy") { ?>
           <div class="mdc-layout-grid">
                <div class="mdc-layout-grid__inner mdc-theme--text-primary-on-light">

                     <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-4">
                        <h2 class="mdc-typography--title">Average wind speed</h2>
                        <p class="mdc-typography--subheading2">Mountains: 10 m/s</p>
                        <p class="mdc-typography--subheading2">Fields: 8.5 m/s</p>
                        <p class="mdc-typography--subheading2">Seashore: 7.5 m/s</p>
                     </div>

                    <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-4">
                        <h2 class="mdc-typography--title">Access cost</h2>
                        <p class="mdc-typography--subheading2">Mountains: 3 $</p>
                        <p class="mdc-typography--subheading2">Fields: 2 $</p>
                        <p class="mdc-typography--subheading2">Seashore: 1 $</p>
                    </div>

                    <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-4">
                        <h2 class="mdc-typography--title">Turbine Types</h2>
                        <p class="mdc-typography--subheading2">Mountains ( Wind class I ): A, B, C</p>
                        <p class="mdc-typography--subheading2">Fields ( Wind class II ): D, E, F</p>
                        <p class="mdc-typography--subheading2">Seashore ( Wind class III ): G, H, I</p>
                    </div>

                </div>
           </div>
         <?php }
}
?>
