<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VRodos_Compiler_Scene_Repository {
	public function load_compile_context( int $project_id, array $scene_id_list, int $selected_scene_id = 0 ): array {
		$project_post = get_post( $project_id );
		if ( ! ( $project_post instanceof WP_Post ) || 'vrodos_game' !== $project_post->post_type ) {
			error_log( '[VRodos] compile_aframe() aborted: invalid project #' . $project_id );
			return [ 'error' => 'Invalid project.' ];
		}
		$project_slug = (string) $project_post->post_name;
		if ( '' === $project_slug ) {
			return [ 'error' => 'Project has no scene taxonomy slug.' ];
		}

		$scene_json      = [];
		$scene_title     = [];
		$valid_scene_ids = [];

		foreach ( $scene_id_list as $scene_id ) {
			$scene_id = (int) $scene_id;
			if ( $scene_id <= 0 ) {
				continue;
			}

			$scene_post = get_post( $scene_id );
			if ( ! ( $scene_post instanceof WP_Post ) || 'vrodos_scene' !== $scene_post->post_type ) {
				error_log( '[VRodos] compile_aframe() rejected invalid scene #' . $scene_id . ' for project #' . $project_id );
				return [ 'error' => 'Invalid scene in compile request.' ];
			}

			if ( ! $this->scene_belongs_to_project( $scene_id, $project_slug ) ) {
				error_log( '[VRodos] compile_aframe() rejected scene/project mismatch for scene #' . $scene_id . ' and project #' . $project_id );
				return [ 'error' => 'A requested scene does not belong to this project.' ];
			}

			$decoded_scene = json_decode( (string) $scene_post->post_content );
			if ( ! is_object( $decoded_scene ) ) {
				error_log( '[VRodos] compile_aframe() skipped scene #' . $scene_id . ' due to invalid JSON content.' );
				continue;
			}

			$valid_scene_ids[] = $scene_id;
			$scene_title[]     = $scene_post->post_title;
			$scene_json[]      = $decoded_scene;
		}

		if ( empty( $valid_scene_ids ) ) {
			error_log( '[VRodos] compile_aframe() aborted: no valid scenes for project #' . $project_id );
			return [ 'error' => 'No valid scenes to compile.' ];
		}
		if ( $selected_scene_id > 0 && ! in_array( $selected_scene_id, $valid_scene_ids, true ) ) {
			return [ 'error' => 'Selected scene does not belong to this compile request.' ];
		}

		$project_type_slug = $this->get_project_type_slug( $project_id );

		return [
			'project_post'      => $project_post,
			'project_title'     => $project_post->post_title,
			'project_type_slug' => $project_type_slug,
			'is_vrexpo'         => ( 'vrexpo_games' === $project_type_slug ),
			'first_scene_id'    => (int) reset( $valid_scene_ids ),
			'last_scene_id'     => (int) end( $valid_scene_ids ),
			'first_scene_json'  => reset( $scene_json ),
			'valid_scene_ids'   => $valid_scene_ids,
			'scene_title'       => $scene_title,
			'scene_json'        => $scene_json,
		];
	}

	public function scene_belongs_to_project( int $scene_id, string $project_slug ): bool {
		$terms = wp_get_post_terms( $scene_id, 'vrodos_scene_pgame' );
		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return false;
		}

		foreach ( $terms as $term ) {
			if ( isset( $term->slug ) && (string) $term->slug === $project_slug ) {
				return true;
			}
		}

		return false;
	}

	public function is_immerse_project( int $project_id ): bool {
		return $project_id > 0 && get_post_meta( $project_id, '_immerse_source', true ) === 'immerse';
	}

	public function get_project_type_slug( int $project_id ): string {
		$project_type_terms = wp_get_post_terms( $project_id, 'vrodos_game_type' );
		if ( ! empty( $project_type_terms ) && ! is_wp_error( $project_type_terms ) && ! empty( $project_type_terms[0]->slug ) ) {
			return (string) $project_type_terms[0]->slug;
		}

		if ( $this->is_immerse_project( $project_id ) ) {
			return 'vrexpo_games';
		}

		return '';
	}
}
