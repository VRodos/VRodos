<?php

//All information about our meta box
$vrodos_databox3 = array(
	'id' => 'vrodos-projects-databox',
	'page' => 'vrodos_game',
	'context' => 'normal',
	'priority' => 'high',
	'fields' => array(
		array(
			'name' => 'Latitude',
			'desc' => 'Project\'s Latitude',
			'id' => 'vrodos_game_lat',
			'type' => 'text',
			'std' => ''
		),
		array(
			'name' => 'Longitude',
			'desc' => 'Project\'s Longitude',
			'id' => 'vrodos_game_lng',
			'type' => 'text',
			'std' => ''
		),array(
			'name' => 'collaborators_ids',
			'desc' => 'ids of collaborators starting separated and ending by semicolon',
			'id' => 'vrodos_project_collaborators_ids',
			'type' => 'text',
			'std' => ""
		)
	)
);


// Create  custom post type 'vrodos_game'
function vrodos_project_cpt_construct(){

//    $ff = fopen("output_order_log.txt","a");
//    fwrite($ff, '7 vrodos_games_construct'.chr(13));
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
		'show_in_menu'          => false,
		'menu_position'     => 26,
		'menu_icon'         =>'dashicons-media-interactive',
		'taxonomies'        => array('vrodos_game_type'),
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
 
	register_post_type('vrodos_game', $args);
}


//Create Game Type as custom taxonomy 'vrodos_game_type'
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
	
	register_taxonomy('vrodos_game_type', 'vrodos_game', $args);
}


// Generate Taxonomy (for scenes & assets) with Game's slug/name
// Create Default Scenes for this "Game"
function vrodos_create_folder_game( $new_status, $old_status, $post){

	$post_type = get_post_type($post);
	$projectSlug = $post->post_name;

	global $project_scope;

	if ($post_type == 'vrodos_game' && $new_status == 'publish') {

//        $fh = fopen("output_folder_Game.txt","a");
//        fwrite($fh, $post_type . " " . $new_status ." ". $projectSlug .'\n' );
//        fclose($fh);

		if(($projectSlug != 'archaeology-joker') && ($projectSlug != 'energy-joker') && ($projectSlug != 'chemistry-joker')){

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
					'slug' => $projectSlug,
				)
			);

			//Create a parent game tax category for the assets
			wp_insert_term($gameTitle,'vrodos_asset3d_pgame',array(
					'description'=> '-',
					'slug' => $projectSlug,
				)
			);

			//Create Default Scenes for this "Game"
			vrodos_create_default_scenes_for_game($projectSlug, $gameTitle, $gameID);

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
			update_post_meta($gameID, 'vrodos_exam_enabled_molecules', $allMolecules);


			//Create Sample Data (assets) for the game that auto-created
			$current_user = wp_get_current_user();
			$user_id = $current_user->ID;
			$username = $current_user->user_login;
			//vrodos_registrationhook_createAssets($user_id,$username,$gameID);
			//MALTA remove comments

			// Request keys from GIO
			if ($project_scope === 1) {
				vrodos_createGame_GIO_request( $gameID , $user_id );
			}

        }else{
			$gameTitle = $post->post_title;
			//Create a parent game tax category for the assets
			wp_insert_term($gameTitle,'vrodos_asset3d_pgame',$projectSlug,'Asset of a Game');
		}
	}
}



//Create Game Category Box @ Game's backend
function vrodos_games_taxcategory_box() {
    
    remove_meta_box( 'vrodos_game_typediv', 'vrodos_game', 'side' ); //Removes the default metabox at side
    add_meta_box( 'tagsdiv-vrodos_game_type','Game Type','vrodos_projects_taxtype_box_content', 'vrodos_game', 'side' , 'high'); //Adds the custom metabox with select box
}



function vrodos_projects_taxtype_box_content($post){
	$tax_name = 'vrodos_game_type';
	?>
	<div class="tagsdiv" id="<?php echo $tax_name; ?>">
		
		<p class="howto"><?php echo 'Select type for current project' ?></p>
		
		<?php
		// Use nonce for verification
		wp_nonce_field( plugin_basename( __FILE__ ), 'vrodos_game_type_noncename' );
		
		$type_IDs = wp_get_object_terms( $post->ID, 'vrodos_game_type', array('fields' => 'ids') );
		
//		$ff = fopen("output_p1.txt","w");
//		fwrite($ff, print_r($type_IDs, true));
//		fclose($ff);
//		//echo $type_IDs;
		
		$args = array(
			'show_option_none'   => 'Select Type',
			'orderby'            => 'name',
			'hide_empty'         => 0,
			'selected'           => $type_IDs[0],
			'name'               => 'vrodos_game_type',
			'taxonomy'           => 'vrodos_game_type',
			'echo'               => 0,
			'option_none_value'  => '-1',
			'id' => 'vrodos-select-type-dropdown'
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


function vrodos_games_taxtype_box_content_save( $post_id ) {
	
	global $wpdb;
	
	// verify if this is an auto save routine.
	// If it is our form has not been submitted, so we dont want to do anything
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) )
		return;
	
	if (!isset($_POST['vrodos_game_cat_noncename']))
		return;
	
	// verify this came from the our screen and with proper authorization,
	// because save_post can be triggered at other times
	if ( !wp_verify_nonce( $_POST['vrodos_game_type_noncename'], plugin_basename( __FILE__ ) ) )
		return;
	
	// Check permissions
	if ( 'vrodos_game' == $_POST['post_type'] )
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
	$type_ID = intval($_POST['vrodos_game_type'], 10);
	
	$type = ( $type_ID > 0 ) ? get_term( $type_ID, 'vrodos_game_type' )->slug : NULL;
	
	wp_set_object_terms(  $post_id , $type, 'vrodos_game_type' );
}

function vrodos_set_custom_vrodos_game_columns($columns) {
	$columns['game_slug'] = 'Game Slug';
	
	return $columns;
}

function vrodos_set_custom_vrodos_game_columns_fill( $column, $post_id ) {
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

// Create metabox with Custom Fields for Game ($vrodos_databox3)




//Add and Show the metabox with Custom Field for Game and the Compiler Box ($vrodos_databox3)
function vrodos_games_databox_add() {

    global $vrodos_databox3;

    add_meta_box($vrodos_databox3['id'], 'Game Data', 'vrodos_games_databox_show',
                 $vrodos_databox3['page'], $vrodos_databox3['context'], $vrodos_databox3['priority']);

    add_meta_box('vrodos-games-assembler-box', 'Game Assembler', 'vrodos_games_assemblerbox_show', 'vrodos_game', 'side', 'low'); //Compiler Box

    add_meta_box('vrodos-games-compiler-box', 'Game Compiler', 'vrodos_games_compilerbox_show', 'vrodos_game', 'side', 'low'); //Compiler Box
}

function vrodos_games_databox_show(){
	
	global $vrodos_databox3, $post;
	$DS = DIRECTORY_SEPARATOR ;
	
	// load request_game.js script from js_libs
	wp_enqueue_script( 'vrodos_compile_request');
	
	$slug = $post->post_name;
	
	// Some parameters to pass in the request_game_compile.js  ajax
	wp_localize_script('vrodos_compile_request', 'phpvarsA',
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
	echo '<input type="hidden" name="vrodos_games_databox_nonce" value="', wp_create_nonce(basename(__FILE__)), '" />';
	echo '<table class="form-table" id="vrodos-custom-fields-table">';
	foreach ($vrodos_databox3['fields'] as $field) {
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

// Save data from this metabox with Custom Field for Game ($vrodos_databox3)
function vrodos_games_databox_save($post_id) {
	global $vrodos_databox3;
	
	if (!isset($_POST['vrodos_games_databox_nonce']))
		return;
	
	// verify nonce
	if (!wp_verify_nonce($_POST['vrodos_games_databox_nonce'], basename(__FILE__))) {
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
	foreach ($vrodos_databox3['fields'] as $field) {
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
function vrodos_games_compilerbox_show(){
	echo '<div id="vrodos_compileButton" onclick="vrodos_compileAjax()">Compile</div>';
	echo '<div id="vrodos_compile_report1"></div>';
	echo '<div id="vrodos_compile_report2"></div>';
	echo '<div id="vrodos_zipgame_report"></div>';
	
	echo '<br /><br />Analytic report of compile:<br />';
	echo '<div id="vrodos_compile_game_stdoutlog_report" style="font-size: x-small"></div>';
	
}

// Assemble related
function vrodos_games_assemblerbox_show(){
	echo '<div id="vrodos_assembleButton" onclick="vrodos_assembleAjax()">Assemble</div>';
	
	echo '<br /><br />Analytic report of assemble:<br />';
	echo '<div id="vrodos_assemble_report1"></div>';
	echo '<div id="vrodos_assemble_report2"></div>';
}



function vrodos_projects_taxtypes_define(){

    wp_insert_term('Energy', 'vrodos_game_type', array('description' => 'Energy Games', 'slug' => 'energy_games'));

    wp_insert_term('Archaeology','vrodos_game_type', array('description'=> 'Archaeology Games','slug'=>'archaeology_games'));

    wp_insert_term('Chemistry','vrodos_game_type',array('description'=> 'Chemistry Games','slug' => 'chemistry_games'));
	
	wp_insert_term('VR Exhibition','vrodos_game_type', array('description'=> 'Exhibitions in 3D','slug'=>'vrexpo_games'));
	
	wp_insert_term('Theatre','vrodos_game_type', array('description'=> 'Archaeology Games','slug'=>'theatre_games'));

}



//--------------------------- OBSOLETE ------------------------------


//16 Settings for each Game Type as term_meta
// A callback function to add a custom field to our taxonomy
function vrodos_games_projectSettings_fields($tag) {
	?>
	<tr class="form-field">
		<th scope="row" valign="top"></th>
		<td><h2>Project Settings</h2></td>
	</tr>
	
	<?php $term_audio_manager = get_term_meta( $tag->term_id, 'vrodos_audio_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-audio_manager">
		<th scope="row" valign="top">
			<label for="vrodos_audio_manager_term">Audio Manager</label>
		</th>
		<td>
			<textarea name="vrodos_audio_manager_term" id="vrodos_audio_manager_term"><?php echo $term_audio_manager ? $term_audio_manager : ''; ?></textarea>
			<p class="description">AudioManager.asset (vrodos_audio_manager_term)</p>
		</td>
	</tr>
	
	<?php $term_cluster_input_manager = get_term_meta( $tag->term_id, 'vrodos_cluster_input_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-cluster_input_manager">
		<th scope="row" valign="top">
			<label for="vrodos_cluster_input_manager_term">Cluster Input Manager</label>
		</th>
		<td>
			<textarea name="vrodos_cluster_input_manager_term" id="vrodos_cluster_input_manager_term"><?php echo $term_cluster_input_manager ? $term_cluster_input_manager : ''; ?></textarea>
			<p class="description">ClusterInputManager.asset (vrodos_cluster_input_manager_term)</p>
		</td>
	</tr>
	
	<?php $term_dynamics_manager = get_term_meta( $tag->term_id, 'vrodos_dynamics_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-dynamics_manager">
		<th scope="row" valign="top">
			<label for="vrodos_dynamics_manager_term">Dynamics Manager</label>
		</th>
		<td>
			<textarea name="vrodos_dynamics_manager_term" id="vrodos_dynamics_manager_term"><?php echo $term_dynamics_manager ? $term_dynamics_manager : ''; ?></textarea>
			<p class="description">DynamicsManager.asset (vrodos_dynamics_manager_term)</p>
		</td>
	</tr>
	
	<?php $term_editor_build_settings = get_term_meta( $tag->term_id, 'vrodos_editor_build_settings_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-editor_build_settings">
		<th scope="row" valign="top">
			<label for="vrodos_editor_build_settings_term">Editor Build Settings</label>
		</th>
		<td>
			<textarea name="vrodos_editor_build_settings_term" id="vrodos_editor_build_settings_term"><?php echo $term_editor_build_settings ? $term_editor_build_settings : ''; ?></textarea>
			<p class="description">EditorBuildSettings.asset (vrodos_editor_build_settings_term)</p>
		</td>
	</tr>
	
	<?php $term_editor_settings = get_term_meta( $tag->term_id, 'vrodos_editor_settings_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-editor_settings">
		<th scope="row" valign="top">
			<label for="vrodos_editor_settings_term">Editor Settings</label>
		</th>
		<td>
			<textarea name="vrodos_editor_settings_term" id="vrodos_editor_settings_term"><?php echo $term_editor_settings ? $term_editor_settings : ''; ?></textarea>
			<p class="description">EditorSettings.asset (vrodos_editor_settings_term)</p>
		</td>
	</tr>
	
	<?php $term_graphics_settings = get_term_meta( $tag->term_id, 'vrodos_graphics_settings_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-graphics_settings">
		<th scope="row" valign="top">
			<label for="vrodos_graphics_settings_term">Graphics Settings</label>
		</th>
		<td>
			<textarea name="vrodos_graphics_settings_term" id="vrodos_graphics_settings_term"><?php echo $term_graphics_settings ? $term_graphics_settings : ''; ?></textarea>
			<p class="description">GraphicsSettings.asset (vrodos_graphics_settings_term)</p>
		</td>
	</tr>
	
	<?php $term_input_manager = get_term_meta( $tag->term_id, 'vrodos_input_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-input_manager">
		<th scope="row" valign="top">
			<label for="vrodos_input_manager_term">Input Manager</label>
		</th>
		<td>
			<textarea name="vrodos_input_manager_term" id="vrodos_input_manager_term"><?php echo $term_input_manager ? $term_input_manager : ''; ?></textarea>
			<p class="description">InputManager.asset (vrodos_input_manager_term)</p>
		</td>
	</tr>
	
	<?php $term_nav_mesh_areas = get_term_meta( $tag->term_id, 'vrodos_nav_mesh_areas_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-nav_mesh_areas">
		<th scope="row" valign="top">
			<label for="vrodos_nav_mesh_areas_term">Nav Mesh Areas</label>
		</th>
		<td>
			<textarea name="vrodos_nav_mesh_areas_term" id="vrodos_nav_mesh_areas_term"><?php echo $term_nav_mesh_areas ? $term_nav_mesh_areas : ''; ?></textarea>
			<p class="description">NavMeshAreas.asset (vrodos_nav_mesh_areas_term)</p>
		</td>
	</tr>
	
	<?php $term_network_manager = get_term_meta( $tag->term_id, 'vrodos_network_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-network_manager">
		<th scope="row" valign="top">
			<label for="vrodos_network_manager_term">Network Manager</label>
		</th>
		<td>
			<textarea name="vrodos_network_manager_term" id="vrodos_network_manager_term"><?php echo $term_network_manager ? $term_network_manager : ''; ?></textarea>
			<p class="description">NetworkManager.asset (vrodos_network_manager_term)</p>
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
	
	<?php $quality_settings = get_term_meta( $tag->term_id, 'vrodos_quality_settings_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-quality_settings">
		<th scope="row" valign="top">
			<label for="vrodos_quality_settings_term">Quality Settings</label>
		</th>
		<td>
			<textarea name="vrodos_quality_settings_term" id="vrodos_quality_settings_term"><?php echo $quality_settings ? $quality_settings : ''; ?></textarea>
			<p class="description">QualitySettings.asset (vrodos_quality_settings_term)</p>
		</td>
	</tr>
	
	<?php $term_tag_manager = get_term_meta( $tag->term_id, 'vrodos_tag_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-tag_manager">
		<th scope="row" valign="top">
			<label for="vrodos_tag_manager_term">Tag Manager</label>
		</th>
		<td>
			<textarea name="vrodos_tag_manager_term" id="vrodos_tag_manager_term"><?php echo $term_tag_manager ? $term_tag_manager : ''; ?></textarea>
			<p class="description">TagManager.asset (vrodos_tag_manager_term)</p>
		</td>
	</tr>
	
	<?php $term_time_manager = get_term_meta( $tag->term_id, 'vrodos_time_manager_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-time_manager">
		<th scope="row" valign="top">
			<label for="vrodos_time_manager_term">Time Manager</label>
		</th>
		<td>
			<textarea name="vrodos_time_manager_term" id="vrodos_time_manager_term"><?php echo $term_time_manager ? $term_time_manager : ''; ?></textarea>
			<p class="description">TimeManager.asset (vrodos_time_manager_term)</p>
		</td>
	</tr>
	
	<?php $unity_connect_settings = get_term_meta( $tag->term_id, 'vrodos_unity_connect_settings_term', true );// Check for existing taxonomy meta for the term you're editing ?>
	
	<tr class="form-field term-unity_connect_settings">
		<th scope="row" valign="top">
			<label for="vrodos_unity_connect_settings_term">Unity Connect Settings</label>
		</th>
		<td>
			<textarea name="vrodos_unity_connect_settings_term" id="vrodos_unity_connect_settings_term"><?php echo $unity_connect_settings ? $unity_connect_settings : ''; ?></textarea>
			<p class="description">UnityConnectSettings.asset (vrodos_unity_connect_settings_term)</p>
		</td>
	</tr>
	
	<?php
}

// Save our extra taxonomy fields
function vrodos_games_projectSettings_fields_save( $term_id ) {
	
	if ( isset( $_POST['vrodos_audio_manager_term'] ) ) {
		$term_audio_manager = $_POST['vrodos_audio_manager_term'];
		update_term_meta($term_id, 'vrodos_audio_manager_term', $term_audio_manager);
	}
	
	if ( isset( $_POST['vrodos_cluster_input_manager_term'] ) ) {
		$term_cluster_input_manager = $_POST['vrodos_cluster_input_manager_term'];
		update_term_meta($term_id, 'vrodos_cluster_input_manager_term', $term_cluster_input_manager);
	}
	
	if ( isset( $_POST['vrodos_dynamics_manager_term'] ) ) {
		$term_dynamics_manager = $_POST['vrodos_dynamics_manager_term'];
		update_term_meta($term_id, 'vrodos_dynamics_manager_term', $term_dynamics_manager);
	}
	
	if ( isset( $_POST['vrodos_editor_build_settings_term'] ) ) {
		$term_editor_build_settings = $_POST['vrodos_editor_build_settings_term'];
		update_term_meta($term_id, 'vrodos_editor_build_settings_term', $term_editor_build_settings);
	}
	
	if ( isset( $_POST['vrodos_editor_settings_term'] ) ) {
		$term_editor_settings = $_POST['vrodos_editor_settings_term'];
		update_term_meta($term_id, 'vrodos_editor_settings_term', $term_editor_settings);
	}
	
	if ( isset( $_POST['vrodos_graphics_settings_term'] ) ) {
		$term_graphics_settings = $_POST['vrodos_graphics_settings_term'];
		update_term_meta($term_id, 'vrodos_graphics_settings_term', $term_graphics_settings);
	}
	
	if ( isset( $_POST['vrodos_input_manager_term'] ) ) {
		$term_input_manager = $_POST['vrodos_input_manager_term'];
		update_term_meta($term_id, 'vrodos_input_manager_term', $term_input_manager);
	}
	
	if ( isset( $_POST['vrodos_nav_mesh_areas_term'] ) ) {
		$term_nav_mesh_areas = $_POST['vrodos_nav_mesh_areas_term'];
		update_term_meta($term_id, 'vrodos_nav_mesh_areas_term', $term_nav_mesh_areas);
	}
	
	if ( isset( $_POST['vrodos_network_manager_term'] ) ) {
		$term_network_manager = $_POST['vrodos_network_manager_term'];
		update_term_meta($term_id, 'vrodos_network_manager_term', $term_network_manager);
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
	
	if ( isset( $_POST['vrodos_quality_settings_term'] ) ) {
		$term_quality_settings = $_POST['vrodos_quality_settings_term'];
		update_term_meta($term_id, 'vrodos_quality_settings_term', $term_quality_settings);
	}
	
	if ( isset( $_POST['vrodos_tag_manager_term'] ) ) {
		$term_tag_manager = $_POST['vrodos_tag_manager_term'];
		update_term_meta($term_id, 'vrodos_tag_manager_term', $term_tag_manager);
	}
	
	if ( isset( $_POST['vrodos_time_manager_term'] ) ) {
		$term_time_manager = $_POST['vrodos_time_manager_term'];
		update_term_meta($term_id, 'vrodos_time_manager_term', $term_time_manager);
	}
	
	if ( isset( $_POST['vrodos_unity_connect_settings_term'] ) ) {
		$term_unity_connect_settings = $_POST['vrodos_unity_connect_settings_term'];
		update_term_meta($term_id, 'vrodos_unity_connect_settings_term', $term_unity_connect_settings);
	}
}

//add_action( 'vrodos_game_type_edit_form_fields', 'vrodos_games_projectSettings_fields', 10, 2 );
//add_action( 'edited_vrodos_game_type', 'vrodos_games_projectSettings_fields_save', 10, 2 );



?>
