<?php

require_once dirname( __DIR__ ) . '/includes/asset-optimization/class-vrodos-glb-analysis.php';

function placement_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		throw new RuntimeException( $message );
	}
}

// One shared mesh, 55 ordinary tree placements, and a separate GPU instance batch.
$gltf = [
	'accessors' => [ [ 'count' => 6187461 ], [ 'count' => 8 ] ],
	'meshes' => [ [ 'primitives' => [ [ 'indices' => 0 ] ] ] ],
	'nodes' => array_fill( 0, 55, [ 'mesh' => 0 ] ),
];
$analysis = VRodos_Glb_Analysis::analyze_gltf_json( $gltf );
placement_assert( 2062487 === $analysis['geometry']['estimatedTriangles'], 'Shared storage geometry must stay separate from placement cost.' );
placement_assert( 113436785 === $analysis['geometry']['placedTriangles'], 'All 55 tree placements must contribute their triangles.' );
placement_assert( 55 === $analysis['counts']['placedPrimitives'], 'Ordinary placements need separate draws.' );

$gltf['nodes'] = [ [ 'mesh' => 0, 'extensions' => [ 'EXT_mesh_gpu_instancing' => [ 'attributes' => [ 'TRANSLATION' => 1 ] ] ] ] ];
$analysis = VRodos_Glb_Analysis::analyze_gltf_json( $gltf );
placement_assert( 16499896 === $analysis['geometry']['placedTriangles'], 'GPU instancing also submits triangles for every instance.' );
placement_assert( 1 === $analysis['counts']['placedPrimitives'], 'GPU instances share a draw.' );

// Small unique geometry can become an LOD candidate through repeated placement.
$gltf['accessors'][0]['count'] = 9000;
$gltf['nodes'] = array_fill( 0, 55, [ 'mesh' => 0 ] );
$analysis = VRodos_Glb_Analysis::analyze_gltf_json( $gltf );
$recommendation = VRodos_Glb_Analysis::recommendations_for_analysis( $analysis );
placement_assert( in_array( 'moderate_high_triangles', $recommendation['flags'], true ), 'Recommendations must count all placements.' );
placement_assert( $recommendation['recommendations']['lodDerivative'], 'Repeated small meshes must trigger the LOD recommendation.' );
placement_assert( str_contains( $recommendation['reasons'][0], '165,000' ), 'The rendering cost must be visible in the recommendation.' );

echo "GLB placement analysis checks passed.\n";
