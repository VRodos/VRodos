<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Asset_Optimization_Manager {
	private const META_KEY = '_vrodos_asset3d_glb_derivatives';

	public function __construct() {
		add_action( 'add_meta_boxes', $this->add_meta_boxes(...) );
		add_action( 'save_post_vrodos_asset3d', $this->save_derivative_compile_settings(...), 20, 2 );
		add_action( 'admin_post_vrodos_optimize_asset_glb', $this->handle_optimize_asset_glb(...) );
	}

	public function add_meta_boxes(): void {
		add_meta_box(
			'vrodos_asset_glb_optimization',
			'GLB Optimization',
			$this->render_glb_optimization_box(...),
			'vrodos_asset3d',
			'side',
			'default'
		);
	}

	public function render_glb_optimization_box( WP_Post $post ): void {
		$asset_id = (int) $post->ID;
		$meta     = self::get_derivative_meta( $asset_id );
		$source   = self::get_source_glb( $asset_id );
		$profiles = self::supported_profiles();

		wp_nonce_field( 'vrodos_asset_derivative_settings_' . $asset_id, 'vrodos_asset_derivative_settings_nonce' );

		$notice = isset( $_GET['vrodos_optimize_notice'] ) ? sanitize_key( (string) wp_unslash( $_GET['vrodos_optimize_notice'] ) ) : '';
		if ( '' !== $notice ) {
			$notice_class = 'optimized' === $notice ? 'notice-success' : 'notice-error';
			$notice_text  = 'optimized' === $notice
				? 'Optimized derivative generated.'
				: 'Optimization failed. Check the error details below or server logs.';
			echo '<div class="notice ' . esc_attr( $notice_class ) . ' inline"><p>' . esc_html( $notice_text ) . '</p></div>';
		}

		if ( is_wp_error( $source ) ) {
			echo '<p>No local GLB source is available for optimization.</p>';
			echo '<p><small>' . esc_html( $source->get_error_message() ) . '</small></p>';
			return;
		}

		echo '<p><strong>Source GLB</strong><br><code style="word-break:break-all;">' . esc_html( basename( $source['path'] ) ) . '</code></p>';
		echo '<p><small>Source size: ' . esc_html( size_format( (int) $source['sizeBytes'], 1 ) ) . '</small></p>';

		$optimize_url = wp_nonce_url(
			add_query_arg(
				[
					'action'   => 'vrodos_optimize_asset_glb',
					'asset_id' => $asset_id,
					'profile'  => 'safe-draco',
				],
				admin_url( 'admin-post.php' )
			),
			'vrodos_optimize_asset_glb_' . $asset_id
		);

		echo '<p><a class="button button-secondary" href="' . esc_url( $optimize_url ) . '">Generate safe Draco derivative</a></p>';
		echo '<p><small>Creates a cached derivative in uploads. The original GLB is kept unchanged.</small></p>';

		$ready_derivatives = array_filter(
			(array) ( $meta['derivatives'] ?? [] ),
			static fn( $derivative ) => is_array( $derivative ) && ( $derivative['status'] ?? '' ) === 'ready'
		);

		if ( empty( $ready_derivatives ) ) {
			echo '<p>No ready derivatives yet.</p>';
			return;
		}

		echo '<hr>';
		echo '<p><strong>Ready derivatives</strong></p>';
		foreach ( $ready_derivatives as $profile => $derivative ) {
			$source_size     = (int) ( $derivative['sourceSizeBytes'] ?? 0 );
			$derivative_size = (int) ( $derivative['derivativeSizeBytes'] ?? 0 );
			$reduction       = is_numeric( $derivative['reductionPercent'] ?? null ) ? (float) $derivative['reductionPercent'] : 0.0;
			echo '<p><code>' . esc_html( (string) $profile ) . '</code><br>';
			echo '<small>' . esc_html( size_format( $source_size, 1 ) ) . ' -> ' . esc_html( size_format( $derivative_size, 1 ) ) . ' (' . esc_html( number_format_i18n( $reduction, 1 ) ) . '% saved)</small></p>';
		}

		$active_profile  = (string) ( $meta['activeProfile'] ?? array_key_first( $ready_derivatives ) );
		$compile_enabled = ! empty( $meta['compileEnabled'] );

		echo '<p><label for="vrodos_asset_derivative_active_profile">Active derivative</label><br>';
		echo '<select id="vrodos_asset_derivative_active_profile" name="vrodos_asset_derivative_active_profile" style="width:100%;">';
		foreach ( $profiles as $profile => $label ) {
			if ( empty( $ready_derivatives[ $profile ] ) ) {
				continue;
			}
			echo '<option value="' . esc_attr( $profile ) . '"' . selected( $active_profile, $profile, false ) . '>' . esc_html( $label ) . '</option>';
		}
		echo '</select></p>';

		echo '<p><label><input type="checkbox" name="vrodos_asset_derivative_compile_enabled" value="1"' . checked( $compile_enabled, true, false ) . '> Use active derivative in compiled scenes</label></p>';
		echo '<p><small>Save the asset after changing compile usage. Leave this off until visual parity is checked.</small></p>';

		if ( ! empty( $meta['lastError'] ) ) {
			echo '<p><small><strong>Last error:</strong> ' . esc_html( (string) $meta['lastError'] ) . '</small></p>';
		}
	}

	public function save_derivative_compile_settings( int $post_id, WP_Post $post ): void {
		unset( $post );

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}
		if ( ! isset( $_POST['vrodos_asset_derivative_settings_nonce'] ) ) {
			return;
		}
		$nonce = sanitize_text_field( wp_unslash( (string) $_POST['vrodos_asset_derivative_settings_nonce'] ) );
		if ( ! wp_verify_nonce( $nonce, 'vrodos_asset_derivative_settings_' . $post_id ) ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$meta                 = self::get_derivative_meta( $post_id );
		$meta['compileEnabled'] = ! empty( $_POST['vrodos_asset_derivative_compile_enabled'] );
		$requested_profile    = isset( $_POST['vrodos_asset_derivative_active_profile'] )
			? sanitize_key( (string) wp_unslash( $_POST['vrodos_asset_derivative_active_profile'] ) )
			: '';

		if ( $requested_profile && isset( $meta['derivatives'][ $requested_profile ] ) ) {
			$meta['activeProfile'] = $requested_profile;
		}

		update_post_meta( $post_id, self::META_KEY, $meta );
	}

	public function handle_optimize_asset_glb(): void {
		$asset_id = isset( $_GET['asset_id'] ) ? absint( $_GET['asset_id'] ) : 0;
		$profile  = isset( $_GET['profile'] ) ? sanitize_key( (string) wp_unslash( $_GET['profile'] ) ) : 'safe-draco';

		if ( $asset_id <= 0 || ! current_user_can( 'edit_post', $asset_id ) ) {
			wp_die( esc_html__( 'You are not allowed to optimize this asset.', 'vrodos' ), '', [ 'response' => 403 ] );
		}

		check_admin_referer( 'vrodos_optimize_asset_glb_' . $asset_id );

		if ( ! isset( self::supported_profiles()[ $profile ] ) ) {
			$this->redirect_to_asset( $asset_id, 'invalid-profile' );
		}

		$source = self::get_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			$this->record_error( $asset_id, $source->get_error_message() );
			$this->redirect_to_asset( $asset_id, 'failed' );
		}

		$result = $this->generate_derivative( $asset_id, $source, $profile );
		if ( is_wp_error( $result ) ) {
			$this->record_error( $asset_id, $result->get_error_message() );
			$this->redirect_to_asset( $asset_id, 'failed' );
		}

		$this->store_derivative_record( $asset_id, $result );
		$this->redirect_to_asset( $asset_id, 'optimized' );
	}

	public static function resolve_compiled_glb_asset( int $asset_id, string $source_url ): array {
		$result = [
			'url'        => $source_url,
			'derivative' => null,
		];

		if ( $asset_id <= 0 || '' === trim( $source_url ) ) {
			return $result;
		}

		$meta = self::get_derivative_meta( $asset_id );
		if ( empty( $meta['compileEnabled'] ) ) {
			return $result;
		}

		$profile = (string) ( $meta['activeProfile'] ?? '' );
		if ( '' === $profile || empty( $meta['derivatives'][ $profile ] ) || ! is_array( $meta['derivatives'][ $profile ] ) ) {
			return $result;
		}

		$derivative = $meta['derivatives'][ $profile ];
		if ( ! self::is_derivative_usable( $derivative, $source_url ) ) {
			return $result;
		}

		$result['url']        = (string) $derivative['url'];
		$result['derivative'] = $derivative;
		return $result;
	}

	private static function supported_profiles(): array {
		return [
			'safe-draco'   => 'Safe Draco',
			'safe-meshopt' => 'Safe Meshopt',
		];
	}

	private static function get_derivative_meta( int $asset_id ): array {
		$raw = get_post_meta( $asset_id, self::META_KEY, true );
		if ( ! is_array( $raw ) ) {
			$raw = [];
		}

		return wp_parse_args(
			$raw,
			[
				'schemaVersion'  => 1,
				'compileEnabled' => false,
				'activeProfile'  => '',
				'derivatives'    => [],
				'lastError'      => '',
			]
		);
	}

	private static function get_source_glb( int $asset_id ) {
		$source_meta = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
		$source_url  = VRodos_Core_Manager::resolve_media_meta_url( $source_meta );

		if ( '' === $source_url ) {
			return new WP_Error( 'vrodos_no_glb_source', 'Asset has no GLB source URL.' );
		}

		$source_path = is_numeric( $source_meta )
			? get_attached_file( (int) $source_meta )
			: self::local_path_from_url( $source_url );

		if ( ! is_string( $source_path ) || '' === $source_path || ! is_file( $source_path ) || ! is_readable( $source_path ) ) {
			return new WP_Error( 'vrodos_glb_source_not_local', 'Only local uploaded GLB files can be optimized.' );
		}

		if ( strtolower( pathinfo( $source_path, PATHINFO_EXTENSION ) ) !== 'glb' ) {
			return new WP_Error( 'vrodos_glb_source_invalid_type', 'The source asset is not a GLB file.' );
		}

		$size = filesize( $source_path );

		return [
			'meta'      => $source_meta,
			'url'       => $source_url,
			'path'      => $source_path,
			'sizeBytes' => false === $size ? 0 : (int) $size,
		];
	}

	private static function local_path_from_url( string $url ): string {
		$uploads = wp_upload_dir();
		$clean_url = self::strip_url_query_fragment( $url );
		$path      = wp_parse_url( $clean_url, PHP_URL_PATH );

		if ( ! is_string( $path ) || '' === $path ) {
			return '';
		}

		$upload_base_url = untrailingslashit( (string) $uploads['baseurl'] );
		if ( str_starts_with( $clean_url, $upload_base_url ) ) {
			$relative = substr( $clean_url, strlen( $upload_base_url ) );
			return wp_normalize_path( trailingslashit( $uploads['basedir'] ) . ltrim( rawurldecode( $relative ), '/\\' ) );
		}

		if ( str_starts_with( $path, '/wp-content/uploads/' ) && defined( 'ABSPATH' ) ) {
			return wp_normalize_path( trailingslashit( ABSPATH ) . ltrim( rawurldecode( $path ), '/\\' ) );
		}

		return '';
	}

	private function generate_derivative( int $asset_id, array $source, string $profile ) {
		$paths = $this->build_derivative_paths( $asset_id, $source, $profile );

		if ( ! wp_mkdir_p( $paths['dir'] ) ) {
			return new WP_Error( 'vrodos_derivative_dir_failed', 'Could not create derivative output directory.' );
		}

		wp_raise_memory_limit( 'admin' );
		@set_time_limit( 600 );

		$node = (string) apply_filters( 'vrodos_asset_optimizer_node_command', 'node' );
		$script = VRodos_Path_Manager::plugin_path( 'scripts/prototype-optimize-master-client-assets.mjs' );
		$args = [
			$node,
			$script,
			'--source',
			$source['path'],
			'--source-url',
			$source['url'],
			'--output-dir',
			$paths['dir'],
			'--output-file',
			$paths['file'],
			'--manifest',
			$paths['manifest'],
			'--markdown',
			$paths['markdown'],
			'--profile',
			$profile,
			'--json',
		];

		$command = implode( ' ', array_map( 'escapeshellarg', $args ) ) . ' 2>&1';
		$output = [];
		$code   = 0;
		exec( $command, $output, $code );

		if ( 0 !== $code ) {
			return new WP_Error(
				'vrodos_optimizer_failed',
				'glTF optimization failed: ' . trim( implode( "\n", array_slice( $output, -12 ) ) )
			);
		}

		if ( ! is_file( $paths['manifest'] ) ) {
			return new WP_Error( 'vrodos_optimizer_manifest_missing', 'Optimizer finished without writing a manifest.' );
		}

		$manifest = json_decode( (string) file_get_contents( $paths['manifest'] ), true );
		if ( ! is_array( $manifest ) || empty( $manifest['assets'][0] ) || ! is_array( $manifest['assets'][0] ) ) {
			return new WP_Error( 'vrodos_optimizer_manifest_invalid', 'Optimizer manifest is invalid.' );
		}

		$record = $manifest['assets'][0];
		if ( ( $record['status'] ?? '' ) !== 'done' || ! is_file( $paths['file'] ) ) {
			return new WP_Error( 'vrodos_optimizer_derivative_missing', 'Optimizer did not produce a ready derivative file.' );
		}

		return [
			'profile'  => $profile,
			'paths'    => $paths,
			'manifest' => $manifest,
			'record'   => $record,
		];
	}

	private function build_derivative_paths( int $asset_id, array $source, string $profile ): array {
		$uploads = wp_upload_dir();
		$dir     = wp_normalize_path( trailingslashit( $uploads['basedir'] ) . 'vrodos-optimized-assets/asset-' . $asset_id );
		$url     = trailingslashit( $uploads['baseurl'] ) . 'vrodos-optimized-assets/asset-' . $asset_id;
		$base    = sanitize_file_name( pathinfo( (string) $source['path'], PATHINFO_FILENAME ) . '.' . $profile );

		return [
			'dir'      => $dir,
			'urlBase'  => $url,
			'file'     => $dir . '/' . $base . '.glb',
			'url'      => $url . '/' . $base . '.glb',
			'manifest' => $dir . '/' . $base . '.manifest.json',
			'markdown' => $dir . '/' . $base . '.manifest.md',
		];
	}

	private function store_derivative_record( int $asset_id, array $result ): void {
		$record = $result['record'];
		$paths  = $result['paths'];
		$profile = $result['profile'];
		$meta   = self::get_derivative_meta( $asset_id );

		$meta['derivatives'][ $profile ] = [
			'profile'             => $profile,
			'status'              => 'ready',
			'url'                 => esc_url_raw( $paths['url'] ),
			'path'                => wp_normalize_path( $paths['file'] ),
			'manifestPath'        => wp_normalize_path( $paths['manifest'] ),
			'sourceUrl'           => esc_url_raw( (string) ( $record['sourceUrl'] ?? '' ) ),
			'sourcePath'          => wp_normalize_path( (string) ( $record['sourcePath'] ?? '' ) ),
			'sourceSizeBytes'     => (int) ( $record['sourceSizeBytes'] ?? 0 ),
			'derivativeSizeBytes' => (int) ( $record['derivativeSizeBytes'] ?? 0 ),
			'reductionBytes'      => (int) ( $record['reductionBytes'] ?? 0 ),
			'reductionPercent'    => is_numeric( $record['reductionPercent'] ?? null ) ? (float) $record['reductionPercent'] : 0.0,
			'extensions'          => $record['derivative']['extensions']['used'] ?? [],
			'generatedAt'         => current_time( 'mysql', true ),
		];

		if ( empty( $meta['activeProfile'] ) ) {
			$meta['activeProfile'] = $profile;
		}
		$meta['lastError'] = '';

		update_post_meta( $asset_id, self::META_KEY, $meta );
	}

	private function record_error( int $asset_id, string $message ): void {
		$meta              = self::get_derivative_meta( $asset_id );
		$meta['lastError'] = wp_strip_all_tags( $message );
		update_post_meta( $asset_id, self::META_KEY, $meta );
	}

	private function redirect_to_asset( int $asset_id, string $notice ): void {
		$url = add_query_arg(
			'vrodos_optimize_notice',
			sanitize_key( $notice ),
			get_edit_post_link( $asset_id, 'raw' ) ?: admin_url( 'edit.php?post_type=vrodos_asset3d' )
		);
		wp_safe_redirect( $url );
		exit;
	}

	private static function is_derivative_usable( array $derivative, string $source_url ): bool {
		if ( ( $derivative['status'] ?? '' ) !== 'ready' || empty( $derivative['url'] ) ) {
			return false;
		}

		if ( ! empty( $derivative['path'] ) && ! is_file( (string) $derivative['path'] ) ) {
			return false;
		}

		$derivative_source = (string) ( $derivative['sourceUrl'] ?? '' );
		if ( '' !== $derivative_source && self::normalize_url_path( $derivative_source ) !== self::normalize_url_path( $source_url ) ) {
			return false;
		}

		return true;
	}

	private static function normalize_url_path( string $url ): string {
		$path = wp_parse_url( self::strip_url_query_fragment( $url ), PHP_URL_PATH );
		if ( ! is_string( $path ) ) {
			return '';
		}
		return '/' . ltrim( rawurldecode( str_replace( '\\', '/', $path ) ), '/' );
	}

	private static function strip_url_query_fragment( string $url ): string {
		$without_fragment = explode( '#', $url, 2 )[0];
		return explode( '?', $without_fragment, 2 )[0];
	}
}
