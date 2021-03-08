<!-- Analytics -->
<?php if ($project_scope === 1) {?>
    
    <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
        
        <h3 class="mdc-typography--subheading2 mdc-theme--text-primary-on-light">GIO APP KEY</h3>
        
        <div class="mdc-textfield FullWidth" data-mdc-auto-init="MDCTextfield">
            <input id="app-key" name="app-key" type="text"
                   class="mdc-textfield__input mdc-theme--text-primary-on-light mdc-textfield--disabled"
                   style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;" value="<?php if($project_saved_keys['gioID'] != ''){echo $project_saved_keys['gioID'];} ?>">
            <label for="app-key" class="mdc-textfield__label">APP KEY</label>
            <div class="mdc-textfield__bottom-line"></div>
        </div>
        
        
        <h3 class="mdc-typography--subheading2 mdc-theme--text-primary-on-light">Experiment ID (GUID)</h3>
        <form name="create_new_expid_form" action="" id="create_new_expid_form" method="POST" enctype="multipart/form-data">
            
            <div class="mdc-textfield FullWidth" data-mdc-auto-init="MDCTextfield">
                <input id="exp-id" name="exp-id" type="text" class="mdc-textfield__input mdc-theme--text-primary-on-light"
                       style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;"  value="<?php if($project_saved_keys['expID'] != ''){echo $project_saved_keys['expID'];} ?>">
                <label for="exp-id" class="mdc-textfield__label">Insert a valid exp id</label>
                <div class="mdc-textfield__bottom-line"></div>
            </div>
            
            <br>
            <?php wp_nonce_field('post_nonce', 'post_nonce_field2'); ?>
            <input type="hidden" name="submitted2" id="submitted2" value="true" />
            <button id="save-expid-button" type="submit" class="mdc-button mdc-button--primary mdc-button--raised FullWidth" data-mdc-auto-init="MDCRipple"> SAVE</button>
        </form>
    </div>

<?php } ?>
