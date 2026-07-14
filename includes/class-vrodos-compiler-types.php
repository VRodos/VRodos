<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-vrodos-runtime-settings-contract.php';
require_once __DIR__ . '/class-vrodos-compiler-runtime-feature-flags.php';

final readonly class VRodos_Compile_Request {
	public int $project_id;
	public int $selected_scene_id;
	/** @var int[] */
	public array $scene_ids;
	public string $runtime_mode;
	public string $vr_runtime_profile;
	public bool $show_pawn_positions;

	public function __construct( int $project_id, int $selected_scene_id, array $scene_ids, string $runtime_mode, string $vr_runtime_profile, bool $show_pawn_positions ) {
		$this->project_id          = max( 0, $project_id );
		$this->selected_scene_id   = max( 0, $selected_scene_id );
		$this->scene_ids           = array_values( array_unique( array_filter( array_map( 'intval', $scene_ids ), static fn ( int $scene_id ): bool => $scene_id > 0 ) ) );
		$this->runtime_mode        = VRodos_Compiler_Runtime_Feature_Flags::normalize_runtime_mode_value( $runtime_mode );
		$this->vr_runtime_profile  = (string) VRodos_Runtime_Settings_Contract::normalize( 'vrRuntimeProfile', $vr_runtime_profile, 'desktop' );
		$this->show_pawn_positions = $show_pawn_positions;
	}

	public function show_pawn_positions_attr(): string {
		return $this->show_pawn_positions ? 'true' : 'false';
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

	public function to_legacy_payload(): array {
		$payload = $this->links;
		if ( $this->warnings ) $payload['Warnings'] = $this->warnings;
		if ( null !== $this->network_runtime_ready ) $payload['NetworkRuntimeReady'] = $this->network_runtime_ready;
		return $payload;
	}

	public function to_public_payload(): array {
		return $this->links + [
			'artifacts'           => array_map( static fn ( VRodos_Compile_Artifact $artifact ): array => $artifact->summary(), $this->artifacts ),
			'warnings'            => $this->warnings,
			'networkRuntimeReady' => $this->network_runtime_ready,
		];
	}
}

final readonly class VRodos_Scene_Compile_Plan {
	public array $capabilities;
	public array $chunk_ids;
	public array $diagnostics;

	public function __construct(
		public int $scene_id,
		public string $title,
		public object $scene_json,
		public array $settings,
		array $capabilities,
		array $chunk_ids,
		array $diagnostics,
		public bool $hover_enabled
	) {
		$this->capabilities = array_values( array_unique( $capabilities ) );
		$this->chunk_ids    = array_values( array_unique( $chunk_ids ) );
		$this->diagnostics  = array_values( array_unique( $diagnostics ) );
	}
}

final readonly class VRodos_Project_Compile_Plan {
	public array $scenes;
	public int $first_scene_id;
	public int $last_scene_id;

	public function __construct(
		public VRodos_Compile_Request $request,
		public string $project_title,
		public string $project_type_slug,
		array $scenes
	) {
		if ( ! $scenes ) {
			throw new InvalidArgumentException( '[VRodos] A project compile plan requires at least one scene.' );
		}
		$this->scenes         = array_values( $scenes );
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
		return array_map( static fn ( VRodos_Scene_Compile_Plan $scene ): int => $scene->scene_id, $this->scenes );
	}
}
