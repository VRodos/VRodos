<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-project-type.php';
require_once __DIR__ . '/class-vrodos-compiler-entity-policy.php';

final class VRodos_Spatial_Diary {
	private const META = '_vrodos_spatial_diary';
	public const STAGE_COLUMNS = [ 'stage_id', 'sequence', 'recorded_on', 'title', 'context_id', 'notes', 'source_ref' ];
	public const FIND_COLUMNS = [ 'find_id', 'find_label', 'discovery_stage_id', 'entry_id', 'sequence', 'recorded_on', 'title', 'notes', 'source_ref' ];

	public static function register_hooks(): void {
		add_action( 'wp_ajax_vrodos_spatial_diary', [ self::class, 'ajax' ] );
	}

	public static function can_edit( int $project, int $scene ): bool {
		return 'vrodos_game' === get_post_type( $project ) && 'vrodos_scene' === get_post_type( $scene )
			&& current_user_can( 'edit_post', $project ) && current_user_can( 'edit_post', $scene )
			&& has_term( VRodos_Project_Type::ARCHAEOLOGICAL_SITE, 'vrodos_game_type', $project )
			&& has_term( get_post_field( 'post_name', $project ), 'vrodos_scene_pgame', $scene );
	}

	public static function read( int $scene ): array {
		$saved = get_post_meta( $scene, self::META, true );
		return is_array( $saved ) ? $saved : [
			'version' => 1, 'revision' => 0, 'safePoint' => null,
			'models' => [], 'stages' => [], 'finds' => [],
		];
	}

	public static function ajax(): void {
		$project = absint( $_POST['project'] ?? 0 );
		$scene = absint( $_POST['scene'] ?? 0 );
		if ( ! check_ajax_referer( 'vrodos_spatial_diary', 'nonce', false ) || ! self::can_edit( $project, $scene ) ) {
			wp_send_json_error( 'You cannot edit diaries in this scene.', 403 );
		}
		$mode = sanitize_key( $_POST['mode'] ?? '' );
		if ( 'read' === $mode ) {
			wp_send_json_success( self::read( $scene ) );
		}
		try {
			$draft = json_decode( wp_unslash( (string) ( $_POST['diary'] ?? '' ) ), true, 32, JSON_THROW_ON_ERROR );
			if ( ! is_array( $draft ) ) {
				throw new InvalidArgumentException( 'Invalid diary document.' );
			}
			$draft = self::normalize( $draft );
			if ( 'preview' === $mode ) {
				wp_send_json_success( self::import_csv( $draft, sanitize_key( $_POST['kind'] ?? '' ), wp_unslash( (string) ( $_POST['csv'] ?? '' ) ) ) );
			}
			if ( 'save' !== $mode ) {
				throw new InvalidArgumentException( 'Unknown diary operation.' );
			}
			$objects = json_decode( (string) get_post_field( 'post_content', $scene ) )->objects ?? null;
			self::resolve_models( $draft, $objects, $project );
			wp_send_json_success( self::save( $scene, $draft ) );
		} catch ( TypeError $error ) {
			wp_send_json_error( 'The diary document contains invalid field types.', 400 );
		} catch ( InvalidArgumentException | JsonException $error ) {
			wp_send_json_error( $error->getMessage(), 400 );
		} catch ( RuntimeException $error ) {
			wp_send_json_error( $error->getMessage(), 409 );
		}
	}

	private static function save( int $scene, array $draft ): array {
		$directory = VRodos_Storage_Manager::private_entity_directory( 'scene', $scene, 'diaries' );
		$lock = is_wp_error( $directory ) ? false : fopen( $directory . 'save.lock', 'c' );
		if ( ! $lock ) {
			throw new RuntimeException( 'Diary storage is unavailable.' );
		}
		try {
			if ( ! flock( $lock, LOCK_EX ) ) {
				throw new RuntimeException( 'Diary storage is busy.' );
			}
			wp_cache_delete( $scene, 'post_meta' );
			if ( self::read( $scene )['revision'] !== $draft['revision'] ) {
				throw new RuntimeException( 'The diary changed. Reload it before saving another edit.' );
			}
			++$draft['revision'];
			if ( ! update_post_meta( $scene, self::META, wp_slash( $draft ) ) ) {
				throw new RuntimeException( 'The diary could not be saved.' );
			}
			return $draft;
		} finally {
			fclose( $lock );
		}
	}

	private static function identifier( $value ): string {
		$value = trim( (string) $value );
		if ( ! preg_match( '/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,95}$/D', $value ) ) {
			throw new InvalidArgumentException( 'IDs use letters, numbers, underscores, periods or hyphens.' );
		}
		return $value;
	}

	private static function point( $value ): ?array {
		if ( null === $value ) {
			return null;
		}
		if ( ! is_array( $value ) || 3 !== count( $value ) || count( array_filter( $value, static fn( $number ) => is_numeric( $number ) && is_finite( (float) $number ) ) ) !== 3 ) {
			throw new InvalidArgumentException( 'A spatial point needs three finite coordinates.' );
		}
		return array_map( 'floatval', array_values( $value ) );
	}

	private static function record( array $value ): array {
		$sequence = filter_var( $value['sequence'] ?? null, FILTER_VALIDATE_INT, [ 'options' => [ 'min_range' => 1 ] ] );
		$title = sanitize_text_field( $value['title'] ?? '' );
		$date = trim( (string) ( $value['recorded_on'] ?? '' ) );
		if ( false === $sequence || '' === $title ) {
			throw new InvalidArgumentException( 'Enter a title and a positive sequence number.' );
		}
		if ( '' !== $date && ( ! preg_match( '/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/D', $date, $parts )
			|| ! checkdate( (int) ( $parts[2] ?? 1 ), (int) ( $parts[3] ?? 1 ), (int) $parts[1] ) ) ) {
			throw new InvalidArgumentException( 'Use a valid date in YYYY, YYYY-MM or YYYY-MM-DD format.' );
		}
		return [ 'sequence' => $sequence, 'title' => $title, 'recorded_on' => $date,
			'notes' => sanitize_textarea_field( $value['notes'] ?? '' ), 'source_ref' => sanitize_text_field( $value['source_ref'] ?? '' ) ];
	}

	private static function ordered( array $records ): array {
		usort( $records, static fn( array $a, array $b ) => $a['sequence'] <=> $b['sequence'] );
		if ( count( array_unique( array_column( $records, 'sequence' ) ) ) !== count( $records ) ) {
			throw new InvalidArgumentException( 'Sequence numbers must be unique within a timeline.' );
		}
		return $records;
	}

	public static function normalize( array $document ): array {
		$models = [];
		foreach ( (array) ( $document['models'] ?? [] ) as $id ) {
			$models[] = self::identifier( $id );
		}
		$stages = [];
		foreach ( (array) ( $document['stages'] ?? [] ) as $stage ) {
			if ( ! is_array( $stage ) ) throw new InvalidArgumentException( 'Each excavation entry must be a record.' );
			$id = self::identifier( $stage['stage_id'] ?? '' );
			if ( isset( $stages[ $id ] ) ) {
				throw new InvalidArgumentException( 'Duplicate excavation entry ' . $id . '.' );
			}
			$layers = array_values( array_unique( array_map( self::identifier(...), (array) ( $stage['layers'] ?? [] ) ) ) );
			if ( array_diff( $layers, $models ) ) {
				throw new InvalidArgumentException( 'Select managed scene models for entry ' . $id . '.' );
			}
			$site_model = (string) ( $stage['site_model'] ?? '' );
			if ( '' !== $site_model && ! in_array( $site_model, $layers, true ) ) {
				throw new InvalidArgumentException( 'The site model must be visible in entry ' . $id . '.' );
			}
			$stages[ $id ] = self::record( $stage ) + [ 'stage_id' => $id, 'context_id' => sanitize_text_field( $stage['context_id'] ?? '' ),
				'site_model' => $site_model, 'layers' => $layers ];
		}
		$finds = [];
		foreach ( (array) ( $document['finds'] ?? [] ) as $find ) {
			if ( ! is_array( $find ) ) throw new InvalidArgumentException( 'Each find must be a record.' );
			$id = self::identifier( $find['find_id'] ?? '' );
			$stage = self::identifier( $find['discovery_stage_id'] ?? '' );
			$label = sanitize_text_field( $find['find_label'] ?? '' );
			if ( isset( $finds[ $id ] ) || ! isset( $stages[ $stage ] ) || '' === $label ) {
				throw new InvalidArgumentException( 'Find ' . $id . ' needs a unique ID, label and existing discovery entry.' );
			}
			$entries = [];
			foreach ( (array) ( $find['entries'] ?? [] ) as $entry ) {
				if ( ! is_array( $entry ) ) throw new InvalidArgumentException( 'Each find entry must be a record.' );
				$entry_id = self::identifier( $entry['entry_id'] ?? '' );
				$model = empty( $entry['model'] ) ? '' : self::identifier( $entry['model'] );
				if ( isset( $entries[ $entry_id ] ) || ( '' !== $model && ! in_array( $model, $models, true ) ) ) {
					throw new InvalidArgumentException( 'Find entry ' . $entry_id . ' needs a unique ID and a managed model assignment.' );
				}
				$pins = [];
				foreach ( (array) ( $entry['pins'] ?? [] ) as $pin ) {
					$point = self::point( $pin['point'] ?? null );
					$text = sanitize_textarea_field( $pin['text'] ?? '' );
					if ( null === $point || '' === $text ) {
						throw new InvalidArgumentException( 'Each annotation pin needs a point and text.' );
					}
					$pins[] = [ 'point' => $point, 'text' => $text, 'model' => self::identifier( $pin['model'] ?? '' ) ];
				}
				$entries[ $entry_id ] = self::record( $entry ) + [ 'entry_id' => $entry_id, 'model' => $model, 'pins' => $pins ];
			}
			$entries = self::ordered( $entries );
			$active_model = '';
			foreach ( $entries as $entry ) {
				$active_model = $entry['model'] ?: $active_model;
				foreach ( $entry['pins'] as $pin ) {
					if ( $pin['model'] !== $active_model ) {
						throw new InvalidArgumentException( 'Review the pins on ' . $entry['title'] . ' after changing its model version.' );
					}
				}
			}
			$finds[ $id ] = [ 'find_id' => $id, 'find_label' => $label, 'discovery_stage_id' => $stage,
				'point' => self::point( $find['point'] ?? null ), 'entries' => $entries ];
		}
		return [ 'version' => 1, 'revision' => absint( $document['revision'] ?? 0 ),
			'safePoint' => self::point( $document['safePoint'] ?? null ),
			'models' => array_values( array_unique( $models ) ), 'stages' => self::ordered( $stages ), 'finds' => array_values( $finds ) ];
	}

	public static function import_csv( array $draft, string $kind, string $csv ): array {
		$columns = match ( $kind ) {
			'stages' => self::STAGE_COLUMNS,
			'finds' => self::FIND_COLUMNS,
			default => throw new InvalidArgumentException( 'Choose an excavation or find CSV template.' ),
		};
		if ( strlen( $csv ) > 1024 * 1024 || ! preg_match( '//u', $csv ) ) {
			throw new InvalidArgumentException( 'Use a UTF-8 CSV file under 1 MB.' );
		}
		$stream = fopen( 'php://memory', 'r+' );
		fwrite( $stream, str_starts_with( $csv, "\xEF\xBB\xBF" ) ? substr( $csv, 3 ) : $csv );
		rewind( $stream );
		$stages = array_column( $draft['stages'], null, 'stage_id' );
		$finds = array_column( $draft['finds'], null, 'find_id' );
		$seen = $parents = $errors = $changes = [];
		$counts = [ 'added' => 0, 'updated' => 0, 'unchanged' => 0 ];
		try {
			$delimiter = ',';
			if ( $columns !== fgetcsv( $stream, 0, $delimiter, '"', '' ) ) {
				$delimiter = ';';
				rewind( $stream );
				if ( $columns !== fgetcsv( $stream, 0, $delimiter, '"', '' ) ) {
					throw new InvalidArgumentException( 'CSV headers do not match the selected template.' );
				}
			}
			for ( $number = 2; false !== ( $cells = fgetcsv( $stream, 0, $delimiter, '"', '' ) ); ++$number ) {
				if ( [ null ] === $cells ) {
					continue;
				}
				try {
					if ( count( $cells ) !== count( $columns ) ) {
						throw new InvalidArgumentException( 'Wrong number of columns.' );
					}
					$row = array_combine( $columns, $cells );
					$record = self::record( $row );
					if ( 'stages' === $kind ) {
						$id = self::identifier( $row['stage_id'] );
						$key = $id;
						$old = $stages[ $id ] ?? null;
						$new = $record + [ 'stage_id' => $id, 'context_id' => sanitize_text_field( $row['context_id'] ),
							'site_model' => $old['site_model'] ?? '', 'layers' => $old['layers'] ?? [] ];
					} else {
						$id = self::identifier( $row['find_id'] );
						$entry = self::identifier( $row['entry_id'] );
						$key = $id . ':' . $entry;
						$stage = self::identifier( $row['discovery_stage_id'] );
						$label = sanitize_text_field( $row['find_label'] );
						if ( ! isset( $stages[ $stage ] ) || '' === $label ) {
							throw new InvalidArgumentException( 'Enter a find label and an existing discovery entry.' );
						}
						if ( isset( $parents[ $id ] ) && $parents[ $id ] !== [ $stage, $label ] ) {
							throw new InvalidArgumentException( 'Rows for the same find must agree on its label and discovery entry.' );
						}
						$entries = array_column( $finds[ $id ]['entries'] ?? [], null, 'entry_id' );
						$old = $entries[ $entry ] ?? null;
						$new = $record + [ 'entry_id' => $entry, 'model' => $old['model'] ?? '', 'pins' => $old['pins'] ?? [] ];
					}
					if ( isset( $seen[ $key ] ) ) {
						throw new InvalidArgumentException( 'Duplicate entry ID.' );
					}
					$seen[ $key ] = $number;
					if ( 'stages' === $kind ) {
						$stages[ $id ] = $new;
					} else {
						$parents[ $id ] = [ $stage, $label ];
						$entries[ $entry ] = $new;
						$finds[ $id ] = [ 'find_id' => $id, 'find_label' => $label, 'discovery_stage_id' => $stage,
							'point' => $finds[ $id ]['point'] ?? null, 'entries' => array_values( $entries ) ];
					}
					$change = null === $old ? 'added' : ( $old === $new ? 'unchanged' : 'updated' );
					++$counts[ $change ];
					if ( 'unchanged' !== $change ) {
						$changes[] = [ 'key' => $key, 'title' => $record['title'], 'change' => $change ];
					}
				} catch ( InvalidArgumentException $error ) {
					$errors[] = 'Row ' . $number . ': ' . $error->getMessage();
				}
			}
		} finally {
			fclose( $stream );
		}
		if ( ! $errors ) {
			try {
				$draft['stages'] = array_values( $stages );
				$draft['finds'] = array_values( $finds );
				$draft = self::normalize( $draft );
			} catch ( InvalidArgumentException $error ) {
				$errors[] = $error->getMessage();
			}
		}
		return [ 'diary' => $errors ? null : $draft, 'errors' => $errors, 'counts' => $counts, 'changes' => $changes ];
	}

	private static function resolve_models( array $draft, $objects, int $project ): array {
		$placements = [];
		foreach ( (array) $objects as $object ) {
			if ( is_object( $object ) && ! empty( $object->uuid ) ) {
				$placements[ $object->uuid ] = $object;
			}
		}
		$result = [];
		$policy = new VRodos_Compiler_Entity_Policy();
		foreach ( $draft['models'] as $id ) {
			$object = $placements[ $id ] ?? null;
			$asset = (int) ( $object->asset_id ?? 0 );
			if ( ! $asset || 'vrodos_asset3d' !== get_post_type( $asset ) || ! get_post_meta( $asset, 'vrodos_asset3d_glb', true )
				|| ! in_array( $policy->effective_category( $object ), [ 'decoration', 'walkable-surface', 'collision-proxy' ], true )
				|| ( ! has_term( get_post_field( 'post_name', $project ), 'vrodos_asset3d_pgame', $asset ) && ! VRodos_Shared_Repository_Manager::is_shared_asset( $asset ) ) ) {
				throw new InvalidArgumentException( 'Diary model ' . $id . ' needs a saved GLB placement from this project or the shared library.' );
			}
			$result[ $id ] = $object;
		}
		return $result;
	}

	public static function prepare_scene( object $scene, int $project, int $scene_id, string $mode ): void {
		$draft = self::read( $scene_id );
		if ( ! $draft['stages'] ) {
			return;
		}
		if ( 'single-player' !== $mode ) {
			throw new RuntimeException( 'Build archaeological diaries with the Single-player static runtime.', 409 );
		}
		$models = self::resolve_models( $draft, $scene->objects ?? null, $project );
		$changes_walkable_layout = self::validate_publication( $draft, $models );
		$used = array_merge( ...array_column( $draft['stages'], 'layers' ) );
		foreach ( $draft['finds'] as $find ) {
			$used = array_merge( $used, array_filter( array_column( $find['entries'], 'model' ) ) );
		}
		$scene->spatial_diary = (object) array_intersect_key( $draft, array_flip( [ 'safePoint', 'stages', 'finds' ] ) );
		foreach ( array_keys( $scene->spatial_diary->stages ) as $index ) {
			unset( $scene->spatial_diary->stages[ $index ]['site_model'] );
		}
		$scene->spatial_diary->changesWalkableLayout = $changes_walkable_layout;
		$scene->spatial_diary->models = (object) array_intersect_key( $models, array_fill_keys( $used, true ) );
		$managed = array_fill_keys( $draft['models'], true );
		foreach ( (array) ( $scene->objects ?? [] ) as $key => $object ) {
			if ( isset( $managed[ $object->uuid ?? '' ] ) ) {
				unset( $scene->objects->{$key} );
			}
		}
	}

	private static function validate_publication( array $draft, array $models ): bool {
		$policy = new VRodos_Compiler_Entity_Policy();
		$walkable_states = [];
		foreach ( $draft['stages'] as $stage ) {
			$physical = array_values( array_filter( $stage['layers'], static fn( string $id ): bool => 'none' !== $policy->collision_shape( $models[ $id ] ) ) );
			sort( $physical );
			$walkable_states[] = implode( '|', $physical );
		}
		$changes_walkable_layout = count( array_unique( $walkable_states ) ) > 1;
		if ( $changes_walkable_layout && null === $draft['safePoint'] ) {
			throw new InvalidArgumentException( 'Set a safe viewpoint on stable ground before publishing changing walkable geometry.' );
		}
		foreach ( $draft['finds'] as $find ) {
			if ( null === $find['point'] || empty( $find['entries'][0]['model'] ) ) {
				throw new InvalidArgumentException( 'Place find ' . $find['find_id'] . ' and assign its first model before publishing.' );
			}
		}
		return $changes_walkable_layout;
	}
}
