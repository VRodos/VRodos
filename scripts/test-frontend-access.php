<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

$GLOBALS['vrodos_test_is_page']       = true;
$GLOBALS['vrodos_test_logged_in']     = false;
$GLOBALS['vrodos_test_template']      = '';
$GLOBALS['vrodos_test_auth_redirects'] = 0;

final class WP_User {
	public array $allcaps = [];
	public array $roles   = [];

	public function exists(): bool {
		return true;
	}
}

function add_filter(): void {}
function add_action(): void {}
function is_page(): bool { return $GLOBALS['vrodos_test_is_page']; }
function get_queried_object_id(): int { return 17; }
function get_post_meta(): string { return $GLOBALS['vrodos_test_template']; }
function is_user_logged_in(): bool { return $GLOBALS['vrodos_test_logged_in']; }
function auth_redirect(): void { ++$GLOBALS['vrodos_test_auth_redirects']; }
function wp_get_current_user(): WP_User { return new WP_User(); }
function get_userdata(): WP_User { return new WP_User(); }

require_once dirname( __DIR__ ) . '/includes/class-vrodos-path-manager.php';
require_once dirname( __DIR__ ) . '/includes/class-vrodos-immerse-access-manager.php';

function vrodos_frontend_access_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		throw new RuntimeException( 'Frontend access rule failed: ' . $message );
	}
}

function vrodos_run_frontend_guard( bool $is_page, bool $logged_in, string $template ): int {
	$GLOBALS['vrodos_test_is_page']        = $is_page;
	$GLOBALS['vrodos_test_logged_in']      = $logged_in;
	$GLOBALS['vrodos_test_template']       = $template;
	$GLOBALS['vrodos_test_auth_redirects'] = 0;

	VRodos_Immerse_Access_Manager::guard_frontend_pages();

	return $GLOBALS['vrodos_test_auth_redirects'];
}

$management_template_filenames = [
	'vrodos-project-manager-template.php',
	'vrodos-assets-list-template.php',
	'vrodos-edit-3D-scene-template.php',
	'vrodos-asset-editor-template.php',
];

foreach ( $management_template_filenames as $filename ) {
	foreach ( VRodos_Path_Manager::page_template_meta_values( $filename ) as $template ) {
		vrodos_frontend_access_assert(
			1 === vrodos_run_frontend_guard( true, false, $template ),
			'logged-out requests must authenticate before opening ' . $template
		);
	}
}

vrodos_frontend_access_assert(
	0 === vrodos_run_frontend_guard( true, false, '/theme/vrodos-assets-list-template.php' ),
	'a theme template with the same basename must remain outside the VRodos access boundary'
);
vrodos_frontend_access_assert(
	0 === vrodos_run_frontend_guard( true, false, 'page.php' ),
	'ordinary public WordPress pages must remain public'
);
vrodos_frontend_access_assert(
	0 === vrodos_run_frontend_guard( false, false, '' ),
	'published clients outside WordPress management pages must remain public'
);
vrodos_frontend_access_assert(
	0 === vrodos_run_frontend_guard( true, true, '/templates/pages/vrodos-assets-list-template.php' ),
	'logged-in users must still reach VRodos management pages'
);

echo "Frontend access tests passed.\n";
