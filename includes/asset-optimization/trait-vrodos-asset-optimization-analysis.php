<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-glb-analysis.php';

trait VRodos_Asset_Optimization_Analysis_Service {
	protected static function get_analysis_meta( int $asset_id ): array {
		$raw = get_post_meta( $asset_id, self::ANALYSIS_META_KEY, true );
		return is_array( $raw ) ? $raw : [];
	}

	protected static function refresh_asset_analysis( int $asset_id ) {
		$source = self::prepare_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			$record = self::build_analysis_error_record( $source->get_error_message() );
			update_post_meta( $asset_id, self::ANALYSIS_META_KEY, $record );
			return $source;
		}

		$analysis = self::build_glb_analysis( $source );
		if ( is_wp_error( $analysis ) ) {
			$record = self::build_analysis_error_record( $analysis->get_error_message(), $source );
			update_post_meta( $asset_id, self::ANALYSIS_META_KEY, $record );
			return $analysis;
		}

		update_post_meta( $asset_id, self::ANALYSIS_META_KEY, $analysis );
		return $analysis;
	}

	protected static function build_analysis_error_record( string $message, ?array $source = null ): array {
		return [
			'schemaVersion'     => 2,
			'status'            => 'unsupported',
			'error'             => wp_strip_all_tags( $message ),
			'sourceUrl'         => isset( $source['url'] ) ? esc_url_raw( (string) $source['url'] ) : '',
			'sourcePath'        => isset( $source['path'] ) ? wp_normalize_path( (string) $source['path'] ) : '',
			'sourceSizeBytes'   => isset( $source['sizeBytes'] ) ? (int) $source['sizeBytes'] : 0,
			'sourceMtime'       => isset( $source['path'] ) && is_file( (string) $source['path'] ) ? (int) filemtime( (string) $source['path'] ) : 0,
			'sourceFingerprint' => isset( $source['path'] ) ? self::source_fingerprint( $source ) : '',
			'flags'             => [],
			'recommendations'   => VRodos_Glb_Analysis::empty_recommendations(),
			'reasons'           => [],
			'suggestedAction'   => 'Unsupported for automatic analysis.',
			'analyzedAt'        => current_time( 'mysql', true ),
		];
	}

	protected static function build_glb_analysis( array $source ) {
		$gltf = VRodos_Glb_Analysis::read_glb_json( (string) $source['path'] );
		if ( is_wp_error( $gltf ) ) {
			return $gltf;
		}

		$analysis = VRodos_Glb_Analysis::analyze_gltf_json( $gltf );
		$analysis['schemaVersion']     = 2;
		$analysis['status']            = 'analyzed';
		$analysis['sourceUrl']         = esc_url_raw( (string) $source['url'] );
		$analysis['sourcePath']        = wp_normalize_path( (string) $source['path'] );
		$analysis['sourceSizeBytes']   = (int) $source['sizeBytes'];
		$analysis['sourceMtime']       = is_file( (string) $source['path'] ) ? (int) filemtime( (string) $source['path'] ) : 0;
		$analysis['sourceFingerprint'] = self::source_fingerprint( $source );
		$analysis['analyzedAt']        = current_time( 'mysql', true );

		$recommendation = VRodos_Glb_Analysis::recommendations_for_analysis( $analysis );
		return array_merge( $analysis, $recommendation );
	}

	protected static function source_fingerprint( array $source ): string {
		$path  = (string) ( $source['path'] ?? '' );
		$mtime = is_file( $path ) ? (int) filemtime( $path ) : 0;
		return sha1(
			implode(
				'|',
				[
					self::normalize_url_path( (string) ( $source['url'] ?? '' ) ),
					wp_normalize_path( $path ),
					(string) ( (int) ( $source['sizeBytes'] ?? 0 ) ),
					(string) $mtime,
				]
			)
		);
	}



	protected static function analysis_needs_refresh( array $analysis, array $source ): bool {
		if ( (int) ( $analysis['schemaVersion'] ?? 0 ) !== 2 || empty( $analysis ) || ( $analysis['sourceFingerprint'] ?? '' ) !== self::source_fingerprint( $source ) ) {
			return true;
		}
		return false;
	}

	protected static function analysis_reason_labels( array $analysis ): array {
		$reasons = $analysis['reasons'] ?? [];
		return is_array( $reasons ) ? array_map( 'strval', $reasons ) : [];
	}

	protected static function analysis_priority_score( array $analysis ): int {
		$size_bytes = (int) ( $analysis['sourceSizeBytes'] ?? 0 );
		$triangles  = (int) ( $analysis['geometry']['estimatedTriangles'] ?? 0 );
		$primitives = (int) ( $analysis['counts']['primitives'] ?? 0 );
		$materials  = (int) ( $analysis['counts']['usedMaterials'] ?? $analysis['counts']['materials'] ?? 0 );
		$image_bytes = (int) ( $analysis['payload']['estimatedImageBytes'] ?? 0 );

		return $size_bytes + ( $triangles * 100 ) + ( $primitives * 100000 ) + ( $materials * 500000 ) + $image_bytes;
	}
}
