<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait VRodos_Asset_Optimization_Dashboard_View {
	public static function dashboard_actionable_assets( int $limit = 10 ): array {
		$items = self::collect_dashboard_actionable_assets();

		return array_slice( $items, 0, max( 1, $limit ) );
	}

	private static function collect_dashboard_actionable_assets(): array {
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

		return $items;
	}

	public static function render_dashboard_actionable_assets_table( int $limit = 10 ): void {
		$items         = self::collect_dashboard_actionable_assets();
		$total_items   = count( $items );
		$per_page      = max( 1, $limit );
		$page_param    = isset( $_GET['vrodos_asset_page'] ) && ! is_array( $_GET['vrodos_asset_page'] ) ? wp_unslash( $_GET['vrodos_asset_page'] ) : '';
		$sort_param    = isset( $_GET['vrodos_asset_sort'] ) && ! is_array( $_GET['vrodos_asset_sort'] ) ? wp_unslash( $_GET['vrodos_asset_sort'] ) : '';
		$order_param   = isset( $_GET['vrodos_asset_order'] ) && ! is_array( $_GET['vrodos_asset_order'] ) ? wp_unslash( $_GET['vrodos_asset_order'] ) : '';
		$current_page  = '' !== $page_param ? max( 1, absint( $page_param ) ) : 1;
		$sort          = '' !== $sort_param ? sanitize_key( (string) $sort_param ) : 'priority';
		$order         = '' !== $order_param ? sanitize_key( (string) $order_param ) : 'desc';
		$allowed_sorts = [ 'priority', 'title', 'source_size', 'id' ];
		$sort          = in_array( $sort, $allowed_sorts, true ) ? $sort : 'priority';
		$order         = in_array( $order, [ 'asc', 'desc' ], true ) ? $order : 'desc';
		$total_pages   = max( 1, (int) ceil( $total_items / $per_page ) );
		$current_page  = min( $current_page, $total_pages );
		$items         = self::sort_dashboard_actionable_assets( $items, $sort, $order );
		$paged_items   = array_slice( $items, ( $current_page - 1 ) * $per_page, $per_page );

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
		<div class="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 tw-border-b tw-border-slate-100 tw-bg-white">
			<div class="tw-text-[10px] tw-font-black tw-uppercase tw-tracking-widest tw-text-slate-400">
				<?php
				printf(
					esc_html__( 'Showing %1$s-%2$s of %3$s actionable assets', 'vrodos' ),
					esc_html( number_format_i18n( ( ( $current_page - 1 ) * $per_page ) + 1 ) ),
					esc_html( number_format_i18n( min( $total_items, $current_page * $per_page ) ) ),
					esc_html( number_format_i18n( $total_items ) )
				);
				?>
			</div>
			<form method="get" class="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
				<input type="hidden" name="page" value="vrodos-plugin">
				<input type="hidden" name="vrodos_dashboard_tab" value="assets">
				<label class="tw-text-[10px] tw-font-black tw-uppercase tw-tracking-widest tw-text-slate-400" for="vrodos-dashboard-asset-sort"><?php esc_html_e( 'Sort', 'vrodos' ); ?></label>
				<select id="vrodos-dashboard-asset-sort" name="vrodos_asset_sort" class="tw-select tw-select-bordered tw-select-xs tw-min-h-0 tw-h-8 tw-text-xs">
					<option value="priority" <?php selected( $sort, 'priority' ); ?>><?php esc_html_e( 'Priority', 'vrodos' ); ?></option>
					<option value="title" <?php selected( $sort, 'title' ); ?>><?php esc_html_e( 'Asset title', 'vrodos' ); ?></option>
					<option value="source_size" <?php selected( $sort, 'source_size' ); ?>><?php esc_html_e( 'Source size', 'vrodos' ); ?></option>
					<option value="id" <?php selected( $sort, 'id' ); ?>><?php esc_html_e( 'Asset ID', 'vrodos' ); ?></option>
				</select>
				<select name="vrodos_asset_order" class="tw-select tw-select-bordered tw-select-xs tw-min-h-0 tw-h-8 tw-text-xs">
					<option value="desc" <?php selected( $order, 'desc' ); ?>><?php esc_html_e( 'Desc', 'vrodos' ); ?></option>
					<option value="asc" <?php selected( $order, 'asc' ); ?>><?php esc_html_e( 'Asc', 'vrodos' ); ?></option>
				</select>
				<button type="submit" class="tw-btn tw-btn-ghost tw-btn-xs tw-h-8 tw-min-h-0 tw-text-slate-600 tw-font-black tw-uppercase tw-tracking-wider">
					<?php esc_html_e( 'Apply', 'vrodos' ); ?>
				</button>
			</form>
		</div>
		<div class="tw-overflow-x-auto">
			<table class="tw-table tw-w-full">
				<thead>
					<tr class="tw-bg-slate-50/30">
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest">Asset</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-center tw-w-16">Geometry</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-center tw-w-16">Texture</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-center tw-w-16">LOD</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-center tw-w-16">Safe Draco</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-center tw-w-16">Compile</th>
						<th class="tw-text-slate-400 tw-font-extrabold tw-text-[10px] tw-uppercase tw-tracking-widest tw-text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $paged_items as $item ) : ?>
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
							<td class="tw-py-4">
								<div class="tw-font-black tw-text-slate-700 tw-leading-tight"><?php echo esc_html( $title ); ?></div>
								<div class="tw-flex tw-items-center tw-gap-2 tw-mt-1">
									<span class="tw-text-[10px] tw-text-slate-400 tw-font-mono">#<?php echo esc_html( (string) $asset_id ); ?></span>
									<span class="tw-badge tw-badge-ghost tw-badge-xs tw-text-[9px] tw-font-black tw-text-slate-500"><?php echo esc_html( size_format( (int) ( $item['sourceSizeBytes'] ?? 0 ), 1 ) ); ?></span>
									<span class="tw-inline-flex tw-items-center" data-vrodos-dashboard-cell="analysis"><?php self::render_dashboard_analysis_icon( $flags ); ?></span>
								</div>
							</td>
							<td class="tw-text-center" data-vrodos-dashboard-cell="geometry"><?php self::render_dashboard_recommendation_icon( $flags, $analysis, 'geometryDerivative', 'Geometry derivative recommended', 'Geometry derivative not recommended' ); ?></td>
							<td class="tw-text-center" data-vrodos-dashboard-cell="texture"><?php self::render_dashboard_recommendation_icon( $flags, $analysis, 'textureDerivative', 'Texture derivative recommended', 'Texture derivative not recommended' ); ?></td>
							<td class="tw-text-center" data-vrodos-dashboard-cell="lod"><?php self::render_dashboard_recommendation_icon( $flags, $analysis, 'lodDerivative', 'LOD derivative recommended', 'LOD derivative not recommended' ); ?></td>
							<td class="tw-text-center" data-vrodos-dashboard-cell="draco"><?php self::render_dashboard_draco_icon( $derivative_ready, $derivative_status, $flags ); ?></td>
							<td class="tw-text-center" data-vrodos-dashboard-cell="compile"><?php self::render_dashboard_compile_toggle( $asset_id, $meta, $derivative_ready ); ?></td>
							<td class="tw-text-right tw-whitespace-nowrap">
								<div class="tw-flex tw-flex-nowrap tw-justify-end tw-gap-1" data-vrodos-dashboard-cell="actions">
									<?php echo self::dashboard_row_actions_html( $asset_id, $flags, $derivative_ready ); ?>
								</div>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		</div>
		<?php if ( $total_pages > 1 ) : ?>
			<div class="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 tw-border-t tw-border-slate-100 tw-bg-slate-50/50">
				<div class="tw-text-[10px] tw-font-black tw-uppercase tw-tracking-widest tw-text-slate-400">
					<?php
					printf(
						esc_html__( 'Page %1$s of %2$s', 'vrodos' ),
						esc_html( number_format_i18n( $current_page ) ),
						esc_html( number_format_i18n( $total_pages ) )
					);
					?>
				</div>
				<div class="tw-flex tw-flex-wrap tw-items-center tw-gap-1">
					<?php self::render_dashboard_pagination_link( __( 'Previous', 'vrodos' ), $current_page - 1, $current_page > 1, $sort, $order ); ?>
					<?php $last_rendered_page = 0; ?>
					<?php foreach ( self::dashboard_pagination_pages( $current_page, $total_pages ) as $page ) : ?>
						<?php if ( $last_rendered_page > 0 && $page > $last_rendered_page + 1 ) : ?>
							<span class="tw-px-2 tw-text-xs tw-font-black tw-text-slate-300" aria-hidden="true">...</span>
						<?php endif; ?>
						<?php self::render_dashboard_pagination_link( (string) $page, $page, true, $sort, $order, $page === $current_page ); ?>
						<?php $last_rendered_page = $page; ?>
					<?php endforeach; ?>
					<?php self::render_dashboard_pagination_link( __( 'Next', 'vrodos' ), $current_page + 1, $current_page < $total_pages, $sort, $order ); ?>
				</div>
			</div>
		<?php endif; ?>
		<?php
	}

	private static function sort_dashboard_actionable_assets( array $items, string $sort, string $order ): array {
		usort(
			$items,
			static function ( array $a, array $b ) use ( $sort, $order ): int {
				switch ( $sort ) {
					case 'title':
						$result = strcasecmp( (string) ( $a['title'] ?? '' ), (string) ( $b['title'] ?? '' ) );
						break;
					case 'source_size':
						$result = (int) ( $a['sourceSizeBytes'] ?? 0 ) <=> (int) ( $b['sourceSizeBytes'] ?? 0 );
						break;
					case 'id':
						$result = (int) ( $a['assetId'] ?? 0 ) <=> (int) ( $b['assetId'] ?? 0 );
						break;
					case 'priority':
					default:
						$result = (int) ( $a['recommendationScore'] ?? 0 ) <=> (int) ( $b['recommendationScore'] ?? 0 );
						break;
				}

				if ( 0 === $result ) {
					$result = (int) ( $a['assetId'] ?? 0 ) <=> (int) ( $b['assetId'] ?? 0 );
				}

				return 'desc' === $order ? -$result : $result;
			}
		);

		return $items;
	}

	private static function dashboard_pagination_pages( int $current_page, int $total_pages ): array {
		$pages = [ 1, $total_pages ];
		for ( $page = $current_page - 2; $page <= $current_page + 2; $page++ ) {
			if ( $page >= 1 && $page <= $total_pages ) {
				$pages[] = $page;
			}
		}

		$pages = array_values( array_unique( $pages ) );
		sort( $pages, SORT_NUMERIC );

		return $pages;
	}

	private static function render_dashboard_pagination_link( string $label, int $page, bool $enabled, string $sort, string $order, bool $current = false ): void {
		$class = 'tw-btn tw-btn-xs tw-min-h-0 tw-h-8 tw-px-3 tw-font-black tw-uppercase tw-tracking-wider';
		if ( $current ) {
			echo '<span class="' . esc_attr( $class . ' tw-btn-primary' ) . '" aria-current="page">' . esc_html( $label ) . '</span>';
			return;
		}
		if ( ! $enabled ) {
			echo '<span class="' . esc_attr( $class . ' tw-btn-disabled tw-opacity-40' ) . '">' . esc_html( $label ) . '</span>';
			return;
		}

		echo '<a class="' . esc_attr( $class . ' tw-btn-ghost tw-text-slate-600' ) . '" href="' . esc_url( self::dashboard_url( [ 'vrodos_asset_page' => max( 1, $page ), 'vrodos_asset_sort' => $sort, 'vrodos_asset_order' => $order ] ) ) . '">' . esc_html( $label ) . '</a>';
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
		$generate_label = ! empty( $flags['stale-derivative'] ) ? 'Regenerate' : 'Generate';

		return self::capture_dashboard_html(
			static function () use ( $asset_id, $can_generate_safe_draco, $generate_label ): void {
				?>
				<a href="<?php echo esc_url( self::dashboard_refresh_analysis_url( $asset_id ) ); ?>" class="tw-btn tw-btn-ghost tw-btn-xs tw-h-8 tw-min-h-0 tw-w-8 tw-p-0 tw-text-slate-600" title="Refresh GLB analysis" aria-label="Refresh GLB analysis" data-vrodos-dashboard-action="refresh-analysis" data-asset-id="<?php echo esc_attr( (string) $asset_id ); ?>">
					<i data-lucide="refresh-cw" class="tw-w-3 tw-h-3"></i>
				</a>
				<?php if ( $can_generate_safe_draco ) : ?>
					<a href="<?php echo esc_url( self::dashboard_optimize_url( $asset_id ) ); ?>" class="tw-btn tw-btn-ghost tw-btn-xs tw-h-8 tw-min-h-0 tw-w-8 tw-p-0 tw-text-primary" title="<?php echo esc_attr( $generate_label ); ?> derivative" aria-label="<?php echo esc_attr( $generate_label ); ?> derivative">
						<i data-lucide="package-check" class="tw-w-3 tw-h-3"></i>
					</a>
				<?php endif; ?>
				<a href="<?php echo esc_url( get_edit_post_link( $asset_id, 'raw' ) ?: '#' ); ?>" class="tw-btn tw-btn-ghost tw-btn-xs tw-h-8 tw-min-h-0 tw-w-8 tw-p-0 tw-text-slate-500" title="Edit asset" aria-label="Edit asset">
					<i data-lucide="edit-3" class="tw-w-3 tw-h-3"></i>
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
}
