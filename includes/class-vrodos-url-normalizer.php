<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Normalizes media/plugin URLs for compiled clients served by WordPress or the
 * optional network runtime. This is intentionally independent of compilation.
 */
final readonly class VRodos_URL_Normalizer {
	private string $website_root_host;

	public function __construct( ?string $website_root_host = null ) {
		$host = null === $website_root_host ? $this->detect_request_host() : $website_root_host;
		$this->website_root_host = '' !== trim( (string) $host ) ? trim( (string) $host ) : 'localhost';
	}

	public function normalize( mixed $url ): string {
		$url = trim( (string) $url );
		if ( '' === $url || in_array( strtolower( $url ), [ 'false', 'null', 'undefined', '0' ], true ) ) {
			return '';
		}

		$parsed = wp_parse_url( $url );
		if ( ! is_array( $parsed ) ) {
			return $url;
		}

		$host = (string) ( $parsed['host'] ?? '' );
		$path = (string) ( $parsed['path'] ?? '' );
		if (
			'' === $host ||
			'localhost' === $host ||
			'127.0.0.1' === $host ||
			$this->website_root_host === $host ||
			str_contains( $path, '/wp-content/' )
		) {
			$query = isset( $parsed['query'] ) ? '?' . $parsed['query'] : '';
			return $path . $query;
		}

		return $url;
	}

	public function website_root_host(): string {
		return $this->website_root_host;
	}

	private function detect_request_host(): string {
		$host = isset( $_SERVER['HTTP_HOST'] ) ? (string) wp_unslash( $_SERVER['HTTP_HOST'] ) : '';
		if ( '' === $host ) {
			$host = (string) wp_parse_url( get_site_url(), PHP_URL_HOST );
		}
		if ( str_contains( $host, '://' ) ) {
			$host = (string) wp_parse_url( $host, PHP_URL_HOST );
		}

		$host = preg_replace( '#:\\d+$#', '', $host );
		return sanitize_text_field( (string) $host );
	}
}
