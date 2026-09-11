<?php

/** Source inspection is read-only; prepare explicitly normalizes and fingerprints. */
class VRodos_Asset_Optimization_Source {
	public const SOURCE_META_KEY = '_vrodos_asset3d_glb_source_snapshot';

	public static function inspect( int $asset_id, callable $resolve_path ) {
		return self::lookup( $asset_id, $resolve_path, false );
	}

	public static function prepare( int $asset_id, callable $resolve_path ) {
		return self::lookup( $asset_id, $resolve_path, true );
	}
	private static function lookup( int $asset_id, callable $local_path_from_url, bool $prepare ) {
		$source_meta = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
		$source_url  = VRodos_Core_Manager::resolve_media_meta_url( $source_meta );

		if ( '' === $source_url ) {
			return new WP_Error( 'vrodos_no_glb_source', 'Asset has no GLB source URL.' );
		}

		$source_path = is_numeric( $source_meta )
			? get_attached_file( (int) $source_meta )
			: $local_path_from_url( $source_url );

		if ( ! is_string( $source_path ) || '' === $source_path || ! is_file( $source_path ) || ! is_readable( $source_path ) ) {
			return new WP_Error( 'vrodos_glb_source_not_local', 'Only local uploaded GLB files can be optimized.' );
		}

		if ( ! VRodos_Storage_Manager::is_glb_file( $source_path ) ) {
			return new WP_Error( 'vrodos_glb_source_invalid_type', 'The source asset is not a GLB file.' );
		}

		if ( $prepare && is_numeric( $source_meta ) && VRodos_Storage_Manager::attachment_is_owned_by( (int) $source_meta, 'asset', $asset_id ) ) {
			$normalized_path = VRodos_Storage_Manager::normalize_glb_attachment( (int) $source_meta, $asset_id );
			if ( ! is_wp_error( $normalized_path ) ) {
				$source_path = $normalized_path;
			}
		}

		$size = filesize( $source_path );

		$source = [
			'meta'      => $source_meta,
			'attachmentId' => is_numeric( $source_meta ) ? (int) $source_meta : 0,
			'url'       => $source_url,
			'path'      => $source_path,
			'sizeBytes' => false === $size ? 0 : (int) $size,
		];
		$snapshot = $prepare ? self::refresh_source_snapshot( $asset_id, $source ) : self::read_source_snapshot( $asset_id );
		if ( ! is_wp_error( $snapshot ) && ! empty( $snapshot['sha256'] )
			&& ( $prepare || ( (string) ( $snapshot['path'] ?? '' ) === wp_normalize_path( $source_path )
				&& absint( $snapshot['attachmentId'] ?? 0 ) === $source['attachmentId']
				&& absint( $snapshot['sizeBytes'] ?? 0 ) === $source['sizeBytes']
				&& absint( $snapshot['modifiedAt'] ?? 0 ) === (int) filemtime( $source_path ) ) ) ) {
			$source['sha256'] = (string) $snapshot['sha256'];
			$source['generation'] = absint( $snapshot['generation'] );
			$source['modifiedAt'] = absint( $snapshot['modifiedAt'] );
		}
		return $source;
	}


	public static function read_source_snapshot( int $asset_id ): array {
		$snapshot = get_post_meta( $asset_id, self::SOURCE_META_KEY, true );
		return is_array( $snapshot ) ? $snapshot : [];
	}


	public static function refresh_source_snapshot( int $asset_id, array $source ) {
		$path = wp_normalize_path( (string) ( $source['path'] ?? '' ) );
		if ( '' === $path || ! is_file( $path ) || ! is_readable( $path ) ) {
			return new WP_Error( 'vrodos_glb_source_hash_failed', 'The active GLB source cannot be hashed.' );
		}

		$size = (int) ( filesize( $path ) ?: 0 );
		$modified_at = (int) ( filemtime( $path ) ?: 0 );
		$attachment_id = absint( $source['attachmentId'] ?? 0 );
		$existing = self::read_source_snapshot( $asset_id );
		$same_file = (string) ( $existing['path'] ?? '' ) === $path
			&& absint( $existing['attachmentId'] ?? 0 ) === $attachment_id
			&& absint( $existing['sizeBytes'] ?? 0 ) === $size
			&& absint( $existing['modifiedAt'] ?? 0 ) === $modified_at
			&& preg_match( '/^[a-f0-9]{64}$/', (string) ( $existing['sha256'] ?? '' ) );
		if ( $same_file ) {
			return $existing;
		}

		$sha256 = hash_file( 'sha256', $path );
		if ( ! is_string( $sha256 ) || '' === $sha256 ) {
			return new WP_Error( 'vrodos_glb_source_hash_failed', 'The active GLB source could not be hashed.' );
		}

		$identity_changed = '' !== (string) ( $existing['sha256'] ?? '' )
			&& ( (string) $existing['sha256'] !== $sha256 || absint( $existing['attachmentId'] ?? 0 ) !== $attachment_id );
		$snapshot = [
			'schemaVersion' => 1,
			'attachmentId' => $attachment_id,
			'path'         => $path,
			'sizeBytes'    => $size,
			'modifiedAt'   => $modified_at,
			'sha256'       => $sha256,
			'generation'   => max( 1, absint( $existing['generation'] ?? 0 ) + ( $identity_changed ? 1 : 0 ) ),
			'updatedAt'    => current_time( 'mysql', true ),
		];
		update_post_meta( $asset_id, self::SOURCE_META_KEY, $snapshot );
		return $snapshot;
	}

}
