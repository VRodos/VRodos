<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Selects one validated, authorized GLB URL for authoring previews. */
trait VRodos_Asset_Optimization_Editor_Load {
	public static function resolve_editor_glb_load( int $asset_id, bool $force_source = false ): array {
		$state = self::resolve_editor_glb_load_state( $asset_id, $force_source );
		$ready = ! empty( $state['loadUrl'] );
		$preparing = $state['previewStatus'] === 'running' || ( $state['previewStatus'] === 'waiting-high' && ( self::desktop_profile_record( $asset_id, 'web-high' )['status'] ?? '' ) === 'running' );
		$status = $ready ? 'ready' : ( $state['status'] === 'pending' ? ( $preparing ? 'preparing' : 'queued' ) : $state['status'] );
		$labels = [ 'ready' => 'Ready to add', 'queued' => 'Queued', 'preparing' => 'Preparing', 'failed' => 'Preparation failed', 'missing' => 'Asset unavailable', 'forbidden' => 'Access unavailable' ];
		$state['readiness'] = [
			'status' => $status,
			'label' => $labels[ $status ] ?? 'Asset unavailable',
			'message' => $ready ? 'Ready to add.' : ( $state['status'] === 'pending' ? 'Add a placeholder while preparation finishes.' : $state['message'] ),
			'uploadMessage' => $ready ? 'Asset uploaded. Ready to add.' : ( $state['status'] === 'pending' ? 'Asset uploaded. Preparing it for the scene editor. You can add and position it now.' : 'Asset uploaded. ' . ( $labels[ $status ] ?? 'Asset unavailable' ) . '.' ),
		];
		return $state;
	}

	private static function resolve_editor_glb_load_state( int $asset_id, bool $force_source ): array {
		$asset_id = absint( $asset_id );
		if ( $asset_id <= 0 || 'vrodos_asset3d' !== get_post_type( $asset_id ) ) {
			return self::empty_editor_load_state( 'missing', 'Asset is no longer available.' );
		}
		if ( ! class_exists( 'VRodos_Immerse_Access_Manager' ) || ! VRodos_Immerse_Access_Manager::can_read_asset( $asset_id ) ) {
			return self::empty_editor_load_state( 'forbidden', 'You are not allowed to load this asset.' );
		}
		if ( has_term( 'audio', 'vrodos_asset3d_cat', $asset_id ) ) {
			$marker_url = VRodos_Core_Manager::get_builtin_audio_marker_url();
			return array_merge(
				self::empty_editor_load_state( 'ready', 'Audio marker is ready.' ),
				[
					'loadUrl'      => $marker_url,
					'canonicalUrl' => $marker_url,
					'loadVariant' => 'source',
				]
			);
		}

		$source = self::prepare_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			return self::empty_editor_load_state( 'missing', $source->get_error_message() );
		}

		$canonical_url = (string) ( $source['url'] ?? '' );
		$source_bytes = absint( $source['sizeBytes'] ?? 0 );
		$protects_geometry = self::editor_preview_protects_geometry( $asset_id );
		$can_retry = current_user_can( 'edit_post', $asset_id );
		$base = [
			'canonicalUrl'     => $canonical_url,
			'sourceBytes'      => $source_bytes,
			'protectsGeometry' => $protects_geometry,
			'canLoadSource'    => '' !== $canonical_url,
			'canRetryLoad'     => $can_retry,
		];

		if ( $force_source ) {
			return array_merge(
				self::empty_editor_load_state( 'ready', 'Loading the original source GLB.' ),
				$base,
				[
					'loadUrl'          => $canonical_url,
					'loadVariant'      => 'source',
					'loadBytes'        => $source_bytes,
					'reductionPercent' => 0.0,
					'protectsGeometry' => true,
				]
			);
		}

		$preview = self::get_editor_preview_asset_state( $asset_id );
		$preview_status = sanitize_key( (string) ( $preview['status'] ?? 'none' ) );
		$base['previewStatus'] = $preview_status;
		if ( 'ready' === $preview_status && ! empty( $preview['url'] ) ) {
			$preview_record = self::get_editor_preview_record( $asset_id );
			$load_bytes = absint( $preview_record['derivativeSizeBytes'] ?? 0 );
			$preview_path = (string) ( $preview_record['path'] ?? $preview_record['file'] ?? '' );
			if ( 0 === $load_bytes && '' !== $preview_path && is_file( $preview_path ) ) {
				$preview_filesize = filesize( $preview_path );
				$load_bytes = false === $preview_filesize ? 0 : absint( $preview_filesize );
			}
			$preview_options = is_array( $preview_record['profileOptions'] ?? null ) ? $preview_record['profileOptions'] : [];
			return array_merge(
				self::empty_editor_load_state( 'ready', 'Editor preview is ready.' ),
				$base,
				[
					'loadUrl'          => (string) $preview['url'],
					'loadVariant'      => self::EDITOR_PREVIEW_PROFILE,
					'loadBytes'        => $load_bytes,
					'reductionPercent' => self::editor_load_reduction_percent( $source_bytes, $load_bytes ),
					'protectsGeometry' => $protects_geometry || ! empty( $preview_options['protectGeometry'] ),
				]
			);
		}

		$web_candidate = self::smallest_ready_editor_web_derivative( $asset_id, $source );
		if ( $web_candidate ) {
			$message = 'failed' === $preview_status
				? 'Editor preview failed; using the smallest ready Web derivative.'
				: 'Using the smallest ready Web derivative while the editor preview is prepared.';
			return array_merge(
				self::empty_editor_load_state( 'ready', $message ),
				$base,
				$web_candidate,
				[ 'canRetry' => 'failed' === $preview_status && $can_retry ]
			);
		}

		if ( empty( $preview['shouldPreview'] ) ) {
			return array_merge(
				self::empty_editor_load_state( 'ready', 'Asset is small enough for direct editor loading.' ),
				$base,
				[
					'loadUrl'          => $canonical_url,
					'loadVariant'      => 'source',
					'loadBytes'        => $source_bytes,
					'reductionPercent' => 0.0,
					'protectsGeometry' => true,
				]
			);
		}

		$status = 'failed' === $preview_status ? 'failed' : 'pending';
		$message = (string) ( $preview['message'] ?? '' );
		if ( '' === $message ) {
			$message = 'Optimized editor preview is being prepared.';
		}
		return array_merge(
			self::empty_editor_load_state( $status, $message ),
			$base,
			[
				'previewStatus' => $preview_status,
				'canRetry'      => 'failed' === $status && $can_retry,
			]
		);
	}

	protected static function smallest_ready_editor_web_derivative( int $asset_id, array $source ): array {
		$candidates = [];
		foreach ( self::WEB_FAMILY_PROFILES as $profile ) {
			$record = self::desktop_profile_record( $asset_id, $profile );
			$options = is_array( $record['profileOptions'] ?? null ) ? $record['profileOptions'] : [];
			if ( ! self::desktop_profile_record_is_ready( $record, $source, $profile, $options ) ) {
				continue;
			}
			$attachment_id = absint( $record['attachmentId'] ?? 0 );
			$url = $attachment_id > 0 && VRodos_Storage_Manager::attachment_is_owned_by( $attachment_id, 'asset', $asset_id )
				? VRodos_Storage_Manager::authoring_url_for_attachment( $attachment_id )
				: '';
			if ( '' === $url ) {
				continue;
			}
			$bytes = absint( $record['derivativeSizeBytes'] ?? 0 );
			$path = (string) ( $record['path'] ?? '' );
			if ( 0 === $bytes && '' !== $path && is_file( $path ) ) {
				$filesize = filesize( $path );
				$bytes = false === $filesize ? 0 : absint( $filesize );
			}
			$candidates[] = [
				'loadUrl'          => $url,
				'loadVariant'      => $profile,
				'loadBytes'        => $bytes,
				'reductionPercent' => self::editor_load_reduction_percent( absint( $source['sizeBytes'] ?? 0 ), $bytes ),
				'protectsGeometry' => ! empty( $options['effectiveProtectGeometry'] ) || ! empty( $options['protectGeometry'] ),
			];
		}

		usort(
			$candidates,
			static fn( array $left, array $right ): int => ( $left['loadBytes'] ?: PHP_INT_MAX ) <=> ( $right['loadBytes'] ?: PHP_INT_MAX )
		);
		return $candidates[0] ?? [];
	}

	protected static function editor_load_reduction_percent( int $source_bytes, int $load_bytes ): float {
		return $source_bytes > 0 && $load_bytes > 0
			? round( max( 0, 1 - ( $load_bytes / $source_bytes ) ) * 100, 1 )
			: 0.0;
	}

	protected static function empty_editor_load_state( string $status, string $message = '' ): array {
		return [
			'status'           => $status,
			'message'          => $message,
			'loadUrl'          => '',
			'loadVariant'      => 'none',
			'canonicalUrl'     => '',
			'sourceBytes'      => 0,
			'loadBytes'        => 0,
			'reductionPercent' => 0.0,
			'protectsGeometry' => false,
			'canRetry'         => false,
			'canRetryLoad'     => false,
			'canLoadSource'    => false,
			'previewStatus'    => 'none',
		];
	}
}
