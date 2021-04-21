<?php

/***************************************************************************************************************/
// YAMLS for ASSETS' TYPES default values (CHEMISTRY GAMES)
/***************************************************************************************************************/


global $ini_asset_room,$ini_asset_gate,$ini_asset_molecule;

$ini_asset_room = array('');

$ini_asset_gate = array('');

$ini_asset_molecule = array('');

function vrodos_default_value_room_get(){
  global $ini_asset_room;
  return $ini_asset_room[0];
}

function vrodos_default_value_gate_get(){
  global $ini_asset_gate;
  return $ini_asset_gate[0];
}

function vrodos_default_value_molecule_get(){
  global $ini_asset_molecule;
  return $ini_asset_molecule[0];
}


/***************************************************************************************************************/
// YAMLS for GAMES' TYPES Project Settings default values (CHEMISTRY GAMES)
/***************************************************************************************************************/

global $AudioManager_asset3,$ClusterInputManager_asset3,$DynamicsManager_asset3,$EditorBuildSettings_asset3,$EditorSettings_asset3,$GraphicsSettings_asset3;
global $InputManager_asset3,$NavMeshAreas_asset3,$NetworkManager_asset3,$Physics2DSettings_asset3,$ProjectSettings_asset3,$ProjectVersion_asset3;
global $QualitySettings_asset3,$TagManager_asset3,$TimeManager_asset3,$UnityConnect_asset3;

//4th alphabetically:  EditorBuildSettings.asset   : It is the only that should change across compilations
// Each scene should be added with
//$sceneToAddPattern = array("  - enabled: 1
//    path: Assets/scenes/S_MainMenu.unity");
// Line change with character: chr(10)

//1. AudioManager.asset
$AudioManager_asset3 = array('');

//2. ClusterInputManager.asset
$ClusterInputManager_asset3 = array('');

//3. DynamicsManager.asset
$DynamicsManager_asset3 = array('');

//4. EditorBuildSettings.asset
$EditorBuildSettings_asset3 = array('');

//5. EditorSettings.asset
$EditorSettings_asset3 = array('');

//6. GraphicsSettings.asset
$GraphicsSettings_asset3 = array('');

//7. InputManager.asset
$InputManager_asset3 = array('');

//8. NavMeshAreas.asset
$NavMeshAreas_asset3 = array('');

//9. NetworkManager.asset
$NetworkManager_asset3 = array('');

//10. Physics2DSettings.asset
$Physics2DSettings_asset3 = array('');

//11. ProjectSettings.asset
$ProjectSettings_asset3 = array('');

//12. ProjectVersion.asset
$ProjectVersion_asset3 = array('');

//13. QualitySettings.asset
$QualitySettings_asset3 = array('');

//14. TagManager.asset
$TagManager_asset3 = array('');

//15. TimeManager.asset
$TimeManager_asset3 = array('');

//16. UnityConnect.asset
$UnityConnect_asset3 = array('');

function vrodos_default_value_AudioManager_chemistry_get(){
  global $AudioManager_asset3;
  return $AudioManager_asset3[0];
}

function vrodos_default_value_ClusterInputManager_chemistry_get(){
  global $ClusterInputManager_asset3;
  return $ClusterInputManager_asset3[0];
}

function vrodos_default_value_DynamicsManager_chemistry_get(){
  global $DynamicsManager_asset3;
  return $DynamicsManager_asset3[0];
}

function vrodos_default_value_EditorBuildSettings_chemistry_get(){
  global $EditorBuildSettings_asset3;
  return $EditorBuildSettings_asset3[0];
}

function vrodos_default_value_EditorSettings_chemistry_get(){
  global $EditorSettings_asset3;
  return $EditorSettings_asset3[0];
}

function vrodos_default_value_GraphicsSettings_chemistry_get(){
  global $GraphicsSettings_asset3;
  return $GraphicsSettings_asset3[0];
}

function vrodos_default_value_InputManager_chemistry_get(){
  global $InputManager_asset3;
  return $InputManager_asset3[0];
}

function vrodos_default_value_NavMeshAreas_chemistry_get(){
  global $NavMeshAreas_asset3;
  return $NavMeshAreas_asset3[0];
}

function vrodos_default_value_NetworkManager_chemistry_get(){
  global $NetworkManager_asset3;
  return $NetworkManager_asset3[0];
}

function vrodos_default_value_Physics2DSettings_chemistry_get(){
  global $Physics2DSettings_asset3;
  return $Physics2DSettings_asset3[0];
}

function vrodos_default_value_ProjectSettings_chemistry_get(){
  global $ProjectSettings_asset3;
  return $ProjectSettings_asset3[0];
}

function vrodos_default_value_ProjectVersion_chemistry_get(){
  global $ProjectVersion_asset3;
  return $ProjectVersion_asset3[0];
}

function vrodos_default_value_QualitySettings_chemistry_get(){
  global $QualitySettings_asset3;
  return $QualitySettings_asset3[0];
}

function vrodos_default_value_TagManager_chemistry_get(){
  global $TagManager_asset3;
  return $TagManager_asset3[0];
}

function vrodos_default_value_TimeManager_chemistry_get(){
  global $TimeManager_asset3;
  return $TimeManager_asset3[0];
}

function vrodos_default_value_unityConnect_chemistry_get(){
  global $UnityConnect_asset3;
  return $UnityConnect_asset3[0];
}

/***************************************************************************************************************/
// YAMLS for SCENES default values (CHEMISTRY GAMES)
/***************************************************************************************************************/

global $ini_scene_chemistry_unity_pattern,$ini_scene_main_menu_chem_unity_pattern,$ini_scene_credits_chem_unity_pattern,$ini_scene_options_chem_unity_pattern,$ini_scene_help_chem_unity_pattern;
global $ini_scene_login_chem_unity_pattern,$ini_scene_reward_chem_unity_pattern,$ini_scene_selector_chem_unity_pattern,$ini_scene_selector_chem_unity_pattern2,$ini_scene_selector_chem_text;
global $ini_scene_chem_exam,$ini_scene_chem_exam3d;

$ini_scene_chemistry_unity_pattern = array('');

$ini_scene_main_menu_chem_unity_pattern = array('');

$ini_scene_credits_chem_unity_pattern = array('');

$ini_scene_options_chem_unity_pattern = array('');

$ini_scene_help_chem_unity_pattern = array('');

$ini_scene_login_chem_unity_pattern = array('');

$ini_scene_reward_chem_unity_pattern = array('');

$ini_scene_selector_chem_unity_pattern = array('');

$ini_scene_selector_chem_unity_pattern2 = array('');

$ini_scene_selector_chem_text = '';

$ini_scene_chem_exam = array('');

$ini_scene_chem_exam3d = array('');

function vrodos_default_value_chemwonderaround_unity_chemistry_get(){
  global $ini_scene_chemistry_unity_pattern;
  return $ini_scene_chemistry_unity_pattern[0];
}

function vrodos_default_value_mmenu_unity_chemistry_get(){
  global $ini_scene_main_menu_chem_unity_pattern;
  return $ini_scene_main_menu_chem_unity_pattern[0];
}

function vrodos_default_value_credits_unity_chemistry_get(){
  global $ini_scene_credits_chem_unity_pattern;
  return $ini_scene_credits_chem_unity_pattern[0];
}

function vrodos_default_value_options_unity_chemistry_get(){
  global $ini_scene_options_chem_unity_pattern;
  return $ini_scene_options_chem_unity_pattern[0];
}

function vrodos_default_value_help_unity_chemistry_get(){
  global $ini_scene_help_chem_unity_pattern;
  return $ini_scene_help_chem_unity_pattern[0];
}

function vrodos_default_value_login_unity_chemistry_get(){
  global $ini_scene_login_chem_unity_pattern;
  return $ini_scene_login_chem_unity_pattern[0];
}

function vrodos_default_value_reward_unity_chemistry_get(){
  global $ini_scene_reward_chem_unity_pattern;
  return $ini_scene_reward_chem_unity_pattern[0];
}

function vrodos_default_value_selector_unity_chemistry_get(){
  global $ini_scene_selector_chem_unity_pattern;
  return $ini_scene_selector_chem_unity_pattern[0];
}

function vrodos_default_value_selector2_unity_chemistry_get(){
  global $ini_scene_selector_chem_unity_pattern2;
  return $ini_scene_selector_chem_unity_pattern2[0];
}

function vrodos_default_value_selectortext_unity_chemistry_get(){
  global $ini_scene_selector_chem_text;
  return $ini_scene_selector_chem_text;
}

function vrodos_default_value_exam_unity_chemistry_get(){
  global $ini_scene_chem_exam;
  return $ini_scene_chem_exam[0];
}

function vrodos_default_value_exam3d_unity_chemistry_get(){
  global $ini_scene_chem_exam3d;
  return $ini_scene_chem_exam3d[0];
}

?>
