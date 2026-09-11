<?php

/** Canonical persisted CEFR level normalization. */
class VRodos_Cefr_Levels {
	public static function normalize( $meta_value ): array {
		$levels = maybe_unserialize( $meta_value );

		if ( is_string( $levels ) && '' !== trim( $levels ) ) {
			$decoded_json = json_decode( $levels, true );
			if ( is_array( $decoded_json ) ) {
				$levels = $decoded_json;
			} else {
				$decoded_base64 = base64_decode( $levels, true );
				if ( is_string( $decoded_base64 ) && '' !== $decoded_base64 ) {
					$decoded_base64_json = json_decode( $decoded_base64, true );
					$levels              = is_array( $decoded_base64_json ) ? $decoded_base64_json : $levels;
				}
			}
		}

		if ( is_string( $levels ) ) {
			preg_match_all( '/\b(?:ALL LEVELS|ALL|A1|A2|B1|B2)\b/i', $levels, $matches );
			$levels = $matches[0] ?? [];
		}

		if ( ! is_array( $levels ) ) {
			return [];
		}

		$cefr_levels = [ 'A1', 'A2', 'B1', 'B2' ];
		$all_markers = [ 'ALL', 'ALL LEVELS' ];
		$normalized = [];
		$has_all    = false;

		foreach ( $levels as $level ) {
			if ( is_array( $level ) || is_object( $level ) ) {
				continue;
			}

			$level = strtoupper( trim( (string) $level ) );
			if ( in_array( $level, $all_markers, true ) ) {
				$has_all = true;
				continue;
			}

			if ( $level === '' || ! in_array( $level, $cefr_levels, true ) || in_array( $level, $normalized, true ) ) {
				continue;
			}

			$normalized[] = $level;
		}

		return $has_all ? $cefr_levels : $normalized;
	}

}
