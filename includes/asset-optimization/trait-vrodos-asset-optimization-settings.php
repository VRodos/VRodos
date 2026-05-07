<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_Optimization_Settings_View {
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
}
