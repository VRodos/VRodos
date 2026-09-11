<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Queued immutable GLB families selected automatically for compiled runtimes. */
trait VRodos_Asset_Optimization_Desktop_Profiles {
	private const DESKTOP_PROFILE_PIPELINE_VERSION = 4;
	private const LARGE_SOURCE_PUBLISH_GATE_BYTES = 104857600;
	private const DESKTOP_PROFILE_MIN_TEXTURE_SIZE = 256;
	private const DESKTOP_PROFILE_STALE_SECONDS = 720;
	private const WEB_FAMILY_PROFILES = [ 'web-high', 'web-medium', 'web-low' ];

	public static function prepare_runtime_profile_derivatives( VRodos_Project_Compile_Plan $plan ): array {
		$assets = [];
		$scene_assets = [];
		$scene_slots = [];
		foreach ( $plan->scenes as $scene ) {
			$current_scene_assets = [];
			self::collect_desktop_profile_assets( $scene->scene_json, $current_scene_assets );
			$scene_assets[ $scene->scene_id ] = $current_scene_assets;
			if ( 'desktop' === $plan->request->vr_runtime_profile ) {
				$current_slots = 'adaptive' === (string) ( $scene->desktop_profiles['buildMode'] ?? 'custom' )
					? [ 'low', 'medium', 'high' ]
					: [ 'custom' ];
			} else {
				$current_slots = [ $plan->request->vr_runtime_profile ];
			}
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
		$records = [ 'custom' => [], 'low' => [], 'medium' => [], 'high' => [], 'headset' => [], 'pc-rendered-vr' => [] ];
		$profile_progress = [];
		$warnings = [];

		foreach ( $assets as $asset_id => $asset ) {
			$source = self::get_source_glb( (int) $asset_id );
			if ( is_wp_error( $source ) ) {
				$errors[] = sprintf( 'Asset #%d: %s', $asset_id, $source->get_error_message() );
				foreach ( (array) $asset['slots'] as $slot ) {
					$profile = self::runtime_derivative_profile_for_slot( (string) $slot, $plan->request->vr_runtime_profile, $plan->scenes[0]->desktop_profiles ?? [] );
					$profile_progress[] = self::desktop_profile_progress_item(
						(int) $asset_id,
						(string) $slot,
						$profile,
						[],
						[],
						[ 'protectGeometry' => ! empty( $asset['protectGeometry'] ) ],
						'failed',
						$source->get_error_message()
					);
				}
				continue;
			}
			$analysis = self::get_analysis_meta( (int) $asset_id );
			if ( self::analysis_needs_refresh( $analysis, $source ) ) {
				$analysis = self::refresh_asset_analysis( (int) $asset_id );
			}
			$family_result = self::maybe_queue_web_high(
				(int) $asset_id,
				$source,
				is_array( $analysis ) ? $analysis : [],
				'build'
			);
			$family_state = null;

			foreach ( (array) $asset['slots'] as $slot ) {
				if ( ! in_array( $slot, $asset['slots'], true ) ) {
					continue;
				}
				$profile = self::runtime_derivative_profile_for_slot( (string) $slot, $plan->request->vr_runtime_profile, $plan->scenes[0]->desktop_profiles ?? [] );
				$definition = self::runtime_derivative_definition_for_slot( (string) $slot, $plan->scenes[0]->desktop_profiles ?? [] );
				$texture_max_size = absint( $definition['textureMaxSize'] ?? self::runtime_derivative_texture_cap( $profile ) );
				$is_standard_profile = $texture_max_size === self::runtime_derivative_texture_cap( $profile );
				$options = [
					'protectGeometry' => 'web-high' === $profile || ! empty( $asset['protectGeometry'] ),
					'textureMaxSize'  => $texture_max_size,
					'pipelineVersion' => self::DESKTOP_PROFILE_PIPELINE_VERSION,
					'recipe'          => $profile,
					'queuePriority'   => 'build',
				];
				if ( 'web-high' === $profile && $is_standard_profile ) {
					$options['familySequence'] = true;
					$options['writePreparedBaseline'] = (int) $source['sizeBytes'] >= self::LARGE_SOURCE_PUBLISH_GATE_BYTES;
				}
				$record = self::desktop_profile_record( (int) $asset_id, $profile, $source, $options );
				if ( self::desktop_profile_record_is_ready( $record, $source, $profile, $options ) ) {
					self::activate_desktop_profile_variant( (int) $asset_id, $profile, (string) $record['jobKey'] );
					++$ready;
					$records[ $slot ][ $asset_id ] = $record;
					$profile_progress[] = self::desktop_profile_progress_item( (int) $asset_id, $slot, $profile, $record, $source, $options, 'ready', 'Ready' );
					continue;
				}

				if ( 'failed' === (string) ( $record['status'] ?? '' ) && self::desktop_profile_record_matches_request( $record, $source, $options ) && time() - absint( $record['failedAt'] ?? 0 ) < 60 ) {
					$message = (string) ( $record['message'] ?? 'Derivative generation failed.' );
					if ( preg_match( '/toktx|ktx.software|ktx software/i', $message ) ) {
						$message = 'KTX-Software 4.3+ is required for automatic web derivatives. ' . $message;
					}
					if ( (int) $source['sizeBytes'] > self::LARGE_SOURCE_PUBLISH_GATE_BYTES ) {
						$errors[] = sprintf( 'Asset #%d %s: %s', $asset_id, ucfirst( $slot ), $message );
						$profile_progress[] = self::desktop_profile_progress_item( (int) $asset_id, $slot, $profile, $record, $source, $options, 'failed', $message );
					} else {
						++$ready;
						$warning = sprintf( 'Asset #%d %s derivative failed; source GLB will be published: %s', $asset_id, ucfirst( $slot ), $message );
						$warnings[] = $warning;
						$profile_progress[] = self::desktop_profile_progress_item( (int) $asset_id, $slot, $profile, $record, $source, $options, 'ready', $warning );
					}
					continue;
				}

				$waits_for_standard_family = $is_standard_profile && in_array( $profile, [ 'web-medium', 'web-low' ], true );
				if ( $waits_for_standard_family && is_wp_error( $family_result ) ) {
					$message = 'The ordered Web derivative family could not start: ' . $family_result->get_error_message();
					if ( (int) $source['sizeBytes'] > self::LARGE_SOURCE_PUBLISH_GATE_BYTES ) {
						$errors[] = sprintf( 'Asset #%d %s: %s', $asset_id, ucfirst( $slot ), $message );
						$status = 'failed';
					} else {
						++$ready;
						$warnings[] = sprintf( 'Asset #%d %s derivative could not be prepared; source GLB will be published: %s', $asset_id, ucfirst( $slot ), $message );
						$status = 'ready';
					}
					$profile_progress[] = self::desktop_profile_progress_item( (int) $asset_id, $slot, $profile, $record, $source, $options, $status, $message );
					continue;
				}
				if ( $waits_for_standard_family && true === $family_result ) {
					if ( null === $family_state ) {
						$family_state = self::get_web_optimization_state( (int) $asset_id );
					}
					$profile_progress[] = self::desktop_profile_family_progress_item( (int) $asset_id, $slot, $profile, $record, $source, $options, $family_state );
					$pending[] = sprintf( 'asset #%d %s', $asset_id, ucfirst( $slot ) );
					continue;
				}

				$queue_result = self::ensure_derivative( (int) $asset_id, $profile, $source, $options );
				if ( is_wp_error( $queue_result ) ) {
					$message = $queue_result->get_error_message();
					if ( (int) $source['sizeBytes'] > self::LARGE_SOURCE_PUBLISH_GATE_BYTES ) {
						$errors[] = sprintf( 'Asset #%d %s: %s', $asset_id, ucfirst( $slot ), $message );
					} else {
						++$ready;
						$warnings[] = sprintf( 'Asset #%d %s derivative could not be queued; source GLB will be published: %s', $asset_id, ucfirst( $slot ), $message );
					}
					$record = self::desktop_profile_record( (int) $asset_id, $profile, $source, $options );
					$profile_progress[] = self::desktop_profile_progress_item( (int) $asset_id, $slot, $profile, $record, $source, $options, (int) $source['sizeBytes'] > self::LARGE_SOURCE_PUBLISH_GATE_BYTES ? 'failed' : 'ready', $message );
					continue;
				}
				$record = self::desktop_profile_record( (int) $asset_id, $profile, $source, $options );
				$status = in_array( (string) ( $record['status'] ?? '' ), [ 'queued', 'running' ], true ) ? (string) $record['status'] : 'queued';
				$profile_progress[] = self::desktop_profile_progress_item(
					(int) $asset_id,
					$slot,
					$profile,
					$record,
					$source,
					$options,
					$status,
					(string) ( $record['message'] ?? 'Web derivative is queued.' )
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
				'warnings' => $warnings,
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
				'message' => sprintf( 'Preparing web-optimized assets (%d/%d ready).', $ready, $total ),
				'warnings' => $warnings,
			];
		}

		$memory_gate = 'desktop' === $plan->request->vr_runtime_profile
			? self::apply_desktop_texture_memory_gates( $plan, $assets, $scene_assets, $scene_slots, $records )
			: [ 'status' => 'ready', 'message' => '' ];
		if ( 'ready' !== $memory_gate['status'] ) {
			$memory_gate['ready'] = $ready;
			$memory_gate['total'] = $total;
			$memory_gate['percent'] = $percent;
			$memory_gate['profiles'] = $profile_progress;
			$memory_gate['warnings'] = $warnings;
			return $memory_gate;
		}

		return [
			'status'  => 'ready',
			'ready'   => $ready,
			'total'   => $total,
			'percent' => 100,
			'profiles' => $profile_progress,
			'message' => sprintf( 'Web-optimized assets are ready (%d/%d).', $ready, $total ),
			'warnings' => $warnings,
		];
	}

	private static function runtime_derivative_profile_for_slot( string $slot, string $runtime_profile, array $desktop_profiles ): string {
		if ( 'desktop' === $runtime_profile ) {
			return sanitize_key( (string) ( $desktop_profiles['profiles'][ $slot ]['assets']['profile'] ?? ( 'custom' === $slot ? 'web-high' : 'web-' . $slot ) ) );
		}
		return 'headset' === $runtime_profile ? 'web-low' : 'web-high';
	}

	private static function runtime_derivative_definition_for_slot( string $slot, array $desktop_profiles ): array {
		if ( isset( $desktop_profiles['profiles'][ $slot ]['assets'] ) ) {
			return (array) $desktop_profiles['profiles'][ $slot ]['assets'];
		}
		return [ 'textureMaxSize' => in_array( $slot, [ 'headset', 'low' ], true ) ? 1024 : ( 'medium' === $slot ? 2048 : 4096 ) ];
	}

	private static function runtime_derivative_texture_cap( string $profile ): int {
		return match ( $profile ) {
			'web-low' => 1024,
			'web-medium' => 2048,
			default => 4096,
		};
	}

	public static function maybe_queue_web_high( int $asset_id, array $source, array $analysis, string $queue_priority = 'normal' ) {
		$source_bytes = (int) ( $source['sizeBytes'] ?? 0 );
		$image_bytes = (int) ( $analysis['payload']['estimatedUncompressedImageBytes'] ?? $analysis['payload']['estimatedImageBytes'] ?? 0 );
		$has_uncompressed_textures = $image_bytes > 0 && (int) ( $analysis['counts']['images'] ?? 0 ) > 0;
		if ( $source_bytes < 20 * 1024 * 1024 && ( ! $has_uncompressed_textures || $image_bytes < 8 * 1024 * 1024 ) ) {
			return false;
		}

		$options = [
			'protectGeometry' => true,
			'textureMaxSize'  => 4096,
			'pipelineVersion' => self::DESKTOP_PROFILE_PIPELINE_VERSION,
			'recipe'          => 'web-high',
			'familySequence'  => true,
			'writePreparedBaseline' => $source_bytes >= self::LARGE_SOURCE_PUBLISH_GATE_BYTES,
		];
		if ( 'build' === self::normalize_optimizer_queue_priority( $queue_priority ) ) {
			$options['queuePriority'] = 'build';
		}
		return self::ensure_derivative( $asset_id, 'web-high', $source, $options );
	}

	public static function get_web_optimization_state( int $asset_id ): array {
		$source = self::get_source_glb( $asset_id );
		$source_bytes = is_wp_error( $source ) ? 0 : (int) ( $source['sizeBytes'] ?? 0 );
		$high_record = self::desktop_profile_record( $asset_id, 'web-high' );
		$high_options = (array) ( $high_record['profileOptions'] ?? [] );
		if ( ! is_wp_error( $source ) && ! empty( $high_options['familySequence'] ) ) {
			self::ensure_derivative( $asset_id, 'web-high', $source, $high_options );
		}
		$profiles = [];
		$ready_profiles = 0;
		$profile_percent_total = 0;
		foreach ( self::WEB_FAMILY_PROFILES as $profile ) {
			$record = self::desktop_profile_record( $asset_id, $profile );
			$status = sanitize_key( (string) ( $record['status'] ?? 'none' ) );
			$percent = 'ready' === $status ? 100 : 0;
			if ( 'running' === $status && is_array( $source ) ) {
				$progress = self::read_desktop_profile_progress_file( $asset_id, $profile, $source, (array) ( $record['profileOptions'] ?? [] ) );
				$percent = absint( $progress['percent'] ?? 0 );
				if ( ! empty( $progress['message'] ) ) {
					$record['message'] = $progress['message'];
				}
			}
			if ( 'ready' === $status ) {
				++$ready_profiles;
			}
			$profile_percent_total += $percent;
			$profiles[ str_replace( 'web-', '', $profile ) ] = [
				'profile'           => $profile,
				'status'            => in_array( $status, [ 'queued', 'running', 'ready', 'failed', 'cancelled' ], true ) ? $status : 'none',
				'percent'           => max( 0, min( 100, $percent ) ),
				'message'           => (string) ( $record['message'] ?? '' ),
				'sourceBytes'       => $source_bytes,
				'derivativeBytes'   => absint( $record['derivativeSizeBytes'] ?? 0 ),
				'reductionPercent'  => is_numeric( $record['reductionPercent'] ?? null ) ? (float) $record['reductionPercent'] : 0.0,
				'attempts'          => max( 0, absint( $record['attempts'] ?? 0 ) ),
				'canRetry'          => 'failed' === $status,
			];
		}
		$high = $profiles['high'];
		$preview_record = self::get_editor_preview_record( $asset_id );
		$preview_status = sanitize_key( (string) ( $preview_record['status'] ?? 'none' ) );
		$preview_status = in_array( $preview_status, [ 'waiting-high', 'queued', 'running', 'ready', 'failed', 'cancelled' ], true ) ? $preview_status : 'none';
		$preview_decision = is_array( $source ) ? self::editor_preview_decision( $source_bytes, self::get_analysis_meta( $asset_id ) ) : [ 'shouldPreview' => false ];
		$preview_in_sequence = ! empty( $high_options['familySequence'] ) && ! empty( $preview_decision['shouldPreview'] );
		$preview_percent = in_array( $preview_status, [ 'ready', 'failed', 'cancelled' ], true ) ? 100 : 0;
		$ordered_stages = [
			'web-high' => $profiles['high']['status'],
		];
		if ( $preview_in_sequence ) {
			$ordered_stages[ self::EDITOR_PREVIEW_PROFILE ] = 'waiting-high' === $preview_status ? 'queued' : $preview_status;
		}
		$ordered_stages['web-medium'] = $profiles['medium']['status'];
		$ordered_stages['web-low'] = $profiles['low']['status'];
		$active_profile = '';
		$active_message = '';
		foreach ( $ordered_stages as $stage => $status ) {
			if ( in_array( $status, [ 'running', 'queued' ], true ) ) {
				$active_profile = $stage;
				$active_message = self::EDITOR_PREVIEW_PROFILE === $stage
					? (string) ( $preview_record['message'] ?? '' )
					: (string) ( $profiles[ str_replace( 'web-', '', $stage ) ]['message'] ?? '' );
				break;
			}
		}
		$statuses = array_values( $ordered_stages );
		$family_status = 3 === $ready_profiles
			? 'ready'
			: ( in_array( 'running', $statuses, true ) ? 'running' : ( in_array( 'queued', $statuses, true ) ? 'queued' : ( in_array( 'failed', $statuses, true ) ? 'failed' : 'none' ) ) );
		$family_stage_count = count( self::WEB_FAMILY_PROFILES ) + ( $preview_in_sequence ? 1 : 0 );
		$family_percent = $profile_percent_total + ( $preview_in_sequence ? $preview_percent : 0 );
		return [
			'status'          => $high['status'],
			'profile'         => 'web-high',
			'percent'         => $high['percent'],
			'message'         => (string) ( $high['message'] ?: ( 'ready' === $high['status'] ? 'Web High derivative is ready.' : '' ) ),
			'sourceBytes'     => $source_bytes,
			'derivativeBytes' => $high['derivativeBytes'],
			'reductionPercent' => $high['reductionPercent'],
			'canRetry'        => $high['canRetry'],
			'familyStatus'    => $family_status,
			'familyPercent'   => (int) round( $family_percent / $family_stage_count ),
			'activeProfile'   => $active_profile,
			'activeMessage'   => $active_message,
			'readyProfiles'   => $ready_profiles,
			'totalProfiles'   => count( self::WEB_FAMILY_PROFILES ),
			'profiles'        => $profiles,
			'editorPreview'   => [
				'status'           => $preview_status,
				'percent'          => $preview_percent,
				'message'          => (string) ( $preview_record['message'] ?? '' ),
				'derivativeBytes'  => absint( $preview_record['derivativeSizeBytes'] ?? 0 ),
				'reductionPercent' => is_numeric( $preview_record['reductionPercent'] ?? null ) ? (float) $preview_record['reductionPercent'] : 0.0,
				'canRetry'         => 'failed' === $preview_status,
			],
		];
	}

	public function process_desktop_profile_job( int $asset_id, string $profile, int $protect_geometry = 0, int $texture_max_size = 0, string $job_key = '', int $source_generation = 0 ): void {
		$asset_id = absint( $asset_id );
		$profile = sanitize_key( $profile );
		$job_key = sanitize_key( $job_key );
		$source_generation = absint( $source_generation );
		if ( $asset_id <= 0 || 'vrodos_asset3d' !== get_post_type( $asset_id ) || ! in_array( $profile, self::WEB_FAMILY_PROFILES, true ) || '' === $job_key ) {
			return;
		}

		$source = self::get_source_glb( $asset_id );
		if ( is_wp_error( $source ) || ! self::source_identity_matches( $asset_id, (string) ( $source['sha256'] ?? '' ), $source_generation ) ) {
			return;
		}
		$record = self::desktop_profile_record_by_job_key( $asset_id, $job_key );
		$options = array_merge(
			[
				'protectGeometry' => 1 === $protect_geometry,
				'textureMaxSize'  => absint( $texture_max_size ),
				'pipelineVersion' => self::DESKTOP_PROFILE_PIPELINE_VERSION,
				'recipe'          => $profile,
			],
			(array) ( $record['profileOptions'] ?? [] ),
			[
				'jobKey'          => $job_key,
				'sourceSha256'    => (string) $source['sha256'],
				'sourceGeneration' => $source_generation,
				'queuedAt'        => (string) ( $record['queuedAt'] ?? '' ),
			]
		);
		if ( ! self::desktop_profile_record_matches_request( $record, $source, $options ) ) {
			return;
		}

		$lease_token = self::acquire_optimizer_lease( 'web:' . $asset_id . ':' . $job_key, 1800 );
		if ( '' === $lease_token ) {
			$schedule_result = self::schedule_desktop_profile_job( $asset_id, $profile, $options, 30 );
			if ( is_wp_error( $schedule_result ) ) {
				self::store_desktop_profile_failure( $asset_id, $profile, $source, $schedule_result->get_error_message(), $options );
				self::log_desktop_profile_schedule_failure( $asset_id, $profile, $schedule_result );
			}
			return;
		}

		try {
			self::store_desktop_profile_status( $asset_id, $profile, $source, $options, 'running', 'Generating web derivative.' );
			$result = $this->generate_derivative( $asset_id, $source, $profile, $options );
			if ( is_wp_error( $result ) ) {
				self::store_desktop_profile_failure( $asset_id, $profile, $source, $result->get_error_message(), $options );
				if ( 'web-high' === $profile ) {
					self::continue_web_family( $asset_id, $profile, $source, $options );
				}
				self::delete_prepared_baseline( $asset_id, $source );
				return;
			}
			$this->store_derivative_record( $asset_id, $result );
			self::continue_web_family( $asset_id, $profile, $source, $options );
		} catch ( Throwable $error ) {
			if ( self::source_identity_matches( $asset_id, (string) $source['sha256'], $source_generation ) ) {
				self::store_desktop_profile_failure( $asset_id, $profile, $source, $error->getMessage(), $options );
			}
			self::delete_prepared_baseline( $asset_id, $source );
		} finally {
			self::delete_desktop_profile_progress_file( $asset_id, $profile, $source, $options );
			if ( 'web-low' === $profile ) {
				self::delete_prepared_baseline( $asset_id, $source );
			}
			self::release_optimizer_lease( $lease_token );
		}
	}

	public static function runtime_profile_derivative_path( int $asset_id, string $profile, array $options = [] ): string {
		$profile = sanitize_key( $profile );
		$source = self::get_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			return '';
		}
		$record = $options
			? self::desktop_profile_record( $asset_id, $profile, $source, $options )
			: self::desktop_profile_record( $asset_id, $profile );
		if ( $options && empty( $options['protectGeometry'] ) && ! self::desktop_profile_record_is_ready( $record, $source, $profile, $options ) ) {
			$protected_options = array_merge( $options, [ 'protectGeometry' => true ] );
			$protected_record = self::desktop_profile_record( $asset_id, $profile, $source, $protected_options );
			if ( self::desktop_profile_record_is_ready( $protected_record, $source, $profile, $protected_options ) ) {
				$record = $protected_record;
				$options = $protected_options;
			}
		}
		if ( ! $options ) {
			$options = is_array( $record['profileOptions'] ?? null ) ? $record['profileOptions'] : [];
		}
		return self::desktop_profile_record_is_ready( $record, $source, $profile, $options )
			? (string) ( $record['path'] ?? '' )
			: '';
	}

	public static function desktop_profile_derivative_info( int $asset_id, string $slot ): array {
		$profile = 'custom' === $slot ? 'web-high' : 'web-' . sanitize_key( $slot );
		$record = self::desktop_profile_record( $asset_id, $profile );
		return [
			'estimatedTextureMemoryBytes' => absint( $record['estimatedTextureMemoryBytes'] ?? 0 ),
			'derivativeSizeBytes'         => absint( $record['derivativeSizeBytes'] ?? 0 ),
			'textureMaxSize'              => absint( $record['profileOptions']['textureMaxSize'] ?? 0 ),
			'geometryProtected'           => ! empty( $record['profileOptions']['effectiveProtectGeometry'] ) || ! empty( $record['profileOptions']['protectGeometry'] ),
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

	private static function desktop_profile_record( int $asset_id, string $profile, array $source = [], array $options = [] ): array {
		$meta = self::get_derivative_meta( $asset_id );
		if ( $source && $options ) {
			$job_key = self::desktop_profile_job_key( $source, $profile, $options );
			$record = $meta['webVariants'][ $job_key ] ?? [];
			return is_array( $record ) ? $record : [];
		}
		$default_key = sanitize_key( (string) ( $meta['webProfileDefaults'][ $profile ] ?? '' ) );
		if ( '' !== $default_key && is_array( $meta['webVariants'][ $default_key ] ?? null ) ) {
			return $meta['webVariants'][ $default_key ];
		}
		$record = $meta['derivatives'][ $profile ] ?? [];
		return is_array( $record ) ? $record : [];
	}

	private static function desktop_profile_record_by_job_key( int $asset_id, string $job_key ): array {
		$meta = self::get_derivative_meta( $asset_id );
		$record = $meta['webVariants'][ sanitize_key( $job_key ) ] ?? [];
		return is_array( $record ) ? $record : [];
	}

	private static function normalize_desktop_profile_options( string $profile, array $options ): array {
		return [
			'protectGeometry' => 'web-high' === $profile || ! empty( $options['protectGeometry'] ),
			'textureMaxSize'  => max( self::DESKTOP_PROFILE_MIN_TEXTURE_SIZE, absint( $options['textureMaxSize'] ?? self::runtime_derivative_texture_cap( $profile ) ) ),
			'pipelineVersion' => self::DESKTOP_PROFILE_PIPELINE_VERSION,
			'recipe'          => sanitize_key( (string) ( $options['recipe'] ?? $profile ) ),
		];
	}

	private static function desktop_profile_job_key( array $source, string $profile, array $options ): string {
		$identity = self::normalize_desktop_profile_options( $profile, $options );
		$identity['sourceSha256'] = strtolower( (string) ( $source['sha256'] ?? '' ) );
		return hash( 'sha256', wp_json_encode( $identity ) );
	}

	private static function desktop_profile_record_is_ready( array $record, array $source, string $profile, array $options ): bool {
		if (
			! self::desktop_profile_record_matches_request( $record, $source, $options )
			|| empty( $record['runtimeSubstitutionReady'] )
			|| empty( $record['path'] )
			|| ! is_file( (string) $record['path'] )
		) {
			return false;
		}
		$extensions = array_map( 'strval', (array) ( $record['extensions'] ?? [] ) );
		if ( ! in_array( 'KHR_draco_mesh_compression', $extensions, true ) ) {
			return false;
		}
		return 0 === absint( $record['textureImageCount'] ?? 0 ) || in_array( 'KHR_texture_basisu', $extensions, true );
	}

	private static function desktop_profile_record_matches_request( array $record, array $source, array $options ): bool {
		$record_options = (array) ( $record['profileOptions'] ?? [] );
		$normalized = self::normalize_desktop_profile_options( sanitize_key( (string) ( $options['recipe'] ?? '' ) ), $options );
		$job_key = self::desktop_profile_job_key( $source, sanitize_key( (string) ( $options['recipe'] ?? '' ) ), $options );
		return '' !== (string) ( $source['sha256'] ?? '' )
			&& hash_equals( (string) ( $record['sourceSha256'] ?? '' ), (string) $source['sha256'] )
			&& hash_equals( (string) ( $record['jobKey'] ?? '' ), $job_key )
			&& (int) ( $record_options['pipelineVersion'] ?? 0 ) === self::DESKTOP_PROFILE_PIPELINE_VERSION
			&& sanitize_key( (string) ( $record_options['recipe'] ?? '' ) ) === $normalized['recipe']
			&& (bool) ( $record_options['protectGeometry'] ?? false ) === $normalized['protectGeometry']
			&& absint( $record_options['textureMaxSize'] ?? 0 ) === $normalized['textureMaxSize'];
	}

	private static function desktop_profile_progress_item(
		int $asset_id,
		string $slot,
		string $profile,
		array $record,
		array $source,
		array $options,
		string $status,
		string $message
	): array {
		$total_steps = self::desktop_profile_total_steps( $profile, $options );
		$step = 0;
		$percent = 0;
		$updated_at = sanitize_text_field( (string) ( $record['updatedAt'] ?? $record['generatedAt'] ?? '' ) );

		if ( 'ready' === $status ) {
			$step = $total_steps;
			$percent = 100;
		} elseif ( is_array( $source ) && 'running' === $status ) {
			$progress = self::read_desktop_profile_progress_file( $asset_id, $profile, $source, $options );
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

	private static function desktop_profile_family_progress_item(
		int $asset_id,
		string $slot,
		string $profile,
		array $record,
		array $source,
		array $options,
		array $family_state
	): array {
		$family_status = sanitize_key( (string) ( $family_state['familyStatus'] ?? 'queued' ) );
		$status = in_array( $family_status, [ 'queued', 'running' ], true ) ? $family_status : 'queued';
		$item = self::desktop_profile_progress_item( $asset_id, $slot, $profile, $record, $source, $options, $status, '' );
		$item['step'] = 0;
		$item['totalSteps'] = 0;
		$item['percent'] = max( 0, min( 99, absint( $family_state['familyPercent'] ?? 0 ) ) );
		return $item;
	}

	private static function desktop_profile_total_steps( string $profile, array $options ): int {
		return 'web-high' === $profile || ! empty( $options['protectGeometry'] ) ? 9 : 11;
	}

	private static function desktop_profile_overall_percent( array $profiles, int $total ): int {
		if ( $total <= 0 ) {
			return 100;
		}
		$sum = array_sum( array_map( static fn( array $profile ): int => absint( $profile['percent'] ?? 0 ), $profiles ) );
		return max( 0, min( 100, (int) round( $sum / $total ) ) );
	}

	private static function read_desktop_profile_progress_file( int $asset_id, string $profile, array $source, array $options = [] ): array {
		try {
			$job_key = (string) ( $options['jobKey'] ?? self::desktop_profile_job_key( $source, $profile, $options ) );
			$paths = self::build_derivative_paths( $asset_id, $source, $profile, $job_key );
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
			|| ( '' !== $job_key && $job_key !== sanitize_key( (string) ( $progress['jobKey'] ?? '' ) ) )
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

	private static function delete_desktop_profile_progress_file( int $asset_id, string $profile, array $source, array $options = [] ): void {
		try {
			$job_key = (string) ( $options['jobKey'] ?? self::desktop_profile_job_key( $source, $profile, $options ) );
			$paths = self::build_derivative_paths( $asset_id, $source, $profile, $job_key );
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

	public static function ensure_derivative( int $asset_id, string $profile, array $source = [], array $options = [], bool $regenerate = false ) {
		$profile = sanitize_key( $profile );
		if ( ! in_array( $profile, self::WEB_FAMILY_PROFILES, true ) ) {
			return new WP_Error( 'vrodos_web_profile_invalid', 'Unknown web derivative profile.' );
		}
		if ( ! $source ) {
			$source = self::get_source_glb( $asset_id );
		}
		if ( is_wp_error( $source ) ) {
			return $source;
		}
		self::ensure_current_derivative_schema( $asset_id );
		$identity_options = self::normalize_desktop_profile_options( $profile, $options );
		$options = array_merge( $options, $identity_options );
		$options['sourceSha256'] = (string) ( $source['sha256'] ?? '' );
		$options['sourceGeneration'] = absint( $source['generation'] ?? 0 );
		$options['jobKey'] = self::desktop_profile_job_key( $source, $profile, $options );
		self::cleanup_stale_prepared_baseline( $asset_id, $source );
		$record = self::desktop_profile_record_by_job_key( $asset_id, $options['jobKey'] );
		$status = (string) ( $record['status'] ?? '' );
		$matches_request = self::desktop_profile_record_matches_request( $record, $source, $options );
		$work_generation_matches = absint( $record['sourceGeneration'] ?? 0 ) === absint( $source['generation'] ?? 0 );
		if ( 'build' === self::optimizer_queue_priority( (string) ( $record['profileOptions']['queuePriority'] ?? '' ), (string) ( $options['queuePriority'] ?? '' ) ) ) {
			$options['queuePriority'] = 'build';
		}
		if ( ! $regenerate && $matches_request && self::desktop_profile_record_is_ready( $record, $source, $profile, $options ) ) {
			self::activate_desktop_profile_variant( $asset_id, $profile, (string) $record['jobKey'] );
			if ( ! empty( $options['familySequence'] ) ) {
				self::merge_desktop_profile_orchestration_options( $asset_id, $options );
				self::continue_web_family( $asset_id, $profile, $source, $options );
			}
			return true;
		}
		if ( ! $regenerate && 'failed' === $status && $matches_request ) {
			self::merge_desktop_profile_orchestration_options( $asset_id, $options );
			return new WP_Error( 'vrodos_web_derivative_failed', (string) ( $record['message'] ?? 'Derivative generation failed. Use Regenerate to retry.' ) );
		}

		if ( ! $regenerate && 'queued' === $status && $matches_request && $work_generation_matches ) {
			$had_scheduled_event = false !== wp_next_scheduled(
				self::DESKTOP_PROFILE_CRON_HOOK,
				self::desktop_profile_cron_args( $asset_id, $profile, $options )
			);
			self::merge_desktop_profile_orchestration_options( $asset_id, $options );
			$schedule_result = self::schedule_desktop_profile_job( $asset_id, $profile, $options );
			if ( is_wp_error( $schedule_result ) ) {
				self::store_desktop_profile_failure( $asset_id, $profile, $source, $schedule_result->get_error_message(), $options );
				self::log_desktop_profile_schedule_failure( $asset_id, $profile, $schedule_result );
				return $schedule_result;
			}
			if ( ! $had_scheduled_event ) {
				error_log( sprintf( '[VRodos] Recovered missing desktop profile cron job for asset #%d (%s).', $asset_id, $profile ) );
			}
			return true;
		}

		if ( ! $regenerate && 'running' === $status && $matches_request && $work_generation_matches ) {
			self::merge_desktop_profile_orchestration_options( $asset_id, $options );
			if ( ! self::desktop_profile_job_is_stale( $asset_id, $profile, $record, $source, $options ) ) {
				return true;
			}
			self::delete_desktop_profile_progress_file( $asset_id, $profile, $source, $options );
			self::store_desktop_profile_status( $asset_id, $profile, $source, $options, 'queued', 'A stale desktop profile job was queued again.' );
			error_log( sprintf( '[VRodos] Requeued stale desktop profile job for asset #%d (%s) after %d seconds without progress.', $asset_id, $profile, self::DESKTOP_PROFILE_STALE_SECONDS ) );
			$schedule_result = self::schedule_desktop_profile_job( $asset_id, $profile, $options );
			if ( is_wp_error( $schedule_result ) ) {
				self::store_desktop_profile_failure( $asset_id, $profile, $source, $schedule_result->get_error_message(), $options );
				self::log_desktop_profile_schedule_failure( $asset_id, $profile, $schedule_result );
				return $schedule_result;
			}
			return true;
		}
		self::delete_desktop_profile_progress_file( $asset_id, $profile, $source, $options );
		self::store_desktop_profile_status( $asset_id, $profile, $source, $options, 'queued', 'Web derivative is queued.' );
		$schedule_result = self::schedule_desktop_profile_job( $asset_id, $profile, $options );
		if ( is_wp_error( $schedule_result ) ) {
			self::store_desktop_profile_failure( $asset_id, $profile, $source, $schedule_result->get_error_message(), $options );
			self::log_desktop_profile_schedule_failure( $asset_id, $profile, $schedule_result );
			return $schedule_result;
		}
		return true;
	}

	private static function desktop_profile_job_is_stale( int $asset_id, string $profile, array $record, array $source, array $options ): bool {
		$latest_activity = strtotime( (string) ( $record['updatedAt'] ?? '' ) . ' UTC' );
		$latest_activity = false === $latest_activity ? 0 : $latest_activity;
		$progress = self::read_desktop_profile_progress_file( $asset_id, $profile, $source, $options );
		if ( $progress ) {
			$progress_updated_at = strtotime( (string) ( $progress['updatedAt'] ?? '' ) . ' UTC' );
			if ( false !== $progress_updated_at ) {
				$latest_activity = max( $latest_activity, $progress_updated_at );
			}
		}

		return $latest_activity <= 0 || time() - $latest_activity >= self::DESKTOP_PROFILE_STALE_SECONDS;
	}

	private static function desktop_profile_cron_args( int $asset_id, string $profile, array $options ): array {
		return [
			$asset_id,
			$profile,
			! empty( $options['protectGeometry'] ) ? 1 : 0,
			absint( $options['textureMaxSize'] ?? 0 ),
			sanitize_key( (string) ( $options['jobKey'] ?? '' ) ),
			absint( $options['sourceGeneration'] ?? 0 ),
		];
	}

	private static function schedule_desktop_profile_job( int $asset_id, string $profile, array $options, int $delay = 2 ) {
		$args = self::desktop_profile_cron_args( $asset_id, $profile, $options );
		return self::schedule_optimizer_event(
			self::DESKTOP_PROFILE_CRON_HOOK,
			$args,
			$delay,
			(string) ( $options['queuePriority'] ?? 'normal' )
		);
	}

	private static function log_desktop_profile_schedule_failure( int $asset_id, string $profile, WP_Error $error ): void {
		error_log( sprintf( '[VRodos] Failed to schedule desktop profile job for asset #%d (%s): %s', $asset_id, $profile, $error->get_error_message() ) );
	}

	private static function store_desktop_profile_status( int $asset_id, string $profile, array $source, array $options, string $status, string $message ): void {
		$meta = self::get_derivative_meta( $asset_id );
		$job_key = sanitize_key( (string) ( $options['jobKey'] ?? self::desktop_profile_job_key( $source, $profile, $options ) ) );
		$options['jobKey'] = $job_key;
		$options['sourceSha256'] = (string) ( $source['sha256'] ?? '' );
		$options['sourceGeneration'] = absint( $source['generation'] ?? 0 );
		$existing = is_array( $meta['webVariants'][ $job_key ] ?? null ) ? $meta['webVariants'][ $job_key ] : [];
		$paths = self::build_derivative_paths( $asset_id, $source, $profile, $job_key );
		$stored = array_merge(
			$existing,
			[
				'profile'        => $profile,
				'jobKey'         => $job_key,
				'status'         => $status,
				'message'        => wp_strip_all_tags( $message ),
				'sourceUrl'      => esc_url_raw( (string) $source['url'] ),
				'sourcePath'     => wp_normalize_path( (string) $source['path'] ),
				'sourceSha256'   => (string) ( $source['sha256'] ?? '' ),
				'sourceGeneration' => absint( $source['generation'] ?? 0 ),
				'profileOptions' => $options,
				'cronArgs'       => self::desktop_profile_cron_args( $asset_id, $profile, $options ),
				'progressPath'   => wp_normalize_path( (string) $paths['progress'] ),
				'attempts'       => absint( $existing['attempts'] ?? 0 ) + ( 'queued' === $status && 'queued' !== (string) ( $existing['status'] ?? '' ) ? 1 : 0 ),
				'updatedAt'      => current_time( 'mysql', true ),
			]
		);
		if ( 'queued' === $status && empty( $stored['queuedAt'] ) ) {
			$stored['queuedAt'] = gmdate( DATE_ATOM );
		}
		if ( 'failed' !== $status ) {
			unset( $stored['failedAt'] );
		}
		$meta['webVariants'][ $job_key ] = $stored;
		if ( absint( $options['textureMaxSize'] ?? 0 ) === self::runtime_derivative_texture_cap( $profile ) ) {
			$meta['webProfileDefaults'][ $profile ] = $job_key;
			$meta['derivatives'][ $profile ] = $stored;
		}
		update_post_meta( $asset_id, self::META_KEY, $meta );
	}

	private static function store_desktop_profile_failure( int $asset_id, string $profile, array $source, string $message, array $options ): void {
		self::store_desktop_profile_status( $asset_id, $profile, $source, $options, 'failed', $message );
		$meta = self::get_derivative_meta( $asset_id );
		$job_key = sanitize_key( (string) ( $options['jobKey'] ?? '' ) );
		$meta['webVariants'][ $job_key ]['failedAt'] = time();
		if ( (string) ( $meta['webProfileDefaults'][ $profile ] ?? '' ) === $job_key ) {
			$meta['derivatives'][ $profile ] = $meta['webVariants'][ $job_key ];
		}
		update_post_meta( $asset_id, self::META_KEY, $meta );
	}

	private static function merge_desktop_profile_orchestration_options( int $asset_id, array $options ): void {
		$job_key = sanitize_key( (string) ( $options['jobKey'] ?? '' ) );
		if ( '' === $job_key ) {
			return;
		}
		$meta = self::get_derivative_meta( $asset_id );
		if ( ! is_array( $meta['webVariants'][ $job_key ] ?? null ) ) {
			return;
		}
		foreach ( [ 'familySequence', 'writePreparedBaseline' ] as $key ) {
			if ( ! empty( $options[ $key ] ) ) {
				$meta['webVariants'][ $job_key ]['profileOptions'][ $key ] = true;
			}
		}
		if ( 'build' === self::normalize_optimizer_queue_priority( (string) ( $options['queuePriority'] ?? '' ) ) ) {
			$meta['webVariants'][ $job_key ]['profileOptions']['queuePriority'] = 'build';
		}
		update_post_meta( $asset_id, self::META_KEY, $meta );
	}

	private static function activate_desktop_profile_variant( int $asset_id, string $profile, string $job_key ): void {
		$meta = self::get_derivative_meta( $asset_id );
		$record = $meta['webVariants'][ $job_key ] ?? null;
		if (
			! is_array( $record )
			|| 'ready' !== (string) ( $record['status'] ?? '' )
			|| absint( $record['profileOptions']['textureMaxSize'] ?? 0 ) !== self::runtime_derivative_texture_cap( $profile )
		) {
			return;
		}
		$meta['webProfileDefaults'][ $profile ] = $job_key;
		$meta['derivatives'][ $profile ] = $record;
		update_post_meta( $asset_id, self::META_KEY, $meta );
	}

	private static function continue_web_family( int $asset_id, string $profile, array $source, array $options ): void {
		if ( empty( $options['familySequence'] ) || ! self::source_identity_matches( $asset_id, (string) ( $source['sha256'] ?? '' ), absint( $source['generation'] ?? 0 ) ) ) {
			return;
		}
		if ( 'web-high' === $profile ) {
			$analysis = self::get_analysis_meta( $asset_id );
			if ( self::analysis_needs_refresh( $analysis, $source ) ) {
				$analysis = self::refresh_asset_analysis( $asset_id );
			}
			$analysis = is_array( $analysis ) ? $analysis : [];
			$decision = self::editor_preview_decision( (int) ( $source['sizeBytes'] ?? 0 ), $analysis );
			if ( ! empty( $decision['shouldPreview'] ) ) {
				$preview_record = self::get_editor_preview_record( $asset_id );
				$preview_status = (string) ( $preview_record['status'] ?? '' );
				$preview_ready = 'ready' === $preview_status && self::editor_preview_record_is_ready( $preview_record, $source );
				if ( ! $preview_ready && 'failed' !== $preview_status ) {
					self::maybe_queue_editor_preview( $asset_id, $source, $analysis, $decision, (string) ( $options['queuePriority'] ?? 'normal' ) );
					return;
				}
			}
			self::continue_web_family_after_editor_preview( $asset_id, $source );
			return;
		}
		$next_profile = match ( $profile ) {
			'web-medium' => 'web-low',
			default      => '',
		};
		if ( '' === $next_profile ) {
			return;
		}
		$next_options = [
			'protectGeometry' => self::automatic_profile_protects_geometry( $asset_id ),
			'textureMaxSize'  => self::runtime_derivative_texture_cap( $next_profile ),
			'pipelineVersion' => self::DESKTOP_PROFILE_PIPELINE_VERSION,
			'recipe'          => $next_profile,
			'familySequence'  => true,
		];
		if ( 'build' === self::normalize_optimizer_queue_priority( (string) ( $options['queuePriority'] ?? '' ) ) ) {
			$next_options['queuePriority'] = 'build';
		}
		$result = self::ensure_derivative( $asset_id, $next_profile, $source, $next_options );
		if ( is_wp_error( $result ) ) {
			error_log( sprintf( '[VRodos] Failed to continue web derivative family for asset #%d (%s): %s', $asset_id, $next_profile, $result->get_error_message() ) );
		}
	}

	private static function continue_web_family_after_editor_preview( int $asset_id, array $source ): void {
		$high_record = self::desktop_profile_record( $asset_id, 'web-high' );
		$high_options = is_array( $high_record['profileOptions'] ?? null ) ? $high_record['profileOptions'] : [];
		if (
			empty( $high_options['familySequence'] )
			|| ! self::desktop_profile_record_is_ready( $high_record, $source, 'web-high', $high_options )
			|| ! self::source_identity_matches( $asset_id, (string) ( $source['sha256'] ?? '' ), absint( $source['generation'] ?? 0 ) )
		) {
			return;
		}
		$next_options = [
			'protectGeometry' => self::automatic_profile_protects_geometry( $asset_id ),
			'textureMaxSize'  => self::runtime_derivative_texture_cap( 'web-medium' ),
			'pipelineVersion' => self::DESKTOP_PROFILE_PIPELINE_VERSION,
			'recipe'          => 'web-medium',
			'familySequence'  => true,
		];
		if ( 'build' === self::normalize_optimizer_queue_priority( (string) ( $high_options['queuePriority'] ?? '' ) ) ) {
			$next_options['queuePriority'] = 'build';
		}
		$result = self::ensure_derivative( $asset_id, 'web-medium', $source, $next_options );
		if ( is_wp_error( $result ) ) {
			error_log( sprintf( '[VRodos] Failed to continue web derivative family for asset #%d (web-medium): %s', $asset_id, $result->get_error_message() ) );
		}
	}

	private static function automatic_profile_protects_geometry( int $asset_id ): bool {
		$terms = wp_get_post_terms( $asset_id, 'vrodos_asset3d_cat', [ 'fields' => 'slugs' ] );
		if ( is_wp_error( $terms ) ) {
			return true;
		}
		$slugs = array_map( 'sanitize_title', (array) $terms );
		return ! empty( array_intersect( [ 'walkable-surface', 'collision-proxy' ], $slugs ) );
	}

	private static function delete_prepared_baseline( int $asset_id, array $source ): void {
		try {
			$paths = self::build_derivative_paths( $asset_id, $source, 'web-low', 'cleanup' );
		} catch ( Throwable $error ) {
			return;
		}
		foreach ( [ 'preparedBaseline', 'preparedAnalysis' ] as $key ) {
			$path = (string) ( $paths[ $key ] ?? '' );
			if ( '' !== $path && is_file( $path ) ) {
				wp_delete_file( $path );
			}
		}
	}

	private static function cleanup_stale_prepared_baseline( int $asset_id, array $source ): void {
		try {
			$paths = self::build_derivative_paths( $asset_id, $source, 'web-low', 'cleanup' );
		} catch ( Throwable $error ) {
			return;
		}
		$baseline = (string) ( $paths['preparedBaseline'] ?? '' );
		if ( '' !== $baseline && is_file( $baseline ) && (int) filemtime( $baseline ) < time() - 86400 ) {
			self::delete_prepared_baseline( $asset_id, $source );
		}
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
					'recipe'          => 'web-' . $slot,
				];
				$queue_result = self::ensure_derivative( $largest_asset_id, 'web-' . $slot, $source, $options );
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
