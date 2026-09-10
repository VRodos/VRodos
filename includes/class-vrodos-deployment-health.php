<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Portable runtime and background-processing diagnostics for VRodos deployments. */
class VRodos_Deployment_Health {
	public const SETTINGS_TAB_KEY = 'vrodos_deployment_health';
	public const TICK_HOOK        = 'vrodos_deployment_health_tick';
	public const PROBE_HOOK       = 'vrodos_deployment_health_probe';
	public const SCHEDULE_KEY     = 'vrodos_five_minutes';
	public const STATE_OPTION     = 'vrodos_deployment_health_state';

	private const REPORT_TRANSIENT = 'vrodos_deployment_health_report';
	private const GOOD_AGE_SECONDS = 15 * MINUTE_IN_SECONDS;
	private const STALE_AGE_SECONDS = 45 * MINUTE_IN_SECONDS;
	private const PROBE_WINDOW_SECONDS = 90;

	public function __construct() {
		add_filter( 'cron_schedules', [ self::class, 'register_cron_schedule' ] );
		add_action( 'init', [ self::class, 'ensure_tick_scheduled' ], 30 );
		add_action( self::TICK_HOOK, [ self::class, 'record_tick' ] );
		add_action( self::PROBE_HOOK, [ self::class, 'record_probe' ], 10, 1 );

		add_filter( 'vrodos_settings_tabs', [ $this, 'register_settings_tab' ] );
		add_action( 'vrodos_render_settings_tab_' . self::SETTINGS_TAB_KEY, [ $this, 'render_settings_tab' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ] );
		add_action( 'wp_ajax_vrodos_deployment_health_run', [ $this, 'ajax_run_checks' ] );
		add_action( 'wp_ajax_vrodos_deployment_health_probe_status', [ $this, 'ajax_probe_status' ] );

		add_filter( 'site_status_tests', [ $this, 'register_site_health_tests' ] );
		add_filter( 'debug_information', [ $this, 'register_debug_information' ] );
	}

	public static function register_cron_schedule( array $schedules ): array {
		$schedules[ self::SCHEDULE_KEY ] = [
			'interval' => 5 * MINUTE_IN_SECONDS,
			'display'  => __( 'Every five minutes', 'vrodos' ),
		];
		return $schedules;
	}

	public static function activate(): void {
		self::ensure_tick_scheduled();
	}

	public static function deactivate(): void {
		wp_clear_scheduled_hook( self::TICK_HOOK );
		wp_clear_scheduled_hook( self::PROBE_HOOK );
	}

	public static function uninstall(): void {
		self::deactivate();
		delete_option( self::STATE_OPTION );
		delete_transient( self::REPORT_TRANSIENT );
	}

	public static function ensure_tick_scheduled(): void {
		$state = self::get_state();
		if ( empty( $state['scheduledAt'] ) ) {
			$state['scheduledAt'] = time();
			self::store_state( $state );
		}
		if ( false !== wp_next_scheduled( self::TICK_HOOK ) ) {
			return;
		}

		$result = wp_schedule_event( time() + MINUTE_IN_SECONDS, self::SCHEDULE_KEY, self::TICK_HOOK, [], true );
		if ( is_wp_error( $result ) || true !== $result ) {
			$message = is_wp_error( $result ) ? $result->get_error_message() : 'WordPress returned false.';
			error_log( '[VRodos] Could not schedule the deployment-health tick: ' . $message );
		}
	}

	public static function record_tick(): void {
		$state                 = self::get_state();
		$state['lastTickAt']   = time();
		$state['lastTickSapi'] = PHP_SAPI;
		$state['lastTickUid']  = self::effective_uid();
		self::store_state( $state );
	}

	public static function record_probe( string $token ): void {
		$token = sanitize_text_field( $token );
		$state = self::get_state();
		if ( '' === $token || ! hash_equals( (string) ( $state['probe']['token'] ?? '' ), $token ) ) {
			return;
		}

		$state['probe']['completedAt'] = time();
		$state['probe']['sapi']        = PHP_SAPI;
		$state['probe']['uid']         = self::effective_uid();
		self::store_state( $state );
	}

	public function register_settings_tab( array $tabs ): array {
		$tabs[ self::SETTINGS_TAB_KEY ] = __( 'Deployment Health', 'vrodos' );
		return $tabs;
	}

	public function enqueue_admin_assets(): void {
		$page = isset( $_GET['page'] ) ? sanitize_key( (string) wp_unslash( $_GET['page'] ) ) : '';
		$tab  = isset( $_GET['tab'] ) ? sanitize_key( (string) wp_unslash( $_GET['tab'] ) ) : '';
		if ( 'vrodos_options' !== $page || self::SETTINGS_TAB_KEY !== $tab ) {
			return;
		}

		wp_enqueue_script(
			'vrodos-deployment-health',
			VRodos_Path_Manager::editor_js_url( 'vrodos_deployment_health.js' ),
			[],
			(string) filemtime( VRodos_Path_Manager::plugin_path( 'assets/js/editor/vrodos_deployment_health.js' ) ),
			true
		);
		wp_localize_script(
			'vrodos-deployment-health',
			'vrodosDeploymentHealth',
			[
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'vrodos_deployment_health' ),
				'labels'  => [
					'running' => __( 'Running checks and waiting for the background probe…', 'vrodos' ),
					'failed'  => __( 'The health check could not be completed.', 'vrodos' ),
					'timeout' => __( 'The probe did not complete within 90 seconds. The scheduler may be stopped or busy.', 'vrodos' ),
				],
			]
		);
	}

	public function render_settings_tab(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			echo '<p>' . esc_html__( 'You are not allowed to view deployment health.', 'vrodos' ) . '</p>';
			return;
		}

		$report = self::get_report();
		?>
		<p><?php echo esc_html__( 'VRodos checks the WordPress runtime and confirms that scheduled events execute. The hosting environment remains responsible for one scheduler owner and its operating-system user.', 'vrodos' ); ?></p>
		<table class="widefat striped" style="max-width: 1000px">
			<thead><tr><th><?php echo esc_html__( 'Check', 'vrodos' ); ?></th><th><?php echo esc_html__( 'Status', 'vrodos' ); ?></th><th><?php echo esc_html__( 'Details', 'vrodos' ); ?></th></tr></thead>
			<tbody>
			<?php foreach ( $report['checks'] as $check ) : ?>
				<tr>
					<th scope="row"><?php echo esc_html( (string) $check['label'] ); ?></th>
					<td><strong><?php echo esc_html( self::status_label( (string) $check['status'] ) ); ?></strong></td>
					<td><?php echo esc_html( (string) $check['message'] ); ?></td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
		<p>
			<button type="button" class="button button-primary" data-vrodos-health-run><?php echo esc_html__( 'Run checks now', 'vrodos' ); ?></button>
			<span class="spinner" data-vrodos-health-spinner></span>
			<span data-vrodos-health-status aria-live="polite"></span>
		</p>
		<p class="description">
			<?php echo esc_html__( 'A successful probe proves that WordPress executed a queued event. When request-triggered WP-Cron is enabled, it does not by itself prove a dedicated single-owner scheduler.', 'vrodos' ); ?>
		</p>
		<?php
	}

	public function ajax_run_checks(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( [ 'message' => __( 'You are not allowed to run deployment checks.', 'vrodos' ) ], 403 );
		}
		check_ajax_referer( 'vrodos_deployment_health', 'nonce' );

		self::get_report( true );
		$state          = self::get_state();
		$previous_token = sanitize_text_field( (string) ( $state['probe']['token'] ?? '' ) );
		if ( '' !== $previous_token ) {
			wp_clear_scheduled_hook( self::PROBE_HOOK, [ $previous_token ] );
		}

		$token          = wp_generate_uuid4();
		$state['probe'] = [
			'token'       => $token,
			'requestedAt' => time(),
			'completedAt' => 0,
		];
		self::store_state( $state );

		$result = wp_schedule_single_event( time(), self::PROBE_HOOK, [ $token ], true );
		if ( is_wp_error( $result ) || true !== $result ) {
			$message = is_wp_error( $result ) ? $result->get_error_message() : __( 'WordPress did not schedule the deployment-health probe.', 'vrodos' );
			wp_send_json_error( [ 'message' => $message ], 500 );
		}

		wp_send_json_success( [ 'token' => $token, 'expiresIn' => self::PROBE_WINDOW_SECONDS ] );
	}

	public function ajax_probe_status(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( [ 'message' => __( 'You are not allowed to view deployment checks.', 'vrodos' ) ], 403 );
		}
		check_ajax_referer( 'vrodos_deployment_health', 'nonce' );

		$token = isset( $_POST['token'] ) ? sanitize_text_field( (string) wp_unslash( $_POST['token'] ) ) : '';
		$probe = (array) ( self::get_state()['probe'] ?? [] );
		if ( '' === $token || ! hash_equals( (string) ( $probe['token'] ?? '' ), $token ) ) {
			wp_send_json_error( [ 'message' => __( 'The deployment-health probe is no longer current.', 'vrodos' ) ], 409 );
		}

		$completed_at = absint( $probe['completedAt'] ?? 0 );
		$requested_at = absint( $probe['requestedAt'] ?? 0 );
		wp_send_json_success(
			[
				'status' => $completed_at > 0 ? 'complete' : ( time() - $requested_at > self::PROBE_WINDOW_SECONDS ? 'timeout' : 'pending' ),
			]
		);
	}

	public function register_site_health_tests( array $tests ): array {
		$tests['direct']['vrodos_background_processing'] = [
			'label' => __( 'VRodos background processing', 'vrodos' ),
			'test'  => fn(): array => $this->site_health_result( self::background_check(), 'vrodos_background_processing' ),
		];
		$tests['direct']['vrodos_runtime_requirements'] = [
			'label' => __( 'VRodos runtime requirements', 'vrodos' ),
			'test'  => fn(): array => $this->site_health_result( self::get_report()['checks']['runtime'], 'vrodos_runtime_requirements' ),
		];
		$tests['direct']['vrodos_optimizer_runtime'] = [
			'label' => __( 'VRodos optimizer runtime', 'vrodos' ),
			'test'  => fn(): array => $this->site_health_result( self::get_report()['checks']['optimizer'], 'vrodos_optimizer_runtime' ),
		];
		$tests['direct']['vrodos_storage'] = [
			'label' => __( 'VRodos storage', 'vrodos' ),
			'test'  => fn(): array => $this->site_health_result( self::get_report()['checks']['storage'], 'vrodos_storage' ),
		];
		$tests['direct']['vrodos_blender'] = [
			'label' => __( 'VRodos optional Blender integration', 'vrodos' ),
			'test'  => fn(): array => $this->site_health_result( self::get_report()['checks']['blender'], 'vrodos_blender' ),
		];
		return $tests;
	}

	public function register_debug_information( array $information ): array {
		$report = self::get_report();
		$fields = [];
		foreach ( $report['checks'] as $key => $check ) {
			$fields[ $key ] = [
				'label' => (string) $check['label'],
				'value' => self::status_label( (string) $check['status'] ) . ': ' . (string) $check['message'],
				'debug' => (string) $check['status'] . ': ' . (string) $check['message'],
			];
		}
		$information['vrodos-deployment'] = [
			'label'  => __( 'VRodos deployment', 'vrodos' ),
			'fields' => $fields,
		];
		return $information;
	}

	public static function get_report( bool $force = false ): array {
		$static = $force ? false : get_transient( self::REPORT_TRANSIENT );
		if ( ! is_array( $static ) ) {
			$static = [
				'runtime'   => self::runtime_check(),
				'optimizer' => self::optimizer_check(),
				'storage'   => self::storage_check(),
				'blender'   => self::blender_check(),
			];
			set_transient( self::REPORT_TRANSIENT, $static, 10 * MINUTE_IN_SECONDS );
		}

		return [
			'checkedAt' => time(),
			'checks'    => [ 'background' => self::background_check(), ...$static ],
		];
	}

	public static function background_check(): array {
		$state         = self::get_state();
		$last_tick     = absint( $state['lastTickAt'] ?? 0 );
		$last_probe    = absint( $state['probe']['completedAt'] ?? 0 );
		$last_run      = max( $last_tick, $last_probe );
		$age           = $last_run > 0 ? max( 0, time() - $last_run ) : PHP_INT_MAX;
		$request_cron  = self::request_cron_enabled();
		$is_production = function_exists( 'wp_get_environment_type' ) && 'production' === wp_get_environment_type();
		$web_uid       = self::effective_uid();
		$event_uid     = $last_probe >= $last_tick ? ( $state['probe']['uid'] ?? null ) : ( $state['lastTickUid'] ?? null );
		$event_sapi    = $last_probe >= $last_tick ? (string) ( $state['probe']['sapi'] ?? '' ) : (string) ( $state['lastTickSapi'] ?? '' );
		$uid_mismatch  = null !== $web_uid && null !== $event_uid && (int) $web_uid !== (int) $event_uid;

		if ( 0 === $last_run ) {
			$scheduled_at = absint( $state['scheduledAt'] ?? time() );
			$waiting_age  = max( 0, time() - $scheduled_at );
			$status       = $waiting_age <= self::STALE_AGE_SECONDS ? 'recommended' : ( $is_production || ! $request_cron ? 'critical' : 'recommended' );
			return self::check( 'Background processing', $status, 'VRodos is waiting for its first scheduled health event.' );
		}

		if ( $uid_mismatch ) {
			return self::check( 'Background processing', 'critical', sprintf( 'The latest event ran as UID %d, but WordPress is running as UID %d.', (int) $event_uid, (int) $web_uid ) );
		}

		if ( $age <= self::GOOD_AGE_SECONDS ) {
			$message = sprintf(
				'A scheduled event ran %s ago%s%s.',
				human_time_diff( $last_run, time() ),
				null !== $event_uid ? sprintf( ' as UID %d', (int) $event_uid ) : '',
				'' !== $event_sapi ? ' via ' . $event_sapi : ''
			);
			if ( $request_cron && $is_production ) {
				return self::check( 'Background processing', 'recommended', $message . ' Request-triggered WP-Cron is still enabled, so a dedicated single-owner scheduler is not proven.' );
			}
			return self::check( 'Background processing', 'good', $message . ( $request_cron ? ' Request-triggered WP-Cron is enabled.' : ' Request-triggered WP-Cron is disabled.' ) );
		}

		if ( $age <= self::STALE_AGE_SECONDS ) {
			return self::check( 'Background processing', 'recommended', sprintf( 'The most recent scheduled event ran %s ago; background processing is delayed.', human_time_diff( $last_run, time() ) ) );
		}

		$status  = $is_production || ! $request_cron ? 'critical' : 'recommended';
		$message = $last_run > 0
			? sprintf( 'No scheduled event has completed for %s.', human_time_diff( $last_run, time() ) )
			: 'VRodos has not observed a scheduled event yet.';
		return self::check( 'Background processing', $status, $message . ( $request_cron ? ' Request-triggered WP-Cron is enabled but has not provided timely unattended execution.' : ' Request-triggered WP-Cron is disabled; restore it if the dedicated scheduler is not operational.' ) );
	}

	public static function runtime_check(): array {
		$failures = [];
		if ( version_compare( PHP_VERSION, '8.3', '<' ) ) {
			$failures[] = 'PHP 8.3 or newer is required.';
		}
		if ( function_exists( 'get_bloginfo' ) && version_compare( (string) get_bloginfo( 'version' ), '6.8', '<' ) ) {
			$failures[] = 'WordPress 6.8 or newer is required.';
		}
		if ( ! class_exists( 'DOMDocument' ) ) {
			$failures[] = 'The PHP DOM extension is missing.';
		}
		if ( ! function_exists( 'mb_strlen' ) ) {
			$failures[] = 'The PHP mbstring extension is missing.';
		}
		if ( ! class_exists( 'ZipArchive' ) ) {
			$failures[] = 'The PHP ZIP extension is missing.';
		}
		if ( ! self::php_function_available( 'exec' ) ) {
			$failures[] = 'PHP exec is unavailable or disabled.';
		}
		return self::check(
			'PHP and WordPress runtime',
			$failures ? 'critical' : 'good',
			$failures ? implode( ' ', $failures ) : sprintf( 'WordPress %s and PHP %s provide the required runtime capabilities.', get_bloginfo( 'version' ), PHP_VERSION )
		);
	}

	public static function optimizer_check(): array {
		if ( ! self::php_function_available( 'exec' ) ) {
			return self::check( 'Asset optimizer', 'critical', 'PHP exec is unavailable, so VRodos cannot launch Node.js.' );
		}

		$node   = trim( (string) apply_filters( 'vrodos_asset_optimizer_node_command', 'node' ) );
		$script = VRodos_Path_Manager::plugin_path( 'scripts/check-optimizer-runtime.mjs' );
		if ( '' === $node || ! is_file( $script ) ) {
			return self::check( 'Asset optimizer', 'critical', 'The Node command or optimizer preflight script is missing.' );
		}

		$output = [];
		$code   = 0;
		exec( escapeshellarg( $node ) . ' ' . escapeshellarg( $script ) . ' --json 2>&1', $output, $code );
		$payload = json_decode( trim( (string) end( $output ) ), true );
		if ( ! is_array( $payload ) ) {
			$message = trim( implode( "\n", array_slice( $output, -5 ) ) );
			return self::check( 'Asset optimizer', 'critical', 'Optimizer preflight failed: ' . ( '' !== $message ? $message : 'no readable result' ) );
		}

		if ( 0 !== $code || empty( $payload['ok'] ) ) {
			$errors = array_filter( array_map( 'strval', (array) ( $payload['errors'] ?? [] ) ) );
			return self::check( 'Asset optimizer', 'critical', 'Optimizer preflight failed: ' . ( $errors ? implode( ' ', $errors ) : 'unknown error' ) );
		}

		return self::check(
			'Asset optimizer',
			'good',
			sprintf(
				'Node.js %s, glTF Transform %s, Sharp %s, libvips %s, and KTX-Software %s are ready.',
				(string) ( $payload['node']['version'] ?? 'unknown' ),
				self::dependency_version( $payload, '@gltf-transform/cli' ),
				(string) ( $payload['sharp']['version'] ?? 'unknown' ),
				(string) ( $payload['sharp']['libvipsVersion'] ?? 'unknown' ),
				(string) ( $payload['ktx']['version'] ?? 'unknown' )
			)
		);
	}

	public static function storage_check(): array {
		$uploads = wp_upload_dir( null, true );
		if ( ! empty( $uploads['error'] ) || empty( $uploads['basedir'] ) || ! is_dir( (string) $uploads['basedir'] ) || ! is_writable( (string) $uploads['basedir'] ) ) {
			return self::check( 'Storage', 'critical', 'WordPress uploads are unavailable or not writable.' );
		}

		$private = VRodos_Storage_Manager::private_site_root();
		if ( is_wp_error( $private ) ) {
			return self::check( 'Storage', 'critical', $private->get_error_message() );
		}
		if ( ! is_dir( (string) $private ) || ! is_writable( (string) $private ) ) {
			return self::check( 'Storage', 'critical', 'VRodos private storage is unavailable or not writable.' );
		}

		$published_root = trailingslashit( (string) $uploads['basedir'] ) . 'vrodos';
		$published      = trailingslashit( $published_root ) . 'published';
		if ( ( file_exists( $published_root ) && ! is_dir( $published_root ) ) || ( file_exists( $published ) && ! is_dir( $published ) ) ) {
			return self::check( 'Storage', 'critical', 'The VRodos published-output path is blocked by a file.' );
		}
		$published_parent = is_dir( $published ) ? $published : ( is_dir( $published_root ) ? $published_root : (string) $uploads['basedir'] );
		if ( ! is_writable( $published_parent ) ) {
			return self::check( 'Storage', 'critical', 'The VRodos published-output location is not writable.' );
		}
		return self::check( 'Storage', 'good', 'Uploads, published output, and private storage are writable; private storage is outside the public web roots.' );
	}

	public static function blender_check(): array {
		if ( ! class_exists( 'VRodos_Asset_Import_Blender_Converter' ) ) {
			return self::check( 'Optional Blender import', 'good', 'Blender integration is not loaded; direct GLB imports remain available.' );
		}
		$path = VRodos_Asset_Import_Blender_Converter::get_configured_path();
		if ( '' === trim( $path ) ) {
			return self::check( 'Optional Blender import', 'good', 'Blender is optional and is not configured; direct GLB imports remain available.' );
		}
		$status = VRodos_Asset_Import_Blender_Converter::test_path( $path );
		return self::check(
			'Optional Blender import',
			! empty( $status['success'] ) ? 'good' : 'recommended',
			(string) ( $status['message'] ?? 'The configured Blender executable could not be verified.' )
		);
	}

	private function site_health_result( array $check, string $test ): array {
		$status = (string) $check['status'];
		return [
			'label'       => (string) $check['label'],
			'status'      => $status,
			'badge'       => [
				'label' => __( 'VRodos', 'vrodos' ),
				'color' => 'blue',
			],
			'description' => '<p>' . esc_html( (string) $check['message'] ) . '</p>',
			'actions'     => sprintf(
				'<p><a href="%s">%s</a></p>',
				esc_url( admin_url( 'admin.php?page=vrodos_options&tab=' . self::SETTINGS_TAB_KEY ) ),
				esc_html__( 'Open VRodos Deployment Health', 'vrodos' )
			),
			'test'        => $test,
		];
	}

	private static function dependency_version( array $payload, string $name ): string {
		foreach ( (array) ( $payload['dependencies'] ?? [] ) as $dependency ) {
			if ( is_array( $dependency ) && $name === (string) ( $dependency['name'] ?? '' ) ) {
				return (string) ( $dependency['actual'] ?? 'unknown' );
			}
		}
		return 'unknown';
	}

	private static function php_function_available( string $function ): bool {
		$disabled  = array_filter( array_map( 'trim', explode( ',', (string) ini_get( 'disable_functions' ) ) ) );
		$available = function_exists( $function ) && ! in_array( $function, $disabled, true );
		return (bool) apply_filters( 'vrodos_deployment_health_php_function_available', $available, $function );
	}

	private static function effective_uid(): ?int {
		$uid = function_exists( 'posix_geteuid' ) ? posix_geteuid() : null;
		$uid = apply_filters( 'vrodos_deployment_health_effective_uid', $uid );
		return is_int( $uid ) ? $uid : ( is_numeric( $uid ) ? (int) $uid : null );
	}

	private static function request_cron_enabled(): bool {
		$enabled = ! defined( 'DISABLE_WP_CRON' ) || ! DISABLE_WP_CRON;
		return (bool) apply_filters( 'vrodos_deployment_health_request_cron_enabled', $enabled );
	}

	private static function get_state(): array {
		$state = get_option( self::STATE_OPTION, [] );
		return is_array( $state ) ? $state : [];
	}

	private static function store_state( array $state ): void {
		if ( false === get_option( self::STATE_OPTION, false ) ) {
			add_option( self::STATE_OPTION, $state, '', false );
			return;
		}
		update_option( self::STATE_OPTION, $state, false );
	}

	private static function check( string $label, string $status, string $message ): array {
		return [
			'label'   => $label,
			'status'  => in_array( $status, [ 'good', 'recommended', 'critical' ], true ) ? $status : 'critical',
			'message' => wp_strip_all_tags( $message ),
		];
	}

	private static function status_label( string $status ): string {
		return match ( $status ) {
			'good'        => __( 'Good', 'vrodos' ),
			'recommended' => __( 'Recommended improvement', 'vrodos' ),
			default       => __( 'Critical', 'vrodos' ),
		};
	}
}
