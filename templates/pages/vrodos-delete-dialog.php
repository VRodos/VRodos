<?php
/**
 * Generic Delete Dialog Component
 * 
 * Usage:
 * $context = 'project'; // or 'asset'
 * include 'vrodos-delete-dialog.php';
 */

$is_asset = isset($context) && $context === 'asset';
$modal_id = $is_asset ? 'vrodos_delete_asset_modal' : 'delete-dialog';
$title = $is_asset ? 'Delete Asset' : 'Delete Project?';
$description_id = $is_asset ? 'delete_asset_name_container' : 'delete-dialog-description';
$progress_id = $is_asset ? 'delete-scene-dialog-progress-bar' : 'delete-dialog-progress-bar';
$confirm_btn_id = $is_asset ? 'confirmDeleteButton' : 'deleteProjectBtn';
$cancel_btn_id = $is_asset ? 'cancelDeleteButtonGeneric' : 'canceldeleteProjectBtn';
$confirm_text = $is_asset ? 'CONFIRM DELETE' : 'DELETE PROJECT';
?>

<dialog id="<?php echo $modal_id; ?>" class="tw-modal">
    <div class="tw-modal-box tw-p-0 tw-overflow-hidden">
        <!-- Header Section -->
        <div class="tw-relative tw-p-8 tw-pb-4 tw-flex tw-flex-col tw-items-center tw-text-center">
            <button type="button"
                    class="tw-absolute tw-top-4 tw-right-4 tw-p-1.5 tw-text-slate-400 hover:tw-text-slate-700 tw-rounded-lg hover:tw-bg-slate-100 tw-transition-colors"
                    title="Close"
                    onclick="document.getElementById('<?php echo $modal_id; ?>').close()">
                <i data-lucide="x" class="tw-w-4 tw-h-4"></i>
            </button>
            <div class="tw-w-16 tw-h-16 tw-bg-rose-50 tw-text-rose-500 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mb-4">
                <i data-lucide="alert-circle" class="tw-w-8 tw-h-8"></i>
            </div>
            <h3 id="<?php echo $is_asset ? 'delete_asset_title' : 'delete-dialog-title'; ?>" class="tw-text-xl tw-font-bold tw-text-slate-800 tw-mb-1"><?php echo $title; ?></h3>
            <p class="tw-text-[10px] tw-font-black tw-text-slate-400 tw-uppercase tw-tracking-widest">Permanent Action</p>
        </div>

        <!-- Body Section -->
        <div class="tw-px-8 tw-pb-8 tw-text-center">
            <div id="<?php echo $description_id; ?>" class="tw-text-slate-500 tw-text-sm tw-leading-relaxed">
                <?php if ($is_asset): ?>
                    Are you sure you want to permanently delete <span id="delete_asset_name" class="tw-font-black tw-text-slate-900"></span>? This action cannot be undone.
                <?php else: ?>
                    Are you sure you want to delete this project? There is no Undo functionality once you delete it.
                <?php endif; ?>
            </div>
            
            <div id="<?php echo $progress_id; ?>" class="tw-mt-6" style="display: none;">
                <p class="tw-text-[10px] tw-font-bold tw-text-error tw-mb-2 uppercase tw-tracking-widest">Processing...</p>
                <div class="vrodos-progress-track">
                    <div class="vrodos-progress-bar vrodos-progress-error vrodos-indeterminate"></div>
                </div>
            </div>
        </div>

        <!-- Action Section -->
        <div class="tw-modal-action tw-bg-white tw-p-6 tw-pt-2 tw-flex tw-justify-center tw-gap-3">
            <button class="tw-btn tw-btn-ghost tw-text-slate-400 hover:tw-text-slate-600 tw-px-8" 
                    id="<?php echo $cancel_btn_id; ?>" 
                    onclick="document.getElementById('<?php echo $modal_id; ?>').close()">CANCEL</button>
            <button class="tw-btn vrodos-btn-premium-error tw-px-10" 
                    id="<?php echo $confirm_btn_id; ?>"><?php echo $confirm_text; ?></button>
        </div>
    </div>
    <form method="dialog" class="tw-modal-backdrop">
        <button class="tw-cursor-default tw-outline-none tw-bg-slate-900/40 tw-backdrop-blur-sm tw-appearance-none tw-border-none tw-text-transparent">close</button>
    </form>
</dialog>
