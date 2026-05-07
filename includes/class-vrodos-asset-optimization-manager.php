<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Asset_Optimization_Manager {
	private const META_KEY = '_vrodos_asset3d_glb_derivatives';
	private const ANALYSIS_META_KEY = '_vrodos_asset3d_glb_analysis';
	private const SETTINGS_PAGE_KEY = 'vrodos_options';
	private const SETTINGS_TAB_KEY = 'vrodos_asset_optimization_settings';
	private const BATCH_TRANSIENT_PREFIX = 'vrodos_asset_glb_opt_batch_';
	private const GLB_MAGIC = 'glTF';
	private const GLB_VERSION = 2;
	private const GLB_JSON_CHUNK = 0x4E4F534A;
	private const GLTF_TRIANGLES_MODE = 4;
	private const GLTF_TRIANGLE_STRIP_MODE = 5;
	private const GLTF_TRIANGLE_FAN_MODE = 6;

	public function __construct() {
		add_action( 'add_meta_boxes', $this->add_meta_boxes(...) );
		add_action( 'save_post_vrodos_asset3d', $this->save_derivative_compile_settings(...), 20, 2 );
		add_action( 'admin_post_vrodos_optimize_asset_glb', $this->handle_optimize_asset_glb(...) );
		add_action( 'admin_post_vrodos_optimize_missing_glbs', $this->handle_optimize_missing_glbs(...) );
		add_action( 'admin_post_vrodos_refresh_asset_glb_analysis', $this->handle_refresh_asset_glb_analysis(...) );
		add_action( 'admin_post_vrodos_dashboard_refresh_asset_glb_analysis', $this->handle_dashboard_refresh_asset_glb_analysis(...) );
		add_action( 'admin_post_vrodos_dashboard_optimize_asset_glb', $this->handle_dashboard_optimize_asset_glb(...) );
		add_action( 'admin_post_vrodos_dashboard_toggle_asset_compile_use', $this->handle_dashboard_toggle_asset_compile_use(...) );
		add_action( 'wp_ajax_vrodos_dashboard_refresh_asset_glb_analysis', $this->ajax_dashboard_refresh_asset_glb_analysis(...) );
		add_action( 'wp_ajax_vrodos_dashboard_toggle_asset_compile_use', $this->ajax_dashboard_toggle_asset_compile_use(...) );
		add_action( 'added_post_meta', $this->handle_asset_glb_meta_change(...), 10, 4 );
		add_action( 'updated_post_meta', $this->handle_asset_glb_meta_change(...), 10, 4 );
		add_action( 'deleted_post_meta', $this->handle_asset_glb_meta_delete(...), 10, 4 );
		add_action( 'before_delete_post', $this->handle_asset_delete(...), 10, 2 );
		add_filter( 'vrodos_settings_tabs', $this->register_settings_tab(...) );
		add_action( 'vrodos_render_settings_tab_' . self::SETTINGS_TAB_KEY, $this->render_asset_optimization_settings(...) );
	}

	public function register_settings_tab( array $tabs ): array {
		$tabs[ self::SETTINGS_TAB_KEY ] = __( 'Assets' );
		return $tabs;
	}

	public function handle_asset_glb_meta_change( $meta_id, int $asset_id, string $meta_key, $meta_value ): void {
		unset( $meta_id, $meta_value );

		if ( 'vrodos_asset3d_glb' !== $meta_key || get_post_type( $asset_id ) !== 'vrodos_asset3d' ) {
			return;
		}

		self::refresh_asset_analysis( $asset_id );
	}

	public function handle_asset_glb_meta_delete( $meta_ids, int $asset_id, string $meta_key, $meta_value ): void {
		unset( $meta_ids, $meta_value );

		if ( 'vrodos_asset3d_glb' !== $meta_key || get_post_type( $asset_id ) !== 'vrodos_asset3d' ) {
			return;
		}

		delete_post_meta( $asset_id, self::ANALYSIS_META_KEY );
	}

	public function handle_asset_delete( int $post_id, WP_Post $post ): void {
		if ( 'vrodos_asset3d' !== $post->post_type ) {
			return;
		}

		self::delete_asset_derivative_cache( $post_id );
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

	public function render_asset_optimization_settings(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			echo '<p>' . esc_html__( 'You are not allowed to manage asset optimization.' ) . '</p>';
			return;
		}

		$profile          = 'safe-draco';
		$scan             = self::scan_glb_derivatives( $profile );
		$report           = $this->read_batch_report_from_request();
		$analysis_report  = $this->read_analysis_report_from_request();

		echo '<h2>' . esc_html__( 'Asset Optimization' ) . '</h2>';
		echo '<p>' . esc_html__( 'Analyze uploaded GLBs before generating cached optimized derivatives. This does not replace source uploads and does not enable compiled-scene substitution.' ) . '</p>';

		$this->render_analysis_report( $analysis_report );
		$this->render_batch_report( $report );
		$this->render_asset_optimization_summary( $scan );

		echo '<h3>' . esc_html__( 'Action Surface' ) . '</h3>';
		echo '<p>' . esc_html__( 'Use Dashboard > Actionable Assets for per-asset analysis refresh and derivative generation. This Settings tab is now the GLB diagnostics and reporting view.' ) . '</p>';

		$this->render_asset_candidate_list( __( 'Recommended for safe Draco/Meshopt geometry derivatives' ), $scan['recommendedGeometry'], 'recommendation' );
		$this->render_asset_candidate_list( __( 'Recommended for future KTX2 texture derivatives' ), $scan['recommendedTexture'], 'recommendation' );
		$this->render_asset_candidate_list( __( 'Recommended for future LOD derivatives' ), $scan['recommendedLod'], 'recommendation' );
		$this->render_asset_candidate_list( __( 'Low-benefit or already compressed GLB assets' ), $scan['lowBenefit'], 'recommendation' );
		$this->render_asset_candidate_list( __( 'Missing safe Draco derivatives' ), $scan['missing'] );
		$this->render_asset_candidate_list( __( 'Stale safe Draco derivatives' ), $scan['stale'] );
		$this->render_asset_candidate_list( __( 'Needs analysis refresh' ), array_merge( $scan['analysisMissing'], $scan['analysisStale'] ) );
		$this->render_asset_candidate_list( __( 'Unsupported or non-local GLB assets' ), $scan['unsupported'] );

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

	public function handle_optimize_missing_glbs(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You are not allowed to optimize assets.', 'vrodos' ), '', [ 'response' => 403 ] );
		}

		check_admin_referer( 'vrodos_optimize_missing_glbs' );

		$profile = isset( $_POST['vrodos_asset_optimization_profile'] )
			? sanitize_key( (string) wp_unslash( $_POST['vrodos_asset_optimization_profile'] ) )
			: 'safe-draco';
		$target  = isset( $_POST['vrodos_asset_optimization_target'] )
			? sanitize_key( (string) wp_unslash( $_POST['vrodos_asset_optimization_target'] ) )
			: 'missing';
		$autorun = ! empty( $_POST['vrodos_asset_optimization_autorun'] );

		if ( ! isset( self::supported_profiles()[ $profile ] ) ) {
			$profile = 'safe-draco';
		}
		if ( ! in_array( $target, [ 'recommended', 'missing', 'stale' ], true ) ) {
			$target = 'recommended';
		}

		$batch_limit = (int) apply_filters( 'vrodos_asset_optimizer_batch_size', 3 );
		$batch_limit = max( 1, min( 10, $batch_limit ) );
		$report      = $this->run_derivative_batch( $profile, $target, $batch_limit );
		$report_key  = $this->store_batch_report( $report );

		$args = [
			'vrodos_asset_batch_report' => $report_key,
		];
		if ( $autorun && empty( $report['failed'] ) && ! empty( $report['generated'] ) && (int) ( $report['remaining'] ?? 0 ) > 0 ) {
			$args['vrodos_asset_optimization_autorun'] = '1';
		}

		wp_safe_redirect( self::settings_tab_url( $args ) );
		exit;
	}

	public function handle_refresh_asset_glb_analysis(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You are not allowed to analyze assets.', 'vrodos' ), '', [ 'response' => 403 ] );
		}

		check_admin_referer( 'vrodos_refresh_asset_glb_analysis' );

		$target = isset( $_POST['vrodos_asset_analysis_target'] )
			? sanitize_key( (string) wp_unslash( $_POST['vrodos_asset_analysis_target'] ) )
			: 'stale';
		$autorun = ! empty( $_POST['vrodos_asset_analysis_autorun'] );

		if ( ! in_array( $target, [ 'stale', 'all' ], true ) ) {
			$target = 'stale';
		}

		$batch_limit = (int) apply_filters( 'vrodos_asset_analysis_batch_size', 25 );
		$batch_limit = max( 1, min( 100, $batch_limit ) );
		$report      = $this->run_analysis_batch( $target, $batch_limit );
		$report_key  = $this->store_batch_report( $report );

		$args = [
			'vrodos_asset_analysis_report' => $report_key,
		];
		if ( $autorun && (int) ( $report['remaining'] ?? 0 ) > 0 ) {
			$args['vrodos_asset_analysis_autorun'] = '1';
		}

		wp_safe_redirect( self::settings_tab_url( $args ) );
		exit;
	}

	public function handle_dashboard_refresh_asset_glb_analysis(): void {
		$asset_id = isset( $_GET['asset_id'] ) ? absint( $_GET['asset_id'] ) : 0;
		if ( $asset_id <= 0 || ! current_user_can( 'edit_post', $asset_id ) ) {
			wp_die( esc_html__( 'You are not allowed to analyze this asset.', 'vrodos' ), '', [ 'response' => 403 ] );
		}

		check_admin_referer( 'vrodos_dashboard_refresh_asset_glb_analysis_' . $asset_id );

		$result = self::refresh_asset_analysis( $asset_id );
		$notice = is_wp_error( $result ) ? 'analysis-failed' : 'analysis-refreshed';
		wp_safe_redirect( self::dashboard_url( [ 'vrodos_asset_opt_notice' => $notice ] ) );
		exit;
	}

	public function handle_dashboard_optimize_asset_glb(): void {
		$asset_id = isset( $_GET['asset_id'] ) ? absint( $_GET['asset_id'] ) : 0;
		$profile  = isset( $_GET['profile'] ) ? sanitize_key( (string) wp_unslash( $_GET['profile'] ) ) : 'safe-draco';

		if ( $asset_id <= 0 || ! current_user_can( 'edit_post', $asset_id ) ) {
			wp_die( esc_html__( 'You are not allowed to optimize this asset.', 'vrodos' ), '', [ 'response' => 403 ] );
		}

		check_admin_referer( 'vrodos_dashboard_optimize_asset_glb_' . $asset_id );

		if ( ! isset( self::supported_profiles()[ $profile ] ) ) {
			wp_safe_redirect( self::dashboard_url( [ 'vrodos_asset_opt_notice' => 'invalid-profile' ] ) );
			exit;
		}

		$source = self::get_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			$this->record_error( $asset_id, $source->get_error_message() );
			wp_safe_redirect( self::dashboard_url( [ 'vrodos_asset_opt_notice' => 'optimize-failed' ] ) );
			exit;
		}

		$result = $this->generate_derivative( $asset_id, $source, $profile );
		if ( is_wp_error( $result ) ) {
			$this->record_error( $asset_id, $result->get_error_message() );
			wp_safe_redirect( self::dashboard_url( [ 'vrodos_asset_opt_notice' => 'optimize-failed' ] ) );
			exit;
		}

		$this->store_derivative_record( $asset_id, $result );
		wp_safe_redirect( self::dashboard_url( [ 'vrodos_asset_opt_notice' => 'optimized' ] ) );
		exit;
	}

	public function handle_dashboard_toggle_asset_compile_use(): void {
		$asset_id = isset( $_GET['asset_id'] ) ? absint( $_GET['asset_id'] ) : 0;
		$enabled  = isset( $_GET['enabled'] ) && '1' === sanitize_key( (string) wp_unslash( $_GET['enabled'] ) );
		$profile  = isset( $_GET['profile'] ) ? sanitize_key( (string) wp_unslash( $_GET['profile'] ) ) : 'safe-draco';

		if ( $asset_id <= 0 || ! current_user_can( 'edit_post', $asset_id ) ) {
			wp_die( esc_html__( 'You are not allowed to change compile use for this asset.', 'vrodos' ), '', [ 'response' => 403 ] );
		}

		check_admin_referer( 'vrodos_dashboard_toggle_asset_compile_use_' . $asset_id );

		if ( ! isset( self::supported_profiles()[ $profile ] ) ) {
			wp_safe_redirect( self::dashboard_url( [ 'vrodos_asset_opt_notice' => 'invalid-profile' ] ) );
			exit;
		}

		$result = self::set_asset_compile_use( $asset_id, $profile, $enabled );
		if ( is_wp_error( $result ) ) {
			wp_safe_redirect( self::dashboard_url( [ 'vrodos_asset_opt_notice' => 'compile-enable-failed' ] ) );
			exit;
		}

		if ( $enabled ) {
			wp_safe_redirect( self::dashboard_url( [ 'vrodos_asset_opt_notice' => 'compile-enabled' ] ) );
			exit;
		}

		wp_safe_redirect( self::dashboard_url( [ 'vrodos_asset_opt_notice' => 'compile-disabled' ] ) );
		exit;
	}

	public function ajax_dashboard_refresh_asset_glb_analysis(): void {
		check_ajax_referer( 'vrodos_dashboard_asset_actions', 'nonce' );

		$asset_id = isset( $_POST['asset_id'] ) ? absint( $_POST['asset_id'] ) : 0;
		if ( $asset_id <= 0 || ! current_user_can( 'edit_post', $asset_id ) ) {
			wp_send_json_error( [ 'message' => __( 'You are not allowed to analyze this asset.', 'vrodos' ) ], 403 );
		}

		$result = self::refresh_asset_analysis( $asset_id );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error(
				array_merge(
					[
						'message' => $result->get_error_message(),
					],
					self::dashboard_asset_row_state( $asset_id )
				)
			);
		}

		wp_send_json_success(
			array_merge(
				[
					'message' => __( 'Asset analysis refreshed.', 'vrodos' ),
				],
				self::dashboard_asset_row_state( $asset_id )
			)
		);
	}

	public function ajax_dashboard_toggle_asset_compile_use(): void {
		check_ajax_referer( 'vrodos_dashboard_asset_actions', 'nonce' );

		$asset_id = isset( $_POST['asset_id'] ) ? absint( $_POST['asset_id'] ) : 0;
		$enabled  = isset( $_POST['enabled'] ) && '1' === sanitize_key( (string) wp_unslash( $_POST['enabled'] ) );
		$profile  = isset( $_POST['profile'] ) ? sanitize_key( (string) wp_unslash( $_POST['profile'] ) ) : 'safe-draco';

		if ( $asset_id <= 0 || ! current_user_can( 'edit_post', $asset_id ) ) {
			wp_send_json_error( [ 'message' => __( 'You are not allowed to change compile use for this asset.', 'vrodos' ) ], 403 );
		}

		$result = self::set_asset_compile_use( $asset_id, $profile, $enabled );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error(
				array_merge(
					[
						'message' => $result->get_error_message(),
					],
					self::dashboard_asset_row_state( $asset_id )
				)
			);
		}

		wp_send_json_success(
			array_merge(
				[
					'message' => $enabled
						? __( 'Compiled scenes will use this derivative.', 'vrodos' )
						: __( 'Compiled scenes will use the original GLB.', 'vrodos' ),
				],
				self::dashboard_asset_row_state( $asset_id )
			)
		);
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

	public static function dashboard_actionable_assets( int $limit = 10 ): array {
		$scan  = self::scan_glb_derivatives( 'safe-draco' );
		$items = [];

		$mark = static function ( array $source_items, string $key ) use ( &$items ): void {
			foreach ( $source_items as $item ) {
				$asset_id = (int) ( $item['assetId'] ?? 0 );
				if ( $asset_id <= 0 ) {
					continue;
				}
				if ( ! isset( $items[ $asset_id ] ) ) {
					$items[ $asset_id ] = $item;
					$items[ $asset_id ]['dashboardFlags'] = [];
				}
				$items[ $asset_id ]['dashboardFlags'][ $key ] = true;
				$items[ $asset_id ]['recommendationScore'] = max(
					(int) ( $items[ $asset_id ]['recommendationScore'] ?? 0 ),
					(int) ( $item['recommendationScore'] ?? $item['sourceSizeBytes'] ?? 0 )
				);
				foreach ( [ 'analysis', 'recommendationReasons', 'suggestedAction', 'sourceUrl', 'sourceSizeBytes', 'status', 'statusLabel', 'reason' ] as $field ) {
					if ( isset( $item[ $field ] ) && ! isset( $items[ $asset_id ][ $field ] ) ) {
						$items[ $asset_id ][ $field ] = $item[ $field ];
					}
				}
			}
		};

		$mark( $scan['analysisMissing'], 'analysis-missing' );
		$mark( $scan['analysisStale'], 'analysis-stale' );
		$mark( $scan['recommendedGeometry'], 'geometry' );
		$mark( $scan['recommendedTexture'], 'texture' );
		$mark( $scan['recommendedLod'], 'lod' );
		$mark( $scan['stale'], 'stale-derivative' );

		$ready_compile_candidates = array_filter(
			$scan['ready'],
			static function ( array $item ): bool {
				$asset_id = (int) ( $item['assetId'] ?? 0 );
				if ( $asset_id <= 0 ) {
					return false;
				}
				$meta = self::get_derivative_meta( $asset_id );
				return empty( $meta['compileEnabled'] );
			}
		);
		$mark( $ready_compile_candidates, 'compile-disabled' );

		$unsupported = array_filter(
			$scan['unsupported'],
			static fn( array $item ): bool => ( $item['reason'] ?? '' ) !== 'Asset has no GLB source URL.'
		);
		$mark( $unsupported, 'unsupported' );

		$items = array_values( $items );
		usort(
			$items,
			static fn( array $a, array $b ): int => (int) ( $b['recommendationScore'] ?? 0 ) <=> (int) ( $a['recommendationScore'] ?? 0 )
		);

		return array_slice( $items, 0, max( 1, $limit ) );
	}

	public static function render_dashboard_actionable_assets_table( int $limit = 10 ): void {
		$items = self::dashboard_actionable_assets( $limit );

		if ( empty( $items ) ) {
			?>
			<div class="tw-text-center tw-py-12 tw-text-slate-400 tw-font-bold">
				<i data-lucide="check-circle" class="tw-w-8 tw-h-8 tw-mx-auto tw-mb-3 tw-text-emerald-500"></i>
				No actionable GLB optimization items right now.
			</div>
			<?php
			return;
		}

		?>
		<div class="tw-overflow-x-auto">
			<table class="tw-table tw-w-full">
				<thead>
					<tr class="tw-bg-slate-50/30">
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest">Asset</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest">Size</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-center">Analysis</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-center">Geometry</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-center">Texture</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-center">LOD</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-center">Safe Draco</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-center">Compile Use</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $items as $item ) : ?>
						<?php
						$asset_id = (int) ( $item['assetId'] ?? 0 );
						$title    = (string) ( $item['title'] ?? 'Asset #' . $asset_id );
						$analysis = is_array( $item['analysis'] ?? null ) ? $item['analysis'] : [];
						$meta     = self::get_derivative_meta( $asset_id );
						$source_url = (string) ( $item['sourceUrl'] ?? '' );
						$derivative = $meta['derivatives']['safe-draco'] ?? null;
						$derivative_status = is_array( $derivative ) ? self::derivative_unusable_reason( $derivative, $source_url ) : 'No safe Draco derivative generated.';
						$derivative_ready = is_array( $derivative ) && '' === $derivative_status;
						$flags = is_array( $item['dashboardFlags'] ?? null ) ? $item['dashboardFlags'] : [];
						?>
						<tr class="tw-hover hover:tw-bg-slate-50/80 tw-transition-colors" data-vrodos-dashboard-asset-row="<?php echo esc_attr( (string) $asset_id ); ?>">
							<td>
								<div class="tw-font-black tw-text-slate-700"><?php echo esc_html( $title ); ?></div>
								<div class="tw-text-[10px] tw-text-slate-400 tw-font-mono">#<?php echo esc_html( (string) $asset_id ); ?></div>
							</td>
							<td class="tw-text-xs tw-font-bold tw-text-slate-500"><?php echo esc_html( size_format( (int) ( $item['sourceSizeBytes'] ?? 0 ), 1 ) ); ?></td>
							<td class="tw-text-center" data-vrodos-dashboard-cell="analysis"><?php self::render_dashboard_analysis_icon( $flags ); ?></td>
							<td class="tw-text-center" data-vrodos-dashboard-cell="geometry"><?php self::render_dashboard_recommendation_icon( $flags, $analysis, 'geometryDerivative', 'Geometry derivative recommended', 'Geometry derivative not recommended' ); ?></td>
							<td class="tw-text-center" data-vrodos-dashboard-cell="texture"><?php self::render_dashboard_recommendation_icon( $flags, $analysis, 'textureDerivative', 'Texture derivative recommended', 'Texture derivative not recommended' ); ?></td>
							<td class="tw-text-center" data-vrodos-dashboard-cell="lod"><?php self::render_dashboard_recommendation_icon( $flags, $analysis, 'lodDerivative', 'LOD derivative recommended', 'LOD derivative not recommended' ); ?></td>
							<td class="tw-text-center" data-vrodos-dashboard-cell="draco"><?php self::render_dashboard_draco_icon( $derivative_ready, $derivative_status, $flags ); ?></td>
							<td class="tw-text-center" data-vrodos-dashboard-cell="compile"><?php self::render_dashboard_compile_toggle( $asset_id, $meta, $derivative_ready ); ?></td>
							<td class="tw-text-right">
								<div class="tw-flex tw-flex-wrap tw-justify-end tw-gap-2" data-vrodos-dashboard-cell="actions">
									<?php echo self::dashboard_row_actions_html( $asset_id, $flags, $derivative_ready ); ?>
								</div>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		</div>
		<?php
	}

	private static function dashboard_can_generate_safe_draco( array $flags, bool $derivative_ready ): bool {
		if ( $derivative_ready || ! empty( $flags['unsupported'] ) ) {
			return false;
		}
		return ! empty( $flags['geometry'] ) || ! empty( $flags['stale-derivative'] );
	}

	private static function dashboard_asset_row_state( int $asset_id ): array {
		$scan = self::scan_glb_derivatives( 'safe-draco' );
		$item = null;
		foreach ( [ 'analysisMissing', 'analysisStale', 'recommendedGeometry', 'recommendedTexture', 'recommendedLod', 'stale', 'ready', 'unsupported', 'lowBenefit', 'missing' ] as $bucket ) {
			foreach ( $scan[ $bucket ] ?? [] as $candidate ) {
				if ( (int) ( $candidate['assetId'] ?? 0 ) === $asset_id ) {
					$item = array_merge( $item ?? [], $candidate );
				}
			}
		}

		$meta       = self::get_derivative_meta( $asset_id );
		$source    = self::get_source_glb( $asset_id );
		$source_url = is_wp_error( $source ) ? '' : (string) $source['url'];
		$analysis  = self::get_analysis_meta( $asset_id );
		$flags     = [];

		if ( is_wp_error( $source ) ) {
			$flags['unsupported'] = true;
		} elseif ( empty( $analysis ) ) {
			$flags['analysis-missing'] = true;
		} elseif ( self::analysis_needs_refresh( $analysis, $source ) ) {
			$flags['analysis-stale'] = true;
		} else {
			if ( ! empty( $analysis['recommendations']['geometryDerivative'] ) ) {
				$flags['geometry'] = true;
			}
			if ( ! empty( $analysis['recommendations']['textureDerivative'] ) ) {
				$flags['texture'] = true;
			}
			if ( ! empty( $analysis['recommendations']['lodDerivative'] ) ) {
				$flags['lod'] = true;
			}
		}

		$derivative = $meta['derivatives']['safe-draco'] ?? null;
		$derivative_status = is_array( $derivative ) ? self::derivative_unusable_reason( $derivative, $source_url ) : 'No safe Draco derivative generated.';
		$derivative_ready = is_array( $derivative ) && '' === $derivative_status;
		if ( is_array( $derivative ) && ! $derivative_ready ) {
			$flags['stale-derivative'] = true;
		}
		if ( $derivative_ready && empty( $meta['compileEnabled'] ) ) {
			$flags['compile-disabled'] = true;
		}

		return [
			'assetId'      => $asset_id,
			'rowVisible'   => self::dashboard_row_is_actionable( $flags ),
			'cells'        => self::dashboard_row_cells_html( $asset_id, $meta, $analysis, $flags, $derivative_ready, $derivative_status ),
			'actionsHtml'  => self::dashboard_row_actions_html( $asset_id, $flags, $derivative_ready ),
			'compileEnabled' => ! empty( $meta['compileEnabled'] ),
			'title'        => (string) ( $item['title'] ?? get_the_title( $asset_id ) ?: 'Asset #' . $asset_id ),
		];
	}

	private static function dashboard_row_is_actionable( array $flags ): bool {
		foreach ( [ 'analysis-missing', 'analysis-stale', 'geometry', 'texture', 'lod', 'stale-derivative', 'unsupported', 'compile-disabled' ] as $key ) {
			if ( ! empty( $flags[ $key ] ) ) {
				return true;
			}
		}
		return false;
	}

	private static function dashboard_row_cells_html( int $asset_id, array $meta, array $analysis, array $flags, bool $derivative_ready, string $derivative_status ): array {
		return [
			'analysis' => self::capture_dashboard_html( static fn() => self::render_dashboard_analysis_icon( $flags ) ),
			'geometry' => self::capture_dashboard_html( static fn() => self::render_dashboard_recommendation_icon( $flags, $analysis, 'geometryDerivative', 'Geometry derivative recommended', 'Geometry derivative not recommended' ) ),
			'texture'  => self::capture_dashboard_html( static fn() => self::render_dashboard_recommendation_icon( $flags, $analysis, 'textureDerivative', 'Texture derivative recommended', 'Texture derivative not recommended' ) ),
			'lod'      => self::capture_dashboard_html( static fn() => self::render_dashboard_recommendation_icon( $flags, $analysis, 'lodDerivative', 'LOD derivative recommended', 'LOD derivative not recommended' ) ),
			'draco'    => self::capture_dashboard_html( static fn() => self::render_dashboard_draco_icon( $derivative_ready, $derivative_status, $flags ) ),
			'compile'  => self::capture_dashboard_html( static fn() => self::render_dashboard_compile_toggle( $asset_id, $meta, $derivative_ready ) ),
		];
	}

	private static function dashboard_row_actions_html( int $asset_id, array $flags, bool $derivative_ready ): string {
		$can_generate_safe_draco = self::dashboard_can_generate_safe_draco( $flags, $derivative_ready );
		$generate_label = ! empty( $flags['stale-derivative'] ) ? 'Regenerate derivative' : 'Generate derivative';

		return self::capture_dashboard_html(
			static function () use ( $asset_id, $can_generate_safe_draco, $generate_label ): void {
				?>
				<a href="<?php echo esc_url( self::dashboard_refresh_analysis_url( $asset_id ) ); ?>" class="tw-btn tw-btn-ghost tw-btn-xs tw-text-slate-600 tw-font-black tw-uppercase tw-tracking-wider" title="Refresh GLB analysis" data-vrodos-dashboard-action="refresh-analysis" data-asset-id="<?php echo esc_attr( (string) $asset_id ); ?>">
					<i data-lucide="refresh-cw" class="tw-w-3 tw-h-3"></i>
					Refresh
				</a>
				<?php if ( $can_generate_safe_draco ) : ?>
					<a href="<?php echo esc_url( self::dashboard_optimize_url( $asset_id ) ); ?>" class="tw-btn tw-btn-ghost tw-btn-xs tw-text-primary tw-font-black tw-uppercase tw-tracking-wider">
						<i data-lucide="package-check" class="tw-w-3 tw-h-3"></i>
						<?php echo esc_html( $generate_label ); ?>
					</a>
				<?php endif; ?>
				<a href="<?php echo esc_url( get_edit_post_link( $asset_id, 'raw' ) ?: '#' ); ?>" class="tw-btn tw-btn-ghost tw-btn-xs tw-text-slate-500 tw-font-black tw-uppercase tw-tracking-wider">
					Edit
				</a>
				<?php
			}
		);
	}

	private static function capture_dashboard_html( callable $render ): string {
		ob_start();
		$render();
		return (string) ob_get_clean();
	}

	private static function render_dashboard_analysis_icon( array $flags ): void {
		if ( ! empty( $flags['unsupported'] ) ) {
			self::render_dashboard_status_icon( 'x-circle', 'Unsupported for automatic GLB analysis', 'tw-text-rose-500' );
			return;
		}
		if ( ! empty( $flags['analysis-stale'] ) ) {
			self::render_dashboard_status_icon( 'refresh-cw', 'Analysis is stale', 'tw-text-amber-500' );
			return;
		}
		if ( ! empty( $flags['analysis-missing'] ) ) {
			self::render_dashboard_status_icon( 'triangle-alert', 'Analysis is missing', 'tw-text-amber-500' );
			return;
		}
		self::render_dashboard_status_icon( 'check-circle', 'Analysis is current', 'tw-text-emerald-500' );
	}

	private static function render_dashboard_recommendation_icon( array $flags, array $analysis, string $key, string $recommended_title, string $not_applicable_title ): void {
		if ( ! empty( $flags['unsupported'] ) ) {
			self::render_dashboard_status_icon( 'x-circle', 'Unsupported', 'tw-text-rose-500' );
			return;
		}
		if ( ! empty( $flags['analysis-missing'] ) || ! empty( $flags['analysis-stale'] ) ) {
			self::render_dashboard_status_icon( 'refresh-cw', 'Refresh analysis first', 'tw-text-amber-500' );
			return;
		}
		if ( ! empty( $analysis['recommendations'][ $key ] ) ) {
			self::render_dashboard_status_icon( 'triangle-alert', $recommended_title, 'tw-text-amber-500' );
			return;
		}
		self::render_dashboard_status_icon( 'circle-minus', $not_applicable_title, 'tw-text-slate-300' );
	}

	private static function render_dashboard_draco_icon( bool $derivative_ready, string $derivative_status, array $flags ): void {
		if ( $derivative_ready ) {
			self::render_dashboard_status_icon( 'check-circle', 'Safe Draco derivative is ready', 'tw-text-emerald-500' );
			return;
		}
		if ( ! empty( $flags['stale-derivative'] ) ) {
			self::render_dashboard_status_icon( 'refresh-cw', 'Safe Draco derivative is stale', 'tw-text-amber-500' );
			return;
		}
		if ( ! empty( $flags['geometry'] ) ) {
			self::render_dashboard_status_icon( 'triangle-alert', 'Safe Draco derivative is recommended', 'tw-text-amber-500' );
			return;
		}
		self::render_dashboard_status_icon( 'circle-minus', $derivative_status ?: 'Safe Draco derivative is not applicable', 'tw-text-slate-300' );
	}

	private static function render_dashboard_compile_icon( array $meta, bool $derivative_ready ): void {
		if ( ! empty( $meta['compileEnabled'] ) && $derivative_ready ) {
			self::render_dashboard_status_icon( 'check-circle', 'Compiled scenes may use this derivative', 'tw-text-emerald-500' );
			return;
		}
		if ( ! empty( $meta['compileEnabled'] ) && ! $derivative_ready ) {
			self::render_dashboard_status_icon( 'x-circle', 'Compile use is enabled but derivative is not ready', 'tw-text-rose-500' );
			return;
		}
		self::render_dashboard_status_icon( 'circle-minus', 'Compile use is off', 'tw-text-slate-300' );
	}

	private static function render_dashboard_compile_toggle( int $asset_id, array $meta, bool $derivative_ready ): void {
		$compile_enabled = ! empty( $meta['compileEnabled'] );
		if ( $compile_enabled && $derivative_ready ) {
			echo '<a href="' . esc_url( self::dashboard_toggle_compile_url( $asset_id, false ) ) . '" class="tw-inline-flex tw-items-center tw-justify-center tw-text-emerald-500 hover:tw-text-emerald-700" title="' . esc_attr__( 'Disable derivative use in compiled scenes', 'vrodos' ) . '" aria-label="' . esc_attr__( 'Disable derivative use in compiled scenes', 'vrodos' ) . '" data-vrodos-dashboard-action="toggle-compile" data-asset-id="' . esc_attr( (string) $asset_id ) . '" data-enabled="0">';
			echo '<i data-lucide="toggle-right" class="tw-w-5 tw-h-5"></i>';
			echo '</a>';
			return;
		}

		if ( $compile_enabled && ! $derivative_ready ) {
			echo '<a href="' . esc_url( self::dashboard_toggle_compile_url( $asset_id, false ) ) . '" class="tw-inline-flex tw-items-center tw-justify-center tw-text-rose-500 hover:tw-text-rose-700" title="' . esc_attr__( 'Disable invalid compile use', 'vrodos' ) . '" aria-label="' . esc_attr__( 'Disable invalid compile use', 'vrodos' ) . '" data-vrodos-dashboard-action="toggle-compile" data-asset-id="' . esc_attr( (string) $asset_id ) . '" data-enabled="0">';
			echo '<i data-lucide="x-circle" class="tw-w-5 tw-h-5"></i>';
			echo '</a>';
			return;
		}

		if ( $derivative_ready ) {
			echo '<a href="' . esc_url( self::dashboard_toggle_compile_url( $asset_id, true ) ) . '" class="tw-inline-flex tw-items-center tw-justify-center tw-text-slate-300 hover:tw-text-emerald-600" title="' . esc_attr__( 'Enable derivative use in compiled scenes', 'vrodos' ) . '" aria-label="' . esc_attr__( 'Enable derivative use in compiled scenes', 'vrodos' ) . '" data-vrodos-dashboard-action="toggle-compile" data-asset-id="' . esc_attr( (string) $asset_id ) . '" data-enabled="1">';
			echo '<i data-lucide="toggle-left" class="tw-w-5 tw-h-5"></i>';
			echo '</a>';
			return;
		}

		self::render_dashboard_status_icon( 'circle-minus', 'Generate a ready derivative before enabling compile use', 'tw-text-slate-300' );
	}

	private static function render_dashboard_status_icon( string $icon, string $title, string $class ): void {
		echo '<span class="tw-inline-flex tw-items-center tw-justify-center" title="' . esc_attr( $title ) . '" aria-label="' . esc_attr( $title ) . '">';
		echo '<i data-lucide="' . esc_attr( $icon ) . '" class="tw-w-4 tw-h-4 ' . esc_attr( $class ) . '"></i>';
		echo '</span>';
	}

	private static function dashboard_refresh_analysis_url( int $asset_id ): string {
		return wp_nonce_url(
			add_query_arg(
				[
					'action'   => 'vrodos_dashboard_refresh_asset_glb_analysis',
					'asset_id' => $asset_id,
				],
				admin_url( 'admin-post.php' )
			),
			'vrodos_dashboard_refresh_asset_glb_analysis_' . $asset_id
		);
	}

	private static function dashboard_optimize_url( int $asset_id ): string {
		return wp_nonce_url(
			add_query_arg(
				[
					'action'   => 'vrodos_dashboard_optimize_asset_glb',
					'asset_id' => $asset_id,
					'profile'  => 'safe-draco',
				],
				admin_url( 'admin-post.php' )
			),
			'vrodos_dashboard_optimize_asset_glb_' . $asset_id
		);
	}

	private static function dashboard_toggle_compile_url( int $asset_id, bool $enabled ): string {
		return wp_nonce_url(
			add_query_arg(
				[
					'action'   => 'vrodos_dashboard_toggle_asset_compile_use',
					'asset_id' => $asset_id,
					'profile'  => 'safe-draco',
					'enabled'  => $enabled ? '1' : '0',
				],
				admin_url( 'admin-post.php' )
			),
			'vrodos_dashboard_toggle_asset_compile_use_' . $asset_id
		);
	}

	private function render_asset_optimization_summary( array $scan ): void {
		$ready_count            = count( $scan['ready'] );
		$missing_count          = count( $scan['missing'] );
		$stale_count            = count( $scan['stale'] );
		$unsupported_count      = count( $scan['unsupported'] );
		$ready_saved_bytes      = (int) ( $scan['readySavedBytes'] ?? 0 );
		$ready_source_bytes     = (int) ( $scan['readySourceBytes'] ?? 0 );
		$ready_derivative_bytes = (int) ( $scan['readyDerivativeBytes'] ?? 0 );

		echo '<table class="widefat striped" style="max-width:760px;margin:16px 0;">';
		echo '<tbody>';
		echo '<tr><th scope="row">' . esc_html__( 'GLB asset posts scanned' ) . '</th><td>' . esc_html( number_format_i18n( (int) $scan['totalAssets'] ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Local GLB assets' ) . '</th><td>' . esc_html( number_format_i18n( (int) $scan['localGlbs'] ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Analyzed GLB assets' ) . '</th><td>' . esc_html( number_format_i18n( (int) $scan['analysisReady'] ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Needs analysis refresh' ) . '</th><td>' . esc_html( number_format_i18n( count( $scan['analysisMissing'] ) + count( $scan['analysisStale'] ) ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Recommended safe Draco candidates' ) . '</th><td>' . esc_html( number_format_i18n( count( $scan['recommendedGeometry'] ) ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Future KTX2 candidates' ) . '</th><td>' . esc_html( number_format_i18n( count( $scan['recommendedTexture'] ) ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Future LOD candidates' ) . '</th><td>' . esc_html( number_format_i18n( count( $scan['recommendedLod'] ) ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Ready safe Draco derivatives' ) . '</th><td>' . esc_html( number_format_i18n( $ready_count ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Missing safe Draco derivatives' ) . '</th><td>' . esc_html( number_format_i18n( $missing_count ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Stale safe Draco derivatives' ) . '</th><td>' . esc_html( number_format_i18n( $stale_count ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Unsupported/non-local assets' ) . '</th><td>' . esc_html( number_format_i18n( $unsupported_count ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Ready derivative savings' ) . '</th><td>' . esc_html( size_format( $ready_saved_bytes, 1 ) ) . ' saved from ' . esc_html( size_format( $ready_source_bytes, 1 ) ) . ' source GLBs';
		if ( $ready_derivative_bytes > 0 ) {
			echo ' (' . esc_html( size_format( $ready_derivative_bytes, 1 ) ) . ' optimized)';
		}
		echo '</td></tr>';
		echo '</tbody>';
		echo '</table>';
	}

	private function render_batch_form( string $profile, string $target, bool $autorun, string $form_id, string $button_label, bool $disabled = false, bool $hidden = false ): void {
		$submit_name = sanitize_key( str_replace( '-', '_', $form_id ) . '_submit' );

		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" id="' . esc_attr( $form_id ) . '" style="' . ( $hidden ? 'display:none;' : 'margin:12px 0;' ) . '">';
		wp_nonce_field( 'vrodos_optimize_missing_glbs' );
		echo '<input type="hidden" name="action" value="vrodos_optimize_missing_glbs">';
		echo '<input type="hidden" name="vrodos_asset_optimization_profile" value="' . esc_attr( $profile ) . '">';
		echo '<input type="hidden" name="vrodos_asset_optimization_target" value="' . esc_attr( $target ) . '">';
		if ( $autorun ) {
			echo '<input type="hidden" name="vrodos_asset_optimization_autorun" value="1">';
		}
		submit_button( $button_label, 'secondary', $submit_name, false, $disabled ? [ 'disabled' => 'disabled' ] : [] );
		echo '</form>';
	}

	private function render_analysis_form( string $target, bool $autorun, string $form_id, string $button_label, bool $disabled = false, bool $hidden = false ): void {
		$submit_name = sanitize_key( str_replace( '-', '_', $form_id ) . '_submit' );

		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" id="' . esc_attr( $form_id ) . '" style="' . ( $hidden ? 'display:none;' : 'margin:12px 0;' ) . '">';
		wp_nonce_field( 'vrodos_refresh_asset_glb_analysis' );
		echo '<input type="hidden" name="action" value="vrodos_refresh_asset_glb_analysis">';
		echo '<input type="hidden" name="vrodos_asset_analysis_target" value="' . esc_attr( $target ) . '">';
		if ( $autorun ) {
			echo '<input type="hidden" name="vrodos_asset_analysis_autorun" value="1">';
		}
		submit_button( $button_label, 'secondary', $submit_name, false, $disabled ? [ 'disabled' => 'disabled' ] : [] );
		echo '</form>';
	}

	private function render_asset_candidate_list( string $title, array $items, string $mode = 'status', int $limit = 10 ): void {
		if ( empty( $items ) ) {
			return;
		}

		echo '<h3>' . esc_html( $title ) . '</h3>';
		echo '<table class="widefat striped" style="max-width:960px;margin-bottom:16px;">';
		echo '<thead><tr><th>' . esc_html__( 'Asset' ) . '</th><th>' . esc_html__( 'Source size' ) . '</th><th>' . esc_html__( 'Status' ) . '</th><th>' . esc_html__( 'Reason' ) . '</th></tr></thead>';
		echo '<tbody>';

		foreach ( array_slice( $items, 0, $limit ) as $item ) {
			$asset_id = (int) ( $item['assetId'] ?? 0 );
			$edit_url = $asset_id > 0 ? get_edit_post_link( $asset_id, 'raw' ) : '';
			$title_text = (string) ( $item['title'] ?? ( $asset_id > 0 ? 'Asset #' . $asset_id : 'Asset' ) );
			echo '<tr>';
			echo '<td>';
			if ( $edit_url ) {
				echo '<a href="' . esc_url( $edit_url ) . '">' . esc_html( $title_text ) . '</a>';
			} else {
				echo esc_html( $title_text );
			}
			if ( $asset_id > 0 ) {
				echo '<br><small>ID ' . esc_html( (string) $asset_id ) . '</small>';
			}
			echo '</td>';
			echo '<td>' . esc_html( size_format( (int) ( $item['sourceSizeBytes'] ?? 0 ), 1 ) ) . '</td>';
			echo '<td>' . esc_html( (string) ( $item['statusLabel'] ?? $item['status'] ?? '' ) ) . '</td>';
			echo '<td>' . esc_html( $this->candidate_reason_text( $item, $mode ) ) . '</td>';
			echo '</tr>';
		}

		echo '</tbody>';
		echo '</table>';

		if ( count( $items ) > $limit ) {
			printf(
				'<p><small>%s</small></p>',
				esc_html(
					sprintf(
						/* translators: %d: number of hidden assets. */
						_n( '%d more asset not shown.', '%d more assets not shown.', count( $items ) - $limit ),
						count( $items ) - $limit
					)
				)
			);
		}
	}

	private function candidate_reason_text( array $item, string $mode ): string {
		if ( 'recommendation' === $mode ) {
			$reasons = $item['recommendationReasons'] ?? [];
			if ( is_array( $reasons ) && ! empty( $reasons ) ) {
				return implode( '; ', array_map( 'strval', $reasons ) );
			}
		}

		return (string) ( $item['reason'] ?? $item['suggestedAction'] ?? $item['status'] ?? '' );
	}

	private function render_batch_report( array $report ): void {
		if ( empty( $report ) ) {
			return;
		}

		$failed_count = count( $report['failed'] ?? [] );
		$class        = $failed_count > 0 ? 'notice-warning' : 'notice-success';

		echo '<div class="notice ' . esc_attr( $class ) . ' inline"><p>';
		printf(
			esc_html__( 'Optimization batch finished: %1$d attempted, %2$d generated, %3$d failed, %4$d remaining.' ),
			(int) ( $report['attempted'] ?? 0 ),
			count( $report['generated'] ?? [] ),
			$failed_count,
			(int) ( $report['remaining'] ?? 0 )
		);
		echo '</p></div>';

		if ( ! empty( $report['generated'] ) ) {
			echo '<ul>';
			foreach ( $report['generated'] as $item ) {
				echo '<li>' . esc_html( (string) $item['title'] ) . ': ' . esc_html( size_format( (int) $item['sourceSizeBytes'], 1 ) ) . ' -> ' . esc_html( size_format( (int) $item['derivativeSizeBytes'], 1 ) ) . ' (' . esc_html( size_format( (int) $item['reductionBytes'], 1 ) ) . ' saved)</li>';
			}
			echo '</ul>';
		}

		if ( ! empty( $report['failed'] ) ) {
			echo '<ul>';
			foreach ( $report['failed'] as $item ) {
				echo '<li><strong>' . esc_html( (string) $item['title'] ) . ':</strong> ' . esc_html( (string) $item['error'] ) . '</li>';
			}
			echo '</ul>';
		}
	}

	private function render_analysis_report( array $report ): void {
		if ( empty( $report ) ) {
			return;
		}

		echo '<div class="notice notice-success inline"><p>';
		printf(
			esc_html__( 'Analysis refresh finished: %1$d analyzed, %2$d unsupported, %3$d remaining.' ),
			count( $report['analyzed'] ?? [] ),
			count( $report['unsupported'] ?? [] ),
			(int) ( $report['remaining'] ?? 0 )
		);
		echo '</p></div>';

		if ( ! empty( $report['unsupported'] ) ) {
			echo '<ul>';
			foreach ( $report['unsupported'] as $item ) {
				echo '<li><strong>' . esc_html( (string) $item['title'] ) . ':</strong> ' . esc_html( (string) $item['error'] ) . '</li>';
			}
			echo '</ul>';
		}
	}

	private function run_derivative_batch( string $profile, string $target, int $limit ): array {
		$scan       = self::scan_glb_derivatives( $profile );
		$candidates = array_slice( $scan[ $target ] ?? [], 0, $limit );
		$report     = [
			'profile'   => $profile,
			'target'    => $target,
			'attempted' => count( $candidates ),
			'generated' => [],
			'failed'    => [],
			'remaining' => count( $scan[ $target ] ?? [] ),
		];

		foreach ( $candidates as $candidate ) {
			$asset_id = (int) ( $candidate['assetId'] ?? 0 );
			$title    = (string) ( $candidate['title'] ?? ( $asset_id > 0 ? 'Asset #' . $asset_id : 'Asset' ) );

			$source = self::get_source_glb( $asset_id );
			if ( is_wp_error( $source ) ) {
				$this->record_error( $asset_id, $source->get_error_message() );
				$report['failed'][] = [
					'assetId' => $asset_id,
					'title'   => $title,
					'error'   => $source->get_error_message(),
				];
				continue;
			}

			$result = $this->generate_derivative( $asset_id, $source, $profile );
			if ( is_wp_error( $result ) ) {
				$this->record_error( $asset_id, $result->get_error_message() );
				$report['failed'][] = [
					'assetId' => $asset_id,
					'title'   => $title,
					'error'   => $result->get_error_message(),
				];
				continue;
			}

			$this->store_derivative_record( $asset_id, $result );
			$record                = $result['record'];
			$report['generated'][] = [
				'assetId'              => $asset_id,
				'title'                => $title,
				'sourceSizeBytes'      => (int) ( $record['sourceSizeBytes'] ?? 0 ),
				'derivativeSizeBytes'  => (int) ( $record['derivativeSizeBytes'] ?? 0 ),
				'reductionBytes'       => (int) ( $record['reductionBytes'] ?? 0 ),
				'reductionPercent'     => is_numeric( $record['reductionPercent'] ?? null ) ? (float) $record['reductionPercent'] : 0.0,
			];
		}

		$updated_scan        = self::scan_glb_derivatives( $profile );
		$report['remaining'] = count( $updated_scan[ $target ] ?? [] );
		return $report;
	}

	private function run_analysis_batch( string $target, int $limit ): array {
		$candidates = array_slice( self::collect_analysis_candidates( $target ), 0, $limit );
		$report     = [
			'target'      => $target,
			'attempted'   => count( $candidates ),
			'analyzed'    => [],
			'unsupported' => [],
			'remaining'   => count( self::collect_analysis_candidates( $target ) ),
		];

		foreach ( $candidates as $candidate ) {
			$asset_id = (int) $candidate['assetId'];
			$result   = self::refresh_asset_analysis( $asset_id );
			if ( is_wp_error( $result ) ) {
				$report['unsupported'][] = [
					'assetId' => $asset_id,
					'title'   => (string) $candidate['title'],
					'error'   => $result->get_error_message(),
				];
				continue;
			}

			$report['analyzed'][] = [
				'assetId'         => $asset_id,
				'title'           => (string) $candidate['title'],
				'suggestedAction' => (string) ( $result['suggestedAction'] ?? '' ),
			];
		}

		$report['remaining'] = count( self::collect_analysis_candidates( $target ) );
		return $report;
	}

	private static function collect_analysis_candidates( string $target ): array {
		$asset_ids = self::collect_glb_asset_ids();

		$candidates = [];
		foreach ( $asset_ids as $asset_id ) {
			$asset_id = (int) $asset_id;
			$source   = self::get_source_glb( $asset_id );
			if ( is_wp_error( $source ) ) {
				continue;
			}

			$analysis = self::get_analysis_meta( $asset_id );
			if ( 'all' !== $target && ! self::analysis_needs_refresh( $analysis, $source ) ) {
				continue;
			}

			$title = get_the_title( $asset_id );
			$candidates[] = [
				'assetId' => $asset_id,
				'title'   => $title ? $title : 'Asset #' . $asset_id,
			];
		}

		return $candidates;
	}

	private static function scan_glb_derivatives( string $profile ): array {
		$asset_ids = self::collect_glb_asset_ids();

		$scan = [
			'profile'               => $profile,
			'totalAssets'           => count( $asset_ids ),
			'localGlbs'             => 0,
			'analysisReady'         => 0,
			'analysisMissing'       => [],
			'analysisStale'         => [],
			'recommended'           => [],
			'recommendedGeometry'   => [],
			'recommendedTexture'    => [],
			'recommendedLod'        => [],
			'lowBenefit'            => [],
			'ready'                 => [],
			'missing'               => [],
			'stale'                 => [],
			'unsupported'           => [],
			'readySavedBytes'       => 0,
			'readySourceBytes'      => 0,
			'readyDerivativeBytes'  => 0,
		];

		foreach ( $asset_ids as $asset_id ) {
			$asset_id = (int) $asset_id;
			$title    = get_the_title( $asset_id );
			$title    = $title ? $title : 'Asset #' . $asset_id;
			$source   = self::get_source_glb( $asset_id );
			$item     = [
				'assetId' => $asset_id,
				'title'   => $title,
			];

			if ( is_wp_error( $source ) ) {
				$item['status'] = 'unsupported';
				$item['reason'] = $source->get_error_message();
				$scan['unsupported'][] = $item;
				continue;
			}

			++$scan['localGlbs'];
			$item['sourceUrl']       = (string) $source['url'];
			$item['sourceSizeBytes'] = (int) $source['sizeBytes'];

			$meta       = self::get_derivative_meta( $asset_id );
			$derivative = $meta['derivatives'][ $profile ] ?? null;
			$derivative_status = 'missing';
			if ( ! is_array( $derivative ) ) {
				$item['status'] = 'missing';
				$item['statusLabel'] = 'Missing derivative';
				$item['reason'] = 'No derivative generated yet.';
				$scan['missing'][] = $item;
			} else {
				$reason = self::derivative_unusable_reason( $derivative, (string) $source['url'] );
				if ( '' !== $reason ) {
					$derivative_status = 'stale';
					$item['status'] = 'stale';
					$item['statusLabel'] = 'Stale derivative';
					$item['reason'] = $reason;
					$scan['stale'][] = $item;
				} else {
					$derivative_status = 'ready';
					$item['status']              = 'ready';
					$item['statusLabel']         = 'Ready derivative';
					$item['derivativeSizeBytes'] = (int) ( $derivative['derivativeSizeBytes'] ?? 0 );
					$item['reductionBytes']      = (int) ( $derivative['reductionBytes'] ?? 0 );
					$item['reductionPercent']    = is_numeric( $derivative['reductionPercent'] ?? null ) ? (float) $derivative['reductionPercent'] : 0.0;
					$scan['readySavedBytes']    += (int) $item['reductionBytes'];
					$scan['readySourceBytes']   += (int) ( $derivative['sourceSizeBytes'] ?? $item['sourceSizeBytes'] );
					$scan['readyDerivativeBytes'] += (int) $item['derivativeSizeBytes'];
					$scan['ready'][]             = $item;
				}
			}

			$analysis = self::get_analysis_meta( $asset_id );
			if ( empty( $analysis ) ) {
				$analysis_item = $item;
				$analysis_item['statusLabel'] = 'Needs analysis';
				$analysis_item['reason'] = 'No saved GLB analysis yet.';
				$scan['analysisMissing'][] = $analysis_item;
				continue;
			}

			if ( self::analysis_needs_refresh( $analysis, $source ) ) {
				$analysis_item = $item;
				$analysis_item['statusLabel'] = 'Stale analysis';
				$analysis_item['reason'] = 'Source GLB changed since the saved analysis.';
				$scan['analysisStale'][] = $analysis_item;
				continue;
			}

			++$scan['analysisReady'];
			$item['analysis'] = $analysis;
			$item['recommendationReasons'] = self::analysis_reason_labels( $analysis );
			$item['suggestedAction'] = (string) ( $analysis['suggestedAction'] ?? '' );
			$item['recommendationScore'] = self::analysis_priority_score( $analysis );

			if ( ! empty( $analysis['recommendations']['geometryDerivative'] ) && 'ready' !== $derivative_status ) {
				$scan['recommendedGeometry'][] = $item;
				$scan['recommended'][] = $item;
			}
			if ( ! empty( $analysis['recommendations']['textureDerivative'] ) ) {
				$scan['recommendedTexture'][] = $item;
			}
			if ( ! empty( $analysis['recommendations']['lodDerivative'] ) ) {
				$scan['recommendedLod'][] = $item;
			}
			if (
				empty( $analysis['recommendations']['geometryDerivative'] )
				&& empty( $analysis['recommendations']['textureDerivative'] )
				&& empty( $analysis['recommendations']['lodDerivative'] )
			) {
				$scan['lowBenefit'][] = $item;
			}
		}

		foreach ( [ 'recommended', 'recommendedGeometry', 'recommendedTexture', 'recommendedLod', 'lowBenefit' ] as $key ) {
			usort(
				$scan[ $key ],
				static fn( array $a, array $b ): int => (int) ( $b['recommendationScore'] ?? 0 ) <=> (int) ( $a['recommendationScore'] ?? 0 )
			);
		}

		return $scan;
	}

	private static function collect_glb_asset_ids(): array {
		$asset_ids = get_posts(
			[
				'post_type'      => 'vrodos_asset3d',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'orderby'        => 'ID',
				'order'          => 'ASC',
				'no_found_rows'  => true,
			]
		);

		return array_values(
			array_filter(
				array_map( 'intval', $asset_ids ),
				static fn( int $asset_id ): bool => self::asset_has_glb_source_reference( $asset_id )
			)
		);
	}

	private static function asset_has_glb_source_reference( int $asset_id ): bool {
		$source_meta = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
		$source_url  = VRodos_Core_Manager::resolve_media_meta_url( $source_meta );

		if ( '' !== $source_url && 'glb' === strtolower( pathinfo( (string) wp_parse_url( self::strip_url_query_fragment( $source_url ), PHP_URL_PATH ), PATHINFO_EXTENSION ) ) ) {
			return true;
		}

		if ( is_numeric( $source_meta ) ) {
			$source_path = get_attached_file( (int) $source_meta );
			return is_string( $source_path ) && 'glb' === strtolower( pathinfo( $source_path, PATHINFO_EXTENSION ) );
		}

		return false;
	}

	private function store_batch_report( array $report ): string {
		$key = wp_generate_password( 12, false, false );
		set_transient( self::BATCH_TRANSIENT_PREFIX . $key, $report, 15 * MINUTE_IN_SECONDS );
		return $key;
	}

	private function read_batch_report_from_request(): array {
		$key = isset( $_GET['vrodos_asset_batch_report'] ) ? sanitize_key( (string) wp_unslash( $_GET['vrodos_asset_batch_report'] ) ) : '';
		if ( '' === $key ) {
			return [];
		}

		$report = get_transient( self::BATCH_TRANSIENT_PREFIX . $key );
		return is_array( $report ) ? $report : [];
	}

	private function read_analysis_report_from_request(): array {
		$key = isset( $_GET['vrodos_asset_analysis_report'] ) ? sanitize_key( (string) wp_unslash( $_GET['vrodos_asset_analysis_report'] ) ) : '';
		if ( '' === $key ) {
			return [];
		}

		$report = get_transient( self::BATCH_TRANSIENT_PREFIX . $key );
		return is_array( $report ) ? $report : [];
	}

	private static function settings_tab_url( array $args = [] ): string {
		return add_query_arg(
			array_merge(
				[
					'page' => self::SETTINGS_PAGE_KEY,
					'tab'  => self::SETTINGS_TAB_KEY,
				],
				$args
			),
			admin_url( 'admin.php' )
		);
	}

	private static function dashboard_url( array $args = [] ): string {
		return add_query_arg(
			array_merge(
				[
					'page'                 => 'vrodos-plugin',
					'vrodos_dashboard_tab' => 'assets',
				],
				$args
			),
			admin_url( 'admin.php' )
		);
	}

	private static function set_asset_compile_use( int $asset_id, string $profile, bool $enabled ) {
		if ( ! isset( self::supported_profiles()[ $profile ] ) ) {
			return new WP_Error( 'vrodos_invalid_derivative_profile', __( 'Unsupported derivative profile.', 'vrodos' ) );
		}

		$meta = self::get_derivative_meta( $asset_id );
		if ( $enabled ) {
			$source = self::get_source_glb( $asset_id );
			$derivative = $meta['derivatives'][ $profile ] ?? null;
			if ( is_wp_error( $source ) || ! is_array( $derivative ) || ! self::is_derivative_usable( $derivative, (string) $source['url'] ) ) {
				return new WP_Error( 'vrodos_derivative_not_ready', __( 'The derivative is not ready for compiled-scene use.', 'vrodos' ) );
			}

			$meta['activeProfile'] = $profile;
			$meta['compileEnabled'] = true;
			update_post_meta( $asset_id, self::META_KEY, $meta );
			return true;
		}

		$meta['compileEnabled'] = false;
		update_post_meta( $asset_id, self::META_KEY, $meta );
		return true;
	}

	private static function supported_profiles(): array {
		return [
			'safe-draco'   => 'Safe Draco',
			'safe-meshopt' => 'Safe Meshopt',
		];
	}

	private static function get_analysis_meta( int $asset_id ): array {
		$raw = get_post_meta( $asset_id, self::ANALYSIS_META_KEY, true );
		return is_array( $raw ) ? $raw : [];
	}

	private static function refresh_asset_analysis( int $asset_id ) {
		$source = self::get_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			$record = self::build_analysis_error_record( $source->get_error_message() );
			update_post_meta( $asset_id, self::ANALYSIS_META_KEY, $record );
			return $source;
		}

		$analysis = self::build_glb_analysis( $source );
		if ( is_wp_error( $analysis ) ) {
			$record = self::build_analysis_error_record( $analysis->get_error_message(), $source );
			update_post_meta( $asset_id, self::ANALYSIS_META_KEY, $record );
			return $analysis;
		}

		update_post_meta( $asset_id, self::ANALYSIS_META_KEY, $analysis );
		return $analysis;
	}

	private static function build_analysis_error_record( string $message, ?array $source = null ): array {
		return [
			'schemaVersion'     => 1,
			'status'            => 'unsupported',
			'error'             => wp_strip_all_tags( $message ),
			'sourceUrl'         => isset( $source['url'] ) ? esc_url_raw( (string) $source['url'] ) : '',
			'sourcePath'        => isset( $source['path'] ) ? wp_normalize_path( (string) $source['path'] ) : '',
			'sourceSizeBytes'   => isset( $source['sizeBytes'] ) ? (int) $source['sizeBytes'] : 0,
			'sourceMtime'       => isset( $source['path'] ) && is_file( (string) $source['path'] ) ? (int) filemtime( (string) $source['path'] ) : 0,
			'sourceFingerprint' => isset( $source['path'] ) ? self::source_fingerprint( $source ) : '',
			'flags'             => [],
			'recommendations'   => self::empty_recommendations(),
			'reasons'           => [],
			'suggestedAction'   => 'Unsupported for automatic analysis.',
			'analyzedAt'        => current_time( 'mysql', true ),
		];
	}

	private static function build_glb_analysis( array $source ) {
		$gltf = self::read_glb_json( (string) $source['path'] );
		if ( is_wp_error( $gltf ) ) {
			return $gltf;
		}

		$analysis = self::analyze_gltf_json( $gltf );
		$analysis['schemaVersion']     = 1;
		$analysis['status']            = 'analyzed';
		$analysis['sourceUrl']         = esc_url_raw( (string) $source['url'] );
		$analysis['sourcePath']        = wp_normalize_path( (string) $source['path'] );
		$analysis['sourceSizeBytes']   = (int) $source['sizeBytes'];
		$analysis['sourceMtime']       = is_file( (string) $source['path'] ) ? (int) filemtime( (string) $source['path'] ) : 0;
		$analysis['sourceFingerprint'] = self::source_fingerprint( $source );
		$analysis['analyzedAt']        = current_time( 'mysql', true );

		$recommendation = self::recommendations_for_analysis( $analysis );
		return array_merge( $analysis, $recommendation );
	}

	private static function source_fingerprint( array $source ): string {
		$path  = (string) ( $source['path'] ?? '' );
		$mtime = is_file( $path ) ? (int) filemtime( $path ) : 0;
		return sha1(
			implode(
				'|',
				[
					self::normalize_url_path( (string) ( $source['url'] ?? '' ) ),
					wp_normalize_path( $path ),
					(string) ( (int) ( $source['sizeBytes'] ?? 0 ) ),
					(string) $mtime,
				]
			)
		);
	}

	private static function read_glb_json( string $path ) {
		$handle = fopen( $path, 'rb' );
		if ( false === $handle ) {
			return new WP_Error( 'vrodos_glb_analysis_open_failed', 'Could not open GLB for analysis.' );
		}

		$header = fread( $handle, 12 );
		if ( ! is_string( $header ) || strlen( $header ) < 12 ) {
			fclose( $handle );
			return new WP_Error( 'vrodos_glb_analysis_short_header', 'GLB header is incomplete.' );
		}

		if ( substr( $header, 0, 4 ) !== self::GLB_MAGIC ) {
			fclose( $handle );
			return new WP_Error( 'vrodos_glb_analysis_bad_magic', 'File is not a binary GLB.' );
		}

		$version = self::read_uint32_le( substr( $header, 4, 4 ) );
		$length  = self::read_uint32_le( substr( $header, 8, 4 ) );
		if ( self::GLB_VERSION !== $version ) {
			fclose( $handle );
			return new WP_Error( 'vrodos_glb_analysis_bad_version', 'Only GLB version 2 can be analyzed.' );
		}

		$offset = 12;
		while ( $offset + 8 <= $length && ! feof( $handle ) ) {
			$chunk_header = fread( $handle, 8 );
			if ( ! is_string( $chunk_header ) || strlen( $chunk_header ) < 8 ) {
				break;
			}

			$chunk_length = self::read_uint32_le( substr( $chunk_header, 0, 4 ) );
			$chunk_type   = self::read_uint32_le( substr( $chunk_header, 4, 4 ) );
			$offset      += 8;

			if ( self::GLB_JSON_CHUNK === $chunk_type ) {
				$json_text = fread( $handle, $chunk_length );
				fclose( $handle );
				if ( ! is_string( $json_text ) ) {
					return new WP_Error( 'vrodos_glb_analysis_json_read_failed', 'Could not read GLB JSON chunk.' );
				}

				$decoded = json_decode( trim( $json_text ), true );
				if ( ! is_array( $decoded ) ) {
					return new WP_Error( 'vrodos_glb_analysis_json_invalid', 'GLB JSON chunk is invalid.' );
				}

				return $decoded;
			}

			if ( 0 !== fseek( $handle, $chunk_length, SEEK_CUR ) ) {
				fclose( $handle );
				return new WP_Error( 'vrodos_glb_analysis_seek_failed', 'GLB chunk table is invalid.' );
			}
			$offset += $chunk_length;
		}

		fclose( $handle );
		return new WP_Error( 'vrodos_glb_analysis_json_missing', 'GLB does not contain a JSON chunk.' );
	}

	private static function read_uint32_le( string $bytes ): int {
		$value = unpack( 'Vvalue', $bytes );
		return is_array( $value ) ? (int) $value['value'] : 0;
	}

	private static function analyze_gltf_json( array $gltf ): array {
		$meshes       = is_array( $gltf['meshes'] ?? null ) ? $gltf['meshes'] : [];
		$nodes        = is_array( $gltf['nodes'] ?? null ) ? $gltf['nodes'] : [];
		$materials    = is_array( $gltf['materials'] ?? null ) ? $gltf['materials'] : [];
		$textures     = is_array( $gltf['textures'] ?? null ) ? $gltf['textures'] : [];
		$images       = is_array( $gltf['images'] ?? null ) ? $gltf['images'] : [];
		$animations   = is_array( $gltf['animations'] ?? null ) ? $gltf['animations'] : [];
		$buffers      = is_array( $gltf['buffers'] ?? null ) ? $gltf['buffers'] : [];
		$buffer_views = is_array( $gltf['bufferViews'] ?? null ) ? $gltf['bufferViews'] : [];
		$accessors    = is_array( $gltf['accessors'] ?? null ) ? $gltf['accessors'] : [];
		$extensions   = self::extension_set( $gltf );
		$used_materials = [];
		$geometry_buffer_views = [];
		$image_buffer_views = [];
		$primitive_count = 0;
		$indexed_primitive_count = 0;
		$vertex_count = 0;
		$submitted_vertex_count = 0;
		$estimated_triangles = 0;
		$max_primitive_submitted_count = 0;
		$max_primitive_triangles = 0;

		foreach ( $meshes as $mesh ) {
			foreach ( is_array( $mesh['primitives'] ?? null ) ? $mesh['primitives'] : [] as $primitive ) {
				if ( ! is_array( $primitive ) ) {
					continue;
				}
				++$primitive_count;
				$mode = isset( $primitive['mode'] ) ? (int) $primitive['mode'] : self::GLTF_TRIANGLES_MODE;
				if ( isset( $primitive['indices'] ) ) {
					++$indexed_primitive_count;
					$buffer_view = self::accessor_buffer_view( $accessors, (int) $primitive['indices'] );
					if ( null !== $buffer_view ) {
						$geometry_buffer_views[ $buffer_view ] = true;
					}
				}
				if ( isset( $primitive['material'] ) ) {
					$used_materials[ (int) $primitive['material'] ] = true;
				}
				foreach ( is_array( $primitive['attributes'] ?? null ) ? $primitive['attributes'] : [] as $accessor_index ) {
					$buffer_view = self::accessor_buffer_view( $accessors, (int) $accessor_index );
					if ( null !== $buffer_view ) {
						$geometry_buffer_views[ $buffer_view ] = true;
					}
				}
				foreach ( array_keys( is_array( $primitive['extensions'] ?? null ) ? $primitive['extensions'] : [] ) as $extension_name ) {
					$extensions[ (string) $extension_name ] = true;
				}

				$submitted = self::primitive_submitted_count( $accessors, $primitive );
				$vertices  = self::primitive_vertex_count( $accessors, $primitive );
				$triangles = self::estimate_primitive_triangles( $mode, $submitted );
				$submitted_vertex_count += $submitted;
				$vertex_count += $vertices;
				$estimated_triangles += $triangles;
				$max_primitive_submitted_count = max( $max_primitive_submitted_count, $submitted );
				$max_primitive_triangles = max( $max_primitive_triangles, $triangles );
			}
		}

		foreach ( $images as $image ) {
			if ( is_array( $image ) && isset( $image['bufferView'] ) ) {
				$image_buffer_views[ (int) $image['bufferView'] ] = true;
			}
		}

		$buffer_bytes = 0;
		foreach ( $buffers as $buffer ) {
			$buffer_bytes += is_array( $buffer ) ? (int) ( $buffer['byteLength'] ?? 0 ) : 0;
		}

		$geometry_bytes = self::sum_buffer_view_bytes( $buffer_views, array_keys( $geometry_buffer_views ) );
		$image_bytes    = self::sum_buffer_view_bytes( $buffer_views, array_keys( $image_buffer_views ) );
		$extension_names = array_keys( $extensions );
		sort( $extension_names );

		return [
			'assetVersion' => (string) ( $gltf['asset']['version'] ?? '' ),
			'generator'    => (string) ( $gltf['asset']['generator'] ?? '' ),
			'counts'       => [
				'nodes'             => count( $nodes ),
				'meshes'            => count( $meshes ),
				'primitives'        => $primitive_count,
				'indexedPrimitives' => $indexed_primitive_count,
				'materials'         => count( $materials ),
				'usedMaterials'     => count( $used_materials ),
				'textures'          => count( $textures ),
				'images'            => count( $images ),
				'animations'        => count( $animations ),
			],
			'geometry'     => [
				'estimatedTriangles'          => $estimated_triangles,
				'vertexCount'                 => $vertex_count,
				'submittedVertexCount'        => $submitted_vertex_count,
				'maxPrimitiveSubmittedCount'  => $max_primitive_submitted_count,
				'maxPrimitiveTriangles'       => $max_primitive_triangles,
				'estimatedGeometryBytes'      => $geometry_bytes,
			],
			'payload'      => [
				'declaredBufferBytes' => $buffer_bytes,
				'estimatedImageBytes' => $image_bytes,
			],
			'extensions'   => [
				'used'                   => $extension_names,
				'hasMeshopt'             => ! empty( $extensions['EXT_meshopt_compression'] ),
				'hasDraco'               => ! empty( $extensions['KHR_draco_mesh_compression'] ),
				'hasKtx2'                => ! empty( $extensions['KHR_texture_basisu'] ),
				'hasGeometryCompression' => ! empty( $extensions['EXT_meshopt_compression'] ) || ! empty( $extensions['KHR_draco_mesh_compression'] ),
				'hasTextureCompression'  => ! empty( $extensions['KHR_texture_basisu'] ),
			],
		];
	}

	private static function extension_set( array $gltf ): array {
		$extensions = [];
		foreach ( [ 'extensionsUsed', 'extensionsRequired' ] as $key ) {
			foreach ( is_array( $gltf[ $key ] ?? null ) ? $gltf[ $key ] : [] as $extension_name ) {
				$extensions[ (string) $extension_name ] = true;
			}
		}
		return $extensions;
	}

	private static function accessor_buffer_view( array $accessors, int $accessor_index ): ?int {
		if ( ! isset( $accessors[ $accessor_index ] ) || ! is_array( $accessors[ $accessor_index ] ) ) {
			return null;
		}
		return isset( $accessors[ $accessor_index ]['bufferView'] ) ? (int) $accessors[ $accessor_index ]['bufferView'] : null;
	}

	private static function sum_buffer_view_bytes( array $buffer_views, array $indices ): int {
		$total = 0;
		foreach ( $indices as $index ) {
			if ( isset( $buffer_views[ $index ] ) && is_array( $buffer_views[ $index ] ) ) {
				$total += (int) ( $buffer_views[ $index ]['byteLength'] ?? 0 );
			}
		}
		return $total;
	}

	private static function primitive_submitted_count( array $accessors, array $primitive ): int {
		if ( isset( $primitive['indices'] ) && isset( $accessors[ (int) $primitive['indices'] ] ) && is_array( $accessors[ (int) $primitive['indices'] ] ) ) {
			return (int) ( $accessors[ (int) $primitive['indices'] ]['count'] ?? 0 );
		}

		$position = $primitive['attributes']['POSITION'] ?? null;
		if ( null !== $position && isset( $accessors[ (int) $position ] ) && is_array( $accessors[ (int) $position ] ) ) {
			return (int) ( $accessors[ (int) $position ]['count'] ?? 0 );
		}

		return 0;
	}

	private static function primitive_vertex_count( array $accessors, array $primitive ): int {
		$position = $primitive['attributes']['POSITION'] ?? null;
		if ( null !== $position && isset( $accessors[ (int) $position ] ) && is_array( $accessors[ (int) $position ] ) ) {
			return (int) ( $accessors[ (int) $position ]['count'] ?? 0 );
		}
		return 0;
	}

	private static function estimate_primitive_triangles( int $mode, int $submitted_count ): int {
		if ( $submitted_count <= 0 ) {
			return 0;
		}
		if ( self::GLTF_TRIANGLES_MODE === $mode ) {
			return (int) floor( $submitted_count / 3 );
		}
		if ( self::GLTF_TRIANGLE_STRIP_MODE === $mode || self::GLTF_TRIANGLE_FAN_MODE === $mode ) {
			return max( 0, $submitted_count - 2 );
		}
		return 0;
	}

	private static function recommendations_for_analysis( array $analysis ): array {
		$size_bytes     = (int) ( $analysis['sourceSizeBytes'] ?? 0 );
		$triangles      = (int) ( $analysis['geometry']['estimatedTriangles'] ?? 0 );
		$primitives     = (int) ( $analysis['counts']['primitives'] ?? 0 );
		$materials      = (int) ( $analysis['counts']['usedMaterials'] ?? $analysis['counts']['materials'] ?? 0 );
		$images         = (int) ( $analysis['counts']['images'] ?? 0 );
		$geometry_bytes = (int) ( $analysis['geometry']['estimatedGeometryBytes'] ?? 0 );
		$image_bytes    = (int) ( $analysis['payload']['estimatedImageBytes'] ?? 0 );
		$extensions     = is_array( $analysis['extensions'] ?? null ) ? $analysis['extensions'] : [];
		$flags          = [];
		$reasons        = [];
		$recommendations = self::empty_recommendations();

		if ( $size_bytes >= 50 * 1024 * 1024 ) {
			$flags[] = 'very_large_file';
		} elseif ( $size_bytes >= 20 * 1024 * 1024 ) {
			$flags[] = 'large_file';
		}
		if ( $triangles >= 500000 ) {
			$flags[] = 'high_triangles';
		} elseif ( $triangles >= 100000 ) {
			$flags[] = 'moderate_high_triangles';
		}
		if ( $primitives >= 100 ) {
			$flags[] = 'many_primitives';
		}
		if ( $materials >= 20 ) {
			$flags[] = 'many_materials';
		}

		$geometry_meaningful = $geometry_bytes >= 1024 * 1024 || $triangles >= 50000 || $primitives >= 50 || ( $size_bytes >= 5 * 1024 * 1024 && $triangles >= 10000 );
		if ( empty( $extensions['hasGeometryCompression'] ) && $geometry_meaningful ) {
			$flags[] = 'missing_geometry_compression';
			$recommendations['geometryDerivative'] = true;
			$reasons[] = 'Source has meaningful geometry and no Draco/Meshopt compression.';
		}

		$texture_payload_likely = $image_bytes >= 8 * 1024 * 1024
			|| ( $size_bytes >= 20 * 1024 * 1024 && $images > 0 && ( 0 === $geometry_bytes || $geometry_bytes < (int) ( $size_bytes * 0.45 ) ) );
		if ( $images > 0 && empty( $extensions['hasTextureCompression'] ) && $texture_payload_likely ) {
			$flags[] = 'missing_texture_compression';
			$recommendations['textureDerivative'] = true;
			$reasons[] = 'Texture payload appears significant and no KTX2/Basis texture compression is present.';
		}

		if ( $triangles >= 100000 || $primitives >= 100 || (int) ( $analysis['geometry']['maxPrimitiveTriangles'] ?? 0 ) >= 50000 ) {
			$flags[] = 'lod_candidate';
			$recommendations['lodDerivative'] = true;
			$reasons[] = 'Geometry is large enough to benefit from explicit distance-based LOD candidates.';
		}

		if ( ! $recommendations['geometryDerivative'] && ! $recommendations['textureDerivative'] && ! $recommendations['lodDerivative'] ) {
			$reasons[] = empty( $extensions['hasGeometryCompression'] ) ? 'No high-benefit derivative target was detected.' : 'Geometry compression is already present or the asset is small.';
		}

		return [
			'flags'           => array_values( array_unique( $flags ) ),
			'recommendations' => $recommendations,
			'reasons'         => $reasons,
			'suggestedAction' => self::suggested_action_for_recommendations( $recommendations ),
		];
	}

	private static function empty_recommendations(): array {
		return [
			'geometryDerivative' => false,
			'textureDerivative'  => false,
			'lodDerivative'      => false,
		];
	}

	private static function suggested_action_for_recommendations( array $recommendations ): string {
		if ( ! empty( $recommendations['geometryDerivative'] ) ) {
			return 'Generate a safe Draco derivative first.';
		}
		if ( ! empty( $recommendations['textureDerivative'] ) ) {
			return 'Plan a KTX2/Basis texture derivative.';
		}
		if ( ! empty( $recommendations['lodDerivative'] ) ) {
			return 'Plan explicit LOD derivatives and distance bands.';
		}
		return 'No derivative is recommended by the cheap analysis.';
	}

	private static function analysis_needs_refresh( array $analysis, array $source ): bool {
		if ( empty( $analysis ) || ( $analysis['sourceFingerprint'] ?? '' ) !== self::source_fingerprint( $source ) ) {
			return true;
		}
		return false;
	}

	private static function analysis_reason_labels( array $analysis ): array {
		$reasons = $analysis['reasons'] ?? [];
		return is_array( $reasons ) ? array_map( 'strval', $reasons ) : [];
	}

	private static function analysis_priority_score( array $analysis ): int {
		$size_bytes = (int) ( $analysis['sourceSizeBytes'] ?? 0 );
		$triangles  = (int) ( $analysis['geometry']['estimatedTriangles'] ?? 0 );
		$primitives = (int) ( $analysis['counts']['primitives'] ?? 0 );
		$materials  = (int) ( $analysis['counts']['usedMaterials'] ?? $analysis['counts']['materials'] ?? 0 );
		$image_bytes = (int) ( $analysis['payload']['estimatedImageBytes'] ?? 0 );

		return $size_bytes + ( $triangles * 100 ) + ( $primitives * 100000 ) + ( $materials * 500000 ) + $image_bytes;
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
		$dir     = self::derivative_cache_dir( $asset_id );
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

	private static function derivative_cache_dir( int $asset_id ): string {
		$uploads = wp_upload_dir();
		return wp_normalize_path( trailingslashit( $uploads['basedir'] ) . 'vrodos-optimized-assets/asset-' . $asset_id );
	}

	private static function optimized_assets_base_dir(): string {
		$uploads = wp_upload_dir();
		return wp_normalize_path( trailingslashit( $uploads['basedir'] ) . 'vrodos-optimized-assets' );
	}

	private static function delete_asset_derivative_cache( int $asset_id ): void {
		if ( $asset_id <= 0 ) {
			return;
		}

		$dir = self::derivative_cache_dir( $asset_id );
		if ( self::is_safe_derivative_cache_dir( $dir, $asset_id ) && is_dir( $dir ) ) {
			self::delete_directory_tree( $dir );
		}

		delete_post_meta( $asset_id, self::META_KEY );
		delete_post_meta( $asset_id, self::ANALYSIS_META_KEY );
	}

	private static function is_safe_derivative_cache_dir( string $dir, int $asset_id ): bool {
		$base = self::optimized_assets_base_dir();
		$expected = wp_normalize_path( trailingslashit( $base ) . 'asset-' . $asset_id );

		if ( $dir !== $expected ) {
			return false;
		}

		$real_base = realpath( $base );
		$real_dir  = realpath( $dir );
		if ( ! is_string( $real_base ) || ! is_string( $real_dir ) ) {
			return false;
		}

		$real_base = wp_normalize_path( $real_base );
		$real_dir  = wp_normalize_path( $real_dir );

		return str_starts_with( $real_dir, trailingslashit( $real_base ) );
	}

	private static function delete_directory_tree( string $dir ): void {
		$entries = scandir( $dir );
		if ( false === $entries ) {
			return;
		}

		foreach ( $entries as $entry ) {
			if ( '.' === $entry || '..' === $entry ) {
				continue;
			}

			$path = $dir . DIRECTORY_SEPARATOR . $entry;
			if ( is_link( $path ) || is_file( $path ) ) {
				wp_delete_file( $path );
				continue;
			}

			if ( is_dir( $path ) ) {
				self::delete_directory_tree( $path );
			}
		}

		@rmdir( $dir );
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
		return '' === self::derivative_unusable_reason( $derivative, $source_url );
	}

	private static function derivative_unusable_reason( array $derivative, string $source_url ): string {
		if ( ( $derivative['status'] ?? '' ) !== 'ready' || empty( $derivative['url'] ) ) {
			return 'Derivative is not marked ready.';
		}

		if ( ! empty( $derivative['path'] ) && ! is_file( (string) $derivative['path'] ) ) {
			return 'Derivative file is missing.';
		}

		$derivative_source = (string) ( $derivative['sourceUrl'] ?? '' );
		if ( '' !== $derivative_source && self::normalize_url_path( $derivative_source ) !== self::normalize_url_path( $source_url ) ) {
			return 'Source GLB URL has changed since the derivative was generated.';
		}

		return '';
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
