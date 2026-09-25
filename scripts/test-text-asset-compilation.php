<?php
declare(strict_types=1);
define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

// A previously uploaded source remains attached after a manual edit.
$text_meta = [
    'vrodos_asset3d_text_file' => 99,
    'vrodos_asset3d_text_content' => "¿Puedes identificar todos los ingredientes?\nAsegúrate con la sartén. Ελληνικά",
    'vrodos_asset3d_text_format' => 'manual',
    'vrodos_asset3d_text_truncated' => '0',
];
function get_post_meta( $id, $key, $single = true ) { global $text_meta; return $text_meta[$key] ?? ''; }
function absint( $value ): int { return abs( (int) $value ); }
function get_post_thumbnail_id( $id ): int { return 0; }
function wp_http_validate_url( $url ): bool { return false; }
function sanitize_key( $value ): string { return $value; }
class VRodos_Compiler_Entity_Policy {
    public function physical_category( $object ): string { return '3d-text'; }
    public function requires_protected_geometry( $object ): bool { return false; }
}
class VRodos_Asset_Optimization_Manager {
    public static function runtime_profile_derivative_path( ...$args ): string { return ''; }
}
class VRodos_Storage_Manager {
    public static function attachment_is_owned_by( ...$args ): bool {
        throw new RuntimeException( 'Manual text must not read or require its obsolete source file.' );
    }
}
require_once __DIR__ . '/../includes/class-vrodos-compiler-resource-publisher.php';
$reflection = new ReflectionClass( VRodos_Compiler_Resource_Publisher::class );
$publisher = $reflection->newInstanceWithoutConstructor();
$hydrate = $reflection->getMethod( 'hydrate_asset_object' );
foreach ( [ 'Stale saved scene text', 'Another placement in another scene' ] as $old_text ) {
    $object = (object) [ 'text_content' => $old_text ];
    $hydrate->invoke( $publisher, $object, 7 );
    if ( $object->text_content !== $text_meta['vrodos_asset3d_text_content'] || $object->text_format !== 'manual' ) {
        throw new RuntimeException( 'Every placement must compile the current original asset text.' );
    }
}
echo "Shared text asset compilation tests passed.\n";
