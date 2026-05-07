<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Settings_Manager {

	private array $settings_tabs    = [];
	private array $general_settings = [];

	public function __construct(
		private readonly string $general_settings_key = 'vrodos_general_settings',
		private readonly string $options_key = 'vrodos_options',
	) {
		if ( is_admin() ) {
			add_action( 'init', $this->load_settings(...) );
			add_action( 'admin_init', $this->register_general_settings(...) );
			add_action( 'admin_menu', $this->render_setting(...) );
		}
	}

	public function load_settings(): void {
		$this->general_settings = (array) get_option( $this->general_settings_key );

		$this->general_settings = array_merge(
			$this->default_general_settings(),
			$this->general_settings
		);
	}

	public function register_general_settings(): void {
		$this->settings_tabs[ $this->general_settings_key ] = __( 'General' );

		register_setting(
			$this->general_settings_key,
			$this->general_settings_key,
			[
				'sanitize_callback' => $this->sanitize_general_settings(...),
			]
		);
		add_settings_section( 'section_runtime_links', __( 'Runtime Links' ), $this->section_runtime_links_desc(...), $this->general_settings_key );

		add_settings_field( 'vrodos_runtime_public_base_url', __( 'Public runtime URL' ), $this->field_vrodos_runtime_public_base_url(...), $this->general_settings_key, 'section_runtime_links' );

		add_settings_field( 'vrodos_runtime_local_host', __( 'Local runtime host/IP' ), $this->field_vrodos_runtime_local_host(...), $this->general_settings_key, 'section_runtime_links' );

		add_settings_field( 'vrodos_runtime_local_port', __( 'Local runtime port' ), $this->field_vrodos_runtime_local_port(...), $this->general_settings_key, 'section_runtime_links' );

		add_settings_field( 'vrodos_runtime_default_link_mode', __( 'Default compile link mode' ), $this->field_vrodos_runtime_default_link_mode(...), $this->general_settings_key, 'section_runtime_links' );
	}

	public function section_runtime_links_desc(): void {
		echo '<p>' . esc_html__( 'Controls the LAN and public links returned after A-Frame compilation.' ) . '</p>';
	}

	private function default_general_settings(): array {
		return [
			'vrodos_runtime_public_base_url'   => '',
			'vrodos_runtime_local_host'        => '',
			'vrodos_runtime_local_port'        => '5832',
			'vrodos_runtime_default_link_mode' => 'both',
		];
	}

	public function sanitize_general_settings( $input ): array {
		$input    = is_array( $input ) ? $input : [];
		$defaults = $this->default_general_settings();
		$output   = [];

		foreach ( $defaults as $key => $default ) {
			$value = $input[ $key ] ?? $default;

			switch ( $key ) {
				case 'vrodos_runtime_public_base_url':
					$output[ $key ] = $this->sanitize_runtime_base_url( (string) $value );
					break;
				case 'vrodos_runtime_local_host':
					$output[ $key ] = $this->sanitize_runtime_host( (string) $value );
					break;
				case 'vrodos_runtime_local_port':
					$port           = absint( $value );
					$output[ $key ] = $port > 0 ? (string) $port : $defaults[ $key ];
					break;
				case 'vrodos_runtime_default_link_mode':
					$output[ $key ] = in_array( $value, [ 'local', 'public', 'both' ], true ) ? (string) $value : $defaults[ $key ];
					break;
				default:
					$output[ $key ] = sanitize_text_field( (string) $value );
					break;
			}
		}

		return $output;
	}

	private function sanitize_runtime_base_url( string $url ): string {
		$url = trim( $url );
		if ( '' === $url ) {
			return '';
		}

		if ( ! preg_match( '#^https?://#i', $url ) ) {
			$url = 'https://' . $url;
		}

		$url = esc_url_raw( $url, [ 'http', 'https' ] );
		return $url ? trailingslashit( $url ) : '';
	}

	private function sanitize_runtime_host( string $host ): string {
		$host = trim( $host );
		if ( '' === $host ) {
			return '';
		}

		if ( str_contains( $host, '://' ) ) {
			$parsed_host = parse_url( $host, PHP_URL_HOST );
			$host        = $parsed_host ? $parsed_host : $host;
		}

		$host = preg_replace( '#[:/\\\\].*$#', '', $host );
		return sanitize_text_field( (string) $host );
	}

	public function field_vrodos_runtime_public_base_url(): void {
		?>
		<input type="url" class="regular-text" name="<?php echo esc_attr( $this->general_settings_key ); ?>[vrodos_runtime_public_base_url]" id="<?php echo esc_attr( $this->general_settings_key ); ?>[vrodos_runtime_public_base_url]" value="<?php echo esc_attr( $this->general_settings['vrodos_runtime_public_base_url'] ); ?>" placeholder="https://vr.example.com/" />
		<p class="description"><?php echo esc_html__( 'Optional. Used for public HTTPS links when a reverse proxy serves the runtime.' ); ?></p>
		<?php
	}

	public function field_vrodos_runtime_local_host(): void {
		?>
		<input type="text" class="regular-text" name="<?php echo esc_attr( $this->general_settings_key ); ?>[vrodos_runtime_local_host]" id="<?php echo esc_attr( $this->general_settings_key ); ?>[vrodos_runtime_local_host]" value="<?php echo esc_attr( $this->general_settings['vrodos_runtime_local_host'] ); ?>" placeholder="192.168.1.20" />
		<p class="description"><?php echo esc_html__( 'Optional. Leave empty to use the current request host during compile.' ); ?></p>
		<?php
	}

	public function field_vrodos_runtime_local_port(): void {
		?>
		<input type="number" min="1" max="65535" name="<?php echo esc_attr( $this->general_settings_key ); ?>[vrodos_runtime_local_port]" id="<?php echo esc_attr( $this->general_settings_key ); ?>[vrodos_runtime_local_port]" value="<?php echo esc_attr( $this->general_settings['vrodos_runtime_local_port'] ); ?>" />
		<p class="description"><?php echo esc_html__( 'Default LAN runtime server port is 5832.' ); ?></p>
		<?php
	}

	public function field_vrodos_runtime_default_link_mode(): void {
		$current = $this->general_settings['vrodos_runtime_default_link_mode'];
		?>
		<select name="<?php echo esc_attr( $this->general_settings_key ); ?>[vrodos_runtime_default_link_mode]" id="<?php echo esc_attr( $this->general_settings_key ); ?>[vrodos_runtime_default_link_mode]">
			<option value="both" <?php selected( $current, 'both' ); ?>><?php echo esc_html__( 'Both local and public' ); ?></option>
			<option value="local" <?php selected( $current, 'local' ); ?>><?php echo esc_html__( 'Local network' ); ?></option>
			<option value="public" <?php selected( $current, 'public' ); ?>><?php echo esc_html__( 'Public' ); ?></option>
		</select>
		<p class="description"><?php echo esc_html__( 'Controls which link remains in the legacy compile response fields.' ); ?></p>
		<?php
	}

	public function render_setting() {
		add_submenu_page(
			'vrodos-plugin',
			__( 'VRodos Settings' ),
			__( 'Settings' ),
			'manage_options',
			$this->options_key,
			$this->render_options(...)
		);
	}

	public function render_options() {
		$tab = $_GET['tab'] ?? $this->general_settings_key;
		?>
			<div class="wrap">
				<h1><?php echo esc_html__( 'VRodos Settings' ); ?></h1>
				<?php $this->render_tabs(); ?>
				<form method="post" action="options.php">
					<?php
					settings_fields( $tab );
					do_settings_sections( $tab );
					submit_button();
					?>
				</form>
			</div>
		<?php
	}

	public function list_hooks( $filter = false ) {
		global $wp_filter;

		$hooks = $wp_filter;
		$i     = 0;
		echo 'Order of functions';
		echo "<table style='border: 1px solid black; background:#000000'>";
		echo '<tr style="background: #ffffff"><td></td><td>tag</td><td>Priority</td><td>function</td></tr>';

		foreach ( $hooks as $tag => $hook ) {
			if ( false === $filter || str_contains( (string) $tag, (string) $filter ) ) {
				foreach ( $hook as $priority => $functions ) {
					foreach ( $functions as $function ) {
						if ( $function['function'] != 'list_hook_details' ) {
							if ( is_string( $function['function'] ) ) {
								if ( stripos( $function['function'], 'vrodos' ) !== false ) {
									++$i;
									echo "<tr style='background: #ffffff'><td>" . $i . '</td><td>'
									. $tag . '</td><td>' . $priority . '</td><td>' . $function['function'] . '</td></tr>';
								}
							} elseif ( $function['function'] instanceof Closure ) {
							} elseif ( is_object( $function['function'][0] ) ) {
								if ( stripos( $function['function'][0]::class, 'vrodos' ) !== false ) {
									++$i;
									echo "<tr style='background: #ffffff'><td>" . $i . '</td><td>' . $tag . '</td><td>' . $priority .
									'</td><td>' . '(object) ' .
									$function['function'][0]::class . ' -> ' . $function['function'][1] .
									'</td></tr>';

								}
							} elseif ( stripos( (string) $function['function'][0], 'vrodos' ) !== false ) {
									++$i;
									echo "<tr style='background: #ffffff'><td>" . $i . '</td><td>' . $tag . '</td><td>' . $priority .
									'</td><td>' . print_r( $function, true ) . '</td></tr>';
							}
						}
					}
				}
			}
		}
		echo '</table>';
	}

	public function render_tabs() {
		$current_tab = $_GET['tab'] ?? $this->general_settings_key;
		echo '<h2 class="nav-tab-wrapper">';
		foreach ( $this->settings_tabs as $tab_key => $tab_caption ) {
			$active = $current_tab == $tab_key ? 'nav-tab-active' : '';
			echo '<a class="nav-tab ' . $active . '" href="?page=' . $this->options_key . '&tab=' . $tab_key . '">' . $tab_caption . '</a>';
		}
		echo '</h2>';
	}
}
