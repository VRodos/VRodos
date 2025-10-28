<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Settings_Manager {

    private $general_settings_key = 'vrodos_general_settings';
    private $options_key = 'vrodos_options';
    private $settings_tabs = array();

	public function __construct() {
		if( is_admin() ){
			add_action( 'init', array( $this, 'load_settings' ) );
			add_action( 'admin_init', array( $this, 'register_general_settings' ) );
			//add_action( 'admin_menu', array( $this, 'render_setting') );
		}
	}

    public function load_settings() {
        $this->general_settings = (array) get_option( $this->general_settings_key );

        $this->general_settings = array_merge( array(
            'vrodos_unity_local_or_remote' => 'remote',
            'vrodos_unity_exe_folder' => 'C:\Program Files\Unity',
            'vrodos_remote_api_folder' => 'http://myurl/',
            'vrodos_ftp_address' => '',
            'vrodos_ftp_username' => '',
            'vrodos_ftp_pass' => '',
            'vrodos_server_path' => 'C:/xampp/htdocs/COMPILE_UNITY3D_GAMES/',
            'vrodos_google_application_credentials' => ''
        ), $this->general_settings );

    }

    public function register_general_settings() {
        $this->settings_tabs[$this->general_settings_key] = __('General');

        register_setting( $this->general_settings_key, $this->general_settings_key );
        add_settings_section( 'section_general', __('General Settings'), array( $this, 'section_general_desc' ), $this->general_settings_key );
    
    
        add_settings_field( 'vrodos_unity_local_or_remote', __('Compile in this server or remote server?'),
            array( $this, 'field_vrodos_unity_local_or_remote' ), $this->general_settings_key, 'section_general' );
        
        add_settings_field( 'vrodos_unity_exe_folder', __('Path of Unity exe file'), array( $this, 'field_vrodos_unity_exe_folder' ), $this->general_settings_key, 'section_general' );

        add_settings_field( 'vrodos_remote_api_folder', __('Remote Game server API'), array( $this, 'field_vrodos_remote_api_folder' ), $this->general_settings_key, 'section_general' );

        add_settings_field( 'vrodos_ftp_address', __('FTP Address'), array( $this, 'field_vrodos_ftp_address' ), $this->general_settings_key, 'section_general' );

        add_settings_field( 'vrodos_ftp_username', __('FTP Username'), array( $this, 'field_vrodos_ftp_username' ), $this->general_settings_key, 'section_general' );

        add_settings_field( 'vrodos_ftp_pass', __('FTP Password'), array( $this, 'field_vrodos_ftp_pass' ), $this->general_settings_key, 'section_general' );

        add_settings_field( 'vrodos_server_path', __('Remote Server path'), array( $this, 'field_vrodos_server_path' ), $this->general_settings_key, 'section_general' );
    
        add_settings_field( 'vrodos_google_application_credentials', __('Google application credentials for auto translate '), array( $this, 'field_vrodos_google_application_credentials' ), $this->general_settings_key, 'section_general' );
        
    }

    public function section_general_desc() { echo __('Settings concerning the functionality of the application'); }

    public function field_vrodos_unity_local_or_remote(){
        ?>
        <input type="text"  name="<?php echo $this->general_settings_key; ?>[vrodos_unity_local_or_remote]"
               id="<?php echo $this->general_settings_key; ?>[vrodos_unity_local_or_remote]" value="<?php echo esc_attr( $this->general_settings['vrodos_unity_local_or_remote'] ); ?>" /> (Options: 'local' or 'remote' strings)
        <?php
    }
    
    public function field_vrodos_unity_exe_folder(){
        ?>
        <input type="text" style="width:70%" name="<?php echo $this->general_settings_key; ?>[vrodos_unity_exe_folder]" id="<?php echo $this->general_settings_key; ?>[vrodos_unity_exe_folder]" value="<?php echo esc_attr( $this->general_settings['vrodos_unity_exe_folder'] ); ?>" />
        <?php
    }

    public function field_vrodos_remote_api_folder(){
        ?>
        <input type="text" name="<?php echo $this->general_settings_key; ?>[vrodos_remote_api_folder]" id="<?php echo $this->general_settings_key; ?>[vrodos_remote_api_folder]" value="<?php echo esc_attr( $this->general_settings['vrodos_remote_api_folder'] ); ?>" />
        <?php
    }

    public function field_vrodos_ftp_address(){
        ?>
        <input type="text" style="width:70%" name="<?php echo $this->general_settings_key; ?>[vrodos_ftp_address]" id="<?php echo $this->general_settings_key; ?>[vrodos_ftp_address]" value="<?php echo esc_attr( $this->general_settings['vrodos_ftp_address'] ); ?>" />
        <?php
    }

    public function field_vrodos_ftp_username(){
        ?>
        <input type="text" name="<?php echo $this->general_settings_key; ?>[vrodos_ftp_username]" id="<?php echo $this->general_settings_key; ?>[vrodos_ftp_username]" value="<?php echo esc_attr( $this->general_settings['vrodos_ftp_username'] ); ?>" />
        <?php
    }

    public function field_vrodos_ftp_pass(){
        ?>
        <input type="password" name="<?php echo $this->general_settings_key; ?>[vrodos_ftp_pass]" id="<?php echo $this->general_settings_key; ?>[vrodos_ftp_pass]" value="<?php echo esc_attr( $this->general_settings['vrodos_ftp_pass'] ); ?>" />
        <?php
    }

    public function field_vrodos_server_path(){
        ?>
        <input type="text" style="width:70%" name="<?php echo $this->general_settings_key; ?>[vrodos_server_path]" id="<?php echo $this->general_settings_key; ?>[vrodos_server_path]" value="<?php echo esc_attr( $this->general_settings['vrodos_server_path'] ); ?>" />
        <?php
    }
    
    public function field_vrodos_google_application_credentials(){
        ?>
        <input type="text" style="width:70%" name="<?php echo $this->general_settings_key; ?>[vrodos_google_application_credentials]" id="<?php echo $this->general_settings_key; ?>[vrodos_google_application_credentials]" value="<?php echo esc_attr( $this->general_settings['vrodos_google_application_credentials'] ); ?>" />
        <?php
    }
    
    public function render_setting() {
        add_options_page( __('vrodos Plugin Settings'), __('vrodos Settings'), 'manage_options', $this->options_key, array( $this, 'render_options' ) );
    }

    public function render_options() {
        $tab = isset( $_GET['tab'] ) ? $_GET['tab'] : $this->general_settings_key;
        ?>
            <div class="wrap">
                <?php $this->render_tabs(); ?>
                <form method="post" action="options.php">
                    <?php
                    wp_nonce_field( 'update-options' );
                    settings_fields( $tab );
                    do_settings_sections( $tab );
                    submit_button();
                    ?>
                </form>
                <?php $this->list_hooks(); ?>
            </div>
        <?php
    }

    public function list_hooks( $filter = false ){
        global $wp_filter;
        
        $hooks = $wp_filter;
        $i = 0;
        echo "Order of functions";
        echo "<table style='border: 1px solid black; background:#000000'>";
        echo '<tr style="background: #ffffff"><td></td><td>tag</td><td>Priority</td><td>function</td></tr>';
        
        foreach( $hooks as $tag => $hook )
            if ( false === $filter || false !== strpos( $tag, $filter ) ){
                foreach( $hook as $priority => $functions ) {
                    foreach( $functions as $function )
                        if( $function['function'] != 'list_hook_details' ) {
                            if (is_string($function['function'])) {
                                if (stripos($function['function'],'vrodos') !== false) {
                                    $i++;
                                    echo "<tr style='background: #ffffff'><td>".$i."</td><td>"
                                        .$tag."</td><td>".$priority."</td><td>".$function['function']."</td></tr>";
                                }
                            }elseif ($function['function'] instanceof Closure){
                            }elseif (is_object($function['function'][0])) {
                                if (stripos(get_class($function['function'][0]), 'vrodos') !== false) {
                                    $i++;
                                    echo "<tr style='background: #ffffff'><td>".$i."</td><td>".$tag."</td><td>".$priority.
                                        "</td><td>"."(object) " .
                                        get_class($function['function'][0]) . ' -> ' . $function['function'][1].
                                        "</td></tr>";
                        
                                }
                            }else {
                                if (stripos($function['function'][0], 'vrodos') !== false) {
                                    $i++;
                                    echo "<tr style='background: #ffffff'><td>".$i."</td><td>".$tag."</td><td>".$priority.
                                        "</td><td>".print_r($function,true)."</td></tr>";
                                }
                            }
                        }
                }
            }
        echo "</table>";
    }
    
    public function render_tabs() {
        $current_tab = isset( $_GET['tab'] ) ? $_GET['tab'] : $this->general_settings_key;
        echo '<h2 class="nav-tab-wrapper">';
        foreach ($this->settings_tabs as $tab_key => $tab_caption ) {
            $active = $current_tab == $tab_key ? 'nav-tab-active' : '';
            echo '<a class="nav-tab ' . $active . '" href="?page=' . $this->options_key . '&tab=' . $tab_key . '">' . $tab_caption . '</a>';
        }
        echo '</h2>';
    }
}
