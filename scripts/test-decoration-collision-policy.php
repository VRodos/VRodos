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
$object = (object) [ 'category_slug' => 'walkable-surface', 'sceneAssetRole' => 'decoration', 'compiledCollisionEnabled' => true ];
check_box_policy( 'box' === $policy->collision_shape( $object ) && ! $policy->requires_protected_geometry( $object ), 'Effective decoration role' );
$object->category_slug = 'decoration';
$object->sceneAssetRole = 'walkable-surface';
check_box_policy( 'mesh' === $policy->collision_shape( $object ) && $policy->requires_protected_geometry( $object ), 'Effective walkable role' );
$record = [ 'schemaVersion' => 1, 'min' => [ -1, -2, -3 ], 'max' => [ 1, 2, 3 ], 'center' => [ 0, 0, 0 ] ];
check_box_policy( VRodos_Asset_Collision_Bounds::valid( $record ), 'Valid bounds' );
$record['max'][0] = -2;
check_box_policy( ! VRodos_Asset_Collision_Bounds::valid( $record ), 'Reject reversed bounds' );
echo "Global decoration collision policy tests passed.\n";
