<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Read-only library readiness and explicit preparation through the shared queue. */
trait VRodos_Asset_Optimization_Readiness {
	protected static function scan_asset_readiness(): array {
		return array_map( self::asset_readiness(...), self::collect_glb_asset_ids() );
	}

	protected static function asset_readiness( int $asset_id ): array {
		$item = [
			'assetId' => $asset_id,
			'title' => get_the_title( $asset_id ) ?: 'Asset #' . $asset_id,
			'status' => 'unsupported',
			'reason' => '',
			'sourceSizeBytes' => 0,
			'profiles' => [],
		];
		$source = self::inspect_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			$item['reason'] = $source->get_error_message();
			return $item;
		}
		$item['sourceSizeBytes'] = (int) $source['sizeBytes'];
		$analysis = self::get_analysis_meta( $asset_id );
		$analysis_current = ! self::analysis_needs_refresh( $analysis, $source ) && 'analyzed' === ( $analysis['status'] ?? '' );
		$statuses = [];
		foreach ( self::WEB_FAMILY_PROFILES as $profile ) {
			$options = self::web_family_profile_options( $asset_id, $profile, $source );
			$record = empty( $source['sha256'] ) ? [] : self::desktop_profile_record( $asset_id, $profile, $source, $options );
			$previous = self::desktop_profile_record( $asset_id, $profile );
			$status = $record['status'] ?? '';
			$matches = self::desktop_profile_record_matches_request( $record, $source, $options );
			$message = '';
			if ( 'ready' === $status && self::desktop_profile_record_is_ready( $record, $source, $profile, $options ) ) {
				$status = 'ready';
			} elseif ( $matches && in_array( $status, [ 'queued', 'running', 'failed' ], true )
				&& absint( $record['sourceGeneration'] ?? 0 ) === absint( $source['generation'] ?? 0 ) ) {
				$message = (string) ( $record['message'] ?? '' );
			} else {
				$status = $record || $previous ? 'outdated' : 'missing';
			}
			$item['profiles'][ $profile ] = [
				'status' => $status,
				'message' => $message,
				'bytes' => 'ready' === $status ? absint( $record['derivativeSizeBytes'] ?? 0 ) : 0,
				'reductionPercent' => 'ready' === $status ? (float) ( $record['reductionPercent'] ?? 0 ) : 0.0,
			];
			$statuses[] = $status;
		}
		$preview = self::get_editor_preview_record( $asset_id );
		$preview_processing = in_array( $preview['status'] ?? '', [ 'queued', 'running' ], true )
			&& ( $preview['sourceFingerprint'] ?? '' ) === self::source_fingerprint( $source );
		if ( in_array( 'running', $statuses, true ) || in_array( 'queued', $statuses, true ) || $preview_processing ) {
			$item['status'] = 'processing';
			$item['reason'] = $preview_processing ? 'Editor preview is processing before the remaining Web profiles.' : 'Preparation is queued or running. View Background Jobs for progress.';
		} elseif ( in_array( 'failed', $statuses, true ) ) {
			$item['status'] = 'failed';
			$errors = [];
			foreach ( $item['profiles'] as $profile => $state ) {
				if ( 'failed' === $state['status'] ) {
					$errors[] = self::readiness_profile_label( $profile ) . ': ' . ( $state['message'] ?: 'Preparation failed.' );
				}
			}
			$item['reason'] = implode( ' ', $errors );
		} elseif ( [ 'ready' ] === array_values( array_unique( $statuses ) ) ) {
			$item['status'] = 'ready';
			$item['reason'] = 'All three Web profiles are validated and ready.';
		} elseif ( [ 'missing' ] === array_values( array_unique( $statuses ) ) && $analysis_current && ! self::automatic_web_optimization_eligible( $source, $analysis ) ) {
			$item['status'] = 'source-ready';
			$item['reason'] = 'Below automatic optimization thresholds. The source GLB remains available; compilation prepares any required profiles.';
		} else {
			$item['status'] = in_array( 'outdated', $statuses, true ) ? 'outdated' : 'missing';
			$item['reason'] = 'outdated' === $item['status'] ? 'Optimized versions need updating for the current source or preparation settings.' : 'One or more Web profiles have not been prepared.';
			if ( ! $analysis_current ) {
				$item['reason'] .= ' Prepare will refresh GLB analysis and check eligibility first.';
			}
		}
		return $item;
	}

	protected static function readiness_profile_label( string $profile ): string {
		return match ( $profile ) {
			'web-high' => 'High',
			'web-medium' => 'Medium',
			'web-low' => 'Low',
		};
	}

	protected static function prepare_asset_web_family( int $asset_id, bool $retry ) {
		$item = self::asset_readiness( $asset_id );
		if ( $retry ? 'failed' !== $item['status'] : ! in_array( $item['status'], [ 'missing', 'outdated' ], true ) ) {
			return false;
		}
		$source = self::prepare_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			return $source;
		}
		$analysis = self::get_analysis_meta( $asset_id );
		if ( self::analysis_needs_refresh( $analysis, $source ) || 'analyzed' !== ( $analysis['status'] ?? '' ) ) {
			$analysis = self::refresh_asset_analysis( $asset_id );
			if ( is_wp_error( $analysis ) ) {
				return $analysis;
			}
		}
		$has_existing_profiles = count( array_filter( $item['profiles'], static fn( array $state ): bool => 'missing' !== $state['status'] ) ) > 0;
		if ( ! $has_existing_profiles && ! self::automatic_web_optimization_eligible( $source, $analysis ) ) {
			return false;
		}
		// Retry the first failed stage; its continuation preserves ready profiles.
		$profile = 'web-high';
		if ( $retry ) {
			foreach ( $item['profiles'] as $name => $state ) {
				if ( 'failed' === $state['status'] ) {
					$profile = $name;
					break;
				}
			}
		}
		return self::ensure_derivative( $asset_id, $profile, $source, self::web_family_profile_options( $asset_id, $profile, $source ), $retry );
	}

	protected static function collect_glb_asset_ids(): array {
		$asset_ids = get_posts( [
			'post_type' => 'vrodos_asset3d',
			'post_status' => 'any',
			'posts_per_page' => -1,
			'fields' => 'ids',
			'orderby' => 'ID',
			'order' => 'ASC',
			'no_found_rows' => true,
		] );
		foreach ( array_chunk( $asset_ids, 200 ) as $batch ) {
			_prime_post_caches( array_map( 'intval', $batch ), false, true );
		}
		return array_values( array_filter( array_map( 'intval', $asset_ids ), self::asset_has_glb_source_reference(...) ) );
	}

	protected static function asset_has_glb_source_reference( int $asset_id ): bool {
		$source_meta = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
		$source_url = VRodos_Core_Manager::resolve_media_meta_url( $source_meta );
		if ( '' !== $source_url && 'glb' === strtolower( pathinfo( (string) wp_parse_url( self::strip_url_query_fragment( $source_url ), PHP_URL_PATH ), PATHINFO_EXTENSION ) ) ) {
			return true;
		}
		if ( is_numeric( $source_meta ) ) {
			$source_path = get_attached_file( (int) $source_meta );
			return is_string( $source_path ) && VRodos_Storage_Manager::is_glb_file( $source_path );
		}
		return false;
	}
}
