<?php

/*
 *    FRONT END MENU ---------------
 */

// Display Login/Logout in menu
function vrodos_loginout_menu_link( $menu, $args ) {
	$menu .= '<li class="nav-menu" class="menu-item">'.wp_loginout($_SERVER['REQUEST_URI'], false ).'</li>';
	return $menu;
}


// Nav menu : Add Scene-3d-view with parameters
function vrodos_add_scene_id_to_scene_as_menu_item($item_id ) {
	
	$scene_id = get_post_meta( $item_id, '_scene_id', true );
	
	?>
	<div style="clear: both;">
		<span class="description" style="font-style: oblique">VRodos 3D scene menu</span><br />
		<span class="description">Scene to load</span><br />
		
		<input type="hidden"
		       class="nav-menu-id"
		       value="<?php echo $item_id ;?>"
		/>
		
		<div class="logged-input-holder">
			
			<select
				name = "scene_id[<?php echo $item_id ;?>]"
				id   = "scene-id-<?php echo $item_id ;?>"
				class="widefat"
			>
				<option value=""></option>
				
				
				<?php $scenes = get_scenes_wonder_around();
				
				// Iterate for the drop down
				for ($i=0;$i<count($scenes);$i++){
					
					echo '<option value="'.$scenes[$i]['sceneid'].'" '.
					     (esc_attr( $scene_id ) == $scenes[$i]['sceneid']?'selected':'').'>'.
					     $scenes[$i]['sceneName'].
					     ' of '.$scenes[$i]['scene_parent_project'][0]->name.'</option>';
				}
				?>
			</select>
		
		
		
		
		
		</div>
	</div>
	<?php
}


function save_menu_item_desc( $menu_id, $menu_item_db_id ) {
	
	if ( isset( $_POST['scene_id'][$menu_item_db_id]  ) ) {
		
		$sanitized_data = sanitize_text_field( $_POST['scene_id'][$menu_item_db_id] );
		
		update_post_meta( $menu_item_db_id, '_scene_id', $sanitized_data );
		
	} else {
		
		delete_post_meta( $menu_item_db_id, '_scene_id' );
		
	}
}



function nav_items( $items, $menu, $args )
{
	if( is_admin() )
		return $items;
	
	foreach( $items as $item )
	{
		$scene_id = get_post_meta( $item->ID, '_scene_id', true );
		
		if ( ! empty( $scene_id ) ) {
			$item->url .= '?vrodos_scene=' . $scene_id;
		}
	}
	return $items;
}

/*
 *    BACK END MENU
 */
function vrodos_plugin_menu(){
	add_menu_page( 'VRodos Plugin Page',
		'VRodos',
		'manage_options',
		'vrodos-plugin',
		'vrodos_plugin_main_page',
		plugin_dir_url( __FILE__ ) . '../images/vrodos_icon_20_w.png',
		25);
	
	
	add_submenu_page('vrodos-plugin',
		'Projects',
		'Projects',
		'manage_options',
		'edit.php?post_type=vrodos_game'
	);
	
	add_submenu_page('vrodos-plugin',
		'Scenes',
		'Scenes',
		'manage_options',
		'edit.php?post_type=vrodos_scene'
	);
	
	
	add_submenu_page('vrodos-plugin',
		'Assets',
		'Assets',
		'manage_options',
		'edit.php?post_type=vrodos_asset3d');
	
	
	add_submenu_page('vrodos-plugin',
		'Scene Types',
		'Scene Types',
		'manage_options',
		'edit-tags.php?post_type=vrodos_scene&taxonomy=vrodos_scene_yaml');
	
	
	add_submenu_page('vrodos-plugin',
		'Scenes Parent Projects',
		'Scenes Parent Projects',
		'manage_options',
		'edit-tags.php?post_type=vrodos_scene&taxonomy=vrodos_scene_pgame');
	
	
	add_submenu_page('vrodos-plugin',
		'Project Types',
		'Project Types',
		'manage_options',
		'edit-tags.php?post_type=vrodos_game&taxonomy=vrodos_game_type');
	
	add_submenu_page('vrodos-plugin',
		'Asset Types',
		'Asset Types',
		'manage_options',
		'edit-tags.php?post_type=vrodos_asset3d&taxonomy=vrodos_asset3d_cat');
	
	add_submenu_page('vrodos-plugin',
		'Asset Projects',
		'Asset Projects',
		'manage_options',
		'edit-tags.php?post_type=vrodos_asset3d&taxonomy=vrodos_asset3d_pgame');
	
	add_submenu_page('vrodos-plugin',
		'Asset IPR',
		'Asset IPR',
		'manage_options',
		'edit-tags.php?post_type=vrodos_asset3d&taxonomy=vrodos_asset3d_ipr_cat');
	
}


function keep_taxonomy_menu_open($parent_file) {
	global $current_screen;
	$taxonomy = $current_screen->taxonomy;
	if ($taxonomy == 'vrodos_scene_yaml' || $taxonomy == 'vrodos_scene_pgame' || $taxonomy == 'vrodos_game_type' ||
	    $taxonomy == 'vrodos_asset3d_cat' || $taxonomy == 'vrodos_asset3d_cat' ||  $taxonomy == 'vrodos_asset3d_pgame' ||
	    $taxonomy == 'vrodos_asset3d_ipr_cat'
	)
		$parent_file = 'vrodos-plugin';
	return $parent_file;
}

