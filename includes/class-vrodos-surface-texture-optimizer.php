<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Bound published plane textures without modifying the scene-owned source. */
final class VRodos_Surface_Texture_Optimizer {
	public static function publish( string $source, int $cap, bool $data_map, callable $publish ): string {
		$size = getimagesize( $source );
		if ( ! $size || $cap < 1 ) {
			throw new RuntimeException( '[VRodos] Invalid surface texture or size limit.' );
		}
		if ( max( $size[0], $size[1] ) <= $cap ) {
			return $publish( $source );
		}
		$editor = wp_get_image_editor( $source );
		if ( is_wp_error( $editor ) ) {
			throw new RuntimeException( '[VRodos] Surface image preparation failed: ' . $editor->get_error_message() );
		}
		$result = $editor->resize( $cap, $cap, false );
		if ( is_wp_error( $result ) ) {
			throw new RuntimeException( '[VRodos] Surface image resize failed: ' . $result->get_error_message() );
		}
		// Data channels must not acquire additional JPEG chroma artifacts.
		$mime = $data_map ? 'image/png' : $size['mime'];
		if ( 'image/jpeg' === $mime ) $editor->set_quality( 90 );
		$temporary = wp_tempnam( 'vrodos-surface' );
		if ( ! $temporary ) throw new RuntimeException( '[VRodos] Could not stage a surface texture.' );
		$saved = null;
		try {
			$saved = $editor->save( $temporary, $mime );
			if ( is_wp_error( $saved ) ) {
				throw new RuntimeException( '[VRodos] Surface image encoding failed: ' . $saved->get_error_message() );
			}
			$output_size = getimagesize( $saved['path'] );
			if ( ! $output_size || max( $output_size[0], $output_size[1] ) > $cap || ( $data_map && 'image/png' !== $output_size['mime'] ) ) {
				throw new RuntimeException( '[VRodos] Prepared surface texture violates the size or data-map format policy.' );
			}
			return $publish( $saved['path'] );
		} finally {
			wp_delete_file( $temporary );
			if ( is_array( $saved ) && $saved['path'] !== $temporary ) wp_delete_file( $saved['path'] );
		}
	}
}
