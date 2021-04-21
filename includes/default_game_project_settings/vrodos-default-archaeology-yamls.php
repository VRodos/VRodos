<?php

/***************************************************************************************************************/
// YAMLS for ASSETS' TYPES default values (ARCHAEOLOGY GAMES)
/***************************************************************************************************************/

global $ini_asset_poi_video,$ini_asset_site,$ini_asset_poi,$ini_asset_door,$ini_asset_artifact,$ini_asset_decoration_arch;

$ini_asset_poi_video = array('--- !u!1001 &___[poi_v_fid]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 0}
    m_Modifications:
    - target: {fileID: 4314884090211512, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_LocalPosition.x
      value: ___[poi_v_pos_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 4314884090211512, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_LocalPosition.y
      value: ___[poi_v_pos_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 4314884090211512, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_LocalPosition.z
      value: ___[poi_v_pos_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 4314884090211512, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_LocalRotation.x
      value: ___[poi_v_rot_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 4314884090211512, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_LocalRotation.y
      value: ___[poi_v_rot_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 4314884090211512, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_LocalRotation.z
      value: ___[poi_v_rot_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 4314884090211512, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_LocalRotation.w
      value: ___[poi_v_rot_w]___
      objectReference: {fileID: 0}
    - target: {fileID: 4314884090211512, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_RootOrder
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 1848443769047974, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_Name
      value: ___[poi_v_title]___
      objectReference: {fileID: 0}
    - target: {fileID: 4314884090211512, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_LocalScale.x
      value: ___[poi_v_scale_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 4314884090211512, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_LocalScale.y
      value: ___[poi_v_scale_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 4314884090211512, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_LocalScale.z
      value: ___[poi_v_scale_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 65002973632262576, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_Size.x
      value: 0.302
      objectReference: {fileID: 0}
    - target: {fileID: 65002973632262576, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_Size.y
      value: 0.302
      objectReference: {fileID: 0}
    - target: {fileID: 65002973632262576, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: m_Size.z
      value: 0.302
      objectReference: {fileID: 0}
    - target: {fileID: 114895655547013306, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: videoToShow
      value: ___[poi_v_v_name]___
      objectReference: {fileID: 0}
    - target: {fileID: 114895655547013306, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: videoUrlToShow
      value: ___[poi_v_v_url]___
      objectReference: {fileID: 0}
    - target: {fileID: 114895655547013306, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
      propertyPath: isRewardItem
      value: ___[poi_v_isreward]___
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
  m_IsPrefabParent: 0
--- !u!4 &___[poi_v_trans_fid]___ stripped
Transform:
  m_PrefabParentObject: {fileID: 4314884090211512, guid: 007c17ee709168148aa4aa7afd9e1076, type: 2}
  m_PrefabInternal: {fileID: ___[poi_v_fid]___}
--- !u!1001 &___[poi_v_obj_fid]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: ___[poi_v_trans_fid]___}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: ___[poi_v_obj_guid]___, type: 3}
  m_IsPrefabParent: 0
');

$ini_asset_site = array('--- !u!1001 &___[site_fid]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 0}
    m_Modifications:
    - target: {fileID: 400000, guid: ___[site_obj_guid]___, type: 3}
      propertyPath: m_LocalPosition.x
      value: ___[site_position_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[site_obj_guid]___, type: 3}
      propertyPath: m_LocalPosition.y
      value: ___[site_position_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[site_obj_guid]___, type: 3}
      propertyPath: m_LocalPosition.z
      value: ___[site_position_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[site_obj_guid]___, type: 3}
      propertyPath: m_LocalRotation.x
      value: ___[site_rotation_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[site_obj_guid]___, type: 3}
      propertyPath: m_LocalRotation.y
      value: ___[site_rotation_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[site_obj_guid]___, type: 3}
      propertyPath: m_LocalRotation.z
      value: ___[site_rotation_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[site_obj_guid]___, type: 3}
      propertyPath: m_LocalRotation.w
      value: ___[site_rotation_w]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[site_obj_guid]___, type: 3}
      propertyPath: m_RootOrder
      value: 7
      objectReference: {fileID: 0}
    - target: {fileID: 100000, guid: ___[site_obj_guid]___, type: 3}
      propertyPath: m_Name
      value: ___[site_title]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[site_obj_guid]___, type: 3}
      propertyPath: m_LocalScale.x
      value: ___[site_scale_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[site_obj_guid]___, type: 3}
      propertyPath: m_LocalScale.y
      value: ___[site_scale_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[site_obj_guid]___, type: 3}
      propertyPath: m_LocalScale.z
      value: ___[site_scale_z]___
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: ___[site_obj_guid]___, type: 3}
  m_IsPrefabParent: 0
');

$ini_asset_poi = array("--- !u!1001 &___[poi_it_fid]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 0}
    m_Modifications:
    - target: {fileID: 4761904222008530, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_LocalPosition.x
      value: ___[poi_it_pos_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 4761904222008530, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_LocalPosition.y
      value: ___[poi_it_pos_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 4761904222008530, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_LocalPosition.z
      value: ___[poi_it_pos_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 4761904222008530, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_LocalRotation.x
      value: ___[poi_it_rot_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 4761904222008530, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_LocalRotation.y
      value: ___[poi_it_rot_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 4761904222008530, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_LocalRotation.z
      value: ___[poi_it_rot_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 4761904222008530, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_LocalRotation.w
      value: ___[poi_it_rot_w]___
      objectReference: {fileID: 0}
    - target: {fileID: 4761904222008530, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_LocalScale.x
      value: ___[poi_it_scale_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 4761904222008530, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_LocalScale.y
      value: ___[poi_it_scale_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 4761904222008530, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_LocalScale.z
      value: ___[poi_it_scale_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 4761904222008530, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_RootOrder
      value: 7
      objectReference: {fileID: 0}
    - target: {fileID: 1075652707080240, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_Name
      value: ___[poi_it_title]___
      objectReference: {fileID: 0}
    - target: {fileID: 114549906102068134, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: imageSpriteNameToShow
      value: ___[poi_it_sprite_name]___
      objectReference: {fileID: 0}
    - target: {fileID: 114549906102068134, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: isRewardItem
      value: ___[poi_it_isreward]___
      objectReference: {fileID: 0}
    - target: {fileID: 114549906102068134, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: textToShow
      value: '___[poi_it_text]___'
      objectReference: {fileID: 0}
    - target: {fileID: 65218638646948556, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_Size.x
      value: 0.301
      objectReference: {fileID: 0}
    - target: {fileID: 65218638646948556, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_Size.y
      value: 0.301
      objectReference: {fileID: 0}
    - target: {fileID: 65218638646948556, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
      propertyPath: m_Size.z
      value: 0.301
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
  m_IsPrefabParent: 0
--- !u!4 &___[poi_it_connector_fid]___ stripped
Transform:
  m_PrefabParentObject: {fileID: 4761904222008530, guid: 4c118634f374a3647acbe1862739fb17, type: 2}
  m_PrefabInternal: {fileID: ___[poi_it_fid]___}
--- !u!1001 &___[poi_it_obj_fid]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: ___[poi_it_connector_fid]___}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: ___[poi_it_obj_guid]___, type: 3}
  m_IsPrefabParent: 0
");

$ini_asset_door = array('--- !u!1001 &___[door_fid]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 0}
    m_Modifications:
    - target: {fileID: 4660078065809236, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_LocalPosition.x
      value: ___[door_pos_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 4660078065809236, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_LocalPosition.y
      value: ___[door_pos_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 4660078065809236, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_LocalPosition.z
      value: ___[door_pos_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 4660078065809236, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_LocalRotation.x
      value: ___[door_rot_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 4660078065809236, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_LocalRotation.y
      value: ___[door_rot_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 4660078065809236, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_LocalRotation.z
      value: ___[door_rot_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 4660078065809236, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_LocalRotation.w
      value: ___[door_rot_w]___
      objectReference: {fileID: 0}
    - target: {fileID: 4660078065809236, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_RootOrder
      value: 12
      objectReference: {fileID: 0}
    - target: {fileID: 1693961036409888, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_Name
      value: ___[door_title]___
      objectReference: {fileID: 0}
    - target: {fileID: 114092677568471722, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: sceneArrival
      value: ___[door_scene_arrival]___
      objectReference: {fileID: 0}
    - target: {fileID: 114092677568471722, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: doorArrival
      value: ___[door_door_arrival]___
      objectReference: {fileID: 0}
    - target: {fileID: 114092677568471722, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: isRewardItem
      value: ___[door_isreward]___
      objectReference: {fileID: 0}
    - target: {fileID: 4660078065809236, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_LocalScale.x
      value: ___[door_scale_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 4660078065809236, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_LocalScale.y
      value: ___[door_scale_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 4660078065809236, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_LocalScale.z
      value: ___[door_scale_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 4212114690526736, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_LocalPosition.x
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 4212114690526736, guid: b15690de041079845965f87f4847e73f, type: 2}
      propertyPath: m_LocalPosition.z
      value: 1.15
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: b15690de041079845965f87f4847e73f, type: 2}
  m_IsPrefabParent: 0
--- !u!4 &___[door_transform_fid]___ stripped
Transform:
  m_PrefabParentObject: {fileID: 4660078065809236, guid: b15690de041079845965f87f4847e73f,
    type: 2}
  m_PrefabInternal: {fileID: ___[door_fid]___}
--- !u!1001 &___[door_obj_fid]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: ___[door_transform_fid]___}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: ___[door_guid]___, type: 3}
  m_IsPrefabParent: 0
');

$ini_asset_artifact = array('--- !u!1001 &___[poi_a_fid]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 0}
    m_Modifications:
    - target: {fileID: 4421351638810854, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_LocalPosition.x
      value: ___[poi_a_pos_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 4421351638810854, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_LocalPosition.y
      value: ___[poi_a_pos_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 4421351638810854, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_LocalPosition.z
      value: ___[poi_a_pos_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 4421351638810854, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_LocalRotation.x
      value: ___[poi_a_rot_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 4421351638810854, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_LocalRotation.y
      value: ___[poi_a_rot_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 4421351638810854, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_LocalRotation.z
      value: ___[poi_a_rot_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 4421351638810854, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_LocalRotation.w
      value: ___[poi_a_rot_w]___
      objectReference: {fileID: 0}
    - target: {fileID: 4421351638810854, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_LocalScale.x
      value: ___[poi_a_scale_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 4421351638810854, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_LocalScale.y
      value: ___[poi_a_scale_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 4421351638810854, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_LocalScale.z
      value: ___[poi_a_scale_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 65548309201650982, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_Size.x
      value: 0.203
      objectReference: {fileID: 0}
    - target: {fileID: 65548309201650982, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_Size.y
      value: 0.203
      objectReference: {fileID: 0}
    - target: {fileID: 65548309201650982, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_Size.z
      value: 0.203
      objectReference: {fileID: 0}
    - target: {fileID: 1629036710865210, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: m_Name
      value: ___[poi_a_title]___
      objectReference: {fileID: 0}
    - target: {fileID: 114805744082175224, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: textToShow
      value: ___[poi_a_text]___
      objectReference: {fileID: 0}
    - target: {fileID: 114805744082175224, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
      propertyPath: isRewardItem
      value: ___[poi_a_isreward]___
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
  m_IsPrefabParent: 0
--- !u!4 &___[poi_a_transform_fid]___ stripped
Transform:
  m_PrefabParentObject: {fileID: 4421351638810854, guid: 0adb8d0e70f9bab418a4f8e9259d118a, type: 2}
  m_PrefabInternal: {fileID: ___[poi_a_fid]___}
--- !u!1001 &___[poi_a_obj_fid]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: ___[poi_a_transform_fid]___}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: ___[poi_a_obj_guid]___, type: 3}
  m_IsPrefabParent: 0
');

$ini_asset_decoration_arch = array('--- !u!1001 &___[decor_fid]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 0}
    m_Modifications:
    - target: {fileID: 400000, guid: ___[decor_obj_guid]___, type: 3}
      propertyPath: m_LocalPosition.x
      value: ___[decor_pos_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[decor_obj_guid]___, type: 3}
      propertyPath: m_LocalPosition.y
      value: ___[decor_pos_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[decor_obj_guid]___, type: 3}
      propertyPath: m_LocalPosition.z
      value: ___[decor_pos_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[decor_obj_guid]___, type: 3}
      propertyPath: m_LocalRotation.x
      value: ___[decor_rot_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[decor_obj_guid]___, type: 3}
      propertyPath: m_LocalRotation.y
      value: ___[decor_rot_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[decor_obj_guid]___, type: 3}
      propertyPath: m_LocalRotation.z
      value: ___[decor_rot_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[decor_obj_guid]___, type: 3}
      propertyPath: m_LocalRotation.w
      value: ___[decor_rot_w]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[decor_obj_guid]___, type: 3}
      propertyPath: m_LocalScale.x
      value: ___[decor_scale_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[decor_obj_guid]___, type: 3}
      propertyPath: m_LocalScale.y
      value: ___[decor_scale_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: ___[decor_obj_guid]___, type: 3}
      propertyPath: m_LocalScale.z
      value: ___[decor_scale_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 100000, guid: ___[decor_obj_guid]___, type: 3}
      propertyPath: m_Name
      value: ___[decor_title]___
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: ___[decor_obj_guid]___, type: 3}
  m_IsPrefabParent: 0
');

function vrodos_default_value_poi_video_get(){
    global $ini_asset_poi_video;
    return $ini_asset_poi_video[0];
}

function vrodos_default_value_site_get(){
    global $ini_asset_site;
    return $ini_asset_site[0];
}

function vrodos_default_value_poi_get(){
    global $ini_asset_poi;
    return $ini_asset_poi[0];
}

function vrodos_default_value_door_get(){
    global $ini_asset_door;
    return $ini_asset_door[0];
}

function vrodos_default_value_artifact_get(){
    global $ini_asset_artifact;
    return $ini_asset_artifact[0];
}

function vrodos_default_value_decoration_arch_get(){
    global $ini_asset_decoration_arch;
    return $ini_asset_decoration_arch[0];
}



/***************************************************************************************************************/
// YAMLS for GAMES' TYPES Project Settings default values (ARCHAEOLOGY GAMES)
/***************************************************************************************************************/

global $AudioManager_asset2,$ClusterInputManager_asset2,$DynamicsManager_asset2,$EditorBuildSettings_asset2,$EditorSettings_asset2,$GraphicsSettings_asset2;
global $InputManager_asset2,$NavMeshAreas_asset2,$NetworkManager_asset2,$Physics2DSettings_asset2,$ProjectSettings_asset2,$ProjectVersion_asset2;
global $QualitySettings_asset2,$TagManager_asset2,$TimeManager_asset2,$UnityConnect_asset2;

//4th alphabetically:  EditorBuildSettings.asset   : It is the only that should change across compilations
// Each scene should be added with
//$sceneToAddPattern = array("  - enabled: 1
//    path: Assets/scenes/S_MainMenu.unity");
// Line change with character: chr(10)

//1. AudioManager.asset
$AudioManager_asset2 = array("%YAML 1.1
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
$ClusterInputManager_asset2 = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!236 &1
ClusterInputManager:
  m_ObjectHideFlags: 0
  m_Inputs: []
");

//3. DynamicsManager.asset
$DynamicsManager_asset2 = array("%YAML 1.1
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
$EditorBuildSettings_asset2 = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!1045 &1
EditorBuildSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Scenes:
");

//5. EditorSettings.asset
$EditorSettings_asset2 = array("%YAML 1.1
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
$GraphicsSettings_asset2 = array("%YAML 1.1
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
$InputManager_asset2 = array("%YAML 1.1
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
$NavMeshAreas_asset2 = array("%YAML 1.1
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
$NetworkManager_asset2 = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!149 &1
NetworkManager:
  m_ObjectHideFlags: 0
  m_DebugLevel: 0
  m_Sendrate: 15
  m_AssetToPrefab: {}
");

//10. Physics2DSettings.asset
$Physics2DSettings_asset2 = array("%YAML 1.1
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
$ProjectSettings_asset2 = array("%YAML 1.1
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
  productName: Archaeology template
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
    Standalone: unity.CERTH/ITI.Archaeology
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
  metroPackageName: Archaeology template
  metroPackageVersion: ___[game_version_number_dotted]___
  metroCertificatePath:
  metroCertificatePassword:
  metroCertificateSubject:
  metroCertificateIssuer:
  metroCertificateNotAfter: 0000000000000000
  metroApplicationDescription: Archaeology template
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
  projectName: Archaeology template
  organizationId: pan_migo
  cloudEnabled: 0
  enableNewInputSystem: 0
");

//12. ProjectVersion.asset
$ProjectVersion_asset2 = array("m_EditorVersion: 5.6.0f3
");

//13. QualitySettings.asset
$QualitySettings_asset2 = array("%YAML 1.1
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
$TagManager_asset2 = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!78 &1
TagManager:
  serializedVersion: 2
  tags:
  - poi_imagetext
  - poi_video
  - poi_artefact
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
$TimeManager_asset2 = array("%YAML 1.1
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
$UnityConnect_asset2 = array("%YAML 1.1
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

function vrodos_default_value_AudioManager_arch_get(){
    global $AudioManager_asset2;
    return $AudioManager_asset2[0];
}

function vrodos_default_value_ClusterInputManager_arch_get(){
    global $ClusterInputManager_asset2;
    return $ClusterInputManager_asset2[0];
}

function vrodos_default_value_DynamicsManager_arch_get(){
    global $DynamicsManager_asset2;
    return $DynamicsManager_asset2[0];
}

function vrodos_default_value_EditorBuildSettings_arch_get(){
    global $EditorBuildSettings_asset2;
    return $EditorBuildSettings_asset2[0];
}

function vrodos_default_value_EditorSettings_arch_get(){
    global $EditorSettings_asset2;
    return $EditorSettings_asset2[0];
}

function vrodos_default_value_GraphicsSettings_arch_get(){
    global $GraphicsSettings_asset2;
    return $GraphicsSettings_asset2[0];
}

function vrodos_default_value_InputManager_arch_get(){
    global $InputManager_asset2;
    return $InputManager_asset2[0];
}

function vrodos_default_value_NavMeshAreas_arch_get(){
    global $NavMeshAreas_asset2;
    return $NavMeshAreas_asset2[0];
}

function vrodos_default_value_NetworkManager_arch_get(){
    global $NetworkManager_asset2;
    return $NetworkManager_asset2[0];
}

function vrodos_default_value_Physics2DSettings_arch_get(){
    global $Physics2DSettings_asset2;
    return $Physics2DSettings_asset2[0];
}

function vrodos_default_value_ProjectSettings_arch_get(){
    global $ProjectSettings_asset2;
    return $ProjectSettings_asset2[0];
}

function vrodos_default_value_ProjectVersion_arch_get(){
    global $ProjectVersion_asset2;
    return $ProjectVersion_asset2[0];
}

function vrodos_default_value_QualitySettings_arch_get(){
    global $QualitySettings_asset2;
    return $QualitySettings_asset2[0];
}

function vrodos_default_value_TagManager_arch_get(){
    global $TagManager_asset2;
    return $TagManager_asset2[0];
}

function vrodos_default_value_TimeManager_arch_get(){
    global $TimeManager_asset2;
    return $TimeManager_asset2[0];
}

function vrodos_default_value_unityConnect_arch_get(){
    global $UnityConnect_asset2;
    return $UnityConnect_asset2[0];
}


/***************************************************************************************************************/
// YAMLS for SCENES default values (ARCHAEOLOGY GAMES)
/***************************************************************************************************************/

global $ini_scene_wonder_around_unity_pattern,$ini_scene_main_menu_arch_unity_pattern,$ini_scene_credits_arch_unity_pattern,$ini_scene_options_arch_unity_pattern,$ini_scene_selector_arch_text;
global $ini_scene_help_arch_unity_pattern,$ini_scene_login_arch_unity_pattern,$ini_scene_reward_arch_unity_pattern,$ini_scene_selector_arch_unity_pattern,$ini_scene_selector_arch_unity_pattern2;

$ini_scene_wonder_around_unity_pattern = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!29 &1
OcclusionCullingSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_OcclusionBakeSettings:
    smallestOccluder: 5
    smallestHole: 0.25
    backfaceThreshold: 100
  m_SceneGUID: 00000000000000000000000000000000
  m_OcclusionCullingData: {fileID: 0}
--- !u!104 &2
RenderSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 8
  m_Fog: 0
  m_FogColor: {r: 0.5, g: 0.5, b: 0.5, a: 1}
  m_FogMode: 3
  m_FogDensity: 0.01
  m_LinearFogStart: 0
  m_LinearFogEnd: 300
  m_AmbientSkyColor: {r: 0.212, g: 0.227, b: 0.259, a: 1}
  m_AmbientEquatorColor: {r: 0.114, g: 0.125, b: 0.133, a: 1}
  m_AmbientGroundColor: {r: 0.047, g: 0.043, b: 0.035, a: 1}
  m_AmbientIntensity: 1
  m_AmbientMode: 0
  m_SubtractiveShadowColor: {r: 0.42, g: 0.478, b: 0.627, a: 1}
  m_SkyboxMaterial: {fileID: 10304, guid: 0000000000000000f000000000000000, type: 0}
  m_HaloStrength: 0.5
  m_FlareStrength: 1
  m_FlareFadeSpeed: 3
  m_HaloTexture: {fileID: 0}
  m_SpotCookie: {fileID: 10001, guid: 0000000000000000e000000000000000, type: 0}
  m_DefaultReflectionMode: 0
  m_DefaultReflectionResolution: 128
  m_ReflectionBounces: 1
  m_ReflectionIntensity: 1
  m_CustomReflection: {fileID: 0}
  m_Sun: {fileID: 0}
  m_IndirectSpecularColor: {r: 0.43667546, g: 0.48427135, b: 0.5645225, a: 1}
--- !u!157 &3
LightmapSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 11
  m_GIWorkflowMode: 0
  m_GISettings:
    serializedVersion: 2
    m_BounceScale: 1
    m_IndirectOutputScale: 1
    m_AlbedoBoost: 1
    m_TemporalCoherenceThreshold: 1
    m_EnvironmentLightingMode: 0
    m_EnableBakedLightmaps: 1
    m_EnableRealtimeLightmaps: 1
  m_LightmapEditorSettings:
    serializedVersion: 9
    m_Resolution: 2
    m_BakeResolution: 40
    m_TextureWidth: 1024
    m_TextureHeight: 1024
    m_AO: 0
    m_AOMaxDistance: 1
    m_CompAOExponent: 1
    m_CompAOExponentDirect: 0
    m_Padding: 2
    m_LightmapParameters: {fileID: 0}
    m_LightmapsBakeMode: 1
    m_TextureCompression: 1
    m_FinalGather: 0
    m_FinalGatherFiltering: 1
    m_FinalGatherRayCount: 256
    m_ReflectionCompression: 2
    m_MixedBakeMode: 1
    m_BakeBackend: 0
    m_PVRSampling: 1
    m_PVRDirectSampleCount: 32
    m_PVRSampleCount: 500
    m_PVRBounces: 2
    m_PVRFiltering: 0
    m_PVRFilteringMode: 1
    m_PVRCulling: 1
    m_PVRFilteringGaussRadiusDirect: 1
    m_PVRFilteringGaussRadiusIndirect: 5
    m_PVRFilteringGaussRadiusAO: 2
    m_PVRFilteringAtrousColorSigma: 1
    m_PVRFilteringAtrousNormalSigma: 1
    m_PVRFilteringAtrousPositionSigma: 1
  m_LightingDataAsset: {fileID: 112000001, guid: 86b6714226897d743a5a5f8ee74ee7fc,
    type: 2}
  m_UseShadowmask: 0
--- !u!196 &4
NavMeshSettings:
  serializedVersion: 2
  m_ObjectHideFlags: 0
  m_BuildSettings:
    serializedVersion: 2
    agentTypeID: 0
    agentRadius: 0.5
    agentHeight: 2
    agentSlope: 45
    agentClimb: 0.4
    ledgeDropHeight: 0
    maxJumpAcrossDistance: 0
    minRegionArea: 2
    manualCellSize: 0
    cellSize: 0.16666667
    manualTileSize: 0
    tileSize: 256
    accuratePlacement: 0
  m_NavMeshData: {fileID: 0}
--- !u!1 &5
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 7}
  - component: {fileID: 6}
  m_Layer: 0
  m_Name: Directional Light
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!108 &6
Light:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 5}
  m_Enabled: 1
  serializedVersion: 8
  m_Type: 1
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_Intensity: 1
  m_Range: 10
  m_SpotAngle: 30
  m_CookieSize: 10
  m_Shadows:
    m_Type: 2
    m_Resolution: -1
    m_CustomResolution: -1
    m_Strength: 1
    m_Bias: 0.05
    m_NormalBias: 0.4
    m_NearPlane: 0.2
  m_Cookie: {fileID: 0}
  m_DrawHalo: 0
  m_Flare: {fileID: 0}
  m_RenderMode: 0
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_Lightmapping: 4
  m_AreaSize: {x: 1, y: 1}
  m_BounceIntensity: 1
  m_ColorTemperature: 6570
  m_UseColorTemperature: 0
  m_ShadowRadius: 0
  m_ShadowAngle: 0
--- !u!4 &7
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 5}
  m_LocalRotation: {x: 0.7071068, y: 0, z: 0, w: 0.7071068}
  m_LocalPosition: {x: 0, y: 168, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 90, y: 0, z: 0}
--- !u!1 &35992164
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 35992168}
  - component: {fileID: 35992167}
  - component: {fileID: 35992166}
  - component: {fileID: 35992165}
  m_Layer: 5
  m_Name: mainCanvas
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &35992165
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 35992164}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1301386320, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_IgnoreReversedGraphics: 1
  m_BlockingObjects: 0
  m_BlockingMask:
    serializedVersion: 2
    m_Bits: 4294967295
--- !u!114 &35992166
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 35992164}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1980459831, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_UiScaleMode: 1
  m_ReferencePixelsPerUnit: 100
  m_ScaleFactor: 1
  m_ReferenceResolution: {x: 1366, y: 768}
  m_ScreenMatchMode: 0
  m_MatchWidthOrHeight: 0
  m_PhysicalUnit: 3
  m_FallbackScreenDPI: 96
  m_DefaultSpriteDPI: 96
  m_DynamicPixelsPerUnit: 1
--- !u!223 &35992167
Canvas:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 35992164}
  m_Enabled: 1
  serializedVersion: 3
  m_RenderMode: 0
  m_Camera: {fileID: 0}
  m_PlaneDistance: 100
  m_PixelPerfect: 0
  m_ReceivesEvents: 1
  m_OverrideSorting: 0
  m_OverridePixelPerfect: 0
  m_SortingBucketNormalizedSize: 0
  m_AdditionalShaderChannelsFlag: 25
  m_SortingLayerID: 0
  m_SortingOrder: 0
  m_TargetDisplay: 0
--- !u!224 &35992168
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 35992164}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0, y: 0, z: 0}
  m_Children:
  - {fileID: 917014309}
  - {fileID: 1682613649}
  m_Father: {fileID: 0}
  m_RootOrder: 4
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0, y: 0}
--- !u!1 &200780667
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 200780668}
  - component: {fileID: 200780670}
  - component: {fileID: 200780669}
  m_Layer: 0
  m_Name: RawImage
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &200780668
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 200780667}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0.01, y: 0.01, z: 0.01}
  m_Children: []
  m_Father: {fileID: 1692068316}
  m_RootOrder: 4
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 0.5, y: -1.9}
  m_SizeDelta: {x: 680, y: 3}
  m_Pivot: {x: 0, y: 1}
--- !u!114 &200780669
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 200780667}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -98529514, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 0.6156863, b: 0.16078432, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Texture: {fileID: 0}
  m_UVRect:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
--- !u!222 &200780670
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 200780667}
--- !u!20 &278857501 stripped
Camera:
  m_PrefabParentObject: {fileID: 2000000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
  m_PrefabInternal: {fileID: 1351028531}

--- !u!1 &413257915
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 413257916}
  - component: {fileID: 413257918}
  - component: {fileID: 413257917}
  m_Layer: 0
  m_Name: bt_ti_close_txt
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &413257916
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 413257915}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1431914914}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &413257917
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 413257915}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 14
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 10
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &413257918
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 413257915}
--- !u!1 &509451473
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 509451474}
  - component: {fileID: 509451477}
  - component: {fileID: 509451476}
  - component: {fileID: 509451475}
  m_Layer: 0
  m_Name: bt_close
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &509451474
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 509451473}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0.015, y: 0.015, z: 0.01}
  m_Children:
  - {fileID: 1724408096}
  m_Father: {fileID: 1692068316}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 2.5, y: -4}
  m_SizeDelta: {x: 80, y: 40}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &509451475
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 509451473}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 0
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 509451476}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 1351028533}
        m_MethodName: closeArtefactView
        m_Mode: 1
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument:
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &509451476
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 509451473}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: 983743c8b961cb549bb03b160f624708, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &509451477
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 509451473}
--- !u!1 &596636432
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 596636433}
  - component: {fileID: 596636436}
  - component: {fileID: 596636435}
  - component: {fileID: 596636434}
  m_Layer: 0
  m_Name: canvas_v
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &596636433
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 596636432}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0, y: 0, z: 0}
  m_Children:
  - {fileID: 1460132349}
  m_Father: {fileID: 0}
  m_RootOrder: 6
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0, y: 0}
--- !u!114 &596636434
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 596636432}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1301386320, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_IgnoreReversedGraphics: 1
  m_BlockingObjects: 0
  m_BlockingMask:
    serializedVersion: 2
    m_Bits: 4294967295
--- !u!114 &596636435
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 596636432}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1980459831, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_UiScaleMode: 1
  m_ReferencePixelsPerUnit: 100
  m_ScaleFactor: 1
  m_ReferenceResolution: {x: 1366, y: 768}
  m_ScreenMatchMode: 0
  m_MatchWidthOrHeight: 0
  m_PhysicalUnit: 3
  m_FallbackScreenDPI: 96
  m_DefaultSpriteDPI: 96
  m_DynamicPixelsPerUnit: 1
--- !u!223 &596636436
Canvas:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 596636432}
  m_Enabled: 0
  serializedVersion: 3
  m_RenderMode: 0
  m_Camera: {fileID: 0}
  m_PlaneDistance: 100
  m_PixelPerfect: 0
  m_ReceivesEvents: 1
  m_OverrideSorting: 0
  m_OverridePixelPerfect: 0
  m_SortingBucketNormalizedSize: 0
  m_AdditionalShaderChannelsFlag: 25
  m_SortingLayerID: 0
  m_SortingOrder: 0
  m_TargetDisplay: 0
--- !u!1 &631077369
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 631077370}
  - component: {fileID: 631077372}
  - component: {fileID: 631077371}
  m_Layer: 0
  m_Name: txt_ti
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &631077370
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 631077369}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 2040773553}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 1}
  m_AnchorMax: {x: 0.5, y: 1}
  m_AnchoredPosition: {x: 345, y: -375}
  m_SizeDelta: {x: 575, y: 610}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &631077371
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 631077369}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.40392157, g: 0.40392157, b: 0.40392157, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 12800000, guid: eb9df781e4d1b004a95ec87dab9a0f20, type: 3}
    m_FontSize: 20
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1.2
  m_Text: ''
--- !u!222 &631077372
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 631077369}
--- !u!1 &692678352
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 692678353}
  - component: {fileID: 692678355}
  - component: {fileID: 692678354}
  m_Layer: 0
  m_Name: infoTextAccomplished
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &692678353
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 692678352}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1682613649}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0.9, y: 0.33000183}
  m_SizeDelta: {x: 340, y: 50}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &692678354
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 692678352}
  m_Enabled: 0
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 12800000, guid: 3a3c17a19f3d3214b9e98cab8cc41f64, type: 3}
    m_FontSize: 20
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 0
    m_MaxSize: 245
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: You have accomplished all targets. Proceed to the reward item.
--- !u!222 &692678355
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 692678352}
--- !u!1 &715798146
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 715798147}
  - component: {fileID: 715798149}
  - component: {fileID: 715798148}
  m_Layer: 0
  m_Name: txt_a
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &715798147
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 715798146}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0.01, y: 0.01, z: 0.01}
  m_Children: []
  m_Father: {fileID: 1692068316}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 1, y: 1}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: -4.1, y: -4.845}
  m_SizeDelta: {x: 667, y: 550}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &715798148
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 715798146}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.41568628, g: 0.41568628, b: 0.41568628, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 12800000, guid: 3a3c17a19f3d3214b9e98cab8cc41f64, type: 3}
    m_FontSize: 20
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: asdasdasdasd
--- !u!222 &715798149
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 715798146}
--- !u!1 &774569438
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 774569439}
  - component: {fileID: 774569441}
  - component: {fileID: 774569440}
  m_Layer: 0
  m_Name: panel_a_3d
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &774569439
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 774569438}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1847111624}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0.5}
  m_AnchorMax: {x: 0, y: 0.5}
  m_AnchoredPosition: {x: 4, y: 0}
  m_SizeDelta: {x: 8, y: 9}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &774569440
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 774569438}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.2, g: 0.2, b: 0.2, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &774569441
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 774569438}
--- !u!1 &812464394
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 812464399}
  - component: {fileID: 812464398}
  - component: {fileID: 812464397}
  - component: {fileID: 812464396}
  - component: {fileID: 812464395}
  m_Layer: 0
  m_Name: camera2
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!81 &812464395
AudioListener:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 812464394}
  m_Enabled: 0
--- !u!92 &812464396
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 812464394}
  m_Enabled: 1
--- !u!124 &812464397
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 812464394}
  m_Enabled: 1
--- !u!20 &812464398
Camera:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 812464394}
  m_Enabled: 0
  serializedVersion: 2
  m_ClearFlags: 1
  m_BackGroundColor: {r: 0.19215687, g: 0.3019608, b: 0.4745098, a: 0}
  m_NormalizedViewPortRect:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  near clip plane: 0.001
  far clip plane: 200
  field of view: 58
  orthographic: 1
  orthographic size: 4.5
  m_Depth: 0
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_RenderingPath: -1
  m_TargetTexture: {fileID: 0}
  m_TargetDisplay: 0
  m_TargetEye: 3
  m_HDR: 0
  m_AllowMSAA: 1
  m_ForceIntoRT: 0
  m_OcclusionCulling: 0
  m_StereoConvergence: 10
  m_StereoSeparation: 0.022
  m_StereoMirrorMode: 0
--- !u!4 &812464399
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 812464394}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 1000, y: 1000, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1847111624}
  m_Father: {fileID: 0}
  m_RootOrder: 7
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &917014308
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 917014309}
  - component: {fileID: 917014312}
  - component: {fileID: 917014311}
  - component: {fileID: 917014310}
  - component: {fileID: 917014313}
  m_Layer: 5
  m_Name: bt_scene_exit
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &917014309
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 917014308}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 988276043}
  m_Father: {fileID: 35992168}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 39, y: -37.5}
  m_SizeDelta: {x: 47.5, y: 45}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &917014310
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 917014308}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 917014311}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 917014313}
        m_MethodName: onClick_LoadScene
        m_Mode: 5
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument: S_MainMenu
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &917014311
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 917014308}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: cbb0a4b99f581d34e88b25ab1f11e612, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &917014312
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 917014308}
--- !u!114 &917014313
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 917014308}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 939bc54096dabc54fa51501482013178, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  doorID:
--- !u!1 &950351330
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 950351331}
  - component: {fileID: 950351333}
  - component: {fileID: 950351332}
  m_Layer: 0
  m_Name: imageGreenBar
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &950351331
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 950351330}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1.0000051, y: 1.0000051, z: 1.0000051}
  m_Children: []
  m_Father: {fileID: 1682613649}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0.5}
  m_AnchorMax: {x: 0, y: 0.5}
  m_AnchoredPosition: {x: 80, y: 0}
  m_SizeDelta: {x: 2, y: 20}
  m_Pivot: {x: 0, y: 0.5}
--- !u!114 &950351332
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 950351330}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.034482718, g: 1, b: 0, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10905, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &950351333
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 950351330}
--- !u!1 &961532799
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 961532800}
  - component: {fileID: 961532802}
  - component: {fileID: 961532801}
  m_Layer: 0
  m_Name: infoTextCurrStatus
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &961532800
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 961532799}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1.0000051, y: 1.0000051, z: 1.0000051}
  m_Children: []
  m_Father: {fileID: 1682613649}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: -134, y: 0}
  m_SizeDelta: {x: 62, y: 45}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &961532801
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 961532799}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 12800000, guid: 3a3c17a19f3d3214b9e98cab8cc41f64, type: 3}
    m_FontSize: 26
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 0
    m_MaxSize: 245
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: 0/0
--- !u!222 &961532802
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 961532799}
--- !u!1 &988276042
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 988276043}
  - component: {fileID: 988276045}
  - component: {fileID: 988276044}
  m_Layer: 5
  m_Name: exitBtText
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &988276043
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 988276042}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 917014309}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &988276044
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 988276042}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 18
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 1
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &988276045
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 988276042}
--- !u!1 &997311265
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 997311266}
  - component: {fileID: 997311268}
  - component: {fileID: 997311267}
  - component: {fileID: 997311270}
  - component: {fileID: 997311269}
  m_Layer: 0
  m_Name: title_txt_ti
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &997311266
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 997311265}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 2040773553}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: -313.5, y: -142.7}
  m_SizeDelta: {x: 627, y: 445.2}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &997311267
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 997311265}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.96862745, g: 0.539, b: 0.11764706, a: 1}
  m_RaycastTarget: 0
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 12800000, guid: b30e0d47dad338b49b28bb066095b619, type: 3}
    m_FontSize: 110
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 0
    m_MaxSize: 120
    m_Alignment: 2
    m_AlignByGeometry: 0
    m_RichText: 0
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 1
    m_LineSpacing: 1.2
  m_Text:
--- !u!222 &997311268
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 997311265}
--- !u!114 &997311269
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 997311265}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1573420865, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_EffectColor: {r: 0, g: 0, b: 0, a: 1}
  m_EffectDistance: {x: 1, y: -1}
  m_UseGraphicAlpha: 1
--- !u!114 &997311270
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 997311265}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -900027084, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_EffectColor: {r: 0, g: 0, b: 0, a: 0.247}
  m_EffectDistance: {x: 1, y: -1}
  m_UseGraphicAlpha: 1
--- !u!1 &999909767
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 999909770}
  - component: {fileID: 999909769}
  - component: {fileID: 999909768}
  m_Layer: 0
  m_Name: EventSystem
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &999909768
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 999909767}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1077351063, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_HorizontalAxis: Horizontal
  m_VerticalAxis: Vertical
  m_SubmitButton: Submit
  m_CancelButton: Cancel
  m_InputActionsPerSecond: 10
  m_RepeatDelay: 0.5
  m_ForceModuleActive: 0
--- !u!114 &999909769
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 999909767}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -619905303, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_FirstSelected: {fileID: 0}
  m_sendNavigationEvents: 1
  m_DragThreshold: 5
--- !u!4 &999909770
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 999909767}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &1047513806
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1047513807}
  - component: {fileID: 1047513809}
  - component: {fileID: 1047513808}
  m_Layer: 0
  m_Name: txt_a_title
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1047513807
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1047513806}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0.01, y: 0.01, z: 0.01}
  m_Children: []
  m_Father: {fileID: 1692068316}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 0.5, y: -1.5}
  m_SizeDelta: {x: 650, y: 34}
  m_Pivot: {x: 0, y: 1}
--- !u!114 &1047513808
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1047513806}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 0.6166211, b: 0.16176468, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 12800000, guid: b30e0d47dad338b49b28bb066095b619, type: 3}
    m_FontSize: 28
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: This is the title
--- !u!222 &1047513809
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1047513806}
--- !u!1 &1056400706
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1056400710}
  - component: {fileID: 1056400709}
  - component: {fileID: 1056400708}
  - component: {fileID: 1056400707}
  m_Layer: 0
  m_Name: canvas_ti
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &1056400707
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1056400706}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1301386320, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_IgnoreReversedGraphics: 1
  m_BlockingObjects: 0
  m_BlockingMask:
    serializedVersion: 2
    m_Bits: 4294967295
--- !u!114 &1056400708
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1056400706}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1980459831, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_UiScaleMode: 1
  m_ReferencePixelsPerUnit: 100
  m_ScaleFactor: 1
  m_ReferenceResolution: {x: 1366, y: 768}
  m_ScreenMatchMode: 0
  m_MatchWidthOrHeight: 0
  m_PhysicalUnit: 3
  m_FallbackScreenDPI: 96
  m_DefaultSpriteDPI: 96
  m_DynamicPixelsPerUnit: 1
--- !u!223 &1056400709
Canvas:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1056400706}
  m_Enabled: 0
  serializedVersion: 3
  m_RenderMode: 0
  m_Camera: {fileID: 278857501}
  m_PlaneDistance: 100
  m_PixelPerfect: 1
  m_ReceivesEvents: 1
  m_OverrideSorting: 0
  m_OverridePixelPerfect: 0
  m_SortingBucketNormalizedSize: 0
  m_AdditionalShaderChannelsFlag: 25
  m_SortingLayerID: 0
  m_SortingOrder: 0
  m_TargetDisplay: 0
--- !u!224 &1056400710
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1056400706}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0, y: 0, z: 0}
  m_Children:
  - {fileID: 2040773553}
  m_Father: {fileID: 0}
  m_RootOrder: 5
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0, y: 0}
--- !u!1 &1238491928
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1238491929}
  - component: {fileID: 1238491931}
  - component: {fileID: 1238491930}
  m_Layer: 0
  m_Name: directionalArrow
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1238491929
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1238491928}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1682613649}
  m_RootOrder: 4
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 220, y: 0}
  m_SizeDelta: {x: 50, y: 50}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1238491930
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1238491928}
  m_Enabled: 0
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: d0728ee2f0e7a4f4bae787d01abfd142, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1238491931
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1238491928}
--- !u!1001 &1351028531
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 0}
    m_Modifications:
    - target: {fileID: 400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalPosition.x
      value: ___[player_position_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalPosition.y
      value: ___[player_position_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalPosition.z
      value: ___[player_position_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalRotation.x
      value: ___[player_rotation_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalRotation.y
      value: ___[player_rotation_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalRotation.z
      value: ___[player_rotation_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalRotation.w
      value: ___[player_rotation_w]___
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalScale.x
      value: 0.2
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalScale.y
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalScale.z
      value: 0.2
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_RootOrder
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 8200000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: spreadCustomCurve.m_RotationOrder
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 100000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_Name
      value: Player
      objectReference: {fileID: 0}
    - target: {fileID: 100000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_TagString
      value: Untagged
      objectReference: {fileID: 0}
    - target: {fileID: 5400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_IsKinematic
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 11400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_UseFovKick
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 11400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_MouseLook.lockCursor
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 2000000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: far clip plane
      value: 20000
      objectReference: {fileID: 0}
    - target: {fileID: 100000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_IsActive
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 11400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_UseHeadBob
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 11400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_JumpBob.BobAmount
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalEulerAnglesHint.y
      value: 220.429
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalPosition.y
      value: 0.6
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalPosition.x
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalPosition.z
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalRotation.x
      value: ___[camera_rotation_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalRotation.y
      value: ___[camera_rotation_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalRotation.z
      value: ___[camera_rotation_z]___
      objectReference: {fileID: 0}
    - target: {fileID: 400002, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_LocalRotation.w
      value: ___[camera_rotation_w]___
      objectReference: {fileID: 0}
    - target: {fileID: 2000000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_Enabled
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 2000000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: field of view
      value: 50
      objectReference: {fileID: 0}
    - target: {fileID: 14300000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_Height
      value: 1.8
      objectReference: {fileID: 0}
    - target: {fileID: 100002, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_IsActive
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 11400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_FootstepSounds.Array.data[0]
      value:
      objectReference: {fileID: 0}
    - target: {fileID: 11400000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
      propertyPath: m_FootstepSounds.Array.data[1]
      value:
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
  m_IsPrefabParent: 0
--- !u!1 &1351028532 stripped
GameObject:
  m_PrefabParentObject: {fileID: 100000, guid: 5e9e851c0e142814dac026a256ba2ac0, type: 2}
  m_PrefabInternal: {fileID: 1351028531}
--- !u!114 &1351028533
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1351028532}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: f7b176c76e2ebaf4f860ddc9f3f3b755, type: 3}
  m_Name:
  m_EditorClassIdentifier:
--- !u!1 &1383244149
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1383244150}
  m_Layer: 0
  m_Name: meshcontainer
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1383244150
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1383244149}
  m_LocalRotation: {x: 0, y: 1, z: 0, w: 0}
  m_LocalPosition: {x: 0, y: 0, z: -20}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1692068316}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 180, z: 0}
  m_AnchorMin: {x: 0, y: 0.5}
  m_AnchorMax: {x: 0, y: 0.5}
  m_AnchoredPosition: {x: -4, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!1 &1397994806
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1397994807}
  - component: {fileID: 1397994809}
  - component: {fileID: 1397994808}
  m_Layer: 0
  m_Name: img_ti
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1397994807
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1397994806}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 2040773553}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 700, y: 0}
  m_Pivot: {x: 0, y: 0.5}
--- !u!114 &1397994808
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1397994806}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1397994809
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1397994806}

--- !u!1 &1431914913
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1431914914}
  - component: {fileID: 1431914917}
  - component: {fileID: 1431914916}
  - component: {fileID: 1431914915}
  m_Layer: 0
  m_Name: bt_ti_close
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1431914914
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1431914913}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 413257916}
  m_Father: {fileID: 2040773553}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 1, y: 0}
  m_AnchorMax: {x: 1, y: 0}
  m_AnchoredPosition: {x: -70, y: 40}
  m_SizeDelta: {x: 100, y: 50}
  m_Pivot: {x: 1, y: 0}
--- !u!114 &1431914915
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1431914913}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 1431914916}
  m_OnClick:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &1431914916
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1431914913}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: 983743c8b961cb549bb03b160f624708, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1431914917
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1431914913}

  
--- !u!1 &1448557157
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1448557158}
  - component: {fileID: 1448557159}
  m_Layer: 0
  m_Name: wonderSceneManager
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!4 &1448557158
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1448557157}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!114 &1448557159
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1448557157}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 14696386bd1c5da488902a2ff751bc79, type: 3}
  m_Name:
  m_EditorClassIdentifier:
--- !u!1 &1460132348
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1460132349}
  - component: {fileID: 1460132351}
  - component: {fileID: 1460132350}
  - component: {fileID: 1460132352}
  - component: {fileID: 1460132353}
  m_Layer: 0
  m_Name: panel_v
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1460132349
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1460132348}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 596636433}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1460132350
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1460132348}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -98529514, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Texture: {fileID: 8400000, guid: b939517b7788aa243a43cc077955f92a, type: 2}
  m_UVRect:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
--- !u!222 &1460132351
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1460132348}
--- !u!328 &1460132352
VideoPlayer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1460132348}
  m_Enabled: 1
  m_VideoClip: {fileID: 0}
  m_TargetCameraAlpha: 1
  m_TargetCamera: {fileID: 0}
  m_TargetTexture: {fileID: 8400000, guid: b939517b7788aa243a43cc077955f92a, type: 2}
  m_TimeReference: 0
  m_TargetMaterialRenderer: {fileID: 0}
  m_TargetMaterialProperty: _MainTex
  m_RenderMode: 2
  m_AspectRatio: 2
  m_DataSource: 0
  m_PlaybackSpeed: 1
  m_AudioOutputMode: 1
  m_TargetAudioSources: []
  m_DirectAudioVolumes: []
  m_Url:
  m_EnabledAudioTracks:
  m_DirectAudioMutes:
  m_ControlledAudioTrackCount: 0
  m_PlayOnAwake: 1
  m_SkipOnDrop: 1
  m_Looping: 0
  m_WaitForFirstFrame: 1
  m_FrameReadyEventEnabled: 0
--- !u!82 &1460132353
AudioSource:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1460132348}
  m_Enabled: 1
  serializedVersion: 4
  OutputAudioMixerGroup: {fileID: 0}
  m_audioClip: {fileID: 0}
  m_PlayOnAwake: 1
  m_Volume: 1
  m_Pitch: 1
  Loop: 0
  Mute: 0
  Spatialize: 0
  SpatializePostEffects: 0
  Priority: 128
  DopplerLevel: 1
  MinDistance: 1
  MaxDistance: 500
  Pan2D: 0
  rolloffMode: 0
  BypassEffects: 0
  BypassListenerEffects: 0
  BypassReverbZones: 0
  rolloffCustomCurve:
    serializedVersion: 2
    m_Curve:
    - serializedVersion: 2
      time: 0
      value: 1
      inSlope: 0
      outSlope: 0
      tangentMode: 0
    - serializedVersion: 2
      time: 1
      value: 0
      inSlope: 0
      outSlope: 0
      tangentMode: 0
    m_PreInfinity: 2
    m_PostInfinity: 2
    m_RotationOrder: 4
  panLevelCustomCurve:
    serializedVersion: 2
    m_Curve:
    - serializedVersion: 2
      time: 0
      value: 0
      inSlope: 0
      outSlope: 0
      tangentMode: 0
    m_PreInfinity: 2
    m_PostInfinity: 2
    m_RotationOrder: 0
  spreadCustomCurve:
    serializedVersion: 2
    m_Curve:
    - serializedVersion: 2
      time: 0
      value: 0
      inSlope: 0
      outSlope: 0
      tangentMode: 0
    m_PreInfinity: 2
    m_PostInfinity: 2
    m_RotationOrder: 4
  reverbZoneMixCustomCurve:
    serializedVersion: 2
    m_Curve:
    - serializedVersion: 2
      time: 0
      value: 1
      inSlope: 0
      outSlope: 0
      tangentMode: 0
    m_PreInfinity: 2
    m_PostInfinity: 2
    m_RotationOrder: 0
--- !u!1 &1682613648
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1682613649}
  - component: {fileID: 1682613651}
  - component: {fileID: 1682613650}
  m_Layer: 0
  m_Name: infoPanel
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1682613649
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1682613648}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 692678353}
  - {fileID: 961532800}
  - {fileID: 2054475063}
  - {fileID: 950351331}
  - {fileID: 1238491929}
  m_Father: {fileID: 35992168}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 1}
  m_AnchorMax: {x: 0.5, y: 1}
  m_AnchoredPosition: {x: -436.7, y: -15}
  m_SizeDelta: {x: 334.7, y: 45}
  m_Pivot: {x: 0.5, y: 1}
--- !u!114 &1682613650
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1682613648}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0, g: 0, b: 0, a: 0.253}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10907, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1682613651
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1682613648}
--- !u!1 &1692068315
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1692068316}
  - component: {fileID: 1692068318}
  - component: {fileID: 1692068317}
  m_Layer: 0
  m_Name: panel_a_txt
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1692068316
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1692068315}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1047513807}
  - {fileID: 715798147}
  - {fileID: 1383244150}
  - {fileID: 509451474}
  - {fileID: 200780668}
  m_Father: {fileID: 1847111624}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 1, y: 0.5}
  m_AnchorMax: {x: 1, y: 0.5}
  m_AnchoredPosition: {x: -4, y: 0}
  m_SizeDelta: {x: 8, y: 9}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1692068317
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1692068315}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1692068318
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1692068315}
--- !u!1 &1724408095
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1724408096}
  - component: {fileID: 1724408098}
  - component: {fileID: 1724408097}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1724408096
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1724408095}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 509451474}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1724408097
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1724408095}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 14
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 10
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &1724408098
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1724408095}
--- !u!1 &1847111623
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1847111624}
  - component: {fileID: 1847111627}
  - component: {fileID: 1847111626}
  - component: {fileID: 1847111625}
  m_Layer: 0
  m_Name: canvas_a
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1847111624
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1847111623}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 100}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1692068316}
  - {fileID: 774569439}
  m_Father: {fileID: 812464399}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 16, y: 9}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1847111625
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1847111623}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1301386320, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_IgnoreReversedGraphics: 1
  m_BlockingObjects: 0
  m_BlockingMask:
    serializedVersion: 2
    m_Bits: 0
--- !u!114 &1847111626
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1847111623}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1980459831, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_UiScaleMode: 1
  m_ReferencePixelsPerUnit: 100
  m_ScaleFactor: 1
  m_ReferenceResolution: {x: 1366, y: 768}
  m_ScreenMatchMode: 0
  m_MatchWidthOrHeight: 0
  m_PhysicalUnit: 3
  m_FallbackScreenDPI: 96
  m_DefaultSpriteDPI: 96
  m_DynamicPixelsPerUnit: 1
--- !u!223 &1847111627
Canvas:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1847111623}
  m_Enabled: 1
  serializedVersion: 3
  m_RenderMode: 2
  m_Camera: {fileID: 812464398}
  m_PlaneDistance: 100
  m_PixelPerfect: 0
  m_ReceivesEvents: 1
  m_OverrideSorting: 0
  m_OverridePixelPerfect: 0
  m_SortingBucketNormalizedSize: 0
  m_AdditionalShaderChannelsFlag: 25
  m_SortingLayerID: 0
  m_SortingOrder: 1
  m_TargetDisplay: 0
--- !u!1 &2040773552
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 2040773553}
  - component: {fileID: 2040773555}
  - component: {fileID: 2040773554}
  m_Layer: 0
  m_Name: panel_ti
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &2040773553
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2040773552}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1397994807}
  - {fileID: 631077370}
  - {fileID: 997311266}
  m_Father: {fileID: 1056400710}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &2040773554
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2040773552}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 10754, guid: 0000000000000000f000000000000000, type: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &2040773555
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2040773552}
--- !u!1 &2054475062
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 2054475063}
  - component: {fileID: 2054475065}
  - component: {fileID: 2054475064}
  m_Layer: 0
  m_Name: imageRedBar
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &2054475063
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2054475062}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1682613649}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0.5}
  m_AnchorMax: {x: 0, y: 0.5}
  m_AnchoredPosition: {x: 80, y: 0}
  m_SizeDelta: {x: 220, y: 20}
  m_Pivot: {x: 0, y: 0.5}
--- !u!114 &2054475064
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2054475062}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 0, b: 0, a: 1}
  m_RaycastTarget: 0
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10905, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &2054475065
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2054475062}
");



$ini_scene_main_menu_arch_unity_pattern = array('%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!29 &1
OcclusionCullingSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_OcclusionBakeSettings:
    smallestOccluder: 5
    smallestHole: 0.25
    backfaceThreshold: 100
  m_SceneGUID: 00000000000000000000000000000000
  m_OcclusionCullingData: {fileID: 0}
--- !u!104 &2
RenderSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 8
  m_Fog: 0
  m_FogColor: {r: 0.5, g: 0.5, b: 0.5, a: 1}
  m_FogMode: 3
  m_FogDensity: 0.01
  m_LinearFogStart: 0
  m_LinearFogEnd: 300
  m_AmbientSkyColor: {r: 0.212, g: 0.227, b: 0.259, a: 1}
  m_AmbientEquatorColor: {r: 0.114, g: 0.125, b: 0.133, a: 1}
  m_AmbientGroundColor: {r: 0.047, g: 0.043, b: 0.035, a: 1}
  m_AmbientIntensity: 1
  m_AmbientMode: 0
  m_SubtractiveShadowColor: {r: 0.42, g: 0.478, b: 0.627, a: 1}
  m_SkyboxMaterial: {fileID: 10304, guid: 0000000000000000f000000000000000, type: 0}
  m_HaloStrength: 0.5
  m_FlareStrength: 1
  m_FlareFadeSpeed: 3
  m_HaloTexture: {fileID: 0}
  m_SpotCookie: {fileID: 10001, guid: 0000000000000000e000000000000000, type: 0}
  m_DefaultReflectionMode: 0
  m_DefaultReflectionResolution: 128
  m_ReflectionBounces: 1
  m_ReflectionIntensity: 1
  m_CustomReflection: {fileID: 0}
  m_Sun: {fileID: 0}
  m_IndirectSpecularColor: {r: 0.44657844, g: 0.49641222, b: 0.57481694, a: 1}
--- !u!157 &3
LightmapSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 9
  m_GIWorkflowMode: 0
  m_GISettings:
    serializedVersion: 2
    m_BounceScale: 1
    m_IndirectOutputScale: 1
    m_AlbedoBoost: 1
    m_TemporalCoherenceThreshold: 1
    m_EnvironmentLightingMode: 0
    m_EnableBakedLightmaps: 1
    m_EnableRealtimeLightmaps: 1
  m_LightmapEditorSettings:
    serializedVersion: 8
    m_Resolution: 2
    m_BakeResolution: 40
    m_TextureWidth: 1024
    m_TextureHeight: 1024
    m_AO: 0
    m_AOMaxDistance: 1
    m_CompAOExponent: 1
    m_CompAOExponentDirect: 0
    m_Padding: 2
    m_LightmapParameters: {fileID: 0}
    m_LightmapsBakeMode: 1
    m_TextureCompression: 1
    m_FinalGather: 0
    m_FinalGatherFiltering: 1
    m_FinalGatherRayCount: 256
    m_ReflectionCompression: 2
    m_MixedBakeMode: 3
    m_BakeBackend: 0
    m_PVRSampling: 1
    m_PVRDirectSampleCount: 32
    m_PVRSampleCount: 500
    m_PVRBounces: 2
    m_PVRFiltering: 0
    m_PVRFilteringMode: 1
    m_PVRCulling: 1
    m_PVRFilteringGaussRadiusDirect: 1
    m_PVRFilteringGaussRadiusIndirect: 5
    m_PVRFilteringGaussRadiusAO: 2
    m_PVRFilteringAtrousColorSigma: 1
    m_PVRFilteringAtrousNormalSigma: 1
    m_PVRFilteringAtrousPositionSigma: 1
  m_LightingDataAsset: {fileID: 0}
  m_ShadowMaskMode: 2
--- !u!196 &4
NavMeshSettings:
  serializedVersion: 2
  m_ObjectHideFlags: 0
  m_BuildSettings:
    serializedVersion: 2
    agentTypeID: 0
    agentRadius: 0.5
    agentHeight: 2
    agentSlope: 45
    agentClimb: 0.4
    ledgeDropHeight: 0
    maxJumpAcrossDistance: 0
    minRegionArea: 2
    manualCellSize: 0
    cellSize: 0.16666667
    manualTileSize: 0
    tileSize: 256
    accuratePlacement: 0
  m_NavMeshData: {fileID: 0}
--- !u!1 &750235
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 750236}
  - component: {fileID: 750238}
  - component: {fileID: 750237}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &750236
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 750235}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 994883961}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &750237
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 750235}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.375, g: 0.375, b: 0.375, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 12800000, guid: 3a3c17a19f3d3214b9e98cab8cc41f64, type: 3}
    m_FontSize: 32
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &750238
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 750235}
--- !u!1 &27987237
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 27987240}
  - component: {fileID: 27987239}
  - component: {fileID: 27987238}
  m_Layer: 0
  m_Name: EventSystem
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &27987238
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 27987237}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1077351063, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_HorizontalAxis: Horizontal
  m_VerticalAxis: Vertical
  m_SubmitButton: Submit
  m_CancelButton: Cancel
  m_InputActionsPerSecond: 10
  m_RepeatDelay: 0.5
  m_ForceModuleActive: 0
--- !u!114 &27987239
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 27987237}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -619905303, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_FirstSelected: {fileID: 0}
  m_sendNavigationEvents: 1
  m_DragThreshold: 5
--- !u!4 &27987240
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 27987237}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &229874700
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 229874701}
  - component: {fileID: 229874703}
  - component: {fileID: 229874702}
  m_Layer: 0
  m_Name: MainMenu_BackgroundImage
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &229874701
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 229874700}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 651176153}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 1366, y: 768}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &229874702
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 229874700}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &229874703
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 229874700}
--- !u!1 &308189563
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 308189564}
  - component: {fileID: 308189567}
  - component: {fileID: 308189566}
  - component: {fileID: 308189565}
  m_Layer: 0
  m_Name: bt_credits
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &308189564
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 308189563}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1.0000187, y: 1.0000187, z: 1.0000187}
  m_Children:
  - {fileID: 1771095519}
  m_Father: {fileID: 651176153}
  m_RootOrder: 6
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 585.2, y: -290.4}
  m_SizeDelta: {x: 119.6, y: 109.9}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &308189565
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 308189563}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 308189566}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 970219551}
        m_MethodName: onClick_LoadScene
        m_Mode: 5
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument: S_Credits
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &308189566
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 308189563}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: d98f00ef77960ae43909a8122eac0de3, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &308189567
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 308189563}
--- !u!1 &398674211
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 398674212}
  - component: {fileID: 398674215}
  - component: {fileID: 398674214}
  - component: {fileID: 398674213}
  m_Layer: 0
  m_Name: bt_settings
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: ___[mainmenu_is_bt_settings_active]___
--- !u!224 &398674212
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 398674211}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1.0000187, y: 1.0000187, z: 1.0000187}
  m_Children:
  - {fileID: 1226489346}
  m_Father: {fileID: 651176153}
  m_RootOrder: 5
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 600, y: 300}
  m_SizeDelta: {x: 60, y: 50}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &398674213
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 398674211}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 398674214}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 970219551}
        m_MethodName: onClick_LoadScene
        m_Mode: 5
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument: S_Settings
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &398674214
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 398674211}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: 76f02f5075a8cf54aa59fa2ef6a97d61, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &398674215
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 398674211}
--- !u!1 &518069000
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 518069001}
  - component: {fileID: 518069004}
  - component: {fileID: 518069003}
  - component: {fileID: 518069002}
  m_Layer: 0
  m_Name: bt_help
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: ___[mainmenu_is_help_bt_active]___
--- !u!224 &518069001
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 518069000}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1.0000187, y: 1.0000187, z: 1.0000187}
  m_Children:
  - {fileID: 2014494769}
  m_Father: {fileID: 651176153}
  m_RootOrder: 4
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 600, y: 229}
  m_SizeDelta: {x: 119.8, y: 60}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &518069002
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 518069000}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 518069003}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 970219551}
        m_MethodName: onClick_LoadScene
        m_Mode: 5
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument: S_Help
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &518069003
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 518069000}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &518069004
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 518069000}
--- !u!1 &651176152
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 651176153}
  - component: {fileID: 651176155}
  - component: {fileID: 651176154}
  m_Layer: 0
  m_Name: Panel
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &651176153
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 651176152}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 229874701}
  - {fileID: 1680622196}
  - {fileID: 925753000}
  - {fileID: 971318551}
  - {fileID: 518069001}
  - {fileID: 398674212}
  - {fileID: 308189564}
  - {fileID: 994883961}
  - {fileID: 1572835203}
  m_Father: {fileID: 970219550}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 1366, y: 768}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &651176154
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 651176152}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 0.392}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10907, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &651176155
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 651176152}
--- !u!1 &724718817
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 724718819}
  - component: {fileID: 724718818}
  m_Layer: 0
  m_Name: GameObject_Analytics
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &724718818
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 724718817}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 7b641ab8cd6194d7da1e51fef12eee7b, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  app_key:
  api_key:
  disable: To enable look at tracking_enabled field
--- !u!4 &724718819
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 724718817}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 4
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &925752999
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 925753000}
  - component: {fileID: 925753002}
  - component: {fileID: 925753001}
  m_Layer: 0
  m_Name: MainMenu_FeaturedImage
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &925753000
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 925752999}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 651176153}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 1366, y: 768}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &925753001
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 925752999}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: ___[mainmenu_featured_image_sprite]___, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &925753002
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 925752999}
--- !u!1 &970219546
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 970219550}
  - component: {fileID: 970219549}
  - component: {fileID: 970219548}
  - component: {fileID: 970219547}
  - component: {fileID: 970219551}
  m_Layer: 0
  m_Name: mainmenu_Canvas
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &970219547
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 970219546}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1301386320, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_IgnoreReversedGraphics: 1
  m_BlockingObjects: 0
  m_BlockingMask:
    serializedVersion: 2
    m_Bits: 4294967295
--- !u!114 &970219548
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 970219546}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1980459831, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_UiScaleMode: 1
  m_ReferencePixelsPerUnit: 100
  m_ScaleFactor: 1
  m_ReferenceResolution: {x: 1366, y: 768}
  m_ScreenMatchMode: 0
  m_MatchWidthOrHeight: 0.5
  m_PhysicalUnit: 3
  m_FallbackScreenDPI: 96
  m_DefaultSpriteDPI: 96
  m_DynamicPixelsPerUnit: 1
--- !u!223 &970219549
Canvas:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 970219546}
  m_Enabled: 1
  serializedVersion: 3
  m_RenderMode: 0
  m_Camera: {fileID: 1940476102}
  m_PlaneDistance: 100
  m_PixelPerfect: 0
  m_ReceivesEvents: 1
  m_OverrideSorting: 0
  m_OverridePixelPerfect: 0
  m_SortingBucketNormalizedSize: 0
  m_AdditionalShaderChannelsFlag: 0
  m_SortingLayerID: 0
  m_SortingOrder: 0
  m_TargetDisplay: 0
--- !u!224 &970219550
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 970219546}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0, y: 0, z: 0}
  m_Children:
  - {fileID: 651176153}
  m_Father: {fileID: 0}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0, y: 0}
--- !u!114 &970219551
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 970219546}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 939bc54096dabc54fa51501482013178, type: 3}
  m_Name:
  m_EditorClassIdentifier:
--- !u!1 &971318550
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 971318551}
  - component: {fileID: 971318554}
  - component: {fileID: 971318553}
  - component: {fileID: 971318552}
  m_Layer: 0
  m_Name: bt_start
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &971318551
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 971318550}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1613431615}
  m_Father: {fileID: 651176153}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 288, y: -319}
  m_SizeDelta: {x: 116, y: 41.3}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &971318552
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 971318550}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 0.7019608, g: 0.7019608, b: 0.7019608, a: 0}
    m_HighlightedColor: {r: 0.7941176, g: 0.7941176, b: 0.7941176, a: 0.784}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 971318553}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 970219551}
        m_MethodName: onClick_LoadScene
        m_Mode: 5
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument: S_SceneSelector
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &971318553
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 971318550}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &971318554
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 971318550}
--- !u!1 &994883960
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 994883961}
  - component: {fileID: 994883964}
  - component: {fileID: 994883963}
  - component: {fileID: 994883962}
  m_Layer: 0
  m_Name: bt_exit
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: ___[mainmenu_is_exit_button_active]___
--- !u!224 &994883961
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 994883960}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1.0000187, y: 1.0000187, z: 1.0000187}
  m_Children:
  - {fileID: 750236}
  m_Father: {fileID: 651176153}
  m_RootOrder: 7
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: -530, y: 300}
  m_SizeDelta: {x: 71.6, y: 80}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &994883962
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 994883960}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 994883963}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 970219551}
        m_MethodName: onClick_ExitGame
        m_Mode: 1
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument:
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &994883963
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 994883960}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.7019608, g: 0.7019608, b: 0.7019608, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: cbb0a4b99f581d34e88b25ab1f11e612, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &994883964
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 994883960}
--- !u!1 &1226489345
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1226489346}
  - component: {fileID: 1226489348}
  - component: {fileID: 1226489347}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1226489346
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1226489345}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 398674212}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1226489347
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1226489345}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 28
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &1226489348
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1226489345}
--- !u!1 &1393922746
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1393922748}
  - component: {fileID: 1393922747}
  m_Layer: 0
  m_Name: Directional Light
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!108 &1393922747
Light:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1393922746}
  m_Enabled: 1
  serializedVersion: 8
  m_Type: 1
  m_Color: {r: 1, g: 0.95686275, b: 0.8392157, a: 1}
  m_Intensity: 1
  m_Range: 10
  m_SpotAngle: 30
  m_CookieSize: 10
  m_Shadows:
    m_Type: 2
    m_Resolution: -1
    m_CustomResolution: -1
    m_Strength: 1
    m_Bias: 0.05
    m_NormalBias: 0.4
    m_NearPlane: 0.2
  m_Cookie: {fileID: 0}
  m_DrawHalo: 0
  m_Flare: {fileID: 0}
  m_RenderMode: 0
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_Lightmapping: 4
  m_AreaSize: {x: 1, y: 1}
  m_BounceIntensity: 1
  m_ColorTemperature: 6570
  m_UseColorTemperature: 0
  m_ShadowRadius: 0
  m_ShadowAngle: 0
--- !u!4 &1393922748
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1393922746}
  m_LocalRotation: {x: 0.40821788, y: -0.23456968, z: 0.10938163, w: 0.8754261}
  m_LocalPosition: {x: 0, y: 3, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 50, y: -30, z: 0}
--- !u!1 &1572835202
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1572835203}
  - component: {fileID: 1572835206}
  - component: {fileID: 1572835205}
  - component: {fileID: 1572835204}
  m_Layer: 0
  m_Name: bt_login
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: ___[mainmenu_is_login_bt_active]___
--- !u!224 &1572835203
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1572835202}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1.0000116, y: 1.0000116, z: 1.0000116}
  m_Children:
  - {fileID: 1594263913}
  m_Father: {fileID: 651176153}
  m_RootOrder: 8
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 600, y: 174}
  m_SizeDelta: {x: 100, y: 50}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1572835204
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1572835202}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 1572835205}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 970219551}
        m_MethodName: onClick_LoadScene
        m_Mode: 5
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument: S_Login
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &1572835205
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1572835202}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1572835206
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1572835202}
--- !u!1 &1594263912
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1594263913}
  - component: {fileID: 1594263915}
  - component: {fileID: 1594263914}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1594263913
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1594263912}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1572835203}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1594263914
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1594263912}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.3764706, g: 0.3764706, b: 0.3764706, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 12800000, guid: 3a3c17a19f3d3214b9e98cab8cc41f64, type: 3}
    m_FontSize: 32
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Login
--- !u!222 &1594263915
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1594263912}
--- !u!1 &1613431614
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1613431615}
  - component: {fileID: 1613431617}
  - component: {fileID: 1613431616}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1613431615
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1613431614}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 971318551}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1613431616
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1613431614}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 12800000, guid: 3a3c17a19f3d3214b9e98cab8cc41f64, type: 3}
    m_FontSize: 38
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 300
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: ENTER
--- !u!222 &1613431617
  m_GameObject: {fileID: 1613431614}
--- !u!1 &1680622195
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1680622196}
  - component: {fileID: 1680622198}
  - component: {fileID: 1680622197}
  m_Layer: 0
  m_Name: MainMenu_GameTitle
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1680622196
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1680622195}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 651176153}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 334}
  m_SizeDelta: {x: 700, y: 49}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1680622197
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1680622195}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 34
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 1
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: ___[mainmenu_title_text]___
--- !u!222 &1680622198
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1680622195}
--- !u!1 &1771095518
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1771095519}
  - component: {fileID: 1771095521}
  - component: {fileID: 1771095520}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1771095519
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1771095518}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 308189564}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1771095520
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1771095518}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 28
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &1771095521
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1771095518}
--- !u!1 &1940476098
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1940476103}
  - component: {fileID: 1940476102}
  - component: {fileID: 1940476101}
  - component: {fileID: 1940476100}
  m_Layer: 0
  m_Name: mainmenu_Camera
  m_TagString: MainCamera
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!124 &1940476100
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1940476098}
  m_Enabled: 1
--- !u!92 &1940476101
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1940476098}
  m_Enabled: 1
--- !u!20 &1940476102
Camera:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1940476098}
  m_Enabled: 1
  serializedVersion: 2
  m_ClearFlags: 2
  m_BackGroundColor: {r: 1, g: 1, b: 1, a: 0}
  m_NormalizedViewPortRect:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  near clip plane: 0.3
  far clip plane: 1000
  field of view: 60
  orthographic: 0
  orthographic size: 5
  m_Depth: -1
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_RenderingPath: -1
  m_TargetTexture: {fileID: 0}
  m_TargetDisplay: 0
  m_TargetEye: 3
  m_HDR: 1
  m_AllowMSAA: 1
  m_ForceIntoRT: 0
  m_OcclusionCulling: 1
  m_StereoConvergence: 10
  m_StereoSeparation: 0.022
  m_StereoMirrorMode: 0
--- !u!4 &1940476103
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1940476098}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &2014494768
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 2014494769}
  - component: {fileID: 2014494771}
  - component: {fileID: 2014494770}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &2014494769
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2014494768}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 518069001}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: -3.5, y: 0}
  m_SizeDelta: {x: -43.9, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &2014494770
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2014494768}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.3764706, g: 0.3764706, b: 0.3764706, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 12800000, guid: 3a3c17a19f3d3214b9e98cab8cc41f64, type: 3}
    m_FontSize: 32
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: "?"
--- !u!222 &2014494771
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2014494768}
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
');

$ini_scene_credits_arch_unity_pattern = array('%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!29 &1
OcclusionCullingSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_OcclusionBakeSettings:
    smallestOccluder: 5
    smallestHole: 0.25
    backfaceThreshold: 100
  m_SceneGUID: 00000000000000000000000000000000
  m_OcclusionCullingData: {fileID: 0}
--- !u!104 &2
RenderSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 8
  m_Fog: 0
  m_FogColor: {r: 0.5, g: 0.5, b: 0.5, a: 1}
  m_FogMode: 3
  m_FogDensity: 0.01
  m_LinearFogStart: 0
  m_LinearFogEnd: 300
  m_AmbientSkyColor: {r: 0.212, g: 0.227, b: 0.259, a: 1}
  m_AmbientEquatorColor: {r: 0.114, g: 0.125, b: 0.133, a: 1}
  m_AmbientGroundColor: {r: 0.047, g: 0.043, b: 0.035, a: 1}
  m_AmbientIntensity: 1
  m_AmbientMode: 0
  m_SubtractiveShadowColor: {r: 0.42, g: 0.478, b: 0.627, a: 1}
  m_SkyboxMaterial: {fileID: 10304, guid: 0000000000000000f000000000000000, type: 0}
  m_HaloStrength: 0.5
  m_FlareStrength: 1
  m_FlareFadeSpeed: 3
  m_HaloTexture: {fileID: 0}
  m_SpotCookie: {fileID: 10001, guid: 0000000000000000e000000000000000, type: 0}
  m_DefaultReflectionMode: 0
  m_DefaultReflectionResolution: 128
  m_ReflectionBounces: 1
  m_ReflectionIntensity: 1
  m_CustomReflection: {fileID: 0}
  m_Sun: {fileID: 0}
  m_IndirectSpecularColor: {r: 0.37311992, g: 0.38074034, b: 0.35872713, a: 1}
--- !u!157 &3
LightmapSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 9
  m_GIWorkflowMode: 0
  m_GISettings:
    serializedVersion: 2
    m_BounceScale: 1
    m_IndirectOutputScale: 1
    m_AlbedoBoost: 1
    m_TemporalCoherenceThreshold: 1
    m_EnvironmentLightingMode: 0
    m_EnableBakedLightmaps: 1
    m_EnableRealtimeLightmaps: 1
  m_LightmapEditorSettings:
    serializedVersion: 8
    m_Resolution: 2
    m_BakeResolution: 40
    m_TextureWidth: 1024
    m_TextureHeight: 1024
    m_AO: 0
    m_AOMaxDistance: 1
    m_CompAOExponent: 1
    m_CompAOExponentDirect: 0
    m_Padding: 2
    m_LightmapParameters: {fileID: 0}
    m_LightmapsBakeMode: 1
    m_TextureCompression: 1
    m_FinalGather: 0
    m_FinalGatherFiltering: 1
    m_FinalGatherRayCount: 256
    m_ReflectionCompression: 2
    m_MixedBakeMode: 1
    m_BakeBackend: 0
    m_PVRSampling: 1
    m_PVRDirectSampleCount: 32
    m_PVRSampleCount: 500
    m_PVRBounces: 2
    m_PVRFiltering: 0
    m_PVRFilteringMode: 1
    m_PVRCulling: 1
    m_PVRFilteringGaussRadiusDirect: 1
    m_PVRFilteringGaussRadiusIndirect: 5
    m_PVRFilteringGaussRadiusAO: 2
    m_PVRFilteringAtrousColorSigma: 1
    m_PVRFilteringAtrousNormalSigma: 1
    m_PVRFilteringAtrousPositionSigma: 1
  m_LightingDataAsset: {fileID: 0}
  m_ShadowMaskMode: 2
--- !u!196 &4
NavMeshSettings:
  serializedVersion: 2
  m_ObjectHideFlags: 0
  m_BuildSettings:
    serializedVersion: 2
    agentTypeID: 0
    agentRadius: 0.5
    agentHeight: 2
    agentSlope: 45
    agentClimb: 0.4
    ledgeDropHeight: 0
    maxJumpAcrossDistance: 0
    minRegionArea: 2
    manualCellSize: 0
    cellSize: 0.16666667
    manualTileSize: 0
    tileSize: 256
    accuratePlacement: 0
  m_NavMeshData: {fileID: 0}
--- !u!1 &7849870
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 7849871}
  - component: {fileID: 7849874}
  - component: {fileID: 7849873}
  - component: {fileID: 7849872}
  - component: {fileID: 7849875}
  m_Layer: 0
  m_Name: creditsCanvas
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &7849871
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0, y: 0, z: 0}
  m_Children:
  - {fileID: 1359383263}
  m_Father: {fileID: 0}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0, y: 0}
--- !u!114 &7849872
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1301386320, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_IgnoreReversedGraphics: 1
  m_BlockingObjects: 0
  m_BlockingMask:
    serializedVersion: 2
    m_Bits: 4294967295
--- !u!114 &7849873
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1980459831, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_UiScaleMode: 1
  m_ReferencePixelsPerUnit: 100
  m_ScaleFactor: 1
  m_ReferenceResolution: {x: 1368, y: 768}
  m_ScreenMatchMode: 0
  m_MatchWidthOrHeight: 0.5
  m_PhysicalUnit: 3
  m_FallbackScreenDPI: 96
  m_DefaultSpriteDPI: 96
  m_DynamicPixelsPerUnit: 1
--- !u!223 &7849874
Canvas:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  serializedVersion: 3
  m_RenderMode: 1
  m_Camera: {fileID: 2017143698}
  m_PlaneDistance: 100
  m_PixelPerfect: 0
  m_ReceivesEvents: 1
  m_OverrideSorting: 0
  m_OverridePixelPerfect: 0
  m_SortingBucketNormalizedSize: 0
  m_AdditionalShaderChannelsFlag: 25
  m_SortingLayerID: 0
  m_SortingOrder: 0
  m_TargetDisplay: 0
--- !u!114 &7849875
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 03c9931148ee551469a0fe973c8da4c4, type: 3}
  m_Name:
  m_EditorClassIdentifier:
--- !u!1 &338872312
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 338872313}
  - component: {fileID: 338872315}
  - component: {fileID: 338872314}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &338872313
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 338872312}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1557937139}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &338872314
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 338872312}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 26
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 0
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &338872315
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 338872312}
--- !u!1 &1312999754
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1312999756}
  - component: {fileID: 1312999755}
  m_Layer: 0
  m_Name: sceneHelpManager
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &1312999755
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1312999754}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 3d5744dd74b2a1f4c950614f0869023f, type: 3}
  m_Name:
  m_EditorClassIdentifier:
--- !u!4 &1312999756
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1312999754}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0.56800604, y: 0.10509011, z: 90}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &1359383262
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1359383263}
  - component: {fileID: 1359383265}
  - component: {fileID: 1359383264}
  m_Layer: 0
  m_Name: Panel
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1359383263
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1359383262}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1512969739}
  - {fileID: 1478269061}
  - {fileID: 1447511477}
  - {fileID: 1557937139}
  m_Father: {fileID: 7849871}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 1366, y: 768}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1359383264
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1359383262}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 0.392}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10907, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1359383265
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1359383262}
--- !u!1 &1441279932
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1441279935}
  - component: {fileID: 1441279934}
  - component: {fileID: 1441279933}
  m_Layer: 0
  m_Name: EventSystem
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &1441279933
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1441279932}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1077351063, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_HorizontalAxis: Horizontal
  m_VerticalAxis: Vertical
  m_SubmitButton: Submit
  m_CancelButton: Cancel
  m_InputActionsPerSecond: 10
  m_RepeatDelay: 0.5
  m_ForceModuleActive: 0
--- !u!114 &1441279934
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1441279932}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -619905303, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_FirstSelected: {fileID: 0}
  m_sendNavigationEvents: 1
  m_DragThreshold: 5
--- !u!4 &1441279935
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1441279932}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &1447511476
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1447511477}
  - component: {fileID: 1447511479}
  - component: {fileID: 1447511478}
  m_Layer: 0
  m_Name: txt_help
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1447511477
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1447511476}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1359383263}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: -255}
  m_SizeDelta: {x: 1100, y: 70}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1447511478
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1447511476}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0, g: 0, b: 0, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 24
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 1
    m_MaxSize: 40
    m_Alignment: 1
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: "___[text_credits_scene]___"
--- !u!222 &1447511479
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1447511476}
--- !u!1 &1478269060
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1478269061}
  - component: {fileID: 1478269063}
  - component: {fileID: 1478269062}
  m_Layer: 0
  m_Name: img_help_front
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1478269061
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1478269060}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1359383263}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 5, y: 72.5}
  m_SizeDelta: {x: 1010, y: 555}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1478269062
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1478269060}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: ___[img_credits_scene]___, type: 3}
  m_Type: 0
  m_PreserveAspect: 1
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1478269063
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1478269060}
--- !u!1 &1512969738
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1512969739}
  - component: {fileID: 1512969741}
  - component: {fileID: 1512969740}
  m_Layer: 0
  m_Name: img_help_back
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1512969739
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1512969738}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1359383263}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 1366, y: 768}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1512969740
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1512969738}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1512969741
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1512969738}
--- !u!1 &1557937138
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1557937139}
  - component: {fileID: 1557937142}
  - component: {fileID: 1557937141}
  - component: {fileID: 1557937140}
  - component: {fileID: 1557937143}
  m_Layer: 0
  m_Name: bt_help_back
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1557937139
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 338872313}
  m_Father: {fileID: 1359383263}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: -335}
  m_SizeDelta: {x: 148, y: 50}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1557937140
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.8161765, g: 0.8161765, b: 0.8161765, a: 1}
    m_PressedColor: {r: 0.6397059, g: 0.6397059, b: 0.6397059, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 1557937141}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 1557937143}
        m_MethodName: onClick_LoadScene
        m_Mode: 5
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument: S_MainMenu
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &1557937141
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: 983743c8b961cb549bb03b160f624708, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1557937142
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
--- !u!114 &1557937143
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 939bc54096dabc54fa51501482013178, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  ovrMode: 0
  occulusControllerUse: 0
  occulusHeight: 0
  doorID:
--- !u!1 &2017143694
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 2017143699}
  - component: {fileID: 2017143698}
  - component: {fileID: 2017143697}
  - component: {fileID: 2017143696}
  m_Layer: 0
  m_Name: creditsCamera
  m_TagString: MainCamera
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!124 &2017143696
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
--- !u!92 &2017143697
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
--- !u!20 &2017143698
Camera:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
  serializedVersion: 2
  m_ClearFlags: 2
  m_BackGroundColor: {r: 1, g: 1, b: 1, a: 0}
  m_NormalizedViewPortRect:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  near clip plane: 0.3
  far clip plane: 1000
  field of view: 60
  orthographic: 1
  orthographic size: 5
  m_Depth: -1
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_RenderingPath: -1
  m_TargetTexture: {fileID: 0}
  m_TargetDisplay: 0
  m_TargetEye: 3
  m_HDR: 0
  m_AllowMSAA: 1
  m_ForceIntoRT: 0
  m_OcclusionCulling: 1
  m_StereoConvergence: 10
  m_StereoSeparation: 0.022
  m_StereoMirrorMode: 0
--- !u!4 &2017143699
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
');

$ini_scene_options_arch_unity_pattern = array('%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!29 &1
OcclusionCullingSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_OcclusionBakeSettings:
    smallestOccluder: 5
    smallestHole: 0.25
    backfaceThreshold: 100
  m_SceneGUID: 00000000000000000000000000000000
  m_OcclusionCullingData: {fileID: 0}
--- !u!104 &2
RenderSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 8
  m_Fog: 0
  m_FogColor: {r: 0.5, g: 0.5, b: 0.5, a: 1}
  m_FogMode: 3
  m_FogDensity: 0.01
  m_LinearFogStart: 0
  m_LinearFogEnd: 300
  m_AmbientSkyColor: {r: 0.212, g: 0.227, b: 0.259, a: 1}
  m_AmbientEquatorColor: {r: 0.114, g: 0.125, b: 0.133, a: 1}
  m_AmbientGroundColor: {r: 0.047, g: 0.043, b: 0.035, a: 1}
  m_AmbientIntensity: 1
  m_AmbientMode: 0
  m_SubtractiveShadowColor: {r: 0.42, g: 0.478, b: 0.627, a: 1}
  m_SkyboxMaterial: {fileID: 10304, guid: 0000000000000000f000000000000000, type: 0}
  m_HaloStrength: 0.5
  m_FlareStrength: 1
  m_FlareFadeSpeed: 3
  m_HaloTexture: {fileID: 0}
  m_SpotCookie: {fileID: 10001, guid: 0000000000000000e000000000000000, type: 0}
  m_DefaultReflectionMode: 0
  m_DefaultReflectionResolution: 128
  m_ReflectionBounces: 1
  m_ReflectionIntensity: 1
  m_CustomReflection: {fileID: 0}
  m_Sun: {fileID: 0}
  m_IndirectSpecularColor: {r: 0.44657844, g: 0.49641222, b: 0.57481694, a: 1}
--- !u!157 &3
LightmapSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 11
  m_GIWorkflowMode: 0
  m_GISettings:
    serializedVersion: 2
    m_BounceScale: 1
    m_IndirectOutputScale: 1
    m_AlbedoBoost: 1
    m_TemporalCoherenceThreshold: 1
    m_EnvironmentLightingMode: 0
    m_EnableBakedLightmaps: 1
    m_EnableRealtimeLightmaps: 1
  m_LightmapEditorSettings:
    serializedVersion: 9
    m_Resolution: 2
    m_BakeResolution: 40
    m_TextureWidth: 1024
    m_TextureHeight: 1024
    m_AO: 0
    m_AOMaxDistance: 1
    m_CompAOExponent: 1
    m_CompAOExponentDirect: 0
    m_Padding: 2
    m_LightmapParameters: {fileID: 0}
    m_LightmapsBakeMode: 1
    m_TextureCompression: 1
    m_FinalGather: 0
    m_FinalGatherFiltering: 1
    m_FinalGatherRayCount: 256
    m_ReflectionCompression: 2
    m_MixedBakeMode: 1
    m_BakeBackend: 0
    m_PVRSampling: 1
    m_PVRDirectSampleCount: 32
    m_PVRSampleCount: 500
    m_PVRBounces: 2
    m_PVRFiltering: 0
    m_PVRFilteringMode: 1
    m_PVRCulling: 1
    m_PVRFilteringGaussRadiusDirect: 1
    m_PVRFilteringGaussRadiusIndirect: 5
    m_PVRFilteringGaussRadiusAO: 2
    m_PVRFilteringAtrousColorSigma: 1
    m_PVRFilteringAtrousNormalSigma: 1
    m_PVRFilteringAtrousPositionSigma: 1
  m_LightingDataAsset: {fileID: 0}
  m_UseShadowmask: 0
--- !u!196 &4
NavMeshSettings:
  serializedVersion: 2
  m_ObjectHideFlags: 0
  m_BuildSettings:
    serializedVersion: 2
    agentTypeID: 0
    agentRadius: 0.5
    agentHeight: 2
    agentSlope: 45
    agentClimb: 0.4
    ledgeDropHeight: 0
    maxJumpAcrossDistance: 0
    minRegionArea: 2
    manualCellSize: 0
    cellSize: 0.16666667
    manualTileSize: 0
    tileSize: 256
    accuratePlacement: 0
  m_NavMeshData: {fileID: 0}
--- !u!1 &195193099
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 195193100}
  - component: {fileID: 195193102}
  - component: {fileID: 195193101}
  m_Layer: 5
  m_Name: SettingsText
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &195193100
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 195193099}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 333697834}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 326}
  m_SizeDelta: {x: 297, y: 41.9}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &195193101
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 195193099}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 32
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 3
    m_MaxSize: 60
    m_Alignment: 1
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Settings
--- !u!222 &195193102
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 195193099}
--- !u!1 &333697833
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 333697834}
  - component: {fileID: 333697836}
  - component: {fileID: 333697835}
  m_Layer: 5
  m_Name: Panel
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &333697834
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 333697833}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 195193100}
  - {fileID: 1659825048}
  - {fileID: 898881097}
  - {fileID: 978808495}
  - {fileID: 566155407}
  - {fileID: 1048460748}
  - {fileID: 779440031}
  m_Father: {fileID: 1363338592}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &333697835
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 333697833}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &333697836
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 333697833}
--- !u!1 &454479922
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 454479924}
  - component: {fileID: 454479923}
  m_Layer: 0
  m_Name: Directional Light
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!108 &454479923
Light:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 454479922}
  m_Enabled: 1
  serializedVersion: 8
  m_Type: 1
  m_Color: {r: 1, g: 0.95686275, b: 0.8392157, a: 1}
  m_Intensity: 1
  m_Range: 10
  m_SpotAngle: 30
  m_CookieSize: 10
  m_Shadows:
    m_Type: 2
    m_Resolution: -1
    m_CustomResolution: -1
    m_Strength: 1
    m_Bias: 0.05
    m_NormalBias: 0.4
    m_NearPlane: 0.2
  m_Cookie: {fileID: 0}
  m_DrawHalo: 0
  m_Flare: {fileID: 0}
  m_RenderMode: 0
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_Lightmapping: 4
  m_AreaSize: {x: 1, y: 1}
  m_BounceIntensity: 1
  m_ColorTemperature: 6570
  m_UseColorTemperature: 0
  m_ShadowRadius: 0
  m_ShadowAngle: 0
--- !u!4 &454479924
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 454479922}
  m_LocalRotation: {x: 0.40821788, y: -0.23456968, z: 0.10938163, w: 0.8754261}
  m_LocalPosition: {x: 0, y: 3, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 50, y: -30, z: 0}
--- !u!1 &526866756
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 526866757}
  - component: {fileID: 526866759}
  - component: {fileID: 526866758}
  m_Layer: 5
  m_Name: Background
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &526866757
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 526866756}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1411532454}
  m_Father: {fileID: 978808495}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 3.5, y: -13.75}
  m_SizeDelta: {x: 36.42, y: 35}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &526866758
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 526866756}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10905, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &526866759
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 526866756}
--- !u!1 &566155406
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 566155407}
  - component: {fileID: 566155410}
  - component: {fileID: 566155409}
  - component: {fileID: 566155408}
  m_Layer: 5
  m_Name: InputOcculusHeightField
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &566155407
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 566155406}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1709838419}
  - {fileID: 925587410}
  m_Father: {fileID: 333697834}
  m_RootOrder: 4
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 85.3}
  m_SizeDelta: {x: 80, y: 55}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &566155408
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 566155406}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 575553740, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 566155409}
  m_TextComponent: {fileID: 925587411}
  m_Placeholder: {fileID: 1709838420}
  m_ContentType: 0
  m_InputType: 0
  m_AsteriskChar: 42
  m_KeyboardType: 0
  m_LineType: 0
  m_HideMobileInput: 0
  m_CharacterValidation: 0
  m_CharacterLimit: 0
  m_OnEndEdit:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 1363338593}
        m_MethodName: onInputHeightEditEnd
        m_Mode: 1
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument:
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.InputField+SubmitEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
  m_OnValueChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.InputField+OnChangeEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
  m_CaretColor: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_CustomCaretColor: 0
  m_SelectionColor: {r: 0.65882355, g: 0.80784315, b: 1, a: 0.7529412}
  m_Text:
  m_CaretBlinkRate: 0.85
  m_CaretWidth: 1
  m_ReadOnly: 0
--- !u!114 &566155409
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 566155406}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10911, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &566155410
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 566155406}
--- !u!1 &779440030
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 779440031}
  - component: {fileID: 779440033}
  - component: {fileID: 779440032}
  m_Layer: 5
  m_Name: txt_ovr_mode
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &779440031
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 779440030}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 333697834}
  m_RootOrder: 6
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 131.5, y: 227.3}
  m_SizeDelta: {x: 289.3, y: 65.197}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &779440032
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 779440030}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 12800000, guid: c72f40085969a0f4595e7f749b3153e2, type: 3}
    m_FontSize: 32
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 3
    m_MaxSize: 40
    m_Alignment: 3
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Occulus Rift Mode
--- !u!222 &779440033
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 779440030}
--- !u!1 &898881096
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 898881097}
  - component: {fileID: 898881100}
  - component: {fileID: 898881099}
  - component: {fileID: 898881098}
  - component: {fileID: 898881101}
  m_Layer: 5
  m_Name: bt_optionsbackmenu
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &898881097
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 898881096}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1825681260}
  m_Father: {fileID: 333697834}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0}
  m_AnchorMax: {x: 0.5, y: 0}
  m_AnchoredPosition: {x: 0, y: 100}
  m_SizeDelta: {x: 160, y: 60}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &898881098
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 898881096}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 898881099}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 898881101}
        m_MethodName: onClick_LoadScene
        m_Mode: 5
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument: S_MainMenu
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &898881099
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 898881096}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: 983743c8b961cb549bb03b160f624708, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &898881100
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 898881096}
--- !u!114 &898881101
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 898881096}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 939bc54096dabc54fa51501482013178, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  doorID:
--- !u!1 &925587409
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 925587410}
  - component: {fileID: 925587412}
  - component: {fileID: 925587411}
  m_Layer: 5
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &925587410
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 925587409}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 566155407}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: -0.25}
  m_SizeDelta: {x: 0, y: -0.5}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &925587411
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 925587409}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0, g: 0, b: 0, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 24
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 0
    m_HorizontalOverflow: 1
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &925587412
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 925587409}
--- !u!1 &978808494
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 978808495}
  - component: {fileID: 978808496}
  m_Layer: 5
  m_Name: vrInputToggleBt
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &978808495
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 978808494}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 526866757}
  - {fileID: 1934732997}
  m_Father: {fileID: 333697834}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 340.5, y: 162.1}
  m_SizeDelta: {x: 761, y: 35}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &978808496
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 978808494}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 2109663825, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 526866758}
  toggleTransition: 1
  graphic: {fileID: 1411532455}
  m_Group: {fileID: 0}
  onValueChanged:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 1363338593}
        m_MethodName: onToggleInputBt
        m_Mode: 1
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument:
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Toggle+ToggleEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
  m_IsOn: 0
--- !u!1 &1032915557
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1032915558}
  - component: {fileID: 1032915560}
  - component: {fileID: 1032915559}
  m_Layer: 5
  m_Name: Background
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1032915558
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1032915557}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1984414021}
  m_Father: {fileID: 1659825048}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 60, y: 60}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1032915559
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1032915557}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10905, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1032915560
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1032915557}
--- !u!1 &1048460747
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1048460748}
  - component: {fileID: 1048460750}
  - component: {fileID: 1048460749}
  m_Layer: 5
  m_Name: txt_ovr_offset
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1048460748
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1048460747}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 333697834}
  m_RootOrder: 5
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 352.6, y: 85.3}
  m_SizeDelta: {x: 585, y: 55}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1048460749
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1048460747}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 24
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Height offset. Low if standing, high if sitting. E.g. 0 for standing, 1
    for sitting.
--- !u!222 &1048460750
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1048460747}
--- !u!1 &1363338588
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1363338592}
  - component: {fileID: 1363338591}
  - component: {fileID: 1363338590}
  - component: {fileID: 1363338589}
  - component: {fileID: 1363338593}
  - component: {fileID: 1363338595}
  - component: {fileID: 1363338594}
  m_Layer: 5
  m_Name: Canvas
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &1363338589
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1363338588}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1301386320, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_IgnoreReversedGraphics: 1
  m_BlockingObjects: 0
  m_BlockingMask:
    serializedVersion: 2
    m_Bits: 4294967295
--- !u!114 &1363338590
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1363338588}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1980459831, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_UiScaleMode: 0
  m_ReferencePixelsPerUnit: 100
  m_ScaleFactor: 1
  m_ReferenceResolution: {x: 800, y: 600}
  m_ScreenMatchMode: 0
  m_MatchWidthOrHeight: 0
  m_PhysicalUnit: 3
  m_FallbackScreenDPI: 96
  m_DefaultSpriteDPI: 96
  m_DynamicPixelsPerUnit: 1
--- !u!223 &1363338591
Canvas:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1363338588}
  m_Enabled: 1
  serializedVersion: 3
  m_RenderMode: 0
  m_Camera: {fileID: 0}
  m_PlaneDistance: 100
  m_PixelPerfect: 0
  m_ReceivesEvents: 1
  m_OverrideSorting: 0
  m_OverridePixelPerfect: 0
  m_SortingBucketNormalizedSize: 0
  m_AdditionalShaderChannelsFlag: 25
  m_SortingLayerID: 0
  m_SortingOrder: 0
  m_TargetDisplay: 0
--- !u!224 &1363338592
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1363338588}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0, y: 0, z: 0}
  m_Children:
  - {fileID: 333697834}
  m_Father: {fileID: 0}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0, y: 0}
--- !u!114 &1363338593
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1363338588}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 327c75e944c89ec49b25968d94e8d236, type: 3}
  m_Name:
  m_EditorClassIdentifier:
--- !u!114 &1363338594
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1363338588}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 939bc54096dabc54fa51501482013178, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  doorID:
--- !u!114 &1363338595
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1363338588}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1980459831, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_UiScaleMode: 1
  m_ReferencePixelsPerUnit: 100
  m_ScaleFactor: 1
  m_ReferenceResolution: {x: 1368, y: 768}
  m_ScreenMatchMode: 0
  m_MatchWidthOrHeight: 0
  m_PhysicalUnit: 3
  m_FallbackScreenDPI: 96
  m_DefaultSpriteDPI: 96
  m_DynamicPixelsPerUnit: 1
--- !u!1 &1411532453
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1411532454}
  - component: {fileID: 1411532456}
  - component: {fileID: 1411532455}
  m_Layer: 5
  m_Name: Checkmark
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1411532454
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1411532453}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 526866757}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 36, y: 35}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1411532455
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1411532453}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10901, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1411532456
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1411532453}
--- !u!1 &1659825047
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1659825048}
  - component: {fileID: 1659825049}
  m_Layer: 5
  m_Name: vrOptionsToggleBt
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1659825048
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1659825047}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1032915558}
  m_Father: {fileID: 333697834}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.53229177, y: 0.7381852}
  m_AnchoredPosition: {x: -114, y: 135.6}
  m_SizeDelta: {x: 43.7, y: -248.6}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1659825049
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1659825047}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 2109663825, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 1032915559}
  toggleTransition: 1
  graphic: {fileID: 1984414022}
  m_Group: {fileID: 0}
  onValueChanged:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 1363338593}
        m_MethodName: onToggleVrBt
        m_Mode: 1
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument:
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Toggle+ToggleEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
  m_IsOn: 0
--- !u!1 &1709838418
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1709838419}
  - component: {fileID: 1709838421}
  - component: {fileID: 1709838420}
  m_Layer: 5
  m_Name: Placeholder
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1709838419
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1709838418}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 566155407}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: -5, y: -0.25}
  m_SizeDelta: {x: -10, y: -0.5}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1709838420
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1709838418}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 24
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: 0
--- !u!222 &1709838421
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1709838418}
--- !u!1 &1825681259
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1825681260}
  - component: {fileID: 1825681262}
  - component: {fileID: 1825681261}
  m_Layer: 5
  m_Name: optionsBackBtText
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1825681260
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1825681259}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 898881097}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1825681261
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1825681259}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 32
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 3
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &1825681262
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1825681259}
--- !u!1 &1878607768
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1878607773}
  - component: {fileID: 1878607772}
  - component: {fileID: 1878607771}
  - component: {fileID: 1878607770}
  - component: {fileID: 1878607769}
  m_Layer: 0
  m_Name: Main Camera
  m_TagString: MainCamera
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!81 &1878607769
AudioListener:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1878607768}
  m_Enabled: 1
--- !u!124 &1878607770
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1878607768}
  m_Enabled: 1
--- !u!92 &1878607771
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1878607768}
  m_Enabled: 1
--- !u!20 &1878607772
Camera:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1878607768}
  m_Enabled: 1
  serializedVersion: 2
  m_ClearFlags: 1
  m_BackGroundColor: {r: 0.19215687, g: 0.3019608, b: 0.4745098, a: 0}
  m_NormalizedViewPortRect:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  near clip plane: 0.3
  far clip plane: 1000
  field of view: 60
  orthographic: 0
  orthographic size: 5
  m_Depth: -1
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_RenderingPath: -1
  m_TargetTexture: {fileID: 0}
  m_TargetDisplay: 0
  m_TargetEye: 3
  m_HDR: 0
  m_AllowMSAA: 1
  m_ForceIntoRT: 0
  m_OcclusionCulling: 1
  m_StereoConvergence: 10
  m_StereoSeparation: 0.022
  m_StereoMirrorMode: 0
--- !u!4 &1878607773
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1878607768}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 1, z: -10}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &1934732996
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1934732997}
  - component: {fileID: 1934732999}
  - component: {fileID: 1934732998}
  m_Layer: 5
  m_Name: Label
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1934732997
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1934732996}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 978808495}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 21.1, y: 3.75}
  m_SizeDelta: {x: -30, y: -7.5}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1934732998
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1934732996}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 24
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Oculus Controller (if empty then keyboard - mouse will be used)
--- !u!222 &1934732999
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1934732996}
--- !u!1 &1984414020
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1984414021}
  - component: {fileID: 1984414023}
  - component: {fileID: 1984414022}
  m_Layer: 5
  m_Name: Checkmark
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1984414021
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1984414020}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1032915558}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 60, y: 60}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1984414022
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1984414020}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10901, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1984414023
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1984414020}
--- !u!1 &2099324759
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 2099324762}
  - component: {fileID: 2099324761}
  - component: {fileID: 2099324760}
  m_Layer: 0
  m_Name: EventSystem
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &2099324760
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2099324759}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1077351063, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_HorizontalAxis: Horizontal
  m_VerticalAxis: Vertical
  m_SubmitButton: Submit
  m_CancelButton: Cancel
  m_InputActionsPerSecond: 10
  m_RepeatDelay: 0.5
  m_ForceModuleActive: 0
--- !u!114 &2099324761
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2099324759}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -619905303, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_FirstSelected: {fileID: 0}
  m_sendNavigationEvents: 1
  m_DragThreshold: 5
--- !u!4 &2099324762
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2099324759}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
');

$ini_scene_help_arch_unity_pattern = array('%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!29 &1
OcclusionCullingSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_OcclusionBakeSettings:
    smallestOccluder: 5
    smallestHole: 0.25
    backfaceThreshold: 100
  m_SceneGUID: 00000000000000000000000000000000
  m_OcclusionCullingData: {fileID: 0}
--- !u!104 &2
RenderSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 8
  m_Fog: 0
  m_FogColor: {r: 0.5, g: 0.5, b: 0.5, a: 1}
  m_FogMode: 3
  m_FogDensity: 0.01
  m_LinearFogStart: 0
  m_LinearFogEnd: 300
  m_AmbientSkyColor: {r: 0.212, g: 0.227, b: 0.259, a: 1}
  m_AmbientEquatorColor: {r: 0.114, g: 0.125, b: 0.133, a: 1}
  m_AmbientGroundColor: {r: 0.047, g: 0.043, b: 0.035, a: 1}
  m_AmbientIntensity: 1
  m_AmbientMode: 0
  m_SubtractiveShadowColor: {r: 0.42, g: 0.478, b: 0.627, a: 1}
  m_SkyboxMaterial: {fileID: 10304, guid: 0000000000000000f000000000000000, type: 0}
  m_HaloStrength: 0.5
  m_FlareStrength: 1
  m_FlareFadeSpeed: 3
  m_HaloTexture: {fileID: 0}
  m_SpotCookie: {fileID: 10001, guid: 0000000000000000e000000000000000, type: 0}
  m_DefaultReflectionMode: 0
  m_DefaultReflectionResolution: 128
  m_ReflectionBounces: 1
  m_ReflectionIntensity: 1
  m_CustomReflection: {fileID: 0}
  m_Sun: {fileID: 0}
  m_IndirectSpecularColor: {r: 0.37311992, g: 0.38074034, b: 0.35872713, a: 1}
--- !u!157 &3
LightmapSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 9
  m_GIWorkflowMode: 0
  m_GISettings:
    serializedVersion: 2
    m_BounceScale: 1
    m_IndirectOutputScale: 1
    m_AlbedoBoost: 1
    m_TemporalCoherenceThreshold: 1
    m_EnvironmentLightingMode: 0
    m_EnableBakedLightmaps: 1
    m_EnableRealtimeLightmaps: 1
  m_LightmapEditorSettings:
    serializedVersion: 8
    m_Resolution: 2
    m_BakeResolution: 40
    m_TextureWidth: 1024
    m_TextureHeight: 1024
    m_AO: 0
    m_AOMaxDistance: 1
    m_CompAOExponent: 1
    m_CompAOExponentDirect: 0
    m_Padding: 2
    m_LightmapParameters: {fileID: 0}
    m_LightmapsBakeMode: 1
    m_TextureCompression: 1
    m_FinalGather: 0
    m_FinalGatherFiltering: 1
    m_FinalGatherRayCount: 256
    m_ReflectionCompression: 2
    m_MixedBakeMode: 1
    m_BakeBackend: 0
    m_PVRSampling: 1
    m_PVRDirectSampleCount: 32
    m_PVRSampleCount: 500
    m_PVRBounces: 2
    m_PVRFiltering: 0
    m_PVRFilteringMode: 1
    m_PVRCulling: 1
    m_PVRFilteringGaussRadiusDirect: 1
    m_PVRFilteringGaussRadiusIndirect: 5
    m_PVRFilteringGaussRadiusAO: 2
    m_PVRFilteringAtrousColorSigma: 1
    m_PVRFilteringAtrousNormalSigma: 1
    m_PVRFilteringAtrousPositionSigma: 1
  m_LightingDataAsset: {fileID: 0}
  m_ShadowMaskMode: 2
--- !u!196 &4
NavMeshSettings:
  serializedVersion: 2
  m_ObjectHideFlags: 0
  m_BuildSettings:
    serializedVersion: 2
    agentTypeID: 0
    agentRadius: 0.5
    agentHeight: 2
    agentSlope: 45
    agentClimb: 0.4
    ledgeDropHeight: 0
    maxJumpAcrossDistance: 0
    minRegionArea: 2
    manualCellSize: 0
    cellSize: 0.16666667
    manualTileSize: 0
    tileSize: 256
    accuratePlacement: 0
  m_NavMeshData: {fileID: 0}
--- !u!1 &7849870
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 7849871}
  - component: {fileID: 7849874}
  - component: {fileID: 7849873}
  - component: {fileID: 7849872}
  m_Layer: 0
  m_Name: helpCanvas
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &7849871
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0, y: 0, z: 0}
  m_Children:
  - {fileID: 1359383263}
  m_Father: {fileID: 0}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0, y: 0}
--- !u!114 &7849872
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1301386320, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_IgnoreReversedGraphics: 1
  m_BlockingObjects: 0
  m_BlockingMask:
    serializedVersion: 2
    m_Bits: 4294967295
--- !u!114 &7849873
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1980459831, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_UiScaleMode: 1
  m_ReferencePixelsPerUnit: 100
  m_ScaleFactor: 1
  m_ReferenceResolution: {x: 1368, y: 768}
  m_ScreenMatchMode: 0
  m_MatchWidthOrHeight: 0.5
  m_PhysicalUnit: 3
  m_FallbackScreenDPI: 96
  m_DefaultSpriteDPI: 96
  m_DynamicPixelsPerUnit: 1
--- !u!223 &7849874
Canvas:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  serializedVersion: 3
  m_RenderMode: 1
  m_Camera: {fileID: 2017143698}
  m_PlaneDistance: 100
  m_PixelPerfect: 0
  m_ReceivesEvents: 1
  m_OverrideSorting: 0
  m_OverridePixelPerfect: 0
  m_SortingBucketNormalizedSize: 0
  m_AdditionalShaderChannelsFlag: 25
  m_SortingLayerID: 0
  m_SortingOrder: 0
  m_TargetDisplay: 0
--- !u!1 &338872312
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 338872313}
  - component: {fileID: 338872315}
  - component: {fileID: 338872314}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &338872313
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 338872312}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1557937139}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &338872314
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 338872312}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 26
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 0
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &338872315
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 338872312}
--- !u!1 &1359383262
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1359383263}
  - component: {fileID: 1359383265}
  - component: {fileID: 1359383264}
  m_Layer: 0
  m_Name: Panel
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1359383263
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1359383262}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1512969739}
  - {fileID: 1478269061}
  - {fileID: 1447511477}
  - {fileID: 1557937139}
  m_Father: {fileID: 7849871}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 1366, y: 768}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1359383264
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1359383262}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 0.392}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10907, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1359383265
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1359383262}
--- !u!1 &1441279932
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1441279935}
  - component: {fileID: 1441279934}
  - component: {fileID: 1441279933}
  m_Layer: 0
  m_Name: EventSystem
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &1441279933
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1441279932}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1077351063, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_HorizontalAxis: Horizontal
  m_VerticalAxis: Vertical
  m_SubmitButton: Submit
  m_CancelButton: Cancel
  m_InputActionsPerSecond: 10
  m_RepeatDelay: 0.5
  m_ForceModuleActive: 0
--- !u!114 &1441279934
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1441279932}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -619905303, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_FirstSelected: {fileID: 0}
  m_sendNavigationEvents: 1
  m_DragThreshold: 5
--- !u!4 &1441279935
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1441279932}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &1447511476
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1447511477}
  - component: {fileID: 1447511479}
  - component: {fileID: 1447511478}
  m_Layer: 0
  m_Name: txt_help
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1447511477
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1447511476}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1359383263}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: -263.4}
  m_SizeDelta: {x: 1020, y: 58.4}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1447511478
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1447511476}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0, g: 0, b: 0, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 24
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 1
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: "___[text_help_scene]___"
--- !u!222 &1447511479
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1447511476}
--- !u!1 &1478269060
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1478269061}
  - component: {fileID: 1478269063}
  - component: {fileID: 1478269062}
  m_Layer: 0
  m_Name: img_help_front
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1478269061
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1478269060}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1359383263}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 89.3}
  m_SizeDelta: {x: 1366, y: 553.6}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1478269062
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1478269060}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: ___[img_help_scene]___, type: 3}
  m_Type: 0
  m_PreserveAspect: 1
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1478269063
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1478269060}
--- !u!1 &1512969738
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1512969739}
  - component: {fileID: 1512969741}
  - component: {fileID: 1512969740}
  m_Layer: 0
  m_Name: img_help_back
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1512969739
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1512969738}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1359383263}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 1366, y: 768}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1512969740
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1512969738}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1512969741
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1512969738}
--- !u!1 &1557937138
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1557937139}
  - component: {fileID: 1557937142}
  - component: {fileID: 1557937141}
  - component: {fileID: 1557937140}
  - component: {fileID: 1557937143}
  m_Layer: 0
  m_Name: bt_help_back
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1557937139
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 338872313}
  m_Father: {fileID: 1359383263}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: -335}
  m_SizeDelta: {x: 148, y: 50}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1557937140
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.8161765, g: 0.8161765, b: 0.8161765, a: 1}
    m_PressedColor: {r: 0.6397059, g: 0.6397059, b: 0.6397059, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 1557937141}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 1557937143}
        m_MethodName: onClick_LoadScene
        m_Mode: 5
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument: S_MainMenu
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &1557937141
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: 983743c8b961cb549bb03b160f624708, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1557937142
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
--- !u!114 &1557937143
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 939bc54096dabc54fa51501482013178, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  doorID:
--- !u!1 &2017143694
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 2017143699}
  - component: {fileID: 2017143698}
  - component: {fileID: 2017143697}
  - component: {fileID: 2017143696}
  - component: {fileID: 2017143700}
  m_Layer: 0
  m_Name: Main Camera
  m_TagString: MainCamera
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!124 &2017143696
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
--- !u!92 &2017143697
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
--- !u!20 &2017143698
Camera:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
  serializedVersion: 2
  m_ClearFlags: 2
  m_BackGroundColor: {r: 1, g: 1, b: 1, a: 0}
  m_NormalizedViewPortRect:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  near clip plane: 0.3
  far clip plane: 1000
  field of view: 60
  orthographic: 1
  orthographic size: 5
  m_Depth: -1
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_RenderingPath: -1
  m_TargetTexture: {fileID: 0}
  m_TargetDisplay: 0
  m_TargetEye: 3
  m_HDR: 0
  m_AllowMSAA: 1
  m_ForceIntoRT: 0
  m_OcclusionCulling: 1
  m_StereoConvergence: 10
  m_StereoSeparation: 0.022
  m_StereoMirrorMode: 0
--- !u!4 &2017143699
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!114 &2017143700
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 7b641ab8cd6194d7da1e51fef12eee7b, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  app_key:
  api_key:
  disable:
');

$ini_scene_login_arch_unity_pattern = array('%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!29 &1
OcclusionCullingSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_OcclusionBakeSettings:
    smallestOccluder: 5
    smallestHole: 0.25
    backfaceThreshold: 100
  m_SceneGUID: 00000000000000000000000000000000
  m_OcclusionCullingData: {fileID: 0}
--- !u!104 &2
RenderSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 8
  m_Fog: 0
  m_FogColor: {r: 0.5, g: 0.5, b: 0.5, a: 1}
  m_FogMode: 3
  m_FogDensity: 0.01
  m_LinearFogStart: 0
  m_LinearFogEnd: 300
  m_AmbientSkyColor: {r: 0.212, g: 0.227, b: 0.259, a: 1}
  m_AmbientEquatorColor: {r: 0.114, g: 0.125, b: 0.133, a: 1}
  m_AmbientGroundColor: {r: 0.047, g: 0.043, b: 0.035, a: 1}
  m_AmbientIntensity: 1
  m_AmbientMode: 0
  m_SubtractiveShadowColor: {r: 0.42, g: 0.478, b: 0.627, a: 1}
  m_SkyboxMaterial: {fileID: 10304, guid: 0000000000000000f000000000000000, type: 0}
  m_HaloStrength: 0.5
  m_FlareStrength: 1
  m_FlareFadeSpeed: 3
  m_HaloTexture: {fileID: 0}
  m_SpotCookie: {fileID: 10001, guid: 0000000000000000e000000000000000, type: 0}
  m_DefaultReflectionMode: 0
  m_DefaultReflectionResolution: 128
  m_ReflectionBounces: 1
  m_ReflectionIntensity: 1
  m_CustomReflection: {fileID: 0}
  m_Sun: {fileID: 0}
  m_IndirectSpecularColor: {r: 0.37311992, g: 0.38074034, b: 0.35872713, a: 1}
--- !u!157 &3
LightmapSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 11
  m_GIWorkflowMode: 0
  m_GISettings:
    serializedVersion: 2
    m_BounceScale: 1
    m_IndirectOutputScale: 1
    m_AlbedoBoost: 1
    m_TemporalCoherenceThreshold: 1
    m_EnvironmentLightingMode: 0
    m_EnableBakedLightmaps: 1
    m_EnableRealtimeLightmaps: 1
  m_LightmapEditorSettings:
    serializedVersion: 9
    m_Resolution: 2
    m_BakeResolution: 40
    m_TextureWidth: 1024
    m_TextureHeight: 1024
    m_AO: 0
    m_AOMaxDistance: 1
    m_CompAOExponent: 1
    m_CompAOExponentDirect: 0
    m_Padding: 2
    m_LightmapParameters: {fileID: 0}
    m_LightmapsBakeMode: 1
    m_TextureCompression: 1
    m_FinalGather: 0
    m_FinalGatherFiltering: 1
    m_FinalGatherRayCount: 256
    m_ReflectionCompression: 2
    m_MixedBakeMode: 1
    m_BakeBackend: 0
    m_PVRSampling: 1
    m_PVRDirectSampleCount: 32
    m_PVRSampleCount: 500
    m_PVRBounces: 2
    m_PVRFiltering: 0
    m_PVRFilteringMode: 1
    m_PVRCulling: 1
    m_PVRFilteringGaussRadiusDirect: 1
    m_PVRFilteringGaussRadiusIndirect: 5
    m_PVRFilteringGaussRadiusAO: 2
    m_PVRFilteringAtrousColorSigma: 1
    m_PVRFilteringAtrousNormalSigma: 1
    m_PVRFilteringAtrousPositionSigma: 1
  m_LightingDataAsset: {fileID: 0}
  m_UseShadowmask: 1
--- !u!196 &4
NavMeshSettings:
  serializedVersion: 2
  m_ObjectHideFlags: 0
  m_BuildSettings:
    serializedVersion: 2
    agentTypeID: 0
    agentRadius: 0.5
    agentHeight: 2
    agentSlope: 45
    agentClimb: 0.4
    ledgeDropHeight: 0
    maxJumpAcrossDistance: 0
    minRegionArea: 2
    manualCellSize: 0
    cellSize: 0.16666667
    manualTileSize: 0
    tileSize: 256
    accuratePlacement: 0
  m_NavMeshData: {fileID: 0}
--- !u!1 &7849870
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 7849871}
  - component: {fileID: 7849874}
  - component: {fileID: 7849873}
  - component: {fileID: 7849872}
  m_Layer: 0
  m_Name: loginCanvas
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &7849871
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0, y: 0, z: 0}
  m_Children:
  - {fileID: 1359383263}
  m_Father: {fileID: 0}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0, y: 0}
--- !u!114 &7849872
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1301386320, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_IgnoreReversedGraphics: 1
  m_BlockingObjects: 0
  m_BlockingMask:
    serializedVersion: 2
    m_Bits: 4294967295
--- !u!114 &7849873
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1980459831, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_UiScaleMode: 1
  m_ReferencePixelsPerUnit: 100
  m_ScaleFactor: 1
  m_ReferenceResolution: {x: 1366, y: 768}
  m_ScreenMatchMode: 0
  m_MatchWidthOrHeight: 0.5
  m_PhysicalUnit: 3
  m_FallbackScreenDPI: 96
  m_DefaultSpriteDPI: 96
  m_DynamicPixelsPerUnit: 1
--- !u!223 &7849874
Canvas:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  serializedVersion: 3
  m_RenderMode: 1
  m_Camera: {fileID: 2017143698}
  m_PlaneDistance: 100
  m_PixelPerfect: 0
  m_ReceivesEvents: 1
  m_OverrideSorting: 0
  m_OverridePixelPerfect: 0
  m_SortingBucketNormalizedSize: 0
  m_AdditionalShaderChannelsFlag: 25
  m_SortingLayerID: 0
  m_SortingOrder: 0
  m_TargetDisplay: 0
--- !u!1 &62072894
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 62072895}
  - component: {fileID: 62072898}
  - component: {fileID: 62072897}
  - component: {fileID: 62072896}
  m_Layer: 0
  m_Name: InputField (schoolName)
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &62072895
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 62072894}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0.9997399, y: 0.9997399, z: 0.9997399}
  m_Children:
  - {fileID: 912973755}
  - {fileID: 1540698676}
  m_Father: {fileID: 1359383263}
  m_RootOrder: 5
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 159.9972, y: -30.699078}
  m_SizeDelta: {x: 255.3, y: 41.1}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &62072896
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 62072894}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 575553740, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 62072897}
  m_TextComponent: {fileID: 1540698677}
  m_Placeholder: {fileID: 912973756}
  m_ContentType: 0
  m_InputType: 0
  m_AsteriskChar: 42
  m_KeyboardType: 0
  m_LineType: 0
  m_HideMobileInput: 0
  m_CharacterValidation: 0
  m_CharacterLimit: 0
  m_OnEndEdit:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 0}
        m_MethodName: SchoolNameEntered
        m_Mode: 0
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument:
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.InputField+SubmitEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
  m_OnValueChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.InputField+OnChangeEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
  m_CaretColor: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_CustomCaretColor: 0
  m_SelectionColor: {r: 0.65882355, g: 0.80784315, b: 1, a: 0.7529412}
  m_Text:
  m_CaretBlinkRate: 0.85
  m_CaretWidth: 1
  m_ReadOnly: 0
--- !u!114 &62072897
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 62072894}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10911, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &62072898
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 62072894}
--- !u!1 &90407054
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 90407055}
  - component: {fileID: 90407058}
  - component: {fileID: 90407057}
  - component: {fileID: 90407056}
  m_Layer: 0
  m_Name: InputField (surname)
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &90407055
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 90407054}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0.9997399, y: 0.9997399, z: 0.9997399}
  m_Children:
  - {fileID: 520857994}
  - {fileID: 2147237572}
  m_Father: {fileID: 1359383263}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 159.9973, y: 25.69994}
  m_SizeDelta: {x: 255.3, y: 41.1}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &90407056
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 90407054}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 575553740, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 90407057}
  m_TextComponent: {fileID: 2147237573}
  m_Placeholder: {fileID: 520857995}
  m_ContentType: 5
  m_InputType: 0
  m_AsteriskChar: 42
  m_KeyboardType: 6
  m_LineType: 0
  m_HideMobileInput: 0
  m_CharacterValidation: 4
  m_CharacterLimit: 0
  m_OnEndEdit:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 0}
        m_MethodName: SurnameEntered
        m_Mode: 0
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument:
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.InputField+SubmitEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
  m_OnValueChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.InputField+OnChangeEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
  m_CaretColor: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_CustomCaretColor: 0
  m_SelectionColor: {r: 0.65882355, g: 0.80784315, b: 1, a: 0.7529412}
  m_Text:
  m_CaretBlinkRate: 0.85
  m_CaretWidth: 1
  m_ReadOnly: 0
--- !u!114 &90407057
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 90407054}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10911, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &90407058
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 90407054}
--- !u!1 &231395811
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 231395812}
  - component: {fileID: 231395814}
  - component: {fileID: 231395813}
  m_Layer: 0
  m_Name: Text (2)
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &231395812
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 231395811}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0.9997399, y: 0.9997399, z: 0.9997399}
  m_Children: []
  m_Father: {fileID: 1359383263}
  m_RootOrder: 4
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: -110, y: -30.74907}
  m_SizeDelta: {x: 210, y: 41}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &231395813
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 231395811}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0, g: 0, b: 0, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 20
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 1
    m_MaxSize: 40
    m_Alignment: 3
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Enter organization name
--- !u!222 &231395814
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 231395811}
--- !u!1 &240499164
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 240499165}
  - component: {fileID: 240499168}
  - component: {fileID: 240499167}
  - component: {fileID: 240499166}
  m_Layer: 0
  m_Name: InputField(name)
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &240499165
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 240499164}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0.9999823, y: 0.9999823, z: 0.9999823}
  m_Children:
  - {fileID: 1503522708}
  - {fileID: 1362262504}
  m_Father: {fileID: 1359383263}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 159.99728, y: 76.49904}
  m_SizeDelta: {x: 255.3, y: 41.1}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &240499166
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 240499164}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 575553740, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 240499167}
  m_TextComponent: {fileID: 1362262505}
  m_Placeholder: {fileID: 1503522709}
  m_ContentType: 5
  m_InputType: 0
  m_AsteriskChar: 42
  m_KeyboardType: 6
  m_LineType: 0
  m_HideMobileInput: 0
  m_CharacterValidation: 4
  m_CharacterLimit: 0
  m_OnEndEdit:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 0}
        m_MethodName: NameEntered
        m_Mode: 0
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument:
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.InputField+SubmitEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
  m_OnValueChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.InputField+OnChangeEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
  m_CaretColor: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_CustomCaretColor: 0
  m_SelectionColor: {r: 0.65882355, g: 0.80784315, b: 1, a: 0.7529412}
  m_Text:
  m_CaretBlinkRate: 0.85
  m_CaretWidth: 1
  m_ReadOnly: 0
--- !u!114 &240499167
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 240499164}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10911, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &240499168
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 240499164}
--- !u!1 &338872312
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 338872313}
  - component: {fileID: 338872315}
  - component: {fileID: 338872314}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &338872313
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 338872312}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1557937139}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &338872314
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 338872312}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 24
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 0
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &338872315
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 338872312}
--- !u!1 &520857993
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 520857994}
  - component: {fileID: 520857996}
  - component: {fileID: 520857995}
  m_Layer: 0
  m_Name: Placeholder
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &520857994
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 520857993}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 90407055}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: -0.5}
  m_SizeDelta: {x: -20, y: -13}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &520857995
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 520857993}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 0.5}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 14
    m_FontStyle: 2
    m_BestFit: 0
    m_MinSize: 10
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Enter text...
--- !u!222 &520857996
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 520857993}
--- !u!1 &912973754
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 912973755}
  - component: {fileID: 912973757}
  - component: {fileID: 912973756}
  m_Layer: 0
  m_Name: Placeholder
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &912973755
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 912973754}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 62072895}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: -0.5}
  m_SizeDelta: {x: -20, y: -13}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &912973756
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 912973754}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 0.5}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 14
    m_FontStyle: 2
    m_BestFit: 0
    m_MinSize: 10
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Enter text...
--- !u!222 &912973757
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 912973754}
--- !u!1 &1109105516
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1109105517}
  - component: {fileID: 1109105519}
  - component: {fileID: 1109105518}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1109105517
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1109105516}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0.9999823, y: 0.9999823, z: 0.9999823}
  m_Children: []
  m_Father: {fileID: 1359383263}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: -79.99858, y: 76.49905}
  m_SizeDelta: {x: 160, y: 41.1}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1109105518
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1109105516}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0, g: 0, b: 0, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 20
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 1
    m_MaxSize: 40
    m_Alignment: 3
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Enter name
--- !u!222 &1109105519
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1109105516}
--- !u!1 &1359383262
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1359383263}
  - component: {fileID: 1359383265}
  - component: {fileID: 1359383264}
  m_Layer: 0
  m_Name: Panel
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1359383263
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1359383262}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 240499165}
  - {fileID: 1109105517}
  - {fileID: 1585257481}
  - {fileID: 90407055}
  - {fileID: 231395812}
  - {fileID: 62072895}
  - {fileID: 1557937139}
  - {fileID: 1895203989}
  m_Father: {fileID: 7849871}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1359383264
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1359383262}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1359383265
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1359383262}
--- !u!1 &1362262503
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1362262504}
  - component: {fileID: 1362262506}
  - component: {fileID: 1362262505}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1362262504
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1362262503}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 240499165}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: -0.5}
  m_SizeDelta: {x: -20, y: -13}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1362262505
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1362262503}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 14
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 10
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 0
    m_HorizontalOverflow: 1
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &1362262506
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1362262503}
--- !u!1 &1422882497
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1422882499}
  - component: {fileID: 1422882498}
  m_Layer: 0
  m_Name: sceneLoginManager
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &1422882498
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1422882497}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 3d5744dd74b2a1f4c950614f0869023f, type: 3}
  m_Name:
  m_EditorClassIdentifier:
--- !u!4 &1422882499
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1422882497}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 1, z: -10}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &1441279932
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1441279935}
  - component: {fileID: 1441279934}
  - component: {fileID: 1441279933}
  m_Layer: 0
  m_Name: EventSystem
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &1441279933
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1441279932}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1077351063, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_HorizontalAxis: Horizontal
  m_VerticalAxis: Vertical
  m_SubmitButton: Submit
  m_CancelButton: Cancel
  m_InputActionsPerSecond: 10
  m_RepeatDelay: 0.5
  m_ForceModuleActive: 0
--- !u!114 &1441279934
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1441279932}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -619905303, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_FirstSelected: {fileID: 0}
  m_sendNavigationEvents: 1
  m_DragThreshold: 5
--- !u!4 &1441279935
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1441279932}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &1503522707
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1503522708}
  - component: {fileID: 1503522710}
  - component: {fileID: 1503522709}
  m_Layer: 0
  m_Name: Placeholder
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1503522708
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1503522707}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 240499165}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: -0.5}
  m_SizeDelta: {x: -20, y: -13}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1503522709
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1503522707}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 0.5}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 14
    m_FontStyle: 2
    m_BestFit: 0
    m_MinSize: 10
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Enter text...
--- !u!222 &1503522710
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1503522707}
--- !u!1 &1540698675
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1540698676}
  - component: {fileID: 1540698678}
  - component: {fileID: 1540698677}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1540698676
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1540698675}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 62072895}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: -0.5}
  m_SizeDelta: {x: -20, y: -13}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1540698677
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1540698675}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 14
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 10
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 0
    m_HorizontalOverflow: 1
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &1540698678
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1540698675}
--- !u!1 &1557937138
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1557937139}
  - component: {fileID: 1557937142}
  - component: {fileID: 1557937141}
  - component: {fileID: 1557937140}
  - component: {fileID: 1557937143}
  m_Layer: 0
  m_Name: bt_back
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1557937139
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 338872313}
  m_Father: {fileID: 1359383263}
  m_RootOrder: 6
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0}
  m_AnchorMax: {x: 0.5, y: 0}
  m_AnchoredPosition: {x: 0, y: 49.09369}
  m_SizeDelta: {x: 150, y: 50}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1557937140
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.8161765, g: 0.8161765, b: 0.8161765, a: 1}
    m_PressedColor: {r: 0.6397059, g: 0.6397059, b: 0.6397059, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 1557937141}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 1557937143}
        m_MethodName: onClick_LoadScene
        m_Mode: 5
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument: S_MainMenu
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &1557937141
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: 983743c8b961cb549bb03b160f624708, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1557937142
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
--- !u!114 &1557937143
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1557937138}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 939bc54096dabc54fa51501482013178, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  doorID:
--- !u!1 &1585257480
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1585257481}
  - component: {fileID: 1585257483}
  - component: {fileID: 1585257482}
  m_Layer: 0
  m_Name: Text (1)
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1585257481
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1585257480}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0.9997399, y: 0.9997399, z: 0.9997399}
  m_Children: []
  m_Father: {fileID: 1359383263}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: -79.99858, y: 25.699934}
  m_SizeDelta: {x: 160, y: 41.1}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1585257482
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1585257480}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0, g: 0, b: 0, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 20
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 1
    m_MaxSize: 40
    m_Alignment: 3
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Enter surname
--- !u!222 &1585257483
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1585257480}
--- !u!1 &1895203988
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1895203989}
  - component: {fileID: 1895203991}
  - component: {fileID: 1895203990}
  m_Layer: 0
  m_Name: txt_login_title
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1895203989
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1895203988}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1359383263}
  m_RootOrder: 7
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 1}
  m_AnchorMax: {x: 0.5, y: 1}
  m_AnchoredPosition: {x: 0, y: -61.09369}
  m_SizeDelta: {x: 485.4, y: 36.5}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1895203990
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1895203988}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 30
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 3
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: \'Personal info

\'
--- !u!222 &1895203991
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1895203988}
--- !u!1 &2017143694
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 2017143699}
  - component: {fileID: 2017143698}
  - component: {fileID: 2017143697}
  - component: {fileID: 2017143696}
  m_Layer: 0
  m_Name: loginCamera
  m_TagString: MainCamera
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!124 &2017143696
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
--- !u!92 &2017143697
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
--- !u!20 &2017143698
Camera:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
  serializedVersion: 2
  m_ClearFlags: 2
  m_BackGroundColor: {r: 1, g: 1, b: 1, a: 0}
  m_NormalizedViewPortRect:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  near clip plane: 0.3
  far clip plane: 1000
  field of view: 60
  orthographic: 1
  orthographic size: 5
  m_Depth: -1
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_RenderingPath: -1
  m_TargetTexture: {fileID: 0}
  m_TargetDisplay: 0
  m_TargetEye: 3
  m_HDR: 0
  m_AllowMSAA: 1
  m_ForceIntoRT: 0
  m_OcclusionCulling: 1
  m_StereoConvergence: 10
  m_StereoSeparation: 0.022
  m_StereoMirrorMode: 0
--- !u!4 &2017143699
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &2147237571
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 2147237572}
  - component: {fileID: 2147237574}
  - component: {fileID: 2147237573}
  m_Layer: 0
  m_Name: Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &2147237572
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2147237571}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 90407055}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: -0.5}
  m_SizeDelta: {x: -20, y: -13}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &2147237573
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2147237571}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 14
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 10
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 0
    m_HorizontalOverflow: 1
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &2147237574
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2147237571}
');

$ini_scene_reward_arch_unity_pattern = array("%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!29 &1
OcclusionCullingSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_OcclusionBakeSettings:
    smallestOccluder: 5
    smallestHole: 0.25
    backfaceThreshold: 100
  m_SceneGUID: 00000000000000000000000000000000
  m_OcclusionCullingData: {fileID: 0}
--- !u!104 &2
RenderSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 8
  m_Fog: 0
  m_FogColor: {r: 0.5, g: 0.5, b: 0.5, a: 1}
  m_FogMode: 3
  m_FogDensity: 0.01
  m_LinearFogStart: 0
  m_LinearFogEnd: 300
  m_AmbientSkyColor: {r: 0.212, g: 0.227, b: 0.259, a: 1}
  m_AmbientEquatorColor: {r: 0.114, g: 0.125, b: 0.133, a: 1}
  m_AmbientGroundColor: {r: 0.047, g: 0.043, b: 0.035, a: 1}
  m_AmbientIntensity: 1
  m_AmbientMode: 0
  m_SubtractiveShadowColor: {r: 0.42, g: 0.478, b: 0.627, a: 1}
  m_SkyboxMaterial: {fileID: 10304, guid: 0000000000000000f000000000000000, type: 0}
  m_HaloStrength: 0.5
  m_FlareStrength: 1
  m_FlareFadeSpeed: 3
  m_HaloTexture: {fileID: 0}
  m_SpotCookie: {fileID: 10001, guid: 0000000000000000e000000000000000, type: 0}
  m_DefaultReflectionMode: 0
  m_DefaultReflectionResolution: 128
  m_ReflectionBounces: 1
  m_ReflectionIntensity: 1
  m_CustomReflection: {fileID: 0}
  m_Sun: {fileID: 0}
  m_IndirectSpecularColor: {r: 0, g: 0, b: 0, a: 1}
--- !u!157 &3
LightmapSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 9
  m_GIWorkflowMode: 1
  m_GISettings:
    serializedVersion: 2
    m_BounceScale: 1
    m_IndirectOutputScale: 1
    m_AlbedoBoost: 1
    m_TemporalCoherenceThreshold: 1
    m_EnvironmentLightingMode: 0
    m_EnableBakedLightmaps: 1
    m_EnableRealtimeLightmaps: 1
  m_LightmapEditorSettings:
    serializedVersion: 8
    m_Resolution: 2
    m_BakeResolution: 40
    m_TextureWidth: 1024
    m_TextureHeight: 1024
    m_AO: 0
    m_AOMaxDistance: 1
    m_CompAOExponent: 1
    m_CompAOExponentDirect: 0
    m_Padding: 2
    m_LightmapParameters: {fileID: 0}
    m_LightmapsBakeMode: 1
    m_TextureCompression: 1
    m_FinalGather: 0
    m_FinalGatherFiltering: 1
    m_FinalGatherRayCount: 256
    m_ReflectionCompression: 2
    m_MixedBakeMode: 1
    m_BakeBackend: 0
    m_PVRSampling: 1
    m_PVRDirectSampleCount: 32
    m_PVRSampleCount: 500
    m_PVRBounces: 2
    m_PVRFiltering: 0
    m_PVRFilteringMode: 1
    m_PVRCulling: 1
    m_PVRFilteringGaussRadiusDirect: 1
    m_PVRFilteringGaussRadiusIndirect: 5
    m_PVRFilteringGaussRadiusAO: 2
    m_PVRFilteringAtrousColorSigma: 1
    m_PVRFilteringAtrousNormalSigma: 1
    m_PVRFilteringAtrousPositionSigma: 1
  m_LightingDataAsset: {fileID: 0}
  m_ShadowMaskMode: 2
--- !u!196 &4
NavMeshSettings:
  serializedVersion: 2
  m_ObjectHideFlags: 0
  m_BuildSettings:
    serializedVersion: 2
    agentTypeID: 0
    agentRadius: 0.5
    agentHeight: 2
    agentSlope: 45
    agentClimb: 0.4
    ledgeDropHeight: 0
    maxJumpAcrossDistance: 0
    minRegionArea: 2
    manualCellSize: 0
    cellSize: 0.16666667
    manualTileSize: 0
    tileSize: 256
    accuratePlacement: 0
  m_NavMeshData: {fileID: 0}
--- !u!1 &7849870
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 7849871}
  - component: {fileID: 7849874}
  - component: {fileID: 7849873}
  - component: {fileID: 7849872}
  - component: {fileID: 7849875}
  m_Layer: 0
  m_Name: canvas
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &7849871
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0, y: 0, z: 0}
  m_Children:
  - {fileID: 906480962}
  m_Father: {fileID: 0}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0, y: 0}
--- !u!114 &7849872
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1301386320, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_IgnoreReversedGraphics: 1
  m_BlockingObjects: 0
  m_BlockingMask:
    serializedVersion: 2
    m_Bits: 4294967295
--- !u!114 &7849873
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1980459831, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_UiScaleMode: 1
  m_ReferencePixelsPerUnit: 100
  m_ScaleFactor: 1
  m_ReferenceResolution: {x: 1366, y: 768}
  m_ScreenMatchMode: 0
  m_MatchWidthOrHeight: 0.5
  m_PhysicalUnit: 3
  m_FallbackScreenDPI: 96
  m_DefaultSpriteDPI: 96
  m_DynamicPixelsPerUnit: 1
--- !u!223 &7849874
Canvas:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  serializedVersion: 3
  m_RenderMode: 1
  m_Camera: {fileID: 2017143698}
  m_PlaneDistance: 100
  m_PixelPerfect: 0
  m_ReceivesEvents: 1
  m_OverrideSorting: 0
  m_OverridePixelPerfect: 0
  m_SortingBucketNormalizedSize: 0
  m_AdditionalShaderChannelsFlag: 25
  m_SortingLayerID: 0
  m_SortingOrder: 0
  m_TargetDisplay: 0
--- !u!114 &7849875
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 7849870}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 03c9931148ee551469a0fe973c8da4c4, type: 3}
  m_Name:
  m_EditorClassIdentifier:
--- !u!1 &246792908
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 246792909}
  - component: {fileID: 246792911}
  - component: {fileID: 246792910}
  m_Layer: 0
  m_Name: panel_reward_upper
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &246792909
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 246792908}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1716664600}
  - {fileID: 527040965}
  - {fileID: 2127236091}
  - {fileID: 812913344}
  - {fileID: 1574690523}
  - {fileID: 1550630588}
  m_Father: {fileID: 906480962}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 9}
  m_SizeDelta: {x: -200, y: -216}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &246792910
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 246792908}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.25, g: 0.25, b: 0.25, a: 0.65}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10907, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &246792911
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 246792908}
--- !u!1 &527040964
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 527040965}
  - component: {fileID: 527040966}
  - component: {fileID: 527040967}
  m_Layer: 0
  m_Name: txt_correctpower
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &527040965
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 527040964}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1.0001575, y: 1.0001575, z: 1.0001575}
  m_Children: []
  m_Father: {fileID: 246792909}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 218.92001, y: -150}
  m_SizeDelta: {x: 409.97, y: 42}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!222 &527040966
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 527040964}
--- !u!114 &527040967
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 527040964}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 25
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Time in Correct power
--- !u!1 &584755595
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 584755596}
  - component: {fileID: 584755599}
  - component: {fileID: 584755598}
  - component: {fileID: 584755597}
  m_Layer: 0
  m_Name: bt_reward_back
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &584755596
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 584755595}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1490137348}
  m_Father: {fileID: 906480962}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 0.5}
  m_AnchorMax: {x: 0.5, y: 0.5}
  m_AnchoredPosition: {x: 0, y: -360}
  m_SizeDelta: {x: 140, y: 40}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &584755597
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 584755595}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 0.9117647, g: 0.9117647, b: 0.9117647, a: 1}
    m_HighlightedColor: {r: 0.44117647, g: 0.44117647, b: 0.44117647, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 584755598}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 7849875}
        m_MethodName: onClick_LoadMainMenuScene
        m_Mode: 1
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument:
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &584755598
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 584755595}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10905, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &584755599
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 584755595}
--- !u!1 &812913343
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 812913344}
  - component: {fileID: 812913346}
  - component: {fileID: 812913345}
  m_Layer: 0
  m_Name: txt_overall_evaluation
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &812913344
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 812913343}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 246792909}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 541.5, y: -358}
  m_SizeDelta: {x: 1049, y: 88}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &812913345
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 812913343}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 28
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Overall evaluation
--- !u!222 &812913346
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 812913343}
--- !u!1 &876200816
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 876200817}
  - component: {fileID: 876200818}
  m_Layer: 0
  m_Name: Displayer
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!4 &876200817
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 876200816}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!114 &876200818
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 876200816}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 6a6b3ea5d4672c445b2a52a1ab90f94d, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  underPowerUsageText: {fileID: 0}
  correctPowerUsageText: {fileID: 0}
  overPowerUsageText: {fileID: 0}
  usage: {fileID: 0}
  moneyEarnedText: {fileID: 0}
  energyProducedText: {fileID: 0}
--- !u!1 &906480961
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 906480962}
  - component: {fileID: 906480964}
  - component: {fileID: 906480963}
  m_Layer: 0
  m_Name: rewardPanel
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &906480962
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 906480961}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1914531237}
  - {fileID: 584755596}
  - {fileID: 246792909}
  m_Father: {fileID: 7849871}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &906480963
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 906480961}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &906480964
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 906480961}
--- !u!1 &1441279932
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1441279935}
  - component: {fileID: 1441279934}
  - component: {fileID: 1441279933}
  m_Layer: 0
  m_Name: EventSystem
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &1441279933
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1441279932}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1077351063, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_HorizontalAxis: Horizontal
  m_VerticalAxis: Vertical
  m_SubmitButton: Submit
  m_CancelButton: Cancel
  m_InputActionsPerSecond: 10
  m_RepeatDelay: 0.5
  m_ForceModuleActive: 0
--- !u!114 &1441279934
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1441279932}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -619905303, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_FirstSelected: {fileID: 0}
  m_sendNavigationEvents: 1
  m_DragThreshold: 5
--- !u!4 &1441279935
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1441279932}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &1490137347
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1490137348}
  - component: {fileID: 1490137350}
  - component: {fileID: 1490137349}
  m_Layer: 0
  m_Name: Quit Text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1490137348
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1490137347}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 584755596}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: -0.0000019073}
  m_SizeDelta: {x: 37, y: 20}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1490137349
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1490137347}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 24
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: 'Main Menu '
--- !u!222 &1490137350
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1490137347}
--- !u!1 &1550630587
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1550630588}
  - component: {fileID: 1550630590}
  - component: {fileID: 1550630589}
  m_Layer: 0
  m_Name: txt_energy_produced
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1550630588
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1550630587}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0.9999123, y: 0.9999123, z: 0.9999123}
  m_Children: []
  m_Father: {fileID: 246792909}
  m_RootOrder: 5
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 541.49976, y: -550}
  m_SizeDelta: {x: 1049, y: 80}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1550630589
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1550630587}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 28
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: 'Energy produced:'
--- !u!222 &1550630590
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1550630587}
--- !u!1 &1574690522
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1574690523}
  - component: {fileID: 1574690525}
  - component: {fileID: 1574690524}
  m_Layer: 0
  m_Name: txt_money_earned
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1574690523
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1574690522}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0.9999123, y: 0.9999123, z: 0.9999123}
  m_Children: []
  m_Father: {fileID: 246792909}
  m_RootOrder: 4
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 541.49976, y: -450}
  m_SizeDelta: {x: 1049, y: 80}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1574690524
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1574690522}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 28
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: 'Money earned:'
--- !u!222 &1574690525
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1574690522}
--- !u!1 &1716664599
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1716664600}
  - component: {fileID: 1716664602}
  - component: {fileID: 1716664601}
  m_Layer: 0
  m_Name: txt_underpower
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1716664600
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1716664599}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 246792909}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 222, y: -37}
  m_SizeDelta: {x: 410, y: 36}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1716664601
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1716664599}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 25
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Time in Over power
--- !u!222 &1716664602
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1716664599}
--- !u!1 &1889019764
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1889019766}
  - component: {fileID: 1889019765}
  m_Layer: 0
  m_Name: Analyser
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &1889019765
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1889019764}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 4e48718256fca8d40b1cfa2d1cb8d0e5, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  endSimulation: 0
--- !u!4 &1889019766
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1889019764}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 3
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &1914531236
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1914531237}
  - component: {fileID: 1914531239}
  - component: {fileID: 1914531238}
  m_Layer: 0
  m_Name: txt_reward_title
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1914531237
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1914531236}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 906480962}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0.5, y: 1}
  m_AnchorMax: {x: 0.5, y: 1}
  m_AnchoredPosition: {x: -0.00079441, y: -40}
  m_SizeDelta: {x: 341, y: 46}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &1914531238
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1914531236}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0, g: 0, b: 0, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 30
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 3
    m_MaxSize: 40
    m_Alignment: 1
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Statistics
--- !u!222 &1914531239
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1914531236}
--- !u!1 &2017143694
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 2017143699}
  - component: {fileID: 2017143698}
  - component: {fileID: 2017143697}
  - component: {fileID: 2017143696}
  - component: {fileID: 2017143695}
  m_Layer: 0
  m_Name: camera
  m_TagString: MainCamera
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!81 &2017143695
AudioListener:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
--- !u!124 &2017143696
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
--- !u!92 &2017143697
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
--- !u!20 &2017143698
Camera:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_Enabled: 1
  serializedVersion: 2
  m_ClearFlags: 2
  m_BackGroundColor: {r: 0.21885814, g: 0.2652826, b: 0.33823532, a: 0}
  m_NormalizedViewPortRect:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  near clip plane: 0.3
  far clip plane: 1000
  field of view: 60
  orthographic: 1
  orthographic size: 5
  m_Depth: -1
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_RenderingPath: -1
  m_TargetTexture: {fileID: 0}
  m_TargetDisplay: 0
  m_TargetEye: 3
  m_HDR: 0
  m_AllowMSAA: 1
  m_ForceIntoRT: 0
  m_OcclusionCulling: 1
  m_StereoConvergence: 10
  m_StereoSeparation: 0.022
  m_StereoMirrorMode: 0
--- !u!4 &2017143699
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2017143694}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 1, z: -10}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 4
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &2127236088
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 2127236091}
  - component: {fileID: 2127236090}
  - component: {fileID: 2127236089}
  m_Layer: 0
  m_Name: txt_overpower
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &2127236089
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2127236088}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 25
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 254
    m_Alignment: 0
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: Time in Under power
--- !u!222 &2127236090
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2127236088}
--- !u!224 &2127236091
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2127236088}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1.0001575, y: 1.0001575, z: 1.0001575}
  m_Children: []
  m_Father: {fileID: 246792909}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 215.84, y: -253.22}
  m_SizeDelta: {x: 403.82, y: 37}
  m_Pivot: {x: 0.5, y: 0.5}
");

$ini_scene_selector_arch_unity_pattern = array('%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!29 &1
OcclusionCullingSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_OcclusionBakeSettings:
    smallestOccluder: 5
    smallestHole: 0.25
    backfaceThreshold: 100
  m_SceneGUID: 00000000000000000000000000000000
  m_OcclusionCullingData: {fileID: 0}
--- !u!104 &2
RenderSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 8
  m_Fog: 0
  m_FogColor: {r: 0.5, g: 0.5, b: 0.5, a: 1}
  m_FogMode: 3
  m_FogDensity: 0.01
  m_LinearFogStart: 0
  m_LinearFogEnd: 300
  m_AmbientSkyColor: {r: 0.212, g: 0.227, b: 0.259, a: 1}
  m_AmbientEquatorColor: {r: 0.114, g: 0.125, b: 0.133, a: 1}
  m_AmbientGroundColor: {r: 0.047, g: 0.043, b: 0.035, a: 1}
  m_AmbientIntensity: 1
  m_AmbientMode: 0
  m_SubtractiveShadowColor: {r: 0.42, g: 0.478, b: 0.627, a: 1}
  m_SkyboxMaterial: {fileID: 10304, guid: 0000000000000000f000000000000000, type: 0}
  m_HaloStrength: 0.5
  m_FlareStrength: 1
  m_FlareFadeSpeed: 3
  m_HaloTexture: {fileID: 0}
  m_SpotCookie: {fileID: 10001, guid: 0000000000000000e000000000000000, type: 0}
  m_DefaultReflectionMode: 0
  m_DefaultReflectionResolution: 128
  m_ReflectionBounces: 1
  m_ReflectionIntensity: 1
  m_CustomReflection: {fileID: 0}
  m_Sun: {fileID: 0}
  m_IndirectSpecularColor: {r: 0, g: 0, b: 0, a: 1}
--- !u!157 &3
LightmapSettings:
  m_ObjectHideFlags: 0
  serializedVersion: 11
  m_GIWorkflowMode: 1
  m_GISettings:
    serializedVersion: 2
    m_BounceScale: 1
    m_IndirectOutputScale: 1
    m_AlbedoBoost: 1
    m_TemporalCoherenceThreshold: 1
    m_EnvironmentLightingMode: 0
    m_EnableBakedLightmaps: 1
    m_EnableRealtimeLightmaps: 1
  m_LightmapEditorSettings:
    serializedVersion: 9
    m_Resolution: 2
    m_BakeResolution: 40
    m_TextureWidth: 1024
    m_TextureHeight: 1024
    m_AO: 0
    m_AOMaxDistance: 1
    m_CompAOExponent: 1
    m_CompAOExponentDirect: 0
    m_Padding: 2
    m_LightmapParameters: {fileID: 0}
    m_LightmapsBakeMode: 1
    m_TextureCompression: 1
    m_FinalGather: 0
    m_FinalGatherFiltering: 1
    m_FinalGatherRayCount: 256
    m_ReflectionCompression: 2
    m_MixedBakeMode: 2
    m_BakeBackend: 0
    m_PVRSampling: 1
    m_PVRDirectSampleCount: 32
    m_PVRSampleCount: 500
    m_PVRBounces: 2
    m_PVRFiltering: 0
    m_PVRFilteringMode: 1
    m_PVRCulling: 1
    m_PVRFilteringGaussRadiusDirect: 1
    m_PVRFilteringGaussRadiusIndirect: 5
    m_PVRFilteringGaussRadiusAO: 2
    m_PVRFilteringAtrousColorSigma: 1
    m_PVRFilteringAtrousNormalSigma: 1
    m_PVRFilteringAtrousPositionSigma: 1
  m_LightingDataAsset: {fileID: 0}
  m_UseShadowmask: 1
--- !u!196 &4
NavMeshSettings:
  serializedVersion: 2
  m_ObjectHideFlags: 0
  m_BuildSettings:
    serializedVersion: 2
    agentTypeID: 0
    agentRadius: 0.5
    agentHeight: 2
    agentSlope: 45
    agentClimb: 0.4
    ledgeDropHeight: 0
    maxJumpAcrossDistance: 0
    minRegionArea: 2
    manualCellSize: 0
    cellSize: 0.16666667
    manualTileSize: 0
    tileSize: 256
    accuratePlacement: 0
  m_NavMeshData: {fileID: 0}
--- !u!1 &24689964
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 24689965}
  - component: {fileID: 24689968}
  - component: {fileID: 24689967}
  - component: {fileID: 24689966}
  m_Layer: 5
  m_Name: Scroll View
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &24689965
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 24689964}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 269940631}
  - {fileID: 1829453063}
  m_Father: {fileID: 1542051721}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 1366, y: 768}
  m_Pivot: {x: 0, y: 1}
--- !u!114 &24689966
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 24689964}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10907, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &24689967
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 24689964}
--- !u!114 &24689968
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 24689964}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1367256648, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Content: {fileID: 517956296}
  m_Horizontal: 0
  m_Vertical: 1
  m_MovementType: 1
  m_Elasticity: 0.3
  m_Inertia: 1
  m_DecelerationRate: 0.135
  m_ScrollSensitivity: 8
  m_Viewport: {fileID: 269940631}
  m_HorizontalScrollbar: {fileID: 0}
  m_VerticalScrollbar: {fileID: 1829453064}
  m_HorizontalScrollbarVisibility: 2
  m_VerticalScrollbarVisibility: 2
  m_HorizontalScrollbarSpacing: -3
  m_VerticalScrollbarSpacing: -3
  m_OnValueChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.ScrollRect+ScrollRectEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!1 &103598761
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 103598762}
  - component: {fileID: 103598764}
  - component: {fileID: 103598763}
  m_Layer: 5
  m_Name: bt_scene_select_back_text
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &103598762
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 103598761}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 276124264}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &103598763
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 103598761}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.19607843, g: 0.19607843, b: 0.19607843, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 10102, guid: 0000000000000000e000000000000000, type: 0}
    m_FontSize: 22
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 2
    m_MaxSize: 40
    m_Alignment: 4
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text:
--- !u!222 &103598764
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 103598761}
--- !u!1 &269940630
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 269940631}
  - component: {fileID: 269940634}
  - component: {fileID: 269940633}
  - component: {fileID: 269940632}
  m_Layer: 5
  m_Name: Viewport
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &269940631
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 269940630}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 517956296}
  m_Father: {fileID: 24689965}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0, y: 1}
--- !u!114 &269940632
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 269940630}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10917, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &269940633
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 269940630}
--- !u!114 &269940634
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 269940630}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -1200242548, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_ShowMaskGraphic: 1
--- !u!1 &276124263
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 276124264}
  - component: {fileID: 276124267}
  - component: {fileID: 276124266}
  - component: {fileID: 276124265}
  - component: {fileID: 276124268}
  m_Layer: 5
  m_Name: bt_scene_selector_backmainmenu
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &276124264
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 276124263}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 103598762}
  m_Father: {fileID: 517956296}
  m_RootOrder: 0

  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 51.6, y: -57.6}
  m_SizeDelta: {x: 61.2, y: 37.7}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &276124265
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 276124263}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1392445389, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.7205882, g: 0.7205882, b: 0.7205882, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 276124266}
  m_OnClick:
    m_PersistentCalls:
      m_Calls:
      - m_Target: {fileID: 276124268}
        m_MethodName: onClick_LoadScene
        m_Mode: 5
        m_Arguments:
          m_ObjectArgument: {fileID: 0}
          m_ObjectArgumentAssemblyTypeName: UnityEngine.Object, UnityEngine
          m_IntArgument: 0
          m_FloatArgument: 0
          m_StringArgument: S_MainMenu
          m_BoolArgument: 0
        m_CallState: 2
    m_TypeName: UnityEngine.UI.Button+ButtonClickedEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &276124266
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 276124263}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 21300000, guid: 983743c8b961cb549bb03b160f624708, type: 3}
  m_Type: 0
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &276124267
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 276124263}
--- !u!114 &276124268
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 276124263}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 939bc54096dabc54fa51501482013178, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  doorID:
--- !u!1 &340477497
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 340477498}
  - component: {fileID: 340477500}
  - component: {fileID: 340477499}
  m_Layer: 5
  m_Name: txt_SceneSelector
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &340477498
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 340477497}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 517956296}
  m_RootOrder: 1

  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 16.040955, y: -63.816727}
  m_SizeDelta: {x: -538.9833, y: 95}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &340477499
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 340477497}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 708705254, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 0.5441177, g: 0.5441177, b: 0.5441177, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_FontData:
    m_Font: {fileID: 12800000, guid: 7e0a34d73d4109c4fa2a309eea69e670, type: 3}
    m_FontSize: 40
    m_FontStyle: 0
    m_BestFit: 0
    m_MinSize: 0
    m_MaxSize: 300
    m_Alignment: 1
    m_AlignByGeometry: 0
    m_RichText: 1
    m_HorizontalOverflow: 0
    m_VerticalOverflow: 0
    m_LineSpacing: 1
  m_Text: ___[text_title_scene_selector]___

--- !u!222 &340477500
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 340477497}
--- !u!1 &512650680
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 512650681}
  - component: {fileID: 512650683}
  - component: {fileID: 512650682}
  m_Layer: 5
  m_Name: Handle
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &512650681
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 512650680}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 1017623856}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 20, y: 20}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!114 &512650682
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 512650680}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10905, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &512650683
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 512650680}
--- !u!1 &517956295
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 517956296}
  - component: {fileID: 517956298}
  - component: {fileID: 517956297}
  m_Layer: 5
  m_Name: Content
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &517956296
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 517956295}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  # ReplaceChildren
  - {fileID: 276124264}
  - {fileID: 340477498}
  m_Father: {fileID: 269940631}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 1}
  m_AnchorMax: {x: 0, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 1345, y: 2335}
  m_Pivot: {x: 0, y: 1}
--- !u!114 &517956297
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 517956295}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &517956298
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 517956295}
--- !u!1 &1017623855
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1017623856}
  m_Layer: 5
  m_Name: Sliding Area
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1017623856
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1017623855}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 512650681}
  m_Father: {fileID: 1829453063}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: -20, y: -20}
  m_Pivot: {x: 0.5, y: 0.5}
--- !u!1 &1425248643
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1425248646}
  - component: {fileID: 1425248645}
  - component: {fileID: 1425248644}
  m_Layer: 0
  m_Name: EventSystem
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &1425248644
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1425248643}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1077351063, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_HorizontalAxis: Horizontal
  m_VerticalAxis: Vertical
  m_SubmitButton: Submit
  m_CancelButton: Cancel
  m_InputActionsPerSecond: 10
  m_RepeatDelay: 0.5
  m_ForceModuleActive: 0
--- !u!114 &1425248645
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1425248643}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -619905303, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_FirstSelected: {fileID: 0}
  m_sendNavigationEvents: 1
  m_DragThreshold: 5
--- !u!4 &1425248646
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1425248643}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
--- !u!1 &1542051717
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1542051721}
  - component: {fileID: 1542051720}
  - component: {fileID: 1542051719}
  - component: {fileID: 1542051718}
  m_Layer: 5
  m_Name: Canvas
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!114 &1542051718
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1542051717}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1301386320, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_IgnoreReversedGraphics: 1
  m_BlockingObjects: 0
  m_BlockingMask:
    serializedVersion: 2
    m_Bits: 4294967295
--- !u!114 &1542051719
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1542051717}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 1980459831, guid: f70555f144d8491a825f0804e09c671c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_UiScaleMode: 1
  m_ReferencePixelsPerUnit: 100
  m_ScaleFactor: 1
  m_ReferenceResolution: {x: 1366, y: 768}
  m_ScreenMatchMode: 0
  m_MatchWidthOrHeight: 0.5
  m_PhysicalUnit: 3
  m_FallbackScreenDPI: 96
  m_DefaultSpriteDPI: 96
  m_DynamicPixelsPerUnit: 1
--- !u!223 &1542051720
Canvas:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1542051717}
  m_Enabled: 1
  serializedVersion: 3
  m_RenderMode: 0
  m_Camera: {fileID: 2129483485}
  m_PlaneDistance: 100
  m_PixelPerfect: 0
  m_ReceivesEvents: 1
  m_OverrideSorting: 0
  m_OverridePixelPerfect: 0
  m_SortingBucketNormalizedSize: 0
  m_AdditionalShaderChannelsFlag: 0
  m_SortingLayerID: 0
  m_SortingOrder: 0
  m_TargetDisplay: 0
--- !u!224 &1542051721
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1542051717}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 0, y: 0, z: 0}
  m_Children:
  - {fileID: 24689965}
  m_Father: {fileID: 0}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 0, y: 0}
  m_AnchorMax: {x: 0, y: 0}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 0, y: 0}
  m_Pivot: {x: 0, y: 0}
--- !u!1 &1829453062
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 1829453063}
  - component: {fileID: 1829453066}
  - component: {fileID: 1829453065}
  - component: {fileID: 1829453064}
  m_Layer: 5
  m_Name: Scrollbar Vertical
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!224 &1829453063
RectTransform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1829453062}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children:
  - {fileID: 1017623856}
  m_Father: {fileID: 24689965}
  m_RootOrder: 1
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
  m_AnchorMin: {x: 1, y: 0}
  m_AnchorMax: {x: 1, y: 1}
  m_AnchoredPosition: {x: 0, y: 0}
  m_SizeDelta: {x: 20, y: 0}
  m_Pivot: {x: 1, y: 0.5}
--- !u!114 &1829453064
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1829453062}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -2061169968, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Navigation:
    m_Mode: 3
    m_SelectOnUp: {fileID: 0}
    m_SelectOnDown: {fileID: 0}
    m_SelectOnLeft: {fileID: 0}
    m_SelectOnRight: {fileID: 0}
  m_Transition: 1
  m_Colors:
    m_NormalColor: {r: 1, g: 1, b: 1, a: 1}
    m_HighlightedColor: {r: 0.9607843, g: 0.9607843, b: 0.9607843, a: 1}
    m_PressedColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 1}
    m_DisabledColor: {r: 0.78431374, g: 0.78431374, b: 0.78431374, a: 0.5019608}
    m_ColorMultiplier: 1
    m_FadeDuration: 0.1
  m_SpriteState:
    m_HighlightedSprite: {fileID: 0}
    m_PressedSprite: {fileID: 0}
    m_DisabledSprite: {fileID: 0}
  m_AnimationTriggers:
    m_NormalTrigger: Normal
    m_HighlightedTrigger: Highlighted
    m_PressedTrigger: Pressed
    m_DisabledTrigger: Disabled
  m_Interactable: 1
  m_TargetGraphic: {fileID: 512650682}
  m_HandleRect: {fileID: 512650681}
  m_Direction: 2
  m_Value: 1
  m_Size: 0.32890794
  m_NumberOfSteps: 0
  m_OnValueChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.Scrollbar+ScrollEvent, UnityEngine.UI, Version=1.0.0.0,
      Culture=neutral, PublicKeyToken=null
--- !u!114 &1829453065
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1829453062}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: -765806418, guid: f5f67c52d1564df4a8936ccd202a3bd8, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  m_Material: {fileID: 0}
  m_Color: {r: 1, g: 1, b: 1, a: 1}
  m_RaycastTarget: 1
  m_OnCullStateChanged:
    m_PersistentCalls:
      m_Calls: []
    m_TypeName: UnityEngine.UI.MaskableGraphic+CullStateChangedEvent, UnityEngine.UI,
      Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
  m_Sprite: {fileID: 10907, guid: 0000000000000000f000000000000000, type: 0}
  m_Type: 1
  m_PreserveAspect: 0
  m_FillCenter: 1
  m_FillMethod: 4
  m_FillAmount: 1
  m_FillClockwise: 1
  m_FillOrigin: 0
--- !u!222 &1829453066
CanvasRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 1829453062}
--- !u!1 &2129483481
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  serializedVersion: 5
  m_Component:
  - component: {fileID: 2129483486}
  - component: {fileID: 2129483485}
  - component: {fileID: 2129483484}
  - component: {fileID: 2129483483}
  - component: {fileID: 2129483482}
  m_Layer: 0
  m_Name: Main Camera
  m_TagString: MainCamera
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!81 &2129483482
AudioListener:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2129483481}
  m_Enabled: 1
--- !u!124 &2129483483
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2129483481}
  m_Enabled: 1
--- !u!92 &2129483484
Behaviour:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2129483481}
  m_Enabled: 1
--- !u!20 &2129483485
Camera:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2129483481}
  m_Enabled: 1
  serializedVersion: 2
  m_ClearFlags: 2
  m_BackGroundColor: {r: 1, g: 1, b: 1, a: 0}
  m_NormalizedViewPortRect:
    serializedVersion: 2
    x: 0
    y: 0
    width: 1
    height: 1
  near clip plane: 0.3
  far clip plane: 1000
  field of view: 60
  orthographic: 0
  orthographic size: 5
  m_Depth: -1
  m_CullingMask:
    serializedVersion: 2
    m_Bits: 4294967295
  m_RenderingPath: -1
  m_TargetTexture: {fileID: 0}
  m_TargetDisplay: 0
  m_TargetEye: 3
  m_HDR: 1
  m_AllowMSAA: 1
  m_ForceIntoRT: 0
  m_OcclusionCulling: 1
  m_StereoConvergence: 10
  m_StereoSeparation: 0.022
  m_StereoMirrorMode: 0
--- !u!4 &2129483486
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_GameObject: {fileID: 2129483481}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalPosition: {x: 0, y: 1, z: -10}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
');

$ini_scene_selector_arch_unity_pattern2 = array('--- !u!1001 &___[guid_tile_sceneselector]___
Prefab:
  m_ObjectHideFlags: 0
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 517956296}
    m_Modifications:
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_LocalPosition.x
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_LocalPosition.y
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_LocalPosition.z
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_LocalRotation.x
      value: -0
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_LocalRotation.y
      value: -0
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_LocalRotation.z
      value: -0
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_LocalRotation.w
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_RootOrder
      value: ___[seq_index_of_scene]___
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_AnchoredPosition.x
      value:  ___[tile_pos_x]___
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_AnchoredPosition.y
      value: ___[tile_pos_y]___
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_SizeDelta.x
      value: 359
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_SizeDelta.y
      value: 264
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_AnchorMin.x
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_AnchorMin.y
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_AnchorMax.x
      value: 0
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_AnchorMax.y
      value: 1
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_Pivot.x
      value: 0.5
      objectReference: {fileID: 0}
    - target: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_Pivot.y
      value: 0.5
      objectReference: {fileID: 0}
    - target: {fileID: 1286309294367780, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_Name
      value: ___[name_of_panel]___
      objectReference: {fileID: 0}
    - target: {fileID: 114607550742731750, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_Sprite
      value:
      objectReference: {fileID: 21300000, guid: ___[guid_sprite_scene_featured_img]___, type: 3}
    - target: {fileID: 114367097283827688, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_OnClick.m_PersistentCalls.m_Calls.Array.data[0].m_Arguments.m_StringArgument
      value: ___[name_of_scene_to_load]___
      objectReference: {fileID: 0}
    - target: {fileID: 114366394777950298, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_Text
      value: ___[text_title_tile]___
      objectReference: {fileID: 0}
    - target: {fileID: 114464505631593652, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
      propertyPath: m_Text
      value: "___[text_description_tile]___"
      objectReference: {fileID: 0}
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 100100000, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
  m_IsPrefabParent: 0
--- !u!224 &___[guid_tile_recttransform]___ stripped
RectTransform:
  m_PrefabParentObject: {fileID: 224099073381717880, guid: a0340f4cf6f38a54e9b75a54111fc8da, type: 2}
  m_PrefabInternal: {fileID: ___[guid_tile_sceneselector]___}
');

$ini_scene_selector_arch_text = 'Select a Scene';

function vrodos_default_value_wonderaround_unity_archaeology_get(){
  global $ini_scene_wonder_around_unity_pattern;
  return $ini_scene_wonder_around_unity_pattern[0];
}

function vrodos_default_value_mmenu_unity_archaeology_get(){
  global $ini_scene_main_menu_arch_unity_pattern;
  return $ini_scene_main_menu_arch_unity_pattern[0];
}

function vrodos_default_value_credits_unity_archaeology_get(){
  global $ini_scene_credits_arch_unity_pattern;
  return $ini_scene_credits_arch_unity_pattern[0];
}

function vrodos_default_value_options_unity_archaeology_get(){
  global $ini_scene_options_arch_unity_pattern;
  return $ini_scene_options_arch_unity_pattern[0];
}

function vrodos_default_value_help_unity_archaeology_get(){
  global $ini_scene_help_arch_unity_pattern;
  return $ini_scene_help_arch_unity_pattern[0];
}

function vrodos_default_value_login_unity_archaeology_get(){
  global $ini_scene_login_arch_unity_pattern;
  return $ini_scene_login_arch_unity_pattern[0];
}

function vrodos_default_value_reward_unity_archaeology_get(){
  global $ini_scene_reward_arch_unity_pattern;
  return $ini_scene_reward_arch_unity_pattern[0];
}

function vrodos_default_value_selector_unity_archaeology_get(){
  global $ini_scene_selector_arch_unity_pattern;
  return $ini_scene_selector_arch_unity_pattern[0];
}

function vrodos_default_value_selector2_unity_archaeology_get(){
  global $ini_scene_selector_arch_unity_pattern2;
  return $ini_scene_selector_arch_unity_pattern2[0];
}

function vrodos_default_value_selectortext_unity_archaeology_get(){
  global $ini_scene_selector_arch_text;
  return $ini_scene_selector_arch_text;
}

/***************************************************************************************************************/
//
/***************************************************************************************************************/


?>
