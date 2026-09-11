<?php

/** Pure dashboard row aggregation and global sorting before pagination. */
class VRodos_Asset_Optimization_Dashboard_Read_Model {
	public static function collect( array $scan ): array {
		$items = [];

		$mark = static function ( array $source_items, string $key ) use ( &$items ): void {
			foreach ( $source_items as $item ) {
				$asset_id = (int) ( $item['assetId'] ?? 0 );
				if ( $asset_id <= 0 ) {
					continue;
				}
				if ( ! isset( $items[ $asset_id ] ) ) {
					$items[ $asset_id ] = $item;
					$items[ $asset_id ]['dashboardFlags'] = [];
				}
				$items[ $asset_id ]['dashboardFlags'][ $key ] = true;
				$items[ $asset_id ]['recommendationScore'] = max(
					(int) ( $items[ $asset_id ]['recommendationScore'] ?? 0 ),
					(int) ( $item['recommendationScore'] ?? $item['sourceSizeBytes'] ?? 0 )
				);
				foreach ( [ 'analysis', 'recommendationReasons', 'suggestedAction', 'sourceUrl', 'sourceSizeBytes', 'status', 'statusLabel', 'reason' ] as $field ) {
					if ( isset( $item[ $field ] ) && ! isset( $items[ $asset_id ][ $field ] ) ) {
						$items[ $asset_id ][ $field ] = $item[ $field ];
					}
				}
			}
		};

		$mark( $scan['analysisMissing'], 'analysis-missing' );
		$mark( $scan['analysisStale'], 'analysis-stale' );
		$mark( $scan['recommendedGeometry'], 'geometry' );
		$mark( $scan['recommendedTexture'], 'texture' );
		$mark( $scan['recommendedLod'], 'lod' );
		$mark( $scan['stale'], 'stale-derivative' );

		$unsupported = array_filter(
			$scan['unsupported'],
			static fn( array $item ): bool => ( $item['reason'] ?? '' ) !== 'Asset has no GLB source URL.'
		);
		$mark( $unsupported, 'unsupported' );

		$items = array_values( $items );
		usort(
			$items,
			static fn( array $a, array $b ): int => (int) ( $b['recommendationScore'] ?? 0 ) <=> (int) ( $a['recommendationScore'] ?? 0 )
		);

		return $items;
	}


	public static function sort( array $items, string $sort, string $order ): array {
		usort(
			$items,
			static function ( array $a, array $b ) use ( $sort, $order ): int {
				switch ( $sort ) {
					case 'title':
						$result = strcasecmp( (string) ( $a['title'] ?? '' ), (string) ( $b['title'] ?? '' ) );
						break;
					case 'source_size':
						$result = (int) ( $a['sourceSizeBytes'] ?? 0 ) <=> (int) ( $b['sourceSizeBytes'] ?? 0 );
						break;
					case 'id':
						$result = (int) ( $a['assetId'] ?? 0 ) <=> (int) ( $b['assetId'] ?? 0 );
						break;
					case 'priority':
					default:
						$result = (int) ( $a['recommendationScore'] ?? 0 ) <=> (int) ( $b['recommendationScore'] ?? 0 );
						break;
				}

				if ( 0 === $result ) {
					$result = (int) ( $a['assetId'] ?? 0 ) <=> (int) ( $b['assetId'] ?? 0 );
				}

				return 'desc' === $order ? -$result : $result;
			}
		);

		return $items;
	}

}
