<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-runtime-settings-contract.php';

/** Batched, idempotent migration for page-template and scene metadata aliases. */
final class VRodos_Legacy_Metadata_Migration {
	public const COMPLETE_OPTION = 'vrodos_metadata_migration_v2_complete';
	public const REPORT_OPTION   = 'vrodos_metadata_migration_v2_report';
	private const CURSOR_OPTION  = 'vrodos_metadata_migration_v2_cursor';
	private const BATCH_SIZE     = 50;
	private const PAGE_TEMPLATES = [
		'vrodos-project-manager-template.php',
		'vrodos-assets-list-template.php',
		'vrodos-edit-3D-scene-template.php',
		'vrodos-asset-editor-template.php',
	];

	private const LEGACY_ATMOSPHERE_KEYS = [
		'aframePmndrsSunElevationDeg',
		'aframePmndrsSunAzimuthDeg',
		'aframePmndrsSunDistance',
		'aframePmndrsSunAngularRadius',
		'aframePmndrsAerialStrength',
		'aframePmndrsAlbedoScale',
		'aframePmndrsTransmittanceEnabled',
		'aframePmndrsInscatterEnabled',
		'aframePmndrsGroundEnabled',
		'aframePmndrsGroundAlbedo',
		'aframePmndrsRayleighScale',
		'aframePmndrsMieScatteringScale',
		'aframePmndrsMieExtinctionScale',
		'aframePmndrsMiePhaseG',
		'aframePmndrsAbsorptionScale',
		'aframePmndrsMoonEnabled',
	];

	public function run_batch(): void {
		if ( self::is_complete() ) {
			return;
		}

		$report = (array) get_option(
			self::REPORT_OPTION,
			[ 'migrated' => 0, 'malformed' => 0, 'remaining' => 0 ]
		);
		$report['migrated']  = (int) ( $report['migrated'] ?? 0 ) + $this->migrate_page_templates();
		$batch               = $this->migrate_scene_batch( absint( get_option( self::CURSOR_OPTION, 0 ) ) );
		$report['migrated'] += $batch['migrated'];
		$malformed_records = is_array( $report['malformedRecords'] ?? null ) ? $report['malformedRecords'] : [];
		foreach ( $batch['malformedById'] as $scene_id => $malformed_count ) {
			$malformed_records[ (string) $scene_id ] = max( (int) ( $malformed_records[ (string) $scene_id ] ?? 0 ), (int) $malformed_count );
		}
		$report['malformedRecords'] = $malformed_records;
		$report['malformed']        = array_sum( array_map( 'intval', $malformed_records ) );
		$report['remaining'] = $this->remaining_count();
		$report['lastRun']   = gmdate( 'c' );

		if ( $batch['lastId'] > 0 ) {
			update_option( self::CURSOR_OPTION, $batch['lastId'], false );
		} elseif ( $report['remaining'] > 0 ) {
			update_option( self::CURSOR_OPTION, 0, false );
		}
		if ( 0 === $report['remaining'] ) {
			$report['complete'] = true;
			update_option( self::COMPLETE_OPTION, '1', false );
			delete_option( self::CURSOR_OPTION );
		}
		update_option( self::REPORT_OPTION, $report, false );
	}

	public static function is_complete(): bool {
		return '1' === get_option( self::COMPLETE_OPTION );
	}

	public static function report(): array {
		return (array) get_option( self::REPORT_OPTION, [ 'migrated' => 0, 'malformed' => 0, 'remaining' => 0 ] );
	}

	public function render_admin_notice(): void {
		if ( self::is_complete() || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$report = self::report();
		echo '<div class="notice notice-warning"><p>' . esc_html(
			sprintf(
				'VRodos metadata migration is still running: %d migrated, %d malformed, %d remaining.',
				(int) ( $report['migrated'] ?? 0 ),
				(int) ( $report['malformed'] ?? 0 ),
				(int) ( $report['remaining'] ?? 0 )
			)
		) . '</p></div>';
	}

	private function migrate_page_templates(): int {
		global $wpdb;
		$migrated = 0;
		foreach ( self::PAGE_TEMPLATES as $template ) {
			$legacy    = VRodos_Path_Manager::legacy_page_template_meta( $template );
			$canonical = VRodos_Path_Manager::canonical_page_template_meta( $template );
			$updated   = $wpdb->update(
				$wpdb->postmeta,
				[ 'meta_value' => $canonical ],
				[ 'meta_key' => '_wp_page_template', 'meta_value' => $legacy ],
				[ '%s' ],
				[ '%s', '%s' ]
			);
			if ( false !== $updated ) {
				$migrated += (int) $updated;
			}
		}
		return $migrated;
	}

	private function migrate_scene_batch( int $cursor ): array {
		global $wpdb;
		$conditions = [ $this->like_condition( 'composite_params' ) ];
		foreach ( self::LEGACY_ATMOSPHERE_KEYS as $key ) {
			$conditions[] = $this->like_condition( $key );
		}
		$sql = $wpdb->prepare(
			"SELECT ID, post_content FROM {$wpdb->posts} WHERE post_type = %s AND ID > %d AND (" . implode( ' OR ', $conditions ) . ') ORDER BY ID ASC LIMIT %d',
			'vrodos_scene',
			$cursor,
			self::BATCH_SIZE
		);
		$posts     = $wpdb->get_results( $sql );
		$migrated  = 0;
		$malformed_by_id = [];
		$last_id   = 0;
		foreach ( is_array( $posts ) ? $posts : [] as $post ) {
			$last_id = absint( $post->ID ?? 0 );
			$scene   = json_decode( (string) ( $post->post_content ?? '' ) );
			if ( ! is_object( $scene ) ) {
				$malformed_by_id[ $last_id ] = 1;
				continue;
			}
			$post_malformed  = 0;
			$metadata        = is_object( $scene->metadata ?? null ) ? $scene->metadata : new stdClass();
			$scene->metadata = $metadata;
			$changed         = $this->migrate_composite_params( $metadata, $post_malformed );
			if ( $post_malformed > 0 ) {
				$malformed_by_id[ $last_id ] = $post_malformed;
			}
			$changed         = $this->migrate_atmosphere_preset( $metadata ) || $changed;
			if ( ! $changed ) {
				continue;
			}
			$result = wp_update_post(
				[
					'ID'           => $last_id,
					'post_content' => wp_json_encode( $scene, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
				],
				true
			);
			if ( ! is_wp_error( $result ) ) {
				++$migrated;
			}
		}
		return [ 'migrated' => $migrated, 'malformedById' => $malformed_by_id, 'lastId' => $last_id ];
	}

	private function migrate_composite_params( object $metadata, int &$malformed ): bool {
		if ( ! property_exists( $metadata, 'composite_params' ) ) {
			return false;
		}
		$wire_to_setting = [];
		foreach ( VRodos_Runtime_Settings_Contract::settings() as $setting_key => $definition ) {
			if ( false === ( $definition['wireEnabled'] ?? true ) ) {
				continue;
			}
			$wire_to_setting[ VRodos_Runtime_Settings_Contract::wire_key( (string) $setting_key ) ] = (string) $setting_key;
		}
		$blocked = [ 'runtimeMode', 'vrRuntimeProfile', 'pr_type', 'cam_position', 'cam_rotation_y', 'rootShadowType' ];
		foreach ( explode( ';', trim( (string) $metadata->composite_params ) ) as $part ) {
			$part = trim( $part );
			if ( '' === $part ) {
				continue;
			}
			if ( ! str_contains( $part, ':' ) ) {
				++$malformed;
				continue;
			}
			[ $wire_key, $value ] = array_map( 'trim', explode( ':', $part, 2 ) );
			if ( in_array( $wire_key, $blocked, true ) || ! isset( $wire_to_setting[ $wire_key ] ) ) {
				++$malformed;
				continue;
			}
			$setting_key = $wire_to_setting[ $wire_key ];
			$metadata_key = VRodos_Runtime_Settings_Contract::metadata_key( $setting_key );
			if ( ! property_exists( $metadata, $metadata_key ) ) {
				$metadata->{$metadata_key} = VRodos_Runtime_Settings_Contract::normalize( $setting_key, $value );
			}
		}
		unset( $metadata->composite_params );
		return true;
	}

	private function migrate_atmosphere_preset( object $metadata ): bool {
		if ( property_exists( $metadata, 'aframePmndrsAtmospherePreset' ) ) {
			return false;
		}
		foreach ( self::LEGACY_ATMOSPHERE_KEYS as $key ) {
			if ( property_exists( $metadata, $key ) ) {
				$metadata->aframePmndrsAtmospherePreset = 'custom';
				return true;
			}
		}
		return false;
	}

	private function remaining_count(): int {
		global $wpdb;
		$legacy_atmosphere = [];
		foreach ( self::LEGACY_ATMOSPHERE_KEYS as $key ) {
			$legacy_atmosphere[] = $this->like_condition( $key );
		}
		$atmosphere_condition = '(' . implode( ' OR ', $legacy_atmosphere ) . ') AND post_content NOT LIKE ' . $this->sql_literal_like( 'aframePmndrsAtmospherePreset' );
		$sql = $wpdb->prepare(
			"SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = %s AND (" . $this->like_condition( 'composite_params' ) . ' OR (' . $atmosphere_condition . '))',
			'vrodos_scene'
		);
		return (int) $wpdb->get_var( $sql ) + $this->remaining_page_template_count();
	}

	private function remaining_page_template_count(): int {
		global $wpdb;
		$remaining = 0;
		foreach ( self::PAGE_TEMPLATES as $template ) {
			$remaining += (int) $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = %s AND meta_value = %s",
					'_wp_page_template',
					VRodos_Path_Manager::legacy_page_template_meta( $template )
				)
			);
		}
		return $remaining;
	}

	private function like_condition( string $json_key ): string {
		return 'post_content LIKE ' . $this->sql_literal_like( $json_key );
	}

	private function sql_literal_like( string $json_key ): string {
		global $wpdb;
		return $wpdb->prepare( '%s', '%' . $wpdb->esc_like( '"' . $json_key . '"' ) . '%' );
	}
}
