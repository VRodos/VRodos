<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Schedules optimizer work and lets an active compile jump ahead of background jobs. */
trait VRodos_Asset_Optimization_Queue {
	protected const BUILD_QUEUE_PRIORITY = 'build';

	/**
	 * WP-Cron has no native priority field and dispatches due events by timestamp.
	 * Reserve the earliest valid timestamp for active-build work so it runs before
	 * ordinary background derivative jobs on the next scheduler pass.
	 */
	protected const BUILD_PRIORITY_EVENT_TIMESTAMP = 1;

	/** A lease is a reservation, not proof that an encoder is still alive. */
	public static function optimizer_lease_is_active( string $owner ): bool {
		$lease = get_option( self::OPTIMIZER_LEASE_OPTION, [] );
		return is_array( $lease )
			&& $owner === (string) ( $lease['owner'] ?? '' )
			&& absint( $lease['expiresAt'] ?? 0 ) > time();
	}

	protected static function normalize_optimizer_queue_priority( string $priority ): string {
		return self::BUILD_QUEUE_PRIORITY === sanitize_key( $priority ) ? self::BUILD_QUEUE_PRIORITY : 'normal';
	}

	protected static function optimizer_queue_priority( string $existing, string $requested = 'normal' ): string {
		return self::BUILD_QUEUE_PRIORITY === self::normalize_optimizer_queue_priority( $existing )
			|| self::BUILD_QUEUE_PRIORITY === self::normalize_optimizer_queue_priority( $requested )
			? self::BUILD_QUEUE_PRIORITY
			: 'normal';
	}

	/** Long WP-CLI batches must see cron events saved by other requests. */
	protected static function refresh_optimizer_cron_cache(): void {
		wp_cache_delete( 'cron', 'options' );
		wp_cache_delete( 'alloptions', 'options' );
	}

	protected static function schedule_optimizer_event( string $hook, array $args, int $delay, string $priority = 'normal' ) {
		self::refresh_optimizer_cron_cache();
		$priority = self::normalize_optimizer_queue_priority( $priority );
		$timestamp = self::BUILD_QUEUE_PRIORITY === $priority
			? self::BUILD_PRIORITY_EVENT_TIMESTAMP
			: time() + max( 1, $delay );
		$scheduled = wp_next_scheduled( $hook, $args );

		if ( false !== $scheduled ) {
			if ( self::BUILD_QUEUE_PRIORITY !== $priority || (int) $scheduled === $timestamp ) {
				return true;
			}

			$unscheduled = wp_unschedule_event( (int) $scheduled, $hook, $args, true );
			if ( is_wp_error( $unscheduled ) ) {
				return $unscheduled;
			}
			if ( ! $unscheduled ) {
				return new WP_Error( 'vrodos_optimizer_unschedule_failed', 'WordPress did not promote the queued optimizer job.' );
			}
		}

		$result = wp_schedule_single_event( $timestamp, $hook, $args, true );
		if ( is_wp_error( $result ) ) {
			// Concurrent writers can save the identical event before update_option(),
			// whose no-change result WordPress also reports as could_not_set.
			if ( 'could_not_set' === $result->get_error_code() ) {
				self::refresh_optimizer_cron_cache();
				$scheduled = wp_next_scheduled( $hook, $args );
				if ( false !== $scheduled && ( self::BUILD_QUEUE_PRIORITY !== $priority || (int) $scheduled === $timestamp ) ) {
					return true;
				}
			}
			return $result;
		}
		return $result ? true : new WP_Error( 'vrodos_optimizer_schedule_failed', 'WordPress did not schedule the optimizer job.' );
	}
}
