<?php
    global $current_scene_id;
?>

<!-- Scene Options Dialog-->
<aside id="options-dialog" class="mdc-dialog" role="alertdialog" style="z-index: 1000;"
       aria-labelledby="Scene options dialog" aria-describedby="Set the settings of the scene"
       data-mdc-auto-init="MDCDialog">
    <div class="mdc-dialog__surface">
        <header class="mdc-dialog__header">
            <h2 id="options-dialog-title" class="mdc-dialog__header__title">
                Scene options
            </h2>
        </header>
        <section id="options-dialog-description" class="mdc-dialog__body">
            
            <div class="mdc-layout-grid">
                <div class="mdc-layout-grid__inner">
                    <div class="mdc-layout-grid__cell--span-6">
                        <h2 class="mdc-typography--title">Description</h2>
                        <div class="mdc-textfield mdc-textfield--textarea"
                             data-mdc-auto-init="MDCTextfield" style="border: 1px solid rgba(0, 0, 0, 0.3);">
                                     <textarea id="sceneCaptionInput" name="sceneCaptionInput"
                                               class="mdc-textfield__input"
                                               rows="10" cols="40" style="box-shadow: none;"
                                               type="text" form="3dAssetForm">
                                         <?php echo get_post_meta($current_scene_id,
                                             'vrodos_scene_caption', true); ?>
                                     </textarea>
                            <label for="sceneCaptionInput" class="mdc-textfield__label"
                                   style="background: none;">Add a description</label>
                        </div>
                    </div>
                    
                    <div class="mdc-layout-grid__cell--span-6">
                        <h2 class="mdc-typography--title">Screenshot</h2>
                        <br>
                        <div class="CenterContents">
                            <?php
                            
                            $screenshotImgUrl = get_the_post_thumbnail_url( $current_scene_id );
                            if($screenshotImgUrl=='') {
                                echo '<script type="application/javascript">'.
                                    'is_scene_icon_manually_selected=false</script>';
                            }else{
                                echo '<script type="application/javascript">'
                                    .'is_scene_icon_manually_selected=true</script>';
                            }
                            
                            if ($screenshotImgUrl) {
                                $dataScreenshot = file_get_contents($screenshotImgUrl);
                                $dataScreenshotbase64 = 'data:image/jpeg;base64,' .
                                    base64_encode($dataScreenshot);
                                ?>
                                
                                <div id="featureImgContainer" class="ImageContainer">
                                    <img width="300" id="vrodos_scene_sshot" name="vrodos_scene_sshot"
                                         src="<?php echo $dataScreenshotbase64;?>">
                                </div>
                            
                            <?php } else { ?>
                                <div id="featureImgContainer">
                                    <img width="300" id="vrodos_scene_sshot" name="vrodos_scene_sshot" src="<?php echo plugins_url( '../images/ic_sshot.png', dirname(__FILE__)  ); ?>">
                                </div>
                            <?php } ?>
                            
                            
                            <input type="file"
                                   style="margin: auto;"
                                   name="vrodos_scene_sshot_manual_select"
                                   title="Featured image"
                                   value=""
                            
                                   id="vrodos_scene_sshot_manual_select"
                                   accept="image/x-png,image/gif,image/jpeg" >
                            
                            <div class="CenterContents">
                                
                                <p class="mdc-typography--subheading1"> <b>or</b> </p>
                                <!-- Clear selected image and take screenshot from 3D canvas-->
                                <a title="Capture screenshot from 3D editor"
                                   id="takeScreenshotBtn" class="mdc-button mdc-button--primary mdc-button--raised">Take a screenshot</a>
                            
                            </div>
                        
                        </div>
                    </div>
                
                </div>
            </div>
        </section>
        
        <footer class="mdc-dialog__footer">
            <a class="mdc-button mdc-button--primary mdc-dialog__footer__button mdc-dialog__footer__button--accept mdc-button--raised" id="sceneDialogOKBtn">OK</a>
        </footer>
    </div>
    <div class="mdc-dialog__backdrop"></div>
</aside>
