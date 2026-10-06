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

		$scan = self::scan_glb_derivatives( 'web-high' );

		echo '<h2>' . esc_html__( 'Asset Optimization' ) . '</h2>';
		echo '<p>' . esc_html__( 'Analyze uploaded GLBs and inspect cached Web High derivatives. Source uploads stay unchanged; compilation selects validated Web profiles automatically.' ) . '</p>';

		$this->render_asset_optimization_summary( $scan );

		echo '<h3>' . esc_html__( 'Action Surface' ) . '</h3>';
		echo '<p>' . esc_html__( 'Use the asset edit screen to refresh GLB analysis or regenerate Web High derivatives. This Settings tab provides GLB diagnostics and reports; Background Jobs shows preparation progress and failures.' ) . '</p>';

		$this->render_asset_candidate_list( __( 'Recommended for safe Draco/Meshopt geometry derivatives' ), $scan['recommendedGeometry'], 'recommendation' );
		$this->render_asset_candidate_list( __( 'Recommended for Web High KTX2 texture optimization' ), $scan['recommendedTexture'], 'recommendation' );
		$this->render_asset_candidate_list( __( 'Recommended for future LOD derivatives' ), $scan['recommendedLod'], 'recommendation' );
		$this->render_asset_candidate_list( __( 'Low-benefit or already compressed GLB assets' ), $scan['lowBenefit'], 'recommendation' );
		$this->render_asset_candidate_list( __( 'Missing Web High derivatives' ), $scan['missing'] );
		$this->render_asset_candidate_list( __( 'Stale Web High derivatives' ), $scan['stale'] );
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
		echo '<tr><th scope="row">' . esc_html__( 'Web High KTX2 candidates' ) . '</th><td>' . esc_html( number_format_i18n( count( $scan['recommendedTexture'] ) ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Future LOD candidates' ) . '</th><td>' . esc_html( number_format_i18n( count( $scan['recommendedLod'] ) ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Ready Web High derivatives' ) . '</th><td>' . esc_html( number_format_i18n( $ready_count ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Missing Web High derivatives' ) . '</th><td>' . esc_html( number_format_i18n( $missing_count ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Stale Web High derivatives' ) . '</th><td>' . esc_html( number_format_i18n( $stale_count ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Unsupported/non-local assets' ) . '</th><td>' . esc_html( number_format_i18n( $unsupported_count ) ) . '</td></tr>';
		echo '<tr><th scope="row">' . esc_html__( 'Ready derivative savings' ) . '</th><td>' . esc_html( size_format( $ready_saved_bytes, 1 ) ) . ' saved from ' . esc_html( size_format( $ready_source_bytes, 1 ) ) . ' source GLBs';
		if ( $ready_derivative_bytes > 0 ) {
			echo ' (' . esc_html( size_format( $ready_derivative_bytes, 1 ) ) . ' optimized)';
		}
		echo '</td></tr>';
		echo '</tbody>';
		echo '</table>';
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

}
