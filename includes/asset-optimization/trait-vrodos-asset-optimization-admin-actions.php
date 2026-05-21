<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_Optimization_Admin_Actions {
	public function register_settings_tab( array $tabs ): array {
		$tabs[ self::SETTINGS_TAB_KEY ] = __( 'Assets' );
		return $tabs;
	}

	public function handle_asset_glb_meta_change( $meta_id, int $asset_id, string $meta_key, $meta_value ): void {
		unset( $meta_id, $meta_value );

		if ( 'vrodos_asset3d_glb' !== $meta_key || get_post_type( $asset_id ) !== 'vrodos_asset3d' ) {
			return;
		}

		$analysis = self::refresh_asset_analysis( $asset_id );
		if ( ! is_wp_error( $analysis ) ) {
			$source = self::get_source_glb( $asset_id );
			if ( ! is_wp_error( $source ) ) {
				$decision = self::editor_preview_decision( (int) $source['sizeBytes'], is_array( $analysis ) ? $analysis : [] );
				if ( ! empty( $decision['shouldPreview'] ) ) {
					self::maybe_queue_editor_preview( $asset_id, $source, is_array( $analysis ) ? $analysis : [], $decision );
				}
			}
		}
	}

	public function handle_asset_glb_meta_delete( $meta_ids, int $asset_id, string $meta_key, $meta_value ): void {
		unset( $meta_ids, $meta_value );

		if ( 'vrodos_asset3d_glb' !== $meta_key || get_post_type( $asset_id ) !== 'vrodos_asset3d' ) {
			return;
		}

		delete_post_meta( $asset_id, self::ANALYSIS_META_KEY );
		self::store_editor_preview_record(
			$asset_id,
			[
				'status'  => 'none',
				'url'     => '',
				'path'    => '',
				'file'    => '',
				'message' => 'Asset has no GLB source for editor preview.',
			]
		);
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
			static fn( $derivative ) => is_array( $derivative ) && ( $derivative['status'] ?? '' ) === 'ready' && empty( $derivative['editorOnly'] )
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
						? __( 'Compiled scenes will use the active derivative for this asset.', 'vrodos' )
						: __( 'Compiled scenes will use the original GLB for this asset.', 'vrodos' ),
				],
				self::dashboard_asset_row_state( $asset_id )
			)
		);
	}
}
