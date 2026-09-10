<?php

define( 'ABSPATH', __DIR__ . DIRECTORY_SEPARATOR );

require_once dirname( __DIR__ ) . '/includes/class-vrodos-storage-manager.php';

function vrodos_cache_test_assert( bool $condition, string $message ): void {
	if ( ! $condition ) {
		fwrite( STDERR, "Private media cache test failed: {$message}\n" );
		exit( 1 );
	}
}

$etag_method = new ReflectionMethod( VRodos_Storage_Manager::class, 'private_file_etag' );
$etag_method->setAccessible( true );
$matches_method = new ReflectionMethod( VRodos_Storage_Manager::class, 'request_cache_validator_matches' );
$matches_method->setAccessible( true );
$published_rules_method = new ReflectionMethod( VRodos_Storage_Manager::class, 'published_cache_policy_rules' );
$published_rules_method->setAccessible( true );

$modified_at = 1700000000;
$etag        = $etag_method->invoke( null, 1024, $modified_at );

vrodos_cache_test_assert(
	$etag !== $etag_method->invoke( null, 2048, $modified_at ),
	'changing the file size must change its ETag'
);
vrodos_cache_test_assert(
	$etag !== $etag_method->invoke( null, 1024, $modified_at + 1 ),
	'changing the modification time must change its ETag'
);

unset( $_SERVER['HTTP_IF_NONE_MATCH'], $_SERVER['HTTP_IF_MODIFIED_SINCE'] );
vrodos_cache_test_assert(
	false === $matches_method->invoke( null, $etag, $modified_at ),
	'a request without validators must receive the current file'
);

$_SERVER['HTTP_IF_NONE_MATCH'] = 'W/"other", ' . $etag;
vrodos_cache_test_assert(
	true === $matches_method->invoke( null, $etag, $modified_at ),
	'a matching ETag in a validator list must revalidate'
);

$changed_etag = $etag_method->invoke( null, 2048, $modified_at + 1 );
vrodos_cache_test_assert(
	false === $matches_method->invoke( null, $changed_etag, $modified_at + 1 ),
	'an old ETag must not match a changed file'
);

$_SERVER['HTTP_IF_NONE_MATCH']     = 'W/"other"';
$_SERVER['HTTP_IF_MODIFIED_SINCE'] = gmdate( 'D, d M Y H:i:s', $modified_at + 60 ) . ' GMT';
vrodos_cache_test_assert(
	false === $matches_method->invoke( null, $etag, $modified_at ),
	'a nonmatching ETag must take precedence over If-Modified-Since'
);

unset( $_SERVER['HTTP_IF_NONE_MATCH'] );
$_SERVER['HTTP_IF_MODIFIED_SINCE'] = gmdate( 'D, d M Y H:i:s', $modified_at ) . ' GMT';
vrodos_cache_test_assert(
	true === $matches_method->invoke( null, $etag, $modified_at ),
	'an unchanged Last-Modified timestamp must revalidate'
);

$_SERVER['HTTP_IF_MODIFIED_SINCE'] = gmdate( 'D, d M Y H:i:s', $modified_at - 1 ) . ' GMT';
vrodos_cache_test_assert(
	false === $matches_method->invoke( null, $etag, $modified_at ),
	'an older If-Modified-Since timestamp must receive the current file'
);

unset( $_SERVER['HTTP_IF_NONE_MATCH'], $_SERVER['HTTP_IF_MODIFIED_SINCE'] );

$published_rules = $published_rules_method->invoke( null );
$published_rules_text = implode( "\n", $published_rules );
vrodos_cache_test_assert(
	1 === substr_count( $published_rules_text, 'public, max-age=31536000, immutable' ),
	'published hash media must receive one immutable one-year cache rule'
);
vrodos_cache_test_assert(
	str_contains( $published_rules_text, '/media/[a-f0-9]{64}' ) && str_contains( $published_rules_text, '/clients/[^/]+\\.html$' ),
	'published cache rules must distinguish hash-named media from client HTML'
);
vrodos_cache_test_assert(
	str_contains( $published_rules_text, 'no-store, no-cache, must-revalidate' ),
	'published client HTML must always re-resolve current content hashes'
);
$immutable_pattern = '';
$html_pattern = '';
if ( preg_match( '/SetEnvIf Request_URI "([^"]+)" VRODOS_IMMUTABLE_MEDIA/', $published_rules_text, $matches ) ) {
	$immutable_pattern = (string) $matches[1];
}
if ( preg_match( '/SetEnvIf Request_URI "([^"]+)" VRODOS_UNCACHED_CLIENT/', $published_rules_text, $matches ) ) {
	$html_pattern = (string) $matches[1];
}
vrodos_cache_test_assert(
	'' !== $immutable_pattern
	&& 1 === preg_match( '~' . $immutable_pattern . '~', '/wp-content/uploads/vrodos/published/projects/1098/media/' . str_repeat( 'a', 64 ) . '.glb' )
	&& 0 === preg_match( '~' . $immutable_pattern . '~', '/wp-content/uploads/vrodos/published/projects/1098/media/ground.glb' )
	&& 0 === preg_match( '~' . $immutable_pattern . '~', '/wp-content/uploads/vrodos/published/projects/1098/clients/' . str_repeat( 'a', 64 ) . '.html' ),
	'only content-addressed files directly under published media may receive immutable caching'
);
vrodos_cache_test_assert(
	'' !== $html_pattern
	&& 1 === preg_match( '~' . $html_pattern . '~', '/wp-content/uploads/vrodos/published/projects/1098/clients/Master_Client_1099.html' )
	&& 0 === preg_match( '~' . $html_pattern . '~', '/wp-content/uploads/vrodos/published/projects/1098/media/' . str_repeat( 'b', 64 ) . '.glb' ),
	'only generated client HTML may receive the no-store client policy'
);

echo "Private media cache logic tests passed.\n";
