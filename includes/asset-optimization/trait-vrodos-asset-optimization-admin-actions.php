<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_Optimization_Admin_Actions {
	public function register_settings_tab( array $tabs ): array {
		$tabs[ self::SETTINGS_TAB_KEY ] = __( 'Asset Readiness', 'vrodos' );
		return $tabs;
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
		$source   = self::inspect_source_glb( $asset_id );

		$notice = isset( $_GET['vrodos_optimize_notice'] ) ? sanitize_key( (string) wp_unslash( $_GET['vrodos_optimize_notice'] ) ) : '';
		if ( '' !== $notice ) {
			$notice_class = in_array( $notice, [ 'optimized', 'queued', 'analysis-refreshed' ], true ) ? 'notice-success' : 'notice-error';
			$notice_text  = match ( $notice ) {
				'optimized'          => 'Optimized derivative generated.',
				'queued'             => 'Web derivative regeneration was queued.',
				'analysis-refreshed' => 'GLB analysis refreshed.',
				'analysis-failed'    => 'GLB analysis refresh failed. ' . (string) ( self::get_analysis_meta( $asset_id )['error'] ?? '' ),
				default             => 'Optimization failed. Check the error details below or server logs.',
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

		$refresh_url = wp_nonce_url(
			add_query_arg(
				[
					'action'   => 'vrodos_refresh_asset_analysis',
					'asset_id' => $asset_id,
				],
				admin_url( 'admin-post.php' )
			),
			'vrodos_refresh_asset_analysis_' . $asset_id
		);

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

		echo '<p><a class="button button-secondary" href="' . esc_url( $refresh_url ) . '">' . esc_html__( 'Refresh GLB analysis', 'vrodos' ) . '</a> ';
		echo '<a class="button button-secondary" href="' . esc_url( $optimize_url ) . '">Regenerate Web High derivative</a></p>';
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

		$source = self::prepare_source_glb( $asset_id );
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
					'protectGeometry' => self::automatic_profile_protects_geometry( $asset_id ),
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

	public function handle_prepare_assets(): void {
		if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You are not allowed to prepare assets.', 'vrodos' ), '', [ 'response' => 403 ] );
		}
		check_admin_referer( 'vrodos_prepare_assets' );
		$operation = isset( $_POST['operation'] ) && is_string( $_POST['operation'] ) ? sanitize_key( wp_unslash( $_POST['operation'] ) ) : '';
		$asset_ids = isset( $_POST['asset_ids'] ) && is_array( $_POST['asset_ids'] ) ? array_filter( $_POST['asset_ids'], 'is_scalar' ) : [];
		foreach ( [ 'prepare_asset_id' => 'prepare', 'retry_asset_id' => 'retry' ] as $key => $row_operation ) {
			if ( isset( $_POST[ $key ] ) && is_scalar( $_POST[ $key ] ) ) {
				$asset_ids = [ $_POST[ $key ] ];
				$operation = $row_operation;
				break;
			}
		}
		$asset_ids = array_values( array_unique( array_filter( array_map( 'absint', $asset_ids ) ) ) );
		if ( ! in_array( $operation, [ 'prepare', 'retry' ], true ) || count( $asset_ids ) > 25 ) {
			wp_die( esc_html__( 'Select a valid action for up to 25 assets.', 'vrodos' ), '', [ 'response' => 400 ] );
		}
		$notice = [ 'submitted' => 0, 'skipped' => 0, 'errors' => [] ];
		foreach ( $asset_ids as $asset_id ) {
			if ( 'vrodos_asset3d' !== get_post_type( $asset_id ) || ! current_user_can( 'edit_post', $asset_id ) ) {
				$notice['errors'][] = sprintf( __( 'Asset #%d is unavailable or cannot be edited.', 'vrodos' ), $asset_id );
				continue;
			}
			$result = self::prepare_asset_web_family( $asset_id, 'retry' === $operation );
			if ( is_wp_error( $result ) ) {
				$this->record_error( $asset_id, $result->get_error_message() );
				$notice['errors'][] = sprintf( 'Asset #%d: %s', $asset_id, $result->get_error_message() );
			} elseif ( true === $result ) {
				++$notice['submitted'];
			} else {
				++$notice['skipped'];
			}
		}
		if ( ! $asset_ids ) {
			$notice['errors'][] = __( 'Select at least one asset.', 'vrodos' );
		}
		set_transient( 'vrodos_asset_readiness_notice_' . get_current_user_id(), $notice, MINUTE_IN_SECONDS );
		$filters = [];
		foreach ( [ 'asset_status', 'asset_search', 'asset_project', 'asset_page' ] as $key ) {
			if ( isset( $_POST[ $key ] ) && is_string( $_POST[ $key ] ) ) {
				$filters[ $key ] = sanitize_text_field( wp_unslash( $_POST[ $key ] ) );
			}
		}
		wp_safe_redirect( self::readiness_settings_url( $filters ) );
		exit;
	}

	public function handle_refresh_asset_analysis(): void {
		$asset_id = isset( $_GET['asset_id'] ) && ! is_array( $_GET['asset_id'] ) ? absint( $_GET['asset_id'] ) : 0;
		if ( $asset_id <= 0 || 'vrodos_asset3d' !== get_post_type( $asset_id ) || ! current_user_can( 'edit_post', $asset_id ) ) {
			wp_die( esc_html__( 'You are not allowed to analyze this asset.', 'vrodos' ), '', [ 'response' => 403 ] );
		}

		check_admin_referer( 'vrodos_refresh_asset_analysis_' . $asset_id );

		$result = self::refresh_asset_analysis( $asset_id );
		$this->redirect_to_asset( $asset_id, is_wp_error( $result ) ? 'analysis-failed' : 'analysis-refreshed' );
	}

}
