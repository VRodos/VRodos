<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-compiler-types.php';

/**
 * Commits a project artifact set without exposing partially rendered output.
 */
final class VRodos_Compiler_Artifact_Transaction {
	private string $build_dir;
	private $before_publish;

	public function __construct( ?string $build_dir = null, ?callable $before_publish = null ) {
		$this->build_dir      = $build_dir ?: VRodos_Path_Manager::runtime_build_path();
		$this->before_publish = $before_publish;
	}

	/** @param VRodos_Compile_Artifact[] $artifacts */
	public function commit( int $project_id, array $artifacts ): void {
		if ( empty( $artifacts ) ) {
			throw new RuntimeException( '[VRodos] Compiler produced no artifacts.' );
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
	private function commit_locked( int $project_id, array $artifacts ): void {
		$token       = function_exists( 'wp_generate_uuid4' ) ? wp_generate_uuid4() : bin2hex( random_bytes( 16 ) );
		$staging_dir = $this->build_dir . DIRECTORY_SEPARATOR . '.staging-project-' . max( 0, $project_id ) . '-' . preg_replace( '/[^a-zA-Z0-9-]/', '', $token );
		if ( ! wp_mkdir_p( $staging_dir ) ) {
			throw new RuntimeException( '[VRodos] Compiler staging directory could not be created.' );
		}

		$backups  = [];
		$committed = [];
		try {
			foreach ( $artifacts as $artifact ) {
				if ( ! $artifact instanceof VRodos_Compile_Artifact ) {
					throw new InvalidArgumentException( '[VRodos] Invalid compile artifact.' );
				}
				$staged_path = $staging_dir . DIRECTORY_SEPARATOR . $artifact->filename;
				if ( false === file_put_contents( $staged_path, $artifact->content, LOCK_EX ) ) {
					throw new RuntimeException( '[VRodos] Compiler staging write failed: ' . $artifact->filename );
				}
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
