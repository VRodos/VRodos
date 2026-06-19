<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_AFrame_DOM_Helper {
	public static function get_or_create_assets_container( DOMDocument $dom, DOMElement $ascene ): DOMElement {
		$a_asset = $dom->getElementsByTagName( 'a-assets' )->item( 0 );
		if ( ! $a_asset instanceof DOMElement ) {
			$a_asset = $dom->createElement( 'a-assets' );
			if ( $ascene->firstChild ) {
				$ascene->insertBefore( $a_asset, $ascene->firstChild );
			} else {
				$ascene->appendChild( $a_asset );
			}
		}

		$a_asset->setAttribute( 'timeout', VRodos_Compiler_Runtime_Assets::aframe_asset_timeout_ms() );
		return $a_asset;
	}

	public static function parse_component_attribute( string $attribute ): array {
		$values = [];
		foreach ( explode( ';', $attribute ) as $entry ) {
			$entry = trim( $entry );
			if ( '' === $entry ) {
				continue;
			}

			$separator = strpos( $entry, ':' );
			if ( false === $separator ) {
				$values[ $entry ] = 'true';
				continue;
			}

			$key = trim( substr( $entry, 0, $separator ) );
			if ( '' !== $key ) {
				$values[ $key ] = trim( substr( $entry, $separator + 1 ) );
			}
		}

		return $values;
	}

	public static function serialize_component_attribute( array $values ): string {
		$parts = [];
		foreach ( $values as $key => $value ) {
			$parts[] = $key . ': ' . $value;
		}

		return implode( '; ', $parts ) . ';';
	}
}
