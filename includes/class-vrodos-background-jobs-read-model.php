<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Read-only view of the asset work already recorded by VRodos and WP-Cron. */
class VRodos_Background_Jobs_Read_Model {
	private const RECENT_LIMIT = 20;
	private const WEB_STALE_SECONDS = 12 * MINUTE_IN_SECONDS;
	private const IMPORT_STATUS_META = '_vrodos_asset_import_status';
	private const IMPORT_UPDATED_META = '_vrodos_asset_import_updated_at';
	private const DERIVATIVE_META = '_vrodos_asset3d_glb_derivatives';

	public static function snapshot(): array {
		$now = time();
		$jobs = [];
		$asset_ids = get_posts(
			[
				'post_type'      => 'vrodos_asset3d',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'no_found_rows'  => true,
			]
		);
		foreach ( $asset_ids as $asset_id ) {
			$asset_id = absint( $asset_id );
			$asset = self::asset_details( $asset_id );
			$import_status = sanitize_key( (string) get_post_meta( $asset_id, self::IMPORT_STATUS_META, true ) );
			if ( in_array( $import_status, [ 'pending', 'running', 'ready', 'failed' ], true ) ) {
				$scheduled = wp_next_scheduled( VRodos_Asset_Import_Execution::IMPORT_CRON_HOOK, [ $asset_id ] );
				$jobs[] = self::job(
					$asset,
					'Import',
					'pending' === $import_status ? 'queued' : $import_status,
					null,
					'failed' === $import_status
						? (string) get_post_meta( $asset_id, '_vrodos_asset_import_error', true )
						: match ( $import_status ) {
							'pending' => 'Model package is queued for GLB conversion.',
							'running' => 'Model package is being converted to GLB.',
							default => 'Model package is ready.',
						},
					self::timestamp( get_post_meta( $asset_id, self::IMPORT_UPDATED_META, true ) ),
					false === $scheduled ? null : (int) $scheduled,
					'normal',
					'pending' === $import_status && false === $scheduled ? 'No cron event is scheduled for this queued import.' : ''
				);
			}

			$meta = get_post_meta( $asset_id, self::DERIVATIVE_META, true );
			if ( ! is_array( $meta ) ) {
				continue;
			}
			$preview = $meta['derivatives']['editor-preview'] ?? null;
			if ( is_array( $preview ) ) {
				$status = sanitize_key( (string) ( $preview['status'] ?? '' ) );
				if ( in_array( $status, [ 'waiting-high', 'queued', 'running', 'ready', 'failed' ], true ) ) {
					$scheduled = wp_next_scheduled( VRodos_Asset_Optimization_Service::EDITOR_PREVIEW_CRON_HOOK, [ $asset_id ] );
					$waiting_high = 'waiting-high' === $status;
					$jobs[] = self::job(
						$asset,
						'Editor preview',
						$waiting_high ? 'queued' : $status,
						null,
						(string) ( $preview['message'] ?? '' ),
						self::timestamp( $preview['updatedAt'] ?? '' ),
						false === $scheduled ? null : (int) $scheduled,
						(string) ( $preview['queuePriority'] ?? 'normal' ),
						$waiting_high
							? 'Waiting for Web High; a separate preview cron event is not needed yet.'
							: ( 'queued' === $status && false === $scheduled ? 'No cron event is scheduled for this queued preview.' : '' )
					);
				}
			}

			foreach ( (array) ( $meta['webVariants'] ?? [] ) as $variant ) {
				if ( ! is_array( $variant ) ) {
					continue;
				}
				$profile = sanitize_key( (string) ( $variant['profile'] ?? '' ) );
				$status = sanitize_key( (string) ( $variant['status'] ?? '' ) );
				if ( ! in_array( $profile, [ 'web-high', 'web-medium', 'web-low' ], true )
					|| ! in_array( $status, [ 'queued', 'running', 'ready', 'failed' ], true ) ) {
					continue;
				}
				$args = is_array( $variant['cronArgs'] ?? null ) ? $variant['cronArgs'] : [];
				$scheduled = $args ? wp_next_scheduled( VRodos_Asset_Optimization_Service::DESKTOP_PROFILE_CRON_HOOK, $args ) : false;
				$updated = self::timestamp( $variant['updatedAt'] ?? $variant['generatedAt'] ?? '' );
				$percent = null;
				$message = (string) ( $variant['message'] ?? '' );
				$note = 'queued' === $status && false === $scheduled ? 'No cron event is scheduled for this queued derivative.' : '';
				if ( 'running' === $status ) {
					$progress = self::web_progress( $variant, $profile );
					if ( $progress ) {
						$percent = max( 0, min( 100, absint( $progress['percent'] ?? 0 ) ) );
						$message = (string) ( $progress['message'] ?? $message );
						$updated = self::timestamp( $progress['updatedAt'] ?? '' ) ?: $updated;
						if ( 100 === $percent && 'ready' === (string) ( $progress['status'] ?? '' ) ) {
							$message = 'Optimizer reached 100%; awaiting WordPress finalization.';
						}
					}
					if ( $updated > 0 && $now - $updated >= self::WEB_STALE_SECONDS ) {
						$note = 'No progress for 12 minutes; this job may be stalled.';
					}
				}
				$jobs[] = self::job(
					$asset,
					ucwords( str_replace( '-', ' ', $profile ) ),
					$status,
					$percent,
					$message,
					$updated,
					false === $scheduled ? null : (int) $scheduled,
					(string) ( $variant['profileOptions']['queuePriority'] ?? 'normal' ),
					$note
				);
			}
		}
		$ordered = self::arrange( $jobs, self::RECENT_LIMIT );
		return [
			'generatedAt'      => $now,
			'generatedAtLabel' => self::format_time( $now ),
			'scheduler'        => self::scheduler( $now ),
			'worker'           => self::worker( $now ),
			'active'           => $ordered['active'],
			'recent'           => $ordered['recent'],
		];
	}

	/** Pure ordering rule shared by the admin snapshot and business-rule tests. */
	public static function arrange( array $jobs, int $recent_limit = self::RECENT_LIMIT ): array {
		$active = [];
		$recent = [];
		foreach ( $jobs as $job ) {
			if ( in_array( $job['status'] ?? '', [ 'running', 'queued' ], true ) ) {
				$active[] = $job;
			} elseif ( in_array( $job['status'] ?? '', [ 'ready', 'failed' ], true )
				&& (int) ( $job['updatedAt'] ?? 0 ) > 0 ) {
				$recent[] = $job;
			}
		}
		usort(
			$active,
			static function ( array $a, array $b ): int {
				$state = ( 'running' === $a['status'] ? 0 : 1 ) <=> ( 'running' === $b['status'] ? 0 : 1 );
				if ( 0 !== $state ) {
					return $state;
				}
				$at_a = (int) ( $a['scheduledAt'] ?? PHP_INT_MAX );
				$at_b = (int) ( $b['scheduledAt'] ?? PHP_INT_MAX );
				return ( $at_a <=> $at_b ) ?: ( (int) ( $a['assetId'] ?? 0 ) <=> (int) ( $b['assetId'] ?? 0 ) );
			}
		);
		usort(
			$recent,
			static fn( array $a, array $b ): int => ( (int) ( $b['updatedAt'] ?? 0 ) <=> (int) ( $a['updatedAt'] ?? 0 ) )
				?: ( (int) ( $a['assetId'] ?? 0 ) <=> (int) ( $b['assetId'] ?? 0 ) )
		);
		return [ 'active' => $active, 'recent' => array_slice( $recent, 0, max( 0, $recent_limit ) ) ];
	}

	private static function asset_details( int $asset_id ): array {
		$title = html_entity_decode( wp_strip_all_tags( (string) get_the_title( $asset_id ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		return [
			'assetId'    => $asset_id,
			'assetLabel' => '' === $title ? sprintf( 'Asset #%d', $asset_id ) : $title,
			'editUrl'    => (string) ( get_edit_post_link( $asset_id, 'raw' ) ?: '' ),
		];
	}

	private static function job( array $asset, string $type, string $status, ?int $percent, string $message, int $updated, ?int $scheduled, string $priority, string $note ): array {
		return $asset + [
			'type'        => $type,
			'status'      => $status,
			'percent'     => $percent,
			'message'     => self::safe_message( $message ),
			'updatedAt'   => $updated,
			'updatedAtLabel' => self::format_time( $updated ),
			'scheduledAt' => $scheduled,
			'scheduledAtLabel' => self::format_time( $scheduled ?? 0 ),
			'priority'    => 'build' === sanitize_key( $priority ) ? 'Build' : 'Normal',
			'note'        => $note,
		];
	}

	private static function safe_message( string $message ): string {
		$message = wp_strip_all_tags( $message );
		if ( preg_match( '~[A-Za-z]:[/\\\\]|/(?:var|home|srv|tmp)/~', $message ) ) {
			return 'Job detail contains a private path; inspect the asset or server log.';
		}
		return substr( (string) $message, 0, 300 );
	}

	private static function timestamp( $value ): int {
		if ( is_numeric( $value ) ) {
			return max( 0, (int) $value );
		}
		$value = trim( (string) $value );
		if ( '' === $value ) {
			return 0;
		}
		$at = strtotime( preg_match( '/(?:Z|[+-]\d{2}:\d{2})$/', $value ) ? $value : $value . ' UTC' );
		return false === $at ? 0 : $at;
	}

	private static function format_time( int $timestamp ): string {
		if ( $timestamp <= 0 ) {
			return '';
		}
		return wp_date( (string) get_option( 'date_format' ) . ' ' . (string) get_option( 'time_format' ), $timestamp );
	}

	private static function web_progress( array $record, string $profile ): array {
		$path = wp_normalize_path( (string) ( $record['progressPath'] ?? '' ) );
		$root = VRodos_Storage_Manager::private_site_root( false );
		if ( ! is_string( $root ) || '' === $path
			|| ! str_starts_with( $path, trailingslashit( wp_normalize_path( $root ) ) )
			|| ! is_file( $path ) || ! is_readable( $path ) ) {
			return [];
		}
		$size = filesize( $path );
		if ( false === $size || $size <= 0 || $size > 65536 ) {
			return [];
		}
		$progress = json_decode( (string) file_get_contents( $path ), true );
		if ( ! is_array( $progress ) || 1 !== absint( $progress['schemaVersion'] ?? 0 )
			|| $profile !== sanitize_key( (string) ( $progress['profile'] ?? '' ) )
			|| (string) ( $record['jobKey'] ?? '' ) !== (string) ( $progress['jobKey'] ?? '' )
			|| wp_normalize_path( (string) ( $record['sourcePath'] ?? '' ) ) !== wp_normalize_path( (string) ( $progress['sourcePath'] ?? '' ) ) ) {
			return [];
		}
		return $progress;
	}

	private static function scheduler( int $now ): array {
		$state = get_option( VRodos_Deployment_Health::STATE_OPTION, [] );
		$last_tick = is_array( $state ) ? absint( $state['lastTickAt'] ?? 0 ) : 0;
		$next_tick = (int) ( wp_next_scheduled( VRodos_Deployment_Health::TICK_HOOK ) ?: 0 );
		$age = $last_tick > 0 ? max( 0, $now - $last_tick ) : null;
		return [
			'status'          => null === $age || $age >= 45 * MINUTE_IN_SECONDS ? 'Critical' : ( $age >= 15 * MINUTE_IN_SECONDS ? 'Delayed' : 'Current' ),
			'lastTickAt'      => $last_tick,
			'lastTickAtLabel' => self::format_time( $last_tick ),
			'nextTickAt'      => $next_tick,
			'nextTickAtLabel' => self::format_time( $next_tick ),
			'cronDisabled'    => defined( 'DISABLE_WP_CRON' ) && DISABLE_WP_CRON,
		];
	}

	private static function worker( int $now ): array {
		$lease = get_option( VRodos_Asset_Optimization_Service::OPTIMIZER_LEASE_OPTION, [] );
		$owner = is_array( $lease ) ? (string) ( $lease['owner'] ?? '' ) : '';
		$expires = is_array( $lease ) ? absint( $lease['expiresAt'] ?? 0 ) : 0;
		if ( '' === $owner ) {
			return [ 'status' => 'Idle', 'assetLabel' => '', 'editUrl' => '', 'type' => '', 'expiresAt' => 0, 'expiresAtLabel' => '', 'note' => '' ];
		}
		$asset_id = 0;
		$type = '';
		$record_status = '';
		if ( preg_match( '/^web:(\d+):(.+)$/', $owner, $match ) ) {
			$asset_id = absint( $match[1] );
			$type = 'Web derivative';
			$meta = get_post_meta( $asset_id, self::DERIVATIVE_META, true );
			$record_status = is_array( $meta ) ? (string) ( $meta['webVariants'][ $match[2] ]['status'] ?? '' ) : '';
		} elseif ( preg_match( '/^preview:(\d+)$/', $owner, $match ) ) {
			$asset_id = absint( $match[1] );
			$type = 'Editor preview';
			$meta = get_post_meta( $asset_id, self::DERIVATIVE_META, true );
			$record_status = is_array( $meta ) ? (string) ( $meta['derivatives']['editor-preview']['status'] ?? '' ) : '';
		}
		$asset = $asset_id ? self::asset_details( $asset_id ) : [ 'assetLabel' => 'Unknown asset', 'editUrl' => '' ];
		return [
			'status'     => $expires <= $now ? 'Lease expired' : 'Busy',
			'assetLabel' => $asset['assetLabel'],
			'editUrl'    => $asset['editUrl'],
			'type'       => $type,
			'expiresAt'  => $expires,
			'expiresAtLabel' => self::format_time( $expires ),
			'note'       => $expires > $now && '' !== $record_status && 'running' !== $record_status
				? 'Lease is held while its job record is not running; queued work may be blocked.'
				: '',
		];
	}
}
