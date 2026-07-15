<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Immutable input shared by compile-time entity family renderers. */
final readonly class VRodos_Compiler_Entity_Render_Context {
	public function __construct(
		public DOMDocument $dom,
		public DOMElement $scene,
		public DOMElement $assets,
		public object $entity,
		public string $category,
		public string $family,
		public array $config
	) {}
}

interface VRodos_Compiler_Entity_Family_Renderer {
	public function supports( string $family ): bool;

	public function render( VRodos_Compiler_Entity_Render_Context $context ): void;
}

/** Model, light, and editor-pawn families share transform/model decorators. */
final readonly class VRodos_Compiler_Model_Light_Pawn_Renderer implements VRodos_Compiler_Entity_Family_Renderer {
	/** @param array<string, callable> $handlers */
	public function __construct( private array $handlers ) {}

	public function supports( string $family ): bool {
		return isset( $this->handlers[ $family ] );
	}

	public function render( VRodos_Compiler_Entity_Render_Context $context ): void {
		call_user_func( $this->handlers[ $context->family ], $context );
	}
}

/** Audio, flat media, text, and image/text POI families share media policy. */
final readonly class VRodos_Compiler_Media_Audio_Text_POI_Renderer implements VRodos_Compiler_Entity_Family_Renderer {
	/** @param array<string, callable> $handlers */
	public function __construct( private array $handlers ) {}

	public function supports( string $family ): bool {
		return isset( $this->handlers[ $family ] );
	}

	public function render( VRodos_Compiler_Entity_Render_Context $context ): void {
		call_user_func( $this->handlers[ $context->family ], $context );
	}
}

/** Assessment rendering stays isolated because it is project-policy gated. */
final readonly class VRodos_Compiler_Assessment_Renderer implements VRodos_Compiler_Entity_Family_Renderer {
	public function __construct( private Closure $handler ) {}

	public function supports( string $family ): bool {
		return 'assessment' === $family;
	}

	public function render( VRodos_Compiler_Entity_Render_Context $context ): void {
		call_user_func( $this->handler, $context );
	}
}

final readonly class VRodos_Compiler_Entity_Dispatcher {
	/** @param VRodos_Compiler_Entity_Family_Renderer[] $renderers */
	public function __construct( private array $renderers ) {}

	public function dispatch( VRodos_Compiler_Entity_Render_Context $context ): bool {
		foreach ( $this->renderers as $renderer ) {
			if ( $renderer->supports( $context->family ) ) {
				$renderer->render( $context );
				return true;
			}
		}

		return false;
	}
}
