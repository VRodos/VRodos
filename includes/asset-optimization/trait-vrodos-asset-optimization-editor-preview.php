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
					'mustAvoidSource' => false,
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
				'mustAvoidSource' => (bool) $decision['mustAvoidSource'],
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
			]
		);

		$result = $this->generate_derivative( $asset_id, $source, self::EDITOR_PREVIEW_PROFILE );
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

		if ( in_array( $current_status, [ 'queued', 'running' ], true ) && $current_fingerprint === $source_fingerprint ) {
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

	private static function store_editor_preview_record( int $asset_id, array $record ): void {
		$meta = self::get_derivative_meta( $asset_id );
		$existing = self::get_editor_preview_record( $asset_id );

		$meta['derivatives'][ self::EDITOR_PREVIEW_PROFILE ] = wp_parse_args(
			$record,
			[
				'profile'        => self::EDITOR_PREVIEW_PROFILE,
				'status'         => 'none',
				'url'            => '',
				'path'           => '',
				'message'        => '',
				'editorOnly'     => true,
				'compileEnabled' => false,
				'createdAt'      => (string) ( $existing['createdAt'] ?? '' ),
				'updatedAt'      => current_time( 'mysql', true ),
			]
		);

		update_post_meta( $asset_id, self::META_KEY, $meta );
	}

	private function store_editor_preview_derivative_record( int $asset_id, array $result, array $source, array $analysis ): void {
		$record = $result['record'];
		$paths = $result['paths'];

		self::store_editor_preview_record(
			$asset_id,
			[
				'status'              => 'ready',
				'url'                 => esc_url_raw( (string) $paths['url'] ),
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
			]
		);
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
			'shouldPreview'   => ! empty( $reasons ),
			'mustAvoidSource' => $source_size_bytes >= self::EDITOR_PREVIEW_HUGE_FILE_THRESHOLD_BYTES || $triangles >= self::EDITOR_PREVIEW_HUGE_TRIANGLE_THRESHOLD,
			'reasons'         => array_values( array_unique( $reasons ) ),
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
				'mustAvoidSource' => false,
				'reasons'         => [],
			],
			$extra
		);
	}
}
