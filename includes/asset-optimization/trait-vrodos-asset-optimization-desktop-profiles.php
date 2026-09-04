<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Queued immutable GLB families used by desktop Custom and adaptive builds. */
trait VRodos_Asset_Optimization_Desktop_Profiles {
	private const DESKTOP_PROFILE_PIPELINE_VERSION = 1;
	private const DESKTOP_PROFILE_LOCK_KEY = 'vrodos_asset_desktop_profile_global_lock';
	private const DESKTOP_PROFILE_MIN_TEXTURE_SIZE = 256;

	public static function prepare_desktop_profile_derivatives( VRodos_Project_Compile_Plan $plan ): array {
		if ( 'desktop' !== $plan->request->vr_runtime_profile ) {
			return [ 'status' => 'ready', 'ready' => 0, 'total' => 0, 'message' => '' ];
		}

		$assets = [];
		$scene_assets = [];
		$scene_slots = [];
		foreach ( $plan->scenes as $scene ) {
			$current_scene_assets = [];
			self::collect_desktop_profile_assets( $scene->scene_json, $current_scene_assets );
			$scene_assets[ $scene->scene_id ] = $current_scene_assets;
			$current_slots = 'adaptive' === (string) ( $scene->desktop_profiles['buildMode'] ?? 'adaptive' )
				? [ 'low', 'medium', 'high' ]
				: [ 'custom' ];
			$scene_slots[ $scene->scene_id ] = $current_slots;
			foreach ( $current_scene_assets as $asset_id => $asset ) {
				$assets[ $asset_id ] = [
					'protectGeometry' => ! empty( $asset['protectGeometry'] ) || ! empty( $assets[ $asset_id ]['protectGeometry'] ),
					'slots' => array_values( array_unique( array_merge( (array) ( $assets[ $asset_id ]['slots'] ?? [] ), $current_slots ) ) ),
				];
			}
		}
		ksort( $assets, SORT_NUMERIC );
		$total = array_sum( array_map( static fn( array $asset ): int => count( $asset['slots'] ), $assets ) );
		$ready = 0;
		$pending = [];
		$errors = [];
		$records = [ 'custom' => [], 'low' => [], 'medium' => [], 'high' => [] ];

		foreach ( $assets as $asset_id => $asset ) {
			$source = self::get_source_glb( (int) $asset_id );
			if ( is_wp_error( $source ) ) {
				$errors[] = sprintf( 'Asset #%d: %s', $asset_id, $source->get_error_message() );
				continue;
			}

			foreach ( [ 'custom', 'low', 'medium', 'high' ] as $slot ) {
				if ( ! in_array( $slot, $asset['slots'], true ) ) {
					continue;
				}
				$profile = 'desktop-' . $slot;
				$definition = (array) ( $plan->scenes[0]->desktop_profiles['profiles'][ $slot ]['assets'] ?? [] );
				$options = [
					'protectGeometry' => ! empty( $asset['protectGeometry'] ),
					'textureMaxSize'  => absint( $definition['textureMaxSize'] ?? 0 ),
					'pipelineVersion' => self::DESKTOP_PROFILE_PIPELINE_VERSION,
				];
				$record = self::desktop_profile_record( (int) $asset_id, $profile );
				if ( self::desktop_profile_record_is_ready( $record, $source, $profile, $options ) ) {
					++$ready;
					$records[ $slot ][ $asset_id ] = $record;
					continue;
				}

				if ( 'failed' === (string) ( $record['status'] ?? '' ) && self::desktop_profile_record_matches_request( $record, $source, $options ) && time() - absint( $record['failedAt'] ?? 0 ) < 60 ) {
					$message = (string) ( $record['message'] ?? 'Derivative generation failed.' );
					if ( in_array( $slot, [ 'low', 'medium' ], true ) && preg_match( '/toktx|ktx.software|ktx software/i', $message ) ) {
						$message = 'KTX-Software 4.3+ is required for Low and Medium desktop profiles. ' . $message;
					}
					$errors[] = sprintf( 'Asset #%d %s: %s', $asset_id, ucfirst( $slot ), $message );
					continue;
				}

				self::queue_desktop_profile_derivative( (int) $asset_id, $profile, $source, $options );
				$pending[] = sprintf( 'asset #%d %s', $asset_id, ucfirst( $slot ) );
			}
		}

		if ( $errors ) {
			return [
				'status'  => 'failed',
				'ready'   => $ready,
				'total'   => $total,
				'message' => implode( ' ', array_values( array_unique( $errors ) ) ),
			];
		}
		if ( $pending ) {
			return [
				'status'  => 'pending',
				'ready'   => $ready,
				'total'   => $total,
				'message' => sprintf( 'Preparing desktop profile assets (%d/%d ready).', $ready, $total ),
			];
		}

		$memory_gate = self::apply_desktop_texture_memory_gates( $plan, $assets, $scene_assets, $scene_slots, $records );
		if ( 'ready' !== $memory_gate['status'] ) {
			$memory_gate['ready'] = $ready;
			$memory_gate['total'] = $total;
			return $memory_gate;
		}

		return [
			'status'  => 'ready',
			'ready'   => $ready,
			'total'   => $total,
			'message' => sprintf( 'Desktop profile assets are ready (%d/%d).', $ready, $total ),
		];
	}

	public function process_desktop_profile_job( int $asset_id, string $profile, int $protect_geometry = 0, int $texture_max_size = 0 ): void {
		$asset_id = absint( $asset_id );
		$profile = sanitize_key( $profile );
		if ( $asset_id <= 0 || 'vrodos_asset3d' !== get_post_type( $asset_id ) || ! in_array( $profile, [ 'desktop-custom', 'desktop-low', 'desktop-medium', 'desktop-high' ], true ) ) {
			return;
		}
		if ( get_transient( self::DESKTOP_PROFILE_LOCK_KEY ) ) {
			self::schedule_desktop_profile_job( $asset_id, $profile, $protect_geometry, $texture_max_size, 30 );
			return;
		}

		set_transient( self::DESKTOP_PROFILE_LOCK_KEY, $asset_id . ':' . $profile, 1800 );
		$options = [
			'protectGeometry' => 1 === $protect_geometry,
			'textureMaxSize'  => absint( $texture_max_size ),
			'pipelineVersion' => self::DESKTOP_PROFILE_PIPELINE_VERSION,
		];
		try {
			$source = self::get_source_glb( $asset_id );
			if ( is_wp_error( $source ) ) {
				self::store_desktop_profile_failure( $asset_id, $profile, $source->get_error_message(), $options );
				return;
			}
			self::store_desktop_profile_status( $asset_id, $profile, $source, $options, 'running', 'Generating desktop profile derivative.' );
			$result = $this->generate_derivative( $asset_id, $source, $profile, $options );
			if ( is_wp_error( $result ) ) {
				self::store_desktop_profile_failure( $asset_id, $profile, $result->get_error_message(), $options );
				return;
			}
			$this->store_derivative_record( $asset_id, $result );
		} finally {
			delete_transient( self::DESKTOP_PROFILE_LOCK_KEY );
		}
	}

	public static function desktop_profile_derivative_path( int $asset_id, string $slot ): string {
		$profile = 'desktop-' . sanitize_key( $slot );
		$source = self::get_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			return '';
		}
		$record = self::desktop_profile_record( $asset_id, $profile );
		$options = is_array( $record['profileOptions'] ?? null ) ? $record['profileOptions'] : [];
		return self::desktop_profile_record_is_ready( $record, $source, $profile, $options )
			? (string) ( $record['path'] ?? '' )
			: '';
	}

	public static function desktop_profile_derivative_info( int $asset_id, string $slot ): array {
		$record = self::desktop_profile_record( $asset_id, 'desktop-' . sanitize_key( $slot ) );
		return [
			'estimatedTextureMemoryBytes' => absint( $record['estimatedTextureMemoryBytes'] ?? 0 ),
			'derivativeSizeBytes'         => absint( $record['derivativeSizeBytes'] ?? 0 ),
			'textureMaxSize'              => absint( $record['profileOptions']['textureMaxSize'] ?? 0 ),
			'geometryProtected'           => ! empty( $record['profileOptions']['protectGeometry'] ),
		];
	}

	private static function collect_desktop_profile_assets( $value, array &$assets ): void {
		if ( is_array( $value ) ) {
			foreach ( $value as $child ) {
				self::collect_desktop_profile_assets( $child, $assets );
			}
			return;
		}
		if ( ! is_object( $value ) ) {
			return;
		}
		$asset_id = absint( $value->asset_id ?? 0 );
		if ( $asset_id && get_post_meta( $asset_id, 'vrodos_asset3d_glb', true ) ) {
			$category = sanitize_title( (string) ( $value->category_slug ?? $value->category_name ?? '' ) );
			$protect = in_array( $category, [ 'walkable-surface', 'collision-proxy' ], true ) || VRodos_Runtime_Settings_Contract::normalize_bool( $value->compiledCollisionEnabled ?? false, false );
			$assets[ $asset_id ] = [
				'protectGeometry' => $protect || ! empty( $assets[ $asset_id ]['protectGeometry'] ),
			];
		}
		foreach ( get_object_vars( $value ) as $child ) {
			self::collect_desktop_profile_assets( $child, $assets );
		}
	}

	private static function desktop_profile_record( int $asset_id, string $profile ): array {
		$meta = self::get_derivative_meta( $asset_id );
		$record = $meta['derivatives'][ $profile ] ?? [];
		return is_array( $record ) ? $record : [];
	}

	private static function desktop_profile_record_is_ready( array $record, array $source, string $profile, array $options ): bool {
		if ( ! self::desktop_profile_record_matches_request( $record, $source, $options ) || ! self::is_derivative_usable( $record, (string) $source['url'] ) || empty( $record['runtimeSubstitutionReady'] ) ) {
			return false;
		}
		$extensions = array_map( 'strval', (array) ( $record['extensions'] ?? [] ) );
		if ( ! in_array( 'KHR_draco_mesh_compression', $extensions, true ) ) {
			return false;
		}
		return in_array( $profile, [ 'desktop-custom', 'desktop-high' ], true ) || 0 === absint( $record['textureImageCount'] ?? 0 ) || in_array( 'KHR_texture_basisu', $extensions, true );
	}

	private static function desktop_profile_record_matches_request( array $record, array $source, array $options ): bool {
		$record_options = (array) ( $record['profileOptions'] ?? [] );
		$source_hash = is_file( (string) $source['path'] ) ? hash_file( 'sha256', (string) $source['path'] ) : '';
		$requested_size = absint( $options['textureMaxSize'] ?? 0 );
		$record_size = absint( $record_options['textureMaxSize'] ?? 0 );
		return '' !== $source_hash
			&& hash_equals( (string) ( $record['sourceSha256'] ?? '' ), $source_hash )
			&& (int) ( $record_options['pipelineVersion'] ?? 0 ) === self::DESKTOP_PROFILE_PIPELINE_VERSION
			&& ( empty( $options['protectGeometry'] ) || ! empty( $record_options['protectGeometry'] ) )
			&& ( 0 === $requested_size || ( $record_size > 0 && $record_size <= $requested_size ) );
	}

	private static function queue_desktop_profile_derivative( int $asset_id, string $profile, array $source, array $options ): void {
		$record = self::desktop_profile_record( $asset_id, $profile );
		if ( in_array( (string) ( $record['status'] ?? '' ), [ 'queued', 'running' ], true ) && self::desktop_profile_record_matches_request( $record, $source, $options ) ) {
			return;
		}
		self::store_desktop_profile_status( $asset_id, $profile, $source, $options, 'queued', 'Desktop profile derivative is queued.' );
		self::schedule_desktop_profile_job(
			$asset_id,
			$profile,
			! empty( $options['protectGeometry'] ) ? 1 : 0,
			absint( $options['textureMaxSize'] ?? 0 )
		);
	}

	private static function schedule_desktop_profile_job( int $asset_id, string $profile, int $protect_geometry, int $texture_max_size, int $delay = 2 ): void {
		$args = [ $asset_id, $profile, $protect_geometry, $texture_max_size ];
		if ( ! wp_next_scheduled( self::DESKTOP_PROFILE_CRON_HOOK, $args ) ) {
			wp_schedule_single_event( time() + max( 1, $delay ), self::DESKTOP_PROFILE_CRON_HOOK, $args );
		}
	}

	private static function store_desktop_profile_status( int $asset_id, string $profile, array $source, array $options, string $status, string $message ): void {
		$meta = self::get_derivative_meta( $asset_id );
		$existing = is_array( $meta['derivatives'][ $profile ] ?? null ) ? $meta['derivatives'][ $profile ] : [];
		$source_hash = is_file( (string) $source['path'] ) ? hash_file( 'sha256', (string) $source['path'] ) : '';
		$meta['derivatives'][ $profile ] = array_merge(
			$existing,
			[
				'profile'        => $profile,
				'status'         => $status,
				'message'        => wp_strip_all_tags( $message ),
				'sourceUrl'      => esc_url_raw( (string) $source['url'] ),
				'sourcePath'     => wp_normalize_path( (string) $source['path'] ),
				'sourceSha256'   => $source_hash,
				'profileOptions' => $options,
				'updatedAt'      => current_time( 'mysql', true ),
			]
		);
		unset( $meta['derivatives'][ $profile ]['failedAt'] );
		update_post_meta( $asset_id, self::META_KEY, $meta );
	}

	private static function store_desktop_profile_failure( int $asset_id, string $profile, string $message, array $options ): void {
		$source = self::get_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			$meta = self::get_derivative_meta( $asset_id );
			$meta['derivatives'][ $profile ] = [
				'profile' => $profile, 'status' => 'failed', 'message' => wp_strip_all_tags( $message ),
				'profileOptions' => $options, 'failedAt' => time(),
			];
			update_post_meta( $asset_id, self::META_KEY, $meta );
			return;
		}
		self::store_desktop_profile_status( $asset_id, $profile, $source, $options, 'failed', $message );
		$meta = self::get_derivative_meta( $asset_id );
		$meta['derivatives'][ $profile ]['failedAt'] = time();
		update_post_meta( $asset_id, self::META_KEY, $meta );
	}

	private static function apply_desktop_texture_memory_gates( VRodos_Project_Compile_Plan $plan, array $assets, array $scene_assets, array $scene_slots, array $records ): array {
		foreach ( $plan->scenes as $scene ) {
			foreach ( [ 'low', 'medium' ] as $slot ) {
				if ( ! in_array( $slot, $scene_slots[ $scene->scene_id ] ?? [], true ) ) {
					continue;
				}
				$profile_definition = (array) ( $scene->desktop_profiles['profiles'][ $slot ]['assets'] ?? [] );
				$budget_mib = (float) ( $profile_definition['textureMemoryMiB'] ?? 0 );
				if ( $budget_mib <= 0 ) {
					continue;
				}
				$total_bytes = 0;
				$largest_asset_id = 0;
				$largest_bytes = 0;
				foreach ( array_keys( $scene_assets[ $scene->scene_id ] ?? [] ) as $asset_id ) {
					$record = (array) ( $records[ $slot ][ $asset_id ] ?? [] );
					if ( absint( $record['unaccountedTextureImages'] ?? 0 ) > 0 ) {
						return [
							'status' => 'failed',
							'message' => sprintf( 'Scene #%d asset #%d has texture images that could not be measured for the %s memory budget.', $scene->scene_id, $asset_id, ucfirst( $slot ) ),
						];
					}
					$bytes = absint( $record['estimatedTextureMemoryBytes'] ?? 0 );
					$total_bytes += $bytes;
					if ( $bytes > $largest_bytes && absint( $record['profileOptions']['textureMaxSize'] ?? 0 ) > self::DESKTOP_PROFILE_MIN_TEXTURE_SIZE ) {
						$largest_bytes = $bytes;
						$largest_asset_id = (int) $asset_id;
					}
				}
				$budget_bytes = (int) round( $budget_mib * 1024 * 1024 );
				if ( $total_bytes <= $budget_bytes ) {
					continue;
				}
				if ( $largest_asset_id <= 0 ) {
					return [
						'status' => 'failed',
						'message' => sprintf( 'Scene #%d %s texture memory is %.1f MiB and cannot meet the %.0f MiB target without reducing textures below %dpx.', $scene->scene_id, ucfirst( $slot ), $total_bytes / 1048576, $budget_mib, self::DESKTOP_PROFILE_MIN_TEXTURE_SIZE ),
					];
				}
				$record = $records[ $slot ][ $largest_asset_id ];
				$source = self::get_source_glb( $largest_asset_id );
				$current_size = absint( $record['profileOptions']['textureMaxSize'] ?? 0 );
				$options = [
					'protectGeometry' => ! empty( $assets[ $largest_asset_id ]['protectGeometry'] ),
					'textureMaxSize'  => max( self::DESKTOP_PROFILE_MIN_TEXTURE_SIZE, (int) floor( $current_size / 2 ) ),
					'pipelineVersion' => self::DESKTOP_PROFILE_PIPELINE_VERSION,
				];
				self::queue_desktop_profile_derivative( $largest_asset_id, 'desktop-' . $slot, $source, $options );
				return [
					'status' => 'pending',
					'message' => sprintf( 'Scene #%d %s texture memory is %.1f MiB; reducing the largest texture set to meet the %.0f MiB target.', $scene->scene_id, ucfirst( $slot ), $total_bytes / 1048576, $budget_mib ),
				];
			}
		}

		return [ 'status' => 'ready', 'message' => '' ];
	}
}
