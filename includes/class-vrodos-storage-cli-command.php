<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Ownership-checked, resumable storage rollout commands. */
final class VRodos_Storage_CLI_Command {
	private const STATE_OPTION = 'vrodos_storage_migration_v1';
	private const LOCK_OPTION  = 'vrodos_storage_migration_lock';
	private const LEGACY_REPOSITORIES = [
		'archaeology-joker'       => 'vrodos-shared-assets-archaeology',
		'vrexpo-joker'            => 'vrodos-shared-assets-vrexpo',
		'virtualproduction-joker' => 'vrodos-shared-assets-virtual-production',
	];
	private const ASSET_META   = [
		'_thumbnail_id'                     => 'previews',
		'vrodos_asset3d_glb'              => 'source',
		'vrodos_asset3d_audio'            => 'source',
		'vrodos_asset3d_video'            => 'source',
		'vrodos_asset3d_image'            => 'source',
		'vrodos_asset3d_poi_imgtxt_image' => 'source',
		'vrodos_asset3d_text_file'        => 'source',
		'vrodos_asset3d_screenimage'      => 'previews',
	];
	/** @var resource|null */
	private $lock_handle = null;

	/** Inventory current and legacy storage without changing it. */
	public function audit( array $args, array $assoc_args ): void {
		$report = $this->build_audit();
		if ( 'json' === ( $assoc_args['format'] ?? 'table' ) ) {
			WP_CLI::line( (string) wp_json_encode( $report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) );
			return;
		}
		WP_CLI::log( sprintf( 'Attachments: %d candidates, %d missing, %d already private.', count( $report['attachments'] ), count( $report['missingFiles'] ), $report['privateAttachments'] ) );
		WP_CLI::log( sprintf( 'Unreferenced VRodos child attachments (reported, preserved): %d.', count( $report['unreferencedAttachments'] ) ) );
		WP_CLI::log( sprintf( 'Scene documents with legacy references: %d.', count( $report['sceneDocuments'] ) ) );
		WP_CLI::log( sprintf( 'External scene URLs (reported, never downloaded): %d.', count( $report['externalUrls'] ) ) );
		WP_CLI::log( sprintf( 'Legacy compiled clients: %d.', count( $report['legacyClients'] ) ) );
		WP_CLI::log( sprintf( 'Legacy staging files: %d.', count( $report['legacyStagingFiles'] ) ) );
		foreach ( $report['unownedUploadDirectories'] as $directory ) {
			WP_CLI::warning( 'Unowned upload directory (will not be deleted): ' . $directory );
		}
	}

	/** Copy, hash, switch, and record each owned item. Re-run with --resume. */
	public function migrate( array $args, array $assoc_args ): void {
		if ( ! array_key_exists( 'resume', $assoc_args ) ) {
			WP_CLI::error( 'Pass --resume to acknowledge resumable migration mode.' );
		}
		$this->acquire_lock();
		$state = $this->state();
		try {
			$this->migrate_shared_repositories();
			$this->prepare_scene_attachment_references();
			foreach ( $this->attachment_references() as $reference ) {
				$key = $reference['ownerType'] . ':' . $reference['ownerId'] . ':' . $reference['metaKey'];
				if ( 'done' === ( $state['items'][ $key ]['status'] ?? '' ) ) {
					$state['items'][ $key ] = $this->repair_completed_reference( $reference, $state['items'][ $key ] );
					$this->save_state( $state );
					continue;
				}
				$state['items'][ $key ] = $this->migrate_reference( $reference, $state );
				$this->save_state( $state );
				WP_CLI::log( 'Migrated ' . $key );
			}
			$this->migrate_derivatives( $state );
			$this->migrate_scene_documents();
			$state = $this->state();
			$this->migrate_legacy_clients( $state );
			$state['staleWorkDirs'] = $this->stale_optimizer_work_directories();
			$state['legacyStagingFiles'] = $this->legacy_staging_files();
			$state['migrationComplete'] = true;
			$state['verified'] = false;
			$this->save_state( $state );
			WP_CLI::success( 'Storage migration copy/switch phase completed. Run wp vrodos storage verify.' );
		} finally {
			$this->release_lock();
		}
	}

	/** Validate migrated sources, publications, hashes, and legacy identifiers. */
	public function verify( array $args, array $assoc_args ): void {
		$state  = $this->state();
		$errors = [];
		if ( empty( $state['migrationComplete'] ) ) {
			$errors[] = 'Migration has not completed.';
		}
		foreach ( $state['items'] as $key => $item ) {
			$path = (string) ( $item['destination'] ?? '' );
			if ( 'done' !== ( $item['status'] ?? '' ) || ! is_file( $path ) || hash_file( 'sha256', $path ) !== ( $item['sha256'] ?? '' ) ) {
				$errors[] = 'Invalid migrated item: ' . $key;
			}
		}
		$private_root = VRodos_Storage_Manager::private_site_root( false );
		foreach ( $this->attachment_references() as $reference ) {
			$path = get_attached_file( $reference['attachmentId'], true );
			if ( ! VRodos_Storage_Manager::attachment_is_owned_by( $reference['attachmentId'], $reference['ownerType'], $reference['ownerId'] ) ) {
				$errors[] = sprintf( 'Attachment #%d has invalid private ownership.', $reference['attachmentId'] );
			}
			if ( ! is_string( $private_root ) || ! is_string( $path ) || ! is_file( $path ) || ! VRodos_Storage_Manager::path_is_within( $path, $private_root ) ) {
				$errors[] = sprintf( 'Attachment #%d is missing or outside private storage.', $reference['attachmentId'] );
			}
		}
		$legacy_pattern = '/(?:is_joker|vrodos_asset3d_isJoker|archaeology-joker|vrexpo-joker|virtualproduction-joker|\/runtime\/build\/)/i';
		$uploads = wp_upload_dir( null, false );
		$site_host = strtolower( (string) wp_parse_url( home_url( '/' ), PHP_URL_HOST ) );
		$upload_path = trailingslashit( (string) wp_parse_url( (string) $uploads['baseurl'], PHP_URL_PATH ) );
		foreach ( get_posts( [ 'post_type' => [ 'vrodos_scene', 'vrodos_game' ], 'post_status' => 'any', 'posts_per_page' => -1 ] ) as $post ) {
			if ( preg_match( $legacy_pattern, $post->post_name . "\n" . $post->post_content ) ) {
				$errors[] = 'Legacy identifier remains in post #' . $post->ID;
			}
			if ( 'vrodos_scene' === $post->post_type ) {
				if ( str_contains( $post->post_content, 'vrodos_private_media' ) || preg_match( '#["\']' . preg_quote( $upload_path, '#' ) . '#i', $post->post_content ) ) {
					$errors[] = 'Mutable local media URL remains in scene #' . $post->ID;
				}
				if ( preg_match_all( '#https?://[^"\'<>\s]+#i', $post->post_content, $url_matches ) ) {
					foreach ( $url_matches[0] as $url ) {
						if ( strtolower( (string) wp_parse_url( html_entity_decode( $url ), PHP_URL_HOST ) ) === $site_host && str_starts_with( (string) wp_parse_url( html_entity_decode( $url ), PHP_URL_PATH ), $upload_path ) ) {
							$errors[] = 'Mutable local media URL remains in scene #' . $post->ID;
							break;
						}
					}
				}
			}
		}
		foreach ( self::LEGACY_REPOSITORIES as $old => $new ) {
			foreach ( [ 'vrodos_asset3d_pgame', 'vrodos_scene_pgame' ] as $taxonomy ) {
				if ( get_term_by( 'slug', $old, $taxonomy ) ) { $errors[] = 'Legacy shared taxonomy remains: ' . $taxonomy . '/' . $old; }
			}
		}
		global $wpdb;
		$legacy_meta_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->postmeta WHERE meta_key IN ('vrodos_asset3d_isJoker', 'vrodos_asset3d_pathData')" );
		if ( $legacy_meta_count > 0 ) { $errors[] = 'Legacy asset metadata remains.'; }
		foreach ( get_posts( [ 'post_type' => 'vrodos_game', 'post_status' => 'any', 'fields' => 'ids', 'posts_per_page' => -1 ] ) as $project_id ) {
			$inventory = get_post_meta( $project_id, '_vrodos_published_inventory', true );
			foreach ( is_array( $inventory['clients'] ?? null ) ? $inventory['clients'] : [] as $client ) {
				$dir = VRodos_Storage_Manager::published_project_directory( (int) $project_id, 'clients' );
				if ( is_wp_error( $dir ) || ! is_file( $dir . basename( (string) $client ) ) ) {
					$errors[] = sprintf( 'Missing published client for project #%d: %s', $project_id, $client );
					continue;
				}
				$html = (string) file_get_contents( $dir . basename( (string) $client ) );
				if ( preg_match( '#(?:/runtime/build/|\.\./\.\./assets/|\.\./(?:easyrtc|dist|js)/|/wp-content/uploads/(?!vrodos/published/)|(?:is_joker|joker))#i', $html ) ) {
					$errors[] = sprintf( 'Legacy local dependency remains in project #%d client %s.', $project_id, $client );
				}
			}
			$media_dir = VRodos_Storage_Manager::published_project_directory( (int) $project_id, 'media' );
			foreach ( is_array( $inventory['media'] ?? null ) ? $inventory['media'] : [] as $media ) {
				$file = basename( (string) ( $media['file'] ?? '' ) );
				$path = is_wp_error( $media_dir ) ? '' : $media_dir . $file;
				if ( '' === $file || ! is_file( $path ) || hash_file( 'sha256', $path ) !== (string) ( $media['sha256'] ?? '' ) ) {
					$errors[] = sprintf( 'Invalid published media for project #%d: %s', $project_id, $file );
				}
			}
		}
		if ( $errors ) {
			foreach ( array_unique( $errors ) as $error ) {
				WP_CLI::warning( $error );
			}
			WP_CLI::error( 'Storage verification failed. Cleanup is locked.' );
		}
		$state['verified']   = true;
		$state['verifiedAt'] = gmdate( 'c' );
		$this->save_state( $state );
		update_option( VRodos_Storage_Manager::STORAGE_SCHEMA_OPTION, 1, false );
		WP_CLI::success( 'Storage verification passed.' );
	}

	/** Delete only verified source paths recorded by migrate. */
	public function cleanup( array $args, array $assoc_args ): void {
		$this->require_yes( $assoc_args );
		$state = $this->state();
		if ( empty( $state['verified'] ) ) {
			WP_CLI::error( 'Verification must pass before cleanup.' );
		}
		$uploads = wp_upload_dir( null, false );
		$legacy_runtime_root = VRodos_Path_Manager::legacy_runtime_build_path();
		foreach ( $state['items'] as $item ) {
			$legacy_files = is_array( $item['legacyFiles'] ?? null ) ? $item['legacyFiles'] : [];
			if ( empty( $legacy_files ) && ! empty( $item['source'] ) ) {
				$legacy_files[] = [ 'path' => $item['source'], 'sha256' => $item['sha256'] ?? '' ];
			}
			foreach ( $legacy_files as $legacy_file ) {
				$source = wp_normalize_path( (string) ( $legacy_file['path'] ?? '' ) );
				$hash   = (string) ( $legacy_file['sha256'] ?? '' );
				if ( '' === $source || ! is_file( $source ) || is_link( $source ) ) {
					continue;
				}
				if ( ! VRodos_Storage_Manager::path_is_within( $source, (string) $uploads['basedir'] ) || hash_file( 'sha256', $source ) !== $hash ) {
					WP_CLI::warning( 'Rejected unverified cleanup target: ' . $source );
					continue;
				}
				wp_delete_file( $source );
				$this->remove_empty_parents( dirname( $source ), (string) $uploads['basedir'] );
			}
		}
		foreach ( $state['legacyClientSources'] ?? [] as $source ) {
			if ( is_file( $source ) && ! is_link( $source ) && VRodos_Storage_Manager::path_is_within( $source, $legacy_runtime_root ) ) {
				wp_delete_file( $source );
			}
		}
		$legacy_manifest_root = VRodos_Path_Manager::legacy_runtime_build_path( '.manifests' );
		if ( is_dir( $legacy_manifest_root ) && count( scandir( $legacy_manifest_root ) ?: [] ) <= 2 ) {
			@rmdir( $legacy_manifest_root );
		}
		if ( is_dir( $legacy_runtime_root ) && count( scandir( $legacy_runtime_root ) ?: [] ) <= 2 ) {
			@rmdir( $legacy_runtime_root );
		}
		foreach ( $state['staleWorkDirs'] ?? [] as $directory ) {
			$this->delete_verified_work_directory( (string) $directory, (string) $uploads['basedir'] );
		}
		foreach ( $state['legacyStagingFiles'] ?? [] as $entry ) {
			$path = wp_normalize_path( (string) ( $entry['path'] ?? '' ) );
			if ( ! $this->is_legacy_staging_path( $path, (string) $uploads['basedir'] ) || ! is_file( $path ) || is_link( $path ) || hash_file( 'sha256', $path ) !== (string) ( $entry['sha256'] ?? '' ) ) {
				WP_CLI::warning( 'Rejected legacy staging cleanup target: ' . $path );
				continue;
			}
			wp_delete_file( $path );
			$this->remove_empty_parents( dirname( $path ), (string) $uploads['basedir'] );
		}
		$unknown = $this->build_audit()['unownedUploadDirectories'];
		foreach ( $unknown as $directory ) {
			WP_CLI::warning( 'Preserved unknown directory: ' . $directory );
		}
		$state['cleanupComplete'] = true;
		$this->save_state( $state );
		WP_CLI::success( 'Verified legacy sources were removed. Unknown directories were preserved.' );
	}

	/** Intentionally destroy VRodos-owned storage while preserving unrelated media. */
	public function purge( array $args, array $assoc_args ): void {
		$this->require_yes( $assoc_args );
		$ids = get_posts( [ 'post_type' => 'attachment', 'post_status' => 'any', 'fields' => 'ids', 'posts_per_page' => -1, 'meta_key' => '_vrodos_private_storage', 'meta_value' => '1' ] );
		foreach ( $ids as $attachment_id ) {
			$owner_type = (string) get_post_meta( (int) $attachment_id, '_vrodos_storage_owner_type', true );
			$owner_id   = absint( get_post_meta( (int) $attachment_id, '_vrodos_storage_owner_id', true ) );
			$expected_post_type = 'asset' === $owner_type ? 'vrodos_asset3d' : ( 'scene' === $owner_type ? 'vrodos_scene' : '' );
			if ( '' === $expected_post_type || get_post_type( $owner_id ) !== $expected_post_type || ! VRodos_Storage_Manager::attachment_is_owned_by( (int) $attachment_id, $owner_type, $owner_id ) ) {
				WP_CLI::warning( 'Preserved attachment with invalid VRodos ownership metadata: #' . (int) $attachment_id );
				continue;
			}
			wp_delete_attachment( (int) $attachment_id, true );
		}
		foreach ( get_posts( [ 'post_type' => 'vrodos_game', 'post_status' => 'any', 'fields' => 'ids', 'posts_per_page' => -1 ] ) as $project_id ) {
			VRodos_Storage_Manager::delete_project_publication( (int) $project_id );
			delete_post_meta( (int) $project_id, '_vrodos_published_inventory' );
		}
		VRodos_Storage_Manager::purge_site_storage();
		delete_option( self::STATE_OPTION );
		WP_CLI::success( 'VRodos-owned attachments and publication files were purged.' );
	}

	private function attachment_references(): array {
		$references = [];
		foreach ( get_posts( [ 'post_type' => 'vrodos_asset3d', 'post_status' => 'any', 'fields' => 'ids', 'posts_per_page' => -1 ] ) as $asset_id ) {
			foreach ( self::ASSET_META as $meta_key => $role ) {
				$id = absint( get_post_meta( $asset_id, $meta_key, true ) );
				if ( $id ) {
					$references[] = [ 'ownerType' => 'asset', 'ownerId' => (int) $asset_id, 'metaKey' => $meta_key, 'role' => $role, 'attachmentId' => $id ];
				}
			}
		}
		foreach ( get_posts( [ 'post_type' => 'vrodos_scene', 'post_status' => 'any', 'fields' => 'ids', 'posts_per_page' => -1 ] ) as $scene_id ) {
			foreach ( [ '_thumbnail_id' => 'previews', 'vrodos_scene_bg_image' => 'backgrounds' ] as $meta_key => $role ) {
				$id = absint( get_post_meta( $scene_id, $meta_key, true ) );
				if ( $id ) {
					$references[] = [ 'ownerType' => 'scene', 'ownerId' => (int) $scene_id, 'metaKey' => $meta_key, 'role' => $role, 'attachmentId' => $id ];
				}
			}
		}
		return $references;
	}

	private function migrate_reference( array $reference, array $state ): array {
		$id         = (int) $reference['attachmentId'];
		$owner_id   = (int) $reference['ownerId'];
		$owner_type = (string) $reference['ownerType'];
		$source_url = wp_get_attachment_url( $id ) ?: '';
		if ( VRodos_Storage_Manager::is_private_attachment( $id ) && (int) get_post_field( 'post_parent', $id ) === $owner_id ) {
			$path = get_attached_file( $id, true );
			if ( ! is_string( $path ) || ! is_file( $path ) ) {
				throw new RuntimeException( 'Private attachment #' . $id . ' is missing its file.' );
			}
			return [ 'status' => 'done', 'attachmentId' => $id, 'source' => '', 'sourceUrl' => $source_url, 'destination' => $path, 'sha256' => hash_file( 'sha256', $path ), 'sizeBytes' => (int) filesize( $path ) ];
		}
		if ( (int) get_post_field( 'post_parent', $id ) !== $owner_id ) {
			foreach ( (array) ( $state['items'] ?? [] ) as $item ) {
				$reused_id = absint( $item['attachmentId'] ?? 0 );
				if (
					absint( $item['copiedFromMediaLibrary'] ?? 0 ) === $id
					&& absint( $item['ownerId'] ?? 0 ) === $owner_id
					&& (string) ( $item['ownerType'] ?? '' ) === $owner_type
					&& VRodos_Storage_Manager::is_private_attachment( $reused_id )
				) {
					$updated = update_post_meta( $owner_id, $reference['metaKey'], $reused_id );
					if ( false === $updated && absint( get_post_meta( $owner_id, $reference['metaKey'], true ) ) !== $reused_id ) {
						throw new RuntimeException( 'Could not reuse the private Media Library copy for ' . $reference['metaKey'] . '.' );
					}
					return $item;
				}
			}
			$path = VRodos_Storage_Manager::resolve_migration_attachment_source( $id );
			if ( is_wp_error( $path ) ) {
				throw new RuntimeException( $path->get_error_message() );
			}
			$new  = VRodos_Storage_Manager::import_existing_file( $path, basename( $path ), get_post_mime_type( $id ) ?: 'application/octet-stream', $owner_id, $owner_type, $reference['role'] );
			if ( is_wp_error( $new ) ) {
				throw new RuntimeException( $new->get_error_message() );
			}
			if ( false === update_post_meta( $owner_id, $reference['metaKey'], (int) $new ) ) {
				VRodos_Storage_Manager::delete_attachment_if_owned_by( (int) $new, $owner_type, $owner_id );
				throw new RuntimeException( 'Could not switch ' . $reference['metaKey'] . ' to its private copy.' );
			}
			$destination = get_attached_file( (int) $new, true );
			return [ 'status' => 'done', 'attachmentId' => (int) $new, 'ownerId' => $owner_id, 'ownerType' => $owner_type, 'source' => '', 'sourceUrl' => $source_url, 'destination' => $destination, 'sha256' => hash_file( 'sha256', $destination ), 'sizeBytes' => (int) filesize( $destination ), 'copiedFromMediaLibrary' => $id ];
		}
		$result = VRodos_Storage_Manager::migrate_attachment( $id, $owner_id, $owner_type, $reference['role'] );
		if ( is_wp_error( $result ) ) {
			throw new RuntimeException( $result->get_error_message() );
		}
		return [ 'status' => 'done', 'sourceUrl' => $source_url ] + $result;
	}

	private function repair_completed_reference( array $reference, array $item ): array {
		$attachment_id = absint( $item['attachmentId'] ?? $reference['attachmentId'] ?? 0 );
		$destination   = wp_normalize_path( (string) ( $item['destination'] ?? '' ) );
		$current       = get_attached_file( $attachment_id, true );

		if ( ! is_file( $destination ) && is_string( $current ) && is_file( $current ) ) {
			$destination = wp_normalize_path( $current );
		}
		if ( ! is_file( $destination ) ) {
			$directory = VRodos_Storage_Manager::private_entity_directory(
				(string) $reference['ownerType'],
				(int) $reference['ownerId'],
				(string) $reference['role']
			);
			$filename = basename( (string) wp_parse_url( (string) ( $item['sourceUrl'] ?? '' ), PHP_URL_PATH ) );
			if ( ! is_wp_error( $directory ) && '' !== $filename && is_file( $directory . $filename ) ) {
				$destination = wp_normalize_path( $directory . $filename );
			}
		}
		if ( ! is_file( $destination ) || ! VRodos_Storage_Manager::repair_private_attachment_path( $attachment_id, $destination ) ) {
			throw new RuntimeException( 'Could not repair completed private attachment #' . $attachment_id . '.' );
		}

		$item['attachmentId'] = $attachment_id;
		$item['destination']  = $destination;
		$item['sha256']       = hash_file( 'sha256', $destination );
		$item['sizeBytes']    = (int) filesize( $destination );
		return $item;
	}

	private function migrate_derivatives( array &$state ): void {
		foreach ( get_posts( [ 'post_type' => 'vrodos_asset3d', 'post_status' => 'any', 'fields' => 'ids', 'posts_per_page' => -1 ] ) as $asset_id ) {
			$meta = get_post_meta( (int) $asset_id, '_vrodos_asset3d_glb_derivatives', true );
			if ( ! is_array( $meta ) || ! is_array( $meta['derivatives'] ?? null ) ) {
				continue;
			}
			$changed = false;
			foreach ( $meta['derivatives'] as $profile => &$record ) {
				$profile = sanitize_key( (string) $profile );
				$key     = 'derivative:' . (int) $asset_id . ':' . $profile;
				$source  = wp_normalize_path( (string) ( is_array( $record ) ? ( $record['path'] ?? '' ) : '' ) );
				$old_url = is_array( $record ) ? (string) ( $record['url'] ?? '' ) : '';
				if ( 'done' === ( $state['items'][ $key ]['status'] ?? '' ) ) {
					continue;
				}
				if ( ! is_array( $record ) || 'ready' !== ( $record['status'] ?? '' ) || '' === $source || ! is_file( $source ) ) {
					continue;
				}
				$root = VRodos_Storage_Manager::private_site_root( false );
				if ( is_string( $root ) && VRodos_Storage_Manager::path_is_within( $source, $root ) ) {
					$destination = $source;
					$attachment_id = absint( $record['attachmentId'] ?? 0 );
				} else {
					$directory = VRodos_Storage_Manager::private_entity_directory( 'asset', (int) $asset_id, 'derivatives', $profile );
					if ( is_wp_error( $directory ) ) {
						throw new RuntimeException( $directory->get_error_message() );
					}
					$destination = $this->copy_verified_file( $source, $directory . wp_unique_filename( $directory, basename( $source ) ) );
					$attachment_id = VRodos_Storage_Manager::register_existing_private_attachment( $destination, 'model/gltf-binary', (int) $asset_id, 'asset', 'derivatives', $profile );
					if ( is_wp_error( $attachment_id ) ) {
						wp_delete_file( $destination );
						throw new RuntimeException( $attachment_id->get_error_message() );
					}
				}
				$hash = hash_file( 'sha256', $destination );
				$record['path']         = wp_normalize_path( $destination );
				$record['attachmentId'] = (int) $attachment_id;
				$record['url']          = VRodos_Storage_Manager::authoring_url_for_attachment( (int) $attachment_id );
				$state['items'][ $key ] = [
					'status'       => 'done',
					'attachmentId' => (int) $attachment_id,
					'source'       => $source === $destination ? '' : $source,
					'sourceUrl'    => $old_url,
					'legacyFiles'  => $source === $destination ? [] : [ [ 'path' => $source, 'sha256' => hash_file( 'sha256', $source ), 'sizeBytes' => (int) filesize( $source ) ] ],
					'destination'  => wp_normalize_path( $destination ),
					'sha256'       => $hash,
					'sizeBytes'    => (int) filesize( $destination ),
				];
				$changed = true;
				update_post_meta( (int) $asset_id, '_vrodos_asset3d_glb_derivatives', $meta );
				$this->save_state( $state );
				WP_CLI::log( 'Migrated ' . $key );
			}
			unset( $record );
			if ( $changed ) {
				update_post_meta( (int) $asset_id, '_vrodos_asset3d_glb_derivatives', $meta );
			}
		}
	}

	private function copy_verified_file( string $source, string $destination ): string {
		$temporary = $destination . '.' . wp_generate_password( 20, false, false ) . '.partial';
		$hash      = hash_file( 'sha256', $source );
		if (
			! @copy( $source, $temporary )
			|| filesize( $source ) !== filesize( $temporary )
			|| hash_file( 'sha256', $temporary ) !== $hash
			|| ! @rename( $temporary, $destination )
		) {
			wp_delete_file( $temporary );
			throw new RuntimeException( 'Could not verify and finalize migration copy: ' . $source );
		}
		return wp_normalize_path( $destination );
	}

	private function migrate_scene_documents(): void {
		foreach ( get_posts( [ 'post_type' => 'vrodos_scene', 'post_status' => 'any', 'posts_per_page' => -1 ] ) as $scene ) {
			$data = json_decode( html_entity_decode( (string) $scene->post_content ) );
			if ( ! is_object( $data ) ) {
				continue;
			}
			$this->modernize_scene_value( $data );
			$updated = wp_update_post( [ 'ID' => $scene->ID, 'post_content' => wp_json_encode( $data, JSON_UNESCAPED_SLASHES ) ], true );
			if ( is_wp_error( $updated ) ) {
				throw new RuntimeException( $updated->get_error_message() );
			}
		}
	}

	private function prepare_scene_attachment_references(): void {
		foreach ( get_posts( [ 'post_type' => 'vrodos_scene', 'post_status' => 'any', 'posts_per_page' => -1 ] ) as $scene ) {
			$data = json_decode( html_entity_decode( (string) $scene->post_content ) );
			if ( ! is_object( $data ) ) {
				continue;
			}
			$background_url = is_object( $data->metadata ?? null ) ? (string) ( $data->metadata->backgroundImagePath ?? '' ) : '';
			if ( ! absint( get_post_meta( $scene->ID, 'vrodos_scene_bg_image', true ) ) && wp_http_validate_url( $background_url ) ) {
				$background_id = attachment_url_to_postid( strtok( $background_url, '?#' ) );
				if ( $background_id ) {
					if ( false === update_post_meta( $scene->ID, 'vrodos_scene_bg_image', $background_id ) ) {
						throw new RuntimeException( 'Could not persist the discovered background attachment for scene #' . $scene->ID . '.' );
					}
				}
			}
			$this->discover_scene_asset_ids( $data );
			$updated = wp_update_post( [ 'ID' => $scene->ID, 'post_content' => wp_json_encode( $data, JSON_UNESCAPED_SLASHES ) ], true );
			if ( is_wp_error( $updated ) ) {
				throw new RuntimeException( $updated->get_error_message() );
			}
		}
	}

	private function discover_scene_asset_ids( &$value ): void {
		if ( is_array( $value ) ) {
			foreach ( $value as &$child ) { $this->discover_scene_asset_ids( $child ); }
			return;
		}
		if ( ! is_object( $value ) ) {
			return;
		}
		if ( ! absint( $value->asset_id ?? 0 ) ) {
			foreach ( [ 'glb_path', 'path', 'screenshot_path', 'audio_path', 'video_path', 'image_path', 'poi_img_path', 'poi_image_path' ] as $field ) {
				$url = (string) ( $value->{$field} ?? '' );
				if ( ! wp_http_validate_url( $url ) ) {
					continue;
				}
				$attachment_id = attachment_url_to_postid( strtok( $url, '?#' ) );
				$owner_id      = $attachment_id ? (int) get_post_field( 'post_parent', $attachment_id ) : 0;
				if ( $owner_id > 0 && 'vrodos_asset3d' === get_post_type( $owner_id ) ) {
					$value->asset_id = $owner_id;
					break;
				}
			}
		}
		foreach ( get_object_vars( $value ) as $field => $child ) {
			$this->discover_scene_asset_ids( $value->{$field} );
		}
	}

	private function modernize_scene_value( &$value ): void {
		if ( is_array( $value ) ) {
			foreach ( $value as &$child ) { $this->modernize_scene_value( $child ); }
			return;
		}
		if ( ! is_object( $value ) ) { return; }
		if ( property_exists( $value, 'is_joker' ) ) { $value->is_shared = filter_var( $value->is_joker, FILTER_VALIDATE_BOOLEAN ); unset( $value->is_joker ); }
		unset( $value->backgroundImagePath );
		if ( absint( $value->asset_id ?? 0 ) ) {
			foreach ( [ 'glb_path', 'path', 'screenshot_path', 'audio_path', 'video_path', 'image_path', 'poi_img_path', 'poi_image_path', 'fnPath', 'text_content', 'text_content_b64', 'text_format', 'text_truncated' ] as $field ) { unset( $value->{$field} ); }
		}
		foreach ( get_object_vars( $value ) as $field => $child ) { $this->modernize_scene_value( $value->{$field} ); }
	}

	private function migrate_shared_repositories(): void {
		foreach ( self::LEGACY_REPOSITORIES as $old => $new ) {
			$post = get_page_by_path( $old, OBJECT, 'vrodos_game' );
			$existing = get_page_by_path( $new, OBJECT, 'vrodos_game' );
			if ( $post && $existing && (int) $post->ID !== (int) $existing->ID ) {
				throw new RuntimeException( 'Shared repository slug conflict: ' . $new );
			}
			if ( $post ) {
				$updated = wp_update_post( [ 'ID' => $post->ID, 'post_name' => $new ], true );
				if ( is_wp_error( $updated ) || get_post_field( 'post_name', $post->ID ) !== $new ) {
					throw new RuntimeException( 'Could not rename shared repository ' . $old . '.' );
				}
			}
			foreach ( [ 'vrodos_asset3d_pgame', 'vrodos_scene_pgame' ] as $taxonomy ) {
				$term = get_term_by( 'slug', $old, $taxonomy );
				$existing_term = get_term_by( 'slug', $new, $taxonomy );
				if ( $term && ! is_wp_error( $term ) && $existing_term && ! is_wp_error( $existing_term ) && (int) $term->term_id !== (int) $existing_term->term_id ) {
					throw new RuntimeException( 'Shared taxonomy slug conflict: ' . $taxonomy . '/' . $new );
				}
				if ( $term && ! is_wp_error( $term ) ) {
					$result = wp_update_term( $term->term_id, $taxonomy, [ 'slug' => $new ] );
					if ( is_wp_error( $result ) ) {
						throw new RuntimeException( $result->get_error_message() );
					}
				}
			}
		}
		global $wpdb;
		$legacy_rows = $wpdb->get_results( $wpdb->prepare( "SELECT post_id, meta_value FROM $wpdb->postmeta WHERE meta_key = %s", 'vrodos_asset3d_isJoker' ), ARRAY_A );
		foreach ( $legacy_rows as $row ) {
			$value   = in_array( (string) $row['meta_value'], [ 'true', '1' ], true ) ? '1' : '0';
			$updated = update_post_meta( (int) $row['post_id'], '_vrodos_asset_is_shared', $value );
			if ( false === $updated && (string) get_post_meta( (int) $row['post_id'], '_vrodos_asset_is_shared', true ) !== $value ) {
				throw new RuntimeException( 'Could not migrate shared-asset metadata for asset #' . (int) $row['post_id'] . '.' );
			}
		}
		if ( false === $wpdb->delete( $wpdb->postmeta, [ 'meta_key' => 'vrodos_asset3d_isJoker' ], [ '%s' ] ) ) {
			throw new RuntimeException( 'Could not remove legacy shared-asset metadata.' );
		}
		if ( false === $wpdb->delete( $wpdb->postmeta, [ 'meta_key' => 'vrodos_asset3d_pathData' ], [ '%s' ] ) ) {
			throw new RuntimeException( 'Could not remove legacy asset path metadata.' );
		}
	}

	private function migrate_legacy_clients( array &$state ): void {
		$manifest_dir = VRodos_Path_Manager::legacy_runtime_build_path( '.manifests' );
		$projects = [];
		foreach ( glob( $manifest_dir . DIRECTORY_SEPARATOR . 'project-*.json' ) ?: [] as $manifest_path ) {
			$manifest = json_decode( (string) file_get_contents( $manifest_path ), true );
			$project_id = absint( $manifest['projectId'] ?? 0 );
			if ( ! $project_id || ! is_array( $manifest['artifacts'] ?? null ) ) { continue; }
			$projects[ $project_id ]['artifacts'] = array_merge( $projects[ $project_id ]['artifacts'] ?? [], array_map( 'basename', $manifest['artifacts'] ) );
			$projects[ $project_id ]['manifests'][] = $manifest_path;
		}
		foreach ( glob( VRodos_Path_Manager::legacy_runtime_build_path( '*.html' ) ) ?: [] as $source ) {
			$filename = basename( $source );
			$project_id = $this->infer_project_id_for_legacy_client( $filename );
			if ( $project_id ) {
				$projects[ $project_id ]['artifacts'][] = $filename;
			}
		}
		foreach ( $projects as $project_id => $project ) {
			$artifacts = array_values( array_unique( (array) ( $project['artifacts'] ?? [] ) ) );
			$clients_dir = VRodos_Storage_Manager::published_project_directory( $project_id, 'clients' );
			if ( is_wp_error( $clients_dir ) ) { throw new RuntimeException( $clients_dir->get_error_message() ); }
			$media = [];
			$published_clients = [];
			foreach ( $artifacts as $filename ) {
				$source = VRodos_Path_Manager::legacy_runtime_build_path( basename( (string) $filename ) );
				if ( ! is_file( $source ) ) { continue; }
				$html = (string) file_get_contents( $source );
				$asset_path = trailingslashit( (string) wp_parse_url( VRodos_Path_Manager::asset_url(), PHP_URL_PATH ) );
				$html = str_replace( '../../assets/', $asset_path, $html );
				$html = str_replace( [ '../easyrtc/', '../dist/', '../js/' ], [ '/easyrtc/', '/dist/', '/js/' ], $html );
				foreach ( $state['items'] as $item ) {
					$old_url = (string) ( $item['sourceUrl'] ?? '' );
					$old_url_path = (string) wp_parse_url( html_entity_decode( $old_url ), PHP_URL_PATH );
					$old_urls     = array_values( array_unique( array_filter( [ $old_url, $old_url_path ] ) ) );
					if ( empty( array_filter( $old_urls, static fn ( string $candidate ): bool => str_contains( $html, $candidate ) ) ) ) { continue; }
					$published = $this->publish_migration_media( $project_id, (string) $item['destination'], (int) ( $item['attachmentId'] ?? 0 ) );
					$html = str_replace( $old_urls, $published['url'], $html );
					$media[ $published['entry']['file'] ] = $published['entry'];
				}
				$temporary = $clients_dir . basename( $filename ) . '.migration.partial';
				if ( false === file_put_contents( $temporary, $html, LOCK_EX ) ) {
					throw new RuntimeException( 'Could not stage migrated client ' . basename( $filename ) . '.' );
				}
				$this->atomic_replace_file( $temporary, $clients_dir . basename( $filename ) );
				$state['legacyClientSources'][] = $source;
				$published_clients[] = basename( $filename );
			}
			update_post_meta( $project_id, '_vrodos_published_inventory', [ 'schemaVersion' => 1, 'projectId' => $project_id, 'publishedAt' => current_time( 'mysql', true ), 'clients' => array_values( array_unique( $published_clients ) ), 'media' => array_values( $media ) ] );
			foreach ( (array) ( $project['manifests'] ?? [] ) as $manifest_path ) {
				$state['legacyClientSources'][] = $manifest_path;
			}
		}
		$state['legacyClientSources'] = array_values( array_unique( $state['legacyClientSources'] ?? [] ) );
		$this->save_state( $state );
	}

	private function infer_project_id_for_legacy_client( string $filename ): int {
		if ( ! preg_match( '/_(\d+)\.html$/', $filename, $match ) ) {
			return 0;
		}
		$scene_id = absint( $match[1] );
		if ( 'vrodos_scene' !== get_post_type( $scene_id ) ) {
			return 0;
		}
		$terms = wp_get_post_terms( $scene_id, 'vrodos_scene_pgame' );
		$slug  = ! is_wp_error( $terms ) && ! empty( $terms ) ? (string) $terms[0]->slug : '';
		$project = '' !== $slug ? get_page_by_path( $slug, OBJECT, 'vrodos_game' ) : null;
		return $project instanceof WP_Post ? (int) $project->ID : 0;
	}

	private function publish_migration_media( int $project_id, string $source, int $attachment_id ): array {
		$hash = hash_file( 'sha256', $source );
		$ext  = strtolower( pathinfo( $source, PATHINFO_EXTENSION ) );
		$file = $hash . ( $ext ? '.' . sanitize_key( $ext ) : '' );
		$dir  = VRodos_Storage_Manager::published_project_directory( $project_id, 'media' );
		$url  = VRodos_Storage_Manager::published_project_url( $project_id, 'media', $file );
		if ( is_wp_error( $dir ) || is_wp_error( $url ) ) { throw new RuntimeException( 'Could not prepare legacy publication media.' ); }
		if ( ! is_file( $dir . $file ) ) {
			$this->copy_verified_file( $source, $dir . $file );
		}
		return [ 'url' => $url, 'entry' => [ 'file' => $file, 'sha256' => $hash, 'sizeBytes' => (int) filesize( $source ), 'attachmentId' => $attachment_id, 'context' => 'legacy-client-migration' ] ];
	}

	private function atomic_replace_file( string $temporary, string $destination ): void {
		$backup = $destination . '.migration-backup';
		if ( is_file( $backup ) ) {
			wp_delete_file( $backup );
		}
		if ( is_file( $destination ) && ! @rename( $destination, $backup ) ) {
			wp_delete_file( $temporary );
			throw new RuntimeException( 'Could not back up publication target ' . basename( $destination ) . '.' );
		}
		if ( ! @rename( $temporary, $destination ) ) {
			if ( is_file( $backup ) ) {
				@rename( $backup, $destination );
			}
			wp_delete_file( $temporary );
			throw new RuntimeException( 'Could not atomically publish ' . basename( $destination ) . '.' );
		}
		if ( is_file( $backup ) ) {
			wp_delete_file( $backup );
		}
	}

	private function build_audit(): array {
		$missing = []; $private = 0;
		$attachment_references = $this->attachment_references();
		foreach ( $attachment_references as $reference ) {
			$is_private = VRodos_Storage_Manager::is_private_attachment( $reference['attachmentId'] );
			$path       = $is_private
				? get_attached_file( $reference['attachmentId'], true )
				: VRodos_Storage_Manager::resolve_migration_attachment_source( $reference['attachmentId'] );
			if ( is_wp_error( $path ) || ! is_string( $path ) || ! is_file( $path ) ) { $missing[] = $reference; }
			if ( $is_private ) { ++$private; }
		}
		$scene_documents = [];
		$embedded_urls   = [];
		$external_urls   = [];
		$site_host       = strtolower( (string) wp_parse_url( home_url( '/' ), PHP_URL_HOST ) );
		foreach ( get_posts( [ 'post_type' => 'vrodos_scene', 'post_status' => 'any', 'posts_per_page' => -1 ] ) as $scene ) {
			if ( preg_match( '/(?:https?:|\/wp-content\/uploads\/|is_joker)/i', $scene->post_content ) ) { $scene_documents[] = $scene->ID; }
			if ( preg_match_all( '#https?://[^"\'<>\s]+#i', $scene->post_content, $matches ) ) {
				foreach ( array_unique( $matches[0] ) as $url ) {
					$host = strtolower( (string) wp_parse_url( html_entity_decode( $url ), PHP_URL_HOST ) );
					$entry = [ 'sceneId' => (int) $scene->ID, 'url' => html_entity_decode( $url ), 'external' => '' !== $host && $host !== $site_host ];
					$embedded_urls[] = $entry;
					if ( $entry['external'] ) { $external_urls[] = $entry; }
				}
			}
		}
		$legacy_clients = glob( VRodos_Path_Manager::legacy_runtime_build_path( '*.html' ) ) ?: [];
		$uploads = wp_upload_dir( null, false );
		$known = [ 'vrodos', 'vrodos-optimized-assets', 'vrodos-model-imports', 'vrodos-asset-import-temp', 'vrodos-chunked-uploads' ];
		$unknown = [];
		foreach ( glob( trailingslashit( (string) $uploads['basedir'] ) . '*', GLOB_ONLYDIR ) ?: [] as $directory ) {
			if ( ! in_array( basename( $directory ), $known, true ) && ! preg_match( '/^\d{4}$/', basename( $directory ) ) ) { $unknown[] = wp_normalize_path( $directory ); }
		}
		$derivatives = [];
		$publications = [];
		$referenced_ids = array_values( array_unique( array_map( static fn ( array $reference ): int => (int) $reference['attachmentId'], $attachment_references ) ) );
		$unreferenced_attachments = [];
		foreach ( get_posts( [ 'post_type' => 'attachment', 'post_status' => 'any', 'posts_per_page' => -1 ] ) as $attachment ) {
			$parent_type = get_post_type( (int) $attachment->post_parent );
			if ( ! in_array( $parent_type, [ 'vrodos_asset3d', 'vrodos_scene' ], true ) || in_array( (int) $attachment->ID, $referenced_ids, true ) ) { continue; }
			$unreferenced_attachments[] = [ 'attachmentId' => (int) $attachment->ID, 'parentId' => (int) $attachment->post_parent, 'parentType' => $parent_type, 'path' => wp_normalize_path( (string) get_attached_file( (int) $attachment->ID, true ) ), 'private' => VRodos_Storage_Manager::is_private_attachment( (int) $attachment->ID ) ];
		}
		foreach ( get_posts( [ 'post_type' => 'vrodos_asset3d', 'post_status' => 'any', 'fields' => 'ids', 'posts_per_page' => -1 ] ) as $asset_id ) {
			$meta = get_post_meta( (int) $asset_id, '_vrodos_asset3d_glb_derivatives', true );
			if ( is_array( $meta['derivatives'] ?? null ) ) { $derivatives[ (int) $asset_id ] = $meta['derivatives']; }
		}
		foreach ( get_posts( [ 'post_type' => 'vrodos_game', 'post_status' => 'any', 'fields' => 'ids', 'posts_per_page' => -1 ] ) as $project_id ) {
			$inventory = get_post_meta( (int) $project_id, '_vrodos_published_inventory', true );
			if ( is_array( $inventory ) ) { $publications[ (int) $project_id ] = $inventory; }
		}
		return [ 'attachments' => $attachment_references, 'privateAttachments' => $private, 'missingFiles' => $missing, 'unreferencedAttachments' => $unreferenced_attachments, 'derivatives' => $derivatives, 'sceneDocuments' => $scene_documents, 'embeddedSceneUrls' => $embedded_urls, 'externalUrls' => $external_urls, 'publications' => $publications, 'legacyClients' => array_map( 'wp_normalize_path', $legacy_clients ), 'legacyStagingFiles' => $this->legacy_staging_files(), 'staleOptimizerWorkDirs' => $this->stale_optimizer_work_directories(), 'unownedUploadDirectories' => $unknown ];
	}

	private function legacy_staging_files(): array {
		$uploads = wp_upload_dir( null, false );
		$entries = [];
		foreach ( [ 'vrodos-model-imports', 'vrodos-asset-import-temp', 'vrodos-chunked-uploads' ] as $name ) {
			$directory = trailingslashit( (string) $uploads['basedir'] ) . $name;
			if ( ! is_dir( $directory ) || is_link( $directory ) ) { continue; }
			$iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $directory, FilesystemIterator::SKIP_DOTS ) );
			foreach ( $iterator as $item ) {
				if ( $item->isFile() && ! $item->isLink() ) {
					$entries[] = [ 'path' => wp_normalize_path( $item->getPathname() ), 'sha256' => hash_file( 'sha256', $item->getPathname() ), 'sizeBytes' => (int) $item->getSize() ];
				}
			}
		}
		return $entries;
	}

	private function is_legacy_staging_path( string $path, string $uploads_root ): bool {
		foreach ( [ 'vrodos-model-imports', 'vrodos-asset-import-temp', 'vrodos-chunked-uploads' ] as $name ) {
			$root = trailingslashit( $uploads_root ) . $name;
			if ( VRodos_Storage_Manager::path_is_within( $path, $root ) ) { return true; }
		}
		return false;
	}

	private function stale_optimizer_work_directories(): array {
		$uploads = wp_upload_dir( null, false );
		return array_map( 'wp_normalize_path', glob( trailingslashit( (string) $uploads['basedir'] ) . 'vrodos-optimized-assets/asset-*/.work', GLOB_ONLYDIR ) ?: [] );
	}

	private function delete_verified_work_directory( string $directory, string $uploads_root ): void {
		if ( is_link( $directory ) || ! preg_match( '#/vrodos-optimized-assets/asset-\d+/\.work$#', str_replace( '\\', '/', $directory ) ) || ! VRodos_Storage_Manager::path_is_within( $directory, $uploads_root ) ) { WP_CLI::warning( 'Rejected work directory: ' . $directory ); return; }
		$iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $directory, FilesystemIterator::SKIP_DOTS ), RecursiveIteratorIterator::CHILD_FIRST );
		foreach ( $iterator as $item ) { if ( $item->isLink() ) { continue; } $item->isDir() ? @rmdir( $item->getPathname() ) : wp_delete_file( $item->getPathname() ); }
		@rmdir( $directory );
	}

	private function remove_empty_parents( string $directory, string $root ): void {
		while ( is_dir( $directory ) && VRodos_Storage_Manager::path_is_within( $directory, $root ) && wp_normalize_path( $directory ) !== wp_normalize_path( $root ) ) {
			if ( count( scandir( $directory ) ?: [] ) > 2 || ! @rmdir( $directory ) ) { break; }
			$directory = dirname( $directory );
		}
	}

	private function acquire_lock(): void {
		$lock = get_option( self::LOCK_OPTION );
		if ( is_array( $lock ) && time() - (int) ( $lock['time'] ?? 0 ) < HOUR_IN_SECONDS ) { WP_CLI::error( 'Another storage migration owns the lock.' ); }
		$root = VRodos_Storage_Manager::private_site_root();
		if ( is_wp_error( $root ) ) {
			WP_CLI::error( $root->get_error_message() );
		}
		$lock_directory = trailingslashit( $root ) . 'tmp/migration-locks';
		if ( ! wp_mkdir_p( $lock_directory ) ) {
			WP_CLI::error( 'Could not create the private migration lock directory.' );
		}
		$this->lock_handle = fopen( $lock_directory . '/storage.lock', 'c+' );
		if ( ! is_resource( $this->lock_handle ) || ! flock( $this->lock_handle, LOCK_EX | LOCK_NB ) ) {
			WP_CLI::error( 'Another storage migration owns the filesystem lock.' );
		}
		update_option( self::LOCK_OPTION, [ 'time' => time(), 'user' => get_current_user_id() ], false );
	}

	private function release_lock(): void {
		delete_option( self::LOCK_OPTION );
		if ( is_resource( $this->lock_handle ) ) {
			flock( $this->lock_handle, LOCK_UN );
			fclose( $this->lock_handle );
		}
		$this->lock_handle = null;
	}

	private function state(): array { $state = get_option( self::STATE_OPTION, [] ); return is_array( $state ) ? wp_parse_args( $state, [ 'schemaVersion' => 1, 'items' => [], 'legacyClientSources' => [] ] ) : [ 'schemaVersion' => 1, 'items' => [], 'legacyClientSources' => [] ]; }
	private function save_state( array $state ): void { update_option( self::STATE_OPTION, $state, false ); }
	private function require_yes( array $assoc_args ): void { if ( ! array_key_exists( 'yes', $assoc_args ) ) { WP_CLI::error( 'Pass --yes to authorize this destructive command.' ); } }
}
