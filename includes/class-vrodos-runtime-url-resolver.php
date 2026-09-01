<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-url-normalizer.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-feature-flags.php';

/** Owns compiled-runtime URL policy independently of the compiler. */
final readonly class VRodos_Runtime_URL_Resolver {
	private array $settings;
	private string $website_root_host;

	public function __construct( ?array $settings = null, ?string $website_root_host = null ) {
		$normalizer              = new VRodos_URL_Normalizer( $website_root_host );
		$this->website_root_host = $normalizer->website_root_host();
		$this->settings          = $this->normalize_settings( $settings ?? (array) get_option( 'vrodos_general_settings', [] ) );
	}

	public function runtime_url_for_file( int $project_id, string $filename, ?string $mode = null, ?string $runtime_mode = null ): string {
		return $this->runtime_url_for_published_file( $project_id, 'clients', $filename, $mode, $runtime_mode );
	}

	public function runtime_url_for_published_file( int $project_id, string $role, string $filename, ?string $mode = null, ?string $runtime_mode = null ): string {
		if ( ! in_array( $role, [ 'clients', 'media' ], true ) ) {
			return '';
		}
		$runtime_mode = VRodos_Compiler_Runtime_Feature_Flags::normalize_runtime_mode_value( $runtime_mode );
		if ( VRodos_Compiler_Runtime_Feature_Flags::RUNTIME_MODE_SINGLE_PLAYER === $runtime_mode ) {
			$url = VRodos_Storage_Manager::published_project_url( $project_id, $role, ltrim( $filename, '/' ) );
			return is_wp_error( $url ) ? '' : $url;
		}

		$base_urls = $this->runtime_base_urls();
		$mode      = $mode ?: $this->primary_runtime_mode();
		if ( 'public' === $mode && ! empty( $base_urls['public'] ) ) {
			return $base_urls['public'] . 'vrodos-published/projects/' . $project_id . '/' . $role . '/' . ltrim( $filename, '/' );
		}

		return $base_urls['local'] . 'vrodos-published/projects/' . $project_id . '/' . $role . '/' . ltrim( $filename, '/' );
	}

	public function primary_runtime_base_url(): string {
		$base_urls = $this->runtime_base_urls();
		return $base_urls[ $this->primary_runtime_mode() ] ?? $base_urls['local'];
	}

	public function local_runtime_base_url(): string {
		return $this->runtime_base_urls()['local'];
	}

	public function primary_runtime_mode(): string {
		if ( 'public' === $this->settings['default_link_mode'] && '' !== $this->settings['public_base_url'] ) {
			return 'public';
		}
		return 'local';
	}

	public function default_link_mode(): string {
		return $this->settings['default_link_mode'];
	}

	private function normalize_settings( array $options ): array {
		$port = absint( $options['vrodos_runtime_local_port'] ?? 5832 );
		$mode = (string) ( $options['vrodos_runtime_default_link_mode'] ?? 'both' );
		if ( ! in_array( $mode, [ 'local', 'public', 'both' ], true ) ) {
			$mode = 'both';
		}

		return [
			'public_base_url'   => $this->normalize_runtime_base_url( (string) ( $options['vrodos_runtime_public_base_url'] ?? '' ) ),
			'local_host'        => $this->normalize_runtime_host( (string) ( $options['vrodos_runtime_local_host'] ?? '' ) ),
			'local_port'        => $port > 0 ? (string) $port : '5832',
			'default_link_mode' => $mode,
		];
	}

	private function normalize_runtime_base_url( string $url ): string {
		$url = trim( $url );
		if ( '' === $url ) {
			return '';
		}
		if ( ! preg_match( '#^https?://#i', $url ) ) {
			$url = 'https://' . $url;
		}
		$url = esc_url_raw( $url, [ 'http', 'https' ] );
		return $url ? trailingslashit( $url ) : '';
	}

	private function normalize_runtime_host( string $host ): string {
		$host = trim( $host );
		if ( '' === $host ) {
			return '';
		}
		if ( str_contains( $host, '://' ) ) {
			$parsed_host = wp_parse_url( $host, PHP_URL_HOST );
			$host        = $parsed_host ? (string) $parsed_host : $host;
		}
		$host = preg_replace( '#[:/\\\\].*$#', '', $host );
		return sanitize_text_field( (string) $host );
	}

	private function runtime_base_urls(): array {
		$local_host = $this->settings['local_host'] ?: $this->website_root_host;
		$base_urls  = [
			'local' => 'http://' . $local_host . ':' . $this->settings['local_port'] . '/',
		];
		if ( '' !== $this->settings['public_base_url'] ) {
			$base_urls['public'] = $this->settings['public_base_url'];
		}
		return $base_urls;
	}
}
