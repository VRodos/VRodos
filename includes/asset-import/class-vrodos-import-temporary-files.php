<?php

/** Shared temporary file allocation inside storage-owned conversion directories. */
class VRodos_Import_Temporary_Files {
	public static function create( string $prefix, string $extension = '', string $error_message = 'Could not create a temporary file.' ): string|WP_Error {
		$directory = VRodos_Storage_Manager::temporary_directory( 'conversion', wp_generate_uuid4() );
		if ( ! is_string( $directory ) || ! is_dir( $directory ) || ! is_writable( $directory ) ) {
			return new WP_Error( 'tmp_failed', $error_message );
		}
		$prefix = preg_replace( '/[^A-Za-z0-9_-]/', '-', $prefix );
		$extension = trim( $extension );
		$extension = '' === $extension ? '' : '.' . ltrim( $extension, '.' );
		$path = @tempnam( $directory, $prefix ?: 'vrodos-' );
		if ( ! is_string( $path ) || '' === $path ) {
			return new WP_Error( 'tmp_failed', $error_message );
		}
		if ( '' === $extension ) {
			return $path;
		}
		$target = $path . $extension;
		if ( @rename( $path, $target ) ) {
			return $target;
		}
		@unlink( $path );
		return new WP_Error( 'tmp_failed', $error_message );
	}

}
