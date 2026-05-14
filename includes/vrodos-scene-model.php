<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Scene Model Class
 *
 * Represents a 3D scene with metadata and objects.
 * Uses typed properties for PHP 8.3+ type safety.
 */
class Vrodos_Scene_Model {

	/**
	 * Scene metadata.
	 */
	public ?object $metadata = null;

	/**
	 * Scene objects.
	 */
	public ?object $objects = null;

	/**
	 * Constructor.
	 *
	 * @param string|null $json_string The JSON string to parse.
	 */
	public function __construct( ?string $json_string = null ) {
		if ( $json_string ) {
			$this->from_json( $json_string );
		}
	}

	/**
	 * Populate the model from a JSON string.
	 *
	 * @param string $json_string The JSON string to parse.
	 */
	public function from_json( string $json_string ): void {
		$data = json_decode( $json_string );

		if ( json_last_error() === JSON_ERROR_NONE ) {
			$this->metadata = $data->metadata ?? null;
			$this->objects  = $data->objects ?? null;
			$this->normalize_objects();
		}
	}

	/**
	 * Serialize the model to a JSON string.
	 *
	 * @return string The JSON representation of the model.
	 */
	public function to_json(): string {
		return json_encode( $this, JSON_PRETTY_PRINT );
	}

	private function normalize_objects(): void {
		if ( ! is_object( $this->objects ) ) {
			return;
		}

		$normalized       = [];
		$assessment_index = [];

		foreach ( get_object_vars( $this->objects ) as $name => $object ) {
			if ( ! is_object( $object ) ) {
				$normalized[ $name ] = $object;
				continue;
			}

			if ( ! $this->is_assessment_object( $object ) ) {
				$normalized[ $name ] = $object;
				continue;
			}

			if ( ! $this->has_complete_assessment_metadata( $object ) ) {
				continue;
			}

			$duplicate_key = $this->assessment_duplicate_key( $object );
			if ( $duplicate_key === '' ) {
				$normalized[ $name ] = $object;
				continue;
			}

			if ( isset( $assessment_index[ $duplicate_key ] ) ) {
				$existing_name  = $assessment_index[ $duplicate_key ];
				$existing_score = is_object( $normalized[ $existing_name ] ?? null )
					? $this->assessment_metadata_score( $normalized[ $existing_name ] )
					: 0;
				$current_score = $this->assessment_metadata_score( $object );

				if ( $current_score > $existing_score ) {
					unset( $normalized[ $existing_name ] );
					$normalized[ $name ]                 = $object;
					$assessment_index[ $duplicate_key ] = $name;
				}

				continue;
			}

			$normalized[ $name ]                 = $object;
			$assessment_index[ $duplicate_key ] = $name;
		}

		$this->objects = (object) $normalized;

		if ( is_object( $this->metadata ) ) {
			$this->metadata->objects = count( $normalized );
		}
	}

	private function is_assessment_object( object $object ): bool {
		$category_slug = strtolower( trim( (string) ( $object->category_slug ?? '' ) ) );
		$category_name = strtolower( trim( (string) ( $object->category_name ?? '' ) ) );

		return $category_slug === 'assessment' || $category_name === 'assessment';
	}

	private function has_complete_assessment_metadata( object $object ): bool {
		$type   = $this->first_non_empty_string( $object, [ 'assessment_type', 'assessment_group' ] );
		$levels = $this->normalize_assessment_levels( $object->assessment_levels ?? '' );

		return $type !== '' && ! empty( $levels );
	}

	private function assessment_duplicate_key( object $object ): string {
		$source = $this->first_non_empty_string( $object, [ 'assessment_source_id', 'asset_id', 'asset_slug' ] );
		return $source !== '' ? 'assessment|' . $source : '';
	}

	private function assessment_metadata_score( object $object ): int {
		return ( $this->first_non_empty_string( $object, [ 'assessment_source_id', 'asset_id' ] ) !== '' ? 4 : 0 )
			+ ( $this->first_non_empty_string( $object, [ 'assessment_type' ] ) !== '' ? 3 : 0 )
			+ ( $this->first_non_empty_string( $object, [ 'assessment_group' ] ) !== '' ? 2 : 0 )
			+ ( ! empty( $this->normalize_assessment_levels( $object->assessment_levels ?? '' ) ) ? 3 : 0 )
			+ ( $this->first_non_empty_string( $object, [ 'assessment_content' ] ) !== '' ? 1 : 0 );
	}

	private function first_non_empty_string( object $object, array $keys ): string {
		foreach ( $keys as $key ) {
			$value = trim( (string) ( $object->{$key} ?? '' ) );
			if ( $value !== '' ) {
				return $value;
			}
		}

		return '';
	}

	private function normalize_assessment_levels( $levels ): array {
		$source = $levels;

		if ( is_string( $source ) && trim( $source ) !== '' ) {
			$decoded_json = json_decode( $source, true );
			if ( is_array( $decoded_json ) ) {
				$source = $decoded_json;
			} else {
				$decoded_base64 = base64_decode( $source, true );
				if ( is_string( $decoded_base64 ) && $decoded_base64 !== '' ) {
					$decoded_base64_json = json_decode( $decoded_base64, true );
					$source              = is_array( $decoded_base64_json ) ? $decoded_base64_json : $source;
				}
			}
		}

		if ( is_string( $source ) ) {
			preg_match_all( '/\b(?:ALL LEVELS|ALL|A1|A2|B1|B2)\b/i', $source, $matches );
			$source = $matches[0] ?? [];
		}

		if ( ! is_array( $source ) ) {
			return [];
		}

		$allowed    = [ 'A1', 'A2', 'B1', 'B2', 'ALL', 'ALL LEVELS' ];
		$normalized = [];

		foreach ( $source as $level ) {
			if ( is_array( $level ) || is_object( $level ) ) {
				continue;
			}

			$level = strtoupper( trim( (string) $level ) );
			if ( $level === '' || ! in_array( $level, $allowed, true ) || in_array( $level, $normalized, true ) ) {
				continue;
			}

			$normalized[] = $level;
		}

		return $normalized;
	}
}
