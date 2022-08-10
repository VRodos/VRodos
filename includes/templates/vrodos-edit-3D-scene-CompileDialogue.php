

<aside id="compile-dialog"
       class="mdc-dialog"
       role="alertdialog"
       style="z-index: 1000;"
       data-game-slug="<?php echo $projectSlug; ?>"
       data-project-id="<?php echo $project_id; ?>"
       aria-labelledby="my-mdc-dialog-label"
       aria-describedby="my-mdc-dialog-description" data-mdc-auto-init="MDCDialog">
    
    <div class="mdc-dialog__surface" id="compile_dialogue_div" style="max-width: 1100px;">
        
        <header class="mdc-dialog__header">
            <h2 class="mdc-dialog__header__title">
                Compile <?php echo $single_lowercase; ?>
            </h2>
        </header>
        
        <section class="mdc-dialog__body">
            
            <h3 class="mdc-typography--subheading2"> Platform </h3>
            
            <div id="platform-select" class="mdc-select" role="listbox" tabindex="0" style="min-width: 40%;">
                <span id="currently-selected" class="mdc-select__selected-text mdc-typography--subheading2">Select a platform</span>
                <div class="mdc-simple-menu mdc-select__menu" style="position: initial; max-height: none; ">
                    <ul class="mdc-list mdc-simple-menu__items">
                        <li class="mdc-list-item mdc-theme--text-hint-on-light" role="option" id="platforms" aria-disabled="true" style="pointer-events: none;" tabindex="-1">
                            Select a platform
                        </li>
                        <?php
                        
                        foreach (['Aframe'] as $sPlatform){ // ,'Windows','Linux','Mac OS','Web','Android'
                            ?>
                            <li class="mdc-list-item mdc-theme--text-primary-on-background"
                                    role="option" id="platform-<?php echo $sPlatform?>" tabindex="0" aria-selected="true">
                                <?php echo $sPlatform?>
                            </li>
                        <?php
                        }
                        ?>
                    </ul>
                </div>
            </div>
            <input id="platformInput" type="hidden" value="platform-Aframe">
            
            <div id="constantUpdateUser" class="mdc-typography--caption mdc-theme--text-primary-on-background" style="float: left; margin-top:60px">
                <i title="Instructions" class="material-icons AlignIconToBottom">help</i>
                You can press "Proceed" in order to receive the link with the compile output scene
            </div>
            
            <div class="mdc-typography--caption mdc-theme--text-primary-on-background" style="float: right;"> <i title="Memory Usage" class="material-icons AlignIconToBottom">memory</i> <span  id="unityTaskMemValue">0</span> KB </div>
            
            <hr class="WhiteSpaceSeparator">
            
            <h2 id="compileProgressTitle" style="display: none" class="CenterContents mdc-typography--headline">
                Step: 1/4
            </h2>
            
            <div class="progressSlider" id="compileProgressDeterminate" style="display: none;">
                <div class="progressSliderLine"></div>
                <div class="progressSliderSubLineDeterminate" id="progressSliderSubLineDeterminateValue"></div>
            </div>
            
            <div class="progressSlider" id="compileProgressSlider" style="display: none;">
                <div class="progressSliderLine"></div>
                <div class="progressSliderSubLine progressIncrease"></div>
                <div class="progressSliderSubLine progressDecrease"></div>
            </div>
            
            
            <div id="compilationProgressText" class="CenterContents mdc-typography--title"></div>
            
            <div id="previewApp" class="previewApp">
            
            </div>
            
            <div class="" id="appResultDiv" style="margin-top:20px;display:none">
<!--                <a class="mdc-typography--title" href="" id="vrodos-ziplink" style="display:none;"> <i style="vertical-align: text-bottom" class="material-icons">file_download</i> Download Zip</a>-->


                <a class="mdc-typography--title" href="" id="vrodos-weblink" style="margin-left:30px" target="_blank">Web link</a>
            
                <div class="mdc-textfield FullWidth mdc-form-field mdc-textfield--upgraded mdc-textfield--invalid"    data-mdc-auto-init="MDCTextfield">
                    <input id="webLinkInput" name="title" type="text" class="mdc-textfield__input mdc-theme--text-primary-on-light" style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">
                    <label for="webLinkInput" class="mdc-textfield__label mdc-textfield__label--shake" style="color: green !important; transform: translateY(-100%) scale(0.75, 0.75) !important;">The link for your experience</label>
                    <div class="mdc-textfield__bottom-line" style="transform-origin: 122px center" style="color:green"></div>
                </div>
             
                <button id="buttonCopyWebLink" class="ButtonFullWidth mdc-button mdc-elevation--z2 mdc-button--raised mdc-ripple-upgraded">Copy link</button>
            </div>
        
        </section>
        
        <footer class="mdc-dialog__footer">
            <a id="compileCancelBtn" class="mdc-button mdc-dialog__footer__button--cancel mdc-dialog__footer__button">Cancel</a>
            <a id="compileProceedBtn" type="button"
               class="mdc-button mdc-button--primary mdc-dialog__footer__button mdc-button--raised ">Proceed</a>
            <!--            LinkDisabled-->
        </footer>
    </div>
    <div class="mdc-dialog__backdrop"></div>


</aside>

<script>
    // Make a Copy URL of Index_[scene_id].html field (like google does)
    function myCopyLinkFunction() {
        /* Get the text field */
        var copyText = document.getElementById("webLinkInput");

        /* Select the text field */
        copyText.select();
        copyText.setSelectionRange(0, 99999); /* For mobile devices */

        /* Copy the text inside the text field */
        navigator.clipboard.writeText(copyText.value);

        /* Alert the copied text */
        alert("Copied the text: " + copyText.value);
    }

    document.querySelector("#buttonCopyWebLink").addEventListener("click", myCopyLinkFunction);
</script>

