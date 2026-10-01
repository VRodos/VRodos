<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-runtime-settings-contract.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-feature-flags.php';
require_once __DIR__ . '/class-vrodos-compiler-build-state.php';
require_once __DIR__ . '/class-vrodos-compiler-asset-policy.php';

final readonly class VRodos_Compile_Request {
	public int $project_id;
	public int $selected_scene_id;
	/** @var int[] */
	public array $scene_ids;
	public string $runtime_mode;
	public string $build_target;
	public bool $show_pawn_positions;
	public string $build_id;
	public string $vr_headset_asset_quality;

	public function __construct( int $project_id, int $selected_scene_id, array $scene_ids, string $runtime_mode, string $build_target, bool $show_pawn_positions, string $build_id = '', string $vr_headset_asset_quality = 'low' ) {
		$this->project_id          = max( 0, $project_id );
		$this->selected_scene_id   = max( 0, $selected_scene_id );
		$this->scene_ids           = array_values( array_unique( array_filter( array_map( 'intval', $scene_ids ), static fn ( int $scene_id ): bool => $scene_id > 0 ) ) );
		$this->runtime_mode        = VRodos_Compiler_Runtime_Feature_Flags::normalize_runtime_mode_value( $runtime_mode );
		if ( ! in_array( $build_target, VRodos_Runtime_Settings_Contract::setting( 'buildTarget' )['allowed'], true ) ) {
			throw new InvalidArgumentException( '[VRodos] Invalid build target.' );
		}
		$this->build_target = $build_target;
		$this->show_pawn_positions = $show_pawn_positions;
		$this->build_id            = VRodos_Compiler_Build_State::normalize_build_id( $build_id );
		$this->vr_headset_asset_quality = VRodos_Compiler_Asset_Policy::validate_headset_quality( $vr_headset_asset_quality );
	}

	public function show_pawn_positions_attr(): string {
		return $this->show_pawn_positions ? 'true' : 'false';
	}

	public function runtime_profiles(): array {
		return 'automatic' === $this->build_target ? [ 'desktop', 'headset', 'pc-rendered-vr' ] : [ $this->build_target ];
	}
}

final readonly class VRodos_Compile_Artifact {
	public string $filename;
	public string $content;
	public string $kind;
	public int $scene_id;

	public function __construct( string $filename, string $content, string $kind = 'html', int $scene_id = 0 ) {
		$filename = trim( str_replace( '\\', '/', $filename ) );
		if ( '' === $filename || basename( $filename ) !== $filename ) {
			throw new InvalidArgumentException( '[VRodos] Compile artifact filename must be a basename.' );
		}
		$this->filename = $filename;
		$this->content  = $content;
		$this->kind     = $kind;
		$this->scene_id = max( 0, $scene_id );
	}

	public function summary(): array {
		return [ 'filename' => $this->filename, 'kind' => $this->kind, 'sceneId' => $this->scene_id, 'bytes' => strlen( $this->content ) ];
	}
}

final readonly class VRodos_Compile_Result {
	public array $links;
	/** @var VRodos_Compile_Artifact[] */
	public array $artifacts;
	/** @var string[] */
	public array $warnings;
	public ?bool $network_runtime_ready;

	public function __construct( array $links, array $artifacts = [], array $warnings = [], ?bool $network_runtime_ready = null ) {
		$this->links                 = $links;
		$this->artifacts             = $artifacts;
		$this->warnings              = array_values( array_unique( array_filter( array_map( 'strval', $warnings ) ) ) );
		$this->network_runtime_ready = $network_runtime_ready;
	}

	public function to_public_payload(): array {
		return $this->links + [
			'artifacts'           => array_map( static fn ( VRodos_Compile_Artifact $artifact ): array => $artifact->summary(), $this->artifacts ),
			'warnings'            => $this->warnings,
			'networkRuntimeReady' => $this->network_runtime_ready,
		];
	}
}

final readonly class VRodos_Runtime_Target_Plan {
	public const MASTER = 'master';
	public const SIMPLE = 'simple';
	public const INDEX  = 'index';
	public const ROLES  = 'roles';

	public static function master_filename( int $scene_id, string $profile, bool $automatic ): string {
		$suffix = $automatic && 'desktop' !== $profile ? '_' . $profile : '';
		return 'Master_Client_' . $scene_id . $suffix . '.html';
	}

	public array $capabilities;
	public array $chunk_ids;

	public function __construct(
		public string $kind,
		public string $template,
		public string $filename,
		public VRodos_Scene_Compile_Plan $scene,
		public string $runtime_mode,
		array $capabilities,
		array $chunk_ids
	) {
		if ( ! in_array( $kind, [ self::MASTER, self::SIMPLE, self::INDEX, self::ROLES ], true ) ) {
			throw new InvalidArgumentException( '[VRodos] Unknown runtime target kind: ' . $kind );
		}
		if ( basename( $filename ) !== $filename ) {
			throw new InvalidArgumentException( '[VRodos] Runtime target filename must be a basename.' );
		}
		$this->capabilities = array_values( array_unique( array_map( 'strval', $capabilities ) ) );
		$this->chunk_ids    = array_values( array_unique( array_map( 'strval', $chunk_ids ) ) );
	}
}

final readonly class VRodos_Scene_Compile_Plan {
	public array $capabilities;
	public array $chunk_ids;
	public array $diagnostics;
	public array $desktop_profiles;

	public function __construct(
		public int $scene_id,
		public string $title,
		public object $scene_json,
		public array $settings,
		array $capabilities,
		array $chunk_ids,
		array $diagnostics,
		public bool $hover_enabled,
		array $desktop_profiles = [],
		public array $runtime_context = []
	) {
		$this->capabilities = array_values( array_unique( $capabilities ) );
		$this->chunk_ids    = array_values( array_unique( $chunk_ids ) );
		$this->diagnostics  = array_values( array_unique( $diagnostics ) );
		$this->desktop_profiles = $desktop_profiles;
	}
}

final readonly class VRodos_Project_Compile_Plan {
	public array $scenes;
	/** @var VRodos_Runtime_Target_Plan[] */
	public array $targets;
	public int $first_scene_id;
	public int $last_scene_id;

	public function __construct(
		public VRodos_Compile_Request $request,
		public string $project_title,
		public string $project_type_slug,
		array $scenes,
		array $targets
	) {
		if ( ! $scenes ) {
			throw new InvalidArgumentException( '[VRodos] A project compile plan requires at least one scene.' );
		}
		$this->scenes         = array_values( $scenes );
		$this->targets        = array_values( $targets );
		if ( ! $this->targets ) {
			throw new InvalidArgumentException( '[VRodos] A project compile plan requires at least one runtime target.' );
		}
		$this->first_scene_id = $this->scenes[0]->scene_id;
		$this->last_scene_id  = $this->scenes[ count( $this->scenes ) - 1 ]->scene_id;
	}

	public function is_vrexpo(): bool {
		return 'vrexpo_games' === $this->project_type_slug;
	}

	public function is_networked(): bool {
		return VRodos_Compiler_Runtime_Feature_Flags::RUNTIME_MODE_NETWORKED === $this->request->runtime_mode;
	}

	/** @return int[] */
	public function scene_ids(): array {
		return array_values( array_unique( array_map( static fn ( VRodos_Scene_Compile_Plan $scene ): int => $scene->scene_id, $this->scenes ) ) );
	}

	public function target( string $kind, int $scene_id, ?string $profile = null ): ?VRodos_Runtime_Target_Plan {
		foreach ( $this->targets as $target ) {
			if ( $target->kind === $kind && $target->scene->scene_id === $scene_id && ( null === $profile || $target->scene->settings['vrRuntimeProfile'] === $profile ) ) {
				return $target;
			}
		}
		return null;
	}

	public function master_filenames( int $scene_id ): array {
		$files = [];
		foreach ( $this->request->runtime_profiles() as $profile ) {
			$target = $this->target( VRodos_Runtime_Target_Plan::MASTER, $scene_id, $profile );
			if ( ! $target ) {
				throw new RuntimeException( '[VRodos] Missing client variant for scene #' . $scene_id );
			}
			$files[ $profile ] = $target->filename;
		}
		return $files;
	}
}
