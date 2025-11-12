
<div id="compile-dialog"
     class="mdc-dialog"
     role="alertdialog"
     style="z-index: 1000;"
     data-game-slug="<?php echo esc_attr($projectSlug); ?>"
     data-project-id="<?php echo esc_attr($project_id); ?>"
     aria-labelledby="my-mdc-dialog-label"
     aria-describedby="my-mdc-dialog-description" data-mdc-auto-init="MDCDialog">

    <div class="mdc-dialog__surface" id="compile_dialogue_div" style="max-width: 1100px;">

        <header class="mdc-dialog__header">
            <h2 class="mdc-dialog__header__title">
                Build <?php echo esc_html($single_lowercase); ?>
            </h2>
        </header>

        <section class="mdc-dialog__body">

            <!--Values are important. Dont delete these hidden inputs (yet)-->
            <input id="platformInput" type="hidden" value="platform-Aframe">
            <input id="project-type" type="hidden" value="<?php echo esc_attr(strtolower($project_type)); ?>">

            <div id="constantUpdateUser" class="mdc-typography--caption mdc-theme--text-primary-on-background">
                <i title="Instructions" class="material-icons AlignIconToBottom">help</i>
                Click on "Build" in order to construct the virtual world.
            </div>


            <h2 id="compileProgressTitle" style="display: none" class="CenterContents mdc-typography--headline"></h2>

            <div class="progressSlider" id="compileProgressDeterminate" style="display: none;">
                <div class="progressSliderLine"></div>
                <div class="progressSliderSubLineDeterminate" id="progressSliderSubLineDeterminateValue"></div>
            </div>

            <div class="progressSlider" id="compileProgressSlider" style="display: none;">
                <div class="progressSliderLine"></div>
                <div class="progressSliderSubLine progressIncrease"></div>
                <div class="progressSliderSubLine progressDecrease"></div>
            </div>

            <div id="compilationProgressText" class="mdc-typography--title"></div>

            <hr class="WhiteSpaceSeparator" style="margin-top: 0;" tabIndex="0">

            <a id="compileProceedBtn" type="button" class="mdc-button mdc-button--primary mdc-dialog__footer__button mdc-button--raised" style="width: 20%;">Build</a>

            <hr class="separator" >

            <div id="previewApp" class="previewApp" style="display:inline-block"></div>

            <div id="appResultDiv" style="margin-top:20px;display:none">

                <a class="mdc-typography--title" href="" id="vrodos-weblink" style="margin-left:30px" target="_blank">Web link</a>

                <button title="Copy link to clipboard" id="buttonCopyWebLink" style="background: transparent; border: none; color: darkslateblue" >
                    <i class="material-icons" style="cursor: pointer; float: right;">content_copy</i></button>

                <a id="openWebLinkhref" href="#" title="Open index.html in new window" target="_blank" style="color:darkslateblue" onclick="jQuery('#compileCancelBtn')[0].click();">Open experience link</a>

            </div>

        </section>

        <footer class="mdc-dialog__footer">
            <a id="compileCancelBtn" class="mdc-button mdc-dialog__footer__button--cancel mdc-dialog__footer__button">Close</a>

        </footer>
    </div>
    <div class="mdc-dialog__backdrop"></div>

</div>

