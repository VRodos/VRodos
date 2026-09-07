<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_Optimization_Editor_Preview {
	public static function get_editor_preview_asset_state( int $asset_id ): array {
		$source = self::get_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			return self::empty_editor_preview_state(
				'none',
				$source->get_error_message(),
				[
					'sourceSizeBytes' => 0,
					'analysis'        => [],
					'shouldPreview'   => false,
				]
			);
		}

		$analysis = self::get_analysis_meta( $asset_id );
		if ( self::analysis_needs_refresh( $analysis, $source ) ) {
			$analysis = self::refresh_asset_analysis( $asset_id );
			if ( is_wp_error( $analysis ) ) {
				$analysis = self::get_analysis_meta( $asset_id );
			}
		}

		$decision = self::editor_preview_decision( (int) $source['sizeBytes'], is_array( $analysis ) ? $analysis : [] );
		if ( ! $decision['shouldPreview'] ) {
			self::store_editor_preview_record(
				$asset_id,
				[
					'status'            => 'none',
					'message'           => 'Asset is small enough for direct editor loading.',
					'sourceFingerprint' => self::source_fingerprint( $source ),
					'sourceSizeBytes'   => (int) $source['sizeBytes'],
					'stats'             => self::editor_preview_stats_from_analysis( is_array( $analysis ) ? $analysis : [] ),
				]
			);
		} else {
			self::maybe_queue_editor_preview( $asset_id, $source, is_array( $analysis ) ? $analysis : [], $decision );
		}

		$record = self::get_editor_preview_record( $asset_id );
		$status = (string) ( $record['status'] ?? 'none' );
		$message = (string) ( $record['message'] ?? '' );

		if ( 'ready' === $status && ! self::editor_preview_record_is_ready( $record, $source ) ) {
			$status = 'stale';
			$message = 'Editor preview is stale and will be regenerated.';
			$record['status'] = $status;
			$record['message'] = $message;
			self::store_editor_preview_record( $asset_id, $record );
			self::schedule_editor_preview_job( $asset_id );
		}

		$url = 'ready' === $status ? (string) ( $record['url'] ?? '' ) : '';

		return self::empty_editor_preview_state(
			$status,
			$message,
			[
				'url'             => $url,
				'sourceSizeBytes' => (int) $source['sizeBytes'],
				'analysis'        => self::public_editor_analysis( is_array( $analysis ) ? $analysis : [] ),
				'shouldPreview'   => (bool) $decision['shouldPreview'],
				'reasons'         => $decision['reasons'],
			]
		);
	}

	public function process_editor_preview_job( int $asset_id ): void {
		$asset_id = absint( $asset_id );
		if ( $asset_id <= 0 || 'vrodos_asset3d' !== get_post_type( $asset_id ) ) {
			return;
		}

		if ( get_transient( self::EDITOR_PREVIEW_LOCK_KEY ) ) {
			self::schedule_editor_preview_job( $asset_id, 60 );
			return;
		}

		set_transient( self::EDITOR_PREVIEW_LOCK_KEY, $asset_id, self::EDITOR_PREVIEW_JOB_TIMEOUT_SECONDS );

		try {
			$this->run_editor_preview_job( $asset_id );
		} finally {
			delete_transient( self::EDITOR_PREVIEW_LOCK_KEY );
		}
	}

	private function run_editor_preview_job( int $asset_id ): void {
		$source = self::get_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			self::store_editor_preview_record(
				$asset_id,
				[
					'status'  => 'failed',
					'message' => $source->get_error_message(),
				]
			);
			return;
		}

		$analysis = self::get_analysis_meta( $asset_id );
		if ( self::analysis_needs_refresh( $analysis, $source ) ) {
			$analysis = self::refresh_asset_analysis( $asset_id );
		}
		$analysis = is_array( $analysis ) ? $analysis : [];

		$decision = self::editor_preview_decision( (int) $source['sizeBytes'], $analysis );
		if ( ! $decision['shouldPreview'] ) {
			self::store_editor_preview_record(
				$asset_id,
				[
					'status'            => 'none',
					'message'           => 'Asset is small enough for direct editor loading.',
					'sourceFingerprint' => self::source_fingerprint( $source ),
					'sourceSizeBytes'   => (int) $source['sizeBytes'],
					'stats'             => self::editor_preview_stats_from_analysis( $analysis ),
				]
			);
			return;
		}

		self::store_editor_preview_record(
			$asset_id,
			[
				'status'            => 'running',
				'message'           => 'Generating editor preview derivative.',
				'sourceFingerprint' => self::source_fingerprint( $source ),
				'sourceSizeBytes'   => (int) $source['sizeBytes'],
				'profile'           => self::editor_preview_profile_record(),
				'stats'             => self::editor_preview_stats_from_analysis( $analysis ),
				'editorOnly'        => true,
				'compileEnabled'    => false,
				'startedAt'         => current_time( 'mysql', true ),
			]
		);

		$result = $this->generate_derivative(
			$asset_id,
			$source,
			self::EDITOR_PREVIEW_PROFILE,
			[ 'protectGeometry' => self::editor_preview_protects_geometry( $asset_id ) ]
		);
		if ( is_wp_error( $result ) ) {
			self::store_editor_preview_record(
				$asset_id,
				[
					'status'            => 'failed',
					'message'           => $result->get_error_message(),
					'sourceFingerprint' => self::source_fingerprint( $source ),
					'sourceSizeBytes'   => (int) $source['sizeBytes'],
					'profile'           => self::editor_preview_profile_record(),
					'stats'             => self::editor_preview_stats_from_analysis( $analysis ),
					'editorOnly'        => true,
					'compileEnabled'    => false,
					'failedAt'          => current_time( 'mysql', true ),
				]
			);
			return;
		}

		$this->store_editor_preview_derivative_record( $asset_id, $result, $source, $analysis );
	}

	private static function maybe_queue_editor_preview( int $asset_id, array $source, array $analysis, array $decision ): void {
		$record = self::get_editor_preview_record( $asset_id );
		$current_status = (string) ( $record['status'] ?? '' );
		$current_fingerprint = (string) ( $record['sourceFingerprint'] ?? '' );
		$source_fingerprint = self::source_fingerprint( $source );

		if ( 'ready' === $current_status && $current_fingerprint === $source_fingerprint && self::editor_preview_record_is_ready( $record, $source ) ) {
			return;
		}

		if ( 'queued' === $current_status && $current_fingerprint === $source_fingerprint ) {
			self::schedule_editor_preview_job( $asset_id );
			return;
		}

		if ( 'running' === $current_status && $current_fingerprint === $source_fingerprint ) {
			$updated_at = strtotime( (string) ( $record['updatedAt'] ?? '' ) . ' UTC' );
			if ( false !== $updated_at && time() - $updated_at < self::EDITOR_PREVIEW_JOB_TIMEOUT_SECONDS ) {
				return;
			}

			self::store_editor_preview_record(
				$asset_id,
				[
					'status'    => 'queued',
					'message'   => 'A stale editor preview job was queued again.',
					'queuedAt'  => current_time( 'mysql', true ),
					'retryCount' => absint( $record['retryCount'] ?? 0 ) + 1,
				]
			);
			self::schedule_editor_preview_job( $asset_id );
			return;
		}

		self::store_editor_preview_record(
			$asset_id,
			[
				'status'            => $current_fingerprint && $current_fingerprint !== $source_fingerprint ? 'stale' : 'queued',
				'message'           => 'Editor preview is queued for generation.',
				'sourceFingerprint' => $source_fingerprint,
				'sourceSizeBytes'   => (int) $source['sizeBytes'],
				'profile'           => self::editor_preview_profile_record(),
				'stats'             => self::editor_preview_stats_from_analysis( $analysis ),
				'reasons'           => $decision['reasons'],
				'editorOnly'        => true,
				'compileEnabled'    => false,
				'queuedAt'          => current_time( 'mysql', true ),
			]
		);

		self::schedule_editor_preview_job( $asset_id );
	}

	private static function schedule_editor_preview_job( int $asset_id, int $delay = 0 ): void {
		$asset_id = absint( $asset_id );
		if ( $asset_id <= 0 ) {
			return;
		}

		if ( $delay <= 0 ) {
			$delay = self::EDITOR_PREVIEW_QUEUE_DELAY_SECONDS;
		}

		if ( ! wp_next_scheduled( self::EDITOR_PREVIEW_CRON_HOOK, [ $asset_id ] ) ) {
			wp_schedule_single_event( time() + max( 1, $delay ), self::EDITOR_PREVIEW_CRON_HOOK, [ $asset_id ] );
		}
	}

	private static function get_editor_preview_record( int $asset_id ): array {
		$meta = self::get_derivative_meta( $asset_id );
		$record = $meta['derivatives'][ self::EDITOR_PREVIEW_PROFILE ] ?? [];
		return is_array( $record ) ? $record : [];
	}

	private static function store_editor_preview_record( int $asset_id, array $record ): bool {
		$meta = self::get_derivative_meta( $asset_id );
		$existing = self::get_editor_preview_record( $asset_id );

		$meta['derivatives'][ self::EDITOR_PREVIEW_PROFILE ] = wp_parse_args(
			$record,
			wp_parse_args(
				$existing,
				[
					'profile'        => self::EDITOR_PREVIEW_PROFILE,
					'status'         => 'none',
					'attachmentId'   => 0,
					'url'            => '',
					'path'           => '',
					'message'        => '',
					'editorOnly'     => true,
					'compileEnabled' => false,
					'createdAt'      => '',
				]
			)
		);
		$meta['derivatives'][ self::EDITOR_PREVIEW_PROFILE ]['updatedAt'] = current_time( 'mysql', true );

		$updated = update_post_meta( $asset_id, self::META_KEY, $meta );
		return false !== $updated || get_post_meta( $asset_id, self::META_KEY, true ) === $meta;
	}

	private function store_editor_preview_derivative_record( int $asset_id, array $result, array $source, array $analysis ): void {
		$record = $result['record'];
		$paths = $result['paths'];
		$existing = self::get_editor_preview_record( $asset_id );
		$previous_attachment_id = absint( $existing['attachmentId'] ?? 0 );
		$attachment_id = 0;
		$registered_new_attachment = false;

		if (
			$previous_attachment_id > 0
			&& VRodos_Storage_Manager::attachment_is_owned_by( $previous_attachment_id, 'asset', $asset_id )
			&& wp_normalize_path( (string) get_attached_file( $previous_attachment_id, true ) ) === wp_normalize_path( (string) $paths['file'] )
		) {
			$attachment_id = $previous_attachment_id;
		} else {
			$attachment_id = VRodos_Storage_Manager::register_existing_private_attachment(
				$paths['file'],
				'model/gltf-binary',
				$asset_id,
				'asset',
				'derivatives',
				self::EDITOR_PREVIEW_PROFILE
			);
			if ( is_wp_error( $attachment_id ) ) {
				self::store_editor_preview_record(
					$asset_id,
					[
						'status'   => 'failed',
						'message'  => $attachment_id->get_error_message(),
						'failedAt' => current_time( 'mysql', true ),
					]
				);
				return;
			}
			$registered_new_attachment = true;
		}

		$stored = self::store_editor_preview_record(
			$asset_id,
			[
				'status'              => 'ready',
				'attachmentId'        => (int) $attachment_id,
				'url'                 => VRodos_Storage_Manager::authoring_url_for_attachment( (int) $attachment_id ),
				'path'                => wp_normalize_path( (string) $paths['file'] ),
				'file'                => wp_normalize_path( (string) $paths['file'] ),
				'manifestPath'        => wp_normalize_path( (string) $paths['manifest'] ),
				'sourceUrl'           => esc_url_raw( (string) $source['url'] ),
				'sourcePath'          => wp_normalize_path( (string) $source['path'] ),
				'sourceFingerprint'   => self::source_fingerprint( $source ),
				'sourceSizeBytes'     => (int) ( $record['sourceSizeBytes'] ?? $source['sizeBytes'] ),
				'derivativeSizeBytes' => (int) ( $record['derivativeSizeBytes'] ?? 0 ),
				'reductionBytes'      => (int) ( $record['reductionBytes'] ?? 0 ),
				'reductionPercent'    => is_numeric( $record['reductionPercent'] ?? null ) ? (float) $record['reductionPercent'] : 0.0,
				'message'             => 'Editor preview derivative is ready.',
				'profile'             => self::editor_preview_profile_record(),
				'stats'               => [
					'original'   => self::editor_preview_stats_from_analysis( $analysis ),
					'derivative' => is_array( $record['derivative'] ?? null ) ? self::editor_preview_stats_from_analysis( $record['derivative'] ) : [],
				],
				'editorOnly'          => true,
				'compileEnabled'      => false,
				'createdAt'           => current_time( 'mysql', true ),
				'completedAt'         => current_time( 'mysql', true ),
			]
		);

		if ( ! $stored ) {
			if ( $registered_new_attachment ) {
				VRodos_Storage_Manager::delete_attachment_if_owned_by( (int) $attachment_id, 'asset', $asset_id );
			}
			return;
		}
		if ( $previous_attachment_id && $previous_attachment_id !== (int) $attachment_id ) {
			VRodos_Storage_Manager::delete_attachment_if_owned_by( $previous_attachment_id, 'asset', $asset_id );
		}
	}

	private static function editor_preview_protects_geometry( int $asset_id ): bool {
		$terms = wp_get_post_terms( $asset_id, 'vrodos_asset3d_cat', [ 'fields' => 'slugs' ] );
		if ( is_wp_error( $terms ) ) {
			return false;
		}

		return ! empty( array_intersect( [ 'walkable-surface', 'collision-proxy' ], array_map( 'sanitize_title', $terms ) ) );
	}

	private static function editor_preview_record_is_ready( array $record, array $source ): bool {
		if ( ( $record['status'] ?? '' ) !== 'ready' || empty( $record['url'] ) ) {
			return false;
		}

		$path = (string) ( $record['path'] ?? $record['file'] ?? '' );
		if ( '' === $path || ! is_file( $path ) ) {
			return false;
		}

		return (string) ( $record['sourceFingerprint'] ?? '' ) === self::source_fingerprint( $source );
	}

	private static function editor_preview_decision( int $source_size_bytes, array $analysis ): array {
		$triangles = (int) ( $analysis['geometry']['estimatedTriangles'] ?? 0 );
		$primitives = (int) ( $analysis['counts']['primitives'] ?? 0 );
		$materials = (int) ( $analysis['counts']['usedMaterials'] ?? $analysis['counts']['materials'] ?? 0 );
		$image_bytes = (int) ( $analysis['payload']['estimatedImageBytes'] ?? 0 );
		$reasons = [];

		if ( $source_size_bytes >= self::EDITOR_PREVIEW_FILE_THRESHOLD_BYTES ) {
			$reasons[] = 'source-size';
		}
		if ( $triangles >= self::EDITOR_PREVIEW_TRIANGLE_THRESHOLD ) {
			$reasons[] = 'triangles';
		}
		if ( $primitives >= self::EDITOR_PREVIEW_PRIMITIVE_THRESHOLD ) {
			$reasons[] = 'primitives';
		}
		if ( $materials >= self::EDITOR_PREVIEW_MATERIAL_THRESHOLD ) {
			$reasons[] = 'materials';
		}
		if ( $image_bytes >= self::EDITOR_PREVIEW_IMAGE_BYTE_THRESHOLD ) {
			$reasons[] = 'texture-payload';
		}

		return [
			'shouldPreview' => ! empty( $reasons ),
			'reasons'       => array_values( array_unique( $reasons ) ),
		];
	}

	private static function editor_preview_profile_record(): array {
		return [
			'id'              => self::EDITOR_PREVIEW_PROFILE,
			'maxTriangles'    => 250000,
			'textureMaxSize'  => 1024,
			'compression'     => 'none',
			'compileEligible' => false,
		];
	}

	private static function editor_preview_stats_from_analysis( array $analysis ): array {
		return [
			'triangles'  => (int) ( $analysis['geometry']['estimatedTriangles'] ?? 0 ),
			'vertices'   => (int) ( $analysis['geometry']['vertexCount'] ?? 0 ),
			'primitives' => (int) ( $analysis['counts']['primitives'] ?? 0 ),
			'materials'  => (int) ( $analysis['counts']['usedMaterials'] ?? $analysis['counts']['materials'] ?? 0 ),
			'textures'   => (int) ( $analysis['counts']['textures'] ?? 0 ),
			'images'     => (int) ( $analysis['counts']['images'] ?? 0 ),
		];
	}

	private static function public_editor_analysis( array $analysis ): array {
		return [
			'counts'   => is_array( $analysis['counts'] ?? null ) ? $analysis['counts'] : [],
			'geometry' => is_array( $analysis['geometry'] ?? null ) ? $analysis['geometry'] : [],
			'payload'  => is_array( $analysis['payload'] ?? null ) ? $analysis['payload'] : [],
			'flags'    => is_array( $analysis['flags'] ?? null ) ? $analysis['flags'] : [],
		];
	}

	private static function empty_editor_preview_state( string $status, string $message = '', array $extra = [] ): array {
		return array_merge(
			[
				'url'             => '',
				'status'          => $status,
				'message'         => $message,
				'used'            => 'ready' === $status && ! empty( $extra['url'] ),
				'sourceSizeBytes' => 0,
				'analysis'        => [],
				'shouldPreview'   => false,
				'reasons'         => [],
			],
			$extra
		);
	}
}
