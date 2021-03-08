




<aside id="compile-dialog"
       class="mdc-dialog"
       role="alertdialog"
       style="z-index: 1000;"
       data-game-slug="<?php echo $projectSlug; ?>"
       data-project-id="<?php echo $project_id; ?>"
       aria-labelledby="my-mdc-dialog-label"
       aria-describedby="my-mdc-dialog-description" data-mdc-auto-init="MDCDialog">
    <div class="mdc-dialog__surface">
        
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
                        
                        foreach (['Windows','Linux','Mac OS','Web','Android'] as $sPlatform){
                            echo '<li class="mdc-list-item mdc-theme--text-primary-on-background"
                                    role="option" id="platform-windows" tabindex="0">'.
                                $sPlatform.'</li>';
                        }
                        ?>
                    </ul>
                </div>
            </div>
            <input id="platformInput" type="hidden">
            
            
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
            
            <div class="CenterContents">
                <a class="mdc-typography--title" href="" id="wpunity-ziplink" style="display:none;"> <i style="vertical-align: text-bottom" class="material-icons">file_download</i> Download Zip</a>
                <a class="mdc-typography--title" href="" id="wpunity-weblink" style="display:none;margin-left:30px" target="_blank">Web link</a>
            </div>
        
        </section>
        
        <footer class="mdc-dialog__footer">
            <a id="compileCancelBtn" class="mdc-button mdc-dialog__footer__button--cancel mdc-dialog__footer__button">Cancel</a>
            <a id="compileProceedBtn" type="button" class="mdc-button mdc-button--primary mdc-dialog__footer__button mdc-button--raised LinkDisabled">Proceed</a>
        </footer>
    </div>
    <div class="mdc-dialog__backdrop"></div>
</aside>


