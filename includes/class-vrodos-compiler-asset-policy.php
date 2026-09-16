<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Shared GLB selection policy for build preparation and publication. */
final class VRodos_Compiler_Asset_Policy {
	public static function automatic_geometry_min_triangles(): int {
		static $policy;
		$policy ??= json_decode( file_get_contents( dirname( __DIR__ ) . '/assets/asset-geometry-policy.json' ), true, 512, JSON_THROW_ON_ERROR );
		return (int) $policy['automaticMinTriangles'];
	}
	public static function validate_headset_quality( string $quality ): string {
		$setting = VRodos_Runtime_Settings_Contract::setting( 'vrHeadsetAssetQuality' );
		if ( ! in_array( $quality, $setting['allowed'], true ) ) {
			throw new InvalidArgumentException( '[VRodos] Invalid headset object quality.' );
		}
		return $quality;
	}

	public static function vr_profile( string $runtime_profile, string $headset_quality = 'low' ): string {
		return 'headset' === $runtime_profile ? 'web-' . self::validate_headset_quality( $headset_quality ) : 'web-high';
	}

	public static function texture_cap( string $profile ): int {
		return match ( $profile ) {
			'web-low' => 1024,
			'web-medium' => 2048,
			default => 4096,
		};
	}
}
