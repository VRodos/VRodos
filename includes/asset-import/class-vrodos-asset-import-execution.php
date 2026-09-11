<?php

if ( ! defined( 'ABSPATH' ) ) { exit; }

require_once __DIR__ . '/class-vrodos-asset-import-session.php';
require_once dirname( __DIR__ ) . '/class-vrodos-asset-origin.php';
require_once __DIR__ . '/class-vrodos-asset-import-glb-normalizer.php';

/** Import execution and lifecycle; HTTP authentication/response handling belongs to the manager. */
class VRodos_Asset_Import_Execution {
	public const CONVERSION_VERSION  = '2026-05-11-core-asset-import-v1';
	private const STATUS_META          = '_vrodos_asset_import_status';
	private const ERROR_META           = '_vrodos_asset_import_error';
	private const DIAGNOSTIC_META      = '_vrodos_asset_import_diagnostic';
	private const SELECTED_ENTRY_META  = '_vrodos_asset_import_selected_entry';
	private const SOURCE_EXT_META      = '_vrodos_asset_import_source_extension';
	private const SOURCE_PATH_META     = '_vrodos_asset_import_source_path';
	private const STAGED_DIR_META      = '_vrodos_asset_import_staged_dir';
	private const PROJECT_ID_META      = '_vrodos_asset_import_project_id';
	private const ASSET_CAT_ID_META    = '_vrodos_asset_import_asset_cat_id';
	private const ORIGINAL_NAME_META   = '_vrodos_asset_import_original_name';
	private const JOB_TOKEN_META       = '_vrodos_asset_import_job_token';
	private const FINAL_GLB_ID_META    = '_vrodos_asset_import_final_glb_id';
	private const CONVERSION_TOOL_META = VRodos_Asset_Import_Glb_Normalizer::CONVERSION_TOOL_META;
	private const CONVERSION_VER_META  = VRodos_Asset_Import_Glb_Normalizer::CONVERSION_VERSION_META;
	private const CLEANUP_AFTER_META   = '_vrodos_asset_import_cleanup_after';
	private const SUPPORTED_EXTENSIONS  = [ 'glb', 'zip', 'blend', 'fbx', 'obj', 'dae', 'gltf' ];
	private const CONVERSION_EXTENSIONS = [ 'blend', 'fbx', 'obj', 'dae', 'gltf' ];
	public const IMPORT_CRON_HOOK  = 'vrodos_asset_import_process_job';

	public static function supported_extensions(): array {
		return self::SUPPORTED_EXTENSIONS;
	}

	public static function is_supported_extension( string $extension ): bool {
		return in_array( strtolower( ltrim( $extension, '.' ) ), self::SUPPORTED_EXTENSIONS, true );
	}

	public static function is_conversion_extension( string $extension ): bool {
		return in_array( strtolower( ltrim( $extension, '.' ) ), self::CONVERSION_EXTENSIONS, true );
	}

	public static function handle_asset_delete( int $post_id, WP_Post $post ): void {
		if ( 'vrodos_asset3d' !== $post->post_type ) {
			return;
		}
		wp_clear_scheduled_hook( self::IMPORT_CRON_HOOK, [ $post_id ] );
		delete_transient( 'vrodos_asset_import_lock_' . $post_id );
		$staged_dir = (string) get_post_meta( $post_id, self::STAGED_DIR_META, true );
		$root       = VRodos_Storage_Manager::private_site_root( false );
		if ( '' !== $staged_dir && is_string( $root ) ) {
			self::delete_directory_inside_root( $staged_dir, trailingslashit( $root ) . 'tmp/import' );
		}
	}

	public static function consume_staged_upload( string $token, int $asset_id, int $project_id, int $asset_cat_id ): array {
		$token = sanitize_key( $token );
		if ( '' === $token || $asset_id <= 0 ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'The staged model upload token is invalid.',
			];
		}

		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => (string) $upload_dir['error'],
			];
		}

		$user_id     = get_current_user_id();
		$session_dir = VRodos_Asset_Import_Session::staged_session_dir( (string) $upload_dir['basedir'], $user_id, $token );
		$session_url = VRodos_Asset_Import_Session::staged_session_url( (string) $upload_dir['baseurl'], $user_id, $token );
		$manifest    = VRodos_Asset_Import_Session::read_owned_manifest( $session_dir );
		if ( is_wp_error( $manifest ) ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => $manifest->get_error_message(),
			];
		}
		if ( ! self::can_mutate_import_target( $asset_id, $project_id, $manifest ) ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'The staged upload does not belong to this editable asset and project.',
			];
		}

		$extension   = strtolower( (string) ( $manifest['extension'] ?? '' ) );
		$source_path = trailingslashit( $session_dir ) . 'upload.' . $extension;
		if ( ! self::is_supported_extension( $extension ) || ! is_file( $source_path ) ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'The staged model upload is missing or unsupported.',
			];
		}

		$prepared_path = VRodos_Asset_Import_Session::prepared_glb_path_from_manifest( $session_dir, $manifest );
		if ( '' !== $prepared_path && is_file( $prepared_path ) ) {
			$normalization = self::normalize_glb_path( $prepared_path, $session_dir );
			if ( is_wp_error( $normalization ) ) {
				self::mark_failed( $asset_id, $normalization->get_error_message() );
				return [ 'success' => false, 'status' => 'failed', 'error' => $normalization->get_error_message() ];
			}
			$diagnostic   = trim( (string) ( $manifest['prepared_diagnostic'] ?? '' ) . ' ' . ( ! empty( $normalization['converted'] ) ? (string) $normalization['diagnostic'] : '' ) );
			$attachment_id = self::save_glb_file_for_asset( (string) $normalization['path'], self::target_glb_name( $asset_id, $asset_cat_id ), $asset_id );
			if ( is_wp_error( $attachment_id ) ) {
				self::mark_failed( $asset_id, $attachment_id->get_error_message() );
				return [
					'success' => false,
					'status'  => 'failed',
					'error'   => $attachment_id->get_error_message(),
				];
			}

			$switched = VRodos_Storage_Manager::replace_attachment_references( $asset_id, 'asset', [ 'vrodos_asset3d_glb' ], (int) $attachment_id );
			if ( is_wp_error( $switched ) ) {
				self::mark_failed( $asset_id, $switched->get_error_message() );
				return [ 'success' => false, 'status' => 'failed', 'error' => $switched->get_error_message() ];
			}
			if ( ! empty( $normalization['converted'] ) ) {
				VRodos_Asset_Import_Glb_Normalizer::record_asset_result( $asset_id, $normalization );
			} elseif ( ! empty( $manifest['prepared_conversion_tool'] ) ) {
				update_post_meta( $asset_id, self::CONVERSION_TOOL_META, sanitize_key( (string) $manifest['prepared_conversion_tool'] ) );
				update_post_meta( $asset_id, self::CONVERSION_VER_META, self::CONVERSION_VERSION );
			} else {
				VRodos_Asset_Import_Glb_Normalizer::record_asset_result( $asset_id, $normalization );
			}
			self::mark_ready(
				$asset_id,
				(int) $attachment_id,
				'' !== $diagnostic ? $diagnostic : 'Prepared ZIP model package saved.',
				(string) ( $manifest['selected_entry'] ?? ( $manifest['file_name'] ?? basename( $prepared_path ) ) )
			);
			self::maybe_generate_blender_thumbnail( $asset_id, (int) $attachment_id, $project_id );
			self::delete_directory_inside_root( $session_dir, VRodos_Asset_Import_Session::user_staged_root( (string) $upload_dir['basedir'], $user_id ) );
			self::clear_asset_browser_cache();

			return [
				'success'       => true,
				'status'        => 'ready',
				'attachment_id' => (int) $attachment_id,
			];
		}

		if ( 'glb' === $extension ) {
			$normalization = self::normalize_glb_path( $source_path, $session_dir );
			if ( is_wp_error( $normalization ) ) {
				self::mark_failed( $asset_id, $normalization->get_error_message() );
				return [ 'success' => false, 'status' => 'failed', 'error' => $normalization->get_error_message() ];
			}
			$attachment_id = self::save_glb_file_for_asset( (string) $normalization['path'], self::target_glb_name( $asset_id, $asset_cat_id ), $asset_id );
			if ( is_wp_error( $attachment_id ) ) {
				self::mark_failed( $asset_id, $attachment_id->get_error_message() );
				return [
					'success' => false,
					'status'  => 'failed',
					'error'   => $attachment_id->get_error_message(),
				];
			}

			$switched = VRodos_Storage_Manager::replace_attachment_references( $asset_id, 'asset', [ 'vrodos_asset3d_glb' ], (int) $attachment_id );
			if ( is_wp_error( $switched ) ) {
				self::mark_failed( $asset_id, $switched->get_error_message() );
				return [ 'success' => false, 'status' => 'failed', 'error' => $switched->get_error_message() ];
			}
			VRodos_Asset_Import_Glb_Normalizer::record_asset_result( $asset_id, $normalization );
			$diagnostic = ! empty( $normalization['converted'] )
				? (string) $normalization['diagnostic']
				: 'Direct GLB upload saved.';
			self::mark_ready( $asset_id, (int) $attachment_id, $diagnostic, (string) ( $manifest['file_name'] ?? 'upload.glb' ) );
			self::delete_directory_inside_root( $session_dir, VRodos_Asset_Import_Session::user_staged_root( (string) $upload_dir['basedir'], $user_id ) );
			self::clear_asset_browser_cache();

			return [
				'success'       => true,
				'status'        => 'ready',
				'attachment_id' => (int) $attachment_id,
			];
		}

		update_post_meta( $asset_id, self::STATUS_META, 'pending' );
		update_post_meta( $asset_id, self::JOB_TOKEN_META, $token );
		update_post_meta( $asset_id, self::SOURCE_EXT_META, $extension );
		update_post_meta( $asset_id, self::SOURCE_PATH_META, $source_path );
		update_post_meta( $asset_id, self::STAGED_DIR_META, $session_dir );
		update_post_meta( $asset_id, self::PROJECT_ID_META, $project_id );
		update_post_meta( $asset_id, self::ASSET_CAT_ID_META, $asset_cat_id );
		update_post_meta( $asset_id, self::ORIGINAL_NAME_META, (string) ( $manifest['file_name'] ?? basename( $source_path ) ) );
		update_post_meta( $asset_id, self::CLEANUP_AFTER_META, time() + DAY_IN_SECONDS );
		delete_post_meta( $asset_id, self::ERROR_META );
		delete_post_meta( $asset_id, self::DIAGNOSTIC_META );
		self::schedule_job( $asset_id );
		self::clear_asset_browser_cache();

		return [
			'success' => true,
			'status'  => 'pending',
		];
	}

	public static function consume_uploaded_file_array( array $file, int $asset_id, int $project_id, int $asset_cat_id ): array {
		if ( $asset_id <= 0 || (int) ( $file['error'] ?? UPLOAD_ERR_NO_FILE ) !== UPLOAD_ERR_OK ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'The model upload was not received.',
			];
		}

		if ( ! self::can_mutate_import_target( $asset_id, $project_id ) ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'You are not allowed to replace this asset in the selected project.',
			];
		}

		$file_size = (int) ( $file['size'] ?? 0 );
		if ( $file_size <= 0 || $file_size > self::max_upload_bytes() ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'The model upload exceeds the configured size limit.',
			];
		}

		$file_name = sanitize_file_name( (string) ( $file['name'] ?? '' ) );
		$extension = strtolower( pathinfo( $file_name, PATHINFO_EXTENSION ) );
		if ( ! self::is_supported_extension( $extension ) ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'Supported model uploads are GLB, ZIP, BLEND, FBX, OBJ, DAE, and glTF files.',
			];
		}

		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => (string) $upload_dir['error'],
			];
		}

		$user_id     = get_current_user_id();
		$token       = sanitize_key( wp_generate_uuid4() );
		$session_dir = VRodos_Asset_Import_Session::staged_session_dir( (string) $upload_dir['basedir'], $user_id, $token );
		if ( ! wp_mkdir_p( $session_dir ) ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'Could not create the model upload staging directory.',
			];
		}

		$source_path = trailingslashit( $session_dir ) . 'upload.' . $extension;
		if ( ! move_uploaded_file( (string) ( $file['tmp_name'] ?? '' ), $source_path ) ) {
			self::delete_directory_inside_root( $session_dir, VRodos_Asset_Import_Session::user_staged_root( (string) $upload_dir['basedir'], $user_id ) );
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'Could not stage the model upload.',
			];
		}
		if ( ! self::valid_model_signature( $source_path, $extension ) ) {
			self::delete_directory_inside_root( $session_dir, VRodos_Asset_Import_Session::user_staged_root( (string) $upload_dir['basedir'], $user_id ) );
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'The uploaded file content does not match its model type.',
			];
		}

		file_put_contents(
			trailingslashit( $session_dir ) . 'manifest.json',
			wp_json_encode(
				[
					'file_name'  => $file_name,
					'extension'  => $extension,
					'project_id' => $project_id,
					'user_id'    => $user_id,
					'created'    => time(),
					'size'       => filesize( $source_path ),
				]
			)
		);

		return self::consume_staged_upload( $token, $asset_id, $project_id, $asset_cat_id );
	}

	public static function prepare_staged_upload( string $token ): array {
		$token = sanitize_key( $token );
		if ( '' === $token ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => 'The staged model upload token is invalid.',
			];
		}

		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => (string) $upload_dir['error'],
			];
		}

		$user_id     = get_current_user_id();
		$session_dir = VRodos_Asset_Import_Session::staged_session_dir( (string) $upload_dir['basedir'], $user_id, $token );
		$session_url = VRodos_Asset_Import_Session::staged_session_url( (string) $upload_dir['baseurl'], $user_id, $token );
		$manifest    = VRodos_Asset_Import_Session::read_owned_manifest( $session_dir );
		if ( is_wp_error( $manifest ) ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => $manifest->get_error_message(),
			];
		}
		$extension   = strtolower( (string) ( $manifest['extension'] ?? '' ) );
		$source_path = trailingslashit( $session_dir ) . 'upload.' . $extension;
		if ( ! is_file( $source_path ) || ( 'zip' !== $extension && ! self::is_conversion_extension( $extension ) ) ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => 'Only staged ZIP, BLEND, FBX, OBJ, DAE, and glTF packages can be prepared before asset save.',
			];
		}

		$manifest = VRodos_Asset_Import_Session::update_staged_prepare_progress(
			$session_dir,
			$manifest,
			5,
			'zip' === $extension ? 'Inspecting ZIP package...' : 'Preparing Blender conversion...',
			'zip' === $extension ? 'inspecting' : 'converting'
		);

		$existing_prepared_path = VRodos_Asset_Import_Session::prepared_glb_path_from_manifest( $session_dir, $manifest );
		if ( '' !== $existing_prepared_path && is_file( $existing_prepared_path ) ) {
			$manifest = VRodos_Asset_Import_Session::update_staged_prepare_progress( $session_dir, $manifest, 100, 'Model package is already prepared.', 'ready' );
			return [
				'success'          => true,
				'can_save'         => true,
				'message'          => 'Model package is already prepared. Saving will attach the generated GLB.',
				'selected'         => (string) ( $manifest['selected_entry'] ?? '' ),
				'diagnostic'       => (string) ( $manifest['prepared_diagnostic'] ?? '' ),
				'requires_blender' => ! empty( $manifest['prepared_conversion_tool'] ),
				'prepared_url'     => VRodos_Asset_Import_Session::prepared_glb_url_from_manifest( $session_url, $manifest ),
			];
		}

		if ( self::is_conversion_extension( $extension ) ) {
			wp_raise_memory_limit( 'admin' );
			@set_time_limit( 600 );

			$prepared_path = trailingslashit( $session_dir ) . 'prepared.glb';
			$selected      = (string) ( $manifest['file_name'] ?? basename( $source_path ) );
			$progress_callback = static function ( int $percent, string $message ) use ( $session_dir, &$manifest ): void {
				$manifest = VRodos_Asset_Import_Session::update_staged_prepare_progress( $session_dir, $manifest, $percent, $message, 'converting' );
			};

			$conversion = VRodos_Asset_Import_Blender_Converter::convert_to_glb(
				$source_path,
				$extension,
				$prepared_path,
				$session_dir,
				$progress_callback
			);

			if ( empty( $conversion['success'] ) ) {
				$diagnostic = (string) ( $conversion['code'] ?? '' ) === 'unsupported-ascii-fbx'
					? ''
					: trim( (string) ( $conversion['stderr'] ?? '' ) . ' ' . (string) ( $conversion['stdout'] ?? '' ) );
				$manifest   = VRodos_Asset_Import_Session::update_staged_prepare_progress(
					$session_dir,
					$manifest,
					(int) ( $manifest['prepare_percent'] ?? 0 ),
					(string) ( $conversion['message'] ?? 'Blender conversion failed.' ),
					'failed'
				);
				$manifest['prepared_diagnostic'] = $diagnostic;
				VRodos_Asset_Import_Session::write_staged_manifest( $session_dir, $manifest );

				return [
					'success'    => false,
					'can_save'   => false,
					'message'    => (string) ( $conversion['message'] ?? 'Blender conversion failed.' ),
					'diagnostic' => $diagnostic,
				];
			}

			$converted_path = (string) ( $conversion['path'] ?? $prepared_path );
			if ( $converted_path !== $prepared_path ) {
				@unlink( $prepared_path );
				@copy( $converted_path, $prepared_path );
			}

			if ( ! is_file( $prepared_path ) ) {
				$diagnostic = trim( (string) ( $conversion['stderr'] ?? '' ) . ' ' . (string) ( $conversion['stdout'] ?? '' ) );
				$manifest   = VRodos_Asset_Import_Session::update_staged_prepare_progress( $session_dir, $manifest, (int) ( $manifest['prepare_percent'] ?? 0 ), 'Blender conversion succeeded but the generated GLB could not be staged for asset save.', 'failed' );
				$manifest['prepared_diagnostic'] = $diagnostic;
				VRodos_Asset_Import_Session::write_staged_manifest( $session_dir, $manifest );

				return [
					'success'    => false,
					'can_save'   => false,
					'message'    => 'Blender conversion succeeded but the generated GLB could not be staged for asset save.',
					'diagnostic' => $diagnostic,
				];
			}

			$manifest['prepared_glb']                = 'prepared.glb';
			$manifest['prepared_at']                 = time();
			$manifest['selected_entry']              = $selected;
			$manifest['prepared_source_extension']   = $extension;
			$manifest['prepared_diagnostic']         = trim( 'Blender conversion succeeded for ' . $selected . '. ' . (string) ( $conversion['stdout'] ?? '' ) );
			$manifest['prepared_conversion_tool']    = 'blender';
			$manifest['prepared_conversion_version'] = self::CONVERSION_VERSION;
			$manifest['prepare_status']              = 'ready';
			$manifest['prepare_percent']             = 100;
			$manifest['prepare_message']             = 'GLB conversion complete.';
			$manifest['prepare_updated_at']          = time();
			VRodos_Asset_Import_Session::write_staged_manifest( $session_dir, $manifest );

			return [
				'success'          => true,
				'can_save'         => true,
				'message'          => strtoupper( $extension ) . ' model converted to GLB and is ready to save.',
				'selected'         => $selected,
				'diagnostic'       => (string) $manifest['prepared_diagnostic'],
				'requires_blender' => true,
				'prepared_url'     => VRodos_Asset_Import_Session::prepared_glb_url_from_manifest( $session_url, $manifest ),
			];
		}

		if ( ! class_exists( 'ZipArchive' ) ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => 'PHP ZipArchive is not available, so ZIP model packages cannot be prepared.',
			];
		}

		$selection     = VRodos_Asset_Import_Zip_Package::scan( $source_path );
		$cleanup_paths = (array) ( $selection['temp_files'] ?? [] );
		$diagnostic    = VRodos_Asset_Import_Zip_Package::format_selection_diagnostic( $selection );
		$prepared_path = trailingslashit( $session_dir ) . 'prepared.glb';
		$manifest      = VRodos_Asset_Import_Session::update_staged_prepare_progress( $session_dir, $manifest, 12, 'ZIP package inspected.', 'inspecting' );

		if ( empty( $selection['success'] ) ) {
			VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
			return [
				'success'    => false,
				'can_save'   => false,
				'message'    => 'ZIP model package could not be opened. ' . (string) ( $selection['error'] ?? '' ),
				'diagnostic' => $diagnostic,
			];
		}

		if ( ! empty( $selection['glb']['display_entry'] ) ) {
			$selected_glb = (array) $selection['glb'];
			if ( ! empty( $selected_glb['requires_repack'] ) ) {
				$manifest = VRodos_Asset_Import_Session::update_staged_prepare_progress( $session_dir, $manifest, 15, 'Blender is repacking GLB external resources...', 'converting' );
				$progress_callback = static function ( int $percent, string $message ) use ( $session_dir, &$manifest ): void {
					$manifest = VRodos_Asset_Import_Session::update_staged_prepare_progress( $session_dir, $manifest, $percent, $message, 'converting' );
				};
				$conversion = self::convert_zip_candidate_to_glb( $selected_glb, $progress_callback );
				$cleanup_paths = array_merge( $cleanup_paths, (array) ( $conversion['cleanup_paths'] ?? [] ) );
				if ( empty( $conversion['success'] ) ) {
					$manifest = VRodos_Asset_Import_Session::update_staged_prepare_progress( $session_dir, $manifest, (int) ( $manifest['prepare_percent'] ?? 0 ), (string) ( $conversion['message'] ?? 'Blender GLB repack failed.' ), 'failed' );
					VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
					return [
						'success'    => false,
						'can_save'   => false,
						'message'    => (string) ( $conversion['message'] ?? 'Blender GLB repack failed.' ),
						'diagnostic' => trim( $diagnostic . ' ' . (string) ( $conversion['diagnostic'] ?? '' ) ),
					];
				}

				@unlink( $prepared_path );
				if ( ! @copy( (string) ( $conversion['path'] ?? '' ), $prepared_path ) ) {
					$manifest = VRodos_Asset_Import_Session::update_staged_prepare_progress( $session_dir, $manifest, (int) ( $manifest['prepare_percent'] ?? 0 ), 'Blender repacked the selected GLB but the generated GLB could not be staged for asset save.', 'failed' );
					VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
					return [
						'success'    => false,
						'can_save'   => false,
						'message'    => 'Blender repacked the selected GLB but the generated GLB could not be staged for asset save.',
						'diagnostic' => trim( $diagnostic . ' ' . (string) ( $conversion['diagnostic'] ?? '' ) ),
					];
				}

				$manifest['prepared_glb']                = 'prepared.glb';
				$manifest['prepared_at']                 = time();
				$manifest['selected_entry']              = (string) ( $selected_glb['display_entry'] ?? '' );
				$manifest['prepared_source_extension']   = 'glb';
				$manifest['prepared_diagnostic']         = trim( $diagnostic . ' ' . (string) ( $conversion['diagnostic'] ?? '' ) );
				$manifest['prepared_conversion_tool']    = 'blender';
				$manifest['prepared_conversion_version'] = self::CONVERSION_VERSION;
				$manifest['prepare_status']              = 'ready';
				$manifest['prepare_percent']             = 100;
				$manifest['prepare_message']             = 'GLB repack complete.';
				$manifest['prepare_updated_at']          = time();
				VRodos_Asset_Import_Session::write_staged_manifest( $session_dir, $manifest );
				VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );

				return [
					'success'          => true,
					'can_save'         => true,
					'message'          => 'ZIP package is ready. Selected GLB repacked with external resources: ' . (string) $manifest['selected_entry'],
					'selected'         => (string) $manifest['selected_entry'],
					'diagnostic'       => (string) $manifest['prepared_diagnostic'],
					'requires_blender' => true,
					'prepared_url'     => VRodos_Asset_Import_Session::prepared_glb_url_from_manifest( $session_url, $manifest ),
				];
			}

			$manifest = VRodos_Asset_Import_Session::update_staged_prepare_progress( $session_dir, $manifest, 25, 'Extracting selected GLB...', 'preparing' );
			$tmp_glb      = VRodos_Asset_Import_Zip_Package::extract_entry_from_path_to_temp_file(
				(string) ( $selected_glb['container_path'] ?? '' ),
				(string) ( $selected_glb['zip_entry'] ?? '' )
			);

			if ( is_wp_error( $tmp_glb ) ) {
				VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
				return [
					'success'    => false,
					'can_save'   => false,
					'message'    => 'Failed to extract selected GLB from ZIP: ' . $tmp_glb->get_error_message(),
					'diagnostic' => $diagnostic,
				];
			}

			$cleanup_paths[] = $tmp_glb;
			@unlink( $prepared_path );
			if ( ! @copy( $tmp_glb, $prepared_path ) ) {
				VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
				return [
					'success'    => false,
					'can_save'   => false,
					'message'    => 'Could not prepare the selected GLB from the ZIP package.',
					'diagnostic' => $diagnostic,
				];
			}

			$manifest['prepared_glb']                = 'prepared.glb';
			$manifest['prepared_at']                 = time();
			$manifest['selected_entry']              = (string) ( $selected_glb['display_entry'] ?? '' );
			$manifest['prepared_source_extension']   = 'glb';
			$manifest['prepared_diagnostic']         = $diagnostic;
			$manifest['prepared_conversion_tool']    = '';
			$manifest['prepared_conversion_version'] = '';
			$manifest['prepare_status']              = 'ready';
			$manifest['prepare_percent']             = 100;
			$manifest['prepare_message']             = 'Selected GLB extracted.';
			$manifest['prepare_updated_at']          = time();
			VRodos_Asset_Import_Session::write_staged_manifest( $session_dir, $manifest );
			VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );

			return [
				'success'          => true,
				'can_save'         => true,
				'message'          => 'ZIP package is ready. Selected GLB extracted: ' . (string) $manifest['selected_entry'],
				'selected'         => (string) $manifest['selected_entry'],
				'diagnostic'       => $diagnostic,
				'requires_blender' => false,
				'prepared_url'     => VRodos_Asset_Import_Session::prepared_glb_url_from_manifest( $session_url, $manifest ),
			];
		}

		if ( empty( $selection['candidate']['display_entry'] ) ) {
			VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
			return [
				'success'    => false,
				'can_save'   => false,
				'message'    => 'ZIP does not contain a usable GLB or supported BLEND, FBX, OBJ, DAE, or glTF source.',
				'diagnostic' => $diagnostic,
			];
		}

		$manifest = VRodos_Asset_Import_Session::update_staged_prepare_progress( $session_dir, $manifest, 15, 'Blender is converting the selected source...', 'converting' );
		$progress_callback = static function ( int $percent, string $message ) use ( $session_dir, &$manifest ): void {
			$manifest = VRodos_Asset_Import_Session::update_staged_prepare_progress( $session_dir, $manifest, $percent, $message, 'converting' );
		};
		$conversion = self::convert_zip_candidate_to_glb( (array) $selection['candidate'], $progress_callback );
		$cleanup_paths = array_merge( $cleanup_paths, (array) ( $conversion['cleanup_paths'] ?? [] ) );
		if ( empty( $conversion['success'] ) ) {
			$manifest = VRodos_Asset_Import_Session::update_staged_prepare_progress( $session_dir, $manifest, (int) ( $manifest['prepare_percent'] ?? 0 ), (string) ( $conversion['message'] ?? 'Blender conversion failed.' ), 'failed' );
			VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
			return [
				'success'    => false,
				'can_save'   => false,
				'message'    => (string) ( $conversion['message'] ?? 'Blender conversion failed.' ),
				'diagnostic' => trim( $diagnostic . ' ' . (string) ( $conversion['diagnostic'] ?? '' ) ),
			];
		}

		@unlink( $prepared_path );
		if ( ! @copy( (string) ( $conversion['path'] ?? '' ), $prepared_path ) ) {
			VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
			return [
				'success'    => false,
				'can_save'   => false,
				'message'    => 'Blender conversion succeeded but the generated GLB could not be staged for asset save.',
				'diagnostic' => trim( $diagnostic . ' ' . (string) ( $conversion['diagnostic'] ?? '' ) ),
			];
		}

		$manifest['prepared_glb']                = 'prepared.glb';
		$manifest['prepared_at']                 = time();
		$manifest['selected_entry']              = (string) ( $conversion['entry'] ?? '' );
		$manifest['prepared_source_extension']   = strtolower( (string) ( $selection['candidate']['extension'] ?? '' ) );
		$manifest['prepared_diagnostic']         = trim( $diagnostic . ' ' . (string) ( $conversion['diagnostic'] ?? '' ) );
		$manifest['prepared_conversion_tool']    = 'blender';
		$manifest['prepared_conversion_version'] = self::CONVERSION_VERSION;
		$manifest['prepare_status']              = 'ready';
		$manifest['prepare_percent']             = 100;
		$manifest['prepare_message']             = 'GLB conversion complete.';
		$manifest['prepare_updated_at']          = time();
		VRodos_Asset_Import_Session::write_staged_manifest( $session_dir, $manifest );
		VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );

		return [
			'success'          => true,
			'can_save'         => true,
			'message'          => 'ZIP package converted to GLB and is ready to save.',
			'selected'         => (string) $manifest['selected_entry'],
			'diagnostic'       => (string) $manifest['prepared_diagnostic'],
			'requires_blender' => true,
			'prepared_url'     => VRodos_Asset_Import_Session::prepared_glb_url_from_manifest( $session_url, $manifest ),
		];
	}

	public static function inspect_staged_upload( string $token ): array {
		$token = sanitize_key( $token );
		if ( '' === $token ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => 'The staged model upload token is invalid.',
			];
		}

		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => (string) $upload_dir['error'],
			];
		}

		$user_id     = get_current_user_id();
		$session_dir = VRodos_Asset_Import_Session::staged_session_dir( (string) $upload_dir['basedir'], $user_id, $token );
		$manifest    = VRodos_Asset_Import_Session::read_owned_manifest( $session_dir );
		if ( is_wp_error( $manifest ) ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => $manifest->get_error_message(),
			];
		}
		$extension   = strtolower( (string) ( $manifest['extension'] ?? '' ) );
		$source_path = trailingslashit( $session_dir ) . 'upload.' . $extension;
		if ( ! self::is_supported_extension( $extension ) || ! is_file( $source_path ) ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => 'The staged model upload is missing or unsupported.',
			];
		}

		if ( 'zip' !== $extension ) {
			return [
				'success'       => true,
				'can_save'      => true,
				'extension'     => $extension,
				'message'       => 'Model upload is staged.',
				'selected'      => (string) ( $manifest['file_name'] ?? basename( $source_path ) ),
				'diagnostic'    => '',
				'requires_blender' => self::is_conversion_extension( $extension ),
			];
		}

		if ( ! class_exists( 'ZipArchive' ) ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => 'PHP ZipArchive is not available, so ZIP model packages cannot be inspected.',
			];
		}

		$selection  = VRodos_Asset_Import_Zip_Package::scan( $source_path );
		$diagnostic = VRodos_Asset_Import_Zip_Package::format_selection_diagnostic( $selection );
		VRodos_Asset_Import_Zip_Package::cleanup_paths( (array) ( $selection['temp_files'] ?? [] ) );

		if ( empty( $selection['success'] ) ) {
			return [
				'success'    => false,
				'can_save'   => false,
				'extension'  => 'zip',
				'message'    => 'ZIP model package could not be opened. ' . (string) ( $selection['error'] ?? '' ),
				'diagnostic' => $diagnostic,
			];
		}

		if ( ! empty( $selection['glb']['display_entry'] ) ) {
			$selected_glb = (array) $selection['glb'];
			$selected     = (string) $selected_glb['display_entry'];
			if ( ! empty( $selected_glb['requires_repack'] ) ) {
				$blender_status  = VRodos_Asset_Import_Blender_Converter::get_configured_status();
				$blender_message = (string) ( $blender_status['message'] ?? '' );
				if ( empty( $blender_status['success'] ) ) {
					return [
						'success'          => false,
						'can_save'         => false,
						'extension'        => 'zip',
						'selected'         => $selected,
						'selected_type'    => 'glb',
						'requires_blender' => true,
						'message'          => 'Selected GLB references external files, but Blender is not ready to repack them: ' . $blender_message,
						'diagnostic'       => $diagnostic,
					];
				}

				return [
					'success'          => true,
					'can_save'         => true,
					'extension'        => 'zip',
					'selected'         => $selected,
					'selected_type'    => 'glb',
					'requires_blender' => true,
					'message'          => 'ZIP inspection passed. Selected GLB references external files and will be repacked with Blender: ' . $selected,
					'diagnostic'       => $diagnostic,
				];
			}

			return [
				'success'          => true,
				'can_save'         => true,
				'extension'        => 'zip',
				'selected'         => $selected,
				'selected_type'    => 'glb',
				'requires_blender' => false,
				'message'          => 'ZIP inspection passed. Selected GLB: ' . $selected,
				'diagnostic'       => $diagnostic,
			];
		}

		if ( ! empty( $selection['candidate']['display_entry'] ) ) {
			$candidate       = (array) $selection['candidate'];
			$selected        = (string) $candidate['display_entry'];
			$candidate_ext   = strtolower( (string) ( $candidate['extension'] ?? '' ) );
			$blender_status  = VRodos_Asset_Import_Blender_Converter::get_configured_status();
			$blender_message = (string) ( $blender_status['message'] ?? '' );

			if ( empty( $blender_status['success'] ) ) {
				return [
					'success'          => false,
					'can_save'         => false,
					'extension'        => 'zip',
					'selected'         => $selected,
					'selected_type'    => $candidate_ext,
					'requires_blender' => true,
					'message'          => 'ZIP contains a supported .' . $candidate_ext . ' source, but Blender is not ready: ' . $blender_message,
					'diagnostic'       => $diagnostic,
				];
			}

			return [
				'success'          => true,
				'can_save'         => true,
				'extension'        => 'zip',
				'selected'         => $selected,
				'selected_type'    => $candidate_ext,
				'requires_blender' => true,
				'message'          => 'ZIP inspection passed. Selected .' . $candidate_ext . ' source for Blender conversion: ' . $selected,
				'diagnostic'       => $diagnostic,
			];
		}

		return [
			'success'    => false,
			'can_save'   => false,
			'extension'  => 'zip',
			'message'    => 'ZIP does not contain a usable GLB or supported BLEND, FBX, OBJ, DAE, or glTF source.',
			'diagnostic' => $diagnostic,
		];
	}

	public static function staged_upload_status( string $token ): array {
		$token = sanitize_key( $token );
		if ( '' === $token ) {
			return [
				'success' => false,
				'message' => 'The staged model upload token is invalid.',
			];
		}

		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) ) {
			return [
				'success' => false,
				'message' => (string) $upload_dir['error'],
			];
		}

		$user_id     = get_current_user_id();
		$session_dir = VRodos_Asset_Import_Session::staged_session_dir( (string) $upload_dir['basedir'], $user_id, $token );
		$session_url = VRodos_Asset_Import_Session::staged_session_url( (string) $upload_dir['baseurl'], $user_id, $token );
		$manifest    = VRodos_Asset_Import_Session::read_owned_manifest( $session_dir );
		if ( is_wp_error( $manifest ) ) {
			return [
				'success' => false,
				'message' => $manifest->get_error_message(),
			];
		}
		$status  = (string) ( $manifest['prepare_status'] ?? '' );
		$percent = max( 0, min( 100, (int) ( $manifest['prepare_percent'] ?? 0 ) ) );
		if ( '' === $status && ! empty( $manifest['prepared_glb'] ) ) {
			$status  = 'ready';
			$percent = 100;
		}
		if ( '' === $status ) {
			$status = 'staged';
		}

		return [
			'success'        => true,
			'status'         => $status,
			'percent'        => $percent,
			'message'        => (string) ( $manifest['prepare_message'] ?? self::prepare_progress_message( $status, $percent ) ),
			'selected'       => (string) ( $manifest['selected_entry'] ?? '' ),
			'diagnostic'     => (string) ( $manifest['prepared_diagnostic'] ?? '' ),
			'can_save'       => ! empty( $manifest['prepared_glb'] ) && is_file( VRodos_Asset_Import_Session::prepared_glb_path_from_manifest( $session_dir, $manifest ) ),
			'prepared_url'   => VRodos_Asset_Import_Session::prepared_glb_url_from_manifest( $session_url, $manifest ),
			'updated_at'     => (int) ( $manifest['prepare_updated_at'] ?? 0 ),
			'requires_blender' => ! empty( $manifest['prepared_conversion_tool'] ) || in_array( $status, [ 'converting', 'running' ], true ),
		];
	}

	public static function process_asset_import_job( int $asset_id ): array {
		if ( $asset_id <= 0 || 'vrodos_asset3d' !== get_post_type( $asset_id ) ) {
			return [
				'success' => false,
				'error'   => 'Asset is missing.',
			];
		}

		$lock_key = 'vrodos_asset_import_lock_' . $asset_id;
		if ( get_transient( $lock_key ) ) {
			return [
				'success' => false,
				'status'  => 'running',
				'error'   => 'Conversion is already running.',
			];
		}

		set_transient( $lock_key, time(), 10 * MINUTE_IN_SECONDS );
		update_post_meta( $asset_id, self::STATUS_META, 'running' );
		delete_post_meta( $asset_id, self::ERROR_META );

		try {
			$result = self::do_process_asset_import_job( $asset_id );
		} catch ( Throwable $throwable ) {
			$result = [
				'success' => false,
				'error'   => $throwable->getMessage(),
			];
		}

		delete_transient( $lock_key );

		return $result;
	}

	private static function do_process_asset_import_job( int $asset_id ): array {
		$source_path  = (string) get_post_meta( $asset_id, self::SOURCE_PATH_META, true );
		$extension    = strtolower( (string) get_post_meta( $asset_id, self::SOURCE_EXT_META, true ) );
		$staged_dir   = (string) get_post_meta( $asset_id, self::STAGED_DIR_META, true );
		$project_id   = absint( get_post_meta( $asset_id, self::PROJECT_ID_META, true ) );
		$asset_cat_id = absint( get_post_meta( $asset_id, self::ASSET_CAT_ID_META, true ) );

		if ( '' === $source_path || ! is_file( $source_path ) || ! self::is_supported_extension( $extension ) ) {
			return self::fail_job( $asset_id, 'The staged source file is missing or unsupported.' );
		}

		wp_raise_memory_limit( 'admin' );
		@set_time_limit( 600 );

		$model_tmp_path  = '';
		$selected_entry  = (string) get_post_meta( $asset_id, self::ORIGINAL_NAME_META, true );
		$diagnostic      = '';
		$converted_from  = '';
		$cleanup_paths   = [];

		if ( 'zip' === $extension ) {
			if ( ! class_exists( 'ZipArchive' ) ) {
				return self::fail_job( $asset_id, 'PHP ZipArchive is not available, so ZIP model packages cannot be inspected.' );
			}

			$selection     = VRodos_Asset_Import_Zip_Package::scan( $source_path );
			$cleanup_paths = array_merge( $cleanup_paths, (array) ( $selection['temp_files'] ?? [] ) );
			$diagnostic    = VRodos_Asset_Import_Zip_Package::format_selection_diagnostic( $selection );

			if ( empty( $selection['success'] ) ) {
				VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
				return self::fail_job( $asset_id, 'ZIP model package could not be opened. ' . (string) ( $selection['error'] ?? '' ), $diagnostic );
			}

			if ( ! empty( $selection['glb']['display_entry'] ) ) {
				$selected_glb  = (array) $selection['glb'];
				$selected_entry = (string) $selected_glb['display_entry'];
				if ( ! empty( $selected_glb['requires_repack'] ) ) {
					$conversion = self::convert_zip_candidate_to_glb( $selected_glb );
					$cleanup_paths = array_merge( $cleanup_paths, (array) ( $conversion['cleanup_paths'] ?? [] ) );
					if ( empty( $conversion['success'] ) ) {
						VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
						return self::fail_job(
							$asset_id,
							(string) ( $conversion['message'] ?? 'Blender GLB repack failed.' ),
							trim( $diagnostic . ' ' . (string) ( $conversion['diagnostic'] ?? '' ) )
						);
					}

					$model_tmp_path = (string) ( $conversion['path'] ?? '' );
					$converted_from = $selected_entry;
					$diagnostic     = trim( $diagnostic . ' ' . (string) ( $conversion['diagnostic'] ?? '' ) );
				} else {
					$model_tmp_path = VRodos_Asset_Import_Zip_Package::extract_entry_from_path_to_temp_file(
						(string) ( $selected_glb['container_path'] ?? '' ),
						(string) ( $selected_glb['zip_entry'] ?? '' )
					);

					if ( is_wp_error( $model_tmp_path ) ) {
						VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
						return self::fail_job( $asset_id, 'Failed to extract selected GLB from ZIP: ' . $model_tmp_path->get_error_message(), $diagnostic );
					}
					$cleanup_paths[] = $model_tmp_path;
				}
			} elseif ( ! empty( $selection['candidate']['display_entry'] ) ) {
				$conversion = self::convert_zip_candidate_to_glb( (array) $selection['candidate'] );
				$cleanup_paths = array_merge( $cleanup_paths, (array) ( $conversion['cleanup_paths'] ?? [] ) );
				if ( empty( $conversion['success'] ) ) {
					VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
					return self::fail_job(
						$asset_id,
						(string) ( $conversion['message'] ?? 'Blender conversion failed.' ),
						trim( $diagnostic . ' ' . (string) ( $conversion['diagnostic'] ?? '' ) )
					);
				}

				$model_tmp_path = (string) ( $conversion['path'] ?? '' );
				$selected_entry = (string) ( $conversion['entry'] ?? '' );
				$converted_from = $selected_entry;
				$diagnostic     = trim( $diagnostic . ' ' . (string) ( $conversion['diagnostic'] ?? '' ) );
			} else {
				VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
				return self::fail_job( $asset_id, 'ZIP does not contain a usable GLB file or supported conversion source.', $diagnostic );
			}
		} elseif ( self::is_conversion_extension( $extension ) ) {
			$output_path = trailingslashit( $staged_dir ) . 'converted.glb';
			$conversion = VRodos_Asset_Import_Blender_Converter::convert_to_glb(
				$source_path,
				$extension,
				$output_path,
				is_dir( $staged_dir ) ? $staged_dir : dirname( $source_path )
			);

			if ( empty( $conversion['success'] ) ) {
				$diagnostic = (string) ( $conversion['code'] ?? '' ) === 'unsupported-ascii-fbx'
					? ''
					: trim( (string) ( $conversion['stderr'] ?? '' ) . ' ' . (string) ( $conversion['stdout'] ?? '' ) );

				return self::fail_job(
					$asset_id,
					(string) ( $conversion['message'] ?? 'Blender conversion failed.' ),
					$diagnostic
				);
			}

			$model_tmp_path = (string) ( $conversion['path'] ?? $output_path );
			$converted_from = $selected_entry;
			$diagnostic     = trim( 'Blender conversion succeeded for ' . $selected_entry . '. ' . (string) ( $conversion['stdout'] ?? '' ) );
		} else {
			return self::fail_job( $asset_id, 'Unsupported model source .' . $extension . '.' );
		}

		if ( '' === $model_tmp_path || ! is_file( $model_tmp_path ) ) {
			VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
			return self::fail_job( $asset_id, 'Conversion did not produce a GLB file.', $diagnostic );
		}

		$attachment_id = self::save_glb_file_for_asset( $model_tmp_path, self::target_glb_name( $asset_id, $asset_cat_id ), $asset_id );
		if ( is_wp_error( $attachment_id ) ) {
			VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
			return self::fail_job( $asset_id, $attachment_id->get_error_message(), $diagnostic );
		}

		$switched = VRodos_Storage_Manager::replace_attachment_references( $asset_id, 'asset', [ 'vrodos_asset3d_glb' ], (int) $attachment_id );
		if ( is_wp_error( $switched ) ) {
			VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );
			return self::fail_job( $asset_id, $switched->get_error_message(), $diagnostic );
		}
		update_post_meta( $asset_id, self::SELECTED_ENTRY_META, $selected_entry );
		if ( '' !== $converted_from ) {
			update_post_meta( $asset_id, self::CONVERSION_TOOL_META, 'blender' );
			update_post_meta( $asset_id, self::CONVERSION_VER_META, self::CONVERSION_VERSION );
		} else {
			delete_post_meta( $asset_id, self::CONVERSION_TOOL_META );
			delete_post_meta( $asset_id, self::CONVERSION_VER_META );
		}

		self::mark_ready( $asset_id, (int) $attachment_id, $diagnostic, $selected_entry );
		self::maybe_generate_blender_thumbnail( $asset_id, (int) $attachment_id, $project_id );
		self::clear_asset_browser_cache();
		VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );

		if ( '' !== $staged_dir ) {
			$upload_dir = wp_upload_dir();
			if ( empty( $upload_dir['error'] ) ) {
				self::delete_directory_inside_root( $staged_dir, VRodos_Asset_Import_Session::user_staged_root( '', get_current_user_id() ) );
			}
		}

		return [
			'success'       => true,
			'status'        => 'ready',
			'attachment_id' => (int) $attachment_id,
		];
	}

	private static function convert_zip_candidate_to_glb( array $candidate, ?callable $progress_callback = null ): array {
		$entry          = (string) ( $candidate['display_entry'] ?? '' );
		$extension      = strtolower( (string) ( $candidate['extension'] ?? '' ) );
		$container_path = (string) ( $candidate['container_path'] ?? '' );
		$local_entry    = (string) ( $candidate['local_entry'] ?? '' );

		$package = VRodos_Asset_Import_Zip_Package::extract_safe_package( $container_path, $local_entry );
		if ( is_wp_error( $package ) ) {
			return [
				'success'       => false,
				'message'       => 'Failed to prepare ZIP package for Blender conversion: ' . $package->get_error_message(),
				'diagnostic'    => $package->get_error_message(),
				'cleanup_paths' => [],
			];
		}

		$cleanup_paths   = [ (string) ( $package['dir'] ?? '' ) ];
		$output_path     = trailingslashit( (string) ( $package['dir'] ?? '' ) ) . 'converted.glb';
		$cleanup_paths[] = $output_path;

		$conversion = VRodos_Asset_Import_Blender_Converter::convert_to_glb(
			(string) ( $package['source_path'] ?? '' ),
			$extension,
			$output_path,
			(string) ( $package['dir'] ?? '' ),
			$progress_callback
		);

		if ( empty( $conversion['success'] ) ) {
			$diagnostic = trim(
				'Source: ' . $entry . '. '
				. (string) ( $conversion['message'] ?? '' ) . ' '
				. (string) ( $conversion['stderr'] ?? '' ) . ' '
				. (string) ( $conversion['stdout'] ?? '' )
			);

			return [
				'success'       => false,
				'message'       => (string) ( $conversion['message'] ?? 'Blender conversion failed.' ),
				'diagnostic'    => $diagnostic,
				'cleanup_paths' => $cleanup_paths,
			];
		}

		return [
			'success'       => true,
			'path'          => (string) ( $conversion['path'] ?? $output_path ),
			'entry'         => $entry,
			'size'          => (int) ( $conversion['size'] ?? 0 ),
			'diagnostic'    => trim( 'Blender conversion succeeded for ' . $entry . '. ' . (string) ( $conversion['stdout'] ?? '' ) ),
			'cleanup_paths' => $cleanup_paths,
		];
	}

	private static function save_glb_file_for_asset( string $source_path, string $target_name, int $asset_id ): int|WP_Error {
		if ( ! is_file( $source_path ) ) {
			return new WP_Error( 'source_missing', 'The GLB source file is missing.' );
		}

		$attachment_id = VRodos_Storage_Manager::promote_private_temporary_glb( $source_path, $target_name, $asset_id );
		return is_wp_error( $attachment_id ) ? $attachment_id : (int) $attachment_id;
	}

	private static function maybe_generate_blender_thumbnail( int $asset_id, int $glb_attachment_id, int $project_id ): void {
		if ( $project_id <= 0 || get_post_meta( $asset_id, 'vrodos_asset3d_screenimage', true ) ) {
			return;
		}

		$glb_path = get_attached_file( $glb_attachment_id );
		if ( ! is_string( $glb_path ) || '' === $glb_path || ! is_file( $glb_path ) ) {
			return;
		}

		$temp_root = VRodos_Storage_Manager::temporary_directory( 'thumbnail', wp_generate_uuid4() );
		if ( is_wp_error( $temp_root ) ) {
			return;
		}
		$temp_png = $temp_root . 'thumbnail.png';
		try {
			$rendered = VRodos_Asset_Import_Blender_Converter::render_glb_thumbnail( $glb_path, $temp_png );
		} catch ( Throwable $throwable ) {
			@unlink( $temp_png );
			error_log( '[VRodos Asset Import] Thumbnail render failed: ' . $throwable->getMessage() );
			return;
		}

		if ( empty( $rendered['success'] ) || ! is_file( $temp_png ) ) {
			@unlink( $temp_png );
			return;
		}

		$image_binary = file_get_contents( $temp_png );
		@unlink( $temp_png );
		@rmdir( untrailingslashit( $temp_root ) );
		if ( ! is_string( $image_binary ) || '' === $image_binary ) {
			return;
		}

		$thumbnail_id = VRodos_Upload_Manager::upload_asset_screenshot( 'data:image/png;base64,' . base64_encode( $image_binary ), $asset_id, $project_id );
		if ( $thumbnail_id ) {
			set_post_thumbnail( $asset_id, (int) $thumbnail_id );
		}
	}

	private static function fail_job( int $asset_id, string $message, string $diagnostic = '' ): array {
		self::mark_failed( $asset_id, $message, $diagnostic );

		return [
			'success' => false,
			'status'  => 'failed',
			'error'   => $message,
		];
	}

	private static function normalize_glb_path( string $source_path, string $working_dir ): array|WP_Error {
		$output_path = trailingslashit( $working_dir ) . 'normalized-' . sanitize_key( wp_generate_uuid4() ) . '.glb';
		return VRodos_Asset_Import_Glb_Normalizer::normalize( $source_path, $output_path );
	}

	private static function mark_ready( int $asset_id, int $attachment_id, string $diagnostic = '', string $selected_entry = '' ): void {
		VRodos_Asset_Origin::mark_bounds_centered( $asset_id );
		update_post_meta( $asset_id, self::STATUS_META, 'ready' );
		update_post_meta( $asset_id, self::FINAL_GLB_ID_META, $attachment_id );
		delete_post_meta( $asset_id, self::ERROR_META );
		delete_post_meta( $asset_id, self::CLEANUP_AFTER_META );
		delete_post_meta( $asset_id, self::SOURCE_PATH_META );
		delete_post_meta( $asset_id, self::STAGED_DIR_META );
		delete_post_meta( $asset_id, self::JOB_TOKEN_META );
		if ( '' !== $diagnostic ) {
			update_post_meta( $asset_id, self::DIAGNOSTIC_META, $diagnostic );
		} else {
			delete_post_meta( $asset_id, self::DIAGNOSTIC_META );
		}
		if ( '' !== $selected_entry ) {
			update_post_meta( $asset_id, self::SELECTED_ENTRY_META, $selected_entry );
		}
	}

	private static function mark_failed( int $asset_id, string $message, string $diagnostic = '' ): void {
		update_post_meta( $asset_id, self::STATUS_META, 'failed' );
		update_post_meta( $asset_id, self::ERROR_META, $message );
		update_post_meta( $asset_id, self::CLEANUP_AFTER_META, time() + DAY_IN_SECONDS );
		if ( '' !== $diagnostic ) {
			update_post_meta( $asset_id, self::DIAGNOSTIC_META, $diagnostic );
		}
		self::clear_asset_browser_cache();
	}

	public static function status_for_asset( int $asset_id ): array {
		$status     = (string) get_post_meta( $asset_id, self::STATUS_META, true );
		$error      = (string) get_post_meta( $asset_id, self::ERROR_META, true );
		$diagnostic = (string) get_post_meta( $asset_id, self::DIAGNOSTIC_META, true );
		$glb_id     = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
		$glb_url    = class_exists( 'VRodos_Core_Manager' ) ? VRodos_Core_Manager::resolve_media_meta_url( $glb_id ) : '';

		$optimization = class_exists( 'VRodos_Asset_Optimization_Manager' )
			? VRodos_Asset_Optimization_Manager::get_web_optimization_state( $asset_id )
			: [
				'status' => 'none', 'profile' => 'web-high', 'percent' => 0, 'message' => '',
				'sourceBytes' => 0, 'derivativeBytes' => 0, 'reductionPercent' => 0.0, 'canRetry' => false,
			];

		return [
			'status'      => $status,
			'message'     => self::status_message( $status, $error ),
			'error'       => $error,
			'diagnostic'  => $diagnostic,
			'selected'    => (string) get_post_meta( $asset_id, self::SELECTED_ENTRY_META, true ),
			'glb_id'      => is_numeric( $glb_id ) ? (int) $glb_id : $glb_id,
			'glb_url'     => $glb_url,
			'can_retry'   => 'failed' === $status && is_file( (string) get_post_meta( $asset_id, self::SOURCE_PATH_META, true ) ),
			'source_name' => (string) get_post_meta( $asset_id, self::ORIGINAL_NAME_META, true ),
			'optimization' => $optimization,
		];
	}

	private static function status_message( string $status, string $error = '' ): string {
		return match ( $status ) {
			'pending' => 'Model package is queued for GLB conversion.',
			'running' => 'Model package is being converted to GLB.',
			'ready' => 'Model package is ready.',
			'failed' => '' !== $error ? $error : 'Model package conversion failed.',
			default => '',
		};
	}

	private static function schedule_job( int $asset_id ): void {
		if ( $asset_id <= 0 ) {
			return;
		}

		if ( ! wp_next_scheduled( self::IMPORT_CRON_HOOK, [ $asset_id ] ) ) {
			wp_schedule_single_event( time() + 5, self::IMPORT_CRON_HOOK, [ $asset_id ] );
		}
	}

	private static function target_glb_name( int $asset_id, int $asset_cat_id ): string {
		return 'glb_' . $asset_id . '_' . $asset_cat_id . '.glb';
	}

	private static function prepare_progress_message( string $status, int $percent ): string {
		return match ( $status ) {
			'inspecting' => 'Inspecting ZIP package...',
			'preparing' => 'Preparing model package...',
			'converting', 'running' => 'Blender conversion ' . $percent . '%...',
			'ready' => 'Model package is ready.',
			'failed' => 'Model package preparation failed.',
			default => 'Model package is staged.',
		};
	}

	public static function current_user_can_edit_asset( int $asset_id ): bool {
		if ( $asset_id <= 0 || ! is_user_logged_in() ) {
			return false;
		}

		if ( current_user_can( 'manage_options' ) || current_user_can( 'edit_post', $asset_id ) ) {
			return true;
		}

		return (int) get_post_field( 'post_author', $asset_id ) === get_current_user_id();
	}

	private static function can_mutate_import_target( int $asset_id, int $project_id, ?array $manifest = null ): bool {
		if (
			$asset_id <= 0
			|| $project_id <= 0
			|| 'vrodos_asset3d' !== get_post_type( $asset_id )
			|| 'vrodos_game' !== get_post_type( $project_id )
			|| ! self::current_user_can_edit_asset( $asset_id )
			|| ! current_user_can( 'edit_post', $project_id )
		) {
			return false;
		}

		return null === $manifest
			|| ( VRodos_Asset_Import_Session::can_access_staged_manifest( $manifest ) && (int) ( $manifest['project_id'] ?? 0 ) === $project_id );
	}

	public static function valid_model_signature( string $path, string $extension ): bool {
		$head = is_file( $path ) ? file_get_contents( $path, false, null, 0, 65536 ) : false;
		if ( ! is_string( $head ) || '' === $head ) {
			return false;
		}
		return match ( $extension ) {
			'glb'   => 'glTF' === substr( $head, 0, 4 ),
			'zip'   => str_starts_with( $head, "PK\x03\x04" ) || str_starts_with( $head, "PK\x05\x06" ),
			'blend' => str_starts_with( $head, 'BLENDER' )
				|| str_starts_with( $head, "\x28\xB5\x2F\xFD" ), // Zstandard-compressed .blend.
			'fbx'   => str_starts_with( $head, 'Kaydara FBX Binary' ) || str_contains( substr( $head, 0, 2048 ), 'FBX' ),
			'obj'   => ! str_contains( $head, "\0" ) && 1 === preg_match( '/^(?:v|vn|vt|f|o|g|mtllib|usemtl)\s+/m', $head ),
			'dae'   => ! str_contains( $head, "\0" ) && false !== stripos( $head, '<COLLADA' ),
			'gltf'  => ! str_contains( $head, "\0" ) && 1 === preg_match( '/"asset"\s*:\s*\{/', $head ),
			default => false,
		};
	}

	private static function clear_asset_browser_cache(): void {
		global $wpdb;
		if ( ! $wpdb instanceof wpdb ) {
			return;
		}

		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
				$wpdb->esc_like( '_transient_vrodos_assets_' ) . '%',
				$wpdb->esc_like( '_transient_timeout_vrodos_assets_' ) . '%'
			)
		);
	}

	public static function cleanup_staged_uploads(): void {
		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) || empty( $upload_dir['basedir'] ) ) {
			return;
		}

		$expired_asset_ids = get_posts(
			[
				'post_type'      => 'vrodos_asset3d',
				'post_status'    => 'any',
				'fields'         => 'ids',
				'posts_per_page' => -1,
				'meta_query'     => [
					[
						'key'     => self::CLEANUP_AFTER_META,
						'value'   => time(),
						'compare' => '<=',
						'type'    => 'NUMERIC',
					],
				],
			]
		);

		foreach ( $expired_asset_ids as $expired_asset_id ) {
			$expired_asset_id = (int) $expired_asset_id;
			$status           = (string) get_post_meta( $expired_asset_id, self::STATUS_META, true );
			if ( ! in_array( $status, [ 'failed', 'pending', 'running' ], true ) ) {
				delete_post_meta( $expired_asset_id, self::CLEANUP_AFTER_META );
				continue;
			}

			if ( 'running' === $status && get_transient( 'vrodos_asset_import_lock_' . $expired_asset_id ) ) {
				continue;
			}

			$staged_dir = (string) get_post_meta( $expired_asset_id, self::STAGED_DIR_META, true );
			if ( '' !== $staged_dir ) {
				self::delete_directory_inside_root( $staged_dir, VRodos_Asset_Import_Session::user_staged_root( '', get_current_user_id() ) );
			}

			delete_post_meta( $expired_asset_id, self::SOURCE_PATH_META );
			delete_post_meta( $expired_asset_id, self::STAGED_DIR_META );
			delete_post_meta( $expired_asset_id, self::JOB_TOKEN_META );
			delete_post_meta( $expired_asset_id, self::CLEANUP_AFTER_META );

			if ( 'failed' !== $status ) {
				update_post_meta( $expired_asset_id, self::STATUS_META, 'failed' );
				update_post_meta( $expired_asset_id, self::ERROR_META, 'The staged model package expired before conversion completed. Upload the model package again.' );
			}
		}

		$private_root = VRodos_Storage_Manager::private_site_root( false );
		$roots = is_string( $private_root ) ? [ trailingslashit( $private_root ) . 'tmp/import', trailingslashit( $private_root ) . 'tmp/conversion' ] : [];
		$threshold = time() - ( 2 * DAY_IN_SECONDS );

		foreach ( $roots as $root ) {
			if ( ! is_dir( $root ) ) {
				continue;
			}
			$iterator = new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator( $root, RecursiveDirectoryIterator::SKIP_DOTS ),
				RecursiveIteratorIterator::CHILD_FIRST
			);
			foreach ( $iterator as $item ) {
				$path = $item->getPathname();
				if ( $item->isDir() && @filemtime( $path ) < $threshold ) {
					self::delete_directory_inside_root( $path, $root );
				}
			}
		}
	}

	public static function delete_directory_inside_root( string $dir, string $allowed_root ): void {
		$dir          = wp_normalize_path( $dir );
		$allowed_root = trailingslashit( wp_normalize_path( $allowed_root ) );
		if ( ! str_starts_with( trailingslashit( $dir ), $allowed_root ) || ! is_dir( $dir ) ) {
			return;
		}

		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::CHILD_FIRST
		);
		foreach ( $iterator as $item ) {
			$item->isDir() ? @rmdir( $item->getPathname() ) : wp_delete_file( $item->getPathname() );
		}
		@rmdir( $dir );
	}

	public static function retry_asset_import( int $asset_id ): array|WP_Error {
		$source_path = (string) get_post_meta( $asset_id, self::SOURCE_PATH_META, true );
		if ( '' === $source_path || ! is_file( $source_path ) ) {
			$message = 'The staged source file is no longer available. Upload the model package again.';
			self::mark_failed( $asset_id, $message );
			return new WP_Error( 'source_missing', $message );
		}
		update_post_meta( $asset_id, self::STATUS_META, 'pending' );
		delete_post_meta( $asset_id, self::ERROR_META );
		self::schedule_job( $asset_id );
		return self::status_for_asset( $asset_id );
	}
}
