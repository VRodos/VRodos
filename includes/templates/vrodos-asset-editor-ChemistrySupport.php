<?php

if (count($saved_term)>0)
    $showMolType = $saved_term[0]->slug == 'molecule'?'':'none';
else
    $showMolType = 'none';
?>

<div id="moleculeOptionsPanel" style="display: <?php echo ($asset_id == null)?'none':$showMolType; ?>;">
    
    <h3 class="mdc-typography--title">Molecule Options</h3>
    
    <div class="mdc-textfield FullWidth mdc-form-field" data-mdc-auto-init="MDCTextfield">
        <input id="moleculeChemicalType" name="moleculeChemicalType" type="text" class="mdc-textfield__input mdc-theme--text-primary-on-light"
               style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">
        <label for="moleculeChemicalType" class="mdc-textfield__label"> Chemical Type (e.g.: H2O)</label>
        <div class="mdc-textfield__bottom-line"></div>
    </div>
    
    <div style="display: none;">
        
        <!--                    <hr class="WhiteSpaceSeparator">-->
        
        <h3 class="mdc-typography--title">Functional Group</h3>
        
        <div id="moleculeFunctionalGroupSelect" class="mdc-select" role="listbox" tabindex="0" style="min-width: 100%;">
            <span id="currently-selected" class="mdc-select__selected-text mdc-typography--subheading2">Select a functional group</span>
            <div class="mdc-simple-menu mdc-select__menu">
                <ul class="mdc-list mdc-simple-menu__items">
                    <li class="mdc-list-item mdc-theme--text-hint-on-light" role="option" aria-disabled="true" style="pointer-events: none;" tabindex="-1">
                        Select a functional group
                    </li>
                    <li class="mdc-list-item mdc-theme--text-primary-on-background" role="option" id="functionalGroupNone" tabindex="0">
                        None
                    </li>
                    <li class="mdc-list-item mdc-theme--text-primary-on-background" role="option" id="functionalGroupAlcohol" tabindex="0">
                        Alcohol
                    </li>
                    <li class="mdc-list-item mdc-theme--text-primary-on-background" role="option" id="functionalGroupKetone" tabindex="0">
                        Ketone
                    </li>
                </ul>
            </div>
        </div>
        <input id="moleculeFunctionalGroupInput" name="moleculeFunctionalGroupInput" type="hidden">
        
        <!--                    <hr class="WhiteSpaceSeparator">-->
        
        <h3 class="mdc-typography--title">Fluid Options</h3>
        
        <label for="molecule-fluid-viscosity-slider-label" class="mdc-typography--subheading2">Viscosity: </label>
        <div class="mdc-textfield" data-mdc-auto-init="MDCTextfield">
            <input id="molecule-fluid-viscosity-slider-label" name="molecule-fluid-viscosity-slider-label" type="number" step="0.1" value="1" min="0" max="2000" minlength="1" maxlength="4" class="mdc-textfield__input mdc-theme--text-primary-on-light"
                   style="font-weight:bold; border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">
            <div class="mdc-textfield__bottom-line"></div>
        </div>
        
        <!--<input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="molecule-fluid-viscosity-slider-label" style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">-->
        <div id="molecule-fluid-viscosity-slider"></div>
        <span style="font-style: italic;" class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light">
            1 = Water like viscosity, bigger values mean thicker liquid.</span>
        <input type="hidden" id="moleculeFluidViscosityVal" name="moleculeFluidViscosityVal" value="">
    
    </div>
</div>

<div id="chemistryBoxOptionsPanel" style="display: none;">
    
    <div style="display: none;">
        
        <h3 class="mdc-typography--title">Known Group</h3>
        
        <div id="boxKnownGroupSelect" class="mdc-select" role="listbox" tabindex="0" style="min-width: 100%;">
            <span id="currently-selected" class="mdc-select__selected-text mdc-typography--subheading2">Select a known group</span>
            <div class="mdc-simple-menu mdc-select__menu">
                <ul class="mdc-list mdc-simple-menu__items">
                    <li class="mdc-list-item mdc-theme--text-hint-on-light" role="option" aria-disabled="true" style="pointer-events: none;" tabindex="-1">
                        Select a known group
                    </li>
                    <li class="mdc-list-item mdc-theme--text-primary-on-background" role="option" id="knownGroupAlcohol" tabindex="0">
                        Alcohol
                    </li>
                    <li class="mdc-list-item mdc-theme--text-primary-on-background" role="option" id="knownGroupKetone" tabindex="0">
                        Ketone
                    </li>
                    <li class="mdc-list-item mdc-theme--text-primary-on-background" role="option" id="knownGroupVarious" tabindex="0">
                        Various
                    </li>
                </ul>
            </div>
        </div>
        <input id="boxKnownGroupInput" type="hidden">
    
    </div>

</div>


<?php ?>
