<?php

if ( get_option('permalink_structure') ) { $perma_structure = true; } else {$perma_structure = false;}
if( $perma_structure){$parameter_Scenepass = '?vrodos_scene=';} else{$parameter_Scenepass = '&vrodos_scene=';}
if( $perma_structure){$parameter_pass = '?vrodos_game=';} else{$parameter_pass = '&vrodos_game=';}
$parameter_assetpass = $perma_structure ? '?vrodos_asset=' : '&vrodos_asset=';

$joker_project_id = get_page_by_path( 'archaeology-joker', OBJECT, 'vrodos_game' )->ID;

//if( isset($_GET['vrodos_asset']) ) {
//	$asset_inserted_id = sanitize_text_field( intval( $_GET['vrodos_asset'] ));
//	$asset_post = get_post($asset_inserted_id);
//	if($asset_post->post_type == 'vrodos_asset3d') {
//		$create_new = 0;
//		$asset_checked_id = $asset_inserted_id;
//	}
//}

$joker_project_post = get_post($joker_project_id);
$joker_project_slug = $joker_project_post->post_name;

$isAdmin = is_admin() ? 'back' : 'front';
echo '<script>';
echo 'isAdmin="'.$isAdmin.'";'; // This variable is used in the request_game_assemble.js
echo '</script>';

$isUserloggedIn = is_user_logged_in();
$current_user = wp_get_current_user();


$login_username = $current_user->user_login;

$isUserAdmin = $isUserloggedIn && current_user_can('administrator');


$pluginpath = dirname (plugin_dir_url( __DIR__  ));
$pluginpath = str_replace('\\','/',$pluginpath);

//--Uploads/myGameProjectUnity--
$upload_dir = wp_upload_dir()['basedir'];
$upload_dir = str_replace('\\','/',$upload_dir);

// DELETE ASSET AJAX
wp_enqueue_script( 'ajax-script_deleteasset', $pluginpath.'/js_libs/ajaxes/delete_asset.js', array('jquery') );
wp_localize_script( 'ajax-script_deleteasset', 'my_ajax_object_deleteasset',
    array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
);

// ajax php admin url
wp_enqueue_script( 'ajax-vrodos_content_interlinking_request',
    $pluginpath.'/js_libs/content_interlinking_commands/content_interlinking.js', array('jquery') );

wp_localize_script( 'ajax-vrodos_content_interlinking_request', 'my_ajax_object_fetch_content',
    array( 'ajax_url' => admin_url( 'admin-ajax.php' ), null )
);



//Get 'parent-game' taxonomy with the same slug as Game (in order to show scenes that belong here)
//$allScenePGame = get_term_by('slug', $gameSlug, 'vrodos_scene_pgame');
//if ($allScenePGame)
//    $parent_project_id_as_term_id = $allScenePGame->term_id;


$editgamePage = vrodos_getEditpage('game');
$newAssetPage = vrodos_getEditpage('asset');

//$urlforAssetEdit = esc_url( get_permalink($newAssetPage[0]->ID) . $parameter_pass . $project_id . '&vrodos_scene=' .$scene_id . '&vrodos_asset=' ); // . asset_id

get_header();
?>



<?php

$user_id = get_current_user_id();
$current_project = '';

$single_project_asset_list = false;
if(isset($_GET['vrodos_project_id'])) {

    $single_project_asset_list = true;
    $current_game_project_id = $_GET['vrodos_project_id'];
    $current_game_project_post = get_post($current_game_project_id);
    $current_game_project_slug = $current_game_project_post->post_name;
    $user_games_slugs = [$current_game_project_slug];
} else {
    $user_games_slugs = vrodos_get_user_game_projects($user_id, $isUserAdmin);
}

$assets = get_assets($user_games_slugs);

if (!$isUserloggedIn)
    $link_to_add = wp_login_url();
else if ($isUserloggedIn && $single_project_asset_list)
    $link_to_add = esc_url( get_permalink($newAssetPage[0]->ID) . $parameter_pass . $current_game_project_id .'&singleproject=true&preview=0&#EnglishEdit');
else if ($isUserAdmin && !$single_project_asset_list)
    $link_to_add = esc_url( get_permalink($newAssetPage[0]->ID) . $parameter_pass . $joker_project_id .'&preview=0#EnglishEdit');
else if ($isUserloggedIn)
    $link_to_add = esc_url( get_permalink($newAssetPage[0]->ID) . $parameter_pass . $joker_project_id .'&preview=0#EnglishEdit');


$link_to_edit = home_url().'/vrodos-asset-editor-page/?';

if ($single_project_asset_list)
    $link_to_edit = $link_to_edit. "singleproject=true&";

?>


<!-- Display assets Grid-->
<div class="assets-list-front mdc-layout-grid">

    <span class="mdc-typography--display1 mdc-theme--text-primary-on-background" style="display:inline-table;margin-bottom:20px;">Assets Manager</span>

    <?php
    if ($isUserloggedIn){ ?>

        <span style="float:right; margin-right:5px; display:inline-table;margin-top:10px">Welcome,
        <a href="<?php echo home_url(); ?>/account/" style="color:dodgerblue">
              <?php echo $current_user->display_name;?>
        </a>
        </span>

        <?php

        if( $single_project_asset_list){
            $helpMessage = 'A list of your private Assets belonging to the project <b>'.$current_game_project_post->post_title.'</b>.';
        } else {
            $helpMessage = 'Add a Shared Asset here. If you want it to be private, make a project and add the asset there.';
        }
    } else {
        $helpMessage = 'Login to a) add a Shared Asset or b) to create a Project and add your private Assets there';
    }
    ?>
    <br />
    <p><?php echo $helpMessage ?></p>

    <?php if ($single_project_asset_list){ ?>
        <!--<span class="mdc-theme--text-primary-on-background" style="display:inline-table;margin-bottom:20px;">for <?php /*echo $current_game_project_post->post_title;*/?></span>-->
    <?php } else if (!$isUserloggedIn) { ?>
        <span class="mdc-theme--text-primary-on-background" style="display:inline-table;margin-bottom:20px;">for <?php echo $isUserloggedIn?" private": ""; ?> assets </span>
    <?php } else if ($isUserloggedIn) { ?>
        <span class="mdc-theme--text-primary-on-background" style="display:inline-table;margin-bottom:20px;">for <?php echo $isUserloggedIn?" private": ""; ?> assets in own projects</span>
    <?php } ?>

    <div class="mdc-layout-grid__inner grid-system-custom">


        <!-- Card to add asset -->

        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-3" style="" >
            <div class="asset-shared-thumbnail mdc-card mdc-theme--background"
                 style="height:100%;min-height:120px;position:relative;background:<?php echo $single_project_asset_list? 'lightgreen': 'orangered';?>">
                <a href="<?php echo $link_to_add; ?>">
                    <i class="addAssetCardIcon material-icons" style="<?php if(!$isUserloggedIn){?> filter:invert(30%) <?php }?>">add_circle</i>
                    <span class="addAssetCardWords" style="<?php if(!$isUserloggedIn){?> filter:invert(30%) <?php }?>"><?php echo $single_project_asset_list? 'Private Asset': 'Shared Asset';?></span>
                </a>
            </div>
        </div>



        <!-- Each Asset -->
        <?php foreach ($assets as $asset) {    ?>

            <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-3" style="position:relative">

                <div class="asset-shared-thumbnail mdc-card mdc-theme--background" id="<?php echo $asset['assetid']; ?>">

                    <?php $pGameId= get_page_by_path($asset['assetParentGameSlug'], OBJECT, 'vrodos_game')->ID; ?>

                    <!-- Edit url -->
                    <a class="editasseturl" href="<?php echo $link_to_edit.'vrodos_game='.$pGameId.'&vrodos_asset='.$asset['assetid'].'&preview='.(!$isUserAdmin && ($user_id != $asset['author_id'])).'#English'; ?>">
                        <?php if ($asset['screenImagePath']){ ?>
                            <img src="<?php echo $asset['screenImagePath']; ?>" class="asset-shared-thumbnail">
                        <?php } else { ?>
                            <div style="min-height: 226px;width:70%" class="DisplayBlock mdc-theme--secondary-bg CenterContents">
                                <i style="font-size: 64px; padding-top: 80px;" class="material-icons mdc-theme--text-icon-on-background">insert_photo</i>
                            </div>
                        <?php } ?>
                    </a>

                    <!-- Title -->
                    <h1 class="assetsListCardTitle mdc-card__title mdc-typography--title" style="">
                        <a class="mdc-theme--secondary"
                           href="<?php echo home_url().'/vrodos-asset-editor-page/?vrodos_game='.$pGameId.
                               '&vrodos_asset='.$asset['assetid'].'#English';
                           ?>"><?php echo $asset['assetName'];?></a>
                    </h1>

                    <!-- Author -->
                    <p class="sharedAssetsUsername mdc-typography--caption">
                        <img style="width:20px;height:20px;border-radius: 50%;vertical-align:middle" src="<?php echo get_avatar_url($asset['author_id']);?>">
                        <a href="<?php echo home_url().'/user/'.$asset['author_username']; ?>"
                           style="color:white; mix-blend-mode: difference;">
                            <?php echo $asset['author_displayname']; ?>
                        </a>
                    </p>


                    <!-- Category -->
                    <!--                        <p class="assetsListCardCategory mdc-card__title mdc-typography--body1">-->
                    <!--                            --><?php //echo $asset['categoryName'];?>
                    <!--                        </p>-->

                    <!-- DELETE BUTTON -->
                    <?php
                    // For joker assets, If the user is not administrator he should not be able to delete or edit them.
                    if( $isUserAdmin || ($user_id == $asset['author_id'])) {  ?>

                        <a id="deleteAssetBtn" data-mdc-auto-init="MDCRipple" title="Delete asset" style="background: rgba(214,30,30,0.7);"
                           class="deleteAssetListButton mdc-button mdc-button--compact mdc-card__action"
                           onclick="vrodos_deleteAssetAjax(<?php echo $asset['assetid'];?>,'<?php echo $joker_project_slug ?>',<?php echo $asset['isCloned'];?>)"
                        ><i class="material-icons mdc-theme--text-hint-on-light">delete</i></a>

                    <?php } ?>

                    <!-- Parent Game -->
                    <?php if ($asset['isJoker']=='true') { ?>
                        <span class="sharedAssetsIndicator mdc-typography--subheading1" style="color:black; background: rgba(184,248,184,0.6);">Shared</span>
                    <?php } else { ?>
                        <span class="sharedAssetsIndicator mdc-typography--subheading1"
                              style="color:black; background: rgba(250,250,210,0.6);">
                            <?php echo "@".$asset['assetParentGame']; ?></span>
                    <?php } ?>


                    <!-- Phone Ring -->

                    <!-- id = "phonering-Scladina terrain" -->

                    <div class="phonering-alo-phone phonering-alo-green phonering-alo-show" style="display:none" id="phonering-<?php echo $asset['assetName'] ?>">
                        <div class="phonering-alo-ph-circle"></div>
                        <div class="phonering-alo-ph-circle-fill"></div>
                        <a href="<?php echo home_url().'/vrodos-asset-editor-page/?vrodos_game='.$pGameId.'&vrodos_scene=&vrodos_asset='.$asset['assetid'].'&preview=1&directcall=1&#English';?>"
                           class="pps-btn-img" title="teleconference_ring">
                            <div class="phonering-alo-ph-img-circle"></div>
                        </a>
                    </div>



                </div>
            </div>
        <?php } ?>
    </div>

    <!--  No Assets Empty Repo-->
    <?php if ( !$assets ) :  ?>
        <div class="mdc-layout-grid__inner grid-system-custom">
            <hr class="WhiteSpaceSeparator">
            <div class="CenterContents" style="width:70%; min-height:800px;">
                <i class="material-icons mdc-theme--text-icon-on-light" style="font-size: 96px;" aria-hidden="true" title="No assets available">
                    insert_photo
                </i>
                <h3 class="mdc-typography--headline">No Assets available</h3>
                <hr class="WhiteSpaceSeparator">
            </div>
        </div>
    <?php endif; ?>
</div>



<!--<div class="sidebar-shared-assets-front">
    <?php /*get_sidebar(); */?>
</div>-->


<script type="text/javascript">

    //  vrodos_periodically_update_conf_log();
    //setInterval(vrodos_periodically_update_conf_log,3000);

    var mdc = window.mdc;
    mdc.autoInit();

    var helpDialog = document.querySelector('#help-dialog');
    if (helpDialog) {
        helpDialog = new mdc.dialog.MDCDialog(helpDialog);
        jQuery( "#helpButton" ).click(function() {
            helpDialog.show();
        });
    }

    var deleteDialog = document.querySelector('#delete-dialog');
    if (deleteDialog) {
        deleteDialog = new mdc.dialog.MDCDialog(deleteDialog);
        deleteDialog.focusTrap_.deactivate();
    }
</script>


<?php get_footer(); ?>

