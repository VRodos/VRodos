<?php

require_once __DIR__ . '/class-vrodos-asset-import-session.php';
require_once __DIR__ . '/class-vrodos-asset-import-execution.php';

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once dirname( __DIR__ ) . '/class-vrodos-asset-origin.php';
require_once __DIR__ . '/class-vrodos-asset-import-glb-normalizer.php';

class VRodos_Asset_Import_Manager {
	public const SETTINGS_OPTION_KEY = 'vrodos_asset_import_settings';
	public const SETTINGS_TAB_KEY    = 'vrodos_asset_import_settings';
	public const CONVERSION_VERSION  = VRodos_Asset_Import_Execution::CONVERSION_VERSION;

	private const IMPORT_CRON_HOOK  = VRodos_Asset_Import_Execution::IMPORT_CRON_HOOK;
	private const CLEANUP_CRON_HOOK = 'vrodos_asset_import_cleanup_staged_uploads';
	private const CHUNK_BYTES       = 8 * 1024 * 1024;
	private const MAX_UPLOAD_BYTES  = 2 * 1024 * 1024 * 1024;

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
		add_action( 'before_delete_post', [ $this, 'handle_asset_delete' ], 10, 2 );

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
		return VRodos_Asset_Import_Execution::supported_extensions();
	}
	public static function is_supported_extension( string $extension ): bool {
		return VRodos_Asset_Import_Execution::is_supported_extension( $extension );
	}
	public static function is_conversion_extension( string $extension ): bool {
		return VRodos_Asset_Import_Execution::is_conversion_extension( $extension );
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
		$max_bytes   = self::max_upload_bytes();

		if ( '' === $upload_id || $total <= 0 || $chunk_index >= $total || '' === $file_name ) {
			wp_send_json_error( 'Invalid model upload metadata.', 400 );
		}

		if ( $project_id <= 0 || 'vrodos_game' !== get_post_type( $project_id ) || ! current_user_can( 'edit_post', $project_id ) ) {
			wp_send_json_error( 'You are not allowed to upload assets to this project.', 403 );
		}

		if ( $total > (int) ceil( $max_bytes / self::CHUNK_BYTES ) ) {
			wp_send_json_error( 'The model upload exceeds the configured size limit.', 413 );
		}

		if ( ! self::is_supported_extension( $extension ) ) {
			wp_send_json_error( 'Supported model uploads are GLB, ZIP, BLEND, FBX, OBJ, DAE, and glTF files.', 400 );
		}

		if ( empty( $_FILES['chunk'] ) || (int) ( $_FILES['chunk']['error'] ?? UPLOAD_ERR_NO_FILE ) !== UPLOAD_ERR_OK ) {
			wp_send_json_error( 'The model upload chunk was not received.', 400 );
		}

		$chunk_size = (int) ( $_FILES['chunk']['size'] ?? 0 );
		if ( $chunk_size <= 0 || $chunk_size > self::CHUNK_BYTES ) {
			wp_send_json_error( 'The model upload chunk has an invalid size.', 413 );
		}

		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) ) {
			wp_send_json_error( $upload_dir['error'], 500 );
		}

		$user_id     = get_current_user_id();
		$session_dir = VRodos_Asset_Import_Session::staged_session_dir( (string) $upload_dir['basedir'], $user_id, $upload_id );
		if ( 0 === $chunk_index && is_dir( $session_dir ) ) {
			VRodos_Asset_Import_Execution::delete_directory_inside_root( $session_dir, VRodos_Asset_Import_Session::user_staged_root( (string) $upload_dir['basedir'], $user_id ) );
		}

		if ( ! wp_mkdir_p( $session_dir ) ) {
			wp_send_json_error( 'Could not create the model upload directory.', 500 );
		}

		$state_path = trailingslashit( $session_dir ) . 'upload-state.json';
		$state      = is_file( $state_path ) ? json_decode( (string) file_get_contents( $state_path ), true ) : null;
		if ( ! is_array( $state ) ) {
			$state = [
				'file_name'    => $file_name,
				'project_id'   => $project_id,
				'user_id'      => $user_id,
				'total_chunks' => $total,
			];
			if ( false === file_put_contents( $state_path, wp_json_encode( $state ), LOCK_EX ) ) {
				wp_send_json_error( 'Could not create the model upload manifest.', 500 );
			}
		}

		if (
			(string) ( $state['file_name'] ?? '' ) !== $file_name
			|| (int) ( $state['project_id'] ?? 0 ) !== $project_id
			|| (int) ( $state['user_id'] ?? 0 ) !== $user_id
			|| (int) ( $state['total_chunks'] ?? 0 ) !== $total
		) {
			wp_send_json_error( 'The model upload manifest does not match this chunk.', 409 );
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
			$assembled_size = (int) filesize( $final_path );
			if ( $assembled_size <= 0 || $assembled_size > $max_bytes ) {
				wp_delete_file( $final_path );
				wp_send_json_error( 'The assembled model upload exceeds the configured size limit.', 413 );
			}
			if ( ! VRodos_Asset_Import_Execution::valid_model_signature( $final_path, $extension ) ) {
				wp_delete_file( $final_path );
				wp_send_json_error( 'The assembled file content does not match its model type.', 415 );
			}

			if ( false === file_put_contents(
				trailingslashit( $session_dir ) . 'manifest.json',
				wp_json_encode(
					[
						'file_name'  => $file_name,
						'extension'  => $extension,
						'project_id' => $project_id,
						'user_id'    => $user_id,
						'created'    => time(),
						'size'       => $assembled_size,
						'total_chunks' => $total,
					]
				),
				LOCK_EX
			) ) {
				wp_send_json_error( 'Could not finalize the model upload manifest.', 500 );
			}
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
		$result = VRodos_Asset_Import_Execution::inspect_staged_upload( $token );

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
		$result = VRodos_Asset_Import_Execution::prepare_staged_upload( $token );

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
		$result = VRodos_Asset_Import_Execution::staged_upload_status( $token );
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
		if ( ! VRodos_Asset_Import_Execution::current_user_can_edit_asset( $asset_id ) ) {
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
		if ( ! VRodos_Asset_Import_Execution::current_user_can_edit_asset( $asset_id ) ) {
			wp_send_json_error( 'You are not allowed to retry this asset import.', 403 );
		}

		$result = VRodos_Asset_Import_Execution::retry_asset_import( $asset_id );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( $result->get_error_message(), 410 );
		}
		wp_send_json_success( $result );
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

	public function handle_asset_delete( int $post_id, WP_Post $post ): void {
		VRodos_Asset_Import_Execution::handle_asset_delete( $post_id, $post );
	}
	public static function consume_staged_upload( string $token, int $asset_id, int $project_id, int $asset_cat_id ): array {
		return VRodos_Asset_Import_Execution::consume_staged_upload( $token, $asset_id, $project_id, $asset_cat_id );
	}
	public static function consume_uploaded_file_array( array $file, int $asset_id, int $project_id, int $asset_cat_id ): array {
		return VRodos_Asset_Import_Execution::consume_uploaded_file_array( $file, $asset_id, $project_id, $asset_cat_id );
	}

	public static function process_asset_import_job( int $asset_id ): array {
		return VRodos_Asset_Import_Execution::process_asset_import_job( $asset_id );
	}

	public static function status_for_asset( int $asset_id ): array {
		return VRodos_Asset_Import_Execution::status_for_asset( $asset_id );
	}

	private static function max_upload_bytes(): int {
		return max(
			self::CHUNK_BYTES,
			(int) apply_filters( 'vrodos_max_model_upload_bytes', self::MAX_UPLOAD_BYTES )
		);
	}

	private static function sanitize_local_path( string $path ): string {
		$path = wp_strip_all_tags( $path, true );
		$path = str_replace( [ "\0", "\r", "\n" ], '', $path );
		$path = preg_replace( '/[\x00-\x1F\x7F]/', '', $path );

		return trim( is_string( $path ) ? $path : '' );
	}

	public function cleanup_staged_uploads(): void {
		VRodos_Asset_Import_Execution::cleanup_staged_uploads();
	}
}
