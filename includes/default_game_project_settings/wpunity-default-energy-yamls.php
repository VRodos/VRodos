<?php

/***************************************************************************************************************/
// YAMLS for ASSETS' TYPES default values (ENERGY GAMES)
/***************************************************************************************************************/

global $ini_asset_terrain,$ini_asset_consumer,$ini_asset_producer,$ini_asset_staticDec;

$ini_asset_terrain = array('--- !u!1001 &___[fid_of_terrain]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 0}
    m_Modifications:
    - target: {fileID: 4068649796560302, guid: f354ad33b83806342bbd961828cb6010, type: 2}
      propertyPath: m_LocalPosition.x
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 4068649796560302, guid: f354ad33b83806342bbd961828cb6010, type: 2}
      propertyPath: m_LocalPosition.y
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 4068649796560302, guid: f354ad33b83806342bbd961828cb6010, type: 2}
      propertyPath: m_LocalPosition.z
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 4068649796560302, guid: f354ad33b83806342bbd961828cb6010, type: 2}
      propertyPath: m_LocalRotation.x
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 4068649796560302, guid: f354ad33b83806342bbd961828cb6010, type: 2}
      propertyPath: m_LocalRotation.y
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 4068649796560302, guid: f354ad33b83806342bbd961828cb6010, type: 2}
      propertyPath: m_LocalRotation.z
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 4068649796560302, guid: f354ad33b83806342bbd961828cb6010, type: 2}
      propertyPath: m_LocalRotation.w
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 4068649796560302, guid: f354ad33b83806342bbd961828cb6010, type: 2}
      propertyPath: m_RootOrder
      value: 5
      objectReference: {fileID: 0}
    - target: {fileID: 4068649796560302, guid: f354ad33b83806342bbd961828cb6010, type: 2}
      propertyPath: m_LocalScale.x
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 114528735023537862, guid: f354ad33b83806342bbd961828cb6010,
        type: 2}
      propertyPath: totalIncome
      value: 9
      objectReference: {fileID: 0}
    - target: {fileID: 114528735023537862, guid: f354ad33b83806342bbd961828cb6010,
        type: 2}
      propertyPath: incomeWhenOverPower
      value: ___[income_when_overpower]___
      objectReference: {fileID: 0}
    - target: {fileID: 114528735023537862, guid: f354ad33b83806342bbd961828cb6010,
        type: 2}
      propertyPath: incomeWhenCorrectPower
      value: ___[income_when_correct_power]___
      objectReference: {fileID: 0}
    - target: {fileID: 114528735023537862, guid: f354ad33b83806342bbd961828cb6010,
        type: 2}
      propertyPath: incomeWhenUnderPower
      value: ___[income_when_under_power]___
      objectReference: {fileID: 0}
    - target: {fileID: 114528735023537862, guid: f354ad33b83806342bbd961828cb6010,
        type: 2}
      propertyPath: MeanSpeedWind
      value: ___[mean_speed_wind]___
      objectReference: {fileID: 0}
    - target: {fileID: 114528735023537862, guid: f354ad33b83806342bbd961828cb6010,
        type: 2}
      propertyPath: VarSpeedWind
      value: ___[var_speed_wind]___
      objectReference: {fileID: 0}
    - target: {fileID: 114528735023537862, guid: f354ad33b83806342bbd961828cb6010,
        type: 2}
      propertyPath: MinSpeedWind
      value: ___[min_speed_wind]___
      objectReference: {fileID: 0}
    - target: {fileID: 114528735023537862, guid: f354ad33b83806342bbd961828cb6010,
        type: 2}
      propertyPath: MaxSpeedWind
      value: ___[max_speed_wind]___
      objectReference: {fileID: 0}
    - target: {fileID: 114528735023537862, guid: f354ad33b83806342bbd961828cb6010,
        type: 2}
      propertyPath: accessPenalty
      value: ___[access_penalty]___
      objectReference: {fileID: 0}
    - target: {fileID: 114528735023537862, guid: f354ad33b83806342bbd961828cb6010,
        type: 2}
      propertyPath: archaelogyPenalty
      value: ___[archaeology_penalty]___
      objectReference: {fileID: 0}
    - target: {fileID: 114528735023537862, guid: f354ad33b83806342bbd961828cb6010,
        type: 2}
      propertyPath: naturalReservePenalty
      value: ___[natural_reserve_penalty]___
      objectReference: {fileID: 0}
    - target: {fileID: 114528735023537862, guid: f354ad33b83806342bbd961828cb6010,
        type: 2}
      propertyPath: hvDistancePenalty
      value: ___[hvdistance_penalty]___
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: f354ad33b83806342bbd961828cb6010, type: 2}
  m_IsPrefabParent: 0
--- !u!4 &___[fid_rect_transform_terrain]___ stripped
Transform:
  m_PrefabParentObject: {fileID: 4068649796560302, guid: f354ad33b83806342bbd961828cb6010,
    type: 2}
  m_PrefabInternal: {fileID: ___[fid_of_terrain]___}
--- !u!1001 &___[fid_terrain_prefab_mesh]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: ___[fid_rect_transform_terrain]___}
    m_Modifications:
    - target: {fileID: 400002, guid: ___[guid_terrain_mesh]___, type: 3}
      propertyPath: m_LocalPosition.x
      value: ___[x_pos_terrain]___
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_terrain_mesh]___, type: 3}
      propertyPath: m_LocalPosition.y
      value: ___[y_pos_terrain]___
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_terrain_mesh]___, type: 3}
      propertyPath: m_LocalPosition.z
      value: ___[z_pos_terrain]___
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_terrain_mesh]___, type: 3}
      propertyPath: m_LocalRotation.x
      value: ___[x_rotation_terrain]___
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_terrain_mesh]___, type: 3}
      propertyPath: m_LocalRotation.y
      value: ___[y_rotation_terrain]___
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_terrain_mesh]___, type: 3}
      propertyPath: m_LocalRotation.z
      value: ___[z_rotation_terrain]___
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_terrain_mesh]___, type: 3}
      propertyPath: m_LocalRotation.w
      value: ___[w_rotation_terrain]___
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_terrain_mesh]___, type: 3}
      propertyPath: m_RootOrder
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_terrain_mesh]___, type: 3}
      propertyPath: m_LocalScale.x
      value: ___[x_scale_terrain]___
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_terrain_mesh]___, type: 3}
      propertyPath: m_LocalScale.y
      value: ___[y_scale_terrain]___
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_terrain_mesh]___, type: 3}
      propertyPath: m_LocalScale.z
      value: ___[z_scale_terrain]___
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: ___[guid_terrain_mesh]___, type: 3}
  m_IsPrefabParent: 0
    ');

$ini_asset_consumer = array('--- !u!1001 &___[fid_prefab_consumer_parent]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 0}
    m_Modifications:
    - target: {fileID: 4481460071382266, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: m_LocalPosition.x
      value: ___[x_pos_consumer]___
      objectReference: {fileID: 0}
    - target: {fileID: 4481460071382266, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: m_LocalPosition.y
      value: ___[y_pos_consumer]___
      objectReference: {fileID: 0}
    - target: {fileID: 4481460071382266, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: m_LocalPosition.z
      value: ___[z_pos_consumer]___
      objectReference: {fileID: 0}
    - target: {fileID: 4481460071382266, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: m_LocalRotation.x
      value: ___[x_rotation_consumer]___
      objectReference: {fileID: 0}
    - target: {fileID: 4481460071382266, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: m_LocalRotation.y
      value: ___[y_rotation_consumer]___
      objectReference: {fileID: 0}
    - target: {fileID: 4481460071382266, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: m_LocalRotation.z
      value: ___[z_rotation_consumer]___
      objectReference: {fileID: 0}
    - target: {fileID: 4481460071382266, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: m_LocalRotation.w
      value: ___[w_rotation_consumer]___
      objectReference: {fileID: 0}
    - target: {fileID: 4481460071382266, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: m_RootOrder
      value: 6
      objectReference: {fileID: 0}
    - target: {fileID: 1010085542761384, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: m_Name
      value: ___[name_consumer]___
    - target: {fileID: 114352149921982826, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: MeanPowerConsume
      value: ___[mean_power_consumer]___
      objectReference: {fileID: 0}
    - target: {fileID: 114352149921982826, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: VarPowerConsume
      value: ___[var_power_consumer]___
      objectReference: {fileID: 0}
    - target: {fileID: 114352149921982826, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: MinPowerConsume
      value: ___[min_power_consumer]___
      objectReference: {fileID: 0}
    - target: {fileID: 114352149921982826, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
      propertyPath: MaxPowerConsume
      value: ___[max_power_consumer]___
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: 445abb95b6721c64aa4204dff733341e, type: 2}
  m_IsPrefabParent: 0
--- !u!4 &___[fid_consumer_prefab_transform]___ stripped
Transform:
  m_PrefabParentObject: {fileID: 4481460071382266, guid: 445abb95b6721c64aa4204dff733341e,
    type: 2}
  m_PrefabInternal: {fileID: ___[fid_prefab_consumer_parent]___}
--- !u!1001 &___[fid_consumer_prefab_child]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: ___[fid_consumer_prefab_transform]___}
    m_Modifications:
    - target: {fileID: 400002, guid: ___[guid_consumer_prefab_child_obj]___, type: 3}
      propertyPath: m_LocalPosition.x
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_consumer_prefab_child_obj]___, type: 3}
      propertyPath: m_LocalPosition.y
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_consumer_prefab_child_obj]___, type: 3}
      propertyPath: m_LocalPosition.z
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_consumer_prefab_child_obj]___, type: 3}
      propertyPath: m_LocalRotation.x
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_consumer_prefab_child_obj]___, type: 3}
      propertyPath: m_LocalRotation.y
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_consumer_prefab_child_obj]___, type: 3}
      propertyPath: m_LocalRotation.z
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_consumer_prefab_child_obj]___, type: 3}
      propertyPath: m_LocalRotation.w
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: ___[guid_consumer_prefab_child_obj]___, type: 3}
      propertyPath: m_RootOrder
      value: 1
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: ___[guid_consumer_prefab_child_obj]___, type: 3}
  m_IsPrefabParent: 0
    ');

$ini_asset_producer = array('--- !u!1001 &___[fid_producer]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 0}
    m_Modifications:
    - target: {fileID: 4047139695584158, guid: cddc7e0e3b6ab5340a00da10e23d3837, type: 2}
      propertyPath: m_LocalPosition.x
      value: ___[x_pos_producer]___
      objectReference: {fileID: 0}
    - target: {fileID: 4047139695584158, guid: cddc7e0e3b6ab5340a00da10e23d3837, type: 2}
      propertyPath: m_LocalPosition.y
      value: ___[y_pos_producer]___
      objectReference: {fileID: 0}
    - target: {fileID: 4047139695584158, guid: cddc7e0e3b6ab5340a00da10e23d3837, type: 2}
      propertyPath: m_LocalPosition.z
      value: ___[z_pos_producer]___
      objectReference: {fileID: 0}
    - target: {fileID: 4047139695584158, guid: cddc7e0e3b6ab5340a00da10e23d3837, type: 2}
      propertyPath: m_LocalRotation.x
      value: ___[x_rot_parent]___
      objectReference: {fileID: 0}
    - target: {fileID: 4047139695584158, guid: cddc7e0e3b6ab5340a00da10e23d3837, type: 2}
      propertyPath: m_LocalRotation.y
      value: ___[y_rot_parent]___
      objectReference: {fileID: 0}
    - target: {fileID: 4047139695584158, guid: cddc7e0e3b6ab5340a00da10e23d3837, type: 2}
      propertyPath: m_LocalRotation.z
      value: ___[z_rot_parent]___
      objectReference: {fileID: 0}
    - target: {fileID: 4047139695584158, guid: cddc7e0e3b6ab5340a00da10e23d3837, type: 2}
      propertyPath: m_LocalRotation.w
      value:  ___[w_rot_parent]___
      objectReference: {fileID: 0}
    - target: {fileID: 4047139695584158, guid: cddc7e0e3b6ab5340a00da10e23d3837, type: 2}
      propertyPath: m_RootOrder
      value: 6
      objectReference: {fileID: 0}
    - target: {fileID: 1334398694368940, guid: cddc7e0e3b6ab5340a00da10e23d3837, type: 2}
      propertyPath: m_Name
      value: ___[producer_name]___
    - target: {fileID: 4732589310118278, guid: cddc7e0e3b6ab5340a00da10e23d3837, type: 2}
      propertyPath: m_LocalPosition.y
      value: ___[y_position_infoquad]___
      objectReference: {fileID: 0}
    - target: {fileID: 4609135467054860, guid: cddc7e0e3b6ab5340a00da10e23d3837, type: 2}
      propertyPath: m_LocalPosition.y
      value: ___[y_pos_quadselector]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineClass
      value: ___[turbine_name_class]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutput
      value: ___[turbine_max_power]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineCost
      value: ___[turbine_cost]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineRotorSize
      value: ___[rotor_diameter]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineWindClass
      value: ___[turbine_windspeed_class]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineRepairCost
      value: ___[turbine_repair_cost]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: damageProbCoefficient
      value: ___[turbine_damage_coefficient]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[0]
      value: ___[power_curve_val_0]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[1]
      value: ___[power_curve_val_1]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[2]
      value: ___[power_curve_val_2]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[3]
      value: ___[power_curve_val_3]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[4]
      value: ___[power_curve_val_4]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[5]
      value: ___[power_curve_val_5]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[6]
      value: ___[power_curve_val_6]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[7]
      value: ___[power_curve_val_7]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[8]
      value: ___[power_curve_val_8]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[9]
      value: ___[power_curve_val_9]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[10]
      value: ___[power_curve_val_10]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[11]
      value: ___[power_curve_val_11]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[12]
      value: ___[power_curve_val_12]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[13]
      value: ___[power_curve_val_13]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[14]
      value: ___[power_curve_val_14]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[15]
      value: ___[power_curve_val_15]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[16]
      value: ___[power_curve_val_16]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[17]
      value: ___[power_curve_val_17]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[18]
      value: ___[power_curve_val_18]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[19]
      value: ___[power_curve_val_19]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[20]
      value: ___[power_curve_val_20]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[21]
      value: ___[power_curve_val_21]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[22]
      value: ___[power_curve_val_22]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[23]
      value: ___[power_curve_val_23]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[24]
      value: ___[power_curve_val_24]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[25]
      value: ___[power_curve_val_25]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[26]
      value: ___[power_curve_val_26]___
      objectReference: {fileID: 0}
    - target: {fileID: 114822797867135186, guid: cddc7e0e3b6ab5340a00da10e23d3837,
        type: 2}
      propertyPath: turbineEnergyOutputProfile.Array.data[27]
      value: ___[power_curve_val_27]___
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: cddc7e0e3b6ab5340a00da10e23d3837, type: 2}
  m_IsPrefabParent: 0
--- !u!4 &___[fid_transformation_parent_producer]___ stripped
Transform:
  m_PrefabParentObject: {fileID: 4047139695584158, guid: cddc7e0e3b6ab5340a00da10e23d3837,
    type: 2}
  m_PrefabInternal: {fileID: ___[fid_producer]___}
--- !u!1001 &___[fid_child_producer]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: ___[fid_transformation_parent_producer]___}
    m_Modifications:
    - target: {fileID: 400004, guid: ___[obj_guid_producer]___, type: 3}
      propertyPath: m_LocalPosition.x
      value: -0
      objectReference: {fileID: 0}
    - target: {fileID: 400004, guid: ___[obj_guid_producer]___, type: 3}
      propertyPath: m_LocalPosition.y
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400004, guid: ___[obj_guid_producer]___, type: 3}
      propertyPath: m_LocalPosition.z
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400004, guid: ___[obj_guid_producer]___, type: 3}
      propertyPath: m_LocalRotation.x
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400004, guid: ___[obj_guid_producer]___, type: 3}
      propertyPath: m_LocalRotation.y
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400004, guid: ___[obj_guid_producer]___, type: 3}
      propertyPath: m_LocalRotation.z
      value: -0
      objectReference: {fileID: 0}
    - target: {fileID: 400004, guid: ___[obj_guid_producer]___, type: 3}
      propertyPath: m_LocalRotation.w
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 400004, guid: ___[obj_guid_producer]___, type: 3}
      propertyPath: m_RootOrder
      value: 4
      objectReference: {fileID: 0}
    - target: {fileID: 100000, guid: ___[obj_guid_producer]___, type: 3}
      propertyPath: m_TagString
      value: producer_mesh
      objectReference: {fileID: 0}
    - target: {fileID: 2300000, guid: ___[obj_guid_producer]___, type: 3}
      propertyPath: m_Enabled
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 2300002, guid: ___[obj_guid_producer]___, type: 3}
      propertyPath: m_Enabled
      value: 0
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: ___[obj_guid_producer]___, type: 3}
  m_IsPrefabParent: 0
    ');

$ini_asset_staticDec = array('--- !u!1001 &___[fid_decorator]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 0}
    m_Modifications:
    - target: {fileID: 400000, guid: ___[guid_obj_decorator]___, type: 3}
      propertyPath: m_LocalPosition.x
      value: ___[x_pos_decorator]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[guid_obj_decorator]___, type: 3}
      propertyPath: m_LocalPosition.y
      value: ___[y_pos_decorator]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[guid_obj_decorator]___, type: 3}
      propertyPath: m_LocalPosition.z
      value: ___[z_pos_decorator]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[guid_obj_decorator]___, type: 3}
      propertyPath: m_LocalRotation.x
      value: ___[x_rotation_decorator]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[guid_obj_decorator]___, type: 3}
      propertyPath: m_LocalRotation.y
      value: ___[y_rotation_decorator]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[guid_obj_decorator]___, type: 3}
      propertyPath: m_LocalRotation.z
      value: ___[z_rotation_decorator]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[guid_obj_decorator]___, type: 3}
      propertyPath: m_LocalRotation.w
      value: ___[w_rotation_decorator]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[guid_obj_decorator]___, type: 3}
      propertyPath: m_RootOrder
      value: 6
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[guid_obj_decorator]___, type: 3}
      propertyPath: m_LocalScale.x
      value: ___[x_scale_decorator]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[guid_obj_decorator]___, type: 3}
      propertyPath: m_LocalScale.y
      value: ___[y_scale_decorator]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[guid_obj_decorator]___, type: 3}
      propertyPath: m_LocalScale.z
      value: ___[z_scale_decorator]___
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: ___[guid_obj_decorator]___, type: 3}
  m_IsPrefabParent: 0
    ');

$ini_asset_marker = array('');

function wpunity_default_value_terrain_get(){
    global $ini_asset_terrain;
    return $ini_asset_terrain[0];
}

function wpunity_default_value_consumer_get(){
    global $ini_asset_consumer;
    return $ini_asset_consumer[0];
}

function wpunity_default_value_producer_get(){
    global $ini_asset_producer;
    return $ini_asset_producer[0];
}

function wpunity_default_value_decoration_energy_get(){
    global $ini_asset_staticDec;
    return $ini_asset_staticDec[0];
}

function wpunity_default_value_marker_get(){
  global $ini_asset_marker;
  return $ini_asset_marker[0];
}



/***************************************************************************************************************/
// YAMLS for GAMES' TYPES Project Settings default values (ENERGY GAMES)
/***************************************************************************************************************/

global $AudioManager_asset,$ClusterInputManager_asset,$DynamicsManager_asset,$EditorBuildSettings_asset,$EditorSettings_asset,$GraphicsSettings_asset;
global $InputManager_asset,$NavMeshAreas_asset,$NetworkManager_asset,$Physics2DSettings_asset,$ProjectSettings_asset,$ProjectVersion_asset;
global $QualitySettings_asset,$TagManager_asset,$TimeManager_asset,$UnityConnect_asset;

//4th alphabetically:  EditorBuildSettings.asset   : It is the only that should change across compilations
// Each scene should be added with
//$sceneToAddPattern = array("  - enabled: 1
//    path: Assets/scenes/S_MainMenu.unity");
// Line change with character: chr(10)

//1. AudioManager.asset
$AudioManager_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!11 &1
AudioManager:
  m_ObjectHideFlags: 0
  m_Volume: 1
  Rolloff Scale: 1
  Doppler Factor: 1
  Default Speaker Mode: 2
  m_SampleRate: 0
  m_DSPBufferSize: 0
  m_VirtualVoiceCount: 512
  m_RealVoiceCount: 32
  m_SpatializerPlugin:
  m_DisableAudio: 0
  m_VirtualizeEffects: 1");

//2. ClusterInputManager.asset
$ClusterInputManager_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!236 &1
ClusterInputManager:
  m_ObjectHideFlags: 0
  m_Inputs: []
");

//3. DynamicsManager.asset
$DynamicsManager_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!55 &1
PhysicsManager:
  m_ObjectHideFlags: 0
  serializedVersion: 3
  m_Gravity: {x: 0, y: -9.81, z: 0}
  m_DefaultMaterial: {fileID: 0}
  m_BounceThreshold: 2
  m_SleepThreshold: 0.005
  m_DefaultContactOffset: 0.01
  m_DefaultSolverIterations: 6
  m_DefaultSolverVelocityIterations: 1
  m_QueriesHitBackfaces: 0
  m_QueriesHitTriggers: 1
  m_EnableAdaptiveForce: 0
  m_EnablePCM: 1
  m_LayerCollisionMatrix: ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
");

//4. EditorBuildSettings.asset
$EditorBuildSettings_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!1045 &1
EditorBuildSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Scenes:
");

//5. EditorSettings.asset
$EditorSettings_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!159 &1
EditorSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 3
  m_ExternalVersionControlSupport: Visible Meta Files
  m_SerializationMode: 2
  m_DefaultBehaviorMode: 0
  m_SpritePackerMode: 2
  m_SpritePackerPaddingPower: 1
  m_ProjectGenerationIncludedExtensions: txt;xml;fnt;cd
  m_ProjectGenerationRootNamespace:
  m_UserGeneratedProjectSuffix:
");

//6. GraphicsSettings.asset
$GraphicsSettings_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!30 &1
GraphicsSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 12
  m_Deferred:
    m_Mode: 1
    m_Shader: {fileID: 69, guid: 0000000000000000f000000000000000, type: 0}
  m_DeferredReflections:
    m_Mode: 1
    m_Shader: {fileID: 74, guid: 0000000000000000f000000000000000, type: 0}
  m_ScreenSpaceShadows:
    m_Mode: 1
    m_Shader: {fileID: 64, guid: 0000000000000000f000000000000000, type: 0}
  m_LegacyDeferred:
    m_Mode: 1
    m_Shader: {fileID: 63, guid: 0000000000000000f000000000000000, type: 0}
  m_DepthNormals:
    m_Mode: 1
    m_Shader: {fileID: 62, guid: 0000000000000000f000000000000000, type: 0}
  m_MotionVectors:
    m_Mode: 1
    m_Shader: {fileID: 75, guid: 0000000000000000f000000000000000, type: 0}
  m_LightHalo:
    m_Mode: 1
    m_Shader: {fileID: 105, guid: 0000000000000000f000000000000000, type: 0}
  m_LensFlare:
    m_Mode: 1
    m_Shader: {fileID: 102, guid: 0000000000000000f000000000000000, type: 0}
  m_AlwaysIncludedShaders:
  - {fileID: 7, guid: 0000000000000000f000000000000000, type: 0}
  - {fileID: 15104, guid: 0000000000000000f000000000000000, type: 0}
  - {fileID: 15105, guid: 0000000000000000f000000000000000, type: 0}
  - {fileID: 15106, guid: 0000000000000000f000000000000000, type: 0}
  - {fileID: 10753, guid: 0000000000000000f000000000000000, type: 0}
  - {fileID: 10770, guid: 0000000000000000f000000000000000, type: 0}
  - {fileID: 10782, guid: 0000000000000000f000000000000000, type: 0}
  - {fileID: 16000, guid: 0000000000000000f000000000000000, type: 0}
  - {fileID: 16001, guid: 0000000000000000f000000000000000, type: 0}
  m_PreloadedShaders: []
  m_SpritesDefaultMaterial: {fileID: 10754, guid: 0000000000000000f000000000000000,
    type: 0}
  m_CustomRenderPipeline: {fileID: 0}
  m_TransparencySortMode: 0
  m_TransparencySortAxis: {x: 0, y: 0, z: 1}
  m_DefaultRenderingPath: 1
  m_DefaultMobileRenderingPath: 1
  m_TierSettings:
  - serializedVersion: 4
    m_BuildTarget: 13
    m_Tier: 0
    m_Settings:
      standardShaderQuality: 2
      renderingPath: 1
      hdrMode: 1
      realtimeGICPUUsage: 25
      useReflectionProbeBoxProjection: 1
      useReflectionProbeBlending: 1
      useHDR: 1
      useDetailNormalMap: 0
      useCascadedShadowMaps: 1
      useDitherMaskForAlphaBlendedShadows: 0
    m_Automatic: 1
  m_LightmapStripping: 0
  m_FogStripping: 0
  m_InstancingStripping: 0
  m_LightmapKeepPlain: 1
  m_LightmapKeepDirCombined: 1
  m_LightmapKeepDynamicPlain: 1
  m_LightmapKeepDynamicDirCombined: 1
  m_LightmapKeepShadowMask: 1
  m_LightmapKeepSubtractive: 1
  m_FogKeepLinear: 1
  m_FogKeepExp: 1
  m_FogKeepExp2: 1
  m_AlbedoSwatchInfos: []
  m_LightsUseLinearIntensity: 0
  m_LightsUseColorTemperature: 0
");

//7. InputManager.asset
$InputManager_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!13 &1
InputManager:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Axes:
  - serializedVersion: 3
    m_Name: Horizontal
    descriptiveName:
    descriptiveNegativeName:
    negativeButton: left
    positiveButton: right
    altNegativeButton: a
    altPositiveButton: d
    gravity: 3
    dead: 0.001
    sensitivity: 3
    snap: 1
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Vertical
    descriptiveName:
    descriptiveNegativeName:
    negativeButton: down
    positiveButton: up
    altNegativeButton: s
    altPositiveButton: w
    gravity: 3
    dead: 0.001
    sensitivity: 3
    snap: 1
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Fire1
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton: left ctrl
    altNegativeButton:
    altPositiveButton: mouse 0
    gravity: 1000
    dead: 0.001
    sensitivity: 1000
    snap: 0
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Fire2
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton: left alt
    altNegativeButton:
    altPositiveButton: mouse 1
    gravity: 1000
    dead: 0.001
    sensitivity: 1000
    snap: 0
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Fire3
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton: left shift
    altNegativeButton:
    altPositiveButton: mouse 2
    gravity: 1000
    dead: 0.001
    sensitivity: 1000
    snap: 0
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Jump
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton: space
    altNegativeButton:
    altPositiveButton:
    gravity: 1000
    dead: 0.001
    sensitivity: 1000
    snap: 0
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Mouse X
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton:
    altNegativeButton:
    altPositiveButton:
    gravity: 0
    dead: 0
    sensitivity: 0.1
    snap: 0
    invert: 0
    type: 1
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Mouse Y
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton:
    altNegativeButton:
    altPositiveButton:
    gravity: 0
    dead: 0
    sensitivity: 0.1
    snap: 0
    invert: 0
    type: 1
    axis: 1
    joyNum: 0
  - serializedVersion: 3
    m_Name: Mouse ScrollWheel
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton:
    altNegativeButton:
    altPositiveButton:
    gravity: 0
    dead: 0
    sensitivity: 0.1
    snap: 0
    invert: 0
    type: 1
    axis: 2
    joyNum: 0
  - serializedVersion: 3
    m_Name: Horizontal
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton:
    altNegativeButton:
    altPositiveButton:
    gravity: 0
    dead: 0.19
    sensitivity: 1
    snap: 0
    invert: 0
    type: 2
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Vertical
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton:
    altNegativeButton:
    altPositiveButton:
    gravity: 0
    dead: 0.19
    sensitivity: 1
    snap: 0
    invert: 1
    type: 2
    axis: 1
    joyNum: 0
  - serializedVersion: 3
    m_Name: Fire1
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton: joystick button 0
    altNegativeButton:
    altPositiveButton:
    gravity: 1000
    dead: 0.001
    sensitivity: 1000
    snap: 0
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Fire2
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton: joystick button 1
    altNegativeButton:
    altPositiveButton:
    gravity: 1000
    dead: 0.001
    sensitivity: 1000
    snap: 0
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Fire3
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton: joystick button 2
    altNegativeButton:
    altPositiveButton:
    gravity: 1000
    dead: 0.001
    sensitivity: 1000
    snap: 0
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Jump
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton: joystick button 3
    altNegativeButton:
    altPositiveButton:
    gravity: 1000
    dead: 0.001
    sensitivity: 1000
    snap: 0
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Submit
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton: return
    altNegativeButton:
    altPositiveButton: joystick button 0
    gravity: 1000
    dead: 0.001
    sensitivity: 1000
    snap: 0
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Submit
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton: enter
    altNegativeButton:
    altPositiveButton: space
    gravity: 1000
    dead: 0.001
    sensitivity: 1000
    snap: 0
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
  - serializedVersion: 3
    m_Name: Cancel
    descriptiveName:
    descriptiveNegativeName:
    negativeButton:
    positiveButton: escape
    altNegativeButton:
    altPositiveButton: joystick button 1
    gravity: 1000
    dead: 0.001
    sensitivity: 1000
    snap: 0
    invert: 0
    type: 0
    axis: 0
    joyNum: 0
");

//8. NavMeshAreas.asset
$NavMeshAreas_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!126 &1
NavMeshProjectSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  areas:
  - name: Walkable
    cost: 1
  - name: Not Walkable
    cost: 1
  - name: Jump
    cost: 2
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
  - name:
    cost: 1
");

//9. NetworkManager.asset
$NetworkManager_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!149 &1
NetworkManager:
  m_ObjectHideFlags: 0
  m_DebugLevel: 0
  m_Sendrate: 15
  m_AssetToPrefab: {}
");

//10. Physics2DSettings.asset
$Physics2DSettings_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!19 &1
Physics2DSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Gravity: {x: 0, y: -9.81}
  m_DefaultMaterial: {fileID: 0}
  m_VelocityIterations: 8
  m_PositionIterations: 3
  m_VelocityThreshold: 1
  m_MaxLinearCorrection: 0.2
  m_MaxAngularCorrection: 8
  m_MaxTranslationSpeed: 100
  m_MaxRotationSpeed: 360
  m_MinPenetrationForPenalty: 0.01
  m_BaumgarteScale: 0.2
  m_BaumgarteTimeOfImpactScale: 0.75
  m_TimeToSleep: 0.5
  m_LinearSleepTolerance: 0.01
  m_AngularSleepTolerance: 2
  m_QueriesHitTriggers: 1
  m_QueriesStartInColliders: 1
  m_ChangeStopsCallbacks: 0
  m_AlwaysShowColliders: 0
  m_ShowColliderSleep: 1
  m_ShowColliderContacts: 0
  m_ShowColliderAABB: 0
  m_ContactArrowScale: 0.2
  m_ColliderAwakeColor: {r: 0.5686275, g: 0.95686275, b: 0.54509807, a: 0.7529412}
  m_ColliderAsleepColor: {r: 0.5686275, g: 0.95686275, b: 0.54509807, a: 0.36078432}
  m_ColliderContactColor: {r: 1, g: 0, b: 1, a: 0.6862745}
  m_ColliderAABBColor: {r: 1, g: 1, b: 0, a: 0.2509804}
  m_LayerCollisionMatrix: ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
");

//11. ProjectSettings.asset
$ProjectSettings_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!129 &1
PlayerSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 11
  productGUID: 9f962b8eaa7bce54abb4af740c31f44c
  AndroidProfiler: 0
  defaultScreenOrientation: 4
  targetDevice: 2
  useOnDemandResources: 0
  accelerometerFrequency: 60
  companyName: CERTH/ITI
  productName: Wind Farm Simulator
  defaultCursor: {fileID: 0}
  cursorHotspot: {x: 0, y: 0}
  m_SplashScreenBackgroundColor: {r: 0.13333334, g: 0.17254902, b: 0.21176471, a: 1}
  m_ShowUnitySplashScreen: 1
  m_ShowUnitySplashLogo: 1
  m_SplashScreenOverlayOpacity: 1
  m_SplashScreenAnimation: 1
  m_SplashScreenLogoStyle: 0
  m_SplashScreenDrawMode: 0
  m_SplashScreenBackgroundAnimationZoom: 1
  m_SplashScreenLogoAnimationZoom: 1
  m_SplashScreenBackgroundLandscapeAspect: 1
  m_SplashScreenBackgroundPortraitAspect: 1
  m_SplashScreenBackgroundLandscapeUvs:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  m_SplashScreenBackgroundPortraitUvs:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  m_SplashScreenLogos: []
  m_SplashScreenBackgroundLandscape: {fileID: 0}
  m_SplashScreenBackgroundPortrait: {fileID: 0}
  m_VirtualRealitySplashScreen: {fileID: 0}
  m_HolographicTrackingLossScreen: {fileID: 0}
  defaultScreenWidth: 1366
  defaultScreenHeight: 768
  defaultScreenWidthWeb: 1366
  defaultScreenHeightWeb: 768
  m_StereoRenderingPath: 0
  m_ActiveColorSpace: 0
  m_MTRendering: 1
  m_MobileMTRendering: 0
  m_StackTraceTypes: 020000000200000002000000020000000200000001000000
  iosShowActivityIndicatorOnLoading: -1
  androidShowActivityIndicatorOnLoading: -1
  tizenShowActivityIndicatorOnLoading: -1
  iosAppInBackgroundBehavior: 0
  displayResolutionDialog: 1
  iosAllowHTTPDownload: 1
  allowedAutorotateToPortrait: 1
  allowedAutorotateToPortraitUpsideDown: 1
  allowedAutorotateToLandscapeRight: 1
  allowedAutorotateToLandscapeLeft: 1
  useOSAutorotation: 1
  use32BitDisplayBuffer: 1
  disableDepthAndStencilBuffers: 0
  defaultIsFullScreen: 0
  defaultIsNativeResolution: 0
  runInBackground: 0
  captureSingleScreen: 0
  muteOtherAudioSources: 0
  Prepare IOS For Recording: 0
  submitAnalytics: 1
  usePlayerLog: 1
  bakeCollisionMeshes: 0
  forceSingleInstance: 0
  resizableWindow: 0
  useMacAppStoreValidation: 0
  gpuSkinning: 0
  graphicsJobs: 0
  xboxPIXTextureCapture: 0
  xboxEnableAvatar: 0
  xboxEnableKinect: 0
  xboxEnableKinectAutoTracking: 0
  xboxEnableFitness: 0
  visibleInBackground: 0
  allowFullscreenSwitch: 1
  graphicsJobMode: 0
  macFullscreenMode: 2
  d3d9FullscreenMode: 1
  d3d11FullscreenMode: 1
  xboxSpeechDB: 0
  xboxEnableHeadOrientation: 0
  xboxEnableGuest: 0
  xboxEnablePIXSampling: 0
  n3dsDisableStereoscopicView: 0
  n3dsEnableSharedListOpt: 1
  n3dsEnableVSync: 0
  ignoreAlphaClear: 0
  xboxOneResolution: 0
  xboxOneMonoLoggingLevel: 0
  xboxOneLoggingLevel: 1
  videoMemoryForVertexBuffers: 0
  psp2PowerMode: 0
  psp2AcquireBGM: 1
  wiiUTVResolution: 0
  wiiUGamePadMSAA: 1
  wiiUSupportsNunchuk: 0
  wiiUSupportsClassicController: 0
  wiiUSupportsBalanceBoard: 0
  wiiUSupportsMotionPlus: 0
  wiiUSupportsProController: 0
  wiiUAllowScreenCapture: 1
  wiiUControllerCount: 0
  m_SupportedAspectRatios:
    4:3: 0
    5:4: 0
    16:10: 1
    16:9: 1
    Others: 0
  bundleVersion: ___[game_version_number_dotted]___
  preloadedAssets: []
  metroInputSource: 0
  m_HolographicPauseOnTrackingLoss: 1
  xboxOneDisableKinectGpuReservation: 0
  xboxOneEnable7thCore: 0
  vrSettings:
    cardboard:
      depthFormat: 0
      enableTransitionView: 0
    daydream:
      depthFormat: 0
      useSustainedPerformanceMode: 0
    hololens:
      depthFormat: 1
  protectGraphicsMemory: 0
  useHDRDisplay: 0
  applicationIdentifier:
    Android: com.Company.ProductName
    Standalone: unity.CERTH/ITI.Wind Farm Simulator
    Tizen: com.Company.ProductName
    iOS: com.Company.ProductName
    tvOS: com.Company.ProductName
  buildNumber:
    Standalone: ___[game_version_number]___
    iOS: ___[game_version_number]___
  AndroidBundleVersionCode: ___[game_version_number]___
  AndroidMinSdkVersion: 16
  AndroidTargetSdkVersion: 0
  AndroidPreferredInstallLocation: 1
  aotOptions:
  stripEngineCode: 1
  iPhoneStrippingLevel: 0
  iPhoneScriptCallOptimization: 0
  ForceInternetPermission: 0
  ForceSDCardPermission: 0
  CreateWallpaper: 0
  APKExpansionFiles: 0
  keepLoadedShadersAlive: 0
  StripUnusedMeshComponents: 0
  VertexChannelCompressionMask:
    serializedVersion: 2
    m_Bits: 238
  iPhoneSdkVersion: 988
  iOSTargetOSVersionString:
  tvOSSdkVersion: 0
  tvOSRequireExtendedGameController: 0
  tvOSTargetOSVersionString:
  uIPrerenderedIcon: 0
  uIRequiresPersistentWiFi: 0
  uIRequiresFullScreen: 1
  uIStatusBarHidden: 1
  uIExitOnSuspend: 0
  uIStatusBarStyle: 0
  iPhoneSplashScreen: {fileID: 0}
  iPhoneHighResSplashScreen: {fileID: 0}
  iPhoneTallHighResSplashScreen: {fileID: 0}
  iPhone47inSplashScreen: {fileID: 0}
  iPhone55inPortraitSplashScreen: {fileID: 0}
  iPhone55inLandscapeSplashScreen: {fileID: 0}
  iPadPortraitSplashScreen: {fileID: 0}
  iPadHighResPortraitSplashScreen: {fileID: 0}
  iPadLandscapeSplashScreen: {fileID: 0}
  iPadHighResLandscapeSplashScreen: {fileID: 0}
  appleTVSplashScreen: {fileID: 0}
  tvOSSmallIconLayers: []
  tvOSLargeIconLayers: []
  tvOSTopShelfImageLayers: []
  tvOSTopShelfImageWideLayers: []
  iOSLaunchScreenType: 0
  iOSLaunchScreenPortrait: {fileID: 0}
  iOSLaunchScreenLandscape: {fileID: 0}
  iOSLaunchScreenBackgroundColor:
    serializedVersion: 2
    rgba: 0
  iOSLaunchScreenFillPct: 100
  iOSLaunchScreenSize: 100
  iOSLaunchScreenCustomXibPath:
  iOSLaunchScreeniPadType: 0
  iOSLaunchScreeniPadImage: {fileID: 0}
  iOSLaunchScreeniPadBackgroundColor:
    serializedVersion: 2
    rgba: 0
  iOSLaunchScreeniPadFillPct: 100
  iOSLaunchScreeniPadSize: 100
  iOSLaunchScreeniPadCustomXibPath:
  iOSDeviceRequirements: []
  iOSURLSchemes: []
  iOSBackgroundModes: 0
  iOSMetalForceHardShadows: 0
  metalEditorSupport: 0
  metalAPIValidation: 1
  appleDeveloperTeamID:
  iOSManualSigningProvisioningProfileID:
  tvOSManualSigningProvisioningProfileID:
  appleEnableAutomaticSigning: 0
  AndroidTargetDevice: 0
  AndroidSplashScreenScale: 0
  androidSplashScreen: {fileID: 0}
  AndroidKeystoreName:
  AndroidKeyaliasName:
  AndroidTVCompatibility: 1
  AndroidIsGame: 1
  androidEnableBanner: 1
  m_AndroidBanners:
  - width: 320
    height: 180
    banner: {fileID: 0}
  androidGamepadSupportLevel: 0
  resolutionDialogBanner: {fileID: 0}
  m_BuildTargetIcons:
  - m_BuildTarget:
    m_Icons:
    - serializedVersion: 2
      m_Icon: {fileID: 2800000, guid: 8e2184ae8f39b5240a14a2e453a6de3d, type: 3}
      m_Width: 128
      m_Height: 128
  m_BuildTargetBatching: []
  m_BuildTargetGraphicsAPIs: []
  m_BuildTargetVRSettings: []
  openGLRequireES31: 0
  openGLRequireES31AEP: 0
  webPlayerTemplate: APPLICATION:Default
  m_TemplateCustomTags: {}
  wiiUTitleID: 0005000011000000
  wiiUGroupID: 00010000
  wiiUCommonSaveSize: 4096
  wiiUAccountSaveSize: 2048
  wiiUOlvAccessKey: 0
  wiiUTinCode: 0
  wiiUJoinGameId: 0
  wiiUJoinGameModeMask: 0000000000000000
  wiiUCommonBossSize: 0
  wiiUAccountBossSize: 0
  wiiUAddOnUniqueIDs: []
  wiiUMainThreadStackSize: 3072
  wiiULoaderThreadStackSize: 1024
  wiiUSystemHeapSize: 128
  wiiUTVStartupScreen: {fileID: 0}
  wiiUGamePadStartupScreen: {fileID: 0}
  wiiUDrcBufferDisabled: 0
  wiiUProfilerLibPath:
  actionOnDotNetUnhandledException: 1
  enableInternalProfiler: 0
  logObjCUncaughtExceptions: 1
  enableCrashReportAPI: 0
  cameraUsageDescription:
  locationUsageDescription:
  microphoneUsageDescription:
  switchNetLibKey:
  switchSocketMemoryPoolSize: 6144
  switchSocketAllocatorPoolSize: 128
  switchSocketConcurrencyLimit: 14
  switchUseCPUProfiler: 0
  switchApplicationID: 0x0005000C10000001
  switchNSODependencies:
  switchTitleNames_0:
  switchTitleNames_1:
  switchTitleNames_2:
  switchTitleNames_3:
  switchTitleNames_4:
  switchTitleNames_5:
  switchTitleNames_6:
  switchTitleNames_7:
  switchTitleNames_8:
  switchTitleNames_9:
  switchTitleNames_10:
  switchTitleNames_11:
  switchTitleNames_12:
  switchTitleNames_13:
  switchTitleNames_14:
  switchPublisherNames_0:
  switchPublisherNames_1:
  switchPublisherNames_2:
  switchPublisherNames_3:
  switchPublisherNames_4:
  switchPublisherNames_5:
  switchPublisherNames_6:
  switchPublisherNames_7:
  switchPublisherNames_8:
  switchPublisherNames_9:
  switchPublisherNames_10:
  switchPublisherNames_11:
  switchPublisherNames_12:
  switchPublisherNames_13:
  switchPublisherNames_14:
  switchIcons_0: {fileID: 0}
  switchIcons_1: {fileID: 0}
  switchIcons_2: {fileID: 0}
  switchIcons_3: {fileID: 0}
  switchIcons_4: {fileID: 0}
  switchIcons_5: {fileID: 0}
  switchIcons_6: {fileID: 0}
  switchIcons_7: {fileID: 0}
  switchIcons_8: {fileID: 0}
  switchIcons_9: {fileID: 0}
  switchIcons_10: {fileID: 0}
  switchIcons_11: {fileID: 0}
  switchIcons_12: {fileID: 0}
  switchIcons_13: {fileID: 0}
  switchIcons_14: {fileID: 0}
  switchSmallIcons_0: {fileID: 0}
  switchSmallIcons_1: {fileID: 0}
  switchSmallIcons_2: {fileID: 0}
  switchSmallIcons_3: {fileID: 0}
  switchSmallIcons_4: {fileID: 0}
  switchSmallIcons_5: {fileID: 0}
  switchSmallIcons_6: {fileID: 0}
  switchSmallIcons_7: {fileID: 0}
  switchSmallIcons_8: {fileID: 0}
  switchSmallIcons_9: {fileID: 0}
  switchSmallIcons_10: {fileID: 0}
  switchSmallIcons_11: {fileID: 0}
  switchSmallIcons_12: {fileID: 0}
  switchSmallIcons_13: {fileID: 0}
  switchSmallIcons_14: {fileID: 0}
  switchManualHTML:
  switchAccessibleURLs:
  switchLegalInformation:
  switchMainThreadStackSize: 1048576
  switchPresenceGroupId: 0x0005000C10000001
  switchLogoHandling: 0
  switchReleaseVersion: 0
  switchDisplayVersion: 1.0.0
  switchStartupUserAccount: 0
  switchTouchScreenUsage: 0
  switchSupportedLanguagesMask: 0
  switchLogoType: 0
  switchApplicationErrorCodeCategory:
  switchUserAccountSaveDataSize: 0
  switchUserAccountSaveDataJournalSize: 0
  switchAttribute: 0
  switchCardSpecSize: 4
  switchCardSpecClock: 25
  switchRatingsMask: 0
  switchRatingsInt_0: 0
  switchRatingsInt_1: 0
  switchRatingsInt_2: 0
  switchRatingsInt_3: 0
  switchRatingsInt_4: 0
  switchRatingsInt_5: 0
  switchRatingsInt_6: 0
  switchRatingsInt_7: 0
  switchRatingsInt_8: 0
  switchRatingsInt_9: 0
  switchRatingsInt_10: 0
  switchRatingsInt_11: 0
  switchLocalCommunicationIds_0: 0x0005000C10000001
  switchLocalCommunicationIds_1:
  switchLocalCommunicationIds_2:
  switchLocalCommunicationIds_3:
  switchLocalCommunicationIds_4:
  switchLocalCommunicationIds_5:
  switchLocalCommunicationIds_6:
  switchLocalCommunicationIds_7:
  switchParentalControl: 0
  switchAllowsScreenshot: 1
  switchDataLossConfirmation: 0
  ps4NPAgeRating: 12
  ps4NPTitleSecret:
  ps4NPTrophyPackPath:
  ps4ParentalLevel: 1
  ps4ContentID: ED1633-NPXX51362_00-0000000000000000
  ps4Category: 0
  ps4MasterVersion: 01.00
  ps4AppVersion: 01.00
  ps4AppType: 0
  ps4ParamSfxPath:
  ps4VideoOutPixelFormat: 0
  ps4VideoOutInitialWidth: 1920
  ps4VideoOutBaseModeInitialWidth: 1920
  ps4VideoOutReprojectionRate: 120
  ps4PronunciationXMLPath:
  ps4PronunciationSIGPath:
  ps4BackgroundImagePath:
  ps4StartupImagePath:
  ps4SaveDataImagePath:
  ps4SdkOverride:
  ps4BGMPath:
  ps4ShareFilePath:
  ps4ShareOverlayImagePath:
  ps4PrivacyGuardImagePath:
  ps4NPtitleDatPath:
  ps4RemotePlayKeyAssignment: -1
  ps4RemotePlayKeyMappingDir:
  ps4PlayTogetherPlayerCount: 0
  ps4EnterButtonAssignment: 1
  ps4ApplicationParam1: 0
  ps4ApplicationParam2: 0
  ps4ApplicationParam3: 0
  ps4ApplicationParam4: 0
  ps4DownloadDataSize: 0
  ps4GarlicHeapSize: 2048
  ps4ProGarlicHeapSize: 2560
  ps4Passcode: frAQBc8Wsa1xVPfvJcrgRYwTiizs2trQ
  ps4UseDebugIl2cppLibs: 0
  ps4pnSessions: 1
  ps4pnPresence: 1
  ps4pnFriends: 1
  ps4pnGameCustomData: 1
  playerPrefsSupport: 0
  restrictedAudioUsageRights: 0
  ps4UseResolutionFallback: 0
  ps4ReprojectionSupport: 0
  ps4UseAudio3dBackend: 0
  ps4SocialScreenEnabled: 0
  ps4ScriptOptimizationLevel: 3
  ps4Audio3dVirtualSpeakerCount: 14
  ps4attribCpuUsage: 0
  ps4PatchPkgPath:
  ps4PatchLatestPkgPath:
  ps4PatchChangeinfoPath:
  ps4PatchDayOne: 0
  ps4attribUserManagement: 0
  ps4attribMoveSupport: 0
  ps4attrib3DSupport: 0
  ps4attribShareSupport: 0
  ps4attribExclusiveVR: 0
  ps4disableAutoHideSplash: 0
  ps4videoRecordingFeaturesUsed: 0
  ps4contentSearchFeaturesUsed: 0
  ps4attribEyeToEyeDistanceSettingVR: 0
  ps4IncludedModules: []
  monoEnv:
  psp2Splashimage: {fileID: 0}
  psp2NPTrophyPackPath:
  psp2NPSupportGBMorGJP: 0
  psp2NPAgeRating: 12
  psp2NPTitleDatPath:
  psp2NPCommsID:
  psp2NPCommunicationsID:
  psp2NPCommsPassphrase:
  psp2NPCommsSig:
  psp2ParamSfxPath:
  psp2ManualPath:
  psp2LiveAreaGatePath:
  psp2LiveAreaBackroundPath:
  psp2LiveAreaPath:
  psp2LiveAreaTrialPath:
  psp2PatchChangeInfoPath:
  psp2PatchOriginalPackage:
  psp2PackagePassword: F69AzBlax3CF3EDNhm3soLBPh71Yexui
  psp2KeystoneFile:
  psp2MemoryExpansionMode: 0
  psp2DRMType: 0
  psp2StorageType: 0
  psp2MediaCapacity: 0
  psp2DLCConfigPath:
  psp2ThumbnailPath:
  psp2BackgroundPath:
  psp2SoundPath:
  psp2TrophyCommId:
  psp2TrophyPackagePath:
  psp2PackagedResourcesPath:
  psp2SaveDataQuota: 10240
  psp2ParentalLevel: 1
  psp2ShortTitle: Not Set
  psp2ContentID: IV0000-ABCD12345_00-0123456789ABCDEF
  psp2Category: 0
  psp2MasterVersion: 01.00
  psp2AppVersion: 01.00
  psp2TVBootMode: 0
  psp2EnterButtonAssignment: 2
  psp2TVDisableEmu: 0
  psp2AllowTwitterDialog: 1
  psp2Upgradable: 0
  psp2HealthWarning: 0
  psp2UseLibLocation: 0
  psp2InfoBarOnStartup: 0
  psp2InfoBarColor: 0
  psp2UseDebugIl2cppLibs: 0
  psmSplashimage: {fileID: 0}
  splashScreenBackgroundSourceLandscape: {fileID: 0}
  splashScreenBackgroundSourcePortrait: {fileID: 0}
  spritePackerPolicy:
  webGLMemorySize: 800
  webGLExceptionSupport: 0
  webGLNameFilesAsHashes: 0
  webGLDataCaching: 0
  webGLDebugSymbols: 0
  webGLEmscriptenArgs:
  webGLModulesDirectory:
  webGLTemplate: APPLICATION:Minimal
  webGLAnalyzeBuildSize: 0
  webGLUseEmbeddedResources: 0
  webGLUseWasm: 0
  webGLCompressionFormat: 1
  scriptingDefineSymbols:
    1: CROSS_PLATFORM_INPUT
    4: CROSS_PLATFORM_INPUT;MOBILE_INPUT
    7: CROSS_PLATFORM_INPUT;MOBILE_INPUT
    13:
    14: MOBILE_INPUT
    17: MOBILE_INPUT
    20: MOBILE_INPUT
    22: MOBILE_INPUT
  platformArchitecture: {}
  scriptingBackend: {}
  incrementalIl2cppBuild: {}
  additionalIl2CppArgs:
  apiCompatibilityLevelPerPlatform: {}
  m_RenderingPath: 1
  m_MobileRenderingPath: 1
  metroPackageName: Wind Farm Simulator
  metroPackageVersion: ___[game_version_number_dotted]___
  metroCertificatePath:
  metroCertificatePassword:
  metroCertificateSubject:
  metroCertificateIssuer:
  metroCertificateNotAfter: 0000000000000000
  metroApplicationDescription: Wind Farm Simulator
  wsaImages: {}
  metroTileShortName:
  metroCommandLineArgsFile:
  metroTileShowName: 0
  metroMediumTileShowName: 0
  metroLargeTileShowName: 0
  metroWideTileShowName: 0
  metroDefaultTileSize: 1
  metroTileForegroundText: 2
  metroTileBackgroundColor: {r: 0.13333334, g: 0.17254902, b: 0.21568628, a: 0}
  metroSplashScreenBackgroundColor: {r: 0.12941177, g: 0.17254902, b: 0.21568628,
    a: 1}
  metroSplashScreenUseBackgroundColor: 0
  platformCapabilities: {}
  metroFTAName:
  metroFTAFileTypes: []
  metroProtocolName:
  metroCompilationOverrides: 1
  tizenProductDescription:
  tizenProductURL:
  tizenSigningProfileName:
  tizenGPSPermissions: 0
  tizenMicrophonePermissions: 0
  tizenDeploymentTarget:
  tizenDeploymentTargetType: 0
  tizenMinOSVersion: 0
  n3dsUseExtSaveData: 0
  n3dsCompressStaticMem: 1
  n3dsExtSaveDataNumber: 0x12345
  n3dsStackSize: 131072
  n3dsTargetPlatform: 2
  n3dsRegion: 7
  n3dsMediaSize: 0
  n3dsLogoStyle: 3
  n3dsTitle: GameName
  n3dsProductCode:
  n3dsApplicationId: 0xFF3FF
  stvDeviceAddress:
  stvProductDescription:
  stvProductAuthor:
  stvProductAuthorEmail:
  stvProductLink:
  stvProductCategory: 0
  XboxOneProductId:
  XboxOneUpdateKey:
  XboxOneSandboxId:
  XboxOneContentId:
  XboxOneTitleId:
  XboxOneSCId:
  XboxOneGameOsOverridePath:
  XboxOnePackagingOverridePath:
  XboxOneAppManifestOverridePath:
  XboxOnePackageEncryption: 0
  XboxOnePackageUpdateGranularity: 2
  XboxOneDescription:
  XboxOneLanguage:
  - enus
  XboxOneCapability: []
  XboxOneGameRating: {}
  XboxOneIsContentPackage: 0
  XboxOneEnableGPUVariability: 0
  XboxOneSockets: {}
  XboxOneSplashScreen: {fileID: 0}
  XboxOneAllowedProductIds: []
  XboxOnePersistentLocalStorageSize: 0
  xboxOneScriptCompiler: 0
  vrEditorSettings:
    daydream:
      daydreamIconForeground: {fileID: 0}
      daydreamIconBackground: {fileID: 0}
  cloudServicesEnabled:
    UNet: 1
  facebookSdkVersion: 7.9.1
  apiCompatibilityLevel: 2
  cloudProjectId: c0e995de-3a89-4b34-be1b-6cfa969e7463
  projectName: Wind Farm Simulator
  organizationId: pan_migo
  cloudEnabled: 0
  enableNewInputSystem: 0
");

//12. ProjectVersion.asset
$ProjectVersion_asset = array("m_EditorVersion: 5.6.0f3
");

//13. QualitySettings.asset
$QualitySettings_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!47 &1
QualitySettings:
  m_ObjectHideFlags: 0
  serializedVersion: 5
  m_CurrentQuality: 3
  m_QualitySettings:
  - serializedVersion: 2
    name: Fastest
    pixelLightCount: 4
    shadows: 0
    shadowResolution: 0
    shadowProjection: 1
    shadowCascades: 1
    shadowDistance: 15
    shadowNearPlaneOffset: 3
    shadowCascade2Split: 0.33333334
    shadowCascade4Split: {x: 0.06666667, y: 0.2, z: 0.46666667}
    blendWeights: 1
    textureQuality: 1
    anisotropicTextures: 0
    antiAliasing: 0
    softParticles: 0
    softVegetation: 0
    realtimeReflectionProbes: 0
    billboardsFaceCameraPosition: 0
    vSyncCount: 0
    lodBias: 0.3
    maximumLODLevel: 1
    particleRaycastBudget: 4
    asyncUploadTimeSlice: 2
    asyncUploadBufferSize: 4
    excludedTargetPlatforms: []
  - serializedVersion: 2
    name: Fast
    pixelLightCount: 0
    shadows: 0
    shadowResolution: 0
    shadowProjection: 1
    shadowCascades: 1
    shadowDistance: 20
    shadowNearPlaneOffset: 3
    shadowCascade2Split: 0.33333334
    shadowCascade4Split: {x: 0.06666667, y: 0.2, z: 0.46666667}
    blendWeights: 2
    textureQuality: 0
    anisotropicTextures: 0
    antiAliasing: 0
    softParticles: 0
    softVegetation: 0
    realtimeReflectionProbes: 0
    billboardsFaceCameraPosition: 0
    vSyncCount: 0
    lodBias: 0.4
    maximumLODLevel: 0
    particleRaycastBudget: 16
    asyncUploadTimeSlice: 2
    asyncUploadBufferSize: 4
    excludedTargetPlatforms: []
  - serializedVersion: 2
    name: Simple
    pixelLightCount: 1
    shadows: 0
    shadowResolution: 0
    shadowProjection: 1
    shadowCascades: 1
    shadowDistance: 20
    shadowNearPlaneOffset: 3
    shadowCascade2Split: 0.33333334
    shadowCascade4Split: {x: 0.06666667, y: 0.2, z: 0.46666667}
    blendWeights: 2
    textureQuality: 0
    anisotropicTextures: 1
    antiAliasing: 0
    softParticles: 0
    softVegetation: 0
    realtimeReflectionProbes: 0
    billboardsFaceCameraPosition: 0
    vSyncCount: 1
    lodBias: 0.7
    maximumLODLevel: 0
    particleRaycastBudget: 64
    asyncUploadTimeSlice: 2
    asyncUploadBufferSize: 4
    excludedTargetPlatforms: []
  - serializedVersion: 2
    name: Good
    pixelLightCount: 2
    shadows: 2
    shadowResolution: 1
    shadowProjection: 1
    shadowCascades: 2
    shadowDistance: 50
    shadowNearPlaneOffset: 3
    shadowCascade2Split: 0.33333334
    shadowCascade4Split: {x: 0.06666667, y: 0.2, z: 0.46666667}
    blendWeights: 2
    textureQuality: 0
    anisotropicTextures: 1
    antiAliasing: 0
    softParticles: 0
    softVegetation: 1
    realtimeReflectionProbes: 0
    billboardsFaceCameraPosition: 1
    vSyncCount: 1
    lodBias: 1
    maximumLODLevel: 0
    particleRaycastBudget: 256
    asyncUploadTimeSlice: 2
    asyncUploadBufferSize: 4
    excludedTargetPlatforms: []
  - serializedVersion: 2
    name: Beautiful
    pixelLightCount: 3
    shadows: 2
    shadowResolution: 2
    shadowProjection: 1
    shadowCascades: 2
    shadowDistance: 120
    shadowNearPlaneOffset: 3
    shadowCascade2Split: 0.33333334
    shadowCascade4Split: {x: 0.06666667, y: 0.2, z: 0.46666667}
    blendWeights: 4
    textureQuality: 0
    anisotropicTextures: 2
    antiAliasing: 2
    softParticles: 1
    softVegetation: 1
    realtimeReflectionProbes: 1
    billboardsFaceCameraPosition: 1
    vSyncCount: 0
    lodBias: 1.5
    maximumLODLevel: 0
    particleRaycastBudget: 1024
    asyncUploadTimeSlice: 2
    asyncUploadBufferSize: 4
    excludedTargetPlatforms: []
  - serializedVersion: 2
    name: Fantastic
    pixelLightCount: 4
    shadows: 2
    shadowResolution: 0
    shadowProjection: 1
    shadowCascades: 4
    shadowDistance: 150
    shadowNearPlaneOffset: 3
    shadowCascade2Split: 0.33333334
    shadowCascade4Split: {x: 0.06666667, y: 0.2, z: 0.46666667}
    blendWeights: 4
    textureQuality: 0
    anisotropicTextures: 2
    antiAliasing: 2
    softParticles: 0
    softVegetation: 1
    realtimeReflectionProbes: 1
    billboardsFaceCameraPosition: 1
    vSyncCount: 0
    lodBias: 2
    maximumLODLevel: 0
    particleRaycastBudget: 4096
    asyncUploadTimeSlice: 2
    asyncUploadBufferSize: 4
    excludedTargetPlatforms: []
  m_PerPlatformDefaultQuality:
    Android: 3
    Nintendo 3DS: 5
    PS4: 5
    PSM: 5
    PSP2: 2
    Samsung TV: 2
    Standalone: 3
    Tizen: 2
    Web: 5
    WebGL: 3
    WiiU: 5
    Windows Store Apps: 5
    XboxOne: 5
    iPhone: 2
    tvOS: 5
");

//14. TagManager.asset
$TagManager_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!78 &1
TagManager:
  serializedVersion: 2
  tags:
  - consumer
  - producer
  - terrain
  - producer_mesh
  layers:
  - Default
  - TransparentFX
  - Ignore Raycast
  -
  - Water
  - UI
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  -
  m_SortingLayers:
  - name: Default
    uniqueID: 0
    locked: 0
");

//15. TimeManager.asset
$TimeManager_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!5 &1
TimeManager:
  m_ObjectHideFlags: 0
  Fixed Timestep: 0.02
  Maximum Allowed Timestep: 0.33333334
  m_TimeScale: 1
  Maximum Particle Timestep: 0.03
");

//16. UnityConnect.asset
$UnityConnect_asset = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!310 &1
UnityConnectSettings:
  m_ObjectHideFlags: 0
  m_Enabled: 0
  m_TestMode: 0
  m_TestEventUrl:
  m_TestConfigUrl:
  CrashReportingSettings:
    m_EventUrl: https://perf-events.cloud.unity3d.com/api/events/crashes
    m_Enabled: 0
    m_CaptureEditorExceptions: 1
  UnityPurchasingSettings:
    m_Enabled: 0
    m_TestMode: 0
  UnityAnalyticsSettings:
    m_Enabled: 1
    m_InitializeOnStartup: 1
    m_TestMode: 0
    m_TestEventUrl:
    m_TestConfigUrl:
  UnityAdsSettings:
    m_Enabled: 0
    m_InitializeOnStartup: 1
    m_TestMode: 0
    m_EnabledPlatforms: 4294967295
    m_IosGameId:
    m_AndroidGameId:
");

function wpunity_default_value_AudioManager_energy_get(){
    global $AudioManager_asset;
    return $AudioManager_asset[0];
}

function wpunity_default_value_ClusterInputManager_energy_get(){
    global $ClusterInputManager_asset;
    return $ClusterInputManager_asset[0];
}

function wpunity_default_value_DynamicsManager_energy_get(){
    global $DynamicsManager_asset;
    return $DynamicsManager_asset[0];
}

function wpunity_default_value_EditorBuildSettings_energy_get(){
    global $EditorBuildSettings_asset;
    return $EditorBuildSettings_asset[0];
}

function wpunity_default_value_EditorSettings_energy_get(){
    global $EditorSettings_asset;
    return $EditorSettings_asset[0];
}

function wpunity_default_value_GraphicsSettings_energy_get(){
    global $GraphicsSettings_asset;
    return $GraphicsSettings_asset[0];
}

function wpunity_default_value_InputManager_energy_get(){
    global $InputManager_asset;
    return $InputManager_asset[0];
}

function wpunity_default_value_NavMeshAreas_energy_get(){
    global $NavMeshAreas_asset;
    return $NavMeshAreas_asset[0];
}

function wpunity_default_value_NetworkManager_energy_get(){
    global $NetworkManager_asset;
    return $NetworkManager_asset[0];
}

function wpunity_default_value_Physics2DSettings_energy_get(){
    global $Physics2DSettings_asset;
    return $Physics2DSettings_asset[0];
}

function wpunity_default_value_ProjectSettings_energy_get(){
    global $ProjectSettings_asset;
    return $ProjectSettings_asset[0];
}

function wpunity_default_value_ProjectVersion_energy_get(){
    global $ProjectVersion_asset;
    return $ProjectVersion_asset[0];
}

function wpunity_default_value_QualitySettings_energy_get(){
    global $QualitySettings_asset;
    return $QualitySettings_asset[0];
}

function wpunity_default_value_TagManager_energy_get(){
    global $TagManager_asset;
    return $TagManager_asset[0];
}

function wpunity_default_value_TimeManager_energy_get(){
    global $TimeManager_asset;
    return $TimeManager_asset[0];
}

function wpunity_default_value_unityConnect_energy_get(){
    global $UnityConnect_asset;
    return $UnityConnect_asset[0];
}




/***************************************************************************************************************/
// YAMLS for SCENES default values (ENERGY GAMES)
/***************************************************************************************************************/

function wpunity_getAssetYAML_energy($myasset_type){
  $def_json = '';

  if($myasset_type == 'decor') {
    $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/assets/energy-decor.txt");
  }elseif($myasset_type == 'marker'){
    $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/assets/energy-marker.txt");
  }elseif($myasset_type == 'terrain'){
    $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/assets/energy-terrain.txt");
  }

  return $def_json;
}

function wpunity_getSceneYAML_energy($myscene_type){
  $def_json = '';

  if($myscene_type == 'menu') {
      $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/scenes/energy-menu.txt");
  }elseif($myscene_type == 'credits'){
      $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/scenes/energy-credits.txt");
  }elseif($myscene_type == 'help'){
    $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/scenes/energy-help.txt");
  }elseif($myscene_type == 'login'){
    $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/scenes/energy-login.txt");
  }elseif($myscene_type == 'selector'){
    $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/scenes/energy-selector.txt");
  }elseif($myscene_type == 'regional'){
    $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/scenes/energy-regional.txt");
  }elseif($myscene_type == 'fields'){
    $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/scenes/energy-simuFields.txt");
  }elseif($myscene_type == 'mountains'){
    $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/scenes/energy-simuMountains.txt");
  }elseif($myscene_type == 'seashore'){
    $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/scenes/energy-simuSeashore.txt");
  }elseif($myscene_type == 'stats'){
    $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/scenes/energy-stats.txt");
  }elseif($myscene_type == 'turbines'){
    $def_json = file_get_contents(WP_PLUGIN_DIR . "/wordpressunity3deditor/includes/default_game_project_data/energy/scenes/energy-turbselection.txt");
  }elseif($myscene_type == 'reward'){
    $def_json = '';
  }elseif($myscene_type == 'selector'){
    $def_json = '';
  }

  return $def_json;
}


global $ini_educational_energy,$ini_scene_main_menu_unity_pattern,$ini_scene_credits_unity_pattern,$ini_scene_options_unity_pattern,$ini_scene_help_unity_pattern;
global $ini_scene_login_unity_pattern,$ini_scene_reward_unity_pattern,$ini_scene_selector_unity_pattern,$ini_scene_selector_unity_pattern2,$ini_scene_selector_text;

$ini_scene_main_menu_unity_pattern = array('');

$ini_scene_credits_unity_pattern = array('');

$ini_scene_options_unity_pattern = array('');

$ini_scene_help_unity_pattern = array('');

$ini_scene_login_unity_pattern = array('');

$ini_scene_reward_unity_pattern = array('');

$ini_scene_selector_unity_pattern = array('');

$ini_scene_selector_unity_pattern2 = array('');

$ini_scene_selector_text = '';

$ini_educational_energy = array('');

function wpunity_default_value_mmenu_unity_energy_get(){
    global $ini_scene_main_menu_unity_pattern;
    return $ini_scene_main_menu_unity_pattern[0];
}

function wpunity_default_value_credits_unity_energy_get(){
    global $ini_scene_credits_unity_pattern;
    return $ini_scene_credits_unity_pattern[0];
}

function wpunity_default_value_options_unity_energy_get(){
    global $ini_scene_options_unity_pattern;
    return $ini_scene_options_unity_pattern[0];
}

function wpunity_default_value_help_unity_energy_get(){
    global $ini_scene_help_unity_pattern;
    return $ini_scene_help_unity_pattern[0];
}

function wpunity_default_value_login_unity_energy_get(){
    global $ini_scene_login_unity_pattern;
    return $ini_scene_login_unity_pattern[0];
}

function wpunity_default_value_reward_unity_energy_get(){
    global $ini_scene_reward_unity_pattern;
    return $ini_scene_reward_unity_pattern[0];
}

function wpunity_default_value_selector_unity_energy_get(){
    global $ini_scene_selector_unity_pattern;
    return $ini_scene_selector_unity_pattern[0];
}

function wpunity_default_value_selector2_unity_energy_get(){
    global $ini_scene_selector_unity_pattern2;
    return $ini_scene_selector_unity_pattern2[0];
}

function wpunity_default_value_selectortext_unity_energy_get(){
    global $ini_scene_selector_text;
    return $ini_scene_selector_text;
}

function wpunity_default_value_educational_unity_energy_get(){
    global $ini_educational_energy;
    return $ini_educational_energy[0];
}

/***************************************************************************************************************/
//
/***************************************************************************************************************/
?>