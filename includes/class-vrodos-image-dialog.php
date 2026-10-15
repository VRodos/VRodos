<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Image dialog defaults are copied once; explicit placement values, including empty text, win. */
final class VRodos_Image_Dialog {
	private const TEXT_META = [
		'poi_img_title'   => 'vrodos_asset3d_poi_imgtxt_title',
		'poi_img_content' => 'vrodos_asset3d_poi_imgtxt_content',
	];

	public static function asset_defaults( int $asset_id ): array {
		$text = [];
		foreach ( self::TEXT_META as $field => $meta_key ) {
			$text[ $field ] = $asset_id > 0 ? (string) get_post_meta( $asset_id, $meta_key, true ) : '';
		}
		return $text;
	}

	public static function resolve_text( array $placement ): array {
		$text = array_intersect_key( $placement, self::TEXT_META );
		return count( $text ) === count( self::TEXT_META )
			? $text : $text + self::asset_defaults( absint( $placement['asset_id'] ?? 0 ) );
	}

	public static function has_content( object $placement ): bool {
		return '' !== trim( (string) ( $placement->poi_img_title ?? '' ) )
			|| '' !== trim( (string) ( $placement->poi_img_content ?? '' ) );
	}
}
