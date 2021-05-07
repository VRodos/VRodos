<?php

//All information about our meta box
$wpunity_databox3 = array(
	'id' => 'wpunity-games-databox',
	'page' => 'wpunity_game',
	'context' => 'normal',
	'priority' => 'high',
	'fields' => array(
		array(
			'name' => 'Latitude',
			'desc' => 'Game\'s Latitude',
			'id' => 'wpunity_game_lat',
			'type' => 'text',
			'std' => ''
		),
		array(
			'name' => 'Longitude',
			'desc' => 'Game\'s Longitude',
			'id' => 'wpunity_game_lng',
			'type' => 'text',
			'std' => ''
		),array(
			'name' => 'collaborators_ids',
			'desc' => 'ids of collaborators starting separated and ending by semicolon',
			'id' => 'wpunity_game_collaborators_ids',
			'type' => 'text',
			'std' => ""
		)
	)
);


// Create  custom post type 'wpunity_game'
function vrodos_project_cpt_construct(){

//    $ff = fopen("output_order_log.txt","a");
//    fwrite($ff, '7 wpunity_games_construct'.chr(13));
//    fclose($ff);
    
    $labels = array(
		'name'               => _x( 'Projects', 'post type general name'),
		'singular_name'      => _x( 'Project', 'post type singular name'),
		'menu_name'          => _x( 'Projects', 'admin menu'),
		'name_admin_bar'     => _x( 'Project', 'add new on admin bar'),
		'add_new'            => _x( 'Add New', 'add new on menu'),
		'add_new_item'       => __( 'Add New Project'),
		'new_item'           => __( 'New Project'),
		'edit'               => __( 'Edit'),
		'edit_item'          => __( 'Edit Project'),
		'view'               => __( 'View'),
		'view_item'          => __( 'View Project'),
		'all_items'          => __( 'All Projects'),
		'search_items'       => __( 'Search Projects'),
		'parent_item_colon'  => __( 'Parent Projects:'),
		'parent'             => __( 'Parent Project'),
		'not_found'          => __( 'No Projects found.'),
		'not_found_in_trash' => __( 'No Projects found in Trash.')
	);
	
    $args = array(
		'labels'                => $labels,
		'description'           => 'A Project is the entity that defines a solid work item',
		'public'                => true,
		'exclude_from_search'   => true,
		'publicly_queryable'    => false,
		'show_in_nav_menus'     => false,
		'show_ui'               => true,
		'menu_position'     => 26,
		'menu_icon'         =>'dashicons-media-interactive',
		'taxonomies'        => array('wpunity_game_type'),
		'supports'          => array('title','author','editor','custom-fields','revisions'),
		'hierarchical'      => false,
		'has_archive'       => false,
        //'map_meta_cap'      => true,
		'capabilities' => array(
			'publish_posts' => 'publish_vrodos_project',
			'edit_posts' => 'edit_vrodos_project',
			'edit_others_posts' => 'edit_others_vrodos_project',
			'delete_posts' => 'delete_vrodos_project',
			'delete_others_posts' => 'delete_others_vrodos_project',
			'read_private_posts' => 'read_private_vrodos_project',
			'edit_post' => 'edit_vrodos_project',
			'delete_post' => 'delete_vrodos_project',
			'read_post' => 'read_vrodos_project'
		)
	);
 
	register_post_type('wpunity_game', $args);
}


//Create Game Type as custom taxonomy 'wpunity_game_type'
function vrodos_project_taxtype_create(){
 
 
	$labels = array(
		'name'              => _x( 'Project Type', 'taxonomy general name'),
		'singular_name'     => _x( 'Project Type', 'taxonomy singular name'),
		'menu_name'         => _x( 'Project Types', 'admin menu'),
		'search_items'      => __( 'Search Project Types'),
		'all_items'         => __( 'All Project Types'),
		'parent_item'       => __( 'Parent Project Type'),
		'parent_item_colon' => __( 'Parent Project Type:'),
		'edit_item'         => __( 'Edit Project Type'),
		'update_item'       => __( 'Update Project Type'),
		'add_new_item'      => __( 'Add New Project Type'),
		'new_item_name'     => __( 'New Project Type')
	);
	
	$args = array(
		'description' => 'Type of Game Project',
		'labels'    => $labels,
		'public'    => false,
		'show_ui'   => true,
		'hierarchical' => true,
		'show_admin_column' => true,
		'capabilities' => array (
			'manage_terms' => 'manage_vrodos_project_type',
			'edit_terms' => 'manage_vrodos_project_type',
			'delete_terms' => 'manage_vrodos_project_type',
			'assign_terms' => 'edit_vrodos_project_type'
		),
	);
	
	register_taxonomy('wpunity_game_type', 'wpunity_game', $args);
}


// Generate Taxonomy (for scenes & assets) with Game's slug/name
// Create Default Scenes for this "Game"
function wpunity_create_folder_game( $new_status, $old_status, $post){

	$post_type = get_post_type($post);
	$gameSlug = $post->post_name;

	global $project_scope;

	if ($post_type == 'wpunity_game' && $new_status == 'publish') {

//        $fh = fopen("output_folder_Game.txt","a");
//        fwrite($fh, $post_type . " " . $new_status ." ". $gameSlug .'\n' );
//        fclose($fh);

		if(($gameSlug != 'archaeology-joker') && ($gameSlug != 'energy-joker') && ($gameSlug != 'chemistry-joker')){

			$gameTitle = $post->post_title;
			$gameID = $post->ID;

			//TEMPORARY
			if ($project_scope === 1) {
				update_post_meta( $gameID, 'vrodos_project_expID', '82a5dc78-dd27-43db-be12-f5440bbc9dd5');
			}

			wp_insert_term(
				'Apple', // the term
				'product', // the taxonomy
				array(
					'description'=> 'A yummy apple.',
					'slug' => 'apple',
				)
			);

			//Create a parent game tax category for the scenes
			wp_insert_term($gameTitle,'vrodos_scene_pgame', array(
					'description'=> '-',
					'slug' => $gameSlug,
				)
			);

			//Create a parent game tax category for the assets
			wp_insert_term($gameTitle,'vrodos_asset3d_pgame',array(
					'description'=> '-',
					'slug' => $gameSlug,
				)
			);

			//Create Default Scenes for this "Game"
			wpunity_create_default_scenes_for_game($gameSlug, $gameTitle, $gameID);

			//Available molecules
			$molecules = vrodos_get_all_molecules_of_game($gameID);//ALL available Molecules of a GAME
			$allMolecules = '[';$start = 0;
			foreach ($molecules as $molecule) {
				if($start == 0) {
					$allMolecules = $allMolecules . '"' . $molecule['moleculeID'] . '"';
					$start = 1;
				}else{
					$allMolecules = $allMolecules . ',"' . $molecule['moleculeID'] . '"';
				}
			}
			$allMolecules = $allMolecules . ']';
			update_post_meta($gameID, 'wpunity_exam_enabled_molecules', $allMolecules);


			//Create Sample Data (assets) for the game that auto-created
			$current_user = wp_get_current_user();
			$user_id = $current_user->ID;
			$username = $current_user->user_login;
			//wpunity_registrationhook_createAssets($user_id,$username,$gameID);
			//MALTA remove comments

			// Request keys from GIO
			if ($project_scope === 1) {
				wpunity_createGame_GIO_request( $gameID , $user_id );
			}

        }else{
			$gameTitle = $post->post_title;
			//Create a parent game tax category for the assets
			wp_insert_term($gameTitle,'vrodos_asset3d_pgame',$gameSlug,'Asset of a Game');
		}
	}
}



//Create Game Category Box @ Game's backend
function wpunity_games_taxcategory_box() {

	remove_meta_box( 'wpunity_game_typediv', 'wpunity_game', 'side' ); //Removes the default metabox at side
	
	add_meta_box( 'tagsdiv-wpunity_game_type','Game Type','wpunity_games_taxtype_box_content', 'wpunity_game', 'side' , 'high'); //Adds the custom metabox with select box
	
}



function wpunity_games_taxtype_box_content($post){
	$tax_name = 'wpunity_game_type';
	?>
	<div class="tagsdiv" id="<?php echo $tax_name; ?>">
		
		<p class="howto"><?php echo 'Select type for current Game' ?></p>
		
		<?php
		// Use nonce for verification
		wp_nonce_field( plugin_basename( __FILE__ ), 'wpunity_game_type_noncename' );
		
		$type_IDs = wp_get_object_terms( $post->ID, 'wpunity_game_type', array('fields' => 'ids') );
		
//		$ff = fopen("output_p1.txt","w");
//		fwrite($ff, print_r($type_IDs, true));
//		fclose($ff);
//		//echo $type_IDs;
		
		$args = array(
			'show_option_none'   => 'Select Type',
			'orderby'            => 'name',
			'hide_empty'         => 0,
			'selected'           => $type_IDs[0],
			'name'               => 'wpunity_game_type',
			'taxonomy'           => 'wpunity_game_type',
			'echo'               => 0,
			'option_none_value'  => '-1',
			'id' => 'wpunity-select-type-dropdown'
		);
		
		$select = wp_dropdown_categories($args);
		
		$replace = "<select$1 required>";
		$select  = preg_replace( '#<select([^>]*)>#', $replace, $select );
		
		$old_option = "<option value='-1'>";
		$new_option = "<option disabled selected value=''>".'Select type'."</option>";
		$select = str_replace($old_option, $new_option, $select);
		
		echo $select;
		?>
	
	</div>
	<?php
}


function wpunity_games_taxtype_box_content_save( $post_id ) {
	
	global $wpdb;
	
	// verify if this is an auto save routine.
	// If it is our form has not been submitted, so we dont want to do anything
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) )
		return;
	
	if (!isset($_POST['wpunity_game_cat_noncename']))
		return;
	
	// verify this came from the our screen and with proper authorization,
	// because save_post can be triggered at other times
	if ( !wp_verify_nonce( $_POST['wpunity_game_type_noncename'], plugin_basename( __FILE__ ) ) )
		return;
	
	// Check permissions
	if ( 'wpunity_game' == $_POST['post_type'] )
	{
		if ( ! ( current_user_can( 'edit_page', $post_id )  ) )
			return;
	}
	else
	{
		if ( ! ( current_user_can( 'edit_post', $post_id ) ) )
			return;
	}
	
	// OK, we're authenticated: we need to find and save the data
	$type_ID = intval($_POST['wpunity_game_type'], 10);
	
	$type = ( $type_ID > 0 ) ? get_term( $type_ID, 'wpunity_game_type' )->slug : NULL;
	
	wp_set_object_terms(  $post_id , $type, 'wpunity_game_type' );
}

function wpunity_set_custom_wpunity_game_columns($columns) {
	$columns['game_slug'] = 'Game Slug';
	
	return $columns;
}

function wpunity_set_custom_wpunity_game_columns_fill( $column, $post_id ) {
	switch ( $column ) {
		
		case 'game_slug' :
			$mypost = get_post($post_id);
			$theSlug = $mypost->post_name;
			if ( is_string( $theSlug ) )
				echo $theSlug;
			else
				echo 'no slug found';
			break;
	}
}

// Create metabox with Custom Fields for Game ($wpunity_databox3)




//Add and Show the metabox with Custom Field for Game and the Compiler Box ($wpunity_databox3)
function wpunity_games_databox_add() {
	
    global $wpunity_databox3;
	
	add_meta_box($wpunity_databox3['id'], 'Game Data', 'wpunity_games_databox_show', $wpunity_databox3['page'], $wpunity_databox3['context'], $wpunity_databox3['priority']);
	add_meta_box('wpunity-games-assembler-box', 'Game Assembler', 'wpunity_games_assemblerbox_show', 'wpunity_game', 'side', 'low'); //Compiler Box
	add_meta_box('wpunity-games-compiler-box', 'Game Compiler', 'wpunity_games_compilerbox_show', 'wpunity_game', 'side', 'low'); //Compiler Box
}

function wpunity_games_databox_show(){
	
	global $wpunity_databox3, $post;
	$DS = DIRECTORY_SEPARATOR ;
	
	// load request_game.js script from js_libs
	wp_enqueue_script( 'wpunity_compile_request');
	
	$slug = $post->post_name;
	
	// Some parameters to pass in the request_game_compile.js  ajax
	wp_localize_script('wpunity_compile_request', 'phpvarsA',
		array('pluginsUrl' => plugins_url(),
			'PHP_OS'     => PHP_OS,
			'game_dirpath'=> realpath(dirname(__FILE__).'/..').$DS.'games_assemble'.$DS.$slug,
			'game_urlpath'=> plugins_url( 'vrodos' ).'/games_assemble/'.$slug
		));
	
	// load request_game.js script from js_libs
	wp_enqueue_script( 'vrodos_assemble_request');
	
	// Some parameters to pass in the request_game_assemble.js  ajax
	wp_localize_script('vrodos_assemble_request', 'phpvarsB',
		array('pluginsUrl' => plugins_url(),
			'PHP_OS'     => PHP_OS,
			'source'=> realpath(dirname(__FILE__).'/../../..').$DS.'uploads'.$DS.$slug,
			'target'=> realpath(dirname(__FILE__).'/..').$DS.'games_assemble'.$DS.$slug,
			'game_libraries_path'=> realpath(dirname(__FILE__).'/..').$DS.'unity_game_libraries',
			'game_id'=> $post->ID
		));
	
	// Use nonce for verification
	echo '<input type="hidden" name="wpunity_games_databox_nonce" value="', wp_create_nonce(basename(__FILE__)), '" />';
	echo '<table class="form-table" id="wpunity-custom-fields-table">';
	foreach ($wpunity_databox3['fields'] as $field) {
		// get current post meta data
		$meta = get_post_meta($post->ID, $field['id'], true);
		echo '<tr>',
		'<th style="width:20%"><label for="', esc_attr($field['id']), '">', esc_html($field['name']), '</label></th>',
		'<td>';
		
		switch ($field['type']) {
			case 'text':
				echo '<input type="text" name="', esc_attr($field['id']), '" id="', esc_attr($field['id']), '" value="', esc_attr($meta ? $meta : $field['std']), '" size="30" style="width:97%" />', '<br />', esc_html($field['desc']);
				break;
			case 'numeric':
				echo '<input type="number" name="', esc_attr($field['id']), '" id="', esc_attr($field['id']), '" value="', esc_attr($meta ? $meta : $field['std']), '" size="30" style="width:97%" />', '<br />', esc_html($field['desc']);
				break;
			case 'textarea':
				echo '<textarea name="', esc_attr($field['id']), '" id="', esc_attr($field['id']), '" cols="60" rows="4" style="width:97%">', esc_attr($meta ? $meta : $field['std']), '</textarea>', '<br />', esc_html($field['desc']);
				break;
			case 'select':
				echo '<select name="', esc_attr($field['id']), '" id="', esc_attr($field['id']), '">';
				foreach ($field['options'] as $option) {
					echo '<option ', $meta == $option ? ' selected="selected"' : '', '>', esc_html($option), '</option>';
				}
				echo '</select>';
				break;
			case 'checkbox':
				echo '<input type="checkbox" name="', esc_attr($field['id']), '" id="', esc_attr($field['id']), '"', $meta ? ' checked="checked"' : '', ' />';
				break;
			
		}
		echo     '</td><td>',
		'</td></tr>';
	}
	echo '</table>';
}

// Save data from this metabox with Custom Field for Game ($wpunity_databox3)
function wpunity_games_databox_save($post_id) {
	global $wpunity_databox3;
	
	if (!isset($_POST['wpunity_games_databox_nonce']))
		return;
	
	// verify nonce
	if (!wp_verify_nonce($_POST['wpunity_games_databox_nonce'], basename(__FILE__))) {
		return $post_id;
	}
	// check autosave
	if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
		return $post_id;
	}
	// check permissions
	if ('page' == $_POST['post_type']) {
		if (!current_user_can('edit_page', $post_id)) {
			return $post_id;
		}
	} elseif (!current_user_can('edit_post', $post_id)) {
		return $post_id;
	}
	foreach ($wpunity_databox3['fields'] as $field) {
		$old = get_post_meta($post_id, $field['id'], true);
		$new = $_POST[$field['id']];
		if ($new && $new != $old) {
			update_post_meta($post_id, $field['id'], $new);
		} elseif ('' == $new && $old) {
			delete_post_meta($post_id, $field['id'], $old);
		}
	}
}

// Compiling related
function wpunity_games_compilerbox_show(){
	echo '<div id="wpunity_compileButton" onclick="wpunity_compileAjax()">Compile</div>';
	echo '<div id="wpunity_compile_report1"></div>';
	echo '<div id="wpunity_compile_report2"></div>';
	echo '<div id="wpunity_zipgame_report"></div>';
	
	echo '<br /><br />Analytic report of compile:<br />';
	echo '<div id="wpunity_compile_game_stdoutlog_report" style="font-size: x-small"></div>';
	
}

// Assemble related
function wpunity_games_assemblerbox_show(){
	echo '<div id="vrodos_assembleButton" onclick="vrodos_assembleAjax()">Assemble</div>';
	
	echo '<br /><br />Analytic report of assemble:<br />';
	echo '<div id="vrodos_assemble_report1"></div>';
	echo '<div id="vrodos_assemble_report2"></div>';
}



function vrodos_projects_taxtypes_define(){

wp_insert_term('Energy', 'wpunity_game_type', array('description' => 'Energy Games', 'slug' => 'energy_games'));

wp_insert_term('Archaeology','wpunity_game_type', array('description'=> 'Archaeology Games','slug'=>'archaeology_games'));

wp_insert_term('Chemistry','wpunity_game_type',array('description'=> 'Chemistry Games','slug' => 'chemistry_games'));

}



//--------------------------- OBSOLETE ------------------------------


//16 Settings for each Game Type as term_meta
// A callback function to add a custom field to our taxonomy
function wpunity_games_projectSettings_fields($tag) {
	?>
	<tr class="form-field">
		<th scope="row" valign="top"></th>
		<td><h2>Project Settings</h2></td>
	</tr>
	
	<?php $term_audio_manager = get_term_meta( $tag->term_id, 'wpunity_audio_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-audio_manager">
		<th scope="row" valign="top">
			<label for="wpunity_audio_manager_term">Audio Manager</label>
		</th>
		<td>
			<textarea name="wpunity_audio_manager_term" id="wpunity_audio_manager_term"><?php echo $term_audio_manager ? $term_audio_manager : ''; ?></textarea>
			<p class="description">AudioManager.asset (wpunity_audio_manager_term)</p>
		</td>
	</tr>
	
	<?php $term_cluster_input_manager = get_term_meta( $tag->term_id, 'wpunity_cluster_input_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-cluster_input_manager">
		<th scope="row" valign="top">
			<label for="wpunity_cluster_input_manager_term">Cluster Input Manager</label>
		</th>
		<td>
			<textarea name="wpunity_cluster_input_manager_term" id="wpunity_cluster_input_manager_term"><?php echo $term_cluster_input_manager ? $term_cluster_input_manager : ''; ?></textarea>
			<p class="description">ClusterInputManager.asset (wpunity_cluster_input_manager_term)</p>
		</td>
	</tr>
	
	<?php $term_dynamics_manager = get_term_meta( $tag->term_id, 'wpunity_dynamics_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-dynamics_manager">
		<th scope="row" valign="top">
			<label for="wpunity_dynamics_manager_term">Dynamics Manager</label>
		</th>
		<td>
			<textarea name="wpunity_dynamics_manager_term" id="wpunity_dynamics_manager_term"><?php echo $term_dynamics_manager ? $term_dynamics_manager : ''; ?></textarea>
			<p class="description">DynamicsManager.asset (wpunity_dynamics_manager_term)</p>
		</td>
	</tr>
	
	<?php $term_editor_build_settings = get_term_meta( $tag->term_id, 'wpunity_editor_build_settings_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-editor_build_settings">
		<th scope="row" valign="top">
			<label for="wpunity_editor_build_settings_term">Editor Build Settings</label>
		</th>
		<td>
			<textarea name="wpunity_editor_build_settings_term" id="wpunity_editor_build_settings_term"><?php echo $term_editor_build_settings ? $term_editor_build_settings : ''; ?></textarea>
			<p class="description">EditorBuildSettings.asset (wpunity_editor_build_settings_term)</p>
		</td>
	</tr>
	
	<?php $term_editor_settings = get_term_meta( $tag->term_id, 'wpunity_editor_settings_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-editor_settings">
		<th scope="row" valign="top">
			<label for="wpunity_editor_settings_term">Editor Settings</label>
		</th>
		<td>
			<textarea name="wpunity_editor_settings_term" id="wpunity_editor_settings_term"><?php echo $term_editor_settings ? $term_editor_settings : ''; ?></textarea>
			<p class="description">EditorSettings.asset (wpunity_editor_settings_term)</p>
		</td>
	</tr>
	
	<?php $term_graphics_settings = get_term_meta( $tag->term_id, 'wpunity_graphics_settings_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-graphics_settings">
		<th scope="row" valign="top">
			<label for="wpunity_graphics_settings_term">Graphics Settings</label>
		</th>
		<td>
			<textarea name="wpunity_graphics_settings_term" id="wpunity_graphics_settings_term"><?php echo $term_graphics_settings ? $term_graphics_settings : ''; ?></textarea>
			<p class="description">GraphicsSettings.asset (wpunity_graphics_settings_term)</p>
		</td>
	</tr>
	
	<?php $term_input_manager = get_term_meta( $tag->term_id, 'wpunity_input_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-input_manager">
		<th scope="row" valign="top">
			<label for="wpunity_input_manager_term">Input Manager</label>
		</th>
		<td>
			<textarea name="wpunity_input_manager_term" id="wpunity_input_manager_term"><?php echo $term_input_manager ? $term_input_manager : ''; ?></textarea>
			<p class="description">InputManager.asset (wpunity_input_manager_term)</p>
		</td>
	</tr>
	
	<?php $term_nav_mesh_areas = get_term_meta( $tag->term_id, 'wpunity_nav_mesh_areas_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-nav_mesh_areas">
		<th scope="row" valign="top">
			<label for="wpunity_nav_mesh_areas_term">Nav Mesh Areas</label>
		</th>
		<td>
			<textarea name="wpunity_nav_mesh_areas_term" id="wpunity_nav_mesh_areas_term"><?php echo $term_nav_mesh_areas ? $term_nav_mesh_areas : ''; ?></textarea>
			<p class="description">NavMeshAreas.asset (wpunity_nav_mesh_areas_term)</p>
		</td>
	</tr>
	
	<?php $term_network_manager = get_term_meta( $tag->term_id, 'wpunity_network_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-network_manager">
		<th scope="row" valign="top">
			<label for="wpunity_network_manager_term">Network Manager</label>
		</th>
		<td>
			<textarea name="wpunity_network_manager_term" id="wpunity_network_manager_term"><?php echo $term_network_manager ? $term_network_manager : ''; ?></textarea>
			<p class="description">NetworkManager.asset (wpunity_network_manager_term)</p>
		</td>
	</tr>
	
	<?php $term_physics2d_settings = get_term_meta( $tag->term_id, 'vrodos_physics2d_settings_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-physics2d_settings">
		<th scope="row" valign="top">
			<label for="vrodos_physics2d_settings_term">Physics2D Settings</label>
		</th>
		<td>
			<textarea name="vrodos_physics2d_settings_term" id="vrodos_physics2d_settings_term"><?php echo $term_physics2d_settings ? $term_physics2d_settings : ''; ?></textarea>
			<p class="description">Physics2DSettings.asset (vrodos_physics2d_settings_term)</p>
		</td>
	</tr>
	
	<?php $project_settings = get_term_meta( $tag->term_id, 'vrodos_project_settings_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-project_settings">
		<th scope="row" valign="top">
			<label for="vrodos_project_settings_term">Project Settings</label>
		</th>
		<td>
			<textarea name="vrodos_project_settings_term" id="vrodos_project_settings_term"><?php echo $project_settings ? $project_settings : ''; ?></textarea>
			<p class="description">ProjectSettings.asset (vrodos_project_settings_term)</p>
		</td>
	</tr>
	
	<?php $project_version = get_term_meta( $tag->term_id, 'vrodos_project_version_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-project_version">
		<th scope="row" valign="top">
			<label for="vrodos_project_version_term">Project Version</label>
		</th>
		<td>
			<textarea name="vrodos_project_version_term" id="vrodos_project_version_term"><?php echo $project_version ? $project_version : ''; ?></textarea>
			<p class="description">ProjectVersion.asset (vrodos_project_version_term)</p>
		</td>
	</tr>
	
	<?php $quality_settings = get_term_meta( $tag->term_id, 'wpunity_quality_settings_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-quality_settings">
		<th scope="row" valign="top">
			<label for="wpunity_quality_settings_term">Quality Settings</label>
		</th>
		<td>
			<textarea name="wpunity_quality_settings_term" id="wpunity_quality_settings_term"><?php echo $quality_settings ? $quality_settings : ''; ?></textarea>
			<p class="description">QualitySettings.asset (wpunity_quality_settings_term)</p>
		</td>
	</tr>
	
	<?php $term_tag_manager = get_term_meta( $tag->term_id, 'wpunity_tag_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-tag_manager">
		<th scope="row" valign="top">
			<label for="wpunity_tag_manager_term">Tag Manager</label>
		</th>
		<td>
			<textarea name="wpunity_tag_manager_term" id="wpunity_tag_manager_term"><?php echo $term_tag_manager ? $term_tag_manager : ''; ?></textarea>
			<p class="description">TagManager.asset (wpunity_tag_manager_term)</p>
		</td>
	</tr>
	
	<?php $term_time_manager = get_term_meta( $tag->term_id, 'wpunity_time_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-time_manager">
		<th scope="row" valign="top">
			<label for="wpunity_time_manager_term">Time Manager</label>
		</th>
		<td>
			<textarea name="wpunity_time_manager_term" id="wpunity_time_manager_term"><?php echo $term_time_manager ? $term_time_manager : ''; ?></textarea>
			<p class="description">TimeManager.asset (wpunity_time_manager_term)</p>
		</td>
	</tr>
	
	<?php $unity_connect_settings = get_term_meta( $tag->term_id, 'wpunity_unity_connect_settings_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-unity_connect_settings">
		<th scope="row" valign="top">
			<label for="wpunity_unity_connect_settings_term">Unity Connect Settings</label>
		</th>
		<td>
			<textarea name="wpunity_unity_connect_settings_term" id="wpunity_unity_connect_settings_term"><?php echo $unity_connect_settings ? $unity_connect_settings : ''; ?></textarea>
			<p class="description">UnityConnectSettings.asset (wpunity_unity_connect_settings_term)</p>
		</td>
	</tr>
	
	<?php
}

// Save our extra taxonomy fields
function wpunity_games_projectSettings_fields_save( $term_id ) {
	
	if ( isset( $_POST['wpunity_audio_manager_term'] ) ) {
		$term_audio_manager = $_POST['wpunity_audio_manager_term'];
		update_term_meta($term_id, 'wpunity_audio_manager_term', $term_audio_manager);
	}
	
	if ( isset( $_POST['wpunity_cluster_input_manager_term'] ) ) {
		$term_cluster_input_manager = $_POST['wpunity_cluster_input_manager_term'];
		update_term_meta($term_id, 'wpunity_cluster_input_manager_term', $term_cluster_input_manager);
	}
	
	if ( isset( $_POST['wpunity_dynamics_manager_term'] ) ) {
		$term_dynamics_manager = $_POST['wpunity_dynamics_manager_term'];
		update_term_meta($term_id, 'wpunity_dynamics_manager_term', $term_dynamics_manager);
	}
	
	if ( isset( $_POST['wpunity_editor_build_settings_term'] ) ) {
		$term_editor_build_settings = $_POST['wpunity_editor_build_settings_term'];
		update_term_meta($term_id, 'wpunity_editor_build_settings_term', $term_editor_build_settings);
	}
	
	if ( isset( $_POST['wpunity_editor_settings_term'] ) ) {
		$term_editor_settings = $_POST['wpunity_editor_settings_term'];
		update_term_meta($term_id, 'wpunity_editor_settings_term', $term_editor_settings);
	}
	
	if ( isset( $_POST['wpunity_graphics_settings_term'] ) ) {
		$term_graphics_settings = $_POST['wpunity_graphics_settings_term'];
		update_term_meta($term_id, 'wpunity_graphics_settings_term', $term_graphics_settings);
	}
	
	if ( isset( $_POST['wpunity_input_manager_term'] ) ) {
		$term_input_manager = $_POST['wpunity_input_manager_term'];
		update_term_meta($term_id, 'wpunity_input_manager_term', $term_input_manager);
	}
	
	if ( isset( $_POST['wpunity_nav_mesh_areas_term'] ) ) {
		$term_nav_mesh_areas = $_POST['wpunity_nav_mesh_areas_term'];
		update_term_meta($term_id, 'wpunity_nav_mesh_areas_term', $term_nav_mesh_areas);
	}
	
	if ( isset( $_POST['wpunity_network_manager_term'] ) ) {
		$term_network_manager = $_POST['wpunity_network_manager_term'];
		update_term_meta($term_id, 'wpunity_network_manager_term', $term_network_manager);
	}
	
	if ( isset( $_POST['vrodos_physics2d_settings_term'] ) ) {
		$term_physics2d_settings = $_POST['vrodos_physics2d_settings_term'];
		update_term_meta($term_id, 'vrodos_physics2d_settings_term', $term_physics2d_settings);
	}
	
	if ( isset( $_POST['vrodos_project_settings_term'] ) ) {
		$term_project_settings = $_POST['vrodos_project_settings_term'];
		update_term_meta($term_id, 'vrodos_project_settings_term', $term_project_settings);
	}
	
	if ( isset( $_POST['vrodos_project_version_term'] ) ) {
		$term_project_version = $_POST['vrodos_project_version_term'];
		update_term_meta($term_id, 'vrodos_project_version_term', $term_project_version);
	}
	
	if ( isset( $_POST['wpunity_quality_settings_term'] ) ) {
		$term_quality_settings = $_POST['wpunity_quality_settings_term'];
		update_term_meta($term_id, 'wpunity_quality_settings_term', $term_quality_settings);
	}
	
	if ( isset( $_POST['wpunity_tag_manager_term'] ) ) {
		$term_tag_manager = $_POST['wpunity_tag_manager_term'];
		update_term_meta($term_id, 'wpunity_tag_manager_term', $term_tag_manager);
	}
	
	if ( isset( $_POST['wpunity_time_manager_term'] ) ) {
		$term_time_manager = $_POST['wpunity_time_manager_term'];
		update_term_meta($term_id, 'wpunity_time_manager_term', $term_time_manager);
	}
	
	if ( isset( $_POST['wpunity_unity_connect_settings_term'] ) ) {
		$term_unity_connect_settings = $_POST['wpunity_unity_connect_settings_term'];
		update_term_meta($term_id, 'wpunity_unity_connect_settings_term', $term_unity_connect_settings);
	}
}

//add_action( 'wpunity_game_type_edit_form_fields', 'wpunity_games_projectSettings_fields', 10, 2 );
//add_action( 'edited_wpunity_game_type', 'wpunity_games_projectSettings_fields_save', 10, 2 );



?>
