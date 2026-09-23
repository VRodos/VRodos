<?php
define( 'ABSPATH', __DIR__ );
require_once __DIR__ . '/../includes/class-vrodos-runtime-settings-contract.php';
require_once __DIR__ . '/../includes/class-vrodos-compiler-entity-policy.php';
require_once __DIR__ . '/../includes/asset-optimization/class-vrodos-asset-collision-bounds.php';
function check_box_policy( bool $condition, string $message ): void {
	if ( ! $condition ) { throw new RuntimeException( $message ); }
}
$policy = new VRodos_Compiler_Entity_Policy();
foreach ( [ 'custom', 'low', 'medium', 'high', 'headset', 'pc-rendered-vr' ] as $profile ) {
	$decoration = (object) [ 'category_slug' => 'decoration', 'runtimeProfile' => $profile ];
	check_box_policy( 'box' === $policy->collision_shape( $decoration ), "Box default for $profile" );
	check_box_policy( ! $policy->requires_protected_geometry( $decoration ), "No mesh protection for $profile" );
	foreach ( [ false, 'false', 0, '0', 'off', 'no' ] as $disabled ) {
		$decoration->compiledCollisionEnabled = $disabled;
		check_box_policy( 'none' === $policy->collision_shape( $decoration ), 'Preserve disabled' );
	}
}
foreach ( [ 'walkable-surface', 'collision-proxy', 'door', 'image' ] as $category ) {
	$object = (object) [ 'category_slug' => $category, 'compiledCollisionEnabled' => true ];
	check_box_policy( 'mesh' === $policy->collision_shape( $object ), 'Existing mesh behavior' );
	check_box_policy( $policy->requires_protected_geometry( $object ), 'Existing mesh protection' );
}
$walkable = (object) [ 'category_slug' => 'walkable-surface' ];
check_box_policy( 'mesh' === $policy->collision_shape( $walkable ), 'Walkable surfaces default to player collision' );
check_box_policy( true === $policy->normalize( clone $walkable, 1, 'walkable' )->compiledCollisionEnabled, 'Compile normalization enables walkable collision' );
$walkable->compiledCollisionEnabled = false;
check_box_policy( 'none' === $policy->collision_shape( $walkable ), 'Explicitly disabled walkable collision is preserved' );
$walkable_role = (object) [ 'category_slug' => 'decoration', 'sceneAssetRole' => 'walkable-surface' ];
check_box_policy( 'mesh' === $policy->collision_shape( $walkable_role ), 'Walkable role defaults to player collision' );
$object = (object) [ 'category_slug' => 'walkable-surface', 'sceneAssetRole' => 'decoration', 'compiledCollisionEnabled' => true ];
check_box_policy( 'box' === $policy->collision_shape( $object ) && ! $policy->requires_protected_geometry( $object ), 'Effective decoration role' );
$object->category_slug = 'decoration';
$object->sceneAssetRole = 'walkable-surface';
check_box_policy( 'mesh' === $policy->collision_shape( $object ) && $policy->requires_protected_geometry( $object ), 'Effective walkable role' );
$record = [ 'schemaVersion' => 1, 'min' => [ -1, -2, -3 ], 'max' => [ 1, 2, 3 ], 'center' => [ 0, 0, 0 ] ];
foreach ( [ 'decoration' => 'box', 'walkable-surface' => 'mesh' ] as $physical => $shape ) {
	$poi = (object) [ 'category_slug' => 'decoration', 'sceneAssetRole' => 'poi-imagetext', 'scenePoiPhysicalRole' => $physical, 'compiledCollisionEnabled' => true ];
	check_box_policy( 'poi-imagetext' === $policy->effective_category( $poi ), 'POI role resolution' );
	check_box_policy( $shape === $policy->collision_shape( $poi ), 'POI preserves physical collision shape' );
	check_box_policy( ( 'mesh' === $shape ) === $policy->requires_protected_geometry( $poi ), 'POI preserves geometry protection' );
	$normalized_poi = $policy->normalize( clone $poi, 1, 'poi' );
	check_box_policy( $shape === $policy->collision_shape( $normalized_poi ), 'Physical role survives compile normalization' );
	$poi->compiledCollisionEnabled = false;
	check_box_policy( 'none' === $policy->collision_shape( $poi ), 'POI preserves disabled collision' );
}
check_box_policy( VRodos_Asset_Collision_Bounds::valid( $record ), 'Valid bounds' );
$record['max'][0] = -2;
check_box_policy( ! VRodos_Asset_Collision_Bounds::valid( $record ), 'Reject reversed bounds' );
echo "Global decoration collision policy tests passed.\n";
