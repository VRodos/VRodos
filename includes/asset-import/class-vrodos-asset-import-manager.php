<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Asset_Import_Manager {
	public const SETTINGS_OPTION_KEY = 'vrodos_asset_import_settings';
	public const SETTINGS_TAB_KEY    = 'vrodos_asset_import_settings';
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
	private const CONVERSION_TOOL_META = '_vrodos_asset_import_conversion_tool';
	private const CONVERSION_VER_META  = '_vrodos_asset_import_conversion_version';
	private const CLEANUP_AFTER_META   = '_vrodos_asset_import_cleanup_after';

	private const SUPPORTED_EXTENSIONS  = [ 'glb', 'zip', 'blend', 'fbx', 'obj', 'dae', 'gltf' ];
	private const CONVERSION_EXTENSIONS = [ 'blend', 'fbx', 'obj', 'dae', 'gltf' ];

	private const IMPORT_CRON_HOOK  = 'vrodos_asset_import_process_job';
	private const CLEANUP_CRON_HOOK = 'vrodos_asset_import_cleanup_staged_uploads';

	public function __construct() {
		add_action( 'admin_init', [ $this, 'register_settings' ] );
		add_filter( 'vrodos_settings_tabs', [ $this, 'register_settings_tab' ] );
		add_action( 'vrodos_render_settings_tab_' . self::SETTINGS_TAB_KEY, [ $this, 'render_settings_tab' ] );

		add_action( 'wp_ajax_vrodos_upload_model_chunk_action', [ $this, 'upload_model_chunk_callback' ] );
		add_action( 'wp_ajax_vrodos_asset_import_inspect_staged_upload', [ $this, 'inspect_staged_upload_callback' ] );
		add_action( 'wp_ajax_vrodos_asset_import_prepare_staged_upload', [ $this, 'prepare_staged_upload_callback' ] );
		add_action( 'wp_ajax_vrodos_asset_import_staged_upload_status', [ $this, 'staged_upload_status_callback' ] );
		add_action( 'wp_ajax_vrodos_asset_import_status', [ $this, 'status_callback' ] );
		add_action( 'wp_ajax_vrodos_asset_import_retry', [ $this, 'retry_callback' ] );
		add_action( 'wp_ajax_vrodos_asset_import_test_blender', [ $this, 'test_blender_callback' ] );
		add_action( self::IMPORT_CRON_HOOK, [ $this, 'process_scheduled_job' ], 10, 1 );
		add_action( self::CLEANUP_CRON_HOOK, [ $this, 'cleanup_staged_uploads' ] );

		if ( ! wp_next_scheduled( self::CLEANUP_CRON_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::CLEANUP_CRON_HOOK );
		}
	}

	public function register_settings(): void {
		register_setting(
			self::SETTINGS_OPTION_KEY,
			self::SETTINGS_OPTION_KEY,
			[
				'sanitize_callback' => [ $this, 'sanitize_settings' ],
			]
		);
	}

	public function sanitize_settings( $input ): array {
		$input = is_array( $input ) ? $input : [];
		$path  = isset( $input['blender_path'] ) ? (string) $input['blender_path'] : '';

		return [
			'blender_path' => self::sanitize_local_path( $path ),
		];
	}

	public function register_settings_tab( array $tabs ): array {
		$tabs[ self::SETTINGS_TAB_KEY ] = __( 'Asset Import' );
		return $tabs;
	}

	public function render_settings_tab(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			echo '<p>' . esc_html__( 'You are not allowed to manage asset import settings.' ) . '</p>';
			return;
		}

		$settings       = VRodos_Asset_Import_Blender_Converter::get_settings();
		$blender_path   = (string) ( $settings['blender_path'] ?? '' );
		$status         = VRodos_Asset_Import_Blender_Converter::get_configured_status();
		$status_message = (string) ( $status['label'] ?? 'Missing' ) . ': ' . (string) ( $status['message'] ?? '' );
		$status_color   = ! empty( $status['success'] ) ? '#16a34a' : '#b45309';
		$nonce          = wp_create_nonce( 'vrodos_asset_import_test_blender' );
		?>
		<h2><?php echo esc_html__( 'Asset Import' ); ?></h2>
		<p><?php echo esc_html__( 'Configure Blender for converting uploaded BLEND, FBX, OBJ, DAE, glTF, and ZIP model packages into runtime GLB assets.' ); ?></p>
		<form method="post" action="options.php">
			<?php settings_fields( self::SETTINGS_OPTION_KEY ); ?>
			<table class="form-table" role="presentation">
				<tbody>
					<tr>
						<th scope="row"><label for="vrodos-asset-import-blender-path"><?php echo esc_html__( 'Blender executable' ); ?></label></th>
						<td>
							<input type="text" class="regular-text" id="vrodos-asset-import-blender-path" name="<?php echo esc_attr( self::SETTINGS_OPTION_KEY ); ?>[blender_path]" value="<?php echo esc_attr( $blender_path ); ?>" placeholder="C:\Program Files\Blender Foundation\Blender 4.x\blender.exe" />
							<button type="button" class="button" id="vrodos-asset-import-test-blender"><?php echo esc_html__( 'Test Blender' ); ?></button>
							<p class="description"><?php echo esc_html__( 'Required only for converting non-GLB uploads. Direct GLB uploads do not use Blender.' ); ?></p>
							<p id="vrodos-asset-import-blender-status" style="font-weight:700;color:<?php echo esc_attr( $status_color ); ?>;"><?php echo esc_html( $status_message ); ?></p>
						</td>
					</tr>
				</tbody>
			</table>
			<?php submit_button(); ?>
		</form>
		<script>
		(() => {
			const button = document.getElementById('vrodos-asset-import-test-blender');
			const input = document.getElementById('vrodos-asset-import-blender-path');
			const status = document.getElementById('vrodos-asset-import-blender-status');
			if (!button || !input || !status) {
				return;
			}
			button.addEventListener('click', async () => {
				status.textContent = 'Testing Blender...';
				status.style.color = '#475569';
				const body = new URLSearchParams();
				body.set('action', 'vrodos_asset_import_test_blender');
				body.set('nonce', <?php echo wp_json_encode( $nonce ); ?>);
				body.set('blender_path', input.value || '');
				try {
					const response = await fetch(window.ajaxurl || '<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>', {
						method: 'POST',
						headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
						body,
						credentials: 'same-origin'
					});
					const payload = await response.json();
					const data = payload && payload.data ? payload.data : {};
					status.textContent = (data.label || (payload.success ? 'Ready' : 'Failed')) + ': ' + (data.message || '');
					status.style.color = payload.success ? '#16a34a' : '#b45309';
				} catch (error) {
					status.textContent = 'Failed: ' + (error && error.message ? error.message : 'Could not test Blender.');
					status.style.color = '#b45309';
				}
			});
		})();
		</script>
		<?php
	}

	public static function supported_extensions(): array {
		return self::SUPPORTED_EXTENSIONS;
	}

	public static function is_supported_extension( string $extension ): bool {
		return in_array( strtolower( ltrim( $extension, '.' ) ), self::SUPPORTED_EXTENSIONS, true );
	}

	public static function is_conversion_extension( string $extension ): bool {
		return in_array( strtolower( ltrim( $extension, '.' ) ), self::CONVERSION_EXTENSIONS, true );
	}

	public function upload_model_chunk_callback(): void {
		if ( ! is_user_logged_in() ) {
			wp_send_json_error( 'You must be logged in to upload model assets.', 403 );
		}

		check_ajax_referer( 'post_nonce', 'nonce' );

		$upload_id   = isset( $_POST['upload_id'] ) ? sanitize_key( (string) wp_unslash( $_POST['upload_id'] ) ) : '';
		$chunk_index = isset( $_POST['chunk_index'] ) ? absint( $_POST['chunk_index'] ) : 0;
		$total       = isset( $_POST['total_chunks'] ) ? absint( $_POST['total_chunks'] ) : 0;
		$file_name   = isset( $_POST['file_name'] ) ? sanitize_file_name( (string) wp_unslash( $_POST['file_name'] ) ) : '';
		$project_id  = isset( $_POST['project_id'] ) ? absint( $_POST['project_id'] ) : 0;
		$extension   = strtolower( pathinfo( $file_name, PATHINFO_EXTENSION ) );

		if ( '' === $upload_id || $total <= 0 || $chunk_index >= $total || '' === $file_name ) {
			wp_send_json_error( 'Invalid model upload metadata.', 400 );
		}

		if ( ! self::is_supported_extension( $extension ) ) {
			wp_send_json_error( 'Supported model uploads are GLB, ZIP, BLEND, FBX, OBJ, DAE, and glTF files.', 400 );
		}

		if ( empty( $_FILES['chunk'] ) || (int) ( $_FILES['chunk']['error'] ?? UPLOAD_ERR_NO_FILE ) !== UPLOAD_ERR_OK ) {
			wp_send_json_error( 'The model upload chunk was not received.', 400 );
		}

		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) ) {
			wp_send_json_error( $upload_dir['error'], 500 );
		}

		$user_id     = get_current_user_id();
		$session_dir = self::staged_session_dir( (string) $upload_dir['basedir'], $user_id, $upload_id );
		if ( 0 === $chunk_index && is_dir( $session_dir ) ) {
			self::delete_directory_inside_root( $session_dir, self::user_staged_root( (string) $upload_dir['basedir'], $user_id ) );
		}

		if ( ! wp_mkdir_p( $session_dir ) ) {
			wp_send_json_error( 'Could not create the model upload directory.', 500 );
		}

		$part_path = trailingslashit( $session_dir ) . 'chunk-' . $chunk_index . '.part';
		if ( ! move_uploaded_file( (string) $_FILES['chunk']['tmp_name'], $part_path ) ) {
			wp_send_json_error( 'Could not store the model upload chunk.', 500 );
		}

		$complete = true;
		for ( $i = 0; $i < $total; $i++ ) {
			if ( ! is_file( trailingslashit( $session_dir ) . 'chunk-' . $i . '.part' ) ) {
				$complete = false;
				break;
			}
		}

		if ( $complete ) {
			$final_path = trailingslashit( $session_dir ) . 'upload.' . $extension;
			$out        = fopen( $final_path, 'wb' );
			if ( ! $out ) {
				wp_send_json_error( 'Could not assemble the model upload.', 500 );
			}

			for ( $i = 0; $i < $total; $i++ ) {
				$part = trailingslashit( $session_dir ) . 'chunk-' . $i . '.part';
				$in   = fopen( $part, 'rb' );
				if ( ! $in ) {
					fclose( $out );
					wp_send_json_error( 'Could not read a model upload chunk.', 500 );
				}
				stream_copy_to_stream( $in, $out );
				fclose( $in );
				wp_delete_file( $part );
			}
			fclose( $out );

			file_put_contents(
				trailingslashit( $session_dir ) . 'manifest.json',
				wp_json_encode(
					[
						'file_name'  => $file_name,
						'extension'  => $extension,
						'project_id' => $project_id,
						'user_id'    => $user_id,
						'created'    => time(),
						'size'       => filesize( $final_path ),
					]
				)
			);
		}

		wp_send_json_success(
			[
				'complete'  => $complete,
				'token'     => $upload_id,
				'extension' => $extension,
				'received'  => $chunk_index + 1,
				'total'     => $total,
			]
		);
	}

	public function inspect_staged_upload_callback(): void {
		if ( ! is_user_logged_in() ) {
			wp_send_json_error(
				[
					'message'  => 'You must be logged in to inspect model packages.',
					'can_save' => false,
				],
				403
			);
		}

		check_ajax_referer( 'post_nonce', 'nonce' );

		$token  = isset( $_POST['token'] ) ? sanitize_key( (string) wp_unslash( $_POST['token'] ) ) : '';
		$result = self::inspect_staged_upload( $token );

		if ( empty( $result['success'] ) || empty( $result['can_save'] ) ) {
			wp_send_json_error( $result );
		}

		wp_send_json_success( $result );
	}

	public function prepare_staged_upload_callback(): void {
		if ( ! is_user_logged_in() ) {
			wp_send_json_error(
				[
					'message'  => 'You must be logged in to prepare model packages.',
					'can_save' => false,
				],
				403
			);
		}

		check_ajax_referer( 'post_nonce', 'nonce' );

		$token  = isset( $_POST['token'] ) ? sanitize_key( (string) wp_unslash( $_POST['token'] ) ) : '';
		$result = self::prepare_staged_upload( $token );

		if ( empty( $result['success'] ) || empty( $result['can_save'] ) ) {
			wp_send_json_error( $result );
		}

		wp_send_json_success( $result );
	}

	public function staged_upload_status_callback(): void {
		if ( ! is_user_logged_in() ) {
			wp_send_json_error(
				[
					'message'  => 'You must be logged in to inspect model package status.',
					'can_save' => false,
				],
				403
			);
		}

		check_ajax_referer( 'post_nonce', 'nonce' );

		$token  = isset( $_POST['token'] ) ? sanitize_key( (string) wp_unslash( $_POST['token'] ) ) : '';
		$result = self::staged_upload_status( $token );
		if ( empty( $result['success'] ) ) {
			wp_send_json_error( $result );
		}

		wp_send_json_success( $result );
	}

	public function status_callback(): void {
		if ( ! is_user_logged_in() ) {
			wp_send_json_error( 'You must be logged in to inspect model import status.', 403 );
		}

		check_ajax_referer( 'post_nonce', 'nonce' );

		$asset_id = isset( $_POST['asset_id'] ) ? absint( $_POST['asset_id'] ) : 0;
		if ( ! self::current_user_can_edit_asset( $asset_id ) ) {
			wp_send_json_error( 'You are not allowed to inspect this asset.', 403 );
		}

		wp_send_json_success( self::status_for_asset( $asset_id ) );
	}

	public function retry_callback(): void {
		if ( ! is_user_logged_in() ) {
			wp_send_json_error( 'You must be logged in to retry model import.', 403 );
		}

		check_ajax_referer( 'post_nonce', 'nonce' );

		$asset_id = isset( $_POST['asset_id'] ) ? absint( $_POST['asset_id'] ) : 0;
		if ( ! self::current_user_can_edit_asset( $asset_id ) ) {
			wp_send_json_error( 'You are not allowed to retry this asset import.', 403 );
		}

		$source_path = (string) get_post_meta( $asset_id, self::SOURCE_PATH_META, true );
		if ( '' === $source_path || ! is_file( $source_path ) ) {
			self::mark_failed( $asset_id, 'The staged source file is no longer available. Upload the model package again.' );
			wp_send_json_error( 'The staged source file is no longer available. Upload the model package again.', 410 );
		}

		update_post_meta( $asset_id, self::STATUS_META, 'pending' );
		delete_post_meta( $asset_id, self::ERROR_META );
		self::schedule_job( $asset_id );

		wp_send_json_success( self::status_for_asset( $asset_id ) );
	}

	public function test_blender_callback(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( [ 'label' => 'Forbidden', 'message' => 'You are not allowed to test Blender.' ], 403 );
		}

		check_ajax_referer( 'vrodos_asset_import_test_blender', 'nonce' );

		$path   = isset( $_POST['blender_path'] ) ? self::sanitize_local_path( wp_unslash( (string) $_POST['blender_path'] ) ) : '';
		$result = VRodos_Asset_Import_Blender_Converter::test_path( $path );

		if ( empty( $result['success'] ) ) {
			wp_send_json_error( $result, 400 );
		}

		wp_send_json_success( $result );
	}

	public function process_scheduled_job( int $asset_id ): void {
		self::process_asset_import_job( $asset_id );
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
		$session_dir = self::staged_session_dir( (string) $upload_dir['basedir'], $user_id, $token );
		$session_url = self::staged_session_url( (string) $upload_dir['baseurl'], $user_id, $token );
		$manifest    = self::read_staged_manifest( $session_dir );
		if ( is_wp_error( $manifest ) ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => $manifest->get_error_message(),
			];
		}

		if ( (int) ( $manifest['user_id'] ?? 0 ) !== $user_id ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'The staged model upload belongs to a different user.',
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

		$prepared_path = self::prepared_glb_path_from_manifest( $session_dir, $manifest );
		if ( '' !== $prepared_path && is_file( $prepared_path ) ) {
			$previous_glb_id = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
			$attachment_id   = self::save_glb_file_for_asset( $prepared_path, self::target_glb_name( $asset_id, $asset_cat_id ), $asset_id );
			if ( is_wp_error( $attachment_id ) ) {
				self::mark_failed( $asset_id, $attachment_id->get_error_message() );
				return [
					'success' => false,
					'status'  => 'failed',
					'error'   => $attachment_id->get_error_message(),
				];
			}

			update_post_meta( $asset_id, 'vrodos_asset3d_glb', (int) $attachment_id );
			if ( ! empty( $manifest['prepared_conversion_tool'] ) ) {
				update_post_meta( $asset_id, self::CONVERSION_TOOL_META, sanitize_key( (string) $manifest['prepared_conversion_tool'] ) );
				update_post_meta( $asset_id, self::CONVERSION_VER_META, self::CONVERSION_VERSION );
			} else {
				delete_post_meta( $asset_id, self::CONVERSION_TOOL_META );
				delete_post_meta( $asset_id, self::CONVERSION_VER_META );
			}
			self::mark_ready(
				$asset_id,
				(int) $attachment_id,
				(string) ( $manifest['prepared_diagnostic'] ?? 'Prepared ZIP model package saved.' ),
				(string) ( $manifest['selected_entry'] ?? ( $manifest['file_name'] ?? basename( $prepared_path ) ) )
			);
			self::delete_replaced_glb_attachment( $previous_glb_id, (int) $attachment_id );
			self::maybe_generate_blender_thumbnail( $asset_id, (int) $attachment_id, $project_id );
			self::delete_directory_inside_root( $session_dir, self::user_staged_root( (string) $upload_dir['basedir'], $user_id ) );
			self::clear_asset_browser_cache();

			return [
				'success'       => true,
				'status'        => 'ready',
				'attachment_id' => (int) $attachment_id,
			];
		}

		if ( 'glb' === $extension ) {
			$previous_glb_id = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
			$attachment_id   = self::save_glb_file_for_asset( $source_path, self::target_glb_name( $asset_id, $asset_cat_id ), $asset_id );
			if ( is_wp_error( $attachment_id ) ) {
				self::mark_failed( $asset_id, $attachment_id->get_error_message() );
				return [
					'success' => false,
					'status'  => 'failed',
					'error'   => $attachment_id->get_error_message(),
				];
			}

			update_post_meta( $asset_id, 'vrodos_asset3d_glb', (int) $attachment_id );
			delete_post_meta( $asset_id, self::CONVERSION_TOOL_META );
			delete_post_meta( $asset_id, self::CONVERSION_VER_META );
			self::mark_ready( $asset_id, (int) $attachment_id, 'Direct GLB upload saved.', (string) ( $manifest['file_name'] ?? 'upload.glb' ) );
			self::delete_replaced_glb_attachment( $previous_glb_id, (int) $attachment_id );
			self::delete_directory_inside_root( $session_dir, self::user_staged_root( (string) $upload_dir['basedir'], $user_id ) );
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
		$session_dir = self::staged_session_dir( (string) $upload_dir['basedir'], $user_id, $token );
		if ( ! wp_mkdir_p( $session_dir ) ) {
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'Could not create the model upload staging directory.',
			];
		}

		$source_path = trailingslashit( $session_dir ) . 'upload.' . $extension;
		if ( ! move_uploaded_file( (string) ( $file['tmp_name'] ?? '' ), $source_path ) ) {
			self::delete_directory_inside_root( $session_dir, self::user_staged_root( (string) $upload_dir['basedir'], $user_id ) );
			return [
				'success' => false,
				'status'  => 'failed',
				'error'   => 'Could not stage the model upload.',
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

	private static function prepare_staged_upload( string $token ): array {
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
		$session_dir = self::staged_session_dir( (string) $upload_dir['basedir'], $user_id, $token );
		$session_url = self::staged_session_url( (string) $upload_dir['baseurl'], $user_id, $token );
		$manifest    = self::read_staged_manifest( $session_dir );
		if ( is_wp_error( $manifest ) ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => $manifest->get_error_message(),
			];
		}

		if ( (int) ( $manifest['user_id'] ?? 0 ) !== $user_id ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => 'The staged model upload belongs to a different user.',
			];
		}

		$extension   = strtolower( (string) ( $manifest['extension'] ?? '' ) );
		$source_path = trailingslashit( $session_dir ) . 'upload.' . $extension;
		if ( 'zip' !== $extension || ! is_file( $source_path ) ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => 'Only staged ZIP packages can be prepared before asset save.',
			];
		}

		$manifest = self::update_staged_prepare_progress( $session_dir, $manifest, 5, 'Inspecting ZIP package...', 'inspecting' );

		$existing_prepared_path = self::prepared_glb_path_from_manifest( $session_dir, $manifest );
		if ( '' !== $existing_prepared_path && is_file( $existing_prepared_path ) ) {
			$manifest = self::update_staged_prepare_progress( $session_dir, $manifest, 100, 'ZIP package is already prepared.', 'ready' );
			return [
				'success'          => true,
				'can_save'         => true,
				'message'          => 'ZIP package is already prepared. Saving will attach the generated GLB.',
				'selected'         => (string) ( $manifest['selected_entry'] ?? '' ),
				'diagnostic'       => (string) ( $manifest['prepared_diagnostic'] ?? '' ),
				'requires_blender' => ! empty( $manifest['prepared_conversion_tool'] ),
				'prepared_url'     => self::prepared_glb_url_from_manifest( $session_url, $manifest ),
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
		$manifest      = self::update_staged_prepare_progress( $session_dir, $manifest, 12, 'ZIP package inspected.', 'inspecting' );

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
				$manifest = self::update_staged_prepare_progress( $session_dir, $manifest, 15, 'Blender is repacking GLB external resources...', 'converting' );
				$progress_callback = static function ( int $percent, string $message ) use ( $session_dir, &$manifest ): void {
					$manifest = self::update_staged_prepare_progress( $session_dir, $manifest, $percent, $message, 'converting' );
				};
				$conversion = self::convert_zip_candidate_to_glb( $selected_glb, $progress_callback );
				$cleanup_paths = array_merge( $cleanup_paths, (array) ( $conversion['cleanup_paths'] ?? [] ) );
				if ( empty( $conversion['success'] ) ) {
					$manifest = self::update_staged_prepare_progress( $session_dir, $manifest, (int) ( $manifest['prepare_percent'] ?? 0 ), (string) ( $conversion['message'] ?? 'Blender GLB repack failed.' ), 'failed' );
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
					$manifest = self::update_staged_prepare_progress( $session_dir, $manifest, (int) ( $manifest['prepare_percent'] ?? 0 ), 'Blender repacked the selected GLB but the generated GLB could not be staged for asset save.', 'failed' );
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
				self::write_staged_manifest( $session_dir, $manifest );
				VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );

				return [
					'success'          => true,
					'can_save'         => true,
					'message'          => 'ZIP package is ready. Selected GLB repacked with external resources: ' . (string) $manifest['selected_entry'],
					'selected'         => (string) $manifest['selected_entry'],
					'diagnostic'       => (string) $manifest['prepared_diagnostic'],
					'requires_blender' => true,
					'prepared_url'     => self::prepared_glb_url_from_manifest( $session_url, $manifest ),
				];
			}

			$manifest = self::update_staged_prepare_progress( $session_dir, $manifest, 25, 'Extracting selected GLB...', 'preparing' );
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
			self::write_staged_manifest( $session_dir, $manifest );
			VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );

			return [
				'success'          => true,
				'can_save'         => true,
				'message'          => 'ZIP package is ready. Selected GLB extracted: ' . (string) $manifest['selected_entry'],
				'selected'         => (string) $manifest['selected_entry'],
				'diagnostic'       => $diagnostic,
				'requires_blender' => false,
				'prepared_url'     => self::prepared_glb_url_from_manifest( $session_url, $manifest ),
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

		$manifest = self::update_staged_prepare_progress( $session_dir, $manifest, 15, 'Blender is converting the selected source...', 'converting' );
		$progress_callback = static function ( int $percent, string $message ) use ( $session_dir, &$manifest ): void {
			$manifest = self::update_staged_prepare_progress( $session_dir, $manifest, $percent, $message, 'converting' );
		};
		$conversion = self::convert_zip_candidate_to_glb( (array) $selection['candidate'], $progress_callback );
		$cleanup_paths = array_merge( $cleanup_paths, (array) ( $conversion['cleanup_paths'] ?? [] ) );
		if ( empty( $conversion['success'] ) ) {
			$manifest = self::update_staged_prepare_progress( $session_dir, $manifest, (int) ( $manifest['prepare_percent'] ?? 0 ), (string) ( $conversion['message'] ?? 'Blender conversion failed.' ), 'failed' );
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
		self::write_staged_manifest( $session_dir, $manifest );
		VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );

		return [
			'success'          => true,
			'can_save'         => true,
			'message'          => 'ZIP package converted to GLB and is ready to save.',
			'selected'         => (string) $manifest['selected_entry'],
			'diagnostic'       => (string) $manifest['prepared_diagnostic'],
			'requires_blender' => true,
			'prepared_url'     => self::prepared_glb_url_from_manifest( $session_url, $manifest ),
		];
	}

	private static function inspect_staged_upload( string $token ): array {
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
		$session_dir = self::staged_session_dir( (string) $upload_dir['basedir'], $user_id, $token );
		$manifest    = self::read_staged_manifest( $session_dir );
		if ( is_wp_error( $manifest ) ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => $manifest->get_error_message(),
			];
		}

		if ( (int) ( $manifest['user_id'] ?? 0 ) !== $user_id ) {
			return [
				'success'  => false,
				'can_save' => false,
				'message'  => 'The staged model upload belongs to a different user.',
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

	private static function staged_upload_status( string $token ): array {
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
		$session_dir = self::staged_session_dir( (string) $upload_dir['basedir'], $user_id, $token );
		$session_url = self::staged_session_url( (string) $upload_dir['baseurl'], $user_id, $token );
		$manifest    = self::read_staged_manifest( $session_dir );
		if ( is_wp_error( $manifest ) ) {
			return [
				'success' => false,
				'message' => $manifest->get_error_message(),
			];
		}

		if ( (int) ( $manifest['user_id'] ?? 0 ) !== $user_id ) {
			return [
				'success' => false,
				'message' => 'The staged model upload belongs to a different user.',
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
			'can_save'       => ! empty( $manifest['prepared_glb'] ) && is_file( self::prepared_glb_path_from_manifest( $session_dir, $manifest ) ),
			'prepared_url'   => self::prepared_glb_url_from_manifest( $session_url, $manifest ),
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

		$previous_glb_id = get_post_meta( $asset_id, 'vrodos_asset3d_glb', true );
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
				return self::fail_job(
					$asset_id,
					(string) ( $conversion['message'] ?? 'Blender conversion failed.' ),
					trim( (string) ( $conversion['stderr'] ?? '' ) . ' ' . (string) ( $conversion['stdout'] ?? '' ) )
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

		update_post_meta( $asset_id, 'vrodos_asset3d_glb', (int) $attachment_id );
		update_post_meta( $asset_id, self::SELECTED_ENTRY_META, $selected_entry );
		if ( '' !== $converted_from ) {
			update_post_meta( $asset_id, self::CONVERSION_TOOL_META, 'blender' );
			update_post_meta( $asset_id, self::CONVERSION_VER_META, self::CONVERSION_VERSION );
		} else {
			delete_post_meta( $asset_id, self::CONVERSION_TOOL_META );
			delete_post_meta( $asset_id, self::CONVERSION_VER_META );
		}

		self::mark_ready( $asset_id, (int) $attachment_id, $diagnostic, $selected_entry );
		self::delete_replaced_glb_attachment( $previous_glb_id, (int) $attachment_id );
		self::maybe_generate_blender_thumbnail( $asset_id, (int) $attachment_id, $project_id );
		self::clear_asset_browser_cache();
		VRodos_Asset_Import_Zip_Package::cleanup_paths( $cleanup_paths );

		if ( '' !== $staged_dir ) {
			$upload_dir = wp_upload_dir();
			if ( empty( $upload_dir['error'] ) ) {
				self::delete_directory_inside_root( $staged_dir, trailingslashit( (string) $upload_dir['basedir'] ) . 'vrodos-model-imports' );
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

		$previous_request_post_id = $_REQUEST['post_id'] ?? null;
		$_REQUEST['post_id']     = $asset_id;
		add_filter( 'upload_dir', [ 'VRodos_Upload_Manager', 'upload_dir_for_scenes_or_assets' ] );
		add_filter( 'intermediate_image_sizes_advanced', [ 'VRodos_Upload_Manager', 'remove_allthumbs_sizes' ], 10, 2 );
		$target_upload_dir = wp_upload_dir();
		remove_filter( 'upload_dir', [ 'VRodos_Upload_Manager', 'upload_dir_for_scenes_or_assets' ] );
		remove_filter( 'intermediate_image_sizes_advanced', [ 'VRodos_Upload_Manager', 'remove_allthumbs_sizes' ], 10, 2 );
		if ( null === $previous_request_post_id ) {
			unset( $_REQUEST['post_id'] );
		} else {
			$_REQUEST['post_id'] = $previous_request_post_id;
		}

		if ( ! empty( $target_upload_dir['error'] ) || ! wp_mkdir_p( $target_upload_dir['path'] ) ) {
			return new WP_Error( 'upload_dir_failed', 'Could not prepare final model upload directory.' );
		}

		$filename    = wp_unique_filename( $target_upload_dir['path'], sanitize_file_name( $target_name ) );
		$destination = trailingslashit( $target_upload_dir['path'] ) . $filename;
		if ( ! @copy( $source_path, $destination ) ) {
			return new WP_Error( 'copy_failed', 'Could not save the generated GLB file.' );
		}

		$file_return = [
			'file' => $destination,
			'url'  => trailingslashit( $target_upload_dir['url'] ) . $filename,
			'type' => 'model/gltf-binary',
		];

		$attachment_id = VRodos_Upload_Manager::insert_attachment_post( $file_return, $asset_id );
		if ( ! $attachment_id ) {
			wp_delete_file( $destination );
			return new WP_Error( 'attachment_failed', 'Could not create the GLB attachment.' );
		}

		return (int) $attachment_id;
	}

	private static function maybe_generate_blender_thumbnail( int $asset_id, int $glb_attachment_id, int $project_id ): void {
		if ( $project_id <= 0 || get_post_meta( $asset_id, 'vrodos_asset3d_screenimage', true ) ) {
			return;
		}

		$glb_path = get_attached_file( $glb_attachment_id );
		if ( ! is_string( $glb_path ) || '' === $glb_path || ! is_file( $glb_path ) ) {
			return;
		}

		$upload_dir = wp_upload_dir();
		$temp_root  = empty( $upload_dir['error'] ) && ! empty( $upload_dir['basedir'] ) ? (string) $upload_dir['basedir'] : get_temp_dir();
		$temp_png   = trailingslashit( $temp_root ) . 'vrodos_asset_import_thumb_' . wp_generate_password( 12, false, false ) . '.png';
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

	private static function mark_ready( int $asset_id, int $attachment_id, string $diagnostic = '', string $selected_entry = '' ): void {
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

	private static function read_staged_manifest( string $session_dir ): array|WP_Error {
		$manifest_path = trailingslashit( $session_dir ) . 'manifest.json';
		if ( ! is_file( $manifest_path ) ) {
			return new WP_Error( 'manifest_missing', 'The staged model upload manifest is missing.' );
		}

		$manifest = json_decode( (string) file_get_contents( $manifest_path ), true );
		if ( ! is_array( $manifest ) ) {
			return new WP_Error( 'manifest_invalid', 'The staged model upload manifest is invalid.' );
		}

		return $manifest;
	}

	private static function write_staged_manifest( string $session_dir, array $manifest ): void {
		file_put_contents(
			trailingslashit( $session_dir ) . 'manifest.json',
			wp_json_encode( $manifest )
		);
	}

	private static function update_staged_prepare_progress( string $session_dir, array $fallback_manifest, int $percent, string $message, string $status ): array {
		$current_manifest = self::read_staged_manifest( $session_dir );
		$manifest         = is_wp_error( $current_manifest ) ? $fallback_manifest : $current_manifest;
		$manifest['prepare_status']     = sanitize_key( $status );
		$manifest['prepare_percent']    = max( 0, min( 100, $percent ) );
		$manifest['prepare_message']    = sanitize_text_field( $message );
		$manifest['prepare_updated_at'] = time();
		self::write_staged_manifest( $session_dir, $manifest );

		return $manifest;
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

	private static function prepared_glb_path_from_manifest( string $session_dir, array $manifest ): string {
		$prepared_glb = isset( $manifest['prepared_glb'] ) ? sanitize_file_name( (string) $manifest['prepared_glb'] ) : '';
		if ( '' === $prepared_glb ) {
			return '';
		}

		$path = trailingslashit( $session_dir ) . $prepared_glb;
		return is_file( $path ) ? $path : '';
	}

	private static function prepared_glb_url_from_manifest( string $session_url, array $manifest ): string {
		$prepared_glb = isset( $manifest['prepared_glb'] ) ? sanitize_file_name( (string) $manifest['prepared_glb'] ) : '';
		if ( '' === $prepared_glb ) {
			return '';
		}

		return esc_url_raw( trailingslashit( $session_url ) . $prepared_glb . '?v=' . rawurlencode( (string) ( $manifest['prepared_at'] ?? time() ) ) );
	}

	private static function current_user_can_edit_asset( int $asset_id ): bool {
		if ( $asset_id <= 0 || ! is_user_logged_in() ) {
			return false;
		}

		if ( current_user_can( 'manage_options' ) || current_user_can( 'edit_post', $asset_id ) ) {
			return true;
		}

		return (int) get_post_field( 'post_author', $asset_id ) === get_current_user_id();
	}

	private static function sanitize_local_path( string $path ): string {
		$path = wp_strip_all_tags( $path, true );
		$path = str_replace( [ "\0", "\r", "\n" ], '', $path );
		$path = preg_replace( '/[\x00-\x1F\x7F]/', '', $path );

		return trim( is_string( $path ) ? $path : '' );
	}

	private static function delete_replaced_glb_attachment( $previous_glb_id, int $new_glb_id ): void {
		if ( is_numeric( $previous_glb_id ) && (int) $previous_glb_id > 0 && (int) $previous_glb_id !== $new_glb_id ) {
			wp_delete_attachment( (int) $previous_glb_id, true );
		}
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

	private static function user_staged_root( string $upload_basedir, int $user_id ): string {
		return trailingslashit( $upload_basedir ) . 'vrodos-model-imports/user-' . $user_id;
	}

	private static function staged_session_dir( string $upload_basedir, int $user_id, string $token ): string {
		return trailingslashit( self::user_staged_root( $upload_basedir, $user_id ) ) . sanitize_key( $token );
	}

	private static function staged_session_url( string $upload_baseurl, int $user_id, string $token ): string {
		return trailingslashit( $upload_baseurl ) . 'vrodos-model-imports/user-' . $user_id . '/' . sanitize_key( $token );
	}

	public function cleanup_staged_uploads(): void {
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
				self::delete_directory_inside_root( $staged_dir, trailingslashit( (string) $upload_dir['basedir'] ) . 'vrodos-model-imports' );
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

		$roots = [
			trailingslashit( (string) $upload_dir['basedir'] ) . 'vrodos-model-imports',
			trailingslashit( (string) $upload_dir['basedir'] ) . 'vrodos-asset-import-temp',
		];
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

	private static function delete_directory_inside_root( string $dir, string $allowed_root ): void {
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
}
