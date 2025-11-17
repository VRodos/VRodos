<?php
/**
 * The template for displaying the Assets List page.
 *
 * @package VRodos
 */

// Prepare data for the template.
$data = VRodos_Pages_Manager::prepare_assets_list_page_data();
extract($data);

get_header();
?>

<?php if ( !$is_user_logged_in || !current_user_can('administrator') ) { ?>

    <!-- if user not logged in, then prompt to log in -->
    <div class="DisplayBlock CenterContents">
        <i style="font-size: 64px; padding-top: 80px;" class="material-icons mdc-theme--text-icon-on-background">account_circle</i>
        <p class="mdc-typography--title"> Please <a class="mdc-theme--secondary"
                                                    href="<?php echo wp_login_url( get_permalink() ); ?>">login</a> to use platform</p>
        <p class="mdc-typography--title"> Or
            <a class="mdc-theme--secondary" href="<?php echo wp_registration_url(); ?>">register</a>
            if you don't have an account</p>
    </div>

    <hr class="WhiteSpaceSeparator">

<?php } else { ?>

    <!-- Display assets Grid-->
    <div class="assets-list-front mdc-layout-grid">

        <a title="Back to all Projects" style="margin-left:10px; margin-right:10px" href="<?php echo $go_back_to_all_projects_link; ?>"><i class="material-icons mdc-theme--text-primary sceneArrowBack">arrow_back</i></a>

        <span class="mdc-typography--display1 mdc-theme--text-primary-on-background" style="display:inline-table;margin-bottom:20px;">Assets Manager</span>

        <br />
        <p class="mdc-typography--body1 mdc-theme--text-primary-on-background "><?php echo $help_message; ?></p>

        <div class="mdc-layout-grid__inner grid-system-custom">

            <!-- Card to add asset -->
            <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-3" style="" >
                <div class="asset-shared-thumbnail mdc-card mdc-theme--background"
                     style="height:100%;min-height:120px;position:relative;background:<?php echo $single_project_asset_list? 'lightgreen': 'orangered';?>">
                    <a href="<?php echo $link_to_add; ?>">
                        <i class="addAssetCardIcon material-icons">add_circle</i>
                        <span class="addAssetCardWords"><?php echo $single_project_asset_list? 'Private Asset': 'Shared Asset';?></span>
                    </a>
                </div>
            </div>

            <!-- Each Asset -->
            <?php foreach ($assets as $asset) {  ?>
                <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-3" style="position:relative">
                    <div class="asset-shared-thumbnail mdc-card mdc-theme--background" id="<?php echo $asset['asset_id']; ?>">

                        <!-- Edit url -->
                        <a class="editasseturl" href="<?php echo $asset['edit_url']; ?>">
                            <?php if ($asset['screenshot_path']){ ?>
                                <img src="<?php echo $asset['screenshot_path']; ?>" class="asset-shared-thumbnail">
                            <?php } else { ?>
                                <div style="min-height: 226px;width:70%" class="DisplayBlock mdc-theme--secondary-bg CenterContents">
                                    <i style="font-size: 64px; padding-top: 80px;" class="material-icons mdc-theme--text-icon-on-background">insert_photo</i>
                                </div>
                            <?php } ?>
                        </a>

                        <!-- Title -->
                        <h1 class="assetsListCardTitle mdc-card__title mdc-typography--title" style="">
                            <a class="mdc-theme--secondary"
                               href="<?php echo $asset['title_url']; ?>"><?php echo $asset['asset_name'];?></a>
                        </h1>

                        <!-- Author -->
                        <p class="sharedAssetsUsername mdc-typography--caption">
                            <img style="width:20px;height:20px;border-radius: 50%;vertical-align:middle" src="<?php echo get_avatar_url($asset['author_id']);?>">
                            <a href="<?php echo $asset['author_url']; ?>"
                               style="color:white; mix-blend-mode: difference;">
                                <?php echo $asset['author_displayname']; ?>
                            </a>
                        </p>

                        <!-- DELETE BUTTON -->
                        <?php if( $is_user_admin || ($user_id == $asset['author_id'])) {  ?>
                            <a id="deleteAssetBtn" data-mdc-auto-init="MDCRipple" title="Delete asset" style="background: rgba(214,30,30,0.7);"
                               class="deleteAssetListButton mdc-button mdc-button--compact mdc-card__action"
                               onclick="vrodos_deleteAssetAjax(<?php echo $asset['asset_id'];?>,'<?php echo $joker_project_slug ?>',<?php echo $asset['is_cloned'];?>)"
                            ><i class="material-icons mdc-theme--text-hint-on-light">delete</i></a>
                        <?php } ?>

                        <!-- Parent Game -->
                        <?php if ($asset['is_joker']=='true') { ?>
                            <span class="sharedAssetsIndicator mdc-typography--subheading1" style="color:black; background: rgba(184,248,184,0.6);">Shared</span>
                        <?php } else { ?>
                            <span class="sharedAssetsIndicator mdc-typography--subheading1"
                                  style="color:black; background: rgba(250,250,210,0.6);">
                            <?php echo "@".$asset['asset_parent_game']; ?></span>
                        <?php } ?>

                        <div class="phonering-alo-phone phonering-alo-green phonering-alo-show" style="display:none" id="phonering-<?php echo $asset['asset_name'] ?>">
                            <div class="phonering-alo-ph-circle"></div>
                            <div class="phonering-alo-ph-circle-fill"></div>
                            <a href="<?php echo $asset['direct_call_url']; ?>"
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

<?php } ?>

<?php get_footer(); ?>
