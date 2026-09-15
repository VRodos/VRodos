<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-background-jobs-read-model.php';

/** Admin-only, read-only window into VRodos asset jobs. */
class VRodos_Background_Jobs {
	public const SETTINGS_TAB_KEY = 'vrodos_background_jobs';
	private const AJAX_ACTION = 'vrodos_background_jobs_status';

	public function __construct() {
		add_filter( 'vrodos_settings_tabs', [ $this, 'register_settings_tab' ] );
		add_action( 'vrodos_render_settings_tab_' . self::SETTINGS_TAB_KEY, [ $this, 'render_settings_tab' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ] );
		add_action( 'wp_ajax_' . self::AJAX_ACTION, [ $this, 'ajax_status' ] );
	}

	public function register_settings_tab( array $tabs ): array {
		$tabs[ self::SETTINGS_TAB_KEY ] = __( 'Background Jobs', 'vrodos' );
		return $tabs;
	}

	public function enqueue_admin_assets(): void {
		$page = isset( $_GET['page'] ) ? sanitize_key( (string) wp_unslash( $_GET['page'] ) ) : '';
		$tab = isset( $_GET['tab'] ) ? sanitize_key( (string) wp_unslash( $_GET['tab'] ) ) : '';
		if ( 'vrodos_options' !== $page || self::SETTINGS_TAB_KEY !== $tab || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$path = VRodos_Path_Manager::plugin_path( 'assets/js/editor/vrodos_background_jobs.js' );
		wp_enqueue_script(
			'vrodos-background-jobs',
			VRodos_Path_Manager::editor_js_url( 'vrodos_background_jobs.js' ),
			[],
			(string) filemtime( $path ),
			true
		);
		wp_localize_script(
			'vrodos-background-jobs',
			'vrodosBackgroundJobs',
			[
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( self::AJAX_ACTION ),
				'action'  => self::AJAX_ACTION,
				'initial' => VRodos_Background_Jobs_Read_Model::snapshot(),
			]
		);
	}

	public function render_settings_tab(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			echo '<p>' . esc_html__( 'You are not allowed to view background jobs.', 'vrodos' ) . '</p>';
			return;
		}
		?>
		<div id="vrodos-background-jobs">
			<h2><?php esc_html_e( 'Background Jobs', 'vrodos' ); ?></h2>
			<p><?php esc_html_e( 'See which assets are being imported or prepared, what is queued, and whether WordPress cron is processing events. Web and editor-preview jobs generate derivatives; they do not change the source GLB.', 'vrodos' ); ?></p>
			<p>
				<button type="button" class="button" data-vrodos-jobs-refresh><?php esc_html_e( 'Refresh now', 'vrodos' ); ?></button>
				<span class="description" data-vrodos-jobs-updated aria-live="polite"></span>
			</p>
			<table class="widefat striped" style="max-width:1000px;margin:16px 0;">
				<tbody>
					<tr><th scope="row"><?php esc_html_e( 'WordPress cron', 'vrodos' ); ?></th><td data-vrodos-jobs-cron></td></tr>
					<tr><th scope="row"><?php esc_html_e( 'Optimizer worker', 'vrodos' ); ?></th><td data-vrodos-jobs-worker></td></tr>
				</tbody>
			</table>
			<h3><?php esc_html_e( 'Running and queued asset jobs', 'vrodos' ); ?></h3>
			<p class="description"><?php esc_html_e( 'Queued jobs are listed in scheduled order. Actual execution can vary when a worker is busy.', 'vrodos' ); ?></p>
			<div data-vrodos-jobs-active></div>
			<h3><?php esc_html_e( 'Recent completed and failed jobs', 'vrodos' ); ?></h3>
			<div data-vrodos-jobs-recent></div>
		</div>
		<?php
	}

	public function ajax_status(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( [ 'message' => __( 'You are not allowed to view background jobs.', 'vrodos' ) ], 403 );
		}
		check_ajax_referer( self::AJAX_ACTION, 'nonce' );
		wp_send_json_success( VRodos_Background_Jobs_Read_Model::snapshot() );
	}
}
