<?php
/**
 * Class PDBLoader
 *
 * This class makes the molecule.prefab and molecule.prefab.meta
 * Also it makes the atoms.mat and atoms.meta.mat for each atom of the molecule
 *
 */

////--TESTING DATA --
//
//// POST_ID: This is inserted into fids and guids to ensure that there are not replications
//$post_id = "123";
//
//// Real paths

//$gameName = "chemtestUnity";
//$prefab_path = "C:\\xampp7\htdocs\wordpress\wp-content\uploads\chemtestUnity\Assets\StandardAssets\Prefabs\\";
//$dirMaterials = $prefab_path."Elements\Transparent";
//$dirMolecules = $prefab_path."Molecules";
//
//// DEBUG paths are a little bit shorter
//$dirMaterials = "Molecules";
//$dirMolecules = "Molecules";
//
//// TEST WATER
//
//
////$molecule_name = "wAter";
//$pdb_str =
//"HEADER".'\n'.
//"COMPND".'\n'.
//"TITLE".'\n'.
//"SOURCE".'\n'.
//"HETATM    1  H   HOH     1      -0.174  -0.813  0".'\n'.
//"HETATM    2  H   HOH     1      -0.174   0.820  0".'\n'.
//"HETATM    3  O   HOH     1       0.403   0.004  0".'\n'.
//"CONECT    1    3".'\n'.
//"CONECT    2    3".'\n'.
//"END";
//
//// TEST AMMONIA
//
//$molecule_name = "ammonia";
//$pdb_str = "HEADER".'\n'.
//    "COMPND".'\n'.
//    "TITLE".'\n'.
//    "ATOM      1  N           1       0.257  -0.363   0.000  1.00  0.11".'\n'.
//    "ATOM      2  H           1       0.257   0.727   0.000  1.00  0.11".'\n'.
//    "ATOM      3  H           1       0.771  -0.727   0.890  1.00  0.11".'\n'.
//    "ATOM      4  H           1       0.771  -0.727  -0.890  1.00  0.11".'\n'.
//    "CONECT    1    2".'\n'.
//    "CONECT    1    3".'\n'.
//    "CONECT    1    4".'\n'.
//    "END";

// Create the parser class
//$pdbloader = new PDBLoader($pdb_str);
//
//// parse the pdb into atoms and verticesBonds
//$molecule = $pdbloader->parser();
//
//// Make the materials and their metas
//$pdbloader->saveTheMaterial($molecule['atoms'], $dirMaterials);
//
//// Make the prefab and its meta
//$pdbloader->makeThePrefab($post_id, $molecule_name, $molecule['atoms'], $molecule['verticesBonds'],$dirMolecules);


/**
 * Class PDBLoader
 */
class PDBLoader {
 
     public $_pdbContent;


    
    public $atomsDictionary = array("Br"=>"Bromine","H"=>"Hydrogen","C"=>"Carbon","N"=>"Nitrogen","O"=>"Oxygen","He"=>"Helium","Li"=>"Lithium","Ne"=>"Beryllium","B"=>"Boron", "F"=>"Fluorine","Ne"=>"Neon","Na"=>"Sodium","Mg"=>"Magnesium","Al"=>"Aluminum","Si"=>"Silicon","P"=>"Phosphorus","S"=>"Sulfur","Cl"=>"Chlorine","Ar"=>"Argon","K"=>"Potassium","Ca"=>"Calcium","Fe"=>"Iron", "Cu"=>"Copper", "Zn"=>"Zinc", "Ag"=>"Silver","I"=>"Iodine","Au"=>"Gold","Hg"=>"Mercury","Tl"=>"Thallium","Pb"=>"Lead",
        "Sc"=>"Scandium","Ti"=>"Titanium","V"=>"Vanadium","Cr"=>"Chromium","Mn"=>"Manganese",
        "Co"=>"Cobalt","Ni"=>"Nickel","Ga"=>"Gallium","Ge"=>"Germanium","As"=>"Arsenic",
        "Se"=>"Selenium","Kr"=>"Krypton","Rb"=>"Rubidium","Sr"=>"Strontium", "Y"=>"Yttrium","Zr"=>"Zirconium","Nb"=>"Niobium","Mo"=>"Molybdenum","Tc"=>"Technetium",
        "Ru"=>"Ruthenium","Rh"=>"Rhodium","Pd"=>"Palladium","Cd"=>"Cadmium","In"=>"Indium",
        "Sn"=>"Tin","Sb"=>"Antimony","Te"=>"Tellurium","Xe"=>"Xenon","Cs"=>"Cesium",
        "Ba"=>"Barium","La"=>"Lanthanum","Ce"=>"Cerium","Pr"=>"Praseodymium","Nd"=>"Neodymium",
        "Pm"=>"Promethium","Sm"=>"Samarium","Eu"=>"Europium","Gd" =>"Gadolinium","Tb" =>"Terbium",
        "Dy"=>"Dysprosium", "Ho" =>"Holmium","Er"=>"Erbium","Tm"=>"Thulium","Yb =>Ytterbium",
        "Lu"=>"Lutetium","Hf"=>"Hafnium","Ta"=>"Tantalum","W" =>"Tungsten","Re"=>"Rhenium",
        "Os"=>"Osmium","Ir"=>"Iridium","Pt"=>"Platinum","Bi"=>"Bismuth","Po"=>"Polonium",
        "At"=>"Astatine","Rn"=>"Radon","Fr"=>"Francium","Ra"=>"Radium","Ac"=>"Actinium","Th"=>"Thorium",
        "Pa"=>"Protactinium","U"=>"Uranium","Np"=>"Neptunium","Pu"=>"Plutonium" ,"Am"=>"Americium",
        "Cm"=>"Curium","Bk" =>"Berkelium","Cf"=>"Californium","Es"=>"Einsteinium","Fm" =>"Fermium",
        "Md"=>"Mendelevium","No" =>"Nobelium","Lr"=>"Lawrencium","Rf" =>"Rutherfordium","Db" =>"Dubnium",
        "Sg"=>"Seaborgium","Bh"=>"Bohrium","Hs"=>"Hassium","Mt" =>"Meitnerium","Ds" =>"Darmstadtium",
        "Rg"=>"Roentgenium", "Cn"=>"Copernicium","Nh"=>"Nihonium","Fl"=>"Flerovium","Mc" =>"Moscovium","Lv"=>"Livermorium",
        "Ts"=>"Tennessine","Og"=>"Oganesson");
    
    public $atomColorsDict = array("h" => array(255, 255, 255), "he" => array(217, 255, 255), "li" => array(204, 128, 255), "be" => array(194, 255, 0), "b" => array(255, 181, 181), "c" => array(144, 144, 144), "n" => array(48, 80, 248), "o" => array(255, 13, 13), "f" => array(144, 224, 80), "ne" => array(179, 227, 245), "na" => array(171, 92, 242), "mg" => array(138, 255, 0), "al" => array(191, 166, 166), "si" => array(240, 200, 160), "p" => array(255, 128, 0), "s" => array(255, 255, 48), "cl" => array(31, 240, 31), "ar" => array(128, 209, 227), "k" => array(143, 64, 212), "ca" => array(133, 133, 133), "sc" => array(230, 230, 230), "ti" => array(191, 194, 199), "v" => array(166, 166, 171), "cr" => array(138, 153, 199), "mn" => array(156, 122, 199), "fe" => array(224, 102, 51), "co" => array(240, 144, 160), "ni" => array(80, 208, 80), "cu" => array(200, 128, 51), "zn" => array(125, 128, 176), "ga" => array(194, 143, 143), "ge" => array(102, 143, 143), "as" => array(189, 128, 227), "se" => array(255, 161, 0), "br" => array(166, 41, 41), "kr" => array(92, 184, 209), "rb" => array(112, 46, 176), "sr" => array(0, 255, 0), "y" => array(148, 255, 255), "zr" => array(148, 224, 224), "nb" => array(115, 194, 201), "mo" => array(84, 181, 181), "tc" => array(59, 158, 158), "ru" => array(36, 143, 143), "rh" => array(10, 125, 140), "pd" => array(0, 105, 133), "ag" => array(192, 192, 192), "cd" => array(255, 217, 143), "in" => array(166, 117, 115), "sn" => array(102, 128, 128), "sb" => array(158, 99, 181), "te" => array(212, 122, 0), "i" => array(148, 0, 148), "xe" => array(66, 158, 176), "cs" => array(87, 23, 143), "ba" => array(0, 201, 0), "la" => array(112, 212, 255), "ce" => array(255, 255, 199), "pr" => array(217, 255, 199), "nd" => array(199, 255, 199), "pm" => array(163, 255, 199), "sm" => array(143, 255, 199), "eu" => array(97, 255, 199), "gd" => array(69, 255, 199), "tb" => array(48, 255, 199), "dy" => array(31, 255, 199), "ho" => array(0, 255, 156), "er" => array(0, 230, 117), "tm" => array(0, 212, 82), "yb" => array(0, 191, 56), "lu" => array(0, 171, 36), "hf" => array(77, 194, 255), "ta" => array(77, 166, 255), "w" => array(33, 148, 214), "re" => array(38, 125, 171), "os" => array(38, 102, 150), "ir" => array(23, 84, 135), "pt" => array(208, 208, 224), "au" => array(255, 209, 35), "hg" => array(184, 184, 208), "tl" => array(166, 84, 77), "pb" => array(87, 89, 97), "bi" => array(158, 79, 181), "po" => array(171, 92, 0), "at" => array(117, 79, 69), "rn" => array(66, 130, 150), "fr" => array(66, 0, 102), "ra" => array(0, 125, 0), "ac" => array(112, 171, 250), "th" => array(0, 186, 255), "pa" => array(0, 161, 255), "u" => array(0, 143, 255), "np" => array(0, 128, 255), "pu" => array(0, 107, 255), "am" => array(84, 92, 242), "cm" => array(120, 92, 227), "bk" => array(138, 79, 227), "cf" => array(161, 54, 212), "es" => array(179, 31, 212), "fm" => array(179, 31, 186), "md" => array(179, 13, 166), "no" => array(189, 13, 135), "lr" => array(199, 0, 102), "rf" => array(204, 0, 89), "db" => array(209, 0, 79), "sg" => array(217, 0, 69), "bh" => array(224, 0, 56), "hs" => array(230, 0, 46), "mt" => array(235, 0, 38), "ds" => array(235, 0, 38), "rg" => array(235, 0, 38), "cn" => array(235, 0, 38), "uut" => array(235, 0, 38), "uuq" => array(235, 0, 38), "uup" => array(235, 0, 38), "uuh" => array(235, 0, 38), "uus" => array(235, 0, 38), "uuo" => array(235, 0, 38));
    
    /**
     *
     * The YAML pattern for the material of an atom and its meta (bonds do not need a mat, they have the default grey)
     *
     * @param $r
     * @param $g
     * @param $b
     * @param $mat_meta_id
     * @return array
     */
    public function _atomMaterialPattern ($r, $g, $b, $mat_meta_id,$atomName){ // in zero to 1 domain
    
$_materialPattern =
"%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!21 &2100000
Material:
  serializedVersion: 6
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 0}
  m_Name: ".$atomName."_transp
  m_Shader: {fileID: 31, guid: 0000000000000000f000000000000000, type: 0}
  m_ShaderKeywords: _ALPHAPREMULTIPLY_ON
  m_LightmapFlags: 4
  m_EnableInstancingVariants: 0
  m_DoubleSidedGI: 0
  m_CustomRenderQueue: -1
  stringTagMap: {}
  disabledShaderPasses: []
  m_SavedProperties:
    serializedVersion: 3
    m_TexEnvs:
    - _BumpMap:
        m_Texture: {fileID: 0}
        m_Scale: {x: 1, y: 1}
        m_Offset: {x: 0, y: 0}
    - _DetailAlbedoMap:
        m_Texture: {fileID: 0}
        m_Scale: {x: 1, y: 1}
        m_Offset: {x: 0, y: 0}
    - _DetailMask:
        m_Texture: {fileID: 0}
        m_Scale: {x: 1, y: 1}
        m_Offset: {x: 0, y: 0}
    - _DetailNormalMap:
        m_Texture: {fileID: 0}
        m_Scale: {x: 1, y: 1}
        m_Offset: {x: 0, y: 0}
    - _EmissionMap:
        m_Texture: {fileID: 0}
        m_Scale: {x: 1, y: 1}
        m_Offset: {x: 0, y: 0}
    - _MainTex:
        m_Texture: {fileID: 0}
        m_Scale: {x: 1, y: 1}
        m_Offset: {x: 0, y: 0}
    - _MetallicGlossMap:
        m_Texture: {fileID: 0}
        m_Scale: {x: 1, y: 1}
        m_Offset: {x: 0, y: 0}
    - _OcclusionMap:
        m_Texture: {fileID: 0}
        m_Scale: {x: 1, y: 1}
        m_Offset: {x: 0, y: 0}
    - _ParallaxMap:
        m_Texture: {fileID: 0}
        m_Scale: {x: 1, y: 1}
        m_Offset: {x: 0, y: 0}
    - _SpecGlossMap:
        m_Texture: {fileID: 0}
        m_Scale: {x: 1, y: 1}
        m_Offset: {x: 0, y: 0}
    m_Floats:
    - _BumpScale: 1
    - _Cutoff: 0.5
    - _DetailNormalMapScale: 1
    - _DstBlend: 10
    - _GlossMapScale: 1
    - _Glossiness: 0.4
    - _GlossyReflections: 1
    - _Metallic: 0
    - _Mode: 3
    - _OcclusionStrength: 1
    - _Parallax: 0.02
    - _Shininess: 0.5
    - _SmoothnessTextureChannel: 0
    - _SpecularHighlights: 1
    - _SrcBlend: 1
    - _UVSec: 0
    - _ZWrite: 0
    m_Colors:
    - _Color: {r: ". ($r/255). ", g: ". ($g/255) .", b: ". ($b/255) .", a: 1}
    - _EmissionColor: {r: 0, g: 0, b: 0, a: 1}
    - _SpecColor: {r: 1, g: 1, b: 1, a: 0}
";


$patternAtomMatMeta =
"fileFormatVersion: 2
guid: " . $mat_meta_id . "
timeCreated: 1507294884
licenseType: Free
NativeFormatImporter:
  mainObjectFileID: 2100000
  userData:
  assetBundleName:
  assetBundleVariant:
";

        return [$_materialPattern, $patternAtomMatMeta];
    }
    
    /**
     * The YAML pattern for an empty molecule
     *
     * @param $molecule_name
     * @param $molecule_root_go
     * @param $molecule_go
     * @param $molecule_root_transform
     * @param $molecule_transform
     * @param $molecule_script_1
     * @param $molecule_script_2
     * @param $bond_transform_arr
     * @param $atom_transform_arr
     * @return string
     */
    public function _emptyMoleculePattern($molecule_name,
                                          $molecule_root_go ,
                                          $molecule_go ,
                                          $molecule_root_transform,
                                          $molecule_transform,
                                          $molecule_script_1,
                                          $molecule_script_2,
                                          $bond_transform_arr,
                                          $atom_transform_arr){
        
        $Children = "m_Children:".PHP_EOL; // chr(10);
        
        for ($i=0; $i<count($bond_transform_arr); $i++)
            $Children .= "  - {fileID: ".$bond_transform_arr[$i]."}".PHP_EOL;
        
        for ($i=0; $i<count($atom_transform_arr); $i++)
            $Children .= "  - {fileID: ".$atom_transform_arr[$i]."}".PHP_EOL;
        
        // EMPTY MOLECULE
        return "%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!1001 &100100000
Prefab:
  m_ObjectHideFlags: 1
  serializedVersion: 2
  m_Modification:
    m_TransformParent: {fileID: 0}
    m_Modifications: []
    m_RemovedComponents: []
  m_ParentPrefab: {fileID: 0}
  m_RootGameObject: {fileID: ".$molecule_root_go."}
  m_IsPrefabParent: 1
% The ROOT GO
--- !u!1 &". $molecule_root_go. "
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  serializedVersion: 5
  m_Component:
  - component: {fileID: ". $molecule_root_transform."}
  m_Layer: 0
  m_Name: ".$molecule_name."
  m_TagString: Molecule
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
% POSITION OF THE ROOT GO
--- !u!4 &".$molecule_root_transform."
Transform:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_GameObject: {fileID: ".$molecule_root_go."}
  m_LocalRotation: {x: 0, y: 0, z: 0.7071068, w: 0.7071068}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 4, y: 4, z: 4}
  m_Children:
  - {fileID: ".$molecule_transform."}
  m_Father: {fileID: 0}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
% MOLECULE
--- !u!1 &".$molecule_go."
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  serializedVersion: 5
  m_Component:
  - component: {fileID: ".$molecule_transform."}
  - component: {fileID: ".$molecule_script_1."}
  - component: {fileID: ".$molecule_script_2."}
  m_Layer: 0
  m_Name: ".$molecule_name."
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
% MOLECULE POSITION
--- !u!4 &".$molecule_transform."
Transform:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_GameObject: {fileID: ".$molecule_go."}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalScale: {x: 1, y: 1, z: 1}
  ".$Children."
  m_Father: {fileID: ".$molecule_root_transform."}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
% MOLECULE SCRIPT 1
--- !u!114 &".$molecule_script_1."
MonoBehaviour:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_GameObject: {fileID: ".$molecule_go."}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: b781c3734fe48f9458ba43f591a454a9, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  placedElements: []
% MOLECULE SCRIPT 2
--- !u!114 &".$molecule_script_2."
MonoBehaviour:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_GameObject: {fileID: ".$molecule_go."}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: fdb46f4bdae46654484a63153b2637c6, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  rotSpeed: 200
  isRotating: 0
";
    
    }
    
    /**
     * The YAML pattern for the meta of the molecule prefab
     *
     * @param $molecule_guid
     * @return string
     */
    
    public function emptyMolMetaPattern($molecule_guid){
        
        return
            "fileFormatVersion: 2
guid: " . $molecule_guid . "
timeCreated: 1518438685
licenseType: Free
NativeFormatImporter:
  externalObjects: {}
  mainObjectFileID: 100100000
  userData:
  assetBundleName:
  assetBundleVariant:
";
    }
    
    
    /**
     * The YAML of each atom
     *
     */
    public function _atomPattern(
        $atomName,
        $atom_go,
        $atom_transform,
        $atom_mesh,
        $atom_mesh_renderer,
        $atom_script,
        $atom_collider,
        $atom_position_x,
        $atom_position_y,
        $atom_position_z,
        $molecule_transform,
        $atom_material_guid
    ){

return "
% ATOM
--- !u!1 &".$atom_go."
GameObject:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  serializedVersion: 5
  m_Component:
  - component: {fileID: ".$atom_transform."}
  - component: {fileID: ".$atom_mesh."}
  - component: {fileID: ".$atom_mesh_renderer."}
  - component: {fileID: ".$atom_script."}
  - component: {fileID: ".$atom_collider."}
  m_Layer: 0
  m_Name: ".$atomName."_transp
  m_TagString: ".strtolower($atomName)."
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
  
% POSITION OF ATOM
--- !u!4 &".$atom_transform."
Transform:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_GameObject: {fileID: ".$atom_go."}
  m_LocalRotation: {x: -0, y: -0, z: -0, w: 1}
  m_LocalPosition: {x: ".$atom_position_x.", y: ".$atom_position_y.", z: ".$atom_position_z."}
  m_LocalScale: {x: 0.5, y: 0.5, z: 0.5}
  m_Children: []
  m_Father: {fileID: ".$molecule_transform."}
  m_RootOrder: 2
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: 0}
% MESH RENDERER OF ATOM
--- !u!23 &".$atom_mesh_renderer."
MeshRenderer:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_GameObject: {fileID: ".$atom_go."}
  m_Enabled: 1
  m_CastShadows: 1
  m_ReceiveShadows: 1
  m_DynamicOccludee: 1
  m_MotionVectors: 1
  m_LightProbeUsage: 1
  m_ReflectionProbeUsage: 1
  m_Materials:
  - {fileID: 2100000, guid: ".$atom_material_guid.", type: 2}
  m_StaticBatchInfo:
    firstSubMesh: 0
    subMeshCount: 0
  m_StaticBatchRoot: {fileID: 0}
  m_ProbeAnchor: {fileID: 0}
  m_LightProbeVolumeOverride: {fileID: 0}
  m_ScaleInLightmap: 1
  m_PreserveUVs: 1
  m_IgnoreNormalsForChartDetection: 0
  m_ImportantGI: 0
  m_StitchLightmapSeams: 0
  m_SelectedEditorRenderState: 3
  m_MinimumChartSize: 4
  m_AutoUVMaxDistance: 0.5
  m_AutoUVMaxAngle: 89
  m_LightmapParameters: {fileID: 0}
  m_SortingLayerID: 0
  m_SortingLayer: 0
  m_SortingOrder: 0
% MESH FILTER (SPHERE)
--- !u!33 &".$atom_mesh."
MeshFilter:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_GameObject: {fileID: ".$atom_go."}
  m_Mesh: {fileID: 10207, guid: 0000000000000000e000000000000000, type: 0}
% BOX COLLIDER
--- !u!65 &".$atom_collider."
BoxCollider:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_GameObject: {fileID: ".$atom_go."}
  m_Material: {fileID: 0}
  m_IsTrigger: 1
  m_Enabled: 1
  serializedVersion: 2
  m_Size: {x: 1, y: 1, z: 1}
  m_Center: {x: 0, y: 0, z: 0}
% ATOM SCRIPT
--- !u!114 &".$atom_script."
MonoBehaviour:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_GameObject: {fileID: ".$atom_go."}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 32d9a756212078f4f95179bc563ee98c, type: 3}
  m_Name:
  m_EditorClassIdentifier:
  placed: 0
  loopCheck: 0
";
}
    
    
    /**
     * The YAML for each bond of the molecule
     *
     * @return string
     */
    public function _bondPattern(
            $bond_go,
            $bond_transform,
            $bond_cylinder,
            $bond_renderer,
            $bond_position_x,
            $bond_position_y,
            $bond_position_z,
            $bond_rotation_x,
            $bond_rotation_y,
            $bond_rotation_z,
            $bond_rotation_w,
            $bond_scale_x,
            $bond_scale_y,
            $bond_scale_z,
            $molecule_transform ) {

return "
% BOND
% Game Object
--- !u!1 &".$bond_go."
GameObject:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  serializedVersion: 5
  m_Component:
  - component: {fileID: ".$bond_transform."}
  - component: {fileID: ".$bond_cylinder."}
  - component: {fileID: ".$bond_renderer."}
  m_Layer: 0
  m_Name: bond
  m_TagString: Bond
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
% POSITION
--- !u!4 &".$bond_transform."
Transform:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_GameObject: {fileID: ".$bond_go."}
  m_LocalRotation: {x: ".$bond_rotation_x.", y: ".$bond_rotation_y.", z: ".$bond_rotation_z.", w: ".$bond_rotation_w."}
  m_LocalPosition: {x: ".$bond_position_x.", y: ".$bond_position_y.", z: ".$bond_position_z."}
  m_LocalScale: {x: ".$bond_scale_x.", y: ".$bond_scale_y.", z: ".$bond_scale_z."}
  m_Children: []
  m_Father: {fileID: ".$molecule_transform."}
  m_RootOrder: 0
  m_LocalEulerAnglesHint: {x: 0, y: 0, z: -90}
% MESH RENDERER
--- !u!23 &".$bond_renderer."
MeshRenderer:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_GameObject: {fileID: ".$bond_go."}
  m_Enabled: 1
  m_CastShadows: 1
  m_ReceiveShadows: 1
  m_DynamicOccludee: 1
  m_MotionVectors: 1
  m_LightProbeUsage: 1
  m_ReflectionProbeUsage: 1
  m_Materials:
  - {fileID: 2100000, guid: f31de72f00da1404fb37aaf3a4106941, type: 2}
  m_StaticBatchInfo:
    firstSubMesh: 0
    subMeshCount: 0
  m_StaticBatchRoot: {fileID: 0}
  m_ProbeAnchor: {fileID: 0}
  m_LightProbeVolumeOverride: {fileID: 0}
  m_ScaleInLightmap: 1
  m_PreserveUVs: 1
  m_IgnoreNormalsForChartDetection: 0
  m_ImportantGI: 0
  m_StitchLightmapSeams: 0
  m_SelectedEditorRenderState: 3
  m_MinimumChartSize: 4
  m_AutoUVMaxDistance: 0.5
  m_AutoUVMaxAngle: 89
  m_LightmapParameters: {fileID: 0}
  m_SortingLayerID: 0
  m_SortingLayer: 0
  m_SortingOrder: 0
% MESH FILTER (CYLINDER)
--- !u!33 &".$bond_cylinder."
MeshFilter:
  m_ObjectHideFlags: 1
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_GameObject: {fileID: ".$bond_go."}
  m_Mesh: {fileID: 10206, guid: 0000000000000000e000000000000000, type: 0}
";

}
    
    public function __construct($content){
        $this->_pdbContent = $content;
    }

    public function trim($text) {
        return preg_replace('/\s\s*$/', '', preg_replace('/^\s\s*/', '', $text, 1), 1);
    }
    
    public function capitalize($text) {
        
        $res = strtoupper($text[0]);
        
        if(strlen($text)>1)
            $res .= strtolower(substr($text,1));
        
        return $res;
    }
    
    public function hash($s, $e) {
       
        return 's' . min($s, $e) . 'e' . max($s, $e);
    }

    
    // convert TXT of pdb into PHP arrays
    public function buildGeometry($atoms, $bonds) {
    
        $i = null;
        $l = null;
        $verticesAtoms = array();
        $colorsAtoms = array();
        $verticesBonds = array();
    
        for ($i = 0, $l = count($atoms);$i < $l;$i++) {
    
            $atom = $atoms[$i];
            $x = $atom[0];
            $y = $atom[1];
            $z = $atom[2];
    
            array_push($verticesAtoms, $x, $y, $z);
    
            $r = $atom[ 3 ][ 0 ] / 255;
            $g = $atom[ 3 ][ 1 ] / 255;
            $b = $atom[ 3 ][ 1 ] / 255;
    
            array_push($colorsAtoms, $r, $g, $b);
        }
    
        
        for ($i = 0, $l = count($bonds);$i < $l;$i++) {
            $bond = $bonds[$i];
            
            $start = $bond[ 0 ];
            $end = $bond[ 1 ];
    
            array_push($verticesBonds,
                $verticesAtoms[$start*3], $verticesAtoms[$start*3 + 1], $verticesAtoms[$start*3 + 2],
                $verticesAtoms[$end*3], $verticesAtoms[$end*3 + 1], $verticesAtoms[$end*3 + 2]);
        }


        $build = array(
                            "atoms" => $atoms,
                            "bonds" => $bonds,
                            "verticesAtoms"=>$verticesAtoms,
                            "colorsAtoms" => $colorsAtoms,
                            "verticesBonds"=>$verticesBonds
        );

        return $build;
    }
    
    /*
     * Parse the PDB content
     *
     */
    public function parser(){
    
        $atoms = array();
        $bonds = array();
        $histogram = array();
        $bhash = array();
        $x = null;
        $y = null;
        $z = null;
        $e = null;
        
        //$lines = explode("\n", $this->_pdbContent);
        $lines = preg_split('/\n|\r\n?/', $this->_pdbContent);
        
        $fl = fopen("outputLines.txt","w");
        fwrite($fl, print_r($lines, true));
        fclose($fl);
        
        for ($i = 0; $i < count($lines); $i++) {
            
            if (substr($lines[$i], 0, 4) === 'ATOM' || substr($lines[$i], 0, 6) === 'HETATM') {
    
                $x = floatval(substr($lines[$i], 30, 7));
                $y = floatval(substr($lines[$i], 38, 7));
                $z = floatval(substr($lines[$i], 46, 7));
    
                $e = strtolower($this->trim(substr($lines[$i], 76, 2)));
                
                if ($e === '') {
                    $e = strtolower($this->trim(substr($lines[$i], 12, 2)));
                }

                array_push($atoms, array($x, $y, $z, $this->atomColorsDict[$e], $this->capitalize($e)));

                //array_push($atoms, array($this->capitalize($e), $x, $y, $z, $mat_meta[0], $mat_meta[1] ));

                if (!isset($histogram[$e])) {
                    $histogram[$e] = 1;
                } else {
                    $histogram[$e] += 1;
                }

            } else if (substr($lines[$i], 0, 6) === 'CONECT') {

                $satom = intval(substr($lines[$i], 6, 5));
                $eatom = intval(substr($lines[$i], 11, 5));

                if ($eatom) {

                    $h = $this->hash($satom, $eatom);

                    if (!isset($bhash[$h])) {

                        array_push($bonds, array($satom - 1, $eatom - 1, 1));

                        $bhash[$h] = count($bonds) - 1;

                    } else {

                    }
                }

            }
        
        }

        return $this->buildGeometry($atoms, $bonds);
    }

    
    function makeAnFid($seed){
    
        return str_pad($seed , 16, "0", STR_PAD_LEFT);
    }
    
    
    // VECTOR FUNCTIONS
    
    // Find magnitude of a vector
    function magn($vec)
    {
        $norm = 0;
        $components = count($vec);
        
        for ($i = 0; $i < $components; $i++)
            $norm += $vec[$i] * $vec[$i];
        
        return sqrt($norm);
    }
    
    // Normalize vector
    function normalize($vec)
    {
        $norm = $this->magn($vec);
        $components = count($vec);
        
        for ($i = 0; $i < $components; $i++)
            $vec[$i] = $vec[$i] / $norm ;
        
        return $vec;
    }
    
    // distance between two vectors
    function dist($vec1, $vec2){
        $dist = 0;
    
        $components = count($vec1);
    
        for ($i = 0; $i < $components; $i++) {
            $corD = $vec2[$i] - $vec1[$i];
            $dist += $corD*$corD ;
        }
    
        return sqrt($dist);
    }
    
    function addVec($vec1, $vec2){
        $resV = [];
    
        $components = count($vec1);
    
        for ($i = 0; $i < $components; $i++) {
            $resV[] = $vec2[$i] + $vec1[$i];
        }
    
        return $resV;
        
    }

    function subtractVec($startV, $endV){
        $resV = [];
        $components = count($startV);
        
        for ($i = 0; $i < $components; $i++) {
            $resV[] = $endV[$i] - $startV[$i];
        }
        
        return $resV;
    }
    
    // Normalize vector
    function multScalar($vec, $scalar)
    {
        $components = count($vec);
        
        for ($i = 0; $i < $components; $i++)
            $vec[$i] = $vec[$i] * $scalar ;
        
        return $vec;
    }
    
    /**
     *
     *  Sake the materials for each atom
     *
     * @param $atoms
     * @param $dirFormAtomMaterials  : Directory to save them
     */
    function saveTheMaterial($atoms, $dirFormAtomMaterials){
        
        for ($i=0 ; $i<count($atoms); $i++){
        
            // Atom Symbol
            $atomSymbolCurr = $atoms[$i][4];
    
            // Atom Name
            $atomNameCurr = $this->atomsDictionary[$atomSymbolCurr];
        
            // Colors
            $red = $atoms[$i][3][0];
            $green = $atoms[$i][3][1];
            $blue = $atoms[$i][3][2];
        
            // Make meta guid: The meta guid consists of 32 chars 0 .. 0 a Red b Green c Blue
            $mat_meta_id = str_pad("a".$red."b".$green."c".$blue, 32, "0", STR_PAD_LEFT );
        
            // get the colors to make the mat and its meta
            $mat_meta = $this->_atomMaterialPattern (  $red, $green, $blue, $mat_meta_id, $atomNameCurr );

            // Make the dir if does not exist
            if(!is_dir($dirFormAtomMaterials))
                mkdir($dirFormAtomMaterials);
        
            // Save material
            $fh = fopen( $dirFormAtomMaterials .DIRECTORY_SEPARATOR. $atomNameCurr . "_transp.mat", "w");
            fwrite($fh, $mat_meta[0]);
            fclose($fh);
        
            // Save meta of material
            $fh = fopen($dirFormAtomMaterials .DIRECTORY_SEPARATOR. $atomNameCurr . "_transp.mat.meta", "w");
            fwrite($fh, $mat_meta[1]);
            fclose($fh);
        }
        
    }
    
    /**
     *   Make and save the prefab file and its meta file
     *   In order to make the prefab first all the atoms and bonds should be identified and placed as children in the
     *   empty molecule
     */
    function makeThePrefab($post_id, $molecule_name, $atoms, $bondsVertices, $dirForMoleculePrefabs){

        // First capital others lower case
        $molecule_name = strtolower($molecule_name);
        $molecule_name[0] = strtoupper($molecule_name[0]);
        
        // Some constants for making guid and fid generation
        $mol_guid_pad = "9";     // my fixed suffix for the guid of the (in molecule.prefab.meta)
        $mol_fid_pad  = "4";     // The molecule fid prefix
        
        $seedsuf = $post_id.$mol_guid_pad.$mol_fid_pad;
        
        $atom_fid_pad = "7";     // Atom fid suffix
        $seedsufatom = $seedsuf . $atom_fid_pad;
        
        $bond_fid_pad = "8";     // Bond fid suffix
        $seedsufbond = $seedsuf . $bond_fid_pad;
        
        
        //== Empty Molecule ==
        $molecule_guid = str_pad($post_id.$mol_guid_pad , 32, "0", STR_PAD_LEFT);
        $molecule_root_go        = $this->makeAnFid($seedsuf."1");
        $molecule_go             = $this->makeAnFid($seedsuf."2");
        $molecule_root_transform = $this->makeAnFid($seedsuf."3");
        $molecule_transform      = $this->makeAnFid($seedsuf."4");  // inter
        $molecule_script_1       = $this->makeAnFid($seedsuf."5");
        $molecule_script_2       = $this->makeAnFid($seedsuf."6");
    
        $bond_transform_arr = [];   // inter
        $atom_transform_arr = [];   // inter

        // = Atoms loop ==
        for ($i=0 ; $i<count($atoms); $i++) {
        
            // Atom symbol H
            $atomSymbol[] = $atoms[$i][4];

            // Atom name Hydrogen
            $atomName[] = $this->atomsDictionary[end($atomSymbol)];
        
            // atom vars
            $atom_go[]            = $this->makeAnFid($seedsufatom."1".$i);
            $atom_transform_arr[] = $this->makeAnFid($seedsufatom."2".$i);  // inter
            $atom_mesh[]          = $this->makeAnFid($seedsufatom."3".$i);
            $atom_mesh_renderer[] = $this->makeAnFid($seedsufatom."4".$i);
            $atom_script[]        = $this->makeAnFid($seedsufatom."5".$i);
            $atom_collider[]      = $this->makeAnFid($seedsufatom."6".$i);
            $atom_position_x[] = $atoms[$i][0];
            $atom_position_y[] = $atoms[$i][1];
            $atom_position_z[] = $atoms[$i][2];
            //$molecule_transform = ""; // inter
       
            $red = $atoms[$i][3][0];
            $green = $atoms[$i][3][1];
            $blue = $atoms[$i][3][2];
    
            $atom_material_transparent_guid[] = str_pad("a".$red."b".$green."c".$blue, 32, "0", STR_PAD_LEFT );
        }

        // = Bonds loop =
   
        // $bondsVertices Containts two vertices X N bonds
        $NBonds = count($bondsVertices ) /2/3;
    
        for ($i =0 ; $i < $NBonds ; $i++){
        
            // bond vars
            $bond_go[]        = $this->makeAnFid($seedsufbond."1".$i);
            $bond_transform_arr[] = $this->makeAnFid($seedsufbond."2".$i);; // inter
            $bond_cylinder[]    = $this->makeAnFid($seedsufbond."3".$i);
            $bond_renderer[]    = $this->makeAnFid($seedsufbond."4".$i);
       
            // Transform START - END into POSITION, ROTATION, SCALE
            $startV = [$bondsVertices[3*2*$i], $bondsVertices[3*2*$i + 1], $bondsVertices[3*2*$i + 2]];
            $endV   = [$bondsVertices[3*2*$i + 3], $bondsVertices[3*2*$i + 4], $bondsVertices[3*2*$i + 5]];
        
            // Position is in the middle of start - end
            $position = $this->multScalar( $this->addVec($endV , $startV) , 0.5);
        
            $bond_position_x[] =  $position[0];
            $bond_position_y[] =  $position[1];
            $bond_position_z[] =  $position[2];
        
            $directionV  = $this->normalize( $this->subtractVec($startV, $endV) );
            $cylDefaultOrientation = [0,1,0];
            $rotAxis = $this->normalize( $this->addVec($directionV, $cylDefaultOrientation) );
        
            $bond_rotation_x[] = $rotAxis[0];
            $bond_rotation_y[] = $rotAxis[1];
            $bond_rotation_z[] = $rotAxis[2];
            $bond_rotation_w[] = 0;
        
            // SCALE
            $bond_scale_x[] = "0.15";
            $bond_scale_y[] = $this->dist($endV,$startV) / 2;
            $bond_scale_z[] = "0.15";
        
            //$molecule_transform = ""; // inter
        }

        // ======== Make the pattern replacements and save the prefab ========
 
        if(!is_dir($dirForMoleculePrefabs))
            mkdir($dirForMoleculePrefabs);
    
        $fpath = $dirForMoleculePrefabs . DIRECTORY_SEPARATOR . $molecule_name . ".prefab";
        
        // Make the file of the prefab
        $fg = fopen($fpath,"w");

        // Empty mol vars
        $molYAML = $this->_emptyMoleculePattern($molecule_name, $molecule_root_go, $molecule_go, $molecule_root_transform,
            $molecule_transform, $molecule_script_1, $molecule_script_2, $bond_transform_arr, $atom_transform_arr);
    
        fwrite($fg, $molYAML);
    
        // ATOMS
        for ($i=0 ; $i<count($atoms); $i++) {
        
            $atomYAML = $this->_atomPattern($atomName[$i], $atom_go[$i], $atom_transform_arr[$i], $atom_mesh[$i],
                $atom_mesh_renderer[$i], $atom_script[$i], $atom_collider[$i], $atom_position_x[$i],
                $atom_position_y[$i], $atom_position_z[$i], $molecule_transform, $atom_material_transparent_guid[$i]);
        
            fwrite($fg, $atomYAML);
        }

        // BONDS
        for ($i =0 ; $i < $NBonds ; $i++){
        
            $bondYAML = $this->_bondPattern($bond_go[$i], $bond_transform_arr[$i], $bond_cylinder[$i], $bond_renderer[$i],
                $bond_position_x[$i], $bond_position_y[$i], $bond_position_z[$i], $bond_rotation_x[$i], $bond_rotation_y[$i],
                $bond_rotation_z[$i], $bond_rotation_w[$i], $bond_scale_x[$i], $bond_scale_y[$i], $bond_scale_z[$i],
                $molecule_transform);
        
            fwrite($fg, $bondYAML);
        }
    
        fclose($fg);

        // = Remove my comments in the YAML (Unity is not tolerant in YAML comments apart from the first two lines =
        $array = explode("\r\n", file_get_contents($fpath));

        // First two lines should stay they are Unity3D comments
        $stripped_prefab = [$array[0], $array[1]];
    
        foreach($array as $arr)
            if(strpos($arr,"%") === false)
                $stripped_prefab[] = $arr;
    
        file_put_contents($fpath, implode($stripped_prefab,"\r\n"));

        // PREFAB.META save
        file_put_contents($fpath.".meta", $this->emptyMolMetaPattern($molecule_guid));
    }
}





