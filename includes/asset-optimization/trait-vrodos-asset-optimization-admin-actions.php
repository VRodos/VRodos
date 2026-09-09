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
		$previous_snapshot = self::read_source_snapshot( $asset_id );
		$previous_meta = get_post_meta( $asset_id, self::META_KEY, true );
		$source = self::get_source_glb( $asset_id );
		if ( is_wp_error( $source ) ) {
			return;
		}
		$content_changed = '' !== (string) ( $previous_snapshot['sha256'] ?? '' )
			&& (string) $previous_snapshot['sha256'] !== (string) ( $source['sha256'] ?? '' );
		$attachment_changed = absint( $previous_snapshot['attachmentId'] ?? 0 ) > 0
			&& absint( $previous_snapshot['attachmentId'] ?? 0 ) !== absint( $source['attachmentId'] ?? 0 );
		$legacy_records = is_array( $previous_meta ) && 2 !== absint( $previous_meta['schemaVersion'] ?? 0 );
		if ( $content_changed || $attachment_changed || $legacy_records ) {
			self::cancel_asset_optimization_jobs( $asset_id );
		}
		if ( $content_changed || $legacy_records ) {
			self::delete_asset_derivative_cache( $asset_id );
		}

		$analysis = self::refresh_asset_analysis( $asset_id );
		if ( ! is_wp_error( $analysis ) ) {
			self::maybe_queue_web_high( $asset_id, $source, is_array( $analysis ) ? $analysis : [] );
			$decision = self::editor_preview_decision( (int) $source['sizeBytes'], is_array( $analysis ) ? $analysis : [] );
			if ( ! empty( $decision['shouldPreview'] ) ) {
				self::maybe_queue_editor_preview( $asset_id, $source, is_array( $analysis ) ? $analysis : [], $decision );
			}
		}
	}

	public function handle_asset_glb_meta_delete( $meta_ids, int $asset_id, string $meta_key, $meta_value ): void {
		unset( $meta_ids, $meta_value );

		if ( 'vrodos_asset3d_glb' !== $meta_key || get_post_type( $asset_id ) !== 'vrodos_asset3d' ) {
			return;
		}

		self::cancel_asset_optimization_jobs( $asset_id );
		self::delete_asset_derivative_cache( $asset_id );
		delete_post_meta( $asset_id, self::SOURCE_META_KEY );
	}

	public function handle_asset_delete( int $post_id, WP_Post $post ): void {
		if ( 'vrodos_asset3d' !== $post->post_type ) {
			return;
		}

		self::cancel_asset_optimization_jobs( $post_id );
		self::delete_asset_derivative_cache( $post_id );
		delete_post_meta( $post_id, self::SOURCE_META_KEY );
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

		$notice = isset( $_GET['vrodos_optimize_notice'] ) ? sanitize_key( (string) wp_unslash( $_GET['vrodos_optimize_notice'] ) ) : '';
		if ( '' !== $notice ) {
			$notice_class = in_array( $notice, [ 'optimized', 'queued' ], true ) ? 'notice-success' : 'notice-error';
			$notice_text  = match ( $notice ) {
				'optimized' => 'Optimized derivative generated.',
				'queued'    => 'Web derivative regeneration was queued.',
				default     => 'Optimization failed. Check the error details below or server logs.',
			};
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
					'profile'  => 'web-high',
				],
				admin_url( 'admin-post.php' )
			),
			'vrodos_optimize_asset_glb_' . $asset_id
		);

		echo '<p><a class="button button-secondary" href="' . esc_url( $optimize_url ) . '">Regenerate Web High derivative</a></p>';
		echo '<p><small>Caps textures at 4096px, writes KTX2 plus Draco, and keeps the original GLB unchanged.</small></p>';

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

		echo '<p><small>Compiled scenes select validated Web High, Medium, or Low derivatives automatically for their runtime target. Manual derivatives remain available for inspection and regeneration.</small></p>';

		if ( ! empty( $meta['lastError'] ) ) {
			echo '<p><small><strong>Last error:</strong> ' . esc_html( (string) $meta['lastError'] ) . '</small></p>';
		}
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

		if ( str_starts_with( $profile, 'web-' ) ) {
			$result = self::ensure_derivative(
				$asset_id,
				$profile,
				$source,
				[
					'protectGeometry' => 'web-high' === $profile || self::automatic_profile_protects_geometry( $asset_id ),
					'textureMaxSize'  => self::runtime_derivative_texture_cap( $profile ),
					'recipe'          => $profile,
				],
				true
			);
		} else {
			$result = $this->generate_derivative( $asset_id, $source, $profile );
		}
		if ( is_wp_error( $result ) ) {
			$this->record_error( $asset_id, $result->get_error_message() );
			$this->redirect_to_asset( $asset_id, 'failed' );
		}

		if ( ! str_starts_with( $profile, 'web-' ) ) {
			$this->store_derivative_record( $asset_id, $result );
		}
		$this->redirect_to_asset( $asset_id, str_starts_with( $profile, 'web-' ) ? 'queued' : 'optimized' );
	}

	public function handle_optimize_missing_glbs(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You are not allowed to optimize assets.', 'vrodos' ), '', [ 'response' => 403 ] );
		}

		check_admin_referer( 'vrodos_optimize_missing_glbs' );

		$profile = isset( $_POST['vrodos_asset_optimization_profile'] )
			? sanitize_key( (string) wp_unslash( $_POST['vrodos_asset_optimization_profile'] ) )
			: 'web-high';
		$target  = isset( $_POST['vrodos_asset_optimization_target'] )
			? sanitize_key( (string) wp_unslash( $_POST['vrodos_asset_optimization_target'] ) )
			: 'missing';
		$autorun = ! empty( $_POST['vrodos_asset_optimization_autorun'] );

		if ( ! isset( self::supported_profiles()[ $profile ] ) ) {
			$profile = 'web-high';
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
		if ( $autorun && empty( $report['failed'] ) && ( ! empty( $report['generated'] ) || ! empty( $report['queued'] ) ) && (int) ( $report['remaining'] ?? 0 ) > 0 ) {
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

		if ( str_starts_with( $profile, 'web-' ) ) {
			$result = self::ensure_derivative(
				$asset_id,
				$profile,
				$source,
				[
					'protectGeometry' => 'web-high' === $profile || self::automatic_profile_protects_geometry( $asset_id ),
					'textureMaxSize'  => self::runtime_derivative_texture_cap( $profile ),
					'recipe'          => $profile,
				],
				true
			);
		} else {
			$result = $this->generate_derivative( $asset_id, $source, $profile );
		}
		if ( is_wp_error( $result ) ) {
			$this->record_error( $asset_id, $result->get_error_message() );
			wp_safe_redirect( self::dashboard_url( [ 'vrodos_asset_opt_notice' => 'optimize-failed' ] ) );
			exit;
		}

		if ( ! str_starts_with( $profile, 'web-' ) ) {
			$this->store_derivative_record( $asset_id, $result );
		}
		wp_safe_redirect( self::dashboard_url( [ 'vrodos_asset_opt_notice' => str_starts_with( $profile, 'web-' ) ? 'queued' : 'optimized' ] ) );
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

}
