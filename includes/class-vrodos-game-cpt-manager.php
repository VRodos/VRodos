<?php

class VRodos_Game_CPT_Manager {

    public function __construct() {
        add_action('transition_post_status', array($this, 'on_create_project'), 10, 3);
        add_action('add_meta_boxes', array($this, 'games_taxcategory_box'));
        add_action('save_post', array($this, 'games_taxtype_box_content_save'));
        add_filter('manage_vrodos_game_posts_columns', array($this, 'set_custom_vrodos_game_columns'));
        add_action('manage_vrodos_game_posts_custom_column', array($this, 'set_custom_vrodos_game_columns_fill'), 10, 2);
        add_action('add_meta_boxes', array($this, 'games_databox_add'));

        // Set to the lowest priority in order to have game taxes available when joker games are created
        add_action( 'init', array($this, 'vrodos_create_joker_projects'), 100, 2 );
    }

    public function vrodos_create_joker_projects() {

        $userID = get_current_user_id();

        if (!VRodos_Core_Manager::vrodos_the_slug_exists('archaeology-joker')) {

            $tax_slug = 'archaeology_games';
            $post_title = 'Archaeology Joker';
            $post_name = 'archaeology-joker';

            $this->create_post_project_joker($tax_slug, $post_title, $post_name, $userID);
        }

        if (!VRodos_Core_Manager::vrodos_the_slug_exists('vrexpo-joker')) {

            $tax_slug = 'vrexpo_games';
            $post_title = 'VRExpo Joker';
            $post_name = 'vrexpo-joker';

            $this->create_post_project_joker($tax_slug, $post_title, $post_name, $userID);
        }

        if (!VRodos_Core_Manager::vrodos_the_slug_exists('virtualproduction-joker')) {

            $tax_slug = 'virtualproduction_games';
            $post_title = 'Virtual Production Joker';
            $post_name = 'virtualproduction-joker';

            $this->create_post_project_joker($tax_slug, $post_title, $post_name, $userID);
        }
    }

    public function create_post_project_joker($tax_slug, $post_title, $post_name, $userID){

        $tax = get_term_by('slug', $tax_slug, 'vrodos_game_type');
        $tax_id = $tax->term_id;
        $project_taxonomies_arch = array(
            'vrodos_game_type' => array(
                $tax_id,
            )
        );

        $project_information_arch = array(
            'post_title' => $post_title,
            'post_name' => $post_name,
            'post_content' => '',
            'post_type' => 'vrodos_game',
            'post_status' => 'publish',
            'tax_input' => $project_taxonomies_arch,
            'post_author'   => $userID,
        );

        $post_id = wp_insert_post($project_information_arch);
        $post = get_post($post_id);

        wp_insert_term($post->post_title,'vrodos_asset3d_pgame',array(
                'description'=> '-',
                'slug' => $post->post_name,
            )
        );
    }

    // Generate Taxonomy (for scenes & assets) with Project's slug/name
    // Create Default Scenes for this "Project"
    public function on_create_project($new_status, $old_status, $post) {
        // Dont run this if from front-end
        if (!isset($_POST['vrodos_game_type'])) {
            return;
        }

        $post_type = get_post_type($post);

        if ($post_type == 'vrodos_game' && $new_status == 'publish' && $old_status != 'publish') {
            $projectSlug = $post->post_name;
            $projectTitle = empty($post->post_title) ? 'project-' . $projectSlug : $post->post_title;

            $project_type_id = $_POST['vrodos_game_type'];
            $project_type = get_term($project_type_id, 'vrodos_game_type');

            // If project is not a joker one
            if (!str_contains($projectSlug, '-joker')) {
                // Create a parent game tax category for the scenes
                wp_insert_term($projectTitle, 'vrodos_scene_pgame', array(
                    'description' => '-',
                    'slug' => $projectSlug,
                ));

                // Create a parent game tax category for the assets
                wp_insert_term($projectTitle, 'vrodos_asset3d_pgame', array(
                    'description' => '-',
                    'slug' => $projectSlug,
                ));

                // Link project to game type
                wp_set_object_terms($post->ID, intval($project_type_id), 'vrodos_game_type');

                // Create Default Scenes for this "Project"
                VRodos_Default_Scene_Manager::create_default_scenes_for_game($projectSlug, $project_type_id);
            } else {
                $projectTitle = $post->post_title;
                // Create a parent game tax category for the assets
                wp_insert_term($projectTitle, 'vrodos_asset3d_pgame', array(
                    'description' => '-',
                    'slug' => $projectSlug
                ));
            }
        }
    }

    //Create Game Category Box @ Game's backend
    public function games_taxcategory_box() {
        // Removes the default metabox at side
        remove_meta_box('vrodos_game_typediv', 'vrodos_game', 'side');
        // Adds the custom metabox with select box
        add_meta_box('tagsdiv-vrodos_game_type', 'Project Type', array($this, 'projects_taxtype_box_content'), 'vrodos_game', 'side', 'high');
    }


    public function projects_taxtype_box_content($post) {
        $tax_name = 'vrodos_game_type'; ?>
        <div class="tagsdiv" id="<?php echo $tax_name; ?>">
            <p class="howto"><?php echo 'Select type for current project' ?></p>
            <?php
            // Use nonce for verification
            wp_nonce_field(plugin_basename(__FILE__), 'vrodos_game_type_noncename');
            $type_ids = wp_get_object_terms($post->ID, 'vrodos_game_type', array('fields' => 'ids'));
            $selected_type = empty($type_ids) ? '' : $type_ids[0];
            $args = array(
                'show_option_none' => 'Select Type',
                'orderby' => 'name',
                'hide_empty' => 0,
                'selected' => $selected_type,
                'name' => 'vrodos_game_type',
                'taxonomy' => 'vrodos_game_type',
                'echo' => 0,
                'option_none_value' => '-1',
                'id' => 'vrodos-select-type-dropdown'
            );
            $select = wp_dropdown_categories($args);
            $replace = "<select$1 required>";
            $select = preg_replace('#<select([^>]*)>#', $replace, $select);
            $old_option = "<option value='-1'>";
            $new_option = "<option disabled selected value=''>" . 'Select type' . "</option>";
            $select = str_replace($old_option, $new_option, $select);
            echo $select;
            ?>
        </div>
        <?php
    }

    public function games_taxtype_box_content_save($post_id) {
        // Verify if this is an auto save routine.
        if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || wp_is_post_revision($post_id))
            return;

        if (!isset($_POST['vrodos_game_type_noncename']))
            return;

        // verify this came from the our screen and with proper authorization
        if (!wp_verify_nonce($_POST['vrodos_game_type_noncename'], plugin_basename(__FILE__)))
            return;

        // Check permissions
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        $type_ID = intval($_POST['vrodos_game_type'], 10);
        $type = ($type_ID > 0) ? get_term($type_ID, 'vrodos_game_type')->slug : NULL;
        wp_set_object_terms($post_id, $type, 'vrodos_game_type');
    }

    public function set_custom_vrodos_game_columns($columns) {
        $columns['game_slug'] = 'Project Slug';
        return $columns;
    }

    public function set_custom_vrodos_game_columns_fill($column, $post_id) {
        switch ($column) {
            case 'game_slug' :
                $mypost = get_post($post_id);
                $theSlug = $mypost->post_name;
                if (is_string($theSlug))
                    echo $theSlug;
                else
                    echo 'no slug found';
                break;
        }
    }

    //Add and Show the metabox with Custom Field for Game and the Compiler Box
    public function games_databox_add() {
        add_meta_box('vrodos-games-compiler-box', 'Game Compiler', array($this, 'games_compilerbox_show'), 'vrodos_game', 'side', 'low');
    }

    public function games_compilerbox_show() {
        global $post;
        $DS = DIRECTORY_SEPARATOR;

        wp_enqueue_script('vrodos_request_compile');
        $slug = $post->post_name;

        $isAdmin = is_admin() ? 'back' : 'front';
        echo '<script>let isAdmin="'.$isAdmin.'";</script>';

        wp_localize_script('vrodos_request_compile', 'my_ajax_object_compile',
            array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'projectId' => $post->ID,
                'slug' => $slug,
                'sceneId' => vrodos_get_project_scene_id($post->ID)
            )
        );

        wp_localize_script('vrodos_request_compile', 'phpvarsA',
            array('pluginsUrl' => plugins_url(),
                'PHP_OS' => PHP_OS,
                'game_dirpath' => realpath(dirname(__FILE__) . '/..') . $DS . 'games_assemble' . $DS . $slug,
                'game_urlpath' => plugins_url('vrodos') . '/games_assemble/' . $slug
            ));

        wp_enqueue_script('vrodos_assemble_request');
        wp_localize_script('vrodos_assemble_request', 'phpvarsB',
            array('pluginsUrl' => plugins_url(),
                'PHP_OS' => PHP_OS,
                'source' => realpath(dirname(__FILE__) . '/../../..') . $DS . 'uploads' . $DS . $slug,
                'target' => realpath(dirname(__FILE__) . '/..') . $DS . 'games_assemble' . $DS . $slug,
                'game_libraries_path' => realpath(dirname(__FILE__) . '/..') . $DS . 'unity_game_libraries',
                'game_id' => $post->ID
            ));

        $project_type_terms = wp_get_object_terms($post->ID, 'vrodos_game_type');
        $project_type_slug = !empty($project_type_terms) ? $project_type_terms[0]->slug : '';
        ?>

        <input id="platformInput" type="hidden" value="Aframe">
        <input id="project-type" type="hidden" value="<?php echo esc_attr($project_type_slug); ?>">

        <div id="constantUpdateUser" class="mdc-typography--caption mdc-theme--text-primary-on-background">
            <i title="Instructions" class="material-icons AlignIconToBottom">help</i>
            Click on "Compile" in order to construct the virtual world.
        </div>

        <h2 id="compileProgressTitle" style="display: none" class="CenterContents mdc-typography--headline"></h2>

        <div class="progressSlider" id="compileProgressDeterminate" style="display: none;">
            <div class="progressSliderLine"></div>
            <div class="progressSliderSubLineDeterminate" id="progressSliderSubLineDeterminateValue"></div>
        </div>

        <div class="progressSlider" id="compileProgressSlider" style="display: none;">
            <div class="progressSliderLine"></div>
            <div class="progressSliderSubLine progressIncrease"></div>
            <div class="progressSliderSubLine progressDecrease"></div>
        </div>

        <div id="compilationProgressText" class="mdc-typography--title"></div>
        <hr class="WhiteSpaceSeparator" style="margin-top: 0;" tabIndex="0">
        <a id="vrodos_compileButton" type="button" class="mdc-button mdc-button--primary mdc-dialog__footer__button mdc-button--raised" onclick="vrodos_compileAjax()">Compile</a>
        <hr class="separator" >
        <div id="previewApp" class="previewApp" style="display:inline-block"></div>
        <div id="appResultDiv" style="margin-top:20px;display:none">
            <a class="mdc-typography--title" href="" id="vrodos-weblink" style="margin-left:30px" target="_blank">Web link</a>
            <button title="Copy link to clipboard" id="buttonCopyWebLink" style="background: transparent; border: none; color: darkslateblue" >
                <i class="material-icons" style="cursor: pointer; float: right;">content_copy</i>
            </button>
            <a id="openWebLinkhref" href="#" title="Open index.html in new window" target="_blank" style="color:darkslateblue" onclick="jQuery('#compileCancelBtn')[0].click();">Open experience link</a>
        </div>
        <a id="compileCancelBtn" class="mdc-button mdc-dialog__footer__button--cancel mdc-dialog__footer__button" style="display:none;">Close</a>
        <div id="vrodos_compile_report1"></div>
        <div id="vrodos_compile_report2"></div>
        <div id="vrodos_zipgame_report"></div>
        <br /><br />Analytic report of compile:<br />
        <div id="vrodos_compile_game_stdoutlog_report" style="font-size: x-small"></div>
        <?php
    }

    public static function prepare_compile_dialogue_data() {
        // This function prepares data needed by the vrodos-edit-3D-scene-CompileDialogue.php template.

        $project_id = isset($_GET['vrodos_game']) ? sanitize_text_field(intval($_GET['vrodos_game'])) : null;

        if (!$project_id) { return array(); }

        $project_post = get_post($project_id);
        if (!$project_post) { return array(); }

        $projectSlug = $project_post->post_name;

        // Get project type slug
        $project_type_slug = '';
        $project_type_terms = wp_get_object_terms($project_id, 'vrodos_game_type');
        if ($project_type_terms && !is_wp_error($project_type_terms)) {
            $project_type_slug = $project_type_terms[0]->slug;
        }

        // Get project type string name (e.g., "Archaeology")
        $project_type_obj = VRodos_Core_Manager::vrodos_return_project_type($project_id);
        $project_type_string = $project_type_obj ? $project_type_obj->string : null;

        // Determine the 'singular' name for the project type for UI text (e.g., "tour" or "project")
        if ($project_type_string === 'Archaeology') {
            $single_lowercase = "tour";
        } else {
            $single_lowercase = "project";
        }

        return array(
            'project_id'       => $project_id,
            'projectSlug'      => $projectSlug,
            'project_type'     => $project_type_string, // Keep original variable name for the string
            'project_type_slug'=> $project_type_slug,
            'single_lowercase' => $single_lowercase,
        );
    }
}

function vrodos_get_project_scene_id($project_id) {
    $scenes = get_posts(array(
        'post_type' => 'vrodos_scene',
        'posts_per_page' => 1,
        'tax_query' => array(
            array(
                'taxonomy' => 'vrodos_scene_pgame',
                'field' => 'slug',
                'terms' => get_post($project_id)->post_name,
            ),
        ),
    ));

    if (!empty($scenes)) {
        return $scenes[0]->ID;
    }

    return null;
}
