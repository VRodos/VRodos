<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_Runtime_Assets {
	public function replace_placeholders( string $content ): string {
		$replacements = [
			'VRODOS_CSS_URL_PLACEHOLDER'         => VRodos_Path_Manager::css_url(),
			'VRODOS_ASSET_IMAGE_URL_PLACEHOLDER' => VRodos_Path_Manager::image_url(),
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
		$content = str_replace( 'src="js/components/', 'src="' . VRodos_Path_Manager::runtime_component_url(), $content );
		$content = str_replace( 'src="js/master/', 'src="' . VRodos_Path_Manager::runtime_master_url(), $content );
		$content = str_replace( 'src="js/', 'src="' . VRodos_Path_Manager::runtime_js_url(), $content );
		$content = str_replace( 'href="css/', 'href="' . VRodos_Path_Manager::css_url( 'runtime/' ), $content );

		return $this->replace_placeholders( $content );
	}
}
