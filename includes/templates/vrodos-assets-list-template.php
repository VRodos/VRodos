<?php
/**
 * The template for displaying the Assets List page.
 *
 * @package VRodos
 */

// Prepare data for the template.
$data = VRodos_Pages_Manager::prepare_assets_list_page_data();
extract( $data );

/**
 * Helper to get Lucide icon for asset category.
 * Must stay in sync with js_libs/vrodos_icons.js (single source of truth).
 */
function vrodos_get_asset_category_icon($category_slug) {
    $map = [
        'decoration'    => 'leaf',
        'walkable-surface' => 'footprints',
        'door'          => 'door-open',
        'video'         => 'clapperboard',
        'poi-imagetext' => 'image',
        'image'         => 'image-play',
        'chat'          => 'message-square',
        'poi-link'      => 'external-link',
        'assessment'    => 'clipboard-check',
    ];
    return $map[$category_slug] ?? 'package';
}

function vrodos_get_asset_preview_fallback_icon($category_slug) {
    return $category_slug === 'assessment'
        ? vrodos_get_asset_category_icon($category_slug)
        : 'image-off';
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="emerald">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assets Manager | VRodos</title>
    <?php wp_head(); ?>
</head>
<body <?php body_class('vrodos-manager-wrapper tw-overflow-hidden'); ?>>

<div id="vrodos-assets-manager" class="vrodos-main-h tw-flex tw-flex-col tw-bg-slate-50">

    <!-- Header (Unified Light Header) -->
    <header class="tw-flex-none tw-bg-white tw-border-b tw-border-slate-200 tw-px-8 tw-py-4 tw-z-[60] tw-shadow-sm">
        <div class="tw-max-w-screen-2xl tw-mx-auto tw-flex tw-items-center tw-justify-between">
            <div class="tw-flex tw-items-center tw-gap-4">
                <span class="tw-text-xl tw-font-black tw-tracking-tight tw-text-primary">VRODOS</span>
                <div class="tw-h-4 tw-w-px tw-bg-slate-200"></div>
                <div class="tw-flex tw-items-center tw-gap-3">
                    <h1 class="tw-text-xs tw-font-bold tw-text-slate-400 uppercase tw-tracking-widest">Asset Manager</h1>
                    <span class="tw-bg-slate-50 tw-text-slate-400 tw-text-[9px] tw-font-black tw-px-2 tw-py-0.5 tw-rounded-full tw-border tw-border-slate-100">
                        <?php echo count($assets); ?>
                    </span>
                </div>
            </div>

            <div class="tw-flex tw-items-center tw-gap-6">
                <!-- Compact Tooltip for Context & Tips -->
                <div class="tw-flex tw-items-center tw-gap-2 tw-bg-slate-50 tw-px-3 tw-py-1.5 tw-rounded-lg tw-border tw-border-slate-100">
                    <div class="tw-flex tw-items-center tw-gap-1.5 tw-text-[10px] tw-font-black tw-text-slate-500 tw-uppercase tw-tracking-wider">
                        <i data-lucide="database" class="tw-w-3 tw-h-3"></i>
                        <?php if ($single_project_asset_list && $current_game_project_post): ?>
                            Project: <span class="tw-text-primary tw-normal-case"><?php echo esc_html($current_game_project_post->post_title); ?></span>
                        <?php else: ?>
                            Shared
                        <?php endif; ?>
                    </div>
                    <?php if ($help_message): ?>
                        <div class="tw-w-px tw-h-3 tw-bg-slate-200"></div>
                        <div class="tw-group tw-relative tw-flex tw-items-center tw-gap-1.5 tw-cursor-help">
                             <i data-lucide="sparkles" class="tw-w-3 tw-h-3 tw-text-emerald-500"></i>
                             <span class="tw-text-[10px] tw-font-bold tw-text-emerald-700">TIP</span>
                              <!-- Tooltip Box (Rendered below the header) -->
                             <div class="tw-absolute tw-top-full tw-right-0 tw-mt-2 tw-w-64 tw-bg-slate-900 tw-text-white tw-text-[11px] tw-font-medium tw-p-3 tw-rounded-xl tw-shadow-2xl tw-opacity-0 group-hover:tw-opacity-100 tw-pointer-events-none tw-transition-opacity tw-z-[100] tw-leading-relaxed">
                                <?php echo $help_message; ?>
                                <div class="tw-absolute tw-bottom-full tw-right-4 tw-border-8 tw-border-transparent tw-border-b-slate-900"></div>
                             </div>
                        </div>
                    <?php endif; ?>
                </div>

                <a href="<?php echo get_site_url(); ?>/vrodos-project-manager-page/" class="tw-text-xs tw-font-bold tw-text-slate-400 hover:tw-text-primary transition-all">Projects Manager</a>
            </div>
        </div>
    </header>

    <main class="tw-flex-1 tw-min-h-0 tw-overflow-y-auto tw-max-w-screen-2xl tw-w-full tw-mx-auto tw-px-8 tw-py-10">

        <!-- Filter Toolbar -->
        <?php
        $categories = array_unique(array_column($assets, 'category_name'));
        ?>
        <div class="tw-mb-12 tw-flex tw-flex-wrap tw-items-center tw-gap-10 tw-bg-white/80 tw-backdrop-blur-md tw-p-3 tw-pr-8 tw-rounded-2xl tw-border tw-border-slate-200 tw-w-fit tw-shadow-sm">
            <!-- Visibility Filters -->
            <div class="tw-flex tw-items-center tw-gap-1.5 tw-p-1 tw-bg-slate-50 tw-rounded-xl">
                <button class="visibility-filter-btn tw-btn tw-btn-xs tw-btn-primary tw-rounded-lg tw-px-5" data-visibility="all">All</button>
                <button class="visibility-filter-btn tw-btn tw-btn-xs tw-btn-ghost tw-text-slate-400 tw-rounded-lg tw-px-5 hover:tw-bg-white hover:tw-text-slate-600" data-visibility="shared">Shared</button>
                <button class="visibility-filter-btn tw-btn tw-btn-xs tw-btn-ghost tw-text-slate-400 tw-rounded-lg tw-px-5 hover:tw-bg-white hover:tw-text-slate-600" data-visibility="private">Private</button>
            </div>

            <!-- Category Filters -->
            <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-1">
                <button class="category-filter-btn tw-btn tw-btn-sm tw-btn-primary tw-rounded-xl tw-px-6 tw-gap-2" data-category="all">
                    <i data-lucide="layers" class="tw-w-4 tw-h-4"></i>
                    All Categories
                </button>
                <?php foreach ($categories as $cat) :
                    // Find an asset with this category to get the slug
                    $category_slug = 'package';
                    foreach($assets as $a) {
                        if($a['category_name'] === $cat) {
                            $category_slug = $a['category_slug'];
                            break;
                        }
                    }
                    $icon = vrodos_get_asset_category_icon($category_slug);
                ?>
                    <button class="category-filter-btn tw-btn tw-btn-sm tw-btn-ghost tw-text-slate-400 tw-rounded-xl tw-px-4 hover:tw-bg-slate-50 hover:tw-text-slate-600 tw-gap-2"
                            data-category="<?php echo esc_attr($category_slug); ?>">
                        <i data-lucide="<?php echo $icon; ?>" class="tw-w-4 tw-h-4"></i>
                        <?php echo $cat; ?>
                    </button>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Asset Grid -->
        <div id="asset-grid" class="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-8">

            <!-- Add New Asset Card -->
            <a href="<?php echo $link_to_add; ?>"
               class="tw-group tw-relative tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-8 tw-bg-white tw-border-2 tw-border-dashed tw-border-slate-200 tw-rounded-2xl hover:tw-border-primary hover:tw-bg-primary/5 tw-transition-all tw-duration-300 tw-h-full tw-min-h-[280px] vr-glow-card">
                <div class="tw-w-16 tw-h-16 tw-bg-slate-50 tw-text-slate-400 group-hover:tw-bg-primary group-hover:tw-text-white tw-rounded-2xl tw-flex tw-items-center tw-justify-center tw-transition-all tw-duration-300">
                    <i data-lucide="plus" class="tw-w-8 tw-h-8"></i>
                </div>
                <div class="tw-mt-6 tw-text-center">
                    <h4 class="tw-text-slate-900 tw-font-extrabold tw-text-base">Add New Asset</h4>
                    <p class="tw-text-slate-400 tw-text-xs tw-mt-1 tw-font-bold tw-uppercase tw-tracking-wider"><?php echo $single_project_asset_list ? 'Private to Project' : 'Global Access'; ?></p>
                </div>
            </a>

            <?php
            foreach ( $assets as $asset ) :
                $pGameId = get_page_by_path( $asset['asset_parent_game_slug'], OBJECT, 'vrodos_game' )->ID;
                $can_edit_asset = $is_user_admin || ( $user_id == $asset['author_id'] );
                $edit_link = $link_to_edit . 'vrodos_asset=' . $asset['asset_id'] . '&vrodos_game=' . $pGameId . '&preview=0';
                $asset_icon = vrodos_get_asset_category_icon( $asset['category_slug'] );
                $asset_preview_icon = vrodos_get_asset_preview_fallback_icon( $asset['category_slug'] );
            ?>

                <div id="<?php echo $asset['asset_id']; ?>" class="tw-group asset-card tw-bg-white tw-border tw-border-slate-200 tw-rounded-2xl tw-overflow-hidden hover:tw-shadow-2xl hover:tw-shadow-primary/10 hover:tw-border-primary/30 tw-transition-all tw-duration-300 tw-flex tw-flex-col"
                     data-category="<?php echo esc_attr($asset['category_slug']); ?>"
                     data-visibility="<?php echo ($asset['is_joker'] == 'true') ? 'shared' : 'private'; ?>">

                    <!-- Clickable Area for Edit -->
                    <?php if ( $can_edit_asset ) : ?>
                    <a href="<?php echo $edit_link; ?>"
                       class="tw-block tw-relative tw-aspect-[4/3] tw-bg-slate-100 tw-overflow-hidden vr-glow-card tw-group/thumb">
                    <?php else : ?>
                    <div class="tw-block tw-relative tw-aspect-[4/3] tw-bg-slate-100 tw-overflow-hidden tw-group/thumb">
                    <?php endif; ?>

                        <?php if ( $asset['screenshot_path'] ) : ?>
                            <img src="<?php echo $asset['screenshot_path']; ?>"
                                 alt="<?php echo $asset['asset_name']; ?>"
                                 class="tw-w-full tw-h-full tw-object-cover group-hover:tw-scale-110 tw-transition-transform tw-duration-500">
                        <?php else : ?>
                            <div class="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-text-slate-300">
                                <i data-lucide="<?php echo esc_attr( $asset_preview_icon ); ?>" class="tw-w-12 tw-h-12"></i>
                            </div>
                        <?php endif; ?>

                        <!-- Hover Overlay -->
                        <?php if ( $can_edit_asset ) : ?>
                        <div class="tw-absolute tw-inset-0 tw-bg-primary/20 tw-opacity-0 group-hover/thumb:tw-opacity-100 tw-transition-opacity tw-duration-300 tw-flex tw-items-center tw-justify-center">
                             <div class="tw-bg-white/90 tw-backdrop-blur-sm tw-p-3 tw-rounded-full tw-shadow-xl tw-transform tw-scale-75 group-hover/thumb:tw-scale-100 tw-transition-transform tw-duration-300">
                                <i data-lucide="pencil" class="tw-w-5 tw-h-5 tw-text-primary"></i>
                             </div>
                        </div>
                        <?php endif; ?>

                        <!-- Absolute Badges (Refined) -->
                        <div class="tw-absolute tw-top-3 tw-left-3 tw-flex tw-flex-col tw-gap-1.5 tw-items-start">
                            <!-- Category Badge -->
                            <span class="tw-w-fit tw-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-1 tw-bg-white tw-text-slate-900 tw-text-[9px] tw-font-bold tw-uppercase tw-tracking-widest tw-rounded-lg tw-shadow-sm tw-border tw-border-slate-100">
                                <i data-lucide="<?php echo esc_attr( $asset_icon ); ?>" class="tw-w-3 tw-h-3"></i>
                                <?php echo $asset['category_name']; ?>
                            </span>

                            <!-- Visibility Badge -->
                            <?php if ( $asset['is_joker'] == 'true' ) : ?>
                                <span class="tw-w-fit tw-px-2.5 tw-py-1 tw-bg-emerald-500 tw-text-white tw-text-[9px] tw-font-bold tw-uppercase tw-tracking-widest tw-rounded-lg tw-shadow-md">
                                    Public
                                </span>
                            <?php else : ?>
                                <span class="tw-w-fit tw-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-1 tw-bg-slate-800 tw-text-white tw-text-[9px] tw-font-bold tw-uppercase tw-tracking-widest tw-rounded-lg tw-shadow-md">
                                    <i data-lucide="lock" class="tw-w-2.5 tw-h-2.5"></i>
                                    <?php echo $asset['asset_parent_game'] ? $asset['asset_parent_game'] : 'Private'; ?>
                                </span>
                            <?php endif; ?>
                        </div>
                    <?php echo $can_edit_asset ? '</a>' : '</div>'; ?>

                    <!-- Content -->
                    <div class="tw-p-5 tw-flex-1 tw-flex tw-flex-col">
                        <div class="tw-flex tw-justify-between tw-items-start tw-mb-3">
                            <?php if ( $can_edit_asset ) : ?>
                            <a href="<?php echo $edit_link; ?>"
                               class="tw-block hover:tw-text-primary tw-transition-colors tw-min-w-0">
                                <h3 class="tw-font-bold tw-text-slate-800 tw-leading-tight tw-mb-1 tw-truncate"><?php echo $asset['asset_name']; ?></h3>
                                <p class="tw-text-[9px] tw-text-slate-400 tw-font-bold uppercase tw-tracking-wider">@<?php echo ($asset['is_joker'] === 'true') ? 'public' : $asset['asset_parent_game_slug']; ?></p>
                            </a>
                            <?php else : ?>
                            <div class="tw-min-w-0">
                                <h3 class="tw-font-bold tw-text-slate-800 tw-leading-tight tw-mb-1 tw-truncate"><?php echo $asset['asset_name']; ?></h3>
                                <p class="tw-text-[9px] tw-text-slate-400 tw-font-bold uppercase tw-tracking-wider">@<?php echo ($asset['is_joker'] === 'true') ? 'public' : $asset['asset_parent_game_slug']; ?></p>
                            </div>
                            <?php endif; ?>

                            <!-- Trash Button -->
                            <?php if ( $is_user_admin || ( $user_id == $asset['author_id'] ) ) : ?>
                                <button onclick="openDeleteModal(<?php echo $asset['asset_id']; ?>, '<?php echo esc_js($asset['asset_name']); ?>', '<?php echo $joker_project_slug; ?>', <?php echo $asset['is_cloned']; ?>)"
                                        class="tw-btn tw-btn-ghost tw-btn-sm tw-btn-square tw-text-slate-300 hover:tw-text-rose-500 tw-transition-colors"
                                        title="Delete Asset">
                                    <i data-lucide="trash-2" class="tw-w-4 tw-h-4"></i>
                                </button>
                            <?php endif; ?>
                        </div>

                        <div class="tw-mt-auto tw-flex tw-items-center tw-justify-between tw-pt-4 tw-border-t tw-border-slate-50">
                            <div class="tw-flex tw-items-center tw-gap-2">
                                <img src="<?php echo get_avatar_url( $asset['author_id'] ); ?>" alt="Avatar" class="tw-w-5 tw-h-5 tw-rounded-full shadow-sm">
                                <span class="tw-text-[10px] tw-font-bold tw-text-slate-400 tw-truncate tw-max-w-[80px]">
                                    <?php echo $asset['author_displayname']; ?>
                                </span>
                            </div>
                            <span class="tw-text-[9px] tw-font-bold tw-text-slate-300 tw-uppercase">
                                ID: <?php echo $asset['asset_id']; ?>
                            </span>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>


    </main>

    <!-- Modals Wrapper -->
    <div id="vrodos-modal-wrapper">
        <!-- Reusable Delete Asset Modal -->
        <?php
            $context = 'asset';
            include 'vrodos-delete-dialog.php';
        ?>
    </div>
</div>

<script type="text/javascript">
    // Global shim for delete_asset.js compatibility
    var deleteDialog = {
        close: function() {
            const modal = document.getElementById('vrodos_delete_asset_modal');
            if (modal) modal.close();
        }
    };

    function openDeleteModal(assetId, assetName, gameSlug, isCloned) {
        document.getElementById('delete_asset_name').textContent = assetName;
        const confirmBtn = document.getElementById('confirmDeleteButton');

        confirmBtn.onclick = function() {
            var progressBar = document.getElementById('delete-scene-dialog-progress-bar');
            if (progressBar) { progressBar.classList.remove('tw-hidden'); progressBar.style.display = ''; }
            vrodos_deleteAssetAjax(assetId, gameSlug, isCloned);
        };

        document.getElementById('vrodos_delete_asset_modal').showModal();
    }

    document.addEventListener('DOMContentLoaded', function() {
        // Initialize Lucide icons
        const initIcons = () => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        };

        initIcons();
        // Fallback for slower loads
        setTimeout(initIcons, 500);
        setTimeout(initIcons, 2000);

        // Filtering Logic
        let activeCategory = 'all';
        let activeVisibility = 'all';

        function applyFilters() {
            document.querySelectorAll('.asset-card').forEach(function(card) {
                var cardCat = card.dataset.category;
                var cardVis = card.dataset.visibility;
                var catMatch = (activeCategory === 'all' || cardCat === activeCategory);
                var visMatch = (activeVisibility === 'all' || cardVis === activeVisibility);
                card.style.display = (catMatch && visMatch) ? '' : 'none';
            });
            initIcons();
        }

        document.querySelectorAll('.category-filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                activeCategory = this.dataset.category;
                document.querySelectorAll('.category-filter-btn').forEach(function(b) {
                    b.classList.remove('tw-btn-primary');
                    b.classList.add('tw-btn-ghost', 'tw-text-slate-400');
                });
                this.classList.remove('tw-btn-ghost', 'tw-text-slate-400');
                this.classList.add('tw-btn-primary');
                applyFilters();
            });
        });

        document.querySelectorAll('.visibility-filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                activeVisibility = this.dataset.visibility;
                document.querySelectorAll('.visibility-filter-btn').forEach(function(b) {
                    b.classList.remove('tw-btn-primary');
                    b.classList.add('tw-btn-ghost', 'tw-text-slate-400');
                });
                this.classList.remove('tw-btn-ghost', 'tw-text-slate-400');
                this.classList.add('tw-btn-primary');
                applyFilters();
            });
        });
    });
</script>

<?php wp_footer(); ?>
</body>
</html>
