<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_Optimization_Settings_View {
	private static function readiness_settings_url( array $args = [] ): string {
		return add_query_arg( array_merge( [ 'page' => 'vrodos_options', 'tab' => self::SETTINGS_TAB_KEY ], $args ), admin_url( 'admin.php' ) );
	}

	private static function readiness_status_labels(): array {
		return [
			'ready' => __( 'Ready', 'vrodos' ),
			'source-ready' => __( 'Source ready', 'vrodos' ),
			'processing' => __( 'Processing', 'vrodos' ),
			'missing' => __( 'Needs preparation', 'vrodos' ),
			'outdated' => __( 'Needs update', 'vrodos' ),
			'failed' => __( 'Failed', 'vrodos' ),
			'unsupported' => __( 'Unsupported / source missing', 'vrodos' ),
		];
	}

	public function render_asset_optimization_settings(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			echo '<p>' . esc_html__( 'You are not allowed to manage asset preparation.', 'vrodos' ) . '</p>';
			return;
		}
		$items = self::scan_asset_readiness();
		$labels = self::readiness_status_labels();
		$filter_labels = [ '' => __( 'All statuses', 'vrodos' ), 'needs-attention' => __( 'Needs attention', 'vrodos' ) ] + $labels;
		$status = isset( $_GET['asset_status'] ) && is_string( $_GET['asset_status'] ) ? sanitize_key( wp_unslash( $_GET['asset_status'] ) ) : '';
		$status = isset( $filter_labels[ $status ] ) ? $status : '';
		$project = isset( $_GET['asset_project'] ) && is_scalar( $_GET['asset_project'] ) ? absint( $_GET['asset_project'] ) : 0;
		$search = isset( $_GET['asset_search'] ) && is_string( $_GET['asset_search'] ) ? sanitize_text_field( wp_unslash( $_GET['asset_search'] ) ) : '';
		$counts = array_fill_keys( array_keys( $labels ), 0 );
		$source_bytes = 0;
		$high_bytes = 0;
		$projects = [];
		foreach ( $items as &$item ) {
			++$counts[ $item['status'] ];
			if ( 'ready' === ( $item['profiles']['web-high']['status'] ?? '' ) ) {
				$source_bytes += $item['sourceSizeBytes'];
				$high_bytes += $item['profiles']['web-high']['bytes'];
			}
			$terms = get_the_terms( $item['assetId'], 'vrodos_asset3d_pgame' );
			$item['projects'] = [];
			if ( is_array( $terms ) ) {
				foreach ( $terms as $term ) {
					$item['projects'][ $term->term_id ] = $term->name;
					$projects[ $term->term_id ] = $term->name;
				}
			}
		}
		unset( $item );
		natcasesort( $projects );
		$needs_attention = [ 'missing', 'outdated', 'failed' ];
		$filtered = array_values( array_filter( $items, static function ( array $item ) use ( $status, $project, $search, $needs_attention ): bool {
			return ( '' === $status || ( 'needs-attention' === $status ? in_array( $item['status'], $needs_attention, true ) : $status === $item['status'] ) )
				&& ( ! $project || isset( $item['projects'][ $project ] ) )
				&& ( '' === $search || false !== stripos( $item['title'] . ' #' . $item['assetId'], $search ) );
		} ) );
		$rank = array_flip( [ 'failed', 'outdated', 'missing', 'processing', 'unsupported', 'source-ready', 'ready' ] );
		usort( $filtered, static fn( array $a, array $b ): int => ( $rank[ $a['status'] ] <=> $rank[ $b['status'] ] ) ?: strnatcasecmp( $a['title'], $b['title'] ) );
		$total = count( $filtered );
		$pages = max( 1, (int) ceil( $total / 25 ) );
		$current = min( $pages, max( 1, isset( $_GET['asset_page'] ) && is_scalar( $_GET['asset_page'] ) ? absint( $_GET['asset_page'] ) : 1 ) );
		$rows = array_slice( $filtered, ( $current - 1 ) * 25, 25 );
		$jobs_url = add_query_arg( [ 'page' => 'vrodos_options', 'tab' => VRodos_Background_Jobs::SETTINGS_TAB_KEY ], admin_url( 'admin.php' ) );
		?>
		<h2><?php esc_html_e( 'Asset Readiness', 'vrodos' ); ?></h2>
		<p><?php esc_html_e( 'Uploads and imports automatically prepare eligible GLBs. Use this page to prepare missing or outdated Web profiles and retry failures. Source GLBs stay unchanged.', 'vrodos' ); ?></p>
		<p><a class="button" href="<?php echo esc_url( $jobs_url ); ?>"><?php esc_html_e( 'View Background Jobs', 'vrodos' ); ?></a></p>
		<?php $this->render_readiness_notice(); ?>
		<table class="widefat striped" style="max-width:800px;margin:16px 0;">
			<tbody>
				<?php foreach ( [
					__( 'GLB assets', 'vrodos' ) => count( $items ),
					__( 'Ready — all Web profiles', 'vrodos' ) => $counts['ready'],
					__( 'Source ready — below automatic thresholds', 'vrodos' ) => $counts['source-ready'],
					__( 'Needs attention', 'vrodos' ) => $counts['missing'] + $counts['outdated'] + $counts['failed'],
					__( 'Processing', 'vrodos' ) => $counts['processing'],
					__( 'Unsupported / source missing', 'vrodos' ) => $counts['unsupported'],
				] as $label => $count ) : ?>
					<tr><th scope="row"><?php echo esc_html( $label ); ?></th><td><?php echo esc_html( number_format_i18n( $count ) ); ?></td></tr>
				<?php endforeach; ?>
				<tr><th scope="row"><?php esc_html_e( 'Web High file-size reduction', 'vrodos' ); ?></th><td><?php echo esc_html( size_format( max( 0, $source_bytes - $high_bytes ), 1 ) . ' (' . size_format( $source_bytes, 1 ) . ' source → ' . size_format( $high_bytes, 1 ) . ' optimized)' ); ?></td></tr>
			</tbody>
		</table>
		<p class="description"><?php esc_html_e( 'File-size reduction compares ready Web High files with their sources; it is not reclaimed disk space. High, Medium and Low refer to asset profiles, not renderer quality. Individual builds may request additional variants.', 'vrodos' ); ?></p>
		<form method="get" action="<?php echo esc_url( admin_url( 'admin.php' ) ); ?>" style="margin:16px 0;">
			<input type="hidden" name="page" value="vrodos_options">
			<input type="hidden" name="tab" value="<?php echo esc_attr( self::SETTINGS_TAB_KEY ); ?>">
			<label for="vrodos-asset-status" class="screen-reader-text"><?php esc_html_e( 'Asset status', 'vrodos' ); ?></label>
			<select id="vrodos-asset-status" name="asset_status">
				<?php foreach ( $filter_labels as $value => $label ) : ?><option value="<?php echo esc_attr( $value ); ?>" <?php selected( $status, $value ); ?>><?php echo esc_html( $label ); ?></option><?php endforeach; ?>
			</select>
			<label for="vrodos-asset-project" class="screen-reader-text"><?php esc_html_e( 'Project', 'vrodos' ); ?></label>
			<select id="vrodos-asset-project" name="asset_project"><option value="0"><?php esc_html_e( 'All projects', 'vrodos' ); ?></option>
				<?php foreach ( $projects as $id => $name ) : ?><option value="<?php echo esc_attr( $id ); ?>" <?php selected( $project, $id ); ?>><?php echo esc_html( $name ); ?></option><?php endforeach; ?>
			</select>
			<label for="vrodos-asset-search" class="screen-reader-text"><?php esc_html_e( 'Asset name or ID', 'vrodos' ); ?></label>
			<input id="vrodos-asset-search" type="search" name="asset_search" value="<?php echo esc_attr( $search ); ?>" placeholder="<?php esc_attr_e( 'Asset name or ID', 'vrodos' ); ?>">
			<button class="button" type="submit"><?php esc_html_e( 'Filter', 'vrodos' ); ?></button>
			<a href="<?php echo esc_url( self::readiness_settings_url() ); ?>"><?php esc_html_e( 'Reset', 'vrodos' ); ?></a>
		</form>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="vrodos_prepare_assets">
			<?php wp_nonce_field( 'vrodos_prepare_assets' ); ?>
			<?php foreach ( [ 'asset_status' => $status, 'asset_project' => $project, 'asset_search' => $search, 'asset_page' => $current ] as $key => $value ) : ?>
				<input type="hidden" name="<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( $value ); ?>">
			<?php endforeach; ?>
			<p><button class="button" name="operation" value="prepare" type="submit"><?php esc_html_e( 'Prepare selected missing / outdated', 'vrodos' ); ?></button>
			<button class="button" name="operation" value="retry" type="submit"><?php esc_html_e( 'Retry selected failed', 'vrodos' ); ?></button></p>
			<div style="overflow-x:auto;">
			<table class="widefat striped">
				<thead><tr><td class="check-column"><input id="cb-select-all-1" type="checkbox" aria-label="<?php esc_attr_e( 'Select all actionable assets on this page', 'vrodos' ); ?>"></td><th scope="col"><?php esc_html_e( 'Asset / project', 'vrodos' ); ?></th><th scope="col"><?php esc_html_e( 'Source size', 'vrodos' ); ?></th><th scope="col"><?php esc_html_e( 'Readiness', 'vrodos' ); ?></th>
				<?php foreach ( self::WEB_FAMILY_PROFILES as $profile ) : ?><th scope="col"><?php echo esc_html( self::readiness_profile_label( $profile ) ); ?></th><?php endforeach; ?>
				<th scope="col"><?php esc_html_e( 'Details', 'vrodos' ); ?></th><th scope="col"><?php esc_html_e( 'Action', 'vrodos' ); ?></th></tr></thead>
				<tbody>
				<?php if ( ! $rows ) : ?><tr><td colspan="9"><?php esc_html_e( 'No GLB assets match these filters.', 'vrodos' ); ?></td></tr><?php endif; ?>
				<?php foreach ( $rows as $item ) :
					$editable = current_user_can( 'edit_post', $item['assetId'] );
					$actionable = $editable && in_array( $item['status'], $needs_attention, true );
					?>
					<tr>
						<th class="check-column" scope="row"><?php if ( $actionable ) : ?><input type="checkbox" name="asset_ids[]" value="<?php echo esc_attr( $item['assetId'] ); ?>" aria-label="<?php echo esc_attr( 'Select ' . $item['title'] ); ?>"><?php endif; ?></th>
						<td><a href="<?php echo esc_url( get_edit_post_link( $item['assetId'], 'raw' ) ); ?>"><?php echo esc_html( $item['title'] ); ?></a><br><small><?php echo esc_html( '#' . $item['assetId'] . ( $item['projects'] ? ' · ' . implode( ', ', $item['projects'] ) : '' ) ); ?></small></td>
						<td><?php echo esc_html( size_format( $item['sourceSizeBytes'], 1 ) ); ?></td>
						<td><strong><?php echo esc_html( $labels[ $item['status'] ] ); ?></strong></td>
						<?php foreach ( self::WEB_FAMILY_PROFILES as $profile ) : $state = $item['profiles'][ $profile ] ?? null; ?>
							<td><?php if ( $state ) : ?>
								<?php echo esc_html( match ( $state['status'] ) { 'ready' => 'Ready', 'running' => 'Running', 'queued' => 'Queued', 'failed' => 'Failed', 'outdated' => 'Outdated', default => 'source-ready' === $item['status'] ? 'Not required' : ( 'processing' === $item['status'] ? 'Waiting' : 'Missing' ) } ); ?>
								<?php if ( 'ready' === $state['status'] ) : ?><br><small><?php echo esc_html( size_format( $state['bytes'], 1 ) . ' · ' . number_format_i18n( $state['reductionPercent'], 1 ) . '% reduction' ); ?></small><?php endif; ?>
							<?php else : ?>—<?php endif; ?></td>
						<?php endforeach; ?>
						<td style="max-width:360px;overflow-wrap:anywhere;"><?php echo esc_html( $item['reason'] ); ?></td>
						<td><?php if ( $actionable ) : ?>
							<button class="button" type="submit" name="<?php echo 'failed' === $item['status'] ? 'retry_asset_id' : 'prepare_asset_id'; ?>" value="<?php echo esc_attr( $item['assetId'] ); ?>"><?php echo esc_html( match ( $item['status'] ) { 'failed' => 'Retry', 'outdated' => 'Update optimized versions', default => 'Prepare' } ); ?></button>
						<?php elseif ( 'processing' === $item['status'] ) : ?><a class="button" href="<?php echo esc_url( $jobs_url ); ?>"><?php esc_html_e( 'View job', 'vrodos' ); ?></a>
						<?php elseif ( $editable ) : ?><a href="<?php echo esc_url( get_edit_post_link( $item['assetId'], 'raw' ) ); ?>"><?php esc_html_e( 'Edit asset', 'vrodos' ); ?></a><?php endif; ?></td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
			</div>
		</form>
		<p><?php echo esc_html( sprintf( __( '%1$d assets · Page %2$d of %3$d', 'vrodos' ), $total, $current, $pages ) ); ?>
		<?php foreach ( [ -1 => __( 'Previous', 'vrodos' ), 1 => __( 'Next', 'vrodos' ) ] as $offset => $label ) : if ( $current + $offset >= 1 && $current + $offset <= $pages ) : ?>
			<a class="button" href="<?php echo esc_url( self::readiness_settings_url( [ 'asset_status' => $status, 'asset_project' => $project, 'asset_search' => $search, 'asset_page' => $current + $offset ] ) ); ?>"><?php echo esc_html( $label ); ?></a>
		<?php endif; endforeach; ?></p>
		<?php
	}

	private function render_readiness_notice(): void {
		$notice = get_transient( 'vrodos_asset_readiness_notice_' . get_current_user_id() );
		if ( ! is_array( $notice ) ) {
			return;
		}
		delete_transient( 'vrodos_asset_readiness_notice_' . get_current_user_id() );
		echo '<div class="notice ' . ( $notice['errors'] ? 'notice-warning' : 'notice-success' ) . ' inline"><p>' . esc_html( sprintf( __( '%1$d assets submitted to the existing preparation queue; %2$d skipped (already processing, ready, below thresholds, or not applicable).', 'vrodos' ), $notice['submitted'], $notice['skipped'] ) ) . '</p>';
		foreach ( $notice['errors'] as $error ) {
			echo '<p>' . esc_html( $error ) . '</p>';
		}
		echo '</div>';
	}
}
