

<!--     FLUID PROPERTIES    -->
<div class="mdc-layout-grid" id="moleculeFluidPanel" style="display:none">
    <div class="mdc-layout-grid__inner" style="display: none;">
        
        <div  class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
            <h3 class="mdc-typography--title">Fluid Color</h3>
            <span style="font-style: italic;" class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light">
                    Create a color for the fluid that will be displayed inside the vial.
                </span>
            <div class="mdc-layout-grid__inner">
                
                <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
                    <div id="fluidColorRedSlider" class="ColorPickerSliderRed"></div>
                    <div id="fluidColorGreenSlider" class="ColorPickerSliderGreen"></div>
                    <div id="fluidColorBlueSlider" class="ColorPickerSliderBlue"></div>
                    <div id="fluidColorAlphaSlider" class="ColorPickerSliderAlpha"></div>
                </div>
                
                <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
                    <ul class="mdc-list">
                        <li class="mdc-list-item">
                            <label for="fluidColorRedVal" class="mdc-typography--subheading2">Red:</label>
                            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="fluidColorRedVal" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;"
                        </li>
                        <li class="mdc-list-item">
                            <label for="fluidColorGreenVal" class="mdc-typography--subheading2">Green:</label>
                            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="fluidColorGreenVal" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;"
                        </li>
                        <li class="mdc-list-item">
                            <label for="fluidColorBlueVal" class="mdc-typography--subheading2">Blue:</label>
                            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="fluidColorBlueVal" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;"
                        </li>
                        <li class="mdc-list-item">
                            <label for="fluidColorAlphaVal" class="mdc-typography--subheading2">Alpha:</label>
                            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="fluidColorAlphaVal" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;"
                        </li>
                    </ul>
                </div>
                
                <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-4">
                    <div id="fluidColorPreview" class="ui-widget-content ui-corner-all ColorPickerPreview"></div>
                </div>
            
            </div>
            <input type="hidden" id="moleculeFluidColorVal" name="moleculeFluidColorVal">
        </div>
    </div>

</div>

<!-- Terrain properties -->
<div id="terrainPanel" class="mdc-layout-grid" style="display: none;">
    
    <div class="mdc-layout-grid__inner" style="display: none;">
        
        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-5">
            
            <h3 class="mdc-typography--title">Physics</h3>
            <span style="font-style: italic;" class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light">
                Change the terrain physics properties.</span>
            
            <br>
            
            <label for="wind-speed-range-label" class="mdc-typography--subheading2">Wind Speed Range:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="wind-speed-range-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="wind-speed-range"></div>
            <input type="hidden" id="physicsWindMinVal" name="physicsWindMinVal" value="">
            <input type="hidden" id="physicsWindMaxVal" name="physicsWindMaxVal" value="">
            
            <hr class="WhiteSpaceSeparator">
            
            <label for="wind-mean-slider-label" class="mdc-typography--subheading2">Wind Speed Mean:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="wind-mean-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="wind-mean-slider"></div>
            <input type="hidden" id="physicsWindMeanVal" name="physicsWindMeanVal" value="">
            
            <hr class="WhiteSpaceSeparator">
            
            <label for="wind-variance-slider-label" class="mdc-typography--subheading2">Wind Variance:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="wind-variance-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="wind-variance-slider"></div>
            <input type="hidden" id="physicsWindVarianceVal" name="physicsWindVarianceVal" value="">
        
        </div>
        
        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-1"></div>
        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
            
            <h3 class="mdc-typography--title">Income</h3>
            
            <span style="font-style: italic;" class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light">
                Applied to all producer components that are placed on this terrain.
            </span>
            
            <br>
            
            <label for="over-power-income-slider-label" class="mdc-typography--subheading2">Over Power Income:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="over-power-income-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="over-power-income-slider"></div>
            <input type="hidden" id="overPowerIncomeVal" name="overPowerIncomeVal" value="">
            
            <hr class="WhiteSpaceSeparator">
            
            <label for="correct-power-income-slider-label" class="mdc-typography--subheading2">Correct Power Income:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="correct-power-income-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="correct-power-income-slider"></div>
            <input type="hidden" id="correctPowerIncomeVal" name="correctPowerIncomeVal" value="">
            
            <hr class="WhiteSpaceSeparator">
            
            <label for="under-power-income-slider-label" class="mdc-typography--subheading2">Under Power Income:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="under-power-income-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="under-power-income-slider"></div>
            <input type="hidden" id="underPowerIncomeVal" name="underPowerIncomeVal" value="">
            
            <h3 class="mdc-typography--title">Construction Penalties (in $)</h3>
            
            <span style="font-style: italic;" class="mdc-typography--subheading2 mdc-theme--text-secondary-on-light">
                Construction penalties apply for consumers and producers that are placed on this terrain.
            </span>
            <div class="mdc-layout-grid">
                <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
                    <div class="mdc-textfield mdc-textfield--dense FullWidth mdc-form-field" data-mdc-auto-init="MDCTextfield">
                        <input title="Access cost penalty" id="accessCostPenalty" type="number" class="mdc-textfield__input mdc-theme--text-primary-on-light" name="accessCostPenalty"
                               aria-controls="accessCostPenalty-validation-msg" value="<?php echo $access_penalty; ?>" required min="0" max="10" minlength="1" maxlength="2" style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">
                        <label for="accessCostPenalty" class="mdc-textfield__label"> Access Cost</label>
                        <div class="mdc-textfield__bottom-line"></div>
                    </div>
                </div>
                <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
                    <div class="mdc-textfield mdc-textfield--dense FullWidth mdc-form-field" data-mdc-auto-init="MDCTextfield">
                        <input title="Archaeological site proximity penalty" id="archProximityPenalty" type="number" class="mdc-textfield__input mdc-theme--text-primary-on-light" name="archProximityPenalty"
                               aria-controls="archProximityPenalty-validation-msg" value="<?php echo $archaeology_penalty; ?>" required min="0" max="10" minlength="1" maxlength="2" style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">
                        <label for="archProximityPenalty" class="mdc-textfield__label"> Arch. site proximity </label>
                        <div class="mdc-textfield__bottom-line"></div>
                    </div>
                </div>
                
                <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
                    <div class="mdc-textfield mdc-textfield--dense FullWidth mdc-form-field" data-mdc-auto-init="MDCTextfield">
                        <input title="Natural reserve proximity penalty" id="naturalReserveProximityPenalty" type="number" class="mdc-textfield__input mdc-theme--text-primary-on-light" name="naturalReserveProximityPenalty"
                               aria-controls="naturalReserveProximityPenalty-validation-msg" value="<?php echo $natural_reserve_penalty; ?>" required min="0" max="10" minlength="1" maxlength="2" style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">
                        <label for="naturalReserveProximityPenalty" class="mdc-textfield__label"> Natural reserve proximity </label>
                        <div class="mdc-textfield__bottom-line"></div>
                    </div>
                </div>
                <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
                    <div class="mdc-textfield mdc-textfield--dense FullWidth mdc-form-field" data-mdc-auto-init="MDCTextfield">
                        <input title="Distance from High Voltage lines penalty" id="hiVoltLineDistancePenalty" type="number" class="mdc-textfield__input mdc-theme--text-primary-on-light" name="hiVoltLineDistancePenalty"
                               aria-controls="hiVoltLineDistancePenalty-validation-msg" value="<?php echo $hvdistance_penalty; ?>" required min="0" max="10" minlength="1" maxlength="2" style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">
                        <label for="hiVoltLineDistancePenalty" class="mdc-textfield__label"> Hi-Voltage line distance </label>
                        <div class="mdc-textfield__bottom-line"></div>
                    </div>
                </div>
            </div>
        
        
        </div>
    </div>
</div>

<!-- CONSUMER -->
<div id="consumerPanel" class="mdc-layout-grid" style="display: none;">
    
    <div class="mdc-layout-grid__inner">
        
        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
            
            <h3 class="mdc-typography--title">Energy Consumption</h3>
            
            <label for="energy-consumption-range-label" class="mdc-typography--subheading2">Energy Consumption Range:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="energy-consumption-range-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="energy-consumption-range"></div>
            <input type="hidden" id="energyConsumptionMinVal" name="energyConsumptionMinVal" value="<?php echo $min_consumption; ?>">
            <input type="hidden" id="energyConsumptionMaxVal" name="energyConsumptionMaxVal" value="<?php echo $max_consumption; ?>">
            
            <hr class="WhiteSpaceSeparator">
            
            <label for="energy-consumption-mean-slider-label" class="mdc-typography--subheading2">Energy Consumption Mean:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="energy-consumption-mean-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="energy-consumption-mean-slider"></div>
            <input type="hidden" id="energyConsumptionMeanVal" name="energyConsumptionMeanVal" value="<?php echo $mean_consumption; ?>">
            
            <hr class="WhiteSpaceSeparator">
            
            <label for="energy-consumption-variance-slider-label" class="mdc-typography--subheading2">Energy Consumption Variance:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" type="text" id="energy-consumption-variance-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="energy-consumption-variance-slider"></div>
            <input type="hidden" id="energyConsumptionVarianceVal" name="energyConsumptionVarianceVal" value="<?php echo $var_consumption; ?>">
        
        </div>
    </div>
</div>

<!-- PRODUCER  -->
<div id="producerPanel" class="mdc-layout-grid" style="display: none;">
    <div class="mdc-layout-grid__inner">
        
        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
            
            <h3 class="mdc-typography--title">Power Production Chart</h3>
            
            <div class="PlotContainerStyle">
                <div id="producer-chart" class="ProducerChartStyle"></div>
            </div>
            <div class="CenterContents">
                <label class="mdc-typography--subheading2">Select a <b>Power Production</b> value for each <b>Wind Speed</b> value</label>
            </div>
            <div id="powerProductionValuesGroup" class="PowerProductionGroupStyle"></div>
            
            <div class="PowerProductionGroupStyle">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
                <span>8</span>
                <span>9</span>
                <span>10</span>
                
                <span>11</span>
                <span>12</span>
                <span>13</span>
                <span>14</span>
                <span>15</span>
                <span>16</span>
                <span>17</span>
                <span>18</span>
                <span>19</span>
                <span>20</span>
                <span>21</span>
                
                <span>22</span>
                <span>23</span>
                <span>24</span>
                <span>25</span>
                <span>26</span>
                <span>27</span>
            </div>
            
            
            <input type="hidden" id="producerPowerProductionVal" name="producerPowerProductionVal" value="<?php echo $optProductionVal ?>">
        </div>
        
        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
            
            <h3 class="mdc-typography--title">Producer Options</h3>
            
            <div class="mdc-textfield mdc-textfield--dense FullWidth mdc-form-field" data-mdc-auto-init="MDCTextfield">
                <input title="Producer class" id="producerClassVal" class="mdc-textfield__input mdc-theme--text-primary-on-light" name="producerClassVal"
                       aria-controls="producer-class-validation-msg" value="<?php echo $optGen_class; ?>" required minlength="1" style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">
                <label for="producerClassVal" class="mdc-textfield__label"> Producer class </label>
                <div class="mdc-textfield__bottom-line"></div>
            </div>
            
            <hr class="WhiteSpaceSeparator">
            
            <label for="producer-wind-speed-class-slider-label" class="mdc-typography--subheading2">Wind Speed Class:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" id="producer-wind-speed-class-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="producer-wind-speed-class-slider"></div>
            <input type="hidden" id="producerWindSpeedClassVal" name="producerWindSpeedClassVal" value="">
            
            <hr class="WhiteSpaceSeparator">
            
            <label for="producer-max-power-slider-label" class="mdc-typography--subheading2">Max Power:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" id="producer-max-power-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="producer-max-power-slider"></div>
            <input type="hidden" id="producerMaxPowerVal" name="producerMaxPowerVal" value="">
            
            <hr class="WhiteSpaceSeparator">
            
            <label for="producer-turbine-size-slider-label" class="mdc-typography--subheading2">Rotor Size (diameter):</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" id="producer-turbine-size-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="producer-turbine-size-slider"></div>
            <input type="hidden" id="producerTurbineSizeVal" name="producerTurbineSizeVal" value="">
            
            <hr class="WhiteSpaceSeparator">
            
            <label for="producer-damage-coeff-slider-label" class="mdc-typography--subheading2">Damage Coefficient:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" id="producer-damage-coeff-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold;  width: auto;">
            <div id="producer-damage-coeff-slider"></div>
            <input type="hidden" id="producerDmgCoeffVal" name="producerDmgCoeffVal" value="">
        
        </div>
        
        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-1"></div>
        
        <div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-5">
            
            <h3 class="mdc-typography--title">Producer Costs</h3>
            
            <label for="producer-cost-slider-label" class="mdc-typography--subheading2">Producer Cost:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" id="producer-cost-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="producer-cost-slider"></div>
            <input type="hidden" id="producerCostVal" name="producerCostVal" value="">
            
            <hr class="WhiteSpaceSeparator">
            
            <label for="producer-repair-cost-slider-label" class="mdc-typography--subheading2">Producer Repair Cost:</label>
            <input class="mdc-textfield mdc-textfield__input mdc-theme--secondary" id="producer-repair-cost-slider-label" readonly style="box-shadow: none; border-color:transparent; font-weight:bold; width: auto;">
            <div id="producer-repair-cost-slider"></div>
            <input type="hidden" id="producerRepairCostVal" name="producerRepairCostVal" value="">
        
        </div>
    </div>
</div>


<script>

    //jQuery( function() {
    //
    //    // Object type Toggle
    //    jQuery( "input[name=objectTypeRadio]" ).click(function() {
    //        loadFileInputLabel();
    //    });
    //
    //    var minspeed_value = <?php //echo json_encode($min_speed_wind);?>//;
    //    var maxspeed_value = <?php //echo json_encode($max_speed_wind);?>//;
    //    var meanspeed_value = <?php //echo json_encode($mean_speed_wind);?>//;
    //    var varspeed_value = <?php //echo json_encode($var_speed_wind);?>//;

    //    var windSpeedRangeSlider = wpunity_create_slider_component("#wind-speed-range", true, {min: 0, max: 40, values:[minspeed_value,maxspeed_value], valIds:["#physicsWindMinVal", "#physicsWindMaxVal" ], units:"m/sec"});
    //    var windMeanSlider = wpunity_create_slider_component("#wind-mean-slider", false, {min: 0, max: 40, value: meanspeed_value, valId:"#physicsWindMeanVal", units:"m/sec"});
    //    var windVarianceSlider = wpunity_create_slider_component("#wind-variance-slider", false, {min: 1, max: 100, value: varspeed_value, valId:"#physicsWindVarianceVal", units:""});
    //
    //
    //    // Change Mean range according to Speed range
    //    jQuery( "#wind-speed-range" ).on( "slidestop", function( event, ui ) {
    //
    //        var elemId = "#wind-mean-slider";
    //        jQuery( elemId ).slider( "option", "min", ui.values[ 0 ] );
    //        jQuery( elemId ).slider( "option", "max", ui.values[ 1 ] );
    //        jQuery( elemId ).slider( "option", "values", [ ui.values[ 0 ], ui.values[ 1 ] ] );
    //
    //        jQuery( elemId+"-label" ).val( jQuery( elemId ).slider( "values", 0 ) + " " + 'm/sec' );
    //
    //    } );
    //
    //    var min_cons = <?php //echo json_encode($min_consumption);?>//;
    //    var max_cons = <?php //echo json_encode($max_consumption);?>//;
    //    var mean_cons = <?php //echo json_encode($mean_consumption);?>//;
    //    var var_cons = <?php //echo json_encode($var_consumption);?>//;
    //
    //    var energyConsumptionRangeSlider = wpunity_create_slider_component("#energy-consumption-range", true, {min: 0, max: 2000, values:[min_cons, max_cons], valIds:["#energyConsumptionMinVal", "#energyConsumptionMaxVal" ], step: 5, units:"kW"});
    //    var energyConsumptionMeanSlider = wpunity_create_slider_component("#energy-consumption-mean-slider", false, {min: 50, max: 150, value: mean_cons, valId:"#energyConsumptionMeanVal", step: 5, units:"kW"});
    //    var energyConsumptionVarianceSlider = wpunity_create_slider_component("#energy-consumption-variance-slider", false, {min: 5, max: 1000, value: var_cons, valId:"#energyConsumptionVarianceVal", step: 5, units:""});
    //
    //
    //    // Change Mean range according to Speed range
    //    jQuery( "#energy-consumption-range" ).on( "slidestop", function( event, ui ) {
    //
    //        var elemId = "#energy-consumption-mean-slider";
    //        jQuery( elemId ).slider( "option", "min", ui.values[ 0 ] );
    //        jQuery( elemId ).slider( "option", "max", ui.values[ 1 ] );
    //        jQuery( elemId ).slider( "option", "values", [ ui.values[ 0 ], ui.values[ 1 ] ] );
    //
    //        jQuery( elemId+"-label" ).val( jQuery( elemId ).slider( "values", 0 ) + " " + 'kW' );
    //
    //    } );
    //
    //    var income_overpower = <?php //echo json_encode($income_when_overpower);?>//;
    //    var income_correct = <?php //echo json_encode($income_when_correct_power);?>//;
    //    var income_underpower = <?php //echo json_encode($income_when_under_power);?>//;
    //
    //    var terrainOverPowerIncomeSlider = wpunity_create_slider_component("#over-power-income-slider", false, {min: -5, max: 5, value: income_overpower, valId:"#overPowerIncomeVal", step: 0.5, units:"$"});
    //    var terrainCorrectPowerIncomeSlider = wpunity_create_slider_component("#correct-power-income-slider", false, {min: -5, max: 5, value: income_correct, valId:"#correctPowerIncomeVal", step: 0.5, units:"$"});
    //    var terrainUnderPowerIncomeSlider = wpunity_create_slider_component("#under-power-income-slider", false, {min: -5, max: 5, value: income_underpower, valId:"#underPowerIncomeVal", step: 0.5, units:"$"});
    //
    //    var opt_size = <?php //echo json_encode($optCosts_size);?>//;
    //    var opt_dmg = <?php //echo json_encode($optCosts_dmg);?>//;
    //    var opt_cost = <?php //echo json_encode($optCosts_cost);?>//;
    //    var opt_repaid = <?php //echo json_encode($optCosts_repaid);?>//;
    //    var opt_speed = <?php //echo json_encode($optGen_speed);?>//;
    //    var opt_power = <?php //echo json_encode($optGen_power);?>//;
    //
    //    var producerTurbineSizeSlider = wpunity_create_slider_component("#producer-turbine-size-slider", false, {min: 3, max: 250, value: opt_size, valId:"#producerTurbineSizeVal", step: 1, units:"m"});
    //    var producerDmgCoeffSlider = wpunity_create_slider_component("#producer-damage-coeff-slider", false, {min: 0.001, max: 0.02, value: opt_dmg, valId:"#producerDmgCoeffVal", step: 0.001, units:"Probability / sec"});
    //    var producerCostSlider = wpunity_create_slider_component("#producer-cost-slider", false, {min: 1, max: 10, value: opt_cost, valId:"#producerCostVal", step: 1, units:"$"});
    //    var producerRepairCostSlider = wpunity_create_slider_component("#producer-repair-cost-slider", false, {min: 0.5, max: 5, value: opt_repaid, valId:"#producerRepairCostVal", step: 0.5, units:"$"});
    //    var producerWindSpeedClassSlider = wpunity_create_slider_component("#producer-wind-speed-class-slider", false, {min: 2, max: 20, value: opt_speed, valId:"#producerWindSpeedClassVal", step: 0.01, units:"m/sec"});
    //    var producerMaxPowerSlider = wpunity_create_slider_component("#producer-max-power-slider", false, {min: 0.001, max: 20, value: opt_power, valId:"#producerMaxPowerVal", step: 0.001, units:"MW"});
    //
    //    var moleculeFluidViscositySlider = wpunity_create_slider_component("#molecule-fluid-viscosity-slider", false, {min: 0, max: 2000, value: 1, valId:"#moleculeFluidViscosityVal", step: 0.1, units:"", inputText:true});
    //
    //    // POI Image panels - Add/remove POI inputs
    //    var poiMaxFields      = 3; // max input boxes allowed
    //    var poiImgDetailsWrapper         = jQuery("#poiImgDetailsWrapper"); // Fields wrapper
    //    var addPoiFieldBtn      = jQuery("#poiAddFieldBtn"); // Add button ID
    //    var i = 0; // Initial text box count
    //
    //    addPoiFieldBtn.click(function(e){ // On add input button click
    //        e.preventDefault();
    //        if(i < poiMaxFields) { // Max input box allowed
    //            i++; // Text box increment
    //            poiImgDetailsWrapper.append(
    //                '<div class="mdc-layout-grid"><div class="mdc-layout-grid__inner">'+
    //                '<div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-10">' +
    //                '<label for="poi-input-file-'+i+'"> Select an image</label>'+
    //                '<input type="file" name="poi-input-file-'+i+'" class="FullWidth" value="" accept="image/jpeg"/>' +
    //                '<div class="mdc-textfield mdc-form-field FullWidth " data-mdc-auto-init="MDCTextfield">' +
    //                '<input id="poi-input-text-'+i+'" type="text" class="mdc-textfield__input mdc-theme--text-primary-on-light FullWidth" name="poi-input-text-'+i+'" ' +
    //                'aria-controls="poi-input-text-validation-msg" minlength="3" maxlength="25" style="border: none; border-bottom: 1px solid rgba(0, 0, 0, 0.3); box-shadow: none; border-radius: 0;">' +
    //                '<div class="mdc-textfield__bottom-line"></div>' +
    //                '<label for="poi-input-text-'+i+'" class="mdc-textfield__label">Enter an image description' +
    //                '</div>' +
    //                '<p class="mdc-textfield-helptext  mdc-textfield-helptext--validation-msg" id="title-validation-msg">Between 3 - 25 characters</p></div>' +
    //                '<div class="mdc-layout-grid__cell mdc-layout-grid__cell--span-2"><a href="#" class="remove_field"><i title="Delete field" style="font-size: 36px" class="material-icons">clear</i></a></div>' +
    //                '</div></div>'
    //            ); // Add input box
    //        }
    //        // Run autoInit with noop to suppress warnings.
    //        mdc.autoInit(document, () => {});
    //    });
    //
    //    poiImgDetailsWrapper.on("click",".remove_field", function(e) { // User click on remove text
    //        e.preventDefault();
    //        jQuery(this).parent('div').parent('div').parent('div').remove();
    //        i--;
    //    });
    //
    //    // Color picker based on sliders
    //    jQuery( "#fluidColorRedSlider, #fluidColorGreenSlider, #fluidColorBlueSlider" ).slider({
    //        orientation: "horizontal",
    //        range: "min",
    //        max: 255,
    //        value: 127,
    //        change: refreshSwatch,
    //        slide: refreshSwatch,
    //        stop: refreshSwatch
    //    });
    //
    //    jQuery( "#fluidColorAlphaSlider" ).slider({
    //        orientation: "horizontal",
    //        range: "min",
    //        max: 1,
    //        value: 1,
    //        step: 0.01,
    //        change: refreshSwatch,
    //        slide: refreshSwatch,
    //        stop: refreshSwatch
    //    });
    //
    //    jQuery( "#fluidColorRedSlider" ).slider( "value", 255 );
    //    jQuery( "#fluidColorGreenSlider" ).slider( "value", 140 );
    //    jQuery( "#fluidColorBlueSlider" ).slider( "value", 60 );
    //
    //    function refreshSwatch() {
    //        var red = jQuery( "#fluidColorRedSlider" ).slider( "value" ),
    //            green = jQuery( "#fluidColorGreenSlider" ).slider( "value" ),
    //            blue = jQuery( "#fluidColorBlueSlider" ).slider( "value" ),
    //            alpha = jQuery( "#fluidColorAlphaSlider" ).slider( "value" ),
    //            color = [red, green, blue, alpha ];
    //
    //        jQuery('#fluidColorRedVal').val(red);
    //        jQuery('#fluidColorGreenVal').val(green);
    //        jQuery('#fluidColorBlueVal').val(blue);
    //        jQuery('#fluidColorAlphaVal').val(alpha);
    //
    //        jQuery( "#fluidColorPreview" ).css( "background-color", "rgba(" + color +");");
    //
    //        document.getElementById('moleculeFluidColorVal').value = "["+color+"]".toString();
    //    }
    //
    //});
    
    
</script>