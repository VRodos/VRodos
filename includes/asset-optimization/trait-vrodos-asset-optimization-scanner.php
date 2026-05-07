<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_Optimization_Scanner {
	private static function collect_analysis_candidates( string $target ): array {
		$asset_ids = self::collect_glb_asset_ids();

		$candidates = [];
		foreach ( $asset_ids as $asset_id ) {
			$asset_id = (int) $asset_id;
			$source   = self::get_source_glb( $asset_id );
			if ( is_wp_error( $source ) ) {
				continue;
			}

			$analysis = self::get_analysis_meta( $asset_id );
			if ( 'all' !== $target && ! self::analysis_needs_refresh( $analysis, $source ) ) {
				continue;
			}

			$title = get_the_title( $asset_id );
			$candidates[] = [
				'assetId' => $asset_id,
				'title'   => $title ? $title : 'Asset #' . $asset_id,
			];
		}

		return $candidates;
	}

	private static function scan_glb_derivatives( string $profile ): array {
		$asset_ids = self::collect_glb_asset_ids();

		$scan = [
			'profile'               => $profile,
			'totalAssets'           => count( $asset_ids ),
			'localGlbs'             => 0,
			'analysisReady'         => 0,
			'analysisMissing'       => [],
			'analysisStale'         => [],
			'recommended'           => [],
			'recommendedGeometry'   => [],
			'recommendedTexture'    => [],
			'recommendedLod'        => [],
			'lowBenefit'            => [],
			'ready'                 => [],
			'missing'               => [],
			'stale'                 => [],
			'unsupported'           => [],
			'readySavedBytes'       => 0,
			'readySourceBytes'      => 0,
			'readyDerivativeBytes'  => 0,
		];

		foreach ( $asset_ids as $asset_id ) {
			$asset_id = (int) $asset_id;
			$title    = get_the_title( $asset_id );
			$title    = $title ? $title : 'Asset #' . $asset_id;
			$source   = self::get_source_glb( $asset_id );
			$item     = [
				'assetId' => $asset_id,
				'title'   => $title,
			];

			if ( is_wp_error( $source ) ) {
				$item['status'] = 'unsupported';
				$item['reason'] = $source->get_error_message();
				$scan['unsupported'][] = $item;
				continue;
			}

			++$scan['localGlbs'];
			$item['sourceUrl']       = (string) $source['url'];
			$item['sourceSizeBytes'] = (int) $source['sizeBytes'];

			$meta       = self::get_derivative_meta( $asset_id );
			$derivative = $meta['derivatives'][ $profile ] ?? null;
			$derivative_status = 'missing';
			if ( ! is_array( $derivative ) ) {
				$item['status'] = 'missing';
				$item['statusLabel'] = 'Missing derivative';
				$item['reason'] = 'No derivative generated yet.';
				$scan['missing'][] = $item;
			} else {
				$reason = self::derivative_unusable_reason( $derivative, (string) $source['url'] );
				if ( '' !== $reason ) {
					$derivative_status = 'stale';
					$item['status'] = 'stale';
					$item['statusLabel'] = 'Stale derivative';
					$item['reason'] = $reason;
					$scan['stale'][] = $item;
				} else {
					$derivative_status = 'ready';
					$item['status']              = 'ready';
					$item['statusLabel']         = 'Ready derivative';
					$item['derivativeSizeBytes'] = (int) ( $derivative['derivativeSizeBytes'] ?? 0 );
					$item['reductionBytes']      = (int) ( $derivative['reductionBytes'] ?? 0 );
					$item['reductionPercent']    = is_numeric( $derivative['reductionPercent'] ?? null ) ? (float) $derivative['reductionPercent'] : 0.0;
					$scan['readySavedBytes']    += (int) $item['reductionBytes'];
					$scan['readySourceBytes']   += (int) ( $derivative['sourceSizeBytes'] ?? $item['sourceSizeBytes'] );
					$scan['readyDerivativeBytes'] += (int) $item['derivativeSizeBytes'];
					$scan['ready'][]             = $item;
				}
			}

			$analysis = self::get_analysis_meta( $asset_id );
			if ( empty( $analysis ) ) {
				$analysis_item = $item;
				$analysis_item['statusLabel'] = 'Needs analysis';
				$analysis_item['reason'] = 'No saved GLB analysis yet.';
				$scan['analysisMissing'][] = $analysis_item;
				continue;
			}

			if ( self::analysis_needs_refresh( $analysis, $source ) ) {
				$analysis_item = $item;
				$analysis_item['statusLabel'] = 'Stale analysis';
				$analysis_item['reason'] = 'Source GLB changed since the saved analysis.';
				$scan['analysisStale'][] = $analysis_item;
				continue;
			}

			++$scan['analysisReady'];
			$item['analysis'] = $analysis;
			$item['recommendationReasons'] = self::analysis_reason_labels( $analysis );
			$item['suggestedAction'] = (string) ( $analysis['suggestedAction'] ?? '' );
			$item['recommendationScore'] = self::analysis_priority_score( $analysis );

			if ( ! empty( $analysis['recommendations']['geometryDerivative'] ) && 'ready' !== $derivative_status ) {
				$scan['recommendedGeometry'][] = $item;
				$scan['recommended'][] = $item;
			}
			if ( ! empty( $analysis['recommendations']['textureDerivative'] ) ) {
				$scan['recommendedTexture'][] = $item;
			}
			if ( ! empty( $analysis['recommendations']['lodDerivative'] ) ) {
				$scan['recommendedLod'][] = $item;
			}
			if (
				empty( $analysis['recommendations']['geometryDerivative'] )
				&& empty( $analysis['recommendations']['textureDerivative'] )
				&& empty( $analysis['recommendations']['lodDerivative'] )
			) {
				$scan['lowBenefit'][] = $item;
			}
		}

		foreach ( [ 'recommended', 'recommendedGeometry', 'recommendedTexture', 'recommendedLod', 'lowBenefit' ] as $key ) {
			usort(
				$scan[ $key ],
				static fn( array $a, array $b ): int => (int) ( $b['recommendationScore'] ?? 0 ) <=> (int) ( $a['recommendationScore'] ?? 0 )
			);
		}

		return $scan;
	}

	private static function collect_glb_asset_ids(): array {
		$asset_ids = get_posts(
			[
				'post_type'      => 'vrodos_asset3d',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'orderby'        => 'ID',
				'order'          => 'ASC',
				'no_found_rows'  => true,
			]
		);

		return array_values(
			array_filter(
				array_map( 'intval', $asset_ids ),
				static fn( int $asset_id ): bool => self::asset_has_glb_source_reference( $asset_id )
			)
		);
	}

	private static function asset_has_glb_source_reference( int $asset_id ): bool {
		$source_meta = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
		$source_url  = VRodos_Core_Manager::resolve_media_meta_url( $source_meta );

		if ( '' !== $source_url && 'glb' === strtolower( pathinfo( (string) wp_parse_url( self::strip_url_query_fragment( $source_url ), PHP_URL_PATH ), PATHINFO_EXTENSION ) ) ) {
			return true;
		}

		if ( is_numeric( $source_meta ) ) {
			$source_path = get_attached_file( (int) $source_meta );
			return is_string( $source_path ) && 'glb' === strtolower( pathinfo( $source_path, PATHINFO_EXTENSION ) );
		}

		return false;
	}
}
