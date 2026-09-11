<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Schedules optimizer work and lets an active compile jump ahead of background jobs. */
trait VRodos_Asset_Optimization_Queue {
	private const BUILD_QUEUE_PRIORITY = 'build';

	/**
	 * WP-Cron has no native priority field and dispatches due events by timestamp.
	 * Reserve the earliest valid timestamp for active-build work so it runs before
	 * ordinary background derivative jobs on the next scheduler pass.
	 */
	private const BUILD_PRIORITY_EVENT_TIMESTAMP = 1;

	private static function normalize_optimizer_queue_priority( string $priority ): string {
		return self::BUILD_QUEUE_PRIORITY === sanitize_key( $priority ) ? self::BUILD_QUEUE_PRIORITY : 'normal';
	}

	private static function optimizer_queue_priority( string $existing, string $requested = 'normal' ): string {
		return self::BUILD_QUEUE_PRIORITY === self::normalize_optimizer_queue_priority( $existing )
			|| self::BUILD_QUEUE_PRIORITY === self::normalize_optimizer_queue_priority( $requested )
			? self::BUILD_QUEUE_PRIORITY
			: 'normal';
	}

	private static function schedule_optimizer_event( string $hook, array $args, int $delay, string $priority = 'normal' ) {
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
			return $result;
		}
		return $result ? true : new WP_Error( 'vrodos_optimizer_schedule_failed', 'WordPress did not schedule the optimizer job.' );
	}
}
