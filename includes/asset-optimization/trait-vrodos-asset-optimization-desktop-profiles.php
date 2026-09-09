<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Queued immutable GLB families used by desktop Custom and adaptive builds. */
trait VRodos_Asset_Optimization_Desktop_Profiles {
	private const DESKTOP_PROFILE_PIPELINE_VERSION = 1;
	private const DESKTOP_PROFILE_LOCK_KEY = 'vrodos_asset_desktop_profile_global_lock';
	private const DESKTOP_PROFILE_MIN_TEXTURE_SIZE = 256;
	private const DESKTOP_PROFILE_STALE_SECONDS = 720;

	public static function prepare_desktop_profile_derivatives( VRodos_Project_Compile_Plan $plan ): array {
		if ( 'desktop' !== $plan->request->vr_runtime_profile ) {
			return [ 'status' => 'ready', 'ready' => 0, 'total' => 0, 'percent' => 100, 'profiles' => [], 'message' => '' ];
		}

		$assets = [];
		$scene_assets = [];
		$scene_slots = [];
		foreach ( $plan->scenes as $scene ) {
			$current_scene_assets = [];
			self::collect_desktop_profile_assets( $scene->scene_json, $current_scene_assets );
			$scene_assets[ $scene->scene_id ] = $current_scene_assets;
			$current_slots = 'adaptive' === (string) ( $scene->desktop_profiles['buildMode'] ?? 'custom' )
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
		$profile_progress = [];

		foreach ( $assets as $asset_id => $asset ) {
			$source = self::get_source_glb( (int) $asset_id );
			if ( is_wp_error( $source ) ) {
				$errors[] = sprintf( 'Asset #%d: %s', $asset_id, $source->get_error_message() );
				foreach ( (array) $asset['slots'] as $slot ) {
					$profile_progress[] = self::desktop_profile_progress_item(
						(int) $asset_id,
						(string) $slot,
						[],
						[],
						[ 'protectGeometry' => ! empty( $asset['protectGeometry'] ) ],
						'failed',
						$source->get_error_message()
					);
				}
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
					$profile_progress[] = self::desktop_profile_progress_item( (int) $asset_id, $slot, $record, $source, $options, 'ready', 'Ready' );
					continue;
				}

				if ( 'failed' === (string) ( $record['status'] ?? '' ) && self::desktop_profile_record_matches_request( $record, $source, $options ) && time() - absint( $record['failedAt'] ?? 0 ) < 60 ) {
					$message = (string) ( $record['message'] ?? 'Derivative generation failed.' );
					if ( in_array( $slot, [ 'low', 'medium' ], true ) && preg_match( '/toktx|ktx.software|ktx software/i', $message ) ) {
						$message = 'KTX-Software 4.3+ is required for Low and Medium desktop profiles. ' . $message;
					}
					$errors[] = sprintf( 'Asset #%d %s: %s', $asset_id, ucfirst( $slot ), $message );
					$profile_progress[] = self::desktop_profile_progress_item( (int) $asset_id, $slot, $record, $source, $options, 'failed', $message );
					continue;
				}

				$queue_result = self::queue_desktop_profile_derivative( (int) $asset_id, $profile, $source, $options );
				if ( is_wp_error( $queue_result ) ) {
					$message = $queue_result->get_error_message();
					$errors[] = sprintf( 'Asset #%d %s: %s', $asset_id, ucfirst( $slot ), $message );
					$record = self::desktop_profile_record( (int) $asset_id, $profile );
					$profile_progress[] = self::desktop_profile_progress_item( (int) $asset_id, $slot, $record, $source, $options, 'failed', $message );
					continue;
				}
				$record = self::desktop_profile_record( (int) $asset_id, $profile );
				$status = in_array( (string) ( $record['status'] ?? '' ), [ 'queued', 'running' ], true ) ? (string) $record['status'] : 'queued';
				$profile_progress[] = self::desktop_profile_progress_item(
					(int) $asset_id,
					$slot,
					$record,
					$source,
					$options,
					$status,
					(string) ( $record['message'] ?? 'Desktop profile derivative is queued.' )
				);
				$pending[] = sprintf( 'asset #%d %s', $asset_id, ucfirst( $slot ) );
			}
		}
		$percent = self::desktop_profile_overall_percent( $profile_progress, $total );

		if ( $errors ) {
			return [
				'status'  => 'failed',
				'ready'   => $ready,
				'total'   => $total,
				'percent' => $percent,
				'profiles' => $profile_progress,
				'message' => implode( ' ', array_values( array_unique( $errors ) ) ),
			];
		}
		if ( $pending ) {
			return [
				'status'  => 'pending',
				'ready'   => $ready,
				'total'   => $total,
				'percent' => $percent,
				'profiles' => $profile_progress,
				'message' => sprintf( 'Preparing desktop profile assets (%d/%d ready).', $ready, $total ),
			];
		}

		$memory_gate = self::apply_desktop_texture_memory_gates( $plan, $assets, $scene_assets, $scene_slots, $records );
		if ( 'ready' !== $memory_gate['status'] ) {
			$memory_gate['ready'] = $ready;
			$memory_gate['total'] = $total;
			$memory_gate['percent'] = $percent;
			$memory_gate['profiles'] = $profile_progress;
			return $memory_gate;
		}

		return [
			'status'  => 'ready',
			'ready'   => $ready,
			'total'   => $total,
			'percent' => 100,
			'profiles' => $profile_progress,
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
			$schedule_result = self::schedule_desktop_profile_job( $asset_id, $profile, $protect_geometry, $texture_max_size, 30 );
			if ( is_wp_error( $schedule_result ) ) {
				$options = [
					'protectGeometry' => 1 === $protect_geometry,
					'textureMaxSize'  => absint( $texture_max_size ),
					'pipelineVersion' => self::DESKTOP_PROFILE_PIPELINE_VERSION,
				];
				self::store_desktop_profile_failure( $asset_id, $profile, $schedule_result->get_error_message(), $options );
				self::log_desktop_profile_schedule_failure( $asset_id, $profile, $schedule_result );
			}
			return;
		}

		set_transient( self::DESKTOP_PROFILE_LOCK_KEY, $asset_id . ':' . $profile, 1800 );
		$options = [
			'protectGeometry' => 1 === $protect_geometry,
			'textureMaxSize'  => absint( $texture_max_size ),
			'pipelineVersion' => self::DESKTOP_PROFILE_PIPELINE_VERSION,
		];
		$source = self::get_source_glb( $asset_id );
		try {
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
		} catch ( Throwable $error ) {
			if ( is_array( $source ) ) {
				self::store_desktop_profile_failure( $asset_id, $profile, $error->getMessage(), $options );
			}
		} finally {
			if ( is_array( $source ) ) {
				self::delete_desktop_profile_progress_file( $asset_id, $profile, $source );
			}
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

	private static function desktop_profile_progress_item(
		int $asset_id,
		string $slot,
		array $record,
		array $source,
		array $options,
		string $status,
		string $message
	): array {
		$profile = 'desktop-' . sanitize_key( $slot );
		$total_steps = self::desktop_profile_total_steps( $profile, $options );
		$step = 0;
		$percent = 0;
		$updated_at = sanitize_text_field( (string) ( $record['updatedAt'] ?? $record['generatedAt'] ?? '' ) );

		if ( 'ready' === $status ) {
			$step = $total_steps;
			$percent = 100;
		} elseif ( is_array( $source ) && 'running' === $status ) {
			$progress = self::read_desktop_profile_progress_file( $asset_id, $profile, $source );
			if ( $progress ) {
				$step = absint( $progress['step'] ?? 0 );
				$total_steps = max( 1, absint( $progress['totalSteps'] ?? $total_steps ) );
				$percent = max( 0, min( 100, absint( $progress['percent'] ?? 0 ) ) );
				$message = (string) ( $progress['message'] ?? $message );
				$updated_at = (string) ( $progress['updatedAt'] ?? $updated_at );
				if ( 'failed' === (string) ( $progress['status'] ?? '' ) ) {
					$status = 'failed';
				}
			}
		}

		$title = wp_strip_all_tags( (string) get_the_title( $asset_id ) );
		return [
			'assetId'      => $asset_id,
			'assetLabel'   => '' !== $title ? $title : sprintf( 'Asset #%d', $asset_id ),
			'profile'      => $profile,
			'profileLabel' => ucfirst( sanitize_key( $slot ) ),
			'status'       => in_array( $status, [ 'queued', 'running', 'ready', 'failed' ], true ) ? $status : 'queued',
			'step'         => min( $step, $total_steps ),
			'totalSteps'   => $total_steps,
			'percent'      => $percent,
			'message'      => substr( wp_strip_all_tags( $message ), 0, 500 ),
			'updatedAt'    => $updated_at,
		];
	}

	private static function desktop_profile_total_steps( string $profile, array $options ): int {
		if ( in_array( $profile, [ 'desktop-custom', 'desktop-high' ], true ) ) {
			return 5;
		}
		return ! empty( $options['protectGeometry'] ) ? 9 : 11;
	}

	private static function desktop_profile_overall_percent( array $profiles, int $total ): int {
		if ( $total <= 0 ) {
			return 100;
		}
		$sum = array_sum( array_map( static fn( array $profile ): int => absint( $profile['percent'] ?? 0 ), $profiles ) );
		return max( 0, min( 100, (int) round( $sum / $total ) ) );
	}

	private static function read_desktop_profile_progress_file( int $asset_id, string $profile, array $source ): array {
		try {
			$paths = self::build_derivative_paths( $asset_id, $source, $profile );
		} catch ( Throwable $error ) {
			return [];
		}
		$path = (string) ( $paths['progress'] ?? '' );
		$size = '' !== $path && is_file( $path ) ? filesize( $path ) : false;
		if ( false === $size || $size <= 0 || $size > 65536 || ! is_readable( $path ) ) {
			return [];
		}

		$progress = json_decode( (string) file_get_contents( $path ), true );
		if (
			! is_array( $progress )
			|| 1 !== absint( $progress['schemaVersion'] ?? 0 )
			|| $profile !== sanitize_key( (string) ( $progress['profile'] ?? '' ) )
			|| wp_normalize_path( (string) ( $progress['sourcePath'] ?? '' ) ) !== wp_normalize_path( (string) ( $source['path'] ?? '' ) )
		) {
			return [];
		}

		return [
			'status'     => sanitize_key( (string) ( $progress['status'] ?? '' ) ),
			'step'       => absint( $progress['step'] ?? 0 ),
			'totalSteps' => absint( $progress['totalSteps'] ?? 0 ),
			'percent'    => max( 0, min( 100, absint( $progress['percent'] ?? 0 ) ) ),
			'message'    => substr( wp_strip_all_tags( (string) ( $progress['message'] ?? '' ) ), 0, 500 ),
			'updatedAt'  => sanitize_text_field( (string) ( $progress['updatedAt'] ?? '' ) ),
		];
	}

	private static function delete_desktop_profile_progress_file( int $asset_id, string $profile, array $source ): void {
		try {
			$paths = self::build_derivative_paths( $asset_id, $source, $profile );
		} catch ( Throwable $error ) {
			return;
		}
		$path = (string) ( $paths['progress'] ?? '' );
		if ( '' !== $path && is_file( $path ) ) {
			wp_delete_file( $path );
		}
		foreach ( glob( $path . '.*.tmp' ) ?: [] as $temporary_path ) {
			if ( is_file( $temporary_path ) ) {
				wp_delete_file( $temporary_path );
			}
		}
	}

	private static function queue_desktop_profile_derivative( int $asset_id, string $profile, array $source, array $options ) {
		$record = self::desktop_profile_record( $asset_id, $profile );
		$status = (string) ( $record['status'] ?? '' );
		$matches_request = self::desktop_profile_record_matches_request( $record, $source, $options );

		if ( 'queued' === $status && $matches_request ) {
			$had_scheduled_event = false !== wp_next_scheduled(
				self::DESKTOP_PROFILE_CRON_HOOK,
				[ $asset_id, $profile, ! empty( $options['protectGeometry'] ) ? 1 : 0, absint( $options['textureMaxSize'] ?? 0 ) ]
			);
			$schedule_result = self::schedule_desktop_profile_job(
				$asset_id,
				$profile,
				! empty( $options['protectGeometry'] ) ? 1 : 0,
				absint( $options['textureMaxSize'] ?? 0 )
			);
			if ( is_wp_error( $schedule_result ) ) {
				self::store_desktop_profile_failure( $asset_id, $profile, $schedule_result->get_error_message(), $options );
				self::log_desktop_profile_schedule_failure( $asset_id, $profile, $schedule_result );
				return $schedule_result;
			}
			if ( ! $had_scheduled_event ) {
				error_log( sprintf( '[VRodos] Recovered missing desktop profile cron job for asset #%d (%s).', $asset_id, $profile ) );
			}
			return true;
		}

		if ( 'running' === $status && $matches_request ) {
			if ( ! self::desktop_profile_job_is_stale( $asset_id, $profile, $record, $source ) ) {
				return true;
			}
			self::delete_desktop_profile_progress_file( $asset_id, $profile, $source );
			self::store_desktop_profile_status( $asset_id, $profile, $source, $options, 'queued', 'A stale desktop profile job was queued again.' );
			error_log( sprintf( '[VRodos] Requeued stale desktop profile job for asset #%d (%s) after %d seconds without progress.', $asset_id, $profile, self::DESKTOP_PROFILE_STALE_SECONDS ) );
			$schedule_result = self::schedule_desktop_profile_job(
				$asset_id,
				$profile,
				! empty( $options['protectGeometry'] ) ? 1 : 0,
				absint( $options['textureMaxSize'] ?? 0 )
			);
			if ( is_wp_error( $schedule_result ) ) {
				self::store_desktop_profile_failure( $asset_id, $profile, $schedule_result->get_error_message(), $options );
				self::log_desktop_profile_schedule_failure( $asset_id, $profile, $schedule_result );
				return $schedule_result;
			}
			return true;
		}
		self::delete_desktop_profile_progress_file( $asset_id, $profile, $source );
		self::store_desktop_profile_status( $asset_id, $profile, $source, $options, 'queued', 'Desktop profile derivative is queued.' );
		$schedule_result = self::schedule_desktop_profile_job(
			$asset_id,
			$profile,
			! empty( $options['protectGeometry'] ) ? 1 : 0,
			absint( $options['textureMaxSize'] ?? 0 )
		);
		if ( is_wp_error( $schedule_result ) ) {
			self::store_desktop_profile_failure( $asset_id, $profile, $schedule_result->get_error_message(), $options );
			self::log_desktop_profile_schedule_failure( $asset_id, $profile, $schedule_result );
			return $schedule_result;
		}
		return true;
	}

	private static function desktop_profile_job_is_stale( int $asset_id, string $profile, array $record, array $source ): bool {
		$latest_activity = strtotime( (string) ( $record['updatedAt'] ?? '' ) . ' UTC' );
		$latest_activity = false === $latest_activity ? 0 : $latest_activity;
		$progress = self::read_desktop_profile_progress_file( $asset_id, $profile, $source );
		if ( $progress ) {
			$progress_updated_at = strtotime( (string) ( $progress['updatedAt'] ?? '' ) . ' UTC' );
			if ( false !== $progress_updated_at ) {
				$latest_activity = max( $latest_activity, $progress_updated_at );
			}
		}

		return $latest_activity <= 0 || time() - $latest_activity >= self::DESKTOP_PROFILE_STALE_SECONDS;
	}

	private static function schedule_desktop_profile_job( int $asset_id, string $profile, int $protect_geometry, int $texture_max_size, int $delay = 2 ) {
		$args = [ $asset_id, $profile, $protect_geometry, $texture_max_size ];
		if ( false !== wp_next_scheduled( self::DESKTOP_PROFILE_CRON_HOOK, $args ) ) {
			return true;
		}

		$result = wp_schedule_single_event( time() + max( 1, $delay ), self::DESKTOP_PROFILE_CRON_HOOK, $args, true );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		return $result ? true : new WP_Error( 'vrodos_desktop_profile_schedule_failed', 'WordPress did not schedule the desktop profile background job.' );
	}

	private static function log_desktop_profile_schedule_failure( int $asset_id, string $profile, WP_Error $error ): void {
		error_log( sprintf( '[VRodos] Failed to schedule desktop profile job for asset #%d (%s): %s', $asset_id, $profile, $error->get_error_message() ) );
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
				$queue_result = self::queue_desktop_profile_derivative( $largest_asset_id, 'desktop-' . $slot, $source, $options );
				if ( is_wp_error( $queue_result ) ) {
					return [
						'status'  => 'failed',
						'message' => $queue_result->get_error_message(),
					];
				}
				return [
					'status' => 'pending',
					'message' => sprintf( 'Scene #%d %s texture memory is %.1f MiB; reducing the largest texture set to meet the %.0f MiB target.', $scene->scene_id, ucfirst( $slot ), $total_bytes / 1048576, $budget_mib ),
				];
			}
		}

		return [ 'status' => 'ready', 'message' => '' ];
	}
}
