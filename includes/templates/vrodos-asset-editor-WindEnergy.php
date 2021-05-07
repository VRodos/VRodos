<?php

	$physics = get_post_meta($asset_id,'vrodos_physicsValues',true);
	if($physics) {
			$mean_speed_wind = $physics['mean'];
			$var_speed_wind = $physics['variance'];
			$min_speed_wind = $physics['min'];
			$max_speed_wind = $physics['max'];
		}
		$energy_income = get_post_meta($asset_id,'wpunity_energyConsumptionIncome',true);
		if($energy_income) {
			$income_when_overpower = $energy_income['over'];
			$income_when_correct_power = $energy_income['correct'];
			$income_when_under_power = $energy_income['under'];
		}
		$constr_pen = get_post_meta($asset_id,'wpunity_constructionPenalties',true);
		if($constr_pen){
			$access_penalty = $constr_pen['access'];
			$archaeology_penalty = $constr_pen['arch'];
			$natural_reserve_penalty = $constr_pen['natural'];
			$hvdistance_penalty = $constr_pen['hiVolt'];
		}
	}elseif($saved_term[0]->slug == 'consumer'){
		$consumptions = get_post_meta($asset_id,'wpunity_energyConsumption',true);
		if($consumptions) {
			$min_consumption = $consumptions['min'];
			$max_consumption = $consumptions['max'];
			$mean_consumption = $consumptions['mean'];
			$var_consumption = $consumptions['var'];
		}
	}elseif($saved_term[0]->slug == 'producer') {
		$optCosts = get_post_meta($asset_id,'vrodos_producerOptCosts',true);
		if($optCosts) {
			$optCosts_size = $optCosts['size'];
			$optCosts_dmg = $optCosts['dmg'];
			$optCosts_cost = $optCosts['cost'];
			$optCosts_repaid = $optCosts['repaid'];
		}
		$optGen = get_post_meta($asset_id,'vrodos_producerOptGen',true);
		if($optGen) {
			$optGen_class = $optGen['class'];
			$optGen_speed = $optGen['speed'];
			$optGen_power = $optGen['power'];
		}
		$optProductionVal = get_post_meta($asset_id,'vrodos_producerPowerProductionVal',true);

?>
