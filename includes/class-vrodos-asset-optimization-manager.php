<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Asset_Optimization_Manager {
	private const META_KEY = '_vrodos_asset3d_glb_derivatives';
	private const SETTINGS_PAGE_KEY = 'vrodos_options';
	private const SETTINGS_TAB_KEY = 'vrodos_asset_optimization_settings';
	private const BATCH_TRANSIENT_PREFIX = 'vrodos_asset_glb_opt_batch_';

	public function __construct() {
		add_action( 'add_meta_boxes', $this->add_meta_boxes(...) );
		add_action( 'save_post_vrodos_asset3d', $this->save_derivative_compile_settings(...), 20, 2 );
		add_action( 'admin_post_vrodos_optimize_asset_glb', $this->handle_optimize_asset_glb(...) );
		add_action( 'admin_post_vrodos_optimize_missing_glbs', $this->handle_optimize_missing_glbs(...) );
		add_filter( 'vrodos_settings_tabs', $this->register_settings_tab(...) );
		add_action( 'vrodos_render_settings_tab_' . self::SETTINGS_TAB_KEY, $this->render_asset_optimization_settings(...) );
	}

	public function register_settings_tab( array $tabs ): array {
		$tabs[ self::SETTINGS_TAB_KEY ] = __( 'Assets' );
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
		$missing_count    = count( $scan['missing'] );
		$stale_count      = count( $scan['stale'] );
		$auto_requested   = isset( $_GET['vrodos_asset_optimization_autorun'] ) && '1' === sanitize_key( (string) wp_unslash( $_GET['vrodos_asset_optimization_autorun'] ) );
		$stop_for_failure = ! empty( $report['failed'] );
		$target           = (string) ( $report['target'] ?? 'missing' );
		$remaining        = (int) ( $report['remaining'] ?? $missing_count );
		$should_continue  = $auto_requested && ! $stop_for_failure && $remaining > 0 && in_array( $target, [ 'missing', 'stale' ], true );

		echo '<h2>' . esc_html__( 'Asset Optimization' ) . '</h2>';
		echo '<p>' . esc_html__( 'Generate cached optimized GLB derivatives for uploaded assets. This does not replace source uploads and does not enable compiled-scene substitution.' ) . '</p>';

		$this->render_batch_report( $report );
		$this->render_asset_optimization_summary( $scan );

		echo '<h3>' . esc_html__( 'Batch Generation' ) . '</h3>';
		echo '<p>' . esc_html__( 'The batch runner processes a small number of assets per request and then resumes until the selected queue is empty. If any asset fails, automatic continuation stops so the error can be reviewed.' ) . '</p>';

		$this->render_batch_form(
			$profile,
			'missing',
			true,
			'vrodos-optimize-missing-glbs',
			sprintf(
				/* translators: %d: number of missing assets. */
				_n( 'Generate missing safe Draco derivative (%d asset)', 'Generate missing safe Draco derivatives (%d assets)', $missing_count ),
				$missing_count
			),
			$missing_count <= 0
		);

		if ( $stale_count > 0 ) {
			$this->render_batch_form(
				$profile,
				'stale',
				false,
				'vrodos-optimize-stale-glbs',
				sprintf(
					/* translators: %d: number of stale assets. */
					_n( 'Regenerate stale safe Draco derivative (%d asset)', 'Regenerate stale safe Draco derivatives (%d assets)', $stale_count ),
					$stale_count
				),
				false
			);
		}

		$this->render_asset_candidate_list( __( 'Missing safe Draco derivatives' ), $scan['missing'] );
		$this->render_asset_candidate_list( __( 'Stale safe Draco derivatives' ), $scan['stale'] );
		$this->render_asset_candidate_list( __( 'Unsupported or non-local GLB assets' ), $scan['unsupported'] );

		if ( $should_continue ) {
			echo '<div class="notice notice-info inline"><p>' . esc_html__( 'Continuing the optimization batch...' ) . '</p></div>';
			$this->render_batch_form(
				$profile,
				$target,
				true,
				'vrodos-asset-optimization-autocontinue',
				__( 'Continue optimization batch' ),
				false,
				true
			);
			echo '<script>window.setTimeout(function(){var form=document.getElementById("vrodos-asset-optimization-autocontinue");if(form){HTMLFormElement.prototype.submit.call(form);}},700);</script>';
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
		if ( ! in_array( $target, [ 'missing', 'stale' ], true ) ) {
			$target = 'missing';
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
		echo '<tr><th scope="row">' . esc_html__( 'Asset posts scanned' ) . '</th><td>' . esc_html( number_format_i18n( (int) $scan['totalAssets'] ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Local GLB assets' ) . '</th><td>' . esc_html( number_format_i18n( (int) $scan['localGlbs'] ) ) . '</td></tr>';
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

	private function render_asset_candidate_list( string $title, array $items, int $limit = 10 ): void {
		if ( empty( $items ) ) {
			return;
		}

		echo '<h3>' . esc_html( $title ) . '</h3>';
		echo '<table class="widefat striped" style="max-width:960px;margin-bottom:16px;">';
		echo '<thead><tr><th>' . esc_html__( 'Asset' ) . '</th><th>' . esc_html__( 'Source size' ) . '</th><th>' . esc_html__( 'Status' ) . '</th></tr></thead>';
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
			echo '<td>' . esc_html( (string) ( $item['reason'] ?? $item['status'] ?? '' ) ) . '</td>';
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

	private static function scan_glb_derivatives( string $profile ): array {
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

		$scan = [
			'profile'               => $profile,
			'totalAssets'           => count( $asset_ids ),
			'localGlbs'             => 0,
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
			if ( ! is_array( $derivative ) ) {
				$item['status'] = 'missing';
				$item['reason'] = 'No derivative generated yet.';
				$scan['missing'][] = $item;
				continue;
			}

			$reason = self::derivative_unusable_reason( $derivative, (string) $source['url'] );
			if ( '' !== $reason ) {
				$item['status'] = 'stale';
				$item['reason'] = $reason;
				$scan['stale'][] = $item;
				continue;
			}

			$item['status']              = 'ready';
			$item['derivativeSizeBytes'] = (int) ( $derivative['derivativeSizeBytes'] ?? 0 );
			$item['reductionBytes']      = (int) ( $derivative['reductionBytes'] ?? 0 );
			$item['reductionPercent']    = is_numeric( $derivative['reductionPercent'] ?? null ) ? (float) $derivative['reductionPercent'] : 0.0;
			$scan['readySavedBytes']    += (int) $item['reductionBytes'];
			$scan['readySourceBytes']   += (int) ( $derivative['sourceSizeBytes'] ?? $item['sourceSizeBytes'] );
			$scan['readyDerivativeBytes'] += (int) $item['derivativeSizeBytes'];
			$scan['ready'][]             = $item;
		}

		return $scan;
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
