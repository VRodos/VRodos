<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-compiler-types.php';

/**
 * Commits a project artifact set without exposing partially rendered output.
 */
final class VRodos_Compiler_Artifact_Transaction {
	private const INVENTORY_SCHEMA_VERSION = 1;

	private ?string $build_dir;
	private $before_publish;

	public function __construct( ?string $build_dir = null, ?callable $before_publish = null ) {
		$this->build_dir      = $build_dir;
		$this->before_publish = $before_publish;
	}

	/** @param VRodos_Compile_Artifact[] $artifacts */
	public function commit( int $project_id, array $artifacts ): void {
		if ( empty( $artifacts ) ) {
			throw new RuntimeException( '[VRodos] Compiler produced no artifacts.' );
		}
		if ( null === $this->build_dir ) {
			$this->commit_project_publication( $project_id, $artifacts );
			return;
		}
		if ( ! is_dir( $this->build_dir ) && ! wp_mkdir_p( $this->build_dir ) ) {
			throw new RuntimeException( '[VRodos] Compiler output directory could not be created: ' . $this->build_dir );
		}
		if ( ! is_writable( $this->build_dir ) ) {
			throw new RuntimeException( '[VRodos] Compiler output directory is not writable: ' . $this->build_dir );
		}

		$lock_dir = $this->build_dir . DIRECTORY_SEPARATOR . '.locks';
		if ( ! is_dir( $lock_dir ) && ! wp_mkdir_p( $lock_dir ) ) {
			throw new RuntimeException( '[VRodos] Compiler lock directory could not be created.' );
		}
		$lock_path = $lock_dir . DIRECTORY_SEPARATOR . 'project-' . max( 0, $project_id ) . '.lock';
		$lock      = fopen( $lock_path, 'c+' );
		if ( false === $lock || ! flock( $lock, LOCK_EX | LOCK_NB ) ) {
			if ( is_resource( $lock ) ) {
				fclose( $lock );
			}
			throw new RuntimeException( '[VRodos] This project is already being compiled.', 409 );
		}

		try {
			$this->commit_locked( $project_id, $artifacts );
		} finally {
			flock( $lock, LOCK_UN );
			fclose( $lock );
		}
	}

	/** @param VRodos_Compile_Artifact[] $artifacts */
	private function commit_project_publication( int $project_id, array $artifacts ): void {
		$build_dir = VRodos_Storage_Manager::published_project_directory( $project_id, 'clients' );
		$lock_dir  = VRodos_Storage_Manager::temporary_directory( 'compiler-locks', 'shared' );
		$stage_dir = VRodos_Storage_Manager::temporary_directory( 'compile', wp_generate_uuid4() );
		if ( is_wp_error( $build_dir ) || is_wp_error( $lock_dir ) || is_wp_error( $stage_dir ) ) {
			$error = is_wp_error( $build_dir ) ? $build_dir : ( is_wp_error( $lock_dir ) ? $lock_dir : $stage_dir );
			throw new RuntimeException( $error->get_error_message() );
		}
		$lock = fopen( $lock_dir . 'project-' . $project_id . '.lock', 'c+' );
		if ( false === $lock || ! flock( $lock, LOCK_EX | LOCK_NB ) ) {
			if ( is_resource( $lock ) ) {
				fclose( $lock );
			}
			throw new RuntimeException( '[VRodos] This project is already being compiled.', 409 );
		}

		$token     = preg_replace( '/[^a-zA-Z0-9-]/', '', wp_generate_uuid4() );
		$prepared  = [];
		$backups   = [];
		$committed = [];
		try {
			$seen = [];
			foreach ( $artifacts as $artifact ) {
				if ( ! $artifact instanceof VRodos_Compile_Artifact || basename( $artifact->filename ) !== $artifact->filename || isset( $seen[ $artifact->filename ] ) ) {
					throw new InvalidArgumentException( '[VRodos] Invalid or duplicate compile artifact.' );
				}
				$seen[ $artifact->filename ] = true;
				$staged = $stage_dir . $artifact->filename;
				if ( false === file_put_contents( $staged, $artifact->content, LOCK_EX ) ) {
					throw new RuntimeException( '[VRodos] Compiler staging write failed.' );
				}
				$partial = $build_dir . $artifact->filename . '.' . $token . '.partial';
				if ( ! @copy( $staged, $partial ) || hash_file( 'sha256', $staged ) !== hash_file( 'sha256', $partial ) ) {
					throw new RuntimeException( '[VRodos] Compiler publication copy could not be verified.' );
				}
				$prepared[ $artifact->filename ] = $partial;
			}

			$previous = get_post_meta( $project_id, '_vrodos_published_inventory', true );
			$previous_clients = is_array( $previous ) && is_array( $previous['clients'] ?? null ) ? $previous['clients'] : [];
			foreach ( array_unique( array_merge( $previous_clients, array_keys( $prepared ) ) ) as $filename ) {
				$filename = basename( (string) $filename );
				$final    = $build_dir . $filename;
				if ( is_file( $final ) ) {
					$backup = $final . '.' . $token . '.previous';
					if ( ! @rename( $final, $backup ) ) {
						throw new RuntimeException( '[VRodos] Compiler could not back up an existing client.' );
					}
					$backups[ $final ] = $backup;
				}
			}
			foreach ( $prepared as $filename => $partial ) {
				$final = $build_dir . $filename;
				if ( is_callable( $this->before_publish ) ) {
					call_user_func( $this->before_publish, $filename, count( $committed ) );
				}
				if ( ! @rename( $partial, $final ) ) {
					throw new RuntimeException( '[VRodos] Compiler could not atomically publish ' . $filename . '.' );
				}
				$committed[] = $final;
			}
			foreach ( $backups as $backup ) {
				wp_delete_file( $backup );
			}
		} catch ( Throwable $error ) {
			foreach ( $committed as $final ) {
				wp_delete_file( $final );
			}
			foreach ( $backups as $final => $backup ) {
				if ( is_file( $backup ) ) {
					@rename( $backup, $final );
				}
			}
			throw $error;
		} finally {
			foreach ( $prepared as $partial ) {
				if ( is_file( $partial ) ) {
					wp_delete_file( $partial );
				}
			}
			$this->remove_staging_directory( untrailingslashit( $stage_dir ) );
			flock( $lock, LOCK_UN );
			fclose( $lock );
		}
	}

	/** @param VRodos_Compile_Artifact[] $artifacts */
	private function commit_locked( int $project_id, array $artifacts ): void {
		$token       = function_exists( 'wp_generate_uuid4' ) ? wp_generate_uuid4() : bin2hex( random_bytes( 16 ) );
		$staging_dir = $this->build_dir . DIRECTORY_SEPARATOR . '.staging-project-' . max( 0, $project_id ) . '-' . preg_replace( '/[^a-zA-Z0-9-]/', '', $token );
		if ( ! wp_mkdir_p( $staging_dir ) ) {
			throw new RuntimeException( '[VRodos] Compiler staging directory could not be created.' );
		}

		try {
			$manifest_dir = $this->build_dir . DIRECTORY_SEPARATOR . '.manifests';
			if ( ! is_dir( $manifest_dir ) && ! wp_mkdir_p( $manifest_dir ) ) {
				throw new RuntimeException( '[VRodos] Compiler artifact inventory directory could not be created.' );
			}

			$project_id     = max( 0, $project_id );
			$inventory_path = $manifest_dir . DIRECTORY_SEPARATOR . 'project-' . $project_id . '.json';
			$previous_files = $this->load_inventory( $inventory_path, $project_id );
			$new_files      = [];
			foreach ( $artifacts as $artifact ) {
				if ( ! $artifact instanceof VRodos_Compile_Artifact ) {
					throw new InvalidArgumentException( '[VRodos] Invalid compile artifact.' );
				}
				if ( isset( $new_files[ $artifact->filename ] ) ) {
					throw new InvalidArgumentException( '[VRodos] Duplicate compile artifact: ' . $artifact->filename );
				}
				$new_files[ $artifact->filename ] = true;
			}
			$inventory_files = array_keys( $new_files );
			sort( $inventory_files, SORT_STRING );
			$inventory_content = wp_json_encode(
				[
					'schemaVersion' => self::INVENTORY_SCHEMA_VERSION,
					'projectId'     => $project_id,
					'artifacts'     => $inventory_files,
				],
				JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
			);
			if ( ! is_string( $inventory_content ) ) {
				throw new RuntimeException( '[VRodos] Compiler artifact inventory could not be encoded.' );
			}
		} catch ( Throwable $error ) {
			$this->remove_staging_directory( $staging_dir );
			throw $error;
		}

		$backups   = [];
		$committed = [];
		try {
			foreach ( $artifacts as $artifact ) {
				$staged_path = $staging_dir . DIRECTORY_SEPARATOR . $artifact->filename;
				if ( false === file_put_contents( $staged_path, $artifact->content, LOCK_EX ) ) {
					throw new RuntimeException( '[VRodos] Compiler staging write failed: ' . $artifact->filename );
				}
			}
			$staged_inventory = $staging_dir . DIRECTORY_SEPARATOR . 'project-' . $project_id . '.inventory.json';
			if ( false === file_put_contents( $staged_inventory, $inventory_content . "\n", LOCK_EX ) ) {
				throw new RuntimeException( '[VRodos] Compiler artifact inventory staging write failed.' );
			}

			$stale_files = array_values( array_diff( $previous_files, $inventory_files ) );
			foreach ( $stale_files as $stale_file ) {
				$stale_path = $this->build_dir . DIRECTORY_SEPARATOR . $stale_file;
				if ( ! is_file( $stale_path ) ) {
					continue;
				}
				$backup_path = $staging_dir . DIRECTORY_SEPARATOR . 'stale-' . hash( 'sha256', $stale_file ) . '.previous';
				if ( ! rename( $stale_path, $backup_path ) ) {
					throw new RuntimeException( '[VRodos] Compiler could not back up stale artifact: ' . $stale_file );
				}
				$backups[ $stale_path ] = $backup_path;
			}

			foreach ( $artifacts as $artifact ) {
				$final_path  = $this->build_dir . DIRECTORY_SEPARATOR . $artifact->filename;
				$staged_path = $staging_dir . DIRECTORY_SEPARATOR . $artifact->filename;
				$backup_path = $staging_dir . DIRECTORY_SEPARATOR . $artifact->filename . '.previous';
				if ( is_callable( $this->before_publish ) ) {
					call_user_func( $this->before_publish, $artifact, count( $committed ) );
				}

				if ( is_file( $final_path ) ) {
					if ( ! rename( $final_path, $backup_path ) ) {
						throw new RuntimeException( '[VRodos] Compiler could not back up: ' . $artifact->filename );
					}
					$backups[ $final_path ] = $backup_path;
				}

				if ( ! rename( $staged_path, $final_path ) ) {
					throw new RuntimeException( '[VRodos] Compiler could not publish: ' . $artifact->filename );
				}
				$committed[] = $final_path;
			}

			$inventory_backup = $staging_dir . DIRECTORY_SEPARATOR . 'inventory.previous';
			if ( is_file( $inventory_path ) ) {
				if ( ! rename( $inventory_path, $inventory_backup ) ) {
					throw new RuntimeException( '[VRodos] Compiler could not back up the artifact inventory.' );
				}
				$backups[ $inventory_path ] = $inventory_backup;
			}
			if ( ! rename( $staged_inventory, $inventory_path ) ) {
				throw new RuntimeException( '[VRodos] Compiler could not publish the artifact inventory.' );
			}
			$committed[] = $inventory_path;
		} catch ( Throwable $error ) {
			foreach ( array_reverse( $committed ) as $final_path ) {
				if ( is_file( $final_path ) ) {
					unlink( $final_path );
				}
			}
			foreach ( $backups as $final_path => $backup_path ) {
				if ( is_file( $backup_path ) ) {
					rename( $backup_path, $final_path );
				}
			}
			throw $error;
		} finally {
			$this->remove_staging_directory( $staging_dir );
		}
	}

	/** @return string[] */
	private function load_inventory( string $inventory_path, int $project_id ): array {
		if ( ! is_file( $inventory_path ) ) {
			return [];
		}
		$decoded = json_decode( (string) file_get_contents( $inventory_path ), true );
		if (
			! is_array( $decoded ) ||
			self::INVENTORY_SCHEMA_VERSION !== (int) ( $decoded['schemaVersion'] ?? 0 ) ||
			$project_id !== (int) ( $decoded['projectId'] ?? -1 ) ||
			! is_array( $decoded['artifacts'] ?? null )
		) {
			throw new RuntimeException( '[VRodos] Compiler artifact inventory is invalid: ' . $inventory_path );
		}

		$files = [];
		foreach ( $decoded['artifacts'] as $filename ) {
			$filename = trim( str_replace( '\\', '/', (string) $filename ) );
			if ( '' === $filename || basename( $filename ) !== $filename ) {
				throw new RuntimeException( '[VRodos] Compiler artifact inventory contains an invalid filename.' );
			}
			$files[] = $filename;
		}
		return array_values( array_unique( $files ) );
	}

	private function remove_staging_directory( string $directory ): void {
		if ( ! is_dir( $directory ) ) {
			return;
		}
		foreach ( scandir( $directory ) ?: [] as $entry ) {
			if ( '.' === $entry || '..' === $entry ) {
				continue;
			}
			$path = $directory . DIRECTORY_SEPARATOR . $entry;
			if ( is_file( $path ) ) {
				unlink( $path );
			}
		}
		rmdir( $directory );
	}
}
