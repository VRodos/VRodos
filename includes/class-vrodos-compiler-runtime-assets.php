<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_Runtime_Assets {
	private const DEFAULT_AFRAME_ASSET_TIMEOUT_MS = 120000;

	public static function aframe_asset_timeout_ms(): string {
		$timeout = absint( apply_filters( 'vrodos_compiled_aframe_asset_timeout_ms', self::DEFAULT_AFRAME_ASSET_TIMEOUT_MS ) );

		return (string) max( 3000, $timeout );
	}

	public function replace_placeholders( string $content ): string {
		$replacements = [
			'VRODOS_CSS_URL_PLACEHOLDER'         => $this->same_origin_path( VRodos_Path_Manager::css_url() ),
			'VRODOS_ASSET_IMAGE_URL_PLACEHOLDER' => $this->same_origin_path( VRodos_Path_Manager::image_url() ),
		];

		return str_replace( array_keys( $replacements ), array_values( $replacements ), $content );
	}

	public function runtime_asset_url( string $relative ): string {
		return '../../assets/' . ltrim( str_replace( '\\', '/', $relative ), '/' );
	}

	public function runtime_image_url( string $relative ): string {
		return $this->runtime_asset_url( 'images/' . ltrim( $relative, '/\\' ) );
	}

	public function redirect_runtime_template_urls( string $content ): string {
		$content = str_replace( 'src="js/components/', 'src="' . $this->same_origin_path( VRodos_Path_Manager::runtime_component_url() ), $content );
		$content = str_replace( 'src="js/master/', 'src="' . $this->same_origin_path( VRodos_Path_Manager::runtime_master_url() ), $content );
		$content = str_replace( 'src="js/', 'src="' . $this->same_origin_path( VRodos_Path_Manager::runtime_js_url() ), $content );
		$content = str_replace( 'href="css/', 'href="' . $this->same_origin_path( VRodos_Path_Manager::css_url( 'runtime/' ) ), $content );

		return $this->replace_placeholders( $content );
	}

	private function same_origin_path( string $url ): string {
		$path = wp_parse_url( $url, PHP_URL_PATH );
		if ( ! $path ) {
			return $url;
		}

		$query = wp_parse_url( $url, PHP_URL_QUERY );
		return $path . ( $query ? '?' . $query : '' );
	}
}
