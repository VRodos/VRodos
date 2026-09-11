<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-runtime-settings-contract.php';
require_once __DIR__ . '/class-vrodos-desktop-performance-profiles.php';

/** Merges editor settings into canonical scene JSON without touching scene objects. */
final class VRodos_Scene_Settings_Merger {
	public static function merge_json( string $scene_json, string $metadata_json ): object {
		$scene = json_decode( $scene_json );
		if ( ! is_object( $scene ) || ! is_object( $scene->metadata ?? null ) || ! self::is_object_map( $scene->objects ?? null ) ) {
			throw new InvalidArgumentException( 'The saved scene JSON is invalid.' );
		}

		$incoming = json_decode( $metadata_json );
		if ( JSON_ERROR_NONE !== json_last_error() || ! is_object( $incoming ) ) {
			throw new InvalidArgumentException( 'Scene settings must be a JSON object.' );
		}
		if ( property_exists( $incoming, 'objects' ) || property_exists( $incoming, 'urlBaseType' ) ) {
			throw new InvalidArgumentException( 'Scene settings must not contain scene objects or URL-base data.' );
		}

		$metadata = $scene->metadata;
		foreach ( VRodos_Runtime_Settings_Contract::settings() as $setting_key => $definition ) {
			$metadata_key = (string) ( $definition['metadataKey'] ?? '' );
			if ( '' === $metadata_key || ! property_exists( $incoming, $metadata_key ) ) {
				continue;
			}
			if ( ! is_scalar( $incoming->{$metadata_key} ) && null !== $incoming->{$metadata_key} ) {
				throw new InvalidArgumentException( 'Scene setting "' . $metadata_key . '" must be a scalar value.' );
			}
			$metadata->{$metadata_key} = VRodos_Runtime_Settings_Contract::normalize( (string) $setting_key, $incoming->{$metadata_key} );
		}

		if ( property_exists( $incoming, 'fogtype' ) ) {
			if ( ! is_scalar( $incoming->fogtype ) && null !== $incoming->fogtype ) {
				throw new InvalidArgumentException( 'Scene setting "fogtype" must be a scalar value.' );
			}
			$fog_type = strtolower( trim( (string) $incoming->fogtype ) );
			$metadata->fogtype = in_array( $fog_type, [ 'none', 'linear', 'exponential' ], true ) ? $fog_type : 'none';
		}
		if ( property_exists( $incoming, 'aframePostFXVignetteEnabled' ) ) {
			if ( ! is_scalar( $incoming->aframePostFXVignetteEnabled ) && null !== $incoming->aframePostFXVignetteEnabled ) {
				throw new InvalidArgumentException( 'Scene setting "aframePostFXVignetteEnabled" must be a scalar value.' );
			}
			$metadata->aframePostFXVignetteEnabled = VRodos_Runtime_Settings_Contract::normalize_bool( $incoming->aframePostFXVignetteEnabled, false );
		}
		if ( property_exists( $incoming, 'desktopPerformanceProfiles' ) ) {
			if ( null !== $incoming->desktopPerformanceProfiles && ! is_object( $incoming->desktopPerformanceProfiles ) ) {
				throw new InvalidArgumentException( 'Desktop performance profiles must be a JSON object.' );
			}
			$metadata->desktopPerformanceProfiles = null === $incoming->desktopPerformanceProfiles
				? null
				: VRodos_Desktop_Performance_Profiles::normalize_stored_state_for_save( $incoming->desktopPerformanceProfiles );
		}

		if ( is_array( $metadata->desktopPerformanceProfiles ?? null ) ) {
			$resolved = VRodos_Desktop_Performance_Profiles::resolve(
				$metadata,
				VRodos_Runtime_Settings_Contract::wire_settings_from_metadata( $metadata )
			);
			$profile_errors = VRodos_Desktop_Performance_Profiles::validate_monotonic( $resolved );
			if ( $profile_errors ) {
				throw new InvalidArgumentException( implode( ' ', $profile_errors ) );
			}
		}

		// The canonical object map and URL base stay attached to the decoded scene
		// untouched. Only structural metadata derived from that map is refreshed.
		$metadata->timestamp = (int) round( microtime( true ) * 1000 );
		$metadata->objects   = self::object_count( $scene->objects );

		return $scene;
	}

	private static function is_object_map( $objects ): bool {
		return is_object( $objects ) || is_array( $objects );
	}

	private static function object_count( $objects ): int {
		return is_object( $objects ) ? count( get_object_vars( $objects ) ) : count( $objects );
	}
}
