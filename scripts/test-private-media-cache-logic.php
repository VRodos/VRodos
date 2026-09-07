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

echo "Private media cache logic tests passed.\n";
