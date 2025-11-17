var deleteDialog;
jQuery(document).ready(function() {
    var mdc = window.mdc;
    mdc.autoInit();

    var helpDialog = document.querySelector('#help-dialog');
    if (helpDialog) {
        helpDialog = new mdc.dialog.MDCDialog(helpDialog);
        jQuery("#helpButton").click(function() {
            helpDialog.show();
        });
    }

    deleteDialog = document.querySelector('#delete-dialog');
    if (deleteDialog) {
        deleteDialog = new mdc.dialog.MDCDialog(deleteDialog);
        deleteDialog.focusTrap_.deactivate();
    }
});
